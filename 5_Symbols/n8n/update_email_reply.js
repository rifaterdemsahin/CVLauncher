const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';
const backupFile = 'respond_to_job_offers_in_gmail_CVD1ecv1GNe9uF4a_2026-01-26T17-42-04_patched_telegram_html_fix.json';
const backupPath = path.resolve(__dirname, 'backups', backupFile);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function updateEmailReply() {
    try {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        const rawData = fs.readFileSync(backupPath, 'utf8');
        const workflow = JSON.parse(rawData);

        let modified = false;

        workflow.nodes = workflow.nodes.map(node => {

            // Update "Reply with CV" Node
            if (node.name === 'Reply with CV') {

                // Revised Professional Email Body
                // 1. Removes the fake 'Word' link (as we only have PDFs).
                // 2. Improves the introductory text.
                // 3. Keeps the design clean.

                const newEmailBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #2c3e50; font-size: 16px;">
    <p>Hi,</p>
    
    <p>Thank you for reaching out regarding the <strong>{{ $node["Select Best CV"].json["techStack"] }}</strong> position.</p>

    <p>Based on the requirements, I believe my experience in <strong>DevOps, Cloud Architecture (Azure/AWS), and Generative AI</strong> would be a strong match. I have attached my CV related to this tech stack for your review.</p>

    <div style="margin: 25px 0; padding: 20px; background-color: #f8f9fa; border-left: 5px solid #007bff; border-radius: 4px;">
        <p style="margin: 0; font-size: 18px;">
            <strong>📄 <a href="{{ $json.downloadUrl }}" style="text-decoration: none; color: #007bff;">View CV (PDF)</a></strong>
        </p>
        <p style="margin: 10px 0 0 0; font-size: 16px;">
            📅 <a href="https://calendly.com/rifaterdem/schedule" style="text-decoration: none; color: #2c3e50;"><strong>Book a clear intro call</strong></a>
        </p>
    </div>

    <p>I specialize in building scalable, secure, and automated platforms for enterprise clients.</p>

    <p>I look forward to hearing from you.</p>

    <br>
    <p style="margin-bottom: 5px;">Best regards,</p>
    <p style="margin-top: 0;"><strong>Rifat Erdem Sahin</strong></p>
    <p style="font-size: 14px; color: #7f8c8d; margin-top: 5px;">
        Director | DevOps & Cloud Architect<br>
        <a href="tel:+447848024173" style="text-decoration: none; color: #7f8c8d;">+44 7848 024173</a> | 
        <a href="mailto:contact@rifaterdemsahin.com" style="text-decoration: none; color: #7f8c8d;">contact@rifaterdemsahin.com</a>
    </p>
    <p style="font-size: 14px; margin-top: 5px;">
        <a href="https://linkedin.com/in/rifaterdemsahin" style="text-decoration: none; color: #0077b5;">LinkedIn</a> | 
        <a href="https://github.com/rifaterdemsahin" style="text-decoration: none; color: #333;">GitHub</a>
    </p>
</div>
`;

                if (node.parameters.message !== newEmailBody) {
                    node.parameters.message = newEmailBody;
                    console.log('Updated "Reply with CV" email body with professional template.');
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

        console.log(`Pushing Email Reply Update to ${url}...`);
        const response = await axios.put(url, payload, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Update Successful! Workflow version: ${response.data.id}`);

        // Save local backup
        const newFilename = backupFile.replace('_patched_telegram_html_fix.json', '_patched_email_reply.json');
        fs.writeFileSync(path.resolve(__dirname, 'backups', newFilename), JSON.stringify(workflow, null, 2));

    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

updateEmailReply();
