# KEYS NEEDED — Provide These to Start Building

I need the following secrets to begin MCP-based code generation and deployment. **Provide them one by one or all at once.** I will store them in a `.env` file locally (gitignored) and guide you to add them to Doppler.

---

## TIER 1: MUST HAVE (System won't work without these)

### 1. Gmail API (for reading/sending emails)

| Secret | Format | How to get it |
|--------|--------|---------------|
| `GMAIL_CLIENT_ID` | `123456789-abc.apps.googleusercontent.com` | Google Cloud Console → Credentials → OAuth 2.0 Client ID |
| `GMAIL_CLIENT_SECRET` | `GOCSPX-xxxxxxxx` | Same page as above |
| `GMAIL_REFRESH_TOKEN` | `1//04xxxxxxxx` | OAuth Playground (see prerequisites.md step 1.3) |

**Quick path to get refresh token:**
1. https://developers.google.com/oauthplayground
2. Click gear icon → "Use your own OAuth credentials" → paste Client ID + Secret
3. Select scope: `https://www.googleapis.com/auth/gmail.modify`
4. Authorize APIs → Sign in as **info@pexabo.com**
5. Exchange authorization code for tokens → copy Refresh Token

---

### 2. OpenAI API (for email classification + general replies)

| Secret | Format | How to get it |
|--------|--------|---------------|
| `OPENAI_API_KEY` | `sk-proj-...` or `sk-...` | https://platform.openai.com/api-keys |

---

### 3. Gemini API (for recruiter CV responses + fallback)

| Secret | Format | How to get it |
|--------|--------|---------------|
| `GEMINI_API_KEY` | `AIzaSy...` | https://aistudio.google.com/app/apikey |

---

### 4. n8n API (for workflow deployment)

| Secret | Format | How to get it |
|--------|--------|---------------|
| `N8N_HOST` | `https://n8n.rifaterdemsahin.com` | Your n8n instance URL |
| `N8N_API_KEY` | `n8n_api_...` | n8n UI → Settings → API → Generate API Key |

---

### 5. Google Sheets (for tracking)

| Secret | Format | How to get it |
|--------|--------|---------------|
| `GOOGLE_SHEETS_DOC_ID` | `1BxiMVs0XXXXXXXXXXXXXXXXX` | From Sheets URL |
| `GOOGLE_SHEETS_CREDENTIALS` | base64-encoded JSON | Service account key (base64) |

---

## TIER 2: SHOULD HAVE (For recruiter pipeline + robustness)

| Secret | Format | How to get it |
|--------|--------|---------------|
| `RECRUITER_GENERATOR_URL` | `https://rifat-cvs-response-generator.fly.dev/recruiter` | Already deployed — just confirm |
| `GROQ_API_KEY` | `gsk_...` | https://console.groq.com/keys (free tier) |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | https://console.anthropic.com (optional) |

---

## TIER 3: NICE TO HAVE (Notifications)

| Secret | Format | How to get it |
|--------|--------|---------------|
| `TELEGRAM_BOT_TOKEN` | `123456:ABC-DEF...` | Message @BotFather on Telegram |
| `TELEGRAM_CHAT_ID` | `-1001234567890` | Call getUpdates API after sending bot a message |
| `FLY_IO_API_TOKEN` | `FlyV1 ...` | Fly.io dashboard → Tokens |

---

## HOW TO PROVIDE THESE

**Option A: Paste each key as you generate it**

Just reply with:
```
GMAIL_CLIENT_ID=xxx
GMAIL_CLIENT_SECRET=yyy
```

I will create the `.env` file for you locally.

**Option B: Create Doppler project yourself**

1. Go to https://dashboard.doppler.com
2. Create project: `pexabo-email-automation`
3. Add secrets to `prd` environment
4. Run locally:
   ```bash
   doppler login
   doppler setup --project pexabo-email-automation --config prd
   ```
5. Tell me "Doppler is ready"

---

## IMMEDIATE NEXT STEP

**Provide these 4 now and I can start building immediately:**
1. `GMAIL_CLIENT_ID`
2. `GMAIL_CLIENT_SECRET`
3. `GMAIL_REFRESH_TOKEN`
4. `OPENAI_API_KEY`

The rest can be added as we go.

---

*Waiting for your keys...*
