require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function addDavidNote() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        const davidNote = {
            "parameters": {
                "content": "## 🤝 Acknowledgement\n**David Gilchrist**\nWe worked together.\n[LinkedIn Profile](https://www.linkedin.com/in/david-gilchrist-61b158301/)",
                "height": 200,
                "width": 300,
                "color": 3 // Green or distinct color
            },
            "id": crypto.randomUUID(),
            "name": "Acknowledgement",
            "type": "n8n-nodes-base.stickyNote",
            "typeVersion": 1,
            "position": [ -150, -960 ] // Next to Version Tag (which is at -496, -960)
        };

        workflow.nodes.push(davidNote);

        const payload = {
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            name: workflow.name
        };

        await axios.put(`${baseUrl}/workflows/${targetWorkflowId}`, payload, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });

        console.log('✅ Success! Added Acknowledgement sticky note.');

    } catch (error) {
        console.error('Update failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

addDavidNote();
