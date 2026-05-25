import type { Severity } from '@/types/api';

export function severityLabel(severity: Severity) {
  switch (severity) {
    case 'safe':
      return 'Low risk';
    case 'moderate':
      return 'Use with caution';
    case 'dangerous':
      return 'High risk';
    default:
      return 'Unknown';
  }
}

export function severityBadgeVariant(severity: Severity) {
  switch (severity) {
    case 'safe':
      return 'success';
    case 'moderate':
      return 'warning';
    case 'dangerous':
      return 'danger';
    default:
      return 'outline';
  }
}

export function severityTone(severity: Severity) {
  switch (severity) {
    case 'safe':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'moderate':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'dangerous':
      return 'text-rose-700 bg-rose-50 border-rose-200';
    default:
      return 'text-slate-700 bg-slate-50 border-slate-200';
  }
}