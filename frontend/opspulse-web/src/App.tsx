import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Activity, AlertCircle, ArrowLeft, ArrowUpRight, Bell, CheckCircle2,
  ChevronDown, CircleDot, Clock3, FileText, FlaskConical, Search,
  ShieldAlert, ShieldCheck, Zap,
} from 'lucide-react'
import { api } from './api'
import { analyzeLocally, DEMO_INCIDENTS } from './demo/engine'
import type { Incident, IncidentAnalysisResult } from './types'

type DataMode = 'loading' | 'api' | 'browser-demo'

function relTime(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return `${Math.round(hrs / 24)} d ago`
}

function initials(service: string): string {
  return service.split(/[-_]/).map(p => p[0] ?? '').join('').slice(0, 2).toUpperCase()
}

function App() {
  const [mode, setMode] = useState<DataMode>('loading')
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api.health()
      .then(() => api.listIncidents())
      .then(list => { if (!cancelled) { setIncidents(list); setMode('api') } })
      .catch(() => { if (!cancelled) { setIncidents(DEMO_INCIDENTS); setMode('browser-demo') } })
    return () => { cancelled = true }
  }, [])

  const selected = useMemo(
    () => incidents.find(i => i.id === selectedId) ?? null,
    [incidents, selectedId],
  )

  const openIncident = async (id: string) => {
    setSelectedId(id)
    if (mode === 'api') {
      try {
        const full = await api.getIncident(id)
        setIncidents(list => list.map(i => (i.id === id ? full : i)))
      } catch { /* keep list-level data */ }
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Activity size={19} /></div><span>OpsPulse<span className="brand-ai"> AI</span></span></div>
        <div className="workspace"><div className="workspace-avatar">A</div><div><strong>Acme Engineering</strong><small>Demo workspace</small></div><ChevronDown size={15} /></div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          <a className={`nav-item ${selected ? '' : 'active'}`} onClick={() => setSelectedId(null)}><Activity size={17}/> Overview</a>
          <a className="nav-item"><AlertCircle size={17}/> Incidents <span className="nav-count">{incidents.length}</span></a>
          <a className="nav-item"><Zap size={17}/> AI Investigations</a>
          <a className="nav-item"><Clock3 size={17}/> Incident history</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="status-card"><span className="status-dot"/><div><strong>{mode === 'api' ? 'API connected' : 'Browser demo'}</strong><small>{mode === 'api' ? 'Local API + SQLite demo data' : 'No server needed'}</small></div></div>
          <div className="profile"><div className="profile-avatar">SG</div><div><strong>Workspace Admin</strong><small>Demo preview</small></div><ChevronDown size={15}/></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumbs">Workspace <span>/</span> <strong>{selected ? 'Incident detail' : 'Overview'}</strong></div>
          <div className="top-actions"><div className="search"><Search size={15}/><span>Search incidents...</span><kbd>⌘ K</kbd></div><button className="icon-button" aria-label="Notifications"><Bell size={18}/></button><div className="top-avatar">SG</div></div>
        </header>

        <section className="content">
          {mode === 'browser-demo' && (
            <div className="notice"><div className="notice-icon"><FlaskConical size={18}/></div><div><strong>Browser demo mode</strong><p>The API is not connected, so this dashboard runs entirely in your browser with synthetic incidents and a local simulated analyzer. No data leaves your device.</p></div><span className="notice-tag">SIMULATED</span></div>
          )}
          {mode === 'api' && (
            <div className="notice ok"><div className="notice-icon"><ShieldCheck size={18}/></div><div><strong>Demo environment</strong><p>Connected to the local OpsPulse API with a seeded SQLite demo database. All incidents are synthetic. Analysis is simulated and deterministic, not a live AI model.</p></div><span className="notice-tag">DEMO DATA</span></div>
          )}

          {selected
            ? <IncidentDetail incident={selected} mode={mode} onBack={() => setSelectedId(null)} />
            : <Overview incidents={incidents} onOpen={openIncident} />}

          <footer><span>OpsPulse AI <b>·</b> Demo build, synthetic data only</span><span>{mode === 'api' ? `API: ${api.base}` : 'Standalone browser demo'}</span></footer>
        </section>
      </main>
    </div>
  )
}

