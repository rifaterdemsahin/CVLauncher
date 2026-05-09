# Auto-Reply System for info@pexabo.com

## Quick Start

### Before You Start (Prerequisites)

**⚠️ You MUST complete prerequisites before any deployment.**

1. **Read `prerequisites.md`** — Full list of secrets, API keys, and credentials you need
2. **Read `tasks.md`** — Task-by-task execution plan with owners and status
3. **Complete Phase 1** in `tasks.md` (Doppler + Google Cloud + API keys)
4. **Tell me when done** — I will begin MCP-based code generation

---

## How We Build This (MCP Approach)

We use **MCP (Model Context Protocol)** for n8n code generation. This means:

- I read the workflow design documents (`workflow-design.md`)
- I generate valid n8n workflow JSON programmatically
- I push it via the n8n API (`scripts/n8n-workflow-updater.js`)
- I validate by checking execution logs
- I iterate based on errors

**You do NOT need to manually click nodes in n8n.** Everything is code-first.

---

## Batch Mode (Auto — Every 6 Hours)

1. **Define Tactics**: Open `tactics-template.md` and fill in your reply strategies
2. **Set Secrets**: Add to Doppler (`doppler-import.md` + `doppler-windows-guide.md`)
3. **Deploy Workflow**: I generate and push n8n workflow JSON via MCP
   ```powershell
   cd "C:\projects\CVLauncher\5_Symbols\n8n\Auto-Reply info@pexabo.com"
   doppler run -- node scripts/n8n-mcp-deployer.js --create
   ```
4. **Test**: Run a manual trigger with a test email
5. **Monitor**: Check Telegram alerts and Google Sheets tracker

## Individual Mode (Manual — When You Find a Missed Email)

1. **Paste the Gmail URL**: Run the individual processor
   ```powershell
   cd "C:\projects\CVLauncher\5_Symbols\n8n\Auto-Reply info@pexabo.com"
   doppler run -- node scripts/process-specific-email.js "https://mail.google.com/mail/u/0/#.../MESSAGE_ID" --dry-run
   ```
2. **Review the AI draft reply** and Fix Prompt in the console
3. **Approve and send**:
   ```powershell
   doppler run -- node scripts/process-specific-email.js "URL" --execute
   ```
4. **Check `investigations/`** for the generated Fix Prompt markdown
5. **Apply the fix** to the batch workflow so it doesn't happen again

---

## Directory Layout

```
Auto-Reply info@pexabo.com/
├── PLAN.md                         # Master architecture plan
├── README.md                       # This file
├── prerequisites.md                # ⭐ Everything you need to provide
├── tasks.md                        # ⭐ Task tracker with status
├── workflow-design.md              # Detailed n8n node specifications
├── doppler-config.md               # How to manage secrets with Doppler
├── fly-io-services.md              # Fly.io microservice documentation
├── tactics-template.md             # Your reply tactics (edit this!)
├── missed-email-fix-template.md    # Template for missed email analysis
├── execution-checklist.md          # Operational runbook
├── scripts/
│   ├── gmail-query-builder.js      # Test Gmail search queries
│   ├── n8n-workflow-updater.js     # Push workflow JSON to n8n (MCP)
│   ├── mark-replied.js             # Bulk label/mark emails as replied
│   └── process-specific-email.js   # Process ONE missed email + Fix Prompt
├── investigations/                 # Auto-generated missed email analyses
│   └── missed_email_2026-05-09_*.md
└── backups/                        # n8n workflow JSON snapshots
```

## Links

- **n8n Instance**: https://n8n.rifaterdemsahin.com
- **Doppler Dashboard**: https://dashboard.doppler.com
- **Fly.io Dashboard**: https://fly.io/dashboard
- **CV Response Generator**: https://rifat-cvs-response-generator.fly.dev/recruiter
- **Gmail Account**: info@pexabo.com

## MCP Workflow (How I Generate n8n Code)

```
You complete prerequisites
        ↓
I read workflow-design.md (context)
        ↓
I generate n8n workflow JSON (code)
        ↓
I push via n8n API (deploy)
        ↓
I test execution (validate)
        ↓
I fix errors (iterate)
        ↓
I commit backup to git (version)
```

### Example MCP Command Sequence

```bash
# 1. You run (after prerequisites done):
# "Generate and deploy the n8n workflow"

# 2. I execute:
node scripts/n8n-workflow-updater.js --create

# 3. I verify:
node scripts/n8n-workflow-updater.js --list

# 4. I activate:
node scripts/n8n-workflow-updater.js --activate <workflow-id>

# 5. I test:
doppler run -- node scripts/process-specific-email.js "TEST_URL" --dry-run

# 6. I report back:
# "Workflow deployed. ID: CVDxxxxx. Test: SUCCESS. Ready for live."
```

---

## Daily Operation

### Automated (Every 6 Hours)
- n8n scans for unreplied emails
- AI classifies and drafts replies
- Sends replies, marks emails, logs to sheets

### Your Manual Tasks
1. Check `needs_human_review` label in Gmail
2. Review any Telegram alerts
3. Provide feedback on replies → I update tactics via MCP
4. Share missed email URLs → I process and generate Fix Prompts

---

## Support

If emails are still getting lost:
1. Check `execution-checklist.md` troubleshooting section
2. Run `doppler run -- node scripts/gmail-query-builder.js` to debug queries
3. Check n8n execution logs at https://n8n.rifaterdemsahin.com
4. Review `tasks.md` for current status

---

*Last updated: 2026-05-09*
*MCP Ready: Awaiting prerequisites completion*
