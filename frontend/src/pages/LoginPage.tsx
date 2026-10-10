import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react'
import '../dashboard/dashboard.css'

export default function LoginPage() {
  const navigate = useNavigate()

  const [username,    setUsername]    = useState('')
  const [password,    setPassword]    = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [focusedField, setFocusedField] = useState<'user' | 'pass' | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await axios.post('/api/auth/login', { username, password })
      localStorage.setItem('admin_token', data.token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
      navigate('/admin')
    } catch {
      setError('Invalid username or password')
      setLoading(false)
    }
  }

  const fieldWrap = (focused: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '13px 16px',
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: `1px solid ${focused ? 'rgba(236,72,153,0.55)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 10,
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focused
      ? '0 0 0 3px rgba(236,72,153,0.12), 0 0 18px rgba(6,182,212,0.1)'
      : 'none',
  })

  const inputStyle: React.CSSProperties = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'rgba(255,255,255,0.92)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.9rem',
    minWidth: 0,
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      fontFamily: 'var(--font-sans)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes loginCardIn { from { opacity:0; transform:translateY(14px) scale(0.98) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes loginGlow   { 0%,100% { opacity:0.55 } 50% { opacity:1 } }
        .login-input::placeholder { color: rgba(255,255,255,0.25); }
        .login-submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(236,72,153,0.35), 0 0 20px rgba(6,182,212,0.2); }
        .login-submit-btn:active:not(:disabled) { transform: translateY(0); }
        .login-eye-btn:hover { color: rgba(255,255,255,0.8) !important; }
      `}</style>

      <div className="db-blob db-blob-1" />
      <div className="db-blob db-blob-2" />
      <div className="db-blob db-blob-3" />
      <div className="db-mesh" />
      <div className="db-corner db-corner-tl" />
      <div className="db-corner db-corner-tr" />
      <div className="db-corner db-corner-bl" />
      <div className="db-corner db-corner-br" />

      <div style={{
        position: 'relative',
        zIndex: 1,
        width: 420,
        maxWidth: 'calc(100vw - 40px)',
        padding: '44px 38px',
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        boxShadow: '0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
        animation: 'loginCardIn 0.5s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        {/* top-edge glass highlight, same as dashboard cards */}
        <div style={{
          position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
        }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 34 }}>
          <div style={{
            width: 58, height: 58,
            margin: '0 auto 18px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(236,72,153,0.3), rgba(6,182,212,0.25))',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 28px rgba(236,72,153,0.35), 0 0 14px rgba(6,182,212,0.2)',
            animation: 'loginGlow 3s ease-in-out infinite',
          }}>
            <ShieldCheck size={28} color="#fff" strokeWidth={1.8} />
          </div>
          <h1 style={{
            fontSize: '1.6rem', fontWeight: 800, marginBottom: 7, letterSpacing: '-0.02em',
            background: 'linear-gradient(90deg, #f472b6, #67e8f9)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Smart Mall Admin
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.86rem', letterSpacing: '0.02em' }}>
            Sign in to manage your kiosk
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)',
              marginBottom: 7, letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>
              Username
            </label>
            <div style={fieldWrap(focusedField === 'user')}>
              <User size={17} color="rgba(255,255,255,0.35)" strokeWidth={2} />
              <input
                className="login-input"
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                onFocus={() => setFocusedField('user')}
                onBlur={() => setFocusedField(null)}
                placeholder="admin"
                required
                autoComplete="username"
                autoFocus
                style={inputStyle}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)',
              marginBottom: 7, letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>
              Password
            </label>
            <div style={fieldWrap(focusedField === 'pass')}>
              <Lock size={17} color="rgba(255,255,255,0.35)" strokeWidth={2} />
              <input
                className="login-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onFocus={() => setFocusedField('pass')}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={inputStyle}
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: 2,
                  display: 'flex', color: 'rgba(255,255,255,0.35)', transition: 'color 0.15s',
                }}
              >
                {showPassword ? <EyeOff size={17} strokeWidth={2} /> : <Eye size={17} strokeWidth={2} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '11px 14px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10,
              color: '#f87171',
              fontSize: '0.84rem',
              marginBottom: 18,
              animation: 'loginCardIn 0.3s ease both',
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="login-submit-btn"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #ec4899, #06b6d4)',
              border: 'none',
              color: '#fff',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.75 : 1,
              transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.2s',
              letterSpacing: '0.01em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(236,72,153,0.25)',
            }}
          >
            {loading ? 'Signing in…' : <>Sign In <ArrowRight size={17} strokeWidth={2.2} /></>}
          </button>
        </form>
      </div>
    </div>
  )
}
