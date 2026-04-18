import os
import re

PUBLIC_DIR = "/Users/rifaterdemsahin/projects/CVLauncher/5_Symbols/cvs/public"
OUTPUT_HTML = os.path.join(PUBLIC_DIR, "index.html")

def format_title(filename):
    # Remove extension
    name = os.path.splitext(filename)[0]
    # Remove 'cv_' prefix if present
    if name.startswith('cv_'):
        name = name[3:]
    # Replace underscores with spaces and title case
    return name.replace('_', ' ').title()

def generate_html():
    files = [f for f in os.listdir(PUBLIC_DIR) if f.endswith('.pdf')]
    files.sort()
    
    cv_cards = ""
    for f in files:
        title = format_title(f)
        full_url = f"https://rifat-cvs.fly.dev/{f}"
        cv_cards += f"""
            <div class="card-wrapper">
                <a href="/{f}" class="card" target="_blank">
                    <div class="card-icon">📄</div>
                    <div class="card-content">
                        <h3>{title}</h3>
                        <p>PDF Document</p>
                    </div>
                    <div class="card-action">↓</div>
                </a>
                <button class="copy-btn" data-url="{full_url}" title="Copy link">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    Copy Link
                </button>
            </div>
        """

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV Repository | Rifat Erdem Sahin</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg-color: #0f172a;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --card-bg: rgba(30, 41, 59, 0.7);
            --card-border: rgba(255, 255, 255, 0.1);
            --primary: #3b82f6;
            --primary-glow: rgba(59, 130, 246, 0.5);
        }}
        
        body {{
            background-color: var(--bg-color);
            color: var(--text-main);
            font-family: 'Outfit', sans-serif;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            background-image: 
                radial-gradient(at 0% 0%, rgba(15, 23, 42, 1) 0, transparent 50%), 
                radial-gradient(at 50% 0%, rgba(30, 58, 138, 0.4) 0, transparent 50%), 
                radial-gradient(at 100% 0%, rgba(15, 23, 42, 1) 0, transparent 50%);
        }}

        .container {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 4rem 2rem;
        }}

        header {{
            text-align: center;
            margin-bottom: 4rem;
            animation: fadeInDown 0.8s ease-out;
        }}

        h1 {{
            font-size: 3.5rem;
            font-weight: 600;
            margin: 0 0 1rem 0;
            background: linear-gradient(to right, #60a5fa, #a78bfa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}

        p.subtitle {{
            color: var(--text-muted);
            font-size: 1.2rem;
            font-weight: 300;
            max-width: 600px;
            margin: 0 auto;
        }}

        .grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
            animation: fadeIn 1s ease-out 0.2s both;
        }}

        .card-wrapper {{
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }}

        .card {{
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 16px;
            padding: 1.5rem;
            display: flex;
            align-items: center;
            text-decoration: none;
            color: var(--text-main);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }}

        .card:hover {{
            transform: translateY(-3px);
            border-color: var(--primary);
            box-shadow: 0 10px 30px -10px var(--primary-glow);
            background: rgba(30, 41, 59, 0.9);
        }}

        .card-icon {{
            font-size: 2rem;
            margin-right: 1.2rem;
            background: rgba(255,255,255,0.05);
            padding: 12px;
            border-radius: 12px;
        }}

        .card-content {{
            flex: 1;
        }}

        .card-content h3 {{
            margin: 0 0 0.4rem 0;
            font-size: 1.1rem;
            font-weight: 600;
        }}

        .card-content p {{
            margin: 0;
            font-size: 0.85rem;
            color: var(--text-muted);
            font-weight: 300;
        }}

        .card-action {{
            color: var(--primary);
            font-size: 1.2rem;
            opacity: 0;
            transform: translateX(-10px);
            transition: all 0.3s ease;
        }}

        .card:hover .card-action {{
            opacity: 1;
            transform: translateX(0);
        }}

        .copy-btn {{
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            color: var(--primary);
            border-radius: 10px;
            padding: 0.5rem 1rem;
            font-family: 'Outfit', sans-serif;
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.4rem;
            transition: all 0.2s ease;
            width: 100%;
        }}

        .copy-btn:hover {{
            background: rgba(59, 130, 246, 0.2);
            border-color: var(--primary);
            transform: translateY(-1px);
        }}

        .copy-btn.copied {{
            background: rgba(52, 211, 153, 0.15);
            border-color: #34d399;
            color: #34d399;
        }}

        @keyframes fadeInDown {{
            from {{ opacity: 0; transform: translateY(-20px); }}
            to {{ opacity: 1; transform: translateY(0); }}
        }}

        @keyframes fadeIn {{
            from {{ opacity: 0; }}
            to {{ opacity: 1; }}
        }}

        @media (max-width: 768px) {{
            h1 {{ font-size: 2.5rem; }}
            .container {{ padding: 2rem 1rem; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Professional CVs</h1>
            <p class="subtitle">Select a tailored professional profile to instantly download the corresponding PDF resume.</p>
        </header>

        <div class="grid">
            {cv_cards}
        </div>
    </div>
    <script>
        document.querySelectorAll('.copy-btn').forEach(btn => {{
            btn.addEventListener('click', async () => {{
                const url = btn.dataset.url;
                const svgCopy = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
                const svgCheck = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                try {{
                    await navigator.clipboard.writeText(url);
                }} catch (e) {{
                    const ta = document.createElement('textarea');
                    ta.value = url;
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                }}
                btn.classList.add('copied');
                btn.innerHTML = svgCheck + ' Copied!';
                setTimeout(() => {{
                    btn.classList.remove('copied');
                    btn.innerHTML = svgCopy + ' Copy Link';
                }}, 2000);
            }});
        }});
    </script>
</body>
</html>
"""
    with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Index HTML generated with {len(files)} links.")

if __name__ == "__main__":
    generate_html()
