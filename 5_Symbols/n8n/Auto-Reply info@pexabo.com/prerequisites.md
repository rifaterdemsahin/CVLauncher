# Prerequisites: What You Need to Provide

This document lists every secret, token, credential, and piece of information you need to give me (or store in Doppler) before the auto-reply system can be deployed.

---

## Phase 1: Doppler Project Setup (You Do This)

### Step 1: Create Doppler Project
1. Go to https://dashboard.doppler.com
2. Create new project: `pexabo-email-automation`
3. Create environments: `dev`, `stg`, `prd`
4. Give me the **Project Name** and confirm it's created

---

## Phase 2: Gmail API Credentials (You Generate These)

### 2.1 Google Cloud Console Setup
1. Go to https://console.cloud.google.com
2. Select or create project: `pexabo-email-automation`
3. Enable APIs:
   - Gmail API
   - Google Sheets API
   - Google Calendar API (optional, for meeting scheduling)
4. Go to **Credentials** → **Create OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: Add `http://localhost:3000/oauth2callback`
7. Download the client secrets JSON

### 2.2 Secrets to Store in Doppler

| Secret Name | Where It Comes From | Format |
|-------------|---------------------|--------|
| `GMAIL_CLIENT_ID` | Google Cloud Console → Credentials → OAuth 2.0 Client ID | `123456789-abc.apps.googleusercontent.com` |
| `GMAIL_CLIENT_SECRET` | Same page, "Client secret" field | `GOCSPX-xxxxxxxx` |
| `GMAIL_REFRESH_TOKEN` | Generated via OAuth Playground (see below) | `1//04xxxxxxxx` |

### 2.3 How to Get the Refresh Token

```bash
# Option A: Using this repo's script
node scripts/gmail-query-builder.js --interactive

# Option B: Manual via Google OAuth Playground
# 1. Go to https://developers.google.com/oauthplayground
# 2. Click gear icon (settings) → Check "Use your own OAuth credentials"
# 3. Enter your Client ID and Client Secret
# 4. Select scope: https://www.googleapis.com/auth/gmail.modify
# 5. Click "Authorize APIs" → Sign in with info@pexabo.com
# 6. Click "Exchange authorization code for tokens"
# 7. Copy the Refresh Token
# 8. Paste it into Doppler as GMAIL_REFRESH_TOKEN
```

**IMPORTANT**: The refresh token is tied to the Google account. Make sure you sign in as `info@pexabo.com`.

---

## Phase 3: OpenAI / AI Model API Keys (You Get These)

### 3.1 Required AI Providers

| Secret Name | Provider | Where to Get It | Cost Tier |
|-------------|----------|-----------------|-----------|
| `OPENAI_API_KEY` | OpenAI (GPT-4o, GPT-4o-mini) | https://platform.openai.com/api-keys | ~$5-20/month |
| `GEMINI_API_KEY` | Google AI Studio (Gemini 1.5 Pro/Flash) | https://aistudio.google.com/app/apikey | Free tier available |
| `GROQ_API_KEY` | Groq (Llama-3, Mixtral — fast inference) | https://console.groq.com/keys | Free tier available |
| `ANTHROPIC_API_KEY` | Anthropic (Claude 3.5 Sonnet) | https://console.anthropic.com/settings/keys | ~$5-10/month |

### 3.2 Minimum Viable Setup
If you want to minimize costs, you **only need**:
- `OPENAI_API_KEY` (primary for everything)
- `GEMINI_API_KEY` (free tier, good fallback)

The multi-model fallback will still work with just these two.

---

## Phase 4: n8n Credentials (You Have These)

| Secret Name | Where It Comes From |
|-------------|---------------------|
| `N8N_HOST` | Your n8n instance URL: `https://n8n.rifaterdemsahin.com` |
| `N8N_API_KEY` | n8n → Settings → API → Generate API Key |

### How to Get N8N API Key
1. Go to https://n8n.rifaterdemsahin.com
2. Click your profile (bottom left) → **Settings**
3. Go to **API** tab
4. Click **Generate API Key**
5. Copy the key and paste into Doppler

---

## Phase 5: Telegram Alerts (Optional but Recommended)

