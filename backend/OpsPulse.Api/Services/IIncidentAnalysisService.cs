namespace OpsPulse.Api.Services;

/// <summary>
/// One quoted log line that supports a hypothesis. The excerpt is always
/// redacted before it leaves the service.
/// </summary>
public sealed record EvidenceItem(
    Guid LogId,
    DateTime? OccurredAtUtc,
    string Level,
    string Excerpt);

public sealed record AnalysisHypothesis(
    string Title,
    double ConfidenceScore,
    string ConfidenceLabel,
    string Rationale,
    IReadOnlyList<EvidenceItem> Evidence);

public sealed record SuggestedAction(
    string Title,
    string Detail,
    string RiskNote);

public sealed record IncidentAnalysisResult(
    string Status,
    string Mode,
    string Provider,
    string Summary,
    IReadOnlyList<AnalysisHypothesis> Hypotheses,
    IReadOnlyList<SuggestedAction> SuggestedActions,
    string SafetyNotice,
    string Message)
{
    public static IncidentAnalysisResult Unavailable(string status, string message) =>
        new(status, "none", "none", string.Empty,
            Array.Empty<AnalysisHypothesis>(), Array.Empty<SuggestedAction>(),
            string.Empty, message);
}

public interface IIncidentAnalysisService
{
    Task<IncidentAnalysisResult> AnalyzeAsync(Guid incidentId, CancellationToken cancellationToken);
}
