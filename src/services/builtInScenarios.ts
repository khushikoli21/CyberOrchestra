export const BUILT_IN_SCENARIOS = [
  {
    filename: 'incident_001_network.json',
    incident_id: 'INC-001-NET',
    incident_type: 'suspicious_network_activity',
    description: 'Multiple outbound connections from internal workstation ws-eng-042 to unclassified external IP address 203.0.113.45 over non-standard port 8443.',
    severity: 'medium',
    source: 'simulated_perimeter_firewall',
    indicatorsCount: 1,
    evidenceCount: 2,
    rawData: {
      incident_id: 'INC-001-NET',
      timestamp: '2026-09-30T10:15:00Z',
      incident_type: 'suspicious_network_activity',
      description: 'Multiple outbound connections from internal workstation ws-eng-042 to unclassified external IP address 203.0.113.45 over non-standard port 8443.',
      severity: 'medium',
      source: 'simulated_perimeter_firewall',
      indicators: [
        {
          type: 'ipv4',
          value: '203.0.113.45',
          source: 'simulated_perimeter_firewall',
          confidence: 0.85,
          destination_port: 8443,
          protocol: 'TCP',
          source_workstation: 'ws-eng-042.corp.example.com',
          source_ip: '192.0.2.142'
        }
      ],
      evidence: [
        {
          evidence_id: 'EVID-NET-001',
          evidence_type: 'network_log',
          source: 'simulated_perimeter_firewall',
          description: 'Firewall blocked 18 outbound connection attempts from 192.0.2.142 to 203.0.113.45:8443 within a 5-minute window.',
          raw_reference: 'syslog://fw-edge-01.simulated/filter/conn-772910',
          confidence: 0.95,
          rule_id: 'EGRESS-DEFAULT-RESTRICT',
          action: 'DENY'
        },
        {
          evidence_id: 'EVID-NET-002',
          evidence_type: 'system_log',
          source: 'simulated_host_telemetry',
          description: 'Workstation ws-eng-042 initiated socket connection calls to external IP 203.0.113.45 via background sync process.',
          raw_reference: 'win-event://ws-eng-042/security/5156-socket-open',
          confidence: 0.90,
          process_name: 'background_sync.exe',
          process_id: 4108,
          user_context: 'LOCAL_SYSTEM'
        }
      ]
    }
  },
  {
    filename: 'incident_002_phishing.json',
    incident_id: 'INC-002-PHISH',
    incident_type: 'phishing_email',
    description: 'Employee reported receiving an unexpected urgent email claiming to be an IT security verification notice with an embedded link directing to an external authentication portal.',
    severity: 'high',
    source: 'simulated_mail_gateway',
    indicatorsCount: 3,
    evidenceCount: 2,
    rawData: {
      incident_id: 'INC-002-PHISH',
      timestamp: '2026-09-30T10:30:00Z',
      incident_type: 'phishing_email',
      description: 'Employee reported receiving an unexpected urgent email claiming to be an IT security verification notice with an embedded link directing to an external authentication portal.',
      severity: 'high',
      source: 'simulated_mail_gateway',
      indicators: [
        {
          type: 'url',
          value: 'https://auth-verify.example.org/session/login',
          source: 'simulated_mail_gateway',
          confidence: 0.92,
          category: 'credential_harvesting_candidate'
        },
        {
          type: 'domain',
          value: 'auth-verify.example.org',
          source: 'simulated_mail_gateway',
          confidence: 0.90,
          tld: 'org'
        },
        {
          type: 'mitre_technique',
          value: 'T1566.002',
          source: 'simulated_siem',
          confidence: 0.85,
          technique_name: 'Phishing: Spearphishing Link'
        }
      ],
      evidence: [
        {
          evidence_id: 'EVID-PHISH-001',
          evidence_type: 'observation',
          source: 'simulated_mail_gateway',
          description: "Inbound email with subject 'URGENT: Verify Your Corporate SSO Credentials' received from external sender spoof-alert@example.net targeting employee.user@corp.example.com.",
          raw_reference: 'msg-store://mail-gw-01/quarantine/msg-401928',
          confidence: 0.95,
          sender: 'spoof-alert@example.net',
          recipient: 'employee.user@corp.example.com',
          subject: 'URGENT: Verify Your Corporate SSO Credentials',
          spf_verdict: 'FAIL',
          dkim_verdict: 'NONE'
        },
        {
          evidence_id: 'EVID-PHISH-002',
          evidence_type: 'network_log',
          source: 'simulated_web_proxy',
          description: 'Corporate proxy intercepted and blocked outbound HTTP GET request to auth-verify.example.org due to newly observed domain heuristic.',
          raw_reference: 'proxy-log://web-proxy-02/access/req-99182',
          confidence: 0.88,
          http_status: 403,
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SimulatedBrowser/1.0'
        }
      ]
    }
  },
  {
    filename: 'incident_003_endpoint.json',
    incident_id: 'INC-003-EP',
    incident_type: 'endpoint_malware_alert',
    description: 'Endpoint security sensor flagged an unauthorized binary execution in a temporary user directory attempting process injection.',
    severity: 'high',
    source: 'simulated_edr_agent',
    indicatorsCount: 3,
    evidenceCount: 2,
    rawData: {
      incident_id: 'INC-003-EP',
      timestamp: '2026-09-30T11:15:00Z',
      incident_type: 'endpoint_malware_alert',
      description: 'Endpoint security sensor flagged an unauthorized binary execution in a temporary user directory attempting process injection.',
      severity: 'high',
      source: 'simulated_edr_agent',
      indicators: [
        {
          type: 'sha256',
          value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          source: 'simulated_edr_agent',
          confidence: 0.95,
          file_name: 'patch_installer.exe',
          staged_path: 'C:\\Users\\analyst\\AppData\\Local\\Temp\\patch_installer.exe'
        },
        {
          type: 'malware',
          value: 'SimulatedTestAgent.Dropper',
          source: 'simulated_edr_agent',
          confidence: 0.90,
          classification: 'simulated_test_heuristic'
        },
        {
          type: 'cve',
          value: 'CVE-2026-10001',
          source: 'simulated_vulnerability_catalog',
          confidence: 0.70,
          notes: 'Hypothetical local privilege escalation vector referenced by heuristic tag'
        }
      ],
      evidence: [
        {
          evidence_id: 'EVID-EP-001',
          evidence_type: 'system_log',
          source: 'simulated_edr_agent',
          description: 'Process patch_installer.exe (PID 28419) spawned from explorer.exe and attempted OpenProcess write rights on svchost.exe.',
          raw_reference: 'edr-event://host-ep-091/proc/28419',
          confidence: 0.94,
          target_host: 'host-ep-091.corp.example.com',
          parent_process: 'explorer.exe',
          action_taken: 'BLOCKED_AND_TERMINATED'
        },
        {
          evidence_id: 'EVID-EP-002',
          evidence_type: 'file_sample',
          source: 'simulated_edr_sandbox',
          description: 'Static structural analysis of quarantined executable reported high entropy and simulated anti-debugging code signatures.',
          raw_reference: 'sandbox-ref://quarantine-vault/sample-88319',
          confidence: 0.89,
          file_size_bytes: 1048576,
          entropy: 7.82
        }
      ]
    }
  },
  {
    filename: 'incident_004_vulnerability.json',
    incident_id: 'INC-004-VULN',
    incident_type: 'vulnerable_service',
    description: 'Internal asset inventory and compliance scan detected a running service banner associated with vulnerability advisory CVE-2026-20002. Observational version detection only.',
    severity: 'medium',
    source: 'simulated_vulnerability_scanner',
    indicatorsCount: 2,
    evidenceCount: 2,
    rawData: {
      incident_id: 'INC-004-VULN',
      timestamp: '2026-09-30T11:45:00Z',
      incident_type: 'vulnerable_service',
      description: 'Internal asset inventory and compliance scan detected a running service banner associated with vulnerability advisory CVE-2026-20002. Observational version detection only.',
      severity: 'medium',
      source: 'simulated_vulnerability_scanner',
      indicators: [
        {
          type: 'cve',
          value: 'CVE-2026-20002',
          source: 'simulated_vulnerability_scanner',
          confidence: 0.95,
          cvss_base_score: 7.5,
          affected_component: 'SimulatedWebServer',
          affected_version: '2.4.49'
        },
        {
          type: 'domain',
          value: 'srv-internal-app01.corp.example.net',
          source: 'simulated_asset_inventory',
          confidence: 0.99,
          internal_ip: '192.0.2.50'
        }
      ],
      evidence: [
        {
          evidence_id: 'EVID-VULN-001',
          evidence_type: 'vulnerability_report',
          source: 'simulated_vulnerability_scanner',
          description: 'Port 8080 service response identified as SimulatedWebServer/2.4.49, matching the advisory fingerprint for CVE-2026-20002.',
          raw_reference: 'scanner-audit://vuln-mgmt/scan-2026-09-30/finding-4412',
          confidence: 0.90,
          port: 8080
        },
        {
          evidence_id: 'EVID-VULN-002',
          evidence_type: 'system_log',
          source: 'simulated_package_manager',
          description: 'Asset package manager database records confirm simulated-webserver package version 2.4.49-1 is installed on srv-internal-app01.',
          raw_reference: 'pkg-audit://srv-internal-app01/status/simulated-webserver',
          confidence: 0.98
        }
      ]
    }
  },
  {
    filename: 'incident_005_multi_signal.json',
    incident_id: 'INC-005-MULTI',
    incident_type: 'multi_signal_correlated_incident',
    description: 'Correlated multi-stage detection involving external URL retrieval, endpoint script execution, unpatched local software reference, and anomalous outbound network communication.',
    severity: 'critical',
    source: 'simulated_siem_correlator',
    indicatorsCount: 6,
    evidenceCount: 4,
    rawData: {
      incident_id: 'INC-005-MULTI',
      timestamp: '2026-09-30T12:00:00Z',
      incident_type: 'multi_signal_correlated_incident',
      description: 'Correlated multi-stage detection involving external URL retrieval, endpoint script execution, unpatched local software reference, and anomalous outbound network communication.',
      severity: 'critical',
      source: 'simulated_siem_correlator',
      indicators: [
        {
          type: 'url',
          value: 'https://telemetry-update.example.net/client_updater.bin',
          source: 'simulated_web_proxy',
          confidence: 0.91
        },
        {
          type: 'domain',
          value: 'telemetry-update.example.net',
          source: 'simulated_web_proxy',
          confidence: 0.90
        },
        {
          type: 'sha256',
          value: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
          source: 'simulated_edr_sensor',
          confidence: 0.94
        },
        {
          type: 'ipv4',
          value: '198.51.100.88',
          source: 'simulated_perimeter_firewall',
          confidence: 0.89
        },
        {
          type: 'cve',
          value: 'CVE-2026-30003',
          source: 'simulated_asset_inventory',
          confidence: 0.80
        },
        {
          type: 'mitre_technique',
          value: 'T1071.001',
          source: 'simulated_siem_correlator',
          confidence: 0.85
        }
      ],
      evidence: [
        {
          evidence_id: 'EVID-MULTI-001',
          evidence_type: 'network_log',
          source: 'simulated_web_proxy',
          description: 'Workstation ws-finance-09 (192.0.2.105) issued HTTP GET to https://telemetry-update.example.net/client_updater.bin returning 200 OK with payload stream.',
          raw_reference: 'proxy://access.log/line/88129',
          confidence: 0.95
        },
        {
          evidence_id: 'EVID-MULTI-002',
          evidence_type: 'system_log',
          source: 'simulated_edr_sensor',
          description: 'Process client_updater.bin created scheduled task to execute PowerShell script in hidden mode.',
          raw_reference: 'edr://ws-finance-09/events/proc-6621',
          confidence: 0.92
        },
        {
          evidence_id: 'EVID-MULTI-003',
          evidence_type: 'firewall_log',
          source: 'simulated_perimeter_firewall',
          description: 'Host ws-finance-09 initiated TCP connections to external IP 198.51.100.88 on port 9001 (beaconing signature).',
          raw_reference: 'firewall://edge-fw/session-44109',
          confidence: 0.89
        },
        {
          evidence_id: 'EVID-MULTI-004',
          evidence_type: 'software_audit',
          source: 'simulated_asset_inventory',
          description: 'Installed SimulatedHelperTool version 1.1.0 vulnerable to local privilege escalation CVE-2026-30003.',
          raw_reference: 'audit://ws-finance-09/sw/finding-912',
          confidence: 0.90
        }
      ]
    }
  },
  {
    filename: 'simulated_network_incident.json',
    incident_id: 'SIM-NET-01',
    incident_type: 'suspicious_network_activity',
    description: 'Simulated network perimeter anomaly with anomalous outbound beaconing to non-standard ports.',
    severity: 'medium',
    source: 'simulated_perimeter_firewall',
    indicatorsCount: 1,
    evidenceCount: 1,
    rawData: {
      incident_id: 'SIM-NET-01',
      timestamp: '2026-09-30T09:00:00Z',
      incident_type: 'suspicious_network_activity',
      description: 'Simulated network perimeter anomaly with anomalous outbound beaconing to non-standard ports.',
      severity: 'medium',
      source: 'simulated_perimeter_firewall',
      indicators: [
        {
          type: 'ipv4',
          value: '203.0.113.45',
          source: 'simulated_perimeter_firewall',
          confidence: 0.85
        }
      ],
      evidence: [
        {
          evidence_id: 'EVID-SIM-NET-01',
          evidence_type: 'network_log',
          source: 'simulated_perimeter_firewall',
          description: 'Egress traffic spike toward 203.0.113.45:8443 exceeding standard threshold.',
          confidence: 0.92
        }
      ]
    }
  },
  {
    filename: 'simulated_phishing_incident.json',
    incident_id: 'SIM-PHISH-01',
    incident_type: 'phishing_email',
    description: 'Simulated suspicious email campaign attempting credential harvesting via spoofed SSO portal.',
    severity: 'high',
    source: 'simulated_mail_gateway',
    indicatorsCount: 2,
    evidenceCount: 1,
    rawData: {
      incident_id: 'SIM-PHISH-01',
      timestamp: '2026-09-30T09:30:00Z',
      incident_type: 'phishing_email',
      description: 'Simulated suspicious email campaign attempting credential harvesting via spoofed SSO portal.',
      severity: 'high',
      source: 'simulated_mail_gateway',
      indicators: [
        {
          type: 'url',
          value: 'https://auth-verify.example.org/session/login',
          source: 'simulated_mail_gateway',
          confidence: 0.90
        },
        {
          type: 'domain',
          value: 'auth-verify.example.org',
          source: 'simulated_mail_gateway',
          confidence: 0.88
        }
      ],
      evidence: [
        {
          evidence_id: 'EVID-SIM-PHISH-01',
          evidence_type: 'mail_log',
          source: 'simulated_mail_gateway',
          description: 'High risk spoofed credential prompt delivered to user mailboxes.',
          confidence: 0.94
        }
      ]
    }
  },
  {
    filename: 'simulated_endpoint_malware.json',
    incident_id: 'SIM-MALWARE-01',
    incident_type: 'endpoint_malware_alert',
    description: 'Simulated malicious binary drop in temp directory with automated persistence attempt.',
    severity: 'high',
    source: 'simulated_edr_sensor',
    indicatorsCount: 2,
    evidenceCount: 1,
    rawData: {
      incident_id: 'SIM-MALWARE-01',
      timestamp: '2026-09-30T09:45:00Z',
      incident_type: 'endpoint_malware_alert',
      description: 'Simulated malicious binary drop in temp directory with automated persistence attempt.',
      severity: 'high',
      source: 'simulated_edr_sensor',
      indicators: [
        {
          type: 'sha256',
          value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          source: 'simulated_edr_sensor',
          confidence: 0.95
        },
        {
          type: 'filename',
          value: 'patch_installer.exe',
          source: 'simulated_edr_sensor',
          confidence: 0.90
        }
      ],
      evidence: [
        {
          evidence_id: 'EVID-SIM-EP-01',
          evidence_type: 'edr_alert',
          source: 'simulated_edr_sensor',
          description: 'Process patch_installer.exe executed from AppData Temp and attempted unauthorized memory injection.',
          confidence: 0.95
        }
      ]
    }
  }
];

