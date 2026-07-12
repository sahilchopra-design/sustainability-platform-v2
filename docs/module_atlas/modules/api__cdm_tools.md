# Api::Cdm_Tools
**Module ID:** `api::cdm_tools` · **Route:** `/api/v1/cdm-tools` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/cdm-tools/` | `list_tools` | api/v1/routes/cdm_tools.py |
| GET | `/api/v1/cdm-tools/categories` | `list_tool_categories` | api/v1/routes/cdm_tools.py |
| GET | `/api/v1/cdm-tools/for-methodology/{methodology_code}` | `tools_for_methodology` | api/v1/routes/cdm_tools.py |
| GET | `/api/v1/cdm-tools/{tool_code}` | `get_tool` | api/v1/routes/cdm_tools.py |
| GET | `/api/v1/cdm-tools/{tool_code}/defaults` | `get_tool_defaults` | api/v1/routes/cdm_tools.py |
| POST | `/api/v1/cdm-tools/{tool_code}/calculate` | `calculate_tool` | api/v1/routes/cdm_tools.py |
| POST | `/api/v1/cdm-tools/batch` | `batch_calculate` | api/v1/routes/cdm_tools.py |
| POST | `/api/v1/cdm-tools/chain/{methodology_code}` | `chain_calculate` | api/v1/routes/cdm_tools.py |
| GET | `/api/v1/cdm-tools/activities` | `list_activities` | api/v1/routes/cdm_tools.py |
| GET | `/api/v1/cdm-tools/activities/for-user/{user_type}` | `activities_for_user` | api/v1/routes/cdm_tools.py |
| GET | `/api/v1/cdm-tools/activities/search` | `search_activities_endpoint` | api/v1/routes/cdm_tools.py |
| GET | `/api/v1/cdm-tools/activities/{activity_id}` | `get_activity` | api/v1/routes/cdm_tools.py |
| GET | `/api/v1/cdm-tools/activities/{activity_id}/inputs` | `get_activity_inputs` | api/v1/routes/cdm_tools.py |

### 2.3 Engine `activity_guide_catalog` (services/activity_guide_catalog.py)
| Function | Args | Purpose |
|---|---|---|
| `get_all_activities` |  | Return all activities in the catalog. |
| `get_activities_by_sector` | sector | Return activities filtered by sector name (case-insensitive). |
| `get_activities_by_user_type` | user_type | Return activities where the given user type is listed. |
| `get_activities_for_methodology` | methodology_code | Return activities that reference the given methodology code. |
| `get_activity_detail` | activity_id | Return a single activity by its ID, or None if not found. |
| `search_activities` | query | Full-text search across activity name, description, sector, and user types. |
| `get_activities_by_value_chain` | position | Return activities by value chain position (upstream / core / downstream). |
| `get_activities_by_scale` | scale | Return activities filtered by scale (Micro / Small / Large). |

### 2.3 Engine `cdm_tools_engine` (services/cdm_tools_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `calculate_tool01` | inputs | TOOL01 -- Demonstration and assessment of additionality. Performs a combined barrier + investment analysis. Returns a boolean additionality verdict together with barrier scores and an indicative IRR comparison against a user-supplied benchmark. |
| `calculate_tool02` | inputs | TOOL02 -- Combined tool to identify baseline scenario and demonstrate additionality. Evaluates multiple baseline alternatives, ranks them by total score, selects the most plausible baseline, then runs additionality logic identical to TOOL01 on the project vs. selected baseline. |
| `calculate_tool03` | inputs | TOOL03 -- CO2 emissions from fossil fuel combustion. Formula: PE_FF = SUM[ FC_i (tonnes) * NCV_i (GJ/t) * EF_CO2_i (kg CO2/GJ) ] / 1000 Uses IPCC default emission factors imported from carbon_calculator_v2. |
| `calculate_tool04` | inputs | TOOL04 -- Emissions from solid waste disposal sites (First Order Decay). BE_CH4 = SUM[ W_x * DOC_x * DOCf * F * (16/12) * (1-OX) * MCF ] Result converted to tCO2e via GWP_CH4. |
| `calculate_tool05` | inputs | TOOL05 -- Emissions from electricity consumption. PE_elec = EC (MWh) * EF_grid (tCO2/MWh). |
| `calculate_tool06` | inputs | TOOL06 -- Project emissions from flaring. PE_flare = Q (m3) * EF (tCO2/m3) * (1 - destruction_efficiency / 100). |
| `calculate_tool07` | inputs | TOOL07 -- Grid emission factor (Operating Margin / Build Margin / Combined Margin). EF_grid,CM = w_OM * EF_grid,OM + w_BM * EF_grid,BM. Uses STATIC_GRID_EF from carbon_calculator_v2 for country lookups. |
| `calculate_tool08` | inputs | TOOL08 -- Mass flow of a GHG in a gaseous stream. mass_flow (kg/hr) = volumetric_flow (m3/hr) * concentration (fraction) * MW / V_m where V_m = molar volume at STP (0.02241 m3/mol). |
| `calculate_tool09` | inputs | TOOL09 -- Baseline efficiency of thermal or electric energy generation systems. Efficiency = useful_energy_output / total_fuel_energy_input. Compares with regulatory/manufacturer benchmarks. |
| `calculate_tool10` | inputs | TOOL10 -- Remaining lifetime of equipment. RL = max(default_lifetime - age, min_remaining_years). Applies a condition-based adjustment factor. |
| `calculate_tool11` | inputs | TOOL11 -- Assessment of the validity of the original/current baseline. Checks regulatory changes, technology penetration, and fuel-price shifts to determine whether the baseline remains valid at crediting-period renewal. |
| `calculate_tool12` | inputs | TOOL12 -- Freight transport emissions. Emissions (tCO2) = distance_km * cargo_tonnes * EF (gCO2/tonne-km) / 1e6. |
| `calculate_tool13` | inputs | TOOL13 -- Composting emissions (CH4 + N2O). CH4 = mass_composted * CH4_EF; N2O = mass_composted * N2O_EF. Total CO2e = CH4 * GWP_CH4 + N2O * GWP_N2O. |
| `calculate_tool14` | inputs | TOOL14 -- Anaerobic digester emissions. Methane leakage from the digester + residual CH4 in digestate. PE_AD = biogas_produced * CH4_fraction * leakage_rate * density_CH4 * GWP_CH4 / 1000. |
| `calculate_tool15` | inputs | TOOL15 -- Upstream leakage emissions from fossil fuel use. Leakage = fuel_consumed_TJ * upstream_EF (tCO2/TJ). |
| `calculate_tool16` | inputs | TOOL16 -- Emissions from biomass. CO2 from biomass combustion is biogenic (zero under CDM). CH4 and N2O are counted: PE_biomass = mass * (CH4_EF * GWP_CH4 + N2O_EF * GWP_N2O) / 1000. |
| `calculate_tool17` | inputs | TOOL17 -- Inter-urban / long-distance cargo transport baseline. BE = cargo_tkm_baseline * EF_baseline_mode - cargo_tkm_project * EF_project_mode. |
| `calculate_tool18` | inputs | TOOL18 -- Urban/mass passenger transport baseline emissions. BE = passengers * trip_distance * EF_baseline_mode / 1e6. ER = BE - PE. |
| `calculate_tool19` | inputs | TOOL19 -- Microscale additionality. Simplified additionality for microscale projects (<= 5 MW or <= 20 GWh/yr). Passes if capacity <= threshold and technology is on the micro positive list, OR the project is in an LDC/SIDS. |
| `calculate_tool20` | inputs | TOOL20 -- Debundling assessment for small-scale CDM. A project is debundled if another registered CDM project exists within 1 km with the same technology, by the same developer, registered within the previous 2 years, AND the combined capacity exceeds the SSC threshold. |
| `calculate_tool21` | inputs | TOOL21 -- Small-scale additionality (simplified barrier + investment). For SSC projects (Type I <= 15 MW, Type II <= 60 GWh/yr savings, Type III <= 60 kt CO2e/yr). Barrier analysis uses fewer barriers; investment test uses simple cost comparison. |
| `calculate_tool22` | inputs | TOOL22 -- Leakage in biomass small-scale project activities. Leakage = biomass_diverted * fNRB * NCV * EF_CO2 / 1000. Represents biomass that would have been used elsewhere now diverted to the project. |
| `calculate_tool23` | inputs | TOOL23 -- First-of-its-kind additionality. Project is additional if the technology has not been deployed in the host country/region, OR fewer than N installations exist. |
| `calculate_tool24` | inputs | TOOL24 -- Common practice analysis. Calculates penetration rate = similar_projects / total_facilities. If penetration < threshold, the technology is NOT common practice. |
| `calculate_tool25` | inputs | TOOL25 -- Apportioning emissions between main product and co-products. Supports three allocation methods: energy, mass, and economic value. |
| `calculate_tool26` | inputs | TOOL26 -- HFC-23 accounting. HFC-23 is a by-product of HCFC-22 production. BE = HCFC22_produced * HFC23_ratio * GWP_HFC23. PE = HFC23_destroyed * GWP_HFC23 * (1 - destruction_eff). ER = BE - PE. |
| `calculate_tool27` | inputs | TOOL27 -- Investment analysis (IRR / NPV / benchmark comparison). Calculates project IRR, NPV at discount rate, and compares with benchmark. Cash flows: initial CAPEX (negative) followed by annual net revenues. |
| `calculate_tool28` | inputs | TOOL28 -- Refrigerant emissions from RAC systems. Annual leakage = charge * annual_leak_rate. End-of-life = charge * (1 - recovery_rate). Total CO2e = (leakage + EOL_annualised) * GWP_refrigerant. |
| `calculate_tool29` | inputs | TOOL29 -- Standardized baseline for energy-efficient refrigerators/AC. BE = units_sold * baseline_energy_kwh * EF_grid. PE = units_sold * project_energy_kwh * EF_grid. ER = BE - PE. |
| `calculate_tool30` | inputs | TOOL30 -- Fraction of non-renewable biomass (fNRB). fNRB = 1 - (MAI * forested_area) / total_biomass_consumption. MAI = Mean Annual Increment of woody biomass (t/ha/yr). |
| `calculate_tool31` | inputs | TOOL31 -- Standardized baseline for building energy efficiency. Baseline EUI from benchmarks; project EUI from design. ER = floor_area * (baseline_EUI - project_EUI) * EF_grid / 1000. |
| `calculate_tool32` | inputs | TOOL32 -- Positive lists of technologies. Checks whether a technology appears on the CDM Executive Board positive list. Technologies on the positive list are deemed automatically additional. |
| `calculate_tool33` | inputs | TOOL33 -- Default values for common parameters. Returns GWP values (AR5), oxidation factors, DOC defaults, methane density, standard conditions, and other IPCC common parameters. Uses GWP dict imported from carbon_calculator_v2. |
| `calculate_ar_tool02` | inputs | AR-TOOL02 -- A/R baseline scenario identification + additionality. Identifies the most plausible land-use baseline and applies barrier / investment analysis in the A/R context. |
| `calculate_ar_tool03` | inputs | AR-TOOL03 -- Number of sample plots for A/R measurements. n = (t_value * CV / allowable_error)^2. CV = coefficient of variation of biomass across preliminary plots. |
| `calculate_ar_tool08` | inputs | AR-TOOL08 -- Non-CO2 GHG from biomass burning in A/R boundary. CH4 = area_burned * fuel_load * combustion_factor * EF_CH4 / 1000. N2O = area_burned * fuel_load * combustion_factor * EF_N2O / 1000. Total CO2e = CH4 * GWP_CH4 + N2O * GWP_N2O. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `collections` *(shared)*, `fastapi` *(shared)*, `schemas` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/cdm-tools/** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total', 'tools'], 'n_keys': 2}`

