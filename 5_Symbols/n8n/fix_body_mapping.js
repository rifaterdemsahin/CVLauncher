const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';
const backupFile = 'respond_to_job_offers_in_gmail_CVD1ecv1GNe9uF4a_2026-01-26T17-42-04_patched_debug_msg.json';
const backupPath = path.resolve(__dirname, 'backups', backupFile);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function fixBodyMapping() {
    try {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        const rawData = fs.readFileSync(backupPath, 'utf8');
        const workflow = JSON.parse(rawData);

        let modified = false;
        workflow.nodes = workflow.nodes.map(node => {
            if (node.name === 'Check for Recruiter Keywords') {
                const conditions = node.parameters.conditions.string;

                // Fix 1: Ensure Subject/Snippet looks at root 'subject' and 'snippet' (Gmail) or nested (Webhook)
                // Existing: "{{ ($json.snippet || $json.body?.snippet || '') }} {{ ($json.subject || $json.body?.subject || '') }}"
                // This looks correct for Gmail structure (root keys).

                // Fix 2: Ensure Body looks at 'text' (Gmail) vs 'body' (Webhook)
                // Old: "{{ ($json.body && typeof $json.body === 'string' ? $json.body : $json.body?.body || '') }} ..."
                // New: Include $json.text

                // We'll rewrite it to be very explicit
                const subjectSnippetExp = "={{ $json.subject || $json.body?.subject || '' }} {{ $json.snippet || $json.body?.snippet || '' }}";
                const bodySnippetExp = "={{ $json.text || $json.body?.body || ($json.body && typeof $json.body === 'string' ? $json.body : '') || '' }} {{ $json.snippet || $json.body?.snippet || '' }}";

                if (conditions[0].value1 !== subjectSnippetExp) {
                    conditions[0].value1 = subjectSnippetExp;
                    console.log('Updated Condition 1 (Subject) Expression.');
                    modified = true;
                }

                if (conditions[1].value1 !== bodySnippetExp) {
                    conditions[1].value1 = bodySnippetExp;
                    console.log('Updated Condition 2 (Body) Expression to include $json.text');
                    modified = true;
                }
            }
            return node;
        });

        if (!modified) {
            console.log('No expression updates needed.');
            // Force update to ensure deployment if logic was fine but previous push failed silently? 
            // No, let's trust the logic.
        }

        // Push Update
        const payload = {
            name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            staticData: workflow.staticData,
        };

        console.log(`Pushing Body Mapping update to ${url}...`);
        const response = await axios.put(url, payload, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Workflow version: ${response.data.id}`);

        const newFilename = backupFile.replace('_patched_debug_msg.json', '_patched_body_fix.json');
        fs.writeFileSync(path.resolve(__dirname, 'backups', newFilename), JSON.stringify(workflow, null, 2));

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

fixBodyMapping();
