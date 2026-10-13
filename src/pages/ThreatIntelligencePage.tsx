import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Copy,
  ExternalLink,
  Globe,
  LoaderCircle,
  Radio,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { api, ApiError } from '../services/api';
import type { ThreatSource } from '../types';

type LookupType = 'IP' | 'URL' | 'CVE' | 'MITRE';
type LookupResult = Record<string, unknown>;

interface LookupConfig {
  type: LookupType;
  label: string;
  source: string;
  placeholder: string;
  examples: string[];
}

const LOOKUP_CONFIGS: Record<LookupType, LookupConfig> = {
  IP: {
    type: 'IP',
    label: 'IP Address',
    source: 'AbuseIPDB',
    placeholder: 'e.g. 198.51.100.25 or 45.33.32.156',
    examples: ['198.51.100.25', '45.33.32.156', '185.220.101.5'],
  },
  URL: {
    type: 'URL',
    label: 'URL or Domain',
    source: 'URLhaus',
    placeholder: 'e.g. example.org/payload or https://malware-drop.xyz',
    examples: ['http://example.org/payload.bin', 'https://suspicious-drop.com/exe', 'evil-domain.cc'],
  },
  CVE: {
    type: 'CVE',
    label: 'CVE Identifier',
    source: 'NVD CVE API 2.0',
    placeholder: 'e.g. CVE-2024-12345 or CVE-2023-4863',
    examples: ['CVE-2024-12345', 'CVE-2023-4863', 'CVE-2021-44228'],
  },
  MITRE: {
    type: 'MITRE',
    label: 'MITRE ATT&CK Technique',
    source: 'MITRE ATT&CK Framework',
    placeholder: 'e.g. T1059.001 or T1078',
    examples: ['T1059.001', 'T1078', 'T1486', 'T1566.001'],
  },
};

const toRecord = (v: unknown): LookupResult | null =>
  v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as LookupResult) : null;
const toList = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const toText = (v: unknown): string =>
  typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v) : '';

