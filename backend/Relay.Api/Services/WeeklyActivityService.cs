using Microsoft.EntityFrameworkCore;
using Relay.Api.Aggregation;
using Relay.Api.Contracts;
using Relay.Api.Data;

namespace Relay.Api.Services;

public sealed class WeeklyActivityService : IWeeklyActivityService
{
    // Task 2 scope is the single trusted account; no caller-supplied account id ever reaches this service.
    public const int TrustedAccountId = 1;

    private readonly RelayDbContext _db;

    public WeeklyActivityService(RelayDbContext db)
    {
        _db = db;
    }

    public async Task<WeeklyActivityResult> GetWeeklyActivityAsync(WeeklyActivityQuery query, CancellationToken cancellationToken)
    {
        if (!EventTypeCatalog.TryNormalize(query.Metric, out var metric))
        {
            return WeeklyActivityResult.Failure(
                WeeklyActivityErrorKind.InvalidMetric,
                $"metric must be one of: {string.Join(", ", EventTypeCatalog.AllowedMetrics)}.");
        }

        var account = await _db.Accounts.AsNoTracking()
            .Where(a => a.Id == TrustedAccountId)
            .Select(a => new { a.Timezone })
            .SingleOrDefaultAsync(cancellationToken);

        if (account is null)
        {
            return WeeklyActivityResult.Failure(WeeklyActivityErrorKind.AccountNotFound, $"Account {TrustedAccountId} was not found.");
        }

        var timeZone = TimeZoneInfo.FindSystemTimeZoneById(account.Timezone);

        var bounds = await _db.ActivityEvents.AsNoTracking()
            .Where(e => e.AccountId == TrustedAccountId)
            .GroupBy(e => 1)
            .Select(g => new { Earliest = g.Min(e => e.OccurredAt), Latest = g.Max(e => e.OccurredAt) })
            .SingleOrDefaultAsync(cancellationToken);

        if (bounds is null)
        {
            return WeeklyActivityResult.Failure(
                WeeklyActivityErrorKind.AccountNotFound,
                $"No activity events are available for account {TrustedAccountId}.");
        }

        var earliestUtc = LocalWeek.NormalizeUtc(bounds.Earliest);
        var latestUtc = LocalWeek.NormalizeUtc(bounds.Latest);

        var earliestLocalDate = LocalWeek.ToLocalDate(earliestUtc, timeZone);
        var latestLocalDate = LocalWeek.ToLocalDate(latestUtc, timeZone);

        var earliestSelectableWeekStart = LocalWeek.EarliestSelectableWeekStart(earliestLocalDate, earliestUtc, timeZone);
        var latestSelectableWeekStart = LocalWeek.StartOfWeek(latestLocalDate).AddDays(-7);

        var weekStart = query.WeekStart ?? latestSelectableWeekStart;

        if (weekStart.DayOfWeek != DayOfWeek.Monday)
        {
            return WeeklyActivityResult.Failure(WeeklyActivityErrorKind.InvalidWeek, "week must be a Monday date (yyyy-MM-dd).");
        }

        if (weekStart < earliestSelectableWeekStart || weekStart > latestSelectableWeekStart)
        {
            return WeeklyActivityResult.Failure(
                WeeklyActivityErrorKind.WeekOutOfRange,
                $"week must be a completed week between {earliestSelectableWeekStart:yyyy-MM-dd} and {latestSelectableWeekStart:yyyy-MM-dd}.");
        }

        var weekEnd = weekStart.AddDays(7);
        var weekStartUtc = LocalWeek.ToUtc(weekStart, timeZone);
        var weekEndUtc = LocalWeek.ToUtc(weekEnd, timeZone);

        var baselineBoundsUtc = Enumerable.Range(1, 4)
            .Select(i => weekStart.AddDays(-7 * i))
            .Select(start => (Start: LocalWeek.ToUtc(start, timeZone), End: LocalWeek.ToUtc(start.AddDays(7), timeZone)))
            .ToArray();

        var insufficientHistory = baselineBoundsUtc.Any(b => b.Start < earliestUtc || b.End > latestUtc);

        var windowStartUtc = baselineBoundsUtc[^1].Start;
        var (b1Start, b1End) = baselineBoundsUtc[0];
        var (b2Start, b2End) = baselineBoundsUtc[1];
        var (b3Start, b3End) = baselineBoundsUtc[2];
        var (b4Start, b4End) = baselineBoundsUtc[3];

        var grouped = await _db.ActivityEvents.AsNoTracking()
            .Where(e => e.AccountId == TrustedAccountId
                && e.EventType == metric
                && e.OccurredAt >= windowStartUtc
                && e.OccurredAt < weekEndUtc)
            .GroupBy(e => e.Location)
            .Select(g => new
            {
                Location = g.Key,
                Selected = g.Sum(e => e.OccurredAt >= weekStartUtc && e.OccurredAt < weekEndUtc ? 1 : 0),
                Week1 = g.Sum(e => e.OccurredAt >= b1Start && e.OccurredAt < b1End ? 1 : 0),
                Week2 = g.Sum(e => e.OccurredAt >= b2Start && e.OccurredAt < b2End ? 1 : 0),
                Week3 = g.Sum(e => e.OccurredAt >= b3Start && e.OccurredAt < b3End ? 1 : 0),
                Week4 = g.Sum(e => e.OccurredAt >= b4Start && e.OccurredAt < b4End ? 1 : 0),
            })
            .ToListAsync(cancellationToken);

        // All locations ever observed for the account, so quiet sites with no activity in this window still appear.
        var allLocations = await _db.ActivityEvents.AsNoTracking()
            .Where(e => e.AccountId == TrustedAccountId)
            .Select(e => e.Location)
            .Distinct()
            .ToListAsync(cancellationToken);

        var countsByLocation = grouped.ToDictionary(g => g.Location);

        var accountSelected = 0;
        var accountWeek1 = 0;
        var accountWeek2 = 0;
        var accountWeek3 = 0;
        var accountWeek4 = 0;

        var locationSummaries = new List<LocationMetricSummary>(allLocations.Count);

        foreach (var location in allLocations)
        {
            countsByLocation.TryGetValue(location, out var counts);
            var selected = counts?.Selected ?? 0;
            var week1 = counts?.Week1 ?? 0;
            var week2 = counts?.Week2 ?? 0;
            var week3 = counts?.Week3 ?? 0;
            var week4 = counts?.Week4 ?? 0;

            accountSelected += selected;
            accountWeek1 += week1;
            accountWeek2 += week2;
            accountWeek3 += week3;
            accountWeek4 += week4;

            var summary = MetricComparisonCalculator.Compute(selected, insufficientHistory, week1, week2, week3, week4);
            locationSummaries.Add(new LocationMetricSummary(location, summary));
        }

        var accountSummary = MetricComparisonCalculator.Compute(
            accountSelected, insufficientHistory, accountWeek1, accountWeek2, accountWeek3, accountWeek4);

        // Below-typical first by largest shortfall, then a stable name tie-break; baseline-unavailable rows fall out last
        // because they can never carry the BelowTypical label. Sorted in-process since collation may differ per environment.
        var orderedLocations = locationSummaries
            .OrderBy(l => l.Summary.Label == MetricLabel.BelowTypical ? 0 : 1)
            .ThenByDescending(l => l.Summary.Label == MetricLabel.BelowTypical ? -(l.Summary.SignedDifference ?? 0) : double.MinValue)
            .ThenBy(l => l.Location, StringComparer.Ordinal)
            .ToList();

        var response = new WeeklyActivityResponse(
            TrustedAccountId,
            metric,
            weekStart,
            weekEnd,
            account.Timezone,
            new DatasetCoverage(earliestLocalDate, latestLocalDate, earliestSelectableWeekStart, latestSelectableWeekStart),
            accountSummary,
            orderedLocations);

        return WeeklyActivityResult.Success(response);
    }
}
