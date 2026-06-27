#!/usr/bin/env node
/**
 * validate-module.js — production-grade gate for one module.
 *
 * Runs the REM regression-class checks + manifest completeness (+ optional build)
 * for a single module, and exits non-zero if a HARD check fails. Used by the
 * pre-push hook and by the server-side promotion gate (see docs/MODULE_CONTRACT.md).
 *
 * Usage:
 *   node scripts/validate-module.js <route-path|feature-folder> [--build] [--strict] [--json]
 *
 * Examples:
 *   node scripts/validate-module.js /real-estate-carbon-analytics
 *   node scripts/validate-module.js real-estate-carbon-analytics --build --strict
 *
 * HARD checks (always gate): manifest completeness, undefined T.* token usage,
 *   and (with --build) a clean production build.
 * SOFT checks (warn; gate only with --strict): in-place sort mutation,
 *   unguarded /length division, non-standard PRNG constants.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const FEATURES = path.join(ROOT, 'frontend', 'src', 'features');

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const rawTarget = args.find((a) => !a.startsWith('--'));
if (!rawTarget) {
  console.error('usage: node scripts/validate-module.js <route-path|feature-folder> [--build] [--strict] [--json]');
  process.exit(2);
}
// Git-Bash/MSYS rewrites a leading "/foo" arg into "C:/.../foo"; recover the slug.
const target = (() => {
  let s = rawTarget.replace(/\\/g, '/');
  if (/^[A-Za-z]:\//.test(s)) s = s.split('/').pop();
  return s;
})();

// ---- locate the feature folder -------------------------------------------
function resolveFeatureDir(t) {
  const direct = path.join(FEATURES, t.replace(/^\//, ''));
  if (fs.existsSync(direct) && fs.statSync(direct).isDirectory()) return direct;
  // search module.config.js files for a matching route path
  const routePath = t.startsWith('/') ? t : `/${t}`;
  for (const dir of fs.readdirSync(FEATURES)) {
    const cfg = path.join(FEATURES, dir, 'module.config.js');
    if (fs.existsSync(cfg) && fs.readFileSync(cfg, 'utf8').includes(`'${routePath}'`)) {
      return path.join(FEATURES, dir);
    }
  }
  return null;
}

const featureDir = resolveFeatureDir(target);
if (!featureDir) {
  console.error(`✗ could not resolve a feature folder for "${target}"`);
  process.exit(2);
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(jsx?|tsx?)$/.test(e.name)) out.push(p);
  }
  return out;
}
const sourceFiles = walk(featureDir);
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');

const findings = { hard: [], soft: [] };
const add = (sev, cls, file, line, msg) =>
  findings[sev].push({ cls, file: rel(file), line, msg });

// ---- HARD: undefined T.* token usage (real runtime crash) ----------------
for (const file of sourceFiles) {
  const src = fs.readFileSync(file, 'utf8');
  // only check when T is a LOCAL object literal in this file
  const def = src.match(/\bconst\s+T\s*=\s*\{([\s\S]*?)\}\s*;/);
  if (!def) continue; // imported T — assume the shared toolkit is complete
  const keys = new Set([...def[1].matchAll(/([A-Za-z_$][\w$]*)\s*:/g)].map((m) => m[1]));
  const used = new Set([...src.matchAll(/\bT\.([A-Za-z_$][\w$]*)/g)].map((m) => m[1]));
  for (const tok of used) {
    if (!keys.has(tok)) {
      const idx = src.split('\n').findIndex((l) => l.includes(`T.${tok}`)) + 1;
      add('hard', 'undefined-T-token', file, idx, `T.${tok} used but not defined on local T object`);
    }
  }
}

// ---- SOFT: in-place sort mutation ----------------------------------------
for (const file of sourceFiles) {
  src_lines(file).forEach(({ n, line }) => {
    const m = line.match(/(^|[^.\])\s])([A-Za-z_$][\w$]*)\.sort\(/);
    if (!m) return;
    if (/\[\s*\.\.\./.test(line)) return; // [...arr].sort — safe
    if (/\.(map|filter|slice|concat|flatMap|reduce|from)\([^)]*\)\.sort\(/.test(line)) return;
    if (/Object\.(entries|keys|values)\([^)]*\)\.sort\(/.test(line)) return;
    add('soft', 'in-place-sort', file, n, `possible in-place .sort() on "${m[2]}" — prefer [...${m[2]}].sort(...)`);
  });
}

// ---- SOFT: unguarded /length division ------------------------------------
for (const file of sourceFiles) {
  src_lines(file).forEach(({ n, line }) => {
    const m = line.match(/\/\s*([A-Za-z_$][\w$.]*)\.length\b/);
    if (!m) return;
    if (/Math\.max\(\s*1\s*,/.test(line)) return;
    if (new RegExp(`${escapeRe(m[1])}\\.length\\s*[?&|]`).test(line)) return;
    if (/\.length\s*\|\|\s*1/.test(line)) return;
    add('soft', 'unguarded-division', file, n, `"/ ${m[1]}.length" may divide by zero — guard with length check`);
  });
}

// ---- SOFT: non-standard PRNG constants -----------------------------------
for (const file of sourceFiles) {
  src_lines(file).forEach(({ n, line }) => {
    if (/\b(9301|49297|233280)\b/.test(line)) {
      add('soft', 'nonstandard-prng', file, n, 'non-standard LCG constant — prefer platform sr() helper');
    }
  });
}

// ---- HARD: manifest completeness -----------------------------------------
const manifestPath = path.join(featureDir, 'module.config.js');
const REQUIRED = ['path', 'label', 'group', 'element'];
if (!fs.existsSync(manifestPath)) {
  add('hard', 'manifest', manifestPath, 0, 'module.config.js missing — module is not auto-discoverable');
} else {
  const man = fs.readFileSync(manifestPath, 'utf8');
  for (const key of REQUIRED) {
    if (!new RegExp(`\\b${key}\\s*:`).test(man)) add('hard', 'manifest', manifestPath, 0, `manifest missing required field "${key}"`);
  }
}

// ---- HARD (opt-in): production build -------------------------------------
let buildOk = null;
if (flags.has('--build')) {
  try {
    execSync('npm run build', { cwd: path.join(ROOT, 'frontend'), stdio: 'ignore', env: { ...process.env, CI: 'true' } });
    buildOk = true;
  } catch {
    buildOk = false;
    add('hard', 'build', path.join(ROOT, 'frontend'), 0, 'CI build failed (warnings-as-errors)');
  }
}

// ---- report ---------------------------------------------------------------
const strict = flags.has('--strict');
const hardFail = findings.hard.length > 0;
const softFail = strict && findings.soft.length > 0;
const pass = !hardFail && !softFail;

if (flags.has('--json')) {
  console.log(JSON.stringify({ module: target, featureDir: rel(featureDir), pass, buildOk, findings }, null, 2));
} else {
  console.log(`\nValidate: ${target}  (${rel(featureDir)})`);
  const print = (list, label) => {
    if (!list.length) return;
    console.log(`\n  ${label}:`);
    for (const f of list) console.log(`    [${f.cls}] ${f.file}:${f.line}  ${f.msg}`);
  };
  print(findings.hard, 'HARD');
  print(findings.soft, 'SOFT (warnings)');
  if (buildOk !== null) console.log(`\n  build: ${buildOk ? 'OK' : 'FAILED'}`);
  console.log(`\n  result: ${pass ? 'PASS ✓' : 'FAIL ✗'}${softFail ? ' (soft warnings under --strict)' : ''}\n`);
}
process.exit(pass ? 0 : 1);

// ---- helpers --------------------------------------------------------------
function src_lines(file) {
  return fs.readFileSync(file, 'utf8').split('\n').map((line, i) => ({ n: i + 1, line }));
}
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
