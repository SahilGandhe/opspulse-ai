import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, CircleDot, FileText, Zap } from 'lucide-react'
import { AnalysisView } from '../components/AnalysisView'
import { initials, relTime } from '../format'
import { navigate } from '../router'
import { useStore } from '../store'
import type { IncidentAnalysisResult } from '../types'

const LOG_LEVELS = ['ERROR', 'WARN', 'INFO'] as const

export function IncidentDetail({ id }: { id: string }) {
  const { incidents, loadIncident, runAnalysis, settings } = useStore()
  const [analysis, setAnalysis] = useState<IncidentAnalysisResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [levelFilter, setLevelFilter] = useState<Set<string>>(new Set())
  const autoRan = useRef(false)

  const incident = incidents.find(i => i.id === id) ?? null

  useEffect(() => {
    autoRan.current = false
    setAnalysis(null)
    setError(null)
    setLevelFilter(new Set())
  }, [id])

  // The list payload carries logs: null, so a deep link or refresh on this
  // page must fetch the full incident once the list has loaded.
  useEffect(() => {
    if (incident && !incident.logs) {
      loadIncident(id).then(full => { if (!full) setError('Could not load the full incident from the API.') })
    }
  }, [id, incident]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (settings.autoAnalyze && incident?.logs && !autoRan.current && !analysis && !running) {
      autoRan.current = true
      void doRun()
    }
  }) // intentionally runs after every render; guarded by autoRan/ref and state

  const doRun = async () => {
    if (!incident) return
    setRunning(true)
    setError(null)
    try {
      const result = await runAnalysis(incident)
      setAnalysis(result)
    } catch {
      setError('Analysis failed. Check that the API is running and try again.')
    } finally {
      setRunning(false)
    }
  }

  const logs = useMemo(() => {
    const all = incident?.logs ?? []
    if (levelFilter.size === 0) return all
    return all.filter(l => levelFilter.has(l.level.toUpperCase()))
  }, [incident, levelFilter])

  if (!incident) {
    return (
      <div className="empty-state">
        <strong>Incident not found.</strong>
        <p>It may have been removed, or the link is wrong.</p>
        <button className="primary-button" onClick={() => navigate('/incidents')}>Back to incidents</button>
      </div>
    )
  }

  const toggleLevel = (level: string) => {
    setLevelFilter(prev => {
      const next = new Set(prev)
      if (next.has(level)) next.delete(level)
      else next.add(level)
      return next
    })
  }

  const totalLogs = incident.logs?.length ?? incident.logCount

  return (
    <>
      <button className="text-button back-button" onClick={() => navigate('/incidents')}><ArrowLeft size={15} /> Back to incidents</button>

      <div className="detail-head">
        <div className="incident-cell"><div className="service-avatar large">{initials(incident.serviceName)}</div>
          <div>
            <h1>{incident.title}</h1>
            <div className="detail-meta">
              <span className="service-name">{incident.serviceName}</span>
              <span><i className={`severity-dot ${incident.severity.toLowerCase()}`} /><span className={`severity ${incident.severity.toLowerCase()}`}>{incident.severity}</span></span>
              <span className={`status-pill ${incident.status.toLowerCase()}`}><CircleDot size={11} />{incident.status}</span>
              <span className="age">opened {relTime(incident.createdAt)}</span>
            </div>
          </div>
        </div>
        <p className="detail-desc">{incident.description}</p>
      </div>

      <div className="detail-grid">
        <div className="panel">
          <div className="panel-heading">
            <div><h3>Attached logs</h3><p>{levelFilter.size > 0 ? `${logs.length} of ${totalLogs}` : totalLogs} records, immutable after ingestion</p></div>
            <span className="panel-icon"><FileText size={17} /></span>
          </div>
          <div className="chip-group log-filter">
            {LOG_LEVELS.map(l => (
              <button key={l} className={`chip ${levelFilter.has(l) ? 'on' : ''}`} onClick={() => toggleLevel(l)}>{l}</button>
            ))}
          </div>
          <p className="log-boundary-note">Raw logs are stored as ingested (immutable). Redaction happens at the analysis boundary: AI/evidence output never contains emails, IPs, keys or passwords. Retention and deletion controls are a production gap.</p>
          <div className="log-list">
            {!incident.logs && <p className="log-empty">Loading logs...</p>}
            {incident.logs && logs.length === 0 && <p className="log-empty">No log records match this filter.</p>}
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
          <div className="panel-heading"><div><h3>AI investigation</h3><p>Evidence-linked hypotheses and suggested fixes</p></div><span className="panel-icon purple"><Zap size={17} /></span></div>

          {!analysis && !running && (
            <div className="analyze-cta">
              <p>Run the analysis engine over this incident's logs. In this demo it is a <strong>simulated, deterministic analyzer</strong>, not a live AI model. It never executes fixes; it suggests them for a human operator.</p>
              <button className="primary-button" onClick={doRun}><Zap size={15} /> Run simulated analysis</button>
            </div>
          )}
          {running && <div className="analyze-cta"><p className="analyzing">Analyzing {totalLogs} log records...</p></div>}
          {error && <div className="analyze-cta"><p className="error-text">{error}</p><button className="text-button" onClick={doRun}>Try again</button></div>}

          {analysis && (
            <>
              <AnalysisView analysis={analysis} />
              <div className="analysis-foot">
                <span className="saved-note">Saved to AI Investigations (this browser)</span>
                <button className="text-button" onClick={doRun}>Re-run analysis</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
