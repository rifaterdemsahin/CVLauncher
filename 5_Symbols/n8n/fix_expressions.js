const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';
const backupFile = 'respond_to_job_offers_in_gmail_CVD1ecv1GNe9uF4a_2026-01-26T17-42-04_patched_logic.json';
const backupPath = path.resolve(__dirname, 'backups', backupFile);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function fixDataMapping() {
    try {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        const rawData = fs.readFileSync(backupPath, 'utf8');
        const workflow = JSON.parse(rawData);

        // The issue is likely how the values are accessed in the Expression.
        // The previous debug output shows the data structure coming in as:
        // [ { headers: {...}, body: { subject: "...", snippet: "..." } } ]
        //
        // The expressions in the IF node are:
        // value1: "={{ $json.snippet }} {{ $json.subject }}"
        //
        // BUT, the Webhook node outputs the body contents under 'body' key depending on configuration,
        // OR if "Respond" is not used, it might be directly in root.
        // Looking at the user's provided JSON output from the False branch, the structure is:
        // {
        //   "headers": { ... },
        //   "body": {
        //      "subject": "...",
        //      "snippet": "..."
        //   }
        // }
        //
        // So $json.subject is UNDEFINED. It should be $json.body.subject

        // We need to update the IF node expressions to handle both potential structures (Gmail Trigger vs Webhook)
        // Or simpler: Update the Webhook test payload to mimic Gmail structure better, OR update the IF node to look in nested objects.

        // BETTER FIX: Update the IF node to robustly check both locations.
        // But modifying complex expressions via script is risky.
        //
        // ALTERNATIVE: Use a "Set" node before the IF node to normalize the data.
        // BUT: The "Set Mock Data" (Manual Trigger) sets 'subject', in root.
        // Gmail Trigger sets 'subject' in root.
        // Webhook - check options. If "JSON Parse Body" is on, it puts it in body?

        // LET's LOOK at the IF node expressions again.
        // value1: "={{ $json.snippet }} {{ $json.subject }}"

        // PROPOSED FIX: Update expressions to fallback to body.subject if subject is missing.
        // New Expression: "={{ $json.snippet || $json.body.snippet }} {{ $json.subject || $json.body.subject }}"

        let modified = false;
        workflow.nodes = workflow.nodes.map(node => {
            if (node.name === 'Check for Recruiter Keywords') {
                const conditions = node.parameters.conditions.string;

                // Fix Condition 1 (Subject/Snippet)
                if (conditions[0].value1.includes('$json.snippet')) {
                    conditions[0].value1 = "={{ ($json.snippet || $json.body?.snippet || '') }} {{ ($json.subject || $json.body?.subject || '') }}";
                    console.log('Updated Condition 1 Expression for robustness.');
                    modified = true;
                }

                // Fix Condition 2 (Body/Snippet)
                if (conditions[1].value1.includes('$json.body')) {
                    // Note: $json.body in Gmail is the email body content. 
                    // In Webhook, $json.body is the entire payload object.
                    // We need to be careful.
                    // Gmail: $json.body (string)
                    // Webhook: $json.body.body (string)
                    conditions[1].value1 = "={{ ($json.body && typeof $json.body === 'string' ? $json.body : $json.body?.body || '') }} {{ ($json.snippet || $json.body?.snippet || '') }}";
                    console.log('Updated Condition 2 Expression for robustness.');
                    modified = true;
                }
            }
            return node;
        });

        if (!modified) {
            console.log('No expressions needed updating.');
        }

        const payload = {
            name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            staticData: workflow.staticData,
        };

        console.log(`Pushing Expression update to ${url}...`);
        const response = await axios.put(url, payload, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Workflow version: ${response.data.id}`);

        const newFilename = backupFile.replace('_patched_logic.json', '_patched_expressions.json');
        fs.writeFileSync(path.resolve(__dirname, 'backups', newFilename), JSON.stringify(workflow, null, 2));

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

fixDataMapping();
