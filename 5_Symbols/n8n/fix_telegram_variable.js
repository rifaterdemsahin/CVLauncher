const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function fixTelegramVariable() {
    try {
        console.log(`Pulling workflow from ${url}...`);
        const { data: workflow } = await axios.get(url, { headers: { 'X-N8N-API-KEY': n8nApiKey } });

        // Backup
        const backupFile = path.resolve(__dirname, 'backups', `backup_${workflowId}_before_variable_fix_${Date.now()}.json`);
        fs.writeFileSync(backupFile, JSON.stringify(workflow, null, 2));

        // Fix: Use Expression Format
        // The issue is that "{{ $json.telegramHtml }}" was treated as a literal string.
        // We need to ensure it is interpreted as an expression. In n8n API, this often just means setting it as string.
        // However, if the field type expects an expression, usually it works. 
        // Let's verify if we need to set the value as "={{ $json.telegramHtml }}" to force expression mode.

        workflow.nodes = workflow.nodes.map(node => {
            if (["Telegram Notify", "Notify Blocked", "Notify Ignored"].includes(node.name)) {
                
                // Force expression syntax with '=' prefix for n8n to recognize it as an expression
                node.parameters.text = "={{ $json.telegramHtml }}";
                
                // Ensure parse_mode is HTML
                if (!node.parameters.additionalFields) node.parameters.additionalFields = {};
                node.parameters.additionalFields.parse_mode = "HTML";
                
                console.log(`Updated ${node.name}: 'text' = ${node.parameters.text}`);
            }
            return node;
        });

        // Push Updates
        console.log(`Pushing fix...`);
        const response = await axios.put(url, {
             name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            staticData: workflow.staticData,
        }, { headers: { 'X-N8N-API-KEY': n8nApiKey } });

        console.log(`Success! Workflow Version: ${response.data.id}`);

    } catch (error) {
        console.error('Fix Error:', error.message);
        if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
    }
}

fixTelegramVariable();
