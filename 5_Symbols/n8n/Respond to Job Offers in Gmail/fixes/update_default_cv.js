require('dotenv').config();
const axios = require('axios');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function updateDefaultCV() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        // 1. Update "Select Best CV" default fallback
        const cvNode = workflow.nodes.find(n => n.name === 'Select Best CV');
        if (cvNode) {
            console.log('Updating Select Best CV default...');
            let code = cvNode.parameters.jsCode;
            
            // Current default: cv_devops_engineer.pdf
            // Target default: cv_ai_engineer.pdf
            
            if (code.includes('"default": "cv_devops_engineer.pdf"')) {
                code = code.replace(
                    '"default": "cv_devops_engineer.pdf"', 
                    '"default": "cv_ai_engineer.pdf"'
                );
                console.log('   -> Changed default CV to AI Engineer');
            }
            
            // Also update the let techStack = "General DevOps" -> "AI Engineering" or similar
            if (code.includes('let techStack = "General DevOps";')) {
                 code = code.replace(
                    'let techStack = "General DevOps";',
                    'let techStack = "AI Engineering";'
                 );
                 console.log('   -> Changed default Tech Stack to AI Engineering');
            }
            
            cvNode.parameters.jsCode = code;
        }

        // 2. Fix the "Notify Blocked" Reference Error (Again)
        // The user reported: "Error details... Stack trace... Node 'Select Best CV' hasn't been executed"
        // This happened EVEN THOUGH we added the Merge node in step 380?
        // Ah, maybe the user hasn't refreshed or the Merge connection failed.
        // OR: The "Notify Blocked" node is still using `{{ $node["Select Best CV"]... }}` explicitly in the text template?
        
        // In step 380, we updated the text to: From: {{ $json["from"] }} ...
        // BUT the error message in the user request shows: `{{ $node["Select Best CV"].json["from"] }}`
        // This implies the specific parameter update might not have stuck or the user is looking at an old execution?
        // OR the "Notify Blocked" node was reset?
        
        // Let's FORCE update the "Notify Blocked" text again to be purely JSON-based (since we have a merge node now).
        // Since we merged, the data is in the root. we don't need to look back at the node.
        
        const blockedNode = workflow.nodes.find(n => n.name === 'Notify Blocked');
        if (blockedNode) {
            console.log('Fixing Notify Blocked text reference...');
            // Check if it's still using $node reference
            const dangerousRef = '$node["Select Best CV"]';
            if (blockedNode.parameters.text.includes(dangerousRef)) {
                 blockedNode.parameters.text = "=🚫 BLOCKED: Blacklisted Email Attempt\n\nFrom: {{ $json[\"from\"] }}\nSubject: {{ $json[\"subject\"] }}\n\nAction: No CV sent.";
                 console.log('   -> Updated text to use safe $json references.');
            } else {
                // Determine if we need to force it anyway
                blockedNode.parameters.text = "=🚫 BLOCKED: Blacklisted Email Attempt\n\nFrom: {{ $json[\"from\"] }}\nSubject: {{ $json[\"subject\"] }}\n\nAction: No CV sent.";
            }
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

        console.log('✅ Success! Default CV updated to AI Engineer and Blocked Notification references fixed.');

    } catch (error) {
        console.error('Update failed:', error.message);
    }
}

updateDefaultCV();
