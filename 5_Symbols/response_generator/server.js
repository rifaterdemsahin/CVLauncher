const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const { SecretClient } = require('@azure/keyvault-secrets');
const { ClientSecretCredential } = require('@azure/identity');

const KEY_VAULT_URL = 'https://dp-kv-deliverypilot.vault.azure.net/';

// Secrets — start with env vars, overwrite with KV values once loaded
let secrets = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || null,
    XAI_API_KEY: process.env.XAI_API_KEY || null
};

async function loadSecrets() {
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    if (!tenantId || !clientId || !clientSecret) {
        console.warn('Azure credentials not set, using env vars for secrets');
        return;
    }
    try {
        const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
        const client = new SecretClient(KEY_VAULT_URL, credential);
        const [gemini, xai] = await Promise.all([
            client.getSecret('GEMINI-API-KEY-PRIMARY'),
            client.getSecret('XAI-API-KEY').catch(() => ({ value: null }))
        ]);
        if (gemini.value) secrets.GEMINI_API_KEY = gemini.value;
        if (xai.value) secrets.XAI_API_KEY = xai.value;
        console.log('Secrets loaded from Azure Key Vault');
    } catch (err) {
        console.warn('Azure Key Vault unavailable, keeping env var values:', err.message);
    }
}

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const SOURCE_CV_PATH = path.join(__dirname, 'Source/cv.md');
const CV_BASE_URL = 'https://rifat-cvs.fly.dev';

// Fetch available CV links from the live CV site
async function fetchCvLinks() {
    try {
        const res = await axios.get(CV_BASE_URL, { timeout: 5000 });
        const matches = res.data.match(/href="([^"]*\.pdf)"/g) || [];
        return matches
            .map(m => m.replace('href="', '').replace('"', ''))
            .map(p => `${CV_BASE_URL}${p}`);
    } catch (err) {
        console.error('Failed to fetch CV list:', err.message);
        return [];
    }
}

// Serve CV content for display
app.get('/api/cv', (req, res) => {
    if (fs.existsSync(SOURCE_CV_PATH)) {
        res.json({ content: fs.readFileSync(SOURCE_CV_PATH, 'utf8') });
    } else {
        res.status(404).json({ error: 'CV not found' });
    }
});

