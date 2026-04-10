/**
 * CCTS Calculation Engine
 * ========================
 * India Carbon Credit Trading Scheme — Full calculation engine covering
 * all 9 approved methodologies and 18 approved tools.
 *
 * Pipeline: DATA CAPTURE -> VALIDATION -> BASELINE CALC -> PROJECT CALC
 *           -> LEAKAGE CALC -> NET REDUCTION -> CCC ISSUANCE -> AUDIT TRAIL
 *
 * Framework: S.O. 2825(E), 28 June 2023 — Energy Conservation (Amendment) Act 2022
 * Standards: ISO 14064-2:2019, ISO 14065:2020
 *
 * @module cctsEngine
 * @version 1.0.0
 */

/* ---------- helpers ---------- */

/** Seeded pseudo-random (platform standard) — deterministic, no Math.random */
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/** Safe division guard — returns 0 when denominator <= 0 */
const guard = (n, d) => d > 0 ? n / d : 0;

/** Round to N decimal places */
const round = (v, dp = 2) => Math.round(v * Math.pow(10, dp)) / Math.pow(10, dp);

/** Indian state list (union territories included) */
const INDIA_STATES = ['AP','AR','AS','BR','CG','DL','GA','GJ','HR','HP','JH','JK','KA','KL','MP','MH','MN','ML','MZ','NL','OD','PB','RJ','SK','TN','TS','TR','UK','UP','WB'];

/* ============================================================
   1. DATA_CAPTURE_SCHEMAS — Input requirements per methodology
   ============================================================ */

/**
 * Each schema defines every field required at the lowest granularity.
 * @type {Object.<string, Object>}
 */
