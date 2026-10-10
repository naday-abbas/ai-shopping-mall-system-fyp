import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Users, Gamepad2, Ticket, Package, TrendingUp, TrendingDown, Activity } from 'lucide-react';

// ─── Colour maps ──────────────────────────────────────────────────────────────
const GENDER_COLORS = { male: '#3b82f6', female: '#ec4899', unknown: '#475569' };
const AGE_COLORS    = { child: '#10b981', teen: '#f97316', adult: '#8b5cf6', senior: '#06b6d4', unknown: '#475569' };
const AGE_KEY       = { Kid: 'child', Young: 'teen', Adult: 'adult', Senior: 'senior' };

// ─── Mock ─────────────────────────────────────────────────────────────────────
const MOCK = {
  totalSessions: 1247, gamesPlayed: 489, couponsGenerated: 312, activeProducts: 0,
  genderBreakdown: [{ _id: 'male', count: 621 }, { _id: 'female', count: 587 }, { _id: 'unknown', count: 39 }],
  ageBreakdown:    [{ _id: 'child', count: 187 }, { _id: 'teen', count: 298 }, { _id: 'adult', count: 612 }, { _id: 'senior', count: 150 }],
  dailyActivity:   [
    { _id: '2026-03-22', count: 145 }, { _id: '2026-03-23', count: 178 },
    { _id: '2026-03-24', count: 132 }, { _id: '2026-03-25', count: 201 },
    { _id: '2026-03-26', count: 189 }, { _id: '2026-03-27', count: 220 },
    { _id: '2026-03-28', count: 182 },
  ],
};

