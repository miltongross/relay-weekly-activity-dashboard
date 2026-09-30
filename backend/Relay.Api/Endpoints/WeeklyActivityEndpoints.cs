using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Relay.Api.Contracts;
using Relay.Api.Services;

namespace Relay.Api.Endpoints;

public static class WeeklyActivityEndpoints
{
    public static IEndpointRouteBuilder MapWeeklyActivityEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/accounts/1/weekly-activity", HandleAsync)
            .WithName("GetWeeklyActivity")
            .WithSummary("Weekly account and location activity compared against the four-week baseline.")
            .WithDescription("Read-only aggregation for the single trusted account (id 1). Requires a metric and returns " +
                "the selected completed local week's actual count, four-week baseline average, signed and percent " +
                "difference, and a below/above/typical label for the account and every observed location.")
            .WithTags("WeeklyActivity")
            .Produces<WeeklyActivityResponse>(StatusCodes.Status200OK)
            .ProducesValidationProblem(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return app;
    }

    private static async Task<IResult> HandleAsync(
        string? metric,
        string? week,
        IWeeklyActivityService service,
        CancellationToken cancellationToken)
    {
        DateOnly? weekStart = null;
        if (!string.IsNullOrWhiteSpace(week))
        {
            if (!DateOnly.TryParseExact(week, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedWeek))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["week"] = new[] { "week must be a valid date in yyyy-MM-dd format." }
                });
            }

            weekStart = parsedWeek;
        }

        var result = await service.GetWeeklyActivityAsync(new WeeklyActivityQuery(metric, weekStart), cancellationToken);

        if (result.Error is { } error)
        {
            if (error.Kind == WeeklyActivityErrorKind.AccountNotFound)
            {
                return Results.Problem(error.Message, statusCode: StatusCodes.Status404NotFound);
            }

            var field = error.Kind == WeeklyActivityErrorKind.InvalidMetric ? "metric" : "week";
            return Results.ValidationProblem(new Dictionary<string, string[]> { [field] = new[] { error.Message } });
        }

        return Results.Ok(result.Response);
    }
}
