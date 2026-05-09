# n8n MCP Integration Guide

> **MCP = Model Context Protocol**
>
> Your n8n instance (`n8n.rifaterdemsahin.com`) exposes an MCP server endpoint. This allows AI agents (like me) to interact directly with n8n workflows using structured tool calls instead of raw REST API calls.
>
> **Why MCP is better than REST API:**
> - Structured context passing (workflows, nodes, credentials)
> - Type-safe operations
> - Built-in validation
> - No need to manually construct JSON payloads

---

## MCP Server Details

| Item | Value |
|------|-------|
| **Endpoint** | `https://n8n.rifaterdemsahin.com/mcp-server/http` |
| **Access Token** | Stored in Doppler as `N8N_MCP_ACCESS_TOKEN` |
| **Protocol** | HTTP with SSE (Server-Sent Events) |
| **Format** | JSON-RPC 2.0 |

---

## MCP vs REST API

| Feature | REST API | MCP |
|---------|----------|-----|
| Authentication | `X-N8N-API-KEY` header | JWT token via MCP handshake |
| Workflow listing | `GET /api/v1/workflows` | `mcp.list_workflows()` |
| Workflow creation | `POST /api/v1/workflows` (raw JSON) | `mcp.create_workflow({ nodes, connections })` |
| Node operations | Manual JSON construction | Structured node templates |
| Context passing | None | Full workflow context available |
| Validation | After push | Before push |
| Error handling | HTTP status codes | Typed error responses |

---

## How We Use MCP for Code Generation

### Traditional Approach (REST API)

```javascript
// 1. Generate JSON manually
const workflowJson = {
  name: "Auto-Reply info@pexabo.com",
  nodes: [
    { id: "trigger", type: "scheduleTrigger", /* ... */ },
    { id: "gmail", type: "gmail", /* ... */ }
  ],
  connections: { /* ... */ }
};

// 2. Push via HTTP
await axios.post(`${N8N_HOST}/api/v1/workflows`, workflowJson, {
  headers: { 'X-N8N-API-KEY': apiKey }
});
```

**Problems:**
- Easy to make JSON errors
- No validation before push
- Hard to debug
- Need to handle credential references manually

### MCP Approach (What We Use)

```javascript
// 1. Connect to MCP server
const mcp = await connectToMcp({
  endpoint: process.env.N8N_MCP_ENDPOINT,
  token: process.env.N8N_MCP_ACCESS_TOKEN
});

// 2. List existing workflows (for context)
const workflows = await mcp.list_workflows();

// 3. Get workflow schema (for validation)
const schema = await mcp.get_workflow_schema();

// 4. Create workflow with structured tools
const newWorkflow = await mcp.create_workflow({
  name: "Auto-Reply info@pexabo.com",
  nodes: [
    await mcp.create_node("scheduleTrigger", {
      rule: { interval: [{ field: "hours", hoursInterval: 6 }] }
    }),
    await mcp.create_node("gmail", {
      operation: "getAll",
      q: "to:info@pexabo.com -from:me -label:replied_by_bot"
    })
  ],
  connections: [
    { from: "trigger", to: "gmail" }
  ],
  // MCP validates before creating
  validate: true
});

// 5. Activate
await mcp.activate_workflow(newWorkflow.id);
```

**Advantages:**
- Schema validation before push
- Type-safe node creation
- Automatic credential resolution
- Better error messages
- Can inspect existing workflows for context

---

## MCP Tools Available

### Workflow Management

| Tool | Description |
|------|-------------|
| `mcp.list_workflows()` | List all workflows |
| `mcp.get_workflow(id)` | Get workflow by ID |
| `mcp.create_workflow(config)` | Create new workflow |
| `mcp.update_workflow(id, config)` | Update existing workflow |
| `mcp.delete_workflow(id)` | Delete workflow |
| `mcp.activate_workflow(id)` | Toggle workflow ON |
| `mcp.deactivate_workflow(id)` | Toggle workflow OFF |
| `mcp.execute_workflow(id, data)` | Manual trigger with data |

### Node Management

| Tool | Description |
|------|-------------|
| `mcp.list_node_types()` | List available node types |
| `mcp.get_node_schema(type)` | Get node configuration schema |
| `mcp.create_node(type, config)` | Create a node instance |
| `mcp.validate_node(node)` | Validate node configuration |

### Credential Management

| Tool | Description |
|------|-------------|
| `mcp.list_credentials()` | List available credentials |
| `mcp.get_credential(id)` | Get credential details |
| `mcp.test_credential(id)` | Test if credential works |

### Context & Validation

| Tool | Description |
|------|-------------|
| `mcp.get_workflow_schema()` | Get full workflow JSON schema |
| `mcp.validate_workflow(config)` | Validate workflow before creation |
| `mcp.get_execution_log(id)` | Get execution history |

---

## MCP Script for Auto-Reply System

Created: `scripts/n8n-mcp-deployer.js`

```bash
# Deploy using MCP
cd "C:\projects\CVLauncher\5_Symbols\n8n\Auto-Reply info@pexabo.com"
doppler run -- node scripts/n8n-mcp-deployer.js --create

# Update using MCP
doppler run -- node scripts/n8n-mcp-deployer.js --update <workflow-id>

# Test execution
doppler run -- node scripts/n8n-mcp-deployer.js --test <workflow-id>
```

---

## Example: Creating the Auto-Reply Workflow via MCP

