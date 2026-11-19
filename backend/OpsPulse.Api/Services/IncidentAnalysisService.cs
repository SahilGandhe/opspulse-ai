namespace OpsPulse.Api.Services;

/// <summary>
/// Safe placeholder for the Gemini integration.
/// Replace with a real provider implementation before enabling AI analysis.
/// </summary>
public sealed class IncidentAnalysisService(IConfiguration configuration)
    : IIncidentAnalysisService
{
    public Task<IncidentAnalysisResult> AnalyzeAsync(
        Guid incidentId,
        CancellationToken cancellationToken)
    {
        var apiKey = configuration["Gemini:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return Task.FromResult(IncidentAnalysisResult.Unavailable(
                "not_configured",
                "Gemini is not configured yet. Add Gemini:ApiKey through a secure environment variable."));
        }

        return Task.FromResult(IncidentAnalysisResult.Unavailable(
            "not_implemented",
            "Gemini credentials are present, but the provider adapter has not been implemented or verified."));
    }
}
