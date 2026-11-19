import { FlaskConical, ShieldCheck } from 'lucide-react'
import type { IncidentAnalysisResult } from '../types'

export function AnalysisView({ analysis }: { analysis: IncidentAnalysisResult }) {
  return (
    <div className="analysis">
      <div className="analysis-banner"><FlaskConical size={14} /> SIMULATED ANALYSIS <span>{analysis.provider}</span></div>
      <p className="analysis-summary">{analysis.summary}</p>

      {analysis.hypotheses.map((h, i) => (
        <div className="hypothesis" key={i}>
          <div className="hyp-head"><strong>{i + 1}. {h.title}</strong><span className="confidence">{Math.round(h.confidenceScore * 100)}% {h.confidenceLabel}</span></div>
          <div className="confidence-bar"><div style={{ width: `${h.confidenceScore * 100}%` }} /></div>
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

      <div className="safety-notice"><ShieldCheck size={14} /> {analysis.safetyNotice}</div>
    </div>
  )
}
