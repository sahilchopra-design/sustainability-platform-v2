# Green Hydrogen Economics
**Module ID:** `green-hydrogen-economics` · **Route:** `/green-hydrogen-economics` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Card`, `DEMAND_SECTORS`, `KpiCard`, `PROJECTS`, `TABS`, `TECHNOLOGIES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TECHNOLOGIES` | 7 | `name`, `capex`, `opex`, `eff`, `maturity`, `color` |
| `DEMAND_SECTORS` | 9 | `demandMt`, `willingness`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt0` | `v => Number(v).toLocaleString('en-GB', { maximumFractionDigits:0 });` |
| `tech` | `TECHNOLOGIES[Math.floor(sr(i*7)*4)]; // green only (0-3)` |
| `region` | `['Europe','North America','Asia-Pacific','Middle East','Australia','LatAm'][Math.floor(sr(i*11)*6)];` |
| `capacity` | `Math.round(50 + sr(i*13)*950); // MW electrolyser` |
| `elecCost` | `Math.round(20 + sr(i*17)*80);  // $/MWh` |
| `capFactor` | `0.30 + sr(i*19)*0.50;          // CF` |
| `fcr` | `0.08; // fixed charge rate` |
| `annCapex` | `tech.capex * capFactor * 8760 / 1000; // $k/kg roughly — simplified per-kW` |
| `lcoh` | `(tech.capex * fcr) / (8760 * capFactor * tech.eff) * 3.6` |
| `lcohAdj` | `Math.max(1.5, Math.round(lcoh * 10 + sr(i*23)*15) / 10);` |
| `h2Output` | `capacity * 8760 * capFactor * tech.eff / 33.3 / 1000; // t/yr` |
| `capex` | `capacity * tech.capex / 1000; // $M` |
| `co2Avoided` | `h2Output * 9.3; // tCO₂/t H₂ vs grey` |
| `REGIONS` | `['Europe','North America','Asia-Pacific','Middle East','Australia','LatAm'];` |
| `eff` | `calcEff / 100;` |
| `lcohBreakdown` | `useMemo(() => { const fcr = 0.08; const cf = calcCf/100; const eff = calcEff/100;` |
| `techComparison` | `useMemo(() => TECHNOLOGIES.map(t => {` |
| `learningCurve` | `useMemo(() => Array.from({length:6},(_,i)=>({ year: (2025+i*5).toString(), pem:  +(5.0 - i*0.5 + (calcElec-50)*0.02).toFixed(2), alk:  +(4.2 - i*0.4 + (calcElec-50)*0.02).toFixed(2), blue: +(2.5 - i*0.2).toFixed(2), grey: +(1.5 + i*0.05).toFixed(2), // fossil prices rise })), [calcElec]);` |
| `gap` | `Math.max(0, calcLcoh - d.willingness);` |
| `cases` | `{ Steel:'DRI steelmaking', Ammonia:'Haber-Bosch replacement', Refining:'Desulphurisation', 'HGV Transport':'Fuel cell trucks', Shipping:'Ammonia / LOHC', 'Aviation (SAF)':'E-fuel synthesis', 'Power Grid':'Long-duration s` |

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
**Frontend seed datasets:** `DEMAND_SECTORS`, `REGIONS`, `TABS`, `TECHNOLOGIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

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
| `green-hydrogen-ammonia-carbon` | engine:green_hydrogen_engine, table:exc, table:facility |
| `green-hydrogen` | engine:green_hydrogen_engine, table:exc, table:facility |
| `blended-finance-structuring` | table:exc |
| `supply-chain-esg-hub` | table:exc |
| `carbon-accounting-ai` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `adaptation-finance` | table:exc |
| `modern-slavery-intel` | table:exc |
| `supply-chain-resilience` | table:exc |
**Shared UI wrappers:** `CleanTechAdvancedAnalytics`

## 7 · Methodology Deep Dive

> ⚠️ **Engine-available-but-not-used flag.** This route is **tier-A** and a rigorous LCOH engine exists
> (`green_hydrogen_engine.calculate_lcoh`, IEA methodology with CRF, stack replacement and real
> electrolyser benchmarks). **The page does not call it for its headline LCOH** — it computes a
> *simplified client-side* LCOH and then perturbs it with seeded noise:
> `lcohAdj = max(1.5, round(lcoh·10 + sr(i·23)·15)/10)`. So the displayed project-level LCOH is a
> reduced-form approximation plus PRNG jitter, not the engine's deterministic output. Sections below
> document the frontend maths; the production model already lives in the engine (no §8 needed).

### 7.1 What the module computes

Per synthetic green-H2 project (4 green technologies, 6 regions):
```js
capFactor = 0.30 + sr·0.50                              // 30–80%
fcr       = 0.08                                        // fixed charge rate (annualised CAPEX)
lcoh      = (tech.capex · fcr) / (8760 · capFactor · tech.eff) · 3.6     // $/kgH2 (simplified)
lcohAdj   = max(1.5, round(lcoh·10 + sr(i·23)·15)/10)   // seeded-jittered display value
h2Output  = capacity · 8760 · capFactor · tech.eff / 33.3 / 1000         // t/yr
capex     = capacity · tech.capex / 1000                // $M
co2Avoided = h2Output · 9.3                             // tCO₂/t H2 vs grey
```
An interactive LCOH breakdown (`lcohBreakdown`, sliders `calcElec`, `calcCf`, `calcEff`), a technology
comparison, a learning curve to 2050, and a demand-sector "willingness-to-pay gap" (`gap = max(0,
calcLcoh − willingness)`) round out the page.

### 7.2 Parameterisation / provenance

| Element | Value | Provenance |
|---|---|---|
| `TECHNOLOGIES` capex/opex/eff | 7 rows (4 green used) | anchors consistent with IEA; project draw synthetic |
| Fixed charge rate | 0.08 | code constant (≈ WACC-based annuity proxy) |
| H2 LHV | 33.3 kWh/kg | physical constant |
| CO₂ avoided factor | 9.3 tCO₂/t H2 | grey-SMR displacement (~9–10 kg/kg) |
| `capFactor` | `0.30 + sr·0.50` | synthetic |
| `elecCost` | `20 + sr·80` $/MWh | synthetic |
| `lcohAdj` jitter | `+ sr(i·23)·15/10` | **synthetic noise** on the LCOH |
| Learning curve | `pem = 5.0 − i·0.5 + (elec−50)·0.02` | illustrative linear decline |

### 7.3 Calculation walkthrough

Seed projects → per project compute `lcoh` from the simplified `capex·fcr/(hours·CF·eff)·3.6` form (note:
this captures only the CAPEX contribution scaled by a 3.6 unit factor — it omits the explicit electricity
term the engine includes, so `elecCost` is generated but not additively summed into `lcoh`) → `lcohAdj`
adds noise → `h2Output`, `capex`, `co2Avoided`. The interactive `lcohBreakdown` recomputes from the three
sliders. `techComparison` maps over technologies; `gap` measures each sector's LCOH-vs-willingness shortfall.

### 7.4 Worked example

`tech.capex = $1000/kW`, `tech.eff = 0.65`, `capFactor = 0.50`, `fcr = 0.08`:
`lcoh = (1000·0.08)/(8760·0.50·0.65)·3.6 = 80/(2847)·3.6 = 0.0281·3.6 = $0.101/kg`?? — the raw form yields
an implausibly low value, which is why the code floors and jitters it: `lcohAdj = max(1.5, round(0.101·10 +
sr·15)/10) = max(1.5, …) = $1.5/kg` (the floor binds). This exposes that the simplified LCOH is not
dimensionally faithful to the engine's; the `max(1.5, …)` floor and jitter mask it. The **engine**, by
contrast, would return ~$4/kg for a comparable grid/PPA project (see `green-hydrogen` §7.4) because it adds
the electricity component explicitly.

### 7.5 Data provenance & limitations

- Projects are **synthetic**, seeded by `sr(seed)=frac(sin(seed+1)·10⁴)`.
- The page's LCOH is a **reduced-form approximation with a hard floor and seeded jitter**, and omits the
  electricity term that dominates real LCOH — so it should not be used for decisions; the engine's
  `calculate_lcoh` is the correct source.
- CO₂-avoided uses a single grey factor; no scenario/technology variation in the credit.

**Framework alignment:** IEA Global Hydrogen Review (LCOH structure, cost trajectory), IRENA green-hydrogen
cost reduction, Hydrogen Council pathway — all better realised in the backend engine than on this page. EU
Taxonomy RFNBO threshold and grey-H2 displacement (9.3 tCO₂/t) frame the CO₂-avoided metric.

*(No §8 model specification: the production LCOH model is implemented in `green_hydrogen_engine.py`
(`calculate_lcoh`, CRF + four cost components + IEA CAPEX trajectory). Remediation is to wire this page to
the engine and drop the simplified `lcoh`/`lcohAdj` client formula and its floor/jitter.)*

## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to the real LCOH engine and drop the seeded jitter (analytics ladder: rung 2 → 3)

**What.** §7 documents a wiring gap: a real backend `green_hydrogen_engine.py` implements `calculate_lcoh` (CRF + four cost components + IEA CAPEX trajectory) plus ISO GHG intensity and RFNBO additionality, but this page renders synthetic `sr()`-seeded projects and computes LCOH as a reduced-form approximation with a hard floor and seeded jitter — so on-page numbers omit real cost components and drift from the authoritative engine. §7 explicitly names the remediation: wire the page to the engine and drop the simplified `lcoh`/`lcohAdj` client formula. Evolution A does exactly that, and grounds the project panel in real electrolyser-project data so the demand-sector and technology comparisons reflect actual economics.

**How.** (1) Replace the client `lcoh`/`lcohAdj` formula and its floor/jitter with calls to the engine's `calculate_lcoh`, so every displayed LCOH is the deterministic engine output. (2) Source the `PROJECTS` panel from a real electrolyser-project database or make it user-editable, replacing the seeded rows. (3) The technology comparison (4 green electrolysers × 6 regions) uses engine-computed LCOH with regional electricity prices.

**Prerequisites.** The engine's `calculate_lcoh` exposed as an endpoint; the seeded `sr()` projects and the floor/jitter removed (§7-flagged drift). **Acceptance:** every on-page LCOH equals the engine output (no floor/jitter); the four cost components are reflected; no `sr()` value drives a displayed LCOH.

### 9.2 Evolution B — Hydrogen-economics copilot (LLM tier 2)

**What.** A copilot for hydrogen investors: "compare PEM vs alkaline LCOH across 6 regions at their local electricity prices, and which demand sectors reach cost parity first?" tool-calls the engine's LCOH endpoint across technologies/regions and narrates the cost-parity timeline and demand-sector economics.

**How.** Tier-2 tool-calling over the real engine (the module is tier-A — a strong candidate once Evolution A wires the page); the grounding corpus is §5/§7, which encode the CRF LCOH model, the IEA CAPEX trajectory, and the electricity-cost dominance. The copilot's value is cross-technology/region LCOH comparison and parity timing. Guardrail, pre-Evolution-A: the page's LCOH has seeded jitter, so the copilot must call the engine directly rather than narrate page state. Every LCOH figure validated against engine output.

**Prerequisites.** Evolution A wiring (the copilot must use engine output, not the jittered page); prompt-caching. **Acceptance:** every LCOH figure traces to an engine tool call; the region/technology comparison uses engine LCOH; the copilot never quotes the floored/jittered client value.