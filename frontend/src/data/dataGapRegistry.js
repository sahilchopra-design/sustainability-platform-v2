// =============================================================================
// DATA GAP REGISTRY — Platform-Wide Data Requirements Map
// =============================================================================
// Maps all ~555 modules across 93 domains to:
//   (a) data currently present (real public-domain sources)
//   (b) remaining gaps (still synthetic PRNG)
//   (c) recommended public source to fill each gap
//
// Last updated: 2026-04-27
// Platform: A² Intelligence Sustainability & Risk Analytics
//
// HOW TO USE:
//   import { DATA_GAP_REGISTRY, DATA_INVENTORY } from './dataGapRegistry';
//   - DATA_INVENTORY:    everything the platform already has (real data)
//   - DATA_GAP_REGISTRY: gaps + recommended sources, ordered by priority
// =============================================================================

// ---------------------------------------------------------------------------
// 1. DATA INVENTORY — What is already present (real public-domain data)
// ---------------------------------------------------------------------------
export const DATA_INVENTORY = {
  emissions_climate: [
    { file: 'countryEmissions.js',         source: 'IEA/EDGAR/OWID 2022',         coverage: '90 countries, CO2 + GHG, 2022',                  status: 'REAL' },
    { file: 'owid-co2-compact.json',        source: 'OWID CO2 Dataset (CC BY 4.0)', coverage: '~200 countries, 1750-2022, CO2 + GHG + energy',   status: 'REAL' },
    { file: 'owid-energy-compact.json',     source: 'OWID Energy Dataset (CC BY 4.0)',coverage:'~200 countries, energy mix 1965-2022',            status: 'REAL' },
    { file: 'emissionFactors.js',           source: 'DEFRA 2023, EPA eGRID 2022',   coverage: 'Transport, grid, spend-based EFs',               status: 'REAL' },
    { file: 'gridIntensity.js',             source: 'Ember Global Electricity 2023', coverage: '26 countries, gCO2/kWh annual avg 2022',          status: 'REAL' },
    { file: 'freeDataSources.js (FS-001-3)',source: 'Climate TRACE, GCP, EDGAR API', coverage: 'API endpoints mapped, field-level schema',        status: 'API_MAPPED' },
  ],
  carbon_markets: [
    { file: 'carbonPrices.js',              source: 'EEA, RGGI Inc., CARB, ICE',    coverage: 'EU ETS (2018-2024), UK ETS, RGGI, CA, NGFS shadow',status: 'REAL' },
    { file: 'verraRegistryData.js',         source: 'Verra CCB/SD VISta registries', coverage: '819 projects, REDD+/ARR/IFM/Blue Carbon/Soil',    status: 'REAL' },
    { file: 'data/referenceData/cbiTaxonomy.js', source: 'Climate Bonds Initiative', coverage: 'EU Taxonomy + CBI taxonomy tree',                status: 'REAL' },
    { file: 'sovereignMacroSeed.js (VCM)',  source: 'Ecosystem Marketplace 2023, BeZero', coverage: '14 project types, prices/volumes/registry',  status: 'REAL' },
  ],
  scenarios_macro: [
    { file: 'climateRiskDataService.js',    source: 'NGFS Phase IV, Nov 2023',       coverage: '6 scenarios, PD uplift (20 NACE), LGD uplift, carbon price paths', status: 'REAL' },
    { file: 'sovereignMacroSeed.js (IMF)',  source: 'IMF WEO April 2024',            coverage: '80 countries: GDP, debt, inflation, credit rating', status: 'REAL' },
  ],
  sbti_taxonomy: [
    { file: 'sbti-companies.json',          source: 'SBTi Target Dashboard 2024',    coverage: '10,711 companies: name, country, status, classification, target year', status: 'REAL' },
    { file: 'sectorBenchmarks.js',          source: 'MSCI/Trucost/SBTi/IEA 2022-24', coverage: '30 GICS sectors: S1+S2 intensity p25/median/p75, SBTi pathway', status: 'REAL' },
  ],
  company_master: [
    { file: 'globalCompanyMaster.js',       source: '14 exchange files',             coverage: '14 exchanges: NYSE/NASDAQ, LSE, XETRA, Euronext, TSE, ASX, SGX, KRX, SSE, B3, JSE, TSX, +APAC', status: 'REAL' },
    { file: 'evicData.json',                source: 'EODHD 2026-03-30',              coverage: '174 companies: EVIC, market cap, debt, preferred, minority', status: 'REAL' },
    { file: 'realMarketData.json',          source: 'Market data Q1 2024',           coverage: 'Major equities: ISIN, sector, exchange, market cap, P/E', status: 'REAL' },
    { file: 'publicDataSeed.js (CDP)',      source: 'CDP/company reports 2022',      coverage: '50 companies: S1+S2 market-based, intensity, SBTi status', status: 'REAL' },
  ],
  physical_risk_water: [
    { file: 'sovereignMacroSeed.js (EM-DAT)', source: 'CRED EM-DAT 2000-2023',      coverage: '80 countries: avg annual floods/droughts/storms/EQ, economic losses', status: 'REAL' },
    { file: 'publicDataSeed.js (WRI)',      source: 'WRI Aqueduct 4.0 2023',         coverage: '80 countries: water stress, groundwater depletion, flood/drought risk (0-5)', status: 'REAL' },
  ],
  adaptation_vulnerability: [
    { file: 'publicDataSeed.js (ND-GAIN)', source: 'Notre Dame ND-GAIN 2022',        coverage: '80 countries: vulnerability (0-1), readiness (0-1), rank', status: 'REAL' },
    { file: 'cbam-vulnerability.json',      source: 'EU CBAM exposure analysis',      coverage: 'Country CBAM sectors, commodity prices, trade flows', status: 'REAL' },
  ],
  energy_renewable: [
    { file: 'publicDataSeed.js (IRENA)',    source: 'IRENA Renewable Capacity 2024', coverage: '60 countries: solar/wind/hydro/geo/bio GW, share %, YoY growth (2023)', status: 'REAL' },
    { file: 'publicDataSeed.js (IEA)',      source: 'IEA World Energy Employment 2023',coverage:'Global + 7 regions: clean/fossil jobs by technology (millions)', status: 'REAL' },
    { file: 'ceda-2025.json',               source: 'Open CEDA 2025',                coverage: '400 sectors × 149 countries: spend-based emission factors', status: 'REAL' },
  ],
  green_finance: [
    { file: 'publicDataSeed.js (CBI)',      source: 'Climate Bonds Initiative 2023',  coverage: '40 countries: green bond issuance 2022-2023, sovereign flag, top sectors', status: 'REAL' },
    { file: 'sovereignMacroSeed.js (TCFD)', source: 'TCFD 2023, CDP, KPMG, GRI',     coverage: '14 countries + 10 sectors: TCFD/SFDR/CSRD/BRSR adoption rates', status: 'REAL' },
  ],
  food_agriculture: [
    { file: 'big-climate-db.json',          source: 'Open food LCA database',         coverage: '2,700 food/product records: lifecycle emissions by stage (agriculture/processing/packaging/transport)', status: 'REAL' },
  ],
  india_specific: [
    { file: 'indiaDataset.js',              source: 'OWID/CEDA/CBAM/SBTi (India subset)', coverage: '200 Indian companies, India grid factors, SBTi Indian subset, BRSR mapping', status: 'REAL' },
    { file: 'ceaGridFactors.js',            source: 'CEA India grid factors',          coverage: 'Indian regional/state grid emission factors',              status: 'REAL' },
    { file: 'brsrMapping.js',               source: 'SEBI BRSR framework',             coverage: 'BRSR indicator → ESG mapping',                             status: 'REAL' },
  ],
  external_apis: [
    { file: 'referenceData/externalDataSources.js', source: 'World Bank, FRED, ECB, GLEIF, SEC EDGAR, Finnhub, OECD, OpenSanctions, GDELT, SBTi', coverage: '10 live APIs with caching + rate-limit handling', status: 'API_LIVE' },
    { file: 'freeDataSources.js',           source: '40 free/open APIs',              coverage: 'Climate TRACE, EDGAR, GCP, PRIMAP, IEA, Ember, WRI, Verra API, Gold Standard, EM-DAT, GLEIF, World Bank, etc.', status: 'API_MAPPED' },
  ],
};

