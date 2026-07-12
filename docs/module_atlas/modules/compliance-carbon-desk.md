# Compliance Carbon Desk
**Module ID:** `compliance-carbon-desk` · **Route:** `/compliance-carbon-desk` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `DEFAULT_OFFSETS`, `DEFAULT_POSITIONS`, `Kpi`, `TABS`, `TYPE_COLOR`, `TYPE_LABEL`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DEFAULT_POSITIONS` | 7 | `scheme_id`, `covered`, `free`, `baseline`, `override` |
| `DEFAULT_OFFSETS` | 6 | `unit_type`, `price`, `volume` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtNum` | `(v, d = 1) => (v == null \|\| isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });` |
| `fmtUsd` | `(v, d = 2) => (v == null \|\| isNaN(v)) ? '—' : `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: d })}`;` |
| `TABS` | `['Scheme Atlas', 'Article 6 Desk', 'Compliance Cost', 'Cross-Market', 'Sustainability×Financial'];` |
| `schemeById` | `useMemo(() => Object.fromEntries(schemeList.map((s) => [s.id, s])), [schemeList]);` |
| `rows` | `itmo.data.waterfall.map((c) => {` |
| `updateRow` | `(setter) => (id, key, value) => setter((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));` |
| `addPosition` | `() => setPositions((p) => [...p, { id: p.length ? Math.max(...p.map((r) => r.id)) + 1 : 1, scheme_id: 'eu_ets', covered: 100000, free: 0, baseline: '', override: '' }]);` |
| `addOffset` | `() => setOffsets((p) => [...p, { id: p.length ? Math.max(...p.map((r) => r.id)) + 1 : 1, unit_type: 'CCER', price: 10, volume: 10000 }]);` |
| `ebitda` | `(parseFloat(ebitdaM) \|\| 0) * 1e6;` |
| `totalPct` | `(cc.data.total_compliance_cost_usd / ebitda) * 100;` |
| `retainedTotalPct` | `totalPct * (1 - pt);` |
| `alpha` | `Math.round(20 + t * 60).toString(16).padStart(2, '0');` |
| `priceChart` | `useMemo(() => schemeList .filter((s) => s.price?.usd_per_t != null) .map((s) => ({ id: s.id, name: s.name.length > 26 ? s.name.slice(0, 24) + '…' : s.name, price: s.price.usd_per_t, type: s.type })) .sort((a, b) => b.price - a.price), [schemeList]);` |
| `maxAbs` | `Math.max(...ids.flatMap((a) => ids.map((b) => Math.abs(xb.data.scheme_spread_matrix[a][b]))));` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/carbon-price-ets/ets-compliance` | `ets_compliance_endpoint` | api/v1/routes/carbon_price_ets.py |
| POST | `/api/v1/carbon-price-ets/eu-ets-forecast` | `eu_ets_forecast_endpoint` | api/v1/routes/carbon_price_ets.py |
| POST | `/api/v1/carbon-price-ets/cbam-exposure` | `cbam_exposure_endpoint` | api/v1/routes/carbon_price_ets.py |
| POST | `/api/v1/carbon-price-ets/portfolio-carbon-cost` | `portfolio_carbon_cost_endpoint` | api/v1/routes/carbon_price_ets.py |
| POST | `/api/v1/carbon-price-ets/price-pathway` | `price_pathway_endpoint` | api/v1/routes/carbon_price_ets.py |
| GET | `/api/v1/carbon-price-ets/ref/ets-systems` | `ref_ets_systems` | api/v1/routes/carbon_price_ets.py |
| GET | `/api/v1/carbon-price-ets/ref/iea-pathways` | `ref_iea_pathways` | api/v1/routes/carbon_price_ets.py |
| GET | `/api/v1/carbon-price-ets/ref/cbam-sectors` | `ref_cbam_sectors` | api/v1/routes/carbon_price_ets.py |
| GET | `/api/v1/carbon-price-ets/ref/leakage-risk` | `ref_leakage_risk` | api/v1/routes/carbon_price_ets.py |
| GET | `/api/v1/carbon-price-ets/ref/china-ets-sectors` | `ref_china_ets_sectors` | api/v1/routes/carbon_price_ets.py |
| GET | `/api/v1/compliance-carbon/schemes` | `get_schemes` | api/v1/routes/compliance_carbon.py |
| GET | `/api/v1/compliance-carbon/article6` | `get_article6` | api/v1/routes/compliance_carbon.py |
| POST | `/api/v1/compliance-carbon/itmo-price` | `itmo_price` | api/v1/routes/compliance_carbon.py |
| POST | `/api/v1/compliance-carbon/compliance-cost` | `compliance_cost` | api/v1/routes/compliance_carbon.py |
| POST | `/api/v1/compliance-carbon/cross-border` | `cross_border` | api/v1/routes/compliance_carbon.py |
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

### 2.3 Engine `carbon_price_ets_engine` (services/carbon_price_ets_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `forecast_eu_ets_price` | horizon_years, scenario, entity_id | Forecast EU ETS price path using LRF, MSR dynamics, and supply/demand fundamentals. Deterministic supply-tightening model. MSR intake/release and CBAM pass-through are represented by fixed model calibration constants (not entity-reported figures). The confidence band is a scenario-dependent deterministic model uncertainty width, not a random draw. |
| `calculate_ets_compliance_cost` | entity_data | Calculate compliance cost across all 6 ETS systems for a given entity. All figures are computed from caller-supplied entity data using published ETS reference prices (ETS_SYSTEMS). When a required entity input is absent it is treated as an honest null / zero-exposure rather than fabricated: - annual_emissions_tco2 absent -> insufficient_data (costs return None) - free_allocation_pct absent -> assu |
| `assess_cbam_exposure` | trade_data | Assess CBAM certificate liability and competitiveness impact for a trade flow. Uses caller-supplied trade data and the published CBAM sector benchmarks (CBAM_SECTORS) plus the EU ETS reference price. Honest fallbacks: - import_volume_t absent -> insufficient_data (volume-dependent costs return None) - actual_carbon_intensity_tco2_t absent -> published sector default intensity (reference-data value |
| `calculate_portfolio_carbon_cost` | portfolio | Calculate sector-weighted carbon cost, transition risk, and stranding probability. Computes financed emissions per PCAF from caller-supplied holdings. Each holding should provide exposure_usd, sector, waci_tco2_mn_revenue and revenue_mn (or financed_emissions_tco2 directly). Missing per-holding figures are skipped (not fabricated) and flagged. With no usable holdings the result is an honest null.  |
| `forecast_carbon_price_pathway` | scenario, horizon, economy_type, entity_id | Interpolate the published IEA WEO carbon price pathway with scenario uncertainty bands. Prices are the published IEA anchor values linearly interpolated between anchor years — no random perturbation is applied. The uncertainty_range_pct is a deterministic scenario band width, not a random draw. |

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
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `ETS2`, `FY2026`, `FY2028`, `FY2033`, `July`, `__future__` *(shared)*, `approved`, `fastapi` *(shared)*, `host`, `projects` *(shared)*, `pydantic` *(shared)*, `revenues`, `services` *(shared)*, `typing` *(shared)*, `whitelisted`
**Frontend seed datasets:** `DEFAULT_OFFSETS`, `DEFAULT_POSITIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/compliance-carbon/article6** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['label', 'article_6_2', 'article_6_4', 'buyer_programs', 'corsia_interaction'], 'n_keys': 5}`

**GET /api/v1/compliance-carbon/schemes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['label', 'schemes', 'total_schemes', 'global_context', 'reconciliation'], 'n_keys': 5}`

