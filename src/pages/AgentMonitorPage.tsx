import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bug,
  CheckCircle2,
  Clock,
  Cpu,
  FileText,
  Filter,
  Layers,
  LoaderCircle,
  RefreshCw,
  Shield,
  ShieldAlert,
  Sparkles,
  Workflow,
  X,
  ChevronRight,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { api, ApiError } from '../services/api';
import type { Incident, IncidentDetail, PipelineStageExecution } from '../types';

type RecordValue = Record<string, unknown>;
type StatusLabel = 'Completed' | 'Running' | 'Failed' | 'Not Started';

interface AgentDefinition {
  id: string;
  name: string;
  stageName: string;
  purpose: string;
  model: string;
  dataPath: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
}

const AGENTS: AgentDefinition[] = [
  {
    id: 'threat-detection',
    name: 'Threat Detection Agent',
    stageName: 'Threat Detection Agent',
    purpose: 'Classifies incident taxonomy, evaluates severity, and models adversary intent.',
    model: 'Groq qwen-2.5-32b',
    dataPath: 'threat_detection_result',
    icon: ShieldAlert,
    accentColor: '#2563eb',
    accentBg: '#eff6ff',
    accentBorder: '#bfdbfe',
  },
  {
    id: 'malware-analysis',
    name: 'Malware Analysis Agent',
    stageName: 'Malware Analysis Agent',
    purpose: 'Dissects file hashes, payload signatures, and suspicious binary behaviors.',
    model: 'Groq llama-3.3-70b',
    dataPath: 'malware_analysis_result',
    icon: Bug,
    accentColor: '#dc2626',
    accentBg: '#fef2f2',
    accentBorder: '#fecaca',
  },
  {
    id: 'log-analysis',
    name: 'Log Analysis Agent',
    stageName: 'Log Analysis Agent',
    purpose: 'Correlates auth anomalies, network flows, and timestamp sequences.',
    model: 'Groq qwen-2.5-32b',
    dataPath: 'log_analysis_result',
    icon: Activity,
    accentColor: '#d97706',
    accentBg: '#fffbeb',
    accentBorder: '#fde68a',
  },
  {
    id: 'vuln-assessment',
    name: 'Vulnerability Assessment Agent',
    stageName: 'Vulnerability Assessment Agent',
    purpose: 'Cross-references NVD CVEs, CVSS scores, and asset exposure surfaces.',
    model: 'NVD 2.0 + LLM',
    dataPath: 'vulnerability_assessment_result',
    icon: Shield,
    accentColor: '#7c3aed',
    accentBg: '#f5f3ff',
    accentBorder: '#ddd6fe',
  },
  {
    id: 'recovery-planning',
    name: 'Recovery Planning Agent',
    stageName: 'Recovery Planning Agent',
    purpose: 'Formulates prioritized containment, eradication, and post-incident playbooks.',
    model: 'Deterministic + LLM',
    dataPath: 'recovery_plan',
    icon: Workflow,
    accentColor: '#059669',
    accentBg: '#ecfdf5',
    accentBorder: '#a7f3d0',
  },
  {
    id: 'report-generation',
    name: 'Report Generation Agent',
    stageName: 'Report Generation Agent',
    purpose: 'Compiles executive summaries, technical timelines, and regulatory audit reports.',
    model: 'Groq qwen-3.8-27b',
    dataPath: 'report',
    icon: FileText,
    accentColor: '#0284c7',
    accentBg: '#f0f9ff',
    accentBorder: '#bae6fd',
  },
];

const toRecord = (value: unknown): RecordValue | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as RecordValue) : null;
const toList = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const toText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null;

function getStageStatus(stage?: PipelineStageExecution): StatusLabel {
  if (stage?.status === 'completed') return 'Completed';
  if (stage?.status === 'running') return 'Running';
  if (stage?.status === 'error') return 'Failed';
  return 'Not Started';
}

function getResultData(detail: IncidentDetail | null, dataPath: string): RecordValue | null {
  if (!detail) return null;
  if (dataPath === 'recovery_plan') return toRecord(detail.recovery_plan);
  if (dataPath === 'report') return toRecord(detail.report);
  const state = toRecord(detail.state);
  return toRecord(state?.[dataPath]);
}