// Endpoint to generate response
app.post('/api/respond', async (req, res) => {
    const { recruiterRequest, cvMode = 'max' } = req.body;

    if (!recruiterRequest) {
        return res.status(400).json({ error: 'Recruiter request is required' });
    }

    const debugInfo = {};

    // CV truncation limits per mode
    const cvLimits = {
        max: null,      // full CV, no truncation
        large: 30000,   // ~30k chars
        medium: 15000,  // ~15k chars
        small: 5000     // ~5k chars
    };
    const limit = cvLimits[cvMode] ?? null;

    try {
        // 1. Read the source CV (optionally truncated based on cvMode)
        let sourceCvContent = '';
        if (fs.existsSync(SOURCE_CV_PATH)) {
            const fullCv = fs.readFileSync(SOURCE_CV_PATH, 'utf8');
            if (limit && fullCv.length > limit) {
                sourceCvContent = fullCv.slice(0, limit) + '\n\n[... CV truncated for brevity ...]';
                debugInfo.cvSource = `Loaded (${fullCv.length} chars, mode=${cvMode}, truncated to ~${sourceCvContent.length})`;
            } else {
                sourceCvContent = fullCv;
                debugInfo.cvSource = `Loaded (${fullCv.length} chars, mode=${cvMode}, full)`;
            }
        } else {
            debugInfo.cvSource = `Not found at ${SOURCE_CV_PATH}`;
            sourceCvContent = 'Source CV content not available.';
        }

        // 2. Fetch CV links from live site
        const publicCvLinks = await fetchCvLinks();
        debugInfo.cvLinksFound = publicCvLinks.length;

        // 3. Build prompt
        const prompt = `
You are writing a reply on behalf of Rifat Erdem Sahin to a recruiter message.
Your job is to craft a concise, professional response that pulls SPECIFIC evidence from the CV below.

RECRUITER MESSAGE:
${recruiterRequest}

--- CV START ---
${sourceCvContent}
--- CV END ---

AVAILABLE CV LINKS (pick the single most relevant one and include it):
${publicCvLinks.join('\n')}

RULES:
1. Open with a one-sentence hook that directly addresses the role/need in the recruiter message.
2. Pull 2-4 specific, quantified achievements or technologies from the CV that match the role (use exact names: project names, tools, clients, metrics).
3. Mention security clearance and UK work authorisation only if relevant to the role.
4. Include exactly one CV link — choose the filename that best matches the job title.
5. Close with a clear call to action (availability for a call, asking for the job spec, etc.).
6. Keep the total response under 200 words. No bullet points — write in short paragraphs.
7. Never make up facts not present in the CV.
`;

        debugInfo.promptLength = prompt.length;
        debugInfo.prompt = prompt;

        // 4. Call AI API (Grok or Gemini)
        const apiProvider = req.body.apiProvider || 'gemini';
        debugInfo.apiProvider = apiProvider;
        let generatedResponse = '';

        if (apiProvider === 'grok') {
            const xaiApiKey = secrets.XAI_API_KEY;
            if (!xaiApiKey) {
                debugInfo.apiKey = 'MISSING — XAI_API_KEY not set';
                return res.status(500).json({ error: 'XAI_API_KEY is not configured', debug: debugInfo });
            }
            debugInfo.apiKey = `Set (${xaiApiKey.slice(0, 8)}...)`;
            debugInfo.model = 'grok-3-latest';

            const response = await axios.post('https://api.x.ai/v1/chat/completions', {
                model: 'grok-3-latest',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant for job applications.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 2048
            }, {
                headers: {
                    'Authorization': `Bearer ${xaiApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 120000
            });

            generatedResponse = response.data.choices[0].message.content;
        } else {
            // default to gemini
            const geminiApiKey = secrets.GEMINI_API_KEY;
            if (!geminiApiKey) {
                debugInfo.apiKey = 'MISSING — GEMINI_API_KEY not set';
                return res.status(500).json({ error: 'GEMINI_API_KEY is not configured', debug: debugInfo });
            }
            debugInfo.apiKey = `Set (${geminiApiKey.slice(0, 8)}...)`;
            debugInfo.model = 'gemini-2.5-flash';

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
                {
                    systemInstruction: {
                        parts: [{ text: 'You are a helpful assistant for job applications.' }]
                    },
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: prompt }]
                        }
                    ],
                    generationConfig: {
                        maxOutputTokens: 4096,
                        temperature: 0.7
                    }
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 120000
                }
            );

            const candidate = response.data.candidates?.[0];
            if (candidate) {
                // Concatenate all parts (Gemini can split across multiple parts)
                const parts = candidate.content?.parts || [];
                generatedResponse = parts.map(p => p.text || '').join('');
                debugInfo.geminiFinishReason = candidate.finishReason;
            } else {
                generatedResponse = 'No response generated';
            }
        }

        debugInfo.responseLength = generatedResponse.length;

        res.json({
            response: generatedResponse,
            links: publicCvLinks,
            debug: debugInfo
        });

    } catch (error) {
        const apiError = error.response?.data;
        const errMsg = apiError
            ? JSON.stringify(apiError)
            : error.message;

        debugInfo.error = errMsg;
        debugInfo.errorStatus = error.response?.status;
        debugInfo.errorCode = error.code;

        // Detect billing/payment issues and surface a clear message
        const isBillingError =
            error.response?.status === 403 &&
            (errMsg.includes('PERMISSION_DENIED') || errMsg.includes('dunning') || errMsg.includes('billing'));

        const userFacingError = isBillingError
            ? `Billing issue: your ${debugInfo.apiProvider === 'grok' ? 'xAI' : 'Google Cloud'} account has a payment hold. Please top up your credits and try again.`
            : errMsg;

        console.error('Error generating response:', errMsg);
        res.status(500).json({
            error: userFacingError,
            billingError: isBillingError,
            debug: debugInfo
        });
    }
});

// Serve the recruiter page
app.get('/recruiter', (req, res) => {
    res.sendFile(path.join(__dirname, 'recruiter.html'));
});

// Serve the main CV Manager
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start immediately, load KV secrets in background
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    loadSecrets();
});
