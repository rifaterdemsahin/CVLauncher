const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';
const backupFile = 'respond_to_job_offers_in_gmail_CVD1ecv1GNe9uF4a_2026-01-26T17-42-04_patched_regex_restore.json';
const backupPath = path.resolve(__dirname, 'backups', backupFile);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function consolidateLogic() {
    try {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        const rawData = fs.readFileSync(backupPath, 'utf8');
        const workflow = JSON.parse(rawData);

        // We will modify "Check for Recruiter Keywords" to have exactly ONE condition
        // This condition concatenates all relevant fields and checks against a unified regex.

        let modified = false;
        workflow.nodes = workflow.nodes.map(node => {
            if (node.name === 'Check for Recruiter Keywords') {

                // 1. Construct the Unified Expression
                // Concatenates subject, snippet, text, body.body, body (string)
                // Converts to lowercase
                const unifiedExpression = "={{ [ $json.subject, $json.snippet, $json.text, $json.body?.subject, $json.body?.snippet, $json.body?.body, (typeof $json.body === 'string' ? $json.body : '') ].filter(Boolean).join(' ').toLowerCase() }}";

                // 2. Construct the Unified Regex
                // Merges both lists: 
                // List 1: opportunity|role|contract|position|hiring|remote|hybrid|inside ir35|outside ir35|job|work|project|requirement|vacancy
                // List 2: rate|salary|per day|day rate|cv|resume|referral fee|send cv|share cv|attach cv|forward cv
                const unifiedRegex = "/(opportunity|role|contract|position|hiring|remote|hybrid|inside ir35|outside ir35|job|work|project|requirement|vacancy|rate|salary|per day|day rate|cv|resume|referral fee|send cv|share cv|attach cv|forward cv)/i";

                // 3. Set the Single Condition
                node.parameters.conditions = {
                    "string": [
                        {
                            "value1": unifiedExpression,
                            "operation": "regex",
                            "value2": unifiedRegex
                        }
                    ]
                };

                // 4. Set Combinator (Does not matter for 1 condition, but good practice)
                node.parameters.combinator = "any";

                console.log('Consolidated keyword check into a single unified condition.');
                modified = true;
            }
            return node;
        });

        // Push Update
        const payload = {
            name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            staticData: workflow.staticData,
        };

        console.log(`Pushing Logic Consolidation to ${url}...`);
        const response = await axios.put(url, payload, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Workflow version: ${response.data.id}`);

        const newFilename = backupFile.replace('_patched_regex_restore.json', '_patched_consolidated.json');
        fs.writeFileSync(path.resolve(__dirname, 'backups', newFilename), JSON.stringify(workflow, null, 2));

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

consolidateLogic();
