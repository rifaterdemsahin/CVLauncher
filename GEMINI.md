# GEMINI.md

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
- **Never explain what a technical term is.** A CV lists skills/competencies —
  it does not define them. E.g. write `- Continuous Integration (CI)`, not
  `- Continuous Integration (CI) — building and testing pipelines`. This
  applies to role/company-specific sections too (e.g. a "Harness Platform
  Alignment" section lists the matching capabilities as bare items, it does
  not restate what each one means). (Fixed in `cv_devops_ai_engineer.md` on
  2026-08-11 — the "What Harness Does" section originally explained each
  term with an em-dash definition.)
- **Contact block** (keep consistent across CVs):
  London, UK · British · contact@rifaterdemsahin.com · +44 7848 024173 ·
  linkedin.com/in/rifaterdemsahin · github.com/rifaterdemsahin ·
  https://rifaterdemsahin.com · https://calendly.com/rifaterdem/schedule

## Generating the PDF (technical specification)

The CVs use emoji, which `pdflatex`/`xelatex` cannot embed (only
`Apple Color Emoji`, a bitmap font, is available locally). **Render via Chrome
headless** so emoji appear in full color:

```bash
# 1. Markdown -> styled, self-contained HTML
pandoc 5_Symbols/cvs/<name>.md -s --embed-resources -c 5_Symbols/cvs/cv_style.css -o /tmp/cv.html

# 2. HTML -> PDF with Chrome (renders color emoji correctly)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="5_Symbols/cvs/<name>.pdf" "file:///tmp/cv.html"
```

(`pandoc ... --pdf-engine=xelatex` also produces a valid PDF but drops every emoji
to blank — prefer the Chrome route.) See `4_Formula/pdf_generation_process.md`.

**CSS — always use `5_Symbols/cvs/cv_style.css`.** It is the only stylesheet meant
for print CVs (white background, dark text, proper heading hierarchy). Do **not**
pass `5_Symbols/response_generator/styles.css` (or `5_Symbols/styles.css`) to
`pandoc -c` — that file styles the web-app card gallery (purple gradient body,
white "cards", drop shadows) and renders an unreadable purple-background PDF when
applied to a plain document. This mistake happened once (2026-08-05, FDE CV) —
if a generated CV PDF has a colored/gradient background, this is the cause.

**Markdown list gotcha — always put a blank line before a `- ` bullet list.**
Pandoc's default markdown reader does *not* treat `- ` lines as a list unless
they're preceded by a blank line; without it, pandoc silently flattens the
list into one paragraph with literal ` - ` separators (no bullets, no `<ul>`).
This bit every CV that follows the `**Bold subheading**` immediately followed
by `- item` pattern (fixed in `source_Cv.md` and all `cv_*.md` on 2026-08-05).
Always write:

```markdown
**Subheading**

- item one
- item two
```

not:

```markdown
**Subheading**
- item one
- item two
```

**Markdown line-wrap gotcha — multi-line skills/label blocks need hard breaks.**
A run of lines like `**Category:** item, item` with no blank line between them
is one markdown *paragraph* — pandoc renders each single `\n` as a space, not
a line break, so consecutive category lines collapse into one run-on line
(e.g. "...Traefik Linux & Platform Hardening:..." with no visible separation).
Fix by ending every line except the last with two trailing spaces (a markdown
hard break), matching the convention already used in the CV contact block:

```markdown
**Category A:** item, item, item  
**Category B:** item, item, item  
**Category C:** item, item, item
```

(fixed in `cv_senior_devops_nginx_engineer.md` and
`cv_platform_security_engineer.md` on 2026-08-06 — found because it makes a
Skills section unreadable, not because it errors).

**Verifying before committing:** render the HTML and screenshot it (or open the
PDF) before pushing — don't assume the CSS/list/line-break output is correct
un-inspected:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --window-size=1000,1400 \
  --screenshot=/tmp/cv_preview.png "file:///tmp/cv.html"
```

## Conventions

- Commit/push only when asked. Existing history commits directly to `main`.
- End commit messages with the `Co-Authored-By: Claude` trailer (kept consistent across tools).
- "open local" / preview a URL → open in **Google Chrome** (`open -a "Google Chrome" <url>`).
