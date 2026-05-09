# System Architecture Diagram

> This diagram shows the complete flow of the Auto-Reply System for info@pexabo.com.
> Render this file with any Mermaid-compatible viewer (GitHub, VS Code, Mermaid Live Editor).

---

## Diagram 1: High-Level Architecture

```mermaid
flowchart TB
    subgraph INPUT["Email Sources"]
        G1["Gmail Inbox"]
        G2["Gmail Labels"]
        G3["Manual URL Paste"]
    end

    subgraph TRIGGER["Triggers"]
        T1["Schedule Trigger<br/>Every 6 Hours"]
        T2["Webhook Trigger<br/>Process Single Email"]
    end

    subgraph PROCESS["Processing Pipeline"]
        P1["Find Lost Emails<br/>Gmail API Query"]
        P2["Check Thread History<br/>Reply Detection"]
        P3["Check Tracker Sheet<br/>Deduplication"]
        P4["Classify Intent<br/>OpenAI GPT-4o"]
        P5{"Route Decision"}
    end

    subgraph RECRUITER["Recruiter Pipeline"]
        R1["Select Best CV<br/>Keyword Matching"]
        R2["Call CV Response Generator<br/>rifat-cvs-response-generator.fly.dev"]
        R3["Multi-Model Fallback<br/>Gemini > GPT-4o > Groq > Claude"]
        R4["Format Recruiter Email<br/>HTML Template + CV Link"]
    end

    subgraph GENERAL["General Pipeline"]
        N1["Load Tactic<br/>tactics-template.md"]
        N2["Draft Reply<br/>OpenAI / Gemini / Groq"]
        N3["Multi-Model Fallback<br/>GPT-4o > Gemini > Groq"]
    end

    subgraph FLYIO["Fly.io Complex Tasks"]
        F1["pexabo-email-brain<br/>Fastify Service"]
        F2["Calendar / Quote / PDF"]
    end

    subgraph OUTPUT["Actions"]
        A1["Send Gmail Reply"]
        A2["Mark as Replied<br/>Label + Archive"]
        A3["Log to Tracker<br/>Google Sheets"]
        A4["Notify Telegram"]
    end

    subgraph FIX["Missed Email Fix"]
        X1["Generate Fix Prompt<br/>AI Analysis"]
        X2["Save to investigations/"]
        X3["Update Workflow<br/>Query / Tactic Fix"]
    end

    G1 --> T1
    G2 --> T1
    G3 --> T2
    T1 --> P1
    T2 --> P1
    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 --> P5

    P5 -->|recruiter_job_offer| R1
    P5 -->|general_email| N1
    P5 -->|needs_human| F1
    P5 -->|low_confidence| F1

    R1 --> R2
    R2 --> R3
    R3 --> R4
    R4 --> A1

    N1 --> N2
    N2 --> N3
    N3 --> A1

    F1 --> F2
    F2 --> A1

    A1 --> A2
    A2 --> A3
    A3 --> A4

    G3 -.-> X1
    X1 --> X2
    X2 --> X3
    X3 -.-> P1
```

---

## Diagram 2: Batch Mode Flow (Every 6 Hours)

```mermaid
flowchart LR
    START(["Schedule Trigger<br/>0 */6 * * *"]) --> FETCH["Fetch Emails<br/>Gmail API"]
    FETCH --> FILTER1{"Already<br/>Replied?"}
    FILTER1 -->|Yes| SKIP1["Skip"]
    FILTER1 -->|No| FILTER2{"In<br/>Tracker?"}
    FILTER2 -->|Yes| SKIP2["Skip"]
    FILTER2 -->|No| CLASSIFY["Classify Intent<br/>OpenAI"]
    CLASSIFY --> ROUTE{"Intent?"}

    ROUTE -->|recruiter| RECRUIT["Recruiter Pipeline<br/>CV + Response Generator"]
    ROUTE -->|general| GENERAL["General Pipeline<br/>Tactics + AI"]
    ROUTE -->|complex| FLYIO["Fly.io<br/>pexabo-email-brain"]
    ROUTE -->|human_needed| LABEL["Label:<br/>needs_human_review"]

    RECRUIT --> SEND["Send Reply<br/>Gmail API"]
    GENERAL --> SEND
    FLYIO --> SEND

    SEND --> MARK["Mark Replied<br/>Label + Archive"]
    MARK --> LOG["Log to<br/>Tracker Sheet"]
    LOG --> NOTIFY["Telegram<br/>Notification"]
    NOTIFY --> END(["Done"])
    SKIP1 --> END
    SKIP2 --> END
    LABEL --> END
```

