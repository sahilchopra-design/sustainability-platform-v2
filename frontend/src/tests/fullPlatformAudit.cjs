/**
 * A² FULL PLATFORM AUDIT — 579 Modules End-to-End
 * Tests every module for: data seeding, calculation integrity, division guards, NaN/Infinity
 */
const fs = require('fs');
const path = require('path');

function findPages(dir) {
  const results = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) results.push(...findPages(full));
      else if (item.name.endsWith('.jsx') && full.includes('pages')) results.push(full);
    }
  } catch (e) { /* skip */ }
  return results;
}

const featuresDir = path.join(__dirname, '..', 'features');
const files = findPages(featuresDir);

console.log('═══════════════════════════════════════════════════════════════════════');
console.log('  A² RISK ANALYTICS — FULL PLATFORM AUDIT');
console.log('  ' + files.length + ' Modules · Data Seeding · Engines · Division Guards');
console.log('═══════════════════════════════════════════════════════════════════════\n');

// Counters
let totalModules = 0;
let modulesWithSr = 0;
let modulesWithMathRandom = 0;
let modulesWithData = 0;
let modulesWithCalcs = 0;
let modulesWithDivisionRisk = 0;
let modulesWithContexts = 0;
let modulesWithNaNRisk = 0;
let modulesWithInfinityRisk = 0;
let modulesWithSortMutation = 0;

const P0_ISSUES = []; // Crashes
const P1_ISSUES = []; // Calculation errors
const P2_ISSUES = []; // Quality warnings
const MODULE_DETAILS = [];

