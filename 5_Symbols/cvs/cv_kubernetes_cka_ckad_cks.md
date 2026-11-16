# RIFAT ERDEM SAHIN
## Principal Kubernetes / Cloud-Native Platform & SRE Consultant
**Kubernetes Platform Engineering · CKA/CKAD/CKS Skill Coverage · 20+ Years in Virtualisation, Platform Engineering and Production SRE**

---

**Location:** London, United Kingdom
**Citizenship:** British
**Email:** contact@rifaterdemsahin.com
**Phone:** +44 7848 024173
**LinkedIn:** linkedin.com/in/rifaterdemsahin
**GitHub:** github.com/rifaterdemsahin
**Portfolio:** https://rifaterdemsahin.com
**Schedule a Call:** https://calendly.com/rifaterdem/schedule

**Availability:** Immediate
**Contract Types:** Inside IR35 · Outside IR35 · PAYE
**Clearances held:** NATO · SC · CNI (Critical National Infrastructure) · BPSS · NSV

---

## PROFESSIONAL SUMMARY

Infrastructure and platform consultant with **20+ years** in enterprise IT — starting in server virtualisation and datacentre operations and progressing to Kubernetes-native platform engineering, GitOps and production SRE for Critical National Infrastructure (CNI), defence, energy and financial-services clients.

**CKA certified**; CKAD and CKS are not held as certificates, so their exam blueprints are mapped below to real delivery work instead. Hands-on across the full CKA / CKAD / CKS skill set: **cluster installation and lifecycle** (kubeadm, k3s, managed Kubernetes, OpenShift), workload design and deployment (Deployments, StatefulSets, DaemonSets, Jobs, HPA/VPA, PDBs, init containers, sidecars, probes), and the full **CKS security surface** (RBAC, NetworkPolicies, Pod Security Admission, admission control, seccomp/AppArmor, mTLS/service mesh, secrets management, supply-chain and image scanning, vulnerability management, CIS benchmarking with kube-bench).

Delivered Kubernetes and container platforms for **National Grid / NESO (UK power grid), Lockheed Martin, IBM, Goldman Sachs, Canada Life, ZTE** and other regulated enterprises — including on-premise cluster builds on VMware, multi-cloud clusters on Azure/AWS/GCP, NGINX/ingress and MetalLB/Traefik edge layers, Helm and Kustomize packaging, Argo-CD/Flux GitOps, and **24×7-style SRE operations**: SLOs/error budgets, Prometheus/Thanos/Grafana observability, Loki logging, Jaeger/Kiali tracing, incident response and automated remediation.

---

## KUBERNETES & CLOUD-NATIVE COMPETENCY MAP

### Installation, Upgrade & Cluster Lifecycle (CKA)
- Provisioned Kubernetes clusters on-premise (VMware/Proxmox/CentOS/RHEL, bare metal) and in the cloud (AKS, EKS, GKE, OpenShift/OCP)
- kubeadm-based cluster builds, node bootstrap and joining, certificate management and annual certificate rotation
- Cluster upgrades and version pinning across multi-cluster estates; drain/cordon and workload migration with zero downtime
- etcd backup, restore and disaster-recovery drills; cluster capacity planning and node autoscaling
- CNI installation and tuning (Calico, Flannel, Cilium-class networking), CoreDNS and service discovery
- Storage: CSI drivers, persistent volumes, StatefulSets for Elasticsearch, Kafka, Redis, MinIO, Qdrant
- Ingress and edge: NGINX Ingress, MetalLB for bare-metal load balancing, Traefik, TLS termination and cert automation
- High availability control planes, multi-master topologies, and cluster federation concepts

### Application Deployment & Development Workflows (CKAD)
- Declarative workload design: Deployments, StatefulSets, DaemonSets, CronJobs, init containers, sidecar and multi-container patterns
- Probes (liveness/readiness/startup), resource requests/limits, QoS classes, HPA/VPA and PodDisruptionBudgets
- Configuration: ConfigMaps, Secrets, projected volumes, environment injection, multi-environment overlays with Kustomize
- Packaging and release: Helm chart authoring, repositories, templating and lifecycle hooks
- CI/CD for containers: image build pipelines, registry hygiene, blue/green and canary rollouts, Argo Rollouts-style progressive delivery
- Observability within the app boundary: structured logging, metrics endpoints, OpenTelemetry-style instrumentation
- Troubleshooting: kubectl deep-dive, events, logs, ephemeral containers, node-level diagnosis

