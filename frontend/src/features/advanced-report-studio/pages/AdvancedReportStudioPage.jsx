import React, { useState, useMemo, useCallback } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  AreaChart, Area, ReferenceLine,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════════════════════════
   THEME & CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════ */

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8',
  navy: '#1b3a5c', gold: '#c5a96a', sage: '#5a8a6a',
  text: '#1b3a5c', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706',
  font: "'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

const SECTOR_COLORS = [
  '#1b3a5c', '#c5a96a', '#5a8a6a', '#4f46e5', '#0891b2',
  '#7c3aed', '#be185d', '#d97706', '#15803d', '#1e40af', '#9f1239',
];

const NGFS_SCENARIOS = [
  { name: 'Net Zero 2050', category: 'Orderly', color: '#10b981', temp: '1.5\u00b0C', carbon2030: 250, sectorShocks: { Energy: -0.35, Materials: -0.22, Industrials: -0.15, Utilities: -0.28, Financials: -0.08, IT: +0.12, 'Health Care': +0.05, 'Consumer Discretionary': -0.10, 'Consumer Staples': -0.05 } },
  { name: 'Below 2\u00b0C', category: 'Orderly', color: '#3b82f6', temp: '1.8\u00b0C', carbon2030: 150, sectorShocks: { Energy: -0.20, Materials: -0.14, Industrials: -0.10, Utilities: -0.18, Financials: -0.05, IT: +0.10, 'Health Care': +0.04, 'Consumer Discretionary': -0.06, 'Consumer Staples': -0.03 } },
  { name: 'Delayed Transition', category: 'Disorderly', color: '#f97316', temp: '1.8\u00b0C', carbon2030: 120, sectorShocks: { Energy: -0.55, Materials: -0.38, Industrials: -0.25, Utilities: -0.45, Financials: -0.12, IT: +0.08, 'Health Care': +0.03, 'Consumer Discretionary': -0.20, 'Consumer Staples': -0.10 } },
  { name: 'Hot House World', category: 'Hot House', color: '#ef4444', temp: '3.5\u00b0C+', carbon2030: 30, sectorShocks: { Energy: -0.05, Materials: -0.18, Industrials: -0.12, Utilities: -0.08, Financials: -0.20, IT: -0.05, 'Health Care': -0.08, 'Consumer Discretionary': -0.15, 'Consumer Staples': -0.22 } },
];

const YOY_DATA = [
  { year: 'FY2022', waci: 320, sbtiPct: 8, scope12: 85, impliedTemp: '3.2' },
  { year: 'FY2023', waci: 265, sbtiPct: 14, scope12: 72, impliedTemp: '2.8' },
  { year: 'FY2024', waci: null, sbtiPct: null, scope12: null, impliedTemp: null },
];

/* ═══════════════════════════════════════════════════════════════════════════
   10 FRAMEWORK DEFINITIONS
   ═══════════════════════════════════════════════════════════════════════════ */

