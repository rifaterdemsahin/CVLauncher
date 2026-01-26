const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';

const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, '-');
const backupFilename = `respond_to_job_offers_in_gmail_${workflowId}_${timestamp}_final_pull.json`;
const backupPath = path.resolve(__dirname, 'backups', backupFilename);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function pullWorkflow() {
    try {
        console.log(`Pulling latest workflow from ${url}...`);
        const response = await axios.get(url, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        const workflowData = response.data;

        // Ensure backups dir exists
        const dir = path.dirname(backupPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(backupPath, JSON.stringify(workflowData, null, 2));
        console.log(`✅ Backup saved to: ${backupPath}`);

    } catch (error) {
        console.error('❌ Failed to pull workflow:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
    }
}

pullWorkflow();
