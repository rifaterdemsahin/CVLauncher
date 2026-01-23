require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function addMergeForContext() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        // The Problem: Intervening nodes (Blacklist, Download) strip the original JSON data 
        // (like 'techStack', 'from') needed by Telegram Notify.
        // The Fix: Add a Merge Node to re-inject "Select Best CV" data before the Download/Reply steps.

        if (workflow.nodes.find(n => n.name === 'Restore Context')) {
            console.log('Merge node "Restore Context" already exists.');
            return;
        }

        console.log('Creating Merge Node "Restore Context"...');
        const mergeNode = {
            "parameters": {
                "mode": "mergeByPosition" // Simple 1-to-1 merge
            },
            "name": "Restore Context",
            "type": "n8n-nodes-base.merge",
            "typeVersion": 2,
            "position": [ 200, -350 ], // After Is Blacklisted, Before Download
            "id": crypto.randomUUID()
        };

        workflow.nodes.push(mergeNode);

        // RE-WIRING START
        
        // 1. Where do we insert? 
        // Current: Is Blacklisted? (False) -> Download from GitHub
        // New: Is Blacklisted? (False) -> Restore Context (Input 1)
        //      Select Best CV          -> Restore Context (Input 2)
        //      Restore Context         -> Download from GitHub

        // A. Connect Is Blacklisted? (False) -> Restore Context
        // Is Blacklisted? Output 1 is "False" path
        if (workflow.connections["Is Blacklisted?"]) {
            // Existing connection to Download from GitHub?
            // Remove it/Overwrite it
            workflow.connections["Is Blacklisted?"].main[1] = [
                {
                    "node": "Restore Context",
                    "type": "main",
                    "index": 0
                }
            ];
        }

        // B. Connect Select Best CV -> Restore Context (Input 2)
        // We need to ADD a connection from Select Best CV.
        // It already connects to Check Blacklist.
        if (workflow.connections["Select Best CV"]) {
            workflow.connections["Select Best CV"].main[0].push({
                "node": "Restore Context",
                "type": "main",
                "index": 1 // Connect to Input 2
            });
        }

        // C. Connect Restore Context -> Download from GitHub
        workflow.connections["Restore Context"] = {
            "main": [
                [
                    {
                        "node": "Download from GitHub",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        };

        // D. Fix "Download from GitHub" URL
        // Now that data is restored, $json.downloadUrl works again!
        // But let's be safe and try to use the merged data.
        const downloadNode = workflow.nodes.find(n => n.name === 'Download from GitHub');
        if (downloadNode) {
            // Since we merged, the properties from Select Best CV are now in the root of the item again.
            // We can revert to simple reference or keep the explicit one.
            // Let's keep it robust.
            downloadNode.parameters.url = '={{ $json["downloadUrl"] }}';
        }

        // Fix Telegram Notify references just in case
        const telegramNode = workflow.nodes.find(n => n.name === 'Telegram Notify');
        if (telegramNode) {
            // With context restored, we can use simple $json references if we wanted, 
            // but the $node["Select Best CV"] lookback SHOULD work now because the lineage is reinforced by the Merge node.
            // Let's leave it as is for now, the Merge node usually solves the "no connection back" graph error 
            // because it explicitly links the ancestor.
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

        console.log('✅ Success! Added Merge Node to restore data context before final steps.');

    } catch (error) {
        console.error('Update failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

addMergeForContext();
