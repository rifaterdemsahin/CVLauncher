const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';
// Use the most recent file we know exists from the pull command
const backupFile = 'respond_to_job_offers_in_gmail_CVD1ecv1GNe9uF4a_2026-01-26T19-12-41-594Z_final_pull.json';
const backupPath = path.resolve(__dirname, 'backups', backupFile);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function addNoReplyFilter() {
    try {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        const rawData = fs.readFileSync(backupPath, 'utf8');
        const workflow = JSON.parse(rawData);

        // 1. Create "Is Automated?" Node
        const isAutomatedNode = {
            "parameters": {
                "conditions": {
                    "string": [
                        {
                            "value1": "={{ ($json.from.text || $json.from || '').toLowerCase() }} {{ ($json.subject || '').toLowerCase() }}",
                            "operation": "regex",
                            "value2": "/(no[-_.]?reply|do[-_.]?not[-_.]?reply|auto(mated)?|notification|alert|confirm(ation)?|receipt|invoice|subscriptions?|mailer[-_.]?daemon|postmaster|daemon|updates?@|news(letter)?)/i"
                        }
                    ]
                }
            },
            "name": "Is Automated?",
            "type": "n8n-nodes-base.if",
            "typeVersion": 1,
            "position": [
                100, // X: Between Start (-64) and Check keywords (256)
                -96  // Y: Aligned
            ],
            "id": "node-is-automated-check"
        };

        // 2. Create "Notify Ignored" Node
        const notifyIgnoredNode = {
            "parameters": {
                "chatId": "-1002793496878",
                "text": "🔕 <b>Ignored Automated Email</b>\n\n<b>From:</b> {{ ($json.from.text || $json.from || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }}\n<b>Subject:</b> {{ ($json[\"subject\"] || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }}\n\n<i>Reason: Detected as non-human/no-reply system.</i>",
                "additionalFields": {
                    "appendAttribution": false,
                    "parse_mode": "HTML"
                }
            },
            "name": "Notify Ignored",
            "type": "n8n-nodes-base.telegram",
            "typeVersion": 1.1,
            "position": [
                100,
                150
            ],
            "id": "node-notify-ignored",
            "credentials": {
                "telegramApi": {
                    "id": "FNhCBbEpIegop14Z",
                    "name": "Telegram account"
                }
            }
        };

        // Add new nodes
        workflow.nodes.push(isAutomatedNode);
        workflow.nodes.push(notifyIgnoredNode);

        // 3. Rewire Connections

        // Wire: Debug: Start -> Is Automated? (Instead of Check Keywords)
        if (workflow.connections["Debug: Start"]) {
            workflow.connections["Debug: Start"].main = [
                [
                    {
                        "node": "Is Automated?",
                        "type": "main",
                        "index": 0
                    }
                ]
            ];
        }

        // Wire: Is Automated?
        workflow.connections["Is Automated?"] = {
            "main": [
                [
                    {
                        "node": "Notify Ignored", // True -> Ignored
                        "type": "main",
                        "index": 0
                    }
                ],
                [
                    {
                        "node": "Check for Recruiter Keywords", // False -> Proceed
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        };

        // Wire: Notify Ignored (End of chain)
        workflow.connections["Notify Ignored"] = {
            "main": [[]]
        };

        // Push Update
        const payload = {
            name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            staticData: workflow.staticData,
        };

        console.log(`Pushing No-Reply Filter to ${url}...`);
        const response = await axios.put(url, payload, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Workflow version: ${response.data.id}`);

        const newFilename = backupFile.replace('_final_pull.json', '_patched_noreply_filter.json');
        fs.writeFileSync(path.resolve(__dirname, 'backups', newFilename), JSON.stringify(workflow, null, 2));

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

addNoReplyFilter();
