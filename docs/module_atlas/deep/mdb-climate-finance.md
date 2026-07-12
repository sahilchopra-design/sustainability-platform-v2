## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry states a calculation-engine formula —
> `LR = (Private + Bilateral + Other) / MDB Core Climate Finance` — as if the page derives a
> leverage ratio from underlying flows. **It does not.** Every per-institution number, including
> `mobilisationRatio`, `parisAlignedPct`, and `climateSharePct`, is a **hand-entered constant** in
> the `MDBS` seed array. The page performs only aggregation (`reduce`/`sum`/`average`) and one
> genuine derived statistic (CAGR) over those constants — it never computes a leverage ratio from
> private, bilateral, and MDB-core components. The sections below describe what the code actually
> does: a curated MDB climate-finance dashboard over static reference figures.

### 7.1 What the module computes

For 8 MDBs (World Bank Group, ADB, AIIB, EIB, AfDB, IADB, EBRD, NDB) the page aggregates flat seed
fields across five tabs of static tables/charts:

```js
totalClimateLending = Σ MDBS[i].climateLendingBnUSD                    // $bn, 2023
totalGreenBonds     = Σ MDBS[i].greenBondIssuedBnUSD                   // $bn, cumulative
avgMobilisation      = (Σ MDBS[i].mobilisationRatio) / 8                // simple mean, not flow-derived
totalGhgAvoided      = Σ PROJECTS[i].co2ImpactMtpa                     // 40-project pipeline
totalBeneficiaries    = Σ PROJECTS[i].adaptationBeneficiariesM
CAGR(2015→2023)      = (total_2023 / total_2015)^(1/8) − 1             // only genuinely derived metric
```

`areaData` and `totalMobilised2023` sum the `ANNUAL_CF`/`MOBILISATION` year-rows across the 8 MDB
columns for the stacked-area and mobilisation charts. `Impact KPI Summary` (Tab 6) re-aggregates
`PROJECTS` per MDB (`co2`, `benef`, `totalSz`) — again a `reduce`, not a model.

### 7.2 Parameterisation — provenance of the constants

| Field | Values | Provenance |
|---|---|---|
| `climateLendingBnUSD`, `totalAnnualLendingBnUSD` | e.g. WBG $35.2bn/$104.4bn | Hand-entered, styled after MDB Joint Report 2023 aggregate figures — not pulled from a live source |
| `mobilisationRatio` | 1.2×–3.1× | Static per-MDB constant; **not** computed as private ÷ MDB-core from any flow data on the page |
| `parisAlignedPct` | 74%–100% | Static; NDB's 74% is the only sub-100 entry, reflecting NDB's later Paris Alignment adoption in real MDB disclosures |
| `PARIS_SCORES` (6 dimensions) | 58–100 | Fully synthetic scorecard; no computation links these sub-scores to `parisAlignedPct` |
| `PROJECTS` (40 rows) | size, CO₂, beneficiaries | Illustrative pipeline; realistic magnitudes (e.g. India energy $850M/4.2 Mtpa) but not sourced project IDs |
| `COUNTRY_ALLOCS` (30 rows) | per-MDB $mn by country | Static; India $4.85bn aggregate is a plausible top-recipient figure but not reconciled to any MDB disclosure |

### 7.3 Calculation walkthrough

1. **MDB Overview (Tab 0):** cards read `climateLendingBnUSD` and `climateSharePct` directly per
   MDB; the progress bar width is literally `climateSharePct`.
2. **Climate Finance Flows (Tab 1):** `areaData` sums the 8 MDB columns per year for the stacked
   area; CAGR is computed once, between the 2015 and 2023 totals.
3. **Mobilisation Analytics (Tab 2):** `MOBILISATION` year rows are plotted as-is; the "Mobilisation
   Ratio" bar chart plots the static `mobilisationRatio` field per MDB — no relationship is drawn
   between this ratio and the mobilised-$ series shown one chart above.
4. **Country Allocations / Pipeline / Paris Alignment (Tabs 3–5):** table sorts and stacked bars over
   `COUNTRY_ALLOCS`, `PROJECTS`, `PARIS_SCORES` — filter/sort logic only, no derived metrics beyond
   `reduce` sums and `.sort()`.
5. **Impact Dashboard (Tab 6):** re-slices `PROJECTS` by MDB to repeat the CO₂/beneficiary/size sums
   seen elsewhere.

### 7.4 Worked example

CAGR for total MDB climate finance, 2015→2023, using `areaData[0].total` and `areaData[8].total`:

| Year | WBG | ADB | AIIB | EIB | AfDB | IADB | EBRD | NDB | **Total** |
|---|---|---|---|---|---|---|---|---|---|
| 2015 | 16.2 | 3.8 | 0.0 | 18.4 | 1.4 | 3.1 | 1.9 | 0.0 | **44.8** |
| 2023 | 35.2 | 13.6 | 3.4 | 36.1 | 3.9 | 8.2 | 5.2 | 1.8 | **107.4** |

