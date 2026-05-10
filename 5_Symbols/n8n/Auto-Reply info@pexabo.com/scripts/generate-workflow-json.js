const fs = require('fs');
const path = require('path');

/**
 * Generate Auto-Reply Workflow JSON for n8n
 * 
 * This script creates the complete workflow JSON that can be:
 * 1. Imported via n8n UI (Settings -> Import)
 * 2. Pushed via n8n REST API when available
 * 3. Used as backup/reference
 * 
 * Usage:
 *   node scripts/generate-workflow-json.js
 *   Output: backups/auto-reply-info-pexabo-YYYY-MM-DD.json
 */

function generateWorkflowJson() {
  const now = new Date().toISOString();
  const workflowName = 'Auto-Reply info@pexabo.com';

  // Reuse existing credential IDs from the recruiter workflow
  const gmailCredId = 'YJWBLL2NMyRjSIOr';
  const telegramCredId = 'FNhCBbEpIegop14Z';
  const sheetsCredId = 'nR5sxsdC53TDpXoB';

  const nodes = [
    // Node 1a: Schedule Trigger (Batch Mode)
    {
      id: 'trigger-schedule',
      name: 'Every 6 Hours',
      type: 'n8n-nodes-base.scheduleTrigger',
      typeVersion: 1,
      position: [250, 100],
      parameters: {
        rule: {
          interval: [
            {
              field: 'hours',
              hoursInterval: 6,
              triggerAtHour: 0
            }
          ]
        }
      }
    },
    // Node 1b: Webhook Trigger (Individual Mode)
    {
      id: 'trigger-webhook',
      name: 'Process Single Email',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2.1,
      position: [250, 300],
      webhookId: 'auto-reply-single-email',
      parameters: {
        httpMethod: 'POST',
        path: 'process-single-email',
        responseMode: 'responseNode',
        options: {}
      }
    },
    // Node 2: Fetch Emails
    {
      id: 'gmail-find',
      name: 'Find Lost Emails',
      type: 'n8n-nodes-base.gmail',
      typeVersion: 2,
      position: [450, 100],
      credentials: {
        gmailOAuth2: {
          id: gmailCredId,
          name: 'Gmail account'
        }
      },
      parameters: {
        operation: 'getAll',
        limit: 50,
        q: 'to:info@pexabo.com -from:me -in:sent -label:replied_by_bot newer_than:7d',
        format: 'full',
        options: {
          includeSpamTrash: false
        }
      }
    },
    // Node 3: Check Thread Replies
    {
      id: 'check-thread',
      name: 'Check Thread Replies',
      type: 'n8n-nodes-base.gmail',
      typeVersion: 2,
      position: [450, 300],
      credentials: {
        gmailOAuth2: {
          id: gmailCredId,
          name: 'Gmail account'
        }
      },
      parameters: {
        operation: 'getAll',
        limit: 20,
        q: 'from:me in:sent',
        format: 'metadata'
      }
    },
    // Node 4: Code - Check Already Replied
    {
      id: 'code-check-replied',
      name: 'Already Replied?',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [650, 200],
      parameters: {
        jsCode: `
const threadMessages = $input.all()[0]?.json || [];
const hasReplied = threadMessages.some(msg => {
  const from = msg.payload?.headers?.find(h => h.name === 'From')?.value || '';
  return from.includes('info@pexabo.com') || from.includes('rifaterdemsahin');
});

return {
  json: {
    ...$input.first().json,
    already_replied: hasReplied,
    skip: hasReplied
  }
};
        `.trim()
      }
    },
    // Node 5: IF - Skip if already replied
    {
      id: 'if-skip',
      name: 'Skip?',
      type: 'n8n-nodes-base.if',
      typeVersion: 2,
      position: [850, 200],
      parameters: {
        conditions: {
          options: { caseSensitive: false },
          conditions: [
            {
              id: 'cond-skip',
              leftValue: '={{ $json.skip }}',
              rightValue: 'true',
              operator: { type: 'boolean', operation: 'equals' }
            }
          ]
        }
      }
    },
    // Node 6: Classify Intent (HTTP Request to OpenAI)
    {
      id: 'classify-intent',
      name: 'Classify Intent',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [1050, 200],
      parameters: {
        method: 'POST',
        url: 'https://api.openai.com/v1/chat/completions',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpHeaderAuth',
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'Authorization', value: 'Bearer {{ $env.OPENAI_API_KEY }}' },
            { name: 'Content-Type', value: 'application/json' }
          ]
        },
        sendBody: true,
        bodyParameters: {
          parameters: [
            { name: 'model', value: 'gpt-4o-mini' },
            { name: 'messages', value: '=[{"role":"system","content":"Classify email intent into: pricing_inquiry, partnership, support_request, recruiter_job_offer, general_inquiry, spam. Return JSON with intent, urgency, confidence."},{"role":"user","content":"Subject: {{ $json.subject }}\\nBody: {{ $json.body }}"}]' },
            { name: 'response_format', value: '{"type":"json_object"}' },
            { name: 'temperature', value: '0.3' }
          ]
        },
        options: { timeout: 15000 }
      }
    },
    // Node 7: Code - Extract Classification
    {
      id: 'code-extract-class',
      name: 'Extract Classification',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [1250, 200],
      parameters: {
        jsCode: `
const email = $input.first().json;
const aiResponse = JSON.parse(email.choices?.[0]?.message?.content || '{}');

return {
  json: {
    ...email,
    classification: {
      intent: aiResponse.intent || 'general_inquiry',
      urgency: aiResponse.urgency || 'medium',
      confidence: aiResponse.confidence || 0.5,
      needs_human: aiResponse.needs_human || false
    }
  }
};
        `.trim()
      }
    },
    // Node 8: IF - Route by Intent
    {
      id: 'if-route',
      name: 'Route by Intent',
      type: 'n8n-nodes-base.if',
      typeVersion: 2,
      position: [1450, 200],
      parameters: {
        conditions: {
          options: { caseSensitive: false },
          conditions: [
            {
              id: 'cond-recruiter',
              leftValue: '={{ $json.classification.intent }}',
              rightValue: 'recruiter_job_offer',
              operator: { type: 'string', operation: 'equals' }
            }
          ]
        }
      }
    },
    // Node 9a: Select CV (Recruiter)
    {
      id: 'select-cv',
      name: 'Select Best CV',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [1650, 100],
      parameters: {
        jsCode: `
const email = $input.first().json;
const text = (email.subject + ' ' + email.body).toLowerCase();

const cvMap = [
  { keywords: ['azure','microsoft','entra','m365'], cv: 'cv_azure_architect.pdf', techStack: 'Azure Cloud Architect' },
  { keywords: ['aws','amazon web services','ec2','s3'], cv: 'cv_aws_architect.pdf', techStack: 'AWS Solutions Architect' },
  { keywords: ['kubernetes','k8s','docker'], cv: 'cv_kubernetes_engineer.pdf', techStack: 'Kubernetes Engineer' },
  { keywords: ['devops','cicd','pipeline'], cv: 'cv_devops_engineer.pdf', techStack: 'DevOps Engineer' },
  { keywords: ['security','soc','cyber'], cv: 'cv_security_engineer.pdf', techStack: 'Security Engineer' },
  { keywords: ['ai','machine learning','ml','generative ai'], cv: 'cv_ai_engineer.pdf', techStack: 'AI Engineer' },
  { keywords: ['data','databricks','spark'], cv: 'cv_data_engineer.pdf', techStack: 'Data Engineer' }
];

let best = { cv: 'cv_ai_engineer.pdf', techStack: 'AI Engineer' };
let maxScore = 0;

for (const m of cvMap) {
  const score = m.keywords.reduce((a, k) => a + (text.includes(k) ? 1 : 0), 0);
  if (score > maxScore) { maxScore = score; best = m; }
}

const baseUrl = 'https://raw.githubusercontent.com/rifaterdemsahin/CVLauncher/main/5_Symbols/cvs/';

return {
  json: {
    ...email,
    selected_cv: best.cv,
    tech_stack: best.techStack,
    cv_download_url: baseUrl + best.cv
  }
};
        `.trim()
      }
    },
    // Node 9b: Call Recruiter Generator
    {
      id: 'call-recruiter-gen',
      name: 'Generate Recruiter Response',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [1850, 100],
      parameters: {
        method: 'POST',
        url: '={{ $env.RECRUITER_GENERATOR_URL }}',
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'Content-Type', value: 'application/json' }
          ]
        },
        sendBody: true,
        bodyParameters: {
          parameters: [
            { name: 'recruiter_message', value: '={{ $json.body }}' },
            { name: 'cv_source_url', value: '={{ $json.cv_download_url }}' },
            { name: 'ai_provider', value: 'gemini' }
          ]
        },
        options: { timeout: 15000 }
      }
    },
    // Node 9c: Format Recruiter Email
    {
      id: 'format-recruiter',
      name: 'Format Recruiter Email',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [2050, 100],
      parameters: {
        jsCode: `
const email = $input.first().json;
const gen = email.generated_response || 'Thank you for the opportunity.';

const html = \`
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <p>Hi,</p>
  <p>\${gen}</p>
  <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #007bff;">
    <p><strong>📄 <a href="\${email.cv_download_url}" style="text-decoration: none; color: #007bff;">View CV — \${email.tech_stack} (PDF)</a></strong></p>
    <p><strong>📅 <a href="https://calendly.com/rifaterdem/schedule" style="text-decoration: none; color: #007bff;">Book a clear intro call</a></strong></p>
  </div>
  <p>Best regards,</p>
  <p><strong>Rifat Erdem Sahin</strong></p>
  <p style="font-size: 14px; color: #7f8c8d;">Director | DevOps & Cloud Architect | Pexabo<br>+44 7848 024173 | contact@rifaterdemsahin.com</p>
</div>
\`;

return { json: { ...email, reply_body: html } };
        `.trim()
      }
    },
    // Node 9d: Draft General Reply
    {
      id: 'draft-general',
      name: 'Draft General Reply',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [1650, 300],
      parameters: {
        method: 'POST',
        url: 'https://api.openai.com/v1/chat/completions',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpHeaderAuth',
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'Authorization', value: 'Bearer {{ $env.OPENAI_API_KEY }}' },
            { name: 'Content-Type', value: 'application/json' }
          ]
        },
        sendBody: true,
        bodyParameters: {
          parameters: [
            { name: 'model', value: 'gpt-4o' },
            { name: 'messages', value: '=[{"role":"system","content":"You are the AI assistant for Pexabo (info@pexabo.com). Reply professionally, concisely (max 3 paragraphs), warm tone."},{"role":"user","content":"Subject: {{ $json.subject }}\\nFrom: {{ $json.from }}\\nBody: {{ $json.body }}"}]' },
            { name: 'temperature', value: '0.7' },
            { name: 'max_tokens', value: '800' }
          ]
        },
        options: { timeout: 10000 }
      }
    },
    // Node 9e: Extract General Reply
    {
      id: 'extract-general',
      name: 'Extract Reply Text',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [1850, 300],
      parameters: {
        jsCode: `
const email = $input.first().json;
const reply = email.choices?.[0]?.message?.content || 'Thank you for your email. We will get back to you shortly.';
return { json: { ...email, reply_body: reply } };
        `.trim()
      }
    },
    // Node 10: Send Reply (Gmail)
    {
      id: 'send-reply',
      name: 'Send Reply',
      type: 'n8n-nodes-base.gmail',
      typeVersion: 2,
      position: [2250, 200],
      credentials: {
        gmailOAuth2: {
          id: gmailCredId,
          name: 'Gmail account'
        }
      },
      parameters: {
        operation: 'send',
        to: '={{ $json.from }}',
        subject: 'Re: {{ $json.subject }}',
        message: '={{ $json.reply_body }}',
        options: {
          sendAsHtml: true,
          threadId: '={{ $json.threadId }}'
        }
      }
    },
    // Node 11: Mark as Replied
    {
      id: 'mark-replied',
      name: 'Mark Replied',
      type: 'n8n-nodes-base.gmail',
      typeVersion: 2,
      position: [2450, 200],
      credentials: {
        gmailOAuth2: {
          id: gmailCredId,
          name: 'Gmail account'
        }
      },
      parameters: {
        operation: 'addLabels',
        messageId: '={{ $json.id }}',
        labelIds: ['Label_REPLIED_BY_BOT'],
        removeLabelIds: ['UNREAD']
      }
    },
    // Node 12: Log to Tracker
    {
      id: 'log-tracker',
      name: 'Log to Tracker',
      type: 'n8n-nodes-base.googleSheets',
      typeVersion: 4.5,
      position: [2650, 200],
      credentials: {
        googleSheetsOAuth2Api: {
          id: sheetsCredId,
          name: 'Google Sheets account'
        }
      },
      parameters: {
        operation: 'append',
        documentId: '={{ $env.GOOGLE_SHEETS_DOC_ID }}',
        sheetName: 'Tracker',
        columns: {
          mappingMode: 'autoMapInputData'
        }
      }
    },
    // Node 13: Telegram Success
    {
      id: 'telegram-success',
      name: 'Telegram Notify',
      type: 'n8n-nodes-base.telegram',
      typeVersion: 1.1,
      position: [2850, 200],
      credentials: {
        telegramApi: {
          id: telegramCredId,
          name: 'Telegram account'
        }
      },
      parameters: {
        operation: 'sendMessage',
        chatId: '={{ $env.TELEGRAM_CHAT_ID }}',
        text: '✅ <b>Auto-Reply Sent!</b>\n\n<b>To:</b> {{ $json.from }}\n<b>Subject:</b> {{ $json.subject }}\n<b>Intent:</b> {{ $json.classification.intent }}\n<b>Confidence:</b> {{ $json.classification.confidence }}',
        additionalFields: { parse_mode: 'HTML' }
      },
      retryOnFail: true,
      maxTries: 3,
      waitBetweenTries: 2000
    },
    // Skip node (no-op)
    {
      id: 'skip-noop',
      name: 'Skip',
      type: 'n8n-nodes-base.noOp',
      typeVersion: 1,
      position: [1050, 400]
    }
  ];

  const connections = {
    'Every 6 Hours': {
      main: [[{ node: 'Find Lost Emails', type: 'main', index: 0 }]]
    },
    'Process Single Email': {
      main: [[{ node: 'Find Lost Emails', type: 'main', index: 0 }]]
    },
    'Find Lost Emails': {
      main: [[{ node: 'Check Thread Replies', type: 'main', index: 0 }]]
    },
    'Check Thread Replies': {
      main: [[{ node: 'Already Replied?', type: 'main', index: 0 }]]
    },
    'Already Replied?': {
      main: [[{ node: 'Skip?', type: 'main', index: 0 }]]
    },
    'Skip?': {
      main: [
        [{ node: 'Classify Intent', type: 'main', index: 0 }],
        [{ node: 'Skip', type: 'main', index: 0 }]
      ]
    },
    'Classify Intent': {
      main: [[{ node: 'Extract Classification', type: 'main', index: 0 }]]
    },
    'Extract Classification': {
      main: [[{ node: 'Route by Intent', type: 'main', index: 0 }]]
    },
    'Route by Intent': {
      main: [
        [{ node: 'Select Best CV', type: 'main', index: 0 }],
        [{ node: 'Draft General Reply', type: 'main', index: 0 }]
      ]
    },
    'Select Best CV': {
      main: [[{ node: 'Generate Recruiter Response', type: 'main', index: 0 }]]
    },
    'Generate Recruiter Response': {
      main: [[{ node: 'Format Recruiter Email', type: 'main', index: 0 }]]
    },
    'Format Recruiter Email': {
      main: [[{ node: 'Send Reply', type: 'main', index: 0 }]]
    },
    'Draft General Reply': {
      main: [[{ node: 'Extract Reply Text', type: 'main', index: 0 }]]
    },
    'Extract Reply Text': {
      main: [[{ node: 'Send Reply', type: 'main', index: 0 }]]
    },
    'Send Reply': {
      main: [[{ node: 'Mark Replied', type: 'main', index: 0 }]]
    },
    'Mark Replied': {
      main: [[{ node: 'Log to Tracker', type: 'main', index: 0 }]]
    },
    'Log to Tracker': {
      main: [[{ node: 'Telegram Notify', type: 'main', index: 0 }]]
    }
  };

  return {
    name: workflowName,
    nodes,
    connections,
    settings: {
      executionOrder: 'v1',
      saveExecutionProgress: true,
      saveManualExecutions: true,
      timezone: 'Europe/London'
    }
  };
}

function main() {
  const workflow = generateWorkflowJson();
  const filename = `auto-reply-info-pexabo-${new Date().toISOString().split('T')[0]}.json`;
  const outputPath = path.resolve(__dirname, '..', 'backups', filename);

  // Ensure backups dir exists
  const backupsDir = path.resolve(__dirname, '..', 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2));
  console.log('✅ Workflow JSON generated!');
  console.log('File:', outputPath);
  console.log('Nodes:', workflow.nodes.length);
  console.log('Connections:', Object.keys(workflow.connections).length);
  console.log('');
  console.log('--- How to Deploy ---');
  console.log('Option 1: n8n UI Import');
  console.log('  1. Open n8n.rifaterdemsahin.com');
  console.log('  2. Click "Add Workflow"');
  console.log('  3. Settings (gear icon) → Import from File');
  console.log('  4. Select:', filename);
  console.log('');
  console.log('Option 2: n8n REST API (when MCP is back up)');
  console.log('  doppler run -- node scripts/n8n-mcp-deployer.js --create');
  console.log('');
  console.log('Option 3: n8n CLI');
  console.log('  n8n import:workflow --input="', outputPath, '"');
}

main();
