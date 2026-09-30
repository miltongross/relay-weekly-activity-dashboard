import { MetricKey, MetricLabel } from '../models/weekly-activity.model';

export const METRIC_DISPLAY_NAMES: Record<MetricKey, string> = {
  call_received: 'Calls received',
  lead_created: 'Leads created',
  appointment_set: 'Appointments set',
};

const METRIC_LABEL_TEXT: Record<MetricLabel, string> = {
  Typical: 'Typical',
  BelowTypical: 'Below typical',
  AboveTypical: 'Above typical',
  NoPriorActivity: 'No prior activity',
  InsufficientHistory: 'Insufficient history',
};

// Distinct CSS hooks per label so status is never conveyed by color alone (text always matches).
const METRIC_LABEL_CLASS: Record<MetricLabel, string> = {
  Typical: 'label-typical',
  BelowTypical: 'label-below',
  AboveTypical: 'label-above',
  NoPriorActivity: 'label-none',
  InsufficientHistory: 'label-insufficient',
};

export function metricLabelText(label: MetricLabel): string {
  return METRIC_LABEL_TEXT[label];
}

export function metricLabelClass(label: MetricLabel): string {
  return METRIC_LABEL_CLASS[label];
}
