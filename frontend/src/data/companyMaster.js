/**
 * COMPANY MASTER DATABASE — FY2024 Annual Report Data
 * Sources: SEBI BRSR Core P6 FY2024, NSE/BSE filings, MCA21, Annual Reports,
 *          CDP India 2023, CPCB/MoEFCC, CRISIL/ICRA ratings, Bloomberg consensus
 * Financial year: April 2023 – March 2024 (FY24) unless noted
 * Market data: As of 31-Mar-2024 closing prices
 * GHG emissions: tCO2e (metric tonnes of CO2 equivalent)
 */

export const COMPANY_MASTER = [

  // ── ENERGY ────────────────────────────────────────────────────────────────
  {
    cin: 'L17110MH1973PLC019786',
    name: 'Reliance Industries Ltd', shortName: 'Reliance',
    sector: 'Energy', subsector: 'Integrated Oil & Gas',
    industry: 'Oil & Gas Refining, Marketing & Chemicals',
    exchange: 'NSE/BSE', ticker: 'RELIANCE',
    nifty50: true, niftyIndex: ['NIFTY50','NIFTY100','NIFTY500'],
    isin: 'INE002A01018',
    website: 'https://www.ril.com',
    founded_year: 1973, headquarters_city: 'Mumbai',
    description: "India's largest private-sector company operating across O&G refining, petrochemicals, retail (Reliance Retail), and digital (Jio Platforms). World's largest polyester yarn & fibre producer.",

    // ── FY2024 Financials (₹ Crore) ──
    revenue_inr_cr: 899041,
    ebitda_inr_cr: 157056,
    net_profit_inr_cr: 79020,
    eps_inr: 117.9,
    total_debt_inr_cr: 337000,
    market_cap_inr_cr: 1972000,
    evic_inr_cr: 2309000,          // Market Cap + Net Debt (approx)
    employees: 236334,
    data_as_of: 'FY2024', annual_report_year: 2024,

    // ── Ratios ──
    pe_ratio: 29.4,
    roe_pct: 9.8,
    roce_pct: 8.7,
    debt_equity_ratio: 0.33,
    interest_coverage_ratio: 5.2,
    dividend_yield_pct: 0.32,
    ebitda_margin_pct: 17.5,

    // ── Market Data (31-Mar-2024) ──
    beta: 0.85,
    week52_high_inr: 3025,
    week52_low_inr: 2228,
    stock_price_inr: 2922,

    // ── Ownership (Mar-2024) ──
    promoter_holding_pct: 50.05,
    fii_holding_pct: 23.87,
    dii_holding_pct: 13.42,

    // ── Credit ──
    credit_rating: 'AAA',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    // ── GHG Emissions FY2024 (tCO2e) ──
    scope1_co2e: 26500000,
    scope2_co2e: 890000,
    scope3_co2e: 185000000,
    ghg_reporting_year: 2024, ghg_source: 'RIL Sustainability Report 2023-24 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 30.5,
    carbon_neutral_target_year: null,
    sbti_committed: false,

    dqs_default: 2, instrument_default: 'Listed Equity',
    physical_risk: 'High', transition_risk: 'High',
    country: 'India', state: 'Maharashtra',
    tags: ['BRSR-Core','High-Emitter','Fossil-Fuel','NIFTY50'],
    notes: 'Largest private-sector company; Jio-BP joint venture for clean fuels; new energy (green H2, solar) investments ₹75,000 Cr pledged',
  },

  {
    cin: 'L74899DL1993GOI054155',
    name: 'Oil & Natural Gas Corporation Ltd', shortName: 'ONGC',
    sector: 'Energy', subsector: 'E&P',
    industry: 'Oil & Gas Exploration & Production',
    exchange: 'NSE/BSE', ticker: 'ONGC',
    nifty50: true, niftyIndex: ['NIFTY50','NIFTY100','NIFTYOIL&GAS'],
    isin: 'INE213A01029',
    website: 'https://www.ongcindia.com',
    founded_year: 1956, headquarters_city: 'New Delhi',
    description: "India's largest oil and gas E&P company (GoI 58.9%). Produces ~70% of India's domestic crude oil. Subsidiaries include HPCL and MRPL.",

    revenue_inr_cr: 673085,
    ebitda_inr_cr: 84200,
    net_profit_inr_cr: 40526,
    eps_inr: 32.1,
    total_debt_inr_cr: 84000,
    market_cap_inr_cr: 328000,
    evic_inr_cr: 412000,
    employees: 27195,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 8.1,
    roe_pct: 13.2,
    roce_pct: 12.8,
    debt_equity_ratio: 0.26,
    interest_coverage_ratio: 14.8,
    dividend_yield_pct: 4.5,
    ebitda_margin_pct: 12.5,

    beta: 0.92,
    week52_high_inr: 285,
    week52_low_inr: 154,
    stock_price_inr: 262,

    promoter_holding_pct: 58.89,
    fii_holding_pct: 13.21,
    dii_holding_pct: 20.88,

    credit_rating: 'AAA',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    scope1_co2e: 18200000,
    scope2_co2e: 620000,
    scope3_co2e: 96000000,
    ghg_reporting_year: 2024, ghg_source: 'ONGC Sustainability Report 2023-24 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 28.0,
    carbon_neutral_target_year: 2038,
    sbti_committed: false,

    dqs_default: 2, instrument_default: 'Listed Equity',
    physical_risk: 'High', transition_risk: 'High',
    country: 'India', state: 'Delhi',
    tags: ['PSU','BRSR-Core','High-Emitter','Fossil-Fuel','NIFTY50'],
    notes: 'Net Zero 2038 target; investing in offshore wind and green hydrogen; HPCL subsidiary drives retail fuel business',
  },

  {
    cin: 'L23201MH1959GOI011388',
    name: 'Indian Oil Corporation Ltd', shortName: 'IOC',
    sector: 'Energy', subsector: 'Refining & Marketing',
    industry: 'Oil & Gas Refining & Marketing',
    exchange: 'NSE/BSE', ticker: 'IOC',
    nifty50: false, niftyIndex: ['NIFTY100','NIFTYOIL&GAS'],
    isin: 'INE242A01010',
    website: 'https://www.iocl.com',
    founded_year: 1959, headquarters_city: 'New Delhi',
    description: "India's largest oil refining and marketing company (GoI 51.5%). Operates 11 refineries with total capacity 80.5 MMTPA. Largest fuel retail network: 34,000+ stations.",

    revenue_inr_cr: 834609,
    ebitda_inr_cr: 29800,
    net_profit_inr_cr: 20885,
    eps_inr: 14.8,
    total_debt_inr_cr: 112000,
    market_cap_inr_cr: 239000,
    evic_inr_cr: 351000,
    employees: 32535,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 11.4,
    roe_pct: 11.2,
    roce_pct: 9.5,
    debt_equity_ratio: 0.55,
    interest_coverage_ratio: 6.2,
    dividend_yield_pct: 6.8,
    ebitda_margin_pct: 3.6,

    beta: 0.88,
    week52_high_inr: 196,
    week52_low_inr: 90,
    stock_price_inr: 170,

    promoter_holding_pct: 51.50,
    fii_holding_pct: 11.90,
    dii_holding_pct: 23.40,

    credit_rating: 'AAA',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    scope1_co2e: 22100000,
    scope2_co2e: 1100000,
    scope3_co2e: 244000000,
    ghg_reporting_year: 2024, ghg_source: 'IOC Sustainability Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 27.9,
    carbon_neutral_target_year: 2046,
    sbti_committed: false,

    dqs_default: 2, instrument_default: 'Listed Equity',
    physical_risk: 'Medium', transition_risk: 'High',
    country: 'India', state: 'Delhi',
    tags: ['PSU','BRSR-Core','High-Emitter','Fossil-Fuel'],
    notes: 'Carbon neutral by 2046; 5 GW renewable energy target by 2030; IndianOil EV charging network expansion',
  },

  {
    cin: 'L40200DL1984GOI018085',
    name: 'GAIL India Ltd', shortName: 'GAIL',
    sector: 'Energy', subsector: 'Gas Transmission',
    industry: 'Gas Utilities',
    exchange: 'NSE/BSE', ticker: 'GAIL',
    nifty50: false, niftyIndex: ['NIFTY100','NIFTYENERGY'],
    isin: 'INE129A01019',
    website: 'https://www.gail.nic.in',
    founded_year: 1984, headquarters_city: 'New Delhi',
    description: "India's principal natural gas transmission and marketing company (GoI 51.9%). Operates 14,500 km pipeline network; also in petrochemicals, LPG, and city gas distribution.",

    revenue_inr_cr: 146002,
    ebitda_inr_cr: 14800,
    net_profit_inr_cr: 10218,
    eps_inr: 15.7,
    total_debt_inr_cr: 14200,
    market_cap_inr_cr: 119000,
    evic_inr_cr: 133200,
    employees: 4151,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 11.7,
    roe_pct: 9.8,
    roce_pct: 11.2,
    debt_equity_ratio: 0.13,
    interest_coverage_ratio: 22.0,
    dividend_yield_pct: 4.2,
    ebitda_margin_pct: 10.1,

    beta: 0.78,
    week52_high_inr: 225,
    week52_low_inr: 114,
    stock_price_inr: 183,

    promoter_holding_pct: 51.92,
    fii_holding_pct: 13.42,
    dii_holding_pct: 22.10,

    credit_rating: 'AAA',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    scope1_co2e: 4200000,
    scope2_co2e: 180000,
    scope3_co2e: 28000000,
    ghg_reporting_year: 2024, ghg_source: 'GAIL Annual Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 29.8,
    carbon_neutral_target_year: null,
    sbti_committed: false,

    dqs_default: 3, instrument_default: 'Listed Equity',
    physical_risk: 'Medium', transition_risk: 'High',
    country: 'India', state: 'Delhi',
    tags: ['PSU','BRSR-Core','Fossil-Fuel'],
    notes: 'Planning 1 GW RE capacity; exploring hydrogen blending in gas grid; key player in India gas infrastructure scale-up',
  },

  // ── UTILITIES ─────────────────────────────────────────────────────────────
  {
    cin: 'L40101DL1975GOI007966',
    name: 'NTPC Ltd', shortName: 'NTPC',
    sector: 'Utilities', subsector: 'Electric Generation',
    industry: 'Electric Utilities',
    exchange: 'NSE/BSE', ticker: 'NTPC',
    nifty50: true, niftyIndex: ['NIFTY50','NIFTY100','NIFTYPOWER'],
    isin: 'INE733E01010',
    website: 'https://www.ntpc.co.in',
    founded_year: 1975, headquarters_city: 'New Delhi',
    description: "India's largest power generation company (GoI 51.1%). Total installed capacity 73.7 GW (FY24); predominantly coal-based (67 GW thermal). RE target: 60 GW by 2032.",

    revenue_inr_cr: 175005,
    ebitda_inr_cr: 52100,
    net_profit_inr_cr: 21332,
    eps_inr: 22.1,
    total_debt_inr_cr: 284000,
    market_cap_inr_cr: 358000,
    evic_inr_cr: 642000,
    employees: 18133,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 16.8,
    roe_pct: 14.2,
    roce_pct: 7.8,
    debt_equity_ratio: 1.62,
    interest_coverage_ratio: 3.8,
    dividend_yield_pct: 1.8,
    ebitda_margin_pct: 29.8,

    beta: 0.80,
    week52_high_inr: 395,
    week52_low_inr: 199,
    stock_price_inr: 357,

    promoter_holding_pct: 51.10,
    fii_holding_pct: 13.95,
    dii_holding_pct: 19.89,

    credit_rating: 'AAA',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    scope1_co2e: 235800000,
    scope2_co2e: 480000,
    scope3_co2e: 8200000,
    ghg_reporting_year: 2024, ghg_source: 'NTPC Sustainability Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 1347.4,
    carbon_neutral_target_year: null,
    sbti_committed: false,
    installed_capacity_gw: 73.7,
    re_capacity_gw: 3.3,

    dqs_default: 2, instrument_default: 'Listed Equity',
    physical_risk: 'High', transition_risk: 'High',
    country: 'India', state: 'Delhi',
    tags: ['PSU','BRSR-Core','High-Emitter','Coal-Power','NIFTY50','Stranded-Risk'],
    notes: 'Emission factor ~0.90 tCO2/MWh; 60 GW RE target by 2032 (NTPC Renewable Energy subsidiary); largest RE developer among PSUs',
  },

  {
    cin: 'L40100GJ2015PLC082803',
    name: 'Adani Green Energy Ltd', shortName: 'Adani Green',
    sector: 'Utilities', subsector: 'Renewable Energy',
    industry: 'Renewable Electricity',
    exchange: 'NSE/BSE', ticker: 'ADANIGREEN',
    nifty50: false, niftyIndex: ['NIFTY100','NIFTYNEXT50'],
    isin: 'INE364U01010',
    website: 'https://www.adanigreenenergy.com',
    founded_year: 2015, headquarters_city: 'Ahmedabad',
    description: "India's largest renewable energy company by operational capacity (10.9 GW, FY24). Largest single-site solar plant globally (Khavda, 30 GW planned). Target: 50 GW by 2030.",

    revenue_inr_cr: 9133,
    ebitda_inr_cr: 7620,
    net_profit_inr_cr: 1260,
    eps_inr: 7.3,
    total_debt_inr_cr: 67900,
    market_cap_inr_cr: 152000,
    evic_inr_cr: 219900,
    employees: 2158,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 120.6,
    roe_pct: 6.2,
    roce_pct: 5.4,
    debt_equity_ratio: 7.8,
    interest_coverage_ratio: 1.9,
    dividend_yield_pct: 0.0,
    ebitda_margin_pct: 83.4,

    beta: 1.45,
    week52_high_inr: 2175,
    week52_low_inr: 1008,
    stock_price_inr: 1765,

    promoter_holding_pct: 61.93,
    fii_holding_pct: 18.42,
    dii_holding_pct: 7.15,

    credit_rating: 'AA',
    credit_rating_agency: 'ICRA',
    credit_outlook: 'Positive',

    scope1_co2e: 18000,
    scope2_co2e: 52000,
    scope3_co2e: 0,
    ghg_reporting_year: 2024, ghg_source: 'AGEL Annual Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 7.7,
    carbon_neutral_target_year: 2030,
    sbti_committed: true,
    installed_capacity_gw: 10.9,
    re_capacity_gw: 10.9,

    dqs_default: 3, instrument_default: 'Corporate Bond',
    physical_risk: 'Medium', transition_risk: 'Low',
    country: 'India', state: 'Gujarat',
    tags: ['BRSR-Core','Renewable','Green-Bond'],
    notes: 'Green bond issuance USD 1.35 Bn; Khavda solar-wind hybrid park (30 GW); Carbon neutral target FY2030; high leverage funded by project debt',
  },

  {
    cin: 'L40101DL1989GOI038121',
    name: 'Power Grid Corporation of India Ltd', shortName: 'PowerGrid',
    sector: 'Utilities', subsector: 'Electric Transmission',
    industry: 'Electric Transmission & Distribution',
    exchange: 'NSE/BSE', ticker: 'POWERGRID',
    nifty50: true, niftyIndex: ['NIFTY50','NIFTYPOWER'],
    isin: 'INE752E01010',
    website: 'https://www.powergridindia.com',
    founded_year: 1989, headquarters_city: 'Gurugram',
    description: "India's central transmission utility (GoI 51.3%). Owns and operates 1,72,000+ circuit km of transmission network. TBCB project developer for new RE evacuation corridors.",

    revenue_inr_cr: 46115,
    ebitda_inr_cr: 38200,
    net_profit_inr_cr: 15864,
    eps_inr: 30.5,
    total_debt_inr_cr: 127800,
    market_cap_inr_cr: 188000,
    evic_inr_cr: 315800,
    employees: 8985,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 18.9,
    roe_pct: 21.2,
    roce_pct: 8.8,
    debt_equity_ratio: 1.62,
    interest_coverage_ratio: 4.5,
    dividend_yield_pct: 3.4,
    ebitda_margin_pct: 82.8,

    beta: 0.65,
    week52_high_inr: 295,
    week52_low_inr: 182,
    stock_price_inr: 274,

    promoter_holding_pct: 51.34,
    fii_holding_pct: 20.45,
    dii_holding_pct: 16.88,

    credit_rating: 'AAA',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    scope1_co2e: 85000,
    scope2_co2e: 415000,
    scope3_co2e: 0,
    ghg_reporting_year: 2024, ghg_source: 'PowerGrid Annual Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 10.8,
    carbon_neutral_target_year: null,
    sbti_committed: false,

    dqs_default: 2, instrument_default: 'Listed Equity',
    physical_risk: 'Medium', transition_risk: 'Low',
    country: 'India', state: 'Haryana',
    tags: ['PSU','BRSR-Core','NIFTY50'],
    notes: 'Regulated return model (RoE 15.5% approved); low transition risk as grid enabler for RE integration; 5,000 km new transmission lines under construction',
  },

  {
    cin: 'L28920MH1919PLC000567',
    name: 'Tata Power Company Ltd', shortName: 'Tata Power',
    sector: 'Utilities', subsector: 'Integrated Utilities',
    industry: 'Integrated Electric Utilities',
    exchange: 'NSE/BSE', ticker: 'TATAPOWER',
    nifty50: false, niftyIndex: ['NIFTY100'],
    isin: 'INE245A01021',
    website: 'https://www.tatapower.com',
    founded_year: 1915, headquarters_city: 'Mumbai',
    description: "Integrated power company; generation (thermal + RE), distribution (Mumbai, Delhi), EV charging. Transitioning to >80% clean energy by 2030. Has 13 GW RE pipeline.",

    revenue_inr_cr: 57051,
    ebitda_inr_cr: 9850,
    net_profit_inr_cr: 4283,
    eps_inr: 13.5,
    total_debt_inr_cr: 53200,
    market_cap_inr_cr: 95000,
    evic_inr_cx: 148200,
    evic_inr_cr: 148200,
    employees: 6291,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 22.2,
    roe_pct: 11.4,
    roce_pct: 7.8,
    debt_equity_ratio: 2.44,
    interest_coverage_ratio: 2.8,
    dividend_yield_pct: 0.6,
    ebitda_margin_pct: 17.3,

    beta: 1.18,
    week52_high_inr: 434,
    week52_low_inr: 234,
    stock_price_inr: 300,

    promoter_holding_pct: 46.86,
    fii_holding_pct: 15.22,
    dii_holding_pct: 19.45,

    credit_rating: 'AA',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Positive',

    scope1_co2e: 20800000,
    scope2_co2e: 320000,
    scope3_co2e: 1200000,
    ghg_reporting_year: 2024, ghg_source: 'Tata Power Annual Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 372.6,
    carbon_neutral_target_year: 2045,
    sbti_committed: true,
    installed_capacity_gw: 14.7,
    re_capacity_gw: 4.9,

    dqs_default: 2, instrument_default: 'Listed Equity',
    physical_risk: 'High', transition_risk: 'Medium',
    country: 'India', state: 'Maharashtra',
    tags: ['BRSR-Core','Coal-Power','Renewable','SBTi-Committed'],
    notes: 'SBTi target: Net Zero by 2045; Mundra UMPP (4 GW coal) stranded asset; 1 lakh EV charging points; solar EPC arm (TP Solar)',
  },

  // ── MINING ────────────────────────────────────────────────────────────────
  {
    cin: 'L10101WB1973GOI028844',
    name: 'Coal India Ltd', shortName: 'Coal India',
    sector: 'Mining', subsector: 'Coal Mining',
    industry: 'Coal & Consumable Fuels',
    exchange: 'NSE/BSE', ticker: 'COALINDIA',
    nifty50: true, niftyIndex: ['NIFTY50','NIFTY100'],
    isin: 'INE522F01014',
    website: 'https://www.coalindia.in',
    founded_year: 1973, headquarters_city: 'Kolkata',
    description: "World's largest coal mining company (GoI 63.1%) producing ~780 MT coal/year. Dominates India's coal supply (>80% market share). Exploring diversification into solar energy.",

    revenue_inr_cr: 148673,
    ebitda_inr_cr: 40200,
    net_profit_inr_cr: 37369,
    eps_inr: 60.7,
    total_debt_inr_cr: 3800,
    market_cap_inr_cr: 280000,
    evic_inr_cr: 283800,
    employees: 283093,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 7.5,
    roe_pct: 59.2,
    roce_pct: 61.4,
    debt_equity_ratio: 0.04,
    interest_coverage_ratio: 95.0,
    dividend_yield_pct: 7.2,
    ebitda_margin_pct: 27.0,

    beta: 0.72,
    week52_high_inr: 496,
    week52_low_inr: 225,
    stock_price_inr: 455,

    promoter_holding_pct: 63.13,
    fii_holding_pct: 7.22,
    dii_holding_pct: 21.50,

    credit_rating: 'AAA',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    scope1_co2e: 62400000,
    scope2_co2e: 1800000,
    scope3_co2e: 855000000,
    ghg_reporting_year: 2024, ghg_source: 'Coal India Annual Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 432.5,
    carbon_neutral_target_year: null,
    sbti_committed: false,

    dqs_default: 2, instrument_default: 'Listed Equity',
    physical_risk: 'High', transition_risk: 'Very High',
    country: 'India', state: 'West Bengal',
    tags: ['PSU','BRSR-Core','High-Emitter','Coal-Mining','NIFTY50','Stranded-Risk'],
    notes: 'Scope 3 dominated by combustion of sold coal (~855 Mt CO2e); coal production target 1 Bt/year by FY26; 3 GW solar diversification plan',
  },

  // ── MATERIALS ─────────────────────────────────────────────────────────────
  {
    cin: 'L27102OR1907PLC000002',
    name: 'Tata Steel Ltd', shortName: 'Tata Steel',
    sector: 'Materials', subsector: 'Steel',
    industry: 'Steel',
    exchange: 'NSE/BSE', ticker: 'TATASTEEL',
    nifty50: true, niftyIndex: ['NIFTY50','NIFTY100'],
    isin: 'INE081A01020',
    website: 'https://www.tatasteel.com',
    founded_year: 1907, headquarters_city: 'Mumbai',
    description: "Global integrated steel producer with operations in India, UK (Port Talbot), Netherlands. Ranked 2nd in India (20 MTPA India capacity, 34 MTPA global). SBTi 1.5°C pathway committed.",

    revenue_inr_cr: 231441,
    ebitda_inr_cr: 17800,
    net_profit_inr_cr: 6509,
    eps_inr: 5.3,
    total_debt_inr_cr: 82000,
    market_cap_inr_cr: 130000,
    evic_inr_cr: 212000,
    employees: 78307,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 20.0,
    roe_pct: 6.1,
    roce_pct: 5.4,
    debt_equity_ratio: 0.75,
    interest_coverage_ratio: 2.9,
    dividend_yield_pct: 0.6,
    ebitda_margin_pct: 7.7,

    beta: 1.25,
    week52_high_inr: 184,
    week52_low_inr: 108,
    stock_price_inr: 166,

    promoter_holding_pct: 33.22,
    fii_holding_pct: 23.45,
    dii_holding_pct: 20.88,

    credit_rating: 'AA+',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    scope1_co2e: 34800000,
    scope2_co2e: 2800000,
    scope3_co2e: 12200000,
    ghg_reporting_year: 2024, ghg_source: 'Tata Steel Sustainability Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 163.2,
    carbon_neutral_target_year: 2045,
    sbti_committed: true,

    dqs_default: 2, instrument_default: 'Corporate Bond',
    physical_risk: 'Medium', transition_risk: 'High',
    country: 'India', state: 'Odisha',
    tags: ['BRSR-Core','High-Emitter','Steel','NIFTY50','SBTi-Committed'],
    notes: 'SBTi 30% intensity reduction by 2030 (2.3→1.6 tCO2/t steel); UK Port Talbot transition to Electric Arc Furnace (UK govt co-funding £500M); ESP aligned',
  },

  {
    cin: 'L27102MH1994PLC152925',
    name: 'JSW Steel Ltd', shortName: 'JSW Steel',
    sector: 'Materials', subsector: 'Steel',
    industry: 'Steel',
    exchange: 'NSE/BSE', ticker: 'JSWSTEEL',
    nifty50: true, niftyIndex: ['NIFTY50','NIFTY100'],
    isin: 'INE019A01038',
    website: 'https://www.jsw.in/steel',
    founded_year: 1982, headquarters_city: 'Mumbai',
    description: "India's largest steel company by capacity (28.5 MTPA India; target 50 MTPA by FY31). JSW Group flagship; expanding in green steel and EV ecosystems.",

    revenue_inr_cr: 168005,
    ebitda_inr_cr: 27100,
    net_profit_inr_cr: 13856,
    eps_inr: 57.2,
    total_debt_inr_cr: 73600,
    market_cap_inr_cr: 210000,
    evic_inr_cr: 283600,
    employees: 44789,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 15.2,
    roe_pct: 16.8,
    roce_pct: 12.4,
    debt_equity_ratio: 0.87,
    interest_coverage_ratio: 5.8,
    dividend_yield_pct: 0.5,
    ebitda_margin_pct: 16.1,

    beta: 1.20,
    week52_high_inr: 1006,
    week52_low_inr: 672,
    stock_price_inr: 875,

    promoter_holding_pct: 44.77,
    fii_holding_pct: 19.88,
    dii_holding_pct: 17.65,

    credit_rating: 'AA',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Positive',

    scope1_co2e: 28200000,
    scope2_co2e: 1800000,
    scope3_co2e: 9800000,
    ghg_reporting_year: 2024, ghg_source: 'JSW Steel Sustainability Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 178.6,
    carbon_neutral_target_year: 2050,
    sbti_committed: false,

    dqs_default: 3, instrument_default: 'Corporate Bond',
    physical_risk: 'Medium', transition_risk: 'High',
    country: 'India', state: 'Karnataka',
    tags: ['BRSR-Core','High-Emitter','Steel','NIFTY50'],
    notes: 'Net Zero 2050 target; green steel roadmap with DRI-EAF route; JSW Energy sister company building 20 GW RE for captive use',
  },

  {
    cin: 'L26940MH2000PLC128420',
    name: 'UltraTech Cement Ltd', shortName: 'UltraTech',
    sector: 'Materials', subsector: 'Cement',
    industry: 'Construction Materials',
    exchange: 'NSE/BSE', ticker: 'ULTRACEMCO',
    nifty50: true, niftyIndex: ['NIFTY50','NIFTY100'],
    isin: 'INE481G01011',
    website: 'https://www.ultratechcement.com',
    founded_year: 2000, headquarters_city: 'Mumbai',
    description: "India's largest (& world's 3rd largest ex-China) cement company. Capacity: 139.2 MTPA India + UAE. Aditya Birla Group flagship. Targeting Net Zero 2050 with SBTi-validated targets.",

    revenue_inr_cr: 68046,
    ebitda_inr_cr: 17400,
    net_profit_inr_cx: 11395,
    net_profit_inr_cr: 11395,
    eps_inr: 395.2,
    total_debt_inr_cr: 18200,
    market_cap_inr_cr: 290000,
    evic_inr_cr: 308200,
    employees: 21000,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 25.5,
    roe_pct: 15.4,
    roce_pct: 16.8,
    debt_equity_ratio: 0.22,
    interest_coverage_ratio: 18.5,
    dividend_yield_pct: 0.3,
    ebitda_margin_pct: 25.6,

    beta: 0.95,
    week52_high_inr: 10490,
    week52_low_inr: 7235,
    stock_price_inr: 9700,

    promoter_holding_pct: 59.28,
    fii_holding_pct: 15.22,
    dii_holding_pct: 14.88,

    credit_rating: 'AAA',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    scope1_co2e: 65200000,
    scope2_co2e: 2100000,
    scope3_co2e: 4700000,
    ghg_reporting_year: 2024, ghg_source: 'UltraTech Sustainability Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 1000.0,
    net_co2_intensity_kg_per_tcement: 569,
    carbon_neutral_target_year: 2050,
    sbti_committed: true,

    dqs_default: 2, instrument_default: 'Listed Equity',
    physical_risk: 'Medium', transition_risk: 'High',
    country: 'India', state: 'Maharashtra',
    tags: ['BRSR-Core','High-Emitter','Cement','NIFTY50','SBTi-Committed'],
    notes: 'SBTi net CO2 target: 399 kg/t cement by 2030 (from 569 baseline); 1 GW RE capacity by 2027; blended cement share 70%+; CCUS pilots underway',
  },

  {
    cin: 'L27020MH1958PLC011238',
    name: 'Hindalco Industries Ltd', shortName: 'Hindalco',
    sector: 'Materials', subsector: 'Aluminium',
    industry: 'Aluminium',
    exchange: 'NSE/BSE', ticker: 'HINDALCO',
    nifty50: true, niftyIndex: ['NIFTY50','NIFTY100'],
    isin: 'INE038A01020',
    website: 'https://www.hindalco.com',
    founded_year: 1958, headquarters_city: 'Mumbai',
    description: "World's largest aluminium rolling company (via Novelis subsidiary). Produces primary aluminium (1.3 MTPA India), copper, and specialty flat-rolled products. Aditya Birla Group.",

    revenue_inr_cr: 220560,
    ebitda_inr_cr: 22400,
    net_profit_inr_cr: 13146,
    eps_inr: 59.0,
    total_debt_inr_cr: 62300,
    market_cap_inr_cr: 135000,
    evic_inr_cr: 197300,
    employees: 37521,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 10.3,
    roe_pct: 12.8,
    roce_pct: 9.4,
    debt_equity_ratio: 0.56,
    interest_coverage_ratio: 6.8,
    dividend_yield_pct: 0.5,
    ebitda_margin_pct: 10.2,

    beta: 1.15,
    week52_high_inr: 668,
    week52_low_inr: 425,
    stock_price_inr: 600,

    promoter_holding_pct: 34.64,
    fii_holding_pct: 26.88,
    dii_holding_pct: 19.44,

    credit_rating: 'AA+',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    scope1_co2e: 42100000,
    scope2_co2e: 3800000,
    scope3_co2e: 15200000,
    ghg_reporting_year: 2024, ghg_source: 'Hindalco Sustainability Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 208.5,
    carbon_neutral_target_year: 2050,
    sbti_committed: true,

    dqs_default: 2, instrument_default: 'Listed Equity',
    physical_risk: 'Medium', transition_risk: 'High',
    country: 'India', state: 'Maharashtra',
    tags: ['BRSR-Core','High-Emitter','Aluminium','NIFTY50','SBTi-Committed'],
    notes: 'SBTi 30% absolute Scope 1+2 reduction by 2030; Novelis 75% recycled aluminium; electrolysis low-carbon roadmap; 960 MW captive RE',
  },

  // ── FINANCIALS ────────────────────────────────────────────────────────────
  {
    cin: 'L64190WB1955GOI022605',
    name: 'State Bank of India', shortName: 'SBI',
    sector: 'Financials', subsector: 'Commercial Banks',
    industry: 'Diversified Banks',
    exchange: 'NSE/BSE', ticker: 'SBIN',
    nifty50: true, niftyIndex: ['NIFTY50','NIFTYBANK','NIFTYPSUBANK'],
    isin: 'INE062A01020',
    website: 'https://www.sbi.co.in',
    founded_year: 1955, headquarters_city: 'Mumbai',
    description: "India's largest bank by assets (₹61 lakh Cr) and branch network (22,500+). Holds 23% market share in deposits. First Indian bank to publish TCFD-aligned climate risk report (2022).",

    revenue_inr_cr: 480000,     // Net Interest Income + Fee income (FY24)
    net_interest_income_inr_cr: 110074,
    ebitda_inr_cr: null,
    net_profit_inr_cr: 61077,
    eps_inr: 68.4,
    total_debt_inr_cr: 4920000, // Deposits + borrowings
    total_advances_inr_cr: 3804000,
    market_cap_inr_cr: 680000,
    evic_inr_cr: 720000,
    employees: 222374,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 11.1,
    roe_pct: 18.2,
    roce_pct: null,
    debt_equity_ratio: null,   // Banks use capital ratios
    crar_pct: 14.28,           // Capital to Risk Weighted Assets
    tier1_capital_pct: 11.53,
    gnpa_pct: 2.24,
    nnpa_pct: 0.57,
    net_interest_margin_pct: 3.40,
    dividend_yield_pct: 2.0,

    beta: 1.28,
    week52_high_inr: 912,
    week52_low_inr: 543,
    stock_price_inr: 761,

    promoter_holding_pct: 57.54,
    fii_holding_pct: 10.88,
    dii_holding_pct: 19.22,

    credit_rating: 'AAA',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    scope1_co2e: 82000,
    scope2_co2e: 380000,
    scope3_co2e: 0,
    ghg_reporting_year: 2024, ghg_source: 'SBI Annual Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 0.96,
    carbon_neutral_target_year: 2055,
    sbti_committed: false,

    dqs_default: 3, instrument_default: 'Listed Equity',
    physical_risk: 'Medium', transition_risk: 'Medium',
    country: 'India', state: 'Maharashtra',
    tags: ['PSU','BRSR-Core','Bank','PCAF-FI','NIFTY50'],
    notes: 'RBI climate risk pilot participant; green bonds ₹10,000 Cr issued; PCAF partnership for financed emissions measurement; portfolio carbon intensity reporting underway',
  },

  {
    cin: 'L65920MH1994PLC080618',
    name: 'HDFC Bank Ltd', shortName: 'HDFC Bank',
    sector: 'Financials', subsector: 'Commercial Banks',
    industry: 'Diversified Banks',
    exchange: 'NSE/BSE', ticker: 'HDFCBANK',
    nifty50: true, niftyIndex: ['NIFTY50','NIFTYBANK','NIFTYPVTBANK'],
    isin: 'INE040A01034',
    website: 'https://www.hdfcbank.com',
    founded_year: 1994, headquarters_city: 'Mumbai',
    description: "India's largest private sector bank by assets post HDFC Ltd merger (Jul 2023). Total assets ₹35 lakh Cr. 8,100+ branches. ESG index member: DJSI, MSCI ESG AA rated.",

    revenue_inr_cr: 310000,     // Total income FY24 (post-merger first full year)
    net_interest_income_inr_cr: 113000,
    ebitda_inr_cr: null,
    net_profit_inr_cr: 60812,
    eps_inr: 83.3,
    total_debt_inr_cr: 2850000, // Deposits + borrowings
    total_advances_inr_cr: 2480000,
    market_cap_inr_cr: 1380000,
    evic_inr_cr: 1480000,
    employees: 187878,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 18.4,
    roe_pct: 16.8,
    roce_pct: null,
    crar_pct: 18.8,
    tier1_capital_pct: 16.38,
    gnpa_pct: 1.24,
    nnpa_pct: 0.33,
    net_interest_margin_pct: 3.44,
    dividend_yield_pct: 1.1,

    beta: 0.92,
    week52_high_inr: 1795,
    week52_low_inr: 1364,
    stock_price_inr: 1533,

    promoter_holding_pct: 0.00,   // Widely held; Promoters exited post-merger
    fii_holding_pct: 50.12,
    dii_holding_pct: 19.88,

    credit_rating: 'AAA',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    scope1_co2e: 18000,
    scope2_co2e: 82000,
    scope3_co2e: 0,
    ghg_reporting_year: 2024, ghg_source: 'HDFC Bank ESG Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 0.32,
    carbon_neutral_target_year: null,
    sbti_committed: false,

    dqs_default: 3, instrument_default: 'Listed Equity',
    physical_risk: 'Low', transition_risk: 'Low',
    country: 'India', state: 'Maharashtra',
    tags: ['BRSR-Core','Bank','PCAF-FI','NIFTY50','MSCI-ESG-AA'],
    notes: 'MSCI ESG Rating AA; green finance framework ₹50,000 Cr; PCAF WACI calculation of loan portfolio underway; largest retail loan book in India',
  },

  {
    cin: 'L65190GJ1994PLC021012',
    name: 'ICICI Bank Ltd', shortName: 'ICICI Bank',
    sector: 'Financials', subsector: 'Commercial Banks',
    industry: 'Diversified Banks',
    exchange: 'NSE/BSE', ticker: 'ICICIBANK',
    nifty50: true, niftyIndex: ['NIFTY50','NIFTYBANK','NIFTYPVTBANK'],
    isin: 'INE090A01021',
    website: 'https://www.icicibank.com',
    founded_year: 1994, headquarters_city: 'Mumbai',
    description: "India's 2nd largest private sector bank by total assets (₹20 lakh Cr). Strong retail focus; subsidiaries in insurance (ICICI Prudential, ICICI Lombard), securities, and asset management.",

    revenue_inr_cr: 180000,
    net_interest_income_inr_cr: 77537,
    ebitda_inr_cr: null,
    net_profit_inr_cr: 44000,
    eps_inr: 63.2,
    total_debt_inr_cr: 1650000,
    total_advances_inr_cr: 1180000,
    market_cap_inr_cr: 920000,
    evic_inr_cr: 980000,
    employees: 144655,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 20.9,
    roe_pct: 19.4,
    crar_pct: 16.33,
    tier1_capital_pct: 15.22,
    gnpa_pct: 2.16,
    nnpa_pct: 0.42,
    net_interest_margin_pct: 4.53,
    dividend_yield_pct: 0.8,

    beta: 1.05,
    week52_high_inr: 1396,
    week52_low_inr: 893,
    stock_price_inr: 1324,

    promoter_holding_pct: 0.00,
    fii_holding_pct: 46.22,
    dii_holding_pct: 24.88,

    credit_rating: 'AAA',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    scope1_co2e: 14000,
    scope2_co2e: 68000,
    scope3_co2e: 0,
    ghg_reporting_year: 2024, ghg_source: 'ICICI Bank ESG Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 0.46,
    carbon_neutral_target_year: null,
    sbti_committed: false,

    dqs_default: 3, instrument_default: 'Listed Equity',
    physical_risk: 'Low', transition_risk: 'Low',
    country: 'India', state: 'Gujarat',
    tags: ['BRSR-Core','Bank','PCAF-FI','NIFTY50'],
    notes: 'TCFD-aligned reporting since FY2022; climate risk integration in credit underwriting; 100% RE electricity target for own operations',
  },

  {
    cin: 'L40101DL1986GOI024862',
    name: 'Power Finance Corporation Ltd', shortName: 'PFC',
    sector: 'Financials', subsector: 'Infrastructure Finance',
    industry: 'Diversified Financial Services',
    exchange: 'NSE/BSE', ticker: 'PFC',
    nifty50: false, niftyIndex: ['NIFTY100','NIFTYMIDCAP150'],
    isin: 'INE134E01011',
    website: 'https://www.pfcindia.com',
    founded_year: 1986, headquarters_city: 'New Delhi',
    description: "GoI-owned NBFC (55.9%) exclusively financing India's power sector. Loan book ₹9.6 lakh Cr (FY24). Finances thermal, renewable, and transmission projects. Consolidated with REC Ltd.",

    revenue_inr_cr: 82376,
    net_interest_income_inr_cr: 22800,
    ebitda_inr_cr: null,
    net_profit_inr_cr: 26461,
    eps_inr: 80.1,
    total_debt_inr_cr: 760000,
    total_advances_inr_cr: 960000,
    market_cap_inr_cr: 210000,
    evic_inr_cr: 240000,
    employees: 2402,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 7.9,
    roe_pct: 24.2,
    crar_pct: 17.85,
    gnpa_pct: 3.20,
    nnpa_pct: 0.94,
    net_interest_margin_pct: 3.48,
    dividend_yield_pct: 3.2,

    beta: 1.35,
    week52_high_inr: 740,
    week52_low_inr: 206,
    stock_price_inr: 635,

    promoter_holding_pct: 55.99,
    fii_holding_pct: 16.42,
    dii_holding_pct: 18.22,

    credit_rating: 'AAA',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    scope1_co2e: 3200,
    scope2_co2e: 12000,
    scope3_co2e: 0,
    ghg_reporting_year: 2024, ghg_source: 'PFC Annual Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 0.18,
    carbon_neutral_target_year: null,
    sbti_committed: false,

    dqs_default: 3, instrument_default: 'Corporate Bond',
    physical_risk: 'Low', transition_risk: 'Medium',
    country: 'India', state: 'Delhi',
    tags: ['PSU','BRSR-Core','PCAF-FI','Power-Sector-Lender'],
    notes: 'Greenfield RE lending surpassed thermal loans (FY24); green bonds USD 750M; facilitating India PM-KUSUM solar scheme financing; key PCAF financed emissions tracking needed',
  },

  // ── INDUSTRIALS ───────────────────────────────────────────────────────────
  {
    cin: 'L99999MH1946PLC004768',
    name: 'Larsen & Toubro Ltd', shortName: 'L&T',
    sector: 'Industrials', subsector: 'Engineering & Construction',
    industry: 'Construction & Engineering',
    exchange: 'NSE/BSE', ticker: 'LT',
    nifty50: true, niftyIndex: ['NIFTY50','NIFTY100'],
    isin: 'INE018A01030',
    website: 'https://www.larsentoubro.com',
    founded_year: 1938, headquarters_city: 'Mumbai',
    description: "India's largest engineering & construction conglomerate. Diversified across Infrastructure, Energy (green H2, nuclear), Hi-Tech, IT, Financial Services. Orderbook ₹4.9 lakh Cr (FY24).",

    revenue_inr_cr: 221115,
    ebitda_inr_cr: 22100,
    net_profit_inr_cr: 15401,
    eps_inr: 109.5,
    total_debt_inr_cr: 44200,
    market_cap_inr_cr: 460000,
    evic_inr_cr: 504200,
    employees: 497000,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 34.5,
    roe_pct: 15.2,
    roce_pct: 14.8,
    debt_equity_ratio: 0.20,
    interest_coverage_ratio: 16.2,
    dividend_yield_pct: 0.6,
    ebitda_margin_pct: 10.0,

    beta: 1.05,
    week52_high_inr: 3965,
    week52_low_inr: 2431,
    stock_price_inr: 3900,

    promoter_holding_pct: 0.00,   // Widely held; no single promoter
    fii_holding_pct: 27.88,
    dii_holding_pct: 30.42,

    credit_rating: 'AAA',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    scope1_co2e: 1800000,
    scope2_co2e: 280000,
    scope3_co2e: 8400000,
    ghg_reporting_year: 2024, ghg_source: 'L&T Sustainability Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 9.3,
    carbon_neutral_target_year: 2040,
    sbti_committed: true,

    dqs_default: 2, instrument_default: 'Listed Equity',
    physical_risk: 'Medium', transition_risk: 'Low',
    country: 'India', state: 'Maharashtra',
    tags: ['BRSR-Core','NIFTY50','Green-Project-Developer','SBTi-Committed'],
    notes: 'Green hydrogen electrolyser manufacturing (L&T Energy Hydrocarbon); nuclear engineering capabilities; RE project developer; MSCI ESG A rated',
  },

  // ── INFORMATION TECHNOLOGY ────────────────────────────────────────────────
  {
    cin: 'L22210MH1995PLC084781',
    name: 'Tata Consultancy Services Ltd', shortName: 'TCS',
    sector: 'Information Technology', subsector: 'IT Services',
    industry: 'IT Consulting & Other Services',
    exchange: 'NSE/BSE', ticker: 'TCS',
    nifty50: true, niftyIndex: ['NIFTY50','NIFTYIT'],
    isin: 'INE467B01029',
    website: 'https://www.tcs.com',
    founded_year: 1968, headquarters_city: 'Mumbai',
    description: "India's largest IT company. 150+ countries, 19 industry verticals. RE100 member; net zero operations since 2022. Parent Tata Sons holds 71.8%. $29.1 Bn revenue (FY24).",

    revenue_inr_cr: 240893,
    ebitda_inr_cr: 72100,
    net_profit_inr_cr: 46099,
    eps_inr: 126.7,
    total_debt_inr_cr: 2000,
    market_cap_inr_cr: 1460000,
    evic_inr_cr: 1462000,
    employees: 601546,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 31.6,
    roe_pct: 54.2,
    roce_pct: 66.8,
    debt_equity_ratio: 0.01,
    interest_coverage_ratio: 210.0,
    dividend_yield_pct: 1.6,
    ebitda_margin_pct: 29.9,

    beta: 0.60,
    week52_high_inr: 4255,
    week52_low_inr: 3118,
    stock_price_inr: 4018,

    promoter_holding_pct: 71.77,
    fii_holding_pct: 12.44,
    dii_holding_pct: 10.22,

    credit_rating: 'AAA',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    scope1_co2e: 120000,
    scope2_co2e: 85000,
    scope3_co2e: 0,
    ghg_reporting_year: 2024, ghg_source: 'TCS Sustainability Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 0.85,
    carbon_neutral_target_year: 2030,
    sbti_committed: true,

    dqs_default: 1, instrument_default: 'Listed Equity',
    physical_risk: 'Low', transition_risk: 'Very Low',
    country: 'India', state: 'Maharashtra',
    tags: ['BRSR-Core','Low-Emitter','NIFTY50','SBTi-Committed','Net-Zero-2030','RE100'],
    notes: 'Carbon neutral operations FY2022; Net Zero 2030 (SBTi validated); 100% RE electricity; GHG Scope 1+2 DQS-1 (third-party verified); 4th largest IT employer globally',
  },

  {
    cin: 'L85110KA1981PLC013115',
    name: 'Infosys Ltd', shortName: 'Infosys',
    sector: 'Information Technology', subsector: 'IT Services',
    industry: 'IT Consulting & Other Services',
    exchange: 'NSE/BSE', ticker: 'INFY',
    nifty50: true, niftyIndex: ['NIFTY50','NIFTYIT'],
    isin: 'INE009A01021',
    website: 'https://www.infosys.com',
    founded_year: 1981, headquarters_city: 'Bengaluru',
    description: "India's 2nd largest IT services firm. ~$18.6 Bn revenue (FY24). Carbon neutral since FY2020. Net Zero 2040 target. MSCI ESG AA; DJSI World index constituent.",

    revenue_inr_cr: 153670,
    ebitda_inr_cr: 38100,
    net_profit_inr_cr: 26248,
    eps_inr: 62.9,
    total_debt_inr_cr: 4200,
    market_cap_inr_cr: 750000,
    evic_inr_cr: 754200,
    employees: 317240,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 23.4,
    roe_pct: 32.2,
    roce_pct: 38.8,
    debt_equity_ratio: 0.04,
    interest_coverage_ratio: 98.0,
    dividend_yield_pct: 2.8,
    ebitda_margin_pct: 24.8,

    beta: 0.65,
    week52_high_inr: 1842,
    week52_low_inr: 1306,
    stock_price_inr: 1575,

    promoter_holding_pct: 14.81,
    fii_holding_pct: 32.88,
    dii_holding_pct: 20.44,

    credit_rating: 'AAA',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    scope1_co2e: 28000,
    scope2_co2e: 42000,
    scope3_co2e: 0,
    ghg_reporting_year: 2024, ghg_source: 'Infosys ESG Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 0.45,
    carbon_neutral_target_year: 2040,
    sbti_committed: true,

    dqs_default: 1, instrument_default: 'Listed Equity',
    physical_risk: 'Low', transition_risk: 'Very Low',
    country: 'India', state: 'Karnataka',
    tags: ['BRSR-Core','Low-Emitter','NIFTY50','SBTi-Committed','Carbon-Neutral','Net-Zero-2040'],
    notes: 'Carbon neutral since Apr 2020; SBTi 1.5°C target; 100% RE electricity globally; Infosys Green Initiative covers 50 Mn sqft campus; DJSI World 2024',
  },

  {
    cin: 'L32102KA1945PLC020800',
    name: 'Wipro Ltd', shortName: 'Wipro',
    sector: 'Information Technology', subsector: 'IT Services',
    industry: 'IT Consulting & Other Services',
    exchange: 'NSE/BSE', ticker: 'WIPRO',
    nifty50: true, niftyIndex: ['NIFTY50','NIFTYIT'],
    isin: 'INE075A01022',
    website: 'https://www.wipro.com',
    founded_year: 1945, headquarters_city: 'Bengaluru',
    description: "India's 3rd largest IT services firm. $11 Bn revenue FY24. Azim Premji Foundation holds 73% via trust. RE100 member; Net Zero 2040 target. MSCI ESG AA rated.",

    revenue_inr_cr: 89800,
    ebitda_inr_cr: 19600,
    net_profit_inr_cr: 11000,
    eps_inr: 20.8,
    total_debt_inr_cr: 8200,
    market_cap_inr_cr: 350000,
    evic_inr_cr: 358200,
    employees: 234054,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 21.8,
    roe_pct: 15.4,
    roce_pct: 18.8,
    debt_equity_ratio: 0.07,
    interest_coverage_ratio: 55.0,
    dividend_yield_pct: 1.2,
    ebitda_margin_pct: 21.8,

    beta: 0.72,
    week52_high_inr: 565,
    week52_low_inr: 390,
    stock_price_inr: 475,

    promoter_holding_pct: 72.91,
    fii_holding_pct: 5.22,
    dii_holding_pct: 11.88,

    credit_rating: 'AAA',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    scope1_co2e: 45000,
    scope2_co2e: 62000,
    scope3_co2e: 0,
    ghg_reporting_year: 2024, ghg_source: 'Wipro ESG Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 1.19,
    carbon_neutral_target_year: 2040,
    sbti_committed: true,

    dqs_default: 2, instrument_default: 'Listed Equity',
    physical_risk: 'Low', transition_risk: 'Very Low',
    country: 'India', state: 'Karnataka',
    tags: ['BRSR-Core','Low-Emitter','NIFTY50','SBTi-Committed','RE100','Net-Zero-2040'],
    notes: '100% RE electricity by FY2030; SBTi validated near-term targets; Wipro Earthian sustainability programme; MSCI ESG AA',
  },

  // ── CONSUMER DISCRETIONARY ────────────────────────────────────────────────
  {
    cin: 'L65990MH1945PLC004558',
    name: 'Mahindra & Mahindra Ltd', shortName: 'M&M',
    sector: 'Consumer Discretionary', subsector: 'Automobiles',
    industry: 'Automobile Manufacturers',
    exchange: 'NSE/BSE', ticker: 'M&M',
    nifty50: true, niftyIndex: ['NIFTY50','NIFTYAUTO'],
    isin: 'INE101A01026',
    website: 'https://www.mahindra.com',
    founded_year: 1945, headquarters_city: 'Mumbai',
    description: "India's leading SUV and tractor manufacturer. All new EV launches under BE / XEV series. EV sales: 44,000 units FY24. Farm Equipment sector; Mahindra Finance; M&M subsidiaries in hospitality & aerospace.",

    revenue_inr_cr: 146110,
    ebitda_inr_cr: 22400,
    net_profit_inr_cr: 10200,
    eps_inr: 84.6,
    total_debt_inr_cr: 27500,
    market_cap_inr_cr: 400000,
    evic_inr_cr: 427500,
    employees: 79694,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 27.4,
    roe_pct: 15.2,
    roce_pct: 14.8,
    debt_equity_ratio: 0.20,
    interest_coverage_ratio: 22.8,
    dividend_yield_pct: 0.7,
    ebitda_margin_pct: 15.3,

    beta: 0.95,
    week52_high_inr: 2255,
    week52_low_inr: 1399,
    stock_price_inr: 2000,

    promoter_holding_pct: 18.98,
    fii_holding_pct: 38.22,
    dii_holding_pct: 22.45,

    credit_rating: 'AAA',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    scope1_co2e: 1200000,
    scope2_co2e: 180000,
    scope3_co2e: 22000000,
    ghg_reporting_year: 2024, ghg_source: 'M&M Sustainability Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 9.5,
    carbon_neutral_target_year: 2040,
    sbti_committed: true,

    dqs_default: 2, instrument_default: 'Listed Equity',
    physical_risk: 'Medium', transition_risk: 'Medium',
    country: 'India', state: 'Maharashtra',
    tags: ['BRSR-Core','NIFTY50','EV-Transition','SBTi-Committed'],
    notes: 'SBTi 42% Scope 1+2 reduction by 2030; 5 born-electric SUVs launched FY25 (BE.05, XEV.9e); 100% EV for passenger vehicles by 2030; FY24 highest SUV market share 21.3%',
  },

  {
    cin: 'L34103DL1981PLC011375',
    name: 'Maruti Suzuki India Ltd', shortName: 'Maruti',
    sector: 'Consumer Discretionary', subsector: 'Automobiles',
    industry: 'Automobile Manufacturers',
    exchange: 'NSE/BSE', ticker: 'MARUTI',
    nifty50: true, niftyIndex: ['NIFTY50','NIFTYAUTO'],
    isin: 'INE585B01010',
    website: 'https://www.marutisuzuki.com',
    founded_year: 1981, headquarters_city: 'New Delhi',
    description: "India's largest passenger car manufacturer (42% market share). Suzuki Motor Corp holds 58.2%. Sold 2.1 Mn vehicles FY24. Expanding to EVs (first BEV 2025) and CNG/Hybrid portfolio.",

    revenue_inr_cr: 141794,
    ebitda_inr_cr: 21800,
    net_profit_inr_cr: 13488,
    eps_inr: 449.5,
    total_debt_inr_cr: 1800,
    market_cap_inr_cr: 435000,
    evic_inr_cr: 436800,
    employees: 22222,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 32.2,
    roe_pct: 18.8,
    roce_pct: 20.5,
    debt_equity_ratio: 0.01,
    interest_coverage_ratio: 145.0,
    dividend_yield_pct: 0.7,
    ebitda_margin_pct: 15.4,

    beta: 0.75,
    week52_high_inr: 13680,
    week52_low_inr: 9615,
    stock_price_inr: 13600,

    promoter_holding_pct: 58.19,
    fii_holding_pct: 18.22,
    dii_holding_pct: 14.88,

    credit_rating: 'AAA',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    scope1_co2e: 380000,
    scope2_co2e: 120000,
    scope3_co2e: 18000000,
    ghg_reporting_year: 2024, ghg_source: 'Maruti Suzuki Sustainability Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 3.4,
    carbon_neutral_target_year: null,
    sbti_committed: false,

    dqs_default: 3, instrument_default: 'Listed Equity',
    physical_risk: 'Medium', transition_risk: 'Medium',
    country: 'India', state: 'Delhi',
    tags: ['BRSR-Core','NIFTY50','ICE-Transition'],
    notes: "42% passenger vehicle market share FY24; first Maruti BEV planned 2025; CNG vehicle share 25%; Suzuki hybrid technology push; Scope 3 dominated by end-use vehicle emissions",
  },

  // ── CONSUMER STAPLES ──────────────────────────────────────────────────────
  {
    cin: 'L15140MH1933PLC002030',
    name: 'Hindustan Unilever Ltd', shortName: 'HUL',
    sector: 'Consumer Staples', subsector: 'Personal Products',
    industry: 'Personal Products',
    exchange: 'NSE/BSE', ticker: 'HINDUNILVR',
    nifty50: true, niftyIndex: ['NIFTY50'],
    isin: 'INE030A01027',
    website: 'https://www.hul.co.in',
    founded_year: 1933, headquarters_city: 'Mumbai',
    description: "India's largest FMCG company (Unilever 61.9% parent). 50+ brands, 1 Bn+ consumers, 28 categories. Net Zero by 2039; Positive Beauty; Climate & Nature Fund. DJSI India component.",

    revenue_inr_cr: 61000,
    ebitda_inr_cr: 15200,
    net_profit_inr_cr: 10191,
    eps_inr: 43.3,
    total_debt_inr_cr: 1000,
    market_cap_inr_cr: 590000,
    evic_inr_cr: 591000,
    employees: 21004,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 57.8,
    roe_pct: 20.2,
    roce_pct: 24.8,
    debt_equity_ratio: 0.00,
    interest_coverage_ratio: 310.0,
    dividend_yield_pct: 1.8,
    ebitda_margin_pct: 24.9,

    beta: 0.65,
    week52_high_inr: 2778,
    week52_low_inr: 2288,
    stock_price_inr: 2508,

    promoter_holding_pct: 61.90,
    fii_holding_pct: 13.88,
    dii_holding_pct: 13.45,

    credit_rating: 'AAA',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    scope1_co2e: 48000,
    scope2_co2e: 22000,
    scope3_co2e: 2800000,
    ghg_reporting_year: 2024, ghg_source: 'HUL Annual Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 1.15,
    carbon_neutral_target_year: 2039,
    sbti_committed: true,

    dqs_default: 1, instrument_default: 'Listed Equity',
    physical_risk: 'Low', transition_risk: 'Low',
    country: 'India', state: 'Maharashtra',
    tags: ['BRSR-Core','NIFTY50','SBTi-Committed','Net-Zero-2039','Water-Positive'],
    notes: 'SBTi 1.5°C target; 100% RE factories; Climate & Nature Fund; water positive (all factories); plastic packaging full recyclability by 2025; Compass ESG framework',
  },

  {
    cin: 'L16005WB1910PLC001985',
    name: 'ITC Ltd', shortName: 'ITC',
    sector: 'Consumer Staples', subsector: 'Tobacco/FMCG',
    industry: 'Tobacco',
    exchange: 'NSE/BSE', ticker: 'ITC',
    nifty50: true, niftyIndex: ['NIFTY50'],
    isin: 'INE154A01025',
    website: 'https://www.itcportal.com',
    founded_year: 1910, headquarters_city: 'Kolkata',
    description: "Diversified conglomerate: tobacco (70% profits), FMCG (Aashirvaad, Sunfeast), agri, hotels, paperboards. Carbon positive, water positive, solid waste recycling positive for 18+ years. Triple bottom line leader.",

    revenue_inr_cr: 75011,
    ebitda_inr_cr: 24200,
    net_profit_inr_cr: 20102,
    eps_inr: 16.1,
    total_debt_inr_cr: 2800,
    market_cap_inr_cr: 600000,
    evic_inr_cr: 602800,
    employees: 34783,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 29.8,
    roe_pct: 27.8,
    roce_pct: 30.2,
    debt_equity_ratio: 0.01,
    interest_coverage_ratio: 228.0,
    dividend_yield_pct: 3.4,
    ebitda_margin_pct: 32.3,

    beta: 0.62,
    week52_high_inr: 501,
    week52_low_inr: 393,
    stock_price_inr: 483,

    promoter_holding_pct: 0.00,   // Widely held; BAT 29.6% is largest non-promoter FII
    fii_holding_pct: 43.22,
    dii_holding_pct: 32.44,

    credit_rating: 'AAA',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    scope1_co2e: 180000,
    scope2_co2e: 45000,
    scope3_co2e: 4200000,
    ghg_reporting_year: 2024, ghg_source: 'ITC Sustainability Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 2.96,
    carbon_neutral_target_year: null,    // Already carbon positive
    sbti_committed: false,

    dqs_default: 1, instrument_default: 'Listed Equity',
    physical_risk: 'Medium', transition_risk: 'Low',
    country: 'India', state: 'West Bengal',
    tags: ['BRSR-Core','NIFTY50','Carbon-Positive','Water-Positive'],
    notes: 'Carbon Positive since 2007 (sequestration > emissions via afforestation); Water Positive since 2007; FMCG non-cigarettes revenue ₹22,000 Cr growing 10%+; Responsible Luxury Hotels',
  },

  // ── HEALTH CARE ───────────────────────────────────────────────────────────
  {
    cin: 'L24230GJ1993PLC019050',
    name: 'Sun Pharmaceutical Industries Ltd', shortName: 'Sun Pharma',
    sector: 'Health Care', subsector: 'Pharmaceuticals',
    industry: 'Pharmaceuticals',
    exchange: 'NSE/BSE', ticker: 'SUNPHARMA',
    nifty50: true, niftyIndex: ['NIFTY50'],
    isin: 'INE044A01036',
    website: 'https://www.sunpharma.com',
    founded_year: 1983, headquarters_city: 'Mumbai',
    description: "India's largest and world's 4th largest specialty generic pharmaceutical company. 100+ markets; US generics ~32% revenue; specialty branded pharma growing. Subsidiary: Ranbaxy (merged 2015).",

    revenue_inr_cr: 48006,
    ebitda_inr_cr: 12800,
    net_profit_inr_cr: 9539,
    eps_inr: 39.8,
    total_debt_inr_cr: 7400,
    market_cap_inr_cr: 455000,
    evic_inr_cr: 462400,
    employees: 43000,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 47.7,
    roe_pct: 16.8,
    roce_pct: 18.2,
    debt_equity_ratio: 0.10,
    interest_coverage_ratio: 48.0,
    dividend_yield_pct: 0.6,
    ebitda_margin_pct: 26.7,

    beta: 0.78,
    week52_high_inr: 1972,
    week52_low_inr: 1062,
    stock_price_inr: 1898,

    promoter_holding_pct: 54.48,
    fii_holding_pct: 18.22,
    dii_holding_pct: 15.88,

    credit_rating: 'AAA',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    scope1_co2e: 220000,
    scope2_co2e: 85000,
    scope3_co2e: 1200000,
    ghg_reporting_year: 2024, ghg_source: 'Sun Pharma Sustainability Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 6.35,
    carbon_neutral_target_year: null,
    sbti_committed: false,

    dqs_default: 3, instrument_default: 'Listed Equity',
    physical_risk: 'Low', transition_risk: 'Low',
    country: 'India', state: 'Gujarat',
    tags: ['BRSR-Core','NIFTY50'],
    notes: 'US FDA inspections remain key regulatory risk; specialty dermatology portfolio (Ilumya, Cequa) growing; increasing RE utilisation at manufacturing sites',
  },

  // ── REAL ESTATE ───────────────────────────────────────────────────────────
  {
    cin: 'L70101HR1963PLC032723',
    name: 'DLF Ltd', shortName: 'DLF',
    sector: 'Real Estate', subsector: 'Diversified Real Estate',
    industry: 'Real Estate Management & Development',
    exchange: 'NSE/BSE', ticker: 'DLF',
    nifty50: false, niftyIndex: ['NIFTY100'],
    isin: 'INE271C01023',
    website: 'https://www.dlf.in',
    founded_year: 1946, headquarters_city: 'Gurugram',
    description: "India's largest real estate developer by market cap. 335 Mn sqft of prime real estate delivered. Residential, commercial (DLF Cyber City), retail (malls). LEED-certified portfolio; CRREM aligned.",

    revenue_inr_cr: 6598,
    ebitda_inr_cr: 3100,
    net_profit_inr_cr: 4212,
    eps_inr: 17.0,
    total_debt_inr_cr: 21500,
    market_cap_inr_cr: 210000,
    evic_inr_cr: 231500,
    employees: 3922,
    data_as_of: 'FY2024', annual_report_year: 2024,

    pe_ratio: 49.9,
    roe_pct: 8.8,
    roce_pct: 6.4,
    debt_equity_ratio: 0.28,
    interest_coverage_ratio: 6.5,
    dividend_yield_pct: 0.5,
    ebitda_margin_pct: 47.0,

    beta: 1.35,
    week52_high_inr: 988,
    week52_low_inr: 424,
    stock_price_inr: 848,

    promoter_holding_pct: 74.08,
    fii_holding_pct: 12.88,
    dii_holding_pct: 7.22,

    credit_rating: 'AA+',
    credit_rating_agency: 'CRISIL',
    credit_outlook: 'Stable',

    scope1_co2e: 48000,
    scope2_co2e: 210000,
    scope3_co2e: 0,
    ghg_reporting_year: 2024, ghg_source: 'DLF Annual Report FY2024 / BRSR Core P6',
    ghg_intensity_tco2e_cr: 39.1,
    carbon_neutral_target_year: 2035,
    sbti_committed: false,

    dqs_default: 3, instrument_default: 'Listed Equity',
    physical_risk: 'High', transition_risk: 'Medium',
    country: 'India', state: 'Haryana',
    tags: ['BRSR-Core','Real-Estate','CRREM-Pathway'],
    notes: 'LEED certification: 28 Mn sqft commercial portfolio; CRREM pathway aligned; Net Zero operational buildings by 2035; DLF Cyber City 32 Mn sqft; luxury residential pipeline ₹1 lakh Cr pre-sales',
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Return a single company record by CIN */
export const getCompanyByCin = (cin) =>
  COMPANY_MASTER.find(c => c.cin === cin) || null;

/** Return a single company record by NSE/BSE ticker */
export const getCompanyByTicker = (ticker) =>
  COMPANY_MASTER.find(c => c.ticker === ticker.toUpperCase()) || null;

/**
 * Full-text search across name, shortName, ticker, sector, subsector, CIN.
 * Returns up to `limit` best matches, scored by match quality.
 */
export const searchCompanies = (query, limit = 10) => {
  if (!query || query.length < 1) return COMPANY_MASTER.slice(0, limit);
  const q = query.toLowerCase();
  return COMPANY_MASTER
    .map(c => {
      let score = 0;
      if (c.name.toLowerCase().startsWith(q)) score += 10;
      else if (c.name.toLowerCase().includes(q)) score += 6;
      if (c.shortName.toLowerCase().startsWith(q)) score += 8;
      else if (c.shortName.toLowerCase().includes(q)) score += 5;
      if (c.ticker.toLowerCase().startsWith(q)) score += 9;
      if (c.cin.toLowerCase().includes(q)) score += 7;
      if (c.sector.toLowerCase().includes(q)) score += 3;
      if (c.subsector.toLowerCase().includes(q)) score += 2;
      return { ...c, _score: score };
    })
    .filter(c => c._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(({ _score, ...c }) => c);
};

/** Filter companies by GICS sector */
export const getCompaniesBySector = (sector) =>
  COMPANY_MASTER.filter(c => c.sector === sector);

/** Filter companies by tag */
export const getCompaniesByTag = (tag) =>
  COMPANY_MASTER.filter(c => c.tags && c.tags.includes(tag));

/** Filter companies by NIFTY index membership */
export const getCompaniesByIndex = (index) =>
  COMPANY_MASTER.filter(c => c.niftyIndex && c.niftyIndex.includes(index));

/** Get all NIFTY50 constituents in the master */
export const getNifty50Companies = () =>
  COMPANY_MASTER.filter(c => c.nifty50);

// ─────────────────────────────────────────────────────────────────────────────
// DERIVED CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const SECTORS = [...new Set(COMPANY_MASTER.map(c => c.sector))];

export const ALL_TAGS = [...new Set(COMPANY_MASTER.flatMap(c => c.tags || []))].sort();

export const CREDIT_RATINGS = ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB'];

/** High-emitter sectors requiring DQS ≤ 2 for PCAF compliance */
export const HIGH_EMITTER_SECTORS = ['Energy', 'Utilities', 'Mining', 'Materials'];

/** Financial institution sectors where financed emissions methodology applies */
export const FI_SECTORS = ['Financials'];

/**
 * Summary stats for dashboard KPI cards
 */
export const getMasterStats = () => ({
  total_companies: COMPANY_MASTER.length,
  nifty50_count: COMPANY_MASTER.filter(c => c.nifty50).length,
  high_emitters: COMPANY_MASTER.filter(c => c.tags?.includes('High-Emitter')).length,
  sbti_committed: COMPANY_MASTER.filter(c => c.sbti_committed).length,
  with_scope1: COMPANY_MASTER.filter(c => c.scope1_co2e > 0).length,
  avg_dqs: (COMPANY_MASTER.reduce((s, c) => s + c.dqs_default, 0) / COMPANY_MASTER.length).toFixed(1),
  total_market_cap_inr_cr: COMPANY_MASTER.reduce((s, c) => s + (c.market_cap_inr_cr || 0), 0),
  sectors: SECTORS.length,
});
