const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';
const backupFile = 'respond_to_job_offers_in_gmail_CVD1ecv1GNe9uF4a_2026-01-26T17-42-04_patched_blacklist_debug.json';
const backupPath = path.resolve(__dirname, 'backups', backupFile);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function enhanceTelegramMessages() {
    try {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        const rawData = fs.readFileSync(backupPath, 'utf8');
        const workflow = JSON.parse(rawData);

        let modified = false;
        workflow.nodes = workflow.nodes.map(node => {

            // 1. Update "Telegram Notify" (Auto-Reply Success)
            if (node.name === 'Telegram Notify') {
                const fromExp = '{{ $node["Select Best CV"].json.from.text || $node["Select Best CV"].json.from }}';
                const subjectExp = '{{ $node["Select Best CV"].json["subject"] }}';
                const threadIdExp = '{{ $node["Select Best CV"].json["threadId"] }}';

                // Define HTML message
                const messageHtml = `✅ <b>Auto-Reply Sent!</b>

<b>To:</b> ${fromExp}
<b>Subject:</b> ${subjectExp}
<b>Tech Stack:</b> {{ $node["Select Best CV"].json["techStack"] }}
<b>CV:</b> {{ $node["Select Best CV"].json["fileName"] }}

🔗 <a href="https://mail.google.com/mail/u/0/#inbox/${threadIdExp}">Open in Gmail</a>`;

                node.parameters.text = messageHtml;

                // Enable HTML parsing
                if (!node.parameters.additionalFields) node.parameters.additionalFields = {};
                node.parameters.additionalFields.parse_mode = 'HTML';
                node.parameters.additionalFields.appendAttribution = false; // Ensure this stays off

                console.log('Updated "Telegram Notify" with advanced HTML message and Gmail link.');
                modified = true;
            }

            // 2. Update "Notify Blocked" (Blacklist Warning)
            if (node.name === 'Notify Blocked') {
                const fromExp = '{{ $json.from.text || $json.from }}';
                const subjectExp = '{{ $json["subject"] }}';
                const threadIdExp = '{{ $json["threadId"] }}';

                const messageHtml = `🚫 <b>BLOCKED: Blacklisted Email Attempt</b>

<b>From:</b> ${fromExp}
<b>Subject:</b> ${subjectExp}

<b>Action:</b> No CV sent.

🔗 <a href="https://mail.google.com/mail/u/0/#inbox/${threadIdExp}">Open in Gmail</a>`;

                node.parameters.text = messageHtml;

                if (!node.parameters.additionalFields) node.parameters.additionalFields = {};
                node.parameters.additionalFields.parse_mode = 'HTML';
                node.parameters.additionalFields.appendAttribution = false;

                console.log('Updated "Notify Blocked" with advanced HTML message and Gmail link.');
                modified = true;
            }

            // 3. Update "Set Mock Data" to include threadId
            if (node.name === 'Set Mock Data') {
                const values = node.parameters.values.string;
                const hasThreadId = values.some(v => v.name === 'threadId');

                if (!hasThreadId) {
                    values.push({
                        name: 'threadId',
                        value: 'mock-thread-id-123'
                    });
                    console.log('Added mock "threadId" to Set Mock Data node.');
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

        console.log(`Pushing Enhanced Telegram Messages to ${url}...`);
        const response = await axios.put(url, payload, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Workflow version: ${response.data.id}`);

        // Save local backup
        const newFilename = backupFile.replace('_patched_blacklist_debug.json', '_patched_telegram_enhanced.json');
        fs.writeFileSync(path.resolve(__dirname, 'backups', newFilename), JSON.stringify(workflow, null, 2));

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

enhanceTelegramMessages();
