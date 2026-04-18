# CV Launcher & Recruiter Agent

This project provides a centralized dashboard for managing CVs and an AI-powered agent to help respond to recruiters.

## Features

- **CV Manager**: View and manage multiple versions of your CV.
- **Recruiter AI Agent**: Paste a recruiter's message and get a professional, tailored response using xAI (Grok).

## Live Links

- **Main Dashboard**: [https://cv-launcher.fly.dev/](https://cv-launcher.fly.dev/)
- **Recruiter Agent**: [https://cv-launcher.fly.dev/recruiter](https://cv-launcher.fly.dev/recruiter)

## Deployment

This app is deployed on **Fly.io** and uses **Doppler** for secrets management.

### Prerequisites

- [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/)
- [Doppler CLI](https://docs.doppler.com/docs/install-cli)

### Commands

```bash
# Setup Doppler (if not already done)
doppler setup

# Run locally
npm install
npm start

# Deploy to Fly.io
doppler run -- flyctl deploy
```

---
Built with ❤️ by Rifat Erdem Sahin
