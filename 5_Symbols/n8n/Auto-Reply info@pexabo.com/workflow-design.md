# n8n Workflow Design: Auto-Reply info@pexabo.com

## Workflow Metadata

- **Name**: Auto-Reply info@pexabo.com
- **ID**: *(to be assigned by n8n)*
- **Trigger**: Dual — Schedule (Cron) + Webhook (Manual/Individual)
- **Execution Mode**: Sequential (to avoid rate limits)

---

## Node-by-Node Specification

### Node 1a: Trigger (Schedule) — Batch Mode
```json
{
  "name": "Every 6 Hours",
  "type": "n8n-nodes-base.scheduleTrigger",
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "hours",
          "hoursInterval": 6,
          "triggerAtHour": 0
        }
      ]
    }
  }
}
```

### Node 1b: Trigger (Webhook) — Individual Mode
```json
{
  "name": "Process Single Email",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "httpMethod": "POST",
    "path": "process-single-email",
    "responseMode": "responseNode",
    "options": {}
  }
}
```

**Webhook Payload**:
```json
{
  "gmail_url": "https://mail.google.com/mail/u/0/#.../MESSAGE_ID",
  "mode": "dry-run | execute",
  "tactic_override": "optional_tactic_id",
  "generate_fix_prompt": true
}
```

**Webhook Response**:
```json
{
  "status": "processed",
  "message_id": "MESSAGE_ID",
  "classification": { "intent": "...", "confidence": 0.95 },
  "reply_draft": "...",
  "sent": true,
  "marked": true,
  "fix_prompt_path": "investigations/missed_email_2026-05-09_MESSAGE_ID.md"
}
```

**How Individual Mode Works**:
1. You POST the Gmail URL to the webhook
2. Workflow extracts message ID from URL
3. Fetches that ONE email directly (bypasses batch query)
4. Classifies, drafts reply, and either returns draft (dry-run) or sends it (execute)
5. **Generates a Fix Prompt** analyzing why the batch flow missed it
6. Saves fix prompt to `investigations/`
7. Returns full summary

**Merge Node**: After both triggers, a Merge node (combine mode) unifies the data structure so downstream nodes work for both batch and individual paths.

### Node 2: Fetch Emails (Gmail)
```json
{
  "name": "Find Lost Emails",
  "type": "n8n-nodes-base.gmail",
  "parameters": {
    "operation": "getAll",
    "limit": 50,
    "q": "to:info@pexabo.com -from:me -in:sent -label:replied_by_bot newer_than:7d",
    "format": "full",
    "options": {
      "includeSpamTrash": false
    }
  }
}
```

**Query Breakdown**:
- `to:info@pexabo.com` — Emails sent to your address
- `-from:me` — Exclude your own sent emails
- `-in:sent` — Exclude sent folder
- `-label:replied_by_bot` — Skip already processed
- `newer_than:7d` — Only last 7 days (prevents ancient emails)

### Node 3: Check Thread History (Reply Detection)
```json
{
  "name": "Check Thread Replies",
  "type": "n8n-nodes-base.gmail",
  "parameters": {
    "operation": "getAll",
    "limit": 20,
    "q": "from:me in:sent {{ $json.threadId }}",
    "format": "metadata",
    "options": {}
  }
}
```

**Why this matters**: The `replied_by_bot` label can be missing if a previous run failed after sending but before labeling. This node checks the **thread history** for any message sent by `info@pexabo.com` in the same thread.

**Code Node — Already Replied?**
```javascript
const threadMessages = $input.all()[0].json || [];
const hasReplied = threadMessages.some(msg => {
  const from = msg.payload?.headers?.find(h => h.name === 'From')?.value || '';
  return from.includes('info@pexabo.com') || from.includes('rifaterdemsahin');
});

return {
  json: {
    ...$input.first().json,
    already_replied: hasReplied,
    thread_message_count: threadMessages.length,
    skip_reason: hasReplied ? 'already_replied_in_thread' : null
  }
};
```

**IF Node — Filter Already Replied**:
```json
{
  "name": "Already Replied?",
  "type": "n8n-nodes-base.if",
  "parameters": {
    "conditions": {
      "conditions": [
        {
          "leftValue": "={{ $json.already_replied }}",
          "rightValue": "true",
          "operator": { "type": "boolean", "operation": "equals" }
        }
      ]
    }
  }
}
```

- **True path** → Skip (log to tracker with status `already_replied`)
- **False path** → Continue to tracker check