**POST /api/v1/compliance-carbon/compliance-cost** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/compliance-carbon/cross-border** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/compliance-carbon/itmo-price** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `carbon_price_ets_engine` — extracted transformation lines:**
```python
lrf_effect = price * lrf * scenario_mult
msr_effect = msr_tightening if yr <= 2030 else msr_tightening * 0.5
price = price + lrf_effect + msr_effect
uncertainty = price * uncertainty_frac
ci_low[yr] = round(price - uncertainty, 2)
ci_high[yr] = round(price + uncertainty, 2)
msr_impact_eur=round(msr_tightening * horizon_years, 2),
lrf_impact_eur=round(base_price * lrf * horizon_years * scenario_mult, 2),
eu_allocation = annual_emissions * max(0.0, min(1.0, float(free_alloc_pct)))
eu_shortfall = max(0.0, annual_emissions - eu_allocation)
eu_cost_eur = eu_shortfall * eu_price
uk_exposed = (float(uk_pct) if uk_pct is not None else 0.0) * annual_emissions
uk_cost_gbp = uk_exposed * uk_price * 0.78  # USD to GBP
ca_exposed = (float(ca_pct) if ca_pct is not None else 0.0) * annual_emissions
ca_cost_usd = ca_exposed * ca_price
china_exposed = (float(china_pct) if china_pct is not None else 0.0) * annual_emissions
china_cost_cny = china_exposed * china_intensity_excess * china_price * 7.1
rggi_exposed = (float(rggi_pct) if rggi_pct is not None else 0.0) * annual_emissions
rggi_cost_usd = rggi_exposed * rggi_price
total_usd = (eu_cost_eur * 1.09) + (uk_cost_gbp * 1.27) + ca_cost_usd + (china_cost_cny / 7.1) + rggi_cost_usd
carbon_pct_ebitda = round(total_usd / ebitda * 100, 2) if ebitda else None
abatement_breakeven = total_usd / annual_emissions if annual_emissions else None
cbam_per_tco2 = max(0.0, eu_ets_price - exporter_carbon_price)
embedded_carbon = import_volume_t * actual_intensity
gross_cbam_cost = embedded_carbon * cbam_per_tco2
effective_cbam = gross_cbam_cost * cbam_phase_in / 100
revenue_from_trade = import_volume_t * float(unit_price_in)
comp_impact_pct = round(effective_cbam / revenue_from_trade * 100, 2)
```

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
**Blast radius:** changes here can affect **21** other module(s).
**Shared engines (edits propagate!):** `carbon_price_ets_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `carbon-derivatives-desk` | engine:carbon_price_ets_engine, table:projects |
| `carbon-market-intelligence` | table:projects |
| `carbon-integrity-mrv-analytics` | table:projects |
| `carbon-institutions-taxonomy` | table:projects |
| `carbon-footprint-intelligence` | table:projects |
| `carbon-reduction-projects` | table:projects |
| `carbon-aware-allocation` | table:projects |
| `carbon-forward-curve` | table:projects |
| `carbon-project-lifecycle` | table:projects |
| `carbon-removal-markets` | table:projects |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

This is the platform's national/compliance-carbon flagship: `backend/api/v1/routes/compliance_carbon.py`
(1,005 lines, prefix `/api/v1/compliance-carbon`) plus
`frontend/src/features/compliance-carbon-desk/pages/ComplianceCarbonDeskPage.jsx` (1,033 lines, 5
tabs: Scheme Atlas, Article 6 Desk, Compliance Cost, Cross-Market, Sustainability×Financial). The
route module's own docstring states the data policy explicitly: `/schemes` and `/article6` are
**hand-authored regulatory extracts** ("real mechanism parameters the desk is confident of, with
approximate price levels... anything uncertain is labeled in its own `notes`/`confidence` field,
nothing is fabricated"), while `/itmo-price`, `/compliance-cost` and `/cross-border` are
**deterministic closed-form calculators — no PRNG anywhere**, each returning its own `methodology`
block describing every modeling assumption. The desk explicitly reconciles with (does not
duplicate) the platform's E71 ETS reference layer (`/api/v1/carbon-price-ets/ref/ets-systems`,
6 systems), extending it to 13 mechanisms: EU ETS, UK ETS, California-Quebec (WCI), RGGI, EU ETS2
(2027), China national ETS, Korea K-ETS, India CCTS, Australia Safeguard Mechanism, Japan GX-ETS,
Singapore carbon tax, Mexico ETS pilot, and CORSIA.

### 7.2 Scheme atlas (`GET /schemes`) — 13-mechanism hand-authored extract

Each scheme record carries: `level` (national/subnational/supranational), `type`
(`cap_and_trade` | `intensity_rate_based` | `carbon_tax` | `baseline_and_credit` — the exact
taxonomy the compliance-cost obligation formula switches on, §7.4), `covered_emissions_mt`,
approximate ~2025 `price` (labeled `approx: True` on every block, with an `as_of` range note),
`cap_or_target` trajectory text, and `offset_rules` (`eligible_units`, `limit_pct_of_obligation`,
free-text `notes`). Examples of the labeled real parameters as coded: EU ETS Phase 4 linear
reduction factor "4.3%/yr 2024–2027, 4.4%/yr 2028–2030" with one-off rebasing of −90 Mt (2024) and
−27 Mt (2026); California's auction offset limit "4% of obligation 2021–2025, 6% from 2026 (used
here)"; China ETS intensity benchmark "~0.877 tCO2/MWh coal power"; Australia Safeguard baseline
decline "4.9%/yr to 2030"; CORSIA "Baseline = 85% of 2019 CO2 from 2024." Where a scheme has no
functioning market price yet (EU ETS2 pre-2027, India CCTS pre-2026, Japan GX-ETS voluntary phase,
Mexico pilot), `price.usd_per_t` is explicitly `None` rather than a fabricated placeholder —
`/compliance-cost` then requires the caller to supply `carbon_price_override_usd` for that scheme
or raises HTTP 422.

### 7.3 Article 6 rulebook (`GET /article6`) — real CMA decisions, quoted as coded

The response cites the actual Paris rulebook decisions:
- **Article 6.2** (cooperative approaches / ITMOs): "Decision 2/CMA.3 (Glasgow, 2021); further
  guidance Decision 6/CMA.4; operational details CMA.6 (Baku, 2024)." Corresponding adjustments are
  not mandatory in structure but are described exactly: host applies an addition to its emissions
  balance, acquiring party a subtraction, in the BTR structured summary. Share of Proceeds and OMGE
  are **not mandatory** under 6.2 (only "strongly encouraged").
- **Article 6.4** (Paris Agreement Crediting Mechanism, PACM): "Decision 3/CMA.3 (Glasgow, 2021);
  methodology + removals standards adopted CMA.6 (Baku, 2024)." Levies are **mandatory** and
  quantified: `share_of_proceeds_pct: 5.0` (to the Adaptation Fund) and
  `omge_cancellation_pct: 2.0` — these two numbers are exactly the `s=0.05, o=0.02` used in the
  ITMO pricing waterfall (§7.4). Two unit classes are distinguished: authorized A6.4ERs (CA'd,
  usable toward NDCs/CORSIA) versus "mitigation contribution" units (MCUs, no CA, host-NDC-only).
- Sovereign buyer programs are named with per-row confidence labels, e.g. Switzerland's KliK
  Foundation ("Peru (Oct 2020 — first Art 6.2 implementing agreement worldwide)"), Singapore's
  ICC window (PNG signed Dec 2023, Ghana 2024), Japan's JCM (since 2013, Mongolia first partner).

### 7.4 ITMO/A6.4ER landed-cost waterfall (`POST /itmo-price`) — traced and verified

Documented closed-form model, quoted from the route's own docstring:
```
base                 B = user base credit price
authorization premium P = B × premium_pct                    (authorized units only)
CA-risk discount      D = −(B+P) × (score/100) × max_discount_pct
net unit price        N = B + P + D                           (price per ISSUED unit)
6.4 levies (Decision 3/CMA.3): SoP 5% to Adaptation Fund, OMGE ≥2% cancelled
  sop_cost  = N × s/(1−s−o);  omge_cost = N × o/(1−s−o)
