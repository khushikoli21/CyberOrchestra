# CyberOrchestra — SOC Command Center

CyberOrchestra is a multi-agent AI framework for policy-compliant cybersecurity incident response. It provides a complete Security Operations Center (SOC) command center for AI-driven threat detection, telemetry analysis, deterministic policy review, and recovery planning.

## Features

- **SOC Command Dashboard**: Real-time KPIs, severity distribution charts, pipeline throughput tracking, 7-day incident trends, and recent investigation activity logs.
- **Multi-Agent Pipeline Orchestrator**: Coordinates 8 specialized stages:
  1. Data Normalizer (RFC-5737 compliance & schema standardization)
  2. Threat Detection Agent (IOC classification & triage)
  3. Malware Analysis Agent (Binary & behavioral analysis)
  4. Log Analysis Agent (Authentication & network log forensics)
  5. Vulnerability Assessment Agent (CVE correlation & CVSS scoring)
  6. Shared Incident State (Evidence aggregation & citation provenance)
  7. Recovery Planning Agent (Remediation & containment actions)
  8. Deterministic Policy Engine (Rules PE-001 through PE-004)
  9. Report Generation Agent (Executive summaries & technical reporting)
- **Incident Investigation & Scenario Ingestion**:
  - 5 built-in ground-truth scenarios (Network C2, Phishing SSO, Endpoint Malware, Vulnerable WebServer, Multi-Signal Correlated Incident).
  - Manual raw telemetry ingestion supporting custom SIEM/EDR JSON payloads.
  - Interactive pipeline execution with stage-by-stage auditing.
- **Deterministic Policy Review Queue**: Human-in-the-loop governance enforcing rules PE-001..PE-004 on high-risk operations (host isolation, egress blocking, credential revocation) with approval/rejection audit logs.
- **Threat Intelligence Workspace**:
  - Live reputation queries for IP addresses (AbuseIPDB), URLs (URLhaus), CVE vulnerabilities (NVD API 2.0), and MITRE ATT&CK techniques.
  - Real-time indicator feed and operational status monitoring.
- **Incident Reports**: Full technical and executive reports with findings status, evidence citation tracking, recovery recommendations, and uncertainty bounds.
- **Benchmark Evaluation**: Automated evaluation suite measuring Threat Classification Precision, Recall, F1 score, Policy Engine Compliance (100%), and Zero Hallucination Rate against single-LLM baselines.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Build for production
npm run build
```