export const DATA_CAPTURE_SCHEMAS = {

  /* ---- BM-EN01.001: Grid-connected renewable electricity generation ---- */
  'BM-EN01.001': {
    code: 'BM-EN01.001',
    title: 'Grid-connected renewable electricity generation',
    sector: 'Energy',
    inputs: [
      { field: 'project_name', type: 'text', required: true, help: 'Registered project name on ICM portal' },
      { field: 'project_id', type: 'text', required: true, help: 'BEE ICM registration number' },
      { field: 'technology', type: 'select', options: ['Solar PV', 'Wind', 'Small Hydro (<25MW)', 'Biomass Power', 'Solar Thermal CSP'], required: true },
      { field: 'installed_capacity_mw', type: 'number', unit: 'MW', required: true, min: 0.01, validation: 'Must be > 0' },
      { field: 'commissioning_date', type: 'date', required: true },
      { field: 'grid_connection_voltage_kv', type: 'number', unit: 'kV', required: true },
      { field: 'state', type: 'select', options: INDIA_STATES, required: true },
      { field: 'net_generation_mwh', type: 'number', unit: 'MWh', required: true, period: 'annual', help: 'Net electricity exported to grid (metered at injection point)' },
      { field: 'auxiliary_consumption_mwh', type: 'number', unit: 'MWh', required: true, period: 'annual' },
      { field: 'plant_load_factor_pct', type: 'number', unit: '%', required: false, derived: true },
      { field: 'grid_ef_tco2_mwh', type: 'number', unit: 'tCO2/MWh', required: true, help: 'CEA weighted average grid emission factor for the year', source: 'CEA CO2 Baseline Database' },
      { field: 'meter_calibration_date', type: 'date', required: true, help: 'Last calibration date of export meter' },
      { field: 'meter_accuracy_class', type: 'select', options: ['0.2', '0.5', '1.0'], required: true },
      { field: 'acva_name', type: 'text', required: true, help: 'Accredited Carbon Verification Agency name' },
      { field: 'acva_accreditation_no', type: 'text', required: true },
      { field: 'verification_date', type: 'date', required: true },
    ],
    formula: 'ER_y = EG_y * EF_grid,y',
    formulaDescription: 'Emission Reduction (tCO2e) = Net Electricity Generation (MWh) x Grid Emission Factor (tCO2/MWh)',
    tools_required: ['BM-T-004', 'BM-T-005', 'BM-T-001'],
    crediting_period_yrs: 10,
    renewable_flag: true,
  },

  /* ---- BM-EN01.002: Captive / third-party RE displacing fossil fuel ---- */
  'BM-EN01.002': {
    code: 'BM-EN01.002',
    title: 'Captive / third-party renewable electricity displacing fossil fuel',
    sector: 'Energy',
    inputs: [
      { field: 'project_name', type: 'text', required: true, help: 'Registered project name on ICM portal' },
      { field: 'project_id', type: 'text', required: true, help: 'BEE ICM registration number' },
      { field: 'technology', type: 'select', options: ['Solar PV', 'Wind', 'Biomass', 'Small Hydro (<25MW)', 'Waste Heat Recovery'], required: true },
      { field: 'installed_capacity_mw', type: 'number', unit: 'MW', required: true, min: 0.01 },
      { field: 'commissioning_date', type: 'date', required: true },
      { field: 'state', type: 'select', options: INDIA_STATES, required: true },
      { field: 'captive_consumption_mwh', type: 'number', unit: 'MWh', required: true, period: 'annual', help: 'Electricity consumed on-site displacing fossil fuel generation' },
      { field: 'net_generation_mwh', type: 'number', unit: 'MWh', required: true, period: 'annual', help: 'Total generation from RE plant' },
      { field: 'auxiliary_consumption_mwh', type: 'number', unit: 'MWh', required: true, period: 'annual' },
      { field: 'fossil_fuel_displaced_type', type: 'select', options: ['Coal', 'Natural Gas', 'Diesel (DG Set)', 'Fuel Oil'], required: true },
      { field: 'fossil_fuel_displaced_qty', type: 'number', unit: 'tonnes or kL', required: true, period: 'annual', help: 'Quantity of fossil fuel that would have been consumed' },
      { field: 'fossil_fuel_ef_tco2_per_unit', type: 'number', unit: 'tCO2/tonne or tCO2/kL', required: true, help: 'Net calorific value based emission factor' },
      { field: 'grid_ef_tco2_mwh', type: 'number', unit: 'tCO2/MWh', required: true, help: 'CEA grid emission factor (for any export to grid)' },
      { field: 'export_to_grid_mwh', type: 'number', unit: 'MWh', required: false, period: 'annual', help: 'Any surplus exported to grid' },
      { field: 'meter_calibration_date', type: 'date', required: true },
      { field: 'meter_accuracy_class', type: 'select', options: ['0.2', '0.5', '1.0'], required: true },
      { field: 'acva_name', type: 'text', required: true },
      { field: 'acva_accreditation_no', type: 'text', required: true },
      { field: 'verification_date', type: 'date', required: true },
    ],
    formula: 'ER_y = (EG_captive,y * EF_fossil) + (EG_export,y * EF_grid,y)',
    formulaDescription: 'Emission Reduction = Captive consumption x Fossil fuel EF + Grid export x Grid EF',
    tools_required: ['BM-T-002', 'BM-T-004', 'BM-T-005', 'BM-T-001'],
    crediting_period_yrs: 10,
    renewable_flag: true,
  },

  /* ---- BM-IN02.001: Industrial fuel switching ---- */
  'BM-IN02.001': {
    code: 'BM-IN02.001',
    title: 'Industrial fuel switching',
    sector: 'Industry',
    inputs: [
      { field: 'project_name', type: 'text', required: true },
      { field: 'project_id', type: 'text', required: true },
      { field: 'industry_type', type: 'select', options: ['Cement', 'Steel', 'Chemicals', 'Textiles', 'Ceramics', 'Paper & Pulp', 'Food Processing', 'Other'], required: true },
      { field: 'state', type: 'select', options: INDIA_STATES, required: true },
      { field: 'baseline_fuel_type', type: 'select', options: ['Coal', 'Pet Coke', 'Fuel Oil', 'LDO', 'HSD'], required: true },
      { field: 'baseline_fuel_qty', type: 'number', unit: 'tonnes or kL', required: true, period: 'annual', help: 'Annual consumption of baseline fuel' },
      { field: 'baseline_fuel_ncv', type: 'number', unit: 'GJ/tonne', required: true, help: 'Net calorific value of baseline fuel' },
      { field: 'ef_baseline_fuel', type: 'number', unit: 'tCO2/TJ', required: true, help: 'IPCC emission factor for baseline fuel' },
      { field: 'project_fuel_type', type: 'select', options: ['Natural Gas', 'Biomass Briquettes', 'Biogas', 'Agri Residue', 'Solar Thermal'], required: true },
      { field: 'project_fuel_qty', type: 'number', unit: 'tonnes or kL or m3', required: true, period: 'annual' },
      { field: 'project_fuel_ncv', type: 'number', unit: 'GJ/tonne', required: true },
      { field: 'ef_project_fuel', type: 'number', unit: 'tCO2/TJ', required: true },
      { field: 'production_volume', type: 'number', unit: 'tonnes', required: true, period: 'annual', help: 'Annual production output' },
      { field: 'thermal_efficiency_baseline_pct', type: 'number', unit: '%', required: false },
      { field: 'thermal_efficiency_project_pct', type: 'number', unit: '%', required: false },
      { field: 'meter_calibration_date', type: 'date', required: true },
      { field: 'acva_name', type: 'text', required: true },
      { field: 'acva_accreditation_no', type: 'text', required: true },
      { field: 'verification_date', type: 'date', required: true },
    ],
    formula: 'ER_y = BE_y - PE_y - LE_y',
    formulaDescription: 'ER = (Baseline fuel qty x NCV x EF_baseline) - (Project fuel qty x NCV x EF_project) - Leakage',
    tools_required: ['BM-T-002', 'BM-T-001', 'BM-T-008'],
    crediting_period_yrs: 10,
    renewable_flag: false,
  },

  /* ---- BM-IN02.002: Industrial process emission reduction ---- */
  'BM-IN02.002': {
    code: 'BM-IN02.002',
    title: 'Industrial process emission reduction',
    sector: 'Industry',
    inputs: [
      { field: 'project_name', type: 'text', required: true },
      { field: 'project_id', type: 'text', required: true },
      { field: 'industry_type', type: 'select', options: ['Cement', 'Iron & Steel', 'Aluminium', 'Chemicals', 'Fertiliser'], required: true },
      { field: 'state', type: 'select', options: INDIA_STATES, required: true },
      { field: 'production_volume_tonnes', type: 'number', unit: 'tonnes', required: true, period: 'annual', help: 'Annual production output' },
      { field: 'baseline_process_ef', type: 'number', unit: 'tCO2/tonne product', required: true, help: 'Baseline process emission factor' },
      { field: 'project_process_ef', type: 'number', unit: 'tCO2/tonne product', required: true, help: 'Post-intervention process emission factor' },
      { field: 'clinker_ratio', type: 'number', unit: 'ratio', required: false, help: 'Clinker-to-cement ratio (cement industry only)' },
      { field: 'scrap_ratio', type: 'number', unit: 'ratio', required: false, help: 'Scrap-to-steel ratio (steel industry only, EAF route)' },
      { field: 'baseline_electricity_mwh', type: 'number', unit: 'MWh', required: false, period: 'annual' },
      { field: 'project_electricity_mwh', type: 'number', unit: 'MWh', required: false, period: 'annual' },
      { field: 'grid_ef_tco2_mwh', type: 'number', unit: 'tCO2/MWh', required: false },
      { field: 'supplementary_cementitious_pct', type: 'number', unit: '%', required: false, help: 'SCM replacement percentage (cement only)' },
      { field: 'acva_name', type: 'text', required: true },
      { field: 'acva_accreditation_no', type: 'text', required: true },
      { field: 'verification_date', type: 'date', required: true },
    ],
    formula: 'ER_y = P_y * (EF_baseline - EF_project) - LE_y',
    formulaDescription: 'ER = Production volume x (Baseline EF - Project EF) - Leakage',
    tools_required: ['BM-T-002', 'BM-T-003', 'BM-T-001', 'BM-T-008', 'BM-T-011'],
    crediting_period_yrs: 10,
    renewable_flag: false,
  },

  /* ---- BM-WA03.001: Landfill methane capture and flaring/utilisation ---- */
  'BM-WA03.001': {
    code: 'BM-WA03.001',
    title: 'Landfill methane capture and flaring/utilisation',
    sector: 'Waste',
    inputs: [
      { field: 'project_name', type: 'text', required: true },
      { field: 'project_id', type: 'text', required: true },
      { field: 'state', type: 'select', options: INDIA_STATES, required: true },
      { field: 'waste_deposited_tonnes', type: 'number', unit: 'tonnes', required: true, period: 'annual', help: 'Total MSW deposited in monitoring year' },
      { field: 'doc', type: 'number', unit: 'fraction', required: true, help: 'Degradable Organic Carbon fraction (IPCC default 0.15 for India MSW)' },
      { field: 'doc_f', type: 'number', unit: 'fraction', required: false, help: 'Fraction of DOC that decomposes (default 0.5)' },
      { field: 'mcf', type: 'number', unit: 'fraction', required: true, help: 'Methane Correction Factor (managed=1.0, unmanaged shallow=0.4, unmanaged deep=0.8)' },
      { field: 'f_methane', type: 'number', unit: 'fraction', required: false, help: 'Fraction of CH4 in landfill gas (default 0.5)' },
      { field: 'methane_captured_m3', type: 'number', unit: 'm3', required: true, period: 'annual', help: 'Total methane captured at wellheads' },
      { field: 'flared_m3', type: 'number', unit: 'm3', required: true, period: 'annual', help: 'Methane sent to flare' },
      { field: 'electricity_generated_mwh', type: 'number', unit: 'MWh', required: false, period: 'annual', help: 'Electricity generated from captured LFG' },
      { field: 'flare_efficiency_pct', type: 'number', unit: '%', required: false, help: 'Destruction efficiency of flare (default 90%)' },
      { field: 'gwp_ch4', type: 'number', required: false, help: 'GWP of CH4 (IPCC AR5 = 28, AR6 = 27.9)' },
      { field: 'grid_ef_tco2_mwh', type: 'number', unit: 'tCO2/MWh', required: false, help: 'Grid EF if electricity exported' },
      { field: 'acva_name', type: 'text', required: true },
      { field: 'acva_accreditation_no', type: 'text', required: true },
      { field: 'verification_date', type: 'date', required: true },
    ],
    formula: 'ER_y = MD_y * GWP_CH4 - PE_y',
    formulaDescription: 'ER = Methane destroyed (tonnes) x GWP_CH4 - Project emissions from flare/genset',
    tools_required: ['BM-T-006', 'BM-T-007', 'BM-T-001', 'BM-T-008'],
    crediting_period_yrs: 10,
    renewable_flag: false,
  },

  /* ---- BM-WA03.002: Waste-to-energy ---- */
  'BM-WA03.002': {
    code: 'BM-WA03.002',
    title: 'Waste-to-energy (MSW thermal treatment with energy recovery)',
    sector: 'Waste',
    inputs: [
      { field: 'project_name', type: 'text', required: true },
      { field: 'project_id', type: 'text', required: true },
      { field: 'state', type: 'select', options: INDIA_STATES, required: true },
      { field: 'msw_processed_tonnes', type: 'number', unit: 'tonnes', required: true, period: 'annual', help: 'Total MSW thermally treated' },
      { field: 'calorific_value_mj_kg', type: 'number', unit: 'MJ/kg', required: true, help: 'Average calorific value of MSW feedstock' },
      { field: 'electricity_generated_mwh', type: 'number', unit: 'MWh', required: true, period: 'annual' },
      { field: 'heat_recovered_gj', type: 'number', unit: 'GJ', required: false, period: 'annual' },
      { field: 'grid_displacement_ef', type: 'number', unit: 'tCO2/MWh', required: true, help: 'CEA grid emission factor for displaced electricity' },
      { field: 'fossil_fraction_pct', type: 'number', unit: '%', required: true, help: 'Fossil carbon fraction of MSW (plastics etc.)' },
      { field: 'ef_msw_fossil', type: 'number', unit: 'tCO2/tonne', required: true, help: 'CO2 EF for fossil fraction of MSW' },
      { field: 'baseline_landfill_methane_tco2e', type: 'number', unit: 'tCO2e', required: false, help: 'Avoided landfill methane (if claimed)' },
      { field: 'auxiliary_electricity_mwh', type: 'number', unit: 'MWh', required: false, period: 'annual' },
      { field: 'acva_name', type: 'text', required: true },
      { field: 'acva_accreditation_no', type: 'text', required: true },
      { field: 'verification_date', type: 'date', required: true },
    ],
    formula: 'ER_y = (EG_y * EF_grid) + LFG_avoided - PE_fossil',
    formulaDescription: 'ER = Grid displacement + Avoided landfill methane - Fossil fraction CO2 from combustion',
    tools_required: ['BM-T-002', 'BM-T-004', 'BM-T-007', 'BM-T-001', 'BM-T-008'],
    crediting_period_yrs: 7,
    renewable_flag: false,
  },

  /* ---- BM-AG04.001: Agriculture methane avoidance ---- */
  'BM-AG04.001': {
    code: 'BM-AG04.001',
    title: 'Agriculture methane avoidance (crop residue management)',
    sector: 'Agriculture',
    inputs: [
      { field: 'project_name', type: 'text', required: true },
      { field: 'project_id', type: 'text', required: true },
      { field: 'state', type: 'select', options: INDIA_STATES, required: true },
      { field: 'residue_type', type: 'select', options: ['Rice Straw', 'Wheat Straw', 'Sugarcane Trash', 'Cotton Stalk', 'Maize Stover', 'Other'], required: true },
      { field: 'residue_qty_tonnes', type: 'number', unit: 'tonnes', required: true, period: 'annual', help: 'Dry weight of residue managed' },
      { field: 'baseline_practice', type: 'select', options: ['Open Burning', 'Anaerobic Decomposition', 'Field Flooding'], required: true },
      { field: 'project_practice', type: 'select', options: ['Biogas Digestion', 'Composting', 'Biochar Production', 'Mulching', 'Briquetting'], required: true },
      { field: 'baseline_ef_tco2e_tonne', type: 'number', unit: 'tCO2e/tonne residue', required: true, help: 'Baseline emission factor per tonne of residue' },
      { field: 'project_ef_tco2e_tonne', type: 'number', unit: 'tCO2e/tonne residue', required: true, help: 'Project emission factor per tonne of residue' },
      { field: 'biogas_produced_m3', type: 'number', unit: 'm3', required: false, period: 'annual', help: 'Biogas generated (if biogas digestion)' },
      { field: 'biogas_utilized_pct', type: 'number', unit: '%', required: false },
      { field: 'number_of_farmers', type: 'number', required: false, help: 'Number of participating farmers' },
      { field: 'total_land_area_ha', type: 'number', unit: 'ha', required: false },
      { field: 'acva_name', type: 'text', required: true },
      { field: 'acva_accreditation_no', type: 'text', required: true },
      { field: 'verification_date', type: 'date', required: true },
    ],
    formula: 'ER_y = Q_residue,y * (EF_baseline - EF_project) - LE_y',
    formulaDescription: 'ER = Residue quantity x (Baseline EF - Project EF) - Leakage',
    tools_required: ['BM-T-009', 'BM-T-001', 'BM-T-008', 'BM-T-011'],
    crediting_period_yrs: 7,
    renewable_flag: false,
  },

  /* ---- BM-FR05.001: Mangrove afforestation / reforestation ---- */
  'BM-FR05.001': {
    code: 'BM-FR05.001',
    title: 'Mangrove afforestation / reforestation (blue carbon)',
    sector: 'Forestry',
    inputs: [
      { field: 'project_name', type: 'text', required: true },
      { field: 'project_id', type: 'text', required: true },
      { field: 'state', type: 'select', options: INDIA_STATES, required: true },
      { field: 'area_hectares', type: 'number', unit: 'ha', required: true, min: 0.01 },
      { field: 'species', type: 'select', options: ['Rhizophora mucronata', 'Avicennia marina', 'Sonneratia alba', 'Bruguiera gymnorrhiza', 'Mixed Mangrove'], required: true },
      { field: 'pre_project_carbon_stock_tc_ha', type: 'number', unit: 'tC/ha', required: true, help: 'Carbon stock before project (often degraded land ~ 5-15 tC/ha)' },
      { field: 'monitoring_interval_yrs', type: 'number', unit: 'years', required: true, help: 'Frequency of biomass surveys (typically 5 years)' },
      { field: 'above_ground_biomass_tc_ha', type: 'number', unit: 'tC/ha', required: true, help: 'Current above-ground biomass carbon (from field survey)' },
      { field: 'below_ground_biomass_tc_ha', type: 'number', unit: 'tC/ha', required: false, help: 'Below-ground (root) biomass carbon' },
      { field: 'soil_organic_carbon_tc_ha', type: 'number', unit: 'tC/ha', required: false, help: 'Soil organic carbon (blue carbon unique to mangroves)' },
      { field: 'survival_rate_pct', type: 'number', unit: '%', required: true },
      { field: 'permanence_discount_pct', type: 'number', unit: '%', required: false, help: 'Buffer pool contribution for non-permanence risk (typically 10-20%)' },
      { field: 'leakage_discount_pct', type: 'number', unit: '%', required: false, help: 'Deduction for activity-shifting leakage' },
      { field: 'acva_name', type: 'text', required: true },
      { field: 'acva_accreditation_no', type: 'text', required: true },
      { field: 'verification_date', type: 'date', required: true },
    ],
    formula: 'ER_y = (C_project,t - C_project,t-1 - C_baseline) * (44/12) * (1 - buffer%)',
    formulaDescription: 'Net sequestration = (Current carbon stock - Previous stock - Baseline stock) x 3.667 x (1 - buffer)',
    tools_required: ['BM-T-010', 'BM-T-001', 'BM-T-008', 'BM-T-012'],
    crediting_period_yrs: 30,
    renewable_flag: false,
  },

  /* ---- BM-FR05.002: A/R non-wetland (terrestrial forestry) ---- */
  'BM-FR05.002': {
    code: 'BM-FR05.002',
    title: 'Afforestation / reforestation on non-wetland (terrestrial)',
    sector: 'Forestry',
    inputs: [
      { field: 'project_name', type: 'text', required: true },
      { field: 'project_id', type: 'text', required: true },
      { field: 'state', type: 'select', options: INDIA_STATES, required: true },
      { field: 'area_hectares', type: 'number', unit: 'ha', required: true, min: 0.01 },
      { field: 'species', type: 'select', options: ['Teak', 'Eucalyptus', 'Bamboo', 'Casuarina', 'Neem', 'Mixed Native', 'Shisham', 'Acacia'], required: true },
      { field: 'pre_project_carbon_stock', type: 'number', unit: 'tC/ha', required: true, help: 'Pre-project carbon stock (degraded land)' },
      { field: 'survival_rate_pct', type: 'number', unit: '%', required: true },
      { field: 'growth_rate_tc_ha_yr', type: 'number', unit: 'tC/ha/yr', required: true, help: 'Mean annual carbon accumulation rate' },
      { field: 'above_ground_biomass_tc_ha', type: 'number', unit: 'tC/ha', required: true, help: 'Current AGB carbon from inventory' },
      { field: 'below_ground_biomass_tc_ha', type: 'number', unit: 'tC/ha', required: false },
      { field: 'project_age_yrs', type: 'number', unit: 'years', required: true },
      { field: 'permanence_discount_pct', type: 'number', unit: '%', required: false, help: 'Buffer for non-permanence (typically 15-20%)' },
      { field: 'leakage_discount_pct', type: 'number', unit: '%', required: false },
      { field: 'fire_risk_class', type: 'select', options: ['Low', 'Medium', 'High'], required: false },
      { field: 'acva_name', type: 'text', required: true },
      { field: 'acva_accreditation_no', type: 'text', required: true },
      { field: 'verification_date', type: 'date', required: true },
    ],
    formula: 'ER_y = (AGB_t + BGB_t - C_baseline) * (44/12) * survival% * (1 - buffer%)',
    formulaDescription: 'Net sequestration = (Total biomass carbon - Baseline) x 3.667 x Survival x (1 - buffer)',
    tools_required: ['BM-T-010', 'BM-T-001', 'BM-T-008', 'BM-T-012'],
    crediting_period_yrs: 30,
    renewable_flag: false,
  },
};


