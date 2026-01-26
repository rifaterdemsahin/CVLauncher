# Investigation: "Senior Technical Architect" Email Not Responded

**Date**: 2026-01-26
**Subject**: 'Exciting Role: Senior Technical Architect - Shape the Future of IT'
**Sender**: <a.abdalla@nonstopconsulting.com>

## Executive Summary

The workflow failed to respond to the specific email regarding the "Senior Technical Architect" role. The investigation points to a potential miss at the **search trigger level** due to keyword prioritization or a **folder/labeling issue** where the email was moved out of the primary Inbox before the automation could process it.

## 1. Analysis of the Email vs. Automation Logic

### A. Gmail Trigger Logic (Where it enters)

The workflow watches for emails matching this query:
`is:unread (cv OR resume OR job OR contract OR opportunity OR hiring OR "send cv")`

**Email Content**:

- **Subject**: "Exciting **Role**: Senior Technical Architect - Shape the Future of IT"
- **Body**: "...**opportunity** that might align..."

**Mismatch**:

- The subject contains "**Role**", which is **NOT** in the trigger list.
- The body contains "**opportunity**", which **IS** in the trigger list.
- **Risk**: If Gmail's search index prioritizes the subject or if the body text "opportunity" was not immediately indexed/searchable by the API, the trigger would fail.

### B. Keywords Filter (node: "Check for Recruiter Keywords")

If the email was triggered, it would pass to this node.

- **Regex 1**: `/(opportunity|role|contract...)/i`
- Matches: "**Role**" (Subject), "**opportunity**" (Body).
- **Result**: This node would have **PASSED**.

### C. CV Selection (node: "Select Best CV")

- **Logic**: Maps keywords to PDFs.
- **Snippet**: "Senior Technical Architect... cloud technologies like AWS, Azure..."
- **Match**: "Architect", "AWS", "Azure".
- **Selected CV**: Likely `cv_cloud_architect.pdf` or `cv_aws_architect.pdf`.
- **Result**: File exists. This node would have **PASSED**.

## 2. Root Cause Candidates

### Candidate 1: Missing "Role" in Trigger Query (High Probability)

The Trigger query is narrower than the internal filter.

- **Current Query**: `(cv OR resume OR job OR contract OR opportunity OR hiring OR "send cv")`
- **Missing**: "Role", "Vacancy", "Position".
- **Impact**: Emails where "Role" is the primary subject keyword might be missed if other body keywords aren't picked up instantly.

### Candidate 2: Label/Inbox Bypass (Medium Probability)

- The user metadata indicates the email has the label `1_borrow_followup` and was "processed".
- **Scenario**: If a Gmail filter automatically applied a label and archived the email (removed from Inbox) *before* n8n polled (every minute), the `Gmail Trigger Inbox` node would miss it.
- **Scenario**: If `1_borrow_followup` is not the ID watched by `Gmail Trigger Follow Through` (`Label_4716836601042464671`), it wouldn't be caught there either.

### Candidate 3: Read Status

- If the email was opened (marked read) by the user (or a script) before the 1-minute poll cycle, the `is:unread` filter excludes it.

## 3. Recommended Fixes

### Fix 1: Expand Trigger Keywords (Recommended)

Update the Gmail Trigger search query to include high-value subject keywords found in the email.

- **Add**: "Role", "Position", "Architect".
- **New Query**: `is:unread (cv OR resume OR job OR contract OR opportunity OR hiring OR "send cv" OR role OR position OR architect)`

### Fix 2: Check Label IDs

- Verify if `1_borrow_followup` corresponds to `Label_4716836601042464671` or if a new trigger is needed for that label.

### Fix 3: Process "Read" Emails (Optional)

- If speed is an issue or user reads emails fast, remove `is:unread` from the query, but this requires robust "already processed" checks (which are in place via the `Mark as Read` and `Label` logic, but might need strengthening).

## 4. Next Steps

1. **Update Workflow**: Edit the Gmail Trigger node query to include "Role".
2. **Test**: Send a test email with subject "Exciting Role".
