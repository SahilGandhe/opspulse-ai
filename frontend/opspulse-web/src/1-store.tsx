import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from './api'
import { analyzeLocally, DEMO_INCIDENTS } from './demo/engine'
import type { Incident, IncidentAnalysisResult } from './types'

export type DataMode = 'loading' | 'api' | 'browser-demo'

export interface Settings {
  workspaceName: string
  landing: 'overview' | 'incidents'
  density: 'comfortable' | 'compact'
  autoAnalyze: boolean
  alertMinSeverity: 'Medium' | 'High' | 'Critical'
}

export const DEFAULT_SETTINGS: Settings = {
  workspaceName: 'Acme Engineering',
  landing: 'overview',
  density: 'comfortable',
  autoAnalyze: false,
  alertMinSeverity: 'High',
}

export interface InvestigationRecord {
  id: string
  incidentId: string
  incidentTitle: string
  serviceName: string
  runAt: string
  result: IncidentAnalysisResult
}

export interface HealthInfo {
  status?: string
  service?: string
  database?: string
  timestampUtc?: string
}

interface Store {
  mode: DataMode
  incidents: Incident[]
  health: HealthInfo | null
  settings: Settings
  updateSettings: (patch: Partial<Settings>) => void
  resetSettings: () => void
  investigations: InvestigationRecord[]
  clearInvestigations: () => void
  loadIncident: (id: string) => Promise<Incident | null>
  runAnalysis: (incident: Incident) => Promise<IncidentAnalysisResult>
  useBrowserDemo: () => void
}

// The hosted demo rides a free host that sleeps when idle, so the first
// API call can take up to a minute while the server wakes. Keep retrying
// for a while before falling back to the in-browser demo.
const CONNECT_TIMEOUT_MS = 45_000
const CONNECT_RETRY_MS = 3_000

const SETTINGS_KEY = 'rootbeacon.settings.v1'
const INVESTIGATIONS_KEY = 'rootbeacon.investigations.v1'
const MAX_INVESTIGATIONS = 50

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return { ...fallback, ...(JSON.parse(raw) as T) }
  } catch {
    return fallback
  }
}

function readList<T>(key: string): T[] {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch { /* storage unavailable; preferences simply do not persist */ }
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `inv-${Date.now()}-${Math.round(Math.random() * 1e6)}`
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DataMode>('loading')
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [health, setHealth] = useState<HealthInfo | null>(null)
  const [settings, setSettings] = useState<Settings>(() => readJson(SETTINGS_KEY, DEFAULT_SETTINGS))
  const [investigations, setInvestigations] = useState<InvestigationRecord[]>(() => readList(INVESTIGATIONS_KEY))

  const connectCancelled = useRef(false)

  useEffect(() => {
    connectCancelled.current = false
    const started = Date.now()
    const attempt = async () => {
      try {
        const h = await api.health()
        const list = await api.listIncidents()
        if (!connectCancelled.current) { setHealth(h); setIncidents(list); setMode('api') }
      } catch {
        if (connectCancelled.current) return
        if (Date.now() - started < CONNECT_TIMEOUT_MS) {
          setTimeout(() => { void attempt() }, CONNECT_RETRY_MS)
        } else {
          setIncidents(DEMO_INCIDENTS)
          setMode('browser-demo')
        }
      }
    }
    void attempt()
    return () => { connectCancelled.current = true }
  }, [])

  const useBrowserDemo = useCallback(() => {
    connectCancelled.current = true
    setIncidents(DEMO_INCIDENTS)
    setMode('browser-demo')
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      writeJson(SETTINGS_KEY, next)
      return next
    })
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    writeJson(SETTINGS_KEY, DEFAULT_SETTINGS)
  }, [])

  const clearInvestigations = useCallback(() => {
    setInvestigations([])
    writeJson(INVESTIGATIONS_KEY, [])
  }, [])

  const loadIncident = useCallback(async (id: string): Promise<Incident | null> => {
    if (mode === 'api') {
      try {
        const full = await api.getIncident(id)
        setIncidents(list => list.map(i => (i.id === id ? full : i)))
        return full
      } catch {
        return null
      }
    }
    return incidents.find(i => i.id === id) ?? null
  }, [mode, incidents])

  const runAnalysis = useCallback(async (incident: Incident): Promise<IncidentAnalysisResult> => {
    const result = mode === 'api' ? await api.analyze(incident.id) : await analyzeLocally(incident)
    const record: InvestigationRecord = {
      id: newId(),
      incidentId: incident.id,
      incidentTitle: incident.title,
      serviceName: incident.serviceName,
      runAt: new Date().toISOString(),
      result,
    }
    setInvestigations(prev => {
      const next = [record, ...prev].slice(0, MAX_INVESTIGATIONS)
      writeJson(INVESTIGATIONS_KEY, next)
      return next
    })
    return result
  }, [mode])

  const value = useMemo<Store>(() => ({
    mode, incidents, health, settings, updateSettings, resetSettings,
    investigations, clearInvestigations, loadIncident, runAnalysis, useBrowserDemo,
  }), [mode, incidents, health, settings, updateSettings, resetSettings,
    investigations, clearInvestigations, loadIncident, runAnalysis, useBrowserDemo])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
