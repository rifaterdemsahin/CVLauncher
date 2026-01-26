const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';
const backupFile = 'respond_to_job_offers_in_gmail_CVD1ecv1GNe9uF4a_2026-01-26T19-22-08-036Z_patched_noreply_expression.json';
const backupPath = path.resolve(__dirname, 'backups', backupFile);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function fixNotifyIgnoredNode() {
    try {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        const rawData = fs.readFileSync(backupPath, 'utf8');
        const workflow = JSON.parse(rawData);

        let modified = false;

        workflow.nodes = workflow.nodes.map(node => {

            if (node.name === 'Notify Ignored') {

                // 1. Robust Data Access (Subject/From can be in root or body)
                // 2. Super Sanitization (replace &, <, >, ", ')

                const fromExp = "($json.from?.text || $json.from || $json.body?.from || '')";
                const subjectExp = "($json.subject || $json.body?.subject || '')";

                const sanitizeChain = ".toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#39;')";

                const messageHtml = `🔕 <b>Ignored Automated Email</b>

<b>From:</b> {{ ${fromExp}${sanitizeChain} }}
<b>Subject:</b> {{ ${subjectExp}${sanitizeChain} }}

<i>Reason: Detected as non-human/no-reply system.</i>`;

                if (node.parameters.text !== messageHtml) {
                    node.parameters.text = messageHtml;

                    // Ensure parse_mode is correct (snake_case)
                    node.parameters.additionalFields = {
                        appendAttribution: false,
                        parse_mode: 'HTML'
                    };

                    console.log('Updated "Notify Ignored" with robust data mapping and super sanitization.');
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

        console.log(`Pushing Notify Ignored Fix to ${url}...`);
        const response = await axios.put(url, payload, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Workflow version: ${response.data.id}`);

        // Save local backup
        const newFilename = backupFile.replace('_patched_noreply_expression.json', '_patched_notify_ignored.json');
        fs.writeFileSync(path.resolve(__dirname, 'backups', newFilename), JSON.stringify(workflow, null, 2));

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

fixNotifyIgnoredNode();
