# Reply Tactics Template

## How to Use This File

1. For each type of email you receive, create a **Tactic**
2. A Tactic = Trigger conditions + Reply style + Special instructions
3. Update this file as you provide feedback
4. The AI loads these tactics when drafting replies

---

## Tactic Format

```yaml
- id: unique_snake_case_id
  name: Human-readable name
  description: When to use this tactic
  triggers:
    keywords: [word1, word2]
    patterns: [regex1, regex2]
    intents: [pricing_inquiry, partnership]
  priority: 1-10 (higher = check first)
  instructions: |
    Write the reply following these rules...
  signature: |
    Best regards,
    Rifat Erdem Sahin
    Director | Pexabo
  variables:
    - name: service_name
      description: The service they asked about
    - name: urgency
      description: How urgent their request is
  examples:
    - input: "Can you help with DevOps?"
      output: "Yes, we specialize in DevOps..."
  donts:
    - Never promise fixed timelines without checking
    - Never share internal rates publicly
```

---

## TACTICS (Fill in as needed)

### Tactic 1: General Inquiry

```yaml
- id: general_inquiry
  name: General Business Inquiry
  description: Default tactic for any email to info@pexabo.com that doesn't match other tactics
  triggers:
    intents: [other, general]
    fallback: true
  priority: 1
  instructions: |
    Thank them for contacting Pexabo.
    Acknowledge their message.
    Ask 1-2 clarifying questions to understand their needs.
    Offer a 15-minute intro call.
    Keep it under 150 words.
  signature: |
    Best regards,
    Rifat Erdem Sahin
    Director | DevOps & Cloud Architecture | Pexabo
    +44 7848 024173 | contact@rifaterdemsahin.com
    LinkedIn: linkedin.com/in/rifaterdemsahin
  examples:
    - input: "Hi, I found your company online and wanted to learn more."
      output: |
        Hi there,

        Thank you for reaching out to Pexabo! We'd love to learn more about what you're looking for.

        Could you share a bit about your current project or challenge? Are you looking for cloud architecture, DevOps automation, or AI integration?

        I'm happy to jump on a quick 15-minute call to explore how we can help.

        Best regards,
        Rifat Erdem Sahin
        ...
```

### Tactic 2: Pricing Inquiry

```yaml
- id: pricing_inquiry
  name: Pricing or Quote Request
  description: When someone asks for rates, pricing, or a quote
  triggers:
    keywords: [price, pricing, quote, rate, cost, budget, how much, hourly, day rate]
    intents: [pricing_inquiry]
  priority: 8
  instructions: |
    Acknowledge their interest.
    Explain that pricing depends on scope, duration, and tech stack.
    Ask for key details: project scope, timeline, team size, location (remote/hybrid/onsite).
    Mention that we offer both daily rates and fixed-price project quotes.
    Do NOT give specific numbers without context.
    Offer a discovery call to scope the work.
  signature: |
    Best regards,
    Rifat Erdem Sahin
    Director | Pexabo
    +44 7848 024173 | contact@rifaterdemsahin.com
  variables:
    - name: service_type
      description: What they want priced (DevOps, Cloud Migration, AI, etc.)
    - name: engagement_type
      description: Contract vs permanent vs project-based
  examples:
    - input: "What is your day rate for DevOps consulting?"
      output: |
        Hi,

        Thank you for your interest in our DevOps services.

        Our rates vary based on the scope, duration, and complexity of the engagement. To give you an accurate quote, could you share:
        - Project scope and tech stack
        - Expected duration
        - Location requirements (remote/hybrid/onsite)
        - Team size and structure

        I'd be happy to schedule a brief discovery call to understand your needs and provide a tailored proposal.

        Best regards,
        Rifat Erdem Sahin
        ...
```

### Tactic 3: Partnership / Collaboration

```yaml
- id: partnership
  name: Partnership or Collaboration Request
  description: When agencies, recruiters, or other businesses want to partner
  triggers:
    keywords: [partner, partnership, collaborate, collaboration, agency, subcontract, white label, referral]
    intents: [partnership]
  priority: 7
  instructions: |
    Thank them for the partnership interest.
    Ask about their typical projects, clients, and tech focus.
    Mention that we collaborate with select agencies on Azure, AWS, and AI projects.
    Request a brief intro call or their partnership deck.
    Be warm but professional.
  signature: |
    Best regards,
    Rifat Erdem Sahin
    Director | Pexabo
    +44 7848 024173 | contact@rifaterdemsahin.com
  examples:
    - input: "We are an agency looking for DevOps subcontractors."
      output: |
        Hi,

        Thank you for reaching out. We do work with select agency partners on cloud and DevOps projects.

        Could you share a bit about your client base, typical project types, and the tech stacks you most often work with?

        If there's a good fit, I'd love to set up a quick call to explore how we might collaborate.

        Best regards,
        Rifat Erdem Sahin
        ...
```

### Tactic 4: Job Application (Not for Me)

```yaml
- id: job_application_incoming
  name: Someone Applying to Work at Pexabo
  description: When a candidate sends their CV wanting to join Pexabo
  triggers:
    keywords: [cv, resume, apply, application, job seeker, looking for role, hire me]
    intents: [job_application]
    from_pattern: "(?!.*rifaterdemsahin).*"  # Not from me
  priority: 6
  instructions: |
    Thank them for their interest.
    Explain that Pexabo is currently a solo consultancy and not hiring.
    Offer to keep their details on file for future subcontracting opportunities.
    Be encouraging but clear.
  signature: |
    Best regards,
    Rifat Erdem Sahin
    Director | Pexabo
  examples:
    - input: "I am a junior DevOps engineer, can I join your company?"
      output: |
        Hi,

        Thank you for your interest in Pexabo.

        At the moment, Pexabo operates as a solo consultancy, so we don't have open positions. However, I occasionally collaborate with specialists on larger projects.

        I'd be happy to keep your details on file for any future opportunities. Feel free to connect on LinkedIn as well.

        Best wishes with your search.

        Best regards,
        Rifat Erdem Sahin
        ...
```

