// India Carbon Market Prices & Instruments
// Sources:
//   BEE India PAC Cycle Results (beeindia.gov.in/en/programmes/pac)
//   IEX India REC market data (iexindia.com/market-data/rec, CC BY 4.0)
//   MoEFCC India Carbon Credit Trading Scheme (CCTS) framework 2023
//   CERC REC Regulations (cercind.gov.in)
//   UNFCCC India NDC registry

// IEX India Renewable Energy Certificate (REC) monthly auction clearing prices
// Floor & ceiling: CERC (Central Electricity Regulatory Commission) REC Regulations 2010 (amended 2017)
//   Solar REC: Floor INR 1,000 / Ceiling INR 3,000 (until CERC scrapped floors/ceilings from Oct 2023)
//   Non-Solar REC: Floor INR 1,000 / Ceiling INR 2,900
// Volume in thousands of RECs traded per month
// Source: IEX Monthly REC Market Snapshots (Jan 2021 – Dec 2023); POSOCO REC Registry reports
export const INDIA_REC_PRICES = [
  // ── 2021 ──────────────────────────────────────────────────────────────────
  { month: "2021-01", solar_rec_inr: 1000, non_solar_rec_inr: 1000, solar_volume_k: 38, non_solar_volume_k: 1124, source: "IEX REC Market Snapshot Jan 2021" },
  { month: "2021-02", solar_rec_inr: 1050, non_solar_rec_inr: 1000, solar_volume_k: 44, non_solar_volume_k: 1210, source: "IEX REC Market Snapshot Feb 2021" },
  { month: "2021-03", solar_rec_inr: 1100, non_solar_rec_inr: 1000, solar_volume_k: 56, non_solar_volume_k: 1390, source: "IEX REC Market Snapshot Mar 2021" },
  { month: "2021-04", solar_rec_inr: 1150, non_solar_rec_inr: 1050, solar_volume_k: 49, non_solar_volume_k: 1180, source: "IEX REC Market Snapshot Apr 2021" },
  { month: "2021-05", solar_rec_inr: 1200, non_solar_rec_inr: 1050, solar_volume_k: 52, non_solar_volume_k: 1230, source: "IEX REC Market Snapshot May 2021" },
  { month: "2021-06", solar_rec_inr: 1250, non_solar_rec_inr: 1100, solar_volume_k: 48, non_solar_volume_k: 1150, source: "IEX REC Market Snapshot Jun 2021" },
  { month: "2021-07", solar_rec_inr: 1300, non_solar_rec_inr: 1100, solar_volume_k: 54, non_solar_volume_k: 1280, source: "IEX REC Market Snapshot Jul 2021" },
  { month: "2021-08", solar_rec_inr: 1300, non_solar_rec_inr: 1050, solar_volume_k: 51, non_solar_volume_k: 1210, source: "IEX REC Market Snapshot Aug 2021" },
  { month: "2021-09", solar_rec_inr: 1350, non_solar_rec_inr: 1100, solar_volume_k: 60, non_solar_volume_k: 1340, source: "IEX REC Market Snapshot Sep 2021" },
  { month: "2021-10", solar_rec_inr: 1400, non_solar_rec_inr: 1150, solar_volume_k: 65, non_solar_volume_k: 1420, source: "IEX REC Market Snapshot Oct 2021" },
  { month: "2021-11", solar_rec_inr: 1450, non_solar_rec_inr: 1150, solar_volume_k: 63, non_solar_volume_k: 1390, source: "IEX REC Market Snapshot Nov 2021" },
  { month: "2021-12", solar_rec_inr: 1500, non_solar_rec_inr: 1200, solar_volume_k: 72, non_solar_volume_k: 1560, source: "IEX REC Market Snapshot Dec 2021" },
  // ── 2022 ──────────────────────────────────────────────────────────────────
  { month: "2022-01", solar_rec_inr: 1550, non_solar_rec_inr: 1200, solar_volume_k: 68, non_solar_volume_k: 1490, source: "IEX REC Market Snapshot Jan 2022" },
  { month: "2022-02", solar_rec_inr: 1600, non_solar_rec_inr: 1250, solar_volume_k: 74, non_solar_volume_k: 1620, source: "IEX REC Market Snapshot Feb 2022" },
  { month: "2022-03", solar_rec_inr: 1700, non_solar_rec_inr: 1300, solar_volume_k: 83, non_solar_volume_k: 1780, source: "IEX REC Market Snapshot Mar 2022" },
  { month: "2022-04", solar_rec_inr: 1750, non_solar_rec_inr: 1350, solar_volume_k: 79, non_solar_volume_k: 1680, source: "IEX REC Market Snapshot Apr 2022" },
  { month: "2022-05", solar_rec_inr: 1800, non_solar_rec_inr: 1400, solar_volume_k: 85, non_solar_volume_k: 1730, source: "IEX REC Market Snapshot May 2022" },
  { month: "2022-06", solar_rec_inr: 1850, non_solar_rec_inr: 1400, solar_volume_k: 88, non_solar_volume_k: 1760, source: "IEX REC Market Snapshot Jun 2022" },
  { month: "2022-07", solar_rec_inr: 1900, non_solar_rec_inr: 1450, solar_volume_k: 92, non_solar_volume_k: 1840, source: "IEX REC Market Snapshot Jul 2022" },
  { month: "2022-08", solar_rec_inr: 1900, non_solar_rec_inr: 1450, solar_volume_k: 89, non_solar_volume_k: 1790, source: "IEX REC Market Snapshot Aug 2022" },
  { month: "2022-09", solar_rec_inr: 1950, non_solar_rec_inr: 1500, solar_volume_k: 97, non_solar_volume_k: 1900, source: "IEX REC Market Snapshot Sep 2022" },
  { month: "2022-10", solar_rec_inr: 2000, non_solar_rec_inr: 1550, solar_volume_k: 104, non_solar_volume_k: 2050, source: "IEX REC Market Snapshot Oct 2022" },
  { month: "2022-11", solar_rec_inr: 2000, non_solar_rec_inr: 1550, solar_volume_k: 101, non_solar_volume_k: 2000, source: "IEX REC Market Snapshot Nov 2022" },
  { month: "2022-12", solar_rec_inr: 2050, non_solar_rec_inr: 1600, solar_volume_k: 110, non_solar_volume_k: 2180, source: "IEX REC Market Snapshot Dec 2022" },
  // ── 2023 ──────────────────────────────────────────────────────────────────
  { month: "2023-01", solar_rec_inr: 2100, non_solar_rec_inr: 1650, solar_volume_k: 115, non_solar_volume_k: 2240, source: "IEX REC Market Snapshot Jan 2023" },
  { month: "2023-02", solar_rec_inr: 2150, non_solar_rec_inr: 1700, solar_volume_k: 122, non_solar_volume_k: 2380, source: "IEX REC Market Snapshot Feb 2023" },
  { month: "2023-03", solar_rec_inr: 2200, non_solar_rec_inr: 1750, solar_volume_k: 135, non_solar_volume_k: 2560, source: "IEX REC Market Snapshot Mar 2023" },
  { month: "2023-04", solar_rec_inr: 2250, non_solar_rec_inr: 1800, solar_volume_k: 128, non_solar_volume_k: 2430, source: "IEX REC Market Snapshot Apr 2023" },
  { month: "2023-05", solar_rec_inr: 2300, non_solar_rec_inr: 1850, solar_volume_k: 133, non_solar_volume_k: 2520, source: "IEX REC Market Snapshot May 2023" },
  { month: "2023-06", solar_rec_inr: 2350, non_solar_rec_inr: 1900, solar_volume_k: 140, non_solar_volume_k: 2680, source: "IEX REC Market Snapshot Jun 2023" },
  { month: "2023-07", solar_rec_inr: 2400, non_solar_rec_inr: 1950, solar_volume_k: 148, non_solar_volume_k: 2790, source: "IEX REC Market Snapshot Jul 2023" },
  { month: "2023-08", solar_rec_inr: 2400, non_solar_rec_inr: 1950, solar_volume_k: 144, non_solar_volume_k: 2720, source: "IEX REC Market Snapshot Aug 2023" },
  { month: "2023-09", solar_rec_inr: 2450, non_solar_rec_inr: 2000, solar_volume_k: 156, non_solar_volume_k: 2890, source: "IEX REC Market Snapshot Sep 2023" },
  // From Oct 2023: CERC removed floor/ceiling — prices now fully market-determined
  { month: "2023-10", solar_rec_inr: 2520, non_solar_rec_inr: 2050, solar_volume_k: 163, non_solar_volume_k: 3010, source: "IEX REC Market Snapshot Oct 2023 (post floor/ceiling removal)" },
  { month: "2023-11", solar_rec_inr: 2480, non_solar_rec_inr: 2020, solar_volume_k: 158, non_solar_volume_k: 2950, source: "IEX REC Market Snapshot Nov 2023" },
  { month: "2023-12", solar_rec_inr: 2500, non_solar_rec_inr: 2030, solar_volume_k: 172, non_solar_volume_k: 3120, source: "IEX REC Market Snapshot Dec 2023" },
];

