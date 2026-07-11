// generate-module-catalog.js
// Syncs the module catalog from App.js NAV_GROUPS into:
//   1. src/data/moduleCatalog.js      — offline fallback for the Team Access Hub
//   2. scripts/module_seed.sql        — upsert to refresh public.platform_modules in Supabase
// Run after adding/renaming modules:  node scripts/generate-module-catalog.js
// Then execute module_seed.sql in the Supabase SQL editor (team "New App" project).

const fs = require('fs');
const path = require('path');

const appJs = path.join(__dirname, '..', 'src', 'App.js');
const src = fs.readFileSync(appJs, 'utf8');

const pastelMatch = src.match(/const PASTEL = (\[[^\]]+\])/s);
// eslint-disable-next-line no-eval, no-unused-vars
const PASTEL = pastelMatch ? eval(pastelMatch[1]) : [];

const start = src.indexOf('const NAV_GROUPS = [');
const tail = src.slice(start + 'const NAV_GROUPS = '.length);
let depth = 0, end = -1;
for (let i = 0; i < tail.length; i++) {
  if (tail[i] === '[') depth++;
  else if (tail[i] === ']') { depth--; if (depth === 0) { end = i + 1; break; } }
}
// eslint-disable-next-line no-eval
const NAV_GROUPS = eval(tail.slice(0, end));

const rows = [];
NAV_GROUPS.forEach((g, gi) => {
  g.items.forEach((it, ii) => {
    const sprint = it.code ? (it.code.match(/^EP-([A-Z]+)/) || [])[1] || null : null;
    rows.push({
      route: it.path, label: it.label, code: it.code || null, badge: it.badge || null,
      nav_group: g.label, group_icon: g.icon, sort_order: gi * 100 + ii, sprint,
    });
  });
});
console.log(`Parsed ${NAV_GROUPS.length} groups / ${rows.length} modules`);

// 1. Static fallback catalog
const catalog = NAV_GROUPS.map(g => ({
  group: g.label, icon: g.icon, color: g.color,
  items: g.items.map(it => ({ path: it.path, label: it.label, badge: it.badge || '', code: it.code || '' })),
}));
const js = '// AUTO-GENERATED from App.js NAV_GROUPS — offline fallback for the Team Access Hub.\n' +
  '// Regenerate with: node scripts/generate-module-catalog.js (see TEAM_DEPLOYMENT_GUIDE.md)\n' +
  'export const MODULE_CATALOG = ' + JSON.stringify(catalog, null, 2) + ';\n' +
  'export const CATALOG_COUNT = ' + rows.length + ';\n';
fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'moduleCatalog.js'), js);
console.log('Wrote src/data/moduleCatalog.js');

// 2. Supabase upsert SQL
const esc = s => (s == null ? 'null' : "'" + String(s).replace(/'/g, "''") + "'");
const values = rows.map(r =>
  `(${esc(r.route)},${esc(r.label)},${esc(r.code)},${esc(r.badge)},${esc(r.nav_group)},${esc(r.group_icon)},${r.sort_order},${esc(r.sprint)})`);
const sql =
  'insert into public.platform_modules (route,label,code,badge,nav_group,group_icon,sort_order,sprint) values\n' +
  values.join(',\n') +
  '\non conflict (route) do update set label=excluded.label, code=excluded.code, badge=excluded.badge, nav_group=excluded.nav_group, group_icon=excluded.group_icon, sort_order=excluded.sort_order, sprint=excluded.sprint, updated_at=now();\n\n' +
  'insert into public.platform_module_access (route) select route from public.platform_modules on conflict (route) do nothing;\n';
fs.writeFileSync(path.join(__dirname, 'module_seed.sql'), sql);
console.log('Wrote scripts/module_seed.sql — run it in the Supabase SQL editor to refresh the registry');
