require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function updateNotificationsAndNotes() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        // 1. Arrange Sticky Notes
        console.log('Rearranging sticky notes...');
        const notesToArrange = [
            { name: 'Sticky Note 1', pos: [-550, -600] }, // Trigger area
            { name: 'Sticky Note 2', pos: [-50, -600] }, // Logic area
            { name: 'Sticky Note 3', pos: [450, -600] }, // Output area
            { name: 'Acknowledgement', pos: [-100, -900] },
            { name: 'Version Tag', pos: [-500, -900] },
            { name: 'Credential Warning', pos: [150, -750] } // Near blacklist node
        ];

        workflow.nodes.forEach(node => {
            const layout = notesToArrange.find(n => n.name === node.name);
            if (layout) {
                node.position = layout.pos;
            }
        });

        // 2. Add Blacklist Notification (To Telegram)
        // We need to branch execution from "Is Blacklisted?" (True check) -> Telegram Notify
        // Currently "Is Blacklisted?" (True) goes nowhere (empty array).
        
        let telegramNode = workflow.nodes.find(n => n.name === 'Telegram Notify');
        
        // We will create a NEW Telegram node for Blocked Users to keep messages distinct and logic simple
        // Or reuse existing? Distinct is better for clarity.
        
        const blockedNotifyId = crypto.randomUUID();
        const blockedNotifyNode = {
            "parameters": {
                "chatId": "-1002793496878",
                "text": "=🚫 BLOCKED: Blacklisted Email Attempt\n\nFrom: {{ $node[\"Select Best CV\"].json[\"from\"] }}\nSubject: {{ $node[\"Select Best CV\"].json[\"subject\"] }}\n\nAction: No CV sent.",
                "additionalFields": {}
            },
            "name": "Notify Blocked",
            "type": "n8n-nodes-base.telegram",
            "typeVersion": 1.1,
            "position": [ 250, -100 ], // Below/Right of Blacklist Check
            "id": blockedNotifyId,
            "credentials": {
                "telegramApi": {
                    "id": "FNhCBbEpIegop14Z",
                    "name": "Telegram account"
                }
            }
        };

        if (!workflow.nodes.find(n => n.name === 'Notify Blocked')) {
            console.log('Adding "Notify Blocked" node...');
            workflow.nodes.push(blockedNotifyNode);
            
            // Connect Is Blacklisted? (True/Index 0) -> Notify Blocked
            if (workflow.connections["Is Blacklisted?"]) {
                workflow.connections["Is Blacklisted?"].main[0] = [
                    {
                        "node": "Notify Blocked",
                        "type": "main",
                        "index": 0
                    }
                ];
            }
        }

        // 3. Update Success Notification to include Status
        if (telegramNode) {
            console.log('Updating success notification...');
            telegramNode.parameters.text = "=✅ Auto-Reply Sent!\n\nTo: {{ $node[\"Select Best CV\"].json[\"from\"] }}\nTech Stack: {{ $node[\"Select Best CV\"].json[\"techStack\"] }}\nCV: {{ $node[\"Select Best CV\"].json[\"fileName\"] }}\n\nStatus: Sent Successfully";
        }

        const payload = {
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            name: workflow.name
        };

        await axios.put(`${baseUrl}/workflows/${targetWorkflowId}`, payload, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });

        console.log('✅ Success! Rearranged notes and added blocked user notifications.');

    } catch (error) {
        console.error('Update failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

updateNotificationsAndNotes();
