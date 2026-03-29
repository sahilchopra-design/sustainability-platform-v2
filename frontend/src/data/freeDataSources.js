// =============================================================================
// FREE DATA SOURCES — Sustainability Analytics Platform
// =============================================================================
// 40 free/open data sources with API endpoints, auth, field mappings, and
// engine consumption metadata. Organised into 6 categories.
//
// Deterministic seed — NO Math.random()
// =============================================================================

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ---------------------------------------------------------------------------
// Helper: deterministic quality score (0.60 – 0.99)
// ---------------------------------------------------------------------------
const qScore = (seed) => +(0.60 + sr(seed) * 0.39).toFixed(2);

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
const CATEGORIES = {
  EMISSIONS: 'Emissions & Climate',
  ENERGY: 'Energy & Grid',
  ESG: 'ESG & Corporate',
  NATURE: 'Nature & Biodiversity',
  ECONOMIC: 'Economic & Macro',
  REGULATORY: 'Regulatory & Policy',
};

// =============================================================================
// CATEGORY 1 — EMISSIONS & CLIMATE DATA (10 sources)
// =============================================================================

const emissionsSources = [
  // FS-001 Climate TRACE
  {
    id: 'FS-001',
    name: 'Climate TRACE',
    category: CATEGORIES.EMISSIONS,
    url: 'https://api.climatetrace.org',
    documentation: 'https://docs.climatetrace.org',
    auth: { method: 'none', notes: 'Free, no API key required' },
    rateLimit: { requests: 1000, period: 'hour' },
    format: 'JSON',
    coverage: { geographic: 'Global', temporal: '2015-2024', entities: '80,000+ facilities' },
    updateFrequency: 'Annual',
    license: 'CC BY 4.0',
    endpoints: [
      {
        path: '/v6/country/emissions',
        method: 'GET',
        description: 'Country-level emissions by sector and gas',
        params: ['country', 'sector', 'gas', 'since', 'to'],
        fields: [
          { sourceField: 'emissions_quantity', targetTable: 'company_emissions', targetColumn: 'scope1_tco2e', type: 'number', unit: 'tCO2e' },
          { sourceField: 'emissions_quantity_co2', targetTable: 'company_emissions', targetColumn: 'co2_tonnes', type: 'number', unit: 'tCO2' },
          { sourceField: 'emissions_quantity_ch4', targetTable: 'company_emissions', targetColumn: 'ch4_tonnes', type: 'number', unit: 'tCH4' },
          { sourceField: 'emissions_quantity_n2o', targetTable: 'company_emissions', targetColumn: 'n2o_tonnes', type: 'number', unit: 'tN2O' },
          { sourceField: 'sector', targetTable: 'company_emissions', targetColumn: 'sector_code', type: 'string', unit: null },
          { sourceField: 'country', targetTable: 'company_emissions', targetColumn: 'country_iso', type: 'string', unit: null },
        ],
        engines: ['E-001', 'E-006', 'E-007'],
      },
      {
        path: '/v6/assets',
        method: 'GET',
        description: 'Facility-level emissions with geolocation',
        params: ['countries', 'sectors', 'subsectors', 'continents'],
        fields: [
          { sourceField: 'asset_name', targetTable: 'facilities', targetColumn: 'facility_name', type: 'string', unit: null },
          { sourceField: 'asset_type', targetTable: 'facilities', targetColumn: 'facility_type', type: 'string', unit: null },
          { sourceField: 'emissions_quantity', targetTable: 'facilities', targetColumn: 'annual_emissions_tco2e', type: 'number', unit: 'tCO2e' },
          { sourceField: 'lat', targetTable: 'facilities', targetColumn: 'latitude', type: 'number', unit: 'degrees' },
          { sourceField: 'lon', targetTable: 'facilities', targetColumn: 'longitude', type: 'number', unit: 'degrees' },
          { sourceField: 'capacity', targetTable: 'facilities', targetColumn: 'capacity_mw', type: 'number', unit: 'MW' },
        ],
        engines: ['E-001', 'E-006', 'E-020'],
      },
    ],
    modules: ['carbon-calculator', 'scope3-upstream-tracker', 'ngfs-scenarios', 'pcaf-financed-emissions'],
    qualityAssessment: { accuracy: qScore(1), timeliness: qScore(2), completeness: qScore(3), methodology: 'Satellite + ML estimation' },
  },

  // FS-002 Global Carbon Project
  {
    id: 'FS-002',
    name: 'Global Carbon Project',
    category: CATEGORIES.EMISSIONS,
    url: 'https://globalcarbonproject.org/carbonbudget',
    documentation: 'https://globalcarbonproject.org/carbonbudget/archive.htm',
    auth: { method: 'none', notes: 'Free download, no registration' },
    rateLimit: { requests: 100, period: 'day' },
    format: 'CSV/XLSX',
    coverage: { geographic: 'Global', temporal: '1959-2023', entities: '200+ countries' },
    updateFrequency: 'Annual (November)',
    license: 'CC BY 4.0',
    endpoints: [
      {
        path: '/GCB2023v43_MtCO2_flat.csv',
        method: 'GET',
        description: 'Global CO2 budget with territorial and consumption-based accounting',
        params: [],
        fields: [
          { sourceField: 'fossil_emissions_excluding_cement', targetTable: 'country_emissions', targetColumn: 'fossil_co2_mt', type: 'number', unit: 'MtCO2' },
          { sourceField: 'cement_carbonation_sink', targetTable: 'country_emissions', targetColumn: 'cement_co2_mt', type: 'number', unit: 'MtCO2' },
          { sourceField: 'land_use_change_emissions', targetTable: 'country_emissions', targetColumn: 'lulucf_co2_mt', type: 'number', unit: 'MtCO2' },
          { sourceField: 'atmospheric_growth', targetTable: 'climate_scenarios', targetColumn: 'atmospheric_co2_growth_ppm', type: 'number', unit: 'ppm' },
          { sourceField: 'ocean_sink', targetTable: 'climate_scenarios', targetColumn: 'ocean_sink_gtc', type: 'number', unit: 'GtC' },
          { sourceField: 'land_sink', targetTable: 'climate_scenarios', targetColumn: 'land_sink_gtc', type: 'number', unit: 'GtC' },
        ],
        engines: ['E-001', 'E-007', 'E-028'],
      },
    ],
    modules: ['carbon-calculator', 'ngfs-scenarios', 'climate-finance-hub'],
    qualityAssessment: { accuracy: qScore(4), timeliness: qScore(5), completeness: qScore(6), methodology: 'Bottom-up inventory + top-down inversion' },
  },

  // FS-003 EDGAR JRC
  {
    id: 'FS-003',
    name: 'EDGAR (JRC Emissions Database)',
    category: CATEGORIES.EMISSIONS,
    url: 'https://edgar.jrc.ec.europa.eu/api',
    documentation: 'https://edgar.jrc.ec.europa.eu/dataset_ghg80',
    auth: { method: 'none', notes: 'Free, no API key required' },
    rateLimit: { requests: 500, period: 'hour' },
    format: 'JSON/CSV',
    coverage: { geographic: 'Global (200+ countries)', temporal: '1970-2022', entities: 'Country-sector level' },
    updateFrequency: 'Annual',
    license: 'EU Open Licence',
    endpoints: [
      {
        path: '/v80/timeseries',
        method: 'GET',
        description: 'GHG time series by country, sector, and substance',
        params: ['country_code', 'substance', 'sector_code', 'year_from', 'year_to'],
        fields: [
          { sourceField: 'CO2_kt', targetTable: 'country_emissions', targetColumn: 'co2_kt', type: 'number', unit: 'kt CO2' },
          { sourceField: 'CH4_kt', targetTable: 'country_emissions', targetColumn: 'ch4_kt', type: 'number', unit: 'kt CH4' },
          { sourceField: 'N2O_kt', targetTable: 'country_emissions', targetColumn: 'n2o_kt', type: 'number', unit: 'kt N2O' },
          { sourceField: 'GHG_total_kt_CO2eq', targetTable: 'country_emissions', targetColumn: 'total_ghg_ktco2e', type: 'number', unit: 'kt CO2e' },
          { sourceField: 'IPCC_sector', targetTable: 'country_emissions', targetColumn: 'ipcc_sector', type: 'string', unit: null },
        ],
        engines: ['E-001', 'E-006', 'E-007', 'E-028'],
      },
      {
        path: '/v80/gridmaps',
        method: 'GET',
        description: 'Gridded emissions maps (0.1° x 0.1° resolution)',
        params: ['substance', 'year', 'sector'],
        fields: [
          { sourceField: 'grid_cell_emissions', targetTable: 'spatial_emissions', targetColumn: 'cell_emissions_tco2e', type: 'number', unit: 'tCO2e' },
          { sourceField: 'lat_center', targetTable: 'spatial_emissions', targetColumn: 'latitude', type: 'number', unit: 'degrees' },
          { sourceField: 'lon_center', targetTable: 'spatial_emissions', targetColumn: 'longitude', type: 'number', unit: 'degrees' },
        ],
        engines: ['E-001', 'E-020'],
      },
    ],
    modules: ['carbon-calculator', 'scope3-upstream-tracker', 'ngfs-scenarios', 'csrd-esrs-automation'],
    qualityAssessment: { accuracy: qScore(7), timeliness: qScore(8), completeness: qScore(9), methodology: 'Activity data × emission factors (IPCC Tier 1/2)' },
  },

  // FS-004 CAIT / Climate Watch
  {
    id: 'FS-004',
    name: 'Climate Watch (WRI)',
    category: CATEGORIES.EMISSIONS,
    url: 'https://www.climatewatchdata.org/api/v1',
    documentation: 'https://www.climatewatchdata.org/about/faq/api',
    auth: { method: 'none', notes: 'Free, no API key required' },
    rateLimit: { requests: 500, period: 'hour' },
    format: 'JSON',
    coverage: { geographic: 'Global (197 parties)', temporal: '1990-2020', entities: 'NDC tracker + historical emissions' },
    updateFrequency: 'Quarterly',
    license: 'CC BY 4.0',
    endpoints: [
      {
        path: '/emissions/data',
        method: 'GET',
        description: 'Historical GHG emissions by country and sector (CAIT data)',
        params: ['regions', 'source', 'gas', 'sector', 'start_year', 'end_year'],
        fields: [
          { sourceField: 'value', targetTable: 'country_emissions', targetColumn: 'ghg_mtco2e', type: 'number', unit: 'MtCO2e' },
          { sourceField: 'sector', targetTable: 'country_emissions', targetColumn: 'cait_sector', type: 'string', unit: null },
          { sourceField: 'gas', targetTable: 'country_emissions', targetColumn: 'gas_type', type: 'string', unit: null },
          { sourceField: 'iso_code3', targetTable: 'country_emissions', targetColumn: 'country_iso3', type: 'string', unit: null },
        ],
        engines: ['E-001', 'E-007'],
      },
      {
        path: '/ndcs',
        method: 'GET',
        description: 'NDC targets, policies, and adaptation submissions',
        params: ['countries', 'categories', 'indicators'],
        fields: [
          { sourceField: 'value', targetTable: 'ndc_targets', targetColumn: 'target_value', type: 'string', unit: null },
          { sourceField: 'indicator.name', targetTable: 'ndc_targets', targetColumn: 'indicator_name', type: 'string', unit: null },
          { sourceField: 'category.name', targetTable: 'ndc_targets', targetColumn: 'ndc_category', type: 'string', unit: null },
        ],
        engines: ['E-007', 'E-028', 'E-033'],
      },
    ],
    modules: ['ngfs-scenarios', 'climate-policy-intelligence', 'transition-scenario-modeller'],
    qualityAssessment: { accuracy: qScore(10), timeliness: qScore(11), completeness: qScore(12), methodology: 'Aggregated from UNFCCC, EDGAR, IEA sources' },
  },

  // FS-005 Carbon Monitor
  {
    id: 'FS-005',
    name: 'Carbon Monitor',
    category: CATEGORIES.EMISSIONS,
    url: 'https://carbonmonitor.org/api',
    documentation: 'https://carbonmonitor.org/about',
    auth: { method: 'none', notes: 'Free, no API key required' },
    rateLimit: { requests: 200, period: 'hour' },
    format: 'JSON/CSV',
    coverage: { geographic: 'Global (top emitters + EU27)', temporal: '2019-present (daily)', entities: 'Country-sector daily' },
    updateFrequency: 'Daily',
    license: 'CC BY 4.0',
    endpoints: [
      {
        path: '/data/daily',
        method: 'GET',
        description: 'Near-real-time daily CO2 emissions by country and sector',
        params: ['country', 'sector', 'date_from', 'date_to'],
        fields: [
          { sourceField: 'daily_emission_MtCO2', targetTable: 'daily_emissions', targetColumn: 'co2_mt_daily', type: 'number', unit: 'MtCO2/day' },
          { sourceField: 'sector', targetTable: 'daily_emissions', targetColumn: 'sector', type: 'string', unit: null },
          { sourceField: 'country', targetTable: 'daily_emissions', targetColumn: 'country_name', type: 'string', unit: null },
          { sourceField: 'date', targetTable: 'daily_emissions', targetColumn: 'observation_date', type: 'date', unit: 'YYYY-MM-DD' },
        ],
        engines: ['E-001', 'E-006'],
      },
    ],
    modules: ['carbon-calculator', 'scope3-upstream-tracker'],
    qualityAssessment: { accuracy: qScore(13), timeliness: qScore(14), completeness: qScore(15), methodology: 'Real-time activity data (power, transport, industry)' },
  },

  // FS-006 Open Climate Data
  {
    id: 'FS-006',
    name: 'Open Climate Data',
    category: CATEGORIES.EMISSIONS,
    url: 'https://openclimatedata.net',
    documentation: 'https://github.com/openclimatedata',
    auth: { method: 'none', notes: 'Free, GitHub-hosted datasets' },
    rateLimit: { requests: 60, period: 'minute' },
    format: 'CSV',
    coverage: { geographic: 'Global', temporal: '1850-present', entities: 'National inventories' },
    updateFrequency: 'Annual',
    license: 'CC0 / Public Domain',
    endpoints: [
      {
        path: '/national-climate-plans/data',
        method: 'GET',
        description: 'Curated national climate plan data (NDCs, LTS)',
        params: [],
        fields: [
          { sourceField: 'target_year', targetTable: 'ndc_targets', targetColumn: 'target_year', type: 'number', unit: 'year' },
          { sourceField: 'base_year', targetTable: 'ndc_targets', targetColumn: 'base_year', type: 'number', unit: 'year' },
          { sourceField: 'reduction_pct', targetTable: 'ndc_targets', targetColumn: 'reduction_target_pct', type: 'number', unit: '%' },
          { sourceField: 'country_iso', targetTable: 'ndc_targets', targetColumn: 'country_iso3', type: 'string', unit: null },
        ],
        engines: ['E-007', 'E-033'],
      },
    ],
    modules: ['climate-policy-intelligence', 'ngfs-scenarios'],
    qualityAssessment: { accuracy: qScore(16), timeliness: qScore(17), completeness: qScore(18), methodology: 'Curated from official UNFCCC submissions' },
  },

  // FS-007 PRIMAP-hist
  {
    id: 'FS-007',
    name: 'PRIMAP-hist',
    category: CATEGORIES.EMISSIONS,
    url: 'https://github.com/openclimatedata/primap-hist',
    documentation: 'https://doi.org/10.5281/zenodo.10006301',
    auth: { method: 'none', notes: 'Free, Zenodo-hosted' },
    rateLimit: { requests: 60, period: 'minute' },
    format: 'CSV/NetCDF',
    coverage: { geographic: 'Global (216 countries)', temporal: '1750-2022', entities: 'Country × sector × gas' },
    updateFrequency: 'Annual',
    license: 'CC BY 4.0',
    endpoints: [
      {
        path: '/v2.5/PRIMAP-hist_v2.5_final_no_extrap_19-Jan-2024.csv',
        method: 'GET',
        description: 'Historical country-level GHG emissions 1750-2022',
        params: [],
        fields: [
          { sourceField: 'KYOTOGHG_AR5GWP100', targetTable: 'country_emissions', targetColumn: 'kyoto_ghg_mtco2e', type: 'number', unit: 'MtCO2e' },
          { sourceField: 'CO2', targetTable: 'country_emissions', targetColumn: 'co2_mt', type: 'number', unit: 'MtCO2' },
          { sourceField: 'CH4', targetTable: 'country_emissions', targetColumn: 'ch4_mt', type: 'number', unit: 'MtCH4' },
          { sourceField: 'N2O', targetTable: 'country_emissions', targetColumn: 'n2o_mt', type: 'number', unit: 'MtN2O' },
          { sourceField: 'FGAS', targetTable: 'country_emissions', targetColumn: 'fgas_mtco2e', type: 'number', unit: 'MtCO2e' },
          { sourceField: 'area', targetTable: 'country_emissions', targetColumn: 'country_iso3', type: 'string', unit: null },
          { sourceField: 'category', targetTable: 'country_emissions', targetColumn: 'ipcc_category', type: 'string', unit: null },
        ],
        engines: ['E-001', 'E-007', 'E-028'],
      },
    ],
    modules: ['carbon-calculator', 'ngfs-scenarios', 'climate-finance-hub'],
    qualityAssessment: { accuracy: qScore(19), timeliness: qScore(20), completeness: qScore(21), methodology: 'Composite dataset: UNFCCC CRF + BUR + EDGAR gap-filling' },
  },

  // FS-008 Global Methane Tracker (IEA)
  {
    id: 'FS-008',
    name: 'IEA Global Methane Tracker',
    category: CATEGORIES.EMISSIONS,
    url: 'https://www.iea.org/data-and-statistics/data-tools/methane-tracker',
    documentation: 'https://www.iea.org/reports/global-methane-tracker-2024',
    auth: { method: 'none', notes: 'Free data explorer; bulk downloads require IEA free account' },
    rateLimit: { requests: 100, period: 'hour' },
    format: 'CSV/XLSX',
    coverage: { geographic: 'Global', temporal: '2000-2023', entities: 'Country × sector (energy, agriculture, waste)' },
    updateFrequency: 'Annual (February)',
    license: 'IEA Free Data Licence',
    endpoints: [
      {
        path: '/methane-tracker/data-download',
        method: 'GET',
        description: 'Methane emissions by country and sector',
        params: ['country', 'sector', 'year'],
        fields: [
          { sourceField: 'methane_mt', targetTable: 'country_emissions', targetColumn: 'ch4_mt', type: 'number', unit: 'Mt CH4' },
          { sourceField: 'methane_co2eq_mt', targetTable: 'country_emissions', targetColumn: 'ch4_co2e_mt', type: 'number', unit: 'MtCO2e' },
          { sourceField: 'abatement_potential_mt', targetTable: 'abatement_measures', targetColumn: 'abatement_potential_mt', type: 'number', unit: 'Mt CH4' },
          { sourceField: 'abatement_cost_usd_per_t', targetTable: 'abatement_measures', targetColumn: 'marginal_cost_usd', type: 'number', unit: 'USD/tCH4' },
        ],
        engines: ['E-001', 'E-006', 'E-028'],
      },
    ],
    modules: ['carbon-calculator', 'abatement-cost-curve', 'decarbonisation-roadmap'],
    qualityAssessment: { accuracy: qScore(22), timeliness: qScore(23), completeness: qScore(24), methodology: 'Bottom-up + satellite (TROPOMI) verification' },
  },

  // FS-009 EDGAR v8.0 Comprehensive GHG
  {
    id: 'FS-009',
    name: 'EDGAR v8.0 Comprehensive GHG',
    category: CATEGORIES.EMISSIONS,
    url: 'https://edgar.jrc.ec.europa.eu/dataset_ghg80',
    documentation: 'https://edgar.jrc.ec.europa.eu/methodology',
    auth: { method: 'none', notes: 'Free, direct download' },
    rateLimit: { requests: 200, period: 'hour' },
    format: 'CSV/XLS',
    coverage: { geographic: 'Global (220+ territories)', temporal: '1970-2022', entities: 'Country × IPCC sector × 25 GHGs' },
    updateFrequency: 'Annual',
    license: 'EU Open Licence v1.2',
    endpoints: [
      {
        path: '/dataset_ghg80/v8.0_ghg_total',
        method: 'GET',
        description: 'Total GHG emissions (CO2, CH4, N2O, F-gases) by country',
        params: ['country', 'year'],
        fields: [
          { sourceField: 'GHG_total_MtCO2eq', targetTable: 'country_emissions', targetColumn: 'total_ghg_mtco2e', type: 'number', unit: 'MtCO2e' },
          { sourceField: 'CO2_bio', targetTable: 'country_emissions', targetColumn: 'biogenic_co2_mt', type: 'number', unit: 'MtCO2' },
          { sourceField: 'HFCs_MtCO2eq', targetTable: 'country_emissions', targetColumn: 'hfc_mtco2e', type: 'number', unit: 'MtCO2e' },
          { sourceField: 'SF6_MtCO2eq', targetTable: 'country_emissions', targetColumn: 'sf6_mtco2e', type: 'number', unit: 'MtCO2e' },
          { sourceField: 'NF3_MtCO2eq', targetTable: 'country_emissions', targetColumn: 'nf3_mtco2e', type: 'number', unit: 'MtCO2e' },
        ],
        engines: ['E-001', 'E-006', 'E-007'],
      },
    ],
    modules: ['carbon-calculator', 'ngfs-scenarios', 'csrd-esrs-automation'],
    qualityAssessment: { accuracy: qScore(25), timeliness: qScore(26), completeness: qScore(27), methodology: 'IPCC Tier 1/2 activity data × EFs for all Kyoto gases' },
  },

  // FS-010 National GHG Inventories (UNFCCC)
  {
    id: 'FS-010',
    name: 'UNFCCC National GHG Inventories',
    category: CATEGORIES.EMISSIONS,
    url: 'https://unfccc.int/ghg-inventories-annex-i-parties/2024',
    documentation: 'https://unfccc.int/process-and-meetings/transparency-and-reporting',
    auth: { method: 'none', notes: 'Free, public data' },
    rateLimit: { requests: 100, period: 'hour' },
    format: 'CSV/XLS',
    coverage: { geographic: 'Annex I + Non-Annex I parties', temporal: '1990-2022', entities: '197 parties, CRF tables' },
    updateFrequency: 'Annual (April)',
    license: 'Public Domain (UN)',
    endpoints: [
      {
        path: '/api/ghg/annex-i',
        method: 'GET',
        description: 'Official Annex I country GHG submissions (CRF tables)',
        params: ['party', 'year', 'category', 'classification'],
        fields: [
          { sourceField: 'emissions_gg_co2eq', targetTable: 'country_emissions', targetColumn: 'official_ghg_ggco2e', type: 'number', unit: 'Gg CO2e' },
          { sourceField: 'party', targetTable: 'country_emissions', targetColumn: 'country_name', type: 'string', unit: null },
          { sourceField: 'crf_category', targetTable: 'country_emissions', targetColumn: 'crf_category', type: 'string', unit: null },
          { sourceField: 'base_year_emissions', targetTable: 'country_emissions', targetColumn: 'base_year_ghg_ggco2e', type: 'number', unit: 'Gg CO2e' },
          { sourceField: 'implied_ef', targetTable: 'emission_factors', targetColumn: 'implied_ef_value', type: 'number', unit: 'varies' },
        ],
        engines: ['E-001', 'E-007', 'E-028', 'E-033'],
      },
    ],
    modules: ['carbon-calculator', 'ngfs-scenarios', 'climate-policy-intelligence', 'isbb-disclosure'],
    qualityAssessment: { accuracy: qScore(28), timeliness: qScore(29), completeness: qScore(30), methodology: 'Official party submissions, IPCC 2006 guidelines' },
  },
];

