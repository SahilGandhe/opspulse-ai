import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { AlertCircle, ArrowUpRight, CheckCircle2, FileText, ShieldAlert } from 'lucide-react'
import { IncidentTable } from '../components/IncidentTable'
import { dayKey, formatDay, SEVERITIES, severityRank, STATUSES } from '../format'
import { navigate } from '../router'
import { useStore } from '../store'
import type { Incident } from '../types'

function Metric({ label, value, change, icon, tone }: { label: string; value: string; change: string; icon: ReactNode; tone: string }) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone}`}>{icon}</span></div><strong>{value}</strong><small>{change}</small></div>
}

function ActivityChart({ incidents }: { incidents: Incident[] }) {
  const days = useMemo(() => {
    const out: { key: string; label: string; count: number }[] = []
    const today = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
      out.push({ key: dayKey(d.toISOString()), label: formatDay(d.toISOString()), count: 0 })
    }
    for (const inc of incidents) {
      const k = dayKey(inc.createdAt)
      const slot = out.find(x => x.key === k)
      if (slot) slot.count += 1
    }
    return out
  }, [incidents])

  const max = Math.max(1, ...days.map(d => d.count))

  return (
    <div className="panel">
      <div className="panel-heading"><div><h3>Incident activity</h3><p>New incidents per day, last 14 days</p></div></div>
      <div className="activity-chart">
        {days.map((d, i) => (
          <div className="activity-col" key={d.key} title={`${d.label}: ${d.count} incident${d.count === 1 ? '' : 's'}`}>
            <div className="activity-bar-wrap">
              <div className="activity-bar" style={{ height: `${d.count === 0 ? 3 : Math.max(8, (d.count / max) * 100)}%` }} />
            </div>
            {(i % 3 === 1 || i === days.length - 1) && <small>{d.label}</small>}
          </div>
        ))}
      </div>
    </div>
  )
}

function Breakdown({ title, subtitle, items }: { title: string; subtitle: string; items: { label: string; count: number; className: string }[] }) {
  const max = Math.max(1, ...items.map(i => i.count))
  return (
    <div className="panel">
      <div className="panel-heading"><div><h3>{title}</h3><p>{subtitle}</p></div></div>
      <div className="breakdown">
        {items.map(item => (
          <div className="breakdown-row" key={item.label}>
            <span className="breakdown-label">{item.label}</span>
            <div className="breakdown-track"><div className={`breakdown-bar ${item.className}`} style={{ width: `${(item.count / max) * 100}%` }} /></div>
            <span className="breakdown-count">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Overview() {
  const { incidents, settings } = useStore()

  const active = incidents.filter(i => i.status !== 'Resolved')
  const attention = active.filter(i => severityRank(i.severity) >= severityRank(settings.alertMinSeverity))
  const resolved = incidents.filter(i => i.status === 'Resolved')
  const logTotal = incidents.reduce((n, i) => n + i.logCount, 0)
  const recent = useMemo(
    () => [...incidents].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [incidents],
  )

  return (
    <>
      <div className="page-heading">
        <div><div className="eyebrow"><span className="live-dot" /> INCIDENT INTELLIGENCE</div><h1>Operations overview</h1><p>Live view of synthetic demo incidents across your services.</p></div>
      </div>

      <div className="metrics">
        <Metric label="Active incidents" value={String(active.length)} change="Open or investigating" icon={<AlertCircle size={18} />} tone="orange" />
        <Metric label={`${settings.alertMinSeverity}+ severity`} value={String(attention.length)} change="Active, at or above alert threshold" icon={<ShieldAlert size={18} />} tone="red" />
        <Metric label="Resolved" value={String(resolved.length)} change="In this workspace" icon={<CheckCircle2 size={18} />} tone="green" />
        <Metric label="Log records" value={String(logTotal)} change="Attached as evidence" icon={<FileText size={18} />} tone="blue" />
      </div>

      <div className="overview-grid">
        <ActivityChart incidents={incidents} />
        <div className="overview-side">
          <Breakdown
            title="By severity"
            subtitle="All incidents in this workspace"
            items={[...SEVERITIES].reverse().map(s => ({
              label: s,
              count: incidents.filter(i => i.severity === s).length,
              className: s.toLowerCase(),
            }))}
          />
          <Breakdown
            title="By status"
            subtitle="Current workflow state"
            items={STATUSES.map(s => ({
              label: s,
              count: incidents.filter(i => i.status === s).length,
              className: s.toLowerCase(),
            }))}
          />
        </div>
        <div className="panel attention-panel">
          <div className="panel-heading"><div><h3>Needs attention</h3><p>Active incidents at or above your alert threshold ({settings.alertMinSeverity})</p></div></div>
          {attention.length === 0 && <p className="attention-empty">Nothing at or above the {settings.alertMinSeverity} threshold right now. Adjust the threshold in Settings.</p>}
          {attention.map(i => (
            <button className="attention-item" key={i.id} onClick={() => navigate(`/incidents/${i.id}`)}>
              <i className={`severity-dot ${i.severity.toLowerCase()}`} />
              <div><strong>{i.title}</strong><small>{i.serviceName} · {i.status} · opened {i.createdAt ? new Date(i.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</small></div>
              <ArrowUpRight size={14} />
            </button>
          ))}
        </div>
      </div>

      <div className="section-head">
        <div><h2>Recent incidents</h2><p>Select an incident to inspect logs and run analysis</p></div>
        <button className="text-button" onClick={() => navigate('/incidents')}>View all incidents <ArrowUpRight size={13} /></button>
      </div>
      <IncidentTable incidents={recent} />
    </>
  )
}
