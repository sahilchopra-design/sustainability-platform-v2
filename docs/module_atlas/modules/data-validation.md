# Data Validation Engine
**Module ID:** `data-validation` · **Route:** `/data-validation` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Rule-based validation of ESG data submissions that flags type errors, range breaches, cross-field inconsistencies, and regulatory format violations. Validation rules are versioned and mapped to framework requirements, enabling traceable error remediation. Batch and real-time validation modes are supported.

> **Business value:** Prevents erroneous ESG data from reaching disclosures and analytics by catching errors at the point of ingestion. Versioned rule libraries ensure validation standards stay aligned with evolving regulatory frameworks, supporting audit-ready data pipelines.

**How an analyst works this module:**
- Import a data submission file or connect a real-time feed and assign it to a rule set
- Review the error report grouped by rule category and data domain
- Dispatch failed records to data owners with embedded remediation guidance
- Re-run validation after corrections and certify the clean batch for downstream use

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHECKS`, `COLORS`, `DEFAULT_RULES`, `LS_FIXES`, `LS_PORTFOLIO`, `LS_RULES`, `LS_SCAN_HIST`, `SEV_CLR`, `VALID_SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `pct` | `(n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `activeRules` | `useMemo(() => { return DEFAULT_RULES.map(r => { const ov = ruleOverrides[r.id];` |
| `stats` | `useMemo(() => { const total = companies.length * activeRules.length;` |
| `passed` | `total - violations;` |
| `fields` | `new Set(validationResults.map(v => v.field));` |
| `exchanges` | `new Set(companies.map(c => c._displayExchange \|\| 'N/A'));` |
| `sectors` | `[...new Set(companies.map(c => c.sector))];` |
| `vals` | `sectorCos.map(c => c[f]).filter(v => typeof v === 'number' && v > 0);` |
| `mean` | `vals.reduce((a, b) => a + b, 0) / vals.length;` |
| `std` | `Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);` |
| `catBarData` | `useMemo(() => Object.entries(stats.byCat).map(([k, v]) => ({ name: k, violations: v })).sort((a, b) => b.violations - a.violations), [stats]);` |
| `exchBarData` | `useMemo(() => Object.entries(stats.byExchange).map(([k, v]) => ({ name: k.length > 12 ? k.slice(0, 12) + '..' : k, violations: v })).sort((a, b) => b.violations - a.violations), [stats]);` |
| `sectorBarData` | `useMemo(() => Object.entries(stats.bySector).map(([k, v]) => ({ name: k.length > 15 ? k.slice(0, 15) + '..' : k, violations: v })).sort((a, b) => b.violations - a.violations), [stats]);` |
| `trendData` | `useMemo(() => Array.from({ length: 12 }, (_, i) => ({ month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i], passRate: Math.min(100, 72 + i * 2.3 + sRand(i * 7) * 3) })), []);` |
| `median` | `vals.length > 0 ? vals.sort((a, b) => a - b)[Math.floor(vals.length / 2)] : 0;` |
| `fixVal` | `field === 'sbti_committed' ? false : median > 0 ? Math.round(median * 100) / 100 : 50;` |
| `rows` | `filtered.map(v => `"${v.company}","${v.ticker}","${v.exchange}","${v.sector}","${v.field}","${v.rule}","${v.sev}","${v.cat}","${v.value ?? ''}","${v.autofix \|\| ''}"`).join('\n');` |
| `blob` | `new Blob([hdr + rows], { type: 'text/csv' });` |
| `report` | `{ generated: new Date().toISOString(), companies: companies.length, rulesActive: activeRules.length, summary: stats, violations: filtered.map(v => ({ company: v.company, ticker: v.ticker, field: v.field, rule: v.rule, se` |
| `badge` | `(color) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: color + '18', color, marginLeft: 6 });` |
| `categories` | `useMemo(() => [...new Set(DEFAULT_RULES.map(r => r.cat))], []);` |
| `sectorScore` | `sectorCos.length > 0 ? ((sectorCos.length * activeRules.length - sectorViolations.length) / (sectorCos.length * activeRules.length) * 100) : 100;` |
| `coverage` | `companies.length ? (hasData / companies.length) * 100 : 0;` |
| `topRule` | `sevViolations.reduce((acc, v) => { acc[v.ruleId] = (acc[v.ruleId] \|\| 0) + 1; return acc; }, {});` |
| `topRuleId` | `Object.entries(topRule).sort(([,a],[,b]) => b - a)[0];` |
| `exchCos` | `companies.filter(c => (c._displayExchange \|\| 'N/A') === exch);` |
| `exchScore` | `exchCos.length > 0 ? ((exchCos.length * activeRules.length - exchViols.length) / (exchCos.length * activeRules.length) * 100) : 100;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `DEFAULT_RULES`, `TABS`, `VALID_SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Validation Pass Rate | — | Rule engine | Share of records passing all assigned validation rules without blocking errors |
| Blocking Errors | — | Error classification engine | Count of records with at least one error that must be resolved before acceptance |
| Warning Flags | — | Rule engine | Non-blocking anomalies surfaced for data owner review without halting ingestion |
| Rule Library Size | — | Rule registry | Total active validation rules across all frameworks and data domains |
- **ESG data submissions (file upload, API, SFTP)** → Atomic rule evaluation: type checks, range guards, regex patterns, cross-field logic → **Error and warning inventory with field-level attribution**
- **Framework rule libraries (ESRS, GRI, XBRL)** → Rule-to-framework mapping and version control → **Compliance gap report per framework**
- **Remediation workflow system** → Error dispatch to data owners with rule explanation and fix guidance → **Remediation audit trail with timestamps**

## 5 · Intermediate Transformation Logic
**Methodology:** Validation Pass Rate
**Headline formula:** `VPR = (Records − Errors) / Records × 100`

Every submitted record is evaluated against a library of atomic rules (type, range, regex, cross-field, referential integrity); failures are classified as blocking errors or warnings. The pass rate and error inventory are surfaced per submission batch and data domain.

**Standards:** ['ESRS 2 BP-1', 'GRI 2-5', 'XBRL Taxonomy Validation']
**Reference documents:** ESRS 2 (2023) BP-1 General basis for preparation of sustainability statements; GRI Standards 2021 â€” GRI 2-5 External assurance; XBRL International (2023) ESG Taxonomy Validation Rules; SEC (2024) Climate Disclosure Rule — Data Tagging Requirements

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module is a **genuine rule engine**, not a synthetic display. The guide's "Validation Pass Rate"
`VPR = (Records − Errors)/Records × 100` and its rule-library concept are faithfully implemented —
though the actual library is **50 rules across 8 categories**, not the guide's advertised "1,240". No
⚠️ mismatch on methodology; only the rule-count headline is illustrative.

### 7.1 What the module computes

Every company in `GLOBAL_COMPANY_MASTER` (or the saved portfolio) is run against every enabled rule.
A rule is a pure boolean predicate `check(company) → true(pass) | false(violation)`:

```js
activeRules = DEFAULT_RULES.map(apply overrides).filter(r => r.enabled)
total       = companies.length × activeRules.length
violations  = for each (company, rule): !CHECKS[rule.check](company)  → one row
passRate    = (total − violations.length) / total × 100
```

The 50 predicates live in the `CHECKS` map and cover: **Identity** (name/ticker/ISIN/sector format),
**Financial** (positivity, EVIC≥0.8·MCap, P/Revenue 0.1–100×, rev/employee $10K–$5M),
**ESG** (0–100 ranges, not-default-50, high-carbon ESG cap), **Emissions** (S1/S2 ≥ 0, sanity
<1000 Mt, intensity consistency), **Climate targets** (NZ year 2025–2100, SBTi boolean),
**Cross-referential** (EVIC = MCap + Debt, intensity = (S1+S2)·1e6/Rev), **Temporal**, **Sector**.

### 7.2 Rule rubric — severities & auto-fixes

| Category | # rules | example predicate (from `CHECKS`) | critical rules |
|---|---|---|---|
| Identity | 5 | `ticker_format: /^[A-Z0-9.]{1,10}$/i` | name, ticker |
| Financial | 10 | `evic_ge_mcap: evic ≥ 0.8·mcap` | revenue>0, mcap>0 |
| ESG | 10 | `esg_range: 0 ≤ esg ≤ 100` | — |
| Emissions | 10 | `ghg_intensity_consistency: |calc−reported|/calc < 0.5` | s1≥0, s2≥0 |
| Climate | 5 | `nz_year_range: 2025 ≤ y ≤ 2100` | — |
| Cross-Ref | 5 | `evic_decomposition: |evic−(mcap+debt)|/evic < 0.5` | — |
| Temporal | 3 | `mcap_updated: mcap > 0` | — |
| Sector | 2 | `it_employee_floor: IT ⇒ employees > 100` | — |

Severities: `critical` (red), `high`, `medium`, `low`. `sev` and `enabled` are user-overridable
(persisted `ra_validation_rules_v1`). Each rule optionally names an **auto-fix** strategy
(e.g. "Sector median", "Clamp 0-100", "Recalc from S1+S2/Rev") — the actual fix value is computed at
apply-time (`fixVal` = sector median, or 50 baseline, or `false` for booleans). Thresholds are
sensible sanity bounds, not from a named external standard — engineering heuristics for ESG data QA.

### 7.3 Calculation walkthrough

1. Resolve `activeRules` (apply enable/severity overrides).
2. For each company × rule, evaluate `CHECKS[rule.check](company)`; a `false` emits a violation row
   `{company, ticker, exchange, sector, field, rule, sev, cat, value}`.
3. `stats` aggregates: `total`, `violations`, `passed = total − violations`, and breakdowns
   `byCat / byExchange / bySector` (violation counts) plus per-sector z-score context
   (`mean`, `std` over sector peers for the flagged field).
4. **Auto-fix** (`fixVal`): for a fixable field it computes the sector **median** of positive values,
   or `false` for `sbti_committed`, or 50 fallback; writes to `ra_validation_fixes_v1`.
5. `trendData` renders a 12-month improving pass-rate line (`72 + i·2.3 + sRand·3`) — cosmetic.

### 7.4 Worked example

Take a Financials company with `market_cap_usd_mn = 8000`, `revenue_usd_mn = 40`, `scope1_mt = 3`:

| Rule | check | result |
|---|---|---|
| V011 mcap_positive | 8000 > 0 | pass |
| V015 p_revenue_ratio | 8000/40 = **200** ∉ (0.1,100) | **violation (low)** |
| V070 financials_low_s1 | Financials ⇒ s1 < 1? 3 < 1 false | **violation (low)** |
| V030 s1_non_negative | 3 ≥ 0 | pass |

If the portfolio is 500 companies × 50 rules = 25,000 checks and 812 fail,
`passRate = (25000 − 812)/25000 = 96.75%`. The P/Revenue outlier (200×) is a real data-quality flag —
a bank valuation platform 200× P/S is almost always a units error (revenue in $ vs $mn).

### 7.5 Data provenance & limitations

- **Company base data is real** (BRSR/EODHD/curated master); the rule engine runs deterministically
  over it — **no PRNG drives validation results**. The only synthetic touch is the cosmetic 12-month
  `trendData` line (uses `sRand`), and `seed`/`sRand` helpers are defined but not used in scoring.
- Two predicates are stubs: `esg_sector_consistency` returns `true` unconditionally (V024 never fires),
  so the effective active rule set is ~49.
- Thresholds are heuristic sanity bounds, not codified from XBRL/ESRS taxonomies; a production engine
  would bind each rule to a specific framework assertion (see guide's XBRL mapping intent).
- No true batch/real-time ingestion split; it validates the in-memory master snapshot.

**Framework alignment:** ESRS 2 BP-1 (basis of preparation / data controls) and GRI 2-5 (assurance)
both require documented data-quality controls — this rule library is a concrete control layer. XBRL
taxonomy validation (the guide's third standard) is the natural home for these atomic checks in a
regulatory filing pipeline: each `CHECKS` predicate maps to an XBRL calculation/dimension assertion
(e.g. `evic_decomposition` ↔ an XBRL calculation link EVIC = MCap + Debt). PCAF data-quality scoring
is adjacent — completeness rules (`*_present`) feed a DQ score, though this page reports pass/fail
rather than a 1–5 DQ grade.

## 9 · Future Evolution

### 9.1 Evolution A — Framework-bound assertions and batch ingestion (analytics ladder: rung 2 → 3)

**What.** §7 rates this "a genuine rule engine, not a synthetic display": 50 real
boolean predicates across 8 categories run deterministically over real company
data, with user-overridable severities, auto-fix strategies, and a correct
`VPR = (Records − Errors)/Records` — no PRNG in scoring. The scoped gaps: the
`esg_sector_consistency` predicate is a stub returning `true` unconditionally
(V024 never fires), thresholds are engineering heuristics unbound to the
XBRL/ESRS assertions the guide intends, there is no batch/real-time ingestion
split (it validates the in-memory master snapshot), and the guide's "1,240 rules"
headline oversells the 50. Evolution A hardens and binds.

**How.** (1) Fix or remove the V024 stub (a rule that always passes is worse than
none — it inflates pass rates). (2) Framework binding: annotate each predicate
with the assertion it operationalizes (e.g. `evic_decomposition` ↔ an XBRL
calculation link; range checks ↔ ESRS datapoint types from the taxonomy the
`csrd-ixbrl` evolution ingests), so error reports cite the regulatory basis — the
rung-3 benchmark discipline for a validation engine. (3) Batch mode: validate
uploaded submissions and captured records server-side (sharing
`data-capture-hub`'s `validateRecord` service so the platform has one validation
layer, not three), persisting per-batch VPR and certifications. (4) Correct the
guide's rule count; grow the library where framework binding reveals gaps rather
than to hit a number.

**Prerequisites.** The shared validation service decision (this module's engine
is the strongest candidate to become it); taxonomy ingestion for binding.
**Acceptance:** V024 fires on a constructed violation or is gone; every rule's
error message cites its bound assertion; a batch re-run after corrections shows
the VPR delta and produces a certification record.

### 9.2 Evolution B — Remediation-guidance copilot on the error report (LLM tier 1)

**What.** The workflow promises "dispatch failed records to data owners with
embedded remediation guidance" — the guidance being the human-labor part.
Evolution B generates it per violation: what the rule checks and why (from the
Evolution A framework binding), what the offending value looks like against
peers (sector median context the auto-fix machinery already computes), the
recommended fix with its auto-fix strategy where one exists, and the confidence
caveat when the "violation" may be a scope/unit mismatch rather than an error —
the most common false positive in ESG data QA.

**How.** Tier-1 over the deterministic engine's violation rows plus the rule
metadata; no new backend needed until dispatch persistence exists. The copilot
never applies fixes — auto-fix application stays a human-confirmed deterministic
action; the copilot's product is the explanation and triage ordering. Grounding
includes each rule's framework citation so guidance reads as regulatory
requirement, not house opinion.

**Prerequisites.** Evolution A's framework binding (guidance quoting "sanity
bound" is weaker than guidance quoting an ESRS datapoint type); dispatch
persistence for delivery. **Acceptance:** guidance for each violation category
cites the bound assertion; suspected scope/unit mismatches are flagged as such
rather than commanded fixed; triage ordering matches severity × downstream-usage
arithmetic.