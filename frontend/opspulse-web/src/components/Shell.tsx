import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Activity, AlertCircle, Bell, ChevronDown, FlaskConical, Loader2, Search,
  Settings as SettingsIcon, ShieldCheck, Zap,
} from 'lucide-react'
import { navigate, routePath } from '../router'
import type { Route } from '../router'
import { relTime } from '../format'
import { useStore } from '../store'

const NAV_ITEMS = [
  { route: { name: 'overview' } as Route, label: 'Overview', icon: Activity },
  { route: { name: 'incidents' } as Route, label: 'Incidents', icon: AlertCircle },
  { route: { name: 'investigations' } as Route, label: 'AI Investigations', icon: Zap },
  { route: { name: 'settings' } as Route, label: 'Settings', icon: SettingsIcon },
]

function isActive(current: Route, item: Route): boolean {
  if (item.name === 'incidents') return current.name === 'incidents' || current.name === 'incident'
  return current.name === item.name
}

const TITLES: Record<Route['name'], string> = {
  overview: 'Overview',
  incidents: 'Incidents',
  incident: 'Incident detail',
  investigations: 'AI Investigations',
  settings: 'Settings',
}

export function Shell({ route, onOpenSearch, children }: { route: Route; onOpenSearch: () => void; children: ReactNode }) {
  const { mode, incidents, investigations, settings, health, useBrowserDemo } = useStore()
  const [alertsOpen, setAlertsOpen] = useState(false)
  const alertsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!alertsOpen) return
    const onDown = (e: MouseEvent) => {
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) setAlertsOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [alertsOpen])

  const alerts = useMemo(
    () => [...incidents]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 8),
    [incidents],
  )

  const openCount = incidents.filter(i => i.status !== 'Resolved').length

  return (
    <div className={`app-shell density-${settings.density}`}>
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Activity size={19} /></div><span>RootBeacon</span></div>
        <button className="workspace" type="button" onClick={() => navigate('/settings')} title="Open workspace settings">
          <div className="workspace-avatar">{settings.workspaceName.slice(0, 1).toUpperCase() || 'W'}</div>
          <div><strong>{settings.workspaceName}</strong><small>Demo workspace</small></div>
          <ChevronDown size={15} />
        </button>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {NAV_ITEMS.map(item => (
            <a
              key={item.label}
              className={`nav-item ${isActive(route, item.route) ? 'active' : ''}`}
              href={`#${routePath(item.route)}`}
            >
              <item.icon size={17} /> {item.label}
              {item.route.name === 'incidents' && <span className="nav-count">{incidents.length}</span>}
              {item.route.name === 'investigations' && investigations.length > 0 && <span className="nav-count">{investigations.length}</span>}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="status-card">
            <span className="status-dot" />
            <div>
              <strong>{mode === 'api' ? 'API connected' : mode === 'loading' ? 'Connecting...' : 'Browser demo'}</strong>
              <small>{mode === 'api' ? `Live API + ${health?.database ?? 'demo data'}` : mode === 'loading' ? 'Checking for the API' : 'No server needed'}</small>
            </div>
          </div>
          <div className="profile"><div className="profile-avatar">SG</div><div><strong>Workspace Admin</strong><small>Demo preview</small></div><ChevronDown size={15} /></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-brand"><div className="brand-mark"><Activity size={16} /></div><span>RootBeacon</span></div>
          <div className="breadcrumbs">Workspace <span>/</span> <strong>{TITLES[route.name]}</strong></div>
          <div className="top-actions">
            <button className="search" type="button" onClick={onOpenSearch}>
              <Search size={15} /><span>Search incidents...</span><kbd>⌘ K</kbd>
            </button>
            <div className="alerts-wrap" ref={alertsRef}>
              <button className="icon-button alerts-button" aria-label="Recent activity" onClick={() => setAlertsOpen(o => !o)}>
                <Bell size={18} />
                {openCount > 0 && <span className="alerts-badge">{openCount}</span>}
              </button>
              {alertsOpen && (
                <div className="alerts-dropdown">
                  <div className="alerts-head">Recent activity <span>{openCount} active</span></div>
                  {alerts.length === 0 && <p className="alerts-empty">No incidents yet.</p>}
                  {alerts.map(i => (
                    <button key={i.id} className="alerts-item" onClick={() => { setAlertsOpen(false); navigate(`/incidents/${i.id}`) }}>
                      <i className={`severity-dot ${i.severity.toLowerCase()}`} />
                      <div>
                        <strong>{i.title}</strong>
                        <small>{i.status === 'Resolved' ? 'Resolved' : 'Last updated'} {relTime(i.updatedAt)} · {i.serviceName}</small>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="top-avatar">SG</div>
          </div>
        </header>

        <section className="content">
          {mode === 'browser-demo' && (
            <div className="notice"><div className="notice-icon"><FlaskConical size={18} /></div><div><strong>Browser demo mode</strong><p>The API is not connected, so this app runs entirely in your browser with synthetic incidents and a local simulated analyzer. No data leaves your device.</p></div><span className="notice-tag">SIMULATED</span></div>
          )}
          {mode === 'api' && (
            <div className="notice ok"><div className="notice-icon"><ShieldCheck size={18} /></div><div><strong>Demo environment</strong><p>Connected to the RootBeacon API with a seeded SQLite demo database. All incidents are synthetic. Analysis is simulated and deterministic, not a live AI model. The public demo is read-only.</p></div><span className="notice-tag">DEMO DATA</span></div>
          )}

          {mode === 'loading' ? (
            <div className="loading-panel">
              <Loader2 className="spin" size={30} />
              <strong>Waking up the demo server...</strong>
              <p>The free demo host sleeps when idle, so the first visit can take up to a minute. This page connects on its own as soon as the API is up.</p>
              <button className="text-button" type="button" onClick={useBrowserDemo}>Skip the wait and explore the in-browser demo</button>
            </div>
          ) : children}

          <footer><span>RootBeacon <b>·</b> Demo build, synthetic data only</span><span>{mode === 'api' ? `API: ${health?.database ?? 'connected'}` : mode === 'loading' ? 'Connecting to the demo API' : 'Standalone browser demo'}</span></footer>
        </section>

        <nav className="mobile-nav">
          {NAV_ITEMS.map(item => (
            <a key={item.label} className={`mobile-nav-item ${isActive(route, item.route) ? 'active' : ''}`} href={`#${routePath(item.route)}`}>
              <item.icon size={19} />
              <span>{item.route.name === 'investigations' ? 'Investigate' : item.label}</span>
            </a>
          ))}
        </nav>
      </main>
    </div>
  )
}