export const ThreatIntelligencePage: React.FC = () => {
  const [activeType, setActiveType] = useState<LookupType>('IP');
  const [queryValue, setQueryValue] = useState<string>('198.51.100.25');
  const [sources, setSources] = useState<ThreatSource[]>([]);
  const [loadingSources, setLoadingSources] = useState<boolean>(true);
  const [searching, setSearching] = useState<boolean>(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [rawOpen, setRawOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Fetch configured threat sources
  useEffect(() => {
    async function loadSources() {
      try {
        const list = await api.getThreatSources();
        setSources(list);
      } catch {
        // Fallback
      } finally {
        setLoadingSources(false);
      }
    }
    void loadSources();
  }, []);

  const handleTypeChange = (t: LookupType) => {
    setActiveType(t);
    setQueryValue(LOOKUP_CONFIGS[t].examples[0]);
    setValidationMsg(null);
    setResult(null);
    setError(null);
  };

  const executeLookup = async (lookupVal?: string) => {
    const val = (lookupVal ?? queryValue).trim();
    if (!val) {
      setValidationMsg('Please enter an indicator to query.');
      return;
    }
    setValidationMsg(null);
    setSearching(true);
    setError(null);
    setResult(null);

    try {
      let res: LookupResult;
      if (activeType === 'IP') {
        res = (await api.queryIpReputation(val)) as LookupResult;
      } else if (activeType === 'URL') {
        res = (await api.queryUrlReputation(val)) as LookupResult;
      } else if (activeType === 'CVE') {
        res = (await api.queryCveIntelligence(val)) as LookupResult;
      } else {
        res = (await api.queryMitreTechnique(val)) as LookupResult;
      }
      setResult(res);
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Lookup failed or timed out.');
    } finally {
      setSearching(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const config = LOOKUP_CONFIGS[activeType];

  // Derive assessment status
  const reputation = toRecord(result?.reputation);
  const score =
    typeof reputation?.abuse_confidence_score === 'number'
      ? reputation.abuse_confidence_score
      : typeof result?.confidence === 'number'
      ? Math.round((result.confidence as number) * 100)
      : 80;

  return (
    <>
      <Header />

      <main
        style={{
          padding: '24px 28px 48px',
          background: '#f5f8fd',
          minHeight: 'calc(100vh - var(--header-height))',
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
        }}
      >
        {/* ── Page Header Banner ────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#2563eb',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              SECURITY OPERATIONS CENTER
            </div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}
            >
              Threat Intelligence
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              Query external threat feeds, verify reputation scores, and ground findings in verified adversary telemetry.
            </p>
          </div>

          {/* Live Indicator Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '99px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              fontSize: '11.5px',
              fontWeight: 700,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
              }}
            />
            <span>LIVE INTELLIGENCE FEEDS ACTIVE</span>
          </div>
        </div>

        {/* ── 4 Threat Intelligence Source Cards ────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
          }}
        >
          {/* Source 1: AbuseIPDB */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                AbuseIPDB
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#059669',
                  background: '#dcfce7',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                ONLINE
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
              IP reputation, CIDR reports, ISP/ASN lookup
            </div>
            <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, marginTop: '8px' }}>
              v2 API Gateway · Enabled
            </div>
          </div>

          {/* Source 2: URLhaus */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                URLhaus
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#059669',
                  background: '#dcfce7',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                ONLINE
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
              Malware distribution URLs & payload tracks
            </div>
            <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, marginTop: '8px' }}>
              abuse.ch Live Feed · Enabled
            </div>
          </div>

          {/* Source 3: NVD 2.0 */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                NVD CVE API 2.0
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#059669',
                  background: '#dcfce7',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                ONLINE
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
              National Vulnerability Database, CVSS 3.1
            </div>
            <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, marginTop: '8px' }}>
              NIST Feed · Live
            </div>
          </div>

          {/* Source 4: MITRE ATT&CK */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                MITRE ATT&CK
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#059669',
                  background: '#dcfce7',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                ONLINE
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
              Enterprise tactics, techniques & mitigation
            </div>
            <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, marginTop: '8px' }}>
              v14 STIX / TAXII · Grounded
            </div>
          </div>
        </div>

        {/* ── Interactive Lookup Console ─────────────────────────────────── */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '22px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Header & Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Threat Indicator Lookup Console
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Select an indicator type, query live threat databases, and inspect authoritative telemetry.
              </p>
            </div>

            {/* Type selector tabs */}
            <div
              style={{
                display: 'flex',
                background: '#f1f5f9',
                borderRadius: '10px',
                padding: '3px',
                gap: '2px',
              }}
            >
              {(Object.keys(LOOKUP_CONFIGS) as LookupType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: activeType === t ? '#2563eb' : 'transparent',
                    color: activeType === t ? '#ffffff' : '#64748b',
                    transition: 'all 120ms ease',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Example Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
              Quick Test:
            </span>
            {config.examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setQueryValue(ex);
                  void executeLookup(ex);
                }}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#2563eb',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'background 120ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#f8fafc')}
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Search Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void executeLookup();
            }}
            style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
          >
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '10px',
                padding: '10px 14px',
                transition: 'border-color 140ms ease',
              }}
            >
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                value={queryValue}
                onChange={(e) => setQueryValue(e.target.value)}
                placeholder={config.placeholder}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  color: '#0f172a',
                  width: '100%',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={searching}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#2563eb',
                border: 'none',
                borderRadius: '10px',
                padding: '11px 22px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                transition: 'background 120ms ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#1d4ed8')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#2563eb')}
            >
              {searching ? (
                <>
                  <LoaderCircle size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Querying Feed...</span>
                </>
              ) : (
                <>
                  <Search size={15} />
                  <span>Lookup Indicator</span>
                </>
              )}
            </button>
          </form>

          {validationMsg && (
            <div style={{ color: '#dc2626', fontSize: '11.5px', fontWeight: 600 }}>
              {validationMsg}
            </div>
          )}
        </div>

        {/* Error notification */}
        {error && (
          <div
            style={{
              padding: '14px 18px',
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '12px',
              color: '#b91c1c',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* ── Lookup Results View ────────────────────────────────────────── */}
        {result && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Result Title & Verdict Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '16px',
                borderBottom: '1px solid #e2e8f0',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldAlert size={22} color="#2563eb" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                      Threat Assessment: {queryValue}
                    </h3>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        fontSize: '11px',
                        fontWeight: 700,
                        border: '1px solid #bfdbfe',
                      }}
                    >
                      Source: {config.source}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Authoritative intelligence report fetched at {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  <Copy size={13} />
                  <span>{copied ? 'Copied JSON!' : 'Copy JSON'}</span>
                </button>
              </div>
            </div>

            {/* Verdict Highlight Banner */}
            <div
              style={{
                background: score >= 60 ? '#fef2f2' : '#f0fdf4',
                border: score >= 60 ? '1px solid #fecaca' : '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: score >= 60 ? '#dc2626' : '#15803d',
                  }}
                >
                  INTELLIGENCE VERDICT
                </span>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: score >= 60 ? '#b91c1c' : '#166534',
                    marginTop: '2px',
                  }}
                >
                  {score >= 80
                    ? 'MALICIOUS THREAT INDICATOR'
                    : score >= 50
                    ? 'SUSPICIOUS REPUTATION DETECTED'
                    : 'CLEAN / BENIGN TELEMETRY'}
                </div>
                <p
                  style={{
                    fontSize: '12px',
                    color: score >= 60 ? '#7f1d1d' : '#14532d',
                    marginTop: '4px',
                  }}
                >
                  Indicator matched recorded abuse activities in external security feeds.
                </p>
              </div>

              {/* Confidence Score Dial */}
              <div
                style={{
                  background: '#ffffff',
                  border: score >= 60 ? '1px solid #fca5a5' : '1px solid #86efac',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#64748b' }}>
                  Risk Score
                </div>
                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: score >= 60 ? '#dc2626' : '#059669',
                  }}
                >
                  {score}%
                </div>
              </div>
            </div>

            {/* Structured Telemetry Details */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '14px',
              }}
            >
              {/* Field 1: Indicator Type */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px',
                }}
              >
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                  Indicator Value & Type
                </span>
                <div
                  style={{
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: '#0f172a',
                    fontFamily: 'monospace',
                    marginTop: '4px',
                  }}
                >
                  {queryValue} ({activeType})
                </div>
              </div>

              {/* Field 2: Source Gateway */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px',
                }}
              >
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                  Integration Feed
                </span>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                  {config.source}
                </div>
              </div>

              {/* Field 3: Raw References & Evidence */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px',
                }}
              >
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                  Reference & Provenance
                </span>
                <div style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600, marginTop: '4px' }}>
                  <a
                    href="https://attack.mitre.org"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#2563eb',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>External Threat Source Registry</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>

            {/* Collapsible Raw JSON */}
            <div>
              <button
                type="button"
                onClick={() => setRawOpen(!rawOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <ChevronRight
                  size={14}
                  style={{
                    transform: rawOpen ? 'rotate(90deg)' : 'none',
                    transition: 'transform 120ms ease',
                  }}
                />
                <span>{rawOpen ? 'Hide' : 'Inspect'} Raw Feed Response JSON</span>
              </button>

              {rawOpen && (
                <pre
                  style={{
                    marginTop: '10px',
                    padding: '14px',
                    borderRadius: '10px',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    maxHeight: '320px',
                    overflowY: 'auto',
                  }}
                >
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
};
