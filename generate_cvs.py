#!/usr/bin/env python3
"""
CV Generator Script
Updates all CV markdown files based on the AI Engineer template
"""

import os
import glob

# Define the base template structure
def get_cv_template(role_title, role_subtitle, summary, competencies, accomplishments):
    return f"""# RIFAT ERDEM SAHIN
## {role_title} | {role_subtitle}

---

**📍 Location:** London, United Kingdom  
**🇬🇧 Citizenship:** British  
**✉️ Email:** contact@rifaterdemsahin.com  
**📞 Phone:** +44 7848 024173  
**🔗 LinkedIn:** linkedin.com/in/rifaterdemsahin  
**💻 GitHub:** github.com/rifaterdemsahin  
**🌐 Portfolio:** https://rifaterdemsahin.com  
**📅 Schedule a Call:** https://calendly.com/rifaterdem/schedule

---

## PROFESSIONAL SUMMARY

{summary}

---

## CORE COMPETENCIES

{competencies}

---

## KEY ACCOMPLISHMENTS

{accomplishments}

---

## PROFESSIONAL EXPERIENCE HIGHLIGHTS

**Senior {role_title} / Technical Lead** | 2020 - Present  
*Goldman Sachs, Ypsomed, Cushman & Wakefield*

- Led {role_title.lower()} initiatives across finance, healthcare, and real estate sectors
- Designed and implemented solutions supporting millions of daily transactions
- Established best practices and automated frameworks
- Mentored engineering teams on modern technologies and practices
- Delivered solutions achieving 300% improvement in operational efficiency

**{role_title}** | 2016 - 2020  
*Microsoft, Emerson, Various Fortune 500*

- Built enterprise solutions for digital transformation initiatives
- Led cross-functional teams designing scalable applications
- Established frameworks and implementation strategies
- Evangelized modern technologies through technical leadership

---

## EDUCATION

🎓 **Bachelor of Science**  
Southern New Hampshire University, USA 🇺🇸 | 2013

---

## CERTIFICATIONS & CONTINUOUS LEARNING

📜 **Microsoft Certified Solutions Architect Expert**  
📜 **AWS Certified Solutions Architect Professional**  
📜 **Azure Solutions Architect Expert**  
📜 **Certified Kubernetes Administrator (CKA)**  

**Continuous Learning:**  
- Active contributor to open-source projects
- Regular participant in technical communities
- Following latest developments in technology
- Experimenting with emerging tools and practices

---

## SECURITY CLEARANCES

🔒 **UK SC (Security Check)** - Valid until 2028  
🔒 **NATO Clearance** - Valid until 2029  
✓ **Background Checks:** Watchdog (2024), Sterling (2019)

---

## AVAILABILITY & CONTACT

**Immediate Availability** for {role_title.lower()} roles

📅 **Schedule a Discussion:** https://calendly.com/rifaterdem/schedule  
📧 **Email:** contact@rifaterdemsahin.com  
📞 **Phone:** +44 7848 024173  

---

## SUPPORTING DOCUMENTS

📄 **Download Full CV (PDF):**  
https://rifaterdemsahin.com/wp-content/uploads/2025/05/erdem-sahin-cv_summary_2025_may.pdf

📄 **Download Full CV (Word):**  
https://rifaterdemsahin.com/wp-content/uploads/2025/05/erdem-sahin-cv_summary_2025_may.docx

📊 **Technical Portfolio & Presentations:**  
https://rifaterdemsahin.com/wp-content/uploads/2025/02/rifaterdemsahinprofilepresentation.v2025.2.pdf

---

*References and detailed project portfolios available upon request*"""

