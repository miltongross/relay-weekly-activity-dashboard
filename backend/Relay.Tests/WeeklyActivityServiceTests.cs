using Microsoft.EntityFrameworkCore;
using Relay.Api.Contracts;
using Relay.Api.Models;
using Relay.Api.Services;
using Relay.Tests.Fixtures;
using Xunit;

namespace Relay.Tests;

// Uses its own ephemeral LocalDB instance (not the shared migration-test collection) so each test can
// reset and seed isolated rows for account id 1, the trusted account the service always queries.
public class WeeklyActivityServiceTests : IClassFixture<LocalDbFixture>, IAsyncLifetime
{
    private readonly LocalDbFixture _fixture;

    public WeeklyActivityServiceTests(LocalDbFixture fixture)
    {
        _fixture = fixture;
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        await using var context = _fixture.CreateContext();
        context.ActivityEvents.RemoveRange(await context.ActivityEvents.ToListAsync());
        context.Accounts.RemoveRange(await context.Accounts.ToListAsync());
        await context.SaveChangesAsync();
    }

    private async Task SeedAsync(string timezone, IEnumerable<ActivityEvent> events)
    {
        await using var context = _fixture.CreateContext();
        context.Accounts.Add(new Account
        {
            Id = WeeklyActivityService.TrustedAccountId,
            Name = "Fixture Account",
            Industry = "Testing",
            Timezone = timezone,
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });
        context.ActivityEvents.AddRange(events);
        await context.SaveChangesAsync();
    }

    private static ActivityEvent Ev(int id, string location, string type, DateTime occurredAtUtc) => new()
    {
        Id = id,
        AccountId = WeeklyActivityService.TrustedAccountId,
        Location = location,
        EventType = type,
        OccurredAt = occurredAtUtc
    };

    [Fact]
    public async Task GetWeeklyActivity_SeededAggregate_ComputesAccountAndLocationBreakdownAndSorting()
    {
        var events = new List<ActivityEvent>
        {
            // Coverage anchors: earliest 2026-04-01, latest 2026-07-01, on a quiet location for this metric.
            Ev(1, "Anchor", "lead_created", new DateTime(2026, 4, 1, 12, 0, 0)),
            Ev(2, "Anchor", "lead_created", new DateTime(2026, 7, 1, 12, 0, 0)),
        };

        int id = 100;
        void AddWeek(string location, DateOnly weekStart, int count)
        {
            for (var i = 0; i < count; i++)
            {
                events.Add(Ev(id++, location, "call_received", weekStart.ToDateTime(new TimeOnly(9, 0)).AddHours(i)));
            }
        }

        // Downtown: baseline avg 5.0, selected 2 -> diff -3, -60% -> BelowTypical.
        AddWeek("Downtown", new DateOnly(2026, 5, 4), 4);
        AddWeek("Downtown", new DateOnly(2026, 5, 11), 6);
        AddWeek("Downtown", new DateOnly(2026, 5, 18), 5);
        AddWeek("Downtown", new DateOnly(2026, 5, 25), 5);
        AddWeek("Downtown", new DateOnly(2026, 6, 1), 2);

        // Midtown: baseline avg 10.0, selected 2 -> diff -8, -80% -> BelowTypical, larger shortfall than Downtown.
        AddWeek("Midtown", new DateOnly(2026, 5, 4), 10);
        AddWeek("Midtown", new DateOnly(2026, 5, 11), 10);
        AddWeek("Midtown", new DateOnly(2026, 5, 18), 10);
        AddWeek("Midtown", new DateOnly(2026, 5, 25), 10);
        AddWeek("Midtown", new DateOnly(2026, 6, 1), 2);

        await SeedAsync("UTC", events);

        await using var context = _fixture.CreateContext();
        var service = new WeeklyActivityService(context);

        var result = await service.GetWeeklyActivityAsync(
            new WeeklyActivityQuery("call_received", new DateOnly(2026, 6, 1)), CancellationToken.None);

        Assert.Null(result.Error);
        Assert.NotNull(result.Response);
        var response = result.Response!;

        Assert.Equal("UTC", response.Timezone);
        Assert.Equal(new DateOnly(2026, 4, 1), response.Coverage.EarliestEventDate);
        Assert.Equal(new DateOnly(2026, 7, 1), response.Coverage.LatestEventDate);

        Assert.Equal(4, response.Account.ActualCount);
        Assert.Equal(15.0, response.Account.BaselineAverage);
        Assert.Equal(-11.0, response.Account.SignedDifference);
        Assert.Equal(-73.3, response.Account.PercentDifference);
        Assert.Equal(MetricLabel.BelowTypical, response.Account.Label);

        Assert.Equal(3, response.Locations.Count);
        Assert.Equal(new[] { "Midtown", "Downtown", "Anchor" }, response.Locations.Select(l => l.Location));
        Assert.Equal(MetricLabel.BelowTypical, response.Locations[0].Summary.Label);
        Assert.Equal(MetricLabel.BelowTypical, response.Locations[1].Summary.Label);
        Assert.Equal(MetricLabel.NoPriorActivity, response.Locations[2].Summary.Label);
        Assert.Equal(0, response.Locations[2].Summary.ActualCount);
    }

