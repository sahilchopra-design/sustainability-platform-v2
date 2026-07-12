# Sovereign Climate Risk
**Module ID:** `sovereign-climate-risk` · **Route:** `/sovereign-climate-risk` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Sovereign-level climate physical and transition risk scoring assessing country vulnerability to climate hazards, fossil fuel dependence, and policy transition trajectories.

> **Business value:** Provides country-level physical and transition climate risk scores for integration into sovereign bond risk management frameworks.

**How an analyst works this module:**
- Score physical hazard by aggregating flood, heat, drought and sea-level rise indices per country.
- Measure transition sensitivity: fossil fuel revenue share, carbon export dependence, stranded asset risk.
- Assess policy risk via NDC ambition gap relative to Paris-consistent emission pathways.
- Compute composite score and rank sovereign issuers for bond portfolio risk management.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `COUNTRIES`, `NGFS_SCENARIOS`, `SCENARIO_COLORS`, `SCENARIO_TO_BACKEND`, `SOV_API`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COUNTRIES` | 51 | `name`, `region`, `ndGain`, `fossilPct`, `rating`, `spread`, `itr`, `population`, `gdp`, `co2PerCapita` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `SOV_API` | ``${API}/api/v1/sovereign-climate-risk`;` |
| `_SOVMACRO_MAP` | `Object.fromEntries((SOVEREIGN_MACRO_2024\|\|[]).map(c=>[c.country,c]));` |
| `vulnAdj` | `Math.max(0, (60 - ndGain) * 3.5);` |
| `fossilAdj` | `fossilPct * 4.2;` |
| `regions` | `['All', ...new Set(COUNTRIES.map(c => c.region))];` |
| `fossilExporters` | `COUNTRIES.filter(c => c.fossilPct > 5).sort((a, b) => b.fossilPct - a.fossilPct);` |
| `strandedData` | `useMemo(() => fossilExporters.slice(0, 15).map(c => ({ name: c.iso, ...Object.fromEntries(NGFS_SCENARIOS.map(s => [s, +(computeStrandedRevenue(c.fossilPct, c.gdp, s)).toFixed(1)])) })), []);` |
| `spreadData` | `useMemo(() => filtered.slice(0, 20).map(c => ({ name: c.iso, base: c.spread, climateAdj: engineAdjSpread(c), isLive: !!liveByIso[c.iso], })), [filtered, scenario, liveByIso]);` |
| `itrData` | `useMemo(() => filtered.map(c => ({ name: c.iso, itr: c.itr, target: 1.5, gap: +(c.itr - 1.5).toFixed(1), ndGain: c.ndGain })), [filtered]);` |
| `vulnRadar` | `useMemo(() => { if (basketAllLive) { // Real engine component decomposition — all dims 0-100, higher = worse. const dims = ['Physical Risk', 'Transition Risk', 'Fiscal Vulnerability', 'Adaptation Gap', 'Composite Risk'];` |
| `adj` | `scenLive ? Math.round(c.spread + scenLive.spread_delta_bps) : computeClimateSpread(c.spread, c.ndGain, c.fossilPct, s);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sovereign-climate-risk/assess` | `assess_sovereign` | api/v1/routes/sovereign_climate_risk.py |
| POST | `/api/v1/sovereign-climate-risk/portfolio` | `assess_portfolio` | api/v1/routes/sovereign_climate_risk.py |
| GET | `/api/v1/sovereign-climate-risk/ref/profiles` | `ref_profiles` | api/v1/routes/sovereign_climate_risk.py |
| GET | `/api/v1/sovereign-climate-risk/ref/scenarios` | `ref_scenarios` | api/v1/routes/sovereign_climate_risk.py |
| GET | `/api/v1/sovereign-climate-risk/ref/countries` | `ref_countries` | api/v1/routes/sovereign_climate_risk.py |

### 2.3 Engine `sovereign_climate_risk_engine` (services/sovereign_climate_risk_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `SovereignClimateRiskEngine.assess_sovereign` | country_iso2, scenario, horizon, physical_risk_override, transition_readiness_override | Compute climate-adjusted sovereign risk for one country. |
| `SovereignClimateRiskEngine.assess_portfolio` | portfolio_name, holdings, scenario, horizon | Assess climate risk for a sovereign bond portfolio. holdings: list of {"country_iso2": "XX", "exposure_usd": 1000000} |
| `SovereignClimateRiskEngine.get_sovereign_profiles` |  |  |
| `SovereignClimateRiskEngine.get_climate_scenarios` |  |  |
| `SovereignClimateRiskEngine.get_country_list` |  |  |

**Engine `sovereign_climate_risk_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `SOVEREIGN_PROFILES` | `{'US': {'name': 'United States', 'physical_risk': 4.5, 'transition_readiness': 6.0, 'fiscal_resilience': 7.5, 'ndc_ambition': 5.0, 'nd_gain': 73.0, 'credit_rating_sp': 'AA+', 'region': 'north_america', 'gdp_usd_bn': 25462, 'debt_to_gdp_pct': 123.0}, 'GB': {'name': 'United Kingdom', 'physical_risk': ` |
| `CLIMATE_SCENARIOS` | `{'net_zero_2050': {'label': 'Net Zero 2050 (NGFS Orderly)', 'physical_risk_multiplier_2030': 1.0, 'physical_risk_multiplier_2050': 1.1, 'transition_pressure_2030': 1.4, 'transition_pressure_2050': 1.2, 'description': 'Immediate, ambitious policy action — high transition pressure near-term'}, 'below_` |
| `RATING_NOTCH_MAP` | `{'AAA': 22, 'AA+': 21, 'AA': 20, 'AA-': 19, 'A+': 18, 'A': 17, 'A-': 16, 'BBB+': 15, 'BBB': 14, 'BBB-': 13, 'BB+': 12, 'BB': 11, 'BB-': 10, 'B+': 9, 'B': 8, 'B-': 7, 'CCC+': 6, 'CCC': 5, 'CCC-': 4, 'CC': 3, 'C': 2, 'D': 1, 'NR': 0}` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `COUNTRIES`, `NGFS_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Avg Physical Score | — | ND-GAIN/IPCC | Portfolio-weighted mean physical hazard score across sovereign bond holdings. |
| Fossil Revenue Exposure | — | IEA/IMF | Share of portfolio sovereign issuers with fossil fuel revenues >10% of GDP. |
| NDC Alignment Rate | — | Climate Action Tracker | Proportion of sovereign issuers with NDCs assessed as compatible with 2°C pathway. |
- **ND-GAIN, IEA, IMF, Climate Action Tracker country data** → Pillar scoring, composite weighting, portfolio aggregation → **Country risk scores, sovereign comparison tables, portfolio risk dashboard**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sovereign-climate-risk/ref/countries** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['countries'], 'n_keys': 1}`

**GET /api/v1/sovereign-climate-risk/ref/profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sovereign_profiles'], 'n_keys': 1}`

**GET /api/v1/sovereign-climate-risk/ref/scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['climate_scenarios'], 'n_keys': 1}`

**POST /api/v1/sovereign-climate-risk/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sovereign-climate-risk/portfolio** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Sovereign Climate Risk Score
**Headline formula:** `(Physical Hazard × 0.4) + (Transition Sensitivity × 0.35) + (Policy Risk × 0.25)`

Country climate risk composite weighting physical hazard exposure, economic transition sensitivity and climate policy ambition gap.

**Standards:** ['NGFS', 'World Bank CCDR', 'IEA WEO']
**Reference documents:** NGFS Sovereign Physical Risk Assessment 2022; World Bank Country Climate and Development Report; IEA World Energy Outlook 2023; Climate Action Tracker Country Assessments

**Engine `sovereign_climate_risk_engine` — extracted transformation lines:**
```python
physical_score = min(100.0, (phys / 10.0) * 100 * phys_mult)
transition_score = min(100.0, ((10.0 - trans_ready) / 10.0) * 100 * trans_press)
fiscal_score = min(100.0, ((10.0 - fiscal) / 10.0) * 100 * (0.7 + 0.3 * debt_factor))
adaptation_score = max(0.0, 100.0 - nd_gain)
adjusted_notch = max(1, baseline_notch + notch_adj)
spread_delta = round((composite - 30) * 2.0 + 5, 1)
weight = exposure / total_exposure if total_exposure > 0 else 0
climate_var = total_exposure * (weighted_spread / 10000) * assumed_duration
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `sovereign_climate_risk_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `sovereign-corporate-bridge` | engine:sovereign_climate_risk_engine |

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

## 9 · Future Evolution

### 9.1 Evolution A — Wire the frontend to the existing engine and fix the failing endpoints (analytics ladder: rung 1 → 3)

**What.** This module has a paradox documented in its §7 flag: a fully-worked backend engine (`sovereign_climate_risk_engine`, blast radius 2) exists with a genuine weighted composite (physical 30% + transition 25% + fiscal 25% + adaptation 20%), rating-notch mapping, and spread-delta calibration — but **the frontend page never calls it**, instead hand-rolling two simpler client-side functions (`computeStrandedRevenue`, `computeClimateSpread`) against an independent 51-country dataset that duplicates-but-disagrees-with the backend's 60-country `SOVEREIGN_PROFILES`. Worse, the lineage sweep records both `POST /assess` and `/portfolio` as **failed**. So users see a weaker, inconsistent model while the better one sits unused and broken. Evolution A fixes the endpoints and makes the page consume the real engine.

**How.** (1) Triage the two failing POST routes (deployment-prep methodology). (2) Repoint the frontend to `POST /assess` and `/portfolio` so the displayed scores use the engine's real composite, notch mapping, and spread calibration — eliminating the duplicate `COUNTRIES` table and the guide↔code weight mismatch in one move. (3) Fix the hard-coded `itr` (implied temperature rise) displayed against a "1.5°C Target" line as if computed: derive it from the NDC ambition gap or drop it (honest-null). (4) Ground `SOVEREIGN_PROFILES` in live ND-GAIN/IMF feeds and calibrate the stranded-revenue and spread multipliers against realised sovereign CDS/spread moves around climate-policy events (currently uncited monotonic multipliers).

**Prerequisites.** The `/assess` and `/portfolio` failures are the gate; ND-GAIN/IMF ingestion; a spread-event dataset for calibration. **Acceptance:** both POST routes pass the sweep; the frontend and backend show identical scores because the page calls the engine; `itr` is computed or removed.

### 9.2 Evolution B — Sovereign-bond climate-risk analyst (LLM tier 2)

**What.** A tool-calling analyst over the repaired engine: "assess Brazil's sovereign climate risk under delayed transition", "what's the notch adjustment and spread delta for my sovereign portfolio?", "which holdings drive the portfolio's transition risk?" — each a call to `POST /assess` or `/portfolio`, narrating the composite, notch, and spread outputs, never computing them itself.

**How.** Tool schemas from the module's OpenAPI operations (2 POST compute + 3 GET ref); grounding corpus = this Atlas record plus `GET /ref/profiles`, `/ref/scenarios`, `/ref/countries`. Portfolio answers narrate the exposure-weighted composite and tier concentration from the engine's `assess_portfolio` output; the no-fabrication validator checks every score/notch/spread against tool responses. NGFS scenario framing per the reference endpoints.

**Prerequisites (hard).** Evolution A — both compute endpoints currently fail, and the frontend's parallel model disagrees with the engine, so there is no consistent surface to narrate. **Acceptance:** every score/notch/spread traces to an engine call; portfolio attribution matches `assess_portfolio`; a country outside `SOVEREIGN_PROFILES` returns "not covered," not an estimate.