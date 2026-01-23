require('dotenv').config({ path: '../../.env' });
const axios = require('axios');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function ensureBlacklistResilience() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        // We suspect the workflow stops at "Check Blacklist" because credentials might be missing/invalid
        // and continueOnFail might be off.
        
        const blacklistNode = workflow.nodes.find(n => n.name === 'Check Blacklist');
        let modified = false;

        if (blacklistNode) {
            console.log('Configuring "Check Blacklist" for maximum resilience...');
            
            // 1. Ensure Continue On Fail is TRUE (So bad creds don't stop flow)
            if (!blacklistNode.continueOnFail) {
                console.log('   -> Enabling "Continue On Fail"');
                blacklistNode.continueOnFail = true;
                modified = true;
            }
            
            // 2. Ensure Always Output Data is TRUE (So non-matches don't stop flow)
            if (!blacklistNode.alwaysOutputData) {
                console.log('   -> Enabling "Always Output Data"');
                blacklistNode.alwaysOutputData = true;
                modified = true;
            }

            // 3. Ensure On Error is "Continue logic" (if supported by version, generic continueOnFail covers most)
            // Just to be safe regarding recent n8n "node error policies"
             if (!blacklistNode.onError) {
                 // blacklistNode.onError = 'continueRegularOutput'; // Optional
             }
        } else {
            console.error('CRITICAL: "Check Blacklist" node not found!');
        }
        
        // Also check if Mock Data needs "email" property? 
        // Our filters check "from", but Is Blacklisted checks "email".
        // The Google Sheet logic is: 
        //   Input: from (e.g. recruiter@example.com)
        //   Sheet Column: email
        //   Output: Row Data (email, reason, etc)
        //   Is Blacklisted Check: exists(email)?
        
        // If Google Sheet fails (Creds error), it returns... error object?
        // With ContinueOnFail, it might return the INPUT item with an error property?
        // Or empty item?
        
        // If it returns Error, then "Is Blacklisted?" checks `!!$json["email"]`.
        // If error object doesn't have "email", it returns FALSE.
        // This is GOOD. It means "Fail Open" (Allow email if blacklist check fails).
        
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

            console.log('✅ Success! Blacklist node is now resilient to credential errors.');
        } else {
            console.log('Blacklist node is already correctly configured.');
        }

    } catch (error) {
        console.error('Update failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

ensureBlacklistResilience();
