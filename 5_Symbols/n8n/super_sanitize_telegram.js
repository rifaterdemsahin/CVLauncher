const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';
const backupFile = 'respond_to_job_offers_in_gmail_CVD1ecv1GNe9uF4a_2026-01-26T17-42-04_patched_default_cv.json';
const backupPath = path.resolve(__dirname, 'backups', backupFile);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function superSanitizeTelegram() {
    try {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        const rawData = fs.readFileSync(backupPath, 'utf8');
        const workflow = JSON.parse(rawData);

        let modified = false;

        // Helper: Ultra-safe sanitization
        // 1. Convert to string
        // 2. Replace <, >, &, ", ' with HTML entities
        // 3. Remove any remaining raw HTML tags just in case
        const safeExp = (baseExp) => `{{ (${baseExp} || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;') }}`;

        // Original Expressions
        const notifyFromBase = '$node["Select Best CV"].json.from.text || $node["Select Best CV"].json.from';
        const notifySubjectBase = '$node["Select Best CV"].json["subject"]';
        const blockedFromBase = '$json.from.text || $json.from';
        const blockedSubjectBase = '$json["subject"]';

        workflow.nodes = workflow.nodes.map(node => {

            if (node.name === 'Telegram Notify') {
                const fromExp = safeExp(notifyFromBase);
                const subjectExp = safeExp(notifySubjectBase);
                const threadIdExp = `{{ $node["Select Best CV"].json["threadId"] }}`;

                const messageHtml = `✅ <b>Auto-Reply Sent!</b>

<b>To:</b> ${fromExp}
<b>Subject:</b> ${subjectExp}
<b>Tech Stack:</b> {{ $node["Select Best CV"].json["techStack"] }}
<b>CV:</b> {{ $node["Select Best CV"].json["fileName"] }}

🔗 <a href="https://mail.google.com/mail/u/0/#inbox/${threadIdExp}">Open in Gmail</a>`;

                if (node.parameters.text !== messageHtml) {
                    node.parameters.text = messageHtml;
                    // Force strict mode parsing
                    node.parameters.additionalFields = {
                        appendAttribution: false,
                        parse_mode: 'HTML'
                    };
                    console.log('Applied Super Sanitization to "Telegram Notify".');
                    modified = true;
                }
            }

            if (node.name === 'Notify Blocked') {
                const fromExp = safeExp(blockedFromBase);
                const subjectExp = safeExp(blockedSubjectBase);
                const threadIdExp = `{{ $json["threadId"] }}`;

                const messageHtml = `🚫 <b>BLOCKED: Blacklisted Email Attempt</b>

<b>From:</b> ${fromExp}
<b>Subject:</b> ${subjectExp}

<b>Action:</b> No CV sent.

🔗 <a href="https://mail.google.com/mail/u/0/#inbox/${threadIdExp}">Open in Gmail</a>`;

                if (node.parameters.text !== messageHtml) {
                    node.parameters.text = messageHtml;
                    node.parameters.additionalFields = {
                        appendAttribution: false,
                        parse_mode: 'HTML'
                    };
                    console.log('Applied Super Sanitization to "Notify Blocked".');
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

        console.log(`Pushing Super Sanitization to ${url}...`);
        const response = await axios.put(url, payload, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Workflow version: ${response.data.id}`);

        // Save local backup
        const newFilename = backupFile.replace('_patched_default_cv.json', '_patched_telegram_sanitized.json');
        fs.writeFileSync(path.resolve(__dirname, 'backups', newFilename), JSON.stringify(workflow, null, 2));

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

superSanitizeTelegram();
