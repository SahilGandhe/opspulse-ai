import { ArrowUpRight, CircleDot } from 'lucide-react'
import { initials, relTime } from '../format'
import { navigate } from '../router'
import type { Incident } from '../types'

export function IncidentTable({ incidents }: { incidents: Incident[] }) {
  return (
    <div className="table-wrap">
      <div className="table-head"><span>INCIDENT</span><span>SERVICE</span><span>SEVERITY</span><span>STATUS</span><span>CREATED</span><span /></div>
      {incidents.map((incident) => (
        <div className="table-row clickable" key={incident.id} onClick={() => navigate(`/incidents/${incident.id}`)}>
          <div className="incident-cell"><div className="service-avatar">{initials(incident.serviceName)}</div><div><strong>{incident.title}</strong><small>{incident.logCount} log records</small></div></div>
          <span className="service-name">{incident.serviceName}</span>
          <span><i className={`severity-dot ${incident.severity.toLowerCase()}`} /><span className={`severity ${incident.severity.toLowerCase()}`}>{incident.severity}</span></span>
          <span className={`status-pill ${incident.status.toLowerCase()}`}><CircleDot size={11} />{incident.status}</span>
          <span className="age">{relTime(incident.createdAt)}</span>
          <button className="row-more" aria-label={`Open ${incident.title}`}><ArrowUpRight size={15} /></button>
        </div>
      ))}
    </div>
  )
}
