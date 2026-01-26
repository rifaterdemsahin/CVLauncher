const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
// Webhook ID from the workflow file (Step 76, line 150)
const webhookId = '529443ed-ff68-4b54-bab2-6fa41275e81f';
const webhookUrl = `${n8nHost.replace(/\/$/, '')}/webhook/${webhookId}`;

// Payload simulating the "Senior Technical Architect" email
const payload = {
    subject: "Exciting Role: Senior Technical Architect - Shape the Future of IT",
    snippet: "We hope this message finds you well. We have an exceptional opportunity... Senior Technical Architect... cloud technologies like AWS, Azure...",
    body: "Full email body regarding the role...",
    from: "a.abdalla@nonstopconsulting.com",
    email: "a.abdalla@nonstopconsulting.com" // Some logic checks 'email' prop
};

async function testWebhook() {
    console.log(`Sending POST request to ${webhookUrl}...`);
    try {
        const response = await axios.post(webhookUrl, payload);
        console.log('Webhook Test Successful!');
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Webhook Test Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testWebhook();
