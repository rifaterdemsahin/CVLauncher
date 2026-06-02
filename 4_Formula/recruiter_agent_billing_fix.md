# Recruiter Agent — Billing Fix & Deployment Report

**Date:** 2026-06-02  
**Page:** https://rifat-cvs-response-generator.fly.dev/recruiter  
**App:** `rifat-cvs-response-generator` (fly.io, region: ams)

---

## Problem

The Gemini provider returned a 403 error on the recruiter response page:

```json
{
  "error": {
    "code": 403,
    "message": "Lightning dunning decision is deny for project: projects/616339871325",
    "status": "PERMISSION_DENIED"
  }
}
```

**Root cause:** Google Cloud project `616339871325` had a billing hold ("dunning" = failed payment collection). The API key was valid but the GCP project was suspended.

---

## Fixes Applied

### 1. `server.js` — Smart billing error detection
- Detects `PERMISSION_DENIED` / 403 / `dunning` in the API error response
- Returns a human-readable message instead of a raw JSON dump
- Adds `billingError: true` flag in the response for the frontend to act on

### 2. `recruiter.html` — Buy Credits buttons
- Added **"Buy Gemini Credits"** button → https://console.cloud.google.com/billing
- Added **"Buy Grok Credits"** button → https://console.x.ai
- Both buttons always visible below the provider selector
- On a billing error, the relevant button pulses red to guide the user immediately

### 3. `6_Semblance/error-log.md` — Error documented
- Issue logged with page URL, root cause, and fix applied

---

## Deployment

```bash
cd /Users/rifaterdemsahin/projects/CVLauncher/5_Symbols/response_generator
fly deploy
```

- Builder: depot (waiting for builder → image built → deployed)
- Config validated via `fly.toml`
- Secrets injected at runtime via Doppler (`doppler run -- npm start`)

---

## How to Fix the Billing Hold

1. Go to https://console.cloud.google.com/billing
2. Select project `616339871325`
3. Resolve the outstanding payment / re-enable billing
4. Or create a new GCP project with active billing and rotate `GEMINI_API_KEY` in Doppler → `prd_main`
