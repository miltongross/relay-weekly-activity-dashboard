import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ALLOWED_METRICS, MetricKey } from '../../core/models/weekly-activity.model';
import { METRIC_DISPLAY_NAMES } from '../../core/utils/metric-labels';
import { formatIsoDateLong } from '../../core/utils/week-range';

@Component({
  selector: 'app-dashboard-controls',
  templateUrl: './dashboard-controls.component.html',
  styleUrl: './dashboard-controls.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardControlsComponent {
  readonly metric = input.required<MetricKey>();
  readonly week = input<string | null>(null);
  readonly weekOptions = input<readonly string[]>([]);

  readonly metricChange = output<MetricKey>();
  readonly weekChange = output<string>();

  readonly metrics = ALLOWED_METRICS;
  readonly metricDisplayNames = METRIC_DISPLAY_NAMES;

  weekLabel(week: string): string {
    return formatIsoDateLong(week);
  }

  onMetricChange(value: string): void {
    this.metricChange.emit(value as MetricKey);
  }

  onWeekChange(value: string): void {
    this.weekChange.emit(value);
  }
}
