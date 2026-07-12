# Green Hydrogen LCOH Engine
**Module ID:** `green-hydrogen-lcoh` · **Route:** `/green-hydrogen-lcoh` · **Tier:** A (backend vertical) · **EP code:** EP-DS1 · **Sprint:** DS

## 1 · Overview
Levelised Cost of Hydrogen engine modelling electrolyser CAPEX, electricity cost, capacity factor, efficiency and stack replacement to target IEA <$2/kgH2 by 2030.

> **Business value:** Green hydrogen LCOH is dominated by electricity cost (60-70%); achieving <$2/kgH2 requires <$30/MWh renewable electricity and electrolyser CAPEX below $300/kW, consistent with IEA Net Zero by 2050 milestones.

**How an analyst works this module:**
- Define electrolyser technology (PEM/ALK/SOEC) and capacity (MW)
- Input electricity price ($/MWh) and annual capacity factor (%)
- Apply capital recovery factor to CAPEX and add fixed/variable OPEX
- Divide total annual cost by annual H2 production to yield LCOH ($/kgH2)

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `ELECTROLYZER_TYPES`, `ENGINE_ELECTROLYSER_ID`, `GH_API`, `HHV_H2`, `KpiCard`, `LHV_H2`, `LiveBadge`, `REGIONS`, `RENEWABLE_SOURCES`, `Slider`, `TABS`, `YEARS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ELECTROLYZER_TYPES` | 5 | `label`, `efficiency`, `capex`, `opexPct`, `stackLife`, `rampRate`, `pressureBar`, `tempC`, `trl`, `color`, `strengths`, `weaknesses` |
| `RENEWABLE_SOURCES` | 9 | `lcoe`, `cf`, `variability` |
| `REGIONS` | 9 | `elec`, `policyScore`, `infraScore`, `target2030`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `GH_API` | ``${API}/api/v1/green-hydrogen`;` |
| `HHV_H2` | `39.4;  // kWh/kg (higher heating value)` |
| `LHV_H2` | `33.3;  // kWh/kg (lower heating value)` |
| `annualKgPerMW` | `(capacityFactor / 100) * 8760 * 1000 / (efficiency / 100 * LHV_H2);` |
| `capexAnnual` | `capex * 1000 * (wacc / 100) / (1 - Math.pow(1 + wacc / 100, -lifetime));` |
| `electricityCost` | `elecCost * (efficiency / 100 * LHV_H2) / 1000;` |
| `stackCostAnnual` | `(capex * 1000 * stackReplace / 100) / (lifetime / 2);` |
| `totalAnnualPerKg` | `(capexAnnual + opexPct * capex * 1000 / 100 + stackCostAnnual) / Math.max(1, annualKgPerMW) + electricityCost;` |
| `YEARS` | `Array.from({ length: 16 }, (_, i) => 2025 + i);` |
| `lcohDemo` | `useMemo(() => calcLcoh({ elecCost, capex, opexPct, efficiency, capacityFactor, lifetime, stackReplace, wacc }), [elecCost, capex, opexPct, efficiency, capacityFactor, lifetime, stackReplace, wacc]);  // --- Live backend wiring: headline LCOH KPI ------------------------------ // POST /api/v1/green-hydrogen/lcoh (backend/services/green_hyd` |
| `annualOutput` | `useMemo(() => { const kgPerMWh = 1000 / (efficiency / 100 * LHV_H2);` |
| `learningData` | `useMemo(() => YEARS.map((y, i) => {` |
| `cumGWPEM` | `2 + i * 8;` |
| `cumGWAEL` | `8 + i * 5;` |
| `cumGWSOEC` | `0.5 + i * 2;` |
| `cumGWAEM` | `0.2 + i * 3;` |
| `lcohElecData` | `useMemo(() => Array.from({ length: 11 }, (_, i) => { const ec = 20 + i * 10;` |
| `cfData` | `useMemo(() => Array.from({ length: 9 }, (_, i) => { const cf = 20 + i * 10;` |
| `waterfallData` | `useMemo(() => { const kgPerMWh = 1000 / (efficiency / 100 * LHV_H2);` |
| `annualKg` | `(capacityFactor / 100) * 8760 * 1000 * kgPerMWh;` |
| `capexAnn` | `capex * 1000 * (wacc / 100) / (1 - Math.pow(1 + wacc / 100, -lifetime));` |
| `opexAnn` | `capex * 1000 * opexPct / 100;` |
| `stackAnn` | `capex * 1000 * stackReplace / 100 / (lifetime / 2);` |
| `elecAnn` | `elecCost * (efficiency / 100 * LHV_H2) / 1000;` |
| `regionalData` | `useMemo(() => REGIONS.map((r, i) => ({` |
| `radarData` | `ELECTROLYZER_TYPES.map(e => ({` |
| `panelStyle` | `{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text };` |
| `gridStyle` | `{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 };` |
| `reduction` | `cost2030 ? (((costNow - cost2030) / costNow) * 100).toFixed(0) : 'N/A';` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/green-hydrogen/assess` | `assess_facility` | api/v1/routes/green_hydrogen.py |
| POST | `/api/v1/green-hydrogen/rfnbo-compliance` | `rfnbo_compliance` | api/v1/routes/green_hydrogen.py |
| POST | `/api/v1/green-hydrogen/lcoh` | `lcoh_calculation` | api/v1/routes/green_hydrogen.py |
| GET | `/api/v1/green-hydrogen/ref/rfnbo-criteria` | `ref_rfnbo_criteria` | api/v1/routes/green_hydrogen.py |
| GET | `/api/v1/green-hydrogen/ref/electrolyser-benchmarks` | `ref_electrolyser_benchmarks` | api/v1/routes/green_hydrogen.py |
| GET | `/api/v1/green-hydrogen/ref/country-grid-factors` | `ref_country_grid_factors` | api/v1/routes/green_hydrogen.py |
| GET | `/api/v1/green-hydrogen/ref/repowereu-targets` | `ref_repowereu_targets` | api/v1/routes/green_hydrogen.py |
| GET | `/api/v1/green-hydrogen/ref/h2cfd-framework` | `ref_h2cfd_framework` | api/v1/routes/green_hydrogen.py |
| POST | `/api/v1/green-hydrogen-engine/classify-pathway` | `classify_pathway` | api/v1/routes/green_hydrogen_engine.py |
| POST | `/api/v1/green-hydrogen-engine/eu-rfnbo-compliance` | `eu_rfnbo_compliance` | api/v1/routes/green_hydrogen_engine.py |
| POST | `/api/v1/green-hydrogen-engine/calculate-lcoh` | `calculate_lcoh` | api/v1/routes/green_hydrogen_engine.py |
| POST | `/api/v1/green-hydrogen-engine/apply-subsidy` | `apply_subsidy` | api/v1/routes/green_hydrogen_engine.py |
| POST | `/api/v1/green-hydrogen-engine/scenario-analysis` | `scenario_analysis` | api/v1/routes/green_hydrogen_engine.py |
| POST | `/api/v1/green-hydrogen-engine/full-assessment` | `full_assessment` | api/v1/routes/green_hydrogen_engine.py |
| GET | `/api/v1/green-hydrogen-engine/ref/pathways` | `ref_pathways` | api/v1/routes/green_hydrogen_engine.py |
| GET | `/api/v1/green-hydrogen-engine/ref/electrolyser-params` | `ref_electrolyser_params` | api/v1/routes/green_hydrogen_engine.py |
| GET | `/api/v1/green-hydrogen-engine/ref/rfnbo-criteria` | `ref_rfnbo_criteria` | api/v1/routes/green_hydrogen_engine.py |
| GET | `/api/v1/green-hydrogen-engine/ref/subsidy-schemes` | `ref_subsidy_schemes` | api/v1/routes/green_hydrogen_engine.py |
| GET | `/api/v1/green-hydrogen-engine/ref/cost-scenarios` | `ref_cost_scenarios` | api/v1/routes/green_hydrogen_engine.py |

### 2.3 Engine `green_hydrogen_engine` (services/green_hydrogen_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_get_electricity_ef` | electricity_source, country | Return (kgCO2eq/kWh, description) for the given electricity source. |
| `_calculate_ghg_intensity` | electrolyser_type, electricity_ef_kg_co2_kwh, include_compression, include_water_treatment | Well-to-gate GHG intensity per ISO 14040/14044 approach (kgCO2eq/kgH2). |
| `_assess_additionality` | electricity_source, country, commissioning_year, re_installation_year, has_ppa, ppa_dedicated_new_asset | Score RFNBO additionality criterion (2023/1185 Art 4). Returns score 0-1 + compliance flag. |
| `_assess_temporal_correlation` | accounting_year, matching_granularity | Score temporal correlation criterion (2023/1185 Art 5). |
| `_assess_geographical_correlation` | country, re_location_country, same_bidding_zone, adjacent_zone_congestion_free_pct | Score geographical correlation criterion (2023/1185 Art 6). |
| `calculate_rfnbo_compliance` | electricity_source, country, electrolyser_type, commissioning_year, re_installation_year, has_ppa, ppa_dedicated_new_asset, accounting_year | Assess RFNBO compliance against all 4 EU criteria (2023/1184 + 2023/1185). Returns individual criterion scores (0-1), composite score, and RFNBO eligibility flag. RFNBO eligible only when ALL 4 criteria are compliant. |
| `calculate_lcoh` | electrolyser_type, country, capacity_mw, capex_usd_kw, capacity_factor, discount_rate, lifetime_yr, electricity_price_usd_mwh | Calculate Levelised Cost of Hydrogen (USD/kgH2) per IEA Global Hydrogen Review 2023. LCOH = (CAPEX × CRF + OPEX_annual + stack_replacement_annual) / annual_H2_kg + electricity_cost/kgH2 CRF = r / (1 − (1+r)^(−n)) |
| `assess_green_hydrogen` | facility_name, country, production_capacity_mw, electrolyser_type, electricity_source, commissioning_year, re_installation_year, has_ppa | Full facility-level green hydrogen assessment. Combines: - RFNBO compliance (all 4 criteria, EU 2023/1184 + 2023/1185) - GHG intensity (ISO 14040/14044 lifecycle) - LCOH economics (IEA methodology) - H2 CfD eligibility + indicative support - Certification gap analysis - REPowerEU country context |
| `get_h2_benchmarks` |  | Return consolidated benchmark and reference data for green hydrogen analysis. |
| `GreenHydrogenEngine.classify_pathway` | entity_id, production_pathway, renewable_electricity_pct, carbon_intensity_kgco2e_kgh2 |  |
| `GreenHydrogenEngine.check_eu_rfnbo_compliance` | entity_id, additionality_met, temporal_correlation_met, geographical_correlation_met, carbon_intensity |  |
| `GreenHydrogenEngine.calculate_lcoh` | entity_id, capacity_mw, capacity_factor_pct, electricity_cost_mwh, capex_per_kw, discount_rate_pct, lifetime_years |  |
| `GreenHydrogenEngine.apply_subsidy` | entity_id, lcoh, h2_subsidy_scheme |  |
| `GreenHydrogenEngine.run_scenario_analysis` | entity_id, assessment_id, technology, capacity_mw, capacity_factor_pct, discount_rate_pct |  |
| `GreenHydrogenEngine.full_assessment` | entity_id, project_name, country_code, production_pathway, technology, capacity_mw, capacity_factor_pct, electricity_cost_mwh |  |
| `GreenHydrogenEngine.get_h2_pathways` |  |  |
| `GreenHydrogenEngine.get_electrolyser_params` |  |  |
| `GreenHydrogenEngine.get_eu_rfnbo_criteria` |  |  |
| `GreenHydrogenEngine.get_subsidy_schemes` |  |  |
| `GreenHydrogenEngine.get_cost_scenarios` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `exc` *(shared)*, `facility` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ELECTROLYZER_TYPES`, `REGIONS`, `RENEWABLE_SOURCES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Electrolyser CAPEX | `CAPEX×CRF/Annual_H2` | IEA 2023 | Lower CAPEX directly reduces LCOH; target <$300/kW by 2030 for cost parity. |
| Electricity Cost Share | `P_elec(kWh/kgH2)/LCOH` | IRENA 2023 | Dominant cost driver; green H2 viability requires renewable electricity <$30/MWh. |
| System Efficiency | `η = H2_HHV/E_input` | Hydrogen Council 2021 | PEM efficiency 50–60 kWh/kgH2; alkaline 50–55 kWh/kgH2 at stack level. |
- **Electricity price feed** → → LCOH sensitivity model → **$/kgH2 by scenario**
- **CAPEX trajectory** → → learning rate curve → **Cost reduction vs cumulative GW deployed**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/green-hydrogen/ref/country-grid-factors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'countries', 'high_re_threshold_pct', 'high_re_eligible_countries', 'methodology', 'note'], 'n_keys': 6}`

**GET /api/v1/green-hydrogen/ref/electrolyser-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'benchmarks', 'notes'], 'n_keys': 3}`

