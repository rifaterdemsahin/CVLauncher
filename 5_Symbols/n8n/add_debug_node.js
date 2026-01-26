const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';
const backupFile = 'respond_to_job_offers_in_gmail_CVD1ecv1GNe9uF4a_2026-01-26T17-42-04_patched_expressions.json';
const backupPath = path.resolve(__dirname, 'backups', backupFile);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function addDebugNode() {
    try {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        const rawData = fs.readFileSync(backupPath, 'utf8');
        const workflow = JSON.parse(rawData);

        // 1. Create a "Debug: Failed" Node
        const debugFailNode = {
            parameters: {
                jsCode: "console.log('❌ DEBUG: Keywords Failed');\nreturn items;"
            },
            name: "Debug: Keywords Failed",
            type: "n8n-nodes-base.code",
            typeVersion: 2,
            position: [
                496,
                144
            ],
            id: "debug-keywords-failed-node-id"
        };

        // 2. Add it to nodes list if it doesn't exist
        const nodeExists = workflow.nodes.find(n => n.name === debugFailNode.name);
        if (!nodeExists) {
            workflow.nodes.push(debugFailNode);
            console.log('Added "Debug: Keywords Failed" node.');
        }

        // 3. Connect False branch of "Check for Recruiter Keywords" to this Debug node
        if (!workflow.connections["Check for Recruiter Keywords"]) {
            workflow.connections["Check for Recruiter Keywords"] = { main: [[], []] };
        }

        // The structure for IF node connections is: main: [ [True Branch], [False Branch] ]
        // Ensure the False branch (index 1) exists
        if (!workflow.connections["Check for Recruiter Keywords"].main[1]) {
            workflow.connections["Check for Recruiter Keywords"].main[1] = [];
        }

        // Add connection
        const connectionExists = workflow.connections["Check for Recruiter Keywords"].main[1].find(c => c.node === "Debug: Keywords Failed");
        if (!connectionExists) {
            workflow.connections["Check for Recruiter Keywords"].main[1].push({
                node: "Debug: Keywords Failed",
                type: "main",
                index: 0
            });
            console.log('Connected False branch to Debug node.');
        }

        // 4. Push Update
        const payload = {
            name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            staticData: workflow.staticData,
        };

        console.log(`Pushing Debug Node update to ${url}...`);
        const response = await axios.put(url, payload, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Workflow version: ${response.data.id}`);

        // Update local file
        const newFilename = backupFile.replace('_patched_expressions.json', '_patched_debug.json');
        fs.writeFileSync(path.resolve(__dirname, 'backups', newFilename), JSON.stringify(workflow, null, 2));

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

addDebugNode();
