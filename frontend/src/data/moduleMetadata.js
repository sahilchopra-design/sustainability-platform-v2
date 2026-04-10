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

/** Find a metric in module metadata by matching displayed text — searches children recursively */
export function findMetricByText(text, moduleData) {
  if (!moduleData || !moduleData.metrics) return null;
  const cleanText = text.replace(/[$,%\u00b0\u20ac\u00a3B\bM\b]/g, '').trim();

  // Normalize text for matching
  const lowerText = text.toLowerCase();
  const textNums = text.match(/[\d.]+/g) || [];

  function matchNode(node) {
    // 1. Explicit matchTexts
    if (node.matchTexts && node.matchTexts.some(t => text.includes(t))) return node;
    // 2. Value match (exact substring)
    if (node.value && text.includes(String(node.value))) return node;
    // 3. Label match (exact or case-insensitive contains)
    if (node.label && (text === node.label || lowerText.includes(node.label.toLowerCase()))) return node;
    // 4. Label keyword match (label contains a word from the clicked text)
    if (node.label) {
      const labelWords = node.label.toLowerCase().split(/[\s/]+/).filter(w => w.length > 3);
      if (labelWords.some(w => lowerText.includes(w))) return node;
    }
    // 5. Children value/label match
    if (node.children) {
      for (const child of node.children) {
        if (child.value && text.includes(String(child.value))) return node;
        if (child.label && text === child.label) return node;
      }
    }
    return null;
  }

  // Pass 1: Try each metric
  for (const metric of moduleData.metrics) {
    const match = matchNode(metric);
    if (match) return match;
  }

  // Pass 2: Fuzzy numeric matching — extract numbers from text and match against metric tree
  for (const numStr of textNums) {
    const num = parseFloat(numStr);
    if (isNaN(num)) continue;
    for (const metric of moduleData.metrics) {
      if (metric.numericMatch && Math.abs(metric.numericMatch - num) < num * 0.01) return metric;
      // Check children numeric values
      if (metric.children) {
        for (const child of metric.children) {
          if (child.value) {
            const childNum = parseFloat(String(child.value).replace(/[^0-9.-]/g, ''));
            if (!isNaN(childNum) && Math.abs(childNum - num) < Math.max(0.1, num * 0.05)) return metric;
          }
        }
      }
    }
  }

  // Pass 3: Match by metric key keywords against the KPI label text shown above the value
  // The clicked text is likely the VALUE, but the LABEL is in a sibling/parent element
  // Try matching the first metric whose label keywords appear near the click target
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

  // ═══════════════════════════════════════════════════════════════════
  // FINANCIAL — PCAF, Capital, CVaR, SFDR, Temperature, ESG, Transition
  // ═══════════════════════════════════════════════════════════════════
  '/pcaf-financed-emissions': {
    moduleCode: 'F-001', sprint: 'FIN',
    metrics: [
      m('total_fe', 'Total Financed Emissions', '\u03a3(AF_i \u00d7 CompanyEmissions_i)', null, [
        comp('equity_fe', 'Listed Equity Attribution', '145.2M tCO\u2082e', null, [
          leaf('eq_scope1', 'Equity Scope 1', '98.4M tCO\u2082e', 'CDP Reports', 2),
          leaf('eq_scope2', 'Equity Scope 2', '46.8M tCO\u2082e', 'CDP Reports', 2),
          leaf('eq_evic', 'Equity EVIC Denominator', '$280B', 'Bloomberg', 2),
        ]),
        comp('bond_fe', 'Corporate Bond Attribution', '52.8M tCO\u2082e', null, [
          leaf('bd_scope1', 'Bond Scope 1', '35.1M tCO\u2082e', 'Company Reports', 2),
          leaf('bd_scope2', 'Bond Scope 2', '17.7M tCO\u2082e', 'Company Reports', 3),
          leaf('bd_evic_debt', 'Bond (EVIC+Debt) Denominator', '$420B', 'Bloomberg', 2),
        ]),
        comp('re_fe', 'Commercial RE Attribution', '18.6M tCO\u2082e', null, [
          leaf('re_epc', 'EPC-based Emissions', '12.1M tCO\u2082e', 'EPC Register', 3),
          leaf('re_proxy', 'Floor-area Proxy', '6.5M tCO\u2082e', 'CRREM / PCAF DB', 4),
        ]),
        comp('mortgage_fe', 'Mortgage Attribution', '6.9M tCO\u2082e', null, [
          leaf('mg_epc', 'Mortgage EPC Emissions', '4.2M tCO\u2082e', 'EPC Register', 3),
          leaf('mg_proxy', 'National Average Proxy', '2.7M tCO\u2082e', 'PCAF DB', 5),
        ]),
      ], ['PCAF v3', 'CDP', 'Bloomberg', 'EPC Register'],
      'PCAF Global GHG Standard v3 attribution across 5 asset classes',
      [{ param: 'EVIC Data Lag', impact: 5.2 }, { param: 'Scope 2 Method', impact: 3.1 }]),

      m('waci_pcaf', 'WACI', '\u03a3(w_i \u00d7 Emissions_i / Revenue_i)', null, [
        comp('energy_waci_p', 'Energy Sector WACI', '412 tCO\u2082/$M', 0.22, [
          leaf('en_emis_wp', 'Energy Emissions', '145M tCO\u2082e', 'CDP', 2),
          leaf('en_rev_wp', 'Energy Revenue', '$352B', 'Bloomberg', 2),
        ]),
        comp('materials_waci_p', 'Materials WACI', '285 tCO\u2082/$M', 0.15, [
          leaf('mat_emis_wp', 'Materials Emissions', '62M tCO\u2082e', 'CDP', 2),
        ]),
        comp('tech_waci_p', 'Technology WACI', '8.3 tCO\u2082/$M', 0.28, [
          leaf('tech_emis_wp', 'Tech Emissions', '2.1M tCO\u2082e', 'CDP', 2),
        ]),
      ], ['PCAF', 'CDP', 'Bloomberg'], 'PCAF weighted average carbon intensity'),

      m('avg_dqs', 'Average Data Quality Score', '\u03a3(DQS_i \u00d7 w_i) / \u03a3 w_i', null, [
        comp('dq_class1', 'DQS \u2014 Listed Equity', '2.1', 0.45, [
          leaf('dq_cdp', 'CDP-reported', '1.8', 'CDP', 2),
          leaf('dq_proxy_p', 'Proxy-estimated', '3.4', 'PCAF DB', 4),
        ]),
        comp('dq_class2', 'DQS \u2014 Corporate Bonds', '2.4', 0.25, [
          leaf('dq_bd_rep', 'Reported bonds', '2.0', 'Company Reports', 2),
          leaf('dq_bd_est', 'Estimated bonds', '3.2', 'Revenue Proxy', 4),
        ]),
        comp('dq_class4', 'DQS \u2014 Commercial RE', '3.2', 0.18, [
          leaf('dq_epc_p', 'EPC-backed', '2.5', 'EPC Register', 3),
          leaf('dq_floor', 'Floor-area proxy', '4.0', 'National Stats', 5),
        ]),
      ], ['PCAF v3'], 'Weighted average data quality across asset classes'),

      m('carbon_cost_p', 'Carbon Cost Exposure', '\u03a3(FE_i \u00d7 CarbonPrice)', null, [
        comp('cost_scope1', 'Scope 1 Cost', '$12.8B', null, [
          leaf('fe_s1_cost', 'Scope 1 FE', '133.6M tCO\u2082e', 'CDP', 2),
          leaf('price_s1', 'Carbon Price', '\u20ac95/t', 'EU ETS', 1),
        ]),
        comp('cost_scope2', 'Scope 2 Cost', '$7.7B', null, [
          leaf('fe_s2_cost', 'Scope 2 FE', '80.6M tCO\u2082e', 'CDP', 2),
          leaf('price_s2', 'Carbon Price', '\u20ac95/t', 'EU ETS', 1),
        ]),
      ], ['EU ETS', 'CDP'], 'Shadow carbon cost exposure'),

      // ── Tab 2: Insurance ──
      m('insurance_fe', 'Insurance FE', '\u03a3(GWP_i \u00d7 EF_sector)', null, [
        comp('property_fe', 'Property Insurance FE', '8.4M tCO\u2082e', null, [
          leaf('prop_gwp', 'Property GWP', '$12.5B', 'Insurer Book', 1),
          leaf('prop_ef', 'Property Sector EF', '672 tCO\u2082/$M GWP', 'PCAF Insurance DB', 3),
        ]),
        comp('casualty_fe', 'Casualty Insurance FE', '3.2M tCO\u2082e', null, [
          leaf('cas_gwp', 'Casualty GWP', '$8.1B', 'Insurer Book', 1),
          leaf('cas_ef', 'Casualty Sector EF', '395 tCO\u2082/$M GWP', 'PCAF Insurance DB', 3),
        ]),
        comp('specialty_fe', 'Specialty Lines FE', '5.1M tCO\u2082e', null, [
          leaf('spec_gwp', 'Specialty GWP', '$6.2B', 'Insurer Book', 1),
          leaf('spec_ef', 'Specialty EF', '823 tCO\u2082/$M GWP', 'PCAF Insurance DB', 4),
        ]),
      ], ['PCAF Insurance', 'NZIA'], 'PCAF insurance-associated emissions'),

      m('avg_intensity_ins', 'Avg Intensity (tCO\u2082e/$M GWP)', 'Total Insurance FE / Total GWP', null, [
        leaf('total_ins_fe', 'Total Insurance FE', '16.7M tCO\u2082e', 'Above calculation', 2),
        leaf('total_gwp_ins', 'Total GWP', '$26.8B', 'Insurer Book', 1),
        leaf('benchmark_intensity', 'NZIA Benchmark', '580 tCO\u2082/$M', 'NZIA', 2),
      ], ['PCAF', 'NZIA'], 'Insurance carbon intensity metric'),

      m('loss_ratio_climate', 'Climate Loss Ratio', 'Climate Claims / Climate Premium', null, [
        comp('climate_claims', 'Climate-Attributable Claims', '$1.8B', null, [
          leaf('flood_claims_ins', 'Flood Claims', '$680M', 'Claims DB', 1),
          leaf('storm_claims_ins', 'Storm Claims', '$720M', 'Claims DB', 1),
          leaf('heat_claims_ins', 'Heat/Drought Claims', '$400M', 'Claims DB', 2),
        ]),
        comp('climate_premium', 'Climate-Loaded Premium', '$2.4B', null, [
          leaf('base_prem', 'Base Premium', '$2.1B', 'Pricing Model', 1),
          leaf('climate_loading', 'Climate Loading', '+$0.3B', 'Cat Model', 3),
        ]),
      ], ['Claims DB', 'Cat Model'], 'Climate-specific loss ratio'),

      // ── Tab 3: Facilitated Emissions ──
      m('facilitated_emissions', 'Facilitated Emissions', '\u03a3(Facilitation_i \u00d7 CompanyEmissions_i)', null, [
        comp('underwriting_carbon', 'Underwriting FE', '42.5M tCO\u2082e', null, [
          leaf('uw_energy', 'Energy Underwriting', '28.1M tCO\u2082e', 'PCAF Facilitated', 3),
          leaf('uw_industrial', 'Industrial Underwriting', '14.4M tCO\u2082e', 'PCAF Facilitated', 3),
        ]),
        comp('advisory_carbon', 'Advisory/Arranging FE', '18.2M tCO\u2082e', null, [
          leaf('ipo_facil', 'IPO Facilitation', '8.4M tCO\u2082e', 'League Tables', 3),
          leaf('bond_facil', 'Bond Arranging', '9.8M tCO\u2082e', 'League Tables', 3),
        ]),
      ], ['PCAF v3 Facilitated', 'League Tables'], 'PCAF facilitated emissions methodology'),

      // ── Tab 4: Data Quality ──
      m('portfolio_dqs', 'Portfolio DQS', '\u03a3(DQS_i \u00d7 FE_i) / \u03a3 FE_i', null, [
        comp('dqs_by_class', 'DQS by Asset Class', null, null, [
          leaf('dqs_equity', 'Listed Equity DQS', '2.1', 'PCAF', 2),
          leaf('dqs_bonds', 'Corporate Bond DQS', '2.4', 'PCAF', 2),
          leaf('dqs_re', 'Real Estate DQS', '3.2', 'PCAF', 3),
        ]),
        comp('dqs_distribution', 'DQS Distribution', null, null, [
          leaf('dqs_1_pct', 'DQS 1 (Audited)', '18%', 'Classification', 1),
          leaf('dqs_2_pct', 'DQS 2 (Reported)', '35%', 'Classification', 2),
          leaf('dqs_345_pct', 'DQS 3\u20135 (Estimated)', '47%', 'Classification', 4),
        ]),
      ], ['PCAF v3'], 'Data quality score distribution'),

      m('coverage_pct', 'Coverage %', 'Reported / Total \u00d7 100', null, [
        comp('s1_coverage', 'Scope 1 Coverage', '82%', null, [
          leaf('s1_cdp_cov', 'CDP-Reported', '68%', 'CDP', 2),
          leaf('s1_direct_cov', 'Direct Company', '14%', 'Company Reports', 2),
        ]),
        comp('s2_coverage', 'Scope 2 Coverage', '75%', null, [
          leaf('s2_market_cov', 'Market-based', '52%', 'CDP', 2),
          leaf('s2_location_cov', 'Location-based', '23%', 'IEA Grid EF', 3),
        ]),
      ], ['CDP', 'PCAF'], 'Emissions data coverage'),

      // ── Tab 5: Reference Data ──
      m('sector_median_evic', 'Sector Median EVIC', 'Median EVIC by GICS sector', null, [
        comp('energy_evic', 'Energy Sector EVIC', '$42B median', null, [
          leaf('evic_source', 'EVIC Data', '$42B', 'Bloomberg / EODHD', 2),
          leaf('evic_lag', 'Data Lag', '3\u20136 months', 'Reporting Cycle', 2),
        ]),
        comp('tech_evic', 'Tech Sector EVIC', '$85B median', null, [
          leaf('tech_evic_src', 'Tech EVIC', '$85B', 'Bloomberg', 2),
        ]),
      ], ['Bloomberg', 'EODHD'], 'EVIC reference by sector'),

      m('grid_ef_applied', 'Grid EF Applied', 'National/regional grid EF', null, [
        leaf('iea_ef', 'IEA Grid Factor', '0.42 kgCO\u2082/kWh', 'IEA', 1),
        leaf('cea_ef_ref', 'CEA India Factor', '0.72 kgCO\u2082/kWh', 'CEA India', 1),
        leaf('epa_egrid_ref', 'EPA eGRID Factor', '0.39 kgCO\u2082/kWh', 'EPA eGRID', 1),
      ], ['IEA', 'CEA India', 'EPA'], 'Grid emission factor reference'),

      // ── Tab 6: Formula Engine ──
      m('attribution_factor', 'Attribution Factor', 'Outstanding / Denominator', null, [
        comp('af_equity_calc', 'Equity AF', 'Investment / EVIC', null, [
          leaf('investment_val', 'Investment Value', '$15B', 'Portfolio', 1),
          leaf('evic_denom', 'EVIC Denominator', '$280B', 'Bloomberg', 2),
        ]),
        comp('af_bond_calc', 'Bond AF', 'Investment / (EVIC + Debt)', null, [
          leaf('bond_investment', 'Bond Investment', '$8B', 'Portfolio', 1),
          leaf('evic_debt_denom', 'EVIC + Debt', '$420B', 'Bloomberg', 2),
        ]),
      ], ['PCAF v3'], 'Attribution factor calculation engine'),

      m('revenue_proxy', 'Revenue Proxy Factor', 'CompanyRev / SectorMedianRev \u00d7 SectorEF', null, [
        leaf('company_rev', 'Company Revenue', null, 'EODHD / Annual Report', 2),
        leaf('sector_median_rev', 'Sector Median Revenue', null, 'Bloomberg', 2),
        leaf('sector_ef_proxy', 'Sector Emission Factor', null, 'PCAF DB / DEFRA', 4),
      ], ['PCAF v3', 'DEFRA'], 'Revenue-based proxy methodology (DQS 4)'),

      // ── Tab 7: Downstream Reporting ──
      m('esrs_e1_emissions', 'ESRS E1 Emissions', 'Mapping to ESRS E1 disclosure', null, [
        comp('e1_1_plan', 'E1-1 Transition Plan', null, null, [
          leaf('plan_status', 'Plan Completeness', '72%', 'Internal Assessment', 2),
          leaf('plan_targets', 'Target Coverage', '85%', 'SBTi / Internal', 2),
        ]),
        comp('e1_6_ghg', 'E1-6 GHG Emissions', null, null, [
          leaf('e1_s1', 'Scope 1 Gross', '24.6M tCO\u2082e', 'GHG Protocol', 2),
          leaf('e1_s2', 'Scope 2 (market)', '8.2M tCO\u2082e', 'GHG Protocol', 2),
          leaf('e1_s3', 'Scope 3 Material', '82.1M tCO\u2082e', 'GHG Protocol', 3),
        ]),
      ], ['ESRS E1', 'EFRAG'], 'CSRD ESRS E1 mapping'),

      m('eba_pillar3', 'EBA Pillar 3 Template', 'P3 climate disclosure tables', null, [
        comp('template1', 'Template 1 \u2014 Banking Book', null, null, [
          leaf('t1_fe', 'Financed Emissions', '223.5M tCO\u2082e', 'PCAF', 2),
          leaf('t1_gar', 'Green Asset Ratio', '7.5%', 'EU Taxonomy', 1),
        ]),
        comp('template5', 'Template 5 \u2014 Top-20 Carbon', null, null, [
          leaf('t5_top20', 'Top 20 Emitters', '68% of FE', 'CDP + PCAF', 2),
        ]),
      ], ['EBA ITS', 'CRR III'], 'EBA Pillar 3 climate template mapping'),

      // ── Tab 8: Audit Trail ──
      m('audit_completeness', 'Audit Completeness', 'Audited / Total data points \u00d7 100', null, [
        comp('audited_points', 'Audited Data Points', '68%', null, [
          leaf('s1_audited', 'Scope 1 Audited', '85%', 'ISAE 3410', 1),
          leaf('s2_audited', 'Scope 2 Audited', '78%', 'ISAE 3410', 1),
        ]),
        comp('unaudited_points', 'Unaudited Data Points', '32%', null, [
          leaf('s3_unaudited', 'Scope 3 Unaudited', '62%', 'Self-Reported', 3),
        ]),
      ], ['ISAE 3410', 'PCAF v3'], 'Data audit completeness'),

      m('data_vintage', 'Data Vintage', 'Weighted avg data age (months)', null, [
        leaf('vintage_reported', 'Reported Data Vintage', '8 months', 'CDP Cycle', 2),
        leaf('vintage_estimated', 'Estimated Data Vintage', '18 months', 'PCAF DB', 4),
        leaf('vintage_proxy', 'Proxy Data Vintage', '24 months', 'National Stats', 5),
      ], ['PCAF v3'], 'Data freshness assessment'),
    ],
  },

  '/climate-capital-adequacy': {
    moduleCode: 'F-002', sprint: 'FIN',
    metrics: [
      m('cet1_ratio', 'CET1 Ratio (Climate-Adj)', 'CET1_Capital / ClimateRWA', null, [
        comp('cet1_cap', 'CET1 Capital', '\u20ac48.2B', null, [
          leaf('cet1_base_f2', 'CET1 Base Capital', '\u20ac52.1B', 'Pillar 3 Report', 1),
          leaf('climate_deductions', 'Climate Deductions', '\u2212\u20ac3.9B', 'ECB SREP', 2),
        ]),
        comp('climate_rwa_denom', 'Climate-Adjusted RWA', '\u20ac312B', null, [
          leaf('rwa_base_ca', 'Base RWA', '\u20ac285B', 'Pillar 3 Report', 1),
          leaf('rwa_addon_f2', 'Climate P2R Addon', '\u20ac27B', 'ECB SREP', 2),
        ]),
      ], ['ECB SREP', 'Basel IV', 'Pillar 3 Disclosures'], 'CET1 with climate risk overlay'),

      m('capital_shortfall', 'Capital Shortfall', 'max(0, Required_CET1 \u2212 Available_CET1)', null, [
        comp('req_cet1', 'Required CET1', '\u20ac42.1B', null, [
          leaf('p1_req', 'Pillar 1 Requirement', '\u20ac25.6B', 'CRR III', 1),
          leaf('p2r_req', 'P2R Climate Requirement', '\u20ac8.5B', 'ECB SREP', 2),
          leaf('ccyb', 'Countercyclical Buffer', '\u20ac8.0B', 'Macropru Authority', 1),
        ]),
        comp('avail_cet1', 'Available CET1', '\u20ac48.2B', null, [
          leaf('cet1_bal', 'CET1 Balance', '\u20ac52.1B', 'Pillar 3', 1),
          leaf('climate_ded', 'Climate Deductions', '\u2212\u20ac3.9B', 'ECB SREP', 2),
        ]),
      ], ['ECB SREP', 'CRR III'], 'Climate capital gap analysis'),

      m('gar_pct', 'Green Asset Ratio', 'Aligned / Covered \u00d7 100', null, [
        comp('tax_aligned', 'Taxonomy-Aligned Assets', '\u20ac18.4B', null, [
          leaf('sub_contrib_f2', 'Substantial Contribution', '\u20ac14.2B', 'EU Taxonomy Reg', 1),
          leaf('dnsh_pass_f2', 'DNSH Passing', '\u20ac4.2B', 'EU Taxonomy TSC', 1),
        ]),
        comp('covered_assets', 'Total Covered Assets', '\u20ac245B', null, [
          leaf('on_bs', 'On-Balance Sheet', '\u20ac198B', 'Pillar 3', 1),
          leaf('off_bs', 'Off-Balance Sheet', '\u20ac47B', 'Pillar 3', 1),
        ]),
      ], ['EU Taxonomy Regulation', 'CRR III Pillar 3'], 'EBA Green Asset Ratio'),

      // ── Tab: Basel IV Stack ──
      m('at1_ratio', 'AT1 Ratio', 'AT1_Capital / RWA \u00d7 100', null, [
        comp('at1_instruments', 'AT1 Instruments', '\u20ac8.5B', null, [
          leaf('at1_cocos', 'CoCo Bonds', '\u20ac6.2B', 'Pillar 3', 1),
          leaf('at1_perp', 'Perpetual Notes', '\u20ac2.3B', 'Pillar 3', 1),
        ]),
        comp('at1_deductions', 'AT1 Deductions', '\u2212\u20ac0.4B', null, [
          leaf('at1_ded_detail', 'Regulatory Deductions', '\u2212\u20ac0.4B', 'CRR III', 1),
        ]),
      ], ['CRR III', 'Pillar 3'], 'Additional Tier 1 capital ratio'),

      m('tlac_ratio', 'TLAC Ratio', '(CET1+AT1+T2+Sr_Debt) / RWA', null, [
        comp('tlac_numerator', 'TLAC-Eligible Capital', '\u20ac78B', null, [
          leaf('tlac_cet1', 'CET1 Component', '\u20ac48.2B', 'Pillar 3', 1),
          leaf('tlac_at1', 'AT1 Component', '\u20ac8.1B', 'Pillar 3', 1),
          leaf('tlac_t2', 'Tier 2 Component', '\u20ac12.4B', 'Pillar 3', 1),
          leaf('tlac_senior', 'Senior Non-Preferred', '\u20ac9.3B', 'Resolution Plan', 1),
        ]),
        comp('tlac_denom', 'TLAC RWA', '\u20ac312B', null, [
          leaf('tlac_rwa_base', 'Base RWA', '\u20ac285B', 'Pillar 3', 1),
        ]),
      ], ['FSB TLAC', 'CRR III'], 'Total Loss-Absorbing Capacity'),

      // ── Tab: Climate RWA ──
      m('climate_rwa_total', 'Climate RWA', '\u03a3(AssetClass_RWA \u00d7 Climate_Mult)', null, [
        comp('green_loan_adj', 'Green Loan Adjustment', '\u2212\u20ac4.2B RWA', null, [
          leaf('green_loan_vol', 'Green Loan Volume', '\u20ac28B', 'Loan Book', 1),
          leaf('gsf_factor', 'Green Supporting Factor', '0.85x', 'CRR III Art 501a', 1),
        ]),
        comp('fossil_haircut', 'Fossil Fuel Haircut', '+\u20ac8.5B RWA', null, [
          leaf('fossil_exposure', 'Fossil Exposure', '\u20ac42B', 'Loan Book', 1),
          leaf('penalizing_factor', 'Penalizing Factor', '1.20x', 'ECB C&E', 2),
        ]),
        comp('re_climate_rwa', 'Real Estate Climate RWA', '\u20ac92B', null, [
          leaf('epc_adjustment', 'EPC-Based Adjustment', '+\u20ac5.2B', 'EPC Register', 3),
        ]),
      ], ['Basel IV', 'ECB C&E', 'CRR III'], 'Climate-adjusted risk-weighted assets'),

      // ── Tab: DFAST/CCAR ──
      m('ecl_9quarter', 'ECL 9-Quarter', '\u03a3(PD_t \u00d7 LGD_t \u00d7 EAD_t) for t=1..9', null, [
        comp('ecl_base_9q', 'Base ECL Path', '\u20ac4.8B', null, [
          leaf('ecl_q1_3', 'Q1\u2013Q3 ECL', '\u20ac1.2B', 'ECB CST', 2),
          leaf('ecl_q4_6', 'Q4\u2013Q6 ECL (peak)', '\u20ac2.4B', 'ECB CST', 2),
          leaf('ecl_q7_9', 'Q7\u2013Q9 ECL (recovery)', '\u20ac1.2B', 'ECB CST', 2),
        ]),
        comp('ecl_severe_9q', 'Severely Adverse ECL', '\u20ac8.2B', null, [
          leaf('ecl_severe_peak', 'Peak Quarter ECL', '\u20ac1.4B', 'DFAST Scenario', 2),
        ]),
      ], ['ECB CST', 'Fed DFAST', 'BoE CBES'], 'Cumulative 9-quarter expected credit loss'),

      m('cet1_path_min', 'CET1 Path Minimum', 'min(CET1_t) over 9 quarters', null, [
        comp('cet1_trough', 'CET1 Trough', '11.2%', null, [
          leaf('trough_quarter', 'Trough Quarter', 'Q6', 'Stress Model', 2),
          leaf('trough_driver', 'Primary Driver', 'ECL + PPNR', 'Stress Model', 2),
        ]),
        comp('management_actions', 'Management Actions', '+0.8%', null, [
          leaf('div_suspension', 'Dividend Suspension', '+0.5%', 'Capital Plan', 1),
          leaf('at1_conversion', 'AT1 Conversion Trigger', '5.125%', 'Prospectus', 1),
        ]),
      ], ['ECB CST', 'DFAST'], 'Minimum CET1 over stress horizon'),

      m('ppnr_impact_ca', 'PPNR Climate Impact', '\u0394NII + \u0394NFI + \u0394OpEx', null, [
        comp('nii_climate', 'NII Climate Impact', '\u2212\u20ac1.8B', null, [
          leaf('rate_pass', 'Rate Pass-Through', '\u2212\u20ac0.9B', 'ALM Model', 2),
          leaf('volume_decline', 'Volume Decline', '\u2212\u20ac0.9B', 'Business Plan', 3),
        ]),
        comp('nfi_climate', 'Non-Interest Income', '\u2212\u20ac0.6B', null, [
          leaf('fee_climate', 'Fee Income Impact', '\u2212\u20ac0.4B', 'Internal', 3),
          leaf('trading_climate', 'Trading Impact', '\u2212\u20ac0.2B', 'FRTB', 3),
        ]),
      ], ['Internal ALM', 'FRTB'], 'Climate PPNR impact'),
    ],
  },

  '/climate-cvar-suite': {
    moduleCode: 'F-003', sprint: 'FIN',
    metrics: [
      m('cvar_95', 'CVaR 95%', 'E[Loss | Loss > VaR_95]', null, [
        comp('physical_cvar', 'Physical CVaR', '\u22124.8%', null, [
          leaf('flood_cvar', 'Flood CVaR', '\u22121.9%', 'NGFS + Cat Model', 3),
          leaf('heat_cvar', 'Heat Stress CVaR', '\u22121.4%', 'NGFS + Internal', 3),
          leaf('wind_cvar', 'Windstorm CVaR', '\u22121.5%', 'NGFS + Cat Model', 3),
        ]),
        comp('transition_cvar', 'Transition CVaR', '\u22127.2%', null, [
          leaf('carbon_cvar', 'Carbon Price CVaR', '\u22123.8%', 'NGFS NZ2050', 2),
          leaf('demand_cvar', 'Demand Destruction CVaR', '\u22122.1%', 'NGFS Below2D', 2),
          leaf('policy_cvar', 'Policy Shock CVaR', '\u22121.3%', 'NGFS Divergent', 3),
        ]),
      ], ['NGFS Phase 5', 'Internal Cat Models'], 'Conditional Value-at-Risk climate scenarios'),

      m('expected_shortfall', 'Expected Shortfall', 'ES_99 = avg of worst 1% losses', null, [
        comp('es_systematic', 'Systematic Factor ES', '\u22129.8%', null, [
          leaf('carbon_factor', 'Carbon Factor Loading', '\u22120.42', 'Cross-sectional', 3),
          leaf('physical_factor', 'Physical Factor Loading', '\u22120.28', 'Geospatial', 3),
        ]),
        comp('es_idiosyncratic', 'Idiosyncratic ES', '\u22123.2%', null, [
          leaf('sector_conc', 'Sector Concentration', '0.18 HHI', 'Portfolio Analytics', 2),
          leaf('name_conc', 'Name Concentration', '0.05 HHI', 'Portfolio Analytics', 2),
        ]),
      ], ['NGFS', 'Internal'], 'Expected shortfall with climate factor decomposition'),

      m('portfolio_var', 'Portfolio VaR (95%)', 'Q_0.05 of loss distribution', null, [
        comp('parametric_var', 'Parametric VaR', '\u22123.2%', null, [
          leaf('vol_est', 'Volatility Estimate', '18.5% annualized', 'Bloomberg', 2),
          leaf('climate_vol_adj', 'Climate Vol Adjustment', '+2.3%', 'Internal', 3),
        ]),
        comp('historical_var', 'Historical VaR', '\u22123.8%', null, [
          leaf('hist_window', 'Window (5yr)', '1260 observations', 'Bloomberg', 2),
          leaf('climate_overlay', 'Climate Scenario Overlay', null, 'NGFS', 2),
        ]),
      ], ['Bloomberg', 'NGFS'], 'Value-at-Risk with climate adjustment'),

      m('copula_tail', 'Copula Tail Dependence', '\u03bb_lower from t-copula fit', null, [
        comp('lambda_lower', 'Lower Tail \u03bb', '0.32', null, [
          leaf('dof_copula', 'Degrees of Freedom', '\u03bd = 4.8', 't-Copula MLE', 3),
          leaf('rho_matrix', 'Correlation Matrix', '45\u00d745', 'Bloomberg', 2),
        ]),
        comp('gpd_index', 'GPD Tail Index', '\u03be = 0.28', null, [
          leaf('gpd_threshold', 'Threshold', '95th percentile', 'POT Method', 3),
          leaf('gpd_scale', 'Scale \u03c3', '0.015', 'GPD MLE', 3),
        ]),
      ], ['Internal Model'], 'Tail dependence via student-t copula + GPD'),

      // ── Tab: Factor Decomposition ──
      m('factor_decomp', 'Factor Decomposition', 'R_portfolio = \u03b1 + \u03a3(\u03b2_k \u00d7 F_k) + \u03b5', null, [
        comp('factor_beta_carbon', '\u03b2_carbon (Carbon Factor)', '\u22120.42', null, [
          leaf('carbon_factor_return', 'Carbon Factor Return', '\u22122.4% YTD', 'Factor Model', 3),
          leaf('carbon_tstat', 't-statistic', '3.42', 'OLS Regression', 3),
        ]),
        comp('factor_beta_policy', '\u03b2_policy (Policy Factor)', '\u22120.18', null, [
          leaf('policy_factor_return', 'Policy Factor Return', '\u22121.1% YTD', 'Factor Model', 3),
          leaf('policy_tstat', 't-statistic', '2.18', 'OLS Regression', 3),
        ]),
        comp('factor_beta_physical', '\u03b2_physical (Physical Factor)', '\u22120.28', null, [
          leaf('phys_factor_return', 'Physical Factor Return', '\u22120.9% YTD', 'Factor Model', 3),
        ]),
        comp('r_squared_decomp', 'R\u00b2 (Climate Factors)', '0.34', null, [
          leaf('adj_r2', 'Adjusted R\u00b2', '0.31', 'OLS', 3),
        ]),
      ], ['Internal Factor Model', 'Academic Literature'], 'Climate factor decomposition'),

      // ── Tab: Sensitivity Analysis ──
      m('var_sensitivity_carbon', 'VaR Sensitivity \u2014 Carbon Price', '\u2202VaR/\u2202P_carbon', null, [
        comp('sens_eu_ets', 'EU ETS +\u20ac20 Sensitivity', '\u22120.8% portfolio', null, [
          leaf('ets_impact_energy', 'Energy Sector', '\u22121.4%', 'Stress Model', 3),
          leaf('ets_impact_other', 'Other Sectors', '\u22120.3%', 'Stress Model', 3),
        ]),
        comp('sens_border_adj', 'Border Carbon +$30', '\u22120.4% portfolio', null, [
          leaf('cbam_sens', 'CBAM-Exposed', '\u22121.2%', 'Stress Model', 3),
        ]),
      ], ['Internal Stress Model'], 'Carbon price VaR sensitivity'),

      m('var_sensitivity_warming', 'VaR Sensitivity \u2014 Warming', '\u2202VaR/\u2202T(\u00b0C)', null, [
        comp('warming_2c', '+2\u00b0C Scenario', '\u22124.8% portfolio', null, [
          leaf('phys_loss_2c', 'Physical Losses', '\u22122.1%', 'NGFS', 2),
          leaf('trans_loss_2c', 'Transition Losses', '\u22122.7%', 'NGFS', 2),
        ]),
        comp('warming_3c', '+3\u00b0C Scenario', '\u22129.2% portfolio', null, [
          leaf('phys_loss_3c', 'Physical Losses', '\u22127.4%', 'NGFS', 2),
          leaf('trans_loss_3c', 'Transition Losses', '\u22121.8%', 'NGFS', 2),
        ]),
      ], ['NGFS Phase 5', 'IPCC AR6'], 'Temperature pathway VaR sensitivity'),

      // ── Tab: Back-Test ──
      m('backtest_hit_rate', 'Backtest Hit Rate', 'Days within VaR / Total Days', null, [
        comp('kupiec_test', 'Kupiec LR Test', 'p = 0.42 (pass)', null, [
          leaf('exceptions_kupiec', 'VaR Exceptions', '12 / 252', 'Historical', 2),
          leaf('expected_kupiec', 'Expected (5%)', '12.6', 'Model', 1),
        ]),
        comp('christoffersen_test', 'Christoffersen Test', 'p = 0.38 (pass)', null, [
          leaf('independence', 'Independence', 'p = 0.52', 'Statistical Test', 3),
          leaf('conditional_cov', 'Conditional Coverage', 'p = 0.38', 'Statistical Test', 3),
        ]),
      ], ['Basel Traffic Light', 'Internal Validation'], 'VaR backtesting framework'),

      // ── Tab: Optimizer ──
      m('efficient_frontier', 'Efficient Frontier Sharpe', 'max (R_p \u2212 R_f) / \u03c3_CVaR', null, [
        comp('max_sharpe_port', 'Max Sharpe Portfolio', 'Sharpe = 0.82', null, [
          leaf('opt_return', 'Expected Return', '8.4%', 'Factor Model', 3),
          leaf('opt_cvar', 'CVaR (95%)', '\u22124.2%', 'Optimization', 3),
        ]),
        comp('min_cvar_port', 'Min CVaR Portfolio', 'CVaR = \u22122.1%', null, [
          leaf('min_cvar_return', 'Expected Return', '5.8%', 'Factor Model', 3),
          leaf('min_cvar_val', 'CVaR', '\u22122.1%', 'Optimization', 3),
        ]),
      ], ['Internal Optimizer'], 'Climate-CVaR efficient frontier'),
    ],
  },

  '/sfdr-pai': {
    moduleCode: 'F-004', sprint: 'FIN',
    metrics: [
      m('pai1_ghg', 'PAI-1 GHG Emissions', '\u03a3(Investment/EVIC \u00d7 Scope1+2)', null, [
        comp('pai1_scope1', 'PAI-1 Scope 1 Attribution', '145.2M tCO\u2082e', null, [
          leaf('s1_reported_pai', 'Reported S1 (CDP)', '112M tCO\u2082e', 'CDP', 2),
          leaf('s1_estimated_pai', 'Estimated S1 (PCAF)', '33.2M tCO\u2082e', 'PCAF DB', 4),
        ]),
        comp('pai1_scope2', 'PAI-1 Scope 2 Attribution', '78.3M tCO\u2082e', null, [
          leaf('s2_market_pai', 'Market-based S2', '52.1M tCO\u2082e', 'CDP', 2),
          leaf('s2_location_pai', 'Location-based S2', '26.2M tCO\u2082e', 'IEA Grid Factors', 3),
        ]),
      ], ['SFDR Annex I', 'CDP', 'PCAF'], 'SFDR PAI Indicator 1 \u2014 Total GHG Emissions'),

      m('pai2_footprint', 'PAI-2 Carbon Footprint', 'TotalGHG / AUM_\u20acM', null, [
        comp('pai2_num', 'Numerator (Total GHG)', '223.5M tCO\u2082e', null, [
          leaf('pai2_s12', 'Scope 1+2 Total', '223.5M tCO\u2082e', 'CDP + PCAF', 2),
        ]),
        comp('pai2_denom', 'Denominator (AUM)', '\u20ac1,498M', null, [
          leaf('aum_nav_pai', 'Fund NAV', '\u20ac1,498M', 'Fund Admin', 1),
        ]),
      ], ['SFDR Annex I'], 'PAI-2 carbon footprint per \u20acM invested'),

      m('pai3_intensity', 'PAI-3 GHG Intensity', '\u03a3(Investment/EVIC \u00d7 Emissions/Revenue)', null, [
        comp('pai3_high_int', 'High Intensity Holdings', '285 tCO\u2082/\u20acM rev', null, [
          leaf('pai3_energy', 'Energy sector intensity', '412 tCO\u2082/\u20acM', 'CDP', 2),
          leaf('pai3_materials', 'Materials sector intensity', '285 tCO\u2082/\u20acM', 'CDP', 2),
        ]),
        comp('pai3_low_int', 'Low Intensity Holdings', '12 tCO\u2082/\u20acM rev', null, [
          leaf('pai3_tech', 'Technology intensity', '8 tCO\u2082/\u20acM', 'CDP', 2),
          leaf('pai3_finance', 'Finance intensity', '15 tCO\u2082/\u20acM', 'CDP', 2),
        ]),
      ], ['SFDR Annex I', 'CDP'], 'PAI-3 weighted GHG intensity of investees'),

      m('pai4_fossil', 'PAI-4 Fossil Fuel Exposure', 'Share of investments in fossil fuel companies', null, [
        comp('fossil_active', 'Active Fossil Revenue', '14.2%', null, [
          leaf('upstream_fossil', 'Upstream E&P', '8.1%', 'GICS / GOGEL', 1),
          leaf('midstream_fossil', 'Midstream', '3.2%', 'GICS / GOGEL', 1),
          leaf('downstream_fossil', 'Downstream Refining', '2.9%', 'GICS / GOGEL', 1),
        ]),
        comp('fossil_threshold', 'Revenue Threshold Applied', '>10%', null, [
          leaf('threshold_source', 'EU Climate Benchmark', '>10% revenue', 'EU BMR', 1),
        ]),
      ], ['SFDR Annex I', 'GOGEL', 'EU BMR'], 'PAI-4 fossil fuel company exposure'),

      m('pai5_water', 'PAI-5 Water & Waste', 'Emissions to water per \u20acM invested', null, [
        comp('pai5_water_em', 'Water Emissions', '1240 tonnes', null, [
          leaf('pai5_reported', 'Reported (E-PRTR)', '890 tonnes', 'E-PRTR', 2),
          leaf('pai5_estimated', 'Estimated (sector avg)', '350 tonnes', 'Eurostat', 4),
        ]),
        comp('pai5_waste', 'Hazardous Waste', '520 tonnes/\u20acM', null, [
          leaf('pai5_hw_rep', 'Reported waste', '380 tonnes', 'Company Reports', 2),
          leaf('pai5_hw_est', 'Estimated waste', '140 tonnes', 'Sector Proxy', 4),
        ]),
      ], ['SFDR Annex I', 'E-PRTR', 'Eurostat'], 'PAI-5 emissions to water'),

      // ── PAI 6-8: Biodiversity, Deforestation, Water ──
      m('pai6_biodiversity', 'PAI-6 Biodiversity', 'Share near sensitive areas', null, [
        comp('pai6_sites', 'Sites Near Biodiversity Areas', '8.2%', null, [
          leaf('natura2000', 'Natura 2000 Proximity', '5.1%', 'EEA', 1),
          leaf('kba_proximity', 'KBA Proximity', '3.1%', 'IBAT', 2),
        ]),
      ], ['SFDR Annex I', 'EEA', 'IBAT'], 'PAI-6 biodiversity sensitive areas'),

      m('pai7_water_stress', 'PAI-7 Water Stress', 'Investees in high water-stress areas', null, [
        leaf('high_stress_pct', 'High Stress Holdings', '22%', 'WRI Aqueduct', 2),
        leaf('extremely_high_pct', 'Extremely High', '8%', 'WRI Aqueduct', 2),
      ], ['SFDR Annex I', 'WRI Aqueduct'], 'PAI-7 water stress exposure'),

      // ── PAI 9-14: Social Indicators ──
      m('pai10_ungc', 'PAI-10 UNGC/OECD Violations', 'Companies in violation %', null, [
        comp('ungc_violations', 'UNGC Violations', '4 companies (3.5%)', null, [
          leaf('labour_viol', 'Labour Standards', '2 companies', 'RepRisk', 2),
          leaf('env_viol', 'Environmental', '1 company', 'RepRisk', 2),
          leaf('corruption_viol', 'Anti-Corruption', '1 company', 'RepRisk', 2),
        ]),
      ], ['SFDR Annex I', 'UNGC', 'RepRisk'], 'PAI-10 UNGC/OECD violations'),

      m('pai13_gender_gap', 'PAI-13 Gender Pay Gap', 'Avg unadjusted gender pay gap', null, [
        comp('pay_gap_dist', 'Pay Gap Distribution', '14.2% avg', null, [
          leaf('gap_reported', 'Company-Reported Gap', '12.8%', 'Company Reports', 2),
          leaf('gap_estimated', 'Estimated Gap', '16.5%', 'Equileap', 3),
        ]),
      ], ['SFDR Annex I', 'Equileap'], 'PAI-13 gender pay gap'),

      m('pai14_controversial', 'PAI-14 Controversial Weapons', 'Exposure to controversial arms', null, [
        leaf('cluster_munitions', 'Cluster Munitions', '0 holdings', 'MSCI ESG', 1),
        leaf('anti_personnel', 'Anti-Personnel Mines', '0 holdings', 'MSCI ESG', 1),
        leaf('nuclear_weapons', 'Nuclear Weapons', '2 holdings (1.2%)', 'MSCI ESG', 1),
      ], ['SFDR Annex I', 'MSCI ESG', 'ISS'], 'PAI-14 controversial weapons screen'),

      // ── PAI 15-18: Additional Indicators ──
      m('pai15_ghg_intensity_sov', 'PAI-15 Sovereign GHG Intensity', 'GHG per GDP of sovereigns', null, [
        comp('high_intensity_sov', 'High Intensity Sovereigns', '3 countries', null, [
          leaf('sov_coal_dep', 'Coal-Dependent', '2 countries', 'IEA', 2),
        ]),
        comp('low_intensity_sov', 'Low Intensity Sovereigns', '8 countries', null, [
          leaf('sov_re_share', 'High RE Share', '8 countries', 'IEA', 2),
        ]),
      ], ['SFDR Annex I', 'IEA', 'EDGAR'], 'PAI-15 sovereign carbon intensity'),

      m('pai16_fossil_sov', 'PAI-16 Sovereign Fossil Fuel', 'Sovereign fossil fuel exposure', null, [
        leaf('sov_fossil_rev', 'Fossil Revenue %', '18.5% avg', 'IMF', 2),
        leaf('sov_fossil_bonds', 'Fossil-Linked Bonds', '4.2% portfolio', 'Bloomberg', 2),
      ], ['SFDR Annex I', 'IMF'], 'PAI-16 sovereign fossil fuel revenue'),

      m('pai17_re_fossil', 'PAI-17 Real Estate Fossil', 'RE portfolio involved in fossil fuels', null, [
        leaf('re_fossil_pct', 'RE Fossil Involvement', '5.2%', 'EPC + Asset Data', 3),
        leaf('re_energy_label', 'Energy Label Distribution', 'A:12% B:28% C:35%', 'EPC Register', 2),
      ], ['SFDR Annex I', 'EPC Register'], 'PAI-17 real estate fossil fuel'),

      m('pai18_re_efficiency', 'PAI-18 Real Estate Energy Efficiency', 'RE energy inefficiency %', null, [
        leaf('re_below_nzeb', 'Below NZEB Standard', '68%', 'EPC Register', 2),
        leaf('re_crrem_pathway', 'Off CRREM Pathway', '42%', 'CRREM', 3),
      ], ['SFDR Annex I', 'CRREM', 'EPC'], 'PAI-18 RE energy inefficiency'),
    ],
  },

  '/portfolio-temperature-score': {
    moduleCode: 'F-005', sprint: 'FIN',
    metrics: [
      m('portfolio_itr', 'Portfolio ITR', '\u03a3(w_i \u00d7 ITR_i)', null, [
        comp('below_15', 'Holdings \u22641.5\u00b0C', null, 0.22, [
          leaf('sbti_15', 'SBTi 1.5\u00b0C Validated', '18 companies', 'SBTi', 1),
          leaf('traj_15', 'On 1.5\u00b0C Trajectory', '12 companies', 'TPI / CA100+', 2),
        ]),
        comp('below_2', 'Holdings 1.5\u20132.0\u00b0C', null, 0.35, [
          leaf('sbti_wb2', 'SBTi Well-Below 2\u00b0C', '24 companies', 'SBTi', 1),
          leaf('traj_2', 'Approaching 2\u00b0C', '15 companies', 'TPI', 2),
        ]),
        comp('above_2', 'Holdings >2.0\u00b0C', null, 0.43, [
          leaf('no_target', 'No SBTi Target', '28 companies', 'SBTi DB', 1),
          leaf('misaligned', 'Misaligned Trajectory', '18 companies', 'TPI', 2),
        ]),
      ], ['SBTi', 'TPI', 'CA100+', 'PACTA'], 'Portfolio implied temperature rise'),

      m('alignment_pct', 'Alignment %', 'Count(ITR \u2264 2.0\u00b0C) / Total \u00d7 100', null, [
        comp('paris_aligned', 'Paris-Aligned Count', '69 holdings', null, [
          leaf('target_set', 'SBTi Target Set', '42 companies', 'SBTi', 1),
          leaf('committed', 'SBTi Committed', '27 companies', 'SBTi', 1),
        ]),
        comp('not_aligned', 'Not Aligned Count', '46 holdings', null, [
          leaf('no_target_al', 'No Science-Based Target', '28 companies', 'SBTi DB', 1),
          leaf('off_track', 'Off-Track Trajectory', '18 companies', 'TPI', 2),
        ]),
      ], ['SBTi', 'TPI'], 'Paris alignment percentage'),

      m('holdings_above_2', 'Holdings >2\u00b0C', 'Count where company ITR > 2.0\u00b0C', null, [
        comp('above_3', 'Holdings >3.0\u00b0C (Critical)', '12 holdings', null, [
          leaf('fossil_above3', 'Fossil Fuel', '8 companies', 'TPI', 2),
          leaf('cement_above3', 'Cement/Steel', '4 companies', 'TPI', 2),
        ]),
        comp('between_2_3', 'Holdings 2.0\u20133.0\u00b0C', '34 holdings', null, [
          leaf('transport_23', 'Transport Sector', '14 companies', 'TPI', 2),
          leaf('industry_23', 'Industrial Sector', '20 companies', 'TPI', 2),
        ]),
      ], ['TPI', 'SBTi'], 'Misaligned holdings breakdown'),

      // ── Tab: SBTi Coverage ──
      m('sbti_coverage', 'SBTi Coverage', 'Holdings with SBTi targets / Total', null, [
        comp('sbti_validated', 'SBTi Validated Targets', '42 companies (37%)', null, [
          leaf('sbti_15_val', '1.5\u00b0C Targets', '18 companies', 'SBTi', 1),
          leaf('sbti_wb2_val', 'Well-Below 2\u00b0C', '24 companies', 'SBTi', 1),
        ]),
        comp('sbti_committed', 'SBTi Committed', '27 companies (23%)', null, [
          leaf('commit_date', 'Avg Commitment Age', '14 months', 'SBTi', 1),
        ]),
        comp('no_sbti', 'No SBTi Target', '46 companies (40%)', null, [
          leaf('high_emitter_notarget', 'High-Emitter No Target', '12 companies', 'CDP + SBTi', 2),
        ]),
      ], ['SBTi', 'CDP'], 'SBTi target coverage breakdown'),

      // ── Tab: Engagement Impact ──
      m('engagement_itr_impact', 'Engagement ITR Impact', '\u0394ITR from engagement portfolio', null, [
        comp('pre_engagement', 'Pre-Engagement ITR', '2.8\u00b0C', null, [
          leaf('pre_eng_wtd', 'Weighted Pre ITR', '2.8\u00b0C', 'TPI', 2),
        ]),
        comp('post_engagement', 'Post-Engagement ITR', '2.4\u00b0C', null, [
          leaf('targets_adopted', 'Targets Adopted Post-Engagement', '8 companies', 'Stewardship', 2),
          leaf('itr_reduction', 'Avg ITR Reduction', '\u22120.4\u00b0C per company', 'Model', 3),
        ]),
      ], ['Internal Stewardship', 'CA100+'], 'Engagement-driven ITR improvement'),

      // ── Tab: Sector Pathway ──
      m('sector_itr_breakdown', 'Sector ITR Breakdown', 'ITR by GICS sector', null, [
        comp('itr_energy_sector', 'Energy Sector ITR', '3.2\u00b0C', null, [
          leaf('energy_pathway', 'SDA Pathway', 'Off-track', 'SBTi SDA', 2),
        ]),
        comp('itr_materials', 'Materials ITR', '2.8\u00b0C', null, [
          leaf('materials_pathway', 'SDA Pathway', 'Approaching', 'SBTi SDA', 2),
        ]),
        comp('itr_tech', 'Technology ITR', '1.6\u00b0C', null, [
          leaf('tech_pathway', 'SDA Pathway', 'On-track', 'SBTi SDA', 1),
        ]),
      ], ['SBTi SDA', 'TPI', 'PACTA'], 'Sector decarbonization alignment'),
    ],
  },

  '/esg-ratings-hub': {
    moduleCode: 'F-006', sprint: 'FIN',
    metrics: [
      m('avg_esg', 'Average ESG Score', '\u03a3(w_i \u00d7 ESG_i) / \u03a3 w_i', null, [
        comp('e_pillar', 'Environmental Pillar', '62.4/100', 0.40, [
          leaf('e_msci', 'MSCI E Score', '6.8/10', 'MSCI ESG', 2),
          leaf('e_sustain', 'Sustainalytics E Score', '28/100', 'Sustainalytics', 2),
          leaf('e_cdp', 'CDP Score', 'B+', 'CDP', 2),
        ]),
        comp('s_pillar', 'Social Pillar', '55.8/100', 0.30, [
          leaf('s_msci', 'MSCI S Score', '5.9/10', 'MSCI ESG', 2),
          leaf('s_sustain', 'Sustainalytics S Score', '32/100', 'Sustainalytics', 2),
        ]),
        comp('g_pillar', 'Governance Pillar', '71.2/100', 0.30, [
          leaf('g_msci', 'MSCI G Score', '7.4/10', 'MSCI ESG', 2),
          leaf('g_sustain', 'Sustainalytics G Score', '22/100', 'Sustainalytics', 2),
        ]),
      ], ['MSCI ESG', 'Sustainalytics', 'CDP'], 'Multi-provider ESG score aggregation'),

      m('rating_dist', 'Rating Distribution', 'Count per rating bucket', null, [
        comp('aaa_aa', 'AAA\u2013AA (Leaders)', '18 holdings', null, [
          leaf('aaa_count', 'AAA', '5 holdings', 'MSCI', 2),
          leaf('aa_count', 'AA', '13 holdings', 'MSCI', 2),
        ]),
        comp('a_bbb', 'A\u2013BBB (Average)', '52 holdings', null, [
          leaf('a_count', 'A', '22 holdings', 'MSCI', 2),
          leaf('bbb_count', 'BBB', '30 holdings', 'MSCI', 2),
        ]),
        comp('bb_below', 'BB and Below (Laggards)', '45 holdings', null, [
          leaf('bb_count', 'BB', '25 holdings', 'MSCI', 2),
          leaf('b_ccc', 'B\u2013CCC', '20 holdings', 'MSCI', 2),
        ]),
      ], ['MSCI ESG'], 'Distribution of MSCI ESG ratings'),

      m('divergence', 'Provider Divergence', '\u03c3(normalized scores across providers)', null, [
        comp('high_div', 'High Divergence Names', '15 holdings', null, [
          leaf('div_ex1', 'Energy Divergence', 'MSCI=AA vs Sust=High Risk', 'Cross-Provider', 2),
        ]),
        comp('low_div', 'Low Divergence Names', '45 holdings', null, [
          leaf('consensus', 'Consensus Holdings', '45 names', 'Cross-Provider', 2),
        ]),
      ], ['MSCI', 'Sustainalytics', 'ISS'], 'Cross-provider ESG divergence'),

      // ── Tab: Momentum ──
      m('esg_momentum', 'ESG Momentum', '\u0394 ESG Score (12-month)', null, [
        comp('upgrades', 'Rating Upgrades', '12 holdings', null, [
          leaf('upgrade_msci', 'MSCI Upgrades', '8 holdings', 'MSCI', 2),
          leaf('upgrade_sust', 'Sustainalytics Upgrades', '4 holdings', 'Sustainalytics', 2),
        ]),
        comp('downgrades', 'Rating Downgrades', '5 holdings', null, [
          leaf('downgrade_msci', 'MSCI Downgrades', '3 holdings', 'MSCI', 2),
          leaf('downgrade_sust', 'Sustainalytics Downgrades', '2 holdings', 'Sustainalytics', 2),
        ]),
      ], ['MSCI', 'Sustainalytics'], 'ESG rating momentum tracker'),

      // ── Tab: Controversy Screen ──
      m('controversy_score', 'Controversy Score', 'Max severity of ESG controversies', null, [
        comp('severe_controversy', 'Severe/Very Severe', '8 holdings', null, [
          leaf('env_controversy', 'Environmental', '3 holdings', 'RepRisk / MSCI', 2),
          leaf('social_controversy', 'Social', '5 holdings', 'RepRisk / MSCI', 2),
        ]),
        comp('moderate_controversy', 'Moderate', '18 holdings', null, [
          leaf('gov_controversy', 'Governance', '10 holdings', 'ISS', 2),
        ]),
      ], ['RepRisk', 'MSCI ESG', 'ISS'], 'Controversy screening'),

      // ── Tab: E/S/G Detail ──
      m('pillar_detail', 'Pillar Deep-Dive', 'Sub-category scores within E/S/G', null, [
        comp('e_sub_categories', 'Environmental Sub-Scores', null, null, [
          leaf('e_climate', 'Climate Change', '68/100', 'MSCI', 2),
          leaf('e_pollution', 'Pollution & Waste', '55/100', 'MSCI', 2),
          leaf('e_biodiversity', 'Biodiversity', '42/100', 'Sustainalytics', 2),
        ]),
        comp('s_sub_categories', 'Social Sub-Scores', null, null, [
          leaf('s_labour', 'Labour Standards', '62/100', 'MSCI', 2),
          leaf('s_human_rights', 'Human Rights', '48/100', 'Sustainalytics', 2),
        ]),
        comp('g_sub_categories', 'Governance Sub-Scores', null, null, [
          leaf('g_board', 'Board Quality', '72/100', 'ISS', 2),
          leaf('g_ethics', 'Business Ethics', '65/100', 'MSCI', 2),
        ]),
      ], ['MSCI', 'Sustainalytics', 'ISS'], 'Pillar sub-category detail'),
    ],
  },

  '/transition-risk-dashboard': {
    moduleCode: 'F-007', sprint: 'FIN',
    metrics: [
      m('portfolio_trans_score', 'Portfolio Transition Score', '\u03a3(w_i \u00d7 TransScore_i)', null, [
        comp('ts_carbon', 'Carbon Exposure Dim', '42/100', 0.30, [
          leaf('sector_ce', 'Sector Carbon Exposure', null, 'CDP', 2),
          leaf('company_ce', 'Company-Level Emissions', null, 'CDP / Estimates', 2),
        ]),
        comp('ts_readiness', 'Transition Readiness Dim', '58/100', 0.25, [
          leaf('sbti_stat', 'SBTi Status', null, 'SBTi', 1),
          leaf('capex_green_td', 'Green CapEx %', null, 'Company Filings', 3),
        ]),
        comp('ts_policy', 'Policy Exposure Dim', '35/100', 0.25, [
          leaf('ets_exposure_td', 'ETS Exposure', null, 'EU ETS EUTL', 1),
          leaf('cbam_exposure_td', 'CBAM Exposure', null, 'EU CBAM Registry', 2),
        ]),
        comp('ts_market', 'Market Signal Dim', '61/100', 0.20, [
          leaf('greenium_sig', 'Greenium Signal', null, 'Bloomberg', 2),
          leaf('flow_data', 'ESG Fund Flows', null, 'Morningstar', 2),
        ]),
      ], ['CDP', 'SBTi', 'EU ETS', 'Bloomberg'], '4-dimensional transition risk scoring'),

      m('high_carbon_pct', 'High-Carbon %', '\u03a3 w_i where NACE \u2208 high-carbon', null, [
        comp('energy_hc', 'Energy Sector', '22.4%', null, [
          leaf('oil_gas', 'Oil & Gas', '14.2%', 'GICS', 1),
          leaf('coal_hc', 'Coal Mining', '3.1%', 'GICS', 1),
          leaf('utilities_hc', 'Fossil Utilities', '5.1%', 'GICS', 1),
        ]),
        comp('materials_hc', 'Materials Sector', '8.7%', null, [
          leaf('steel_hc', 'Steel', '3.2%', 'GICS', 1),
          leaf('cement_hc', 'Cement', '2.8%', 'GICS', 1),
          leaf('chemicals_hc', 'Chemicals', '2.7%', 'GICS', 1),
        ]),
      ], ['GICS', 'EU Taxonomy'], 'Portfolio weight in high-carbon sectors'),

      m('engagement', 'Engagement Pipeline', 'Count of active engagements', null, [
        comp('eng_active', 'Active Engagements', '42 companies', null, [
          leaf('eng_targets', 'Target-Setting Focus', '18 companies', 'Stewardship Team', 2),
          leaf('eng_disclosure', 'Disclosure Focus', '24 companies', 'Stewardship Team', 2),
        ]),
        comp('eng_escalated', 'Escalated', '8 companies', null, [
          leaf('proxy_votes', 'Proxy Voting Action', '5 companies', 'ISS/Glass Lewis', 1),
          leaf('divest_watch', 'Divestment Watchlist', '3 companies', 'Internal', 2),
        ]),
      ], ['Internal Stewardship'], 'Engagement pipeline tracker'),

      // ── Tab: Sector Heatmap ──
      m('sector_heatmap_scores', 'Sector Heatmap', 'Transition risk score by NACE sector', null, [
        comp('hm_energy', 'Energy (NACE B/D)', '85/100 \u2014 Very High', null, [
          leaf('hm_energy_carbon', 'Carbon Intensity', '520 tCO\u2082/$M', 'CDP', 2),
          leaf('hm_energy_policy', 'Policy Exposure', 'EU ETS + CBAM', 'EU ETS EUTL', 1),
        ]),
        comp('hm_materials', 'Materials (NACE C)', '72/100 \u2014 High', null, [
          leaf('hm_materials_carbon', 'Carbon Intensity', '280 tCO\u2082/$M', 'CDP', 2),
        ]),
        comp('hm_tech', 'Technology (NACE J)', '18/100 \u2014 Low', null, [
          leaf('hm_tech_carbon', 'Carbon Intensity', '8 tCO\u2082/$M', 'CDP', 2),
        ]),
      ], ['NGFS', 'CDP', 'EU Taxonomy'], 'Sector-level transition heatmap'),

      // ── Tab: Red Flags ──
      m('transition_flags', 'Transition Red Flags', 'Count of flagged holdings', null, [
        comp('no_target_flag', 'No Target + High Carbon', '8 holdings', null, [
          leaf('flag_energy_notarget', 'Energy \u2014 No SBTi', '5 companies', 'SBTi DB', 1),
          leaf('flag_materials_notarget', 'Materials \u2014 No SBTi', '3 companies', 'SBTi DB', 1),
        ]),
        comp('lobbying_flag', 'Misaligned Lobbying', '4 holdings', null, [
          leaf('influence_map_score', 'InfluenceMap Score <40', '4 companies', 'InfluenceMap', 2),
        ]),
        comp('capex_flag', 'Low Green CapEx', '6 holdings', null, [
          leaf('green_capex_below10', 'Green CapEx <10%', '6 companies', 'Company Filings', 3),
        ]),
      ], ['SBTi', 'InfluenceMap', 'Company Filings'], 'Transition risk red flag screen'),
    ],
  },

  '/supervisory-stress-orchestrator': {
    moduleCode: 'F-008', sprint: 'FIN',
    metrics: [
      m('ecl_climate', 'ECL Climate', '\u03a3(EAD \u00d7 PD_climate \u00d7 LGD_climate)', null, [
        comp('ecl_phys', 'Physical ECL', '\u20ac2.8B', null, [
          leaf('ecl_flood', 'Flood ECL', '\u20ac1.1B', 'NGFS + Internal', 3),
          leaf('ecl_heat', 'Heat Stress ECL', '\u20ac0.8B', 'NGFS + Internal', 3),
          leaf('ecl_wind', 'Windstorm ECL', '\u20ac0.9B', 'NGFS + Internal', 3),
        ]),
        comp('ecl_trans', 'Transition ECL', '\u20ac4.2B', null, [
          leaf('ecl_carbon', 'Carbon Price ECL', '\u20ac2.1B', 'NGFS NZ2050', 2),
          leaf('ecl_demand', 'Demand Shock ECL', '\u20ac1.4B', 'NGFS Below2D', 2),
          leaf('ecl_policy', 'Policy ECL', '\u20ac0.7B', 'NGFS Divergent', 3),
        ]),
      ], ['ECB CST', 'NGFS Phase 5'], 'Climate-adjusted expected credit loss'),

      m('ppnr_impact', 'PPNR Impact', '\u0394NII + \u0394NFI under climate scenario', null, [
        comp('nii_impact', 'NII Impact', '\u2212\u20ac1.2B', null, [
          leaf('rate_path', 'Interest Rate Path', null, 'ECB Scenario', 2),
          leaf('volume_adj', 'Volume Adjustment', null, 'Internal Model', 3),
        ]),
        comp('nfi_impact', 'Non-Interest Income Impact', '\u2212\u20ac0.6B', null, [
          leaf('fee_income', 'Fee Income Change', '\u2212\u20ac0.3B', 'Internal Model', 3),
          leaf('trading_pnl', 'Trading P&L Impact', '\u2212\u20ac0.3B', 'FRTB Model', 3),
        ]),
      ], ['ECB CST', 'Internal'], 'Pre-provision net revenue under climate stress'),

      m('capital_path', 'Capital Path Q1\u2013Q9', 'CET1_t = CET1_{t-1} + PPNR_t \u2212 ECL_t', null, [
        comp('q1_q3', 'Q1\u2013Q3 Path', null, null, [
          leaf('q1_cet1', 'Q1 CET1', '15.4%', 'ECB CST Model', 2),
          leaf('q3_cet1', 'Q3 CET1', '14.1%', 'ECB CST Model', 2),
        ]),
        comp('q4_q6', 'Q4\u2013Q6 Path', null, null, [
          leaf('q6_cet1', 'Q6 CET1 (trough)', '11.8%', 'ECB CST Model', 2),
        ]),
        comp('q7_q9', 'Q7\u2013Q9 Recovery', null, null, [
          leaf('q9_cet1', 'Q9 CET1', '12.9%', 'ECB CST Model', 2),
        ]),
      ], ['ECB CST', 'BoE CBES'], 'Quarterly CET1 path over 9-quarter horizon'),

      // ── Tab: ECL by Grade ──
      m('ecl_by_grade', 'ECL by Credit Grade', '\u03a3(EAD \u00d7 PD \u00d7 LGD) per grade', null, [
        comp('ecl_ig', 'Investment Grade ECL', '\u20ac1.2B', null, [
          leaf('ig_pd_adj', 'IG PD (climate-adj)', '0.42%', 'IRB + Climate', 3),
          leaf('ig_ead', 'IG EAD', '\u20ac185B', 'Loan Book', 1),
        ]),
        comp('ecl_subig', 'Sub-IG ECL', '\u20ac4.8B', null, [
          leaf('subig_pd_adj', 'Sub-IG PD (climate-adj)', '3.8%', 'IRB + Climate', 3),
          leaf('subig_ead', 'Sub-IG EAD', '\u20ac82B', 'Loan Book', 1),
        ]),
        comp('ecl_default', 'Defaulted ECL', '\u20ac1.0B', null, [
          leaf('default_lgd', 'Default LGD', '45%', 'IRB Model', 2),
        ]),
      ], ['IRB Model', 'ECB CST'], 'ECL by internal credit grade'),

      // ── Tab: Capital Actions ──
      m('capital_actions', 'Capital Actions', 'Management actions under stress', null, [
        comp('div_action', 'Dividend Restriction', '+0.5% CET1', null, [
          leaf('div_saved', 'Dividends Saved', '\u20ac1.2B', 'Capital Plan', 1),
        ]),
        comp('at1_trigger', 'AT1 Trigger Assessment', 'CET1 > 5.125%', null, [
          leaf('trigger_distance', 'Distance to Trigger', '6.7%', 'Pillar 3', 1),
        ]),
        comp('rwa_optimization', 'RWA Optimization', '\u2212\u20ac8B RWA', null, [
          leaf('securitization', 'Securitization', '\u2212\u20ac5B', 'Treasury', 2),
          leaf('hedging_action', 'Hedging Increase', '\u2212\u20ac3B', 'Treasury', 2),
        ]),
      ], ['Capital Plan', 'ECB CST'], 'Management action assumptions'),

      // ── Tab: Sectoral ECL ──
      m('ecl_by_sector', 'Sectoral ECL', 'ECL by NACE/GICS sector', null, [
        comp('ecl_energy_sec', 'Energy ECL', '\u20ac2.1B', null, [
          leaf('energy_pd', 'Energy PD Climate', '4.2%', 'NGFS + IRB', 3),
        ]),
        comp('ecl_re_sec', 'Real Estate ECL', '\u20ac1.8B', null, [
          leaf('re_pd', 'RE PD (EPC-adj)', '2.8%', 'EPC + IRB', 3),
        ]),
        comp('ecl_transport_sec', 'Transport ECL', '\u20ac0.9B', null, [
          leaf('transport_pd', 'Transport PD', '3.1%', 'NGFS + IRB', 3),
        ]),
      ], ['NGFS', 'IRB Model', 'ECB CST'], 'Sector-level climate ECL'),
    ],
  },

  '/enterprise-climate-risk': {
    moduleCode: 'F-009', sprint: 'FIN',
    metrics: [
      m('ecr_rwa', 'Climate RWA', '\u03a3(EAD \u00d7 RW_climate \u00d7 ClimateMult)', null, [
        comp('ecr_corp', 'Corporate Climate RWA', '\u20ac185B', null, [
          leaf('corp_ead', 'Corporate EAD', '\u20ac420B', 'Loan Book', 1),
          leaf('corp_rw', 'Avg Climate RW', '44%', 'IRB + Climate Overlay', 3),
        ]),
        comp('ecr_re', 'Real Estate Climate RWA', '\u20ac92B', null, [
          leaf('re_ead', 'RE EAD', '\u20ac310B', 'Mortgage Book', 1),
          leaf('re_rw', 'Avg Climate RW', '30%', 'IRB + EPC Overlay', 3),
        ]),
      ], ['Basel IV', 'ECB C&E', 'Internal Model'], 'Enterprise-wide climate RWA'),

      m('ecr_raroc', 'RAROC', 'Climate_Revenue / Economic_Capital', null, [
        comp('climate_rev', 'Climate-Adj Revenue', '\u20ac6.2B', null, [
          leaf('nii_base_ecr', 'NII Base', '\u20ac8.4B', 'Internal', 1),
          leaf('climate_haircut', 'Climate Haircut', '\u2212\u20ac2.2B', 'Stress Model', 3),
        ]),
        comp('econ_cap', 'Economic Capital', '\u20ac42B', null, [
          leaf('credit_ecap', 'Credit EC', '\u20ac28B', 'Internal Model', 2),
          leaf('climate_ecap', 'Climate EC Addon', '\u20ac14B', 'Internal Model', 3),
        ]),
      ], ['Internal'], 'Risk-adjusted return on capital with climate overlay'),

      m('ecr_hedge', 'Hedge Ratio', 'Hedged / Total_Climate_Exposure', null, [
        comp('hedged_exp', 'Hedged Exposure', '\u20ac45B', null, [
          leaf('cat_bonds_ecr', 'Cat Bond Protection', '\u20ac18B', 'ILS Market', 2),
          leaf('credit_prot', 'CDS/Credit Protection', '\u20ac27B', 'OTC Market', 2),
        ]),
        comp('total_exp', 'Total Climate Exposure', '\u20ac312B', null, [
          leaf('physical_exp', 'Physical Exposure', '\u20ac142B', 'Internal', 3),
          leaf('transition_exp', 'Transition Exposure', '\u20ac170B', 'Internal', 3),
        ]),
      ], ['Internal', 'ILS Market'], 'Climate hedging coverage ratio'),

      // ── Tab: Scenario PnL Bridge ──
      m('scenario_pnl_bridge', 'Scenario PnL Bridge', '\u0394PnL decomposition by driver', null, [
        comp('pnl_carbon_price', 'Carbon Price Impact', '\u2212\u20ac2.4B', null, [
          leaf('carbon_direct_pnl', 'Direct Cost', '\u2212\u20ac1.2B', 'NGFS', 2),
          leaf('carbon_indirect_pnl', 'Indirect (supply chain)', '\u2212\u20ac1.2B', 'IO Model', 3),
        ]),
        comp('pnl_demand_shift', 'Demand Shift Impact', '\u2212\u20ac1.1B', null, [
          leaf('fossil_demand_pnl', 'Fossil Demand Drop', '\u2212\u20ac0.8B', 'NGFS', 2),
          leaf('green_demand_pnl', 'Green Demand Gain', '+\u20ac0.3B', 'Model', 3),
        ]),
        comp('pnl_physical', 'Physical Impact', '\u2212\u20ac0.8B', null, [
          leaf('flood_pnl', 'Flood Damage PnL', '\u2212\u20ac0.4B', 'Cat Model', 3),
          leaf('heat_pnl', 'Heat Productivity PnL', '\u2212\u20ac0.4B', 'Climate Model', 3),
        ]),
      ], ['NGFS', 'Internal Model'], 'PnL waterfall by climate driver'),

      // ── Tab: Economic Capital ──
      m('economic_capital', 'Economic Capital', 'EC = UL at 99.9% confidence', null, [
        comp('ec_credit', 'Credit EC', '\u20ac28B', null, [
          leaf('ec_credit_base', 'Base Credit EC', '\u20ac22B', 'Internal Model', 2),
          leaf('ec_credit_climate', 'Climate Addon', '\u20ac6B', 'Stress Model', 3),
        ]),
        comp('ec_market', 'Market EC', '\u20ac12B', null, [
          leaf('ec_market_base', 'Base Market EC', '\u20ac9B', 'FRTB', 2),
          leaf('ec_market_climate', 'Climate Addon', '\u20ac3B', 'Stress Model', 3),
        ]),
        comp('ec_operational', 'Operational EC', '\u20ac5B', null, [
          leaf('ec_op_climate', 'Climate Litigation Addon', '\u20ac1.2B', 'Sabin Center', 3),
        ]),
      ], ['Internal EC Model', 'Basel IV'], 'Enterprise economic capital with climate'),
    ],
  },

  '/systemic-climate-risk': {
    moduleCode: 'F-010', sprint: 'FIN',
    metrics: [
      m('systemic_loss', 'Systemic Loss', '\u03a3(PD_sector \u00d7 EAD \u00d7 Contagion)', null, [
        comp('direct_loss', 'Direct Sector Losses', '$42B', null, [
          leaf('energy_loss', 'Energy Sector Loss', '$18B', 'NGFS', 2),
          leaf('transport_loss', 'Transport Loss', '$12B', 'NGFS', 2),
          leaf('industry_loss', 'Industrial Loss', '$12B', 'NGFS', 2),
        ]),
        comp('contagion_loss', 'Contagion Amplification', '$28B', null, [
          leaf('interbank', 'Interbank Contagion', '$15B', 'BIS Network Model', 3),
          leaf('supply_chain', 'Supply Chain Cascade', '$13B', 'OECD TiVA', 3),
        ]),
      ], ['NGFS', 'BIS', 'FSB'], 'Systemic climate loss with network contagion'),

      m('contagion_idx', 'Contagion Index', 'Spectral radius of bilateral exposure matrix', null, [
        comp('banking_contagion', 'Banking System', '0.72', null, [
          leaf('interbank_matrix', 'Interbank Exposure Matrix', '28\u00d728', 'BIS', 2),
        ]),
        comp('crossborder_contagion', 'Cross-Border', '0.58', null, [
          leaf('bis_locational', 'BIS Locational Stats', null, 'BIS', 1),
          leaf('trade_flow', 'Trade Flow Matrix', null, 'WTO', 2),
        ]),
      ], ['BIS', 'FSB', 'ESMA'], 'Network contagion index'),

      m('fsoc_score', 'FSOC Risk Score', 'Composite systemic risk indicator', null, [
        comp('size_factor', 'Size Factor', '0.35', null, [
          leaf('total_assets_fsoc', 'Total Assets Rank', null, 'Fed H.8', 1),
          leaf('derivatives_notional', 'Derivatives Notional', null, 'OCC Report', 1),
        ]),
        comp('interconnect_factor', 'Interconnectedness', '0.28', null, [
          leaf('interbank_borr', 'Interbank Borrowing', null, 'Fed FR2052', 1),
        ]),
      ], ['FSOC', 'Fed', 'BIS'], 'FSOC-style systemic importance scoring'),
    ],
  },

  '/climate-risk-premium': {
    moduleCode: 'F-011', sprint: 'FIN',
    metrics: [
      m('climate_beta', 'Climate Beta', '\u03b2_climate from cross-sectional regression', null, [
        comp('factor_return', 'Climate Factor Return', '\u22122.4% YTD', null, [
          leaf('long_green', 'Long Green Portfolio', '+4.2%', 'Factor Model', 3),
          leaf('short_brown', 'Short Brown Portfolio', '\u22126.6%', 'Factor Model', 3),
        ]),
        comp('cross_section', 'Cross-Sectional Regression', null, null, [
          leaf('r_squared', 'R\u00b2 of Climate Factor', '0.18', 'OLS Regression', 3),
          leaf('t_stat', 't-statistic', '3.42', 'OLS Regression', 3),
        ]),
      ], ['Academic Research', 'Internal Factor Model'], 'Climate beta estimation'),

      m('greenium_metric', 'Greenium', 'Green Bond YTM \u2212 Conventional YTM (bps)', null, [
        comp('ig_greenium', 'IG Greenium', '\u22128 bps', null, [
          leaf('ig_green_ytm', 'IG Green Bond YTM', '4.12%', 'Bloomberg', 2),
          leaf('ig_conv_ytm', 'IG Conventional YTM', '4.20%', 'Bloomberg', 2),
        ]),
        comp('hy_greenium', 'HY Greenium', '\u221215 bps', null, [
          leaf('hy_green_ytm', 'HY Green Bond YTM', '6.85%', 'Bloomberg', 2),
          leaf('hy_conv_ytm', 'HY Conventional YTM', '7.00%', 'Bloomberg', 2),
        ]),
      ], ['Bloomberg', 'CBI'], 'Green bond pricing premium'),

      m('migration_prob', 'Migration Probability', 'P(downgrade | climate event)', null, [
        comp('phys_migration', 'Physical Event Migration', '4.2%', null, [
          leaf('flood_migration', 'Flood Migration Rate', '5.8%', 'Moody\'s', 2),
          leaf('heat_migration', 'Heat Stress Migration', '2.6%', 'S&P', 2),
        ]),
        comp('trans_migration', 'Transition Migration', '6.8%', null, [
          leaf('carbon_migration', 'Carbon Shock Migration', '8.2%', 'Moody\'s', 2),
          leaf('policy_migration', 'Policy Change Migration', '5.4%', 'S&P', 2),
        ]),
      ], ['Moody\'s', 'S&P', 'Fitch'], 'Climate rating migration matrix'),
    ],
  },

  '/paris-alignment': {
    moduleCode: 'F-012', sprint: 'FIN',
    metrics: [
      m('itr_paris', 'Implied Temperature Rise', 'T_budget / (Projected / Allocated)', null, [
        comp('sector_pathway', 'Sector Decarbonization', null, null, [
          leaf('energy_path', 'Energy Sector Pathway', '1.5\u00b0C SDA', 'SBTi', 1),
          leaf('transport_path', 'Transport Pathway', '2.0\u00b0C SDA', 'SBTi', 1),
        ]),
        comp('company_traj', 'Company Trajectory', null, null, [
          leaf('hist_emissions', '5yr Historical Emissions', null, 'CDP', 2),
          leaf('target_trajectory', 'Target Trajectory', null, 'SBTi DB', 1),
        ]),
      ], ['SBTi SDA', 'PACTA', 'CDP'], 'SDA temperature alignment'),

      m('on_track_pct', 'On-Track %', 'Holdings on \u22641.5\u00b0C pathway', null, [
        comp('validated_15', 'SBTi 1.5\u00b0C Validated', '22%', null, [
          leaf('val_count', 'Validated Companies', '25', 'SBTi', 1),
        ]),
        comp('on_track_wb2', 'Well-Below 2\u00b0C On-Track', '35%', null, [
          leaf('wb2_count', 'WB2 Aligned', '40', 'TPI', 2),
        ]),
      ], ['SBTi', 'TPI'], 'Percentage on 1.5\u00b0C track'),

      m('budget_remaining', 'Budget Remaining', 'AllocatedBudget \u2212 CumulativeEmissions', null, [
        comp('allocated', 'Allocated Carbon Budget', '450M tCO\u2082e', null, [
          leaf('ipcc_budget', 'IPCC 1.5\u00b0C Budget', '400 GtCO\u2082', 'IPCC AR6', 1),
        ]),
        comp('consumed', 'Consumed Budget', '285M tCO\u2082e', null, [
          leaf('hist_cum', 'Historical Cumulative', '180M tCO\u2082e', 'CDP', 2),
          leaf('projected_cum', 'Projected to 2030', '105M tCO\u2082e', 'Linear Extrapolation', 3),
        ]),
      ], ['IPCC AR6', 'SBTi', 'CDP'], 'Remaining carbon budget'),
    ],
  },

  '/eu-taxonomy': {
    moduleCode: 'F-014', sprint: 'FIN',
    metrics: [
      m('eligible_pct', 'Taxonomy Eligible %', 'Eligible / Total Revenue \u00d7 100', null, [
        comp('ccm_eligible', 'CCM Eligible', '42%', null, [
          leaf('ccm_energy_eu', 'Energy CCM', '18%', 'EU Tax Compass', 1),
          leaf('ccm_transport', 'Transport CCM', '12%', 'EU Tax Compass', 1),
          leaf('ccm_buildings', 'Buildings CCM', '12%', 'EU Tax Compass', 1),
        ]),
        comp('cca_eligible', 'CCA Eligible', '15%', null, [
          leaf('cca_infra', 'Infrastructure CCA', '8%', 'EU Tax Compass', 1),
          leaf('cca_water', 'Water Management CCA', '7%', 'EU Tax Compass', 1),
        ]),
      ], ['EU Taxonomy Regulation'], 'Taxonomy eligibility screening'),

      m('aligned_pct', 'Taxonomy Aligned %', 'SubContrib \u2229 DNSH \u2229 MSS / Eligible', null, [
        comp('dnsh_pass_eu', 'DNSH Compliance', '22%', null, [
          leaf('dnsh_ccm_eu', 'DNSH Climate Mitigation', '25%', 'TSC', 1),
          leaf('dnsh_water_eu', 'DNSH Water', '24%', 'TSC', 1),
          leaf('dnsh_bio', 'DNSH Biodiversity', '22%', 'TSC', 1),
        ]),
        comp('mss_pass', 'MSS Compliance', '22%', null, [
          leaf('mss_oecd', 'OECD Guidelines', null, 'Company Report', 3),
          leaf('mss_ungp', 'UNGP Compliance', null, 'Company Report', 3),
        ]),
      ], ['EU Taxonomy TSC'], 'Full alignment = SC + DNSH + MSS'),
    ],
  },

  '/act-assessment': {
    moduleCode: 'F-015', sprint: 'FIN',
    metrics: [
      m('act_score', 'ACT Score', 'Weighted average of 5 module scores', null, [
        comp('act_targets', 'Targets Module', '14/20', 0.20, [
          leaf('target_coverage', 'Emission Coverage', '85%', 'SBTi / Company', 2),
          leaf('target_ambition', 'Ambition Level', '1.5\u00b0C aligned', 'SBTi', 1),
        ]),
        comp('act_planning', 'Material Investment', '12/20', 0.20, [
          leaf('capex_plan', 'Green CapEx Plan', '\u20ac4.2B', 'Company Filing', 2),
        ]),
        comp('act_actions', 'Intangible Investment', '15/20', 0.20, [
          leaf('training', 'Workforce Training', '12000 employees', 'Company Report', 3),
        ]),
        comp('act_performance', 'Performance Module', '11/20', 0.20, [
          leaf('trend_3yr', '3yr Emissions Trend', '\u22128.2%/yr', 'CDP', 2),
        ]),
        comp('act_governance', 'Sold Product Perf', '13/20', 0.20, [
          leaf('board_oversight', 'Board Climate Oversight', 'Dedicated Committee', 'Proxy Statement', 2),
        ]),
      ], ['ACT Initiative', 'ADEME', 'CDP'], 'ACT 5-module transition scoring'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // ENERGY \u2014 Scope 3, CBAM, Carbon Markets, Physical Risk, Water
  // ═══════════════════════════════════════════════════════════════════
  '/scope3-engine': {
    moduleCode: 'E-001', sprint: 'ENERGY',
    metrics: [
      m('total_scope3', 'Total Scope 3', '\u03a3(Category 1..15)', null, [
        comp('s3_upstream', 'Upstream (Cat 1\u20138)', '2.4M tCO\u2082e', null, [
          leaf('cat1', 'C1 \u2014 Purchased Goods', '1.2M tCO\u2082e', 'Spend-based EF', 4),
          leaf('cat2', 'C2 \u2014 Capital Goods', '0.4M tCO\u2082e', 'Spend-based EF', 4),
          leaf('cat3', 'C3 \u2014 Fuel & Energy', '0.3M tCO\u2082e', 'Activity-based EF', 3),
        ]),
        comp('s3_downstream', 'Downstream (Cat 9\u201315)', '5.8M tCO\u2082e', null, [
          leaf('cat11', 'C11 \u2014 Use of Sold Products', '4.2M tCO\u2082e', 'Product Specific', 2),
          leaf('cat15', 'C15 \u2014 Investments', '1.0M tCO\u2082e', 'PCAF Method', 3),
        ]),
      ], ['GHG Protocol Scope 3', 'PCAF', 'DEFRA EFs'], 'Full Scope 3 inventory'),

      m('s3_data_gaps', 'Data Gap Score', '% estimated vs reported', null, [
        comp('reported_pct', 'Reported Data', '35%', null, [
          leaf('supplier_data', 'Supplier-Specific', '18%', 'Supply Chain', 2),
          leaf('activity_data', 'Activity Data', '17%', 'Company Records', 3),
        ]),
        comp('estimated_pct', 'Estimated Data', '65%', null, [
          leaf('spend_proxy', 'Spend-Based Proxy', '42%', 'DEFRA / EPA EF', 4),
          leaf('revenue_proxy', 'Revenue-Based Proxy', '23%', 'EEIO Model', 5),
        ]),
      ], ['GHG Protocol'], 'Scope 3 data quality assessment'),

      // ── Tab: Category Detail (C1-C15) ──
      m('s3_cat1_detail', 'C1 Purchased Goods', 'Spend \u00d7 EF (EEIO or supplier)', null, [
        comp('c1_spend', 'Spend-Based Component', '0.9M tCO\u2082e', null, [
          leaf('c1_spend_total', 'Total Procurement Spend', '$2.4B', 'Procurement', 2),
          leaf('c1_eeio_ef', 'EEIO Factor', '0.38 kgCO\u2082/$', 'EPA USEEIO', 4),
        ]),
        comp('c1_supplier', 'Supplier-Specific', '0.3M tCO\u2082e', null, [
          leaf('c1_cdp_supply', 'CDP Supply Chain Data', '42 suppliers', 'CDP', 2),
        ]),
      ], ['GHG Protocol Cat 1', 'EPA USEEIO', 'CDP'], 'Category 1 purchased goods methodology'),

      m('s3_cat11_detail', 'C11 Use of Sold Products', 'Product \u00d7 Lifetime Use \u00d7 EF', null, [
        comp('c11_direct', 'Direct Use Emissions', '3.5M tCO\u2082e', null, [
          leaf('c11_product_ef', 'Product Emission Factor', null, 'LCA / Product Spec', 2),
          leaf('c11_lifetime', 'Product Lifetime Use', null, 'Engineering Estimate', 3),
        ]),
        comp('c11_indirect', 'Indirect Use Emissions', '0.7M tCO\u2082e', null, [
          leaf('c11_electricity', 'Electricity During Use', null, 'IEA Grid EF', 3),
        ]),
      ], ['GHG Protocol Cat 11', 'ISO 14040'], 'Category 11 use of sold products'),

      m('s3_cat15_detail', 'C15 Investments', 'PCAF attribution methodology', null, [
        comp('c15_equity', 'Equity Investments FE', '0.6M tCO\u2082e', null, [
          leaf('c15_eq_af', 'Attribution Factor', 'Invest/EVIC', 'PCAF', 2),
        ]),
        comp('c15_debt', 'Debt Investments FE', '0.4M tCO\u2082e', null, [
          leaf('c15_debt_af', 'Attribution Factor', 'Invest/(EVIC+Debt)', 'PCAF', 2),
        ]),
      ], ['PCAF', 'GHG Protocol Cat 15'], 'Category 15 investments (PCAF method)'),

      // ── Tab: Methodology Tracker ──
      m('methodology_tracker', 'Methodology Tracker', 'Method used per category', null, [
        comp('method_supplier', 'Supplier-Specific (DQS 1\u20132)', '18% of total', null, [
          leaf('supplier_coverage', 'Supplier Data Coverage', '42 suppliers', 'CDP Supply Chain', 2),
        ]),
        comp('method_activity', 'Activity-Based (DQS 3)', '17% of total', null, [
          leaf('activity_coverage', 'Activity Data Points', '850 records', 'Company Data', 3),
        ]),
        comp('method_spend', 'Spend-Based (DQS 4)', '42% of total', null, [
          leaf('spend_ef_source', 'EEIO Source', 'EPA USEEIO v2.1', 'EPA', 4),
        ]),
        comp('method_revenue', 'Revenue-Based (DQS 5)', '23% of total', null, [
          leaf('revenue_ef_source', 'Revenue Proxy Source', 'DEFRA EFs', 'DEFRA', 5),
        ]),
      ], ['GHG Protocol', 'PCAF'], 'Scope 3 methodology selection tracker'),
    ],
  },

  '/cbam-compliance': {
    moduleCode: 'E-002', sprint: 'ENERGY',
    metrics: [
      m('vulnerability_idx', 'Vulnerability Index', 'Composite of 5 sub-indices (0\u2013100)', null, [
        comp('carbon_intensity_sub', 'Carbon Intensity Sub-Index', '68/100', 0.25, [
          leaf('direct_ci', 'Direct Carbon Intensity', '2.4 tCO\u2082/t', 'Facility Monitoring', 2),
        ]),
        comp('trade_exposure_sub', 'Trade Exposure Sub-Index', '72/100', 0.25, [
          leaf('eu_exports', 'EU Export Share', '34%', 'Eurostat', 1),
        ]),
        comp('price_gap_sub', 'Carbon Price Gap Sub-Index', '85/100', 0.20, [
          leaf('eu_price_cbam', 'EU ETS Price', '\u20ac95/tCO\u2082', 'EU ETS EUTL', 1),
          leaf('origin_price_cbam', 'Origin Carbon Price', '\u20ac12/tCO\u2082', 'World Bank', 2),
        ]),
      ], ['EU CBAM Regulation', 'Eurostat', 'EU ETS'], 'CBAM vulnerability composite'),

      m('cbam_cost', 'CBAM Cost', '\u03a3(ImportVol \u00d7 EmbeddedCarbon \u00d7 PriceGap)', null, [
        comp('steel_cost_cbam', 'Steel CBAM Cost', '\u20ac142M', null, [
          leaf('steel_vol_cbam', 'Import Volume', '2.4M tonnes', 'Eurostat', 1),
          leaf('steel_ef_cbam', 'Embedded Carbon', '1.85 tCO\u2082/t', 'EU CBAM Default', 2),
        ]),
        comp('cement_cost_cbam', 'Cement CBAM Cost', '\u20ac68M', null, [
          leaf('cement_vol_cbam', 'Import Volume', '1.1M tonnes', 'Eurostat', 1),
        ]),
        comp('alu_cost_cbam', 'Aluminium CBAM Cost', '\u20ac95M', null, [
          leaf('alu_vol_cbam', 'Import Volume', '0.8M tonnes', 'Eurostat', 1),
        ]),
      ], ['EU CBAM Regulation', 'Eurostat'], 'CBAM certificate cost'),

      // ── Tab: Commodity Detail ──
      m('commodity_costs', 'Commodity CBAM Costs', 'Per-commodity breakdown', null, [
        comp('hydrogen_cbam', 'Hydrogen CBAM', '\u20ac28M', null, [
          leaf('h2_vol', 'H\u2082 Import Volume', '0.2M tonnes', 'Eurostat', 1),
          leaf('h2_ef', 'H\u2082 Embedded Carbon', '9.3 tCO\u2082/t', 'EU CBAM Default', 2),
        ]),
        comp('electricity_cbam', 'Electricity CBAM', '\u20ac52M', null, [
          leaf('elec_imports', 'Electricity Imports', '12 TWh', 'ENTSO-E', 1),
          leaf('elec_ef_cbam', 'Grid EF at Border', '0.45 tCO\u2082/MWh', 'ENTSO-E', 2),
        ]),
      ], ['EU CBAM Regulation', 'ENTSO-E'], 'Per-commodity CBAM cost'),

      // ── Tab: Phase-In Projections ──
      m('phase_in_proj', 'Phase-In Projections', 'CBAM cost by year as free allocation drops', null, [
        comp('cbam_2026', '2026 Cost (2.5% phase)', '\u20ac8.5M', null, [
          leaf('free_alloc_2026', 'Free Allocation', '97.5%', 'EU CBAM Reg', 1),
        ]),
        comp('cbam_2030', '2030 Cost (50% phase)', '\u20ac170M', null, [
          leaf('free_alloc_2030', 'Free Allocation', '50%', 'EU CBAM Reg', 1),
        ]),
        comp('cbam_2034', '2034 Cost (100% phase)', '\u20ac340M', null, [
          leaf('free_alloc_2034', 'Free Allocation', '0%', 'EU CBAM Reg', 1),
        ]),
      ], ['EU CBAM Regulation'], 'CBAM phase-in projection (2026\u20132034)'),

      // ── Tab: Origin Price Gap ──
      m('origin_gap', 'Origin Price Gap', 'EU_Price \u2212 Origin_Price per jurisdiction', null, [
        comp('china_gap', 'China Gap', '\u20ac82/tCO\u2082', null, [
          leaf('cn_ets_price', 'China ETS Price', '\u20ac13/tCO\u2082', 'MEE China', 2),
        ]),
        comp('india_gap', 'India Gap', '\u20ac93/tCO\u2082', null, [
          leaf('in_carbon_price', 'India Carbon Price', '\u20ac2/tCO\u2082', 'BEE', 2),
        ]),
        comp('turkey_gap', 'Turkey Gap', '\u20ac95/tCO\u2082', null, [
          leaf('tr_carbon_price', 'Turkey Carbon Price', '\u20ac0/tCO\u2082', 'World Bank', 2),
        ]),
      ], ['EU ETS', 'World Bank Carbon Pricing Dashboard'], 'CBAM origin-specific price gap'),
    ],
  },

  '/carbon-credit-pricing': {
    moduleCode: 'E-003', sprint: 'ENERGY',
    metrics: [
      m('avg_credit_price', 'Avg Credit Price', '\u03a3(Price_i \u00d7 Vol_i) / \u03a3 Vol_i', null, [
        comp('nature_credits', 'Nature-Based Credits', '$8.20/tCO\u2082', null, [
          leaf('redd_price', 'REDD+ Price', '$6.50/tCO\u2082', 'Verra VCS', 2),
          leaf('arr_price', 'ARR Price', '$12.80/tCO\u2082', 'Gold Standard', 2),
        ]),
        comp('tech_credits', 'Technology Credits', '$45.00/tCO\u2082', null, [
          leaf('dac_price', 'DAC Credit Price', '$650/tCO\u2082', 'Frontier', 2),
          leaf('biochar_price', 'Biochar Price', '$120/tCO\u2082', 'Puro.earth', 2),
        ]),
      ], ['Verra', 'Gold Standard', 'Puro.earth'], 'Volume-weighted avg credit price'),

      m('quality_score_cc', 'Quality Score', 'avg(Additionality, Permanence, Leakage)', null, [
        comp('additionality', 'Additionality Score', '7.2/10', null, [
          leaf('add_method', 'Methodology Assessment', null, 'BeZero', 2),
        ]),
        comp('permanence', 'Permanence Score', '6.8/10', null, [
          leaf('buffer_pool', 'Buffer Pool %', '15%', 'Registry', 1),
          leaf('reversal_risk', 'Reversal Risk', 'Medium', 'Sylvera', 3),
        ]),
      ], ['BeZero', 'Sylvera', 'ICVCM'], 'Credit quality assessment'),

      // ── Tab: Forward Curve ──
      m('vcm_forward', 'VCM Forward Curve', 'F(t) = Spot \u00d7 exp((r + carry) \u00d7 t)', null, [
        comp('nature_fwd', 'Nature-Based Forward', null, null, [
          leaf('geo_spot_cc', 'GEO Spot', '$8.20', 'CBL Markets', 2),
          leaf('geo_dec26', 'GEO Dec-26', '$10.40', 'CBL Markets', 2),
        ]),
        comp('removal_fwd', 'Removal Forward', null, null, [
          leaf('removal_spot', 'Removal Spot', '$45', 'Puro.earth', 2),
          leaf('removal_fwd_12m', '12M Forward', '$52', 'OTC Broker', 3),
        ]),
      ], ['CBL Markets', 'Puro.earth'], 'VCM forward price curve'),

      // ── Tab: Vintage Premium ──
      m('vintage_premium', 'Vintage Premium', 'Price differential by issuance year', null, [
        comp('recent_vintage', 'Post-2020 Vintage', '+$2.40 premium', null, [
          leaf('recent_vol', 'Volume', '42M credits', 'Verra', 1),
        ]),
        comp('legacy_vintage', 'Pre-2016 Vintage', '\u2212$3.80 discount', null, [
          leaf('legacy_vol', 'Volume', '18M credits', 'Verra', 1),
          leaf('legacy_quality', 'Avg Quality', 'C+ BeZero', 'BeZero', 2),
        ]),
      ], ['Verra', 'BeZero', 'MSCI Carbon'], 'Vintage pricing differential'),

      // ── Tab: Quality Decomposition ──
      m('quality_decomp', 'Quality Decomposition', 'Additionality + Permanence + MRV + Co-Benefits', null, [
        comp('add_score_detail', 'Additionality', '7.2/10', 0.30, [
          leaf('add_financial', 'Financial Additionality', '7.5/10', 'BeZero', 2),
          leaf('add_regulatory', 'Regulatory Additionality', '6.8/10', 'BeZero', 2),
        ]),
        comp('perm_score_detail', 'Permanence', '6.8/10', 0.25, [
          leaf('perm_buffer', 'Buffer Pool', '15%', 'Registry', 1),
          leaf('perm_risk_rating', 'Reversal Risk', 'Medium', 'Sylvera', 3),
        ]),
        comp('mrv_score', 'MRV Quality', '7.5/10', 0.25, [
          leaf('monitoring_freq', 'Monitoring Frequency', 'Annual', 'Methodology', 2),
          leaf('verification_body', 'Verification Body', 'DOE-accredited', 'UNFCCC', 1),
        ]),
        comp('cobenefit_score', 'Co-Benefits', '8.1/10', 0.20, [
          leaf('sdg_alignment', 'SDG Alignment', '5 SDGs', 'Project Doc', 2),
        ]),
      ], ['ICVCM CCP', 'BeZero', 'Sylvera'], 'Credit quality factor decomposition'),
    ],
  },

  '/carbon-market-intelligence': {
    moduleCode: 'E-004', sprint: 'ENERGY',
    metrics: [
      m('vcm_value', 'VCM Market Value', '\u03a3(Issuance \u00d7 Price)', null, [
        comp('verra_value', 'Verra VCS Value', '$1.2B', null, [
          leaf('verra_issuance', 'Verra Issuance', '142M credits', 'Verra', 1),
        ]),
        comp('gs_value', 'Gold Standard Value', '$0.4B', null, [
          leaf('gs_issuance', 'GS Issuance', '38M credits', 'Gold Standard', 1),
        ]),
      ], ['Verra', 'Gold Standard', 'Ecosystem Marketplace'], 'VCM valuation'),

      m('compliance_cap', 'Compliance Market Cap', 'Total allowance value', null, [
        comp('eu_ets_cap', 'EU ETS Cap', '$185B', null, [
          leaf('eu_ets_vol_cm', 'Total Allowances', '1.95B', 'EU ETS EUTL', 1),
          leaf('eu_ets_price_cm', 'EUA Price', '\u20ac95', 'ICE Endex', 1),
        ]),
        comp('china_ets_cap', 'China ETS Cap', '$12B', null, [
          leaf('cn_vol', 'Total Allowances', '4.5B', 'MEE China', 2),
        ]),
      ], ['ICAP', 'World Bank'], 'Global compliance market cap'),
    ],
  },

  '/integrated-carbon-emissions': {
    moduleCode: 'E-005', sprint: 'ENERGY',
    metrics: [
      m('total_emissions', 'Total Emissions', 'S1 + S2 + S3', null, [
        comp('s1_total', 'Scope 1', '24.6M tCO\u2082e', null, [
          leaf('stationary', 'Stationary Combustion', '14.2M tCO\u2082e', 'GHG Protocol', 2),
          leaf('mobile', 'Mobile Combustion', '5.8M tCO\u2082e', 'GHG Protocol', 2),
          leaf('process_em', 'Process Emissions', '4.6M tCO\u2082e', 'GHG Protocol', 2),
        ]),
        comp('s2_total', 'Scope 2', '12.4M tCO\u2082e', null, [
          leaf('s2_market_ice', 'Market-based', '8.2M tCO\u2082e', 'RE certificates', 2),
          leaf('s2_location_ice', 'Location-based', '12.4M tCO\u2082e', 'IEA Grid Factors', 3),
        ]),
        comp('s3_total_ice', 'Scope 3', '82.1M tCO\u2082e', null, [
          leaf('s3_upstream_ice', 'Upstream', '28.4M tCO\u2082e', 'Spend/Activity EF', 4),
          leaf('s3_downstream_ice', 'Downstream', '53.7M tCO\u2082e', 'Product Specific', 3),
        ]),
      ], ['GHG Protocol', 'CDP', 'DEFRA EFs'], 'Full corporate GHG inventory'),
    ],
  },

  '/physical-risk-portfolio': {
    moduleCode: 'E-006', sprint: 'ENERGY',
    metrics: [
      m('phys_risk_score', 'Physical Risk Score', 'Weighted avg of peril scores', null, [
        comp('flood_score', 'Flood Risk', '72/100', 0.30, [
          leaf('flood_rp', '100yr Return Period', '8.2% prob', 'NGFS + JBA', 3),
          leaf('flood_exp', 'Exposure Value', '$4.2B', 'Asset Register', 2),
        ]),
        comp('heat_score', 'Heat Stress', '58/100', 0.25, [
          leaf('heat_days', 'Days >35\u00b0C (2050)', '42 days', 'CMIP6 SSP2-4.5', 2),
        ]),
        comp('wind_score', 'Windstorm Risk', '45/100', 0.20, [
          leaf('wind_rp', '250yr Return Period', '2.1% prob', 'Cat Model', 3),
        ]),
        comp('sea_score', 'Sea Level Rise', '38/100', 0.25, [
          leaf('slr_proj', 'SLR Projection 2100', '+0.65m RCP4.5', 'IPCC AR6', 1),
        ]),
      ], ['NGFS', 'IPCC AR6', 'JBA Risk', 'CMIP6'], 'Multi-peril physical risk scoring'),

      m('climate_var_phys', 'Climate VaR (Physical)', 'Annual Loss at 95th percentile', null, [
        comp('aal', 'Average Annual Loss', '$180M', null, [
          leaf('flood_aal', 'Flood AAL', '$72M', 'Cat Model', 3),
          leaf('wind_aal', 'Wind AAL', '$58M', 'Cat Model', 3),
          leaf('heat_aal', 'Heat AAL', '$50M', 'Climate Model', 3),
        ]),
        comp('pml_250', 'PML 250yr', '$2.1B', null, [
          leaf('pml_flood', 'Flood PML', '$850M', 'Cat Model', 3),
          leaf('pml_wind', 'Wind PML', '$1.25B', 'Cat Model', 3),
        ]),
      ], ['Internal Cat Model', 'NGFS'], 'Physical risk VaR'),

      // ── Tab: Insured % ──
      m('insured_pct', 'Insured %', 'Insured_Value / Total_Exposure', null, [
        comp('fully_insured', 'Fully Insured', '62% of assets', null, [
          leaf('ins_property', 'Property Cover', '$18.5B', 'Policy Register', 1),
          leaf('ins_bi', 'Business Interruption', '$8.2B', 'Policy Register', 1),
        ]),
        comp('underinsured', 'Underinsured', '24% of assets', null, [
          leaf('underins_gap', 'Coverage Gap', '$4.2B', 'Analysis', 2),
        ]),
        comp('uninsured', 'Uninsured', '14% of assets', null, [
          leaf('unins_assets', 'Uninsured Assets', '$5.8B', 'Asset Register', 2),
        ]),
      ], ['Policy Register', 'Asset Register'], 'Insurance coverage analysis'),

      // ── Tab: Geographic Concentration ──
      m('geo_concentration', 'Geographic Concentration', 'Top-5 regions as % of total exposure', null, [
        comp('top5_regions', 'Top 5 Regions', '68% of exposure', null, [
          leaf('region1', 'Southeast Asia', '22%', 'Asset Register', 2),
          leaf('region2', 'Gulf Coast US', '18%', 'Asset Register', 2),
          leaf('region3', 'Northern Europe', '12%', 'Asset Register', 2),
        ]),
        comp('hhi_geographic', 'Geographic HHI', '0.15', null, [
          leaf('hhi_calc', 'Herfindahl Index', '0.15 (moderate)', 'Calculation', 2),
        ]),
      ], ['Asset Register', 'Geospatial'], 'Geographic risk concentration'),

      // ── Tab: Adaptation ──
      m('adaptation_measures', 'Adaptation Measures', 'Cost-benefit of physical adaptation', null, [
        comp('adapt_flood', 'Flood Adaptation', 'BCR = 4.2x', null, [
          leaf('adapt_flood_cost', 'Investment Cost', '$120M', 'Engineering', 3),
          leaf('adapt_flood_benefit', 'Loss Reduction', '$504M NPV', 'Cat Model', 3),
        ]),
        comp('adapt_heat', 'Heat Adaptation', 'BCR = 2.8x', null, [
          leaf('adapt_heat_cost', 'Investment Cost', '$85M', 'Engineering', 3),
          leaf('adapt_heat_benefit', 'Productivity Gain', '$238M NPV', 'Climate Model', 3),
        ]),
      ], ['Engineering Estimates', 'GCA'], 'Adaptation cost-benefit analysis'),
    ],
  },

  '/water-risk-analytics': {
    moduleCode: 'E-007', sprint: 'ENERGY',
    metrics: [
      m('avg_water_stress', 'Avg Water Stress', '\u03a3(Demand/Supply by basin)', null, [
        comp('high_stress', 'High Stress Basins', '4.2/5.0', null, [
          leaf('basin_india', 'Ganges Basin', '4.5/5.0', 'WRI Aqueduct', 2),
          leaf('basin_mena', 'MENA Basins', '4.8/5.0', 'WRI Aqueduct', 2),
        ]),
        comp('med_stress', 'Medium Stress Basins', '2.8/5.0', null, [
          leaf('basin_europe', 'European Basins', '2.5/5.0', 'WRI Aqueduct', 2),
        ]),
      ], ['WRI Aqueduct', 'AQUASTAT'], 'Basin-level water stress'),

      m('basin_risk', 'Basin Risk Score', 'Composite of stress + regulatory + reputation', null, [
        comp('stress_risk', 'Stress Risk', '68/100', null, [
          leaf('bws', 'Baseline Water Stress', '4.2/5.0', 'WRI Aqueduct', 2),
        ]),
        comp('reg_risk', 'Regulatory Risk', '52/100', null, [
          leaf('water_tariff', 'Water Tariff Trend', '+8%/yr', 'National Regulators', 2),
        ]),
      ], ['WRI Aqueduct', 'CDP Water'], 'Multi-dimensional basin risk'),

      // ── Tab: Withdrawal & Intensity ──
      m('water_withdrawal', 'Water Withdrawal', '\u03a3 withdrawal by source', null, [
        comp('surface_withdrawal', 'Surface Water', '42M m\u00b3', null, [
          leaf('river_withdrawal', 'River Abstraction', '28M m\u00b3', 'Facility Meters', 2),
          leaf('lake_withdrawal', 'Lake Abstraction', '14M m\u00b3', 'Facility Meters', 2),
        ]),
        comp('ground_withdrawal', 'Groundwater', '18M m\u00b3', null, [
          leaf('well_extraction', 'Well Extraction', '18M m\u00b3', 'Facility Meters', 2),
        ]),
      ], ['CDP Water', 'Company Reports'], 'Total water withdrawal by source'),

      m('water_intensity', 'Water Intensity', 'Withdrawal / Revenue ($M)', null, [
        comp('high_intensity_water', 'Water-Intensive Sectors', '8500 m\u00b3/$M', null, [
          leaf('mining_intensity', 'Mining', '12400 m\u00b3/$M', 'CDP Water', 2),
          leaf('agri_intensity', 'Agriculture', '9800 m\u00b3/$M', 'FAO AQUASTAT', 2),
        ]),
        comp('low_intensity_water', 'Low-Intensity Sectors', '120 m\u00b3/$M', null, [
          leaf('tech_water', 'Technology', '85 m\u00b3/$M', 'CDP Water', 3),
        ]),
      ], ['CDP Water', 'FAO AQUASTAT'], 'Water use intensity by sector'),

      // ── Tab: Regulatory Risk ──
      m('water_regulatory', 'Water Regulatory Risk', 'Regulatory tightening exposure', null, [
        comp('tariff_risk', 'Tariff Increase Risk', '72/100', null, [
          leaf('tariff_trend', 'Historical Tariff Trend', '+8%/yr', 'National Regulators', 2),
          leaf('tariff_forecast', 'Forecast (5yr)', '+45%', 'Analysis', 3),
        ]),
        comp('allocation_risk', 'Allocation Cut Risk', '58/100', null, [
          leaf('drought_policy', 'Drought Policy', 'Tier 3 restrictions', 'Basin Authority', 2),
        ]),
      ], ['National Regulators', 'CDP Water'], 'Water regulatory tightening risk'),

      // ── Tab: Stranded Water Assets ──
      m('stranded_water', 'Stranded Water Assets', 'Assets at risk from water scarcity', null, [
        comp('high_risk_assets', 'High-Risk Assets', '$2.8B', null, [
          leaf('desal_dependent', 'Desalination-Dependent', '$1.2B', 'Asset Register', 2),
          leaf('groundwater_depleting', 'Depleting Aquifer Zone', '$1.6B', 'WRI Aqueduct', 2),
        ]),
        comp('adaptation_req', 'Adaptation Required', '$450M', null, [
          leaf('water_recycling', 'Water Recycling Investment', '$280M', 'Engineering', 3),
          leaf('efficiency_invest', 'Efficiency Investment', '$170M', 'Engineering', 3),
        ]),
      ], ['WRI Aqueduct', 'Asset Register'], 'Water-stranded asset exposure'),
    ],
  },

  '/internal-carbon-price': {
    moduleCode: 'E-008', sprint: 'ENERGY',
    metrics: [
      m('shadow_price', 'Shadow Carbon Price', 'Internal decision-making price', null, [
        comp('operational_icp', 'Operational ICP', '$85/tCO\u2082', null, [
          leaf('icp_base', 'Base ICP', '$65/tCO\u2082', 'Board Decision', 1),
          leaf('icp_escalation', 'Annual Escalation', '5%/yr', 'Policy', 1),
        ]),
        comp('strategic_icp', 'Strategic ICP', '$150/tCO\u2082', null, [
          leaf('icp_2030', '2030 Projection', '$150/tCO\u2082', 'NGFS NZ2050', 2),
        ]),
      ], ['NGFS', 'World Bank'], 'Shadow carbon pricing'),

      m('abatement_cost', 'Marginal Abatement Cost', 'Cost per tCO\u2082 by technology', null, [
        comp('low_cost_abate', 'Low-Cost (<$50/t)', null, null, [
          leaf('efficiency', 'Energy Efficiency', '$15/tCO\u2082', 'McKinsey MAC', 3),
          leaf('fuel_switch', 'Fuel Switching', '$35/tCO\u2082', 'McKinsey MAC', 3),
        ]),
        comp('high_cost_abate', 'High-Cost (>$50/t)', null, null, [
          leaf('ccs_abate', 'CCS', '$85/tCO\u2082', 'IEA', 2),
          leaf('green_h2', 'Green Hydrogen', '$120/tCO\u2082', 'IRENA', 2),
        ]),
      ], ['McKinsey', 'IEA', 'IRENA'], 'MAC curve analysis'),
    ],
  },

  '/stranded-asset-litigation-tracker': {
    moduleCode: 'E-009', sprint: 'ENERGY',
    metrics: [
      m('stranded_value', 'Stranded Asset Value', '\u03a3(AssetValue \u00d7 StrandedProb)', null, [
        comp('fossil_stranded', 'Fossil Fuel Assets', '$42B', null, [
          leaf('oil_reserves', 'Unburnable Oil', '$28B', 'Carbon Tracker', 2),
          leaf('gas_reserves', 'Unburnable Gas', '$14B', 'Carbon Tracker', 2),
        ]),
        comp('infra_stranded', 'Infrastructure', '$18B', null, [
          leaf('coal_plants', 'Coal Plant Writedowns', '$12B', 'GEM', 2),
          leaf('pipeline_wd', 'Pipeline Writedowns', '$6B', 'GOGEL', 2),
        ]),
      ], ['Carbon Tracker', 'GEM', 'GOGEL'], 'Stranded asset valuation under 1.5\u00b0C'),

      m('litigation_count', 'Litigation Count', 'Active climate cases', null, [
        comp('government_cases', 'Government Cases', '42 active', null, [
          leaf('tort_cases', 'Tort Claims', '18', 'Sabin Center / LSE', 1),
          leaf('regulatory_cases', 'Regulatory Actions', '24', 'Sabin Center', 1),
        ]),
        comp('private_cases', 'Private Litigation', '28 active', null, [
          leaf('securities_lit', 'Securities Claims', '12', 'Sabin Center', 1),
          leaf('shareholder_lit', 'Shareholder Actions', '16', 'ClientEarth', 2),
        ]),
      ], ['Sabin Center', 'LSE Grantham'], 'Climate litigation tracker'),
    ],
  },

  '/carbon-forward-curve': {
    moduleCode: 'E-010', sprint: 'ENERGY',
    metrics: [
      m('forward_price', 'Forward Price Curve', 'F(t) = S \u00d7 exp((r \u2212 y + c) \u00d7 t)', null, [
        comp('eu_ets_curve', 'EU ETS Curve', null, null, [
          leaf('spot_eua', 'EUA Spot', '\u20ac95.20', 'ICE Endex', 1),
          leaf('dec25_eua', 'Dec-25 Forward', '\u20ac102.80', 'ICE Endex', 1),
          leaf('dec26_eua', 'Dec-26 Forward', '\u20ac110.50', 'ICE Endex', 1),
        ]),
        comp('vcm_curve', 'VCM Curve', null, null, [
          leaf('spot_geo', 'GEO Spot', '$8.20', 'CBL Markets', 2),
          leaf('dec25_geo', 'Dec-25 Forward', '$9.40', 'CBL Markets', 2),
        ]),
      ], ['ICE Endex', 'CBL Markets'], 'Carbon forward term structure'),

      m('basis_spread', 'Basis Spread', 'EUA \u2212 UKA spread', null, [
        comp('eua_uka', 'EUA\u2013UKA Spread', '\u20ac12.50', null, [
          leaf('eua_ref', 'EUA Reference', '\u20ac95.20', 'ICE Endex', 1),
          leaf('uka_ref', 'UKA Reference', '\u00a371.80', 'ICE Futures', 1),
        ]),
      ], ['ICE Endex', 'ICE Futures Europe'], 'Cross-market carbon basis'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // INSURANCE & CAT
  // ═══════════════════════════════════════════════════════════════════
  '/climate-insurance': {
    moduleCode: 'I-001', sprint: 'INS',
    metrics: [
      m('combined_ratio', 'Combined Ratio', '(Claims + Expenses) / Earned Premium', null, [
        comp('loss_ratio', 'Loss Ratio', '68.5%', null, [
          leaf('claims_paid', 'Claims Paid', '$2.4B', 'Insurer Financials', 1),
          leaf('earned_prem', 'Earned Premium', '$3.5B', 'Insurer Financials', 1),
        ]),
        comp('expense_ratio', 'Expense Ratio', '28.2%', null, [
          leaf('acq_cost', 'Acquisition Costs', '$0.7B', 'Insurer Financials', 1),
        ]),
      ], ['Insurer Financials', 'AM Best'], 'Combined ratio with climate loading'),

      m('climate_aal', 'Climate AAL', 'Average annual loss from climate perils', null, [
        comp('nat_cat_aal', 'Nat Cat AAL', '$420M', null, [
          leaf('hurricane_aal', 'Hurricane AAL', '$180M', 'RMS / AIR', 3),
          leaf('flood_aal_ins', 'Flood AAL', '$120M', 'JBA / Fathom', 3),
          leaf('wildfire_aal', 'Wildfire AAL', '$120M', 'Internal Model', 3),
        ]),
        comp('secondary_aal', 'Secondary Perils AAL', '$85M', null, [
          leaf('convective_aal', 'Convective Storm', '$45M', 'Internal', 3),
        ]),
      ], ['RMS', 'AIR Worldwide', 'JBA'], 'Climate-adjusted AAL'),

      m('solvency_ratio', 'Solvency Ratio', 'Own Funds / SCR \u00d7 100', null, [
        comp('own_funds', 'Eligible Own Funds', '\u20ac8.2B', null, [
          leaf('tier1_of', 'Tier 1 Capital', '\u20ac6.8B', 'Solvency II', 1),
        ]),
        comp('scr_total', 'SCR Total', '\u20ac4.8B', null, [
          leaf('scr_market', 'Market Risk SCR', '\u20ac2.1B', 'Standard Formula', 1),
          leaf('scr_underwriting', 'Underwriting SCR', '\u20ac1.8B', 'Standard Formula', 1),
          leaf('scr_cat', 'Cat Risk SCR', '\u20ac0.9B', 'Standard Formula', 1),
        ]),
      ], ['Solvency II', 'EIOPA'], 'Solvency II ratio with climate stress'),

      // ── Tab: Cat Events ──
      m('cat_event_losses', 'Cat Event Losses', 'Year-to-date catastrophe losses', null, [
        comp('nat_cat_ytd', 'Natural Cat YTD', '$1.8B', null, [
          leaf('hurricane_ytd', 'Hurricane Losses', '$850M', 'Claims DB', 1),
          leaf('flood_ytd', 'Flood Losses', '$520M', 'Claims DB', 1),
          leaf('wildfire_ytd', 'Wildfire Losses', '$430M', 'Claims DB', 1),
        ]),
        comp('secondary_ytd', 'Secondary Perils YTD', '$320M', null, [
          leaf('hail_ytd', 'Hail/Convective', '$180M', 'Claims DB', 1),
          leaf('freeze_ytd', 'Winter Freeze', '$140M', 'Claims DB', 1),
        ]),
      ], ['Claims DB', 'Swiss Re sigma'], 'Year-to-date catastrophe event losses'),

      // ── Tab: Litigation Risk ──
      m('insurance_litigation', 'Litigation Risk', 'Climate litigation exposure', null, [
        comp('greenwash_claims', 'Greenwashing Claims', '4 cases', null, [
          leaf('d_and_o_claims', 'D&O Claims', '2 cases', 'Sabin Center', 1),
          leaf('product_claims', 'Product Liability', '2 cases', 'ClientEarth', 2),
        ]),
        comp('duty_of_care', 'Duty of Care Claims', '6 cases', null, [
          leaf('insurer_duty', 'Insurer Duty Claims', '3 cases', 'Sabin Center', 1),
          leaf('underwriting_duty', 'Underwriting Liability', '3 cases', 'Legal DB', 2),
        ]),
      ], ['Sabin Center', 'ClientEarth', 'LSE Grantham'], 'Climate litigation for insurers'),

      // ── Tab: Underwriting Climate ──
      m('uw_climate_adj', 'Underwriting Climate Adjustment', 'Climate-loaded technical price', null, [
        comp('base_tech_price', 'Base Technical Price', '68.5% LR', null, [
          leaf('hist_lr', 'Historical Loss Ratio', '65.2%', 'Actuarial', 1),
        ]),
        comp('climate_load', 'Climate Loading', '+4.8% LR', null, [
          leaf('trend_loading', 'Trend Loading', '+2.2%', 'Cat Model', 3),
          leaf('severity_loading', 'Severity Loading', '+2.6%', 'Cat Model', 3),
        ]),
      ], ['Actuarial Pricing', 'Cat Model'], 'Climate-adjusted underwriting price'),
    ],
  },

  '/catastrophe-modelling': {
    moduleCode: 'I-002', sprint: 'INS',
    metrics: [
      m('oep_100', 'OEP 100yr', 'Occurrence Exceedance at 1% threshold', null, [
        comp('oep_flood_cat', 'Flood OEP 100yr', '$850M', null, [
          leaf('flood_events', 'Stochastic Event Set', '50000 years', 'JBA', 3),
        ]),
        comp('oep_wind_cat', 'Wind OEP 100yr', '$1.25B', null, [
          leaf('wind_events', 'TC Event Set', '100000 years', 'RMS', 3),
        ]),
      ], ['RMS', 'AIR', 'JBA Risk'], 'Cat model OEP 100yr loss'),

      m('protection_gap', 'Protection Gap', 'Economic Loss \u2212 Insured Loss', null, [
        comp('econ_loss', 'Economic Loss (100yr)', '$2.8B', null, [
          leaf('asset_exp_pg', 'Asset Exposure', '$42B', 'Asset Register', 2),
        ]),
        comp('insured_loss', 'Insured Loss (100yr)', '$1.6B', null, [
          leaf('ins_coverage_pg', 'Insurance Coverage', '$28B', 'Policy Register', 1),
        ]),
      ], ['Swiss Re sigma', 'Cat Model'], 'Protection gap analysis'),

      // ── Tab: Climate Factors ──
      m('climate_factors_cat', 'Climate Factors', 'Climate change multipliers on loss', null, [
        comp('freq_factor', 'Frequency Factor', '1.12x by 2050', null, [
          leaf('freq_flood', 'Flood Frequency', '+18%', 'CMIP6 SSP2-4.5', 2),
          leaf('freq_tc', 'TC Frequency', '+8%', 'CMIP6 SSP2-4.5', 2),
        ]),
        comp('severity_factor', 'Severity Factor', '1.25x by 2050', null, [
          leaf('sev_wind', 'Wind Severity', '+15%', 'CMIP6', 2),
          leaf('sev_precip', 'Precipitation Severity', '+22%', 'CMIP6', 2),
        ]),
      ], ['CMIP6', 'IPCC AR6'], 'Climate change adjustment factors'),

      // ── Tab: PML/AEP Detail ──
      m('aep_curve', 'AEP Curve', 'Aggregate exceedance probability', null, [
        comp('aep_50', 'AEP 50yr', '$1.4B', null, [
          leaf('aep50_events', 'Stochastic Events', '50000 years', 'Cat Model', 3),
        ]),
        comp('aep_100', 'AEP 100yr', '$2.1B', null, [
          leaf('aep100_events', 'Stochastic Events', '100000 years', 'Cat Model', 3),
        ]),
        comp('aep_250', 'AEP 250yr', '$3.8B', null, [
          leaf('aep250_confidence', 'Confidence Interval', '\u00b122%', 'Cat Model', 3),
        ]),
      ], ['Cat Model', 'RMS', 'AIR'], 'Aggregate exceedance probability curve'),

      // ── Tab: Loss Development ──
      m('loss_development', 'Loss Development', 'Loss emergence pattern', null, [
        comp('year1_emergence', 'Year 1 Emergence', '65% of ultimate', null, [
          leaf('paid_y1', 'Paid %', '42%', 'Triangle', 1),
          leaf('case_y1', 'Case Reserve %', '23%', 'Claims DB', 1),
        ]),
        comp('ibnr_estimate', 'IBNR Estimate', '$280M', null, [
          leaf('ibnr_method', 'Method', 'Chain Ladder + BF', 'Actuarial', 2),
          leaf('ibnr_trend', 'Climate Trend Adj', '+$45M', 'Internal', 3),
        ]),
      ], ['Actuarial Triangle', 'Internal'], 'Climate-adjusted loss development'),
    ],
  },

  '/scenario-stress-test': {
    moduleCode: 'I-003', sprint: 'INS',
    metrics: [
      m('portfolio_loss', 'Portfolio Loss %', 'MTM Loss / AUM under scenario', null, [
        comp('nz2050_loss', 'Net Zero 2050 Loss', '\u22124.2%', null, [
          leaf('nz_carbon', 'Carbon Cost Impact', '\u22122.8%', 'NGFS', 2),
          leaf('nz_demand', 'Demand Shift Impact', '\u22121.4%', 'NGFS', 2),
        ]),
        comp('delayed_loss', 'Delayed Transition Loss', '\u22128.5%', null, [
          leaf('del_carbon', 'Carbon Shock', '\u22125.2%', 'NGFS', 2),
          leaf('del_physical', 'Physical Impact', '\u22123.3%', 'NGFS', 2),
        ]),
        comp('hothouse_loss', 'Hot House World Loss', '\u221212.8%', null, [
          leaf('hh_physical', 'Physical Damage', '\u22129.2%', 'NGFS', 2),
          leaf('hh_stranded', 'Stranded Assets', '\u22123.6%', 'NGFS', 2),
        ]),
      ], ['NGFS Phase 5'], 'NGFS scenario portfolio loss'),

      m('var_stress', 'VaR 95/99', 'VaR under stress scenario', null, [
        comp('var_95_stress', 'VaR 95%', '\u22125.8%', null, [
          leaf('var95_param', 'Parametric VaR', '\u22125.2%', 'Internal', 3),
        ]),
        comp('var_99_stress', 'VaR 99%', '\u22129.2%', null, [
          leaf('var99_param', 'Parametric VaR', '\u22128.5%', 'Internal', 3),
        ]),
      ], ['Internal Risk Model'], 'Stress scenario VaR'),

      // ── Tab: 8-Scenario Losses ──
      m('eight_scenario', '8-Scenario Loss Matrix', 'Loss under each NGFS scenario', null, [
        comp('orderly_scenarios', 'Orderly Scenarios', null, null, [
          leaf('nz2050_scen', 'Net Zero 2050', '\u22124.2%', 'NGFS', 2),
          leaf('below2d_scen', 'Below 2\u00b0C', '\u22123.1%', 'NGFS', 2),
        ]),
        comp('disorderly_scenarios', 'Disorderly Scenarios', null, null, [
          leaf('divergent_scen', 'Divergent Net Zero', '\u22126.8%', 'NGFS', 2),
          leaf('delayed_scen', 'Delayed Transition', '\u22128.5%', 'NGFS', 2),
        ]),
        comp('hothouse_scenarios', 'Hot House World', null, null, [
          leaf('ndcs_scen', 'NDCs Only', '\u221210.2%', 'NGFS', 2),
          leaf('cp_scen', 'Current Policies', '\u221212.8%', 'NGFS', 2),
        ]),
      ], ['NGFS Phase 5'], 'Full NGFS 6-scenario + 2 custom scenarios'),

      // ── Tab: Sector Impact ──
      m('sector_stress_impact', 'Sector Impact', 'Loss % by sector under worst case', null, [
        comp('energy_stress', 'Energy Sector', '\u221218.5%', null, [
          leaf('energy_carbon_stress', 'Carbon Cost', '\u221212.4%', 'NGFS', 2),
          leaf('energy_demand_stress', 'Demand Destruction', '\u22126.1%', 'NGFS', 2),
        ]),
        comp('re_stress', 'Real Estate', '\u22128.2%', null, [
          leaf('re_physical_stress', 'Physical Damage', '\u22124.8%', 'NGFS', 2),
          leaf('re_epc_stress', 'EPC Obsolescence', '\u22123.4%', 'CRREM', 3),
        ]),
      ], ['NGFS Phase 5', 'CRREM'], 'Sector-level stress impact'),

      // ── Tab: Reverse Stress ──
      m('reverse_stress', 'Reverse Stress', 'Scenario that causes CET1 < minimum', null, [
        comp('reverse_carbon', 'Carbon Price for Breach', '\u20ac280/tCO\u2082', null, [
          leaf('rev_cet1_target', 'CET1 Minimum', '4.5%', 'CRR III', 1),
          leaf('rev_carbon_implied', 'Implied Carbon Price', '\u20ac280/t', 'Reverse Stress', 3),
        ]),
        comp('reverse_physical', 'Physical Loss for Breach', '3.2\u00b0C warming', null, [
          leaf('rev_phys_loss', 'Physical Loss Required', '\u221214.5%', 'Reverse Stress', 3),
        ]),
      ], ['Internal Model'], 'Reverse stress testing'),
    ],
  },

  '/parametric-insurance': {
    moduleCode: 'I-004', sprint: 'INS',
    metrics: [
      m('trigger_prob', 'Trigger Probability', 'P(Index > Threshold)', null, [
        comp('hurricane_trig', 'Hurricane Trigger', '4.2% annual', null, [
          leaf('cat_index', 'Cat-in-a-Box Index', '>Cat 3 in zone', 'Swiss Re', 2),
        ]),
        comp('drought_trig', 'Drought Trigger', '8.5% annual', null, [
          leaf('ndvi_index', 'NDVI Threshold', '<0.2 for 60 days', 'NASA MODIS', 2),
        ]),
      ], ['Swiss Re', 'NOAA', 'NASA'], 'Parametric trigger probability'),

      m('basis_risk_metric', 'Basis Risk', '|Actual_Loss \u2212 Index_Payout| / Actual_Loss', null, [
        comp('spatial_basis', 'Spatial Basis Risk', '12%', null, [
          leaf('grid_res', 'Index Grid Resolution', '25km', 'Data Provider', 2),
        ]),
        comp('temporal_basis', 'Temporal Basis Risk', '8%', null, [
          leaf('index_period', 'Index Period', 'Monthly', 'Contract', 1),
        ]),
      ], ['Academic Research', 'Swiss Re'], 'Basis risk assessment'),
    ],
  },

  '/reinsurance-climate': {
    moduleCode: 'I-005', sprint: 'INS',
    metrics: [
      m('cat_bond_spread', 'Cat Bond Spread', 'Risk premium over SOFR', null, [
        comp('usd_144a', 'USD 144A Cat Bonds', '450 bps', null, [
          leaf('el_ratio', 'Expected Loss', '2.8%', 'Offering Circular', 2),
          leaf('spread_multiple', 'Spread Multiple', '1.6x', 'Artemis', 2),
        ]),
        comp('ils_benchmark', 'ILS Benchmark', '380 bps', null, [
          leaf('swiss_re_idx', 'Swiss Re Cat Bond Index', '380 bps', 'Swiss Re', 2),
        ]),
      ], ['Artemis', 'Swiss Re Cat Bond Index'], 'Cat bond spread analysis'),

      m('ils_return', 'ILS Return', 'Total return on ILS portfolio', null, [
        comp('coupon_ils', 'Coupon Income', 'SOFR + 450 bps', null, [
          leaf('sofr_base', 'SOFR Base', '4.8%', 'Fed', 1),
          leaf('risk_premium', 'Risk Premium', '4.5%', 'ILS Market', 2),
        ]),
        comp('loss_experience', 'Loss Experience', '\u22121.2%', null, [
          leaf('realized_loss', 'Realized Losses', '\u2212$18M', 'Fund Report', 2),
        ]),
      ], ['Fund Reports', 'Artemis'], 'ILS return attribution'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // INDIA-SPECIFIC
  // ═══════════════════════════════════════════════════════════════════
  '/india-ccts': {
    moduleCode: 'IN-001', sprint: 'IND',
    metrics: [
      m('total_cccs', 'Total CCCs Issued', '\u03a3 CCC allocations by BEE', null, [
        comp('industrial_ccc', 'Industrial CCCs', '4.2M certificates', null, [
          leaf('cement_ccc', 'Cement Sector', '1.8M', 'BEE / MoP', 2),
          leaf('iron_steel_ccc', 'Iron & Steel', '1.2M', 'BEE / MoP', 2),
        ]),
        comp('power_ccc', 'Power Sector CCCs', '2.8M certificates', null, [
          leaf('thermal_ccc', 'Thermal Power', '2.1M', 'BEE / CEA', 2),
        ]),
      ], ['BEE', 'MoP India'], 'India CCC inventory'),

      m('compliance_cost_in', 'Compliance Cost', 'Shortfall \u00d7 CCC Price', null, [
        comp('shortfall_vol', 'Shortfall Volume', '1.8M CCCs', null, [
          leaf('target_demand', 'BEE PAT Target', '6.2M', 'BEE', 1),
          leaf('achieved', 'Achieved', '4.4M', 'BEE', 2),
        ]),
        comp('ccc_price', 'CCC Price', '\u20b9800/certificate', null, [
          leaf('exchange_price', 'IEX / PXIL Price', '\u20b9800', 'Power Exchange', 2),
        ]),
      ], ['BEE', 'IEX', 'PXIL'], 'PAT scheme compliance cost'),

      // ── Tab: Sector Deep-Dive ──
      m('sector_baseline', 'Sector Baseline', 'Baseline emissions by sector (MtCO\u2082e)', null, [
        comp('cement_baseline', 'Cement Sector', '180 MtCO\u2082e', null, [
          leaf('cement_cap', 'Installed Capacity', '570 MTPA', 'CMA India', 2),
          leaf('cement_ef_in', 'Emission Factor', '0.58 tCO\u2082/t', 'WBCSD CSI', 2),
        ]),
        comp('steel_baseline', 'Iron & Steel', '260 MtCO\u2082e', null, [
          leaf('steel_cap', 'Crude Steel Production', '142 MTPA', 'Ministry of Steel', 1),
          leaf('steel_ef_in', 'Emission Factor', '2.4 tCO\u2082/t', 'worldsteel', 2),
        ]),
        comp('thermal_baseline', 'Thermal Power', '1100 MtCO\u2082e', null, [
          leaf('thermal_gen', 'Thermal Generation', '1050 TWh', 'CEA', 1),
          leaf('grid_ef_in', 'Grid EF', '0.72 kgCO\u2082/kWh', 'CEA', 1),
        ]),
      ], ['BEE', 'CEA India', 'CMA'], 'Sector baseline emissions'),

      m('sector_target', 'Sector Target', 'Reduction target by sector (MtCO\u2082e)', null, [
        comp('cement_target', 'Cement Target', '\u221215% by 2030', null, [
          leaf('cement_ndc', 'NDC Contribution', '27 MtCO\u2082e', 'MoEFCC', 2),
        ]),
        comp('steel_target', 'Steel Target', '\u221218% by 2030', null, [
          leaf('steel_ndc', 'NDC Contribution', '46.8 MtCO\u2082e', 'MoEFCC', 2),
        ]),
      ], ['BEE', 'MoEFCC', 'MoP India'], 'PAT/CCTS sector reduction targets'),

      // ── Tab: Carbon Pricing ──
      m('ccc_price_detail', 'CCC Price Detail', 'India carbon credit pricing', null, [
        comp('exchange_traded', 'Exchange Traded', '\u20b9800/CCC', null, [
          leaf('iex_price', 'IEX Price', '\u20b9800', 'IEX', 2),
          leaf('pxil_price', 'PXIL Price', '\u20b9785', 'PXIL', 2),
        ]),
        comp('eu_ets_comparison', 'EU ETS Comparison', '\u20b9800 vs \u20ac95 (\u20b98400)', null, [
          leaf('price_gap_in', 'Price Gap', '90.5%', 'Calculation', 2),
        ]),
      ], ['IEX', 'PXIL', 'EU ETS'], 'India CCC pricing and EU comparison'),

      // ── Tab: Financial Impact ──
      m('company_compliance_cost', 'Company Compliance Cost', 'Shortfall \u00d7 Price + Tech Investment', null, [
        comp('direct_cost', 'Direct Compliance Cost', '\u20b914.4B', null, [
          leaf('ccc_purchase', 'CCC Purchase Cost', '\u20b91.44B', 'BEE / Exchange', 2),
          leaf('tech_invest', 'Technology Investment', '\u20b912.96B', 'Company Plans', 3),
        ]),
        comp('margin_impact', 'Margin Impact', '\u22120.8% EBITDA', null, [
          leaf('cement_margin', 'Cement Sector Impact', '\u22121.2%', 'Analysis', 3),
          leaf('steel_margin', 'Steel Sector Impact', '\u22120.6%', 'Analysis', 3),
        ]),
      ], ['BEE', 'Company Filings'], 'Financial impact of compliance'),

      // ── Tab: CBAM Linkage ──
      m('cbam_offset_value', 'CBAM Offset Value', 'CCC retirement credit against CBAM', null, [
        comp('cbam_eligible', 'CBAM-Eligible CCCs', '0.8M certificates', null, [
          leaf('eligible_sectors', 'Eligible Sectors', 'Steel, Cement, Alu', 'EU CBAM Reg', 1),
        ]),
        comp('net_savings', 'Net Cost Savings', '\u20ac42M', null, [
          leaf('cbam_avoided', 'CBAM Cost Avoided', '\u20ac68M', 'Calculation', 3),
          leaf('ccc_cost_in', 'CCC Purchase Cost', '\u2212\u20ac26M', 'Exchange Price', 2),
        ]),
      ], ['EU CBAM', 'BEE'], 'CBAM offset credit for India exporters'),

      // ── Tab: Calculate ──
      m('net_reduction_calc', 'Net Reduction Calc', 'Baseline \u2212 Project \u2212 Leakage', null, [
        comp('baseline_calc', 'Baseline Emissions', '4.2M tCO\u2082e', null, [
          leaf('baseline_method', 'Methodology', 'BEE PAT', 'BEE', 1),
        ]),
        comp('project_calc', 'Project Emissions', '3.4M tCO\u2082e', null, [
          leaf('project_verified', 'Verified Emissions', '3.4M tCO\u2082e', 'Third Party', 2),
        ]),
        comp('leakage_calc', 'Leakage', '0.1M tCO\u2082e', null, [
          leaf('leakage_pct', 'Leakage %', '2.5%', 'Default Factor', 3),
        ]),
      ], ['BEE', 'ISO 14064'], 'CCC calculation engine'),

      // ── Tab: Assurance ──
      m('assurance_status', 'Assurance Status', 'MRV compliance and ISO status', null, [
        comp('mrv_compliance', 'MRV Compliance', '85%', null, [
          leaf('monitoring_status', 'Monitoring Active', '92%', 'BEE', 2),
          leaf('reporting_status', 'Reporting Submitted', '88%', 'BEE', 2),
          leaf('verification_status_in', 'Verified', '85%', 'Accredited DOE', 2),
        ]),
        comp('iso14064_status', 'ISO 14064 Status', 'Certified', null, [
          leaf('iso_body', 'Certification Body', 'BIS-accredited', 'BIS India', 1),
          leaf('iso_scope', 'Scope', 'ISO 14064-2:2019', 'ISO', 1),
        ]),
      ], ['BEE', 'BIS India', 'ISO'], 'Assurance and MRV status'),
    ],
  },

  '/rbi-climate-risk': {
    moduleCode: 'IN-002', sprint: 'IND',
    metrics: [
      m('crar_climate', 'CRAR Climate-Adjusted', 'Adjusted_Capital / ClimateRWA \u00d7 100', null, [
        comp('rbi_capital', 'RBI Capital Base', null, null, [
          leaf('cet1_rbi', 'CET1 Capital', '\u20b92.4T', 'RBI Pillar 3', 1),
          leaf('tier2_rbi', 'Tier 2 Capital', '\u20b90.8T', 'RBI Pillar 3', 1),
        ]),
        comp('climate_rwa_rbi', 'Climate-Adjusted RWA', '\u20b918.5T', null, [
          leaf('base_rwa_rbi', 'Base RWA', '\u20b916.8T', 'RBI Pillar 3', 1),
          leaf('climate_addon_rbi', 'Climate Addon', '\u20b91.7T', 'Stress Model', 3),
        ]),
      ], ['RBI', 'Basel III India', 'BRSR Core'], 'RBI CRAR with climate overlay'),

      m('brsr_readiness', 'BRSR Readiness', 'Compliance score (9 principles)', null, [
        comp('brsr_env', 'Environmental Principles', '72/100', null, [
          leaf('brsr_p6', 'P6 \u2014 Environment', '75/100', 'Company BRSR', 2),
        ]),
        comp('brsr_social', 'Social Principles', '65/100', null, [
          leaf('brsr_p3', 'P3 \u2014 Employee Wellbeing', '70/100', 'Company BRSR', 2),
        ]),
      ], ['SEBI BRSR', 'MCA India'], 'SEBI BRSR readiness'),

      // ── Tab: NGFS India ──
      m('ngfs_india', 'NGFS India Scenarios', 'India-specific NGFS outputs', null, [
        comp('gdp_impact_in', 'GDP Impact (NZ2050)', '\u22124.2% by 2050', null, [
          leaf('gdp_phys_in', 'Physical GDP Loss', '\u22122.8%', 'NGFS', 2),
          leaf('gdp_trans_in', 'Transition GDP Loss', '\u22121.4%', 'NGFS', 2),
        ]),
        comp('carbon_price_2030_in', 'Carbon Price 2030', '$85/tCO\u2082', null, [
          leaf('ngfs_cp_india', 'NGFS India Path', '$85/t', 'NGFS Phase 5', 2),
        ]),
        comp('portfolio_loss_in', 'Portfolio Loss Scenario', '\u22126.8%', null, [
          leaf('banking_book_loss', 'Banking Book Impact', '\u22124.2%', 'NGFS + IRB', 3),
          leaf('trading_book_loss', 'Trading Book Impact', '\u22122.6%', 'NGFS + FRTB', 3),
        ]),
      ], ['NGFS Phase 5', 'RBI'], 'NGFS India-specific scenario analysis'),

      // ── Tab: Financed Emissions (India) ──
      m('lending_book_fe', 'Lending Book FE', '\u03a3(AF \u00d7 Borrower_Emissions)', null, [
        comp('priority_sector_fe', 'Priority Sector FE', '42M tCO\u2082e', null, [
          leaf('agri_fe', 'Agriculture FE', '18M tCO\u2082e', 'PCAF + NABARD', 3),
          leaf('msme_fe', 'MSME FE', '24M tCO\u2082e', 'PCAF + Activity EF', 4),
        ]),
        comp('corporate_fe_in', 'Corporate Lending FE', '85M tCO\u2082e', null, [
          leaf('power_fe', 'Power Sector', '42M tCO\u2082e', 'CDP + CEA', 2),
          leaf('infra_fe', 'Infrastructure', '28M tCO\u2082e', 'Activity EF', 3),
          leaf('other_corp_fe', 'Other Corporate', '15M tCO\u2082e', 'Revenue Proxy', 4),
        ]),
      ], ['PCAF', 'RBI', 'CEA India'], 'India lending book financed emissions'),

      // ── Tab: Physical Risk (India) ──
      m('state_exposure', 'State-Level Physical Risk', 'Exposure by Indian state', null, [
        comp('high_risk_states', 'High-Risk States', '38% of loan book', null, [
          leaf('maharashtra_risk', 'Maharashtra', 'Flood + Heat', 'IPCC + IMD', 2),
          leaf('wb_risk', 'West Bengal', 'Cyclone + Flood', 'IPCC + IMD', 2),
          leaf('rajasthan_risk', 'Rajasthan', 'Heat + Drought', 'IPCC + IMD', 2),
        ]),
        comp('branch_vulnerability', 'Branch Vulnerability', '12% of branches', null, [
          leaf('coastal_branches', 'Coastal Zone', '8% of branches', 'Asset Register', 2),
          leaf('flood_plain_branches', 'Flood Plain', '4% of branches', 'Asset Register', 2),
        ]),
      ], ['IMD', 'IPCC AR6', 'RBI'], 'India state-level physical risk'),

      // ── Tab: BRSR Core Detail ──
      m('brsr_core_detail', 'BRSR Core Detail', 'SEBI BRSR principle-by-principle', null, [
        comp('brsr_completeness', 'Completeness Score', '78%', null, [
          leaf('essential_complete', 'Essential Indicators', '92%', 'Company BRSR', 2),
          leaf('leadership_complete', 'Leadership Indicators', '65%', 'Company BRSR', 3),
        ]),
        comp('esrs_crosswalk', 'ESRS Crosswalk Mapped', '42%', null, [
          leaf('e1_mapped', 'ESRS E1 Mapped', '85%', 'Crosswalk Analysis', 2),
          leaf('s1_mapped', 'ESRS S1 Mapped', '62%', 'Crosswalk Analysis', 3),
        ]),
        comp('assurance_ready', 'Assurance Readiness', '68%', null, [
          leaf('data_ready', 'Data Readiness', '75%', 'Internal Assessment', 2),
          leaf('process_ready', 'Process Readiness', '62%', 'Internal Assessment', 3),
        ]),
      ], ['SEBI BRSR', 'EFRAG', 'MCA India'], 'BRSR Core compliance detail'),
    ],
  },

  '/sovereign-climate-risk': {
    moduleCode: 'IN-005', sprint: 'IND',
    metrics: [
      m('sov_risk_premium', 'Sovereign Risk Premium', 'CDS \u00d7 (1 + ClimateAdj)', null, [
        comp('base_cds', 'Base CDS Spread', '120 bps', null, [
          leaf('cds_5y', '5yr CDS', '120 bps', 'Bloomberg', 2),
        ]),
        comp('climate_adj_sov', 'Climate Adjustment', '+18 bps', null, [
          leaf('physical_adj', 'Physical Risk Addon', '+12 bps', 'NGFS', 3),
          leaf('transition_adj', 'Transition Risk Addon', '+6 bps', 'NGFS', 3),
        ]),
      ], ['Bloomberg', 'NGFS', 'IMF'], 'Sovereign CDS with climate overlay'),

      m('ndc_gap', 'NDC Gap', 'Pledged \u2212 Current_Trajectory', null, [
        comp('ndc_target', 'NDC Target', '\u221245% by 2030', null, [
          leaf('ndc_pledge', 'Paris NDC Pledge', '\u221245% intensity', 'UNFCCC', 1),
        ]),
        comp('current_traj', 'Current Trajectory', '\u221228% by 2030', null, [
          leaf('hist_trend_ndc', 'Historical Trend', '\u22123.2%/yr', 'IEA', 2),
        ]),
      ], ['UNFCCC', 'Climate Action Tracker'], 'NDC implementation gap'),

      m('fiscal_impact', 'Fiscal Impact', 'Climate cost as % of GDP', null, [
        comp('adaptation_cost', 'Adaptation Cost', '2.4% GDP', null, [
          leaf('infra_adapt', 'Infrastructure', '1.4% GDP', 'UNEP AGR', 2),
        ]),
        comp('loss_damage', 'Loss & Damage', '1.8% GDP', null, [
          leaf('nat_disasters', 'Natural Disaster Cost', '1.2% GDP', 'EM-DAT', 2),
        ]),
      ], ['UNEP', 'World Bank', 'EM-DAT'], 'Fiscal impact of climate'),

      // ── Tab: Stranded GDP ──
      m('stranded_gdp', 'Stranded GDP %', 'Stranded_Assets / GDP \u00d7 100', null, [
        comp('fossil_stranded_sov', 'Fossil Revenue at Risk', '4.2% GDP', null, [
          leaf('oil_rent', 'Oil Rents % GDP', '2.8%', 'World Bank', 1),
          leaf('gas_rent', 'Gas Rents % GDP', '1.4%', 'World Bank', 1),
        ]),
        comp('export_stranded', 'Export Revenue at Risk', '8.5% of exports', null, [
          leaf('fossil_exports', 'Fossil Fuel Exports', '$42B', 'UN Comtrade', 1),
        ]),
      ], ['World Bank', 'Carbon Tracker', 'UN Comtrade'], 'Stranded assets as GDP share'),

      // ── Tab: Debt Sustainability ──
      m('debt_sustainability', 'Debt Sustainability', 'Climate-adjusted debt/GDP path', null, [
        comp('debt_to_gdp', 'Debt/GDP Baseline', '68%', null, [
          leaf('public_debt', 'Public Debt', '$1.2T', 'IMF WEO', 1),
          leaf('gdp_nominal', 'Nominal GDP', '$1.76T', 'IMF WEO', 1),
        ]),
        comp('climate_debt_adj', 'Climate Debt Adjustment', '+4.5% by 2035', null, [
          leaf('adaptation_financing', 'Adaptation Financing Need', '2.4% GDP', 'UNEP AGR', 2),
          leaf('loss_damage_cost', 'Loss & Damage', '1.8% GDP', 'EM-DAT', 2),
        ]),
      ], ['IMF', 'UNEP AGR'], 'Climate debt sustainability analysis'),

      // ── Tab: CDS Decomposition ──
      m('cds_decomposition', 'CDS Spread Decomposition', 'Base CDS + Climate Addon', null, [
        comp('cds_macro', 'Macro Component', '85 bps', null, [
          leaf('fiscal_spread', 'Fiscal Position', '45 bps', 'Bloomberg', 2),
          leaf('external_spread', 'External Vulnerability', '40 bps', 'Bloomberg', 2),
        ]),
        comp('cds_climate', 'Climate Component', '35 bps', null, [
          leaf('physical_spread', 'Physical Risk Spread', '22 bps', 'NGFS', 3),
          leaf('transition_spread', 'Transition Risk Spread', '13 bps', 'NGFS', 3),
        ]),
      ], ['Bloomberg', 'NGFS', 'IMF'], 'CDS spread climate decomposition'),
    ],
  },

  '/sovereign-esg-scorer': {
    moduleCode: 'IN-006', sprint: 'IND',
    metrics: [
      m('composite_score', 'Composite ESG Score', '0.40\u00d7E + 0.30\u00d7S + 0.30\u00d7G', null, [
        comp('env_pillar', 'Environmental Pillar', '52/100', 0.40, [
          leaf('co2_pc', 'CO\u2082 per Capita', '1.9t', 'OWID', 1),
          leaf('renewable_share', 'Renewable Share', '42%', 'IEA', 2),
        ]),
        comp('social_pillar', 'Social Pillar', '58/100', 0.30, [
          leaf('hdi', 'HDI Score', '0.644', 'UNDP', 1),
          leaf('gini', 'Gini Coefficient', '35.7', 'World Bank', 2),
        ]),
        comp('gov_pillar', 'Governance Pillar', '48/100', 0.30, [
          leaf('wgi_voice', 'WGI Voice & Accountability', '0.42', 'World Bank WGI', 1),
          leaf('corruption', 'Corruption Index', '40/100', 'TI CPI', 1),
        ]),
      ], ['OWID', 'UNDP', 'World Bank', 'TI'], 'Sovereign ESG composite'),
    ],
  },

  '/undp-blended-finance': {
    moduleCode: 'IN-007', sprint: 'IND',
    metrics: [
      m('leverage_ratio', 'Leverage Ratio', 'Total_Mobilized / Catalytic_Capital', null, [
        comp('mobilized', 'Total Mobilized', '$4.2B', null, [
          leaf('private_mob', 'Private Capital', '$2.8B', 'UNDP', 2),
          leaf('public_mob', 'Public Co-Investment', '$1.4B', 'MDB Reports', 2),
        ]),
        comp('catalytic', 'Catalytic Capital', '$0.6B', null, [
          leaf('concessional', 'Concessional Capital', '$0.4B', 'UNDP/GCF', 1),
          leaf('guarantees', 'Guarantees/First-Loss', '$0.2B', 'DFI Reports', 2),
        ]),
      ], ['UNDP', 'Convergence', 'GCF'], 'Blended finance leverage'),

      m('impact_metric', 'Impact Metrics', 'IRIS+ aligned indicators', null, [
        comp('climate_impact', 'Climate Impact', null, null, [
          leaf('co2_avoided', 'CO\u2082 Avoided', '2.4M tCO\u2082e/yr', 'Project M&E', 3),
          leaf('re_capacity', 'RE Capacity Installed', '850 MW', 'Project M&E', 2),
        ]),
        comp('social_impact', 'Social Impact', null, null, [
          leaf('jobs_created', 'Jobs Created', '12500', 'Project M&E', 3),
          leaf('beneficiaries', 'Beneficiaries', '2.4M people', 'Project M&E', 3),
        ]),
      ], ['IRIS+', 'UNDP', 'IMP'], 'Impact measurement'),
    ],
  },

  '/just-transition-intelligence': {
    moduleCode: 'IN-009', sprint: 'IND',
    metrics: [
      m('jt_score_india', 'JT Score', '0.30\u00d7Coal + 0.25\u00d7Employ + 0.25\u00d7Social + 0.20\u00d7Policy', null, [
        comp('coal_dep', 'Coal Dependency', '72/100', 0.30, [
          leaf('coal_share_gen', 'Coal % of Generation', '72%', 'CEA India', 1),
        ]),
        comp('employ_impact', 'Employment Impact', '65/100', 0.25, [
          leaf('direct_jobs', 'Direct Coal Jobs', '1.2M', 'Coal India Ltd', 2),
          leaf('indirect_jobs', 'Indirect Jobs', '3.8M', 'ILO Estimate', 3),
        ]),
        comp('social_safety', 'Social Safety Net', '42/100', 0.25, [
          leaf('safety_coverage', 'Social Protection Coverage', '42%', 'World Bank', 2),
        ]),
        comp('policy_framework', 'Policy Framework', '55/100', 0.20, [
          leaf('jt_policy', 'JT Policy Announced', 'Draft Stage', 'MoEFCC', 2),
        ]),
      ], ['CEA India', 'ILO', 'Coal India Ltd'], 'India just transition score'),
    ],
  },

  '/article6-markets': {
    moduleCode: 'IN-010', sprint: 'IND',
    metrics: [
      m('itmo_volume', 'ITMO Volume', 'Total ITMOs under Article 6.2', null, [
        comp('bilateral_itmos', 'Bilateral ITMOs', '42M tCO\u2082e', null, [
          leaf('swiss_bilat', 'Switzerland', '12M', 'UNFCCC', 1),
          leaf('japan_bilat', 'Japan JCM', '18M', 'JCM Registry', 1),
        ]),
        comp('article64_creds', 'Article 6.4 Credits', '8M tCO\u2082e', null, [
          leaf('sb_approved', 'SB Approved', '8M', 'UNFCCC A6.4 SB', 1),
        ]),
      ], ['UNFCCC', 'Article 6 Registry'], 'ITMO volumes under Paris Article 6'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // CROSS-MODULE \u2014 Offsets, Green Bonds, Avoided Emissions, Peers
  // ═══════════════════════════════════════════════════════════════════
  '/offset-portfolio-tracker': {
    moduleCode: 'X-001', sprint: 'CROSS',
    metrics: [
      m('total_tonnes', 'Total Offset Tonnes', '\u03a3 volumes across registries', null, [
        comp('active_credits', 'Active Credits', '2.4M tCO\u2082e', null, [
          leaf('verra_active', 'Verra Active', '1.6M', 'Verra', 1),
          leaf('gs_active', 'GS Active', '0.8M', 'Gold Standard', 1),
        ]),
        comp('retired_credits', 'Retired Credits', '1.8M tCO\u2082e', null, [
          leaf('verra_retired', 'Verra Retired', '1.2M', 'Verra', 1),
        ]),
      ], ['Verra', 'Gold Standard', 'ACR'], 'Offset portfolio tracker'),

      m('mtm_value', 'MTM Value', '\u03a3(Volume \u00d7 Current_Price)', null, [
        comp('nature_mtm', 'Nature-Based MTM', '$18.2M', null, [
          leaf('redd_mtm', 'REDD+ MTM', '$12.4M', 'CBL GEO', 2),
        ]),
        comp('tech_mtm', 'Technology MTM', '$4.5M', null, [
          leaf('biochar_mtm', 'Biochar MTM', '$2.8M', 'Puro.earth', 2),
        ]),
      ], ['CBL GEO', 'Puro.earth'], 'MTM offset valuation'),

      m('quality_score_ot', 'Quality Score', 'Weighted quality across portfolio', null, [
        comp('high_quality', 'High Quality (A/AA)', '42%', null, [
          leaf('bezero_a', 'BeZero A+', '42%', 'BeZero', 2),
        ]),
        comp('low_quality', 'Low Quality (C\u2212)', '12%', null, [
          leaf('bezero_c', 'BeZero C\u2212', '12%', 'BeZero', 2),
        ]),
      ], ['BeZero', 'Sylvera'], 'Offset quality distribution'),
    ],
  },

  '/corporate-offset-optimizer': {
    moduleCode: 'X-002', sprint: 'CROSS',
    metrics: [
      m('procurement_cost', 'Procurement Cost', '\u03a3(Volume \u00d7 Price) by strategy', null, [
        comp('spot_cost', 'Spot Purchases', '$8.5M', null, [
          leaf('spot_vol', 'Spot Volume', '0.85M tCO\u2082e', 'Broker', 2),
        ]),
        comp('offtake_cost', 'Offtake Agreements', '$12.2M', null, [
          leaf('offtake_vol', 'Offtake Volume', '1.4M tCO\u2082e', 'Contracts', 1),
        ]),
      ], ['Internal Procurement', 'CBL GEO'], 'Procurement cost optimization'),

      m('corsia_coverage', 'CORSIA Coverage', 'Eligible / Obligation', null, [
        comp('corsia_eligible', 'CORSIA-Eligible', '1.2M tCO\u2082e', null, [
          leaf('corsia_verra', 'Verra CORSIA', '0.8M', 'Verra', 1),
        ]),
        comp('corsia_obligation', 'CORSIA Obligation', '1.5M tCO\u2082e', null, [
          leaf('baseline_em_co', 'Baseline Emissions', '2.8M tCO\u2082e', 'ICAO', 1),
        ]),
      ], ['ICAO CORSIA', 'Verra'], 'CORSIA compliance coverage'),
    ],
  },

  '/green-bond-portfolio-analytics': {
    moduleCode: 'X-003', sprint: 'CROSS',
    metrics: [
      m('green_bond_pct', 'Green Bond %', 'Green / Total FI AUM \u00d7 100', null, [
        comp('certified_green', 'CBI Certified', '12.4%', null, [
          leaf('cbi_count', 'CBI Count', '42 bonds', 'CBI', 1),
          leaf('cbi_aum', 'CBI AUM', '$1.86B', 'CBI', 1),
        ]),
        comp('self_label', 'Self-Labelled', '8.2%', null, [
          leaf('sl_count', 'Self-Labelled Count', '28 bonds', 'Bloomberg', 2),
        ]),
      ], ['CBI', 'Bloomberg', 'ICMA GBP'], 'Green bond portfolio share'),

      m('use_of_proceeds', 'Use of Proceeds', 'Allocation by ICMA category', null, [
        comp('re_proceeds', 'Renewable Energy', '38%', null, [
          leaf('solar_proceeds', 'Solar Projects', '22%', 'Issuer Reports', 2),
          leaf('wind_proceeds', 'Wind Projects', '16%', 'Issuer Reports', 2),
        ]),
        comp('green_buildings', 'Green Buildings', '28%', null, [
          leaf('cert_buildings', 'Certified Buildings', '28%', 'Issuer Reports', 2),
        ]),
      ], ['ICMA GBP', 'Issuer Impact Reports'], 'Use of proceeds allocation'),

      m('cert_rate', 'Certification Rate', 'CBI_Certified / Total \u00d7 100', null, [
        comp('certified', 'CBI Certified', '42 bonds (60%)', null, [
          leaf('cert_pre', 'Pre-Issuance', '35', 'CBI', 1),
        ]),
        comp('uncertified', 'Not Certified', '28 bonds (40%)', null, [
          leaf('icma_only', 'ICMA GBP Only', '28', 'Issuer Self-Label', 3),
        ]),
      ], ['CBI', 'ICMA'], 'Third-party certification rate'),
    ],
  },

  '/avoided-emissions-portfolio': {
    moduleCode: 'X-004', sprint: 'CROSS',
    metrics: [
      m('avoided_emissions', 'Avoided Emissions', '\u03a3(Baseline \u2212 Project) \u00d7 Attribution', null, [
        comp('re_avoided', 'Renewable Energy Avoided', '4.2M tCO\u2082e', null, [
          leaf('solar_avoided', 'Solar Avoided', '2.4M tCO\u2082e', 'Project Data', 2),
          leaf('wind_avoided', 'Wind Avoided', '1.8M tCO\u2082e', 'Project Data', 2),
        ]),
        comp('efficiency_avoided', 'Efficiency Avoided', '1.8M tCO\u2082e', null, [
          leaf('building_eff', 'Building Efficiency', '1.2M tCO\u2082e', 'Project Data', 3),
        ]),
      ], ['PCAF', 'IFI Harmonized Framework'], 'Avoided emissions attribution'),

      m('sdg_coverage', 'SDG Coverage', 'Number of SDGs addressed', null, [
        comp('climate_sdgs', 'Climate SDGs (7,13)', '85% of portfolio', null, [
          leaf('sdg7', 'SDG 7 Clean Energy', '62%', 'Project M&E', 2),
          leaf('sdg13', 'SDG 13 Climate Action', '85%', 'Project M&E', 2),
        ]),
        comp('co_benefit_sdgs', 'Co-Benefit SDGs', '45%', null, [
          leaf('sdg8', 'SDG 8 Decent Work', '32%', 'Project M&E', 3),
        ]),
      ], ['UNDP', 'IMP'], 'SDG alignment'),
    ],
  },

  '/peer-transition-benchmarker': {
    moduleCode: 'X-005', sprint: 'CROSS',
    metrics: [
      m('peer_rank_metric', 'Peer Rank', 'Percentile within sub-industry', null, [
        comp('transition_rank', 'Transition Score Rank', '72nd percentile', null, [
          leaf('score_self', 'Company Score', '68/100', 'Internal Model', 2),
          leaf('peer_median', 'Peer Median', '52/100', 'CDP/TPI', 2),
        ]),
        comp('disclosure_rank', 'Disclosure Quality Rank', '85th percentile', null, [
          leaf('cdp_score_rank', 'CDP Score', 'A\u2212', 'CDP', 2),
        ]),
      ], ['CDP', 'TPI', 'SBTi'], 'Peer group transition benchmarking'),

      m('transition_gap', 'Transition Gap', 'Best_Practice \u2212 Company_Score', null, [
        comp('targets_gap', 'Targets Gap', '\u221212 pts vs best', null, [
          leaf('company_target', 'Company Target Score', '65/100', 'Model', 2),
        ]),
        comp('actions_gap', 'Actions Gap', '\u221218 pts vs best', null, [
          leaf('company_actions', 'Company Actions Score', '52/100', 'Model', 2),
        ]),
      ], ['TPI', 'SBTi', 'CA100+'], 'Gap to best practice'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // REFERENCE DATA
  // ═══════════════════════════════════════════════════════════════════
  '/ceda-emission-factors': {
    moduleCode: 'R-001', sprint: 'REF',
    metrics: [
      m('avg_ef', 'Avg Emission Factor', 'Mean EF across all sectors', null, [
        comp('energy_ef', 'Energy Sector EFs', '0.85 kgCO\u2082/kWh', null, [
          leaf('coal_ef', 'Coal EF', '1.02 kgCO\u2082/kWh', 'CEA Grid Factors', 1),
          leaf('gas_ef', 'Natural Gas EF', '0.42 kgCO\u2082/kWh', 'CEA Grid Factors', 1),
        ]),
        comp('transport_ef', 'Transport EFs', '2.68 kgCO\u2082/L', null, [
          leaf('diesel_ef', 'Diesel EF', '2.68 kgCO\u2082/L', 'DEFRA', 1),
          leaf('petrol_ef', 'Petrol EF', '2.31 kgCO\u2082/L', 'DEFRA', 1),
        ]),
      ], ['CEDA', 'CEA India', 'DEFRA', 'EPA'], 'Cross-sector EF database'),

      m('country_intensity', 'Country Grid Intensity', 'National grid EF', null, [
        comp('india_grid', 'India Grid', '0.72 kgCO\u2082/kWh', null, [
          leaf('cea_factor', 'CEA Factor', '0.72', 'CEA India 2024', 1),
        ]),
        comp('eu_grid', 'EU Average', '0.28 kgCO\u2082/kWh', null, [
          leaf('eea_factor', 'EEA Factor', '0.28', 'EEA 2024', 1),
        ]),
        comp('us_grid', 'US Average', '0.39 kgCO\u2082/kWh', null, [
          leaf('epa_factor', 'EPA eGRID', '0.39', 'EPA eGRID 2024', 1),
        ]),
      ], ['CEA India', 'EEA', 'EPA eGRID'], 'National grid EF comparison'),
    ],
  },

  '/big-climate-database': {
    moduleCode: 'R-002', sprint: 'REF',
    metrics: [
      m('avg_food_ef', 'Avg Food EF', 'Mean kgCO\u2082e per kg', null, [
        comp('animal_ef', 'Animal Products', '12.4 kgCO\u2082e/kg', null, [
          leaf('beef_ef', 'Beef', '27.0 kgCO\u2082e/kg', 'Poore & Nemecek 2018', 1),
          leaf('dairy_ef', 'Dairy', '3.2 kgCO\u2082e/kg', 'Poore & Nemecek 2018', 1),
        ]),
        comp('plant_ef', 'Plant Products', '1.8 kgCO\u2082e/kg', null, [
          leaf('grain_ef', 'Grains', '1.4 kgCO\u2082e/kg', 'Poore & Nemecek 2018', 1),
          leaf('veg_ef', 'Vegetables', '2.0 kgCO\u2082e/kg', 'Poore & Nemecek 2018', 1),
        ]),
      ], ['Poore & Nemecek 2018', 'OWID'], 'Food system emission factors'),
    ],
  },

  '/reference-data-explorer': {
    moduleCode: 'R-003', sprint: 'REF',
    metrics: [
      m('total_records', 'Total Records', 'Count of all reference data records', null, [
        comp('ef_records', 'Emission Factor Records', '12450', null, [
          leaf('defra_records', 'DEFRA EFs', '4200', 'DEFRA', 1),
          leaf('epa_records', 'EPA EFs', '3800', 'EPA', 1),
          leaf('ipcc_records', 'IPCC EFs', '4450', 'IPCC', 1),
        ]),
        comp('country_records', 'Country Data Records', '8200', null, [
          leaf('owid_records', 'OWID Records', '5400', 'OWID', 1),
          leaf('wb_records', 'World Bank Records', '2800', 'World Bank', 1),
        ]),
      ], ['DEFRA', 'EPA', 'IPCC', 'OWID'], 'Reference data coverage'),
    ],
  },

  '/data-capture-hub': {
    moduleCode: 'R-004', sprint: 'REF',
    metrics: [
      m('entities_captured', 'Entities Captured', 'Total entities in pipeline', null, [
        comp('companies_cap', 'Companies', '2450', null, [
          leaf('listed_co', 'Listed Companies', '1800', 'CDP/Bloomberg', 2),
          leaf('private_co', 'Private Companies', '650', 'Company Reports', 3),
        ]),
        comp('assets_cap', 'Assets', '18500', null, [
          leaf('real_estate_cap', 'Real Estate Assets', '12000', 'CRREM', 3),
          leaf('infra_assets', 'Infrastructure', '6500', 'Asset Register', 2),
        ]),
      ], ['Platform Pipeline'], 'Data capture pipeline'),

      m('validation_rate', 'Validation Rate', 'Validated / Total \u00d7 100', null, [
        comp('auto_valid', 'Auto-Validated', '82%', null, [
          leaf('schema_pass', 'Schema Validation', '95%', 'Pipeline', 1),
        ]),
        comp('manual_valid', 'Manual Review', '18%', null, [
          leaf('flagged', 'Flagged for Review', '420 records', 'Pipeline', 2),
        ]),
      ], ['Internal QA Pipeline'], 'Data validation rate'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // COMPLIANCE & DISCLOSURE — CSRD / ISSB / SFDR (8 modules)
  // ═══════════════════════════════════════════════════════════════════
  '/csrd-readiness': {
    moduleCode: 'CD-001', sprint: 'DISCLOSURE',
    metrics: [
      m('csrd_readiness_pct', 'CSRD Readiness %', 'Completed_Requirements / Total_Requirements × 100', null, [
        comp('dma_complete', 'DMA Completion', '72%', 0.30, [
          comp('impact_mat_done', 'Impact Materiality Complete', '85%', null, [
            leaf('iro_identified', 'IROs Identified', '142', 'Internal DMA Workshop', 2),
            leaf('stakeholder_engaged', 'Stakeholders Engaged', '28 groups', 'Internal Records', 2),
            leaf('value_chain_mapped', 'Value Chain Mapped', '6 tiers', 'Supply Chain DB', 3),
          ]),
          comp('financial_mat_done', 'Financial Materiality Complete', '62%', null, [
            leaf('risk_quantified', 'Risks Quantified ($)', '18 of 24', 'Risk Register', 2),
            leaf('opp_quantified', 'Opportunities Quantified', '12 of 18', 'Strategy Team', 3),
          ]),
        ]),
        comp('esrs_coverage', 'ESRS Data Coverage', '58%', 0.40, [
          comp('e_standards', 'Environmental Standards (E1-E5)', '64%', null, [
            leaf('e1_ghg', 'E1 Climate (GHG Data)', '82%', 'GHG Protocol', 1),
            leaf('e2_pollution', 'E2 Pollution', '45%', 'EHS System', 2),
            leaf('e3_water', 'E3 Water & Marine', '52%', 'Water Monitoring', 2),
          ]),
          comp('s_standards', 'Social Standards (S1-S4)', '48%', null, [
            leaf('s1_workforce', 'S1 Own Workforce', '68%', 'HR System', 1),
            leaf('s2_vc_workers', 'S2 VC Workers', '32%', 'Supplier Surveys', 4),
          ]),
          comp('g_standards', 'Governance Standards (G1)', '72%', null, [
            leaf('g1_conduct', 'G1 Business Conduct', '72%', 'Compliance DB', 2),
          ]),
        ]),
        comp('data_gap_count', 'Data Gap Count', '186 gaps', 0.30, [
          comp('critical_gaps', 'Critical Gaps (P0)', '24', null, [
            leaf('scope3_gaps', 'Scope 3 Category Gaps', '8', 'Carbon Audit', 3),
            leaf('biodiv_gaps', 'Biodiversity Gaps', '6', 'TNFD Assessment', 4),
            leaf('vc_gaps', 'Value Chain Data Gaps', '10', 'Supplier Platform', 4),
          ]),
          comp('moderate_gaps', 'Moderate Gaps (P1)', '68', null, [
            leaf('social_gaps', 'Social Metric Gaps', '42', 'HR/CSR Teams', 3),
            leaf('gov_gaps', 'Governance Metric Gaps', '26', 'Legal/Compliance', 2),
          ]),
        ]),
      ], ['EFRAG ESRS', 'EU CSRD Directive 2022/2464', 'Internal DMA'], 'CSRD readiness assessment'),
    ],
  },

  '/csrd-esrs-automation': {
    moduleCode: 'CD-002', sprint: 'DISCLOSURE',
    metrics: [
      m('auto_tagged', 'Auto-Tagged Data Points', 'NLP_Tagged / Total_Required × 100', null, [
        comp('env_tagged', 'Environmental Data Points', '1,842 tagged', 0.40, [
          comp('e1_auto', 'E1 Climate Auto-Tagged', '412', null, [
            leaf('ghg_auto', 'GHG Inventory Records', '285', 'GHG Protocol Registry', 1),
            leaf('energy_auto', 'Energy Consumption Records', '127', 'EMS System', 1),
          ]),
          comp('e2_e5_auto', 'E2-E5 Auto-Tagged', '1,430', null, [
            leaf('pollution_auto', 'Pollution Records', '382', 'EHS Database', 2),
            leaf('water_auto', 'Water Records', '248', 'Metering System', 2),
            leaf('biodiv_auto', 'Biodiversity Records', '800', 'Site Surveys', 3),
          ]),
        ]),
        comp('social_tagged', 'Social Data Points', '2,156 tagged', 0.35, [
          comp('s1_auto', 'S1 Workforce Auto-Tagged', '1,240', null, [
            leaf('hr_records', 'HR System Records', '980', 'Workday/SAP HR', 1),
            leaf('health_safety', 'H&S Incident Records', '260', 'EHS Platform', 1),
          ]),
          comp('s2_s4_auto', 'S2-S4 Auto-Tagged', '916', null, [
            leaf('supplier_data', 'Supplier Survey Data', '516', 'Procurement Platform', 3),
            leaf('community_data', 'Community Impact Data', '400', 'CSR Reports', 3),
          ]),
        ]),
        comp('gov_tagged', 'Governance Data Points', '648 tagged', 0.25, [
          leaf('board_data', 'Board Composition', '82', 'Corporate Secretary', 1),
          leaf('ethics_data', 'Ethics & Compliance', '566', 'Legal/Compliance DB', 2),
        ]),
      ], ['EFRAG ESRS', 'NLP Engine', 'Internal Data Lake'], 'ESRS auto-tagging coverage'),

      m('esrs_mapping_pct', 'ESRS Mapping %', 'Mapped_DPs / Total_DPs × 100', null, [
        comp('cross_cutting', 'Cross-Cutting Standards', '88%', null, [
          leaf('esrs2_mapped', 'ESRS 2 General Disclosures', '92%', 'EFRAG ESRS 2', 1),
          leaf('esrs1_mapped', 'ESRS 1 General Requirements', '84%', 'EFRAG ESRS 1', 1),
        ]),
        comp('topical_mapped', 'Topical Standards Mapped', '68%', null, [
          leaf('env_mapped', 'E1-E5 Mapped', '72%', 'EFRAG Env Standards', 2),
          leaf('social_mapped', 'S1-S4 Mapped', '64%', 'EFRAG Social Standards', 2),
        ]),
      ], ['EFRAG ESRS Set 1', 'XBRL Taxonomy'], 'ESRS disclosure requirement mapping'),

      m('evidence_complete', 'Evidence Completeness', 'Evidenced_DPs / Required_DPs × 100', null, [
        comp('doc_evidence', 'Documentary Evidence', '74%', null, [
          leaf('policy_docs', 'Policy Documents', '82%', 'Document Management', 1),
          leaf('third_party', 'Third-Party Assurance', '48%', 'Assurance Providers', 1),
        ]),
        comp('data_evidence', 'Quantitative Evidence', '62%', null, [
          leaf('metered_data', 'Metered/Measured Data', '78%', 'IoT/Metering', 1),
          leaf('estimated_data', 'Estimated/Modeled Data', '46%', 'Internal Models', 4),
        ]),
      ], ['IAASB ISSA 5000', 'EFRAG IG'], 'Evidence trail completeness'),
    ],
  },

  '/csrd-dma': {
    moduleCode: 'CD-003', sprint: 'DISCLOSURE',
    metrics: [
      m('impact_mat_score', 'Impact Materiality Score', 'Severity × Likelihood weighted across IROs', null, [
        comp('env_impact', 'Environmental Impact', '78/100', 0.40, [
          comp('climate_impact', 'Climate Change Impact', '88/100', null, [
            leaf('ghg_severity', 'GHG Emission Severity', '92/100', 'CDP Disclosure', 1),
            leaf('transition_likelihood', 'Transition Risk Likelihood', '85/100', 'NGFS Scenarios', 2),
            leaf('adaptation_need', 'Adaptation Need Score', '78/100', 'Physical Risk Model', 3),
          ]),
          comp('biodiv_impact', 'Biodiversity Impact', '65/100', null, [
            leaf('land_use_sev', 'Land Use Severity', '72/100', 'TNFD Assessment', 3),
            leaf('species_risk', 'Species Risk Score', '58/100', 'IBAT/IUCN', 2),
          ]),
        ]),
        comp('social_impact', 'Social Impact', '62/100', 0.35, [
          comp('workforce_impact', 'Own Workforce Impact', '68/100', null, [
            leaf('safety_incidents', 'Safety Incident Rate', 'LTIR 1.2', 'EHS System', 1),
            leaf('living_wage', 'Living Wage Gap', '8%', 'HR Analytics', 2),
          ]),
          comp('community_impact', 'Community Impact', '55/100', null, [
            leaf('local_employment', 'Local Employment Share', '42%', 'HR System', 2),
            leaf('community_invest', 'Community Investment', '$2.4M', 'CSR Budget', 2),
          ]),
        ]),
        comp('gov_impact', 'Governance Impact', '72/100', 0.25, [
          leaf('corruption_risk', 'Corruption Risk Score', '28/100', 'TI CPI + Internal', 2),
          leaf('lobbying_spend', 'Political/Lobbying Spend', '$1.2M', 'Lobbying Disclosures', 1),
        ]),
      ], ['EFRAG ESRS 1 (IRO-1)', 'CSRD Art. 29a'], 'Double materiality — impact assessment'),

      m('financial_mat_score', 'Financial Materiality Score', 'Financial_Effect × Probability weighted', null, [
        comp('risk_financial', 'Financial Risks', '68/100', 0.55, [
          comp('transition_fin', 'Transition Financial Risk', '74/100', null, [
            leaf('carbon_cost_risk', 'Carbon Cost Exposure', '$42M/yr', 'Carbon Pricing Model', 3),
            leaf('stranded_risk_dma', 'Stranded Asset Risk', '$180M', 'Asset Valuation', 3),
          ]),
          comp('physical_fin', 'Physical Financial Risk', '62/100', null, [
            leaf('flood_fin_risk', 'Flood Damage Exposure', '$28M', 'Cat Model', 3),
            leaf('supply_disruption', 'Supply Chain Disruption', '$15M', 'SC Risk Model', 4),
          ]),
        ]),
        comp('opp_financial', 'Financial Opportunities', '58/100', 0.45, [
          leaf('green_revenue', 'Green Revenue Potential', '$120M', 'Strategy Team', 4),
          leaf('efficiency_savings', 'Efficiency Savings', '$18M/yr', 'Engineering', 3),
        ]),
      ], ['EFRAG ESRS 1 (IRO-2)', 'IAS 36/37'], 'Double materiality — financial assessment'),

      m('topic_prioritization', 'Topic Prioritization', 'Ranked material topics from DMA', null, [
        comp('material_topics', 'Material Topics (Top 10)', '10 of 42 IROs', null, [
          leaf('e1_material', 'E1 Climate Change', '#1 Priority', 'DMA Workshop', 2),
          leaf('s1_material', 'S1 Own Workforce', '#2 Priority', 'DMA Workshop', 2),
          leaf('e3_material', 'E3 Water Resources', '#3 Priority', 'DMA Workshop', 2),
        ]),
        comp('non_material', 'Non-Material Topics', '32 of 42 IROs', null, [
          leaf('phase_in_topics', 'Phase-In Eligible', '8 topics', 'EFRAG Phase-In', 1),
          leaf('excluded_topics', 'Excluded After DMA', '24 topics', 'DMA Output', 2),
        ]),
      ], ['EFRAG IG-1', 'CSRD Delegated Act'], 'Material topic ranking'),
    ],
  },

  '/issb-disclosure': {
    moduleCode: 'CD-004', sprint: 'DISCLOSURE',
    metrics: [
      m('s1_coverage', 'IFRS S1 Coverage %', 'Disclosed_Requirements / Total_S1_Requirements × 100', null, [
        comp('governance_s1', 'Governance Disclosures', '82%', null, [
          leaf('board_oversight', 'Board Oversight Disclosed', 'Yes', 'Board Minutes', 1),
          leaf('mgmt_role', 'Management Role Disclosed', 'Yes', 'Org Chart', 1),
        ]),
        comp('strategy_s1', 'Strategy Disclosures', '68%', null, [
          leaf('risks_opps', 'Risks & Opportunities', '14 of 18', 'Risk Register', 2),
          leaf('business_model', 'Business Model Impact', '72%', 'Strategy Team', 3),
          leaf('financial_impact', 'Financial Impact Estimates', '58%', 'Finance Team', 3),
        ]),
        comp('risk_mgmt_s1', 'Risk Management Disclosures', '74%', null, [
          leaf('process_described', 'Process Description', '80%', 'ERM Framework', 2),
          leaf('integration_erm', 'ERM Integration', '68%', 'Risk Committee', 2),
        ]),
        comp('metrics_s1', 'Metrics & Targets', '55%', null, [
          leaf('cross_industry', 'Cross-Industry Metrics', '72%', 'Sustainability Report', 2),
          leaf('industry_specific', 'Industry-Specific Metrics', '38%', 'SASB Standards', 3),
        ]),
      ], ['IFRS S1', 'ISSB Application Guidance'], 'IFRS S1 General Requirements coverage'),

      m('s2_climate', 'IFRS S2 Climate Metrics', 'Climate metric completeness score', null, [
        comp('ghg_s2', 'GHG Emissions (S2 para 29)', '88%', null, [
          leaf('scope1_s2', 'Scope 1 Disclosed', '100%', 'GHG Protocol', 1),
          leaf('scope2_s2', 'Scope 2 (Loc+Mkt)', '100%', 'GHG Protocol', 1),
          leaf('scope3_s2', 'Scope 3 Categories', '65%', 'GHG Protocol', 3),
        ]),
        comp('transition_s2', 'Transition Plan (S2 para 14)', '52%', null, [
          leaf('targets_sbti', 'SBTi-Aligned Targets', 'Committed', 'SBTi', 2),
          leaf('capex_plan', 'Climate CapEx Plan', '$280M', 'Finance Team', 2),
        ]),
        comp('resilience_s2', 'Climate Resilience (S2 para 22)', '45%', null, [
          leaf('scenario_quant', 'Quantitative Scenario Analysis', '1 of 3', 'NGFS/IEA', 3),
          leaf('adaptation_plan', 'Adaptation Strategy', 'Partial', 'Risk Team', 3),
        ]),
      ], ['IFRS S2', 'GHG Protocol', 'SBTi'], 'IFRS S2 Climate-Related Disclosures'),

      m('scenario_completeness', 'Scenario Analysis Completeness', 'Scenarios_Analyzed / Required × 100', null, [
        comp('transition_scenarios', 'Transition Scenarios', '2 of 3', null, [
          leaf('nze_scenario', 'Net Zero 2050 (IEA NZE)', 'Complete', 'IEA WEO', 2),
          leaf('aps_scenario', 'Announced Pledges (APS)', 'Complete', 'IEA WEO', 2),
          leaf('steps_scenario', 'STEPS Scenario', 'In Progress', 'IEA WEO', 3),
        ]),
        comp('physical_scenarios', 'Physical Scenarios', '1 of 2', null, [
          leaf('rcp26', 'RCP 2.6 / SSP1-2.6', 'Complete', 'IPCC AR6', 2),
          leaf('rcp85', 'RCP 8.5 / SSP5-8.5', 'Not Started', 'IPCC AR6', 5),
        ]),
      ], ['IFRS S2 para 22', 'IEA WEO', 'IPCC AR6'], 'Scenario analysis completeness'),
    ],
  },

  '/issb-materiality': {
    moduleCode: 'CD-005', sprint: 'DISCLOSURE',
    metrics: [
      m('industry_metrics', 'Industry-Specific Metrics', 'SASB-aligned metrics by industry', null, [
        comp('sector_metrics', 'Sector-Specific Disclosures', '18 of 26', null, [
          comp('energy_mgmt', 'Energy Management Metrics', '5 of 6', null, [
            leaf('total_energy', 'Total Energy Consumed', '2.4M GJ', 'EMS System', 1),
            leaf('grid_pct', 'Grid Electricity %', '62%', 'Utility Bills', 1),
            leaf('renewable_pct_issb', 'Renewable Energy %', '38%', 'PPA Certificates', 1),
          ]),
          comp('water_mgmt', 'Water Management Metrics', '4 of 5', null, [
            leaf('water_withdrawn', 'Water Withdrawn', '8.2M m\u00b3', 'Water Meters', 1),
            leaf('water_stress_pct', 'High-Stress Area %', '28%', 'WRI Aqueduct', 2),
          ]),
          comp('waste_metrics', 'Waste & Hazardous Metrics', '3 of 4', null, [
            leaf('haz_waste', 'Hazardous Waste', '12,400 t', 'Waste Manifests', 1),
            leaf('recycling_rate', 'Recycling Rate', '42%', 'Waste Reports', 2),
          ]),
        ]),
        comp('activity_metrics', 'Activity Metrics', '6 of 8', null, [
          leaf('revenue_activity', 'Revenue', '$4.2B', '10-K Filing', 1),
          leaf('employees_count', 'Number of Employees', '28,500', 'HR System', 1),
          leaf('production_vol', 'Production Volume', '1.8M units', 'MES System', 1),
        ]),
      ], ['SASB Standards', 'IFRS S1 Appendix B'], 'Industry-specific metric coverage'),

      m('sasb_alignment', 'SASB Alignment Score', 'Aligned_Topics / Total_SASB_Topics × 100', null, [
        comp('quantitative_align', 'Quantitative Metrics Aligned', '72%', null, [
          leaf('ghg_align', 'GHG Metrics Aligned', '92%', 'SASB Climate', 1),
          leaf('resource_align', 'Resource Efficiency Aligned', '68%', 'SASB Resource', 2),
          leaf('human_cap_align', 'Human Capital Aligned', '56%', 'SASB HC', 2),
        ]),
        comp('qualitative_align', 'Qualitative Disclosures Aligned', '58%', null, [
          leaf('policy_align', 'Policy Descriptions', '65%', 'SASB Governance', 2),
          leaf('mgmt_approach', 'Management Approach', '52%', 'SASB General', 3),
        ]),
      ], ['SASB Standards (77 industries)', 'ISSB-SASB Interop'], 'SASB alignment scoring'),
    ],
  },

  '/sfdr-classification': {
    moduleCode: 'CD-006', sprint: 'DISCLOSURE',
    metrics: [
      m('art8_pct', 'Article 8 Holdings %', 'Art8_AUM / Total_AUM × 100', null, [
        comp('art8_environmental', 'Art 8 Environmental Promo', '42%', null, [
          comp('climate_promo', 'Climate Promotion Funds', '28%', null, [
            leaf('low_carbon', 'Low Carbon Strategies', '$2.8B', 'Fund Docs', 2),
            leaf('transition_funds', 'Transition Funds', '$1.4B', 'Fund Docs', 2),
          ]),
          comp('env_promo', 'Environmental Promotion', '14%', null, [
            leaf('water_funds', 'Water/Circular Economy', '$0.8B', 'Fund Docs', 2),
            leaf('biodiv_funds_sfdr', 'Biodiversity Funds', '$0.6B', 'Fund Docs', 2),
          ]),
        ]),
        comp('art8_social', 'Art 8 Social Promo', '8%', null, [
          leaf('social_aum', 'Social Theme AUM', '$0.8B', 'Fund Docs', 2),
        ]),
      ], ['SFDR Level 1 Art 8', 'RTS Annex II'], 'Article 8 fund classification'),

      m('art9_pct', 'Article 9 Holdings %', 'Art9_AUM / Total_AUM × 100', null, [
        comp('art9_climate', 'Art 9 Climate Objective', '12%', null, [
          leaf('pab_funds', 'Paris-Aligned Benchmark', '$0.8B', 'EU BMR', 1),
          leaf('ctb_funds', 'Climate Transition Benchmark', '$0.4B', 'EU BMR', 1),
        ]),
        comp('art9_sustainable', 'Art 9 Sustainable Investment', '6%', null, [
          leaf('impact_funds', 'Impact Funds', '$0.6B', 'Fund Prospectus', 2),
        ]),
      ], ['SFDR Level 1 Art 9', 'EU BMR'], 'Article 9 fund classification'),

      m('taxonomy_align_sfdr', 'EU Taxonomy Alignment', 'Taxonomy_Eligible_Revenue / Total × 100', null, [
        comp('climate_mitigation', 'CC Mitigation Aligned', '22%', null, [
          leaf('sc_pass', 'Substantial Contribution Pass', '28%', 'EU Taxonomy', 2),
          leaf('dnsh_pass_tm', 'DNSH Pass Rate', '82%', 'EU Taxonomy', 2),
          leaf('mss_pass', 'Minimum Safeguards Pass', '95%', 'UNGP/OECD', 2),
        ]),
        comp('climate_adapt', 'CC Adaptation Aligned', '8%', null, [
          leaf('adapt_sc', 'Adaptation SC Pass', '12%', 'EU Taxonomy', 3),
          leaf('adapt_dnsh', 'Adaptation DNSH Pass', '78%', 'EU Taxonomy', 3),
        ]),
      ], ['EU Taxonomy Regulation', 'SFDR RTS Annex III'], 'Taxonomy alignment rate'),

      m('dnsh_score_sfdr', 'DNSH Score', 'Weighted DNSH pass rate across 6 objectives', null, [
        comp('dnsh_env_obj', 'Environmental DNSH', '82%', null, [
          leaf('dnsh_water_obj', 'Water DNSH', '88%', 'EU Taxonomy TR', 2),
          leaf('dnsh_circular', 'Circular Economy DNSH', '78%', 'EU Taxonomy TR', 2),
          leaf('dnsh_pollution', 'Pollution DNSH', '80%', 'EU Taxonomy TR', 2),
        ]),
        comp('dnsh_biodiv_obj', 'Biodiversity DNSH', '75%', null, [
          leaf('dnsh_ecosystems', 'Ecosystems DNSH', '75%', 'EU Taxonomy TR', 3),
        ]),
      ], ['EU Taxonomy TR', 'Platform on Sustainable Finance'], 'Do No Significant Harm assessment'),
    ],
  },

  '/sfdr-v2': {
    moduleCode: 'CD-007', sprint: 'DISCLOSURE',
    metrics: [
      m('pai_completeness', 'PAI Statement Completeness', 'Disclosed_PAIs / 18_Mandatory × 100', null, [
        comp('mandatory_env', 'Mandatory Environmental PAIs', '14 of 14', null, [
          comp('ghg_pais', 'GHG PAIs (1-6)', '6 of 6', null, [
            leaf('pai1_ghg_scope', 'PAI-1 GHG Scope 1/2/3', 'Complete', 'GHG Protocol', 1),
            leaf('pai2_footprint', 'PAI-2 Carbon Footprint', 'Complete', 'PCAF', 2),
            leaf('pai3_intensity', 'PAI-3 GHG Intensity', 'Complete', 'PCAF', 2),
          ]),
          comp('biodiv_pais', 'Biodiversity PAIs (7-8)', '2 of 2', null, [
            leaf('pai7_biodiv', 'PAI-7 Biodiversity Impact', 'Complete', 'IBAT', 3),
            leaf('pai8_water_pai', 'PAI-8 Water Emissions', 'Complete', 'CDP Water', 2),
          ]),
          comp('waste_energy_pais', 'Waste/Energy PAIs (9-14)', '6 of 6', null, [
            leaf('pai9_haz_waste', 'PAI-9 Hazardous Waste', 'Complete', 'Waste Reports', 2),
            leaf('pai14_ff_exp', 'PAI-14 Fossil Fuel Exposure', 'Complete', 'Bloomberg', 1),
          ]),
        ]),
        comp('mandatory_social', 'Mandatory Social PAIs', '4 of 4', null, [
          leaf('pai10_ungc', 'PAI-10 UNGC Violations', 'Complete', 'UNGC DB', 2),
          leaf('pai11_gender_pay', 'PAI-11 Gender Pay Gap', 'Complete', 'HR Analytics', 2),
          leaf('pai12_board_gender', 'PAI-12 Board Gender', 'Complete', 'Annual Report', 1),
          leaf('pai13_weapons', 'PAI-13 Controversial Weapons', 'Complete', 'MSCI ESG', 1),
        ]),
      ], ['SFDR RTS Annex I', 'EC Delegated Regulation 2022/1288'], 'PAI statement completeness'),

      m('sustainability_risk', 'Sustainability Risk Integration', 'Integration score across processes', null, [
        comp('risk_id', 'Risk Identification', '78%', null, [
          comp('physical_risk_int', 'Physical Risk Integration', '82%', null, [
            leaf('flood_screen', 'Flood Risk Screening', 'Active', 'Munich Re NATHAN', 2),
            leaf('heat_screen', 'Heat Stress Screening', 'Active', 'Copernicus', 2),
          ]),
          comp('transition_risk_int', 'Transition Risk Integration', '74%', null, [
            leaf('carbon_screen', 'Carbon Risk Screening', 'Active', 'CDP/TPI', 2),
            leaf('policy_screen', 'Policy Risk Screening', 'Active', 'Grantham LSE', 3),
          ]),
        ]),
        comp('risk_monitoring', 'Risk Monitoring', '72%', null, [
          leaf('portfolio_monitor', 'Portfolio-Level Monitoring', 'Monthly', 'Internal Risk', 2),
          leaf('engagement_track', 'Engagement Tracking', 'Quarterly', 'Stewardship', 2),
        ]),
        comp('remuneration_link', 'Remuneration Integration', '45%', null, [
          leaf('kpi_linked', 'ESG KPIs in Remuneration', '2 of 5', 'Proxy Statement', 1),
        ]),
      ], ['SFDR Art 3-5', 'EBA Guidelines'], 'Sustainability risk integration'),
    ],
  },

  '/csrd-xbrl': {
    moduleCode: 'CD-008', sprint: 'DISCLOSURE',
    metrics: [
      m('tagged_dps', 'Tagged Data Points', 'Total XBRL-tagged disclosure data points', null, [
        comp('block_tags', 'Block Tags', '842', null, [
          comp('narrative_blocks', 'Narrative Disclosures', '624', null, [
            leaf('policy_blocks', 'Policy Descriptions', '186', 'ESRS XBRL Taxonomy', 2),
            leaf('mgmt_blocks', 'Management Approach', '212', 'ESRS XBRL Taxonomy', 2),
            leaf('strategy_blocks', 'Strategy Disclosures', '226', 'ESRS XBRL Taxonomy', 2),
          ]),
          comp('table_blocks', 'Tabular Disclosures', '218', null, [
            leaf('ghg_tables', 'GHG Tables', '42', 'ESRS XBRL Taxonomy', 1),
            leaf('target_tables', 'Target Tables', '28', 'ESRS XBRL Taxonomy', 2),
          ]),
        ]),
        comp('detail_tags', 'Detail Tags', '3,420', null, [
          comp('monetary_tags', 'Monetary Values', '680', null, [
            leaf('capex_tags', 'CapEx Tags', '124', 'EU Taxonomy Art 8', 1),
            leaf('opex_tags', 'OpEx Tags', '98', 'EU Taxonomy Art 8', 1),
          ]),
          comp('numeric_tags', 'Non-Monetary Numeric', '1,840', null, [
            leaf('ghg_numeric', 'GHG Numeric Tags', '420', 'GHG Protocol', 1),
            leaf('social_numeric', 'Social Numeric Tags', '680', 'ESRS S1-S4', 2),
          ]),
        ]),
      ], ['EFRAG ESRS XBRL Taxonomy', 'ESEF RTS'], 'XBRL tagging coverage'),

      m('validation_errors', 'XBRL Validation Errors', 'Errors detected in validation run', null, [
        comp('fatal_errors', 'Fatal Errors', '0', null, [
          leaf('schema_errors', 'Schema Validation Errors', '0', 'XBRL Validator', 1),
          leaf('calc_errors', 'Calculation Linkbase Errors', '0', 'XBRL Validator', 1),
        ]),
        comp('warnings_xbrl', 'Warnings', '14', null, [
          leaf('missing_context', 'Missing Context Warnings', '6', 'XBRL Validator', 1),
          leaf('type_mismatch', 'Type Mismatch Warnings', '8', 'XBRL Validator', 1),
        ]),
      ], ['XBRL International', 'ESEF Conformance Suite'], 'XBRL validation results'),

      m('filing_readiness', 'Filing Readiness %', 'Compliant_Elements / Total_Required × 100', null, [
        comp('content_ready', 'Content Completeness', '88%', null, [
          leaf('mandatory_disc', 'Mandatory Disclosures', '94%', 'ESRS Standards', 2),
          leaf('voluntary_disc', 'Voluntary Disclosures', '42%', 'ESRS Standards', 3),
        ]),
        comp('technical_ready', 'Technical Readiness', '92%', null, [
          leaf('taxonomy_ver', 'Taxonomy Version Current', 'v1.2', 'EFRAG', 1),
          leaf('inline_xbrl', 'Inline XBRL Generated', 'Yes', 'iXBRL Engine', 1),
        ]),
      ], ['ESRS Filing Guidance', 'National Competent Authority'], 'Filing readiness score'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // CARBON & OFFSETS (6 modules)
  // ═══════════════════════════════════════════════════════════════════
  '/offset-permanence-risk': {
    moduleCode: 'CO-001', sprint: 'CARBON',
    metrics: [
      m('avg_permanence', 'Avg Permanence Years', 'Weighted avg expected permanence across portfolio', null, [
        comp('nature_permanence', 'Nature-Based Permanence', '42 yrs', null, [
          comp('redd_permanence', 'REDD+ Permanence', '35 yrs', null, [
            leaf('redd_baseline', 'Baseline Crediting Period', '30 yrs', 'Verra VCS', 1),
            leaf('redd_extension', 'Extension Probability', '45%', 'Registry Data', 2),
            leaf('redd_fire_adj', 'Fire Risk Adjustment', '-5 yrs', 'Satellite Monitoring', 2),
          ]),
          comp('arr_permanence', 'ARR Permanence', '55 yrs', null, [
            leaf('arr_growth', 'Forest Growth Projection', '60 yrs', 'Growth Models', 3),
            leaf('arr_risk_adj', 'Non-Permanence Adj', '-5 yrs', 'Buffer Pool', 2),
          ]),
        ]),
        comp('tech_permanence', 'Technology Permanence', '1000+ yrs', null, [
          leaf('dac_permanence', 'DAC Storage', '10000+ yrs', 'Geologic Assessment', 2),
          leaf('biochar_perm', 'Biochar Permanence', '500+ yrs', 'Lab Analysis', 2),
          leaf('enhanced_weath', 'Enhanced Weathering', '10000+ yrs', 'Geochemistry', 3),
        ]),
      ], ['Verra VCS', 'Gold Standard', 'Puro.earth'], 'Permanence duration assessment'),

      m('reversal_prob', 'Reversal Probability', 'P(reversal) by risk category', null, [
        comp('natural_reversal', 'Natural Risk Reversal', '12%', null, [
          leaf('fire_reversal', 'Fire Risk', '8%', 'Satellite/Fire DB', 2),
          leaf('pest_reversal', 'Pest/Disease Risk', '4%', 'Forest Health DB', 3),
        ]),
        comp('human_reversal', 'Anthropogenic Reversal', '6%', null, [
          leaf('encroachment', 'Land Encroachment', '4%', 'Satellite', 2),
          leaf('policy_reversal', 'Policy/Governance Risk', '2%', 'Country Risk', 3),
        ]),
      ], ['Verra AFOLU NP Risk Tool', 'BeZero Reversal', 'Renoster'], 'Reversal probability model'),

      m('buffer_adequacy', 'Buffer Pool Adequacy', 'Buffer_Pool / Expected_Reversal × 100', null, [
        comp('vcs_buffer', 'VCS Buffer Pool', '18%', null, [
          leaf('vcs_pool_bal', 'VCS Pool Balance', '340M tCO\u2082e', 'Verra Buffer', 1),
          leaf('vcs_drawdown', 'Drawdown Rate', '2.4%/yr', 'Verra Reports', 1),
        ]),
        comp('gs_buffer', 'GS Buffer / Insurance', '15%', null, [
          leaf('gs_insurance', 'Insurance Coverage', '$45M', 'Gold Standard', 2),
        ]),
      ], ['Verra Buffer Pool', 'Gold Standard', 'ART TREES'], 'Buffer adequacy assessment'),

      m('insurance_cov', 'Insurance Coverage', 'Insured / Total Exposure × 100', null, [
        comp('parametric_ins', 'Parametric Insurance', '$28M', null, [
          leaf('fire_parametric', 'Fire Parametric', '$18M', 'Re/Insurance', 2),
          leaf('drought_parametric', 'Drought Parametric', '$10M', 'Re/Insurance', 2),
        ]),
        comp('indemnity_ins', 'Indemnity Coverage', '$12M', null, [
          leaf('project_indemnity', 'Project-Level Indemnity', '$12M', 'Insurance Broker', 2),
        ]),
      ], ['Carbon Insurance Market', 'Oka/Kita'], 'Carbon insurance coverage'),
    ],
  },

  '/em-carbon-credit-hub': {
    moduleCode: 'CO-002', sprint: 'CARBON',
    metrics: [
      m('em_pipeline', 'EM Pipeline MtCO\u2082', 'Total pipeline across EM registries', null, [
        comp('africa_pipeline', 'Africa Pipeline', '180M tCO\u2082e', null, [
          comp('acmi_prog', 'ACMI Progress', '42M tCO\u2082e', null, [
            leaf('acmi_credits', 'ACMI Credits Issued', '42M', 'ACMI Roadmap', 2),
            leaf('acmi_target', 'ACMI 2030 Target', '300M', 'ACMI', 1),
          ]),
          comp('africa_nature', 'Africa Nature-Based', '138M tCO\u2082e', null, [
            leaf('redd_africa', 'REDD+ Africa', '82M', 'Verra', 1),
            leaf('cookstoves_africa', 'Clean Cookstoves', '56M', 'Gold Standard', 1),
          ]),
        ]),
        comp('asia_pipeline', 'Asia Pipeline', '240M tCO\u2082e', null, [
          leaf('india_pipeline', 'India Pipeline', '95M tCO\u2082e', 'CCTS India', 2),
          leaf('sea_pipeline', 'SE Asia Pipeline', '145M tCO\u2082e', 'Verra/GS', 2),
        ]),
        comp('latam_pipeline', 'LatAm Pipeline', '320M tCO\u2082e', null, [
          leaf('brazil_pipeline', 'Brazil Pipeline', '180M tCO\u2082e', 'Verra', 1),
          leaf('colombia_pipeline', 'Colombia Pipeline', '85M tCO\u2082e', 'ProClima', 2),
        ]),
      ], ['ACMI', 'Verra', 'Gold Standard', 'UNFCCC CDM'], 'Emerging market credit pipeline'),

      m('itmo_price', 'ITMO Price', 'Average bilateral ITMO transfer price', null, [
        comp('art62_price', 'Article 6.2 Price', '$12.50/tCO\u2082e', null, [
          leaf('swiss_price', 'Switzerland Bilateral', '$15.00', 'Swiss FOEN', 1),
          leaf('japan_jcm_price', 'Japan JCM Price', '$10.00', 'JCM Registry', 1),
        ]),
        comp('art64_price', 'Article 6.4 Price', '$8.20/tCO\u2082e', null, [
          leaf('sb_price', 'Supervisory Body Price', '$8.20', 'UNFCCC A6.4 SB', 2),
        ]),
      ], ['UNFCCC', 'World Bank PMR'], 'ITMO pricing intelligence'),

      m('article6_deals', 'Article 6 Deals', 'Bilateral agreements tracker', null, [
        comp('signed_deals', 'Signed Agreements', '42', null, [
          leaf('a62_signed', 'Art 6.2 Bilateral', '38', 'UNFCCC Registry', 1),
          leaf('a64_signed', 'Art 6.4 Authorized', '4', 'UNFCCC A6.4 SB', 1),
        ]),
        comp('pipeline_deals', 'Pipeline Deals', '28', null, [
          leaf('negotiating', 'In Negotiation', '18', 'World Bank PMR', 3),
          leaf('mou_stage', 'MOU Signed', '10', 'Country Reports', 2),
        ]),
      ], ['UNFCCC', 'World Bank Article 6 Tracker'], 'Article 6 deal flow'),
    ],
  },

  '/carbon-accounting-ai': {
    moduleCode: 'CO-003', sprint: 'CARBON',
    metrics: [
      m('auto_classified', 'Auto-Classified Records', 'ML-classified / Total × 100', null, [
        comp('scope_assigned', 'Scope Assignment', '94%', null, [
          comp('scope1_auto_ca', 'Scope 1 Auto-Assigned', '98%', null, [
            leaf('stationary_comb', 'Stationary Combustion', '99%', 'Utility Bills', 1),
            leaf('mobile_comb', 'Mobile Combustion', '97%', 'Fleet Telemetry', 1),
            leaf('process_em', 'Process Emissions', '95%', 'Production Data', 2),
          ]),
          comp('scope2_auto_ca', 'Scope 2 Auto-Assigned', '96%', null, [
            leaf('elec_auto', 'Electricity Purchases', '98%', 'Utility Bills', 1),
            leaf('steam_auto', 'Steam/Heating', '94%', 'Utility Data', 2),
          ]),
          comp('scope3_auto_ca', 'Scope 3 Auto-Assigned', '88%', null, [
            leaf('cat1_auto', 'Cat 1 Purchased Goods', '82%', 'AP Invoices', 3),
            leaf('cat6_auto', 'Cat 6 Business Travel', '95%', 'T&E System', 1),
            leaf('cat7_auto', 'Cat 7 Commuting', '78%', 'HR Survey', 4),
          ]),
        ]),
      ], ['GHG Protocol', 'ML Classification Engine'], 'Auto-classification accuracy'),

      m('ef_confidence', 'EF Match Confidence', 'Avg confidence of emission factor matching', null, [
        comp('exact_match', 'Exact EF Match', '62%', null, [
          leaf('supplier_ef', 'Supplier-Specific EF', '28%', 'Supplier Data', 1),
          leaf('activity_ef', 'Activity-Based EF', '34%', 'EPA/DEFRA/CEDA', 1),
        ]),
        comp('proxy_match', 'Proxy EF Match', '32%', null, [
          leaf('sector_avg_ef', 'Sector Average EF', '22%', 'CEDA/Exiobase', 3),
          leaf('spend_ef', 'Spend-Based EF', '10%', 'EEIO Models', 4),
        ]),
      ], ['EPA eGRID', 'DEFRA', 'CEDA', 'Exiobase'], 'Emission factor matching confidence'),
    ],
  },

  '/carbon-removal': {
    moduleCode: 'CO-004', sprint: 'CARBON',
    metrics: [
      m('removal_credits', 'Removal Credits', 'Total removal-based credits in portfolio', null, [
        comp('tech_removals', 'Technology-Based Removals', '85K tCO\u2082e', null, [
          comp('dac_credits', 'DAC Credits', '12K tCO\u2082e', null, [
            leaf('dac_provider1', 'Climeworks Credits', '8K tCO\u2082e', 'Climeworks Registry', 1),
            leaf('dac_provider2', 'Carbon Engineering', '4K tCO\u2082e', 'Puro.earth', 1),
          ]),
          comp('biochar_credits', 'Biochar Credits', '45K tCO\u2082e', null, [
            leaf('biochar_certs', 'Puro.earth Certified', '38K', 'Puro.earth', 1),
            leaf('biochar_pending', 'Pending Certification', '7K', 'Lab Results', 3),
          ]),
          comp('enhanced_rock', 'Enhanced Rock Weathering', '28K tCO\u2082e', null, [
            leaf('erw_verified', 'Verified ERW', '18K', 'Puro.earth/Isometric', 2),
            leaf('erw_pending', 'Pending MRV', '10K', 'Field Measurements', 3),
          ]),
        ]),
        comp('nature_removals', 'Nature-Based Removals', '420K tCO\u2082e', null, [
          leaf('arr_removals', 'Afforestation/Reforestation', '280K', 'Verra ARR', 2),
          leaf('soil_carbon', 'Soil Carbon Sequestration', '140K', 'Gold Standard', 3),
        ]),
      ], ['Puro.earth', 'Isometric', 'Verra', 'Gold Standard'], 'Carbon removal credit portfolio'),

      m('dac_capacity', 'DAC Capacity', 'Contracted DAC capacity (tCO\u2082e/yr)', null, [
        comp('operational_dac', 'Operational', '18K tCO\u2082e/yr', null, [
          leaf('orca_plant', 'Orca Plant (Iceland)', '4K tCO\u2082e/yr', 'Climeworks', 1),
          leaf('mammoth_plant', 'Mammoth Plant (Iceland)', '12K tCO\u2082e/yr', 'Climeworks', 1),
        ]),
        comp('contracted_dac', 'Contracted (Future)', '120K tCO\u2082e/yr', null, [
          leaf('us_hub_dac', 'US DAC Hub (Texas)', '100K tCO\u2082e/yr', 'DOE DAC Hub', 2),
          leaf('other_contracted', 'Other Contracted', '20K tCO\u2082e/yr', 'Offtake Agreements', 2),
        ]),
      ], ['IEA DAC Report', 'DOE DAC Hub'], 'Direct Air Capture capacity'),

      m('permanence_removal', 'Permanence Score', 'Weighted avg permanence across removal methods', null, [
        comp('geologic_perm', 'Geologic Storage', '10000+ yrs', null, [
          leaf('dac_geologic', 'DAC + Geologic', '10000+ yrs', 'Geologic Survey', 1),
        ]),
        comp('biological_perm', 'Biological Storage', '30-100 yrs', null, [
          leaf('forest_perm_rem', 'Forest Removals', '40-60 yrs', 'Verra VCS', 2),
          leaf('soil_perm', 'Soil Carbon', '30-50 yrs', 'Academic Research', 3),
        ]),
        comp('mineral_perm', 'Mineral Storage', '1000+ yrs', null, [
          leaf('biochar_perm_rem', 'Biochar', '500-1000 yrs', 'Lab Analysis', 2),
          leaf('erw_perm', 'Enhanced Weathering', '10000+ yrs', 'Geochemistry', 2),
        ]),
      ], ['IPCC AR6 WG3 Ch12', 'Puro.earth MRV'], 'Removal permanence scoring'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // FINANCIAL & PORTFOLIO (6 modules)
  // ═══════════════════════════════════════════════════════════════════
  '/climate-risk-premium-expanded': {
    moduleCode: 'FP-001', sprint: 'FIN-EXP',
    metrics: [
      m('greenium_expanded', 'Greenium Analysis', 'Green Bond YTM - Conv YTM by sector/rating', null, [
        comp('ig_greenium_exp', 'IG Greenium', '-8 bps', null, [
          comp('ig_utility', 'IG Utility Greenium', '-12 bps', null, [
            leaf('ig_util_green', 'Utility Green YTM', '3.85%', 'Bloomberg BICS', 1),
            leaf('ig_util_conv', 'Utility Conv YTM', '3.97%', 'Bloomberg', 1),
          ]),
          comp('ig_financials', 'IG Financial Greenium', '-5 bps', null, [
            leaf('ig_fin_green', 'Financial Green YTM', '4.22%', 'Bloomberg', 1),
            leaf('ig_fin_conv', 'Financial Conv YTM', '4.27%', 'Bloomberg', 1),
          ]),
        ]),
        comp('hy_greenium_exp', 'HY Greenium', '-15 bps', null, [
          leaf('hy_green_ytm_exp', 'HY Green Avg YTM', '6.85%', 'Bloomberg', 2),
          leaf('hy_conv_ytm_exp', 'HY Conv Avg YTM', '7.00%', 'Bloomberg', 2),
        ]),
      ], ['Bloomberg', 'CBI', 'ICE BofA'], 'Greenium term structure by sector'),

      m('carbon_beta', 'Carbon Beta', '\u03b2_carbon from Fama-French + Carbon factor', null, [
        comp('long_short_return', 'Long-Short Return', '-2.4% YTD', null, [
          leaf('long_green_exp', 'Long Green Portfolio', '+4.2%', 'Factor Model', 3),
          leaf('short_brown_exp', 'Short Brown Portfolio', '-6.6%', 'Factor Model', 3),
        ]),
        comp('factor_stats', 'Factor Statistics', null, null, [
          leaf('r2_carbon', 'R\u00b2', '0.18', 'Cross-Sectional OLS', 3),
          leaf('t_stat_carbon', 't-stat', '3.42', 'Cross-Sectional OLS', 3),
          leaf('sharpe_carbon', 'Climate Factor Sharpe', '0.52', 'Factor Model', 3),
        ]),
      ], ['Academic: Bolton & Kacperczyk', 'Internal Factor Model'], 'Carbon beta factor model'),

      m('term_structure', 'Carbon Risk Term Structure', 'Risk premium by maturity bucket', null, [
        comp('short_term', '0-2yr Premium', '+15 bps', null, [
          leaf('policy_near', 'Near-Term Policy Risk', '+10 bps', 'Carbon Price Model', 3),
          leaf('litigation_near', 'Litigation Premium', '+5 bps', 'LSE Grantham', 3),
        ]),
        comp('medium_term', '2-10yr Premium', '+45 bps', null, [
          leaf('transition_med', 'Transition Risk Premium', '+35 bps', 'NGFS', 3),
          leaf('stranded_med', 'Stranded Asset Premium', '+10 bps', 'CTI', 3),
        ]),
        comp('long_term', '10-30yr Premium', '+120 bps', null, [
          leaf('physical_long', 'Physical Risk Premium', '+80 bps', 'IPCC/Cat Models', 3),
          leaf('systemic_long', 'Systemic Risk Premium', '+40 bps', 'NGFS Disorderly', 3),
        ]),
      ], ['NGFS', 'Network for Greening', 'Academic Literature'], 'Carbon risk term structure'),
    ],
  },

  '/systemic-climate-risk-expanded': {
    moduleCode: 'FP-002', sprint: 'FIN-EXP',
    metrics: [
      m('macro_prudential', 'Macro-Prudential Indicators', 'Systemic risk monitoring dashboard', null, [
        comp('banking_stress', 'Banking System Stress', '62/100', null, [
          comp('capital_adequacy_sys', 'Capital Adequacy Under Stress', '11.2%', null, [
            leaf('cet1_stressed', 'CET1 Post-Stress', '11.2%', 'EBA Stress Test', 1),
            leaf('leverage_stressed', 'Leverage Ratio Stressed', '4.8%', 'EBA Stress Test', 1),
          ]),
          comp('concentration_sys', 'Climate Concentration Risk', '28%', null, [
            leaf('fossil_exposure', 'Fossil Fuel Exposure', '$420B', 'ECB/Fed Data', 1),
            leaf('hhi_climate', 'Climate HHI', '0.18', 'Internal Model', 3),
          ]),
        ]),
        comp('insurance_stress', 'Insurance System Stress', '55/100', null, [
          leaf('cat_load_sys', 'Catastrophe Load Ratio', '42%', 'Swiss Re Sigma', 1),
          leaf('reserve_adequacy', 'Reserve Adequacy', '108%', 'AM Best', 1),
        ]),
      ], ['FSB', 'ESRB', 'FSOC', 'BIS BCBS'], 'Macro-prudential climate monitoring'),

      m('tipping_points', 'Climate Tipping Points', 'Financial impact of tipping point scenarios', null, [
        comp('amoc_impact', 'AMOC Weakening', null, null, [
          leaf('amoc_prob', 'Probability by 2100', '15-35%', 'IPCC AR6 WG1', 2),
          leaf('amoc_gdp', 'EU GDP Impact', '-2.5 to -8.0%', 'NGFS Tail Risk', 3),
          leaf('amoc_portfolio', 'Portfolio VaR Impact', '+180 bps', 'Internal Model', 4),
        ]),
        comp('ice_sheet_impact', 'Ice Sheet Collapse', null, null, [
          leaf('wais_prob', 'WAIS Collapse P(2100)', '5-15%', 'IPCC AR6', 3),
          leaf('slr_impact', 'Sea Level Rise (m)', '0.5-3.0m', 'IPCC AR6', 3),
          leaf('coastal_loss', 'Coastal Asset Loss', '$2.2T', 'Swiss Re / OECD', 3),
        ]),
        comp('permafrost_impact', 'Permafrost Thaw', null, null, [
          leaf('permafrost_ghg', 'GHG Release (GtCO\u2082e)', '50-150 Gt', 'IPCC AR6', 3),
          leaf('feedback_cost', 'Feedback Loop Cost', '$70T NPV', 'Stern-Stiglitz', 4),
        ]),
      ], ['IPCC AR6', 'Lenton et al. 2019', 'NGFS'], 'Tipping point scenario analysis'),

      m('crossborder_contagion', 'Cross-Border Contagion', 'Climate shock transmission across borders', null, [
        comp('trade_channel', 'Trade Channel', '0.42 elasticity', null, [
          leaf('trade_matrix', 'Bilateral Trade Flows', '190 countries', 'WTO/OECD TiVA', 1),
          leaf('sc_vulnerability', 'Supply Chain Vulnerability', '0.38', 'OECD TiVA', 2),
        ]),
        comp('financial_channel', 'Financial Channel', '0.68 elasticity', null, [
          leaf('bis_cross', 'Cross-Border Claims', '$32T', 'BIS CBS', 1),
          leaf('portfolio_channel', 'Portfolio Rebalancing', '0.28', 'CPIS/IMF', 2),
        ]),
      ], ['BIS', 'FSB', 'IMF GFSR'], 'Cross-border climate contagion'),
    ],
  },

  '/asset-valuation-engine': {
    moduleCode: 'FP-003', sprint: 'FIN',
    metrics: [
      m('npv_base_val', 'NPV Base', 'Discounted cash flow — no climate overlay', null, [
        comp('fcf_projection', 'FCF Projection (10yr)', '$2.4B cumulative', null, [
          leaf('revenue_proj', 'Revenue CAGR', '6.2%', 'Analyst Consensus', 2),
          leaf('margin_proj', 'EBITDA Margin', '28%', 'Company Guidance', 2),
          leaf('capex_intensity', 'CapEx/Revenue', '12%', 'Historical Avg', 2),
        ]),
        comp('wacc_base_val', 'WACC', '8.5%', null, [
          leaf('cost_equity', 'Cost of Equity', '10.2%', 'CAPM', 2),
          leaf('cost_debt', 'Cost of Debt', '4.8%', 'Bloomberg', 1),
          leaf('debt_equity', 'D/E Ratio', '0.45', '10-K Filing', 1),
        ]),
      ], ['Bloomberg', 'Company Filings', 'Analyst Consensus'], 'Base case DCF valuation'),

      m('npv_climate_adj', 'NPV Climate-Adjusted', 'DCF with climate risk overlay', null, [
        comp('physical_adj', 'Physical Risk Adjustment', '-$180M', null, [
          leaf('flood_impact_npv', 'Flood CapEx Impact', '-$65M', 'Cat Model', 3),
          leaf('heat_productivity', 'Heat Productivity Loss', '-$45M', 'ILO/WHO', 3),
          leaf('sc_disruption_npv', 'Supply Chain Disruption', '-$70M', 'SC Risk Model', 4),
        ]),
        comp('transition_adj', 'Transition Risk Adjustment', '-$320M', null, [
          leaf('carbon_cost_adj', 'Carbon Cost (ETS/Tax)', '-$220M', 'Carbon Price Fwd', 3),
          leaf('demand_shift', 'Demand Shift Impact', '-$100M', 'IEA WEO', 3),
        ]),
        comp('opportunity_adj', 'Green Opportunity Premium', '+$150M', null, [
          leaf('green_rev_opp', 'Green Revenue Upside', '+$120M', 'Market Analysis', 4),
          leaf('efficiency_opp', 'Efficiency Gains', '+$30M', 'Engineering Est.', 3),
        ]),
      ], ['NGFS', 'IEA WEO', 'Internal Climate Model'], 'Climate-adjusted DCF'),

      m('option_value', 'Real Option Value', 'Flexibility value of climate adaptation options', null, [
        comp('adaptation_options', 'Adaptation Options', '+$85M', null, [
          leaf('relocate_option', 'Relocation Option', '+$45M', 'Black-Scholes', 4),
          leaf('retrofit_option', 'Retrofit Option', '+$40M', 'Binomial Model', 4),
        ]),
        comp('strategic_options', 'Strategic Options', '+$120M', null, [
          leaf('pivot_option', 'Business Pivot Option', '+$80M', 'Real Options', 4),
          leaf('tech_switch', 'Technology Switch Option', '+$40M', 'Real Options', 4),
        ]),
      ], ['Real Options Theory', 'Internal Valuation'], 'Real option value of flexibility'),

      m('mc_distribution', 'Monte Carlo P50/P95', 'Simulated NPV distribution (10K paths)', null, [
        comp('mc_p50', 'P50 (Median) NPV', '$1.82B', null, [
          leaf('mc_paths', 'Simulation Paths', '10,000', 'MC Engine', 3),
          leaf('mc_mean', 'Mean NPV', '$1.78B', 'MC Engine', 3),
        ]),
        comp('mc_p95', 'P95 (Tail Risk) NPV', '$0.92B', null, [
          leaf('mc_p5', 'P5 (Upside)', '$2.65B', 'MC Engine', 3),
          leaf('mc_std', 'NPV Std Dev', '$0.42B', 'MC Engine', 3),
        ]),
      ], ['Monte Carlo Simulation', '10K Climate Paths'], 'Stochastic NPV distribution'),
    ],
  },

  '/blended-finance': {
    moduleCode: 'FP-004', sprint: 'FIN',
    metrics: [
      m('leverage_ratio_bf', 'Leverage Ratio', 'Total_Mobilized / Catalytic_Capital', null, [
        comp('private_mobilized', 'Private Capital Mobilized', '$3.8B', null, [
          comp('institutional_bf', 'Institutional Investors', '$2.4B', null, [
            leaf('pension_bf', 'Pension Funds', '$1.2B', 'Convergence DB', 2),
            leaf('insurance_bf', 'Insurance Cos', '$0.8B', 'Convergence DB', 2),
            leaf('asset_mgr_bf', 'Asset Managers', '$0.4B', 'Convergence DB', 2),
          ]),
          comp('commercial_bf', 'Commercial Banks', '$1.4B', null, [
            leaf('syndicated_bf', 'Syndicated Loans', '$0.9B', 'Deal Records', 2),
            leaf('project_finance_bf', 'Project Finance', '$0.5B', 'Deal Records', 2),
          ]),
        ]),
        comp('public_catalytic', 'Public/Catalytic Capital', '$0.6B', null, [
          leaf('dfi_contrib', 'DFI Contribution', '$0.35B', 'MDB Reports', 1),
          leaf('gcf_contrib', 'GCF/GEF Grant', '$0.15B', 'GCF Tracker', 1),
          leaf('bilateral_contrib', 'Bilateral Aid', '$0.10B', 'OECD DAC', 1),
        ]),
      ], ['Convergence', 'OECD DAC', 'GCF'], 'Blended finance leverage measurement'),

      m('first_loss', 'First-Loss Absorption', 'First-loss tranche as % of deal size', null, [
        comp('junior_tranche', 'Junior Tranche', '15%', null, [
          leaf('dfi_first_loss', 'DFI First-Loss', '10%', 'Deal Structure', 1),
          leaf('philanthropy_fl', 'Philanthropic First-Loss', '5%', 'Foundation Grants', 2),
        ]),
        comp('guarantee_layer', 'Guarantee Layer', '20%', null, [
          leaf('miga_guarantee', 'MIGA/MDB Guarantee', '15%', 'World Bank', 1),
          leaf('sovereign_guarantee', 'Sovereign Guarantee', '5%', 'Host Government', 2),
        ]),
      ], ['Convergence', 'MIGA', 'World Bank'], 'First-loss protection structure'),

      m('irr_blended', 'IRR Blended', 'Blended return across tranches', null, [
        comp('senior_irr', 'Senior Tranche IRR', '6.2%', null, [
          leaf('senior_coupon', 'Fixed Coupon', '5.5%', 'Term Sheet', 1),
          leaf('senior_fees', 'Fees/Spread', '0.7%', 'Term Sheet', 1),
        ]),
        comp('mezzanine_irr', 'Mezzanine IRR', '9.8%', null, [
          leaf('mezz_coupon', 'PIK Coupon', '8.0%', 'Term Sheet', 1),
          leaf('mezz_equity_kicker', 'Equity Kicker', '1.8%', 'Model', 3),
        ]),
        comp('equity_irr', 'Equity Tranche IRR', '14.5%', null, [
          leaf('cash_yield_eq', 'Cash Yield', '4.0%', 'Distributions', 2),
          leaf('capital_gain_eq', 'Capital Gain', '10.5%', 'Exit Model', 4),
        ]),
      ], ['Fund Manager', 'Deal Model'], 'Blended finance return waterfall'),
    ],
  },

  '/avoided-emissions-portfolio-expanded': {
    moduleCode: 'FP-005', sprint: 'FIN-EXP',
    metrics: [
      m('attribution_factor', 'Attribution Factor', 'Investor share of avoided emissions', null, [
        comp('equity_attribution', 'Equity Attribution', '12%', null, [
          leaf('ownership_pct', 'Ownership %', '4.2%', 'Holdings DB', 1),
          leaf('evic_share', 'EVIC Share', '4.2%', 'Bloomberg', 1),
        ]),
        comp('debt_attribution', 'Debt Attribution', '8%', null, [
          leaf('loan_share', 'Loan Outstanding / Total Debt', '8%', 'Loan Book', 1),
          leaf('bond_share', 'Bond / Total Bonds Outstanding', '3%', 'Bloomberg', 1),
        ]),
      ], ['PCAF', 'IFI Harmonized Framework'], 'Avoided emissions attribution methodology'),

      m('credibility_score', 'Credibility Score', 'Multi-factor credibility assessment', null, [
        comp('additionality_score', 'Additionality', '72/100', null, [
          leaf('financial_add', 'Financial Additionality', '68/100', 'Project Financials', 3),
          leaf('regulatory_add', 'Regulatory Additionality', '82/100', 'Policy Analysis', 2),
        ]),
        comp('baseline_robustness', 'Baseline Robustness', '65/100', null, [
          leaf('baseline_method', 'Methodology Quality', '70/100', 'UNFCCC/CDM', 2),
          leaf('conservative_est', 'Conservative Estimates', '60/100', 'Peer Review', 3),
        ]),
        comp('mrv_quality', 'MRV Quality', '78/100', null, [
          leaf('monitoring_freq', 'Monitoring Frequency', '85/100', 'Project M&E', 2),
          leaf('third_party_ver', 'Third-Party Verification', '72/100', 'VVB Report', 1),
        ]),
      ], ['GHG Protocol Avoided Emissions', 'ICVCM'], 'Credibility framework scoring'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // PHYSICAL & NATURE (6 modules)
  // ═══════════════════════════════════════════════════════════════════
  '/physical-hazard-map': {
    moduleCode: 'PN-001', sprint: 'PHYSICAL',
    metrics: [
      m('asset_exposure_bn', 'Asset Exposure $B', 'Total exposed asset value by peril', null, [
        comp('flood_exposure', 'Flood Exposure', '$12.4B', null, [
          comp('fluvial_exp', 'Fluvial (River) Flood', '$8.2B', null, [
            leaf('fluvial_assets', 'Assets in Flood Zone', '142', 'JBA/Swiss Re', 2),
            leaf('fluvial_value', 'Replacement Value', '$8.2B', 'Asset Register', 1),
          ]),
          comp('pluvial_exp', 'Pluvial (Surface) Flood', '$4.2B', null, [
            leaf('pluvial_assets', 'Assets Exposed', '86', 'Cat Model', 2),
            leaf('pluvial_value', 'Replacement Value', '$4.2B', 'Asset Register', 1),
          ]),
        ]),
        comp('heat_exposure', 'Extreme Heat Exposure', '$8.6B', null, [
          leaf('heat_assets', 'Assets in >40\u00b0C Zone', '98', 'Copernicus ERA5', 2),
          leaf('heat_value', 'Exposed Value', '$8.6B', 'Asset Register', 1),
        ]),
        comp('wind_exposure', 'Tropical Cyclone Exposure', '$6.2B', null, [
          leaf('tc_assets', 'TC-Exposed Assets', '64', 'IBTrACS / Munich Re', 2),
          leaf('tc_value', 'Exposed Value', '$6.2B', 'Asset Register', 1),
        ]),
      ], ['JBA Risk Management', 'Swiss Re CatNet', 'Copernicus', 'Munich Re NATHAN'], 'Total asset exposure by peril'),

      m('high_risk_pct', 'High-Risk Assets %', 'Assets with AAL > 1% of value / Total', null, [
        comp('very_high_risk', 'Very High Risk (>2% AAL)', '8%', null, [
          leaf('vh_count', 'Asset Count', '24', 'Cat Model', 2),
          leaf('vh_value', 'Value at Risk', '$2.1B', 'Internal', 2),
        ]),
        comp('high_risk_phm', 'High Risk (1-2% AAL)', '14%', null, [
          leaf('h_count', 'Asset Count', '42', 'Cat Model', 2),
          leaf('h_value', 'Value at Risk', '$3.8B', 'Internal', 2),
        ]),
      ], ['Internal Cat Model', 'RMS/AIR'], 'High-risk asset concentration'),

      m('adaptation_invest', 'Adaptation Investment Need', 'CapEx required to reduce risk to target', null, [
        comp('structural_adapt', 'Structural Measures', '$420M', null, [
          leaf('flood_defense', 'Flood Defenses', '$180M', 'Engineering Est.', 3),
          leaf('building_retrofit', 'Building Retrofits', '$240M', 'Engineering Est.', 3),
        ]),
        comp('nature_based_adapt', 'Nature-Based Solutions', '$85M', null, [
          leaf('mangrove_restore', 'Mangrove Restoration', '$45M', 'NbS Study', 4),
          leaf('urban_green', 'Urban Green Infrastructure', '$40M', 'Municipal Plans', 3),
        ]),
      ], ['UNEP Adaptation Gap', 'Internal Engineering'], 'Adaptation investment gap'),
    ],
  },

  '/deforestation-risk': {
    moduleCode: 'PN-002', sprint: 'PHYSICAL',
    metrics: [
      m('deforestation_exp', 'Deforestation Exposure %', 'Portfolio exposure to deforestation-linked commodities', null, [
        comp('palm_oil_exp', 'Palm Oil Exposure', '8.2%', null, [
          leaf('palm_direct', 'Direct Producers', '3.4%', 'Bloomberg BICS', 1),
          leaf('palm_indirect', 'Downstream Users', '4.8%', 'Trase / Supply Chain', 3),
        ]),
        comp('soy_exp', 'Soy Exposure', '5.4%', null, [
          leaf('soy_producers', 'Soy Producers', '2.8%', 'Bloomberg BICS', 1),
          leaf('soy_traders', 'Commodity Traders', '2.6%', 'Trase', 2),
        ]),
        comp('cattle_exp', 'Cattle/Beef Exposure', '4.2%', null, [
          leaf('cattle_direct', 'Ranchers/Meatpackers', '2.4%', 'Bloomberg', 2),
          leaf('cattle_leather', 'Leather Supply Chain', '1.8%', 'Trase', 3),
        ]),
        comp('timber_exp', 'Timber/Pulp Exposure', '3.8%', null, [
          leaf('timber_certified', 'FSC/PEFC Certified', '2.2%', 'FSC DB', 1),
          leaf('timber_uncertified', 'Uncertified', '1.6%', 'Trase', 3),
        ]),
      ], ['Trase', 'Global Forest Watch', 'Bloomberg'], 'Deforestation-linked commodity exposure'),

      m('eudr_compliance_def', 'EUDR Compliance', 'Compliance with EU Deforestation Regulation', null, [
        comp('traceability', 'Traceability Status', '62%', null, [
          leaf('geocoord_avail', 'Geolocation Available', '58%', 'Supplier Data', 3),
          leaf('due_diligence_done', 'Due Diligence Complete', '45%', 'DDS Platform', 2),
        ]),
        comp('risk_assessment', 'Risk Assessment', '55%', null, [
          leaf('country_risk_eudr', 'Country Risk Benchmarked', '72%', 'EU EUDR List', 1),
          leaf('satellite_verified', 'Satellite Verified', '38%', 'GFW/Planet', 2),
        ]),
      ], ['EU Regulation 2023/1115', 'Global Forest Watch', 'Trase'], 'EUDR compliance readiness'),

      m('forest_risk_commod', 'Forest-Risk Commodities', 'Number of forest-risk commodities in portfolio', null, [
        comp('high_risk_commod', 'High-Risk Commodities', '4', null, [
          leaf('palm_hr', 'Palm Oil', 'High Risk', 'RSPO/Trase', 2),
          leaf('soy_hr', 'Soy', 'High Risk', 'RTRS/Trase', 2),
          leaf('cattle_hr', 'Cattle Products', 'High Risk', 'Trase', 3),
          leaf('cocoa_hr', 'Cocoa', 'High Risk', 'Rainforest Alliance', 2),
        ]),
        comp('medium_risk_commod', 'Medium-Risk Commodities', '3', null, [
          leaf('timber_mr', 'Timber/Pulp', 'Medium', 'FSC/PEFC', 2),
          leaf('rubber_mr', 'Rubber', 'Medium', 'GPSNR', 3),
          leaf('coffee_mr', 'Coffee', 'Medium', 'Fairtrade', 2),
        ]),
      ], ['Trase', 'CDP Forests', 'Global Canopy'], 'Forest-risk commodity inventory'),
    ],
  },

  '/sovereign-esg-scorer-expanded': {
    moduleCode: 'PN-003', sprint: 'PHYS-EXP',
    metrics: [
      m('gov_indicators', 'Governance Indicators', 'Expanded WGI-based governance scoring', null, [
        comp('wgi_composite', 'WGI Composite', '52/100', null, [
          comp('voice_account', 'Voice & Accountability', '48/100', null, [
            leaf('press_freedom', 'Press Freedom Index', '52/100', 'RSF', 1),
            leaf('civil_liberties', 'Civil Liberties', '45/100', 'Freedom House', 1),
          ]),
          comp('rule_of_law', 'Rule of Law', '55/100', null, [
            leaf('judicial_indep', 'Judicial Independence', '58/100', 'WJP', 1),
            leaf('contract_enforce', 'Contract Enforcement', '52/100', 'World Bank DB', 1),
          ]),
          comp('reg_quality', 'Regulatory Quality', '58/100', null, [
            leaf('business_reg', 'Business Regulation', '62/100', 'World Bank DB', 1),
            leaf('competition_policy', 'Competition Policy', '54/100', 'OECD', 2),
          ]),
        ]),
        comp('corruption_expanded', 'Corruption Control', '42/100', null, [
          leaf('ti_cpi_exp', 'TI CPI Score', '40/100', 'Transparency International', 1),
          leaf('bribery_risk', 'Bribery Risk', '45/100', 'TRACE Matrix', 2),
        ]),
      ], ['World Bank WGI', 'TI', 'Freedom House', 'WJP'], 'Sovereign governance deep-dive'),

      m('peer_comparison', 'Peer Comparison', 'Regional & income-group benchmarking', null, [
        comp('regional_rank', 'Regional Rank', '12 of 45', null, [
          leaf('env_regional', 'Environmental Rank', '8 of 45', 'OWID/IEA', 2),
          leaf('social_regional', 'Social Rank', '15 of 45', 'UNDP/World Bank', 2),
          leaf('gov_regional', 'Governance Rank', '14 of 45', 'World Bank WGI', 1),
        ]),
        comp('income_rank', 'Income-Group Rank', '22 of 55', null, [
          leaf('env_income', 'Environmental vs Peers', '18 of 55', 'OWID', 2),
          leaf('social_income', 'Social vs Peers', '28 of 55', 'UNDP', 2),
        ]),
      ], ['OWID', 'UNDP', 'World Bank'], 'Sovereign peer benchmarking'),
    ],
  },

  '/biodiversity-credits': {
    moduleCode: 'PN-004', sprint: 'NATURE',
    metrics: [
      m('bng_units', 'BNG Units', 'Biodiversity Net Gain units generated', null, [
        comp('habitat_units', 'Habitat Units', '124.5', null, [
          comp('creation_units', 'Habitat Creation', '82.4', null, [
            leaf('woodland_creation', 'Woodland Creation', '42.8 units', 'BNG Metric 4.0', 2),
            leaf('wetland_creation', 'Wetland Creation', '25.6 units', 'BNG Metric 4.0', 2),
            leaf('grassland_creation', 'Grassland Creation', '14.0 units', 'BNG Metric 4.0', 2),
          ]),
          comp('enhancement_units', 'Habitat Enhancement', '42.1', null, [
            leaf('woodland_enhance', 'Woodland Enhancement', '28.2 units', 'BNG Metric 4.0', 2),
            leaf('hedgerow_enhance', 'Hedgerow Enhancement', '13.9 units', 'BNG Metric 4.0', 2),
          ]),
        ]),
        comp('river_units', 'River Units', '18.2', null, [
          leaf('river_creation', 'River Habitat Created', '12.4 units', 'BNG Metric 4.0', 3),
          leaf('river_enhance', 'River Enhanced', '5.8 units', 'BNG Metric 4.0', 3),
        ]),
      ], ['DEFRA BNG Metric 4.0', 'Natural England'], 'Biodiversity Net Gain unit accounting'),

      m('nnl_score', 'No Net Loss Score', 'Mitigation hierarchy compliance', null, [
        comp('avoidance', 'Avoidance', '65%', null, [
          leaf('sites_avoided', 'High-Value Sites Avoided', '12 of 18', 'EIA Reports', 2),
        ]),
        comp('minimization', 'Minimization', '78%', null, [
          leaf('buffer_zones', 'Buffer Zones Established', '85%', 'Site Plans', 2),
          leaf('timing_restrict', 'Seasonal Restrictions', '92%', 'EIA Conditions', 1),
        ]),
        comp('offset_residual', 'Offset (Residual)', '42%', null, [
          leaf('offset_secured', 'Offset Credits Secured', '42%', 'Offset Provider', 3),
          leaf('offset_registered', 'Credits Registered', '38%', 'National Register', 2),
        ]),
      ], ['IUCN NNL Policy', 'IFC PS6', 'BBOP'], 'No Net Loss mitigation hierarchy'),

      m('habitat_quality', 'Habitat Quality', 'Weighted habitat condition score', null, [
        comp('condition_score', 'Condition Assessment', '68/100', null, [
          leaf('species_richness', 'Species Richness Index', '0.72', 'Field Survey', 2),
          leaf('habitat_connect', 'Connectivity Score', '0.58', 'GIS Analysis', 2),
          leaf('invasive_pct', 'Invasive Species %', '12%', 'Field Survey', 2),
        ]),
        comp('trajectory', 'Trajectory', 'Improving', null, [
          leaf('baseline_condition', 'Baseline (Year 0)', '52/100', 'Baseline Survey', 1),
          leaf('current_condition', 'Current', '68/100', 'Monitoring Report', 2),
        ]),
      ], ['JNCC', 'UKHab Classification', 'IUCN Habitat'], 'Habitat quality monitoring'),

      m('species_impact_bc', 'Species Impact', 'Impact on key species populations', null, [
        comp('threatened_sp', 'Threatened Species', '4 species affected', null, [
          leaf('red_list_sp', 'IUCN Red List Species', '2', 'IUCN Red List', 1),
          leaf('national_priority', 'National Priority Species', '2', 'National DB', 1),
        ]),
        comp('indicator_sp', 'Indicator Species', '12 monitored', null, [
          leaf('bird_indicators', 'Bird Indicators', '8 species', 'BTO Surveys', 2),
          leaf('butterfly_ind', 'Butterfly Indicators', '4 species', 'BC Monitoring', 2),
        ]),
      ], ['IUCN Red List', 'IBAT', 'National Biodiversity DB'], 'Species impact assessment'),
    ],
  },

  '/nature-capital-accounting': {
    moduleCode: 'PN-005', sprint: 'NATURE',
    metrics: [
      m('natural_capital_bn', 'Natural Capital $B', 'Total natural capital stock valuation', null, [
        comp('provisioning', 'Provisioning Services', '$4.2B', null, [
          comp('food_provision', 'Food Provision', '$2.1B', null, [
            leaf('crop_value', 'Crop Production Value', '$1.4B', 'FAO FAOSTAT', 1),
            leaf('fisheries_value', 'Fisheries Value', '$0.7B', 'FAO', 2),
          ]),
          comp('water_provision', 'Water Provision', '$1.4B', null, [
            leaf('freshwater_value', 'Freshwater Supply', '$1.0B', 'WRI Aqueduct', 2),
            leaf('purification_value', 'Water Purification', '$0.4B', 'TEEB', 3),
          ]),
          comp('raw_materials', 'Raw Materials', '$0.7B', null, [
            leaf('timber_value_nc', 'Timber Value', '$0.5B', 'FAO FRA', 2),
            leaf('genetic_resources', 'Genetic Resources', '$0.2B', 'TEEB', 4),
          ]),
        ]),
        comp('regulating', 'Regulating Services', '$8.6B', null, [
          comp('carbon_reg', 'Carbon Sequestration', '$3.2B', null, [
            leaf('forest_carbon_nc', 'Forest Carbon Stock', '2.4 GtCO\u2082e', 'Global Forest Watch', 2),
            leaf('soil_carbon_nc', 'Soil Carbon Stock', '1.8 GtCO\u2082e', 'FAO GSP', 3),
          ]),
          comp('flood_reg', 'Flood Regulation', '$2.8B', null, [
            leaf('wetland_storage', 'Wetland Storage', '$1.8B', 'Ramsar', 3),
            leaf('floodplain_value', 'Floodplain Value', '$1.0B', 'TEEB', 3),
          ]),
          comp('pollination_reg', 'Pollination', '$2.6B', null, [
            leaf('pollinator_value', 'Pollinator Economic Value', '$2.6B', 'IPBES', 3),
          ]),
        ]),
      ], ['SEEA EA', 'TEEB', 'WAVES', 'Natural Capital Protocol'], 'Natural capital stock valuation'),

      m('ecosystem_services_val', 'Ecosystem Services Value', 'Annual flow of ecosystem services', null, [
        comp('direct_use', 'Direct Use Value', '$1.2B/yr', null, [
          leaf('agriculture_use', 'Agriculture', '$0.6B/yr', 'National Accounts', 1),
          leaf('recreation_use', 'Recreation/Tourism', '$0.4B/yr', 'Tourism Stats', 2),
          leaf('forestry_use', 'Forestry', '$0.2B/yr', 'FAO FRA', 2),
        ]),
        comp('indirect_use', 'Indirect Use Value', '$2.8B/yr', null, [
          leaf('water_purif_flow', 'Water Purification', '$0.8B/yr', 'TEEB', 3),
          leaf('carbon_seq_flow', 'Carbon Sequestration', '$1.2B/yr', 'Social Cost of Carbon', 3),
          leaf('flood_prot_flow', 'Flood Protection', '$0.8B/yr', 'Cat Models', 3),
        ]),
      ], ['SEEA EA', 'TEEB Database', 'Natural Capital Protocol'], 'Ecosystem service annual flow'),

      m('dependency_score_nc', 'Dependency Score', 'Business dependency on natural capital', null, [
        comp('high_dependency', 'High Dependency Sectors', '32%', null, [
          leaf('agriculture_dep', 'Agriculture/Food', '18%', 'ENCORE', 2),
          leaf('pharma_dep', 'Pharmaceuticals', '8%', 'ENCORE', 2),
          leaf('tourism_dep', 'Tourism/Hospitality', '6%', 'ENCORE', 3),
        ]),
        comp('medium_dependency', 'Medium Dependency', '28%', null, [
          leaf('manufacturing_dep', 'Manufacturing', '15%', 'ENCORE', 3),
          leaf('utilities_dep', 'Utilities', '13%', 'ENCORE', 2),
        ]),
      ], ['ENCORE', 'TNFD LEAP', 'SBTN'], 'Nature dependency assessment'),
    ],
  },

  '/just-transition-intelligence-expanded': {
    moduleCode: 'PN-006', sprint: 'PHYS-EXP',
    metrics: [
      m('coal_district_data', 'Coal District Analysis', 'District-level coal dependency metrics', null, [
        comp('district_employment', 'District Employment', null, null, [
          comp('direct_coal_emp', 'Direct Coal Employment', '1.2M', null, [
            leaf('mining_emp', 'Mining Jobs', '680K', 'Coal India Ltd', 1),
            leaf('power_emp', 'Coal Power Station Jobs', '320K', 'CEA India', 1),
            leaf('transport_emp', 'Coal Transport Jobs', '200K', 'Indian Railways', 2),
          ]),
          comp('indirect_coal_emp', 'Indirect Employment', '3.8M', null, [
            leaf('ancillary_emp', 'Ancillary Industry', '2.2M', 'ILO Estimate', 3),
            leaf('services_emp', 'Local Services', '1.6M', 'Census Data', 3),
          ]),
        ]),
        comp('district_fiscal', 'District Fiscal Impact', null, null, [
          leaf('coal_royalties', 'Coal Royalties', '$4.2B/yr', 'DGMS/MoC', 1),
          leaf('gst_coal', 'GST from Coal', '$2.8B/yr', 'GST Council', 1),
          leaf('dmft_fund', 'DMF Trust Fund', '$1.8B', 'PMKKKY', 1),
        ]),
      ], ['Coal India Ltd', 'CEA India', 'DGMS', 'Census'], 'District-level coal dependency'),

      m('worker_impact', 'Worker Impact Assessment', 'Projected worker displacement and reskilling need', null, [
        comp('displacement_risk', 'Displacement Risk', '420K workers by 2030', null, [
          leaf('mining_displaced', 'Mining Displaced', '180K', 'Phase-Out Model', 3),
          leaf('power_displaced', 'Power Sector Displaced', '120K', 'Phase-Out Model', 3),
          leaf('transport_displaced', 'Transport Displaced', '120K', 'Modal Shift Model', 4),
        ]),
        comp('reskilling_need', 'Reskilling Need', '85% of displaced', null, [
          leaf('solar_reskill', 'Solar Installation', '120K workers', 'Skill Gap Analysis', 3),
          leaf('battery_reskill', 'Battery/EV', '80K workers', 'Skill Gap Analysis', 3),
          leaf('green_hydrogen', 'Green H\u2082', '45K workers', 'Skill Gap Analysis', 4),
        ]),
      ], ['ILO', 'IISD', 'NITI Aayog'], 'Worker impact and reskilling assessment'),

      m('retraining_cost', 'Retraining Cost', 'Total reskilling investment needed', null, [
        comp('govt_programs', 'Government Programs', '$2.4B', null, [
          leaf('nsdc_budget', 'NSDC Budget Allocated', '$0.8B', 'MSDE', 1),
          leaf('state_programs', 'State-Level Programs', '$1.2B', 'State Budgets', 2),
          leaf('intl_finance', 'International Finance', '$0.4B', 'ADB/World Bank', 2),
        ]),
        comp('private_investment', 'Private Sector Investment', '$0.6B', null, [
          leaf('corporate_training', 'Corporate Training', '$0.4B', 'Industry Survey', 3),
          leaf('ngo_programs', 'NGO Programs', '$0.2B', 'ICLEI/GIZ', 2),
        ]),
      ], ['ILO', 'NSDC India', 'ADB'], 'Retraining cost estimation'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // INDIA & EMERGING MARKETS (4 modules)
  // ═══════════════════════════════════════════════════════════════════
  '/pcaf-india-brsr': {
    moduleCode: 'EM-001', sprint: 'INDIA',
    metrics: [
      m('indian_fe', 'Indian Financed Emissions', 'FE attributed to Indian holdings', null, [
        comp('nifty50_fe', 'Nifty 50 FE', '42.5M tCO\u2082e', null, [
          comp('nifty_s1s2', 'Scope 1+2 FE', '28.4M tCO\u2082e', null, [
            leaf('nifty_power', 'Power Sector FE', '12.8M tCO\u2082e', 'BRSR Filings', 2),
            leaf('nifty_metals', 'Metals & Mining FE', '8.2M tCO\u2082e', 'BRSR Filings', 2),
            leaf('nifty_cement', 'Cement Sector FE', '4.8M tCO\u2082e', 'BRSR Filings', 2),
          ]),
          comp('nifty_s3', 'Scope 3 FE', '14.1M tCO\u2082e', null, [
            leaf('nifty_upstream', 'Upstream (Cat 1-8)', '8.4M tCO\u2082e', 'BRSR/CDP', 3),
            leaf('nifty_downstream', 'Downstream (Cat 9-15)', '5.7M tCO\u2082e', 'BRSR/CDP', 4),
          ]),
        ]),
        comp('midcap_fe', 'Midcap FE', '18.2M tCO\u2082e', null, [
          leaf('midcap_reported', 'Reported (DQ 1-2)', '8.5M tCO\u2082e', 'BRSR Filings', 2),
          leaf('midcap_estimated', 'Estimated (DQ 3-5)', '9.7M tCO\u2082e', 'PCAF Models', 4),
        ]),
      ], ['SEBI BRSR', 'CDP India', 'PCAF'], 'India-specific financed emissions'),

      m('brsr_score', 'BRSR Score', 'SEBI BRSR compliance and quality score', null, [
        comp('brsr_essential', 'Essential Indicators', '82%', null, [
          leaf('principle1', 'P1 Ethical Conduct', '88%', 'BRSR Filing', 1),
          leaf('principle6', 'P6 Environment', '78%', 'BRSR Filing', 1),
          leaf('principle9', 'P9 Consumer Responsibility', '80%', 'BRSR Filing', 1),
        ]),
        comp('brsr_leadership', 'Leadership Indicators', '45%', null, [
          leaf('p6_leadership', 'P6 Environment Leadership', '52%', 'BRSR Filing', 2),
          leaf('p3_leadership', 'P3 Employee Wellbeing', '38%', 'BRSR Filing', 2),
        ]),
      ], ['SEBI BRSR Framework', 'SEBI Circular 2021'], 'BRSR compliance scoring'),

      m('sector_intensity_india', 'Sector Intensity', 'tCO\u2082e per INR Cr by sector', null, [
        comp('high_intensity', 'High Intensity Sectors', '>500 tCO\u2082e/Cr', null, [
          leaf('power_intensity', 'Power Sector', '1,240 tCO\u2082e/Cr', 'BRSR/CEA', 1),
          leaf('steel_intensity', 'Steel Sector', '820 tCO\u2082e/Cr', 'BRSR/WSA', 2),
          leaf('cement_intensity', 'Cement Sector', '680 tCO\u2082e/Cr', 'BRSR/GCCA', 2),
        ]),
        comp('medium_intensity', 'Medium Intensity', '100-500 tCO\u2082e/Cr', null, [
          leaf('auto_intensity', 'Automobile Sector', '280 tCO\u2082e/Cr', 'BRSR', 2),
          leaf('chem_intensity', 'Chemicals Sector', '420 tCO\u2082e/Cr', 'BRSR', 2),
        ]),
      ], ['SEBI BRSR', 'CEA India', 'Industry Associations'], 'India sector carbon intensity'),

      m('assurance_readiness', 'Assurance Readiness', 'Readiness for BRSR Core assurance', null, [
        comp('data_quality_br', 'Data Quality', '68%', null, [
          leaf('metered_pct', 'Metered/Measured', '72%', 'EMS System', 1),
          leaf('audit_trail_br', 'Audit Trail Complete', '64%', 'Internal Systems', 2),
        ]),
        comp('process_ready', 'Process Readiness', '55%', null, [
          leaf('internal_controls', 'Internal Controls', '62%', 'IA Report', 2),
          leaf('assurance_provider', 'Assurance Provider Selected', 'Yes', 'Procurement', 1),
        ]),
      ], ['SEBI BRSR Core', 'ICAI Standards'], 'BRSR assurance readiness'),
    ],
  },

  '/adaptation-finance': {
    moduleCode: 'EM-002', sprint: 'EMERGING',
    metrics: [
      m('adaptation_gap_bn', 'Adaptation Gap $B', 'Annual gap between need and finance flow', null, [
        comp('adaptation_need', 'Adaptation Need (Annual)', '$160-340B', null, [
          comp('developing_need', 'Developing Country Need', '$140-300B', null, [
            leaf('agriculture_need', 'Agriculture Adaptation', '$45-80B', 'UNEP AGR 2023', 3),
            leaf('infrastructure_need', 'Infrastructure Adaptation', '$50-120B', 'UNEP AGR', 3),
            leaf('health_need', 'Health System Adaptation', '$25-50B', 'WHO', 3),
          ]),
          comp('developed_need', 'Developed Country Need', '$20-40B', null, [
            leaf('coastal_need', 'Coastal Protection', '$12-25B', 'OECD', 3),
            leaf('urban_heat_need', 'Urban Heat Mitigation', '$8-15B', 'C40 Cities', 3),
          ]),
        ]),
        comp('adaptation_flow', 'Current Finance Flow', '$28B', null, [
          leaf('public_adapt', 'Public Finance', '$21B', 'OECD DAC', 1),
          leaf('private_adapt', 'Private Finance', '$7B', 'CPI Landscape', 2),
        ]),
      ], ['UNEP Adaptation Gap Report', 'CPI Global Landscape', 'OECD DAC'], 'Adaptation finance gap'),

      m('resilience_score', 'Resilience Score', 'Composite climate resilience index', null, [
        comp('institutional_res', 'Institutional Resilience', '52/100', null, [
          leaf('nap_progress', 'NAP Completion', '58%', 'UNFCCC NAP', 2),
          leaf('ews_coverage', 'Early Warning Coverage', '48%', 'WMO', 2),
        ]),
        comp('infrastructure_res', 'Infrastructure Resilience', '45/100', null, [
          leaf('flood_infra', 'Flood Protection', '42%', 'World Bank', 3),
          leaf('water_infra', 'Water Security', '48%', 'WRI Aqueduct', 2),
        ]),
        comp('financial_res', 'Financial Resilience', '38/100', null, [
          leaf('insurance_pen', 'Insurance Penetration', '3.2%', 'Swiss Re Sigma', 1),
          leaf('fiscal_buffer', 'Fiscal Buffer', '2.4% GDP', 'IMF WEO', 1),
        ]),
      ], ['ND-GAIN', 'INFORM Risk', 'World Bank CCKP'], 'Climate resilience index'),
    ],
  },

  '/africa-climate-finance': {
    moduleCode: 'EM-003', sprint: 'EMERGING',
    metrics: [
      m('africa_cf_bn', 'Climate Finance $B', 'Total climate finance flows to Africa', null, [
        comp('mitigation_af', 'Mitigation Finance', '$8.2B', null, [
          comp('re_finance_af', 'Renewable Energy', '$4.8B', null, [
            leaf('solar_af', 'Solar Projects', '$2.4B', 'CPI/IRENA', 2),
            leaf('wind_af', 'Wind Projects', '$1.6B', 'CPI/IRENA', 2),
            leaf('hydro_af', 'Hydropower', '$0.8B', 'CPI', 2),
          ]),
          comp('transport_af', 'Clean Transport', '$2.2B', null, [
            leaf('brt_af', 'BRT Systems', '$1.4B', 'MDB Reports', 2),
            leaf('ev_af', 'EV Infrastructure', '$0.8B', 'AfDB', 2),
          ]),
          comp('industry_af', 'Industry Decarbonization', '$1.2B', null, [
            leaf('efficiency_af', 'Energy Efficiency', '$0.8B', 'CPI', 3),
            leaf('green_mfg', 'Green Manufacturing', '$0.4B', 'AfDB', 3),
          ]),
        ]),
        comp('adaptation_af', 'Adaptation Finance', '$4.8B', null, [
          leaf('agri_adapt_af', 'Agriculture Adaptation', '$2.2B', 'GCA/CPI', 2),
          leaf('water_adapt_af', 'Water Infrastructure', '$1.6B', 'AfDB', 2),
          leaf('resilience_af', 'Resilience Building', '$1.0B', 'GCF', 2),
        ]),
      ], ['CPI Landscape', 'AfDB', 'GCF', 'IRENA'], 'Africa climate finance tracking'),

      m('ndc_gap_af', 'NDC Gap', 'Gap between NDC pledges and finance', null, [
        comp('ndc_cost', 'NDC Implementation Cost', '$2.8T (2020-2030)', null, [
          leaf('conditional_ndc', 'Conditional NDC Cost', '$2.1T', 'Country NDCs', 2),
          leaf('unconditional_ndc', 'Unconditional NDC Cost', '$0.7T', 'Country NDCs', 2),
        ]),
        comp('finance_committed', 'Finance Committed', '$13B/yr', null, [
          leaf('mdb_committed', 'MDB Commitments', '$8B/yr', 'MDB Joint Report', 1),
          leaf('bilateral_committed', 'Bilateral Commitments', '$5B/yr', 'OECD DAC', 1),
        ]),
      ], ['UNFCCC NDC Registry', 'OECD DAC', 'AfDB'], 'Africa NDC financing gap'),

      m('concessional_share_af', 'Concessional Share', 'Concessional % of total climate finance', null, [
        comp('grant_share', 'Grant Share', '28%', null, [
          leaf('gcf_grants', 'GCF Grants', '$1.8B', 'GCF', 1),
          leaf('bilateral_grants', 'Bilateral Grants', '$2.4B', 'OECD DAC', 1),
        ]),
        comp('concessional_loan', 'Concessional Loans', '42%', null, [
          leaf('ida_loans', 'IDA Concessional', '$3.2B', 'World Bank', 1),
          leaf('afdb_concess', 'AfDB Concessional', '$2.8B', 'AfDB', 1),
        ]),
      ], ['OECD DAC', 'GCF', 'World Bank IDA'], 'Concessionality of climate finance'),

      m('pipeline_af', 'Pipeline', 'Climate project pipeline in Africa', null, [
        comp('bankable_projects', 'Bankable Projects', '142', null, [
          leaf('re_projects_af', 'Renewable Energy', '68 projects', 'AFREC/IRENA', 2),
          leaf('adapt_projects_af', 'Adaptation Projects', '48 projects', 'GCA Pipeline', 2),
          leaf('forestry_projects_af', 'Forestry/REDD+', '26 projects', 'Verra/GS', 2),
        ]),
        comp('pipeline_value', 'Pipeline Value', '$28B', null, [
          leaf('early_stage_af', 'Early Stage', '$12B', 'CPI', 3),
          leaf('advanced_stage_af', 'Advanced Stage', '$16B', 'AfDB/DFIs', 2),
        ]),
      ], ['African Development Bank', 'CPI', 'GCA'], 'Africa climate project pipeline'),
    ],
  },

  '/article6-markets-expanded': {
    moduleCode: 'EM-004', sprint: 'EM-EXP',
    metrics: [
      m('itmo_pricing', 'ITMO Pricing Intelligence', 'Price discovery across Article 6 mechanisms', null, [
        comp('art62_prices', 'Article 6.2 Bilateral Prices', null, null, [
          comp('swiss_pricing', 'Switzerland Bilateral', '$12-18/tCO\u2082e', null, [
            leaf('swiss_ghana', 'Switzerland-Ghana', '$15/tCO\u2082e', 'Swiss FOEN', 1),
            leaf('swiss_peru', 'Switzerland-Peru', '$12/tCO\u2082e', 'Swiss FOEN', 1),
            leaf('swiss_thai', 'Switzerland-Thailand', '$18/tCO\u2082e', 'Swiss FOEN', 1),
          ]),
          comp('japan_jcm_pricing', 'Japan JCM Prices', '$8-15/tCO\u2082e', null, [
            leaf('jcm_indonesia', 'JCM Indonesia', '$10/tCO\u2082e', 'JCM Registry', 1),
            leaf('jcm_mongolia', 'JCM Mongolia', '$8/tCO\u2082e', 'JCM Registry', 1),
          ]),
        ]),
        comp('art64_prices', 'Article 6.4 Prices', '$6-12/tCO\u2082e', null, [
          leaf('a64_renewable', 'Renewable Energy', '$8/tCO\u2082e', 'UNFCCC SB', 2),
          leaf('a64_efficiency', 'Energy Efficiency', '$6/tCO\u2082e', 'UNFCCC SB', 2),
        ]),
      ], ['UNFCCC', 'World Bank PMR', 'IGES CDM/A6 DB'], 'Article 6 ITMO price discovery'),

      m('bilateral_deals_exp', 'Bilateral Deal Tracker', 'Comprehensive bilateral agreement status', null, [
        comp('signed_bilateral', 'Signed Agreements', '38', null, [
          leaf('europe_bilateral', 'European Buyers', '22', 'UNFCCC', 1),
          leaf('asia_bilateral', 'Asian Buyers', '12', 'UNFCCC', 1),
          leaf('other_bilateral', 'Other Buyers', '4', 'UNFCCC', 1),
        ]),
        comp('ca_status', 'Corresponding Adjustment Status', null, null, [
          leaf('ca_applied', 'CA Applied', '18 deals', 'National Registries', 1),
          leaf('ca_pending', 'CA Pending', '14 deals', 'Country Reports', 2),
          leaf('ca_not_needed', 'Non-CA (pre-2021)', '6 deals', 'UNFCCC', 1),
        ]),
      ], ['UNFCCC Article 6 Registry', 'World Bank PMR'], 'Bilateral deal status & CA tracking'),
    ],
  },

  '/pitch': {
    moduleCode: 'R-005', sprint: 'REF',
    metrics: [
      m('platform_stats', 'Platform Statistics', 'Overall coverage metrics', null, [
        comp('module_count', 'Total Modules', '532+', null, [
          leaf('financial_mods', 'Financial Modules', '120+', 'Platform', 1),
          leaf('energy_mods', 'Energy Modules', '85+', 'Platform', 1),
          leaf('other_mods', 'Other Modules', '327+', 'Platform', 1),
        ]),
        comp('data_sources', 'Data Sources', '30+', null, [
          leaf('public_sources', 'Public Sources', '18', 'Platform', 1),
          leaf('proprietary', 'Licensed Sources', '12+', 'Platform', 1),
        ]),
      ], ['Platform Internal'], 'A\u00b2 Intelligence platform overview'),

      m('engine_results', 'Engine Results', 'Sample calculation outputs', null, [
        comp('pcaf_result', 'PCAF Engine', '223.5M tCO\u2082e FE', null, [
          leaf('pcaf_scope', 'Scope Coverage', 'S1+S2+S3', 'PCAF v3', 1),
        ]),
        comp('taxonomy_result', 'EU Taxonomy', '22% aligned', null, [
          leaf('tax_method', 'Method', 'SC + DNSH + MSS', 'EU Taxonomy Reg', 1),
        ]),
        comp('itr_result', 'Temperature Engine', '2.4\u00b0C portfolio', null, [
          leaf('itr_method', 'Method', 'SDA + PACTA', 'SBTi/PACTA', 1),
        ]),
      ], ['Platform Engines'], 'Headline results for pitch'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // PORTFOLIO & INVESTMENT (15 modules)
  // ═══════════════════════════════════════════════════════════════════
  '/portfolio-manager': {
    moduleCode: 'PM-001', sprint: 'CORE',
    metrics: [
      m('total_aum', 'Total AUM', 'Sum of all position market values', null, [
        comp('equity_aum', 'Equity AUM', '$4.2B', 0.55, [
          leaf('eq_positions', 'Equity Positions', '342', 'Custodian Feed', 1),
          leaf('eq_nav', 'Equity NAV', '$4.2B', 'Bloomberg AIM', 1),
          leaf('eq_cash', 'Cash & Equivalents', '$120M', 'Treasury System', 1),
        ]),
        comp('fi_aum', 'Fixed Income AUM', '$2.8B', 0.35, [
          leaf('fi_positions', 'Bond Positions', '189', 'Custodian Feed', 1),
          leaf('fi_nav', 'FI NAV', '$2.8B', 'Bloomberg PORT', 1),
        ]),
        comp('alt_aum', 'Alternatives AUM', '$0.8B', 0.10, [
          leaf('pe_nav', 'Private Equity NAV', '$0.5B', 'GP Statements', 3),
          leaf('re_nav', 'Real Estate NAV', '$0.3B', 'Appraisal', 3),
        ]),
      ], ['Bloomberg AIM', 'Custodian', 'GP Reports'], 'Aggregated AUM across asset classes'),

      m('allocation', 'Asset Allocation', 'Weight_i = MV_i / Total AUM', null, [
        comp('strategic', 'Strategic Allocation', null, null, [
          leaf('saa_equity', 'SAA Equity', '55%', 'IPS Document', 1),
          leaf('saa_fi', 'SAA Fixed Income', '35%', 'IPS Document', 1),
          leaf('saa_alt', 'SAA Alternatives', '10%', 'IPS Document', 1),
        ]),
        comp('tactical', 'Tactical Deviation', null, null, [
          leaf('taa_equity', 'TAA Equity Tilt', '+2.1%', 'CIO View', 2),
          leaf('taa_fi', 'TAA FI Tilt', '-1.5%', 'CIO View', 2),
        ]),
      ], ['IPS', 'CIO Research'], 'SAA vs TAA allocation framework'),

      m('risk_return', 'Risk-Return Profile', 'Return / Volatility annualized', null, [
        comp('ann_return', 'Annualized Return', '8.7%', null, [
          leaf('ytd_ret', 'YTD Return', '5.2%', 'Bloomberg', 1),
          leaf('ret_3y', '3Y Ann. Return', '9.1%', 'Bloomberg', 1),
        ]),
        comp('ann_vol', 'Annualized Volatility', '12.4%', null, [
          leaf('daily_vol', 'Daily Vol', '0.78%', 'Bloomberg', 1),
          leaf('vol_3y', '3Y Ann. Vol', '13.1%', 'Bloomberg', 1),
        ]),
      ], ['Bloomberg PORT', 'Risk System'], 'Annualized risk-return metrics'),

      m('sharpe', 'Sharpe Ratio', '(R_p - R_f) / sigma_p', null, [
        leaf('portfolio_ret', 'Portfolio Return', '8.7%', 'Bloomberg', 1),
        leaf('risk_free', 'Risk-Free Rate', '4.5%', 'US Treasury 10Y', 1),
        leaf('portfolio_vol', 'Portfolio Vol', '12.4%', 'Risk System', 1),
      ], ['Bloomberg', 'US Treasury'], 'Risk-adjusted return metric'),

      m('drawdown', 'Max Drawdown', 'Max(Peak - Trough) / Peak', null, [
        leaf('peak_date', 'Peak Date', '2025-01-15', 'Bloomberg', 1),
        leaf('trough_date', 'Trough Date', '2025-03-22', 'Bloomberg', 1),
        leaf('dd_pct', 'Drawdown %', '-14.2%', 'Bloomberg', 1),
      ], ['Bloomberg'], 'Peak-to-trough drawdown analysis'),
    ],
  },

  '/portfolio-optimizer': {
    moduleCode: 'PM-002', sprint: 'CORE',
    metrics: [
      m('efficient_frontier', 'Efficient Frontier', 'min sigma^2 s.t. E[R]=target', null, [
        comp('min_var', 'Min Variance Portfolio', null, null, [
          leaf('mv_return', 'MV Return', '6.2%', 'Optimization Engine', 2),
          leaf('mv_vol', 'MV Volatility', '8.1%', 'Optimization Engine', 2),
          leaf('mv_sharpe', 'MV Sharpe', '0.21', 'Optimization Engine', 2),
        ]),
        comp('max_sharpe', 'Max Sharpe Portfolio', null, null, [
          leaf('ms_return', 'MS Return', '9.4%', 'Optimization Engine', 2),
          leaf('ms_vol', 'MS Volatility', '11.8%', 'Optimization Engine', 2),
          leaf('ms_sharpe', 'MS Sharpe', '0.42', 'Optimization Engine', 2),
        ]),
        comp('tangency', 'Tangency Portfolio', null, null, [
          leaf('tang_weights', 'Optimal Weights', null, 'Markowitz MVO', 2),
          leaf('tang_constraints', 'Active Constraints', '3 of 12', 'Optimizer', 2),
        ]),
      ], ['Bloomberg', 'Covariance Matrix'], 'Mean-variance optimization (Markowitz)'),

      m('constraint_sat', 'Constraint Satisfaction', 'Feasibility check across all constraints', null, [
        comp('weight_constraints', 'Weight Constraints', '12 active', null, [
          leaf('min_weight', 'Min Weight', '0.5%', 'IPS', 1),
          leaf('max_weight', 'Max Weight', '10%', 'IPS', 1),
        ]),
        comp('sector_constraints', 'Sector Constraints', '8 active', null, [
          leaf('max_sector', 'Max Sector', '25%', 'IPS', 1),
          leaf('min_sector', 'Min Sector', '5%', 'IPS', 1),
        ]),
        comp('esg_constraints', 'ESG Constraints', '4 active', null, [
          leaf('min_esg', 'Min ESG Score', '60', 'MSCI ESG', 2),
          leaf('max_carbon', 'Max Carbon Intensity', '100 tCO2e/M', 'CDP', 2),
        ]),
      ], ['IPS', 'MSCI ESG', 'CDP'], 'Multi-constraint portfolio optimization'),

      m('turnover', 'Rebalance Turnover', 'Sum |w_new - w_old| / 2', null, [
        leaf('one_way', 'One-Way Turnover', '8.2%', 'Optimizer', 2),
        leaf('trade_cost', 'Est. Trade Cost', '$1.2M', 'TCA Model', 3),
        leaf('tax_impact', 'Tax Impact', '$0.4M', 'Tax Lot Engine', 3),
      ], ['Optimizer', 'TCA'], 'Turnover and transaction cost analysis'),
    ],
  },

  '/portfolio-suite': {
    moduleCode: 'PM-003', sprint: 'CORE',
    metrics: [
      m('multi_asset', 'Multi-Asset Allocation', 'Strategic + Tactical overlay', null, [
        comp('equity_alloc', 'Equity Allocation', '52%', 0.52, [
          leaf('dm_equity', 'DM Equity', '38%', 'MSCI World', 1),
          leaf('em_equity', 'EM Equity', '14%', 'MSCI EM', 1),
        ]),
        comp('fi_alloc', 'Fixed Income', '30%', 0.30, [
          leaf('ig_bonds', 'IG Bonds', '20%', 'Bloomberg Agg', 1),
          leaf('hy_bonds', 'HY Bonds', '10%', 'ICE BofA HY', 1),
        ]),
        comp('alt_alloc', 'Alternatives', '18%', 0.18, [
          leaf('re_alloc', 'Real Estate', '8%', 'NCREIF', 2),
          leaf('cmdty', 'Commodities', '5%', 'Bloomberg BCOM', 1),
          leaf('hedge', 'Hedge Funds', '5%', 'HFRI', 2),
        ]),
      ], ['MSCI', 'Bloomberg', 'NCREIF'], 'Multi-asset allocation framework'),

      m('rebalancing', 'Rebalancing Analysis', 'Drift monitoring and trigger-based rebalancing', null, [
        comp('drift', 'Current Drift', '3.2%', null, [
          leaf('max_drift', 'Max Single Drift', '4.1% (EM Equity)', 'Portfolio System', 1),
          leaf('avg_drift', 'Avg Drift', '1.8%', 'Portfolio System', 1),
        ]),
        comp('trigger', 'Rebalance Trigger', 'Calendar + Threshold', null, [
          leaf('threshold', 'Drift Threshold', '5%', 'IPS', 1),
          leaf('calendar', 'Calendar Frequency', 'Quarterly', 'IPS', 1),
        ]),
      ], ['IPS', 'Portfolio System'], 'Drift-based rebalancing framework'),

      m('tracking_error', 'Tracking Error', 'sqrt(Var(R_p - R_b))', null, [
        comp('ex_ante_te', 'Ex-Ante TE', '1.8%', null, [
          leaf('factor_te', 'Factor TE', '1.2%', 'Barra', 2),
          leaf('specific_te', 'Specific TE', '1.3%', 'Barra', 2),
        ]),
        comp('ex_post_te', 'Ex-Post TE (3Y)', '2.1%', null, [
          leaf('active_ret', 'Active Return', '0.9%', 'Bloomberg', 1),
          leaf('info_ratio', 'Information Ratio', '0.43', 'Bloomberg', 1),
        ]),
      ], ['Barra', 'Bloomberg'], 'Tracking error decomposition'),
    ],
  },

  '/holdings-deep-dive': {
    moduleCode: 'PM-004', sprint: 'CORE',
    metrics: [
      m('attribution', 'Return Attribution', 'Brinson-Fachler decomposition', null, [
        comp('allocation_effect', 'Allocation Effect', '+0.32%', null, [
          leaf('sector_alloc', 'Sector Allocation', '+0.18%', 'Brinson Model', 2),
          leaf('country_alloc', 'Country Allocation', '+0.14%', 'Brinson Model', 2),
        ]),
        comp('selection_effect', 'Selection Effect', '+0.55%', null, [
          leaf('stock_select', 'Stock Selection', '+0.48%', 'Brinson Model', 2),
          leaf('interaction', 'Interaction', '+0.07%', 'Brinson Model', 2),
        ]),
      ], ['Brinson-Fachler', 'Bloomberg'], 'Brinson-Fachler return attribution'),

      m('factor_exposure', 'Factor Exposure', 'Beta to systematic factors', null, [
        comp('style_factors', 'Style Factors', null, null, [
          leaf('momentum', 'Momentum Beta', '0.12', 'Barra', 2),
          leaf('value', 'Value Beta', '-0.08', 'Barra', 2),
          leaf('quality', 'Quality Beta', '0.22', 'Barra', 2),
        ]),
        comp('macro_factors', 'Macro Factors', null, null, [
          leaf('rate_beta', 'Interest Rate Beta', '-0.15', 'Barra', 2),
          leaf('credit_beta', 'Credit Beta', '0.18', 'Barra', 2),
        ]),
      ], ['Barra USE4', 'Bloomberg'], 'Multi-factor exposure analysis'),

      m('concentration', 'Concentration Risk', 'HHI = Sum(w_i^2)', null, [
        leaf('hhi', 'HHI Score', '0.042', 'Portfolio System', 1),
        leaf('top10', 'Top 10 Weight', '38.2%', 'Portfolio System', 1),
        leaf('single_max', 'Largest Holding', '5.1%', 'Portfolio System', 1),
      ], ['Portfolio System'], 'Herfindahl-Hirschman concentration index'),
    ],
  },

  '/risk-attribution': {
    moduleCode: 'PM-005', sprint: 'CORE',
    metrics: [
      m('risk_decomp', 'Risk Decomposition', 'Total Risk = Factor + Specific', null, [
        comp('factor_risk', 'Factor Risk', '10.2%', 0.68, [
          leaf('style_risk', 'Style Factor Risk', '5.1%', 'Barra', 2),
          leaf('industry_risk', 'Industry Risk', '3.8%', 'Barra', 2),
          leaf('country_risk', 'Country Risk', '1.3%', 'Barra', 2),
        ]),
        comp('specific_risk', 'Specific Risk', '7.4%', 0.32, [
          leaf('idio_risk', 'Idiosyncratic Risk', '7.4%', 'Barra', 2),
          leaf('top_contrib', 'Top Risk Contributor', '1.2% (AAPL)', 'Barra', 2),
        ]),
      ], ['Barra USE4', 'Bloomberg'], 'Factor vs specific risk decomposition'),

      m('sector_risk', 'Sector Risk Contribution', 'MCTR_s = beta_s * sigma_p', null, [
        comp('tech_risk', 'Technology MCTR', '3.2%', null, [
          leaf('tech_weight', 'Tech Weight', '28%', 'Portfolio', 1),
          leaf('tech_beta', 'Tech Beta', '1.15', 'Barra', 2),
        ]),
        comp('fin_risk', 'Financials MCTR', '2.1%', null, [
          leaf('fin_weight', 'Financials Weight', '18%', 'Portfolio', 1),
          leaf('fin_beta', 'Financials Beta', '1.08', 'Barra', 2),
        ]),
        comp('energy_risk', 'Energy MCTR', '1.8%', null, [
          leaf('energy_weight', 'Energy Weight', '8%', 'Portfolio', 1),
          leaf('energy_beta', 'Energy Beta', '1.32', 'Barra', 2),
        ]),
      ], ['Barra', 'Bloomberg'], 'Marginal contribution to total risk by sector'),

      m('geo_risk', 'Geographic Risk', 'Risk contribution by geography', null, [
        comp('us_risk', 'US Risk', '62%', null, [
          leaf('us_exposure', 'US Exposure', '58%', 'Bloomberg', 1),
          leaf('us_vol', 'US Vol Contribution', '7.8%', 'Barra', 2),
        ]),
        comp('eu_risk', 'Europe Risk', '24%', null, [
          leaf('eu_exposure', 'EU Exposure', '26%', 'Bloomberg', 1),
          leaf('eu_vol', 'EU Vol Contribution', '3.1%', 'Barra', 2),
        ]),
      ], ['Barra', 'Bloomberg'], 'Geographic risk decomposition'),
    ],
  },

  '/fixed-income-esg': {
    moduleCode: 'PM-006', sprint: 'CORE',
    metrics: [
      m('green_bond_yield', 'Green Bond Yield', 'YTM of green-labeled holdings', null, [
        comp('gb_spread', 'Green Bond Spread', '-8bps', null, [
          leaf('gb_ytm', 'Green Bond YTM', '4.12%', 'Bloomberg', 1),
          leaf('conv_ytm', 'Conventional YTM', '4.20%', 'Bloomberg', 1),
          leaf('greenium', 'Greenium', '-8bps', 'CBI', 2),
        ]),
        comp('gb_volume', 'Green Bond Allocation', '$420M', null, [
          leaf('gb_pct', 'Green Bond %', '15%', 'Portfolio', 1),
          leaf('gb_issuers', 'Green Issuers', '28', 'CBI', 1),
        ]),
      ], ['Bloomberg', 'Climate Bonds Initiative'], 'Green bond yield and greenium analysis'),

      m('fi_duration', 'Climate-Adjusted Duration', 'ModDur + climate spread adjustment', null, [
        comp('mod_dur', 'Modified Duration', '5.8yr', null, [
          leaf('eff_dur', 'Effective Duration', '5.6yr', 'Bloomberg', 1),
          leaf('key_rate', 'Key Rate Duration (10Y)', '3.2yr', 'Bloomberg', 1),
        ]),
        comp('climate_dur', 'Climate Duration Add-On', '+0.3yr', null, [
          leaf('trans_spread', 'Transition Spread', '+15bps', 'Internal Model', 3),
          leaf('phys_spread', 'Physical Risk Spread', '+8bps', 'Internal Model', 3),
        ]),
      ], ['Bloomberg', 'Internal Model'], 'Duration with climate spread overlay'),

      m('fi_esg_tilt', 'ESG Tilt Score', 'Portfolio ESG vs Benchmark', null, [
        leaf('port_esg', 'Portfolio ESG Score', '72', 'MSCI ESG', 2),
        leaf('bench_esg', 'Benchmark ESG Score', '65', 'MSCI ESG', 2),
        leaf('esg_tilt', 'ESG Tilt', '+7', 'MSCI ESG', 2),
      ], ['MSCI ESG', 'Bloomberg'], 'ESG tilt relative to benchmark'),
    ],
  },

  '/esg-screener': {
    moduleCode: 'PM-007', sprint: 'CORE',
    metrics: [
      m('screening', 'Screening Coverage', 'Pass/Fail across screening criteria', null, [
        comp('exclusion', 'Exclusion Screen', '98.2% pass', null, [
          leaf('tobacco', 'Tobacco Free', '100%', 'MSCI ESG', 2),
          leaf('weapons', 'Controversial Weapons', '99.8%', 'MSCI ESG', 2),
          leaf('thermal_coal', 'Thermal Coal <5%', '96.1%', 'Urgewald GCEL', 1),
        ]),
        comp('inclusion', 'Inclusion Criteria', '82% pass', null, [
          leaf('esg_min', 'Min ESG Score >50', '92%', 'MSCI ESG', 2),
          leaf('ungc', 'UNGC Compliance', '88%', 'UNGC Database', 1),
        ]),
        comp('norms_based', 'Norms-Based Screen', '95% pass', null, [
          leaf('ungc_violators', 'UNGC Violators', '2 flagged', 'UNGC', 1),
          leaf('controversy', 'Red Controversy', '3 flagged', 'MSCI ESG', 2),
        ]),
      ], ['MSCI ESG', 'Urgewald GCEL', 'UNGC'], 'Multi-criteria ESG screening framework'),

      m('coverage', 'ESG Data Coverage', 'Pct of holdings with ESG data', null, [
        leaf('esg_rated', 'ESG Rated %', '94%', 'MSCI ESG', 2),
        leaf('carbon_covered', 'Carbon Data %', '89%', 'CDP / S&P Trucost', 2),
        leaf('controversy_covered', 'Controversy Covered', '91%', 'RepRisk', 2),
      ], ['MSCI ESG', 'CDP', 'RepRisk'], 'ESG data coverage metrics'),
    ],
  },

  '/esg-backtesting': {
    moduleCode: 'PM-008', sprint: 'CORE',
    metrics: [
      m('backtest_alpha', 'ESG Alpha', 'R_esg - R_benchmark (annualized)', null, [
        comp('gross_alpha', 'Gross Alpha', '+1.2%', null, [
          leaf('esg_ret', 'ESG Portfolio Return', '10.1%', 'Backtest Engine', 2),
          leaf('bench_ret', 'Benchmark Return', '8.9%', 'Bloomberg', 1),
        ]),
        comp('net_alpha', 'Net Alpha (after costs)', '+0.8%', null, [
          leaf('trade_costs', 'Trading Costs', '-0.3%', 'TCA Model', 3),
          leaf('rebal_freq', 'Rebalance Frequency', 'Quarterly', 'Backtest Config', 1),
        ]),
      ], ['Bloomberg', 'Backtest Engine'], 'ESG strategy backtest alpha analysis'),

      m('backtest_te', 'Tracking Error', 'Annualized TE vs benchmark', null, [
        leaf('te_ann', 'Annualized TE', '2.4%', 'Backtest Engine', 2),
        leaf('info_ratio', 'Information Ratio', '0.50', 'Backtest Engine', 2),
        leaf('max_dd', 'Max Drawdown', '-12.8%', 'Backtest Engine', 2),
      ], ['Backtest Engine'], 'Tracking error and risk-adjusted metrics'),

      m('backtest_ir', 'Information Ratio', 'Alpha / TE', null, [
        leaf('ir_1y', '1Y IR', '0.62', 'Backtest Engine', 2),
        leaf('ir_3y', '3Y IR', '0.48', 'Backtest Engine', 2),
        leaf('ir_5y', '5Y IR', '0.51', 'Backtest Engine', 2),
      ], ['Backtest Engine'], 'Rolling information ratio analysis'),
    ],
  },

  '/monte-carlo-var': {
    moduleCode: 'PM-009', sprint: 'CORE',
    metrics: [
      m('var_dist', 'VaR Distribution', 'Simulated portfolio loss distribution', null, [
        comp('var_95', 'VaR (95%)', '-3.2%', null, [
          leaf('sim_count', 'Simulations', '100,000', 'MC Engine', 2),
          leaf('var_95_abs', 'VaR 95 Absolute', '-$248M', 'MC Engine', 2),
        ]),
        comp('var_99', 'VaR (99%)', '-5.1%', null, [
          leaf('var_99_abs', 'VaR 99 Absolute', '-$395M', 'MC Engine', 2),
          leaf('cvar_99', 'CVaR (99%)', '-6.8%', 'MC Engine', 2),
        ]),
        comp('stress_var', 'Stressed VaR', '-7.4%', null, [
          leaf('stress_period', 'Stress Period', 'GFC 2008', 'Historical', 1),
          leaf('stress_abs', 'Stressed VaR Abs', '-$574M', 'MC Engine', 2),
        ]),
      ], ['MC Engine', 'Bloomberg'], 'Monte Carlo VaR simulation engine'),

      m('confidence', 'Confidence Intervals', 'VaR at multiple confidence levels', null, [
        leaf('ci_90', 'VaR 90%', '-2.4%', 'MC Engine', 2),
        leaf('ci_95', 'VaR 95%', '-3.2%', 'MC Engine', 2),
        leaf('ci_99', 'VaR 99%', '-5.1%', 'MC Engine', 2),
      ], ['MC Engine'], 'Multi-confidence VaR estimates'),

      m('tail_risk', 'Tail Risk Metrics', 'Beyond-VaR tail analysis', null, [
        leaf('expected_shortfall', 'Expected Shortfall (99%)', '-6.8%', 'MC Engine', 2),
        leaf('tail_index', 'Tail Index (Hill)', '3.2', 'EVT Model', 3),
        leaf('max_loss', 'Max Simulated Loss', '-14.2%', 'MC Engine', 2),
      ], ['MC Engine', 'EVT Model'], 'Extreme value theory tail metrics'),
    ],
  },

  '/copula-tail-risk': {
    moduleCode: 'PM-010', sprint: 'CORE',
    metrics: [
      m('tail_dep', 'Tail Dependence', 'lambda_L = lim P(U<u|V<u) as u->0', null, [
        comp('lower_tail', 'Lower Tail Dependence', '0.38', null, [
          leaf('copula_type', 'Copula Family', 'Clayton', 'Copula Fit', 3),
          leaf('theta', 'Theta Parameter', '2.1', 'MLE Estimation', 3),
        ]),
        comp('upper_tail', 'Upper Tail Dependence', '0.12', null, [
          leaf('gumbel_param', 'Gumbel Parameter', '1.4', 'MLE Estimation', 3),
          leaf('kendall_tau', 'Kendall Tau', '0.45', 'Empirical', 2),
        ]),
      ], ['Copula Model', 'Bloomberg'], 'Copula-based tail dependence estimation'),

      m('joint_exceed', 'Joint Exceedance', 'P(X>q, Y>q) for sector pairs', null, [
        comp('tech_fin', 'Tech-Financials Joint', '0.18', null, [
          leaf('pair_corr', 'Tail Correlation', '0.42', 'Empirical', 2),
          leaf('joint_var', 'Joint VaR', '-8.2%', 'Copula Model', 3),
        ]),
        comp('energy_util', 'Energy-Utilities Joint', '0.31', null, [
          leaf('pair_corr2', 'Tail Correlation', '0.58', 'Empirical', 2),
          leaf('joint_var2', 'Joint VaR', '-11.4%', 'Copula Model', 3),
        ]),
      ], ['Copula Model', 'Bloomberg'], 'Joint exceedance probability analysis'),

      m('systemic', 'Systemic Risk Contribution', 'CoVaR and MES metrics', null, [
        leaf('covar', 'CoVaR', '-5.8%', 'Adrian-Brunnermeier', 3),
        leaf('delta_covar', 'Delta CoVaR', '-2.1%', 'Adrian-Brunnermeier', 3),
        leaf('mes', 'Marginal Expected Shortfall', '-4.2%', 'Acharya Model', 3),
      ], ['Adrian-Brunnermeier', 'Acharya MES'], 'Systemic risk contribution metrics'),
    ],
  },

  '/implied-temp-regression': {
    moduleCode: 'PM-011', sprint: 'CORE',
    metrics: [
      m('itr_regression', 'ITR Regression Model', 'ITR = alpha + beta_1*EmInt + beta_2*Target + eps', null, [
        comp('model_fit', 'Model Fit', null, null, [
          leaf('r_squared', 'R-Squared', '0.72', 'Cross-Section Regression', 2),
          leaf('adj_r2', 'Adjusted R-Squared', '0.69', 'Cross-Section Regression', 2),
          leaf('f_stat', 'F-Statistic', '84.2', 'Cross-Section Regression', 2),
        ]),
        comp('coefficients', 'Coefficients', null, null, [
          leaf('beta_emint', 'Emission Intensity Beta', '0.0024', 'Regression', 2),
          leaf('beta_target', 'SBTi Target Beta', '-0.42', 'Regression', 2),
          leaf('beta_capex', 'Green CapEx Beta', '-0.18', 'Regression', 2),
        ]),
      ], ['CDP', 'SBTi', 'Company Reports'], 'Cross-sectional ITR regression model'),

      m('factor_sig', 'Factor Significance', 'p-values and confidence intervals', null, [
        leaf('p_emint', 'Emission Intensity p-value', '<0.001', 'Regression', 2),
        leaf('p_target', 'SBTi Target p-value', '<0.001', 'Regression', 2),
        leaf('p_capex', 'Green CapEx p-value', '0.024', 'Regression', 2),
      ], ['Regression Model'], 'Statistical significance of ITR drivers'),

      m('itr_predict', 'ITR Prediction', 'Predicted vs actual ITR', null, [
        leaf('rmse', 'RMSE', '0.31C', 'Model Validation', 2),
        leaf('mae', 'MAE', '0.24C', 'Model Validation', 2),
        leaf('coverage', 'Prediction Coverage', '1,842 companies', 'CDP/SBTi', 2),
      ], ['Model Validation'], 'ITR prediction accuracy metrics'),
    ],
  },

  '/temperature-alignment': {
    moduleCode: 'PM-012', sprint: 'CORE',
    metrics: [
      m('port_temp', 'Portfolio Temperature', 'WATS = Sum(w_i * ITR_i)', null, [
        comp('equity_temp', 'Equity Temperature', '2.4C', null, [
          leaf('eq_coverage', 'Coverage', '92%', 'CDP / SBTi', 2),
          leaf('eq_weighted', 'WATS (Equity)', '2.4C', 'SBTi Method', 2),
        ]),
        comp('fi_temp', 'Fixed Income Temperature', '2.1C', null, [
          leaf('fi_coverage', 'Coverage', '78%', 'CDP / SBTi', 2),
          leaf('fi_weighted', 'WATS (FI)', '2.1C', 'SBTi Method', 2),
        ]),
        comp('total_temp', 'Total Portfolio', '2.3C', null, [
          leaf('method', 'Aggregation Method', 'WATS', 'SBTi', 1),
          leaf('benchmark', 'Benchmark Temp', '2.8C', 'SBTi/PACTA', 2),
        ]),
      ], ['SBTi', 'CDP', 'PACTA'], 'SBTi portfolio temperature alignment'),

      m('company_align', 'Company Alignment', 'Individual company ITR scores', null, [
        leaf('aligned_15', '1.5C Aligned %', '18%', 'SBTi', 2),
        leaf('aligned_2', '2C Aligned %', '42%', 'SBTi', 2),
        leaf('above_3', 'Above 3C %', '24%', 'SBTi', 2),
      ], ['SBTi', 'CDP'], 'Company-level temperature alignment distribution'),

      m('pathway', 'Pathway Comparison', 'Portfolio trajectory vs NGFS pathways', null, [
        leaf('nz2050', 'NZ2050 Gap', '+0.8C', 'NGFS', 1),
        leaf('delayed', 'Delayed Transition Gap', '+0.3C', 'NGFS', 1),
        leaf('current_pol', 'Current Policies Gap', '-0.5C', 'NGFS', 1),
      ], ['NGFS Phase 5'], 'Pathway comparison analysis'),
    ],
  },

  '/stewardship-tracker': {
    moduleCode: 'PM-013', sprint: 'CORE',
    metrics: [
      m('engagement', 'Engagement Outcomes', 'Success rate of engagement activities', null, [
        comp('climate_engage', 'Climate Engagements', null, null, [
          leaf('engage_total', 'Total Engagements', '142', 'Stewardship Team', 1),
          leaf('engage_success', 'Successful', '68', 'Stewardship Team', 1),
          leaf('engage_rate', 'Success Rate', '48%', 'Stewardship Team', 1),
        ]),
        comp('social_engage', 'Social Engagements', null, null, [
          leaf('social_total', 'Total', '58', 'Stewardship Team', 1),
          leaf('social_success', 'Successful', '31', 'Stewardship Team', 1),
        ]),
        comp('gov_engage', 'Governance Engagements', null, null, [
          leaf('gov_total', 'Total', '94', 'Stewardship Team', 1),
          leaf('gov_success', 'Successful', '52', 'Stewardship Team', 1),
        ]),
      ], ['Stewardship Team', 'PRI'], 'Engagement outcome tracking'),

      m('voting', 'Voting Record', 'Proxy voting statistics', null, [
        leaf('votes_cast', 'Votes Cast', '4,218', 'ISS / Glass Lewis', 1),
        leaf('against_mgmt', 'Against Management', '12.4%', 'ISS', 1),
        leaf('climate_resolutions', 'Climate Resolutions Supported', '82%', 'ISS', 1),
      ], ['ISS', 'Glass Lewis'], 'Proxy voting record analysis'),

      m('escalation', 'Escalation Actions', 'Escalation pathway tracking', null, [
        leaf('letters_sent', 'Letters Sent', '24', 'Stewardship Team', 1),
        leaf('co_filings', 'Co-Filed Resolutions', '8', 'SEC', 1),
        leaf('divestments', 'Escalation Divestments', '3', 'Portfolio', 1),
      ], ['Stewardship Team', 'SEC'], 'Engagement escalation tracking'),
    ],
  },

  '/controversy-monitor': {
    moduleCode: 'PM-014', sprint: 'CORE',
    metrics: [
      m('controversy_score', 'Portfolio Controversy Score', 'Weighted avg controversy level', null, [
        comp('env_controversy', 'Environmental Controversies', null, null, [
          leaf('env_count', 'Active Incidents', '12', 'RepRisk', 2),
          leaf('env_severity', 'Avg Severity', '3.2/5', 'RepRisk', 2),
        ]),
        comp('social_controversy', 'Social Controversies', null, null, [
          leaf('social_count', 'Active Incidents', '18', 'RepRisk', 2),
          leaf('social_severity', 'Avg Severity', '2.8/5', 'RepRisk', 2),
        ]),
        comp('gov_controversy', 'Governance Controversies', null, null, [
          leaf('gov_count', 'Active Incidents', '7', 'RepRisk', 2),
          leaf('gov_severity', 'Avg Severity', '3.5/5', 'RepRisk', 2),
        ]),
      ], ['RepRisk', 'MSCI ESG'], 'Multi-pillar controversy monitoring'),

      m('severity_trend', 'Severity Trend', 'Trailing 12M controversy severity', null, [
        leaf('peak_severity', 'Peak Severity (12M)', '4.1/5', 'RepRisk', 2),
        leaf('current_severity', 'Current Severity', '3.1/5', 'RepRisk', 2),
        leaf('trend', 'Trend Direction', 'Improving', 'RepRisk', 2),
      ], ['RepRisk'], 'Controversy severity trend analysis'),

      m('resolution', 'Resolution Rate', 'Pct of controversies resolved within 12M', null, [
        leaf('resolved', 'Resolved (12M)', '62%', 'RepRisk', 2),
        leaf('ongoing', 'Ongoing', '28%', 'RepRisk', 2),
        leaf('escalated', 'Escalated', '10%', 'RepRisk', 2),
      ], ['RepRisk', 'MSCI ESG'], 'Controversy resolution metrics'),
    ],
  },

  '/ai-sentiment': {
    moduleCode: 'PM-015', sprint: 'CORE',
    metrics: [
      m('nlp_sentiment', 'NLP Sentiment Score', 'Aggregate ESG sentiment from NLP pipeline', null, [
        comp('news_sent', 'News Sentiment', '0.62', null, [
          leaf('articles', 'Articles Analyzed', '12,400', 'News API', 2),
          leaf('pos_pct', 'Positive %', '48%', 'NLP Engine', 3),
          leaf('neg_pct', 'Negative %', '22%', 'NLP Engine', 3),
        ]),
        comp('filing_sent', 'Filing Sentiment', '0.55', null, [
          leaf('filings', 'Filings Analyzed', '842', 'SEC EDGAR', 1),
          leaf('risk_lang', 'Risk Language %', '18%', 'NLP Engine', 3),
        ]),
        comp('social_sent', 'Social Media Sentiment', '0.41', null, [
          leaf('posts', 'Posts Analyzed', '45,200', 'Social API', 4),
          leaf('engagement', 'Avg Engagement', '2.4K', 'Social API', 4),
        ]),
      ], ['News API', 'SEC EDGAR', 'NLP Engine'], 'Multi-source NLP sentiment analysis'),

      m('topic_extract', 'Topic Extraction', 'Key ESG topics from corpus', null, [
        leaf('top_env', 'Top Env Topic', 'Carbon Transition', 'NLP Engine', 3),
        leaf('top_social', 'Top Social Topic', 'Supply Chain Labor', 'NLP Engine', 3),
        leaf('top_gov', 'Top Gov Topic', 'Board Diversity', 'NLP Engine', 3),
      ], ['NLP Engine'], 'ESG topic extraction from unstructured text'),

      m('controversy_detect', 'Controversy Detection', 'Real-time controversy flagging', null, [
        leaf('new_flags', 'New Flags (7d)', '4', 'NLP Engine', 3),
        leaf('escalating', 'Escalating Risks', '2', 'NLP Engine', 3),
        leaf('resolved_auto', 'Auto-Resolved', '1', 'NLP Engine', 3),
      ], ['NLP Engine', 'RepRisk'], 'NLP-based controversy early warning'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // CLIMATE & PHYSICAL RISK (10 modules)
  // ═══════════════════════════════════════════════════════════════════
  '/climate-physical-risk': {
    moduleCode: 'CR-001', sprint: 'CLIM',
    metrics: [
      m('hazard_scores', 'Physical Hazard Scores', 'Composite hazard index by peril', null, [
        comp('acute_hazards', 'Acute Hazards', null, null, [
          leaf('flood_score', 'Flood Risk Score', '72/100', 'WRI Aqueduct', 1),
          leaf('cyclone_score', 'Cyclone Risk', '45/100', 'Munich Re NatCat', 1),
          leaf('wildfire', 'Wildfire Risk', '58/100', 'Copernicus EFFIS', 1),
        ]),
        comp('chronic_hazards', 'Chronic Hazards', null, null, [
          leaf('heat_stress', 'Heat Stress', '64/100', 'IPCC AR6 WGI', 1),
          leaf('sea_level', 'Sea Level Rise', '38/100', 'NASA JPL', 1),
          leaf('water_stress', 'Water Stress', '71/100', 'WRI Aqueduct', 1),
        ]),
      ], ['WRI Aqueduct', 'IPCC AR6', 'Munich Re'], 'Multi-peril physical hazard scoring'),

      m('asset_exposure', 'Asset Exposure', 'Portfolio assets in hazard zones', null, [
        leaf('high_risk_pct', 'High Risk Assets %', '18%', 'Geospatial Model', 3),
        leaf('medium_risk_pct', 'Medium Risk %', '34%', 'Geospatial Model', 3),
        leaf('insured_pct', 'Insured %', '72%', 'Insurance Data', 2),
      ], ['Geospatial Model', 'Insurance Data'], 'Asset-level exposure mapping'),

      m('adaptation_cost', 'Adaptation Cost', 'Estimated cost to mitigate physical risk', null, [
        comp('retrofit', 'Retrofit Cost', '$240M', null, [
          leaf('flood_adapt', 'Flood Adaptation', '$95M', 'Engineering Est.', 4),
          leaf('heat_adapt', 'Heat Adaptation', '$85M', 'Engineering Est.', 4),
          leaf('other_adapt', 'Other Perils', '$60M', 'Engineering Est.', 4),
        ]),
        comp('insurance', 'Insurance Premium', '$45M/yr', null, [
          leaf('current_prem', 'Current Premium', '$32M/yr', 'Broker Quotes', 2),
          leaf('projected_prem', 'Projected (2030)', '$45M/yr', 'Actuarial Model', 3),
        ]),
      ], ['Engineering Estimates', 'Actuarial Model'], 'Climate adaptation cost estimation'),
    ],
  },

  '/climate-transition-risk': {
    moduleCode: 'CR-002', sprint: 'CLIM',
    metrics: [
      m('transition_score', 'Transition Risk Score', 'Composite policy + tech + market risk', null, [
        comp('policy_risk', 'Policy Risk', '68/100', 0.40, [
          leaf('carbon_price_exp', 'Carbon Price Exposure', '$12.4M/yr', 'NGFS', 1),
          leaf('reg_stringency', 'Regulatory Stringency', '72/100', 'Climate Policy DB', 2),
        ]),
        comp('tech_risk', 'Technology Risk', '55/100', 0.35, [
          leaf('tech_obsol', 'Technology Obsolescence', '42%', 'IEA NZE', 2),
          leaf('capex_gap', 'Green CapEx Gap', '$2.1B', 'Company Filings', 2),
        ]),
        comp('market_risk', 'Market Risk', '61/100', 0.25, [
          leaf('demand_shift', 'Demand Shift Impact', '-8%', 'IEA WEO', 2),
          leaf('stranded_pct', 'Stranded Asset %', '15%', 'Carbon Tracker', 2),
        ]),
      ], ['NGFS', 'IEA', 'Carbon Tracker'], 'Multi-pillar transition risk framework'),

      m('sector_exposure', 'Sector Transition Exposure', 'Transition risk by sector', null, [
        leaf('energy_exp', 'Energy Sector', '82/100', 'Internal Model', 3),
        leaf('transport_exp', 'Transport Sector', '71/100', 'Internal Model', 3),
        leaf('materials_exp', 'Materials Sector', '68/100', 'Internal Model', 3),
        leaf('finance_exp', 'Financials Sector', '45/100', 'Internal Model', 3),
      ], ['Internal Model', 'NGFS'], 'Sector-level transition risk scores'),
    ],
  },

  '/physical-risk-pricing': {
    moduleCode: 'CR-003', sprint: 'CLIM',
    metrics: [
      m('risk_adj_price', 'Risk-Adjusted Pricing', 'NAV with physical risk discount', null, [
        comp('nav_base', 'Base NAV', '$7.8B', null, [
          leaf('asset_value', 'Gross Asset Value', '$8.2B', 'Appraisal', 2),
          leaf('liabilities', 'Liabilities', '$0.4B', 'Financial Stmts', 1),
        ]),
        comp('phys_discount', 'Physical Risk Discount', '-$620M', null, [
          leaf('expected_loss', 'Expected Annual Loss', '$45M', 'Cat Model', 3),
          leaf('discount_factor', 'Discount Factor', '13.8x', 'Actuarial', 3),
        ]),
      ], ['Cat Model', 'Actuarial Model'], 'Physical risk-adjusted NAV model'),

      m('insurance_cost', 'Insurance Cost Impact', 'Projected insurance cost under climate change', null, [
        leaf('current_premium', 'Current Premium', '$32M/yr', 'Broker', 2),
        leaf('2030_premium', '2030 Premium (RCP4.5)', '$48M/yr', 'Actuarial Model', 3),
        leaf('2050_premium', '2050 Premium (RCP8.5)', '$78M/yr', 'Actuarial Model', 3),
      ], ['Actuarial Model', 'Munich Re'], 'Forward-looking insurance cost projection'),

      m('nav_impact', 'NAV Impact by Scenario', 'Scenario-dependent NAV adjustment', null, [
        leaf('nav_rcp26', 'NAV Impact RCP2.6', '-4.2%', 'Scenario Model', 3),
        leaf('nav_rcp45', 'NAV Impact RCP4.5', '-7.8%', 'Scenario Model', 3),
        leaf('nav_rcp85', 'NAV Impact RCP8.5', '-14.1%', 'Scenario Model', 3),
      ], ['IPCC AR6', 'Scenario Model'], 'Scenario-based NAV sensitivity'),
    ],
  },

  '/climate-litigation': {
    moduleCode: 'CR-004', sprint: 'CLIM',
    metrics: [
      m('case_count', 'Litigation Case Count', 'Active climate litigation cases', null, [
        comp('by_type', 'By Case Type', null, null, [
          leaf('regulatory', 'Regulatory Actions', '42', 'Sabin Center / LSE', 1),
          leaf('shareholder', 'Shareholder Suits', '18', 'Sabin Center', 1),
          leaf('tort', 'Tort Claims', '24', 'Sabin Center', 1),
        ]),
        comp('by_jurisdiction', 'By Jurisdiction', null, null, [
          leaf('us_cases', 'US Cases', '38', 'Sabin Center', 1),
          leaf('eu_cases', 'EU Cases', '28', 'LSE Grantham', 1),
          leaf('apac_cases', 'APAC Cases', '18', 'LSE Grantham', 1),
        ]),
      ], ['Sabin Center', 'LSE Grantham'], 'Climate litigation case database'),

      m('exposure', 'Financial Exposure', 'Estimated financial liability', null, [
        leaf('total_claims', 'Total Claims', '$4.2B', 'Court Filings', 2),
        leaf('expected_loss', 'Expected Loss', '$1.8B', 'Legal Analysis', 4),
        leaf('provision', 'Current Provisions', '$0.9B', 'Company Filings', 2),
      ], ['Court Filings', 'Company Reports'], 'Climate litigation financial exposure'),

      m('precedent_risk', 'Precedent Risk', 'Impact of landmark rulings', null, [
        leaf('shell_ruling', 'Shell Netherlands Impact', 'High', 'Sabin Center', 1),
        leaf('urgenda', 'Urgenda Precedent', 'National Targets', 'LSE', 1),
        leaf('trend', 'Success Rate Trend', '62% claimant', 'LSE Grantham', 1),
      ], ['Sabin Center', 'LSE Grantham'], 'Legal precedent risk assessment'),
    ],
  },

  '/climate-derivatives': {
    moduleCode: 'CR-005', sprint: 'CLIM',
    metrics: [
      m('carbon_options', 'Carbon Options', 'EUA option pricing and Greeks', null, [
        comp('call_options', 'Call Options', null, null, [
          leaf('atm_call', 'ATM Call Premium', 'EUR 8.20', 'ICE Futures', 1),
          leaf('call_delta', 'Delta', '0.52', 'Black-Scholes', 2),
          leaf('call_iv', 'Implied Vol', '32%', 'ICE Futures', 1),
        ]),
        comp('put_options', 'Put Options', null, null, [
          leaf('atm_put', 'ATM Put Premium', 'EUR 7.40', 'ICE Futures', 1),
          leaf('put_delta', 'Delta', '-0.48', 'Black-Scholes', 2),
        ]),
      ], ['ICE Futures Europe', 'Black-Scholes'], 'Carbon option pricing model'),

      m('weather_deriv', 'Weather Derivatives', 'CDD/HDD-based weather hedges', null, [
        leaf('cdd_contract', 'CDD Contract Value', '$2.4M', 'CME Weather', 1),
        leaf('hdd_contract', 'HDD Contract Value', '$1.8M', 'CME Weather', 1),
        leaf('basis_risk', 'Basis Risk', '12%', 'Internal Model', 3),
      ], ['CME Weather', 'Internal Model'], 'Weather derivative pricing'),

      m('hedging_cost', 'Hedging Cost', 'Total cost of climate hedging program', null, [
        leaf('premium_paid', 'Premium Paid', '$4.8M', 'OTC/Exchange', 1),
        leaf('margin_req', 'Margin Requirement', '$12M', 'Exchange', 1),
        leaf('hedge_eff', 'Hedge Effectiveness', '78%', 'Internal Model', 3),
      ], ['Exchange Data', 'Internal Model'], 'Climate hedging cost analysis'),
    ],
  },

  '/climate-policy': {
    moduleCode: 'CR-006', sprint: 'CLIM',
    metrics: [
      m('policy_tracker', 'Policy Tracker', 'Global climate policy landscape', null, [
        comp('carbon_pricing', 'Carbon Pricing Policies', null, null, [
          leaf('ets_count', 'Active ETS', '36', 'World Bank CPLC', 1),
          leaf('tax_count', 'Carbon Taxes', '38', 'World Bank CPLC', 1),
          leaf('coverage', 'Global Coverage', '23%', 'World Bank CPLC', 1),
        ]),
        comp('regulatory', 'Regulatory Measures', null, null, [
          leaf('disclosure_mandates', 'Disclosure Mandates', '18', 'Climate Policy DB', 2),
          leaf('phase_outs', 'Fossil Phase-Outs', '12', 'Climate Policy DB', 2),
        ]),
      ], ['World Bank CPLC', 'Climate Policy DB'], 'Global climate policy monitoring'),

      m('carbon_price_forecast', 'Carbon Price Forecast', 'Forward carbon price projections', null, [
        leaf('eu_ets_2025', 'EU ETS 2025', 'EUR 72', 'NGFS', 1),
        leaf('eu_ets_2030', 'EU ETS 2030', 'EUR 120', 'NGFS', 1),
        leaf('global_avg_2030', 'Global Avg 2030', '$85', 'NGFS', 1),
      ], ['NGFS Phase 5', 'World Bank'], 'Carbon price trajectory forecasts'),

      m('reg_impact', 'Regulation Impact', 'Financial impact of policy changes', null, [
        leaf('cbam_impact', 'CBAM Impact', '$180M/yr', 'EU CBAM Model', 2),
        leaf('sec_climate', 'SEC Climate Rule', '$2.4M compliance', 'SEC Filings', 1),
        leaf('csrd_cost', 'CSRD Compliance', '$1.8M/yr', 'Internal Estimate', 3),
      ], ['EU CBAM', 'SEC', 'CSRD'], 'Regulatory impact quantification'),
    ],
  },

  '/climate-financial-statements': {
    moduleCode: 'CR-007', sprint: 'CLIM',
    metrics: [
      m('climate_pnl', 'Climate-Adjusted P&L', 'Revenue/Cost with climate overlay', null, [
        comp('revenue_impact', 'Revenue Impact', '-$420M', null, [
          leaf('demand_shift', 'Demand Shift', '-$280M', 'IEA Scenario', 2),
          leaf('pricing_power', 'Carbon Pass-Through', '+$120M', 'Sector Analysis', 3),
          leaf('new_markets', 'Green Revenue', '+$180M', 'Company Strategy', 3),
        ]),
        comp('cost_impact', 'Cost Impact', '-$310M', null, [
          leaf('carbon_cost', 'Direct Carbon Cost', '-$185M', 'NGFS', 1),
          leaf('adaptation', 'Adaptation CapEx', '-$95M', 'Engineering Est.', 4),
          leaf('efficiency', 'Efficiency Savings', '+$30M', 'Internal Model', 3),
        ]),
      ], ['NGFS', 'IEA', 'Company Filings'], 'Climate-adjusted income statement'),

      m('climate_bs', 'Climate Balance Sheet', 'Asset impairment and stranding', null, [
        leaf('asset_impair', 'Asset Impairment', '-$1.2B', 'IAS 36 / Climate', 2),
        leaf('goodwill_risk', 'Goodwill at Risk', '$0.8B', 'Valuation Model', 3),
        leaf('stranded_ppe', 'Stranded PP&E', '$0.4B', 'Carbon Tracker', 2),
      ], ['IAS 36', 'Carbon Tracker'], 'Climate-adjusted balance sheet'),

      m('climate_cf', 'Climate Cash Flow', 'CapEx/OpEx climate adjustments', null, [
        leaf('green_capex', 'Green CapEx Required', '$2.1B', 'Transition Plan', 2),
        leaf('carbon_opex', 'Carbon Cost (Annual)', '$185M', 'NGFS', 1),
        leaf('fcf_impact', 'FCF Impact', '-$420M', 'Internal Model', 3),
      ], ['NGFS', 'Company Transition Plan'], 'Climate-adjusted cash flow statement'),
    ],
  },

  '/stress-test-orchestrator': {
    moduleCode: 'CR-008', sprint: 'CLIM',
    metrics: [
      m('multi_scenario', 'Multi-Scenario Runner', 'Parallel scenario execution', null, [
        comp('ngfs_nz', 'NGFS Net Zero 2050', null, null, [
          leaf('gdp_impact_nz', 'GDP Impact', '-2.1%', 'NGFS Phase 5', 1),
          leaf('carbon_price_nz', 'Carbon Price 2030', '$130/tCO2', 'NGFS', 1),
        ]),
        comp('ngfs_delayed', 'NGFS Delayed Transition', null, null, [
          leaf('gdp_impact_dt', 'GDP Impact', '-4.8%', 'NGFS Phase 5', 1),
          leaf('carbon_price_dt', 'Carbon Price 2030', '$65/tCO2', 'NGFS', 1),
        ]),
        comp('ngfs_cp', 'NGFS Current Policies', null, null, [
          leaf('gdp_impact_cp', 'GDP Impact', '-8.2%', 'NGFS Phase 5', 1),
          leaf('temp_2100', 'Temp 2100', '3.2C', 'NGFS', 1),
        ]),
      ], ['NGFS Phase 5'], 'Multi-scenario climate stress test runner'),

      m('reg_alignment', 'Regulatory Alignment', 'Compliance with supervisory exercises', null, [
        leaf('ecb_aligned', 'ECB CST Aligned', 'Yes', 'ECB Guide', 1),
        leaf('boe_aligned', 'BoE CBES Aligned', 'Yes', 'BoE Guide', 1),
        leaf('fed_aligned', 'Fed CSA Aligned', 'Partial', 'Fed Guide', 1),
      ], ['ECB', 'BoE', 'Fed'], 'Regulatory stress test alignment'),

      m('capital_impact', 'Capital Impact', 'Impact on capital ratios', null, [
        leaf('cet1_impact', 'CET1 Impact', '-180bps', 'Internal Model', 2),
        leaf('rwa_increase', 'RWA Increase', '+$4.2B', 'Internal Model', 2),
        leaf('buffer_consumed', 'Buffer Consumed', '42%', 'Internal Model', 2),
      ], ['Internal Model', 'Regulatory Framework'], 'Capital impact under stress'),
    ],
  },

  '/regulatory-capital': {
    moduleCode: 'CR-009', sprint: 'CLIM',
    metrics: [
      m('climate_rwa', 'Climate RWA', 'Risk-weighted assets with climate overlay', null, [
        comp('credit_rwa', 'Credit Risk RWA', '$42B', null, [
          leaf('pd_adj', 'PD Climate Adjustment', '+15bps', 'Internal Rating', 2),
          leaf('lgd_adj', 'LGD Climate Adj', '+2.4%', 'Internal Rating', 2),
          leaf('ead_growth', 'EAD Growth', '+$1.8B', 'Exposure Model', 2),
        ]),
        comp('market_rwa', 'Market Risk RWA', '$8.4B', null, [
          leaf('frtb_climate', 'FRTB Climate Add-On', '+$1.2B', 'Internal Model', 3),
          leaf('stress_rwa', 'Stressed RWA', '$12.1B', 'Stress Test', 2),
        ]),
        comp('op_rwa', 'Operational Risk RWA', '$5.2B', null, [
          leaf('litigation_rwa', 'Litigation RWA', '$0.8B', 'Legal Analysis', 4),
          leaf('phys_op_risk', 'Physical Op Risk', '$0.4B', 'BCP Model', 3),
        ]),
      ], ['Basel III/IV', 'Internal Models'], 'Climate-adjusted RWA calculation'),

      m('capital_buffer', 'Capital Buffer Analysis', 'Buffer adequacy under climate stress', null, [
        leaf('cet1_ratio', 'CET1 Ratio', '13.2%', 'Regulatory Return', 1),
        leaf('min_requirement', 'Min Requirement', '10.5%', 'Pillar 1 + 2', 1),
        leaf('climate_buffer', 'Climate Buffer', '1.2%', 'Pillar 2 Add-on', 2),
      ], ['Regulatory Return', 'Pillar 2'], 'Capital adequacy with climate buffers'),
    ],
  },

  '/loss-damage': {
    moduleCode: 'CR-010', sprint: 'CLIM',
    metrics: [
      m('ld_exposure', 'L&D Exposure', 'Loss and damage financial exposure', null, [
        comp('physical_ld', 'Physical L&D', null, null, [
          leaf('flood_loss', 'Flood Loss', '$1.2B', 'Munich Re NatCat', 1),
          leaf('drought_loss', 'Drought Loss', '$0.8B', 'EM-DAT', 1),
          leaf('storm_loss', 'Storm Loss', '$2.4B', 'Munich Re NatCat', 1),
        ]),
        comp('slow_onset', 'Slow-Onset L&D', null, null, [
          leaf('slr_loss', 'Sea Level Rise', '$0.6B', 'IPCC AR6', 1),
          leaf('desertification', 'Desertification', '$0.3B', 'UNCCD', 2),
        ]),
      ], ['Munich Re', 'EM-DAT', 'IPCC'], 'Loss and damage exposure assessment'),

      m('parametric', 'Parametric Triggers', 'Index-based insurance triggers', null, [
        leaf('wind_trigger', 'Wind Speed Trigger', '120 km/h', 'CCRIF', 1),
        leaf('rainfall_trigger', 'Rainfall Trigger', '200mm/24h', 'ARC', 1),
        leaf('earthquake_trigger', 'Earthquake Trigger', '6.0 Mw', 'CCRIF', 1),
      ], ['CCRIF', 'ARC'], 'Parametric insurance trigger thresholds'),

      m('financing_gap', 'Financing Gap', 'Gap between L&D needs and funding', null, [
        leaf('annual_need', 'Annual Need', '$400B', 'UNEP AGR', 1),
        leaf('current_funding', 'Current Funding', '$22B', 'OECD DAC', 1),
        leaf('gap', 'Financing Gap', '$378B', 'UNEP AGR', 1),
      ], ['UNEP AGR', 'OECD'], 'L&D financing gap analysis'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // ESG & COMPLIANCE (12 modules)
  // ═══════════════════════════════════════════════════════════════════
  '/sfdr-art9': {
    moduleCode: 'ESG-001', sprint: 'COMP',
    metrics: [
      m('art9_compliance', 'Article 9 Compliance', 'Sustainable investment qualification', null, [
        comp('si_pct', 'Sustainable Investment %', '92%', null, [
          leaf('env_si', 'Environmental SI', '68%', 'EU Taxonomy', 1),
          leaf('social_si', 'Social SI', '24%', 'SFDR RTS', 1),
        ]),
        comp('taxonomy_align', 'EU Taxonomy Alignment', '42%', null, [
          leaf('sc_pass', 'Substantial Contribution', '48%', 'EU Taxonomy', 1),
          leaf('dnsh_pass', 'DNSH Pass Rate', '94%', 'EU Taxonomy', 1),
          leaf('mss_pass', 'Min Safeguards', '98%', 'UNGC/OECD', 1),
        ]),
        comp('pai_coverage', 'PAI Coverage', '100%', null, [
          leaf('mandatory_pai', 'Mandatory PAI (14)', '14/14', 'SFDR Annex I', 1),
          leaf('optional_pai', 'Optional PAI', '8/46', 'SFDR Annex I', 1),
        ]),
      ], ['SFDR RTS', 'EU Taxonomy Reg'], 'SFDR Article 9 compliance assessment'),

      m('benchmark_align', 'Benchmark Alignment', 'Paris-aligned or Climate Transition Benchmark', null, [
        leaf('pab_aligned', 'PAB Aligned', 'Yes', 'EU BMR', 1),
        leaf('carbon_reduction', 'YoY Carbon Reduction', '7.2%', 'CTB/PAB Rules', 1),
        leaf('exclusions_met', 'Exclusions Met', '100%', 'PAB Delegated Act', 1),
      ], ['EU BMR', 'TEG Report'], 'Paris-aligned benchmark compliance'),
    ],
  },

  '/issb-tcfd': {
    moduleCode: 'ESG-002', sprint: 'COMP',
    metrics: [
      m('tcfd_score', 'TCFD 4-Pillar Score', 'Governance + Strategy + RM + M&T', null, [
        comp('governance', 'Governance', '85/100', 0.25, [
          leaf('board_oversight', 'Board Oversight', '90/100', 'Company Disclosure', 2),
          leaf('mgmt_role', 'Management Role', '80/100', 'Company Disclosure', 2),
        ]),
        comp('strategy', 'Strategy', '72/100', 0.25, [
          leaf('scenario_analysis', 'Scenario Analysis', '68/100', 'Company Disclosure', 2),
          leaf('business_impact', 'Business Impact', '75/100', 'Company Disclosure', 2),
        ]),
        comp('risk_mgmt', 'Risk Management', '78/100', 0.25, [
          leaf('id_process', 'Identification Process', '82/100', 'Company Disclosure', 2),
          leaf('integration', 'ERM Integration', '74/100', 'Company Disclosure', 2),
        ]),
        comp('metrics_targets', 'Metrics & Targets', '68/100', 0.25, [
          leaf('ghg_disclosure', 'GHG Disclosure', '72/100', 'CDP', 1),
          leaf('targets', 'Target Setting', '64/100', 'SBTi', 1),
        ]),
      ], ['TCFD', 'CDP', 'SBTi'], 'TCFD 4-pillar disclosure scoring'),

      m('issb_s2', 'ISSB S2 Coverage', 'IFRS S2 climate disclosure readiness', null, [
        leaf('s2_ready', 'S2 Readiness', '72%', 'ISSB Assessment', 2),
        leaf('scope3_covered', 'Scope 3 Coverage', '68%', 'CDP', 2),
        leaf('transition_plan', 'Transition Plan', 'Published', 'Company Report', 2),
      ], ['ISSB', 'CDP'], 'ISSB S2 readiness assessment'),

      m('scenario_analysis', 'Scenario Analysis', 'NGFS scenario-based disclosures', null, [
        leaf('scenarios_used', 'Scenarios', '3 NGFS', 'Company Disclosure', 2),
        leaf('time_horizon', 'Time Horizons', '2030/2050', 'Company Disclosure', 2),
        leaf('quant_impact', 'Quantified Impact', 'Yes', 'Company Disclosure', 2),
      ], ['NGFS', 'Company Disclosures'], 'Climate scenario analysis disclosure'),
    ],
  },

  '/double-materiality': {
    moduleCode: 'ESG-003', sprint: 'COMP',
    metrics: [
      m('materiality_matrix', 'Materiality Matrix', 'Impact vs Financial materiality scoring', null, [
        comp('impact_mat', 'Impact Materiality', null, null, [
          leaf('env_impact', 'Environmental Impact', '82/100', 'Stakeholder Survey', 3),
          leaf('social_impact', 'Social Impact', '71/100', 'Stakeholder Survey', 3),
          leaf('gov_impact', 'Governance Impact', '65/100', 'Stakeholder Survey', 3),
        ]),
        comp('financial_mat', 'Financial Materiality', null, null, [
          leaf('env_financial', 'Environmental Financial', '78/100', 'Risk Assessment', 2),
          leaf('social_financial', 'Social Financial', '62/100', 'Risk Assessment', 2),
          leaf('gov_financial', 'Governance Financial', '72/100', 'Risk Assessment', 2),
        ]),
      ], ['CSRD ESRS', 'GRI', 'Stakeholder Input'], 'Double materiality assessment (CSRD)'),

      m('topic_scoring', 'Topic Scoring', 'Material topic prioritization', null, [
        leaf('top_topic', 'Top Material Topic', 'Climate Change', 'DMA', 2),
        leaf('topics_material', 'Material Topics', '12 of 24', 'DMA', 2),
        leaf('stakeholder_count', 'Stakeholders Consulted', '245', 'Engagement Log', 1),
      ], ['ESRS', 'Stakeholder Engagement'], 'Material topic prioritization'),
    ],
  },

  '/esg-data-quality': {
    moduleCode: 'ESG-004', sprint: 'COMP',
    metrics: [
      m('completeness', 'Data Completeness', 'Pct of required fields populated', null, [
        comp('env_complete', 'Environmental Data', '89%', null, [
          leaf('scope1_complete', 'Scope 1 Coverage', '95%', 'CDP', 1),
          leaf('scope2_complete', 'Scope 2 Coverage', '92%', 'CDP', 1),
          leaf('scope3_complete', 'Scope 3 Coverage', '68%', 'CDP', 2),
        ]),
        comp('social_complete', 'Social Data', '72%', null, [
          leaf('workforce', 'Workforce Data', '84%', 'Company Reports', 2),
          leaf('supply_chain', 'Supply Chain Data', '52%', 'Surveys', 3),
        ]),
      ], ['CDP', 'Company Reports'], 'ESG data completeness assessment'),

      m('timeliness', 'Data Timeliness', 'Avg data lag in months', null, [
        leaf('avg_lag', 'Average Data Lag', '8 months', 'Provider Analysis', 2),
        leaf('real_time_pct', 'Real-Time %', '12%', 'Provider Analysis', 2),
        leaf('annual_pct', 'Annual Only %', '62%', 'Provider Analysis', 2),
      ], ['Provider Analysis'], 'ESG data timeliness metrics'),

      m('accuracy', 'Data Accuracy', 'Cross-provider consistency', null, [
        leaf('provider_corr', 'Cross-Provider Correlation', '0.68', 'Multi-Provider', 2),
        leaf('restatement_rate', 'Restatement Rate', '4.2%', 'Audit Review', 1),
        leaf('outlier_rate', 'Outlier Rate', '2.8%', 'Statistical QC', 2),
      ], ['Multi-Provider Analysis'], 'ESG data accuracy assessment'),
    ],
  },

  '/esg-controversy': {
    moduleCode: 'ESG-005', sprint: 'COMP',
    metrics: [
      m('incidents', 'Controversy Incidents', 'Active ESG controversy tracking', null, [
        comp('env_incidents', 'Environmental', '18', null, [
          leaf('spills', 'Spills/Releases', '4', 'RepRisk', 2),
          leaf('deforestation', 'Deforestation', '6', 'RepRisk', 2),
          leaf('emissions_breach', 'Emissions Breaches', '8', 'RepRisk', 2),
        ]),
        comp('social_incidents', 'Social', '24', null, [
          leaf('labor', 'Labor Issues', '12', 'RepRisk', 2),
          leaf('community', 'Community Impact', '8', 'RepRisk', 2),
          leaf('h_and_s', 'Health & Safety', '4', 'RepRisk', 2),
        ]),
      ], ['RepRisk', 'MSCI ESG Controversies'], 'ESG controversy incident tracking'),

      m('severity_score', 'Severity Score', 'Portfolio weighted severity', null, [
        leaf('avg_severity', 'Avg Severity', '2.8/5', 'RepRisk', 2),
        leaf('high_severity', 'High Severity Count', '5', 'RepRisk', 2),
        leaf('critical', 'Critical', '1', 'RepRisk', 2),
      ], ['RepRisk'], 'Controversy severity scoring'),

      m('resolution_rate', 'Resolution Rate', '12M resolution statistics', null, [
        leaf('resolved_12m', 'Resolved (12M)', '58%', 'RepRisk', 2),
        leaf('avg_resolution', 'Avg Resolution Time', '8.2 months', 'RepRisk', 2),
        leaf('repeat_offender', 'Repeat Offenders', '12%', 'RepRisk', 2),
      ], ['RepRisk', 'MSCI ESG'], 'Controversy resolution analytics'),
    ],
  },

  '/social-taxonomy': {
    moduleCode: 'ESG-006', sprint: 'COMP',
    metrics: [
      m('social_align', 'Social Taxonomy Alignment', 'Revenue alignment to social objectives', null, [
        comp('decent_work', 'Decent Work', '28%', null, [
          leaf('living_wage', 'Living Wage Coverage', '82%', 'Company Reports', 2),
          leaf('ohs', 'OHS Standards', '91%', 'ISO 45001', 1),
        ]),
        comp('adequate_living', 'Adequate Living Standards', '18%', null, [
          leaf('affordable_housing', 'Affordable Housing', '12%', 'Impact Reports', 3),
          leaf('healthcare_access', 'Healthcare Access', '24%', 'Impact Reports', 3),
        ]),
        comp('inclusive_growth', 'Inclusive Growth', '22%', null, [
          leaf('sme_lending', 'SME Lending', '15%', 'Bank Reports', 2),
          leaf('financial_inclusion', 'Financial Inclusion', '28%', 'Company Reports', 2),
        ]),
      ], ['EU Social Taxonomy (draft)', 'Platform on Sust. Finance'], 'Social taxonomy alignment assessment'),

      m('dnsh_social', 'DNSH Social', 'Do No Significant Harm (social)', null, [
        leaf('ungc_compliance', 'UNGC Compliance', '96%', 'UNGC', 1),
        leaf('oecd_guidelines', 'OECD Guidelines', '92%', 'OECD NCP', 1),
        leaf('ilc_conventions', 'ILO Core Conventions', '98%', 'ILO', 1),
      ], ['UNGC', 'OECD', 'ILO'], 'Social DNSH compliance check'),
    ],
  },

  '/regulatory-horizon': {
    moduleCode: 'ESG-007', sprint: 'COMP',
    metrics: [
      m('upcoming_regs', 'Upcoming Regulations', 'Regulation pipeline by timeline', null, [
        comp('near_term', 'Near-Term (0-12M)', null, null, [
          leaf('csrd_wave2', 'CSRD Wave 2', 'Jan 2026', 'EU', 1),
          leaf('sec_climate', 'SEC Climate Rule', 'Phased', 'SEC', 1),
        ]),
        comp('medium_term', 'Medium-Term (1-3Y)', null, null, [
          leaf('issb_adoption', 'ISSB Adoption', '2026-2027', 'IFRS', 1),
          leaf('cbam_full', 'CBAM Full Phase-In', '2026', 'EU', 1),
        ]),
        comp('long_term', 'Long-Term (3-5Y)', null, null, [
          leaf('social_tax', 'EU Social Taxonomy', '2027+', 'EU (draft)', 2),
          leaf('nature_disc', 'Nature Disclosure', '2028+', 'TNFD', 2),
        ]),
      ], ['EU Commission', 'SEC', 'IFRS'], 'Regulatory pipeline tracker'),

      m('impact_assessment', 'Impact Assessment', 'Cost and effort by regulation', null, [
        leaf('csrd_cost', 'CSRD Compliance Cost', '$2.4M', 'Internal Estimate', 3),
        leaf('issb_cost', 'ISSB Readiness Cost', '$1.2M', 'Internal Estimate', 3),
        leaf('cbam_cost', 'CBAM Annual Cost', '$8.5M', 'Trade Analysis', 3),
      ], ['Internal Estimates'], 'Regulatory impact cost assessment'),

      m('readiness', 'Readiness Score', 'Compliance readiness by framework', null, [
        leaf('csrd_ready', 'CSRD Readiness', '72%', 'Gap Analysis', 2),
        leaf('issb_ready', 'ISSB Readiness', '65%', 'Gap Analysis', 2),
        leaf('tnfd_ready', 'TNFD Readiness', '42%', 'Gap Analysis', 2),
      ], ['Gap Analysis'], 'Framework readiness assessment'),
    ],
  },

  '/regulatory-gap': {
    moduleCode: 'ESG-008', sprint: 'COMP',
    metrics: [
      m('gap_analysis', 'Gap Analysis', 'Gaps by disclosure framework', null, [
        comp('csrd_gaps', 'CSRD Gaps', '28 of 84 DRs', null, [
          leaf('e1_gaps', 'E1 Climate Gaps', '4', 'Gap Assessment', 2),
          leaf('s1_gaps', 'S1 Workforce Gaps', '8', 'Gap Assessment', 2),
          leaf('g1_gaps', 'G1 Governance Gaps', '3', 'Gap Assessment', 2),
        ]),
        comp('issb_gaps', 'ISSB Gaps', '12 items', null, [
          leaf('s1_gaps_issb', 'S1 General Gaps', '5', 'Gap Assessment', 2),
          leaf('s2_gaps_issb', 'S2 Climate Gaps', '7', 'Gap Assessment', 2),
        ]),
      ], ['CSRD', 'ISSB'], 'Multi-framework gap analysis'),

      m('remediation', 'Remediation Plan', 'Action items to close gaps', null, [
        leaf('total_actions', 'Total Actions', '42', 'Remediation Plan', 2),
        leaf('on_track', 'On Track', '28', 'Remediation Plan', 2),
        leaf('at_risk', 'At Risk', '8', 'Remediation Plan', 2),
      ], ['Remediation Plan'], 'Gap remediation tracking'),

      m('deadline_tracking', 'Deadline Tracking', 'Compliance deadlines', null, [
        leaf('overdue', 'Overdue', '2', 'Project Tracker', 1),
        leaf('due_30d', 'Due in 30 Days', '5', 'Project Tracker', 1),
        leaf('due_90d', 'Due in 90 Days', '12', 'Project Tracker', 1),
      ], ['Project Tracker'], 'Compliance deadline monitoring'),
    ],
  },

  '/regulatory-calendar': {
    moduleCode: 'ESG-009', sprint: 'COMP',
    metrics: [
      m('filing_deadlines', 'Filing Deadlines', 'Upcoming regulatory filings', null, [
        comp('eu_filings', 'EU Filings', null, null, [
          leaf('csrd_filing', 'CSRD Annual Report', 'Apr 2026', 'EU Directive', 1),
          leaf('sfdr_periodic', 'SFDR Periodic Report', 'Annual', 'SFDR RTS', 1),
          leaf('taxonomy_report', 'Taxonomy Report', 'Annual', 'EU Taxonomy', 1),
        ]),
        comp('us_filings', 'US Filings', null, null, [
          leaf('sec_10k', 'SEC 10-K Climate', 'Annual', 'SEC Rules', 1),
          leaf('california_sb', 'California SB 253/261', 'Annual', 'CA Law', 1),
        ]),
      ], ['EU Commission', 'SEC', 'State Law'], 'Regulatory filing calendar'),

      m('milestones', 'Compliance Milestones', 'Key dates and progress', null, [
        leaf('completed', 'Completed', '8 of 14', 'Compliance Team', 1),
        leaf('in_progress', 'In Progress', '4 of 14', 'Compliance Team', 1),
        leaf('not_started', 'Not Started', '2 of 14', 'Compliance Team', 1),
      ], ['Compliance Team'], 'Compliance milestone tracking'),

      m('jurisdiction', 'Jurisdiction Coverage', 'Regulatory coverage by jurisdiction', null, [
        leaf('eu_coverage', 'EU Coverage', '92%', 'Compliance Map', 2),
        leaf('us_coverage', 'US Coverage', '85%', 'Compliance Map', 2),
        leaf('apac_coverage', 'APAC Coverage', '68%', 'Compliance Map', 2),
      ], ['Compliance Map'], 'Multi-jurisdiction compliance coverage'),
    ],
  },

  '/comprehensive-reporting': {
    moduleCode: 'ESG-010', sprint: 'COMP',
    metrics: [
      m('multi_framework', 'Multi-Framework Report', 'Cross-framework disclosure coverage', null, [
        comp('csrd_coverage', 'CSRD Coverage', '82%', null, [
          leaf('esrs_covered', 'ESRS Standards Covered', '10 of 12', 'CSRD Assessment', 2),
          leaf('drs_covered', 'Disclosure Requirements', '56 of 84', 'CSRD Assessment', 2),
        ]),
        comp('issb_coverage', 'ISSB Coverage', '75%', null, [
          leaf('s1_covered', 'IFRS S1 Coverage', '78%', 'ISSB Assessment', 2),
          leaf('s2_covered', 'IFRS S2 Coverage', '72%', 'ISSB Assessment', 2),
        ]),
        comp('gri_coverage', 'GRI Coverage', '88%', null, [
          leaf('gri_topics', 'GRI Topic Standards', '18 of 22', 'GRI Index', 1),
          leaf('gri_universal', 'GRI Universal', '100%', 'GRI Index', 1),
        ]),
        comp('brsr_coverage', 'BRSR Coverage', '70%', null, [
          leaf('brsr_essential', 'Essential Indicators', '85%', 'SEBI BRSR', 1),
          leaf('brsr_leadership', 'Leadership Indicators', '55%', 'SEBI BRSR', 2),
        ]),
      ], ['CSRD', 'ISSB', 'GRI', 'SEBI BRSR'], 'Multi-framework sustainability reporting'),
    ],
  },

  '/sentiment-analysis': {
    moduleCode: 'ESG-011', sprint: 'COMP',
    metrics: [
      m('esg_sentiment', 'ESG Sentiment', 'Aggregate ESG sentiment from news & filings', null, [
        comp('env_sentiment', 'Environmental Sentiment', '+0.42', null, [
          leaf('env_articles', 'Env Articles', '3,400', 'News API', 2),
          leaf('env_pos', 'Positive %', '52%', 'NLP Engine', 3),
        ]),
        comp('social_sentiment', 'Social Sentiment', '+0.28', null, [
          leaf('social_articles', 'Social Articles', '2,800', 'News API', 2),
          leaf('social_pos', 'Positive %', '44%', 'NLP Engine', 3),
        ]),
        comp('gov_sentiment', 'Governance Sentiment', '+0.55', null, [
          leaf('gov_articles', 'Gov Articles', '1,600', 'News API', 2),
          leaf('gov_pos', 'Positive %', '58%', 'NLP Engine', 3),
        ]),
      ], ['News API', 'NLP Engine'], 'ESG sentiment analysis from news'),

      m('trend', 'Sentiment Trend', '12M rolling sentiment trajectory', null, [
        leaf('trend_3m', '3M Trend', '+0.08', 'NLP Engine', 3),
        leaf('trend_12m', '12M Trend', '-0.04', 'NLP Engine', 3),
        leaf('volatility', 'Sentiment Volatility', '0.18', 'NLP Engine', 3),
      ], ['NLP Engine'], 'Sentiment trend analysis'),

      m('company_compare', 'Company Comparison', 'Peer sentiment ranking', null, [
        leaf('top_performer', 'Best Sentiment', 'Company A (+0.72)', 'NLP Engine', 3),
        leaf('bottom_performer', 'Worst Sentiment', 'Company Z (-0.31)', 'NLP Engine', 3),
        leaf('peer_median', 'Peer Median', '+0.35', 'NLP Engine', 3),
      ], ['NLP Engine'], 'Peer sentiment comparison'),
    ],
  },

  '/exchange-intelligence': {
    moduleCode: 'ESG-012', sprint: 'COMP',
    metrics: [
      m('exchange_reqs', 'Exchange ESG Requirements', 'Listing rule ESG obligations', null, [
        comp('eu_exchanges', 'EU Exchanges', null, null, [
          leaf('lse_esg', 'LSE ESG Guidance', 'TCFD Required', 'LSE', 1),
          leaf('euronext', 'Euronext ESG', 'Comply or Explain', 'Euronext', 1),
        ]),
        comp('apac_exchanges', 'APAC Exchanges', null, null, [
          leaf('hkex', 'HKEX ESG', 'Mandatory', 'HKEX', 1),
          leaf('sgx', 'SGX Sustainability', 'Mandatory', 'SGX', 1),
          leaf('sebi', 'SEBI BRSR', 'Top 1000', 'SEBI', 1),
        ]),
      ], ['SSE Initiative', 'Exchange Rules'], 'Exchange ESG listing requirements'),

      m('best_practice', 'Best Practice Score', 'Exchange ESG maturity', null, [
        leaf('disclosure_maturity', 'Disclosure Maturity', '72/100', 'SSE Initiative', 2),
        leaf('training', 'ESG Training Offered', '65%', 'SSE Initiative', 2),
        leaf('products', 'ESG Products Listed', '142', 'Exchange Data', 1),
      ], ['SSE Initiative'], 'Exchange ESG best practice benchmarking'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // REAL ESTATE & INFRASTRUCTURE (6 modules)
  // ═══════════════════════════════════════════════════════════════════
  '/crrem': {
    moduleCode: 'RE-001', sprint: 'RE',
    metrics: [
      m('crrem_pathway', 'CRREM Pathway', 'Carbon Risk Real Estate Monitor pathway', null, [
        comp('current_intensity', 'Current Carbon Intensity', '42 kgCO2/m2', null, [
          leaf('scope1_bldg', 'Scope 1 (Direct)', '18 kgCO2/m2', 'Energy Audit', 1),
          leaf('scope2_bldg', 'Scope 2 (Electricity)', '24 kgCO2/m2', 'Grid Factor', 2),
        ]),
        comp('target_pathway', 'CRREM 1.5C Pathway', '15 kgCO2/m2 by 2030', null, [
          leaf('pathway_2030', '2030 Target', '15 kgCO2/m2', 'CRREM Tool', 1),
          leaf('pathway_2050', '2050 Target', '0 kgCO2/m2', 'CRREM Tool', 1),
        ]),
      ], ['CRREM Tool', 'Energy Audit'], 'CRREM decarbonization pathway'),

      m('stranding_year', 'Stranding Year', 'Year asset exceeds CRREM pathway', null, [
        leaf('strand_date', 'Stranding Year', '2031', 'CRREM Tool', 1),
        leaf('excess_carbon', 'Excess Carbon at Stranding', '8 kgCO2/m2', 'CRREM Tool', 1),
        leaf('value_at_risk', 'Value at Risk', '-12%', 'Valuation Model', 3),
      ], ['CRREM Tool'], 'Stranding year analysis'),

      m('retrofit_cost', 'Retrofit Cost', 'CapEx needed to reach CRREM pathway', null, [
        comp('envelope', 'Building Envelope', '$4.2M', null, [
          leaf('insulation', 'Insulation Upgrade', '$1.8M', 'Engineering Est.', 4),
          leaf('windows', 'Window Replacement', '$2.4M', 'Engineering Est.', 4),
        ]),
        comp('systems', 'Building Systems', '$3.1M', null, [
          leaf('hvac', 'HVAC Upgrade', '$2.2M', 'Engineering Est.', 4),
          leaf('lighting', 'LED Retrofit', '$0.9M', 'Engineering Est.', 4),
        ]),
      ], ['Engineering Estimates', 'CRREM'], 'Retrofit cost estimation'),
    ],
  },

  '/green-building-cert': {
    moduleCode: 'RE-002', sprint: 'RE',
    metrics: [
      m('cert_coverage', 'Certification Coverage', 'Portfolio green building certification', null, [
        comp('leed', 'LEED Certified', '42%', null, [
          leaf('leed_plat', 'Platinum', '8%', 'USGBC', 1),
          leaf('leed_gold', 'Gold', '22%', 'USGBC', 1),
          leaf('leed_silver', 'Silver', '12%', 'USGBC', 1),
        ]),
        comp('breeam', 'BREEAM Certified', '28%', null, [
          leaf('breeam_out', 'Outstanding', '5%', 'BRE', 1),
          leaf('breeam_exc', 'Excellent', '15%', 'BRE', 1),
          leaf('breeam_vg', 'Very Good', '8%', 'BRE', 1),
        ]),
        comp('nabers', 'NABERS Rated', '12%', null, [
          leaf('nabers_5star', '5+ Stars', '4%', 'NABERS', 1),
          leaf('nabers_4star', '4+ Stars', '8%', 'NABERS', 1),
        ]),
      ], ['USGBC', 'BRE', 'NABERS'], 'Green building certification portfolio'),

      m('cert_gap', 'Certification Gap', 'Uncertified assets analysis', null, [
        leaf('uncertified', 'Uncertified Assets', '18%', 'Portfolio Data', 1),
        leaf('gap_cost', 'Certification Cost', '$8.4M', 'Consultant Est.', 4),
        leaf('timeline', 'Target Timeline', '24 months', 'Project Plan', 2),
      ], ['Portfolio Data'], 'Certification gap and cost analysis'),
    ],
  },

  '/property-physical-risk': {
    moduleCode: 'RE-003', sprint: 'RE',
    metrics: [
      m('property_hazard', 'Property-Level Hazard', 'Per-property hazard assessment', null, [
        comp('flood_risk', 'Flood Risk', null, null, [
          leaf('fema_zone', 'FEMA Flood Zone', 'Zone AE', 'FEMA NFIP', 1),
          leaf('return_period', '100yr Flood Depth', '1.2m', 'JBA Risk', 1),
          leaf('flood_pml', 'Flood PML', '$4.2M', 'Cat Model', 3),
        ]),
        comp('fire_risk', 'Wildfire Risk', null, null, [
          leaf('wui', 'WUI Classification', 'Interface', 'SILVIS Lab', 1),
          leaf('fire_score', 'Fire Risk Score', '72/100', 'FireLine', 2),
        ]),
        comp('heat_risk', 'Extreme Heat', null, null, [
          leaf('cooling_dd', 'Cooling Degree Days', '2,400', 'NOAA', 1),
          leaf('heat_trend', 'Heat Trend (2050)', '+35%', 'IPCC AR6', 1),
        ]),
      ], ['FEMA', 'JBA Risk', 'IPCC AR6'], 'Property-level physical risk assessment'),

      m('insurance_impact', 'Insurance Impact', 'Insurance cost and availability', null, [
        leaf('current_premium', 'Current Premium', '$12.4M/yr', 'Broker', 2),
        leaf('premium_trend', 'Premium Trend (5Y)', '+42%', 'Broker', 2),
        leaf('uninsurable_pct', 'Uninsurable Risk %', '4%', 'Underwriter', 3),
      ], ['Broker Data', 'Underwriter'], 'Property insurance cost analysis'),
    ],
  },

  '/gresb-scoring': {
    moduleCode: 'RE-004', sprint: 'RE',
    metrics: [
      m('gresb_score', 'GRESB Score', 'Global Real Estate Sustainability Benchmark', null, [
        comp('management', 'Management Score', '82/100', null, [
          leaf('leadership', 'Leadership', '90%', 'GRESB', 1),
          leaf('policies', 'Policies', '85%', 'GRESB', 1),
          leaf('reporting', 'Reporting', '78%', 'GRESB', 1),
        ]),
        comp('performance', 'Performance Score', '68/100', null, [
          leaf('energy_perf', 'Energy Performance', '72%', 'GRESB', 1),
          leaf('water_perf', 'Water Performance', '65%', 'GRESB', 1),
          leaf('waste_perf', 'Waste Performance', '58%', 'GRESB', 1),
        ]),
      ], ['GRESB'], 'GRESB sustainability benchmark scoring'),

      m('benchmark_rank', 'Benchmark Rank', 'Peer ranking', null, [
        leaf('global_rank', 'Global Rank', '24th percentile', 'GRESB', 1),
        leaf('peer_rank', 'Peer Group Rank', '3 of 42', 'GRESB', 1),
        leaf('star_rating', 'Star Rating', '4 Stars', 'GRESB', 1),
      ], ['GRESB'], 'GRESB benchmark ranking'),

      m('improvement', 'Improvement Areas', 'Priority actions for score improvement', null, [
        leaf('top_gap', 'Largest Gap', 'Tenant Engagement', 'GRESB', 1),
        leaf('quick_wins', 'Quick Wins', '4 items', 'Internal Analysis', 2),
        leaf('points_available', 'Points Available', '+12', 'GRESB Gap Analysis', 2),
      ], ['GRESB', 'Internal Analysis'], 'GRESB improvement roadmap'),
    ],
  },

  '/infra-esg-dd': {
    moduleCode: 'RE-005', sprint: 'RE',
    metrics: [
      m('infra_dd', 'Infrastructure ESG DD', 'Due diligence screening', null, [
        comp('climate_screen', 'Climate Screening', null, null, [
          leaf('ghg_intensity', 'GHG Intensity', '145 tCO2e/M rev', 'IFC Benchmark', 2),
          leaf('physical_exp', 'Physical Risk Exposure', 'Medium', 'Geospatial', 3),
          leaf('transition_exp', 'Transition Risk', 'Low-Medium', 'Sector Analysis', 3),
        ]),
        comp('es_screen', 'E&S Screening', null, null, [
          leaf('ifc_ps', 'IFC PS Category', 'Category B', 'IFC PS', 1),
          leaf('ep_category', 'Equator Principles', 'Category B', 'EP Association', 1),
          leaf('community_risk', 'Community Risk', 'Low', 'ESIA', 2),
        ]),
      ], ['IFC Performance Standards', 'Equator Principles'], 'Infrastructure ESG due diligence'),

      m('es_classification', 'E&S Classification', 'IFC Performance Standards assessment', null, [
        leaf('ps1', 'PS1 Assessment & Mgmt', 'Compliant', 'IFC PS', 1),
        leaf('ps2', 'PS2 Labor & Working', 'Compliant', 'IFC PS', 1),
        leaf('ps6', 'PS6 Biodiversity', 'Gap Identified', 'IFC PS', 1),
      ], ['IFC Performance Standards'], 'IFC PS compliance assessment'),
    ],
  },

  '/re-portfolio-dashboard': {
    moduleCode: 'RE-006', sprint: 'RE',
    metrics: [
      m('re_carbon', 'RE Portfolio Carbon', 'Total portfolio carbon footprint', null, [
        comp('scope12', 'Scope 1+2 Emissions', '42,000 tCO2e', null, [
          leaf('gas_emissions', 'Natural Gas', '18,000 tCO2e', 'Energy Audit', 1),
          leaf('elec_emissions', 'Electricity', '24,000 tCO2e', 'Grid Factor', 2),
        ]),
        comp('intensity', 'Carbon Intensity', '38 kgCO2/m2', null, [
          leaf('office_int', 'Office Intensity', '42 kgCO2/m2', 'Energy Audit', 1),
          leaf('retail_int', 'Retail Intensity', '55 kgCO2/m2', 'Energy Audit', 1),
          leaf('residential_int', 'Residential', '28 kgCO2/m2', 'Energy Audit', 1),
        ]),
      ], ['Energy Audits', 'Grid Factors'], 'RE portfolio carbon footprint'),

      m('crrem_align', 'CRREM Alignment', 'Portfolio-level CRREM status', null, [
        leaf('aligned_pct', 'CRREM Aligned %', '62%', 'CRREM Tool', 1),
        leaf('at_risk_pct', 'At Risk (strand <2030)', '18%', 'CRREM Tool', 1),
        leaf('stranded_pct', 'Already Stranded', '8%', 'CRREM Tool', 1),
      ], ['CRREM Tool'], 'Portfolio CRREM alignment'),

      m('stranding_risk', 'Stranding Risk', 'Portfolio stranding exposure', null, [
        leaf('value_at_risk', 'Value at Risk', '$1.4B', 'Valuation Model', 3),
        leaf('retrofit_need', 'Total Retrofit Need', '$420M', 'Engineering Est.', 4),
        leaf('payback', 'Avg Retrofit Payback', '8.2 years', 'Financial Model', 3),
      ], ['CRREM', 'Valuation Model'], 'Portfolio stranding risk assessment'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // EMERGING & SPECIALIZED (12 modules)
  // ═══════════════════════════════════════════════════════════════════
  '/crypto-climate': {
    moduleCode: 'EM-001', sprint: 'SPEC',
    metrics: [
      m('crypto_footprint', 'Crypto Carbon Footprint', 'Estimated emissions from crypto holdings', null, [
        comp('btc_emissions', 'Bitcoin Emissions', '12,400 tCO2e', null, [
          leaf('btc_hashrate', 'Hashrate Share', '0.002%', 'Blockchain.com', 1),
          leaf('btc_energy', 'Energy Consumption', '24 GWh', 'CCRI', 2),
          leaf('btc_ef', 'Grid Mix EF', '520 gCO2/kWh', 'IEA', 2),
        ]),
        comp('eth_emissions', 'Ethereum Emissions', '240 tCO2e', null, [
          leaf('eth_stake', 'ETH Staked Value', '$4.2M', 'Etherscan', 1),
          leaf('eth_energy', 'PoS Energy', '0.5 GWh', 'CCRI', 2),
        ]),
      ], ['CCRI', 'Digiconomist', 'IEA'], 'Crypto carbon footprint estimation'),

      m('mining_energy', 'Mining Energy Mix', 'Energy source breakdown for mining', null, [
        leaf('renewable_pct', 'Renewable %', '58%', 'BMC Survey', 3),
        leaf('fossil_pct', 'Fossil %', '42%', 'BMC Survey', 3),
        leaf('stranded_energy', 'Stranded Energy Used', '12%', 'Research', 4),
      ], ['Bitcoin Mining Council', 'CCRI'], 'Mining energy source analysis'),

      m('pow_vs_pos', 'PoW vs PoS Comparison', 'Energy efficiency by consensus', null, [
        leaf('pow_energy', 'PoW Energy/Tx', '707 kWh', 'Digiconomist', 2),
        leaf('pos_energy', 'PoS Energy/Tx', '0.003 kWh', 'CCRI', 2),
        leaf('reduction', 'PoS Reduction', '99.95%', 'Ethereum.org', 1),
      ], ['CCRI', 'Ethereum Foundation'], 'Consensus mechanism energy comparison'),
    ],
  },

  '/green-hydrogen': {
    moduleCode: 'EM-002', sprint: 'SPEC',
    metrics: [
      m('lcoh', 'LCOH', 'Levelized Cost of Hydrogen', null, [
        comp('green_h2', 'Green H2 LCOH', '$4.50/kg', null, [
          leaf('elec_cost', 'Electricity Cost', '$45/MWh', 'PPA', 2),
          leaf('capex_electrolyzer', 'Electrolyzer CapEx', '$800/kW', 'IRENA', 2),
          leaf('efficiency', 'System Efficiency', '65%', 'OEM Spec', 2),
        ]),
        comp('grey_h2', 'Grey H2 LCOH', '$1.80/kg', null, [
          leaf('nat_gas', 'Natural Gas Price', '$8/MMBtu', 'Henry Hub', 1),
          leaf('smr_capex', 'SMR CapEx', '$400/kW', 'IEA', 2),
        ]),
      ], ['IRENA', 'IEA', 'BloombergNEF'], 'Hydrogen cost comparison'),

      m('electrolyzer', 'Electrolyzer Capacity', 'Installed and pipeline capacity', null, [
        leaf('installed', 'Installed (GW)', '1.4 GW', 'IEA', 1),
        leaf('pipeline', 'Pipeline (GW)', '134 GW', 'Hydrogen Council', 2),
        leaf('target_2030', '2030 Target', '100 GW (EU)', 'REPowerEU', 1),
      ], ['IEA', 'Hydrogen Council'], 'Electrolyzer capacity tracker'),

      m('green_premium', 'Green Premium', 'Cost premium for green vs grey H2', null, [
        leaf('premium_current', 'Current Premium', '$2.70/kg', 'BNEF', 2),
        leaf('premium_2030', '2030 Forecast', '$1.20/kg', 'IRENA', 2),
        leaf('parity_year', 'Parity Year', '2030-2035', 'BNEF', 3),
      ], ['IRENA', 'BNEF'], 'Green hydrogen cost premium analysis'),
    ],
  },

  '/transition-finance': {
    moduleCode: 'EM-003', sprint: 'SPEC',
    metrics: [
      m('transition_bond', 'Transition Bond Screening', 'Transition label quality assessment', null, [
        comp('kpi_quality', 'KPI Quality', '72/100', null, [
          leaf('science_based', 'Science-Based KPIs', '68%', 'ICMA Guidelines', 1),
          leaf('ambitious', 'Ambitious Targets', '72%', 'SBTi', 2),
        ]),
        comp('use_of_proceeds', 'Use of Proceeds', '85/100', null, [
          leaf('eligible_green', 'Green Eligible', '82%', 'CBI Taxonomy', 1),
          leaf('capex_ratio', 'CapEx vs OpEx', '75% CapEx', 'Bond Docs', 1),
        ]),
      ], ['ICMA', 'CBI', 'SBTi'], 'Transition bond screening framework'),

      m('kpi_targets', 'KPI Target Validation', 'Issuer target assessment', null, [
        leaf('targets_set', 'Targets Set', '4 of 4', 'Bond Docs', 1),
        leaf('verified', 'Third-Party Verified', '75%', 'SPO Provider', 1),
        leaf('on_track', 'On Track to Meet', '62%', 'Annual Report', 2),
      ], ['Bond Documentation', 'SPO'], 'Transition KPI target validation'),

      m('step_up', 'Step-Up Mechanism', 'Coupon step-up trigger analysis', null, [
        leaf('step_bps', 'Step-Up Amount', '25bps', 'Bond Docs', 1),
        leaf('trigger_risk', 'Trigger Risk', '35%', 'Internal Model', 3),
        leaf('cost_impact', 'Cost Impact', '$2.4M/yr', 'Financial Model', 2),
      ], ['Bond Documentation'], 'Step-up coupon mechanism analysis'),
    ],
  },

  '/green-securitisation': {
    moduleCode: 'EM-004', sprint: 'SPEC',
    metrics: [
      m('green_abs', 'Green ABS/MBS', 'Green securitization portfolio', null, [
        comp('green_mbs', 'Green MBS', '$1.2B', null, [
          leaf('epc_a', 'EPC A-Rated Collateral', '68%', 'Energy Certs', 1),
          leaf('avg_epc', 'Avg EPC Score', 'B+', 'Energy Certs', 1),
        ]),
        comp('green_abs', 'Green ABS', '$0.8B', null, [
          leaf('ev_loans', 'EV Loan Collateral', '$0.5B', 'Originator', 1),
          leaf('solar_loans', 'Solar Loan Collateral', '$0.3B', 'Originator', 1),
        ]),
      ], ['CBI', 'Originator Data'], 'Green securitization portfolio'),

      m('collateral_esg', 'Collateral ESG Score', 'ESG quality of underlying assets', null, [
        leaf('avg_esg', 'Avg Collateral ESG', '72/100', 'Internal Model', 3),
        leaf('green_pct', 'Green Collateral %', '82%', 'CBI Taxonomy', 1),
        leaf('brown_pct', 'Brown Collateral %', '4%', 'Internal Model', 3),
      ], ['CBI', 'Internal Model'], 'Collateral ESG assessment'),
    ],
  },

  '/social-bond': {
    moduleCode: 'EM-005', sprint: 'SPEC',
    metrics: [
      m('social_criteria', 'Social Bond Criteria', 'ICMA Social Bond Principles alignment', null, [
        comp('target_pop', 'Target Population', null, null, [
          leaf('below_poverty', 'Below Poverty Line', '2.4M beneficiaries', 'Impact Report', 2),
          leaf('underserved', 'Underserved Communities', '1.8M', 'Impact Report', 2),
        ]),
        comp('social_cat', 'Social Categories', null, null, [
          leaf('affordable_housing', 'Affordable Housing', '$420M', 'Bond Docs', 1),
          leaf('healthcare', 'Healthcare Access', '$280M', 'Bond Docs', 1),
          leaf('education', 'Education', '$180M', 'Bond Docs', 1),
        ]),
      ], ['ICMA SBP', 'Impact Reports'], 'Social bond criteria assessment'),

      m('impact_metrics', 'Impact Metrics', 'Social impact quantification', null, [
        leaf('beneficiaries', 'Total Beneficiaries', '4.2M', 'Impact Report', 2),
        leaf('jobs_created', 'Jobs Created', '12,400', 'Impact Report', 2),
        leaf('housing_units', 'Housing Units', '8,200', 'Impact Report', 2),
      ], ['Impact Reports'], 'Social bond impact metrics'),
    ],
  },

  '/digital-product-passport': {
    moduleCode: 'EM-006', sprint: 'SPEC',
    metrics: [
      m('product_lifecycle', 'Product Lifecycle', 'Cradle-to-grave product tracking', null, [
        comp('raw_materials', 'Raw Materials', null, null, [
          leaf('material_origin', 'Origin Countries', '12', 'Supply Chain DB', 2),
          leaf('recycled_content', 'Recycled Content', '28%', 'Supplier Certs', 2),
        ]),
        comp('manufacturing', 'Manufacturing', null, null, [
          leaf('energy_use', 'Energy per Unit', '4.2 kWh', 'Factory Data', 1),
          leaf('water_use', 'Water per Unit', '12L', 'Factory Data', 1),
        ]),
        comp('end_of_life', 'End of Life', null, null, [
          leaf('recyclability', 'Recyclability Score', '78%', 'Design Assessment', 2),
          leaf('repairability', 'Repairability Index', '6.2/10', 'EU Regulation', 1),
        ]),
      ], ['EU DPP Regulation', 'Supply Chain'], 'Digital product passport lifecycle'),

      m('carbon_per_product', 'Product Carbon Footprint', 'Per-unit carbon emissions', null, [
        leaf('total_pcf', 'Total PCF', '4.2 kgCO2e', 'LCA', 2),
        leaf('scope3_pct', 'Scope 3 Share', '82%', 'LCA', 2),
        leaf('benchmark', 'Category Benchmark', '5.8 kgCO2e', 'PEF', 2),
      ], ['ISO 14067', 'EU PEF'], 'Product carbon footprint analysis'),
    ],
  },

  '/nbs-finance': {
    moduleCode: 'EM-007', sprint: 'SPEC',
    metrics: [
      m('nbs_portfolio', 'NbS Portfolio', 'Nature-based solutions investment portfolio', null, [
        comp('sequestration', 'Carbon Sequestration', '2.4M tCO2e/yr', null, [
          leaf('afforestation', 'Afforestation', '1.2M tCO2e', 'Verra VCS', 1),
          leaf('mangrove', 'Mangrove Restoration', '0.8M tCO2e', 'Gold Standard', 1),
          leaf('peatland', 'Peatland Rewetting', '0.4M tCO2e', 'Verra VCS', 1),
        ]),
        comp('biodiversity', 'Biodiversity Co-Benefits', null, null, [
          leaf('species_protected', 'Species Protected', '42', 'IUCN Red List', 1),
          leaf('habitat_restored', 'Habitat Restored', '12,400 ha', 'Project Reports', 2),
        ]),
      ], ['Verra VCS', 'Gold Standard', 'IUCN'], 'NbS investment portfolio'),

      m('nbs_returns', 'NbS Financial Returns', 'Revenue and return metrics', null, [
        leaf('carbon_revenue', 'Carbon Credit Revenue', '$18M/yr', 'Registry Sales', 1),
        leaf('biodiversity_credits', 'Biodiversity Credits', '$4.2M/yr', 'Pilot Markets', 3),
        leaf('irr', 'Portfolio IRR', '8.4%', 'Financial Model', 3),
      ], ['Registry Data', 'Financial Model'], 'NbS financial return analysis'),
    ],
  },

  '/sll-slb-v2': {
    moduleCode: 'EM-008', sprint: 'SPEC',
    metrics: [
      m('sll_kpis', 'SLL KPI Tracking', 'Sustainability-linked loan KPI monitoring', null, [
        comp('env_kpis', 'Environmental KPIs', null, null, [
          leaf('ghg_reduction', 'GHG Reduction Target', '-30% by 2030', 'Loan Docs', 1),
          leaf('ghg_actual', 'GHG Actual', '-18%', 'Annual Report', 2),
          leaf('on_track', 'On Track', 'At Risk', 'Internal Assessment', 2),
        ]),
        comp('social_kpis', 'Social KPIs', null, null, [
          leaf('diversity', 'Board Diversity', '35%', 'Annual Report', 1),
          leaf('safety', 'LTIR', '0.42', 'HSE Report', 1),
        ]),
      ], ['LSTA/LMA SLLP', 'Loan Documentation'], 'SLL KPI performance tracking'),

      m('margin_ratchet', 'Margin Ratchet', 'Margin adjustment mechanism', null, [
        leaf('ratchet_range', 'Ratchet Range', '+/-10bps', 'Loan Docs', 1),
        leaf('current_adj', 'Current Adjustment', '-5bps', 'Performance', 1),
        leaf('annual_impact', 'Annual Impact', '-$0.8M', 'Financial Model', 2),
      ], ['Loan Documentation'], 'Margin ratchet mechanism'),

      m('target_validation', 'Target Validation', 'SPT ambition assessment', null, [
        leaf('science_aligned', 'Science-Aligned', '75%', 'SBTi Assessment', 2),
        leaf('third_party', 'Third-Party Verified', '100%', 'SPO Provider', 1),
        leaf('ambitious', 'Sufficiently Ambitious', 'Yes', 'LMA Assessment', 2),
      ], ['LMA SLLP', 'SBTi', 'SPO'], 'SLL target ambition validation'),
    ],
  },

  '/climate-tech': {
    moduleCode: 'EM-009', sprint: 'SPEC',
    metrics: [
      m('cleantech_inv', 'Cleantech Investment', 'Climate technology investment portfolio', null, [
        comp('renewable', 'Renewable Energy', '$2.4B', null, [
          leaf('solar', 'Solar Tech', '$1.2B', 'BNEF', 1),
          leaf('wind', 'Wind Tech', '$0.8B', 'BNEF', 1),
          leaf('storage', 'Energy Storage', '$0.4B', 'BNEF', 1),
        ]),
        comp('mobility', 'Clean Mobility', '$1.8B', null, [
          leaf('ev', 'EV/Battery', '$1.2B', 'BNEF', 1),
          leaf('hydrogen_mob', 'Hydrogen Mobility', '$0.6B', 'BNEF', 1),
        ]),
        comp('industrial', 'Industrial Decarbonization', '$0.8B', null, [
          leaf('ccus', 'CCUS', '$0.5B', 'IEA', 2),
          leaf('green_steel', 'Green Steel/Cement', '$0.3B', 'Company Reports', 3),
        ]),
      ], ['BNEF', 'IEA', 'PitchBook'], 'Cleantech investment allocation'),

      m('trl', 'Technology Readiness', 'TRL assessment across portfolio', null, [
        leaf('trl_avg', 'Avg TRL', '6.2', 'Technical Assessment', 3),
        leaf('commercial_pct', 'Commercial (TRL 9)', '42%', 'Technical Assessment', 3),
        leaf('demo_pct', 'Demo (TRL 6-8)', '38%', 'Technical Assessment', 3),
      ], ['Technical Assessment'], 'Technology readiness level analysis'),

      m('market_size', 'Addressable Market', 'TAM for climate tech sectors', null, [
        leaf('tam_2030', 'TAM 2030', '$4.2T', 'BNEF', 2),
        leaf('tam_2050', 'TAM 2050', '$12.8T', 'BNEF', 2),
        leaf('cagr', 'CAGR', '18%', 'BNEF', 2),
      ], ['BNEF', 'McKinsey'], 'Climate tech market sizing'),
    ],
  },

  '/vcm-integrity': {
    moduleCode: 'EM-010', sprint: 'SPEC',
    metrics: [
      m('vcm_quality', 'VCM Quality Score', 'Carbon credit quality assessment', null, [
        comp('additionality', 'Additionality', '82/100', null, [
          leaf('baseline', 'Baseline Rigor', '85/100', 'ICVCM CCP', 1),
          leaf('counterfactual', 'Counterfactual Test', 'Pass', 'ICVCM CCP', 1),
        ]),
        comp('permanence', 'Permanence', '71/100', null, [
          leaf('reversal_risk', 'Reversal Risk', '12%', 'Buffer Pool', 2),
          leaf('monitoring', 'MRV Quality', '78/100', 'Verra VCS', 1),
        ]),
        comp('leakage', 'Leakage Assessment', '88/100', null, [
          leaf('leakage_pct', 'Estimated Leakage', '8%', 'Methodology', 2),
          leaf('mitigation', 'Leakage Mitigation', 'Adequate', 'Verra VCS', 1),
        ]),
      ], ['ICVCM CCP', 'Verra VCS', 'Gold Standard'], 'VCM credit quality assessment'),

      m('icvcm_compliance', 'ICVCM Compliance', 'Core Carbon Principles alignment', null, [
        leaf('ccp_eligible', 'CCP Eligible', '68%', 'ICVCM', 1),
        leaf('methodology_approved', 'Methodology Approved', '72%', 'ICVCM', 1),
        leaf('host_country', 'Host Country Approval', '85%', 'Article 6', 1),
      ], ['ICVCM', 'UNFCCC'], 'ICVCM Core Carbon Principles compliance'),
    ],
  },

  '/forced-labour': {
    moduleCode: 'EM-011', sprint: 'SPEC',
    metrics: [
      m('supply_risk', 'Supply Chain Forced Labour Risk', 'Modern slavery risk assessment', null, [
        comp('country_risk', 'Country Risk', null, null, [
          leaf('gsi_score', 'Global Slavery Index', '42/100', 'Walk Free', 1),
          leaf('usdol_list', 'USDOL TVPRA List', '4 products', 'US DOL', 1),
        ]),
        comp('sector_risk', 'Sector Risk', null, null, [
          leaf('high_risk_sectors', 'High-Risk Sectors', '3 of 8', 'ILO', 1),
          leaf('commodities', 'Risk Commodities', '5', 'KnowTheChain', 2),
        ]),
        comp('supplier_risk', 'Supplier-Level Risk', null, null, [
          leaf('audited', 'Audited Suppliers', '78%', 'Audit Reports', 1),
          leaf('high_risk_suppliers', 'High-Risk Suppliers', '12', 'Audit Reports', 1),
        ]),
      ], ['Walk Free GSI', 'ILO', 'KnowTheChain'], 'Forced labour supply chain risk'),

      m('audit_coverage', 'Audit Coverage', 'Social audit penetration', null, [
        leaf('tier1_audited', 'Tier 1 Audited', '92%', 'Audit Program', 1),
        leaf('tier2_audited', 'Tier 2 Audited', '45%', 'Audit Program', 1),
        leaf('corrective_actions', 'Corrective Actions', '28 open', 'Audit Program', 1),
      ], ['Social Audit Program'], 'Social audit coverage metrics'),

      m('remediation_fl', 'Remediation', 'Remediation program status', null, [
        leaf('cases_identified', 'Cases Identified', '8', 'Grievance Mech.', 1),
        leaf('cases_remediated', 'Cases Remediated', '5', 'Grievance Mech.', 1),
        leaf('workers_impacted', 'Workers Impacted', '142', 'Remediation Log', 1),
      ], ['Grievance Mechanism'], 'Forced labour remediation tracking'),
    ],
  },

  '/critical-minerals': {
    moduleCode: 'EM-012', sprint: 'SPEC',
    metrics: [
      m('supply_chain_risk', 'Supply Chain Risk', 'Critical mineral supply concentration', null, [
        comp('lithium', 'Lithium', null, null, [
          leaf('li_conc', 'Top 3 Producer Share', '92%', 'USGS', 1),
          leaf('li_reserves', 'Reserve Life', '42 years', 'USGS', 1),
          leaf('li_price', 'Price Trend', '-22% YoY', 'Benchmark Mineral', 1),
        ]),
        comp('cobalt', 'Cobalt', null, null, [
          leaf('co_conc', 'DRC Production Share', '74%', 'USGS', 1),
          leaf('co_artisanal', 'Artisanal Mining %', '15%', 'Cobalt Institute', 2),
        ]),
        comp('rare_earth', 'Rare Earth Elements', null, null, [
          leaf('ree_china', 'China Processing Share', '87%', 'USGS', 1),
          leaf('ree_diversity', 'Supply Diversity Index', '0.22', 'HHI Calc', 2),
        ]),
      ], ['USGS', 'IEA Critical Minerals'], 'Critical mineral supply chain risk'),

      m('recycling', 'Recycling & Circularity', 'End-of-life material recovery', null, [
        leaf('li_recycling', 'Lithium Recycling Rate', '5%', 'IEA', 1),
        leaf('co_recycling', 'Cobalt Recycling Rate', '32%', 'Cobalt Institute', 1),
        leaf('urban_mining', 'Urban Mining Potential', '$8.2B by 2030', 'Research', 3),
      ], ['IEA', 'Cobalt Institute'], 'Critical mineral recycling analysis'),

      m('geopolitics', 'Geopolitical Risk', 'Supply chain geopolitical exposure', null, [
        leaf('friend_shore', 'Friend-Shoring Index', '0.42', 'Internal Model', 3),
        leaf('china_dep', 'China Dependency', '68%', 'Trade Data', 1),
        leaf('ira_impact', 'IRA/CRMA Impact', '+$4.2B incentives', 'Policy Analysis', 2),
      ], ['Trade Statistics', 'Policy Analysis'], 'Geopolitical supply chain risk'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // INDIA & SOVEREIGN (5 modules)
  // ═══════════════════════════════════════════════════════════════════
  '/em-climate-risk': {
    moduleCode: 'SOV-001', sprint: 'SOV',
    metrics: [
      m('em_vulnerability', 'EM Climate Vulnerability', 'Emerging market climate vulnerability index', null, [
        comp('physical_vuln', 'Physical Vulnerability', '72/100', null, [
          leaf('nd_gain', 'ND-GAIN Index', '42/100', 'Notre Dame', 1),
          leaf('exposure', 'Hazard Exposure', '68/100', 'IPCC AR6', 1),
          leaf('adaptive_cap', 'Adaptive Capacity', '38/100', 'ND-GAIN', 1),
        ]),
        comp('transition_vuln', 'Transition Vulnerability', '58/100', null, [
          leaf('fossil_dep', 'Fossil Fuel Dependency', '42%', 'IEA', 1),
          leaf('carbon_int_gdp', 'Carbon Intensity of GDP', '0.8 kgCO2/$', 'World Bank', 1),
        ]),
      ], ['ND-GAIN', 'IPCC AR6', 'IEA'], 'EM climate vulnerability assessment'),

      m('sovereign_spread', 'Climate-Adjusted Spread', 'Sovereign spread with climate overlay', null, [
        leaf('base_spread', 'Base Spread', '320bps', 'Bloomberg', 1),
        leaf('climate_add', 'Climate Add-On', '+45bps', 'Internal Model', 3),
        leaf('total_spread', 'Climate-Adj Spread', '365bps', 'Internal Model', 3),
      ], ['Bloomberg', 'Internal Model'], 'Climate-adjusted sovereign spread'),

      m('ndc_gap', 'NDC Gap Analysis', 'Paris NDC target vs trajectory', null, [
        leaf('ndc_target', 'NDC Target (2030)', '-33% vs BAU', 'UNFCCC', 1),
        leaf('current_traj', 'Current Trajectory', '-18%', 'Climate Action Tracker', 1),
        leaf('gap', 'NDC Gap', '15%', 'Climate Action Tracker', 1),
      ], ['UNFCCC', 'Climate Action Tracker'], 'NDC gap assessment'),
    ],
  },

  '/sovereign-swf': {
    moduleCode: 'SOV-002', sprint: 'SOV',
    metrics: [
      m('swf_climate', 'SWF Climate Exposure', 'Sovereign wealth fund fossil exposure', null, [
        comp('fossil_alloc', 'Fossil Fuel Allocation', '18%', null, [
          leaf('oil_gas', 'Oil & Gas Equity', '12%', 'Fund Reports', 2),
          leaf('coal', 'Coal Exposure', '2%', 'Fund Reports', 2),
          leaf('midstream', 'Midstream/Services', '4%', 'Fund Reports', 2),
        ]),
        comp('green_alloc', 'Green Allocation', '8%', null, [
          leaf('renewable_equity', 'Renewable Equity', '4%', 'Fund Reports', 2),
          leaf('green_bonds', 'Green Bonds', '3%', 'Fund Reports', 2),
          leaf('climate_infra', 'Climate Infra', '1%', 'Fund Reports', 2),
        ]),
      ], ['SWF Reports', 'IFSWF'], 'SWF climate portfolio exposure'),

      m('transition_plan', 'SWF Transition Plan', 'Net-zero transition strategy assessment', null, [
        leaf('nz_commitment', 'Net-Zero Commitment', 'Yes', 'Fund Policy', 1),
        leaf('interim_target', 'Interim Target', '-50% by 2030', 'Fund Policy', 1),
        leaf('divestment_policy', 'Fossil Divestment', 'Coal + Tar Sands', 'Fund Policy', 1),
      ], ['IFSWF', 'One Planet SWF'], 'SWF transition plan assessment'),
    ],
  },

  '/export-credit-esg': {
    moduleCode: 'SOV-003', sprint: 'SOV',
    metrics: [
      m('eca_screening', 'ECA Climate Screening', 'Export credit agency climate assessment', null, [
        comp('paris_align', 'Paris Alignment', null, null, [
          leaf('fossil_exclusion', 'Fossil Exclusion Policy', 'Yes (coal)', 'OECD Arrangement', 1),
          leaf('gas_policy', 'Gas Policy', 'Case-by-case', 'ECA Policy', 1),
        ]),
        comp('es_screening', 'E&S Screening', null, null, [
          leaf('ifc_alignment', 'IFC PS Alignment', '82%', 'ECA Framework', 1),
          leaf('esia_required', 'ESIA Required', 'Cat A+B', 'ECA Framework', 1),
        ]),
      ], ['OECD Export Credits', 'Berne Union'], 'ECA climate screening framework'),

      m('fossil_exclusion', 'Fossil Fuel Exclusion', 'ECA fossil fuel financing policy', null, [
        leaf('coal_excluded', 'Coal Projects Excluded', '100%', 'OECD Agreement', 1),
        leaf('oil_restricted', 'Oil Restrictions', 'New upstream', 'ECA Policy', 1),
        leaf('gas_exceptions', 'Gas Exceptions', '3 criteria', 'ECA Policy', 1),
      ], ['OECD Sector Understanding'], 'ECA fossil fuel exclusion policy'),

      m('portfolio_carbon', 'ECA Portfolio Carbon', 'Financed emissions from ECA portfolio', null, [
        leaf('total_fe', 'Total Financed Emissions', '8.4M tCO2e', 'ECA Portfolio', 2),
        leaf('intensity', 'Carbon Intensity', '420 tCO2e/$M', 'ECA Portfolio', 2),
        leaf('trend', 'YoY Trend', '-8%', 'ECA Portfolio', 2),
      ], ['ECA Portfolio Data'], 'ECA portfolio carbon footprint'),
    ],
  },

  '/equator-principles': {
    moduleCode: 'SOV-004', sprint: 'SOV',
    metrics: [
      m('ep_compliance', 'EP Compliance', 'Equator Principles compliance status', null, [
        comp('project_review', 'Project Review', null, null, [
          leaf('cat_a', 'Category A Projects', '4', 'EP Reports', 1),
          leaf('cat_b', 'Category B Projects', '28', 'EP Reports', 1),
          leaf('cat_c', 'Category C Projects', '42', 'EP Reports', 1),
        ]),
        comp('compliance_rate', 'Compliance Rate', '96%', null, [
          leaf('covenants_met', 'Covenants Met', '94%', 'EP Reports', 1),
          leaf('ap_on_track', 'Action Plans On Track', '88%', 'EP Reports', 1),
        ]),
      ], ['EP Association', 'EPFI Reports'], 'Equator Principles compliance'),

      m('es_class', 'E&S Classification', 'Project risk categorization', null, [
        leaf('high_risk', 'High Risk (Cat A)', '5%', 'EP Classification', 1),
        leaf('medium_risk', 'Medium Risk (Cat B)', '38%', 'EP Classification', 1),
        leaf('low_risk', 'Low Risk (Cat C)', '57%', 'EP Classification', 1),
      ], ['EP Association'], 'Equator Principles risk classification'),

      m('ep_screening', 'EP Screening', 'Environmental and social screening results', null, [
        leaf('esia_completed', 'ESIA Completed', '100% (Cat A+B)', 'Project Files', 1),
        leaf('indigenous', 'Indigenous Peoples', '2 FPIC required', 'ESIA', 1),
        leaf('resettlement', 'Involuntary Resettlement', '1 project', 'ESIA', 1),
      ], ['ESIA Reports', 'EP Association'], 'EP environmental/social screening'),
    ],
  },

  '/esms': {
    moduleCode: 'SOV-005', sprint: 'SOV',
    metrics: [
      m('esms_maturity', 'ESMS Maturity', 'Environmental & Social Management System assessment', null, [
        comp('policy', 'E&S Policy', '85/100', null, [
          leaf('policy_scope', 'Policy Scope', 'Comprehensive', 'Policy Doc', 1),
          leaf('board_approved', 'Board Approved', 'Yes', 'Board Minutes', 1),
        ]),
        comp('procedures', 'Procedures & Controls', '72/100', null, [
          leaf('screening', 'Screening Procedures', '82%', 'ESMS Manual', 1),
          leaf('monitoring', 'Monitoring System', '68%', 'ESMS Manual', 1),
          leaf('grievance', 'Grievance Mechanism', '78%', 'ESMS Manual', 1),
        ]),
        comp('capacity', 'Organizational Capacity', '68/100', null, [
          leaf('staff_trained', 'Staff Trained', '82%', 'Training Records', 1),
          leaf('budget', 'ESMS Budget', '$1.2M/yr', 'Budget Docs', 1),
        ]),
      ], ['IFC Performance Standards', 'ESMS Manual'], 'ESMS maturity assessment'),

      m('ifc_ps', 'IFC PS Alignment', 'IFC Performance Standards compliance', null, [
        leaf('ps1', 'PS1 Assessment', 'Aligned', 'IFC Assessment', 1),
        leaf('ps2', 'PS2 Labor', 'Aligned', 'IFC Assessment', 1),
        leaf('ps3', 'PS3 Pollution', 'Partial', 'IFC Assessment', 1),
        leaf('ps4', 'PS4 Community', 'Aligned', 'IFC Assessment', 1),
        leaf('ps6', 'PS6 Biodiversity', 'Gap', 'IFC Assessment', 1),
      ], ['IFC Performance Standards'], 'IFC PS compliance status'),

      m('audit_readiness', 'Audit Readiness', 'Readiness for external audit', null, [
        leaf('doc_complete', 'Documentation Complete', '88%', 'Internal Review', 1),
        leaf('last_audit', 'Last External Audit', '2025-Q3', 'Audit Report', 1),
        leaf('findings_open', 'Open Findings', '4', 'Audit Report', 1),
      ], ['Audit Reports'], 'ESMS audit readiness assessment'),
    ],
  },

};

export default MODULE_METADATA;
