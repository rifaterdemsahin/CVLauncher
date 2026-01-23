require('dotenv').config();
const axios = require('axios');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function fixNodeReferences() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        // Helper to update specific parameters
        let modified = false;

        // 1. Fix "Reply with CV"
        const replyNode = workflow.nodes.find(n => n.name === 'Reply with CV');
        if (replyNode) {
            const oldRef = '{{ $node["Gmail Trigger"].json["id"] }}';
            const newRef = '{{ $node["Select Best CV"].json["id"] }}';
            
            if (replyNode.parameters.messageId === oldRef) {
                console.log('Updating "Reply with CV" messageId reference...');
                replyNode.parameters.messageId = newRef;
                modified = true;
            }
        }

        // 2. Fix "Mark as Read"
        const markNode = workflow.nodes.find(n => n.name === 'Mark as Read');
        if (markNode) {
            const oldRef = '{{ $node["Gmail Trigger"].json["id"] }}';
            const newRef = '{{ $node["Select Best CV"].json["id"] }}';
            
            if (markNode.parameters.messageId === oldRef) {
                console.log('Updating "Mark as Read" messageId reference...');
                markNode.parameters.messageId = newRef;
                modified = true;
            }
        }

        // 3. Fix "Telegram Notify"
        const telegramNode = workflow.nodes.find(n => n.name === 'Telegram Notify');
        if (telegramNode) {
            const oldFrom = '{{ $node["Gmail Trigger"].json["from"] }}';
            const newFrom = '{{ $node["Select Best CV"].json["from"] }}'; // "Select Best CV" carries the 'from' field too
            
            if (telegramNode.parameters.text && telegramNode.parameters.text.includes('Gmail Trigger')) {
                console.log('Updating "Telegram Notify" text references...');
                // Replace all occurrences just in case
                telegramNode.parameters.text = telegramNode.parameters.text.replace(/Gmail Trigger/g, 'Select Best CV');
                modified = true;
            }
        }

        if (!modified) {
            console.log('No references needed updating (or pattern mismatch).');
            return;
        }

        // Update Workflow
        const payload = {
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            name: workflow.name
        };

        await axios.put(`${baseUrl}/workflows/${targetWorkflowId}`, payload, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });

        console.log('✅ Success! Fixed "Unexecuted Node" errors by pointing references to "Select Best CV".');

    } catch (error) {
        console.error('Update failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

fixNodeReferences();
