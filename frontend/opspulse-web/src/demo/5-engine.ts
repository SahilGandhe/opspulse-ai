import type {
  Incident,
  IncidentAnalysisResult,
  IncidentLog,
  SuggestedAction,
} from '../types'

// Browser-only demo engine: a TypeScript mirror of the backend's
// SimulatedIncidentAnalysisService. Used only when the API is unreachable
// (for example in the hosted static demo). Deterministic, fully local:
// no network calls, no data leaves the device, and every result is labeled
// "simulated" exactly like the backend's demo analyzer.

const SAFETY_NOTICE =
  'RootBeacon suggests; humans decide. Suggested actions are written for a human ' +
  'operator and are never executed by the product. Validate any change in a ' +
  'non-production environment first.'

export function redact(input: string): string {
  return input
    .replace(/\b(password|passwd|pwd|api[_-]?key|apikey|secret|access[_-]?token|connectionstring)\b(\s*[=:]\s*)\S+/gi, '$1$2[redacted-secret]')
    .replace(/\b(bearer\s+)[A-Za-z0-9._-]{8,}/gi, '$1[redacted-token]')
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[redacted-email]')
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[redacted-ip]')
}

interface FailureSignature {
  title: string
  rationale: string
  keywords: string[]
  actions: SuggestedAction[]
}

