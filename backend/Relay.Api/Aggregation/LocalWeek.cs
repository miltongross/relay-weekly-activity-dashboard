namespace Relay.Api.Aggregation;

// Pure local-week/date-time helpers; keeps the DST-sensitive timezone math testable without a database.
public static class LocalWeek
{
    public static DateOnly StartOfWeek(DateOnly date)
    {
        var daysSinceMonday = ((int)date.DayOfWeek + 6) % 7;
        return date.AddDays(-daysSinceMonday);
    }

    // The Monday-containing week of the earliest event can be a partial week (data starts mid-week).
    // Advance to the first Monday whose local-midnight UTC instant is not before the earliest event's
    // UTC instant, so a partial week is never offered as selectable. An event exactly at Monday local
    // midnight keeps that same Monday selectable.
    public static DateOnly EarliestSelectableWeekStart(DateOnly earliestLocalDate, DateTime earliestUtc, TimeZoneInfo timeZone)
    {
        var candidate = StartOfWeek(earliestLocalDate);
        while (ToUtc(candidate, timeZone) < earliestUtc)
        {
            candidate = candidate.AddDays(7);
        }

        return candidate;
    }

    public static DateTime ToUtc(DateOnly localDate, TimeZoneInfo timeZone)
    {
        var localMidnight = new DateTime(localDate.Year, localDate.Month, localDate.Day, 0, 0, 0, DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(localMidnight, timeZone);
    }

    // SQL Server datetime2 round-trips as DateTimeKind.Unspecified; every stored value is UTC.
    public static DateTime NormalizeUtc(DateTime storedValue) =>
        DateTime.SpecifyKind(storedValue, DateTimeKind.Utc);

    public static DateOnly ToLocalDate(DateTime utcValue, TimeZoneInfo timeZone) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(NormalizeUtc(utcValue), timeZone));
}
