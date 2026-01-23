require('dotenv').config();
const axios = require('axios');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = 'CVD1ecv1GNe9uF4a';

if (!apiKey || apiKey === 'your_api_key_here') {
    console.warn('Warning: N8N_API_KEY appears to be the default placeholder.');
     // proceed specifically to debug the connection URL even if auth fails
}

// Clean up host (remove protocol if present)
host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');

const baseUrl = `${protocol}://${host}/api/v1`;

async function testConnection() {
    try {
        console.log(`Target Base URL: ${baseUrl}`);
        
        // 1. Test basic connection (list workflows)
        console.log('Verifying authentication...');
        const listResponse = await axios.get(`${baseUrl}/workflows`, {
            headers: { 'X-N8N-API-KEY': apiKey },
            params: { limit: 1 }
        });
        console.log('Authentication successful!');

        // 2. Check for specific workflow
        console.log(`Checking for workflow ID: ${targetWorkflowId}...`);
        try {
            const workflowResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
                headers: { 'X-N8N-API-KEY': apiKey }
            });
            console.log(`Success! Found workflow: "${workflowResponse.data.name}"`);
            console.log(`Active: ${workflowResponse.data.active}`);
            console.log(`URL: ${protocol}://${host}/workflow/${targetWorkflowId}`);
        } catch (wfError) {
            if (wfError.response && wfError.response.status === 404) {
                console.error(`Workflow ${targetWorkflowId} not found.`);
            } else {
                throw wfError;
            }
        }

    } catch (error) {
        console.error('Connection failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.code === 'ENOTFOUND') {
             console.error('Hostname not found. Check N8N_HOST in .env');
        }
        process.exit(1);
    }
}

testConnection();
