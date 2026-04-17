#!/usr/bin/env python3
"""
Complete CV Generator Script
Creates all remaining CV markdown files
"""

import os

def get_cv_template(role_title, role_subtitle, summary, competencies):
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

### 🏆 2025 | IBM | London, UK
**Enterprise AI & Hybrid Cloud Transformation**
- **Challenge:** Lead enterprise-scale hybrid cloud transformation and AI integration for global clients
- **Solution:** Architected comprehensive IBM Cloud + Red Hat OpenShift platform with watsonx AI integration and DevSecOps practices
- **Impact:**
  - 35% reduction in operational overhead through AI-driven automation with watsonx
  - 40% improvement in deployment frequency via DevSecOps and Ansible Automation Platform
  - Zero-downtime migration of mission-critical workloads to hybrid cloud architecture
- **Technologies:** IBM Cloud, Red Hat OpenShift, watsonx AI, Ansible Automation Platform, Terraform, Kubernetes, GitHub Actions

### 🏆 2024 | Goldman Sachs | Muscat, Oman
**Enterprise {role_title} Platform**
- **Challenge:** Implement scalable {role_title.lower()} solutions for financial services environment
- **Solution:** Architected comprehensive platform with automation and monitoring capabilities
- **Impact:** 
  - 300% improvement in operational efficiency through advanced automation
  - 30% reduction in operational costs via intelligent optimization
  - 99.9% system availability with automated failover and recovery
- **Technologies:** Kubernetes, Terraform, Azure/AWS, Monitoring tools, Automation frameworks

### 🏆 2023 | Ypsomed | Switzerland  
**Healthcare Technology Platform**
- **Challenge:** Scale {role_title.lower()} capabilities for medical device and IoT environments
- **Solution:** Implemented robust platform with real-time processing and analytics
- **Impact:**
  - 40% improvement in system performance through optimized architecture
  - 35% reduction in operational overhead via automation
  - Real-time insights enabling improved healthcare delivery
- **Technologies:** Cloud platforms, Monitoring systems, Automation tools, Analytics platforms

### 🏆 2022 | Cushman & Wakefield | London, UK
**Real Estate Technology Platform**
- **Challenge:** Modernize {role_title.lower()} infrastructure for property management analytics
- **Solution:** Built cloud-native platform with automated processes and real-time analytics
- **Impact:**
  - 50% faster processing through optimized platform architecture
  - 90% improvement in system reliability via automated monitoring
  - Enhanced business intelligence enabling strategic decision making
- **Technologies:** Azure services, Analytics platforms, Automation frameworks, Monitoring tools

---

## TECHNICAL EXPERTISE

### Core Technologies
**Platforms:** Kubernetes, Docker, AWS, Azure, GCP  
**Automation:** Terraform, Ansible, GitLab CI/CD, GitHub Actions  
**Monitoring:** Prometheus, Grafana, ELK Stack, Azure Monitor  
**Programming:** Python, Bash, PowerShell, YAML, JSON  

### Specialized Skills
**Infrastructure:** Infrastructure as Code, Container orchestration, Cloud architecture  
**Security:** Zero-trust architectures, Compliance frameworks, Identity management  
**Operations:** CI/CD pipelines, Monitoring and alerting, Incident response  
**Integration:** API design, Microservices, Event-driven architectures  

---

## PROFESSIONAL EXPERIENCE HIGHLIGHTS

**Senior {role_title} / AI Solutions Architect** | January 2025 - Present
*IBM | London, UK*

- Architecting hybrid cloud transformation using IBM Cloud and Red Hat OpenShift for Fortune 500 enterprises
- Implementing watsonx AI solutions for intelligent automation, reducing operational overhead by 35%
- Leading DevSecOps transformation with Ansible Automation Platform and Terraform IaC across multi-cloud environments
- Delivering zero-downtime Kubernetes cluster migrations for mission-critical financial and government workloads
- Building enterprise CI/CD pipelines with GitHub Actions and Jenkins serving 500+ developers globally

**Senior {role_title} / Technical Lead** | 2020 - 2025
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

📊 **Technical Portfolio & Presentations:**  
https://rifaterdemsahin.com/wp-content/uploads/2025/02/rifaterdemsahinprofilepresentation.v2025.2.pdf

---

*References and detailed project portfolios available upon request*"""

# All remaining CV roles
cv_roles = {
    "cv_ml_ops_engineer.md": {
        "title": "MLOps Engineer",
        "subtitle": "Machine Learning Operations Specialist",
        "summary": "Senior MLOps Engineer specializing in **machine learning operations, model deployment, and ML infrastructure**. Expert in bridging ML development and production operations through automated pipelines and monitoring.",
        "competencies": """🤖 **ML Operations & Deployment**
