import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Tag, Monitor,
  ChevronLeft, LogOut,
} from 'lucide-react'
import OverviewTab from '../admin/OverviewTab'
import ProductsTab from '../admin/ProductsTab'
import CouponsTab  from '../admin/CouponsTab'

type Tab = 'overview' | 'products' | 'coupons'

const NAV: { id: Tab; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview',  Icon: LayoutDashboard },
  { id: 'products', label: 'Products',  Icon: Package         },
  { id: 'coupons',  label: 'Coupons',   Icon: Tag             },
]

export default function AdminPage() {
  const navigate = useNavigate()
  const [active, setActive] = useState<Tab>('overview')

  const handleLogout = () => navigate('/login')

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: '#000000', fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Sidebar ── */}
      <aside
        className="w-56 flex flex-col shrink-0"
        style={{
          background: '#111111',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div
          className="px-5 py-5 flex items-center gap-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="flex items-center justify-center rounded-lg shrink-0"
            style={{ width: 30, height: 30, background: '#a3e635' }}
          >
            <Monitor className="w-3.5 h-3.5" color="#000000" strokeWidth={2.2} />
          </div>
          <div>
            <p className="text-white font-light tracking-tight" style={{ fontSize: 14, lineHeight: 1.2 }}>
              Smart Mall
            </p>
            <p className="text-xs font-normal tracking-widest uppercase" style={{ color: '#2d3748', marginTop: 2 }}>
              Dashboard
            </p>
          </div>
        </div>

        {/* Nav label */}
        <p
          className="px-5 pt-5 pb-2 text-xs font-medium tracking-widest uppercase"
          style={{ color: '#2d3748' }}
        >
          Menu
        </p>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map(({ id, label, Icon }) => {
            const isActive = active === id
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-normal transition-all duration-100"
                style={
                  isActive
                    ? { background: '#a3e635', color: '#000000' }
                    : { background: 'transparent', color: '#64748b' }
                }
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
                    ;(e.currentTarget as HTMLElement).style.color = '#cbd5e1'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.color = '#64748b'
                  }
                }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div
          className="px-3 py-4 space-y-1"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Back to kiosk */}
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-normal w-full transition-all duration-100"
            style={{ color: '#334155', textDecoration: 'none' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
              ;(e.currentTarget as HTMLElement).style.color = '#64748b'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = '#334155'
            }}
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
            Back to Kiosk
          </Link>

          {/* Log Out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-normal transition-all duration-100"
            style={{ background: 'transparent', color: '#334155', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.07)'
              ;(e.currentTarget as HTMLElement).style.color = '#f87171'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = '#334155'
            }}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Log Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto" style={{ background: '#000000' }}>
        {active === 'overview' && <OverviewTab />}
        {active === 'products' && <ProductsTab />}
        {active === 'coupons'  && <CouponsTab  />}
      </main>
    </div>
  )
}
