# PCAF 8/8 Universal Attributor
**Module ID:** `pcaf-universal-attributor` · **Route:** `/pcaf-universal-attributor` · **Tier:** B (frontend-computed) · **EP code:** EP-CI6 · **Sprint:** CI

## 1 · Overview
Complete PCAF 8-class attribution with formulas, data quality heatmap, WACI benchmarking, and SBTi target tracking.

**How an analyst works this module:**
- Universal Dashboard shows total financed emissions across all 8 classes
- Attribution Formula Reference explains each class methodology
- Data Quality Heatmap shows DQ scores per class
- Target Tracking compares actual vs SBTi financed emissions target

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DQ_COLORS`, `DQ_SCORES`, `PCAF_CLASSES`, `TABS`, `TARGET_YEARS`, `WACI_SECTORS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PCAF_CLASSES` | 9 | `name`, `formula`, `exposure`, `emissions`, `dq`, `dqDesc`, `example` |
| `WACI_SECTORS` | 11 | `waci`, `benchmark`, `weight` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `DQ_SCORES` | `{ 1: 'Audited GHG data', 2: 'Reported unverified', 3: 'Physical activity data', 4: 'Revenue-based estimate', 5: 'Asset class proxy' };` |
| `totalExposure` | `PCAF_CLASSES.reduce((s, c) => s + c.exposure, 0);` |
| `totalEmissions` | `PCAF_CLASSES.reduce((s, c) => s + c.emissions, 0);` |
| `year` | `2020 + i;` |
| `target` | `100 * Math.pow(0.93, i);` |
| `actual` | `100 * Math.pow(0.95, i) * (1 + (sr(i * 31 + 10) * 2 - 1) * 0.025);` |
| `portfolioWACI` | `WACI_SECTORS.reduce((s, sec) => s + sec.waci * sec.weight / 100, 0);` |
| `benchmarkWACI` | `WACI_SECTORS.reduce((s, sec) => s + sec.benchmark * sec.weight / 100, 0);` |
| `TABS` | `['Universal Attribution Dashboard', 'All 8 Asset Classes', 'Data Quality Heatmap', 'Attribution Formula Reference', 'Portfolio-Level WACI', 'Target Tracking & Gap Analysis'];` |
| `avgDQ` | `+(PCAF_CLASSES.reduce((s, c) => s + c.dq * c.exposure, 0) / totalExposure).toFixed(1);` |
| `classChartData` | `PCAF_CLASSES.map(c => ({` |
| `dqMatrix` | `PCAF_CLASSES.map(c => ({` |
| `filteredClasses` | `dqFilter === 'All' ? PCAF_CLASSES : PCAF_CLASSES.filter(c => Math.round(c.dq) === +dqFilter);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PCAF_CLASSES`, `TABS`, `WACI_SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| PCAF Coverage | — | PCAF Standard | Full coverage of all PCAF asset classes |
| Portfolio WACI | `Weighted average` | Calculated | Across all 8 asset classes |

## 5 · Intermediate Transformation Logic
**Methodology:** PCAF 8-class attribution formulas
**Headline formula:** `AF varies by class: EVIC (Class 1-2), 100% (Class 3), Loan/Value (Class 4-6), GDP-based (Class 7)`

All 8 PCAF asset classes covered with class-specific attribution formulas and data quality scoring. Classes: 1 (Listed Equity/Bonds), 2 (Business Loans), 3 (Project Finance), 4 (Commercial RE), 5 (Mortgages), 6 (Motor Vehicle Loans), 7 (Sovereign Debt), 8 (Other).

**Standards:** ['PCAF Global GHG Standard v3']
**Reference documents:** PCAF Global GHG Accounting Standard v3; SBTi Financial Sector Framework

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

A reference/education-oriented dashboard covering all 8 PCAF asset classes (vs the flagship
`pcaf-financed-emissions` module's 13, which includes PCAF's newer Part-C extensions). Each class
carries a static exposure, emissions, and DQ figure plus its textual attribution formula — this
module is a **formula-reference-and-benchmark tool**, not a per-position live calculator like its
sibling modules.

```
avgDQ         = Σ(class.dq × class.exposure) / Σ(class.exposure)      // exposure-weighted DQ
portfolioWACI = Σ(sector.waci × sector.weight/100)                     // weight-normalised WACI
benchmarkWACI = Σ(sector.benchmark × sector.weight/100)
```

### 7.2 Parameterisation

| Field | Value | Provenance |
|---|---|---|
| `PCAF_CLASSES` (9 rows — 8 classes + totals?) | name, formula (text), exposure, emissions, dq, dqDesc, example | Seed table; formulas are correctly transcribed PCAF text (e.g. "EVIC" for Class 1-2, "100%" for Class 3, "Loan/Value" for Class 4-6, "GDP-based" for Class 7) |
| `WACI_SECTORS` (11 rows) | `waci`, `benchmark`, `weight` per sector | Seed table; weights presumably sum to 100 across sectors (not independently verified in the extracted formulas) |
| Target-tracking trajectory | `target = 100×0.93^i`, `actual = 100×0.95^i × (1±2.5%)` | Synthetic demo value: a 7%/yr target-reduction path vs a 5%/yr actual path with small seeded noise — illustrates gap-to-target, not derived from real SBTi target-setting for this specific portfolio |

### 7.3 Calculation walkthrough

1. **Exposure-weighted DQ**: `avgDQ = Σ(dq×exposure)/Σexposure` — correct capital-weighted
   aggregation (larger exposures pull the DQ average more, consistent with PCAF's own
   portfolio-level DQ scoring convention).
2. **DQ heatmap / filter**: `dqMatrix` and `filteredClasses` (filter by `Math.round(dq)===dqFilter`)
   let a user isolate asset classes at a given DQ tier — useful for identifying which classes need
   data-quality remediation investment.
3. **WACI benchmarking**: portfolio WACI vs sector benchmark WACI, both computed as weight-averaged
   sums — a genuine relative-positioning calculation (over/under sector benchmark), though the
   underlying per-sector `waci`/`benchmark` numbers are seed constants, not derived from the
   `PCAF_CLASSES` exposure/emissions figures elsewhere on the page (the two tables are not linked).
4. **Target tracking**: a static two-curve chart (target decay vs actual decay) with no live
   connection to `PCAF_CLASSES`' actual emissions figure — i.e. "actual" here is a hypothetical
   demonstration trajectory, not this portfolio's real historical emissions path.

### 7.4 Worked example

`PCAF_CLASSES` includes, e.g., Class 1 (Listed Equity/Bonds) with `exposure=$X B`, `dq=2.8`, and
Class 6 (Motor Vehicle Loans) with `exposure=$Y B`, `dq=4.1`:

| Step | Computation | Result |
|---|---|---|
| Exposure-weighted avgDQ | (2.8×X + 4.1×Y + …) / (X+Y+…) | a single portfolio-level DQ score between the class extremes, weighted toward whichever class has larger exposure |

Without the concrete seed values for all 9 rows this cannot be resolved to a number from the
extracted formulas alone, but the aggregation mechanic itself is correct and PCAF-consistent.

### 7.5 Data provenance & limitations

- **All class-level exposure, emissions, and DQ figures are seed constants**, illustrative of
  typical institutional-portfolio proportions across the 8 PCAF classes, not computed from any
  underlying position-level dataset.
- The module's `PCAF_CLASSES` and `WACI_SECTORS` tables are **not cross-linked** — WACI/benchmark
  figures don't derive from the same emissions/exposure numbers shown in the class table, so the two
  panels can't be reconciled against each other.
- Target-tracking is a generic decay-curve illustration, not this portfolio's actual SBTi
  target-vs-actual trajectory.

**Framework alignment:** PCAF Global GHG Accounting Standard v3 — the 8-class attribution-formula
reference table is accurate and complete (all 8 official PCAF asset classes correctly named and
formula-labelled); SBTi Financial Sector Framework — referenced for target-tracking context but the
target/actual curves are illustrative rather than SBTi-derived for a specific portfolio.

## 9 · Future Evolution

### 9.1 Evolution A — From formula-reference to live per-position calculator (analytics ladder: rung 1 → 3)

**What.** §7 is clear: this is a reference/education dashboard covering all 8 PCAF asset classes with correctly-transcribed attribution formulas (EVIC for Class 1-2, 100% for Class 3, Loan/Value for Class 4-6, GDP-based for Class 7) and correct exposure-weighted DQ aggregation — but each class carries a *static* exposure/emissions/DQ figure, not a per-position calculation. The flagship `pcaf-financed-emissions` sibling already does live 13-instrument attribution. The target-tracking trajectory (`target = 100×0.93^i` vs `actual = 100×0.95^i`) is illustrative, not derived from a real SBTi target. Evolution A makes this either a genuine calculator or a clean reference layer over the flagship.

**How.** (1) The cleanest path: make this module the *reference/benchmark view* over the flagship engine's real per-position outputs — call the flagship's computation and aggregate to the 8-class rollup with the DQ heatmap, rather than duplicating a static table; this avoids two divergent PCAF implementations. (2) Replace the illustrative target trajectory with the portfolio's real SBTi financed-emissions target (the Financial Sector Framework named in §5) computed from actual baseline emissions. (3) The exposure-weighted DQ and WACI-benchmark math are correct — feed them real per-class exposures from the flagship.

**Prerequisites.** Consuming the flagship `pcaf-financed-emissions` engine (avoids a second PCAF implementation drifting from the first); real SBTi target inputs. **Acceptance:** the 8-class rollup reflects real per-position financed emissions from the flagship, not static seeds; target tracking uses a real SBTi target; DQ heatmap reflects actual data quality.

### 9.2 Evolution B — PCAF methodology copilot / class-selection guide (LLM tier 1)

**What.** This module's genuine strength is being a formula reference, which makes it an ideal tier-1 methodology copilot: "which PCAF class does a motor-vehicle loan fall under and what's its attribution factor?", "how is sovereign-debt attribution computed?", "what DQ score does sector-average emissions data earn?" — grounded in the correctly-transcribed 8-class formulas and the PCAF v3 reference named in §5.

**How.** Tier 1 over the reference content: system prompt from this Atlas page's §5/§7 and the serialized `PCAF_CLASSES` formula table; the copilot answers class-selection and formula-interpretation questions with citations to the PCAF chapter, and explains the exposure-weighted DQ convention. Served via the roadmap's shared copilot router with prompt caching (static reference corpus). Refusal path for portfolio-specific calculations (route those to the flagship module's tier-2 analyst) and for questions beyond the 8-class scope. This copilot is the "explain PCAF" front door; the flagship's copilot is the "compute my portfolio" operator.

**Prerequisites.** None hard — the formula reference is accurate today; deeper computation delegates to the flagship (Evolution A wiring). **Acceptance:** every formula answer cites the correct PCAF class and chapter; DQ-scoring explanations match the exposure-weighted convention; portfolio-calculation requests route to the flagship rather than being answered from the static table.