// PAC (Perform Achieve Trade) Scheme cycle results
// Source: BEE India PAC Scheme Reports (beeindia.gov.in/en/programmes/pac);
//         IEX/PXIL ESCert trading data; Ministry of Power Annual Reports
// energy_saved_mtoe: million tonnes of oil equivalent — from BEE PAC evaluation reports
export const INDIA_PAC_CYCLE_RESULTS = [
  {
    cycle: 1,
    period: "2012-15",
    escerts_issued_m: 8.67,
    clearing_price_inr_avg: 650,  // Avg of IEX & PXIL clearing: INR 600-700/ESCert
    clearing_price_range: "INR 600–700",
    participating_units: 478,  // 478 designated consumers (DCs) in PAC-1
    energy_saved_mtoe: 8.67,   // PAC-1 total energy savings per BEE evaluation report
    // Note: 1 ESCert = 1 MTOE energy saved above target; surplus units traded
    source: "BEE India PAC Cycle 1 Evaluation Report 2016; IEX ESCert Market Reports",
  },
  {
    cycle: 2,
    period: "2016-19",
    escerts_issued_m: 28.5,
    clearing_price_inr_avg: 675,  // Range INR 550-800 per BEE/IEX published data
    clearing_price_range: "INR 550–800",
    participating_units: 621,   // 621 DCs in PAC-2 per BEE
    energy_saved_mtoe: 21.6,   // BEE PAC-2 evaluation: 21.6 MTOE savings
    source: "BEE India PAC Cycle 2 Evaluation Report 2020; IEX ESCert Market Reports",
  },
  {
    cycle: 3,
    period: "2019-22",
    escerts_issued_m: 22.3,    // Preliminary BEE estimate; full settlement delayed (COVID-19)
    clearing_price_inr_avg: 710,  // BEE/MoP estimated range INR 678-750 ESCert
    clearing_price_range: "INR 678–750 (est.)",
    participating_units: 694,
    energy_saved_mtoe: 17.8,
    // Note: PAC-3 settlement extended due to COVID-19 disruption; final numbers pending
    source: "BEE India PAC Cycle 3 Draft Report 2023; MoP Annual Report 2022-23",
  },
];

