import { NgClass, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LocationMetricSummary } from '../../core/models/weekly-activity.model';
import { metricLabelClass, metricLabelText } from '../../core/utils/metric-labels';
import { formatSignedNumber } from '../../core/utils/number-format';

@Component({
  selector: 'app-dashboard-location-table',
  imports: [NgClass, DecimalPipe],
  templateUrl: './dashboard-location-table.component.html',
  styleUrl: './dashboard-location-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardLocationTableComponent {
  // Rendered in the order the backend returns it; the component never re-sorts or recomputes.
  readonly locations = input.required<readonly LocationMetricSummary[]>();

  labelText = metricLabelText;
  labelClass = metricLabelClass;

  signedDifferenceLabel(value: number | null): string {
    return value === null ? '\u2014' : formatSignedNumber(value);
  }

  percentDifferenceLabel(value: number | null): string {
    return value === null ? '\u2014' : `${formatSignedNumber(value)}%`;
  }
}
