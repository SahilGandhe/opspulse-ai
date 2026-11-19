import { useState } from 'react'
import { ArrowUpRight, ChevronDown, Trash2, Zap } from 'lucide-react'
import { AnalysisView } from '../components/AnalysisView'
import { formatDateTime, initials } from '../format'
import { navigate } from '../router'
import { useStore } from '../store'

export function Investigations() {
  const { investigations, clearInvestigations, incidents } = useStore()
  const [openId, setOpenId] = useState<string | null>(null)

  const clearAll = () => {
    if (window.confirm('Clear all investigation history stored in this browser?')) clearInvestigations()
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="live-dot" /> AI INVESTIGATIONS</div>
          <h1>Investigation history</h1>
          <p>Every simulated analysis you run is recorded here. History is stored in this browser only; the public demo API stays read-only.</p>
        </div>
        {investigations.length > 0 && (
          <button className="secondary-button danger" onClick={clearAll}><Trash2 size={14} /> Clear history</button>
        )}
      </div>

      {investigations.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon"><Zap size={22} /></div>
          <strong>No investigations yet.</strong>
          <p>Open an incident and run a simulated analysis. Each run, with its hypotheses and evidence, is saved here.</p>
          <button className="primary-button" onClick={() => navigate('/incidents')}>Browse incidents</button>
        </div>
      )}

      <div className="investigation-list">
        {investigations.map(rec => {
          const top = rec.result.hypotheses[0]
          const stillThere = incidents.some(i => i.id === rec.incidentId)
          const open = openId === rec.id
          return (
            <div className={`investigation-card ${open ? 'open' : ''}`} key={rec.id}>
              <button className="investigation-head" onClick={() => setOpenId(open ? null : rec.id)}>
                <div className="service-avatar">{initials(rec.serviceName)}</div>
                <div className="investigation-main">
                  <strong>{rec.incidentTitle}</strong>
                  <small>{rec.serviceName} · analyzed {formatDateTime(rec.runAt)}</small>
                </div>
                {top && (
                  <div className="investigation-top">
                    <span className="investigation-hyp">{top.title}</span>
                    <span className="confidence">{Math.round(top.confidenceScore * 100)}% {top.confidenceLabel}</span>
                  </div>
                )}
                <ChevronDown size={16} className={`chev ${open ? 'flip' : ''}`} />
              </button>
              {open && (
                <div className="investigation-body">
                  {stillThere
                    ? <button className="text-button" onClick={() => navigate(`/incidents/${rec.incidentId}`)}>Open incident <ArrowUpRight size={13} /></button>
                    : <p className="muted-note">This incident is not in the current demo data set.</p>}
                  <AnalysisView analysis={rec.result} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
