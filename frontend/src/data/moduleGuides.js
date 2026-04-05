/**
 * Module Guides — In-Application Guidance Data
 * Comprehensive guide definitions for all modules (Sprint CA through CX)
 * Each entry: title, epCode, sprint, description, calculationEngine, dataPoints, userInteraction, references
 *
 * This is a PLACEHOLDER — the full 108-module guide data will replace this file.
 */

export const MODULE_GUIDES = {
  '/transition-risk-taxonomy-browser': {
    title: 'Transition Risk Taxonomy Browser',
    epCode: 'EP-CS1', sprint: 'CS',
    description: 'Interactive 4-level hierarchical taxonomy with 472 nodes covering 9 transition risk topics, 316 leaf-level assessment points, and 24 reference data sources. Browse the full taxonomy tree from Level 1 topics (Carbon & Emissions, Energy Transition, Policy & Regulatory, etc.) down to Level 4 leaf nodes (Natural Gas Boilers, EU ETS Phase IV, etc.).',
    calculationEngine: {
      methodology: 'Bottom-up weighted aggregation',
      formula: 'ParentScore = \u03a3(child.score \u00d7 child.weight) / \u03a3(child.weight)',
      standards: ['PCAF DQ 1-5', 'NGFS Phase 5', 'IPCC AR6', 'EU CSRD ESRS'],
      brief: 'Scores aggregate from 316 leaf nodes (Level 4) upward through sub-sub-topics (L3), sub-topics (L2), to 9 top-level topics (L1). Each node is weighted by its contribution to the parent. Data quality propagates upward as minimum of children (worst quality determines parent DQ). Confidence intervals combine via variance: parent_CI = \u221a(\u03a3(child_CI\u00b2 \u00d7 weight\u00b2)) / \u03a3(weight).'
    },
    dataPoints: [
      { name: 'Level 1 Nodes', value: '9', source: 'taxonomyTree.js', interpretation: 'Top-level transition risk topics: Carbon & Emissions, Energy Transition, Policy & Regulatory, Technology Disruption, Physical Climate Risk, Nature & Biodiversity, Social & Just Transition, Governance & Strategy, Geopolitical Risk' },
      { name: 'Level 2 Sub-topics', value: '38', source: 'taxonomyTree.js', interpretation: 'Second-level categories like Scope 1 Direct, Renewable Deployment, Carbon Pricing, etc.' },
      { name: 'Level 3 Sub-sub-topics', value: '109', source: 'taxonomyTree.js', interpretation: 'Third-level granular topics like Combustion Emissions, Solar PV, ETS Exposure, etc.' },
      { name: 'Level 4 Leaf Nodes', value: '316', source: 'taxonomyTree.js', interpretation: 'Deepest assessment points, each with specific data source and quality rating (1-5 PCAF scale)' },
      { name: 'Data Quality Score', value: '1-5', source: 'PCAF Standard', interpretation: '1=Audited verified data, 2=Reported unverified, 3=Physical activity proxy, 4=Revenue-based estimate, 5=Asset-class proxy' },
      { name: 'Reference Data Sources', value: '24', source: 'REFERENCE_DATA_SOURCES', interpretation: 'External data providers mapped to taxonomy nodes: CDP, SBTi, PCAF, NGFS, IEA, WRI GPPD, EPA GHGRP, EU ETS EUTL, GLEIF, World Bank WGI, ACLED, NASA FIRMS, etc.' },
      { name: 'High-Impact Sectors', value: '17', source: 'HIGH_IMPACT_SECTORS', interpretation: '12 NACE sectors classified as high climate impact per EU CSRD Delegated Act Annex I, plus 5 extended sectors' },
      { name: 'Geographic Regions', value: '12', source: 'GEOGRAPHIC_REGIONS', interpretation: 'North America, Western Europe, Eastern Europe, East Asia, Southeast Asia, South Asia, Oceania, MENA, Sub-Saharan Africa, Latin America, Central Asia, SIDS — covering 93 countries' },
    ],
    userInteraction: [
      'Navigate to /transition-risk-taxonomy-browser from the Taxonomy & Assessment Engine nav group',
      'The Taxonomy Tree tab shows all 9 Level 1 topics — click any topic to expand its sub-topics',
      'Continue drilling down: L1 \u2192 L2 \u2192 L3 \u2192 L4 to see leaf-level assessment points',
      'Each node displays its code, name, weight, and data sources',
      'Switch to Level Detail tab to see statistics per level (node counts, avg weights)',
      'Use Coverage Matrix to identify taxonomy nodes without a primary data source',
      'Sector Overlay shows which NACE high-impact sectors are affected by each L1 topic',
      'Configuration tab allows adjusting weights (must sum to 100%) and toggling active nodes',
    ],
    references: ['PCAF Global GHG Accounting and Reporting Standard v3', 'NGFS Phase 5 Climate Scenarios', 'IPCC AR6 WGI/WGII/WGIII', 'EU CSRD ESRS Standards (EFRAG)', 'GHG Protocol Corporate Standard', 'TCFD Recommendations', 'ISSB IFRS S1/S2', 'TNFD v1.0 Recommendations']
  },
  '/assessment-engine-dashboard': {
    title: 'Assessment Engine Dashboard',
    epCode: 'EP-CS2', sprint: 'CS',
    description: 'Score aggregation dashboard showing portfolio and entity-level transition risk scores computed via bottom-up weighted aggregation across the 472-node taxonomy. Includes sunburst visualization, entity heatmap, radar charts, scenario comparison, and quarterly trend analysis.',
    calculationEngine: {
      methodology: 'Bottom-up weighted aggregation + scenario sensitivity',
      formula: 'CompositeScore = \u03a3(L1_score_i \u00d7 L1_weight_i) / \u03a3(L1_weight_i)',
      standards: ['NGFS Phase 5', 'PCAF DQ 1-5', 'Basel IV IRB'],
      brief: 'Each entity is scored at the leaf (L4) level using data from 24 reference sources. Scores aggregate upward via weighted average. Portfolio-level scores are AUM-weighted across all entities. Scenario sensitivity applies NGFS multipliers to each sector-topic combination. Rating bands: A(\u226580), B(\u226560), C(\u226540), D(\u226520), E(<20).'
    },
    dataPoints: [
      { name: 'Portfolio Transition Score', formula: '\u03a3(entity_score_i \u00d7 exposure_i) / total_exposure', source: 'Weighted aggregation', interpretation: 'Exposure-weighted average transition risk score across all assessed entities' },
      { name: 'Entity Count', source: 'assessed_entities table', interpretation: 'Number of entities (FIs, energy companies, corporates) currently assessed' },
      { name: 'Rating Distribution', value: 'A/B/C/D/E', source: 'scoreToRating()', interpretation: 'Distribution of entity ratings across 5 bands' },
      { name: 'Scenario VaR', formula: 'score \u00d7 scenario_multiplier(sector)', source: 'NGFS Phase 5', interpretation: 'Score sensitivity under each of 6 NGFS scenarios' },
    ],
    userInteraction: [
      'Portfolio Overview shows aggregate score with A-E rating badge',
      'Click any entity in the ranking table to see its detailed breakdown',
      'Sunburst chart visualizes L1/L2 score hierarchy — larger slices indicate higher weight',
      'Entity heatmap shows all entities (rows) vs L1 topics (columns) with color-coded cells',
      'Radar chart compares selected entity against portfolio average',
      'Scenario Comparison tab toggles between 6 NGFS scenarios',
      'Trend Analysis shows quarterly score evolution with trendline',
    ],
    references: ['NGFS Phase 5 Scenario Database', 'PCAF Global GHG Standard', 'Basel IV CRE20 Risk Weights']
  },
  '/fi-client-portfolio-analyzer': {
    title: 'FI Client Portfolio Analyzer',
    epCode: 'EP-CT1', sprint: 'CT',
    description: 'Financial institution client portfolio analyzer covering 50 borrowers across 12 NACE high-impact sectors. Includes sector concentration analysis, geographic exposure heatmap, transition score distribution, line-of-business breakdown, and watchlist for high-risk clients (score < 40).',
    calculationEngine: {
      methodology: 'IFRS 9 3-stage ECL with climate overlay + Basel IV RWA',
      formula: 'ECL = PD \u00d7 LGD \u00d7 EAD \u00d7 DF; RWA = EAD \u00d7 RiskWeight(PD, LGD, M)',
      standards: ['IFRS 9', 'Basel IV SA/IRB', 'ECB SREP', 'PCAF'],
      brief: 'Each borrower is assessed against the full taxonomy. IFRS 9 staging: Stage 1 (12-month ECL, PD not significantly increased), Stage 2 (lifetime ECL, PD increased >2x), Stage 3 (credit-impaired). Climate overlay: PD_climate = PD_base \u00d7 (1 + \u03b3 \u00d7 \u0394transition_score). Basel IV risk weights applied per asset class. Concentration monitored via HHI index.'
    },
    dataPoints: [
      { name: 'Total Exposure', formula: '\u03a3(client_exposure_i)', source: 'fi_client_portfolios', interpretation: 'Sum of all client exposures in millions' },
      { name: 'Client Count', value: '50', source: 'Demo data', interpretation: 'Number of borrowers in the portfolio' },
      { name: 'Average Transition Score', formula: 'exposure-weighted mean of client scores', source: 'Taxonomy assessment', interpretation: 'Higher = better transition readiness' },
      { name: 'Watchlist Count', formula: 'count where score < 40', source: 'Threshold-based', interpretation: 'Clients requiring enhanced engagement or risk mitigation' },
      { name: 'Sector HHI', formula: '\u03a3(sector_share_i\u00b2)', source: 'Herfindahl-Hirschman Index', interpretation: 'Concentration index: >0.25 = highly concentrated, <0.15 = diversified' },
      { name: 'IFRS 9 Stage Distribution', value: 'Stage 1/2/3', source: 'IFRS 9 Standard', interpretation: 'Stage 1: performing, Stage 2: significant increase in credit risk, Stage 3: credit-impaired' },
    ],
    userInteraction: [
      'Client Overview tab shows all 50 borrowers with exposure, score, rating, sector, and LoB',
      'Sort by any column — click column header to toggle ascending/descending',
      'Sector Concentration shows TreeMap visualization — larger blocks = higher exposure',
      'Geography Heatmap shows exposure by 12 global regions',
      'Transition Score Distribution shows histogram — identify the tail of low-scoring clients',
      'Line of Business tab breaks down exposure across Corporate Banking, Investment Banking, Wealth Management, Transaction Banking',
      'Watchlist tab filters to clients with score < 40 — each has an Engage button for follow-up',
    ],
    references: ['IFRS 9 Financial Instruments (IASB)', 'Basel IV Final Framework (BCBS)', 'ECB SREP Climate Risk Methodology', 'PCAF Global GHG Standard', 'EU CSRD ESRS E1']
  },
  '/climate-var-engine': {
    title: 'Climate Value-at-Risk Engine',
    epCode: 'EP-CE1', sprint: 'CE',
    description: 'Climate Value-at-Risk engine computing integrated transition + physical + interaction risk under 5 NGFS scenarios. Interactive controls for AUM, horizon, and confidence level. Includes loss distribution, scenario decomposition, Delta CoVaR systemic risk, and stress test matrix.',
    calculationEngine: {
      methodology: 'Decomposed Climate VaR with interaction term',
      formula: 'CVaR_total = CVaR_transition + CVaR_physical + \u03c1 \u00b7 CVaR_interaction',
      standards: ['NGFS Phase 5', 'ECB Climate Stress Test 2024', 'BoE CBES'],
      brief: 'Climate VaR decomposes into three components: (1) Transition VaR = AUM \u00d7 transRate \u00d7 \u221a(T/10), driven by carbon pricing, policy, and technology risk; (2) Physical VaR = AUM \u00d7 physRate \u00d7 \u221a(T/10), driven by acute and chronic physical hazards; (3) Interaction VaR = \u03c1 \u00d7 \u221a(TransVaR \u00d7 PhysVaR) \u00d7 corrFactor, capturing compound effects. Horizon scaling uses \u221a(T/10) for multi-year extension. Each NGFS scenario has distinct parameters for all three components. Delta CoVaR measures each sector\u2019s marginal contribution to portfolio-level systemic climate risk.'
    },
    dataPoints: [
      { name: 'Total Climate VaR', formula: 'CVaR_trans + CVaR_phys + \u03c1\u00b7CVaR_inter', source: 'computeCVaR()', interpretation: 'Total expected loss from climate risk at specified confidence level' },
      { name: 'Transition VaR', formula: 'AUM \u00d7 transRate \u00d7 \u221a(T/10)', source: 'NGFS scenario parameters', interpretation: 'Loss from carbon pricing, policy, and technology disruption' },
      { name: 'Physical VaR', formula: 'AUM \u00d7 physRate \u00d7 \u221a(T/10)', source: 'IPCC AR6 hazard projections', interpretation: 'Loss from acute and chronic physical climate hazards' },
      { name: 'Interaction VaR', formula: '\u03c1 \u00d7 \u221a(TransVaR \u00d7 PhysVaR) \u00d7 corrFactor', source: 'Model parameter', interpretation: 'Compound effect where transition and physical risks amplify each other' },
      { name: 'Delta CoVaR', formula: 'SectorWeight \u00d7 SectorCVaR / PortfolioCVaR', source: 'Adrian & Brunnermeier (2016)', interpretation: 'Each sector\u2019s marginal contribution to portfolio systemic climate risk' },
      { name: 'Confidence Level', value: '90-99%', source: 'User input', interpretation: 'Probability that actual loss will not exceed the VaR estimate' },
      { name: 'Horizon', value: '1-30 years', source: 'User input', interpretation: 'Time horizon for VaR calculation — longer horizons have higher VaR due to \u221aT scaling' },
    ],
    userInteraction: [
      'Use the AUM slider ($1B-$50B) to set portfolio size',
      'Select NGFS scenario (Current Policies, Below 2\u00b0C, Net Zero 2050, Delayed Transition, Divergent Net Zero)',
      'Adjust horizon (1-30 years) and confidence level (90-99%)',
      'Climate VaR Calculator tab shows decomposition: Transition + Physical + Interaction = Total',
      'Loss Distribution tab shows normal approximation probability density with VaR marker',
      'Scenario Decomposition shows which component dominates under each scenario',
      'Delta CoVaR tab shows systemic risk contribution by sector (Energy typically highest)',
      'Stress Test Matrix shows VaR across all 5 scenarios \u00d7 7 time horizons',
    ],
    references: ['NGFS Phase 5 Climate Scenarios', 'ECB Climate Stress Test Methodology (2024)', 'BoE CBES Guidance', 'Adrian & Brunnermeier (2016) CoVaR', 'IPCC AR6 WGI Regional Projections']
  },
};
