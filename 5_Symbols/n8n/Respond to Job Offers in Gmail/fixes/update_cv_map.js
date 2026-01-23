require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

// Map based on actual files found in 5_Symbols/cvs
const newCvMapCode = `
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
  "default": "cv_devops_engineer.pdf"
};

const text = ($json.subject + " " + $json.snippet).toLowerCase();
let selectedCV = cvMap.default;
let techStack = "General DevOps";

// 🧠 Smart Selection Logic
// Iterate through keys to find the first match in the text
for (const key in cvMap) {
    if (key !== 'default' && text.includes(key)) {
        selectedCV = cvMap[key];
        techStack = key.toUpperCase();
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

async function updateCvMap() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        // Find the "Select Best CV" node
        const codeNode = workflow.nodes.find(n => n.name === 'Select Best CV');
        if (!codeNode) {
            console.error('Error: "Select Best CV" node not found.');
            return;
        }

        // Update the code
        console.log('Updating Code Node...');
        codeNode.parameters.jsCode = newCvMapCode;

        // Send update
        const payload = {
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            name: workflow.name
        };

        await axios.put(`${baseUrl}/workflows/${targetWorkflowId}`, payload, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });

        console.log('✅ Success! CV Map updated with real file names.');

    } catch (error) {
        console.error('Update failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

updateCvMap();
