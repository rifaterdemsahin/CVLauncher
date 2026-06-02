# Error Log and Solutions

## Common Issues and Resolutions

### Issue 1: Clipboard API Not Working
**Error:** `navigator.clipboard is undefined`
**Cause:** Browser doesn't support Clipboard API or page is not served over HTTPS
**Solution:** 
- Implemented fallback using `document.execCommand('copy')`
- Ensure application is served over HTTPS in production
- Check browser compatibility before using modern APIs

### Issue 2: Copy Button Not Responding
**Error:** Button click has no effect
**Cause:** JavaScript not loaded or function not defined
**Solution:**
- Verify script tag is correctly placed before closing body tag
- Check browser console for JavaScript errors
- Ensure onclick handler is properly defined

### Issue 3: Notification Not Showing
**Error:** Success notification doesn't appear
**Cause:** CSS classes not applied or timing issue
**Solution:**
- Verify notification element exists in DOM
- Check CSS display properties
- Ensure timeout is appropriate for user visibility

### Issue 4: Content Not Copying Correctly
**Error:** Copied content missing or malformed
**Cause:** Whitespace issues or HTML vs text content
**Solution:**
- Use `innerText` instead of `innerHTML` for plain text
- Normalize whitespace where necessary
- Test across different browsers

### Issue 6: Recruiter Email Failed — Gemini Billing Hold (Infinity Quest / Adrushya)
**Page:** https://rifat-cvs-response-generator.fly.dev/recruiter
**Trigger:** Pasted recruiter email from Adrushya (Infinity Quest Ltd, UK) re: Product Owner (SailPoint) role at Coforge, London hybrid contract
**Error:** Same 403 PERMISSION_DENIED / billing hold on GCP project `616339871325` — Gemini API key rejected
**Fix:** Migrated secrets from Doppler to Azure Key Vault `dp-kv-deliverypilot` (subscription `<SUBSCRIPTION_ID>`, RG `deliverypilot-rg`). New Gemini key stored as secret `GEMINI-API-KEY` in the vault.

---

### Issue 5: Gemini API 403 — Lightning Dunning / Payment Denied
**Page:** https://rifat-cvs-response-generator.fly.dev/recruiter
**Error:** `{"error":{"code":403,"message":"Lightning dunning decision is deny for project: projects/616339871325","status":"PERMISSION_DENIED"}}`
**Cause:** Google Cloud project billing suspended due to failed payment. The API key is valid but the GCP project has a billing hold ("dunning" = debt-collection process).
**Fix Applied:**
- Detect `PERMISSION_DENIED` / 403 on the server and return a human-readable billing error message
- Added "Buy Credits" buttons to the UI (Gemini → Google Cloud Billing, Grok → xAI Console)

## Debugging Tips
1. Use browser developer tools console
2. Check network tab for resource loading
3. Verify JavaScript execution order
4. Test in multiple browsers
5. Validate HTML structure