export const AgentMonitorPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [detail, setDetail] = useState<IncidentDetail | null>(null);
  const [loadingIncidents, setLoadingIncidents] = useState<boolean>(true);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [rawJsonOpen, setRawJsonOpen] = useState<boolean>(false);

  // Load Incidents List
  const loadIncidents = useCallback(async () => {
    setLoadingIncidents(true);
    setError(null);
    try {
      const list = await api.getIncidents();
      setIncidents(list);
      if (list.length > 0 && !selectedIncidentId) {
        setSelectedIncidentId(list[0].id);
      }
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Failed to fetch incidents list.');
    } finally {
      setLoadingIncidents(false);
    }
  }, [selectedIncidentId]);

  useEffect(() => {
    void loadIncidents();
  }, [loadIncidents]);

  // Load Selected Incident Detail
  const loadDetail = useCallback(async (id: string) => {
    if (!id) return;
    setLoadingDetail(true);
    setError(null);
    try {
      const data = await api.getIncident(id);
      setDetail(data);
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : `Failed to load details for ${id}`);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedIncidentId) {
      void loadDetail(selectedIncidentId);
    }
  }, [selectedIncidentId, loadDetail]);

  const selectedIncident = useMemo(
    () => incidents.find((i) => i.id === selectedIncidentId),
    [incidents, selectedIncidentId]
  );

  const selectedAgent = useMemo(
    () => AGENTS.find((a) => a.id === selectedAgentId),
    [selectedAgentId]
  );

  const selectedAgentResult = useMemo(
    () => (selectedAgent ? getResultData(detail, selectedAgent.dataPath) : null),
    [selectedAgent, detail]
  );

  // Metrics for overview
  const stagesCount = detail?.execution_history?.length || 0;
  const completedStagesCount =
    detail?.execution_history?.filter((s) => s.status === 'completed').length || 0;

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
              Agent Monitor
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              Multi-agent orchestration telemetry, pipeline status, and analytical stage inspections.
            </p>
          </div>

          {/* Right Controls: Incident Selector & Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '6px 12px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                Incident:
              </span>
              <select
                value={selectedIncidentId}
                onChange={(e) => setSelectedIncidentId(e.target.value)}
                disabled={loadingIncidents}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#0f172a',
                  cursor: 'pointer',
                  maxWidth: '240px',
                }}
              >
                {incidents.map((inc) => (
                  <option key={inc.id} value={inc.id}>
                    {inc.id} — {inc.title.slice(0, 32)}...
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => loadDetail(selectedIncidentId)}
              disabled={loadingDetail}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '9px 14px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                transition: 'background 120ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
            >
              <RefreshCw
                size={14}
                color="#2563eb"
                className={loadingDetail ? 'am-spin' : ''}
              />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
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

        {/* ── Summary KPI Cards ─────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '14px',
          }}
        >
          {/* Card 1: Pipeline Agents */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                Pipeline Agents
              </span>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Cpu size={15} color="#2563eb" />
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
              6 Dedicated Agents
            </div>
            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
              ● All agents online & registered
            </div>
          </div>

          {/* Card 2: Stages Completed */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                Stage Execution
              </span>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={15} color="#059669" />
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
              {completedStagesCount} / {Math.max(6, stagesCount)} Stages
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Current: {detail?.pipeline_stage || 'Completed'}
            </div>
          </div>

          {/* Card 3: Inference Architecture */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                Reasoning Backbone
              </span>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: '#f5f3ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={15} color="#7c3aed" />
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#7c3aed', marginTop: '6px' }}>
              Groq LPU Engine
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              qwen-2.5-32b & llama-3.3-70b
            </div>
          </div>

          {/* Card 4: Current Incident Status */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                Active Incident
              </span>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Shield size={15} color="#2563eb" />
              </div>
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: '#0f172a',
                marginTop: '10px',
                fontFamily: 'monospace',
              }}
            >
              {selectedIncident?.id || 'No selection'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Severity:{' '}
              <span style={{ fontWeight: 700, color: '#dc2626' }}>
                {selectedIncident?.severity.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* ── Architecture Pipeline Flow Diagram ────────────────────────── */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '22px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Multi-Agent Pipeline Architecture & Workflow
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Autonomous deterministic flow: sequential threat detection, parallel specialist analysis, shared state synthesis, recovery, and reporting.
              </p>
            </div>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#2563eb',
                background: '#eff6ff',
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid #bfdbfe',
              }}
            >
              Linear & Fan-Out Stages
            </span>
          </div>

          {/* Stepper Node Scrollable Flow */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              overflowX: 'auto',
              paddingBottom: '8px',
            }}
          >
            {/* Step 1: Threat Detection */}
            <div
              style={{
                minWidth: '160px',
                padding: '12px 14px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                  }}
                />
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#2563eb' }}>
                  STAGE 1
                </span>
              </div>
              <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>Threat Detection</strong>
              <small style={{ fontSize: '10.5px', color: '#64748b' }}>Taxonomy & Severity</small>
            </div>

            <ArrowRight size={18} color="#94a3b8" style={{ flexShrink: 0 }} />

            {/* Parallel Analysis Box */}
            <div
              style={{
                border: '1.5px dashed #93c5fd',
                borderRadius: '14px',
                background: 'rgba(239, 246, 255, 0.4)',
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#1d4ed8',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                PARALLEL SPECIALIST FAN-OUT
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div
                  style={{
                    padding: '8px 12px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#0f172a',
                  }}
                >
                  Malware Analysis
                </div>
                <div
                  style={{
                    padding: '8px 12px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#0f172a',
                  }}
                >
                  Log Analysis
                </div>
                <div
                  style={{
                    padding: '8px 12px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#0f172a',
                  }}
                >
                  Vuln Assessment
                </div>
              </div>
            </div>

            <ArrowRight size={18} color="#94a3b8" style={{ flexShrink: 0 }} />

            {/* Step 3: Shared Incident State */}
            <div
              style={{
                minWidth: '150px',
                padding: '12px 14px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                  }}
                />
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#2563eb' }}>
                  STAGE 3
                </span>
              </div>
              <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>Shared State</strong>
              <small style={{ fontSize: '10.5px', color: '#64748b' }}>Deterministic Store</small>
            </div>

            <ArrowRight size={18} color="#94a3b8" style={{ flexShrink: 0 }} />

            {/* Step 4: Recovery Planning */}
            <div
              style={{
                minWidth: '150px',
                padding: '12px 14px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                  }}
                />
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#2563eb' }}>
                  STAGE 4
                </span>
              </div>
              <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>Recovery Planning</strong>
              <small style={{ fontSize: '10.5px', color: '#64748b' }}>Playbooks Formulation</small>
            </div>

            <ArrowRight size={18} color="#94a3b8" style={{ flexShrink: 0 }} />

            {/* Step 5: Policy Review */}
            <div
              style={{
                minWidth: '150px',
                padding: '12px 14px',
                background: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#f59e0b',
                  }}
                />
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#b45309' }}>
                  STAGE 5
                </span>
              </div>
              <strong style={{ fontSize: '12.5px', color: '#92400e' }}>Policy Engine</strong>
              <small style={{ fontSize: '10.5px', color: '#b45309' }}>HITL Guardrails</small>
            </div>

            <ArrowRight size={18} color="#94a3b8" style={{ flexShrink: 0 }} />

            {/* Step 6: Report Generation */}
            <div
              style={{
                minWidth: '150px',
                padding: '12px 14px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                  }}
                />
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#15803d' }}>
                  STAGE 6
                </span>
              </div>
              <strong style={{ fontSize: '12.5px', color: '#166534' }}>Report Gen</strong>
              <small style={{ fontSize: '10.5px', color: '#15803d' }}>Audit Grounded</small>
            </div>
          </div>
        </div>

        {/* ── 6 Agent Status Cards Grid ─────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {AGENTS.map((agent) => {
            const Icon = agent.icon;
            const stageExec = detail?.execution_history?.find((s) => s.stage === agent.stageName);
            const status = getStageStatus(stageExec);
            const result = getResultData(detail, agent.dataPath);
            const isSelected = selectedAgentId === agent.id;

            return (
              <div
                key={agent.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  padding: '18px 20px',
                  boxShadow: isSelected
                    ? '0 4px 16px rgba(37, 99, 235, 0.15)'
                    : '0 1px 3px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 140ms ease',
                }}
              >
                <div>
                  {/* Top Bar with Icon & Status Pill */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: agent.accentBg,
                        border: `1px solid ${agent.accentBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={19} color={agent.accentColor} />
                    </div>

                    {/* Status Pill */}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '99px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background:
                          status === 'Completed'
                            ? '#dcfce7'
                            : status === 'Running'
                            ? '#eff6ff'
                            : status === 'Failed'
                            ? '#fee2e2'
                            : '#f1f5f9',
                        color:
                          status === 'Completed'
                            ? '#15803d'
                            : status === 'Running'
                            ? '#1d4ed8'
                            : status === 'Failed'
                            ? '#dc2626'
                            : '#64748b',
                        border: `1px solid ${
                          status === 'Completed'
                            ? '#86efac'
                            : status === 'Running'
                            ? '#93c5fd'
                            : status === 'Failed'
                            ? '#fca5a5'
                            : '#cbd5e1'
                        }`,
                      }}
                    >
                      {status === 'Running' && (
                        <LoaderCircle size={11} className="am-spin" />
                      )}
                      {status === 'Completed' && <CheckCircle2 size={11} />}
                      {status}
                    </span>
                  </div>

                  {/* Agent Title & Purpose */}
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#0f172a',
                      lineHeight: 1.3,
                    }}
                  >
                    {agent.name}
                  </h3>
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#64748b',
                      marginTop: '4px',
                      lineHeight: 1.45,
                    }}
                  >
                    {agent.purpose}
                  </p>

                  {/* Model & Stage Meta */}
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '8px 10px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                    }}
                  >
                    <span style={{ color: '#64748b' }}>Model Engine:</span>
                    <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>
                      {agent.model}
                    </strong>
                  </div>

                  {/* Summary Findings if Available */}
                  {result && (
                    <div
                      style={{
                        marginTop: '10px',
                        fontSize: '11.5px',
                        color: '#334155',
                        background: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        borderRadius: '8px',
                        padding: '8px 10px',
                      }}
                    >
                      <strong style={{ color: '#0369a1' }}>Latest Finding: </strong>
                      {agent.id === 'threat-detection' &&
                        `${toText(result.threat_classification) || 'Classified'} · ${toText(
                          result.severity
                        ) || 'High'}`}
                      {agent.id === 'malware-analysis' &&
                        (result.malware_detected ? 'Malware detected' : 'Clean indicator')}
                      {agent.id === 'log-analysis' &&
                        `Severity: ${toText(result.severity) || 'Medium'}`}
                      {agent.id === 'vuln-assessment' &&
                        `Assessment: ${toText(result.severity) || 'Completed'}`}
                      {agent.id === 'recovery-planning' &&
                        `${toList(result.recovery_actions).length} actions generated`}
                      {agent.id === 'report-generation' && 'Final report compiled'}
                    </div>
                  )}
                </div>

                {/* Inspect Button */}
                <button
                  type="button"
                  onClick={() => setSelectedAgentId(isSelected ? null : agent.id)}
                  style={{
                    marginTop: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: isSelected ? '#2563eb' : '#eff6ff',
                    color: isSelected ? '#ffffff' : '#2563eb',
                    border: '1px solid #bfdbfe',
                    transition: 'all 120ms ease',
                  }}
                >
                  <Code2 size={14} />
                  <span>{isSelected ? 'Close Telemetry' : 'Inspect Telemetry & Facts'}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Detailed Telemetry Panel (When Agent is Selected) ─────────── */}
        {selectedAgent && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #bfdbfe',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(37, 99, 235, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '14px',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: selectedAgent.accentBg,
                    border: `1px solid ${selectedAgent.accentBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {React.createElement(selectedAgent.icon, {
                    size: 20,
                    color: selectedAgent.accentColor,
                  })}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    {selectedAgent.name} — Detailed Telemetry & Evidence Grounding
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Data path: <code>state.{selectedAgent.dataPath}</code> · Inference Engine: {selectedAgent.model}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAgentId(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* If no result available yet */}
            {!selectedAgentResult && (
              <div
                style={{
                  padding: '28px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  fontSize: '13px',
                }}
              >
                No telemetry recorded for this agent in incident {selectedIncidentId}. Run the pipeline to execute this stage.
              </div>
            )}

            {/* Result Structured Sections */}
            {selectedAgentResult && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '16px',
                }}
              >
                {/* Section 1: Classification & Reasoning */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '16px',
                  }}
                >
                  <h4
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#2563eb',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '10px',
                    }}
                  >
                    Reasoning & Assessment
                  </h4>
                  <p
                    style={{
                      fontSize: '13px',
                      color: '#0f172a',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {toText(selectedAgentResult.reasoning) ||
                      toText(selectedAgentResult.description) ||
                      'Analytical assessment established from input telemetry logs and indicators.'}
                  </p>
                </div>

                {/* Section 2: Observed Facts */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '16px',
                  }}
                >
                  <h4
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#059669',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '10px',
                    }}
                  >
                    Observed Facts & Events
                  </h4>
                  <ul
                    style={{
                      paddingLeft: '18px',
                      fontSize: '12.5px',
                      color: '#334155',
                      lineHeight: 1.6,
                    }}
                  >
                    {(toList(selectedAgentResult.observed_facts).length > 0
                      ? toList(selectedAgentResult.observed_facts)
                      : toList(selectedAgentResult.suspicious_events)
                    ).map((fact, idx) => (
                      <li key={idx}>
                        {typeof fact === 'string'
                          ? fact
                          : toText(toRecord(fact)?.finding) ||
                            toText(toRecord(fact)?.event) ||
                            JSON.stringify(fact)}
                      </li>
                    ))}
                    {!toList(selectedAgentResult.observed_facts).length &&
                      !toList(selectedAgentResult.suspicious_events).length && (
                        <li style={{ color: '#94a3b8' }}>No discrete facts listed.</li>
                      )}
                  </ul>
                </div>

                {/* Section 3: Evidence Grounding IDs */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '16px',
                  }}
                >
                  <h4
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#7c3aed',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '10px',
                    }}
                  >
                    Supporting Evidence Grounding
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {toList(selectedAgentResult.supporting_evidence_ids).map(
                      (id, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#f5f3ff',
                            border: '1px solid #ddd6fe',
                            color: '#7c3aed',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            fontWeight: 600,
                          }}
                        >
                          {String(id)}
                        </span>
                      )
                    )}
                    {!toList(selectedAgentResult.supporting_evidence_ids).length && (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        Synthesized across primary telemetry stream.
                      </span>
                    )}
                  </div>
                </div>

                {/* Section 4: MITRE ATT&CK or CVE Mapping */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '16px',
                  }}
                >
                  <h4
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#d97706',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '10px',
                    }}
                  >
                    ATT&CK Techniques & Indicators
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {toList(selectedAgentResult.mitre_techniques).map((t, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          color: '#b45309',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          fontWeight: 600,
                        }}
                      >
                        {String(t)}
                      </span>
                    ))}
                    {!toList(selectedAgentResult.mitre_techniques).length && (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        No specific MITRE ATT&CK techniques referenced.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Collapsible Raw JSON */}
            {selectedAgentResult && (
              <div style={{ marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setRawJsonOpen(!rawJsonOpen)}
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
                      transform: rawJsonOpen ? 'rotate(90deg)' : 'none',
                      transition: 'transform 120ms ease',
                    }}
                  />
                  <span>{rawJsonOpen ? 'Hide' : 'View'} Raw Agent Response JSON</span>
                </button>

                {rawJsonOpen && (
                  <pre
                    style={{
                      marginTop: '10px',
                      padding: '14px',
                      borderRadius: '10px',
                      background: '#0f172a',
                      color: '#e2e8f0',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      maxHeight: '300px',
                      overflowY: 'auto',
                    }}
                  >
                    {JSON.stringify(selectedAgentResult, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
};
