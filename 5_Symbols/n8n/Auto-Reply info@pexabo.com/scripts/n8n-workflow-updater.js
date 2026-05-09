const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * n8n Workflow Updater
 * 
 * Usage:
 *   node n8n-workflow-updater.js --create       Create new workflow from template
 *   node n8n-workflow-updater.js --update       Update existing workflow
 *   node n8n-workflow-updater.js --backup       Download current workflow backup
 *   node n8n-workflow-updater.js --status       Check workflow status
 * 
 * Requires:
 *   - N8N_API_KEY
 *   - N8N_HOST
 */

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const N8N_HOST = (process.env.N8N_HOST || 'https://n8n.rifaterdemsahin.com').replace(/\/$/, '');
const N8N_API_KEY = process.env.N8N_API_KEY;
const WORKFLOW_NAME = 'Auto-Reply info@pexabo.com';

const headers = {
  'X-N8N-API-KEY': N8N_API_KEY,
  'Content-Type': 'application/json'
};

// Generate workflow JSON from our design
function generateWorkflowJson() {
  return {
    name: WORKFLOW_NAME,
    nodes: [
      {
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
        },
        id: 'trigger-schedule',
        name: 'Every 6 Hours',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1,
        position: [250, 100]
      },
      {
        parameters: {
          httpMethod: 'POST',
          path: 'process-single-email',
          responseMode: 'responseNode',
          options: {}
        },
        id: 'trigger-webhook',
        name: 'Process Single Email',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 1,
        position: [250, 300]
      },
      {
        parameters: {
          operation: 'getAll',
          limit: 50,
          q: 'to:info@pexabo.com -from:me -in:sent -label:replied_by_bot newer_than:7d',
          format: 'full',
          options: {
            includeSpamTrash: false
          }
        },
        id: 'gmail-find',
        name: 'Find Lost Emails',
        type: 'n8n-nodes-base.gmail',
        typeVersion: 2,
        position: [450, 300],
        credentials: {
          gmailOAuth2: {
            id: 'gmail-info-pexabo',
            name: 'info@pexabo.com Gmail'
          }
        }
      },
      {
        parameters: {
          jsCode: `
// Extract and normalize email data
const messages = $input.all()[0].json || [];
const results = [];

for (const msg of messages) {
  const payload = msg.payload || {};
  const headers = payload.headers || [];
  
  const from = headers.find(h => h.name === 'From')?.value || '';
  const subject = headers.find(h => h.name === 'Subject')?.value || '';
  const date = headers.find(h => h.name === 'Date')?.value || '';
  
  // Extract body
  let body = '';
  if (payload.parts) {
    const textPart = payload.parts.find(p => p.mimeType === 'text/plain');
    const htmlPart = payload.parts.find(p => p.mimeType === 'text/html');
    if (textPart && textPart.body?.data) {
      body = Buffer.from(textPart.body.data, 'base64').toString('utf8');
    } else if (htmlPart && htmlPart.body?.data) {
      body = Buffer.from(htmlPart.body.data, 'base64').toString('utf8');
    }
  } else if (payload.body?.data) {
    body = Buffer.from(payload.body.data, 'base64').toString('utf8');
  }
  
  results.push({
    email_id: msg.id,
    thread_id: msg.threadId,
    from,
    subject,
    date,
    body: body.substring(0, 4000),
    snippet: msg.snippet || ''
  });
}

return results.map(r => ({ json: r }));
          `
        },
        id: 'code-extract',
        name: 'Extract Email Data',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [650, 300]
      },
      {
        parameters: {
          conditions: {
            options: {
              caseSensitive: false
            },
            conditions: [
              {
                id: 'cond-1',
                leftValue: '={{ $json.body }}',
                rightValue: '',
                operator: {
                  type: 'string',
                  operation: 'notEmpty'
                }
              }
            ]
          }
        },
        id: 'if-valid',
        name: 'Has Content?',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [850, 300]
      },
      {
        parameters: {
          operation: 'append',
          documentId: '={{ $env.GOOGLE_SHEETS_DOC_ID }}',
          sheetName: 'Tracker',
          columns: {
            mappingMode: 'autoMapInputData'
          }
        },
        id: 'sheets-log',
        name: 'Log to Tracker',
        type: 'n8n-nodes-base.googleSheets',
        typeVersion: 4,
        position: [1450, 300],
        credentials: {
          googleSheetsOAuth2Api: {
            id: 'google-sheets-pexabo',
            name: 'Pexabo Sheets'
          }
        }
      },
      {
        parameters: {
          operation: 'send',
          to: '={{ $json.from }}',
          subject: 'Re: {{ $json.subject }}',
          message: '={{ $json.ai_reply }}',
          options: {
            sendAsHtml: true,
            threadId: '={{ $json.thread_id }}'
          }
        },
        id: 'gmail-send',
        name: 'Send Reply',
        type: 'n8n-nodes-base.gmail',
        typeVersion: 2,
        position: [1250, 300],
        credentials: {
          gmailOAuth2: {
            id: 'gmail-info-pexabo',
            name: 'info@pexabo.com Gmail'
          }
        }
      },
      {
        parameters: {
          operation: 'addLabels',
          messageId: '={{ $json.email_id }}',
          labelIds: ['Label_REPLIED_BY_BOT'] // Replace with actual label ID
        },
        id: 'gmail-label',
        name: 'Mark Replied',
        type: 'n8n-nodes-base.gmail',
        typeVersion: 2,
        position: [1050, 300],
        credentials: {
          gmailOAuth2: {
            id: 'gmail-info-pexabo',
            name: 'info@pexabo.com Gmail'
          }
        }
      }
    ],
    connections: {
      'Every 6 Hours': {
        main: [[{ node: 'Find Lost Emails', type: 'main', index: 0 }]]
      },
      'Process Single Email': {
        main: [[{ node: 'Extract Email Data', type: 'main', index: 0 }]]
      },
      'Find Lost Emails': {
        main: [[{ node: 'Extract Email Data', type: 'main', index: 0 }]]
      },
      'Extract Email Data': {
        main: [[{ node: 'Has Content?', type: 'main', index: 0 }]]
      },
      'Has Content?': {
        main: [
          [{ node: 'Mark Replied', type: 'main', index: 0 }],
          [{ node: 'Log to Tracker', type: 'main', index: 0 }] // Skip path for empty
        ]
      },
      'Mark Replied': {
        main: [[{ node: 'Send Reply', type: 'main', index: 0 }]]
      },
      'Send Reply': {
        main: [[{ node: 'Log to Tracker', type: 'main', index: 0 }]]
      }
    },
    settings: {
      executionOrder: 'v1',
      errorWorkflow: ''
    },
    staticData: null,
    tags: ['pexabo', 'email', 'auto-reply']
  };
}

