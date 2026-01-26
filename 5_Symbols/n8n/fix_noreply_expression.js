const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';
const backupFile = 'respond_to_job_offers_in_gmail_CVD1ecv1GNe9uF4a_2026-01-26T19-22-08-036Z_synced_user_changes.json';
const backupPath = path.resolve(__dirname, 'backups', backupFile);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function fixAutomatedFilterExpression() {
    try {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        const rawData = fs.readFileSync(backupPath, 'utf8');
        const workflow = JSON.parse(rawData);

        let modified = false;

        workflow.nodes = workflow.nodes.map(node => {

            if (node.name === 'Is Automated?') {

                // Robust Expression:
                // Checks $json.from (regular), $json.from.text (parsed object), $json.body.from (webhook nested)
                // Same for subject

                const fromPart = "($json.from?.text || $json.from || $json.body?.from || '')";
                const subjectPart = "($json.subject || $json.body?.subject || '')";

                const newInput = `={{ ${fromPart}.toLowerCase() }} {{ ${subjectPart}.toLowerCase() }}`;

                const conditions = node.parameters.conditions.string;
                if (conditions[0].value1 !== newInput) {
                    conditions[0].value1 = newInput;
                    console.log('Updated "Is Automated?" expression to handle nested webhook data (body.from).');
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

        console.log(`Pushing Filter Expression Fix to ${url}...`);
        const response = await axios.put(url, payload, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Workflow version: ${response.data.id}`);

        // Save local backup
        const newFilename = backupFile.replace('_synced_user_changes.json', '_patched_noreply_expression.json');
        fs.writeFileSync(path.resolve(__dirname, 'backups', newFilename), JSON.stringify(workflow, null, 2));

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

fixAutomatedFilterExpression();