### Node 4: Check Tracker (Google Sheets)
```json
{
  "name": "Check Tracker",
  "type": "n8n-nodes-base.googleSheets",
  "parameters": {
    "operation": "lookup",
    "documentId": "{{ $env.GOOGLE_SHEETS_DOC_ID }}",
    "sheetName": "Tracker",
    "column": "email_id",
    "value": "={{ $json.id }}",
    "options": {
      "returnAllMatches": false
    }
  }
}
```

**Logic**: If row found and `status=replied`, filter out.

### Node 5: Get Full Email Body (Gmail)
```json
{
  "name": "Get Email Details",
  "type": "n8n-nodes-base.gmail",
  "parameters": {
    "operation": "get",
    "messageId": "={{ $json.id }}",
    "format": "full",
    "options": {
      "dataPropertyAttachmentsPrefixName": "attachment_"
    }
  }
}
```

**Output Extraction**:
```javascript
// Code Node: Extract Body
const msg = $input.first().json;
const headers = msg.payload.headers;
const from = headers.find(h => h.name === 'From').value;
const subject = headers.find(h => h.name === 'Subject').value;
const date = headers.find(h => h.name === 'Date').value;

// Extract body (prefer HTML, fallback to text)
let body = '';
if (msg.payload.parts) {
  const textPart = msg.payload.parts.find(p => p.mimeType === 'text/plain');
  const htmlPart = msg.payload.parts.find(p => p.mimeType === 'text/html');
  if (htmlPart) {
    body = Buffer.from(htmlPart.body.data, 'base64').toString('utf8');
  } else if (textPart) {
    body = Buffer.from(textPart.body.data, 'base64').toString('utf8');
  }
} else if (msg.payload.body && msg.payload.body.data) {
  body = Buffer.from(msg.payload.body.data, 'base64').toString('utf8');
}

return {
  json: {
    email_id: msg.id,
    thread_id: msg.threadId,
    from: from,
    subject: subject,
    date: date,
    body: body.substring(0, 4000), // Truncate for AI
    snippet: msg.snippet
  }
};
```

### Node 5: Classify Intent (OpenAI)
```json
{
  "name": "Classify Email",
  "type": "@n8n/n8n-nodes-langchain.agent",
  "parameters": {
    "options": {
      "systemMessage": "You are an email classifier for info@pexabo.com. Classify the email into one of these intents: pricing_inquiry, partnership, support_request, sales, spam, other. Also rate urgency (high/medium/low) and confidence (0-1). Output JSON only."
    }
  }
}
```

**Or using HTTP Request to OpenAI**:
```json
{
  "name": "OpenAI Classify",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://api.openai.com/v1/chat/completions",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        { "name": "Authorization", "value": "Bearer {{ $env.OPENAI_API_KEY }}" },
        { "name": "Content-Type", "value": "application/json" }
      ]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        { "name": "model", "value": "gpt-4o-mini" },
        { "name": "messages", "value": "[{\"role\":\"system\",\"content\":\"You are an email classifier...\"},{\"role\":\"user\",\"content\":\"Subject: {{ $json.subject }}\\nBody: {{ $json.body }}\"}]" },
        { "name": "response_format", "value": "{\"type\":\"json_object\"}" }
      ]
    }
  }
}
```

### Node 6: Decision Router (IF Node)
```json
{
  "name": "Route by Type",
  "type": "n8n-nodes-base.if",
  "parameters": {
    "conditions": {
      "options": {
        "caseSensitive": true,
        "leftValue": "",
        "typeValidation": "strict"
      },
      "conditions": [
        {
          "id": "condition-1",
          "leftValue": "={{ $json.classification.confidence }}",
          "rightValue": "0.8",
          "operator": {
            "type": "number",
            "operation": "lt"
          }
        },
        {
          "id": "condition-2",
          "leftValue": "={{ $json.classification.needs_human }}",
          "rightValue": "true",
          "operator": {
            "type": "boolean",
            "operation": "equals"
          }
        }
      ],
      "combinator": "or"
    }
  }
}
```

**Paths**:
- **True** → Send to Fly.io (Node 7a) or Label for human review (Node 7b)
- **False** → Route by intent (Node 6b)

