namespace OpsPulse.Api.Models;

public enum IncidentSeverity
{
    Low,
    Medium,
    High,
    Critical
}

public enum IncidentStatus
{
    Open,
    Investigating,
    Resolved
}

public sealed class Incident
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Title { get; set; }
    public string Description { get; set; } = string.Empty;
    public required string ServiceName { get; set; }
    public IncidentSeverity Severity { get; set; } = IncidentSeverity.Medium;
    public IncidentStatus Status { get; set; } = IncidentStatus.Open;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public List<IncidentLog> Logs { get; set; } = [];
}

public sealed class IncidentLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid IncidentId { get; set; }
    public required string Message { get; set; }
    public string Level { get; set; } = "INFO";
    public DateTimeOffset? OccurredAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