- ML model deployment pipelines and automation
- Model versioning, monitoring, and lifecycle management
- Feature engineering and data pipeline automation
- A/B testing and model performance optimization"""
    },
    "cv_analytics_engineer.md": {
        "title": "Analytics Engineer", 
        "subtitle": "Data Analytics & Business Intelligence Specialist",
        "summary": "Senior Analytics Engineer specializing in **data transformation, analytics platforms, and business intelligence**. Expert in building scalable analytics infrastructure enabling data-driven decision making.",
        "competencies": """📊 **Analytics Platform Engineering**
- Data modeling and transformation pipelines
- Business intelligence and reporting automation
- Analytics infrastructure and performance optimization
- Self-service analytics platform development"""
    },
    "cv_big_data_engineer.md": {
        "title": "Big Data Engineer",
        "subtitle": "Large-Scale Data Processing Specialist", 
        "summary": "Senior Big Data Engineer specializing in **large-scale data processing, distributed systems, and real-time analytics**. Expert in building high-performance data platforms supporting petabyte-scale data processing.",
        "competencies": """🏗️ **Big Data Architecture**
- Distributed data processing with Hadoop and Spark
- Real-time streaming with Kafka and Storm
- NoSQL database design and optimization
- Data lake and warehouse architecture"""
    },
    "cv_infrastructure_architect.md": {
        "title": "Infrastructure Architect",
        "subtitle": "Enterprise Infrastructure Design Specialist",
        "summary": "Senior Infrastructure Architect specializing in **enterprise infrastructure design, scalability, and performance optimization**. Expert in designing robust, secure infrastructure supporting mission-critical applications.",
        "competencies": """🏗️ **Infrastructure Architecture**
- Enterprise infrastructure design and planning
- High availability and disaster recovery architecture
- Performance optimization and capacity planning
- Infrastructure security and compliance frameworks"""
    },
    "cv_devops_architect.md": {
        "title": "DevOps Architect", 
        "subtitle": "DevOps Strategy & Implementation Specialist",
        "summary": "Senior DevOps Architect specializing in **DevOps transformation, CI/CD strategy, and automation frameworks**. Expert in designing comprehensive DevOps solutions enabling rapid, reliable software delivery.",
        "competencies": """🚀 **DevOps Architecture & Strategy**
- DevOps transformation strategy and implementation
- CI/CD pipeline architecture and optimization
- Infrastructure automation and orchestration
- DevOps culture and process optimization"""
    },
    "cv_security_architect.md": {
        "title": "Security Architect",
        "subtitle": "Cybersecurity Architecture & Strategy Specialist", 
        "summary": "Senior Security Architect specializing in **security architecture design, threat modeling, and risk management**. Expert in building comprehensive security frameworks protecting enterprise assets and data.",
        "competencies": """🔒 **Security Architecture & Design**
- Enterprise security architecture and threat modeling
- Zero-trust security framework implementation
- Identity and access management architecture
- Compliance and regulatory framework design"""
    }
}

def create_cv_file(filename, role_config):
    """Create a CV file with the specified configuration"""
    content = get_cv_template(
        role_config["title"],
        role_config["subtitle"],
        role_config["summary"],
        role_config["competencies"]
    )
    
    filepath = f"/Users/rifaterdemsahin/projects/CVLauncher/5_Symbols/cvs/public/{filename}"
    
    # Check if file exists and is empty or doesn't exist
    try:
        if os.path.exists(filepath):
            file_size = os.path.getsize(filepath)
            if file_size > 0:
                print(f"Skipped: {filename} (already has content)")
                return
        
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Created: {filename}")
    except Exception as e:
        print(f"Error creating {filename}: {e}")

# Create all remaining CV files
print("Creating remaining CV files...")
for filename, config in cv_roles.items():
    create_cv_file(filename, config)

print("\\nCV generation complete!")
print("\\nGenerating files for remaining empty CVs...")

# Get list of all CV files and check which ones are still empty
cv_dir = "/Users/rifaterdemsahin/projects/CVLauncher/5_Symbols/cvs/public"
all_cv_files = [f for f in os.listdir(cv_dir) if f.startswith('cv_') and f.endswith('.md')]

empty_files = []
for cv_file in all_cv_files:
    filepath = os.path.join(cv_dir, cv_file)
    if os.path.getsize(filepath) == 0:
        empty_files.append(cv_file)

print(f"Found {len(empty_files)} empty CV files")

# Generate content for remaining empty files with generic roles
for empty_file in empty_files:
    # Extract role name from filename
    role_name = empty_file.replace('cv_', '').replace('.md', '').replace('_', ' ').title()
    
    generic_config = {
        "title": role_name,
        "subtitle": "Technology Specialist",
        "summary": f"Senior {role_name} specializing in **enterprise technology solutions, automation, and system optimization**. Expert in designing and implementing scalable solutions supporting mission-critical business operations.",
        "competencies": f"""⚙️ **{role_name} Expertise**
- Enterprise {role_name.lower()} design and implementation
- Automation and optimization frameworks
- Performance monitoring and tuning
- Security and compliance best practices"""
    }
    
    create_cv_file(empty_file, generic_config)

print("\\nAll CV files have been generated!")