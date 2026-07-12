# Api::Health_Climate
**Module ID:** `api::health_climate` · **Route:** `/api/v1/health-climate` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/health-climate/heat-stress` | `heat_stress_endpoint` | api/v1/routes/health_climate.py |
| POST | `/api/v1/health-climate/air-quality` | `air_quality_endpoint` | api/v1/routes/health_climate.py |
| POST | `/api/v1/health-climate/vector-disease` | `vector_disease_endpoint` | api/v1/routes/health_climate.py |
| POST | `/api/v1/health-climate/food-security-health` | `food_security_health_endpoint` | api/v1/routes/health_climate.py |
| POST | `/api/v1/health-climate/financial-impact` | `financial_impact_endpoint` | api/v1/routes/health_climate.py |
| POST | `/api/v1/health-climate/who-climate-health` | `who_climate_health_endpoint` | api/v1/routes/health_climate.py |
| POST | `/api/v1/health-climate/composite` | `composite_endpoint` | api/v1/routes/health_climate.py |
| GET | `/api/v1/health-climate/ref/who-guidelines` | `get_who_guidelines` | api/v1/routes/health_climate.py |
| GET | `/api/v1/health-climate/ref/lancet-indicators` | `get_lancet_indicators` | api/v1/routes/health_climate.py |
| GET | `/api/v1/health-climate/ref/country-profiles` | `get_country_profiles` | api/v1/routes/health_climate.py |

### 2.3 Engine `health_climate_engine` (services/health_climate_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp` | val, lo, hi |  |
| `_round` | val, digits |  |
| `_country_profile` | country_code |  |
| `assess_heat_stress_risk` | entity_id, country_code, outdoor_worker_pct, sector, wbgt_observed_c |  |
| `assess_air_quality_risk` | entity_id, country_code, sector, annual_production, pm25_observed_ugm3, no2_observed_ugm3 |  |
| `assess_vector_disease_risk` | entity_id, country_code, rcp_scenario, prevention_cost_per_worker_usd, workforce_at_risk |  |
| `model_food_security_health` | entity_id, country_code, supply_chain_exposure, commodity_climate_scores |  |
| `calculate_health_financial_impact` | entity_id, country_code, employee_count, outdoor_pct, sector, daily_wage_usd, healthcare_daily_cost_usd |  |
| `assess_who_climate_health` | entity_id, country_code |  |
| `compute_health_climate_composite` | entity_id, entity_name, country_code, sector, employee_count, annual_production, daily_wage_usd |  |

