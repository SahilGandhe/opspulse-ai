import { useEffect, useState } from 'react'
import { CheckCircle2, RotateCcw, Save, Server, SlidersHorizontal, Building2 } from 'lucide-react'
import { formatDateTime } from '../format'
import { useStore } from '../store'
import type { Settings as SettingsShape } from '../store'

export function Settings() {
  const { mode, health, settings, updateSettings, resetSettings } = useStore()
  const [draft, setDraft] = useState<SettingsShape>(settings)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setDraft(settings) }, [settings])

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings)

  const save = () => {
    updateSettings(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
      <div className="page-heading">
        <div><div className="eyebrow"><span className="live-dot" /> WORKSPACE</div><h1>Settings</h1><p>Workspace and demo preferences. Saved in this browser.</p></div>
      </div>

      <div className="settings-grid">
        <div className="panel settings-panel">
          <div className="panel-heading"><div><h3><Building2 size={14} /> Workspace</h3><p>Names shown across the app</p></div></div>
          <label className="field">
            <span>Workspace name</span>
            <input
              value={draft.workspaceName}
              maxLength={40}
              onChange={e => setDraft(d => ({ ...d, workspaceName: e.target.value }))}
              placeholder="e.g. Acme Engineering"
            />
          </label>

          <div className="panel-heading sub"><div><h3><SlidersHorizontal size={14} /> Preferences</h3><p>Applied immediately after saving</p></div></div>

          <label className="field">
            <span>Default landing page</span>
            <select value={draft.landing} onChange={e => setDraft(d => ({ ...d, landing: e.target.value as SettingsShape['landing'] }))}>
              <option value="overview">Overview</option>
              <option value="incidents">Incidents</option>
            </select>
          </label>

          <label className="field">
            <span>Table density</span>
            <select value={draft.density} onChange={e => setDraft(d => ({ ...d, density: e.target.value as SettingsShape['density'] }))}>
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </label>

          <label className="field">
            <span>Alert threshold on Overview</span>
            <select value={draft.alertMinSeverity} onChange={e => setDraft(d => ({ ...d, alertMinSeverity: e.target.value as SettingsShape['alertMinSeverity'] }))}>
              <option value="Medium">Medium and above</option>
              <option value="High">High and above</option>
              <option value="Critical">Critical only</option>
            </select>
          </label>

          <label className="field toggle-field">
            <span>
              Auto-run analysis
              <small>Start the simulated analysis as soon as an incident is opened</small>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={draft.autoAnalyze}
              className={`toggle ${draft.autoAnalyze ? 'on' : ''}`}
              onClick={() => setDraft(d => ({ ...d, autoAnalyze: !d.autoAnalyze }))}
            ><span /></button>
          </label>

          <div className="settings-actions">
            <button className="primary-button" onClick={save} disabled={!dirty}><Save size={14} /> Save changes</button>
            <button className="secondary-button" onClick={() => { resetSettings(); setSaved(false) }}><RotateCcw size={14} /> Reset to defaults</button>
            {saved && <span className="saved-flash"><CheckCircle2 size={14} /> Saved</span>}
          </div>
        </div>

        <div className="panel settings-panel">
          <div className="panel-heading"><div><h3><Server size={14} /> Environment</h3><p>Live status of this deployment</p></div></div>
          <dl className="env-list">
            <div><dt>Connection</dt><dd>{mode === 'api' ? 'Live RootBeacon API' : mode === 'loading' ? 'Checking...' : 'Browser-only demo (API unreachable)'}</dd></div>
            <div><dt>Database</dt><dd>{mode === 'api' ? health?.database ?? 'unknown' : 'In-browser synthetic data'}</dd></div>
            <div><dt>Analysis engine</dt><dd>Simulated deterministic analyzer (no external AI model)</dd></div>
            <div><dt>Write access</dt><dd>Read-only public demo; new incidents and log ingestion are blocked</dd></div>
            {mode === 'api' && health?.timestampUtc && <div><dt>API time</dt><dd>{formatDateTime(health.timestampUtc)}</dd></div>}
          </dl>
          <p className="muted-note">Production features not in this demo: authentication, customer accounts, real log ingestion, retention controls and the real AI provider. See docs/ARCHITECTURE.md in the repository.</p>
        </div>
      </div>
    </>
  )
}
