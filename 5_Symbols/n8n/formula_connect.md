# Connect to n8n using .env

This directory contains a setup to connect to your n8n instance using environment variables.

## 1. Configure .env

Ensure your `.env` file has the following variables:

```ini
N8N_PROTOCOL=https
N8N_HOST=n8n.rifaterdemsahin.com
N8N_API_KEY=your_actual_api_key_here
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
