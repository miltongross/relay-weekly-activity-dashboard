import { NgClass, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { WeeklyActivityResponse } from '../../core/models/weekly-activity.model';
import { METRIC_DISPLAY_NAMES, metricLabelClass, metricLabelText } from '../../core/utils/metric-labels';
import { formatIsoDateLong, formatWeekRange } from '../../core/utils/week-range';
import { formatSignedNumber } from '../../core/utils/number-format';

@Component({
  selector: 'app-dashboard-summary',
  imports: [NgClass, DecimalPipe],
  templateUrl: './dashboard-summary.component.html',
  styleUrl: './dashboard-summary.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSummaryComponent {
  readonly response = input.required<WeeklyActivityResponse>();

  readonly metricDisplayName = computed(() => METRIC_DISPLAY_NAMES[this.response().metric]);
  readonly weekRangeLabel = computed(() => formatWeekRange(this.response().weekStart, this.response().weekEnd));
  readonly latestEventLabel = computed(() => formatIsoDateLong(this.response().coverage.latestEventDate));
  readonly labelText = computed(() => metricLabelText(this.response().account.label));
  readonly labelClass = computed(() => metricLabelClass(this.response().account.label));

  readonly showBaseline = computed(() => this.response().account.baselineAverage !== null);
  readonly showPercent = computed(() => this.response().account.percentDifference !== null);
  readonly showSignedDifference = computed(() => this.response().account.signedDifference !== null);

  readonly signedDifferenceLabel = computed(() => {
    const value = this.response().account.signedDifference;
    return value === null ? '' : formatSignedNumber(value);
  });

  readonly percentDifferenceLabel = computed(() => {
    const value = this.response().account.percentDifference;
    return value === null ? '' : formatSignedNumber(value);
  });
}
