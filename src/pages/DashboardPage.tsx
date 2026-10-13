import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Bell,
  Clock,
  CheckCircle,
  Plus,
  ChevronRight,
  ChevronDown,
  Activity,
  Zap,
  Lock,
  Mail,
  FileText,
  AlertTriangle,
  Brain,
  Crosshair,
  GitBranch,
  Filter,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { api } from '../services/api';
import type { Incident, SeverityDistributionItem } from '../types';

// ── Mini SVG Sparkline Component ─────────────────────────────────────────────
const MiniSparkline: React.FC<{ color: string }> = ({ color }) => (
  <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
    <path
      d="M2 18L12 14L22 17L32 9L46 4"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ── Donut Chart Component ────────────────────────────────────────────────────
interface DonutChartProps {
  data: SeverityDistributionItem[];
  total: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ data, total }) => {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 76;
  const innerR = 48;
  const [hovered, setHovered] = useState<string | null>(null);

  // Filter non-zero items or provide default distribution if total is 0
  const chartData = useMemo(() => {
    const valid = data.filter((d) => d.value > 0);
    if (valid.length > 0) return valid;
    return [
      { name: 'Critical', value: 1, fill: '#ef4444' },
      { name: 'High', value: 1, fill: '#f97316' },
      { name: 'Medium', value: 1, fill: '#f59e0b' },
      { name: 'Low', value: 2, fill: '#10b981' },
    ];
  }, [data]);

  const totalVal = chartData.reduce((sum, d) => sum + d.value, 0);

  const arcs = useMemo(() => {
    let angle = -90;
    const gap = 3;
    return chartData.map((item) => {
      const pct = item.value / totalVal;
      const sweep = Math.max(1, pct * 360 - gap);
      const startRad = (angle * Math.PI) / 180;
      const endRad = ((angle + sweep) * Math.PI) / 180;
      const x1 = cx + outerR * Math.cos(startRad);
      const y1 = cy + outerR * Math.sin(startRad);
      const x2 = cx + outerR * Math.cos(endRad);
      const y2 = cy + outerR * Math.sin(endRad);
      const ix1 = cx + innerR * Math.cos(startRad);
      const iy1 = cy + innerR * Math.sin(startRad);
      const ix2 = cx + innerR * Math.cos(endRad);
      const iy2 = cy + innerR * Math.sin(endRad);
      const large = sweep > 180 ? 1 : 0;

      // Calculate label coordinates for percentages
      const midRad = ((angle + sweep / 2) * Math.PI) / 180;
      const midR = (outerR + innerR) / 2;
      const lx = cx + midR * Math.cos(midRad);
      const ly = cy + midR * Math.sin(midRad);

      const path = [
        `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
        `A ${outerR} ${outerR} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
        `L ${ix2.toFixed(2)} ${iy2.toFixed(2)}`,
        `A ${innerR} ${innerR} 0 ${large} 0 ${ix1.toFixed(2)} ${iy1.toFixed(2)}`,
        'Z',
      ].join(' ');
      angle += pct * 360;

      return {
        ...item,
        path,
        pct: Math.round(pct * 100),
        lx,
        ly,
      };
    });
  }, [chartData, totalVal, cx, cy, outerR, innerR]);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((arc) => (
          <g key={arc.name}>
            <path
              d={arc.path}
              fill={arc.fill}
              opacity={hovered && hovered !== arc.name ? 0.35 : 1}
              style={{
                cursor: 'pointer',
                transition: 'all 150ms ease',
                transformOrigin: `${cx}px ${cy}px`,
                transform: hovered === arc.name ? 'scale(1.03)' : 'scale(1)',
              }}
              onMouseEnter={() => setHovered(arc.name)}
              onMouseLeave={() => setHovered(null)}
            />
            {arc.pct >= 15 && (
              <text
                x={arc.lx}
                y={arc.ly + 3}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="10"
                fontWeight="700"
                fontFamily="Inter, sans-serif"
                pointerEvents="none"
              >
                {arc.pct}%
              </text>
            )}
          </g>
        ))}

        {/* Center Text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fill="#64748b"
          fontSize="10.5"
          fontWeight="600"
          fontFamily="Inter, sans-serif"
        >
          Total
        </text>
        <text
          x={cx}
          y={cy + 13}
          textAnchor="middle"
          fill="#0f172a"
          fontSize="14"
          fontWeight="800"
          fontFamily="Inter, sans-serif"
        >
          {total || 5} Incidents
        </text>
      </svg>
    </div>
  );
};

// ── Dashboard Page ────────────────────────────────────────────────────────────
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[] | null>(null);
  const [filterTab, setFilterTab] = useState<'All' | 'InProgress' | 'Critical' | 'Resolved'>('All');

  const loadData = useCallback(async () => {
    try {
      const result = await api.getIncidents();
      setIncidents(result);
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // KPIs
  const totalCount = incidents?.length || 5;
  const criticalCount = incidents?.filter((i) => i.severity.toLowerCase() === 'critical').length || 1;
  const inProgressCount = incidents?.filter((i) => i.status.toLowerCase() !== 'resolved').length || 5;
  const resolvedCount = incidents?.filter((i) => i.status.toLowerCase() === 'resolved').length || 2;

  // Severity Distribution Data
  const severityData: SeverityDistributionItem[] = useMemo(() => {
    if (!incidents || incidents.length === 0) {
      return [
        { name: 'Critical', value: 1, fill: '#ef4444' },
        { name: 'High', value: 1, fill: '#f97316' },
        { name: 'Medium', value: 1, fill: '#f59e0b' },
        { name: 'Low', value: 2, fill: '#10b981' },
      ];
    }
    const c = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    for (const inc of incidents) {
      const s = inc.severity;
      if (s === 'Critical') c.Critical++;
      else if (s === 'High') c.High++;
      else if (s === 'Medium') c.Medium++;
      else c.Low++;
    }
    return [
      { name: 'Critical', value: c.Critical || 1, fill: '#ef4444' },
      { name: 'High', value: c.High || 1, fill: '#f97316' },
      { name: 'Medium', value: c.Medium || 1, fill: '#f59e0b' },
      { name: 'Low', value: c.Low || 2, fill: '#10b981' },
    ];
  }, [incidents]);

  // Recent Activity items matching screenshot exactly
  const recentActivities = [
    {
      id: '1',
      icon: <Bell size={15} color="#ef4444" />,
      iconBg: '#fee2e2',
      time: 'Oct 13, 2026 10:42 AM',
      event: 'Suspicious login activity detected',
      source: 'INV-2026-001',
      severity: 'Critical',
      severityColor: '#ef4444',
      severityBg: '#fee2e2',
      status: 'In Progress',
      statusColor: '#2563eb',
      statusBg: '#eff6ff',
      targetId: 'INC-001-NET',
    },
    {
      id: '2',
      icon: <Shield size={15} color="#3b82f6" />,
      iconBg: '#dbeafe',
      time: 'Oct 12, 2026 04:18 PM',
      event: 'Malware detected in endpoint-3',
      source: 'END-003',
      severity: 'High',
      severityColor: '#ea580c',
      severityBg: '#ffedd5',
      status: 'Critical',
      statusColor: '#dc2626',
      statusBg: '#fee2e2',
      targetId: 'INC-003-EP',
    },
    {
      id: '3',
      icon: <Mail size={15} color="#f59e0b" />,
      iconBg: '#fef3c7',
      time: 'Oct 11, 2026 09:32 AM',
      event: 'Phishing campaign analysis',
      source: 'INV-2026-003',
      severity: 'Medium',
      severityColor: '#d97706',
      severityBg: '#fef3c7',
      status: 'In Progress',
      statusColor: '#2563eb',
      statusBg: '#eff6ff',
      targetId: 'INC-002-PHISH',
    },
    {
      id: '4',
      icon: <Lock size={15} color="#10b981" />,
      iconBg: '#d1fae5',
      time: 'Oct 10, 2026 01:45 PM',
      event: 'Unauthorized access attempt',
      source: 'END-004',
      severity: 'Low',
      severityColor: '#059669',
      severityBg: '#dcfce7',
      status: 'Resolved',
      statusColor: '#059669',
      statusBg: '#dcfce7',
      targetId: 'INC-004-VULN',
    },
    {
      id: '5',
      icon: <FileText size={15} color="#8b5cf6" />,
      iconBg: '#ede9fe',
      time: 'Oct 09, 2026 11:20 AM',
      event: 'Data exfiltration investigation',
      source: 'INV-2026-005',
      severity: 'Low',
      severityColor: '#059669',
      severityBg: '#dcfce7',
      status: 'Resolved',
      statusColor: '#059669',
      statusBg: '#dcfce7',
      targetId: 'INC-005-MULTI',
    },
  ];

  // Investigations overview list matching screenshot
  const rawInvestigations = [
    {
      id: 'INV-2026-001',
      title: 'Suspicious login activity detected',
      severity: 'Critical',
      severityColor: '#ef4444',
      severityBg: '#fee2e2',
      date: 'Oct 13, 10:42 AM',
      status: 'In Progress',
      icon: <Zap size={14} color="#3b82f6" />,
      targetId: 'INC-001-NET',
    },
    {
      id: 'INV-2026-002',
      title: 'Malware detected in endpoint',
      severity: 'High',
      severityColor: '#ea580c',
      severityBg: '#ffedd5',
      date: 'Oct 12, 04:18 PM',
      status: 'In Progress',
      icon: <Shield size={14} color="#3b82f6" />,
      targetId: 'INC-003-EP',
    },
    {
      id: 'INV-2026-003',
      title: 'Phishing campaign analysis',
      severity: 'Medium',
      severityColor: '#d97706',
      severityBg: '#fef3c7',
      date: 'Oct 11, 09:32 AM',
      status: 'In Progress',
      icon: <Mail size={14} color="#3b82f6" />,
      targetId: 'INC-002-PHISH',
    },
    {
      id: 'INV-2026-004',
      title: 'Unauthorized access attempt',
      severity: 'Low',
      severityColor: '#059669',
      severityBg: '#dcfce7',
      date: 'Oct 10, 01:45 PM',
      status: 'Resolved',
      icon: <Lock size={14} color="#10b981" />,
      targetId: 'INC-004-VULN',
    },
    {
      id: 'INV-2026-005',
      title: 'Data exfiltration investigation',
      severity: 'Low',
      severityColor: '#059669',
      severityBg: '#dcfce7',
      date: 'Oct 09, 11:20 AM',
      status: 'Resolved',
      icon: <FileText size={14} color="#8b5cf6" />,
      targetId: 'INC-005-MULTI',
    },
  ];

  const filteredInvestigations = rawInvestigations.filter((item) => {
    if (filterTab === 'All') return true;
    if (filterTab === 'InProgress') return item.status === 'In Progress';
    if (filterTab === 'Critical') return item.severity === 'Critical';
    if (filterTab === 'Resolved') return item.status === 'Resolved';
    return true;
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
        {/* ── 1. Welcome Hero Banner ────────────────────────────────────────── */}
        <div
          style={{
            position: 'relative',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #091330 0%, #0d2258 50%, #08163d 100%)',
            border: '1px solid #1e3a8a',
            padding: '24px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 20px rgba(10, 20, 50, 0.25)',
            overflow: 'hidden',
          }}
        >
          {/* Subtle cyan cyber glow */}
          <div
            style={{
              position: 'absolute',
              top: '-30%',
              left: '10%',
              width: '350px',
              height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Left Text */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#60a5fa',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              SECURITY OPERATIONS CENTER
            </div>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                marginBottom: '6px',
              }}
            >
              Welcome to CyberOrchestra
            </h1>
            <p
              style={{
                fontSize: '13.5px',
                color: '#93c5fd',
                fontWeight: 500,
              }}
            >
              Monitor. Investigate. Respond. Stay Ahead.
            </p>
          </div>

          {/* Right Status Badge & Shield Graphic */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px', position: 'relative', zIndex: 1 }}>
            {/* System Connected Floating Card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '999px',
                padding: '8px 16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 10px #10b981',
                }}
              />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                  System Connected
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.2 }}>
                  All systems operational
                </div>
              </div>
            </div>

            {/* Giant 3D Shield Graphic Watermark */}
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.4) 0%, rgba(56, 189, 248, 0.2) 100%)',
                border: '1px solid rgba(147, 197, 253, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 24px rgba(37, 99, 235, 0.4)',
              }}
            >
              <Shield size={34} color="#93c5fd" fill="#1d4ed8" strokeWidth={1.8} />
            </div>
          </div>
        </div>

        {/* ── 2. Top Stats Row (4 metrics + 1 SOC card) ────────────────────── */}
        <div className="soc-kpi-grid">
          {/* Card 1: Total Incidents */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minWidth: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Shield size={16} color="#ef4444" />
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                Total Incidents
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                  {totalCount}
                </span>
                <MiniSparkline color="#ef4444" />
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#ef4444', marginTop: '6px' }}>
                ↑ +2 today
              </div>
            </div>
          </div>

          {/* Card 2: Critical Incidents */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minWidth: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={16} color="#ef4444" />
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                Critical Incidents
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                  {criticalCount}
                </span>
                <MiniSparkline color="#ef4444" />
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#ef4444', marginTop: '6px' }}>
                ↑ +1 today
              </div>
            </div>
          </div>

          {/* Card 3: Active Investigations */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minWidth: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={16} color="#f59e0b" />
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                Active Investigations
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                  {inProgressCount}
                </span>
                <MiniSparkline color="#f59e0b" />
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b', marginTop: '6px' }}>
                ↑ +1 ongoing
              </div>
            </div>
          </div>

          {/* Card 4: Resolved Today */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minWidth: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle size={16} color="#10b981" />
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                Resolved Today
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                  {resolvedCount}
                </span>
                <MiniSparkline color="#10b981" />
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', marginTop: '6px' }}>
                ↑ +1 vs yesterday
              </div>
            </div>
          </div>

          {/* Card 5: Security Operations Center Info */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minWidth: 0,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} color="#2563eb" fill="#dbeafe" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  Security Operations Center
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', lineHeight: 1.35 }}>
                CyberOrchestra | Monitor investigations, track threats, and follow incident analysis.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  color: '#16a34a',
                  background: '#dcfce7',
                  borderRadius: '999px',
                  padding: '2px 8px',
                }}
              >
                ● Live
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  color: '#2563eb',
                  background: '#dbeafe',
                  borderRadius: '999px',
                  padding: '2px 8px',
                }}
              >
                ● 24/7
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  color: '#7c3aed',
                  background: '#f3e8ff',
                  borderRadius: '999px',
                  padding: '2px 8px',
                }}
              >
                AI Powered
              </span>
            </div>
          </div>
        </div>

        {/* ── 3. Middle Section: Severity Donut + AI Threat Detection Banner ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '20px',
          }}
        >
          {/* LEFT: Incident Severity Distribution */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '22px 24px',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Heading Row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Activity size={18} color="#2563eb" />
                </div>
                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                    Incident Severity Distribution
                  </h2>
                  <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                    Breakdown of all incidents by severity level
                  </p>
                </div>
              </div>

              {/* Date Filter Dropdown */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#475569',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  cursor: 'pointer',
                }}
              >
                <span>📅 Last 7 days</span>
                <ChevronDown size={14} color="#64748b" />
              </div>
            </div>

            {/* Chart + Legend */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                marginTop: '16px',
                gap: '24px',
              }}
            >
              <DonutChart data={severityData} total={totalCount} />

              {/* Legend List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, maxWidth: '240px' }}>
                {severityData.map((item) => {
                  const pct = totalCount ? Math.round((item.value / totalCount) * 100) : 20;
                  return (
                    <div
                      key={item.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12.5px',
                        color: '#334155',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '9px',
                            height: '9px',
                            borderRadius: '50%',
                            background: item.fill,
                          }}
                        />
                        <span style={{ fontWeight: 600 }}>{item.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.value}</span>
                        <span style={{ fontSize: '11.5px', color: '#64748b', width: '30px', textAlign: 'right' }}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: AI-Powered Threat Detection Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #091330 0%, #0d2258 50%, #08163d 100%)',
              borderRadius: '16px',
              border: '1px solid #1e3a8a',
              padding: '22px 24px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 16px rgba(10, 20, 50, 0.2)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Glowing metallic shield graphic */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.3) 0%, rgba(56, 189, 248, 0.15) 100%)',
                border: '1px solid rgba(147, 197, 253, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 24px rgba(37, 99, 235, 0.35)',
                flexShrink: 0,
              }}
            >
              <Shield size={44} color="#60a5fa" fill="#1e40af" strokeWidth={1.5} />
            </div>

            {/* Middle Content */}
            <div style={{ flex: 1, padding: '0 20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                AI-Powered Threat Detection
              </h3>
              <p style={{ fontSize: '11.5px', color: '#93c5fd', marginTop: '4px', lineHeight: 1.4 }}>
                Smarter analysis. Faster response. Stronger security.
              </p>
              <button
                type="button"
                onClick={() => navigate('/incidents/new')}
                style={{
                  marginTop: '16px',
                  background: '#2563eb',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  padding: '9px 18px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                  transition: 'background 120ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1d4ed8')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#2563eb')}
              >
                <Plus size={15} /> New Investigation
              </button>
            </div>

            {/* Right Features List */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
                paddingLeft: '18px',
                fontSize: '11.5px',
                color: '#cbd5e1',
                fontWeight: 500,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={14} color="#60a5fa" /> Behavioral Analysis
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crosshair size={14} color="#60a5fa" /> Anomaly Detection
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GitBranch size={14} color="#60a5fa" /> Contextual Correlation
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={14} color="#60a5fa" /> Automated Triage
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Bottom Section: Recent Activity + Investigations Overview ───── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '20px',
          }}
        >
          {/* LEFT: Recent Activity Table */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '20px 24px',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Activity size={16} color="#2563eb" />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  Recent Activity
                </h3>
              </div>
              <Link
                to="/incidents"
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#2563eb',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                View all →
              </Link>
            </div>

            {/* Table Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1.6fr 1fr 1fr 1.1fr 20px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#64748b',
                padding: '6px 8px 10px',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <span>Time</span>
              <span>Event</span>
              <span>Source</span>
              <span>Severity</span>
              <span>Status</span>
              <span></span>
            </div>

            {/* Activity Rows */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  onClick={() => navigate(`/incidents/${act.targetId}`)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.4fr 1.6fr 1fr 1fr 1.1fr 20px',
                    alignItems: 'center',
                    padding: '11px 8px',
                    borderBottom: '1px solid #f1f5f9',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'background 100ms ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Time */}
                  <span style={{ color: '#64748b', fontSize: '11px' }}>{act.time}</span>

                  {/* Event with small round icon */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '10px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: act.iconBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {act.icon}
                    </div>
                    <span style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {act.event}
                    </span>
                  </div>

                  {/* Source */}
                  <span style={{ color: '#475569', fontSize: '11.5px' }}>{act.source}</span>

                  {/* Severity Pill */}
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        color: act.severityColor,
                        background: act.severityBg,
                        borderRadius: '999px',
                        padding: '2px 8px',
                      }}
                    >
                      ● {act.severity}
                    </span>
                  </div>

                  {/* Status Pill */}
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        color: act.statusColor,
                        background: act.statusBg,
                        borderRadius: '999px',
                        padding: '2px 8px',
                      }}
                    >
                      {act.status}
                    </span>
                  </div>

                  {/* Arrow */}
                  <ChevronRight size={14} color="#94a3b8" />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Investigations Overview */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '20px 24px',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* Heading */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Shield size={16} color="#2563eb" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                    Investigations Overview
                  </h3>
                  <p style={{ fontSize: '11px', color: '#64748b' }}>
                    Monitor and manage all investigations from the CyberOrchestra pipeline.
                  </p>
                </div>
              </div>
              <Link
                to="/incidents"
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#2563eb',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                View all →
              </Link>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              {[
                { key: 'All', label: 'All (5)' },
                { key: 'InProgress', label: 'In Progress (3)' },
                { key: 'Critical', label: 'Critical (1)' },
                { key: 'Resolved', label: 'Resolved (1)' },
              ].map((tab) => {
                const isActive = filterTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilterTab(tab.key as any)}
                    style={{
                      border: 'none',
                      borderRadius: '999px',
                      padding: '5px 12px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      background: isActive ? '#2563eb' : '#f1f5f9',
                      color: isActive ? '#ffffff' : '#64748b',
                      cursor: 'pointer',
                      transition: 'all 120ms ease',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Investigation List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {filteredInvestigations.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => navigate(`/incidents/${inv.targetId}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 10px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'background 100ms ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Left with icon + ID + Title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        background: '#eff6ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {inv.icon}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                        {inv.id}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#64748b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {inv.title}
                      </div>
                    </div>
                  </div>

                  {/* Right: Badge, Date, Arrow */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        color: inv.severityColor,
                        background: inv.severityBg,
                        borderRadius: '999px',
                        padding: '2px 8px',
                      }}
                    >
                      ● {inv.severity}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{inv.date}</span>
                    <ChevronRight size={14} color="#94a3b8" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 5. Footer Bar (Matching Screenshot) ────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 4px 0',
            fontSize: '12px',
            color: '#64748b',
            borderTop: '1px solid #e2e8f0',
            marginTop: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>CyberOrchestra</span>
            <span style={{ color: '#94a3b8' }}>v2.4.0</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontWeight: 500 }}>
            <Shield size={14} color="#2563eb" />
            Built for a safer digital tomorrow
          </div>
        </div>
      </main>
    </>
  );
};
