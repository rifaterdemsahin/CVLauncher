const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';
const backupFile = 'respond_to_job_offers_in_gmail_CVD1ecv1GNe9uF4a_2026-01-26T17-42-04_patched_email_reply.json';
const backupPath = path.resolve(__dirname, 'backups', backupFile);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function addLinksToDebug() {
    try {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        const rawData = fs.readFileSync(backupPath, 'utf8');
        const workflow = JSON.parse(rawData);

        let modified = false;

        workflow.nodes = workflow.nodes.map(node => {

            // Update Debug Nodes to include Gmail Link
            if (node.name.startsWith('Debug:')) {
                const cleanName = node.name;

                let newCode;

                if (node.name === "Debug: Keywords Failed") {
                    // Special case for Failed debug which wraps data
                    newCode = `
const nodeName = "${cleanName}";
console.log('❌ ' + nodeName + ' Hit');
return items.map(item => {
    const threadId = item.json.threadId;
    const gmailLink = threadId ? 'https://mail.google.com/mail/u/0/#inbox/' + threadId : 'No Thread ID';
    return {
        json: {
            debugNode: nodeName,
            gmailLink: gmailLink,
            debugMessage: "❌ FAILURE: Reached False Branch of 'Check Recruiter Keywords'",
            originalData: item.json
        }
    }
});`;
                } else {
                    // Standard Debug Nodes
                    newCode = `
const nodeName = "${cleanName}";
console.log('🔹 ' + nodeName + ' Hit');
return items.map(item => {
    const threadId = item.json.threadId;
    const gmailLink = threadId ? 'https://mail.google.com/mail/u/0/#inbox/' + threadId : 'No Thread ID';
    return {
        json: {
            debugNode: nodeName,
            gmailLink: gmailLink,
            ...item.json
        }
    }
});`;
                }

                if (node.parameters.jsCode !== newCode) {
                    node.parameters.jsCode = newCode;
                    console.log(`Added Gmail Link logic to ${node.name}`);
                    modified = true;
                }
            }

            // Re-verify Telegram Nodes have the link (sanity check)
            if (node.name === 'Telegram Notify' || node.name === 'Notify Blocked') {
                if (!node.parameters.text.includes('https://mail.google.com/mail/u/0/#inbox/')) {
                    console.log(`⚠️ Warning: Gmail Link missing in ${node.name}. Re-running text enhancement might be needed.`);
                    // We won't fix it here to strictly follow "add to DEBUG" instruction, 
                    // but we assume previous steps handled Telegram. 
                    // If this log appears, we know something is wrong.
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

        console.log(`Pushing Debug Links Update to ${url}...`);
        const response = await axios.put(url, payload, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Workflow version: ${response.data.id}`);

        // Save local backup
        const newFilename = backupFile.replace('_patched_email_reply.json', '_patched_debug_links.json');
        fs.writeFileSync(path.resolve(__dirname, 'backups', newFilename), JSON.stringify(workflow, null, 2));

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

addLinksToDebug();