**Engine `health_climate_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `COUNTRY_HEALTH_PROFILES` | `{'IN': {'heat_mortality_100k': 3.5, 'pm25_ugm3': 58.0, 'who_ccs_score': 72.0, 'health_resilience': 38.0, 'ncchap': True, 'ndc_health': True}, 'BD': {'heat_mortality_100k': 4.2, 'pm25_ugm3': 62.0, 'who_ccs_score': 78.0, 'health_resilience': 30.0, 'ncchap': True, 'ndc_health': True}, 'PK': {'heat_mort` |
| `DEFAULT_COUNTRY_PROFILE` | `{'heat_mortality_100k': 2.0, 'pm25_ugm3': 25.0, 'who_ccs_score': 55.0, 'health_resilience': 50.0, 'ncchap': False, 'ndc_health': False}` |
| `SECTOR_OUTDOOR_WORKER_FRACTION` | `{'agriculture': 0.9, 'construction': 0.75, 'mining': 0.6, 'utilities': 0.35, 'manufacturing': 0.25, 'transport': 0.45, 'oil_gas': 0.4, 'retail': 0.1, 'finance': 0.02, 'technology': 0.05, 'healthcare': 0.15, 'other': 0.2}` |
| `WHO_AQG_PM25` | `5.0` |
| `WHO_AQG_NO2` | `10.0` |
| `WHO_AQG_O3` | `60.0` |
| `EU_AQD_PM25` | `10.0` |
| `EU_AQD_NO2` | `20.0` |
| `WBGT_MODERATE` | `28.0` |
| `WBGT_SEVERE` | `32.0` |
| `WBGT_PRODUCTIVITY_BASE` | `26.0` |
| `VECTOR_DISEASE_CLIMATE_SENSITIVITY` | `{'malaria': {'per_deg_range_pct': 4.5, 'rcp45_2050': 0.25, 'rcp85_2050': 0.45}, 'dengue': {'per_deg_range_pct': 6.0, 'rcp45_2050': 0.6, 'rcp85_2050': 1.2}, 'lyme': {'per_deg_range_pct': 3.0, 'rcp45_2050': 0.2, 'rcp85_2050': 0.35}, 'zika': {'per_deg_range_pct': 4.0, 'rcp45_2050': 0.3, 'rcp85_2050': 0` |
| `FOOD_SECURITY_COUNTRY_SCORES` | `{'IN': 38, 'BD': 30, 'PK': 32, 'NG': 22, 'ET': 18, 'KE': 28, 'CN': 55, 'BR': 60, 'MX': 55, 'ID': 50, 'VN': 52, 'TH': 58, 'US': 85, 'GB': 88, 'DE': 90, 'FR': 88, 'AU': 87, 'JP': 82, 'ZA': 48, 'EG': 35, 'PH': 45}` |
| `NO2_PM25_RATIO_DEFAULT` | `0.3` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `fastapi` *(shared)*, `heat`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/health-climate/ref/country-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'note', 'profiles', 'wbgt_thresholds'], 'n_keys': 4}`

**GET /api/v1/health-climate/ref/lancet-indicators** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'publication', 'indicator_domains'], 'n_keys': 3}`

**GET /api/v1/health-climate/ref/who-guidelines** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'publication_date', 'eu_directive', 'pollutants', 'notes'], 'n_keys': 5}`

**POST /api/v1/health-climate/air-quality** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/health-climate/composite** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/health-climate/financial-impact** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/health-climate/food-security-health** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/health-climate/heat-stress** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['country_code', 'wbgt_max_c', 'heat_stress_risk_score', 'productivity_loss_pct', 'mortality_per_100k', 'rcp45_mortality_increase_pct', 'rcp85_mortality_increase_pct', 'osha_compliant', 'outdoor_worker_fraction', 'adaptation_measures', 'source'], 'n_keys': 11}`

## 5 · Intermediate Transformation Logic

**Engine `health_climate_engine` — extracted transformation lines:**
```python
deg_above_threshold = max(0.0, wbgt_max - WBGT_PRODUCTIVITY_BASE)
productivity_loss = _round(min(50.0, deg_above_threshold * 10 * outdoor_fraction), 1)
rcp45_increase = _round(mortality * 0.30, 2)
rcp85_increase = _round(mortality * 0.60, 2)
wbgt_f = wbgt_max * 9 / 5 + 32
osha_compliant = wbgt_f < 90  # deterministic 90°F WBGT-equiv threshold
mortality_per_100k = _round(pm25 * 0.6, 1)
pm25_excess = max(0.0, pm25 - EU_AQD_PM25)
compliance_cost = _round(pm25_excess * annual_production * 0.005, 0)  # $5/unit/μg excess
health_liability = _round(mortality_per_100k * annual_production * 0.001, 0)
change_pct = _round(data[scenario_key] * 100, 1)
prevention_cost = None  # insufficient_data: no prevention budget/workforce input supplied
decade = (2050 - 2024) / 10
caloric_deficit_risk = _round(2.5 * decade * (1 + (100 - food_score) / 200), 1)
malnutrition_productivity_loss = _round(_clamp(caloric_deficit_risk * 1.5), 1)
outdoor_fraction = outdoor_pct / 100
healthcare_daily_cost = daily_wage * HEALTHCARE_COST_WAGE_MULTIPLE
total_sick_days = heat_sick_days + air_quality_sick_days
climate_attribution_frac = 0.30  # 30% of sick days climate-attributable
healthcare_cost_uplift = None  # insufficient_data: no wage/healthcare cost supplied
productivity_loss_days = _round(total_sick_days * outdoor_fraction * 0.6 * employee_count, 1)
adaptation_cost = _round(employee_count * 200, 0)  # ~$200/employee per year (model constant)
total_impact = None  # insufficient_data: wage-dependent components missing
overall_score = sum(weights[k] * active[k] for k in active) / weight_sum
priority_hazards = sorted(active.items(), key=lambda x: -x[1])[:3]
sdg3_alignment = _round(_clamp(100 - overall_score), 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is grounded in
`backend/services/health_climate_engine.py` (E59) and `backend/api/v1/routes/health_climate.py`.)*

### 7.1 What the domain computes

Seven function-level methods assessing the **health–climate nexus** for a corporate entity, five
of which are routed (`/heat-stress`, `/air-quality`, `/food-security-health`,
`/financial-impact`, `/composite`) plus three reference endpoints (country profiles, Lancet
indicators, WHO guidelines). Headline formulas:

```
Heat:  WBGT = observed, else 26 + heat_mortality×1.5 (country proxy)
       heat_score = (WBGT − 26)/(32 − 26) × 100        (clamped 0–100)
       productivity_loss% = min(50, (WBGT − 26) × 10 × outdoor_fraction)   ("10%/°C above 26°C WBGT")
