const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';
const backupFile = 'respond_to_job_offers_in_gmail_CVD1ecv1GNe9uF4a_2026-01-26T17-42-04_patched_body_fix.json';
const backupPath = path.resolve(__dirname, 'backups', backupFile);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function fixRegexSyntax() {
    try {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        const rawData = fs.readFileSync(backupPath, 'utf8');
        const workflow = JSON.parse(rawData);

        // We act on the "Check for Recruiter Keywords" node
        // We will normalize inputs to lowercase and remove regex delimiters

        let modified = false;
        workflow.nodes = workflow.nodes.map(node => {
            if (node.name === 'Check for Recruiter Keywords') {
                const conditions = node.parameters.conditions.string;

                // 1. Condition: Subject/Snippet
                // Old Input: "={{ $json.subject || $json.body?.subject || '' }} {{ $json.snippet || $json.body?.snippet || '' }}"
                // New Input: Force Lowercase
                const input1 = "={{ ($json.subject || $json.body?.subject || '').toLowerCase() }} {{ ($json.snippet || $json.body?.snippet || '').toLowerCase() }}";

                // Old Regex: "/(opportunity|role|...)/i"
                // New Regex: "opportunity|role|..." (Clean pattern, lowercase)
                const regex1 = "opportunity|role|contract|position|hiring|remote|hybrid|inside ir35|outside ir35|job|work|project|requirement|vacancy";

                if (conditions[0].value1 !== input1 || conditions[0].value2 !== regex1) {
                    conditions[0].value1 = input1;
                    conditions[0].value2 = regex1;
                    console.log('Updated Condition 1 to use lowercase input and raw regex pattern.');
                    modified = true;
                }

                // 2. Condition: Body/Snippet
                // Old Input: "={{ $json.text || ... }}"
                // New Input: Force Lowercase
                const input2 = "={{ ($json.text || $json.body?.body || ($json.body && typeof $json.body === 'string' ? $json.body : '') || '').toLowerCase() }} {{ ($json.snippet || $json.body?.snippet || '').toLowerCase() }}";

                // Old Regex: "/(rate|salary|...)/i"
                // New Regex: "rate|salary|..."
                const regex2 = "rate|salary|per day|day rate|cv|resume|referral fee|send cv|share cv|attach cv|forward cv";

                if (conditions[1].value1 !== input2 || conditions[1].value2 !== regex2) {
                    conditions[1].value1 = input2;
                    conditions[1].value2 = regex2;
                    console.log('Updated Condition 2 to use lowercase input and raw regex pattern.');
                    modified = true;
                }
            }
            return node;
        });

        if (!modified) {
            console.log('No updates needed (already normalized).');
        }

        // Push Update
        const payload = {
            name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            staticData: workflow.staticData,
        };

        console.log(`Pushing Regex Syntax update to ${url}...`);
        const response = await axios.put(url, payload, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Workflow version: ${response.data.id}`);

        const newFilename = backupFile.replace('_patched_body_fix.json', '_patched_regex_fix.json');
        fs.writeFileSync(path.resolve(__dirname, 'backups', newFilename), JSON.stringify(workflow, null, 2));

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

fixRegexSyntax();
