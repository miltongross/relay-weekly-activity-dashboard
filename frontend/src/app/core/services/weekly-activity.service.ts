import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MetricKey, WeeklyActivityResponse } from '../models/weekly-activity.model';

// Relative URL so the Angular dev-server proxy (proxy.conf.json) forwards to the backend
// without requiring CORS changes on the API.
const WEEKLY_ACTIVITY_URL = '/api/accounts/1/weekly-activity';

@Injectable({ providedIn: 'root' })
export class WeeklyActivityService {
  private readonly http = inject(HttpClient);

  getWeeklyActivity(metric: MetricKey, week?: string | null): Observable<WeeklyActivityResponse> {
    let params = new HttpParams().set('metric', metric);
    if (week) {
      params = params.set('week', week);
    }

    return this.http.get<WeeklyActivityResponse>(WEEKLY_ACTIVITY_URL, { params });
  }
}
