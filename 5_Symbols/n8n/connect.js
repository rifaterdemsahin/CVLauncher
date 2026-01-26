const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;

if (!n8nHost || !n8nApiKey) {
    console.error('Error: N8N_HOST or N8N_API_KEY not found in environment variables.');
    console.log('Please ensure your .env file contains N8N_HOST and N8N_API_KEY.');
    process.exit(1);
}

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows`;

async function testConnection() {
    console.log(`Testing connection to: ${url}`);
    try {
        const response = await axios.get(url, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey
            }
        });
        console.log('Connection Successful!');
        console.log(`Status: ${response.status}`);
        // n8n API returns { data: [...] } for list endpoints
        const count = response.data.data ? response.data.data.length : 'unknown';
        console.log(`Accessible Workflows: ${count}`);
    } catch (error) {
        console.error('Connection Failed:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testConnection();
