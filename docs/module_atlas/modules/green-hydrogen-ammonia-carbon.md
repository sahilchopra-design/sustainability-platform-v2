# Green Ammonia and Carbon-Neutral Fuels
**Module ID:** `green-hydrogen-ammonia-carbon` · **Route:** `/green-hydrogen-ammonia-carbon` · **Tier:** A (backend vertical) · **EP code:** EP-DS7 · **Sprint:** DS

## 1 · Overview
Economics and carbon intensity analysis of green ammonia and carbon-neutral shipping fuels, covering electrified Haber-Bosch, cost benchmarks, IMO 2023 GHG fuel mix targets and shipping fuel comparison.

> **Business value:** Green ammonia is the leading carbon-neutral shipping fuel candidate under IMO 2023 GHG strategy; at $800/tNH3 it is 2-3× the price of conventional bunker fuel but delivers zero well-to-wake emissions, with cost parity achievable below $500/tNH3 by 2035 per IRENA learning curves.

**How an analyst works this module:**
- Model green NH3 cost from LCOH input through electrified Haber-Bosch conversion
- Compare shipping fuel options: green NH3 vs green methanol vs liquid H2 vs bio-LNG on $/GJ and gCO2e/MJ
- Apply IMO 2023 GHG Fuel Intensity (GFI) framework to assess fleet compliance cost
- Calculate carbon premium per tonne of cargo for green ammonia vs conventional fuels

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COST_CURVE_H2`, `COST_CURVE_NH3`, `DEVELOPERS`, `ELECTROLYZER_SPECS`, `JCM_CORRIDORS`, `Kpi`, `RFNBO_CRITERIA`, `SIGHT_SCHEME`, `SectionTitle`, `Tab`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DEVELOPERS` | 7 | `parent`, `techH2`, `techNH3`, `targetKtpaNH3`, `targetKtpaH2`, `capex2030BnUsd`, `sightH2Elig`, `sightNH3Elig`, `jcmPartner`, `rfnboCompliant`, `co2KgKgH2`, `co2KgKgNH3`, `irrEquityPct`, `dscrAvg`, `greenBondIssuedBnUsd` |
| `COST_CURVE_H2` | 8 | `india`, `australia`, `chile`, `middleEast`, `eu`, `grey`, `blue` |
| `COST_CURVE_NH3` | 8 | `greenIndia`, `greenAustralia`, `grey`, `blue` |
| `SIGHT_SCHEME` | 5 | `product`, `incentivePerUnit`, `volume`, `tenure`, `eligibility`, `totalOutlay` |
| `RFNBO_CRITERIA` | 6 | `requirement`, `india`, `note` |
| `JCM_CORRIDORS` | 5 | `product`, `volume2027KtPA`, `creditSplit`, `pricePerITMO`, `articleSixMode`, `status` |
| `ELECTROLYZER_SPECS` | 5 | `capexUsdKw`, `efficiency`, `durabilityKhr`, `h2purity`, `scaleReadyMw`, `costTrend` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `tonnesH2` | `h2ProductionKtpa * 1e6;` |
| `actualCO2` | `tonnesH2 * co2KgPerKgH2;` |
| `greyBaselineCO2` | `tonnesH2 * greyBaseline;` |
| `creditsGross` | `(greyBaselineCO2 - actualCO2) / 1e9;` |
| `creditsIndia` | `creditsGross * (jcmSplit/100);` |
| `creditsJapan` | `creditsGross * (1 - jcmSplit/100);` |
| `revenue` | `creditsGross * creditPrice * 1e6;` |
| `totalIncentiveCr` | `productionKtpa * 1e6 * ratePerKg / 1e7;` |
| `sightNH3` | `useMemo(() => calcSightIncentive({ productionKtpa:nh3ProductionKtpa, ratePerKg:30, product:'NH3' }), [nh3ProductionKtpa]);  const tabs = ['Overview','Developer Dashboard','GH2 Cost Curve','GA Cost Curve','SIGHT Incentive Calc','RFNBO Compliance','Electrolyzer Finance','JCM / Article 6','Carbon Credit Engine','IRR & Project Finance','Advan` |

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
**Frontend seed datasets:** `COST_CURVE_H2`, `COST_CURVE_NH3`, `DEVELOPERS`, `ELECTROLYZER_SPECS`, `JCM_CORRIDORS`, `RFNBO_CRITERIA`, `SIGHT_SCHEME`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Green NH3 Production Cost | `LCOH/0.178 + BH_CAPEX×CRF + OPEX` | IRENA 2022 | Cost dominated by green H2 input (60-70%); Haber-Bosch plant CAPEX and N2 supply represent 20-30%. |
| Carbon Intensity vs Grey NH3 | `LCA: electrolysis + Haber-Bosch, grid boundary` | Ammonia Energy Association | Grey NH3 at 1.6 tCO2e/t is the displacement target; blue NH3 achieves 0.2-0.4 tCO2e/t with 90% CCS. |
| IMO Fuel Mix Compliance | `GFI ≤ Reference_Line × (1 - reduction_factor)` | IMO MEPC 80 2023 | IMO 2023 strategy targets 20-30% GHG reduction by 2030, 70-80% by 2040; green ammonia and methanol are primary compliant fuels. |
- **IMO fuel intensity benchmarks** → → compliance model → **GFI by fuel type and ship class**
- **Green NH3 spot price** → → cost model → **$/tNH3 by trade route and year**

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
**Methodology:** Green Ammonia Cost Model
**Headline formula:** `LCOP_NH3 = LCOH($/kgH2) / 0.178 + Haber-Bosch_CAPEX×CRF/output + OPEX`

