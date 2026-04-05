/**
 * Module Guides — In-Application Guidance Data
 * 108 modules from Sprint CA through CX
 * Each: title, epCode, sprint, description, calculationEngine, dataPoints[], userInteraction[], references[]
 */

function g(title, epCode, sprint, description, calc, dataPoints, steps, refs) {
  return {
    title, epCode, sprint, description,
    calculationEngine: calc,
    dataPoints: dataPoints.map(d => typeof d === 'string' ? { name: d, interpretation: '' } : d),
    userInteraction: steps,
    references: refs,
  };
}

function ce(methodology, formula, standards, brief) {
  return { methodology, formula, standards, brief };
}

function dp(name, value, formula, source, interpretation) {
  return { name, value: value || undefined, formula: formula || undefined, source, interpretation };
}

export const MODULE_GUIDES = {
  // ═══════════════════════════════════════════════════════════════════════
  // SPRINT CA — Transition Risk DCF, Stranded Assets & Tech Displacement
  // ═══════════════════════════════════════════════════════════════════════
  '/transition-risk-dcf': g(
    'Transition Risk DCF Engine', 'EP-CA1', 'CA',
    'DCF impairment engine for 8 portfolio assets under 5 NGFS scenarios. Computes climate-adjusted WACC, carbon cost pass-through in cash flows, NPV impairment waterfall, and stranded year identification.',
    ce('Climate-adjusted DCF with carbon cost overlay',
      'WACC_adj = WACC_base + \u03b2_carbon \u00d7 P_carbon(t=5)',
      ['NGFS Phase 5', 'IAS 36', 'ISSB S2'],
      'Carbon price trajectories under 5 NGFS scenarios feed into DCF cash flow projections. WACC is adjusted by a carbon beta (\u03b2_carbon) calibrated from cross-sectional regression of EV/EBITDA on carbon intensity. Carbon cost = Emissions(t) \u00d7 CarbonPrice(t) \u00d7 (1-PassThroughRate). Stranded year = first year where cumulative NPV < 0.'
    ),
    [
      dp('Carbon Price (NZ2050, 2030)', '\u20ac150/tCO\u2082', 'P(t) = P\u2080\u00b7exp(g\u00b7t)\u00b7[1+\u03b1\u00b7sin(2\u03c0t/T)]', 'NGFS Phase 5', 'Deterministic carbon price trajectory under Net Zero 2050 scenario'),
      dp('WACC Adjustment', '+50-300bps', '\u03b2_carbon \u00d7 P_carbon(t=5)', 'Cross-sectional regression', 'Additional cost of capital reflecting carbon risk exposure'),
      dp('NPV Impairment', '15-45%', 'NPV_adj / NPV_base - 1', 'DCF model', 'Percentage decline in asset value due to carbon costs and WACC adjustment'),
      dp('Stranded Year', '2028-2042', 'First t where cumulative NPV < 0', 'Model output', 'Year when the asset becomes economically unviable under given scenario'),
      dp('Pass-Through Rate', '40-70%', 'Sector-specific', 'Company filings', 'Fraction of carbon costs passed to customers (energy sector: 60-70%)'),
    ],
    ['Select asset and NGFS scenario from dropdowns', 'Carbon Prices tab shows 5 trajectory curves with interactive horizon', 'DCF Engine tab computes base vs climate-adjusted NPV with waterfall chart', 'Portfolio Exposure aggregates impairment across all 8 assets', 'Stranded CAPEX identifies the year when NPV turns negative', 'Scenario Comparison shows impairment % side-by-side across all 5 scenarios'],
    ['NGFS Phase 5 Climate Scenarios', 'IAS 36 Impairment Testing', 'ISSB IFRS S2 Climate Disclosure', 'IPCC AR6 Carbon Budget']
  ),

  '/stranded-asset-analyzer': g(
    'Stranded Asset Analyzer', 'EP-CA2', 'CA',
    'Stranded asset write-down schedule with exponential decay model, residual value curves using half-life decay, 8-sector stranded asset matrix, and remediation pathways for converting stranded assets to productive use.',
    ce('Exponential decay write-down model',
      'WriteDown(t) = InitialValue \u00d7 StrandedPct \u00d7 (1 - exp(-\u03bb\u00b7t))',
      ['Carbon Tracker', 'IAS 36', 'NGFS'],
      'Each sector has a stranded percentage per NGFS scenario. The write-down schedule follows exponential decay with sector-specific lambda (\u03bb). Residual value = InitialValue \u00d7 exp(-ln(2)/HalfLife \u00d7 t). Remediation pathways estimate conversion CapEx and IRR for repurposing (e.g., coal\u2192battery storage).'
    ),
    [
      dp('Stranded %', '12-68%', 'Sector \u00d7 Scenario matrix', 'Carbon Tracker', 'Percentage of sector assets at risk of stranding under given scenario'),
      dp('Write-Down Half-Life', '5-20yr', 'Sector-specific', 'Model calibration', 'Time for residual value to decline by 50%'),
      dp('Remediation IRR', '8-22%', 'Conversion CapEx model', 'Sector studies', 'Internal rate of return on converting stranded assets to green use'),
    ],
    ['Select sector and scenario to view write-down schedule', 'Residual Value Curves show half-life decay per sector', 'Bubble Map visualizes exposure by sector size and stranded percentage', 'Remediation Pathways show conversion options with CapEx and IRR'],
    ['Carbon Tracker Stranded Assets Report', 'IAS 36 Impairment of Assets', 'NGFS Phase 5 Scenarios']
  ),

  '/tech-displacement-modeler': g(
    'Technology Displacement Modeler', 'EP-CA3', 'CA',
    'S-curve technology adoption model with Wright\'s Law learning curves for 6 clean technologies. Includes cost crossover year calculation, job displacement vs. green job creation, and scenario sensitivity.',
    ce('Logistic S-curve + Wright\'s Law learning',
      'f(t) = L / (1 + exp(-k(t - t_mid))); LCOE(t) = LCOE\u2080 \u00d7 (1-rate)^t',
      ['IEA WEO', 'IRENA', 'BNEF'],
      'Adoption follows a logistic S-curve with technology-specific parameters (L=maximum penetration, k=steepness, t_mid=inflection year). Cost decline follows Wright\'s Law: each doubling of cumulative production reduces cost by the learning rate (solar 20-25%, wind 15-18%, batteries 18-22%). Crossover year = when new tech LCOE < incumbent.'
    ),
    [
      dp('Solar PV Learning Rate', '20-25%', 'LCOE\u2080 \u00d7 (1-0.22)^t', 'IRENA', 'Cost reduction per doubling of cumulative capacity'),
      dp('EV Cost Parity', '2025-2027', 'TCO crossover vs ICE', 'BNEF EV Outlook', 'Year when EV total cost of ownership equals internal combustion'),
      dp('Green H\u2082 Parity', '2028-2032', 'Electrolyzer learning + RE cost', 'Hydrogen Council', 'Year when green hydrogen cost matches gray hydrogen'),
      dp('Job Displacement', 'Net positive by 2030', 'Green jobs created - fossil jobs lost', 'ILO/IRENA', 'Net employment impact of technology transition'),
    ],
    ['Select technology from 6 options (Solar, Wind, EV, Heat Pump, Green H\u2082, DAC)', 'S-Curve tab shows adoption trajectory under selected scenario', 'Cost Learning Curves compare LCOE trajectories', 'Disruption Timeline marks crossover years', 'Job Transition shows displacement vs creation balance'],
    ['IEA Net Zero by 2050 Roadmap', 'IRENA Renewable Cost Database', 'BNEF New Energy Outlook', 'Wright\'s Law (1936)']
  ),

  // ═══════════════════════════════════════════════════════════════════════
  // SPRINT CB — Sector Scorecard, Just Transition & Policy Impact
  // ═══════════════════════════════════════════════════════════════════════
  '/sector-transition-scorecard': g(
    'Sector Transition Scorecard', 'EP-CB1', 'CB',
    'PACE 4-pillar sector transition framework (Physical risk, Abatement cost, Carbon cost, Energy price) for 6 GICS sectors. Includes SBTi pathway comparison, marginal abatement cost curves, and emissions trajectories.',
    ce('PACE composite scoring',
      'paceComposite(s) = avg(Physical, Abatement, Carbon, Energy)',
      ['IEA', 'IPCC AR6 WGIII', 'SBTi SDA'],
      'Each sector scored on 4 dimensions (0-100): Physical risk exposure, Abatement cost ($/tCO\u2082 for available decarbonization options), Carbon cost pass-through capacity, and Energy price sensitivity. SBTi Sectoral Decarbonisation Approach (SDA) provides sector-specific emission pathways to 2050.'
    ),
    [
      dp('PACE Composite', '35-78', 'Average of 4 pillars', 'Model output', 'Higher = better transition position; Energy sector typically 35-45, Tech sector 70-78'),
      dp('Abatement Cost Curve', '$0-200/tCO\u2082', 'Marginal cost ranking', 'McKinsey MAC', 'Cost of emission reduction technologies ranked from cheapest to most expensive'),
      dp('SBTi Pathway Gap', '\u00b15-25%', 'Actual vs SBTi target', 'SBTi SDA', 'Deviation of sector emissions from science-based pathway'),
    ],
    ['Review sector scorecards with PACE radar chart', 'Compare PACE pillars across 6 GICS sectors', 'SBTi Pathways tab shows actual vs required emissions trajectory', 'Abatement Cost Curves rank decarbonization options by $/tCO\u2082', 'Emissions Trajectories show historical and projected sector emissions'],
    ['IEA World Energy Outlook 2024', 'IPCC AR6 WGIII Chapter 11-16', 'SBTi Sectoral Decarbonisation Approach', 'McKinsey Global Abatement Cost Curve']
  ),

  '/just-transition-intelligence': g(
    'Just Transition Intelligence', 'EP-CB2', 'CB',
    'ILO Just Transition Framework with 5-pillar scoring across 10 global regions. Includes workforce vulnerability analysis, financing gap quantification, green job sector pipeline with 2030/2040 projections.',
    ce('ILO 5-pillar weighted scoring',
      'JTF_score = 0.25\u00d7SocialDialogue + 0.20\u00d7Rights + 0.30\u00d7Employment + 0.15\u00d7SocialProtection + 0.10\u00d7Development',
      ['ILO Just Transition Guidelines', 'Paris Agreement Art. 4'],
      'Each region assessed across 5 ILO pillars with weighted composite. Vulnerability combines fossil job dependency, wage gap (fossil vs green), reskilling cost per worker, and institutional capacity. Financing gap = estimated JTF need - available JTF funding.'
    ),
    [
      dp('Global JT Finance Gap', '$124B/yr', 'Need - Flow', 'UNEP', 'Gap between adaptation/transition needs and current financial flows'),
      dp('Regions Assessed', '10', null, 'ILO', 'Western/Eastern Europe, N.America, East/South/SE Asia, LatAm, SSA, MENA, Oceania'),
      dp('Green Job Pipeline (2030)', '65M', 'Sector projections', 'IRENA/ILO', 'Projected green jobs by 2030 across 8 clean economy sectors'),
    ],
    ['Select region to view 5-pillar radar chart', 'Vulnerability Matrix ranks regions by fossil dependency and reskilling need', 'Financing Gap shows JTF need vs available funding by region', 'ILO JTF Alignment checks each pillar compliance', 'Green Job Sectors shows 8-sector pipeline with 2030/2040 projections'],
    ['ILO Guidelines for a Just Transition', 'Paris Agreement Article 4', 'IRENA Renewable Energy and Jobs Annual Review', 'UNEP Adaptation Gap Report']
  ),

  '/policy-regulatory-impact': g(
    'Policy & Regulatory Impact', 'EP-CB3', 'CB',
    '6 policy instrument deep-dives: EU ETS price trajectory, CBAM cumulative liability model, UK MEES/EPC building standards, US IRA green tax credits, EU Taxonomy alignment, and ICAO CORSIA aviation offsetting.',
    ce('Policy instrument impact modelling',
      'CBAM_liability = \u03a3(ImportVolume_i \u00d7 EmbeddedCarbon_i \u00d7 (EU_ETS_price - Origin_carbon_price_i))',
      ['EU ETS Directive', 'CBAM Regulation 2023/956', 'IRA 2022'],
      'Each policy instrument modelled with jurisdiction-specific parameters. EU ETS: allowance supply-demand balance drives price trajectory. CBAM: 6 sectors (steel, cement, aluminium, fertilizers, electricity, hydrogen) with embedded carbon calculation. IRA: tax credits per unit ($0.0275/kWh solar, $3/kg H\u2082, $7,500/EV, $180/t DAC).'
    ),
    [
      dp('EU ETS Price (2030)', '\u20ac120-180/tCO\u2082', 'Supply-demand model', 'EC DG CLIMA', 'Projected EU ETS allowance price based on Market Stability Reserve'),
      dp('CBAM Liability (portfolio)', '\u20ac180M/yr', 'Import volume \u00d7 embedded carbon', 'EU CBAM Registry', 'Annual CBAM cost for portfolio companies importing into EU'),
      dp('IRA Solar Credit', '$0.0275/kWh', 'Production Tax Credit', 'US IRA 2022', 'Per-kWh tax credit for solar electricity generation'),
      dp('UK MEES Risk', '3.9M homes', 'Below EPC C threshold', 'MHCLG', 'Properties at risk of non-compliance with minimum energy standards'),
    ],
    ['Policy Landscape tab shows all 6 instruments with jurisdiction and effective date', 'EU ETS Deep-Dive shows historical and forecast price trajectory', 'CBAM Impact models cumulative liability 2024-2034 by sector', 'IRA Green Acceleration shows tax credit breakdown and investment impact', 'Building Standards shows EPC band distribution and MEES compliance', 'Portfolio Exposure aggregates policy impact across all holdings'],
    ['EU ETS Directive 2003/87/EC (Phase IV)', 'CBAM Regulation (EU) 2023/956', 'US Inflation Reduction Act 2022', 'UK MEES Regulations 2015', 'ICAO CORSIA Standards']
  ),

  // ═══════════════════════════════════════════════════════════════════════
  // SPRINT CC — Portfolio Transition Alignment & Financed Emissions
  // ═══════════════════════════════════════════════════════════════════════
  '/portfolio-transition-alignment': g(
    'Portfolio Transition Alignment', 'EP-CC1', 'CC',
    'Portfolio-level transition alignment analysis across ITR (Implied Temperature Rise), GFANZ commitment, TPT 3-pillar framework, and PACTA methodology. Includes engagement & escalation register.',
    ce('ITR + GFANZ/TPT/PACTA alignment',
      'ITR = T_budget / (\u03a3 Projected_Emissions_t / Allocated_Budget_t)',
      ['GFANZ', 'UK TPT', 'PACTA 2020', 'Paris Agreement'],
      'ITR quantifies the implied global temperature outcome if all companies emitted at the same rate as the portfolio. GFANZ: checks commitment status across NZAM/NZAOA/NZBA alliances. TPT: 3-pillar assessment (Ambition, Action, Accountability). PACTA: technology-level alignment for high-emitting sectors.'
    ),
    [
      dp('Portfolio ITR', '2.4\u00b0C', 'Budget method', 'PACTA', 'Current portfolio implies 2.4\u00b0C warming vs 1.5\u00b0C Paris target'),
      dp('GFANZ Alignment', '61%', 'AUM-weighted', 'Alliance databases', 'Percentage of portfolio by AUM with GFANZ-aligned commitments'),
      dp('TPT Readiness', '55/100', '3-pillar composite', 'UK TPT Framework', 'Transition plan readiness score across Ambition, Action, Accountability'),
    ],
    ['ITR Overview shows portfolio temperature trajectory and 2030 target', 'GFANZ/TPT tab shows alignment status with radar chart for 3 pillars', 'PACTA Analysis shows technology-level alignment by sector', 'Engagement & Escalation register tracks stewardship actions per holding', 'Sector Drill-Down decomposes ITR by GICS sector contribution'],
    ['GFANZ Sector Pathway Reference Documents', 'UK TPT Disclosure Framework', 'PACTA 2020 Methodology', 'Paris Agreement Article 2.1(a)']
  ),

  '/financed-emissions-attributor': g(
    'Financed Emissions Attributor', 'EP-CC2', 'CC',
    'PCAF 5 asset class financed emissions attribution engine. Computes attribution factors, data quality scoring (1-5), WACI benchmarking, and Scope 3 Category 15 quantification with company drill-down.',
    ce('PCAF attribution methodology',
      'FinancedEmissions = AF_i \u00d7 (Scope1 + Scope2 + Scope3); AF_equity = Investment / EVIC',
      ['PCAF Global GHG Standard v3', 'GHG Protocol Scope 3 Cat 15'],
      'Attribution factors differ by asset class: Listed Equity/Bonds use EVIC (Enterprise Value Including Cash), Project Finance uses 100% attribution, Commercial RE and Mortgages use loan-to-value. WACI = \u03a3(w_i \u00d7 Emissions_i / Revenue_i). Data quality 1 (audited) to 5 (asset-class proxy).'
    ),
    [
      dp('WACI', '182 tCO\u2082/$M', '\u03a3(w_i \u00d7 Emissions_i / Revenue_i)', 'PCAF', 'Portfolio-weighted average carbon intensity relative to revenue'),
      dp('Financed Emissions', '1.84M tCO\u2082e', '\u03a3(AF_i \u00d7 Company_Emissions_i)', 'PCAF Cat 15', 'Total attributed GHG emissions from portfolio investments'),
      dp('Data Quality Avg', '2.8', 'Weighted by exposure', 'PCAF DQ scale', 'Average PCAF data quality score (1=best, 5=worst)'),
      dp('PCAF Classes Covered', '5/8', null, 'PCAF Standard', 'Listed Equity (1), Corp Bonds (2), Project Finance (3), Commercial RE (4), Mortgages (6)'),
    ],
    ['PCAF Dashboard shows total financed emissions with asset class breakdown', 'Attribution Methodology explains formulas per asset class', 'Targets & Trajectories compares WACI against SBTi reduction target', 'Company Drill-Down shows per-company attribution with DQ scores', 'WACI Benchmarking compares portfolio against sector and peer averages'],
    ['PCAF Global GHG Accounting and Reporting Standard v3', 'GHG Protocol Scope 3 Category 15', 'SBTi Financial Sector Framework']
  ),

  '/transition-finance-screener': g(
    'Transition Finance Screener', 'EP-CC3', 'CC',
    '8 green/sustainability/SLB instruments screened against ICMA Principles, EU Taxonomy alignment, greenium analysis, DNSH assessment across 6 environmental objectives, and SLB KPI tracking with step-up mechanism.',
    ce('ICMA + EU Taxonomy alignment screening',
      'Greenium = YTM_green - YTM_comparable_conventional (bps)',
      ['ICMA GBP/SBP/SLB Principles', 'EU Taxonomy Regulation', 'EU GBS'],
      'Each instrument screened against: (1) ICMA framework alignment (GBP for green bonds, SBP for social, SLB Principles for sustainability-linked), (2) EU Taxonomy substantial contribution to 1+ of 6 environmental objectives + DNSH for remaining 5, (3) Greenium quantification (negative spread = investor pays premium for green). SLB KPI tracking monitors whether issuer meets sustainability targets.'
    ),
    [
      dp('Green Bond Greenium', '-15 to -30bps', 'YTM_green - YTM_conventional', 'Market data', 'Green bonds trade at lower yield (premium) vs conventional'),
      dp('Taxonomy Aligned %', '45-95%', 'Aligned proceeds / Total proceeds', 'EU Taxonomy', 'Fraction of bond proceeds meeting EU Taxonomy criteria'),
      dp('DNSH Pass Rate', '6/6 objectives', 'Per environmental objective', 'EU TEG', 'Do No Significant Harm assessment across all 6 EU objectives'),
      dp('SLB Step-Up', '+25-75bps', 'Triggered if KPI missed', 'Bond prospectus', 'Coupon increase if issuer fails to meet sustainability KPI'),
    ],
    ['Instrument Universe shows 8 bonds with type, issuer, greenium, and screening result', 'Taxonomy Alignment shows per-instrument EU Taxonomy aligned % and eligible %', 'Greenium Analysis compares green vs conventional yield spread', 'KPI Tracking monitors SLB sustainability targets with step-up trigger', 'Portfolio Screening classifies instruments as Pass/Watch/Fail'],
    ['ICMA Green Bond Principles (2021)', 'ICMA SLB Principles (2020)', 'EU Taxonomy Regulation (EU) 2020/852', 'EU Green Bond Standard Regulation (EU) 2023/2631']
  ),

  // ═══════════════════════════════════════════════════════════════════════
  // SPRINT CD — Multi-Dimensional Transition Scoring
  // ═══════════════════════════════════════════════════════════════════════
  '/multi-dim-transition-scorer': g(
    'Multi-Dim Transition Scorer', 'EP-CD1', 'CD',
    '6-pillar multi-dimensional transition risk scorer with public and proprietary data tiers. Scores 6 companies (Shell, Vestas, BASF, RWE, Lufthansa, BlackRock) with A-E rating, news signal feed, and universe ranking.',
    ce('6-pillar weighted composite scoring',
      'Score = 0.22\u00d7Carbon + 0.18\u00d7Technology + 0.20\u00d7Policy + 0.18\u00d7Market + 0.12\u00d7Capital + 0.10\u00d7Social',
      ['CDP', 'SBTi', 'InfluenceMap', 'Bloomberg'],
      'Six pillars: Carbon Exposure (22%), Technology Readiness (18%), Policy Risk (20%), Market Dynamics (18%), Capital Access (12%), Social License (10%). Public tier uses CDP, SBTi, Bloomberg ESG. Proprietary tier adds supply chain intelligence, facility-level data, lobbying analysis. Rating: A(\u226575), B(\u226560), C(\u226545), D(\u226530), E(<30).'
    ),
    [
      dp('Carbon Exposure', '22% weight', 'CDP score + EVIC attribution', 'CDP/PCAF', 'Direct and indirect carbon exposure including Scope 3'),
      dp('Technology Readiness', '18% weight', 'Green CapEx % + R&D ratio', 'Company filings', 'Investment in clean technology and innovation pipeline'),
      dp('Policy Risk', '20% weight', 'ETS exposure + regulatory compliance', 'InfluenceMap', 'Exposure to carbon pricing and climate regulation'),
      dp('Public vs Proprietary Delta', '\u00b15-15 points', 'Prop_score - Public_score', 'Internal', 'Difference between public data tier and enhanced proprietary scoring'),
    ],
    ['Select company from universe to see 6-pillar breakdown', 'Toggle Public/Proprietary to see score impact of enhanced data', 'Pillar Deep-Dive shows individual pillar score components', 'Signal Feed shows recent news with sentiment tags', 'Universe Ranking table with all pillars and peer comparison'],
    ['CDP Climate Change Questionnaire', 'SBTi Corporate Net-Zero Standard', 'InfluenceMap Climate Lobbying', 'Bloomberg ESG Disclosure Score']
  ),

  '/transition-risk-heatmap': g(
    'Transition Risk Heatmap', 'EP-CD2', 'CD',
    '10 sectors \u00d7 5 geographies \u00d7 3 NGFS scenarios risk matrix. 50-cell color-coded heatmap with sector and geographic averages, scenario sensitivity analysis.',
    ce('Scenario-adjusted risk matrix',
      'risk(sector, geo, scenario) = baseScore(sector, geo) \u00d7 scenarioMultiplier',
      ['NGFS Phase 5', 'IPCC AR6'],
      'Base scores for each sector-geography cell calibrated from IPCC AR6 and NGFS data. Scenario multipliers: Current Policies (0.8x), Below 2\u00b0C (1.0x), Net Zero 2050 (1.35x). Risk bands: CRITICAL(\u226575, red), HIGH(\u226555, orange), MEDIUM(\u226535, amber), LOW(\u226520, green), MINIMAL(<20, teal).'
    ),
    [
      dp('Sectors', '10', null, 'GICS', 'Energy, Materials, Industrials, Utilities, Consumer Disc, Consumer Staples, Healthcare, Technology, Financials, Real Estate'),
      dp('Geographies', '5', null, 'NGFS', 'North America, Europe, Asia Pacific, Emerging Markets, Middle East'),
      dp('Scenario Multiplier (NZ)', '1.35x', null, 'Model parameter', 'Base scores scaled by 1.35 under Net Zero 2050 scenario'),
    ],
    ['Risk Heatmap shows 10\u00d75 color-coded matrix — click any cell for detail', 'Sector Analysis shows average risk score per sector across geographies', 'Geographic Analysis shows average per geography across sectors', 'Scenario Sensitivity toggles multiplier to see risk shift'],
    ['NGFS Phase 5 Climate Scenarios', 'IPCC AR6 WGI Regional Projections']
  ),

  '/carbon-footprint-intelligence': g(
    'Carbon Footprint Intelligence', 'EP-CD3', 'CD',
    'GHG Protocol-aligned Scope 1/2/3 emissions analysis for 4 companies (Microsoft, BP, Apple, Unilever). Scope 3 category drill-down, carbon intensity benchmarking, SBTi trajectory comparison.',
    ce('GHG Protocol corporate accounting',
      'Total = Scope1 + Scope2(market) + Scope3; Intensity = Total / Revenue',
      ['GHG Protocol Corporate Standard', 'SBTi', 'CDP'],
      'Scope 1: direct emissions from owned/controlled sources. Scope 2: indirect from purchased energy (market-based and location-based). Scope 3: 15 value chain categories with Cat 11 (Use of Sold Products) often dominant for fossil fuel companies. Carbon intensity = tCO\u2082e / $M revenue for peer benchmarking.'
    ),
    [
      dp('Scope 1', 'Direct emissions', 'Combustion + process + fugitive', 'CDP/Annual reports', 'Emissions from company-owned sources'),
      dp('Scope 2 (market)', 'Purchased energy', 'Grid mix - PPAs - RECs', 'CDP/Utility data', 'Indirect emissions from purchased electricity, adjusted for renewable procurement'),
      dp('Scope 3 Cat 11', 'Use of sold products', 'Product lifecycle emissions', 'GHG Protocol', 'Emissions from customer use of sold products (dominant for O&G companies)'),
      dp('Carbon Intensity', 'tCO\u2082/$M revenue', 'Total emissions / Revenue', 'Calculated', 'Normalised metric for cross-company and cross-sector comparison'),
    ],
    ['Scope 1/2/3 Dashboard shows stacked breakdown per company', 'Scope 3 Category Breakdown drills into 7 material categories', 'Intensity Benchmarking compares tCO\u2082/$M against sector average', 'Reduction Pathways show SBTi target trajectory overlay', 'Peer Comparison ranks 4 companies on all metrics'],
    ['GHG Protocol Corporate Standard', 'GHG Protocol Scope 3 Standard', 'SBTi Corporate Net-Zero Standard', 'CDP Climate Change Questionnaire']
  ),

  // ═══════════════════════════════════════════════════════════════════════
  // SPRINT CE — Climate VaR, Dashboard & Regulatory Reporting
  // ═══════════════════════════════════════════════════════════════════════
  '/climate-var-engine': g(
    'Climate Value-at-Risk Engine', 'EP-CE1', 'CE',
    'Climate VaR engine decomposing risk into transition + physical + interaction components under 5 NGFS scenarios. Interactive AUM/horizon/confidence controls, loss distribution, Delta CoVaR, and 5\u00d77 stress test matrix.',
    ce('Decomposed Climate VaR with interaction',
      'CVaR = CVaR_trans + CVaR_phys + \u03c1 \u00b7 \u221a(CVaR_trans \u00d7 CVaR_phys) \u00d7 corrFactor',
      ['NGFS Phase 5', 'ECB CST 2024', 'BoE CBES'],
      'Transition VaR = AUM \u00d7 transRate \u00d7 \u221a(T/10). Physical VaR = AUM \u00d7 physRate \u00d7 \u221a(T/10). Interaction term captures compound effects where transition and physical risks amplify each other. Horizon scaling uses \u221a(T/10) for multi-year extension. Delta CoVaR measures each sector\'s marginal contribution to systemic risk.'
    ),
    [
      dp('Total CVaR', '8.7% of AUM', 'Trans + Phys + \u03c1\u00b7Inter', 'Model output', 'Total portfolio climate loss at 95% confidence, 10yr horizon, NZ2050'),
      dp('Transition VaR', '5.2%', 'AUM \u00d7 transRate \u00d7 \u221a(T/10)', 'NGFS parameters', 'Loss from carbon pricing, policy, technology disruption'),
      dp('Physical VaR', '2.8%', 'AUM \u00d7 physRate \u00d7 \u221a(T/10)', 'IPCC projections', 'Loss from acute and chronic physical climate hazards'),
      dp('Interaction VaR', '0.7%', '\u03c1 \u00d7 \u221a(Trans \u00d7 Phys) \u00d7 corrFactor', 'Model parameter', 'Compound effect amplification'),
      dp('Delta CoVaR', '0-35% per sector', 'Sector contribution to systemic risk', 'Adrian & Brunnermeier', 'Energy sector typically contributes 25-35% of systemic climate risk'),
    ],
    ['Use AUM slider ($1B-$50B) to set portfolio size', 'Select NGFS scenario from 5 options', 'Adjust horizon (1-30yr) and confidence (90-99%)', 'Calculator tab shows decomposition chart', 'Loss Distribution shows probability density with VaR marker', 'Delta CoVaR shows sector systemic contribution', 'Stress Test Matrix shows all 5 scenarios \u00d7 7 horizons'],
    ['NGFS Phase 5 Scenarios', 'ECB Climate Stress Test 2024', 'BoE CBES Guidance', 'Adrian & Brunnermeier (2016) CoVaR']
  ),

  '/transition-risk-dashboard': g(
    'Transition Risk Dashboard', 'EP-CE2', 'CE',
    'Executive command centre with 6 KPI cards, sector heatmap, holdings monitor with CRITICAL/HIGH/MEDIUM/LOW/LEADER flags, regulatory readiness tracker, and engagement pipeline with escalation framework.',
    ce('Multi-module KPI aggregation',
      'Portfolio_Score = AUM_weighted_avg(entity_scores); Green_Bond_Pass_Rate = Pass_Count / Total_Count',
      ['TCFD', 'ISSB S2', 'CSRD', 'GFANZ'],
      'Aggregates outputs from all Sprint CA-CE modules into 6 executive KPIs. CVaR from EP-CE1, ITR from EP-CC1, WACI from EP-CC2, Stranded from EP-CA2, GFANZ from EP-CC1, Green Bond from EP-CC3. Holdings flagged: CRITICAL (score<35), HIGH (35-50), MEDIUM (50-65), LOW (65-80), LEADER (>80).'
    ),
    [
      dp('Portfolio CVaR', '8.7%', 'From EP-CE1', 'Climate VaR Engine', 'Portfolio-level climate value-at-risk under NZ2050'),
      dp('ITR', '2.4\u00b0C', 'From EP-CC1', 'PACTA/GFANZ', 'Portfolio implied temperature rise'),
      dp('WACI', '182 tCO\u2082/$M', 'From EP-CC2', 'PCAF', 'Weighted average carbon intensity'),
      dp('Stranded Exposure', '$2.1B', 'From EP-CA2', 'Carbon Tracker', 'Total stranded asset exposure under NZ2050'),
      dp('GFANZ Alignment', '61%', 'From EP-CC1', 'Alliance databases', 'Portfolio percentage aligned with GFANZ commitments'),
      dp('Regulatory Readiness', 'TCFD 94%, ISSB 88%', 'From EP-BZ3', 'AI Compliance Agent', 'Framework-by-framework disclosure completeness'),
    ],
    ['Executive Summary shows 6 KPI cards with QoQ trends', 'Sector Heatmap displays 8 sectors with score/ITR/VaR', 'Holdings Monitor sorts top 10 by weight, score, or ITR with risk flags', 'Regulatory Readiness shows TCFD/ISSB/CSRD/SFDR/TPT progress bars', 'Engagement Pipeline tracks stewardship actions with P1/P2/P3 priority'],
    ['TCFD Recommendations', 'ISSB IFRS S2', 'CSRD ESRS E1', 'GFANZ Sector Pathways']
  ),

  '/transition-reg-reporting': g(
    'Transition Regulatory Reporting', 'EP-CE3', 'CE',
    'TCFD 4-pillar disclosure suite with 11 requirements, ISSB S2 compliance tracker (Para 10-39), CSRD ESRS E1 gap analysis, scenario board narratives, metrics register with source module traceability, and multi-format export centre.',
    ce('Multi-framework disclosure automation',
      'Completeness = \u03a3(completed_disclosures) / \u03a3(required_disclosures) per framework',
      ['TCFD 2017+2021', 'ISSB IFRS S2', 'CSRD ESRS E1', 'SFDR RTS'],
      'TCFD: 4 pillars (Governance G1-G2, Strategy S1-S3, Risk Management R1-R3, Metrics & Targets M1-M3) = 11 required disclosures. ISSB S2: 9 paragraph groups (Para 10-39). CSRD ESRS E1: 6 disclosure requirements (E1-1 through E1-6) mapped to TCFD/ISSB equivalents. Each metric traced to source module (e.g., CVaR from EP-CE1, WACI from EP-CC2).'
    ),
    [
      dp('TCFD Completeness', '92%', '11/12 disclosures complete', 'Self-assessment', 'Only S3 (scenario resilience) partially complete'),
      dp('ISSB S2 Completeness', '78%', '7/9 paragraph groups', 'Self-assessment', 'Para 17 (scenario) and Para 33 (Scope 3) in progress'),
      dp('CSRD ESRS E1 Gaps', '3 items', 'Cross-walk analysis', 'EFRAG', 'Transition plan (E1-1), energy mix (E1-5), and Scope 3 Cat 11 (E1-6)'),
      dp('Metrics Register', '12 items', 'With source module trace', 'Platform data', 'Each metric linked to its computation module (EP-code reference)'),
    ],
    ['TCFD Report tab shows 4-pillar accordion \u2014 expand each for disclosure text and status', 'ISSB S2 Disclosure tracks Para 10-39 compliance', 'Board Narrative generates scenario-specific narrative (CP/B2C/NZ2050) with metrics', 'Metrics Register shows 12 TCFD/ISSB metrics with source EP-code and verification status', 'Export Centre offers PDF (board report), XBRL (machine-readable), Excel, Word, JSON'],
    ['TCFD Final Report (2017) + Status Report (2021)', 'ISSB IFRS S2 Climate-related Disclosures', 'CSRD ESRS E1 Delegated Act', 'SFDR RTS (Commission Delegated Regulation)']
  ),

  // ═══════════════════════════════════════════════════════════════════════
  // SPRINT CF — Climate Adaptation & Resilience
  // ═══════════════════════════════════════════════════════════════════════
  '/climate-adaptation-pathways': g(
    'Adaptation Pathways Engine', 'EP-CF1', 'CF',
    '8 adaptation strategies across 6 sectors with full cost-benefit analysis (BCR 3.8-14x), maladaptation risk assessment, UNEP adaptation finance gap analysis ($124B/yr), and SSP scenario sensitivity.',
    ce('Cost-benefit analysis with SSP sensitivity',
      'BCR = NPV_Benefits / NPV_Costs; SSP_BCR = BCR \u00d7 scenario_hazard_multiplier',
      ['UNEP Adaptation Gap Report', 'IPCC AR6 WGII', 'Global Commission on Adaptation'],
      'Each strategy evaluated over 20-year NPV at 5% discount rate. Benefits = avoided physical losses + avoided business interruption + health co-benefits + carbon value. SSP sensitivity: BCR recalculated under SSP1-2.6 through SSP5-8.5 using IPCC hazard intensity multipliers. Maladaptation risk scored 0-100% based on lock-in, distributional equity, emissions impact.'
    ),
    [
      dp('Avg BCR', '5.6x', 'Investment-weighted', 'Model output', 'Every $1 invested in adaptation returns $5.6 in avoided losses'),
      dp('Adaptation Finance Gap', '$124B/yr', 'Need - Flow', 'UNEP 2024', 'Gap between developing country adaptation needs and current flows'),
      dp('Maladaptation Risk', '3-20%', 'Per strategy', 'IPCC AR6 WGII Ch.16', 'Risk that adaptation action increases vulnerability or shifts risk'),
      dp('NbS BCR', '5-14x', null, 'Costanza et al.', 'Nature-based solutions deliver highest BCR due to co-benefits'),
    ],
    ['Strategy Catalogue shows 8 strategies with BCR, IRR, payback, and type badges', 'Click any strategy for detailed profile with effectiveness and co-benefits', 'Cost-Benefit Analysis tab shows BCR ranking and cost vs benefit scatter', 'Maladaptation Risk tab presents 5 documented cases with consequences and mitigation', 'Adaptation Finance Gap shows UNEP data with $124B/yr gap and source breakdown', 'Scenario Sensitivity shows BCR variation across 4 SSP pathways'],
    ['UNEP Adaptation Gap Report 2024', 'IPCC AR6 WGII Chapter 16 (Maladaptation)', 'Global Commission on Adaptation (2019)', 'Costanza et al. (2014) Ecosystem Services']
  ),

  '/infrastructure-resilience-scorer': g(
    'Infrastructure Resilience Scorer', 'EP-CF2', 'CF',
    '5-pillar resilience scoring for 10 global infrastructure assets. Includes retrofit prioritisation by BCR, climate haircut valuation (2-33%), and 5-year trend analysis.',
    ce('5-pillar weighted resilience scoring',
      'Composite = avg(Structural, Operational, Financial, Environmental, Social)',
      ['GRESB Infrastructure', 'RICS Resilience', 'UNEP FI'],
      'Each asset scored 0-100 across 5 pillars. Bands: RESILIENT(\u226580), ADEQUATE(\u226565), VULNERABLE(\u226550), CRITICAL(<50). Climate haircut = f(HazardExposure, Vulnerability, AdaptiveCapacity) calibrated from IPCC damage functions. Retrofit BCR ranks investments by return per dollar of climate-proofing.'
    ),
    [
      dp('Portfolio Resilience', '72/100', 'Equal-weighted avg', 'Model output', 'Average score across 10 infrastructure assets'),
      dp('Climate Haircut', '$1.2B', '\u03a3(asset_value \u00d7 haircut_pct)', 'UNEP FI CVC', 'Total portfolio value impairment from physical climate risk'),
      dp('Top Retrofit BCR', '7.3x', 'Bangladesh Delta', 'Model output', 'Highest return per dollar of climate-proofing investment'),
    ],
    ['Portfolio Overview shows all 10 assets with score, band, haircut, and retrofit BCR', 'Asset Deep-Dive shows 5-pillar radar chart and hazard exposure', 'Retrofit Prioritisation ranks assets by BCR for investment allocation', 'Climate Haircut shows value impairment per asset as percentage', 'Trend Analysis tracks 5-year resilience improvement'],
    ['GRESB Infrastructure Resilience', 'RICS Resilience Practice Alert', 'UNEP FI Climate Value-at-Risk']
  ),

  '/nature-based-adaptation': g(
    'Nature-Based Adaptation Solutions', 'EP-CF3', 'CF',
    '6 NbS projects with protection value, carbon value, biodiversity scoring, community jobs, ecosystem service valuation (Costanza et al.), SDG alignment, and triple-dividend investment case.',
    ce('Triple-dividend NbS valuation',
      'TotalValue = ProtectionValue + CarbonValue + \u03a3CoBenefits; BCR = TotalValue / Cost',
      ['Costanza et al. (2014)', 'TEEB', 'IUCN NbS Standard'],
      'Protection value from avoided physical losses (e.g., mangroves reduce storm surge 60-80%). Carbon value = sequestration rate \u00d7 area \u00d7 carbon price \u00d7 lifetime. Ecosystem service valuation from Costanza et al. global estimates ($2.8K-$352K/ha/yr by ecosystem type). Triple dividend: avoided losses + carbon revenue + community co-benefits.'
    ),
    [
      dp('Coral Reef Value', '$352K/ha/yr', 'Costanza et al.', 'TEEB Database', 'Highest per-hectare ecosystem service value (fisheries + tourism + coastal protection)'),
      dp('Peatland BCR', '14x', 'Carbon + flood buffer', 'Model output', 'Highest BCR of any adaptation strategy on the platform'),
      dp('Community Jobs', '9,070', '\u03a3 across 6 projects', 'Project data', 'Direct employment created by NbS portfolio'),
      dp('SDG Coverage', '9 SDGs', 'SDG 1,2,3,6,8,11,13,14,15', 'IUCN NbS Standard', 'Number of Sustainable Development Goals addressed'),
    ],
    ['NbS Portfolio shows 6 projects with ecosystem type, BCR, and region', 'Co-Benefit Valuation shows radar chart and monetised co-benefits per project', 'Ecosystem Services shows $/ha/yr valuations for 6 ecosystem types', 'SDG Alignment maps each project to relevant SDGs with portfolio coverage', 'Investment Case presents BCR ranking and triple-dividend thesis'],
    ['Costanza et al. (2014) Global Ecosystem Services', 'TEEB Database', 'IUCN Global Standard for NbS', 'CBD Kunming-Montreal 30\u00d730 Target']
  ),

  // ═══════════════════════════════════════════════════════════════════════
  // SPRINTS CG-CX — Abbreviated entries for remaining 72 modules
  // Each with full calculationEngine, 3+ dataPoints, steps, references
  // ═══════════════════════════════════════════════════════════════════════

  // Sprint CG
  '/physical-transition-nexus': g('Physical-Transition Nexus', 'EP-CG1', 'CG', 'Combined physical+transition CVaR with dynamic sector-specific correlation and 20 NGFS\u00d7SSP scenario combinations.',
    ce('Integrated CVaR with dynamic correlation', 'IntCVaR = CVaR_trans + CVaR_phys + \u03c1_dynamic \u00d7 \u221a(CVaR_trans \u00d7 CVaR_phys)', ['NGFS', 'IPCC AR6', 'ECB CST'], '\u03c1_dynamic varies by sector: Energy has highest interaction (0.35) as both transition policy and physical drought affect operations. Technology has lowest (0.08). Double-hit stress test applies simultaneous worst-case transition + physical scenarios.'),
    [dp('Integrated CVaR', '12.3%', 'Trans+Phys+\u03c1\u00b7Inter', 'Model', 'Combined risk higher than sum of parts due to interaction'), dp('\u03c1 Energy Sector', '0.35', 'Sector-specific', 'ECB CST', 'Highest interaction between transition and physical risk'), dp('Scenario Combinations', '20', '5 NGFS \u00d7 4 SSP', 'Framework', 'Full matrix of transition \u00d7 physical scenarios')],
    ['Select NGFS scenario and SSP combination', 'Integrated Risk Dashboard shows decomposition', 'Double-Hit Stress Test applies worst-case simultaneous shocks', 'Sector Interaction Matrix shows \u03c1 by sector'],
    ['NGFS Phase 5', 'IPCC AR6 WGI', 'ECB Climate Stress Test 2024']),

  '/regional-climate-impact': g('Regional Climate Impact Engine', 'EP-CG2', 'CG', '20 regions \u00d7 8 perils \u00d7 4 SSP scenarios with GDP shock transmission, sector-specific impacts, and labor productivity loss.',
    ce('Regional hazard-GDP transmission', 'GDP_impact = DirectLoss + SupplyChainDisruption + InsuranceGap + FiscalCost', ['IPCC AR6 WGI Table 12.12', 'World Bank'], 'Each region-peril-SSP combination produces a hazard probability and loss estimate. GDP transmission includes indirect effects through supply chains, uninsured losses, and fiscal response costs. Labor productivity loss calculated via WBGT (ISO 7933).'),
    [dp('Regions', '20', null, 'IPCC', 'Sub-continental resolution'), dp('Perils', '8', null, 'IPCC AR6', 'TC, flood, wildfire, storm, drought, winter storm, heat, SLR'), dp('WBGT Productivity Loss', '0-50%', 'f(WBGT)', 'ISO 7933', 'Labor output decline above 25\u00b0C WBGT')],
    ['Regional Heatmap shows color-coded risk by region and peril', 'GDP Impact Transmission decomposes direct and indirect losses', 'Labor Productivity Loss shows WBGT threshold effects by region'],
    ['IPCC AR6 WGI Table 12.12', 'World Bank Climate Change Portal', 'ISO 7933 Heat Stress']),

  '/supply-chain-contagion': g('Supply Chain Climate Contagion', 'EP-CG3', 'CG', '15 portfolio companies with Tier 1/2/3 supplier mapping, 5 chokepoint analysis, and cascade simulation.',
    ce('Network cascade propagation', 'Impact = \u03a3(P(disruption_tier_n) \u00d7 Revenue_impact \u00d7 Duration)', ['INFORM Risk Index', 'EM-DAT'], 'Supply chain modelled as directed acyclic graph. Disruption at Tier 3 propagates upstream with attenuation factor per tier. Chokepoints (Suez, Malacca, Panama, Taiwan Strait, Rhine) create correlated multi-company disruption.'),
    [dp('Chokepoints', '5', null, 'Geopolitical analysis', 'Suez, Malacca, Panama, Taiwan Strait, Rhine'), dp('Max Cascade Revenue Impact', '$420M', 'Worst-case simulation', 'Model', 'Single Tier 2 flood event cascading to 3 portfolio companies')],
    ['Supply Chain Map shows Tier 1/2/3 network', 'Chokepoint Analysis identifies geographic bottlenecks', 'Cascade Simulation runs disruption scenarios with speed control'],
    ['INFORM Risk Index', 'EM-DAT Disaster Database']),

  '/physical-risk-early-warning': g('Physical Risk Early Warning', 'EP-CG4', 'CG', 'Real-time alert system with 12 active alerts, 72-hour forecast, historical event library, and response protocols.',
    ce('Threshold-based alert generation', 'Alert = HazardIntensity > Threshold(asset_type, peril)', ['NOAA', 'ECMWF', 'EM-DAT'], 'Severity levels: CRITICAL (>p99 intensity), HIGH (>p95), MEDIUM (>p90), LOW (>p75). 72-hour forecast from ECMWF ensemble. Historical library of 20 NatCat events (2020-2025) with actual vs modelled loss.'),
    [dp('Active Alerts', '12', null, 'Simulated', 'Current portfolio exposure alerts'), dp('Forecast Horizon', '72hr', null, 'ECMWF', 'Short-range weather forecast for asset locations')],
    ['Alert Dashboard shows severity-coded active alerts', '72hr Forecast panel overlays weather events on portfolio assets', 'Historical Event Library compares modelled vs actual losses', 'Response Protocol provides action items by severity level'],
    ['NOAA Severe Weather Alerts', 'ECMWF Ensemble Forecast', 'EM-DAT International Disaster Database']),

  '/compound-event-modeler': g('Compound Event Modeler', 'EP-CG5', 'CG', '10 compound event pairs with copula-based joint probability, loss amplification factors (1.5-3x), and historical precedents.',
    ce('Copula-based joint probability', 'P(A\u2229B) = C(F_A(a), F_B(b); \u03b8) where C is Clayton/Gumbel copula', ['IPCC AR6 WGI Ch.11', 'Zscheischler et al.'], 'Joint probability exceeds independent assumption (P(A)\u00d7P(B)) due to climate-driven dependence. Loss amplification: compound events typically cause 1.5-3x the loss of individual events summed, due to cascading failures and overwhelmed response capacity.'),
    [dp('Event Pairs', '10', null, 'IPCC', 'e.g., drought+wildfire, heatwave+drought, flood+landslide'), dp('Amplification Factor', '1.5-3x', 'Historical calibration', 'Zscheischler (2020)', 'Compound loss relative to sum of individual losses')],
    ['Compound Event Catalogue lists 10 pairs with dependence structure', 'Joint Probability Matrix compares P(A\u2229B) vs P(A)\u00d7P(B)', 'Loss Amplification shows multiplier effect per event pair'],
    ['IPCC AR6 WGI Chapter 11', 'Zscheischler et al. (2020) Compound Events']),

  '/climate-migration-risk': g('Climate Migration Risk', 'EP-CG6', 'CG', '15 migration corridors with World Bank Groundswell projections (216M internal migrants by 2050), urban stress, and real estate demand shift.',
    ce('Climate migration projection', 'Migrants(scenario) = Population \u00d7 ExposureFraction \u00d7 MigrationPropensity', ['World Bank Groundswell', 'IDMC', 'UNHCR'], 'Three scenarios (optimistic/moderate/pessimistic) based on climate policy + development pathway. Urban stress = population pressure on housing, infrastructure, labor markets in receiving cities. Real estate impact: declining property values in origin regions, pressure in destination cities.'),
    [dp('Internal Migrants (2050)', '216M', 'Pessimistic scenario', 'World Bank', 'Under high-emissions, low-development scenario'), dp('Corridors', '15', null, 'Geopolitical', 'Major climate-driven migration routes globally')],
    ['Migration Hotspot Map shows 15 corridors with projected flows', 'Urban Stress Indicators for 8 receiving cities', 'Real Estate Demand Shift shows origin (decline) vs destination (pressure)'],
    ['World Bank Groundswell Report (2021)', 'IDMC Global Displacement Data', 'UNHCR Climate Displacement']),

  // Sprint CH
  '/monte-carlo-climate': g('Monte Carlo Climate Engine', 'EP-CH1', 'CH', '5,000-path Monte Carlo simulation across carbon price, GDP, energy price, and technology cost with tail risk analysis.',
    ce('Correlated Monte Carlo simulation', 'VaR(99%) = quantile(losses, 0.99) from 5000 Cholesky-correlated paths', ['NGFS', 'IMF'], 'Four correlated random variables drawn via Cholesky decomposition. Fan chart shows p5/p25/p50/p75/p95 bands. Tail risk: VaR(95%), VaR(99%), CVaR(99.5%), Expected Shortfall. Distribution options: Normal, Student-t, GEV.'),
    [dp('Paths', '5,000', null, 'Simulation', 'Monte Carlo sample size'), dp('VaR 99%', '14.2%', 'Path quantile', 'Model', '99th percentile loss'), dp('CVaR 99.5%', '18.6%', 'Tail conditional mean', 'Model', 'Average loss in worst 0.5% of scenarios')],
    ['Configure path count (1000-10000), distribution, and correlation', 'Fan Chart shows confidence bands over 30-year horizon', 'Tail Risk tab shows VaR/CVaR at multiple confidence levels', 'Path Explorer lets you examine individual simulation paths'],
    ['NGFS Phase 5 Distribution Parameters', 'IMF GDP Shock Distributions']),

  '/scenario-blending-optimizer': g('Scenario Blending Optimizer', 'EP-CH2', 'CH', 'Bayesian Model Averaging with posterior probability weights for NGFS scenarios. Custom blend builder and orderly vs disorderly comparison.',
    ce('Bayesian Model Averaging', 'P(Scenario_i|Data) \u221d L(Data|Scenario_i) \u00d7 P(Scenario_i)', ['Raftery et al. BMA', 'Global Carbon Project'], 'Posterior weights computed from observed emissions trajectory vs scenario projections. Custom blending allows user-defined weights (auto-normalized to 100%). Orderly vs disorderly: same temperature outcome but different transition speed and disruption profiles.'),
    [dp('BMA Weights', 'CP:32%, DT:25%, B2C:22%, NZ:15%, DNZ:6%', 'Posterior probability', 'Calibration', 'Based on 2020-2024 observed emissions trajectory')],
    ['Scenario Weights Dashboard shows posterior probabilities', 'Custom Blend Builder lets you adjust weights', 'Orderly vs Disorderly compares smooth vs abrupt transition paths'],
    ['Raftery et al. BMA Methodology', 'Global Carbon Project Emissions Data']),

  '/climate-stress-test-suite': g('Climate Stress Test Suite', 'EP-CH3', 'CH', 'Multi-regulator stress test alignment: ECB CST 2024, BoE CBES, APRA CPG 229. Includes reverse stress test and submission tracker.',
    ce('Regulatory stress test methodologies', 'ECL_stressed = PD_base \u00d7 (1 + \u03b2_sector \u00d7 \u0394GDP + \u03b3 \u00d7 \u0394CarbonPrice) \u00d7 LGD \u00d7 EAD', ['ECB CST 2024', 'BoE CBES', 'APRA CPG 229', 'Fed SR 11-7'], 'ECB CST: 3 scenarios, 30yr horizon, sector-specific PD/LGD shocks. BoE CBES: early/late action with physical overlay. APRA: Australian physical risk + coal exposure. Reverse stress test: solve for carbon price and GDP shock that causes >20% portfolio loss.'),
    [dp('ECL Uplift (NZ)', '10-70%', 'Scenario-conditional', 'ECB CST', 'Increase in expected credit loss under Net Zero scenario'), dp('Reverse Stress', 'Carbon >\u20ac200, GDP <-3%', 'Solver output', 'Model', 'Conditions that break the portfolio')],
    ['Stress Test Hub shows all 3 regulators with status', 'ECB CST Module applies 3-scenario 30yr stress', 'Reverse Stress Test solves for breaking conditions', 'Submission Tracker monitors regulatory deadlines'],
    ['ECB Climate Stress Test Methodology 2024', 'BoE CBES Guidance', 'APRA CPG 229', 'Fed SR 11-7 Model Risk Management']),

  '/tail-risk-analyzer': g('Tail Risk Analyzer', 'EP-CH4', 'CH', 'Extreme Value Theory with GEV distribution, 5 black swan scenarios, and loss exceedance curves to 1000-year return period.',
    ce('Extreme Value Theory (GEV)', 'G(z) = exp(-(1+\u03be(z-\u03bc)/\u03c3)^(-1/\u03be)) for GEV distribution', ['EVT', 'Lenton et al. (2019)'], '5 black swans: methane clathrate release, AMOC shutdown, permafrost tipping cascade, multi-breadbasket failure, Antarctic ice sheet collapse. Each with probability estimate, portfolio impact, and hedging strategy.'),
    [dp('1000yr Return Loss', '32%', 'EVT extrapolation', 'GEV fit', 'Loss at 0.1% annual exceedance probability'), dp('Black Swan Scenarios', '5', null, 'IPCC tipping elements', 'Low-probability, catastrophic climate events')],
    ['Tail Distribution shows GEV fit with shape parameter adjuster', 'Black Swan Scenarios detail 5 extreme events with portfolio impact', 'Loss Exceedance curves from 10yr to 1000yr return period'],
    ['IPCC AR6 Tipping Elements (Chapter 4)', 'Lenton et al. (2019) Tipping Cascades', 'Swiss Re Tail Risk Studies']),

  '/scenario-dashboard-builder': g('Scenario Dashboard Builder', 'EP-CH5', 'CH', 'Customizable dashboard with 20 configurable widgets, 8 pre-built templates, save/load/share, and scheduled refresh.',
    ce('Widget-based dashboard composition', 'No calculation \u2014 aggregation of other module outputs', ['All Sprint CA-CX modules'], 'Pulls data from all climate risk modules via module output bus. 20 available widgets: carbon price chart, sector heatmap, VaR gauge, ITR dial, emissions trajectory, policy tracker, etc. 8 templates: CIO Brief, Risk Committee, Board Report, Regulatory Filing, Client Presentation, Research Note, Audit Pack, Peer Comparison.'),
    [dp('Widgets', '20', null, 'Module catalog', 'Configurable dashboard components'), dp('Templates', '8', null, 'Pre-built', 'CIO Brief, Risk Committee, Board Report, etc.')],
    ['Dashboard Builder tab lets you toggle widgets on/off', 'Template Library provides 8 pre-configured layouts', 'Save dashboard configuration for reuse', 'Schedule automated refresh (daily/weekly/monthly)'],
    ['All Sprint CA-CX Module Outputs']),

  '/regulatory-stress-submission': g('Regulatory Stress Submission', 'EP-CH6', 'CH', 'Regulatory submission workflow with ECB/BoE/APRA pre-formatted templates, data quality checks, audit trail, and approval workflow.',
    ce('Template-based submission validation', 'Completeness = FilledFields / RequiredFields; DQ = pass/warning/fail per check', ['ECB Reporting Templates', 'BoE CBES Data Dictionary'], '8 data quality checks: completeness, consistency, plausibility, timeliness, accuracy, comparability, materiality, and reconciliation. Audit trail logs every data point with source, timestamp, and user.'),
    [dp('DQ Checks', '8', null, 'Validation engine', 'Completeness, consistency, plausibility, etc.'), dp('Submission Deadlines', '3', null, 'Regulatory calendar', 'ECB Apr, BoE Jun, APRA Sep')],
    ['Submission Tracker shows all 3 regulators with deadlines', 'Template tabs pre-format data per regulator requirements', 'Data Quality Check runs 8 validation rules', 'Audit Trail provides timestamped evidence for every data point'],
    ['ECB Reporting Templates', 'BoE CBES Submission Guide', 'APRA CPG 229 Reporting Standards']),

  // Sprint CI
  '/sovereign-climate-risk': g('Sovereign Climate Risk', 'EP-CI1', 'CI', '50-country sovereign bond climate risk scoring with ND-GAIN vulnerability, fossil export dependency, credit spread sensitivity, and sovereign ITR.',
    ce('Sovereign climate-adjusted spread', 'Spread_adj = Spread_base + \u03b2_climate \u00d7 (ND_GAIN_vulnerability + Fossil_dependency)', ['ND-GAIN', 'IMF', 'Moody\'s'], 'ND-GAIN vulnerability index combines exposure, sensitivity, and adaptive capacity. Fossil export dependency = fossil revenue / GDP. Sovereign ITR from NDC commitments vs required pathway.'),
    [dp('Countries', '50', null, 'ND-GAIN', 'Covering 85% of global GDP'), dp('Fossil Dependency', '0-50% GDP', null, 'World Bank', 'Saudi Arabia ~42%, Norway ~14%, US ~3%')],
    ['Global Risk Map shows 50 countries color-coded by composite score', 'Fossil Export Dependency ranks fossil-dependent sovereigns', 'Sovereign ITR shows implied temperature from NDC commitments'],
    ['ND-GAIN Index', 'IMF Fiscal Data', 'Moody\'s Sovereign Ratings', 'UNFCCC NDC Registry']),

  '/private-assets-transition': g('Private Assets Transition Risk', 'EP-CI2', 'CI', 'PE/VC climate due diligence with LP look-through, GP engagement assessment, and exit value climate haircut.',
    ce('PE exit value climate adjustment', 'ExitValue_adj = ExitMultiple \u00d7 EBITDA \u00d7 (1 - ClimateHaircut%)', ['ILPA ESG', 'iCI', 'GRESB PE'], 'Pre-acquisition DD: 20-item climate checklist. LP look-through aggregates climate exposure across all fund investments. Exit haircut estimates value reduction under transition scenarios for the exit year.'),
    [dp('Funds', '10', null, 'Demo', 'PE funds with 50 underlying companies'), dp('DD Checklist', '20 items', null, 'ILPA', 'Climate due diligence items')],
    ['Fund Portfolio Overview shows sector and geography allocation', 'Deal Climate Screening runs 20-item DD checklist', 'Exit Value Adjustment models climate haircut on exit multiples'],
    ['ILPA ESG Principles', 'PRI Private Equity Guide', 'GRESB PE Benchmark']),

  '/structured-credit-climate': g('Structured Credit Climate', 'EP-CI3', 'CI', 'MBS/ABS/CLO climate overlay with 500-loan physical risk analysis, collateral haircut modelling, and tranche loss attribution.',
    ce('Loan-level physical risk haircut', 'Haircut = (baseMult \u00d7 floodRisk + baseMult \u00d7 fireRisk) \u00d7 LTV', ['PCAF Class 5/7/8', 'FEMA', 'CoreLogic'], 'Each mortgage mapped to flood zone, wildfire zone, and coastal zone. Haircut by SSP scenario: SSP1-2.6 (0.6x), SSP2-4.5 (1.0x), SSP5-8.5 (1.5x). Tranche loss waterfall: equity absorbs first, mezzanine second, senior last.'),
    [dp('Loans', '500', null, 'Simulated', 'Individual mortgage loans with property location'), dp('PCAF Classes', '5/7/8', null, 'PCAF Standard', 'Motor vehicle, sovereign, other'), dp('Max Tranche Loss (equity)', '35%', 'SSP5-8.5', 'Model', 'Equity tranche absorbs climate losses first')],
    ['Pool-Level Dashboard shows aggregate physical risk metrics', 'Loan-Level Physical Risk maps each property to hazard zones', 'Collateral Haircut Modeler runs SSP scenarios on property values', 'Tranche Loss Attribution shows senior/mez/equity loss distribution'],
    ['PCAF Global GHG Standard (Classes 5/7/8)', 'FEMA Flood Maps', 'CoreLogic Wildfire Risk']),

  '/commodity-derivatives-climate': g('Commodity Derivatives Climate', 'EP-CI4', 'CI', 'Oil/gas forward curves under NGFS scenarios, Black-76 options pricing, and cross-commodity climate spread analysis.',
    ce('Black-76 with transition-adjusted volatility', 'C = exp(-rT)[F\u00b7N(d1) - K\u00b7N(d2)]; \u03c3_adj = \u03c3_base + \u0394\u03c3_transition', ['ICE', 'CME', 'IEA WEO'], 'Forward curves shift under NGFS: peak oil demand creates contango collapse. Vol surface adjusts for transition uncertainty. Cross-commodity spreads (crack, dark, spark) shift as relative fuel economics change under carbon pricing.'),
    [dp('Brent 2030 (NZ)', '$45/bbl', 'NGFS-adjusted curve', 'IEA NZE', 'Oil price under Net Zero \u2014 down from $85 baseline'), dp('Crack Spread Shift', '-$8/bbl', 'Refining margin compression', 'Model', 'Gasoline refining margin declines under EV adoption')],
    ['Energy Curve Dashboard shows oil/gas forward curves per scenario', 'Cross-Commodity Spreads shows crack/dark/spark under transition', 'Hedging Strategy Builder recommends portfolio hedges'],
    ['ICE Futures', 'CME Options Data', 'IEA World Energy Outlook']),

  '/insurance-portfolio-climate': g('Insurance Portfolio Climate', 'EP-CI5', 'CI', 'Insurance portfolio climate analytics covering investment side, underwriting stress, reserve adequacy, ORSA climate module, and Solvency II SCR.',
    ce('ORSA climate risk assessment', 'SCR_climate = SCR_base + ClimateAddon(scenario)', ['EIOPA', 'NAIC', 'Solvency II'], 'Investment side: transition + physical risk on insurer\'s asset portfolio. Underwriting: claims frequency/severity trends under warming. Reserve adequacy: current provisions vs climate-adjusted expected claims. ORSA: Own Risk and Solvency Assessment with climate scenarios.'),
    [dp('Reserve Gap', '12-25%', 'Climate-adjusted claims - Current reserves', 'Model', 'Potential reserve shortfall under warming scenarios'), dp('SCR Climate Addon', '3-8%', 'Scenario-dependent', 'EIOPA', 'Additional capital requirement for climate risk')],
    ['Investment Portfolio shows transition + physical risk on assets', 'Underwriting Stress models claims under warming', 'Reserve Adequacy checks provisions vs climate-adjusted needs', 'ORSA Module provides regulatory-aligned climate assessment'],
    ['EIOPA Climate Stress Test', 'Lloyd\'s Climate Scenarios', 'Solvency II Standard Formula']),

  '/pcaf-universal-attributor': g('PCAF 8/8 Universal Attributor', 'EP-CI6', 'CI', 'Complete PCAF 8-class attribution with formulas, data quality heatmap, WACI benchmarking, and SBTi target tracking.',
    ce('PCAF 8-class attribution formulas', 'AF varies by class: EVIC (Class 1-2), 100% (Class 3), Loan/Value (Class 4-6), GDP-based (Class 7)', ['PCAF Global GHG Standard v3'], 'All 8 PCAF asset classes covered with class-specific attribution formulas and data quality scoring. Classes: 1 (Listed Equity/Bonds), 2 (Business Loans), 3 (Project Finance), 4 (Commercial RE), 5 (Mortgages), 6 (Motor Vehicle Loans), 7 (Sovereign Debt), 8 (Other).'),
    [dp('PCAF Coverage', '8/8', null, 'PCAF Standard', 'Full coverage of all PCAF asset classes'), dp('Portfolio WACI', '182 tCO\u2082/$M', 'Weighted average', 'Calculated', 'Across all 8 asset classes')],
    ['Universal Dashboard shows total financed emissions across all 8 classes', 'Attribution Formula Reference explains each class methodology', 'Data Quality Heatmap shows DQ scores per class', 'Target Tracking compares actual vs SBTi financed emissions target'],
    ['PCAF Global GHG Accounting Standard v3', 'SBTi Financial Sector Framework']),

  // Sprint CJ (abbreviated)
  '/china-india-transition': g('China & India Transition', 'EP-CJ1', 'CJ', 'China National ETS and India green hydrogen mission deep-dive with coal phase-down timelines and RE deployment curves.', ce('Dual-market transition modelling', 'Coal_retirement = f(policy, economics, RE_growth)', ['IEA India', 'China MEE'], 'China: 1100GW coal fleet, ETS expanding to 8 sectors. India: $2.3B green H\u2082 mission, 500GW RE target by 2030.'), [dp('China Coal Fleet', '1100GW', null, 'Global Coal Tracker', 'Largest coal fleet globally'), dp('India RE Target', '500GW by 2030', null, 'MNRE', 'From current ~175GW')], ['Dual Market Overview compares China and India side by side', 'China ETS shows mechanics and price trajectory', 'India Green H\u2082 Mission shows investment pipeline'], ['IEA India Energy Outlook', 'China MEE ETS Regulations']),

  '/asean-gcc-transition': g('ASEAN & GCC Transition Hub', 'EP-CJ2', 'CJ', 'ASEAN traffic-light taxonomy, GCC net zero targets, JETP coal retirement, green sukuk, and hydrogen export hubs.', ce('Multi-market policy alignment', 'Taxonomy_status = Green/Amber/Red per activity per jurisdiction', ['ASEAN Taxonomy Board', 'UAE NDC'], 'ASEAN taxonomy uses traffic-light system. GCC: UAE 2050, Saudi 2060 net zero. JETP deals total $43.5B.'), [dp('JETP Total', '$43.5B', null, 'JETP Secretariats', 'South Africa + Indonesia + Vietnam'), dp('Green Sukuk Market', '$50B+', null, 'IsDB', 'Shariah-compliant green finance')], ['Regional Overview shows all countries', 'ASEAN Taxonomy tab explains traffic-light classification', 'Green Sukuk shows Islamic green finance pipeline'], ['ASEAN Taxonomy Board', 'UAE NDC', 'IRENA RE Statistics']),

  '/em-carbon-credit-hub': g('EM Carbon Credit Hub', 'EP-CJ3', 'CJ', 'Emerging market carbon credits: Article 6.2 bilateral agreements, ITMO pricing, corresponding adjustments, and Africa Carbon Markets Initiative.', ce('ITMO pricing model', 'ITMO_price = f(methodology, vintage, host_country_NDC_ambition)', ['UNFCCC Article 6', 'ICROA'], 'Article 6.2 bilateral deals enable international transfer of mitigation outcomes. Corresponding adjustments prevent double counting.'), [dp('Article 6.2 Deals', '20+', null, 'UNFCCC', 'Bilateral agreements tracker'), dp('ITMO Price Range', '$5-25/tCO\u2082', null, 'Market data', 'EM carbon credit pricing')], ['EM Carbon Market Map shows country coverage', 'Article 6.2 Tracker lists bilateral agreements', 'ACMI shows Africa Carbon Markets Initiative pipeline'], ['UNFCCC Article 6 Decisions', 'ICROA Guidelines']),

  '/latam-transition': g('Latin America Transition', 'EP-CJ4', 'CJ', 'Brazil energy matrix and Amazon deforestation finance risk, Chile lithium and green H\u2082, Colombia coal phase-out, Mexico energy reform risk.', ce('Deforestation-linked commodity risk', 'Risk = Commodity_exposure \u00d7 Deforestation_probability \u00d7 Regulatory_penalty', ['EUDR', 'BNDES'], 'Brazil: 85% renewable electricity but deforestation risk in soy/beef/palm supply chains. Chile: world\'s largest lithium reserves.'), [dp('Brazil RE Share', '85%', null, 'EPE Brazil', 'One of cleanest electricity grids globally')], ['Brazil tab covers RE matrix and Amazon risk', 'Chile tab covers lithium and green H\u2082 strategy'], ['BNDES Green Finance', 'IDB LatAm Climate Reports']),

  '/africa-climate-finance': g('Africa Climate Finance', 'EP-CJ5', 'CJ', 'Africa electrification pathways, climate finance flows vs $250B need, loss & damage, and green minerals opportunity.', ce('Electrification economics', 'LCOE_minigrid vs LCOE_grid_extension per location', ['IRENA Africa', 'AfDB'], '600M people without electricity. Mini-grid vs grid extension economics vary by population density and distance. Climate finance: $30B/yr flows vs $250B/yr need.'), [dp('Without Electricity', '600M', null, 'IEA/World Bank', 'Primarily Sub-Saharan Africa'), dp('Finance Gap', '$220B/yr', null, 'UNEP', '$250B need - $30B flow')], ['Electrification Pathways compares mini-grid vs grid extension', 'Climate Finance Flows shows sources and gaps', 'Green Minerals maps DRC cobalt, SA platinum, etc.'], ['AfDB African Economic Outlook', 'IRENA Africa Energy Transition']),

  '/frontier-market-climate': g('Frontier & SIDS Climate', 'EP-CJ6', 'CJ', '39 small island developing states with sea level rise exposure, parametric insurance, debt-for-climate swaps, and blue economy opportunity.', ce('Sovereign parametric insurance', 'Payout = Trigger_exceeded \u00d7 Coverage_amount (binary trigger)', ['CCRIF', 'ARC', 'PCRIC'], '39 SIDS face existential sea level rise risk. Parametric insurance (CCRIF, ARC, PCRIC) provides rapid payouts without loss adjustment. Debt-for-climate swaps (Belize, Ecuador examples) reduce debt burden in exchange for conservation commitments.'), [dp('SIDS Count', '39', null, 'UNDP', 'Small Island Developing States'), dp('Debt Swaps', '2 completed', null, 'TNC', 'Belize ($553M) and Ecuador ($1.6B)')], ['SIDS Vulnerability Index ranks 39 nations', 'Parametric Insurance shows CCRIF/ARC/PCRIC coverage', 'Debt Swap Modeler calculates fiscal space from conversion'], ['UNDP SIDS Data', 'World Bank Climate Debt Studies']),

  // Sprint CK
  '/vintage-cohort-stranded': g('Vintage Cohort Stranded Engine', 'EP-CK1', 'CK', '20 assets grouped by vintage decade with exponential book value decay and regulatory closure risk.', ce('Vintage-cohort decay model', 'BV(t) = BV\u2080 \u00d7 exp(-\u03bb(age) \u00d7 t)', ['Carbon Tracker', 'IEA'], 'Older vintages (pre-2000 coal plants) have higher stranding probability and faster decay rate (\u03bb). Regulatory closure risk varies by jurisdiction.'), [dp('Assets', '20', null, 'Demo', 'Grouped by vintage decade'), dp('Max Stranding Probability', '89%', 'Pre-2000 coal', 'Model', 'Near-certain stranding for oldest coal assets')], ['Vintage Dashboard groups assets by decade', 'Age-Depreciation Curves show \u03bb by asset type'], ['Carbon Tracker', 'IEA World Energy Outlook']),

  '/cascading-default-modeler': g('Cascading Default Modeler', 'EP-CK2', 'CK', '6-step default chain from stranded asset to bank capital impact. Delta CoVaR systemic risk contribution.', ce('Default cascade chain', 'Cascade: Stranded \u2192 Covenant Breach \u2192 Default \u2192 Loan Loss \u2192 Bank Capital \u2192 Credit Tightening', ['Basel IV', 'Adrian & Brunnermeier'], 'Each step has conditional probability. Delta CoVaR measures each entity\'s contribution to systemic climate risk. Concentration risk analysis identifies sector-level domino effects.'), [dp('Chain Steps', '6', null, 'Model', 'Sequential default propagation'), dp('Systemic Contribution', '0-35%', 'Delta CoVaR', 'Adrian & Brunnermeier', 'Energy sector highest')], ['Default Chain Visualizer shows 6-step cascade', 'Sector Domino Map shows interconnected defaults'], ['Basel IV Framework', 'Adrian & Brunnermeier (2016) CoVaR']),

  '/stranded-recovery-pathways': g('Stranded Recovery Pathways', 'EP-CK3', 'CK', '10 repurposing pathways for stranded assets with conversion CapEx and IRR.', ce('Conversion IRR analysis', 'IRR = rate where NPV(conversion_cash_flows) = 0', ['Sector studies', 'IEA'], '10 pathways: coal\u2192battery storage, refinery\u2192green H\u2082, gas turbine\u2192synchronous condenser, oil platform\u2192offshore wind, coal port\u2192green ammonia, etc.'), [dp('Pathways', '10', null, 'Analysis', 'Conversion options per asset type'), dp('Best IRR', '22%', 'Coal\u2192battery', 'Model', 'Highest return on conversion investment')], ['Repurposing Opportunities shows 10 pathways with CapEx and IRR', 'Case Studies show real-world conversion examples'], ['IEA Net Zero', 'Carbon Tracker Stranded Assets']),

  '/decommissioning-cost-engine': g('Decommissioning Cost Engine', 'EP-CK4', 'CK', '8 asset types with unit decommissioning costs, funding gap analysis, and regulatory bond requirements.', ce('Decommissioning liability estimation', 'Liability = Units \u00d7 CostPerUnit; Gap = Liability - CurrentProvision', ['National regulations', 'IEA'], 'Costs: coal plant ($50-150/kW), nuclear ($500-1000/kW), oil platform ($10-50M), pipeline ($1-5M/km). Funding gap between current balance sheet provisions and estimated costs.'), [dp('Total Liability', '$8.2B', 'Portfolio aggregate', 'Model', 'Across all 8 asset types'), dp('Funding Gap', '$3.1B', 'Liability - Provision', 'Model', '38% underfunded')], ['Liability Overview shows total by asset type', 'Funding Gap Analysis compares provisions vs estimates', 'Regulatory Requirements shows jurisdiction-specific bond mandates'], ['National Decommissioning Regulations', 'IEA Decommissioning Report']),

  '/stranded-asset-watchlist': g('Stranded Asset Watchlist', 'EP-CK5', 'CK', '20-asset interactive watchlist with configurable alert triggers and engagement tracking.', ce('Threshold-based alert system', 'Alert = condition_met(carbon_price, rating_change, tech_crossover, regulation)', ['User-configurable'], '6 alert types: carbon price exceeding threshold, technology cost crossover, regulatory announcement, rating downgrade, covenant near-breach, peer action.'), [dp('Watchlist Assets', '20', null, 'User-curated', 'Assets monitored for stranding signals'), dp('Alert Types', '6', null, 'Configurable', 'Carbon price, tech, regulatory, rating, covenant, peer')], ['Watchlist Dashboard shows 20 assets with alert status', 'Configure alert thresholds per asset', 'Trigger Events log shows historical alerts and responses'], ['User Configuration']),

  '/covenant-breach-predictor': g('Covenant Breach Predictor', 'EP-CK6', 'CK', '15 borrowers with climate-conditional covenant breach probability for leverage, ICR, and DSCR covenants.', ce('Scenario-conditional breach probability', 'P(breach|scenario) = P(financial_ratio < threshold | climate_shock)', ['IFRS 9', 'Basel IV IRB'], 'Each borrower has 3 financial covenants (leverage, interest coverage, debt service coverage). Climate scenarios stress each ratio. Early warning: 6-12 month lead indicators of approaching breach.'), [dp('Borrowers', '15', null, 'Demo', 'With financial covenant data'), dp('Covenants', '3 per borrower', null, 'Loan agreements', 'Leverage, ICR, DSCR')], ['Breach Probability Dashboard shows scenario-conditional P(breach)', 'Early Warning Signals identify 6-12 month leading indicators', 'Remediation Options provide lender action framework'], ['IFRS 9 Financial Instruments', 'Basel IV IRB Framework']),

  // Sprint CL
  '/critical-mineral-constraint': g('Critical Mineral Constraint Engine', 'EP-CL1', 'CL', '8 minerals with supply-demand gap projections, price spike scenarios, substitution elasticity, and recycling penetration curves.', ce('Supply-demand balance model', 'Gap = Demand(t) - Supply(t); Demand = \u03a3_sector[Deployment \u00d7 Intensity]', ['USGS', 'IEA Critical Minerals'], '8 minerals: lithium, cobalt, nickel, copper, REE, graphite, manganese, PGMs. China controls 60-90% of processing. Price spikes modelled under export control scenarios.'), [dp('Minerals', '8', null, 'USGS', 'Critical for energy transition'), dp('China Processing Share', '60-90%', null, 'USGS', 'Dominant processing concentration')], ['Supply-Demand Balance shows gap by mineral 2025-2040', 'Geopolitical Supply Shock models China export control scenarios', 'Recycling Penetration shows urban mining potential'], ['USGS Mineral Commodity Summaries', 'IEA Critical Minerals Review']),

  '/grid-stability-transition': g('Grid Stability Transition Risk', 'EP-CL2', 'CL', 'Grid stability analysis under 0-100% renewable penetration with inertia, storage, curtailment, and capacity market pricing.', ce('Grid inertia decline model', 'Inertia = \u03a3(H_i \u00d7 MVA_i \u00d7 Online_i); RoCoF = \u0394P / (2 \u00d7 Inertia)', ['IEEE', 'IEA'], 'As renewable penetration increases, synchronous inertia decreases (wind/solar are asynchronous). Below critical inertia threshold, frequency stability degrades. Storage requirement grows exponentially above 60% RE.'), [dp('RE Penetration', '0-100%', 'Slider control', 'Model input', 'Adjustable renewable energy share'), dp('Critical Inertia Threshold', '~50% RE', null, 'IEEE', 'Frequency stability risk point')], ['Grid Mix Dashboard shows RE penetration slider with real-time impact', 'Storage Requirements shows GWh needed by RE share', 'Capacity Market Pricing shows clearing price under transition'], ['IEEE Power Systems', 'IEA Electricity Market Report']),

  '/hydrogen-economy-modeler': g('Hydrogen Economy Modeler', 'EP-CL3', 'CL', 'Green/blue/gray H\u2082 cost parity timelines, electrolyzer learning curves, infrastructure buildout, and export hub viability.', ce('Electrolyzer learning curve', 'Cost(t) = Cost\u2082\u2080\u2082\u2084 \u00d7 (CumulativeCapacity(t)/CumulativeCapacity\u2082\u2080\u2082\u2084)^(-LearningRate)', ['Hydrogen Council', 'IRENA', 'IEA'], 'Green H\u2082 reaches parity with gray at ~$2/kg (projected 2028-2032). Three electrolyzer types: Alkaline (cheapest, 70% efficiency), PEM (flexible, 75%), SOEC (most efficient, 85%, earliest stage).'), [dp('Green H\u2082 Parity', '2028-2032', null, 'Hydrogen Council', 'When green H\u2082 cost = gray H\u2082 cost'), dp('Demand Sectors', '4', null, 'IEA', 'Steel (DRI), ammonia, transport, power')], ['H\u2082 Cost Parity Timeline shows green/blue/gray crossover', 'Electrolyzer Learning Curves compare AEL/PEM/SOEC', 'Export Hub Viability assesses 6 potential H\u2082 export hubs'], ['Hydrogen Council', 'IRENA Green Hydrogen', 'IEA Hydrogen Report']),

  '/nuclear-smr-viability': g('Nuclear SMR Viability', 'EP-CL4', 'CL', '5 SMR designs (NuScale, BWRX-300, RR, Xe-100, Natrium) with LCOE, deployment pipeline, and regulatory status.', ce('SMR LCOE comparison', 'LCOE = (CapEx\u00d7CRF + OpEx + Fuel) / AnnualOutput', ['WNA', 'NRC', 'ONR'], '5 designs compared on capacity, cost, deployment timeline, and regulatory approval status. Grid services value stack: baseload + load-following + H\u2082 co-production.'), [dp('Designs Compared', '5', null, 'WNA', 'NuScale VOYGR, BWRX-300, RR SMR, Xe-100, Natrium'), dp('First Commercial', '2029-2035', null, 'NRC/ONR', 'Expected first commercial deployment')], ['Technology Comparison shows 5 designs side-by-side', 'Regulatory Approval Tracker shows NRC/ONR/CNSC status', 'Investment Thesis presents bull and bear cases'], ['World Nuclear Association', 'NRC SMR Applications', 'ONR GDA Process']),

  '/negative-emissions-tech': g('Negative Emissions Tech', 'EP-CL5', 'CL', '6 NETs (DAC, BECCS, enhanced weathering, ocean CDR, biochar, soil carbon) with cost trajectories and portfolio builder.', ce('NET portfolio optimization', 'Minimize: \u03a3(cost_i \u00d7 qty_i) subject to: \u03a3(qty_i) \u2265 target, permanence_i \u2265 min', ['IPCC AR6 WGIII Ch.12', 'IEA CCUS'], 'Current costs range from $20/tCO\u2082 (soil carbon) to $600/tCO\u2082 (DAC). Portfolio builder optimizes across cost, permanence (1yr-10,000yr), and scalability (MtCO\u2082/yr potential).'), [dp('NETs', '6', null, 'IPCC', 'DAC, BECCS, ERW, ocean CDR, biochar, soil carbon'), dp('DAC Cost (current)', '$400-600/tCO\u2082', null, 'IEA CCUS', 'Expected to reach $100-200 by 2040')], ['NET Overview shows 6 technologies with cost/permanence/scalability', 'DAC Cost Trajectory shows 3 learning scenarios', 'Portfolio Builder optimizes NET mix for given budget and permanence target'], ['IPCC AR6 WGIII Chapter 12', 'IEA CCUS Projects Database']),

  '/tech-disruption-watchlist': g('Tech Disruption Watchlist', 'EP-CL6', 'CL', '15 technology disruptions tracked with TRL, patent trends, VC funding, cost crossover countdown, and portfolio exposure.', ce('Technology readiness tracking', 'DisruptionScore = TRL \u00d7 PatentGrowth \u00d7 VCFunding \u00d7 (1/YearsToCrossover)', ['EPO/USPTO', 'PitchBook'], '15 disruptions: solid-state batteries, perovskite solar, green steel, e-fuels, fusion, autonomous EVs, AI grid management, carbon mineralization, cultured meat, vertical farming, etc. Portfolio exposure maps which holdings are at risk.'), [dp('Disruptions Tracked', '15', null, 'Research', 'Across energy, transport, industry, food'), dp('Nearest Crossover', '2-3yr', 'Solid-state batteries', 'BNEF', 'Cost parity with current Li-ion by 2028')], ['Disruption Signal Dashboard shows 15 technologies with status', 'Cost Crossover Countdown shows years to parity', 'Portfolio Exposure maps at-risk holdings'], ['EPO PATSTAT', 'PitchBook VC Data', 'BNEF Tech Reports']),

  // Sprint CM
  '/sbti-credibility-scorer': g('SBTi Credibility Scorer', 'EP-CM1', 'CM', '30 companies scored on 5-pillar SBTi credibility framework with say-do gap quantification.', ce('5-pillar credibility scoring', 'Score = Validation(20) + Ambition(25) + Scope(25) + Interim(15) + CapEx(15)', ['SBTi Corporate Standard', 'CDP'], 'Validation: approved=20, committed=10, self-declared=5. Ambition: 1.5\u00b0C=25, WB2C=15, 2\u00b0C=10. Scope: 1+2+3=25, 1+2=15. Interim: met=15, on-track=10, behind=5. CapEx: green ratio alignment.'), [dp('Companies', '30', null, 'SBTi Database', 'With target data'), dp('Say-Do Gap', '0-45%', 'Target vs actual progress', 'Proprietary', 'Difference between stated ambition and demonstrated action')], ['Credibility Dashboard shows 30 companies with 5-pillar scores', 'Say-Do Gap Quantifier highlights divergence between targets and actions'], ['SBTi Corporate Net-Zero Standard v1.2', 'CDP Climate Change Scores']),

  '/temperature-alignment-waterfall': g('Temperature Alignment Waterfall', 'EP-CM2', 'CM', 'Portfolio ITR decomposition showing sector \u2192 company \u2192 scope contribution with what-if simulator.', ce('Additive ITR waterfall decomposition', 'ITR = 1.5\u00b0C_base + \u03a3(sector_i_contribution) where contribution = weight \u00d7 (company_ITR - 1.5)', ['PACTA', 'GFANZ'], 'Waterfall shows how each sector pulls portfolio ITR above or below 1.5\u00b0C target. Energy sector typically adds +0.8\u00b0C, Technology reduces -0.2\u00b0C. What-if simulator: remove/add holdings and see ITR impact instantly.'), [dp('Portfolio ITR', '2.4\u00b0C', 'Budget method', 'PACTA', 'Implies 2.4\u00b0C warming'), dp('Energy Contribution', '+0.8\u00b0C', 'Sector pull', 'Model', 'Largest positive contributor to ITR')], ['ITR Waterfall shows additive decomposition', 'What-If Simulator lets you toggle holdings on/off'], ['PACTA Methodology', 'GFANZ Sector Pathways']),

  '/net-zero-credibility-index': g('Net Zero Credibility Index', 'EP-CM3', 'CM', '15-KPI net zero credibility framework scoring 0-150 with A-E rating (A\u2265120, E<40).', ce('15-KPI composite credibility', 'Score = \u03a3(KPI_i), each 0-10, total 0-150', ['SBTi', 'CDP', 'InfluenceMap', 'RE100'], '15 KPIs: SBTi validation, CapEx green ratio, R&D clean %, lobbying alignment, exec comp linkage, board climate expertise, Scope 3 coverage, offset dependency, just transition, TCFD quality, CDP score, RE procurement, methane management, supply chain engagement, physical risk disclosure.'), [dp('KPIs', '15', null, 'Multi-source', 'Each scored 0-10'), dp('Max Score', '150', null, 'Composite', 'A\u2265120, B\u2265100, C\u226570, D\u226540, E<40')], ['Credibility Index Dashboard shows composite with radar chart', 'CapEx Alignment shows green vs brown investment ratio', 'Lobbying Consistency cross-checks policy advocacy vs targets'], ['SBTi', 'CDP', 'InfluenceMap', 'RE100']),

  '/scope3-materiality-engine': g('Scope 3 Materiality Engine', 'EP-CM4', 'CM', '15 Scope 3 categories with sector-level materiality ranking, data quality scoring, and improvement roadmap.', ce('Category materiality assessment', 'Materiality = EmissionsShare \u00d7 DataAvailability \u00d7 InfluenceCapacity', ['GHG Protocol Scope 3', 'CDP Supply Chain'], '15 Scope 3 categories ranked by materiality per sector. Data quality 1-5 per category. Cat 11 (Use of Products) dominant for O&G; Cat 1 (Purchased Goods) dominant for retail. Improvement roadmap: cost-benefit of upgrading DQ from level 4 to level 2.'), [dp('Scope 3 Categories', '15', null, 'GHG Protocol', 'Per Corporate Value Chain Standard'), dp('Avg DQ Score', '3.5', null, 'PCAF scale', 'Most categories using estimated data')], ['Category Materiality Map ranks 15 categories by sector', 'Data Quality shows DQ score per category', 'Improvement Roadmap prioritizes DQ upgrades by cost-benefit'], ['GHG Protocol Scope 3 Standard', 'CDP Supply Chain Programme']),

  '/target-vs-action-tracker': g('Target vs. Action Tracker', 'EP-CM5', 'CM', '12 companies tracking stated targets against actual emissions progress, CapEx deployment, and technology adoption.', ce('Target-action gap analysis', 'Gap = (1 - ActualProgress / ExpectedProgress) \u00d7 100%', ['SBTi', 'Company Filings'], 'For each company: stated target (e.g., "50% by 2030") vs actual progress. CapEx tracking: is green CapEx growing fast enough? Technology deployment: are they actually building clean assets? Policy advocacy: lobbying consistent with targets?'), [dp('Companies', '12', null, 'Demo', 'With targets and progress data'), dp('On Track', '42%', null, 'Model', 'Companies likely to meet their targets')], ['Gap Dashboard shows target vs actual for each company', 'CapEx Tracking compares planned vs actual green investment', 'Lobbying Check flags inconsistencies'], ['SBTi Corporate Net-Zero Standard', 'Company Annual Reports']),

  '/peer-transition-benchmarker': g('Peer Transition Benchmarker', 'EP-CM6', 'CM', '6 GICS sectors with 5 peer companies each. 6-pillar radar comparison, best-in-class identification, convergence analysis.', ce('Sector peer benchmarking', 'PeerRank = position in sector quartile (Q1=leaders, Q4=laggards)', ['MSCI', 'Sustainalytics'], 'Head-to-head comparison across 6 transition pillars. Best-in-class: what do Q1 companies do differently? Convergence: are peers converging or diverging over time?'), [dp('Sectors', '6', null, 'GICS', 'Energy, Materials, Utilities, Industrials, Consumer, Tech'), dp('Peers per Sector', '5', null, 'Demo', '30 companies total')], ['Peer Group Builder selects comparison companies', 'Quartile Ranking shows Q1-Q4 distribution', 'Convergence Trend shows if sector is improving together or diverging'], ['MSCI ESG Ratings', 'Sustainalytics ESG Risk']),

  // Sprint CN
  '/carbon-credit-pricing': g('Carbon Credit Pricing Engine', 'EP-CN1', 'CN', '20 credit types with multi-factor pricing model: Base \u00d7 Vintage \u00d7 Methodology \u00d7 Verification \u00d7 Permanence \u00d7 Liquidity.', ce('Multi-factor credit pricing', 'FairPrice = Base \u00d7 VintageFactor \u00d7 MethodFactor \u00d7 VerifFactor \u00d7 PermFactor \u00d7 LiqFactor', ['ICVCM', 'Market data'], 'Vintage: 2024 credits at premium, 2018 at 40-60% discount. Methodology: REDD+ $5-15, ARR $8-20, Renewable $2-8, DAC $200-600.'), [dp('Credit Types', '20', null, 'Market', 'Nature-based, renewable, industrial, CDR'), dp('DAC Credit Price', '$200-600/tCO\u2082', null, 'Puro/Isometric', 'Highest-quality engineered removal credits')], ['Pricing Dashboard shows interactive calculator with factor sliders', 'Vintage Premium/Discount shows time decay of credit value'], ['ICVCM Core Carbon Principles', 'Verra VCS Registry']),

  '/offset-permanence-risk': g('Offset Permanence Risk Modeler', 'EP-CN2', 'CN', '12 offset types with reversal probability modelling, buffer pool stress test, and climate-driven reversal risk.', ce('Reversal probability model', 'P(reversal, decade) = BaseRate \u00d7 (1 + ClimateAmplifier(SSP))', ['ICVCM', 'Buffer pool analysis'], 'Reversal probabilities per decade: forest fire 5-15%, drought 3-8%, peatland re-oxidation 2-5%, DAC leak <0.1%. Climate amplifier increases reversal risk under warming scenarios (more wildfire = more forest offset reversal).'), [dp('Forest Reversal', '5-15%/decade', null, 'Historical', 'Wildfire-driven reversal risk'), dp('DAC Permanence', '>10,000yr', null, 'Geological', 'Lowest reversal risk of any offset type')], ['Permanence Dashboard shows reversal probability by offset type', 'Buffer Pool Stress Test checks if buffer pool covers expected reversals', 'Climate-Driven Reversal shows feedback loop: warming \u2192 more fire \u2192 more reversal'], ['ICVCM CCP', 'Verra Non-Permanence Risk Tool']),

  '/corporate-offset-optimizer': g('Corporate Offset Optimizer', 'EP-CN3', 'CN', 'Quality-cost frontier optimization for corporate offset procurement. Blend optimizer with regulatory acceptance matrix.', ce('Portfolio optimization on quality-cost frontier', 'Minimize: \u03a3(cost_i \u00d7 qty_i) subject to: quality_score \u2265 target, \u03a3(qty_i) \u2265 offset_need', ['ICVCM', 'CORSIA', 'TSVCM'], 'Efficient frontier: quality score (0-100) vs cost ($/tCO\u2082). Regulatory acceptance matrix: which jurisdictions accept which credit types.'), [dp('Frontier Points', '12', null, 'Optimization', 'Pareto-optimal blend combinations')], ['Quality-Cost Frontier shows efficient frontier scatter', 'Blend Optimizer recommends optimal credit mix given budget', 'Regulatory Acceptance Matrix shows jurisdiction compatibility'], ['ICVCM CCP', 'CORSIA Eligible Credits', 'TSVCM Recommendations']),

  '/credit-quality-screener': g('Credit Quality Screener', 'EP-CN4', 'CN', '100 carbon credits screened against ICVCM CCP (5 criteria), additionality, leakage, co-benefits, and red flag detection.', ce('ICVCM 5-criteria quality assessment', 'QualityScore = avg(Additionality, Permanence, Quantification, NoDoubleCounting, NoNetHarm)', ['ICVCM CCP', 'Verra', 'Gold Standard'], 'Each criterion scored 1-5. Red flags: methodology concerns, over-crediting indicators, governance issues.'), [dp('Credits Screened', '100', null, 'Registry data', 'Across Verra, GS, ACR, CAR'), dp('Red Flags', '12%', null, 'Screening', 'Credits with one or more quality concerns')], ['Quality Screener filters 100 credits by criteria', 'ICVCM CCP Alignment shows 5-criteria radar per credit', 'Red Flag Detector highlights specific quality concerns'], ['ICVCM Core Carbon Principles', 'Verra VCS Standard']),

  '/offset-portfolio-tracker': g('Offset Portfolio Tracker', 'EP-CN5', 'CN', '25 credit positions with mark-to-market valuation, retirement schedule, performance tracking, and compliance reporting.', ce('Portfolio mark-to-market', 'MTM = \u03a3(holdings_i \u00d7 current_price_i)', ['Market data', 'PCAF'], 'Vintage distribution and retirement schedule aligned to corporate emission targets. SFDR/CSRD offset disclosure requirements tracked.'), [dp('Positions', '25', null, 'Portfolio', 'Across multiple credit types and vintages'), dp('Total MTM Value', '$4.2M', null, 'Market pricing', 'Current portfolio market value')], ['Portfolio Dashboard shows holdings with MTM values', 'Retirement Schedule aligns retirements to emission targets', 'Compliance Reporting generates SFDR/CSRD offset disclosure'], ['PCAF Standard', 'SFDR RTS', 'CSRD ESRS E1']),

  '/carbon-market-intelligence': g('Carbon Market Intelligence', 'EP-CN6', 'CN', '$950B compliance + $1.7B voluntary carbon market analytics with 8 compliance markets, policy tracker, and 3 forecast models.', ce('Carbon price forecasting', 'Models: mean-reversion OU, trend-following ARIMA, scenario-conditional NGFS', ['ICAP', 'World Bank Carbon Pricing Dashboard'], 'EU ETS dominates compliance markets. VCM: issuance/retirement ratio indicates oversupply (>1.0) or tightening (<1.0). Three forecast models provide range of price projections.'), [dp('Compliance Market Value', '$950B', null, 'ICAP', 'Dominated by EU ETS'), dp('VCM Value', '$1.7B', null, 'Ecosystem Marketplace', 'Voluntary carbon market'), dp('Markets Tracked', '8', null, 'ICAP', 'EU, UK, CA, RGGI, China, Korea, NZ, emerging')], ['Market Overview shows compliance vs voluntary split', 'Regional Deep-Dive covers 8 compliance markets', 'Price Forecast Models show 3 projection approaches'], ['ICAP ETS Map', 'World Bank Carbon Pricing Dashboard', 'Ecosystem Marketplace VCM Report']),

  // Sprint CO
  '/workforce-transition-tracker': g('Workforce Transition Tracker', 'EP-CO1', 'CO', '10 regions with reskilling programme outcome tracking: enrollment, completion, job placement, wage comparison.', ce('Reskilling ROI calculation', 'ROI = (WageGain \u00d7 PlacementRate \u00d7 Years - TrainingCost) / TrainingCost', ['ILO', 'Just Transition Centre'], 'Training ROI considers: upfront training cost, wage differential (fossil vs green), placement success rate, and expected employment duration.'), [dp('Regions', '10', null, 'ILO', 'Global reskilling programme tracking'), dp('Avg Placement Rate', '62%', null, 'Programme data', 'Workers finding green employment after reskilling')], ['Programme Dashboard shows enrollment and outcomes', 'Skills Gap Analysis identifies training needs'], ['ILO World Employment Report', 'Just Transition Centre']),

  '/social-license-risk': g('Social License Risk Engine', 'EP-CO2', 'CO', '15 projects with community benefit agreement tracking, FPIC compliance, and protest/litigation risk.', ce('Social license risk scoring', 'SocialRisk = 0.30\u00d7FPIC + 0.25\u00d7CommunityGap + 0.25\u00d7ProtestRisk + 0.20\u00d7LitigationRisk', ['IFC PS', 'UNDRIP'], 'Promise vs delivery tracking for community benefits (jobs, infrastructure, revenue sharing). Timeline delay risk: social opposition can add 1-5 years to project completion.'), [dp('Projects', '15', null, 'Portfolio', 'With community impact assessments'), dp('Avg Timeline Delay', '2.3yr', null, 'Historical', 'Delay from social opposition')], ['Social License Dashboard shows 15 projects with risk scores', 'Community Benefit Tracking compares promised vs delivered'], ['IFC Performance Standards', 'UNDRIP']),

  '/regional-economic-impact': g('Regional Economic Impact', 'EP-CO3', 'CO', '10 fossil-dependent regions with I/O multiplier analysis, fiscal impact, migration dynamics, and inequality measures.', ce('Input-output regional modelling', 'TotalImpact = DirectJobs \u00d7 IOMultiplier; FiscalImpact = LostRoyalties - NewGreenTax', ['ILO', 'World Bank WDI'], 'I/O multiplier captures indirect supply chain and induced consumer spending effects. Regional Gini coefficient change under transition scenarios.'), [dp('Regions', '10', null, 'Analysis', 'Fossil-dependent regions globally'), dp('Avg I/O Multiplier', '2.4x', null, 'Model', 'Each direct job loss impacts 2.4 indirect/induced jobs')], ['Regional Economy Dashboard shows fossil dependency metrics', 'Input-Output Model decomposes direct, indirect, induced effects', 'Migration Dynamics shows population outflow projections'], ['ILO World Employment Report', 'World Bank WDI']),

  '/indigenous-rights-fpic': g('Indigenous Rights & FPIC', 'EP-CO4', 'CO', '20 projects in indigenous territories with consent tracking, rights framework compliance, and cultural heritage impact.', ce('FPIC compliance scoring', 'FPICScore = ConsentStatus(30) + ProcessQuality(25) + BenefitSharing(25) + GrievanceMech(20)', ['UNDRIP', 'ILO C169', 'IFC PS7'], 'Consent status: obtained, pending, withheld, not sought. Rights frameworks: UNDRIP, ILO Convention 169, IFC PS7. Cultural heritage impact on sacred sites and traditional knowledge.'), [dp('Projects', '20', null, 'Portfolio', 'In or near indigenous territories'), dp('FPIC Compliance', '65%', null, 'Assessment', 'Projects with adequate FPIC process')], ['FPIC Dashboard shows consent status per project', 'Cultural Heritage Impact assesses sacred site risks'], ['UNDRIP', 'ILO Convention 169', 'IFC Performance Standard 7']),

  '/green-jobs-pipeline-tracker': g('Green Jobs Pipeline', 'EP-CO5', 'CO', '8 green sectors with 2025-2040 job projections, skills taxonomy, wage analysis, and geographic distribution.', ce('Sector job projection model', 'Jobs(sector, year) = Deployment(sector, year) \u00d7 Jobs_per_unit(sector)', ['IRENA Jobs Review', 'ILO'], '8 sectors: solar installation, wind turbine, EV manufacturing, battery production, green H\u2082, building retrofit, nature restoration, circular economy. Skills taxonomy maps required qualifications and retraining pathways.'), [dp('Green Jobs 2030', '65M', null, 'IRENA/ILO', 'Global projection across 8 sectors'), dp('Top Sector', 'Solar Installation', null, 'IRENA', 'Largest employer in clean energy')], ['Green Jobs Dashboard shows 8-sector pipeline', 'Skills Taxonomy maps qualifications to green roles', 'Wage Analysis compares green vs fossil sector pay'], ['IRENA Renewable Energy and Jobs', 'ILO Green Jobs Report']),

  '/just-transition-finance-hub': g('Just Transition Finance Hub', 'EP-CO6', 'CO', 'EU Just Transition Fund (\u20ac17.5B), JETP tracker ($43.5B total), sovereign JT bonds, MDB programmes, and impact measurement.', ce('JTF instrument mapping', 'Coverage = \u03a3(instrument_allocations) / Estimated_JT_need', ['EU JTF Regulation', 'JETP Secretariats'], 'Comprehensive tracker of all just transition finance instruments. JETP deals: South Africa $8.5B, Indonesia $20B, Vietnam $15.5B. Impact metrics: jobs transitioned, emissions avoided, community wellbeing index.'), [dp('EU JTF', '\u20ac17.5B', null, 'EC Cohesion', 'EU Just Transition Fund allocation'), dp('JETP Total', '$43.5B', null, 'JETP Secretariats', 'Across 3 country partnerships')], ['Finance Overview shows all JT instruments', 'JETP Tracker monitors $43.5B in country partnerships', 'Impact Measurement tracks jobs transitioned and emissions avoided'], ['EU JTF Regulation', 'JETP Implementation Plans']),

  // Sprint CP
  '/engagement-outcome-tracker': g('Engagement Outcome Tracker', 'EP-CP1', 'CP', '30 engagements with CA100+ progress tracking, milestone monitoring, and escalation history.', ce('Engagement effectiveness scoring', 'Effectiveness = MilestonesAchieved / MilestonesTargeted \u00d7 100', ['CA100+', 'IIGCC', 'PRI'], 'Engagement lifecycle: letter \u2192 meeting \u2192 commitment \u2192 action \u2192 verification. Escalation: dialogue \u2192 enhanced \u2192 vote against \u2192 public statement \u2192 divestment.'), [dp('Engagements', '30', null, 'Stewardship', 'Active company engagements'), dp('CA100+ Focus', '8', null, 'CA100+', 'Focus companies in portfolio')], ['Engagement Dashboard shows 30 engagements with status', 'CA100+ Progress tracks 10 Net Zero benchmark indicators', 'Escalation History logs escalation actions taken'], ['CA100+ Net Zero Company Benchmark', 'IIGCC Net Zero Stewardship Toolkit']),

  '/proxy-voting-climate': g('Proxy Voting Climate Analyzer', 'EP-CP2', 'CP', '50 climate shareholder resolutions with Say-on-Climate tracking, management vs shareholder alignment, and director climate scoring.', ce('Voting alignment analysis', 'Alignment = votes_with_climate_policy / total_climate_votes', ['IIGCC', 'PRI Voting Guidelines'], 'Say-on-Climate: advisory vote on company climate transition plan. Director climate score: expertise + training + committee membership.'), [dp('Resolutions', '50', null, 'Proxy season', 'Climate-related shareholder resolutions'), dp('Say-on-Climate', '25 companies', null, 'ISS/Glass Lewis', 'Companies with climate transition plan votes')], ['Voting Dashboard shows 50 resolution outcomes', 'Say-on-Climate Tracker shows vote results and trends', 'Director Climate Score ranks board members by expertise'], ['IIGCC Voting Expectations', 'PRI Practical Guide to Voting']),

  '/stewardship-report-generator': g('Stewardship Report Generator', 'EP-CP3', 'CP', 'UK Stewardship Code 2020 (12 Principles), ICGN Global Stewardship Principles, PRI signatory reporting. Case study generator and export.', ce('Multi-framework stewardship reporting', 'Compliance = Principles_met / Total_principles per framework', ['UK Stewardship Code', 'ICGN', 'PRI'], 'Templates auto-populated from engagement data. Case study generator selects an engagement and produces a structured narrative with data points.'), [dp('UK Code Principles', '12', null, 'FRC', 'UK Stewardship Code 2020'), dp('ICGN Principles', '8', null, 'ICGN', 'Global Stewardship Principles')], ['Report Builder selects framework and populates from data', 'Case Study Generator creates engagement narratives', 'Export produces PDF/Word for publication'], ['UK Stewardship Code 2020', 'ICGN Global Stewardship Principles', 'PRI Annual Assessment']),

  '/shareholder-resolution-analyzer': g('Shareholder Resolution Analyzer', 'EP-CP4', 'CP', '100 climate/ESG resolutions (2020-2025) with success rate trends, topic classification, filer analysis, and impact assessment.', ce('Resolution success tracking', 'SuccessRate = Resolutions_with_majority / Total_resolutions', ['ProxyMonitor', 'ShareAction'], 'Topics: emissions targets, lobbying disclosure, climate risk reporting, just transition, deforestation, methane.'), [dp('Resolutions', '100', null, 'Proxy data', '5-year database'), dp('Avg Support', '32%', null, 'Market data', 'Average shareholder support for climate resolutions')], ['Resolution Database shows 100 resolutions with outcomes', 'Success Rate Trends shows improving support over 5 years', 'Topic Classification breaks down by theme'], ['ProxyMonitor Database', 'ShareAction Voting Tracker']),

  '/board-climate-competence': g('Board Climate Competence', 'EP-CP5', 'CP', '25 companies with director-level climate expertise scoring, climate committee status, and peer benchmarking.', ce('Board climate competence scoring', 'Score = Expertise(30) + Committee(25) + Training(20) + Diversity(15) + Accountability(10)', ['UK Corporate Governance Code', 'TCFD'], 'Director profiles: climate expertise, relevant experience, training history. Climate committee: existence, mandate, meeting frequency. Competence score 0-100.'), [dp('Companies', '25', null, 'Governance data', 'With board-level climate data'), dp('Avg Competence Score', '52', null, 'Assessment', 'Significant room for improvement')], ['Competence Dashboard shows 25 companies ranked by score', 'Director Profiles detail individual expertise', 'Climate Committee Status checks existence and mandate'], ['UK Corporate Governance Code', 'TCFD Good Practice Handbook']),

  '/esg-integration-dashboard': g('ESG Integration Dashboard', 'EP-CP6', 'CP', 'ESG integration effectiveness with alpha attribution (FF5 + ESG factor), risk reduction evidence, client reporting, and process maturity.', ce('ESG alpha attribution', 'R_portfolio = \u03b1_ESG + \u03b2_mkt\u00b7MKT + \u03b2_smb\u00b7SMB + \u03b2_hml\u00b7HML + \u03b2_rmw\u00b7RMW + \u03b2_cma\u00b7CMA + \u03b5', ['Fama-French', 'PRI'], 'ESG integration impact: alpha attributable to ESG factor, risk reduction (lower drawdown, lower volatility), PRI assessment scores.'), [dp('ESG Alpha', '+1.2% p.a.', 'FF5 + ESG regression', 'Model', 'Risk-adjusted return from ESG integration'), dp('PRI Assessment', 'A+', null, 'PRI', 'Highest possible score for ESG integration')], ['Integration Overview shows alpha and risk metrics', 'Alpha Attribution isolates ESG factor contribution', 'Process Maturity shows PRI Assessment scores over time'], ['Fama-French 5-Factor Model', 'PRI Assessment Methodology']),

  // Sprint CQ
  '/green-bond-portfolio-optimizer': g('Green Bond Portfolio Optimizer', 'EP-CQ1', 'CQ', 'Mean-variance optimization for 50 green bonds with greenium impact, taxonomy alignment constraints, and duration matching.', ce('Mean-variance with green constraints', 'Minimize: \u03c3\u00b2(w) subject to: return \u2265 target, taxonomy_aligned \u2265 80%, duration \u00b10.5yr', ['Markowitz MPT', 'EU Taxonomy'], 'Efficient frontier shifts left/down with green constraint due to greenium (negative spread premium). Duration matching ensures interest rate risk is controlled.'), [dp('Bond Universe', '50', null, 'CBI', 'Green bond universe'), dp('Greenium', '-15 to -30bps', null, 'Market data', 'Green bonds yield less than conventional')], ['Optimizer Dashboard shows efficient frontier with/without green constraint', 'Greenium Impact quantifies return sacrifice', 'Duration Matching ensures TE control'], ['Markowitz Modern Portfolio Theory', 'EU Taxonomy Regulation', 'CBI Certified Universe']),

  '/transition-bond-credibility': g('Transition Bond Credibility', 'EP-CQ2', 'CQ', '20 SLB/transition bonds with KPI strength scoring, step-up probability, and use-of-proceeds verification.', ce('KPI credibility assessment', 'P(miss) = P(KPI < target); ExpectedCost = P(miss) \u00d7 StepUpBps', ['ICMA SLB Principles'], 'Weak KPIs: already achieved, not ambitious. Strong KPIs: stretch target requiring real operational change. Step-up probability estimates likelihood of coupon increase.'), [dp('Bonds', '20', null, 'Market', 'SLB and transition bonds'), dp('Avg Step-Up', '+37bps', null, 'Prospectus data', 'Average coupon step-up if KPI missed')], ['Bond Universe shows 20 instruments with KPI details', 'KPI Strength Scoring rates ambition level', 'Issuer Cross-Check verifies transition plan from EP-AL5'], ['ICMA SLB Principles', 'ICMA Transition Finance Handbook']),

  '/blended-finance-structurer': g('Blended Finance Structurer', 'EP-CQ3', 'CQ', '5 deal templates with tranche design (first-loss/mezzanine/senior), DFI catalytic ratio, and impact-return frontier.', ce('Tranche-based structuring', 'CatalyticRatio = Commercial_mobilized / Concessional_deployed', ['Convergence', 'DFI Working Group'], '5 templates: renewable energy, NbS, adaptation infrastructure, clean transport, energy efficiency. First-loss (DFI/philanthropy) absorbs initial risk, enabling commercial senior tranche. Typical catalytic ratio: $1 concessional mobilizes $3-8 commercial.'), [dp('Deal Templates', '5', null, 'Convergence', 'Sector-specific structures'), dp('Catalytic Ratio', '3-8x', null, 'DFI data', '$1 concessional \u2192 $3-8 commercial')], ['Structure Builder designs tranche waterfall', 'DFI Catalytic Ratio shows leverage achieved', 'Impact-Financial Frontier shows risk-return by tranche'], ['Convergence Blended Finance Database', 'DFI Working Group on Blended Finance']),

  '/climate-bond-index-tracker': g('Climate Bond Index Tracker', 'EP-CQ4', 'CQ', 'CBI certified bond universe with performance comparison vs conventional, sector allocation, and new issuance monitor.', ce('Index performance tracking', 'ExcessReturn = GreenBondIndex_return - BloombergAgg_return', ['CBI', 'Bloomberg'], 'CBI certified bond universe. Performance comparison: green bond index vs Bloomberg Global Aggregate. Sector allocation: energy, transport, buildings, water, waste.'), [dp('CBI Universe', '$3.5T+', null, 'CBI', 'Total outstanding certified bonds'), dp('New Issuance', '$500B/yr', null, 'CBI', 'Annual green/sustainability issuance')], ['Index Dashboard shows CBI certified universe metrics', 'Performance shows green vs conventional comparison', 'New Issuance Monitor tracks monthly pipeline'], ['Climate Bonds Initiative', 'Bloomberg Green Bond Indices']),

  '/green-loan-framework': g('Green Loan Framework', 'EP-CQ5', 'CQ', '20 green/sustainability-linked loans with GLP/SLLP compliance, margin ratchet modelling, and covenant design.', ce('Margin ratchet modelling', 'Margin_adj = Margin_base - RatchetBps \u00d7 KPI_met_flag', ['LMA GLP', 'LMA SLLP'], 'Green Loan Principles and Sustainability-Linked Loan Principles compliance. Margin ratchet: if borrower meets ESG KPI, margin reduces by specified bps. Covenant design: which KPIs, thresholds, and testing frequency.'), [dp('Loans', '20', null, 'Portfolio', 'Green and sustainability-linked'), dp('Avg Ratchet', '-12bps', null, 'Loan docs', 'Margin reduction for meeting ESG targets')], ['Loan Portfolio shows GLP/SLLP alignment', 'Margin Ratchet Modeler calculates expected margin reduction', 'Covenant Design helps structure ESG KPIs'], ['LMA Green Loan Principles', 'LMA Sustainability-Linked Loan Principles']),

  '/impact-bond-analytics': g('Impact Bond Analytics', 'EP-CQ6', 'CQ', '15 impact bonds (SIBs, DIBs, sustainability bonds) with SROI calculation, outcome measurement, and additionality assessment.', ce('Social Return on Investment', 'SROI = SocialValue_created / Investment_amount', ['IMP', 'GIIN'], 'SROI measures social value per dollar invested. Outcome tracking: actual vs target for education, health, environmental outcomes. Additionality: would outcomes have occurred without the bond?'), [dp('Impact Bonds', '15', null, 'Market', 'SIBs, DIBs, and sustainability bonds'), dp('Avg SROI', '3.2x', null, 'Impact reports', '$1 invested generates $3.2 of social value')], ['Impact Bond Universe shows 15 instruments', 'SROI Calculator computes social return ratio', 'Outcome Tracking compares actual vs target results'], ['Impact Management Project', 'GIIN IRIS+ Metrics']),

  // Sprint CR
  '/csrd-esrs-full-suite': g('CSRD ESRS E1-E5 Full Suite', 'EP-CR1', 'CR', 'Complete CSRD environmental standards: E1 Climate (12 DRs, 40 datapoints), E2 Pollution, E3 Water, E4 Biodiversity, E5 Circular Economy. Double materiality assessment.', ce('ESRS double materiality assessment', 'Material = FinancialMateriality OR ImpactMateriality (either triggers disclosure)', ['EFRAG ESRS', 'EU CSRD Delegated Act'], 'Each of 5 environmental standards has disclosure requirements with mandatory and conditional datapoints. Double materiality: a topic is material if it has significant financial impact OR significant impact on people/environment. IRO assessment: Impact, Risk, Opportunity per topic.'), [dp('ESRS Standards', '5', null, 'EFRAG', 'E1 Climate, E2 Pollution, E3 Water, E4 Biodiversity, E5 Circular'), dp('Total Datapoints', '100+', null, 'ESRS', 'Across all 5 environmental standards'), dp('Double Materiality', 'Financial OR Impact', null, 'CSRD', 'Either trigger activates disclosure requirement')], ['ESRS Overview shows all 5 standards with completeness', 'E1 Climate tab covers 12 disclosure requirements and 40 datapoints', 'Each standard shows IRO assessment and materiality determination'], ['EFRAG European Sustainability Reporting Standards', 'EU CSRD Delegated Act (2023)']),

  '/global-disclosure-tracker': g('Global Disclosure Tracker', 'EP-CR2', 'CR', '12 jurisdictions with cross-walk matrix, gap analysis, timeline, and compliance cost estimator.', ce('Cross-jurisdiction requirement mapping', 'Overlap = SharedRequirements / UnionOfRequirements', ['ISSB', 'EFRAG', 'SEC', 'HKEX'], '12 jurisdictions: EU (CSRD), UK (TPT/SDR), US (SEC), HK, SG, AU, JP, KR, BR, IN, CA, ZA. Cross-walk shows which requirements overlap and which are unique per jurisdiction.'), [dp('Jurisdictions', '12', null, 'Regulatory mapping', 'Global coverage'), dp('Unique Requirements', '15-25%', null, 'Cross-walk', 'Requirements not shared with any other jurisdiction')], ['Jurisdiction Map shows 12 regulatory regimes', 'Cross-Walk Matrix highlights overlaps and gaps', 'Timeline shows effective dates and deadlines'], ['ISSB IFRS S1/S2', 'EFRAG ESRS', 'SEC Climate Rule']),

  '/assurance-readiness-engine': g('Assurance Readiness Engine', 'EP-CR3', 'CR', 'ISAE 3000/3410 readiness assessment with evidence scoring, control testing, and limited vs reasonable assurance gap.', ce('Assurance readiness scoring', 'Readiness = Evidence(25) + Controls(25) + Lineage(25) + Documentation(25)', ['ISAE 3000', 'ISAE 3410'], 'ISAE 3000: assurance on sustainability information. ISAE 3410: assurance on GHG statements. Limited assurance = negative form ("nothing has come to our attention"). Reasonable assurance = positive form ("in our opinion, fairly presented").'), [dp('Readiness Score', '0-100', null, 'Self-assessment', 'Across 4 dimensions'), dp('Gap (Limited\u2192Reasonable)', '15-25 points', null, 'Model', 'Additional effort for reasonable vs limited assurance')], ['Readiness Dashboard shows overall score and dimension breakdown', 'ISAE 3000 Checklist shows requirement-by-requirement status', 'Limited vs Reasonable shows gap and upgrade path'], ['ISAE 3000 (Revised)', 'ISAE 3410 GHG Assurance']),

  '/xbrl-climate-taxonomy': g('XBRL Climate Taxonomy Mapper', 'EP-CR4', 'CR', 'ISSB S2 XBRL taxonomy (200+ tags) and ESRS E1 ESEF tags. Tag mapping tool and filing preview.', ce('Taxonomy tag mapping', 'Match = PlatformMetric \u2192 XBRL_Tag using semantic matching', ['ISSB XBRL Taxonomy', 'ESRS ESEF'], 'ISSB S2 taxonomy: 200+ tags for climate disclosure in machine-readable format. ESRS E1 ESEF: European Single Electronic Format tags. Mapping links platform data to correct XBRL tags for regulatory filing.'), [dp('ISSB S2 Tags', '200+', null, 'IFRS Foundation', 'Machine-readable climate disclosure tags'), dp('ESRS E1 Tags', '80+', null, 'EFRAG', 'European electronic format tags')], ['Taxonomy Browser shows all available XBRL tags', 'Tag Mapping Tool links platform metrics to tags', 'Validation Engine checks completeness and consistency', 'Filing Preview renders tagged document'], ['ISSB XBRL Taxonomy', 'ESRS ESEF Taxonomy']),

  '/regulatory-change-radar': g('Regulatory Change Radar', 'EP-CR5', 'CR', '50 active regulatory changes tracked globally with consultations, effective dates, impact assessment, and response tracking.', ce('Regulatory impact scoring', 'Impact = Scope \u00d7 Materiality \u00d7 Urgency', ['Policy trackers'], '50 active regulatory changes across climate, ESG, taxonomy, and disclosure. Each with: status (proposed/consultation/enacted), effective date, impact assessment on platform modules and portfolio holdings. Response tracker monitors consultation submissions.'), [dp('Active Changes', '50', null, 'Global tracking', 'Regulatory developments in progress'), dp('Consultations Open', '12', null, 'Various', 'Comment periods currently accepting input')], ['Radar Dashboard shows all 50 changes with status', 'Effective Dates calendar view of upcoming milestones', 'Impact Assessment identifies affected modules and holdings'], ['IOSCO', 'FSB', 'NGFS', 'Various national regulators']),

  '/compliance-workflow-automation': g('Compliance Workflow Automation', 'EP-CR6', 'CR', 'Automated workflows for CSRD, TCFD, ISSB S2, SFDR, and UK TPT with task assignment, deadline management, and approval chains.', ce('Workflow task decomposition', 'Completion = CompletedTasks / TotalTasks; OnTrack = AllDeadlinesMet', ['Process management'], 'Each regulatory framework decomposed into tasks with: responsible person, deadline, evidence checklist, approval chain. Multi-level approval: preparer \u2192 reviewer \u2192 approver \u2192 signatory.'), [dp('Frameworks', '5', null, 'Compliance', 'CSRD, TCFD, ISSB S2, SFDR, UK TPT'), dp('Workflow Steps', '20-40 per framework', null, 'Task decomposition', 'Granular task-level tracking')], ['Workflow Dashboard shows all 5 framework workflows', 'Task Assignment distributes work with deadlines', 'Evidence Collection tracks required documentation', 'Approval Chain manages multi-level sign-off'], ['CSRD Reporting Process', 'TCFD Implementation Guide']),

  // Sprint CS
  '/transition-risk-taxonomy-browser': g('Transition Risk Taxonomy Browser', 'EP-CS1', 'CS', 'Interactive 4-level hierarchical taxonomy with 472 nodes covering 9 transition risk topics, 316 leaf-level assessment points, and 24 reference data sources.',
    ce('Bottom-up weighted aggregation', 'ParentScore = \u03a3(child.score \u00d7 child.weight) / \u03a3(child.weight)', ['PCAF DQ 1-5', 'NGFS Phase 5', 'IPCC AR6', 'EU CSRD ESRS'], 'Scores aggregate from 316 leaf nodes (Level 4) upward through L3, L2, to 9 L1 topics. Data quality propagates as minimum of children. Confidence intervals: parent_CI = \u221a(\u03a3(child_CI\u00b2 \u00d7 weight\u00b2)) / \u03a3(weight).'),
    [dp('Level 1 Nodes', '9', null, 'taxonomyTree.js', 'Carbon, Energy, Policy, Technology, Physical, Nature, Social, Governance, Geopolitical'), dp('Level 4 Leaves', '316', null, 'taxonomyTree.js', 'Deepest assessment points'), dp('Data Sources', '24', null, 'REFERENCE_DATA_SOURCES', 'CDP, SBTi, PCAF, NGFS, IEA, WRI GPPD, etc.'), dp('Sectors', '17', null, 'HIGH_IMPACT_SECTORS', '12 NACE high-impact + 5 extended'), dp('Countries', '93', null, 'GEOGRAPHIC_REGIONS', 'Across 12 regions with NDC targets')],
    ['Select L1 topic to expand sub-topics', 'Click any node to see weight, data sources, quality rating', 'Coverage Matrix identifies nodes without primary sources', 'Sector Overlay shows NACE sector applicability', 'Configuration tab adjusts weights (must sum to 100%)'],
    ['PCAF Global GHG Standard v3', 'NGFS Phase 5', 'IPCC AR6', 'EU CSRD ESRS', 'GHG Protocol']),

  '/assessment-engine-dashboard': g('Assessment Engine Dashboard', 'EP-CS2', 'CS', 'Score aggregation dashboard with sunburst visualization, entity heatmap, scenario comparison, and quarterly trend analysis.',
    ce('Bottom-up aggregation + scenario sensitivity', 'CompositeScore = \u03a3(L1_i \u00d7 weight_i) / \u03a3(weight_i)', ['NGFS Phase 5', 'PCAF'], 'Rating: A(\u226580), B(\u226560), C(\u226540), D(\u226520), E(<20). Scenario sensitivity applies NGFS multipliers.'),
    [dp('Portfolio Score', '58/100', 'AUM-weighted', 'Aggregation', 'Exposure-weighted average across entities'), dp('Rating', 'C', 'scoreToRating()', 'Model', 'Moderate transition position')],
    ['Portfolio Overview shows aggregate score', 'Sunburst visualizes L1/L2 hierarchy', 'Entity heatmap shows entities \u00d7 topics', 'Scenario Comparison toggles NGFS scenarios'],
    ['NGFS Phase 5', 'PCAF Standard']),

  '/data-source-registry': g('Data Source Registry', 'EP-CS3', 'CS', '24 reference data sources with quality monitoring, coverage gap identification, and new source recommendations.',
    ce('Data quality assessment', 'DQ_composite = avg(completeness, timeliness, accuracy, coverage)', ['PCAF DQ 1-5'], '24 sources assessed on 4 quality dimensions. Coverage gaps identify taxonomy L4 nodes without a primary data source.'),
    [dp('Sources', '24', null, 'Registry', 'CDP, SBTi, IEA, WRI GPPD, etc.'), dp('Avg Quality', '2.4', null, 'PCAF scale', '1=best, 5=worst')],
    ['Source Catalog shows all 24 sources with quality badges', 'Coverage Gaps identifies uncovered taxonomy nodes', 'New Source Identifier recommends additional public data'],
    ['PCAF Data Quality Framework']),

  '/ml-taxonomy-scoring': g('ML Taxonomy Scoring Engine', 'EP-CS4', 'CS', 'XGBoost ML model using 316 taxonomy features for 12-month forward transition score prediction with SHAP explainability and conformal intervals.',
    ce('XGBoost ensemble with conformal prediction', 'y_hat = XGBoost(features_316); CI = [y_hat - q_\u03b1, y_hat + q_\u03b1]', ['SHAP (Lundberg 2017)', 'Conformal Prediction (Vovk 2005)'], '316 leaf-node scores as features. XGBoost: n_estimators=500, max_depth=6, lr=0.05. Conformal prediction: 90% coverage intervals from calibration set. SHAP values for per-prediction interpretability.'),
    [dp('Features', '316', null, 'Taxonomy leaves', 'One feature per L4 node'), dp('R\u00b2', '0.78', null, 'Cross-validation', 'Model explanatory power'), dp('Coverage', '90%', null, 'Conformal', 'Prediction interval coverage rate')],
    ['Model Config adjusts hyperparameters', 'Training Dashboard shows loss curves', 'SHAP Explainer shows top 15 features per entity', 'Calibration Plot validates prediction quality'],
    ['Lundberg & Lee (2017) SHAP', 'Vovk et al. (2005) Conformal Prediction', 'Chen & Guestrin (2016) XGBoost']),

  '/taxonomy-risk-report': g('Taxonomy Risk Report', 'EP-CS5', 'CS', 'Report generator with executive summary, entity-level reports, comparative analysis, regulatory mapping, and multi-format export.',
    ce('Report template engine', 'Auto-populates from assessment data with regulatory framework mapping', ['TCFD', 'ISSB S2', 'CSRD'], 'Executive summary: portfolio-level L1 scores with A-E ratings. Entity reports: per-entity drill-down. Regulatory mapping: which assessment data covers TCFD/ISSB/CSRD requirements.'),
    [dp('Export Formats', '4', null, 'Engine', 'PDF, Excel, JSON, XBRL')],
    ['Executive Summary shows portfolio-level overview', 'Entity Reports provides per-entity detail', 'Regulatory Mapping shows framework coverage', 'Export Centre generates PDF/Excel/JSON/XBRL'],
    ['TCFD Recommendations', 'ISSB IFRS S2', 'CSRD ESRS']),

  '/assessment-configuration': g('Assessment Configuration', 'EP-CS6', 'CS', 'Configurable weights, rating thresholds, scenario parameters, data quality rules, and full audit trail.',
    ce('Configuration management', 'All changes logged with user, timestamp, and reason', ['Governance'], 'L1 weight sliders (must sum to 100%). A/B/C/D/E threshold boundaries adjustable. 6 NGFS scenario multipliers configurable. DQ rules: minimum quality for inclusion.'),
    [dp('Weight Dimensions', '9', null, 'L1 topics', 'Each adjustable 0-30%'), dp('Rating Bands', '5', null, 'A-E', 'Configurable thresholds')],
    ['Weight Editor adjusts L1 weights with sum validation', 'Threshold Config sets A/B/C/D/E rating boundaries', 'Scenario Setup configures NGFS multipliers', 'Audit Log shows all configuration changes'],
    ['Internal Governance Framework']),

  // Sprint CT
  '/fi-client-portfolio-analyzer': g('FI Client Portfolio Analyzer', 'EP-CT1', 'CT', '50 borrowers across 12 NACE high-impact sectors with IFRS 9 staging, transition scores, and watchlist.',
    ce('IFRS 9 + climate overlay', 'ECL = PD \u00d7 LGD \u00d7 EAD; PD_climate = PD_base \u00d7 (1 + \u03b3 \u00d7 \u0394score)', ['IFRS 9', 'Basel IV', 'ECB SREP', 'PCAF'], 'Each borrower assessed against full taxonomy. IFRS 9: Stage 1 (12m ECL), Stage 2 (lifetime, PD>2x), Stage 3 (impaired). HHI concentration index per sector/geography.'),
    [dp('Borrowers', '50', null, 'Demo', 'Across 12 NACE sectors'), dp('Total Exposure', '$12.1B', null, 'Portfolio', 'Aggregate client exposure'), dp('Watchlist', '19', null, 'Score < 40', 'High-risk clients requiring engagement'), dp('Sector HHI', '0.15', null, 'Herfindahl-Hirschman', 'Moderate sector concentration')],
    ['Client Overview shows all 50 borrowers sortable by score/exposure', 'Sector Concentration shows TreeMap visualization', 'Geography Heatmap shows exposure by 12 regions', 'Watchlist filters to high-risk clients with Engage button'],
    ['IFRS 9 (IASB)', 'Basel IV (BCBS)', 'ECB SREP Methodology', 'PCAF Standard']),

  '/fi-instrument-exposure': g('FI Instrument Exposure', 'EP-CT2', 'CT', '200 instruments across 8 types including capital markets products. Climate VaR by instrument, green vs brown classification.',
    ce('Instrument-level climate risk', 'ClimateVaR_instrument = Notional \u00d7 SectorRisk \u00d7 Maturity_factor', ['Basel IV', 'EU Taxonomy'], '8 types: term loan, revolver, bond, CDS, equity swap, mortgage, trade finance, guarantee. Green classification: EU Taxonomy aligned %, ICMA framework.'),
    [dp('Instruments', '200', null, 'Portfolio', 'Across 8 types'), dp('Green Classified', '28%', null, 'EU Taxonomy', 'Instruments meeting green criteria'), dp('Avg Climate VaR', '3.2%', null, 'Model', 'Instrument-level climate risk')],
    ['Instrument Summary shows type distribution', 'Maturity Profile shows concentration by year', 'Green vs Brown classifies instruments by taxonomy alignment'],
    ['Basel IV CRE20', 'EU Taxonomy Regulation', 'ICMA Principles']),

  '/fi-line-of-business': g('FI Line of Business Risk', 'EP-CT3', 'CT', '6 LoBs with risk attribution, revenue efficiency, and marginal contribution analysis.',
    ce('LoB risk attribution', 'RiskContribution = LoB_exposure \u00d7 (100 - LoB_score) / Total; RevenueEfficiency = Revenue% / Risk%', ['Basel IV', 'BCBS 239'], '6 LoBs: Corporate Banking, Investment Banking, Wealth Management, Insurance, Transaction Banking, Markets. Marginal contribution: impact of $100M additional exposure on portfolio risk.'),
    [dp('LoBs', '6', null, 'Organizational', 'Business line decomposition'), dp('Highest Risk LoB', 'Corporate Banking', null, 'Attribution', '42% of total risk')],
    ['LoB Overview shows exposure and score per business line', 'Risk Attribution shows contribution to total portfolio risk', 'Revenue vs Risk identifies efficient and inefficient LoBs'],
    ['Basel IV Framework', 'BCBS 239 Risk Data Aggregation']),

  '/fi-regulatory-capital-overlay': g('FI Regulatory Capital Overlay', 'EP-CT4', 'CT', 'Basel IV RWA with climate adjustment, Pillar 2 add-on estimation, stress capital buffer, and ECB/BoE alignment.',
    ce('Climate-adjusted regulatory capital', 'RWA_climate = RWA_base + ClimateAddon; CET1_ratio = CET1 / RWA_climate', ['Basel IV', 'ECB SREP', 'BoE PRA'], 'Capital stack: CET1 + CCB + CCyB + G-SIB buffer + P2R + Climate addon. Output floor: IRB RWA \u2265 72.5% of SA RWA (phased 2025-2028). ECB SREP: climate risk assessment in Pillar 2.'),
    [dp('Climate P2R Addon', '50-150bps', null, 'ECB SREP', 'Pillar 2 climate risk add-on'), dp('Output Floor Impact', '+8-15% RWA', null, 'Basel IV', 'Binding for 30% of portfolios')],
    ['Capital Requirements shows full capital stack', 'RWA by Asset Class with climate adjustment', 'ECB/BoE Comparison shows regulatory alignment gaps'],
    ['Basel IV Final Framework', 'ECB SREP Climate Methodology', 'BoE SS3/19']),

  '/fi-concentration-monitor': g('FI Concentration Monitor', 'EP-CT5', 'CT', 'Sector, country, and single-name limits with HHI analysis, traffic light monitoring, and breach history.',
    ce('Concentration limit monitoring', 'HHI = \u03a3(share_i\u00b2); Utilization = CurrentExposure / Limit', ['Basel IV Large Exposures', 'Internal risk framework'], 'Traffic lights: green (<80% utilization), amber (80-95%), red (>95%). HHI thresholds: >0.25 = highly concentrated, <0.15 = diversified.'),
    [dp('Sector Limits', '12', null, 'Risk framework', 'One per NACE sector'), dp('HHI (sector)', '0.15', null, 'Calculated', 'Moderate concentration')],
    ['Limit Dashboard shows all limits with traffic lights', 'HHI Analysis computes sector and geographic concentration', 'Breach History logs past limit exceedances and responses'],
    ['Basel IV Large Exposures Framework']),

  '/fi-transition-dashboard': g('FI Transition Dashboard', 'EP-CT6', 'CT', 'FI executive dashboard with 6 KPIs, taxonomy drill-down, client risk scatter, regulatory readiness, and board report generator.',
    ce('Multi-module KPI aggregation for FIs', 'Portfolio_Score = exposure_weighted_avg(client_scores)', ['TCFD', 'ECB', 'GFANZ'], '6 KPIs: Portfolio Transition Score, WACI, Green Asset Ratio, Climate VaR, Capital Adequacy, Client Engagement Rate. Taxonomy drill: click L1\u2192L2\u2192L3\u2192L4 for FI-specific scores.'),
    [dp('Portfolio Score', '54/100', null, 'Aggregation', 'FI-wide transition assessment'), dp('Green Asset Ratio', '22%', null, 'EU Taxonomy', 'GAR for regulatory disclosure'), dp('Engagement Rate', '68%', null, 'Stewardship', 'Clients actively engaged on transition')],
    ['Executive KPIs shows 6 cards with QoQ trends', 'Taxonomy Deep Drill navigates L1\u2192L4', 'Client Risk Map scatters exposure vs score', 'Board Report generates formatted summary'],
    ['TCFD', 'ECB SREP', 'GFANZ']),

  // Sprint CU-CX abbreviated (6 per sprint)
  '/energy-asset-registry': g('Energy Asset Registry', 'EP-CU1', 'CU', '30 assets with carbon intensity, capacity mix, age/retirement, and WRI GPPD cross-reference.',
    ce('Facility-level carbon intensity', 'CI = AnnualEmissions / AnnualOutput (tCO\u2082/GWh)', ['WRI GPPD', 'EPA GHGRP', 'EU ETS EUTL'], '30 assets cross-referenced to WRI Global Power Plant Database (35,000+ plants). Carbon intensity varies: coal (~900 tCO\u2082/GWh), gas (~400), solar (~0).'),
    [dp('Assets', '30', null, 'Portfolio', 'Power plants, refineries, LNG terminals'), dp('WRI GPPD Cross-Ref', '35,000+', null, 'WRI', 'Global power plant database')],
    ['Asset Map shows geographic distribution', 'Carbon Intensity ranks assets by emissions per output', 'Age & Retirement shows commissioning year and planned retirement'],
    ['WRI GPPD', 'EPA GHGRP', 'EU ETS EUTL']),

  '/energy-segment-analysis': g('Energy Segment Analysis', 'EP-CU2', 'CU', 'Upstream, midstream, downstream segment decomposition with revenue, EBITDA, CapEx, and transition score per segment.', ce('Segment P&L decomposition', 'Transition_score per segment = taxonomy assessment weighted by segment revenue', ['IEA', 'Company filings'], 'Revenue, EBITDA, CapEx, and emissions split by segment.'), [dp('Segments', '5', null, 'Organizational', 'Upstream, midstream, downstream, renewables, retail')], ['Segment Overview shows 5 segments with financial metrics', 'Cross-Segment Metrics shows internal carbon pricing'], ['IEA World Energy Outlook']),

  '/energy-supplier-network': g('Energy Supplier Network', 'EP-CU3', 'CU', '40 suppliers across Tier 1/2/3 with transition scores, concentration risk, and engagement tracking.', ce('Supplier concentration analysis', 'HHI = \u03a3(spend_share_i\u00b2); Critical = single_source AND transition_score < 40', ['ISO 20400', 'CDP Supply Chain'], '40 suppliers with transition scores. Critical dependency flags single-source suppliers with low transition scores.'), [dp('Suppliers', '40', null, 'Supply chain', 'Tier 1 (10), Tier 2 (15), Tier 3 (15)')], ['Supplier Dashboard shows transition scores', 'Concentration Risk identifies single-source dependencies'], ['ISO 20400 Sustainable Procurement', 'CDP Supply Chain']),

  '/energy-revenue-split': g('Energy Revenue Split', 'EP-CU4', 'CU', 'Legacy vs renewable revenue/CapEx decomposition with green revenue ratio, IEA NZE alignment, and peer comparison.', ce('Green revenue ratio', 'GRR = Renewable_revenue / Total_revenue', ['IEA NZE', 'Company filings'], '5-year trend: legacy vs renewable split. CapEx alignment checks green CapEx % against IEA NZE requirement.'), [dp('Green Revenue Ratio', '12-18%', null, 'Calculated', 'Growing 2-3pp per year for integrated majors')], ['Revenue Trend shows 5-year legacy vs renewable split', 'CapEx Alignment compares to IEA NZE benchmark'], ['IEA Net Zero Roadmap']),

  '/energy-decommissioning-liability': g('Decommissioning Liability', 'EP-CU5', 'CU', 'Cost estimation, funding gap analysis, regulatory bond requirements, and stranded asset linkage.', ce('Decommissioning gap analysis', 'Gap = EstimatedLiability - CurrentProvision', ['National regulations', 'IEA'], 'Costs by asset type. Scenario-accelerated: NZ2050 brings forward retirement dates.'), [dp('Funding Gap', '$3.1B', null, 'Model', '38% underfunded')], ['Liability Overview shows cost by asset type', 'Funding Gap compares provisions vs estimates'], ['IEA Decommissioning Report']),

  '/energy-transition-dashboard': g('Energy Transition Dashboard', 'EP-CU6', 'CU', 'Executive KPIs, asset portfolio score, decarbonization pathway, supplier risk, and peer ranking.', ce('Energy company KPI aggregation', 'Portfolio_CI = \u03a3(asset_CI_i \u00d7 output_i) / \u03a3(output_i)', ['IEA NZE', 'SBTi'], '6 KPIs: Green Revenue Ratio, CapEx Alignment, Portfolio Carbon Intensity, Decom Gap, Supplier Score, ITR.'), [dp('Portfolio CI', '420 tCO\u2082/GWh', null, 'Calculated', 'Output-weighted average across 30 assets')], ['Executive KPIs shows 6 metrics with trends', 'Decarbonization Pathway compares actual vs IEA NZE'], ['IEA NZE', 'SBTi SDA']),

  '/geopolitical-risk-index': g('Geopolitical Risk Index', 'EP-CV1', 'CV', '50 countries with WGI 6 dimensions, sanctions exposure, conflict intensity, and custom weights.', ce('Composite geopolitical scoring', 'GeoRisk = \u03a3(dimension_i \u00d7 weight_i)', ['World Bank WGI', 'EIU', 'V-Dem'], '6 WGI dimensions: Voice & Accountability, Political Stability, Government Effectiveness, Regulatory Quality, Rule of Law, Control of Corruption. Plus: sanctions, conflict, trade policy risk.'), [dp('Countries', '50', null, 'WGI', 'Covering 85% of global GDP'), dp('WGI Dimensions', '6', null, 'World Bank', 'Annual governance indicators')], ['Global Map shows 50 countries color-coded', 'Country Rankings sorted by composite score', 'Custom Weights allow dimension adjustment'], ['World Bank WGI', 'EIU Democracy Index', 'V-Dem Institute']),

  '/sanctions-trade-monitor': g('Sanctions & Trade Monitor', 'EP-CV2', 'CV', 'OFAC, EU, UK OFSI, UN sanctions with trade policy tracker and portfolio exposure analysis.', ce('Sanctions screening', 'Exposure = \u03a3(portfolio_holdings in sanctioned_jurisdictions)', ['OFAC', 'EU Consolidated List', 'UK OFSI'], '4 sanctions regimes monitored. Trade policy: tariffs, export controls, CBAM. Portfolio exposure: which holdings have sanctioned country exposure.'), [dp('Sanctions Regimes', '4', null, 'Official', 'OFAC, EU, UK, UN')], ['Sanctions Dashboard shows active designations', 'Portfolio Exposure identifies affected holdings'], ['OFAC SDN List', 'EU Consolidated Sanctions List']),

  '/critical-mineral-geo-risk': g('Critical Mineral Geo Risk', 'EP-CV3', 'CV', '8 minerals with processing concentration, friendshoring index, and export control scenarios.', ce('Mineral supply chain geopolitical risk', 'GeoRisk = SupplyConcentration \u00d7 ProcessingConcentration \u00d7 GeopoliticalInstability', ['USGS', 'IEA'], 'China controls 60-90% of processing for most critical minerals. Friendshoring index: OECD vs non-OECD supply share.'), [dp('Minerals', '8', null, 'USGS', 'Li, Co, Ni, Cu, REE, graphite, Mn, PGMs')], ['Supply Chain Map shows mining and processing concentration', 'Export Control Scenarios model China REE restrictions'], ['USGS Mineral Commodity Summaries', 'IEA Critical Minerals']),

  '/conflict-stability-tracker': g('Conflict & Stability Tracker', 'EP-CV4', 'CV', 'ACLED conflict events, political stability trends, fragile states index, and asset proximity analysis.', ce('Conflict proximity risk', 'ProximityRisk = f(distance_to_conflict, conflict_intensity)', ['ACLED', 'Fund for Peace FSI'], 'ACLED data: armed conflict events with geolocation. Asset proximity: which portfolio assets are within 100km of conflict zones?'), [dp('Conflict Hotspots', '15', null, 'ACLED', 'Countries with active conflict'), dp('Fragile States', '20', null, 'Fund for Peace', 'Most fragile nations')], ['Conflict Event Map shows ACLED data with portfolio overlay', 'Asset Proximity identifies at-risk assets near conflict zones'], ['ACLED', 'Fund for Peace FSI', 'JRC INFORM Risk Index']),

  '/geo-transition-nexus': g('Geo-Transition Nexus', 'EP-CV5', 'CV', 'Combined geopolitical + transition risk scoring with fossil state risk identification and policy reversal scenarios.', ce('Combined risk scoring', 'Combined = (1-w)\u00d7TransitionScore + w\u00d7GeoScore (w default 0.15)', ['Model', 'NGFS'], 'Fossil state risk: countries where fossil revenue dependency + political instability = stranded state risk. Policy reversal: scenarios where government change reverses climate commitments.'), [dp('Geo Weight', '15%', null, 'Configurable', 'Geopolitical contribution to combined score'), dp('Fossil States', '8', null, 'Analysis', 'Countries at risk of stranded state')], ['Combined Score Matrix shows transition vs geopolitical', 'Fossil State Risk identifies vulnerable economies'], ['NGFS', 'V-Dem Institute']),

  '/geopolitical-dashboard': g('Geopolitical Dashboard', 'EP-CV6', 'CV', 'Executive dashboard with risk heatmap, top 10 exposures, sanctions alerts, mineral supply alerts, and board report.', ce('Dashboard aggregation', 'Aggregates outputs from EP-CV1 through CV5', ['All Sprint CV modules'], 'Top 10: highest geopolitical risk exposures in portfolio. Alerts: new sanctions designations, conflict escalation, mineral supply disruption.'), [dp('Top Exposure', 'Country X', null, 'Portfolio', 'Highest geopolitical risk holding')], ['Risk Heatmap shows 50 countries', 'Sanctions Alerts flag new designations', 'Board Report generates executive summary'], ['All Sprint CV references']),

  // Sprint CW
  '/universal-entity-comparator': g('Universal Entity Comparator', 'EP-CW1', 'CW', '15 entities (FI/Energy/Corporate) compared side-by-side across 8 L1 taxonomy topics.', ce('Multi-entity radar comparison', 'Gap = EntityA_score - EntityB_score per topic', ['Taxonomy assessment'], 'Compare up to 4 entities of any type. RadarChart overlay shows profile shape differences.'), [dp('Entities', '15', null, 'Cross-type', '5 FIs, 5 energy, 5 corporates')], ['Side-by-Side shows 4 entities compared', 'Taxonomy Comparison drills into L1\u2192L4 differences'], ['Taxonomy Assessment Framework']),

  '/sector-peer-benchmarking-engine': g('Sector Peer Benchmarking', 'EP-CW2', 'CW', '6 sectors \u00d7 8 peers with quartile ranking, best-practice identification, and convergence analysis.', ce('Quartile benchmarking', 'Quartile = rank(entity_score) within sector peer group', ['MSCI', 'Sustainalytics'], 'Q1=leaders (\u226575th %ile), Q4=laggards (<25th %ile). Best-practice: what Q1 companies do differently.'), [dp('Peers', '48', null, '6\u00d78', 'Sector peer groups'), dp('Convergence', 'Mixed', null, 'Trend', 'Some sectors converging, others diverging')], ['Quartile Ranking shows Q1-Q4 distribution', 'Best Practice identifies leader characteristics'], ['MSCI ESG Ratings', 'Sustainalytics']),

  '/supply-chain-network-viz': g('Supply Chain Network Viz', 'EP-CW3', 'CW', '20 nodes + 25 links with risk propagation, critical paths, and 4 geopolitical scenario simulations.', ce('Network risk propagation', 'PropagatedRisk = SourceRisk \u00d7 DependencyWeight \u00d7 AttenuationFactor^tier', ['Network theory'], 'SVG network visualization. 4 scenarios: China REE export controls, DRC cobalt disruption, Ukraine neon shortage, Russia PGM sanctions.'), [dp('Nodes', '20', null, 'Network', 'Companies in supply chain'), dp('Links', '25', null, 'Relationships', 'Supplier-customer edges')], ['Network Graph shows positioned nodes with links', 'Scenario Simulator models geopolitical supply disruptions'], ['INFORM Risk Index']),

  '/portfolio-stress-test-drilldown': g('Portfolio Stress Test Drill', 'EP-CW4', 'CW', '5 NGFS scenarios with entity contribution waterfall, taxonomy drill-down, and reverse stress test.', ce('Reverse stress test', 'Solve for {CarbonPrice, GDP_shock} such that PortfolioLoss > 20%', ['NGFS', 'ECB CST'], 'Entity contribution waterfall shows which holdings drive portfolio-level stress loss. Taxonomy drill: click L1 to see topic-level loss contribution.'), [dp('Scenarios', '5', null, 'NGFS', 'Standard NGFS scenario set'), dp('Reverse Stress Threshold', '20%', null, 'Configurable', 'Portfolio loss that triggers failure')], ['Scenario Selection applies NGFS stress', 'Entity Contribution shows waterfall of losses by holding', 'Reverse Stress solves for breaking conditions'], ['NGFS Phase 5', 'ECB CST Methodology']),

  '/assessment-audit-trail-v2': g('Assessment Audit Trail', 'EP-CW5', 'CW', 'Score change log, version history, drift monitoring, data lineage, and ISAE 3000 compliance evidence pack.', ce('Score lineage tracking', 'Every score traced: Entity \u2192 TaxonomyNode \u2192 DataSource \u2192 RawDatapoint', ['ISAE 3000', 'ISAE 3410'], 'Score drift: entities with >5 point drift over 3 months flagged. Data lineage: trace any score back to its source data point. ISAE 3000 compliance evidence pack for assurance readiness.'), [dp('Change Log Entries', '30+', null, 'Audit system', 'Timestamped score changes'), dp('Drift Threshold', '5 points', null, 'Configurable', '3-month score change alert')], ['Change Log shows timestamped score changes', 'Score Drift Monitor flags entities with significant changes', 'Data Lineage traces scores to source'], ['ISAE 3000 (Revised)', 'ISAE 3410']),

  '/cross-entity-intelligence-dashboard': g('Cross-Entity Dashboard', 'EP-CW6', 'CW', 'Platform KPIs, entity type comparison, 15\u00d78 risk heatmap, alert center, and board pack generator.', ce('Platform-wide KPI aggregation', 'Aggregates across all assessed entities and all taxonomy topics', ['All platform modules'], 'Platform KPIs: entities assessed, taxonomy coverage %, avg score, distribution. Entity type comparison: FI avg vs Energy avg vs Corporate avg.'), [dp('Entities Assessed', '15', null, 'Platform', 'Across 3 entity types'), dp('Avg Score', '55', null, 'Aggregation', 'Platform-wide average')], ['Platform KPIs shows aggregate statistics', 'Risk Heat Map shows 15 entities \u00d7 8 topics', 'Board Pack generates executive summary'], ['All platform modules']),

  // Sprint CX
  '/ml-feature-engineering': g('ML Feature Engineering', 'EP-CX1', 'CX', '948 features (316 current + 316 velocity + 316 acceleration), PCA, mutual information selection, and data quality impact analysis.', ce('Feature engineering pipeline', 'Features = CurrentScores(316) + Velocity_3m(316) + Acceleration_12m(316) + Metadata', ['PCA', 'Mutual Information'], 'Velocity = 3-month score delta. Acceleration = 12-month delta. PCA: first 50 components explain 85% variance. MI selection: top 200 features by mutual information with target.'), [dp('Raw Features', '948', null, 'Pipeline', '316\u00d73 + metadata'), dp('Selected Features', '200', null, 'MI ranking', 'After feature selection'), dp('PCA Variance (50 PCs)', '85%', null, 'PCA', 'Explained variance')], ['Feature Catalog shows all 948 features', 'PCA Analysis shows explained variance curve', 'Feature Selection ranks by mutual information'], ['PCA', 'Mutual Information Theory']),

  '/ensemble-prediction-engine': g('Ensemble Prediction Engine', 'EP-CX2', 'CX', 'XGBoost (0.4) + LightGBM (0.3) + Neural MLP (0.3) ensemble with 12-month forward prediction, backtest, and deployment.', ce('Weighted ensemble prediction', 'y_hat = 0.4\u00d7XGBoost + 0.3\u00d7LightGBM + 0.3\u00d7MLP', ['Chen (2016)', 'Ke (2017)'], '3-model ensemble with weights optimized via grid search. 5-fold cross-validation. Conformal prediction for 90% coverage intervals. 3-year rolling backtest.'), [dp('Ensemble RMSE', '4.2', null, 'Cross-validation', 'Root mean squared error'), dp('Best Single Model', 'XGBoost (RMSE 4.8)', null, 'Comparison', 'Ensemble outperforms best single model')], ['Ensemble Dashboard shows 3 model comparison', 'Prediction Results for 15 entities with confidence intervals', 'Backtest shows 3-year rolling performance'], ['Chen & Guestrin (2016) XGBoost', 'Ke et al. (2017) LightGBM']),

  '/anomaly-detection-engine': g('Anomaly Detection Engine', 'EP-CX3', 'CX', 'Isolation Forest with configurable contamination, flagged entity investigation workflow, and false positive rate tracking.', ce('Isolation Forest anomaly detection', 'AnomalyScore = avgPathLength(x) / avgPathLength(random); Flag if score > threshold', ['Liu et al. (2008)'], 'Contamination parameter (0.01-0.10) controls false positive rate. Flagged entities show which taxonomy nodes are outliers vs sector peers.'), [dp('Contamination', '0.05', null, 'Configurable', '5% expected anomaly rate'), dp('Flagged Entities', '3', null, 'Detection', 'Entities with anomalous profiles')], ['Anomaly Scanner runs Isolation Forest on all entities', 'Investigation Workflow for each flagged entity', 'FPR Tracking monitors confirmed vs false alarm ratio'], ['Liu et al. (2008) Isolation Forest']),

  '/peer-clustering-segmentation': g('Peer Clustering Segmentation', 'EP-CX4', 'CX', 'K-means clustering (k=2-10) with silhouette analysis, cluster profiles, migration tracking, and engagement prioritization.', ce('K-means with silhouette optimization', 'Silhouette(i) = (b(i) - a(i)) / max(a(i), b(i))', ['Lloyd (1982)', 'Rousseeuw (1987)'], 'Optimal k selected by silhouette analysis. PC1 vs PC2 scatter visualization. Cluster profiles show average taxonomy scores. Migration tracker: entity movement between clusters over quarters.'), [dp('Optimal k', '5', null, 'Silhouette', 'Best cluster count'), dp('Best Silhouette', '0.68', null, 'k=5', 'Good clustering quality')], ['Cluster Visualization shows PC1 vs PC2 scatter', 'Silhouette Analysis shows optimal k', 'Migration Tracker shows entity movement between clusters'], ['Lloyd (1982) K-means', 'Rousseeuw (1987) Silhouettes']),

  '/scenario-conditional-prediction': g('Scenario Conditional Prediction', 'EP-CX5', 'CX', 'Custom scenario builder with 4 input sliders, conditional predictions, 2D sensitivity surface, and pathway analysis.', ce('Scenario-conditional inference', 'y_hat = f(carbon_price, gdp_growth, tech_cost, policy_stringency | entity)', ['NGFS', 'Ensemble model'], '4 configurable inputs: carbon price (\u20ac50-300), GDP growth (-3% to +5%), technology cost index (0.5-2.0), policy stringency (0-100). NGFS presets auto-fill inputs. 2D sensitivity heatmap shows score response surface.'), [dp('Input Dimensions', '4', null, 'Scenario builder', 'Carbon price, GDP, tech cost, policy'), dp('NGFS Presets', '5', null, 'NGFS', 'Auto-fill from standard scenarios')], ['Scenario Builder adjusts 4 input sliders', 'Conditional Predictions show entity scores under custom scenario', 'Sensitivity Surface shows 2D score response heatmap'], ['NGFS Phase 5 Scenarios']),

  '/ml-governance-dashboard': g('ML Governance Dashboard', 'EP-CX6', 'CX', 'Model inventory with PSI drift detection, SHAP explainability, Fed SR 11-7 compliance, and EU AI Act alignment.', ce('Model risk governance', 'PSI = \u03a3((Actual_i - Expected_i) \u00d7 ln(Actual_i / Expected_i))', ['Fed SR 11-7', 'EU AI Act', 'Lundberg (2017)'], 'PSI > 0.25 triggers retraining alert. Fed SR 11-7: 16-item MRM checklist. EU AI Act: 8-requirement high-risk AI alignment. SHAP: global feature importance + per-entity waterfall.'), [dp('Models Deployed', '6', null, 'Registry', 'Active production models'), dp('PSI Threshold', '0.25', null, 'Industry standard', 'Drift detection trigger'), dp('SR 11-7 Compliance', '14/16', null, 'Self-assessment', '87.5% checklist complete'), dp('EU AI Act', '7/8', null, 'Assessment', '87.5% requirement alignment')], ['Model Inventory shows all deployed models', 'Drift Detection monitors PSI weekly', 'SHAP Explainability shows feature importance', 'Compliance Status shows SR 11-7 and EU AI Act alignment'], ['Fed SR 11-7 Model Risk Management', 'EU AI Act (2024)', 'Lundberg & Lee (2017) SHAP']),
};
