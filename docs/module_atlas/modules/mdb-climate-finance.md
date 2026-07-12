# MDB Climate Finance
**Module ID:** `mdb-climate-finance` · **Route:** `/mdb-climate-finance` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tracks and analyses climate finance flows from multilateral development banks (World Bank, IFC, ADB, AfDB, EBRD, EIB, IADB) against the $100bn collective goal, Paris alignment targets, and COP28 MDB Joint Climate Finance commitments. Quantifies co-financing leverage ratios, grant element, and private capital mobilisation per institution, region, and sector. Supports OECD DAC Rio marker methodology compliance and MDB Joint Climate Finance Tracking methodology.

> **Business value:** Provides development finance analysts and climate negotiators with a comprehensive view of MDB climate finance flows, leverage effects, and alignment with global climate finance goals, supporting accountability and allocation optimisation.

**How an analyst works this module:**
- Select MDB institutions and reporting years to scope the climate finance tracking dashboard
- Review climate finance volumes by institution, sector, and developing vs. developed country split
- Analyse adaptation/mitigation split against $100bn commitment targets and COP28 goals
- Assess private capital mobilisation leverage ratios and identify instruments with highest catalytic effect
- Export MDB climate finance data aligned with UNFCCC Standing Committee Biennial Assessment reporting templates

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ANNUAL_CF`, `Badge`, `COUNTRY_ALLOCS`, `CustomTooltip`, `KpiCard`, `MDBS`, `MDB_COLORS`, `MOBILISATION`, `PARIS_SCORES`, `PROJECTS`, `SECTOR_COLORS`, `STAGE_COLORS`, `SectionHeader`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MDBS` | 9 | `name`, `totalAnnualLendingBnUSD`, `climateLendingBnUSD`, `climateSharePct`, `mitigationBnUSD`, `adaptationBnUSD`, `mobilisationRatio`, `parisAlignedPct`, `greenBondIssuedBnUSD`, `focusRegions`, `creditRating`, `headcountThousands`, `color` |
| `ANNUAL_CF` | 10 | `WBG`, `ADB`, `AIIB`, `EIB`, `AfDB`, `IADB`, `EBRD`, `NDB` |
| `MOBILISATION` | 6 | `WBG`, `ADB`, `AIIB`, `EIB`, `AfDB`, `IADB`, `EBRD`, `NDB` |
| `PROJECTS` | 41 | `mdb`, `country`, `sector`, `sizeMnUSD`, `stage`, `co2ImpactMtpa`, `adaptationBeneficiariesM`, `status` |
| `COUNTRY_ALLOCS` | 31 | `total`, `WBG`, `ADB`, `EIB`, `AfDB`, `IADB`, `EBRD`, `AIIB` |
| `PARIS_SCORES` | 9 | `overall`, `mitigation`, `adaptation`, `mobilisation`, `taxonomyAlign`, `reporting` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalClimateLending` | `MDBS.reduce((s,m) => s+m.climateLendingBnUSD, 0).toFixed(1);` |
| `totalGreenBonds` | `MDBS.reduce((s,m) => s+m.greenBondIssuedBnUSD, 0).toFixed(1);` |
| `avgMobilisation` | `(MDBS.reduce((s,m) => s+m.mobilisationRatio, 0)/MDBS.length).toFixed(1);` |
| `totalGhgAvoided` | `PROJECTS.reduce((s,p) => s+p.co2ImpactMtpa, 0).toFixed(1);` |
| `totalBeneficiaries` | `PROJECTS.reduce((s,p) => s+p.adaptationBeneficiariesM, 0).toFixed(1);` |
| `latestMobilisation` | `MOBILISATION[MOBILISATION.length-1];` |
| `totalMobilised2023` | `Object.keys(MDB_COLORS).reduce((s,k) => s+(latestMobilisation[k]\|\|0), 0).toFixed(0);` |
| `areaData` | `ANNUAL_CF.map(row => ({ ...row, total: Object.keys(MDB_COLORS).reduce((s,k) => s+(row[k]\|\|0), 0) }));` |
| `co2` | `mdbProjs.reduce((s,p)=>s+p.co2ImpactMtpa,0).toFixed(1);` |
| `benef` | `mdbProjs.reduce((s,p)=>s+p.adaptationBeneficiariesM,0).toFixed(1);` |
| `totalSz` | `(mdbProjs.reduce((s,p)=>s+p.sizeMnUSD,0)/1000).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ANNUAL_CF`, `COUNTRY_ALLOCS`, `MDBS`, `MOBILISATION`, `PARIS_SCORES`, `PROJECTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| MDB Climate Finance (USD bn) | — | MDB Joint Climate Finance Report 2023 | Total commitments from all seven major MDBs classified as climate finance under joint methodology |
| Private Finance Mobilised (USD bn) | — | OECD DAC private finance mobilisation data | Private capital mobilised by MDB climate operations via guarantees, equity, and other instruments |
| Adaptation Finance Share (%) | — | MDB joint tracking | Proportion of MDB climate finance directed to adaptation and resilience vs. mitigation |
| Grant Element (%) | — | OECD DAC concessionality measure | Degree of concessionality in MDB climate instruments; higher grant element indicates greater subsidy for adaptation-critical projects |
- **MDB annual reports and climate finance disclosures** → Extract project-level climate finance commitments; classify by theme, region, and instrument type → **Structured MDB climate finance database by year, institution, sector, and country**
- **OECD DAC private mobilisation data** → Attribute private capital to triggering MDB instruments; compute leverage ratios → **Private finance mobilisation by instrument type and MDB institution**
- **UNFCCC SCF biennial assessment template** → Aggregate data per SCF taxonomy; compute adaptation/mitigation and public/private splits → **UNFCCC-ready climate finance reporting dataset**

