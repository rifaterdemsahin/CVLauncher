# Execution Checklist & Feedback Loop

> **Before using this checklist**, ensure:
> - `prerequisites.md` is complete
> - `tasks.md` Phase 1 is done
> - System is deployed and active

---

## Daily Checklist (For You)

Every morning (or after each 6-hour cycle):

- [ ] Check Gmail label `needs_human_review` — Are there emails the bot couldn't handle?
- [ ] Check Telegram for any alert notifications
- [ ] Open Google Sheets `Pexabo Email Tracker` — Review last 6 hours
- [ ] If you disagree with any reply → Note it for feedback

---

## Weekly Checklist (For You)

Every Monday:

- [ ] Review all emails from past week in tracker
- [ ] Check `confidence < 0.8` emails — Should we improve the tactic?
- [ ] Update `tactics-template.md` with any new patterns
- [ ] Review Fly.io logs for any errors or timeouts
- [ ] Confirm no emails are stuck in inbox unreplied for >12h

---

## Monthly Checklist (For Us Both)

- [ ] Audit `replied_by_bot` label — Any false positives?
- [ ] Rotate Doppler secrets (Gmail token, API keys)
- [ ] Review and archive old tracker rows (>90 days)
- [ ] Update AI model version if newer available
- [ ] Test manual trigger end-to-end

---

## Feedback Loop Process

### When You Find a Missed Email (Individual Processing)

**Step 1**: Share the Gmail URL of the missed email

**Step 2**: Run individual processing:
```bash
node scripts/process-specific-email.js "GMAIL_URL" --dry-run
```

**Step 3**: Review the AI-generated reply draft + Fix Prompt

**Step 4**: Approve and execute:
```bash
node scripts/process-specific-email.js "GMAIL_URL" --execute
```

**Step 5**: Fix Prompt is auto-saved to `investigations/missed_email_YYYY-MM-DD_ID.md`

**Step 6**: Review the Fix Prompt and decide if the batch workflow needs updating

---

### When You Want to Correct a Reply

**Step 1**: Share the email link + what the reply SHOULD have been

**Step 2**: I will:
1. Look up the email in the tracker
2. Identify which tactic was used
3. Analyze why it was wrong
4. Propose a tactic update or new tactic

**Step 3**: You approve or adjust

**Step 4**: I update `tactics-template.md` and redeploy

**Step 5**: Similar future emails will use the improved tactic

### Example Feedback

```
Email: https://mail.google.com/mail/u/0/#inbox/abc123
What happened: Bot replied with pricing but it was a partnership inquiry
What should have happened: Asked about their client base and offered a call
Suggested tactic update: Add "partnership" keywords to trigger list for Tactic 3
```

### Example Missed Email Report

```
Email: https://mail.google.com/mail/u/0/#advanced-search/.../FMfcgzQgLXvPSMbgJPdClnjRSNhdmBjr
Status: Not answered, found manually
Fix Prompt: investigations/missed_email_2026-05-09_FMfcgz... .md
Root cause: Email had label `1_borrow_followup` and was archived out of inbox
Workflow fix: Add secondary query for `label:1_borrow_followup`
```

---

## Troubleshooting

### Emails Still Getting Lost

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Email in inbox, no reply after 6h | Trigger query too narrow | Update query in `workflow-design.md` Node 2 |
| Email replied twice | Thread reply detection missed OR dedup failed | Check Node 3 `Check Thread Replies` logic + tracker |
| Recruiter email not using CV | Intent misclassified | Update `recruiter_job_offer` keywords in tactics |
| Recruiter response generic | CV Response Generator down | Check fallback chain in Node 8a.3 |
| Model timeout | Primary model overloaded | Fallback should trigger automatically; check Doppler keys |
| Wrong tactic used | Trigger keywords overlap | Adjust tactic priorities |
| Reply sent to wrong person | `from` field parsed incorrectly | Check `Get Email Details` node extraction |
| Fly.io timeout | Complex email took too long | Increase timeout or simplify logic |
| Gmail API error | Token expired | Refresh token in Doppler |

### How to Check If System Is Working

```bash
# 1. Test Gmail query (run from scripts/)
node scripts/gmail-query-builder.js

# 2. Test n8n connection
node ../connect.js

# 3. Check Fly.io health
curl https://pexabo-email-brain.fly.dev/health

# 4. Check CV Response Generator health
curl https://rifat-cvs-response-generator.fly.dev/recruiter

# 5. Test multi-model fallback
node scripts/process-specific-email.js "GMAIL_URL" --dry-run --tactic recruiter_job_offer

# 6. Check tracker sheet
# Open Google Sheets > Pexabo Email Tracker
```

---

## Emergency Stop

If something goes wrong and you need to STOP all auto-replies immediately:

### Option 1: Disable n8n Workflow
1. Go to https://n8n.rifaterdemsahin.com
2. Find "Auto-Reply info@pexabo.com" workflow
3. Toggle OFF

### Option 2: Change Gmail Query to Impossible
Edit workflow → Node 2 (Find Lost Emails) → Change query to `to:info@pexabo.com newer_than:1d is:starred` (assuming you don't star emails)

### Option 3: Revoke Gmail Token
1. Go to https://myaccount.google.com/permissions
2. Remove n8n access
3. All Gmail nodes will fail safely

---

## Metrics to Track

| Metric | Target | Where to Check |
|--------|--------|----------------|
| Emails processed / 6h | >0 if emails exist | Google Sheets |
| Average confidence | >0.85 | Google Sheets |
| Human review rate | <10% | Gmail label count |
| Reply errors | 0 | Telegram alerts |
| Fly.io uptime | >99% | Fly.io dashboard |
| Token expiry | Never | Doppler audit |

---

## Communication Channels

| What | Where |
|------|-------|
| Bot replies | info@pexabo.com Gmail Sent |
| Human review queue | Gmail label `needs_human_review` |
| Success notifications | Telegram |
| Error alerts | Telegram |
| Tracker log | Google Sheets |
| Tactics config | `tactics-template.md` (this repo) |
| Workflow code | `5_Symbols/n8n/Auto-Reply info@pexabo.com/` |

---

*Last updated: 2026-05-09*
