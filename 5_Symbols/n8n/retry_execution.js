const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const executionId = process.argv[2];

if (!executionId) {
    console.error('Please provide an execution ID.');
    process.exit(1);
}

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/executions/${executionId}/retry`;

async function retryExecution() {
    try {
        console.log(`Retrying execution ${executionId} at ${url}...`);
        const response = await axios.post(url, {}, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });
        console.log('Retry successful! New Execution ID:', response.data.id);
    } catch (error) {
        console.error('Retry failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

retryExecution();