// ---------------------------------------------------------------------------
// 2. DATA GAP REGISTRY — Gaps + recommended public fills, by domain
// ---------------------------------------------------------------------------
// Priority:  P0 = Breaks module functionality (NaN/empty renders)
//            P1 = Significantly degrades analytical accuracy
//            P2 = Enhances depth / specialised modules
//            P3 = Nice-to-have, non-blocking
// Fill type: SEED = embed as static JS array (done in seed files above)
//            API  = call live API at runtime
//            FILE = download & include as JSON/CSV
// ---------------------------------------------------------------------------

export const DATA_GAP_REGISTRY = [

  // ═══════════════════════════════════════════════════════════════════════════
  // DOMAIN 1 — PCAF & FINANCED EMISSIONS (ep-pcaf-*, ep-portfolio-*)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'GAP-001',
    domain: 'PCAF Financed Emissions',
    modules: ['pcaf-financed-emissions', 'paris-alignment', 'portfolio-temperature-score', 'climate-var', 'integrated-carbon-emissions'],
    gap: 'Company-level Scope 1+2 emissions for portfolio holdings — currently PRNG synthetic',
    impact: 'PCAF intensity, WACI, ITR calculations all depend on per-company GHG figures',
    priority: 'P0',
    recommended_source: {
      name: 'CDP Open Data + publicDataSeed.js (CDP_COMPANY_EMISSIONS)',
      url: 'https://data.cdp.net/browse',
      license: 'Free for non-commercial research',
      coverage: '23,000+ companies, annual S1/S2/S3 disclosure',
      format: 'CSV download or API',
      update_frequency: 'Annual (October)',
      fields_needed: 'scope1_tonnes_co2e, scope2_market_tonnes_co2e, revenue_usd, evic_usd',
    },
    fill_status: 'PARTIAL — 50 major companies now in publicDataSeed.js (CDP_COMPANY_EMISSIONS). Remaining ~4,500 portfolio companies still synthetic.',
    action: 'Use CDP_COMPANY_EMISSIONS for tier-1 holdings; call World Bank + CDP API for remainder; fall back to SECTOR_EMISSION_INTENSITY revenue proxy',
    effort_days: 2,
  },

  {
    id: 'GAP-002',
    domain: 'PCAF Financed Emissions',
    modules: ['pcaf-financed-emissions', 'portfolio-temperature-score'],
    gap: 'Company EVIC data for full portfolio (174 companies in evicData.json vs ~600 in mock portfolio)',
    impact: 'PCAF attribution factor = loan_value/EVIC — wrong EVIC inflates/deflates all financed emission figures',
    priority: 'P0',
    recommended_source: {
      name: 'SEC EDGAR (US) + GLEIF (global) via externalDataSources.js',
      url: 'https://efts.sec.gov/LATEST/search-index?q=%22total+equity%22&dateRange=custom',
      license: 'Public domain',
      coverage: 'All SEC-registered companies (US); GLEIF for global LEI/legal entity data',
      format: 'JSON/XML API',
      update_frequency: 'Quarterly',
      fields_needed: 'market_cap, long_term_debt, current_debt, preferred_equity, minority_interest → EVIC',
    },
    fill_status: 'PARTIAL — evicData.json has 174 real EVIC figures from EODHD. Extend via SEC EDGAR API in evicService.js.',
    action: 'Extend evicService.js to call SEC EDGAR /submissions/{CIK} + parse balance sheet for EVIC components',
    effort_days: 3,
  },

  {
    id: 'GAP-003',
    domain: 'Paris Alignment / Temperature Score',
    modules: ['paris-alignment', 'portfolio-temperature-score', 'sbti-engagement-tracker'],
    gap: 'Company-level Implied Temperature Rise (ITR) scores',
    impact: 'Portfolio-level temperature headline metric — currently randomized',
    priority: 'P0',
    recommended_source: {
      name: 'SBTi Target Dashboard (sbti-companies.json already present) + MSCI ITR estimates',
      url: 'https://sciencebasedtargets.org/companies-taking-action',
      license: 'CC BY 4.0 public data',
      coverage: '10,711 companies with target year + classification',
      format: 'JSON (already loaded: sbti-companies.json)',
      update_frequency: 'Monthly',
      fields_needed: 'company, sbti_status, target_year, scope_coverage, classification',
    },
    fill_status: 'DATA PRESENT (sbti-companies.json 10,711 companies). Derive ITR from: SBTi "Committed" → 1.5°C; "Targets Set" → 1.7°C; no target → sector_avg_temp from SECTOR_PD_UPLIFT.',
    action: 'Wire sbtiTemperatureDerivation.js (already exists) into portfolio-temperature-score and paris-alignment pages; replace PRNG ITR with derived values',
    effort_days: 1,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DOMAIN 2 — PHYSICAL RISK (physical-risk-*, sovereign-physical-risk, water-risk-*)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'GAP-004',
    domain: 'Physical Risk — Asset Level',
    modules: ['physical-risk-portfolio', 'physical-hazard-map', 'physical-risk-pricing', 'real-estate-climate-risk'],
    gap: 'Asset-level flood/drought/heat hazard scores (currently PRNG per asset)',
    impact: 'Physical VaR and climate PD uplift at asset level inaccurate without coordinates + hazard overlay',
    priority: 'P1',
    recommended_source: {
      name: 'WRI Aqueduct 4.0 (water/flood) + EM-DAT country baselines (sovereignMacroSeed.js)',
      url: 'https://www.wri.org/aqueduct; https://www.emdat.be/',
      license: 'CC BY 4.0',
      coverage: 'Aqueduct: sub-watershed level globally. EM-DAT: country-level 2000-2023.',
      format: 'GeoJSON/API (Aqueduct) + CSV download (EM-DAT)',
      update_frequency: 'Aqueduct: every 2-3 years; EM-DAT: continuous',
      fields_needed: 'baseline_water_stress, riverine_flood_risk, coastal_flood_risk, drought_risk (0-5 scale)',
    },
    fill_status: 'PARTIAL — Country-level scores now in sovereignMacroSeed.js (WRI_AQUEDUCT_WATER_RISK + EMDAT_PHYSICAL_HAZARD_FREQUENCY). Asset-level geo-lookup not yet implemented.',
    action: 'Use WRI_AQUEDUCT_WATER_RISK country scores as fallback for asset physical risk; Aqueduct API for precision lat/lon lookups',
    effort_days: 3,
  },

  {
    id: 'GAP-005',
    domain: 'Physical Risk — Sovereign',
    modules: ['sovereign-physical-risk', 'sovereign-climate-risk', 'country-risk-dashboard'],
    gap: 'Country-level physical hazard composite scores and GDP-at-risk estimates',
    impact: 'Sovereign physical risk page shows PRNG hazard scores — misleads sovereign credit analysis',
    priority: 'P1',
    recommended_source: {
      name: 'EM-DAT + ND-GAIN (now in sovereignMacroSeed.js) + World Bank Climate Knowledge Portal',
      url: 'https://climateknowledgeportal.worldbank.org/',
      license: 'CC BY 4.0 / Open Government',
      coverage: '200 countries, hazard exposure + adaptive capacity',
      format: 'API + CSV',
      update_frequency: 'Annual',
      fields_needed: 'hazard_exposure_index, adaptive_capacity, gdp_at_risk_pct, sea_level_rise_exposure',
    },
    fill_status: 'PARTIAL — EM-DAT country hazard frequency + ND-GAIN vulnerability/readiness now in sovereignMacroSeed.js.',
    action: 'Replace PRNG hazard scores in sovereign-physical-risk with EMDAT_PHYSICAL_HAZARD_FREQUENCY.composite_hazard_score + ND_GAIN_COUNTRY_SCORES.vulnerability',
    effort_days: 1,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DOMAIN 3 — SOVEREIGN RISK & MACRO (sovereign-esg-scorer, sovereign-climate-risk)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'GAP-006',
    domain: 'Sovereign Macro & Credit',
    modules: ['sovereign-esg-scorer', 'sovereign-climate-risk', 'central-bank-climate', 'country-risk-dashboard'],
    gap: 'Country GDP, debt/GDP, credit ratings, inflation — currently all PRNG',
    impact: 'Sovereign ESG scoring and fiscal space calculations produce random results',
    priority: 'P0',
    recommended_source: {
      name: 'IMF WEO April 2024 (now in sovereignMacroSeed.js SOVEREIGN_MACRO_2024)',
      url: 'https://imf.org/en/Publications/WEO/weo-database/2024/April',
      license: 'Public domain / Open Government',
      coverage: '190 countries, GDP/growth/debt/CA/inflation 2023-2028F',
      format: 'CSV / Excel download',
      update_frequency: 'Bi-annual (April / October)',
      fields_needed: 'gdp_usd_bn, gdp_growth_pct, general_govt_gross_debt_pct_gdp, cpi_inflation_pct',
    },
    fill_status: 'COMPLETE — SOVEREIGN_MACRO_2024 now in sovereignMacroSeed.js (80 countries with real IMF WEO values).',
    action: 'Import SOVEREIGN_MACRO_2024 in sovereign-esg-scorer, sovereign-climate-risk, central-bank-climate; replace COUNTRIES[] PRNG with real data',
    effort_days: 1,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DOMAIN 4 — ESG DISCLOSURE (sfdr-*, csrd-*, issb-*)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'GAP-007',
    domain: 'SFDR PAI Indicators',
    modules: ['sfdr-pai', 'sfdr-pai-dashboard', 'sfdr-v2-reporting', 'sfdr-art9', 'sfdr-classification'],
    gap: 'SFDR PAI indicator values per fund holding — all 18 mandatory PAI metrics synthetic',
    impact: 'PAI calculation engine runs on random data; SFDR reporting is illustrative-only',
    priority: 'P1',
    recommended_source: {
      name: 'CDP Open Data (S1/S2 → PAI 1,2,4) + publicDataSeed.js (CDP_COMPANY_EMISSIONS)',
      url: 'https://data.cdp.net/browse',
      license: 'Free research use',
      coverage: 'PAI 1 (S1+S2+S3 intensity), PAI 2 (carbon footprint), PAI 4 (fossil fuel exposure)',
      format: 'CSV',
      update_frequency: 'Annual',
      fields_needed: 'scope1, scope2_market, scope3_cat15, revenue_eur, fossil_fuel_revenue_pct, board_gender_diversity_pct',
    },
    fill_status: 'PARTIAL — CDP_COMPANY_EMISSIONS covers PAI 1/2/4 for 50 holdings. PAI 5-18 (biodiversity, water, waste, social) still gap.',
    action: 'Derive PAI 1-4 from CDP_COMPANY_EMISSIONS for covered companies; use SECTOR_EMISSION_INTENSITY median for non-covered; extend to PAI 5-18 using MSCI ESG proxy data (requires subscription) or World Bank water/labor indicators',
    effort_days: 4,
  },

  {
    id: 'GAP-008',
    domain: 'CSRD / ESRS Reporting',
    modules: ['csrd-dma', 'csrd-esrs-automation', 'csrd-esrs-full', 'csrd-xbrl'],
    gap: 'Company-specific ESRS data points (E1-E5 environmental + S1-S4 social + G1 governance)',
    impact: 'CSRD DMA and ESRS taxonomy page shows synthetic impact scores',
    priority: 'P1',
    recommended_source: {
      name: 'CDP + GRI Standards + Refinitiv Open Data (ESRS proxies)',
      url: 'https://data.cdp.net; https://www.globalreporting.org/standards/',
      license: 'GRI: open use; CDP: free research',
      coverage: 'CDP covers E1 (GHG), E3 (water), E5 (resource use). GRI provides sector standards.',
      format: 'CSV / PDF',
      update_frequency: 'Annual',
      fields_needed: 'ghg_emissions (E1-6,E1-7), water_withdrawal (E3-4), hazardous_waste (E5-5), workforce_turnover (S1-14)',
    },
    fill_status: 'PARTIAL — Emission factors and sector benchmarks cover E1 partially. E2-E5 and S/G topics fully synthetic.',
    action: 'Use CDP_COMPANY_EMISSIONS for E1 metrics; build E2 sector air pollution proxies from EDGAR; use ILO labor indicators for S1 proxies',
    effort_days: 5,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DOMAIN 5 — CARBON MARKETS (carbon-credit-engine, vcm-*, article6-*)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'GAP-009',
    domain: 'VCM Carbon Credits',
    modules: ['carbon-credit-engine', 'article6-markets', 'avoided-emissions-calculator', 'vcm-analytics'],
    gap: 'VCM credit prices and forward curves — currently PRNG',
    impact: 'Carbon credit valuation, portfolio optimization, and pricing modules show random prices',
    priority: 'P0',
    recommended_source: {
      name: 'Ecosystem Marketplace + sovereignMacroSeed.js (VCM_CREDIT_PRICES_2023)',
      url: 'https://www.ecosystemmarketplace.net/carbon-markets/',
      license: 'Public summary reports (State of VCM 2023)',
      coverage: 'All major project types: REDD+, ARR, IFM, Blue Carbon, RE, Cookstoves, DAC, BECCS',
      format: 'PDF report (manual extract) / Xpansiv CBL (subscription for live)',
      update_frequency: 'Annual for averages; CBL real-time (subscription)',
      fields_needed: 'price_avg_usd, price_median_usd, volume_mtco2e, registry, project_type',
    },
    fill_status: 'COMPLETE — VCM_CREDIT_PRICES_2023 now in sovereignMacroSeed.js (14 project types, avg/median/p25/p75, registry breakdown).',
    action: 'Import VCM_CREDIT_PRICES_2023 into carbon-credit-engine, article6-markets, vcm-analytics; replace PRNG price arrays with real benchmarks',
    effort_days: 1,
  },

  {
    id: 'GAP-010',
    domain: 'Green Bonds',
    modules: ['green-bond-portfolio-analytics', 'green-bond-issuance-tracker', 'ep-dw-modules'],
    gap: 'Green bond issuance volumes by country and year',
    impact: 'Green bond analytics shows random market sizes and country rankings',
    priority: 'P1',
    recommended_source: {
      name: 'Climate Bonds Initiative (publicDataSeed.js GREEN_BOND_ISSUANCE_2023)',
      url: 'https://www.climatebonds.net/market/data/',
      license: 'Public summary data (Annual Report + Monthly Highlights)',
      coverage: '40 countries, 2022-2023 issuance, top sectors, sovereign flag',
      format: 'PDF/Excel download',
      update_frequency: 'Annual (January) + monthly highlights',
      fields_needed: 'country, issuance_usd_bn, top_sectors, sovereign_green_bond',
    },
    fill_status: 'COMPLETE — GREEN_BOND_ISSUANCE_2023 now in publicDataSeed.js (40 countries).',
    action: 'Import GREEN_BOND_ISSUANCE_2023 into green-bond modules; replace COUNTRIES market volume PRNG',
    effort_days: 1,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DOMAIN 6 — ENERGY TRANSITION (solar, wind, hydrogen, battery, nuclear, geothermal)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'GAP-011',
    domain: 'Renewable Energy Capacity',
    modules: ['ep-ds-modules (Green Hydrogen)', 'ep-dt-modules (Battery)', 'ep-du-modules (Nuclear)', 'ep-dv-modules (Geothermal)', 'solar-irradiance', 'wind-analytics'],
    gap: 'Country-level installed renewable capacity and growth trends',
    impact: 'Energy modules show random GW capacity figures without grounding in real deployment data',
    priority: 'P1',
    recommended_source: {
      name: 'IRENA (publicDataSeed.js IRENA_RENEWABLE_CAPACITY_2023)',
      url: 'https://www.irena.org/Statistics/Download-Data',
      license: 'CC BY 4.0',
      coverage: '60 countries, 2023 installed GW by tech (solar/wind/hydro/geo/bio), share %, YoY growth',
      format: 'Excel (IRENA IRENASTAT portal) → already embedded in seed file',
      update_frequency: 'Annual (March)',
      fields_needed: 'country, solar_pv_gw, wind_onshore_gw, wind_offshore_gw, hydro_gw, total_gw, renewable_share_pct',
    },
    fill_status: 'COMPLETE — IRENA_RENEWABLE_CAPACITY_2023 in publicDataSeed.js (60 countries).',
    action: 'Import into solar/wind/hydrogen/battery modules to replace PRNG country capacity tables',
    effort_days: 1,
  },

  {
    id: 'GAP-012',
    domain: 'Energy Employment / Just Transition',
    modules: ['ep-di-modules (Just Transition)', 'fossil-fuel-worker-transition', 'green-jobs-growth', 'community-climate-resilience'],
    gap: 'Clean energy vs fossil fuel employment by country — currently PRNG',
    impact: 'Just Transition modules show random workforce transition numbers',
    priority: 'P1',
    recommended_source: {
      name: 'IEA World Energy Employment 2023 (publicDataSeed.js IEA_GLOBAL_JOBS + IEA_COUNTRY_CLEAN_ENERGY_JOBS)',
      url: 'https://www.iea.org/reports/world-energy-employment-2023',
      license: 'IEA open license for non-commercial use',
      coverage: 'Global + 7 regions: clean/fossil jobs by technology (millions). Breakdown: solar 3.6M, wind 1.3M, EVs 3.8M, coal 11.2M, O&G 11.4M',
      format: 'PDF report (public summary extracted); Excel tables available to IEA subscribers',
      update_frequency: 'Annual (September)',
      fields_needed: 'clean_energy_jobs_total, solar_jobs, wind_jobs, coal_jobs, oil_gas_jobs (by country/region)',
    },
    fill_status: 'COMPLETE — IEA_GLOBAL_JOBS + IEA_COUNTRY_CLEAN_ENERGY_JOBS in publicDataSeed.js.',
    action: 'Import IEA employment data into GreenJobsGrowthPage, FossilFuelWorkerTransitionPage, CommunityClimateResiliencePage',
    effort_days: 1,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DOMAIN 7 — NATURE & BIODIVERSITY (tnfd-*, biodiversity-credit-engine, nature-capital-*)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'GAP-013',
    domain: 'Biodiversity & Nature',
    modules: ['tnfd-reporting', 'biodiversity-credit-engine', 'nature-capital-accounting', 'deforestation-risk'],
    gap: 'Species risk index, Protected Area coverage, biodiversity intactness — all PRNG',
    impact: 'TNFD LEAP assessment and biodiversity credit pricing lack real ecosystem data',
    priority: 'P2',
    recommended_source: {
      name: 'IUCN Red List API + GBIF + WDPA + Biodiversity Intactness Index (BII)',
      url: 'https://apiv3.iucnredlist.org (free API key); https://api.gbif.org (no auth); https://protectedplanet.net/en/thematic-areas/wdpa (UNEP-WCMC)',
      license: 'IUCN: CC BY; GBIF: CC BY 4.0; WDPA: Open Government',
      coverage: 'IUCN: 142,500+ species assessments. GBIF: 2.4bn occurrence records. WDPA: 270,000+ protected areas.',
      format: 'JSON API (IUCN, GBIF); CSV/GeoJSON (WDPA)',
      update_frequency: 'IUCN: quarterly; GBIF: continuous; WDPA: monthly',
      fields_needed: 'threatened_species_count, protected_area_pct, biodiversity_intactness_index (0-1)',
    },
    fill_status: 'NOT STARTED — Fully synthetic. Free API access available.',
    action: 'Add iucn_country_stats.js using IUCN Red List API /species/summary; add wdpa_coverage.js from WDPA country stats endpoint',
    effort_days: 3,
  },

  {
    id: 'GAP-014',
    domain: 'Deforestation & Land Use',
    modules: ['deforestation-risk', 'ep-dg-modules (Agriculture)', 'nature-capital-accounting'],
    gap: 'Forest cover change rates, deforestation drivers, commodity-linked deforestation',
    impact: 'Deforestation risk scores are PRNG; commodity exposure analysis inaccurate',
    priority: 'P2',
    recommended_source: {
      name: 'Global Forest Watch (GFW) API + FAO FRA 2020 + Trase.earth',
      url: 'https://data.globalforestwatch.org/; https://fra-data.fao.org/',
      license: 'CC BY 4.0 (GFW); FAO: Open Government License',
      coverage: 'GFW: Pixel-level deforestation 2001-2023. FAO FRA: country forest area 1990-2020.',
      format: 'GFW: REST API + GeoTIFF. FAO: CSV. Trase: CSV by company/country/commodity.',
      update_frequency: 'GFW: annual (Hansen); FAO: every 5 years',
      fields_needed: 'deforestation_ha_per_yr, forest_cover_pct, commodity_deforestation (soy/beef/palm/timber)',
    },
    fill_status: 'PARTIAL — big-climate-db.json has food LCA with agriculture/processing stages. Deforestation rates not yet seeded.',
    action: 'Add forest_change_rates.js from FAO FRA CSV download (170 countries, 1990-2020); wire into deforestation-risk and ep-dg modules',
    effort_days: 2,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DOMAIN 8 — WATER & AGRICULTURE (water-risk-*, food-water-*)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'GAP-015',
    domain: 'Water Risk Analytics',
    modules: ['water-risk-analytics', 'water-stress-mapping', 'ep-dz-modules (Ocean)'],
    gap: 'Aqueduct water stress scores used PRNG — now replaced with real data',
    impact: 'Previously: random stress scores. Now: real WRI Aqueduct 4.0 country values available.',
    priority: 'P1',
    recommended_source: {
      name: 'WRI Aqueduct 4.0 (already seeded in sovereignMacroSeed.js WRI_AQUEDUCT_WATER_RISK)',
      url: 'https://www.wri.org/aqueduct',
      license: 'CC BY 4.0',
      coverage: '80 countries seeded. Full dataset: sub-watershed level globally.',
      format: 'GeoJSON / country-aggregated CSV',
      update_frequency: 'Every 2-3 years',
      fields_needed: 'baseline_water_stress, groundwater_depletion, drought_risk, riverine_flood_risk (0-5)',
    },
    fill_status: 'COMPLETE (country level) — WRI_AQUEDUCT_WATER_RISK in sovereignMacroSeed.js.',
    action: 'Import WRI_AQUEDUCT_WATER_RISK in water-risk-analytics; replace sr(i*15)*5 PRNG pattern with real country scores',
    effort_days: 1,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DOMAIN 9 — BANKING & INSURANCE (central-bank-climate, stress-test-*, catastrophe-*)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'GAP-016',
    domain: 'Catastrophe & Insurance',
    modules: ['catastrophe-modelling', 'parametric-insurance', 'reinsurance-climate', 'pandemic-climate-nexus'],
    gap: 'Historical loss event data for catastrophe modelling — all PRNG',
    impact: 'Catastrophe loss curves and return period estimates are not grounded in real event history',
    priority: 'P1',
    recommended_source: {
      name: 'CRED EM-DAT + Swiss Re Sigma (public annual summary) + Munich Re NatCatSERVICE (free subset)',
      url: 'https://www.emdat.be/; https://www.swissre.com/institute/research/sigma-research.html',
      license: 'EM-DAT: CC BY 4.0; Swiss Re Sigma: public annual report',
      coverage: 'EM-DAT: 22,000+ events 1900-2023, economic + insured losses. Swiss Re Sigma: annual top-10 events.',
      format: 'CSV (EM-DAT); PDF/Excel (Swiss Re Sigma)',
      update_frequency: 'EM-DAT: continuous; Sigma: annual (January)',
      fields_needed: 'event_type, country, year, insured_losses_usd_bn, total_losses_usd_bn, fatalities',
    },
    fill_status: 'PARTIAL — EMDAT_PHYSICAL_HAZARD_FREQUENCY provides country aggregates. Event-level data not yet seeded.',
    action: 'Download EM-DAT public query for top-10 events per peril (2000-2023); embed as catastropheEvents.js',
    effort_days: 2,
  },

  {
    id: 'GAP-017',
    domain: 'Central Bank & Prudential',
    modules: ['central-bank-climate', 'credit-integrity-dd', 'structured-credit-climate', 'cascading-default-modeler'],
    gap: 'Central bank balance sheet exposures to climate sectors, bank-level Tier 1 ratios — PRNG',
    impact: 'Prudential risk calculations use random bank data',
    priority: 'P1',
    recommended_source: {
      name: 'ECB Statistical Data Warehouse + BIS Statistics + World Bank GFDD',
      url: 'https://sdw.ecb.europa.eu/; https://stats.bis.org/; https://data.worldbank.org/indicator/FB.BNK.CAPA.ZS',
      license: 'Open Government / BIS open data',
      coverage: 'ECB: EU bank balance sheets. BIS: global banking stats. GFDD: regulatory capital ratios by country.',
      format: 'JSON API (ECB/BIS) + CSV (World Bank)',
      update_frequency: 'Quarterly',
      fields_needed: 'tier1_capital_ratio, npl_ratio, leverage_ratio, fossil_fuel_loans_pct (ECB estimates)',
    },
    fill_status: 'NOT STARTED. externalDataSources.js already has ECB API integration (FS-009).',
    action: 'Use existing ECB API in externalDataSources.js to pull EU bank capital ratios; seed bankCapitalData.js for non-EU with BIS/World Bank data',
    effort_days: 3,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DOMAIN 10 — SUPPLY CHAIN & LABOR (supply-chain-carbon, just-transition-*)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'GAP-018',
    domain: 'Supply Chain & Labor',
    modules: ['supply-chain-carbon', 'ep-di6 (SupplyChainLaborClimateRisk)', 'just-transition-intelligence'],
    gap: 'ILO labor standards compliance and decent work indicators — all PRNG',
    impact: 'Supply chain labor risk scores and Just Transition social metrics are random',
    priority: 'P2',
    recommended_source: {
      name: 'ILO STAT API + World Bank CPIA + CSR Risk Check (BSCI/Amfori)',
      url: 'https://ilostat.ilo.org/data/; https://ilostat.ilo.org/resources/ilostat-api/',
      license: 'CC BY 4.0 (ILO); World Bank: Open Data',
      coverage: 'ILO: 200+ countries, 100+ labor indicators. Includes: union membership, wages, informal employment, child labor, occupational safety.',
      format: 'JSON API (ILOSTAT) + CSV',
      update_frequency: 'Annual',
      fields_needed: 'informal_employment_pct, union_density_pct, child_labor_rate, fatal_occupational_injuries_per_100k, min_wage_usd',
    },
    fill_status: 'NOT STARTED. freeDataSources.js has ILO STAT mapped (FS-036) but not yet fetched.',
    action: 'Call ILOSTAT API /indicator/SDG_1110_NOC_RT to get informal employment rates; /indicator/SDG_0881_SEX_RT for child labor; build laborIndicators.js',
    effort_days: 2,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DOMAIN 11 — TAXONOMY (eu-taxonomy-*, taxonomy-ml-classifier, capital-markets-taxonomy)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'GAP-019',
    domain: 'EU Taxonomy Alignment',
    modules: ['taxonomy-ml-classifier', 'capital-markets-taxonomy', 'fi-taxonomy-pcaf-bridge', 'eu-taxonomy-alignment'],
    gap: 'Company-level EU Taxonomy alignment scores — currently synthetic',
    impact: 'Taxonomy classification accuracy depends on real turnover/capex/opex aligned data',
    priority: 'P1',
    recommended_source: {
      name: 'ESMA SFDR Database + CDP A-List disclosure + EU Taxonomy Compass + CBI taxonomy (already present)',
      url: 'https://www.esma.europa.eu/document/taxonomy-reporting-data; https://ec.europa.eu/sustainable-finance-taxonomy/',
      license: 'Open Government (EU ESMA)',
      coverage: 'EU-listed fund holdings; SFDR entity-level taxonomy alignment disclosures (2023 onwards)',
      format: 'XML / CSV (ESMA)',
      update_frequency: 'Annual (April SFDR cycle)',
      fields_needed: 'taxonomy_eligible_pct, taxonomy_aligned_pct (turnover/capex/opex split), dnsh_compliance, minimum_safeguards',
    },
    fill_status: 'PARTIAL — cbiTaxonomy.js and CEDA 2025 provide sector-level EU taxonomy activity mappings. Company-level alignment percentages not seeded.',
    action: 'Embed EU Taxonomy Compass sector eligibility mappings as euTaxonomyEligibility.js; derive company-level alignment from sector medians until ESMA data available',
    effort_days: 2,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DOMAIN 12 — INDIA MARKET (ep-ea-* modules)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'GAP-020',
    domain: 'India Carbon Markets (PAC, REC, CCTS)',
    modules: ['ep-ea-modules', 'india-carbon-markets', 'ceaGridFactors'],
    gap: 'PAC (Perform Achieve Trade) credit prices, REC prices, India ETS (CCTS) details',
    impact: 'India carbon finance modules show PRNG prices for Indian carbon instruments',
    priority: 'P1',
    recommended_source: {
      name: 'BEE India (PAC/REC) + India Climate Finance Hub + SEBI sustainability portal',
      url: 'https://beeindia.gov.in/en/programmes/pac; https://iexindia.com/market-data/rec',
      license: 'Government of India Open Data (data.gov.in)',
      coverage: 'PAC cycle 1-3 prices; IEX REC monthly auction prices; CCTS framework docs',
      format: 'PDF/CSV (BEE); IEX market data (free registration)',
      update_frequency: 'Quarterly (IEX REC); annual (PAC)',
      fields_needed: 'rec_solar_price_inr, rec_non_solar_price_inr, pac_escer_price, ccts_expected_price',
    },
    fill_status: 'PARTIAL — ceaGridFactors.js and indiaDataset.js cover India grid emission factors. REC/PAC prices not seeded.',
    action: 'Add indiaCarbon Prices.js with: PAC cycle 2 clearing prices (2022: INR 678/ESCer), IEX REC solar (INR 1.50-2.50/kWh), non-solar (INR 1.50/kWh); CCTS expected price INR 200/tCO2e',
    effort_days: 1,
  },

];

