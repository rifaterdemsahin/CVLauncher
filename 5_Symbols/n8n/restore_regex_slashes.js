const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';
const backupFile = 'respond_to_job_offers_in_gmail_CVD1ecv1GNe9uF4a_2026-01-26T17-42-04_patched_regex_fix.json';
const backupPath = path.resolve(__dirname, 'backups', backupFile);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function restoreRegexDelimiters() {
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

                // n8n often requires the /pattern/flags format for the 'regex' operation.
                // My previous edit removed them. I will put them back.

                // Regex 1
                const regex1_raw = "opportunity|role|contract|position|hiring|remote|hybrid|inside ir35|outside ir35|job|work|project|requirement|vacancy";
                // We can create a cleaned version without slashes if they exist, then wrap.
                // But simpler: just force the format.
                const regex1_formatted = `/${regex1_raw}/i`;

                if (conditions[0].value2 !== regex1_formatted) {
                    conditions[0].value2 = regex1_formatted;
                    console.log('Restored Delimiters for Condition 1 Regex.');
                    modified = true;
                }

                // Regex 2
                const regex2_raw = "rate|salary|per day|day rate|cv|resume|referral fee|send cv|share cv|attach cv|forward cv";
                const regex2_formatted = `/${regex2_raw}/i`;

                if (conditions[1].value2 !== regex2_formatted) {
                    conditions[1].value2 = regex2_formatted;
                    console.log('Restored Delimiters for Condition 2 Regex.');
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

        console.log(`Pushing Regex Delimiter restoration to ${url}...`);
        const response = await axios.put(url, payload, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Workflow version: ${response.data.id}`);

        const newFilename = backupFile.replace('_patched_regex_fix.json', '_patched_regex_restore.json');
        fs.writeFileSync(path.resolve(__dirname, 'backups', newFilename), JSON.stringify(workflow, null, 2));

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

restoreRegexDelimiters();