const SIGNATURES: FailureSignature[] = [
  {
    title: 'Database connection pool exhaustion',
    rationale:
      'Repeated connection timeouts and pool-related errors indicate the service is exhausting its database connection pool, so new requests wait and fail.',
    keywords: ['connection pool', 'pool exhausted', 'timeout expired', 'connection timeout', 'too many connections', 'npgsql', 'connection refused'],
    actions: [
      { title: 'Inspect current pool usage', detail: 'Check active vs. idle connections on the database and the service\'s configured maximum pool size.', riskNote: 'Read-only check; safe to run in production.' },
      { title: 'Look for leaked connections', detail: 'Review recent code paths for connections opened without disposal (missing using/await using).', riskNote: 'Code change; must go through normal review and deployment.' },
      { title: 'Consider a bounded pool-size increase', detail: 'If load legitimately grew, raise the pool limit gradually while watching database CPU and connection count.', riskNote: 'Configuration change; apply in staging first, then a maintenance window.' },
    ],
  },
  {
    title: 'Unhandled application exception (HTTP 500)',
    rationale:
      'Stack traces with unhandled exceptions in request processing explain the HTTP 500 responses returned to callers.',
    keywords: ['unhandled exception', 'nullreferenceexception', 'stack trace', 'http 500', ' 500 ', 'invalidoperationexception', 'argumentexception'],
    actions: [
      { title: 'Locate the failing code path', detail: 'Use the top frame of the stack trace to find the throwing method and the request inputs that reach it.', riskNote: 'Read-only investigation.' },
      { title: 'Reproduce in a non-production environment', detail: 'Replay the failing request against staging with the same inputs to confirm the root cause before changing code.', riskNote: 'Never reproduce against production data.' },
      { title: 'Ship a guarded fix', detail: 'Add the missing null/argument check or error handling, add a regression test, and deploy through the normal release process.', riskNote: 'Code change; requires review, tests and staged rollout.' },
    ],
  },
  {
    title: 'Memory pressure / possible leak',
    rationale:
      'Out-of-memory errors and sustained memory growth point to a leak or an undersized memory limit for the workload.',
    keywords: ['outofmemoryexception', 'out of memory', 'oom', 'memory pressure', 'gc overhead', 'heap'],
    actions: [
      { title: 'Capture a memory profile', detail: 'Take a dump or profiler snapshot from a replica instance to identify the objects being retained.', riskNote: 'Profiling adds load; prefer a replica or off-peak window.' },
      { title: 'Check recent traffic shape', detail: 'Confirm whether memory growth tracks a traffic increase or a specific new endpoint or batch job.', riskNote: 'Read-only check.' },
      { title: 'Right-size limits after fixing retention', detail: 'Fix the retention issue first; raise memory limits only as a temporary, monitored mitigation.', riskNote: 'Restarting or resizing instances can drop in-flight requests.' },
    ],
  },
  {
    title: 'Authentication/dependency latency',
    rationale:
      'Rising response times concentrated in an authentication or upstream dependency call explain the elevated latency.',
    keywords: ['latency', 'slow', 'deadline exceeded', 'upstream', 'identity', 'auth', 'timed out waiting'],
    actions: [
      { title: 'Break down request timing', detail: 'Compare time spent in the service vs. the downstream dependency using traces or timing logs.', riskNote: 'Read-only check.' },
      { title: 'Check the dependency\'s health', detail: 'Review the upstream provider\'s status page and your own saturation metrics for that dependency.', riskNote: 'Read-only check.' },
      { title: 'Add or tune timeouts and caching', detail: 'Bound calls with explicit timeouts and cache tokens/session data where semantics allow.', riskNote: 'Configuration/code change; validate in staging first.' },
    ],
  },
  {
    title: 'Retry storm / rate limiting',
    rationale:
      'Retries climbing together with HTTP 429 or threshold alerts indicate a retry loop amplifying load instead of recovering.',
    keywords: ['retry', 'retries', '429', 'too many requests', 'circuit', 'rate limit', 'threshold exceeded'],
    actions: [
      { title: 'Inspect the retry policy', detail: 'Confirm the worker uses exponential backoff with jitter and a maximum attempt count.', riskNote: 'Read-only check.' },
      { title: 'Identify the failing downstream', detail: 'Find which downstream call the retries target and check its rate limits and error rate.', riskNote: 'Read-only check.' },
      { title: 'Pause or drain the queue safely', detail: 'If the backlog keeps growing, pause consumers and drain in a controlled way rather than letting retries hammer the downstream.', riskNote: 'Operational action; coordinate through your incident process.' },
    ],
  },
  {
    title: 'Disk or storage exhaustion',
    rationale:
      'No-space and write-failure errors indicate the host or volume is out of disk capacity.',
    keywords: ['no space left', 'disk full', 'enospc', 'write failed', 'quota exceeded'],
    actions: [
      { title: 'Confirm volume usage', detail: 'Check disk usage on the affected host or volume and identify the fastest-growing directory.', riskNote: 'Read-only check.' },
      { title: 'Rotate or archive logs', detail: 'If log files are the cause, apply rotation/retention before deleting anything.', riskNote: 'Deletion is irreversible; archive first.' },
      { title: 'Expand the volume', detail: 'Grow the volume through your infrastructure process if usage is legitimate.', riskNote: 'Infrastructure change; follow your change-management process.' },
    ],
  },
  {
    title: 'TLS/certificate or DNS resolution failure',
    rationale:
      'Certificate validation or name-resolution errors mean the service cannot establish trusted connections to its dependencies.',
    keywords: ['certificate', 'ssl', 'tls', 'certificate has expired', 'dns', 'name resolution', 'no such host'],
    actions: [
      { title: 'Check certificate expiry', detail: 'Verify the expiry and chain of the certificates on both ends of the failing connection.', riskNote: 'Read-only check.' },
      { title: 'Verify DNS records', detail: 'Confirm the hostname resolves to the expected addresses from inside the affected environment.', riskNote: 'Read-only check.' },
      { title: 'Renew or reissue through your PKI process', detail: 'Replace expiring certificates through the standard issuance and rollout process.', riskNote: 'Certificate rollout can drop connections; stage it carefully.' },
    ],
  },
]

const now = Date.now()
const min = (m: number) => new Date(now - m * 60000).toISOString()

function log(level: string, occurredAt: string, message: string, i: number): IncidentLog {
  return { id: `demo-log-${i}-${message.length}`, message, level, occurredAt, createdAt: occurredAt }
}

function incident(
  n: number,
  title: string,
  description: string,
  serviceName: string,
  severity: Incident['severity'],
  status: Incident['status'],
  createdAt: string,
  logs: IncidentLog[],
): Incident {
  return {
    id: `demo-incident-${n}`,
    title, description, serviceName, severity, status,
    createdAt, updatedAt: createdAt,
    logCount: logs.length, logs,
  }
}

