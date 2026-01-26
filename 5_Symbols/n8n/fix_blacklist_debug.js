const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';
const backupFile = 'respond_to_job_offers_in_gmail_CVD1ecv1GNe9uF4a_2026-01-26T17-42-04_patched_telegram_from.json';
const backupPath = path.resolve(__dirname, 'backups', backupFile);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function fixBlacklistAndDebugs() {
    try {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        const rawData = fs.readFileSync(backupPath, 'utf8');
        const workflow = JSON.parse(rawData);

        let modified = false;
        workflow.nodes = workflow.nodes.map(node => {

            // 1. Fix "Check Blacklist" Node
            if (node.name === 'Check Blacklist') {
                // Change from Read to Lookup to avoid returning random rows
                node.parameters.operation = 'lookup';
                node.parameters.lookupColumn = 'email';
                // Extract sender email securely. 
                // Gmail Trigger (Inbox): from object or string at root.
                // Webhook: body.from.
                node.parameters.lookupValue = "={{ ($json.from?.text || $json.from?.value?.[0]?.address || $json.from || $json.body?.from || '').replace(/.*<(.+)>.*/, '$1') }}";

                console.log('Fixed "Check Blacklist" to use Lookup operation.');
                modified = true;
            }

            // 2. Fix Debug Nodes to include Node Name
            if (node.name.startsWith('Debug:')) {
                const cleanName = node.name;
                // Inject nodeName into the return object
                // Existing code usually is: return items; or map...
                // We will standardise it.

                let newCode = `
const nodeName = "${cleanName}";
console.log('🔹 ' + nodeName + ' Hit');
return items.map(item => {
    return {
        json: {
            debugNode: nodeName,
            ...item.json
        }
    }
});`;

                if (node.name === "Debug: Keywords Failed") {
                    // Keep the specific structure for this one but add the nodeName property
                    newCode = `
const nodeName = "${cleanName}";
console.log('❌ ' + nodeName + ' Hit');
return items.map(item => {
    return {
        json: {
            debugNode: nodeName,
            debugMessage: "❌ FAILURE: Reached False Branch of 'Check Recruiter Keywords'",
            originalData: item.json
        }
    }
});`;
                }

                if (node.parameters.jsCode !== newCode) {
                    node.parameters.jsCode = newCode;
                    console.log(`Updated output format for ${node.name}`);
                    modified = true;
                }
            }
            return node;
        });

        if (!modified) {
            console.log('No updates needed.');
        }

        // Push Update
        const payload = {
            name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            staticData: workflow.staticData,
        };

        console.log(`Pushing Blacklist & Debug fix to ${url}...`);
        const response = await axios.put(url, payload, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Workflow version: ${response.data.id}`);

        // Save local backup
        const newFilename = backupFile.replace('_patched_telegram_from.json', '_patched_blacklist_debug.json');
        fs.writeFileSync(path.resolve(__dirname, 'backups', newFilename), JSON.stringify(workflow, null, 2));

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

fixBlacklistAndDebugs();