### Node 6b: Route by Intent (IF Node)
```json
{
  "name": "Recruiter Email?",
  "type": "n8n-nodes-base.if",
  "parameters": {
    "conditions": {
      "conditions": [
        {
          "leftValue": "={{ $json.classification.intent }}",
          "rightValue": "recruiter_job_offer",
          "operator": { "type": "string", "operation": "equals" }
        }
      ]
    }
  }
}
```

**Paths**:
- **True** → Recruiter Response Pipeline (Node 8a)
- **False** → General Draft Reply (Node 8b)

### Node 7a: Complex Task → Fly.io
```json
{
  "name": "Fly.io Brain",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://pexabo-email-brain.fly.dev/process",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        { "name": "Authorization", "value": "Bearer {{ $env.FLY_IO_API_TOKEN }}" },
        { "name": "Content-Type", "value": "application/json" }
      ]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        { "name": "email", "value": "={{ JSON.stringify($json) }}" },
        { "name": "tactics", "value": "[\"pricing_inquiry\"]" }
      ]
    }
  }
}
```

### Node 7b: Label for Human Review
```json
{
  "name": "Label Human Review",
  "type": "n8n-nodes-base.gmail",
  "parameters": {
    "operation": "addLabels",
    "messageId": "={{ $json.email_id }}",
    "labelIds": ["Label_9999999999999999999"] // Replace with actual label ID
  }
}
```

### Node 8a: Recruiter Response Pipeline

**Only for emails classified as `recruiter_job_offer`.**

#### 8a.1 Select Best CV (Code Node)
```javascript
const email = $input.first().json;
const body = (email.body || '').toLowerCase();
const subject = (email.subject || '').toLowerCase();
const text = subject + ' ' + body;

const cvMap = [
  { keywords: ['azure', 'microsoft', 'entra', 'm365'], cv: 'cv_azure_architect.pdf', techStack: 'Azure Cloud Architect' },
  { keywords: ['aws', 'amazon web services', 'ec2', 's3'], cv: 'cv_aws_architect.pdf', techStack: 'AWS Solutions Architect' },
  { keywords: ['kubernetes', 'k8s', 'docker', 'container'], cv: 'cv_kubernetes_engineer.pdf', techStack: 'Kubernetes & Container Engineer' },
  { keywords: ['devops', 'cicd', 'pipeline', 'jenkins'], cv: 'cv_devops_engineer.pdf', techStack: 'DevOps Engineer' },
  { keywords: ['security', 'soc', 'cyber', 'penetration'], cv: 'cv_security_engineer.pdf', techStack: 'Security Engineer' },
  { keywords: ['data', 'databricks', 'spark', 'data engineer'], cv: 'cv_data_engineer.pdf', techStack: 'Data Engineer' },
  { keywords: ['ai', 'machine learning', 'ml', 'generative ai'], cv: 'cv_ai_engineer.pdf', techStack: 'AI / ML Engineer' }
];

let bestMatch = { cv: 'cv_ai_engineer.pdf', techStack: 'AI Engineer' };
let maxScore = 0;

for (const mapping of cvMap) {
  const score = mapping.keywords.reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0);
  if (score > maxScore) {
    maxScore = score;
    bestMatch = mapping;
  }
}

const downloadUrl = `https://raw.githubusercontent.com/rifaterdemsahin/CVLauncher/main/5_Symbols/cvs/${bestMatch.cv}`;

return {
  json: {
    ...email,
    selected_cv: bestMatch.cv,
    tech_stack: bestMatch.techStack,
    cv_download_url: downloadUrl
  }
};
```

#### 8a.2 Call Recruiter Response Generator (HTTP Request)
```json
{
  "name": "Generate Recruiter Response",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "{{ $env.RECRUITER_GENERATOR_URL }}",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        { "name": "Content-Type", "value": "application/json" }
      ]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        { "name": "recruiter_message", "value": "={{ $json.body }}" },
        { "name": "subject", "value": "={{ $json.subject }}" },
        { "name": "from", "value": "={{ $json.from }}" },
        { "name": "cv_source_url", "value": "={{ $json.cv_download_url }}" },
        { "name": "ai_provider", "value": "gemini" }
      ]
    },
    "options": {
      "timeout": 15000
    }
  }
}
```

**Expected Response**:
```json
{
  "generated_response": "Dear recruiter, thank you for the opportunity...",
  "confidence": 0.94,
  "evidence": "Matched Azure experience in CV with job requirements",
  "model_used": "gemini-1.5-pro"
}
```

#### 8a.3 Multi-Model Fallback (Error Handling)
If Node 8a.2 fails (timeout, 5xx, empty response), trigger fallback chain:

```javascript
// Fallback Code Node
const email = $input.first().json;
const fallbackOrder = ['gemini', 'gpt4o', 'groq', 'claude'];
let result = null;
let lastError = null;