### Kubernetes Security (CKS) & DevSecOps
- **RBAC** design and audit: least-privilege ClusterRoles/Roles, service accounts, bound tokens
- **NetworkPolicies** segmentation (default-deny east-west traffic) and CNI policy enforcement
- **Pod Security** — Pod Security Admission (PSS restricted/baseline), PSP migration, securityContext hardening (runAsNonRoot, readOnlyRootFilesystem, drop ALL capabilities, no privilege escalation)
- **Admission control** — OPA Gatekeeper / Kyverno policies enforcing CIS controls on images, registries, namespaces and hostPath use
- **Supply chain** — private registries, image signing and verification (Cosign/Sigstore concepts), SBOM generation, Trivy/Grype scanning in CI
- **Runtime security** — seccomp and AppArmor profiles, Falco-style runtime threat detection, syscall and file-integrity monitoring
- **Secrets management** — Azure Key Vault, external secrets operators, sealed secrets, no secrets in Git
- **Service-to-service** — mTLS, service mesh security policy, egress control
- **Compliance** — kube-bench / CIS Kubernetes Benchmark hardening, audit logging, and secure multi-tenancy
- Perimeter and network defence operated daily on CNI estates: F5 (incl. WAF policy), Check Point, Zscaler, Netscaler

### SRE & Production Operations
- SLO/SLI definition and error-budget-driven operations for national-scale energy systems
- Monitoring and alerting: Prometheus with remote-write to Thanos, Grafana, Alertmanager routing
- Logging and tracing: Loki aggregation, Jaeger distributed tracing, Kiali service-mesh observability
- Incident management, post-incident review and runbook automation; on-call support patterns
- Toil reduction through automation: Ansible, Terraform, Bash and Python operational tooling
- Capacity, cost and reliability trade-offs across on-premise and multi-cloud estates
- AI-assisted operations: RAG-based troubleshooting agents over Loki logs and Bitbucket documentation using n8n, Qdrant and Anthropic Claude for root-cause analysis and drift remediation

---

## SIGNATURE KUBERNETES & VIRTUALISATION DELIVERIES

### 2025–2026 · NESO (National Energy System Operator) — via Capgemini / Experis, London
**SRE / DevOps Onboarding Lead — OpenShift/Kubernetes platform for the UK power grid (CNI)**
- Operated and hardened an OpenShift estate underpinning national energy balancing, with RHEL nodes, VMware virtualisation, Artifactory artefact management, Tekton pipelines and Argo-CD GitOps
- Built observability at scale — Prometheus remote-write to Thanos, Grafana, Loki, Jaeger, Kiali
- Enforced perimeter and workload security with F5, Check Point, Zscaler and Netscaler alongside cluster-level policy
- Onboarded high-value market participants onto energy systems for critical national infrastructure (electric system operator)
- Delivered an agentic RAG troubleshooting assistant (n8n + Qdrant + Claude) that cut manual root-cause analysis effort and flagged infrastructure drift proactively
- Reduced operational risk and legacy maintenance costs while keeping energy-balancing services continuously available

### 2024–2025 · National Grid — via IBM / NordCloud, UK
**SRE — Kubernetes migration, OpenShift and hybrid-cloud platform**
- Migrated constrained legacy workloads onto containerised, Kubernetes-orchestrated platforms with rollout, rollback and cutover planning
- Standardised delivery with Helm operators, GitOps and Tekton pipelines; introduced feature toggles and progressive release flow
- Implemented network segmentation, ingress design and zero-trust access aligned to CNI compliance obligations
- Introduced Prometheus/Grafana SLO dashboards to make reliability visible to operations and business stakeholders
- Used GitHub Copilot-style AI assistance to accelerate OpenShift automation and reduce transformation cost

