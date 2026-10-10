import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Sun, Moon, Languages } from 'lucide-react'
import { motion } from 'framer-motion'
import { ThemeContext } from './ThemeContext'
import { LanguageProvider, useLanguage } from './i18n/LanguageContext'
import AttractLoop     from './components/AttractLoop'
import ScanPage        from './pages/ScanPage'
import GamePage        from './pages/GamePage'
import CatchGiftsGamePage from './pages/CatchGiftsGamePage'
import FeedbackPage    from './pages/FeedbackPage'
import LoginPage       from './pages/LoginPage'
import DashboardLayout from './dashboard/DashboardLayout'
import './App.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return localStorage.getItem('admin_token')
    ? <>{children}</>
    : <Navigate to="/admin/login" replace />
}

function AppInner({ isDarkMode, setIsDarkMode }: {
  isDarkMode: boolean
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const location = useLocation()
  const isAdmin  = location.pathname.startsWith('/admin')
  const { toggleLang, t } = useLanguage()

  return (
    <>
      <Routes>
        <Route path="/"            element={<AttractLoop  />} />
        <Route path="/scan"        element={<ScanPage     />} />
        <Route path="/game"        element={<GamePage     />} />
        <Route path="/game-catch"  element={<CatchGiftsGamePage />} />
        <Route path="/feedback"    element={<FeedbackPage />} />
        <Route path="/admin/login" element={<LoginPage    />} />
        <Route path="/admin/*"     element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Floating theme toggle — hidden on admin panel */}
      {!isAdmin && (
        <motion.button
          onClick={() => setIsDarkMode(d => !d)}
          className="fixed bottom-24 left-6 z-50 p-4 rounded-full shadow-2xl"
          style={{
            background:     isDarkMode ? 'rgba(255,255,255,0.08)' : '#ffffff',
            border:         isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #e2e8f0',
            backdropFilter: 'blur(12px)',
            transition:     'background 0.3s, border 0.3s',
          }}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.93 }}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode
            ? <Sun  size={20} strokeWidth={1.8} className="text-amber-400" />
            : <Moon size={20} strokeWidth={1.8} className="text-slate-500" />}
        </motion.button>
      )}

      {/* Floating language toggle — hidden on admin panel */}
      {!isAdmin && (
        <motion.button
          onClick={toggleLang}
          className="fixed bottom-24 left-24 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl"
          style={{
            background:     isDarkMode ? 'rgba(255,255,255,0.08)' : '#ffffff',
            border:         isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #e2e8f0',
            backdropFilter: 'blur(12px)',
            transition:     'background 0.3s, border 0.3s',
            color:          isDarkMode ? 'rgba(255,255,255,0.85)' : '#334155',
          }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Switch language"
        >
          <Languages size={16} strokeWidth={1.8} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{t('lang.toggleLabel')}</span>
        </motion.button>
      )}
    </>
  )
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  return (
    <ThemeContext.Provider value={isDarkMode}>
      <LanguageProvider>
        <BrowserRouter>
          <AppInner isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        </BrowserRouter>
      </LanguageProvider>
    </ThemeContext.Provider>
  )
}
