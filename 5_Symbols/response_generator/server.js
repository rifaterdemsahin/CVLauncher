const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

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

// Endpoint to generate response
app.post('/api/respond', async (req, res) => {
    const { recruiterRequest } = req.body;

    if (!recruiterRequest) {
        return res.status(400).json({ error: 'Recruiter request is required' });
    }

    const debugInfo = {};

    try {
        // 1. Read the source CV
        let sourceCvContent = '';
        if (fs.existsSync(SOURCE_CV_PATH)) {
            sourceCvContent = fs.readFileSync(SOURCE_CV_PATH, 'utf8');
            debugInfo.cvSource = `Loaded (${sourceCvContent.length} chars)`;
        } else {
            debugInfo.cvSource = `Not found at ${SOURCE_CV_PATH}`;
            sourceCvContent = 'Source CV content not available.';
        }

        // 2. Fetch CV links from live site
        const publicCvLinks = await fetchCvLinks();
        debugInfo.cvLinksFound = publicCvLinks.length;

        // 3. Check API key
        const xaiApiKey = process.env.XAI_API_KEY;
        if (!xaiApiKey) {
            debugInfo.apiKey = 'MISSING — XAI_API_KEY not set';
            return res.status(500).json({ error: 'XAI_API_KEY is not configured', debug: debugInfo });
        }
        debugInfo.apiKey = `Set (${xaiApiKey.slice(0, 8)}...)`;

        const prompt = `
You are an AI assistant helping a candidate respond to a recruiter.
Using the provided CV as the source of truth, generate a professional and tailored response to the recruiter's request.

RECRUITER REQUEST:
${recruiterRequest}

SOURCE CV CONTENT:
${sourceCvContent}

AVAILABLE CV LINKS (include the most relevant one in your response):
${publicCvLinks.join('\n')}

INSTRUCTIONS:
- Be concise, professional, and highlight relevant skills.
- Explicitly mention that a detailed CV is attached/linked.
- Use one of the provided links if it matches the role.
`;

        debugInfo.promptLength = prompt.length;
        debugInfo.model = 'grok-beta';

        const response = await axios.post('https://api.x.ai/v1/chat/completions', {
            model: 'grok-beta',
            messages: [
                { role: 'system', content: 'You are a helpful assistant for job applications.' },
                { role: 'user', content: prompt }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${xaiApiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        const generatedResponse = response.data.choices[0].message.content;
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

        console.error('Error generating response:', errMsg);
        res.status(500).json({
            error: errMsg,
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
