## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** A fully-worked backend engine exists at
> `backend/services/sovereign_climate_risk_engine.py` with a genuine weighted composite (physical 30% +
> transition 25% + fiscal 25% + adaptation 20%), rating-notch mapping, and spread-delta calibration exposed
> via `POST /api/v1/sovereign-climate-risk/assess`. **The frontend page never calls this engine.** It instead
> hand-rolls two much simpler client-side functions (`computeStrandedRevenue`, `computeClimateSpread`)
> against an independent, hand-authored 51-country dataset (`COUNTRIES`) that duplicates — but does not
> match — the backend's `SOVEREIGN_PROFILES` table. The guide's formula
> `(Physical×0.4) + (Transition×0.35) + (Policy×0.25)` matches neither implementation's actual weights. The
> sections below document what the **frontend page** (what a user sees) actually computes, and separately
> summarise the unused backend engine.

### 7.1 What the frontend module computes

`COUNTRIES` is a **hand-authored, non-random** array of 51 sovereigns with plausible real-world-consistent
values for `ndGain` (ND-GAIN score), `fossilPct` (fossil export % of GDP), `rating`, `spread` (bps), and
`itr` (implied temperature rise, °C) — all hard-coded per country, not computed from any model. A GDP/debt
overlay (`SOVEREIGN_MACRO_2024` reference data) patches in real macro figures post-hoc. Two derived
functions run client-side:

```js
computeStrandedRevenue(fossilPct, gdp, scenario) =
    (fossilPct/100) × gdp × strandedFactor[scenario]     // strandedFactor: 0.05→0.55 across 4 NGFS scenarios

computeClimateSpread(baseSpread, ndGain, fossilPct, scenario) =
    round(baseSpread + (vulnAdj + fossilAdj) × scenarioMult[scenario])
  where vulnAdj   = max(0, (60 − ndGain) × 3.5)
        fossilAdj = fossilPct × 4.2
        scenarioMult: Current Policies 1.0 → Net Zero 2050 2.0
```

### 7.2 Parameterisation (frontend)

| Parameter | Value | Provenance |
|---|---|---|
| Stranded-revenue factor by NGFS scenario | Current Policies 0.05, Delayed Transition 0.18, Below 2°C 0.35, Net Zero 2050 0.55 | hand-set; **increasing** with transition ambition — encodes the idea that a faster/more orderly transition strands *more* fossil revenue sooner, not that hot-house scenarios are safer |
| `vulnAdj` threshold | 60 (ND-GAIN score) | arbitrary cut-point, not sourced from ND-GAIN methodology docs |
| `fossilAdj` multiplier | 4.2 bps per % GDP fossil-export share | hand-calibrated, no cited empirical spread-sensitivity study |
| Scenario spread multiplier | 1.0×–2.0× across 4 scenarios | hand-set, monotonic in ambition (same directional logic as stranded-revenue factor) |
| `itr` (implied temperature rise) per country | 1.7 °C (Sweden) – 4.5 °C (Libya) | **hard-coded per country, not computed from any NDC-to-temperature mapping model** |

### 7.3 Calculation walkthrough

- **Sovereign Risk Map** (scatter): plots `ndGain` vs `fossilPct`, colour-coded by a combined threshold rule
  (`fossilPct>15` → red, `ndGain<40` → orange, `ndGain>65` → green, else blue); marker radius scales with
  `gdp`.
- **Climate Vulnerability Index**: simple top/bottom-20 bar sort on the static `ndGain` field; a "basket
  radar" (up to 6 countries) derives 5 synthetic dimensions from `ndGain`/`fossilPct`/`spread` via ad-hoc
  formulas, e.g. `Exposure = 100 − ndGain + fossilPct×0.5`, `Fiscal Space = min(100, 100 − spread×0.05)`.
