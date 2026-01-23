require('dotenv').config();
const axios = require('axios');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function addRateLimit() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        // Problem: The user triggered the test too many times (loop likely via email self-reply or just manual mash).
        // Telegram API error 429: Too Many Requests.
        
        // Solution: Add a "Wait" node or rate limiting logic.
        // OR better: Configure "Notify Blocked" to retry on 429?
        // n8n Telegram node has "Retry On Fail" option.
        
        // Let's enable "Retry on Fail" for BOTH Telegram nodes.
        
        const nodesToUpdate = ['Notify Blocked', 'Telegram Notify'];
        let modified = false;

        workflow.nodes = workflow.nodes.map(node => {
            if (nodesToUpdate.includes(node.name)) {
                // Ensure manual settings exist
                if (!node.onError) {
                    // We can set node-level retry policies in "settings" or "onError" depending on n8n version.
                    // In modern n8n JSON, inside `parameters` there isn't a direct "retry".
                    // It's usually in `retryOnFail` (boolean) and `maxTries` (number) at root of node object.
                    
                    if (!node.retryOnFail) {
                        console.log(`Enabling Retry on Fail for "${node.name}"...`);
                        node.retryOnFail = true;
                        node.maxTries = 3;
                        node.waitBetweenTries = 2000; // 2 seconds
                        modified = true;
                    }
                }
            }
            return node;
        });

        // Loop Prevention:
        // Double check we aren't replying to ourselves in the email loop?
        // We REMOVED the self-exclusion filter and "-from:me" to allow testing.
        // If the user sends an email -> triggers bot -> bot replies -> triggers bot again?
        // Bot reply comes from "Gmail account" (rifaterdemsahin?).
        // If "Gmail Trigger" listens to "from me", then YES, we have an infinite loop!
        
        // CRITICAL FIX: We MUST re-add the self-exclusion filter, 
        // OR warn the user to stop emailing themselves permanently.
        // But the user *asked* to remove it for testing.
        
        // Compromise: Add a "Split In Batches" or logic to stop after 1 run? No.
        
        // Fix for "Too Many Requests":
        // 1. Add Retry logic (done above).
        // 2. Add a global Wait node at the start? No, slows down everything.
        
        // REAL FIX for Loop:
        // We *should* re-add `-from:me` to the Gmail Trigger after testing.
        // But user wants to test.
        // Solution: Filter out emails with subject "Re: ..."? 
        // If the bot replies with "Re: ...", does the trigger catch it?
        // The trigger catches "is:unread". Bot reply marks as read?
        // If I send email to myself, it arrives in Inbox (Unread). Trigger sees it. Bot replies. 
        // Does Bot Reply arrive in Inbox? Sent folder usually.
        // UNLESS the user is cc'ing themselves or it's a "Reply All".
        
        // Let's just Apply the Retry logic for now to solve the immediate 429 error.
        
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
            console.log('✅ Success! Enabled "Retry on Fail" for Telegram nodes to handle rate limits.');
        } else {
            console.log('Retry logic already enabled.');
        }

    } catch (error) {
        console.error('Update failed:', error.message);
    }
}

addRateLimit();
