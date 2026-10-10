import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const BACKEND = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin_user')); } catch { return null; }
  });

  const login = async (email, password) => {
    const res = await axios.post(`${BACKEND}/api/auth/login`, { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('admin_token', res.data.token);
    localStorage.setItem('admin_user', JSON.stringify(res.data.user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    return res.data;
  };

  const logout = () => {
    setToken(null); setUser(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  // Set token on mount
  React.useEffect(() => {
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }, [token]);

  return <AuthContext.Provider value={{ token, user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@smartmall.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(email, password);
    } catch {
      setError('Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #080c14 0%, #0f1a2e 100%)',
    }}>
      <div style={{
        width: 400, padding: '48px 40px',
        background: 'var(--bg-card)', borderRadius: 16,
        border: '1px solid var(--border)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        animation: 'fadeIn 0.4s ease',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🛍️</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Smart Mall Admin</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sign in to access the dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>
          {[
            { label: 'Email', value: email, set: setEmail, type: 'email' },
            { label: 'Password', value: password, set: setPassword, type: 'password' },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.05em' }}>{f.label.toUpperCase()}</label>
              <input
                type={f.type} value={f.value} onChange={e => f.set(e.target.value)} required
                style={{
                  width: '100%', padding: '12px 14px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          ))}

          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', fontSize: '0.85rem', marginBottom: 18 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px', borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
            border: 'none', color: '#fff', fontFamily: 'var(--font-sans)',
            fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
          Default: admin@smartmall.com / admin123
        </p>
      </div>
    </div>
  );
}
