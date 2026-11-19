# Project Status

Working demo on top of the original scaffold.

Implemented and verified locally:

- Repository structure, API scaffold, incident entity model, EF Core context, incident endpoints, Docker Compose, Cloud Run Dockerfile, documentation, and GitHub Actions build workflow.
- Zero-config demo mode: SQLite database auto-created and seeded with eight synthetic incidents spanning twelve days (no Docker/PostgreSQL needed for a demo run). Database timestamps are normalized to UTC so API responses serialize correctly for any client timezone.
- Deterministic simulated analysis engine: pattern-matches incident logs into evidence-linked hypotheses with heuristic confidence, plus human-executed suggested actions. Clearly labeled "simulated"; no external AI is called. Evidence excerpts are redacted (emails, IPs, keys/tokens/passwords) before leaving the service.
- Multi-screen React app wired to the API: operations overview dashboard (metrics, 14-day activity chart, severity/status breakdowns, needs-attention list), incidents browser with search/severity/status filters and sorting, incident detail with log-level filtering and one-click analysis, AI investigation history (every analysis run saved in the visitor's browser, expandable to full results), and settings (workspace name, landing page, table density, alert threshold, auto-run analysis) persisted locally. Working search palette (Ctrl/Cmd+K), recent-activity bell, and mobile bottom navigation. Falls back to a fully in-browser demo mode (same simulated engine) when the API is unreachable, with an explicit banner.
- Incident detail responses include ordered log records.
- Hosted read-only demo: in SQLite demo mode the API rejects all writes except simulated analysis of seeded incidents (403), so the public deployment cannot ingest or store visitor data. Hosted on Render's free tier (single Docker service serving API + frontend at one URL), auto-deploy off.

Not yet implemented/verified:

- Gemini provider integration (adapter still a safe placeholder).
- EF Core migrations (SQLite demo uses EnsureCreated; PostgreSQL deployments need real migrations).
- Authentication, authorization, workspace/tenant isolation, audit logs, retention controls.
- Analysis persistence (AnalysisRun/Evidence tables from docs/ARCHITECTURE.md). Demo investigation history is stored per visitor in the browser instead.
- Automated tests, production deployment.
- Known NuGet vulnerability warnings on transitive packages (Microsoft.OpenApi via Swashbuckle, SQLitePCLRaw, System.Security.Cryptography.Pkcs) to be addressed before production.
