require('dotenv').config();
const axios = require('axios');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function addEmailFilter() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;
        let modified = false;

        // Find the "Check for Recruiter Keywords" node
        const filterNode = workflow.nodes.find(n => n.name === 'Check for Recruiter Keywords');

        if (filterNode) {
            console.log('Analyzing filter node...');
            
            // Current Conditions structure in n8n-nodes-base.if:
            // parameters.conditions.string[]
            
            // We want to ADD a condition:
            // value1: {{ $json.from }}
            // operation: notContains
            // value2: rifaterdemsahin

            // Ensure conditions structure exists
            if (!filterNode.parameters.conditions) {
                filterNode.parameters.conditions = { string: [] };
            }
            if (!filterNode.parameters.conditions.string) {
                filterNode.parameters.conditions.string = [];
            }

            const conditions = filterNode.parameters.conditions.string;
            
            // Check if we already have this rule to avoid duplicates
            const hasSelfExclusion = conditions.some(c => 
                c.value1.includes('$json.from') && 
                (c.value2.includes('rifaterdemsahin') || c.value2.includes('myself'))
            );

            if (!hasSelfExclusion) {
                console.log('Adding specific exclusion rule for "rifaterdemsahin"...');
                
                // Add new condition
                conditions.push({
                    "value1": "={{ $json.from }}",
                    "operation": "notContains",
                    "value2": "rifaterdemsahin"
                });

                // Also good practice to exclude your own name if it appears in the From Name
                 conditions.push({
                    "value1": "={{ $json.from }}",
                    "operation": "notContains",
                    "value2": "Rifat Erdem Sahin"
                });

                modified = true;
            } else {
                console.log('Self-exclusion rule already exists.');
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
            console.log('✅ Success! Added filter to ignore emails from "rifaterdemsahin".');
        } else {
            console.log('No changes needed.');
        }

    } catch (error) {
        console.error('Update failed:', error.message);
    }
}

addEmailFilter();
