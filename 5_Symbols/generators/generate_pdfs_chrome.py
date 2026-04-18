import os
import subprocess
import markdown

directory = '/Users/rifaterdemsahin/projects/CVLauncher/5_Symbols/cvs/public'
chrome_path = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

css = """
<style>
    @page { margin: 1in; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #333; }
    h1, h2, h3 { color: #111; }
    h1 { font-size: 24pt; border-bottom: none; margin-bottom: 0.2em; }
    h2 { font-size: 14pt; margin-top: 1.5em; border-bottom: 1px solid #ddd; padding-bottom: 3px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    hr { border: none; border-top: 1px solid #eee; margin: 1.5em 0; }
    ul { padding-left: 20px; }
    li { margin-bottom: 4px; }
    p { margin-bottom: 1em; }
    strong { color: #000; }
    a { color: #0366d6; text-decoration: none; }
</style>
"""

files = [f for f in os.listdir(directory) if f.startswith('cv_') and f.endswith('.md')]

for filename in files:
    md_path = os.path.join(directory, filename)
    html_path = os.path.join(directory, filename.replace('.md', '.html'))
    pdf_path = os.path.join(directory, filename.replace('.md', '.pdf'))
    
    with open(md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()
    
    # Convert markdown to html
    html_content = markdown.markdown(md_text, extensions=['extra', 'smarty'])
    
    # Wrap in HTML body with CSS
    full_html = f"<!DOCTYPE html><html><head><meta charset='UTF-8'>{css}</head><body>{html_content}</body></html>"
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(full_html)
        
    print(f"Generating PDF for {filename}...")
    # Invoke Google Chrome headless
    cmd = [
        chrome_path, 
        "--headless", 
        "--disable-gpu", 
        f"--print-to-pdf={pdf_path}", 
        "--no-pdf-header-footer",
        html_path
    ]
    
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError as e:
        print(f"Error generating PDF for {filename}: {e}")
        continue
        
    # Clean up HTML file if it's not cv_ai_engineer.html (since that one existed before)
    if filename != 'cv_ai_engineer.md':
        os.remove(html_path)

print(f"Generated {len(files)} PDFs.")
