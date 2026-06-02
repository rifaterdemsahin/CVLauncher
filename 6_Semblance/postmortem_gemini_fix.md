# Post-Mortem: Why It Took So Long to Fix the Gemini API Error

**Page affected:** https://rifat-cvs-response-generator.fly.dev/recruiter  
**Total time to fix:** Multiple deploy cycles across one session  
**Root cause chain:** 5 compounding problems, each hiding the next

---

## The Chain of Failures (in order)

### Step 1 — Started with the wrong diagnosis
The first error was a Gemini 403 billing hold on GCP project `616339871325`. That was the real root cause. Instead of stopping there and fixing billing, the response was to migrate the entire secret management system from Doppler to Azure Key Vault. This was the right long-term move but added 4 new failure modes on top of the original problem.

**Time lost:** Significant — the billing problem was never actually fixed; a new key was needed all along.

---

### Step 2 — The new Gemini key was shared in chat and immediately revoked
The new API key was pasted directly into the chat conversation. Google's secret scanning detected it within minutes and auto-revoked it with:
```
"Your API key was reported as leaked. Please use another API key."
```
The same key was then stored in Azure Key Vault, so KV now held a dead key. This meant every subsequent fix that "worked" technically was still broken at the API level.

**Time lost:** Multiple deploy/test cycles against a key that could never succeed.

---

### Step 3 — Azure Key Vault silently failed to load (wrong access model)
The Service Principal `fly-recruiter-agent` was granted the **"Key Vault Secrets User" RBAC role**. But the vault `dp-kv-deliverypilot` had `enableRbacAuthorization = false` — it uses **access policies**, not RBAC. The RBAC role assignment did nothing.

On the fly.io machine, `loadSecrets()` threw an auth error, caught it silently, and fell back to `process.env.GEMINI_API_KEY` — which was not set. The app reported:
```json
"apiKey": "MISSING — GEMINI_API_KEY not set"
```
This looked like a configuration problem, not a KV access model mismatch.

**Fix:** `az keyvault set-policy` instead of `az role assignment create`.  
**Time lost:** Took reading the raw KV JSON (`enableRbacAuthorization: false`) to find this.

---

### Step 4 — Azure Key Vault loading blocked the server from starting
`loadSecrets()` was called inside `.then()` after `app.listen()` — but actually it was called *before* `app.listen()`:
```js
loadSecrets().then(() => {
    app.listen(PORT, ...);
});
```
When KV auth failed (Step 3), the SDK's `DefaultAzureCredential` tried every credential method in sequence (env vars, workload identity, managed identity, CLI, etc.) before giving up. This took long enough that fly.io's health check timed out before the server ever bound to port 8080.

Result: every deploy showed the machine "started" but the proxy reported:
```
instance refused connection — is your app listening on 0.0.0.0:8080?
```

**Fix:** Start the server immediately, load KV secrets in background. Also switch to `ClientSecretCredential` directly — no credential hunting.  
**Time lost:** Two full deploy cycles diagnosing a startup race condition.

---

### Step 5 — Cold-start caused `Unexpected end of JSON input`
fly.io's `auto_stop_machines = true` with `min_machines_running = 0` stops the machine when idle. On the first request after a stop, the proxy returns a non-JSON HTTP 502 while the VM boots (~2-3 seconds). The frontend did:
```js
const data = await res.json(); // crashes on 502 HTML body
```
This masked all other errors — instead of seeing the real API error, users got a generic JavaScript crash.

**Fix:** `res.text()` first, then `JSON.parse()` in a try/catch with a "cold-starting, please retry" message.  
**Time lost:** Obscured the real errors for several test cycles.

---

## Why Each Fix Took Multiple Attempts

| Problem | Why it wasn't caught immediately |
|---------|----------------------------------|
| Billing hold | Hidden behind generic 403, looked like a permissions issue |
| Leaked key | Google revocation is near-instant but silent — no warning in the app |
| KV access model | RBAC assignment succeeded (no error) but had no effect |
| Startup block | fly.io shows "machine started" even when app never bound to port |
| Cold-start 502 | Frontend crashed before showing the actual server error |

---

## What Should Have Been Done First

1. **Check the exact error message** — "Lightning dunning decision is deny" clearly means a billing payment hold, not a code bug.
2. **Fix billing or get a new key** before touching any infrastructure.
3. **Never paste API keys in chat** — they get scanned and revoked automatically.
4. **Test KV access independently** with `az keyvault secret show` before wiring it into the app.
5. **Always start the HTTP server first**, load external dependencies after — never block startup on a network call.

---

## Final State (Working)

- `GEMINI_API_KEY` set directly as fly.io secret (immediate, no KV dependency)
- Azure KV access policy correctly set for the SP
- Server starts in ~1s, loads KV secrets in background
- Frontend handles non-JSON 502s gracefully with retry hint
- Buy Credits + Usage links visible in UI for future billing issues
