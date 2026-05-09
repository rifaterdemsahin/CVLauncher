# Tasks & Execution Plan

This document breaks down every task required to build, deploy, and operate the `info@pexabo.com` auto-reply system. Each task has an owner (**You** or **Me/AI**) and a status.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| 👤 | You (human) |
| 🤖 | Me (AI / OpenCode) |
| 🔴 | Blocked — waiting on prerequisite |
| 🟡 | In Progress |
| 🟢 | Complete |
| ⬜ | Not Started |

---

## Phase 1: Prerequisites (BLOCKING)

### 1.1 Doppler & Secrets

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 1.1.1 | Create Doppler project `pexabo-email-automation` | 👤 | ⬜ | Go to dashboard.doppler.com |
| 1.1.2 | Add `GMAIL_CLIENT_ID` to Doppler | 👤 | ⬜ | From Google Cloud Console |
| 1.1.3 | Add `GMAIL_CLIENT_SECRET` to Doppler | 👤 | ⬜ | From Google Cloud Console |
| 1.1.4 | Add `GMAIL_REFRESH_TOKEN` to Doppler | 👤 | ⬜ | Via OAuth Playground |
| 1.1.5 | Add `OPENAI_API_KEY` to Doppler | 👤 | ⬜ | From platform.openai.com |
| 1.1.6 | Add `GEMINI_API_KEY` to Doppler | 👤 | ⬜ | From aistudio.google.com |
| 1.1.7 | Add `GROQ_API_KEY` to Doppler (optional) | 👤 | ⬜ | From console.groq.com |
| 1.1.8 | Add `ANTHROPIC_API_KEY` to Doppler (optional) | 👤 | ⬜ | From console.anthropic.com |
| 1.1.9 | Add `N8N_API_KEY` to Doppler | 👤 | ⬜ | From n8n.rifaterdemsahin.com |
| 1.1.10 | Add `N8N_HOST` to Doppler | 👤 | ⬜ | `https://n8n.rifaterdemsahin.com` |
| 1.1.11 | Add `RECRUITER_GENERATOR_URL` to Doppler | 👤 | ⬜ | `https://rifat-cvs-response-generator.fly.dev/recruiter` |
| 1.1.12 | Add `TELEGRAM_BOT_TOKEN` to Doppler (optional) | 👤 | ⬜ | From @BotFather |
| 1.1.13 | Add `TELEGRAM_CHAT_ID` to Doppler (optional) | 👤 | ⬜ | From getUpdates API |
| 1.1.14 | Add `GOOGLE_SHEETS_DOC_ID` to Doppler | 👤 | ⬜ | From tracker sheet URL |
| 1.1.15 | Add `GOOGLE_SHEETS_CREDENTIALS` to Doppler | 👤 | ⬜ | Base64-encoded service account JSON |

### 1.2 Google Cloud Console

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 1.2.1 | Create/select GCP project | 👤 | ⬜ | Name: `pexabo-email-automation` |
| 1.2.2 | Enable Gmail API | 👤 | ⬜ | console.cloud.google.com/apis/library/gmail.googleapis.com |
| 1.2.3 | Enable Google Sheets API | 👤 | ⬜ | console.cloud.google.com/apis/library/sheets.googleapis.com |
| 1.2.4 | Create OAuth 2.0 Client ID (Web app) | 👤 | ⬜ | Download client secrets JSON |
| 1.2.5 | Create service account for Sheets | 👤 | ⬜ | Download JSON key, base64 encode |

### 1.3 Infrastructure

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 1.3.1 | Create Google Sheet "Pexabo Email Tracker" | 👤 | ⬜ | See `prerequisites.md` for columns |
| 1.3.2 | Share sheet with service account email | 👤 | ⬜ | Grant Editor access |
| 1.3.3 | Create Gmail label `replied_by_bot` | 👤 | ⬜ | Or script auto-creates it |
| 1.3.4 | Create Gmail label `needs_human_review` | 👤 | ⬜ | Or script auto-creates it |
| 1.3.5 | Verify n8n instance is accessible | 👤 | ⬜ | https://n8n.rifaterdemsahin.com |

---

## Phase 2: MCP-Based Code Generation (BLOCKED until Phase 1)

### 2.1 n8n Workflow JSON (MCP)

