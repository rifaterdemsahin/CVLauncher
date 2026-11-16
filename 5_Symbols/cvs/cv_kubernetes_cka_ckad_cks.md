# RIFAT ERDEM SAHIN
## Principal Kubernetes / Cloud-Native Infrastructure & SRE Consultant
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

Hands-on across the full CKA / CKAD / CKS skill set (all three exam blueprints are mapped below to real delivery work; formal exam certificate IDs are not claimed): **cluster installation and lifecycle** (kubeadm, k3s, managed Kubernetes, OpenShift), workload design and deployment (Deployments, StatefulSets, DaemonSets, Jobs, HPA/VPA, PDBs, init containers, sidecars, probes), and the full **CKS security surface** (RBAC, NetworkPolicies, Pod Security Admission, PSA/PSP migration, admission control, seccomp/AppArmor, mTLS/service mesh, secrets management, supply-chain and image scanning, vulnerability management, CIS benchmarking with kube-bench).

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
**OpenShift/Kubernetes platform for the UK power grid (CNI)**
- Operated and hardened an OpenShift estate underpinning national energy balancing, with RHEL nodes, VMware virtualisation, Artefactory artefact management, Tekton pipelines and Argo-CD GitOps
- Built observability at scale — Prometheus remote-write to Thanos, Grafana, Loki, Jaeger, Kiali
- Enforced perimeter and workload security with F5, Check Point, Zscaler and Netscaler alongside cluster-level policy
- Delivered an agentic RAG troubleshooting assistant (n8n + Qdrant + Claude) that cut manual root-cause analysis effort and flagged infrastructure drift proactively
- Reduced operational risk and legacy maintenance costs while keeping energy-balancing services continuously available

### 2024–2025 · National Grid — via IBM / NordCloud, UK
**Kubernetes migration, OpenShift and hybrid-cloud platform**
- Migrated constrained legacy workloads onto containerised, Kubernetes-orchestrated platforms with rollout, rollback and cutover planning
- Standardised delivery with Helm operators, GitOps and Tekton/CCP pipelines; introduced feature toggles and progressive release flow
- Implemented network segmentation, ingress design and zero-trust access aligned to CNI compliance obligations
- Introduced Prometheus/Grafana SLO dashboards to make reliability visible to operations and business stakeholders

### 2019–2020 · Lockheed Martin (Brussels / New York, via Ardent Blue Technologies and Pexabo)
**Defence-grade platform delivery**
- Delivered containerised build and deployment pipelines for a defence customer under strict security and change-control regimes
- Worked to defence-sector handling requirements with SC-cleared delivery teams; consistently ranked in top delivery performance

### 2018–2019 · ZTE · 2015–2018 · Concentra Analytics · 2017–2018 · Smart Space Software
**Multi-client platform and cloud delivery**
- Built and operated CI/CD, container and cloud platforms for telecom and analytics clients, including automated release flow, infrastructure as code and environment standardisation

### Earlier enterprise platforms — Accenture, Microsoft, British American Tobacco, Turkcell, TÜBİTAK, Craneware, Scottish Enterprise, Canada Life, Goldman Sachs
**Virtualisation and datacentre foundations (from 2003)**
- Two decades of server virtualisation and infrastructure automation: VMware vSphere/ESXi, Hyper-V, Citrix, Proxmox VE, Vagrant, Docker Compose and LXD
- Large-scale Windows/Linux estates, Active Directory, networking and storage, with PowerShell/Bash automation long before "platform engineering" was a job title
- Migration programmes from bare metal to virtualised, then containerised, then orchestrated platforms — the through-line of the whole career

---

## REFERENCE PROJECTS BY CLIENT

