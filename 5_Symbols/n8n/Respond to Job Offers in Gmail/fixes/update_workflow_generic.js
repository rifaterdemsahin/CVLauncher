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

// Generic template that dynamically inserts the role/tech stack found
const genericEmailBodyHtml = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <p>Thank you for reaching out regarding the <strong>{{ $node["Select Best CV"].json["techStack"] }}</strong> opportunity.</p>
    <p>I’ve linked my relevant CV and related documents for your review. If you’d prefer to communicate directly or find email inconvenient, feel free to call me.</p>

    <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #007bff;">
        <p><strong>📄 <a href="{{ $json.downloadUrl }}" style="text-decoration: none; color: #007bff; font-weight: bold;">View CV (PDF)</a></strong></p>
        <p><strong>🔗 <a href="{{ $json.downloadUrl }}" style="text-decoration: none; color: #007bff; font-weight: bold;">Download CV (Word)</a></strong></p>
        <p><strong>🖥️ <a href="https://rifaterdemsahin.com/presentation" style="text-decoration: none; color: #007bff; font-weight: bold;">Presentation (PDF)</a></strong></p>
        <p><strong>📅 <a href="https://calendly.com/rifaterdem/schedule" style="text-decoration: none; color: #007bff; font-weight: bold;">Schedule on Calendly</a></strong></p>
        <p><strong>📞 <a href="tel:+447848024173" style="text-decoration: none; color: #007bff; font-weight: bold;">+44 7848 024173</a></strong></p>
    </div>

    <h2 style="color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px;">CV Summary</h2>
    <p><strong>Erdem Sahin — CV Summary</strong></p>
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
            <td style="padding: 5px 0;">🇬🇧 <strong>Citizenship:</strong> British</td>
            <td style="padding: 5px 0;">📍 <strong>Location:</strong> London, United Kingdom</td>
        </tr>
        <tr>
            <td style="padding: 5px 0;">✉️ <strong>Email:</strong> <a href="mailto:contact@rifaterdemsahin.com">contact@rifaterdemsahin.com</a></td>
            <td style="padding: 5px 0;">📞 <strong>Phone:</strong> +44 7848 024173</td>
        </tr>
        <tr>
            <td style="padding: 5px 0;">🔗 <strong>LinkedIn:</strong> <a href="https://linkedin.com/in/rifaterdemsahin">rifaterdemsahin</a></td>
            <td style="padding: 5px 0;">🐙 <strong>GitHub:</strong> <a href="https://github.com/rifaterdemsahin">rifaterdemsahin</a></td>
        </tr>
    </table>

    <h3 style="color: #2c3e50;">Professional Profile</h3>
    <p>An experienced engineer with deep expertise in CI/CD, DevOps, and AI-based architectures, with a proven track record in optimizing and automating enterprise systems. Focused on automation, scalability, and security across both cloud and on-premise solutions.</p>

    <h3 style="color: #2c3e50;">Core Competencies</h3>
    <ul style="list-style-type: none; padding: 0;">
        <li style="margin-bottom: 8px;">🤖 Deep expertise in building and deploying Generative AI solutions; extensive hands-on experience developing LLM applications.</li>
        <li style="margin-bottom: 8px;">🔄 Advanced implementation of RAG architectures, vector databases, and modern LLM frameworks.</li>
        <li style="margin-bottom: 8px;">🔒 Expert-level AI security practices: prompt-injection prevention, data privacy controls, secure model deployment.</li>
        <li style="margin-bottom: 8px;">🏗️ Enterprise architecture leadership with focus on scalable, maintainable AI solutions.</li>
        <li style="margin-bottom: 8px;">🧪 Mastery of testing across unit, integration, and end-to-end, ensuring robust AI deployments.</li>
        <li style="margin-bottom: 8px;">👥 Collaborative team player with agile delivery of complex AI projects.</li>
    </ul>

    <h3 style="color: #2c3e50;">Key Accomplishments</h3>
    <ul style="list-style-type: none; padding: 0;">
        <li style="margin-bottom: 8px;">🏆 <strong>2024:</strong> AI-driven CI/CD framework for Goldman Sachs (Muscat, Oman), 300% higher deployment frequency and 30% cost reduction.</li>
        <li style="margin-bottom: 8px;">🏆 <strong>2023:</strong> IoT migrations and workflow optimization at Ypsomed (Switzerland); 40% fewer versioning conflicts.</li>
        <li style="margin-bottom: 8px;">🏆 <strong>2022:</strong> Automated ETL for Cushman & Wakefield (London, UK); 50% faster data processing.</li>
        <li style="margin-bottom: 8px;">🏆 <strong>2021:</strong> Kubernetes + GPU containers for Emerson (USA); 45% efficiency improvement.</li>
        <li style="margin-bottom: 8px;">🏆 <strong>2016:</strong> Enterprise Transformation Architect at Microsoft; 50% increase in technology utilization.</li>
    </ul>

    <h3 style="color: #2c3e50;">Skills & Certifications</h3>
    <p><strong>Core Skills:</strong> DevOps, Transformation Specialist, SRE, Security Clearance, AI Consultant.</p>
    <p><strong>Technical Expertise:</strong> CI/CD, AI Integration, Cloud Computing, Infrastructure as Code, Kubernetes, Docker, Data Engineering.</p>
    <p><strong>Certifications:</strong> Microsoft Certified Architect in Cloud Solutions (70-532)</p>
    <p><strong>Security Clearances:</strong> UK SC (2028), NATO (2029)</p>

    <p style="margin-top: 20px; font-size: 0.9em; color: #7f8c8d;">
        <em>Availability: Open for scheduling through <a href="https://calendly.com/rifaterdem/schedule">Calendly</a>.</em>
    </p>
</div>
`;

async function addManualTriggerAndUpdate() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        // 1. Update Email Template
        const replyNode = workflow.nodes.find(n => n.name === 'Reply with CV');
        if (replyNode) {
            console.log('Updating "Reply with CV" node with generic dynamic template...');
            replyNode.parameters.message = genericEmailBodyHtml;
        }

        // 2. Add/Ensure Manual Trigger
        let triggerNode = workflow.nodes.find(n => n.type === 'n8n-nodes-base.manualTrigger');
        if (!triggerNode) {
            console.log('Adding "Manual Trigger" node...');
            triggerNode = {
                "parameters": {},
                "name": "Manual Trigger",
                "type": "n8n-nodes-base.manualTrigger",
                "typeVersion": 1,
                "position": [ -700, -200 ],
                "id": "manual-trigger-node-id"
            };
            workflow.nodes.push(triggerNode);
        }

        // 3. Connect Manual Trigger to "Check for Recruiter Keywords"
        // We need to inject mock data for the manual trigger to actually work well in testing
        // For now, we just connect it.
        if (!workflow.connections["Manual Trigger"]) {
            workflow.connections["Manual Trigger"] = {
                "main": [
                    [
                        {
                            "node": "Check for Recruiter Keywords",
                            "type": "main",
                            "index": 0
                        }
                    ]
                ]
            };
        }

        // 4. Update Workflow
        const payload = {
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            name: workflow.name
        };

        await axios.put(`${baseUrl}/workflows/${targetWorkflowId}`, payload, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });

        console.log('✅ Success! Workflow updated.');
        console.log('- Email template is now generic and mentions the detected role.');
        console.log('- Manual Trigger added for easier testing.');

    } catch (error) {
        console.error('Update failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

addManualTriggerAndUpdate();