// ---------------------------------------------------------------------------
// 3. SUMMARY STATISTICS
// ---------------------------------------------------------------------------
export const GAP_SUMMARY = {
  total_gaps: DATA_GAP_REGISTRY.length,
  by_priority: {
    P0: DATA_GAP_REGISTRY.filter(g => g.priority === 'P0').length,
    P1: DATA_GAP_REGISTRY.filter(g => g.priority === 'P1').length,
    P2: DATA_GAP_REGISTRY.filter(g => g.priority === 'P2').length,
    P3: DATA_GAP_REGISTRY.filter(g => g.priority === 'P3').length,
  },
  by_fill_status: {
    complete: DATA_GAP_REGISTRY.filter(g => g.fill_status.startsWith('COMPLETE')).length,
    partial:  DATA_GAP_REGISTRY.filter(g => g.fill_status.startsWith('PARTIAL')).length,
    not_started: DATA_GAP_REGISTRY.filter(g => g.fill_status.startsWith('NOT STARTED')).length,
  },
  seed_files_written: [
    { file: 'publicDataSeed.js',     exports: 7, lines: 724,  categories: 'CDP emissions (50co), ND-GAIN (80 countries), WRI Aqueduct (80), IRENA capacity (60), IEA employment, Green bonds (40)' },
    { file: 'sovereignMacroSeed.js', exports: 4, lines: 500,  categories: 'IMF WEO macro (80), EM-DAT hazard (80), VCM prices (14 types), TCFD/ESG adoption' },
  ],
  real_data_already_present: {
    files: Object.values(DATA_INVENTORY).flat().filter(f => f.status === 'REAL').length,
    api_integrations: Object.values(DATA_INVENTORY).flat().filter(f => f.status === 'API_LIVE' || f.status === 'API_MAPPED').length,
  },
  next_priorities: [
    'GAP-003: Wire sbtiTemperatureDerivation.js into portfolio-temperature-score (1 day)',
    'GAP-006: Import SOVEREIGN_MACRO_2024 into sovereign modules (1 day)',
    'GAP-009: Import VCM_CREDIT_PRICES_2023 into carbon-credit-engine (1 day)',
    'GAP-015: Import WRI_AQUEDUCT_WATER_RISK into water-risk-analytics (1 day)',
    'GAP-011: Import IRENA_RENEWABLE_CAPACITY_2023 into energy modules (1 day)',
  ],
};