// =============================================================================
// CATEGORY 2 — ENERGY & GRID (8 sources)
// =============================================================================

const energySources = [
  // FS-011 Ember Climate
  {
    id: 'FS-011',
    name: 'Ember Climate',
    category: CATEGORIES.ENERGY,
    url: 'https://ember-climate.org/data/data-tools',
    documentation: 'https://ember-climate.org/data/data-explorer',
    auth: { method: 'none', notes: 'Free download, no registration for core datasets' },
    rateLimit: { requests: 200, period: 'hour' },
    format: 'CSV/JSON',
    coverage: { geographic: 'Global (200+ countries)', temporal: '2000-2024', entities: 'Country-level electricity data' },
    updateFrequency: 'Monthly',
    license: 'CC BY 4.0',
    endpoints: [
      {
        path: '/data/yearly-electricity-data',
        method: 'GET',
        description: 'Annual electricity generation by source and carbon intensity',
        params: ['country_code', 'year', 'category'],
        fields: [
          { sourceField: 'generation_twh', targetTable: 'energy_generation', targetColumn: 'generation_twh', type: 'number', unit: 'TWh' },
          { sourceField: 'share_of_generation_pct', targetTable: 'energy_generation', targetColumn: 'source_share_pct', type: 'number', unit: '%' },
          { sourceField: 'emissions_intensity_gco2_kwh', targetTable: 'grid_intensity', targetColumn: 'carbon_intensity_gco2_kwh', type: 'number', unit: 'gCO2/kWh' },
          { sourceField: 'total_generation_twh', targetTable: 'energy_generation', targetColumn: 'total_generation_twh', type: 'number', unit: 'TWh' },
          { sourceField: 'clean_pct', targetTable: 'energy_generation', targetColumn: 'clean_energy_pct', type: 'number', unit: '%' },
          { sourceField: 'fossil_pct', targetTable: 'energy_generation', targetColumn: 'fossil_energy_pct', type: 'number', unit: '%' },
        ],
        engines: ['E-006', 'E-008', 'E-020'],
      },
      {
        path: '/data/monthly-electricity-data',
        method: 'GET',
        description: 'Monthly electricity generation updates',
        params: ['country_code', 'year', 'month'],
        fields: [
          { sourceField: 'generation_twh', targetTable: 'energy_generation', targetColumn: 'monthly_gen_twh', type: 'number', unit: 'TWh' },
          { sourceField: 'demand_twh', targetTable: 'energy_consumption', targetColumn: 'monthly_demand_twh', type: 'number', unit: 'TWh' },
        ],
        engines: ['E-006', 'E-008'],
      },
    ],
    modules: ['energy-transition-analytics', 'carbon-calculator', 'scope2-market-based'],
    qualityAssessment: { accuracy: qScore(31), timeliness: qScore(32), completeness: qScore(33), methodology: 'National energy statistics + IEA/EIA reconciliation' },
  },

  // FS-012 IRENA
  {
    id: 'FS-012',
    name: 'IRENA Statistics',
    category: CATEGORIES.ENERGY,
    url: 'https://www.irena.org/Statistics',
    documentation: 'https://www.irena.org/Data/Downloads/IRENASTAT',
    auth: { method: 'none', notes: 'Free public data' },
    rateLimit: { requests: 100, period: 'hour' },
    format: 'CSV/XLSX',
    coverage: { geographic: 'Global (200+ countries)', temporal: '2000-2023', entities: 'Renewable energy capacity and costs' },
    updateFrequency: 'Annual (March)',
    license: 'IRENA Open Data Licence',
    endpoints: [
      {
        path: '/IRENASTAT/capacity-and-generation',
        method: 'GET',
        description: 'Renewable energy capacity by technology and country',
        params: ['country', 'technology', 'year'],
        fields: [
          { sourceField: 'installed_capacity_mw', targetTable: 'renewable_capacity', targetColumn: 'capacity_mw', type: 'number', unit: 'MW' },
          { sourceField: 'generation_gwh', targetTable: 'energy_generation', targetColumn: 'renewable_gen_gwh', type: 'number', unit: 'GWh' },
          { sourceField: 'technology', targetTable: 'renewable_capacity', targetColumn: 'technology_type', type: 'string', unit: null },
          { sourceField: 'off_grid_capacity_mw', targetTable: 'renewable_capacity', targetColumn: 'off_grid_mw', type: 'number', unit: 'MW' },
        ],
        engines: ['E-006', 'E-008', 'E-020'],
      },
      {
        path: '/IRENASTAT/costs',
        method: 'GET',
        description: 'Renewable power generation costs (LCOE)',
        params: ['technology', 'year', 'country'],
        fields: [
          { sourceField: 'lcoe_usd_kwh', targetTable: 'energy_costs', targetColumn: 'lcoe_usd_kwh', type: 'number', unit: 'USD/kWh' },
          { sourceField: 'capex_usd_kw', targetTable: 'energy_costs', targetColumn: 'capex_usd_kw', type: 'number', unit: 'USD/kW' },
          { sourceField: 'capacity_factor_pct', targetTable: 'energy_costs', targetColumn: 'capacity_factor', type: 'number', unit: '%' },
        ],
        engines: ['E-008', 'E-020', 'E-028'],
      },
    ],
    modules: ['energy-transition-analytics', 'green-asset-ratio', 'climate-finance-hub'],
    qualityAssessment: { accuracy: qScore(34), timeliness: qScore(35), completeness: qScore(36), methodology: 'National reporting + IRENA surveys' },
  },

  // FS-013 Open Power System Data
  {
    id: 'FS-013',
    name: 'Open Power System Data',
    category: CATEGORIES.ENERGY,
    url: 'https://open-power-system-data.org',
    documentation: 'https://data.open-power-system-data.org',
    auth: { method: 'none', notes: 'Free, CC BY 4.0 datasets' },
    rateLimit: { requests: 60, period: 'minute' },
    format: 'CSV/SQLite',
    coverage: { geographic: 'Europe (35 countries)', temporal: '2005-2023', entities: 'Power plants, time series, national aggregates' },
    updateFrequency: 'Quarterly',
    license: 'CC BY 4.0',
    endpoints: [
      {
        path: '/time_series/latest',
        method: 'GET',
        description: 'Hourly power system time series (load, wind, solar, prices)',
        params: ['country', 'variable', 'start', 'end'],
        fields: [
          { sourceField: 'load_actual_entsoe_mw', targetTable: 'energy_consumption', targetColumn: 'hourly_load_mw', type: 'number', unit: 'MW' },
          { sourceField: 'wind_generation_actual_mw', targetTable: 'energy_generation', targetColumn: 'wind_gen_mw', type: 'number', unit: 'MW' },
          { sourceField: 'solar_generation_actual_mw', targetTable: 'energy_generation', targetColumn: 'solar_gen_mw', type: 'number', unit: 'MW' },
          { sourceField: 'day_ahead_price_eur_mwh', targetTable: 'energy_costs', targetColumn: 'day_ahead_price_eur_mwh', type: 'number', unit: 'EUR/MWh' },
        ],
        engines: ['E-006', 'E-008'],
      },
      {
        path: '/conventional_power_plants/latest',
        method: 'GET',
        description: 'Conventional power plant registry (EU)',
        params: ['country', 'fuel_type'],
        fields: [
          { sourceField: 'capacity_net_bnetza', targetTable: 'facilities', targetColumn: 'capacity_mw', type: 'number', unit: 'MW' },
          { sourceField: 'fuel', targetTable: 'facilities', targetColumn: 'fuel_type', type: 'string', unit: null },
          { sourceField: 'commissioned', targetTable: 'facilities', targetColumn: 'commission_year', type: 'number', unit: 'year' },
          { sourceField: 'efficiency', targetTable: 'facilities', targetColumn: 'thermal_efficiency', type: 'number', unit: '%' },
        ],
        engines: ['E-006', 'E-020'],
      },
    ],
    modules: ['energy-transition-analytics', 'scope2-market-based', 'climate-stress-test'],
    qualityAssessment: { accuracy: qScore(37), timeliness: qScore(38), completeness: qScore(39), methodology: 'ENTSO-E transparency platform + national TSO data' },
  },

  // FS-014 EIA
  {
    id: 'FS-014',
    name: 'US Energy Information Administration',
    category: CATEGORIES.ENERGY,
    url: 'https://api.eia.gov/v2',
    documentation: 'https://www.eia.gov/opendata/documentation.php',
    auth: { method: 'api_key', notes: 'Free API key, register at eia.gov', keyParam: 'api_key' },
    rateLimit: { requests: 5000, period: 'hour' },
    format: 'JSON',
    coverage: { geographic: 'United States (+ international datasets)', temporal: '1949-present', entities: 'State-level + national energy data' },
    updateFrequency: 'Monthly',
    license: 'Public Domain (US Government)',
    endpoints: [
      {
        path: '/electricity/rto/fuel-type-data',
        method: 'GET',
        description: 'Real-time electricity generation by fuel type and balancing authority',
        params: ['frequency', 'data', 'facets', 'start', 'end'],
        fields: [
          { sourceField: 'value', targetTable: 'energy_generation', targetColumn: 'generation_mwh', type: 'number', unit: 'MWh' },
          { sourceField: 'fueltype', targetTable: 'energy_generation', targetColumn: 'fuel_type', type: 'string', unit: null },
          { sourceField: 'respondent', targetTable: 'energy_generation', targetColumn: 'balancing_authority', type: 'string', unit: null },
        ],
        engines: ['E-006', 'E-008'],
      },
      {
        path: '/co2-emissions/co2-emissions-aggregates',
        method: 'GET',
        description: 'US CO2 emissions from energy consumption',
        params: ['frequency', 'data', 'facets'],
        fields: [
          { sourceField: 'value', targetTable: 'country_emissions', targetColumn: 'energy_co2_mmt', type: 'number', unit: 'MMT CO2' },
          { sourceField: 'sectorId', targetTable: 'country_emissions', targetColumn: 'eia_sector', type: 'string', unit: null },
          { sourceField: 'stateId', targetTable: 'country_emissions', targetColumn: 'us_state_code', type: 'string', unit: null },
        ],
        engines: ['E-001', 'E-006'],
      },
      {
        path: '/petroleum/pri/spt',
        method: 'GET',
        description: 'Petroleum spot prices (Brent, WTI)',
        params: ['frequency', 'data', 'facets', 'start', 'end'],
        fields: [
          { sourceField: 'value', targetTable: 'commodity_prices', targetColumn: 'price_usd_bbl', type: 'number', unit: 'USD/bbl' },
          { sourceField: 'product-name', targetTable: 'commodity_prices', targetColumn: 'product_name', type: 'string', unit: null },
        ],
        engines: ['E-008', 'E-028'],
      },
    ],
    modules: ['energy-transition-analytics', 'carbon-calculator', 'climate-stress-test', 'fossil-fuel-tracker'],
    qualityAssessment: { accuracy: qScore(40), timeliness: qScore(41), completeness: qScore(42), methodology: 'Official US Government surveys (EIA-860, EIA-923, EIA-861)' },
  },

  // FS-015 Electricity Maps
  {
    id: 'FS-015',
    name: 'Electricity Maps',
    category: CATEGORIES.ENERGY,
    url: 'https://api.electricitymap.org/v3',
    documentation: 'https://static.electricitymaps.com/api/docs/index.html',
    auth: { method: 'api_key', notes: 'Free tier: 100 requests/month; auth-token header', keyParam: 'auth-token' },
    rateLimit: { requests: 100, period: 'month' },
    format: 'JSON',
    coverage: { geographic: 'Global (160+ zones)', temporal: 'Real-time + 24h history', entities: 'Grid zones' },
    updateFrequency: 'Real-time (5-min intervals)',
    license: 'Free tier with attribution',
    endpoints: [
      {
        path: '/carbon-intensity/latest',
        method: 'GET',
        description: 'Real-time grid carbon intensity by zone',
        params: ['zone'],
        fields: [
          { sourceField: 'carbonIntensity', targetTable: 'grid_intensity', targetColumn: 'carbon_intensity_gco2_kwh', type: 'number', unit: 'gCO2eq/kWh' },
          { sourceField: 'fossilFuelPercentage', targetTable: 'grid_intensity', targetColumn: 'fossil_pct', type: 'number', unit: '%' },
          { sourceField: 'renewablePercentage', targetTable: 'grid_intensity', targetColumn: 'renewable_pct', type: 'number', unit: '%' },
          { sourceField: 'zone', targetTable: 'grid_intensity', targetColumn: 'grid_zone', type: 'string', unit: null },
          { sourceField: 'datetime', targetTable: 'grid_intensity', targetColumn: 'observation_ts', type: 'datetime', unit: 'ISO 8601' },
        ],
        engines: ['E-006', 'E-008'],
      },
      {
        path: '/power-breakdown/latest',
        method: 'GET',
        description: 'Real-time power generation breakdown by source',
        params: ['zone'],
        fields: [
          { sourceField: 'powerConsumptionTotal', targetTable: 'energy_consumption', targetColumn: 'consumption_mw', type: 'number', unit: 'MW' },
          { sourceField: 'powerProductionTotal', targetTable: 'energy_generation', targetColumn: 'production_mw', type: 'number', unit: 'MW' },
        ],
        engines: ['E-006', 'E-008'],
      },
    ],
    modules: ['scope2-market-based', 'energy-transition-analytics', 'carbon-calculator'],
    qualityAssessment: { accuracy: qScore(43), timeliness: qScore(44), completeness: qScore(45), methodology: 'Real-time TSO data + life cycle assessment EFs' },
  },

  // FS-016 Global Energy Monitor
  {
    id: 'FS-016',
    name: 'Global Energy Monitor',
    category: CATEGORIES.ENERGY,
    url: 'https://globalenergymonitor.org/projects',
    documentation: 'https://globalenergymonitor.org/methodology',
    auth: { method: 'none', notes: 'Free, downloadable tracker datasets' },
    rateLimit: { requests: 100, period: 'hour' },
    format: 'CSV/XLSX',
    coverage: { geographic: 'Global', temporal: '2000-present', entities: 'Coal, gas, oil, wind, solar projects' },
    updateFrequency: 'Biannual',
    license: 'CC BY 4.0',
    endpoints: [
      {
        path: '/global-coal-plant-tracker/download',
        method: 'GET',
        description: 'Global Coal Plant Tracker — operating, planned, retired coal plants',
        params: ['status', 'country'],
        fields: [
          { sourceField: 'Capacity (MW)', targetTable: 'facilities', targetColumn: 'capacity_mw', type: 'number', unit: 'MW' },
          { sourceField: 'Status', targetTable: 'facilities', targetColumn: 'operational_status', type: 'string', unit: null },
          { sourceField: 'Country', targetTable: 'facilities', targetColumn: 'country', type: 'string', unit: null },
          { sourceField: 'Annual CO2 (Mt)', targetTable: 'facilities', targetColumn: 'annual_co2_mt', type: 'number', unit: 'MtCO2' },
          { sourceField: 'Commissioning Year', targetTable: 'facilities', targetColumn: 'commission_year', type: 'number', unit: 'year' },
          { sourceField: 'Retirement Year', targetTable: 'facilities', targetColumn: 'retirement_year', type: 'number', unit: 'year' },
        ],
        engines: ['E-006', 'E-008', 'E-020', 'E-028'],
      },
    ],
    modules: ['energy-transition-analytics', 'fossil-fuel-tracker', 'stranded-asset-analysis', 'transition-plan-builder'],
    qualityAssessment: { accuracy: qScore(46), timeliness: qScore(47), completeness: qScore(48), methodology: 'Manual research + satellite verification' },
  },

  // FS-017 BNEF Public Data
  {
    id: 'FS-017',
    name: 'BNEF Public Datasets',
    category: CATEGORIES.ENERGY,
    url: 'https://about.bnef.com/clean-energy-investment',
    documentation: 'https://about.bnef.com/methodology',
    auth: { method: 'none', notes: 'Selected summary datasets are free; full access requires subscription' },
    rateLimit: { requests: 50, period: 'hour' },
    format: 'CSV/PDF',
    coverage: { geographic: 'Global', temporal: '2004-2023', entities: 'Clean energy investment flows' },
    updateFrequency: 'Annual (January)',
    license: 'BNEF Public Use',
    endpoints: [
      {
        path: '/clean-energy-investment/summary',
        method: 'GET',
        description: 'Annual clean energy investment by sector and region',
        params: ['year', 'region', 'sector'],
        fields: [
          { sourceField: 'investment_bn_usd', targetTable: 'climate_finance', targetColumn: 'investment_usd_bn', type: 'number', unit: 'USD billion' },
          { sourceField: 'sector', targetTable: 'climate_finance', targetColumn: 'investment_sector', type: 'string', unit: null },
          { sourceField: 'region', targetTable: 'climate_finance', targetColumn: 'region', type: 'string', unit: null },
          { sourceField: 'yoy_change_pct', targetTable: 'climate_finance', targetColumn: 'yoy_growth_pct', type: 'number', unit: '%' },
        ],
        engines: ['E-008', 'E-020', 'E-028'],
      },
    ],
    modules: ['climate-finance-hub', 'green-asset-ratio', 'energy-transition-analytics'],
    qualityAssessment: { accuracy: qScore(49), timeliness: qScore(50), completeness: qScore(51), methodology: 'BNEF proprietary deal tracking + public filings' },
  },

  // FS-018 Global Solar Atlas
  {
    id: 'FS-018',
    name: 'Global Solar Atlas',
    category: CATEGORIES.ENERGY,
    url: 'https://globalsolaratlas.info/api/data/lta',
    documentation: 'https://globalsolaratlas.info/support/about',
    auth: { method: 'none', notes: 'Free API, no registration required' },
    rateLimit: { requests: 500, period: 'hour' },
    format: 'JSON',
    coverage: { geographic: 'Global (lat/lon grid)', temporal: 'Long-term average (1999-2023)', entities: 'Any geographic point' },
    updateFrequency: 'Annual',
    license: 'CC BY 4.0',
    endpoints: [
      {
        path: '/lta',
        method: 'GET',
        description: 'Long-term solar radiation and PV output for a location',
        params: ['lat', 'lon'],
        fields: [
          { sourceField: 'GHI', targetTable: 'solar_resource', targetColumn: 'ghi_kwh_m2_day', type: 'number', unit: 'kWh/m²/day' },
          { sourceField: 'DNI', targetTable: 'solar_resource', targetColumn: 'dni_kwh_m2_day', type: 'number', unit: 'kWh/m²/day' },
          { sourceField: 'PVOUT', targetTable: 'solar_resource', targetColumn: 'pv_output_kwh_kwp_day', type: 'number', unit: 'kWh/kWp/day' },
          { sourceField: 'TEMP', targetTable: 'solar_resource', targetColumn: 'air_temp_c', type: 'number', unit: '°C' },
          { sourceField: 'OPTA', targetTable: 'solar_resource', targetColumn: 'optimal_tilt_deg', type: 'number', unit: 'degrees' },
        ],
        engines: ['E-008', 'E-020'],
      },
    ],
    modules: ['energy-transition-analytics', 'infrastructure-esg', 'real-assets-climate'],
    qualityAssessment: { accuracy: qScore(52), timeliness: qScore(53), completeness: qScore(54), methodology: 'Solargis satellite-derived irradiance model (1-3 km resolution)' },
  },
];

