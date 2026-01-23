# n8n: Respond to Job Offers in Gmail

This directory contains resources, documentation, and maintenance scripts for the **[Respond to Job Offers](https://n8n.rifaterdemsahin.com/workflow/CVD1ecv1GNe9uF4a)** workflow.

## 📂 Folder Structure

We have reorganized the project structure to improve clarity and scalability:

- **Root**: `Respond to Job Offers in Gmail` - Contains high-level documentation and workflow-specific metadata.
- **`fixes/`**: Dedicated submodule containing all Node.js maintenance scripts. This keeps the root directory clean and separates "operational tools" from "documentation".
- **`backups/`**: Stores timestamped JSON snapshots of the workflow.

## 📄 Documentation
- **`formula_connect.md`**: Guide for connecting to the n8n instance and verification details.
- **`readme.md`**: This file.

## 🛠️ Maintenance Scripts (`/fixes`)

All scripts are now located in the `fixes/` subdirectory. To run them, navigate to this folder or use: `node fixes/script_name.js`.

### Workflow Optimization & Architecture
- **`refactor_workflow_optimal.js`**: **(Current Architecture)** Implements the optimal flow: `Triggers -> Blacklist Check -> CV Selection`. Uses a unified "Restore Context" merge node for efficient data handling.
- **`enforce_rate_limits.js`**: Implements a sequential processing loop (SplitInBatches + Wait) to prevent API rate limits (429 Errors).
- **`broaden_trigger_scope.js`**: Configures Gmail Trigger to catch all job keywords (`cv`, `job`, `project`) and removes `from:me` filters for easier testing.

### Features & Updates
- **`update_default_cv.js`**: Sets the default CV fallback to **AI Engineer** (`cv_ai_engineer.pdf`).
- **`add_blacklist_check.js`**: Integrates Google Sheets for checking blacklisted emails.
- **`update_cv_map.js`**: Maps keywords (e.g., "Azure", "AWS") to specific PDF files.
- **`update_email_template.js`**: Deploys the rich HTML email reply template.
- **`update_notifications_layout.js`**: Rearranges the canvas and adds "Notify Blocked" Telegram alerts.

### Fixes & patches
- **`fix_telegram_rate_limit.js`**: Enables "Retry On Fail" for Telegram nodes.
- **`fix_blocked_context.js`** / **`add_merge_node_for_context.js`**: *Legacy logic* for restoring data context (superseded by `refactor_workflow_optimal.js` but kept for reference).
- **`fix_download_failure.js`**: Ensures Google Sheets node always outputs data.
- **`fix_error_handling.js`**: Enables "Continue On Fail" for Gmail nodes (test mode support).
- **`fix_node_references.js`** / **`debug_references.js`**: Repoints node variables to the correct upstream sources.
- **`fix_manual_trigger.js`**: Adds Mock Data for manual testing.
- **`fix_self_reply.js`**: Legacy script for self-exclusion logic.
- **`ensure_blacklist_resilience.js`**: Hardens the "Check Blacklist" node by enabling "Continue On Fail" and "Always Output Data", preventing workflow crashes if Google Sheets credentials are invalid.
- **`inject_debug_nodes.js`**: Inserts "Do Nothing" Code nodes with console logs at critical junctions. This aids debugging by creating visible checkpoints in the execution history to trace where the flow might be stalling.

### Utilities
- **`backup_workflow.js`**: Saves a snapshot of the current workflow to `backups/`.
- **`connect.js`**: Verifies n8n connectivity.
- **`get_workflow_details.js`**: Dumps raw workflow JSON.
- **`add_sticky_notes.js`** / **`add_david_sticky_note.js`** / **`add_version_tag.js`**: Canvas annotation tools.

## ⚙️ Configuration
- **`.env`**: Stores `N8N_API_KEY`, `N8N_HOST` (GitIgnored).
- **`workflow_dump.json`**: Cached workflow structure.

## 🔗 References
- **David Gilchrist**: [LinkedIn Profile](https://www.linkedin.com/in/david-gilchrist-61b158301/) | [Ultimate IT Contractor Course (Coupon)](https://www.udemy.com/course/become-an-ultimate-it-contractor/?couponCode=0A509E34C56999F976C9)
