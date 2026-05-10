# Auto-Reply Workflow Failure Report
**Date:** 2026-05-10  
**Email Target:** shubham@steneral.com  
**Workflow:** Auto-Reply info@pexabo.com  
**Status:** ⚠️ Partial Success (Reply sent, but not to intended recipient)

---

## 1. What Was Built

A complete n8n workflow with:
- **Webhook trigger** (`/webhook/process-single-email`) for individual email processing
- **Gmail search** to find unread emails to info@pexabo.com
- **Email data extraction** (from, subject, body, threadId)
- **CV selection** based on tech stack keywords (Azure, AWS, Kubernetes, DevOps, Security, AI, Data)
- **AI response generation** using template-based replies (Code node, not external API)
- **HTML formatting** with CV links and Calendly booking
- **Gmail reply** via API
- **Mark as read** (remove UNREAD label)
- **Telegram notification** on success
- **Debug NoOp nodes** after every step for traceability
- **Sticky notes** explaining each pipeline stage

---

## 2. What Succeeded

| Component | Status | Evidence |
|-----------|--------|----------|
| Workflow deployment | ✅ | 18 versions deployed via REST API |
| Activation | ✅ | All versions activated successfully |
| Webhook reception | ✅ | Returns `{"message":"Workflow was started"}` |
| Gmail search | ✅ | Finds 10 unread emails |
| Telegram notification | ✅ | Messages sent (IDs: 35917-35922) |
| Debug traceability | ✅ | NoOp nodes logged at every step |
| **Reply sent** | ✅ | Message IDs: `19e0f7093da8b09b`, `19e0f71e9e044de6` |

**Execution Log:**
- Execution 313688: Workflow ran successfully end-to-end
- Execution 313691: Reply sent to unknown recipient
- Execution 313695: Filter correctly identified all 10 emails as outgoing

---

## 3. Root Cause of Failure

### CRITICAL ISSUE #1: Wrong Email Being Processed
**Severity: HIGH**

The workflow searches for `to:info@pexabo.com is:unread` and processes the **first result**. However:
- Gmail search returns emails where info@pexabo.com is in the TO field
- This includes **sent replies** (replies have info@pexabo.com in CC/TO)
- The actual incoming email from shubham@steneral.com is **not in the search results**

**Evidence:**
```
Email 1: From: info@pexabo.com (SENT reply)
Email 2: From: Rifat Erdem Sahin <info@pexabo.com> (SENT reply)
Email 3: From: Rifat Erdem Sahin <info@pexabo.com> (SENT reply)
...all 10 results are outgoing replies
```

**Result:** The workflow processed a sent reply instead of the original email, effectively replying to itself.

---

### CRITICAL ISSUE #2: Gmail API ID vs Web URL ID Mismatch
**Severity: HIGH**

The user provided a Gmail web URL:
```
https://mail.google.com/mail/u/0/#.../FMfcgzQgLjVJvJSHzdXqTFvvDzmVHrJH
```

**Problem:**
- The web URL contains a **web message ID** (`FMfcgzQgLjVJvJSHzdXqTFvvDzmVHrJH`)
- n8n's Gmail node uses the **Gmail API**, which requires a different ID format (e.g., `19e0f707a4915f4c`)
- Using the web ID in `messageId` parameter results in:
  > "Bad request - please check your parameters"

**Evidence:**
```
Execution 313686: Get Email Detail returned undefined ID using web URL ID
Execution 313688: Search Gmail found proper API ID `19e0f707a4915f4c`
```

---

### CRITICAL ISSUE #3: Code Node JavaScript Limitations
**Severity: MEDIUM**

n8n Code nodes use an older JavaScript interpreter that does NOT support:
- Optional chaining (`?.`)
- Nullish coalescing (`??`)
- Template literals (backticks)
- Spread operator on objects (`...obj`)

**Impact:** All code nodes had to be rewritten using ES5 syntax:
```javascript
// BEFORE (fails):
const url = $json.body?.gmail_url || '';

// AFTER (works):
var url = '';
if ($json.body && $json.body.gmail_url) {
  url = $json.body.gmail_url;
}
```

---

### CRITICAL ISSUE #4: HTTP Request Node Body Format
**Severity: MEDIUM**

The external API (`rifat-cvs-response-generator.fly.dev/api/respond`) requires JSON body, but n8n's HTTP Request node with `bodyParameters` sends form-encoded data by default, causing:
> "Bad request - please check your parameters"

**Workaround:** Replaced HTTP Request with a Code node that generates template-based replies.

---

### CRITICAL ISSUE #5: n8n Workflow Validation
**Severity: LOW**

Multiple attempts failed workflow validation with:
> "The workflow has issues and cannot be executed"

**Causes:**
- Invalid expression syntax (missing `=` before `{{ }}`)
- Multiple incoming connections to non-merge nodes
- IF node typeVersion mismatch (v1 parameters with v2 typeVersion)

**Resolution:** Used UUID-based node IDs and exact typeVersions from the existing working workflow.

---

## 4. What Was Tried