// =============================================================================
// CATEGORY 3 — ESG & CORPORATE (6 sources)
// =============================================================================

const esgSources = [
  // FS-019 SEC EDGAR
  {
    id: 'FS-019',
    name: 'SEC EDGAR',
    category: CATEGORIES.ESG,
    url: 'https://data.sec.gov',
    documentation: 'https://www.sec.gov/search-filings/efts/efts-api',
    auth: { method: 'user_agent', notes: 'Free; must send User-Agent with company name and email per SEC policy' },
    rateLimit: { requests: 10, period: 'second' },
    format: 'JSON/XBRL',
    coverage: { geographic: 'United States', temporal: '1993-present', entities: '10,000+ public companies' },
    updateFrequency: 'Real-time (filings)',
    license: 'Public Domain (US Government)',
    endpoints: [
      {
        path: '/submissions/CIK{cik}.json',
        method: 'GET',
        description: 'Company filings metadata (10-K, 10-Q, 8-K, DEF 14A)',
        params: ['cik'],
        fields: [
          { sourceField: 'name', targetTable: 'companies', targetColumn: 'company_name', type: 'string', unit: null },
          { sourceField: 'cik', targetTable: 'companies', targetColumn: 'sec_cik', type: 'string', unit: null },
          { sourceField: 'sic', targetTable: 'companies', targetColumn: 'sic_code', type: 'string', unit: null },
          { sourceField: 'tickers', targetTable: 'companies', targetColumn: 'ticker_symbol', type: 'string', unit: null },
          { sourceField: 'filings.recent.form', targetTable: 'sec_filings', targetColumn: 'form_type', type: 'string', unit: null },
          { sourceField: 'filings.recent.filingDate', targetTable: 'sec_filings', targetColumn: 'filing_date', type: 'date', unit: 'YYYY-MM-DD' },
        ],
        engines: ['E-002', 'E-003', 'E-010', 'E-015'],
      },
      {
        path: '/api/xbrl/companyfacts/CIK{cik}.json',
        method: 'GET',
        description: 'XBRL financial facts (revenue, assets, liabilities, GHG disclosures)',
        params: ['cik'],
        fields: [
          { sourceField: 'facts.us-gaap.Revenues.units.USD', targetTable: 'financial_data', targetColumn: 'revenue_usd', type: 'number', unit: 'USD' },
          { sourceField: 'facts.us-gaap.Assets.units.USD', targetTable: 'financial_data', targetColumn: 'total_assets_usd', type: 'number', unit: 'USD' },
          { sourceField: 'facts.us-gaap.StockholdersEquity.units.USD', targetTable: 'financial_data', targetColumn: 'equity_usd', type: 'number', unit: 'USD' },
          { sourceField: 'facts.dei.EntityCommonStockSharesOutstanding.units.shares', targetTable: 'financial_data', targetColumn: 'shares_outstanding', type: 'number', unit: 'shares' },
        ],
        engines: ['E-002', 'E-003', 'E-010', 'E-015', 'E-025'],
      },
    ],
    modules: ['esg-ratings-comparator', 'executive-pay-analytics', 'sec-climate-rule', 'proxy-voting-intel', 'board-composition'],
    qualityAssessment: { accuracy: qScore(55), timeliness: qScore(56), completeness: qScore(57), methodology: 'Official company filings to US SEC' },
  },

  // FS-020 Companies House UK
  {
    id: 'FS-020',
    name: 'Companies House',
    category: CATEGORIES.ESG,
    url: 'https://api.company-information.service.gov.uk',
    documentation: 'https://developer-specs.company-information.service.gov.uk',
    auth: { method: 'api_key', notes: 'Free API key, register at developer.company-information.service.gov.uk', keyParam: 'Authorization: Basic' },
    rateLimit: { requests: 600, period: 'five_minutes' },
    format: 'JSON',
    coverage: { geographic: 'United Kingdom', temporal: '2000-present', entities: '4M+ UK companies' },
    updateFrequency: 'Daily',
    license: 'OGL v3.0',
    endpoints: [
      {
        path: '/company/{company_number}',
        method: 'GET',
        description: 'Company profile (registered address, SIC codes, directors)',
        params: ['company_number'],
        fields: [
          { sourceField: 'company_name', targetTable: 'companies', targetColumn: 'company_name', type: 'string', unit: null },
          { sourceField: 'company_number', targetTable: 'companies', targetColumn: 'uk_company_number', type: 'string', unit: null },
          { sourceField: 'sic_codes', targetTable: 'companies', targetColumn: 'sic_codes', type: 'array', unit: null },
          { sourceField: 'registered_office_address', targetTable: 'companies', targetColumn: 'registered_address', type: 'object', unit: null },
          { sourceField: 'date_of_creation', targetTable: 'companies', targetColumn: 'incorporation_date', type: 'date', unit: 'YYYY-MM-DD' },
        ],
        engines: ['E-002', 'E-010'],
      },
      {
        path: '/company/{company_number}/officers',
        method: 'GET',
        description: 'Company officers and directors',
        params: ['company_number'],
        fields: [
          { sourceField: 'items[].name', targetTable: 'board_members', targetColumn: 'full_name', type: 'string', unit: null },
          { sourceField: 'items[].officer_role', targetTable: 'board_members', targetColumn: 'role', type: 'string', unit: null },
          { sourceField: 'items[].appointed_on', targetTable: 'board_members', targetColumn: 'appointment_date', type: 'date', unit: 'YYYY-MM-DD' },
          { sourceField: 'items[].nationality', targetTable: 'board_members', targetColumn: 'nationality', type: 'string', unit: null },
        ],
        engines: ['E-010', 'E-015'],
      },
    ],
    modules: ['board-composition', 'anti-corruption', 'uk-sdr', 'corporate-governance'],
    qualityAssessment: { accuracy: qScore(58), timeliness: qScore(59), completeness: qScore(60), methodology: 'Official UK Government company registry' },
  },

  // FS-021 OpenCorporates
  {
    id: 'FS-021',
    name: 'OpenCorporates',
    category: CATEGORIES.ESG,
    url: 'https://api.opencorporates.com/v0.4',
    documentation: 'https://api.opencorporates.com/documentation',
    auth: { method: 'api_key', notes: 'Free tier: 50 calls/month; API token via registration', keyParam: 'api_token' },
    rateLimit: { requests: 50, period: 'month' },
    format: 'JSON',
    coverage: { geographic: 'Global (140+ jurisdictions)', temporal: 'Varies by jurisdiction', entities: '200M+ companies' },
    updateFrequency: 'Daily',
    license: 'ODbL (Open Database License)',
    endpoints: [
      {
        path: '/companies/search',
        method: 'GET',
        description: 'Search for companies across global registries',
        params: ['q', 'jurisdiction_code', 'current_status'],
        fields: [
          { sourceField: 'company.name', targetTable: 'companies', targetColumn: 'company_name', type: 'string', unit: null },
          { sourceField: 'company.company_number', targetTable: 'companies', targetColumn: 'registry_number', type: 'string', unit: null },
          { sourceField: 'company.jurisdiction_code', targetTable: 'companies', targetColumn: 'jurisdiction', type: 'string', unit: null },
          { sourceField: 'company.incorporation_date', targetTable: 'companies', targetColumn: 'incorporation_date', type: 'date', unit: 'YYYY-MM-DD' },
          { sourceField: 'company.current_status', targetTable: 'companies', targetColumn: 'status', type: 'string', unit: null },
        ],
        engines: ['E-002', 'E-010'],
      },
    ],
    modules: ['anti-corruption', 'supply-chain-esg', 'modern-slavery-intel'],
    qualityAssessment: { accuracy: qScore(61), timeliness: qScore(62), completeness: qScore(63), methodology: 'Aggregated from 140+ official company registries' },
  },

  // FS-022 WikiRate
  {
    id: 'FS-022',
    name: 'WikiRate',
    category: CATEGORIES.ESG,
    url: 'https://wikirate.org',
    documentation: 'https://wikirate.org/use_our_data',
    auth: { method: 'api_key', notes: 'Free API key, register at wikirate.org', keyParam: 'X-API-Key' },
    rateLimit: { requests: 1000, period: 'day' },
    format: 'JSON',
    coverage: { geographic: 'Global', temporal: '2010-present', entities: '50,000+ companies, 3M+ data points' },
    updateFrequency: 'Continuous (crowd-sourced)',
    license: 'CC BY 4.0',
    endpoints: [
      {
        path: '/~{metric_id}+{company_id}+{year}.json',
        method: 'GET',
        description: 'ESG metric values for companies (GHG, water, waste, social indicators)',
        params: ['metric_id', 'company_id', 'year'],
        fields: [
          { sourceField: 'value', targetTable: 'esg_scores', targetColumn: 'metric_value', type: 'string', unit: 'varies' },
          { sourceField: 'metric.name', targetTable: 'esg_scores', targetColumn: 'metric_name', type: 'string', unit: null },
          { sourceField: 'company.name', targetTable: 'esg_scores', targetColumn: 'company_name', type: 'string', unit: null },
          { sourceField: 'year', targetTable: 'esg_scores', targetColumn: 'reporting_year', type: 'number', unit: 'year' },
          { sourceField: 'source.url', targetTable: 'esg_scores', targetColumn: 'source_url', type: 'string', unit: null },
        ],
        engines: ['E-002', 'E-003', 'E-010'],
      },
    ],
    modules: ['esg-ratings-comparator', 'greenwashing-detector', 'csrd-esrs-automation'],
    qualityAssessment: { accuracy: qScore(64), timeliness: qScore(65), completeness: qScore(66), methodology: 'Crowd-sourced with peer review and source verification' },
  },

  // FS-023 Corporate Register
  {
    id: 'FS-023',
    name: 'Corporate Register',
    category: CATEGORIES.ESG,
    url: 'https://www.corporateregister.com',
    documentation: 'https://www.corporateregister.com/help',
    auth: { method: 'none', notes: 'Free search and metadata; full report access requires subscription' },
    rateLimit: { requests: 100, period: 'hour' },
    format: 'HTML/PDF',
    coverage: { geographic: 'Global', temporal: '1992-present', entities: '120,000+ CSR/sustainability reports' },
    updateFrequency: 'Continuous',
    license: 'Proprietary (metadata free)',
    endpoints: [
      {
        path: '/search/reports',
        method: 'GET',
        description: 'Search CSR/sustainability reports by company, year, reporting standard',
        params: ['company', 'year', 'standard', 'country'],
        fields: [
          { sourceField: 'report_title', targetTable: 'sustainability_reports', targetColumn: 'report_title', type: 'string', unit: null },
          { sourceField: 'company_name', targetTable: 'sustainability_reports', targetColumn: 'company_name', type: 'string', unit: null },
          { sourceField: 'reporting_year', targetTable: 'sustainability_reports', targetColumn: 'reporting_year', type: 'number', unit: 'year' },
          { sourceField: 'standard_used', targetTable: 'sustainability_reports', targetColumn: 'reporting_standard', type: 'string', unit: null },
          { sourceField: 'report_url', targetTable: 'sustainability_reports', targetColumn: 'report_url', type: 'string', unit: null },
        ],
        engines: ['E-003', 'E-010'],
      },
    ],
    modules: ['csrd-esrs-automation', 'isbb-disclosure', 'greenwashing-detector'],
    qualityAssessment: { accuracy: qScore(67), timeliness: qScore(68), completeness: qScore(69), methodology: 'Curated index of voluntary sustainability disclosures' },
  },

  // FS-024 GRI Report Database
  {
    id: 'FS-024',
    name: 'Global Reporting Initiative',
    category: CATEGORIES.ESG,
    url: 'https://www.globalreporting.org/reportregistration/verifiedreports',
    documentation: 'https://www.globalreporting.org/how-to-use-the-gri-standards',
    auth: { method: 'none', notes: 'Free search; report access varies' },
    rateLimit: { requests: 100, period: 'hour' },
    format: 'JSON/HTML',
    coverage: { geographic: 'Global', temporal: '2000-present', entities: '16,000+ organizations' },
    updateFrequency: 'Continuous',
    license: 'Free access (GRI Terms)',
    endpoints: [
      {
        path: '/api/reports',
        method: 'GET',
        description: 'Search GRI-aligned sustainability reports',
        params: ['organization', 'country', 'sector', 'year', 'gri_version'],
        fields: [
          { sourceField: 'organization_name', targetTable: 'sustainability_reports', targetColumn: 'company_name', type: 'string', unit: null },
          { sourceField: 'sector', targetTable: 'sustainability_reports', targetColumn: 'gri_sector', type: 'string', unit: null },
          { sourceField: 'gri_standards_version', targetTable: 'sustainability_reports', targetColumn: 'gri_version', type: 'string', unit: null },
          { sourceField: 'report_year', targetTable: 'sustainability_reports', targetColumn: 'reporting_year', type: 'number', unit: 'year' },
          { sourceField: 'in_accordance', targetTable: 'sustainability_reports', targetColumn: 'gri_compliance_level', type: 'string', unit: null },
        ],
        engines: ['E-003', 'E-010'],
      },
    ],
    modules: ['csrd-esrs-automation', 'esg-data-quality', 'greenwashing-detector'],
    qualityAssessment: { accuracy: qScore(70), timeliness: qScore(71), completeness: qScore(72), methodology: 'Self-registration by reporting organizations' },
  },
];

