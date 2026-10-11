import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
LayoutDashboard,
BarChart2,
Image,
Ticket,
LogOut,
ShoppingBag,
MessageSquare,
CalendarDays,
HelpCircle,
} from 'lucide-react';
import './dashboard.css';
import OverviewPage from './OverviewPage';
import AnalyticsPage from './AnalyticsPage';
import ContentPage from './ContentPage';
import CouponsPage from './CouponsPage';
import FeedbackPage from './FeedbackPage';
import EventsPage from './EventsPage';
import HelpPage from './HelpPage';

type NavItem = {
id: string;
Icon: typeof LayoutDashboard;
label: string;
};

type SidebarProps = {
active: string;
setActive: Dispatch<SetStateAction<string>>;
onLogout: () => void;
};

const NAV: NavItem[] = [
{ id: 'overview', Icon: LayoutDashboard, label: 'Overview' },
{ id: 'analytics', Icon: BarChart2, label: 'Analytics' },
{ id: 'content', Icon: Image, label: 'Content' },
{ id: 'coupons', Icon: Ticket, label: 'Coupons' },
{ id: 'events', Icon: CalendarDays, label: 'Events' },
{ id: 'feedback', Icon: MessageSquare, label: 'Feedback' },
{ id: 'help', Icon: HelpCircle, label: 'Help' },
];


function Sidebar({ active, setActive, onLogout }: SidebarProps) {
    return (
    <div className="db-sidebar">
      {/* Logo */}
      <div className="db-logo-area">
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div className="db-logo-icon">
            <ShoppingBag size={20} color="#f0abfc" strokeWidth={1.6} />
          </div>
          <div>
            <div style={{
              fontSize: '0.95rem', fontWeight: 800, fontFamily: 'var(--font-sans)',
              background: 'linear-gradient(90deg, #f472b6, #67e8f9)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Smart Mall
            </div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(6,182,212,0.7)', fontWeight: 700, letterSpacing: '0.2em', fontFamily: 'var(--font-sans)', marginTop: 1 }}>
              ADMIN PANEL
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="db-nav">
        <div className="db-nav-section">Navigation</div>
        {NAV.map(({ id, Icon, label }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`db-nav-btn${active === id ? ' active' : ''}`}
          >
            <Icon size={15} strokeWidth={active === id ? 2.2 : 1.8} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* User + logout */}
      <div className="db-user-area">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
          <div className="db-avatar">A</div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-sans)' }}>Admin</div>
            <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-mono)' }}>admin@smartmall.com</div>
          </div>
          <span className="db-online-dot" style={{ marginLeft: 'auto' }} />
        </div>
        <button className="db-logout-btn" onClick={onLogout}>
          <LogOut size={13} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [page, setPage] = useState('overview');

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/admin/login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)', position: 'relative' }}>

      {/* ── Animated background blobs (same as ScanPage/GamePage) ── */}
      <div className="db-blob db-blob-1" />
      <div className="db-blob db-blob-2" />
      <div className="db-blob db-blob-3" />

      {/* ── Mesh grid overlay ── */}
      <div className="db-mesh" />

      {/* ── Corner accent brackets ── */}
      <div className="db-corner db-corner-tl" />
      <div className="db-corner db-corner-tr" />
      <div className="db-corner db-corner-bl" />
      <div className="db-corner db-corner-br" />

      <Sidebar active={page} setActive={setPage} onLogout={handleLogout} />

      <main style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1 }}>
        {page === 'overview'  && <OverviewPage  />}
        {page === 'analytics' && <AnalyticsPage />}
        {page === 'content'   && <ContentPage   />}
        {page === 'coupons'   && <CouponsPage   />}
        {page === 'events'    && <EventsPage    />}
        {page === 'feedback'  && <FeedbackPage  />}
        {page === 'help'      && <HelpPage      />}
      </main>
    </div>
  );
}