function Overview({ incidents, onOpen }: { incidents: Incident[]; onOpen: (id: string) => void }) {
  const active = incidents.filter(i => i.status !== 'Resolved').length
  const critical = incidents.filter(i => i.severity === 'Critical' && i.status !== 'Resolved').length
  const resolved = incidents.filter(i => i.status === 'Resolved').length

  return (
    <>
      <div className="page-heading">
        <div><div className="eyebrow"><span className="live-dot"/> INCIDENT INTELLIGENCE</div><h1>Production incidents</h1><p>Synthetic incidents with evidence-linked simulated analysis.</p></div>
      </div>

      <div className="metrics">
        <Metric label="Active incidents" value={String(active)} change="Synthetic demo data" icon={<AlertCircle size={18}/>} tone="orange"/>
        <Metric label="Critical incidents" value={String(critical)} change="Across services" icon={<ShieldAlert size={18}/>} tone="red"/>
        <Metric label="Resolved" value={String(resolved)} change="In this workspace" icon={<CheckCircle2 size={18}/>} tone="green"/>
        <Metric label="Log records" value={String(incidents.reduce((n, i) => n + i.logCount, 0))} change="Attached as evidence" icon={<FileText size={18}/>} tone="blue"/>
      </div>

      <div className="section-head"><div><h2>Recent incidents</h2><p>Select an incident to inspect logs and run analysis</p></div></div>
      <div className="table-wrap">
        <div className="table-head"><span>INCIDENT</span><span>SERVICE</span><span>SEVERITY</span><span>STATUS</span><span>CREATED</span><span/></div>
        {incidents.map((incident) => (
          <div className="table-row clickable" key={incident.id} onClick={() => onOpen(incident.id)}>
            <div className="incident-cell"><div className="service-avatar">{initials(incident.serviceName)}</div><div><strong>{incident.title}</strong><small>{incident.logCount} log records</small></div></div>
            <span className="service-name">{incident.serviceName}</span>
            <span><i className={`severity-dot ${incident.severity.toLowerCase()}`}/><span className={`severity ${incident.severity.toLowerCase()}`}>{incident.severity}</span></span>
            <span className={`status-pill ${incident.status.toLowerCase()}`}><CircleDot size={11}/>{incident.status}</span>
            <span className="age">{relTime(incident.createdAt)}</span>
            <button className="row-more" aria-label={`Open ${incident.title}`}><ArrowUpRight size={15}/></button>
          </div>
        ))}
      </div>
    </>
  )
}

