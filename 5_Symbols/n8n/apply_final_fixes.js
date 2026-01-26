const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';
// We start with the telegram patched version as base or the latest reliable one
const baseFile = 'respond_to_job_offers_in_gmail_CVD1ecv1GNe9uF4a_2026-01-26T17-42-04_patched_telegram_from.json';
const backupPath = path.resolve(__dirname, 'backups', baseFile);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function applyFinalFixes() {
    try {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        console.log(`Reading base file: ${baseFile}`);
        const rawData = fs.readFileSync(backupPath, 'utf8');
        const workflow = JSON.parse(rawData);

        let modified = false;

        // --- KEYWORD LIST ---
        // Added specifically: prompt engineer, genai, llm, rag, artificial intelligence, ai engineer
        const keyWords = [
            // Original High Intent
            'opportunity', 'role', 'contract', 'position', 'hiring', 'remote', 'hybrid',
            'inside ir35', 'outside ir35', 'job', 'work', 'project', 'requirement', 'vacancy',
            // Financials/Action
            'rate', 'salary', 'per day', 'day rate', 'cv', 'resume', 'referral fee',
            'send cv', 'share cv', 'attach cv', 'forward cv',
            // Technical/Niche (NEW)
            'prompt engineer', 'genai', 'generative ai', 'llm', 'large language model',
            'rag', 'retrieval augmented generation', 'ai engineer', 'artificial intelligence'
        ];

        const unifiedRegex = `/(${keyWords.join('|')})/i`;

        workflow.nodes = workflow.nodes.map(node => {

            // Fix 1: Blacklist Node (Read -> Lookup)
            if (node.name === 'Check Blacklist') {
                if (node.parameters.operation !== 'lookup') {
                    node.parameters.operation = 'lookup';
                    node.parameters.lookupColumn = 'email';
                    // Robust email extraction
                    node.parameters.lookupValue = "={{ ($json.from?.text || $json.from?.value?.[0]?.address || $json.from || $json.body?.from || '').replace(/.*<(.+)>.*/, '$1') }}";
                    console.log('✅ Fixed "Check Blacklist" operation (Read -> Lookup)');
                    modified = true;
                }
            }

            // Fix 2: Keyword Logic (Consolidate + Add New Keywords)
            if (node.name === 'Check for Recruiter Keywords') {
                const unifiedExpression = "={{ [ $json.subject, $json.snippet, $json.text, $json.body?.subject, $json.body?.snippet, $json.body?.body, (typeof $json.body === 'string' ? $json.body : '') ].filter(Boolean).join(' ').toLowerCase() }}";

                // Check if we need to update
                const currentConditions = JSON.stringify(node.parameters.conditions);
                const newConditionsObj = {
                    "string": [
                        {
                            "value1": unifiedExpression,
                            "operation": "regex",
                            "value2": unifiedRegex
                        }
                    ]
                };

                // Apply update
                node.parameters.conditions = newConditionsObj;
                node.parameters.combinator = "any";
                console.log('✅ Updated "Check for Recruiter Keywords" with new keywords (Prompt Engineer, GenAI, etc.)');
                modified = true;
            }

            // Fix 3: Debug Nodes (Enhance Output)
            if (node.name.startsWith('Debug:')) {
                const cleanName = node.name;
                let newCode = `
const nodeName = "${cleanName}";
console.log('🔹 ' + nodeName + ' Hit');
return items.map(item => {
    return {
        json: {
            debugNode: nodeName,
            ...item.json
        }
    }
});`;
                if (node.name === "Debug: Keywords Failed") {
                    newCode = `
const nodeName = "${cleanName}";
console.log('❌ ' + nodeName + ' Hit');
return items.map(item => {
    return {
        json: {
            debugNode: nodeName,
            debugMessage: "❌ FAILURE: Recruiter Keywords Check Failed",
            originalData: item.json
        }
    }
});`;
                }

                if (node.parameters.jsCode !== newCode) {
                    node.parameters.jsCode = newCode;
                    console.log(`✅ Updated Debug Node: ${node.name}`);
                    modified = true;
                }
            }

            return node;
        });

        if (!modified) {
            console.log('No changes were necessary (already applied?); forcing push anyway to be sure.');
        }

        // Push Update
        const payload = {
            name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            staticData: workflow.staticData,
        };

        console.log(`Pushing Final Fixes to n8n...`);
        const response = await axios.put(url, payload, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Workflow version: ${response.data.id}`);

        // Save local backup
        const newFilename = baseFile.replace('_patched_telegram_from.json', '_patched_final_fixes.json');
        fs.writeFileSync(path.resolve(__dirname, 'backups', newFilename), JSON.stringify(workflow, null, 2));
        console.log(`Backup saved to: ${newFilename}`);

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

applyFinalFixes();
