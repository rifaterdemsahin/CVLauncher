const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';
const backupFile = 'respond_to_job_offers_in_gmail_CVD1ecv1GNe9uF4a_2026-01-26T17-42-04_patched_debug_links.json';
const backupPath = path.resolve(__dirname, 'backups', backupFile);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function fixAttachmentConfig() {
    try {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        const rawData = fs.readFileSync(backupPath, 'utf8');
        const workflow = JSON.parse(rawData);

        let modified = false;

        workflow.nodes = workflow.nodes.map(node => {

            // 1. Fix "Download from GitHub"
            // Ensure it outputs a binary property named 'data'
            if (node.name === 'Download from GitHub') {
                if (!node.parameters.options) node.parameters.options = {};

                // Check if responseFormat is 'file'
                // Note: property name might differ based on n8n version, but 'responseFormat': 'file' is standard for HTTP Request node v4
                if (node.parameters.options.responseFormat !== 'file') {
                    node.parameters.options.responseFormat = 'file';
                    console.log('Set Download from GitHub responseFormat to file.');
                    modified = true;
                }

                // Ideally set the binary property name if possible, default is usually 'data' 
            }

            // 2. Fix "Reply with CV"
            // Ensure it uses the binary attachment from the input
            if (node.name === 'Reply with CV') {
                if (!node.parameters.options) node.parameters.options = {};

                // Gmail Node v2 usually allows adding attachments via UI options
                // We need to ensure logic is set to pick up binary data

                // Since we cannot see deep into UI helper structures in JSON sometimes,
                // we set the 'attachments' parameter if it's missing or incorrect.
                // For Gmail node, it often looks for 'attachments' array or 'binaryData' boolean.

                // Let's assume the standard way:
                // We need to tell it to use the binary property 'data'.

                // NOTE: In n8n JSON for Gmail node, attachments might be a complex object or just a boolean toggle "binaryData": true

                // Let's try to set `attachments` property if possible, or `options.attachments`.

                // Looking at n8n-nodes-base structure for Gmail:
                // Input: "binary" -> "data"

                // We will enable 'attachments' option:
                const attachmentsConfig = {
                    "binaryData": true,
                    "binaryPropertyName": "data"
                };

                // We can't know for sure the exact internal JSON structure without docs, 
                // but often it's under `parameters.options.attachments`.

                // Let's verify if `attachments` is already there.
                // In the JSON viewed, `Reply with CV` has `parameters.options: {}`.

                // We will try to add the attachment configuration to `parameters`.
                // Common pattern:
                // parameters: {
                //   ...
                //   attachments: [
                //     {
                //       binaryPropertyName: "data"
                //     }
                //   ]
                // }

                const newAttachments = [
                    {
                        "binaryPropertyName": "data"
                    } // We assume the Download node creates property 'data'
                ];

                // Check if attachments is explicitly set
                if (!node.parameters.attachmentsHtml) {
                    // The parameter name varies. For Gmail API node it's often 'attachmentsUi' or just 'attachments'.
                    // Let's try standard 'attachments'.
                    node.parameters.attachments = newAttachments;
                    console.log('Enabled Attachments in Reply with CV node.');
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

        console.log(`Pushing Attachment Config Update to ${url}...`);
        const response = await axios.put(url, payload, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Workflow version: ${response.data.id}`);

        // Save local backup
        const newFilename = backupFile.replace('_patched_debug_links.json', '_patched_attachments.json');
        fs.writeFileSync(path.resolve(__dirname, 'backups', newFilename), JSON.stringify(workflow, null, 2));

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

fixAttachmentConfig();
