import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

// ─── Map our API's age labels to dashboard keys ───────────────────────────────
const AGE_KEY = { Kid: 'child', Young: 'teen', Adult: 'adult', Senior: 'senior' };

// ─── Transform our /api/analytics response → what this page expects ───────────
function transformAnalytics(raw) {
  return {
    genderBreakdown: (raw.genderDistribution || []).map(g => ({
      _id: g.name.toLowerCase(), count: g.value,
    })),
    ageBreakdown: (raw.ageDistribution || []).map(a => ({
      _id: AGE_KEY[a.name] ?? a.name.toLowerCase(), count: a.value,
    })),
    dailyActivity: (raw.dailyActivity || []).map(d => ({
      _id: d.date, count: d.count, games: d.games ?? 0,
    })),
    totalGames:    raw.totalGames    ?? 0,
    totalCoupons:  raw.totalCoupons  ?? 0,
    totalSessions: raw.totalSessions ?? 0,
    gameByGender:  (raw.gameByGender || []).map(g => ({ name: g.name, value: g.value })),
    gameByAge:     (raw.gameByAge    || []).map(a => ({ name: a.name, value: a.value })),
    couponDiscountBreakdown: raw.couponDiscountBreakdown || [],
    peakHours: raw.peakHours || [],
    peakHour:  raw.peakHour,
    visitorBreakdown: raw.visitorBreakdown || [],
    gameTypeBreakdown: raw.gameTypeBreakdown || [],
    catchGiftsStats: raw.catchGiftsStats || { plays: 0, avgScore: 0, maxScore: 0 },
  };
}

