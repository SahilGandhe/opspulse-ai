# Architecture

## Current direction

RootBeacon starts as a modular monolith. This keeps deployment and operations manageable while the product and customer needs are still being validated.

## Components

- **React client:** incident dashboard and investigation experience.
- **ASP.NET Core API:** validation, application workflows, and API boundary.
- **PostgreSQL:** incidents, original logs, analysis runs, and evidence.
- **Gemini adapter:** isolated AI provider integration; not yet implemented in this scaffold.
- **Google Cloud:** Cloud Run for the API, Cloud SQL for PostgreSQL, Secret Manager for credentials, and Cloud Logging for telemetry.

## Key design rules

1. Original log input is immutable after ingestion, except for controlled retention/deletion workflows.
2. AI analyses are versioned records and may be regenerated.
3. Root-cause hypotheses must reference real log records.
4. AI output is untrusted input and must be schema-validated.
5. Remediation remains human-approved.
6. Workspace isolation must be implemented before onboarding multiple customers.

## Future processing flow

1. Receive incident and log input.
2. Validate file size, content type, and payload size.
3. Redact likely secrets and sensitive values.
4. Normalize log records and assign stable evidence IDs.
5. Send bounded context to Gemini through a backend adapter.
6. Validate structured output and evidence references.
7. Persist analysis, model metadata, and evidence links.
8. Present findings with uncertainty and verification steps.
