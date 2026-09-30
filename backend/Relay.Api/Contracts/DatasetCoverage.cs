namespace Relay.Api.Contracts;

public sealed record DatasetCoverage(
    DateOnly EarliestEventDate,
    DateOnly LatestEventDate,
    DateOnly EarliestSelectableWeekStart,
    DateOnly LatestSelectableWeekStart);
