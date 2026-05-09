const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const n8nHost = process.env.N8N_HOST;
// Webhook ID from the workflow backup used in the path
const webhookPath = '529443ed-ff68-4b54-bab2-6fa41275e81f'; 
const url = `${n8nHost.replace(/\/$/, '')}/webhook/${webhookPath}`;

const payload = {
    id: "19bfea530104f4f7",
    threadId: "19bfea530104f4f7",
    labelIds: ["UNREAD", "CATEGORY_PERSONAL", "INBOX"],
    snippet: "You have an upcoming event Area : Contract : NG Tuesday 27 Jan 2026 09:00 17:00 United Kingdom Time Organiser Rifat Erdem Sahin info@pexabo.com // Invitation from Google Calendar: https://calendar.go",
    subject: "Notification: Area : Contract : NG @ Tue 27 Jan 2026 09:00 - 17:00 (GMT) (Pexabo Team)",
    from: "Google Calendar <calendar-notification@google.com>", // Simulating the string format or object depending on node expectation
    // In Gmail node output 'from' matches key 'from'
    date: "2026-01-27T08:49:56.000Z",
    body: {
        // Simulating structure if needed, but top level keys are usually what's accessed by $json.from
    }
};

async function triggerWorkflow() {
    try {
        console.log(`Triggering workflow at ${url}...`);
        console.log('Payload:', JSON.stringify(payload, null, 2));
        
        const response = await axios.post(url, payload);
        
        console.log('✅ Workflow Triggered Successfully!');
        console.log('Response:', response.data);
    } catch (error) {
        console.error('❌ Trigger Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

triggerWorkflow();
