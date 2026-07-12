# Api::Dcm
**Module ID:** `api::dcm` · **Route:** `/api/v1/dcm` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/dcm/calculate` | `run_calculation` | api/v1/routes/dcm.py |
| POST | `/api/v1/dcm/batch` | `run_batch` | api/v1/routes/dcm.py |
| GET | `/api/v1/dcm/methodologies` | `get_methodologies` | api/v1/routes/dcm.py |
| GET | `/api/v1/dcm/sectors` | `get_sector_list` | api/v1/routes/dcm.py |
| GET | `/api/v1/dcm/standards` | `get_standard_list` | api/v1/routes/dcm.py |
| GET | `/api/v1/dcm/methodologies/{code}` | `get_methodology_detail` | api/v1/routes/dcm.py |
| POST | `/api/v1/dcm/compare` | `compare_methodologies` | api/v1/routes/dcm.py |
| GET | `/api/v1/dcm/ref/project-types` | `get_project_types` | api/v1/routes/dcm.py |
| GET | `/api/v1/dcm/ref/cdr-pathways` | `get_cdr_pathways` | api/v1/routes/dcm.py |
| GET | `/api/v1/dcm/ref/article6-guidance` | `get_article6_guidance` | api/v1/routes/dcm.py |

### 2.3 Engine `dcm_engine` (services/dcm_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_result` | methodology, version, sector, project_type, standard, baseline, project, leakage |  |
| `ACM0004_WasteWaterMethane` | inputs | ACM0004 v10: Treatment of Wastewater (methane recovery/destruction) |
| `ACM0011_FuelSwitchBiomass` | inputs | ACM0011 v11: Fuel Switching from Coal/Oil/Gas to Biomass |
| `ACM0013_ImprovedRiceCultivation` | inputs | ACM0013 v5: Avoiding CH4 Emissions from Rice Cultivation |
| `ACM0015_AgriculturalN2O` | inputs | ACM0015 v5: N2O Reductions from Improved Nitrogen Management |
| `ACM0016_BRT` | inputs | ACM0016 v7: Mass Rapid Transit (BRT/Metro/LRT) |
| `ACM0017_IndustrialN2O` | inputs | ACM0017 v4: Industrial N2O Reduction (Nitric Acid / Adipic Acid) |
| `ACM0018_BiomassElectricity` | inputs | ACM0018 v6: Electricity Generation from Biomass in Power-Only Plants |
| `ACM0019_CoalBedMethane` | inputs | ACM0019 v6: Coal Bed Methane / Coal Mine Methane (Capture and Use) |
| `ACM0020_CleanWater` | inputs | ACM0020 v4: Baseline and Monitoring for Clean Drinking Water |
| `ACM0021_EnergyEfficiencyIndustry` | inputs | ACM0021 v1.1: Energy Efficiency Improvements in Industrial Facilities |
| `ACM0024_ElectricVehicles` | inputs | ACM0024 v1: Promotion of Electric Vehicles |
| `ACM0025_ZeroEmissionBuses` | inputs | ACM0025 v1: Zero-Emission Buses (electric/hydrogen BEB/HEB) |
| `AM0001_HFCFromHCFC22` | inputs | AM0001 v7: HFC-23 Destruction from HCFC-22 Plants |
| `AM0014_NaturalGasFugitives` | inputs | AM0014 v4: Natural Gas Fugitive Emission Reductions |
| `AM0026_WasteHeatCement` | inputs | AM0026 v4: Waste Heat Recovery for Power Generation in Cement Plants |
| `AM0057_GreenHydrogen` | inputs | AM0057 v3: Hydrogen from Electrolysis (Green Hydrogen Production) |
| `AM0075_CarbonCapture` | inputs | AM0075 v3: Carbon Capture and Storage (CCS) from Industrial Processes |
| `AMS_I_B_SolarPVMiniGrid` | inputs | AMS-I.B v18: Energy Efficiency Improvements via PV mini-grids |
| `AMS_I_E_OffGridSolar` | inputs | AMS-I.E v15: Switch from Non-Renewable to Renewable Energy User Devices |
| `AMS_I_F_AgriculturalPV` | inputs | AMS-I.F v3: Renewable Energy Generation — Agrivoltaics |
| `AMS_II_A_SupplyEfficiency` | inputs | AMS-II.A v13: Supply-Side Energy Efficiency in Transmission & Distribution |
| `AMS_II_B_IndustrialBoilers` | inputs | AMS-II.B v14: Energy Efficiency in Industrial Boilers |
| `AMS_II_C_Thermodynamics` | inputs | AMS-II.C v15: Demand-Side Energy Efficiency — HVAC & Refrigeration |
| `AMS_II_F_EnergyEfficiencyAg` | inputs | AMS-II.F v4: Energy Efficiency in Agricultural and Irrigation |
| `AMS_III_A_WastewaterSmallScale` | inputs | AMS-III.A v18: Recovery and Utilisation of Biogas from Animal Manure |
| `AMS_III_E_AvoidedMethane` | inputs | AMS-III.E v22: Avoidance of Methane from Organic Waste Disposal on Land |
| `AMS_III_F_AvoidedUncontrolledCombustion` | inputs | AMS-III.F v12: Avoidance of Methane from Uncontrolled Biomass Burning |
| `AMS_III_R_Methane_Landfill` | inputs | AMS-III.R v4: Methane Recovery in Wastewater Treatment |
| `AMS_III_T_CropResidues` | inputs | AMS-III.T v3: Plant Oil-Based Fuel Used in Transport |
| `VM0003_AvoLandslideDeforestation` | inputs | VM0003 v2: Avoided Unplanned Deforestation and Degradation |
| `VM0006_IFM` | inputs | VM0006 v4: Improved Forest Management — Extended Rotation |
| `VM0007_REDD_PlannedDeforestation` | inputs | VM0007 v1.6: REDD+ Methodology Framework — Planned Deforestation |
| `VM0009_Agroforestry` | inputs | VM0009 v3: Methodology for Avoided Ecosystem Conversion — Agroforestry |
| `VM0010_Grassland_Restoration` | inputs | VM0010 v1: Methodology for Improved Land Management — Grassland |
| `VM0011_Avoided_Peatland` | inputs | VM0011 v2: Peatland Restoration and Conservation |