---

## Diagram 3: Individual Mode Flow (Manual URL)

```mermaid
flowchart LR
    START(["Paste Gmail URL"]) --> EXTRACT["Extract<br/>Message ID"]
    EXTRACT --> FETCH["Fetch Email<br/>Gmail API"]
    FETCH --> CHECK["Check Thread<br/>Already Replied?"]
    CHECK -->|Yes| SKIP["Skip +<br/>Log Analysis"]
    CHECK -->|No| CLASSIFY["Classify<br/>Intent"]
    CLASSIFY --> DRAFT["Draft Reply<br/>AI + Tactics"]
    DRAFT --> SHOW["Show Draft<br/>to User"]
    SHOW --> APPROVE{"Approve?"}
    APPROVE -->|No| SKIP
    APPROVE -->|Yes| SEND["Send Reply<br/>Gmail API"]
    SEND --> MARK["Mark Replied<br/>Label + Archive"]
    MARK --> FIX["Generate<br/>Fix Prompt"]
    FIX --> SAVE["Save to<br/>investigations/"]
    SAVE --> END(["Done"])
    SKIP --> FIX
```

---

## Diagram 4: Multi-Model Fallback Chain

```mermaid
flowchart TD
    START(["AI Request"]) --> PRIMARY{"Email<br/>Type?"}

    PRIMARY -->|recruiter| PG1["Primary:<br/>Gemini"]
    PRIMARY -->|general| PG2["Primary:<br/>GPT-4o"]

    PG1 -->|success| DONE1(["Use Response"])
    PG1 -->|fail| FB1["Fallback 1:<br/>GPT-4o"]
    FB1 -->|success| DONE1
    FB1 -->|fail| FB2["Fallback 2:<br/>Groq Llama-3"]
    FB2 -->|success| DONE1
    FB2 -->|fail| FB3["Fallback 3:<br/>Claude 3.5"]
    FB3 -->|success| DONE1
    FB3 -->|fail| ERR1["Route to<br/>Human Review"]

    PG2 -->|success| DONE2(["Use Response"])
    PG2 -->|fail| FB4["Fallback 1:<br/>Gemini Flash"]
    FB4 -->|success| DONE2
    FB4 -->|fail| FB5["Fallback 2:<br/>Groq Llama-3"]
    FB5 -->|success| DONE2
    FB5 -->|fail| ERR2["Route to<br/>Human Review"]

    ERR1 --> LOG["Log Error<br/>to Tracker"]
    ERR2 --> LOG
    LOG --> ALERT["Telegram<br/>Alert"]
```

---

## Diagram 5: Data Flow / Secrets

