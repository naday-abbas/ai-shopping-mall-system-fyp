import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const BACKEND = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const MOCK_RECENT = Array.from({ length: 15 }, (_, i) => ({
  _id: `s${i}`,
  sessionId: `session_${Math.random().toString(36).slice(2,8)}`,
  detectedGender: ['male','female','unknown'][Math.floor(Math.random()*3)],
  detectedAgeGroup: ['child','teen','adult','senior'][Math.floor(Math.random()*4)],
  confidence: (Math.random()*0.25+0.74).toFixed(2),
  gamePlayed: Math.random()>0.5,
  couponGenerated: Math.random()>0.6,
  sessionDurationSeconds: Math.floor(Math.random()*80+15),
  weather: ['hot','cold','mild','rainy'][Math.floor(Math.random()*4)],
  timestamp: new Date(Date.now() - Math.random()*24*3600000).toISOString(),
}));

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${BACKEND}/api/analytics/stats`).catch(() => null),
      axios.get(`${BACKEND}/api/analytics/recent`).catch(() => null),
    ]).then(([s, r]) => {
      setStats(s?.data || null);
      setRecent(r?.data || MOCK_RECENT);
    }).finally(() => setLoading(false));
  }, []);

  const GENDER_COLORS = { male: '#3b82f6', female: '#ec4899', unknown: '#475569' };
  const AGE_COLORS   = { child: '#10b981', teen: '#f97316', adult: '#8b5cf6', senior: '#06b6d4' };

  const genderPie = stats?.genderBreakdown.map(g => ({ name: g._id, value: g.count })) || [
    {name:'male',value:621},{name:'female',value:587},{name:'unknown',value:39}
  ];
  const agePie = stats?.ageBreakdown.map(a => ({ name: a._id, value: a.count })) || [
    {name:'child',value:187},{name:'teen',value:298},{name:'adult',value:612},{name:'senior',value:150}
  ];
  const daily = stats?.dailyActivity.map(d => ({ date: d._id?.slice(5) || d._id, sessions: d.count, games: Math.floor(d.count*0.4) })) || [];

  const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: '#1a2438', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 14px' }}>
        <div style={{ color: '#475569', fontSize: '0.72rem', marginBottom: 6 }}>{label}</div>
        {payload.map(p => <div key={p.name} style={{ color: p.color, fontSize: '0.85rem', fontWeight: 600 }}>{p.name}: {p.value}</div>)}
      </div>
    );
  };

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>Analytics</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Deep insights into kiosk usage and user demographics</p>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Gender */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 20 }}>Gender Distribution</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={genderPie} cx="50%" cy="50%" outerRadius={70} innerRadius={45} dataKey="value" paddingAngle={3}>
                  {genderPie.map((e,i) => <Cell key={i} fill={GENDER_COLORS[e.name] || '#475569'} />)}
                </Pie>
                <Tooltip content={<Tip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {genderPie.map(g => {
                const total = genderPie.reduce((a,x)=>a+x.value,0);
                return (
                  <div key={g.name} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{g.name}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{Math.round(g.value/total*100)}%</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${g.value/total*100}%`, background: GENDER_COLORS[g.name] || '#475569', borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Age */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 20 }}>Age Group Distribution</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={agePie} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="value" radius={[6,6,0,0]}>
                {agePie.map((e,i) => <Cell key={i} fill={AGE_COLORS[e.name] || '#475569'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily area */}
      {daily.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 20 }}>Sessions vs Games — Last 7 Days</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="gSess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gGame" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '0.8rem' }} />
              <Area type="monotone" dataKey="sessions" stroke="#3b82f6" strokeWidth={2} fill="url(#gSess)" />
              <Area type="monotone" dataKey="games" stroke="#8b5cf6" strokeWidth={2} fill="url(#gGame)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent sessions table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>Recent Sessions</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Session ID','Gender','Age','Confidence','Duration','Game','Coupon','Time'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.slice(0,20).map((s,i) => (
                <tr key={s._id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding: '11px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.sessionId?.slice(0,14)}...</td>
                  <td style={{ padding: '11px 16px', fontSize: '0.82rem', color: s.detectedGender==='male'?'#3b82f6':'#ec4899', textTransform: 'capitalize' }}>{s.detectedGender}</td>
                  <td style={{ padding: '11px 16px', fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{s.detectedAgeGroup}</td>
                  <td style={{ padding: '11px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: parseFloat(s.confidence)>0.85?'#10b981':'var(--text-secondary)' }}>{s.confidence ? `${Math.round(s.confidence*100)}%` : '—'}</td>
                  <td style={{ padding: '11px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{s.sessionDurationSeconds}s</td>
                  <td style={{ padding: '11px 16px' }}><span style={{ fontSize: '0.82rem' }}>{s.gamePlayed ? '✅' : '—'}</span></td>
                  <td style={{ padding: '11px 16px' }}><span style={{ fontSize: '0.82rem' }}>{s.couponGenerated ? '🎟️' : '—'}</span></td>
                  <td style={{ padding: '11px 16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(s.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
