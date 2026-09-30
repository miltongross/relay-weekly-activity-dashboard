namespace Relay.Api.Contracts;

public sealed record MetricSummary(
    int ActualCount,
    double? BaselineAverage,
    double? SignedDifference,
    double? PercentDifference,
    MetricLabel Label);