Green ammonia at 17.6 wt% hydrogen content; electrified Haber-Bosch CAPEX $400-800/tNH3/yr; carbon intensity 0.0 tCO2e/t vs 1.6 for grey ammonia.

**Standards:** ['Ammonia Energy Association Green NH3 Roadmap', 'IRENA Innovation Outlook Ammonia', 'IMO GHG Strategy 2023']
**Reference documents:** Ammonia Energy Association Green Ammonia Technology Roadmap 2022; IRENA Innovation Outlook: Electrofuels — Ammonia Chapter 2021; IMO MEPC 80 Revised GHG Strategy 2023

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
| `green-hydrogen-lcoh` | engine:green_hydrogen_engine, table:exc, table:facility |
| `green-hydrogen-economics` | engine:green_hydrogen_engine, table:exc, table:facility |
| `green-hydrogen` | engine:green_hydrogen_engine, table:exc, table:facility |
| `blended-finance-structuring` | table:exc |
| `supply-chain-esg-hub` | table:exc |
| `carbon-accounting-ai` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `adaptation-finance` | table:exc |
| `modern-slavery-intel` | table:exc |
| `supply-chain-resilience` | table:exc |
**Shared UI wrappers:** `Apr2026CarbonAnalytics`, `IndiaAdvancedAnalytics`, `IndiaGreenHybridFinance`

## 7 · Methodology Deep Dive

This **tier-A module** shares the rigorous `green_hydrogen_engine.py` (EU RFNBO law, IEA LCOH, ISO
14040/44) for the hydrogen layer, but the **green-ammonia, carbon-credit, SIGHT-incentive and JCM/Article-6
logic is implemented client-side** in the page. Those frontend calculations are transparent formulas over
seeded developer/cost data (`sr()` PRNG); the ammonia LCOP conversion and the Article-6 credit split are
the load-bearing on-page maths. Sections below document the frontend calculations and the engine they sit on.

### 7.1 What the module computes

Carbon-credit engine (frontend):
```js
tonnesH2       = h2ProductionKtpa · 1e6
actualCO2      = tonnesH2 · co2KgPerKgH2                     // kg
greyBaselineCO2 = tonnesH2 · greyBaseline                    // grey SMR ~10 kgCO₂/kgH2
creditsGross   = (greyBaselineCO2 − actualCO2) / 1e6          // MtCO₂e avoided
creditsIndia   = creditsGross · (jcmSplit/100)               // Article-6 ITMO split
creditsJapan   = creditsGross · (1 − jcmSplit/100)
revenue        = creditsGross · creditPrice · 1e6
SIGHT incentive: totalIncentiveCr = productionKtpa · 1e6 · ratePerKg / 1e7    // ₹ crore
```
Ammonia cost (guide formula): `LCOP_NH3 = LCOH($/kgH2)/0.178 + HaberBosch_CAPEX·CRF/output + OPEX`
(17.6 wt% H2 in NH₃). Developer dashboard, GH2/GA cost curves, RFNBO compliance, electrolyser finance,
IRR/project finance are additional tabs over seeded `DEVELOPERS`/`COST_CURVE_*` data.

### 7.2 Parameterisation / provenance

| Element | Value | Provenance |
|---|---|---|
| Grey H2 baseline | ~10 kgCO₂/kgH2 (SMR) | IEA — displacement baseline for credits |
| Green NH₃ carbon intensity | 0.0 vs grey 1.6 tCO₂e/t | Ammonia Energy Association (guide) |
| H2 mass fraction in NH₃ | 0.178 (17.6 wt%) | stoichiometry (NH₃ = 3H per N) |
| SIGHT rates | H2 & NH₃ ₹/kg (e.g. NH₃ ₹30/kg) | India SIGHT scheme (Mission green H2) |
| JCM split | `jcmSplit` slider | Article 6.2 ITMO bilateral split (India–Japan) |
| `DEVELOPERS` (7) | parent, tech, targets, capex, IRR, DSCR | seeded (`sr()`); named developers illustrative |
| `COST_CURVE_H2/NH3` | India/Australia/Chile/ME/EU/grey/blue $/kg | seeded curve anchors |
| RFNBO / electrolyser specs | from engine constants | EU 2023/1184-85, IEA |

