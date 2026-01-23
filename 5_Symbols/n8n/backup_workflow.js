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

async function backupWorkflow() {
    try {
        console.log(`Fetching workflow ${targetWorkflowId}...`);
        const response = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });

        // Generate timestamp
        const now = new Date();
        const dateStr = now.toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
        // Format: YYYY-MM-DD_HH-mm-ss
        
        const backupDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupDir)){
            fs.mkdirSync(backupDir);
        }

        const filename = `workflow_backup_${dateStr}.json`;
        const filePath = path.join(backupDir, filename);

        fs.writeFileSync(filePath, JSON.stringify(response.data, null, 2));
        console.log(`✅ Workflow successfully backed up to:`);
        console.log(filePath);

    } catch (error) {
        console.error('Backup failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
        }
        process.exit(1);
    }
}

backupWorkflow();
