import { lazy } from 'react';

/**
 * Auto-discovered module manifest (see frontend/src/moduleRegistry.auto.js).
 * Pilot for the per-module refinement system. Keep SIDE-EFFECT-FREE — this file
 * is eval'd at app startup. The page's route, nav entry, and guide now live here
 * instead of in the shared App.js / moduleGuides.js / moduleRegistry.js files.
 */
export default {
  path: '/real-estate-carbon-analytics',
  label: 'Real Estate Carbon Analytics',
  group: 'Physical & Climate Risk',
  icon: '🏢',
  color: '#dc2626',
  element: lazy(() => import('./pages/RealEstateCarbonAnalyticsPage')),
};
