using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpsPulse.Api.Data;
using OpsPulse.Api.DTOs;
using OpsPulse.Api.Models;
using OpsPulse.Api.Services;

namespace OpsPulse.Api.Controllers;

[ApiController]
[Route("api/incidents")]
public sealed class IncidentsController(
    OpsPulseDbContext? db,
    IIncidentAnalysisService analysisService) : ControllerBase
{
    private OpsPulseDbContext Db => db
        ?? throw new InvalidOperationException(
            "Database is not configured. Set ConnectionStrings:DefaultConnection.");

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<IncidentResponse>>> GetAll(
        CancellationToken cancellationToken)
    {
        var incidents = await Db.Incidents
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Take(100)
            .ToListAsync(cancellationToken);

        return Ok(incidents.Select(IncidentResponse.From).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<IncidentResponse>> GetById(
        Guid id, CancellationToken cancellationToken)
    {
        var incident = await Db.Incidents
            .AsNoTracking()
            .Include(x => x.Logs)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        return incident is null ? NotFound() : Ok(IncidentResponse.From(incident));
    }

    [HttpPost]
    public async Task<ActionResult<IncidentResponse>> Create(
        [FromBody] CreateIncidentRequest request,
        CancellationToken cancellationToken)
    {
        var incident = new Incident
        {
            Title = request.Title.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            ServiceName = request.ServiceName.Trim(),
            Severity = request.Severity
        };

        Db.Incidents.Add(incident);
        await Db.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = incident.Id },
            IncidentResponse.From(incident));
    }

    [HttpPost("{id:guid}/logs")]
    public async Task<IActionResult> AddLog(
        Guid id, [FromBody] AddIncidentLogRequest request,
        CancellationToken cancellationToken)
    {
        var incident = await Db.Incidents
            .Include(x => x.Logs)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (incident is null) return NotFound();

        incident.Logs.Add(new IncidentLog
        {
            IncidentId = incident.Id,
            Message = request.Message,
            Level = string.IsNullOrWhiteSpace(request.Level)
                ? "INFO" : request.Level.Trim().ToUpperInvariant(),
            OccurredAt = request.OccurredAt
        });
        incident.UpdatedAt = DateTimeOffset.UtcNow;

        await Db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid id, [FromBody] UpdateIncidentStatusRequest request,
        CancellationToken cancellationToken)
    {
        var incident = await Db.Incidents.FindAsync([id], cancellationToken);
        if (incident is null) return NotFound();

        incident.Status = request.Status;
        incident.UpdatedAt = DateTimeOffset.UtcNow;
        await Db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/analyze")]
    public async Task<ActionResult<IncidentAnalysisResult>> Analyze(
        Guid id, CancellationToken cancellationToken)
    {
        var exists = await Db.Incidents.AnyAsync(x => x.Id == id, cancellationToken);
        if (!exists) return NotFound();

        var result = await analysisService.AnalyzeAsync(id, cancellationToken);
        return result.Status == "not_configured"
            ? StatusCode(StatusCodes.Status503ServiceUnavailable, result)
            : Ok(result);
    }
}
