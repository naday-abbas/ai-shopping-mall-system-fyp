import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const CATEGORIES = ['clothes', 'food', 'accessories', 'electronics', 'games', 'general'];
const AGE_GROUPS = ['all', 'child', 'teen', 'adult', 'senior'];
const GENDERS = ['all', 'male', 'female'];

const EMPTY_FORM = { title: '', description: '', imageUrl: '', category: 'clothes', targetGender: 'all', targetAgeGroup: 'all', discountPercent: 0, brand: '', isActive: true };

function Badge({ children, color }) {
  const colors = {
    green: { bg: 'rgba(16,185,129,0.1)', text: '#10b981', border: 'rgba(16,185,129,0.2)' },
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

export default function ContentPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND}/api/content/all`);
      setItems(res.data);
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
        await axios.put(`${BACKEND}/api/content/${editId}`, form);
      } else {
        await axios.post(`${BACKEND}/api/content`, form);
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
    await axios.delete(`${BACKEND}/api/content/${id}`);
    load();
  };

  const handleEdit = (item) => {
    setForm({ title: item.title, description: item.description || '', imageUrl: item.imageUrl || '', category: item.category, targetGender: item.targetGender, targetAgeGroup: item.targetAgeGroup, discountPercent: item.discountPercent || 0, brand: item.brand || '', isActive: item.isActive });
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
    <div style={{ padding: '32px 36px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Content Manager</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Upload and manage promotional content shown on the kiosk</p>
        </div>
        <button onClick={() => { setShowForm(true); setForm(EMPTY_FORM); setEditId(null); }} style={{
          padding: '10px 22px', background: 'var(--accent-blue)', border: 'none', borderRadius: 8,
          color: '#fff', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
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
          <div style={{ width: 540, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '32px', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>{editId ? 'Edit Content' : 'Add New Content'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              {[
                { key: 'title', label: 'Title *', type: 'text', required: true },
                { key: 'brand', label: 'Brand', type: 'text' },
                { key: 'description', label: 'Description', type: 'textarea' },
                { key: 'imageUrl', label: 'Image URL', type: 'url' },
                { key: 'discountPercent', label: 'Discount %', type: 'number' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, letterSpacing: '0.05em' }}>{f.label.toUpperCase()}</label>
                  {f.type === 'textarea' ? (
                    <textarea value={form[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} />
                  ) : (
                    <input type={f.type} value={form[f.key]} required={f.required} onChange={e => setForm(p => ({...p, [f.key]: f.type==='number' ? parseInt(e.target.value)||0 : e.target.value}))} style={inputStyle} />
                  )}
                </div>
              ))}

              {[
                { key: 'category', label: 'Category', options: CATEGORIES },
                { key: 'targetGender', label: 'Target Gender', options: GENDERS },
                { key: 'targetAgeGroup', label: 'Target Age Group', options: AGE_GROUPS },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, letterSpacing: '0.05em' }}>{f.label.toUpperCase()}</label>
                  <select value={form[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} style={{ ...inputStyle }}>
                    {f.options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                  </select>
                </div>
              ))}

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
                {['Title', 'Category', 'Target', 'Discount', 'Views', 'Status', 'Actions'].map(h => (
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
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{item.title}</div>
                    {item.brand && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.brand}</div>}
                  </td>
                  <td style={{ padding: '14px 18px' }}><Badge color="blue">{item.category}</Badge></td>
                  <td style={{ padding: '14px 18px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {item.targetGender} · {item.targetAgeGroup}
                  </td>
                  <td style={{ padding: '14px 18px' }}>{item.discountPercent > 0 ? <Badge color="green">{item.discountPercent}% OFF</Badge> : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>}</td>
                  <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.views || 0}</td>
                  <td style={{ padding: '14px 18px' }}><Badge color={item.isActive ? 'green' : 'gray'}>{item.isActive ? 'Active' : 'Hidden'}</Badge></td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleEdit(item)} style={{ padding: '5px 12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 6, color: '#3b82f6', fontSize: '0.78rem', cursor: 'pointer' }}>Edit</button>
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
