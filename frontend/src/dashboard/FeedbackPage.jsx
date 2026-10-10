import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Star, ThumbsUp, ThumbsDown, Minus, RefreshCw } from 'lucide-react';

// ─── Star renderer ────────────────────────────────────────────────────────────

function StarRating({ value }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={13}
          strokeWidth={1.5}
          fill={n <= value ? 'rgba(251,191,36,0.9)' : 'none'}
          style={{ color: n <= value ? '#f59e0b' : '#334155' }}
        />
      ))}
      <span style={{ marginLeft: 5, fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
        {value}/5
      </span>
    </div>
  );
}

// ─── Boolean badge ────────────────────────────────────────────────────────────

function BoolBadge({ value }) {
  if (value === null || value === undefined) {
    return <span style={{ color: '#475569', fontSize: '0.82rem' }}>—</span>;
  }
  return value ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, padding: '2px 10px' }}>
      <ThumbsUp size={11} strokeWidth={1.8} style={{ color: '#10b981' }} />
      <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>Yes</span>
    </span>
  ) : (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: '2px 10px' }}>
      <ThumbsDown size={11} strokeWidth={1.8} style={{ color: '#ef4444' }} />
      <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 600 }}>No</span>
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 6, boxShadow: accent ? `0 0 30px ${accent}18` : 'none' }}>
      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: accent || 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{sub}</div>}
    </div>
  );
}

// ─── FeedbackPage ─────────────────────────────────────────────────────────────

export default function FeedbackPage() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    axios.get('/api/feedback')
      .then(r => setRows(r.data.data || []))
      .catch(() => setError('Could not reach /api/feedback'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Aggregate stats ──────────────────────────────────────────────────────
  const total       = rows.length;
  const avgRating   = total ? (rows.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : '—';
  const satisfiedN  = rows.filter(r => r.satisfied === true).length;
  const satisfiedOf = rows.filter(r => r.satisfied !== null && r.satisfied !== undefined).length;
  const accurateN   = rows.filter(r => r.ageGenderAccurate === true).length;
  const accurateOf  = rows.filter(r => r.ageGenderAccurate !== null && r.ageGenderAccurate !== undefined).length;
  const pctSat   = satisfiedOf  ? Math.round(satisfiedN  / satisfiedOf  * 100) : null;
  const pctAccur = accurateOf   ? Math.round(accurateN   / accurateOf   * 100) : null;

  // Rating bar data
  const ratingBars = [5, 4, 3, 2, 1].map(n => ({
    stars: n,
    count: rows.filter(r => r.rating === n).length,
  }));

  const HEADERS = ['Date & Time', 'Rating', 'Satisfied?', 'AI Accurate?'];

  return (
    <div style={{ padding: '30px 36px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div className="db-page-header" style={{ padding: 0, margin: 0 }}>
          <h1 className="db-page-title">User Feedback</h1>
          <p className="db-page-sub">Survey responses collected from the kiosk</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', color: '#f472b6', fontSize: '0.82rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', opacity: loading ? 0.6 : 1, backdropFilter: 'blur(12px)' }}
        >
          <RefreshCw size={13} strokeWidth={1.8} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 24, color: '#f87171', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Responses" value={loading ? '…' : total} sub="All time" accent="var(--accent-blue)" />
        <StatCard label="Avg Rating" value={loading ? '…' : avgRating}
          sub={total ? `from ${total} response${total !== 1 ? 's' : ''}` : 'No data yet'}
          accent="#f59e0b" />
        <StatCard label="Satisfied" value={loading ? '…' : (pctSat !== null ? `${pctSat}%` : '—')}
          sub={satisfiedOf ? `${satisfiedN} of ${satisfiedOf} answered` : 'No answers yet'}
          accent="var(--accent-green)" />
        <StatCard label="AI Accurate" value={loading ? '…' : (pctAccur !== null ? `${pctAccur}%` : '—')}
          sub={accurateOf ? `${accurateN} of ${accurateOf} answered` : 'No answers yet'}
          accent="var(--accent-cyan)" />
      </div>

      {/* Rating distribution */}
      {total > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 18, color: 'var(--text-primary)', fontSize: '0.95rem' }}>Rating Distribution</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ratingBars.map(({ stars, count }) => {
              const pct = total ? Math.round(count / total * 100) : 0;
              return (
                <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 80 }}>
                    {Array.from({ length: stars }, (_, i) => (
                      <Star key={i} size={12} strokeWidth={1.5} fill="rgba(251,191,36,0.85)" style={{ color: '#f59e0b' }} />
                    ))}
                  </div>
                  <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: 4, transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ minWidth: 60, display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>{count}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Feedback table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Recent User Feedback</span>
          {total > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{total} record{total !== 1 ? 's' : ''}</span>}
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <RefreshCw size={20} strokeWidth={1.5} style={{ margin: '0 auto 12px', display: 'block', animation: 'spin 1s linear infinite', color: 'var(--accent-blue)' }} />
            Loading feedback…
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Star size={32} strokeWidth={1} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            No feedback submitted yet.<br />
            <span style={{ fontSize: '0.78rem', color: '#334155' }}>Responses appear here after users complete the kiosk survey.</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {HEADERS.map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const dt = new Date(row.createdAt);
                  const dateStr = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  const timeStr = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                  return (
                    <tr
                      key={row._id || i}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Date */}
                      <td style={{ padding: '13px 20px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>{dateStr}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{timeStr}</div>
                      </td>
                      {/* Rating */}
                      <td style={{ padding: '13px 20px' }}>
                        <StarRating value={row.rating} />
                      </td>
                      {/* Satisfied */}
                      <td style={{ padding: '13px 20px' }}>
                        <BoolBadge value={row.satisfied} />
                      </td>
                      {/* AI Accurate */}
                      <td style={{ padding: '13px 20px' }}>
                        <BoolBadge value={row.ageGenderAccurate} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
