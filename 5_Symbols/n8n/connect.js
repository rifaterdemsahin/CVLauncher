require('dotenv').config();
const axios = require('axios');

const protocol = process.env.N8N_PROTOCOL || 'https';
const host = process.env.N8N_HOST || 'localhost:5678';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = 'CVD1ecv1GNe9uF4a';

if (!apiKey || apiKey === 'your_api_key_here') {
    console.error('Error: N8N_API_KEY is missing or default in .env file');
    process.exit(1);
}

const baseUrl = `${protocol}://${host}/api/v1`;

async function testConnection() {
    try {
        console.log(`Connecting to n8n at ${baseUrl}...`);
        
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
        }
        process.exit(1);
    }
}

testConnection();
