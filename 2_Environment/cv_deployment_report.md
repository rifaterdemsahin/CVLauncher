# CV Launcher Deployment Report

## 🚀 Overview
The CV Launcher project has been successfully deployed as a rapid, lightweight static site hosted on **Fly.io** using a highly optimized **Nginx (Alpine)** implementation. This architectural choice prevents unnecessary processing overhead and ensures both instantaneous file loading and robust caching natively handled by Fly's global edge network.

## 🏗️ Architecture & Configuration

### Directory Structure
```text
/Users/rifaterdemsahin/projects/CVLauncher/5_Symbols/cvs/
├── Dockerfile        # Defines the Alpine Nginx container and moves context
├── fly.toml          # Fly.io infrastructure configuration map
├── nginx.conf        # Nginx URL parsing and explicit proxy policies
└── public/           # Raw storage bin containing *.pdf & *.md CVs
    └── index.html    # Interactive Hub parsing and linking to all CVs
```

### Web Server Directives (Nginx)
The custom `nginx.conf` was designed to solve two core problems seamlessly:
1. **Implicit Routing**: Allows prettier routing. Calling `/cv_ai_engineer` resolves seamlessly to `cv_ai_engineer.pdf` or `.html` via the `$uri.pdf` catch-all directive.
2. **Forced Download Mechanism**: The `location ~* \.pdf$` header explicitly forces browsers to trigger an immediate download (`Content-Disposition "attachment";`), rather than hijacking the page using basic built-in PDF viewers.

### Docker Matrix
```dockerfile
# Core Stack
FROM nginx:alpine

# Injection
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY public /usr/share/nginx/html

# Exposing Standard HTTP protocol port mapped to Fly Edge
EXPOSE 80
```

## 🌍 Live Endpoints
The deployment spawned concurrently into two globally available Edge networks. You can route traffic to either:

| Scope | URL Endpoint | Status |
| :--- | :--- | :--- |
| **Primary Front Hub** | [https://cvs.fly.dev](https://cvs.fly.dev) | `Live` |
| **Direct Route Node** | [https://rifat-cvs.fly.dev](https://rifat-cvs.fly.dev) | `Live` |

> [!TIP]
> **Example Live Links:**
> * Home Hub: [https://cvs.fly.dev/](https://cvs.fly.dev/)
> * AI Engineer: [https://cvs.fly.dev/cv_ai_engineer.pdf](https://cvs.fly.dev/cv_ai_engineer.pdf) (Forces Download)

## 🔧 Maintenance Operations

If you update or add new CVs in the folder, updating the site takes seconds.
Run these commands from inside `/Users/rifaterdemsahin/projects/CVLauncher/5_Symbols/cvs`:

1. Move the new CV into `/public`: 
   ```bash
   mv my-new-cv.pdf public/
   ```
2. Parse the new hub layout:
   ```bash
   python3 generate_index.py
   ```
3. Trigger Fly.io image synthesis:
   ```bash
   fly deploy
   ```