export const DEMO_INCIDENTS: Incident[] = [
  incident(1, 'Payment API returning HTTP 500',
    'Customers report failed checkouts; payment-service responds with HTTP 500 on POST /payments.',
    'payment-service', 'Critical', 'Investigating', min(34), [
      log('WARN', min(31), 'POST /payments latency p95 crossed 2500ms (threshold 800ms)', 1),
      log('ERROR', min(29), 'Unhandled exception while processing POST /payments for customer cust_88412', 2),
      log('ERROR', min(29), 'System.NullReferenceException: Object reference not set to an instance of an object. at Payments.Api.Services.PricingService.ApplyDiscount(Order order) in /src/Services/PricingService.cs:line 148', 3),
      log('ERROR', min(27), 'HTTP 500 returned to caller POST /payments trace_id=9f2c1a api_key=sk_live_FAKE_DEMO_KEY_0000', 4),
      log('ERROR', min(24), 'Unhandled exception while processing POST /payments for customer cust_90017', 5),
      log('ERROR', min(23), 'System.NullReferenceException: Object reference not set to an instance of an object. at Payments.Api.Services.PricingService.ApplyDiscount(Order order) in /src/Services/PricingService.cs:line 148', 6),
      log('INFO', min(21), 'Deployment marker: payment-service v2.14.0 rolled out 40 minutes before first error', 7),
      log('ERROR', min(18), 'HTTP 500 returned to caller POST /payments trace_id=a17be2 contact oncall-engineer@payments-demo.example', 8),
    ]),
  incident(2, 'Database connection pool saturation',
    'orders-api health checks intermittently failing; database connections appear exhausted.',
    'orders-api', 'High', 'Open', min(132), [
      log('WARN', min(125), 'Npgsql: connection acquisition took 4120ms (pool size 100)', 11),
      log('ERROR', min(120), 'Npgsql.NpgsqlException: Timeout expired. The timeout period elapsed prior to obtaining a connection from the pool.', 12),
      log('ERROR', min(110), 'Failed to open connection to Host=db-primary.internal;Port=5432;Username=orders_svc;Password=Sup3rSecret!Demo', 13),
      log('WARN', min(101), 'Active connections 100/100, 37 requests waiting for a free connection', 14),
      log('ERROR', min(93), 'Npgsql.NpgsqlException: Timeout expired. The timeout period elapsed prior to obtaining a connection from the pool.', 15),
      log('ERROR', min(80), 'Health probe /readyz failed: database ping timed out from 10.14.3.27', 16),
      log('WARN', min(66), 'Active connections 100/100, 52 requests waiting for a free connection', 17),
    ]),
  incident(3, 'Elevated authentication latency',
    'Login and token-refresh requests are slow; p95 latency on identity-service has tripled.',
    'identity-service', 'Medium', 'Open', min(300), [
      log('INFO', min(292), 'Token refresh latency p95 = 180ms (7-day baseline 190ms)', 21),
      log('WARN', min(277), 'Token refresh latency p95 = 640ms, upstream identity provider slow', 22),
      log('WARN', min(262), 'Auth call to https://idp.demo-example.internal/oauth/token timed out waiting after 3000ms, retried', 23),
      log('WARN', min(249), 'Login latency p95 = 910ms (baseline 210ms); downstream dependency latency dominates', 24),
      log('WARN', min(228), 'Auth call to https://idp.demo-example.internal/oauth/token timed out waiting after 3000ms, retried', 25),
      log('INFO', min(210), 'No recent deployment for identity-service; upstream idp.demo-example.internal announced maintenance', 26),
    ]),
  incident(4, 'Background worker retry threshold exceeded',
    'notification-worker retried failed email deliveries past its alert threshold.',
    'notification-worker', 'Low', 'Resolved', min(1620), [
      log('WARN', min(164), 'Email send failed with HTTP 429 too many requests from provider; scheduling retry 1', 31),
      log('WARN', min(160), 'Retry 2 for message msg_55120 failed with HTTP 429 too many requests', 32),
      log('ERROR', min(151), 'Retry threshold exceeded: 128 messages in retry queue, circuit half-open for email provider', 33),
      log('WARN', min(135), 'Retry 5 for message msg_55177 failed with HTTP 429 too many requests', 34),
      log('INFO', min(120), 'Operator paused consumers and drained queue; provider rate limit reset', 35),
      log('INFO', min(90), 'Retry queue empty; worker healthy, marking incident resolved', 36),
    ]),
  incident(5, 'Checkout latency spike after v1.9.0 deploy',
    'Checkout page API latency jumped right after the v1.9.0 rollout; p95 stayed above the alert threshold for 40 minutes.',
    'checkout-service', 'High', 'Resolved', min(4560), [
      log('INFO', min(4560), 'Deployment marker: checkout-service v1.9.0 rollout started', 41),
      log('WARN', min(4330), 'GET /checkout/summary latency p95 crossed 1400ms (threshold 400ms)', 42),
      log('WARN', min(4318), 'GET /checkout/summary latency p95 = 1920ms; downstream pricing call slow', 43),
      log('WARN', min(4301), 'Latency concentrated in PricingClient.GetQuoteAsync; upstream pricing-service p95 = 1710ms', 44),
      log('INFO', min(4260), 'Rollback marker: checkout-service reverted to v1.8.3', 45),
      log('INFO', min(4180), 'GET /checkout/summary latency p95 back to 310ms; closing incident', 46),
    ]),
  incident(6, 'TLS certificate expiring on edge gateway',
    'Certificate monitoring shows the public edge gateway certificate expires within the alert window.',
    'edge-gateway', 'Medium', 'Open', min(6120), [
      log('WARN', min(6120), 'TLS certificate for api.demo-example.com expires in 9 days (threshold 14 days)', 51),
      log('WARN', min(5880), 'TLS certificate for api.demo-example.com expires in 8 days; renewal not yet scheduled', 52),
      log('WARN', min(5040), 'TLS certificate for api.demo-example.com expires in 7 days', 53),
      log('INFO', min(4560), 'Renewal request opened with the certificate owner; awaiting scheduled change window', 54),
    ]),
  incident(7, 'Report worker OOM restarts',
    'report-worker was restarted repeatedly after exceeding its memory limit during the nightly batch.',
    'report-worker', 'Critical', 'Resolved', min(11640), [
      log('WARN', min(11640), 'Memory usage 82% of 512Mi limit during nightly report batch', 61),
      log('ERROR', min(11592), "System.OutOfMemoryException: Exception of type 'System.OutOfMemoryException' was thrown. at Reporting.Worker.Rendering.PdfRenderer.Render(ReportJob job)", 62),
      log('ERROR', min(11585), 'Container report-worker-7d9f restarted by orchestrator (OOMKilled, exit 137)', 63),
      log('ERROR', min(11562), 'System.OutOfMemoryException during batch job job_44821 processing 38000 rows in a single pass', 64),
      log('WARN', min(11545), 'Memory pressure: GC overhead 41% during batch window', 65),
      log('INFO', min(11280), 'Batch switched to 2000-row pages; nightly run completed within memory limit, incident resolved', 66),
    ]),
  incident(8, 'Intermittent DNS resolution failures',
    'inventory-service intermittently failed to resolve its cache host, causing transient checkout errors.',
    'inventory-service', 'Medium', 'Resolved', min(17460), [
      log('ERROR', min(17460), 'System.Net.Sockets.SocketException: No such host is known. (cache.demo-example.internal:6379)', 71),
      log('WARN', min(17410), 'Name resolution retry succeeded after 2 attempts for cache.demo-example.internal', 72),
      log('ERROR', min(17393), 'System.Net.Sockets.SocketException: No such host is known. (cache.demo-example.internal:6379)', 73),
      log('WARN', min(17370), 'DNS latency to resolver 10.0.0.2 spiked to 900ms during failure window', 74),
      log('INFO', min(17340), 'Resolver failover completed; no further resolution failures observed, incident resolved', 75),
    ]),
]

