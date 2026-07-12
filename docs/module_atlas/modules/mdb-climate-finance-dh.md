# MDB Climate Finance Analytics
**Module ID:** `mdb-climate-finance-dh` · **Route:** `/mdb-climate-finance-dh` · **Tier:** B (frontend-computed) · **EP code:** EP-DH2 · **Sprint:** DH

## 1 · Overview
Tracks and analyses multilateral development bank climate finance commitments, additionality, blended finance leverage ratios, and Paris alignment. Integrates MDB Joint Climate Finance Tracking methodology and evaluates programming effectiveness by sector and region.

> **Business value:** Essential for climate finance researchers, DFI investment committees, sovereign clients of MDBs, and UNFCCC negotiators tracking developed country $100Bn commitment. Provides joint MDB tracking methodology-aligned analysis of climate finance additionality and private mobilisation effectiveness.

**How an analyst works this module:**
- Browse MDB climate finance by institution and region
- Filter by mitigation vs adaptation vs cross-cutting
- Calculate additionality score for project types
- Analyse leverage ratios and private mobilisation
- Generate Paris alignment assessment using MDB Common Approach

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `BORROWER_NAMES`, `ENTITIES`, `MDB_NAMES`, `REGIONS`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['Sub-Saharan Africa', 'South Asia', 'East Asia', 'Latin America', 'MENA', 'Eastern Europe'];` |
| `totalClimateFinance` | `mdbs.reduce((a, e) => a + e.climateFinanceCommitted, 0);` |
| `avgPrivateMobilised` | `mdbs.length ? mdbs.reduce((a, e) => a + e.privateCapitalMobilized, 0) / mdbs.length : 0;` |
| `totalProjects` | `borrowers.reduce((a, e) => a + e.projectCount, 0);` |
| `avgAdaptShare` | `mdbs.length ? mdbs.reduce((a, e) => a + e.adaptationShare, 0) / mdbs.length : 0;` |
| `top15Borrowers` | `[...borrowers].sort((a, b) => b.mdbLending - a.mdbLending).slice(0, 15).map(e => ({ name: e.name.slice(0, 10), lending: e.mdbLending }));` |
| `total` | `secEntities.reduce((a, e) => a + (e.type === 'MDB' ? e.climateFinanceCommitted : e.mdbLending), 0);` |
| `additionality` | `Math.min(100, m.privateCapitalMobilized / Math.max(0.1, m.climateFinanceCommitted) * 100 / leverageTarget * 100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BORROWER_NAMES`, `ENTITIES`, `MDB_NAMES`, `REGIONS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| MDB Climate Finance 2022 | — | MDB Joint Report on Climate Finance 2023 | Total MDB climate finance 2022 — $29Bn mitigation + $44Bn adaptation; below $100Bn Cop26 goal |
| Private Finance Leverage | — | MDB Joint Report 2023 | MDBs mobilise $2.70 private climate finance per $1 of their own investment — target is 1:5 |
| Adaptation Finance Gap | — | UNEP Adaptation Gap Report 2023 | Global adaptation finance flows represent ~10% of what is needed — MDBs provide 87% of public adaptation finance |
- **MDB project databases (World Bank, ADB, EBRD)** → Climate finance tracking → **Institution/sector/region climate finance totals and trends**
- **Rio marker data + climate co-benefit % assessments** → Paris alignment scoring → **Alignment score by MDB and project type vs Common Approach**
- **Private co-investment data** → Leverage ratio calculation → **Private capital mobilised per $1 MDB concessional input**

## 5 · Intermediate Transformation Logic
**Methodology:** MDB Climate Finance Additionality
**Headline formula:** `Additionality = ClimateFinance_MDB / (ClimateFinance_Private - ClimateFinance_CounterfactualBase); LeverageRatio = TotalPrivateMobilised / MDBConcessionalInput`

Additionality measures financing that would not occur without MDB involvement; leverage ratio tracks private capital mobilised per $1 of concessional MDB finance

**Standards:** ['MDB Joint Climate Finance Tracking Methodology 2023', 'OECD DAC Blended Finance Principles 2017', 'GCF Investment Framework', 'MDB Paris Alignment Common Approach 2021']
**Reference documents:** MDB Joint Report on Climate Finance 2023; OECD DAC Blended Finance Principles 2017; MDB Paris Alignment Common Approach — Technical Note (2021); GCF Investment Framework for Climate Finance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry specifies two formulas:
> `Additionality = ClimateFinance_MDB / (ClimateFinance_Private − ClimateFinance_CounterfactualBase)`
> and `LeverageRatio = TotalPrivateMobilised / MDBConcessionalInput`. **Neither is implemented.**
> There is no counterfactual-base variable anywhere in the code, and the page's actual "Additionality
> Score" (Tab 7) is a different, dimensionally inconsistent formula built from a user-adjustable
> `leverageTarget` slider, not from a counterfactual baseline. The rest of the page (Tabs 0–6) is a
> straightforward aggregation dashboard over synthetic per-entity data. Sections below describe the
> code as written.

### 7.1 What the module computes

60 synthetic entities — 12 MDBs (World Bank, ADB, AfDB, IDB, EBRD, EIB, IFC, AIIB, IsDB, NDB, CAF,
FONPLATA) and 48 borrower countries — are generated once via the platform's seeded PRNG
`sr(s) = frac(sin(s+1)×10⁴)`:

```js
// MDBs (i = 0..11)
climateFinanceCommitted  = 5 + sr(i*11) * 45          // $5–50Bn/yr
mitigationShare          = round(40 + sr(i*7) * 45)   // 40–85%
adaptationShare          = round(15 + sr(i*13) * 40)  // 15–55%
privateCapitalMobilized  = 1 + sr(i*17) * 29          // $1–30Bn
capitalAdequacyPct       = 12 + sr(i*19) * 18         // 12–30%

// Borrowers (i = 0..47)
mdbLending    = 0.2 + sr(i*23) * 9.8                  // $0.2–10Bn
projectCount  = round(1 + sr(i*29) * 19)              // 1–20
grantShare    = round(5 + sr(i*31) * 60)               // 5–65%
concessionality = 1 + sr(i*37) * 9                     // 1–10×
```

Tabs 0–6 filter (`typeFilter`/`regionFilter`/`sectorFilter`) and aggregate these 60 rows: totals,
means, top-15 rankings, and a committed-vs-mobilised scatter with an inline "Leverage" tooltip
computed only at hover time (`y/x`, i.e. private ÷ committed — a genuine ratio, but a different one
from the headline "Additionality" metric on Tab 7).

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| PRNG seeds | `i*11, i*7, i*13, i*17, i*19` (MDBs); `i*23, i*29, i*31, i*37` (borrowers) | Arbitrary co-prime-ish multipliers to decorrelate the fields — standard platform pattern, not sourced |
| `climateFinanceCommitted` range | $5–50Bn | Loosely anchored to real MDB climate-finance scale (WBG ≈$35Bn, ADB ≈$14Bn in the sister module) but not the same numbers |
| `leverageTarget` (user slider) | 1×–10×, default 3× | UI parameter; 3× approximates the "$2.70 per $1" real MDB average cited in the guide's own dataPoints |
| `concessionality` slider | 0–100%, default 20% | UI filter threshold for the "Eligible Borrowers" KPI |

### 7.3 Calculation walkthrough — the Tab-7 "Additionality Score"

```js
additionality = Math.min(100,
  m.privateCapitalMobilized / Math.max(0.1, m.climateFinanceCommitted) * 100 / leverageTarget * 100
)
```

Rewriting: `additionality = min(100, (leverage_ratio × 100 / leverageTarget) × 100)`, i.e.
`min(100, leverage_ratio / leverageTarget × 10,000)`. Because `leverage_ratio` (private ÷ committed)
is typically 0.1–2 across the seeded MDBs and `leverageTarget` defaults to 3, the multiplier `10,000`
saturates the score at 100 for almost every entity — the metric is **not discriminating** in its
default configuration; it only drops below 100 when `leverage_ratio` is roughly two orders of
magnitude below target.

### 7.4 Worked example

MDB `i=3` (EIB, index 3 among the first 12): `climateFinanceCommitted = 5 + sr(3×11)×45`,
`privateCapitalMobilized = 1 + sr(3×17)×29`. Using illustrative seeded outputs
`climateFinanceCommitted ≈ 28.4`, `privateCapitalMobilized ≈ 9.6` (order-of-magnitude consistent with
the `sr()` range):

| Step | Computation | Result |
|---|---|---|
| Leverage ratio | 9.6 / 28.4 | 0.338× |
| Scaled term | 0.338 × 100 / 3 (leverageTarget) | 11.27 |
| Additionality (×100, capped) | min(100, 11.27 × 100) | **100** (saturated) |

Even a sub-1× leverage ratio saturates the score at the default target — illustrating why the metric
needs the redesign in §8, not a bug fix, to be decision-useful.

### 7.5 Companion analytics

- **Concessionality Analysis (Tab 6)** — counts borrowers with `grantShare ≥ concessionality`
  threshold; "Avg Leverage (MDBs)" KPI computes `mean(private/committed)` across MDBs — this is the
  metric that should anchor Tab 7, not the saturating formula above.
- **Sector Allocation (Tab 5)** — per-sector totals rendered as horizontal bars scaled by
  `min(100, total*2)`% — a display-only scaling constant, not a percentage of any real denominator.

### 7.6 Data provenance & limitations

- **All 60 entities are synthetic**, generated by `sr()` — no linkage to actual World Bank, ADB, or
  other MDB disclosed figures despite plausible magnitude ranges.
- The guide's counterfactual-based additionality formula is unimplementable from the current fields
  (there is no `ClimateFinance_CounterfactualBase` concept in the data model at all).
- The implemented "Additionality Score" is scale-sensitive to `leverageTarget` in a way that produces
  near-constant 100% scores for realistic inputs — a genuine methodological gap, not merely
  unsourced data.

**Framework alignment:** OECD DAC Blended Finance Principles 2017 (mobilisation causality — not
implemented) · MDB Paris Alignment Common Approach 2021 (referenced in guide, not computed) · MDB
Joint Climate Finance Tracking Methodology 2023 (mitigation/adaptation split — implemented only as
static seeded shares, not derived from project-level tagging).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Replace the saturating ad-hoc "Additionality Score" with a genuine, non-saturating additionality and
leverage metric usable by DFI investment committees to compare MDBs' catalytic effectiveness, covering
the 12 tracked MDBs and their borrower-country project pipelines.

### 8.2 Conceptual approach
Adopt the **OECD DAC counterfactual mobilisation framework** (would the private capital have flowed
without the MDB's instrument?) combined with **GCF Investment Framework** co-financing scoring —
the same two benchmarks the guide already names — rather than a single ratio normalised by a
user-movable target.

### 8.3 Mathematical specification

```
Additionality_i = 1 − (PrivateFinance_counterfactual_i / PrivateFinance_actual_i)
LeverageRatio_i = PrivateFinance_mobilised_i / MDBConcessionalInput_i     (unbounded, not min(100,·))
```
`PrivateFinance_counterfactual_i` is estimated via a matched-comparator approach: private investment
rate in comparable non-MDB-supported projects in the same sector/country risk bucket (OECD DAC
counterfactual methodology, §4.2).

| Parameter | Calibration source |
|---|---|
| Comparator sector/country risk buckets | OECD DAC CRS++ micro-data, matched on sector × country income group |
| Concessional-input definition | GCF Investment Framework — grant-equivalent value of concessional tranche |
| Leverage benchmark | CPI Global Landscape of Climate Finance system-wide average (report annually) |

### 8.4 Data requirements
Project-level private co-investment records with counterfactual matching covariates (sector, country,
year, instrument type) — not currently in any `reference_data` table; would require OECD DAC CRS
micro-data ingestion, comparable in scope to the platform's existing World Bank/OWID pulls.

### 8.5 Validation & benchmarking plan
Backtest `LeverageRatio_i` against each MDB's disclosed annual mobilisation ratio (published in MDB
Joint Reports); validate `Additionality_i` is bounded [0,1] for all entities and correlates directionally
with independent additionality assessments in MDB self-evaluation reports (IEG, IDEV, OPEV).

### 8.6 Limitations & model risk
Counterfactual estimation is the single hardest problem in blended-finance measurement — no dataset
gives a clean "what would have happened without the MDB" answer. The model should report additionality
as a range (low/base/high comparator assumption) rather than a point estimate, and should never let a
UI slider (like the current `leverageTarget`) silently redefine the denominator of a headline metric.

## 9 · Future Evolution

### 9.1 Evolution A — Replace the seeded entity panel and fix the additionality formula (analytics ladder: rung 1 → 2)

**What.** §7 documents two distinct problems: the 60-entity panel (12 MDBs + 48 borrowers) is entirely `sr()`-seeded — climate finance committed, mobilisation, adaptation shares all draws loosely near real magnitudes but not real numbers — and the Tab-7 "Additionality Score" is a **dimensionally inconsistent formula** built from a user slider (`mobilised/committed × 100 / leverageTarget × 100`), unrelated to the guide's counterfactual-based definition; meanwhile the hover-tooltip leverage (`y/x`) computes a *different* ratio from the headline metric on the same page. Evolution A: (1) share the sibling `mdb-climate-finance` module's reconciled Joint-Report data layer — the two modules must not maintain divergent MDB numbers (the platform already has one documented JETP-figure inconsistency; this family shouldn't add another); (2) borrower-side figures from the MDBs' public project databases aggregated by country; (3) additionality re-scoped honestly — the guide's counterfactual formula is unmeasurable without evaluation studies, so implement the well-defined leverage ratio per OECD DAC attribution and present additionality as a *qualitative evidence framework* (project-level additionality claims with evaluation citations), not a fabricated score.

**How.** (1) The dimensional inconsistency logged in the calc-defect backlog; Tab 7 rebuilt as leverage-vs-target benchmarking with units checked. (2) One `mdb_climate_finance` refdata set (owned by the sibling module) consumed here for institution rows; borrower aggregation as a curated annual extract. (3) The tooltip and headline metrics unified to one defined ratio. (4) The Paris-alignment tab grounds in the Common Approach's published building blocks rather than draws.

**Prerequisites.** Sibling data layer landed first (sequencing dependency); the seeded generation deleted. **Acceptance:** institution figures identical across both MDB modules; the leverage ratio is dimensionally coherent and matches the tooltip; additionality renders as evidence framework, not a slider-derived score.

### 9.2 Evolution B — DFI investment-committee brief copilot (LLM tier 2)

**What.** The stated users (DFI ICs, sovereign clients, negotiators) need comparative briefs: "how does AfDB's adaptation share and leverage compare to peers over three reporting years?", "what does the Common Approach require an MDB to demonstrate for Paris alignment, and where does institution X's disclosure stand?", "which borrower countries concentrate our region's climate lending, and in what sectors?" Grounded in the shared reconciled data layer and the curated methodology references, with tool-called computations for shares and deltas.

**How.** Tier 2 over the shared flows routes: comparative rankings show the arithmetic and reporting-year vintages; methodology questions quote the curated Joint-Report/OECD/Common-Approach references — the definitional differences between tracking methodologies are precisely where free recall fails and citations matter. Additionality questions get the honest framing Evolution A establishes: the copilot explains why a numeric additionality score is not computable from tracking data and presents the leverage ratio plus qualitative evidence instead — refusing to reconstruct the deleted pseudo-score is the discipline test. Sibling routing: aggregate accountability analysis to `mdb-climate-finance`, loan-structuring math to `mdb-sub-sovereign-lending`.

**Prerequisites.** Evolution A and the sibling data layer; Phase 2 tooling. **Acceptance:** cross-module figures agree; every comparison carries vintages; additionality answers present the framework, never a synthesized score.