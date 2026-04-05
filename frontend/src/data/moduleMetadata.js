/**
 * Module Metadata — Calculation Graph & Data Lineage Registry
 * Maps every displayed metric to its decomposition tree, formula, and data sources.
 * Used by DataDepthOverlay for non-invasive drill-down across all modules.
 */

// Helper: create a metric node
function m(key, label, formula, value, children, sources, methodology, sensitivity) {
  return {
    key, label, formula: formula || undefined, value: value || undefined,
    children: children || [], sources: sources || [], methodology: methodology || undefined,
    sensitivity: sensitivity || undefined, drillable: !!(children && children.length),
  };
}

// Helper: create a leaf node (data source)
function leaf(key, label, value, source, quality) {
  return { key, label, value, source, quality, children: [], drillable: false };
}

// Helper: create a component node (intermediate calculation)
function comp(key, label, value, weight, children, source) {
  return { key, label, value, weight, children: children || [], source, drillable: !!(children && children.length) };
}

/** Find a metric in module metadata by matching displayed text */
export function findMetricByText(text, moduleData) {
  if (!moduleData || !moduleData.metrics) return null;
  const cleanText = text.replace(/[$,%\u00b0\u20ac\u00a3B\bM\b]/g, '').trim();

  for (const metric of moduleData.metrics) {
    if (metric.matchTexts && metric.matchTexts.some(t => text.includes(t))) return metric;
    if (metric.value && text.includes(String(metric.value))) return metric;
    if (metric.label && text.includes(metric.label)) return metric;
  }

  // Fuzzy: try matching numeric values
  const numMatch = cleanText.match(/[\d.]+/);
  if (numMatch) {
    const num = parseFloat(numMatch[0]);
    for (const metric of moduleData.metrics) {
      if (metric.numericMatch && Math.abs(metric.numericMatch - num) < 0.01) return metric;
    }
  }
  return null;
}