| Secret Name | Where It Comes From |
|-------------|---------------------|
| `TELEGRAM_BOT_TOKEN` | Talk to @BotFather on Telegram → `/newbot` → copy token |
| `TELEGRAM_CHAT_ID` | Send a message to your bot → use `https://api.telegram.org/bot<TOKEN>/getUpdates` to find chat ID |

**Why**: Get notified when emails are replied, when errors happen, or when human review is needed.

---

## Phase 6: Google Sheets Tracker (You Create This)

1. Create a new Google Sheet named: `Pexabo Email Tracker`
2. Share it with the service account email (from Google Cloud Console)
3. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/1BxiMVs0XXXXXXXXXXXXXXXXX/edit
                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^
                                   This is the DOC_ID
   ```

### 6.1 Sheet Structure

**Sheet 1: "Tracker"**
| email_id | thread_id | from | subject | received_at | classified_as | tactic_used | reply_sent_at | status | ai_confidence | model_used | recruiter_response_used | cv_sent |

**Sheet 2: "Errors"**
| timestamp | email_id | error_type | error_message | model_used |

### 6.2 Secrets to Store

| Secret Name | Value |
|-------------|-------|
| `GOOGLE_SHEETS_DOC_ID` | The spreadsheet ID from above |
| `GOOGLE_SHEETS_CREDENTIALS` | Service account JSON (base64 encoded) |

---

## Phase 7: Existing Services (Already Running)

| Secret Name | Value | Status |
|-------------|-------|--------|
| `RECRUITER_GENERATOR_URL` | `https://rifat-cvs-response-generator.fly.dev/recruiter` | ✅ Already deployed |
| `FLY_IO_APP_URL` | `https://pexabo-email-brain.fly.dev` | 🔄 To be deployed |

**Note**: The CV Response Generator at `rifat-cvs-response-generator.fly.dev` is already live. We just need to point to it.

---

## Phase 8: Domain / Sender Identity

Confirm these are correct:

| Item | Value | Your Confirmation |
|------|-------|-------------------|
| Primary email address | `info@pexabo.com` | ✅ |
| Sender name | `Rifat Erdem Sahin` | ✅ |
| Company name | `Pexabo` | ✅ |
| Phone | `+44 7848 024173` | ✅ |
| Calendly link | `https://calendly.com/rifaterdem/schedule` | ✅ |
| LinkedIn | `https://linkedin.com/in/rifaterdemsahin` | ✅ |
| GitHub | `https://github.com/rifaterdemsahin` | ✅ |
| CV repo base URL | `https://raw.githubusercontent.com/rifaterdemsahin/CVLauncher/main/5_Symbols/cvs/` | ✅ |

---

## Complete Checklist

Before we start deployment, confirm you have:

- [ ] Doppler project `pexabo-email-automation` created
- [ ] Gmail API enabled in Google Cloud Console
- [ ] OAuth 2.0 Client ID + Secret downloaded
- [ ] Gmail refresh token generated (via OAuth Playground)
- [ ] OpenAI API Key
- [ ] Gemini API Key (optional but recommended)
- [ ] Groq API Key (optional)
- [ ] Anthropic API Key (optional)
- [ ] n8n API Key from your instance
- [ ] Telegram bot token (optional)
- [ ] Telegram chat ID (optional)
- [ ] Google Sheets "Pexabo Email Tracker" created
- [ ] Spreadsheet ID copied
- [ ] Service account credentials downloaded
- [ ] All secrets stored in Doppler `prd` environment

---

## How to Share Secrets with Me

**DO NOT paste secrets in chat.** Instead:

1. Store them in Doppler
2. Run this locally to verify Doppler has everything:
   ```bash
   doppler secrets --config prd_main
   ```
3. I will write code that reads from Doppler at runtime
4. If a script needs a secret, you run it with Doppler:
   ```bash
   doppler run -- node scripts/process-specific-email.js "URL" --dry-run
   ```

---

## Time Estimate

| Task | Estimated Time |
|------|----------------|
| Google Cloud Console setup | 15 min |
| Gmail OAuth + refresh token | 10 min |
| OpenAI + Gemini API keys | 10 min |
| Doppler project + secrets | 15 min |
| n8n API key | 2 min |
| Telegram bot setup | 10 min |
| Google Sheets setup | 10 min |
| **Total** | **~70 minutes** |

---

*Once you confirm all prerequisites are ready, I will begin MCP-based n8n code generation and deployment.*
