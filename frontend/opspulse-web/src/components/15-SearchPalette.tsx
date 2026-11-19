import { useEffect, useMemo, useRef, useState } from 'react'
import { CircleDot, Search } from 'lucide-react'
import { initials, relTime } from '../format'
import { navigate } from '../router'
import { useStore } from '../store'

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { incidents } = useStore()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return incidents.slice(0, 6)
    return incidents
      .filter(i =>
        i.title.toLowerCase().includes(q)
        || i.serviceName.toLowerCase().includes(q)
        || i.description.toLowerCase().includes(q))
      .slice(0, 8)
  }, [incidents, query])

  useEffect(() => { setActiveIndex(0) }, [query])

  if (!open) return null

  const openIncident = (id: string) => {
    onClose()
    navigate(`/incidents/${id}`)
  }

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette" onClick={e => e.stopPropagation()} role="dialog" aria-label="Search incidents">
        <div className="palette-input">
          <Search size={16} />
          <input
            ref={inputRef}
            value={query}
            placeholder="Search incidents by title, service or description..."
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') onClose()
              if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)) }
              if (e.key === 'Enter' && results[activeIndex]) openIncident(results[activeIndex].id)
            }}
          />
          <kbd>ESC</kbd>
        </div>
        <div className="palette-results">
          {results.length === 0 && <p className="palette-empty">No incidents match "{query}".</p>}
          {results.map((incident, i) => (
            <button
              key={incident.id}
              className={`palette-item ${i === activeIndex ? 'active' : ''}`}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => openIncident(incident.id)}
            >
              <div className="service-avatar">{initials(incident.serviceName)}</div>
              <div className="palette-item-main">
                <strong>{incident.title}</strong>
                <small>{incident.serviceName} · opened {relTime(incident.createdAt)}</small>
              </div>
              <span className={`status-pill ${incident.status.toLowerCase()}`}><CircleDot size={11} />{incident.status}</span>
            </button>
          ))}
        </div>
        <div className="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span><span><kbd>Enter</kbd> to open</span></div>
      </div>
    </div>
  )
}
