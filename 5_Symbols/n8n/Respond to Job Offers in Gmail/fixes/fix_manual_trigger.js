require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function fixTriggerWithMockData() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        // 1. Remove existing "Manual Trigger" if it exists (to rebuild cleanly)
        workflow.nodes = workflow.nodes.filter(n => n.name !== 'Manual Trigger' && n.name !== 'Set Mock Data');
        
        // 2. Define New Nodes
        const manualTrigger = {
            "parameters": {},
            "name": "Manual Trigger",
            "type": "n8n-nodes-base.manualTrigger",
            "typeVersion": 1,
            "position": [ -800, -50 ], // Move down/left a bit
            "id": "manual-trigger-node-id"
        };

        const setMockData = {
            "parameters": {
                "values": {
                    "string": [
                        { "name": "subject", "value": "Immediate Requirement: Azure DevOps Engineer needed" },
                        { "name": "snippet", "value": "We have a new contract opportunity for an Azure expert." },
                        { "name": "body", "value": "Hello, we are looking for someone with strong Terraform and Azure skills. Rate is competitive." },
                        { "name": "from", "value": "recruiter@example.com" },
                        { "name": "id", "value": "mock-email-id-123" }
                    ]
                }
            },
            "name": "Set Mock Data",
            "type": "n8n-nodes-base.set",
            "typeVersion": 2,
            "position": [ -550, -50 ],
            "id": "set-mock-data-node-id"
        };

        workflow.nodes.push(manualTrigger, setMockData);

        // 3. Wire them up
        // Manual Trigger -> Set Mock Data
        workflow.connections["Manual Trigger"] = {
            "main": [
                [
                    {
                        "node": "Set Mock Data",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        };

        // Set Mock Data -> Check for Recruiter Keywords
        // Note: We need to preserve the Gmail Trigger connection too!
        // n8n connections object is: { "Node Name": { "main": [ [ { node: "Next Node", ... } ] ] } }
        
        workflow.connections["Set Mock Data"] = {
            "main": [
                [
                    {
                        "node": "Check for Recruiter Keywords",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        };

        // Ensure "Check for Recruiter Keywords" receives from both "Gmail Trigger" and "Set Mock Data"
        // In n8n JSON, the receiving node doesn't list who calls it; the Sender lists who it calls.
        // So we just need to make sure Gmail Trigger still points to "Check for Recruiter Keywords".
        // (This should already be preserved in workflow.connections["Gmail Trigger"])

        // 4. Update Workflow
        const payload = {
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            name: workflow.name
        };

        await axios.put(`${baseUrl}/workflows/${targetWorkflowId}`, payload, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });

        console.log('✅ Success! Added Mock Data node.');
        console.log('Flow: Manual Trigger -> Set Mock Data (Azure Role) -> Check Keywords -> ... -> Telegram');

    } catch (error) {
        console.error('Update failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

fixTriggerWithMockData();