export function analyzeLocally(target: Incident): Promise<IncidentAnalysisResult> {
  const logs = (target.logs ?? []).slice().sort((a, b) =>
    (a.occurredAt ?? a.createdAt).localeCompare(b.occurredAt ?? b.createdAt))

  if (logs.length === 0) {
    return Promise.resolve({
      status: 'simulated', mode: 'simulated-deterministic',
      provider: 'RootBeacon simulated analysis engine (local, deterministic, no external AI)',
      summary: `Incident "${target.title}" has no log records yet. Add log lines so the analysis engine has evidence to inspect.`,
      hypotheses: [],
      suggestedActions: [{
        title: 'Attach recent application logs',
        detail: `Add the last 15-30 minutes of ERROR and WARN log lines from the ${target.serviceName} service around the time the incident started.`,
        riskNote: 'Review logs for sensitive values before sharing them with anyone.',
      }],
      safetyNotice: SAFETY_NOTICE,
      message: 'No logs attached to this incident.',
    })
  }

  const scored = SIGNATURES
    .map(sig => ({
      sig,
      matches: logs.filter(l => sig.keywords.some(k => `${l.level} ${l.message}`.toLowerCase().includes(k.toLowerCase()))),
    }))
    .filter(x => x.matches.length > 0)
    .sort((a, b) => b.matches.length - a.matches.length)
    .slice(0, 3)

  const hypotheses = scored.map(({ sig, matches }) => {
    const score = Math.min(0.95, 0.55 + 0.1 * matches.length)
    const ordered = matches.slice().sort((a, b) => {
      const rank = (l: IncidentLog) => (l.level === 'ERROR' ? 0 : l.level === 'WARN' ? 1 : 2)
      return rank(a) - rank(b) || (a.occurredAt ?? a.createdAt).localeCompare(b.occurredAt ?? b.createdAt)
    })
    return {
      title: sig.title,
      confidenceScore: Math.round(score * 100) / 100,
      confidenceLabel: score >= 0.85 ? 'high (heuristic)' : score >= 0.65 ? 'medium (heuristic)' : 'low (heuristic)',
      rationale: sig.rationale,
      evidence: ordered.slice(0, 3).map(l => ({
        logId: l.id,
        occurredAtUtc: l.occurredAt ?? l.createdAt,
        level: l.level,
        excerpt: redact(l.message).slice(0, 240),
      })),
    }
  })

  const actions = scored.length > 0 ? scored[0].sig.actions : [
    { title: 'Collect a wider log window', detail: `Pull 30-60 minutes of logs for ${target.serviceName} around the first error and attach the ERROR and WARN lines to this incident.`, riskNote: 'Redact secrets and personal data before sharing logs.' },
    { title: 'Check recent deployments', detail: 'Compare the incident start time against the last deployment or configuration change for this service.', riskNote: 'Roll back only through your normal, human-approved release process.' },
    { title: 'Verify dependent services', detail: 'Check the health of databases, queues and upstream APIs this service calls.', riskNote: 'Avoid restarting production dependencies without a maintenance window.' },
  ]

  const summary = scored.length > 0
    ? `Analyzed ${logs.length} log record(s) from "${target.serviceName}". Top hypothesis: ${scored[0].sig.title} (matched ${scored[0].matches.length} log line(s)). Simulated deterministic analysis; no external AI model was used.`
    : `Analyzed ${logs.length} log record(s) from "${target.serviceName}". No known failure signature matched. Simulated deterministic analysis; no external AI model was used.`

  return Promise.resolve({
    status: 'simulated', mode: 'simulated-deterministic',
    provider: 'RootBeacon simulated analysis engine (local, deterministic, no external AI)',
    summary, hypotheses, suggestedActions: actions,
    safetyNotice: SAFETY_NOTICE,
    message: 'Simulated analysis completed.',
  })
      }
