import type { ReactNode } from 'react'
import { Activity, AlertCircle, ArrowUpRight, Bell, CheckCircle2, ChevronDown, CircleDot, Clock3, Search, ShieldAlert, Zap } from 'lucide-react'

const incidents = [
  { id: 'INC-2048', title: 'Payment API returning HTTP 500', service: 'payment-service', severity: 'Critical', status: 'Investigating', age: '4 min ago', initials: 'PA' },
  { id: 'INC-2047', title: 'Database connection pool saturation', service: 'orders-api', severity: 'High', status: 'Open', age: '18 min ago', initials: 'DB' },
  { id: 'INC-2046', title: 'Elevated authentication latency', service: 'identity-service', severity: 'Medium', status: 'Open', age: '42 min ago', initials: 'AU' },
  { id: 'INC-2045', title: 'Background worker retry threshold exceeded', service: 'notification-worker', severity: 'Low', status: 'Resolved', age: '2 hr ago', initials: 'WK' },
]

function App() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Activity size={19} /></div><span>OpsPulse<span className="brand-ai"> AI</span></span></div>
        <div className="workspace"><div className="workspace-avatar">A</div><div><strong>Acme Engineering</strong><small>Workspace</small></div><ChevronDown size={15} /></div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          <a className="nav-item active"><Activity size={17}/> Overview</a>
          <a className="nav-item"><AlertCircle size={17}/> Incidents <span className="nav-count">4</span></a>
          <a className="nav-item"><Zap size={17}/> AI Investigations</a>
          <a className="nav-item"><Clock3 size={17}/> Incident history</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="status-card"><span className="status-dot"/><div><strong>Systems operational</strong><small>Demo workspace</small></div></div>
          <div className="profile"><div className="profile-avatar">SG</div><div><strong>Workspace Admin</strong><small>Local preview</small></div><ChevronDown size={15}/></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumbs">Workspace <span>/</span> <strong>Overview</strong></div>
          <div className="top-actions"><div className="search"><Search size={15}/><span>Search incidents...</span><kbd>⌘ K</kbd></div><button className="icon-button" aria-label="Notifications"><Bell size={18}/></button><div className="top-avatar">SG</div></div>
        </header>

        <section className="content">
          <div className="page-heading">
            <div><div className="eyebrow"><span className="live-dot"/> INCIDENT INTELLIGENCE</div><h1>Good morning, team</h1><p>Here's what's happening across your services today.</p></div>
            <button className="primary-button"><span>＋</span> New incident</button>
          </div>

          <div className="notice"><div className="notice-icon"><ShieldAlert size={18}/></div><div><strong>Preview environment</strong><p>This dashboard currently displays illustrative sample data. Connect the API to load live incidents.</p></div><span className="notice-tag">DEMO DATA</span></div>

          <div className="metrics">
            <Metric label="Active incidents" value="12" change="3 require attention" icon={<AlertCircle size={18}/>} tone="orange"/>
            <Metric label="Critical incidents" value="2" change="Across 2 services" icon={<ShieldAlert size={18}/>} tone="red"/>
            <Metric label="Resolved today" value="18" change="↑ 12% vs yesterday" icon={<CheckCircle2 size={18}/>} tone="green"/>
            <Metric label="Avg. response time" value="8.4m" change="↓ 2.1m this week" icon={<Clock3 size={18}/>} tone="blue"/>
          </div>

          <div className="section-head"><div><h2>Recent incidents</h2><p>Latest events requiring engineering attention</p></div><button className="text-button">View all incidents <ArrowUpRight size={15}/></button></div>
          <div className="table-wrap">
            <div className="table-head"><span>INCIDENT</span><span>SERVICE</span><span>SEVERITY</span><span>STATUS</span><span>CREATED</span><span/></div>
            {incidents.map((incident) => <div className="table-row" key={incident.id}>
              <div className="incident-cell"><div className="service-avatar">{incident.initials}</div><div><strong>{incident.title}</strong><small>{incident.id}</small></div></div>
              <span className="service-name">{incident.service}</span>
              <span><i className={`severity-dot ${incident.severity.toLowerCase()}`}/><span className={`severity ${incident.severity.toLowerCase()}`}>{incident.severity}</span></span>
              <span className={`status-pill ${incident.status.toLowerCase()}`}><CircleDot size={11}/>{incident.status}</span>
              <span className="age">{incident.age}</span>
              <button className="row-more" aria-label={`Open ${incident.id}`}>···</button>
            </div>)}
          </div>
          <div className="bottom-grid">
            <div className="panel"><div className="panel-heading"><div><h3>AI investigation activity</h3><p>Investigation runs over the last 7 days</p></div><span className="panel-icon"><Zap size={17}/></span></div><div className="chart"><div className="chart-y"><span>40</span><span>30</span><span>20</span><span>10</span><span>0</span></div><div className="chart-area"><div className="grid-lines"><i/><i/><i/><i/><i/></div><div className="bars">{[35,54,43,72,58,86,67].map((v,i)=><div className="bar-group" key={i}><div className="bar" style={{height:`${v}%`}}/><small>{['M','T','W','T','F','S','S'][i]}</small></div>)}</div></div></div></div>
            <div className="panel insight"><div className="panel-heading"><div><h3>OpsPulse insight</h3><p>Illustrative AI insight</p></div><span className="panel-icon purple"><Zap size={17}/></span></div><div className="insight-body"><div className="insight-label">PATTERN DETECTED</div><h4>Database connectivity is a recurring risk</h4><p>Sample insight: multiple recent incidents involve connection timeouts. Connect real incident history before treating this as an operational finding.</p><button className="text-button">Explore incident patterns <ArrowUpRight size={15}/></button></div></div>
          </div>
          <footer><span>OpsPulse AI <b>·</b> Early access preview</span><span>API endpoint: {apiBase}</span></footer>
        </section>
      </main>
    </div>
  )
}

function Metric({ label, value, change, icon, tone }: { label: string; value: string; change: string; icon: ReactNode; tone: string }) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone}`}>{icon}</span></div><strong>{value}</strong><small>{change}</small></div>
}

export default App
