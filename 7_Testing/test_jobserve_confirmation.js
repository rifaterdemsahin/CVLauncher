const axios = require('axios');
require('dotenv').config();

const webhookUrl = 'https://n8n.rifaterdemsahin.com/webhook/529443ed-ff68-4b54-bab2-6fa41275e81f';

const payload = {
    "headers": {
        "host": "n8n.rifaterdemsahin.com",
        "user-agent": "axios/1.13.2",
        "content-type": "application/json"
    },
    "body": {
        "subject": "JobServe Job Application Confirmation JS-BBBH172694",
        "snippet": "Job Application Confirmation. Dear Applicant, This is confirmation that you have applied for the job listed below.",
        "body": `Job Application Confirmation
Dear Applicant,

This is confirmation that you have applied for the job listed below. We have submitted your application including your CV (cv_data_architect.pdf) and covering letter as attached (if provided).

View full job details

Senior Data Engineer
England
Contract
£450 - £650 per day
We are looking for a Senior Databricks Engineer(s) to join Our Client's growing team. You'll play a key part in shaping modern data platforms...

This email was sent by: JobServe`,
        "from": "Apply.Online@apps.jobserve.com <Apply.Online@apps.jobserve.com>",
        "email": "Apply.Online@apps.jobserve.com",
        "threadId": "test-jobserve-thread-123"
    },
    "webhookUrl": webhookUrl,
    "executionMode": "production"
};

async function triggerWebhook() {
    try {
        console.log('🚀 Sending JobServe Confirmation Payload to n8n...');
        const response = await axios.post(webhookUrl, payload);
        console.log(`✅ Webhook Triggered! Status: ${response.status}`);
        console.log('Response:', response.data);
    } catch (error) {
        console.error('❌ Webhook Failed:', error.response ? error.response.data : error.message);
    }
}

triggerWebhook();
