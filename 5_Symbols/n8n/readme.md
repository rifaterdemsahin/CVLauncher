# n8n Automation Resources

This directory contains scripts and documentation for managing the "Respond to Job Offers" workflow on our n8n instance.

## 📂 Folder Contents

### 📄 Documentation
- **`formula_connect.md`**: The main guide detailing how to connect to the n8n instance, the workflow stages, and verification results.
- **`readme.md`**: this file.

### 🛠️ Scripts (Node.js)
- **`connect.js`**: Verifies the connection to `n8n.rifaterdemsahin.com` using the `.env` credentials and checks for the specific workflow.
- **`get_workflow_details.js`**: Fetches the full JSON definition of the "Respond to Job Offers" workflow and saves it locally as `workflow_dump.json`.
- **`add_sticky_notes.js`**: Programmatically adds explanatory sticky notes to the visual workflow editor to document the stages directly in the canvas.
- **`add_version_tag.js`**: Adds a "Version Info" sticky note to the workflow with the current Git commit hash, date, and repository link.
- **`update_cv_map.js`**: Updates the "Select Best CV" Code node with a comprehensive map of CVs based on the actual PDF files in `5_Symbols/cvs` matching keywords like AWS, Azure, AI, etc.
- **`update_email_template.js`**: Updates the "Reply with CV" Gmail node with a professional, rich-text HTML email template containing a CV summary, key accomplishments, and contact links.
- **`update_workflow_generic.js`**: Adds a "Manual Trigger" for testing and updates the email template to strictly use the detected tech stack/role.
- **`fix_manual_trigger.js`**: Enhances the manual test flow by adding a "Set Mock Data" node, which injects a dummy email (Azure DevOps role) so the workflow can fully execute from Trigger to Telegram without sending a real email.
- **`backup_workflow.js`**: Fetches the current workflow from n8n and saves it to a `backups/` directory with a full timestamped filename (e.g., `workflow_backup_YYYY-MM-DD_HH-mm-ss.json`).
- **`fix_node_references.js`**: Updates references in downstream nodes (Reply, Telegram) to point to "Select Best CV" instead of "Gmail Trigger", fixing "unexecuted node" errors during manual testing.
- **`add_david_sticky_note.js`**: Adds an acknowledgement sticky note for David Gilchrist to the workflow canvas.
- **`debug_references.js`**: Aggressively scans and fixes any remaining nodes that reference "Gmail Trigger" (which fails in manual testing) by re-pointing them to "Select Best CV".
- **`fix_error_handling.js`**: Enables "Continue On Fail" on Gmail nodes. This allows manual tests with fake IDs ("mock-id") to bypass Gmail errors and verify the full flow (including Telegram).
- **`fix_self_reply.js`**: Adds logic to the "Check for Recruiter Keywords" filter to explicitly ignore emails from the user's own name/email (e.g., "rifaterdemsahin"), preventing the bot from replying to test emails sent to oneself.
- **`broaden_trigger_scope.js`**: Expands the Gmail Trigger query to capture ALL job-related emails (removing "primary" category and "-from:me" restrictions) and updates keyword regex to catch simple phrases like "send cv".
- **`add_blacklist_check.js`**: Integrates a "Check Blacklist" Google Sheets node into the workflow. It checks incoming email addresses against a specified sheet and stops the workflow if a match is found, preventing replies to blacklisted recipients.
- **`update_notifications_layout.js`**: Reorganizes the workflow canvas (sticky notes) for clarity and adds a "Notify Blocked" Telegram node to alert admins when a blacklisted user attempts to contact.
- **`fix_download_failure.js`**: Fixes logic breaks by enabling "Always Output Data" on the Google Sheets node, ensuring that even if no blacklist match is found, the workflow continues to the "Download CV" step with the correct context.
- **`add_merge_node_for_context.js`**: Adds a "Merge" node to the workflow to recombine the original data (from "Select Best CV") with the blacklist check result. This ensures downstream nodes (Telegram, Reply) have access to all necessary variables (`from`, `techStack`, etc.), fixing "unexecuted node" errors.
- **`fix_blocked_context.js`**: Similar to the above, adds a "Restore Context Blocked" Merge node for the *blocked* path. This ensures failure notifications (for blacklisted users) also have access to the original email details (Subject/From).
- **`update_default_cv.js`**: Updates the "Select Best CV" logic to default to the AI Engineer CV (`cv_ai_engineer.pdf`) if no specific keywords are matched. Also reinforces safe variable references in the Blocked Notification node.
- **`fix_telegram_rate_limit.js`**: Enables "Retry On Fail" (3 attempts, 2s delay) for Telegram nodes to gracefully handle "Too Many Requests" (429) errors during rapid manual testing.
- **`enforce_rate_limits.js`**: Re-architects the workflow into a Loop (SplitInBatches + Loopback) with a "Wait" node. This guarantees email requests are processed sequentially (1 at a time) with a 2-second delay between them, preventing API flooding.

### ⚙️ Configuration & Data
- **`.env`**: (GitIgnored) Stores sensitive connection details `N8N_API_KEY`, `N8N_HOST`, etc.
- **`workflow_dump.json`**: A local backup/cache of the workflow structure retrieved from the server.

### 🔗 References
- **David Gilchrist**: [LinkedIn Profile](https://www.linkedin.com/in/david-gilchrist-61b158301/) | [Ultimate IT Contractor Course (Coupon)](https://www.udemy.com/course/become-an-ultimate-it-contractor/?couponCode=0A509E34C56999F976C9)
