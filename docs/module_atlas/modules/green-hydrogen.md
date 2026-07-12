# Green Hydrogen Analytics
**Module ID:** `green-hydrogen` · **Route:** `/green-hydrogen` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Green hydrogen production economics, carbon footprint, supply chain assessment, and investment case analysis. Covers electrolyser technologies, renewable integration, and cost parity timeline.

> **Business value:** Green hydrogen is critical for decarbonising hard-to-abate sectors (steel, ammonia, aviation, shipping). EU, US, and Japan have multi-billion hydrogen strategies. Cost trajectories and policy support determine investment viability — this module provides the economic and carbon analysis needed for investment and offtake decisions.

**How an analyst works this module:**
- Production Economics shows LCOH breakdown by cost component
- Technology Comparison rates PEM, Alkaline, SOEC electrolysers
- Carbon Intensity Calculator computes gCO2/MJ for regulatory compliance
- Cost Parity Timeline shows when green H2 undercuts grey H2
- Supply Chain Map shows electrolyser manufacturing and raw material inputs

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `COUNTRY_CODE_TO_NAME`, `COUNTRY_OPTIONS`, `ELECTROLYSER_OPTIONS`, `ELECTROLYSER_TO_ENGINE`, `ELEC_SOURCE_OPTIONS`, `ELEC_SOURCE_TO_ENGINE`, `GH_API`, `GRID_EF`, `KpiCard`, `LiveBadge`, `Row`, `Section`, `Sel`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ELECTROLYSER_OPTIONS` | 5 | `label` |
| `COUNTRY_OPTIONS` | 11 | `label` |
| `ELEC_SOURCE_OPTIONS` | 6 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `GH_API` | ``${API}/api/v1/green-hydrogen`;` |
| `sourceEf` | `{ grid: gridEf, ppa_wind: 12 + r(1) * 8, ppa_solar: 22 + r(2) * 10, dedicated_re: 15 + r(3) * 10, nuclear: 5 + r(4) * 5 };` |
| `kwhPerKgH2` | `33.3 / efficiency;` |
| `ghgIntensity` | `parseFloat((ef * kwhPerKgH2 / 1000 + r(5) * 0.3).toFixed(2));` |
| `countryComparison` | `COUNTRY_OPTIONS.map((c, i) => ({` |
| `capex` | `Math.round(capexBase * (0.85 + r(20) * 0.3));` |
| `capacityFactor` | `parseFloat(({ ppa_wind: 0.38 + r(21) * 0.12, ppa_solar: 0.22 + r(22) * 0.10, dedicated_re: 0.30 + r(23) * 0.15, nuclear: 0.88 + r(24) * 0.05, grid: 0.85 + r(25) * 0.05 }[elecSource] \|\| 0.50).toFixed(2));` |
| `stackLifetime` | `Math.round({ pem: 80000, alk: 100000, soec: 50000, aem: 60000 }[electrolyser] * (0.9 + r(26) * 0.2));` |
| `lcoh` | `parseFloat(lcohComponents.reduce((s, c) => s + c.value, 0).toFixed(2));` |
| `countryData` | `COUNTRY_OPTIONS.map((c, i) => ({` |
| `eu2030Target` | `10000; // Mt` |
| `euCurrent` | `Math.round(eu2030Target * (0.03 + r(40) * 0.08));` |
| `domesticShare` | `Math.round(r(41) * 30 + 20);` |
| `strikePrice` | `parseFloat((2.5 + r(50) * 2).toFixed(2));` |
| `supportDuration` | `Math.round(r(51) * 5 + 10);` |
| `certifications` | `(cert.recognised_eu_certs \|\| []).map((name) => ({` |
| `seed0` | `hashStr(electrolyser + country + elecSource);` |
| `pct` | `parseFloat(((c.current / c.target) * 100).toFixed(1));` |

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
**Frontend seed datasets:** `COUNTRY_OPTIONS`, `ELECTROLYSER_OPTIONS`, `ELEC_SOURCE_OPTIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| LCOH (current) | — | IEA/IRENA | Current green hydrogen production cost range |
| LCOH (2030 target) | — | Hydrogen Council | Cost target for grid competitiveness |
| Electrolyser Efficiency | — | Technology | kWh electricity per kg H2 produced |
| EU Taxonomy Threshold | — | EU Delegated Act | Renewable fuels of non-biological origin threshold |
- **Electrolyser specs** → LCOH calculation → **Production cost per kg H2**
- **Grid electricity mix** → Carbon intensity calculation → **GHG footprint per kgH2**
- **Cost trajectories** → Parity analysis → **Green vs grey H2 crossover year**

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
**Methodology:** Green H2 levelised cost model
**Headline formula:** `LCOH = (CapEx + OpEx) / H2_produced; GHG = Electricity_GHG / Conversion_efficiency`

LCOH drivers: electrolyser cost ($/kW), capacity factor, electricity price (biggest driver), stack lifetime, efficiency. Green H2 requires <1kgCO2/kgH2 to qualify under EU taxonomy. Grey H2 (SMR) = 10-12kgCO2/kgH2.

**Standards:** ['IEA Global Hydrogen Review', 'Hydrogen Council', 'IRENA Green Hydrogen']
**Reference documents:** IEA Global Hydrogen Review 2024; Hydrogen Council Hydrogen Insights; IRENA Green Hydrogen Cost Reduction; EU Renewable Fuels of Non-Biological Origin (RFNBO) Delegated Act

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
| `green-hydrogen-ammonia-carbon` | engine:green_hydrogen_engine, table:exc, table:facility |
| `blended-finance-structuring` | table:exc |
| `supply-chain-esg-hub` | table:exc |
| `carbon-accounting-ai` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `adaptation-finance` | table:exc |
| `modern-slavery-intel` | table:exc |
| `supply-chain-resilience` | table:exc |

## 7 · Methodology Deep Dive

This is a **tier-A module** backed by a genuinely rigorous engine, `green_hydrogen_engine.py`, which
implements EU RFNBO law (Delegated Regs 2023/1184 + 2023/1185), IEA LCOH methodology, and ISO 14040/44
GHG-intensity accounting. The frontend `GreenHydrogenPage` can call the engine (`POST /api/v1/green-
hydrogen/assess | /lcoh | /rfnbo-compliance`) but **also runs its own client-side approximations that add
seeded noise** — e.g. `ghgIntensity = ef·kwhPerKgH2/1000 + r(5)·0.3`. Sections below document both the
authoritative engine and the lighter frontend path, and flag where the frontend diverges from the engine.

### 7.1 What the module computes

**Backend engine (authoritative):**
```
GHG intensity (well-to-gate, ISO 14040/44):
  total_ghg = kwh_per_kgH2 · electricity_EF + water_treatment(0.05) + compression(0.15)   kgCO₂/kgH2
  below_threshold = total_ghg < 3.38    (RFNBO threshold, 70% cut vs 94 gCO₂/MJ fossil comparator)
LCOH (IEA):
  CRF = r / (1 − (1+r)^−n)
  annual_H2_kg = capacity_MW·1000·CF·8760 · efficiency_LHV / 33.33
  LCOH = (CAPEX·CRF + CAPEX·opex% + stack_annual)/annual_H2 + (annual_kWh/1000·elec_price)/annual_H2
RFNBO compliance: 4 criteria (GHG, additionality, temporal, geographical), each scored 0–1,
  composite = mean of 4; rfnbo_eligible = ALL four compliant.
```
**Frontend (this page):** approximates `kwhPerKgH2 = 33.3/efficiency`, `ghgIntensity = ef·kwhPerKgH2/1000
+ r(5)·0.3`, an LCOH-component reduction, a country-comparison, and a CfD strike/duration view — several
of these use the seeded `r()`/`hashStr()` PRNG rather than the engine.

### 7.2 Parameterisation (engine constants — authoritative)

| Constant | Value | Provenance |
|---|---|---|
| RFNBO GHG threshold | 3.38 kgCO₂/kgH2 | EU 2023/1184 Art. 3 (70% cut vs 94 gCO₂/MJ) |
| Water treatment / compression | 0.05 / 0.15 kgCO₂/kgH2 | engine constants (well-to-gate scope) |
| H2 LHV / HHV | 33.33 / 39.39 kWh/kg; 120 MJ/kg | physical constants |
| Electrolyser kWh/kgH2 | PEM 55, ALK 60, SOEC 45, AEM 58 | IEA / manufacturer benchmarks |
| Electrolyser CAPEX 2024 | PEM 900–1500, ALK 600–1000, SOEC 2000–4000 $/kW | IEA Global Hydrogen Review 2023 |
| Grid EFs | e.g. Germany 0.38, France 0.06, Norway 0.02, Poland 0.72 kgCO₂/kWh | national grid data (20 countries) |
| Dedicated-RE EFs | wind 0.009, solar PV 0.025, nuclear 0.012, biomass 0.230 (RFNBO-excluded) | ISO 14040/44 lifecycle |
| Additionality 36-month rule; ≥90% RE-grid; hourly matching from 2030 | — | EU 2023/1185 Arts. 4–6 |
| IEA cost trajectory | 2024 $3–6, 2030 $2–4, 2050 $1–2 /kgH2 | IEA Global Hydrogen Review |

Frontend `r()`/`hashStr()` noise terms are **synthetic** overlays on these real anchors.

### 7.3 Calculation walkthrough (engine)

Facility inputs → `_get_electricity_ef` resolves the EF (grid vs dedicated RE, per country) → GHG intensity
→ C1 (GHG) score; `_assess_additionality/temporal/geographical` score C2–C4 against the Delegated-Reg
routes → composite + `rfnbo_eligible`. In parallel `calculate_lcoh` builds the four LCOH components. The
facility rating (A–D) is cut on the composite score (A ≥ 0.90, B ≥ 0.70, C ≥ 0.50, else D). CfD indicative
support = `clip(LCOH_eur − ng_parity(2.5), 0, max_support 4.0)`.

### 7.4 Worked example (engine, PEM in Germany on grid)

PEM, Germany grid (EF 0.38), CF 0.45, CAPEX mid = (900+1500)/2 = $1200/kW, r 8%, n 20, elec $45/MWh,
100 MW:
- `kwh_per_kgH2 = 55`; `ghg_electrolysis = 55·0.38 = 20.9`; `+0.05+0.15 = 21.1 kgCO₂/kgH2` → far above
  3.38 → **C1 fails** (grid-powered PEM in Germany is not RFNBO-eligible — correct).
- `CRF = 0.08/(1−1.08^−20) = 0.08/0.7855 = 0.1019`.
- `annual_H2 = 100·1000·0.45·8760·0.65/33.33 = 394,200,000·0.65/33.33 ≈ 7.69M kg`.
- `LCOH_capex = (1200·100·1000·0.1019)/7.69e6 = (120,000,000·0.1019)/7.69e6 = 12.23M/7.69M ≈ $1.59/kg`.
- `LCOH_elec = (100·1000·0.45·8760/1000·45)/7.69e6 = (394,200·45)/7.69e6 = 17.74M/7.69M ≈ $2.31/kg`.
- With opex + stack, `LCOH_total ≈ $4.2–4.5/kg` — squarely in the IEA 2024 $3–6 band. Electricity is the
  largest single component (~50%), matching the guide's "biggest driver" claim.

### 7.5 Data provenance & limitations

- **Engine constants are real and authoritative** (EU law, IEA, ISO); this is one of the platform's
  best-grounded modules.
- **The frontend adds seeded `r()`/`hashStr()` noise** to GHG intensity, capacity factor, stack lifetime
  and CfD terms — so the on-page numbers can drift from the deterministic engine output. A production
  build should render engine results directly, not the noisy client approximation.
- Well-to-gate scope only (excludes transport/storage/end-use); single-EF marginal-electricity method, not
  full hourly counterfactual.

**Framework alignment:** EU RFNBO Delegated Regulations 2023/1184 (GHG, 3.38 threshold) + 2023/1185
(additionality 36-mo, temporal hourly-from-2030, geographical bidding-zone) — implemented criterion by
criterion; ISO 14040/44 lifecycle GHG; IEA Global Hydrogen Review (LCOH + cost trajectory); EU H2 Bank /
H2 CfD (strike-vs-market support). EU Taxonomy RFNBO threshold (<3.38) is the eligibility gate.

*(No §8 model specification required — the production model is implemented in `green_hydrogen_engine.py`.
The only remediation is to remove the frontend's seeded-noise overlay and display engine output directly.)*

## 9 · Future Evolution

### 9.1 Evolution A — Make the deterministic engine authoritative on-page and add live electricity prices (analytics ladder: rung 3 → 4)

**What.** §7 rates this one of the platform's best-grounded modules: `green_hydrogen_engine.py` computes well-to-gate GHG intensity per ISO 14040/14044, RFNBO additionality scoring per EU 2023/1185 Art 4, and LCOH from real electrolyser/electricity/efficiency parameters, with engine constants that are real and authoritative (EU law, IEA, ISO). Its one flagged defect: the frontend adds seeded `r()`/`hashStr()` noise to GHG intensity, capacity factor, stack lifetime, and CfD terms, so on-page numbers can drift from the deterministic engine output. Evolution A removes that noise (the page must render engine output, not perturbed values), then deepens toward predictive: wire live/regional electricity prices — the dominant LCOH driver — so LCOH reflects actual power markets rather than a static input, and add a cost-parity-timeline projection from an electrolyser-cost learning curve.

**How.** (1) Delete the frontend `r()`/`hashStr()` noise; call the engine for every displayed GHG/LCOH/CF figure. (2) Wire regional electricity prices (EIA/ENTSO-E, already integrated in wave-1) into the LCOH input, with the RFNBO additionality/temporal-correlation checks the engine already implements. (3) A learning-curve-driven LCOH-vs-time projection for the cost-parity timeline.

**Prerequisites.** The seeded frontend noise removed (§7-flagged drift); regional electricity-price feeds. **Acceptance:** on-page GHG/LCOH figures equal the engine output exactly (no drift); LCOH responds to live regional electricity prices; the cost-parity timeline derives from a learning rate, not a static curve.

### 9.2 Evolution B — Hydrogen project and RFNBO-compliance copilot (LLM tier 2)

**What.** A copilot for hydrogen developers and offtakers: "what's the GHG intensity and LCOH for a 100 MW PEM electrolyser on Spanish grid vs dedicated solar PPA, and does it qualify as RFNBO?" tool-calls the engine's GHG, LCOH, and additionality endpoints and narrates EU-taxonomy qualification (<1 kgCO₂/kgH₂ vs grey 10–12).

**How.** Tier-2 tool-calling over the engine's operations (the module is tier-A with a real, authoritative engine — a strong tier-2 candidate now); the grounding corpus is §5/§7, which encode the ISO LCA approach, RFNBO Art-4 additionality, and the EU taxonomy threshold. The copilot's value is RFNBO-compliance reasoning — whether a project's electricity sourcing meets additionality/temporal/geographic correlation. Every GHG and LCOH figure validated against engine output.

**Prerequisites.** Evolution A's noise removal (the copilot must narrate engine output, not perturbed page values); prompt-caching. **Acceptance:** every GHG/LCOH/additionality figure traces to an engine tool call; the RFNBO verdict matches the engine's compliance flag; the copilot cites the EU-taxonomy threshold correctly.