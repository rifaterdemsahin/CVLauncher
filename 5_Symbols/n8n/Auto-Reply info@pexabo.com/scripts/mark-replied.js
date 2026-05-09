const { google } = require('googleapis');
const readline = require('readline');

/**
 * Bulk Mark Emails as Replied
 * 
 * Usage:
 *   node mark-replied.js --query "to:info@pexabo.com newer_than:1d" --dry-run
 *   node mark-replied.js --query "to:info@pexabo.com newer_than:1d" --execute
 *   node mark-replied.js --file email-ids.txt --execute
 * 
 * This script:
 *   1. Finds emails matching a query
 *   2. Adds the 'replied_by_bot' label
 *   3. Optionally archives them
 *   4. Logs what was done
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const CLIENT_ID = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, 'http://localhost:3000');
if (REFRESH_TOKEN) oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

// Label ID cache
let repliedLabelId = null;

async function getOrCreateLabel(name) {
  const res = await gmail.users.labels.list({ userId: 'me' });
  let label = res.data.labels.find(l => l.name === name);
  
  if (!label) {
    console.log(`Creating label: ${name}`);
    const createRes = await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: name,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show'
      }
    });
    label = createRes.data;
  }
  
  return label.id;
}

async function markEmails(query, dryRun = true, archive = true) {
  console.log(`\n${dryRun ? '[DRY RUN]' : '[EXECUTE]'} Processing query: "${query}"`);
  console.log('='.repeat(60));
  
  // Get label ID
  repliedLabelId = await getOrCreateLabel('replied_by_bot');
  console.log(`Using label ID: ${repliedLabelId}\n`);
  
  // Find emails
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 100
  });
  
  if (!res.data.messages || res.data.messages.length === 0) {
    console.log('No emails found.');
    return;
  }
  
  console.log(`Found ${res.data.messages.length} emails:\n`);
  
  for (const msg of res.data.messages) {
    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject']
    });
    
    const headers = detail.data.payload.headers;
    const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
    const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)';
    
    console.log(`  ${msg.id} | ${from} | ${subject}`);
    
    if (!dryRun) {
      // Add label
      await gmail.users.messages.modify({
        userId: 'me',
        id: msg.id,
        requestBody: {
          addLabelIds: [repliedLabelId],
          removeLabelIds: archive ? ['INBOX'] : []
        }
      });
      console.log(`    -> Labeled ${archive ? '+ Archived' : ''}`);
    }
  }
  
  console.log(`\n${dryRun ? 'Dry run complete. No changes made.' : `Processed ${res.data.messages.length} emails.`}`);
}

async function markFromFile(filePath, dryRun = true, archive = true) {
  const fs = require('fs');
  const ids = fs.readFileSync(filePath, 'utf8').split('\n').filter(id => id.trim());
  
  console.log(`\n${dryRun ? '[DRY RUN]' : '[EXECUTE]'} Processing ${ids.length} IDs from file`);
  console.log('='.repeat(60));
  
  repliedLabelId = await getOrCreateLabel('replied_by_bot');
  
  for (const id of ids) {
    console.log(`  ${id}`);
    if (!dryRun) {
      await gmail.users.messages.modify({
        userId: 'me',
        id: id.trim(),
        requestBody: {
          addLabelIds: [repliedLabelId],
          removeLabelIds: archive ? ['INBOX'] : []
        }
      });
      console.log('    -> Labeled + Archived');
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (!REFRESH_TOKEN) {
    console.error('Error: GMAIL_REFRESH_TOKEN not set. Run gmail-query-builder.js first to get a token.');
    process.exit(1);
  }
  
  const dryRun = !args.includes('--execute');
  const archive = !args.includes('--no-archive');
  
  if (args.includes('--query')) {
    const idx = args.indexOf('--query');
    const query = args[idx + 1];
    if (!query) {
      console.error('Usage: --query "your query" [--execute] [--no-archive]');
      process.exit(1);
    }
    await markEmails(query, dryRun, archive);
  } else if (args.includes('--file')) {
    const idx = args.indexOf('--file');
    const file = args[idx + 1];
    if (!file) {
      console.error('Usage: --file email-ids.txt [--execute] [--no-archive]');
      process.exit(1);
    }
    await markFromFile(file, dryRun, archive);
  } else {
    console.log(`
Bulk Mark Emails as Replied
===========================

Usage:
  node mark-replied.js --query "to:info@pexabo.com newer_than:1d" --dry-run
  node mark-replied.js --query "to:info@pexabo.com newer_than:1d" --execute
  node mark-replied.js --file email-ids.txt --execute --no-archive

Options:
  --dry-run      Show what would happen without making changes (default)
  --execute      Actually apply labels and archive
  --no-archive   Only add label, keep in inbox

Examples:
  # Preview what would be marked
  node mark-replied.js --query "to:info@pexabo.com is:unread" --dry-run

  # Mark all unread emails as replied
  node mark-replied.js --query "to:info@pexabo.com is:unread" --execute
`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
