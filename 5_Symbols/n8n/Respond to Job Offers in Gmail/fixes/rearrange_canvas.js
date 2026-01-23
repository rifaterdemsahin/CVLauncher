require('dotenv').config({ path: '../../.env' });
const axios = require('axios');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function layoutCanvas() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        // Visual constants
        const spacingX = 250;
        const spacingY = 150;
        const startX = -800;
        const startY = 0;

        // Group 1: Triggers (Left)
        const layouts = {
            'Manual Trigger': [startX, startY],
            'Set Mock Data': [startX + 200, startY],
            'Gmail Trigger': [startX, startY - 200],
            'Webhook': [startX, startY - 400],
            
            // Junction: Rate Limit (Merge triggers here)
            'Limit Rate': [startX + 450, startY - 100],
            
            // Loop & Logic Start
            'Debug: Start': [startX + 650, startY - 100],
            'Rate Limit Delay': [startX + 850, startY - 100],
            'Check for Recruiter Keywords': [startX + 1050, startY - 100],
            
            // Branch: Debug
            'Debug: Keywords Passed': [startX + 1250, startY - 100],
            
            // Branch: Blacklist Check (Upper Path)
            'Check Blacklist': [startX + 1450, startY - 200],
            
            // Context Logic
            'Select Best CV': [startX + 1450, startY + 100], // Lower Path (Parallel-ish)
            
            // Merge Junction
            'Restore Context': [startX + 1750, startY - 50],
            'Debug: Context Restored': [startX + 1950, startY - 50],
            'Is Blacklisted?': [startX + 2150, startY - 50],
            
            // Outcomes
            // True -> Blocked
            'Restore Context Blocked': [startX + 2400, startY - 200], // If it still exists? We deleted it in refactor. Just in case.
            'Notify Blocked': [startX + 2400, startY - 250],
            
            // False -> Success
            'Download from GitHub': [startX + 2400, startY + 100],
            'Reply with CV': [startX + 2650, startY + 100],
            'Mark as Read': [startX + 2900, startY + 100],
            'Telegram Notify': [startX + 3150, startY + 100],
            
            // Sticky Notes
            'Sticky Note 1': [startX, startY - 600], // Intro
            'Sticky Note 2': [startX + 1000, startY - 600], // Logic
            'Sticky Note 3': [startX + 2400, startY - 600], // Output
            'Version Tag': [startX, startY + 200],
            'Credential Warning': [startX + 1450, startY - 400]
        };

        workflow.nodes.forEach(node => {
            if (layouts[node.name]) {
                node.position = layouts[node.name];
            } else {
                console.log(`Warning: Node "${node.name}" has no layout definition. Leaving at ${node.position || [0,0]}.`);
            }
        });

        const payload = {
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            name: workflow.name
        };

        await axios.put(`${baseUrl}/workflows/${targetWorkflowId}`, payload, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });

        console.log('✅ Success! Workflow canvas rearranged for user-friendly readability.');

    } catch (error) {
        console.error('Update failed:', error.message);
    }
}

layoutCanvas();
