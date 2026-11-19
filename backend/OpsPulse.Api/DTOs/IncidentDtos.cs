using System.ComponentModel.DataAnnotations;
using OpsPulse.Api.Models;

namespace OpsPulse.Api.DTOs;

public sealed record CreateIncidentRequest(
    [property: Required, StringLength(160, MinimumLength = 3)] string Title,
    [property: StringLength(4000)] string? Description,
    [property: Required, StringLength(120, MinimumLength = 2)] string ServiceName,
    IncidentSeverity Severity = IncidentSeverity.Medium);

public sealed record AddIncidentLogRequest(
    [property: Required, StringLength(12000, MinimumLength = 1)] string Message,
    [property: StringLength(20)] string? Level,
    DateTime? OccurredAt);

public sealed record UpdateIncidentStatusRequest(IncidentStatus Status);

public sealed record IncidentLogResponse(
    Guid Id,
    string Message,
    string Level,
    DateTime? OccurredAt,
    DateTime CreatedAt);

public sealed record IncidentResponse(
    Guid Id,
    string Title,
    string Description,
    string ServiceName,
    IncidentSeverity Severity,
    IncidentStatus Status,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    int LogCount,
    IReadOnlyList<IncidentLogResponse>? Logs)
{
    public static IncidentResponse From(Incident incident, bool includeLogs = false) => new(
        incident.Id, incident.Title, incident.Description, incident.ServiceName,
        incident.Severity, incident.Status, incident.CreatedAt, incident.UpdatedAt,
        incident.Logs.Count,
        includeLogs
            ? incident.Logs
                .OrderBy(x => x.OccurredAt ?? x.CreatedAt)
                .Select(x => new IncidentLogResponse(
                    x.Id, x.Message, x.Level, x.OccurredAt, x.CreatedAt))
                .ToList()
            : null);
}
