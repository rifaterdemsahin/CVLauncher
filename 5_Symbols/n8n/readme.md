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

### ⚙️ Configuration & Data
- **`.env`**: (GitIgnored) Stores sensitive connection details `N8N_API_KEY`, `N8N_HOST`, etc.
- **`workflow_dump.json`**: A local backup/cache of the workflow structure retrieved from the server.
