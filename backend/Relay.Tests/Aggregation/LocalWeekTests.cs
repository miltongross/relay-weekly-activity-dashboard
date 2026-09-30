using Relay.Api.Aggregation;
using Xunit;

namespace Relay.Tests.Aggregation;

public class LocalWeekTests
{
    [Theory]
    [InlineData(2026, 6, 1, 2026, 6, 1)]  // Monday stays Monday
    [InlineData(2026, 6, 3, 2026, 6, 1)]  // mid-week rolls back
    [InlineData(2026, 6, 7, 2026, 6, 1)]  // Sunday rolls back to same week's Monday
    [InlineData(2026, 6, 8, 2026, 6, 8)]  // next Monday starts a new week
    public void StartOfWeek_ReturnsThatDatesLocalMonday(int y, int m, int d, int expY, int expM, int expD)
    {
        var result = LocalWeek.StartOfWeek(new DateOnly(y, m, d));
        Assert.Equal(new DateOnly(expY, expM, expD), result);
    }

    [Fact]
    public void ToUtc_AcrossSpringForwardDst_UsesCorrectPreAndPostTransitionOffsets()
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById("America/Chicago");

        // 2026-03-08 02:00 local (CST, UTC-6) jumps to 03:00 CDT (UTC-5).
        var weekBeforeTransition = LocalWeek.ToUtc(new DateOnly(2026, 3, 2), tz);
        var weekAfterTransition = LocalWeek.ToUtc(new DateOnly(2026, 3, 9), tz);

        Assert.Equal(new DateTime(2026, 3, 2, 6, 0, 0, DateTimeKind.Utc), weekBeforeTransition);
        Assert.Equal(new DateTime(2026, 3, 9, 5, 0, 0, DateTimeKind.Utc), weekAfterTransition);
    }

    [Fact]
    public void NormalizeUtc_MarksUnspecifiedDatabaseValueAsUtc()
    {
        var stored = new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Unspecified);

        var normalized = LocalWeek.NormalizeUtc(stored);

        Assert.Equal(DateTimeKind.Utc, normalized.Kind);
        Assert.Equal(stored.Ticks, normalized.Ticks);
    }

    [Fact]
    public void ToLocalDate_ConvertsUtcInstantIntoAccountLocalCalendarDate()
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById("America/Chicago");
        var utc = new DateTime(2026, 3, 9, 4, 59, 0, DateTimeKind.Unspecified);

        var localDate = LocalWeek.ToLocalDate(utc, tz);

        Assert.Equal(new DateOnly(2026, 3, 8), localDate);
    }

    [Fact]
    public void EarliestSelectableWeekStart_MidWeekFirstEvent_SkipsThePartialWeek()
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById("UTC");
        // First event Sunday 2026-02-01: the Monday-containing week (2026-01-26) is partial.
        var earliestLocalDate = new DateOnly(2026, 2, 1);
        var earliestUtc = new DateTime(2026, 2, 1, 12, 0, 0, DateTimeKind.Utc);

        var result = LocalWeek.EarliestSelectableWeekStart(earliestLocalDate, earliestUtc, tz);

        Assert.Equal(new DateOnly(2026, 2, 2), result);
    }

    [Fact]
    public void EarliestSelectableWeekStart_ExactMondayMidnightEvent_KeepsThatMondaySelectable()
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById("UTC");
        var earliestLocalDate = new DateOnly(2026, 2, 2);
        var earliestUtc = new DateTime(2026, 2, 2, 0, 0, 0, DateTimeKind.Utc);

        var result = LocalWeek.EarliestSelectableWeekStart(earliestLocalDate, earliestUtc, tz);

        Assert.Equal(new DateOnly(2026, 2, 2), result);
    }
}