// =============================================================================
// CATEGORY 4 — NATURE & BIODIVERSITY (6 sources)
// =============================================================================

const natureSources = [
  // FS-025 GBIF
  {
    id: 'FS-025',
    name: 'GBIF (Global Biodiversity Information Facility)',
    category: CATEGORIES.NATURE,
    url: 'https://api.gbif.org/v1',
    documentation: 'https://www.gbif.org/developer/summary',
    auth: { method: 'none', notes: 'Free, no API key for read operations; registration needed for downloads' },
    rateLimit: { requests: 600, period: 'minute' },
    format: 'JSON',
    coverage: { geographic: 'Global', temporal: '1600-present', entities: '2.4 billion+ species occurrence records' },
    updateFrequency: 'Daily',
    license: 'CC BY 4.0 / CC0',
    endpoints: [
      {
        path: '/occurrence/search',
        method: 'GET',
        description: 'Search species occurrence records by location, taxonomy, time',
        params: ['taxonKey', 'country', 'geometry', 'year', 'basisOfRecord', 'limit'],
        fields: [
          { sourceField: 'species', targetTable: 'biodiversity_occurrences', targetColumn: 'species_name', type: 'string', unit: null },
          { sourceField: 'decimalLatitude', targetTable: 'biodiversity_occurrences', targetColumn: 'latitude', type: 'number', unit: 'degrees' },
          { sourceField: 'decimalLongitude', targetTable: 'biodiversity_occurrences', targetColumn: 'longitude', type: 'number', unit: 'degrees' },
          { sourceField: 'eventDate', targetTable: 'biodiversity_occurrences', targetColumn: 'observation_date', type: 'date', unit: 'YYYY-MM-DD' },
          { sourceField: 'iucnRedListCategory', targetTable: 'biodiversity_occurrences', targetColumn: 'iucn_status', type: 'string', unit: null },
          { sourceField: 'kingdom', targetTable: 'biodiversity_occurrences', targetColumn: 'taxonomic_kingdom', type: 'string', unit: null },
        ],
        engines: ['E-018', 'E-019'],
      },
      {
        path: '/species/search',
        method: 'GET',
        description: 'Search species taxonomy and classification',
        params: ['q', 'rank', 'status', 'habitat'],
        fields: [
          { sourceField: 'scientificName', targetTable: 'species_taxonomy', targetColumn: 'scientific_name', type: 'string', unit: null },
          { sourceField: 'canonicalName', targetTable: 'species_taxonomy', targetColumn: 'common_name', type: 'string', unit: null },
          { sourceField: 'threatStatus', targetTable: 'species_taxonomy', targetColumn: 'threat_status', type: 'string', unit: null },
        ],
        engines: ['E-018', 'E-019'],
      },
    ],
    modules: ['nature-loss-risk', 'land-use-deforestation', 'biodiversity-footprint'],
    qualityAssessment: { accuracy: qScore(73), timeliness: qScore(74), completeness: qScore(75), methodology: 'Aggregated from 2,100+ data publishers worldwide' },
  },

  // FS-026 WDPA (Protected Planet)
  {
    id: 'FS-026',
    name: 'World Database on Protected Areas',
    category: CATEGORIES.NATURE,
    url: 'https://api.protectedplanet.net/v3',
    documentation: 'https://api.protectedplanet.net/documentation',
    auth: { method: 'api_key', notes: 'Free API token, register at protectedplanet.net', keyParam: 'token' },
    rateLimit: { requests: 100, period: 'minute' },
    format: 'JSON/GeoJSON',
    coverage: { geographic: 'Global', temporal: '1872-present', entities: '295,000+ protected areas' },
    updateFrequency: 'Monthly',
    license: 'UNEP-WCMC Terms',
    endpoints: [
      {
        path: '/protected_areas/search',
        method: 'GET',
        description: 'Search protected areas by location, IUCN category, country',
        params: ['with_geometry', 'marine', 'country', 'per_page', 'page'],
        fields: [
          { sourceField: 'name', targetTable: 'protected_areas', targetColumn: 'area_name', type: 'string', unit: null },
          { sourceField: 'wdpa_id', targetTable: 'protected_areas', targetColumn: 'wdpa_id', type: 'number', unit: null },
          { sourceField: 'iucn_category.name', targetTable: 'protected_areas', targetColumn: 'iucn_category', type: 'string', unit: null },
          { sourceField: 'reported_area', targetTable: 'protected_areas', targetColumn: 'area_km2', type: 'number', unit: 'km²' },
          { sourceField: 'marine', targetTable: 'protected_areas', targetColumn: 'is_marine', type: 'boolean', unit: null },
          { sourceField: 'designation.name', targetTable: 'protected_areas', targetColumn: 'designation', type: 'string', unit: null },
        ],
        engines: ['E-018', 'E-019'],
      },
    ],
    modules: ['nature-loss-risk', 'land-use-deforestation', 'ocean-marine-risk'],
    qualityAssessment: { accuracy: qScore(76), timeliness: qScore(77), completeness: qScore(78), methodology: 'Official government submissions to UNEP-WCMC' },
  },

  // FS-027 Global Forest Watch
  {
    id: 'FS-027',
    name: 'Global Forest Watch',
    category: CATEGORIES.NATURE,
    url: 'https://data-api.globalforestwatch.org',
    documentation: 'https://data-api.globalforestwatch.org/docs',
    auth: { method: 'api_key', notes: 'Free API key, register at globalforestwatch.org', keyParam: 'x-api-key' },
    rateLimit: { requests: 1000, period: 'day' },
    format: 'JSON/GeoJSON',
    coverage: { geographic: 'Global', temporal: '2001-present', entities: '30m resolution tree cover data' },
    updateFrequency: 'Annual (tree cover loss); weekly (deforestation alerts)',
    license: 'CC BY 4.0',
    endpoints: [
      {
        path: '/dataset/umd_tree_cover_loss/latest/query',
        method: 'GET',
        description: 'Tree cover loss statistics by area of interest',
        params: ['geostore', 'sql', 'threshold'],
        fields: [
          { sourceField: 'tree_cover_loss_ha', targetTable: 'deforestation_data', targetColumn: 'loss_hectares', type: 'number', unit: 'hectares' },
          { sourceField: 'tree_cover_loss_year', targetTable: 'deforestation_data', targetColumn: 'loss_year', type: 'number', unit: 'year' },
          { sourceField: 'co2_emissions_mt', targetTable: 'deforestation_data', targetColumn: 'forest_co2_emissions_mt', type: 'number', unit: 'MtCO2' },
          { sourceField: 'tree_cover_extent_ha', targetTable: 'deforestation_data', targetColumn: 'current_cover_ha', type: 'number', unit: 'hectares' },
        ],
        engines: ['E-018', 'E-019', 'E-001'],
      },
      {
        path: '/dataset/gfw_integrated_alerts/latest/query',
        method: 'GET',
        description: 'Near-real-time deforestation alerts (GLAD, RADD)',
        params: ['geostore', 'period', 'confidence'],
        fields: [
          { sourceField: 'alert_count', targetTable: 'deforestation_alerts', targetColumn: 'alert_count', type: 'number', unit: 'count' },
          { sourceField: 'alert_area_ha', targetTable: 'deforestation_alerts', targetColumn: 'alert_area_ha', type: 'number', unit: 'hectares' },
          { sourceField: 'confidence', targetTable: 'deforestation_alerts', targetColumn: 'confidence_level', type: 'string', unit: null },
          { sourceField: 'alert_date', targetTable: 'deforestation_alerts', targetColumn: 'alert_date', type: 'date', unit: 'YYYY-MM-DD' },
        ],
        engines: ['E-018', 'E-019'],
      },
    ],
    modules: ['land-use-deforestation', 'nature-loss-risk', 'supply-chain-esg'],
    qualityAssessment: { accuracy: qScore(79), timeliness: qScore(80), completeness: qScore(81), methodology: 'Landsat + Sentinel-2 satellite imagery, Hansen et al. algorithm' },
  },

  // FS-028 Aqueduct Water Risk Atlas
  {
    id: 'FS-028',
    name: 'Aqueduct Water Risk Atlas',
    category: CATEGORIES.NATURE,
    url: 'https://www.wri.org/applications/aqueduct/water-risk-atlas/api',
    documentation: 'https://www.wri.org/aqueduct',
    auth: { method: 'none', notes: 'Free, no API key required' },
    rateLimit: { requests: 200, period: 'hour' },
    format: 'JSON/GeoJSON',
    coverage: { geographic: 'Global (sub-catchment level)', temporal: 'Baseline + 2030/2050 projections', entities: '15,000+ sub-catchments' },
    updateFrequency: 'Annual',
    license: 'CC BY 4.0',
    endpoints: [
      {
        path: '/aqueduct/water-risk',
        method: 'GET',
        description: 'Water stress, flood risk, drought risk by location',
        params: ['lat', 'lng', 'indicator', 'scenario', 'year'],
        fields: [
          { sourceField: 'overall_water_risk', targetTable: 'water_risk', targetColumn: 'overall_risk_score', type: 'number', unit: '0-5 scale' },
          { sourceField: 'baseline_water_stress', targetTable: 'water_risk', targetColumn: 'water_stress_ratio', type: 'number', unit: 'ratio' },
          { sourceField: 'flood_occurrence', targetTable: 'water_risk', targetColumn: 'flood_risk_score', type: 'number', unit: '0-5 scale' },
          { sourceField: 'drought_severity', targetTable: 'water_risk', targetColumn: 'drought_risk_score', type: 'number', unit: '0-5 scale' },
          { sourceField: 'groundwater_stress', targetTable: 'water_risk', targetColumn: 'groundwater_stress', type: 'number', unit: 'ratio' },
          { sourceField: 'regulatory_and_reputational_risk', targetTable: 'water_risk', targetColumn: 'regulatory_risk_score', type: 'number', unit: '0-5 scale' },
        ],
        engines: ['E-018', 'E-019', 'E-020'],
      },
    ],
    modules: ['water-risk-analytics', 'nature-loss-risk', 'physical-risk-assessment'],
    qualityAssessment: { accuracy: qScore(82), timeliness: qScore(83), completeness: qScore(84), methodology: 'WRI hydrological model + PCR-GLOBWB + CMIP6 scenarios' },
  },

  // FS-029 Ocean Health Index
  {
    id: 'FS-029',
    name: 'Ocean Health Index',
    category: CATEGORIES.NATURE,
    url: 'https://oceanhealthindex.org/data',
    documentation: 'https://oceanhealthindex.org/methodology',
    auth: { method: 'none', notes: 'Free, downloadable datasets' },
    rateLimit: { requests: 60, period: 'minute' },
    format: 'CSV',
    coverage: { geographic: 'Global (220 EEZs)', temporal: '2012-2023', entities: 'Exclusive Economic Zones' },
    updateFrequency: 'Annual',
    license: 'CC BY 4.0',
    endpoints: [
      {
        path: '/data/scores',
        method: 'GET',
        description: 'Ocean health scores by goal and region',
        params: ['region_id', 'goal', 'year'],
        fields: [
          { sourceField: 'score', targetTable: 'ocean_health', targetColumn: 'ohi_score', type: 'number', unit: '0-100 index' },
          { sourceField: 'goal', targetTable: 'ocean_health', targetColumn: 'goal_name', type: 'string', unit: null },
          { sourceField: 'trend', targetTable: 'ocean_health', targetColumn: 'trend_score', type: 'number', unit: '-1 to +1' },
          { sourceField: 'pressure', targetTable: 'ocean_health', targetColumn: 'pressure_score', type: 'number', unit: '0-1' },
          { sourceField: 'resilience', targetTable: 'ocean_health', targetColumn: 'resilience_score', type: 'number', unit: '0-1' },
        ],
        engines: ['E-018', 'E-019'],
      },
    ],
    modules: ['ocean-marine-risk', 'nature-loss-risk', 'blue-bond-analytics'],
    qualityAssessment: { accuracy: qScore(85), timeliness: qScore(86), completeness: qScore(87), methodology: 'Composite index of 10 public goals (NCEAS / UC Santa Barbara)' },
  },

  // FS-030 IUCN Red List
  {
    id: 'FS-030',
    name: 'IUCN Red List of Threatened Species',
    category: CATEGORIES.NATURE,
    url: 'https://apiv3.iucnredlist.org/api/v3',
    documentation: 'https://apiv3.iucnredlist.org/api/v3/docs',
    auth: { method: 'api_key', notes: 'Free API token, register at apiv3.iucnredlist.org', keyParam: 'token' },
    rateLimit: { requests: 1000, period: 'day' },
    format: 'JSON',
    coverage: { geographic: 'Global', temporal: '1964-present', entities: '157,000+ species assessed' },
    updateFrequency: 'Quarterly',
    license: 'IUCN Terms of Use (non-commercial free)',
    endpoints: [
      {
        path: '/species/region/{region_identifier}',
        method: 'GET',
        description: 'Threatened species by region and category',
        params: ['region_identifier', 'page'],
        fields: [
          { sourceField: 'scientific_name', targetTable: 'species_risk', targetColumn: 'scientific_name', type: 'string', unit: null },
          { sourceField: 'category', targetTable: 'species_risk', targetColumn: 'iucn_category', type: 'string', unit: null },
          { sourceField: 'population_trend', targetTable: 'species_risk', targetColumn: 'population_trend', type: 'string', unit: null },
          { sourceField: 'main_common_name', targetTable: 'species_risk', targetColumn: 'common_name', type: 'string', unit: null },
        ],
        engines: ['E-018', 'E-019'],
      },
      {
        path: '/threats/species/id/{id}',
        method: 'GET',
        description: 'Threats classification for a species',
        params: ['id'],
        fields: [
          { sourceField: 'title', targetTable: 'species_threats', targetColumn: 'threat_title', type: 'string', unit: null },
          { sourceField: 'code', targetTable: 'species_threats', targetColumn: 'iucn_threat_code', type: 'string', unit: null },
          { sourceField: 'severity', targetTable: 'species_threats', targetColumn: 'threat_severity', type: 'string', unit: null },
          { sourceField: 'scope', targetTable: 'species_threats', targetColumn: 'threat_scope', type: 'string', unit: null },
        ],
        engines: ['E-018', 'E-019'],
      },
    ],
    modules: ['nature-loss-risk', 'biodiversity-footprint', 'tnfd-alignment'],
    qualityAssessment: { accuracy: qScore(88), timeliness: qScore(89), completeness: qScore(90), methodology: 'Expert assessments following IUCN Categories & Criteria (v3.1)' },
  },
];

