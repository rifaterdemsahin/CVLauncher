require('dotenv').config();
const axios = require('axios');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function debugAndFix() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;
        let modified = false;

        workflow.nodes.forEach(node => {
            // Check parameters for references to Gmail Trigger
            const paramStr = JSON.stringify(node.parameters);
            if (paramStr.includes('Gmail Trigger')) {
                console.log(`⚠️  Node "${node.name}" references "Gmail Trigger"`);
                
                // Fix: Reply with CV -> messageId
                if (node.name === 'Reply with CV') {
                     if (node.parameters.messageId && node.parameters.messageId.includes('Gmail Trigger')) {
                        console.log('   -> Fixing messageId...');
                        node.parameters.messageId = '={{ $node["Select Best CV"].json["id"] }}';
                        modified = true;
                     }
                }

                // Fix: Mark as Read -> messageId
                if (node.name === 'Mark as Read') {
                    if (node.parameters.messageId && node.parameters.messageId.includes('Gmail Trigger')) {
                        console.log('   -> Fixing messageId...');
                        node.parameters.messageId = '={{ $node["Select Best CV"].json["id"] }}';
                        modified = true;
                     }
                }

                // Fix: Telegram Notify -> text
                if (node.name === 'Telegram Notify') {
                    if (node.parameters.text && node.parameters.text.includes('Gmail Trigger')) {
                        console.log('   -> Fixing text reference...');
                        // Replace generic pattern
                        node.parameters.text = node.parameters.text.replace(/Gmail Trigger/g, 'Select Best CV');
                        modified = true;
                    }
                }
            }
        });

        if (modified) {
            console.log('Pushing updates...');
            const payload = {
                nodes: workflow.nodes,
                connections: workflow.connections,
                settings: workflow.settings,
                name: workflow.name
            };

            await axios.put(`${baseUrl}/workflows/${targetWorkflowId}`, payload, {
                headers: { 'X-N8N-API-KEY': apiKey }
            });
            console.log('✅ Success! Workflow expressions updated.');
        } else {
            console.log('No references to "Gmail Trigger" found in node parameters. (Is the error from an old execution?)');
        }

    } catch (error) {
        console.error('Failed:', error.message);
    }
}

debugAndFix();
