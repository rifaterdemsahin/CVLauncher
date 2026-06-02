# Deployment Report — Recruiter Agent Billing Fix

**Date:** 2026-06-02  
**App:** `rifat-cvs-response-generator`  
**URL:** https://rifat-cvs-response-generator.fly.dev/recruiter  
**Region:** ams  
**Deployed by:** rifaterdemsahin@gmail.com

---

## What Was Deployed

### Bug Fixed
- **403 PERMISSION_DENIED** from Gemini API on https://rifat-cvs-response-generator.fly.dev/recruiter
- Root cause: Google Cloud project `616339871325` billing hold ("Lightning dunning decision is deny")
- Previously showed raw JSON error dump — confusing and unactionable

### Changes Shipped
| File | Change |
|------|--------|
| `server.js` | Detects billing 403 errors, returns human-readable message + `billingError: true` flag |
| `recruiter.html` | Added "Buy Gemini Credits" → https://console.cloud.google.com/billing |
| `recruiter.html` | Added "Buy Grok Credits" → https://console.x.ai |
| `recruiter.html` | Billing error pulses the relevant credits button red |
| `6_Semblance/error-log.md` | Error logged with page URL, cause, and fix |

---

## Build Log

```
Builder:     Depot
Build time:  24.1s
Steps:       11/11 FINISHED
Base image:  node:18-slim (sha256:f9ab18e3...)
Image size:  75 MB
Image tag:   deployment-01KT43W8W2H6WM8VF93SQBPE7T
Registry:    registry.fly.io/rifat-cvs-response-generator
```

### Build Steps
1. Load Dockerfile & build context (150.27 kB transferred)
2. Pull `node:18-slim` base layer
3. Install Doppler CLI + system deps (`apt-get`)
4. Copy `package*.json` and run `npm install`
5. Copy all app files
6. Push 11 layers to fly registry

---

## Deployment Strategy

- **Strategy:** Rolling (zero-downtime)
- **Machine cleared:** `2879209f605d18`
- **Secrets:** Injected at runtime via Doppler (`doppler run -- npm start`)
- **Auto-stop/start:** enabled (`min_machines_running = 0`)
- **VM:** `shared-cpu-1x`, 512 MB RAM

---

## Monitoring

https://fly.io/apps/rifat-cvs-response-generator/monitoring

---

## Outstanding Action

The Gemini billing hold on GCP project `616339871325` is still active.  
To restore Gemini: go to https://console.cloud.google.com/billing, resolve the payment, then test at the recruiter page. The "Buy Gemini Credits" button in the UI links there directly.
