/**
 * Process Specific Email from Gmail URL
 * 
 * Usage:
 *   node process-specific-email.js "https://mail.google.com/mail/u/0/#.../MESSAGE_ID" --dry-run
 *   node process-specific-email.js "https://mail.google.com/mail/u/0/#.../MESSAGE_ID" --execute
 *   node process-specific-email.js "https://mail.google.com/mail/u/0/#.../MESSAGE_ID" --tactic partnership
 * 
 * What it does:
 *   1. Extracts message ID from Gmail URL
 *   2. Fetches full email via Gmail API
 *   3. Classifies intent using OpenAI
 *   4. Loads tactic from tactics-template.md
 *   5. Generates reply draft
 *   6. Shows you the draft for approval
 *   7. If approved (or --execute): sends reply, marks as replied, logs to sheet
 *   8. Generates MISSED EMAIL ANALYSIS → saves to investigations/
 * 
 * Why the analysis matters:
 *   Every time you manually catch a missed email, we document WHY the 6h batch
 *   flow missed it. This becomes a "fix prompt" you can apply to the workflow.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { google } = require('googleapis');
const OpenAI = require('openai');

// Secrets are injected by Doppler at runtime
// Run with: doppler run -- node scripts/process-specific-email.js

// --- CONFIG ---
const CLIENT_ID = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const N8N_HOST = (process.env.N8N_HOST || 'https://n8n.rifaterdemsahin.com').replace(/\/$/, '');
const N8N_API_KEY = process.env.N8N_API_KEY;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, 'http://localhost:3000');
if (REFRESH_TOKEN) oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

// --- HELPERS ---

function extractMessageIdFromUrl(url) {
  // Handle various Gmail URL formats
  // Format 1: .../FMfcgzQgLXvPSMbgJPdClnjRSNhdmBjr
  // Format 2: .../msg/a/MESSAGE_ID
  // Format 3: .../#search/.../MESSAGE_ID
  
  const patterns = [
    /\/([A-Za-z0-9]{10,})$/,
    /#.*\/([A-Za-z0-9]{10,})$/,
    /msg\/a\/([A-Za-z0-9]{10,})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  // Fallback: last path segment that looks like a Gmail message ID
  const segments = url.split('/');
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    if (seg && seg.length > 15 && /^[A-Za-z0-9]+$/.test(seg)) {
      return seg;
    }
  }
  
  throw new Error(`Could not extract message ID from URL: ${url}`);
}

async function fetchEmail(messageId) {
  const res = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full'
  });
  
  const msg = res.data;
  const payload = msg.payload || {};
  const headers = payload.headers || [];
  
  const from = headers.find(h => h.name === 'From')?.value || '';
  const to = headers.find(h => h.name === 'To')?.value || '';
  const subject = headers.find(h => h.name === 'Subject')?.value || '';
  const date = headers.find(h => h.name === 'Date')?.value || '';
  const messageIdHeader = headers.find(h => h.name === 'Message-ID')?.value || '';
  
  // Extract labels
  const labels = msg.labelIds || [];
  
  // Extract body
  let bodyText = '';
  let bodyHtml = '';
  
  function extractParts(parts) {
    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        bodyText = Buffer.from(part.body.data, 'base64').toString('utf8');
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf8');
      } else if (part.parts) {
        extractParts(part.parts);
      }
    }
  }
  
  if (payload.parts) {
    extractParts(payload.parts);
  } else if (payload.body?.data) {
    bodyText = Buffer.from(payload.body.data, 'base64').toString('utf8');
  }
  
  return {
    id: msg.id,
    threadId: msg.threadId,
    messageIdHeader,
    from,
    to,
    subject,
    date,
    snippet: msg.snippet || '',
    labels,
    bodyText: bodyText.substring(0, 6000),
    bodyHtml: bodyHtml.substring(0, 6000),
    historyId: msg.historyId,
    sizeEstimate: msg.sizeEstimate
  };
}

async function checkAlreadyReplied(threadId) {
  try {
    const res = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'metadata',
      metadataHeaders: ['From']
    });
    
    const messages = res.data.messages || [];
    const hasReplied = messages.some(msg => {
      const from = msg.payload?.headers?.find(h => h.name === 'From')?.value || '';
      return from.includes('info@pexabo.com') || from.includes('rifaterdemsahin');
    });
    
    return { hasReplied, threadMessageCount: messages.length };
  } catch (err) {
    console.warn('Could not check thread history:', err.message);
    return { hasReplied: false, threadMessageCount: 0 };
  }
}

async function classifyEmail(email) {
  const systemPrompt = `You are an email classifier for info@pexabo.com. Analyze this email and classify it.

Output JSON with this exact structure:
{
  "intent": "pricing_inquiry|partnership|support_request|job_application|recruiter_job_offer|general_inquiry|spam|other",
  "urgency": "high|medium|low",
  "needs_human": true|false,
  "suggested_tactic": "tactic_id",
  "confidence": 0.0-1.0,
  "why_missed_guess": "string explaining why the 6h batch flow might have missed this",
  "keywords_found": ["keyword1", "keyword2"]
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Subject: ${email.subject}\nFrom: ${email.from}\nLabels: ${email.labels.join(', ')}\nBody:\n${email.bodyText.substring(0, 3000)}` }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3
  });
  
  return JSON.parse(completion.choices[0].message.content);
}

function selectCV(email) {
  const text = (email.subject + ' ' + email.bodyText).toLowerCase();
  const cvMap = [
    { keywords: ['azure', 'microsoft', 'entra', 'm365'], cv: 'cv_azure_architect.pdf', techStack: 'Azure Cloud Architect' },
    { keywords: ['aws', 'amazon web services', 'ec2', 's3'], cv: 'cv_aws_architect.pdf', techStack: 'AWS Solutions Architect' },
    { keywords: ['kubernetes', 'k8s', 'docker', 'container'], cv: 'cv_kubernetes_engineer.pdf', techStack: 'Kubernetes & Container Engineer' },
    { keywords: ['devops', 'cicd', 'pipeline', 'jenkins'], cv: 'cv_devops_engineer.pdf', techStack: 'DevOps Engineer' },
    { keywords: ['security', 'soc', 'cyber', 'penetration'], cv: 'cv_security_engineer.pdf', techStack: 'Security Engineer' },
    { keywords: ['data', 'databricks', 'spark', 'data engineer'], cv: 'cv_data_engineer.pdf', techStack: 'Data Engineer' },
    { keywords: ['ai', 'machine learning', 'ml', 'generative ai'], cv: 'cv_ai_engineer.pdf', techStack: 'AI / ML Engineer' }
  ];
  
  let bestMatch = { cv: 'cv_ai_engineer.pdf', techStack: 'AI Engineer' };
  let maxScore = 0;
  
  for (const mapping of cvMap) {
    const score = mapping.keywords.reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0);
    if (score > maxScore) {
      maxScore = score;
      bestMatch = mapping;
    }
  }
  
  const downloadUrl = `https://raw.githubusercontent.com/rifaterdemsahin/CVLauncher/main/5_Symbols/cvs/${bestMatch.cv}`;
  return { ...bestMatch, downloadUrl };
}

async function callRecruiterGenerator(email, cvInfo, provider = 'gemini') {
  const url = process.env.RECRUITER_GENERATOR_URL || 'https://rifat-cvs-response-generator.fly.dev/recruiter';
  
  const payload = {
    recruiter_message: email.bodyText.substring(0, 4000),
    subject: email.subject,
    from: email.from,
    cv_source_url: cvInfo.downloadUrl,
    ai_provider: provider
  };
  
  const response = await axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000
  });
  
  return response.data;
}

async function multiModelFallback(email, cvInfo) {
  const providers = ['gemini', 'gpt4o', 'groq'];
  let lastError = null;
  
  for (const provider of providers) {
    try {
      console.log(`  Trying recruiter generator with ${provider}...`);
      const result = await callRecruiterGenerator(email, cvInfo, provider);
      if (result.generated_response) {
        return { ...result, model_used: provider, fallback_from: lastError?.provider || null };
      }
    } catch (err) {
      lastError = { provider, error: err.message };
      console.warn(`  ${provider} failed: ${err.message}`);
      continue;
    }
  }
  
  // All models failed — try local OpenAI as last resort
  try {
    console.log('  Trying local OpenAI fallback for recruiter email...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: `You are Rifat Erdem Sahin. Write a professional response to a recruiter email. Reference your experience in ${cvInfo.techStack}. Keep it under 200 words.` },
        { role: 'user', content: `Subject: ${email.subject}\nBody: ${email.bodyText.substring(0, 2000)}` }
      ],
      temperature: 0.7,
      max_tokens: 600
    });
    return {
      generated_response: completion.choices[0].message.content,
      confidence: 0.75,
      evidence: 'Fallback local OpenAI generation (recruiter generator failed)',
      model_used: 'gpt-4o-local-fallback'
    };
  } catch (err) {
    throw new Error(`All models failed for recruiter email. Last error: ${err.message}`);
  }
}

async function generateGeneralReply(email, classification) {
  const tacticsPath = path.resolve(__dirname, '..', 'tactics-template.md');
  let tacticsContent = '';
  if (fs.existsSync(tacticsPath)) {
    tacticsContent = fs.readFileSync(tacticsPath, 'utf8');
  }
  
  const tacticId = classification.suggested_tactic || 'general_inquiry';
  
  const systemPrompt = `You are the AI assistant for Pexabo (info@pexabo.com). 
Reply to emails using these tactics:
${tacticsContent}

SELECTED TACTIC: ${tacticId}

Rules:
- Be professional but warm
- Keep replies concise (max 3 paragraphs)
- Include signature automatically
- If unsure, ask a clarifying question rather than guess
- Today's date: ${new Date().toISOString().split('T')[0]}
`;

  // Primary: OpenAI GPT-4o
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Subject: ${email.subject}\nFrom: ${email.from}\nDate: ${email.date}\nBody:\n${email.bodyText.substring(0, 4000)}` }
      ],
      temperature: 0.7,
      max_tokens: 1200
    });
    return { reply: completion.choices[0].message.content, model_used: 'gpt-4o' };
  } catch (err) {
    console.warn('GPT-4o failed:', err.message);
  }
  
  // Fallback 1: Gemini
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const geminiRes = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${email.bodyText.substring(0, 3000)}` }] }]
        },
        { timeout: 10000 }
      );
      const text = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return { reply: text, model_used: 'gemini-1.5-flash' };
    }
  } catch (err) {
    console.warn('Gemini failed:', err.message);
  }
  
  // Fallback 2: Groq
  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      const groqRes = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: email.bodyText.substring(0, 3000) }
          ],
          temperature: 0.7,
          max_tokens: 1200
        },
        { headers: { Authorization: `Bearer ${groqKey}` }, timeout: 10000 }
      );
      const text = groqRes.data.choices?.[0]?.message?.content;
      if (text) return { reply: text, model_used: 'groq-llama-3.1-70b' };
    }
  } catch (err) {
    console.warn('Groq failed:', err.message);
  }
  
  throw new Error('All AI models failed for general reply generation');
}

async function draftReply(email, classification, tacticOverride = null) {
  const isRecruiter = (classification.intent === 'recruiter_job_offer') || (tacticOverride === 'recruiter_job_offer');
  
  if (isRecruiter) {
    console.log('Detected recruiter email. Using CV Response Generator...');
    const cvInfo = selectCV(email);
    console.log(`  Selected CV: ${cvInfo.cv} (${cvInfo.techStack})`);
    
    const result = await multiModelFallback(email, cvInfo);
    console.log(`  Generated via: ${result.model_used}${result.fallback_from ? ` (fallback from ${result.fallback_from})` : ''}`);
    
    // Format recruiter email with CV link
    const htmlBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #2c3e50; font-size: 16px;">
  <p>Hi,</p>
  <p>${result.generated_response}</p>
  <div style="margin: 25px 0; padding: 20px; background-color: #f8f9fa; border-left: 5px solid #007bff; border-radius: 4px;">
    <p style="margin: 0; font-size: 18px;">
      <strong>📄 <a href="${cvInfo.downloadUrl}" style="text-decoration: none; color: #007bff;">View CV — ${cvInfo.techStack} (PDF)</a></strong>
    </p>
    <p style="margin: 10px 0 0 0; font-size: 16px;">
      📅 <a href="https://calendly.com/rifaterdem/schedule" style="text-decoration: none; color: #2c3e50;"><strong>Book a clear intro call</strong></a>
    </p>
  </div>
  <p>Best regards,</p>
  <p><strong>Rifat Erdem Sahin</strong></p>
  <p style="font-size: 14px; color: #7f8c8d;">Director | DevOps & Cloud Architect | Pexabo<br>+44 7848 024173 | contact@rifaterdemsahin.com</p>
</div>`;
    
    return { reply: htmlBody, model_used: result.model_used, is_recruiter: true, cv_sent: cvInfo.cv };
  }
  
  // General email
  const result = await generateGeneralReply(email, classification);
  return { reply: result.reply, model_used: result.model_used, is_recruiter: false, cv_sent: null };
}

async function generateMissedAnalysis(email, classification) {
  const systemPrompt = `You are an email automation analyst. You need to generate a "fix prompt" explaining why an email was missed by the automated batch system and how to prevent it in the future.

The batch system uses this Gmail query:
  to:info@pexabo.com -from:me -in:sent -label:replied_by_bot newer_than:7d

Analyze the email metadata and suggest specific fixes. Output markdown.`;

  const userPrompt = `Email Details:
- Subject: ${email.subject}
- From: ${email.from}
- To: ${email.to}
- Labels at time of discovery: ${email.labels.join(', ')}
- Date: ${email.date}
- Snippet: ${email.snippet}
- Classification: ${JSON.stringify(classification, null, 2)}

Generate a missed email analysis with these sections:
1. Why it was missed (root cause)
2. Query gap analysis (what's wrong with the batch query)
3. Tactic gap analysis (did we lack a tactic for this type?)
4. Recommended fixes (specific, actionable)
5. Prevention checklist (what to add to the 6h flow)`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.4,
    max_tokens: 2000
  });
  
  return completion.choices[0].message.content;
}

async function sendReply(email, replyBody) {
  // Encode email for Gmail API
  const raw = makeRawMessage(email, replyBody);
  
  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: raw,
      threadId: email.threadId
    }
  });
}

function makeRawMessage(originalEmail, body) {
  const lines = [
    `To: ${originalEmail.from}`,
    `Subject: Re: ${originalEmail.subject}`,
    `In-Reply-To: ${originalEmail.messageIdHeader}`,
    `References: ${originalEmail.messageIdHeader}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body
  ];
  
  return Buffer.from(lines.join('\r\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function markAsReplied(messageId) {
  // Get or create label
  const labelsRes = await gmail.users.labels.list({ userId: 'me' });
  let label = labelsRes.data.labels.find(l => l.name === 'replied_by_bot');
  
  if (!label) {
    const createRes = await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: 'replied_by_bot',
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show'
      }
    });
    label = createRes.data;
  }
  
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: {
      addLabelIds: [label.id],
      removeLabelIds: ['UNREAD', 'INBOX'] // Mark read + archive
    }
  });
}

async function promptApproval(replyDraft) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('\n' + '='.repeat(60));
  console.log('PROPOSED REPLY:');
  console.log('='.repeat(60));
  console.log(replyDraft);
  console.log('='.repeat(60));
  
  const answer = await new Promise(resolve => 
    rl.question('\nSend this reply? [y/n/e(edit)/s(skip)]: ', resolve)
  );
  rl.close();
  
  if (answer.toLowerCase() === 'y') return { action: 'send', reply: replyDraft };
  if (answer.toLowerCase() === 's') return { action: 'skip' };
  if (answer.toLowerCase() === 'e') {
    const editRl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log('\nEnter your edited reply (end with CTRL+D or type END on new line):');
    const lines = [];
    for await (const line of editRl) {
      if (line.trim() === 'END') break;
      lines.push(line);
    }
    return { action: 'send', reply: lines.join('\n') };
  }
  
  return { action: 'skip' };
}

// --- MAIN ---

async function main() {
  const args = process.argv.slice(2);
  const url = args.find(a => a.startsWith('http'));
  const dryRun = !args.includes('--execute');
  const tacticOverride = (() => {
    const idx = args.indexOf('--tactic');
    return idx >= 0 ? args[idx + 1] : null;
  })();
  
  if (!url) {
    console.log(`
Process Specific Email from Gmail URL
======================================

Usage (run with Doppler for secrets):
  doppler run -- node scripts/process-specific-email.js "GMAIL_URL" --dry-run
  doppler run -- node scripts/process-specific-email.js "GMAIL_URL" --execute
  doppler run -- node scripts/process-specific-email.js "GMAIL_URL" --execute --tactic recruiter_job_offer

Examples:
  doppler run -- node scripts/process-specific-email.js "https://mail.google.com/mail/u/0/#inbox/FMfcgz..." --dry-run
  doppler run -- node scripts/process-specific-email.js "https://mail.google.com/mail/u/0/#label/1_borrow_followup/FMfcgz..." --execute

Modes:
  --dry-run    Show analysis and proposed reply, do NOT send (default)
  --execute    Send reply, mark as replied, log to sheet
  --tactic     Force a specific tactic ID (overrides AI classification)

Prerequisites:
  1. Run: doppler setup --project pexabo-email-automation --config prd
  2. Ensure secrets are in Doppler: N8N_MCP_ACCESS_TOKEN, OPENAI_API_KEY, etc.

Outputs:
  - Console: email analysis + proposed reply + model used
  - File: investigations/missed_email_YYYY-MM-DD_MESSAGE_ID.md
`);
    process.exit(0);
  }
  
  console.log(`\nProcessing Gmail URL: ${url}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}`);
  if (tacticOverride) console.log(`Forced tactic: ${tacticOverride}`);
  console.log('');
  
  try {
    // 1. Extract message ID
    const messageId = extractMessageIdFromUrl(url);
    console.log(`Extracted message ID: ${messageId}`);
    
    // 2. Fetch email
    console.log('Fetching email...');
    const email = await fetchEmail(messageId);
    console.log(`From: ${email.from}`);
    console.log(`Subject: ${email.subject}`);
    console.log(`Labels: ${email.labels.join(', ')}`);
    console.log(`Thread ID: ${email.threadId}`);
    console.log('');
    
    // 2b. Check if already replied in thread
    console.log('Checking thread history for existing replies...');
    const threadCheck = await checkAlreadyReplied(email.threadId);
    console.log(`Thread has ${threadCheck.threadMessageCount} messages. Already replied: ${threadCheck.hasReplied}`);
    
    if (threadCheck.hasReplied) {
      console.log('\n⚠️ SKIPPED: Already replied to this thread. No action taken.');
      console.log('If you want to send another reply, do it manually in Gmail.');
      
      // Still generate analysis
      const analysis = await generateMissedAnalysis(email, { intent: 'already_replied', why_missed_guess: 'Thread already has a reply from info@pexabo.com' });
      saveAnalysis(messageId, email, analysis);
      console.log('\nMissed email analysis saved (for audit).');
      return;
    }
    console.log('');
    
    // 3. Classify
    console.log('Classifying intent...');
    const classification = await classifyEmail(email);
    console.log('Classification:', JSON.stringify(classification, null, 2));
    console.log('');
    
    // 4. Draft reply
    console.log('Drafting reply...');
    const draftResult = await draftReply(email, classification, tacticOverride);
    const replyDraft = draftResult.reply;
    
    // 5. Approval (unless --execute with --no-confirm)
    let finalReply = replyDraft;
    if (!args.includes('--no-confirm')) {
      const approval = await promptApproval(replyDraft);
      if (approval.action === 'skip') {
        console.log('\nSkipped. No reply sent.');
        
        // Still generate analysis
        const analysis = await generateMissedAnalysis(email, classification);
        saveAnalysis(messageId, email, analysis);
        console.log('\nMissed email analysis saved.');
        return;
      }
      finalReply = approval.reply;
    }
    
    // 6. Send reply (if execute)
    if (!dryRun) {
      console.log('\nSending reply...');
      await sendReply(email, finalReply);
      console.log('Reply sent!');
      
      console.log('Marking as replied...');
      await markAsReplied(messageId);
      console.log('Marked as replied + archived.');
    } else {
      console.log('\n[DRY RUN] Reply NOT sent.');
      console.log('[DRY RUN] Email NOT marked.');
    }
    
    // 7. Generate missed analysis
    console.log('\nGenerating missed email analysis...');
    const analysis = await generateMissedAnalysis(email, classification);
    saveAnalysis(messageId, email, analysis);
    console.log('Analysis saved!');
    
    // 8. Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Email: ${email.subject}`);
    console.log(`From: ${email.from}`);
    console.log(`Intent: ${classification.intent}`);
    console.log(`Urgency: ${classification.urgency}`);
    console.log(`Tactic: ${tacticOverride || classification.suggested_tactic}`);
    console.log(`Model used: ${draftResult.model_used}`);
    console.log(`Is recruiter email: ${draftResult.is_recruiter}`);
    console.log(`CV sent: ${draftResult.cv_sent || 'N/A'}`);
    console.log(`Sent: ${dryRun ? 'NO (dry run)' : 'YES'}`);
    console.log(`Marked: ${dryRun ? 'NO (dry run)' : 'YES'}`);
    console.log(`Analysis: investigations/missed_email_${new Date().toISOString().split('T')[0]}_${messageId}.md`);
    console.log('');
    
    // 9. Show fix prompt
    console.log('FIX PROMPT (copy into workflow improvement backlog):');
    console.log('-'.repeat(60));
    console.log(classification.why_missed_guess);
    console.log('-'.repeat(60));
    
  } catch (err) {
    console.error('\nError:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

function saveAnalysis(messageId, email, analysisMarkdown) {
  const investigationsDir = path.resolve(__dirname, '..', 'investigations');
  if (!fs.existsSync(investigationsDir)) {
    fs.mkdirSync(investigationsDir, { recursive: true });
  }
  
  const date = new Date().toISOString().split('T')[0];
  const filename = `missed_email_${date}_${messageId}.md`;
  const filepath = path.resolve(investigationsDir, filename);
  
  const content = `---
date: ${date}
message_id: ${messageId}
thread_id: ${email.threadId}
from: ${email.from}
subject: ${email.subject}
labels: ${email.labels.join(', ')}
status: investigated
---

# Missed Email Analysis

## Email Details

- **Subject**: ${email.subject}
- **From**: ${email.from}
- **Date**: ${email.date}
- **Gmail Labels**: ${email.labels.join(', ')}
- **URL**: *(paste original URL here)*

## Analysis

${analysisMarkdown}

## Actions Taken

- [ ] Reply sent
- [ ] Marked as replied
- [ ] Workflow query updated
- [ ] Tactic updated
- [ ] Prevention verified in next cycle

## Related Investigation

*Link to any related missed emails or pattern notes.*
`;
  
  fs.writeFileSync(filepath, content);
  console.log(`Saved analysis to: ${filepath}`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
