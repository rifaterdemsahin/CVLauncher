require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const simpleGit = require('simple-git');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

const git = simpleGit();

async function addVersionTag() {
    try {
        // 1. Get Git Info
        const commitHash = await git.revparse(['HEAD']);
        const remotes = await git.getRemotes(true);
        let remoteUrl = remotes.find(r => r.name === 'origin')?.refs.fetch || '';
        
        // Convert SSH url to HTTPS if needed for clickable link
        if (remoteUrl.startsWith('git@github.com:')) {
            remoteUrl = remoteUrl.replace('git@github.com:', 'https://github.com/').replace('.git', '');
        } else if (remoteUrl.endsWith('.git')) {
             remoteUrl = remoteUrl.replace('.git', '');
        }

        const commitUrl = `${remoteUrl}/commit/${commitHash}`;
        const date = new Date().toISOString().split('T')[0];

        const versionNoteContent = `## 🚀 Version Info
**Deployed**: ${date}
**Repo**: [CVLauncher](${remoteUrl})
**Commit**: [${commitHash.substring(0, 7)}](${commitUrl})`;

        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        // 2. Remove existing Version Info note to avoid duplicates
        const initialCount = workflow.nodes.length;
        workflow.nodes = workflow.nodes.filter(n => {
            if (n.type === 'n8n-nodes-base.stickyNote' && 
                n.parameters && 
                n.parameters.content && 
                n.parameters.content.includes('Version Info')) {
                return false;
            }
            return true;
        });

        // 3. Add new Version Note
        const versionNote = {
            "parameters": {
                "content": versionNoteContent,
                "height": 200,
                "width": 300,
                "color": 7 // Red/Orange for visibility
            },
            "id": crypto.randomUUID(),
            "name": "Version Tag",
            "type": "n8n-nodes-base.stickyNote",
            "typeVersion": 1,
            "position": [ -500, -800 ] // Positioned above everything else
        };

        workflow.nodes.push(versionNote);

        // 4. Update Workflow
        console.log(`Updating workflow. Nodes: ${initialCount} -> ${workflow.nodes.length}`);
        
        const payload = {
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
            name: workflow.name
        };

        await axios.put(`${baseUrl}/workflows/${targetWorkflowId}`, payload, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });

        console.log('Success! Version tag added.');
        console.log(`Commit: ${commitHash}`);
        console.log(`Link: ${commitUrl}`);

    } catch (error) {
        console.error('Failed to tag version:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

addVersionTag();
