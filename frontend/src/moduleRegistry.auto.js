/**
 * moduleRegistry.auto.js — build-time aggregation of every co-located module
 * manifest (frontend/src/features/<name>/module.config.js).
 *
 * This is the de-confliction layer: a refined module declares its route, nav
 * entry, and guide in its OWN folder, and this file collects them so nobody has
 * to edit the shared App.js / moduleGuides.js / moduleRegistry.js hotspots.
 *
 * Everything here is ADDITIVE. With zero manifests present, all exports are empty
 * and the app behaves exactly as before (manual lists still drive everything).
 *
 * webpack `require.context` (CRA5 / react-app-rewired) globs the manifests at
 * build time. Each manifest's `element` is a static `lazy(() => import('./pages/X'))`
 * so code-splitting still works per module.
 */

// eslint-disable-next-line no-undef
const ctx = require.context('./features', true, /module\.config\.js$/);

export const AUTO_MODULES = ctx
  .keys()
  .map((k) => {
    try {
      const m = ctx(k).default;
      return m && m.path && m.element ? m : null;
    } catch (e) {
      // a broken manifest must never take down the whole app
      // eslint-disable-next-line no-console
      console.error('[auto-discovery] bad manifest', k, e);
      return null;
    }
  })
  .filter(Boolean);

// Route table — consumed in App.js after the manual <Route>s (manual wins on dupes).
export const AUTO_ROUTES = AUTO_MODULES.map((m) => ({ path: m.path, element: m.element }));

// Guide map keyed by route path — merged into MODULE_GUIDES via a shim.
export const AUTO_GUIDES = Object.fromEntries(
  AUTO_MODULES.filter((m) => m.guide).map((m) => [m.path, m.guide])
);

// Nav groups — same shape as App.js NAV_GROUPS / moduleRegistry MODULE_REGISTRY.
export const AUTO_NAV = (() => {
  const byGroup = new Map();
  for (const m of AUTO_MODULES) {
    const key = m.group || 'Uncategorised';
    if (!byGroup.has(key)) {
      byGroup.set(key, { label: key, group: key, icon: m.icon || '📦', color: m.color || '#475569', items: [], modules: [] });
    }
    const g = byGroup.get(key);
    const item = { path: m.path, label: m.label, badge: m.badge, code: m.code };
    g.items.push(item);   // App.js NAV_GROUPS uses `items`
    g.modules.push(item); // moduleRegistry MODULE_REGISTRY uses `modules`
  }
  return [...byGroup.values()];
})();

// Set of auto-owned paths — lets consumers dedupe against the manual lists.
export const AUTO_PATHS = new Set(AUTO_MODULES.map((m) => m.path));