### 2023–2024 · Goldman Sachs — Muscat, Oman (onsite contract)
**DevOps Release Train Engineer**
- Modernised release engineering on OpenShift (Kubernetes) with on-premise gateways, Azure Sentinel and AI-driven (LLM) workflows
- Built CI/CD across GCP, Azure and AWS, including Cloud Build integration and DevSecOps maturity assessment
- Served a national user base exceeding 4 million users via Azure Logic Apps and Azure Virtual Desktop (VDI)

### 2019–2020 · Lockheed Martin (Brussels / New York, via Ardent Blue Technologies and Pexabo)
**DevOps Lead — defence-grade release automation**
- Automated the Oculus VR release cycle for a defence customer, coordinating delivery teams in Brussels and New York
- Built pipelines with Unity Cloud Build, TeamCity, Jenkins, AWS Step Functions, GitHub and Python under strict security and change control
- Applied machine learning (TensorFlow) for VR gesture recognition alongside the delivery work

### 2022–2023 · Ypsomed (Switzerland) and Cushman & Wakefield
**DevOps Consultant / DevOps Engineer**
- Led Git and TFS-to-Azure-DevOps migrations for a regulated medtech client, with VMware/Citrix estates and documentation to healthcare compliance standards
- Built Azure infrastructure as code (ARM/Bicep) for a data environment, cutting manual provisioning effort

### 2015–2019 · ZTE, Concentra Analytics, Smart Space Software, Red Box Recorders, MMT Digital
**Senior DevOps Engineer — container and Kubernetes platform delivery**
- Built an on-premise Kubernetes environment (VMware/CentOS, Docker Compose → Kubernetes) and migrated workloads, using NGINX, MetalLB, Traefik, Helm, ELK, Redis and MinIO
- Delivered CI/CD, configuration management and infrastructure-as-code across telecom, analytics and software clients

### 2003–2015 · Microsoft, Accenture, British American Tobacco, Turkcell, TÜBİTAK, Craneware, Scottish Enterprise, Canada Life
**Virtualisation and datacentre foundations**
- Two decades of server virtualisation and infrastructure automation: VMware vSphere/ESXi, Hyper-V, Citrix, Proxmox VE, Vagrant, LXD
- Large-scale Windows/Linux estates, Active Directory, networking and storage, with PowerShell/Bash automation
- Migration programmes from bare metal to virtualised, then containerised, then orchestrated platforms — the through-line of the whole career
- Served as Cloud Solution Architect at Microsoft and Manager at Accenture; built platforms used by 3 million users and an ad server serving up to 1 billion views per month

---

## REFERENCE PROJECTS BY CLIENT

| Client | Context | Scope |
|---|---|---|
| **NESO (National Energy System Operator)** | UK power grid operator · Capgemini / Experis · Mar 2025 – Jan 2026 | SRE / DevOps onboarding lead: OpenShift platform, GitOps, observability, CNI security, AI-assisted ops |
| **National Grid** | UK transmission operator · IBM / NordCloud · Mar 2024 – Mar 2025 | SRE: OpenShift automation, Kubernetes migration, hybrid cloud, monitoring |
| **Lockheed Martin** | Defence · Ardent Blue Technologies / Pexabo · Nov 2019 – Apr 2020 | DevOps Lead: VR release automation across Brussels and New York |
| **Goldman Sachs** | Financial services · Oman onsite · Aug 2023 – Mar 2024 | DevOps Release Train Engineer: OpenShift, multi-cloud CI/CD, 4M+ user platform |
| **IBM** | Technology · 2024–2025 delivery + background-check sponsor | Hybrid cloud and OpenShift platform work for National Grid |
| **Ypsomed** | MedTech, Switzerland · Apr 2022 – Apr 2023 | DevOps Consultant: Git/TFS migration under healthcare compliance |
| **Cushman & Wakefield** | Real estate · Remote · May 2022 – Jan 2023 | DevOps Engineer: Azure IaC (ARM/Bicep) for data environment |
| **ZTE** | Telecom | Cloud and delivery platform engineering |
| **Red Box Recorders** | Software | On-premise Kubernetes migration, NGINX/MetalLB/Traefik, Helm |
| **Canada Life / GWLE** | Financial services | Platform and release engineering on regulated estates |
| **Microsoft · Accenture · British American Tobacco · Turkcell · TÜBİTAK · Craneware · Scottish Enterprise** | Cross-sector | Consulting, cloud architecture and platform delivery (2003–2015) |

