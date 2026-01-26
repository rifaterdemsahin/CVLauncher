const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve static files (index.html)

app.post('/run-test', (req, res) => {
    const scriptName = req.body.script;

    // Security check: only allow known scripts from this dir
    const allowedScripts = [
        'test_specific_email.js',
        'test_security_cleared_confirmation.js',
        'test_jobserve_confirmation.js',
        'test_webhook.js'
    ];

    if (!allowedScripts.includes(scriptName)) {
        return res.status(400).json({ success: false, message: 'Invalid script name.' });
    }

    const scriptPath = path.join(__dirname, scriptName);
    console.log(`Executing: node ${scriptName}`);

    exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.json({ success: false, message: error.message, output: stderr });
        }
        console.log(`Output: ${stdout}`);
        res.json({ success: true, message: 'Test execution started.', output: stdout });
    });
});

app.listen(port, () => {
    console.log(`🚀 Test Runner Server is running at http://localhost:${port}`);
});
