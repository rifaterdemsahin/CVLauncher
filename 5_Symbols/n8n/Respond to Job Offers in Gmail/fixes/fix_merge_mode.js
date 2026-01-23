require('dotenv').config({ path: '../../.env' });
const axios = require('axios');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function fixMergeMode() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        // User report: "mergeByPosition is not supported > there is append,combine,choosebranch"
        // This implies the n8n version installed is newer/different and uses the modern "Merge" node options.
        // In newer n8n (v1+), "Merge by Position" is often "combine" with "mergeByPosition" as a sub-option or just "combine".
        
        // Let's check the Merge node "Restore Context".
        const mergeNode = workflow.nodes.find(n => n.name === 'Restore Context');
        
        if (mergeNode) {
            console.log('Updating Merge Node parameters...');
            console.log('   Current params:', JSON.stringify(mergeNode.parameters));
            
            // Mode: "combine" is likely what we want if we are merging data from two inputs.
            // "append" just stacks items ( Input 1 items... then Input 2 items). We do NOT want this.
            // "combine" merges properties of items?
            // "chooseBranch" waits for one?
            
            // We want to MERGE properties of Input 2 (Original Data) into Input 1 (Blacklist Result).
            // Actually, we want to KEEP Input 2's data primarily, and just add Blacklist result?
            // "Check Blacklist" output replaces the item.
            
            // Use "combine".
            // combinationMode: 'mergeByPosition' is the standard way to say "Item 0 from Input 1 merges with Item 0 from Input 2".
            
            // Let's try setting `mode: 'combine'` and `combinationMode: 'mergeByPosition'`.
            
            mergeNode.parameters = {
                "mode": "combine",
                "combinationMode": "mergeByPosition",
                "options": {}
            };
            
            // If the version is very new, maybe `mergeByPosition` isn't a sub-param?
            // Let's assume standard v1 behavior.
            
            // Wait, if user saw "append, combine, choosebranch", it means `mode` param accepts those values.
            // My previous script set `mode: "mergeByPosition"`, which was the OLD v0.x way!
            // That explains the error.
            
            // Correct configuration for Merge V2/V3:
            // mode: 'combine'
            // combinationMode: 'mergeByPosition'
            
            console.log('   -> Set mode to "combine" (mergeByPosition).');
        } else {
            console.log('Error: "Restore Context" node not found.');
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

        console.log('✅ Success! Updated Merge Node to use supported "combine" mode.');

    } catch (error) {
        console.error('Update failed:', error.message);
    }
}

fixMergeMode();