---

## TRAINING & CERTIFICATIONS

- **Certified Kubernetes Administrator (CKA)** — listed as certified in Rifat Erdem Sahin's published CV (CERTIFICATIONS & CONTINUOUS LEARNING block). Exam ID / issue date available on request.
- Kubernetes training completed: "Kubernetes with CI/CD Solutions" and "Kubernetes: Microservices"
- CKAD and CKS: not claimed as certificates in any of his records; their skill areas are mapped below to delivered programme work
- MCPS: Microsoft Certified Professional; Developing Microsoft Azure Solutions
- Azure certifications (various) and Microsoft Certified Architect in Cloud Solutions (70-532)
- AWS certifications, including AWS Machine Learning Specialty
- Claude Architect Professional (Anthropic); AI/LLM engineering specialisms (GenAI, RAG, AI security)
- DevOps and Agile certifications; Udemy "Infrastructure As Code", "Test Automation With AI"; Coursera "Secure AI Models", "SonarQube Technical Debt Management"
- Instructor on Coursera/Udemy/YouTube — 10k+ aggregate student enrolments

---

## TECHNICAL SKILLS

**Orchestration:** Kubernetes (self-managed, kubeadm, k3s, AKS, EKS, GKE), Red Hat OpenShift/OCP, Helm, Kustomize, Argo-CD, Argo Rollouts, Tekton, Flux-style GitOps
**Security (CKS):** RBAC, NetworkPolicy, Pod Security Admission, OPA Gatekeeper, Kyverno, seccomp, AppArmor, Falco concepts, Trivy, Cosign/Sigstore, kube-bench, mTLS, Key Vault
**SRE & observability:** Prometheus, Thanos, Grafana, Alertmanager, Loki, Jaeger, Kiali, ELK stack
**Virtualisation (20+ years):** VMware vSphere/ESXi, Hyper-V, Citrix, Proxmox VE, Vagrant, LXD
**Cloud:** Azure (incl. AKS and VDI), AWS (EKS, Lambda, SageMaker, Step Functions), GCP (GKE, Cloud Build), IBM Cloud, hybrid/on-premise
**Infrastructure as code & automation:** Terraform, Ansible, ARM templates, Bicep, Packer, Bash, PowerShell, Python
**CI/CD:** Azure DevOps, GitLab CI, Jenkins, GitHub Actions, Tekton, Octopus, TeamCity, Harness
**Networking & edge:** NGINX, F5, Check Point, Zscaler, Netscaler, MetalLB, Traefik, Calico/Cilium-class CNI, load balancers, reverse proxies
**Languages:** Python, Bash, C#, PowerShell, YAML, SQL
**AI-assisted engineering:** LangChain, RAG architectures, vector databases (Pinecone, Weaviate, ChromaDB, FAISS, Qdrant), n8n orchestration

---

## OPERATING MODEL

1. **Assess** — map the estate, define SLOs and a risk register against CIS and host-security baselines.
2. **Stabilise** — close cluster and pipeline vulnerabilities, fix RBAC and NetworkPolicy gaps, establish observability.
3. **Automate** — GitOps-driven delivery, policy-as-code, and toil elimination via Ansible/Terraform/Python.
4. **Operate** — run production with alerting, runbooks, incident review and continuous drift detection.

*All experience above is drawn from delivered client programmes recorded in the CVLauncher source CV. CKA is stated as certified, matching his published CV; CKAD and CKS are not claimed as certificates. CKAD/CKS skill areas are mapped to real delivery work so they can be verified in a technical conversation.*

*References available: prior clients and delivery partners (Capgemini/Experis, IBM/NordCloud, Pexabo, Ardent Blue Technologies, ACLDigital/Alten/Cprime/Omantel).*

---

**Kind Regards**
**R. Erdem Sahin**
contact@rifaterdemsahin.com · +44 7848 024173
linkedin.com/in/rifaterdemsahin
