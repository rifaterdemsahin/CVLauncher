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

# CV role definitions
cv_roles = {
    "cv_ai_platform_engineer.md": {
        "title": "AI Platform Engineer",
        "subtitle": "ML Infrastructure Specialist", 
        "summary": "Senior AI Platform Engineer specializing in **MLOps, AI infrastructure, and scalable machine learning platforms**. Deep expertise in designing and implementing production-scale AI/ML platforms supporting enterprise AI initiatives. Proven track record building AI platforms that delivered 300% productivity improvements and 30% cost reductions across financial services, healthcare, and real estate sectors. Expert in bridging ML research and production deployment through robust AI infrastructure.",
        "competencies": """🤖 **AI/ML Platform Engineering**
- End-to-end ML platform design and implementation
- MLOps pipelines with automated model training and deployment
- AI infrastructure scaling and performance optimization
- Model versioning, monitoring, and lifecycle management

🔧 **ML Infrastructure & Automation** 
- Kubernetes-based ML workload orchestration
- GPU cluster management and resource optimization
- Automated feature engineering and data pipeline construction
- CI/CD for machine learning with automated testing frameworks""",
        "accomplishments": """### 🏆 2024 | Goldman Sachs | Muscat, Oman
**Enterprise AI Platform for Financial Analytics**
- **Challenge:** Build scalable AI platform for real-time financial risk assessment and trading algorithms
- **Solution:** Architected comprehensive MLOps platform with automated model deployment and monitoring
- **Impact:** 
  - 300% increase in model deployment frequency through automated ML pipelines
  - 30% reduction in infrastructure costs via intelligent resource optimization
  - Real-time model inference supporting millions of daily transactions
- **Technologies:** Kubernetes, MLflow, Kubeflow, TensorFlow Serving, Prometheus, Grafana"""
    },
    "cv_data_engineer.md": {
        "title": "Data Engineer", 
        "subtitle": "Big Data & Analytics Specialist",
        "summary": "Senior Data Engineer specializing in **big data processing, data pipeline architecture, and analytics platforms**. Deep expertise in designing and implementing scalable data infrastructure supporting enterprise analytics and AI initiatives. Proven track record building data platforms that delivered 300% productivity improvements and 30% cost reductions across financial services, healthcare, and real estate sectors. Expert in real-time data processing and cloud-native data architectures.",
        "competencies": """📊 **Data Pipeline Engineering**
- Large-scale data pipeline design and implementation
- Real-time streaming data processing with Apache Kafka and Spark
- ETL/ELT automation and orchestration
- Data quality monitoring and automated validation frameworks

☁️ **Cloud Data Architecture**
- Cloud-native data lakes and data warehouses
- Multi-cloud data integration and synchronization  
- Serverless data processing and auto-scaling architectures
- Cost optimization strategies for cloud data storage and compute""",
        "accomplishments": """### 🏆 2024 | Goldman Sachs | Muscat, Oman
**Real-time Financial Data Processing Platform**
- **Challenge:** Build scalable data platform for real-time financial market data processing and analytics
- **Solution:** Architected streaming data platform with automated data validation and real-time analytics
- **Impact:**
  - 300% improvement in data processing speed through optimized pipeline architecture
  - 30% reduction in data infrastructure costs via cloud optimization
  - Real-time insights enabling faster trading decisions and risk management
- **Technologies:** Apache Kafka, Apache Spark, Azure Synapse, Data Factory, Power BI"""
    },
    "cv_security_engineer.md": {
        "title": "Security Engineer",
        "subtitle": "Cybersecurity & Infrastructure Protection Specialist", 
        "summary": "Senior Security Engineer specializing in **cybersecurity, infrastructure protection, and security automation**. Deep expertise in designing and implementing comprehensive security frameworks for enterprise environments. Proven track record building security solutions that delivered 300% improvement in threat detection and 30% reduction in security incidents across financial services, healthcare, and real estate sectors. Expert in zero-trust architectures and automated security operations.",
        "competencies": """🔒 **Security Architecture & Design**
- Zero-trust security framework implementation
- Security-first infrastructure design and hardening
- Identity and access management with multi-factor authentication
- Compliance frameworks for regulated industries (SOC2, PCI DSS, GDPR)

🛡️ **Security Operations & Automation**
- Automated threat detection and incident response
- Security scanning and vulnerability management
- SIEM/SOAR implementation and optimization
- Security testing and penetration testing frameworks""",
        "accomplishments": """### 🏆 2024 | Goldman Sachs | Muscat, Oman
**Enterprise Security Framework for Financial Services**
- **Challenge:** Implement comprehensive security framework for global financial operations
- **Solution:** Architected zero-trust security platform with automated threat detection and response
- **Impact:**
  - 300% improvement in threat detection speed through automated security operations
  - 30% reduction in security incidents via proactive threat hunting
  - Compliance achievement for SOC2, PCI DSS, and regulatory requirements
- **Technologies:** Azure Sentinel, Splunk, CrowdStrike, HashiCorp Vault, Zero Trust Architecture"""
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
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Created: {filename}")

# Create CV files
for filename, config in cv_roles.items():
    create_cv_file(filename, config)

print("CV generation complete!")