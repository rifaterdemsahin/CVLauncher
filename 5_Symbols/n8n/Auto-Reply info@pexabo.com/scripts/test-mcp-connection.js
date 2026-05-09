const axios = require('axios');

/**
 * MCP Connection Test for n8n
 * 
 * Usage:
 *   doppler run -- node scripts/test-mcp-connection.js
 * 
 * This script tests connectivity to the n8n MCP server and attempts
 * basic operations (list workflows, create test workflow).
 */

const MCP_ENDPOINT = process.env.N8N_MCP_ENDPOINT || 'https://n8n.rifaterdemsahin.com/mcp-server/http';
const MCP_TOKEN = process.env.N8N_MCP_ACCESS_TOKEN;

let requestId = 0;

async function mcpCall(method, params = {}) {
  const id = ++requestId;
  const payload = {
    jsonrpc: '2.0',
    method,
    params,
    id
  };

  try {
    console.log(`\n>>> MCP Call: ${method}`);
    const res = await axios.post(MCP_ENDPOINT, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MCP_TOKEN}`
      },
      timeout: 15000
    });
    console.log(`<<< Response [${res.status}]:`, JSON.stringify(res.data, null, 2));
    return res.data;
  } catch (err) {
    console.error(`<<< Error [${err.response?.status || 'network'}]:`, err.response?.data || err.message);
    throw err;
  }
}

async function testMcp() {
  console.log('========================================');
  console.log('n8n MCP Connection Test');
  console.log('========================================');
  console.log('Endpoint:', MCP_ENDPOINT);
  console.log('Token present:', !!MCP_TOKEN);
  console.log('Token prefix:', MCP_TOKEN ? MCP_TOKEN.substring(0, 20) + '...' : 'MISSING');

  if (!MCP_TOKEN) {
    console.error('\n❌ ERROR: N8N_MCP_ACCESS_TOKEN not found in environment.');
    console.log('Run with: doppler run -- node scripts/test-mcp-connection.js');
    process.exit(1);
  }

  try {
    // Test 1: Initialize MCP session
    console.log('\n--- Test 1: Initialize MCP Session ---');
    const init = await mcpCall('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'pexabo-auto-reply', version: '1.0.0' }
    });

    if (init.error) {
      console.error('❌ Initialize failed:', init.error);
      return;
    }
    console.log('✅ MCP Initialize: OK');

    // Test 2: List available tools
    console.log('\n--- Test 2: List MCP Tools ---');
    const tools = await mcpCall('tools/list', {});
    if (tools.result?.tools) {
      console.log('Available tools:');
      tools.result.tools.forEach(t => console.log(`  - ${t.name}: ${t.description || 'no description'}`));
    }

    // Test 3: List workflows
    console.log('\n--- Test 3: List Workflows ---');
    const workflows = await mcpCall('tools/call', {
      name: 'list_workflows',
      arguments: {}
    });
    
    if (workflows.result?.content?.[0]?.text) {
      const wfList = JSON.parse(workflows.result.content[0].text);
      console.log(`Found ${wfList.length} workflows:`);
      wfList.forEach(w => console.log(`  - [${w.active ? 'ON' : 'OFF'}] ${w.name} (ID: ${w.id})`));
    }

    // Test 4: Get existing workflow details
    console.log('\n--- Test 4: Get Existing Workflow (CVD1ecv1GNe9uF4a) ---');
    const wfDetail = await mcpCall('tools/call', {
      name: 'get_workflow',
      arguments: { id: 'CVD1ecv1GNe9uF4a' }
    });
    
    if (wfDetail.result?.content?.[0]?.text) {
      const wf = JSON.parse(wfDetail.result.content[0].text);
      console.log('Workflow name:', wf.name);
      console.log('Active:', wf.active);
      console.log('Nodes count:', wf.nodes?.length || 0);
    }

    // Test 5: Create a minimal test workflow
    console.log('\n--- Test 5: Create Test Workflow ---');
    const createRes = await mcpCall('tools/call', {
      name: 'create_workflow',
      arguments: {
        name: 'Test MCP Auto-Reply ' + new Date().toISOString(),
        nodes: [
          {
            name: 'Manual Trigger',
            type: 'n8n-nodes-base.manualTrigger',
            typeVersion: 1,
            position: [250, 300],
            parameters: {}
          },
          {
            name: 'Test Code',
            type: 'n8n-nodes-base.code',
            typeVersion: 2,
            position: [450, 300],
            parameters: {
              jsCode: 'return [{ json: { test: true, timestamp: new Date().toISOString() } }];'
            }
          }
        ],
        connections: {
          'Manual Trigger': {
            main: [[{ node: 'Test Code', type: 'main', index: 0 }]]
          }
        },
        settings: {
          executionOrder: 'v1'
        }
      }
    });

    if (createRes.result?.content?.[0]?.text) {
      const created = JSON.parse(createRes.result.content[0].text);
      console.log('✅ Created workflow:', created.id);
      console.log('Name:', created.name);
      
      // Test 6: Delete the test workflow
      console.log('\n--- Test 6: Delete Test Workflow ---');
      await mcpCall('tools/call', {
        name: 'delete_workflow',
        arguments: { id: created.id }
      });
      console.log('✅ Deleted test workflow');
    }

    console.log('\n========================================');
    console.log('✅ ALL MCP TESTS PASSED');
    console.log('========================================');
    console.log('\nYou can now create the full Auto-Reply workflow.');
    console.log('Run: doppler run -- node scripts/n8n-mcp-deployer.js --create');

  } catch (err) {
    console.error('\n========================================');
    console.error('❌ MCP TEST FAILED');
    console.error('========================================');
    console.error('Error:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
}

testMcp();
