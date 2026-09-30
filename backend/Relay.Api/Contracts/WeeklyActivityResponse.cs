namespace Relay.Api.Contracts;

public sealed record WeeklyActivityResponse(
    int AccountId,
    string Metric,
    DateOnly WeekStart,
    DateOnly WeekEnd,
    string Timezone,
    DatasetCoverage Coverage,
    MetricSummary Account,
    IReadOnlyList<LocationMetricSummary> Locations);
