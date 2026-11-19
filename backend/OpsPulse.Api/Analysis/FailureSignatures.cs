using OpsPulse.Api.Services;

namespace OpsPulse.Api.Analysis;

/// <summary>
/// A known failure signature: log keywords that identify it, the hypothesis
/// it supports, and human-executed remediation suggestions.
/// </summary>
public sealed record FailureSignature(
    string Title,
    string Rationale,
    IReadOnlyList<string> Keywords,
    IReadOnlyList<SuggestedAction> SuggestedActions)
{
    public static readonly IReadOnlyList<FailureSignature> All = new[]
    {
        new FailureSignature(
            "Database connection pool exhaustion",
            "Repeated connection timeouts and pool-related errors indicate the service " +
            "is exhausting its database connection pool, so new requests wait and fail.",
            new[] { "connection pool", "pool exhausted", "timeout expired",
                    "connection timeout", "too many connections", "npgsql", "connection refused" },
            new[]
            {
                new SuggestedAction(
                    "Inspect current pool usage",
                    "Check active vs. idle connections on the database and the service's " +
                    "configured maximum pool size.",
                    "Read-only check; safe to run in production."),
                new SuggestedAction(
                    "Look for leaked connections",
                    "Review recent code paths for connections opened without disposal " +
                    "(missing using/await using).",
                    "Code change; must go through normal review and deployment."),
                new SuggestedAction(
                    "Consider a bounded pool-size increase",
                    "If load legitimately grew, raise the pool limit gradually while " +
                    "watching database CPU and connection count.",
                    "Configuration change; apply in staging first, then a maintenance window.")
            }),
        new FailureSignature(
            "Unhandled application exception (HTTP 500)",
            "Stack traces with unhandled exceptions in request processing explain the " +
            "HTTP 500 responses returned to callers.",
            new[] { "unhandled exception", "nullreferenceexception", "stack trace",
                    "http 500", " 500 ", "invalidoperationexception", "argumentexception" },
            new[]
            {
                new SuggestedAction(
                    "Locate the failing code path",
                    "Use the top frame of the stack trace to find the throwing method and " +
                    "the request inputs that reach it.",
                    "Read-only investigation."),
                new SuggestedAction(
                    "Reproduce in a non-production environment",
                    "Replay the failing request against staging with the same inputs to " +
                    "confirm the root cause before changing code.",
                    "Never reproduce against production data."),
                new SuggestedAction(
                    "Ship a guarded fix",
                    "Add the missing null/argument check or error handling, add a " +
                    "regression test, and deploy through the normal release process.",
                    "Code change; requires review, tests and staged rollout.")
            }),
        new FailureSignature(
            "Memory pressure / possible leak",
            "Out-of-memory errors and sustained memory growth point to a leak or an " +
            "undersized memory limit for the workload.",
            new[] { "outofmemoryexception", "out of memory", "oom", "memory pressure",
                    "gc overhead", "heap" },
            new[]
            {
                new SuggestedAction(
                    "Capture a memory profile",
                    "Take a dump or profiler snapshot from a replica instance to identify " +
                    "the objects being retained.",
                    "Profiling adds load; prefer a replica or off-peak window."),
                new SuggestedAction(
                    "Check recent traffic shape",
                    "Confirm whether memory growth tracks a traffic increase or a specific " +
                    "new endpoint or batch job.",
                    "Read-only check."),
                new SuggestedAction(
                    "Right-size limits after fixing retention",
                    "Fix the retention issue first; raise memory limits only as a temporary, " +
                    "monitored mitigation.",
                    "Restarting or resizing instances can drop in-flight requests.")
            }),
        new FailureSignature(
            "Authentication/dependency latency",
            "Rising response times concentrated in an authentication or upstream " +
            "dependency call explain the elevated latency.",
            new[] { "latency", "slow", "deadline exceeded", "upstream", "identity",
                    "auth", "timed out waiting" },
            new[]
            {
                new SuggestedAction(
                    "Break down request timing",
                    "Compare time spent in the service vs. the downstream dependency using " +
                    "traces or timing logs.",
                    "Read-only check."),
                new SuggestedAction(
                    "Check the dependency's health",
                    "Review the upstream provider's status page and your own saturation " +
                    "metrics for that dependency.",
                    "Read-only check."),
                new SuggestedAction(
                    "Add or tune timeouts and caching",
                    "Bound calls with explicit timeouts and cache tokens/session data where " +
                    "semantics allow.",
                    "Configuration/code change; validate in staging first.")
            }),
        new FailureSignature(
            "Retry storm / rate limiting",
            "Retries climbing together with HTTP 429 or threshold alerts indicate a " +
            "retry loop amplifying load instead of recovering.",
            new[] { "retry", "retries", "429", "too many requests", "circuit",
                    "rate limit", "threshold exceeded" },
            new[]
            {
                new SuggestedAction(
                    "Inspect the retry policy",
                    "Confirm the worker uses exponential backoff with jitter and a maximum " +
                    "attempt count.",
                    "Read-only check."),
                new SuggestedAction(
                    "Identify the failing downstream",
                    "Find which downstream call the retries target and check its rate " +
                    "limits and error rate.",
                    "Read-only check."),
                new SuggestedAction(
                    "Pause or drain the queue safely",
                    "If the backlog keeps growing, pause consumers and drain in a " +
                    "controlled way rather than letting retries hammer the downstream.",
                    "Operational action; coordinate through your incident process.")
            }),
        new FailureSignature(
            "Disk or storage exhaustion",
            "No-space and write-failure errors indicate the host or volume is out of " +
            "disk capacity.",
            new[] { "no space left", "disk full", "enospc", "write failed", "quota exceeded" },
            new[]
            {
                new SuggestedAction(
                    "Confirm volume usage",
                    "Check disk usage on the affected host or volume and identify the " +
                    "fastest-growing directory.",
                    "Read-only check."),
                new SuggestedAction(
                    "Rotate or archive logs",
                    "If log files are the cause, apply rotation/retention before deleting " +
                    "anything.",
                    "Deletion is irreversible; archive first."),
                new SuggestedAction(
                    "Expand the volume",
                    "Grow the volume through your infrastructure process if usage is " +
                    "legitimate.",
                    "Infrastructure change; follow your change-management process.")
            }),
        new FailureSignature(
            "TLS/certificate or DNS resolution failure",
            "Certificate validation or name-resolution errors mean the service cannot " +
            "establish trusted connections to its dependencies.",
            new[] { "certificate", "ssl", "tls", "certificate has expired", "dns",
                    "name resolution", "no such host" },
            new[]
            {
                new SuggestedAction(
                    "Check certificate expiry",
                    "Verify the expiry and chain of the certificates on both ends of the " +
                    "failing connection.",
                    "Read-only check."),
                new SuggestedAction(
                    "Verify DNS records",
                    "Confirm the hostname resolves to the expected addresses from inside " +
                    "the affected environment.",
                    "Read-only check."),
                new SuggestedAction(
                    "Renew or reissue through your PKI process",
                    "Replace expiring certificates through the standard issuance and " +
                    "rollout process.",
                    "Certificate rollout can drop connections; stage it carefully.")
            })
    };
}