    [Fact]
    public async Task GetWeeklyActivity_FewerThanFourCoveredPriorWeeks_ReturnsInsufficientHistory()
    {
        var events = new List<ActivityEvent>
        {
            // Earliest event lands inside baseline week 3, so week 3 and week 4 are not fully covered.
            Ev(1, "Downtown", "call_received", new DateTime(2026, 5, 20, 9, 0, 0)),
            Ev(2, "Downtown", "call_received", new DateTime(2026, 6, 2, 9, 0, 0)),
            Ev(3, "Downtown", "call_received", new DateTime(2026, 7, 1, 9, 0, 0)),
        };

        await SeedAsync("UTC", events);

        await using var context = _fixture.CreateContext();
        var service = new WeeklyActivityService(context);

        var result = await service.GetWeeklyActivityAsync(
            new WeeklyActivityQuery("call_received", new DateOnly(2026, 6, 1)), CancellationToken.None);

        Assert.Null(result.Error);
        var response = result.Response!;

        Assert.Equal(MetricLabel.InsufficientHistory, response.Account.Label);
        Assert.Null(response.Account.BaselineAverage);
        Assert.Null(response.Account.SignedDifference);
        Assert.Null(response.Account.PercentDifference);
        Assert.Equal(1, response.Account.ActualCount);
        Assert.All(response.Locations, l => Assert.Equal(MetricLabel.InsufficientHistory, l.Summary.Label));
    }

    [Fact]
    public async Task GetWeeklyActivity_EmptySelectedWeek_KeepsValidBaselineWithZeroActualCount()
    {
        var events = new List<ActivityEvent>
        {
            Ev(1, "Downtown", "call_received", new DateTime(2026, 4, 1, 9, 0, 0)),
            // No events at all in the selected week (2026-06-01 .. 2026-06-07).
            Ev(2, "Downtown", "call_received", new DateTime(2026, 7, 1, 9, 0, 0)),
        };

        int id = 100;
        foreach (var weekStart in new[] { new DateOnly(2026, 5, 4), new DateOnly(2026, 5, 11), new DateOnly(2026, 5, 18), new DateOnly(2026, 5, 25) })
        {
            for (var i = 0; i < 4; i++)
            {
                events.Add(Ev(id++, "Downtown", "call_received", weekStart.ToDateTime(new TimeOnly(9, 0)).AddHours(i)));
            }
        }

        await SeedAsync("UTC", events);

        await using var context = _fixture.CreateContext();
        var service = new WeeklyActivityService(context);

        var result = await service.GetWeeklyActivityAsync(
            new WeeklyActivityQuery("call_received", new DateOnly(2026, 6, 1)), CancellationToken.None);

        Assert.Null(result.Error);
        var response = result.Response!;

        Assert.Equal(0, response.Account.ActualCount);
        Assert.Equal(4.0, response.Account.BaselineAverage);
        Assert.Equal(-4.0, response.Account.SignedDifference);
        Assert.Equal(-100.0, response.Account.PercentDifference);
        Assert.Equal(MetricLabel.BelowTypical, response.Account.Label);
    }

    [Fact]
    public async Task GetWeeklyActivity_AccountTimezoneWithDstTransition_BucketsBoundaryEventsCorrectly()
    {
        var events = new List<ActivityEvent>
        {
            Ev(1, "Anchor", "lead_created", new DateTime(2026, 1, 15, 12, 0, 0)),
            Ev(2, "Anchor", "lead_created", new DateTime(2026, 4, 1, 12, 0, 0)),
            // 04:59Z is 2026-03-08 23:59 CDT: last instant of the week starting 2026-03-02.
            Ev(3, "Chicago Loop", "call_received", new DateTime(2026, 3, 9, 4, 59, 0)),
            // 05:00Z is 2026-03-09 00:00 CDT: first instant of the week starting 2026-03-09.
            Ev(4, "Chicago Loop", "call_received", new DateTime(2026, 3, 9, 5, 0, 0)),
        };

        await SeedAsync("America/Chicago", events);

        await using var context = _fixture.CreateContext();
        var service = new WeeklyActivityService(context);

        var result = await service.GetWeeklyActivityAsync(
            new WeeklyActivityQuery("call_received", new DateOnly(2026, 3, 9)), CancellationToken.None);

        Assert.Null(result.Error);
        var response = result.Response!;
        var chicagoLoop = response.Locations.Single(l => l.Location == "Chicago Loop");

        Assert.Equal(1, chicagoLoop.Summary.ActualCount);
        Assert.Equal(0.2, chicagoLoop.Summary.BaselineAverage);
    }

    [Theory]
    [InlineData("not_a_metric")]
    [InlineData(null)]
    public async Task GetWeeklyActivity_InvalidMetric_ReturnsInvalidMetricError(string? metric)
    {
        await using var context = _fixture.CreateContext();
        var service = new WeeklyActivityService(context);

        var result = await service.GetWeeklyActivityAsync(new WeeklyActivityQuery(metric, null), CancellationToken.None);

        Assert.NotNull(result.Error);
        Assert.Equal(WeeklyActivityErrorKind.InvalidMetric, result.Error!.Kind);
    }