## 5 · Intermediate Transformation Logic
**Methodology:** MDB Climate Finance Leverage Ratio
**Headline formula:** `LR = (Private + Bilateral + Other) / MDB Core Climate Finance`

Leverage ratio captures total climate finance mobilised per dollar of MDB core concessional or non-concessional climate finance. Private capital mobilisation is attributed per OECD DAC methodological guidance on measuring catalytic effects. The ratio is computed by institution, region (global/developing country), and adaptation/mitigation split.

**Standards:** ['MDB Joint Climate Finance Tracking Methodology 2023', 'OECD DAC Rio Marker Guidance', 'CPI Global Landscape of Climate Finance 2023', 'UNFCCC Standing Committee on Finance Biennial Assessment']
**Reference documents:** MDB Joint Report on Climate Finance 2023; OECD DAC Methodological Note on Measuring Mobilisation of Private Finance 2023; UNFCCC Standing Committee on Finance Biennial Assessment 2022; CPI Global Landscape of Climate Finance 2023; COP28 UAE Consensus â€” New Collective Quantified Goal on Climate Finance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Reconcile the constants to the Joint Report and compute the leverage ratio (analytics ladder: rung 1 → 2)

**What.** §7's flag: the guide's `LR = (Private + Bilateral + Other) / MDB Core` is never computed — `mobilisationRatio`, `parisAlignedPct` and `climateSharePct` are hand-entered constants styled after the MDB Joint Report 2023, the `PARIS_SCORES` scorecard is fully synthetic with no link to the alignment percentages beside it, the 40-project pipeline lacks source IDs, and the only genuine derivation is a CAGR. The good news: this domain's authoritative data is *published annually* — the MDB Joint Report on Climate Finance and OECD DAC mobilisation tables are exactly the flow-level data the §5 formula needs. Evolution A: (1) an annually-refreshed `mdb_climate_finance` refdata set transcribed from the Joint Report with per-figure citations and reporting-year vintage; (2) the leverage ratio computed from its components (private, bilateral, other ÷ core) per OECD DAC attribution guidance, replacing the stored ratio; (3) the `PARIS_SCORES` scorecard either sourced to each MDB's published Paris-alignment methodology disclosures or removed; (4) the project pipeline re-based on real project records (MDB project databases are public and searchable) with IDs.

**How.** (1) Transcription-plus-citation is the bulk of the work — this module's evolution is data curation discipline, not new math. (2) `GET /mdb-climate-finance/flows?year=&mdb=` serving the reconciled series so the UNFCCC SCF export (the §1 workflow's endpoint) assembles from cited records. (3) The CAGR and aggregation code survives unchanged over the sourced data. (4) A reconciliation check: displayed totals must match the Joint Report's headline within rounding, with the report edition named.

**Prerequisites.** Annual curation cadence committed; the synthetic scorecard removed pending sourcing. **Acceptance:** every institution figure carries report+year citation; the leverage ratio decomposes into cited components; project rows resolve to real MDB project IDs; totals reconcile to the named report edition.

### 9.2 Evolution B — Climate-finance accountability copilot (LLM tier 1 → 2)

**What.** The module's users — development-finance analysts and climate negotiators — ask accountability questions over cited data: "how did adaptation share move across MDBs since 2020, and who lags?", "what does the OECD attribution methodology count as 'mobilised', and why do CPI's numbers differ?" (a real, recurring confusion the copilot can explain from the cited methodological notes), "assemble the SCF biennial-assessment table for the ADB rows." Post-Evolution-A these ground in reconciled records; methodology explanation grounds in the curated standards references.

**How.** Tier 1 first: the reconciled tables and methodology notes into the corpus, with per-figure citation mandatory — negotiation-adjacent numbers are contested, so provenance is the product. Tier 2: tool calls over the flows route for cross-year/cross-MDB computations (shares, deltas, leverage decompositions) with arithmetic shown; SCF-template assembly validates every cell against stored records. Discipline: methodology-difference questions (Joint Report vs CPI vs OECD definitions) are answered comparatively with sources, never adjudicated; forward-looking commitment questions (NCQG) quote curated commitment texts with dates. Sibling routing: sub-sovereign lending detail to `mdb-sub-sovereign-lending`, the DH-sprint variant to `mdb-climate-finance-dh`, boundaries stated.

**Prerequisites.** Evolution A's reconciled data (accountability analysis over unsourced constants would be exactly the credibility failure the module exists to police); Phase 2 for tool calls. **Acceptance:** every figure in an answer carries report+year; template cells trace to stored records; methodology comparisons cite the specific guidance documents.