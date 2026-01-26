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
        "subject": "Application Confirmation: Azure Integration Engineer - Outside IR35",
        "snippet": "Hello Rifat Erdem, Thank you for applying for a job on SecurityClearedJobs.com. This email confirms that you applied for the following job.",
        "body": `Hello Rifat Erdem,

Thank you for applying for a job on SecurityClearedJobs.com. This email confirms that you applied for the following job:

Job title: Azure Integration Engineer - Outside IR35
Job link: https://www.securityclearedjobs.com/job/802068860/azure-integration-engineer-outside-ir35-/
Recruiter: LA International
Application date: 23/01/2026
CV file: cv_cloud_architect.pdf

Other information:
Covering Message : great job match`,
        "from": "noreply@jobs.securityclearedjobs.com",
        "email": "noreply@jobs.securityclearedjobs.com",
        "threadId": "test-security-cleared-thread-456"
    },
    "webhookUrl": webhookUrl,
    "executionMode": "production"
};

async function triggerWebhook() {
    try {
        console.log('🚀 Sending SecurityClearedJobs Confirmation Payload to n8n...');
        const response = await axios.post(webhookUrl, payload);
        console.log(`✅ Webhook Triggered! Status: ${response.status}`);
        console.log('Response:', response.data);
    } catch (error) {
        console.error('❌ Webhook Failed:', error.response ? error.response.data : error.message);
    }
}

triggerWebhook();