### 7.3 Calculation walkthrough

H2 production (ktpa) → tonnes → actual vs grey-baseline CO₂ → gross credits (MtCO₂e) → Article-6 split
(India/Japan via `jcmSplit`) → revenue at `creditPrice`. SIGHT incentive scales production by the per-kg
rate to ₹ crore (÷1e7). Ammonia LCOP takes the engine's LCOH, divides by 0.178 to get $/kg-NH₃ from the
hydrogen input, and adds a Haber-Bosch CAPEX annuity + OPEX. IMO GFI compliance compares fuel well-to-wake
intensity to the reference line.

### 7.4 Worked example (carbon credits)

`h2ProductionKtpa = 100`, `co2KgPerKgH2 = 1.0` (green), `greyBaseline = 10`, `creditPrice = $15/t`,
`jcmSplit = 60`:
- `tonnesH2 = 100·1e6 = 100,000,000 kg` (= 100 kt).
- `actualCO2 = 1e8·1.0 = 1e8 kg`; `greyBaselineCO2 = 1e8·10 = 1e9 kg`.
- `creditsGross = (1e9 − 1e8)/1e6 = 9e8/1e6 = 900 MtCO₂e`… note units: kg÷1e6 = kt, so **900 ktCO₂e** = 0.9
  MtCO₂e avoided (the ÷1e6 converts kg→kt, labelled Mt in code — a unit-label subtlety to verify).
- `creditsIndia = 0.9·0.60 = 0.54`, `creditsJapan = 0.9·0.40 = 0.36`.
- `revenue = 0.9·15·1e6 = $13.5M` (credits × price × 1e6 to restore tonnes).

The avoided-emissions logic (grey baseline − actual, split by Article-6 share) is methodologically sound;
the unit-scaling (kg→kt vs Mt labelling) should be checked against the displayed KPI unit.

### 7.5 Data provenance & limitations

- Hydrogen GHG/LCOH/RFNBO rest on the **real engine**; ammonia, credit and SIGHT layers are **frontend
  formulas over seeded `DEVELOPERS`/`COST_CURVE_*` data** (`sr(seed)=frac(sin(seed+1)·10⁴)`).
- The carbon-credit baseline is a single grey-SMR figure, not a project-specific, additionality-tested
  baseline — real Article-6 crediting requires a validated baseline and corresponding adjustment.
- No leakage, permanence, or buffer treatment on the credits; Article-6 split is a slider, not a treaty term.

**Framework alignment:** EU RFNBO 2023/1184-85 + ISO 14040/44 (H2 layer, via engine); Ammonia Energy
Association / IRENA electrofuels (green-NH₃ cost & carbon intensity); IMO MEPC 80 2023 GHG strategy (GFI
well-to-wake fuel-intensity compliance); Paris Article 6.2 ITMOs and the Japan-Crediting-Mechanism (the
India/Japan credit split); India SIGHT incentive (Green Hydrogen Mission). The avoided-emissions credit
uses a baseline-minus-actual method consistent with Article-6/CDM logic, simplified.

## 8 · Model Specification — Article-6 Green-H2/NH₃ Avoided-Emissions Crediting Model

**Status: specification — not yet implemented in code.** The credit engine here uses a fixed grey baseline;
a bankable Article-6 model needs validated baselines and corresponding adjustments.

### 8.1 Purpose & scope
Quantify issuable, corresponding-adjusted carbon credits (ITMOs) from green-H2/NH₃ displacing grey
production, for bilateral Article-6.2 transfers (e.g. India→Japan) — the volume, price and revenue an
offtake/credit deal can bank.

### 8.2 Conceptual approach
Baseline-and-crediting per **Article 6.4 / CDM methodology** and the **IMO/IRENA well-to-wake accounting**,
benchmarked against Gold Standard / Verra industrial-fuel-switch methodologies: a project-specific,
additionality-tested baseline, monitored actual emissions, leakage, and a corresponding adjustment so the
host country does not also count the reduction.

