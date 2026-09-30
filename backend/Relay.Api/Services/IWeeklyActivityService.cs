using Relay.Api.Contracts;

namespace Relay.Api.Services;

public interface IWeeklyActivityService
{
    Task<WeeklyActivityResult> GetWeeklyActivityAsync(WeeklyActivityQuery query, CancellationToken cancellationToken);
}
