# City Net Zero Tracker
**Module ID:** `city-net-zero-tracker` · **Route:** `/city-net-zero-tracker` · **Tier:** B (frontend-computed) · **EP code:** EP-DM6 · **Sprint:** DM

## 1 · Overview
Tracks progress of major cities toward net zero targets — monitoring sectoral emissions pathways, policy implementation, and alignment with 1.5°C science-based city targets. Benchmarks against C40, Race to Zero, and IPCC AR6 urban emission reduction requirements.

> **Business value:** Applicable to city sustainability officers benchmarking against peers, sovereign investors assessing municipal credit quality, and impact investors funding urban climate solutions. SBT4C certification and C40 alignment are increasingly required for city green bond credibility.

**How an analyst works this module:**
- Select city and review net zero commitment and baseline
- Track sectoral progress vs annual pathway
- Calculate alignment gap vs C40/SBT4C 1.5°C trajectory
- Identify off-track sectors for policy acceleration
- Generate Race to Zero compatible progress report

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CITIES`, `CITY_NAMES`, `KpiCard`, `REGIONS`, `SECTOR_OPTIONS`, `TABS`, `TARGET_BUCKETS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East & Africa'];` |
| `pop` | `+(0.3 + sr(i * 3) * 19.7).toFixed(1);` |
| `tgtYr` | `[2030, 2035, 2040, 2050][Math.floor(sr(i * 7) * 4)];` |
| `baseline` | `+(2 + sr(i * 11) * 28).toFixed(1);` |
| `redPct` | `+(10 + sr(i * 13) * 60).toFixed(1);` |
| `current` | `+(baseline * (1 - redPct / 100)).toFixed(2);` |
| `onTrack` | `sr(i * 17) > 0.4;` |
| `sectorCount` | `2 + Math.floor(sr(i * 19) * 4);` |
| `offsetReliance` | `+(5 + sr(i * 23) * 45).toFixed(1);` |
| `finGap` | `+(0.5 + sr(i * 29) * 19.5).toFixed(1);` |
| `implScore` | `Math.round(20 + sr(i * 31) * 80);` |
| `c40` | `sr(i * 37) > 0.5;` |
| `rtz` | `sr(i * 41) > 0.35;` |
| `avgReduction` | `filtered.length ? (filtered.reduce((s, c) => s + c.reductionToDate, 0) / filtered.length).toFixed(1) : '0';` |
| `onTrackPct` | `filtered.length ? (filtered.filter(c => c.onTrack).length / filtered.length * 100).toFixed(0) : '0';` |
| `totalFinGap` | `filtered.reduce((s, c) => s + c.financeGap, 0).toFixed(1);` |
| `topReduction` | `[...filtered].sort((a, b) => b.reductionToDate - a.reductionToDate).slice(0, 20)` |
| `scatterImpl` | `filtered.map(c => ({ x: c.implementationScore, y: c.financeGap, name: c.name }));` |
| `sectorCovData` | `SECTOR_OPTIONS.map(s => ({` |
| `finGapByRegion` | `REGIONS.map(r => {` |
| `pct` | `arr.length ? Math.round(arr.filter(c => c.onTrack).length / arr.length * 100) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITY_NAMES`, `REGIONS`, `SECTOR_OPTIONS`, `TABS`, `TARGET_BUCKETS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Cities with Net Zero Targets | — | Race to Zero Cities 2024 | Over 1,100 cities globally have committed to net zero — representing 1Bn+ people |
| Urban Emissions Share | — | C40 Cities 2023 | Cities generate 70% of global CO2 emissions while housing 55% of population — primary decarbonisation battleground |
| SBT4C 1.5°C Cities | — | SBT4C Progress Report 2023 | 108 cities have certified science-based targets aligned with 1.5°C — growing 40% yr-on-yr |
- **CDP Cities emissions disclosure data** → Progress tracking → **Annual city emissions by sector vs target pathway**
- **C40/ICLEI climate action plan databases** → Policy tracking → **Committed policies vs required actions for net zero**
- **SBT4C pathway data by city type and region** → Alignment gap calculation → **Annual permitted emissions vs actual trajectory**

## 5 · Intermediate Transformation Logic
**Methodology:** City Net Zero Progress Score
**Headline formula:** `NZProgress = Σ [w_sector × (TargetReduction - ActualReduction) / TargetReduction]; AlignmentGap = CityEmissions - CityNetZeroPathway_t`

Sectoral progress score averages across energy, transport, buildings, waste; alignment gap measures annual deviation from science-based pathway — negative gap means ahead of schedule

**Standards:** ['C40 City Climate Action Planning 2023', 'Science Based Targets for Cities (SBT4C)', 'IPCC AR6 WGIII Chapter 8 — Urban Systems', 'Race to Zero Campaign — Cities']
**Reference documents:** C40 Cities — Deadline 2020: Climate Action Plans; Science Based Targets for Cities (SBT4C) — Protocol and Certification; IPCC AR6 WGIII Chapter 8 — Urban Systems and Other Human Settlements; Race to Zero Campaign — Cities Criteria

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry cites a *City Net Zero Progress
> Score* — `NZProgress = Σ[w_sector × (TargetReduction − ActualReduction)/TargetReduction]` —
> and an `AlignmentGap = CityEmissions − CityNetZeroPathway_t` benchmarked to SBT4C 1.5°C
> pathways. **Neither exists in the code.** `CityNetZeroTrackerPage.jsx` fabricates 75 city
> records with seeded-PRNG draws: `onTrack` is literally a coin-flip (`sr(i·17) > 0.4`), not a
> pathway comparison; there is no sector weighting, no SBT4C pathway, no alignment-gap series.
> The only mechanical relationships are `current = baseline × (1 − reduction%)` and two slider
> threshold filters. Sections below document the code as-is.

### 7.1 What the module computes

75 cities (real names — London, Copenhagen, NYC, Tokyo, Bogotá… — regions assigned `i % 5`,
which contradicts the geographic ordering of the name list) with these generated fields:

| Field | Formula | Range / meaning |
|---|---|---|
| `netZeroTargetYear` | `[2030,2035,2040,2050][⌊sr(i·7)·4⌋]` | uniform over 4 buckets |
| `baselineEmissions` | `2 + sr(i·11)·28` | 2–30 MtCO₂e |
| `reductionToDate` | `10 + sr(i·13)·60` | 10–70 % |
| `currentEmissions` | `baseline × (1 − redPct/100)` | **only derived field** |
| `onTrack` | `sr(i·17) > 0.4` | ~60 % true, random |
| `sectorCoverage` | `SECTOR_OPTIONS.slice(0, 2+⌊sr(i·19)·4⌋)` | first 2–5 of Buildings/Transport/Waste/Energy/Industry |
| `carbonOffsetReliance` | `5 + sr(i·23)·45` | 5–50 % |
| `financeGap` | `0.5 + sr(i·29)·19.5` | $0.5–20 Bn |
| `implementationScore` | `round(20 + sr(i·31)·80)` | 20–100 |
| `c40Member` / `raceToZero` | `sr(i·37)>0.5` / `sr(i·41)>0.35` | ~50 % / ~65 % true |

Note `sectorCoverage` uses `slice(0, n)`, so coverage is always a *prefix* of the sector list —
every city covers Buildings; only cities with n=5 cover Industry. Sector-coverage statistics
are therefore an artefact of list order, not sampling.

### 7.2 Interactive thresholds (the only live "model")

Two sliders drive set-membership counts, no arithmetic on emissions:

```js
// Offset-integrity screen: offsetLimit ∈ [0, 50]%, default 20
highRisk = filtered.filter(c => c.carbonOffsetReliance > offsetLimit)
// Finance mobilisation what-if: finMobilisation ∈ [1, 50] $Bn, default 5
closable = filtered.filter(c => c.financeGap <= finMobilisation)   // count + % displayed
```

The offset screen mirrors Race to Zero's "reduce before offset" principle as a simple
threshold; the finance what-if treats the slider as a per-city budget (each city whose entire
gap ≤ slider counts as "closed") — not a portfolio allocation.

### 7.3 Calculation walkthrough

Filters (region / onTrack / C40 / target bucket) → `filtered` → guarded KPIs: `avgReduction =
Σred/n`, `onTrackPct = count(onTrack)/n·100`, `totalFinGap = Σgap`. Charts: `topReduction`
(copied-sort, top 20 by reduction), `scatterImpl` ({x: implementationScore, y: financeGap} —
uncorrelated by construction), `sectorCovData` (count + % of cities covering each sector),
`finGapByRegion` (regional sums), and an on-track % by region (`pct` with empty-array guard).

### 7.4 Worked example — city i = 0 (London)

`sr(0) ≈ 0.7098` for every seed at i = 0: target year = `[2030,2035,2040,2050][⌊0.7098·4⌋=2]` =
**2040**; baseline = `2 + 0.7098·28` = **21.9 Mt**; reduction = `10 + 0.7098·60` = **52.6%**;
current = `21.9 × (1 − 0.526)` = **10.38 Mt** (code rounds to 10.38); onTrack = `0.7098 > 0.4`
= **true**; sectorCount = `2 + ⌊0.7098·4⌋ = 4` → covers Buildings/Transport/Waste/Energy (not
Industry). With `offsetLimit = 20`: offset reliance `5 + 0.7098·45 = 36.9% > 20` → London is
flagged high offset-reliance despite being "on track" — the two flags are independent draws.

### 7.5 Data provenance & limitations

- **Entirely synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`): no CDP Cities, C40, or Race to
  Zero data is loaded, though the field names and real city names imply those sources. Actual
  membership flags (e.g. London *is* C40) are random here.