```mermaid
flowchart TB
    subgraph SECRETS["Doppler Vault<br/>pexabo-email-automation"]
        D1["GMAIL_CLIENT_ID"]
        D2["GMAIL_CLIENT_SECRET"]
        D3["GMAIL_REFRESH_TOKEN"]
        D4["OPENAI_API_KEY"]
        D5["GEMINI_API_KEY"]
        D6["GROQ_API_KEY"]
        D7["ANTHROPIC_API_KEY"]
        D8["N8N_API_KEY"]
        D9["TELEGRAM_BOT_TOKEN"]
    end

    subgraph SERVICES["External Services"]
        S1["Gmail API"]
        S2["OpenAI API"]
        S3["Google AI Studio<br/>Gemini"]
        S4["Groq API"]
        S5["Anthropic API<br/>Claude"]
        S6["Telegram API"]
        S7["Google Sheets API"]
    end

    subgraph APPS["Our Applications"]
        A1["n8n Workflow<br/>n8n.rifaterdemsahin.com"]
        A2["Node.js Scripts<br/>process-specific-email.js"]
        A3["Fly.io Service<br/>pexabo-email-brain.fly.dev"]
        A4["CV Generator<br/>rifat-cvs-response-generator.fly.dev"]
    end

    D1 --> A1
    D2 --> A1
    D3 --> A1
    D4 --> A1
    D5 --> A1
    D6 --> A1
    D8 --> A1

    D1 --> A2
    D2 --> A2
    D3 --> A2
    D4 --> A2
    D5 --> A2

    D4 --> A3
    D5 --> A3

    D9 --> A1
    D9 --> A3

    A1 --> S1
    A1 --> S2
    A1 --> S3
    A1 --> S4
    A1 --> S6
    A1 --> S7

    A2 --> S1
    A2 --> S2
    A2 --> S3

    A3 --> S2
    A3 --> S3
    A3 --> S5

    A4 --> S3
```

---

## Diagram 6: Folder Structure

```mermaid
flowchart TD
    ROOT["Auto-Reply info@pexabo.com/"] --> PLAN["PLAN.md"]
    ROOT --> README["README.md"]
    ROOT --> PREREQ["prerequisites.md"]
    ROOT --> TASKS["tasks.md"]
    ROOT --> WORKFLOW["workflow-design.md"]
    ROOT --> DOPPLER["doppler-config.md"]
    ROOT --> FLYIO["fly-io-services.md"]
    ROOT --> TACTICS["tactics-template.md"]
    ROOT --> FIXTEMP["missed-email-fix-template.md"]
    ROOT --> CHECKLIST["execution-checklist.md"]
    ROOT --> MERMAID["architecture-diagram.md<br/>This file"]
    ROOT --> IMPL["implementation-steps.md"]

    ROOT --> SCRIPTS["scripts/"]
    SCRIPTS --> S1["gmail-query-builder.js"]
    SCRIPTS --> S2["n8n-workflow-updater.js"]
    SCRIPTS --> S3["mark-replied.js"]
    SCRIPTS --> S4["process-specific-email.js"]

    ROOT --> INVEST["investigations/"]
    INVEST --> I1["missed_email_YYYY-MM-DD_*.md"]

    ROOT --> BACKUPS["backups/"]
    BACKUPS --> B1["workflow-YYYY-MM-DD.json"]
```

---

## Rendering Notes (Fail-Safe)

These diagrams use **Mermaid syntax** that is compatible with:

- **GitHub** (renders automatically in `.md` files)
- **VS Code** (with Mermaid extension)
- **Mermaid Live Editor** (https://mermaid.live)
- **Notion** (paste as code block)
- **Obsidian** (with Mermaid plugin)

### Fail-Safe Formatting Rules Applied:

1. **No Unicode in node IDs** — Only ASCII letters, numbers, underscores
2. **No special characters in labels** — Uses `<br/>` for line breaks, not `\n`
3. **Simple arrow types** — Only `-->` and `-.->` (no complex arrowheads)
4. **Subgraphs with quoted names** — `"Name with spaces"` for safety
5. **No `graph` keyword conflicts** — Uses `flowchart` instead of `graph`
6. **Comments in code blocks** — Separated from Mermaid syntax
7. **No emojis in node text** — Plain text only inside diagrams

If a renderer fails, paste the code into https://mermaid.live for guaranteed rendering.

---

*Last updated: 2026-05-09*
