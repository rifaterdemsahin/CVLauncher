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
- **`backup_workflow.js`**: Fetches the current workflow from n8n and saves it to a `backups/` directory with a timestamped filename (e.g., `workflow_backup_2026-01-23_21-57-23.json`).

### ⚙️ Configuration & Data
- **`.env`**: (GitIgnored) Stores sensitive connection details `N8N_API_KEY`, `N8N_HOST`, etc.
- **`workflow_dump.json`**: A local backup/cache of the workflow structure retrieved from the server.