function IncidentDetail({ incident, mode, onBack }: { incident: Incident; mode: DataMode; onBack: () => void }) {
  const [analysis, setAnalysis] = useState<IncidentAnalysisResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runAnalysis = async () => {
    setRunning(true)
    setError(null)
    try {
      const result = mode === 'api' ? await api.analyze(incident.id) : await analyzeLocally(incident)
      setAnalysis(result)
    } catch {
      setError('Analysis failed. Check that the API is running and try again.')
    } finally {
      setRunning(false)
    }
  }

  const logs = incident.logs ?? []

  return (
    <>
      <button className="text-button back-button" onClick={onBack}><ArrowLeft size={15}/> Back to incidents</button>

      <div className="detail-head">
        <div className="incident-cell"><div className="service-avatar large">{initials(incident.serviceName)}</div>
          <div>
            <h1>{incident.title}</h1>
            <div className="detail-meta">
              <span className="service-name">{incident.serviceName}</span>
              <span><i className={`severity-dot ${incident.severity.toLowerCase()}`}/><span className={`severity ${incident.severity.toLowerCase()}`}>{incident.severity}</span></span>
              <span className={`status-pill ${incident.status.toLowerCase()}`}><CircleDot size={11}/>{incident.status}</span>
              <span className="age">opened {relTime(incident.createdAt)}</span>
            </div>
          </div>
        </div>
        <p className="detail-desc">{incident.description}</p>
      </div>

      <div className="detail-grid">
        <div className="panel">
          <div className="panel-heading"><div><h3>Attached logs</h3><p>{logs.length} records, immutable after ingestion</p></div><span className="panel-icon"><FileText size={17}/></span></div>
          <p className="log-boundary-note">Raw logs are stored as ingested (immutable). Redaction happens at the analysis boundary: AI/evidence output never contains emails, IPs, keys or passwords. Retention and deletion controls are a production gap.</p>
          <div className="log-list">
            {logs.length === 0 && <p className="log-empty">No logs attached to this incident yet.</p>}
            {logs.map(l => (
              <div className="log-line" key={l.id}>
                <span className={`log-level ${l.level.toLowerCase()}`}>{l.level}</span>
                <span className="log-time">{l.occurredAt ? relTime(l.occurredAt) : ''}</span>
                <span className="log-msg">{l.message}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading"><div><h3>AI investigation</h3><p>Evidence-linked hypotheses and suggested fixes</p></div><span className="panel-icon purple"><Zap size={17}/></span></div>

          {!analysis && !running && (
            <div className="analyze-cta">
              <p>Run the analysis engine over this incident's logs. In this demo it is a <strong>simulated, deterministic analyzer</strong>, not a live AI model. It never executes fixes; it suggests them for a human operator.</p>
              <button className="primary-button" onClick={runAnalysis}><Zap size={15}/> Run simulated analysis</button>
            </div>
          )}
          {running && <div className="analyze-cta"><p className="analyzing">Analyzing {logs.length} log records...</p></div>}
          {error && <div className="analyze-cta"><p className="error-text">{error}</p></div>}

          {analysis && (
            <div className="analysis">
              <div className="analysis-banner"><FlaskConical size={14}/> SIMULATED ANALYSIS <span>{analysis.provider}</span></div>
              <p className="analysis-summary">{analysis.summary}</p>

              {analysis.hypotheses.map((h, i) => (
                <div className="hypothesis" key={i}>
                  <div className="hyp-head"><strong>{i + 1}. {h.title}</strong><span className="confidence">{Math.round(h.confidenceScore * 100)}% {h.confidenceLabel}</span></div>
                  <div className="confidence-bar"><div style={{ width: `${h.confidenceScore * 100}%` }}/></div>
                  <p className="hyp-rationale">{h.rationale}</p>
                  {h.evidence.length > 0 && <div className="evidence-label">EVIDENCE (redacted)</div>}
                  {h.evidence.map((e, j) => (
                    <div className="evidence-item" key={j}><span className={`log-level ${e.level.toLowerCase()}`}>{e.level}</span><code>{e.excerpt}</code></div>
                  ))}
                </div>
              ))}

              {analysis.suggestedActions.length > 0 && (
                <>
                  <div className="evidence-label">SUGGESTED ACTIONS, HUMAN-EXECUTED</div>
                  {analysis.suggestedActions.map((a, i) => (
                    <div className="action-item" key={i}>
                      <strong>{a.title}</strong>
                      <p>{a.detail}</p>
                      <small>Risk: {a.riskNote}</small>
                    </div>
                  ))}
                </>
              )}

              <div className="safety-notice"><ShieldCheck size={14}/> {analysis.safetyNotice}</div>
              <button className="text-button" onClick={runAnalysis}>Re-run analysis</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function Metric({ label, value, change, icon, tone }: { label: string; value: string; change: string; icon: ReactNode; tone: string }) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone}`}>{icon}</span></div><strong>{value}</strong><small>{change}</small></div>
}

export default App
