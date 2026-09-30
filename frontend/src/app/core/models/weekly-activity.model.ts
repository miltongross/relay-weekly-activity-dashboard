// Strongly typed request/response models mirroring docs/contracts/DASH-247.openapi.json.
// Do not add fields the contract does not declare; report drift instead of inventing shapes.

export const ALLOWED_METRICS = ['call_received', 'lead_created', 'appointment_set'] as const;
export type MetricKey = (typeof ALLOWED_METRICS)[number];

export type MetricLabel =
  | 'Typical'
  | 'BelowTypical'
  | 'AboveTypical'
  | 'NoPriorActivity'
  | 'InsufficientHistory';

export interface MetricSummary {
  actualCount: number;
  baselineAverage: number | null;
  signedDifference: number | null;
  percentDifference: number | null;
  label: MetricLabel;
}

export interface LocationMetricSummary {
  location: string;
  summary: MetricSummary;
}

export interface DatasetCoverage {
  earliestEventDate: string;
  latestEventDate: string;
  earliestSelectableWeekStart: string;
  latestSelectableWeekStart: string;
}

export interface WeeklyActivityResponse {
  accountId: number;
  metric: MetricKey;
  weekStart: string;
  weekEnd: string;
  timezone: string;
  coverage: DatasetCoverage;
  account: MetricSummary;
  locations: LocationMetricSummary[];
}

export interface ValidationProblemDetails {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  errors?: Record<string, string[]>;
}

export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
}

export function isMetricKey(value: string | null | undefined): value is MetricKey {
  return !!value && (ALLOWED_METRICS as readonly string[]).includes(value);
}
