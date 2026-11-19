# Contributing to RootBeacon

Thanks for your interest in contributing.

## Development workflow

1. Create a feature branch from `main`.
2. Keep changes focused and small.
3. Add or update tests when adding behavior.
4. Run backend and frontend build checks.
5. Open a pull request with context, screenshots (for UI changes), and test results.

## Local checks

Backend:

```bash
cd backend/OpsPulse.Api
dotnet restore
dotnet build
```

Frontend:

```bash
cd frontend/opspulse-web
npm ci
npm run build
```

## Engineering guidelines

- Keep controllers thin; place business logic in services.
- Use DTOs rather than exposing persistence entities directly.
- Validate all user-supplied input.
- Treat uploaded logs as untrusted data.
- Never commit credentials or production data.
- AI-generated hypotheses must be traceable to supplied evidence.
- Do not implement automatic production remediation.
