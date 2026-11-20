import {
  Activity, AlertCircle, ArrowRight, ArrowUpRight, CheckCircle2, CircleDot, Clock3, FileSearch, FlaskConical,
  GitBranch, History, Lock, Radar, Settings as SettingsIcon, ShieldCheck, Workflow, XCircle, Zap,
} from 'lucide-react'
import { navigate } from '../router'
import { useStore } from '../store'

function scrollToId(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const PROBLEMS = [
  {
    icon: Clock3,
    title: 'Root-cause hunts burn hours',
    text: 'An engineer digs through thousands of log lines across services, under pressure, while customers wait. Most of that time is pattern matching a machine could draft.',
  },
  {
    icon: FileSearch,
    title: 'Signals are scattered',
    text: 'Errors, warnings and context live in different places. Without one incident record that holds the logs together, every investigation starts from zero.',
  },
  {
    icon: XCircle,
    title: 'AI answers without evidence',
    text: 'Generic AI summaries guess confidently and cite nothing. In an incident, an unverifiable answer is worse than no answer.',
  },
]

const STEPS = [
  {
    title: 'Capture the incident',
    text: 'Each incident keeps its logs together as one immutable record, exactly as ingested, so evidence cannot be quietly edited later.',
  },
  {
    title: 'Analyze the logs',
    text: 'The analyzer matches failure patterns across the log set and ranks likely root causes with explicit confidence, not vibes.',
  },
  {
    title: 'Link every claim to evidence',
    text: 'Each hypothesis cites the exact log lines behind it, with emails, IPs, keys and passwords redacted at the analysis boundary.',
  },
  {
    title: 'Keep humans in control',
    text: 'RootBeacon suggests fixes with risk notes. It never executes them. A human operator decides and acts.',
  },
]

const FEATURES = [
  {
    icon: Lock,
    title: 'Immutable log records',
    text: 'Raw logs are stored as ingested and cannot be rewritten, so investigations stand on evidence that holds up.',
  },
  {
    icon: ShieldCheck,
    title: 'Redaction at the boundary',
    text: 'Secrets and personal data are stripped before analysis output is produced. Evidence stays useful without leaking.',
  },
  {
    icon: GitBranch,
    title: 'Evidence-linked hypotheses',
    text: 'Every root-cause hypothesis carries a confidence score and the exact log lines that support it.',
  },
  {
    icon: Workflow,
    title: 'Human-approved actions',
    text: 'Suggested fixes come with risk notes for an operator to review. Automation recommends, people decide.',
  },
  {
    icon: History,
    title: 'Investigation history',
    text: 'Every analysis run is preserved so teams can revisit what was concluded and why.',
  },
  {
    icon: Radar,
    title: 'Severity and status tracking',
    text: 'A live dashboard keeps active incidents, thresholds and trends visible at a glance.',
  },
]

const APP_SCREENS = [
  {
    icon: Activity,
    title: 'Overview',
    short: 'Overview',
    path: '/overview',
    text: 'The live operations dashboard: active incidents, severity and status breakdowns, 14-day activity and the needs-attention list.',
  },
  {
    icon: AlertCircle,
    title: 'Incidents',
    short: 'Incidents',
    path: '/incidents',
    text: 'Search, filter and sort the seeded incidents, then open one to read its raw logs and run the simulated analysis.',
  },
  {
    icon: Zap,
    title: 'AI Investigations',
    short: 'Investigations',
    path: '/investigations',
    text: 'Every analysis run is saved here with its hypotheses, confidence scores and redacted evidence excerpts.',
  },
  {
    icon: SettingsIcon,
    title: 'Settings',
    short: 'Settings',
    path: '/settings',
    text: 'Workspace name, demo home screen, table density and alert threshold, persisted in your browser.',
  },
]

export function Landing() {
  const { settings, mode } = useStore()
  const demoPath = settings.landing === 'incidents' ? '/incidents' : '/overview'
  const openDemo = () => navigate(demoPath)

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="brand"><div className="brand-mark"><Radar size={18} /></div><span>RootBeacon</span></div>
          <nav className="landing-links">
            <button type="button" onClick={() => scrollToId('app')}>The app</button>
            <button type="button" onClick={() => scrollToId('problem')}>Problem</button>
            <button type="button" onClick={() => scrollToId('how')}>How it works</button>
            <button type="button" onClick={() => scrollToId('features')}>Features</button>
            <button type="button" onClick={() => scrollToId('honesty')}>Demo scope</button>
          </nav>
          <button className="primary-button landing-cta" type="button" onClick={openDemo}>
            Open the live demo <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-dot" /> AI-POWERED INCIDENT INTELLIGENCE</div>
          <h1>Find the cause.<br />Plan the fix.</h1>
          <p className="hero-sub">
            RootBeacon turns raw production logs into evidence-linked root-cause hypotheses and
            human-approved fix plans, so engineering teams resolve incidents with confidence instead of guesswork.
          </p>
          <div className="hero-actions">
            <button className="primary-button big" type="button" onClick={openDemo}>
              Launch the live demo <ArrowRight size={15} />
            </button>
            <button className="secondary-button big" type="button" onClick={() => scrollToId('how')}>
              See how it works
            </button>
          </div>
          <p className="hero-note">
            Read-only demo · synthetic incidents · analysis is simulated and labelled · no signup needed
            {mode === 'loading' && ' · the free demo server may take up to a minute to wake'}
          </p>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="demo-card">
            <span className="demo-card-tag">ILLUSTRATIVE PREVIEW</span>
            <div className="demo-card-head">
              <span className="severity-dot critical" />
              <strong>Payment API returning HTTP 500</strong>
              <span className="status-pill investigating"><CircleDot size={10} />Investigating</span>
            </div>
            <div className="demo-card-label">ROOT-CAUSE HYPOTHESIS, SIMULATED</div>
            <div className="demo-card-hyp">
              <div className="hyp-head"><strong>Unhandled application exception (HTTP 500)</strong><span className="confidence">95% high (heuristic)</span></div>
              <div className="confidence-bar"><div style={{ width: '95%' }} /></div>
            </div>
            <div className="demo-card-label">EVIDENCE (REDACTED)</div>
            <div className="demo-card-ev"><span className="log-level error">ERROR</span><code>Unhandled exception while processing POST /payments for customer cust_88412</code></div>
            <div className="demo-card-ev"><span className="log-level error">ERROR</span><code>HTTP 500 returned to caller, api_key=[redacted-secret]</code></div>
            <div className="demo-card-foot"><ShieldCheck size={12} /> Fix suggested, executed by a human operator</div>
          </div>
        </div>
      </section>

      <section className="landing-strip">
        <div><strong>8</strong><span>synthetic demo incidents</span></div>
        <div><strong>48</strong><span>attached log records</span></div>
        <div><strong>Every</strong><span>hypothesis linked to log evidence</span></div>
        <div><strong>Human-led</strong><span>fixes suggested, never executed</span></div>
      </section>

      <section className="landing-section" id="app">
        <div className="section-heading">
          <div className="eyebrow"><span className="live-dot" /> INSIDE THE DEMO APP</div>
          <h2>Four screens, all live right now</h2>
          <p>Each screen below opens straight into the live interactive demo, which runs on synthetic data with a simulated analysis engine.</p>
        </div>
        <div className="card-grid two">
          {APP_SCREENS.map(s => (
            <button className="landing-card app-screen" key={s.title} type="button" onClick={() => navigate(s.path)}>
              <div className="landing-card-icon"><s.icon size={19} /></div>
              <strong>{s.title}</strong>
              <p>{s.text}</p>
              <span className="app-screen-link">Open {s.short} <ArrowRight size={13} /></span>
            </button>
          ))}
        </div>
      </section>

      <section className="landing-section" id="problem">
        <div className="section-heading">
          <div className="eyebrow"><span className="live-dot" /> THE PROBLEM</div>
          <h2>Incident response is slow, scattered and hard to trust</h2>
          <p>Every engineering team knows the 2 AM page. The painful part is not the alert; it is the hunt that follows.</p>
        </div>
        <div className="card-grid three">
          {PROBLEMS.map(p => (
            <div className="landing-card" key={p.title}>
              <div className="landing-card-icon"><p.icon size={19} /></div>
              <strong>{p.title}</strong>
              <p>{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section alt" id="how">
        <div className="section-heading">
          <div className="eyebrow"><span className="live-dot" /> HOW IT WORKS</div>
          <h2>From raw logs to a fix plan in four steps</h2>
          <p>Built so every conclusion can be checked. If a claim has no evidence behind it, it does not ship.</p>
        </div>
        <ol className="steps-grid">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="step-num">{i + 1}</span>
              <strong>{s.title}</strong>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-section" id="features">
        <div className="section-heading">
          <div className="eyebrow"><span className="live-dot" /> WHAT YOU GET</div>
          <h2>Designed for trust, not just speed</h2>
          <p>Principles from the product architecture, visible in the working demo.</p>
        </div>
        <div className="card-grid three">
          {FEATURES.map(f => (
            <div className="landing-card" key={f.title}>
              <div className="landing-card-icon"><f.icon size={19} /></div>
              <strong>{f.title}</strong>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section alt" id="honesty">
        <div className="section-heading">
          <div className="eyebrow"><span className="live-dot" /> DEMO SCOPE, STATED PLAINLY</div>
          <h2>What this demo is, and what it is not</h2>
          <p>RootBeacon is an early product. The demo proves the workflow; the items on the right are the production work still ahead.</p>
        </div>
        <div className="honesty-grid">
          <div className="honesty-col in">
            <h3><CheckCircle2 size={15} /> Working in the demo today</h3>
            <ul>
              <li>Operations dashboard, incident browser and detail views over a seeded SQLite database</li>
              <li>Deterministic, simulated analyzer: pattern-matched hypotheses with confidence and redacted evidence</li>
              <li>Suggested actions with risk notes, saved investigation history in your browser</li>
              <li>Read-only public deployment: the API rejects writes, so no visitor data is ingested or stored</li>
            </ul>
          </div>
          <div className="honesty-col out">
            <h3><FlaskConical size={15} /> Planned, not in this demo</h3>
            <ul>
              <li>Real AI provider (Gemini adapter) in place of the simulated analyzer</li>
              <li>Authentication, customer workspaces and tenant isolation</li>
              <li>Real log ingestion, retention controls and audit logging</li>
              <li>PostgreSQL migrations, automated tests and production hardening</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="landing-final">
        <h2>Investigate an incident end to end</h2>
        <p>Open the demo, pick a critical incident, run the simulated analysis and read the evidence yourself.</p>
        <button className="primary-button big" type="button" onClick={openDemo}>
          Launch the live demo <ArrowUpRight size={15} />
        </button>
        <small>First visit can take up to a minute while the free demo server wakes. You can skip the wait and explore the in-browser demo instead.</small>
      </section>

      <footer className="landing-footer">
        <div className="brand"><div className="brand-mark"><Radar size={16} /></div><span>RootBeacon</span></div>
        <p>Demo build · synthetic data only · analysis simulated, no external AI called</p>
      </footer>

      <button className="landing-mobile-cta" type="button" onClick={openDemo}>
        Open the live demo <ArrowRight size={15} />
      </button>
    </div>
  )
}
