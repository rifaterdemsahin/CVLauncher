const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';
const backupFile = 'respond_to_job_offers_in_gmail_CVD1ecv1GNe9uF4a_2026-01-26T17-42-04_patched.json';
const backupPath = path.resolve(__dirname, 'backups', backupFile);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function enablePostWebhook() {
    try {
        // 1. Read the local patched file (so we keep previous trigger changes)
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        const rawData = fs.readFileSync(backupPath, 'utf8');
        const workflow = JSON.parse(rawData);

        // 2. Modify the Webhook Node
        let modified = false;
        workflow.nodes = workflow.nodes.map(node => {
            if (node.name === 'Webhook') {
                if (node.parameters.httpMethod !== 'POST') {
                    node.parameters.httpMethod = 'POST';
                    console.log('Updated Webhook node to POST method.');
                    modified = true;
                }
            }
            return node;
        });

        if (!modified) {
            console.log('Webhook is already set to POST.');
        }

        // 3. Prepare Payload (Strict whitelist)
        const payload = {
            name: workflow.name,
            // active: workflow.active, // read-only
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            staticData: workflow.staticData,
            // tags: workflow.tags // read-only
        };

        // 4. Push Update
        console.log(`Pushing Webhook update to ${url}...`);
        const response = await axios.put(url, payload, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Workflow version: ${response.data.id}`);

        // 5. Update the local file
        const newFilename = backupFile.replace('_patched.json', '_patched_webhook.json');
        fs.writeFileSync(path.resolve(__dirname, 'backups', newFilename), JSON.stringify(workflow, null, 2));

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

enablePostWebhook();
