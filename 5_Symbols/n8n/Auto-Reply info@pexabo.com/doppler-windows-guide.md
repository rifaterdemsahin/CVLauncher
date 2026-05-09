# Doppler Troubleshooting Guide (Windows)

> **Platform**: Windows (PowerShell)
> **Issue**: `doppler run --config prd --` gives "requires at least 1 arg(s), received 0"
> **Root cause**: The `--` separator needs a command AFTER it, and Windows syntax differs slightly from Unix.

---

## Quick Fix

### The Command You Ran (Wrong)
```powershell
# ❌ WRONG - missing command after --
doppler run --config prd --
```

### The Correct Commands

**Option 1: Use `--` with command after it (recommended)**
```powershell
doppler run --config prd -- node scripts/process-specific-email.js "URL" --dry-run
```

**Option 2: Use `--command` flag**
```powershell
doppler run --config prd --command "node scripts/process-specific-email.js "URL" --dry-run"
```

**Option 3: Just run with default config (if already setup)**
```powershell
doppler run -- node scripts/process-specific-email.js
```

---

## Step-by-Step Setup Checklist

### Step 1: Verify Doppler is Installed

```powershell
doppler --version
```

Expected: `v3.x.x` or similar. If not installed:
```powershell
# Install via Scoop
scoop install doppler

# Or download from: https://github.com/DopplerHQ/cli/releases
```

### Step 2: Verify You're Logged In

```powershell
doppler login
```

This opens a browser. Complete the login flow.

Verify:
```powershell
doppler me
```

Should show your email.

### Step 3: Verify Project Exists

```powershell
doppler projects list
```

If `pexabo-email-automation` is missing, create it:
```powershell
doppler projects create pexabo-email-automation
```

### Step 4: Verify Config (Environment) Exists

```powershell
doppler configs list --project pexabo-email-automation
```

Should show `dev`, `stg`, `prd`. If missing:
```powershell
doppler configs create dev --project pexabo-email-automation
doppler configs create prd --project pexabo-email-automation
```

### Step 5: Set Your Current Directory

Navigate to the project folder:
```powershell
cd C:\projects\CVLauncher\5_Symbols\n8n\Auto-Reply info@pexabo.com
```

Then setup Doppler for this folder:
```powershell
doppler setup
```

This will ask:
- Select project: `pexabo-email-automation`
- Select config: `prd`

Or manually:
```powershell
doppler setup --project pexabo-email-automation --config prd
```

Verify setup:
```powershell
doppler setup --print
```

Should show:
```
Project: pexabo-email-automation
Config: prd
```

### Step 6: Verify Secrets Exist

```powershell
doppler secrets
```

Should list all your secrets. If empty, add them:
```powershell
doppler secrets set N8N_HOST="https://n8n.rifaterdemsahin.com"
doppler secrets set N8N_MCP_ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIs..."
doppler secrets set FLY_IO_API_TOKEN="FlyV1 fm2_lJPEC..."
# etc.
```

---

## Common Errors & Fixes

### Error 1: "requires at least 1 arg(s), received 0"

**Cause**: You typed `doppler run --config prd --` without a command after `--`

**Fix**: Add the command after `--`:
```powershell
doppler run --config prd -- node -e "console.log('Hello')"
```

### Error 2: "Could not find config prd"

**Cause**: Config doesn't exist or wrong project

**Fix**:
```powershell
# List available configs
doppler configs list --project pexabo-email-automation

# Create if missing
doppler configs create prd --project pexabo-email-automation

# Or use correct config name
doppler run --config dev -- node script.js
```

### Error 3: "Doppler project not configured"

**Cause**: No `doppler.yaml` in current directory

**Fix**:
```powershell
# Option A: Run setup
doppler setup --project pexabo-email-automation --config prd

# Option B: Specify project every time
doppler run --project pexabo-email-automation --config prd -- node script.js
```

### Error 4: "Unauthorized"

**Cause**: Not logged in or token expired

**Fix**:
```powershell
doppler login
```