const FRAMEWORKS = {
  TCFD: {
    label: 'TCFD',
    fullName: 'Task Force on Climate-related Financial Disclosures',
    color: '#1b3a5c',
    categories: [
      { name: 'Governance', items: [
        { id: 'A', label: 'Board oversight of climate-related risks and opportunities' },
        { id: 'B', label: "Management's role in assessing and managing climate-related risks" },
      ]},
      { name: 'Strategy', items: [
        { id: 'C', label: 'Climate-related risks and opportunities identified' },
        { id: 'D', label: 'Impact on business, strategy and financial planning' },
        { id: 'E', label: 'Resilience of strategy under 2\u00b0C and 4\u00b0C scenarios' },
      ]},
      { name: 'Risk Management', items: [
        { id: 'F', label: 'Processes for identifying and assessing climate-related risks' },
        { id: 'G', label: 'Processes for managing climate-related risks' },
        { id: 'H', label: 'Integration into overall risk management' },
      ]},
      { name: 'Metrics & Targets', items: [
        { id: 'I', label: 'GHG Scope 1, 2, 3 emissions' },
        { id: 'J', label: 'Weighted Average Carbon Intensity (WACI)' },
        { id: 'K', label: 'Climate-related targets and performance' },
      ]},
    ],
  },
  SFDR: {
    label: 'SFDR PAI',
    fullName: 'Sustainable Finance Disclosure Regulation \u2014 Principal Adverse Indicators',
    color: '#2563eb',
    categories: [
      { name: 'Climate & Environment', items: [
        { id: '1', label: 'GHG emissions (Scope 1, 2, 3)' },
        { id: '2', label: 'Carbon footprint' },
        { id: '3', label: 'GHG intensity of investee companies' },
        { id: '4', label: 'Exposure to fossil fuel companies' },
        { id: '5', label: 'Non-renewable energy consumption' },
        { id: '6', label: 'Energy consumption intensity (high-impact sectors)' },
        { id: '7', label: 'Activities negatively affecting biodiversity' },
        { id: '8', label: 'Emissions to water' },
        { id: '9', label: 'Hazardous waste ratio' },
      ]},
      { name: 'Social', items: [
        { id: '10', label: 'Violations of UNGC and OECD MNE Guidelines' },
        { id: '11', label: 'Lack of processes to monitor compliance' },
        { id: '12', label: 'Unadjusted gender pay gap' },
        { id: '13', label: 'Board gender diversity' },
        { id: '14', label: 'Exposure to controversial weapons' },
      ]},
      { name: 'Additional (Climate)', items: [
        { id: '15', label: 'GHG emissions per country' },
        { id: '16', label: 'Real estate assets \u2014 energy efficiency' },
        { id: '17', label: 'Investments in companies without carbon emission reduction initiatives' },
        { id: '18', label: 'Exposure to fossil fuel sector' },
      ]},
    ],
  },
  CSRD: {
    label: 'CSRD ESRS E1',
    fullName: 'Corporate Sustainability Reporting Directive \u2014 ESRS E1 Climate Change',
    color: '#15803d',
    categories: [
      { name: 'ESRS E1 Disclosures', items: [
        { id: 'E1-1', label: 'Transition plan for climate change mitigation' },
        { id: 'E1-2', label: 'Policies related to climate change mitigation and adaptation' },
        { id: 'E1-3', label: 'Actions and resources in relation to climate change' },
        { id: 'E1-4', label: 'Targets related to climate change mitigation and adaptation' },
        { id: 'E1-5', label: 'Energy consumption and mix' },
        { id: 'E1-6', label: 'Gross Scopes 1, 2, 3 and total GHG emissions' },
        { id: 'E1-7', label: 'GHG removals and GHG mitigation projects' },
        { id: 'AR-1', label: 'Physical risks of climate change (Additional Requirements)' },
        { id: 'AR-2', label: 'Transition risks and opportunities (Additional Requirements)' },
      ]},
    ],
  },
  UNPRI: {
    label: 'UN PRI',
    fullName: 'United Nations Principles for Responsible Investment',
    color: '#7c3aed',
    categories: [
      { name: 'Six Principles', items: [
        { id: 'P1', label: 'Principle 1: Incorporate ESG issues into investment analysis and decision-making' },
        { id: 'P2', label: 'Principle 2: Active ownership and ESG issues integration' },
        { id: 'P3', label: 'Principle 3: Seek appropriate disclosure on ESG issues' },
        { id: 'P4', label: 'Principle 4: Promote acceptance and implementation in investment industry' },
        { id: 'P5', label: 'Principle 5: Work together to enhance effectiveness of implementation' },
        { id: 'P6', label: 'Principle 6: Report on activities and progress towards implementing Principles' },
      ]},
    ],
  },
  Custom: {
    label: 'Custom',
    fullName: 'Custom Report Configuration',
    color: '#9f1239',
    categories: [
      { name: 'Select Any Sections', items: [
        { id: 'C-WACI', label: 'WACI & Carbon Footprint' },
        { id: 'C-ESG', label: 'ESG Score Summary' },
        { id: 'C-SBTI', label: 'SBTi & Net Zero Targets' },
        { id: 'C-SECT', label: 'Sector Allocation & Tilts' },
        { id: 'C-PHYS', label: 'Physical Risk Exposure' },
        { id: 'C-TRAN', label: 'Transition Risk Exposure' },
        { id: 'C-STKH', label: 'Stewardship & Engagement' },
        { id: 'C-BIOD', label: 'Biodiversity & Nature' },
      ]},
    ],
  },
  ISSB: {
    label: 'ISSB IFRS S2',
    fullName: 'ISSB IFRS S2 \u2014 Climate-related Disclosures',
    color: '#0d9488',
    categories: [
      { name: 'Governance', items: [
        { id: 'S2-G1', label: 'Governance body oversight of climate-related risks' },
        { id: 'S2-G2', label: 'Management role in climate-related risk assessment' },
      ]},
      { name: 'Strategy', items: [
        { id: 'S2-S1', label: 'Climate-related risks and opportunities' },
        { id: 'S2-S2', label: 'Business model and value chain effects' },
        { id: 'S2-S3', label: 'Strategy and decision-making impact' },
        { id: 'S2-S4', label: 'Financial position, performance and cash flows' },
        { id: 'S2-S5', label: 'Climate resilience \u2014 scenario analysis' },
      ]},
      { name: 'Risk Management', items: [
        { id: 'S2-R1', label: 'Processes for identifying climate risks' },
        { id: 'S2-R2', label: 'Processes for managing climate risks' },
        { id: 'S2-R3', label: 'Integration into overall risk management' },
      ]},
      { name: 'Metrics & Targets', items: [
        { id: 'S2-M1', label: 'Cross-industry metrics \u2014 GHG emissions' },
        { id: 'S2-M2', label: 'Cross-industry metrics \u2014 transition risks' },
        { id: 'S2-M3', label: 'Cross-industry metrics \u2014 physical risks' },
        { id: 'S2-M4', label: 'Cross-industry metrics \u2014 climate-related opportunities' },
        { id: 'S2-M5', label: 'Internal carbon pricing' },
        { id: 'S2-M6', label: 'Targets set and performance against targets' },
      ]},
    ],
  },
  TNFD: {
    label: 'TNFD LEAP',
    fullName: 'TNFD LEAP \u2014 Nature-related Disclosures',
    color: '#059669',
    categories: [
      { name: 'Locate', items: [
        { id: 'L1', label: 'Locate interface with nature \u2014 priority locations' },
        { id: 'L2', label: 'Nature-related dependencies by sector and geography' },
      ]},
      { name: 'Evaluate', items: [
        { id: 'EV1', label: 'Evaluate dependencies and impacts on nature' },
        { id: 'EV2', label: 'Ecosystem service dependency assessment' },
      ]},
      { name: 'Assess', items: [
        { id: 'AS1', label: 'Assess material nature-related risks' },
        { id: 'AS2', label: 'Assess nature-related opportunities' },
      ]},
      { name: 'Prepare', items: [
        { id: 'PR1', label: 'Strategy and resource allocation for nature' },
        { id: 'PR2', label: 'Nature-related targets and metrics' },
        { id: 'PR3', label: 'Performance tracking and disclosure' },
      ]},
    ],
  },
  EUTAX: {
    label: 'EU Taxonomy',
    fullName: 'EU Taxonomy \u2014 Alignment Assessment',
    color: '#4f46e5',
    categories: [
      { name: 'Substantial Contribution', items: [
        { id: 'TX-1', label: 'Climate change mitigation \u2014 eligible activities' },
        { id: 'TX-2', label: 'Climate change adaptation \u2014 eligible activities' },
        { id: 'TX-3', label: 'Water and marine resources' },
        { id: 'TX-4', label: 'Circular economy' },
        { id: 'TX-5', label: 'Pollution prevention and control' },
        { id: 'TX-6', label: 'Biodiversity and ecosystems' },
      ]},
      { name: 'DNSH & Minimum Safeguards', items: [
        { id: 'TX-DNSH', label: 'Do No Significant Harm assessment' },
        { id: 'TX-MS', label: 'Minimum safeguards compliance (OECD/UNGP)' },
      ]},
      { name: 'Alignment Metrics', items: [
        { id: 'TX-KPI1', label: 'Taxonomy-aligned revenue (% of portfolio)' },
        { id: 'TX-KPI2', label: 'Taxonomy-aligned CapEx (% of portfolio)' },
        { id: 'TX-KPI3', label: 'Taxonomy-aligned OpEx (% of portfolio)' },
      ]},
    ],
  },
  PCAF: {
    label: 'PCAF',
    fullName: 'PCAF Standard \u2014 Financed Emissions Reporting',
    color: '#be185d',
    categories: [
      { name: 'Portfolio Emissions', items: [
        { id: 'PCAF-1', label: 'Absolute financed emissions by asset class' },
        { id: 'PCAF-2', label: 'Emissions intensity by asset class' },
        { id: 'PCAF-3', label: 'Data quality score per asset class' },
        { id: 'PCAF-4', label: 'Attribution methodology (EVIC-based)' },
      ]},
      { name: 'Asset Class Breakdown', items: [
        { id: 'PCAF-EQ', label: 'Listed equity and corporate bonds' },
        { id: 'PCAF-BL', label: 'Business loans' },
        { id: 'PCAF-PF', label: 'Project finance' },
        { id: 'PCAF-CRE', label: 'Commercial real estate' },
        { id: 'PCAF-MO', label: 'Mortgages' },
        { id: 'PCAF-SV', label: 'Sovereign bonds' },
      ]},
      { name: 'Targets & Engagement', items: [
        { id: 'PCAF-T1', label: 'Sector decarbonisation targets' },
        { id: 'PCAF-T2', label: 'Engagement strategy for high emitters' },
        { id: 'PCAF-T3', label: 'Year-over-year emissions reduction progress' },
      ]},
    ],
  },
  GRI: {
    label: 'GRI',
    fullName: 'GRI Standards \u2014 Sustainability Reporting',
    color: '#1e3a8a',
    categories: [
      { name: 'Universal Standards', items: [
        { id: 'GRI-2', label: 'GRI 2: General Disclosures (organization profile)' },
        { id: 'GRI-3', label: 'GRI 3: Material Topics' },
      ]},
      { name: 'Environmental Topics', items: [
        { id: 'GRI-302', label: 'GRI 302: Energy' },
        { id: 'GRI-303', label: 'GRI 303: Water and Effluents' },
        { id: 'GRI-304', label: 'GRI 304: Biodiversity' },
        { id: 'GRI-305', label: 'GRI 305: Emissions' },
        { id: 'GRI-306', label: 'GRI 306: Waste' },
      ]},
      { name: 'Social Topics', items: [
        { id: 'GRI-401', label: 'GRI 401: Employment' },
        { id: 'GRI-403', label: 'GRI 403: Occupational Health and Safety' },
        { id: 'GRI-405', label: 'GRI 405: Diversity and Equal Opportunity' },
        { id: 'GRI-413', label: 'GRI 413: Local Communities' },
      ]},
    ],
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   FRAMEWORK AUTO-CONTENT GENERATORS (for live preview)
   ═══════════════════════════════════════════════════════════════════════════ */

function getAutoContent(frameworkKey, sectionId, pm, clientDetails, holdings) {
  const fmtN = (n, d = 1) => (typeof n === 'number' && isFinite(n)) ? n.toFixed(d) : 'N/A';
  const period = clientDetails.reportingPeriod || 'FY2024';
  const numHoldings = holdings.length || 6;

  const contentMap = {
    TCFD: {
      A: 'The Board of Directors maintains oversight of climate-related risks through the Risk & Sustainability Committee, convening quarterly. Climate risk is a standing agenda item at all Board meetings.',
      B: 'Senior management, led by the CIO and Head of ESG, is responsible for day-to-day climate risk assessment. An internal Climate Risk Working Group meets monthly to review portfolio exposures.',
      C: 'The fund has identified material transition risks (policy, technology) and physical risks (acute weather events, chronic shifts) affecting portfolio valuations across all time horizons.',
      D: 'Climate risks and opportunities are integrated into the investment process, including security selection and portfolio construction. High-carbon holdings are subject to enhanced due diligence.',
      E: 'Resilience assessed under 1.5\u20132\u00b0C orderly transition and 3\u20134\u00b0C disorderly/high-physical scenarios. Portfolio demonstrates manageable tail risk under orderly transition assumptions.',
      F: 'Climate risks are identified through quantitative screening (WACI, transition risk scores, physical risk indicators), sector-level NGFS scenario analysis, and company-level engagement.',
      G: 'Risks are managed through portfolio tilts, active engagement, escalation policy for laggards, and climate VaR monitoring. Derivative overlays used for tail-risk hedging where appropriate.',
      H: 'Climate risk is fully embedded in the risk framework. Climate VaR reported alongside financial VaR monthly. Climate risk limits are embedded in the Investment Management Agreement.',
    },
    SFDR: {
      1: `GHG Emissions (Scope 1+2): ${fmtN(pm.scope1 + pm.scope2, 0)} Mt CO\u2082e for the portfolio. Data coverage: ${fmtN(pm.dataCoverage)}% of holdings report emissions directly.`,
      2: `Carbon footprint measured as WACI: ${fmtN(pm.waci)} t CO\u2082e / USD Mn Revenue. Benchmark comparison: MSCI ACWI at 185 t CO\u2082e / USD Mn.`,
      3: `GHG intensity of investee companies: weighted average of ${fmtN(pm.waci)} t CO\u2082e per USD Mn revenue across ${numHoldings} holdings.`,
      4: `Exposure to fossil fuel companies: Energy sector represents ${fmtN(pm.energySectorPct)}% of portfolio by weight.`,
      5: 'Non-renewable energy consumption data collected for material holdings. Portfolio average non-renewable share estimated at 62% based on sector averages.',
      6: `Energy consumption intensity for high-impact climate sectors (NACE A-H, L): ${fmtN(pm.highImpactSectorPct)}% of portfolio in high-impact sectors.`,
      7: 'Biodiversity impact assessment conducted through sector screening. No holdings identified with operations in or adjacent to biodiversity-sensitive areas without mitigation.',
      8: 'Emissions to water monitored through ESG screening. Zero flagged violations in the reporting period.',
      9: 'Hazardous waste ratio tracked for materials and industrials holdings. Portfolio-weighted hazardous waste ratio estimated at 2.3%.',
      10: 'Zero companies in the portfolio flagged for violations of UNGC principles or OECD Guidelines for Multinational Enterprises.',
      11: 'All portfolio companies screened for compliance monitoring processes. 94% have formal compliance frameworks in place.',
      12: 'Unadjusted gender pay gap data available for 68% of holdings. Portfolio-weighted average gap: 14.2%.',
      13: 'Board gender diversity: portfolio-weighted average of 32.4% female board representation across holdings.',
      14: 'Zero exposure to companies involved in anti-personnel mines, cluster munitions, chemical or biological weapons.',
      15: `GHG emissions breakdown by country of incorporation tracked across ${numHoldings} holdings.`,
      16: 'Real estate energy efficiency: not material for this fund (primarily listed equity).',
      17: `${fmtN(100 - pm.sbtiPct)}% of portfolio companies lack carbon emission reduction initiatives per SBTi/CDP data.`,
      18: `Fossil fuel sector exposure: ${fmtN(pm.highImpactSectorPct)}% in high-impact energy sectors including upstream, midstream and downstream operations.`,
    },
    CSRD: {
      'E1-1': `Portfolio alignment with Paris Agreement targets. ${fmtN(pm.sbtiPct)}% of portfolio holdings have SBTi commitments as of ${period}. The fund manager engages with all portfolio companies to develop credible transition plans aligned with a 1.5\u00b0C pathway.`,
      'E1-2': 'The investment manager has implemented a comprehensive climate policy covering risk identification, portfolio management, and engagement, aligned with EU Taxonomy and SFDR requirements.',
      'E1-3': `Actions include: engagement with ${Math.round(pm.sbtiPct * 0.8)}% of high-emitting portfolio companies; proxy voting on climate resolutions; integration of NGFS scenario pathways into risk models.`,
      'E1-4': `Climate targets: SBTi coverage \u226550% by 2026 (current: ${fmtN(pm.sbtiPct)}%); WACI reduction 50% by 2030; net-zero portfolio by 2050.`,
      'E1-5': `High-impact sectors (Energy, Materials, Utilities) represent ${fmtN(pm.highImpactSectorPct)}% of portfolio by weight. Energy consumption intensity data collected for all material holdings.`,
      'E1-6': `Scope 1: ${fmtN(pm.scope1, 0)} Mt CO\u2082e, Scope 2: ${fmtN(pm.scope2, 0)} Mt CO\u2082e, WACI: ${fmtN(pm.waci)} t CO\u2082e / USD Mn Revenue.`,
      'E1-7': 'GHG removal activities and nature-based solutions tracked across eligible portfolio companies. Carbon offset quality assessed against VCS and Gold Standard criteria.',
      'AR-1': 'Physical risk exposure assessed using NGFS scenario analysis and proprietary climate hazard scoring across flood, heat, drought, and storm risk categories.',
      'AR-2': `Transition risk exposure: ${fmtN(pm.energySectorPct)}% in high-transition-risk Energy sector. Portfolio carbon budget assessed against 1.5\u00b0C pathway.`,
    },
    UNPRI: {
      P1: `ESG factors are integrated into quantitative investment models. Climate risk scores, WACI (${fmtN(pm.waci)} t/USD Mn), and ESG ratings drive security selection and portfolio construction.`,
      P2: `Active ownership exercised through proxy voting and direct engagement. This period: engaged ${numHoldings} portfolio companies on climate targets and board diversity.`,
      P3: 'We advocate for standardised ESG disclosures aligned with TCFD, SASB, and GRI. We support regulatory initiatives improving comparability of sustainability reporting.',
      P4: 'We collaborate with industry bodies including IIGCC, UNPRI, and regional investor coalitions to promote responsible investment practices across the industry.',
      P5: 'We participate in collaborative engagement initiatives and co-filing of shareholder resolutions on material ESG issues, amplifying impact through collective action.',
      P6: `This report constitutes our annual PRI disclosure. Portfolio ESG data: WACI ${fmtN(pm.waci)}, SBTi coverage ${fmtN(pm.sbtiPct)}%, implied temperature ${pm.impliedTemp}\u00b0C.`,
    },
    Custom: {
      'C-WACI': `Portfolio WACI: ${fmtN(pm.waci)} t CO\u2082e / USD Mn Revenue. Total carbon footprint (S1+S2): ${fmtN(pm.scope1 + pm.scope2, 0)} Mt CO\u2082e.`,
      'C-ESG': `Portfolio-weighted ESG score and distribution across holdings. Data coverage: ${fmtN(pm.dataCoverage)}%.`,
      'C-SBTI': `${fmtN(pm.sbtiPct)}% of holdings have SBTi commitments. Target: \u226550% by 2026. Net-zero portfolio commitment: 2050.`,
      'C-SECT': `Sector allocation analysis with climate-aware tilts. High-impact sectors at ${fmtN(pm.highImpactSectorPct)}% of portfolio.`,
      'C-PHYS': 'Physical risk exposure mapped across flood, wildfire, drought, and heat stress categories using climate hazard models.',
      'C-TRAN': `Transition risk assessment: Energy sector ${fmtN(pm.energySectorPct)}% of portfolio. Carbon price sensitivity analysed under NGFS scenarios.`,
      'C-STKH': `Stewardship activities: engaged ${numHoldings} companies on ESG issues. Proxy voting on all climate-related resolutions.`,
      'C-BIOD': 'Biodiversity and nature-related risk screening conducted. TNFD LEAP framework applied to identify nature dependencies.',
    },
    ISSB: {
      'S2-G1': 'The governing body maintains oversight of climate-related risks and opportunities through a dedicated sustainability committee that meets quarterly. The committee reviews climate scenario outputs, emissions trajectory, and strategic alignment with net-zero commitments.',
      'S2-G2': `Management is responsible for identifying, assessing, and managing climate-related risks through an internal ESG Integration team. The team uses WACI (${fmtN(pm.waci)} t/USD Mn) and transition risk scores as core decision inputs.`,
      'S2-S1': `Climate-related risks identified include: transition risks from carbon pricing and policy changes affecting ${fmtN(pm.energySectorPct)}% energy sector exposure; physical risks from extreme weather events; and opportunities in clean technology and renewable energy sectors.`,
      'S2-S2': 'Business model impacts include shift toward low-carbon investment strategies, enhanced ESG integration in security selection, and active engagement with high-emitting portfolio companies on transition plans.',
      'S2-S3': `Strategy incorporates climate considerations: portfolio tilted away from high-carbon sectors; SBTi coverage at ${fmtN(pm.sbtiPct)}% and targeting \u226550% by 2026; WACI reduction targets set against 1.5\u00b0C pathway.`,
      'S2-S4': `Financial impacts: estimated Climate VaR of -3.2% to -8.7% under disorderly transition. Portfolio implied temperature: ${pm.impliedTemp}\u00b0C indicating alignment gap with Paris Agreement goals.`,
      'S2-S5': 'Climate resilience assessed using NGFS scenarios (Net Zero 2050, Below 2\u00b0C, Delayed Transition, Hot House World). Portfolio shows manageable risk under orderly scenarios but material tail risk under disorderly pathways.',
      'S2-R1': 'Climate risks identified through quantitative screening (WACI, carbon intensity, physical risk scores), sector-level analysis using NGFS pathways, and bottom-up company assessment of transition readiness.',
      'S2-R2': 'Climate risks managed through: dynamic portfolio rebalancing; engagement with laggards; exclusion of companies failing minimum transition standards; and derivative overlays for tail risk hedging.',
      'S2-R3': 'Climate risk is integrated into the enterprise risk management framework. Climate VaR is reported alongside traditional financial VaR. Risk appetite statements include climate-specific limits.',
      'S2-M1': `GHG emissions: Scope 1: ${fmtN(pm.scope1, 0)} Mt CO\u2082e, Scope 2: ${fmtN(pm.scope2, 0)} Mt CO\u2082e, Scope 3 (estimated): ${fmtN((pm.scope1 + pm.scope2) * 3.2, 0)} Mt CO\u2082e. WACI: ${fmtN(pm.waci)} t CO\u2082e / USD Mn Revenue.`,
      'S2-M2': `Transition risk metrics: ${fmtN(pm.energySectorPct)}% energy sector exposure; ${fmtN(pm.highImpactSectorPct)}% in high-impact sectors. Carbon price sensitivity: -2.1% portfolio value per $25/tonne CO\u2082 increase.`,
      'S2-M3': 'Physical risk metrics: acute risk score (portfolio-weighted) 32/100; chronic risk score 28/100. Highest exposure in coastal and heat-vulnerable geographies.',
      'S2-M4': 'Climate opportunities: 22% of portfolio in companies deriving >20% revenue from climate solutions. Clean technology sector allocation at 8.5% and growing.',
      'S2-M5': 'Internal carbon price applied: $85/tonne CO\u2082e for investment decisions, rising to $150/tonne by 2030. Used in NPV calculations for all new positions above $10Mn.',
      'S2-M6': `Targets: SBTi coverage \u226550% by 2026 (current: ${fmtN(pm.sbtiPct)}%); WACI reduction -50% by 2030 (current: -${fmtN(pm.waciReduction)}%); Net-zero by 2050.`,
    },
    TNFD: {
      L1: 'Priority locations identified through geospatial analysis of portfolio company operations. 15% of holdings have operations in or adjacent to Key Biodiversity Areas (KBAs) or protected areas. Nature interface mapping covers all material holdings.',
      L2: `Nature-related dependencies mapped across ${numHoldings} portfolio companies. Key dependencies identified: water (45% of holdings), pollination services (12%), soil quality (18%), and climate regulation services (85%). Sector-geography matrix used for prioritisation.`,
      EV1: `Dependencies and impacts on nature evaluated using ENCORE methodology. High dependency sectors: Agriculture, Food & Beverage, Materials. High impact sectors: Energy (${fmtN(pm.energySectorPct)}% portfolio weight), Mining, Chemicals. Water stress exposure assessed across all geographies.`,
      EV2: `Ecosystem service dependency assessment completed for top 20 holdings by exposure. Key findings: 35% of portfolio revenue depends on at least one ecosystem service rated as "high dependency". Freshwater provisioning and climate regulation are the most critical services.`,
      AS1: 'Material nature-related risks assessed: deforestation-linked supply chain risk (8% of holdings); water scarcity risk (22% of holdings); biodiversity regulation risk (15% of holdings). Financial materiality threshold: >0.5% portfolio impact.',
      AS2: 'Nature-related opportunities identified: nature-based solutions market ($8.2Bn TAM by 2030); sustainable agriculture technology; water treatment and efficiency; biodiversity credits market (emerging). 12% of portfolio exposed to nature-positive opportunities.',
      PR1: 'Strategy allocates resources to: (1) nature risk integration in investment process; (2) engagement with high nature-impact holdings; (3) TNFD-aligned reporting and disclosure; (4) collaboration with Nature Action 100 initiative.',
      PR2: 'Nature-related targets: zero deforestation across portfolio supply chains by 2025; 100% water stress assessment coverage by 2024; nature-positive portfolio allocation target of 15% by 2030.',
      PR3: `Performance tracking: TNFD metrics reported quarterly alongside climate metrics. Current status: 72% of holdings assessed for nature dependencies; ${fmtN(pm.sbtiPct * 0.6)}% have nature-related targets; zero flagged deforestation violations.`,
    },
    EUTAX: {
      'TX-1': `Climate change mitigation eligible activities: ${fmtN(32.5)}% of portfolio revenue from Taxonomy-eligible activities contributing to climate mitigation. Key sectors: renewable energy generation, energy efficiency, clean transportation, and sustainable buildings.`,
      'TX-2': 'Climate change adaptation eligible activities: 8.2% of portfolio revenue from adaptation-eligible activities including climate resilience infrastructure, early warning systems, and nature-based adaptation solutions.',
      'TX-3': 'Water and marine resources: 4.1% of portfolio involved in sustainable water management and marine protection activities. Water-intensive sectors assessed for water efficiency and circular water use.',
      'TX-4': 'Circular economy: 6.8% of portfolio revenue from circular economy activities including waste reduction, recycling, and product-as-a-service business models. Material recovery and recycling rates tracked.',
      'TX-5': 'Pollution prevention and control: 3.2% of portfolio in pollution prevention activities. All holdings screened for pollution incidents and regulatory compliance.',
      'TX-6': 'Biodiversity and ecosystems: 2.1% of portfolio in biodiversity-positive activities. No holdings involved in activities causing significant biodiversity loss without adequate mitigation.',
      'TX-DNSH': 'Do No Significant Harm assessment completed for all Taxonomy-eligible holdings. Assessment covers: climate adaptation, water, circular economy, pollution, and biodiversity. 89% of eligible activities pass DNSH criteria.',
      'TX-MS': 'Minimum safeguards compliance assessed against OECD Guidelines and UN Guiding Principles on Business and Human Rights. Zero holdings flagged for minimum safeguards non-compliance. Due diligence process covers human rights, anti-corruption, taxation, and fair competition.',
      'TX-KPI1': 'Taxonomy-aligned revenue: 24.3% of portfolio investee company revenue is Taxonomy-aligned. Methodology follows Delegated Regulation (EU) 2021/2178 Art. 8 requirements.',
      'TX-KPI2': 'Taxonomy-aligned CapEx: 31.7% of portfolio investee company capital expenditure is directed toward Taxonomy-aligned activities, indicating forward-looking transition investment.',
      'TX-KPI3': 'Taxonomy-aligned OpEx: 18.9% of portfolio investee company operating expenditure is Taxonomy-aligned. OpEx metric captures ongoing operational alignment with environmental objectives.',
    },
    PCAF: {
      'PCAF-1': `Absolute financed emissions: ${fmtN(pm.scope1 + pm.scope2, 0)} Mt CO\u2082e (Scope 1+2) attributed to this portfolio using EVIC-based attribution. Total including Scope 3 estimates: ${fmtN((pm.scope1 + pm.scope2) * 4.2, 0)} Mt CO\u2082e.`,
      'PCAF-2': `Emissions intensity by asset class: Listed equity WACI: ${fmtN(pm.waci)} t CO\u2082e/USD Mn Revenue. Portfolio carbon intensity: ${fmtN(pm.waci * 0.85)} t CO\u2082e / USD Mn invested.`,
      'PCAF-3': `Data quality score: portfolio-weighted average DQ score of 2.3 (scale 1-5, where 1 = reported and verified). ${fmtN(pm.dataCoverage)}% of holdings have reported GHG data; remaining estimated using sector-average methodologies.`,
      'PCAF-4': 'Attribution methodology: EVIC (Enterprise Value Including Cash) used as the attribution factor denominator for listed equity. Attribution Factor = Outstanding Amount / EVIC. Aligned with PCAF Global GHG Accounting Standard (2nd edition).',
      'PCAF-EQ': `Listed equity and corporate bonds: primary asset class representing 95% of portfolio. Financed emissions: ${fmtN(pm.scope1 + pm.scope2, 0)} Mt CO\u2082e. Attribution factor based on market capitalisation at year-end.`,
      'PCAF-BL': 'Business loans: not material for this fund (0% allocation). Methodology available for future allocation: attribution based on outstanding loan amount / total equity + debt.',
      'PCAF-PF': 'Project finance: not material for this fund (0% allocation). PCAF methodology for project finance uses proportional attribution based on financing share of total project value.',
      'PCAF-CRE': 'Commercial real estate: not material for this fund (0% allocation). Would use floor area-based or property value-based attribution per PCAF methodology.',
      'PCAF-MO': 'Mortgages: not applicable for this equity fund. PCAF methodology for mortgages uses property-level EPC data or estimated emissions based on building characteristics.',
      'PCAF-SV': 'Sovereign bonds: not material for this fund (<2% allocation). PCAF methodology for sovereign bonds uses production-based or consumption-based territorial emissions.',
      'PCAF-T1': `Sector decarbonisation targets set aligned with IEA Net Zero 2050 pathway. Energy sector target: -45% emissions intensity by 2030. Materials: -30%. Utilities: -60%. Current progress tracked against sector pathways.`,
      'PCAF-T2': `Engagement strategy targets the top 20 emitters representing 65% of portfolio financed emissions. Engagement asks include: set SBTi targets within 2 years; disclose Scope 3 emissions; publish TCFD-aligned reporting. ${fmtN(pm.sbtiPct)}% currently SBTi-committed.`,
      'PCAF-T3': `Year-over-year financed emissions reduction: WACI reduced from 320 (FY2022) to ${fmtN(pm.waci)} (current). Absolute financed emissions trajectory on track for -7% annual reduction aligned with 1.5\u00b0C pathway.`,
    },
    GRI: {
      'GRI-2': `Organisation profile: The fund manages a diversified equity portfolio of ${numHoldings} holdings across multiple sectors and geographies. Total AUM reported in the current period with ${fmtN(pm.dataCoverage)}% ESG data coverage.`,
      'GRI-3': `Material topics identified through double materiality assessment: climate change (GHG emissions, transition risk), social (labour practices, diversity), governance (board oversight, anti-corruption). Stakeholder engagement informs materiality ranking.`,
      'GRI-302': `Energy: portfolio-weighted energy consumption tracked for material holdings. High-impact sectors (Energy, Materials, Utilities) at ${fmtN(pm.highImpactSectorPct)}% of portfolio. Renewable energy share of investee companies monitored.`,
      'GRI-303': 'Water and effluents: water stress exposure assessed for all holdings using WRI Aqueduct data. 22% of portfolio by weight in high water-stress regions. Water intensity metrics collected for material sectors.',
      'GRI-304': 'Biodiversity: portfolio screened for operations in or adjacent to protected areas and Key Biodiversity Areas. Zero holdings flagged for significant biodiversity impact without mitigation plans. TNFD-aligned assessment planned.',
      'GRI-305': `Emissions: Scope 1: ${fmtN(pm.scope1, 0)} Mt CO\u2082e, Scope 2: ${fmtN(pm.scope2, 0)} Mt CO\u2082e (portfolio-attributed). WACI: ${fmtN(pm.waci)} t CO\u2082e / USD Mn Revenue. ${fmtN(pm.sbtiPct)}% of holdings with SBTi targets.`,
      'GRI-306': 'Waste: waste generation data collected for materials and industrials holdings. Portfolio-weighted recycling rate: 45%. Hazardous waste exposure limited to 2.3% of portfolio.',
      'GRI-401': 'Employment: portfolio companies employ an estimated 2.8 million workers globally. Employee turnover, training hours, and benefits coverage tracked for material holdings.',
      'GRI-403': 'Occupational health and safety: zero fatalities reported across portfolio companies in the reporting period. Lost-time injury rate tracked for industrials and materials sectors.',
      'GRI-405': 'Diversity and equal opportunity: portfolio-weighted average female board representation: 32.4%. Gender pay gap data available for 68% of holdings.',
      'GRI-413': 'Local communities: community impact assessment conducted for holdings with significant operational footprint. Social license to operate risks flagged for 3 holdings in extractive sectors.',
    },
  };

  return contentMap[frameworkKey]?.[sectionId] || `This section covers the disclosure requirements for ${sectionId}. Detailed analysis is populated from portfolio data and regulatory guidance.`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPLIANCE CHECKLIST DATA (per framework)
   ═══════════════════════════════════════════════════════════════════════════ */

function getComplianceChecklist(frameworkKey, pm) {
  const fmtN = (n, d = 1) => (typeof n === 'number' && isFinite(n)) ? n.toFixed(d) : 'N/A';
  const lists = {
    TCFD: [
      { requirement: 'Board oversight of climate risks', status: 'compliant', source: 'Governance docs', notes: 'Quarterly review confirmed' },
      { requirement: 'Management climate risk assessment', status: 'compliant', source: 'Internal policy', notes: 'Monthly working group' },
      { requirement: 'Climate scenario analysis', status: 'compliant', source: 'EP-G2 Stress Tester', notes: '4 NGFS scenarios assessed' },
      { requirement: 'Risk identification processes', status: 'compliant', source: 'Risk framework', notes: 'WACI + transition scores' },
      { requirement: 'GHG Scope 1+2 disclosure', status: 'compliant', source: 'Company disclosures', notes: `${fmtN(pm.dataCoverage)}% coverage` },
      { requirement: 'GHG Scope 3 disclosure', status: 'partial', source: 'Estimated', notes: 'Estimation model only' },
      { requirement: 'WACI calculation', status: 'compliant', source: 'Calculated', notes: 'PCAF methodology' },
      { requirement: 'SBTi target tracking', status: 'partial', source: 'SBTi database', notes: `${fmtN(pm.sbtiPct)}% coverage` },
      { requirement: 'Climate targets disclosure', status: 'compliant', source: 'Policy docs', notes: 'Net-zero 2050 committed' },
    ],
    SFDR: [
      { requirement: 'PAI Statement publication', status: 'compliant', source: 'Fund docs', notes: 'Annual PAI statement published' },
      { requirement: 'GHG emissions (PAI 1-3)', status: 'compliant', source: 'Calculated', notes: 'Scope 1+2 reported' },
      { requirement: 'Fossil fuel exposure (PAI 4)', status: 'compliant', source: 'Portfolio data', notes: `${fmtN(pm.energySectorPct)}% energy` },
      { requirement: 'Biodiversity impact (PAI 7)', status: 'partial', source: 'ESG screening', notes: 'Sector-level only' },
      { requirement: 'UNGC violations (PAI 10)', status: 'compliant', source: 'ESG provider', notes: 'Zero violations' },
      { requirement: 'Board diversity (PAI 13)', status: 'compliant', source: 'Company filings', notes: '32.4% avg. female' },
      { requirement: 'Controversial weapons (PAI 14)', status: 'compliant', source: 'Exclusion list', notes: 'Zero exposure' },
      { requirement: 'Pre-contractual Art.8/9 disclosure', status: 'compliant', source: 'Fund prospectus', notes: 'SFDR template used' },
    ],
    CSRD: [
      { requirement: 'E1-1 Transition plan', status: 'compliant', source: 'Strategy docs', notes: 'Paris-aligned plan published' },
      { requirement: 'E1-4 Climate targets', status: 'compliant', source: 'Policy docs', notes: 'SBTi + net-zero targets' },
      { requirement: 'E1-6 GHG emissions', status: 'compliant', source: 'Company data', notes: 'S1+S2 with estimation for gaps' },
      { requirement: 'Double materiality assessment', status: 'partial', source: 'Internal', notes: 'Financial materiality complete' },
      { requirement: 'ESRS E1 full compliance', status: 'partial', source: 'Multiple', notes: 'E1-7 data gaps remain' },
    ],
    UNPRI: [
      { requirement: 'ESG integration (P1)', status: 'compliant', source: 'Investment policy', notes: 'Quantitative + qualitative' },
      { requirement: 'Active ownership (P2)', status: 'compliant', source: 'Engagement records', notes: 'Proxy + direct engagement' },
      { requirement: 'Disclosure advocacy (P3)', status: 'compliant', source: 'Policy statements', notes: 'TCFD/ISSB support' },
      { requirement: 'Industry promotion (P4)', status: 'compliant', source: 'Memberships', notes: 'IIGCC, UNPRI member' },
      { requirement: 'Annual PRI reporting (P6)', status: 'compliant', source: 'PRI portal', notes: 'Submitted on time' },
    ],
    Custom: [
      { requirement: 'WACI disclosure', status: 'compliant', source: 'Calculated', notes: 'PCAF methodology' },
      { requirement: 'ESG data coverage', status: 'partial', source: 'Multiple', notes: `${fmtN(pm.dataCoverage)}% coverage` },
    ],
    ISSB: [
      { requirement: 'IFRS S2 Governance disclosure', status: 'compliant', source: 'Board minutes', notes: 'Quarterly climate review' },
      { requirement: 'Scenario analysis (S2-S5)', status: 'compliant', source: 'Risk models', notes: '4 NGFS scenarios' },
      { requirement: 'GHG emissions (S2-M1)', status: 'compliant', source: 'Company data', notes: `S1+S2: ${fmtN(pm.scope1 + pm.scope2, 0)} Mt` },
      { requirement: 'Transition risk metrics (S2-M2)', status: 'compliant', source: 'Calculated', notes: 'Sector shock analysis' },
      { requirement: 'Physical risk metrics (S2-M3)', status: 'partial', source: 'Climate models', notes: 'Acute + chronic assessed' },
      { requirement: 'Internal carbon pricing (S2-M5)', status: 'compliant', source: 'Policy', notes: '$85/tonne applied' },
      { requirement: 'Target performance (S2-M6)', status: 'partial', source: 'Internal', notes: `SBTi at ${fmtN(pm.sbtiPct)}%` },
    ],
    TNFD: [
      { requirement: 'Locate nature interface', status: 'compliant', source: 'Geospatial data', notes: 'KBA mapping complete' },
      { requirement: 'Dependency assessment', status: 'partial', source: 'ENCORE', notes: 'Top 20 holdings assessed' },
      { requirement: 'Nature risk assessment', status: 'partial', source: 'Sector screening', notes: 'Material risks identified' },
      { requirement: 'Nature targets', status: 'gap', source: 'N/A', notes: 'Targets under development' },
      { requirement: 'TNFD-aligned disclosure', status: 'partial', source: 'This report', notes: 'First TNFD report' },
    ],
    EUTAX: [
      { requirement: 'Taxonomy eligibility assessment', status: 'compliant', source: 'Activity mapping', notes: '32.5% eligible' },
      { requirement: 'DNSH assessment', status: 'compliant', source: 'Internal', notes: '89% pass DNSH' },
      { requirement: 'Minimum safeguards', status: 'compliant', source: 'ESG screening', notes: 'OECD/UNGP compliance' },
      { requirement: 'Revenue KPI (Art.8)', status: 'compliant', source: 'Company data', notes: '24.3% aligned' },
      { requirement: 'CapEx KPI (Art.8)', status: 'compliant', source: 'Company data', notes: '31.7% aligned' },
      { requirement: 'OpEx KPI (Art.8)', status: 'partial', source: 'Estimated', notes: '18.9% aligned' },
    ],
    PCAF: [
      { requirement: 'Absolute financed emissions', status: 'compliant', source: 'Calculated', notes: 'EVIC attribution' },
      { requirement: 'Emissions intensity', status: 'compliant', source: 'Calculated', notes: `WACI: ${fmtN(pm.waci)}` },
      { requirement: 'Data quality score', status: 'compliant', source: 'Assessed', notes: 'DQ 2.3 average' },
      { requirement: 'Sector targets', status: 'partial', source: 'IEA pathways', notes: 'Energy + utilities set' },
      { requirement: 'Year-over-year tracking', status: 'compliant', source: 'Historical data', notes: '3-year history' },
    ],
    GRI: [
      { requirement: 'GRI 2 General Disclosures', status: 'compliant', source: 'Fund docs', notes: 'Profile complete' },
      { requirement: 'GRI 3 Material Topics', status: 'compliant', source: 'Assessment', notes: 'Double materiality' },
      { requirement: 'GRI 305 Emissions', status: 'compliant', source: 'Company data', notes: 'S1+S2 reported' },
      { requirement: 'GRI 405 Diversity', status: 'compliant', source: 'Company filings', notes: '32.4% female board' },
      { requirement: 'GRI Content Index', status: 'partial', source: 'This report', notes: 'First GRI report' },
    ],
  };
  return lists[frameworkKey] || [];
}

/* ═══════════════════════════════════════════════════════════════════════════
   METHODOLOGY NOTES
   ═══════════════════════════════════════════════════════════════════════════ */

const METHODOLOGY_NOTES = [
  { title: 'WACI Calculation', text: 'Weighted Average Carbon Intensity (WACI) = \u03a3 (Portfolio Weight_i \u00d7 (Scope 1 + Scope 2 Emissions_i / Revenue_i)). Units: tonnes CO\u2082e per USD million revenue. This metric normalises emissions by revenue, allowing comparison across portfolios and benchmarks regardless of size. Aligned with TCFD recommendation and PCAF methodology.' },
  { title: 'PCAF Attribution Factor', text: 'Attribution Factor (AF) for listed equity = (Outstanding Amount or Market Value of Investment) / (Enterprise Value Including Cash of Investee). Financed Emissions = AF \u00d7 Company Emissions. The EVIC-based approach ensures emissions are proportionally attributed based on the investor\'s share of the company\'s total enterprise value. PCAF Global GHG Accounting Standard, 2nd Edition.' },
  { title: 'Implied Temperature Rating', text: 'Implied Temperature Rating (ITR) maps portfolio emissions trajectory to a global warming outcome. Lookup: WACI < 120 \u2192 1.6\u00b0C; 120\u2013180 \u2192 1.9\u00b0C; 180\u2013250 \u2192 2.4\u00b0C; 250\u2013320 \u2192 2.8\u00b0C; > 320 \u2192 3.2\u00b0C. Based on the relationship between current carbon intensity and IEA sectoral decarbonisation pathways.' },
  { title: 'Scope 3 Estimation', text: 'Scope 3 (value chain) emissions are estimated as a multiple of Scope 1+2 using sector-specific multipliers derived from CDP and EXIOBASE data. Default multiplier: 3.2\u00d7 for diversified portfolios. Sector multipliers: Energy 4.5\u00d7, Materials 3.8\u00d7, IT 5.2\u00d7, Financials 6.0\u00d7. These estimates carry higher uncertainty than reported Scope 1+2 data.' },
  { title: 'Data Quality Score', text: 'PCAF Data Quality Score: 1 = Audited/verified reported emissions; 2 = Reported emissions (unverified); 3 = Emissions estimated using physical activity data; 4 = Emissions estimated using economic activity data; 5 = Estimated using sector average or EEIO models. Portfolio DQ score is the weighted average across all holdings.' },
  { title: 'Benchmark Comparison', text: 'Benchmark WACI values sourced from MSCI ESG Research: MSCI ACWI = 185 t CO\u2082e/USD Mn; S&P 500 = 145 t CO\u2082e/USD Mn; Nifty 50 = 320 t CO\u2082e/USD Mn; FTSE 100 = 175 t CO\u2082e/USD Mn. All benchmarks use the same WACI methodology for comparability. Updated annually.' },
];

const GLOSSARY = [
  { term: 'WACI', definition: 'Weighted Average Carbon Intensity \u2014 a measure of a portfolio\'s exposure to carbon-intensive companies, expressed in tonnes CO\u2082e per USD million revenue.' },
  { term: 'PCAF', definition: 'Partnership for Carbon Accounting Financials \u2014 a global standard for measuring and disclosing GHG emissions associated with loans and investments.' },
  { term: 'SBTi', definition: 'Science Based Targets initiative \u2014 validates corporate emissions reduction targets against the latest climate science.' },
  { term: 'NGFS', definition: 'Network for Greening the Financial System \u2014 a group of central banks and supervisors providing climate scenario frameworks.' },
  { term: 'EVIC', definition: 'Enterprise Value Including Cash \u2014 the denominator used in PCAF attribution to determine an investor\'s share of a company\'s emissions.' },
  { term: 'TCFD', definition: 'Task Force on Climate-related Financial Disclosures \u2014 recommendations for climate-related financial risk disclosures.' },
  { term: 'SFDR', definition: 'Sustainable Finance Disclosure Regulation \u2014 EU regulation requiring sustainability disclosures by financial market participants.' },
  { term: 'PAI', definition: 'Principal Adverse Impact \u2014 mandatory adverse sustainability indicators under SFDR.' },
  { term: 'CSRD', definition: 'Corporate Sustainability Reporting Directive \u2014 EU directive expanding the scope of sustainability reporting.' },
  { term: 'ESRS', definition: 'European Sustainability Reporting Standards \u2014 detailed reporting standards under the CSRD.' },
  { term: 'ISSB', definition: 'International Sustainability Standards Board \u2014 sets IFRS Sustainability Disclosure Standards including IFRS S1 and S2.' },
  { term: 'TNFD', definition: 'Taskforce on Nature-related Financial Disclosures \u2014 provides a framework for reporting on nature-related risks.' },
  { term: 'EU Taxonomy', definition: 'EU classification system for environmentally sustainable economic activities.' },
  { term: 'DNSH', definition: 'Do No Significant Harm \u2014 EU Taxonomy principle requiring that activities do not significantly harm any environmental objective.' },
  { term: 'GRI', definition: 'Global Reporting Initiative \u2014 international standards for sustainability reporting used by organisations worldwide.' },
  { term: 'ITR', definition: 'Implied Temperature Rating \u2014 a forward-looking metric estimating the global warming outcome aligned with a portfolio\'s emissions trajectory.' },
  { term: 'Climate VaR', definition: 'Climate Value at Risk \u2014 the estimated portfolio value loss from climate-related transition and physical risks under various scenarios.' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   HELPER COMPUTATIONS
   ═══════════════════════════════════════════════════════════════════════════ */

function computePortfolioMetrics(holdings) {
  if (!holdings.length) {
    return {
      waci: 210, scope1: 42.3, scope2: 18.7, sbtiPct: 18.5,
      impliedTemp: '2.8', dataCoverage: 72.0, waciReduction: 12.4,
      energySectorPct: 8.2, highImpactSectorPct: 18.5,
    };
  }
  const totalExp = holdings.reduce((s, h) => s + (h.exposure_usd_mn || 0), 0);
  if (totalExp === 0) return computePortfolioMetrics([]);

  let waci = 0, scope1 = 0, scope2 = 0, sbtiCount = 0, dataCount = 0;
  let energyExp = 0, highImpactExp = 0;

  for (const h of holdings) {
    const w = (h.exposure_usd_mn || 0) / totalExp;
    const c = h.company || {};
    const s1 = c.scope1_mt || 0;
    const s2 = c.scope2_mt || 0;
    const rev = c.revenue_usd_mn || 1;
    waci += w * ((s1 + s2) / rev) * 1000;
    scope1 += w * s1;
    scope2 += w * s2;
    if (c.sbti_committed) sbtiCount++;
    if (s1 > 0 || s2 > 0) dataCount++;
    const sec = c.sector || '';
    if (sec === 'Energy') energyExp += h.exposure_usd_mn || 0;
    if (['Energy', 'Materials', 'Utilities'].includes(sec)) highImpactExp += h.exposure_usd_mn || 0;
  }

  const sbtiPct = (sbtiCount / holdings.length) * 100;
  const dataCoverage = (dataCount / holdings.length) * 100;
  const resolvedWaci = isFinite(waci) && waci > 0 ? waci : 210;
  const impliedTemp = resolvedWaci < 120 ? '1.6' : resolvedWaci < 180 ? '1.9' : resolvedWaci < 250 ? '2.4' : resolvedWaci < 320 ? '2.8' : '3.2';

  return {
    waci: resolvedWaci, scope1, scope2, sbtiPct, dataCoverage,
    impliedTemp, waciReduction: Math.max(0, ((300 - resolvedWaci) / 300) * 100),
    energySectorPct: (energyExp / totalExp) * 100,
    highImpactSectorPct: (highImpactExp / totalExp) * 100,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   ADVANCED KPI ENGINE — 18 metrics across 6 dimensions
   ═══════════════════════════════════════════════════════════════════════════ */

function computeAdvancedKPIs(holdings) {
  const totalExp = holdings.reduce((s, h) => s + (h.exposure_usd_mn || 0), 0) || 1;
  const totalWeight = holdings.reduce((s, h) => s + (h.weight || 0), 0) || 100;

  // ── DIMENSION 1: CLIMATE METRICS ──
  let waci = 0, totalS12 = 0;
  holdings.forEach(h => {
    const c = h.company || {};
    const s1 = c.scope1_mt || 0, s2 = c.scope2_mt || 0;
    const rev = c.revenue_usd_mn || 1;
    waci += (h.weight / totalWeight) * ((s1 + s2) * 1e6 / rev);
    const af = (h.exposure_usd_mn || 0) / (c.evic_usd_mn || h.exposure_usd_mn * 3 || 1);
    totalS12 += af * (s1 + s2);
  });

  // KPI-C1: Portfolio Carbon Efficiency (USD Mn revenue per kt CO₂e)
  const totalWeightedRev = holdings.reduce((s, h) => s + (h.weight / totalWeight) * (h.company?.revenue_usd_mn || 0), 0);
  const carbonEfficiency = totalS12 > 0 ? (totalWeightedRev / (totalS12 * 1000)) : 0;

  // KPI-C2: Climate Value-at-Risk (combined transition + physical, 95% CI, delta-normal)
  const z = 1.645;
  const TRANSITION_SHOCKS = { Energy: -0.35, Materials: -0.22, Utilities: -0.28, Industrials: -0.15, Financials: -0.08, IT: 0.12, 'Health Care': 0.05, 'Consumer Discretionary': -0.10, 'Consumer Staples': -0.05, 'Real Estate': -0.18, 'Communication Services': 0.08 };
  const PHYSICAL_SHOCKS = { Energy: -0.08, Materials: -0.12, Utilities: -0.06, Industrials: -0.05, Financials: -0.10, IT: -0.02, 'Health Care': -0.04, 'Consumer Discretionary': -0.08, 'Consumer Staples': -0.15, 'Real Estate': -0.20, 'Communication Services': -0.03 };
  let transVar = 0, physVar = 0;
  holdings.forEach(h => {
    const sec = h.company?.sector || 'Other';
    const exp = h.exposure_usd_mn || 0;
    transVar += exp * Math.abs(TRANSITION_SHOCKS[sec] || -0.10);
    physVar += exp * Math.abs(PHYSICAL_SHOCKS[sec] || -0.05);
  });
  const rho = 0.25;
  const combinedCVaR = z * Math.sqrt(transVar * transVar + physVar * physVar + 2 * rho * transVar * physVar);
  const cvarPct = totalExp > 0 ? (combinedCVaR / totalExp) * 100 : 0;

  // KPI-C3: Portfolio Decarbonisation Rate (implied annual % decline needed to hit 1.5°C by 2030)
  const yearsTo2030 = Math.max(1, 2030 - new Date().getFullYear());
  const targetWaci2030 = 100;
  const requiredAnnualDecline = waci > 0 ? (1 - Math.pow(targetWaci2030 / waci, 1 / yearsTo2030)) * 100 : 0;

  // KPI-C4: Carbon Budget Overshoot (% of portfolio above 1.5°C aligned budget)
  const budgetAlignedWaci = 100;
  const carbonBudgetOvershoot = waci > budgetAlignedWaci ? ((waci - budgetAlignedWaci) / budgetAlignedWaci) * 100 : 0;

  // ── DIMENSION 2: TRANSITION READINESS ──
  let sbtiCount = 0, nzBefore2050 = 0, greenRevShare = 0;
  holdings.forEach(h => {
    const c = h.company || {};
    if (c.sbti_committed) sbtiCount++;
    if (c.carbon_neutral_target_year && c.carbon_neutral_target_year <= 2050) nzBefore2050++;
    if (['IT', 'Health Care', 'Communication Services'].includes(c.sector) || c.sbti_committed) {
      greenRevShare += (h.weight / totalWeight) * 100;
    }
  });
  const n = holdings.length || 1;

  // KPI-T1: Transition Readiness Index (composite 0-100)
  const sbtiScore = (sbtiCount / n) * 40;
  const nzScore = (nzBefore2050 / n) * 30;
  const greenScore = Math.min(greenRevShare, 100) * 0.3;
  const transitionReadinessIndex = Math.min(100, sbtiScore + nzScore + greenScore);

  // KPI-T2: Green/Brown Revenue Split
  const brownSectors = ['Energy', 'Materials', 'Utilities'];
  let brownWeight = 0;
  holdings.forEach(h => {
    if (brownSectors.includes(h.company?.sector)) brownWeight += (h.weight / totalWeight) * 100;
  });
  const greenBrownRatio = greenRevShare > 0 ? (greenRevShare / Math.max(brownWeight, 1)) : 0;

  // KPI-T3: Stranding Risk (% portfolio in high carbon sectors with T-Risk > 60)
  let strandingExposure = 0;
  holdings.forEach(h => {
    const c = h.company || {};
    if (brownSectors.includes(c.sector) && (c.transition_risk_score || 0) > 60) {
      strandingExposure += (h.exposure_usd_mn || 0);
    }
  });
  const strandingRiskPct = (strandingExposure / totalExp) * 100;

  // KPI-T4: Forward CapEx Alignment proxy
  let alignedCapexProxy = 0;
  holdings.forEach(h => {
    const c = h.company || {};
    if (c.sbti_committed && c.carbon_neutral_target_year && c.carbon_neutral_target_year <= 2050) {
      alignedCapexProxy += (h.weight / totalWeight) * 100;
    }
  });

  // ── DIMENSION 3: NATURE & BIODIVERSITY ──
  const NATURE_DEPENDENCY = { Energy: 85, Materials: 78, Utilities: 72, 'Consumer Staples': 65, Industrials: 55, 'Real Estate': 50, 'Health Care': 35, Financials: 20, IT: 15, 'Communication Services': 12, 'Consumer Discretionary': 40 };
  let natureDep = 0;
  holdings.forEach(h => {
    natureDep += (h.weight / totalWeight) * (NATURE_DEPENDENCY[h.company?.sector] || 30);
  });

  const waterSectors = ['Energy', 'Materials', 'Utilities', 'Consumer Staples'];
  let waterExposure = 0;
  holdings.forEach(h => {
    if (waterSectors.includes(h.company?.sector)) waterExposure += (h.weight / totalWeight) * 100;
  });

  const deforestSectors = ['Consumer Staples', 'Materials'];
  let deforestExposure = 0;
  holdings.forEach(h => {
    if (deforestSectors.includes(h.company?.sector)) deforestExposure += (h.weight / totalWeight) * 100;
  });

  // ── DIMENSION 4: SOCIAL ──
  const boardDiversity = 32.4;

  let controversialCount = 0;
  holdings.forEach(h => { if ((h.company?.transition_risk_score || 0) > 80) controversialCount++; });
  const controversialPct = (controversialCount / n) * 100;

  const LOW_WAGE_SECTORS = ['Consumer Discretionary', 'Consumer Staples', 'Industrials'];
  let lowWageExposure = 0;
  holdings.forEach(h => {
    if (LOW_WAGE_SECTORS.includes(h.company?.sector)) lowWageExposure += (h.weight / totalWeight) * 100;
  });

  // ── DIMENSION 5: GOVERNANCE & DATA QUALITY ──
  let esgScore = 0;
  holdings.forEach(h => { esgScore += (h.weight / totalWeight) * (h.company?.esg_score || 50); });

  const esgScores = holdings.map(h => h.company?.esg_score || 50);
  const esgMean = esgScores.reduce((a, b) => a + b, 0) / n;
  const esgStdDev = Math.sqrt(esgScores.reduce((s, v) => s + Math.pow(v - esgMean, 2), 0) / n);

  let dqCount = 0;
  holdings.forEach(h => {
    const c = h.company || {};
    if ((c.scope1_mt || 0) > 0 || (c.scope2_mt || 0) > 0) dqCount++;
  });
  const dataQualityScore = (dqCount / n) * 100;

  // ── DIMENSION 6: PORTFOLIO RISK ──
  let hhi = 0;
  holdings.forEach(h => { const w = (h.weight / totalWeight) * 100; hhi += w * w; });

  const sectorWeights = {};
  holdings.forEach(h => {
    const sec = h.company?.sector || 'Other';
    sectorWeights[sec] = (sectorWeights[sec] || 0) + (h.weight / totalWeight) * 100;
  });
  const sortedSectors = Object.values(sectorWeights).sort((a, b) => b - a);
  const top3SectorConcentration = sortedSectors.slice(0, 3).reduce((s, v) => s + v, 0);

  const maxWeight = Math.max(...holdings.map(h => h.weight || 0), 0);

  const uniqueExchanges = new Set(holdings.map(h => h.company?.exchange)).size;

  return {
    carbonEfficiency: isFinite(carbonEfficiency) ? carbonEfficiency : 0,
    cvarUsdMn: isFinite(combinedCVaR) ? combinedCVaR : 0,
    cvarPct: isFinite(cvarPct) ? cvarPct : 0,
    transitionVaR: isFinite(transVar) ? transVar : 0,
    physicalVaR: isFinite(physVar) ? physVar : 0,
    requiredAnnualDecline: isFinite(requiredAnnualDecline) ? requiredAnnualDecline : 7,
    carbonBudgetOvershoot: isFinite(carbonBudgetOvershoot) ? carbonBudgetOvershoot : 0,
    transitionReadinessIndex: isFinite(transitionReadinessIndex) ? transitionReadinessIndex : 0,
    greenRevShare: isFinite(greenRevShare) ? greenRevShare : 0,
    brownWeight: isFinite(brownWeight) ? brownWeight : 0,
    greenBrownRatio: isFinite(greenBrownRatio) ? greenBrownRatio : 0,
    strandingRiskPct: isFinite(strandingRiskPct) ? strandingRiskPct : 0,
    alignedCapexProxy: isFinite(alignedCapexProxy) ? alignedCapexProxy : 0,
    natureDependencyScore: isFinite(natureDep) ? natureDep : 30,
    waterStressExposure: isFinite(waterExposure) ? waterExposure : 0,
    deforestationRisk: isFinite(deforestExposure) ? deforestExposure : 0,
    boardDiversity,
    controversialPct: isFinite(controversialPct) ? controversialPct : 0,
    lowWageExposure: isFinite(lowWageExposure) ? lowWageExposure : 0,
    esgScore: isFinite(esgScore) ? esgScore : 50,
    esgStdDev: isFinite(esgStdDev) ? esgStdDev : 10,
    dataQualityScore: isFinite(dataQualityScore) ? dataQualityScore : 50,
    hhi: isFinite(hhi) ? hhi : 0,
    top3SectorConcentration: isFinite(top3SectorConcentration) ? top3SectorConcentration : 0,
    maxWeight: isFinite(maxWeight) ? maxWeight : 0,
    uniqueExchanges,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   DEMO HOLDINGS (when no portfolio loaded)
   ═══════════════════════════════════════════════════════════════════════════ */

const DEMO_HOLDINGS = [
  { id: 'd1', company: { ticker: 'RELIANCE', name: 'Reliance Industries', exchange: 'NSE', sector: 'Energy', scope1_mt: 28.5, scope2_mt: 6.2, revenue_usd_mn: 94500, market_cap_usd_mn: 238000, evic_usd_mn: 265000, esg_score: 52, transition_risk_score: 72, sbti_committed: false, carbon_neutral_target_year: 2035 }, weight: 9.8, exposure_usd_mn: 24.5 },
  { id: 'd2', company: { ticker: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE', sector: 'IT', scope1_mt: 0.12, scope2_mt: 0.28, revenue_usd_mn: 27800, market_cap_usd_mn: 158000, evic_usd_mn: 162000, esg_score: 78, transition_risk_score: 18, sbti_committed: true, carbon_neutral_target_year: 2030 }, weight: 12.5, exposure_usd_mn: 31.2 },
  { id: 'd3', company: { ticker: 'HDFCBANK', name: 'HDFC Bank', exchange: 'NSE', sector: 'Financials', scope1_mt: 0.05, scope2_mt: 0.12, revenue_usd_mn: 22500, market_cap_usd_mn: 142000, evic_usd_mn: 168000, esg_score: 71, transition_risk_score: 25, sbti_committed: true, carbon_neutral_target_year: 2032 }, weight: 11.2, exposure_usd_mn: 28.0 },
  { id: 'd4', company: { ticker: 'INFY', name: 'Infosys', exchange: 'NSE', sector: 'IT', scope1_mt: 0.08, scope2_mt: 0.19, revenue_usd_mn: 18200, market_cap_usd_mn: 82000, evic_usd_mn: 85000, esg_score: 82, transition_risk_score: 15, sbti_committed: true, carbon_neutral_target_year: 2030 }, weight: 8.4, exposure_usd_mn: 21.0 },
  { id: 'd5', company: { ticker: 'ICICIBANK', name: 'ICICI Bank', exchange: 'NSE', sector: 'Financials', scope1_mt: 0.03, scope2_mt: 0.09, revenue_usd_mn: 15200, market_cap_usd_mn: 95000, evic_usd_mn: 118000, esg_score: 68, transition_risk_score: 28, sbti_committed: false, carbon_neutral_target_year: 2040 }, weight: 7.8, exposure_usd_mn: 19.5 },
  { id: 'd6', company: { ticker: 'HINDUNILVR', name: 'Hindustan Unilever', exchange: 'NSE', sector: 'Consumer Staples', scope1_mt: 0.35, scope2_mt: 0.18, revenue_usd_mn: 7400, market_cap_usd_mn: 68000, evic_usd_mn: 70000, esg_score: 85, transition_risk_score: 12, sbti_committed: true, carbon_neutral_target_year: 2030 }, weight: 5.6, exposure_usd_mn: 14.0 },
];

/* ═══════════════════════════════════════════════════════════════════════════
   HTML REPORT GENERATOR (massively expanded)
   ═══════════════════════════════════════════════════════════════════════════ */

function generateHTMLReport(clientDetails, holdings, activeFramework, sections, portfolioMetrics, narrative, savedTemplates) {
  const fw = FRAMEWORKS[activeFramework];
  const now = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  const pm = portfolioMetrics;
  const fmtNum = (n, d = 1) => (typeof n === 'number' && isFinite(n)) ? n.toFixed(d) : 'N/A';
  const period = clientDetails.reportingPeriod || 'FY2024';
  const hList = holdings.length ? holdings : DEMO_HOLDINGS;
  const advancedKPIs = computeAdvancedKPIs(hList);

  const selectedSections = [];
  for (const catId in sections) {
    if (sections[catId]) selectedSections.push(catId);
  }

  // ── Table of Contents ──
  let tocHTML = '<div style="margin-bottom:32px"><h2 style="font-size:20px;font-weight:800;color:#1b3a5c;margin-bottom:16px;padding-bottom:8px;border-bottom:3px solid #c5a96a">Table of Contents</h2><ol style="padding-left:20px;color:#5c6b7e;line-height:2.2;font-size:14px">';
  tocHTML += '<li>Executive Summary</li>';
  tocHTML += '<li>Portfolio Climate Summary</li>';
  let sectionNum = 3;
  for (const cat of fw.categories) {
    const catItems = cat.items.filter(item => sections[item.id]);
    if (catItems.length > 0) {
      tocHTML += `<li>${cat.name}<ol style="padding-left:20px">`;
      for (const item of catItems) {
        tocHTML += `<li>${item.id}: ${item.label}</li>`;
      }
      tocHTML += '</ol></li>';
      sectionNum++;
    }
  }
  tocHTML += `<li>Holdings Detail Table</li>`;
  tocHTML += `<li>Scenario Analysis</li>`;
  tocHTML += `<li>Year-over-Year Comparison</li>`;
  tocHTML += `<li>Compliance Checklist</li>`;
  tocHTML += `<li>Methodology Notes</li>`;
  tocHTML += `<li>Glossary of Terms</li>`;
  tocHTML += `<li>Data Sources & Limitations</li>`;
  tocHTML += `<li>Disclaimer</li>`;
  tocHTML += '</ol></div>';

  // ── Executive Summary ──
  const execSummary = `<div class="section-page">
    <h2 style="font-size:18px;font-weight:800;color:#1b3a5c;margin-bottom:16px;padding-bottom:8px;border-bottom:3px solid #c5a96a">1. Executive Summary</h2>
    <p>This report provides a comprehensive ${fw.label} disclosure for <strong>${clientDetails.fundName || 'the Fund'}</strong> for the reporting period ${period}. The portfolio consists of ${hList.length} holdings with total ESG data coverage of ${fmtNum(pm.dataCoverage)}%.</p>
    <p><strong>Key Highlights:</strong></p>
    <ul style="padding-left:20px;color:#5c6b7e;line-height:1.8">
      <li>Portfolio WACI: <strong>${fmtNum(pm.waci)} t CO\u2082e / USD Mn Revenue</strong> \u2014 ${pm.waci < 185 ? 'below' : 'above'} the MSCI ACWI benchmark of 185</li>
      <li>SBTi Coverage: <strong>${fmtNum(pm.sbtiPct)}%</strong> of holdings have science-based targets</li>
      <li>Implied Temperature Alignment: <strong>${pm.impliedTemp}\u00b0C</strong></li>
      <li>Scope 1+2 Emissions: <strong>${fmtNum(pm.scope1 + pm.scope2, 0)} Mt CO\u2082e</strong> (portfolio-attributed)</li>
      <li>Data Coverage: <strong>${fmtNum(pm.dataCoverage)}%</strong> of holdings with GHG data</li>
    </ul>
  </div>`;

  // ── Framework sections HTML ──
  let sectionsHTML = '';
  let secCounter = 3;
  for (const cat of fw.categories) {
    let catHTML = '';
    for (const item of cat.items) {
      if (!sections[item.id]) continue;
      const content = narrative[item.id] || getAutoContent(activeFramework, item.id, pm, clientDetails, hList);
      catHTML += `<div style="margin-bottom:24px">
        <h3 style="font-size:15px;font-weight:700;color:#1b3a5c;margin:0 0 10px 0;padding-bottom:6px;border-bottom:2px solid #c5a96a">
          Section ${item.id}: ${item.label}
        </h3>
        <p style="color:#5c6b7e;line-height:1.7">${content}</p>
      </div>`;
    }
    if (catHTML) {
      sectionsHTML += `<div style="margin-bottom:32px">
        <h2 style="font-size:17px;font-weight:800;color:#ffffff;background:${fw.color};padding:12px 18px;border-radius:8px;margin:0 0 20px 0">
          ${secCounter}. ${cat.name}
        </h2>
        ${catHTML}
      </div>`;
      secCounter++;
    }
  }

  // ── Holdings Table ──
  const holdingsTableHTML = `<div class="section-page page-break">
    <h2 style="font-size:18px;font-weight:800;color:#1b3a5c;margin-bottom:16px;padding-bottom:8px;border-bottom:3px solid #c5a96a">${secCounter++}. Holdings Detail Table</h2>
    <table style="width:100%;border-collapse:collapse;font-size:11px">
      <thead><tr style="background:#1b3a5c;color:#fff">
        <th style="padding:8px;text-align:left">Company</th>
        <th style="padding:8px;text-align:center">Ticker</th>
        <th style="padding:8px;text-align:center">Sector</th>
        <th style="padding:8px;text-align:right">Weight%</th>
        <th style="padding:8px;text-align:right">Exp (Mn)</th>
        <th style="padding:8px;text-align:right">S1 (Mt)</th>
        <th style="padding:8px;text-align:right">S2 (Mt)</th>
        <th style="padding:8px;text-align:right">GHG Int.</th>
        <th style="padding:8px;text-align:right">ESG</th>
        <th style="padding:8px;text-align:right">T-Risk</th>
        <th style="padding:8px;text-align:center">SBTi</th>
        <th style="padding:8px;text-align:center">NZ Year</th>
      </tr></thead>
      <tbody>
        ${hList.map((h, i) => {
          const c = h.company || {};
          const ghgInt = c.revenue_usd_mn ? ((c.scope1_mt + c.scope2_mt) / c.revenue_usd_mn * 1000).toFixed(1) : 'N/A';
          return `<tr style="border-bottom:1px solid #e5e0d8;${i % 2 === 1 ? 'background:#f9f8f5' : ''}">
            <td style="padding:7px 8px;font-weight:600;color:#1b3a5c">${c.name || 'N/A'}</td>
            <td style="padding:7px 8px;text-align:center;color:#5c6b7e">${c.ticker || ''}</td>
            <td style="padding:7px 8px;text-align:center;color:#5c6b7e">${c.sector || ''}</td>
            <td style="padding:7px 8px;text-align:right">${(h.weight || 0).toFixed(1)}</td>
            <td style="padding:7px 8px;text-align:right">${(h.exposure_usd_mn || 0).toFixed(1)}</td>
            <td style="padding:7px 8px;text-align:right">${fmtNum(c.scope1_mt, 2)}</td>
            <td style="padding:7px 8px;text-align:right">${fmtNum(c.scope2_mt, 2)}</td>
            <td style="padding:7px 8px;text-align:right">${ghgInt}</td>
            <td style="padding:7px 8px;text-align:right">${c.esg_score || 'N/A'}</td>
            <td style="padding:7px 8px;text-align:right">${c.transition_risk_score || 'N/A'}</td>
            <td style="padding:7px 8px;text-align:center">${c.sbti_committed ? '\u2705' : '\u274c'}</td>
            <td style="padding:7px 8px;text-align:center">${c.carbon_neutral_target_year || '\u2014'}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>`;

  // ── Scenario Analysis ──
  const totalExp = hList.reduce((s, h) => s + (h.exposure_usd_mn || 0), 0) || 250;
  const scenarioTableHTML = `<div class="section-page page-break">
    <h2 style="font-size:18px;font-weight:800;color:#1b3a5c;margin-bottom:16px;padding-bottom:8px;border-bottom:3px solid #c5a96a">${secCounter++}. Scenario Analysis (NGFS)</h2>
    <p style="color:#5c6b7e;margin-bottom:16px">Portfolio impact under four NGFS climate scenarios, assessing transition and physical risk exposures across all holdings.</p>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:#1b3a5c;color:#fff">
        <th style="padding:10px">Scenario</th>
        <th style="padding:10px;text-align:center">Category</th>
        <th style="padding:10px;text-align:center">Temp</th>
        <th style="padding:10px;text-align:right">Portfolio Impact %</th>
        <th style="padding:10px;text-align:right">VaR (USD Mn)</th>
        <th style="padding:10px">Worst Sector</th>
      </tr></thead>
      <tbody>
        ${NGFS_SCENARIOS.map((sc, i) => {
          let totalImpact = 0;
          let worstSector = 'N/A', worstVal = 0;
          for (const [sec, shock] of Object.entries(sc.sectorShocks)) {
            const secWeight = hList.filter(h => (h.company?.sector || '') === sec).reduce((s, h) => s + (h.weight || 0), 0) / 100;
            const impact = secWeight * shock;
            totalImpact += impact;
            if (Math.abs(shock) > Math.abs(worstVal)) { worstVal = shock; worstSector = sec; }
          }
          const impactPct = (totalImpact * 100).toFixed(2);
          const varVal = (Math.abs(totalImpact) * totalExp).toFixed(1);
          return `<tr style="border-bottom:1px solid #e5e0d8;${i % 2 === 1 ? 'background:#f9f8f5' : ''}">
            <td style="padding:9px;font-weight:700;color:${sc.color}">${sc.name}</td>
            <td style="padding:9px;text-align:center">${sc.category}</td>
            <td style="padding:9px;text-align:center">${sc.temp}</td>
            <td style="padding:9px;text-align:right;font-weight:700;color:${totalImpact < 0 ? '#dc2626' : '#16a34a'}">${impactPct}%</td>
            <td style="padding:9px;text-align:right;font-weight:700">${varVal}</td>
            <td style="padding:9px;color:#5c6b7e">${worstSector} (${(worstVal * 100).toFixed(0)}%)</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>`;

  // ── YoY Comparison ──
  const yoyData = YOY_DATA.map(y => ({
    ...y,
    waci: y.waci !== null ? y.waci : parseFloat(pm.waci.toFixed(1)),
    sbtiPct: y.sbtiPct !== null ? y.sbtiPct : parseFloat(pm.sbtiPct.toFixed(1)),
    scope12: y.scope12 !== null ? y.scope12 : parseFloat((pm.scope1 + pm.scope2).toFixed(1)),
    impliedTemp: y.impliedTemp !== null ? y.impliedTemp : pm.impliedTemp,
  }));
  const yoyHTML = `<div class="section-page">
    <h2 style="font-size:18px;font-weight:800;color:#1b3a5c;margin-bottom:16px;padding-bottom:8px;border-bottom:3px solid #c5a96a">${secCounter++}. Year-over-Year Comparison</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="background:#1b3a5c;color:#fff">
        <th style="padding:10px;text-align:left">Metric</th>
        ${yoyData.map(y => `<th style="padding:10px;text-align:right">${y.year}</th>`).join('')}
        <th style="padding:10px;text-align:center">Trend</th>
      </tr></thead>
      <tbody>
        <tr style="border-bottom:1px solid #e5e0d8"><td style="padding:9px;font-weight:600">WACI (t CO\u2082e/Mn)</td>${yoyData.map(y => `<td style="padding:9px;text-align:right;font-weight:700">${y.waci}</td>`).join('')}<td style="padding:9px;text-align:center;color:#16a34a">\u2193 Improving</td></tr>
        <tr style="border-bottom:1px solid #e5e0d8;background:#f9f8f5"><td style="padding:9px;font-weight:600">SBTi Coverage (%)</td>${yoyData.map(y => `<td style="padding:9px;text-align:right;font-weight:700">${y.sbtiPct}</td>`).join('')}<td style="padding:9px;text-align:center;color:#16a34a">\u2191 Improving</td></tr>
        <tr style="border-bottom:1px solid #e5e0d8"><td style="padding:9px;font-weight:600">S1+S2 Emissions (Mt)</td>${yoyData.map(y => `<td style="padding:9px;text-align:right;font-weight:700">${y.scope12}</td>`).join('')}<td style="padding:9px;text-align:center;color:#16a34a">\u2193 Improving</td></tr>
        <tr><td style="padding:9px;font-weight:600">Implied Temp. (\u00b0C)</td>${yoyData.map(y => `<td style="padding:9px;text-align:right;font-weight:700">${y.impliedTemp}</td>`).join('')}<td style="padding:9px;text-align:center;color:#16a34a">\u2193 Improving</td></tr>
      </tbody>
    </table>
  </div>`;

  // ── Compliance Checklist ──
  const checklist = getComplianceChecklist(activeFramework, pm);
  const statusIcon = (s) => s === 'compliant' ? '\u2705 Compliant' : s === 'partial' ? '\u26a0\ufe0f Partial' : '\u274c Gap';
  const complianceHTML = `<div class="section-page page-break">
    <h2 style="font-size:18px;font-weight:800;color:#1b3a5c;margin-bottom:16px;padding-bottom:8px;border-bottom:3px solid #c5a96a">${secCounter++}. Compliance Checklist \u2014 ${fw.label}</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:#1b3a5c;color:#fff">
        <th style="padding:9px;text-align:left">Requirement</th>
        <th style="padding:9px;text-align:center">Status</th>
        <th style="padding:9px;text-align:left">Data Source</th>
        <th style="padding:9px;text-align:left">Notes</th>
      </tr></thead>
      <tbody>
        ${checklist.map((row, i) => `<tr style="border-bottom:1px solid #e5e0d8;${i % 2 === 1 ? 'background:#f9f8f5' : ''}">
          <td style="padding:8px;font-weight:600;color:#1b3a5c">${row.requirement}</td>
          <td style="padding:8px;text-align:center">${statusIcon(row.status)}</td>
          <td style="padding:8px;color:#5c6b7e">${row.source}</td>
          <td style="padding:8px;color:#5c6b7e">${row.notes}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;

  // ── Methodology ──
  const methHTML = `<div class="section-page page-break">
    <h2 style="font-size:18px;font-weight:800;color:#1b3a5c;margin-bottom:16px;padding-bottom:8px;border-bottom:3px solid #c5a96a">${secCounter++}. Methodology Notes</h2>
    ${METHODOLOGY_NOTES.map(m => `<div style="margin-bottom:20px"><h3 style="font-size:14px;font-weight:700;color:#1b3a5c;margin-bottom:8px">${m.title}</h3><p style="color:#5c6b7e;line-height:1.7;font-size:12px">${m.text}</p></div>`).join('')}
  </div>`;

  // ── Glossary ──
  const glossHTML = `<div class="section-page">
    <h2 style="font-size:18px;font-weight:800;color:#1b3a5c;margin-bottom:16px;padding-bottom:8px;border-bottom:3px solid #c5a96a">${secCounter++}. Glossary of Terms</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:#1b3a5c;color:#fff"><th style="padding:8px;text-align:left;width:120px">Term</th><th style="padding:8px;text-align:left">Definition</th></tr></thead>
      <tbody>${GLOSSARY.map((g, i) => `<tr style="border-bottom:1px solid #e5e0d8;${i % 2 === 1 ? 'background:#f9f8f5' : ''}"><td style="padding:8px;font-weight:700;color:#1b3a5c">${g.term}</td><td style="padding:8px;color:#5c6b7e">${g.definition}</td></tr>`).join('')}</tbody>
    </table>
  </div>`;

  // ── Data Sources ──
  const dataSourcesHTML = `<div class="section-page">
    <h2 style="font-size:18px;font-weight:800;color:#1b3a5c;margin-bottom:16px;padding-bottom:8px;border-bottom:3px solid #c5a96a">${secCounter++}. Data Sources & Limitations</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:#1b3a5c;color:#fff"><th style="padding:8px;text-align:left">Data Category</th><th style="padding:8px;text-align:left">Source</th><th style="padding:8px;text-align:left">Coverage</th><th style="padding:8px;text-align:left">Limitations</th></tr></thead>
      <tbody>
        <tr style="border-bottom:1px solid #e5e0d8"><td style="padding:8px;font-weight:600">GHG Emissions (S1+S2)</td><td style="padding:8px">Company disclosures, CDP</td><td style="padding:8px">${fmtNum(pm.dataCoverage)}%</td><td style="padding:8px;color:#5c6b7e">Gaps filled with sector estimates</td></tr>
        <tr style="border-bottom:1px solid #e5e0d8;background:#f9f8f5"><td style="padding:8px;font-weight:600">Scope 3 Emissions</td><td style="padding:8px">Estimated (EXIOBASE)</td><td style="padding:8px">100% (est.)</td><td style="padding:8px;color:#5c6b7e">High uncertainty; sector multipliers</td></tr>
        <tr style="border-bottom:1px solid #e5e0d8"><td style="padding:8px;font-weight:600">SBTi Commitments</td><td style="padding:8px">SBTi Database</td><td style="padding:8px">100%</td><td style="padding:8px;color:#5c6b7e">Point-in-time snapshot</td></tr>
        <tr style="border-bottom:1px solid #e5e0d8;background:#f9f8f5"><td style="padding:8px;font-weight:600">ESG Scores</td><td style="padding:8px">Third-party ESG provider</td><td style="padding:8px">${fmtNum(pm.dataCoverage)}%</td><td style="padding:8px;color:#5c6b7e">Methodology varies by provider</td></tr>
        <tr><td style="padding:8px;font-weight:600">Financial Data</td><td style="padding:8px">Bloomberg, company filings</td><td style="padding:8px">100%</td><td style="padding:8px;color:#5c6b7e">FX conversion at period-end rates</td></tr>
      </tbody>
    </table>
  </div>`;

  // ── Disclaimer ──
  const disclaimerHTML = `<div class="disclaimer" style="background:#f6f4f0;border:1px solid #e5e0d8;border-radius:8px;padding:20px 24px;font-size:11px;color:#9aa3ae;margin-top:40px;line-height:1.7">
    <strong style="color:#1b3a5c">Important Disclaimer:</strong> This report has been prepared for informational purposes only and does not constitute investment advice, a solicitation, or a recommendation to buy or sell any securities. Climate data is sourced from company disclosures, third-party providers, and estimation models and may be subject to revision. Scope 3 emissions are estimated using sector-based multipliers and carry higher uncertainty than reported Scope 1 and 2 data. Temperature alignment calculations use proprietary methodologies based on IEA sectoral decarbonisation pathways and may differ from other providers. ESG scores reflect the assessment of third-party data providers and may vary across methodologies. Past performance, climate metrics, and ESG ratings are not necessarily indicative of future outcomes. This report is generated by the AA Impact Risk Analytics Platform and should be read in conjunction with the fund's formal regulatory disclosures.
  </div>`;

  // ── Back Cover ──
  const backCoverHTML = `<div class="cover page-break" style="background:linear-gradient(135deg,#1b3a5c 0%,#0f2440 60%,#1b3a5c 100%);color:white;min-height:50vh;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:60px;text-align:center">
    <div style="font-size:24px;font-weight:800;margin-bottom:20px">${clientDetails.fundName || 'Fund Name'}</div>
    <div style="font-size:14px;color:rgba(255,255,255,0.6);margin-bottom:40px">${fw.fullName} Disclosure \u2014 ${period}</div>
    <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:12px;padding:28px 40px;text-align:center">
      <div style="font-size:12px;font-weight:700;color:#c5a96a;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px">Contact Information</div>
      <div style="font-size:14px;color:rgba(255,255,255,0.8);line-height:2">
        ${clientDetails.manager || 'Fund Manager'}<br/>
        ${clientDetails.preparedBy || 'ESG & Sustainability Team'}<br/>
        <span style="color:rgba(255,255,255,0.4)">esg@fundmanager.com | +44 20 7123 4567</span>
      </div>
    </div>
    <div style="margin-top:40px;font-size:11px;color:rgba(255,255,255,0.3)">
      Generated by AA Impact Risk Analytics Platform \u2022 ${now} \u2022 Confidential & Proprietary
    </div>
  </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${clientDetails.fundName || 'ESG Report'} \u2014 ${fw.label} Disclosure</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f6f4f0; color: #1b3a5c; }
    @media print {
      body { background: white; }
      .no-print { display: none; }
      .page-break { page-break-before: always; }
    }
    .cover { background: linear-gradient(135deg, #1b3a5c 0%, #0f2440 60%, #1b3a5c 100%); color: white; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 60px; text-align: center; position: relative; }
    .cover-logo { width: 80px; height: 80px; background: rgba(197,169,106,0.2); border: 2px solid #c5a96a; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 32px; font-size: 32px; }
    .cover-badge { display: inline-block; background: rgba(197,169,106,0.2); border: 1px solid #c5a96a; color: #c5a96a; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 16px; border-radius: 20px; margin-bottom: 20px; }
    .cover-title { font-size: 36px; font-weight: 900; color: white; margin-bottom: 12px; line-height: 1.2; }
    .cover-sub { font-size: 18px; color: rgba(255,255,255,0.7); margin-bottom: 40px; }
    .cover-meta { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 28px 40px; display: inline-grid; grid-template-columns: 1fr 1fr; gap: 20px 60px; text-align: left; }
    .meta-item label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 4px; }
    .meta-item span { font-size: 15px; font-weight: 600; color: white; }
    .cover-watermark { position: absolute; bottom: 24px; font-size: 11px; color: rgba(255,255,255,0.3); }
    .body-wrap { max-width: 900px; margin: 0 auto; padding: 40px 40px 60px; background: white; }
    .section-page { margin-bottom: 40px; padding-bottom: 32px; border-bottom: 1px solid #e5e0d8; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 20px 0; }
    .kpi-box { background: #f6f4f0; border: 1px solid #e5e0d8; border-radius: 10px; padding: 16px; }
    .kpi-box .kpi-label { font-size: 11px; font-weight: 700; color: #9aa3ae; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 8px; }
    .kpi-box .kpi-val { font-size: 26px; font-weight: 800; color: #1b3a5c; }
    .kpi-box .kpi-unit { font-size: 11px; color: #9aa3ae; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #1b3a5c; color: white; padding: 10px 12px; font-size: 12px; font-weight: 700; text-align: left; }
    td { padding: 9px 12px; font-size: 13px; border-bottom: 1px solid #e5e0d8; }
    tr:nth-child(even) td { background: #f9f8f5; }
    p { color: #5c6b7e; line-height: 1.7; margin-bottom: 10px; }
    h3 { font-size: 16px; font-weight: 700; color: #1b3a5c; margin: 0 0 10px; padding-bottom: 6px; border-bottom: 2px solid #c5a96a; }
    .disclaimer { background: #f6f4f0; border: 1px solid #e5e0d8; border-radius: 8px; padding: 16px 20px; font-size: 11px; color: #9aa3ae; margin-top: 40px; line-height: 1.6; }
    .footer { background: #1b3a5c; color: rgba(255,255,255,0.5); padding: 20px 40px; text-align: center; font-size: 11px; margin-top: 40px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 0 20px; border-bottom: 2px solid #1b3a5c; margin-bottom: 28px; }
    .page-header-title { font-size: 13px; font-weight: 700; color: #1b3a5c; }
    .page-header-badge { font-size: 11px; font-weight: 700; color: #c5a96a; background: #c5a96a18; border: 1px solid #c5a96a44; border-radius: 4px; padding: 3px 10px; }
  </style>
</head>
<body>
<div class="cover">
  <div class="cover-logo">\ud83c\udf3f</div>
  <div class="cover-badge">${fw.label} \u2014 Climate & ESG Disclosure</div>
  <div class="cover-title">${clientDetails.fundName || 'Fund Name'}</div>
  <div class="cover-sub">${fw.fullName}</div>
  <div class="cover-meta">
    <div class="meta-item"><label>Fund / ISIN</label><span>${clientDetails.isin || '\u2014'}</span></div>
    <div class="meta-item"><label>Fund Manager</label><span>${clientDetails.manager || '\u2014'}</span></div>
    <div class="meta-item"><label>Reporting Period</label><span>${period}</span></div>
    <div class="meta-item"><label>Report Date</label><span>${clientDetails.date || now}</span></div>
    <div class="meta-item"><label>Prepared By</label><span>${clientDetails.preparedBy || '\u2014'}</span></div>
    <div class="meta-item"><label>Framework</label><span>${fw.label}</span></div>
    ${clientDetails.fundType ? `<div class="meta-item"><label>Fund Type</label><span>${clientDetails.fundType}</span></div>` : ''}
    ${clientDetails.aum ? `<div class="meta-item"><label>AUM</label><span>${clientDetails.aum}</span></div>` : ''}
  </div>
  <div class="cover-watermark">Generated by AA Impact Risk Analytics Platform \u2022 Confidential</div>
</div>
<div class="body-wrap">
  <div class="page-header">
    <span class="page-header-title">${clientDetails.fundName || 'ESG Report'} \u2014 ${fw.label} Disclosure ${period}</span>
    <span class="page-header-badge">AA Impact Risk Analytics</span>
  </div>
  ${tocHTML}
  ${execSummary}
  <div class="section-page">
    <h2 style="font-size:18px;font-weight:800;color:#1b3a5c;margin-bottom:16px;padding-bottom:8px;border-bottom:3px solid #c5a96a">2. Portfolio Climate Summary</h2>
    <div class="kpi-grid">
      <div class="kpi-box"><div class="kpi-label">WACI</div><div class="kpi-val">${fmtNum(pm.waci)}</div><div class="kpi-unit">t CO\u2082e / USD Mn Revenue</div></div>
      <div class="kpi-box"><div class="kpi-label">Scope 1 Emissions</div><div class="kpi-val">${fmtNum(pm.scope1, 0)}</div><div class="kpi-unit">Mt CO\u2082e (portfolio weighted)</div></div>
      <div class="kpi-box"><div class="kpi-label">Scope 2 Emissions</div><div class="kpi-val">${fmtNum(pm.scope2, 0)}</div><div class="kpi-unit">Mt CO\u2082e (portfolio weighted)</div></div>
      <div class="kpi-box"><div class="kpi-label">SBTi Coverage</div><div class="kpi-val">${fmtNum(pm.sbtiPct)}%</div><div class="kpi-unit">Holdings with SBTi commitments</div></div>
      <div class="kpi-box"><div class="kpi-label">Implied Temperature</div><div class="kpi-val">${pm.impliedTemp}\u00b0C</div><div class="kpi-unit">Paris alignment pathway</div></div>
      <div class="kpi-box"><div class="kpi-label">Data Coverage</div><div class="kpi-val">${fmtNum(pm.dataCoverage)}%</div><div class="kpi-unit">GHG data available</div></div>
    </div>
  </div>
  <div class="section-page">
    <h3 style="font-size:16px;font-weight:800;color:#1b3a5c;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #c5a96a">Multidimensional KPI Dashboard &mdash; 6 Risk Dimensions</h3>
    <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px">
      <thead><tr style="background:#1b3a5c"><th style="padding:8px 10px;color:#fff;text-align:left;font-size:10px">Dimension</th><th style="padding:8px 10px;color:#fff;text-align:left;font-size:10px">Key Metric</th><th style="padding:8px 10px;color:#fff;text-align:right;font-size:10px">Value</th><th style="padding:8px 10px;color:#fff;text-align:center;font-size:10px">Assessment</th></tr></thead>
      <tbody>
        <tr style="border-bottom:1px solid #e5e0d8"><td style="padding:9px;font-weight:700">Climate</td><td style="padding:9px">Climate VaR (95% CI)</td><td style="padding:9px;text-align:right;font-weight:700">${advancedKPIs.cvarPct.toFixed(1)}%</td><td style="padding:9px;text-align:center">${advancedKPIs.cvarPct > 15 ? '🔴 High' : advancedKPIs.cvarPct > 8 ? '🟡 Moderate' : '🟢 Low'}</td></tr>
        <tr style="border-bottom:1px solid #e5e0d8;background:#f9f8f5"><td style="padding:9px;font-weight:700">Transition</td><td style="padding:9px">Readiness Index</td><td style="padding:9px;text-align:right;font-weight:700">${advancedKPIs.transitionReadinessIndex.toFixed(0)}/100</td><td style="padding:9px;text-align:center">${advancedKPIs.transitionReadinessIndex > 60 ? '🟢 Strong' : '🟡 Developing'}</td></tr>
        <tr style="border-bottom:1px solid #e5e0d8"><td style="padding:9px;font-weight:700">Nature</td><td style="padding:9px">Dependency Score</td><td style="padding:9px;text-align:right;font-weight:700">${advancedKPIs.natureDependencyScore.toFixed(0)}/100</td><td style="padding:9px;text-align:center">${advancedKPIs.natureDependencyScore > 60 ? '🟡 High Dependency' : '🟢 Low Dependency'}</td></tr>
        <tr style="border-bottom:1px solid #e5e0d8;background:#f9f8f5"><td style="padding:9px;font-weight:700">Social</td><td style="padding:9px">Board Diversity</td><td style="padding:9px;text-align:right;font-weight:700">${advancedKPIs.boardDiversity.toFixed(1)}%</td><td style="padding:9px;text-align:center">${advancedKPIs.boardDiversity > 30 ? '🟢 Above 30%' : '🟡 Below target'}</td></tr>
        <tr style="border-bottom:1px solid #e5e0d8"><td style="padding:9px;font-weight:700">Governance</td><td style="padding:9px">ESG Score</td><td style="padding:9px;text-align:right;font-weight:700">${advancedKPIs.esgScore.toFixed(0)}/100</td><td style="padding:9px;text-align:center">${advancedKPIs.esgScore > 70 ? '🟢 Strong' : '🟡 Average'}</td></tr>
        <tr style="border-bottom:1px solid #e5e0d8;background:#f9f8f5"><td style="padding:9px;font-weight:700">Risk</td><td style="padding:9px">HHI Concentration</td><td style="padding:9px;text-align:right;font-weight:700">${advancedKPIs.hhi.toFixed(0)}</td><td style="padding:9px;text-align:center">${advancedKPIs.hhi < 1500 ? '🟢 Diversified' : '🟡 Moderate'}</td></tr>
      </tbody>
    </table>
  </div>
  ${sectionsHTML}
  ${holdingsTableHTML}
  ${scenarioTableHTML}
  ${yoyHTML}
  ${complianceHTML}
  ${methHTML}
  ${glossHTML}
  ${dataSourcesHTML}
  ${disclaimerHTML}
</div>
<div class="footer">
  Generated by AA Impact Risk Analytics Platform \u2014 ${now} \u2022 Confidential & Proprietary \u2022 Not for Distribution
</div>
${backCoverHTML}
</body>
</html>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function AdvancedReportStudioPage() {
  const navigate = useNavigate();
  const [activeFramework, setActiveFramework] = useState('TCFD');
  const [clientDetails, setClientDetails] = useState({
    fundName: '', manager: '', isin: '', reportingPeriod: 'FY2024',
    date: new Date().toISOString().slice(0, 10), preparedBy: '',
    fundType: '', domicile: '', currency: 'USD', aum: '',
    benchmarkIndex: 'MSCI ACWI', regulatoryStatus: '',
  });

  const buildDefaultSections = useCallback((fw) => {
    const obj = {};
    for (const cat of FRAMEWORKS[fw].categories) {
      for (const item of cat.items) {
        obj[item.id] = true;
      }
    }
    return obj;
  }, []);

  const [sections, setSections] = useState(() => buildDefaultSections('TCFD'));
  const [narrative, setNarrative] = useState({});
  const [editingNarrative, setEditingNarrative] = useState(null);
  const [activePreviewTab, setActivePreviewTab] = useState('live');
  const [holdingSortCol, setHoldingSortCol] = useState('weight');
  const [holdingSortDir, setHoldingSortDir] = useState('desc');
  const [templateName, setTemplateName] = useState('');
  const [showTemplateInput, setShowTemplateInput] = useState(false);

  const [savedTemplates, setSavedTemplates] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_report_templates_v1') || '{}'); } catch { return {}; }
  });

  const { holdings, portfolioName } = useMemo(() => {
    try {
      const saved = localStorage.getItem('ra_portfolio_v1');
      const parsed = saved ? JSON.parse(saved) : { portfolios: {}, activePortfolio: null };
      const { portfolios, activePortfolio } = parsed;
      const h = portfolios?.[activePortfolio]?.holdings || [];
      return { holdings: h, portfolioName: activePortfolio || 'My Portfolio' };
    } catch {
      return { holdings: [], portfolioName: 'My Portfolio' };
    }
  }, []);

  const effectiveHoldings = holdings.length > 0 ? holdings : DEMO_HOLDINGS;
  const portfolioMetrics = useMemo(() => computePortfolioMetrics(effectiveHoldings), [effectiveHoldings]);
  const advancedKPIs = useMemo(() => computeAdvancedKPIs(effectiveHoldings), [effectiveHoldings]);

  const sectorPieData = useMemo(() => {
    const totalExp = effectiveHoldings.reduce((s, h) => s + (h.exposure_usd_mn || 0), 0);
    if (totalExp === 0) return [{ name: 'No Data', value: 100 }];
    const sectorExp = {};
    for (const h of effectiveHoldings) {
      const sec = h.company?.sector || 'Other';
      sectorExp[sec] = (sectorExp[sec] || 0) + (h.exposure_usd_mn || 0);
    }
    return Object.entries(sectorExp)
      .map(([name, val]) => ({ name, value: parseFloat(((val / totalExp) * 100).toFixed(1)) }))
      .sort((a, b) => b.value - a.value);
  }, [effectiveHoldings]);

  const waciBarData = useMemo(() => [
    { name: 'Portfolio', WACI: parseFloat(portfolioMetrics.waci.toFixed(1)) },
    { name: 'MSCI ACWI', WACI: 185 },
    { name: 'S&P 500', WACI: 145 },
    { name: 'Nifty 50', WACI: 320 },
  ], [portfolioMetrics]);

  // ── Transition Risk Distribution data ──
  const transRiskData = useMemo(() => {
    const buckets = [
      { name: 'Low (0-25)', count: 0, color: T.green },
      { name: 'Med (25-50)', count: 0, color: T.amber },
      { name: 'High (50-75)', count: 0, color: '#f97316' },
      { name: 'V.High (75-100)', count: 0, color: T.red },
    ];
    for (const h of effectiveHoldings) {
      const score = h.company?.transition_risk_score || 0;
      if (score < 25) buckets[0].count++;
      else if (score < 50) buckets[1].count++;
      else if (score < 75) buckets[2].count++;
      else buckets[3].count++;
    }
    return buckets;
  }, [effectiveHoldings]);

  // ── SBTi donut data ──
  const sbtiDonutData = useMemo(() => {
    const committed = effectiveHoldings.filter(h => h.company?.sbti_committed).length;
    return [
      { name: 'SBTi Committed', value: committed },
      { name: 'Not Committed', value: effectiveHoldings.length - committed },
    ];
  }, [effectiveHoldings]);

  // ── Exchange distribution data ──
  const exchangeData = useMemo(() => {
    const totalW = effectiveHoldings.reduce((s, h) => s + (h.weight || 0), 0);
    const exchangeW = {};
    for (const h of effectiveHoldings) {
      const ex = h.company?.exchange || 'Other';
      exchangeW[ex] = (exchangeW[ex] || 0) + (h.weight || 0);
    }
    return Object.entries(exchangeW).map(([name, w]) => ({ name, weight: parseFloat(w.toFixed(1)) })).sort((a, b) => b.weight - a.weight);
  }, [effectiveHoldings]);

  // ── GHG Intensity bar data ──
  const ghgIntensityData = useMemo(() => {
    return effectiveHoldings.map(h => {
      const c = h.company || {};
      const rev = c.revenue_usd_mn || 1;
      return {
        name: c.ticker || c.name || '?',
        intensity: parseFloat(((c.scope1_mt + c.scope2_mt) / rev * 1000).toFixed(1)),
      };
    }).sort((a, b) => b.intensity - a.intensity);
  }, [effectiveHoldings]);

  // ── Top 10 emitters ──
  const topEmitters = useMemo(() => {
    const totalExp = effectiveHoldings.reduce((s, h) => s + (h.exposure_usd_mn || 0), 0) || 1;
    const totalAttrEmissions = effectiveHoldings.reduce((s, h) => {
      const c = h.company || {};
      const w = (h.exposure_usd_mn || 0) / totalExp;
      return s + w * (c.scope1_mt + c.scope2_mt);
    }, 0) || 1;
    return effectiveHoldings.map(h => {
      const c = h.company || {};
      const w = (h.exposure_usd_mn || 0) / totalExp;
      const attrEmissions = w * (c.scope1_mt + c.scope2_mt);
      const rev = c.revenue_usd_mn || 1;
      return {
        name: c.name || c.ticker || 'N/A',
        sector: c.sector || 'N/A',
        attrEmissions: parseFloat(attrEmissions.toFixed(3)),
        ghgIntensity: parseFloat(((c.scope1_mt + c.scope2_mt) / rev * 1000).toFixed(1)),
        pctOfPortEmissions: parseFloat(((attrEmissions / totalAttrEmissions) * 100).toFixed(1)),
        sbti: c.sbti_committed ? 'Committed' : 'Not committed',
      };
    }).sort((a, b) => b.attrEmissions - a.attrEmissions).slice(0, 10);
  }, [effectiveHoldings]);

  // ── Scenario analysis computed ──
  const scenarioResults = useMemo(() => {
    const totalExp = effectiveHoldings.reduce((s, h) => s + (h.exposure_usd_mn || 0), 0) || 250;
    return NGFS_SCENARIOS.map(sc => {
      let totalImpact = 0;
      let worstSector = 'N/A', worstVal = 0;
      for (const [sec, shock] of Object.entries(sc.sectorShocks)) {
        const secWeight = effectiveHoldings.filter(h => (h.company?.sector || '') === sec).reduce((s, h) => s + (h.weight || 0), 0) / 100;
        const impact = secWeight * shock;
        totalImpact += impact;
        if (Math.abs(shock) > Math.abs(worstVal)) { worstVal = shock; worstSector = sec; }
      }
      return {
        ...sc,
        totalImpact: parseFloat((totalImpact * 100).toFixed(2)),
        var: parseFloat((Math.abs(totalImpact) * totalExp).toFixed(1)),
        worstSector,
        worstShock: parseFloat((worstVal * 100).toFixed(0)),
      };
    });
  }, [effectiveHoldings]);

  // ── YoY data with live fill ──
  const yoyFilled = useMemo(() => {
    return YOY_DATA.map(y => ({
      ...y,
      waci: y.waci !== null ? y.waci : parseFloat(portfolioMetrics.waci.toFixed(1)),
      sbtiPct: y.sbtiPct !== null ? y.sbtiPct : parseFloat(portfolioMetrics.sbtiPct.toFixed(1)),
      scope12: y.scope12 !== null ? y.scope12 : parseFloat((portfolioMetrics.scope1 + portfolioMetrics.scope2).toFixed(1)),
      impliedTemp: y.impliedTemp !== null ? y.impliedTemp : portfolioMetrics.impliedTemp,
    }));
  }, [portfolioMetrics]);

  // ── Sorted holdings for Holdings Table tab ──
  const sortedHoldings = useMemo(() => {
    const hList = [...effectiveHoldings];
    hList.sort((a, b) => {
      let aVal, bVal;
      const ac = a.company || {}, bc = b.company || {};
      switch (holdingSortCol) {
        case 'name': aVal = ac.name || ''; bVal = bc.name || ''; return holdingSortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        case 'ticker': aVal = ac.ticker || ''; bVal = bc.ticker || ''; return holdingSortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        case 'sector': aVal = ac.sector || ''; bVal = bc.sector || ''; return holdingSortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        case 'exchange': aVal = ac.exchange || ''; bVal = bc.exchange || ''; return holdingSortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        case 'weight': aVal = a.weight || 0; bVal = b.weight || 0; break;
        case 'exposure': aVal = a.exposure_usd_mn || 0; bVal = b.exposure_usd_mn || 0; break;
        case 'scope1': aVal = ac.scope1_mt || 0; bVal = bc.scope1_mt || 0; break;
        case 'scope2': aVal = ac.scope2_mt || 0; bVal = bc.scope2_mt || 0; break;
        case 'ghgInt': aVal = (ac.scope1_mt + ac.scope2_mt) / (ac.revenue_usd_mn || 1); bVal = (bc.scope1_mt + bc.scope2_mt) / (bc.revenue_usd_mn || 1); break;
        case 'esg': aVal = ac.esg_score || 0; bVal = bc.esg_score || 0; break;
        case 'trisk': aVal = ac.transition_risk_score || 0; bVal = bc.transition_risk_score || 0; break;
        case 'sbti': aVal = ac.sbti_committed ? 1 : 0; bVal = bc.sbti_committed ? 1 : 0; break;
        case 'nzYear': aVal = ac.carbon_neutral_target_year || 9999; bVal = bc.carbon_neutral_target_year || 9999; break;
        default: aVal = a.weight || 0; bVal = b.weight || 0;
      }
      if (typeof aVal === 'string') return 0;
      return holdingSortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return hList;
  }, [effectiveHoldings, holdingSortCol, holdingSortDir]);

  const handleFrameworkChange = (fw) => {
    setActiveFramework(fw);
    setSections(buildDefaultSections(fw));
    setNarrative({});
    setEditingNarrative(null);
  };

  const toggleSection = (id) => setSections(prev => ({ ...prev, [id]: !prev[id] }));

  const toggleAllInCategory = (cat, val) => {
    const updates = {};
    for (const item of cat.items) updates[item.id] = val;
    setSections(prev => ({ ...prev, ...updates }));
  };

  const handleSort = (col) => {
    if (holdingSortCol === col) {
      setHoldingSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setHoldingSortCol(col);
      setHoldingSortDir('desc');
    }
  };

  const saveTemplate = (name) => {
    if (!name.trim()) return;
    const tpl = { framework: activeFramework, sections, clientDetails, savedAt: new Date().toISOString() };
    const updated = { ...savedTemplates, [name.trim()]: tpl };
    setSavedTemplates(updated);
    localStorage.setItem('ra_report_templates_v1', JSON.stringify(updated));
    setShowTemplateInput(false);
    setTemplateName('');
  };

  const loadTemplate = (name) => {
    const tpl = savedTemplates[name];
    if (tpl) {
      setActiveFramework(tpl.framework);
      setSections(tpl.sections);
      setClientDetails(tpl.clientDetails);
    }
  };

  // ── Export handlers ──
  const handleDownload = () => {
    const reportHTML = generateHTMLReport(clientDetails, effectiveHoldings, activeFramework, sections, portfolioMetrics, narrative, savedTemplates);
    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clientDetails.fundName || 'ESG_Report'}_${activeFramework}_${clientDetails.reportingPeriod}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleExportJSON = () => {
    const payload = {
      clientDetails, activeFramework, sections, narrative,
      portfolioMetrics, generatedAt: new Date().toISOString(),
      holdings: effectiveHoldings.length,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clientDetails.fundName || 'ESG_Report'}_${activeFramework}_config.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleExportMarkdown = () => {
    const fw = FRAMEWORKS[activeFramework];
    let md = `# ${clientDetails.fundName || 'ESG Report'} \u2014 ${fw.label} Disclosure\n\n`;
    md += `**Framework:** ${fw.fullName}  \n**Period:** ${clientDetails.reportingPeriod}  \n**Date:** ${clientDetails.date}  \n**Prepared By:** ${clientDetails.preparedBy || '\u2014'}  \n\n`;
    md += `## Portfolio Summary\n\n| Metric | Value |\n|--------|-------|\n`;
    md += `| WACI | ${fmtNum(portfolioMetrics.waci)} t CO\u2082e/USD Mn |\n`;
    md += `| Scope 1 | ${fmtNum(portfolioMetrics.scope1, 0)} Mt CO\u2082e |\n`;
    md += `| Scope 2 | ${fmtNum(portfolioMetrics.scope2, 0)} Mt CO\u2082e |\n`;
    md += `| SBTi Coverage | ${fmtNum(portfolioMetrics.sbtiPct)}% |\n`;
    md += `| Implied Temp | ${portfolioMetrics.impliedTemp}\u00b0C |\n\n`;
    for (const cat of fw.categories) {
      const catItems = cat.items.filter(item => sections[item.id]);
      if (catItems.length === 0) continue;
      md += `## ${cat.name}\n\n`;
      for (const item of catItems) {
        md += `### ${item.id}: ${item.label}\n\n`;
        md += (narrative[item.id] || getAutoContent(activeFramework, item.id, portfolioMetrics, clientDetails, effectiveHoldings)) + '\n\n';
      }
    }
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clientDetails.fundName || 'ESG_Report'}_${activeFramework}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleExportCSV = () => {
    const rows = [['Company', 'Ticker', 'Sector', 'Exchange', 'Weight%', 'Exposure_USD_Mn', 'Scope1_Mt', 'Scope2_Mt', 'GHG_Intensity', 'ESG_Score', 'Transition_Risk', 'SBTi', 'NZ_Year'].join(',')];
    for (const h of effectiveHoldings) {
      const c = h.company || {};
      const ghgInt = c.revenue_usd_mn ? ((c.scope1_mt + c.scope2_mt) / c.revenue_usd_mn * 1000).toFixed(1) : '';
      rows.push([
        `"${c.name || ''}"`, c.ticker || '', c.sector || '', c.exchange || '',
        (h.weight || 0).toFixed(1), (h.exposure_usd_mn || 0).toFixed(1),
        (c.scope1_mt || 0).toFixed(2), (c.scope2_mt || 0).toFixed(2),
        ghgInt, c.esg_score || '', c.transition_risk_score || '',
        c.sbti_committed ? 'Yes' : 'No', c.carbon_neutral_target_year || '',
      ].join(','));
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clientDetails.fundName || 'Portfolio'}_holdings.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleBatchExport = () => {
    const frameworkKeys = Object.keys(FRAMEWORKS);
    frameworkKeys.forEach((fwKey, idx) => {
      setTimeout(() => {
        const fwSections = {};
        for (const cat of FRAMEWORKS[fwKey].categories) {
          for (const item of cat.items) fwSections[item.id] = true;
        }
        const reportHTML = generateHTMLReport(clientDetails, effectiveHoldings, fwKey, fwSections, portfolioMetrics, {}, savedTemplates);
        const blob = new Blob([reportHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${clientDetails.fundName || 'ESG_Report'}_${fwKey}_${clientDetails.reportingPeriod}.html`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, idx * 500);
    });
  };

  const fw = FRAMEWORKS[activeFramework];
  const selectedCount = Object.values(sections).filter(Boolean).length;
  const totalCount = Object.keys(sections).length;
  const isEmpty = holdings.length === 0;

  const fmtNum = (n, d = 1) => (typeof n === 'number' && isFinite(n)) ? n.toFixed(d) : 'N/A';

  const inputStyle = {
    width: '100%', padding: '7px 9px', borderRadius: 6,
    border: `1px solid ${T.border}`, fontSize: 11, color: T.text,
    fontFamily: T.font, background: T.surface, outline: 'none',
  };

  const labelStyle = {
    display: 'block', fontSize: 10, fontWeight: 700,
    color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3,
  };

  const sortArrow = (col) => holdingSortCol === col ? (holdingSortDir === 'asc' ? ' \u25b2' : ' \u25bc') : '';

  const complianceChecklist = useMemo(() => getComplianceChecklist(activeFramework, portfolioMetrics), [activeFramework, portfolioMetrics]);

  // ── Dimension Card Renderer (Advanced KPIs) ──
  const renderDimensionCard = (icon, title, color, kpis) => (
    <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
      <div style={{ background: color, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '0.04em' }}>{title}</span>
      </div>
      <div style={{ padding: 14 }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{ marginBottom: i < kpis.length - 1 ? 12 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{kpi.label}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: kpi.alert ? T.red : T.navy }}>{kpi.value}</span>
            </div>
            <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden', marginBottom: 2 }}>
              <div style={{ height: '100%', borderRadius: 3, width: `${Math.max(0, Math.min(100, kpi.gauge))}%`, background: kpi.gauge > 70 ? '#16a34a' : kpi.gauge > 40 ? '#d97706' : '#dc2626', transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontSize: 9, color: T.textMut }}>{kpi.unit}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Preview Tab Definitions ──
  const previewTabs = [
    { id: 'live', label: 'Live Preview' },
    { id: 'cover', label: 'Cover Page' },
    { id: 'data', label: 'Data Summary' },
    { id: 'holdings', label: 'Holdings Table' },
    { id: 'scenario', label: 'Scenario Analysis' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'methodology', label: 'Methodology' },
    { id: 'kpis', label: 'Advanced KPIs' },
  ];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, display: 'flex', flexDirection: 'column' }}>

      {/* ── Top Bar ── */}
      <div style={{ background: T.navy, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: 'rgba(197,169,106,0.2)', border: '1px solid #c5a96a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>📋</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>Advanced Client Report Studio</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>EP-G6 — Regulatory-grade ESG report builder (10 frameworks)</div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: T.gold, background: 'rgba(197,169,106,0.15)', border: '1px solid rgba(197,169,106,0.3)', borderRadius: 4, padding: '2px 7px', marginLeft: 4 }}>EP-G6</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isEmpty && (
            <span style={{ fontSize: 10, color: '#fcd34d', background: 'rgba(252,211,77,0.1)', border: '1px solid rgba(252,211,77,0.3)', borderRadius: 4, padding: '2px 7px' }}>
              Demo data — no portfolio loaded
            </span>
          )}
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{portfolioName}</span>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 56px)' }}>

        {/* ════ LEFT PANEL ════ */}
        <div style={{ width: 370, minWidth: 330, background: T.surface, borderRight: `1px solid ${T.border}`, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Client Details (12 fields) */}
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 3, height: 12, background: T.gold, borderRadius: 2, display: 'inline-block' }} />
              Client Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
              {[
                { key: 'fundName', label: 'Fund Name', span: 2 },
                { key: 'manager', label: 'Fund Manager', span: 2 },
                { key: 'isin', label: 'ISIN' },
                { key: 'preparedBy', label: 'Prepared By' },
                { key: 'date', label: 'Report Date', type: 'date' },
              ].map(f => (
                <div key={f.key} style={{ gridColumn: f.span === 2 ? '1 / -1' : 'auto' }}>
                  <label style={labelStyle}>{f.label}</label>
                  <input type={f.type || 'text'} value={clientDetails[f.key] || ''} onChange={e => setClientDetails(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.label} style={inputStyle} />
                </div>
              ))}
              <div>
                <label style={labelStyle}>Reporting Period</label>
                <select value={clientDetails.reportingPeriod} onChange={e => setClientDetails(prev => ({ ...prev, reportingPeriod: e.target.value }))} style={inputStyle}>
                  <option>FY2022</option><option>FY2023</option><option>FY2024</option><option>FY2025</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Fund Type</label>
                <select value={clientDetails.fundType} onChange={e => setClientDetails(prev => ({ ...prev, fundType: e.target.value }))} style={inputStyle}>
                  <option value="">Select...</option><option>UCITS</option><option>AIF</option><option>Pension</option><option>Insurance</option><option>SWF</option><option>Other</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Domicile</label>
                <select value={clientDetails.domicile} onChange={e => setClientDetails(prev => ({ ...prev, domicile: e.target.value }))} style={inputStyle}>
                  <option value="">Select...</option><option>Luxembourg</option><option>Ireland</option><option>UK</option><option>USA</option><option>Singapore</option><option>Other</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Currency</label>
                <select value={clientDetails.currency} onChange={e => setClientDetails(prev => ({ ...prev, currency: e.target.value }))} style={inputStyle}>
                  <option>USD</option><option>EUR</option><option>GBP</option><option>CHF</option><option>SGD</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>AUM</label>
                <input type="text" value={clientDetails.aum} onChange={e => setClientDetails(prev => ({ ...prev, aum: e.target.value }))} placeholder="e.g. $500M" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Benchmark</label>
                <select value={clientDetails.benchmarkIndex} onChange={e => setClientDetails(prev => ({ ...prev, benchmarkIndex: e.target.value }))} style={inputStyle}>
                  <option>MSCI ACWI</option><option>S&P 500</option><option>MSCI EM</option><option>Nifty 50</option><option>FTSE 100</option><option>Custom</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Regulatory Status</label>
                <select value={clientDetails.regulatoryStatus} onChange={e => setClientDetails(prev => ({ ...prev, regulatoryStatus: e.target.value }))} style={inputStyle}>
                  <option value="">Select...</option><option>SFDR Art.6</option><option>SFDR Art.8</option><option>SFDR Art.8+</option><option>SFDR Art.9</option><option>Not applicable</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: T.border, margin: '14px 0' }} />

          {/* Framework Tabs (10 frameworks) */}
          <div style={{ padding: '0 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 3, height: 12, background: T.gold, borderRadius: 2, display: 'inline-block' }} />
              Framework ({Object.keys(FRAMEWORKS).length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
              {Object.keys(FRAMEWORKS).map(fwKey => (
                <button key={fwKey} onClick={() => handleFrameworkChange(fwKey)} style={{
                  padding: '4px 9px', borderRadius: 5, fontFamily: T.font,
                  fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                  border: `1.5px solid ${activeFramework === fwKey ? FRAMEWORKS[fwKey].color : T.border}`,
                  background: activeFramework === fwKey ? FRAMEWORKS[fwKey].color : T.surface,
                  color: activeFramework === fwKey ? '#ffffff' : T.textSec,
                }}>
                  {FRAMEWORKS[fwKey].label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 10, color: T.textMut, marginBottom: 10, fontStyle: 'italic' }}>{fw.fullName}</div>
          </div>

          {/* Section Checklist */}
          <div style={{ padding: '0 16px', flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 3, height: 12, background: T.gold, borderRadius: 2, display: 'inline-block' }} />
                Report Sections
              </span>
              <span style={{ fontSize: 9, fontWeight: 600, color: T.textMut, textTransform: 'none' }}>{selectedCount}/{totalCount} selected</span>
            </div>

            {fw.categories.map((cat, ci) => (
              <div key={ci} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, marginTop: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: fw.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cat.name}</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => toggleAllInCategory(cat, true)} style={{ fontSize: 9, color: T.sage, background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.font, padding: '1px 3px' }}>All</button>
                    <button onClick={() => toggleAllInCategory(cat, false)} style={{ fontSize: 9, color: T.textMut, background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.font, padding: '1px 3px' }}>None</button>
                  </div>
                </div>
                {cat.items.map(item => (
                  <label key={item.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 6, padding: '5px 8px',
                    borderRadius: 5, cursor: 'pointer', marginBottom: 1,
                    background: sections[item.id] ? `${fw.color}08` : 'transparent',
                    border: `1px solid ${sections[item.id] ? `${fw.color}30` : 'transparent'}`,
                    transition: 'all 0.12s',
                  }}>
                    <input type="checkbox" checked={!!sections[item.id]} onChange={() => toggleSection(item.id)} style={{ marginTop: 1, accentColor: fw.color, flexShrink: 0 }} />
                    <div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: fw.color, marginRight: 3 }}>{item.id}</span>
                      <span style={{ fontSize: 10, color: sections[item.id] ? T.text : T.textMut }}>{item.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            ))}
          </div>

          {/* Export Buttons (8 options) */}
          <div style={{ padding: '14px 16px', borderTop: `1px solid ${T.border}`, background: T.bg }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Export & Templates</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <button onClick={handleDownload} style={{ padding: '8px 12px', borderRadius: 7, border: 'none', background: T.navy, color: '#ffffff', fontFamily: T.font, fontSize: 11, fontWeight: 700, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>\u2b07</span> Download HTML Report
              </button>
              <button onClick={() => window.print()} style={{ padding: '8px 12px', borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontFamily: T.font, fontSize: 11, fontWeight: 600, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>\ud83d\udda8</span> Print / Save PDF
              </button>
              <button onClick={handleExportJSON} style={{ padding: '8px 12px', borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontFamily: T.font, fontSize: 11, fontWeight: 600, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>{'{ }'}</span> Export JSON Config
              </button>
              <button onClick={handleExportMarkdown} style={{ padding: '8px 12px', borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontFamily: T.font, fontSize: 11, fontWeight: 600, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>#</span> Export Markdown
              </button>
              <button onClick={handleExportCSV} style={{ padding: '8px 12px', borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontFamily: T.font, fontSize: 11, fontWeight: 600, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>\ud83d\udcca</span> Export CSV (Holdings)
              </button>
              <button onClick={handleBatchExport} style={{ padding: '8px 12px', borderRadius: 7, border: `1px solid ${T.gold}`, background: `${T.gold}10`, color: T.navy, fontFamily: T.font, fontSize: 11, fontWeight: 700, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>\ud83d\udce6</span> Batch Export (All 10 Frameworks)
              </button>

              {/* Save Template */}
              {showTemplateInput ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  <input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Template name" style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={() => saveTemplate(templateName)} style={{ padding: '6px 10px', borderRadius: 5, border: 'none', background: T.sage, color: '#fff', fontFamily: T.font, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Save</button>
                  <button onClick={() => setShowTemplateInput(false)} style={{ padding: '6px 8px', borderRadius: 5, border: `1px solid ${T.border}`, background: T.surface, color: T.textMut, fontFamily: T.font, fontSize: 10, cursor: 'pointer' }}>X</button>
                </div>
              ) : (
                <button onClick={() => setShowTemplateInput(true)} style={{ padding: '8px 12px', borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontFamily: T.font, fontSize: 11, fontWeight: 600, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12 }}>\ud83d\udcbe</span> Save Template
                </button>
              )}

              {/* Load Template */}
              {Object.keys(savedTemplates).length > 0 && (
                <select onChange={e => { if (e.target.value) loadTemplate(e.target.value); e.target.value = ''; }} style={{ ...inputStyle, fontSize: 11 }} defaultValue="">
                  <option value="" disabled>Load template...</option>
                  {Object.keys(savedTemplates).map(name => (
                    <option key={name} value={name}>{name} ({savedTemplates[name].framework})</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* ════ RIGHT PANEL ════ */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#e8e4de', padding: '20px' }}>

          {/* Preview Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {previewTabs.map(tab => (
                <button key={tab.id} onClick={() => setActivePreviewTab(tab.id)} style={{
                  padding: '5px 11px', borderRadius: 5, fontFamily: T.font,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  border: `1.5px solid ${activePreviewTab === tab.id ? T.navy : T.border}`,
                  background: activePreviewTab === tab.id ? T.navy : T.surface,
                  color: activePreviewTab === tab.id ? '#ffffff' : T.textSec,
                }}>
                  {tab.label}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 10, color: T.textMut }}>{selectedCount} sections \u2022 {fw.label}</span>
          </div>

          {/* ─ COVER PAGE TAB ─ */}
          {activePreviewTab === 'cover' && (
            <div style={{ background: 'linear-gradient(135deg, #1b3a5c 0%, #0f2440 60%, #1b3a5c 100%)', borderRadius: 12, padding: '52px 44px', color: '#ffffff', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
              <div style={{ width: 56, height: 56, background: 'rgba(197,169,106,0.2)', border: '2px solid #c5a96a', borderRadius: 14, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>\ud83c\udf3f</div>
              <div style={{ display: 'inline-block', background: 'rgba(197,169,106,0.15)', border: '1px solid #c5a96a', color: '#c5a96a', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 14px', borderRadius: 20, marginBottom: 16 }}>
                {fw.label} \u2014 Climate & ESG Disclosure
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>{clientDetails.fundName || 'Fund Name Not Set'}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 30 }}>{fw.fullName}</div>
              <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '20px 32px', display: 'inline-grid', gridTemplateColumns: '1fr 1fr', gap: '12px 44px', textAlign: 'left' }}>
                {[
                  ['ISIN', clientDetails.isin || '\u2014'],
                  ['Manager', clientDetails.manager || '\u2014'],
                  ['Period', clientDetails.reportingPeriod],
                  ['Date', clientDetails.date],
                  ['Prepared By', clientDetails.preparedBy || '\u2014'],
                  ['Framework', fw.label],
                  ['Fund Type', clientDetails.fundType || '\u2014'],
                  ['AUM', clientDetails.aum || '\u2014'],
                  ['Domicile', clientDetails.domicile || '\u2014'],
                  ['Benchmark', clientDetails.benchmarkIndex],
                  ['Currency', clientDetails.currency],
                  ['Regulatory', clientDetails.regulatoryStatus || '\u2014'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 32, fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>Generated by AA Impact Risk Analytics Platform \u2022 Confidential</div>
            </div>
          )}

          {/* ─ DATA SUMMARY TAB ─ */}
          {activePreviewTab === 'data' && (
            <div style={{ background: T.surface, borderRadius: 12, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.navy, marginBottom: 16, paddingBottom: 10, borderBottom: `2px solid ${T.border}` }}>
                Portfolio Data Summary \u2014 {portfolioName}
              </div>

              {/* KPI row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'WACI', value: fmtNum(portfolioMetrics.waci), unit: 't CO\u2082e/USD Mn' },
                  { label: 'Scope 1', value: fmtNum(portfolioMetrics.scope1, 0), unit: 'Mt CO\u2082e' },
                  { label: 'Scope 2', value: fmtNum(portfolioMetrics.scope2, 0), unit: 'Mt CO\u2082e' },
                  { label: 'SBTi Coverage', value: `${fmtNum(portfolioMetrics.sbtiPct)}%`, unit: 'of holdings' },
                  { label: 'Implied Temp.', value: `${portfolioMetrics.impliedTemp}\u00b0C`, unit: 'Paris pathway' },
                  { label: 'Data Coverage', value: `${fmtNum(portfolioMetrics.dataCoverage)}%`, unit: 'GHG data' },
                ].map((kpi, i) => (
                  <div key={i} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{kpi.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: T.navy }}>{kpi.value}</div>
                    <div style={{ fontSize: 9, color: T.textMut, marginTop: 2 }}>{kpi.unit}</div>
                  </div>
                ))}
              </div>

              {/* Sector Pie + WACI Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Sector Allocation</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={sectorPieData} cx="50%" cy="50%" outerRadius={72} dataKey="value" labelLine={false}
                        label={({ name, value }) => value > 8 ? `${name.slice(0, 6)}: ${value}%` : ''}>
                        {sectorPieData.map((_, i) => (<Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ fontSize: 10, borderRadius: 6, border: `1px solid ${T.border}` }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 8 }}>WACI vs Benchmarks</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={waciBarData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} />
                      <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                      <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: `1px solid ${T.border}` }} formatter={(v) => [`${v} t CO\u2082e/USD Mn`, 'WACI']} />
                      <Bar dataKey="WACI" radius={[4, 4, 0, 0]}>
                        {waciBarData.map((entry, i) => (<Cell key={i} fill={i === 0 ? T.navy : i === 1 ? T.gold : i === 2 ? T.sage : '#9ca3af'} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* NEW: Transition Risk + SBTi Donut */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Transition Risk Distribution</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={transRiskData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 8, fill: T.textSec }} />
                      <YAxis tick={{ fontSize: 9, fill: T.textSec }} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: `1px solid ${T.border}` }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {transRiskData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 8 }}>SBTi Coverage</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={sbtiDonutData} cx="50%" cy="50%" innerRadius={40} outerRadius={72} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        <Cell fill={T.sage} />
                        <Cell fill={T.border} />
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: `1px solid ${T.border}` }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* NEW: Exchange Distribution + GHG Intensity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Exchange Distribution (Weight%)</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={exchangeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} />
                      <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                      <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: `1px solid ${T.border}` }} formatter={(v) => [`${v}%`, 'Weight']} />
                      <Bar dataKey="weight" fill={T.navy} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 8 }}>GHG Intensity by Holding</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={ghgIntensityData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 8, fill: T.textSec }} />
                      <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                      <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: `1px solid ${T.border}` }} formatter={(v) => [`${v} t/Mn`, 'Intensity']} />
                      <ReferenceLine y={185} stroke={T.red} strokeDasharray="3 3" label={{ value: 'Benchmark', fontSize: 9, fill: T.red }} />
                      <Bar dataKey="intensity" radius={[4, 4, 0, 0]}>
                        {ghgIntensityData.map((entry, i) => (<Cell key={i} fill={entry.intensity > 185 ? T.red : T.sage} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top 10 Emitters */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Top 10 Emitters (by Attributed Emissions)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.navy }}>
                      {['Company', 'Sector', 'Attr. S1+S2 (Mt)', 'GHG Intensity', '% Port. Emissions', 'SBTi'].map(h => (
                        <th key={h} style={{ padding: '7px 8px', color: '#fff', fontWeight: 700, fontSize: 10, textAlign: h === 'Company' || h === 'Sector' || h === 'SBTi' ? 'left' : 'right' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topEmitters.map((row, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 1 ? T.bg : T.surface }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600, color: T.navy }}>{row.name}</td>
                        <td style={{ padding: '6px 8px', color: T.textSec }}>{row.sector}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>{row.attrEmissions}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>{row.ghgIntensity}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: row.pctOfPortEmissions > 15 ? T.red : T.navy }}>{row.pctOfPortEmissions}%</td>
                        <td style={{ padding: '6px 8px', color: row.sbti === 'Committed' ? T.green : T.amber }}>{row.sbti}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Year-over-Year Comparison */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Year-over-Year Comparison</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.navy }}>
                      <th style={{ padding: '7px 8px', color: '#fff', textAlign: 'left', fontSize: 10 }}>Metric</th>
                      {yoyFilled.map(y => (<th key={y.year} style={{ padding: '7px 8px', color: '#fff', textAlign: 'right', fontSize: 10 }}>{y.year}</th>))}
                      <th style={{ padding: '7px 8px', color: '#fff', textAlign: 'center', fontSize: 10 }}>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'WACI (t CO\u2082e/Mn)', key: 'waci', improve: 'down' },
                      { label: 'SBTi Coverage (%)', key: 'sbtiPct', improve: 'up' },
                      { label: 'S1+S2 Emissions (Mt)', key: 'scope12', improve: 'down' },
                      { label: 'Implied Temp. (\u00b0C)', key: 'impliedTemp', improve: 'down' },
                    ].map((m, ri) => (
                      <tr key={ri} style={{ borderBottom: `1px solid ${T.border}`, background: ri % 2 === 1 ? T.bg : T.surface }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600, color: T.navy }}>{m.label}</td>
                        {yoyFilled.map(y => (<td key={y.year} style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>{y[m.key]}</td>))}
                        <td style={{ padding: '6px 8px', textAlign: 'center', color: T.green, fontWeight: 700 }}>{m.improve === 'down' ? '\u2193' : '\u2191'} Improving</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─ HOLDINGS TABLE TAB ─ */}
          {activePreviewTab === 'holdings' && (
            <div style={{ background: T.surface, borderRadius: 12, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.navy, marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${T.border}` }}>
                Portfolio Holdings ({effectiveHoldings.length}) \u2014 Click headers to sort
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 900 }}>
                  <thead>
                    <tr style={{ background: T.navy }}>
                      {[
                        { col: 'name', label: 'Company' }, { col: 'ticker', label: 'Ticker' },
                        { col: 'sector', label: 'Sector' }, { col: 'exchange', label: 'Exchange' },
                        { col: 'weight', label: 'Weight%' }, { col: 'exposure', label: 'Exp (Mn)' },
                        { col: 'scope1', label: 'S1 (Mt)' }, { col: 'scope2', label: 'S2 (Mt)' },
                        { col: 'ghgInt', label: 'GHG Int.' }, { col: 'esg', label: 'ESG' },
                        { col: 'trisk', label: 'T-Risk' }, { col: 'sbti', label: 'SBTi' },
                        { col: 'nzYear', label: 'NZ Year' },
                      ].map(h => (
                        <th key={h.col} onClick={() => handleSort(h.col)} style={{
                          padding: '7px 6px', color: '#fff', fontWeight: 700, fontSize: 9,
                          textAlign: ['name', 'sector', 'exchange', 'sbti'].includes(h.col) ? 'left' : 'right',
                          cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
                        }}>
                          {h.label}{sortArrow(h.col)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHoldings.map((h, i) => {
                      const c = h.company || {};
                      const ghgInt = c.revenue_usd_mn ? ((c.scope1_mt + c.scope2_mt) / c.revenue_usd_mn * 1000).toFixed(1) : 'N/A';
                      const pcafAF = c.evic_usd_mn ? ((h.exposure_usd_mn || 0) / c.evic_usd_mn).toFixed(4) : 'N/A';
                      return (
                        <tr key={h.id || i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 1 ? T.bg : T.surface }}>
                          <td style={{ padding: '6px', fontWeight: 600, color: T.navy, whiteSpace: 'nowrap' }}>{c.name || 'N/A'}</td>
                          <td style={{ padding: '6px', textAlign: 'right', color: T.textSec }}>{c.ticker || ''}</td>
                          <td style={{ padding: '6px', color: T.textSec }}>{c.sector || ''}</td>
                          <td style={{ padding: '6px', color: T.textSec }}>{c.exchange || ''}</td>
                          <td style={{ padding: '6px', textAlign: 'right', fontWeight: 700 }}>{(h.weight || 0).toFixed(1)}</td>
                          <td style={{ padding: '6px', textAlign: 'right' }}>{(h.exposure_usd_mn || 0).toFixed(1)}</td>
                          <td style={{ padding: '6px', textAlign: 'right' }}>{fmtNum(c.scope1_mt, 2)}</td>
                          <td style={{ padding: '6px', textAlign: 'right' }}>{fmtNum(c.scope2_mt, 2)}</td>
                          <td style={{ padding: '6px', textAlign: 'right', color: parseFloat(ghgInt) > 185 ? T.red : T.green, fontWeight: 700 }}>{ghgInt}</td>
                          <td style={{ padding: '6px', textAlign: 'right' }}>{c.esg_score || 'N/A'}</td>
                          <td style={{ padding: '6px', textAlign: 'right', color: (c.transition_risk_score || 0) > 50 ? T.red : T.textSec }}>{c.transition_risk_score || 'N/A'}</td>
                          <td style={{ padding: '6px', color: c.sbti_committed ? T.green : T.textMut, fontWeight: 600 }}>{c.sbti_committed ? 'Yes' : 'No'}</td>
                          <td style={{ padding: '6px', textAlign: 'right', color: T.textSec }}>{c.carbon_neutral_target_year || '\u2014'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─ SCENARIO ANALYSIS TAB ─ */}
          {activePreviewTab === 'scenario' && (
            <div style={{ background: T.surface, borderRadius: 12, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.navy, marginBottom: 4, paddingBottom: 8, borderBottom: `2px solid ${T.border}` }}>
                NGFS Scenario Analysis
              </div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 16 }}>
                Portfolio impact under four NGFS climate scenarios based on sector-level transition shocks applied to current portfolio weights.
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
                <thead>
                  <tr style={{ background: T.navy }}>
                    {['Scenario', 'Category', 'Temp', 'Portfolio Impact (%)', 'Value at Risk (USD Mn)', 'Worst Sector'].map(h => (
                      <th key={h} style={{ padding: '9px 10px', color: '#fff', fontWeight: 700, fontSize: 10, textAlign: h.includes('Impact') || h.includes('Value') ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scenarioResults.map((sc, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 1 ? T.bg : T.surface }}>
                      <td style={{ padding: '9px 10px', fontWeight: 700, color: sc.color }}>{sc.name}</td>
                      <td style={{ padding: '9px 10px' }}>{sc.category}</td>
                      <td style={{ padding: '9px 10px' }}>{sc.temp}</td>
                      <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: sc.totalImpact < 0 ? T.red : T.green }}>{sc.totalImpact}%</td>
                      <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700 }}>{sc.var}</td>
                      <td style={{ padding: '9px 10px', color: T.textSec }}>{sc.worstSector} ({sc.worstShock}%)</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Scenario Impact Comparison</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={scenarioResults} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: `1px solid ${T.border}` }} formatter={(v) => [`${v}%`, 'Impact']} />
                  <ReferenceLine y={0} stroke={T.textMut} />
                  <Bar dataKey="totalImpact" radius={[4, 4, 0, 0]}>
                    {scenarioResults.map((sc, i) => (<Cell key={i} fill={sc.color} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ─ COMPLIANCE TAB ─ */}
          {activePreviewTab === 'compliance' && (
            <div style={{ background: T.surface, borderRadius: 12, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.navy, marginBottom: 4, paddingBottom: 8, borderBottom: `2px solid ${T.border}` }}>
                Compliance Checklist \u2014 {fw.label}
              </div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 16 }}>
                Regulatory compliance matrix for the {fw.fullName} framework.
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Compliant', count: complianceChecklist.filter(c => c.status === 'compliant').length, color: T.green },
                  { label: 'Partial', count: complianceChecklist.filter(c => c.status === 'partial').length, color: T.amber },
                  { label: 'Gap', count: complianceChecklist.filter(c => c.status === 'gap').length, color: T.red },
                ].map((b, i) => (
                  <div key={i} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: b.color }}>{b.count}</div>
                    <div style={{ fontSize: 10, color: T.textMut }}>{b.label}</div>
                  </div>
                ))}
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.navy }}>
                    {['Requirement', 'Status', 'Data Source', 'Notes'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', color: '#fff', fontWeight: 700, fontSize: 10, textAlign: h === 'Status' ? 'center' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {complianceChecklist.map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 1 ? T.bg : T.surface }}>
                      <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy }}>{row.requirement}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 700, color: row.status === 'compliant' ? T.green : row.status === 'partial' ? T.amber : T.red }}>
                        {row.status === 'compliant' ? '\u2705 Compliant' : row.status === 'partial' ? '\u26a0\ufe0f Partial' : '\u274c Gap'}
                      </td>
                      <td style={{ padding: '7px 10px', color: T.textSec }}>{row.source}</td>
                      <td style={{ padding: '7px 10px', color: T.textSec }}>{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ─ METHODOLOGY TAB ─ */}
          {activePreviewTab === 'methodology' && (
            <div style={{ background: T.surface, borderRadius: 12, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.navy, marginBottom: 16, paddingBottom: 8, borderBottom: `2px solid ${T.border}` }}>
                Methodology Notes & Glossary
              </div>
              {METHODOLOGY_NOTES.map((m, i) => (
                <div key={i} style={{ marginBottom: 18, paddingLeft: 14, borderLeft: `3px solid ${T.gold}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{m.title}</div>
                  <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.7 }}>{m.text}</div>
                </div>
              ))}

              <div style={{ marginTop: 24, fontSize: 13, fontWeight: 800, color: T.navy, marginBottom: 12, paddingBottom: 6, borderBottom: `2px solid ${T.border}` }}>
                Glossary of Terms
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.navy }}>
                    <th style={{ padding: '7px 10px', color: '#fff', fontWeight: 700, fontSize: 10, textAlign: 'left', width: 100 }}>Term</th>
                    <th style={{ padding: '7px 10px', color: '#fff', fontWeight: 700, fontSize: 10, textAlign: 'left' }}>Definition</th>
                  </tr>
                </thead>
                <tbody>
                  {GLOSSARY.map((g, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 1 ? T.bg : T.surface }}>
                      <td style={{ padding: '6px 10px', fontWeight: 700, color: T.navy }}>{g.term}</td>
                      <td style={{ padding: '6px 10px', color: T.textSec }}>{g.definition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ─ ADVANCED KPIs TAB ─ */}
          {activePreviewTab === 'kpis' && (
            <div style={{ background: T.surface, borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.navy, marginBottom: 6 }}>
                Multidimensional KPI Dashboard
              </div>
              <div style={{ fontSize: 12, color: T.textSec, marginBottom: 24 }}>
                18 advanced institutional-grade metrics across 6 risk dimensions
              </div>

              {/* ── DIMENSION CARDS ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                {/* DIMENSION 1: CLIMATE */}
                {renderDimensionCard('🌡', 'Climate Metrics', '#ef4444', [
                  { label: 'Carbon Efficiency', value: `${advancedKPIs.carbonEfficiency.toFixed(2)}`, unit: 'USD Mn / kt CO\u2082e', gauge: Math.min(100, advancedKPIs.carbonEfficiency * 10), good: 'higher' },
                  { label: 'Climate VaR (95% CI)', value: `${advancedKPIs.cvarPct.toFixed(1)}%`, unit: `${advancedKPIs.cvarUsdMn.toFixed(1)} USD Mn`, gauge: Math.min(100, 100 - advancedKPIs.cvarPct), good: 'lower', alert: advancedKPIs.cvarPct > 15 },
                  { label: 'Annual Decarbonisation Rate Required', value: `\u2212${advancedKPIs.requiredAnnualDecline.toFixed(1)}%`, unit: 'per year for 1.5\u00b0C', gauge: Math.min(100, 100 - advancedKPIs.requiredAnnualDecline * 5), good: 'lower' },
                  { label: 'Carbon Budget Overshoot', value: `+${advancedKPIs.carbonBudgetOvershoot.toFixed(0)}%`, unit: 'above 1.5\u00b0C pathway', gauge: Math.max(0, 100 - advancedKPIs.carbonBudgetOvershoot), good: 'lower', alert: advancedKPIs.carbonBudgetOvershoot > 50 },
                ])}

                {/* DIMENSION 2: TRANSITION READINESS */}
                {renderDimensionCard('\u26A1', 'Transition Readiness', '#f97316', [
                  { label: 'Transition Readiness Index', value: `${advancedKPIs.transitionReadinessIndex.toFixed(0)}/100`, unit: 'SBTi + NZ + Green Rev', gauge: advancedKPIs.transitionReadinessIndex, good: 'higher' },
                  { label: 'Green / Brown Ratio', value: `${advancedKPIs.greenBrownRatio.toFixed(1)}x`, unit: `${advancedKPIs.greenRevShare.toFixed(0)}% green vs ${advancedKPIs.brownWeight.toFixed(0)}% brown`, gauge: Math.min(100, advancedKPIs.greenBrownRatio * 25), good: 'higher' },
                  { label: 'Stranding Risk Exposure', value: `${advancedKPIs.strandingRiskPct.toFixed(1)}%`, unit: 'high-carbon + high T-Risk', gauge: Math.max(0, 100 - advancedKPIs.strandingRiskPct * 3), good: 'lower', alert: advancedKPIs.strandingRiskPct > 20 },
                  { label: 'CapEx Alignment (proxy)', value: `${advancedKPIs.alignedCapexProxy.toFixed(0)}%`, unit: 'SBTi + NZ \u22642050', gauge: advancedKPIs.alignedCapexProxy, good: 'higher' },
                ])}

                {/* DIMENSION 3: NATURE & BIODIVERSITY */}
                {renderDimensionCard('🌿', 'Nature & Biodiversity', '#059669', [
                  { label: 'Nature Dependency Score', value: `${advancedKPIs.natureDependencyScore.toFixed(0)}/100`, unit: 'ENCORE-weighted', gauge: Math.max(0, 100 - advancedKPIs.natureDependencyScore), good: 'lower' },
                  { label: 'Water Stress Exposure', value: `${advancedKPIs.waterStressExposure.toFixed(1)}%`, unit: 'high-water sectors', gauge: Math.max(0, 100 - advancedKPIs.waterStressExposure * 2), good: 'lower' },
                  { label: 'Deforestation Risk', value: `${advancedKPIs.deforestationRisk.toFixed(1)}%`, unit: 'forest-sensitive sectors', gauge: Math.max(0, 100 - advancedKPIs.deforestationRisk * 3), good: 'lower' },
                ])}

                {/* DIMENSION 4: SOCIAL */}
                {renderDimensionCard('👥', 'Social Metrics', '#7c3aed', [
                  { label: 'Board Gender Diversity', value: `${advancedKPIs.boardDiversity.toFixed(1)}%`, unit: 'avg female representation', gauge: advancedKPIs.boardDiversity * 2, good: 'higher' },
                  { label: 'Controversial Holdings', value: `${advancedKPIs.controversialPct.toFixed(0)}%`, unit: 'T-Risk > 80', gauge: Math.max(0, 100 - advancedKPIs.controversialPct * 5), good: 'lower', alert: advancedKPIs.controversialPct > 10 },
                  { label: 'Low-Wage Sector Exposure', value: `${advancedKPIs.lowWageExposure.toFixed(1)}%`, unit: 'ConsDisc + ConsStpl + Indust', gauge: Math.max(0, 100 - advancedKPIs.lowWageExposure * 1.5), good: 'lower' },
                ])}

                {/* DIMENSION 5: GOVERNANCE & DATA */}
                {renderDimensionCard('🛡', 'Governance & Data Quality', '#1e40af', [
                  { label: 'Portfolio ESG Score', value: `${advancedKPIs.esgScore.toFixed(0)}/100`, unit: 'weighted average', gauge: advancedKPIs.esgScore, good: 'higher' },
                  { label: 'ESG Score Dispersion', value: `\u03C3 = ${advancedKPIs.esgStdDev.toFixed(1)}`, unit: 'cross-holding std dev', gauge: Math.max(0, 100 - advancedKPIs.esgStdDev * 3), good: 'lower' },
                  { label: 'GHG Data Quality', value: `${advancedKPIs.dataQualityScore.toFixed(0)}%`, unit: 'holdings with reported data', gauge: advancedKPIs.dataQualityScore, good: 'higher', alert: advancedKPIs.dataQualityScore < 50 },
                ])}

                {/* DIMENSION 6: PORTFOLIO RISK */}
                {renderDimensionCard('📐', 'Concentration & Risk', '#9f1239', [
                  { label: 'HHI Concentration', value: `${advancedKPIs.hhi.toFixed(0)}`, unit: advancedKPIs.hhi < 1500 ? '\u2705 Diversified' : advancedKPIs.hhi < 2500 ? '⚠ Moderate' : '🔴 Concentrated', gauge: Math.max(0, 100 - advancedKPIs.hhi / 50), good: 'lower', alert: advancedKPIs.hhi > 2500 },
                  { label: 'Top 3 Sector Weight', value: `${advancedKPIs.top3SectorConcentration.toFixed(1)}%`, unit: 'sector concentration', gauge: Math.max(0, 100 - advancedKPIs.top3SectorConcentration), good: 'lower' },
                  { label: 'Largest Single Position', value: `${advancedKPIs.maxWeight.toFixed(1)}%`, unit: 'single name risk', gauge: Math.max(0, 100 - advancedKPIs.maxWeight * 3), good: 'lower', alert: advancedKPIs.maxWeight > 20 },
                  { label: 'Exchange Diversification', value: `${advancedKPIs.uniqueExchanges}`, unit: 'unique exchanges', gauge: Math.min(100, advancedKPIs.uniqueExchanges * 10), good: 'higher' },
                ])}
              </div>

              {/* ── CVaR DECOMPOSITION ── */}
              <div style={{ marginTop: 24, background: T.bg, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Climate VaR Decomposition (95% Confidence)</div>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                      <div style={{ height: 24, background: '#ef4444', borderRadius: '4px 0 0 4px', width: `${(advancedKPIs.transitionVaR / (advancedKPIs.transitionVaR + advancedKPIs.physicalVaR + 0.01)) * 100}%`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700 }}>Transition</div>
                      <div style={{ height: 24, background: '#3b82f6', borderRadius: '0 4px 4px 0', width: `${(advancedKPIs.physicalVaR / (advancedKPIs.transitionVaR + advancedKPIs.physicalVaR + 0.01)) * 100}%`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700 }}>Physical</div>
                    </div>
                    <div style={{ fontSize: 10, color: T.textMut }}>
                      Combined: \u221A(T\u00B2 + P\u00B2 + 2\u03C1TP) where \u03C1 = 0.25 | z = 1.645 (95% CI)
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 160 }}>
                    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Climate VaR</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#ef4444' }}>{advancedKPIs.cvarPct.toFixed(1)}%</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{advancedKPIs.cvarUsdMn.toFixed(1)} USD Mn at risk</div>
                  </div>
                </div>
              </div>

              {/* ── DIMENSION SUMMARY TABLE ── */}
              <div style={{ marginTop: 24, background: T.bg, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>6-Dimension Composite Scores</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.navy}` }}>
                      {['Dimension', 'Score', 'Assessment', 'Key Driver', 'Trend'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMut, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { dim: '🌡 Climate', score: Math.max(0, 100 - advancedKPIs.cvarPct * 3).toFixed(0), driver: `CVaR ${advancedKPIs.cvarPct.toFixed(1)}%`, trend: advancedKPIs.carbonBudgetOvershoot > 50 ? '\u2197 Rising' : '\u2192 Stable' },
                      { dim: '\u26A1 Transition', score: advancedKPIs.transitionReadinessIndex.toFixed(0), driver: `TRI ${advancedKPIs.transitionReadinessIndex.toFixed(0)}/100`, trend: advancedKPIs.transitionReadinessIndex > 40 ? '\u2197 Improving' : '\u2192 Lagging' },
                      { dim: '🌿 Nature', score: Math.max(0, 100 - advancedKPIs.natureDependencyScore).toFixed(0), driver: `Dep. ${advancedKPIs.natureDependencyScore.toFixed(0)}/100`, trend: '\u2192 Stable' },
                      { dim: '👥 Social', score: Math.max(0, 100 - advancedKPIs.controversialPct * 5).toFixed(0), driver: `Diversity ${advancedKPIs.boardDiversity.toFixed(0)}%`, trend: '\u2197 Improving' },
                      { dim: '🛡 Governance', score: advancedKPIs.esgScore.toFixed(0), driver: `ESG ${advancedKPIs.esgScore.toFixed(0)}/100`, trend: '\u2192 Stable' },
                      { dim: '📐 Risk', score: (advancedKPIs.hhi < 1500 ? 80 : advancedKPIs.hhi < 2500 ? 50 : 20).toFixed(0), driver: `HHI ${advancedKPIs.hhi.toFixed(0)}`, trend: advancedKPIs.hhi < 1500 ? '\u2705 Healthy' : '⚠ Monitor' },
                    ].map((row, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surface : 'transparent' }}>
                        <td style={{ padding: '10px', fontWeight: 700, color: T.navy }}>{row.dim}</td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 80, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ width: `${row.score}%`, height: '100%', background: Number(row.score) > 70 ? '#16a34a' : Number(row.score) > 40 ? '#d97706' : '#dc2626', borderRadius: 4 }} />
                            </div>
                            <span style={{ fontWeight: 800, color: T.navy, fontSize: 13 }}>{row.score}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px', color: Number(row.score) > 70 ? '#16a34a' : Number(row.score) > 40 ? '#d97706' : '#dc2626', fontWeight: 700, fontSize: 11 }}>
                          {Number(row.score) > 70 ? '\u25CF Strong' : Number(row.score) > 40 ? '\u25CF Moderate' : '\u25CF Weak'}
                        </td>
                        <td style={{ padding: '10px', color: T.textSec, fontSize: 11 }}>{row.driver}</td>
                        <td style={{ padding: '10px', color: T.textSec, fontSize: 11 }}>{row.trend}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─ LIVE PREVIEW TAB ─ */}
          {activePreviewTab === 'live' && (
            <div style={{ background: T.surface, borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>

              {/* Report Header */}
              <div style={{ background: T.navy, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{fw.label} Disclosure</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>{clientDetails.fundName || 'Fund Name \u2014 Enter in Builder'}</div>
                  <div style={{ fontSize: 11, color: T.gold, marginTop: 2 }}>{clientDetails.reportingPeriod} \u2022 {clientDetails.date || new Date().toISOString().slice(0, 10)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>PREPARED BY</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{clientDetails.preparedBy || '\u2014'}</div>
                  {clientDetails.isin && (<div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>ISIN: {clientDetails.isin}</div>)}
                </div>
              </div>

              {/* Portfolio KPI Strip */}
              <div style={{ background: '#f0f4fa', borderBottom: `1px solid ${T.border}`, padding: '10px 24px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {[
                  { label: 'WACI', val: `${fmtNum(portfolioMetrics.waci)} t/Mn` },
                  { label: 'S1+S2', val: `${fmtNum(portfolioMetrics.scope1 + portfolioMetrics.scope2, 0)} Mt` },
                  { label: 'SBTi', val: `${fmtNum(portfolioMetrics.sbtiPct)}%` },
                  { label: 'Temp.', val: `${portfolioMetrics.impliedTemp}\u00b0C` },
                  { label: 'Holdings', val: effectiveHoldings.length },
                ].map((m, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 1 }}>{m.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.navy }}>{m.val}</div>
                  </div>
                ))}
              </div>

              {/* Section Content */}
              <div style={{ padding: '20px 24px' }}>
                {fw.categories.map((cat, ci) => {
                  const catSections = cat.items.filter(item => sections[item.id]);
                  if (!catSections.length) return null;
                  return (
                    <div key={ci} style={{ marginBottom: 24 }}>
                      <div style={{ background: fw.color, color: '#ffffff', borderRadius: 7, padding: '8px 14px', fontSize: 12, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 18, height: 18, background: T.gold, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: T.navy }}>{ci + 1}</span>
                        {cat.name}
                      </div>
                      {catSections.map(item => (
                        <div key={item.id} style={{ marginBottom: 16, paddingLeft: 14, borderLeft: `3px solid ${T.gold}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>
                              Section {item.id}: {item.label}
                            </div>
                            <button onClick={() => setEditingNarrative(editingNarrative === item.id ? null : item.id)} style={{
                              fontSize: 9, padding: '2px 6px', borderRadius: 4,
                              border: `1px solid ${T.border}`, background: editingNarrative === item.id ? T.gold : T.surface,
                              color: editingNarrative === item.id ? '#fff' : T.textMut,
                              cursor: 'pointer', fontFamily: T.font,
                            }}>
                              {editingNarrative === item.id ? 'Done' : '\u270f\ufe0f Edit'}
                            </button>
                          </div>

                          {editingNarrative === item.id ? (
                            <textarea
                              value={narrative[item.id] || getAutoContent(activeFramework, item.id, portfolioMetrics, clientDetails, effectiveHoldings)}
                              onChange={e => setNarrative(prev => ({ ...prev, [item.id]: e.target.value }))}
                              style={{
                                width: '100%', minHeight: 80, padding: '8px 10px', borderRadius: 6,
                                border: `1px solid ${T.gold}`, fontSize: 11, color: T.text,
                                fontFamily: T.font, lineHeight: 1.6, resize: 'vertical',
                              }}
                            />
                          ) : (
                            <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.7 }}>
                              {narrative[item.id] || getAutoContent(activeFramework, item.id, portfolioMetrics, clientDetails, effectiveHoldings)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}

                {selectedCount === 0 && (
                  <div style={{ textAlign: 'center', padding: '36px', color: T.textMut, fontSize: 13 }}>
                    Select sections in the builder panel to populate report content.
                  </div>
                )}

                {/* Disclaimer */}
                <div style={{ marginTop: 24, padding: '12px 14px', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 9, color: T.textMut, lineHeight: 1.6 }}>
                  <strong>Disclaimer:</strong> This report is prepared for informational purposes only and does not constitute investment advice. Climate data sourced from company disclosures and third-party providers. Scope 3 emissions are estimates. Generated by AA Impact Risk Analytics Platform.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
