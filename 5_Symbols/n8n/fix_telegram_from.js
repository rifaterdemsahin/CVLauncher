const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';
const backupFile = 'respond_to_job_offers_in_gmail_CVD1ecv1GNe9uF4a_2026-01-26T17-42-04_patched_telegram_branding.json';
const backupPath = path.resolve(__dirname, 'backups', backupFile);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function fixTelegramFromFields() {
    try {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        const rawData = fs.readFileSync(backupPath, 'utf8');
        const workflow = JSON.parse(rawData);

        let modified = false;
        workflow.nodes = workflow.nodes.map(node => {
            // 1. Fix "Notify Blocked" Node
            if (node.name === 'Notify Blocked' && node.parameters.text) {
                // Current: From: {{ $json["from"] }}
                // New: From: {{ $json.from.text || $json.from }}
                const oldText = node.parameters.text;
                const newText = oldText.replace('{{ $json["from"] }}', '{{ $json.from.text || $json.from }}');

                if (oldText !== newText) {
                    node.parameters.text = newText;
                    console.log(`Updated "Notify Blocked" text expression.`);
                    modified = true;
                }
            }

            // 2. Fix "Telegram Notify" Node
            if (node.name === 'Telegram Notify' && node.parameters.text) {
                // Current: To: {{ $node["Select Best CV"].json["from"] }}
                // New: To: {{ $node["Select Best CV"].json["from"].text || $node["Select Best CV"].json["from"] }}
                const oldText = node.parameters.text;
                // Using replace string is safer than regex to avoid character escaping issues with brackets
                const searchStr = '{{ $node["Select Best CV"].json["from"] }}';
                const replaceStr = '{{ $node["Select Best CV"].json.from.text || $node["Select Best CV"].json.from }}';

                if (oldText.includes(searchStr)) {
                    node.parameters.text = oldText.replace(searchStr, replaceStr);
                    console.log(`Updated "Telegram Notify" text expression.`);
                    modified = true;
                }
            }

            return node;
        });

        if (!modified) {
            console.log('No updates needed for Telegram fields.');
        }

        // Push Update
        const payload = {
            name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            staticData: workflow.staticData,
        };

        console.log(`Pushing Telegram Field update to ${url}...`);
        const response = await axios.put(url, payload, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Workflow version: ${response.data.id}`);

        // Save local backup
        const newFilename = backupFile.replace('_patched_telegram_branding.json', '_patched_telegram_from.json');
        fs.writeFileSync(path.resolve(__dirname, 'backups', newFilename), JSON.stringify(workflow, null, 2));

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

fixTelegramFromFields();