export const MODULE_METADATA = {
  // ═══════════════════════════════════════════════════════════════════
  // SPRINT CA — Transition Risk DCF
  // ═══════════════════════════════════════════════════════════════════
  '/transition-risk-dcf': {
    moduleCode: 'EP-CA1', sprint: 'CA',
    metrics: [
      m('impairment', 'NPV Impairment', 'NPV_adj / NPV_base - 1', null, [
        comp('npv_base', 'NPV Base (no climate)', null, null, [
          leaf('fcf_stream', 'FCF Stream (10yr)', null, 'DCF Model', 2),
          leaf('wacc_base', 'WACC Base', '8.5%', 'Bloomberg', 2),
          leaf('terminal_value', 'Terminal Value', null, 'Gordon Growth', 3),
        ]),
        comp('npv_adjusted', 'NPV Climate-Adjusted', null, null, [
          comp('wacc_adj', 'WACC Adjusted', 'WACC_base + \u03b2_carbon \u00d7 P_carbon(t=5)', null, [
            leaf('wacc_base2', 'WACC Base', '8.5%', 'Bloomberg', 2),
            leaf('beta_carbon', '\u03b2_carbon (carbon beta)', '0.12', 'Cross-sectional regression', 3),
            leaf('p_carbon', 'P_carbon(t=5)', '\u20ac95/tCO\u2082', 'NGFS Phase 5', 1),
          ]),
          comp('carbon_cost', 'Carbon Cost Stream', '\u03a3 Emissions(t) \u00d7 Price(t) \u00d7 (1-PassThrough)', null, [
            leaf('emissions', 'Annual Emissions', '450kt CO\u2082', 'CDP / Company Report', 2),
            leaf('price_traj', 'Carbon Price Trajectory', 'NGFS NZ2050', 'NGFS Phase 5', 1),
            leaf('passthrough', 'Pass-Through Rate', '65%', 'Sector Analysis', 3),
          ]),
        ]),
      ], ['NGFS Phase 5', 'Bloomberg', 'CDP', 'Company Filings'],
      'Climate-adjusted DCF with WACC carbon beta and carbon cost overlay',
      [{ param: 'Carbon Price', impact: 8.2 }, { param: 'Pass-Through', impact: -5.4 }, { param: '\u03b2_carbon', impact: 3.1 }]),

      m('stranded_year', 'Stranded Year', 'First t where cumulative NPV < 0', null, [
        leaf('npv_traj', 'NPV Trajectory (annual)', null, 'DCF Model', 2),
        leaf('scenario', 'NGFS Scenario', 'Net Zero 2050', 'NGFS', 1),
        leaf('capex_sched', 'CapEx Schedule', null, 'Company Investment Plan', 3),
      ], ['NGFS Phase 5', 'Company Filings'], 'Year when asset becomes economically unviable'),

      { key: 'carbon_price', label: 'Carbon Price (2030)', matchTexts: ['\u20ac150', '\u20ac120', '\u20ac85', '\u20ac45', '\u20ac220'], formula: 'P(t) = P\u2080\u00b7exp(g\u00b7t)', children: [
        leaf('p0', 'Base Price (2024)', '\u20ac55/tCO\u2082', 'EU ETS EUTL', 1),
        leaf('growth', 'Growth Rate (g)', '4.2%/yr NZ', 'NGFS Phase 5', 1),
        leaf('volatility', 'Price Volatility', '\u00b118% annual', 'ICE Futures', 2),
      ], sources: ['NGFS Phase 5', 'EU ETS EUTL', 'ICE Futures Europe'], drillable: true },
    ],
  },

  '/stranded-asset-analyzer': {
    moduleCode: 'EP-CA2', sprint: 'CA',
    metrics: [
      m('writedown', 'Write-Down Amount', 'InitialValue \u00d7 StrandedPct \u00d7 (1 - exp(-\u03bb\u00b7t))', null, [
        leaf('initial_value', 'Initial Asset Value', null, 'Balance Sheet', 2),
        leaf('stranded_pct', 'Stranded %', null, 'Carbon Tracker / NGFS', 2),
        leaf('lambda', 'Decay Rate (\u03bb)', null, 'Sector Calibration', 3),
        leaf('time', 'Time Horizon', null, 'Scenario Period', 1),
      ], ['Carbon Tracker', 'NGFS Phase 5'], 'Exponential decay write-down model'),
    ],
  },

  '/tech-displacement-modeler': {
    moduleCode: 'EP-CA3', sprint: 'CA',
    metrics: [
      m('adoption', 'Technology Adoption %', 'f(t) = L / (1 + exp(-k(t - t_mid)))', null, [
        leaf('L', 'Maximum Penetration (L)', null, 'IEA NZE', 2),
        leaf('k', 'Steepness (k)', null, 'Historical Calibration', 3),
        leaf('t_mid', 'Inflection Year (t_mid)', null, 'IEA/BNEF', 2),
      ], ['IEA', 'BNEF', 'IRENA'], 'Logistic S-curve adoption model'),

      m('lcoe', 'LCOE Cost', 'LCOE\u2080 \u00d7 (1-rate)^t', null, [
        leaf('lcoe0', 'LCOE Base Year', null, 'IRENA', 2),
        leaf('rate', 'Learning Rate', null, 'Wright\'s Law fit', 2),
        leaf('cumulative', 'Cumulative Deployment', null, 'IRENA Statistics', 2),
      ], ['IRENA', 'BNEF LCOE Survey'], 'Wright\'s Law learning curve'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // SPRINT CB
  // ═══════════════════════════════════════════════════════════════════
  '/sector-transition-scorecard': {
    moduleCode: 'EP-CB1', sprint: 'CB',
    metrics: [
      m('pace', 'PACE Composite', 'avg(Physical, Abatement, Carbon, Energy)', null, [
        comp('physical', 'Physical Risk Exposure', null, 0.25, [leaf('phys_data', 'IPCC Hazard Projections', null, 'IPCC AR6 WGI', 1)]),
        comp('abatement', 'Abatement Cost', null, 0.25, [leaf('mac', 'MAC Curve Data', null, 'McKinsey', 3)]),
        comp('carbon', 'Carbon Cost Exposure', null, 0.25, [leaf('ets', 'ETS Price Exposure', null, 'EU ETS EUTL', 1)]),
        comp('energy', 'Energy Price Sensitivity', null, 0.25, [leaf('fuel', 'Fuel Price Data', null, 'IEA WEO', 2)]),
      ], ['IPCC AR6', 'McKinsey MAC', 'EU ETS', 'IEA WEO'], 'PACE 4-pillar sector transition framework'),
    ],
  },

  '/just-transition-intelligence': {
    moduleCode: 'EP-CB2', sprint: 'CB',
    metrics: [
      m('jtf_score', 'JTF Composite Score', '0.25\u00d7SD + 0.20\u00d7R + 0.30\u00d7E + 0.15\u00d7SP + 0.10\u00d7D', null, [
        comp('social_dialogue', 'Social Dialogue', null, 0.25, [leaf('sd_data', 'ILO Social Dialogue Index', null, 'ILO', 2)]),
        comp('rights', 'Rights at Work', null, 0.20, [leaf('r_data', 'Labour Rights Assessment', null, 'ILO', 2)]),
        comp('employment', 'Employment', null, 0.30, [leaf('e_data', 'Employment Impact Data', null, 'ILO/National Stats', 3)]),
        comp('social_prot', 'Social Protection', null, 0.15, [leaf('sp_data', 'Social Safety Net Coverage', null, 'World Bank', 2)]),
        comp('development', 'Development Policy', null, 0.10, [leaf('d_data', 'Policy Framework Assessment', null, 'ILO', 3)]),
      ], ['ILO Just Transition Guidelines', 'World Bank'], 'ILO 5-pillar just transition framework'),
    ],
  },

  '/policy-regulatory-impact': {
    moduleCode: 'EP-CB3', sprint: 'CB',
    metrics: [
      m('cbam_liability', 'CBAM Liability', '\u03a3(ImportVol \u00d7 EmbeddedCarbon \u00d7 (EU_price - Origin_price))', null, [
        comp('steel_cbam', 'Steel CBAM', null, null, [leaf('steel_vol', 'Steel Import Volume', null, 'Eurostat', 1), leaf('steel_ef', 'Steel Emission Factor', null, 'EU CBAM Registry', 1)]),
        comp('cement_cbam', 'Cement CBAM', null, null, [leaf('cement_vol', 'Cement Import Volume', null, 'Eurostat', 1)]),
        comp('alu_cbam', 'Aluminium CBAM', null, null, [leaf('alu_vol', 'Aluminium Import Volume', null, 'Eurostat', 1)]),
        comp('fert_cbam', 'Fertilizer CBAM', null, null, [leaf('fert_vol', 'Fertilizer Import Volume', null, 'Eurostat', 1)]),
      ], ['EU CBAM Registry', 'Eurostat'], 'CBAM cumulative liability model'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // SPRINT CC
  // ═══════════════════════════════════════════════════════════════════
  '/financed-emissions-attributor': {
    moduleCode: 'EP-CC2', sprint: 'CC',
    metrics: [
      m('waci', 'WACI', '\u03a3(w_i \u00d7 Emissions_i / Revenue_i)', null, [
        comp('energy_waci', 'Energy Sector WACI', '410 tCO\u2082/$M', 0.22, [leaf('en_emis', 'Energy Emissions', null, 'CDP', 2), leaf('en_rev', 'Energy Revenue', null, 'EODHD', 2)]),
        comp('materials_waci', 'Materials Sector WACI', '280 tCO\u2082/$M', 0.15, [leaf('mat_emis', 'Materials Emissions', null, 'CDP', 2)]),
        comp('utilities_waci', 'Utilities Sector WACI', '520 tCO\u2082/$M', 0.10, [leaf('ut_emis', 'Utilities Emissions', null, 'CDP', 2)]),
        comp('tech_waci', 'Technology Sector WACI', '8 tCO\u2082/$M', 0.18, [leaf('tech_emis', 'Tech Emissions', null, 'CDP', 2)]),
        comp('other_waci', 'Other Sectors WACI', '45 tCO\u2082/$M', 0.35, []),
      ], ['CDP', 'PCAF', 'EODHD'], 'PCAF weighted average carbon intensity',
      [{ param: 'Energy Weight', impact: 12.5 }, { param: 'Price Data', impact: -3.2 }]),

      m('financed_emissions', 'Total Financed Emissions', '\u03a3(AF_i \u00d7 CompanyEmissions_i)', null, [
        comp('class1', 'Listed Equity (Class 1)', null, null, [leaf('af_eq', 'AF = Investment/EVIC', null, 'PCAF', 2), leaf('emis_eq', 'Company Scope 1+2', null, 'CDP', 2)]),
        comp('class2', 'Corporate Bonds (Class 2)', null, null, [leaf('af_bd', 'AF = Investment/(EVIC+Debt)', null, 'PCAF', 2)]),
        comp('class3', 'Project Finance (Class 3)', null, null, [leaf('af_pf', 'AF = 100% attribution', null, 'PCAF', 2)]),
        comp('class4', 'Commercial RE (Class 4)', null, null, [leaf('af_re', 'AF = LoanOutstanding/PropertyValue', null, 'PCAF', 3)]),
        comp('class6', 'Mortgages (Class 6)', null, null, [leaf('af_mg', 'AF = LoanOutstanding/PropertyValue', null, 'PCAF', 3)]),
      ], ['PCAF Global GHG Standard v3'], 'PCAF 5-class financed emissions attribution'),
    ],
  },

  '/portfolio-transition-alignment': {
    moduleCode: 'EP-CC1', sprint: 'CC',
    metrics: [
      m('itr', 'Implied Temperature Rise', 'T_budget / (\u03a3 Projected_Emissions / Allocated_Budget)', null, [
        leaf('budget', 'Carbon Budget (1.5\u00b0C)', null, 'IPCC AR6', 1),
        leaf('projected', 'Projected Portfolio Emissions', null, 'PACTA/Company Data', 2),
        leaf('allocation', 'Allocated Budget per Company', null, 'SDA Methodology', 2),
      ], ['PACTA', 'IPCC AR6', 'SBTi SDA'], 'Budget-based implied temperature calculation'),
    ],
  },

  '/transition-finance-screener': {
    moduleCode: 'EP-CC3', sprint: 'CC',
    metrics: [
      m('greenium', 'Greenium', 'YTM_green - YTM_conventional (bps)', null, [
        leaf('ytm_green', 'Green Bond YTM', null, 'Bloomberg', 2),
        leaf('ytm_conv', 'Comparable Conventional YTM', null, 'Bloomberg', 2),
        leaf('maturity_match', 'Maturity Matching', null, 'Model', 3),
      ], ['Bloomberg', 'Refinitiv'], 'Green bond yield premium/discount vs conventional'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // SPRINT CD — Multi-Dim Scoring
  // ═══════════════════════════════════════════════════════════════════
  '/multi-dim-transition-scorer': {
    moduleCode: 'EP-CD1', sprint: 'CD',
    metrics: [
      m('composite', 'Transition Score', '0.22\u00d7CE + 0.18\u00d7TR + 0.20\u00d7PR + 0.18\u00d7MD + 0.12\u00d7CA + 0.10\u00d7SL', null, [
        comp('carbon_exp', 'Carbon Exposure', null, 0.22, [
          leaf('cdp', 'CDP Score', null, 'CDP', 2), leaf('evic', 'EVIC Attribution', null, 'PCAF', 2), leaf('scope3', 'Scope 3 Cat 11', null, 'Company Report', 3),
        ]),
        comp('tech_ready', 'Technology Readiness', null, 0.18, [
          leaf('capex', 'CapEx Mix (% green)', null, 'Company Filings', 2), leaf('rd', 'R&D Clean Tech', null, 'Company Filings', 2),
        ]),
        comp('policy_risk', 'Policy & Regulatory Risk', null, 0.20, [
          leaf('ets_exp', 'ETS Exposure', null, 'EU ETS EUTL', 1), leaf('lobby', 'Lobbying Alignment', null, 'InfluenceMap', 2),
        ]),
        comp('market_dyn', 'Market Dynamics', null, 0.18, [
          leaf('demand', 'Customer Demand Shift', null, 'Market Research', 3), leaf('competitor', 'Competitor Positioning', null, 'Industry Analysis', 3),
        ]),
        comp('capital_acc', 'Capital Access', null, 0.12, [
          leaf('green_bonds', 'Green Bond Issuance', null, 'Bloomberg', 2), leaf('esg_facility', 'ESG Credit Facility', null, 'Company Report', 3),
        ]),
        comp('social_lic', 'Social License', null, 0.10, [
          leaf('jt_plan', 'Just Transition Plan', null, 'Company Report', 3), leaf('community', 'Community Investment', null, 'Company Report', 3),
        ]),
      ], ['CDP', 'SBTi', 'InfluenceMap', 'Bloomberg', 'PCAF', 'Company Filings'],
      '6-pillar weighted composite with public + proprietary data tiers',
      [{ param: 'Carbon Exposure', impact: 6.8 }, { param: 'Policy Risk', impact: 5.2 }, { param: 'CapEx Mix', impact: 4.1 }]),

      { key: 'rating', label: 'Rating', matchTexts: ['A', 'B', 'C', 'D', 'E'], formula: 'A(\u226575) B(\u226560) C(\u226545) D(\u226530) E(<30)', children: [
        leaf('score', 'Composite Score', null, 'Weighted Sum', 2),
        leaf('threshold', 'Rating Thresholds', 'A\u226575, B\u226560, C\u226545, D\u226530', 'Configuration', 1),
      ], sources: ['Model Configuration'], drillable: true },
    ],
  },

  '/transition-risk-heatmap': {
    moduleCode: 'EP-CD2', sprint: 'CD',
    metrics: [
      m('risk_cell', 'Heatmap Cell Score', 'baseScore(sector, geo) \u00d7 scenarioMultiplier', null, [
        leaf('base_score', 'Base Score', null, 'IPCC AR6 + NGFS', 2),
        leaf('multiplier', 'Scenario Multiplier', 'CP:0.8x, B2C:1.0x, NZ:1.35x', 'Model Parameter', 1),
        leaf('sector', 'GICS Sector', null, 'Classification', 1),
        leaf('geography', 'Geographic Region', null, 'Classification', 1),
      ], ['NGFS Phase 5', 'IPCC AR6'], 'Scenario-adjusted sector×geography risk matrix'),
    ],
  },

  '/carbon-footprint-intelligence': {
    moduleCode: 'EP-CD3', sprint: 'CD',
    metrics: [
      m('total_emissions', 'Total Emissions', 'Scope1 + Scope2(market) + Scope3', null, [
        comp('scope1', 'Scope 1 (Direct)', null, null, [
          leaf('combustion', 'Combustion', null, 'GHG Protocol', 2),
          leaf('process', 'Process Emissions', null, 'GHG Protocol', 2),
          leaf('fugitive', 'Fugitive', null, 'GHG Protocol / Climate TRACE', 3),
        ]),
        comp('scope2', 'Scope 2 (Energy)', null, null, [
          leaf('s2_location', 'Location-Based', null, 'Grid EF \u00d7 Consumption', 2),
          leaf('s2_market', 'Market-Based', null, 'Supplier EF / PPAs', 2),
        ]),
        comp('scope3', 'Scope 3 (Value Chain)', null, null, [
          leaf('cat1', 'Cat 1: Purchased Goods', null, 'CDP Supply Chain', 4),
          leaf('cat11', 'Cat 11: Use of Products', null, 'Product Lifecycle', 4),
          leaf('cat15', 'Cat 15: Investments', null, 'PCAF', 3),
        ]),
      ], ['GHG Protocol', 'CDP', 'PCAF', 'Climate TRACE'], 'GHG Protocol corporate standard'),

      m('intensity', 'Carbon Intensity', 'Total Emissions / Revenue ($M)', null, [
        leaf('total_e', 'Total Emissions (tCO\u2082e)', null, 'Above calculation', 2),
        leaf('revenue', 'Annual Revenue ($M)', null, 'EODHD / Annual Report', 2),
      ], ['GHG Protocol', 'EODHD'], 'Normalised metric for cross-company comparison'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // SPRINT CE — Climate VaR
  // ═══════════════════════════════════════════════════════════════════
  '/climate-var-engine': {
    moduleCode: 'EP-CE1', sprint: 'CE',
    metrics: [
      m('total_cvar', 'Total Climate VaR', 'CVaR_trans + CVaR_phys + \u03c1\u00b7\u221a(Trans\u00d7Phys)\u00b7corrFactor', null, [
        comp('trans_var', 'Transition VaR', 'AUM \u00d7 transRate \u00d7 \u221a(T/10)', null, [
          leaf('aum', 'AUM ($B)', null, 'Portfolio Input', 1),
          leaf('trans_rate', 'Transition Rate', null, 'NGFS Scenario Parameter', 1),
          leaf('horizon', 'Horizon (years)', null, 'User Input', 1),
        ]),
        comp('phys_var', 'Physical VaR', 'AUM \u00d7 physRate \u00d7 \u221a(T/10)', null, [
          leaf('phys_rate', 'Physical Rate', null, 'NGFS/IPCC', 1),
          leaf('hazard_exp', 'Hazard Exposure', null, 'IPCC AR6 WGI', 2),
        ]),
        comp('inter_var', 'Interaction VaR', '\u03c1 \u00d7 \u221a(Trans\u00d7Phys) \u00d7 corrFactor', null, [
          leaf('rho', 'Correlation (\u03c1)', null, 'Model Calibration', 3),
          leaf('corr_factor', 'Correction Factor', null, 'Scenario-Specific', 2),
        ]),
      ], ['NGFS Phase 5', 'IPCC AR6', 'ECB CST 2024'],
      'Decomposed CVaR with transition-physical interaction',
      [{ param: 'AUM', impact: 0 }, { param: 'Trans Rate', impact: 5.8 }, { param: 'Phys Rate', impact: 3.2 }, { param: '\u03c1', impact: 1.4 }]),

      m('delta_covar', 'Delta CoVaR', 'SectorWeight \u00d7 SectorCVaR / PortfolioCVaR', null, [
        leaf('sector_weight', 'Sector Weight in Portfolio', null, 'Portfolio Data', 1),
        leaf('sector_cvar', 'Sector-Level CVaR', null, 'Model Output', 2),
        leaf('portfolio_cvar', 'Portfolio-Level CVaR', null, 'Above Calculation', 2),
      ], ['Adrian & Brunnermeier (2016)'], 'Systemic risk contribution per sector'),

      { key: 'var_pct', label: 'CVaR % of AUM', matchTexts: ['8.7%', '5.8%', '11.2%', '3.2%', '14.5%'],
        numericMatch: 8.7, formula: 'totalVaR / AUM \u00d7 100', children: [
          leaf('total_var_usd', 'Total VaR ($B)', null, 'Model Output', 2),
          leaf('aum_total', 'Total AUM ($B)', null, 'Portfolio Input', 1),
        ], sources: ['Model Calculation'], drillable: true },
    ],
  },

  '/transition-risk-dashboard': {
    moduleCode: 'EP-CE2', sprint: 'CE',
    metrics: [
      m('portfolio_cvar', 'Portfolio Climate VaR', 'From EP-CE1 ClimateVarEngine', '8.7%', [
        leaf('ce1_output', 'EP-CE1 Climate VaR Engine', '8.7% of AUM', 'Cross-Module', 2),
        leaf('scenario', 'Scenario: NZ2050', '10yr horizon', 'NGFS', 1),
      ], ['EP-CE1', 'NGFS'], 'Sourced from Climate VaR Engine module'),

      m('portfolio_itr', 'ITR', 'From EP-CC1 PortfolioTransitionAlignment', '2.4\u00b0C', [
        leaf('cc1_output', 'EP-CC1 Portfolio Alignment', '2.4\u00b0C', 'Cross-Module', 2),
        leaf('target', 'Paris Target', '1.5\u00b0C', 'Paris Agreement', 1),
      ], ['EP-CC1', 'PACTA'], 'Sourced from Portfolio Transition Alignment module'),

      m('portfolio_waci', 'WACI', 'From EP-CC2 FinancedEmissionsAttributor', '182 tCO\u2082/$M', [
        leaf('cc2_output', 'EP-CC2 Financed Emissions', '182 tCO\u2082/$M', 'Cross-Module', 2),
      ], ['EP-CC2', 'PCAF'], 'Sourced from Financed Emissions Attributor module'),

      m('stranded', 'Stranded Exposure', 'From EP-CA2 StrandedAssetAnalyzer', '$2.1B', [
        leaf('ca2_output', 'EP-CA2 Stranded Assets', '$2.1B under NZ2050', 'Cross-Module', 2),
      ], ['EP-CA2', 'Carbon Tracker'], 'Sourced from Stranded Asset Analyzer module'),

      m('gfanz_pct', 'GFANZ Alignment', 'From EP-CC1', '61%', [
        leaf('aligned_aum', 'GFANZ-Aligned AUM', '$9.1B', 'Alliance Databases', 2),
        leaf('total_aum', 'Total AUM', '$14.9B', 'Portfolio', 1),
      ], ['GFANZ', 'NZAM', 'NZAOA'], 'Percentage of portfolio with GFANZ alliance commitments'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // SPRINT CF — Adaptation
  // ═══════════════════════════════════════════════════════════════════
  '/climate-adaptation-pathways': {
    moduleCode: 'EP-CF1', sprint: 'CF',
    metrics: [
      m('bcr', 'Benefit-Cost Ratio', 'NPV_Benefits / NPV_Costs', null, [
        comp('benefits', 'Total Benefits (NPV)', null, null, [
          leaf('avoided_loss', 'Avoided Physical Losses', null, 'EP-BX2 Damage Functions', 2),
          leaf('avoided_bi', 'Avoided Business Interruption', null, 'Sector Studies', 3),
          leaf('health_coben', 'Health Co-Benefits', null, 'WHO/Public Health', 4),
          leaf('carbon_value', 'Carbon Value', null, 'Carbon Pricing', 2),
        ]),
        comp('costs', 'Total Costs (NPV)', null, null, [
          leaf('capex', 'Capital Expenditure', null, 'Engineering Estimates', 3),
          leaf('opex', 'Operating Costs (20yr)', null, 'Project Models', 3),
          leaf('discount', 'Discount Rate', '5%', 'Stern Review Convention', 1),
        ]),
      ], ['UNEP Adaptation Gap Report', 'IPCC AR6 WGII', 'WHO'],
      'Cost-benefit analysis with 20-year NPV at 5% discount rate',
      [{ param: 'Discount Rate', impact: -15.2 }, { param: 'Avoided Loss', impact: 8.4 }, { param: 'Co-Benefits', impact: 5.1 }]),

      m('finance_gap', 'Adaptation Finance Gap', 'Need - Flow', '$124B/yr', [
        leaf('need', 'Adaptation Need', '$170B/yr', 'UNEP 2024', 1),
        leaf('flow', 'Current Flows', '$46B/yr', 'UNEP/CPI', 2),
      ], ['UNEP Adaptation Gap Report 2024'], 'Global gap between adaptation needs and financial flows'),
    ],
  },

  '/infrastructure-resilience-scorer': {
    moduleCode: 'EP-CF2', sprint: 'CF',
    metrics: [
      m('resilience', 'Composite Resilience Score', 'avg(Structural, Operational, Financial, Environmental, Social)', null, [
        comp('structural', 'Structural Resilience', null, 0.20, [leaf('eng_std', 'Engineering Standards Compliance', null, 'Structural Assessment', 3)]),
        comp('operational', 'Operational Resilience', null, 0.20, [leaf('bcp', 'Business Continuity Plans', null, 'BCP Review', 3)]),
        comp('financial', 'Financial Resilience', null, 0.20, [leaf('insurance', 'Insurance Coverage Ratio', null, 'Swiss Re sigma', 2)]),
        comp('environmental', 'Environmental Resilience', null, 0.20, [leaf('buffer', 'Natural Buffer Zones', null, 'GIS Analysis', 3)]),
        comp('social', 'Social Resilience', null, 0.20, [leaf('community', 'Community Preparedness', null, 'UNDRR', 4)]),
      ], ['GRESB Infrastructure', 'RICS', 'UNEP FI'], '5-pillar equal-weighted resilience assessment'),

      m('haircut', 'Climate Haircut', 'f(HazardExposure, Vulnerability, AdaptiveCapacity)', null, [
        leaf('hazard', 'Hazard Exposure Score', null, 'EP-BX1 Hazard Map', 2),
        leaf('vulnerability', 'Asset Vulnerability', null, 'Engineering Assessment', 3),
        leaf('adaptive', 'Adaptive Capacity', null, 'Above 5-pillar assessment', 2),
      ], ['UNEP FI CVC', 'Baldauf et al. (2020)'], 'Climate value-at-certainty haircut on asset value'),
    ],
  },

  '/nature-based-adaptation': {
    moduleCode: 'EP-CF3', sprint: 'CF',
    metrics: [
      m('nbs_value', 'NbS Total Value', 'ProtectionValue + CarbonValue + \u03a3CoBenefits', null, [
        comp('protection', 'Protection Value', null, null, [leaf('surge_red', 'Storm Surge Reduction', '60-80%', 'Narayan et al. (2016)', 2)]),
        comp('carbon', 'Carbon Value', null, null, [leaf('seq_rate', 'Sequestration Rate', 'tCO\u2082/ha/yr', 'IPCC', 2), leaf('c_price', 'Carbon Price', null, 'Market', 2)]),
        comp('biodiversity', 'Biodiversity Score', null, null, [leaf('iucn', 'IUCN Proximity', null, 'IUCN Red List', 2)]),
        comp('community', 'Community Jobs', null, null, [leaf('direct', 'Direct Employment', null, 'Project Data', 3)]),
      ], ['Costanza et al. (2014)', 'TEEB', 'IUCN NbS Standard'], 'Triple-dividend NbS valuation'),

      m('ecosystem_value', 'Ecosystem Service Value', 'Per-hectare annual value', null, [
        leaf('costanza', 'Costanza et al. Estimate', null, 'Global meta-analysis', 3),
        leaf('ecosystem_type', 'Ecosystem Type', null, 'Classification', 1),
        leaf('gdp_deflator', '2024 USD Adjustment', null, 'IMF', 1),
      ], ['Costanza et al. (2014)', 'TEEB Database'], 'Ecosystem service valuation by type'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // SPRINT CS — Taxonomy & Assessment Engine
  // ═══════════════════════════════════════════════════════════════════
  '/transition-risk-taxonomy-browser': {
    moduleCode: 'EP-CS1', sprint: 'CS',
    metrics: [
      m('node_count', 'Total Taxonomy Nodes', 'countByLevel(TAXONOMY_TREE)', '472', [
        comp('level1', 'Level 1 Topics', '9', null, [leaf('topics', '9 transition risk topics', null, 'taxonomyTree.js', 1)]),
        comp('level2', 'Level 2 Sub-topics', '38', null, [leaf('subtopics', '38 sub-topic categories', null, 'taxonomyTree.js', 1)]),
        comp('level3', 'Level 3 Sub-sub-topics', '109', null, [leaf('subsub', '109 granular categories', null, 'taxonomyTree.js', 1)]),
        comp('level4', 'Level 4 Leaf Nodes', '316', null, [leaf('leaves', '316 assessment endpoints', null, 'taxonomyTree.js', 1)]),
      ], ['taxonomyTree.js', 'PCAF', 'NGFS', 'IPCC AR6'], 'Hierarchical node count across 4 taxonomy levels'),

      m('data_sources', 'Reference Data Sources', 'REFERENCE_DATA_SOURCES.length', '24', [
        leaf('cdp', 'CDP', 'ESG Disclosure', 'cdp.net', 2),
        leaf('sbti', 'SBTi', 'Target Validation', 'sciencebasedtargets.org', 1),
        leaf('pcaf', 'PCAF', 'GHG Standard', 'carbonaccountingfinancials.com', 1),
        leaf('ngfs', 'NGFS', 'Climate Scenarios', 'ngfs.net', 1),
        leaf('iea', 'IEA', 'Energy Data', 'iea.org', 1),
        leaf('wri', 'WRI GPPD', 'Power Plants', 'wri.org', 2),
        leaf('epa', 'EPA GHGRP', 'US Facilities', 'epa.gov', 2),
        leaf('eutl', 'EU ETS EUTL', 'EU Installations', 'ec.europa.eu', 1),
      ], ['24 external data providers'], 'Registry of all reference data sources mapped to taxonomy'),

      m('score_aggregate', 'Aggregated Score', '\u03a3(child.score \u00d7 child.weight) / \u03a3(child.weight)', null, [
        leaf('leaf_scores', 'L4 Leaf Scores', '0-100 each', 'Assessment Input', 2),
        leaf('weights', 'Node Weights', 'Per taxonomy definition', 'taxonomyTree.js', 1),
        leaf('dq_propagation', 'DQ Propagation', 'min(children)', 'PCAF Standard', 1),
      ], ['taxonomyTree.js', 'PCAF'], 'Bottom-up weighted aggregation through 4 levels'),
    ],
  },

  '/assessment-engine-dashboard': {
    moduleCode: 'EP-CS2', sprint: 'CS',
    metrics: [
      m('portfolio_score', 'Portfolio Transition Score', 'AUM-weighted avg of entity scores', null, [
        leaf('entity_scores', 'Entity-Level Scores', null, 'Taxonomy Assessment', 2),
        leaf('exposures', 'AUM Weights', null, 'Portfolio Data', 1),
      ], ['Taxonomy Assessment', 'Portfolio Context'], 'Exposure-weighted average across all entities'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // SPRINT CT — FI Profiler
  // ═══════════════════════════════════════════════════════════════════
  '/fi-client-portfolio-analyzer': {
    moduleCode: 'EP-CT1', sprint: 'CT',
    metrics: [
      m('total_exposure', 'Total Exposure', '\u03a3(client_exposure_i)', '$12.1B', [
        comp('corporate', 'Corporate Banking', '$5.2B', null, [leaf('corp_clients', '22 borrowers', null, 'Loan Book', 1)]),
        comp('ib', 'Investment Banking', '$3.1B', null, [leaf('ib_clients', '12 borrowers', null, 'Trading Book', 1)]),
        comp('wealth', 'Wealth Management', '$2.4B', null, [leaf('wm_clients', '10 clients', null, 'AUM', 1)]),
        comp('txn', 'Transaction Banking', '$1.4B', null, [leaf('txn_clients', '6 counterparties', null, 'Exposure', 1)]),
      ], ['Loan Book', 'Trading Book', 'AUM Records'], 'Sum of all client exposures by line of business'),

      m('avg_score', 'Average Transition Score', 'exposure-weighted mean', '54', [
        leaf('score_dist', 'Score Distribution', 'Min 18 \u2014 Max 82', 'Assessment', 2),
        leaf('weight_method', 'Weighting', 'Exposure-weighted', 'Model', 1),
      ], ['Taxonomy Assessment'], 'Higher = better transition readiness'),

      m('watchlist', 'Watchlist Count', 'count where score < 40', '19', [
        leaf('threshold', 'Threshold', '<40 = HIGH RISK', 'Risk Framework', 1),
        leaf('engagement', 'Engagement Status', 'Open/In Progress', 'Stewardship', 3),
      ], ['Risk Framework'], 'Clients requiring enhanced engagement'),

      m('hhi', 'Sector HHI', '\u03a3(sector_share\u00b2)', null, [
        leaf('shares', 'Sector Shares', 'From concentration analysis', 'Loan Book', 1),
        leaf('threshold', 'Concentration Threshold', '>0.25 = high, <0.15 = diversified', 'Basel IV', 1),
      ], ['Basel IV Large Exposures'], 'Herfindahl-Hirschman Index for sector concentration'),
    ],
  },

  '/fi-regulatory-capital-overlay': {
    moduleCode: 'EP-CT4', sprint: 'CT',
    metrics: [
      m('rwa_climate', 'Climate-Adjusted RWA', 'RWA_base + ClimateAddon', null, [
        comp('rwa_base', 'RWA Base', null, null, [
          leaf('sa_rwa', 'SA Risk Weights', null, 'Basel IV CRE20', 1),
          leaf('irb_rwa', 'IRB Risk Weights', 'f(PD,LGD,M,S)', 'Basel IV IRB Formula', 1),
          leaf('output_floor', 'Output Floor', 'IRB \u2265 72.5% \u00d7 SA', 'Basel IV Phase-in', 1),
        ]),
        comp('climate_addon', 'Climate Risk Addon', null, null, [
          leaf('p2r', 'Pillar 2 Climate Requirement', null, 'ECB SREP', 2),
          leaf('scb', 'Stress Capital Buffer', null, 'ECB CST Scenario', 2),
        ]),
      ], ['Basel IV', 'ECB SREP', 'BoE PRA'], 'Regulatory capital with climate risk overlay',
      [{ param: 'PD Uplift', impact: 4.2 }, { param: 'LGD Stress', impact: 2.8 }]),
    ],
  },
};

export default MODULE_METADATA;