- **Fossil Export Dependency**: filters countries with `fossilPct > 5`; flags `>15%` as "extreme transition
  risk" and computes stranded revenue at the selected scenario via `computeStrandedRevenue`.
- **Credit Spread Sensitivity**: runs `computeClimateSpread` across all 4 NGFS scenarios per country and
  tabulates base vs climate-adjusted spread.
- **ITR for Sovereigns**: bar chart of the static `itr` field against 1.5 °C/2 °C reference lines; a
  watchlist highlights countries with `itr > 3`.

### 7.4 Worked example (Saudi Arabia, Net Zero 2050)

`ndGain=45.2`, `fossilPct=38.5%`, `gdp=$1,108B`, `spread=82bps`:

| Step | Computation | Result |
|---|---|---|
| Stranded revenue | (38.5/100) × 1108 × 0.55 | **$234.6B** |
| % of GDP at risk | 234.6/1108 × 100 | **21.2%** |
| `vulnAdj` | max(0, (60−45.2)×3.5) | 51.8 |
| `fossilAdj` | 38.5 × 4.2 | 161.7 |
| Climate-adjusted spread | round(82 + (51.8+161.7) × 2.0) | **509 bps** (vs 82bps base) |

### 7.5 Unused backend engine (for reference)

`SovereignClimateRiskEngine.assess_sovereign()` computes, per country and NGFS-style scenario:

```
physical_score    = min(100, (physical_risk/10) × 100 × phys_mult_scenario)
transition_score  = min(100, ((10−transition_readiness)/10) × 100 × trans_pressure_scenario)
fiscal_score      = min(100, ((10−fiscal_resilience)/10) × 100 × (0.7 + 0.3×min(2, debt/gdp)))
adaptation_score  = max(0, 100 − nd_gain)
composite = 0.30×physical + 0.25×transition + 0.25×fiscal + 0.20×adaptation
notch_adj = −3 / −2 / −1 / 0 for composite ≥70 / ≥55 / ≥40 / <40
spread_delta_bps = (composite − 30) × 2.0 + 5   (if composite > 30, else 0)
```
This is a materially more defensible design (four independently-motivated sub-scores, an explicit
rating-notch ladder, a portfolio-exposure-weighted aggregation in `assess_portfolio()`) than the frontend's
two ad-hoc functions — but it is **entirely dead code from the UI's perspective**; no page wires to
`/api/v1/sovereign-climate-risk/assess` or `/portfolio`.

### 7.6 Data provenance & limitations

- Both the frontend `COUNTRIES` table and the backend `SOVEREIGN_PROFILES` table are **hand-authored,
  static, single-point-in-time estimates** — not live ND-GAIN/IMF/World Bank feeds despite being labelled
  as sourced from them. They also **disagree with each other** for the same country (e.g. different
  `physical_risk`/`ndGain` conventions), so a user comparing this page to any future integration of the
  backend engine will see inconsistent numbers.
- `itr` (implied temperature rise) is a **flat hard-coded value per country**, not derived from any NDC
  ambition-gap or emissions-trajectory model — despite being displayed alongside a "1.5°C Target" reference
  line as if it were computed.
- The stranded-revenue and spread-sensitivity scenario factors are monotonic hand-tuned multipliers with no
  cited empirical basis (no regression against realised sovereign CDS/bond spread moves around climate
  policy events).
- `SOVEREIGN_MACRO_2024` overlay only patches GDP/debt/rating fields; it does not touch the climate-specific
  fields (`ndGain`, `fossilPct`, `itr`).

### 7.7 Framework alignment

- **NGFS scenario taxonomy** — the 4 named scenarios (Current Policies, Delayed Transition, Below 2°C, Net
  Zero 2050) correctly mirror NGFS Phase IV scenario families; only the *directional* logic (monotonic
  stranding/spread increase with ambition) is implemented, not NGFS's actual macro-financial variable paths.
- **ND-GAIN Country Index** — used as a vulnerability input field but not recomputed from ND-GAIN's own
  readiness/vulnerability sub-index methodology.
