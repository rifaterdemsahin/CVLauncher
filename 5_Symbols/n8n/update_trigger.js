const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';
// Use the most recent backup file from step 64
const backupFile = 'respond_to_job_offers_in_gmail_CVD1ecv1GNe9uF4a_2026-01-26T17-42-04.json';
const backupPath = path.resolve(__dirname, 'backups', backupFile);

if (!n8nHost || !n8nApiKey) {
    console.error('Error: N8N_HOST or N8N_API_KEY not found in environment variables.');
    process.exit(1);
}

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function updateWorkflow() {
    try {
        // 1. Read the backup
        const rawData = fs.readFileSync(backupPath, 'utf8');
        const workflow = JSON.parse(rawData);

        // 2. Modify the Triggers
        const nodesToUpdate = ['Gmail Trigger Inbox', 'Gmail Trigger Follow Through'];
        let modifiedCount = 0;

        workflow.nodes = workflow.nodes.map(node => {
            if (nodesToUpdate.includes(node.name) && node.type.includes('gmailTrigger')) {
                const oldQuery = node.parameters.filters.q;
                // Check if query exists and needs updating
                if (oldQuery && !oldQuery.includes('OR position')) {
                    // Remove the closing parenthesis, add new keywords, add closing parenthesis
                    const newQuery = oldQuery.replace(/\)$/, ' OR role OR position OR architect)');
                    node.parameters.filters.q = newQuery;
                    console.log(`Updated ${node.name}:`);
                    console.log(`  Old: ${oldQuery}`);
                    console.log(`  New: ${newQuery}`);
                    modifiedCount++;
                }
            }
            return node;
        });

        if (modifiedCount === 0) {
            console.log('No nodes needed updating. Workflow might already be up to date.');
            return;
        }

        // 3. Send Update to n8n
        // 3. Send Update to n8n
        // Construct strict payload with only allowed allowed keys
        const payload = {
            name: workflow.name,
            // active: workflow.active, // API says read-only
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            staticData: workflow.staticData,
            // tags: workflow.tags // API says read-only
        };

        console.log(`Pushing updates to ${url}...`);
        const response = await axios.put(url, payload, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Workflow version: ${response.data.id}`);

        // 4. Save the patched version locally
        const patchedFilename = backupFile.replace('.json', '_patched.json');
        const patchedPath = path.resolve(__dirname, 'backups', patchedFilename);
        fs.writeFileSync(patchedPath, JSON.stringify(workflow, null, 2));
        console.log(`Saved patched local copy to: ${patchedPath}`);

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

updateWorkflow();
