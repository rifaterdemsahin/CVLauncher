# Secret Migration — Doppler → Azure Key Vault

**Date:** 2026-06-02  
**App:** `rifat-cvs-response-generator` (https://rifat-cvs-response-generator.fly.dev/recruiter)  
**Trigger:** Gemini 403 billing hold made old key unusable; new key stored securely in Azure KV

---

## Azure Key Vault Details

| Field | Value |
|-------|-------|
| Vault name | `dp-kv-deliverypilot` |
| URL | `https://dp-kv-deliverypilot.vault.azure.net/` |
| Subscription | `&lt;SUBSCRIPTION_ID&gt;` |
| Resource Group | `deliverypilot-rg` |
| Portal | https://portal.azure.com/#@infodeliverypilot.onmicrosoft.com/resource/subscriptions/&lt;SUBSCRIPTION_ID&gt;/resourceGroups/deliverypilot-rg/providers/Microsoft.KeyVault/vaults/dp-kv-deliverypilot/overview |

---

## Secrets Stored in Vault

| Secret Name | Purpose |
|-------------|---------|
| `GEMINI-API-KEY-PRIMARY` | Google Gemini 2.5 Flash API key |
| `XAI-API-KEY` | xAI Grok API key |

> **Note:** Never store raw secret values in chat, files, or git. Rotate any key that was shared in plaintext.

---

## Code Changes

### `package.json`
Added Azure SDK dependencies:
- `@azure/keyvault-secrets` ^4.8.0
- `@azure/identity` ^4.4.0

### `server.js`
- `loadSecrets()` runs at startup using `DefaultAzureCredential`
- Falls back to `process.env` if Key Vault is unreachable (local dev)
- `secrets.GEMINI_API_KEY` and `secrets.XAI_API_KEY` replace all `process.env` references

### `Dockerfile`
- Removed Doppler CLI install (was ~10s build step + 75 MB image overhead)
- `CMD ["npm", "start"]` — clean and simple
- Azure credentials injected via fly.io secrets at runtime

---

## Fly.io — Required Secrets

Set these once via `fly secrets set` so `DefaultAzureCredential` can authenticate:

```bash
fly secrets set \
  AZURE_TENANT_ID=<your-tenant-id> \
  AZURE_CLIENT_ID=<service-principal-client-id> \
  AZURE_CLIENT_SECRET=<service-principal-secret> \
  --app rifat-cvs-response-generator
```

The Service Principal needs the **Key Vault Secrets User** role on `dp-kv-deliverypilot`.

---

## Deployment Record

| Field | Value |
|-------|-------|
| Date | 2026-06-02 |
| Deployment ID | `deployment-01KT450XY43XZDJP9AM4WN3F4K` |
| Image size | 72 MB (was 75 MB — Doppler CLI layer removed) |
| Machine | `2879209f605d18` — rolling update, reached good state |
| App URL | https://rifat-cvs-response-generator.fly.dev/recruiter |
| Monitor | https://fly.io/apps/rifat-cvs-response-generator/monitoring |

> **Action required:** Rotate the SP password — it was shared in chat. Run:
> ```bash
> az ad sp credential reset --id <SP_CLIENT_ID>
> ```
> Then update the fly secret: `fly secrets set AZURE_CLIENT_SECRET=<new-password> --app rifat-cvs-response-generator`

---

## Why Azure Key Vault over Doppler

| | Doppler | Azure Key Vault |
|--|---------|----------------|
| Auth on fly.io | Doppler token in env | SP credentials in fly secrets |
| Secret rotation | Manual re-deploy | Live — app re-fetches on restart |
| Audit log | Doppler dashboard | Azure Monitor / activity log |
| Existing infra | Separate SaaS | Already used (infodeliverypilot tenant) |
| Docker image size | +Doppler CLI layer | No extra layer |