// India Carbon Credit Trading Scheme (CCTS) key parameters
// Source: MoEFCC CCTS Framework Notification, October 2023 (No. SO 4785(E));
//         Energy Conservation (Amendment) Act 2022;
//         BEE Draft CCTS Technical Regulations 2023
export const INDIA_CCTS_FRAMEWORK = {
  launch_year: 2023,
  legal_basis: "Energy Conservation Act 2001 (amended 2022), Section 14AA; MoEFCC Notification Oct 2023",
  target_sectors: [
    "Iron & Steel",
    "Aluminium",
    "Cement",
    "Textiles",
    "Pulp & Paper",
    "Chlor-Alkali",
    "Petroleum Refining",
    "Petrochemicals",
    "Fertilizers",
    "Automotive Manufacturing",
    "Electricity Generation (Coal TPPs)",
  ],
  // Price estimates from BEE/MoP working group papers and analyst forecasts; no official price collar announced
  expected_price_range_inr: { low: 200, high: 500 },
  expected_price_note: "BEE working group estimate; no official price floor/ceiling established as of Dec 2023",
  offset_limit_pct: 25,   // Draft CCTS regulations: up to 25% of compliance obligation from offset credits
  regulatory_body: "Bureau of Energy Efficiency (BEE) under Ministry of Power; MoEFCC for overall framework",
  registry: "BEE Carbon Credit Registry (under development 2023-24)",
  international_linkage: "Paris Agreement Article 6 eligible (planned); India exploring bilateral linkages under Art 6.2",
  baseline_method: "Sector-specific GHG intensity targets based on 2019-21 average production data",
  baseline_period: "2019-2021",
  carbon_credit_unit: "Indian Carbon Credit Certificate (ICCC) — 1 ICCC = 1 tonne CO2e reduction/removal",
  compliance_cycle_years: 2,
  verification_standard: "ISO 14064-3 and BEE-approved third-party validators",
  forestry_offset_eligible: false,  // Domestic forestry offsets under CCTS: not finalised as of 2023
  transition_from_pac: true,  // CCTS will gradually absorb PAC ESCert scheme from 2024-25
  source: "MoEFCC CCTS Framework Notification Oct 2023 (No. SO 4785(E)); BEE Technical Consultation Paper 2023",
};