**GET /api/v1/green-hydrogen/ref/h2cfd-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'framework', 'key_parameters', 'eligibility_summary'], 'n_keys': 4}`

**GET /api/v1/green-hydrogen/ref/repowereu-targets** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'targets', 'repowereu_total_eu_target_mt_2030', 'eu_import_target_mt_2030', 'electrolysis_capacity_target_gw_2030', '2024_installed_gw_estimate', 'gap_commentary'], 'n_keys': 7}`

**GET /api/v1/green-hydrogen/ref/rfnbo-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'effective_date', 'criteria', 'rfnbo_definition', 'green_hydrogen_classification', 'ghg_threshold_kg_co2_kgh2', 'counterfactual_method'], 'n_keys': 7}`

**POST /api/v1/green-hydrogen/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/green-hydrogen/lcoh** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/green-hydrogen/rfnbo-compliance** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** LCOH Methodology
**Headline formula:** `LCOH = (CAPEX×CRF + OPEX) / Annual_H2_Production`

Capital recovery factor applied to electrolyser CAPEX; electricity cost represents 60-70% of LCOH at current tariffs.

**Standards:** ['IEA Hydrogen', 'IRENA Green Hydrogen Cost', 'Hydrogen Council Pathway']
**Reference documents:** IEA Global Hydrogen Review 2023; IRENA Green Hydrogen Cost Reduction 2020; Hydrogen Council Hydrogen Insights 2023

**Engine `green_hydrogen_engine` — extracted transformation lines:**
```python
electrolysis_ghg = kwh_per_kgh2 * electricity_ef_kg_co2_kwh
total_ghg = electrolysis_ghg + water_ghg + compression_ghg
reduction_vs_fossil_pct = (1.0 - total_ghg / (94.0 * H2_LHV_MJ_PER_KG / 1000.0)) * 100.0
age_months = (commissioning_year - re_installation_year) * 12
penalty = min((age_months - ADDITIONALITY_MAX_AGE_MONTHS) / 120.0, 1.0)
score = round(max(0.0, 1.0 - penalty), 3)
partial_score = round(min(re_share / HIGH_RE_GRID_THRESHOLD_PCT, 1.0) * 0.5, 3)
score = round((congestion_free / threshold) * 0.8, 3)
c1_score = round(max(0.0, 1.0 - excess / RFNBO_GHG_THRESHOLD_KG_CO2_KGH2), 3)
LCOH = (CAPEX × CRF + OPEX_annual + stack_replacement_annual) / annual_H2_kg + electricity_cost/kgH2
CRF  = r / (1 − (1+r)^(−n))
frac = (projection_year - 2024) / 6.0
frac = min((projection_year - 2030) / 20.0, 1.0)
capex_total_usd = capex_usd_kw * capacity_mw * 1000.0
crf = (discount_rate / (1.0 - (1.0 + discount_rate) ** (-lifetime_yr))
operating_hours_yr = capacity_factor * 8760.0
annual_energy_kwh = capacity_mw * 1000.0 * operating_hours_yr
annual_h2_kg = annual_energy_kwh * efficiency_lhv / H2_LHV_KWH_PER_KG
replacements_over_life = (lifetime_yr * operating_hours_yr) / stack_lifetime_hr
lcoh_capex = (capex_total_usd * crf) / annual_h2_kg
lcoh_opex = (capex_total_usd * opex_frac) / annual_h2_kg
lcoh_stack = annual_stack_usd / annual_h2_kg
lcoh_electricity = (annual_energy_kwh / 1000.0) * electricity_price_usd_mwh / annual_h2_kg
lcoh_total = lcoh_capex + lcoh_opex + lcoh_stack + lcoh_electricity
ng_parity_usd_kgh2 = 8.0 * H2_LHV_MJ_PER_KG / 1000.0  # USD 8/GJ TTF → USD/kgH2
cfd_support_eur_kgh2 = round(max(0.0, min(lcoh_eur - ng_parity_eur, max_support)), 3)
excess = max(0.0, carbon_intensity - RFNBO_GHG_THRESHOLD_KG_CO2_KGH2)
c1_score = round(max(0.0, 1.0 - excess / RFNBO_GHG_THRESHOLD_KG_CO2_KGH2), 3)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **46** other module(s).
**Shared engines (edits propagate!):** `green_hydrogen_engine` (used by 4 modules)

| Connected module | Shared via |
|---|---|
| `green-hydrogen-economics` | engine:green_hydrogen_engine, table:exc, table:facility |
| `green-hydrogen-ammonia-carbon` | engine:green_hydrogen_engine, table:exc, table:facility |
| `green-hydrogen` | engine:green_hydrogen_engine, table:exc, table:facility |
| `blended-finance-structuring` | table:exc |
| `supply-chain-esg-hub` | table:exc |
| `carbon-accounting-ai` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `adaptation-finance` | table:exc |
| `modern-slavery-intel` | table:exc |
| `supply-chain-resilience` | table:exc |
**Shared UI wrappers:** `EnergyAdvancedAnalytics`

## 7 · Methodology Deep Dive

This **tier-A** page implements a **client-side LCOH calculator** (`calcLcoh`) that closely matches the
guide (EP-DS1: `LCOH = (CAPEX·CRF + OPEX)/Annual_H2_Production`) and the backend
`green_hydrogen_engine.calculate_lcoh`. Unlike the sibling `green-hydrogen-economics` page, this
calculator is **deterministic and dimensionally faithful** — it uses the HHV of hydrogen, a proper capital
recovery factor, an explicit electricity term, and an amortised stack-replacement term. It is the strongest
of the four hydrogen frontends. Sections below document the real formula.

### 7.1 What the module computes

```js
HHV_H2 = 39.4 kWh/kg ;  LHV_H2 = 33.3 kWh/kg
annualKgPerMW = (CF/100)·8760·1000 / (efficiency/100 · HHV_H2)          // kg H2 per MW-yr
capexAnnual   = capex·1000·(wacc/100) / (1 − (1+wacc/100)^−lifetime)     // CRF applied to $/kW·1000
electricityCost = elecCost · (efficiency/100 · HHV_H2)                   // $/kg (elecCost $/kWh × kWh/kg)
stackCostAnnual = (capex·1000·stackReplace/100) / (lifetime/2)          // amortise one replacement mid-life
totalPerKg    = (capexAnnual + opex·capex·1000/100 + stackCostAnnual)/max(1, annualKgPerMW)
              + electricityCost
```
Plus a 16-year electrolyser learning curve, an LCOH-vs-electricity-cost sweep, an LCOH-vs-capacity-factor
sweep, a waterfall decomposition, a regional comparison, and an electrolyser radar.

### 7.2 Parameterisation / provenance

| Constant | Value | Provenance |
|---|---|---|
| H2 HHV / LHV | 39.4 / 33.3 kWh/kg | physical constants |
| `capexAnnual` CRF | `wacc/(1−(1+wacc)^−lifetime)` | standard capital recovery factor |
| Stack amortisation | one replacement over `lifetime/2` | simplifying assumption (engine uses hours-based count) |
| `ELECTROLYZER_TYPES` (5) | efficiency, capex, opex, stackLife, ramp, TRL | IEA/manufacturer benchmarks (guide: CAPEX $400–2000/kW) |
| `RENEWABLE_SOURCES` (9) | lcoe, cf, variability | IRENA cost anchors |
| `REGIONS` (9) | elec price, policy/infra score, 2030 target | synthetic regional anchors |
| Learning curve `cumGW` | `2+i·8` (PEM) etc. | illustrative deployment ramp |

The core LCOH constants are physically correct; only the regional/learning-curve overlays are illustrative.

### 7.3 Calculation walkthrough

Sliders (`elecCost, capex, opexPct, efficiency, capacityFactor, lifetime, stackReplace, wacc`) → `calcLcoh`:
compute `annualKgPerMW` (production per MW), annualised CAPEX via CRF, OPEX (% of CAPEX), stack cost, and
the electricity cost per kg; sum to `totalPerKg`. The waterfall (`waterfallData`) shows each component's
$/kg contribution. Sweeps hold all else fixed and vary electricity price (`lcohElecData`) or capacity
factor (`cfData`) to trace the two dominant sensitivities. `reduction` = % LCOH fall from now to 2030 on
the learning curve.

### 7.4 Worked example

`elecCost = $0.045/kWh`, `capex = $1000/kW`, `opexPct = 3`, `efficiency = 65%`, `CF = 50%`, `lifetime = 20`,
`stackReplace = 15`, `wacc = 8`:
- `annualKgPerMW = 0.50·8760·1000 / (0.65·39.4) = 4,380,000 / 25.61 = 171,027 kg/MW-yr`.
- `CRF = 0.08/(1−1.08^−20) = 0.08/0.7855 = 0.1019`; `capexAnnual = 1000·1000·0.1019 = $101,900/MW-yr`.
- `stackCostAnnual = (1,000,000·0.15)/(20/2) = 150,000/10 = $15,000/MW-yr`.
- OPEX = `0.03·1,000,000 = $30,000/MW-yr`.
- Non-fuel per kg = `(101,900 + 30,000 + 15,000)/171,027 = 146,900/171,027 = $0.859/kg`.
- `electricityCost = 0.045·(0.65·39.4) = 0.045·25.61 = $1.152/kg`.
- **`totalPerKg = 0.859 + 1.152 = $2.01/kg`** — a plausible best-case green-H2 LCOH, electricity being
  ~57% of the total, matching the guide's "60–70% of LCOH" claim and the IEA <$2/kg 2030 target.

### 7.5 Data provenance & limitations

- The LCOH engine is **deterministic and physically correct** (HHV, CRF, explicit electricity term) — no
  seeded jitter in the headline number. The regional and learning-curve overlays are illustrative.
- Uses **HHV** for the efficiency→kWh/kg conversion; the backend engine uses **LHV** (33.33) — the two
  conventions differ by ~18%, so this page's production/kg and the engine's will not exactly reconcile.
  A production build should fix one convention (LHV is standard for RFNBO/IEA reporting).
- Stack replacement is amortised as one event over `lifetime/2`, vs the engine's operating-hours-based
  replacement count — a simplification.

**Framework alignment:** IEA Global Hydrogen Review (LCOH structure + <$2/kg 2030 target), IRENA green-
hydrogen cost reduction, Hydrogen Council pathway. The CRF/component decomposition mirrors standard LCOE/
LCOH practice. Consistency note: reconcile the HHV-vs-LHV convention against the backend engine.

*(No §8 model specification required — this page already implements a sound LCOH model; the only
remediation is to align the HHV/LHV convention with `green_hydrogen_engine.py` so frontend and backend
LCOH agree.)*

## 9 · Future Evolution

### 9.1 Evolution A — Align HHV/LHV convention with the engine and add live-price learning curves (analytics ladder: rung 3 → 4)

**What.** §7 rates this LCOH engine deterministic and physically correct — explicit HHV (39.4 kWh/kg), CRF, and electricity term (60–70% of LCOH), no seeded jitter in the headline number, targeting the IEA <$2/kgH₂-by-2030 benchmark. The only flagged issue: the frontend's HHV/LHV convention must be aligned with `green_hydrogen_engine.py` so frontend and backend agree, and the regional/learning-curve overlays are illustrative. Evolution A resolves the convention mismatch (one authoritative HHV/LHV basis), then deepens the illustrative overlays into real ones: regional LCOH from live electricity prices (the dominant driver, via EIA/ENTSO-E wave-1 feeds) and a learning-curve CAPEX projection calibrated to the IEA electrolyser-cost trajectory the engine already references — moving the cost-parity-timeline from illustrative to data-backed predictive.

**How.** (1) Standardise the HHV/LHV basis across page and engine so `calculate_lcoh` and the client agree. (2) Regional LCOH overlay driven by live electricity prices rather than illustrative regional factors. (3) The learning-curve overlay computes CAPEX decline from the IEA trajectory (`cost(cum) = cost₀·(cum/cum₀)^(−b)`), giving a calibrated cost-parity year rather than a stylised curve.

**Prerequisites.** Agreement on HHV vs LHV convention (documented); regional electricity-price feeds; IEA CAPEX-trajectory reference. **Acceptance:** page and engine LCOH match under one HHV/LHV basis; the regional overlay responds to live electricity prices; the learning curve reproduces the IEA trajectory and yields a calibrated parity year.

### 9.2 Evolution B — LCOH sensitivity copilot (LLM tier 2)

**What.** A copilot for hydrogen developers: "at $25/MWh power and 50% capacity factor, what's my LCOH, and what electricity price hits the IEA $2/kg target?" tool-calls the engine's LCOH endpoint and runs the goal-seek, narrating the electricity-cost dominance and stack-replacement sensitivity.

**How.** Tier-2 tool-calling over the deterministic LCOH engine (the module is tier-A and physically correct — a strong tier-2 candidate now); the grounding corpus is §5/§7 (the CRF LCOH form, the electricity-cost share, the IEA target). Because the headline LCOH has no jitter, a tier-1 explainer over rendered state ships immediately; the tier-2 upgrade adds computed what-ifs and the $2/kg goal-seek. Every $/kg figure validated against engine output.

**Prerequisites.** Evolution A's convention alignment for consistent answers; corpus embedding. **Acceptance:** every LCOH figure traces to an engine tool call; the goal-seek returns an electricity price reproducing the $2/kg target from the CRF formula; page and engine agree under the standardised convention.