    [Fact]
    public async Task GetWeeklyActivity_WeekNotAMonday_ReturnsInvalidWeekError()
    {
        await SeedAsync("UTC", new[] { Ev(1, "Downtown", "call_received", new DateTime(2026, 6, 2, 9, 0, 0)) });

        await using var context = _fixture.CreateContext();
        var service = new WeeklyActivityService(context);

        var result = await service.GetWeeklyActivityAsync(
            new WeeklyActivityQuery("call_received", new DateOnly(2026, 6, 2)), CancellationToken.None);

        Assert.NotNull(result.Error);
        Assert.Equal(WeeklyActivityErrorKind.InvalidWeek, result.Error!.Kind);
    }

    [Fact]
    public async Task GetWeeklyActivity_WeekOutsideCompletedRange_ReturnsWeekOutOfRangeError()
    {
        await SeedAsync("UTC", new[]
        {
            Ev(1, "Downtown", "call_received", new DateTime(2026, 5, 4, 9, 0, 0)),
            Ev(2, "Downtown", "call_received", new DateTime(2026, 6, 1, 9, 0, 0)),
        });

        await using var context = _fixture.CreateContext();
        var service = new WeeklyActivityService(context);

        // A week that has not yet completed relative to the latest observed event.
        var result = await service.GetWeeklyActivityAsync(
            new WeeklyActivityQuery("call_received", new DateOnly(2026, 6, 8)), CancellationToken.None);

        Assert.NotNull(result.Error);
        Assert.Equal(WeeklyActivityErrorKind.WeekOutOfRange, result.Error!.Kind);
    }

    [Fact]
    public async Task GetWeeklyActivity_MidWeekFirstEvent_RejectsThePartialFirstWeekAndAcceptsTheNextMonday()
    {
        // First event Sunday 2026-02-01: the Monday-containing week (2026-01-26) is only partially covered.
        await SeedAsync("UTC", new[]
        {
            Ev(1, "Downtown", "call_received", new DateTime(2026, 2, 1, 9, 0, 0)),
            Ev(2, "Downtown", "call_received", new DateTime(2026, 7, 1, 9, 0, 0)),
        });

        await using var context = _fixture.CreateContext();
        var service = new WeeklyActivityService(context);

        var invalidEarlyWeek = await service.GetWeeklyActivityAsync(
            new WeeklyActivityQuery("call_received", new DateOnly(2026, 1, 26)), CancellationToken.None);

        Assert.NotNull(invalidEarlyWeek.Error);
        Assert.Equal(WeeklyActivityErrorKind.WeekOutOfRange, invalidEarlyWeek.Error!.Kind);

        var earliestSelectableWeek = await service.GetWeeklyActivityAsync(
            new WeeklyActivityQuery("call_received", new DateOnly(2026, 2, 2)), CancellationToken.None);

        Assert.Null(earliestSelectableWeek.Error);
        Assert.Equal(new DateOnly(2026, 2, 2), earliestSelectableWeek.Response!.Coverage.EarliestSelectableWeekStart);
    }

    [Fact]
    public async Task GetWeeklyActivity_FirstEventAtExactMondayLocalMidnight_KeepsThatMondaySelectable()
    {
        await SeedAsync("UTC", new[]
        {
            Ev(1, "Downtown", "call_received", new DateTime(2026, 2, 2, 0, 0, 0)),
            Ev(2, "Downtown", "call_received", new DateTime(2026, 7, 1, 9, 0, 0)),
        });

        await using var context = _fixture.CreateContext();
        var service = new WeeklyActivityService(context);

        var result = await service.GetWeeklyActivityAsync(
            new WeeklyActivityQuery("call_received", new DateOnly(2026, 2, 2)), CancellationToken.None);

        Assert.Null(result.Error);
        Assert.Equal(new DateOnly(2026, 2, 2), result.Response!.Coverage.EarliestSelectableWeekStart);
        Assert.Equal(1, result.Response!.Account.ActualCount);
    }

    [Fact]
    public async Task GetWeeklyActivity_OmittedWeek_DefaultsToLatestCompletedWeek()
    {
        await SeedAsync("UTC", new[]
        {
            Ev(1, "Downtown", "call_received", new DateTime(2026, 2, 2, 9, 0, 0)),
            // Latest event lands mid-week on 2026-07-01 (Wednesday); the last completed week is 2026-06-22.
            Ev(2, "Downtown", "call_received", new DateTime(2026, 7, 1, 9, 0, 0)),
        });

        await using var context = _fixture.CreateContext();
        var service = new WeeklyActivityService(context);

        var result = await service.GetWeeklyActivityAsync(
            new WeeklyActivityQuery("call_received", null), CancellationToken.None);

        Assert.Null(result.Error);
        var response = result.Response!;
        Assert.Equal(new DateOnly(2026, 6, 22), response.WeekStart);
        Assert.Equal(new DateOnly(2026, 6, 22), response.Coverage.LatestSelectableWeekStart);
    }
}
