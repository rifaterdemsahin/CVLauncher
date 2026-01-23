require('dotenv').config({ path: '../../.env' });
const axios = require('axios');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function removeRateLimits() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        // Nodes to remove: "Limit Rate" (SplitInBatches) and "Rate Limit Delay" (Wait)
        // AND "Limit" node if it exists (remnant from previous tries)
        const nodesToRemove = ['Limit Rate', 'Rate Limit Delay', 'Limit'];
        
        console.log('Removing Rate Limit nodes...');
        workflow.nodes = workflow.nodes.filter(n => !nodesToRemove.includes(n.name));

        // Re-wiring:
        // We need to connect Triggers directly to "Debug: Start" (or "Check for Recruiter Keywords" if Debug removed).
        // Current: Trigger -> Limit Rate -> Debug: Start -> Rate Limit Delay -> Check Keywords
        
        // Target: Trigger -> Debug: Start -> Check Keywords
        
        const targetNodeName = workflow.nodes.find(n => n.name === 'Debug: Start') ? 'Debug: Start' : 'Check for Recruiter Keywords';
        
        // 1. Re-wire "Gmail Trigger"
        if (workflow.connections['Gmail Trigger']) {
            workflow.connections['Gmail Trigger'] = {
                main: [[ { node: targetNodeName, type: 'main', index: 0 } ]]
            };
        }
        
        // 2. Re-wire "Set Mock Data"
        if (workflow.connections['Set Mock Data']) {
            workflow.connections['Set Mock Data'] = {
                main: [[ { node: targetNodeName, type: 'main', index: 0 } ]]
            };
        }
        
        // 3. Fix "Debug: Start" output
        // If Debug: Start exists, it was pointing to "Rate Limit Delay".
        // Now it must point to "Check for Recruiter Keywords".
        if (targetNodeName === 'Debug: Start') {
            workflow.connections['Debug: Start'] = {
                main: [[ { node: 'Check for Recruiter Keywords', type: 'main', index: 0 } ]]
            };
        }
        
        // 4. Remove Loopbacks
        // Telegram Notify & Notify Blocked had loopbacks to "Limit Rate".
        // Use verify and clean helper.
        
        const cleanLoopback = (nodeName) => {
            if (workflow.connections[nodeName] && workflow.connections[nodeName].main[0]) {
                // Filter out connections to deleted nodes
                workflow.connections[nodeName].main[0] = workflow.connections[nodeName].main[0].filter(c => !nodesToRemove.includes(c.node));
            }
        };
        
        cleanLoopback('Telegram Notify');
        cleanLoopback('Notify Blocked');

        // Also clean up connections object keys regarding deleted nodes
        nodesToRemove.forEach(name => {
            if (workflow.connections[name]) delete workflow.connections[name];
        });

        const payload = {
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            name: workflow.name
        };

        await axios.put(`${baseUrl}/workflows/${targetWorkflowId}`, payload, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });

        console.log('✅ Success! Removed Rate Limit (SplitInBatches/Wait) nodes and simplified flow.');

    } catch (error) {
        console.error('Update failed:', error.message);
    }
}

removeRateLimits();
