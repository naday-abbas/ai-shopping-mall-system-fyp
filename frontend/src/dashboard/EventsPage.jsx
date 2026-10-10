import React, { useEffect, useState } from 'react';
import axios from 'axios';

// ─── Preset festival events ───────────────────────────────────────────────────
const PRESETS = [
  { name: 'Eid ul Fitr',     emoji: '🌙', bannerColor: '#10b981', discountPercent: 20 },
  { name: 'Eid ul Adha',     emoji: '🐑', bannerColor: '#f59e0b', discountPercent: 25 },
  { name: 'Ramadan Sale',    emoji: '🕌', bannerColor: '#6366f1', discountPercent: 15 },
  { name: 'Christmas Sale',  emoji: '🎄', bannerColor: '#ef4444', discountPercent: 20 },
  { name: "New Year's Sale", emoji: '🎆', bannerColor: '#8b5cf6', discountPercent: 30 },
  { name: "Valentine's Day", emoji: '❤️', bannerColor: '#ec4899', discountPercent: 15 },
  { name: 'Independence Day',emoji: '🇵🇰', bannerColor: '#22c55e', discountPercent: 15 },
  { name: 'Black Friday',    emoji: '🛍️', bannerColor: '#64748b', discountPercent: 30 },
  { name: 'Back to School',  emoji: '🎒', bannerColor: '#3b82f6', discountPercent: 10 },
];

// Discounts across the whole project are limited to these tiers — matches the
// Spin & Win / Catch-the-Gifts reward tiers so every discount in the kiosk is consistent.
const DISCOUNT_STEPS = [5, 10, 15, 20, 25, 30];