**GET /api/v1/cdm-tools/activities** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total', 'activities'], 'n_keys': 2}`

**GET /api/v1/cdm-tools/activities/for-user/{user_type}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total', 'activities'], 'n_keys': 2}`

**GET /api/v1/cdm-tools/activities/search** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['query', 'total', 'activities'], 'n_keys': 3}`

**GET /api/v1/cdm-tools/activities/{activity_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/cdm-tools/activities/{activity_id}/inputs** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/cdm-tools/categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_categories', 'total_tools', 'categories'], 'n_keys': 3}`

**GET /api/v1/cdm-tools/for-methodology/{methodology_code}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `cdm_tools_engine` — extracted transformation lines:**
```python
co2_tonnes = fc_tonnes * ncv * ef_co2 / 1000.0
BE_CH4 = SUM[ W_x * DOC_x * DOCf * F * (16/12) * (1-OX) * MCF ]
ch4_tonnes = w * doc * doc_f * fraction_ch4 * (16.0 / 12.0) * (1.0 - oxidation) * mcf / 1000.0
total_co2e = total_ch4_tonnes * gwp_ch4
PE_elec = EC (MWh) * EF_grid (tCO2/MWh).
emissions_tco2 = electricity_mwh * ef_grid
PE_flare = Q (m3) * EF (tCO2/m3) * (1 - destruction_efficiency / 100).
pe_flare = gas_volume_m3 * ef_tco2_per_m3 * (1.0 - destruction_eff / 100.0)
ef_cm = w_om * om_ef + w_bm * bm_ef
v_m_stp = 22.414  # L/mol at STP
v_m_actual = v_m_stp * (temperature_k / 273.15) * (101.325 / pressure_kpa)  # L/mol
v_m_m3 = v_m_actual / 1000.0  # m3/mol
mw_kg_per_mol = molecular_weight / 1000.0
mass_flow_kg_hr = volumetric_flow_m3_hr * concentration_fraction * mw_kg_per_mol / v_m_m3
annual_mass_tonnes = mass_flow_kg_hr * 8760.0 / 1000.0
Efficiency = useful_energy_output / total_fuel_energy_input.
actual_efficiency = useful_output_gj / fuel_input_gj if fuel_input_gj > 0 else 0.0
reduction_factor = 1.0 - (baseline_efficiency / actual_efficiency)
RL = max(default_lifetime - age, min_remaining_years).
remaining_raw = default_lt - age_years
remaining_adjusted = remaining_raw * condition_factor
years_elapsed = current_year - baseline_year
emissions_tco2 = distance_km * cargo_tonnes * ef / 1e6
CH4 = mass_composted * CH4_EF; N2O = mass_composted * N2O_EF.
ch4_tonnes = mass_composted_tonnes * ch4_ef_kg_per_tonne / 1000.0
n2o_tonnes = mass_composted_tonnes * n2o_ef_kg_per_tonne / 1000.0
PE_AD = biogas_produced * CH4_fraction * leakage_rate * density_CH4 * GWP_CH4 / 1000.
leaked_ch4_kg = biogas_m3 * ch4_fraction * leakage_rate * ch4_density_kg_m3
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

Grounded in two engines behind `api/v1/routes/cdm_tools.py`:
`backend/services/cdm_tools_engine.py` (43 CDM methodological-tool calculators + methodology→tool
dependency chains) and `backend/services/activity_guide_catalog.py` (105 real-world activities
mapped to methodologies with plain-language input guides). This is the platform's carbon-credit
*calculation toolkit* — the CDM tools that underpin CDM, VCS, Gold Standard, CAR and ACR
methodologies.

### 7.1 What the domain computes

Two capabilities:

1. **CDM tool execution** — each of 43 tools (TOOL01–TOOL33 plus AR-TOOL02–AR-TOOL19) is a pure
   function taking an input dict and returning `{tool_code, tool_name, inputs, outputs,
   methodology_notes, unit}`. Tools are dispatched via `CDM_TOOL_CALCULATORS`; `calculate_cdm_tool`
   runs one, `/batch` runs many, and `/chain/{methodology}` runs the full ordered tool set a
   methodology requires (from `METHODOLOGY_TOOL_DEPENDENCIES`).
2. **Activity guide** — a read-only catalogue mapping economic activities (wind farm, landfill
   gas, mangrove restoration…) to applicable methodologies, required CDM tools, input parameters
   with typical ranges and data sources, real-world project examples, and cost/credit ranges.

### 7.2 Representative tool formulas (quoted from code)

| Tool | Category | Formula |
|---|---|---|
| TOOL01 | Additionality | `additional = barrier_pass AND (IRR_project < IRR_benchmark OR common_practice_ratio < 20%)` |
| TOOL02 | Baseline+add. | rank alternatives by plausibility → select top; additional if `IRR<bench AND plausibility>0.5` |
| TOOL03 | Fossil-fuel CO₂ | `PE = Σ FC_i × NCV_i × EF_CO2_i / 1000` (IPCC factors) |
| TOOL05 | Grid EF | combined-margin grid emission factor (OM×w_om + BM×w_bm) |
| TOOL30 | fNRB | `fNRB = 1 − (MAI × forested_area) / total_biomass_consumption` |
| AR-TOOL03 | Sample plots | `n = (t × CV / E)²` |
| AR-TOOL14 | Tree C stock | `AGB = Σ a × D^b × H^c × ρ × N × Area` (allometric) |
| AR-TOOL16 | Soil OC | `ΔSOC = (SOC_project − SOC_baseline) × area × depth_factor` |

Each carries its own `methodology_notes` string documenting the CDM steps, and defaults so a bare
call still returns a worked example.

### 7.3 Parameterisation

**Shared factor tables** imported from `carbon_calculator_v2` (with a standalone fallback): GWP
`{co2:1, ch4:28, n2o:265, sf6:23500}` (IPCC AR5); fuel NCV/EF table (diesel NCV 43.0 GJ/t,
EF 74.1 kgCO₂/GJ; natural gas 48.0/56.1; bituminous coal 25.8/94.6; biogas 23.0/0.0…); country
grid emission factors with operating-margin/build-margin split and source citations (US EPA eGRID
0.450, India CEA 0.710, France 0.050, South Africa 0.900…).

**Tool registry** (`CDM_TOOLS_REGISTRY`) — 43 entries with code, official CDM name, version,
category (one of 17: additionality, baseline, emission_calculation, grid, transport, waste,
biomass, small_scale, afforestation, default_values, investment, common_practice, leakage,
refrigerant, building, industrial), and description. **`METHODOLOGY_TOOL_DEPENDENCIES`** maps
each methodology to its required tool chain, e.g. `ACM0002` (grid renewables) →
[TOOL01, TOOL02, TOOL03, TOOL05, TOOL07, TOOL15, TOOL24, TOOL27, TOOL33]; small-scale `AMS-I.D`
→ [TOOL19, TOOL20, TOOL21, TOOL05, TOOL07, TOOL33].

**Activity catalog** — 105 activities across ~17 sectors, each with `applicable_methodologies`,
`recommended_methodology`, `typical_credit_range`, `inputs_guide` (parameter, unit, typical range,
example value, data sources, tooltip), `real_world_examples`, `cdm_tools_needed`, and
`estimated_cost_range_usd`.

### 7.3b Calculation walkthrough (tool chain)

`execute_tool_chain(methodology, tool_inputs)` looks up the methodology's tool list, runs each tool
(with caller inputs or defaults), collects results and errors, then aggregates a summary: sums
`total_co2e_tonnes`/`emissions_tco2` into `total_emissions_tco2e`, sums reduction outputs into
`total_reductions_tco2e`, and ANDs every tool's `is_additional` into a single
`additionality_verdict`. A tool failure is captured per-tool without aborting the chain.

### 7.4 Worked example (TOOL03 — CO₂ from fuel combustion)

Inputs `fuel_consumptions = {diesel: 500 t, natural_gas: 1200 t}`:

| Fuel | FC (t) | NCV (GJ/t) | EF (kgCO₂/GJ) | CO₂ = FC×NCV×EF/1000 (t) |
|---|---|---|---|---|
| Diesel | 500 | 43.0 | 74.1 | 500×43×74.1/1000 = **1,593.15** |
| Natural gas | 1,200 | 48.0 | 56.1 | 1,200×48×56.1/1000 = **3,231.36** |
| **Total** | | | | **4,824.51 tCO₂** |

For TOOL01 on a project with barriers {investment 0.7, tech 0.5…}, IRR_project 8% < benchmark
12%, common-practice ratio 0.05 < 0.20: barrier_pass (≥0.5 exists) = True, investment_pass = True →
**is_additional = True**. Running the `ACM0002` chain would combine TOOL03-style emission tools
with TOOL01/02 additionality into a single methodology-level verdict + net reduction.

### 7.5 Data provenance & limitations

- **No synthetic/PRNG data.** All calculators are deterministic; factor tables are IPCC/national-
  authority reference data with source citations; the activity catalog and tool registry are
  curated reference content, not generated. Defaults exist for demonstration but are echoed in the
  output so they are never mistaken for real inputs.
- The tools are **faithful implementations of the CDM tool formulas** but simplified: e.g. TOOL01
  additionality uses a single barrier-score threshold (≥0.5) rather than the full narrative barrier
  analysis a DOE would assess; TOOL05 grid EF uses a fixed OM/BM 50/50 weighting rather than the
  data-vintage-weighted combined margin CDM prescribes.
- The activity guide is advisory — it recommends methodologies and tools and lists data sources,
  but does not itself validate a project or run its credit calculation.
- Chain aggregation naively sums any output field named like emissions/reductions across tools —
  callers must ensure tool inputs are consistent to get a meaningful methodology total.

### 7.6 Framework alignment

- **UNFCCC CDM methodological tools** — the 43 tools are the actual CDM Executive Board tools
  (versions tracked, e.g. TOOL01 v07.0.0 additionality, TOOL05 combined-margin grid EF, TOOL30
  fNRB v04.0). These tools are the shared calculation building blocks referenced across CDM
  large-scale (ACM), small-scale (AMS) and A/R methodologies.
- **CDM additionality (TOOL01/02/27/32)** — barrier analysis, investment analysis (IRR/NPV vs
  benchmark), common-practice test, and positive-list auto-additionality — the standard CDM
  additionality architecture.
- **Verra VCS / Gold Standard / CAR / ACR** — these programmes adopt or adapt the same CDM tools,
  which is why the engine markets itself as covering all five standards; the methodology→tool
  dependency map reflects real methodology requirements (e.g. ACM0002 for grid renewables).
- **IPCC 2006 Guidelines / AR5 GWP** — the underlying NCV, emission-factor and GWP constants used
  by the emission-calculation tools.
- **A/R carbon accounting (AR-TOOLs)** — allometric biomass (Chave et al.), dead wood/litter,
  soil organic carbon, and biomass-burning non-CO₂ tools implement the IPCC/CDM forest-carbon
  stock-change methodology.

## 9 · Future Evolution

### 9.1 Evolution A — Data-vintage-weighted grid EF and full barrier analysis (analytics ladder: rung 1 → 2)

**What.** A large, faithful CDM calculation toolkit: 43 CDM Executive Board tools (TOOL01–33 +
AR-TOOLs) as deterministic calculators with IPCC/national reference constants, plus a 105-activity
guide mapping economic activities to methodologies and tool chains — no PRNG, defaults echoed in
output so they're never mistaken for real inputs. §7.5 names the simplifications to deepen: TOOL01
additionality uses a single barrier-score threshold (≥0.5) rather than the narrative barrier
analysis a DOE assesses; TOOL05/07 grid EF uses a **fixed OM/BM 50/50 weighting** rather than the
data-vintage-weighted combined margin CDM prescribes; and chain aggregation naively sums any
emissions/reductions-named field, so callers must ensure input consistency. Evolution A implements
the data-vintage-weighted combined margin and a structured multi-barrier additionality analysis.

**How.** `calculate_tool07` gains the CDM data-vintage weighting (generation-weighted OM, most-recent
BM) with the standard 3/5-year OM options; `calculate_tool01` accepts a structured barrier list with
per-barrier evidence rather than a single threshold; `execute_tool_chain` validates unit consistency
across chained tools before summing. Rung 2: parameter sensitivity across the chain (e.g. grid-EF
vintage, fNRB uncertainty) surfaced per methodology.

**Prerequisites.** Fix the lineage-harness failures — §4.2 shows `GET /activities/{id}`,
`/activities/{id}/inputs`, and `/for-methodology/{code}` **failed** (likely path/lookup bugs);
preserve the source-cited factor tables and defaults-echoing discipline. **Acceptance:** the §7.4
TOOL03 worked example (4,824.51 tCO₂) reproduces; TOOL07 grid EF changes with the OM data vintage;
a structured barrier analysis produces a defensible additionality verdict; the failing GET endpoints
pass the harness.

### 9.2 Evolution B — Carbon-methodology copilot that runs the tool chain (LLM tier 2)

**What.** A tool-calling analyst for carbon-project developers: "which methodology and tools apply
to a landfill-gas project?" (`/for-methodology`, activity search), "run the ACM0002 tool chain for
my grid-renewables project" (`/chain/{methodology}`), "calculate CO₂ from this fuel mix" (`/tool03/
calculate`), and "is my project additional?" (`/tool01/calculate`) — narrating the engine's real
deterministic outputs and the methodology-level chain verdict. The 105-activity guide (input
parameters, typical ranges, data sources, real-world examples) is ideal for LLM-guided project
scoping.

**How.** Tool schemas from the ~13 endpoints; the activity catalogue and tool registry are ideal
RAG grounding for "what inputs does TOOL30 fNRB need?" questions — a tier-1 explainer over a tier-2
operator that executes the calculators. The no-fabrication validator checks every tCO₂ and IRR
against tool output; the copilot uses the `inputs_guide` (typical ranges, tooltips) to help the user
supply valid inputs, and surfaces per-tool failures in a chain without hiding them.

**Prerequisites.** Evolution A's harness fixes (working activity/methodology lookups for tool-calling);
Atlas + activity/registry corpus embedded (roadmap D3). **Acceptance:** every figure in an answer
traces to a tool-execution call; a methodology chain's net reduction matches `/chain` output; a
tool run with defaults is flagged as using demo defaults, not real project data.