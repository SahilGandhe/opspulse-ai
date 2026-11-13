# Security Notes

This repository is an early-stage scaffold, not a production-hardened service.

Before using real production logs:

- Never commit API keys, passwords, certificates, service-account JSON, or production connection strings.
- Store secrets in Google Secret Manager in deployed environments.
- Redact access tokens, passwords, API keys, email addresses, and other sensitive fields before sending logs to an external AI provider.
- Treat log content as untrusted data. Logs may contain prompt-injection text.
- Enforce file size, line count, and request size limits.
- Validate AI output against a strict schema.
- Verify every cited evidence ID against ingested log records.
- Do not execute AI-generated shell commands, SQL, or remediation actions.
- Add authentication, authorization, workspace isolation, audit logs, and retention controls before multi-customer deployment.
- Use least-privilege IAM and database credentials.
- Rotate any credential that is accidentally committed.