const EMPTY_FORM = {
  name: '', emoji: '🎉', description: '',
  startDate: '', endDate: '',
  discountPercent: 15,
  bannerColor: '#ec4899',
  isActive: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysBetween(a, b) {
  if (!a || !b) return 0;
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function eventStatus(ev) {
  const now = new Date();
  const s   = new Date(ev.startDate);
  const e   = new Date(ev.endDate);
  if (!ev.isActive)  return { label: 'Disabled', color: '#475569', bg: 'rgba(71,85,105,0.15)' };
  if (now < s)       return { label: 'Upcoming', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
  if (now > e)       return { label: 'Expired',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  };
  return               { label: 'LIVE',     color: '#10b981', bg: 'rgba(16,185,129,0.12)' };
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── EventsPage ───────────────────────────────────────────────────────────────
export default function EventsPage() {
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const daysCount = daysBetween(form.startDate, form.endDate);
  const daysOver  = daysCount > 30;

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get('/api/events');
      setEvents(r.data.data || []);
    } catch { setEvents([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const applyPreset = (p) => {
    setForm(f => ({ ...f, name: p.name, emoji: p.emoji, bannerColor: p.bannerColor, discountPercent: p.discountPercent }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Event name is required.'); return; }
    if (!form.startDate)   { setError('Start date is required.'); return; }
    if (!form.endDate)     { setError('End date is required.'); return; }
    if (daysCount <= 0)    { setError('End date must be after start date.'); return; }
    if (daysOver)          { setError('Duration cannot exceed 30 days.'); return; }
    setSaving(true);
    try {
      await axios.post('/api/events', form);
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save event.');
    } finally { setSaving(false); }
  };

  const handleToggle = async (id) => {
    try {
      const r = await axios.patch(`/api/events/${id}/toggle`);
      setEvents(prev => prev.map(ev => ev._id === id ? r.data.data : ev));
    } catch { alert('Failed to toggle event.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    await axios.delete(`/api/events/${id}`);
    load();
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 8, color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)', fontSize: '0.88rem', outline: 'none',
  };

  return (
    <div style={{ padding: '30px 36px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 className="db-page-title">Festival Events</h1>
          <p className="db-page-sub">Create seasonal offers — Eid, Christmas, Independence Day and more</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setForm(EMPTY_FORM); setError(''); }}
          style={{
            padding: '10px 22px',
            background: 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(6,182,212,0.2))',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)',
            borderRadius: 10,
            color: '#f0abfc', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
            boxShadow: '0 0 20px rgba(236,72,153,0.2)',
          }}
        >
          + New Event
        </button>
      </div>

      {/* ── Add Event Modal ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: 560, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>

            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 28px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>Create Festival Event</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.8rem', lineHeight: 1, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ overflowY: 'auto', padding: '22px 28px 28px' }}>

              {/* Quick presets */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 10, textTransform: 'uppercase' }}>
                  Quick Select Festival
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {PRESETS.map(p => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => applyPreset(p)}
                      style={{
                        padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                        background: form.name === p.name ? `${p.bannerColor}22` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${form.name === p.name ? p.bannerColor + '88' : 'rgba(255,255,255,0.1)'}`,
                        color: form.name === p.name ? p.bannerColor : 'var(--text-secondary)',
                        fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.2s',
                      }}
                    >
                      {p.emoji} {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit}>

                {/* Validation error — always visible at top */}
                {error && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 8, color: '#f87171', fontSize: '0.85rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    ⚠️ {error}
                  </div>
                )}

                {/* Name + Emoji row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Event Name *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Eid ul Fitr" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Emoji</label>
                    <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} placeholder="🎉" style={{ ...inputStyle, textAlign: 'center', fontSize: '1.3rem' }} />
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Description (optional)</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Special Eid discounts on all clothing brands..." style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
                </div>

                {/* Date range */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 6 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Start Date *</label>
                    <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>End Date *</label>
                    <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} />
                  </div>
                </div>

                {/* Duration indicator */}
                {daysCount > 0 && (
                  <div style={{
                    marginBottom: 14, padding: '8px 12px', borderRadius: 8,
                    background: daysOver ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.08)',
                    border: `1px solid ${daysOver ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.2)'}`,
                    fontSize: '0.8rem',
                    color: daysOver ? '#f87171' : '#6ee7b7',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span>{daysOver ? '⚠️' : '✓'}</span>
                    <span>
                      Duration: <strong>{daysCount} days</strong>
                      {daysOver ? ' — exceeds 30-day limit!' : ` (max 30 days)`}
                    </span>
                    {!daysOver && (
                      <div style={{ marginLeft: 'auto', width: 80, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)' }}>
                        <div style={{ width: `${Math.min((daysCount / 30) * 100, 100)}%`, height: '100%', borderRadius: 2, background: '#10b981', transition: 'width 0.3s' }} />
                      </div>
                    )}
                  </div>
                )}

                {/* Discount % — locked to the same tiers as the kiosk games (5/10/15/20/25/30) */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Discount % *
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {DISCOUNT_STEPS.map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, discountPercent: pct }))}
                        style={{
                          padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                          background: form.discountPercent === pct ? `${form.bannerColor}22` : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${form.discountPercent === pct ? form.bannerColor + '88' : 'rgba(255,255,255,0.1)'}`,
                          color: form.discountPercent === pct ? form.bannerColor : 'var(--text-secondary)',
                          fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-mono)', transition: 'all 0.2s',
                        }}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Banner color */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Banner Color</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {['#10b981','#f59e0b','#6366f1','#ef4444','#8b5cf6','#ec4899','#22c55e','#3b82f6','#06b6d4','#64748b'].map(c => (
                      <button key={c} type="button" onClick={() => setForm(f => ({ ...f, bannerColor: c }))}
                        style={{
                          width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                          border: form.bannerColor === c ? `3px solid white` : '2px solid transparent',
                          boxShadow: form.bannerColor === c ? `0 0 10px ${c}` : 'none',
                          transition: 'all 0.2s',
                        }}
                      />
                    ))}
                    <input type="color" value={form.bannerColor} onChange={e => setForm(f => ({ ...f, bannerColor: e.target.value }))}
                      style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'none', padding: 0 }}
                      title="Custom color"
                    />
                  </div>
                </div>

                {/* Preview */}
                {form.name && (
                  <div style={{
                    marginBottom: 18, padding: '14px 18px', borderRadius: 10,
                    background: `${form.bannerColor}18`,
                    border: `1px solid ${form.bannerColor}44`,
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <span style={{ fontSize: '1.6rem' }}>{form.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem' }}>{form.name}</div>
                      <div style={{ fontSize: '0.75rem', color: form.bannerColor, fontWeight: 600 }}>
                        {form.discountPercent}% Special Offer — kiosk banner preview
                      </div>
                    </div>
                  </div>
                )}

                {/* Is Active */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                  <label htmlFor="isActive" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    Enable immediately (show banner on kiosk when dates match)
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" disabled={saving || daysOver}
                    style={{ flex: 1, padding: '12px', background: daysOver ? 'rgba(255,255,255,0.04)' : `linear-gradient(135deg, ${form.bannerColor}99, ${form.bannerColor}55)`, border: `1px solid ${form.bannerColor}66`, borderRadius: 8, color: daysOver ? 'var(--text-muted)' : '#fff', fontWeight: 700, cursor: daysOver ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Saving...' : 'Create Event'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    style={{ padding: '12px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Events List ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading events...</div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: '0.95rem', marginBottom: 6, color: 'var(--text-secondary)' }}>No events yet</div>
          <div style={{ fontSize: '0.8rem' }}>Create your first festival event — Eid, Christmas, Independence Day...</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {events.map(ev => {
            const st = eventStatus(ev);
            const days = daysBetween(ev.startDate, ev.endDate);
            return (
              <div key={ev._id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderLeft: `4px solid ${ev.bannerColor}`,
                borderRadius: 12, padding: '18px 22px',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>

                {/* Emoji */}
                <div style={{ fontSize: '2rem', minWidth: 48, textAlign: 'center' }}>{ev.emoji}</div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{ev.name}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.color}44` }}>
                      {st.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span>📅 {fmtDate(ev.startDate)} → {fmtDate(ev.endDate)}</span>
                    <span>⏱ {days} days</span>
                    <span style={{ color: ev.bannerColor, fontWeight: 600 }}>🏷 {ev.discountPercent}% OFF</span>
                  </div>
                  {ev.description && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.description}</div>
                  )}
                </div>

                {/* Color swatch */}
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: ev.bannerColor, boxShadow: `0 0 8px ${ev.bannerColor}88`, flexShrink: 0 }} />

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => handleToggle(ev._id)}
                    style={{
                      padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                      background: ev.isActive ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                      border: ev.isActive ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(16,185,129,0.3)',
                      color: ev.isActive ? '#fbbf24' : '#34d399',
                    }}
                  >
                    {ev.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDelete(ev._id)}
                    style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: '#f87171', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