for (const provider of fallbackOrder) {
  try {
    const response = await $httpRequest({
      method: 'POST',
      url: $env.RECRUITER_GENERATOR_URL,
      body: {
        recruiter_message: email.body,
        subject: email.subject,
        from: email.from,
        cv_source_url: email.cv_download_url,
        ai_provider: provider
      },
      timeout: 15000
    });
    
    if (response.data && response.data.generated_response) {
      result = { ...response.data, model_used: provider, fallback_from: lastError ? lastError.provider : null };
      break;
    }
  } catch (err) {
    lastError = { provider, error: err.message };
    continue;
  }
}

if (!result) {
  // All models failed — route to human review
  return {
    json: {
      ...email,
      needs_human: true,
      reason: 'all_models_failed',
      errors: fallbackOrder.map((p, i) => ({ provider: p, error: lastError?.provider === p ? lastError.error : 'unknown' }))
    }
  };
}

return {
  json: {
    ...email,
    reply_body: result.generated_response,
    ai_confidence: result.confidence,
    model_used: result.model_used,
    fallback_used: !!result.fallback_from,
    evidence: result.evidence
  }
};
```

#### 8a.4 Format Recruiter Email (Code Node)
```javascript
const email = $input.first().json;

const htmlBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #2c3e50; font-size: 16px;">
  <p>Hi,</p>
  
  <p>${email.reply_body}</p>

  <div style="margin: 25px 0; padding: 20px; background-color: #f8f9fa; border-left: 5px solid #007bff; border-radius: 4px;">
    <p style="margin: 0; font-size: 18px;">
      <strong>📄 <a href="${email.cv_download_url}" style="text-decoration: none; color: #007bff;">View CV — ${email.tech_stack} (PDF)</a></strong>
    </p>
    <p style="margin: 10px 0 0 0; font-size: 16px;">
      📅 <a href="https://calendly.com/rifaterdem/schedule" style="text-decoration: none; color: #2c3e50;"><strong>Book a clear intro call</strong></a>
    </p>
  </div>

  <p>I specialize in building scalable, secure, and automated platforms for enterprise clients.</p>

  <p>I look forward to hearing from you.</p>

  <br>
  <p style="margin-bottom: 5px;">Best regards,</p>
  <p style="margin-top: 0;"><strong>Rifat Erdem Sahin</strong></p>
  <p style="font-size: 14px; color: #7f8c8d; margin-top: 5px;">
    Director | DevOps & Cloud Architect<br>
    <a href="tel:+447848024173" style="text-decoration: none; color: #7f8c8d;">+44 7848 024173</a> | 
    <a href="mailto:contact@rifaterdemsahin.com" style="text-decoration: none; color: #7f8c8d;">contact@rifaterdemsahin.com</a>
  </p>
  <p style="font-size: 14px; margin-top: 5px;">
    <a href="https://linkedin.com/in/rifaterdemsahin" style="text-decoration: none; color: #0077b5;">LinkedIn</a> | 
    <a href="https://github.com/rifaterdemsahin" style="text-decoration: none; color: #333;">GitHub</a>
  </p>
</div>
`;

return {
  json: {
    ...email,
    reply_body: htmlBody,
    is_recruiter_email: true
  }
};
```

---

### Node 8b: General Draft Reply (OpenAI with Tactics + Multi-Model Fallback)
```javascript
// Code Node: Build Prompt from Tactics
const tactics = require('../tactics-template.md'); // Or load from static data
const email = $input.first().json;

const systemPrompt = `You are the AI assistant for Pexabo (info@pexabo.com). 
Reply to emails using these tactics:
${tactics}

Rules:
- Be professional but warm
- Keep replies concise (max 3 paragraphs)
- Include signature automatically
- If unsure, ask clarifying question rather than guess
`;

return {
  json: {
    ...email,
    system_prompt: systemPrompt,
    user_prompt: `Subject: ${email.subject}\nFrom: ${email.from}\nBody: ${email.body}`
  }
};
```

