import React, { useEffect, useState } from 'react';
import axios from 'axios';

// ─── Constants (original, untouched) ─────────────────────────────────────────
const CATEGORIES    = ['clothes', 'food', 'accessories', 'electronics', 'games', 'general'];
const AGE_GROUPS    = ['all', 'child', 'teen', 'adult', 'senior'];
const GENDERS       = ['all', 'male', 'female'];
const WEATHERS      = ['All', 'Hot', 'Cold', 'Rain', 'Sunny', 'Windy'];
const WEATHER_ICONS = { All: '🌤', Hot: '☀️', Cold: '🥶', Rain: '🌧️', Sunny: '😎', Windy: '💨' };
const EMPTY_FORM    = { title: '', brand: '', description: '', imageUrl: '', category: 'clothes', targetGender: 'all', targetAgeGroup: 'all', targetWeather: 'All', price: 0, storeName: '', floor: '', isActive: true };

// ─── Data-mapping helpers (new — UI untouched) ────────────────────────────────
const AGE_KEY_FWD = { Kid: 'child', Young: 'teen', Adult: 'adult', Senior: 'senior', All: 'all' };
const AGE_KEY_REV = { child: 'Kid', teen: 'Young', adult: 'Adult', senior: 'Senior', all: 'All' };
const CAT_FWD     = { Clothes: 'clothes', Food: 'food', Accessories: 'accessories', Electronics: 'electronics', Other: 'general' };
const CAT_REV     = { clothes: 'Clothes', food: 'Food', accessories: 'Accessories', electronics: 'Electronics', games: 'Electronics', general: 'Other' };

function productToContent(p) {
  return {
    _id:            p._id,
    title:          p.name,
    brand:          p.brand || '',
    description:    p.description || '',
    imageUrl:       p.imageUrl || '',
    category:       CAT_FWD[p.category] ?? p.category?.toLowerCase() ?? 'general',
    targetGender:   p.targetDemographics?.[0]?.gender?.toLowerCase() || 'all',
    targetAgeGroup: AGE_KEY_FWD[p.targetDemographics?.[0]?.age] ?? 'all',
    targetWeather:  p.targetWeather || 'All',
    discountPercent: 0,
    price:           p.price || 0,
    storeName:       p.storeName || '',
    floor:           p.storeLocation?.floor || '',
    views:           p.clickCount || 0,
    isActive:        p.isActive,
  };
}

function contentToProduct(form) {
  return {
    name:          form.title,
    brand:         form.brand || '',
    description:   form.description || '',
    imageUrl:      form.imageUrl || '',
    category:      CAT_REV[form.category] || 'Other',
    price:         Number(form.price) || 0,
    storeName:     form.storeName || '',
    isActive:      form.isActive,
    targetWeather: form.targetWeather || 'All',
    storeLocation: { floor: form.floor || '1', storeNumber: 'N/A' },
    targetDemographics: [{
      age:    AGE_KEY_REV[form.targetAgeGroup] || 'All',
      gender: form.targetGender === 'all' ? 'All'
              : form.targetGender.charAt(0).toUpperCase() + form.targetGender.slice(1),
    }],
  };
}

// ─── Badge (original, untouched) ─────────────────────────────────────────────
function Badge({ children, color }) {
  const colors = {
    green: { bg: 'rgba(16,185,129,0.1)',  text: '#10b981', border: 'rgba(16,185,129,0.2)'  },
    blue:  { bg: 'rgba(59,130,246,0.1)',  text: '#3b82f6', border: 'rgba(59,130,246,0.2)'  },
    pink:  { bg: 'rgba(236,72,153,0.1)',  text: '#ec4899', border: 'rgba(236,72,153,0.2)'  },
    gray:  { bg: 'rgba(71,85,105,0.2)',   text: '#94a3b8', border: 'rgba(71,85,105,0.3)'   },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {children}
    </span>
  );
}

