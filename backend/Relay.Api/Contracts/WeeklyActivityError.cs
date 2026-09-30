namespace Relay.Api.Contracts;

public enum WeeklyActivityErrorKind
{
    InvalidMetric,
    InvalidWeek,
    WeekOutOfRange,
    AccountNotFound
}

public sealed record WeeklyActivityError(WeeklyActivityErrorKind Kind, string Message);
