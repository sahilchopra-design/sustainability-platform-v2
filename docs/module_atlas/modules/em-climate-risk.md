# EM Climate Risk
**Module ID:** `em-climate-risk` · **Route:** `/em-climate-risk` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Emerging market climate risk analytics combining physical hazard exposure, transition risk vulnerability, sovereign fiscal capacity, and capital flight risk into a composite EM Climate Risk Index. Covers 80+ emerging and frontier markets. Supports sovereign ESG analysis, EM fixed income risk assessment, and development finance institution due diligence.

> **Business value:** Provides sovereign debt investors, DFIs, and risk managers with a structured, multi-dimensional view of climate risk across emerging markets. The EMCRI enables climate-informed sovereign credit assessment and portfolio construction in markets where standard climate risk data is often incomplete.

**How an analyst works this module:**
- Select the sovereign universe and portfolio exposure weights from the portfolio picker
- Review the EMCRI ranked table and geographic heat map to identify the highest-risk exposures
- Drill into individual countries to see the four dimension scores and underlying data drivers
- Export the EM climate risk report for investment committee review or DFI due diligence documentation

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `EM_COUNTRIES`, `KpiCard`, `PIE_COLORS`, `Row`, `Section`, `Sel`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `EM_COUNTRIES` | 16 | `label` |

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
| `fossilFuelDep` | `Math.round(seed(ci * 163) * 40 + 20);` |
| `justTransitionRisk` | `seed(ci * 167) > 0.6 ? 'High' : seed(ci * 167) > 0.35 ? 'Medium' : 'Low';` |
| `greenBondMarket` | `Math.round(seed(241) * 50 + 80);` |
| `greenBondPipeline` | `Math.round(seed(243) * 30 + 40);` |
| `marketDepthScore` | `Math.round(seed(245) * 25 + 55);` |

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
| `EMClimateRiskEngine.assess_country_climate_risk` | country_code, entity_data | Pull EM_COUNTRY_PROFILES data, compute physical/transition composite, assign risk tier (high/medium/low) and return GEMS climate-adjusted loss estimate. |
| `EMClimateRiskEngine.assess_ifc_ps6_requirements` | entity_data, country_code | Determine PS6 applicability, score compliance, identify critical habitat exposure and biodiversity offset requirement. |
| `EMClimateRiskEngine.assess_concessional_finance_eligibility` | entity_data, country_code | Check eligibility for each of the 8 concessional finance facilities. Returns prioritised pipeline (top 3) and blended finance potential score. |
| `EMClimateRiskEngine.assess_green_finance_market` | country_code, pipeline_to_market_ratio | Assess EM green bond market depth, local currency risk, sustainable finance depth and pipeline vs market size ratio. pipeline_to_market_ratio: caller-supplied forward green-bond pipeline as a multiple of current market size (e.g. from an issuance pipeline database). When None, pipeline metrics are returned as null rather than fabricated — there is no reference-data anchor for a pipeline. |
| `EMClimateRiskEngine.compute_ndc_alignment` | entity_data, country_code | Assess NDC ambition score, alignment gap, required policy changes and just transition risk score. |
| `EMClimateRiskEngine.run_full_assessment` | entity_data | Orchestrate all sub-assessments for a single EM country exposure. Returns consolidated scores: em_climate_composite (0-100), risk_tier, opportunity_tier, physical_risk_score, transition_readiness_score, ndc_ambition_score, ifc_ps6_score, blended_finance_potential, gcf_allocation_bn, gems_climate_uplift_pct. |
| `EMClimateRiskEngine.run_portfolio_assessment` | portfolio_data | Portfolio-level EM assessment aggregating multiple country exposures. Expected input: entity_id: str exposures: list[{country_code, exposure_m, sector?, ...}] |

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

**POST /api/v1/em-climate-risk/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/em-climate-risk/concessional-finance** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/em-climate-risk/country-risk** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** EM Climate Risk Index
**Headline formula:** `EMCRI = 0.35 × PhysicalRisk + 0.30 × TransitionVulnerability + 0.20 × FiscalCapacity⁻¹ + 0.15 × CapitalFlightRisk`

Physical risk uses ND-GAIN vulnerability and readiness scores; transition vulnerability reflects fossil fuel export dependency and carbon intensity of GDP; fiscal capacity inverts the IMF fiscal space index; capital flight risk uses FX reserve adequacy and current account deficit metrics. The composite index is normalised 0–100 with 100 being maximum risk.

**Standards:** ['Notre Dame-Global Adaptation Initiative (ND-GAIN)', 'World Bank Climate Change Knowledge Portal', 'IMF Fiscal Monitor Climate Chapter', 'NGFS Emerging Market Scenario Guidance']
**Reference documents:** Notre Dame-Global Adaptation Initiative (2023) ND-GAIN Country Index; World Bank (2023) Climate Change Knowledge Portal â€” Country Profiles; IMF (2023) Fiscal Monitor â€” Climate Policies and Public Finances in Emerging Markets; NGFS (2023) Scenarios for Emerging Market and Developing Economies

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

## 7 · Methodology Deep Dive