Air:   respiratory mortality/100k = PM2.5 × 0.6         (WHO GBD concentration-response proxy)
       compliance_cost = (PM2.5 − 10)⁺ × production × 0.005
Vector: per-disease 2050 range change from published RCP4.5/8.5 sensitivities
       composite = (100 − health_resilience)×0.5 + WHO_CCS×0.3
Food:  caloric_deficit% = 2.5 × 2.6 decades × (1 + (100 − food_score)/200)   (IPCC "2-3%/decade")
Fin:   sick days = heat_mortality×outdoor×0.8 + PM2.5/20×(1−outdoor)×0.5
       healthcare uplift = employees × sick_days × 30% climate share × daily cost
       litigation = employees × outdoor × $500 × heat_mortality
Composite: 0.25·heat + 0.25·air + 0.15·vector + 0.15·food + 0.20·financial
           (weights renormalised when the wage-dependent financial score is null)
```

### 7.2 Parameterisation

**Country health profiles** (21 countries + default; fields per WHO Climate & Health Country
Profiles style): heat mortality /100k (BD 4.2, NG 5.1, US 0.7, GB 0.5), PM2.5 annual mean
(NG 68, IN 58 … AU 8.0), WHO climate-change-sensitivity score, health-resilience 0–100, and
NCCHAP / health-in-NDC booleans.

**Thresholds & constants (with in-code provenance):**

| Constant | Value | Provenance note in code |
|---|---|---|
| WHO AQG PM2.5 / NO₂ / O₃ | 5 / 10 / 60 µg/m³ | WHO Air Quality Guidelines 2021 (real values) |
| EU AQD PM2.5 / NO₂ | 10 / 20 µg/m³ | EU AAQD 2024 revision (2024/2881) — real 2030 limits |
| WBGT bands | 26 productivity onset / 28 moderate / 32 stop-work °C | ILO heat-stress convention |
| OSHA test | WBGT-equivalent < 90 °F | 2024 proposed heat rule (high-heat trigger) |
| NO₂:PM2.5 default ratio | 0.30 | "typical urban co-pollutant ratio (WHO GBD 2019)" |
| Healthcare cost multiple | 1.0 × daily wage | "ILO/WHO cost-of-illness convention" |
| Climate share of sick days | 30% | model constant |
| Adaptation cost proxy | $200/employee/yr; litigation $500/worker duty-of-care | model constants |
| Vector sensitivities | dengue +6.0%/°C, RCP8.5-2050 +120%; malaria 4.5%/°C, +45%; lyme/zika/west-nile smaller | "IPCC AR6 Ch7 / Lancet Countdown Indicator 1.3" |
| Sector outdoor fractions | agriculture 0.90, construction 0.75, mining 0.60 … finance 0.02 | platform calibration |
| Food-security scores | DE 90, US 85 … NG 22, ET 18 | GFSI-style, hardcoded |

A deliberate design pattern runs through this engine (added during the anti-fabrication
remediation): **entity-specific monetary results are "honest nulls"** unless the caller supplies
the unit inputs (daily wage, healthcare cost, prevention budget, commodity vulnerability
scores); only model-structure defaults are hardcoded, and each is documented as such.

### 7.3 Calculation walkthrough

The composite endpoint chains all five component methods: sector → outdoor % lookup → heat →
air (production passed through, 0 if absent) → vector → food (supply chain seeded with
[sector, grains, proteins]) → financial (wage-dependent parts nullable). Component scores are
normalised to 0–100 (air = excess over WHO AQG × 30/5), weighted, **renormalised over non-null
components**, and mapped to ratings: ≥ 75 Critical / ≥ 55 High / ≥ 35 Medium / else Low. Top-3
non-null components become `priority_hazards`; SDG-3 alignment = 100 − overall.

### 7.4 Worked example — Indian construction firm, 10,000 employees, no wage supplied

Profile IN: heat_mortality 3.5, PM2.5 58, WHO CCS 72, resilience 38; outdoor = 75%.

| Component | Computation | Score |
|---|---|---|
| WBGT proxy | 26 + 3.5×1.5 = 31.25 °C | heat = (31.25−26)/6×100 = **87.5** |
| Productivity loss | min(50, 5.25×10×0.75) | 39.4% |
| Air | (58−5)/5×30 = 318 → clamp | **100** |
| Vector | (100−38)×0.5 + 72×0.3 = 31+21.6 | **52.6 (Medium)** |
| Food | 100 − 38 | **62** |
| Financial | wage absent → null | excluded |
| **Composite** | (0.25×87.5 + 0.25×100 + 0.15×52.6 + 0.15×62)/(0.80) | **80.1 → Critical** |

Litigation exposure (wage-independent): 10,000 × 0.75 × 500 × 3.5 = **$13.125M**; insurance
uplift = clamp(5 + 3.5×2) = 12.0%; OSHA: 31.25 °C = 88.25 °F < 90 → compliant.

### 7.5 Reference layer

`GET /ref/country-profiles` (the 21-country table), `/ref/lancet-indicators` and
`/ref/who-guidelines` serve the framework metadata the calculators cite (Lancet Countdown
indicator numbers appear in each result's `source` string, e.g. 1.2 food, 1.3 vectors, 4.4
economic losses).

### 7.6 Data provenance & limitations

- No `sr(seed)` PRNG — the engine was explicitly rebuilt around deterministic defaults and
  nullable entity-specific outputs (comments: "documented; NOT entity-specific data",
  "honest null … rather than a fabricated value").
- Country profiles, food-security scores, sector outdoor fractions, and vector sensitivities
  are **hardcoded stylised transcriptions** of WHO/Lancet/GFSI-order-of-magnitude values, not
  live ingests; the WHO AQG and EU AAQD thresholds are the genuine published limits.
- Simplified dose-response: mortality = PM2.5 × 0.6 is a linear proxy (real GBD uses non-linear
  integrated exposure-response); productivity loss 10%/°C WBGT is steeper than the ILO's
  published curves at moderate heat; RCP mortality uplifts (+30%/+60%) are flat multipliers.
- The WBGT proxy from heat mortality conflates exposure with outcome; the composite's air score
  saturates at 100 for any PM2.5 ≥ ~21.7 µg/m³, flattening distinctions among polluted
  geographies.
- Litigation/adaptation dollar constants ($500, $200) are unanchored model constants — flagged
  as such in comments.

### 7.7 Framework alignment

- **WHO Air Quality Guidelines 2021** — the 5 µg/m³ PM2.5 annual guideline (and NO₂ 10, O₃
  peak-season 60) are WHO's actual 2021 values, derived from systematic reviews of long-term
  exposure mortality risk; the EU comparison uses the revised AAQD's 2030 PM2.5 limit of 10.
- **ILO heat-stress framework ("Working on a warmer planet", 2019)** — WBGT-based productivity
  loss with work-rest thresholds; ILO projects ~2.2% of global working hours lost to heat by
  2030 — the module's per-degree linear loss is a corporate-level adaptation of that logic.
- **OSHA proposed heat standard (2024)** — heat-illness prevention programme triggers at
  initial (80 °F) and high (90 °F) heat-index levels; the module encodes the 90 °F high-heat
  trigger as its compliance test.
- **Lancet Countdown 2023** — indicator numbering (1.2, 1.3, 4.4) matches the report's health-
  hazard and economic-loss indicators; vector range-expansion percentages are of the published
  order (Lancet reports dengue transmission potential up strongly under RCP8.5).
- **IPCC AR6 (WG2 Ch. 5 & 7)** — the 2–3%/decade crop-yield-pressure figure and vector-range
  expansion narratives anchor the food and vector modules.
- **WHO Climate & Health Country Profiles / SDG 3, CSRD ESRS S1, GRI 403** — named as the
  disclosure destinations; the composite's `sdg3_alignment` and the ESRS S1/GRI 403
  recommendations connect occupational-health outputs to reporting frameworks.

## 9 · Future Evolution

### 9.1 Evolution A — Location- and scenario-resolved health exposure (analytics ladder: rung 2 → 4)

**What.** The E59 `health_climate_engine` computes seven health-nexus methods with
published concentration-response coefficients: heat productivity loss
(`min(50, (WBGT−26)×10×outdoor_fraction)`, "10%/°C above 26°C"), PM2.5 respiratory
mortality (`PM2.5×0.6`, WHO GBD proxy), vector-disease RCP4.5/8.5 range shifts, and a
composite. Two honest limits: WBGT falls back to a country proxy (`26 + heat_mortality×
1.5`) when no observation is supplied, and several coefficients are literature point
estimates applied flat. Evolution A grounds the drivers in the platform's own climate
data and adds forward scenarios.

**How.** (1) Wire WBGT and PM2.5 from the physical-risk digital twin / NASA-POWER +
Open-Meteo feeds already ingested, replacing the country-proxy fallback with
coordinate-resolved values and a reported `resolution_tier`. (2) Project heat/air
exposure forward under RCP/SSP scenarios (the engine already carries RCP4.5/8.5
sensitivities for vectors — generalise to heat and air) so `/composite` returns a
2030/2040/2050 trajectory, not a point-in-time score. (3) Attach confidence intervals
from the concentration-response literature rather than single coefficients. (4)
Bench-pin heat, air, and composite against worked WHO/Lancet examples.

**Prerequisites.** Coordinate weather/air data wired (feeds exist); RCP/SSP projection
series per location. **Acceptance:** two facilities in different climates produce
different heat/air scores from real WBGT/PM2.5, not the country proxy; `/composite`
returns a multi-horizon trajectory with intervals; bench pins pass.

### 9.2 Evolution B — Workforce health-risk copilot for corporate entities (LLM tier 2)

**What.** A copilot that runs the health suite for an entity and explains the financial
translation — "heat costs you N productivity-days and $X adaptation at ~$200/employee;
here's the driver decomposition" — citing `/financial-impact` and `/composite` outputs,
and answering what-ifs like "if we cut outdoor work to 30%, how does productivity loss
change?" by re-calling with the amended `outdoor_fraction`.

**How.** Five computational POST endpoints plus three reference GETs (WHO guidelines,
Lancet indicators, country profiles) form the tool set; the reference endpoints ground
threshold questions (OSHA 90°F WBGT-equiv, EU AQD PM2.5 limit). The engine's explicit
`insufficient_data` returns (e.g. `healthcare_cost_uplift = None` when no wage input) are
exactly what the copilot must surface honestly rather than filling in — a strong test of
the refusal path.

**Prerequisites.** None hard for tier 1 narration; for tier 2 what-ifs the POST
endpoints (some trace as `skipped` in §4.2 under the harness) must be confirmed callable.
**Acceptance:** every cost, sick-day, and score figure traces to a tool response; when
an input is missing the copilot reports the engine's `insufficient_data`/None rather
than estimating; scenario what-ifs reflect a fresh engine call.