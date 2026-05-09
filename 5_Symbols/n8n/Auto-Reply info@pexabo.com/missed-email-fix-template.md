# Missed Email Fix Prompt Template

## Purpose

Every time you manually discover an email that the 6-hour batch flow missed, we run an investigation and produce a **Fix Prompt**. This document answers:

1. **Why was it missed?** — Root cause in the batch query, triggers, or logic
2. **How do we fix it?** — Specific changes to n8n workflow, Gmail query, or tactics
3. **How do we prevent it?** — Changes that stop similar emails being missed

---

## Fix Prompt Format

```markdown
# Fix Prompt: [Brief Title]

**Date**: YYYY-MM-DD
**Email ID**: Gmail message ID
**Severity**: High / Medium / Low
**Type**: Query gap | Tactic gap | Label conflict | Timing issue | Other

---

## 1. What Happened

The email with subject "..." was found manually in [label/folder] and had not been replied to by the automation.

---

## 2. Why It Was Missed

### 2.1 Batch Query Analysis
Current query:
```
to:info@pexabo.com -from:me -in:sent -label:replied_by_bot newer_than:7d
```

**Mismatch found**:
- [ ] Email had label `X` which excluded it from inbox scan
- [ ] Email was marked as read before batch ran
- [ ] Subject/body did not match trigger keywords
- [ ] Email was in spam/promotions
- [ ] `to:` field used alias not matching `info@pexabo.com`
- [ ] Other: ___________

### 2.2 Workflow Logic Analysis
- [ ] Deduplication (tracker sheet) incorrectly flagged as already processed
- [ ] Classification confidence too low, sent to human review but not alerted
- [ ] Fly.io timeout caused silent failure
- [ ] Gmail node error (rate limit, auth expiry)
- [ ] Other: ___________

### 2.3 Tactic Analysis
- [ ] No tactic matched this email type
- [ ] Wrong tactic was selected
- [ ] Tactic instructions were incomplete
- [ ] Other: ___________

---

## 3. The Fix

### 3.1 Query Fix (if applicable)
**Before**:
```
to:info@pexabo.com -from:me -in:sent -label:replied_by_bot newer_than:7d
```

**After**:
```
to:info@pexabo.com OR cc:info@pexabo.com -from:me -in:sent -label:replied_by_bot newer_than:7d -label:1_borrow_followup
```

### 3.2 Workflow Fix (if applicable)
- Node to update: `___________`
- Change: `___________`

### 3.3 Tactic Fix (if applicable)
- Add new tactic or update tactic ID: `___________`
- New keywords/triggers: `___________`
- New instructions: `___________`

---

## 4. Prevention Checklist

Before closing this fix, verify:
- [ ] Updated query tested with `gmail-query-builder.js`
- [ ] Workflow updated and activated
- [ ] Backup saved to `backups/`
- [ ] Tactic template updated
- [ ] Tracker schema updated if needed
- [ ] Telegram alert rule checked
- [ ] Dry-run tested on 5 similar emails

---

## 5. Pattern Check

Are there other emails like this that might also be missed?
- Search Gmail: `____________`
- Result count: `____`
- Bulk action needed? Yes / No
```

---

## Example Fix Prompts

### Example 1: Label Conflict

```markdown
# Fix Prompt: Emails with `1_borrow_followup` label missed

**Date**: 2026-05-09
**Email ID**: FMfcgzQgLXvPSMbgJPdClnjRSNhdmBjr
**Severity**: High
**Type**: Label conflict

---

## 1. What Happened

Email found via URL: https://mail.google.com/mail/u/0/#advanced-search/.../FMfcgzQgLXvPSMbgJPdClnjRSNhdmBjr
It had label `1_borrow_followup` and was unread, but the bot never replied.

---

## 2. Why It Was Missed

### 2.1 Batch Query Analysis
The email was labeled `1_borrow_followup`. Our batch query filters by `is:unread` and inbox-based logic, but this email may have been archived into the label folder and removed from INBOX. The n8n Gmail trigger only watches INBOX by default.

**Root cause**: The email was not in INBOX when the 6h batch ran.

---

## 3. The Fix

### 3.1 Query Fix
Add label-based scanning as a SECONDARY path in the workflow:

**New parallel branch**:
```
Query 1 (Inbox): to:info@pexabo.com -from:me -in:sent -label:replied_by_bot newer_than:7d
Query 2 (Follow-up label): to:info@pexabo.com label:1_borrow_followup -from:me -label:replied_by_bot newer_than:7d
```

Merge results from both queries before deduplication.

### 3.2 Workflow Fix
- Add a second "Find Lost Emails" node with the label query
- Add a Merge node (combine mode) before deduplication
- Rename first node to "Find Inbox Emails"
- Rename second node to "Find Label Emails"

---

## 4. Prevention Checklist

- [x] Updated query tested with `gmail-query-builder.js`
  - Result: Found 3 additional unreplied emails in label
- [ ] Workflow updated and activated
- [ ] Backup saved
- [ ] Tactic template updated
- [ ] Bulk reply sent to the 3 additional emails
```

### Example 2: Read Before Batch

```markdown
# Fix Prompt: Email opened on phone before 6h cycle

**Date**: 2026-05-09
**Email ID**: ABC123...
**Severity**: Medium
**Type**: Timing issue

---

## 1. What Happened

Email was opened on mobile at 09:15, marked as read. Batch ran at 12:00 with `is:unread` filter. Email was skipped.

---

## 2. Why It Was Missed

Batch query includes `is:unread`. Any email read by user (or another device) before the batch cycle is excluded.

---

## 3. The Fix

### 3.1 Query Fix
Remove `is:unread` from batch query. Rely on deduplication via tracker sheet + `replied_by_bot` label.

**Before**:
```
to:info@pexabo.com is:unread -from:me -in:sent -label:replied_by_bot newer_than:7d
```

**After**:
```
to:info@pexabo.com -from:me -in:sent -label:replied_by_bot newer_than:7d
```

### 3.2 Deduplication Hardening
- Ensure tracker sheet check is robust (Node 3 in workflow)
- Add `thread_id` deduplication in addition to `email_id`

---

## 4. Prevention Checklist

- [x] Tested new query: returns emails even if read
- [x] Verified tracker prevents duplicate replies
- [ ] Monitor for 1 week to ensure no double-replies
```

---

## How Fix Prompts Feed Back Into the System

1. **You share a missed email URL**
2. **`process-specific-email.js` runs and generates a fix prompt automatically**
3. **The fix prompt is saved to `investigations/missed_email_YYYY-MM-DD_ID.md`**
4. **You review the fix prompt and approve/reject the recommendations**
5. **If approved, I apply the fix to the n8n workflow / query / tactics**
6. **The fix prompt is logged in `execution-checklist.md` under "Applied Fixes"**
7. **Future batch cycles use the updated logic**

---

## Applied Fixes Log

| Date | Fix Prompt File | What Changed | Verified? |
|------|-----------------|--------------|-----------|
| | | | |

---

*Last updated: 2026-05-09*
*Next: Share a missed email URL and I'll generate the first fix prompt*
