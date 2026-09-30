import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardStore } from './dashboard-store.service';
import { SelectionStorageService } from './selection-storage.service';
import { WeeklyActivityResponse } from '../models/weekly-activity.model';

describe('DashboardStore', () => {
  let httpMock: HttpTestingController;

  const successResponse = (
    overrides: Partial<WeeklyActivityResponse> = {},
  ): WeeklyActivityResponse => ({
    accountId: 1,
    metric: 'call_received',
    weekStart: '2026-07-06',
    weekEnd: '2026-07-13',
    timezone: 'America/Chicago',
    coverage: {
      earliestEventDate: '2026-02-01',
      latestEventDate: '2026-07-27',
      earliestSelectableWeekStart: '2026-03-02',
      latestSelectableWeekStart: '2026-07-20',
    },
    account: {
      actualCount: 10,
      baselineAverage: 8.5,
      signedDifference: 1.5,
      percentDifference: 17.6,
      label: 'Typical',
    },
    locations: [
      {
        location: 'Main Street',
        summary: {
          actualCount: 4,
          baselineAverage: 6,
          signedDifference: -2,
          percentDifference: -33.3,
          label: 'BelowTypical',
        },
      },
    ],
    ...overrides,
  });

  function expectRequest(matchWeek: string | undefined | null) {
    return httpMock.expectOne((r) => {
      if (r.url !== '/api/accounts/1/weekly-activity') {
        return false;
      }
      if (matchWeek === undefined) {
        return true;
      }
      return matchWeek === null ? !r.params.has('week') : r.params.get('week') === matchWeek;
    });
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('loads the default metric with no week param on first construction', () => {
    const store = TestBed.inject(DashboardStore);

    expect(store.loading()).toBeTrue();
    const req = expectRequest(null);
    expect(req.request.params.get('metric')).toBe('call_received');

    req.flush(successResponse());

    expect(store.loading()).toBeFalse();
    expect(store.errorMessage()).toBeNull();
    expect(store.response()?.account.actualCount).toBe(10);
  });

  it('restores a persisted metric selection across store recreation', () => {
    const storage = TestBed.inject(SelectionStorageService);
    storage.saveMetric('lead_created');

    const store = TestBed.inject(DashboardStore);
    const req = expectRequest(null);
    expect(req.request.params.get('metric')).toBe('lead_created');
    req.flush(successResponse({ metric: 'lead_created' }));

    expect(store.metric()).toBe('lead_created');
  });

  it('reloads and persists the selection when the metric changes', () => {
    const store = TestBed.inject(DashboardStore);
    expectRequest(null).flush(successResponse());

    store.selectMetric('appointment_set');

    const req = expectRequest(successResponse().weekStart);
    expect(req.request.params.get('metric')).toBe('appointment_set');
    req.flush(successResponse({ metric: 'appointment_set' }));

    expect(store.metric()).toBe('appointment_set');
    expect(TestBed.inject(SelectionStorageService).loadMetric()).toBe('appointment_set');
  });

  it('reloads and persists the selection when the week changes', () => {
    const store = TestBed.inject(DashboardStore);
    expectRequest(null).flush(successResponse());

    store.selectWeek('2026-06-01');

    const req = expectRequest('2026-06-01');
    req.flush(successResponse({ weekStart: '2026-06-01' }));

    expect(store.week()).toBe('2026-06-01');
    expect(TestBed.inject(SelectionStorageService).loadWeek()).toBe('2026-06-01');
  });

  it('falls back to the default week and shows a notice when a persisted week is rejected', () => {
    const storage = TestBed.inject(SelectionStorageService);
    storage.saveWeek('2026-01-05');

    const store = TestBed.inject(DashboardStore);
    const firstReq = expectRequest('2026-01-05');
    firstReq.flush(
      { errors: { week: ['The week is outside the available range.'] } },
      { status: 400, statusText: 'Bad Request' },
    );

    const retryReq = expectRequest(null);
    retryReq.flush(successResponse());

    expect(store.notice()).toContain('week');
    expect(store.errorMessage()).toBeNull();
    expect(storage.loadWeek()).toBe(successResponse().weekStart);
  });

  it('falls back to the default metric and shows a notice when a persisted metric is rejected', () => {
    const storage = TestBed.inject(SelectionStorageService);
    storage.saveMetric('lead_created');

    const store = TestBed.inject(DashboardStore);
    const firstReq = expectRequest(null);
    expect(firstReq.request.params.get('metric')).toBe('lead_created');
    firstReq.flush(
      { errors: { metric: ['The metric is not recognized.'] } },
      { status: 400, statusText: 'Bad Request' },
    );

    const retryReq = expectRequest(null);
    expect(retryReq.request.params.get('metric')).toBe('call_received');
    retryReq.flush(successResponse());

    expect(store.notice()).toContain('metric');
    expect(store.metric()).toBe('call_received');
  });

  it('shows a validation error message for a 400 that does not reference metric or week', () => {
    const store = TestBed.inject(DashboardStore);
    const req = expectRequest(null);
    req.flush(
      { errors: { accountId: ['Account is not recognized.'] } },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(store.loading()).toBeFalse();
    expect(store.errorMessage()).toContain('Account is not recognized.');
  });

  it('shows the problem detail for a 404 response', () => {
    const store = TestBed.inject(DashboardStore);
    const req = expectRequest(null);
    req.flush({ title: 'Not Found', detail: 'Account 1 was not found.' }, { status: 404, statusText: 'Not Found' });

    expect(store.loading()).toBeFalse();
    expect(store.errorMessage()).toBe('Account 1 was not found.');
  });

  it('shows a generic error message when the API cannot be reached', () => {
    const store = TestBed.inject(DashboardStore);
    const req = expectRequest(null);
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(store.loading()).toBeFalse();
    expect(store.errorMessage()).toBe('Could not reach the activity service. Check your connection and try again.');
  });

  it('retry() re-issues the request for the current metric and week', () => {
    const store = TestBed.inject(DashboardStore);
    expectRequest(null).flush(successResponse());

    store.selectWeek('2026-06-01');
    expectRequest('2026-06-01').flush(successResponse({ weekStart: '2026-06-01' }));

    store.retry();
    const req = expectRequest('2026-06-01');
    req.flush(successResponse({ weekStart: '2026-06-01' }));

    expect(store.errorMessage()).toBeNull();
  });

  it('reports an empty location list via hasNoLocations', () => {
    const store = TestBed.inject(DashboardStore);
    expectRequest(null).flush(successResponse({ locations: [] }));

    expect(store.hasNoLocations()).toBeTrue();
  });

  it('rolls back metric/week and storage to the last response when a metric change fails, and retry re-attempts the failed metric', () => {
    const storage = TestBed.inject(SelectionStorageService);
    const store = TestBed.inject(DashboardStore);
    expectRequest(null).flush(successResponse());

    store.selectMetric('lead_created');
    const failedReq = expectRequest(successResponse().weekStart);
    failedReq.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(store.metric()).toBe('call_received');
    expect(store.week()).toBe(successResponse().weekStart);
    expect(storage.loadMetric()).toBe('call_received');
    expect(store.response()?.metric).toBe('call_received');
    expect(store.errorMessage()).toBe(
      'Could not reach the activity service. Check your connection and try again.',
    );

    store.retry();
    const retryReq = expectRequest(successResponse().weekStart);
    expect(retryReq.request.params.get('metric')).toBe('lead_created');
    retryReq.flush(successResponse({ metric: 'lead_created' }));

    expect(store.metric()).toBe('lead_created');
    expect(store.errorMessage()).toBeNull();
  });

  it('rolls back metric/week and storage to the last response when a week change fails, and retry re-attempts the failed week', () => {
    const storage = TestBed.inject(SelectionStorageService);
    const store = TestBed.inject(DashboardStore);
    expectRequest(null).flush(successResponse());

    store.selectWeek('2026-06-01');
    const failedReq = expectRequest('2026-06-01');
    failedReq.flush({ title: 'Server Error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(store.week()).toBe(successResponse().weekStart);
    expect(store.metric()).toBe('call_received');
    expect(storage.loadWeek()).toBe(successResponse().weekStart);
    expect(store.response()?.weekStart).toBe(successResponse().weekStart);
    expect(store.errorMessage()).not.toBeNull();

    store.retry();
    const retryReq = expectRequest('2026-06-01');
    retryReq.flush(successResponse({ weekStart: '2026-06-01' }));

    expect(store.week()).toBe('2026-06-01');
    expect(store.errorMessage()).toBeNull();
  });

  it('does not roll back when the initial load fails since there is no prior response to restore', () => {
    const store = TestBed.inject(DashboardStore);
    const req = expectRequest(null);
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(store.response()).toBeNull();
    expect(store.metric()).toBe('call_received');
    expect(store.week()).toBeNull();
    expect(store.errorMessage()).not.toBeNull();
  });
});