**Engine `dcm_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `GWP` | `{'CO2': 1, 'CH4': 27.9, 'N2O': 273, 'HFC134a': 1530, 'HFC32': 771, 'HFC23': 14600, 'SF6': 25200, 'NF3': 17400, 'CF4': 7380, 'PFC': 8210}` |
| `IPCC_FUELS` | `{'natural_gas': {'ef_co2': 56.1, 'ncv': 48.0}, 'diesel': {'ef_co2': 74.1, 'ncv': 43.0}, 'coal_bituminous': {'ef_co2': 94.6, 'ncv': 25.8}, 'coal_lignite': {'ef_co2': 101.0, 'ncv': 11.9}, 'coal_anthracite': {'ef_co2': 98.3, 'ncv': 26.7}, 'fuel_oil': {'ef_co2': 77.4, 'ncv': 40.4}, 'gasoline': {'ef_co2'` |
| `GRID_EF` | `{'CN': 0.581, 'IN': 0.687, 'US': 0.4368, 'DE': 0.385, 'GB': 0.2136, 'FR': 0.049, 'BR': 0.1234, 'AU': 0.64, 'JP': 0.474, 'KR': 0.4588, 'ZA': 0.9073, 'MX': 0.425, 'ID': 0.684, 'NG': 0.43, 'PK': 0.485, 'EG': 0.46, 'TR': 0.489, 'TH': 0.512, 'VN': 0.62, 'PH': 0.643, 'BD': 0.568, 'ET': 0.056, 'KE': 0.21, ` |
| `BIOME_CARBON` | `{'tropical_moist': {'above': 180, 'below': 36, 'soil': 60, 'dead': 10}, 'tropical_dry': {'above': 80, 'below': 16, 'soil': 40, 'dead': 5}, 'subtropical_humid': {'above': 130, 'below': 26, 'soil': 55, 'dead': 8}, 'subtropical_dry': {'above': 60, 'below': 12, 'soil': 35, 'dead': 4}, 'temperate_oceanic` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `host`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/dcm/methodologies** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 56, 'item0_keys': ['code', 'name', 'sector', 'standard', 'project_type']}`

**GET /api/v1/dcm/methodologies/{code}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/dcm/ref/article6-guidance** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['article_6_2', 'article_6_4', 'corresponding_adjustments', 'corsia'], 'n_keys': 4}`

**GET /api/v1/dcm/ref/cdr-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 5, 'item0_keys': ['pathway', 'code', 'current_cost_usd_per_t', '2030_cost_projection_usd_per_t', 'permanence', 'co_benefits', 'readiness']}`

**GET /api/v1/dcm/ref/project-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 56, 'item0_keys': ['project_type', 'sector', 'example_standard', 'example_code']}`

**GET /api/v1/dcm/sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 13, 'item0_keys': None}`

**GET /api/v1/dcm/standards** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 9, 'item0_keys': None}`

**POST /api/v1/dcm/batch** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `dcm_engine` — extracted transformation lines:**
```python
er = baseline - project - leakage
ncb = er + removals
annual_cod = cod_in * days  # kg COD/year
ch4_kg = annual_cod * ch4_factor * 0.67
ch4_destroyed = ch4_kg * destruction_eff
energy_kwh = (ch4_destroyed / 0.67) * 9.97 * biogas_to_elec  # m3 → kWh (rough)
avoided_elec = (energy_kwh / 1000) * grid_ef  # tCO2e
project_net = max(project - avoided_elec, 0)
transport_emission_factor = 0.062  # kgCO2e/tonne-km (typical truck)
biomass_mass_tonnes = annual_consumption_tj * biomass_fraction * 1000 / 15.6  # NCV 15.6 GJ/t
leakage = (biomass_mass_tonnes * transport_distance_km * transport_emission_factor) / 1e6
pkm_total = ridership_daily * avg_trip_km * days
pkm_shifted = pkm_total * modal_shift_pct
baseline = pkm_shifted * car_ef / 1e9  # → tCO2e
project = pkm_total * transit_ef / 1e9
leakage = baseline * 0.05
energy_gj = biomass_tonnes_year * ncv_gj_t
electricity_mwh = energy_gj * plant_efficiency / 3.6
baseline = electricity_mwh * grid_ef  # tCO2e displaced
project = electricity_mwh * 0.005  # auxiliary diesel/fossil very small
annual_ch4_m3 = ch4_flow_m3_day * days
ch4_density = 0.716  # kg/m3
baseline_ch4_kg = annual_ch4_m3 * ch4_density
captured_ch4 = baseline_ch4_kg * capture_eff
destroyed_ch4 = captured_ch4 * destruction_eff
fugitive_ch4 = baseline_ch4_kg - destroyed_ch4
energy_mwh = power_output_kw * days * 24 / 1000
avoided_grid = energy_mwh * grid_ef
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain. The sections below document
`backend/services/dcm_engine.py` — the "DCM Engine — Complete Carbon Credit Methodology
Calculator" — exposed at `/api/v1/dcm` via `backend/api/v1/routes/dcm.py`.)*

### 7.1 What the module computes

A **dispatcher over ~53 named carbon-crediting methodology calculators** spanning CDM
(ACM/AM/AMS families), Verra VCS (VM00xx), Gold Standard (ICS/WASH/AGRI/WW), engineered CDR
(DACCS/BECCS/ERW/OAE/biochar), Article 6.4 ITMO accounting, and CORSIA. Every calculator is a
pure function `CODE(inputs: dict) -> dict` and every result flows through one canonical
identity (`_result`):

```
emission_reductions = baseline_emissions − project_emissions − leakage
net_climate_benefit = emission_reductions + emission_removals        (all tCO₂e)
```

API surface: `GET /methodologies` (filterable catalogue), `GET /methodologies/{code}`,
`GET /sectors`, `GET /standards`, `GET /ref/*` (Article 6 guidance, CDR pathways, project
types), and `POST /batch` → `batch_calculate([{methodology_code, inputs}...])` with per-item
ok/error status. Unknown codes raise a `ValueError` listing available codes.

### 7.2 Parameterisation — shared physical constants

| Constant block | Contents | Provenance |
|---|---|---|
| `GWP` | CO₂ 1 · CH₄ 27.9 · N₂O 273 · HFC-23 14,600 · SF₆ 25,200 … | IPCC **AR6** GWP-100 values (code comment) |
| `IPCC_FUELS` | EF (kgCO₂/GJ) + NCV per fuel: natural gas 56.1/48.0, diesel 74.1, bituminous coal 94.6, lignite 101.0…; biomass/charcoal/biogas EF 0 (biogenic) | IPCC 2006 Tier-1 defaults (labelled "IPCC AR6 Tier 1") |
| `GRID_EF` | Combined-margin grid factors tCO₂e/MWh for 25 countries (CN 0.581, IN 0.687, FR 0.049, ZA 0.907…) + global 0.4753 | typical published CM values, hard-coded |
| `BIOME_CARBON` | Above/below/soil/dead stocks (tCO₂e/ha) for 14 biomes — tropical moist 180/36/60/10 … tropical peatland soil 2,000, mangrove soil 450 | IPCC-style biome defaults, engine-curated |

Each calculator also carries methodology-specific defaults (every input has one, so the API is
demo-runnable with an empty `inputs`): e.g. wastewater `B0 = 0.25 m³CH₄/kg COD`, CH₄ density
0.67–0.716 kg/m³; truck transport 0.062 kgCO₂e/t·km; SMR grey-hydrogen 9.3 tCO₂e/tH₂; kerosene
2.543 kgCO₂/l; non-renewable-biomass wood EF 1.83 tCO₂e/t; root-shoot expansion 1.26, biomass
expansion factor 1.4, carbon fraction 0.47, C→CO₂ 44/12; REDD leakage 10–20% of baseline;
CORSIA Jet-A 3.16 kgCO₂/kg fuel and an optional radiative-forcing multiplier (default 2.0).

### 7.3 Calculation walkthrough — family patterns

- **Methane destruction** (ACM0004, ACM0019, AMS-III.A/R, GS-WW): CH₄ mass from
  COD/manure/flow × conversion factor → baseline = CH₄ × GWP; project = undestroyed residual;
  displaced grid electricity from biogas is *netted off project emissions* (floored at 0).
- **Grid displacement** (ACM0018, AMS-I.B/E/F, AM0026): MWh generated × grid EF = baseline;
  small auxiliary/project factors; biomass transport as leakage.
- **Efficiency deltas** (ACM0021, AMS-II.A/B/C/F): before/after energy × fuel-or-grid EF.
- **AFOLU stocks/flows** (VM family): avoided-deforestation baselines = area-loss × biome
  carbon stock, with % leakage (activity shifting 10–20%) and small monitoring project terms;
  sequestration methods report `emission_removals` (SOC gain, biomass increment × 1.26 × CF ×
  44/12) instead of reductions.
- **CDR**: removals = capacity × permanence (DACCS 0.999) or feedstock × yield × stable-C ×
  44/12 (biochar) or tonnage × removal factor × dissolution efficiency (ERW 0.30 × 0.65, OAE
  1.25 × 0.60); project = fossil-energy/processing/transport overheads; baseline = 0.
- **Article 6.4**: `net ITMOs = gross ER × CA% − 5% share-of-proceeds − 2% adaptation levy`,
  reporting host-NDC adjustment and receiving-NDC reduction separately.
- **CORSIA**: fleet fuel burn × Jet-A EF (SAF share at lifecycle EF), × RFM, then
  `offset = max(total − 2019-baseline, 0) × 15%` sectoral-growth factor.

### 7.4 Worked example — GS-ICS improved cookstoves (engine defaults)

50,000 households, 4.5 kg wood/hh/day, fNRB = 0.70, 55% fuel savings, wood EF 1.83 tCO₂e/t:

| Step | Computation | Result |
|---|---|---|
| Baseline wood | 50,000 × 4.5 × 365 | 82,125 t/yr |
| Non-renewable share | 82,125 × 0.70 | 57,487.5 t |
| Baseline emissions | 57,487.5 × 1.83 | **105,202.13 tCO₂e** |
| Residual wood (45%) | 82,125 × 0.45 × 0.70 | 25,869.4 t NRB |
| Project combustion | 25,869.4 × 1.83 | 47,340.96 |
| + stove manufacture | 50,000 × 0.002 | 100.00 |
| Project emissions | | **47,440.96 tCO₂e** |
| Emission reductions | 105,202.13 − 47,440.96 − 0 | **57,761.17 tCO₂e/yr** |

This mirrors the Gold Standard ICS logic: credits scale with fuel saved × the fraction of
non-renewable biomass (fNRB) — the parameter real GS projects must justify from national data.

### 7.5 Data provenance & limitations

- **No PRNG and no DB** — deterministic formula evaluation only; but **all default inputs are
  synthetic demo values** (e.g. 200,000 daily BRT riders, 50,000 tHCFC-22). Results with empty
  `inputs` are illustrative project archetypes, not assessments.
- Calculators are **first-order simplifications** of the real methodologies: single-year
  steady-state (no crediting-period dynamics, no buffer-pool deductions for AFOLU
  non-permanence), fixed percentage leakage instead of modelled activity-shifting, and rough
  unit bridges flagged in code comments ("rough", e.g. ACM0011's TJ→tCO₂e conversion and
  GS-WW's m³CH₄→MWh chain). AMS-III.E contains a self-cancelling term
  (`× ch4_fraction / ch4_fraction`), leaving the landfill-gas CH₄ share inert.
- Some names/labels drift from the official registries (e.g. VM0037 is labelled "Mesospheric
  Cooling" in the function name but implements forest restoration; VM0015's real Verra title is
  avoided *unplanned deforestation*, here used for coastal ecosystems). Codes should be treated
  as platform identifiers inspired by, not certified reproductions of, registry documents.
- AM0075 counts captured industrial CO₂ as `emission_removals` — under most standards CCS on a
  fossil point source is a *reduction*, not a removal; only the sign convention differs.
- GWP set is AR6-consistent (CH₄ 27.9 fossil value); actual CDM/VCS projects may still credit
  under AR4/AR5 GWPs depending on version — a version-vintage caveat for any reconciliation.

### 7.6 Framework alignment

- **UNFCCC CDM** — ACM/AM/AMS structure mirrors the real methodology families (consolidated,
  approved, small-scale) including canonical parameters (MCF, B₀, EF₁ = 0.01 kgN₂O-N/kgN from
  IPCC, combined-margin grid EFs per the CDM grid-emission-factor tool).
- **Verra VCS** — VM-series AFOLU logic (baseline stocks × loss rate, leakage belts, IFM
  increment accounting); real VCS adds VVB validation and buffer-pool contributions not
  modelled here.
- **Gold Standard** — ICS thermal-efficiency crediting via fNRB (the fraction of woodfuel
  harvested unsustainably), WASH avoided-boiling, agri soil-carbon.
- **Article 6.4 / 6.2 (Paris Agreement)** — corresponding adjustments, 5% share of proceeds to
  the Adaptation Fund and the mechanism's overall-mitigation cancellation, per the CMA rulebook.
- **ICAO CORSIA** — route-based fuel MRV, SAF lifecycle credit against the ~89 gCO₂e/MJ fossil
  benchmark, and offsetting of growth above the (revised 2019-based) sectoral baseline.
- **IPCC 2006 Guidelines / AR6** — Tier-1 emission factors, GWP-100, first-order-decay concepts
  for waste methane.
- **ISO 14064-2 / Puro.earth / IC-VCM** — cited as the standards frame for the engineered-CDR
  calculators (permanence fractions, stable-carbon accounting per H:C_org-style biochar QA).