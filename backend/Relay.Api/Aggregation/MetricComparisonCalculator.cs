using Relay.Api.Contracts;

namespace Relay.Api.Aggregation;

// Turns raw weekly counts into the actual/baseline/diff/percent/label contract; pure and DB-free for focused unit tests.
public static class MetricComparisonCalculator
{
    public const int MinimumAbsoluteDifference = 3;
    public const double PercentThreshold = 25.0;

    public static MetricSummary Compute(
        int actualCount,
        bool insufficientHistory,
        int baselineWeek1,
        int baselineWeek2,
        int baselineWeek3,
        int baselineWeek4)
    {
        if (insufficientHistory)
        {
            return new MetricSummary(actualCount, null, null, null, MetricLabel.InsufficientHistory);
        }

        var baselineAverage = (baselineWeek1 + baselineWeek2 + baselineWeek3 + baselineWeek4) / 4.0;

        if (baselineAverage == 0)
        {
            var zeroBaselineDiff = actualCount - baselineAverage;
            return new MetricSummary(actualCount, 0.0, Math.Round(zeroBaselineDiff, 1), null, MetricLabel.NoPriorActivity);
        }

        var diff = actualCount - baselineAverage;
        var percent = diff / baselineAverage * 100.0;
        var isSignificant = Math.Abs(diff) >= MinimumAbsoluteDifference && Math.Abs(percent) > PercentThreshold;
        var label = isSignificant
            ? (diff < 0 ? MetricLabel.BelowTypical : MetricLabel.AboveTypical)
            : MetricLabel.Typical;

        return new MetricSummary(
            actualCount,
            Math.Round(baselineAverage, 1),
            Math.Round(diff, 1),
            Math.Round(percent, 1),
            label);
    }
}
