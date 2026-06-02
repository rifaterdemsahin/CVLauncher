# Fly.io Logs Investigation Report

**Date:** 2026-06-02  
**App:** `rifat-cvs-response-generator`  
**Page:** https://rifat-cvs-response-generator.fly.dev/recruiter  
**Error reported:** `Unexpected end of JSON input` (SyntaxError at recruiter:614)

---

## How the Logs Were Reached

### Command used
```bash
fly logs --app rifat-cvs-response-generator --no-tail
```

- `fly logs` streams the machine's stdout/stderr via the fly.io CLI
- `--app` targets the specific app by name
- `--no-tail` fetches recent history and exits (without `--no-tail` it blocks and streams live)
- Output was read from the background task file after running with `run_in_background`

### Why `--no-tail`
The default `fly logs` tails indefinitely. Since we needed a snapshot of recent errors (not a live stream), `--no-tail` captured the last ~100 log lines and returned immediately.

---

## What the Logs Showed

### Timeline of events

| Time (UTC) | Event |
|------------|-------|
| 09:50:23 | Server start — running OLD image (`sha256:8ba3eae6`) with `doppler run -- npm start` |
| 09:50:28 | Error: Gemini 403 — billing hold on GCP project `616339871325` |
| 09:52:50 | Error: Gemini request timeout (120,000ms exceeded) |
| 09:57:05 | fly.io auto-stopped machine (excess capacity, `min_machines_running = 0`) |
| 11:41:36 | Machine restarted — still running OLD image with Doppler |
| 12:08:58 | Machine restarted — still OLD image |
| 12:15:56 | **New error:** `"Your API key was reported as leaked"` — Google revoked the key |
| 12:11:49 | fly.io began pulling NEW image (`sha256:c42a5690`) with Azure KV |
| 12:31:11 | New image fully pulled and running |

---

## Root Causes Found

### 1. API key leaked and auto-revoked by Google
The new Gemini key was shared in the chat conversation. Google's secret scanning detected it and automatically revoked it with:
```
"Your API key was reported as leaked. Please use another API key."
```
**Fix required:** Generate a completely new Gemini API key at https://aistudio.google.com/apikey and update Azure Key Vault secret `GEMINI-API-KEY-PRIMARY`.

### 2. `Unexpected end of JSON input` — cold-start 502
fly.io stops idle machines (`auto_stop_machines = true`, `min_machines_running = 0`).  
On the first request after a stop, the proxy returns a non-JSON HTTP 502 while the machine boots (~2-3s).  
The frontend called `res.json()` directly — a 502 body is not JSON, causing `SyntaxError: Unexpected end of JSON input`.

**Fix applied:** Changed `res.json()` to `res.text()` + `JSON.parse()` with a try/catch. Non-JSON responses now show a human-readable "app is cold-starting, please retry" message instead of crashing.

### 3. Old image persisted across restarts
After the Azure KV deploy, the machine was restarted several times by fly's auto-stop/start cycle and kept pulling the old image (`sha256:8ba3eae6`) until fly completed the image swap at 12:31.  
This is normal fly.io rolling behaviour — machines in stopped state are replaced on the next start.

---

## Fixes Applied

| Fix | File | Status |
|-----|------|--------|
| Safe JSON parsing (cold-start 502) | `recruiter.html` line 614 | Deployed |
| Billing error detection + human message | `server.js` | Deployed |
| Buy Credits buttons (Gemini + Grok) | `recruiter.html` | Deployed |
| Azure KV secret `GEMINI-API-KEY-PRIMARY` | Key Vault | Key revoked — needs rotation |

---

## Next Action

Generate a new Gemini API key and update the vault:
```bash
az keyvault secret set \
  --vault-name dp-kv-deliverypilot \
  --name GEMINI-API-KEY-PRIMARY \
  --value "<new-key-from-aistudio>"
```
Then restart the machine to pick up the new secret:
```bash
fly machine restart --app rifat-cvs-response-generator
```
