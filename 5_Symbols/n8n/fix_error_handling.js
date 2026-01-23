require('dotenv').config();
const axios = require('axios');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function enableContinueOnFail() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        // We need to enable "Continue On Fail" for the Gmail nodes
        // because "mock-email-id-123" is not a real ID, so Gmail API will reject it.
        // By enabling this, the workflow will log the error but proceed to the Telegram node.

        const nodesToFix = ['Reply with CV', 'Mark as Read'];
        let modified = false;

        workflow.nodes = workflow.nodes.map(node => {
            if (nodesToFix.includes(node.name)) {
                if (!node.continueOnFail) {
                    console.log(`Enabling "Continue On Fail" for node: ${node.name}`);
                    node.continueOnFail = true;
                    // Also adding onError strategy just in case specific n8n version requires it
                    // node.onError = 'continueRegularOutput'; // Optional depending on version, generic continueOnFail usually works
                    modified = true;
                }
            }
            return node;
        });

        if (modified) {
            const payload = {
                nodes: workflow.nodes,
                connections: workflow.connections,
                settings: workflow.settings,
                name: workflow.name
            };

            await axios.put(`${baseUrl}/workflows/${targetWorkflowId}`, payload, {
                headers: { 'X-N8N-API-KEY': apiKey }
            });
            console.log('✅ Success! Gmail nodes will now ignore errors (like invalid IDs) and continue to Telegram.');
        } else {
            console.log('Nodes are already set to continue on fail.');
        }

    } catch (error) {
        console.error('Update failed:', error.message);
    }
}

enableContinueOnFail();
