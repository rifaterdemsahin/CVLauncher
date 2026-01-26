const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';
const backupFile = 'respond_to_job_offers_in_gmail_CVD1ecv1GNe9uF4a_2026-01-26T17-42-04_patched_webhook.json';
const backupPath = path.resolve(__dirname, 'backups', backupFile);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function fixRegexLogic() {
    try {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        const rawData = fs.readFileSync(backupPath, 'utf8');
        const workflow = JSON.parse(rawData);

        // Modify the "Check for Recruiter Keywords" Node
        // It is an IF node. By default, n8n IF nodes require ALL conditions to be true (AND).
        // We need to change 'combinator' to 'any' (OR logic).

        let modified = false;
        workflow.nodes = workflow.nodes.map(node => {
            if (node.name === 'Check for Recruiter Keywords') {
                // If combinator is currently 'all' (default if missing) or not 'any', set it to 'any'
                if (node.parameters.combinator !== 'any') {
                    node.parameters.combinator = 'any';
                    console.log('Updated "Check for Recruiter Keywords" to use OR logic (combinator: any).');
                    modified = true;
                }
            }
            return node;
        });

        if (!modified) {
            console.log('Logic is already set to OR (any). Checking regex values...');
        }

        // Prepare Payload
        const payload = {
            name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            staticData: workflow.staticData,
        };

        // Push Update
        console.log(`Pushing Logic update to ${url}...`);
        const response = await axios.put(url, payload, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Workflow version: ${response.data.id}`);

        // Update local file
        const newFilename = backupFile.replace('_patched_webhook.json', '_patched_logic.json');
        fs.writeFileSync(path.resolve(__dirname, 'backups', newFilename), JSON.stringify(workflow, null, 2));

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

fixRegexLogic();