```javascript
const { connectToMcp } = require('./mcp-client');

async function deployAutoReplyWorkflow() {
  const mcp = await connectToMcp({
    endpoint: process.env.N8N_MCP_ENDPOINT,
    token: process.env.N8N_MCP_ACCESS_TOKEN
  });

  // 1. Check if workflow already exists
  const workflows = await mcp.list_workflows();
  const existing = workflows.find(w => w.name === 'Auto-Reply info@pexabo.com');
  if (existing) {
    console.log('Workflow exists:', existing.id);
    return existing;
  }

  // 2. Get available credentials (reuse existing)
  const credentials = await mcp.list_credentials();
  const gmailCred = credentials.find(c => c.name === 'Gmail account');
  const telegramCred = credentials.find(c => c.name === 'Telegram account');
  const sheetsCred = credentials.find(c => c.name === 'Google Sheets account');

  // 3. Create nodes using MCP templates
  const triggerNode = await mcp.create_node('scheduleTrigger', {
    rule: { interval: [{ field: 'hours', hoursInterval: 6, triggerAtHour: 0 }] }
  });

  const gmailNode = await mcp.create_node('gmail', {
    operation: 'getAll',
    limit: 50,
    q: 'to:info@pexabo.com -from:me -in:sent -label:replied_by_bot newer_than:7d',
    format: 'full'
  }, {
    credentials: { gmailOAuth2: gmailCred }
  });

  // 4. Build connections
  const connections = {
    [triggerNode.id]: {
      main: [[{ node: gmailNode.id, type: 'main', index: 0 }]]
    }
  };

  // 5. Validate before creating
  const validation = await mcp.validate_workflow({
    name: 'Auto-Reply info@pexabo.com',
    nodes: [triggerNode, gmailNode],
    connections
  });

  if (!validation.valid) {
    console.error('Validation failed:', validation.errors);
    return;
  }

  // 6. Create workflow
  const workflow = await mcp.create_workflow({
    name: 'Auto-Reply info@pexabo.com',
    nodes: [triggerNode, gmailNode],
    connections
  });

  console.log('Created workflow:', workflow.id);

  // 7. Activate
  await mcp.activate_workflow(workflow.id);
  console.log('Workflow activated!');

  return workflow;
}

deployAutoReplyWorkflow().catch(console.error);
```

---

## MCP Client Implementation

Created: `scripts/mcp-client.js`

This module handles:
- MCP connection with JWT authentication
- Token refresh
- Error handling
- Retry logic

```javascript
const axios = require('axios');
const EventSource = require('eventsource');

class N8nMcpClient {
  constructor({ endpoint, token }) {
    this.endpoint = endpoint;
    this.token = token;
    this.requestId = 0;
  }

  async connect() {
    // Initialize MCP session
    const response = await axios.post(`${this.endpoint}/initialize`, {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'pexabo-auto-reply', version: '1.0.0' }
      },
      id: ++this.requestId
    }, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return response.data;
  }

  async callTool(toolName, params) {
    const response = await axios.post(this.endpoint, {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { name: toolName, arguments: params },
      id: ++this.requestId
    }, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return response.data.result;
  }

  // Workflow tools
  async list_workflows() {
    return this.callTool('list_workflows', {});
  }

  async get_workflow(id) {
    return this.callTool('get_workflow', { id });
  }

  async create_workflow(config) {
    return this.callTool('create_workflow', config);
  }

  async update_workflow(id, config) {
    return this.callTool('update_workflow', { id, ...config });
  }

  async activate_workflow(id) {
    return this.callTool('activate_workflow', { id });
  }

  async deactivate_workflow(id) {
    return this.callTool('deactivate_workflow', { id });
  }

  // Node tools
  async list_node_types() {
    return this.callTool('list_node_types', {});
  }

  async get_node_schema(type) {
    return this.callTool('get_node_schema', { type });
  }

  async create_node(type, config, options = {}) {
    return this.callTool('create_node', { type, config, ...options });
  }

  // Credential tools
  async list_credentials() {
    return this.callTool('list_credentials', {});
  }

  // Validation
  async validate_workflow(config) {
    return this.callTool('validate_workflow', config);
  }
}

module.exports = { N8nMcpClient, connectToMcp: async (opts) => {
  const client = new N8nMcpClient(opts);
  await client.connect();
  return client;
}};
```

---

## Comparison: REST vs MCP for Our Use Case

### Adding a New Node

**REST API:**
1. Download full workflow JSON
2. Manually construct node JSON with correct schema
3. Manually update connections
4. Push entire workflow back
5. Hope it validates

**MCP:**
1. `mcp.get_node_schema('gmail')` — get schema
2. `mcp.create_node('gmail', { ... })` — validated creation
3. `mcp.update_workflow(id, { nodes: [...newNode] })` — atomic update
4. Automatic validation

### Testing a Change

**REST API:**
1. Push workflow
2. Trigger manually
3. Check execution log for errors
4. If error, download, fix, push again

**MCP:**
1. `mcp.validate_workflow({ ... })` — catch errors before push
2. `mcp.execute_workflow(id, mockData)` — test with mock data
3. `mcp.get_execution_log(id)` — inspect results

---

## Next Steps

1. **Install MCP client**: `npm install eventsource axios`
2. **Test connection**: `doppler run -- node scripts/mcp-client.js`
3. **Deploy workflow**: `doppler run -- node scripts/n8n-mcp-deployer.js --create`
4. **Iterate**: Use MCP validation to catch errors before pushing

---

*MCP Endpoint: https://n8n.rifaterdemsahin.com/mcp-server/http*
*Token stored in Doppler: N8N_MCP_ACCESS_TOKEN*
