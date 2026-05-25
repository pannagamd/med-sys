export const APP_NAME = 'MediPulse';
export const APP_TAGLINE = 'Medicine safety for modern care workflows.';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
export const MEDICAL_DISCLAIMER =
  'This tool is for informational purposes only and does not replace professional medical advice. Always consult a licensed clinician before taking any medication.';

export const navigationLinks = [
  { label: 'Home', href: '/app' },
  { label: 'Profile', href: '/app/profile' },
  { label: 'Interactions', href: '/app/interactions' },
  { label: 'Symptoms', href: '/app/symptoms' },
  { label: 'Medicines', href: '/app/medicines' },
];

// Centralized route-to-page-title mapping
export const routeTitles: Record<string, string> = {
  '/app': 'Home',
  '/app/medicines': 'Medicine Search',
  '/app/interactions': 'Drug Interactions',
  '/app/symptoms': 'Symptom Checker',
  '/app/profile': 'Profile',
  '/app/history': 'Activity Timeline',
  '/app/admin': 'Admin Workspace',
};

export const featureHighlights = [
  {
    title: 'Live medicine search',
    description: 'Search local records with instant filters, soft loading states, and polished result cards.',
  },
  {
    title: 'Interaction analysis',
    description: 'Compare multiple medicines with clear severity indicators, explanations, and warnings.',
  },
  {
    title: 'Pregnancy-aware safety',
    description: 'Respect profile context and surface conservative guidance for women who are pregnant.',
  },
];