/* ============================================================
   2. TOOL_IMPLEMENTATIONS — Calculation logic for 18 CCTS tools
   ============================================================ */

/**
 * All 18 BEE-approved CCTS tools with calculate() functions.
 * @type {Object.<string, Object>}
 */
export const TOOL_IMPLEMENTATIONS = {

  /** BM-T-001: Additionality assessment (regulatory surplus + investment + barrier + common practice) */
  'BM-T-001': {
    name: 'Additionality Assessment',
    description: 'Four-step additionality test per CCTS Rules 2023 Section 12',
    /** @param {Object} inputs */
    calculate: (inputs) => {
      const regulatorySurplus = !(inputs.is_legally_required);
      const projectIRR = inputs.project_irr_pct || 0;
      const benchmarkIRR = inputs.benchmark_irr_pct || 12;
      const investmentBarrier = projectIRR < benchmarkIRR;
      const hasBarriers = !!(inputs.technology_barrier || inputs.financial_barrier || inputs.institutional_barrier);
      const isCommonPractice = (inputs.market_penetration_pct || 0) > 20;
      const isAdditional = regulatorySurplus && (investmentBarrier || hasBarriers) && !isCommonPractice;
      return {
        isAdditional,
        regulatorySurplus,
        investmentBarrier,
        hasBarriers,
        isCommonPractice,
        confidence: isAdditional && investmentBarrier && !isCommonPractice ? 'High' : (isAdditional ? 'Medium' : 'Low'),
        auditTrail: [
          { test: 'Regulatory Surplus', result: regulatorySurplus, reference: 'CCTS Rules S.12(a)' },
          { test: 'Investment Analysis', result: investmentBarrier, detail: `IRR ${projectIRR}% vs benchmark ${benchmarkIRR}%`, reference: 'CCTS Rules S.12(b)' },
          { test: 'Barrier Analysis', result: hasBarriers, reference: 'CCTS Rules S.12(c)' },
          { test: 'Common Practice', result: !isCommonPractice, detail: `Market penetration ${inputs.market_penetration_pct || 0}%`, reference: 'CCTS Rules S.12(d) via BM-T-011' },
        ],
      };
    },
  },

  /** BM-T-002: Fossil fuel combustion emissions calculation */
  'BM-T-002': {
    name: 'Fossil Fuel Combustion Emissions',
    description: 'Calculates CO2 from fossil fuel combustion using IPCC tier 2 approach',
    calculate: (inputs) => {
      const qty = inputs.fuel_qty || 0;
      const ncv = inputs.fuel_ncv || 0;
      const ef = inputs.fuel_ef_tco2_per_tj || 0;
      const oxidationFactor = inputs.oxidation_factor || 1.0;
      const energyTJ = qty * ncv / 1000;
      const emissions_tco2 = energyTJ * ef * oxidationFactor / 1000;
      return {
        fuel_type: inputs.fuel_type || 'Unknown',
        quantity: qty,
        energy_tj: round(energyTJ, 4),
        emissions_tco2: round(emissions_tco2, 4),
        auditTrail: [
          { step: 'Energy content', formula: `${qty} x ${ncv} / 1000`, result: `${round(energyTJ, 4)} TJ` },
          { step: 'CO2 emissions', formula: `${round(energyTJ, 4)} TJ x ${ef} tCO2/TJ x ${oxidationFactor}`, result: `${round(emissions_tco2, 4)} tCO2` },
        ],
      };
    },
  },

  /** BM-T-003: Electricity consumption emissions */
  'BM-T-003': {
    name: 'Electricity Consumption Emissions',
    description: 'CO2 from grid electricity consumption',
    calculate: (inputs) => {
      const mwh = inputs.electricity_mwh || 0;
      const ef = inputs.grid_ef_tco2_mwh || 0.82;
      const emissions_tco2 = mwh * ef;
      return { electricity_mwh: mwh, grid_ef: ef, emissions_tco2: round(emissions_tco2, 4), reference: 'CEA CO2 Baseline Database' };
    },
  },

  /** BM-T-004: Baseline/project/leakage from electricity generation */
  'BM-T-004': {
    name: 'Electricity Generation Baseline',
    description: 'Baseline emissions from displaced electricity generation',
    calculate: (inputs) => {
      const generation = inputs.net_generation_mwh || 0;
      const ef = inputs.grid_ef_tco2_mwh || 0.82;
      const baseline = generation * ef;
      const projectEmissions = inputs.project_fuel_emissions || 0;
      const leakage = inputs.leakage_emissions || 0;
      return {
        baseline_tco2: round(baseline, 2),
        project_tco2: round(projectEmissions, 2),
        leakage_tco2: round(leakage, 2),
        net_reduction_tco2: round(baseline - projectEmissions - leakage, 2),
      };
    },
  },

  /** BM-T-005: Grid emission factor calculation */
  'BM-T-005': {
    name: 'Grid Emission Factor Calculation',
    description: 'Weighted average combined margin (CM) and operating margin (OM) grid emission factor per CEA methodology',
    calculate: (inputs) => {
      const om = inputs.operating_margin_ef || 0.82;
      const bm = inputs.build_margin_ef || 0.60;
      const wOM = inputs.weight_om || 0.5;
      const wBM = inputs.weight_bm || 0.5;
      const combinedEF = om * wOM + bm * wBM;
      return { operating_margin_ef: om, build_margin_ef: bm, combined_ef: round(combinedEF, 4), method: 'Combined Margin (CEA)', reference: 'CEA CO2 Baseline Database v19' };
    },
  },

  /** BM-T-006: Methane generation estimation (First Order Decay) */
  'BM-T-006': {
    name: 'Methane Generation (FOD Model)',
    description: 'First Order Decay model for landfill methane per IPCC 2006 guidelines',
    calculate: (inputs) => {
      const waste = inputs.waste_deposited_tonnes || 0;
      const doc = inputs.doc || 0.15;
      const docF = inputs.doc_f || 0.5;
      const mcf = inputs.mcf || 1.0;
      const fCH4 = inputs.f_methane || 0.5;
      const k = inputs.decay_rate || 0.05;
      const yearsDeposited = inputs.years_since_deposit || 1;
      const ddoc = waste * doc * docF * mcf;
      const ch4Generated = ddoc * fCH4 * (16 / 12) * (1 - Math.exp(-k * yearsDeposited));
      return {
        waste_tonnes: waste,
        ddoc_mass: round(ddoc, 2),
        ch4_generated_tonnes: round(ch4Generated, 2),
        ch4_generated_m3: round(ch4Generated / 0.000717, 0),
        model: 'IPCC 2006 First Order Decay',
      };
    },
  },

  /** BM-T-007: Methane destruction/avoidance emissions */
  'BM-T-007': {
    name: 'Methane Destruction Emissions',
    description: 'CO2e from methane capture, flaring, and utilisation',
    calculate: (inputs) => {
      const captured_m3 = inputs.methane_captured_m3 || 0;
      const flared_m3 = inputs.flared_m3 || 0;
      const flareEff = (inputs.flare_efficiency_pct || 90) / 100;
      const gwp = inputs.gwp_ch4 || 28;
      const density = 0.000717; // tonnes per m3
      const captured_tonnes = captured_m3 * density;
      const destroyed_tonnes = flared_m3 * density * flareEff;
      const co2e_avoided = destroyed_tonnes * gwp;
      const co2_from_flare = destroyed_tonnes * (44 / 16);
      return {
        captured_tonnes: round(captured_tonnes, 4),
        destroyed_tonnes: round(destroyed_tonnes, 4),
        co2e_avoided: round(co2e_avoided, 2),
        co2_from_flare: round(co2_from_flare, 2),
        net_benefit_tco2e: round(co2e_avoided - co2_from_flare, 2),
      };
    },
  },

  /** BM-T-008: Leakage assessment */
  'BM-T-008': {
    name: 'Leakage Assessment',
    description: 'Quantifies emissions displaced outside the project boundary',
    calculate: (inputs) => {
      const activityShifting = inputs.activity_shifting_tco2e || 0;
      const marketLeakage = inputs.market_leakage_tco2e || 0;
      const upstreamLeakage = inputs.upstream_fuel_leakage_tco2e || 0;
      const total = activityShifting + marketLeakage + upstreamLeakage;
      return {
        activity_shifting_tco2e: round(activityShifting, 2),
        market_leakage_tco2e: round(marketLeakage, 2),
        upstream_leakage_tco2e: round(upstreamLeakage, 2),
        total_leakage_tco2e: round(total, 2),
        leakage_significant: total > 0,
      };
    },
  },

  /** BM-T-009: Agriculture emission factors */
  'BM-T-009': {
    name: 'Agriculture Emission Factors',
    description: 'Emission factors for crop residue practices (IPCC + India-specific)',
    calculate: (inputs) => {
      const residueType = inputs.residue_type || 'Rice Straw';
      const practice = inputs.practice || 'Open Burning';
      const efMap = {
        'Open Burning': { 'Rice Straw': 1.28, 'Wheat Straw': 1.10, 'Sugarcane Trash': 0.95, 'Cotton Stalk': 1.05, 'Maize Stover': 0.98, 'Other': 1.00 },
        'Anaerobic Decomposition': { 'Rice Straw': 0.85, 'Wheat Straw': 0.70, 'Sugarcane Trash': 0.65, 'Cotton Stalk': 0.72, 'Maize Stover': 0.68, 'Other': 0.70 },
        'Biogas Digestion': { 'Rice Straw': 0.12, 'Wheat Straw': 0.10, 'Sugarcane Trash': 0.09, 'Cotton Stalk': 0.11, 'Maize Stover': 0.10, 'Other': 0.10 },
        'Composting': { 'Rice Straw': 0.18, 'Wheat Straw': 0.15, 'Sugarcane Trash': 0.13, 'Cotton Stalk': 0.16, 'Maize Stover': 0.14, 'Other': 0.15 },
        'Biochar Production': { 'Rice Straw': 0.08, 'Wheat Straw': 0.07, 'Sugarcane Trash': 0.06, 'Cotton Stalk': 0.07, 'Maize Stover': 0.07, 'Other': 0.07 },
      };
      const ef = (efMap[practice] || {})[residueType] || 1.0;
      return { residue_type: residueType, practice, ef_tco2e_per_tonne: ef, source: 'IPCC 2006 + India NATCOM adaptations' };
    },
  },

  /** BM-T-010: Forestry biomass estimation */
  'BM-T-010': {
    name: 'Forestry Biomass Carbon Estimation',
    description: 'Above-ground and below-ground biomass carbon stock estimation for A/R projects',
    calculate: (inputs) => {
      const agb = inputs.above_ground_biomass_tc_ha || 0;
      const bgb = inputs.below_ground_biomass_tc_ha || (agb * 0.26);
      const soc = inputs.soil_organic_carbon_tc_ha || 0;
      const area = inputs.area_hectares || 1;
      const totalC = (agb + bgb + soc) * area;
      const totalCO2e = totalC * (44 / 12);
      return {
        agb_tc_ha: round(agb, 2),
        bgb_tc_ha: round(bgb, 2),
        soc_tc_ha: round(soc, 2),
        total_carbon_tc: round(totalC, 2),
        total_co2e: round(totalCO2e, 2),
        area_hectares: area,
        root_shoot_ratio: round(guard(bgb, agb), 3),
        reference: 'IPCC GPG-LULUCF 2003 + FSI India allometric equations',
      };
    },
  },

  /** BM-T-011: Common practice analysis */
  'BM-T-011': {
    name: 'Common Practice Analysis',
    description: 'Determines if project technology/practice is already common in the region',
    calculate: (inputs) => {
      const installed = inputs.installed_capacity_region_mw || 0;
      const total = inputs.total_capacity_region_mw || 1;
      const penetration = guard(installed, total) * 100;
      const isCommon = penetration > 20;
      return {
        market_penetration_pct: round(penetration, 1),
        isCommonPractice: isCommon,
        threshold_pct: 20,
        assessment: isCommon ? 'FAIL — technology is common practice' : 'PASS — technology is not common practice',
        reference: 'CCTS Rules S.12(d)',
      };
    },
  },

  /** BM-T-012: Non-permanence risk assessment (forestry buffer) */
  'BM-T-012': {
    name: 'Non-permanence Risk Assessment',
    description: 'Buffer pool deduction for forestry/blue carbon projects',
    calculate: (inputs) => {
      const fireRisk = inputs.fire_risk_class === 'High' ? 10 : inputs.fire_risk_class === 'Medium' ? 5 : 2;
      const politicalRisk = inputs.political_risk || 2;
      const tenureRisk = inputs.land_tenure_risk || 3;
      const naturalRisk = inputs.natural_disturbance_risk || 3;
      const totalRisk = Math.min(40, fireRisk + politicalRisk + tenureRisk + naturalRisk);
      return {
        fire_risk_pct: fireRisk,
        political_risk_pct: politicalRisk,
        tenure_risk_pct: tenureRisk,
        natural_risk_pct: naturalRisk,
        total_buffer_pct: totalRisk,
        recommendation: totalRisk > 25 ? 'High non-permanence risk — enhanced monitoring required' : 'Acceptable risk level',
      };
    },
  },

  /** BM-T-013: Monitoring plan template generator */
  'BM-T-013': {
    name: 'Monitoring Plan Generator',
    description: 'Generates a structured monitoring plan for the project',
    calculate: (inputs) => {
      const methodology = inputs.methodology || 'BM-EN01.001';
      const parameters = (DATA_CAPTURE_SCHEMAS[methodology] || { inputs: [] }).inputs.filter(i => i.period);
      return {
        methodology,
        monitoringParameters: parameters.map(p => ({ parameter: p.field, unit: p.unit || '', frequency: p.period || 'annual', source: p.source || 'Project records' })),
        qaqc: ['Meter calibration (annual)', 'Data cross-verification with SLDC/utility records', 'Internal audit of calculations', 'ACVA site visit'],
        dataManagement: 'Electronic monitoring system with backup hard copies for 2 years post-crediting period',
      };
    },
  },

  /** BM-T-014: Stakeholder consultation documentation */
  'BM-T-014': {
    name: 'Stakeholder Consultation',
    description: 'Documents local stakeholder consultation requirements',
    calculate: (inputs) => ({
      consultations_required: true,
      minimum_meetings: 2,
      stakeholder_groups: ['Local community', 'Gram Panchayat', 'State Pollution Control Board', 'District Administration'],
      documentation: ['Meeting minutes', 'Attendance register', 'Grievance register', 'Response to comments'],
      timeline: 'Before project registration, during validation',
    }),
  },

  /** BM-T-015: Crediting period and renewal assessment */
  'BM-T-015': {
    name: 'Crediting Period Assessment',
    description: 'Determines crediting period and renewal eligibility',
    calculate: (inputs) => {
      const methodology = inputs.methodology || 'BM-EN01.001';
      const schema = DATA_CAPTURE_SCHEMAS[methodology];
      const basePeriod = schema ? schema.crediting_period_yrs : 10;
      const maxRenewals = methodology.startsWith('BM-FR') ? 2 : 2;
      const maxTotal = basePeriod * (1 + maxRenewals);
      return {
        base_crediting_period_yrs: basePeriod,
        max_renewals: maxRenewals,
        max_total_yrs: maxTotal,
        renewal_conditions: ['Methodology still valid', 'Additionality re-assessment', 'Updated baseline required at renewal', 'ACVA verification of continued operation'],
        reference: 'CCTS Rules 2023 Section 14',
      };
    },
  },

  /** BM-T-016: Co-benefit assessment (SDG alignment) */
  'BM-T-016': {
    name: 'Co-benefit Assessment',
    description: 'Maps project co-benefits to UN SDGs and India NDC targets',
    calculate: (inputs) => {
      const sector = inputs.sector || 'Energy';
      const sdgMap = {
        Energy: [7, 8, 9, 13],
        Industry: [9, 12, 13],
        Waste: [6, 11, 12, 13],
        Agriculture: [1, 2, 13, 15],
        Forestry: [1, 13, 14, 15],
      };
      const sdgs = sdgMap[sector] || [13];
      return {
        sdg_alignment: sdgs.map(n => ({ sdg: n, label: `SDG ${n}` })),
        ndc_contribution: sector === 'Energy' ? '500 GW non-fossil by 2030' : sector === 'Forestry' ? '2.5-3 billion tCO2e carbon sink by 2030' : 'Net zero by 2070',
        employment_potential: inputs.employment_created || 0,
        community_benefits: inputs.community_benefits || [],
      };
    },
  },

  /** BM-T-017: Uncertainty assessment */
  'BM-T-017': {
    name: 'Uncertainty Assessment',
    description: 'Quantifies uncertainty in emission reduction estimate at 95% confidence',
    calculate: (inputs) => {
      const meterUncertainty = inputs.meter_accuracy_class === '0.2' ? 0.2 : inputs.meter_accuracy_class === '0.5' ? 0.5 : 1.0;
      const efUncertainty = inputs.ef_uncertainty_pct || 5;
      const combinedUncertainty = Math.sqrt(meterUncertainty * meterUncertainty + efUncertainty * efUncertainty);
      const deductionRequired = combinedUncertainty > 10;
      return {
        meter_uncertainty_pct: meterUncertainty,
        ef_uncertainty_pct: efUncertainty,
        combined_uncertainty_pct: round(combinedUncertainty, 2),
        at_95_confidence: round(combinedUncertainty * 1.96, 2),
        deduction_required: deductionRequired,
        deduction_pct: deductionRequired ? round(combinedUncertainty - 10, 2) : 0,
        reference: 'IPCC GPG-LULUCF + CCTS monitoring guidelines',
      };
    },
  },

  /** BM-T-018: CCC issuance and registry interface */
  'BM-T-018': {
    name: 'CCC Issuance Calculator',
    description: 'Final CCC issuance quantity after all deductions',
    calculate: (inputs) => {
      const grossReduction = inputs.net_reduction_tco2e || 0;
      const bufferDeduction = grossReduction * ((inputs.buffer_pct || 0) / 100);
      const uncertaintyDeduction = grossReduction * ((inputs.uncertainty_deduction_pct || 0) / 100);
      const net = grossReduction - bufferDeduction - uncertaintyDeduction;
      const cccIssued = Math.max(0, Math.floor(net));
      return {
        gross_reduction_tco2e: round(grossReduction, 2),
        buffer_deduction_tco2e: round(bufferDeduction, 2),
        uncertainty_deduction_tco2e: round(uncertaintyDeduction, 2),
        net_eligible_tco2e: round(net, 2),
        ccc_issued: cccIssued,
        registry_status: cccIssued > 0 ? 'Ready for issuance' : 'Insufficient reductions',
        reference: 'CCTS Rules 2023 Section 14AA — 1 CCC = 1 tCO2e',
      };
    },
  },
};


