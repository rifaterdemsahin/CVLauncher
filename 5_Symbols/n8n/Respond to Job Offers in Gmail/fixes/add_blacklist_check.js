require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function addBlacklist() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        // 1. Check if already added
        if (workflow.nodes.find(n => n.name === 'Check Blacklist')) {
            console.log('Blacklist check already exists.');
            return;
        }

        // 2. Create Google Sheets Node
        const blacklistNode = {
            "parameters": {
                "authentication": "serviceAccount", // Defaulting to Service Account, user usually prefers this or OAuth
                "operation": "getMany",
                "documentId": {
                    "__rl": true,
                    "value": "1inzRAo0s1ov4Pz155QwiST7wpYBvjNYSPsU4ag-4Mok",
                    "mode": "id"
                },
                "sheetName": {
                    "__rl": true,
                    "value": "gid=0",
                    "mode": "name"
                },
                "filters": {
                    "conditions": [
                        {
                            "key": "email",
                            "operator": "eq",
                            "value": "={{ $json.from }}" // "from" flows from the previous node
                        }
                    ]
                },
                "options": {
                    "returnAllMatches": "never" // We only need to know if 1 exists
                }
            },
            "name": "Check Blacklist",
            "type": "n8n-nodes-base.googleSheets",
            "typeVersion": 4.5, // Standard modern version
            "position": [ -100, -200 ], // Between Keywords (-240) and Select CV (-32)
            "id": crypto.randomUUID(),
             "credentials": {
                "googleApi": {
                    "id": "", // User must fill this!
                    "name": "Google Sheets Account"
                }
            },
            "continueOnFail": true // If sheet lookup fails (e.g. no match found error), continue so we can check results
        };

        // 3. Create IF Node (Is Blacklisted?)
        const ifNode = {
            "parameters": {
                "conditions": {
                    "boolean": [
                        {
                            "value1": "={{ $json[\"email\"] ? true : false }}", // If email column exists in output, it was found
                            "value2": true
                        }
                    ]
                }
            },
            "name": "Is Blacklisted?",
            "type": "n8n-nodes-base.if",
            "typeVersion": 1,
            "position": [ 50, -200 ], 
            "id": crypto.randomUUID()
        };
        
        // 4. Create Sticky Note for User
        const guideNote = {
            "parameters": {
                "content": "## ⚠️ Action Required\n**Configure Google Sheets Credentials** for 'Check Blacklist' node.\n\nSheet ID: `1inzRAo0s1ov4Pz155QwiST7wpYBvjNYSPsU4ag-4Mok`",
                "height": 160,
                "width": 300,
                "color": 6 // Red/Warning
            },
            "id": crypto.randomUUID(),
            "name": "Credential Warning",
            "type": "n8n-nodes-base.stickyNote",
            "typeVersion": 1,
            "position": [ -100, -400 ]
        };

        workflow.nodes.push(blacklistNode, ifNode, guideNote);

        // 5. Rewire Connections
        // Current: Check for Recruiter Keywords -> Select Best CV
        // New: Check for Recruiter Keywords -> Check Blacklist -> Is Blacklisted? --(false)--> Select Best CV

        // A. Remove connection Keywords -> Select Best CV
        const keywordsConnection = workflow.connections["Check for Recruiter Keywords"];
        if (keywordsConnection && keywordsConnection.main) {
             // Remove the connection to "Select Best CV"
             keywordsConnection.main[0] = keywordsConnection.main[0].filter(c => c.node !== 'Select Best CV');
        }

        // B. Connect Keywords -> Check Blacklist
        // Note: Keywords also connects to other things (maybe?), so we append or replace.
        // It connects to "Select Best CV". We removed that. Now add "Check Blacklist".
        keywordsConnection.main[0].push({
            "node": "Check Blacklist",
            "type": "main",
            "index": 0
        });

        // C. Connect Check Blacklist -> Is Blacklisted?
        workflow.connections["Check Blacklist"] = {
            "main": [
                [
                    {
                        "node": "Is Blacklisted?",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        };

        // D. Connect Is Blacklisted? (False) -> Select Best CV
        // False output is index 1
        workflow.connections["Is Blacklisted?"] = {
            "main": [
                [], // True (index 0) - Stop (Empty)
                [   // False (index 1) - Continue
                    {
                        "node": "Select Best CV",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        };
        
        // E. Fix "Select Best CV" references
        // Since we injected nodes, $json.from might not be available directly if we don't pass it through.
        // Google Sheets node replaces output. 
        // We need to merge data or use "Execute Once" to keep context, but n8n nodes usually consume input.
        // Actually, "Select Best CV" uses: `const text = ($json.subject + " " + $json.snippet).toLowerCase();`
        // If Google Sheets returns the found row, $json will start containing `email`, `reason` etc, NOT `subject` and `snippet`.
        
        // CRITICAL FIX: "Select Best CV" needs the original email data.
        // We should just use the "Is Blacklisted?" node pass-through? 
        // No, If node passes the input data (the sheet row).
        
        // Better approach:
        // Use a "Merge" node or ensure Google Sheets node appends data?
        // Or simpler: Use "Select Best CV" *first*, then check blacklist before "Reply"?
        // But "Select Best CV" is harmless. "Reply" is the action.
        
        // Let's place Blacklist Check *after* "Select Best CV" but *before* "Download from GitHub"/"Reply".
        // Flow: Keywords -> Select CV -> Blacklist -> Download -> Reply.
        // "Select Best CV" returns: `{ downloadUrl, fileName, techStack, ...$json }` (It preserves original).
        // So passing through Select CV is safe!
        
        // LET'S RETRY WIRING PLAN:
        // Keywords -> Select Best CV -> Check Blacklist -> Is Blacklisted? --(false)--> Download from GitHub
        
        // Undo previous wiring logic in memory:
        // Reload workflow to be clean? No, let's just adjust logic below.
        
        // Valid Wiring Plan:
        // 1. Remove connection `Select Best CV` -> `Download from GitHub`.
        // 2. Connect `Select Best CV` -> `Check Blacklist`.
        // 3. Connect `Check Blacklist` -> `Is Blacklisted?`.
        // 4. Connect `Is Blacklisted?` (False) -> `Download from GitHub`.
        
        // Wait, `Check Blacklist` (Google Sheets) replaces output. 
        // If it finds a match, it returns Sheet Row. If not, it might return empty or error.
        // If it replaces output, we lose `downloadUrl`.
        
        // Solution: Use "Keep Only Set" option? Or simply use the n8n expression `$node["Select Best CV"].json` in downstream nodes.
        // Downstream nodes:
        // - Download from GitHub: uses `{{ $json.downloadUrl }}` -> Need to update to `{{ $node["Select Best CV"].json.downloadUrl }}`
        // - Reply with CV: uses `{{ $json.downloadUrl }}` (via template I set up) -> Need to update to `{{ $node["Select Best CV"].json.downloadUrl }}`
        
        // Actually, my `fix_node_references.js` already updated Reply/MarkRead/Telegram to use `$node["Select Best CV"]`.
        // So "Reply with CV" is safe!
        // "Download from GitHub" uses `$json.downloadUrl`. I need to fix that too.

        // Wiring Implementation (Modified Plan):
        // 1. Remove `Select Best CV` -> `Download from GitHub`
        if (workflow.connections["Select Best CV"]) {
            workflow.connections["Select Best CV"].main[0] = [];
        }
        
        // 2. Connect `Select Best CV` -> `Check Blacklist`
        workflow.connections["Select Best CV"].main[0].push({
            "node": "Check Blacklist",
            "type": "main",
            "index": 0
        });

        // 3. Connect `Check Blacklist` -> `Is Blacklisted?` (Already defined above)
        
        // 4. Connect `Is Blacklisted?` (False) -> `Download from GitHub`
        // Already defined above slightly differently, let's reset:
         workflow.connections["Is Blacklisted?"] = {
            "main": [
                [], // True (Found in blacklist) -> Stop
                [   // False (Not found) -> Continue
                    {
                        "node": "Download from GitHub",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        };

        // 5. Update `Download from GitHub` to use explicit reference
        const downloadNode = workflow.nodes.find(n => n.name === 'Download from GitHub');
        if (downloadNode) {
            downloadNode.parameters.url = '={{ $node["Select Best CV"].json["downloadUrl"] }}';
        }
        
        // Also update blacklist node position
        blacklistNode.position = [ 200, -500 ]; // Above Download
        ifNode.position = [ 200, -300 ];

        const payload = {
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            name: workflow.name
        };

        await axios.put(`${baseUrl}/workflows/${targetWorkflowId}`, payload, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        console.log('✅ Success! Integrated Blacklist Check using Google Sheets.');
        console.log('⚠️  User Action Needed: Configure Credentials in "Check Blacklist" node.');

    } catch (error) {
        console.error('Update failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

addBlacklist();
