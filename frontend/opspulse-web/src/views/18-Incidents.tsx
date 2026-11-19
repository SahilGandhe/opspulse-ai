import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { IncidentTable } from '../components/IncidentTable'
import { SEVERITIES, severityRank, STATUSES } from '../format'
import { useStore } from '../store'

type SortKey = 'newest' | 'oldest' | 'severity'

export function Incidents() {
  const { incidents } = useStore()
  const [query, setQuery] = useState('')
  const [sevFilter, setSevFilter] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<SortKey>('newest')

  const toggle = (set: Set<string>, value: string, apply: (next: Set<string>) => void) => {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    apply(next)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = incidents.filter(i =>
      (sevFilter.size === 0 || sevFilter.has(i.severity))
      && (statusFilter.size === 0 || statusFilter.has(i.status))
      && (!q || i.title.toLowerCase().includes(q) || i.serviceName.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)))
    list = [...list].sort((a, b) => {
      if (sort === 'oldest') return a.createdAt.localeCompare(b.createdAt)
      if (sort === 'severity') return severityRank(b.severity) - severityRank(a.severity) || b.createdAt.localeCompare(a.createdAt)
      return b.createdAt.localeCompare(a.createdAt)
    })
    return list
  }, [incidents, query, sevFilter, statusFilter, sort])

  const hasFilters = query.trim() !== '' || sevFilter.size > 0 || statusFilter.size > 0
  const clearFilters = () => { setQuery(''); setSevFilter(new Set()); setStatusFilter(new Set()) }

  return (
    <>
      <div className="page-heading">
        <div><div className="eyebrow"><span className="live-dot" /> WORKSPACE</div><h1>Incidents</h1><p>{incidents.length} synthetic incidents in this demo workspace.</p></div>
      </div>

      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={15} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Filter by title, service or description..." />
          {query && <button className="icon-button" aria-label="Clear search" onClick={() => setQuery('')}><X size={14} /></button>}
        </div>
        <div className="chip-group" role="group" aria-label="Severity filter">
          {SEVERITIES.map(s => (
            <button key={s} className={`chip ${sevFilter.has(s) ? 'on' : ''} ${s.toLowerCase()}`} onClick={() => toggle(sevFilter, s, setSevFilter)}>{s}</button>
          ))}
        </div>
        <div className="chip-group" role="group" aria-label="Status filter">
          {STATUSES.map(s => (
            <button key={s} className={`chip ${statusFilter.has(s) ? 'on' : ''}`} onClick={() => toggle(statusFilter, s, setStatusFilter)}>{s}</button>
          ))}
        </div>
        <select className="sort-select" value={sort} onChange={e => setSort(e.target.value as SortKey)} aria-label="Sort incidents">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="severity">Highest severity</option>
        </select>
      </div>

      <p className="result-count">Showing {filtered.length} of {incidents.length} incidents{hasFilters && <button className="text-button inline" onClick={clearFilters}>Clear filters</button>}</p>

      {filtered.length === 0
        ? <div className="empty-state"><strong>No incidents match these filters.</strong><p>Try a different search or clear the filters.</p><button className="primary-button" onClick={clearFilters}>Clear filters</button></div>
        : <IncidentTable incidents={filtered} />}
    </>
  )
}