```
CAGR = (107.4 / 44.8)^(1/8) − 1 = (2.398)^0.125 − 1 ≈ 1.1146 − 1 ≈ 11.46%
```

The page renders this as `((107.4/44.8)^(1/8)-1)*100 → ~11.5%` — the only figure on the page that
is *derived* rather than *looked up*.

### 7.5 Companion analytics

- **Project pipeline filters** — stage (Pipeline/Approved/Disbursing/Completed/Suspended) × sector
  (Energy/Transport/Water/Cities/Agriculture) × MDB, applied via `Array.filter` chains with no
  weighting or scoring.
- **Paris Alignment Scorecard** — six static sub-scores per MDB rendered as progress bars; colour
  thresholds (`≥95` green, `≥80` amber, else red) are UI-only, not part of any composite formula.

### 7.6 Data provenance & limitations

- All figures are **synthetic demo constants**, not fetched from MDB Joint Report data, OECD DAC
  mobilisation statistics, or any reference-data table in the platform — despite matching realistic
  orders of magnitude for 2023 MDB climate finance.
- No leverage ratio, additionality, or grant-element calculation exists anywhere in this file — the
  "Leverage Ratio" language in the guide belongs conceptually to `mdb-sub-sovereign-lending` (which
  *does* implement grant-element/PV-saving arithmetic) or `mdb-climate-finance-dh` (which computes an
  ad-hoc additionality score), not to this module.
- Paris-alignment sub-scores (mitigation/adaptation/mobilisation/taxonomy/reporting) have no defined
  aggregation rule to `overall` — the six numbers are independently seeded, not weighted-summed.

**Framework alignment:** MDB Joint Report on Climate Finance (annual, tracks mitigation/adaptation
split and $100bn goal) · OECD DAC Rio Marker methodology (climate-relevance tagging of ODA, referenced
but not implemented) · COP28 NCQG — the module is a **presentation layer** for figures consistent
with these frameworks' published aggregates, not a computation engine implementing their methods.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Support MDB climate-finance oversight and DFI investment-committee review by computing a genuine
**private-capital mobilisation leverage ratio** and **Paris-alignment composite score** per
institution, replacing the current static constants with flow-derived, auditable metrics across the
8 tracked MDBs and their project pipelines.

### 8.2 Conceptual approach
Mirror the **OECD DAC Blended Finance / Private Finance Mobilisation methodology** (attribution of
private capital to the triggering MDB instrument) combined with the **MDB Joint Climate Finance
Tracking Methodology**'s mitigation/adaptation classification — the same two-benchmark approach used
by CPI's *Global Landscape of Climate Finance* leverage tables and by Convergence's blended-finance
leverage ratio reporting.

### 8.3 Mathematical specification

```
LeverageRatio_i = PrivateMobilised_i / MDBCoreClimateFinance_i
```
where `PrivateMobilised_i` is attributed per-instrument (guarantee, equity, syndication) using OECD
DAC's causality rules (direct mobilisation only, no double counting across co-financiers).

```
ParisAlignmentScore_i = w_mit·Mitigation_i + w_adapt·Adaptation_i + w_mob·Mobilisation_i
                        + w_tax·TaxonomyAlign_i + w_rep·Reporting_i
        (Σw = 1; weights calibrated to MDB Paris Alignment Common Approach 2021 pillars)
```

| Parameter | Calibration source |
|---|---|
| Mobilisation causality rules | OECD DAC (2023) *Methodological Note on Measuring Mobilisation of Private Finance* |
| Mitigation/adaptation classification | MDB Joint Climate Finance Tracking Methodology 2023 (project-level, not portfolio-level) |
| Alignment pillar weights | MDB Paris Alignment Common Approach 2021 — six-building-block framework |

### 8.4 Data requirements
Project-level MDB commitment records (amount, instrument type, co-financier list, mitigation/adaptation
tag) — sourceable from MDB annual project databases (World Bank ARAP, ADB PPIS) already referenced in
the guide's `dataLineage`; OECD DAC CRS++ private-mobilisation micro-data for causality attribution.
None of this is yet wired into the platform's `reference_data` tables.

### 8.5 Validation & benchmarking plan
Reconcile computed `LeverageRatio_i` against CPI's published system-wide average (~1:2–1:3 as of 2023)
and against each MDB's own disclosed mobilisation ratio in its annual report; sensitivity-test the
Paris-alignment weights against MDB self-assessments published under the Common Approach.

### 8.6 Limitations & model risk
Private-mobilisation attribution is inherently contestable (co-financing causality disputes are
common in MDB peer review); the model should flag project-level mobilisation estimates with a
confidence tier rather than presenting a single point estimate, consistent with OECD DAC's own
guidance that mobilisation figures are indicative, not audited.
