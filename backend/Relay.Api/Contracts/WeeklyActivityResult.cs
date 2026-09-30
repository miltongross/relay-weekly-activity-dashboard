namespace Relay.Api.Contracts;

public sealed class WeeklyActivityResult
{
    public WeeklyActivityResponse? Response { get; private init; }
    public WeeklyActivityError? Error { get; private init; }

    public static WeeklyActivityResult Success(WeeklyActivityResponse response) => new() { Response = response };

    public static WeeklyActivityResult Failure(WeeklyActivityErrorKind kind, string message) =>
        new() { Error = new WeeklyActivityError(kind, message) };
}
