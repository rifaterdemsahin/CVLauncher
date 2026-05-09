# Implementation Steps

This document provides a step-by-step guide to implement the Auto-Reply System for info@pexabo.com. Follow these steps in order. Do not skip prerequisites.

---

## Step 0: Before You Start

**Estimated total time**: 2-3 hours (including waiting for API approvals)

**What you need**:
- A computer with Node.js 18+ installed
- Access to `info@pexabo.com` Gmail
- Access to `n8n.rifaterdemsahin.com`
- A credit card (for OpenAI API, though costs are minimal)

---

## Phase 1: Prerequisites (You — ~70 minutes)

### Step 1.1: Create Doppler Project (5 min)

1. Go to https://dashboard.doppler.com
2. Sign up or log in
3. Click "Create Project"
4. Name: `pexabo-email-automation`
5. Create three environments: `dev`, `stg`, `prd`
6. You will add secrets to the `prd` environment

### Step 1.2: Set Up Google Cloud Console (15 min)

1. Go to https://console.cloud.google.com
2. Select or create a project (name it `pexabo-email-automation`)
3. Enable APIs:
   - Go to **APIs & Services** → **Library**
   - Search and enable: **Gmail API**
   - Search and enable: **Google Sheets API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Name: `Pexabo Email Automation`
7. Authorized redirect URIs: Add `http://localhost:3000/oauth2callback`
8. Click **Create**
9. Download the JSON file (contains `client_id` and `client_secret`)
10. Copy `client_id` → Doppler secret `GMAIL_CLIENT_ID`
11. Copy `client_secret` → Doppler secret `GMAIL_CLIENT_SECRET`

### Step 1.3: Get Gmail Refresh Token (10 min)

**Option A: Using the script in this repo**
```bash
cd 5_Symbols/n8n/Auto-Reply info@pexabo.com
npm install googleapis axios dotenv openai
node scripts/gmail-query-builder.js --interactive
```
Follow the prompts. It will give you a URL to open in your browser.

**Option B: Manual via Google OAuth Playground**
1. Go to https://developers.google.com/oauthplayground
2. Click the gear icon (settings) in the top right
3. Check **"Use your own OAuth credentials"**
4. Paste your `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET`
5. On the left, find **Gmail API v1**
6. Select scope: `https://www.googleapis.com/auth/gmail.modify`
7. Click **Authorize APIs**
8. Sign in with **info@pexabo.com**
9. Click **Exchange authorization code for tokens**
10. Copy the **Refresh Token**
11. Paste into Doppler as `GMAIL_REFRESH_TOKEN`

### Step 1.4: Get OpenAI API Key (5 min)

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click **Create new secret key**
4. Name: `pexabo-email-automation`
5. Copy the key (starts with `sk-proj-` or `sk-`)
6. Paste into Doppler as `OPENAI_API_KEY`

### Step 1.5: Get Gemini API Key (5 min)

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key (starts with `AIzaSy`)
5. Paste into Doppler as `GEMINI_API_KEY`

### Step 1.6: Get Optional API Keys (10 min)

**Groq (optional, free tier)**:
1. Go to https://console.groq.com/keys
2. Sign up
3. Create API key
4. Paste into Doppler as `GROQ_API_KEY`

**Anthropic Claude (optional)**:
1. Go to https://console.anthropic.com/settings/keys
2. Sign up
3. Create API key
4. Paste into Doppler as `ANTHROPIC_API_KEY`

### Step 1.7: Get n8n API Key (2 min)

1. Go to https://n8n.rifaterdemsahin.com
2. Click your profile (bottom left) → **Settings**
3. Go to **API** tab
4. Click **Generate API Key**
5. Copy the key (starts with `n8n_api_`)
6. Paste into Doppler as `N8N_API_KEY`
7. Also add `N8N_HOST` = `https://n8n.rifaterdemsahin.com`

### Step 1.8: Set Up Telegram Bot (optional, 10 min)