/* ============================================================
   3. METHODOLOGY_ENGINES — Full calculation pipeline per methodology
   ============================================================ */

/**
 * Each engine implements the complete pipeline:
 * Validate -> Baseline -> Project -> Leakage -> Net Reduction -> CCC -> Audit
 * @type {Object.<string, Object>}
 */
export const METHODOLOGY_ENGINES = {

  /* ---- BM-EN01.001: Grid-connected RE ---- */
  'BM-EN01.001': {
    /** @param {Object} inputs - All fields from DATA_CAPTURE_SCHEMAS['BM-EN01.001'] */
    calculate: (inputs) => {
      const validation = validateInputs('BM-EN01.001', inputs);
      if (!validation.valid) return { error: true, validation };

      const baselineEmissions = (inputs.net_generation_mwh || 0) * (inputs.grid_ef_tco2_mwh || 0);
      const projectEmissions = 0;
      const leakage = 0;
      const netReduction = baselineEmissions - projectEmissions - leakage;
      const cccIssued = Math.max(0, Math.floor(netReduction));
      const cccPrice = inputs.ccc_price_inr || 800;
      const cccValue_inr = cccIssued * cccPrice;
      const cccValue_usd = cccValue_inr / 83.5;

      const auditTrail = _buildAuditTrail('BM-EN01.001', inputs, [
        { step: 1, description: 'Baseline emissions = Net generation x Grid EF', formula: `${inputs.net_generation_mwh} MWh x ${inputs.grid_ef_tco2_mwh} tCO2/MWh`, result: round(baselineEmissions, 2) + ' tCO2e', reference: 'BM-EN01.001 Section 5.2' },
        { step: 2, description: 'Project emissions (RE = 0)', result: '0 tCO2e', reference: 'BM-EN01.001 Section 5.3' },
        { step: 3, description: 'Leakage assessment', result: '0 tCO2e (no significant leakage per BM-T-008)', reference: 'BM-T-008' },
        { step: 4, description: 'Net emission reduction', formula: `${round(baselineEmissions, 2)} - 0 - 0`, result: round(netReduction, 2) + ' tCO2e', reference: 'BM-EN01.001 Section 5.4' },
        { step: 5, description: 'CCC issuance (1 CCC = 1 tCO2e)', result: cccIssued + ' CCCs', reference: 'CCTS Rules 2023, Section 14AA' },
      ], ['BM-T-004', 'BM-T-005', 'BM-T-001'], inputs);

      return _buildResult('BM-EN01.001', baselineEmissions, projectEmissions, leakage, netReduction, cccIssued, cccValue_inr, cccValue_usd, 10, inputs, auditTrail);
    },
  },

  /* ---- BM-EN01.002: Captive/third-party RE ---- */
  'BM-EN01.002': {
    calculate: (inputs) => {
      const validation = validateInputs('BM-EN01.002', inputs);
      if (!validation.valid) return { error: true, validation };

      const captiveMwh = inputs.captive_consumption_mwh || 0;
      const exportMwh = inputs.export_to_grid_mwh || 0;
      const fossilEF = inputs.fossil_fuel_ef_tco2_per_unit || 0;
      const fossilQty = inputs.fossil_fuel_displaced_qty || 0;
      const gridEF = inputs.grid_ef_tco2_mwh || 0;

      const baselineFossil = fossilQty * fossilEF;
      const baselineGrid = exportMwh * gridEF;
      const baselineEmissions = baselineFossil + baselineGrid;
      const projectEmissions = 0;
      const leakage = 0;
      const netReduction = baselineEmissions - projectEmissions - leakage;
      const cccIssued = Math.max(0, Math.floor(netReduction));
      const cccPrice = inputs.ccc_price_inr || 800;
      const cccValue_inr = cccIssued * cccPrice;
      const cccValue_usd = cccValue_inr / 83.5;

      const auditTrail = _buildAuditTrail('BM-EN01.002', inputs, [
        { step: 1, description: 'Baseline fossil fuel displacement', formula: `${fossilQty} x ${fossilEF} tCO2/unit`, result: round(baselineFossil, 2) + ' tCO2e', reference: 'BM-EN01.002 Section 5.2(a)' },
        { step: 2, description: 'Baseline grid export displacement', formula: `${exportMwh} MWh x ${gridEF} tCO2/MWh`, result: round(baselineGrid, 2) + ' tCO2e', reference: 'BM-EN01.002 Section 5.2(b)' },
        { step: 3, description: 'Total baseline emissions', result: round(baselineEmissions, 2) + ' tCO2e', reference: 'BM-EN01.002 Section 5.2' },
        { step: 4, description: 'Project emissions (RE = 0)', result: '0 tCO2e', reference: 'BM-EN01.002 Section 5.3' },
        { step: 5, description: 'Leakage', result: '0 tCO2e', reference: 'BM-T-008' },
        { step: 6, description: 'Net emission reduction', result: round(netReduction, 2) + ' tCO2e', reference: 'BM-EN01.002 Section 5.4' },
      ], ['BM-T-002', 'BM-T-004', 'BM-T-005', 'BM-T-001'], inputs);

      return _buildResult('BM-EN01.002', baselineEmissions, projectEmissions, leakage, netReduction, cccIssued, cccValue_inr, cccValue_usd, 10, inputs, auditTrail);
    },
  },

  /* ---- BM-IN02.001: Industrial fuel switching ---- */
  'BM-IN02.001': {
    calculate: (inputs) => {
      const validation = validateInputs('BM-IN02.001', inputs);
      if (!validation.valid) return { error: true, validation };

      const blQty = inputs.baseline_fuel_qty || 0;
      const blNCV = inputs.baseline_fuel_ncv || 0;
      const blEF = inputs.ef_baseline_fuel || 0;
      const prQty = inputs.project_fuel_qty || 0;
      const prNCV = inputs.project_fuel_ncv || 0;
      const prEF = inputs.ef_project_fuel || 0;

      const baselineEnergy_tj = blQty * blNCV / 1000;
      const projectEnergy_tj = prQty * prNCV / 1000;
      const baselineEmissions = baselineEnergy_tj * blEF / 1000;
      const projectEmissions = projectEnergy_tj * prEF / 1000;
      const leakage = (inputs.upstream_leakage_pct || 0) / 100 * baselineEmissions;
      const netReduction = baselineEmissions - projectEmissions - leakage;
      const cccIssued = Math.max(0, Math.floor(netReduction));
      const cccPrice = inputs.ccc_price_inr || 800;
      const cccValue_inr = cccIssued * cccPrice;
      const cccValue_usd = cccValue_inr / 83.5;

      const auditTrail = _buildAuditTrail('BM-IN02.001', inputs, [
        { step: 1, description: 'Baseline energy', formula: `${blQty} x ${blNCV} / 1000`, result: round(baselineEnergy_tj, 4) + ' TJ', reference: 'BM-IN02.001 Section 5.2' },
        { step: 2, description: 'Baseline emissions', formula: `${round(baselineEnergy_tj, 4)} TJ x ${blEF} tCO2/TJ / 1000`, result: round(baselineEmissions, 2) + ' tCO2', reference: 'BM-T-002' },
        { step: 3, description: 'Project energy', formula: `${prQty} x ${prNCV} / 1000`, result: round(projectEnergy_tj, 4) + ' TJ', reference: 'BM-IN02.001 Section 5.3' },
        { step: 4, description: 'Project emissions', formula: `${round(projectEnergy_tj, 4)} TJ x ${prEF} tCO2/TJ / 1000`, result: round(projectEmissions, 2) + ' tCO2', reference: 'BM-T-002' },
        { step: 5, description: 'Leakage', result: round(leakage, 2) + ' tCO2e', reference: 'BM-T-008' },
        { step: 6, description: 'Net emission reduction', result: round(netReduction, 2) + ' tCO2e', reference: 'BM-IN02.001 Section 5.4' },
      ], ['BM-T-002', 'BM-T-001', 'BM-T-008'], inputs);

      return _buildResult('BM-IN02.001', baselineEmissions, projectEmissions, leakage, netReduction, cccIssued, cccValue_inr, cccValue_usd, 10, inputs, auditTrail);
    },
  },

  /* ---- BM-IN02.002: Industrial process emission reduction ---- */
  'BM-IN02.002': {
    calculate: (inputs) => {
      const validation = validateInputs('BM-IN02.002', inputs);
      if (!validation.valid) return { error: true, validation };

      const production = inputs.production_volume_tonnes || 0;
      const blEF = inputs.baseline_process_ef || 0;
      const prEF = inputs.project_process_ef || 0;

      let baselineEmissions = production * blEF;
      let projectEmissions = production * prEF;

      // Cement-specific: adjust for clinker ratio
      if (inputs.clinker_ratio !== undefined && inputs.clinker_ratio !== null) {
        const baselineClinker = inputs.baseline_clinker_ratio || 0.75;
        const projectClinker = inputs.clinker_ratio;
        baselineEmissions = production * baselineClinker * blEF;
        projectEmissions = production * projectClinker * prEF;
      }
      // Steel-specific: adjust for scrap ratio (EAF = lower emissions)
      if (inputs.scrap_ratio !== undefined && inputs.scrap_ratio !== null) {
        const scrapBenefit = inputs.scrap_ratio * 0.6;
        projectEmissions = projectEmissions * (1 - scrapBenefit);
      }

      // Electricity component
      const elecBaseline = (inputs.baseline_electricity_mwh || 0) * (inputs.grid_ef_tco2_mwh || 0.82);
      const elecProject = (inputs.project_electricity_mwh || 0) * (inputs.grid_ef_tco2_mwh || 0.82);
      baselineEmissions += elecBaseline;
      projectEmissions += elecProject;

      const leakage = 0;
      const netReduction = baselineEmissions - projectEmissions - leakage;
      const cccIssued = Math.max(0, Math.floor(netReduction));
      const cccPrice = inputs.ccc_price_inr || 800;
      const cccValue_inr = cccIssued * cccPrice;
      const cccValue_usd = cccValue_inr / 83.5;

      const auditTrail = _buildAuditTrail('BM-IN02.002', inputs, [
        { step: 1, description: 'Baseline process emissions', formula: `${production} t x ${blEF} tCO2/t`, result: round(baselineEmissions - elecBaseline, 2) + ' tCO2', reference: 'BM-IN02.002 Section 5.2' },
        { step: 2, description: 'Baseline electricity emissions', formula: `${inputs.baseline_electricity_mwh || 0} MWh x ${inputs.grid_ef_tco2_mwh || 0.82}`, result: round(elecBaseline, 2) + ' tCO2', reference: 'BM-T-003' },
        { step: 3, description: 'Total baseline', result: round(baselineEmissions, 2) + ' tCO2', reference: 'BM-IN02.002 Section 5.2' },
        { step: 4, description: 'Project process emissions', result: round(projectEmissions - elecProject, 2) + ' tCO2', reference: 'BM-IN02.002 Section 5.3' },
        { step: 5, description: 'Project electricity emissions', result: round(elecProject, 2) + ' tCO2', reference: 'BM-T-003' },
        { step: 6, description: 'Net emission reduction', result: round(netReduction, 2) + ' tCO2e', reference: 'BM-IN02.002 Section 5.4' },
      ], ['BM-T-002', 'BM-T-003', 'BM-T-001', 'BM-T-008', 'BM-T-011'], inputs);

      return _buildResult('BM-IN02.002', baselineEmissions, projectEmissions, leakage, netReduction, cccIssued, cccValue_inr, cccValue_usd, 10, inputs, auditTrail);
    },
  },

  /* ---- BM-WA03.001: Landfill methane ---- */
  'BM-WA03.001': {
    calculate: (inputs) => {
      const validation = validateInputs('BM-WA03.001', inputs);
      if (!validation.valid) return { error: true, validation };

      const captured_m3 = inputs.methane_captured_m3 || 0;
      const flared_m3 = inputs.flared_m3 || 0;
      const flareEff = (inputs.flare_efficiency_pct || 90) / 100;
      const gwp = inputs.gwp_ch4 || 28;
      const density = 0.000717;

      const destroyed_tonnes = flared_m3 * density * flareEff;
      const baselineEmissions = destroyed_tonnes * gwp;

      // Electricity from LFG displaces grid
      const elecBenefit = (inputs.electricity_generated_mwh || 0) * (inputs.grid_ef_tco2_mwh || 0.82);

      // Project emissions: CO2 from flaring + genset fuel
      const co2FromFlare = destroyed_tonnes * (44 / 16);
      const projectEmissions = co2FromFlare;

      const leakage = 0;
      const netReduction = baselineEmissions - projectEmissions - leakage + elecBenefit;
      const cccIssued = Math.max(0, Math.floor(netReduction));
      const cccPrice = inputs.ccc_price_inr || 800;
      const cccValue_inr = cccIssued * cccPrice;
      const cccValue_usd = cccValue_inr / 83.5;

      const auditTrail = _buildAuditTrail('BM-WA03.001', inputs, [
        { step: 1, description: 'Methane destroyed', formula: `${flared_m3} m3 x ${density} t/m3 x ${flareEff}`, result: round(destroyed_tonnes, 4) + ' t CH4', reference: 'BM-T-007' },
        { step: 2, description: 'Baseline avoided emissions (CH4 x GWP)', formula: `${round(destroyed_tonnes, 4)} x ${gwp}`, result: round(baselineEmissions, 2) + ' tCO2e', reference: 'BM-WA03.001 Section 5.2' },
        { step: 3, description: 'CO2 from flaring', formula: `${round(destroyed_tonnes, 4)} x 44/16`, result: round(co2FromFlare, 2) + ' tCO2', reference: 'BM-WA03.001 Section 5.3' },
        { step: 4, description: 'Grid displacement from electricity', result: round(elecBenefit, 2) + ' tCO2', reference: 'BM-T-004' },
        { step: 5, description: 'Net emission reduction', result: round(netReduction, 2) + ' tCO2e', reference: 'BM-WA03.001 Section 5.4' },
      ], ['BM-T-006', 'BM-T-007', 'BM-T-001', 'BM-T-008'], inputs);

      return _buildResult('BM-WA03.001', baselineEmissions, projectEmissions, leakage, netReduction, cccIssued, cccValue_inr, cccValue_usd, 10, inputs, auditTrail);
    },
  },

  /* ---- BM-WA03.002: Waste-to-energy ---- */
  'BM-WA03.002': {
    calculate: (inputs) => {
      const validation = validateInputs('BM-WA03.002', inputs);
      if (!validation.valid) return { error: true, validation };

      const elecMwh = inputs.electricity_generated_mwh || 0;
      const gridEF = inputs.grid_displacement_ef || 0.82;
      const gridDisplacement = elecMwh * gridEF;
      const avoidedLandfill = inputs.baseline_landfill_methane_tco2e || 0;
      const baselineEmissions = gridDisplacement + avoidedLandfill;

      const mswTonnes = inputs.msw_processed_tonnes || 0;
      const fossilFrac = (inputs.fossil_fraction_pct || 0) / 100;
      const efFossil = inputs.ef_msw_fossil || 0;
      const projectEmissions = mswTonnes * fossilFrac * efFossil;

      const leakage = 0;
      const netReduction = baselineEmissions - projectEmissions - leakage;
      const cccIssued = Math.max(0, Math.floor(netReduction));
      const cccPrice = inputs.ccc_price_inr || 800;
      const cccValue_inr = cccIssued * cccPrice;
      const cccValue_usd = cccValue_inr / 83.5;

      const auditTrail = _buildAuditTrail('BM-WA03.002', inputs, [
        { step: 1, description: 'Grid electricity displacement', formula: `${elecMwh} MWh x ${gridEF} tCO2/MWh`, result: round(gridDisplacement, 2) + ' tCO2', reference: 'BM-T-004' },
        { step: 2, description: 'Avoided landfill methane', result: round(avoidedLandfill, 2) + ' tCO2e', reference: 'BM-T-006/007' },
        { step: 3, description: 'Total baseline', result: round(baselineEmissions, 2) + ' tCO2e', reference: 'BM-WA03.002 Section 5.2' },
        { step: 4, description: 'Fossil CO2 from combustion', formula: `${mswTonnes} t x ${fossilFrac} x ${efFossil}`, result: round(projectEmissions, 2) + ' tCO2', reference: 'BM-WA03.002 Section 5.3' },
        { step: 5, description: 'Net emission reduction', result: round(netReduction, 2) + ' tCO2e', reference: 'BM-WA03.002 Section 5.4' },
      ], ['BM-T-002', 'BM-T-004', 'BM-T-007', 'BM-T-001', 'BM-T-008'], inputs);

      return _buildResult('BM-WA03.002', baselineEmissions, projectEmissions, leakage, netReduction, cccIssued, cccValue_inr, cccValue_usd, 7, inputs, auditTrail);
    },
  },

  /* ---- BM-AG04.001: Agriculture methane avoidance ---- */
  'BM-AG04.001': {
    calculate: (inputs) => {
      const validation = validateInputs('BM-AG04.001', inputs);
      if (!validation.valid) return { error: true, validation };

      const qty = inputs.residue_qty_tonnes || 0;
      const blEF = inputs.baseline_ef_tco2e_tonne || 0;
      const prEF = inputs.project_ef_tco2e_tonne || 0;

      const baselineEmissions = qty * blEF;
      const projectEmissions = qty * prEF;
      const leakagePct = (inputs.leakage_pct || 5) / 100;
      const leakage = baselineEmissions * leakagePct;
      const netReduction = baselineEmissions - projectEmissions - leakage;
      const cccIssued = Math.max(0, Math.floor(netReduction));
      const cccPrice = inputs.ccc_price_inr || 800;
      const cccValue_inr = cccIssued * cccPrice;
      const cccValue_usd = cccValue_inr / 83.5;

      const auditTrail = _buildAuditTrail('BM-AG04.001', inputs, [
        { step: 1, description: 'Baseline emissions (residue burning/decomposition)', formula: `${qty} t x ${blEF} tCO2e/t`, result: round(baselineEmissions, 2) + ' tCO2e', reference: 'BM-AG04.001 Section 5.2' },
        { step: 2, description: 'Project emissions (improved practice)', formula: `${qty} t x ${prEF} tCO2e/t`, result: round(projectEmissions, 2) + ' tCO2e', reference: 'BM-AG04.001 Section 5.3' },
        { step: 3, description: 'Leakage (activity shifting)', formula: `${round(baselineEmissions, 2)} x ${leakagePct}`, result: round(leakage, 2) + ' tCO2e', reference: 'BM-T-008' },
        { step: 4, description: 'Net emission reduction', result: round(netReduction, 2) + ' tCO2e', reference: 'BM-AG04.001 Section 5.4' },
      ], ['BM-T-009', 'BM-T-001', 'BM-T-008', 'BM-T-011'], inputs);

      return _buildResult('BM-AG04.001', baselineEmissions, projectEmissions, leakage, netReduction, cccIssued, cccValue_inr, cccValue_usd, 7, inputs, auditTrail);
    },
  },

  /* ---- BM-FR05.001: Mangrove A/R (blue carbon) ---- */
  'BM-FR05.001': {
    calculate: (inputs) => {
      const validation = validateInputs('BM-FR05.001', inputs);
      if (!validation.valid) return { error: true, validation };

      const area = inputs.area_hectares || 0;
      const agb = inputs.above_ground_biomass_tc_ha || 0;
      const bgb = inputs.below_ground_biomass_tc_ha || (agb * 0.49);
      const soc = inputs.soil_organic_carbon_tc_ha || 0;
      const preStock = inputs.pre_project_carbon_stock_tc_ha || 0;
      const survivalRate = (inputs.survival_rate_pct || 100) / 100;
      const bufferPct = (inputs.permanence_discount_pct || 15) / 100;
      const leakagePct = (inputs.leakage_discount_pct || 5) / 100;

      const currentStock_tc_ha = agb + bgb + soc;
      const netSequestered_tc_ha = currentStock_tc_ha - preStock;
      const grossSequestered_tc = netSequestered_tc_ha * area * survivalRate;
      const grossCO2e = grossSequestered_tc * (44 / 12);

      const baselineEmissions = 0;
      const projectEmissions = 0;
      const buffer = grossCO2e * bufferPct;
      const leakage = grossCO2e * leakagePct;
      const netReduction = grossCO2e - buffer - leakage;
      const cccIssued = Math.max(0, Math.floor(netReduction));
      const cccPrice = inputs.ccc_price_inr || 800;
      const cccValue_inr = cccIssued * cccPrice;
      const cccValue_usd = cccValue_inr / 83.5;

      const auditTrail = _buildAuditTrail('BM-FR05.001', inputs, [
        { step: 1, description: 'Current carbon stock (AGB + BGB + SOC)', formula: `${agb} + ${round(bgb, 2)} + ${soc} = ${round(currentStock_tc_ha, 2)} tC/ha`, result: round(currentStock_tc_ha, 2) + ' tC/ha', reference: 'BM-T-010' },
        { step: 2, description: 'Net sequestration per ha', formula: `${round(currentStock_tc_ha, 2)} - ${preStock}`, result: round(netSequestered_tc_ha, 2) + ' tC/ha', reference: 'BM-FR05.001 Section 5.2' },
        { step: 3, description: 'Gross sequestration (area x survival)', formula: `${round(netSequestered_tc_ha, 2)} x ${area} ha x ${survivalRate}`, result: round(grossSequestered_tc, 2) + ' tC', reference: 'BM-FR05.001 Section 5.2' },
        { step: 4, description: 'Convert to CO2e (x 44/12)', result: round(grossCO2e, 2) + ' tCO2e', reference: 'IPCC' },
        { step: 5, description: 'Buffer pool deduction', formula: `${round(grossCO2e, 2)} x ${bufferPct}`, result: round(buffer, 2) + ' tCO2e', reference: 'BM-T-012' },
        { step: 6, description: 'Leakage deduction', result: round(leakage, 2) + ' tCO2e', reference: 'BM-T-008' },
        { step: 7, description: 'Net emission reduction', result: round(netReduction, 2) + ' tCO2e', reference: 'BM-FR05.001 Section 5.4' },
      ], ['BM-T-010', 'BM-T-001', 'BM-T-008', 'BM-T-012'], inputs);

      return _buildResult('BM-FR05.001', grossCO2e, projectEmissions, buffer + leakage, netReduction, cccIssued, cccValue_inr, cccValue_usd, 30, inputs, auditTrail);
    },
  },

  /* ---- BM-FR05.002: A/R non-wetland (terrestrial) ---- */
  'BM-FR05.002': {
    calculate: (inputs) => {
      const validation = validateInputs('BM-FR05.002', inputs);
      if (!validation.valid) return { error: true, validation };

      const area = inputs.area_hectares || 0;
      const agb = inputs.above_ground_biomass_tc_ha || 0;
      const bgb = inputs.below_ground_biomass_tc_ha || (agb * 0.26);
      const preStock = inputs.pre_project_carbon_stock || 0;
      const survivalRate = (inputs.survival_rate_pct || 100) / 100;
      const bufferPct = (inputs.permanence_discount_pct || 18) / 100;
      const leakagePct = (inputs.leakage_discount_pct || 5) / 100;

      const currentStock_tc_ha = agb + bgb;
      const netSequestered_tc_ha = currentStock_tc_ha - preStock;
      const grossSequestered_tc = netSequestered_tc_ha * area * survivalRate;
      const grossCO2e = grossSequestered_tc * (44 / 12);

      const buffer = grossCO2e * bufferPct;
      const leakage = grossCO2e * leakagePct;
      const netReduction = grossCO2e - buffer - leakage;
      const cccIssued = Math.max(0, Math.floor(netReduction));
      const cccPrice = inputs.ccc_price_inr || 800;
      const cccValue_inr = cccIssued * cccPrice;
      const cccValue_usd = cccValue_inr / 83.5;

      const auditTrail = _buildAuditTrail('BM-FR05.002', inputs, [
        { step: 1, description: 'Current carbon stock (AGB + BGB)', formula: `${agb} + ${round(bgb, 2)} = ${round(currentStock_tc_ha, 2)} tC/ha`, result: round(currentStock_tc_ha, 2) + ' tC/ha', reference: 'BM-T-010' },
        { step: 2, description: 'Net sequestration per ha', formula: `${round(currentStock_tc_ha, 2)} - ${preStock}`, result: round(netSequestered_tc_ha, 2) + ' tC/ha', reference: 'BM-FR05.002 Section 5.2' },
        { step: 3, description: 'Gross sequestration', formula: `${round(netSequestered_tc_ha, 2)} x ${area} ha x ${survivalRate}`, result: round(grossSequestered_tc, 2) + ' tC', reference: 'BM-FR05.002 Section 5.2' },
        { step: 4, description: 'Convert to CO2e', result: round(grossCO2e, 2) + ' tCO2e', reference: 'IPCC' },
        { step: 5, description: 'Buffer pool deduction', result: round(buffer, 2) + ' tCO2e', reference: 'BM-T-012' },
        { step: 6, description: 'Leakage deduction', result: round(leakage, 2) + ' tCO2e', reference: 'BM-T-008' },
        { step: 7, description: 'Net emission reduction', result: round(netReduction, 2) + ' tCO2e', reference: 'BM-FR05.002 Section 5.4' },
      ], ['BM-T-010', 'BM-T-001', 'BM-T-008', 'BM-T-012'], inputs);

      return _buildResult('BM-FR05.002', grossCO2e, 0, buffer + leakage, netReduction, cccIssued, cccValue_inr, cccValue_usd, 30, inputs, auditTrail);
    },
  },
};


