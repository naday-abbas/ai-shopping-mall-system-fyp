import React, { useState } from 'react';
import './index.css';
import { AuthProvider, useAuth, LoginPage } from './Auth';
import OverviewPage from './pages/OverviewPage';
import ContentPage from './pages/ContentPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CouponsPage from './pages/CouponsPage';

const NAV = [
  { id: 'overview',   icon: '📊', label: 'Overview'     },
  { id: 'analytics',  icon: '📈', label: 'Analytics'    },
  { id: 'content',    icon: '🖼️',  label: 'Content'     },
  { id: 'coupons',    icon: '🎟️',  label: 'Coupons'     },
];

function Sidebar({ active, setActive, user, onLogout }) {
  return (
    <div style={{
      width: 230, minHeight: '100vh', background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: '1.6rem' }}>🛍️</div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>Smart Mall</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', fontWeight: 600, letterSpacing: '0.1em' }}>ADMIN PANEL</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {NAV.map(item => (
          <button key={item.id} onClick={() => setActive(item.id)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 14px', borderRadius: 8, marginBottom: 4,
            background: active === item.id ? 'rgba(59,130,246,0.15)' : 'transparent',
            border: active === item.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
            color: active === item.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
            fontFamily: 'var(--font-sans)', fontSize: '0.88rem', fontWeight: active === item.id ? 600 : 400,
            cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
          }}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
        </div>
        <button onClick={onLogout} style={{
          width: '100%', padding: '8px', borderRadius: 6,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#f87171', fontFamily: 'var(--font-sans)', fontSize: '0.8rem',
          cursor: 'pointer', transition: 'all 0.15s',
        }}>Sign Out</button>
      </div>
    </div>
  );
}

function Dashboard() {
  const [page, setPage] = useState('overview');

  // MANUALLY ADD THIS MOCK DATA:
  const user = { name: "Admin Demo", email: "admin@smartmall.com" };
  const logout = () => { window.location.reload(); }; // Simple reset for logout

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar active={page} setActive={setPage} user={user} onLogout={logout} />
      <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-base)' }}>
        {page === 'overview'  && <OverviewPage />}
        {page === 'analytics' && <AnalyticsPage />}
        {page === 'content'   && <ContentPage />}
        {page === 'coupons'   && <CouponsPage />}
      </main>
    </div>
  );
}

function AppInner() {
  // We ignore the token and go straight to the Dashboard
  return <Dashboard />;
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}