EM Climate Risk (E87) is a **standards-grounded emerging-market climate & transition risk engine** —
among the most rigorous in the platform. `em_climate_risk_engine.py` scores 51 real EM countries on a
physical/transition/NDC/fossil composite, applies a **PCAF GEMS** climate-adjusted loss uplift, assesses
**IFC PS6** biodiversity compliance, and screens eligibility across 8 concessional-finance windows. The
engine explicitly **removed prior RNG fabrication** (deterministic loss allocation, no coin-flip PS6
scoring). No mismatch flag — the code implements a real, cited methodology.

### 7.1 What the module computes

**Country climate composite** (0–100, higher = worse):
```python
transition_rev = 100 − transition_readiness_score
ndc_gap        = 100 − ndc_ambition_score
composite = clamp( physical·0.35 + transition_rev·0.25 + ndc_gap·0.20 + fossil_dep·0.20 )
risk_tier = ≥65 high | ≥40 medium | else low
```
**GEMS climate-adjusted loss** (deterministic, per the docstring "no stochastic jitter"):
```python
gems_uplift_pct = GEMS_LOSS_MULTIPLIERS[region]           # region IPCC-AR6-derived uplift
gems_climate_adjusted_loss_bn = gems_historical_loss_bn · (1 + uplift/100)
entity_expected_loss_m = exposure_m · (adjusted_loss_bn / max(exposure_m·50, 1))
```
**IFC PS6 biodiversity** — habitat tier from location triggers, offset ratio, honest compliance scoring:
```python
is_critical = iucn_km<5 OR endangered_present OR habitat_type=='critical_habitat'
is_natural  = not critical AND (natural_habitat OR ramsar_km<10 OR habitat_ha>10)
offset_ratio = 3.0 critical | 1.5 natural | 0.0 modified
compliance_score = (met criteria / assessed criteria)·100   # None if nothing assessed
```
**Concessional finance** — eligibility across GCF/GEF/AIIB/ADB/IADB/EIB/AFD/WB against min size, income
group and sector; returns a prioritised top-3 pipeline and blended-finance potential.

### 7.2 Parameterisation / scoring rubric

**Composite weights:** physical 0.35, transition-reverse 0.25, NDC-gap 0.20, fossil-dependency 0.20 —
physical risk dominant, appropriate for EM adaptation exposure.

**GEMS regional loss uplift** (`GEMS_LOSS_MULTIPLIERS`, % applied to historical GEMS loss):

| Region | Uplift % |
|---|---|
| South Asia | 45 |
| Sub-Saharan Africa | 38 |
| East Asia Pacific | 32 |
| MENA | 28 |
| Latin America | 25 |
| ECA | 18 |

**NDC ambition tiers** (`NDC_AMBITION_CATEGORIES`, mapped to Climate Action Tracker): Highly Ambitious
80–100 (1.5°C compatible), Ambitious 60–79 (almost sufficient), Moderate 40–59 (insufficient),
Insufficient 0–39 (critically insufficient). **IFC PS6 offset ratios:** critical 3:1, natural 1.5:1,
modified none.

| Data table | Rows | Provenance |
|---|---|---|
| `EM_COUNTRY_PROFILES` | 51 | ND-GAIN, UNFCCC NDC registry, BNEF, CPI (real per-country scores) |
| `IFC_PS6_THRESHOLDS` | 3 tiers | IFC Performance Standard 6 (2012) |
| `CONCESSIONAL_FINANCE_WINDOWS` | 8 | GCF/GEF/MDB programming manuals |
| `GEMS_LOSS_MULTIPLIERS` | 6 regions | PCAF GEMS + IPCC AR6 |

Country scores (physical, transition readiness, NDC, ND-GAIN, fossil dependency, GCF allocation, GEMS
historical loss, green-bond market size) are **curated from named authoritative sources** — not seeded.

### 7.3 Calculation walkthrough

1. `assess_country_climate_risk` pulls the country profile → composite → risk/opportunity tier → GEMS
   climate-adjusted loss → per-entity expected loss → narrative key-risks (physical>70, fossil>70,
   just-transition>65, ND-GAIN<40).
2. `assess_ifc_ps6_requirements` classifies habitat tier from location evidence, sets offset ratio/area,
   and scores compliance **only over assessed criteria** (nulls where unassessed — no fabrication).
3. `assess_concessional_finance_eligibility` screens the 8 windows and ranks a pipeline.
4. Portfolio methods aggregate country exposures to an EM portfolio climate profile.

### 7.4 Worked example (Bangladesh, BD)

Profile: physical 88, transition readiness 35, NDC 55, fossil dependency 70, region South Asia, GEMS
historical loss $3.2bn. Entity exposure $200M.
```
transition_rev = 100−35 = 65 ; ndc_gap = 100−55 = 45
composite = 88·0.35 + 65·0.25 + 45·0.20 + 70·0.20 = 30.8 + 16.25 + 9.0 + 14.0 = 70.05 → 70.1
risk_tier = 70.1 ≥ 65 → HIGH
GEMS uplift (South Asia) = 45% → adjusted loss = 3.2·1.45 = $4.64bn
entity_loss = 200·(4.64 / max(200·50,1)) = 200·(4.64/10000) = 200·0.000464 = $0.093M
```
Key risks flagged: physical 88>70 (extreme weather/SLR), fossil 70=70 (not >70, so not flagged),
ND-GAIN 38<40 (low adaptive capacity). Bangladesh → HIGH risk, GCF allocation $0.55bn noted.