#### 8b.1 Multi-Model Reply Generation
```json
{
  "name": "Generate Reply — Primary (GPT-4o)",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://api.openai.com/v1/chat/completions",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        { "name": "Authorization", "value": "Bearer {{ $env.OPENAI_API_KEY }}" },
        { "name": "Content-Type", "value": "application/json" }
      ]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        { "name": "model", "value": "gpt-4o" },
        { "name": "messages", "value": "=[{\"role\":\"system\",\"content\":\"{{ $json.system_prompt }}\"},{\"role\":\"user\",\"content\":\"{{ $json.user_prompt }}\"}]" },
        { "name": "temperature", "value": "0.7" },
        { "name": "max_tokens", "value": "800" }
      ]
    },
    "options": { "timeout": 10000 }
  }
}
```

**Error Handling — Fallback Chain**:
If primary fails, n8n "Execute Once on Error" routes to:

1. **Fallback 1**: Gemini via `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={{ $env.GEMINI_API_KEY }}`
2. **Fallback 2**: Groq via `https://api.groq.com/openai/v1/chat/completions` with `llama-3.1-70b-versatile`
3. **Fallback 3**: Claude via `https://api.anthropic.com/v1/messages` with `claude-3-5-sonnet-20241022`

```javascript
// Code Node: Extract Reply + Log Model
const input = $input.first().json;
const response = input.choices?.[0]?.message?.content || input.content?.[0]?.text || input.candidates?.[0]?.content?.parts?.[0]?.text || 'Error: No response';
const model = input.model_used || input.model || 'unknown';

return {
  json: {
    ...input,
    reply_body: response,
    model_used: model,
    is_recruiter_email: false
  }
};
```

### Node 9: Send Reply (Gmail)
```json
{
  "name": "Send Reply",
  "type": "n8n-nodes-base.gmail",
  "parameters": {
    "operation": "send",
    "to": "={{ $json.from }}",
    "subject": "Re: {{ $json.subject }}",
    "message": "={{ $json.reply_body }}",
    "options": {
      "sendAsHtml": true,
      "threadId": "={{ $json.thread_id }}"
    }
  }
}
```

### Node 10: Mark as Replied
```json
{
  "name": "Mark Replied",
  "type": "n8n-nodes-base.gmail",
  "parameters": {
    "operation": "addLabels",
    "messageId": "={{ $json.email_id }}",
    "labelIds": ["Label_8888888888888888888"] // replied_by_bot label ID
  }
}
```

**Additional Code Node**: Mark as read + archive
```javascript
// After adding label, also mark read
const emailId = $input.first().json.email_id;
// This requires Gmail API raw call or separate node
// n8n Gmail node supports addLabels but not remove from inbox directly
// Use HTTP Request to Gmail API for full control
```

### Node 11: Log to Tracker (Google Sheets)
```json
{
  "name": "Log to Tracker",
  "type": "n8n-nodes-base.googleSheets",
  "parameters": {
    "operation": "append",
    "documentId": "{{ $env.GOOGLE_SHEETS_DOC_ID }}",
    "sheetName": "Tracker",
    "columns": {
      "mappingMode": "autoMapInputData"
    }
  }
}
```

### Node 12: Notify Success (Telegram)
```json
{
  "name": "Notify Telegram",
  "type": "n8n-nodes-base.telegram",
  "parameters": {
    "operation": "sendMessage",
    "chatId": "{{ $env.TELEGRAM_CHAT_ID }}",
    "text": "✅ Replied to: {{ $json.from }}\nSubject: {{ $json.subject }}\nTactic: {{ $json.tactic_used }}\nConfidence: {{ $json.confidence }}"
  }
}
```

---

## Error Handling

### Global Error Node
- **Type**: Error Trigger
- **Action**: Send Telegram alert + log to Sheets `Errors` tab

### Per-Node Retry
- Gmail nodes: 3 retries with 5s delay
- OpenAI nodes: 3 retries with exponential backoff
- Gemini nodes: 2 retries with 3s delay
- Groq nodes: 2 retries with 2s delay (Groq is fast)
- Claude nodes: 2 retries with 5s delay
- Recruiter Generator (`rifat-cvs-response-generator.fly.dev`): 2 retries with 5s delay, then trigger multi-model fallback
- Fly.io: 2 retries with 10s delay, then fallback to human review

---

## Workflow JSON Export

To export the workflow once built:
1. In n8n UI: Workflow → Download
2. Save to `backups/auto-reply-pexabo-YYYY-MM-DD.json`
3. Commit to git

To update via API:
```bash
node scripts/n8n-workflow-updater.js
```

---

*Last updated: 2026-05-09*
