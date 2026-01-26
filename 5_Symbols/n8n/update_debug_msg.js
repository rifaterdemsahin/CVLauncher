const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';
const backupFile = 'respond_to_job_offers_in_gmail_CVD1ecv1GNe9uF4a_2026-01-26T17-42-04_patched_debug.json';
const backupPath = path.resolve(__dirname, 'backups', backupFile);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function updateDebugNode() {
    try {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        const rawData = fs.readFileSync(backupPath, 'utf8');
        const workflow = JSON.parse(rawData);

        // Modify the "Debug: Keywords Failed" Node
        // Update the JS code to include a specific message in the returned items

        let modified = false;
        workflow.nodes = workflow.nodes.map(node => {
            if (node.name === 'Debug: Keywords Failed') {
                node.parameters.jsCode = `
console.log('❌ DEBUG: Keywords Failed Node Hit');
return items.map(item => {
    return {
        json: {
            debugMessage: "❌ FAILURE: Reached False Branch of 'Check Recruiter Keywords'",
            originalData: item.json
        }
    }
});`;
                console.log('Updated "Debug: Keywords Failed" return message.');
                modified = true;
            }
            return node;
        });

        if (!modified) {
            console.log('Debug node not found to update.');
        }

        // Push Update
        const payload = {
            name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            staticData: workflow.staticData,
        };

        console.log(`Pushing Debug Message update to ${url}...`);
        const response = await axios.put(url, payload, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Workflow version: ${response.data.id}`);

        // Update local file
        const newFilename = backupFile.replace('_patched_debug.json', '_patched_debug_msg.json');
        fs.writeFileSync(path.resolve(__dirname, 'backups', newFilename), JSON.stringify(workflow, null, 2));

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

updateDebugNode();
