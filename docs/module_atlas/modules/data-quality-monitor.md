# Data Quality Monitor
**Module ID:** `data-quality-monitor` · **Route:** `/data-quality-monitor` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Continuous monitoring of ESG data quality across completeness, accuracy, consistency, and timeliness dimensions. Automated scoring surfaces data gaps and anomalies before they propagate into disclosures or analytics. Threshold-based alerting notifies data stewards of quality degradation in real time.

> **Business value:** Enables data stewards and risk officers to maintain disclosure-grade ESG data quality across all platform inputs. Identifies root-cause providers and fields driving quality degradation, supporting audit readiness and regulatory defensibility.

**How an analyst works this module:**
- Set staleness and completeness thresholds per dataset in Settings > DQ Rules
- Review the dimension heat-map to identify which providers drive the lowest accuracy scores
- Drill into flagged fields using the anomaly table and dispatch remediation tasks to data owners
- Export the DQ scorecard as PDF for audit committee or regulator submission

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `DQ_DIMENSIONS`, `DQ_FIELDS`, `EXCHANGE_COLORS`, `KPICard`, `LS_PORT`, `PIE_COLORS`, `QUALITY_RULES`, `SEVERITY_COLORS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DQ_DIMENSIONS` | 7 | `name`, `description`, `weight`, `icon` |
| `QUALITY_RULES` | 10 | `rule`, `check`, `severity` |
| `TABS` | 5 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v => v == null ? '--' : typeof v === 'number' ? v.toLocaleString() : String(v);` |
| `fmtPct` | `v => v == null ? '--' : `${v.toFixed(1)}%`;` |
| `completeness` | `(present / DQ_FIELDS.length) * 100;` |
| `accuracy` | `violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 15);` |
| `consistency` | `80 + (company._displayExchange === 'NSE/BSE' ? 10 : sr(_sc++) * 10);` |
| `validity` | `violations.length === 0 ? 100 : Math.max(50, 100 - violations.length * 10);` |
| `dqData` | `useMemo(() => companies.map(c => computeCompanyDQ(c)), [companies]);` |
| `avgComposite` | `useMemo(() => Math.round(dqData.reduce((a, d) => a + d.composite, 0) / Math.max(1, dqData.length)), [dqData]);` |
| `avgCompleteness` | `useMemo(() => Math.round(dqData.reduce((a, d) => a + d.completeness, 0) / Math.max(1, dqData.length)), [dqData]);` |
| `avgAccuracy` | `useMemo(() => Math.round(dqData.reduce((a, d) => a + d.accuracy, 0) / Math.max(1, dqData.length)), [dqData]);` |
| `avgTimeliness` | `useMemo(() => Math.round(dqData.reduce((a, d) => a + d.timeliness, 0) / Math.max(1, dqData.length)), [dqData]);` |
| `criticalViolations` | `dqData.reduce((a, d) => a + d.violations.filter(v => v.severity === 'critical').length, 0);` |
| `highViolations` | `dqData.reduce((a, d) => a + d.violations.filter(v => v.severity === 'high').length, 0);` |
| `exchanges` | `useMemo(() => [...new Set(dqData.map(d => d.exchange).filter(Boolean))].sort(), [dqData]);` |
| `sectors` | `useMemo(() => [...new Set(dqData.map(d => d.sector).filter(Boolean))].sort(), [dqData]);` |
| `histogram` | `useMemo(() => { const buckets = [ { range: '0-20', min: 0, max: 20, count: 0 }, { range: '20-40', min: 20, max: 40, count: 0 }, { range: '40-60', min: 40, max: 60, count: 0 }, { range: '60-80', min: 60, max: 80, count: 0 }, { range: '80-100', min: 80, max: 101, count: 0 }, ];` |
| `radarData` | `useMemo(() => DQ_DIMENSIONS.map(dim => ({` |
| `fieldCompleteness` | `useMemo(() => { return DQ_FIELDS.map(field => { const row = { field: field.replace(/_/g, ' ') };` |
| `worst20` | `useMemo(() => [...dqData].sort((a, b) => a.composite - b.composite).slice(0, 20), [dqData]);` |
| `trendData` | `useMemo(() => { return Array.from({ length: 12 }, (_, i) => ({ month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i], completeness: Math.min(100, 45 + i * 4.5 + sr(_sc++) * 3), accuracy: Math.min(100, 70 + i * 2.2 + sr(_sc++) * 2), composite: Math.min(100, 55 + i * 3.5 + sr(_sc++) * 2.5), }));` |
| `mean` | `arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;` |
| `std` | `arr => { const m = mean(arr); return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, arr.length)); };` |
| `gapPlan` | `useMemo(() => { return exchanges.map(ex => { const exData = dqData.filter(d => d.exchange === ex);` |
| `recommendedSource` | `ex === 'NSE/BSE' ? 'Supabase BRSR' : gapFields.some(f => f.includes('scope')) ? 'EODHD + manual enrichment' : 'EODHD Fundamentals';` |
| `csv` | `[headers.join(','), ...rows.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `rows` | `dqData.map(d => ({ ...d, missing_fields: d.missing_fields.join('; ') }));` |
| `passRate` | `totalWithField > 0 ? Math.round((totalWithField - vCount) / totalWithField * 100) : 100;` |
| `avg` | `Math.round(dqData.reduce((a, d) => a + (d[dim.id] \|\| 0), 0) / Math.max(1, dqData.length));` |
| `top25` | `[...dqData].sort((a, b) => b.completeness - a.completeness).slice(0, 25);` |
| `fieldsPresent` | `DQ_FIELDS.length - d.missing_fields.length;` |
| `avgComp` | `Math.round(secData.reduce((a, d) => a + d.completeness, 0) / Math.max(1, secData.length));` |
| `avgAcc` | `Math.round(secData.reduce((a, d) => a + d.accuracy, 0) / Math.max(1, secData.length));` |
| `fullPct` | `Math.round(secData.filter(d => d.completeness === 100).length / Math.max(1, secData.length) * 100);` |
| `critCount` | `secData.reduce((a, d) => a + d.violations.filter(v => v.severity === 'critical').length, 0);` |
| `tiers` | `[1,2,3,4,5].map(t => exData.filter(d => d.pcaf_tier === t).length);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DQ_DIMENSIONS`, `DQ_FIELDS`, `EXCHANGE_COLORS`, `PIE_COLORS`, `QUALITY_RULES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Platform DQ Score | — | Internal rule engine | Overall weighted composite; scores below 0.75 trigger amber alert |
| Completeness Rate | — | Field presence audit | Share of mandatory fields populated across all active data feeds |
| Accuracy Violations | — | Range & logic checks | Count of values failing validation rules in the current reporting period |
| Stale Records (>30d) | — | Timestamp audit | Records whose last-updated timestamp exceeds the staleness threshold |
- **ESG data providers (API / SFTP)** → Field-level rule evaluation against type, range, and cross-field logic → **Per-field and per-record DQ scores**
- **Internal emissions database** → Completeness audit against mandatory disclosure field list → **Completeness rate and gap inventory**
- **Timestamp metadata** → Comparison of last-updated vs. staleness threshold → **Stale record count and ageing histogram**

## 5 · Intermediate Transformation Logic
**Methodology:** DQ Composite Score
**Headline formula:** `DQS = w₁×Completeness + w₂×Accuracy + w₃×Consistency + w₄×Timeliness`

Each dimension is scored 0–1 using rule-based checks; weights default to 0.30/0.30/0.25/0.15 but are configurable per dataset. The composite score rolls up to entity, portfolio, and platform levels with drill-down to individual fields.

**Standards:** ['PCAF Data Quality Score', 'ISO 8000', 'GRI 2-4']
**Reference documents:** PCAF (2022) Data Quality Guidance for Financed Emissions; ISO 8000-8: Data Quality â€” Concepts and Measuring; SASB Conceptual Framework § Data Quality

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide matches the code well: a **DQ composite score** `DQS = w₁·Completeness + w₂·Accuracy +
w₃·Consistency + w₄·Timeliness` over ESG data. The code goes further with 6 weighted dimensions and —
crucially — computes **completeness and accuracy from real company records** (`GLOBAL_COMPANY_MASTER`)
via genuine field-presence and rule-violation checks. Only timeliness/uniqueness are static and
consistency is partly seeded. This is a real DQ engine, not a mock. Minor deviation: the guide states
weights 0.30/0.30/0.25/0.15; the code uses 0.25/0.20/0.20/0.15/0.10/0.10 across 6 dimensions.

### 7.1 What the module computes

`computeCompanyDQ(company)` — per real company:
```js
present      = DQ_FIELDS.filter(f => company[f] not null and ≠ 0).length      // real
completeness = present / DQ_FIELDS.length · 100                               // real
violations   = QUALITY_RULES.filter(r => !r.check(company[r.field]))          // real rule engine
accuracy     = violations==0 ? 100 : max(0, 100 − violations·15)              // real
validity     = violations==0 ? 100 : max(50, 100 − violations·10)             // real
timeliness   = 85                                                            // static
uniqueness   = 98                                                            // static
consistency  = 80 + (exchange==='NSE/BSE' ? 10 : sr()·10)                     // part-seeded
composite    = 0.25·comp + 0.20·acc + 0.20·time + 0.15·cons + 0.10·uniq + 0.10·valid
```

### 7.2 Parameterisation / scoring rubric

| Dimension | Weight | How computed | Provenance |
|---|---|---|---|
| Completeness | 0.25 | non-null non-zero fields / 10 | **real** (from company record) |
| Accuracy | 0.20 | `100 − 15·violations` | **real** (rule engine) |
| Timeliness | 0.20 | fixed 85 | static assumption |
| Consistency | 0.15 | `80 + 10` (India) or `80 + sr·10` | part-seeded |
| Uniqueness | 0.10 | fixed 98 | static assumption |
| Validity | 0.10 | `100 − 10·violations` | **real** (rule engine) |
| Quality rules | — | 9 rules: revenue>0, esg 0-100, scope≥0, targetYear 2020-2100… | **real** validation logic |
| PCAF tier | — | derived per company | maps to PCAF DQ scale 1–5 |

### 7.3 Calculation walkthrough

Portfolio companies loaded from `localStorage`/`GLOBAL_COMPANY_MASTER` → `computeCompanyDQ` per company
→ platform averages (`avgComposite`, `avgCompleteness`, `avgAccuracy`), critical/high violation counts,
histogram, dimension radar, per-field completeness, worst-20 table, and a per-exchange gap plan that
recommends a data source (e.g. NSE/BSE → Supabase BRSR; scope gaps → EODHD + manual). Trend series is a
seeded 12-month ramp.

### 7.4 Worked example (one company)

Company with 7 of 10 `DQ_FIELDS` populated, 1 rule violation (esg_score = 105, out of 0–100):
```
completeness = 7/10·100 = 70
accuracy     = 100 − 1·15 = 85
validity     = 100 − 1·10 = 90
timeliness   = 85 ; uniqueness = 98 ; consistency = 80 + sr·10 ≈ 85
composite    = 0.25·70 + 0.20·85 + 0.20·85 + 0.15·85 + 0.10·98 + 0.10·90
             = 17.5 + 17.0 + 17.0 + 12.75 + 9.8 + 9.0 = 83.05 → 83
```
Completeness, accuracy and validity are genuinely derived from the company's real fields and the rule
engine; only timeliness/uniqueness are assumed and consistency lightly seeded.

### 7.5 Data provenance & limitations

- **Completeness, accuracy, validity are computed from real company data** and a real 9-rule engine —
  the module's core is genuine.
- **Timeliness (85) and uniqueness (98) are static**; consistency is `80 + seeded/India-bonus`; the
  trend series is a seeded ramp.
- No cross-source consistency check actually compares providers (consistency is a placeholder despite
  the guide describing MSCI-vs-Sustainalytics divergence).

**Framework alignment:** PCAF Data Quality Score 1–5 (per-company tier) · ISO 8000 data-quality
dimensions · GRI 2-4 · DAMA DMBOK dimensions. The completeness/accuracy/validity computation is a
faithful rule-based DQ implementation; timeliness/uniqueness/consistency need real telemetry.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Timeliness, uniqueness and cross-source
consistency are static/seeded placeholders.

**8.1 Purpose & scope.** Continuous, provider-aware DQ scoring across completeness, accuracy,
timeliness, consistency, uniqueness and validity for every ESG data feed, with staleness alerting.

**8.2 Conceptual approach.** A **rule-based multi-dimensional DQ score** with real timestamp and
cross-provider telemetry — the DAMA DMBOK / ISO 8000 model as operationalised in Great Expectations /
Soda-style data-quality frameworks; PCAF tiering for GHG fields.

**8.3 Mathematical specification.**
```
Completeness = populated_required / required                        (real, exists)
Accuracy     = 1 − failed_range_checks / total_checks               (real, exists)
Timeliness   = clamp(0,1, 1 − age / SLA_max(field_type))            # from last_updated timestamp
Consistency  = 1 − mean_field |value_A − value_B| / tolerance       # cross-provider
Uniqueness   = 1 − duplicate_records / total                        # entity-resolution
DQS = Σ_d w_d·dim_d ;  PCAF_tier = f(measured vs proxy provenance)
```

| Parameter | Source |
|---|---|
| `last_updated` timestamps | ingestion metadata |
| Cross-provider values | multi-source hub (MSCI vs Sustainalytics) |
| Duplicate detection | LEI/ISIN entity resolution |
| SLA_max per field type | governance policy |

**8.4 Data requirements.** Per-field timestamps, provider-tagged values, entity IDs, rule library
(exists). Sources: ingestion layer, data-hub. Completeness/accuracy already real.

**8.5 Validation & benchmarking.** Backtest staleness alerts against known refresh gaps; verify
consistency against known provider divergences; benchmark composite against PCAF tier distribution.

**8.6 Limitations & model risk.** Static timeliness/uniqueness mask real degradation; single tolerance
for consistency is crude. Fallback: surface raw last-updated ages and provider deltas alongside scores.

## 9 · Future Evolution

### 9.1 Evolution A — Sense the three placeholder dimensions (analytics ladder: rung 2 → 3)

**What.** §7 rates this "a real DQ engine, not a mock": completeness and
accuracy/validity are computed from real company records via genuine field-presence
checks and a real 9-rule engine, with PCAF tiering per company. The honest gaps:
timeliness is a fixed 85, uniqueness a fixed 98, consistency is
`80 + (India ? 10 : sr·10)` — "no cross-source consistency check actually compares
providers" — the trend series is a seeded ramp, and the code's 6-dimension weights
(0.25/0.20/0.20/0.15/0.10/0.10) silently deviate from the guide's four-bucket
0.30/0.30/0.25/0.15. Evolution A measures the placeholders.

**How.** (1) Timeliness: per-record data vintage (BRSR filing year, enrichment
fetch timestamp) against the reporting period — the capture layer stores
timestamps; score by documented age bands. (2) Uniqueness: actual duplicate
detection over the company master via the GLEIF/ISIN spine (the platform's entity
resolution exists) — measured duplicate rate replaces 98. (3) Consistency: compare
the same metric across the sources `company-profiles` actually holds (BRSR-reported
vs enrichment-fetched) with a documented divergence threshold — deleting the seeded
India bonus. (4) Weight reconciliation: publish one canonical weight set and update
guide or code to match. (5) Trend from stored monthly DQ snapshots instead of the
seeded ramp — giving stewards the degradation-over-time view the module's alerting
promise needs.

**Prerequisites.** Source timestamps propagated through the capture layer;
snapshot scheduling; coordination with `data-quality-dashboard`'s shared violations
store. **Acceptance:** a stale record moves its company's timeliness; a constructed
duplicate is caught by the uniqueness measure; consistency changes when a
provider's value diverges; zero static/seeded dimension values remain.

### 9.2 Evolution B — Remediation-dispatch assistant for data owners (LLM tier 1 → 2)

**What.** The module's workflow ends at "dispatch remediation tasks to data
owners" — currently manual reading of the worst-20 table. Evolution B drafts the
dispatch: for each flagged company/field, a remediation ticket naming the failing
rule (from the real rule engine's output), the current value and why it violates,
the recommended source from the module's own gap-plan mapping (NSE/BSE → BRSR
Supabase; scope gaps → EODHD + manual), and the PCAF-tier improvement the fix would
deliver — batched per data owner, prioritized by composite-score impact.

**How.** Tier 1 over the computed DQ payloads (all real for
completeness/accuracy/validity today); tier 2 when tickets persist server-side,
with dispatch as a gated write into the steward workflow shared with
`data-governance`. The prioritization is deterministic arithmetic (weight × gap)
the assistant explains rather than invents; every ticket's claims reproduce from
`computeCompanyDQ` output.

**Prerequisites.** Evolution A for tickets touching the placeholder dimensions
(a timeliness ticket against a fixed 85 would be fiction); ticket persistence for
tier 2. **Acceptance:** every ticket cites a real rule violation or measured gap;
priority ordering matches the documented weight×gap arithmetic; fixing the cited
field visibly moves the company's composite on the next computation.