- "On track" is a probability threshold, not a comparison of `currentEmissions` against any
  pathway — the guide's central metric is absent.
- Baseline year is undefined; reduction-to-date has no vintage; no GPC inventory scoping
  (Scope 1/2/3, BASIC vs BASIC+).
- Prefix-slice sector coverage biases coverage stats (Buildings 100%, Industry rarest).

### 7.6 Framework alignment

- **Race to Zero (UNFCCC)** — criteria require pledge/plan/proceed/publish plus offset
  limits; the offset-reliance screen loosely gestures at the "reduce first" criterion.
- **SBT4C / Science Based Targets for Cities** — the guide's pathway framework: city targets
  derived from sector-specific 1.5°C budgets (C40 Deadline-2020 method). Not implemented.
- **GPC (WRI/C40/ICLEI Global Protocol for Community-Scale GHG Inventories)** — the standard a
  real tracker would use for `baselineEmissions`/`currentEmissions`; absent.
- **CDP Cities** — the natural free data source (1,100+ reporting cities); unwired.

## 8 · Model Specification — City Net-Zero Pathway & Alignment Gap Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Compute a real on-track status and alignment gap for each tracked city: annual city emissions
vs a science-based pathway to the city's declared net-zero year, decomposed by sector.
Users: muni investors, city benchmarkers. Coverage: the 75-city universe, 2015–2050.

