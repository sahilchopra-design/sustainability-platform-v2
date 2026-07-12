# Sovereign Corporate Bridge
**Module ID:** `sovereign-corporate-bridge` · **Route:** `/sovereign-corporate-bridge` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BRIDGE_COUNTRIES`, `Badge`, `CONFLICT_TIER_COLOR`, `DEFAULT_HOLDINGS`, `HORIZONS`, `ISO2_TO_ISO3`, `Kpi`, `SCENARIOS`, `TIER_COLOR`, `TIER_ORDER`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `BRIDGE_COUNTRIES` | 40 | `name` |
| `SCENARIOS` | 6 | `label` |
| `DEFAULT_HOLDINGS` | 11 | `name`, `iso2`, `exposureM` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtM` | `(v) => (v == null \|\| isNaN(v)) ? '—' : `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;` |
| `fmtNum` | `(v, d = 1) => (v == null \|\| isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });` |
| `uniqueIso2` | `[...new Set(validHoldings.map((h) => h.iso2))];` |
| `results` | `await Promise.all(uniqueIso2.map((iso2) =>` |
| `entries` | `await Promise.all(validHoldings.map(async (h) => {` |
| `govtDebtBn` | `(p.gdp_bn_2022 * p.government_debt_pct_gdp) / 100.0;` |
| `ghgTco2e` | `p.ghg_inventory_mtco2e_2022 * 1_000_000;` |
| `totalExposure` | `validHoldings.reduce((s, h) => s + parseFloat(h.exposureM), 0);` |
| `rows` | `validHoldings.map((h) => {` |
| `weight` | `exposure / totalExposure;` |
| `scoredExposure` | `scored.reduce((s, r) => s + r.exposure, 0);` |
| `wAvg` | `scoredExposure > 0 ? scored.reduce((s, r) => s + r.composite * r.exposure, 0) / scoredExposure : null;` |
| `wSpread` | `scoredExposure > 0 ? scored.reduce((s, r) => s + (r.spreadBps \|\| 0) * r.exposure, 0) / scoredExposure : null;` |
| `wNotch` | `scoredExposure > 0 ? scored.reduce((s, r) => s + (r.notch \|\| 0) * r.exposure, 0) / scoredExposure : null;` |
| `tierConc` | `TIER_ORDER.map((tier) => {` |
| `totalAttr` | `rows.reduce((s, r) => s + (r.attr && !r.attr.unsupported ? (r.attr.attributed_emissions_tco2e \|\| 0) : 0), 0);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/climate-policy/countries` | `countries` | api/v1/routes/climate_policy_radar.py |
| GET | `/api/v1/climate-policy/country/{iso3}` | `country` | api/v1/routes/climate_policy_radar.py |
| GET | `/api/v1/climate-policy/status` | `status` | api/v1/routes/climate_policy_radar.py |
| POST | `/api/v1/pcaf-sovereign/assess` | `assess_sovereign` | api/v1/routes/pcaf_sovereign.py |
| POST | `/api/v1/pcaf-sovereign/portfolio` | `assess_portfolio` | api/v1/routes/pcaf_sovereign.py |
| POST | `/api/v1/pcaf-sovereign/attribution` | `attribution_calculation` | api/v1/routes/pcaf_sovereign.py |
| GET | `/api/v1/pcaf-sovereign/ref/country-profiles` | `ref_country_profiles` | api/v1/routes/pcaf_sovereign.py |
| GET | `/api/v1/pcaf-sovereign/ref/dqs-methodology` | `ref_dqs_methodology` | api/v1/routes/pcaf_sovereign.py |
| GET | `/api/v1/pcaf-sovereign/ref/ndc-alignment` | `ref_ndc_alignment` | api/v1/routes/pcaf_sovereign.py |
| GET | `/api/v1/pcaf-sovereign/ref/attribution-formula` | `ref_attribution_formula` | api/v1/routes/pcaf_sovereign.py |
| GET | `/api/v1/pcaf-sovereign/ref/pcaf-part-d` | `ref_pcaf_part_d` | api/v1/routes/pcaf_sovereign.py |
| POST | `/api/v1/sovereign-climate-risk/assess` | `assess_sovereign` | api/v1/routes/sovereign_climate_risk.py |
| POST | `/api/v1/sovereign-climate-risk/portfolio` | `assess_portfolio` | api/v1/routes/sovereign_climate_risk.py |
| GET | `/api/v1/sovereign-climate-risk/ref/profiles` | `ref_profiles` | api/v1/routes/sovereign_climate_risk.py |
| GET | `/api/v1/sovereign-climate-risk/ref/scenarios` | `ref_scenarios` | api/v1/routes/sovereign_climate_risk.py |
| GET | `/api/v1/sovereign-climate-risk/ref/countries` | `ref_countries` | api/v1/routes/sovereign_climate_risk.py |
| GET | `/api/v1/ucdp/status` | `status` | api/v1/routes/ucdp_conflict.py |
| GET | `/api/v1/ucdp/events` | `events` | api/v1/routes/ucdp_conflict.py |
| GET | `/api/v1/ucdp/country-summary` | `country_summary` | api/v1/routes/ucdp_conflict.py |
| GET | `/api/v1/ucdp/coverage` | `coverage` | api/v1/routes/ucdp_conflict.py |

### 2.3 Engine `pcaf_sovereign_engine` (services/pcaf_sovereign_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `PCAFSovereignEngine.assess` | entity_id, entity_name, country_code, outstanding_amount_mn, use_lulucf_adjustment, current_trajectory_gap_pct, dqs_override | Full PCAF Part D sovereign assessment for a single country holding. Deterministic and reproducible. `current_trajectory_gap_pct` is the country's assessed emissions trajectory vs its NDC 2030 target (% deviation, positive = off track) from a real trajectory source (e.g. Climate Action Tracker / NGFS); when it is not supplied the NDC alignment is returned as ``insufficient_data`` rather than being  |
| `PCAFSovereignEngine.assess_portfolio` | entity_id, sovereign_holdings | Portfolio-level PCAF sovereign assessment with exposure-weighted aggregation. |
| `PCAFSovereignEngine.calculate_attribution` | outstanding_mn, government_debt_bn, ghg_inventory_tco2e | PCAF Part D attribution calculation (isolated). |
| `PCAFSovereignEngine._determine_dqs` | annex_status, dqs_override | PCAF Part D Data Quality Score — deterministic from the data source used. The engine sources every emissions figure from UNFCCC national inventories. Per PCAF Part D DQS, that maps to the country's reporting obligation: * Annex I parties (annex1/annex2) submit *annual* national GHG inventories → DQS 1. * Non-Annex I parties report via *biennial* update reports (BUR) → DQS 2. A caller who knows the |
| `PCAFSovereignEngine._assess_ndc_alignment` | ndc_target, current_trajectory_gap_pct | Classify NDC alignment from a *supplied* trajectory gap — never fabricated. `current_trajectory_gap_pct` is the country's assessed emissions trajectory vs its NDC 2030 target (% deviation; positive = off track) from a real trajectory source. Returns: * ("no_target", None) — country has no quantified NDC 2030 target; * ("insufficient_data", None) — target exists but no trajectory model was supplied |
| `PCAFSovereignEngine.ref_country_profiles` |  |  |
| `PCAFSovereignEngine.ref_dqs_methodology` |  |  |
| `PCAFSovereignEngine.ref_ndc_alignment` |  |  |
| `PCAFSovereignEngine.ref_attribution_formula` |  |  |
| `PCAFSovereignEngine.ref_pcaf_part_d` |  |  |
| `get_engine` |  |  |

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
**Provenance classes:** `frontend-seed`

**Database tables:** `Kursk`, `Nov`, `Rafah`, `Somalia`, `UCDP`, `__future__` *(shared)*, `datetime` *(shared)*, `fastapi` *(shared)*, `public` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `those` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `BRIDGE_COUNTRIES`, `DEFAULT_HOLDINGS`, `HORIZONS`, `SCENARIOS`, `TIER_ORDER`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 5 · Intermediate Transformation Logic

**Engine `pcaf_sovereign_engine` — extracted transformation lines:**
```python
ghg_tco2e = ghg_mtco2e * 1_000_000.0
ghg_incl_lulucf = (ghg_mtco2e + lulucf_net) * 1_000_000.0
att_factor = (outstanding_amount_mn / 1000.0) / govt_debt_bn
attributed_with_lulucf = round(att_factor * ghg_incl_lulucf, 2)
wa_dqs = sum(r.dqs_score * r.outstanding_amount_mn for r in results) / total_exposure
wa_carbon_intensity = sum(r.portfolio_carbon_intensity_tco2e_per_gdp_mn * r.outstanding_amount_mn for r in results) / total_exposure
outstanding_bn = outstanding_mn / 1000.0
attribution_factor = outstanding_bn / government_debt_bn
attributed_tco2e = attribution_factor * ghg_inventory_tco2e
```

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
**Blast radius:** changes here can affect **12** other module(s).
**Shared engines (edits propagate!):** `sovereign_climate_risk_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `sovereign-climate-risk` | engine:sovereign_climate_risk_engine |
| `maturity-wall-monitor` | table:public |
| `vcm-cross-registry-tracker` | table:public |
| `vcm-registry-analytics` | table:public |
| `just-transition-finance-hub` | table:public |
| `just-transition-adaptation` | table:public |
| `just-transition-intelligence` | table:public |
| `slb-structurer` | table:public |
| `just-transition` | table:public |
| `just-transition-finance` | table:public |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

The page joins a corporate holdings portfolio to sovereign-of-domicile climate risk. For each
unique country of domicile among the user's holdings it makes one live call to the **Sovereign
Climate Risk Engine** (`POST /api/v1/sovereign-climate-risk/assess`), then applies exposure
weights locally to build a portfolio view (weighted composite score, weighted spread delta,
weighted notch adjustment, tier concentration). A second, independent panel applies the **PCAF
Part D sovereign attribution formula** (`GET /ref/country-profiles` then `POST /attribution` per
holding) using real IMF government-debt and UNFCCC GHG-inventory figures pulled from the engine's
own reference data — explicitly labelled on the page as a "sovereign-linkage lens," not the
holding's own PCAF-compliant financed emissions (which live in Part A, covered by the Climate
Underwriting Workbench and other modules).

### 7.2 Sovereign Climate Risk Engine (`sovereign_climate_risk_engine.py`)

60 countries carry hand-authored baseline scores (0–10 scale, higher = worse/less-ready):
`physical_risk`, `transition_readiness`, `fiscal_resilience`, `ndc_ambition`, plus `nd_gain`
(0–100), `debt_to_gdp_pct`, and an S&P-style baseline credit rating. Five NGFS-styled scenarios
(`net_zero_2050`, `below_2c`, `delayed_transition`, `current_policies`, `nationally_determined`)
each carry a `physical_risk_multiplier` and `transition_pressure` per horizon (2030/2050).

```python
physical_score   = min(100, (physical_risk/10) * 100 * physical_risk_multiplier[horizon])
transition_score = min(100, ((10 - transition_readiness)/10) * 100 * transition_pressure[horizon])
debt_factor      = min(2.0, debt_to_gdp_pct / 100.0)
fiscal_score     = min(100, ((10 - fiscal_resilience)/10) * 100 * (0.7 + 0.3*debt_factor))
adaptation_score = max(0, 100 - nd_gain)

composite = physical_score*0.30 + transition_score*0.25 + fiscal_score*0.25 + adaptation_score*0.20
```

Rating-notch overlay is a step function of the composite score (−3 notches at ≥70, −2 at ≥55,
−1 at ≥40, 0 below 40), applied on an integer S&P notch scale (`RATING_NOTCH_MAP`, AAA=22 down to
D=1) and floored at notch 1. Climate spread delta is a simple linear function above a 30-point
threshold, amplified 1.3× for disorderly/hot-house scenarios at the 2050 horizon:

```python
spread_delta = (composite - 30) * 2.0 + 5   if composite > 30 else 0
if scenario in ("delayed_transition", "current_policies") and horizon == "2050":
    spread_delta *= 1.3
```

### 7.3 PCAF Part D sovereign attribution (`pcaf_sovereign_engine.py`)

A separate 40-country profile table (`SOVEREIGN_COUNTRY_PROFILES`) carries **real external
figures** per the module's own citations: `gdp_bn_2022` and `government_debt_pct_gdp` (World Bank
Open Data), `ghg_inventory_mtco2e_2022` (UNFCCC national GHG inventories, 2022 reporting year),
`annex_status` (Annex I vs non-Annex I, driving the DQS default), and `credit_rating_sp`. The
page derives the two attribution inputs from these fields (lines 160-161 of the page):

```js
govtDebtBn = gdp_bn_2022 * government_debt_pct_gdp / 100.0
ghgTco2e   = ghg_inventory_mtco2e_2022 * 1_000_000
```

and calls `POST /api/v1/pcaf-sovereign/attribution`, which implements the PCAF Part D §3.2
formula verbatim (`calculate_attribution`, lines 901-934):

```python
outstanding_bn      = outstanding_mn / 1000.0
attribution_factor  = outstanding_bn / government_debt_bn
attributed_tco2e    = attribution_factor * ghg_inventory_tco2e
```

i.e. **attributed emissions = (bond/loan outstanding ÷ total government debt) × national GHG
inventory** — a GDP/debt-share attribution, structurally identical to PCAF's EVIC-share
attribution for corporates but using government debt as the denominator instead of enterprise
value.

### 7.4 Worked example — traced against the live engines

Using the page's `DEFAULT_HOLDINGS[0]` (Apple Inc., domiciled `US`, $420M exposure) with the
page's default `scenario='current_policies'`, `horizon='2030'`, I ran the actual engine functions
directly (`SovereignClimateRiskEngine.assess_sovereign` and
`PCAFSovereignEngine.calculate_attribution`) to confirm the arithmetic:

**Sovereign climate risk (US, current_policies, 2030):**

US profile: `physical_risk=4.5`, `transition_readiness=6.0`, `fiscal_resilience=7.5`,
`nd_gain=73.0`, `debt_to_gdp_pct=123.0`, baseline rating `AA+` (notch 21). Scenario multipliers
for `current_policies`/2030: `physical_risk_multiplier=1.1`, `transition_pressure=0.5`.

| Step | Computation | Result |
|---|---|---|
| Physical score | (4.5/10)×100×1.1 | 49.5 |
| Transition score | ((10−6.0)/10)×100×0.5 | 20.0 |
| Debt factor | min(2.0, 123/100) | 1.23 |
| Fiscal score | ((10−7.5)/10)×100×(0.7+0.3×1.23) | 26.7 |
| Adaptation score | 100 − 73.0 | 27.0 |
| **Composite** | 49.5×.30 + 20.0×.25 + 26.7×.25 + 27.0×.20 | **31.9** |
| Notch adjustment | composite 31.9 ∈ [25,40) | **0** (rating stays AA+) |
| Spread delta | (31.9−30)×2.0+5, no 2050 amplifier | **+8.8 bps** |

This matches the direct engine call exactly: `composite_climate_risk_score=31.9`,
`climate_adjusted_rating='AA+'`, `notch_adjustment=0`, `climate_spread_delta_bps=8.8`.

**PCAF Part D attribution (US, $420M exposure):**

US PCAF profile: `gdp_bn_2022=25,464.0`, `government_debt_pct_gdp=122.5`,
`ghg_inventory_mtco2e_2022=5,801.0`.

| Step | Computation | Result |
|---|---|---|
| Government debt | $25,464bn × 122.5% | $31,193.4bn |
| GHG inventory | 5,801.0 MtCO2e × 1e6 | 5,801,000,000 tCO2e |
| Outstanding (bn) | $420M / 1000 | $0.42bn |
| Attribution factor | 0.42 ÷ 31,193.4 | 1.346×10⁻⁵ |
| **Attributed emissions** | 1.346×10⁻⁵ × 5,801,000,000 | **78,106.91 tCO2e** |

Confirmed by direct call to `calculate_attribution(outstanding_mn=420,
government_debt_bn=31193.4, ghg_inventory_tco2e=5.801e9)` →
`attributed_emissions_tco2e: 78106.91`. Note this is a **much smaller figure per $M of exposure**
(≈186 tCO2e/$M for a G7 sovereign with a huge debt stock) than a typical corporate financed-
emissions intensity — an artefact of dividing by the entire national debt stock rather than one
issuer's balance sheet, which the page's disclaimer text explicitly warns readers not to conflate
with corporate PCAF Part A results.

### 7.5 Portfolio aggregation (local, derived from live responses)

`bridge` (lines 176-215) computes exposure-weighted aggregates purely from the ten live
`/assess` responses: weighted composite score (`Σ composite×exposure / Σexposure`), weighted
spread delta, weighted notch adjustment, and a 4-tier concentration table
(`low<25, moderate<45, high<65, very_high≥65` on the 0–100 composite scale — note this threshold
set differs from the *engine's own* `assess_portfolio` tiering, which is duplicated client-side
rather than fetched from `/portfolio`). `attribution` (lines 217-222) sums attributed tCO2e
across holdings for a portfolio-level PCAF Part D total and an intensity per $M of total exposure.

### 7.6 Data provenance & limitations

- Both reference tables are hand-authored but explicitly attributed to named sources: the
  Sovereign Climate Risk Engine cites ND-GAIN, INFORM, World Bank CCKP, IMF and NGFS; the PCAF
  Sovereign Engine cites UNFCCC national inventories, World Bank Open Data, and the NDC Database.
  They are two **separate** hand-authored tables (different country coverage — 60 vs 40 — and
  slightly different debt-to-GDP figures, e.g. 123.0% vs 122.5% for the US), not a shared schema.
- `DEFAULT_HOLDINGS` (10 corporate names/exposures) are explicitly labelled "hand-authored
  illustrative holdings, not live positions" and are fully editable.
- The PCAF Part D panel is a genuine live calculation on real IMF/UNFCCC-derived inputs, but its
  interpretation is narrow: it measures what share of a *sovereign's* national emissions a bond/
  loan of that size "would" represent if it were financing the sovereign directly — a proxy for
  sovereign-linkage exposure, explicitly not the corporate holding's actual financed emissions.
  This distinction is documented in the page copy itself, which is a good practice worth noting.
- The portfolio tier thresholds are re-implemented client-side (`tierOf` function) rather than
  calling the engine's own `assess_portfolio` endpoint, so a maintenance drift risk exists if the
  engine's tiering logic changes without updating the frontend copy.

**Framework alignment:** NGFS Phase IV scenario set (physical/transition multipliers) · ND-GAIN /
INFORM / IPCC AR6 (sovereign climate risk) · PCAF Global GHG Accounting and Reporting Standard
Part D: Sovereign Bonds and Loans (2023) · World Bank Open Data / UNFCCC national GHG inventories
(2022 reporting year).

## 8 · Model Specification

**Status: implemented.** Both composed engines (`sovereign_climate_risk_engine.py`,
`pcaf_sovereign_engine.py`) are complete, deterministic Python services with live FastAPI routes;
the bridging/aggregation logic is genuinely computed in the React page from their live responses.

**8.1 Purpose & scope.** Answer, for a corporate credit or bond portfolio, "how exposed is this
book to sovereign-of-domicile climate risk, and what would a PCAF-style sovereign attribution
lens show for the same exposures?" Intended as a cross-cutting risk-committee view rather than a
regulatory disclosure calculation (the disclosure-grade PCAF Part A calculation lives elsewhere).

**8.2 Conceptual approach.** Two independently maintained hand-authored country reference tables
feed two purpose-built formulas: a weighted multi-factor sovereign risk score (physical/
transition/fiscal/adaptation) with a rating-notch and spread overlay, and a debt-share emissions
attribution formula lifted directly from the PCAF Part D standard. The page's only original logic
is the exposure-weighted join across the two engines' outputs — no new risk model is introduced.

**8.3 Mathematical specification.**
```
Sovereign composite (0-100, higher = riskier):
  composite = 0.30·physical + 0.25·transition + 0.25·fiscal + 0.20·adaptation

Rating notch adjustment (step function of composite):
  Δnotch = -3 (composite≥70), -2 (≥55), -1 (≥40), 0 (<40)

Spread delta (bps):
  Δspread = max(0, (composite-30)) * 2.0 + 5      [×1.3 if disorderly/hot-house @2050]

PCAF Part D attribution:
  AF = (outstanding_bond_or_loan / 1000) / government_debt_bn
  attributed_tCO2e = AF × sovereign_GHG_inventory_tCO2e
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Physical/transition/fiscal/adaptation weights | 30/25/25/20% | Hand-set, no external calibration cited |
| NGFS scenario multipliers | phys./transition | NGFS-inspired, hand-authored per scenario × horizon |
| Rating notch thresholds | 40/55/70 composite | Hand-set step function |
| Spread-per-composite-point | 2.0 bps/pt | Hand-set ("empirical-style mapping") |
| Government debt, GDP | World Bank Open Data 2022 | Real, cited external source |
| GHG inventory | UNFCCC national inventories 2022 | Real, cited external source |

**8.4 Data requirements.** Per holding: country of domicile and USD exposure (user-entered).
Per country: physical/transition/fiscal/adaptation baseline scores and credit rating (from the
engine's internal table — not user-supplied), plus GDP, government debt %, and GHG inventory
(from the PCAF engine's internal table). No live market-data or macro-data feed is wired in;
both tables are point-in-time snapshots (2022 reporting year).

**8.5 Validation & benchmarking.** No backtesting harness exists for either the composite-score
weights or the spread-delta mapping — both are explicitly described in code comments as
"empirical-style" / hand-calibrated rather than regression-fitted. The PCAF attribution formula
itself is the audited PCAF Part D standard, so its correctness is a direct code-review question
(confirmed above by independent hand/engine cross-check), not a statistical-validation question.

**8.6 Limitations & model risk.** (1) The sovereign composite's 30/25/25/20 weighting and the
spread-per-point constant are not empirically calibrated to observed sovereign CDS or bond-spread
data — they should be treated as illustrative, not investment-grade. (2) The two country tables
(60-country sovereign-risk vs 40-country PCAF) use different debt-to-GDP figures for the same
country and were evidently built independently — a production deployment should reconcile them to
a single source of truth. (3) PCAF Part D attribution via total government debt produces very
small per-holding tCO2e figures for large-debt-stock economies (US, Japan) — this is a structural
property of the *standard itself*, not a bug, but is easy to misread without the page's own
"linkage lens, not Part A" disclaimer. (4) 2022-vintage reference data will drift as GDP/debt/GHG
inventories update annually; no refresh pipeline is wired to either table.

## 9 · Future Evolution

### 9.1 Evolution A — Unify the two hand-authored country tables and live-source the inputs (analytics ladder: rung 2 → 3)

**What.** This is a genuinely well-built tier-A module: it joins a corporate portfolio to sovereign-of-domicile climate risk via a live call to `sovereign_climate_risk_engine` (`POST /assess`) and applies the real PCAF Part D sovereign attribution formula (`attribution_factor = outstanding_bn / govt_debt_bn × ghg_inventory_tco2e`) using real IMF debt and UNFCCC GHG-inventory figures — and it honestly labels the PCAF panel a "sovereign-linkage lens," not the holding's actual financed emissions. Blast radius is 12, so it's foundational. Its §7.6 limitations are specific: the two composed engines carry **separate hand-authored country tables** (60 vs 40 countries, disagreeing debt/GDP — 123.0% vs 122.5% for the US), and the frontend re-implements tier thresholds (`tierOf`) client-side rather than calling `assess_portfolio`, creating drift risk.

**How.** (1) Merge `SOVEREIGN_PROFILES` (climate engine) and the PCAF `country-profiles` into one canonical sovereign reference table so debt/GDP and coverage agree — the single highest-value fix given both engines cite the same IMF/World Bank sources. (2) Live-source that unified table from ND-GAIN, IMF WEO, and UNFCCC national inventories (all free) with dated vintages, replacing hand-typed statics. (3) Call the engine's `assess_portfolio` for tiering instead of the client-side `tierOf`, removing the drift risk. (4) Bench-pin the PCAF attribution against a worked example.

**Prerequisites.** Coordinating a schema merge across two engines (blast radius 12 — needs the shared-engine regression check); ND-GAIN/IMF/UNFCCC ingestion. **Acceptance:** both panels read one country table with identical debt/GDP per country; portfolio tiers come from `assess_portfolio`; the PCAF attribution reproduces a hand-checked case.

### 9.2 Evolution B — Sovereign-linkage desk orchestrator (LLM tier 3)

**What.** With blast radius 12 and two composed engines, this module is a natural cross-module orchestration node. Evolution B is a desk-level assistant: "for this corporate portfolio, profile the sovereign climate risk of each domicile, compute PCAF Part D sovereign-linkage emissions, and flag concentration in high-transition-risk jurisdictions" — routing across the sovereign-climate-risk engine, the PCAF sovereign engine, and the climate-policy-radar country endpoints, synthesising a memo.

**How.** Tier-3 pattern: the orchestrator sequences tool calls (`POST /pcaf-sovereign/portfolio` → `POST /sovereign-climate-risk/portfolio` → `GET /climate-policy/country/{iso3}`), each returning real engine output, and composes the result into a report-studio artifact. The PCAF panel's crucial framing — sovereign-linkage proxy, not corporate financed emissions — is asserted by the orchestrator in every memo, preserving the page's own good disclosure practice. Provenance UX shows every engine call and the IMF/UNFCCC source vintages.

**Prerequisites (hard).** Evolution A's unified country table — an orchestrator drawing debt/GDP that differs between the two engines for the same country would produce internally inconsistent memos. **Acceptance:** every figure in a synthesised memo traces to a specific engine call; the sovereign-linkage caveat appears wherever PCAF Part D numbers do; a domicile absent from the unified table is flagged, not silently dropped.