landed = N/(1−s−o) + txn + mrv  ==  B + P + D + sop + omge + txn + mrv   (exact, asserted by the endpoint's own components_sum_check)
```
**Worked example** — the endpoint's own Pydantic defaults, which are also the frontend form's
defaults (`base_credit_price_usd=12, mechanism='6.4_authorized', authorization_premium_pct=30,
ca_risk_score=30, max_ca_discount_pct=40, transaction_cost_usd=1.5, mrv_cost_usd=1.0,
domestic_abatement_cost_usd=60`), computed and numerically verified:

| Step | Computation | Result |
|---|---|---|
| Authorization premium `P` | 12 × 30% | **$3.60/t** |
| CA discount rate | (30/100) × (40/100) | 12.0% |
| CA discount `D` | −(12+3.60) × 0.12 | **−$1.872/t** |
| Net unit price `N` | 12 + 3.60 − 1.872 | **$13.728/t** |
| SoP cost (5%, denom 0.93) | 13.728 × 0.05/0.93 | **$0.7381/t** |
| OMGE cost (2%, denom 0.93) | 13.728 × 0.02/0.93 | **$0.2952/t** |
| Landed cost | 13.728/0.93 + 1.5 + 1.0 | **$17.2613/t** |
| Components-sum check | 12+3.6−1.872+0.7381+0.2952+1.5+1.0 | **$17.2613/t** ✓ (waterfall closes) |
| Issued units per delivered | 1/0.93 | 1.07527 |
| Buy-vs-abate | landed $17.26 < 90% × $60 abatement ($54) | **BUY** (import units), saving **$42.74/t** |

The gross-up `1/(1−s−o)` is the buyer funding enough *issued* A6.4ERs (1.0753 issued per 1
delivered) to net the mandatory 5%+2% levies at issuance — a real accounting mechanic of Decision
3/CMA.3, not a discretionary fee. The CA-risk discount mapping (linear in `ca_risk_score`) and the
authorization premium are explicitly labeled desk assumptions ("modeling assumption, labeled" /
"desk assumptions, not observed market quotes" in the endpoint's own `methodology` block) —
everything else in the waterfall (the levy rates and the gross-up arithmetic) is a real,
non-discretionary feature of the Article 6.4 rulebook.

### 7.5 Compliance-cost optimizer (`POST /compliance-cost`) — obligation + greedy offset clipping, worked

**Obligation by scheme type** (exact code):
```
cap_and_trade        : gross = max(0, covered_emissions − free_allocation)
intensity / baseline  : gross = max(0, covered_emissions − baseline_allowed)
carbon_tax            : gross = covered_emissions                         (free_allocation ignored)
```
**Offset cap** = `limit_pct_of_obligation × gross` (from the atlas's own `offset_rules`).
**Greedy algorithm** (schemes processed in **descending** carbon-price order; within a scheme,
eligible offset lots consumed **cheapest-first**, only while `lot.price < scheme.price`, clipped at
the scheme's own % cap and the remaining lot volume) — documented in the endpoint's own
`methodology.offset_optimization` field as "not a full LP but optimal when eligibility sets rarely
overlap."

**Worked clipping example** — using the frontend's own default illustrative entity
(`DEFAULT_POSITIONS`/`DEFAULT_OFFSETS` in the page, "Global Industrials Group (illustrative)"): the
**California-Quebec (WCI) position** is `covered = 300,000 t`, `free_allocation = 100,000 t` →
`gross = 200,000 t`. The scheme's offset rule caps CCO usage at **6% of obligation**:
`offset_cap = 0.06 × 200,000 = 12,000 t`. The offset portfolio holds **CCO at $15/t, 50,000 t
available** — comfortably cheaper than the scheme's $30/t carbon price, so every tonne of it
*would* be economic to use. But the greedy loop stops the moment `used_t` hits the cap:

| Quantity | Value |
|---|---|
| Gross obligation | 200,000 t |
| Offset cap (6% of gross) | **12,000 t** |
| CCO available (cheap, $15/t < $30/t scheme price) | 50,000 t |
| **CCO actually used (clipped by the cap, not by price or availability)** | **12,000 t** |
| CCO left unused in this scheme | 38,000 t |
| Residual obligation @ $30/t | 188,000 t × $30 = $5,640,000 |
| Offset cost | 12,000 t × $15 = $180,000 |
| Total scheme cost | $5,820,000 |
| Savings vs. no offsets | 12,000 × ($30−$15) = **$180,000** |

The 38,000 t of unused, cheaper-than-compliance CCO is the clip: it is not deployed further within
this request because CCO's `eligible_units` list (mirrored from `/schemes`) restricts it to
`wci_ca_qc` only — the shared inventory model consumes lots across schemes, but only where the
scheme's own `offset_rules.eligible_units` includes that unit type. **A related edge case surfaced
by the same default dataset**: the Australia Safeguard position (`ACCU` eligible, no % cap since
`limit_pct_of_obligation = 100.0`) prices ACCU at exactly $23/t against a scheme price of exactly
$23/t — the code's strict `if lot.price_usd >= price: continue` skip condition means an offset
priced **equal to** the compliance price is never used, even with zero % constraint and ample
volume. This is not a bug (the endpoint documents "only when offset price is below the scheme
carbon price"), but it is a boundary condition worth flagging: real-world desks would want a
tie-break or an epsilon rather than a strict inequality at parity pricing.

**Marginal cost** per scheme = `scheme price`, unless there is remaining offset-cap headroom AND a
cheaper eligible lot remains unconsumed, in which case marginal = that lot's price — i.e. the cost
of *one more* tonne of compliance, not the average cost shown in `total_cost_usd`.

### 7.6 Cross-border spread matrix & arbitrage candidates (`POST /cross-border`)

`scheme_spread_matrix[a][b] = price(a) − price(b)` over every scheme with a live price —
antisymmetric by construction (asserted in the response's own `matrix_property` field). An
**arbitrage candidate** is unit `u`, eligible in scheme `s` (per the hand-maintained
`UNIT_ELIGIBILITY` table mirroring `/schemes` offset rules), where
`net = scheme_price(s) − unit_price(u) − fungibility_haircut(u)` exceeds a user-set minimum
spread; `fungibility_haircut = unit_price × discount_pct` from a hand-authored, reasoned table
(`FUNGIBILITY_DISCOUNTS`) — e.g. EUA 0% (deepest, most liquid), CCER 60% ("no international
recognition; capital controls impede cross-border settlement"), VCM_NATURE 70% ("no compliance
surrender route... integrity re-rating risk"). Units not in the table get a documented 25% default
haircut. The endpoint explicitly caveats that this quantifies "the shadow value of segmentation, not
an executable trade" since compliance allowances are deliberately non-fungible across schemes.

### 7.7 Data provenance & limitations

- **Real, quoted-as-coded regulatory bases**: EU ETS LRF (4.3%/4.4%, Fit-for-55), MSR thresholds in
  the scheme atlas cross-reference the derivatives desk's MSR engine, CMA.3/CMA.4/CMA.6 decisions
  for Article 6.2/6.4, Decision 3/CMA.3's 5% SoP + 2% OMGE levies (used verbatim in the ITMO
  waterfall), CORSIA's 85%-of-2019 baseline and First Phase EEU authorization requirement.
  `EXTRACT_LABEL` ("regulatory extract, approximate parameters as of ~2025 — verify against current
  regulation for production") is attached to every atlas/Article-6 response.
- **Approximate, labeled prices**: every scheme's `price.usd_per_t` carries `approx: True` and an
  `as_of` range note (e.g. "EU ETS ~2025, typical range EUR 60-90"); several schemes (EU ETS2,
  India CCTS, Japan GX-ETS, Mexico pilot) have **no price at all** because none exists yet — the
  endpoint requires an explicit override rather than guessing one.
- **Desk modeling assumptions, clearly separated from the regulatory facts**: the ITMO
  authorization-premium %, CA-risk discount mapping, and the compliance-cost greedy ordering
  (documented as "optimal when eligibility sets rarely overlap," not a guaranteed-optimal LP) are
  all labeled in each endpoint's own `methodology` response block.
- The greedy compliance-cost optimizer can under-deploy cheap-but-capped offsets (§7.5's worked
  clip) and never uses offsets priced at or above the scheme's own carbon price, even at zero
  volume constraint — both are documented, deterministic consequences of the stated algorithm, not
  hidden behavior.
- The frontend's CBAM-interaction note explicitly flags that the compliance-cost optimizer
  "understates the value of domestic pricing for EU exporters" since it does not model CBAM
  deductibility of a paid domestic carbon price — a documented, honest limitation rather than a
  silent gap.

**Framework alignment:** Decision 2/CMA.3, 6/CMA.4, CMA.6 (Article 6.2 ITMOs) · Decision 3/CMA.3,
CMA.6 (Article 6.4 PACM, SoP 5%/OMGE 2%) · ICAO CORSIA Doc 9501 (First Phase 2024–2026) · EU
Directive (Fit-for-55) Phase 4 LRF · World Bank *State and Trends of Carbon Pricing 2024* / ICAP
*Status Report 2024* (global coverage KPIs, labeled approximate).

## 8 · Model Specification

**Status: implemented.** Every calculator (`/itmo-price`, `/compliance-cost`, `/cross-border`) is
live, deterministic Python in `backend/api/v1/routes/compliance_carbon.py`; the reference data
(`/schemes`, `/article6`) is a static, versioned, hand-authored extract served from the same file.

**8.1 Purpose & scope.** Give a multi-jurisdiction entity one desk to browse 13 national/
supranational compliance carbon mechanisms, price a single Article 6 unit landed-cost waterfall,
compute total compliance cost with optimal (greedy) offset deployment across simultaneous scheme
obligations, and screen compliance-vs-voluntary cross-market spreads under an explicit
non-fungibility caveat.

**8.2 Conceptual approach.** Reference data (scheme atlas, Article 6 rulebook) is a curated,
labeled regulatory extract rather than a live feed — appropriate because these parameters change on
a legislative cadence measured in years, not market ticks. The three calculators are closed-form:
a linear landed-cost waterfall with an exact-levy gross-up; a per-scheme obligation formula that
switches on scheme type, coupled to a greedy shared-inventory offset allocator; and an antisymmetric
pairwise price-spread matrix combined with a fungibility-discount-adjusted arbitrage screen.

**8.3 Mathematical specification.**
```
N        = B + B·p_auth + (−(B + B·p_auth)·(risk/100)·(maxDisc/100))
landed   = N/(1 − s − o) + txn + mrv                 s=0.05, o=0.02 for 6.4 units
gross    = max(0, emissions − free_alloc)             [cap-and-trade]
         = max(0, emissions − baseline_allowed)       [intensity / baseline-and-credit]
         = emissions                                  [carbon tax]
cap      = limit_pct × gross
used     = Σ min(lot.remaining, cap − used_so_far) over lots with price < scheme_price, ascending price
marginal = scheme_price, or cheapest remaining eligible lot price if cap headroom > 0 and it undercuts scheme_price
spread(a,b) = price(a) − price(b)
net_spread(u→s) = price(s) − price(u) − price(u)·haircut(u)
```

**8.4 Data requirements.** None beyond what is already embedded: the scheme atlas and Article 6
rulebook are static extracts requiring periodic manual refresh (labeled ~2025); the calculators take
only user-supplied positions, prices and unit portfolios as request bodies — there is no external
data dependency at request time.

**8.5 Validation & benchmarking.** Already implemented: the ITMO endpoint returns its own
`components_sum_check` so callers (and this deep-dive) can verify the waterfall closes exactly; the
cross-border endpoint asserts `matrix_property: antisymmetric` on every response. Recommended
external benchmark: periodically diff the scheme atlas's price/`cap_or_target`/`offset_rules`
fields against ICAP's Emissions Trading Worldwide status reports and each scheme regulator's
official bulletins (World Bank/ICAP are already the cited basis for the aggregate coverage KPIs).

**8.6 Limitations & model risk.** All scheme prices and several trajectory/cap details are
hand-authored ~2025 approximations pending verification, not live market or regulatory feeds — the
route's own docstring and every response payload say so. The greedy offset optimizer is documented
as non-optimal in the (rare) case of overlapping eligibility across schemes, and its strict
`price < scheme_price` condition never deploys an offset priced at parity with (or above) the
compliance instrument, even with unused cap headroom (§7.5). The compliance-cost view does not
model CBAM deductibility of domestic carbon prices for EU-bound exporters (flagged in-UI as a
documented limitation of the optimizer, not a silent gap). Cross-border "arbitrage" figures quantify
a shadow value under a stated fungibility haircut, not an executable trade, since compliance units
are legally non-fungible across schemes.

## 9 · Future Evolution

### 9.1 Evolution A — LP-optimal compliance planning over live allowance prices (analytics ladder: rung 3 → 5)

**What.** The desk is a platform flagship done right: 13 hand-authored scheme extracts
with `approx`/`confidence` labelling, honest `None` prices for pre-market schemes
(HTTP 422 rather than fabrication), real CMA decision citations in the Article 6
rulebook, and deterministic calculators whose `methodology` blocks self-document —
§8 status "implemented". Its own docs name the two ceilings: the compliance-cost
optimizer is greedy ("not a full LP but optimal when eligibility sets rarely
overlap"), and the ~2025 price levels are approximate as-of snapshots. Evolution A
lifts both: true optimization and a live price feed.

**How.** (1) LP upgrade: replace the greedy offset-clipping loop in
`POST /compliance-cost` with scipy `linprog` over lots × schemes, respecting each
scheme's `limit_pct_of_obligation` and eligibility sets — exactly the overlapping-
eligibility case the greedy admits it can miss; keep the greedy as a cross-check and
report both when they diverge. (2) Multi-year: banking/borrowing across compliance
periods using the atlas's own cap trajectories (EU ETS LRF 4.3→4.4%/yr, Safeguard
4.9%/yr decline), turning single-period cost into a compliance *plan*. (3) Prices:
scheduled ingest of EU ETS (EEX/ICE public settlement) and CCA/RGGI auction results
into a price table with `as_of` stamps, replacing the approximate levels while keeping
the desk's labelling discipline for schemes without markets. (4) Pin the WCI 12,000 t
clipping worked example in `bench_quant.py`.

**Prerequisites.** Coordination with the shared `carbon_price_ets_engine` (blast
radius 21, used by 2 modules); an auction-result ingest owner. **Acceptance:** LP and
greedy agree on the non-overlapping default case; a constructed overlapping-
eligibility case shows the LP strictly cheaper; every price in a response carries its
`as_of` date.

### 9.2 Evolution B — Article 6 / multi-scheme compliance analyst (LLM tier 2)

**What.** This desk's 25 endpoints and honest reference layer make it the best-
grounded tier-2 candidate in the carbon domain. The analyst answers desk questions by
tool call: "what's my 2027 obligation across EU ETS and K-ETS if free allocation
halves?" → `POST /compliance-cost` with modified positions; "price an ITMO from a
Ghana cookstove programme with corresponding adjustment" → `POST /itmo-price`, then
explains the waterfall using the rulebook's own numbers (6.4's mandatory 5% SoP and 2%
OMGE, which the code carries as s=0.05/o=0.02); scheme questions ("can I use CCOs
beyond 6%?") answer from `GET /schemes`' `offset_rules` verbatim.

**How.** Tool schemas from the desk's OpenAPI operations plus the sibling
`carbon-price-ets` and `dcm` route families already mapped to this module; the
`methodology` blocks every calculator returns become the copilot's explanation
source — it quotes the engine's own assumptions rather than reconstructing them. The
scheme atlas's `confidence`/`notes` fields flow into answers so uncertainty labelling
survives the LLM hop. Fabrication validator on all $/t and tonnage figures.

**Prerequisites.** Complete harness fixtures for the three skipped POSTs
(`/compliance-cost`, `/cross-border`, `/itmo-price` were never swept live); prompt
rules preserving the desk's no-fabrication policy for pre-market schemes (the analyst
must relay the 422-with-override contract, not invent a China ETS2 price).
**Acceptance:** every numeric in an answer traces to a tool response or a quoted
scheme field; asked for a price the atlas holds as `None`, the analyst explains the
override requirement instead of estimating.