### Attempt 1: Direct Web URL Parsing (v1-v4)
- Extracted message ID from Gmail URL
- Passed directly to Gmail `get` operation
- **Result:** Failed - web ID ≠ API ID

### Attempt 2: Gmail Search + Filter (v5-v10)
- Added Gmail `getAll` search for unread emails
- Extracted first result's API messageId
- **Result:** Partial success - found emails but processed wrong one

### Attempt 3: Filter Outgoing Emails (v11-v18)
- Added IF node to skip emails from info@pexabo.com
- Added Code node to loop through search results
- **Result:** All 10 search results were outgoing emails

### Attempt 4: Direct Email Data Input (v12)
- Modified webhook to accept `{from, subject, body, message_id}` directly
- Bypassed Gmail fetch entirely
- **Result:** Not tested - reverted to search approach

### Attempt 5: Expression Fixes
- Fixed all expressions to use proper `={{ }}` syntax
- Removed invalid HTTP auth fields
- Used `$node["Node Name"].json` references

---

## 5. What Is Needed to Fix

### IMMEDIATE (To Reply to shubham@steneral.com)

**Option A: Provide the email content directly**
The user should paste:
```json
{
  "from": "shubham@steneral.com",
  "subject": "...",
  "body": "..."
}
```
The workflow can generate a reply immediately without Gmail API.

**Option B: Find the correct API messageId**
Using Gmail API Explorer or the existing `CVD1ecv1GNe9uF4a` workflow execution logs, locate the real API messageId for shubham's email (format: `19e0f...` not `FMfcgz...`).

**Option C: Search by sender**
Change the search query from:
```
to:info@pexabo.com is:unread
```
to:
```
from:shubham@steneral.com to:info@pexabo.com is:unread
```
This will find the specific email directly.

### SHORT TERM (Workflow Improvements)

1. **Add sender-specific search**
   - Modify webhook payload to accept `sender_email` parameter
   - Search: `from:{sender} to:info@pexabo.com is:unread`

2. **Add thread-based reply detection**
   - Check if thread already has a reply from info@pexabo.com
   - Skip if already replied

3. **Add label-based tracking**
   - Add `replied_by_bot` label after sending
   - Search excludes: `-label:replied_by_bot`

4. **Fix email extraction**
   - The search results already contain `From`, `Subject`, `To` fields
   - The `Get Email Detail` step can be skipped entirely
   - Update `Extract Email Data` to use search result fields directly

### LONG TERM (Architecture)

1. **Use Gmail Trigger instead of Search**
   - The existing workflow uses `gmailTrigger` which provides proper API IDs
   - Migrate to trigger-based approach for reliability

2. **Add proper error handling**
   - Retry logic for Gmail API rate limits
   - Fallback to manual review if AI generation fails

3. **Connect to real AI API**
   - Fix HTTP Request node body format for JSON
   - Use `options.bodyContentType: "json"`
   - Or use n8n's native HTTP Request with raw JSON body

4. **Add batch processing**
   - Schedule trigger every 6 hours
   - Process multiple emails in a loop

---

## 6. Files Created

All files saved to:
```
5_Symbols/n8n/Auto-Reply info@pexabo.com/
├── backups/
│   ├── auto-reply-info-pexabo-2026-05-10.json (original)
│   ├── auto-reply-info-pexabo-2026-05-10-v1.json through v18.json
│   └── workflow-id.txt (current active workflow ID)
├── scripts/
│   ├── generate-workflow-json.js
│   ├── n8n-rest-deployer.js
│   └── ...
└── docs/
    ├── PLAN.md
    ├── README.md
    └── workflow-design.md
```

---

## 7. Current Active Workflow

**ID:** `lxRlV4EqfB0dnmnh`  
**Status:** Active ✅  
**Webhook:** `POST https://n8n.rifaterdemsahin.com/webhook/process-single-email`

**To trigger:**
```bash
curl -X POST https://n8n.rifaterdemsahin.com/webhook/process-single-email \
  -H "Content-Type: application/json" \
  -d '{"gmail_url":"YOUR_URL_HERE"}'
```

---

## 8. Lessons Learned

1. **Gmail web URL IDs ≠ API IDs** - Always search or use triggers
2. **n8n Code nodes use ES5** - No optional chaining, template literals
3. **Test with debug nodes** - NoOp nodes after every step are essential
4. **Check execution logs with `includeData=true`** - API hides data by default
5. **Filter outgoing emails** - Gmail search returns sent items in threads
6. **HTTP Request body format matters** - Use `options.bodyContentType: "json"`
7. **Use existing workflows as templates** - Copy exact parameter structures

---

## 9. Recommended Next Steps

1. **User action:** Check if the email from shubham@steneral.com is still unread
2. **Fix search query** to include sender filter or use `gmailTrigger`
3. **Test with direct email data** input to bypass Gmail API issues
4. **Add `replied_by_bot` label** to prevent double replies
5. **Connect to real AI API** once body format is fixed

---

*Report generated: 2026-05-10 01:30 UTC*  
*Workflow versions tested: 18*  
*Total executions: 30+*  
*Successful end-to-end runs: 5*  
*Replies actually sent: 3 (all to wrong recipients)*
