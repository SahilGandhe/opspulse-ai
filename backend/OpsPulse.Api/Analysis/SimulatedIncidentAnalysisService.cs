using Microsoft.EntityFrameworkCore;
using OpsPulse.Api.Data;
using OpsPulse.Api.Models;
using OpsPulse.Api.Services;

namespace OpsPulse.Api.Analysis;

/// <summary>
/// Deterministic, fully local demo analyzer. It pattern-matches incident log
/// text against known failure signatures and produces evidence-linked
/// hypotheses with human-executed remediation suggestions.
///
/// This is NOT a real AI model: no external provider is called and no data
/// leaves the process. Every result is labeled "simulated" so demo viewers
/// can never mistake it for a live AI analysis.
/// </summary>
public sealed class SimulatedIncidentAnalysisService(
    OpsPulseDbContext? db,
    IRedactionService redaction) : IIncidentAnalysisService
{
    private const string SafetyNotice =
        "RootBeacon suggests; humans decide. Suggested actions are written for a human " +
        "operator and are never executed by the product. Validate any change in a " +
        "non-production environment first.";

    private const string ModeLabel = "simulated-deterministic";
    private const string ProviderLabel =
        "RootBeacon simulated analysis engine (local, deterministic, no external AI)";

    public async Task<IncidentAnalysisResult> AnalyzeAsync(
        Guid incidentId, CancellationToken cancellationToken)
    {
        if (db is null)
        {
            return IncidentAnalysisResult.Unavailable(
                "not_configured", "Database is not configured.");
        }

        var incident = await db.Incidents
            .AsNoTracking()
            .Include(x => x.Logs)
            .FirstOrDefaultAsync(x => x.Id == incidentId, cancellationToken);

        if (incident is null)
        {
            return IncidentAnalysisResult.Unavailable("not_found", "Incident not found.");
        }

        var orderedLogs = incident.Logs
            .OrderBy(x => x.OccurredAt ?? x.CreatedAt)
            .ToList();

        if (orderedLogs.Count == 0)
        {
            return new IncidentAnalysisResult(
                "simulated", ModeLabel, ProviderLabel,
                $"Incident \"{incident.Title}\" has no log records yet. " +
                "Add log lines so the analysis engine has evidence to inspect.",
                Array.Empty<AnalysisHypothesis>(),
                new[]
                {
                    new SuggestedAction(
                        "Attach recent application logs",
                        "Add the last 15-30 minutes of ERROR and WARN log lines from " +
                        $"the {incident.ServiceName} service around the time the incident started.",
                        "Review logs for sensitive values before sharing them with anyone.")
                },
                SafetyNotice,
                "No logs attached to this incident.");
        }

        var scored = FailureSignature.All
            .Select(signature => new ScoredSignature(
                signature,
                MatchingLogs(orderedLogs, signature).ToList()))
            .Where(x => x.Matches.Count > 0)
            .OrderByDescending(x => x.Matches.Count)
            .Take(3)
            .ToList();

        var hypotheses = scored.Select(BuildHypothesis).ToList();
        var actions = scored.Count > 0
            ? scored[0].Signature.SuggestedActions
            : FallbackActions(incident);

        var summary = scored.Count > 0
            ? $"Analyzed {orderedLogs.Count} log record(s) from \"{incident.ServiceName}\". " +
              $"Top hypothesis: {scored[0].Signature.Title} " +
              $"(matched {scored[0].Matches.Count} log line(s)). " +
              "Simulated deterministic analysis; no external AI model was used."
            : $"Analyzed {orderedLogs.Count} log record(s) from \"{incident.ServiceName}\". " +
              "No known failure signature matched. Simulated deterministic analysis; " +
              "no external AI model was used.";

        return new IncidentAnalysisResult(
            "simulated", ModeLabel, ProviderLabel, summary,
            hypotheses, actions, SafetyNotice,
            "Simulated analysis completed.");
    }

    private static IEnumerable<IncidentLog> MatchingLogs(
        IReadOnlyList<IncidentLog> logs, FailureSignature signature)
    {
        foreach (var log in logs)
        {
            var text = $"{log.Level} {log.Message}";
            if (signature.Keywords.Any(keyword =>
                    text.Contains(keyword, StringComparison.OrdinalIgnoreCase)))
            {
                yield return log;
            }
        }
    }

    private AnalysisHypothesis BuildHypothesis(ScoredSignature scored)
    {
        var signature = scored.Signature;
        var evidence = scored.Matches
            .OrderBy(log => log.Level == "ERROR" ? 0 : log.Level == "WARN" ? 1 : 2)
            .ThenBy(log => log.OccurredAt ?? log.CreatedAt)
            .Take(3)
            .Select(log => new EvidenceItem(
                log.Id,
                log.OccurredAt ?? log.CreatedAt,
                log.Level,
                Truncate(redaction.Redact(log.Message), 240)))
            .ToList();

        // Deterministic heuristic confidence, clearly labeled as such.
        var score = Math.Min(0.95, 0.55 + 0.10 * scored.Matches.Count);
        var label = score >= 0.85 ? "high (heuristic)" :
                    score >= 0.65 ? "medium (heuristic)" : "low (heuristic)";

        return new AnalysisHypothesis(
            signature.Title, Math.Round(score, 2), label,
            signature.Rationale, evidence);
    }

    private static IReadOnlyList<SuggestedAction> FallbackActions(Incident incident) => new[]
    {
        new SuggestedAction(
            "Collect a wider log window",
            $"Pull 30-60 minutes of logs for {incident.ServiceName} around the first error " +
            "and attach the ERROR and WARN lines to this incident.",
            "Redact secrets and personal data before sharing logs."),
        new SuggestedAction(
            "Check recent deployments",
            "Compare the incident start time against the last deployment or configuration " +
            "change for this service.",
            "Roll back only through your normal, human-approved release process."),
        new SuggestedAction(
            "Verify dependent services",
            "Check the health of databases, queues and upstream APIs this service calls.",
            "Avoid restarting production dependencies without a maintenance window.")
    };

    private static string Truncate(string value, int max) =>
        value.Length <= max ? value : value[..(max - 1)] + "…";

    private sealed record ScoredSignature(
        FailureSignature Signature, List<IncidentLog> Matches);
}
