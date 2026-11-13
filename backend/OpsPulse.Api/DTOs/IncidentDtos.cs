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
    DateTimeOffset? OccurredAt);

public sealed record UpdateIncidentStatusRequest(IncidentStatus Status);

public sealed record IncidentResponse(
    Guid Id,
    string Title,
    string Description,
    string ServiceName,
    IncidentSeverity Severity,
    IncidentStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    int LogCount)
{
    public static IncidentResponse From(Incident incident) => new(
        incident.Id, incident.Title, incident.Description, incident.ServiceName,
        incident.Severity, incident.Status, incident.CreatedAt, incident.UpdatedAt,
        incident.Logs.Count);
}