// =============================================================================
// CATEGORY 5 — ECONOMIC & MACRO (5 sources)
// =============================================================================

const economicSources = [
  // FS-031 World Bank Open Data
  {
    id: 'FS-031',
    name: 'World Bank Open Data',
    category: CATEGORIES.ECONOMIC,
    url: 'https://api.worldbank.org/v2',
    documentation: 'https://datahelpdesk.worldbank.org/knowledgebase/articles/889392',
    auth: { method: 'none', notes: 'Free, no API key required' },
    rateLimit: { requests: 1000, period: 'hour' },
    format: 'JSON/XML',
    coverage: { geographic: 'Global (217 countries)', temporal: '1960-present', entities: '1,600+ indicators' },
    updateFrequency: 'Quarterly',
    license: 'CC BY 4.0',
    endpoints: [
      {
        path: '/country/{country}/indicator/{indicator}',
        method: 'GET',
        description: 'Time series for any World Development Indicator',
        params: ['country', 'indicator', 'date', 'format', 'per_page'],
        fields: [
          { sourceField: 'value', targetTable: 'macro_indicators', targetColumn: 'indicator_value', type: 'number', unit: 'varies' },
          { sourceField: 'indicator.id', targetTable: 'macro_indicators', targetColumn: 'wb_indicator_code', type: 'string', unit: null },
          { sourceField: 'country.id', targetTable: 'macro_indicators', targetColumn: 'country_iso2', type: 'string', unit: null },
          { sourceField: 'date', targetTable: 'macro_indicators', targetColumn: 'year', type: 'number', unit: 'year' },
        ],
        engines: ['E-007', 'E-025', 'E-028', 'E-033'],
      },
      {
        path: '/country/{country}/indicator/EN.ATM.CO2E.KT',
        method: 'GET',
        description: 'CO2 emissions (kt) per country — key climate indicator',
        params: ['country', 'date'],
        fields: [
          { sourceField: 'value', targetTable: 'country_emissions', targetColumn: 'wb_co2_kt', type: 'number', unit: 'kt CO2' },
        ],
        engines: ['E-001', 'E-007'],
      },
    ],
    modules: ['ngfs-scenarios', 'climate-sovereign-bonds', 'systemic-esg-risk', 'transition-scenario-modeller'],
    qualityAssessment: { accuracy: qScore(91), timeliness: qScore(92), completeness: qScore(93), methodology: 'Official national statistics + international agencies' },
  },

  // FS-032 IMF Data
  {
    id: 'FS-032',
    name: 'IMF Data',
    category: CATEGORIES.ECONOMIC,
    url: 'https://dataservices.imf.org/REST/SDMX_JSON.svc',
    documentation: 'https://datahelp.imf.org/knowledgebase/articles/667681',
    auth: { method: 'none', notes: 'Free, no API key required' },
    rateLimit: { requests: 100, period: 'minute' },
    format: 'JSON/SDMX',
    coverage: { geographic: 'Global (190 countries)', temporal: '1950-present', entities: 'WEO, IFS, GFSR, BOP' },
    updateFrequency: 'Biannual (WEO April/October); Monthly (IFS)',
    license: 'IMF Open Data Terms',
    endpoints: [
      {
        path: '/CompactData/WEO/{frequency}.{ref_area}.{indicator}',
        method: 'GET',
        description: 'World Economic Outlook data (GDP, inflation, debt)',
        params: ['frequency', 'ref_area', 'indicator', 'startPeriod', 'endPeriod'],
        fields: [
          { sourceField: 'Obs.value', targetTable: 'macro_indicators', targetColumn: 'indicator_value', type: 'number', unit: 'varies' },
          { sourceField: 'REF_AREA', targetTable: 'macro_indicators', targetColumn: 'country_iso2', type: 'string', unit: null },
          { sourceField: 'INDICATOR', targetTable: 'macro_indicators', targetColumn: 'imf_indicator_code', type: 'string', unit: null },
          { sourceField: 'TIME_PERIOD', targetTable: 'macro_indicators', targetColumn: 'period', type: 'string', unit: null },
        ],
        engines: ['E-007', 'E-025', 'E-028'],
      },
      {
        path: '/CompactData/IFS/{frequency}.{ref_area}.{indicator}',
        method: 'GET',
        description: 'International Financial Statistics (interest rates, CPI, exchange rates)',
        params: ['frequency', 'ref_area', 'indicator'],
        fields: [
          { sourceField: 'Obs.value', targetTable: 'financial_data', targetColumn: 'ifs_value', type: 'number', unit: 'varies' },
          { sourceField: 'INDICATOR', targetTable: 'financial_data', targetColumn: 'ifs_indicator_code', type: 'string', unit: null },
        ],
        engines: ['E-025', 'E-028'],
      },
    ],
    modules: ['climate-sovereign-bonds', 'green-central-banking', 'systemic-esg-risk', 'transition-scenario-modeller'],
    qualityAssessment: { accuracy: qScore(94), timeliness: qScore(95), completeness: qScore(96), methodology: 'IMF staff estimates + country authorities' data' },
  },

  // FS-033 OECD Data
  {
    id: 'FS-033',
    name: 'OECD Data',
    category: CATEGORIES.ECONOMIC,
    url: 'https://stats.oecd.org/SDMX-JSON/data',
    documentation: 'https://data.oecd.org/api',
    auth: { method: 'none', notes: 'Free, no API key required' },
    rateLimit: { requests: 200, period: 'hour' },
    format: 'JSON/SDMX',
    coverage: { geographic: 'OECD (38 members + partners)', temporal: '1960-present', entities: 'Macro, environment, governance indicators' },
    updateFrequency: 'Monthly/Quarterly',
    license: 'OECD Terms of Use (free for non-commercial)',
    endpoints: [
      {
        path: '/AIR_GHG/{country}.{pollutant}.{sector}.{unit}/{period}',
        method: 'GET',
        description: 'Air and GHG emissions by country and sector',
        params: ['country', 'pollutant', 'sector', 'unit', 'period'],
        fields: [
          { sourceField: 'value', targetTable: 'country_emissions', targetColumn: 'oecd_ghg_value', type: 'number', unit: 'varies' },
          { sourceField: 'POLLUTANT', targetTable: 'country_emissions', targetColumn: 'pollutant_type', type: 'string', unit: null },
          { sourceField: 'COU', targetTable: 'country_emissions', targetColumn: 'country_iso3', type: 'string', unit: null },
        ],
        engines: ['E-001', 'E-007'],
      },
      {
        path: '/GREEN_GROWTH/{indicator}.{country}/{period}',
        method: 'GET',
        description: 'Green growth indicators (resource productivity, environmental taxes)',
        params: ['indicator', 'country', 'period'],
        fields: [
          { sourceField: 'value', targetTable: 'macro_indicators', targetColumn: 'green_growth_value', type: 'number', unit: 'varies' },
          { sourceField: 'INDICATOR', targetTable: 'macro_indicators', targetColumn: 'oecd_gg_indicator', type: 'string', unit: null },
        ],
        engines: ['E-007', 'E-025', 'E-033'],
      },
    ],
    modules: ['green-central-banking', 'climate-policy-intelligence', 'circular-economy-tracker'],
    qualityAssessment: { accuracy: qScore(97), timeliness: qScore(98), completeness: qScore(99), methodology: 'OECD secretariat + national statistical offices' },
  },

  // FS-034 UN Data
  {
    id: 'FS-034',
    name: 'UN Data',
    category: CATEGORIES.ECONOMIC,
    url: 'https://data.un.org/ws/rest',
    documentation: 'https://data.un.org/Host.aspx?Content=API',
    auth: { method: 'none', notes: 'Free, no API key required' },
    rateLimit: { requests: 200, period: 'hour' },
    format: 'JSON/XML/SDMX',
    coverage: { geographic: 'Global (193 member states)', temporal: '1990-present', entities: 'SDG indicators, demographics' },
    updateFrequency: 'Quarterly',
    license: 'UN Data Terms (free for non-commercial)',
    endpoints: [
      {
        path: '/data/SDG,DF_SDG_GLH/{indicator}.{geo_area}.{time_period}',
        method: 'GET',
        description: 'SDG indicators (all 17 goals, 231 indicators)',
        params: ['indicator', 'geo_area', 'time_period'],
        fields: [
          { sourceField: 'value', targetTable: 'sdg_indicators', targetColumn: 'indicator_value', type: 'number', unit: 'varies' },
          { sourceField: 'INDICATOR', targetTable: 'sdg_indicators', targetColumn: 'sdg_indicator_code', type: 'string', unit: null },
          { sourceField: 'GEO_AREA', targetTable: 'sdg_indicators', targetColumn: 'country_iso3', type: 'string', unit: null },
          { sourceField: 'TIME_PERIOD', targetTable: 'sdg_indicators', targetColumn: 'year', type: 'number', unit: 'year' },
          { sourceField: 'SERIES', targetTable: 'sdg_indicators', targetColumn: 'series_code', type: 'string', unit: null },
        ],
        engines: ['E-007', 'E-025', 'E-033'],
      },
    ],
    modules: ['community-impact', 'just-transition-finance', 'living-wage-tracker', 'human-rights-risk'],
    qualityAssessment: { accuracy: qScore(100), timeliness: qScore(101), completeness: qScore(102), methodology: 'Official country statistics + UN agency estimates' },
  },

  // FS-035 FRED
  {
    id: 'FS-035',
    name: 'FRED (Federal Reserve Economic Data)',
    category: CATEGORIES.ECONOMIC,
    url: 'https://api.stlouisfed.org/fred',
    documentation: 'https://fred.stlouisfed.org/docs/api/fred',
    auth: { method: 'api_key', notes: 'Free API key, register at fred.stlouisfed.org', keyParam: 'api_key' },
    rateLimit: { requests: 120, period: 'minute' },
    format: 'JSON/XML',
    coverage: { geographic: 'US (+ international)', temporal: '1914-present', entities: '816,000+ economic data series' },
    updateFrequency: 'Daily',
    license: 'Public Domain (US Government)',
    endpoints: [
      {
        path: '/series/observations',
        method: 'GET',
        description: 'Economic time series data (interest rates, CPI, GDP, unemployment)',
        params: ['series_id', 'observation_start', 'observation_end', 'frequency'],
        fields: [
          { sourceField: 'value', targetTable: 'macro_indicators', targetColumn: 'fred_value', type: 'number', unit: 'varies' },
          { sourceField: 'date', targetTable: 'macro_indicators', targetColumn: 'observation_date', type: 'date', unit: 'YYYY-MM-DD' },
          { sourceField: 'realtime_start', targetTable: 'macro_indicators', targetColumn: 'vintage_date', type: 'date', unit: 'YYYY-MM-DD' },
        ],
        engines: ['E-025', 'E-028'],
      },
      {
        path: '/series/search',
        method: 'GET',
        description: 'Search FRED series by keywords',
        params: ['search_text', 'search_type', 'order_by'],
        fields: [
          { sourceField: 'id', targetTable: 'macro_indicators', targetColumn: 'fred_series_id', type: 'string', unit: null },
          { sourceField: 'title', targetTable: 'macro_indicators', targetColumn: 'series_title', type: 'string', unit: null },
          { sourceField: 'frequency', targetTable: 'macro_indicators', targetColumn: 'frequency', type: 'string', unit: null },
          { sourceField: 'units', targetTable: 'macro_indicators', targetColumn: 'units', type: 'string', unit: null },
        ],
        engines: ['E-025', 'E-028'],
      },
    ],
    modules: ['green-central-banking', 'climate-stress-test', 'systemic-esg-risk', 'esg-factor-attribution'],
    qualityAssessment: { accuracy: qScore(103), timeliness: qScore(104), completeness: qScore(105), methodology: 'Federal Reserve Bank of St. Louis aggregation of official sources' },
  },
];

// =============================================================================
// CATEGORY 6 — REGULATORY & POLICY (5 sources)
// =============================================================================

const regulatorySources = [
  // FS-036 EUR-Lex
  {
    id: 'FS-036',
    name: 'EUR-Lex',
    category: CATEGORIES.REGULATORY,
    url: 'https://eur-lex.europa.eu/api',
    documentation: 'https://eur-lex.europa.eu/content/tools/webservices.html',
    auth: { method: 'none', notes: 'Free, public EU legislation API' },
    rateLimit: { requests: 100, period: 'minute' },
    format: 'XML/JSON',
    coverage: { geographic: 'European Union', temporal: '1951-present', entities: 'All EU legislation (CSRD, SFDR, EU Taxonomy, etc.)' },
    updateFrequency: 'Daily',
    license: 'EU Reuse Decision 2011/833/EU',
    endpoints: [
      {
        path: '/search',
        method: 'GET',
        description: 'Search EU legislation by keyword, CELEX number, date',
        params: ['text', 'type', 'author', 'date_from', 'date_to', 'page'],
        fields: [
          { sourceField: 'cellar_id', targetTable: 'regulatory_texts', targetColumn: 'celex_number', type: 'string', unit: null },
          { sourceField: 'title', targetTable: 'regulatory_texts', targetColumn: 'legislation_title', type: 'string', unit: null },
          { sourceField: 'date_document', targetTable: 'regulatory_texts', targetColumn: 'publication_date', type: 'date', unit: 'YYYY-MM-DD' },
          { sourceField: 'form', targetTable: 'regulatory_texts', targetColumn: 'legislation_type', type: 'string', unit: null },
          { sourceField: 'status', targetTable: 'regulatory_texts', targetColumn: 'status', type: 'string', unit: null },
        ],
        engines: ['E-033', 'E-034'],
      },
    ],
    modules: ['csrd-esrs-automation', 'sfdr-v2-reporting', 'green-taxonomy-navigator', 'disclosure-hub'],
    qualityAssessment: { accuracy: qScore(106), timeliness: qScore(107), completeness: qScore(108), methodology: 'Official EU legislation database (Publications Office)' },
  },

  // FS-037 Legislation.gov.uk
  {
    id: 'FS-037',
    name: 'Legislation.gov.uk',
    category: CATEGORIES.REGULATORY,
    url: 'https://www.legislation.gov.uk/api',
    documentation: 'https://www.legislation.gov.uk/developer',
    auth: { method: 'none', notes: 'Free, public UK legislation API' },
    rateLimit: { requests: 200, period: 'hour' },
    format: 'XML/JSON',
    coverage: { geographic: 'United Kingdom', temporal: '1267-present', entities: 'All UK primary and secondary legislation' },
    updateFrequency: 'Daily',
    license: 'OGL v3.0',
    endpoints: [
      {
        path: '/search',
        method: 'GET',
        description: 'Search UK legislation by title, keyword, year',
        params: ['text', 'type', 'year', 'page'],
        fields: [
          { sourceField: 'title', targetTable: 'regulatory_texts', targetColumn: 'legislation_title', type: 'string', unit: null },
          { sourceField: 'identifier', targetTable: 'regulatory_texts', targetColumn: 'uk_legislation_id', type: 'string', unit: null },
          { sourceField: 'year', targetTable: 'regulatory_texts', targetColumn: 'enactment_year', type: 'number', unit: 'year' },
          { sourceField: 'type', targetTable: 'regulatory_texts', targetColumn: 'legislation_type', type: 'string', unit: null },
        ],
        engines: ['E-033', 'E-034'],
      },
    ],
    modules: ['uk-sdr', 'climate-policy-intelligence', 'disclosure-hub'],
    qualityAssessment: { accuracy: qScore(109), timeliness: qScore(110), completeness: qScore(111), methodology: 'Official UK National Archives legislation database' },
  },

  // FS-038 Carbon Pricing Dashboard
  {
    id: 'FS-038',
    name: 'Carbon Pricing Dashboard',
    category: CATEGORIES.REGULATORY,
    url: 'https://carbonpricingdashboard.worldbank.org/api',
    documentation: 'https://carbonpricingdashboard.worldbank.org/what-carbon-pricing',
    auth: { method: 'none', notes: 'Free, public data' },
    rateLimit: { requests: 100, period: 'hour' },
    format: 'JSON',
    coverage: { geographic: 'Global', temporal: '1990-present', entities: '73 carbon pricing instruments (ETS + carbon taxes)' },
    updateFrequency: 'Annual',
    license: 'CC BY 4.0',
    endpoints: [
      {
        path: '/instruments',
        method: 'GET',
        description: 'Carbon pricing instruments by jurisdiction and type',
        params: ['jurisdiction', 'type', 'status'],
        fields: [
          { sourceField: 'instrument_name', targetTable: 'carbon_pricing', targetColumn: 'instrument_name', type: 'string', unit: null },
          { sourceField: 'jurisdiction', targetTable: 'carbon_pricing', targetColumn: 'jurisdiction', type: 'string', unit: null },
          { sourceField: 'type', targetTable: 'carbon_pricing', targetColumn: 'instrument_type', type: 'string', unit: null },
          { sourceField: 'current_price_usd', targetTable: 'carbon_pricing', targetColumn: 'price_usd_tco2e', type: 'number', unit: 'USD/tCO2e' },
          { sourceField: 'coverage_mtco2e', targetTable: 'carbon_pricing', targetColumn: 'coverage_mtco2e', type: 'number', unit: 'MtCO2e' },
          { sourceField: 'revenue_usd_m', targetTable: 'carbon_pricing', targetColumn: 'annual_revenue_usd_m', type: 'number', unit: 'USD million' },
          { sourceField: 'sectors_covered', targetTable: 'carbon_pricing', targetColumn: 'sectors_covered', type: 'array', unit: null },
          { sourceField: 'year_implemented', targetTable: 'carbon_pricing', targetColumn: 'implementation_year', type: 'number', unit: 'year' },
        ],
        engines: ['E-007', 'E-028', 'E-033'],
      },
    ],
    modules: ['article6-markets', 'cbam-compliance', 'climate-policy-intelligence', 'carbon-calculator'],
    qualityAssessment: { accuracy: qScore(112), timeliness: qScore(113), completeness: qScore(114), methodology: 'World Bank research team + ICAP, OECD data' },
  },

  // FS-039 NDC Registry
  {
    id: 'FS-039',
    name: 'NDC Registry (UNFCCC)',
    category: CATEGORIES.REGULATORY,
    url: 'https://unfccc.int/NDCREG/api',
    documentation: 'https://unfccc.int/NDCREG/about',
    auth: { method: 'none', notes: 'Free, public data' },
    rateLimit: { requests: 60, period: 'minute' },
    format: 'JSON/PDF',
    coverage: { geographic: 'Global (197 parties)', temporal: '2015-present', entities: 'Paris Agreement NDC submissions' },
    updateFrequency: 'As submitted (event-driven)',
    license: 'Public Domain (UN)',
    endpoints: [
      {
        path: '/ndcs',
        method: 'GET',
        description: 'Nationally Determined Contributions and updates',
        params: ['party', 'type', 'submission_year'],
        fields: [
          { sourceField: 'party_name', targetTable: 'ndc_submissions', targetColumn: 'country_name', type: 'string', unit: null },
          { sourceField: 'ndc_type', targetTable: 'ndc_submissions', targetColumn: 'ndc_type', type: 'string', unit: null },
          { sourceField: 'submission_date', targetTable: 'ndc_submissions', targetColumn: 'submission_date', type: 'date', unit: 'YYYY-MM-DD' },
          { sourceField: 'target_type', targetTable: 'ndc_submissions', targetColumn: 'target_type', type: 'string', unit: null },
          { sourceField: 'target_year', targetTable: 'ndc_submissions', targetColumn: 'target_year', type: 'number', unit: 'year' },
          { sourceField: 'base_year', targetTable: 'ndc_submissions', targetColumn: 'base_year', type: 'number', unit: 'year' },
          { sourceField: 'ghg_target_pct', targetTable: 'ndc_submissions', targetColumn: 'reduction_target_pct', type: 'number', unit: '%' },
        ],
        engines: ['E-007', 'E-028', 'E-033'],
      },
    ],
    modules: ['climate-policy-intelligence', 'ngfs-scenarios', 'transition-scenario-modeller', 'climate-sovereign-bonds'],
    qualityAssessment: { accuracy: qScore(115), timeliness: qScore(116), completeness: qScore(117), methodology: 'Official party submissions to UNFCCC secretariat' },
  },

  // FS-040 Climate Policy Database
  {
    id: 'FS-040',
    name: 'Climate Policy Database',
    category: CATEGORIES.REGULATORY,
    url: 'https://climatepolicydatabase.org/api',
    documentation: 'https://climatepolicydatabase.org/about',
    auth: { method: 'none', notes: 'Free, public data (NewClimate Institute)' },
    rateLimit: { requests: 100, period: 'hour' },
    format: 'JSON/CSV',
    coverage: { geographic: 'Global (198 countries)', temporal: '1945-present', entities: '4,000+ climate policies' },
    updateFrequency: 'Quarterly',
    license: 'CC BY-NC 4.0',
    endpoints: [
      {
        path: '/policies',
        method: 'GET',
        description: 'Climate policies by country, sector, instrument type',
        params: ['country', 'sector', 'policy_type', 'status', 'year_from', 'year_to'],
        fields: [
          { sourceField: 'policy_name', targetTable: 'climate_policies', targetColumn: 'policy_name', type: 'string', unit: null },
          { sourceField: 'country', targetTable: 'climate_policies', targetColumn: 'country_name', type: 'string', unit: null },
          { sourceField: 'sector', targetTable: 'climate_policies', targetColumn: 'sector', type: 'string', unit: null },
          { sourceField: 'policy_type', targetTable: 'climate_policies', targetColumn: 'instrument_type', type: 'string', unit: null },
          { sourceField: 'year_implemented', targetTable: 'climate_policies', targetColumn: 'implementation_year', type: 'number', unit: 'year' },
          { sourceField: 'status', targetTable: 'climate_policies', targetColumn: 'policy_status', type: 'string', unit: null },
          { sourceField: 'ghg_impact_mtco2e', targetTable: 'climate_policies', targetColumn: 'estimated_impact_mtco2e', type: 'number', unit: 'MtCO2e' },
          { sourceField: 'description', targetTable: 'climate_policies', targetColumn: 'policy_description', type: 'string', unit: null },
        ],
        engines: ['E-007', 'E-028', 'E-033'],
      },
    ],
    modules: ['climate-policy-intelligence', 'transition-scenario-modeller', 'ngfs-scenarios', 'cbam-compliance'],
    qualityAssessment: { accuracy: qScore(118), timeliness: qScore(119), completeness: qScore(120), methodology: 'NewClimate Institute research team + peer review' },
  },
];

// =============================================================================
// Combine all sources
// =============================================================================

export const FREE_DATA_SOURCES = [
  ...emissionsSources,
  ...energySources,
  ...esgSources,
  ...natureSources,
  ...economicSources,
  ...regulatorySources,
];

// =============================================================================
// FREE_SOURCE_SUMMARY
// =============================================================================

const countEndpoints = (sources) => sources.reduce((n, s) => n + s.endpoints.length, 0);
const countFields = (sources) => sources.reduce((n, s) =>
  n + s.endpoints.reduce((m, ep) => m + ep.fields.length, 0), 0);

const byCategory = {
  [CATEGORIES.EMISSIONS]: { count: emissionsSources.length, endpoints: countEndpoints(emissionsSources), fields: countFields(emissionsSources) },
  [CATEGORIES.ENERGY]: { count: energySources.length, endpoints: countEndpoints(energySources), fields: countFields(energySources) },
  [CATEGORIES.ESG]: { count: esgSources.length, endpoints: countEndpoints(esgSources), fields: countFields(esgSources) },
  [CATEGORIES.NATURE]: { count: natureSources.length, endpoints: countEndpoints(natureSources), fields: countFields(natureSources) },
  [CATEGORIES.ECONOMIC]: { count: economicSources.length, endpoints: countEndpoints(economicSources), fields: countFields(economicSources) },
  [CATEGORIES.REGULATORY]: { count: regulatorySources.length, endpoints: countEndpoints(regulatorySources), fields: countFields(regulatorySources) },
};

export const FREE_SOURCE_SUMMARY = {
  totalSources: FREE_DATA_SOURCES.length,
  totalEndpoints: countEndpoints(FREE_DATA_SOURCES),
  totalFields: countFields(FREE_DATA_SOURCES),
  byCategory,
  authBreakdown: {
    none: FREE_DATA_SOURCES.filter(s => s.auth.method === 'none').length,
    api_key: FREE_DATA_SOURCES.filter(s => s.auth.method === 'api_key').length,
    user_agent: FREE_DATA_SOURCES.filter(s => s.auth.method === 'user_agent').length,
  },
  formatBreakdown: {
    json: FREE_DATA_SOURCES.filter(s => s.format.includes('JSON')).length,
    csv: FREE_DATA_SOURCES.filter(s => s.format.includes('CSV')).length,
    xml: FREE_DATA_SOURCES.filter(s => s.format.includes('XML')).length,
    xbrl: FREE_DATA_SOURCES.filter(s => s.format.includes('XBRL')).length,
  },
  licenseBreakdown: (() => {
    const map = {};
    FREE_DATA_SOURCES.forEach(s => { map[s.license] = (map[s.license] || 0) + 1; });
    return map;
  })(),
};

// =============================================================================
// FREE_SOURCE_FIELD_MAP — all fields across all sources mapped to DB tables
// =============================================================================

export const FREE_SOURCE_FIELD_MAP = (() => {
  const map = {};
  FREE_DATA_SOURCES.forEach(source => {
    source.endpoints.forEach(ep => {
      ep.fields.forEach(f => {
        const key = `${f.targetTable}.${f.targetColumn}`;
        if (!map[key]) {
          map[key] = {
            targetTable: f.targetTable,
            targetColumn: f.targetColumn,
            type: f.type,
            unit: f.unit,
            sources: [],
          };
        }
        map[key].sources.push({
          sourceId: source.id,
          sourceName: source.name,
          sourceField: f.sourceField,
          endpoint: ep.path,
        });
      });
    });
  });
  return map;
})();

// =============================================================================
// FREE_SOURCE_ENGINE_MAP — which engines each free source feeds
// =============================================================================

export const FREE_SOURCE_ENGINE_MAP = (() => {
  const engineToSources = {};
  const sourceToEngines = {};

  FREE_DATA_SOURCES.forEach(source => {
    const engineSet = new Set();
    source.endpoints.forEach(ep => {
      (ep.engines || []).forEach(eng => {
        engineSet.add(eng);
        if (!engineToSources[eng]) engineToSources[eng] = [];
        engineToSources[eng].push({ id: source.id, name: source.name, endpoint: ep.path });
      });
    });
    sourceToEngines[source.id] = { name: source.name, engines: [...engineSet].sort() };
  });

  return {
    byEngine: engineToSources,
    bySource: sourceToEngines,
    engineCount: Object.keys(engineToSources).length,
    avgSourcesPerEngine: +(
      Object.values(engineToSources).reduce((sum, arr) => sum + arr.length, 0) /
      Math.max(Object.keys(engineToSources).length, 1)
    ).toFixed(1),
    avgEnginesPerSource: +(
      Object.values(sourceToEngines).reduce((sum, s) => sum + s.engines.length, 0) /
      Math.max(Object.keys(sourceToEngines).length, 1)
    ).toFixed(1),
  };
})();

export default FREE_DATA_SOURCES;
