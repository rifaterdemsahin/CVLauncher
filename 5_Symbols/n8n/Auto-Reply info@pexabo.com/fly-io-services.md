# Fly.io Services: Pexabo Email Brain

## Purpose

Offload complex AI tasks from n8n that are hard to do in visual workflows:
- Multi-step reasoning (negotiations, custom quotes)
- External API calls (calendar, CRM, pricing DB)
- Large context processing (thread analysis, attachment parsing)
- Custom formatting (PDF generation, HTML templates)

---

## Architecture

```
Fly.io App: pexabo-email-brain
Region: lhr (London)
Scale: 1-3 machines (auto-scaling)
```

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/process` | POST | Main email processing |
| `/recruiter` | POST | Generate CV-matched recruiter response |
| `/tactics` | GET | List available tactics |
| `/feedback` | POST | Receive feedback for learning |

---

## Service Specification

### `server.js` — Main Application

```javascript
const fastify = require('fastify')({ logger: true });
const OpenAI = require('openai');
const { google } = require('googleapis');

// Initialize clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Health check
fastify.get('/health', async () => ({ status: 'ok', version: '1.0.0' }));

// Main processing endpoint
fastify.post('/process', async (request, reply) => {
  const { email, tactics, context } = request.body;
  
  try {
    // 1. Analyze thread context (if previous emails exist)
    const threadContext = await analyzeThread(context.previousEmails);
    
    // 2. Select best tactic
    const tactic = await selectTactic(email, tactics);
    
    // 3. Build enriched prompt
    const systemPrompt = buildSystemPrompt(tactic, threadContext);
    
    // 4. Generate reply with reasoning
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: formatEmailForAI(email) }
      ],
      tools: getAvailableTools(),
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 1500
    });
    
    const response = completion.choices[0];
    let reply = response.message.content;
    let actions = [];
    
    // 5. Handle tool calls (if any)
    if (response.message.tool_calls) {
      const toolResults = await executeTools(response.message.tool_calls, email);
      actions = toolResults.actions;
      
      // If tool results modify reply, regenerate
      if (toolResults.requiresRegeneration) {
        const followUp = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: formatEmailForAI(email) },
            { role: 'assistant', content: reply },
            { role: 'user', content: `Tool results: ${JSON.stringify(toolResults)}` }
          ]
        });
        reply = followUp.choices[0].message.content;
      }
    }
    
    // 6. Calculate confidence
    const confidence = calculateConfidence(response, tactic, actions);
    
    return {
      reply,
      actions,
      confidence,
      should_reply: confidence > 0.75 && !actions.some(a => a.type === 'escalate'),
      tactic_used: tactic.id,
      reasoning: response.message.reasoning || null
    };
    
  } catch (error) {
    fastify.log.error(error);
    return {
      reply: null,
      actions: [{ type: 'error', message: error.message }],
      confidence: 0,
      should_reply: false,
      error: true
    };
  }
});

// List tactics
fastify.get('/tactics', async () => {
  return require('./tactics.json');
});

// Receive feedback
fastify.post('/feedback', async (request, reply) => {
  const { email_id, rating, correction, notes } = request.body;
  // Store in database or sheet for future model improvement
  await storeFeedback({ email_id, rating, correction, notes, timestamp: new Date() });
  return { status: 'feedback_recorded' };
});

// Helper functions
function buildSystemPrompt(tactic, threadContext) {
  return `You are the AI assistant for Pexabo (info@pexabo.com).

TACTIC: ${tactic.name}
${tactic.instructions}

THREAD CONTEXT:
${threadContext || 'No previous emails in thread.'}

RULES:
- Be professional but warm
- Maximum 3 paragraphs
- Always include signature
- If you need to decline, be polite and offer alternatives
- Today's date: ${new Date().toISOString().split('T')[0]}
`;
}

function formatEmailForAI(email) {
  return `From: ${email.from}
Subject: ${email.subject}
Date: ${email.date}
Body:
${email.body}`;
}

function getAvailableTools() {
  return [
    {
      type: 'function',
      function: {
        name: 'check_calendar',
        description: 'Check availability for a meeting',
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Date to check (YYYY-MM-DD)' }
          },
          required: ['date']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'generate_quote',
        description: 'Generate a price quote',
        parameters: {
          type: 'object',
          properties: {
            service_type: { type: 'string' },
            hours: { type: 'number' },
            currency: { type: 'string', default: 'GBP' }
          },
          required: ['service_type']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'escalate_to_human',
        description: 'Escalate to human if too complex',
        parameters: {
          type: 'object',
          properties: {
            reason: { type: 'string' }
          },
          required: ['reason']
        }
      }
    }
  ];
}

async function executeTools(toolCalls, email) {
  const actions = [];
  let requiresRegeneration = false;
  
  for (const call of toolCalls) {
    switch (call.function.name) {
      case 'check_calendar':
        // Integration with Google Calendar
        actions.push({ type: 'calendar_check', result: 'available_slots' });
        break;
      case 'generate_quote':
        const args = JSON.parse(call.function.arguments);
        actions.push({ type: 'quote_generated', data: args });
        requiresRegeneration = true;
        break;
      case 'escalate_to_human':
        actions.push({ type: 'escalate', reason: JSON.parse(call.function.arguments).reason });
        break;
    }
  }
  
  return { actions, requiresRegeneration };
}

function calculateConfidence(completion, tactic, actions) {
  let score = 0.85; // Base confidence
  
  // Adjust based on finish reason
  if (completion.finish_reason === 'length') score -= 0.2;
  if (completion.finish_reason === 'content_filter') score -= 0.3;
  
  // Adjust based on actions
  if (actions.some(a => a.type === 'escalate')) score = 0;
  if (actions.some(a => a.type === 'error')) score = 0;
  
  return Math.max(0, Math.min(1, score));
}

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
```

---

## Deployment

### `fly.toml`

```toml
app = 'pexabo-email-brain'
primary_region = 'lhr'