### 8.2 Conceptual approach

Pathway construction follows **C40 Deadline 2020 / SBT4C** methodology (per-capita convergence
toward a 1.5°C urban budget) and the **CDP-ICLEI Track** dataset as the emissions source —
the two dominant public frameworks for city climate accounting. Progress scoring mirrors
**Net Zero Tracker** (Oxford/NewClimate) integrity screening: target coverage, offset caps,
interim milestones.

### 8.3 Mathematical specification

```
E_c(t)        = GPC BASIC inventory, MtCO₂e (Scope 1+2)
Path_c(t)     = E_c(t₀) · (1 − r_c)^(t−t₀),  r_c = 1 − (ε · E_c(T)/E_c(t₀))^(1/(T−t₀))
                // exponential decay to residual ε (≤10%) at net-zero year T
Gap_c(t)      = E_c(t) − Path_c(t)            // Mt; negative = ahead
NZProgress_c  = Σ_s w_s · min(1, ΔE_s,actual/ΔE_s,required)   // guide formula, sector-weighted
OnTrack_c     = Gap_c(t) ≤ 0.05 · E_c(t₀)     // 5% tolerance band
Integrity_c   = 1{offsets ≤ 10% residual} · 1{interim target set} · 1{annual reporting}
```

| Parameter | Source |
|---|---|
| `E_c(t)` inventories | CDP-ICLEI Track public dataset (free); GPC BASIC boundary |
| Sector weights `w_s` | City inventory sector shares (buildings/transport/waste/energy/industry) |
| Residual ε | ≤10% at net-zero per SBTi CNZS v1.2 analogue; Race to Zero offset guidance |
| Required sector cuts | C40 Deadline 2020 sector pathways (buildings −90% by 2050, transport −95% etc., per C40 technical report) |
| Tolerance band 5% | Practitioner setting; sensitivity-tested 2–10% |
| Population/GDP normalisers | UN WUP, OECD metro database (free) |

