require('dotenv').config({ path: '../../.env' }); // Adjusted path since we are in fixes/
const axios = require('axios');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function fixManualTriggerGraph() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        let modified = false;

        // 1. Verify Nodes Exist
        const manualNode = workflow.nodes.find(n => n.name === 'Manual Trigger');
        const mockDataNode = workflow.nodes.find(n => n.name === 'Set Mock Data');
        const limitNode = workflow.nodes.find(n => n.name === 'Limit Rate');

        if (!manualNode || !mockDataNode || !limitNode) {
            console.error('CRITICAL: One of the required nodes (Manual Trigger, Set Mock Data, Limit Rate) is missing!');
            return;
        }

        // 2. Force Connections (Rewrite even if exists to be safe)
        
        // A. Manual Trigger -> Set Mock Data
        console.log('   -> Force wiring: Manual Trigger -> Set Mock Data');
        workflow.connections['Manual Trigger'] = {
            main: [ [ { node: 'Set Mock Data', type: 'main', index: 0 } ] ]
        };

        // B. Set Mock Data -> Limit Rate
        console.log('   -> Force wiring: Set Mock Data -> Limit Rate');
        workflow.connections['Set Mock Data'] = {
             main: [ [ { node: 'Limit Rate', type: 'main', index: 0 } ] ]
        };

        // C. Limit Rate -> Rate Limit Delay (Wait)
        // Ensure Wait node exists
        const waitNode = workflow.nodes.find(n => n.name === 'Rate Limit Delay');
        if (waitNode) {
             console.log('   -> Force wiring: Limit Rate -> Rate Limit Delay');
             workflow.connections['Limit Rate'] = {
                 main: [ [ { node: 'Rate Limit Delay', type: 'main', index: 0 } ] ]
             };
             
             // D. Rate Limit Delay -> Check for Recruiter Keywords
             console.log('   -> Force wiring: Rate Limit Delay -> Check for Recruiter Keywords');
             workflow.connections['Rate Limit Delay'] = {
                 main: [ [ { node: 'Check for Recruiter Keywords', type: 'main', index: 0 } ] ]
             };
        } else {
             // If wait node missing, connect Limit directly to Keywords
             console.log('   -> Warning: Wait node missing. Wiring Limit Rate -> Check for Recruiter Keywords');
             workflow.connections['Limit Rate'] = {
                 main: [ [ { node: 'Check for Recruiter Keywords', type: 'main', index: 0 } ] ]
             };
        }

        const payload = {
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            name: workflow.name
        };

        await axios.put(`${baseUrl}/workflows/${targetWorkflowId}`, payload, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });

        console.log('✅ Success! Manual Trigger chain fully restored.');
    } catch (error) {
        console.error('Update failed:', error.message);
        if (error.response) {
             console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

fixManualTriggerGraph();
