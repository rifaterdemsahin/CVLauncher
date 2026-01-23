require('dotenv').config({ path: '../../.env' });
const axios = require('axios');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function fixDebugWiring() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        // We need to ensure "Debug: Keywords Passed" cleanly fans out to its targets.
        // And "Check Blacklist" connects to "Restore Context".
        
        let modified = false;
        
        // 1. Check "Debug: Keywords Passed" Connections
        const debugKeywordsNode = workflow.nodes.find(n => n.name === 'Debug: Keywords Passed');
        if (debugKeywordsNode) {
            console.log('Verifying "Debug: Keywords Passed" wiring...');
            
            // Expected targets:
            // 1. Check Blacklist (Input 0)
            // 2. Restore Context (Input 1 / Index 1)
            
            // We'll just force-write them to be sure.
            workflow.connections['Debug: Keywords Passed'] = {
                main: [
                    [
                        { node: 'Check Blacklist', type: 'main', index: 0 },
                        { node: 'Restore Context', type: 'main', index: 1 } // Input 2
                    ]
                ]
            };
            modified = true;
        }

        // 2. Check "Check Blacklist" Connections
        // Expected: Restore Context (Input 0 / Index 0)
        console.log('Verifying "Check Blacklist" wiring...');
        workflow.connections['Check Blacklist'] = {
            main: [
                [
                    { node: 'Restore Context', type: 'main', index: 0 } // Input 1
                ]
            ]
        };
        modified = true;

        // 3. Ensure Restore Context is robust
        const restoreNode = workflow.nodes.find(n => n.name === 'Restore Context');
        if (restoreNode) {
            // Ensure no lingering old connections confusing it
            // Connections *from* Restore Context
            // Restore Context -> Debug: Context Restored (if exists) -> Is Blacklisted?
            // refactor script connected Restore -> Is Blacklisted
            // inject_debug script connected Restore -> Debug -> Is Blacklisted
            
            // Let's verify downstream too.
            const debugRestoreNode = workflow.nodes.find(n => n.name === 'Debug: Context Restored');
            if (debugRestoreNode) {
                 console.log('Verifying "Restore Context" -> "Debug: Context Restored"...');
                 workflow.connections['Restore Context'] = {
                     main: [[ { node: 'Debug: Context Restored', type: 'main', index: 0 } ]]
                 };
                 
                 console.log('Verifying "Debug: Context Restored" -> "Is Blacklisted?"...');
                 workflow.connections['Debug: Context Restored'] = {
                     main: [[ { node: 'Is Blacklisted?', type: 'main', index: 0 } ]]
                 };
            } else {
                 console.log('Verifying "Restore Context" -> "Is Blacklisted?" (No Debug Node)...');
                 workflow.connections['Restore Context'] = {
                     main: [[ { node: 'Is Blacklisted?', type: 'main', index: 0 } ]]
                 };
            }
        }

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

            console.log('✅ Success! Re-wired Logic/Debug/Merge section solidly.');
        }

    } catch (error) {
        console.error('Update failed:', error.message);
    }
}

fixDebugWiring();
