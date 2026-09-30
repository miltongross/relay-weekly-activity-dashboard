import { Injectable } from '@angular/core';
import { ALLOWED_METRICS, MetricKey, isMetricKey } from '../models/weekly-activity.model';
import { isIsoDateFormat } from '../utils/week-range';

const METRIC_KEY = 'relay.dash247.metric';
const WEEK_KEY = 'relay.dash247.week';

export const DEFAULT_METRIC: MetricKey = ALLOWED_METRICS[0];

// Reads/writes persisted controls; every read is validated so a malformed or stale value
// can never reach the API as-is (invalid persisted selections fall back to the default).
@Injectable({ providedIn: 'root' })
export class SelectionStorageService {
  loadMetric(): MetricKey {
    const stored = this.readRaw(METRIC_KEY);
    return isMetricKey(stored) ? stored : DEFAULT_METRIC;
  }

  loadWeek(): string | null {
    const stored = this.readRaw(WEEK_KEY);
    return isIsoDateFormat(stored) ? stored : null;
  }

  saveMetric(metric: MetricKey): void {
    this.writeRaw(METRIC_KEY, metric);
  }

  saveWeek(week: string): void {
    this.writeRaw(WEEK_KEY, week);
  }

  clearWeek(): void {
    this.removeRaw(WEEK_KEY);
  }

  private readRaw(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private writeRaw(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Storage unavailable (private browsing, quota, etc.) - selection just won't persist.
    }
  }

  private removeRaw(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore: nothing to clear if storage is unavailable.
    }
  }
}
