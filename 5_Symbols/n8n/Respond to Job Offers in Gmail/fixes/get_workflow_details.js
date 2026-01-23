require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function getWorkflow() {
    try {
        console.log(`Fetching workflow ${targetWorkflowId}...`);
        const response = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });

        const filePath = path.join(__dirname, 'workflow_dump.json');
        fs.writeFileSync(filePath, JSON.stringify(response.data, null, 2));
        console.log(`Workflow saved to ${filePath}`);
    } catch (error) {
        console.error('Error fetching workflow:', error.message);
        process.exit(1);
    }
}

getWorkflow();
