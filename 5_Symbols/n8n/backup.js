const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a'; // ID from user provided URL

if (!n8nHost || !n8nApiKey) {
    console.error('Error: N8N_HOST or N8N_API_KEY not found in environment variables.');
    process.exit(1);
}

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;
const backupDir = path.resolve(__dirname, 'backups');

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

async function backupWorkflow() {
    console.log(`Backing up workflow ${workflowId} from ${url}...`);
    try {
        const response = await axios.get(url, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey
            }
        });

        const workflowData = response.data;
        const workflowName = workflowData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `${workflowName}_${workflowId}_${timestamp}.json`;
        const filePath = path.join(backupDir, filename);

        fs.writeFileSync(filePath, JSON.stringify(workflowData, null, 2));
        console.log(`Backup successful! Saved to: ${filePath}`);
    } catch (error) {
        console.error('Backup Failed:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

backupWorkflow();
