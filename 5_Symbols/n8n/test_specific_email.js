const axios = require('axios');
require('dotenv').config();

const webhookUrl = 'https://n8n.rifaterdemsahin.com/webhook/529443ed-ff68-4b54-bab2-6fa41275e81f'; // Production Webhook

const payload = {
    "headers": {
        "host": "n8n.rifaterdemsahin.com",
        "user-agent": "axios/1.13.2",
        "content-type": "application/json"
    },
    "body": {
        "subject": "RE: Application submitted from SecurityClearedJobs.com by Rifat Erdem Sahin for Cloud DevOps Lead [13763] - Status: Emailed",
        "snippet": "Many thanks for your interest in the role. Please find here below full spec. if of interest, I'll be happy to discuss it further.",
        "body": `Hi Rifat,

Many thanks for your interest in the role.

Please find here below full spec. if of interest, I'll be happy to discuss it further.

Cloud DevOps Lead - 13763
. Pay rate: Up to £90,000 per annum
. Security Clearance: SC
. PERMANENT ROLE
. CV Deadline: ASAP (Ongoing)
. Location: Remote (Hybrid as needed - London) - 37.5 hours per week.
Essential
. Strong expertise in Azure DevOps, GitHub CI/CD, and build automation.
. Proficiency in Infrastructure as Code (Terraform, CloudFormation, Pulumi and PowerShell).
. Deep knowledge of Azure services (VMs, Firewall, EntralD, Application Gateway, Sentinel, Defender for Cloud, Azure Fabric, Al Foundry, Functions, Logic Apps, Front Door, App Service, Dev Box, Azure Migrate).
. Experience deploying solutions in AWS.
. Familiarity with FinOps tools (Flexera, Apptio, ProsperOps).
. Working knowledge of Al tools and services (GitHub Copilot, LLMs).
. Skilled in scripting languages (PowerShell, Bash, Python).
. Strong understanding of Ansible, Docker, Kubernetes.
. Experience with observability tools (Grafana, Azure Monitor, DataDog, New Relic) for SRE.
. Knowledge of security standards (CAF, CIS, SIEM, AlOps, DevSecOps).
. Solid Windows, Linux, and Microsoft 365 design and implementation.
. Expertise in networking, IAM, cloud security and governance.
. Active Directory and Azure AD (including hybrid integration).
. Proven experience migrating databases (e.g., MS SQL).
About You
. Passionate about solving real-world business challenges using public cloud services.
. Customer-focused, committed to exceeding expectations.
. Collaborative and proactive in knowledge sharing.
. Able to balance priorities without compromising quality.
. Confident yet continuously seeking improvement.
Purpose
As Cloud DevOps Lead, you will drive the design, implementation, and optimization of cloud infrastructure and DevOps practices across the organization. This role blends hands-on technical delivery with leadership, ensuring secure, scalable, and resilient platforms that enable rapid, high-quality software delivery. You'll provide technical advice and support for cloud engineers, CI/D automation, container orchestration, and platform reliability, while coaching teams to adopt modern engineering and automation practices.

Many thanks
Regards


Diletta Tovo
Senior Recruitment Manager
COMXPS Ltd

Mobile: 07510979307
Diletta.Tovo@comxps.com
www.comxps.com`,
        "from": "Information COMXPS <information@comxps.com>",
        "email": "information@comxps.com",
        "threadId": "real-test-thread-id-999"
    },
    "webhookUrl": webhookUrl,
    "executionMode": "production"
};

async function triggerWebhook() {
    try {
        console.log('🚀 Sending Specific Test Email Payload to n8n...');
        const response = await axios.post(webhookUrl, payload);
        console.log(`✅ Webhook Triggered! Status: ${response.status}`);
        console.log('Response:', response.data);
    } catch (error) {
        console.error('❌ Webhook Failed:', error.response ? error.response.data : error.message);
    }
}

triggerWebhook();
