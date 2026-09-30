namespace Relay.Api.Aggregation;

public static class EventTypeCatalog
{
    public static readonly IReadOnlyList<string> AllowedMetrics = new[] { "call_received", "lead_created", "appointment_set" };

    public static bool TryNormalize(string? input, out string normalized)
    {
        normalized = string.Empty;
        if (string.IsNullOrWhiteSpace(input))
        {
            return false;
        }

        foreach (var candidate in AllowedMetrics)
        {
            if (string.Equals(candidate, input, StringComparison.OrdinalIgnoreCase))
            {
                normalized = candidate;
                return true;
            }
        }

        return false;
    }
}
