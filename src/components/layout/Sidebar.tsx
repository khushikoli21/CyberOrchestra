import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  PlusCircle,
  Activity,
  Globe,
  RefreshCw,
  FileText,
  BarChart2,
  Shield,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: '/',                    label: 'Overview',              icon: <LayoutDashboard size={18} /> },
  { path: '/incidents',           label: 'Investigations',        icon: <Search size={18} /> },
  { path: '/incidents/new',       label: 'New Investigation',     icon: <PlusCircle size={18} /> },
  { path: '/agent-monitor',       label: 'Agent Monitor',         icon: <Activity size={18} /> },
  { path: '/threat-intelligence', label: 'Threat Intelligence',   icon: <Globe size={18} /> },
  { path: '/recovery-policy',     label: 'Recovery & Policy',     icon: <RefreshCw size={18} /> },
  { path: '/reports',             label: 'Reports',               icon: <FileText size={18} /> },
  { path: '/evaluation',          label: 'Evaluation',            icon: <BarChart2 size={18} /> },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        height: '100vh',
        background: '#0b142f',
        borderRight: '1px solid #152244',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
        overflowY: 'auto',
      }}
    >
      {/* ── Logo / Brand ─────────────────────────── */}
      <div
        style={{
          padding: '20px 20px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        {/* Vibrant Metallic 3D Shield Logo */}
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #38bdf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(37, 99, 235, 0.45)',
            border: '1px solid rgba(147, 197, 253, 0.4)',
            flexShrink: 0,
          }}
        >
          <Shield size={22} color="#ffffff" fill="#2563eb" strokeWidth={2} />
        </div>
        <div>
          <div
            style={{
              fontSize: '17px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              fontFamily: 'var(--font-sans)',
            }}
          >
            CyberOrchestra
          </div>
          <div
            style={{
              fontSize: '11px',
              color: '#8ba1c6',
              fontWeight: 500,
              marginTop: '2px',
            }}
          >
            Security Operations Center
          </div>
        </div>
      </div>

      {/* ── Nav Items ─────────────────────────────── */}
      <nav style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : item.path === '/incidents'
                ? location.pathname === '/incidents'
                : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: isActive ? '#2563eb' : 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '13.5px',
                  transition: 'all 120ms ease',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 2px 10px rgba(37, 99, 235, 0.35)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: isActive ? '#ffffff' : '#94a3b8',
                  }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* ── Bottom Banner Card (Matching Screenshot) ─────────────────── */}
      <div style={{ padding: '16px 14px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #0e1a38 0%, #152652 100%)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '14px',
            padding: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Subtle glowing background highlight */}
          <div
            style={{
              position: 'absolute',
              right: -10,
              bottom: -10,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(37, 99, 235, 0.4) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '9px',
              background: 'rgba(37, 99, 235, 0.2)',
              border: '1px solid rgba(96, 165, 250, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Shield size={20} color="#60a5fa" />
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
              Safer Tomorrow
            </div>
            <div style={{ fontSize: '10.5px', color: '#93a7c7', marginTop: '2px', lineHeight: 1.3 }}>
              Powered by AI. Secured by You.
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
