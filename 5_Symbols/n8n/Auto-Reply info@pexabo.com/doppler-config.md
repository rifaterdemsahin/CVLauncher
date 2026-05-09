# Doppler Configuration Guide

> **Policy**: All secrets live in Doppler ONLY. No `.env` files are committed or used.
>
> **Run everything with**: `doppler run -- <command>` (after setup)
>
> **Troubleshooting**: See `doppler-windows-guide.md` if commands fail

---

## Step 1: Create Doppler Project

1. Go to https://dashboard.doppler.com
2. Sign up or log in
3. Create new project: `pexabo-email-automation`
4. Create environments:
   ```bash
   doppler configs create dev --project pexabo-email-automation
   doppler configs create stg --project pexabo-email-automation
   doppler configs create prd --project pexabo-email-automation
   ```

---

## Step 2: Set Up Local Directory

Navigate to the project folder and run setup:

```powershell
cd "C:\projects\CVLauncher\5_Symbols\n8n\Auto-Reply info@pexabo.com"
doppler setup --project pexabo-email-automation --config prd_main
```

Verify setup:
```powershell
doppler setup --print
```

Expected output:
```
Project: pexabo-email-automation
Config: prd
```

---

## Step 3: Add Secrets

### Required Secrets

Run these commands one by one. Replace placeholders with your actual values.

#### N8N
```powershell
doppler secrets set N8N_HOST="https://n8n.rifaterdemsahin.com"
doppler secrets set N8N_MCP_ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5M2ZmNTM4NS01YWZhLTRjZGQ4YzY2LTViMjI5Mjk3OWY4OCIsImlzcyI6Im44biIsImF1ZCI6Im1jcC1zZXJ2ZXItYXBpIiwianRpIjoiNmNmODViYmYtNmZlZS00MDJlLWI5NTQtZGU5ZTRkNGYwZTFiIiwiaWF0IjoxNzY0MjQ0OTEsImV4cCI6MTc2NjgzNjkxMX0.RtJxmM9u171Ccw840oALxeTHigEG5cKUADkkj5ECU-U"
doppler secrets set N8N_MCP_ENDPOINT="https://n8n.rifaterdemsahin.com/mcp-server/http"
doppler secrets set N8N_API_KEY="REPLACE_WITH_N8N_API_KEY"
```

#### Gmail API
```powershell
doppler secrets set GMAIL_CLIENT_ID="REPLACE_WITH_GMAIL_CLIENT_ID"
doppler secrets set GMAIL_CLIENT_SECRET="REPLACE_WITH_GMAIL_CLIENT_SECRET"
doppler secrets set GMAIL_REFRESH_TOKEN="REPLACE_WITH_GMAIL_REFRESH_TOKEN"
```

#### AI Models
```powershell
doppler secrets set OPENAI_API_KEY="REPLACE_WITH_OPENAI_KEY"
doppler secrets set GEMINI_API_KEY="REPLACE_WITH_GEMINI_KEY"
doppler secrets set GROQ_API_KEY="REPLACE_WITH_GROQ_KEY"
doppler secrets set ANTHROPIC_API_KEY="REPLACE_WITH_ANTHROPIC_KEY"
```

#### Fly.io
```powershell
doppler secrets set FLY_IO_API_TOKEN="FlyV1 fm2_lJPECAAAAAAAEkhKxBDXBZ3Y9uaEbh0UJdAG6hmowrVodHRwczovL2FwaS5mbHkuaW8jGUAJLOABdCOB8Lk7lodHRwczovL2FwaS5mbHkuaW8vYWFhL3YxxDzDulYuSMdzwTSH5TBl"
doppler secrets set FLY_IO_APP_URL="https://pexabo-email-brain.fly.dev"
```

#### Recruiter Generator
```powershell
doppler secrets set RECRUITER_GENERATOR_URL="https://rifat-cvs-response-generator.fly.dev/recruiter"
```

#### Telegram (Optional)
```powershell
doppler secrets set TELEGRAM_BOT_TOKEN="REPLACE_WITH_TELEGRAM_BOT_TOKEN"
doppler secrets set TELEGRAM_CHAT_ID="REPLACE_WITH_TELEGRAM_CHAT_ID"
```

#### Google Sheets (Optional)
```powershell
doppler secrets set GOOGLE_SHEETS_DOC_ID="REPLACE_WITH_SPREADSHEET_ID"
doppler secrets set GOOGLE_SHEETS_CREDENTIALS="REPLACE_WITH_BASE64_CREDENTIALS"
```

---

## Step 4: Verify Secrets

```powershell
doppler secrets
```

Should show all secrets. If any are missing, add them.

---

## Step 5: Test Secret Access