function transformAnalytics(raw) {
  return {
    totalSessions:    raw.totalSessions,
    gamesPlayed:      raw.totalCoupons,
    couponsGenerated: raw.totalCoupons,
    activeProducts:   raw.totalProducts || 0,
    genderBreakdown:  (raw.genderDistribution || []).map(g => ({ _id: g.name.toLowerCase(), count: g.value })),
    ageBreakdown:     (raw.ageDistribution    || []).map(a => ({ _id: AGE_KEY[a.name] ?? a.name.toLowerCase(), count: a.value })),
    dailyActivity:    (raw.dailyActivity || []),
  };
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function GlassTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(6,2,20,0.88)', backdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
      padding: '10px 16px', boxShadow: '0 0 32px rgba(236,72,153,0.18)',
    }}>
      <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.7rem', marginBottom: 6, letterSpacing: '0.08em' }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color || '#f472b6', fontWeight: 700, fontSize: '0.92rem', fontFamily: 'var(--font-mono)' }}>
          {p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ Icon, label, value, sub, color, trend, delay = 0, progress }) {
  const isUp = trend >= 0;
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'rgba(255,255,255,0.055)',
      backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 18, padding: '22px 22px 18px',
      animation: 'fadeIn 0.5s ease both',
      animationDelay: `${delay}s`,
      boxShadow: `0 0 50px ${color}1a, 0 2px 0 rgba(255,255,255,0.06) inset`,
      transition: 'transform 0.22s, box-shadow 0.22s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 0 70px ${color}30, 0 2px 0 rgba(255,255,255,0.08) inset`; }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)';   e.currentTarget.style.boxShadow=`0 0 50px ${color}1a, 0 2px 0 rgba(255,255,255,0.06) inset`; }}
    >
      {/* Glow orb */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 110, height: 110, borderRadius: '50%', background: `radial-gradient(circle, ${color}22, transparent 70%)`, pointerEvents: 'none' }} />
      {/* Top-edge highlight */}
      <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: `linear-gradient(90deg, transparent, ${color}55, transparent)`, pointerEvents: 'none' }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 13,
          background: `linear-gradient(135deg, ${color}30, ${color}10)`,
          border: `1px solid ${color}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 20px ${color}30, inset 0 1px 0 rgba(255,255,255,0.1)`,
        }}>
          <Icon size={20} strokeWidth={1.6} style={{ color, filter: `drop-shadow(0 0 6px ${color})` }} />
        </div>

        {trend !== undefined && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
            color: isUp ? '#34d399' : '#f87171',
            background: isUp ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
            border: isUp ? '1px solid rgba(52,211,153,0.28)' : '1px solid rgba(248,113,113,0.28)',
          }}>
            {isUp ? <TrendingUp size={11} strokeWidth={2} /> : <TrendingDown size={11} strokeWidth={2} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      {/* Value */}
      <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, marginBottom: 5, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.92)' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: sub ? 2 : 12 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.28)', marginBottom: 12 }}>{sub}</div>}

      {/* Progress bar */}
      {progress !== undefined && (
        <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${Math.min(progress, 100)}%`,
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
            borderRadius: 99,
            boxShadow: `0 0 8px ${color}`,
            transition: 'width 1s ease',
          }} />
        </div>
      )}
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'linear-gradient(135deg,#ec4899,#06b6d4)', boxShadow: '0 0 10px rgba(236,72,153,0.8)', flexShrink: 0 }} />
      <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', fontFamily: 'var(--font-sans)' }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)' }} />
    </div>
  );
}

// ─── Glass card wrapper ───────────────────────────────────────────────────────
function GCard({ children, style = {}, glow }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'rgba(255,255,255,0.055)',
      backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 18, padding: '22px 24px',
      animation: 'fadeIn 0.5s ease both',
      boxShadow: glow ? `0 0 50px ${glow}18` : 'none',
      ...style,
    }}>
      {/* top highlight */}
      <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)', pointerEvents: 'none' }} />
      {children}
    </div>
  );
}

// ─── Chart label ──────────────────────────────────────────────────────────────
function CardTitle({ title, sub }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.01em', marginBottom: 3 }}>{title}</div>
      {sub && <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.04em' }}>{sub}</div>}
    </div>
  );
}

// ─── OverviewPage ─────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [now,     setNow]     = useState(new Date());

  useEffect(() => {
    axios.get('/api/analytics')
      .then(r => setStats(transformAnalytics(r.data.data)))
      .catch(() => setStats(MOCK))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const s = stats || MOCK;

  const genderData = s.genderBreakdown.map(g => ({ name: g._id, value: g.count }));
  const ageData    = s.ageBreakdown.map(a => ({ name: a._id, value: a.count }));
  const dailyData  = s.dailyActivity.map(d => ({ date: (d.date || d._id)?.slice(5), sessions: d.count }));

  const totalGender = genderData.reduce((a, x) => a + x.value, 0);
  const maxAge      = Math.max(...ageData.map(a => a.value), 1);
  const engagement  = s.totalSessions ? Math.round((s.gamesPlayed / s.totalSessions) * 100) : 0;

  return (
    <div style={{ padding: '28px 32px 40px', minHeight: '100%' }}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, animation: 'fadeIn 0.4s ease both' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px rgba(16,185,129,0.9)', animation: 'pulse 2.2s infinite' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>Live Dashboard</span>
          </div>
          <h1 style={{
            fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em',
            background: 'linear-gradient(90deg, #f472b6 0%, #67e8f9 55%, #fb923c 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Dashboard Overview
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.84rem', marginTop: 4 }}>
            Smart Mall kiosk · AI-powered analytics
          </p>
        </div>

        {/* Live clock */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2,
          padding: '12px 18px', borderRadius: 14,
          background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{ fontSize: '1.3rem', fontWeight: 200, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.88)', letterSpacing: '0.08em' }}>
            {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </span>
          <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.06em' }}>
            {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '80px 0', color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ width: 36, height: 36, border: '2px solid rgba(236,72,153,0.4)', borderTopColor: '#ec4899', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
          <span style={{ fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Loading analytics…</span>
        </div>
      ) : (
        <>
          {/* ── Stat cards ──────────────────────────────────────────────── */}
          <SectionLabel>Key Metrics</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
            <StatCard Icon={Users}     label="Total Sessions"    value={s.totalSessions.toLocaleString()}    sub="All time visits"           color="#3b82f6" trend={12}  delay={0}    progress={72} />
            <StatCard Icon={Gamepad2}  label="Games Played"      value={s.gamesPlayed.toLocaleString()}      sub={`${engagement}% engagement`} color="#8b5cf6" trend={8}   delay={0.07} progress={engagement} />
            <StatCard Icon={Ticket}    label="Coupons Generated" value={s.couponsGenerated.toLocaleString()} sub="Discount codes issued"      color="#10b981" trend={15}  delay={0.14} progress={58} />
            <StatCard Icon={Package}   label="Active Products"   value={s.activeProducts.toLocaleString()}   sub="In catalogue"               color="#f97316"             delay={0.21} progress={s.activeProducts > 0 ? 40 : 0} />
          </div>

          {/* ── Charts row 1: Area + Gender ─────────────────────────────── */}
          <SectionLabel>Visitor Activity</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>

            {/* Area chart */}
            <GCard glow="#3b82f6">
              <CardTitle title="Daily Sessions" sub="Kiosk visitors over the last 7 days" />
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={dailyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%"   stopColor="#ec4899" />
                      <stop offset="50%"  stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<GlassTip />} />
                  <Area
                    type="monotone" dataKey="sessions"
                    stroke="url(#lineStroke)" strokeWidth={2.5}
                    fill="url(#areaFill)"
                    dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#67e8f9', strokeWidth: 0, filter: 'drop-shadow(0 0 6px #67e8f9)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </GCard>

            {/* Gender donut */}
            <GCard glow="#ec4899">
              <CardTitle title="Gender Split" sub="All kiosk visitors" />
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <ResponsiveContainer width={150} height={150}>
                  <PieChart>
                    <Pie data={genderData} cx="50%" cy="50%" innerRadius={44} outerRadius={68} dataKey="value" paddingAngle={4} startAngle={90} endAngle={450}>
                      {genderData.map((e, i) => (
                        <Cell key={i} fill={GENDER_COLORS[e.name] || '#475569'}
                          style={{ filter: `drop-shadow(0 0 6px ${GENDER_COLORS[e.name] || '#475569'})` }} />
                      ))}
                    </Pie>
                    <Tooltip content={<GlassTip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {genderData.map(g => {
                  const pct = totalGender ? Math.round((g.value / totalGender) * 100) : 0;
                  const col = GENDER_COLORS[g.name] || '#475569';
                  return (
                    <div key={g.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, boxShadow: `0 0 7px ${col}`, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.55)', textTransform: 'capitalize' }}>{g.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-mono)' }}>{g.value}</span>
                          <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)' }}>{pct}%</span>
                        </div>
                      </div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${col}, ${col}88)`, borderRadius: 99, boxShadow: `0 0 6px ${col}` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </GCard>
          </div>

          {/* ── Charts row 2: Age + Quick stats ─────────────────────────── */}
          <SectionLabel>Demographics & Insights</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>

            {/* Age horizontal bars */}
            <GCard glow="#8b5cf6">
              <CardTitle title="Age Group Distribution" sub="Detected visitor age segments" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
                {ageData.map(a => {
                  const col = AGE_COLORS[a.name] || '#475569';
                  const pct = Math.round((a.value / maxAge) * 100);
                  const labels = { child: 'Child', teen: 'Teen', adult: 'Adult', senior: 'Senior' };
                  return (
                    <div key={a.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: col, boxShadow: `0 0 7px ${col}` }} />
                          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{labels[a.name] || a.name}</span>
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-mono)' }}>{a.value.toLocaleString()}</span>
                      </div>
                      <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: `linear-gradient(90deg, ${col}, ${col}70)`,
                          borderRadius: 99,
                          boxShadow: `0 0 8px ${col}`,
                          transition: 'width 1.2s cubic-bezier(0.34,1.56,0.64,1)',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </GCard>

            {/* Quick insight cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Engagement rate */}
              <GCard style={{ padding: '18px 20px', flex: 1 }} glow="#10b981">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Game Engagement</div>
                    <div style={{ fontSize: '2.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', lineHeight: 1, background: 'linear-gradient(135deg, #34d399, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      {engagement}%
                    </div>
                  </div>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
                    <Activity size={22} strokeWidth={1.5} style={{ color: '#34d399', filter: 'drop-shadow(0 0 6px #34d399)' }} />
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)' }}>of visitors played Spin & Win</div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden', marginTop: 10 }}>
                  <div style={{ height: '100%', width: `${engagement}%`, background: 'linear-gradient(90deg, #10b981, #06b6d4)', borderRadius: 99, boxShadow: '0 0 6px #10b981' }} />
                </div>
              </GCard>

              {/* Coupon rate */}
              <GCard style={{ padding: '18px 20px', flex: 1 }} glow="#f59e0b">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Coupon Rate</div>
                    <div style={{ fontSize: '2.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', lineHeight: 1, background: 'linear-gradient(135deg, #fcd34d, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      {s.totalSessions ? Math.round((s.couponsGenerated / s.totalSessions) * 100) : 0}%
                    </div>
                  </div>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(245,158,11,0.2)' }}>
                    <Ticket size={22} strokeWidth={1.5} style={{ color: '#fcd34d', filter: 'drop-shadow(0 0 6px #fcd34d)' }} />
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)' }}>sessions resulted in a coupon</div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden', marginTop: 10 }}>
                  <div style={{ height: '100%', width: `${s.totalSessions ? Math.round((s.couponsGenerated / s.totalSessions) * 100) : 0}%`, background: 'linear-gradient(90deg, #f59e0b, #f97316)', borderRadius: 99, boxShadow: '0 0 6px #f59e0b' }} />
                </div>
              </GCard>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
