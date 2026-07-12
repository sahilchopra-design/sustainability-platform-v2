# IRIS+ Metrics
**Module ID:** `iris-metrics` · **Route:** `/iris-metrics` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Comprehensive implementation of the GIIN IRIS+ system for impact measurement and management, covering all five impact dimensions of the Impact Management Project framework. Enables impact investors to select, calculate, and benchmark standardised metrics across thematic areas including climate, agriculture, health, education, and financial inclusion. Supports alignment with SDG targets and generates investor-ready impact reports.

> **Business value:** Provides impact fund managers with a rigorous, standardised framework for measuring and communicating portfolio impact, satisfying LP due diligence requirements and enabling credible comparison of impact performance across strategies.

**How an analyst works this module:**
- Select thematic areas and SDG priorities relevant to the fund mandate to filter the IRIS+ metric catalogue
- Map each portfolio company to applicable IRIS+ metrics and enter reported values from annual impact reports
- Review benchmark comparisons to GIIN Navigating Impact sector medians
- Assess IMP five-dimension completeness to identify gaps in contribution and risk reporting
- Generate standardised impact report output aligned with OPIM Principle 7 disclosure requirements

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_METRICS`, `Badge`, `Card`, `DIM_KEYS`, `GIIN_BENCHMARKS`, `IRIS_METRICS`, `KPI`, `LS_IRIS`, `SDG_COLORS`, `SDG_NAMES`, `SortHeader`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ALL_METRICS` | `DIM_KEYS.flatMap(dk => IRIS_METRICS[dk].metrics.map(m => ({ ...m, dimension: dk, dimName: IRIS_METRICS[dk].name, dimColor: IRIS_METRICS[dk].color })));` |
| `fmt` | `(v, d = 1) => v == null \|\| isNaN(v) ? '--' : Number(v).toFixed(d);` |
| `fmtK` | `v => { if (v == null \|\| isNaN(v)) return '--'; if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`; if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}K`; return v.toFixed(0); };` |
| `seed` | `(company.company_id \|\| '').split('').reduce((s, c) => s + c.charCodeAt(0), 0);` |
| `rng` | `(off) => { let x = Math.sin(seed + off + 1) * 10000; return x - Math.floor(x); };` |
| `avgScore` | `DIM_KEYS.reduce((s, dk) => s + (scores[`_dim_${dk}`] \|\| 0), 0) / 5;` |
| `evidenceQual` | `scores['PI1595']?.value ? Math.round(scores['PI1595'].value / 20) \|\| 3 : 3;` |
| `data` | `useMemo(() => holdings.map(h => {` |
| `agg` | `useMemo(() => { const avgScore = data.reduce((s, d) => s + d.avgScore, 0) / (data.length \|\| 1);` |
| `totalRev` | `data.reduce((s, d) => s + (d.revenue_usd_mn \|\| 0), 0);` |
| `impactRevPct` | `totalRev > 0 ? data.reduce((s, d) => s + (d[ALL_METRICS.find(m => m.id === 'OI4114')?.id]?.value \|\| 0), 0) / totalRev * 100 : 0;` |
| `totalBeneficiaries` | `data.reduce((s, d) => s + (d['PI1104']?.value \|\| 0), 0);` |
| `totalGhg` | `data.reduce((s, d) => s + (d['OI8869']?.value \|\| 0), 0);` |
| `avgEvidence` | `data.reduce((s, d) => s + d.evidenceQual, 0) / (data.length \|\| 1);` |
| `radarData` | `useMemo(() => DIM_KEYS.map(dk => ({` |
| `header` | `['Company', 'Sector', ...ALL_METRICS.map(m => m.id + '_' + m.name.replace(/,/g, '')), 'Avg_Score', 'Evidence_Tier'].join(',');` |
| `rows` | `data.map(d => [d.company_name \|\| d.company_id, d.sector, ...ALL_METRICS.map(m => fmt(d[m.id]?.value, 2)), fmt(d.avgScore, 1), d.evidenceQual].join(','));` |
| `blob` | `new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });` |
| `addScore` | `Math.min(100, innov * 0.6 + (cap > 0 ? 30 : 0) + 10);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| IRIS+ Metric Coverage | — | GIIN IRIS+ Catalogue 2023 | Number of standardised metrics available across 18 thematic areas |
| SDG Alignment Score | — | UN SDG indicator crosswalk | Proportion of reported metrics mapping to Priority SDG targets |
| Additionality Score | — | IMP Contribution dimension | Investor contribution rating distinguishing additionality from market-rate activity |
| Reach (beneficiaries) | — | IRIS PI9468 / OI7087 | Number of individuals or enterprises directly benefiting from investee activities |
- **Investee annual impact reports / survey data** → Map reported KPIs to IRIS+ catalogue identifiers; validate units and coverage period → **Standardised metric values per investee per reporting year**
- **GIIN Navigating Impact benchmark database** → Match sector and geography; extract peer-group quartile distributions → **Benchmark percentile ranking per metric per investee**
- **SDG indicator crosswalk table** → Link each reported IRIS+ metric to one or more SDG target codes → **SDG contribution map for fund-level impact narrative**

## 5 · Intermediate Transformation Logic
**Methodology:** Standardised Impact Metrics
**Headline formula:** `Impact Scoreᵢ = Σⱼ (wⱼ × Normalised Metricᵢⱼ)`

Portfolio impact is aggregated across IMP’s five dimensions: What, Who, How Much, Contribution, and Risk. Each IRIS+ metric is normalised to a 0–100 scale relative to sector benchmarks and weighted by strategic importance. The composite score enables cross-portfolio comparability while preserving metric-level transparency.

**Standards:** ['GIIN IRIS+ System 2023', 'Impact Management Project Five Dimensions', 'UN SDG Indicators Framework', 'Operating Principles for Impact Management']
**Reference documents:** GIIN IRIS+ Catalogue and Thematic Taxonomy 2023; Impact Management Project â€” Five Dimensions of Impact; UN Sustainable Development Goals Indicator Framework 2030; Operating Principles for Impact Management (IFC) 2019; GIIN Annual Impact Investor Survey 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The MODULE_GUIDES entry is accurate on structure: the module implements a **genuine GIIN IRIS+
catalogue** (real metric IDs — PI9468 Clean Energy, OI8869 GHG Reduced, PI1595 Evidence Quality…)
organised across the Impact Management Project's **five dimensions** (What / Who / How Much /
Contribution / Risk), with SDG mapping and GIIN benchmark medians. The scoring engine normalises each
metric to 0–100 and averages by dimension. The important caveat: **metric values are user-entered
where available, otherwise a seeded fallback** — so an un-populated company's "impact" is a
`Math.sin`-hashed placeholder, not real reported data.

### 7.1 What the module computes

`computeIrisScores(company, irisData)` produces per-metric values, per-dimension scores, and a
composite. Values prefer user input, else a seeded draw scaled to the metric's unit:

```js
seed = Σ charCodeAt(company_id) ; rng(off) = frac(sin(seed+off+1)·10⁴)
value = userVal ?? ( rng(...)·(unit==='%'?80 : unit==='count'?rev·50 : unit==='USD Mn'?rev·0.15
                                : unit.includes('score')?70 : rev·10) + (unit==='%'?10:5) )     // relevant metrics
      | rng(...)·20                                                                              // non-relevant
