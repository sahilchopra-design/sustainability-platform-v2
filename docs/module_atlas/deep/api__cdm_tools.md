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
