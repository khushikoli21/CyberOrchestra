import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  Filter,
  LoaderCircle,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  UserCheck,
  Workflow,
  X,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { api, ApiError } from '../services/api';
import type { Incident, IncidentDetail, PolicyReview } from '../types';

type DataRecord = Record<string, unknown>;
type ReviewDecision = PolicyReview['decision'];

const toRecord = (v: unknown): DataRecord | null =>
  v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as DataRecord) : null;
const toList = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const toText = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);

export const RecoveryPolicyPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [detail, setDetail] = useState<IncidentDetail | null>(null);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Review interaction state
  const [reviewingItem, setReviewingItem] = useState<{
    review: PolicyReview;
    decision: 'approved' | 'rejected';
  } | null>(null);
  const [analystNotes, setAnalystNotes] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadIncidents = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const list = await api.getIncidents();
      setIncidents(list);
      if (list.length > 0 && !selectedIncidentId) {
        setSelectedIncidentId(list[0].id);
      }
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Failed to fetch incident directory.');
    } finally {
      setLoadingList(false);
    }
  }, [selectedIncidentId]);

  useEffect(() => {
    void loadIncidents();
  }, [loadIncidents]);

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

  const policyReviews = detail?.policy_reviews ?? [];
  const recoveryPlan = toRecord(detail?.recovery_plan);
  const recoveryActions = toList(recoveryPlan?.recovery_actions);

  // Statistics
  const pendingCount = policyReviews.filter((r) => {
    const dec = String(r.decision).toUpperCase();
    return (dec === 'REQUIRES_APPROVAL' || dec === 'REQUIRES APPROVAL') && r.status === 'Pending';
  }).length;
  const approvedCount = policyReviews.filter(
    (r) => String(r.decision).toUpperCase() === 'APPROVED'
  ).length;
  const rejectedCount = policyReviews.filter(
    (r) => String(r.decision).toUpperCase() === 'REJECTED'
  ).length;
  const totalDecisions = policyReviews.length;

  const handleConfirmDecision = async () => {
    if (!reviewingItem || !selectedIncidentId) return;
    setSubmittingAction(true);
    setError(null);
    try {
      if (reviewingItem.decision === 'approved') {
        await api.approvePolicyReview(reviewingItem.review.id, analystNotes.trim() || undefined);
      } else {
        await api.rejectPolicyReview(reviewingItem.review.id, analystNotes.trim() || undefined);
      }

      setSuccessToast(
        `Action "${reviewingItem.review.action}" successfully recorded as ${reviewingItem.decision.toUpperCase()}.`
      );
      setReviewingItem(null);
      setAnalystNotes('');
      await loadDetail(selectedIncidentId);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Failed to save policy decision.');
    } finally {
      setSubmittingAction(false);
    }
  };

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
              Recovery & Policy Decisions
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              Deterministic compliance enforcement, human-in-the-loop approvals, and prioritized recovery playbooks.
            </p>
          </div>

          {/* Controls: Incident Selector & Refresh */}
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
                disabled={loadingList}
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
                style={{ animation: loadingDetail ? 'spin 1s linear infinite' : 'none' }}
              />
              <span>Refresh Reviews</span>
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div
            style={{
              padding: '12px 18px',
              background: '#dcfce7',
              border: '1px solid #86efac',
              borderRadius: '12px',
              color: '#15803d',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successToast}</span>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div
            style={{
              padding: '12px 18px',
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
          {/* Card 1: Total Policy Decisions */}
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
                Total Policy Rules Checked
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
                <ShieldCheck size={15} color="#2563eb" />
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
              {totalDecisions} Rules Evaluated
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Deterministic gatekeeper active
            </div>
          </div>

          {/* Card 2: Pending Human Review */}
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
                Pending Analyst Approvals
              </span>
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
              {pendingCount} Requiring Action
            </div>
            <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 600, marginTop: '2px' }}>
              High-impact containment guardrails
            </div>
          </div>

          {/* Card 3: Pre-Approved */}
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
                Auto-Approved Actions
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
              {approvedCount} Passed Policy
            </div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
              Safe standard mitigation playbooks
            </div>
          </div>

          {/* Card 4: Blocked / Rejected */}
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
                Blocked / Prohibited
              </span>
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
                <ShieldX size={15} color="#dc2626" />
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#dc2626', marginTop: '6px' }}>
              {rejectedCount} Blocked
            </div>
            <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600, marginTop: '2px' }}>
              Violates security compliance rule
            </div>
          </div>
        </div>

        {/* ── Section 1: Policy Decisions & Human-in-the-Loop ─────────────── */}
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
                Deterministic Policy Compliance Decisions
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Every recovery action must satisfy deterministic organizational policy rules before execution.
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
              Zero Unmonitored Actions
            </span>
          </div>

          {policyReviews.length === 0 && (
            <div
              style={{
                padding: '32px',
                textAlign: 'center',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                fontSize: '13px',
              }}
            >
              No policy decisions recorded for incident {selectedIncidentId}. Run the pipeline to evaluate containment proposals.
            </div>
          )}

          {/* Policy Decision Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {policyReviews.map((review, idx) => {
              const dec = String(review.decision).toUpperCase();
              const isPending =
                (dec === 'REQUIRES_APPROVAL' || dec === 'REQUIRES APPROVAL') && review.status === 'Pending';
              const isApproved = dec === 'APPROVED' || review.status === 'Approved';
              const isRejected = dec === 'REJECTED' || review.status === 'Rejected';

              return (
                <div
                  key={idx}
                  style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: isPending
                      ? '1.5px solid #fde68a'
                      : isApproved
                      ? '1px solid #bbf7d0'
                      : '1px solid #fecaca',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {/* Top Bar with Status & Rule ID */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '99px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: isPending
                            ? '#fef3c7'
                            : isApproved
                            ? '#dcfce7'
                            : '#fee2e2',
                          color: isPending
                            ? '#b45309'
                            : isApproved
                            ? '#15803d'
                            : '#dc2626',
                          border: `1px solid ${
                            isPending ? '#fde68a' : isApproved ? '#86efac' : '#fca5a5'
                          }`,
                        }}
                      >
                        {isPending && <Clock size={11} />}
                        {isApproved && <CheckCircle2 size={11} />}
                        {isRejected && <ShieldX size={11} />}
                        {review.decision}
                      </span>

                      <code
                        style={{
                          fontSize: '11px',
                          color: '#2563eb',
                          background: '#eff6ff',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid #bfdbfe',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                        }}
                      >
                        {review.policy_rule_id || 'RULE-POL-STANDARD'}
                      </code>
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Analyst Review:{' '}
                      <strong
                        style={{
                          color: isPending ? '#d97706' : isApproved ? '#059669' : '#dc2626',
                        }}
                      >
                        {review.status || 'Decided'}
                      </strong>
                    </div>
                  </div>

                  {/* Proposed Action Heading */}
                  <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
                    {review.action}
                  </h3>

                  {/* Policy Decision Rationale */}
                  <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.5 }}>
                    <strong style={{ color: '#0f172a' }}>Compliance Rationale: </strong>
                    {review.reason || 'Conforms with internal security recovery criteria.'}
                  </div>

                  {/* Supporting Evidence IDs */}
                  {review.supporting_evidence_ids && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                        Grounding Evidence:
                      </span>
                      {toList(review.supporting_evidence_ids).map((eid, eidx) => (
                        <span
                          key={eidx}
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#1d4ed8',
                            fontSize: '10.5px',
                            fontFamily: 'monospace',
                            fontWeight: 600,
                          }}
                        >
                          {String(eid)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Interactive Decision Actions if Pending */}
                  {isPending && (
                    <div
                      style={{
                        marginTop: '6px',
                        paddingTop: '10px',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '10px',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setReviewingItem({ review, decision: 'rejected' })
                        }
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: '#ffffff',
                          border: '1px solid #fca5a5',
                          color: '#dc2626',
                          cursor: 'pointer',
                        }}
                      >
                        <ShieldX size={14} />
                        <span>Reject Action</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setReviewingItem({ review, decision: 'approved' })
                        }
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 16px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: '#059669',
                          border: 'none',
                          color: '#ffffff',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
                        }}
                      >
                        <CheckCircle2 size={14} />
                        <span>Approve Action</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Section 2: Formulated Recovery Playbook Actions ─────────────── */}
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
                Recommended Recovery Playbook Actions
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Synthesized by the Recovery Planning Agent with prioritized containment and eradication steps.
              </p>
            </div>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#059669',
                background: '#ecfdf5',
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid #a7f3d0',
              }}
            >
              {recoveryActions.length} Step Playbook
            </span>
          </div>

          {recoveryActions.length === 0 && (
            <div
              style={{
                padding: '32px',
                textAlign: 'center',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                fontSize: '13px',
              }}
            >
              No recovery actions compiled for incident {selectedIncidentId}.
            </div>
          )}

          {/* Recovery Action Step Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {recoveryActions.map((item, index) => {
              const act = toRecord(item) || {};
              const actionName = toText(act.recovery_action) || 'Recovery Action Step';
              const priority = toText(act.action_priority) || 'HIGH';
              const rationale = toText(act.rationale);
              const outcome = toText(act.expected_outcome);
              const risks = toList(act.risks);

              return (
                <div
                  key={index}
                  style={{
                    background: '#f8fafc',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                  }}
                >
                  {/* Step Number Circle */}
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      color: '#2563eb',
                      fontWeight: 800,
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                        {actionName}
                      </h4>

                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background:
                            priority.toLowerCase() === 'critical'
                              ? '#fee2e2'
                              : priority.toLowerCase() === 'high'
                              ? '#ffedd5'
                              : '#eff6ff',
                          color:
                            priority.toLowerCase() === 'critical'
                              ? '#dc2626'
                              : priority.toLowerCase() === 'high'
                              ? '#ea580c'
                              : '#2563eb',
                          border: `1px solid ${
                            priority.toLowerCase() === 'critical'
                              ? '#fca5a5'
                              : priority.toLowerCase() === 'high'
                              ? '#fdba74'
                              : '#bfdbfe'
                          }`,
                        }}
                      >
                        {priority} PRIORITY
                      </span>
                    </div>

                    {rationale && (
                      <div
                        style={{
                          marginTop: '8px',
                          fontSize: '12.5px',
                          color: '#475569',
                          lineHeight: 1.5,
                        }}
                      >
                        <strong style={{ color: '#0f172a' }}>Why Recommended: </strong>
                        {rationale}
                      </div>
                    )}

                    {outcome && (
                      <div
                        style={{
                          marginTop: '6px',
                          fontSize: '12.5px',
                          color: '#059669',
                          lineHeight: 1.5,
                        }}
                      >
                        <strong>Expected Outcome: </strong>
                        {outcome}
                      </div>
                    )}

                    {risks.length > 0 && (
                      <div
                        style={{
                          marginTop: '8px',
                          fontSize: '11.5px',
                          color: '#b45309',
                          background: '#fffbeb',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #fde68a',
                        }}
                      >
                        <strong>Operational Risks: </strong>
                        {risks.map(String).join('; ')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Review Confirmation Modal ───────────────────────────────────── */}
        {reviewingItem && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                maxWidth: '520px',
                width: '100%',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background:
                        reviewingItem.decision === 'approved' ? '#dcfce7' : '#fee2e2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {reviewingItem.decision === 'approved' ? (
                      <CheckCircle2 size={18} color="#059669" />
                    ) : (
                      <ShieldX size={18} color="#dc2626" />
                    )}
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                    Confirm Action {reviewingItem.decision.toUpperCase()}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setReviewingItem(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                You are about to record a human policy review decision for:
                <div
                  style={{
                    fontWeight: 700,
                    color: '#0f172a',
                    marginTop: '6px',
                    padding: '8px 12px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {reviewingItem.review.action}
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#475569',
                    marginBottom: '6px',
                  }}
                >
                  Analyst Rationale / Notes (Optional):
                </label>
                <textarea
                  rows={3}
                  value={analystNotes}
                  onChange={(e) => setAnalystNotes(e.target.value)}
                  placeholder="e.g. Host verified isolated via EDR console; approved for quarantine."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12.5px',
                    color: '#0f172a',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  paddingTop: '8px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setReviewingItem(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={handleConfirmDecision}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background:
                      reviewingItem.decision === 'approved' ? '#059669' : '#dc2626',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {submittingAction && (
                    <LoaderCircle size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  )}
                  <span>Confirm {reviewingItem.decision.toUpperCase()}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};