### Error 5: Secrets Not Found

**Cause**: Secrets are in wrong config or not set

**Fix**:
```powershell
# Check which secrets exist
doppler secrets --project pexabo-email-automation --config prd

# Add missing ones
doppler secrets set --project pexabo-email-automation --config prd KEY="VALUE"
```

---

## Windows PowerShell Specific Notes

### Quoting Rules

On Windows PowerShell, quotes can be tricky. Use these patterns:

**Single command:**
```powershell
doppler run -- node scripts/process-specific-email.js "URL" --dry-run
```

**Command with spaces:**
```powershell
doppler run --command 'node scripts/process-specific-email.js "URL" --dry-run'
```

**Multiple commands:**
```powershell
doppler run --command "node script1.js && node script2.js"
```

### Path with Spaces

The folder `Auto-Reply info@pexabo.com` has spaces. Use quotes:

```powershell
cd "C:\projects\CVLauncher\5_Symbols\n8n\Auto-Reply info@pexabo.com"
doppler run -- node "scripts/process-specific-email.js"
```

### Running npm/npx

```powershell
doppler run -- npm install
doppler run -- npx nodemon server.js
```

---

## Complete Test Sequence

Run these one by one. If any fail, fix before proceeding.

```powershell
# 1. Navigate to project
cd "C:\projects\CVLauncher\5_Symbols\n8n\Auto-Reply info@pexabo.com"

# 2. Verify Doppler version
doppler --version

# 3. Verify logged in
doppler me

# 4. Verify project exists
doppler projects list

# 5. Setup local config
doppler setup --project pexabo-email-automation --config prd

# 6. Verify setup
doppler setup --print

# 7. Verify secrets
doppler secrets

# 8. Test with simple command
doppler run -- node -e "console.log('N8N_HOST:', process.env.N8N_HOST)"

# 9. Test with script
doppler run -- node scripts/gmail-query-builder.js --show-labels
```

---

## Alternative: No Setup File (Explicit Every Time)

If you don't want to run `doppler setup`, specify project/config every time:

```powershell
doppler run `
  --project pexabo-email-automation `
  --config prd `
  -- node scripts/process-specific-email.js "URL" --dry-run
```

Or shorter:
```powershell
doppler run -p pexabo-email-automation -c prd -- node scripts/process-specific-email.js
```

---

## Example Commands for This Project

### Test Gmail Connection
```powershell
cd "C:\projects\CVLauncher\5_Symbols\n8n\Auto-Reply info@pexabo.com"
doppler run -- node scripts/gmail-query-builder.js --show-labels
```

### Process a Missed Email (Dry Run)
```powershell
cd "C:\projects\CVLauncher\5_Symbols\n8n\Auto-Reply info@pexabo.com"
doppler run -- node scripts/process-specific-email.js "https://mail.google.com/mail/u/0/#..." --dry-run
```

### Process a Missed Email (Execute)
```powershell
cd "C:\projects\CVLauncher\5_Symbols\n8n\Auto-Reply info@pexabo.com"
doppler run -- node scripts/process-specific-email.js "URL" --execute
```

### Deploy via MCP
```powershell
cd "C:\projects\CVLauncher\5_Symbols\n8n\Auto-Reply info@pexabo.com"
doppler run -- node scripts/n8n-mcp-deployer.js --create
```

---

## Summary

| What You Want | Command |
|---------------|---------|
| Check Doppler version | `doppler --version` |
| Login to Doppler | `doppler login` |
| Setup project locally | `doppler setup --project pexabo-email-automation --config prd` |
| List secrets | `doppler secrets` |
| Add a secret | `doppler secrets set KEY="VALUE"` |
| Run script with secrets | `doppler run -- node script.js` |
| Run with explicit project | `doppler run -p pexabo-email-automation -c prd -- node script.js` |

---

**Most Common Fix**: You forgot to add the command after `--`

❌ `doppler run --config prd --`
✅ `doppler run --config prd -- node script.js`

---

*If you're still stuck, run `doppler run --help` for full documentation.*
