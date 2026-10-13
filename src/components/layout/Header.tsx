import React, { useState } from 'react';
import { Search, Bell, Moon, Sun, ChevronDown } from 'lucide-react';

interface HeaderProps {
  pageTitle?: string;
  pageSubtitle?: string;
  rightContent?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = () => {
  const [isDark, setIsDark] = useState(false);

  return (
    <header
      style={{
        height: 'var(--header-height)',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* ── Search Bar ────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, maxWidth: '480px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '8px 14px',
            width: '100%',
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
          }}
        >
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search incidents, assets, or queries..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '13px',
              color: '#0f172a',
              width: '100%',
            }}
          />
          <kbd
            style={{
              fontSize: '10.5px',
              fontFamily: 'inherit',
              fontWeight: 600,
              color: '#64748b',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '2px 6px',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            Ctrl + K
          </kbd>
        </div>
      </div>

      {/* ── Right Actions & Profile ────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Notifications"
          style={{
            position: 'relative',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#475569',
            transition: 'background 120ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
        >
          <Bell size={17} />
          {/* Red unread indicator dot */}
          <span
            style={{
              position: 'absolute',
              top: '8px',
              right: '9px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#ef4444',
              border: '1.5px solid #ffffff',
            }}
          />
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          aria-label="Toggle theme"
          onClick={() => setIsDark(!isDark)}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#475569',
            transition: 'background 120ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* User Profile Card (Matching Screenshot: Khushi Koli / Analyst / KK) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '4px 10px 4px 6px',
            borderRadius: '12px',
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'background 120ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {/* Avatar Pill with 'KK' initials */}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)',
            }}
          >
            KK
          </div>

          <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              Khushi Koli
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
              Analyst
            </div>
          </div>

          <ChevronDown size={14} color="#64748b" style={{ marginLeft: '2px' }} />
        </div>
      </div>
    </header>
  );
};
