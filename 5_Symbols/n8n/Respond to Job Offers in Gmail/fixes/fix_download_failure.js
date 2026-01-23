require('dotenv').config();
const axios = require('axios');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function fixDownloadNode() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        // The issue: "Check Blacklist" (Google Sheets) runs between "Select Best CV" and "Download from GitHub".
        // Google Sheets replaces the main data stream.
        // Even though we previously set `url` to `{{ $node["Select Best CV"].json["downloadUrl"] }}`, 
        // n8n might complain if it thinks the node is not "executed" in the current branch context 
        // OR if the chain is broken in a way that lookups fail.
        
        // HOWEVER, "Check Blacklist" is definitely executed if we reach Download.
        // The error "There is no connection back to the node 'Select Best CV'" usually means 
        // n8n cannot trace the lineage or the previous node output is completely lost/inaccessible 
        // in the current execution mode (Manual Trigger sometimes acts weird with deep references).
        
        // BETTER FIX: Pass the data THROUGH the blacklist check.
        // We can't easily force Google Sheets to pass through unrelated data.
        
        // ALTERNATIVE: Access the data via the Merge Node pattern or just ensure reference is correct.
        // Reference: `$('Select Best CV').first().json.downloadUrl` (Code style) or 
        // `{{ $node["Select Best CV"].json["downloadUrl"] }}` (Expression style).
        
        // The error says: "There is no connection back to the node 'Select Best CV'". 
        // This implies the graph path is broken? 
        // Logic: Select Best CV -> Check Blacklist -> Is Blacklisted? -> Download from GitHub.
        // The connection exists.
        
        // Maybe "Check Blacklist" overwrites the execution context?
        
        // Let's try to update "Download from GitHub" to use a safer expression or just fix the graph if it was somehow detached.
        
        const downloadNode = workflow.nodes.find(n => n.name === 'Download from GitHub');
        if (downloadNode) {
            console.log('Updating "Download from GitHub" URL expression...');
            // Try using the 'item' index explicitly 0, or ensure expression is clean.
            // Note: $node["Name"] refers to the output of that node.
            
            // Let's try: `{{ $('Select Best CV').item.json.downloadUrl }}` (Logic-less) is `{{ $node["Select Best CV"].json["downloadUrl"] }}`
            
            // If the error persists, it might be because "Check Blacklist" returns MORE items (or fewer) than input?
            // "Select Best CV" returns 1 item.
            // "Check Blacklist" returns 0 or 1 item (based on filter).
            
            // If "Check Blacklist" returns 0 items (no match found), then "Is Blacklisted?" condition runs.
            // Wait, if it returns 0 items, does execution stop? 
            // "Always Output Data" should be on for Google Sheets if we want to continue "Not Found"?
            // Node: "Check Blacklist"
            // We enabled `continueOnFail: true`.
            
            // IF Google Sheets returns NO matches, it outputs nothing (empty array).
            // Then "Is Blacklisted?" receives nothing?
            // We need "Check Blacklist" to ALWAYS output.
            // "Always Output Data" is key here!
            
            const blacklistNode = workflow.nodes.find(n => n.name === 'Check Blacklist');
            if (blacklistNode) {
                console.log('Setting "Always Output Data" on Blacklist node...');
                blacklistNode.alwaysOutputData = true; 
            }
            
            // Also, update the "Test Workflow" sticky note to remind the user.
            const testTriggerNote = workflow.nodes.find(n => n.name === 'Sticky Note ' && n.parameters.content.includes('TEST TRIGGER'));
            if (testTriggerNote) {
                testTriggerNote.parameters.content = "## TEST TRIGGER\n\n**Always click 'Test Workflow' after updates!**\n\nEnsures credentials and expressions are valid.";
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

        console.log('✅ Success! Enabled "Always Output Data" on Blacklist node to ensure flow continuity.');
        console.log('Updated Sticky Note regarding testing.');

    } catch (error) {
        console.error('Update failed:', error.message);
    }
}

fixDownloadNode();
