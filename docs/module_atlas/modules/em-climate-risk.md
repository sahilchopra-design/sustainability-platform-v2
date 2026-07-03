# EM Climate Risk
**Module ID:** `em-climate-risk` · **Route:** `/em-climate-risk` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Emerging market climate risk analytics combining physical hazard exposure, transition risk vulnerability, sovereign fiscal capacity, and capital flight risk into a composite EM Climate Risk Index. Covers 80+ emerging and frontier markets. Supports sovereign ESG analysis, EM fixed income risk assessment, and development finance institution due diligence.

> **Business value:** Provides sovereign debt investors, DFIs, and risk managers with a structured, multi-dimensional view of climate risk across emerging markets. The EMCRI enables climate-informed sovereign credit assessment and portfolio construction in markets where standard climate risk data is often incomplete.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `EM_COUNTRIES`, `KpiCard`, `PIE_COLORS`, `Row`, `Section`, `Sel`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `physicalRisk` | `Math.round(seed(ci * 7) * 40 + 40);` |
| `transitionReadiness` | `Math.round(seed(ci * 11) * 35 + 40);` |
| `ndcAmbition` | `Math.round(seed(ci * 13) * 35 + 38);` |
| `greenFinance` | `Math.round(seed(ci * 17) * 30 + 35);` |
| `justTransition` | `Math.round(seed(ci * 19) * 35 + 38);` |
| `composite` | `Math.round((physicalRisk * 0.3 + transitionReadiness * 0.25 + ndcAmbition * 0.2 + greenFinance * 0.15 + justTransition * 0.1));` |
| `ps6Score` | `Math.round(seed(ci * 43) * 35 + 45);` |
| `criticalHabitat` | `Math.round(seed(ci * 47) * 40 + 20);` |
| `offsetRequired` | `seed(ci * 53) > 0.5;` |
| `ps6Applicable` | `seed(ci * 59) > 0.3;` |
| `blendedFinancePotential` | `Math.round(seed(139) * 5 + 8);` |
| `gcfAllocation` | `(Math.round(seed(141) * 30 + 20) / 10).toFixed(1);` |
| `topFacility` | `[...concessionalFacilities].sort((a, b) => b.eligibilityScore - a.eligibilityScore)[0];` |
| `ndcAmbition` | `Math.round(seed(ci * 157) * 35 + 38);` |
| `fossilFuelDep` | `Math.round(seed(ci * 163) * 40 + 20);` |
| `justTransitionRisk` | `seed(ci * 167) > 0.6 ? 'High' : seed(ci * 167) > 0.35 ? 'Medium' : 'Low';` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/em-climate-risk/assess` | `full_assessment` | api/v1/routes/em_climate_risk.py |
| POST | `/api/v1/em-climate-risk/country-risk` | `country_climate_risk` | api/v1/routes/em_climate_risk.py |
| POST | `/api/v1/em-climate-risk/ifc-ps6` | `ifc_ps6_requirements` | api/v1/routes/em_climate_risk.py |
| POST | `/api/v1/em-climate-risk/concessional-finance` | `concessional_finance_eligibility` | api/v1/routes/em_climate_risk.py |
| POST | `/api/v1/em-climate-risk/green-finance-market` | `green_finance_market` | api/v1/routes/em_climate_risk.py |
| POST | `/api/v1/em-climate-risk/ndc-alignment` | `ndc_alignment` | api/v1/routes/em_climate_risk.py |
| POST | `/api/v1/em-climate-risk/portfolio` | `portfolio_assessment` | api/v1/routes/em_climate_risk.py |
| GET | `/api/v1/em-climate-risk/ref/country-profiles` | `ref_country_profiles` | api/v1/routes/em_climate_risk.py |
| GET | `/api/v1/em-climate-risk/ref/concessional-windows` | `ref_concessional_windows` | api/v1/routes/em_climate_risk.py |
| GET | `/api/v1/em-climate-risk/ref/ndc-tiers` | `ref_ndc_tiers` | api/v1/routes/em_climate_risk.py |
| GET | `/api/v1/em-climate-risk/ref/gems-multipliers` | `ref_gems_multipliers` | api/v1/routes/em_climate_risk.py |
| GET | `/api/v1/em-climate-risk/ref/ifc-ps6-thresholds` | `ref_ifc_ps6_thresholds` | api/v1/routes/em_climate_risk.py |

### 2.3 Engine `em_climate_risk_engine` (services/em_climate_risk_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_safe_float` | val, default |  |
| `_clamp` | val, lo, hi |  |
| `_ndc_tier` | score |  |
| `EMClimateRiskEngine.assess_country_climate_risk` | country_code, entity_data | Pull EM_COUNTRY_PROFILES data, compute physical/transition composite, |
| `EMClimateRiskEngine.assess_ifc_ps6_requirements` | entity_data, country_code | Determine PS6 applicability, score compliance, identify critical |
| `EMClimateRiskEngine.assess_concessional_finance_eligibility` | entity_data, country_code | Check eligibility for each of the 8 concessional finance facilities. |
| `EMClimateRiskEngine.assess_green_finance_market` | country_code, pipeline_to_market_ratio | Assess EM green bond market depth, local currency risk, sustainable |
| `EMClimateRiskEngine.compute_ndc_alignment` | entity_data, country_code | Assess NDC ambition score, alignment gap, required policy changes |
| `EMClimateRiskEngine.run_full_assessment` | entity_data | Orchestrate all sub-assessments for a single EM country exposure. |
| `EMClimateRiskEngine.run_portfolio_assessment` | portfolio_data | Portfolio-level EM assessment aggregating multiple country exposures. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `EM_COUNTRIES`, `PIE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Highest-Risk Country | — | EMCRI calculation | Emerging market with the highest composite climate risk index score in the current universe |
| Avg EMCRI (EM Universe) | — | Universe aggregation | Population-weighted average EMCRI across all 84 tracked emerging and frontier markets |
| Portfolio EMCRI (Exposure-Weighted) | — | Portfolio aggregation | Sovereign debt portfolio's exposure-weighted composite EM climate risk index |
| Fossil Fuel Export Dependency > 40% GDP | — | Transition vulnerability screen | Count of EM sovereigns where fossil fuel exports exceed 40% of GDP, flagging high transition vulnerability |
- **ND-GAIN country vulnerability and readiness scores (annual)** → Physical risk dimension score calculation with readiness adjustment → **Physical risk sub-index per country**
- **IMF World Economic Outlook â€” fossil fuel export and fiscal space data** → Transition vulnerability and fiscal capacity dimension calculation → **Transition vulnerability and fiscal capacity sub-indices per country**
- **IMF/World Bank FX reserves and current account data** → Capital flight risk scoring from reserve adequacy ratio and CAD as % GDP → **Capital flight risk sub-index and composite EMCRI per country**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/em-climate-risk/ref/concessional-windows** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'facility_count', 'data'], 'n_keys': 3}`