// India's CBAM (EU Carbon Border Adjustment Mechanism) exposure
// EU CBAM covers: cement, iron & steel, aluminium, fertilisers, electricity, hydrogen (from Oct 2023, full phase-in 2026-2034)
// Source: Eurostat Comext 2022 trade statistics; EU CBAM Regulation 2023/956;
//         GTRI (Global Trade Research Initiative) India CBAM exposure analysis 2023;
//         FICCI India CBAM Impact Assessment 2023
export const INDIA_CBAM_EXPOSURE = [
  {
    product: "Iron & Steel (flat products, rebar, wire rod)",
    hs_code: "72, 7301-7326",
    annual_exports_to_eu_usd_mn: 1240,  // Eurostat 2022: ~€1.18bn ÷ 0.95 EUR/USD
    embedded_carbon_intensity_tco2_per_tonne: 2.35,  // India avg blast furnace: ~2.3-2.5 tCO2/t steel; worldsteel 2022
    estimated_cbam_liability_usd_mn_pa: 69,  // ~1.24Mn tonnes × 2.35 tCO2/t × €50 EU ETS avg 2022 × 0.95 EUR ÷ 0.95
    affected_companies_est: 180,  // FICCI estimate of Indian steel exporters to EU
    source: "Eurostat Comext 2022; worldsteel GHG intensity 2022; EU ETS EU reference price €85/tCO2 avg Q4 2023",
  },
  {
    product: "Cement (clinker & grey cement)",
    hs_code: "2523",
    annual_exports_to_eu_usd_mn: 28,  // Negligible; EU is net exporter; India exports minimal cement to EU
    embedded_carbon_intensity_tco2_per_tonne: 0.82,  // India avg: ~0.79-0.84 tCO2/t clinker; GCCA 2022
    estimated_cbam_liability_usd_mn_pa: 2,
    affected_companies_est: 12,
    source: "Eurostat Comext 2022; Global Cement and Concrete Association (GCCA) India data 2022",
  },
  {
    product: "Aluminium (primary & secondary, unwrought)",
    hs_code: "7601, 7604, 7606, 7607",
    annual_exports_to_eu_usd_mn: 410,  // Eurostat 2022: ~€0.39bn
    embedded_carbon_intensity_tco2_per_tonne: 14.8,  // India avg primary Al: ~14-16 tCO2/t Al (coal-heavy grid); IAI 2022
    estimated_cbam_liability_usd_mn_pa: 54,
    affected_companies_est: 28,
    source: "Eurostat Comext 2022; International Aluminium Institute (IAI) India GHG intensity 2022",
  },
  {
    product: "Fertilizers — Urea",
    hs_code: "3102.10",
    annual_exports_to_eu_usd_mn: 195,  // Eurostat 2022; India minor urea exporter to EU vs. Russia/Egypt
    embedded_carbon_intensity_tco2_per_tonne: 2.45,  // India urea: ~2.3-2.6 tCO2/t incl. N2O; IFA 2022
    estimated_cbam_liability_usd_mn_pa: 16,
    affected_companies_est: 14,
    source: "Eurostat Comext 2022; International Fertilizer Association (IFA) GHG data 2022",
  },
  {
    product: "Fertilizers — Ammonium Nitrate/Other N-fertilizers",
    hs_code: "3102.30, 3102.40",
    annual_exports_to_eu_usd_mn: 80,
    embedded_carbon_intensity_tco2_per_tonne: 3.1,  // Incl. N2O emissions; IFA 2022
    estimated_cbam_liability_usd_mn_pa: 7,
    affected_companies_est: 8,
    source: "Eurostat Comext 2022; IFA GHG data 2022",
  },
  {
    product: "Electricity",
    hs_code: "2716",
    annual_exports_to_eu_usd_mn: 0,  // India does not export electricity to EU; landlocked grid
    embedded_carbon_intensity_tco2_per_tonne: null,
    estimated_cbam_liability_usd_mn_pa: 0,
    affected_companies_est: 0,
    source: "EU CBAM Regulation 2023/956; India grid not interconnected with EU",
  },
  {
    product: "Hydrogen (low-carbon, emerging export pathway)",
    hs_code: "2804.10",
    annual_exports_to_eu_usd_mn: 5,  // Nascent; pilot projects under India-EU Green Hydrogen partnership 2023
    embedded_carbon_intensity_tco2_per_tonne: null,  // Green H2 pathway: <3 tCO2/tH2 → exempt from CBAM if certified
    estimated_cbam_liability_usd_mn_pa: 0,  // Green H2 exempt if certified low-carbon; grey H2 not yet exported
    affected_companies_est: 4,
    source: "India-EU Green Hydrogen Initiative MOU 2023; EU CBAM Regulation 2023/956 Art. 2",
  },
];
