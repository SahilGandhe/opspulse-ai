using OpsPulse.Api.Models;

namespace OpsPulse.Api.Data;

/// <summary>
/// Seeds clearly synthetic demo incidents on first run. All hostnames,
/// addresses and people in these logs are fictional sample values.
/// </summary>
public static class DemoSeeder
{
    public static async Task SeedAsync(OpsPulseDbContext db, CancellationToken cancellationToken = default)
    {
        if (db.Incidents.Any()) return;

        var now = DateTime.UtcNow;

        db.Incidents.AddRange(
            BuildIncident(
                "Payment API returning HTTP 500",
                "Customers report failed checkouts; payment-service responds with HTTP 500 on POST /payments.",
                "payment-service", IncidentSeverity.Critical, IncidentStatus.Investigating,
                now.AddMinutes(-34),
                new[]
                {
                    Log("WARN", now.AddMinutes(-31), "POST /payments latency p95 crossed 2500ms (threshold 800ms)"),
                    Log("ERROR", now.AddMinutes(-29), "Unhandled exception while processing POST /payments for customer cust_88412"),
                    Log("ERROR", now.AddMinutes(-29), "System.NullReferenceException: Object reference not set to an instance of an object. at Payments.Api.Services.PricingService.ApplyDiscount(Order order) in /src/Services/PricingService.cs:line 148"),
                    Log("ERROR", now.AddMinutes(-27), "HTTP 500 returned to caller POST /payments trace_id=9f2c1a api_key=sk_live_demo12345abcdef"),
                    Log("ERROR", now.AddMinutes(-24), "Unhandled exception while processing POST /payments for customer cust_90017"),
                    Log("ERROR", now.AddMinutes(-23), "System.NullReferenceException: Object reference not set to an instance of an object. at Payments.Api.Services.PricingService.ApplyDiscount(Order order) in /src/Services/PricingService.cs:line 148"),
                    Log("INFO", now.AddMinutes(-21), "Deployment marker: payment-service v2.14.0 rolled out 40 minutes before first error"),
                    Log("ERROR", now.AddMinutes(-18), "HTTP 500 returned to caller POST /payments trace_id=a17be2 contact oncall-engineer@payments-demo.example"),
                }),
            BuildIncident(
                "Database connection pool saturation",
                "orders-api health checks intermittently failing; database connections appear exhausted.",
                "orders-api", IncidentSeverity.High, IncidentStatus.Open,
                now.AddHours(-2).AddMinutes(-12),
                new[]
                {
                    Log("WARN", now.AddHours(-2).AddMinutes(-5), "Npgsql: connection acquisition took 4120ms (pool size 100)"),
                    Log("ERROR", now.AddHours(-2), "Npgsql.NpgsqlException: Timeout expired. The timeout period elapsed prior to obtaining a connection from the pool."),
                    Log("ERROR", now.AddHours(-1).AddMinutes(-50), "Failed to open connection to Host=db-primary.internal;Port=5432;Username=orders_svc;Password=Sup3rSecret!Demo"),
                    Log("WARN", now.AddHours(-1).AddMinutes(-41), "Active connections 100/100, 37 requests waiting for a free connection"),
                    Log("ERROR", now.AddHours(-1).AddMinutes(-33), "Npgsql.NpgsqlException: Timeout expired. The timeout period elapsed prior to obtaining a connection from the pool."),
                    Log("ERROR", now.AddHours(-1).AddMinutes(-20), "Health probe /readyz failed: database ping timed out from 10.14.3.27"),
                    Log("WARN", now.AddHours(-1).AddMinutes(-6), "Active connections 100/100, 52 requests waiting for a free connection"),
                }),
            BuildIncident(
                "Elevated authentication latency",
                "Login and token-refresh requests are slow; p95 latency on identity-service has tripled.",
                "identity-service", IncidentSeverity.Medium, IncidentStatus.Open,
                now.AddHours(-5),
                new[]
                {
                    Log("INFO", now.AddHours(-4).AddMinutes(-52), "Token refresh latency p95 = 180ms (7-day baseline 190ms)"),
                    Log("WARN", now.AddHours(-4).AddMinutes(-37), "Token refresh latency p95 = 640ms, upstream identity provider slow"),
                    Log("WARN", now.AddHours(-4).AddMinutes(-22), "Auth call to https://idp.demo-example.internal/oauth/token timed out waiting after 3000ms, retried"),
                    Log("WARN", now.AddHours(-4).AddMinutes(-9), "Login latency p95 = 910ms (baseline 210ms); downstream dependency latency dominates"),
                    Log("WARN", now.AddHours(-3).AddMinutes(-48), "Auth call to https://idp.demo-example.internal/oauth/token timed out waiting after 3000ms, retried"),
                    Log("INFO", now.AddHours(-3).AddMinutes(-30), "No recent deployment for identity-service; upstream idp.demo-example.internal announced maintenance"),
                }),
            BuildIncident(
                "Background worker retry threshold exceeded",
                "notification-worker retried failed email deliveries past its alert threshold.",
                "notification-worker", IncidentSeverity.Low, IncidentStatus.Resolved,
                now.AddDays(-1).AddHours(-3),
                new[]
                {
                    Log("WARN", now.AddDays(-1).AddHours(-2).AddMinutes(-44), "Email send failed with HTTP 429 too many requests from provider; scheduling retry 1"),
                    Log("WARN", now.AddDays(-1).AddHours(-2).AddMinutes(-40), "Retry 2 for message msg_55120 failed with HTTP 429 too many requests"),
                    Log("ERROR", now.AddDays(-1).AddHours(-2).AddMinutes(-31), "Retry threshold exceeded: 128 messages in retry queue, circuit half-open for email provider"),
                    Log("WARN", now.AddDays(-1).AddHours(-2).AddMinutes(-15), "Retry 5 for message msg_55177 failed with HTTP 429 too many requests"),
                    Log("INFO", now.AddDays(-1).AddHours(-2), "Operator paused consumers and drained queue; provider rate limit reset"),
                    Log("INFO", now.AddDays(-1).AddHours(-1).AddMinutes(-30), "Retry queue empty; worker healthy, marking incident resolved"),
                }));

        await db.SaveChangesAsync(cancellationToken);
    }

    private static Incident BuildIncident(
        string title, string description, string service,
        IncidentSeverity severity, IncidentStatus status,
        DateTime createdAt, IEnumerable<IncidentLog> logs)
    {
        var incident = new Incident
        {
            Title = title,
            Description = description,
            ServiceName = service,
            Severity = severity,
            Status = status,
            CreatedAt = createdAt,
            UpdatedAt = createdAt
        };
        foreach (var log in logs)
        {
            log.IncidentId = incident.Id;
            incident.Logs.Add(log);
        }
        return incident;
    }

    private static IncidentLog Log(string level, DateTime occurredAt, string message) =>
        new() { Level = level, Message = message, OccurredAt = occurredAt, CreatedAt = occurredAt };
}
