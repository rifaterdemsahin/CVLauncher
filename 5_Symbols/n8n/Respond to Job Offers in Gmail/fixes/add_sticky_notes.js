require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

const workflowFile = path.join(__dirname, 'workflow_dump.json');

function generateShortId() {
    return crypto.randomUUID();
}

async function addStickyNotes() {
    try {
        if (!fs.existsSync(workflowFile)) {
            console.error('workflow_dump.json not found. Run get_workflow_details.js first.');
            process.exit(1);
        }

        const workflow = JSON.parse(fs.readFileSync(workflowFile, 'utf8'));

        // Check if sticky notes already exist to avoid duplication
        const hasStickyNotes = workflow.nodes.some(n => n.type === 'n8n-nodes-base.stickyNote');
        if (hasStickyNotes) {
            console.log('Sticky notes already exist in the workflow. Skipping addition.');
            return;
        }

        const stickyNotes = [
            {
                "parameters": {
                    "content": "## 1. Monitor Inbox & Filter\nTrigger on unread emails from primary category. Check for recruiter keywords like 'opportunity', 'hiring', 'rate'.",
                    "height": 240,
                    "width": 380,
                    "color": 2
                },
                "id": generateShortId(),
                "name": "Sticky Note 1",
                "type": "n8n-nodes-base.stickyNote",
                "typeVersion": 1,
                "position": [ -500, -550 ]
            },
            {
                "parameters": {
                    "content": "## 2. Decision & Action\nAnalyze email text to detect tech stack (Azure/AWS/GCP). Select correct CV PDF and download from GitHub.",
                    "height": 240,
                    "width": 350,
                    "color": 4
                },
                "id": generateShortId(),
                "name": "Sticky Note 2",
                "type": "n8n-nodes-base.stickyNote",
                "typeVersion": 1,
                "position": [ 0, -550 ]
            },
            {
                "parameters": {
                    "content": "## 3. Response & Notification\nReply with CV attachment, mark email as read, and send summary to Telegram.",
                    "height": 240,
                    "width": 450,
                    "color": 5
                },
                "id": generateShortId(),
                "name": "Sticky Note 3",
                "type": "n8n-nodes-base.stickyNote",
                "typeVersion": 1,
                "position": [ 450, -550 ]
            }
        ];

        workflow.nodes.push(...stickyNotes);

        console.log(`Adding ${stickyNotes.length} sticky notes to workflow ${targetWorkflowId}...`);

        // Prepare payload (n8n API expects { name, nodes, connections, ... })
        // We shouldn't send back properties like "activeVersion", "triggerCount" etc for update typically, 
        // but n8n API usually handles full object replacement.
        // It's safer to send: nodes, connections, settings, name.
        
        const payload = {
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            name: workflow.name
        };

        const response = await axios.put(`${baseUrl}/workflows/${targetWorkflowId}`, payload, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });

        console.log('Success! Stick notes added.');
        console.log('New Node Count:', response.data.nodes.length);

    } catch (error) {
        console.error('Update failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

addStickyNotes();
