namespace OpsPulse.Api.Services;

public sealed record IncidentAnalysisResult(
    string Status,
    string Message,
    string? Provider = null);

public interface IIncidentAnalysisService
{
    Task<IncidentAnalysisResult> AnalyzeAsync(Guid incidentId, CancellationToken cancellationToken);
}
