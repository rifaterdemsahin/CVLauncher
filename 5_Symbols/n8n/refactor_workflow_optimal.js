require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function optimizeWorkflow() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        // 1. Identify Nodes
        const nodes = workflow.nodes;
        const getNode = (name) => nodes.find(n => n.name === name);
        
        const keywordsNode = getNode('Check for Recruiter Keywords');
        const blacklistNode = getNode('Check Blacklist');
        const isBlacklistedNode = getNode('Is Blacklisted?');
        const selectCvNode = getNode('Select Best CV');
        const restoreBlockedNode = getNode('Restore Context Blocked'); // To delete
        let restoreContextNode = getNode('Restore Context'); // Reuse or create

        if (!restoreContextNode) {
            restoreContextNode = {
                "parameters": { "mode": "mergeByPosition" },
                "name": "Restore Context",
                "type": "n8n-nodes-base.merge",
                "typeVersion": 2,
                "position": [ 200, -350 ],
                "id": crypto.randomUUID()
            };
            workflow.nodes.push(restoreContextNode);
        }

        // 2. Clear Old Connections related to the refactor
        // We will rebuild connections for these specific nodes to avoid ghosts.
        const nodesToReset = [
            'Check for Recruiter Keywords', 
            'Check Blacklist', 
            'Restore Context', 
            'Is Blacklisted?', 
            'Select Best CV'
        ];
        
        // Remove 'Restore Context Blocked' from nodes list
        if (restoreBlockedNode) {
            workflow.nodes = workflow.nodes.filter(n => n.name !== 'Restore Context Blocked');
            console.log('Removed redundant "Restore Context Blocked" node.');
        }

        // Helper to clear outputs of a node
        const clearOutput = (nodeName) => {
            if (workflow.connections[nodeName]) {
                 workflow.connections[nodeName] = { main: [ [] ] }; // Reset to empty main output
            }
        };
        
        nodesToReset.forEach(clearOutput);

        // 3. New Wiring Logic
        // Flow: Keywords -> [Blacklist Check | Restore Context] -> Is Blacklisted -> [Notify | Select CV]

        if (!workflow.connections) workflow.connections = {};

        // A. Keywords -> Check Blacklist (Index 0)
        // A. Keywords -> Restore Context (Index 1 - Input 2)
        if (!workflow.connections['Check for Recruiter Keywords']) workflow.connections['Check for Recruiter Keywords'] = { main: [[]] };
        
        workflow.connections['Check for Recruiter Keywords'].main[0].push(
            { node: 'Check Blacklist', type: 'main', index: 0 },
            { node: 'Restore Context', type: 'main', index: 1 } // Input 2 (Original Data)
        );

        // B. Check Blacklist -> Restore Context (Index 0 - Input 1)
        workflow.connections['Check Blacklist'] = {
            main: [
                [ { node: 'Restore Context', type: 'main', index: 0 } ]
            ]
        };

        // C. Restore Context -> Is Blacklisted?
        workflow.connections['Restore Context'] = {
            main: [
                [ { node: 'Is Blacklisted?', type: 'main', index: 0 } ]
            ]
        };

        // D. Is Blacklisted? 
        // Index 0 (True) -> Notify Blocked
        // Index 1 (False) -> Select Best CV
        workflow.connections['Is Blacklisted?'] = {
            main: [
                [ { node: 'Notify Blocked', type: 'main', index: 0 } ], // True
                [ { node: 'Select Best CV', type: 'main', index: 0 } ]  // False
            ]
        };

        // E. Select Best CV -> Download from GitHub
        workflow.connections['Select Best CV'] = {
            main: [
                [ { node: 'Download from GitHub', type: 'main', index: 0 } ]
            ]
        };


        // 4. Update Node Configurations
        
        // Check Blacklist Configuration
        if (blacklistNode) {
            blacklistNode.alwaysOutputData = true; // Crucial for Merge
            // Ensure inputs are correct
            blacklistNode.parameters.filters = {
                "conditions": [
                    {
                        "key": "email",
                        "operator": "eq",
                        "value": "={{ $json[\"from\"] }}" // Use current json input (from Keywords)
                    }
                ]
            };
            // Reposition
             blacklistNode.position = [ -50, -350 ];
        }

        // Restore Context Position
        if (restoreContextNode) {
            // restoreContextNode has position set in create step
             restoreContextNode.position = [ 100, -350 ];
        }

        // Is Blacklisted? Logic
        if (isBlacklistedNode) {
            // Check if 'email' field exists from Sheet output
            isBlacklistedNode.parameters.conditions = {
                "boolean": [
                    {
                        "value1": "={{ !!$json[\"email\"] }}", // True if email exists (Found in sheet)
                        "value2": true
                    }
                ]
            };
             isBlacklistedNode.position = [ 250, -350 ];
        }

        // Select Best CV Position
        if (selectCvNode) {
             selectCvNode.position = [ 400, -350 ];
        }

        // 5. Ensure Loops are intact for Notify Blocked and Telegram Notify
        // (We cleared 'Check for Recruiter Keywords' outputs, but not the END nodes)
        // Telegram Notify should still point to Limit Rate? Yes.
        // Notify Blocked should still point to Limit Rate? Yes.
        // Check if connections exist
        
        const ensureLoop = (nodeName) => {
            if (!workflow.connections[nodeName]) {
                 workflow.connections[nodeName] = { main: [ [] ] };
            }
            const hasLimit = workflow.connections[nodeName].main[0].some(c => c.node === 'Limit Rate');
            if (!hasLimit) {
                 workflow.connections[nodeName].main[0].push({ node: 'Limit Rate', type: 'main', index: 0 });
            }
        };

        ensureLoop('Telegram Notify');
        ensureLoop('Notify Blocked');

        // 6. Push Update
        const payload = {
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            name: workflow.name
        };

        await axios.put(`${baseUrl}/workflows/${targetWorkflowId}`, payload, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });

        console.log('✅ Success! Workflow optimized: Keywords -> Blacklist -> CV Selection.');
        console.log('   - Redundant "Restore Context Blocked" removed.');
        console.log('   - Single Merge node handles context for both paths.');
        console.log('   - Flow matches recommended Best Practices.');

    } catch (error) {
        console.error('Update failed:', error.message);
    }
}

optimizeWorkflow();
