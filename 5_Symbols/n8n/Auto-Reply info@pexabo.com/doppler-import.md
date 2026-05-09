# Secrets Setup via Doppler (No .env Files)

> **Policy**: All secrets live in Doppler ONLY. No `.env` files are committed or used.
>
> **Run everything with**: `doppler run -- <command>` (after `doppler setup`)

---

## Prerequisites

1. Install Doppler CLI: https://docs.doppler.com/docs/install-cli
2. Login: `doppler login`
3. Create project: `doppler projects create pexabo-email-automation`
4. Create environments: `doppler configs create dev` and `doppler configs create prd`

---

## Step 1: Add Secrets Directly to Doppler

Run these commands one by one. Replace `REPLACE_WITH_*` with your actual values.

### N8N

```bash
doppler login
doppler setup --project pexabo-email-automation --config prd

doppler secrets set N8N_HOST="https://n8n.rifaterdemsahin.com"
doppler secrets set N8N_MCP_ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5M2ZmNTM4NS01YWZhLTRjZGQ4YzY2LTViMjI5Mjk3OWY4OCIsImlzcyI6Im44biIsImF1ZCI6Im1jcC1zZXJ2ZXItYXBpIiwianRpIjoiNmNmODViYmYtNmZlZS00MDJlLWI5NTQtZGU5ZTRkNGYwZTFiIiwiaWF0IjoxNzY0MjQ0OTEsImV4cCI6MTc2NjgzNjkxMX0.RtJxmM9u171Ccw840oALxeTHigEG5cKUADkkj5ECU-U"
doppler secrets set N8N_MCP_ENDPOINT="https://n8n.rifaterdemsahin.com/mcp-server/http"
doppler secrets set N8N_API_KEY="REPLACE_WITH_N8N_API_KEY"
```

### Fly.io

```bash
doppler secrets set FLY_IO_API_TOKEN="FlyV1 fm2_lJPECAAAAAAAEkhKxBDXBZ3Y9uaEbh0UJdAG6hmowrVodHRwczovL2FwaS5mbHkuaW8jGUAJLOABdCOB8Lk7lodHRwczovL2FwaS5mbHkuaW8vYWFhL3YxxDzDulYuSMdzwTSH5TBl"
doppler secrets set FLY_IO_APP_URL="https://pexabo-email-brain.fly.dev"
```

### Gmail API

```bash
doppler secrets set GMAIL_CLIENT_ID="REPLACE_WITH_GMAIL_CLIENT_ID"
doppler secrets set GMAIL_CLIENT_SECRET="REPLACE_WITH_GMAIL_CLIENT_SECRET"
doppler secrets set GMAIL_REFRESH_TOKEN="REPLACE_WITH_GMAIL_REFRESH_TOKEN"
```

### AI Models

```bash
doppler secrets set OPENAI_API_KEY="REPLACE_WITH_OPENAI_KEY"
doppler secrets set GEMINI_API_KEY="REPLACE_WITH_GEMINI_KEY"
doppler secrets set GROQ_API_KEY="REPLACE_WITH_GROQ_KEY"
doppler secrets set ANTHROPIC_API_KEY="REPLACE_WITH_ANTHROPIC_KEY"
```

### Recruiter Response Generator

```bash
doppler secrets set RECRUITER_GENERATOR_URL="https://rifat-cvs-response-generator.fly.dev/recruiter"
```

### Telegram (Optional)

```bash
doppler secrets set TELEGRAM_BOT_TOKEN="REPLACE_WITH_TELEGRAM_BOT_TOKEN"
doppler secrets set TELEGRAM_CHAT_ID="REPLACE_WITH_TELEGRAM_CHAT_ID"
```

### Google Sheets (Optional)

```bash
doppler secrets set GOOGLE_SHEETS_DOC_ID="REPLACE_WITH_SPREADSHEET_ID"
doppler secrets set GOOGLE_SHEETS_CREDENTIALS="REPLACE_WITH_BASE64_CREDENTIALS"
```

---

## Step 2: Verify All Secrets

```bash
doppler secrets --config prd
```

You should see all secrets listed. If any are missing, add them.

---

## Step 3: Test Locally with Doppler

```bash
# Navigate to project folder first
cd "C:\projects\CVLauncher\5_Symbols\n8n\Auto-Reply info@pexabo.com"

# Test Gmail connection
doppler run -- node scripts/gmail-query-builder.js --show-labels

# Test n8n MCP connection
doppler run -- node -e "console.log('MCP token length:', process.env.N8N_MCP_ACCESS_TOKEN.length)"

# Test script execution
doppler run -- node scripts/process-specific-email.js "URL" --dry-run
```

---

## Step 4: Add to .gitignore (If Not Already)

```bash
# Ensure .env files are never committed
echo ".env" >> .gitignore
echo "*.env" >> .gitignore
```

---

## Already Provided (No Action Needed)

| Secret | Value | Status |
|--------|-------|--------|
| `N8N_HOST` | `https://n8n.rifaterdemsahin.com` | ✅ |
| `N8N_MCP_ACCESS_TOKEN` | JWT from n8n | ✅ |
| `N8N_MCP_ENDPOINT` | `https://n8n.rifaterdemsahin.com/mcp-server/http` | ✅ |
| `FLY_IO_API_TOKEN` | FlyV1 ... | ✅ |
| `FLY_IO_APP_URL` | `https://pexabo-email-brain.fly.dev` | ✅ |
| `RECRUITER_GENERATOR_URL` | `https://rifat-cvs-response-generator.fly.dev/recruiter` | ✅ |

## Still Needed (Replace Placeholders)

| Secret | Where to Get |
|--------|--------------|
| `N8N_API_KEY` | n8n.rifaterdemsahin.com → Settings → API |
| `GMAIL_CLIENT_ID` | Google Cloud Console → Credentials |
| `GMAIL_CLIENT_SECRET` | Google Cloud Console → Credentials |
| `GMAIL_REFRESH_TOKEN` | OAuth Playground (see prerequisites.md) |
| `OPENAI_API_KEY` | platform.openai.com/api-keys |
| `GEMINI_API_KEY` | aistudio.google.com/app/apikey |
| `GROQ_API_KEY` | console.groq.com/keys (optional) |
| `ANTHROPIC_API_KEY` | console.anthropic.com (optional) |
| `TELEGRAM_BOT_TOKEN` | @BotFather (optional) |
| `TELEGRAM_CHAT_ID` | getUpdates API (optional) |
| `GOOGLE_SHEETS_DOC_ID` | Sheets URL (optional) |
| `GOOGLE_SHEETS_CREDENTIALS` | Service account key (optional) |

---

## Running Scripts (Always Use Doppler)

**Correct (after `doppler setup`):**
```bash
cd "C:\projects\CVLauncher\5_Symbols\n8n\Auto-Reply info@pexabo.com"
doppler run -- node scripts/n8n-mcp-deployer.js --create
doppler run -- node scripts/process-specific-email.js "URL" --dry-run
doppler run -- node scripts/gmail-query-builder.js --show-labels
```

**Or with explicit project (if no setup):**
```bash
doppler run --project pexabo-email-automation --config prd -- node scripts/process-specific-email.js
```

**Incorrect (Never do this):**
```bash
node scripts/n8n-mcp-deployer.js --create          # ❌ No secrets available
source .env && node scripts/...                    # ❌ .env files not used
doppler run --config prd --                        # ❌ Missing command after --
```

---

*All secrets live in Doppler. No exceptions.*
