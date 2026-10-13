import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Search,
  Plus,
  Play,
  RefreshCw,
  FolderOpen,
  Filter,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowUpDown,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { api, ApiError } from '../services/api';
import type { Incident, ScenarioItem } from '../types';

export const IncidentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [showScenarioModal, setShowScenarioModal] = useState<boolean>(false);
  const [scenarioError, setScenarioError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [incList, scenList] = await Promise.all([
        api.getIncidents(),
        api.getScenarios(),
      ]);
      setIncidents(incList);
      setScenarios(scenList);
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Failed to fetch investigations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchIncidents();
  }, [fetchIncidents]);

  const handleRunPipeline = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setRunningId(id);
    try {
      await api.runPipeline(id);
      await fetchIncidents();
      navigate(`/incidents/${encodeURIComponent(id)}`);
    } catch {
      navigate(`/incidents/${encodeURIComponent(id)}`);
    } finally {
      setRunningId(null);
    }
  };

  const handleLoadScenario = async (filename: string) => {
    setScenarioError(null);
    try {
      const created = await api.loadScenario(filename);
      setShowScenarioModal(false);
      await fetchIncidents();
      navigate(`/incidents/${encodeURIComponent(created.id)}`);
    } catch (err: any) {
      setScenarioError(err.message);
    }
  };

  // Filtered investigations
  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      if (severityFilter !== 'all' && inc.severity.toLowerCase() !== severityFilter.toLowerCase()) {
        return false;
      }
      if (statusFilter !== 'all' && inc.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = inc.id.toLowerCase().includes(q);
        const matchesTitle = inc.title.toLowerCase().includes(q);
        const matchesDesc = inc.description.toLowerCase().includes(q);
        const matchesIoc = inc.iocs.some((ioc) => ioc.toLowerCase().includes(q));
        if (!matchesId && !matchesTitle && !matchesDesc && !matchesIoc) return false;
      }
      return true;
    });
  }, [incidents, severityFilter, statusFilter, searchQuery]);

  // Statistics
  const totalCount = incidents.length;
  const criticalCount = incidents.filter((i) => i.severity.toLowerCase() === 'critical').length;
  const inProgressCount = incidents.filter((i) => i.status.toLowerCase() !== 'resolved').length;
  const resolvedCount = incidents.filter((i) => i.status.toLowerCase() === 'resolved').length;

  const severityBadgeStyle = (sev: string) => {
    const s = sev.toLowerCase();
    if (s === 'critical') return { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' };
    if (s === 'high') return { bg: '#ffedd5', text: '#ea580c', border: '#fdba74' };
    if (s === 'medium') return { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' };
    return { bg: '#dcfce7', text: '#059669', border: '#86efac' };
  };

  const statusBadgeStyle = (st: string) => {
    const s = st.toLowerCase();
    if (s === 'resolved') return { bg: '#dcfce7', text: '#059669', border: '#86efac' };
    if (s === 'critical') return { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' };
    if (s === 'policy review') return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
    return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
  };

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
        {/* ── Page Header Banner ───────────────────────────────────────────── */}
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
              Investigations
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              Monitor, triage, and manage security incidents coordinated by the CyberOrchestra multi-agent pipeline.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setShowScenarioModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '9px 16px',
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
              <FolderOpen size={15} color="#2563eb" /> Load Benchmark
            </button>

            <button
              type="button"
              onClick={() => navigate('/incidents/new')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#2563eb',
                border: 'none',
                borderRadius: '10px',
                padding: '9px 18px',
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                transition: 'background 120ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#1d4ed8')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#2563eb')}
            >
              <Plus size={16} /> New Investigation
            </button>
          </div>
        </div>

        {/* ── Summary Metric Cards ─────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '14px',
          }}
        >
          {/* Total */}
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
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Total Investigations</span>
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
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
              {totalCount}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Registered in SOC store</div>
          </div>

          {/* Critical */}
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
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Critical Severity</span>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={15} color="#dc2626" />
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#dc2626', marginTop: '6px' }}>
              {criticalCount}
            </div>
            <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, marginTop: '2px' }}>
              Requires immediate containment
            </div>
          </div>

          {/* In Progress */}
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
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Active / In Progress</span>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={15} color="#d97706" />
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#d97706', marginTop: '6px' }}>
              {inProgressCount}
            </div>
            <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 600, marginTop: '2px' }}>
              Under pipeline triage
            </div>
          </div>

          {/* Resolved */}
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
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Resolved</span>
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
              {resolvedCount}
            </div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
              Report generated & approved
            </div>
          </div>
        </div>

        {/* ── Filter & Search Toolbar ──────────────────────────────────────── */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          {/* Search Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '7px 12px',
              minWidth: '280px',
              flex: 1,
              maxWidth: '440px',
            }}
          >
            <Search size={15} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by ID, title, description, or IOC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '12.5px',
                color: '#0f172a',
                width: '100%',
              }}
            />
          </div>

          {/* Filters & Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
              <Filter size={14} />
              <span>Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  color: '#0f172a',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  color: '#0f172a',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="investigating">Investigating</option>
                <option value="policy review">Policy Review</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => void fetchIncidents()}
              title="Refresh investigations"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#475569',
              }}
            >
              <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#b91c1c',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* ── Investigations Table ─────────────────────────────────────────── */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 12px', color: '#2563eb' }} />
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Loading security investigations...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <Shield size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>No investigations found</div>
              <p style={{ fontSize: '12.5px', color: '#64748b', maxWidth: '360px', margin: '4px auto 16px' }}>
                No active security incidents match your filter criteria. Try resetting filters or creating a new investigation.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSeverityFilter('all');
                  setStatusFilter('all');
                }}
                style={{
                  background: '#2563eb',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  padding: '7px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr
                    style={{
                      background: '#f8fafc',
                      borderBottom: '1px solid #e2e8f0',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <th style={{ padding: '14px 18px', width: '150px' }}>Investigation ID</th>
                    <th style={{ padding: '14px 18px' }}>Description &amp; Indicators</th>
                    <th style={{ padding: '14px 14px', width: '110px' }}>Severity</th>
                    <th style={{ padding: '14px 14px', width: '130px' }}>Pipeline Stage</th>
                    <th style={{ padding: '14px 14px', width: '140px' }}>Created</th>
                    <th style={{ padding: '14px 14px', width: '120px' }}>Status</th>
                    <th style={{ padding: '14px 18px', width: '140px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inc) => {
                    const sevStyle = severityBadgeStyle(inc.severity);
                    const stStyle = statusBadgeStyle(inc.status);
                    const isRunning = runningId === inc.id;

                    return (
                      <tr
                        key={inc.id}
                        onClick={() => navigate(`/incidents/${encodeURIComponent(inc.id)}`)}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'background 120ms ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                      >
                        {/* ID */}
                        <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f172a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                background: '#eff6ff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Zap size={13} color="#2563eb" />
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{inc.id}</span>
                          </div>
                        </td>

                        {/* Title & IOCs */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '3px' }}>
                            {inc.title}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>Source: {inc.source}</span>
                            {inc.iocs.slice(0, 3).map((ioc, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: '10px',
                                  fontFamily: 'var(--font-mono)',
                                  background: '#f1f5f9',
                                  color: '#475569',
                                  borderRadius: '4px',
                                  padding: '1px 6px',
                                }}
                              >
                                {ioc}
                              </span>
                            ))}
                            {inc.iocs.length > 3 && (
                              <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                                +{inc.iocs.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Severity */}
                        <td style={{ padding: '14px 14px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: sevStyle.text,
                              background: sevStyle.bg,
                              border: `1px solid ${sevStyle.border}`,
                              borderRadius: '999px',
                              padding: '2px 8px',
                            }}
                          >
                            ● {inc.severity}
                          </span>
                        </td>

                        {/* Pipeline Stage */}
                        <td style={{ padding: '14px 14px', fontSize: '12px', color: '#475569', fontWeight: 500 }}>
                          {inc.pipelineStage || 'Normalized'}
                        </td>

                        {/* Created Date */}
                        <td style={{ padding: '14px 14px', fontSize: '11.5px', color: '#64748b' }}>
                          {new Date(inc.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 14px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: stStyle.text,
                              background: stStyle.bg,
                              border: `1px solid ${stStyle.border}`,
                              borderRadius: '999px',
                              padding: '2px 8px',
                            }}
                          >
                            {inc.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={(e) => handleRunPipeline(e, inc.id)}
                              disabled={isRunning}
                              title="Run full CyberOrchestra pipeline"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#2563eb',
                                cursor: 'pointer',
                              }}
                            >
                              <Play size={11} className={isRunning ? 'spin-icon' : ''} />
                              {isRunning ? 'Running...' : 'Run Pipeline'}
                            </button>
                            <ChevronRight size={16} color="#94a3b8" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Load Benchmark Modal ─────────────────────────────────────────── */}
        {showScenarioModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                maxWidth: '680px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FolderOpen size={18} color="#2563eb" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                      Load Benchmark Scenario
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>
                      Choose a pre-configured synthetic telemetry dataset to ingest into CyberOrchestra.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowScenarioModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '18px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>

              {scenarioError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#fee2e2',
                    color: '#b91c1c',
                    fontSize: '12px',
                    marginBottom: '14px',
                  }}
                >
                  {scenarioError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {scenarios.map((sc) => (
                  <div
                    key={sc.filename}
                    onClick={() => handleLoadScenario(sc.filename)}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'all 120ms ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#f8fafc',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#eff6ff';
                      e.currentTarget.style.borderColor = '#93c5fd';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                          {sc.incident_id}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: sc.severity === 'critical' ? '#fee2e2' : '#fef3c7',
                            color: sc.severity === 'critical' ? '#dc2626' : '#d97706',
                          }}
                        >
                          {sc.severity.toUpperCase()}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
                        {sc.description}
                      </p>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                        Source: {sc.source} · {sc.indicatorsCount} Indicators · {sc.evidenceCount} Evidence Items
                      </div>
                    </div>
                    <ChevronRight size={18} color="#2563eb" style={{ flexShrink: 0, marginLeft: '12px' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};