| Client | Context | Scope |
|---|---|---|
| **National Grid** | UK TSO / CNI · IBM / NordCloud · 2024–2025 | Kubernetes and OpenShift migration, hybrid cloud platform, GitOps, monitoring |
| **NESO (National Energy System Operator)** | UK power grid operator · Capgemini / Experis · 2025–2026 | OpenShift platform operations, SRE, observability, security enforcement, AI-assisted ops |
| **Lockheed Martin** | Defence · via Ardent Blue Technologies / Pexabo · 2019–2020 | Secure delivery pipelines and platform engineering for defence programmes |
| **IBM** | Technology · 2024–2025 engagement & background-check sponsor | Hybrid cloud and OpenShift platform transformation for enterprise customers |
| **Goldman Sachs** | Financial services · 2024 | AI-driven CI/CD automation framework (LLM-powered, 300% faster deployments) |
| **Canada Life / GWLE** | Financial services | Platform and release engineering on regulated estates |
| **Ypsomed** | MedTech, Switzerland · 2023 | Azure ML/IoT platform with automated data-quality and predictive maintenance |
| **ZTE** | Telecom | Cloud and delivery platform engineering |
| **Emerson, Cushman & Wakefield, Theta Trading, Red Box Recorders, MMT Digital, Sword, Craneware, Scottish Enterprise, Microsoft, Accenture, British American Tobacco, Turkcell, TÜBİTAK** | Cross-sector | Multi-client consulting engagements across cloud, virtualisation, CI/CD, DevOps and data platforms |

---

## TRAINING & CERTIFICATIONS

- Kubernetes training completed: "Kubernetes with CI/CD Solutions" and "Kubernetes: Microservices" — covering the CKA/CKAD syllabus areas (courses, not exam certificates)
- Microsoft Certified Architect in Cloud Solutions (70-532); Azure certifications
- AWS certifications, including AWS Machine Learning Specialty
- Claude Architect Professional (Anthropic); AI/LLM engineering specialisms (GenAI, RAG, AI security)
- DevOps and Agile certifications

---

## TECHNICAL SKILLS

**Orchestration:** Kubernetes (self-managed, kubeadm, k3s, AKS, EKS, GKE), Red Hat OpenShift/OCP, Helm, Kustomize, Argo-CD, Argo Rollouts, Tekton, Flux-style GitOps
**Security (CKS):** RBAC, NetworkPolicy, Pod Security Admission, OPA Gatekeeper, Kyverno, seccomp, AppArmor, Falco concepts, Trivy, Cosign/Sigstore, kube-bench, mTLS, Key Vault
**SRE & observability:** Prometheus, Thanos, Grafana, Alertmanager, Loki, Jaeger, Kiali, ELK stack
**Virtualisation (20+ years):** VMware vSphere/ESXi, Hyper-V, Citrix, Proxmox VE, Vagrant, LXD, VMware Tanzu-era container workloads
**Cloud:** Azure (incl. AKS), AWS (EKS, Lambda, SageMaker), GCP (GKE), IBM Cloud, hybrid/on-premise
**Infrastructure as code & automation:** Terraform, Ansible, ARM templates, Packer, Bash, PowerShell, Python
**CI/CD:** Azure DevOps, GitLab CI, Jenkins, GitHub Actions, Octopus
**Networking & edge:** NGINX, F5, Check Point, Zscaler, Netscaler, MetalLB, Traefik, Calico/Cilium-class CNI, load balancers, reverse proxies
**Languages:** Python, Bash, C#, PowerShell, YAML, SQL
**AI-assisted engineering:** LangChain, RAG architectures, vector databases (Pinecone, Weaviate, ChromaDB, FAISS, Qdrant), n8n orchestration

---

## OPERATING MODEL

1. **Assess** — map the estate, define SLOs and a risk register against CIS/host-security baselines.
2. **Stabilise** — fix cluster and pipeline vulnerabilities, close RBAC and NetworkPolicy gaps, establish observability.
3. **Automate** — GitOps-driven delivery, policy-as-code, and toil elimination via Ansible/Terraform/Python.
4. **Operate** — run production with alerting, runbooks, incident review and continuous drift detection.

*All experience above is drawn from delivered client programmes recorded in the CVLauncher source CV. Training courses are listed as courses, not as exam certificates. CKA/CKAD/CKS skill areas are mapped to real delivery work so they can be verified in a technical conversation.*

*References available: prior clients and delivery partners (Capgemini/Experis, IBM/NordCloud, Pexabo, Ardent Blue Technologies).*

---

**Kind Regards**
**R. Erdem Sahin**
contact@rifaterdemsahin.com · +44 7848 024173
linkedin.com/in/rifaterdemsahin
