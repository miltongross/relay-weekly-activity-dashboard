import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WeeklyActivityService } from './weekly-activity.service';
import { DEFAULT_METRIC, SelectionStorageService } from './selection-storage.service';
import {
  MetricKey,
  ProblemDetails,
  ValidationProblemDetails,
  WeeklyActivityResponse,
} from '../models/weekly-activity.model';
import { enumerateWeekStarts } from '../utils/week-range';

// Orchestrates fetching, persisted-selection recovery, and UI state for the weekly dashboard.
// Components read the signals below and call the selectMetric/selectWeek/retry methods.
@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly api = inject(WeeklyActivityService);
  private readonly storage = inject(SelectionStorageService);
  private readonly destroyRef = inject(DestroyRef);

  private requestSequence = 0;

  readonly metric = signal<MetricKey>(this.storage.loadMetric());
  readonly week = signal<string | null>(this.storage.loadWeek());
  readonly response = signal<WeeklyActivityResponse | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  // Tracks the most recently attempted request so retry() repeats the failed selection,
  // not whatever the displayed controls were rolled back to.
  private lastRequestedMetric: MetricKey = this.metric();
  private lastRequestedWeek: string | null = this.week();

  readonly weekOptions = computed(() => {
    const coverage = this.response()?.coverage;
    return coverage
      ? enumerateWeekStarts(coverage.earliestSelectableWeekStart, coverage.latestSelectableWeekStart)
      : [];
  });

  readonly hasNoLocations = computed(() => this.response()?.locations.length === 0);

  constructor() {
    this.load(this.metric(), this.week());
  }

  selectMetric(metric: MetricKey): void {
    if (metric === this.metric()) {
      return;
    }
    this.metric.set(metric);
    this.storage.saveMetric(metric);
    this.load(metric, this.week());
  }

  selectWeek(week: string): void {
    if (week === this.week()) {
      return;
    }
    this.week.set(week);
    this.storage.saveWeek(week);
    this.load(this.metric(), week);
  }

  retry(): void {
    this.load(this.lastRequestedMetric, this.lastRequestedWeek);
  }

  private load(metric: MetricKey, week: string | null, isFallbackRetry = false): void {
    const requestId = ++this.requestSequence;
    this.lastRequestedMetric = metric;
    this.lastRequestedWeek = week;
    this.loading.set(true);
    this.errorMessage.set(null);
    if (!isFallbackRetry) {
      this.notice.set(null);
    }

    this.api
      .getWeeklyActivity(metric, week)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (requestId !== this.requestSequence) {
            return;
          }
          this.loading.set(false);
          this.response.set(response);
          this.metric.set(response.metric);
          this.week.set(response.weekStart);
          this.storage.saveMetric(response.metric);
          this.storage.saveWeek(response.weekStart);
        },
        error: (err: unknown) => {
          if (requestId !== this.requestSequence) {
            return;
          }
          this.handleError(err, metric, week);
        },
      });
  }

  private handleError(err: unknown, metric: MetricKey, week: string | null): void {
    if (!(err instanceof HttpErrorResponse)) {
      this.loading.set(false);
      this.errorMessage.set('An unexpected error occurred while loading activity data.');
      this.rollBackToLastResponse();
      return;
    }

    if (err.status === 400) {
      const problem = err.error as ValidationProblemDetails | null;
      const invalidFields = problem?.errors ? Object.keys(problem.errors) : [];

      if (invalidFields.includes('week') && week !== null) {
        this.storage.clearWeek();
        this.notice.set('Your saved week was not available. Showing the latest completed week instead.');
        this.week.set(null);
        this.load(metric, null, true);
        return;
      }

      if (invalidFields.includes('metric') && metric !== DEFAULT_METRIC) {
        this.storage.saveMetric(DEFAULT_METRIC);
        this.notice.set('Your saved metric was not available. Showing calls received instead.');
        this.metric.set(DEFAULT_METRIC);
        this.load(DEFAULT_METRIC, week, true);
        return;
      }

      this.loading.set(false);
      this.errorMessage.set(this.describeValidationProblem(problem));
      this.rollBackToLastResponse();
      return;
    }

    if (err.status === 404) {
      this.loading.set(false);
      const problem = err.error as ProblemDetails | null;
      this.errorMessage.set(problem?.detail || problem?.title || 'The account was not found.');
      this.rollBackToLastResponse();
      return;
    }

    this.loading.set(false);
    this.errorMessage.set('Could not reach the activity service. Check your connection and try again.');
    this.rollBackToLastResponse();
  }

  // Restores displayed controls/storage to the last successfully shown response so the
  // selects, heading, and table never disagree with a failed attempted selection.
  // The failed attempt itself is preserved separately for retry() via lastRequestedMetric/Week.
  private rollBackToLastResponse(): void {
    const lastResponse = this.response();
    if (!lastResponse) {
      return;
    }
    this.metric.set(lastResponse.metric);
    this.week.set(lastResponse.weekStart);
    this.storage.saveMetric(lastResponse.metric);
    this.storage.saveWeek(lastResponse.weekStart);
  }


  private describeValidationProblem(problem: ValidationProblemDetails | null): string {
    if (!problem?.errors) {
      return 'The request was invalid.';
    }
    return Object.values(problem.errors).flat().join(' ');
  }
}
