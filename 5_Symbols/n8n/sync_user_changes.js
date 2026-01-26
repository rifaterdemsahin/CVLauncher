const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'Respond to Job Offers in Gmail', '.env') });

const n8nHost = process.env.N8N_HOST;
const n8nApiKey = process.env.N8N_API_KEY;
const workflowId = 'CVD1ecv1GNe9uF4a';

// Save as the new "base" for any future edits
const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, '-');
const backupFilename = `respond_to_job_offers_in_gmail_${workflowId}_${timestamp}_synced_user_changes.json`;
const backupPath = path.resolve(__dirname, 'backups', backupFilename);

const url = `${n8nHost.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`;

async function syncUserChanges() {
    try {
        console.log(`Syncing workflow state from ${url}...`);
        const response = await axios.get(url, {
            headers: {
                'X-N8N-API-KEY': n8nApiKey,
                'Content-Type': 'application/json'
            }
        });

        const workflowData = response.data;

        // Check connections for "Is Automated?" to ensure it's wired correctly as per user intent
        // (Sanity check)
        if (!workflowData.connections["Is Automated?"]) {
            console.warn("⚠️ Warning: 'Is Automated?' node found but has no output connections!");
        } else {
            console.log("✅ 'Is Automated?' node connections verified.");
        }

        // Save
        const dir = path.dirname(backupPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(backupPath, JSON.stringify(workflowData, null, 2));
        console.log(`✅ Workflow synced and saved to: ${backupPath}`);

    } catch (error) {
        console.error('❌ Failed to sync workflow:', error.message);
    }
}

syncUserChanges();
