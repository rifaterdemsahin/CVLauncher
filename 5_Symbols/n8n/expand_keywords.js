const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';
const backupFile = 'respond_to_job_offers_in_gmail_CVD1ecv1GNe9uF4a_2026-01-26T17-42-04_patched_telegram_enhanced.json';
const backupPath = path.resolve(__dirname, 'backups', backupFile);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function expandKeywords() {
    try {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        const rawData = fs.readFileSync(backupPath, 'utf8');
        const workflow = JSON.parse(rawData);

        let modified = false;

        // Define the expanded list of keywords based on user request and CV analysis
        const keywords = [
            // Original High Intent
            'opportunity', 'role', 'contract', 'position', 'hiring', 'remote', 'hybrid',
            'inside ir35', 'outside ir35', 'job', 'work', 'project', 'requirement', 'vacancy',

            // Financials/Action
            'rate', 'salary', 'per day', 'day rate', 'cv', 'resume', 'referral fee',
            'send cv', 'share cv', 'attach cv', 'forward cv',

            // Technical/Niche (AI & GenAI)
            'prompt engineer', 'genai', 'generative ai', 'llm', 'large language model',
            'rag', 'retrieval augmented generation', 'ai engineer', 'artificial intelligence',
            'machine learning', 'ml', 'nlp', 'chatgpt', 'openai',

            // DevOps & Cloud (From CV)
            'devops', 'sysops', 'sre', 'site reliability', 'cloud computing', 'cloud',
            'aws', 'azure', 'gcp', 'google cloud', 'kubernetes', 'k8s', 'docker',
            'infrastructure as code', 'iac', 'terraform', 'ansible',
            'ci/cd', 'continuous integration', 'continuous delivery', 'pipeline',
            'automation', 'python', 'scripting',

            // Roles & Leadership (From CV)
            'architect', 'lead', 'principal', 'manager', 'director', 'consultant', 'instructor', 'trainer'
        ];

        // Escape special regex characters (like / in ci/cd) and join with pipe
        const regexPattern = keywords
            .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape mostly everything
            .join('|');

        const finalRegex = `/${regexPattern}/i`;

        workflow.nodes = workflow.nodes.map(node => {
            if (node.name === 'Check for Recruiter Keywords') {

                // We assume the logic was already consolidated in previous steps.
                // We just need to update the regex string in the conditions.

                const conditions = node.parameters.conditions.string;
                if (conditions && conditions.length > 0) {
                    // Update the unified condition
                    if (conditions[0].value2 !== finalRegex) {
                        conditions[0].value2 = finalRegex;
                        console.log(`Expanded Keywords Regex to include ${keywords.length} terms.`);
                        modified = true;
                    }
                }
            }
            return node;
        });

        if (!modified) {
            console.log('No updates needed (Regex might already be up to date).');
        }

        // Push Update
        const payload = {
            name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            staticData: workflow.staticData,
        };

        console.log(`Pushing Keyword Expansion to ${url}...`);
        const response = await axios.put(url, payload, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Workflow version: ${response.data.id}`);

        // Save local backup
        const newFilename = backupFile.replace('_patched_telegram_enhanced.json', '_patched_keywords_expanded.json');
        fs.writeFileSync(path.resolve(__dirname, 'backups', newFilename), JSON.stringify(workflow, null, 2));

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

expandKeywords();