async function createWorkflow() {
  try {
    const workflow = generateWorkflowJson();
    const response = await axios.post(`${N8N_HOST}/api/v1/workflows`, workflow, { headers });
    console.log('Workflow created!');
    console.log('ID:', response.data.id);
    console.log('URL:', `${N8N_HOST}/workflow/${response.data.id}`);
    
    // Save backup
    const backupPath = path.resolve(__dirname, '../backups', `workflow-created-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(response.data, null, 2));
    console.log('Backup saved to:', backupPath);
  } catch (error) {
    console.error('Create failed:', error.response?.data || error.message);
  }
}

async function backupWorkflow(workflowId) {
  try {
    const response = await axios.get(`${N8N_HOST}/api/v1/workflows/${workflowId}`, { headers });
    const backupPath = path.resolve(__dirname, '../backups', `workflow-${workflowId}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(response.data, null, 2));
    console.log('Backup saved to:', backupPath);
  } catch (error) {
    console.error('Backup failed:', error.response?.data || error.message);
  }
}

async function listWorkflows() {
  try {
    const response = await axios.get(`${N8N_HOST}/api/v1/workflows`, { headers });
    const workflows = response.data.data || [];
    console.log('\nAvailable Workflows:');
    console.log('====================');
    workflows.forEach(w => {
      console.log(`${w.id} | ${w.name} | Active: ${w.active}`);
    });
  } catch (error) {
    console.error('List failed:', error.response?.data || error.message);
  }
}

async function activateWorkflow(workflowId) {
  try {
    await axios.post(`${N8N_HOST}/api/v1/workflows/${workflowId}/activate`, {}, { headers });
    console.log(`Workflow ${workflowId} activated successfully.`);
  } catch (error) {
    console.error('Activate failed:', error.response?.data || error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (!N8N_API_KEY) {
    console.error('Error: N8N_API_KEY not set. Check Doppler or .env file.');
    process.exit(1);
  }
  
  if (args.includes('--create')) {
    await createWorkflow();
  } else if (args.includes('--list')) {
    await listWorkflows();
  } else if (args.includes('--backup')) {
    const idx = args.indexOf('--backup');
    const workflowId = args[idx + 1];
    if (!workflowId) {
      console.error('Usage: --backup <workflow-id>');
      process.exit(1);
    }
    await backupWorkflow(workflowId);
  } else if (args.includes('--activate')) {
    const idx = args.indexOf('--activate');
    const workflowId = args[idx + 1];
    if (!workflowId) {
      console.error('Usage: --activate <workflow-id>');
      process.exit(1);
    }
    await activateWorkflow(workflowId);
  } else {
    console.log(`
n8n Workflow Updater
====================

Usage:
  node n8n-workflow-updater.js --create              Create new auto-reply workflow
  node n8n-workflow-updater.js --list                List all workflows
  node n8n-workflow-updater.js --backup <id>         Backup a workflow
  node n8n-workflow-updater.js --activate <id>       Activate a workflow

Environment:
  N8N_HOST=${N8N_HOST}
  N8N_API_KEY=${N8N_API_KEY ? '***set***' : '***MISSING***'}
`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
