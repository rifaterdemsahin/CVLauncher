# Doppler Configuration Guide

## Why Doppler?

Instead of hardcoding API keys in n8n or environment files, Doppler acts as a secure vault. n8n and Fly.io fetch secrets at runtime.

---

## Step 1: Create Doppler Project

1. Go to https://dashboard.doppler.com
2. Create new project: `pexabo-email-automation`
3. Environments: `dev`, `stg`, `prd`

---

## Step 2: Add Secrets

### Required Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `GMAIL_CLIENT_ID` | Google OAuth Client ID | `123456789-abc.apps.googleusercontent.com` |
| `GMAIL_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-xxxxxxxx` |
| `GMAIL_REFRESH_TOKEN` | OAuth Refresh Token for info@pexabo.com | `1//04xxxxxxxx` |
| `OPENAI_API_KEY` | OpenAI API Key | `sk-proj-xxxxxxxx` |
| `N8N_API_KEY` | n8n API Key | `n8n_api_xxxxxxxx` |
| `N8N_HOST` | n8n instance URL | `https://n8n.rifaterdemsahin.com` |
| `GOOGLE_SHEETS_DOC_ID` | Tracker spreadsheet ID | `1BxiMVs0XXXXXXXXXXXXXXXXX` |
| `GOOGLE_SHEETS_CREDENTIALS` | Service account JSON (base64) | `eyJ0eXBlIjoic2Vy...` |
| `FLY_IO_API_TOKEN` | Fly.io deploy token | `FlyV1 xxxxxxxx` |
| `FLY_IO_APP_URL` | Fly.io app URL | `https://pexabo-email-brain.fly.dev` |
| `RECRUITER_GENERATOR_URL` | CV Response Generator endpoint | `https://rifat-cvs-response-generator.fly.dev/recruiter` |
| `GEMINI_API_KEY` | Google AI Studio API Key | `AIzaSyxxxxxxxx` |
| `GROQ_API_KEY` | Groq API Key | `gsk_xxxxxxxx` |
| `ANTHROPIC_API_KEY` | Anthropic API Key | `sk-ant-api03-xxxxxxxx` |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | `123456:ABC-DEF1234...` |
| `TELEGRAM_CHAT_ID` | Your Telegram chat ID | `-1001234567890` |

### How to Get Gmail Refresh Token

```bash
# Install oauth2l or use Google OAuth Playground
# Recommended: Google OAuth Playground (https://developers.google.com/oauthplayground)

# Step 1: Select scope
https://www.googleapis.com/auth/gmail.modify

# Step 2: Exchange authorization code for refresh token
# Store the refresh token in Doppler
```

---

## Step 3: Integrate with n8n

### Option A: Doppler CLI (Recommended for self-hosted n8n)

```bash
# On your n8n server
sudo doppler login
sudo doppler setup --project pexabo-email-automation --config prd

# Run n8n with Doppler
sudo doppler run -- docker-compose up -d n8n
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

## Step 4: Integrate with Fly.io

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

```bash
fly deploy --build-arg DOPPLER_TOKEN=$(doppler configs tokens create --project pexabo-email-automation --config prd fly-deploy-token --plain)
```

---

## Step 5: Test Secret Access

### From n8n (Code Node)

```javascript
// Test that secrets are available
return {
  json: {
    n8n_host: $env.N8N_HOST,
    has_openai_key: !!$env.OPENAI_API_KEY,
    has_gmail_token: !!$env.GMAIL_REFRESH_TOKEN
  }
};
```

### From Fly.io

```javascript
// server.js
console.log('OpenAI Key present:', !!process.env.OPENAI_API_KEY);
console.log('Gmail Token present:', !!process.env.GMAIL_REFRESH_TOKEN);
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
| `GMAIL_REFRESH_TOKEN` expired | Re-authorize in Google OAuth Playground |
| `OPENAI_API_KEY` rate limited | Add rate limiting in n8n or upgrade plan |
| n8n can't see env vars | Ensure `doppler run` wraps n8n process |
| Fly.io secrets missing | Verify `DOPPLER_TOKEN` is set in `fly.toml` |

---

*Last updated: 2026-05-09*
