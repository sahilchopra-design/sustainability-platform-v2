# Climate Policy Analyser
**Module ID:** `climate-policy` · **Route:** `/climate-policy` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Global climate policy tracking and impact assessment. Covers NDCs, national net-zero laws, carbon pricing mechanisms, sector regulations, and policy ambition gap analysis.

> **Business value:** Climate policy determines the macro environment for investment returns across all asset classes. Carbon prices, renewable mandates, fossil fuel phase-outs, and building regulations create winners and losers. This module tracks the policy landscape and translates regulatory changes into portfolio implications.

**How an analyst works this module:**
- Global Map shows country NDC ambition ratings (CAT)
- Carbon Pricing Tracker shows ETS and carbon tax coverage globally
- Sector Policy Database shows regulations by sector and jurisdiction
- Ambition Gap shows NDC trajectory vs 1.5/2°C pathways
- Policy Watch monitors upcoming legislation and rulemaking

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `CARBON_PRICING`, `CLIMATE_POLICIES`, `Card`, `ClimatePolicyPage`, `KpiCard`, `LS_PORTFOLIO`, `PIE_COLORS`, `Section`, `SortTh`, `TABS`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CARBON_PRICING` | 17 | `type`, `price_usd`, `coverage_gt`, `coverage_pct_global`, `sectors`, `year_started` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `body` | `rows.map(r => cols.map(c => { const v = typeof c.key === 'function' ? c.key(r) : r[c.key]; return typeof v === 'string' && v.includes(',') ? `"${v}"` : v; }).join(',')).join('\n');` |
| `blob` | `new Blob([hdr + '\n' + body], { type: 'text/csv' });` |
| `pctOf` | `(arr, fn) => arr.length ? ((arr.filter(fn).length / arr.length) * 100).toFixed(0) : '0';` |
| `carbonPricingCoverage` | `CARBON_PRICING.reduce((s, c) => s + c.coverage_pct_global, 0);` |
| `ndcProgressData` | `useMemo(() => [...CLIMATE_POLICIES].sort((a, b) => b.ndc_reduction_pct - a.ndc_reduction_pct).map(c => ({ name: c.iso2, target: c.ndc_reduction_pct, progress: c.ndc_progress_pct, country: c.country })), []);` |
| `carbonPriceSorted` | `useMemo(() => [...CARBON_PRICING].sort((a, b) => b.price_usd - a.price_usd), []);` |
| `renewableGapData` | `useMemo(() => [...CLIMATE_POLICIES].sort((a, b) => { const gapA = parseInt(a.renewable_target_2030) - a.renewable_current_pct;` |
| `gapB` | `parseInt(b.renewable_target_2030) - b.renewable_current_pct;` |
| `cbamCountries` | `useMemo(() => CLIMATE_POLICIES.filter(c => c.cbam_applicable), []); const cbamExposedCompanies = useMemo(() => { const cbamIso = new Set(cbamCountries.map(c => c.iso2));` |
| `climateFinanceData` | `useMemo(() => CLIMATE_POLICIES.filter(c => c.climate_finance_pledge_bn > 0).sort((a, b) => b.climate_finance_pledge_bn - a.climate_finance_pledge_bn), []);` |
| `gap` | `c.ndc_reduction_pct - c.ndc_progress_pct;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/climate-policy/countries` | `countries` | api/v1/routes/climate_policy_radar.py |
| GET | `/api/v1/climate-policy/country/{iso3}` | `country` | api/v1/routes/climate_policy_radar.py |
| GET | `/api/v1/climate-policy/status` | `status` | api/v1/routes/climate_policy_radar.py |
| POST | `/api/v1/climate-policy/assess-jurisdiction` | `assess_jurisdiction` | api/v1/routes/climate_policy_tracker.py |
| POST | `/api/v1/climate-policy/score-ndc` | `score_ndc` | api/v1/routes/climate_policy_tracker.py |
| POST | `/api/v1/climate-policy/carbon-price-gap` | `carbon_price_gap` | api/v1/routes/climate_policy_tracker.py |
| POST | `/api/v1/climate-policy/policy-pipeline` | `policy_pipeline` | api/v1/routes/climate_policy_tracker.py |
| POST | `/api/v1/climate-policy/portfolio-impact` | `portfolio_impact` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/jurisdictions` | `get_jurisdictions` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/fit-for-55` | `get_fit_for_55` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/ira-credits` | `get_ira_credits` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/repowereu` | `get_repowereu` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/carbon-price-corridor` | `get_carbon_price_corridor` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/ngfs-policy-scenarios` | `get_ngfs_policy_scenarios` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/g20-carbon-pricing` | `get_g20_carbon_pricing` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/sector-policy-map` | `get_sector_policy_map` | api/v1/routes/climate_policy_tracker.py |

### 2.3 Engine `climate_policy_tracker_engine` (services/climate_policy_tracker_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ClimatePolicyTrackerEngine._get_jurisdiction` | iso |  |
| `ClimatePolicyTrackerEngine._is_advanced_economy` | iso |  |
| `ClimatePolicyTrackerEngine._get_nze_price` | iso, year |  |
| `ClimatePolicyTrackerEngine.assess_jurisdiction_policy` | jurisdiction | Full jurisdiction policy assessment: NDC ambition, carbon price gap vs IEA NZE, policy stringency, transition risk. |
| `ClimatePolicyTrackerEngine.score_ndc_ambition` | jurisdiction, target_pct, base_year, conditional | Score NDC ambition 0-100 and assess Paris 1.5°C consistency. Uses provided target_pct/base_year if given, otherwise falls back to jurisdiction profile data. |
| `ClimatePolicyTrackerEngine._compute_ambition_score` | target_pct, base_year, ndc_status, net_zero_year | Internal ambition score computation (0-100). |
| `ClimatePolicyTrackerEngine.track_policy_pipeline` | jurisdiction, entity_sector | Track applicable regulations and compliance deadlines for a given jurisdiction + sector combination. |
| `ClimatePolicyTrackerEngine._sector_to_fit55_keywords` | sector |  |
| `ClimatePolicyTrackerEngine._get_applicable_policies` | iso |  |
| `ClimatePolicyTrackerEngine._get_upcoming_deadlines` | iso |  |
| `ClimatePolicyTrackerEngine.calculate_carbon_price_gap` | jurisdiction, current_price | Calculate gap between jurisdiction's carbon price and IEA NZE corridor. Returns gap amount, trajectory analysis, and economic impact estimate. |
| `ClimatePolicyTrackerEngine.assess_policy_portfolio_impact` | portfolio_countries, portfolio_sectors, weights | Assess portfolio-level transition risk from climate policy exposure. Parameters ---------- portfolio_countries : list of ISO2 country codes portfolio_sectors : list of sector names (matching SECTOR_POLICY_MAP keys) weights : exposure weights (must sum to 1); defaults to equal weight |

**Engine `climate_policy_tracker_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `PARIS_15C_BENCHMARK_PCT_FROM_2010` | `43` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `EU` *(shared)*, `__future__` *(shared)*, `datetime` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `those` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CARBON_PRICING`, `CLIMATE_POLICIES`, `PIE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| NDC Coverage | — | UNFCCC | National climate pledges registered under Paris Agreement |
| Ambition Gap | — | CAT synthesis | Current NDCs lead to 2.5-2.9°C warming |
| Implementation Gap | — | CAT/UNEP | Fraction of NDC target not covered by implemented policies |
- **UNFCCC NDC data** → Ambition assessment → **Country policy rating**
- **Implemented policy database** → Gap analysis → **Implementation gap**
- **Policy pipeline** → Impact modelling → **Future trajectory update**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/climate-policy/countries** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'countries', 'provenance'], 'n_keys': 3}`

**GET /api/v1/climate-policy/country/{iso3}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/climate-policy/status** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'mode', 'live_api_exists', 'site_reachable', 'site_check_detail', 'seeded_countries', 'note', 'provenance', 'checked_at'], 'n_keys': 9}`

## 5 · Intermediate Transformation Logic
**Methodology:** NDC ambition and implementation gap
**Headline formula:** `PolicyGap = Required_reductions - Policy_reductions; AmbitionGap = NDC_target - Science_pathway`

Two gaps: ambition gap (NDCs insufficient for Paris target) and implementation gap (policies insufficient for NDC targets). CAT rating system: critically insufficient → insufficient → almost sufficient → 1.5°C compatible.

**Standards:** ['UNFCCC NDC Registry', 'Climate Action Tracker', 'Climate Governance Initiative']
**Reference documents:** UNFCCC NDC Registry; Climate Action Tracker; World Bank Carbon Pricing Dashboard; OECD Global Plastics Outlook

**Engine `climate_policy_tracker_engine` — extracted transformation lines:**
```python
frac = (year - y0) / (y1 - y0)
base_year_adjustment = max(0, (b_year - 2010) * 0.5)
adjusted_paris_benchmark = PARIS_15C_BENCHMARK_PCT_FROM_2010 - base_year_adjustment
gap_vs_15c = max(adjusted_paris_benchmark - t_pct, 0)
target_score = min(70.0, (target_pct / 55) * 70)
base_year_penalty = max(0, (base_year - 2010) * 0.3)
gap = max(nze_price - actual_price, 0)
years_to_close = max(2030 - 2024, 1)
annual_increase_required = gap / years_to_close if year == 2030 else None
gap_2030 = max(self._get_nze_price(iso, 2030) - actual_price, 0)
gap_2050 = max(self._get_nze_price(iso, 2050) - actual_price, 0)
gdp_risk_pct = gap_2030 / 50 * 1.0 if is_ae else gap_2030 / 50 * 0.5
weights = [1.0 / n] * n
weights = [w / total for w in weights]
w = weights[i] if i < len(weights) else 1.0 / n
sector_risk_modifier = max(sector_risk_modifier, 1.0 + overlap * 0.05)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **6** other module(s).
**Shared engines (edits propagate!):** `climate_policy_tracker_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `climate-policy-intelligence` | engine:climate_policy_tracker_engine, table:EU, table:those |
| `critical-minerals` | table:EU |
| `ai-governance` | table:EU |
| `critical-minerals-climate` | table:EU |
| `api-gateway-monitor` | table:EU |
| `sovereign-corporate-bridge` | table:those |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

The page (`ClimatePolicyPage.jsx`) is a **curated 30-country climate policy database** plus a
16-jurisdiction carbon-pricing map, with derived gap and coverage metrics. Unlike most platform
modules there is **no seeded PRNG anywhere** — every row is a hand-entered constant reflecting
real policy facts (e.g. Germany: `carbon_price_usd:45`, `ndc_reduction_pct:65`,
`net_zero_year:2045`, `climate_law_name:'Federal Climate Change Act 2021'`, `coal_phaseout_year:2038`).

Headline computations, quoted from code:

```js
pctOf = (arr, fn) => arr.length ? ((arr.filter(fn).length / arr.length) * 100).toFixed(0) : '0'
carbonPricingCoverage = CARBON_PRICING.reduce((s,c) => s + c.coverage_pct_global, 0)   // ≈ 16.6% of global GHG
avgCarbonPrice = mean of carbon_price_usd over countries with price > 0
gap = c.ndc_reduction_pct - c.ndc_progress_pct                                          // implementation gap, pp
renewableGap = parseInt(renewable_target_2030) - renewable_current_pct                  // pp to 2030 RE target
```

KPI booleans use `pctOf`: `% with net-zero law`, `% Paris-aligned (ndc_progress_pct ≥ 40)`,
`% coal phase-out ≤ 2040`, `% EV mandate`, `% CBAM-applicable`, `% taxonomy-applicable`, and total
`climate_finance_pledge_bn` (sums to ≈ $59.7Bn across pledging countries).

The route is backed by a substantive **backend engine** (`climate_policy_tracker_engine.py`,
tier A, exposed at `/api/v1/climate-policy/*`) with 40 jurisdiction profiles, the EU Fit-for-55
package (13 regulations), 26 IRA tax credits, the IEA NZE carbon-price corridor and 4 NGFS policy
scenarios. Note the page currently renders from its own frontend constants; the engine endpoints
(`/ref/jurisdictions`, `/ref/ngfs-policy-scenarios`, `/ref/carbon-price-corridor`, ...) serve the
reference layer and are not yet the page's data source.

### 7.2 Parameterisation

**Frontend country schema** (30 rows): `carbon_price_usd`, `carbon_pricing_type`,
`ets_coverage_pct`, `ndc_target/base_year/target_year/reduction_pct/progress_pct`, `net_zero_year`,
`net_zero_law`, `climate_law(_name)`, `renewable_target_2030`, `renewable_current_pct`,
`coal_phaseout_year`, `ev_mandate`, `cbam_applicable`, `taxonomy_applicable`,
`climate_finance_pledge_bn`. Values are consistent with public sources (World Bank Carbon Pricing
Dashboard price levels; UNFCCC NDC registry targets) but are static snapshots, not live feeds.

**Backend engine constants (provenanced in code comments):**

| Constant | Value | Source cited in code |
|---|---|---|
| `IEA_NZE_CARBON_PRICE` (AE) | $40 (2022) → $130 (2030) → $250 (2050) | IEA WEO 2023 NZE corridor |
| `IEA_NZE_CARBON_PRICE` (EMDE) | $25 → $90 → $200 | IEA WEO 2023 NZE corridor |
| `PARIS_15C_BENCHMARK_PCT_FROM_2010` | 43% | IPCC AR6 median 1.5°C reduction by 2030 |
| NGFS scenario carbon prices | e.g. Orderly AE 2030 = $200; Hot House 2030 = $20 | NGFS policy scenarios (stylised) |
| Ambition thresholds | tier high ≥70 / medium ≥45 / low ≥25; Paris-1.5°C ≥65, 2°C ≥45 | internal heuristic |

**Engine ambition score** (`_compute_ambition_score`, 0–100):

```
target_score = min(70, target_pct / 55 × 70)                 // 55% NDC ⇒ full 70 pts
status_bonus = {first:0, updated:5, enhanced:10}
nz_bonus     = 15 if net_zero ≤ 2050; 8 if ≤ 2060; else 3
penalty      = max(0, (base_year − 2010) × 0.3)              // older base years inflate headline %
score        = clip(target_score + status_bonus + nz_bonus − penalty, 0, 100)
```

Conditional NDCs are haircut ×0.85. The 55%-anchor and bonus weights are **internal heuristics**,
not published CAT weights.

### 7.3 Calculation walkthrough

1. **Filter/sort** — region + text filters over `CLIMATE_POLICIES`; sortable table (spread-before-
   sort, no mutation).
2. **KPIs** — the `pctOf` share metrics and coverage sum described in §7.1, computed once
   (`useMemo`, `[]` deps) over the full 30-country database (not the filtered view).
3. **NDC charts** — `ndcProgressData` (target vs progress per country), `netZeroTimeline` (count of
   countries per net-zero year), `renewableGapData` sorted by target-minus-current gap.
4. **Portfolio policy risk** — loads the user's portfolio from `localStorage['ra_portfolio_v1']`
   (fallback: first 30 rows of `GLOBAL_COMPANY_MASTER`), maps each holding's country to its policy
   row, and flags **CBAM-exposed** holdings: companies *outside* CBAM countries whose sector
   matches `/energy|material|industrial|cement|steel|alumin/i`.
5. **Engine path** (API) — `assess_jurisdiction_policy` returns NDC ambition, carbon-price gap
   `max(NZE_2030 − current_price, 0)`, stringency and reversal risk; `calculate_carbon_price_gap`
   adds a GDP-risk proxy `gap_2030/50 × 1%` (halved for EMDE); `assess_policy_portfolio_impact`
   computes weighted transition risk with a sector modifier `1 + 0.05 × policy-overlap count`,
   tiering the portfolio (very_high ≥ 0.70 … low < 0.25).

### 7.4 Worked example — Germany, engine ambition score

Germany profile: NDC −65% vs 1990, status *enhanced*, net-zero 2045.

| Step | Computation | Result |
|---|---|---|
| Target score | min(70, 65/55 × 70) = min(70, 82.7) | 70.0 |
| Status bonus | enhanced | +10 |
| Net-zero bonus | 2045 ≤ 2050 | +15 |
| Base-year penalty | max(0, (1990−2010)×0.3) | 0 |
| **Ambition score** | 70 + 10 + 15 | **95.0 → tier "high", 1.5°C-consistent (≥65)** |
| Carbon-price gap | NZE AE 2030 $130 − $45 (frontend) / $65 (EU profile) | $85 / $65 gap |
| Frontend implementation gap | 65 − 52 | **13 pp** |

### 7.5 Companion analytics

- **Carbon Pricing tab** — 16 instruments sorted by price ($130 Sweden/Switzerland → $2 Japan/
  Indonesia); global coverage sums each instrument's `coverage_pct_global`.
- **Climate finance** — pledge league table ($11.6Bn UK, $11.4Bn US, $7.5Bn JP ...).
- **Exports** — CSV/JSON of the full database; cross-navigation to `/sovereign-esg`.

### 7.6 Data provenance & limitations

- Frontend data is **hand-curated, static, real-world-plausible** (prices, NDC targets and law
  names check out against World Bank CPD 2024 / UNFCCC), but has no refresh mechanism and no
  citation per row; `ndc_progress_pct` is an editorial estimate, not a UNFCCC-reported figure.
- The guide's "AmbitionGap = NDC_target − Science_pathway" exists **only in the backend engine**
  (`gap_vs_15c = adjusted_43%_benchmark − target_pct`); the page itself shows the *implementation*
  gap (target − progress). The CAT four-band rating language in the guide maps loosely onto the
  engine's `ambition_tier`, but the engine's scoring weights are proprietary heuristics, not CAT's
  published fair-share/modelled-pathways method.
- `pctOf(db, c => c.ndc_progress_pct >= 40)` labels countries "Paris-aligned" on progress ≥40% —
  a display shorthand with no scientific basis.
- Frontend and engine carbon prices disagree for some jurisdictions (page DE $45 vs engine EU $65)
  because they were curated at different dates.

**Framework alignment:** UNFCCC Paris Agreement Art. 4 (NDC cycle — targets and 5-year updates are
the raw inputs) · IPCC AR6 WGIII (the 43%-below-2010-by-2030 1.5°C benchmark the engine uses) ·
IEA WEO NZE (carbon-price corridor) · NGFS policy scenarios (orderly/disorderly/hot-house price
paths) · World Bank State & Trends of Carbon Pricing (instrument coverage/price data model) ·
EU CBAM Reg. 2023/956 (portfolio exposure screen). Climate Action Tracker, referenced by the
guide, derives its ratings by comparing NDCs and policies against modelled domestic pathways and
fair-share equity ranges — the engine approximates this with a points rubric instead.

## 8 · Model Specification — NDC Ambition & Implementation Gap Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Support sovereign-risk and transition-risk decisions (sovereign bond tilts, country exposure caps)
with a defensible, reproducible country policy score replacing the current points heuristic.
Coverage: the ~198 Paris parties, assessed annually plus event-driven (NDC resubmission, major law).

### 8.2 Conceptual approach

Two-gap architecture per Climate Action Tracker and UNEP Emissions Gap Report practice:
(i) **ambition gap** = country 2030 NDC emissions vs a 1.5°C-consistent modelled domestic pathway;
(ii) **implementation gap** = current-policy projected emissions vs the NDC level. Benchmarks:
Climate Action Tracker country assessments (modelled domestic pathways + fair share) and the
World Bank Carbon Pricing Dashboard for the pricing pillar; policy-stringency mirrors the OECD
Environmental Policy Stringency index construction.

### 8.3 Mathematical specification

```
E_NDC     = E_base × (1 − r_NDC)                        # NDC-implied 2030 emissions, MtCO2e
E_1.5     = E_2010 × (1 − 0.43) × φ_c                   # IPCC AR6 43% cut, φ_c = country effort-share
E_CP      = E_now × (1 + g_CP)^(2030−t_now)             # current-policy projection
AmbitionGap_pp        = max(0, (E_NDC − E_1.5) / E_base × 100)
ImplementationGap_pp  = max(0, (E_CP − E_NDC) / E_base × 100)
CarbonPriceGap        = max(0, P_NZE(track, 2030) − P_eff),  P_eff = Σ_i price_i × coverage_i
PAS = 100 − w₁·min(AmbitionGap_pp,40)/40×100·w₁ − w₂·min(ImplGap_pp,30)/30×100 − w₃·CarbonPriceGap/130×100
      with weights w = (0.45, 0.35, 0.20)
Rating bands (CAT-style): PAS ≥ 80 "1.5°C compatible"; 60–79 "almost sufficient";
                          40–59 "insufficient"; < 40 "critically insufficient"
```

| Parameter | Calibration source |
|---|---|
| `E_base`, `E_2010`, `E_now` | UNFCCC GHG inventories; OWID CO₂ dataset (already in platform `reference_data`) |
| `r_NDC` | UNFCCC NDC Registry (unconditional target) |
| `φ_c` effort share | CAT modelled domestic pathways or IPCC AR6 regional pathways |
| `g_CP` current-policy growth | Climate Action Tracker / PBL Climate Pledge scenarios |
| `P_NZE` corridor | IEA WEO NZE ($130 AE / $90 EMDE, 2030) — already coded in engine |
| price_i, coverage_i | World Bank Carbon Pricing Dashboard (annual CSV, free) |

### 8.4 Data requirements

Country GHG series (OWID — ingested), NDC registry text + machine-readable targets (UNFCCC, free),
carbon pricing instruments (World Bank CPD API), policy inventories (Climate Change Laws of the
World, Grantham — free), IEA NZE corridor (already hardcoded). Platform assets reusable: the
engine's `JURISDICTION_PROFILES`, `G20_CARBON_PRICING`, and `reference_data` OWID tables.

### 8.5 Validation & benchmarking plan

Reconcile PAS rating bands against published CAT ratings for the ~40 CAT-covered countries
(target: ≥80% same-band agreement); backtest implementation gap projections against realised
inventories with 2-year lag; sensitivity: ±10pp on `φ_c` and ±20% on `g_CP` must not move >15% of
countries across bands (stability test per SR 11-7 ongoing-monitoring expectations).

### 8.6 Limitations & model risk

Effort-sharing (`φ_c`) is normative — publish both fair-share and cost-effective variants;
current-policy projections carry high uncertainty for EMDEs; carbon-price effectiveness ignores
non-pricing regulation (mandates, standards) — mitigate with the stringency pillar; conservative
fallback: where projections are unavailable, floor the rating at "insufficient" rather than
imputing.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the tracker engine and heal the failing country route (analytics ladder: rung 2 → 3)

**What.** §7 rates this page unusually clean: a hand-curated 30-country policy
database with **zero PRNG** (real facts — Germany's Climate Change Act, coal
phase-out 2038), a 16-jurisdiction carbon-pricing map, and honest derived gaps
(`gap = ndc_reduction_pct − ndc_progress_pct`). Meanwhile the backend carries a
genuine `climate_policy_tracker_engine` (Paris-benchmark NDC scoring with base-year
adjustment, NZE carbon-price gap with GDP-risk scaling, portfolio impact) behind
POST routes the page doesn't call, plus a Climate Policy Radar wrapper whose
`GET /country/{iso3}` is recorded **failed** in the lineage trace. Evolution A:
fix the failing route (the data-sources wave documented that Climate Policy Radar
has no live API — the `/status` endpoint already reports mode honestly, so the
country route must degrade to the seeded corpus rather than 500); wire the page's
Ambition Gap and Carbon Pricing tabs to `score-ndc` and `carbon-price-gap`; and
put refresh discipline on the curated table (policy facts rot — each row gains an
`as_of` and a review cadence).

**How.** (1) Route fix with a lineage regression fixture. (2) The engine's NDC
scores rendered beside the curated CAT-style ratings — model vs assessment,
labelled. (3) `ref_carbon_prices` refreshed annually from the World Bank dashboard
§5 already cites, replacing hand-edits.

**Prerequisites.** Confirm Radar data licensing for the seeded corpus; curation
ownership assigned. **Acceptance:** `/country/{iso3}` passes in the lineage sweep;
the ambition tab's scores reproduce via direct `score-ndc` POST; every curated row
carries `as_of`.

### 9.2 Evolution B — Policy-desk analyst (LLM tier 2)

**What.** This module has the platform's best grounding for a policy copilot: real
curated facts plus a real scoring engine. The analyst answers "score Indonesia's NDC
against the 1.5°C benchmark and explain the base-year adjustment" (a `score-ndc`
tool call narrated with the engine's documented mechanics), "where is the carbon-
price gap largest relative to NZE 2030 needs?" (`carbon-price-gap` per country),
"what does our portfolio's jurisdiction mix imply?" (`portfolio-impact` +
`assess-jurisdiction`), with factual questions ("when is Germany's coal phase-out?")
answered from the curated table with `as_of` cited.

**How.** Tool schemas over the tracker POSTs and Radar GETs; the validator on every
score, gap, and $ figure; the system prompt separates three knowledge classes —
curated fact, engine computation, and CAT third-party assessment — so answers
attribute correctly; refusal on election/policy prediction.

**Prerequisites.** Evolution A's route fix (a copilot calling a failing endpoint
inherits the 500); curation vintages so stale facts are flagged. **Acceptance:**
every scored answer reproduces via direct POST; factual answers cite table rows with
dates; asked "will the EU raise its 2035 target?", the copilot reports the current
curated status and declines to forecast.