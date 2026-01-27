const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function fixTelegramHtmlEscaping() {
    try {
        console.log(`Pulling latest workflow from ${url}...`);
        const { data: workflow } = await axios.get(url, {
            headers: { 'X-N8N-API-KEY': n8nApiKey }
        });

        // Backup before modifying
        const backupPath = path.resolve(__dirname, 'backups', `backup_${workflowId}_before_fix_${Date.now()}.json`);
        // Ensure backups dir exists
        if (!fs.existsSync(path.dirname(backupPath))) fs.mkdirSync(path.dirname(backupPath), { recursive: true });
        fs.writeFileSync(backupPath, JSON.stringify(workflow, null, 2));
        console.log(`Backup saved to ${backupPath}`);

        let modified = false;

        // Enhanced Safe Expression: Escapes &, <, >, ", '
        // Order matters: & must be first.
        const safeExp = (baseExp) => `{{ (${baseExp} || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;') }}`;

        /* Node 1: Telegram Notify */
        const notifyFromValid = '$node["Select Best CV"].json.from?.text || $node["Select Best CV"].json.from';
        // Note: techStack definition is based on the logic in "Select Best CV". It might be simple string.
        const notifyTechStack = '$node["Select Best CV"].json["techStack"]';
        const notifyFileName = '$node["Select Best CV"].json["fileName"]';
        const notifyThreadId = '$node["Select Best CV"].json["threadId"]'; // For Link

        /* Node 2: Notify Blocked */
        const blockedFrom = '$json.from?.text || $json.from';
        const blockedSubject = '$json["subject"]';
        const blockedThreadId = '$json["threadId"]'; // For Link

        /* Node 3: Notify Ignored */
        // Original: ($json.from?.text || $json.from || $json.body?.from || '')
        const ignoredFrom = '$json.from?.text || $json.from || $json.body?.from';
        const ignoredSubject = '$json.subject || $json.body?.subject';

        workflow.nodes = workflow.nodes.map(node => {
            if (node.name === 'Telegram Notify') {
                const messageHtml = `✅ <b>Auto-Reply Sent!</b>

<b>To:</b> ${safeExp(notifyFromValid)}
<b>Tech Stack:</b> ${safeExp(notifyTechStack)}
<b>CV:</b> ${safeExp(notifyFileName)}

Status: Sent Successfully
🔗 <a href="https://mail.google.com/mail/u/0/#inbox/{{ ${notifyThreadId} }}">Open in Gmail</a>`;

                node.parameters.text = messageHtml;
                // Ensure parse_mode is HTML
                node.parameters.additionalFields = { ...node.parameters.additionalFields, parse_mode: 'HTML' };
                modified = true;
                console.log('Updated "Telegram Notify"');
            }

            if (node.name === 'Notify Blocked') {
                const messageHtml = `🚫 <b>BLOCKED: Blacklisted Email Attempt</b>

<b>From:</b> ${safeExp(blockedFrom)}
<b>Subject:</b> ${safeExp(blockedSubject)}

<b>Action:</b> No CV sent.

🔗 <a href="https://mail.google.com/mail/u/0/#inbox/{{ ${blockedThreadId} }}">Open in Gmail</a>`;

                node.parameters.text = messageHtml;
                node.parameters.additionalFields = { ...node.parameters.additionalFields, parse_mode: 'HTML' };
                modified = true;
                console.log('Updated "Notify Blocked"');
            }

            if (node.name === 'Notify Ignored') {
                 const messageHtml = `🔕 <b>Ignored Automated Email</b>

<b>From:</b> ${safeExp(ignoredFrom)}
<b>Subject:</b> ${safeExp(ignoredSubject)}

<i>Reason: Detected as non-human/no-reply system.</i>`;
                
                node.parameters.text = messageHtml;
                node.parameters.additionalFields = { ...node.parameters.additionalFields, parse_mode: 'HTML' };
                modified = true;
                console.log('Updated "Notify Ignored"');
            }

            return node;
        });

        if (!modified) {
            console.log('No changes needed.');
            return;
        }

        console.log(`Pushing updates to ${url}...`);
        const response = await axios.put(url, {
            name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            staticData: workflow.staticData,
        }, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Version: ${response.data.id}`);

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
}

fixTelegramHtmlEscaping();
