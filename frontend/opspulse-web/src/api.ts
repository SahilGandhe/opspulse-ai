import type { Incident, IncidentAnalysisResult } from './types'

// Same origin by default (the API serves the built frontend in the hosted
// demo). Set VITE_API_BASE_URL to point at a separate API in local dev.
const API_BASE: string = import.meta.env.VITE_API_BASE_URL || ''

async function request<T>(path: string, init?: RequestInit, timeoutMs = 5000): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...init, signal: controller.signal })
    if (!res.ok) throw new Error(`API ${res.status}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

export const api = {
  base: API_BASE,
  health: () => request<{ status: string }>('/api/health', undefined, 3000),
  listIncidents: () => request<Incident[]>('/api/incidents'),
  getIncident: (id: string) => request<Incident>(`/api/incidents/${id}`),
  analyze: (id: string) =>
    request<IncidentAnalysisResult>(`/api/incidents/${id}/analyze`, { method: 'POST' }, 15000),
}