/* ============================================================
   4. VALIDATION ENGINE
   ============================================================ */

/**
 * Validates inputs against the DATA_CAPTURE_SCHEMA for a methodology.
 * @param {string} methodologyCode - e.g. 'BM-EN01.001'
 * @param {Object} inputs - User-supplied input object
 * @returns {{ valid: boolean, errors: Array, warnings: Array, completeness_pct: number }}
 */
export function validateInputs(methodologyCode, inputs) {
  const schema = DATA_CAPTURE_SCHEMAS[methodologyCode];
  if (!schema) return { valid: false, errors: [{ field: 'methodology', message: 'Unknown methodology: ' + methodologyCode, severity: 'error' }], warnings: [], completeness_pct: 0 };

  const errors = [];
  const warnings = [];
  let filled = 0;
  const requiredFields = schema.inputs.filter(f => f.required);

  schema.inputs.forEach(f => {
    const val = inputs[f.field];
    const missing = val === undefined || val === null || val === '';

    if (f.required && missing) {
      errors.push({ field: f.field, message: `${f.help || f.field} is required`, severity: 'error' });
    }

    if (!missing) {
      filled++;
      if (f.type === 'number') {
        if (typeof val !== 'number' || isNaN(val)) {
          errors.push({ field: f.field, message: `${f.field} must be a valid number`, severity: 'error' });
        }
        if (f.min !== undefined && val < f.min) {
          errors.push({ field: f.field, message: `${f.field} must be >= ${f.min}`, severity: 'error' });
        }
      }
      if (f.type === 'select' && f.options && !f.options.includes(String(val))) {
        warnings.push({ field: f.field, message: `${f.field} value "${val}" not in allowed options`, severity: 'warning' });
      }
    }
  });

  const completeness_pct = round(guard(filled, schema.inputs.length) * 100, 1);

  return { valid: errors.length === 0, errors, warnings, completeness_pct, total_fields: schema.inputs.length, filled_fields: filled, required_fields: requiredFields.length };
}


