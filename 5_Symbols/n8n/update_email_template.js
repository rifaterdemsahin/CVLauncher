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

// The new HTML template
const emailBodyHtml = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <p>Thank you for your interest!</p>
    <p>I’ve linked my CV and related documents for your review. If you’d prefer to communicate directly or find email inconvenient, feel free to call me.</p>

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

async function updateEmailTemplate() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        // Find the "Reply with CV" node
        const replyNode = workflow.nodes.find(n => n.name === 'Reply with CV');
        if (!replyNode) {
            console.error('Error: "Reply with CV" node not found.');
            return;
        }

        // Update the message content
        // IMPORTANT: We must ensure we are updating the correct property.
        // For Gmail node "reply" operation, the content field is usually 'message'.
        // We set it to HTML content.
        
        console.log('Updating Email Template...');
        replyNode.parameters.message = emailBodyHtml;
        
        // Ensure the node knows it's sending HTML if there's a toggle (mostly auto-detected or n8n handles rich text)
        // If there are options to enable HTML, we should check. 
        // Standard n8n Gmail node supports HTML in the message body.

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

        console.log('✅ Success! Email template updated with rich HTML CV summary.');

    } catch (error) {
        console.error('Update failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

updateEmailTemplate();
