const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * n8n Workflow Deployer via REST API
 * 
 * Usage:
 *   doppler run -- node scripts/n8n-rest-deployer.js --create
 *   doppler run -- node scripts/n8n-rest-deployer.js --list
 *   doppler run -- node scripts/n8n-rest-deployer.js --activate <id>
 * 
 * Uses n8n REST API (not MCP) since MCP token has signature issues.
 */

const N8N_HOST = (process.env.N8N_HOST || 'https://n8n.rifaterdemsahin.com').replace(/\/$/, '');
const N8N_API_KEY = process.env.N8N_API_KEY;

const headers = {
  'X-N8N-API-KEY': N8N_API_KEY,
  'Content-Type': 'application/json'
};

async function createWorkflow() {
  const backupFile = 'auto-reply-info-pexabo-2026-05-09.json';
  const backupPath = path.resolve(__dirname, '..', 'backups', backupFile);

  if (!fs.existsSync(backupPath)) {
    console.error('Workflow JSON not found:', backupPath);
    console.log('Run: node scripts/generate-workflow-json.js');
    process.exit(1);
  }

  const workflow = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

  // Check if workflow already exists
  console.log('Checking for existing workflow...');
  const listRes = await axios.get(`${N8N_HOST}/api/v1/workflows`, { headers });
  const existing = listRes.data.data?.find(w => w.name === workflow.name);

  if (existing) {
    console.log('Workflow already exists:', existing.id);
    console.log('Updating...');
    const updateRes = await axios.put(`${N8N_HOST}/api/v1/workflows/${existing.id}`, workflow, { headers });
    console.log('✅ Updated:', updateRes.data.id);
    return updateRes.data;
  }

  console.log('Creating new workflow...');
  const createRes = await axios.post(`${N8N_HOST}/api/v1/workflows`, workflow, { headers });
  console.log('✅ Created:', createRes.data.id);
  console.log('Name:', createRes.data.name);
  return createRes.data;
}

async function listWorkflows() {
  const res = await axios.get(`${N8N_HOST}/api/v1/workflows`, { headers });
  console.log('\nWorkflows:');
  res.data.data.forEach(w => {
    console.log(`  [${w.active ? 'ON' : 'OFF'}] ${w.name} (${w.id})`);
  });
}

async function activateWorkflow(id) {
  await axios.post(`${N8N_HOST}/api/v1/workflows/${id}/activate`, {}, { headers });
  console.log(`✅ Activated: ${id}`);
}

async function getWorkflow(id) {
  const res = await axios.get(`${N8N_HOST}/api/v1/workflows/${id}`, { headers });
  console.log('\nWorkflow:', res.data.name);
  console.log('Active:', res.data.active);
  console.log('Nodes:', res.data.nodes?.length);
  console.log('Connections:', Object.keys(res.data.connections || {}).length);
}

async function main() {
  const args = process.argv.slice(2);

  if (!N8N_API_KEY) {
    console.error('ERROR: N8N_API_KEY not set. Run with doppler.');
    process.exit(1);
  }

  try {
    if (args.includes('--create')) {
      const workflow = await createWorkflow();
      console.log('\nNext steps:');
      console.log(`  1. Activate: doppler run -- node scripts/n8n-rest-deployer.js --activate ${workflow.id}`);
      console.log(`  2. Verify:   doppler run -- node scripts/n8n-rest-deployer.js --get ${workflow.id}`);
    } else if (args.includes('--list')) {
      await listWorkflows();
    } else if (args.includes('--activate')) {
      const idx = args.indexOf('--activate');
      const id = args[idx + 1];
      if (!id) { console.error('Usage: --activate <workflow-id>'); process.exit(1); }
      await activateWorkflow(id);
    } else if (args.includes('--get')) {
      const idx = args.indexOf('--get');
      const id = args[idx + 1];
      if (!id) { console.error('Usage: --get <workflow-id>'); process.exit(1); }
      await getWorkflow(id);
    } else {
      console.log(`
n8n REST API Deployer
=====================

Usage:
  doppler run -- node scripts/n8n-rest-deployer.js --create
  doppler run -- node scripts/n8n-rest-deployer.js --list
  doppler run -- node scripts/n8n-rest-deployer.js --activate <workflow-id>
  doppler run -- node scripts/n8n-rest-deployer.js --get <workflow-id>

Environment:
  N8N_HOST=${N8N_HOST}
  N8N_API_KEY=${N8N_API_KEY ? '***set***' : '***MISSING***'}
`);
    }
  } catch (err) {
    console.error('Error:', err.response?.status, err.response?.data?.message || err.message);
    process.exit(1);
  }
}

main();