[build]
  dockerfile = 'Dockerfile'

[env]
  PORT = '8080'
  NODE_ENV = 'production'

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ['app']

[[vm]]
  size = 'shared-cpu-1x'
  memory = '512mb'
```

### `Dockerfile`

```dockerfile
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Install Doppler CLI for secrets
RUN apt-get update && apt-get install -y curl && \
    curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh | sh && \
    apt-get clean

EXPOSE 8080

ENTRYPOINT ["doppler", "run", "--", "node", "server.js"]
```

### `package.json`

```json
{
  "name": "pexabo-email-brain",
  "version": "1.0.0",
  "description": "Complex email processing for info@pexabo.com",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "fastify": "^4.28.0",
    "openai": "^4.52.0",
    "googleapis": "^140.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

### Deploy Commands

```bash
# Login
fly auth login

# Create app
fly apps create pexabo-email-brain

# Set secrets via Doppler or fly secrets
fly secrets set OPENAI_API_KEY="" GMAIL_REFRESH_TOKEN=""

# Deploy
fly deploy

# Check status
fly status

# View logs
fly logs
```

---

## Recruiter Response Integration

### Existing Service: `rifat-cvs-response-generator.fly.dev`

**URL**: `https://rifat-cvs-response-generator.fly.dev/recruiter`

This service is already deployed and handles recruiter emails specifically. It:
1. Takes the recruiter's message
2. Loads the relevant CV (source context)
3. Uses AI to generate a response that references specific CV evidence
4. Supports multiple AI providers (Gemini, Grok)

### How the Auto-Reply System Uses It

**In n8n workflow**:
1. Email classified as `recruiter_job_offer`
2. CV Selection node picks the best CV based on job keywords
3. HTTP Request node POSTs to `rifat-cvs-response-generator.fly.dev/recruiter`
4. If successful → Format reply with CV link and send
5. If fails → Trigger multi-model fallback chain

**Expected Payload**:
```json
{
  "recruiter_message": "Hi Rifat, I have an Azure Architect role...",
  "subject": "Azure Architect - 6 Month Contract",
  "from": "recruiter@agency.com",
  "cv_source_url": "https://raw.githubusercontent.com/rifaterdemsahin/CVLauncher/main/5_Symbols/cvs/cv_azure_architect.pdf",
  "ai_provider": "gemini"
}
```

**Expected Response**:
```json
{
  "generated_response": "Thank you for reaching out. With over 10 years of experience designing Azure landing zones and implementing Infrastructure as Code with Terraform, I believe I would be a strong fit for this Azure Architect role...",
  "confidence": 0.94,
  "evidence": "Matched Azure landing zone experience (2022-2024) with job requirement for Azure architecture",
  "model_used": "gemini-1.5-pro"
}
```

---

## Multi-Model Fallback Strategy

### Why Multiple Models?

- **Gemini**: Best for long-context CV analysis (1M token context)
- **GPT-4o**: Best general reasoning and formatting
- **Groq (Llama-3)**: Fastest inference, cheapest, good for simple replies
- **Claude 3.5 Sonnet**: Best for nuanced, professional tone

### Fallback Chain

```
Primary Request
    ↓
[Success] → Use response
    ↓
[Timeout / 5xx / Empty]
    ↓
Retry same model (1x)
    ↓
[Still fails]
    ↓
Fallback 1: Gemini (if not already tried)
    ↓
Fallback 2: GPT-4o (if not already tried)
    ↓
Fallback 3: Groq Llama-3 (if not already tried)
    ↓
Fallback 4: Claude 3.5 Sonnet (if not already tried)
    ↓
All failed → Route to human review + Telegram alert
```

### Doppler Secrets Required

| Secret | Provider |
|--------|----------|
| `OPENAI_API_KEY` | OpenAI (GPT-4o, GPT-4o-mini) |
| `GEMINI_API_KEY` | Google AI (Gemini 1.5 Pro / Flash) |
| `GROQ_API_KEY` | Groq (Llama-3, Mixtral) |
| `ANTHROPIC_API_KEY` | Anthropic (Claude 3.5 Sonnet) |

### n8n Implementation

Use n8n's **"Continue On Fail"** + **"Execute Once"** pattern:

1. Primary model node (Gemini for recruiter, GPT-4o for general)
2. Set "Continue On Fail" = true
3. Fallback node checks if primary output is empty
4. Chain fallback nodes with IF conditions
5. Final node logs which model succeeded

---

## When to Use Fly.io vs n8n

| Scenario | Use | Reason |
|----------|-----|--------|
| Simple acknowledgment | n8n | One OpenAI call, no external APIs |
| Recruiter job offer | n8n + `rifat-cvs-response-generator` | CV-matched response generation |
| Pricing inquiry with calculator | Fly.io | Needs business logic + multiple API calls |
| Meeting scheduling | Fly.io | Calendar API integration |
| Partnership proposal | Fly.io | Multi-step reasoning, context analysis |
| Spam/unsubscribe | n8n | Simple classification |
| Support ticket routing | n8n | Simple if/else logic |
| Custom PDF quote generation | Fly.io | File generation + upload |

---

## Monitoring

### Health Check

```bash
curl https://pexabo-email-brain.fly.dev/health
```

### Metrics (Fly.io Dashboard)

- Response time < 3s for 95th percentile
- Error rate < 2%
- Uptime > 99.5%

---

*Last updated: 2026-05-09*
