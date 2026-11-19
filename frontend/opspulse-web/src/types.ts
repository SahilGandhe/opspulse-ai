export interface Incident {
  id: string
  title: string
  description: string
  serviceName: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  status: 'Open' | 'Investigating' | 'Resolved'
  createdAt: string
  updatedAt: string
  logCount: number
  logs?: IncidentLog[] | null
}

export interface IncidentLog {
  id: string
  message: string
  level: string
  occurredAt: string | null
  createdAt: string
}

export interface EvidenceItem {
  logId: string
  occurredAtUtc: string | null
  level: string
  excerpt: string
}

export interface AnalysisHypothesis {
  title: string
  confidenceScore: number
  confidenceLabel: string
  rationale: string
  evidence: EvidenceItem[]
}

export interface SuggestedAction {
  title: string
  detail: string
  riskNote: string
}

export interface IncidentAnalysisResult {
  status: string
  mode: string
  provider: string
  summary: string
  hypotheses: AnalysisHypothesis[]
  suggestedActions: SuggestedAction[]
  safetyNotice: string
  message: string
}
