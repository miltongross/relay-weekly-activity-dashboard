import { Component, inject } from '@angular/core';
import { DashboardStore } from './core/services/dashboard-store.service';
import { MetricKey } from './core/models/weekly-activity.model';
import { DashboardControlsComponent } from './features/dashboard/dashboard-controls.component';
import { DashboardSummaryComponent } from './features/dashboard/dashboard-summary.component';
import { DashboardLocationTableComponent } from './features/dashboard/dashboard-location-table.component';

@Component({
  selector: 'app-root',
  imports: [DashboardControlsComponent, DashboardSummaryComponent, DashboardLocationTableComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly store = inject(DashboardStore);

  protected onMetricChange(metric: MetricKey): void {
    this.store.selectMetric(metric);
  }

  protected onWeekChange(week: string): void {
    this.store.selectWeek(week);
  }

  protected onRetry(): void {
    this.store.retry();
  }
}
