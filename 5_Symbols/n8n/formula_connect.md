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
