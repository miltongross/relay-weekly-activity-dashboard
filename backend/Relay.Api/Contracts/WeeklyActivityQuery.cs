namespace Relay.Api.Contracts;

public sealed record WeeklyActivityQuery(string? Metric, DateOnly? WeekStart);
