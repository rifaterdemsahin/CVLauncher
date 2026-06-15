# CLAUDE.md

Guidance for working in the **CVLauncher** repo — a collection of CV variations
(plus an n8n recruiter auto-reply pipeline and a fly.io web viewer) for Rifat Erdem Sahin.

## Repository layout

The project uses a seven-folder architecture (see `README.md` for the full description):

- `1_Real/` — objectives / OKRs
- `2_Environment/` — roadmap, use cases, deployment reports
- `3_UI/` — knowledge base, UI assets
- `4_Formula/` — guides & best practices (incl. PDF-generation and deployment docs)
- `5_Symbols/` — **core source code and CVs**
- `6_Semblance/` — error logs and solutions
- `7_Testing/` — validation, test plans

## CV authoring rules (IMPORTANT)

- **All CVs live in `5_Symbols/cvs/`.** Both the Markdown source (`.md`) and the
  generated `.pdf` go in this folder, side by side, with the **same base name**.
  Do not scatter CV files into other folders (e.g. `2_Environment/` holds CV
  *reports/links*, not CVs).
- **Naming:** `cv_<role_or_focus>.md` / `cv_<role_or_focus>.pdf`
  (e.g. `cv_kong_smart_cost_llm_orchestrator.md`).
- **Format:** match the existing CVs (`cv_technology_architect_databricks.md`,
  `source_Cv.md`) — H1 name, H2 title, a contact block, then
  Professional Summary → Core Competencies → Key Accomplishments →
  Technical Skills → Certifications/Education. Emoji section markers are used
  throughout and are expected.
- **Contact block** (keep consistent across CVs):
  London, UK · British · contact@rifaterdemsahin.com · +44 7848 024173 ·
  linkedin.com/in/rifaterdemsahin · github.com/rifaterdemsahin ·
  https://rifaterdemsahin.com · https://calendly.com/rifaterdem/schedule

## Generating the PDF

The CVs use emoji, which `pdflatex`/`xelatex` cannot embed (only
`Apple Color Emoji`, a bitmap font, is available locally). **Render via Chrome
headless** so emoji appear in full color:

```bash
# 1. Markdown -> styled, self-contained HTML
pandoc 5_Symbols/cvs/<name>.md -s --embed-resources -c <style.css> -o /tmp/cv.html

# 2. HTML -> PDF with Chrome (renders color emoji correctly)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="5_Symbols/cvs/<name>.pdf" "file:///tmp/cv.html"
```

(`pandoc ... --pdf-engine=xelatex` also produces a valid PDF but drops every emoji
to blank — prefer the Chrome route.) See `4_Formula/pdf_generation_process.md`.

## Conventions

- Commit/push only when asked. Existing history commits directly to `main`.
- End commit messages with the `Co-Authored-By: Claude` trailer.
- "open local" / preview a URL → open in **Google Chrome** (`open -a "Google Chrome" <url>`).
