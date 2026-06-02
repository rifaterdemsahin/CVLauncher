# Prompt: Fix Gemini API Error on Recruiter Agent

Use this exact prompt next time the recruiter page at  
https://rifat-cvs-response-generator.fly.dev/recruiter stops working.

---

## The Prompt

```
The recruiter agent at https://rifat-cvs-response-generator.fly.dev/recruiter is broken.

Before touching any code or infrastructure, do these checks IN ORDER and stop at the first failure:

1. READ THE EXACT ERROR
   - Open browser devtools → Network tab → click the /api/respond request → read the raw response body
   - OR check fly logs: fly logs --app rifat-cvs-response-generator --no-tail
   - Paste the exact error message here before doing anything else

2. CHECK THE GEMINI KEY STATUS
   - Run: az keyvault secret show --vault-name dp-kv-deliverypilot --name GEMINI-API-KEY-PRIMARY --query value -o tsv
   - Verify the key starts with "AIza" (valid Gemini key format)
   - If it does NOT start with "AIza", the key is wrong or revoked — get a new one from https://aistudio.google.com/apikey BEFORE proceeding
   - Check usage: https://aistudio.google.com/usage?timeRange=last-28-days&project=gen-lang-client-0369583419

3. CHECK FLY SECRETS
   - Run: fly secrets list --app rifat-cvs-response-generator
   - Confirm GEMINI_API_KEY, AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET are all present and Deployed

4. IF KEY IS VALID BUT STILL FAILING — sync KV to fly secret directly:
   - Run: az keyvault secret show --vault-name dp-kv-deliverypilot --name GEMINI-API-KEY-PRIMARY --query value -o tsv
   - Then: fly secrets set GEMINI_API_KEY="<value from above>" --app rifat-cvs-response-generator
   - Do NOT paste the key value into chat

5. IF SERVER IS NOT STARTING (connection refused on fly):
   - Check fly logs for "Server running on port 8080" — if missing, the app crashed on startup
   - The app must call app.listen() BEFORE any async network calls (Azure KV, etc.)

6. ONLY AFTER THE ABOVE — if still broken, deploy:
   - cd 5_Symbols/response_generator && fly deploy

DO NOT:
- Paste API keys or SP credentials into chat (Google revokes them automatically)
- Migrate infrastructure (Doppler → KV, etc.) until the key itself is confirmed working
- Assume a fly deploy fixed it without checking logs first
```

---

## Quick Reference

| What broke | One-line fix |
|------------|-------------|
| Gemini 403 billing hold | New key from https://aistudio.google.com/apikey + set in KV + fly secret |
| Key leaked/revoked | Same as above — new key, never reuse |
| KV secret not loading | `fly secrets set GEMINI_API_KEY=<kv-value>` directly |
| Server not starting | Check `loadSecrets()` is NOT blocking `app.listen()` |
| `Unexpected end of JSON input` | fly cold-start 502 — retry after 3s, or check `res.text()` parse in recruiter.html |
| `MISSING — GEMINI_API_KEY not set` | KV failed silently — set fly secret directly as above |

## Key Locations

| Resource | Location |
|----------|----------|
| Gemini keys | https://aistudio.google.com/apikey |
| Gemini usage | https://aistudio.google.com/usage?timeRange=last-28-days&project=gen-lang-client-0369583419 |
| GCP billing | https://console.cloud.google.com/billing |
| Azure KV portal | https://portal.azure.com → dp-kv-deliverypilot |
| fly.io monitor | https://fly.io/apps/rifat-cvs-response-generator/monitoring |
| xAI console | https://console.x.ai |
