const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';
const backupFile = 'respond_to_job_offers_in_gmail_CVD1ecv1GNe9uF4a_2026-01-26T17-42-04_patched_attachments.json';
const backupPath = path.resolve(__dirname, 'backups', backupFile);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function ensureDefaultCV() {
    try {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        const rawData = fs.readFileSync(backupPath, 'utf8');
        const workflow = JSON.parse(rawData);

        let modified = false;

        workflow.nodes = workflow.nodes.map(node => {

            if (node.name === 'Select Best CV') {

                // Define the robust JS Code
                const newJsCode = `
// 📄 Auto-generated CV Map from 5_Symbols/cvs
const cvMap = {
  "azure": "cv_azure_architect.pdf",
  "aws": "cv_aws_architect.pdf",
  "gcp": "cv_gcp_architect.pdf",
  "google": "cv_gcp_architect.pdf",
  "kubernetes": "cv_kubernetes_engineer.pdf",
  "k8s": "cv_kubernetes_engineer.pdf",
  "devops": "cv_devops_engineer.pdf",
  "platform": "cv_platform_engineer.pdf",
  "security": "cv_security_engineer.pdf",
  "cyber": "cv_cybersecurity_engineer.pdf",
  "data": "cv_data_engineer.pdf",
  "ai": "cv_ai_engineer.pdf",
  "llm": "cv_llm_engineer.pdf",
  "ml": "cv_ml_engineer.pdf",
  "sre": "cv_sre_engineer.pdf",
  "architect": "cv_cloud_architect.pdf",
  "consultant": "cv_cloud_consultant.pdf",
  
  // 🚨 DEFAULT FALLBACK
  "default": "cv_ai_engineer.pdf"
};

const text = ($json.subject + " " + $json.snippet + " " + ($json.text || "")).toLowerCase();

// Initialize with Default (AI Engineer)
let selectedCV = cvMap.default;
let techStack = "AI Engineering"; // Default context

// 🧠 Smart Selection Logic
// Iterate through keys to find the first match in the text
for (const key in cvMap) {
    if (key !== 'default' && text.includes(key)) {
        selectedCV = cvMap[key];
        techStack = key.toUpperCase();
        if (techStack === 'K8S') techStack = 'KUBERNETES';
        if (techStack === 'ML') techStack = 'MACHINE LEARNING';
        if (techStack === 'LLM') techStack = 'LARGE LANGUAGE MODELS';
        break; 
    }
}

// Construct the Raw GitHub URL
const baseUrl = "https://raw.githubusercontent.com/rifaterdemsahin/CVLauncher/main/5_Symbols/cvs/";

return {
  json: {
    downloadUrl: baseUrl + selectedCV,
    fileName: selectedCV,
    techStack: techStack,
    ...$json // Keep original email data
  }
};
`;

                if (node.parameters.jsCode !== newJsCode) {
                    node.parameters.jsCode = newJsCode;
                    console.log('Updated "Select Best CV" logic to ensure robust default fallback.');
                    modified = true;
                }
            }

            return node;
        });

        if (!modified) {
            console.log('No updates needed.');
        }

        // Push Update
        const payload = {
            name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            staticData: workflow.staticData,
        };

        console.log(`Pushing Default CV Logic to ${url}...`);
        const response = await axios.put(url, payload, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Workflow version: ${response.data.id}`);

        // Save local backup
        const newFilename = backupFile.replace('_patched_attachments.json', '_patched_default_cv.json');
        fs.writeFileSync(path.resolve(__dirname, 'backups', newFilename), JSON.stringify(workflow, null, 2));

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

ensureDefaultCV();
