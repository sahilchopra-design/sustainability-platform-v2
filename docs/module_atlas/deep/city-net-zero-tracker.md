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
