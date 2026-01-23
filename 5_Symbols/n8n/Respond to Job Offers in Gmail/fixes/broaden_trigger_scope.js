require('dotenv').config();
const axios = require('axios');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function broadenScope() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;
        let modified = false;

        // 1. Update Gmail Trigger Query (Remove -from:me, broaden category)
        const triggerNode = workflow.nodes.find(n => n.name === 'Gmail Trigger');
        if (triggerNode) {
            console.log('Updating Gmail Trigger query...');
            // Original: "is:unread -from:me category:primary"
            // New: "is:unread" (Let the "Check Keywords" node do the heavy filtering)
            // This ensures we catch emails even if they aren't in 'Primary' or if (for testing) they are from ourselves.
            
            if (triggerNode.parameters.filters && triggerNode.parameters.filters.q) {
                // Ensure we catch keywords in the query itself for efficiency, 
                // but keep it broad enough to catch "send cv"
                
                // Expanding the query to be:
                // is:unread AND (cv OR resume OR job OR contract OR opportunity OR hiring OR "send cv")
                const newQuery = 'is:unread (cv OR resume OR job OR contract OR opportunity OR hiring OR "send cv")';
                
                console.log(`   Old Query: ${triggerNode.parameters.filters.q}`);
                console.log(`   New Query: ${newQuery}`);
                
                triggerNode.parameters.filters.q = newQuery;
                modified = true;
            }
        }

        // 2. Update "Check for Recruiter Keywords" (Make regex more robust)
        const filterNode = workflow.nodes.find(n => n.name === 'Check for Recruiter Keywords');
        if (filterNode) {
            console.log('Updating Keyword Filters...');
            
            // We want to ensure "send cv" and simple "job" requests are caught.
            // The existing regex was: /(opportunity|role|contract|position|hiring|remote|hybrid|inside ir35|outside ir35)/i
            // We will merge and expand.

            const newRegex1 = "/(opportunity|role|contract|position|hiring|remote|hybrid|inside ir35|outside ir35|job|work|project|requirement|vacancy)/i";
            const newRegex2 = "/(rate|salary|per day|day rate|cv|resume|referral fee|send cv|share cv|attach cv|forward cv)/i";

            // Update parameters
            if (filterNode.parameters.conditions && filterNode.parameters.conditions.string) {
                const conditions = filterNode.parameters.conditions.string;
                
                // Update the first condition (Roles/Opportunities)
                if (conditions[0]) {
                    conditions[0].value2 = newRegex1;
                }
                
                // Update the second condition (CV/Rate related)
                if (conditions[1]) {
                    conditions[1].value2 = newRegex2;
                }

                // Remove the "notContains rifaterdemsahin" rule if we want to allow testing from self
                // Finding and removing the rule we just added in step 290, so the user can test.
                console.log('   Removing self-exclusion filter to allow testing...');
                filterNode.parameters.conditions.string = conditions.filter(c => 
                    !c.value2.includes('rifaterdemsahin') && !c.value2.includes('Rifat Erdem Sahin')
                );

                modified = true;
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
            console.log('✅ Success! Trigger broadened and filters updated to catch all CV/Job requests.');
        } else {
            console.log('No changes were necessary.');
        }

    } catch (error) {
        console.error('Update failed:', error.message);
    }
}

broadenScope();
