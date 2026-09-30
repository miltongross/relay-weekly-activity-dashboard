using Relay.Api.Aggregation;
using Relay.Api.Contracts;
using Xunit;

namespace Relay.Tests.Aggregation;

public class MetricComparisonCalculatorTests
{
    [Fact]
    public void Compute_InsufficientHistory_ReturnsCountOnlyWithNoBaselineOrLabelDetail()
    {
        var summary = MetricComparisonCalculator.Compute(actualCount: 7, insufficientHistory: true, 1, 2, 3, 4);

        Assert.Equal(7, summary.ActualCount);
        Assert.Null(summary.BaselineAverage);
        Assert.Null(summary.SignedDifference);
        Assert.Null(summary.PercentDifference);
        Assert.Equal(MetricLabel.InsufficientHistory, summary.Label);
    }

    [Fact]
    public void Compute_ZeroBaselineAndZeroActual_ReturnsNoPriorActivityWithZeroDiff()
    {
        var summary = MetricComparisonCalculator.Compute(actualCount: 0, insufficientHistory: false, 0, 0, 0, 0);

        Assert.Equal(0.0, summary.BaselineAverage);
        Assert.Equal(0.0, summary.SignedDifference);
        Assert.Null(summary.PercentDifference);
        Assert.Equal(MetricLabel.NoPriorActivity, summary.Label);
    }

    [Fact]
    public void Compute_ZeroBaselineWithLargeActual_StaysNoPriorActivityNotAboveTypical()
    {
        var summary = MetricComparisonCalculator.Compute(actualCount: 10, insufficientHistory: false, 0, 0, 0, 0);

        Assert.Equal(10.0, summary.SignedDifference);
        Assert.Null(summary.PercentDifference);
        Assert.Equal(MetricLabel.NoPriorActivity, summary.Label);
    }

    [Fact]
    public void Compute_ExactlyAtThresholds_StaysTypicalBecausePercentMustBeStrictlyGreater()
    {
        // baseline avg 12, actual 9: diff -3 (>=3), percent exactly -25% (not > 25%).
        var summary = MetricComparisonCalculator.Compute(actualCount: 9, insufficientHistory: false, 12, 12, 12, 12);

        Assert.Equal(-3.0, summary.SignedDifference);
        Assert.Equal(-25.0, summary.PercentDifference);
        Assert.Equal(MetricLabel.Typical, summary.Label);
    }

    [Fact]
    public void Compute_JustOverBothThresholds_IsBelowTypical()
    {
        // baseline avg 11, actual 8: diff -3 (>=3), percent -27.27% (> 25%).
        var summary = MetricComparisonCalculator.Compute(actualCount: 8, insufficientHistory: false, 11, 11, 11, 11);

        Assert.Equal(MetricLabel.BelowTypical, summary.Label);
    }

    [Fact]
    public void Compute_LargePercentButUnderThreeCount_StaysTypical()
    {
        // baseline avg 4, actual 6: diff 2 (< 3) even though percent is 50%.
        var summary = MetricComparisonCalculator.Compute(actualCount: 6, insufficientHistory: false, 4, 4, 4, 4);

        Assert.Equal(MetricLabel.Typical, summary.Label);
    }

    [Fact]
    public void Compute_AboveTypical_WhenBothThresholdsExceeded()
    {
        // baseline avg 10, actual 16: diff 6 (>=3), percent 60% (> 25%).
        var summary = MetricComparisonCalculator.Compute(actualCount: 16, insufficientHistory: false, 10, 10, 10, 10);

        Assert.Equal(MetricLabel.AboveTypical, summary.Label);
    }
}