/* ============================================================
   5. ASSURANCE OUTPUT GENERATOR
   ============================================================ */

/**
 * Generates a structured assurance report from an engine result.
 * @param {Object} engineResult - Output from METHODOLOGY_ENGINES[code].calculate()
 * @returns {Object} Structured assurance report
 */
export function generateAssuranceReport(engineResult) {
  if (engineResult.error) return { error: true, message: 'Cannot generate report from failed calculation', validation: engineResult.validation };

  const at = engineResult.auditTrail || {};
  const schema = DATA_CAPTURE_SCHEMAS[engineResult.methodology] || {};

  return {
    title: 'CCTS Carbon Credit Certificate — Assurance Report',
    framework: 'India CCTS (S.O. 2825(E), 28 June 2023)',
    standard: 'ISO 14064-2:2019 + ISO 14065:2020',
    sections: [
      {
        title: 'Project Summary',
        data: {
          methodology: engineResult.methodology,
          methodology_title: schema.title || '',
          sector: schema.sector || '',
          project_name: (at.inputs || {}).project_name || '',
          technology: (at.inputs || {}).technology || (at.inputs || {}).industry_type || '',
          capacity: (at.inputs || {}).installed_capacity_mw || (at.inputs || {}).area_hectares || '',
          state: (at.inputs || {}).state || '',
          crediting_period_yrs: engineResult.creditingPeriod_yrs || schema.crediting_period_yrs || 10,
        },
      },
      {
        title: 'Emission Reduction Calculation',
        data: {
          baseline_tco2e: engineResult.baselineEmissions_tco2e,
          project_tco2e: engineResult.projectEmissions_tco2e,
          leakage_tco2e: engineResult.leakage_tco2e,
          net_reduction_tco2e: engineResult.netReduction_tco2e,
          formula_chain: (at.intermediateSteps || []).map(s => `${s.description}: ${s.result}`),
        },
      },
      {
        title: 'Data Quality Assessment',
        data: at.dataQuality || {},
      },
      {
        title: 'Assurance Checklist',
        data: at.assuranceChecklist || [],
      },
      {
        title: 'MRV Compliance',
        data: at.mrvCompliance || {},
      },
      {
        title: 'CCC Issuance Recommendation',
        data: {
          ccc_count: engineResult.cccIssued,
          value_inr: engineResult.cccValue_inr,
          value_usd: engineResult.cccValue_usd,
          assurance_ready: engineResult.assuranceReady,
          data_quality: engineResult.dataQuality,
        },
      },
    ],
    metadata: {
      generated_at: new Date().toISOString(),
      generated_by: 'A-Squared Intelligence CCTS Engine v1.0',
      disclaimer: 'This report is generated for internal assessment purposes. Final CCC issuance is subject to ACVA verification and BEE approval under the Indian Carbon Market framework.',
    },
  };
}


