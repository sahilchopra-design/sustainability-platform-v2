// moduleRegistryService.js
// Team-shared module registry: reads the canonical catalog + access flags from
// Supabase (platform_modules / platform_module_access / platform_deployments),
// falling back to the build-time static catalog when offline or unconfigured.

import { sbSelect, sbInsert } from './supabaseClient';
import { MODULE_CATALOG } from '../data/moduleCatalog';

const staticModules = () =>
  MODULE_CATALOG.flatMap((g, gi) =>
    g.items.map((it, ii) => ({
      route: it.path,
      label: it.label,
      code: it.code || null,
      badge: it.badge || null,
      nav_group: g.group,
      group_icon: g.icon,
      sort_order: gi * 100 + ii,
      access_level: 'team',
      enabled: true,
      owner_email: null,
      notes: null,
    })),
  );

/**
 * Returns { source: 'supabase' | 'static', modules: [...] } where each module row
 * carries its access config merged in. Never throws — static fallback guarantees
 * the hub renders even with no network.
 */
export async function fetchModuleRegistry() {
  try {
    const [modules, access] = await Promise.all([
      sbSelect('platform_modules', 'select=*&order=sort_order.asc&limit=1000'),
      sbSelect('platform_module_access', 'select=*&limit=1000'),
    ]);
    if (!Array.isArray(modules) || modules.length === 0) throw new Error('empty registry');
    const accessByRoute = Object.fromEntries(access.map(a => [a.route, a]));
    return {
      source: 'supabase',
      modules: modules.map(m => ({
        access_level: 'team',
        enabled: true,
        ...m,
        ...(accessByRoute[m.route] || {}),
      })),
    };
  } catch (e) {
    return { source: 'static', modules: staticModules(), error: e.message };
  }
}

/** Latest deployment records (where the team reaches the app remotely). */
export async function fetchDeployments() {
  try {
    return await sbSelect('platform_deployments', 'select=*&order=deployed_at.desc&limit=10');
  } catch {
    return [];
  }
}

/** Fire-and-forget usage ping; RLS permits only event in (open, export, error). */
export function logModuleOpen(route, member) {
  sbInsert('platform_module_usage', [{ route, member: member || null, event: 'open' }]).catch(() => {});
}

/** Usage summary for the hub (last events, most-opened modules). */
export async function fetchUsageSummary() {
  try {
    const rows = await sbSelect('platform_module_usage', 'select=route,event,occurred_at&order=occurred_at.desc&limit=500');
    const counts = {};
    rows.forEach(r => { counts[r.route] = (counts[r.route] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([route, n]) => ({ route, opens: n }));
    return { total: rows.length, top, recent: rows.slice(0, 12) };
  } catch {
    return { total: 0, top: [], recent: [] };
  }
}