### 8.4 Data requirements

CDP Cities questionnaire extracts (free, annual), C40/Race to Zero membership registers (free),
city climate action plans for interim targets. Platform reuse: the public reference-data layer
(`reference_data` tables + `useReferenceData` hook) is the natural ingestion path; the page's
existing filter/KPI scaffolding can consume model outputs unchanged.

### 8.5 Validation & benchmarking plan

Cross-check OnTrack flags against Net Zero Tracker and CDP's own progress ratings (agreement
≥75% on a 30-city sample); reconcile pathway slopes with published SBT4C city targets;
backcast test: pathways fitted at 2018 should band-cover realised 2018–2024 emissions for
on-track exemplars (Copenhagen, Oslo); sensitivity to baseline-year choice (2015 vs 2019) and
residual ε.

### 8.6 Limitations & model risk

City inventories lag 2–3 years and boundary definitions vary (BASIC vs BASIC+ inflates
apparent progress when switched); consumption-based (Scope 3) emissions are excluded, flattering
service-economy cities; exponential pathways understate the near-term cuts C40 convex pathways
require. Fallbacks: freeze rating at "insufficient data" when inventory older than 3 years;
flag boundary changes; publish gap with an uncertainty band from inventory restatement history.

## 9 · Future Evolution

### 9.1 Evolution A — Disclosed city inventories and a computed alignment gap (analytics ladder: rung 1 → 2)

**What.** §7 shows the tracker fabricates its subject matter: 75 real city names with
PRNG-drawn targets, baselines, and reductions, and an `onTrack` flag that is literally
a coin flip (`sr(i·17) > 0.4`) — while the guide advertises
`NZProgress = Σ w_sector(TargetRed − ActualRed)/TargetRed` and
`AlignmentGap = CityEmissions − Pathway_t`, neither computed. Evolution A rebuilds on
disclosed data: the CDP-ICLEI Unified Reporting System publishes city GHG inventories,
targets, and climate action plans for thousands of cities (public dataset exports),
giving real baselines, target years, and sectoral splits. The alignment gap then
becomes a genuine computation: a linear-to-target (or C40 Deadline-2020-style) pathway
per city, compared against the latest disclosed inventory year.

**How.** (1) `ref_city_inventories(city, year, sector, tco2e, target_year,
target_pct, source)` ingested from the CDP-ICLEI public export — a bounded annual
refresh, consistent with the platform's 19-ingester pattern. (2) `onTrack` redefined as
`AlignmentGap ≤ 0` — a derivation, not a die roll. (3) The sector-weighted NZProgress
score implemented per the guide's formula over the disclosed sectoral splits, with
cities lacking sectoral data honestly reported at city-total granularity
(honest-nulls).

**Prerequisites (hard).** PRNG purge; CDP data-use terms verified (city-level public
disclosures are redistributable with attribution); disclosure vintage displayed per
city since inventories lag 1–3 years. **Acceptance:** a city whose latest inventory
sits below its interpolated pathway shows `onTrack = true` by computation; every
rendered baseline traces to a disclosed inventory row; zero `sr()` calls remain.

### 9.2 Evolution B — City benchmarking copilot (LLM tier 1)

**What.** Post-Evolution A, a copilot for benchmarking questions: "how does
Copenhagen's progress compare to its 2025 milestone?", "which Asian cities with 2040
targets are off-track?", "what does Race to Zero require that city X hasn't
disclosed?". These are filter/compare narrations over the inventory table plus the §5
standards corpus (C40, SBT4C, Race to Zero criteria) — tier-1 shape, since the module's
computations are aggregations the page already renders.

**How.** Atlas record and the inventory reference table embedded per the tier-1
pattern; comparative answers cite city rows with inventory vintages; criteria questions
cite the standards text. The copilot must state disclosure lag explicitly — "latest
inventory 2023" — rather than presenting stale data as current performance.

**Prerequisites (hard).** Evolution A first: today the honest answer to every progress
question is "these numbers are seeded random", which is no copilot at all.
**Acceptance:** every emissions figure cited matches an inventory row with its year;
asked to predict whether a city will hit its 2030 target, the copilot reports the
computed gap and declines to forecast beyond it.