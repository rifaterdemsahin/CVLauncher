require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function enforceSequentialExecution() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        // If I found "Limit" in the previous run but it failed reading 'main', 
        // it implies I might have partial nodes or messed up connections from a manual edit or previous partial run.
        
        let limitNode = workflow.nodes.find(n => n.name === 'Limit Rate');
        
        if (!limitNode) {
            console.log('Creating "Limit Rate" (SplitInBatches)...');
            
            limitNode = {
                "parameters": {
                    "batchSize": 1,
                    "options": {}
                },
                "name": "Limit Rate",
                "type": "n8n-nodes-base.splitInBatches",
                "typeVersion": 3,
                "position": [ -350, -250 ], 
                "id": crypto.randomUUID()
            };
            workflow.nodes.push(limitNode);
        }

        // Initialize connections container if missing
        if (!workflow.connections) workflow.connections = {};
        if (!workflow.connections["Limit Rate"]) workflow.connections["Limit Rate"] = { "main": [ [] ] };

        // 1. Wire Triggers to Limit Rate
        // Gmail Trigger
        if (workflow.nodes.find(n => n.name === 'Gmail Trigger')) {
            workflow.connections["Gmail Trigger"] = {
                "main": [
                    [
                        { "node": "Limit Rate", "type": "main", "index": 0 }
                    ]
                ]
            };
        }
        
        // Manual Trigger Path (Set Mock Data)
        if (workflow.nodes.find(n => n.name === 'Set Mock Data')) {
             workflow.connections["Set Mock Data"] = {
                "main": [
                    [
                        { "node": "Limit Rate", "type": "main", "index": 0 }
                    ]
                ]
            };
        }
        
        // 2. Wire Limit Rate -> Rate Limit Delay (Wait Node)
        let waitNode = workflow.nodes.find(n => n.name === 'Rate Limit Delay');
        if (!waitNode) {
             console.log('Creating "Rate Limit Delay" (Wait)...');
             waitNode = {
                "parameters": {
                    "amount": 2, 
                    "unit": "seconds"
                },
                "name": "Rate Limit Delay",
                "type": "n8n-nodes-base.wait",
                "typeVersion": 1.1,
                "position": [ -350, -100 ],
                "id": crypto.randomUUID()
             };
             workflow.nodes.push(waitNode);
        }

        // Connect Limit Rate -> Wait
        workflow.connections["Limit Rate"] = {
            "main": [
                [
                    { "node": "Rate Limit Delay", "type": "main", "index": 0 }
                ]
            ]
        };

        // 3. Wire Wait -> Keywords
        if (workflow.nodes.find(n => n.name === 'Check for Recruiter Keywords')) {
            workflow.connections["Rate Limit Delay"] = {
                "main": [
                    [
                        { "node": "Check for Recruiter Keywords", "type": "main", "index": 0 }
                    ]
                ]
            };
        }

        // 4. Loop Back from End Nodes -> Limit Rate (Input)
        // Telegram Notify (Success)
        if (workflow.connections["Telegram Notify"]) {
            // Check if loopback exists
            const hasLoop = workflow.connections["Telegram Notify"].main[0].find(c => c.node === 'Limit Rate');
            if (!hasLoop) {
                 workflow.connections["Telegram Notify"].main[0].push({
                    "node": "Limit Rate", "type": "main", "index": 0
                });
            }
        } else {
             workflow.connections["Telegram Notify"] = { 
                 "main": [ 
                     [{ "node": "Limit Rate", "type": "main", "index": 0 }] 
                 ] 
            };
        }

        // Notify Blocked (Failure)
        if (workflow.connections["Notify Blocked"]) {
             const hasLoop = workflow.connections["Notify Blocked"].main[0].find(c => c.node === 'Limit Rate');
             if (!hasLoop) {
                 workflow.connections["Notify Blocked"].main[0].push({
                    "node": "Limit Rate", "type": "main", "index": 0
                });
             }
        } else {
             workflow.connections["Notify Blocked"] = { 
                 "main": [ 
                     [{ "node": "Limit Rate", "type": "main", "index": 0 }] 
                 ] 
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

        console.log('✅ Success! sequential processing (Batch Size: 1) and 2s Rate Limit enforced.');

    } catch (error) {
        console.error('Update failed:', error.message);
    }
}

enforceSequentialExecution();