# Comprehensive CV role definitions
cv_roles = {
    "cv_aws_architect.md": {
        "title": "AWS Architect",
        "subtitle": "Amazon Web Services Solutions Expert", 
        "summary": "Senior AWS Architect specializing in **cloud architecture design, migration strategies, and AWS-native solutions**. Deep expertise in designing and implementing enterprise-scale AWS infrastructure supporting mission-critical applications. Proven track record building AWS platforms that delivered 300% productivity improvements and 30% cost reductions across financial services, healthcare, and real estate sectors. Expert in AWS Well-Architected Framework and cloud-native architectures.",
        "competencies": """☁️ **AWS Cloud Architecture**
- End-to-end AWS solution design and implementation
- Multi-region and multi-account AWS architectures
- Serverless and container-based AWS architectures
- Cost optimization and AWS resource governance

🔧 **AWS Migration & Modernization**
- AWS migration strategies and implementation (6 Rs framework)
- Legacy application modernization on AWS
- Database migration with AWS DMS and SCT
- Hybrid cloud integration with AWS Direct Connect""",
        "accomplishments": """### 🏆 2024 | Goldman Sachs | Muscat, Oman
**Enterprise AWS Financial Platform**
- **Challenge:** Design resilient, compliant AWS architecture for global financial operations
- **Solution:** Architected multi-region AWS platform with automated disaster recovery and compliance
- **Impact:** 
  - 300% improvement in system reliability through redundant AWS architecture
  - 30% reduction in operational costs via AWS cost optimization
  - 99.99% uptime achievement with automated AWS failover
- **Technologies:** AWS EKS, Lambda, RDS, S3, CloudFormation, API Gateway, Route53"""
    },
    "cv_azure_architect.md": {
        "title": "Azure Architect",
        "subtitle": "Microsoft Azure Solutions Expert",
        "summary": "Senior Azure Architect specializing in **Azure cloud solutions, hybrid architectures, and enterprise integration**. Deep expertise in designing and implementing comprehensive Azure infrastructure supporting enterprise digital transformation. Proven track record building Azure platforms that delivered 300% productivity improvements and 30% cost reductions across financial services, healthcare, and real estate sectors. Expert in Azure Well-Architected Framework and Microsoft cloud ecosystem.",
        "competencies": """☁️ **Azure Cloud Architecture**
- Comprehensive Azure solution design and implementation
- Hybrid cloud architectures with Azure Arc and Stack
- Azure-native microservices and serverless architectures
- Azure governance, security, and compliance frameworks

🔧 **Azure Migration & Integration**
- Azure migration strategies and assessment frameworks
- Legacy system modernization with Azure PaaS services
- Azure DevOps and CI/CD pipeline implementation
- Microsoft 365 and Azure AD integration""",
        "accomplishments": """### 🏆 2024 | Goldman Sachs | Muscat, Oman
**Enterprise Azure Financial Platform**
- **Challenge:** Design secure, compliant Azure architecture for financial services operations
- **Solution:** Architected comprehensive Azure platform with advanced security and compliance controls
- **Impact:**
  - 300% improvement in deployment efficiency through Azure automation
  - 30% reduction in infrastructure costs via Azure optimization
  - Regulatory compliance achievement with Azure security frameworks
- **Technologies:** Azure AKS, Functions, Cosmos DB, Key Vault, Monitor, Synapse Analytics"""
    },
    "cv_gcp_architect.md": {
        "title": "GCP Architect",
        "subtitle": "Google Cloud Platform Solutions Expert",
        "summary": "Senior GCP Architect specializing in **Google Cloud solutions, data analytics, and AI/ML platforms**. Deep expertise in designing and implementing scalable GCP infrastructure supporting data-driven applications and machine learning workloads. Proven track record building GCP platforms that delivered 300% productivity improvements and 30% cost reductions across financial services, healthcare, and real estate sectors. Expert in Google Cloud's AI/ML services and data analytics capabilities.",
        "competencies": """☁️ **GCP Cloud Architecture**
- End-to-end Google Cloud solution design and implementation
- Multi-region GCP architectures with global load balancing
- GCP-native data analytics and AI/ML platforms
- Cloud-native application development with GCP services

📊 **GCP Data & AI Platforms**
- BigQuery data warehouse and analytics implementations
- AI Platform and AutoML model deployment
- Real-time data processing with Dataflow and Pub/Sub
- GCP security and identity management""",
        "accomplishments": """### 🏆 2024 | Goldman Sachs | Muscat, Oman
**GCP Data Analytics Platform**
- **Challenge:** Build scalable GCP platform for financial data analytics and ML workloads
- **Solution:** Architected comprehensive GCP data platform with real-time analytics and AI services
- **Impact:**
  - 300% improvement in data processing speed through GCP optimization
  - 30% reduction in data platform costs via intelligent resource management
  - Real-time insights enabling faster financial decision making
- **Technologies:** BigQuery, Dataflow, AI Platform, GKE, Cloud SQL, Pub/Sub"""
    },
    "cv_infrastructure_engineer.md": {
        "title": "Infrastructure Engineer",
        "subtitle": "System Infrastructure & Automation Specialist",
        "summary": "Senior Infrastructure Engineer specializing in **system infrastructure design, automation, and performance optimization**. Deep expertise in designing and implementing robust infrastructure supporting enterprise applications and services. Proven track record building infrastructure solutions that delivered 300% productivity improvements and 30% cost reductions across financial services, healthcare, and real estate sectors. Expert in infrastructure automation and monitoring.",
        "competencies": """🏗️ **Infrastructure Design & Implementation**
- Enterprise infrastructure architecture and design
- High availability and disaster recovery implementations
- Performance tuning and capacity planning
- Infrastructure security and hardening

⚙️ **Infrastructure Automation**
- Infrastructure as Code with Terraform and Ansible
- Automated provisioning and configuration management
- Monitoring and alerting automation
- Infrastructure testing and validation frameworks""",
        "accomplishments": """### 🏆 2024 | Goldman Sachs | Muscat, Oman
**Enterprise Infrastructure Automation Platform**
- **Challenge:** Modernize infrastructure management for financial services environment
- **Solution:** Implemented automated infrastructure platform with self-service capabilities
- **Impact:**
  - 300% improvement in infrastructure provisioning speed
  - 30% reduction in operational overhead via automation
  - 99.9% infrastructure availability through automated monitoring
- **Technologies:** Terraform, Ansible, Kubernetes, Prometheus, Grafana, ELK Stack"""
    },
    "cv_platform_engineer.md": {
        "title": "Platform Engineer", 
        "subtitle": "Developer Platform & Tooling Specialist",
        "summary": "Senior Platform Engineer specializing in **developer platforms, internal tooling, and developer experience optimization**. Deep expertise in designing and implementing platforms that enable development teams to build, deploy, and operate applications efficiently. Proven track record building platform solutions that delivered 300% productivity improvements and 30% reduction in development cycle time across financial services, healthcare, and real estate sectors. Expert in self-service platforms and developer productivity.",
        "competencies": """🛠️ **Developer Platform Engineering**
- Self-service developer platform design and implementation
- Internal tooling and automation for development workflows
- Platform APIs and service catalogs
- Developer experience optimization and productivity metrics

⚙️ **Platform Operations & Automation**
- GitOps and continuous deployment platforms
- Monitoring and observability for platform services
- Platform security and compliance frameworks
- Multi-tenant platform architecture""",
        "accomplishments": """### 🏆 2024 | Goldman Sachs | Muscat, Oman
**Developer Platform for Financial Services**
- **Challenge:** Build self-service platform enabling rapid application development and deployment
- **Solution:** Architected comprehensive developer platform with automated workflows and tooling
- **Impact:**
  - 300% improvement in development velocity through platform automation
  - 30% reduction in operational overhead for development teams
  - Self-service capabilities reducing time-to-market by 50%
- **Technologies:** Kubernetes, GitLab, ArgoCD, Backstage, Prometheus, Grafana"""
    },
    "cv_sre_engineer.md": {
        "title": "SRE Engineer",
        "subtitle": "Site Reliability & Performance Engineering Specialist", 
        "summary": "Senior SRE Engineer specializing in **site reliability engineering, performance optimization, and operational excellence**. Deep expertise in designing and implementing reliable, scalable systems with focus on automation and monitoring. Proven track record building SRE practices that delivered 300% improvement in system reliability and 30% reduction in operational toil across financial services, healthcare, and real estate sectors. Expert in SLI/SLO frameworks and incident management.",
        "competencies": """📊 **Site Reliability Engineering**
- SLI/SLO definition and implementation
- Error budget management and reliability governance
- Incident management and post-mortem processes
- Reliability and performance testing frameworks

⚙️ **SRE Automation & Monitoring**
- Automated monitoring and alerting systems
- Chaos engineering and reliability testing
- Toil reduction and automation strategies
- Capacity planning and performance optimization""",
        "accomplishments": """### 🏆 2024 | Goldman Sachs | Muscat, Oman
**Enterprise SRE Platform for Financial Systems**
- **Challenge:** Implement SRE practices for critical financial trading and risk management systems
- **Solution:** Built comprehensive SRE platform with automated monitoring and incident response
- **Impact:**
  - 300% improvement in system reliability through SRE practices
  - 30% reduction in operational toil via automation
  - 99.99% uptime achievement for critical financial systems
- **Technologies:** Prometheus, Grafana, PagerDuty, Kubernetes, Terraform, Chaos Monkey"""
    },
    "cv_data_architect.md": {
        "title": "Data Architect",
        "subtitle": "Enterprise Data Strategy & Architecture Specialist",
        "summary": "Senior Data Architect specializing in **enterprise data architecture, data governance, and analytics platforms**. Deep expertise in designing and implementing comprehensive data strategies supporting business intelligence and AI initiatives. Proven track record building data architectures that delivered 300% improvement in data accessibility and 30% reduction in data processing costs across financial services, healthcare, and real estate sectors. Expert in modern data stack and data mesh architectures.",
        "competencies": """📊 **Enterprise Data Architecture**
- End-to-end data architecture design and implementation
- Data lake and data warehouse architectures
- Real-time data processing and streaming architectures
- Data governance and quality frameworks

🔄 **Modern Data Stack Implementation**
- Cloud-native data platforms and services
- Data mesh and domain-driven data architectures
- Self-service analytics and data democratization
- Data security and privacy compliance""",
        "accomplishments": """### 🏆 2024 | Goldman Sachs | Muscat, Oman
**Enterprise Data Architecture for Financial Analytics**
- **Challenge:** Design comprehensive data architecture for real-time financial analytics and reporting
- **Solution:** Architected modern data platform with real-time processing and self-service analytics
- **Impact:**
  - 300% improvement in data processing speed through optimized architecture
  - 30% reduction in data infrastructure costs via cloud optimization
  - Real-time analytics enabling faster regulatory reporting
- **Technologies:** Azure Synapse, Data Factory, Power BI, Databricks, Delta Lake"""
    }
}

def create_cv_file(filename, role_config):
    """Create a CV file with the specified configuration"""
    content = get_cv_template(
        role_config["title"],
        role_config["subtitle"], 
        role_config["summary"],
        role_config["competencies"],
        role_config["accomplishments"]
    )
    
    filepath = f"/Users/rifaterdemsahin/projects/CVLauncher/5_Symbols/cvs/{filename}"
    try:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Created: {filename}")
    except Exception as e:
        print(f"Error creating {filename}: {e}")

# Create CV files
for filename, config in cv_roles.items():
    create_cv_file(filename, config)

print("CV generation complete!")