1. Open Telegram, search for **@BotFather**
2. Send `/newbot`
3. Follow prompts to name your bot (e.g., `pexabo_alerts_bot`)
4. Copy the bot token (looks like `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)
5. Paste into Doppler as `TELEGRAM_BOT_TOKEN`
6. Start a chat with your new bot, send any message
7. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
8. Look for `"chat":{"id":-1001234567890` — copy the ID
9. Paste into Doppler as `TELEGRAM_CHAT_ID`

### Step 1.9: Create Google Sheets Tracker (10 min)

1. Go to https://sheets.new
2. Name it: `Pexabo Email Tracker`
3. In cell A1, paste this header row:
   ```
   email_id | thread_id | from | subject | received_at | classified_as | tactic_used | reply_sent_at | status | ai_confidence | model_used | recruiter_response_used | cv_sent
   ```
4. Create a second sheet named **"Errors"**
5. In cell A1, paste:
   ```
   timestamp | email_id | error_type | error_message | model_used
   ```
6. Go back to Google Cloud Console → **IAM & Admin** → **Service Accounts**
7. Create a service account: `pexabo-sheets@pexabo-email-automation.iam.gserviceaccount.com`
8. Create a key (JSON format) and download it
9. Open the JSON file, copy the **client_email**
10. Go back to your Google Sheet → **Share** → paste the client email → give **Editor** access
11. Copy the **Spreadsheet ID** from the URL:
    ```
    https://docs.google.com/spreadsheets/d/1BxiMVs0XXXXXXXXXXXXXXXXX/edit
                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^
                                    Spreadsheet ID
    ```
12. Paste into Doppler as `GOOGLE_SHEETS_DOC_ID`
13. Base64-encode the JSON key file:
    ```bash
    # On macOS/Linux
    base64 -i path/to/service-account.json | pbcopy

    # On Windows (PowerShell)
    [Convert]::ToBase64String([System.IO.File]::ReadAllBytes("path\to\service-account.json")) | Set-Clipboard
    ```
14. Paste the base64 string into Doppler as `GOOGLE_SHEETS_CREDENTIALS`

### Step 1.10: Add Remaining Secrets to Doppler

Add these static values to Doppler:

| Secret Name | Value |
|-------------|-------|
| `RECRUITER_GENERATOR_URL` | `https://rifat-cvs-response-generator.fly.dev/recruiter` |
| `FLY_IO_APP_URL` | `https://pexabo-email-brain.fly.dev` |
| `FLY_IO_API_TOKEN` | *(get from fly.io dashboard after deployment)* |

### Step 1.11: Verify Prerequisites

Run this command to verify Doppler has everything:

```bash
doppler login
doppler setup --project pexabo-email-automation --config prd_main
doppler secrets
```

You should see all secrets listed. If any are missing, add them now.

---

## Phase 2: Deploy Node.js Scripts (Me/AI — ~30 minutes)

### Step 2.1: Install Dependencies

```bash
cd 5_Symbols/n8n/Auto-Reply info@pexabo.com
npm init -y
npm install googleapis axios dotenv openai
```

### Step 2.2: Test Gmail Connection

```bash
doppler run -- node scripts/gmail-query-builder.js --show-labels
```

If this shows your Gmail labels, the connection works.

### Step 2.3: Test n8n Connection

```bash
doppler run -- node scripts/n8n-workflow-updater.js --list
```

If this lists your workflows, the n8n API works.

---

## Phase 3: Deploy Fly.io Service (Me/AI — ~20 minutes)

### Step 3.1: Create Fly.io App

```bash
fly auth login
fly apps create pexabo-email-brain
```

### Step 3.2: Set Secrets

```bash
fly secrets set OPENAI_API_KEY="" GEMINI_API_KEY="" GROQ_API_KEY="" ANTHROPIC_API_KEY=""
```

### Step 3.3: Deploy

The `fly-io-services.md` file contains the full `Dockerfile`, `fly.toml`, and `server.js`. Deploy with:

```bash
cd fly-io-app  # create this folder if needed
fly deploy
```

### Step 3.4: Verify

```bash
curl https://pexabo-email-brain.fly.dev/health
```

Should return: `{"status":"ok","version":"1.0.0"}`

---

## Phase 4: Deploy n8n Workflow (Me/AI — MCP Code Generation)

### Step 4.1: Generate Workflow JSON

I will read `workflow-design.md` and generate the complete n8n workflow JSON.

### Step 4.2: Push to n8n

```bash
doppler run -- node scripts/n8n-workflow-updater.js --create
```

This creates the workflow. Note the returned workflow ID.

### Step 4.3: Activate Workflow

```bash
doppler run -- node scripts/n8n-workflow-updater.js --activate <WORKFLOW_ID>
```

### Step 4.4: Test Batch Mode (Dry Run)

Trigger the workflow manually in n8n UI or wait for the next 6-hour cycle.
Check the execution log for errors.

---

## Phase 5: Test Individual Mode (You + Me — ~20 minutes)

### Step 5.1: Test with a Real Email URL

Find an unreplied email in your Gmail and copy its URL.

```bash
doppler run -- node scripts/process-specific-email.js "PASTE_URL_HERE" --dry-run
```

### Step 5.2: Review the Output

Check:
- Was the email fetched correctly?
- Was the intent classified correctly?
- Is the reply draft appropriate?
- Was a Fix Prompt generated?

### Step 5.3: Execute the Reply

If the draft looks good:

```bash
doppler run -- node scripts/process-specific-email.js "PASTE_URL_HERE" --execute
```

### Step 5.4: Verify in Gmail

1. Check your **Sent** folder — the reply should be there
2. Check the email — it should have the `replied_by_bot` label
3. Check the email — it should be archived (out of inbox)

### Step 5.5: Check the Tracker

Open Google Sheets `Pexabo Email Tracker` — a new row should appear.

---

## Phase 6: Go Live (You — ~10 minutes)

### Step 6.1: Enable the Schedule Trigger

1. Go to https://n8n.rifaterdemsahin.com
2. Find the workflow: **Auto-Reply info@pexabo.com**
3. Toggle it **ON**

### Step 6.2: Monitor the First Cycle

Wait for the next 6-hour interval (00:00, 06:00, 12:00, 18:00 UTC).

Check:
- Telegram notifications (if configured)
- Google Sheets tracker
- n8n execution logs

### Step 6.3: Check for Missed Emails

After the first cycle, manually check your inbox for any unreplied emails.
If you find one, use Individual Mode to process it and generate a Fix Prompt.

---

## Phase 7: Ongoing Operation (Ongoing)

### Daily (You — 5 min)

1. Check Gmail label `needs_human_review`
2. Check Telegram for alerts
3. Review tracker sheet for last 6 hours

### Weekly (You + Me — 30 min)

1. Review all emails from past week
2. Check low-confidence replies
3. Review `investigations/` folder
4. Update tactics if needed

### Monthly (You + Me — 1 hour)

1. Rotate API keys
2. Archive old tracker rows
3. Review false positives
4. Test end-to-end

---

## Troubleshooting Common Issues

| Issue | Solution |
|-------|----------|
| `GMAIL_REFRESH_TOKEN` invalid | Re-run OAuth Playground flow |
| n8n workflow won't activate | Check credential IDs in workflow JSON |
| OpenAI rate limit | Add rate limiting or switch to Groq |
| Emails not found | Run `gmail-query-builder.js` to test query |
| Double replies | Check thread reply detection node |
| Telegram not working | Verify `TELEGRAM_CHAT_ID` is correct |
| Sheets not logging | Verify service account has editor access |

---

## Rollback Plan

If something goes wrong:

1. **Disable workflow** in n8n UI immediately
2. **Revoke Gmail token** at https://myaccount.google.com/permissions
3. **Restore previous workflow** from `backups/` folder:
   ```bash
   node scripts/n8n-workflow-updater.js --update <backup-file.json>
   ```

---

## Completion Checklist

- [ ] All secrets in Doppler `prd`
- [ ] Gmail API working (tested with query builder)
- [ ] n8n API working (tested with workflow updater)
- [ ] Fly.io service deployed and healthy
- [ ] n8n workflow created and activated
- [ ] Test email processed successfully (individual mode)
- [ ] Tracker sheet logging correctly
- [ ] Telegram notifications working (if configured)
- [ ] Batch mode enabled and running

---

*Last updated: 2026-05-09*
*Status: Ready for implementation*
