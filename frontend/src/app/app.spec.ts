import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';
import { WeeklyActivityResponse } from './core/models/weekly-activity.model';

describe('App', () => {
  let httpMock: HttpTestingController;

  const successResponse: WeeklyActivityResponse = {
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
  };

  function pendingRequest() {
    return httpMock.expectOne((r) => r.url === '/api/accounts/1/weekly-activity');
  }

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    pendingRequest().flush(successResponse);
  });

  it('shows a loading state while the initial request is outstanding', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading')?.textContent).toContain('Loading weekly activity');

    pendingRequest().flush(successResponse);
  });

  it('renders the dashboard once the request resolves', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    pendingRequest().flush(successResponse);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading')).toBeNull();
    expect(compiled.querySelector('#metric-select')).toBeTruthy();
    expect(compiled.querySelector('#summary-heading')?.textContent).toContain('Calls received');
    expect(compiled.querySelector('table')?.textContent).toContain('Main Street');
  });

  it('renders the empty-location message when no locations are observed', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    pendingRequest().flush({ ...successResponse, locations: [] });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No location data is available for this account.');
  });

  it('shows an error state with a retry action when the request fails, and retry reloads', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    pendingRequest().flush(
      { title: 'Not Found', detail: 'Account 1 was not found.' },
      { status: 404, statusText: 'Not Found' },
    );
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error')?.textContent).toContain('Account 1 was not found.');

    const retryButton = compiled.querySelector('.error button') as HTMLButtonElement;
    retryButton.click();
    fixture.detectChanges();

    pendingRequest().flush(successResponse);
    fixture.detectChanges();

    expect(compiled.querySelector('.error')).toBeNull();
    expect(compiled.querySelector('#summary-heading')).toBeTruthy();
  });

  it('reloads with the selected metric when the metric control changes', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    pendingRequest().flush(successResponse);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const select = compiled.querySelector('#metric-select') as HTMLSelectElement;
    select.value = 'lead_created';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const req = httpMock.expectOne(
      (r) => r.url === '/api/accounts/1/weekly-activity' && r.params.get('metric') === 'lead_created',
    );
    expect(req.request.params.get('metric')).toBe('lead_created');
    req.flush({ ...successResponse, metric: 'lead_created' });
  });

  it('shows both select values matching the response on default load', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    pendingRequest().flush(successResponse);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const metricSelect = compiled.querySelector('#metric-select') as HTMLSelectElement;
    const weekSelect = compiled.querySelector('#week-select') as HTMLSelectElement;

    expect(metricSelect.value).toBe(successResponse.metric);
    expect(weekSelect.value).toBe(successResponse.weekStart);
    expect(compiled.querySelector('#summary-heading')?.textContent).toContain('Calls received');
  });

  it('shows both select values matching the response after a control change', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    pendingRequest().flush(successResponse);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const metricSelect = compiled.querySelector('#metric-select') as HTMLSelectElement;
    const weekSelect = compiled.querySelector('#week-select') as HTMLSelectElement;

    metricSelect.value = 'lead_created';
    metricSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const req = httpMock.expectOne(
      (r) => r.url === '/api/accounts/1/weekly-activity' && r.params.get('metric') === 'lead_created',
    );
    req.flush({ ...successResponse, metric: 'lead_created', weekStart: '2026-06-01', weekEnd: '2026-06-08' });
    fixture.detectChanges();

    expect(metricSelect.value).toBe('lead_created');
    expect(weekSelect.value).toBe('2026-06-01');
  });

  it('shows both select values matching the response after a persisted reload', () => {
    localStorage.setItem('relay.dash247.metric', 'lead_created');
    localStorage.setItem('relay.dash247.week', '2026-06-01');

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const req = httpMock.expectOne(
      (r) =>
        r.url === '/api/accounts/1/weekly-activity' &&
        r.params.get('metric') === 'lead_created' &&
        r.params.get('week') === '2026-06-01',
    );
    req.flush({
      ...successResponse,
      metric: 'lead_created',
      weekStart: '2026-06-01',
      weekEnd: '2026-06-08',
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const metricSelect = compiled.querySelector('#metric-select') as HTMLSelectElement;
    const weekSelect = compiled.querySelector('#week-select') as HTMLSelectElement;

    expect(metricSelect.value).toBe('lead_created');
    expect(weekSelect.value).toBe('2026-06-01');
  });

  it('recovers to the default select values when a persisted week is invalid', () => {
    localStorage.setItem('relay.dash247.week', '2026-01-05');

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const firstReq = httpMock.expectOne(
      (r) => r.url === '/api/accounts/1/weekly-activity' && r.params.get('week') === '2026-01-05',
    );
    firstReq.flush(
      { errors: { week: ['The week is outside the available range.'] } },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    const retryReq = httpMock.expectOne(
      (r) => r.url === '/api/accounts/1/weekly-activity' && !r.params.has('week'),
    );
    retryReq.flush(successResponse);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const metricSelect = compiled.querySelector('#metric-select') as HTMLSelectElement;
    const weekSelect = compiled.querySelector('#week-select') as HTMLSelectElement;

    expect(weekSelect.value).toBe(successResponse.weekStart);
    expect(metricSelect.value).toBe(successResponse.metric);
    expect(compiled.querySelector('.notice')?.textContent).toContain('Your saved week was not available');
  });

  it('keeps keyboard focus on the metric select through loading and the response', () => {
    const fixture = TestBed.createComponent(App);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    pendingRequest().flush(successResponse);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const metricSelect = compiled.querySelector('#metric-select') as HTMLSelectElement;
    metricSelect.focus();
    expect(document.activeElement).toBe(metricSelect);

    metricSelect.value = 'lead_created';
    metricSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(document.activeElement).toBe(metricSelect);

    const req = httpMock.expectOne(
      (r) => r.url === '/api/accounts/1/weekly-activity' && r.params.get('metric') === 'lead_created',
    );
    req.flush({ ...successResponse, metric: 'lead_created' });
    fixture.detectChanges();

    expect(document.activeElement).toBe(metricSelect);

    fixture.nativeElement.remove();
  });

  it('keeps keyboard focus on the week select through loading and the response', () => {
    const fixture = TestBed.createComponent(App);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    pendingRequest().flush(successResponse);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const weekSelect = compiled.querySelector('#week-select') as HTMLSelectElement;
    weekSelect.focus();
    expect(document.activeElement).toBe(weekSelect);

    weekSelect.value = '2026-06-01';
    weekSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(document.activeElement).toBe(weekSelect);

    const req = httpMock.expectOne(
      (r) => r.url === '/api/accounts/1/weekly-activity' && r.params.get('week') === '2026-06-01',
    );
    req.flush({ ...successResponse, weekStart: '2026-06-01', weekEnd: '2026-06-08' });
    fixture.detectChanges();

    expect(document.activeElement).toBe(weekSelect);

    fixture.nativeElement.remove();
  });

  it('keeps keyboard focus on the metric select across rapid, overlapping changes', () => {
    const fixture = TestBed.createComponent(App);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    pendingRequest().flush(successResponse);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const metricSelect = compiled.querySelector('#metric-select') as HTMLSelectElement;
    metricSelect.focus();

    metricSelect.value = 'lead_created';
    metricSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(document.activeElement).toBe(metricSelect);

    metricSelect.value = 'appointment_set';
    metricSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(document.activeElement).toBe(metricSelect);

    const staleReq = httpMock.expectOne(
      (r) => r.url === '/api/accounts/1/weekly-activity' && r.params.get('metric') === 'lead_created',
    );
    const latestReq = httpMock.expectOne(
      (r) => r.url === '/api/accounts/1/weekly-activity' && r.params.get('metric') === 'appointment_set',
    );

    staleReq.flush({ ...successResponse, metric: 'lead_created' });
    fixture.detectChanges();
    expect(document.activeElement).toBe(metricSelect);

    latestReq.flush({ ...successResponse, metric: 'appointment_set' });
    fixture.detectChanges();
    expect(document.activeElement).toBe(metricSelect);
    expect(metricSelect.value).toBe('appointment_set');

    fixture.nativeElement.remove();
  });

  it('rolls back the metric select and heading when a metric change fails after a successful load, then retries the attempted metric', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    pendingRequest().flush(successResponse);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const metricSelect = compiled.querySelector('#metric-select') as HTMLSelectElement;

    metricSelect.value = 'lead_created';
    metricSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const failedReq = httpMock.expectOne(
      (r) => r.url === '/api/accounts/1/weekly-activity' && r.params.get('metric') === 'lead_created',
    );
    failedReq.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    fixture.detectChanges();

    // Rolled back: select, heading, and caption must match the still-displayed old response.
    expect(metricSelect.value).toBe('call_received');
    expect(compiled.querySelector('#summary-heading')?.textContent).toContain('Calls received');
    expect(compiled.querySelector('table')?.textContent).toContain('Main Street');
    expect(compiled.querySelector('.error')?.textContent).toContain(
      'Could not reach the activity service',
    );
    expect(localStorage.getItem('relay.dash247.metric')).toBe('call_received');

    const retryButton = compiled.querySelector('.error button') as HTMLButtonElement;
    retryButton.click();
    fixture.detectChanges();

    // Retry re-attempts the failed selection, not the rolled-back displayed one.
    const retryReq = httpMock.expectOne(
      (r) => r.url === '/api/accounts/1/weekly-activity' && r.params.get('metric') === 'lead_created',
    );
    retryReq.flush({ ...successResponse, metric: 'lead_created' });
    fixture.detectChanges();

    expect(compiled.querySelector('.error')).toBeNull();
    expect(metricSelect.value).toBe('lead_created');
    expect(compiled.querySelector('#summary-heading')?.textContent).toContain('Leads created');
  });

  it('rolls back the week select and caption when a week change fails after a successful load, then retries the attempted week', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    pendingRequest().flush(successResponse);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const weekSelect = compiled.querySelector('#week-select') as HTMLSelectElement;

    weekSelect.value = '2026-06-01';
    weekSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const failedReq = httpMock.expectOne(
      (r) => r.url === '/api/accounts/1/weekly-activity' && r.params.get('week') === '2026-06-01',
    );
    failedReq.flush({ title: 'Server Error' }, { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    // Rolled back: select and displayed week must match the still-displayed old response, not the failed attempt.
    expect(weekSelect.value).toBe(successResponse.weekStart);
    expect(compiled.querySelector('#summary-heading')?.textContent).toContain('week of');
    expect(compiled.querySelector('.error')).toBeTruthy();
    expect(localStorage.getItem('relay.dash247.week')).toBe(successResponse.weekStart);

    const retryButton = compiled.querySelector('.error button') as HTMLButtonElement;
    retryButton.click();
    fixture.detectChanges();

    const retryReq = httpMock.expectOne(
      (r) => r.url === '/api/accounts/1/weekly-activity' && r.params.get('week') === '2026-06-01',
    );
    retryReq.flush({ ...successResponse, weekStart: '2026-06-01', weekEnd: '2026-06-08' });
    fixture.detectChanges();

    expect(compiled.querySelector('.error')).toBeNull();
    expect(weekSelect.value).toBe('2026-06-01');
  });

  it('keeps normal loading and success behavior unaffected by the rollback fix (no regression)', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading')?.textContent).toContain('Loading weekly activity');

    pendingRequest().flush(successResponse);
    fixture.detectChanges();

    expect(compiled.querySelector('.loading')).toBeNull();
    expect(compiled.querySelector('.error')).toBeNull();

    const metricSelect = compiled.querySelector('#metric-select') as HTMLSelectElement;
    metricSelect.value = 'lead_created';
    metricSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(compiled.querySelector('.updating')?.textContent).toContain('Updating');

    const req = httpMock.expectOne(
      (r) => r.url === '/api/accounts/1/weekly-activity' && r.params.get('metric') === 'lead_created',
    );
    req.flush({ ...successResponse, metric: 'lead_created' });
    fixture.detectChanges();

    expect(compiled.querySelector('.updating')).toBeNull();
    expect(compiled.querySelector('.error')).toBeNull();
    expect(metricSelect.value).toBe('lead_created');
  });

  it('keeps keyboard focus on the metric select through a failed change, rollback, and retry', () => {
    const fixture = TestBed.createComponent(App);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    pendingRequest().flush(successResponse);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const metricSelect = compiled.querySelector('#metric-select') as HTMLSelectElement;
    metricSelect.focus();
    expect(document.activeElement).toBe(metricSelect);

    metricSelect.value = 'lead_created';
    metricSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(document.activeElement).toBe(metricSelect);

    const failedReq = httpMock.expectOne(
      (r) => r.url === '/api/accounts/1/weekly-activity' && r.params.get('metric') === 'lead_created',
    );
    failedReq.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    fixture.detectChanges();

    expect(document.activeElement).toBe(metricSelect);
    expect(metricSelect.value).toBe('call_received');

    const retryButton = compiled.querySelector('.error button') as HTMLButtonElement;
    retryButton.click();
    fixture.detectChanges();

    const retryReq = httpMock.expectOne(
      (r) => r.url === '/api/accounts/1/weekly-activity' && r.params.get('metric') === 'lead_created',
    );
    retryReq.flush({ ...successResponse, metric: 'lead_created' });
    fixture.detectChanges();

    expect(metricSelect.value).toBe('lead_created');

    fixture.nativeElement.remove();
  });
});
