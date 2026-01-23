require('dotenv').config();
const axios = require('axios');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function fixBlockedNotification() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        // The Issue: "Notify Blocked" is connected to "Is Blacklisted?" (True output).
        // It tries to reference $node["Select Best CV"].
        // BUT "Is Blacklisted?" receives data from "Check Blacklist".
        // "Check Blacklist" receives data from "Select Best CV".
        // The graph lineage is conceptually correct: Select -> Check -> Is Blacklisted -> Notify Blocked.
        
        // HOWEVER, "Check Blacklist" node output REPLACES the item context.
        // It outputs the row found in Google Sheets.
        // It DOES NOT output the original "Select Best CV" data if a match is found (unless we merged it).
        // n8n's `$node["Node Name"]` helper often looks for the *execution data* of that previous node.
        // If the execution context is somehow severed or filtered weirdly, it fails.
        
        // BUT MORE LIKELY: When "Check Blacklist" finds a match, it outputs a NEW item (the sheet row).
        // The original item from "Select Best CV" is gone from the *current* item stream.
        // n8n can usually look back, but sometimes it struggles if the Paired Item matching fails.
        // Google Sheets node outputting a found row might not be "paired" with the input item in n8n's internal tracking.
        
        // SOLUTION: We need to Merge context for "Notify Blocked" just like we did for the happy path.
        // OR simpler: Just use the data available in the current node (if possible)?
        // Current node (Is Blacklisted?) has the sheet data. Does the sheet have "from" and "subject"?
        // No, the sheet has "email", "reason", etc. We don't have the subject there.
        
        // SO WE MUST RESTORE CONTEXT for the "Blocked" branch too.
        
        // 1. Find "Notify Blocked" node.
        const blockedNode = workflow.nodes.find(n => n.name === 'Notify Blocked');
        if (!blockedNode) {
            console.log('Error: Notify Blocked node not found.');
            return;
        }

        // 2. We can create a Merge Node before "Notify Blocked" OR...
        // 3. Just fix the "Check Blacklist" node to *include* input data?
        // Google Sheets "Get Many" usually replaces. 
        // We can't easily force it to merge without coding.
        
        // LET'S ADD A MERGE NODE for the Blocked path too.
        // Actually, we can reuse the "Restore Context" merge node?
        // No, that's for the FALSE (Happy) path.
        
        // SIMPLER FIX:
        // Why not run "Check Blacklist" in PARALLEL to "Select Best CV"? 
        // Then merge?
        // Flow:
        // Keywords -> Select Best CV (Output 1)
        // Keywords -> Check Blacklist (Output 2) -> Merge with (Output 1)
        
        // But we want to BLOCK if blacklisted.
        
        // OK, let's create "Restore Context Blocked" Merge Node.
        // It merges "Is Blacklisted?" (True) AND "Select Best CV".
        
        // Or... 
        // Can we just change the Telegram message to not use blocked variables?
        // "BLOCKED: Blacklisted Email Attempt. Action: No CV sent."
        // We lose "From" and "Subject". That's annoying for admin.
        
        // Let's do the Merge. Its robust.
        
        const restoreBlockedId = crypto.randomUUID();
        const restoreBlockedNode = {
           "parameters": {
                "mode": "mergeByPosition"
            },
            "name": "Restore Context Blocked",
            "type": "n8n-nodes-base.merge",
            "typeVersion": 2,
            "position": [ 200, -20 ], // Slightly above Notify Blocked
            "id": restoreBlockedId
        };
        
        workflow.nodes.push(restoreBlockedNode);
        
        // WIRING
        // 1. Is Blacklisted? (True/Index 0) -> Restore Context Blocked (Input 1)
        if (workflow.connections["Is Blacklisted?"]) {
             workflow.connections["Is Blacklisted?"].main[0] = [
                {
                    "node": "Restore Context Blocked",
                    "type": "main",
                    "index": 0
                }
            ];
        }
        
        // 2. Select Best CV -> Restore Context Blocked (Input 2)
        // Select Best CV already goes to "Check Blacklist" and "Restore Context" (Happy path).
        // Add a 3rd connection.
        if (workflow.connections["Select Best CV"]) {
            workflow.connections["Select Best CV"].main[0].push({
                "node": "Restore Context Blocked",
                "type": "main",
                "index": 1
            });
        }
        
        // 3. Restore Context Blocked -> Notify Blocked
        workflow.connections["Restore Context Blocked"] = {
            "main": [
                [
                    {
                        "node": "Notify Blocked",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        };
        
        // 4. Update Notify Blocked Text to use Merged Data
        // Now it can use {{ $json["from"] }} directly or stick with $node lookup which is now valid.
        // Let's switch to $json for safety as it's immediate parent.
        blockedNode.parameters.text = "=🚫 BLOCKED: Blacklisted Email Attempt\n\nFrom: {{ $json[\"from\"] }}\nSubject: {{ $json[\"subject\"] }}\n\nAction: No CV sent.";

        const payload = {
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            name: workflow.name
        };

        await axios.put(`${baseUrl}/workflows/${targetWorkflowId}`, payload, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });

        console.log('✅ Success! Added Merge Node for Blocked notifications to restore context.');

    } catch (error) {
        console.error('Update failed:', error.message);
    }
}

fixBlockedNotification();