// ─── Format a 0-23 hour into a 12-hour label ("2 PM") ──────────────────────────
function formatHour(hour) {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

// ─── Mock recent sessions (shown while /api/analytics/recent doesn't exist) ───
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

// ─── AnalyticsPage ────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [stats,   setStats]   = useState(null);
  const [recent,  setRecent]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      // Changed: was /api/analytics/stats — now our real endpoint
      axios.get('/api/analytics').catch(() => null),
      // /api/analytics/recent does not exist in our backend → falls back to mock
      axios.get('/api/analytics/recent').catch(() => null),
    ]).then(([s, r]) => {
      setStats(s ? transformAnalytics(s.data.data) : null);
      if (r?.data?.data) {
        console.log('API_RESPONSE:', r.data);
        setRecent(r.data.data);
      } else {
        setRecent([]);
      }
    }).finally(() => setLoading(false));
  }, []);

  const GENDER_COLORS = { male: '#3b82f6', female: '#ec4899', unknown: '#475569' };
  const AGE_COLORS    = { child: '#10b981', teen: '#f97316', adult: '#8b5cf6', senior: '#06b6d4' };

  const genderPie = stats?.genderBreakdown.map(g => ({ name: g._id, value: g.count })) || [
    {name:'male',value:621},{name:'female',value:587},{name:'unknown',value:39}
  ];
  const agePie = stats?.ageBreakdown.map(a => ({ name: a._id, value: a.count })) || [
    {name:'child',value:187},{name:'teen',value:298},{name:'adult',value:612},{name:'senior',value:150}
  ];
  const daily = stats?.dailyActivity.map(d => ({ date: d._id?.slice(5) || d._id, sessions: d.count, games: d.games ?? 0 })) || [];

  const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'rgba(10,5,30,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 0 30px rgba(236,72,153,0.15)' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', marginBottom: 6 }}>{label}</div>
        {payload.map(p => <div key={p.name} style={{ color: p.color, fontSize: '0.85rem', fontWeight: 700 }}>{p.name}: {p.value}</div>)}
      </div>
    );
  };

  const conversionRate = stats && stats.totalSessions > 0
    ? Math.round((stats.totalGames / stats.totalSessions) * 100)
    : 0;

  const gameGenderPie = stats?.gameByGender?.length
    ? stats.gameByGender.map(g => ({ name: g.name, value: g.value }))
    : [];
  const gameAgePie = stats?.gameByAge?.length
    ? stats.gameByAge
    : [];
  const discountData = stats?.couponDiscountBreakdown || [];

  const DISCOUNT_COLORS = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f97316','#ffd700'];

  const peakHoursData = (stats?.peakHours || []).map(h => ({ hour: formatHour(h.hour), count: h.count }));
  const peakHourLabel = stats?.peakHour != null ? formatHour(stats.peakHour) : '—';

  const visitorBreakdown = stats?.visitorBreakdown || [];
  const VISITOR_COLORS = { Normal: '#3b82f6', Frequent: '#f59e0b' };

  const gameTypeBreakdown = stats?.gameTypeBreakdown || [];
  const GAME_TYPE_COLORS = { Spin: '#8b5cf6', 'Catch Gifts': '#f472b6' };
  const catchGiftsStats = stats?.catchGiftsStats || { plays: 0, avgScore: 0, maxScore: 0 };

  return (
    <div style={{ padding: '30px 36px' }}>
      <div className="db-page-header" style={{ padding: 0, marginBottom: 28 }}>
        <h1 className="db-page-title">Analytics</h1>
        <p className="db-page-sub">Deep insights into kiosk usage, game engagement and coupon performance</p>
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Sessions',    value: stats?.totalSessions ?? '—', color: '#3b82f6', sub: 'All kiosk visits', icon: '👥' },
          { label: 'Games Played',      value: stats?.totalGames    ?? '—', color: '#8b5cf6', sub: `${conversionRate}% conversion`, icon: '🎮' },
          { label: 'Coupons Generated', value: stats?.totalCoupons  ?? '—', color: '#f59e0b', sub: 'From spin wheel', icon: '🎟️' },
          { label: 'Game Conversion',   value: `${conversionRate}%`,        color: '#10b981', sub: 'Visitors who played', icon: '📈' },
        ].map((c, i) => (
          <div key={c.label} className="db-stat-card" style={{ animationDelay: `${i * 0.08}s`, boxShadow: `0 0 28px ${c.color}0d` }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: `radial-gradient(circle, ${c.color}18, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: `linear-gradient(135deg, ${c.color}28, ${c.color}10)`, border: `1px solid ${c.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', boxShadow: `0 0 12px ${c.color}25` }}>{c.icon}</div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: c.color, fontFamily: 'var(--font-mono)', position: 'relative' }}>{c.value}</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 6 }}>{c.label}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Sessions vs Games chart ── */}
      {daily.length > 0 && (
        <div className="db-chart-card" style={{ marginBottom: 20 }}>
          <div className="db-chart-title">Sessions vs Games — Last 7 Days</div>
          <div className="db-chart-sub">How many kiosk visitors played the spin wheel each day</div>
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
              <Area type="monotone" dataKey="games"    stroke="#8b5cf6" strokeWidth={2} fill="url(#gGame)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Peak Activity Hours ── */}
      <div className="db-chart-card" style={{ marginBottom: 20 }}>
        <div className="db-chart-title">Peak Activity Hours</div>
        <div className="db-chart-sub">
          Kiosk visits by hour of day (Pakistan time)
          {stats?.peakHour != null && <span style={{ color: '#f59e0b', fontWeight: 600 }}> — busiest around {peakHourLabel}</span>}
        </div>
        {peakHoursData.every(h => h.count === 0) ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No session data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={peakHoursData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="count" name="Sessions" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Visitor Demographics ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
        {/* Gender */}
        <div className="db-chart-card">
          <div className="db-chart-title">Gender Distribution</div>
          <div className="db-chart-sub">All kiosk visitors</div>
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
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{total ? Math.round(g.value/total*100) : 0}%</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${total ? g.value/total*100 : 0}%`, background: GENDER_COLORS[g.name] || '#475569', borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Age */}
        <div className="db-chart-card">
          <div className="db-chart-title">Age Group Distribution</div>
          <div className="db-chart-sub">All kiosk visitors</div>
          <ResponsiveContainer width="100%" height={170}>
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

      {/* ── Game Analytics section ── */}
      <div className="db-section-header" style={{ marginBottom: 14, marginTop: 8 }}>
        <div className="db-section-dot" />
        <div>
          <div className="db-section-title">Game Analytics</div>
          <div className="db-section-sub">Who played the Spin & Win game and what coupons they earned</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>

        {/* Game players by Gender */}
        <div className="db-chart-card">
          <div className="db-chart-title">Game Players by Gender</div>
          <div className="db-chart-sub">Which gender played more</div>
          {gameGenderPie.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No game data yet</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <ResponsiveContainer width={150} height={150}>
                <PieChart>
                  <Pie data={gameGenderPie} cx="50%" cy="50%" outerRadius={65} innerRadius={42} dataKey="value" paddingAngle={3}>
                    {gameGenderPie.map((e,i) => <Cell key={i} fill={GENDER_COLORS[e.name?.toLowerCase()] || '#475569'} />)}
                  </Pie>
                  <Tooltip content={<Tip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {gameGenderPie.map(g => {
                  const total = gameGenderPie.reduce((a,x)=>a+x.value,0);
                  const col = GENDER_COLORS[g.name?.toLowerCase()] || '#475569';
                  return (
                    <div key={g.name} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{g.name}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{g.value} ({total ? Math.round(g.value/total*100) : 0}%)</span>
                      </div>
                      <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${total ? g.value/total*100 : 0}%`, background: col, borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Game players by Age */}
        <div className="db-chart-card">
          <div className="db-chart-title">Game Players by Age Group</div>
          <div className="db-chart-sub">Which age group engaged most</div>
          {gameAgePie.every(x => x.value === 0) ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No game data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={gameAgePie} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="value" radius={[6,6,0,0]}>
                  {gameAgePie.map((e,i) => <Cell key={i} fill={AGE_COLORS[e.name?.toLowerCase()] || '#475569'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Games by Type — Spin & Win vs Catch-the-Gifts (kids-only game) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
        <div className="db-chart-card">
          <div className="db-chart-title">Games by Type</div>
          <div className="db-chart-sub">Spin & Win vs the kids-only Catch-the-Gifts game</div>
          {gameTypeBreakdown.every(g => g.value === 0) ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No game data yet</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <ResponsiveContainer width={150} height={150}>
                <PieChart>
                  <Pie data={gameTypeBreakdown} cx="50%" cy="50%" outerRadius={65} innerRadius={42} dataKey="value" paddingAngle={3}>
                    {gameTypeBreakdown.map((e,i) => <Cell key={i} fill={GAME_TYPE_COLORS[e.name] || '#475569'} />)}
                  </Pie>
                  <Tooltip content={<Tip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {gameTypeBreakdown.map(g => {
                  const total = gameTypeBreakdown.reduce((a,x)=>a+x.value,0);
                  const col = GAME_TYPE_COLORS[g.name] || '#475569';
                  return (
                    <div key={g.name} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{g.name}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{g.value} ({total ? Math.round(g.value/total*100) : 0}%)</span>
                      </div>
                      <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${total ? g.value/total*100 : 0}%`, background: col, borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="db-chart-card">
          <div className="db-chart-title">Catch-the-Gifts Performance</div>
          <div className="db-chart-sub">How kids are doing in the tap-to-catch game</div>
          {catchGiftsStats.plays === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No plays yet</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, paddingTop: 8 }}>
              {[
                { label: 'Plays',     value: catchGiftsStats.plays,    color: '#f472b6' },
                { label: 'Avg Score', value: catchGiftsStats.avgScore, color: '#8b5cf6' },
                { label: 'Best Score',value: catchGiftsStats.maxScore, color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Coupon Discount Breakdown */}
      <div className="db-chart-card" style={{ marginBottom: 20 }}>
        <div className="db-chart-title">Coupon Discount Breakdown</div>
        <div className="db-chart-sub">How many coupons of each discount tier were generated</div>
        {discountData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No coupons generated yet</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={discountData} cx="50%" cy="50%" outerRadius={85} innerRadius={50} dataKey="value" paddingAngle={2}>
                  {discountData.map((e,i) => <Cell key={i} fill={DISCOUNT_COLORS[i % DISCOUNT_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<Tip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
              {discountData.map((d,i) => {
                const total = discountData.reduce((a,x)=>a+x.value,0);
                const col = DISCOUNT_COLORS[i % DISCOUNT_COLORS.length];
                return (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: col, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: col }}>{d.name}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{d.value} ({Math.round(d.value/total*100)}%)</span>
                      </div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${d.value/total*100}%`, background: col, borderRadius: 2 }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Normal vs Frequent Visitors — opt-in returning-customer streak (coupon-code based, no identity stored) */}
      <div className="db-chart-card" style={{ marginBottom: 20 }}>
        <div className="db-chart-title">Normal vs Frequent Visitors</div>
        <div className="db-chart-sub">Based on customers who voluntarily re-entered a previous coupon code (visit streak &gt; 3 = Frequent)</div>
        {visitorBreakdown.every(v => v.value === 0) ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No coupon data yet</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie data={visitorBreakdown} cx="50%" cy="50%" outerRadius={65} innerRadius={42} dataKey="value" paddingAngle={3}>
                  {visitorBreakdown.map((e,i) => <Cell key={i} fill={VISITOR_COLORS[e.name] || '#475569'} />)}
                </Pie>
                <Tooltip content={<Tip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {visitorBreakdown.map(v => {
                const total = visitorBreakdown.reduce((a,x)=>a+x.value,0);
                const col = VISITOR_COLORS[v.name] || '#475569';
                return (
                  <div key={v.name} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{v.name}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{v.value} ({total ? Math.round(v.value/total*100) : 0}%)</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${total ? v.value/total*100 : 0}%`, background: col, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Recent Sessions table ── */}
      <div className="db-table-card">
        <div className="db-table-header">
          <span className="db-online-dot" style={{ marginRight: 4 }} />
          Recent Sessions
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Session ID','Gender','Age','Confidence','Game','Coupon','Time'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: h === 'Confidence' ? 'center' : 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No sessions yet</td></tr>
              ) : recent.slice(0,20).map((s,i) => (
                <tr key={s._id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding: '11px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{String(s._id).slice(0,14)}…</td>
                  <td style={{ padding: '11px 16px', fontSize: '0.82rem', color: s.detectedGender?.toLowerCase()==='male'?'#3b82f6':'#ec4899', textTransform: 'capitalize' }}>{s.detectedGender || '—'}</td>
                  <td style={{ padding: '11px 16px', fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{s.detectedAge || '—'}</td>
                  <td style={{ padding: '11px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: s.confidence>0.85?'#10b981':'var(--text-secondary)', textAlign: 'center' }}>{s.confidence ? `${Math.round(s.confidence*100)}%` : '—'}</td>
                  <td style={{ padding: '11px 16px' }}>
                    {s.hasPlayedGame === true
                      ? <span style={{ color: '#10b981', fontSize: '1rem' }}>●</span>
                      : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>}
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    {s.couponCode
                      ? <span style={{ background: '#1e293b', padding: '2px 8px', borderRadius: 4, color: '#f59e0b', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{s.couponCode}</span>
                      : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>}
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(s.createdAt).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