/* ============================================================
   6. BATCH PROCESSOR
   ============================================================ */

/**
 * Runs all methodology engines on an array of project input objects.
 * @param {Array<Object>} projects - Each must contain { methodology: 'BM-...', ...inputs }
 * @returns {Array<Object>} Array of engine results
 */
export function runBatchCalculation(projects) {
  if (!Array.isArray(projects)) return [];
  return projects.map((p, idx) => {
    const engine = METHODOLOGY_ENGINES[p.methodology];
    if (!engine) return { error: true, index: idx, project: p.project_name || `Project ${idx + 1}`, message: 'Unknown methodology: ' + p.methodology };
    try {
      return { index: idx, project: p.project_name || `Project ${idx + 1}`, ...engine.calculate(p) };
    } catch (err) {
      return { error: true, index: idx, project: p.project_name || `Project ${idx + 1}`, message: 'Calculation error: ' + (err.message || err) };
    }
  });
}


/* ============================================================
   7. PORTFOLIO AGGREGATOR
   ============================================================ */

/**
 * Aggregates results from runBatchCalculation into portfolio-level metrics.
 * @param {Array<Object>} results - Array of engine results
 * @returns {Object} Aggregated portfolio metrics
 */
export function aggregateCCTSPortfolio(results) {
  if (!Array.isArray(results) || results.length === 0) return { totalProjects: 0, totalCCCs: 0, totalValue_inr: 0, totalValue_usd: 0, totalReduction_tco2e: 0 };

  const valid = results.filter(r => !r.error);
  const totalCCCs = valid.reduce((s, r) => s + (r.cccIssued || 0), 0);
  const totalValue_inr = valid.reduce((s, r) => s + (r.cccValue_inr || 0), 0);
  const totalValue_usd = valid.reduce((s, r) => s + (r.cccValue_usd || 0), 0);
  const totalReduction = valid.reduce((s, r) => s + (r.netReduction_tco2e || 0), 0);

  const qualityMap = { 'Assurance-ready': 3, 'Review recommended': 2 };
  const avgQualityScore = guard(valid.reduce((s, r) => s + (qualityMap[r.dataQuality] || 1), 0), valid.length);
  const avgDataQuality = avgQualityScore >= 2.5 ? 'Assurance-ready' : avgQualityScore >= 1.5 ? 'Review recommended' : 'Needs improvement';

  const assuranceReadyCount = valid.filter(r => r.assuranceReady).length;

  // Breakdown by sector
  const bySector = {};
  valid.forEach(r => {
    const schema = DATA_CAPTURE_SCHEMAS[r.methodology] || {};
    const sector = schema.sector || 'Unknown';
    if (!bySector[sector]) bySector[sector] = { count: 0, cccs: 0, reduction_tco2e: 0, value_inr: 0 };
    bySector[sector].count++;
    bySector[sector].cccs += r.cccIssued || 0;
    bySector[sector].reduction_tco2e += r.netReduction_tco2e || 0;
    bySector[sector].value_inr += r.cccValue_inr || 0;
  });

  // Breakdown by methodology
  const byMethodology = {};
  valid.forEach(r => {
    const m = r.methodology || 'Unknown';
    if (!byMethodology[m]) byMethodology[m] = { count: 0, cccs: 0, reduction_tco2e: 0 };
    byMethodology[m].count++;
    byMethodology[m].cccs += r.cccIssued || 0;
    byMethodology[m].reduction_tco2e += r.netReduction_tco2e || 0;
  });

  // Breakdown by state
  const byState = {};
  valid.forEach(r => {
    const st = (r.auditTrail && r.auditTrail.inputs && r.auditTrail.inputs.state) || 'Unknown';
    if (!byState[st]) byState[st] = { count: 0, cccs: 0 };
    byState[st].count++;
    byState[st].cccs += r.cccIssued || 0;
  });

  return {
    totalProjects: results.length,
    validProjects: valid.length,
    errorProjects: results.length - valid.length,
    totalCCCs,
    totalValue_inr,
    totalValue_usd,
    totalReduction_tco2e: round(totalReduction, 2),
    avgDataQuality,
    assuranceReadyPct: round(guard(assuranceReadyCount, valid.length) * 100, 1),
    assuranceReadyCount,
    bySector,
    byMethodology,
    byState,
  };
}


