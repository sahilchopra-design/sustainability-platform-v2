// supabaseClient.js
// Zero-dependency Supabase REST client (PostgREST) for the shared team DB.
//
// Configuration precedence:
//   1. REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY (set in Vercel or .env)
//   2. Baked-in defaults for the team's "New App" project.
// The key below is a *publishable* key — safe to ship in frontend bundles by design.
// All platform_* tables are protected by RLS: read-only + usage-insert for this key;
// any write (access changes, deployment records) happens via the Supabase dashboard.

const SUPABASE_URL =
  process.env.REACT_APP_SUPABASE_URL || 'https://ynxmxgjdivriakhxxptk.supabase.co';
const SUPABASE_KEY =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  'sb_publishable_kXTDciFVU_rhl3gX-zjcKA__Vjs-IW5';

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

export const supabaseConfig = () => ({
  url: SUPABASE_URL,
  keySource: process.env.REACT_APP_SUPABASE_ANON_KEY ? 'environment' : 'built-in default',
});

/** SELECT rows from a table. `query` is a PostgREST query string, e.g. 'select=*&order=sort_order'. */
export async function sbSelect(table, query = 'select=*') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers });
  if (!res.ok) throw new Error(`Supabase ${table}: HTTP ${res.status}`);
  return res.json();
}

/** INSERT rows (array of objects). Only succeeds where RLS allows (platform_module_usage). */
export async function sbInsert(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Supabase insert ${table}: HTTP ${res.status}`);
  return true;
}

/** Cheap connectivity probe used by the Team Access Hub status panel. */
export async function sbPing() {
  const t0 = Date.now();
  try {
    await sbSelect('platform_modules', 'select=route&limit=1');
    return { ok: true, ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, ms: Date.now() - t0, error: e.message };
  }
}
