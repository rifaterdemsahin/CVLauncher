const axios = require('axios');
const { google } = require('googleapis');
const readline = require('readline');

/**
 * Gmail Query Builder & Tester
 * 
 * Usage:
 *   node gmail-query-builder.js --test-query "to:info@pexabo.com -label:replied_by_bot newer_than:1d"
 *   node gmail-query-builder.js --interactive
 *   node gmail-query-builder.js --show-labels
 * 
 * Requires:
 *   - GOOGLE_CLIENT_ID
 *   - GOOGLE_CLIENT_SECRET
 *   - GOOGLE_REFRESH_TOKEN (or will guide you to get one)
 */

// Secrets are injected by Doppler at runtime
// Run with: doppler run -- node scripts/gmail-query-builder.js

const CLIENT_ID = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'http://localhost:3000/oauth2callback'
);

if (REFRESH_TOKEN) {
  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
}

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

async function getAuthUrl() {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.modify'],
    prompt: 'consent'
  });
  console.log('\nAuthorize this app by visiting this URL:\n', url);
  
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise(resolve => rl.question('\nEnter the code from that page here: ', resolve));
  rl.close();
  
  const { tokens } = await oauth2Client.getToken(code);
  console.log('\n--- SAVE THESE TOKENS IN DOPPLER ---');
  console.log('Refresh Token:', tokens.refresh_token);
  console.log('Access Token:', tokens.access_token);
  console.log('-------------------------------------\n');
  oauth2Client.setCredentials(tokens);
}

async function listLabels() {
  const res = await gmail.users.labels.list({ userId: 'me' });
  console.log('\nAvailable Labels:');
  console.log('=================');
  res.data.labels.forEach(label => {
    console.log(`${label.id} | ${label.name}`);
  });
}

async function testQuery(query, maxResults = 10) {
  console.log(`\nTesting query: "${query}"`);
  console.log('='.repeat(60));
  
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: maxResults
  });
  
  if (!res.data.messages || res.data.messages.length === 0) {
    console.log('No emails found matching this query.');
    return;
  }
  
  console.log(`Found ${res.data.resultSizeEstimate} emails:\n`);
  
  for (let i = 0; i < Math.min(res.data.messages.length, 5); i++) {
    const msg = await gmail.users.messages.get({
      userId: 'me',
      id: res.data.messages[i].id,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date']
    });
    
    const headers = msg.data.payload.headers;
    const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
    const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)';
    const date = headers.find(h => h.name === 'Date')?.value || 'Unknown';
    
    console.log(`[${i + 1}] ${date}`);
    console.log(`    From: ${from}`);
    console.log(`    Subject: ${subject}`);
    console.log(`    ID: ${msg.data.id}`);
    console.log();
  }
  
  if (res.data.messages.length > 5) {
    console.log(`... and ${res.data.messages.length - 5} more emails`);
  }
}

async function interactiveMode() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  
  console.log('\n=== Gmail Query Builder (Interactive) ===\n');
  console.log('Build your query with these components:\n');
  
  const components = {
    to: 'to:info@pexabo.com',
    fromNotMe: '-from:me',
    notSent: '-in:sent',
    notReplied: '-label:replied_by_bot',
    unread: 'is:unread',
    recent: 'newer_than:7d',
    noSpam: '-in:spam',
    hasAttachment: 'has:attachment'
  };
  
  const selected = [];
  
  for (const [key, value] of Object.entries(components)) {
    const answer = await new Promise(resolve => 
      rl.question(`Include [${key}]? (${value}) [y/n]: `, resolve)
    );
    if (answer.toLowerCase() === 'y') {
      selected.push(value);
    }
  }
  
  const custom = await new Promise(resolve => 
    rl.question('\nAdd custom query text (or press Enter): ', resolve)
  );
  if (custom.trim()) selected.push(custom.trim());
  
  const query = selected.join(' ');
  console.log(`\nYour query: ${query}`);
  
  const test = await new Promise(resolve => 
    rl.question('\nTest this query now? [y/n]: ', resolve)
  );
  
  if (test.toLowerCase() === 'y') {
    await testQuery(query, 10);
  }
  
  console.log(`\n--- USE THIS QUERY IN N8N ---`);
  console.log(query);
  console.log('-------------------------------\n');
  
  rl.close();
}

async function main() {
  const args = process.argv.slice(2);
  
  if (!REFRESH_TOKEN && !args.includes('--show-labels')) {
    console.log('No refresh token found. Starting OAuth flow...');
    await getAuthUrl();
  }
  
  if (args.includes('--show-labels')) {
    await listLabels();
  } else if (args.includes('--test-query')) {
    const idx = args.indexOf('--test-query');
    const query = args[idx + 1];
    if (!query) {
      console.error('Usage: --test-query "your query here"');
      process.exit(1);
    }
    await testQuery(query);
  } else if (args.includes('--interactive')) {
    await interactiveMode();
  } else {
    console.log(`
Gmail Query Builder & Tester
============================

Usage (run with Doppler for secrets):
  doppler run -- node scripts/gmail-query-builder.js --interactive
  doppler run -- node scripts/gmail-query-builder.js --test-query "..."
  doppler run -- node scripts/gmail-query-builder.js --show-labels

Prerequisites:
  1. Run: doppler setup --project pexabo-email-automation --config prd_main
  2. Ensure GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN are in Doppler

Recommended queries for info@pexabo.com:

1. Find lost emails (default):
   to:info@pexabo.com -from:me -in:sent -label:replied_by_bot newer_than:7d

2. Find unread only:
   to:info@pexabo.com -from:me is:unread -label:replied_by_bot newer_than:7d

3. Emergency: find everything recent:
   to:info@pexabo.com newer_than:1d

4. Check for spam false positives:
   to:info@pexabo.com in:spam newer_than:7d
`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
