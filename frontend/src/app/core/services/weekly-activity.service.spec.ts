import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WeeklyActivityService } from './weekly-activity.service';
import { WeeklyActivityResponse } from '../models/weekly-activity.model';

describe('WeeklyActivityService', () => {
  let service: WeeklyActivityService;
  let httpMock: HttpTestingController;

  const sampleResponse: WeeklyActivityResponse = {
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
    locations: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WeeklyActivityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests the weekly activity endpoint with only the metric param when no week is supplied', () => {
    service.getWeeklyActivity('call_received').subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === '/api/accounts/1/weekly-activity' && r.params.get('metric') === 'call_received',
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('week')).toBeFalse();
    req.flush(sampleResponse);
  });

  it('includes the week param when a week is supplied', () => {
    service.getWeeklyActivity('lead_created', '2026-07-06').subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === '/api/accounts/1/weekly-activity' &&
        r.params.get('metric') === 'lead_created' &&
        r.params.get('week') === '2026-07-06',
    );
    expect(req.request.params.get('week')).toBe('2026-07-06');
    req.flush({ ...sampleResponse, metric: 'lead_created', weekStart: '2026-07-06' });
  });

  it('emits the typed response body to subscribers', (done) => {
    service.getWeeklyActivity('call_received').subscribe((response) => {
      expect(response).toEqual(sampleResponse);
      done();
    });

    const req = httpMock.expectOne((r) => r.url === '/api/accounts/1/weekly-activity');
    req.flush(sampleResponse);
  });
});