### Tactic 5: Support Request

```yaml
- id: support_request
  name: Existing Client Support
  description: When an existing client needs help with a delivered solution
  triggers:
    keywords: [issue, bug, error, broken, not working, help, urgent, problem, support]
    intents: [support_request]
  priority: 9
  instructions: |
    Acknowledge the issue immediately.
    Ask for error logs, screenshots, or steps to reproduce.
    Give an estimated response time (e.g., "I'll investigate within 4 hours").
    If it's critical (production down), offer an emergency call.
    Reassure them that we stand behind our work.
  signature: |
    Best regards,
    Rifat Erdem Sahin
    Director | Pexabo
    +44 7848 024173 | contact@rifaterdemsahin.com
  examples:
    - input: "The pipeline you built is failing."
      output: |
        Hi,

        I'm sorry to hear the pipeline is having issues. Let me look into this right away.

        To help me diagnose quickly, could you share:
        - The error message or log snippet
        - When it last worked successfully
        - Any recent changes to the environment

        If this is blocking production, I'm available for an emergency call within the hour.

        Best regards,
        Rifat Erdem Sahin
        ...
```

### Tactic 6: Recruiter / Job Offer

```yaml
- id: recruiter_job_offer
  name: Recruiter Job Opportunity
  description: When a recruiter or hiring manager sends a job opportunity, contract, or role inquiry
  triggers:
    keywords: [opportunity, role, contract, position, hiring, cv, resume, job, "send cv", vacancy, rate, day rate, inside ir35, outside ir35, umbrella, ltd, contract role, permanent, "we are looking", "client is looking", "immediate start", "interview this week"]
    intents: [recruiter_job_offer]
    from_patterns: ["recruitment", "consulting", "solutions", "talent", "resourcing"]
  priority: 9
  instructions: |
    This tactic is handled by the RECRUITER RESPONSE GENERATOR pipeline.
    
    1. CV SELECTION: Pick the best CV based on job keywords (Azure, AWS, Kubernetes, Security, Data, AI)
    2. GENERATE RESPONSE: Call https://rifat-cvs-response-generator.fly.dev/recruiter with:
       - recruiter_message: full email body
       - cv_source_url: GitHub raw URL of selected CV
       - ai_provider: gemini (primary), gpt4o (fallback), groq (fallback 2)
    3. The generator returns a response that cites specific evidence from the CV
    4. FORMAT: Wrap the generated response in the standard recruiter email template with CV download link and Calendly
    5. DO NOT manually draft the response — always use the generator for recruiter emails
    
    Only skip generator if:
    - Generator is down AND all fallback models failed
    - Email is clearly spam (use spam tactic instead)
    - Email is from a blacklisted agency
  signature: |
    Best regards,
    Rifat Erdem Sahin
    Director | DevOps & Cloud Architect | Pexabo
    +44 7848 024173 | contact@rifaterdemsahin.com
    LinkedIn: linkedin.com/in/rifaterdemsahin
  variables:
    - name: selected_cv
      description: PDF filename of the matched CV
    - name: tech_stack
      description: Tech stack matched from job description
    - name: rate_expectation
      description: Day rate range if mentioned by recruiter
  examples:
    - input: "We have an Azure Architect role, outside IR35, £650/day. Can you send your CV?"
      output: |
        Hi,

        Thank you for reaching out regarding the Azure Architect position.

        With extensive experience designing enterprise Azure landing zones and implementing Infrastructure as Code with Terraform and Bicep, I believe I would be a strong fit for this role. My recent work includes migrating a 500+ server estate to Azure with zero downtime.

        [CV LINK + CALENDLY]

        Best regards,
        Rifat Erdem Sahin
        ...
```

### Tactic 7: Spam / Unwanted

```yaml
- id: spam_or_unwanted
  name: Spam or Unwanted Outreach
  description: Clear spam, cold sales, or irrelevant mass emails
  triggers:
    keywords: [seo, web design, cheap, viagra, loan, crypto, nft, guaranteed]
    intents: [spam]
    from_domains: ["known-spam-domain.com"]
  priority: 10
  instructions: |
    Do NOT reply.
    Mark as spam in Gmail.
    Log to tracker with status=spam.
  auto_action: mark_spam
```

---

## ADD YOUR TACTICS BELOW

When you share an email link and tell me how you want it replied, I will:
1. Analyze the email
2. Create a new tactic or update an existing one
3. Test it
4. Confirm with you before deploying

### Tactic 7: [Your Custom Tactic]

```yaml
- id: custom_tactic_1
  name: 
  description: 
  triggers:
    keywords: []
    intents: []
  priority: 5
  instructions: |
    
  signature: |
    
  examples:
    - input: ""
      output: |
        
```

---

## Feedback Log

| Date | Email ID | Tactic Used | Your Feedback | Action Taken |
|------|----------|-------------|---------------|--------------|
| | | | | |

---

*Last updated: 2026-05-09*
*Next: Fill in your custom tactics or share email links for me to analyze*