Using the Model Context Protocol (MCP), I will generate the complete n8n workflow JSON programmatically.

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 2.1.1 | Generate Node 1a: Schedule Trigger | 🤖 | ⬜ | Cron every 6 hours |
| 2.1.2 | Generate Node 1b: Webhook Trigger | 🤖 | ⬜ | POST /process-single-email |
| 2.1.3 | Generate Node 2: Fetch Emails (Gmail) | 🤖 | ⬜ | Query builder from `workflow-design.md` |
| 2.1.4 | Generate Node 3: Check Thread Replies | 🤖 | ⬜ | Reply detection logic |
| 2.1.5 | Generate Node 4: Check Tracker (Sheets) | 🤖 | ⬜ | Deduplication |
| 2.1.6 | Generate Node 5: Classify Intent (OpenAI) | 🤖 | ⬜ | JSON mode classification |
| 2.1.7 | Generate Node 6: Route Decision (IF) | 🤖 | ⬜ | Confidence + human check |
| 2.1.8 | Generate Node 6b: Recruiter Router (IF) | 🤖 | ⬜ | Intent-based routing |
| 2.1.9 | Generate Node 8a.1: Select CV (Code) | 🤖 | ⬜ | Keyword matching |
| 2.1.10 | Generate Node 8a.2: Call Recruiter Generator (HTTP) | 🤖 | ⬜ | POST to fly.dev |
| 2.1.11 | Generate Node 8a.3: Multi-Model Fallback (Error path) | 🤖 | ⬜ | Retry chain |
| 2.1.12 | Generate Node 8a.4: Format Recruiter Email (Code) | 🤖 | ⬜ | HTML template injection |
| 2.1.13 | Generate Node 8b: General Draft Reply (OpenAI) | 🤖 | ⬜ | Tactics-based |
| 2.1.14 | Generate Node 8b.1: Multi-Model Fallback (General) | 🤖 | ⬜ | Gemini → Groq fallback |
| 2.1.15 | Generate Node 9: Send Reply (Gmail) | 🤖 | ⬜ | Thread-aware |
| 2.1.16 | Generate Node 10: Mark Replied (Gmail) | 🤖 | ⬜ | Label + archive |
| 2.1.17 | Generate Node 11: Log to Tracker (Sheets) | 🤖 | ⬜ | Append row |
| 2.1.18 | Generate Node 12: Notify Telegram | 🤖 | ⬜ | Success/error alerts |
| 2.1.19 | Generate Merge Nodes | 🤖 | ⬜ | Batch + Individual path merge |
| 2.1.20 | Generate Error Handling Nodes | 🤖 | ⬜ | Global error trigger |
| 2.1.21 | Assemble complete workflow JSON | 🤖 | ⬜ | Combine all nodes + connections |
| 2.1.22 | Validate workflow JSON | 🤖 | ⬜ | Schema check |
| 2.1.23 | Save to `backups/workflow-generated-YYYY-MM-DD.json` | 🤖 | ⬜ | Versioned backup |

### 2.2 Fly.io Service (MCP)

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 2.2.1 | Generate `server.js` for pexabo-email-brain | 🤖 | ⬜ | Fastify + OpenAI + Gmail tools |
| 2.2.2 | Generate `Dockerfile` | 🤖 | ⬜ | Node 20 + Doppler CLI |
| 2.2.3 | Generate `fly.toml` | 🤖 | ⬜ | London region, auto-scale |
| 2.2.4 | Generate `package.json` | 🤖 | ⬜ | Dependencies |
| 2.2.5 | Deploy to Fly.io | 🤖 | ⬜ | `fly deploy` |
| 2.2.6 | Verify `/health` endpoint | 🤖 | ⬜ | `curl https://pexabo-email-brain.fly.dev/health` |

---

## Phase 3: Deployment (BLOCKED until Phase 2)

### 3.1 n8n Deployment

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 3.1.1 | Push workflow JSON via API | 🤖 | ⬜ | `node scripts/n8n-workflow-updater.js --create` |
| 3.1.2 | Activate workflow in n8n | 🤖 | ⬜ | `node scripts/n8n-workflow-updater.js --activate <id>` |
| 3.1.3 | Test manual trigger (batch) | 🤖 | ⬜ | Trigger once, check execution log |
| 3.1.4 | Test webhook trigger (individual) | 🤖 | ⬜ | POST test payload |
| 3.1.5 | Verify Gmail credential works | 🤖 | ⬜ | Check email fetch |
| 3.1.6 | Verify Sheets credential works | 🤖 | ⬜ | Check append row |
| 3.1.7 | Verify Telegram credential works | 🤖 | ⬜ | Send test message |