- **World Bank CCDR / IEA WEO** — cited in the guide as sources; not integrated as live data.
- The unused backend engine is closer in spirit to how MSCI/S&P sovereign climate scoring operationalises a
  weighted composite with a rating-notch translation layer — see §8 for the production specification that
  would connect frontend and backend.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

A single, reconciled sovereign climate risk score for (a) sovereign bond portfolio risk management, (b)
climate-adjusted spread/rating overlays, and (c) stranded-revenue exposure reporting — resolving the current
frontend/backend duplication into one calculation path the UI actually calls.

### 8.2 Conceptual approach

Adopt the backend engine's weighted-composite architecture (already reasonably designed) as the single
source of truth, and recalibrate its scenario multipliers and spread-delta regression against realised
market data — mirroring how **S&P Global's ESG-adjusted sovereign ratings** and **MSCI's Sovereign Climate
VaR** combine independently-scored physical/transition/fiscal/adaptive pillars into one notch overlay, and
benchmarking the spread-delta step against **NGFS/BIS studies of climate-related sovereign CDS repricing**.

### 8.3 Mathematical specification

Keep the backend's four sub-scores and weights (30/25/25/20 — reasonable priors pending recalibration) but
replace the flat rating-notch step function and linear spread-delta with regression-fit versions:

```
composite = 0.30·Physical + 0.25·Transition + 0.25·Fiscal + 0.20·Adaptation      (as implemented)
NotchAdj  = round(α × composite)                          // α fit via ordered-logit on historical S&P/Moody's notch actions following climate-relevant events
SpreadΔ_bps = β₀ + β₁·composite + β₂·(FossilPct × ScenarioStress)                // OLS fit on realised sovereign CDS/bond spread reactions
ITR_country = NDCTrajectoryTemp(EmissionsPath_country, remainingCarbonBudget)     // replaces the hard-coded itr field
```
`ITR_country` should use the same NDC-to-temperature methodology as CDP/SBTi portfolio ITR tooling: project
each country's NDC-implied emissions path against the remaining global carbon budget for 1.5 °C/2 °C, per
Climate Action Tracker's published country-level warming methodology.

| Parameter | Calibration source |
|---|---|
| α (notch elasticity) | Historical S&P/Moody's/Fitch notch actions citing climate factors (event study) |
| β₀/β₁/β₂ (spread regression) | EMBI/sovereign CDS spread time series regressed on composite score changes |
| ITR methodology | Climate Action Tracker country rating methodology (public) |
| Stranded-revenue factors | IEA WEO scenario-specific fossil-fuel revenue projections by exporter (public, per-country) |

### 8.4 Data requirements

Reconciled single `sovereign_climate_profiles` table (merge frontend `COUNTRIES` and backend
`SOVEREIGN_PROFILES`), historical sovereign CDS/bond spread time series (Bloomberg/Refinitiv), historical
rating-action database with rationale text (S&P/Moody's/Fitch, for the α regression), Climate Action
Tracker country ratings (public), IEA WEO scenario fossil-revenue projections by country (public).

### 8.5 Validation & benchmarking plan

Backtest `SpreadΔ_bps` against realised spread moves around known climate-policy shock dates (COP
announcements, NGFS scenario updates). Reconcile `composite` against MSCI/S&P published sovereign climate
scores for overlapping country coverage. Validate `ITR_country` against Climate Action Tracker's own
published ratings (target: same rating band for ≥80% of countries).

### 8.6 Limitations & model risk

Sovereign rating actions are multi-causal; isolating a "climate elasticity" α from historical notch changes
is confounded by concurrent macro/political drivers — treat α as a soft prior with wide confidence bands,
not a precise coefficient. Stranded-revenue projections are highly scenario-dependent and should always be
shown as a range (P25/P50/P75) rather than a point estimate.