// ---------------------------------------------------------------------------
// 4. PLATFORM-WIDE DATA COVERAGE SCORE
// ---------------------------------------------------------------------------
// Rough estimate: modules × categories × data presence
// 555 modules, 12 major data categories, coverage per category estimated:
export const COVERAGE_SCORE = {
  emissions_climate:       { coverage_pct: 85, notes: 'OWID/EDGAR/DEFRA/Ember — excellent' },
  carbon_markets:          { coverage_pct: 75, notes: 'EU ETS, VCM prices, Verra registry — good' },
  scenarios_macro:         { coverage_pct: 90, notes: 'NGFS Phase IV + IMF WEO now complete' },
  sbti_taxonomy:           { coverage_pct: 80, notes: 'SBTi (10,711 co.) + CEDA 2025 — strong' },
  company_evic_emissions:  { coverage_pct: 40, notes: 'CDP 50 co. + EVIC 174 co. — partial; ~4,500 synthetic' },
  physical_risk_water:     { coverage_pct: 70, notes: 'EM-DAT + WRI Aqueduct country level — good' },
  adaptation_vulnerability:{ coverage_pct: 75, notes: 'ND-GAIN 80 countries + CBAM — good' },
  energy_renewable:        { coverage_pct: 80, notes: 'IRENA 60 countries + OWID energy — good' },
  just_transition_labor:   { coverage_pct: 55, notes: 'IEA employment global/regional — partial; country detail gap' },
  green_finance_esg:       { coverage_pct: 65, notes: 'CBI green bonds + TCFD adoption — good; SFDR PAI company data partial' },
  nature_biodiversity:     { coverage_pct: 25, notes: 'Only food LCA (big-climate-db) — significant gap' },
  india_market:            { coverage_pct: 70, notes: 'indiaDataset + OWID India + CEA grid — good; REC/PAC prices gap' },
  overall_weighted:        { coverage_pct: 68, notes: 'Weighted by module count and criticality' },
};