### 3.2 Integration Tests

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 3.2.1 | Test with 1 real email (dry-run) | 🤖 | ⬜ | `--dry-run` mode |
| 3.2.2 | Test reply detection | 🤖 | ⬜ | Thread with existing reply |
| 3.2.3 | Test CV selection logic | 🤖 | ⬜ | Azure keyword → Azure CV |
| 3.2.4 | Test recruiter generator integration | 🤖 | ⬜ | POST to fly.dev |
| 3.2.5 | Test multi-model fallback | 🤖 | ⬜ | Force primary to fail |
| 3.2.6 | Test mark-as-replied + archive | 🤖 | ⬜ | Check Gmail labels |
| 3.2.7 | Test tracker logging | 🤖 | ⬜ | Check Google Sheets |
| 3.2.8 | Test Telegram notification | 🤖 | ⬜ | Check message received |

---

## Phase 4: Go Live (BLOCKED until Phase 3)

### 4.1 Batch Mode Activation

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 4.1.1 | Enable Schedule Trigger | 👤 | ⬜ | Toggle ON in n8n UI |
| 4.1.2 | Monitor first 6-hour cycle | 👤+🤖 | ⬜ | Review tracker + Telegram |
| 4.1.3 | Check for missed emails | 👤 | ⬜ | Manual inbox audit |
| 4.1.4 | Adjust query if emails missed | 🤖 | ⬜ | Update Node 2 query |
| 4.1.5 | Fine-tune tactics | 👤+🤖 | ⬜ | Based on first replies |

### 4.2 Individual Mode Activation

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 4.2.1 | Test with real missed email URL | 👤+🤖 | ⬜ | `--dry-run` first |
| 4.2.2 | Approve and execute first reply | 👤 | ⬜ | `--execute` after review |
| 4.2.3 | Review generated Fix Prompt | 👤 | ⬜ | `investigations/` folder |
| 4.2.4 | Apply Fix Prompt to batch workflow | 🤖 | ⬜ | Update query/tactics |

---

## Phase 5: Ongoing Operations

### 5.1 Daily (You)

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 5.1.1 | Check `needs_human_review` label | 👤 | ⬜ | Gmail |
| 5.1.2 | Check Telegram alerts | 👤 | ⬜ | Any errors? |
| 5.1.3 | Review tracker sheet | 👤 | ⬜ | Last 6 hours |
| 5.1.4 | Share missed email URLs | 👤 | ⬜ | If any found |

### 5.2 Weekly (You + Me)

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 5.2.1 | Review all emails from past week | 👤 | ⬜ | Tracker audit |
| 5.2.2 | Check confidence < 0.8 emails | 👤+🤖 | ⬜ | Improve tactics |
| 5.2.3 | Review `investigations/` folder | 👤+🤖 | ⬜ | Apply fixes |
| 5.2.4 | Update tactics template | 🤖 | ⬜ | Based on feedback |
| 5.2.5 | Check Fly.io logs | 🤖 | ⬜ | Errors/timeouts |

### 5.3 Monthly (You + Me)

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 5.3.1 | Audit `replied_by_bot` label | 👤 | ⬜ | False positives? |
| 5.3.2 | Rotate Doppler secrets | 👤 | ⬜ | API key rotation |
| 5.3.3 | Archive old tracker rows | 🤖 | ⬜ | >90 days |
| 5.3.4 | Update AI model versions | 🤖 | ⬜ | If newer available |
| 5.3.5 | Test end-to-end manually | 🤖 | ⬜ | Full workflow |

---

## Quick Status Dashboard

```
Phase 1 (Prerequisites):  [████████░░]  0%  BLOCKED ON YOU
Phase 2 (MCP Code Gen):   [░░░░░░░░░░]  0%  BLOCKED ON PHASE 1
Phase 3 (Deployment):     [░░░░░░░░░░]  0%  BLOCKED ON PHASE 2
Phase 4 (Go Live):        [░░░░░░░░░░]  0%  BLOCKED ON PHASE 3
Phase 5 (Operations):     [░░░░░░░░░░]  0%  BLOCKED ON PHASE 4
```

---

## Next Action

**👤 Your turn**: Complete Phase 1.1 through 1.3 above. 

Once you confirm:
1. Doppler project is created
2. All secrets are stored
3. Google Sheets tracker is ready
4. n8n API key is generated

**🤖 My turn**: I will begin Phase 2 (MCP-based code generation) and deploy everything.

---

*Last updated: 2026-05-09*
*Format: Tasks are tracked here and updated as we progress*
