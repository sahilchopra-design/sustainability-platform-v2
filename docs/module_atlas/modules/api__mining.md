# Api::Mining
**Module ID:** `api::mining` · **Route:** `/api/v1/mining` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/mining/calculate` | `calculate_mining` | api/v1/routes/mining.py |
| GET | `/api/v1/mining/reference-data` | `reference_data` | api/v1/routes/mining.py |
| GET | `/api/v1/mining/assessments` | `list_assessments` | api/v1/routes/mining.py |
| GET | `/api/v1/mining/assessments/{assessment_id}` | `get_assessment` | api/v1/routes/mining.py |

### 2.3 Engine `mining_risk_calculator` (services/mining_risk_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `calculate_mining_risk` | inp, scenario, horizon_year |  |
| `get_reference_data` |  |  |

**Engine `mining_risk_calculator` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `_GISTM_CONSEQUENCE` | `{'EXTREME': {'min_safety_factor': 1.5, 'review_frequency_yr': 1, 'failure_prob_annual': 0.005}, 'VERY_HIGH': {'min_safety_factor': 1.4, 'review_frequency_yr': 2, 'failure_prob_annual': 0.003}, 'HIGH': {'min_safety_factor': 1.3, 'review_frequency_yr': 3, 'failure_prob_annual': 0.001}, 'LOW': {'min_sa` |
| `_GISTM_COMPLIANCE_FACTOR` | `{'non_compliant': 2.5, 'developing': 1.5, 'advanced': 1.0, 'leading': 0.5}` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`

**Database tables:** `__future__` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `mining_entities`, `mining_risk_assessments`, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/mining/assessments** — status `passed`, provenance ['db-empty'], source tables: `mining_entities`, `mining_risk_assessments`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /api/v1/mining/assessments/{assessment_id}** — status `failed`, provenance ['db-empty'], source tables: `mining_entities`, `mining_risk_assessments`
Output: `None`

**GET /api/v1/mining/reference-data** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['critical_minerals_hhi', 'transition_demand_sensitivity', 'water_intensity_benchmarks', 'carbon_price_by_scenario', 'gistm_consequence_classes', 'sources'], 'n_keys': 6}`

**POST /api/v1/mining/calculate** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `mining_risk_calculator` — extracted transformation lines:**
```python
closest_yr = min(c_prices.keys(), key=lambda y: abs(y - horizon_year))
scope12 = inp.scope1_tco2e + inp.scope2_tco2e
carbon_exposure = scope12 * carbon_price
tail_risk = failure_prob * 1000  # scale: 0.01 failure_prob → 10 score
ratio = actual_ml_kt / benchmark_ml_kt if benchmark_ml_kt > 0 else 1.0
water_risk = (inp.water_stress_index / 5.0) * 50 + (ratio - 1.0) * 10
prov_coverage = (inp.closure_provision_eur / closure_cost * 100.0) if closure_cost > 0 else 0.0
funding_gap   = max(0.0, closure_cost - inp.closure_provision_eur)
social_risk = 100.0 - inp.community_consent_score
social_risk = min(100.0, social_risk + 30.0)
social_risk = min(100.0, social_risk + 15.0)
social_risk = min(100.0, social_risk + 10.0)
geo_risk = hhi * 100.0  # simplified proxy
ev_pct = max(0.0, trans_demand) * 100.0
stranded_value = inp.annual_revenue_eur * abs(trans_demand) * inp.mine_reserve_life_years * 0.15
stranded_value = inp.annual_revenue_eur * abs(trans_demand) * inp.mine_reserve_life_years * 0.10
stranded_value = inp.annual_revenue_eur * inp.mine_reserve_life_years * 0.20
rev_at_risk_pct = min(80.0, overall_risk * 0.6 + (carbon_exposure / inp.annual_revenue_eur * 100 if inp.annual_revenue_eur else 0) * 0.4)
adapt_capex = closure_cost * 0.05 + inp.annual_production_kt * 500
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — the engine header comment is the methodology statement; nothing to reconcile.)*

### 7.1 What the module computes

`backend/services/mining_risk_calculator.py` (`calculate_mining_risk(inp, scenario, horizon_year)`) is a single-function **mining & extractives climate-risk calculator** returning seven risk blocks for one mining entity, persisted/retrieved via `api/v1/routes/mining.py` (`POST /calculate`, `GET /assessments`, `GET /assessments/{id}`, `GET /reference-data`):

1. **Tailings risk** — GISTM consequence class → annual failure probability × compliance factor × facility count.
2. **Water risk** — intensity vs ICMM-style benchmark + WRI Aqueduct stress + acid-mine-drainage add-on.
3. **Closure provisioning** — estimated closure cost, provision coverage %, funding gap.
4. **Social / FPIC risk** — consent score inverted + FPIC/modern-slavery penalties.
5. **Critical-minerals supply security** — HHI concentration proxy → geopolitical risk.
6. **Transition demand / stranding** — clean-energy demand exposure and stranded value.
7. **Carbon-cost exposure** — Scope 1+2 × NGFS-scenario carbon price.

These roll up into `overall_risk_score` (0–100), `revenue_at_risk_pct` and `adaptation_capex_eur`.

### 7.2 Parameterisation (reference tables with in-code source attributions)

**Carbon prices** (€/tCO₂e, "NGFS Phase 4 scenarios (IIASA REMIND-MAgPIE)"): 1.5C {2030: 100, 2040: 200, 2050: 350} · 2C {70, 120, 200} · 3C {30, 50, 75} · BAU {15, 20, 25}. Nearest horizon year is used.

**GISTM consequence classes** ("GISTM 2020, Table 1"): EXTREME (min FoS 1.50, annual review, p_fail 0.005) · VERY_HIGH (1.40, 2y, 0.003) · HIGH (1.30, 3y, 0.001) · LOW (1.20, 5y, 0.0003). Compliance factors: non_compliant ×2.5, developing ×1.5, advanced ×1.0, leading ×0.5. *(The real GISTM Table 1 classifies consequence by population/environmental/economic impact and does not publish failure probabilities or these safety factors — the numeric columns are platform calibrations attached to the GISTM class labels.)*

**Critical-minerals HHI** ("IEA Critical Minerals Market Review 2023" proxies, 0–1): rare_earth 0.85, gallium 0.80, tungsten 0.75, cobalt 0.72 (DRC), graphite 0.70 (China), lithium 0.52 … copper 0.15, iron_ore 0.12, coal 0.08. **Transition demand exposure** (share of demand from clean transition by 2030, "IEA NZE"): lithium 0.90, graphite 0.85, cobalt 0.75, nickel 0.60 … **coal −0.80** (negative = demand destruction). **Water intensity benchmarks** (ML/kt ore, "ICMM Water Stewardship Framework 2014 / industry benchmarks"): uranium 1.50, lithium 1.20, gold 0.80, cobalt 0.60 … coal 0.12; unknown commodity 0.35.

**Closure-cost factors** (€/kt annual production when no cost supplied): open_pit 8,000 · underground 12,000 · in_situ_leach 5,000 · placer 3,000.

### 7.3 Calculation walkthrough

```
failure_prob = p_class × compliance_factor × max(1, facility_count), capped 0.10
tail_risk    = failure_prob × 1000, ×2.0 if EXTREME / ×1.5 if VERY_HIGH, capped 100
water_risk   = (stress/5)×50 + (intensity_ratio − 1)×10 [+20 if AMD high/critical], clamp 0–100
social_risk  = 100 − consent_score, +30 if FPIC not_obtained / +15 if not_assessed
               or partial, +10 if modern-slavery high, capped 100
geo_risk     = HHI × 100
stranding    = critical if trans_demand < −0.5 (or coal under 1.5C/2C); high if < 0; else low
stranded_val = revenue × |trans_demand| × reserve_life × 0.15 (critical) / 0.10 (high);
               coal-scenario branch: revenue × reserve_life × 0.20
overall      = 0.25·tail + 0.20·water + 0.20·social + 0.15·geo
               + 0.20·(100 critical / 50 high / 0 low stranding)
rev_at_risk  = min(80, 0.6·overall + 0.4·(carbon_exposure/revenue×100))
adapt_capex  = 0.05·closure_cost + 500·production_kt
```

Water intensity ratio bands: < 0.8 below · ≤ 1.2 at · ≤ 2.0 above · > 2.0 significantly_above (with warning). Provision coverage < 50% and non-compliant EXTREME/VERY_HIGH tailings also emit warnings. When `water_use_ml_yr` is absent, the benchmark itself is used (ratio = 1 — i.e. neutral assumption, not flagged as missing data).

### 7.4 Worked example — coal miner, 2C scenario, 2050 horizon

Input: coal, open_pit, 10,000 kt/yr, revenue €800M, Scope 1+2 = 1.2 MtCO₂e, 2 tailings facilities HIGH class / developing compliance, water stress 3.5 (no water use supplied), consent 60, FPIC partially_obtained, reserve life 15y, provisions €30M (no closure cost supplied).

| Block | Computation | Result |
|---|---|---|
| Carbon | 1,200,000 × €200 (2C@2050) | **€240M** exposure |
| Tailings | 0.001 × 1.5 × 2 = 0.003 → ×1000 | p = 0.003, score **3.0** |
| Water | (3.5/5)×50 + (1−1)×10 | **35.0** (intensity "at", benchmark 0.12 assumed) |
| Closure | 10,000 × 8,000 = €80M; coverage 30/80 | 37.5% → gap **€50M** + warning |
| Social | 100 − 60 + 15 (FPIC partial) | **55.0** |
| Geo | HHI 0.08 × 100 | **8.0** |
| Stranding | coal under 2C branch | **critical**; stranded = 800M × 15 × 0.20 = **€2.4bn** + NZE warning |
| Overall | 0.25·3 + 0.20·35 + 0.20·55 + 0.15·8 + 0.20·100 | **39.95 ≈ 40.0** |
| Revenue at risk | min(80, 0.6·40 + 0.4·(240/800×100)) = 24 + 12 | **36.0%** |
| Adaptation capex | 0.05·80M + 500·10,000 | **€9.0M** |

### 7.5 Data provenance & limitations

- **No PRNG** — fully deterministic; but several inputs default silently (water intensity → benchmark, closure cost → per-kt factor), so unsupplied data yields sector-typical rather than flagged-missing results (unlike the platform's newer insufficient-data engines).
- Source attributions are genuine framework names (GISTM 2020, WRI Aqueduct 4.0, IEA CMR 2023, NGFS Phase 4, ICMM), but the numeric tables (failure probabilities, HHIs, demand shares, benchmarks, €/kt closure factors) are stylised platform encodings, not verbatim published data; NGFS carbon prices are of the right magnitude for REMIND pathways but rounded.
- Stranded value is a heuristic (revenue × reserve-life × 10–20% scalar), not a DCF of lost margins; failure probability treats facilities as additive and independent, capped arbitrarily at 10%/yr.
- Geopolitical risk = HHI×100 conflates supply concentration with the miner's own risk (a producer *benefits* from concentration it controls); the engine's own comment calls it a "simplified proxy".
- The route layer persists assessments (retrievable via `GET /assessments`), giving audit history.

### 7.6 Framework alignment

- **GISTM (2020):** the Global Industry Standard on Tailings Management classifies facilities into consequence classes (Low → Extreme) driving governance, review frequency and engineering requirements; the module reuses the class ladder and adds quantified failure probabilities and a compliance-maturity multiplier as its risk overlay.
- **WRI Aqueduct 4.0:** the 0–5 baseline water-stress index is consumed directly as `water_stress_index` and linearly weighted into water risk.
- **IEA Critical Minerals Market Review 2023 / NZE:** supply-concentration (HHI-style) and clean-energy demand-share concepts; the coal −0.80 demand-destruction entry and the "no new coal mines" warning reflect IEA NZE messaging.
- **NGFS Phase 4 (REMIND-MAgPIE):** scenario carbon-price trajectories by 2030/2040/2050 for the carbon-cost block.
- **UN Global Compact / FPIC:** Free, Prior and Informed Consent status as a stepped social-risk penalty — consistent with FPIC's role in IFC PS7 and ICMM position statements.
- **GHG Protocol (extractives):** Scope 1+2 boundary for the carbon-cost exposure; Scope 3 (use-phase, dominant for coal) is out of scope here.

## 9 · Future Evolution

### 9.1 Evolution A — Ground the simplified proxies and persist assessments (analytics ladder: rung 2 → 4)

**What.** `calculate_mining_risk` returns seven risk blocks for a mining entity — tailings
(GISTM class → failure probability), water (intensity vs benchmark + WRI Aqueduct),
closure provisioning, social/FPIC, critical-minerals supply (`geo_risk = hhi × 100 #
simplified proxy`), transition-demand stranding, and carbon-cost exposure (Scope 1+2 ×
NGFS carbon price). It is scenario-aware (NGFS scenario + horizon year), but §5 flags
several shortcuts (`geo_risk` HHI proxy, fixed 0.10/0.15/0.20 stranding fractions), and
§4.2 shows `mining_entities`/`mining_risk_assessments` are **db-empty** with `/calculate`
and `/assessments/{id}` tracing **failed** — persistence isn't working end-to-end.

**How.** (1) Fix the persistence path so `POST /calculate` writes to `mining_risk_assessments`
and `/assessments/{id}` returns real rows (the tables exist but are empty). (2) Replace the
`hhi × 100` geopolitical proxy with a calibrated supply-concentration model using the
`critical_minerals_hhi` reference plus country-risk indices; ground the stranding fractions
(0.10/0.15/0.20) in commodity-specific transition-demand elasticities rather than fixed
constants. (3) Wire water stress to the platform's real WRI Aqueduct / physical-risk data
and tailings failure probability to GISTM consequence data. (4) Add horizon projection of
stranded value across NGFS pathways (rung 4) and bench-pin the roll-up.

**Prerequisites.** `mining_entities`/`mining_risk_assessments` write path repaired (D1
activation); country-risk and commodity-elasticity reference data. **Acceptance:**
`/calculate` and `/assessments/{id}` return `passed` with persisted rows; stranding
fractions and geo-risk carry calibration provenance; bench pin reproduces `overall_risk`.

### 9.2 Evolution B — Mine-level ESG risk copilot (LLM tier 2)

**What.** A copilot that runs `/calculate` for a mine and explains the composite —
"tailings risk is elevated because your GISTM class is Extreme with only 60% closure
provisioning; carbon-cost exposure adds 8% revenue-at-risk under disorderly transition" —
each figure tool-sourced, with what-ifs on scenario and provisioning.

**How.** `POST /calculate` plus `/reference-data` (critical-minerals HHI, water benchmarks,
carbon prices by scenario, GISTM classes) as grounding, and `/assessments` for history.
The seven-block decomposition lets the copilot attribute overall risk to specific drivers.
What-ifs ("what if we raise closure provisioning to full coverage?", "re-run under Net
Zero 2050") re-run statelessly. Natural node for a mining/materials desk and for the
tier-3 counterparty-assessment chain.

**Prerequisites.** Evolution A's persistence fix — a copilot narrating `/calculate` while
the endpoint traces `failed` would fabricate. **Acceptance:** every risk-block score and
stranded-value figure traces to a `/calculate` response; scenario what-ifs reflect fresh
calls; the copilot labels the geo-risk and stranding outputs as simplified-proxy until
Evolution A recalibrates, and refuses to assert an actual tailings-failure prediction.