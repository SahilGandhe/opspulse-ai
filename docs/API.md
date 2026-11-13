# API Reference (initial scaffold)

Base URL in local launch profile: `http://localhost:5000`

## Health

`GET /api/health`

Returns service status and UTC timestamp.

## Incidents

`GET /api/incidents`

Returns up to 100 most recently created incidents.

`POST /api/incidents`

```json
{
  "title": "Payment API returning HTTP 500",
  "description": "Payment requests are failing intermittently.",
  "serviceName": "payment-api",
  "severity": "Critical"
}
```

`GET /api/incidents/{id}`

Returns incident metadata.

`POST /api/incidents/{id}/logs`

```json
{
  "message": "SQL connection pool exhausted",
  "level": "ERROR",
  "occurredAt": "2026-11-13T10:30:00Z"
}
```

`PATCH /api/incidents/{id}/status`

```json
{
  "status": "Investigating"
}
```

`POST /api/incidents/{id}/analyze`

Currently returns a provider configuration/implementation status. It does not claim to perform a Gemini analysis yet.

## Notes

- Database-backed endpoints require a valid PostgreSQL connection string and an applied EF Core migration.
- Enum values are serialized as numeric values by default unless JSON enum string conversion is configured. Use the numeric enum values in requests for this scaffold, or add `JsonStringEnumConverter` before using string values.
- Authentication, authorization, pagination, and workspace scoping are not implemented yet.