### 7.5 Data provenance & limitations

- **Country data is real and cited** (ND-GAIN 2024, UNFCCC NDC registry, PCAF GEMS, BNEF, CPI, IFC PS6).
  The engine is **deterministic** — the docstrings note prior `rng.uniform`/`rng.random` fabrications were
  removed from both the GEMS loss and PS6 compliance paths.
- The entity-loss allocation `/(exposure_m·50)` is an explicit **modelling simplification** (exposure as a
  proxy for ~2% national asset-base share per $M), documented in-code as an approximation.
- PS6 compliance is **honestly null** when evidence is not supplied — a strong model-risk practice
  (no default-to-compliant).
- Composite weights are expert priors, not statistically fit.

**Framework alignment:** **ND-GAIN Country Index** (vulnerability/readiness); **UNFCCC NDC** ambition
(mapped to **Climate Action Tracker** 1.5°C/2°C bands); **PCAF GEMS** (Global Emerging Markets risk
database) climate-adjusted expected loss; **IFC Performance Standard 6** biodiversity (critical/natural/
modified habitat, mitigation hierarchy avoid>minimise>restore>offset, no-net-loss / net-gain, offset
ratios); **GCF/GEF/MDB** concessional-finance eligibility and **OECD DAC** blended-finance principles;
IPCC AR6 regional loss uplift.

This module does **not** require a §8 model specification: it is a faithful, source-cited implementation.
The only production gaps are (a) replacing the simplified `/(exposure_m·50)` entity-loss allocation with a
proper asset-base share, and (b) feeding real per-project PS6 evidence rather than leaving criteria null.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to its own engine, then feed the engine real sovereign data (analytics ladder: rung 2 → 3)

**What.** The backend is a serious 13-endpoint vertical — `EMClimateRiskEngine` computes country composites with GEMS climate-adjusted loss estimates, IFC PS6 applicability, eligibility across 8 concessional facilities, NDC alignment, and green-finance market depth (with an exemplary honest-null: `pipeline_to_market_ratio=None` returns nulls "rather than fabricated"). But the page ignores it: every rendered score is a `seed()` draw (`physicalRisk = seed(ci·7)·40+40`, seeded PS6 scores, seeded green-bond figures), so users see numbers the engine never produced. Evolution A closes that gap, then upgrades the engine's data anchors.

**How.** (1) Replace all seeded page derivations with calls to `POST /assess`, `/country-risk`, `/portfolio` — the endpoints exist and the ref GETs already trace `passed`. (2) Data: the engine's `EM_COUNTRY_PROFILES` constants become a table refreshed from ND-GAIN (already among the platform's ETL sources) and IMF WEO fiscal/fossil-export series, per the §4 lineage sketch that names exactly these sources. (3) Rung 3: calibrate the GEMS multipliers against the published GEMS Consortium default statistics they're named for, and backtest EMCRI rank ordering against realized sovereign spread widening in climate-event years; publish both in `ref/gems-multipliers`.

**Prerequisites.** ND-GAIN/IMF ingester scheduling; portfolio exposures from `portfolios_pg` for `/portfolio`. **Acceptance:** lineage sweep shows the 7 POSTs `passed`; a country's page score equals a direct engine call; grep finds zero `seed()` in the page's data path; GEMS multipliers carry source citations.

### 9.2 Evolution B — DFI due-diligence analyst chaining the assessment stack (LLM tier 2)

**What.** The overview's end state — "export the EM climate risk report for investment committee or DFI due diligence" — as a tool-calling analyst: "assess a $40M agribusiness exposure in Kenya: climate risk tier, PS6 obligations, and which concessional windows could blend down the cost?" It chains `POST /country-risk` → `/ifc-ps6` → `/concessional-finance` → `/ndc-alignment`, then drafts the DD memo with the composite decomposition (the five weighted dimensions), the PS6 offset requirement if triggered, and the top-3 facility pipeline from the engine's prioritization.

**How.** Tool schemas from the module's 13 existing OpenAPI operations — this is among the platform's most tool-ready modules, needing no new backend for tier 2. Grounding corpus = this Atlas record's §2.3 (engine docstrings specify inputs/outputs precisely) and the IFC PS6 / GCF reference thresholds from the ref endpoints. The honest-null behavior propagates: where the engine returns null pipeline metrics, the memo says "no pipeline data anchor" — the engine's own convention, narrated. Every figure validator-checked against tool responses.

**Prerequisites (hard).** Evolution A's page-wiring first, so the copilot and the page describe the same numbers (a copilot citing engine output beside a page showing seeded scores would visibly contradict itself). **Acceptance:** a golden Kenya-exposure memo reproduces a scripted endpoint chain exactly; asking for a country outside the engine's profile set refuses with the covered-universe list.