### Test 1: Simple Environment Variable
```powershell
doppler run -- node -e "console.log('N8N_HOST:', process.env.N8N_HOST)"
```

### Test 2: Gmail Connection
```powershell
doppler run -- node scripts/gmail-query-builder.js --show-labels
```

### Test 3: n8n MCP Connection
```powershell
doppler run -- node -e "console.log('MCP token length:', process.env.N8N_MCP_ACCESS_TOKEN.length)"
```

---

## Step 6: Running Scripts (Doppler Only)

**Correct:**
```powershell
doppler run -- node scripts/n8n-mcp-deployer.js --create
doppler run -- node scripts/process-specific-email.js "URL" --dry-run
doppler run -- node scripts/gmail-query-builder.js --show-labels
```

**Incorrect (Never do this):**
```powershell
node scripts/n8n-mcp-deployer.js --create          # ❌ No secrets available
doppler run --config prd_main --                        # ❌ Missing command after --
```

---

## Step 7: Integrate with n8n

### Option A: Doppler CLI (Recommended for self-hosted n8n)

```powershell
# On your n8n server
doppler login
doppler setup --project pexabo-email-automation --config prd_main

# Run n8n with Doppler
doppler run -- docker-compose up -d n8n
```

### Option B: n8n Credentials (Easier for cloud/hosted)

1. In n8n: Settings → Credentials
2. Create `Google OAuth2` credential
3. Fill Client ID/Secret from Doppler
4. Connect and authorize info@pexabo.com
5. n8n stores the refresh token automatically

For OpenAI:
1. Credentials → OpenAI
2. API Key: Paste from Doppler

For Multi-Model Fallback:
1. Create HTTP Request credentials for each provider:
   - **Gemini**: Header `x-goog-api-key` = `{{ $env.GEMINI_API_KEY }}`
   - **Groq**: Header `Authorization` = `Bearer {{ $env.GROQ_API_KEY }}`
   - **Claude**: Header `x-api-key` = `{{ $env.ANTHROPIC_API_KEY }}`
2. Or store all as generic `httpHeaderAuth` credentials in n8n

---

## Step 8: Integrate with Fly.io

### In `fly.toml`

```toml
[env]
  DOPPLER_TOKEN = "dp.st.prd.xxxxxxxx"

[build.args]
  DOPPLER_TOKEN = "dp.st.prd.xxxxxxxx"
```

### In Dockerfile

```dockerfile
# Install Doppler CLI
RUN (curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh || wget -t 3 -qO- https://cli.doppler.com/install.sh) | sh

# Entrypoint uses Doppler
ENTRYPOINT ["doppler", "run", "--", "node", "server.js"]
```

### Deploy with Doppler Token

```powershell
fly deploy --build-arg DOPPLER_TOKEN=$(doppler configs tokens create --project pexabo-email-automation --config prd fly-deploy-token --plain)
```

---

## Security Best Practices

1. **Never commit secrets** — `.env` and `*.key` files are gitignored
2. **Rotate tokens monthly** — Use Doppler rotation reminders
3. **Least privilege** — Gmail scope should be `gmail.modify` not `gmail.readonly`
4. **Audit access** — Check Doppler audit logs quarterly

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "requires at least 1 arg(s), received 0" | Add command after `--`: `doppler run -- node script.js` |
| "Could not find config prd" | Run `doppler configs create prd_main --project pexabo-email-automation --environment prd` |
| "Doppler project not configured" | Run `doppler setup --project pexabo-email-automation --config prd_main` |
| "Unauthorized" | Run `doppler login` |
| Secrets not showing | Run `doppler secrets --project pexabo-email-automation --config prd_main` |
| `GMAIL_REFRESH_TOKEN` expired | Re-authorize in Google OAuth Playground |
| `OPENAI_API_KEY` rate limited | Add rate limiting in n8n or upgrade plan |
| n8n can't see env vars | Ensure `doppler run` wraps n8n process |
| Fly.io secrets missing | Verify `DOPPLER_TOKEN` is set in `fly.toml` |

---

## Already Provided Secrets

| Secret | Value | Status |
|--------|-------|--------|
| `N8N_HOST` | `https://n8n.rifaterdemsahin.com` | ✅ |
| `N8N_MCP_ACCESS_TOKEN` | JWT from n8n | ✅ |
| `N8N_MCP_ENDPOINT` | `https://n8n.rifaterdemsahin.com/mcp-server/http` | ✅ |
| `FLY_IO_API_TOKEN` | FlyV1 ... | ✅ |
| `FLY_IO_APP_URL` | `https://pexabo-email-brain.fly.dev` | ✅ |
| `RECRUITER_GENERATOR_URL` | `https://rifat-cvs-response-generator.fly.dev/recruiter` | ✅ |

## Still Needed

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

*Last updated: 2026-05-09*