dimScore  = min(100, Σ min(100, value/denom·100) / #relevantMetrics)          // per dimension
avgScore  = Σ dimScore / 5
evidenceQual = round(PI1595.value / 20) || 3                                   // maps to 1–5 tier
```

### 7.2 Parameterisation / provenance

| Element | Value | Provenance |
|---|---|---|
| `IRIS_METRICS` catalogue | 25 metrics × 5 IMP dimensions, real IDs (PI/OI codes) | GIIN IRIS+ System — **authentic identifiers** |
| SDG mapping per metric | e.g. PI9468 → SDG 7,13 | Real IRIS+ SDG crosswalk |
| `GIIN_BENCHMARKS` | what 62, who 55, how_much 48, contribution 40, risk 58 | GIIN Navigating Impact sector medians |
| `sector_relevance` gating | 'All' or GICS sector | Determines which metrics count |
| Value scaling by unit | %→0–80, count→rev·50, USD Mn→rev·0.15, score→0–70 | **Synthetic fallback** heuristic |
| Seed | char-code sum of `company_id` | Deterministic per company |
| Evidence tier | value/20 → 1–5 | IRIS+ Risk dimension (1=RCT … 5=anecdotal) |
| `GLOBAL_COMPANY_MASTER` | imported company list | Platform company master |

### 7.3 Calculation walkthrough

1. For each holding/company, `computeIrisScores` iterates the 25 metrics; relevant metrics (by sector)
   take user data or a unit-scaled seeded value; non-relevant metrics get a small seeded value.
2. Each metric value is normalised to ≤100 against a unit-specific denominator; the dimension score is
   the mean over relevant metrics.
3. `avgScore` = mean of the five dimension scores; `evidenceQual` derives a 1–5 tier from PI1595.
4. Portfolio aggregates: mean avgScore, total impact revenue (OI4114), total beneficiaries (PI1104),
   total GHG reduced (OI8869), mean evidence tier; radar of dimension scores vs GIIN benchmarks.
5. CSV export lists every metric value per company.

### 7.4 Worked example (one company, unpopulated)

Company `rev = $500M`, sector Energy, no user data. Metric OI4114 (Revenue from Impact Products,
USD Mn) with `rng = 0.4`:

| Step | Computation | Result |
|---|---|---|
| Value (USD Mn unit) | 0.4 × (500 × 0.15) + 5 | 0.4×75 + 5 = **35 USD Mn** |
| Normalise (denom rev·0.5 = 250) | min(100, 35/250×100) | **14.0** |
| Dimension (How Much) score | mean of relevant How-Much metric scores | e.g. **41** |
| avgScore | (What+Who+HowMuch+Contribution+Risk)/5 | e.g. **48** |
| Evidence tier (PI1595 seeded 60) | round(60/20) | **3** |

Because no user data was entered, the entire impact profile here is seeded — real use requires
entering reported IRIS+ values, which then replace the fallback.

### 7.5 Companion analytics on the page

- **Five-dimension radar** — company scores vs `GIIN_BENCHMARKS`.
- **SDG contribution** — metrics mapped to SDG targets with official SDG colours.
- **Portfolio KPIs** — impact revenue %, total beneficiaries, total GHG reduced, mean evidence tier.
- **Additionality** — `addScore = min(100, innov·0.6 + (cap>0?30:0) + 10)` from Contribution metrics.
- **localStorage persistence** of user-entered IRIS values (`ra_iris_data_v1`).

### 7.6 Data provenance & limitations

- The **IRIS+ catalogue, IDs, SDG mappings and GIIN benchmarks are real**; the **metric values are
  user-entered or seeded fallbacks** (`Math.sin`-hashed by company_id) — flag any company profile with
  no localStorage entries as fully synthetic.
- Normalisation denominators are heuristic (e.g. revenue-scaled), not GIIN-defined thresholds.
- Additionality/evidence tiers are simplified proxies, not IMP-assessed ratings.

**Framework alignment:** *GIIN IRIS+ System* — the module uses authentic IRIS+ metric identifiers and
the five IMP dimensions (What, Who, How Much, Contribution, Risk), the exact structure IRIS+ prescribes.
*Impact Management Project* — dimension scores map to IMP's five-dimension impact norms. *UN SDGs* —
each metric carries its real SDG target links. *OPIM* — the guide references Operating Principles for
Impact Management for the disclosure output. IRIS+ itself does not prescribe a single composite score;
GIIN's *Navigating Impact* provides sector benchmarks, which the module uses as the radar reference.

## 8 · Model Specification

**Status: specification — not yet implemented in code (for the value-generation path; the catalogue
and scoring skeleton are real).**

### 8.1 Purpose & scope
Replace the seeded fallback values with an evidenced impact-measurement pipeline: ingest reported
IRIS+ metric values, benchmark against GIIN sector distributions, and produce a defensible five-
dimension impact profile and additionality rating.

### 8.2 Conceptual approach
Data-first IRIS+ scoring: reported KPIs → unit normalisation against GIIN *Navigating Impact* peer
quartiles → dimension aggregation with IMP-consistent weighting → additionality/risk assessment per
IMP norms. Benchmarked to GIIN IRIS+ and IFC OPIM Principle-7 verification practice.

### 8.3 Mathematical specification
For company *c*, metric *m* in dimension *d*:

```
z_{c,m}     = (Value_{c,m} − median_{sector,m}) / IQR_{sector,m}      // peer-relative
pct_{c,m}   = Φ(z_{c,m})·100                                          // percentile score 0–100
DimScore_d  = Σ_{m∈d, relevant} w_{d,m}·pct_{c,m} / Σ w_{d,m}
Additionality = f(Capital Mobilized OI5320, Innovation PI9061, Policy PI3390)   // IMP Contribution
ImpactRisk  = g(Evidence PI1595, Execution PI8291, External PI4453, Stakeholder PI6190)
Composite   = Σ_d ω_d·DimScore_d                                      // ω = IMP-materiality weights
```

| Parameter | Source |
|---|---|
| Peer medians/IQR `median, IQR` | GIIN Navigating Impact benchmark database |
| Metric weights `w, ω` | IMP materiality; fund mandate |
| SDG crosswalk | IRIS+ official SDG mapping |
| Evidence tiers | IRIS+ Risk dimension definitions (RCT→anecdotal) |

### 8.4 Data requirements
Reported IRIS+ KPI values per investee per year, sector/geography for benchmarking, capital-mobilised
and evidence-quality inputs. Platform has the catalogue, benchmark medians, and localStorage input;
needs the GIIN peer-distribution feed and reported-data ingestion.

### 8.5 Validation & benchmarking plan
Reconcile dimension percentiles against GIIN Navigating Impact quartiles; verify additionality against
OPIM Principle-7 independent verification; sensitivity of composite to metric weights; check evidence-
tier distribution against sector norms.

### 8.6 Limitations & model risk
IRIS+ metrics are self-reported and sparsely benchmarked; cross-sector comparability is limited;
additionality is inherently qualitative. Fallback: report dimension scores separately with data-
coverage flags rather than a single composite when reported coverage is low.

## 9 · Future Evolution

### 9.1 Evolution A — Reported-data pipeline and peer-percentile benchmarking (analytics ladder: rung 2 → 3)

**What.** The skeleton is authentic — real IRIS+ metric IDs (PI9468, OI8869, PI1595) across the five IMP dimensions, real SDG crosswalks, GIIN benchmark medians, and a working user-input path persisted to localStorage — but §7.6 flags the fallback: an unpopulated company's entire impact profile is a `Math.sin`-hashed placeholder scaled by heuristic unit denominators (revenue×0.15 for USD-Mn metrics), and normalisation uses those heuristics rather than GIIN-defined thresholds. Evolution A implements the §8 data-first pipeline: reported IRIS+ values ingested per investee per year into a proper table (replacing localStorage), normalised as peer percentiles against GIIN Navigating Impact quartile distributions (`pct = Φ((value − median)/IQR)·100`), with dimension scores weighted per IMP materiality and coverage flags everywhere data is absent.

**How.** (1) A backend vertical: `iris_metric_values` (holding × metric × period × value × source) with `POST /iris-metrics/values` and a portfolio-scores route — localStorage-only persistence blocks both team use and any LLM tier. (2) The seeded fallback replaced by honest nulls plus a coverage % per dimension — §8.6's own instruction ("report dimension scores separately with data-coverage flags... when reported coverage is low"). (3) GIIN peer quartiles ingested where published; the current single-median `GIIN_BENCHMARKS` retained as fallback with provenance. (4) The additionality proxy (`innov·0.6 + cap>0?30:0 + 10`) re-derived from the Contribution metrics per §8.3's function or explicitly labeled a screening proxy.

**Prerequisites.** The seeded value-generation path deleted for scoring (kept only as an explicitly-labeled demo mode if needed); GIIN benchmark data collection. **Acceptance:** an unpopulated company shows coverage 0% and no scores, not a full seeded profile; percentiles reproduce from stored quartiles; user-entered values survive across devices via the DB.

### 9.2 Evolution B — Impact-data entry assistant and LP report generator (LLM tier 2)

**What.** Two workflow moments suit the LLM. First, intake: annual investee impact reports arrive as PDFs — the copilot extracts candidate IRIS+ values (mapping "12,400 households electrified" to PI1104-style reach metrics with unit checks), queued for analyst confirmation — the same extraction-with-review pattern as invoice-parser, applied to impact reporting. Second, output: "generate the OPIM Principle-7-aligned impact section for the fund report" — drafted entirely from stored, confirmed values with dimension coverage stated per §8.6.

**How.** Tier 2 over the Evolution A routes: extraction suggestions carry source-page citations and never auto-commit; metric mapping must resolve to a real catalogue ID or park the value as unmapped — inventing an IRIS+ code would corrupt the module's most valuable asset, its authentic taxonomy. Report generation validates every figure against tool output; benchmark claims quote the stored GIIN quartile with vintage; evidence-tier language follows the IRIS+ Risk-dimension definitions (RCT→anecdotal) so "high-confidence impact" is never asserted over tier-4/5 evidence.

**Prerequisites (hard).** Evolution A's DB persistence and honest-nulls scoring (an LP report over seeded profiles would be fabricated impact disclosure); document pipeline for intake. **Acceptance:** every extracted value shows its source citation and confirmation state; generated reports contain only confirmed-value numerics with coverage statistics; all metric references resolve to catalogue IDs.