// ─── ContentPage ──────────────────────────────────────────────────────────────
export default function ContentPage() {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [editId,   setEditId]   = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState('');

  const load = async () => {
    setLoading(true);
    try {
      // Changed: was /api/content/all — mapped to our products endpoint
      const res = await axios.get('/api/products?includeInactive=true');
      setItems((res.data.data || []).map(productToContent));
    } catch {
      setItems([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await axios.put(`/api/products/${editId}`, contentToProduct(form));
      } else {
        await axios.post('/api/products', contentToProduct(form));
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditId(null);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this content item?')) return;
    // Changed: was DELETE /api/content/:id — mapped to our products endpoint
    await axios.delete(`/api/products/${id}`);
    load();
  };

  const handleDownload = (imageUrl, title) => {
    if (!imageUrl) return;
    const params = new URLSearchParams({ url: imageUrl, name: title });
    window.open(`/api/download?${params}`, '_blank');
  };

  const handleEdit = (item) => {
    setForm({ title: item.title, brand: item.brand || '', description: item.description || '', imageUrl: item.imageUrl || '', category: item.category, targetGender: item.targetGender, targetAgeGroup: item.targetAgeGroup, targetWeather: item.targetWeather || 'All', price: item.price || 0, storeName: item.storeName || '', floor: item.floor || '', isActive: item.isActive });
    setEditId(item._id);
    setShowForm(true);
  };

  const filtered = items.filter(i => i.title?.toLowerCase().includes(search.toLowerCase()) || i.brand?.toLowerCase().includes(search.toLowerCase()));

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 8, color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)', fontSize: '0.88rem', outline: 'none',
  };

  return (
    <div style={{ padding: '30px 36px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div className="db-page-header" style={{ padding: 0, margin: 0 }}>
          <h1 className="db-page-title">Content Manager</h1>
          <p className="db-page-sub">Upload and manage promotional content shown on the kiosk</p>
        </div>
        <button onClick={() => { setShowForm(true); setForm(EMPTY_FORM); setEditId(null); }} style={{
          padding: '10px 22px',
          background: 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(6,182,212,0.2))',
          border: '1px solid rgba(255,255,255,0.15)',
          backdropFilter: 'blur(12px)',
          borderRadius: 10,
          color: '#f0abfc', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
          boxShadow: '0 0 20px rgba(236,72,153,0.2)',
        }}>+ Add Content</button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or brand..."
          style={{ ...inputStyle, width: 300 }} />
      </div>

      {/* Modal / Form */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: 540, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, animation: 'fadeIn 0.2s ease', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>{editId ? 'Edit Content' : 'Add New Content'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.8rem', lineHeight: 1, cursor: 'pointer', padding: '0 4px' }}>×</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '24px 32px 32px' }}>
            <form onSubmit={handleSubmit}>
              {[
                { key: 'title',       label: 'Title *',    type: 'text',     required: true },
                { key: 'brand',       label: 'Brand',      type: 'text' },
                { key: 'description', label: 'Description', type: 'textarea' },
                { key: 'price',       label: 'Price (PKR)', type: 'number' },
                { key: 'storeName',   label: 'Store Name', type: 'text' },
                { key: 'floor',       label: 'Floor',      type: 'text' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, letterSpacing: '0.05em' }}>{f.label.toUpperCase()}</label>
                  {f.type === 'textarea' ? (
                    <textarea value={form[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} />
                  ) : (
                    <input type={f.type} value={form[f.key]} required={f.required} onChange={e => setForm(p => ({...p, [f.key]: f.type==='number' ? (parseFloat(e.target.value)||0) : e.target.value}))} style={inputStyle} />
                  )}
                </div>
              ))}

              {/* Image URL + live preview */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, letterSpacing: '0.05em' }}>IMAGE URL</label>
                <input type="text" value={form.imageUrl} onChange={e => setForm(p => ({...p, imageUrl: e.target.value}))} placeholder="https://images.unsplash.com/... or /weather-products/ice-cream.svg" style={inputStyle} />
                {form.imageUrl && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img
                      src={form.imageUrl}
                      alt="preview"
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}
                      onError={e => { e.target.style.display = 'none' }}
                      onLoad={e  => { e.target.style.display = 'block' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Image preview — paste any URL to change</span>
                  </div>
                )}
              </div>

              {[
                { key: 'category',      label: 'Category',        options: CATEGORIES },
                { key: 'targetGender',  label: 'Target Gender',   options: GENDERS    },
                { key: 'targetAgeGroup',label: 'Target Age Group', options: AGE_GROUPS },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, letterSpacing: '0.05em' }}>{f.label.toUpperCase()}</label>
                  <select value={form[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} style={{ ...inputStyle, backgroundColor: '#1e1e1e', color: '#f1f5f9' }}>
                    {f.options.map(o => <option key={o} value={o} style={{ backgroundColor: '#1e1e1e', color: '#f1f5f9' }}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                  </select>
                </div>
              ))}

              {/* Target Weather */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, letterSpacing: '0.05em' }}>TARGET WEATHER</label>
                <select value={form.targetWeather} onChange={e => setForm(p => ({...p, targetWeather: e.target.value}))} style={{ ...inputStyle, backgroundColor: '#1e1e1e', color: '#f1f5f9' }}>
                  {WEATHERS.map(w => (
                    <option key={w} value={w} style={{ backgroundColor: '#1e1e1e', color: '#f1f5f9' }}>{WEATHER_ICONS[w]} {w}</option>
                  ))}
                </select>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  This ad shows only when kiosk weather matches. "All" = always show.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(p => ({...p, isActive: e.target.checked}))} />
                <label htmlFor="isActive" style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>Active (visible on kiosk)</label>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '12px', background: 'var(--accent-blue)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : editId ? 'Update Content' : 'Add Content'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '12px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading content...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          No content found. Add your first item!
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Image', 'Title', 'Category', 'Target', 'Weather', 'Views', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 18px' }}>
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.title} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                      : <div style={{ width: 48, height: 48, borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
                    }
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{item.title}</div>
                    {item.brand && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.brand}</div>}
                  </td>
                  <td style={{ padding: '14px 18px' }}><Badge color="blue">{item.category}</Badge></td>
                  <td style={{ padding: '14px 18px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {item.targetGender} · {item.targetAgeGroup}
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span title={item.targetWeather}>{WEATHER_ICONS[item.targetWeather] ?? '🌤'} {item.targetWeather || 'All'}</span>
                  </td>
                  <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.views || 0}</td>
                  <td style={{ padding: '14px 18px' }}><Badge color={item.isActive ? 'green' : 'gray'}>{item.isActive ? 'Active' : 'Hidden'}</Badge></td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => handleEdit(item)} style={{ padding: '5px 12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 6, color: '#3b82f6', fontSize: '0.78rem', cursor: 'pointer' }}>Edit</button>
                      {item.imageUrl && (
                        <button onClick={() => handleDownload(item.imageUrl, item.title)} style={{ padding: '5px 10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 6, color: '#10b981', fontSize: '0.78rem', cursor: 'pointer' }} title="Download image to PC">⬇</button>
                      )}
                      <button onClick={() => handleDelete(item._id)} style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: '#f87171', fontSize: '0.78rem', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