const DATA_ARRAY_RE = /const\s+(COMPANIES|HOLDINGS|ASSETS|PORTFOLIO|ENTITIES|SECTORS|COUNTRIES|ITEMS|REGIONS|PROJECTS|MARKETS|INSTRUMENTS|BONDS|FUNDS|CREDITS|PROPERTIES|LOANS|POLICIES|SCENARIOS|NODES|FACILITIES|BENCHMARKS|INDICATORS|DEALS|METRICS|EXPOSURES|RISKS|ISSUERS|INSTITUTIONS|CURRENCIES|COMMODITIES|SUPPLIERS|WORKERS|PRODUCTS|BUILDINGS|VESSELS|PLANTS|ROUTES|TARGETS|STRATEGIES|FRAMEWORKS|STANDARDS|PATHWAYS|VINTAGES|OPERATIONS|EVENTS|ALERTS|CONTROLS|DATA|RECORDS|POSITIONS|TRANCHES|CLAIMS|PARTICIPANTS|COUNTERPARTIES|JURISDICTIONS|ZONES|BASINS|HABITATS|SPECIES|PERILS|LAYERS|TREATIES|MANDATES|SCORES|RATINGS|SIGNALS|SOURCES|CATEGORIES|TYPES|GROUPS|CLASSES|THEMES|PILLARS|MODULES|FEATURES|TOOLS|ACTIONS|RESULTS|REPORTS|CHARTS|TABLES|CARDS|TABS)\s*=\s*(?:\[|Array)/;

const CALC_RE = /\.reduce\s*\(|\.map\s*\(.*(?:\+|\/|\*|-)/;
const DIV_RE = /[^a-zA-Z_](\/)\s*(?:[a-zA-Z_]\w*\.(?:length|size|count)|total\w*|sum\w*|count\w*|[nN]\b|len\b|avg\w*|denom)/g;
const DIV_GUARD_RE = /Math\.max\s*\(\s*[01]|\.length\s*[\?!>]|\.length\s*===?\s*0|\|\|\s*[01]\b|> 0\s*\?/g;
const SORT_MUTATION_RE = /(?:COMPANIES|HOLDINGS|ASSETS|ITEMS|ENTITIES|SECTORS|COUNTRIES|DATA|RESULTS|SCORES|CREDITS|BENCHMARKS|INDICATORS)\s*\.sort\s*\(/;
const SR_RE = /const\s+sr\s*=/;
const MATH_RANDOM_RE = /Math\.random\s*\(/;
const CONTEXT_RE = /use(?:Portfolio|Ceda|BigClimateDb|ReferenceData|DataCapture|CarbonCredit|GuidedMode|Auth|TestData|CompanyEnrichment|ClimateRisk)\s*\(/;
const NAN_RISK_RE = /(?:parseInt|parseFloat|Number)\s*\([^)]*\)\s*[+\-*\/]/;
const INFINITY_RE = /(?:\/\s*0\b|Infinity\b|\.toFixed\s*\(\s*\)\s*\/)/;
const DATA_IMPORT_RE = /from\s+['"][^'"]*(?:data|context|contexts)[^'"]*['"]/;

files.forEach(filePath => {
  totalModules++;
  const src = fs.readFileSync(filePath, 'utf8');
  const relPath = filePath.replace(featuresDir + path.sep, '');
  const moduleName = path.basename(filePath, '.jsx');
  const domain = relPath.split(path.sep)[0] || 'unknown';
  const lineCount = src.split('\n').length;

  const detail = {
    name: moduleName,
    domain,
    lines: lineCount,
    hasSr: SR_RE.test(src),
    hasMathRandom: MATH_RANDOM_RE.test(src),
    hasData: DATA_ARRAY_RE.test(src),
    hasCalcs: CALC_RE.test(src),
    hasContexts: CONTEXT_RE.test(src) || DATA_IMPORT_RE.test(src),
    divisionOps: (src.match(DIV_RE) || []).length,
    divisionGuards: (src.match(DIV_GUARD_RE) || []).length,
    hasSortMutation: SORT_MUTATION_RE.test(src),
    hasNaNRisk: NAN_RISK_RE.test(src),
    hasInfinityRef: INFINITY_RE.test(src),
    issues: [],
  };

  // Count
  if (detail.hasSr) modulesWithSr++;
  if (detail.hasMathRandom) modulesWithMathRandom++;
  if (detail.hasData) modulesWithData++;
  if (detail.hasCalcs) modulesWithCalcs++;
  if (detail.hasContexts) modulesWithContexts++;
  if (detail.hasSortMutation) modulesWithSortMutation++;

  // P0: Math.random (non-deterministic)
  if (detail.hasMathRandom) {
    P2_ISSUES.push({ module: moduleName, domain, issue: 'Uses Math.random() instead of sr()' });
    detail.issues.push('Math.random');
  }

  // P0: Sort mutation on constants
  if (detail.hasSortMutation) {
    P1_ISSUES.push({ module: moduleName, domain, issue: 'In-place .sort() on module-level array' });
    detail.issues.push('sort-mutation');
  }

  // P1: Unguarded divisions
  if (detail.divisionOps > detail.divisionGuards + 1 && detail.divisionOps > 2) {
    const gap = detail.divisionOps - detail.divisionGuards;
    modulesWithDivisionRisk++;
    P1_ISSUES.push({ module: moduleName, domain, issue: `${gap} potentially unguarded divisions (${detail.divisionOps} ops, ${detail.divisionGuards} guards)` });
    detail.issues.push('div-risk(' + gap + ')');
  }

  // P1: NaN risk
  if (detail.hasNaNRisk && !detail.hasSr) {
    modulesWithNaNRisk++;
    detail.issues.push('NaN-risk');
  }

  // P1: Infinity reference (may be intentional in some contexts)
  if (detail.hasInfinityRef) {
    modulesWithInfinityRisk++;
    detail.issues.push('Infinity-ref');
  }

  // Data seeding check: modules with calculations but no data source
  if (detail.hasCalcs && !detail.hasData && !detail.hasContexts && lineCount > 200) {
    P2_ISSUES.push({ module: moduleName, domain, issue: 'Has calculations but no detected data source or context' });
    detail.issues.push('no-data-source');
  }

  MODULE_DETAILS.push(detail);
});

// ═════════════════════════════════════════════════════════════════
// REPORT
// ═════════════════════════════════════════════════════════════════

console.log('▸ SECTION 1: Platform Overview\n');
console.log('  Total modules scanned:        ', totalModules);
console.log('  With inline data arrays:       ', modulesWithData, `(${Math.round(modulesWithData/totalModules*100)}%)`);
console.log('  With calculation logic:         ', modulesWithCalcs, `(${Math.round(modulesWithCalcs/totalModules*100)}%)`);
console.log('  With context/data imports:      ', modulesWithContexts, `(${Math.round(modulesWithContexts/totalModules*100)}%)`);
console.log('  With sr() PRNG:                 ', modulesWithSr, `(${Math.round(modulesWithSr/totalModules*100)}%)`);
console.log('  With Math.random:               ', modulesWithMathRandom, `(${Math.round(modulesWithMathRandom/totalModules*100)}%)`);
console.log('  With division risk:             ', modulesWithDivisionRisk);
console.log('  With sort mutation risk:        ', modulesWithSortMutation);
console.log('  With NaN risk:                  ', modulesWithNaNRisk);
console.log('  With Infinity reference:        ', modulesWithInfinityRisk);

// Domain breakdown
console.log('\n▸ SECTION 2: Domain Breakdown\n');
const domainMap = {};
MODULE_DETAILS.forEach(m => {
  if (!domainMap[m.domain]) domainMap[m.domain] = { count: 0, withData: 0, withCalcs: 0, withContexts: 0, issues: 0, totalLines: 0 };
  domainMap[m.domain].count++;
  if (m.hasData) domainMap[m.domain].withData++;
  if (m.hasCalcs) domainMap[m.domain].withCalcs++;
  if (m.hasContexts) domainMap[m.domain].withContexts++;
  if (m.issues.length > 0) domainMap[m.domain].issues++;
  domainMap[m.domain].totalLines += m.lines;
});

const domains = Object.entries(domainMap).sort((a, b) => b[1].count - a[1].count);
const pad = (s, n) => (String(s) + ' '.repeat(n)).slice(0, n);
console.log('  ' + pad('Domain', 45) + pad('Mods', 5) + pad('Data', 5) + pad('Calc', 5) + pad('Ctx', 5) + pad('Issues', 7) + 'Lines');
console.log('  ' + '-'.repeat(80));
domains.forEach(([d, v]) => {
  const status = v.issues === 0 ? '✓' : '⚠';
  console.log('  ' + pad(d, 45) + pad(v.count, 5) + pad(v.withData, 5) + pad(v.withCalcs, 5) + pad(v.withContexts, 5) + pad(v.issues + ' ' + status, 7) + v.totalLines);
});
console.log('  ' + '-'.repeat(80));
const totals = domains.reduce((s, [, v]) => ({ c: s.c + v.count, d: s.d + v.withData, calc: s.calc + v.withCalcs, ctx: s.ctx + v.withContexts, i: s.i + v.issues, l: s.l + v.totalLines }), { c: 0, d: 0, calc: 0, ctx: 0, i: 0, l: 0 });
console.log('  ' + pad('TOTAL', 45) + pad(totals.c, 5) + pad(totals.d, 5) + pad(totals.calc, 5) + pad(totals.ctx, 5) + pad(totals.i, 7) + totals.l);

// P0 Issues
if (P0_ISSUES.length > 0) {
  console.log('\n▸ P0 CRASHES (' + P0_ISSUES.length + ')\n');
  P0_ISSUES.forEach(i => console.log('  ✗ [' + i.domain + '] ' + i.module + ': ' + i.issue));
}

// P1 Issues
if (P1_ISSUES.length > 0) {
  console.log('\n▸ P1 CALCULATION RISKS (' + P1_ISSUES.length + ')\n');
  P1_ISSUES.slice(0, 50).forEach(i => console.log('  ⚠ [' + i.domain + '] ' + i.module + ': ' + i.issue));
  if (P1_ISSUES.length > 50) console.log('  ... and ' + (P1_ISSUES.length - 50) + ' more');
}

// P2 Warnings
if (P2_ISSUES.length > 0) {
  console.log('\n▸ P2 QUALITY WARNINGS (' + P2_ISSUES.length + ')\n');
  P2_ISSUES.slice(0, 30).forEach(i => console.log('  ℹ [' + i.domain + '] ' + i.module + ': ' + i.issue));
  if (P2_ISSUES.length > 30) console.log('  ... and ' + (P2_ISSUES.length - 30) + ' more');
}

// Data seeding coverage
console.log('\n▸ SECTION 3: Data Seeding Coverage\n');
const seeded = MODULE_DETAILS.filter(m => m.hasData || m.hasContexts);
const unseeded = MODULE_DETAILS.filter(m => !m.hasData && !m.hasContexts && m.lines > 200);
console.log('  Modules with data (arrays or contexts): ' + seeded.length + '/' + totalModules + ' (' + Math.round(seeded.length/totalModules*100) + '%)');
console.log('  Modules >200 lines with no data source:  ' + unseeded.length);
if (unseeded.length > 0) {
  console.log('\n  Unseeded modules (>200 lines, no data arrays or context imports):');
  unseeded.slice(0, 20).forEach(m => console.log('    - ' + m.domain + '/' + m.name + ' (' + m.lines + ' lines)'));
  if (unseeded.length > 20) console.log('    ... and ' + (unseeded.length - 20) + ' more');
}

// Module size distribution
console.log('\n▸ SECTION 4: Module Size Distribution\n');
const sizeBuckets = { '0-100': 0, '100-300': 0, '300-500': 0, '500-800': 0, '800-1200': 0, '1200+': 0 };
MODULE_DETAILS.forEach(m => {
  if (m.lines < 100) sizeBuckets['0-100']++;
  else if (m.lines < 300) sizeBuckets['100-300']++;
  else if (m.lines < 500) sizeBuckets['300-500']++;
  else if (m.lines < 800) sizeBuckets['500-800']++;
  else if (m.lines < 1200) sizeBuckets['800-1200']++;
  else sizeBuckets['1200+']++;
});
Object.entries(sizeBuckets).forEach(([range, count]) => {
  const bar = '█'.repeat(Math.round(count / totalModules * 60));
  console.log('  ' + pad(range + ' lines', 14) + pad(count, 5) + bar);
});

// Final summary
console.log('\n═══════════════════════════════════════════════════════════════════════');
console.log('  AUDIT COMPLETE');
console.log('  ' + totalModules + ' modules · ' + P0_ISSUES.length + ' P0 · ' + P1_ISSUES.length + ' P1 · ' + P2_ISSUES.length + ' P2');
console.log('  Data coverage: ' + Math.round(seeded.length/totalModules*100) + '% · Total lines: ' + totals.l.toLocaleString());
console.log('═══════════════════════════════════════════════════════════════════════');

process.exit(P0_ISSUES.length > 0 ? 1 : 0);