**GET /api/v1/em-climate-risk/ref/country-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'country_count', 'data_sources', 'data'], 'n_keys': 4}`

**GET /api/v1/em-climate-risk/ref/gems-multipliers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'methodology', 'region_count', 'data'], 'n_keys': 4}`

**GET /api/v1/em-climate-risk/ref/ifc-ps6-thresholds** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'standard', 'tier_count', 'data'], 'n_keys': 4}`

**GET /api/v1/em-climate-risk/ref/ndc-tiers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'tier_count', 'standard', 'data'], 'n_keys': 4}`

## 5 · Intermediate Transformation Logic
**Methodology:** EM Climate Risk Index
**Headline formula:** `EMCRI = 0.35 × PhysicalRisk + 0.30 × TransitionVulnerability + 0.20 × FiscalCapacity⁻¹ + 0.15 × CapitalFlightRisk`
**Standards:** ['Notre Dame-Global Adaptation Initiative (ND-GAIN)', 'World Bank Climate Change Knowledge Portal', 'IMF Fiscal Monitor Climate Chapter', 'NGFS Emerging Market Scenario Guidance']

**Engine `em_climate_risk_engine` — extracted transformation lines:**
```python
gems_climate_adjusted_loss_bn = round(gems_base_loss * (1 + gems_uplift_pct / 100), 3)
offset_area_ha = max(0.0, habitat_ha * offset_ratio)
blended_score = round(_clamp(avg * mult), 1)
alignment_gap_pct = round(alignment_gap / 60 * 100, 1)
weight = exp_m / max(total_exposure_m, 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).