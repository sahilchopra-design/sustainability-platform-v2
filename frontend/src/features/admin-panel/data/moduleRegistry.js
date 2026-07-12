/**
 * MODULE REGISTRY — full list of platform modules organized by domain group.
 * Used by the admin panel for visual module access management.
 *
 * Derived from navGroups.js — the same ground-truth catalog that drives the
 * app's actual <Route>s and sidebar — instead of maintaining a second,
 * hand-curated list here. The previous hardcoded list only covered ~255 of
 * the platform's 800+ modules (the ones with module.config.js manifests),
 * so admins could never grant access to most of the app.
 */

import { NAV_GROUPS, PASTEL } from '../../../navGroups';

export const MODULE_REGISTRY = NAV_GROUPS.map((g, i) => ({
  group: g.label,
  icon: g.icon,
  color: g.color || PASTEL[i % PASTEL.length],
  modules: g.items.map((item) => ({ path: item.path, label: item.label, code: item.code || null, badge: item.badge || null })),
}));

// Flattened list of all paths for quick lookups
export const ALL_MODULE_PATHS = MODULE_REGISTRY.flatMap(g => g.modules.map(m => m.path));

// Total module count
export const TOTAL_MODULES = ALL_MODULE_PATHS.length;

// Get label for a path
export const getModuleLabel = (path) => {
  for (const g of MODULE_REGISTRY) {
    const m = g.modules.find(m => m.path === path);
    if (m) return m.label;
  }
  return path;
};

// Get group for a path
export const getModuleGroup = (path) => {
  for (const g of MODULE_REGISTRY) {
    if (g.modules.some(m => m.path === path)) return g.group;
  }
  return 'Other';
};