### 8.3 Mathematical specification
```
Baseline_t   = Production_t · EF_baseline(displaced grey/blue, well-to-wake)     tCO₂e
Actual_t     = Production_t · EF_project(monitored, incl. grid/RE mix)           tCO₂e
Leakage_t    = upstream/indirect emissions not in project boundary
ER_t (emission reductions) = Baseline_t − Actual_t − Leakage_t
Issued_t     = ER_t · (1 − buffer%)                    (permanence buffer if applicable)
ITMO_host    = Issued_t · (1 − corresponding_adj%)      (adjustment retained by host)
ITMO_transfer = Issued_t · adj_share                    (bilateral split, e.g. India/Japan)
Revenue      = ITMO_transfer · Price_ITMO
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `EF_baseline` | displaced-fuel intensity | IEA well-to-wake; grey SMR ~10 kgCO₂/kgH2 |
| `EF_project` | monitored actual | facility RFNBO GHG (engine) |
| `Leakage` | indirect emissions | methodology default (CDM/Verra) |
| buffer% | non-permanence pool | Article 6.4 rules (if applicable) |
| corresponding_adj% | host retention | bilateral Article-6.2 agreement |
| `Price_ITMO` | credit price | JCM/voluntary market |

### 8.4 Data requirements
Production volumes, monitored project emissions (from RFNBO GHG accounting), baseline determination, host-
country adjustment terms, ITMO price. Sources: engine GHG output (present), Article-6 methodology and
bilateral agreement (external), price benchmarks. The module holds production sliders and a grey baseline;
additionality/leakage/adjustment are absent.

### 8.5 Validation & benchmarking plan
Reconcile ER against an approved Article-6.4/CDM methodology worked example; validate baseline against
grey/blue counterfactual; sensitivity to grid EF and displaced-fuel choice; check corresponding-adjustment
accounting sums to zero double-counting.

### 8.6 Limitations & model risk
Baseline and additionality determine credibility — a fixed grey baseline overstates credits where blue H2
is the realistic counterfactual. Corresponding adjustments and buffer pools materially reduce transferable
volume. Conservative fallback: credit against the *lower* of grey- and blue-baseline, apply a leakage
discount, and treat pre-issuance volumes as indicative only.

## 9 · Future Evolution

### 9.1 Evolution A — Extend the real engine to the ammonia and fuel layers (analytics ladder: rung 2 → 3)

**What.** §7 documents a split: the hydrogen GHG/LCOH/RFNBO layer rests on the same real `green_hydrogen_engine.py` (authoritative EU-law/IEA/ISO constants), but the ammonia, carbon-credit, and SIGHT layers are frontend formulas over `sr()`-seeded `DEVELOPERS`/`COST_CURVE` data. The ammonia cost model itself (`LCOP_NH3 = LCOH/0.178 + Haber-Bosch_CAPEX×CRF/output + OPEX`) is a real formula. Evolution A extends the trustworthy engine to the ammonia and fuel-comparison layers: compute LCOP_NH3 server-side from the engine's LCOH plus electrified Haber-Bosch capex/opex, and ground the IMO-2023 GHG-fuel-mix comparison in real fuel carbon intensities — so the ammonia and shipping-fuel economics inherit the hydrogen engine's rigour instead of sitting on seeded developer data.

**How.** (1) Add an ammonia method to the engine: `LCOP_NH3` from the engine LCOH (17.6 wt% H₂ → /0.178), Haber-Bosch capex ($400–800/tNH3/yr) × CRF, and opex, with carbon intensity 0.0 vs grey 1.6 tCO₂e/t. (2) The IMO GHG-fuel-mix comparison over real fuel carbon intensities. (3) Replace the seeded `DEVELOPERS`/`COST_CURVE` with engine-computed or sourced project economics; the carbon-credit layer computed from real intensities.

**Prerequisites.** Haber-Bosch capex/opex benchmarks; IMO fuel carbon-intensity data; the seeded developer/cost-curve data replaced (§7-flagged). **Acceptance:** LCOP_NH3 recomputes from the engine LCOH reproducing §5; the IMO fuel comparison uses real intensities; no `sr()` value drives the ammonia or fuel figures.

### 9.2 Evolution B — Carbon-neutral-fuels copilot (LLM tier 2)

**What.** A copilot for shipping and fuel-transition analysts: "what's the LCOP of green ammonia at $3/kg green H₂, and how does it compare to e-methanol under IMO 2023 GHG targets?" tool-calls the Evolution A ammonia/fuel endpoints (built on the real hydrogen engine) and narrates the cost and carbon-intensity comparison.

**How.** Tier-2 tool-calling over the hydrogen engine plus the new ammonia/fuel methods; the grounding corpus is §5/§7, which encode the ammonia cost model, electrified Haber-Bosch economics, and IMO 2023 targets. The copilot's value is fuel-pathway comparison grounded in the engine's real hydrogen LCOH. Guardrail, pre-Evolution-A: the ammonia/credit layers are seeded, so it must anchor answers on the trustworthy hydrogen engine and refuse ammonia-cost figures until Evolution A. Every figure validated against tool output.

**Prerequisites.** Evolution A (ammonia/fuel layers seeded today); corpus embedding. **Acceptance:** post-Evolution-A, every LCOP and fuel-comparison figure traces to an engine tool call; pre-Evolution-A the copilot answers hydrogen questions from the real engine and declines ammonia-cost claims.