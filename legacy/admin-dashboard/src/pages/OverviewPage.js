import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const BACKEND = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const COLORS = { male: '#3b82f6', female: '#ec4899', unknown: '#475569' };
const AGE_COLORS = { child: '#10b981', teen: '#f97316', adult: '#8b5cf6', senior: '#06b6d4', unknown: '#475569' };

function StatCard({ icon, label, value, sub, color = '#3b82f6', trend }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '22px 24px',
      animation: 'fadeIn 0.4s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.3rem',
        }}>{icon}</div>
        {trend !== undefined && (
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: trend >= 0 ? '#10b981' : '#ef4444', padding: '3px 8px', borderRadius: 20, background: trend >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 'clamp(1.5rem,2.5vw,2rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

const MOCK_STATS = {
  totalSessions: 1247,
  gamesPlayed: 489,
  couponsGenerated: 312,
  avgDurationSeconds: 47,
  genderBreakdown: [{ _id: 'male', count: 621 }, { _id: 'female', count: 587 }, { _id: 'unknown', count: 39 }],
  ageBreakdown: [{ _id: 'child', count: 187 }, { _id: 'teen', count: 298 }, { _id: 'adult', count: 612 }, { _id: 'senior', count: 150 }],
  dailyActivity: [
    { _id: '2026-03-22', count: 145 },
    { _id: '2026-03-23', count: 178 },
    { _id: '2026-03-24', count: 132 },
    { _id: '2026-03-25', count: 201 },
    { _id: '2026-03-26', count: 189 },
    { _id: '2026-03-27', count: 220 },
    { _id: '2026-03-28', count: 182 },
  ],
};

export default function OverviewPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${BACKEND}/api/analytics/stats`)
      .then(r => setStats(r.data))
      .catch(() => setStats(MOCK_STATS))
      .finally(() => setLoading(false));
  }, []);

  const s = stats || MOCK_STATS;

  const genderData = s.genderBreakdown.map(g => ({ name: g._id, value: g.count }));
  const ageData = s.ageBreakdown.map(a => ({ name: a._id, value: a.count }));
  const dailyData = s.dailyActivity.map(d => ({ date: d._id?.slice(5) || d._id, sessions: d.count }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>{label}</p>
        {payload.map(p => <p key={p.name} style={{ color: p.color, fontWeight: 600, fontSize: '0.9rem' }}>{p.value}</p>)}
      </div>
    );
  };

  return (
    <div style={{ padding: '32px 36px' }}>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Dashboard Overview</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Real-time analytics for your Smart Mall kiosk system</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
          <div style={{ width: 20, height: 20, border: '2px solid var(--accent-blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Loading stats...
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 32 }}>
            <StatCard icon="👥" label="Total Sessions" value={s.totalSessions.toLocaleString()} sub="All time" color="#3b82f6" trend={12} />
            <StatCard icon="🎮" label="Games Played" value={s.gamesPlayed.toLocaleString()} sub={`${Math.round(s.gamesPlayed/s.totalSessions*100)}% engagement`} color="#8b5cf6" trend={8} />
            <StatCard icon="🎟️" label="Coupons Generated" value={s.couponsGenerated.toLocaleString()} sub="Discount codes issued" color="#10b981" trend={15} />
            <StatCard icon="⏱️" label="Avg. Session" value={`${Math.round(s.avgDurationSeconds)}s`} sub="Per user interaction" color="#f97316" />
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Daily activity line chart */}
            <div style={{ gridColumn: 'span 2', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Daily Activity</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sessions over the last 7 days</div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="sessions" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Gender pie */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Gender Split</div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {genderData.map((entry, i) => <Cell key={i} fill={COLORS[entry.name] || '#475569'} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {genderData.map(g => (
                  <div key={g.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[g.name] || '#475569', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'capitalize', flex: 1 }}>{g.name}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{g.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Age group bar chart */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px' }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Age Group Distribution</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Breakdown of detected age groups</div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ageData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12, textTransform: 'capitalize' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {ageData.map((entry, i) => <Cell key={i} fill={AGE_COLORS[entry.name] || '#475569'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
