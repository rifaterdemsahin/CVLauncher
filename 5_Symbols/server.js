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
// Serve static files from the root and cvs/public directory
app.use(express.static(__dirname));
app.use('/cvs/public', express.static(path.join(__dirname, 'cvs/public')));

const SOURCE_CV_PATH = path.join(__dirname, 'Source/cv.md');
const PUBLIC_CVS_DIR = path.join(__dirname, 'cvs/public');

// Endpoint to generate response
app.post('/api/respond', async (req, res) => {
    const { recruiterRequest } = req.body;

    if (!recruiterRequest) {
        return res.status(400).json({ error: 'Recruiter request is required' });
    }

    try {
        // 1. Read the source CV
        let sourceCvContent = '';
        if (fs.existsSync(SOURCE_CV_PATH)) {
            sourceCvContent = fs.readFileSync(SOURCE_CV_PATH, 'utf8');
        } else {
            console.error('Source CV not found at:', SOURCE_CV_PATH);
            sourceCvContent = 'Source CV content not available.';
        }

        // 2. List public CV links
        let publicCvLinks = [];
        if (fs.existsSync(PUBLIC_CVS_DIR)) {
            const files = fs.readdirSync(PUBLIC_CVS_DIR);
            // Assuming the Fly.io app will serve these files at /cvs/public/
            // and the domain is handled by the user or fly.toml
            const baseUrl = process.env.BASE_URL || 'https://cv-launcher.fly.dev';
            publicCvLinks = files
                .filter(file => file.endsWith('.pdf') || file.endsWith('.md'))
                .map(file => `${baseUrl}/cvs/public/${file}`);
        }

        // 3. Call xAI (Grok) API
        const xaiApiKey = process.env.XAI_API_KEY;
        if (!xaiApiKey) {
            throw new Error('XAI_API_KEY is not configured in environment');
        }

        const prompt = `
You are an AI assistant helping a candidate respond to a recruiter. 
Using the provided CV as the source of truth, generate a professional and tailored response to the recruiter's request.

RECRUITER REQUEST:
${recruiterRequest}

SOURCE CV CONTENT:
${sourceCvContent}

AVAILABLE CV LINKS (Include the most relevant one in your response):
${publicCvLinks.join('\n')}

INSTRUCTIONS:
- Be concise, professional, and highlight relevant skills.
- Explicitly mention that a detailed CV is attached/linked.
- Use one of the provided links if it matches the role.
`;

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
            }
        });

        const generatedResponse = response.data.choices[0].message.content;

        res.json({ 
            response: generatedResponse,
            links: publicCvLinks
        });

    } catch (error) {
        console.error('Error generating response:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to generate response' });
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