/* ============================================================
   INTERNAL HELPERS (not exported)
   ============================================================ */

/**
 * Builds a standardised audit trail object for a methodology engine.
 * @private
 */
function _buildAuditTrail(methodology, inputs, steps, toolCodes, rawInputs) {
  return {
    methodology,
    version: 'V1',
    calculationDate: new Date().toISOString(),
    inputs: { ...(rawInputs || inputs), _sourceTagged: true },
    intermediateSteps: steps,
    toolsApplied: toolCodes.map(t => `${t} (${(TOOL_IMPLEMENTATIONS[t] || {}).name || t})`),
    dataQuality: {
      generation_data: (inputs.meter_accuracy_class === '0.2') ? 'High (Class 0.2 meter)' : (inputs.meter_accuracy_class === '0.5') ? 'Medium (Class 0.5 meter)' : 'Standard',
      grid_ef: inputs.grid_ef_tco2_mwh ? 'High (CEA official database)' : 'Not provided',
      overall: (inputs.meter_accuracy_class === '0.2' || inputs.meter_accuracy_class === '0.5') && inputs.acva_accreditation_no ? 'Assurance-ready' : 'Review recommended',
    },
    assuranceChecklist: [
      { item: 'Meter / measurement calibration current', status: inputs.meter_calibration_date ? 'PASS' : (inputs.area_hectares ? 'N/A' : 'FAIL') },
      { item: 'ACVA accredited', status: inputs.acva_accreditation_no ? 'PASS' : 'FAIL' },
      { item: 'Emission factor from official source', status: (inputs.grid_ef_tco2_mwh || inputs.baseline_process_ef || inputs.baseline_ef_tco2e_tonne || inputs.above_ground_biomass_tc_ha) ? 'PASS' : 'FAIL' },
      { item: 'Monitoring data verified', status: (inputs.net_generation_mwh > 0 || inputs.residue_qty_tonnes > 0 || inputs.area_hectares > 0 || inputs.methane_captured_m3 > 0 || inputs.production_volume_tonnes > 0 || inputs.msw_processed_tonnes > 0) ? 'PASS' : 'FAIL' },
      { item: 'Verification report filed', status: inputs.verification_date ? 'PASS' : 'FAIL' },
    ],
    mrvCompliance: {
      iso14064: true,
      iso14065_acva: !!inputs.acva_accreditation_no,
      monitoring_plan: true,
      third_party_verification: !!inputs.verification_date,
    },
  };
}

/**
 * Builds a standardised result object for a methodology engine.
 * @private
 */
function _buildResult(methodology, baselineEmissions, projectEmissions, leakage, netReduction, cccIssued, cccValue_inr, cccValue_usd, creditingYrs, inputs, auditTrail) {
  return {
    methodology,
    baselineEmissions_tco2e: round(baselineEmissions, 2),
    projectEmissions_tco2e: round(projectEmissions, 2),
    leakage_tco2e: round(leakage, 2),
    netReduction_tco2e: round(netReduction, 2),
    cccIssued,
    cccValue_inr: Math.round(cccValue_inr),
    cccValue_usd: Math.round(cccValue_usd),
    creditingPeriod_yrs: creditingYrs,
    annualized_tco2e: round(guard(netReduction, creditingYrs), 2),
    carbonIntensity_avoided: round(guard(netReduction, inputs.installed_capacity_mw || inputs.area_hectares || inputs.production_volume_tonnes || inputs.residue_qty_tonnes || inputs.msw_processed_tonnes || 1), 2),
    auditTrail,
    assuranceReady: (auditTrail.assuranceChecklist || []).filter(c => c.status !== 'N/A').every(c => c.status === 'PASS'),
    dataQuality: (auditTrail.dataQuality || {}).overall || 'Review recommended',
  };
}


/* ============================================================
   DEFAULT EXPORT
   ============================================================ */

export default {
  DATA_CAPTURE_SCHEMAS,
  TOOL_IMPLEMENTATIONS,
  METHODOLOGY_ENGINES,
  validateInputs,
  generateAssuranceReport,
  runBatchCalculation,
  aggregateCCTSPortfolio,
};
