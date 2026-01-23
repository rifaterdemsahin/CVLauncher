# Connect to n8n using .env

This directory contains a setup to connect to your n8n instance using environment variables.

## 1. Configure .env

Ensure your `.env` file has the following variables:

```ini
N8N_WORKFLOW_ID_CVD=CVD1ecv1GNe9uF4a
N8N_HOST=https://n8n.rifaterdemsahin.com/
N8N_API_KEY=... (your actual key)
```

## 2. Install Dependencies

You need `axios` and `dotenv` to run the connection script.

```bash
npm init -y
npm install axios dotenv
```

## 3. Run the Connection Script

Execute the script to test the connection:

```bash
node connect.js
```

## Script Explanation (`connect.js`)

The script performs the following:
1.  Loads environment variables using `dotenv`.
2.  Constructs the API URL.
3.  Makes a GET request to `/api/v1/workflows` to verify credentials.
4.  Logs the success or error message.

## 4. Verification Results

Verified connection on 2026-01-23.
- **Connection Status**: Successful
- **Target Workflow**: "Respond to Job Offers" (ID: CVD1ecv1GNe9uF4a)
- **Status**: Active
- **URL**: [https://n8n.rifaterdemsahin.com/workflow/CVD1ecv1GNe9uF4a](https://n8n.rifaterdemsahin.com/workflow/CVD1ecv1GNe9uF4a)

## 5. Workflow Stages

The "Respond to Job Offers" workflow consists of the following automated stages:

1.  **Trigger (Gmail/Webhook)**:
    *   Monitors the inbox for unread emails not from self, categorized as primary.
    *   Can also be triggered manually via Webhook.
2.  **Filter (Check for Recruiter Keywords)**:
    *   Analyzes email subject/body for keywords like "opportunity", "hiring", "rate", "salary" to identify potential job offers.
3.  **Decision (Select Best CV)**:
    *   Executes JavaScript to detect tech stack (Azure, GCP, AWS) from the email content.
    *   Selects the appropriate PDF filename and constructs the GitHub download URL.
4.  **Action (Download from GitHub)**:
    *   Fetches the selected CV PDF from the `CVLauncher` repository.
5.  **Response (Reply with CV)**:
    *   Sends an automated reply to the recruiter with the specific CV attached.
6.  **Cleanup (Mark as Read)**:
    *   Removes the "UNREAD" label to prevent reprocessing.
7.  **Notification (Telegram Notify)**:
    *   Alerts the admin via Telegram with details of the sent reply (Recipient, Tech Stack, CV Name).
