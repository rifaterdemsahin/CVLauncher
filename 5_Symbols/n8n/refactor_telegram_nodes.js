const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function refactorWorkflow() {
    try {
        console.log(`Pulling workflow from ${url}...`);
        const { data: workflow } = await axios.get(url, { headers: { 'X-N8N-API-KEY': n8nApiKey } });

        // Backup
        const backupFile = path.resolve(__dirname, 'backups', `backup_${workflowId}_before_refactor_${Date.now()}.json`);
        fs.writeFileSync(backupFile, JSON.stringify(workflow, null, 2));
        console.log(`Backup saved: ${backupFile}`);

        // Define Helper Code Logic
        const escapeCode = `
const escapeHtml = (unsafe) => {
    return (unsafe || '')
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};
`;

        // 1. Prepare Success Msg Node
        const successNode = {
            parameters: {
                jsCode: `${escapeCode}
const from = escapeHtml($input.item.json.from?.text || $input.item.json.from || "");
const subject = escapeHtml($input.item.json.subject || "");
const techStack = escapeHtml($input.item.json.techStack || "");
const fileName = escapeHtml($input.item.json.fileName || "");
const threadId = $input.item.json.threadId || "";

const message = \`✅ <b>Auto-Reply Sent!</b>

<b>To:</b> \${from}
<b>Tech Stack:</b> \${techStack}
<b>CV:</b> \${fileName}

Status: Sent Successfully
🔗 <a href="https://mail.google.com/mail/u/0/#inbox/\${threadId}">Open in Gmail</a>\`;

return {
    ...$input.item.json,
    telegramHtml: message
};`
            },
            name: "Prepare Success Msg",
            type: "n8n-nodes-base.code",
            typeVersion: 2,
            position: [2200, 64],
            id: "prepare-success-msg-id"
        };

        // 2. Prepare Blocked Msg Node
        const blockedNode = {
            parameters: {
                jsCode: `${escapeCode}
const from = escapeHtml($input.item.json.from?.text || $input.item.json.from || "");
const subject = escapeHtml($input.item.json.subject || "");
const threadId = $input.item.json.threadId || "";

const message = \`🚫 <b>BLOCKED: Blacklisted Email Attempt</b>

<b>From:</b> \${from}
<b>Subject:</b> \${subject}

<b>Action:</b> No CV sent.

🔗 <a href="https://mail.google.com/mail/u/0/#inbox/\${threadId}">Open in Gmail</a>\`;

return {
    ...$input.item.json,
    telegramHtml: message
};`
            },
            name: "Prepare Blocked Msg",
            type: "n8n-nodes-base.code",
            typeVersion: 2,
            position: [1450, -304],
            id: "prepare-blocked-msg-id"
        };

        // 3. Prepare Ignored Msg Node
        const ignoredNode = {
            parameters: {
                jsCode: `${escapeCode}
const from = escapeHtml($input.item.json.from?.text || $input.item.json.from || $input.item.json.body?.from);
const subject = escapeHtml($input.item.json.subject || $input.item.json.body?.subject);

const message = \`🔕 <b>Ignored Automated Email</b>

<b>From:</b> \${from}
<b>Subject:</b> \${subject}

<i>Reason: Detected as non-human/no-reply system.</i>\`;

return {
    ...$input.item.json,
    telegramHtml: message
};`
            },
            name: "Prepare Ignored Msg",
            type: "n8n-nodes-base.code",
            typeVersion: 2,
            position: [120, -352], // Just before Notify Ignored (240, -352)
            id: "prepare-ignored-msg-id"
        };


        // Insert Nodes
        workflow.nodes.push(successNode, blockedNode, ignoredNode);

        // Updates Connections & Telegram Nodes

        // Update Limit1 -> Telegram Notify to Limit1 -> Prepare Success Msg -> Telegram Notify
        if (workflow.connections["Limit1"]) {
            workflow.connections["Limit1"].main[0][0].node = "Prepare Success Msg";
        }
        workflow.connections["Prepare Success Msg"] = {
            main: [[{ node: "Telegram Notify", type: "main", index: 0 }]]
        };

        // Update Is Blacklisted? (TRUE branch) -> Notify Blocked to ... -> Prepare Blocked Msg -> Notify Blocked
        if (workflow.connections["Is Blacklisted?"]) {
            // Find connection to Notify Blocked
            const trueBranch = workflow.connections["Is Blacklisted?"].main[0];
            const blockedIndex = trueBranch.findIndex(c => c.node === "Notify Blocked");
            if (blockedIndex !== -1) {
                trueBranch[blockedIndex].node = "Prepare Blocked Msg";
            }
        }
        workflow.connections["Prepare Blocked Msg"] = {
            main: [[{ node: "Notify Blocked", type: "main", index: 0 }]]
        };

        // Update Debug Start -> Is Automated? -> (TRUE) -> Notify Ignored
        // Existing: Is Automated? Check -> True -> Notify Ignored
        if (workflow.connections["Is Automated?"]) {
            const trueBranch = workflow.connections["Is Automated?"].main[0];
             const ignoredIndex = trueBranch.findIndex(c => c.node === "Notify Ignored");
            if (ignoredIndex !== -1) {
                trueBranch[ignoredIndex].node = "Prepare Ignored Msg";
            }
        }
        workflow.connections["Prepare Ignored Msg"] = {
            main: [[{ node: "Notify Ignored", type: "main", index: 0 }]]
        };


        // Update Telegram Nodes to use field
        workflow.nodes = workflow.nodes.map(node => {
            if (["Telegram Notify", "Notify Blocked", "Notify Ignored"].includes(node.name)) {
                node.parameters.text = "{{ $json.telegramHtml }}";
                node.parameters.additionalFields = { ...node.parameters.additionalFields, parse_mode: "HTML" };
                console.log(`Updated ${node.name} to use pre-calculated HTML.`);
            }
            return node;
        });

        // Push Updates
        console.log(`Pushing refactored workflow...`);
        const response = await axios.put(url, {
             name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            staticData: workflow.staticData,
        }, { headers: { 'X-N8N-API-KEY': n8nApiKey } });

        console.log(`Success! Workflow Version: ${response.data.id}`);

    } catch (error) {
        console.error('Refactor Error:', error.message);
        if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
    }
}

refactorWorkflow();
