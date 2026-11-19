using System.Text.RegularExpressions;

namespace OpsPulse.Api.Services;

/// <summary>
/// Deterministic, local redaction of likely sensitive values before log
/// content is shown in analysis output or sent to any AI provider.
/// This is a best-effort demo redactor, not a compliance guarantee.
/// </summary>
public interface IRedactionService
{
    string Redact(string input);
}

public sealed partial class RedactionService : IRedactionService
{
    public string Redact(string input)
    {
        if (string.IsNullOrEmpty(input)) return input;

        var result = input;
        result = SecretAssignmentRegex().Replace(result, "$1$2[redacted-secret]");
        result = BearerTokenRegex().Replace(result, "$1[redacted-token]");
        result = EmailRegex().Replace(result, "[redacted-email]");
        result = IPv4Regex().Replace(result, "[redacted-ip]");
        return result;
    }

    [GeneratedRegex(@"(?i)\b(password|passwd|pwd|api[_-]?key|apikey|secret|access[_-]?token|connectionstring)\b(\s*[=:]\s*)\S+")]
    private static partial Regex SecretAssignmentRegex();

    [GeneratedRegex(@"(?i)\b(bearer\s+)[A-Za-z0-9._\-]{8,}")]
    private static partial Regex BearerTokenRegex();

    [GeneratedRegex(@"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")]
    private static partial Regex EmailRegex();

    [GeneratedRegex(@"\b(?:\d{1,3}\.){3}\d{1,3}\b")]
    private static partial Regex IPv4Regex();
}
