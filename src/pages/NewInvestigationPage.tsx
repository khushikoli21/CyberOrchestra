import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Zap,
  Play,
  ClipboardPaste,
  FolderOpen,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Radio,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { api, ApiError } from '../services/api';
import type { Incident, ScenarioItem } from '../types';

type InputMode = 'simulation' | 'paste';
type RunState = 'ready' | 'creating' | 'running' | 'failed';

export const NewInvestigationPage: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<InputMode>('simulation');

  // Simulation mode
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [loadingScenarios, setLoadingScenarios] = useState<boolean>(true);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Manual Ingestion Form
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [incidentType, setIncidentType] = useState<string>('suspicious_network_activity');
  const [severity, setSeverity] = useState<string>('high');
  const [source, setSource] = useState<string>('EDR / SIEM Sensor');
  const [rawJson, setRawJson] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Execution state
  const [runState, setRunState] = useState<RunState>('ready');
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadScenarios() {
      try {
        const items = await api.getScenarios();
        setScenarios(items);
        if (items.length > 0) {
          setSelectedScenario(items[0]);
        }
      } catch {
        // Fallback
      } finally {
        setLoadingScenarios(false);
      }
    }
    void loadScenarios();
  }, []);

  const executePipeline = async (id: string) => {
    setCreatedId(id);
    setRunState('running');
    setError(null);
    try {
      await api.runPipeline(id);
      navigate(`/incidents/${encodeURIComponent(id)}`, { replace: true });
    } catch (err: any) {
      setRunState('failed');
      setError(err instanceof ApiError ? err.message : 'Pipeline execution failed.');
    }
  };

  const handleStartSimulation = async () => {
    if (!selectedScenario) return;
    setRunState('creating');
    setError(null);
    try {
      const created = await api.loadScenario(selectedScenario.filename);
      await executePipeline(created.id);
    } catch (err: any) {
      setRunState('failed');
      setError(err instanceof ApiError ? err.message : 'Failed to ingest simulation.');
    }
  };

  const handleSubmitCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Please enter an incident title.');
      return;
    }
    if (!description.trim()) {
      setFormError('Please provide an incident description.');
      return;
    }

    let payload: Record<string, any> = {
      incident_id: `INC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      incident_type: incidentType,
      title: title.trim(),
      description: description.trim(),
      severity: severity,
      source: source.trim() || 'Manual Ingestion',
      timestamp: new Date().toISOString(),
      indicators: [],
      evidence: [],
    };

    if (rawJson.trim()) {
      try {
        const parsed = JSON.parse(rawJson);
        payload = { ...payload, ...parsed };
      } catch (err: any) {
        setFormError(`Invalid JSON in raw payload: ${err.message}`);
        return;
      }
    }

    setRunState('creating');
    setError(null);
    try {
      const created = await api.createIncident(payload);
      await executePipeline(created.id);
    } catch (err: any) {
      setRunState('failed');
      setError(err instanceof ApiError ? err.message : 'Failed to register incident.');
    }
  };

  const filteredScenarios = scenarios.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.incident_id.toLowerCase().includes(q) ||
      s.incident_type.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <Header />

      <main
        style={{
          padding: '24px 28px 40px',
          background: '#f3f6fa',
          minHeight: 'calc(100vh - var(--header-height))',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* ── Heading ──────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
              SECURITY OPERATIONS CENTER
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              New Investigation
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              Ingest security telemetry into CyberOrchestra to trigger the multi-agent detection, analysis, and recovery pipeline.
            </p>
          </div>

          {/* Mode Switcher Pills */}
          <div
            style={{
              display: 'flex',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <button
              type="button"
              onClick={() => setMode('simulation')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: mode === 'simulation' ? '#2563eb' : 'transparent',
                color: mode === 'simulation' ? '#ffffff' : '#64748b',
                transition: 'all 120ms ease',
              }}
            >
              <FolderOpen size={14} /> Benchmark Scenarios
            </button>
            <button
              type="button"
              onClick={() => setMode('paste')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: mode === 'paste' ? '#2563eb' : 'transparent',
                color: mode === 'paste' ? '#ffffff' : '#64748b',
                transition: 'all 120ms ease',
              }}
            >
              <ClipboardPaste size={14} /> Custom Telemetry Form
            </button>
          </div>
        </div>

        {/* ── Running / Analyzing Overlay State ────────────────────────────── */}
        {runState === 'running' && (
          <div
            style={{
              background: 'linear-gradient(135deg, #091330 0%, #0d2258 50%, #08163d 100%)',
              border: '1px solid #1e3a8a',
              borderRadius: '16px',
              padding: '36px 32px',
              color: '#ffffff',
              textAlign: 'center',
              boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(37, 99, 235, 0.3)',
                border: '2px solid #60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <RefreshCw size={28} className="spin-icon" color="#93c5fd" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>
              CyberOrchestra Multi-Agent Pipeline Running...
            </h2>
            <p style={{ fontSize: '13px', color: '#93c5fd', marginTop: '6px', maxWidth: '520px', margin: '6px auto 0' }}>
              Executing Threat Detection, Malware Analysis, Log Forensics, Vulnerability Assessment, and Recovery Planning on <strong>{createdId}</strong>.
            </p>
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: '12.5px' }}>
            <AlertTriangle size={15} style={{ display: 'inline', marginRight: '6px' }} />
            {error}
          </div>
        )}

        {/* ── Mode 1: Benchmark Scenarios ─────────────────────────────────── */}
        {mode === 'simulation' && runState !== 'running' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
            {/* Left: Scenarios Picker */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '20px 24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  Available Benchmark Datasets
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '4px 10px', fontSize: '12px' }}>
                  <Search size={13} color="#94a3b8" />
                  <input
                    type="text"
                    placeholder="Search scenarios..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', width: '130px' }}
                  />
                </div>
              </div>

              {loadingScenarios ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw size={20} className="spin-icon" style={{ margin: '0 auto 8px', color: '#2563eb' }} />
                  Loading benchmarks...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '560px', overflowY: 'auto', paddingRight: '4px' }}>
                  {filteredScenarios.map((sc) => {
                    const isSelected = selectedScenario?.filename === sc.filename;
                    return (
                      <div
                        key={sc.filename}
                        onClick={() => setSelectedScenario(sc)}
                        style={{
                          border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '14px 16px',
                          cursor: 'pointer',
                          background: isSelected ? '#eff6ff' : '#ffffff',
                          transition: 'all 120ms ease',
                          boxShadow: isSelected ? '0 2px 8px rgba(37,99,235,0.12)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 800, color: isSelected ? '#1d4ed8' : '#0f172a', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                              {sc.incident_id}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: sc.severity === 'critical' ? '#fee2e2' : '#fef3c7',
                                color: sc.severity === 'critical' ? '#dc2626' : '#d97706',
                              }}
                            >
                              {sc.severity.toUpperCase()}
                            </span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{sc.incident_type}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#475569', marginTop: '6px', lineHeight: 1.4 }}>
                          {sc.description}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                          <span>Source: {sc.source}</span>
                          <span>• {sc.indicatorsCount} Indicators</span>
                          <span>• {sc.evidenceCount} Evidence</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Selected Preview & Action */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {selectedScenario ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontSize: '12px', fontWeight: 700 }}>
                    <Sparkles size={16} /> SELECTED BENCHMARK PREVIEW
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                    {selectedScenario.incident_id}
                  </h2>
                  <p style={{ fontSize: '13px', color: '#475569', marginTop: '8px', lineHeight: 1.5 }}>
                    {selectedScenario.description}
                  </p>

                  <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px', marginTop: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                      TELEMETRY OVERVIEW
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11.5px' }}>
                      <div><span style={{ color: '#64748b' }}>Category:</span> <strong style={{ color: '#0f172a' }}>{selectedScenario.incident_type}</strong></div>
                      <div><span style={{ color: '#64748b' }}>Severity:</span> <strong style={{ color: '#0f172a' }}>{selectedScenario.severity.toUpperCase()}</strong></div>
                      <div><span style={{ color: '#64748b' }}>Sensor Source:</span> <strong style={{ color: '#0f172a' }}>{selectedScenario.source}</strong></div>
                      <div><span style={{ color: '#64748b' }}>Artifact File:</span> <strong style={{ color: '#0f172a' }}>{selectedScenario.filename}</strong></div>
                    </div>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      INCLUDED INDICATORS ({selectedScenario.indicatorsCount})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(selectedScenario.rawData?.indicators || []).map((ind: any, i: number) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                            padding: '2px 8px',
                          }}
                        >
                          {ind.type}: {ind.value}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                  Select a benchmark scenario on the left to review telemetry details.
                </div>
              )}

              <div style={{ paddingTop: '20px', borderTop: '1px solid #e2e8f0', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={handleStartSimulation}
                  disabled={!selectedScenario || runState === 'creating'}
                  style={{
                    width: '100%',
                    background: '#2563eb',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 20px',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                    transition: 'background 120ms ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#1d4ed8')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#2563eb')}
                >
                  <Play size={16} /> Ingest &amp; Run Full Pipeline
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Mode 2: Custom Telemetry Form ───────────────────────────────── */}
        {mode === 'paste' && runState !== 'running' && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '24px 28px',
              maxWidth: '840px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <form onSubmit={handleSubmitCustom}>
              {formError && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fee2e2', color: '#b91c1c', fontSize: '12.5px', marginBottom: '16px' }}>
                  {formError}
                </div>
              )}

              {/* Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  Incident Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unauthorized Kerberos Ticket Granting Request from ws-fin-04"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Grid: Category, Severity, Source */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Incident Category
                  </label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', color: '#0f172a', background: '#f8fafc', outline: 'none' }}
                  >
                    <option value="suspicious_network_activity">Suspicious Network Activity</option>
                    <option value="phishing_email">Phishing / Social Engineering</option>
                    <option value="endpoint_malware_alert">Endpoint Malware Alert</option>
                    <option value="vulnerable_service">Vulnerable Service (CVE)</option>
                    <option value="lateral_movement">Lateral Movement / Privilege Escalation</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', color: '#0f172a', background: '#f8fafc', outline: 'none' }}
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Telemetry Source
                  </label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g. Perimeter Firewall / CrowdStrike"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', color: '#0f172a', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  Incident Description *
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide detailed description of the observed anomaly, affected hosts, and telemetry timeline..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#0f172a',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Raw JSON Input */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  <span>Raw Telemetry JSON (Optional Indicators &amp; Evidence)</span>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Accepts SIEM/EDR JSON format</span>
                </label>
                <textarea
                  rows={5}
                  placeholder={'{\n  "indicators": [\n    { "type": "ipv4", "value": "198.51.100.25" }\n  ],\n  "evidence": [\n    { "description": "Blocked outbound connection", "evidence_type": "network_log" }\n  ]\n}'}
                  value={rawJson}
                  onChange={(e) => setRawJson(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    color: '#0f172a',
                    background: '#f8fafc',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => navigate('/incidents')}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '9px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={runState === 'creating'}
                  style={{
                    background: '#2563eb',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 22px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                  }}
                >
                  Create &amp; Analyze Investigation
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </>
  );
};
