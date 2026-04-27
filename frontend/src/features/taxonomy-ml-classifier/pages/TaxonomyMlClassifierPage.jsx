import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EU_TAXONOMY_ACTIVITIES, EU_TAXONOMY_SECTOR_ELIGIBILITY } from '../../../data/euTaxonomyEligibility';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ComposedChart, Area, AreaChart
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const hashStr = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i); return Math.abs(h); };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const fmtPct = (v, d = 1) => `${(v).toFixed(d)}%`;
const fmtNum = (v, d = 0) => Number(v).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

const MODELS = [
  { id: 'xgb', name: 'XGBoost v2.1', type: 'Gradient Boosted Trees', accuracy: 0.918, precision: 0.904, recall: 0.887, f1: 0.895, auc: 0.964, trainTime: '18.4 min', rows: 184320, retrained: '2026-04-09', features: 32, depth: 8, nEstimators: 600, lr: 0.05, status: 'Production' },
  { id: 'rf', name: 'Random Forest v1.8', type: 'Ensemble Bagging', accuracy: 0.893, precision: 0.881, recall: 0.869, f1: 0.875, auc: 0.941, trainTime: '11.2 min', rows: 184320, retrained: '2026-04-07', features: 32, depth: 14, nEstimators: 400, lr: null, status: 'Challenger' },
  { id: 'lgb', name: 'LightGBM v3.0', type: 'Gradient Boosted Trees', accuracy: 0.911, precision: 0.898, recall: 0.882, f1: 0.890, auc: 0.958, trainTime: '9.7 min', rows: 184320, retrained: '2026-04-10', features: 32, depth: 9, nEstimators: 550, lr: 0.03, status: 'Production' },
  { id: 'lr', name: 'Logistic Regression', type: 'Linear', accuracy: 0.812, precision: 0.791, recall: 0.768, f1: 0.779, auc: 0.872, trainTime: '1.3 min', rows: 184320, retrained: '2026-04-04', features: 32, depth: null, nEstimators: null, lr: 0.01, status: 'Baseline' },
  { id: 'nn', name: 'MLP Neural Net', type: 'Deep Learning (3 hidden)', accuracy: 0.902, precision: 0.888, recall: 0.874, f1: 0.881, auc: 0.949, trainTime: '42.1 min', rows: 184320, retrained: '2026-04-06', features: 32, depth: 3, nEstimators: null, lr: 0.001, status: 'Research' },
  { id: 'gb', name: 'Gradient Boosting', type: 'Boosting', accuracy: 0.886, precision: 0.869, recall: 0.854, f1: 0.861, auc: 0.933, trainTime: '22.8 min', rows: 184320, retrained: '2026-04-03', features: 32, depth: 6, nEstimators: 300, lr: 0.1, status: 'Archived' }
];

const FEATURE_CATEGORIES = ['Financial', 'Emissions', 'Governance', 'Text/NLP', 'Sector/NACE', 'Geographic'];

const FEATURES = [
  { name: 'revenue_tax_eligible_pct', cat: 'Financial', type: 'numeric', missing: 2.3, imp: 0.142, desc: 'Share of revenue from EU-Taxonomy eligible NACE activities' },
  { name: 'capex_green_intensity', cat: 'Financial', type: 'numeric', missing: 4.1, imp: 0.128, desc: 'CapEx directed to taxonomy-aligned projects / total CapEx' },
  { name: 'opex_green_intensity', cat: 'Financial', type: 'numeric', missing: 7.8, imp: 0.061, desc: 'OpEx allocated to taxonomy-aligned operations / total OpEx' },
  { name: 'ebitda_margin', cat: 'Financial', type: 'numeric', missing: 1.1, imp: 0.038, desc: 'EBITDA / revenue — proxy for financial resilience' },
  { name: 'leverage_ratio', cat: 'Financial', type: 'numeric', missing: 2.7, imp: 0.024, desc: 'Net debt / EBITDA — transition financing capacity' },
  { name: 'rd_intensity', cat: 'Financial', type: 'numeric', missing: 9.2, imp: 0.041, desc: 'R&D / revenue — proxy for transition innovation' },
  { name: 'scope1_intensity', cat: 'Emissions', type: 'numeric', missing: 3.4, imp: 0.117, desc: 'tCO2e Scope 1 per €M revenue' },
  { name: 'scope2_intensity', cat: 'Emissions', type: 'numeric', missing: 4.2, imp: 0.092, desc: 'tCO2e Scope 2 (market-based) per €M revenue' },
  { name: 'scope3_coverage', cat: 'Emissions', type: 'numeric', missing: 18.7, imp: 0.058, desc: '% of Scope 3 categories reported' },
  { name: 'ghg_target_sbti', cat: 'Emissions', type: 'categorical', missing: 12.4, imp: 0.073, desc: 'SBTi validation status (none/committed/1.5°C/WB2C)' },
  { name: 'emissions_trend_3y', cat: 'Emissions', type: 'numeric', missing: 14.8, imp: 0.054, desc: '3-year Scope 1+2 CAGR' },
  { name: 'green_revenue_growth', cat: 'Emissions', type: 'numeric', missing: 22.1, imp: 0.046, desc: '3Y growth in taxonomy-aligned revenue' },
  { name: 'board_climate_expertise', cat: 'Governance', type: 'categorical', missing: 11.6, imp: 0.032, desc: 'Board members with stated climate expertise' },
  { name: 'climate_linked_comp', cat: 'Governance', type: 'categorical', missing: 19.3, imp: 0.029, desc: 'Executive comp linked to climate KPIs' },
  { name: 'audit_assurance_level', cat: 'Governance', type: 'categorical', missing: 6.8, imp: 0.047, desc: 'External assurance level of sustainability data' },
  { name: 'tcfd_alignment_score', cat: 'Governance', type: 'numeric', missing: 14.1, imp: 0.051, desc: 'TCFD 4-pillar completeness score 0-100' },
  { name: 'csrd_esrs_coverage', cat: 'Governance', type: 'numeric', missing: 16.9, imp: 0.049, desc: 'ESRS datapoints reported / total mandatory' },
  { name: 'nlp_activity_match_score', cat: 'Text/NLP', type: 'numeric', missing: 3.1, imp: 0.134, desc: 'Cosine similarity of disclosures to taxonomy NACE descriptions' },
  { name: 'nlp_dnsh_mention_density', cat: 'Text/NLP', type: 'numeric', missing: 3.1, imp: 0.082, desc: 'DNSH keyword density per 10k tokens' },
  { name: 'nlp_greenwash_risk_flag', cat: 'Text/NLP', type: 'numeric', missing: 3.1, imp: 0.068, desc: 'ML flag for vague/unsubstantiated green claims' },
  { name: 'nlp_mss_safeguards_score', cat: 'Text/NLP', type: 'numeric', missing: 3.1, imp: 0.044, desc: 'Minimum Social Safeguards mention completeness' },
  { name: 'nlp_forward_looking_score', cat: 'Text/NLP', type: 'numeric', missing: 3.1, imp: 0.036, desc: 'Forward-looking commitment specificity' },
  { name: 'nace_primary_code', cat: 'Sector/NACE', type: 'categorical', missing: 0.4, imp: 0.098, desc: 'NACE Rev.2 primary 4-digit code' },
  { name: 'nace_diversification', cat: 'Sector/NACE', type: 'numeric', missing: 1.8, imp: 0.043, desc: 'HHI of revenue by NACE code' },
  { name: 'sector_transition_exposure', cat: 'Sector/NACE', type: 'numeric', missing: 2.1, imp: 0.067, desc: 'Weighted sector transition risk score' },
  { name: 'sector_physical_exposure', cat: 'Sector/NACE', type: 'numeric', missing: 2.1, imp: 0.041, desc: 'Weighted sector physical risk score' },
  { name: 'country_risk_score', cat: 'Geographic', type: 'numeric', missing: 0.8, imp: 0.052, desc: 'Sovereign ESG-weighted country score' },
  { name: 'revenue_eu27_share', cat: 'Geographic', type: 'numeric', missing: 5.2, imp: 0.056, desc: 'Revenue share within EU27 jurisdiction' },
  { name: 'asset_heat_exposure', cat: 'Geographic', type: 'numeric', missing: 11.4, imp: 0.031, desc: 'Share of assets in RCP8.5 high-heat zones' },
  { name: 'asset_flood_exposure', cat: 'Geographic', type: 'numeric', missing: 11.4, imp: 0.029, desc: 'Share of assets in 100yr flood zones' },
  { name: 'asset_water_stress', cat: 'Geographic', type: 'numeric', missing: 11.4, imp: 0.034, desc: 'Aqueduct water stress weighted by asset value' },
  { name: 'biodiversity_proximity', cat: 'Geographic', type: 'numeric', missing: 13.2, imp: 0.023, desc: 'Share of operations within 5km of KBAs' }
];

const NACE_ACTIVITIES = [
  { code: 'D35.11', name: 'Electricity generation (solar PV)', obj: 'CCM', threshold: '100 gCO2e/kWh decl. 5yrly to 0', prob: 0.98 },
  { code: 'D35.11', name: 'Electricity generation (onshore wind)', obj: 'CCM', threshold: '100 gCO2e/kWh decl. to 0', prob: 0.99 },
  { code: 'D35.11', name: 'Electricity generation (offshore wind)', obj: 'CCM', threshold: '100 gCO2e/kWh', prob: 0.99 },
  { code: 'D35.11', name: 'Electricity from bioenergy', obj: 'CCM', threshold: 'RED II sustainability + GHG savings', prob: 0.72 },
  { code: 'D35.11', name: 'Electricity generation (hydropower)', obj: 'CCM', threshold: '100 gCO2e/kWh or density', prob: 0.84 },
  { code: 'D35.11', name: 'Electricity from geothermal', obj: 'CCM', threshold: '100 gCO2e/kWh', prob: 0.91 },
  { code: 'D35.11', name: 'Electricity from nuclear', obj: 'CCM', threshold: 'High-level waste facility by 2050', prob: 0.67 },
  { code: 'D35.11', name: 'Electricity from natural gas', obj: 'CCM', threshold: '270 gCO2e/kWh (transitional)', prob: 0.54 },
  { code: 'F41.20', name: 'Construction of new buildings', obj: 'CCM', threshold: 'PED < NZEB -10%', prob: 0.76 },
  { code: 'L68.20', name: 'Acquisition & ownership of buildings', obj: 'CCM', threshold: 'EPC A or top 15% PED', prob: 0.81 },
  { code: 'F43.21', name: 'Installation of renewable energy equip', obj: 'CCM', threshold: 'Enabling criteria', prob: 0.94 },
  { code: 'H49.10', name: 'Passenger interurban rail transport', obj: 'CCM', threshold: 'Zero direct emissions', prob: 0.97 },
  { code: 'H49.20', name: 'Freight rail transport', obj: 'CCM', threshold: 'Zero direct emissions', prob: 0.96 },
  { code: 'H49.31', name: 'Urban & suburban passenger transport', obj: 'CCM', threshold: 'Zero direct tailpipe emissions', prob: 0.92 },
  { code: 'C29.10', name: 'Manufacture of low-carbon vehicles', obj: 'CCM', threshold: '<50 gCO2/km decl. to 0 by 2026', prob: 0.88 },
  { code: 'C24.10', name: 'Manufacture of iron & steel', obj: 'CCM', threshold: '1.328 tCO2e/t hot metal', prob: 0.43 },
  { code: 'C20.13', name: 'Manufacture of hydrogen', obj: 'CCM', threshold: '3 tCO2e/t H2 lifecycle', prob: 0.76 },
  { code: 'E38.11', name: 'Collection of non-hazardous waste', obj: 'CE', threshold: 'Separate collection at source', prob: 0.83 },
  { code: 'E37.00', name: 'Urban wastewater treatment', obj: 'WMR', threshold: 'Net energy consumption threshold', prob: 0.79 },
  { code: 'A01.29', name: 'Growing of perennial crops', obj: 'BIO', threshold: 'Sustainable forest mgmt plan', prob: 0.71 },
  { code: 'M72.19', name: 'R&D on low-carbon tech', obj: 'CCM', threshold: 'Enabling criteria for CCM', prob: 0.86 }
];

const ISSUERS = Array.from({ length: 40 }, (_, i) => {
  const sectors = ['Utilities', 'Industrials', 'Energy', 'Materials', 'Real Estate', 'Consumer Disc', 'Consumer Stap', 'Financials', 'Tech', 'Health Care'];
  const naces = ['D35.11', 'C29.10', 'L68.20', 'F41.20', 'H49.10', 'C24.10', 'C20.13', 'E38.11', 'M72.19', 'A01.29'];
  const regions = ['EU-DE', 'EU-FR', 'EU-NL', 'EU-IT', 'EU-ES', 'EU-SE', 'EU-FI', 'EU-DK', 'EU-PL', 'EU-IE'];
  const sector = sectors[i % sectors.length];
  const nace = naces[i % naces.length];
  const rev = 500 + sr(i + 1) * 45000;
  const emis = sector === 'Utilities' ? 180 + sr(i + 2) * 400 : sector === 'Industrials' ? 80 + sr(i + 3) * 220 : 15 + sr(i + 4) * 90;
  const align = sr(i + 5) * 0.85 + (sector === 'Utilities' ? 0.1 : 0);
  const conf = 0.55 + sr(i + 6) * 0.4;
  return {
    id: `ISS-${String(i + 1).padStart(3, '0')}`,
    name: ['Orsted Wind Power', 'Iberdrola Renov.', 'EDP Green', 'Vestas Turbines', 'Nordex Energy', 'Siemens Energy', 'Enel Green Pwr', 'Engie Renewables', 'TotalEnergies', 'Shell plc', 'BP Group', 'Repsol SA', 'Volkswagen AG', 'BMW Group', 'Mercedes-Benz', 'Stellantis NV', 'Renault SA', 'ArcelorMittal', 'ThyssenKrupp', 'Salzgitter AG', 'Holcim Ltd', 'HeidelbergCem', 'Saint-Gobain', 'LafargeHolcim', 'Unibail Rodamco', 'Vonovia SE', 'Klépierre SA', 'Covivio SA', 'DeutschBahn AG', 'SNCF Group', 'FS Italiane', 'Alstom SA', 'Bouygues SA', 'Vinci SA', 'Skanska AB', 'Veolia Envir.', 'Suez Group', 'BioAgri Nord.', 'DSM-Firmenich', 'Novozymes A/S'][i % 40],
    sector, nace, region: regions[i % regions.length],
    revenue: rev,
    emissions: emis,
    aligned: clamp(align, 0, 1),
    confidence: clamp(conf, 0, 1),
    tscPass: sr(i + 7) > 0.22,
    dnshPass: sr(i + 8) > 0.28,
    mssPass: sr(i + 9) > 0.18,
    reviewFlag: sr(i + 10) < 0.18,
    scope1: emis * 0.6,
    scope2: emis * 0.3,
    scope3: emis * 4.2,
    capexGreen: 0.05 + sr(i + 11) * 0.55,
    opexGreen: 0.03 + sr(i + 12) * 0.35,
    greenRevGrowth: -0.05 + sr(i + 13) * 0.28,
    tcfd: 30 + sr(i + 14) * 65,
    csrd: 25 + sr(i + 15) * 70,
    sbti: ['None', 'Committed', '1.5°C', 'WB2C'][Math.floor(sr(i + 16) * 4) % 4],
    country: regions[i % regions.length].split('-')[1]
  };
});

// --- Real EU Taxonomy eligibility data (EU Taxonomy Compass 2024) ---
const _TAX_ACT_MAP = Object.fromEntries(EU_TAXONOMY_ACTIVITIES.map(a => [a.activity_name, a]));
// Build fuzzy sector lookup: map issuer sector keywords → EU_TAXONOMY_SECTOR_ELIGIBILITY entries
const _TAX_SECTOR_KEYWORD_MAP = {
  'Utilities':      EU_TAXONOMY_SECTOR_ELIGIBILITY.find(s => s.sector === 'Electric Utilities (Renewable)'),
  'Energy':         EU_TAXONOMY_SECTOR_ELIGIBILITY.find(s => s.sector === 'Oil & Gas Exploration & Production'),
  'Financials':     EU_TAXONOMY_SECTOR_ELIGIBILITY.find(s => s.sector === 'Banks'),
  'Real Estate':    EU_TAXONOMY_SECTOR_ELIGIBILITY.find(s => s.sector === 'Real Estate (Commercial & Residential)'),
  'Materials':      EU_TAXONOMY_SECTOR_ELIGIBILITY.find(s => s.sector && s.sector.includes('Steel')),
  'Industrials':    EU_TAXONOMY_SECTOR_ELIGIBILITY.find(s => s.sector === 'Construction & Engineering'),
  'Consumer Disc':  EU_TAXONOMY_SECTOR_ELIGIBILITY.find(s => s.sector === 'Automobiles (EV manufacturers)'),
  'Consumer Stap':  null,
  'Tech':           null,
  'Health Care':    null,
};
ISSUERS.forEach(r => {
  const s = _TAX_SECTOR_KEYWORD_MAP[r.sector];
  const a = EU_TAXONOMY_ACTIVITIES.find(x => x.nace_code && r.nace && x.nace_code.includes(r.nace.split('.')[0]));
  if (s) {
    r.taxonomyEligiblePct = s.taxonomy_eligible_pct_est ?? r.taxonomyEligiblePct;
    r.taxonomyAlignedPct  = s.taxonomy_aligned_pct_est  ?? r.taxonomyAlignedPct;
    r.disclosureRate       = r.disclosureRate; // field not in seed; preserve existing
    r.eligibleActivities   = r.eligibleActivities; // field not in seed; preserve existing
  }
  if (a) {
    r.climateMitigation = (a.objective === 'CCM') ?? r.climateMitigation;
  }
});

const NLP_DOCUMENTS = [
  { id: 'D01', name: 'Orsted CSRD Report 2025', type: 'CSRD', pages: 412, tokens: 186420, tagsFound: 34, confidence: 0.94, activities: ['D35.11 Wind', 'F43.21 RE Install'], greenwashFlags: 0, date: '2025-11-14' },
  { id: 'D02', name: 'Iberdrola Sustainability 2025', type: 'GRI/CSRD', pages: 388, tokens: 172830, tagsFound: 29, confidence: 0.91, activities: ['D35.11 Wind', 'D35.11 Solar', 'D35.12 Dist.'], greenwashFlags: 1, date: '2025-10-28' },
  { id: 'D03', name: 'TotalEnergies 10-K 2024', type: '10-K', pages: 286, tokens: 124680, tagsFound: 14, confidence: 0.68, activities: ['D35.11 NG', 'B06.10 Oil'], greenwashFlags: 4, date: '2025-02-18' },
  { id: 'D04', name: 'Volkswagen Green Bond Frmwk', type: 'GBF', pages: 42, tokens: 18920, tagsFound: 8, confidence: 0.88, activities: ['C29.10 Low-C Vehicles'], greenwashFlags: 0, date: '2025-06-02' },
  { id: 'D05', name: 'ArcelorMittal Climate Plan', type: 'Climate', pages: 78, tokens: 34120, tagsFound: 11, confidence: 0.74, activities: ['C24.10 Steel', 'C20.13 H2'], greenwashFlags: 2, date: '2025-09-11' },
  { id: 'D06', name: 'Holcim CSRD 2025', type: 'CSRD', pages: 356, tokens: 154680, tagsFound: 22, confidence: 0.82, activities: ['C23.51 Cement'], greenwashFlags: 1, date: '2025-11-02' },
  { id: 'D07', name: 'Vonovia EU-Tax Report', type: 'Taxonomy', pages: 68, tokens: 28410, tagsFound: 18, confidence: 0.92, activities: ['L68.20 RE', 'F41.20 NewBld'], greenwashFlags: 0, date: '2025-07-21' },
  { id: 'D08', name: 'Deutsche Bahn ESG 2025', type: 'ESG', pages: 312, tokens: 138920, tagsFound: 26, confidence: 0.89, activities: ['H49.10 Rail', 'H49.20 Rail Frt'], greenwashFlags: 0, date: '2025-10-09' },
  { id: 'D09', name: 'Veolia Impact Report', type: 'Impact', pages: 210, tokens: 94180, tagsFound: 19, confidence: 0.83, activities: ['E38.11 Waste', 'E37.00 Sewer'], greenwashFlags: 1, date: '2025-08-15' },
  { id: 'D10', name: 'Novozymes Bioecon. Rpt', type: 'GRI', pages: 144, tokens: 62840, tagsFound: 9, confidence: 0.77, activities: ['M72.19 R&D'], greenwashFlags: 0, date: '2025-09-30' },
  { id: 'D11', name: 'Shell Energy Trans. Rpt', type: 'Climate', pages: 98, tokens: 42680, tagsFound: 12, confidence: 0.62, activities: ['D35.11 NG', 'M72.19 R&D'], greenwashFlags: 5, date: '2025-03-12' },
  { id: 'D12', name: 'Alstom SFDR Art.9 Disclosure', type: 'SFDR', pages: 52, tokens: 22140, tagsFound: 7, confidence: 0.90, activities: ['C30.20 Rail Mfg', 'H49.10 Rail'], greenwashFlags: 0, date: '2025-05-28' }
];

const DNSH_CRITERIA = [
  { id: 'CCM', name: 'Climate Change Mitigation', checks: ['GHG intensity vs threshold', 'Lifecycle emissions', 'Carbon lock-in risk'] },
  { id: 'CCA', name: 'Climate Change Adaptation', checks: ['Physical risk assessment', 'Adaptation solutions', 'Climate-resilient planning'] },
  { id: 'WMR', name: 'Water & Marine Resources', checks: ['Water use efficiency', 'Marine pollution prev.', 'WFD compliance'] },
  { id: 'CE', name: 'Circular Economy', checks: ['Waste prevention', 'Resource efficiency', 'Recyclability'] },
  { id: 'PP', name: 'Pollution Prevention', checks: ['BAT compliance', 'Hazardous substances', 'Air/soil emissions'] },
  { id: 'BIO', name: 'Biodiversity & Ecosystems', checks: ['KBA impact assessment', 'N2000 compliance', 'Nature-based solutions'] }
];

const REVIEW_QUEUE = Array.from({ length: 15 }, (_, i) => {
  const statuses = ['Low confidence', 'DNSH ambiguous', 'NACE conflict', 'Data quality', 'Greenwash risk'];
  return {
    id: `RQ-${String(i + 1).padStart(3, '0')}`,
    issuer: ISSUERS[i % ISSUERS.length].name,
    activity: NACE_ACTIVITIES[i % NACE_ACTIVITIES.length].name,
    mlScore: 0.35 + sr(i + 101) * 0.3,
    confidence: 0.4 + sr(i + 102) * 0.25,
    reason: statuses[i % statuses.length],
    flaggedBy: ['XGBoost', 'LightGBM', 'Ensemble Vote'][i % 3],
    waiting: Math.floor(sr(i + 103) * 12) + 1,
    priority: ['High', 'Medium', 'Low'][i % 3]
  };
});

const AUDIT_LOG = Array.from({ length: 20 }, (_, i) => {
  const events = ['Model Retrained', 'Feature Added', 'Threshold Changed', 'Review Completed', 'Drift Alert', 'Deployment', 'Rollback', 'Validation Run', 'Bias Audit', 'Data Refresh'];
  const users = ['quant.lead@a2', 'ml.eng@a2', 'risk.ops@a2', 'compliance@a2', 'cio.office@a2'];
  return {
    id: `AL-${String(i + 1).padStart(4, '0')}`,
    ts: `2026-0${Math.floor(i / 10) + 3}-${String((i % 28) + 1).padStart(2, '0')} ${String((i * 37) % 24).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`,
    event: events[i % events.length],
    user: users[i % users.length],
    model: MODELS[i % MODELS.length].name,
    detail: `Automated entry #${i + 1} — ${events[i % events.length]} on ${MODELS[i % MODELS.length].id}`,
    signature: `0x${hashStr(`${i}-audit`).toString(16).slice(0, 10)}`
  };
});

const DRIFT_METRICS = Array.from({ length: 24 }, (_, i) => ({
  month: `M${i + 1}`,
  psi_rev: 0.04 + Math.abs(Math.sin(i * 0.31)) * 0.12 + (i > 18 ? 0.08 : 0),
  psi_emis: 0.05 + Math.abs(Math.sin(i * 0.23 + 1)) * 0.11 + (i > 20 ? 0.11 : 0),
  psi_nlp: 0.03 + Math.abs(Math.sin(i * 0.41 + 2)) * 0.09,
  psi_nace: 0.02 + Math.abs(Math.sin(i * 0.17)) * 0.06,
  ks_stat: 0.08 + Math.abs(Math.sin(i * 0.27 + 0.5)) * 0.15
}));

const TSC_THRESHOLDS = NACE_ACTIVITIES.slice(0, 12).map((a, i) => ({
  activity: a.name.slice(0, 28),
  code: a.code,
  mean: a.prob,
  std: 0.04 + sr(i + 201) * 0.08,
  p_aligned: clamp(a.prob - 0.05 + sr(i + 202) * 0.1, 0, 1),
  p_partial: clamp(0.15 + sr(i + 203) * 0.15, 0, 1),
  p_none: clamp(0.05 + sr(i + 204) * 0.1, 0, 1),
  samples: 120 + Math.floor(sr(i + 205) * 280)
}));

const FRAMEWORKS = [
  { id: 'eu_tax', name: 'EU Taxonomy', coverage: 100, mapped: 88 },
  { id: 'csrd', name: 'CSRD / ESRS E1', coverage: 94, mapped: 82 },
  { id: 'sfdr', name: 'SFDR PAI', coverage: 88, mapped: 74 },
  { id: 'issb', name: 'ISSB S1/S2', coverage: 82, mapped: 68 },
  { id: 'tcfd', name: 'TCFD', coverage: 91, mapped: 79 },
  { id: 'uk_sdr', name: 'UK SDR', coverage: 61, mapped: 48 },
  { id: 'sg_tax', name: 'SG-Asia Taxonomy', coverage: 54, mapped: 38 }
];

function Pill({ children, color = T.navy, bg = T.surfaceH }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 12, fontSize: 10.5, fontWeight: 600, fontFamily: T.mono, color, background: bg, border: `1px solid ${T.border}`, letterSpacing: 0.3 }}>{children}</span>;
}

function StatusPill({ status }) {
  const map = {
    'Aligned': { c: T.green, b: '#e8f5ec' },
    'Partial': { c: T.amber, b: '#fdf4e3' },
    'Non-Aligned': { c: T.red, b: '#fde8e8' },
    'Review': { c: T.navyL, b: '#e8edf5' },
    'Production': { c: T.green, b: '#e8f5ec' },
    'Challenger': { c: T.navyL, b: '#e8edf5' },
    'Baseline': { c: T.textSec, b: T.surfaceH },
    'Research': { c: T.gold, b: '#faf4e6' },
    'Archived': { c: T.textMut, b: T.surfaceH },
    'High': { c: T.red, b: '#fde8e8' },
    'Medium': { c: T.amber, b: '#fdf4e3' },
    'Low': { c: T.green, b: '#e8f5ec' }
  };
  const s = map[status] || { c: T.textSec, b: T.surfaceH };
  return <Pill color={s.c} bg={s.b}>{status}</Pill>;
}

function KpiCard({ label, value, sub, accent = T.navy, mono = false }) {
  return (
    <div style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18, position: 'relative', overflow: 'hidden', minWidth: 150 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accent }} />
      <div style={{ fontSize: 10.5, color: T.textSec, textTransform: 'uppercase', letterSpacing: 0.7, fontFamily: T.mono, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 26, color: T.text, fontWeight: 700, marginTop: 6, fontFamily: mono ? T.mono : T.font, letterSpacing: -0.4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textMut, marginTop: 4, fontFamily: T.mono }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, subtitle, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${T.gold}` }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, letterSpacing: -0.2 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11.5, color: T.textSec, fontFamily: T.mono, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

function Card({ children, style = {} }) {
  return <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18, ...style }}>{children}</div>;
}

const METRIC_THRESHOLDS = [0.30, 0.40, 0.50, 0.60, 0.70];
const DRIFT_WINDOWS = [
  { id: 'w_old', label: 'Reference (2024 Q4)', seedOffset: 500 },
  { id: 'w_new', label: 'Current (2026 Q1)', seedOffset: 900 }
];
const AB_TRAFFIC = [10, 25, 50, 75, 90];
const AB_MODELS = [
  { id: 'champion', name: 'XGBoost v2.1 (Champion)', auc: 0.964, color: '#1b3a5c' },
  { id: 'challenger', name: 'LightGBM v3.0 (Challenger)', auc: 0.958, color: '#c5a96a' }
];
const PD_BINS = 10;
const CALIBRATION_BINS = 10;

const TAB_LABELS = [
  'Overview', 'Model Training', 'Feature Engineering', 'NLP Mapping', 'TSC Validation',
  'DNSH Validation', 'Confidence & Calibration', 'Feature Importance', 'Ensemble Voting',
  'Activity Auto-Tag', 'Portfolio Batch', 'Drift Monitoring', 'Review Queue', 'Governance & Audit',
  'Confusion Matrix', 'ROC / PR / Lift', 'Permutation Importance', 'Probability Calibration',
  'Concept Drift (PSI/KS)', 'A/B Testing Lab'
];

function OverviewTab({ modelComparison, framework, sortedFeatures, filteredIssuers, sectorFilter, setSectorFilter, sectors, portfolioAlignment, featImpByCategory }) {
  const top10Features = sortedFeatures.slice(0, 10);
  const alignDist = useMemo(() => {
    const buckets = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
    return buckets.map(b => ({
      bucket: `${b}-${b + 10}`,
      count: filteredIssuers.filter(i => i.aligned * 100 >= b && i.aligned * 100 < b + 10).length
    }));
  }, [filteredIssuers]);

  const pieData = useMemo(() => {
    const aligned = filteredIssuers.filter(i => i.aligned >= 0.7).length;
    const partial = filteredIssuers.filter(i => i.aligned >= 0.4 && i.aligned < 0.7).length;
    const non = filteredIssuers.filter(i => i.aligned < 0.4).length;
    return [
      { name: 'Aligned', value: aligned, fill: T.sage },
      { name: 'Partial', value: partial, fill: T.gold },
      { name: 'Non-Aligned', value: non, fill: T.red }
    ];
  }, [filteredIssuers]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <SectionHeader title="Executive Summary" subtitle="// ML-driven EU Taxonomy alignment scoring across portfolio"
          right={<select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: '6px 10px', fontFamily: T.mono, fontSize: 11, color: T.text }}>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>} />
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5 }}>Alignment distribution ({filteredIssuers.length} issuers)</div>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={alignDist}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
                <Bar dataKey="count" fill={T.navy} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5 }}>Classification split</div>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={{ fontSize: 10, fill: T.text }}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5 }}>Feature imp. by category</div>
            <ResponsiveContainer width="100%" height={210}>
              <RadarChart data={featImpByCategory}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 9, fill: T.textSec }} />
                <PolarRadiusAxis tick={{ fontSize: 9, fill: T.textMut }} />
                <Radar dataKey="importance" stroke={T.gold} fill={T.gold} fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionHeader title="Model Performance Comparison" subtitle="// all 6 trained models — Accuracy, Precision, Recall, F1, AUC" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={modelComparison}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} domain={[70, 100]} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="Accuracy" fill={T.navy} />
              <Bar dataKey="Precision" fill={T.navyL} />
              <Bar dataKey="Recall" fill={T.gold} />
              <Bar dataKey="F1" fill={T.sage} />
              <Bar dataKey="AUC" fill={T.goldL} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionHeader title="Multi-Framework Coverage" subtitle="// cross-framework mapping from Taxonomy ML outputs" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {framework.map(f => (
              <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 60px', gap: 10, alignItems: 'center' }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: T.text }}>{f.name}</div>
                <div style={{ position: 'relative', height: 16, background: T.surfaceH, borderRadius: 3, border: `1px solid ${T.border}` }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${f.coverage}%`, background: `linear-gradient(90deg, ${T.navy}, ${T.navyL})`, borderRadius: 3 }} />
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${f.mapped}%`, background: T.gold, opacity: 0.6, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 10.5, fontFamily: T.mono, color: T.textSec, textAlign: 'right' }}>{f.mapped}/{f.coverage}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: 10, background: T.surfaceH, borderRadius: 4, fontSize: 10.5, color: T.textSec, fontFamily: T.mono }}>
            ● navy=framework coverage · ● gold=mapped fields · Coverage computed from 184,320 training observations across 40 jurisdictional variants.
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader title="Top 10 Predictive Features" subtitle="// SHAP-weighted importance across Production ensemble" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {top10Features.map((f, i) => (
            <div key={f.name} style={{ display: 'grid', gridTemplateColumns: '30px 1fr 110px 2fr 70px', gap: 10, alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>#{i + 1}</div>
              <div style={{ fontSize: 11.5, color: T.text, fontFamily: T.mono, fontWeight: 600 }}>{f.name}</div>
              <Pill color={T.navy} bg={T.surfaceH}>{f.cat}</Pill>
              <div style={{ position: 'relative', height: 14, background: T.surfaceH, borderRadius: 3 }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(f.imp / 0.15) * 100}%`, background: T.gold, borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 11, fontFamily: T.mono, color: T.text, textAlign: 'right', fontWeight: 600 }}>{(f.imp * 100).toFixed(2)}%</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function TrainingTab({ modelId, setModelId, model, learningCurve, modelComparison, rocData }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <SectionHeader title="Model Training Dashboard" subtitle={`// selected: ${model.name} — ${model.type}`}
          right={
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {MODELS.map(m => (
                <div key={m.id} onClick={() => setModelId(m.id)} style={{
                  padding: '5px 10px', fontSize: 10.5, fontFamily: T.mono, cursor: 'pointer', fontWeight: modelId === m.id ? 700 : 500,
                  background: modelId === m.id ? T.navy : T.surface, color: modelId === m.id ? '#fff' : T.textSec,
                  border: `1px solid ${modelId === m.id ? T.navy : T.border}`, borderRadius: 3
                }}>{m.id.toUpperCase()}</div>
              ))}
            </div>
          } />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
          <KpiCard label="Accuracy" value={fmtPct(model.accuracy * 100, 2)} accent={T.green} mono />
          <KpiCard label="Precision" value={fmtPct(model.precision * 100, 2)} accent={T.navy} mono />
          <KpiCard label="Recall" value={fmtPct(model.recall * 100, 2)} accent={T.gold} mono />
          <KpiCard label="F1 Score" value={fmtPct(model.f1 * 100, 2)} accent={T.sage} mono />
          <KpiCard label="AUC-ROC" value={fmtPct(model.auc * 100, 2)} accent={T.navyL} mono />
          <KpiCard label="Train Time" value={model.trainTime} accent={T.textSec} mono />
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionHeader title="Learning Curve" subtitle="// train vs validation accuracy across training set size" />
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={learningCurve}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="rows" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} domain={[60, 100]} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="train" stroke={T.navy} strokeWidth={2} name="Train Acc %" dot={false} />
              <Line type="monotone" dataKey="valid" stroke={T.gold} strokeWidth={2} name="Validation %" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionHeader title="ROC Curve" subtitle="// TPR vs FPR across decision thresholds" />
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={rocData}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="fpr" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'False Positive Rate %', fontSize: 10, position: 'insideBottom', offset: -4 }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'TPR %', fontSize: 10, angle: -90, position: 'insideLeft' }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
              <Line type="monotone" dataKey="tpr" stroke={T.navy} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <SectionHeader title="Model Registry" subtitle="// all trained models · hyperparameters · lifecycle status" />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 11 }}>
            <thead>
              <tr style={{ background: T.surfaceH, borderBottom: `1px solid ${T.border}` }}>
                {['ID', 'Name', 'Type', 'Acc', 'Prec', 'Rec', 'F1', 'AUC', 'Depth', 'N_Est', 'LR', 'Rows', 'Last Retrain', 'Status'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODELS.map((m, i) => (
                <tr key={m.id} style={{ background: i % 2 ? T.surfaceH : T.surface, borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '7px 10px', color: T.navy, fontWeight: 700 }}>{m.id.toUpperCase()}</td>
                  <td style={{ padding: '7px 10px', fontWeight: 600 }}>{m.name}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{m.type}</td>
                  <td style={{ padding: '7px 10px' }}>{(m.accuracy * 100).toFixed(1)}</td>
                  <td style={{ padding: '7px 10px' }}>{(m.precision * 100).toFixed(1)}</td>
                  <td style={{ padding: '7px 10px' }}>{(m.recall * 100).toFixed(1)}</td>
                  <td style={{ padding: '7px 10px' }}>{(m.f1 * 100).toFixed(1)}</td>
                  <td style={{ padding: '7px 10px', color: T.green, fontWeight: 600 }}>{(m.auc * 100).toFixed(1)}</td>
                  <td style={{ padding: '7px 10px' }}>{m.depth ?? '—'}</td>
                  <td style={{ padding: '7px 10px' }}>{m.nEstimators ?? '—'}</td>
                  <td style={{ padding: '7px 10px' }}>{m.lr ?? '—'}</td>
                  <td style={{ padding: '7px 10px' }}>{fmtNum(m.rows)}</td>
                  <td style={{ padding: '7px 10px' }}>{m.retrained}</td>
                  <td style={{ padding: '7px 10px' }}><StatusPill status={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Hyperparameter Tuning Log" subtitle="// recent trial results · Optuna-style Bayesian search" />
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
            <XAxis type="number" dataKey="depth" name="Tree Depth" tick={{ fontSize: 10, fill: T.textSec }} domain={[3, 14]} />
            <YAxis type="number" dataKey="auc" name="AUC" tick={{ fontSize: 10, fill: T.textSec }} domain={[85, 97]} />
            <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={Array.from({ length: 50 }, (_, i) => ({ depth: 3 + Math.floor(sr(i + 501) * 11), auc: 86 + sr(i + 502) * 10, lr: 0.01 + sr(i + 503) * 0.15 }))} fill={T.gold} />
          </ScatterChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function FeatureEngTab({ sortedFeatures, featImpByCategory }) {
  const [catFilter, setCatFilter] = useState('ALL');
  const filtered = useMemo(() => catFilter === 'ALL' ? sortedFeatures : sortedFeatures.filter(f => f.cat === catFilter), [sortedFeatures, catFilter]);

  const missingData = useMemo(() => [...FEATURES].sort((a, b) => b.missing - a.missing).slice(0, 12), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <SectionHeader title="Feature Engineering Matrix" subtitle={`// ${FEATURES.length} features across ${FEATURE_CATEGORIES.length} categories`}
          right={
            <div style={{ display: 'flex', gap: 4 }}>
              {['ALL', ...FEATURE_CATEGORIES].map(c => (
                <div key={c} onClick={() => setCatFilter(c)} style={{
                  padding: '5px 10px', fontSize: 10.5, fontFamily: T.mono, cursor: 'pointer', fontWeight: catFilter === c ? 700 : 500,
                  background: catFilter === c ? T.navy : T.surface, color: catFilter === c ? '#fff' : T.textSec,
                  border: `1px solid ${catFilter === c ? T.navy : T.border}`, borderRadius: 3
                }}>{c}</div>
              ))}
            </div>
          } />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5 }}>Importance by category</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={featImpByCategory} layout="vertical">
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 10, fill: T.textSec }} width={90} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
                <Bar dataKey="importance" fill={T.gold} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5 }}>Missing data by feature (top 12)</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={missingData} layout="vertical">
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} unit="%" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: T.textSec }} width={160} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
                <Bar dataKey="missing" fill={T.red} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title={`Feature Dictionary (${filtered.length})`} subtitle="// production feature specs · data types · imputation strategies" />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 10.5 }}>
            <thead>
              <tr style={{ background: T.surfaceH, borderBottom: `1px solid ${T.border}` }}>
                {['#', 'Name', 'Category', 'Type', 'Missing %', 'Importance', 'Description'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => (
                <tr key={f.name} style={{ background: i % 2 ? T.surfaceH : T.surface, borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 10px', color: T.textMut }}>{i + 1}</td>
                  <td style={{ padding: '6px 10px', fontWeight: 700, color: T.navy }}>{f.name}</td>
                  <td style={{ padding: '6px 10px' }}><Pill color={T.navy} bg={T.surfaceH}>{f.cat}</Pill></td>
                  <td style={{ padding: '6px 10px', color: T.textSec }}>{f.type}</td>
                  <td style={{ padding: '6px 10px', color: f.missing > 15 ? T.red : f.missing > 8 ? T.amber : T.green }}>{f.missing.toFixed(1)}%</td>
                  <td style={{ padding: '6px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 60, height: 6, background: T.surfaceH, borderRadius: 3 }}>
                        <div style={{ width: `${(f.imp / 0.15) * 100}%`, height: '100%', background: T.gold, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontWeight: 600 }}>{(f.imp * 100).toFixed(2)}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '6px 10px', color: T.textSec, fontFamily: T.font, fontSize: 11 }}>{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionHeader title="Feature Transformation Pipeline" />
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.text, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              '01. Raw extract · SQL joins on entity_master · 184,320 rows',
              '02. Null imputation · KNN (k=7) for numeric · mode for categorical',
              '03. Outlier clipping · winsorize @ P01/P99',
              '04. NACE one-hot · 4-digit · 615 unique codes → 32 embeddings',
              '05. NLP features · sentence-BERT-base · 768-dim → PCA(24)',
              '06. Text greenwash flag · GPT-style classifier · threshold 0.65',
              '07. Scale · RobustScaler on numeric · no scaling on trees',
              '08. Interaction terms · auto-discovery via H-statistic',
              '09. Train/val/test split · stratified 70/15/15 by sector+region',
              '10. Class balancing · SMOTE on minority class (Non-Aligned)',
              '11. Feature selection · recursive via XGBoost gain',
              '12. Persist artifacts · mlflow registry · versioned'
            ].map((s, i) => (
              <div key={i} style={{ padding: '6px 10px', background: i % 2 ? T.surfaceH : 'transparent', borderLeft: `2px solid ${T.gold}` }}>{s}</div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionHeader title="Correlation Heatmap (Top 8)" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 1, fontFamily: T.mono, fontSize: 9 }}>
            <div />
            {sortedFeatures.slice(0, 8).map(f => <div key={f.name} style={{ fontSize: 8, color: T.textSec, textAlign: 'center', padding: 2, writingMode: 'vertical-rl' }}>{f.name.slice(0, 14)}</div>)}
            {sortedFeatures.slice(0, 8).map((row, i) => (
              <React.Fragment key={row.name}>
                <div style={{ fontSize: 8, color: T.textSec, padding: 2, textAlign: 'right' }}>{row.name.slice(0, 14)}</div>
                {sortedFeatures.slice(0, 8).map((col, j) => {
                  const c = i === j ? 1 : (Math.sin((i * 3 + j * 7 + 1)) + 1) / 2 * 0.8 - 0.1;
                  const intensity = Math.abs(c);
                  const hue = c > 0 ? T.navy : T.red;
                  return <div key={j} style={{ background: hue, opacity: 0.15 + intensity * 0.8, color: intensity > 0.5 ? '#fff' : T.text, textAlign: 'center', padding: '6px 2px', fontSize: 9 }}>{c.toFixed(2)}</div>;
                })}
              </React.Fragment>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function TaxonomyMlClassifierPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [modelId, setModelId] = useState('xgb');
  const [issuerId, setIssuerId] = useState(ISSUERS[0].id);
  const [confThreshold, setConfThreshold] = useState(70);
  const [nlpText, setNlpText] = useState('Our wind power generation fleet expanded by 24% in 2025, with 2.8 GW of new offshore capacity commissioned. CapEx directed to renewable energy was EUR 3.4bn, aligned with EU Taxonomy CCM criteria. DNSH assessments confirmed no significant harm to biodiversity, water resources, or circular economy objectives.');
  const [dnshCrit, setDnshCrit] = useState('CCM');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [ensembleWeights, setEnsembleWeights] = useState({ xgb: 40, lgb: 30, rf: 20, nn: 10 });
  const [calibMode, setCalibMode] = useState('reliability');
  const [driftFeature, setDriftFeature] = useState('psi_rev');

  const model = useMemo(() => MODELS.find(m => m.id === modelId) || MODELS[0], [modelId]);
  const issuer = useMemo(() => ISSUERS.find(i => i.id === issuerId) || ISSUERS[0], [issuerId]);

  const filteredIssuers = useMemo(() => sectorFilter === 'ALL' ? ISSUERS : ISSUERS.filter(i => i.sector === sectorFilter), [sectorFilter]);
  const sectors = useMemo(() => ['ALL', ...Array.from(new Set(ISSUERS.map(i => i.sector)))], []);

  const portfolioAlignment = useMemo(() => {
    const threshold = confThreshold / 100;
    const aligned = filteredIssuers.filter(i => i.aligned >= 0.5 && i.confidence >= threshold);
    const revSum = filteredIssuers.reduce((a, b) => a + b.revenue, 0);
    const alignedRev = aligned.reduce((a, b) => a + b.revenue * b.aligned, 0);
    return revSum > 0 ? (alignedRev / revSum) * 100 : 0;
  }, [filteredIssuers, confThreshold]);

  const avgConfidence = useMemo(() => {
    return filteredIssuers.length ? filteredIssuers.reduce((a, b) => a + b.confidence, 0) / filteredIssuers.length * 100 : 0;
  }, [filteredIssuers]);

  const dnshPassRate = useMemo(() => {
    const pass = filteredIssuers.filter(i => i.dnshPass).length;
    return filteredIssuers.length ? (pass / filteredIssuers.length) * 100 : 0;
  }, [filteredIssuers]);

  const nlpExtract = useMemo(() => {
    const text = (nlpText || '').toLowerCase();
    const tags = [];
    const patterns = [
      { kw: ['wind'], act: 'D35.11 Wind Power', conf: 0.94 },
      { kw: ['solar', 'photovolt'], act: 'D35.11 Solar PV', conf: 0.93 },
      { kw: ['hydro'], act: 'D35.11 Hydropower', conf: 0.86 },
      { kw: ['geothermal'], act: 'D35.11 Geothermal', conf: 0.91 },
      { kw: ['bioenergy', 'biomass'], act: 'D35.11 Bioenergy', conf: 0.72 },
      { kw: ['hydrogen', 'h2'], act: 'C20.13 Hydrogen', conf: 0.81 },
      { kw: ['electric vehicle', 'ev ', 'low-carbon vehicle'], act: 'C29.10 Low-C Vehicles', conf: 0.88 },
      { kw: ['rail'], act: 'H49.10 Rail Transport', conf: 0.92 },
      { kw: ['building', 'nzeb', 'epc'], act: 'F41.20 / L68.20 Buildings', conf: 0.79 },
      { kw: ['steel'], act: 'C24.10 Steel', conf: 0.64 },
      { kw: ['cement'], act: 'C23.51 Cement', conf: 0.58 },
      { kw: ['waste'], act: 'E38.11 Waste Collection', conf: 0.83 },
      { kw: ['water'], act: 'E36.00 / E37.00 Water', conf: 0.76 },
      { kw: ['dnsh', 'do no significant harm'], act: 'DNSH mention', conf: 0.97 },
      { kw: ['taxonomy'], act: 'Taxonomy reference', conf: 0.95 },
      { kw: ['capex'], act: 'CapEx disclosure', conf: 0.88 }
    ];
    patterns.forEach(p => {
      const hits = p.kw.filter(k => text.includes(k)).length;
      if (hits > 0) tags.push({ activity: p.act, hits, confidence: p.conf, terms: p.kw.filter(k => text.includes(k)).join(', ') });
    });
    return tags;
  }, [nlpText]);

  const issuerWaterfall = useMemo(() => {
    const base = 50;
    const steps = [
      { label: 'Base rate', val: base, cum: base },
      { label: 'NACE code', val: issuer.nace === 'D35.11' ? 18 : issuer.nace === 'H49.10' ? 14 : issuer.nace === 'C24.10' ? -12 : 4, cum: 0 },
      { label: 'Green CapEx', val: (issuer.capexGreen - 0.2) * 40, cum: 0 },
      { label: 'Emissions int.', val: issuer.emissions > 150 ? -14 : issuer.emissions > 80 ? -4 : 6, cum: 0 },
      { label: 'SBTi status', val: issuer.sbti === '1.5°C' ? 8 : issuer.sbti === 'WB2C' ? 5 : issuer.sbti === 'Committed' ? 2 : -3, cum: 0 },
      { label: 'NLP score', val: (hashStr(issuer.name) % 15) - 5, cum: 0 },
      { label: 'DNSH', val: issuer.dnshPass ? 6 : -10, cum: 0 },
      { label: 'MSS', val: issuer.mssPass ? 3 : -6, cum: 0 }
    ];
    let c = 0;
    steps.forEach(s => { c += s.val; s.cum = c; });
    return steps;
  }, [issuer]);

  const ensembleVote = useMemo(() => {
    const total = Object.values(ensembleWeights).reduce((a, b) => a + b, 0);
    const w = total > 0 ? total : 1;
    return filteredIssuers.slice(0, 15).map(iss => {
      const xgb = iss.aligned;
      const lgb = clamp(iss.aligned + (sr(hashStr(iss.id) + 1) - 0.5) * 0.08, 0, 1);
      const rf = clamp(iss.aligned + (sr(hashStr(iss.id) + 2) - 0.5) * 0.12, 0, 1);
      const nn = clamp(iss.aligned + (sr(hashStr(iss.id) + 3) - 0.5) * 0.1, 0, 1);
      const blended = (xgb * ensembleWeights.xgb + lgb * ensembleWeights.lgb + rf * ensembleWeights.rf + nn * ensembleWeights.nn) / w;
      return { issuer: iss.name.slice(0, 14), xgb: xgb * 100, lgb: lgb * 100, rf: rf * 100, nn: nn * 100, ensemble: blended * 100 };
    });
  }, [filteredIssuers, ensembleWeights]);

  const calibrationData = useMemo(() => {
    const bins = 10;
    return Array.from({ length: bins }, (_, i) => {
      const predLo = i / bins, predHi = (i + 1) / bins;
      const mid = (predLo + predHi) / 2;
      const actual = clamp(mid + (sr(i + 301) - 0.5) * 0.11, 0, 1);
      return { bin: `${(predLo * 100).toFixed(0)}-${(predHi * 100).toFixed(0)}`, predicted: mid * 100, actual: actual * 100, samples: 40 + Math.floor(sr(i + 302) * 200), ece: Math.abs(mid - actual) };
    });
  }, []);

  const rocData = useMemo(() => {
    return Array.from({ length: 21 }, (_, i) => {
      const thr = i / 20;
      const fpr = clamp(1 - Math.pow(thr, 1.2) + sr(i + 401) * 0.03, 0, 1);
      const tpr = clamp(1 - Math.pow(thr, 3.5) + sr(i + 402) * 0.02, 0, 1);
      return { threshold: thr.toFixed(2), fpr: fpr * 100, tpr: tpr * 100 };
    });
  }, []);

  const featImpByCategory = useMemo(() => {
    const map = {};
    FEATURES.forEach(f => { map[f.cat] = (map[f.cat] || 0) + f.imp; });
    return FEATURE_CATEGORIES.map(c => ({ category: c, importance: (map[c] || 0) * 100 }));
  }, []);

  const sortedFeatures = useMemo(() => [...FEATURES].sort((a, b) => b.imp - a.imp), []);

  const framework = useMemo(() => FRAMEWORKS, []);

  const dnshRadar = useMemo(() => {
    return DNSH_CRITERIA.map(c => {
      const score = 55 + ((hashStr(issuer.id + c.id) % 100) * 0.45);
      return { criterion: c.id, score, threshold: 70 };
    });
  }, [issuer]);

  const modelComparison = useMemo(() => MODELS.map(m => ({
    name: m.name.split(' ')[0],
    Accuracy: m.accuracy * 100,
    Precision: m.precision * 100,
    Recall: m.recall * 100,
    F1: m.f1 * 100,
    AUC: m.auc * 100
  })), []);

  const learningCurve = useMemo(() => Array.from({ length: 20 }, (_, i) => {
    const rows = (i + 1) * 9000;
    const train = 0.72 + (1 - Math.exp(-i * 0.28)) * 0.22;
    const valid = 0.68 + (1 - Math.exp(-i * 0.21)) * 0.22;
    return { rows, train: train * 100, valid: valid * 100 };
  }), []);

  const containerStyle = { minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.text, paddingBottom: 60 };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '18px 32px 0 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.mono, letterSpacing: 0.6, textTransform: 'uppercase' }}>
              <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>A² Platform</span> › Taxonomy &amp; Classification › <span style={{ color: T.navy, fontWeight: 600 }}>ML Classifier</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: T.navy, letterSpacing: -0.5 }}>Taxonomy ML Classifier</div>
              <Pill color={T.gold} bg="#faf4e6">EP-Q7</Pill>
              <Pill color={T.sage} bg="#ecf3ed">ML / AI</Pill>
              <Pill color={T.textSec}>Production</Pill>
            </div>
            <div style={{ fontSize: 12, color: T.textSec, fontFamily: T.mono, marginTop: 6 }}>
              // Probabilistic classification of corporate activities vs EU Taxonomy &amp; multi-framework alignment · XGBoost · RF · LightGBM · NLP
            </div>
          </div>
          <div style={{ textAlign: 'right', fontFamily: T.mono, fontSize: 11, color: T.textSec }}>
            <div>MODELS: <span style={{ color: T.navy, fontWeight: 600 }}>{MODELS.length}</span> · FEATURES: <span style={{ color: T.navy, fontWeight: 600 }}>{FEATURES.length}</span></div>
            <div>LAST RETRAIN: <span style={{ color: T.green, fontWeight: 600 }}>{model.retrained}</span></div>
            <div>ROWS TRAINED: <span style={{ color: T.navy, fontWeight: 600 }}>{fmtNum(model.rows)}</span></div>
            <div style={{ marginTop: 4 }}><Pill color={T.green} bg="#e8f5ec">● LIVE</Pill></div>
          </div>
        </div>
        <div style={{ height: 2, background: `linear-gradient(90deg, ${T.gold} 0%, ${T.goldL} 50%, transparent 100%)`, marginTop: 14 }} />
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 2, marginTop: 8, overflowX: 'auto' }}>
          {TAB_LABELS.map((t, idx) => (
            <div key={idx} onClick={() => setTab(idx)} style={{
              padding: '10px 14px', cursor: 'pointer', fontSize: 12, fontWeight: tab === idx ? 700 : 500,
              color: tab === idx ? T.navy : T.textSec, borderBottom: tab === idx ? `2px solid ${T.navy}` : '2px solid transparent',
              whiteSpace: 'nowrap', fontFamily: T.font, letterSpacing: -0.1, transition: 'all 0.15s'
            }}>{t}</div>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 32px' }}>
        {/* KPI Row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
          <KpiCard label="Portfolio Align" value={fmtPct(portfolioAlignment)} sub={`@ ${confThreshold}% conf · ${filteredIssuers.length} issuers`} accent={T.sage} mono />
          <KpiCard label="ML Confidence" value={fmtPct(avgConfidence, 1)} sub="avg across ensemble" accent={T.navy} mono />
          <KpiCard label="Models Trained" value={fmtNum(MODELS.length)} sub={`${MODELS.filter(m => m.status === 'Production').length} in production`} accent={T.gold} mono />
          <KpiCard label="NLP Docs" value={fmtNum(NLP_DOCUMENTS.length)} sub={`${fmtNum(NLP_DOCUMENTS.reduce((a, b) => a + b.tokens, 0))} tokens parsed`} accent={T.navyL} mono />
          <KpiCard label="DNSH Pass" value={fmtPct(dnshPassRate)} sub={`${filteredIssuers.filter(i => i.dnshPass).length}/${filteredIssuers.length} issuers`} accent={T.sage} mono />
          <KpiCard label="Feature Count" value={fmtNum(FEATURES.length)} sub={`${FEATURE_CATEGORIES.length} categories`} accent={T.text} mono />
        </div>

        {/* Tab content */}
        {tab === 0 && (
          <OverviewTab modelComparison={modelComparison} framework={framework} sortedFeatures={sortedFeatures} filteredIssuers={filteredIssuers} sectorFilter={sectorFilter} setSectorFilter={setSectorFilter} sectors={sectors} portfolioAlignment={portfolioAlignment} featImpByCategory={featImpByCategory} />
        )}
        {tab === 1 && (
          <TrainingTab modelId={modelId} setModelId={setModelId} model={model} learningCurve={learningCurve} modelComparison={modelComparison} rocData={rocData} />
        )}
        {tab === 2 && (
          <FeatureEngTab sortedFeatures={sortedFeatures} featImpByCategory={featImpByCategory} />
        )}
        {tab === 3 && (
          <NlpTab nlpText={nlpText} setNlpText={setNlpText} nlpExtract={nlpExtract} />
        )}
        {tab === 4 && (
          <TscTab />
        )}
        {tab === 5 && (
          <DnshTab dnshCrit={dnshCrit} setDnshCrit={setDnshCrit} dnshRadar={dnshRadar} issuer={issuer} issuerId={issuerId} setIssuerId={setIssuerId} />
        )}
        {tab === 6 && (
          <CalibrationTab calibMode={calibMode} setCalibMode={setCalibMode} calibrationData={calibrationData} rocData={rocData} />
        )}
        {tab === 7 && (
          <FeatImpTab sortedFeatures={sortedFeatures} model={model} modelId={modelId} setModelId={setModelId} />
        )}
        {tab === 8 && (
          <EnsembleTab ensembleWeights={ensembleWeights} setEnsembleWeights={setEnsembleWeights} ensembleVote={ensembleVote} />
        )}
        {tab === 9 && (
          <AutoTagTab />
        )}
        {tab === 10 && (
          <BatchTab filteredIssuers={filteredIssuers} confThreshold={confThreshold} setConfThreshold={setConfThreshold} sectorFilter={sectorFilter} setSectorFilter={setSectorFilter} sectors={sectors} issuerId={issuerId} setIssuerId={setIssuerId} issuer={issuer} issuerWaterfall={issuerWaterfall} />
        )}
        {tab === 11 && (
          <DriftTab driftFeature={driftFeature} setDriftFeature={setDriftFeature} />
        )}
        {tab === 12 && (
          <ReviewTab />
        )}
        {tab === 13 && (
          <GovernanceTab />
        )}
        {tab === 14 && (
          <ConfusionMatrixTab />
        )}
        {tab === 15 && (
          <RocPrLiftTab />
        )}
        {tab === 16 && (
          <PermImpPdpTab />
        )}
        {tab === 17 && (
          <ProbCalibTab />
        )}
        {tab === 18 && (
          <ConceptDriftTab />
        )}
        {tab === 19 && (
          <AbTestingTab />
        )}
      </div>

      {/* Footer status bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: T.navy, color: '#fff', padding: '6px 32px', fontFamily: T.mono, fontSize: 10.5, display: 'flex', justifyContent: 'space-between', letterSpacing: 0.5, borderTop: `1px solid ${T.gold}` }}>
        <div>EP-Q7 · TAXONOMY-ML · MODEL={model.name} · AUC={(model.auc * 100).toFixed(1)}% · STATUS=<span style={{ color: T.goldL, fontWeight: 700 }}>OPERATIONAL</span></div>
        <div>ROWS={fmtNum(model.rows)} · FEATURES={FEATURES.length} · ISSUERS={filteredIssuers.length} · DRIFT=<span style={{ color: '#9be7a0' }}>GREEN</span></div>
        <div>SESSION · CONF_MIN={confThreshold}% · ALIGN={portfolioAlignment.toFixed(1)}% · DNSH={dnshPassRate.toFixed(0)}%</div>
      </div>
    </div>
  );
}

function NlpTab({ nlpText, setNlpText, nlpExtract }) {
  const docTypes = useMemo(() => {
    const map = {};
    NLP_DOCUMENTS.forEach(d => { map[d.type] = (map[d.type] || 0) + 1; });
    return Object.entries(map).map(([k, v]) => ({ name: k, value: v }));
  }, []);
  const colorList = [T.navy, T.gold, T.sage, T.navyL, T.goldL, T.sageL, T.red, T.amber];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <SectionHeader title="NLP Disclosure Classifier" subtitle="// paste text from CSRD / 10-K / Sustainability Report — extract EU-Taxonomy tags in real time" />
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10.5, color: T.textSec, fontFamily: T.mono, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>INPUT · Disclosure excerpt</div>
            <textarea value={nlpText} onChange={e => setNlpText(e.target.value)} style={{ width: '100%', minHeight: 180, padding: 12, fontFamily: T.mono, fontSize: 11.5, color: T.text, background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 4, resize: 'vertical', lineHeight: 1.5 }} />
            <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono, marginTop: 4 }}>{nlpText.length} chars · {nlpText.split(/\s+/).filter(w => w).length} tokens · extraction updates on each keystroke</div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: T.textSec, fontFamily: T.mono, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>EXTRACTED TAGS · {nlpExtract.length} matches</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
              {nlpExtract.length === 0 && <div style={{ padding: 12, color: T.textMut, fontFamily: T.mono, fontSize: 11, background: T.surfaceH, borderRadius: 4 }}>No taxonomy activity tags detected — try keywords: wind, solar, rail, hydrogen, DNSH, CapEx, building, steel, waste, water, taxonomy.</div>}
              {nlpExtract.map((t, i) => (
                <div key={i} style={{ padding: 9, background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, color: T.navy, fontFamily: T.mono }}>{t.activity}</div>
                    <Pill color={t.confidence > 0.85 ? T.green : t.confidence > 0.7 ? T.amber : T.red} bg={T.surface}>CONF {(t.confidence * 100).toFixed(0)}%</Pill>
                  </div>
                  <div style={{ fontSize: 10, color: T.textSec, fontFamily: T.mono, marginTop: 3 }}>Hits: {t.hits} · Terms: {t.terms}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <Card>
          <SectionHeader title="Document Corpus" subtitle={`// ${NLP_DOCUMENTS.length} parsed disclosures · ${fmtNum(NLP_DOCUMENTS.reduce((a, b) => a + b.tokens, 0))} tokens`} />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 10.5 }}>
            <thead>
              <tr style={{ background: T.surfaceH, borderBottom: `1px solid ${T.border}` }}>
                {['ID', 'Document', 'Type', 'Pages', 'Tokens', 'Tags', 'Confidence', 'Greenwash', 'Date'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NLP_DOCUMENTS.map((d, i) => (
                <tr key={d.id} style={{ background: i % 2 ? T.surfaceH : T.surface, borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 10px', color: T.navy, fontWeight: 700 }}>{d.id}</td>
                  <td style={{ padding: '6px 10px', fontWeight: 600 }}>{d.name}</td>
                  <td style={{ padding: '6px 10px' }}><Pill color={T.navy} bg={T.surfaceH}>{d.type}</Pill></td>
                  <td style={{ padding: '6px 10px' }}>{d.pages}</td>
                  <td style={{ padding: '6px 10px' }}>{fmtNum(d.tokens)}</td>
                  <td style={{ padding: '6px 10px', color: T.gold, fontWeight: 700 }}>{d.tagsFound}</td>
                  <td style={{ padding: '6px 10px', color: d.confidence > 0.85 ? T.green : d.confidence > 0.7 ? T.amber : T.red }}>{(d.confidence * 100).toFixed(0)}%</td>
                  <td style={{ padding: '6px 10px', color: d.greenwashFlags > 2 ? T.red : d.greenwashFlags > 0 ? T.amber : T.green, fontWeight: 600 }}>{d.greenwashFlags}</td>
                  <td style={{ padding: '6px 10px', color: T.textSec }}>{d.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <SectionHeader title="Corpus by Document Type" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={docTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={78} label={{ fontSize: 10 }}>
                {docTypes.map((_, i) => <Cell key={i} fill={colorList[i % colorList.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 10.5, color: T.textSec, fontFamily: T.mono, marginTop: 8 }}>Sentence-BERT embeddings · cosine-sim to NACE activity descriptions · top-5 match returned per chunk.</div>
        </Card>
      </div>
    </div>
  );
}

function TscTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <SectionHeader title="Technical Screening Criteria — Probabilistic Validation" subtitle="// P(aligned | activity) · mean + std across 184,320 training samples" />
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={TSC_THRESHOLDS}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
            <XAxis dataKey="activity" tick={{ fontSize: 9, fill: T.textSec, angle: -20, textAnchor: 'end' }} height={80} interval={0} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 1]} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} />
            <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar yAxisId="left" dataKey="mean" fill={T.navy} name="P(aligned) mean" />
            <Line yAxisId="left" type="monotone" dataKey="p_aligned" stroke={T.gold} strokeWidth={2} name="Ensemble P" dot={{ r: 3 }} />
            <Bar yAxisId="right" dataKey="samples" fill={T.goldL} opacity={0.4} name="N samples" />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <SectionHeader title="TSC Alignment Matrix" subtitle="// per-activity probabilistic scoring with standard deviation confidence bands" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.surfaceH, borderBottom: `1px solid ${T.border}` }}>
              {['NACE', 'Activity', 'Objective', 'Threshold', 'P(aligned)', 'σ', 'P(partial)', 'P(non)', 'N', 'Verdict'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NACE_ACTIVITIES.map((a, i) => {
              const std = 0.04 + sr(i + 201) * 0.08;
              const partial = clamp(0.15 + sr(i + 203) * 0.15, 0, 1);
              const non = clamp(1 - a.prob - partial, 0, 1);
              const n = 120 + Math.floor(sr(i + 205) * 280);
              const verdict = a.prob > 0.85 ? 'Aligned' : a.prob > 0.6 ? 'Partial' : 'Non-Aligned';
              return (
                <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface, borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 10px', color: T.navy, fontWeight: 700 }}>{a.code}</td>
                  <td style={{ padding: '6px 10px', fontWeight: 600, fontFamily: T.font }}>{a.name}</td>
                  <td style={{ padding: '6px 10px' }}><Pill color={T.gold} bg="#faf4e6">{a.obj}</Pill></td>
                  <td style={{ padding: '6px 10px', color: T.textSec, fontSize: 10, fontFamily: T.font }}>{a.threshold}</td>
                  <td style={{ padding: '6px 10px', color: T.green, fontWeight: 700 }}>{(a.prob * 100).toFixed(1)}%</td>
                  <td style={{ padding: '6px 10px', color: T.textSec }}>±{(std * 100).toFixed(1)}</td>
                  <td style={{ padding: '6px 10px' }}>{(partial * 100).toFixed(1)}%</td>
                  <td style={{ padding: '6px 10px', color: T.red }}>{(non * 100).toFixed(1)}%</td>
                  <td style={{ padding: '6px 10px' }}>{n}</td>
                  <td style={{ padding: '6px 10px' }}><StatusPill status={verdict} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function DnshTab({ dnshCrit, setDnshCrit, dnshRadar, issuer, issuerId, setIssuerId }) {
  const selCrit = DNSH_CRITERIA.find(c => c.id === dnshCrit) || DNSH_CRITERIA[0];
  const passRates = useMemo(() => DNSH_CRITERIA.map(c => {
    const score = 60 + (hashStr(c.id) % 30);
    return { criterion: c.id, full: c.name, passRate: score, failRate: 100 - score };
  }), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <SectionHeader title="Do No Significant Harm — Probabilistic Validation" subtitle={`// issuer: ${issuer.name} · NACE ${issuer.nace} · ${issuer.sector}`}
          right={
            <select value={issuerId} onChange={e => setIssuerId(e.target.value)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: '6px 10px', fontFamily: T.mono, fontSize: 11, color: T.text }}>
              {ISSUERS.map(i => <option key={i.id} value={i.id}>{i.id} · {i.name}</option>)}
            </select>
          } />
        <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
          {DNSH_CRITERIA.map(c => (
            <div key={c.id} onClick={() => setDnshCrit(c.id)} style={{
              padding: '6px 12px', fontSize: 11, fontFamily: T.mono, cursor: 'pointer', fontWeight: dnshCrit === c.id ? 700 : 500,
              background: dnshCrit === c.id ? T.navy : T.surface, color: dnshCrit === c.id ? '#fff' : T.textSec,
              border: `1px solid ${dnshCrit === c.id ? T.navy : T.border}`, borderRadius: 3
            }}>{c.id} · {c.name}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 10.5, color: T.textSec, fontFamily: T.mono, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>DNSH Radar · {issuer.name}</div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={dnshRadar}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 11, fill: T.navy, fontWeight: 600 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: T.textMut }} />
                <Radar dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.25} name="Score" />
                <Radar dataKey="threshold" stroke={T.red} fill={T.red} fillOpacity={0.1} name="Threshold" strokeDasharray="4 4" />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: T.textSec, fontFamily: T.mono, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{selCrit.id} · {selCrit.name} checks</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selCrit.checks.map((chk, i) => {
                const score = 55 + ((hashStr(issuer.id + selCrit.id + i) % 100) * 0.45);
                return (
                  <div key={i} style={{ padding: 10, background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: T.text }}>{chk}</div>
                      <Pill color={score > 70 ? T.green : score > 50 ? T.amber : T.red} bg={T.surface}>{score.toFixed(0)}%</Pill>
                    </div>
                    <div style={{ height: 8, background: T.surface, borderRadius: 3, marginTop: 6, border: `1px solid ${T.border}` }}>
                      <div style={{ width: `${score}%`, height: '100%', background: score > 70 ? T.sage : score > 50 ? T.gold : T.red, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono, marginTop: 4 }}>ML confidence interval: {(score - 8).toFixed(0)}% — {(score + 6).toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Portfolio-wide DNSH Pass Rates" subtitle="// aggregated across 40 issuers" />
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={passRates}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
            <XAxis dataKey="criterion" tick={{ fontSize: 11, fill: T.navy, fontWeight: 600 }} />
            <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="%" />
            <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="passRate" stackId="a" fill={T.sage} name="Pass %" />
            <Bar dataKey="failRate" stackId="a" fill={T.red} name="Fail %" opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function CalibrationTab({ calibMode, setCalibMode, calibrationData, rocData }) {
  const ece = useMemo(() => calibrationData.reduce((a, b) => a + b.ece * b.samples, 0) / Math.max(1, calibrationData.reduce((a, b) => a + b.samples, 0)), [calibrationData]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <SectionHeader title="Model Calibration" subtitle={`// Expected Calibration Error (ECE) = ${(ece * 100).toFixed(2)}% · reliability diagram across 10 bins`}
          right={
            <div style={{ display: 'flex', gap: 4 }}>
              {['reliability', 'roc', 'distribution'].map(m => (
                <div key={m} onClick={() => setCalibMode(m)} style={{
                  padding: '5px 10px', fontSize: 10.5, fontFamily: T.mono, cursor: 'pointer', fontWeight: calibMode === m ? 700 : 500,
                  background: calibMode === m ? T.navy : T.surface, color: calibMode === m ? '#fff' : T.textSec,
                  border: `1px solid ${calibMode === m ? T.navy : T.border}`, borderRadius: 3, textTransform: 'uppercase'
                }}>{m}</div>
              ))}
            </div>
          } />
        {calibMode === 'reliability' && (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={calibrationData}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="bin" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 100]} unit="%" />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="predicted" stroke={T.navy} fill={T.navy} fillOpacity={0.15} name="Predicted" />
              <Line type="monotone" dataKey="actual" stroke={T.gold} strokeWidth={2} name="Actual" dot={{ r: 4 }} />
              <Bar dataKey="samples" fill={T.sageL} opacity={0.4} name="Samples" yAxisId="right" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
        {calibMode === 'roc' && (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={rocData}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="fpr" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
              <Area type="monotone" dataKey="tpr" stroke={T.navy} fill={T.navy} fillOpacity={0.25} />
            </AreaChart>
          </ResponsiveContainer>
        )}
        {calibMode === 'distribution' && (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={calibrationData}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="bin" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
              <Bar dataKey="samples" fill={T.gold} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card>
        <SectionHeader title="Calibration Bin Details" subtitle="// 10-bin reliability table · platt-scaled probabilities" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.surfaceH, borderBottom: `1px solid ${T.border}` }}>
              {['Bin', 'Predicted %', 'Actual %', 'Delta', 'Samples', 'ECE contrib', 'Calibration'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calibrationData.map((d, i) => (
              <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 10px', color: T.navy, fontWeight: 700 }}>{d.bin}</td>
                <td style={{ padding: '7px 10px' }}>{d.predicted.toFixed(1)}</td>
                <td style={{ padding: '7px 10px' }}>{d.actual.toFixed(1)}</td>
                <td style={{ padding: '7px 10px', color: Math.abs(d.predicted - d.actual) > 5 ? T.red : T.green, fontWeight: 600 }}>{(d.actual - d.predicted).toFixed(1)}</td>
                <td style={{ padding: '7px 10px' }}>{d.samples}</td>
                <td style={{ padding: '7px 10px', color: T.gold }}>{(d.ece * 100).toFixed(2)}</td>
                <td style={{ padding: '7px 10px' }}><StatusPill status={d.ece < 0.04 ? 'Aligned' : d.ece < 0.08 ? 'Partial' : 'Review'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function FeatImpTab({ sortedFeatures, model, modelId, setModelId }) {
  const top20 = useMemo(() => sortedFeatures.slice(0, 20), [sortedFeatures]);
  const cumulative = useMemo(() => {
    let c = 0;
    const total = sortedFeatures.reduce((a, b) => a + b.imp, 0);
    return sortedFeatures.map(f => { c += f.imp; return { name: f.name.slice(0, 20), cum: (c / Math.max(0.001, total)) * 100, imp: f.imp * 100 }; });
  }, [sortedFeatures]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <SectionHeader title="SHAP Feature Importance" subtitle={`// ${model.name} · ${sortedFeatures.length} features ranked by mean |SHAP|`}
          right={
            <div style={{ display: 'flex', gap: 4 }}>
              {MODELS.slice(0, 4).map(m => (
                <div key={m.id} onClick={() => setModelId(m.id)} style={{
                  padding: '5px 10px', fontSize: 10.5, fontFamily: T.mono, cursor: 'pointer', fontWeight: modelId === m.id ? 700 : 500,
                  background: modelId === m.id ? T.navy : T.surface, color: modelId === m.id ? '#fff' : T.textSec,
                  border: `1px solid ${modelId === m.id ? T.navy : T.border}`, borderRadius: 3
                }}>{m.id.toUpperCase()}</div>
              ))}
            </div>
          } />
        <ResponsiveContainer width="100%" height={520}>
          <BarChart data={top20} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: T.navy, fontWeight: 600 }} width={190} />
            <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
            <Bar dataKey="imp" fill={T.gold} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionHeader title="Cumulative Importance Curve" subtitle="// Pareto · top 8 features = ~55% total gain" />
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={cumulative}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 8, fill: T.textSec, angle: -35, textAnchor: 'end' }} height={60} interval={1} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="imp" fill={T.gold} name="SHAP %" />
              <Line type="monotone" dataKey="cum" stroke={T.navy} strokeWidth={2} name="Cumulative %" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionHeader title="Category-Level Contribution" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FEATURE_CATEGORIES.map(c => {
              const feats = sortedFeatures.filter(f => f.cat === c);
              const total = feats.reduce((a, b) => a + b.imp, 0);
              return (
                <div key={c} style={{ padding: 10, background: T.surfaceH, borderRadius: 4, border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{c}</div>
                    <div style={{ fontSize: 11, fontFamily: T.mono, color: T.gold, fontWeight: 700 }}>{(total * 100).toFixed(1)}%</div>
                  </div>
                  <div style={{ fontSize: 10, color: T.textSec, fontFamily: T.mono }}>{feats.length} features · top: {feats[0]?.name || '-'}</div>
                  <div style={{ height: 6, background: T.surface, marginTop: 6, borderRadius: 3, border: `1px solid ${T.border}` }}>
                    <div style={{ width: `${total * 300}%`, maxWidth: '100%', height: '100%', background: T.gold, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function EnsembleTab({ ensembleWeights, setEnsembleWeights, ensembleVote }) {
  const total = Object.values(ensembleWeights).reduce((a, b) => a + b, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <SectionHeader title="Ensemble Weight Configuration" subtitle={`// weighted voting · total weight = ${total} (auto-normalized)`} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[['xgb', 'XGBoost'], ['lgb', 'LightGBM'], ['rf', 'Random Forest'], ['nn', 'Neural Net']].map(([k, name]) => (
            <div key={k} style={{ padding: 12, background: T.surfaceH, borderRadius: 4, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{name}</div>
              <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.mono, marginBottom: 6 }}>Weight: <span style={{ color: T.gold, fontWeight: 700 }}>{ensembleWeights[k]}%</span> · Normalized: {((ensembleWeights[k] / Math.max(1, total)) * 100).toFixed(1)}%</div>
              <input type="range" min={0} max={100} value={ensembleWeights[k]} onChange={e => setEnsembleWeights({ ...ensembleWeights, [k]: parseInt(e.target.value) })} style={{ width: '100%', accentColor: T.gold }} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeader title="Ensemble Voting Matrix" subtitle="// individual model scores and blended ensemble vote per issuer" />
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={ensembleVote}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
            <XAxis dataKey="issuer" tick={{ fontSize: 9, fill: T.textSec, angle: -30, textAnchor: 'end' }} height={70} interval={0} />
            <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="%" />
            <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="xgb" fill={T.navy} name="XGBoost" />
            <Bar dataKey="lgb" fill={T.navyL} name="LightGBM" />
            <Bar dataKey="rf" fill={T.gold} name="Random Forest" />
            <Bar dataKey="nn" fill={T.sageL} name="Neural Net" />
            <Line type="monotone" dataKey="ensemble" stroke={T.red} strokeWidth={2} name="Ensemble" dot={{ r: 3 }} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <SectionHeader title="Ensemble Decision Table" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.surfaceH, borderBottom: `1px solid ${T.border}` }}>
              {['Issuer', 'XGB', 'LGB', 'RF', 'NN', 'Ensemble', 'Disagreement σ', 'Decision'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ensembleVote.map((e, i) => {
              const vals = [e.xgb, e.lgb, e.rf, e.nn];
              const mean = vals.reduce((a, b) => a + b, 0) / 4;
              const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 4;
              const sd = Math.sqrt(variance);
              const decision = e.ensemble > 70 ? 'Aligned' : e.ensemble > 40 ? 'Partial' : 'Non-Aligned';
              return (
                <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface, borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 10px', fontWeight: 600 }}>{e.issuer}</td>
                  <td style={{ padding: '6px 10px' }}>{e.xgb.toFixed(1)}</td>
                  <td style={{ padding: '6px 10px' }}>{e.lgb.toFixed(1)}</td>
                  <td style={{ padding: '6px 10px' }}>{e.rf.toFixed(1)}</td>
                  <td style={{ padding: '6px 10px' }}>{e.nn.toFixed(1)}</td>
                  <td style={{ padding: '6px 10px', color: T.gold, fontWeight: 700 }}>{e.ensemble.toFixed(1)}</td>
                  <td style={{ padding: '6px 10px', color: sd > 6 ? T.red : sd > 3 ? T.amber : T.green }}>{sd.toFixed(2)}</td>
                  <td style={{ padding: '6px 10px' }}><StatusPill status={decision} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function AutoTagTab() {
  const [selectedAct, setSelectedAct] = useState(NACE_ACTIVITIES[0].name);
  const sel = NACE_ACTIVITIES.find(a => a.name === selectedAct) || NACE_ACTIVITIES[0];
  const matchIssuers = useMemo(() => ISSUERS.filter(i => i.nace === sel.code).slice(0, 8), [sel]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <SectionHeader title="Activity Auto-Tagging Engine" subtitle="// select an EU-Taxonomy activity · ML routes matching portfolio issuers" />
        <select value={selectedAct} onChange={e => setSelectedAct(e.target.value)} style={{ width: 480, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: '8px 12px', fontFamily: T.mono, fontSize: 12, color: T.text, marginBottom: 12 }}>
          {NACE_ACTIVITIES.map((a, i) => <option key={i} value={a.name}>{a.code} · {a.name}</option>)}
        </select>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <KpiCard label="NACE Code" value={sel.code} sub={sel.obj} accent={T.navy} mono />
          <KpiCard label="Base P(aligned)" value={fmtPct(sel.prob * 100)} sub="from TSC training" accent={T.sage} mono />
          <KpiCard label="Matched Issuers" value={fmtNum(matchIssuers.length)} sub="in portfolio" accent={T.gold} mono />
        </div>
        <div style={{ marginTop: 14, padding: 12, background: T.surfaceH, borderRadius: 4, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Threshold requirement</div>
          <div style={{ fontSize: 12.5, color: T.text }}>{sel.threshold}</div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Matched Issuers" subtitle={`// ML tagged ${matchIssuers.length} portfolio companies to ${sel.code}`} />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.surfaceH, borderBottom: `1px solid ${T.border}` }}>
              {['ID', 'Issuer', 'Sector', 'Region', 'Revenue (€M)', 'Emissions', 'Alignment', 'Confidence', 'Status'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matchIssuers.map((iss, i) => (
              <tr key={iss.id} style={{ background: i % 2 ? T.surfaceH : T.surface, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '6px 10px', color: T.navy, fontWeight: 700 }}>{iss.id}</td>
                <td style={{ padding: '6px 10px', fontWeight: 600 }}>{iss.name}</td>
                <td style={{ padding: '6px 10px' }}>{iss.sector}</td>
                <td style={{ padding: '6px 10px', color: T.textSec }}>{iss.region}</td>
                <td style={{ padding: '6px 10px' }}>{fmtNum(iss.revenue)}</td>
                <td style={{ padding: '6px 10px' }}>{iss.emissions.toFixed(0)} t/€M</td>
                <td style={{ padding: '6px 10px', color: iss.aligned > 0.7 ? T.green : iss.aligned > 0.4 ? T.amber : T.red, fontWeight: 700 }}>{(iss.aligned * 100).toFixed(1)}%</td>
                <td style={{ padding: '6px 10px' }}>{(iss.confidence * 100).toFixed(0)}%</td>
                <td style={{ padding: '6px 10px' }}><StatusPill status={iss.aligned > 0.7 ? 'Aligned' : iss.aligned > 0.4 ? 'Partial' : 'Non-Aligned'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <SectionHeader title="Auto-Tag Runs (Last 14 days)" subtitle="// batch pipeline telemetry" />
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={Array.from({ length: 14 }, (_, i) => ({ day: `D${i + 1}`, runs: 80 + Math.floor(sr(i + 601) * 120), tags: 2400 + Math.floor(sr(i + 602) * 1800), errors: Math.floor(sr(i + 603) * 14) }))}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: T.textSec }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} />
            <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line yAxisId="left" type="monotone" dataKey="runs" stroke={T.navy} strokeWidth={2} name="Runs" />
            <Line yAxisId="right" type="monotone" dataKey="tags" stroke={T.gold} strokeWidth={2} name="Tags" />
            <Line yAxisId="left" type="monotone" dataKey="errors" stroke={T.red} strokeWidth={2} name="Errors" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function BatchTab({ filteredIssuers, confThreshold, setConfThreshold, sectorFilter, setSectorFilter, sectors, issuerId, setIssuerId, issuer, issuerWaterfall }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <SectionHeader title="Portfolio Batch Scoring" subtitle={`// ${filteredIssuers.length} issuers · ${confThreshold}% confidence floor`}
          right={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: '6px 10px', fontFamily: T.mono, fontSize: 11 }}>
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div style={{ fontSize: 11, fontFamily: T.mono, color: T.textSec }}>CONF ≥ {confThreshold}%</div>
              <input type="range" min={0} max={100} value={confThreshold} onChange={e => setConfThreshold(parseInt(e.target.value))} style={{ width: 160, accentColor: T.gold }} />
            </div>
          } />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 10.5 }}>
            <thead>
              <tr style={{ background: T.surfaceH, borderBottom: `1px solid ${T.border}` }}>
                {['ID', 'Issuer', 'Sector', 'NACE', 'Region', 'Rev(€M)', 'Emis', 'CapEx Grn', 'SBTi', 'Align', 'Conf', 'TSC', 'DNSH', 'MSS', 'Verdict'].map(h => (
                  <th key={h} style={{ padding: '8px 8px', textAlign: 'left', color: T.textSec, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredIssuers.slice(0, 25).map((iss, i) => {
                const meetsThresh = iss.confidence * 100 >= confThreshold;
                const verdict = !meetsThresh ? 'Review' : iss.aligned > 0.7 ? 'Aligned' : iss.aligned > 0.4 ? 'Partial' : 'Non-Aligned';
                return (
                  <tr key={iss.id} onClick={() => setIssuerId(iss.id)} style={{ background: iss.id === issuerId ? '#fdf4e3' : i % 2 ? T.surfaceH : T.surface, borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }}>
                    <td style={{ padding: '5px 8px', color: T.navy, fontWeight: 700 }}>{iss.id}</td>
                    <td style={{ padding: '5px 8px', fontWeight: 600 }}>{iss.name}</td>
                    <td style={{ padding: '5px 8px' }}>{iss.sector}</td>
                    <td style={{ padding: '5px 8px', color: T.textSec }}>{iss.nace}</td>
                    <td style={{ padding: '5px 8px' }}>{iss.region}</td>
                    <td style={{ padding: '5px 8px' }}>{fmtNum(iss.revenue)}</td>
                    <td style={{ padding: '5px 8px' }}>{iss.emissions.toFixed(0)}</td>
                    <td style={{ padding: '5px 8px' }}>{(iss.capexGreen * 100).toFixed(0)}%</td>
                    <td style={{ padding: '5px 8px' }}>{iss.sbti}</td>
                    <td style={{ padding: '5px 8px', color: iss.aligned > 0.7 ? T.green : iss.aligned > 0.4 ? T.amber : T.red, fontWeight: 700 }}>{(iss.aligned * 100).toFixed(0)}%</td>
                    <td style={{ padding: '5px 8px' }}>{(iss.confidence * 100).toFixed(0)}%</td>
                    <td style={{ padding: '5px 8px' }}>{iss.tscPass ? <span style={{ color: T.green }}>✓</span> : <span style={{ color: T.red }}>✗</span>}</td>
                    <td style={{ padding: '5px 8px' }}>{iss.dnshPass ? <span style={{ color: T.green }}>✓</span> : <span style={{ color: T.red }}>✗</span>}</td>
                    <td style={{ padding: '5px 8px' }}>{iss.mssPass ? <span style={{ color: T.green }}>✓</span> : <span style={{ color: T.red }}>✗</span>}</td>
                    <td style={{ padding: '5px 8px' }}><StatusPill status={verdict} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <SectionHeader title={`Issuer Waterfall — ${issuer.name}`} subtitle="// SHAP-style contribution breakdown · base rate + feature impacts" />
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={issuerWaterfall}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
            <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="val" name="Contribution">
              {issuerWaterfall.map((d, i) => (
                <Cell key={i} fill={d.val > 0 ? T.sage : d.val < 0 ? T.red : T.navy} />
              ))}
            </Bar>
            <Line type="stepAfter" dataKey="cum" stroke={T.gold} strokeWidth={2} name="Cumulative" dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function DriftTab({ driftFeature, setDriftFeature }) {
  const features = [{ k: 'psi_rev', n: 'Revenue' }, { k: 'psi_emis', n: 'Emissions' }, { k: 'psi_nlp', n: 'NLP' }, { k: 'psi_nace', n: 'NACE' }];
  const current = DRIFT_METRICS[DRIFT_METRICS.length - 1][driftFeature];
  const alert = current > 0.15 ? 'High drift' : current > 0.1 ? 'Moderate' : 'Stable';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <SectionHeader title="Population Stability Index (PSI) — 24-month Monitoring" subtitle={`// current ${driftFeature}: ${current.toFixed(3)} · ${alert}`}
          right={
            <div style={{ display: 'flex', gap: 4 }}>
              {features.map(f => (
                <div key={f.k} onClick={() => setDriftFeature(f.k)} style={{
                  padding: '5px 10px', fontSize: 10.5, fontFamily: T.mono, cursor: 'pointer', fontWeight: driftFeature === f.k ? 700 : 500,
                  background: driftFeature === f.k ? T.navy : T.surface, color: driftFeature === f.k ? '#fff' : T.textSec,
                  border: `1px solid ${driftFeature === f.k ? T.navy : T.border}`, borderRadius: 3
                }}>{f.n}</div>
              ))}
            </div>
          } />
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={DRIFT_METRICS}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
            <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Area type="monotone" dataKey={driftFeature} stroke={T.navy} fill={T.navy} fillOpacity={0.2} name={`PSI ${driftFeature}`} />
            <Line type="monotone" dataKey="ks_stat" stroke={T.gold} strokeWidth={2} name="KS statistic" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 11, fontFamily: T.mono, color: T.textSec, flexWrap: 'wrap' }}>
          <div><span style={{ color: T.green, fontWeight: 700 }}>●</span> PSI &lt; 0.10 = stable</div>
          <div><span style={{ color: T.amber, fontWeight: 700 }}>●</span> 0.10–0.25 = moderate drift</div>
          <div><span style={{ color: T.red, fontWeight: 700 }}>●</span> PSI &gt; 0.25 = significant drift (retrain)</div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="All Feature Drift Streams" subtitle="// side-by-side — 24 months · KS + PSI" />
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={DRIFT_METRICS}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
            <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="psi_rev" stroke={T.navy} strokeWidth={2} name="Revenue" dot={false} />
            <Line type="monotone" dataKey="psi_emis" stroke={T.gold} strokeWidth={2} name="Emissions" dot={false} />
            <Line type="monotone" dataKey="psi_nlp" stroke={T.sage} strokeWidth={2} name="NLP" dot={false} />
            <Line type="monotone" dataKey="psi_nace" stroke={T.red} strokeWidth={2} name="NACE" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <SectionHeader title="Drift Alert Queue" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.surfaceH, borderBottom: `1px solid ${T.border}` }}>
              {['Feature', 'Current PSI', 'Baseline', 'Delta', 'Trend (3m)', 'Threshold', 'Action'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((f, i) => {
              const cur = DRIFT_METRICS[DRIFT_METRICS.length - 1][f.k];
              const base = DRIFT_METRICS[0][f.k];
              const delta = cur - base;
              const action = cur > 0.25 ? 'Retrain' : cur > 0.1 ? 'Monitor' : 'None';
              return (
                <tr key={f.k} style={{ background: i % 2 ? T.surfaceH : T.surface, borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '7px 10px', fontWeight: 700, color: T.navy }}>{f.n}</td>
                  <td style={{ padding: '7px 10px', color: cur > 0.25 ? T.red : cur > 0.1 ? T.amber : T.green, fontWeight: 700 }}>{cur.toFixed(3)}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{base.toFixed(3)}</td>
                  <td style={{ padding: '7px 10px' }}>{(delta * 100).toFixed(1)}%</td>
                  <td style={{ padding: '7px 10px' }}>{delta > 0 ? '▲' : '▼'}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>0.25</td>
                  <td style={{ padding: '7px 10px' }}><StatusPill status={action === 'Retrain' ? 'High' : action === 'Monitor' ? 'Medium' : 'Low'} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ReviewTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <SectionHeader title="Human-in-the-Loop Review Queue" subtitle={`// ${REVIEW_QUEUE.length} pending ML classifications · awaiting analyst sign-off`} />
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <KpiCard label="High Priority" value={fmtNum(REVIEW_QUEUE.filter(r => r.priority === 'High').length)} accent={T.red} mono />
          <KpiCard label="Medium" value={fmtNum(REVIEW_QUEUE.filter(r => r.priority === 'Medium').length)} accent={T.amber} mono />
          <KpiCard label="Low" value={fmtNum(REVIEW_QUEUE.filter(r => r.priority === 'Low').length)} accent={T.green} mono />
          <KpiCard label="Avg Wait" value={`${(REVIEW_QUEUE.reduce((a, b) => a + b.waiting, 0) / Math.max(1, REVIEW_QUEUE.length)).toFixed(1)}d`} accent={T.navy} mono />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.surfaceH, borderBottom: `1px solid ${T.border}` }}>
              {['ID', 'Issuer', 'Activity', 'ML Score', 'Confidence', 'Reason', 'Flagged By', 'Waiting', 'Priority', 'Action'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REVIEW_QUEUE.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 ? T.surfaceH : T.surface, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '6px 10px', color: T.navy, fontWeight: 700 }}>{r.id}</td>
                <td style={{ padding: '6px 10px', fontWeight: 600 }}>{r.issuer}</td>
                <td style={{ padding: '6px 10px' }}>{r.activity}</td>
                <td style={{ padding: '6px 10px', color: T.gold, fontWeight: 700 }}>{(r.mlScore * 100).toFixed(1)}%</td>
                <td style={{ padding: '6px 10px', color: r.confidence < 0.5 ? T.red : T.amber }}>{(r.confidence * 100).toFixed(0)}%</td>
                <td style={{ padding: '6px 10px' }}><Pill color={T.navy} bg={T.surfaceH}>{r.reason}</Pill></td>
                <td style={{ padding: '6px 10px', color: T.textSec }}>{r.flaggedBy}</td>
                <td style={{ padding: '6px 10px' }}>{r.waiting}d</td>
                <td style={{ padding: '6px 10px' }}><StatusPill status={r.priority} /></td>
                <td style={{ padding: '6px 10px' }}>
                  <span style={{ cursor: 'pointer', padding: '3px 8px', background: T.navy, color: '#fff', borderRadius: 3, fontSize: 10, fontWeight: 600 }}>REVIEW</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <SectionHeader title="Review Queue Aging Distribution" />
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={Array.from({ length: 10 }, (_, i) => ({ day: `${i + 1}d`, count: REVIEW_QUEUE.filter(r => r.waiting === i + 1).length }))}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
            <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
            <Bar dataKey="count" fill={T.gold} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function GovernanceTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <SectionHeader title="Model Governance Summary" subtitle="// EU AI Act · SS1/23 · SR11-7 model risk management" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KpiCard label="Model Registry" value={fmtNum(MODELS.length)} sub="versioned · mlflow" accent={T.navy} mono />
          <KpiCard label="Audit Events" value={fmtNum(AUDIT_LOG.length)} sub="last 60 days" accent={T.gold} mono />
          <KpiCard label="Signature Chain" value="SHA-256" sub="tamper-evident" accent={T.sage} mono />
          <KpiCard label="Next Bias Audit" value="2026-05-12" sub="quarterly cadence" accent={T.amber} mono />
        </div>
      </Card>

      <Card>
        <SectionHeader title="Audit Trail" subtitle={`// ${AUDIT_LOG.length} immutable governance events`} />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 10.5 }}>
          <thead>
            <tr style={{ background: T.surfaceH, borderBottom: `1px solid ${T.border}` }}>
              {['ID', 'Timestamp', 'Event', 'User', 'Model', 'Detail', 'Signature'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AUDIT_LOG.map((a, i) => (
              <tr key={a.id} style={{ background: i % 2 ? T.surfaceH : T.surface, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '6px 10px', color: T.navy, fontWeight: 700 }}>{a.id}</td>
                <td style={{ padding: '6px 10px', color: T.textSec }}>{a.ts}</td>
                <td style={{ padding: '6px 10px' }}><Pill color={T.navy} bg={T.surfaceH}>{a.event}</Pill></td>
                <td style={{ padding: '6px 10px', fontWeight: 600 }}>{a.user}</td>
                <td style={{ padding: '6px 10px', color: T.gold }}>{a.model}</td>
                <td style={{ padding: '6px 10px', fontFamily: T.font, fontSize: 11, color: T.textSec }}>{a.detail}</td>
                <td style={{ padding: '6px 10px', fontSize: 10, color: T.textMut }}>{a.signature}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <SectionHeader title="Model Lineage & Data Provenance" subtitle="// upstream data sources · feature pipeline versions · downstream consumers" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <div style={{ padding: 12, background: T.surfaceH, borderRadius: 4, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Upstream Sources</div>
            {['Refinitiv ESG · v2025.Q4', 'Bloomberg GHG · daily', 'CDP Climate · Jan 2026', 'Internal CapEx · GL ERP', 'MSCI Taxonomy · weekly', 'SASB Materiality · v2024.3', 'EFRAG ESRS · Apr 2026', 'NACE Rev.2 · DG GROW'].map((s, i) => (
              <div key={i} style={{ fontSize: 10.5, color: T.text, fontFamily: T.mono, padding: '4px 0', borderBottom: i < 7 ? `1px solid ${T.border}` : 'none' }}>● {s}</div>
            ))}
          </div>
          <div style={{ padding: 12, background: T.surfaceH, borderRadius: 4, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Pipeline Versions</div>
            {['feature_store v3.2.1', 'nlp_extractor v1.8.0', 'nace_embeddings v2.4', 'imputer_knn v1.3.7', 'scaler_robust v1.1', 'bias_monitor v2.0.3', 'mlflow_registry v2.12', 'serving_api v4.1.0'].map((s, i) => (
              <div key={i} style={{ fontSize: 10.5, color: T.text, fontFamily: T.mono, padding: '4px 0', borderBottom: i < 7 ? `1px solid ${T.border}` : 'none' }}>◆ {s}</div>
            ))}
          </div>
          <div style={{ padding: 12, background: T.surfaceH, borderRadius: 4, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sage, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Downstream Consumers</div>
            {['EP-Q1 Taxonomy Reporter', 'EP-Q2 CSRD ESRS Full', 'EP-Q3 SFDR Art.8/9', 'EP-Q4 ISSB Disclosure', 'EP-Q5 TCFD Mapper', 'EP-P1 PCAF Engine', 'EP-R1 Portfolio Manager', 'EP-M1 Materiality DME'].map((s, i) => (
              <div key={i} style={{ fontSize: 10.5, color: T.text, fontFamily: T.mono, padding: '4px 0', borderBottom: i < 7 ? `1px solid ${T.border}` : 'none' }}>→ {s}</div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Bias & Fairness Metrics" subtitle="// demographic parity · equalized odds · across NACE / geography / size" />
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={[
            { metric: 'Demographic Parity', score: 82, threshold: 80 },
            { metric: 'Equalized Odds', score: 79, threshold: 80 },
            { metric: 'Calibration', score: 91, threshold: 85 },
            { metric: 'Predictive Parity', score: 86, threshold: 80 },
            { metric: 'Treatment Equality', score: 77, threshold: 80 },
            { metric: 'Individual Fairness', score: 84, threshold: 80 }
          ]}>
            <PolarGrid stroke={T.border} />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: T.navy, fontWeight: 600 }} />
            <PolarRadiusAxis domain={[60, 100]} tick={{ fontSize: 9, fill: T.textMut }} />
            <Radar dataKey="score" stroke={T.sage} fill={T.sage} fillOpacity={0.3} name="Score" />
            <Radar dataKey="threshold" stroke={T.red} fill={T.red} fillOpacity={0.08} name="Threshold" strokeDasharray="4 4" />
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </RadarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 14 — Confusion Matrix & Classification Metrics
// ─────────────────────────────────────────────────────────────────────────────
function ConfusionMatrixTab() {
  const [threshold, setThreshold] = useState(0.50);
  const [posClass, setPosClass] = useState('aligned');

  const confusion = useMemo(() => {
    let tp = 0, fp = 0, fn = 0, tn = 0;
    ISSUERS.forEach(i => {
      // "Score" is model predicted alignment probability (use issuer.aligned + noise)
      const score = clamp(i.aligned + (sr(hashStr(i.id) + 701) - 0.5) * 0.08, 0, 1);
      const actual = (posClass === 'aligned') ? i.aligned >= 0.5 : i.dnshPass;
      const predicted = score >= threshold;
      if (predicted && actual) tp++;
      else if (predicted && !actual) fp++;
      else if (!predicted && actual) fn++;
      else tn++;
    });
    const tot = Math.max(1, tp + fp + fn + tn);
    const acc = (tp + tn) / tot;
    const prec = tp / Math.max(1, tp + fp);
    const rec = tp / Math.max(1, tp + fn);
    const spec = tn / Math.max(1, tn + fp);
    const f1 = 2 * prec * rec / Math.max(0.0001, prec + rec);
    const mccDen = Math.sqrt(Math.max(1, (tp + fp) * (tp + fn) * (tn + fp) * (tn + fn)));
    const mcc = (tp * tn - fp * fn) / Math.max(0.0001, mccDen);
    // Cohen's kappa
    const pObs = (tp + tn) / tot;
    const pExp = (((tp + fp) * (tp + fn)) + ((fn + tn) * (fp + tn))) / Math.max(1, tot * tot);
    const kappa = (pObs - pExp) / Math.max(0.0001, 1 - pExp);
    const fpr = fp / Math.max(1, fp + tn);
    const fnr = fn / Math.max(1, fn + tp);
    return { tp, fp, fn, tn, tot, acc, prec, rec, spec, f1, mcc, kappa, fpr, fnr };
  }, [threshold, posClass]);

  const thresholdSweep = useMemo(() => {
    return Array.from({ length: 21 }, (_, i) => {
      const thr = i / 20;
      let tp = 0, fp = 0, fn = 0, tn = 0;
      ISSUERS.forEach(iss => {
        const score = clamp(iss.aligned + (sr(hashStr(iss.id) + 701) - 0.5) * 0.08, 0, 1);
        const actual = (posClass === 'aligned') ? iss.aligned >= 0.5 : iss.dnshPass;
        const predicted = score >= thr;
        if (predicted && actual) tp++;
        else if (predicted && !actual) fp++;
        else if (!predicted && actual) fn++;
        else tn++;
      });
      const tot = Math.max(1, tp + fp + fn + tn);
      const prec = tp / Math.max(1, tp + fp);
      const rec = tp / Math.max(1, tp + fn);
      const f1 = 2 * prec * rec / Math.max(0.0001, prec + rec);
      return { thr: thr.toFixed(2), acc: ((tp + tn) / tot) * 100, prec: prec * 100, rec: rec * 100, f1: f1 * 100 };
    });
  }, [posClass]);

  const cellColor = (v, max) => {
    const r = v / Math.max(1, max);
    return `rgba(27,58,92,${0.12 + r * 0.7})`;
  };
  const maxCell = Math.max(confusion.tp, confusion.fp, confusion.fn, confusion.tn);

  const metricsRow = [
    { label: 'Accuracy', value: confusion.acc, fmt: 'pct', desc: '(TP+TN)/N' },
    { label: 'Precision', value: confusion.prec, fmt: 'pct', desc: 'TP/(TP+FP)' },
    { label: 'Recall (TPR)', value: confusion.rec, fmt: 'pct', desc: 'TP/(TP+FN)' },
    { label: 'Specificity (TNR)', value: confusion.spec, fmt: 'pct', desc: 'TN/(TN+FP)' },
    { label: 'F1 Score', value: confusion.f1, fmt: 'pct', desc: '2·P·R / (P+R)' },
    { label: "Cohen's κ", value: confusion.kappa, fmt: 'ratio', desc: 'Agreement vs chance' },
    { label: 'MCC', value: confusion.mcc, fmt: 'ratio', desc: 'Matthews corr. coeff.' },
    { label: 'FPR', value: confusion.fpr, fmt: 'pct', desc: 'FP/(FP+TN)' },
    { label: 'FNR', value: confusion.fnr, fmt: 'pct', desc: 'FN/(FN+TP)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <SectionHeader title="Confusion Matrix & Classification Metrics" subtitle={`// threshold sweep · ${ISSUERS.length} issuers · positive class = ${posClass}`}
          right={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select value={posClass} onChange={e => setPosClass(e.target.value)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: '5px 9px', fontFamily: T.mono, fontSize: 11, color: T.text }}>
                <option value="aligned">Positive = Aligned ≥ 0.5</option>
                <option value="dnsh">Positive = DNSH Pass</option>
              </select>
            </div>
          } />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 18 }}>
          <div>
            <div style={{ fontSize: 10.5, color: T.textSec, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>2×2 Confusion Heatmap</div>
            <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr', gridTemplateRows: '34px 1fr 1fr', gap: 2, fontFamily: T.mono }}>
              <div />
              <div style={{ textAlign: 'center', fontSize: 10.5, color: T.textSec, alignSelf: 'end', padding: 4 }}>PRED: Positive</div>
              <div style={{ textAlign: 'center', fontSize: 10.5, color: T.textSec, alignSelf: 'end', padding: 4 }}>PRED: Negative</div>

              <div style={{ fontSize: 10.5, color: T.textSec, alignSelf: 'center', padding: 4 }}>ACTUAL: Pos</div>
              <div style={{ padding: 18, textAlign: 'center', background: cellColor(confusion.tp, maxCell), color: '#fff', borderRadius: 4 }}>
                <div style={{ fontSize: 10.5, opacity: 0.85, letterSpacing: 0.4 }}>TRUE POS</div>
                <div style={{ fontSize: 30, fontWeight: 700 }}>{confusion.tp}</div>
                <div style={{ fontSize: 10, opacity: 0.75 }}>{((confusion.tp / confusion.tot) * 100).toFixed(1)}%</div>
              </div>
              <div style={{ padding: 18, textAlign: 'center', background: cellColor(confusion.fn, maxCell), color: '#fff', borderRadius: 4 }}>
                <div style={{ fontSize: 10.5, opacity: 0.85, letterSpacing: 0.4 }}>FALSE NEG</div>
                <div style={{ fontSize: 30, fontWeight: 700 }}>{confusion.fn}</div>
                <div style={{ fontSize: 10, opacity: 0.75 }}>{((confusion.fn / confusion.tot) * 100).toFixed(1)}%</div>
              </div>

              <div style={{ fontSize: 10.5, color: T.textSec, alignSelf: 'center', padding: 4 }}>ACTUAL: Neg</div>
              <div style={{ padding: 18, textAlign: 'center', background: cellColor(confusion.fp, maxCell), color: '#fff', borderRadius: 4 }}>
                <div style={{ fontSize: 10.5, opacity: 0.85, letterSpacing: 0.4 }}>FALSE POS</div>
                <div style={{ fontSize: 30, fontWeight: 700 }}>{confusion.fp}</div>
                <div style={{ fontSize: 10, opacity: 0.75 }}>{((confusion.fp / confusion.tot) * 100).toFixed(1)}%</div>
              </div>
              <div style={{ padding: 18, textAlign: 'center', background: cellColor(confusion.tn, maxCell), color: '#fff', borderRadius: 4 }}>
                <div style={{ fontSize: 10.5, opacity: 0.85, letterSpacing: 0.4 }}>TRUE NEG</div>
                <div style={{ fontSize: 30, fontWeight: 700 }}>{confusion.tn}</div>
                <div style={{ fontSize: 10, opacity: 0.75 }}>{((confusion.tn / confusion.tot) * 100).toFixed(1)}%</div>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10.5, color: T.textSec, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Decision Threshold: {threshold.toFixed(2)}</div>
              <input type="range" min="0" max="1" step="0.01" value={threshold} onChange={e => setThreshold(parseFloat(e.target.value))} style={{ width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMut, fontFamily: T.mono, marginTop: 2 }}>
                <span>0.00</span><span>0.25</span><span>0.50</span><span>0.75</span><span>1.00</span>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: T.textSec, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Threshold Sweep · Metrics vs Decision Boundary</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={thresholdSweep}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="thr" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="acc" stroke={T.navy} strokeWidth={2} dot={false} name="Accuracy" />
                <Line type="monotone" dataKey="prec" stroke={T.gold} strokeWidth={2} dot={false} name="Precision" />
                <Line type="monotone" dataKey="rec" stroke={T.sage} strokeWidth={2} dot={false} name="Recall" />
                <Line type="monotone" dataKey="f1" stroke={T.red} strokeWidth={2} dot={false} name="F1" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Classification Metrics — Derived from Confusion Matrix" subtitle="// all metrics computed live from current threshold" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {metricsRow.map(m => (
            <div key={m.label} style={{ padding: 14, background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }}>
              <div style={{ fontSize: 10.5, color: T.textSec, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: T.navy, fontFamily: T.mono, marginTop: 6 }}>
                {m.fmt === 'pct' ? `${(m.value * 100).toFixed(2)}%` : m.value.toFixed(4)}
              </div>
              <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono, marginTop: 4 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeader title="Metrics at Standard Thresholds" subtitle="// reference table across 5 common decision boundaries" />
        <div style={{ overflow: 'hidden', borderRadius: 4, border: `1px solid ${T.border}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 11 }}>
            <thead>
              <tr style={{ background: T.navy, color: '#fff' }}>
                <th style={{ padding: 10, textAlign: 'left' }}>Threshold</th>
                <th style={{ padding: 10, textAlign: 'right' }}>TP</th>
                <th style={{ padding: 10, textAlign: 'right' }}>FP</th>
                <th style={{ padding: 10, textAlign: 'right' }}>FN</th>
                <th style={{ padding: 10, textAlign: 'right' }}>TN</th>
                <th style={{ padding: 10, textAlign: 'right' }}>Accuracy</th>
                <th style={{ padding: 10, textAlign: 'right' }}>Precision</th>
                <th style={{ padding: 10, textAlign: 'right' }}>Recall</th>
                <th style={{ padding: 10, textAlign: 'right' }}>F1</th>
              </tr>
            </thead>
            <tbody>
              {METRIC_THRESHOLDS.map(thr => {
                let tp = 0, fp = 0, fn = 0, tn = 0;
                ISSUERS.forEach(iss => {
                  const score = clamp(iss.aligned + (sr(hashStr(iss.id) + 701) - 0.5) * 0.08, 0, 1);
                  const actual = (posClass === 'aligned') ? iss.aligned >= 0.5 : iss.dnshPass;
                  const predicted = score >= thr;
                  if (predicted && actual) tp++;
                  else if (predicted && !actual) fp++;
                  else if (!predicted && actual) fn++;
                  else tn++;
                });
                const tot = Math.max(1, tp + fp + fn + tn);
                const prec = tp / Math.max(1, tp + fp);
                const rec = tp / Math.max(1, tp + fn);
                const f1 = 2 * prec * rec / Math.max(0.0001, prec + rec);
                const active = Math.abs(threshold - thr) < 0.005;
                return (
                  <tr key={thr} style={{ background: active ? '#faf4e6' : T.surface, borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 9, fontWeight: active ? 700 : 500, color: active ? T.gold : T.text }}>{thr.toFixed(2)}{active ? ' ◀' : ''}</td>
                    <td style={{ padding: 9, textAlign: 'right', color: T.green }}>{tp}</td>
                    <td style={{ padding: 9, textAlign: 'right', color: T.amber }}>{fp}</td>
                    <td style={{ padding: 9, textAlign: 'right', color: T.red }}>{fn}</td>
                    <td style={{ padding: 9, textAlign: 'right', color: T.sage }}>{tn}</td>
                    <td style={{ padding: 9, textAlign: 'right' }}>{(((tp + tn) / tot) * 100).toFixed(1)}%</td>
                    <td style={{ padding: 9, textAlign: 'right' }}>{(prec * 100).toFixed(1)}%</td>
                    <td style={{ padding: 9, textAlign: 'right' }}>{(rec * 100).toFixed(1)}%</td>
                    <td style={{ padding: 9, textAlign: 'right', fontWeight: 700, color: T.navy }}>{(f1 * 100).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, padding: 10, background: T.surfaceH, borderRadius: 4, fontSize: 10.5, color: T.textSec, fontFamily: T.mono }}>
          ● Matthews Correlation Coefficient (MCC) is balanced across classes — robust to class imbalance. ● Cohen's κ corrects accuracy for chance agreement. ● F1 harmonic mean penalizes extreme precision/recall mismatch.
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 15 — ROC / PR / Lift Curves
// ─────────────────────────────────────────────────────────────────────────────
function RocPrLiftTab() {
  const [curveMode, setCurveMode] = useState('roc');

  // Scored sample: expand ISSUERS to 200 observations with seeded scores + true labels
  const scored = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 200; i++) {
      const base = ISSUERS[i % ISSUERS.length];
      const noise = (sr(i * 13 + 17) - 0.5) * 0.22;
      const score = clamp(base.aligned + noise, 0, 1);
      const trueProb = clamp(base.aligned + (sr(i * 7 + 3) - 0.5) * 0.05, 0, 1);
      const actual = trueProb >= 0.5 ? 1 : 0;
      arr.push({ score, actual });
    }
    return [...arr].sort((a, b) => b.score - a.score);
  }, []);

  const rocPoints = useMemo(() => {
    const totPos = scored.filter(s => s.actual === 1).length;
    const totNeg = scored.filter(s => s.actual === 0).length;
    const points = [{ fpr: 0, tpr: 0, thr: 1.0 }];
    let tp = 0, fp = 0;
    scored.forEach(s => {
      if (s.actual === 1) tp++; else fp++;
      points.push({ fpr: fp / Math.max(1, totNeg), tpr: tp / Math.max(1, totPos), thr: s.score });
    });
    points.push({ fpr: 1, tpr: 1, thr: 0 });
    return points;
  }, [scored]);

  const auc = useMemo(() => {
    // Trapezoidal rule on sorted FPR
    let area = 0;
    for (let i = 1; i < rocPoints.length; i++) {
      const dx = rocPoints[i].fpr - rocPoints[i - 1].fpr;
      const avgY = (rocPoints[i].tpr + rocPoints[i - 1].tpr) / 2;
      area += dx * avgY;
    }
    return area;
  }, [rocPoints]);

  const prPoints = useMemo(() => {
    const totPos = scored.filter(s => s.actual === 1).length;
    const points = [];
    let tp = 0, fp = 0;
    scored.forEach(s => {
      if (s.actual === 1) tp++; else fp++;
      const prec = tp / Math.max(1, tp + fp);
      const rec = tp / Math.max(1, totPos);
      points.push({ recall: rec, precision: prec, thr: s.score });
    });
    return points;
  }, [scored]);

  const aucPR = useMemo(() => {
    let area = 0;
    const pts = [{ recall: 0, precision: 1 }, ...prPoints];
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].recall - pts[i - 1].recall;
      const avgY = (pts[i].precision + pts[i - 1].precision) / 2;
      area += dx * avgY;
    }
    return area;
  }, [prPoints]);

  const liftTable = useMemo(() => {
    const N = scored.length;
    const totPos = scored.filter(s => s.actual === 1).length;
    const baseRate = totPos / Math.max(1, N);
    const deciles = [];
    for (let d = 1; d <= 10; d++) {
      const cut = Math.floor((N * d) / 10);
      const slice = scored.slice(0, cut);
      const posInSlice = slice.filter(s => s.actual === 1).length;
      const respRate = posInSlice / Math.max(1, cut);
      const lift = respRate / Math.max(0.0001, baseRate);
      const cumGain = posInSlice / Math.max(1, totPos);
      deciles.push({ decile: d, size: cut, pos: posInSlice, respRate, lift, cumGain });
    }
    return deciles;
  }, [scored]);

  const gainChart = useMemo(() => {
    return [{ pct: 0, gain: 0, baseline: 0 }, ...liftTable.map(r => ({
      pct: r.decile * 10,
      gain: r.cumGain * 100,
      baseline: r.decile * 10
    }))];
  }, [liftTable]);

  const kolmogorov = useMemo(() => {
    // KS: max separation between positive and negative cumulative distributions
    const totPos = scored.filter(s => s.actual === 1).length;
    const totNeg = scored.filter(s => s.actual === 0).length;
    let cpos = 0, cneg = 0, maxD = 0, maxAt = 0;
    scored.forEach(s => {
      if (s.actual === 1) cpos++; else cneg++;
      const d = Math.abs(cpos / Math.max(1, totPos) - cneg / Math.max(1, totNeg));
      if (d > maxD) { maxD = d; maxAt = s.score; }
    });
    return { d: maxD, atScore: maxAt };
  }, [scored]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <KpiCard label="AUC-ROC" value={auc.toFixed(4)} sub="trapezoidal rule · 200 samples" accent={T.gold} mono />
        <KpiCard label="AUC-PR" value={aucPR.toFixed(4)} sub="precision-recall area" accent={T.sage} mono />
        <KpiCard label="KS Statistic" value={kolmogorov.d.toFixed(3)} sub={`@ score = ${kolmogorov.atScore.toFixed(3)}`} accent={T.navy} mono />
        <KpiCard label="Lift @ Decile 1" value={liftTable[0].lift.toFixed(2) + 'x'} sub={`top 10% · ${liftTable[0].pos}/${liftTable[0].size} pos`} accent={T.navyL} mono />
        <KpiCard label="Gain @ 20%" value={(liftTable[1].cumGain * 100).toFixed(1) + '%'} sub="of total positives captured" accent={T.text} mono />
      </div>

      <Card>
        <SectionHeader title="Discriminative Curves" subtitle="// ROC & Precision-Recall computed via stepwise threshold sweep"
          right={
            <div style={{ display: 'flex', gap: 6 }}>
              {[{ k: 'roc', l: 'ROC' }, { k: 'pr', l: 'PR Curve' }].map(o => (
                <div key={o.k} onClick={() => setCurveMode(o.k)} style={{ padding: '6px 11px', fontSize: 11, fontFamily: T.mono, cursor: 'pointer', fontWeight: curveMode === o.k ? 700 : 500, background: curveMode === o.k ? T.navy : T.surface, color: curveMode === o.k ? '#fff' : T.textSec, border: `1px solid ${curveMode === o.k ? T.navy : T.border}`, borderRadius: 3 }}>{o.l}</div>
              ))}
            </div>
          } />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10.5, color: T.textSec, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>ROC · FPR vs TPR · AUC = {auc.toFixed(3)}</div>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis type="number" dataKey="fpr" domain={[0, 1]} tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'FPR', position: 'insideBottom', offset: -5, fontSize: 11, fill: T.textSec }} />
                <YAxis type="number" dataKey="tpr" domain={[0, 1]} tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'TPR', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} formatter={(v) => v.toFixed(3)} />
                <Scatter data={rocPoints} fill={T.navy} line={{ stroke: T.navy, strokeWidth: 2 }} shape="circle" />
                <Scatter data={[{ fpr: 0, tpr: 0 }, { fpr: 1, tpr: 1 }]} fill={T.textMut} line={{ stroke: T.textMut, strokeDasharray: '4 4' }} shape="circle" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: T.textSec, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>PR · Recall vs Precision · AUC-PR = {aucPR.toFixed(3)}</div>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis type="number" dataKey="recall" domain={[0, 1]} tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Recall', position: 'insideBottom', offset: -5, fontSize: 11, fill: T.textSec }} />
                <YAxis type="number" dataKey="precision" domain={[0, 1]} tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Precision', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} formatter={(v) => v.toFixed(3)} />
                <Scatter data={prPoints} fill={T.gold} line={{ stroke: T.gold, strokeWidth: 2 }} shape="circle" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Cumulative Gain & Lift Chart" subtitle="// % positives captured as function of scored population" />
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16 }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={gainChart}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="pct" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: '% of scored population', position: 'insideBottom', offset: -5, fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: '% positives captured', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="gain" stroke={T.navy} strokeWidth={3} name="Model" dot={{ r: 4, fill: T.navy }} />
              <Line type="monotone" dataKey="baseline" stroke={T.textMut} strokeWidth={1.5} strokeDasharray="5 3" name="Random" dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ overflow: 'hidden', borderRadius: 4, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  <th style={{ padding: 8, textAlign: 'left' }}>Decile</th>
                  <th style={{ padding: 8, textAlign: 'right' }}>N</th>
                  <th style={{ padding: 8, textAlign: 'right' }}>Pos</th>
                  <th style={{ padding: 8, textAlign: 'right' }}>Resp %</th>
                  <th style={{ padding: 8, textAlign: 'right' }}>Lift</th>
                  <th style={{ padding: 8, textAlign: 'right' }}>Cum Gain</th>
                </tr>
              </thead>
              <tbody>
                {liftTable.map(r => (
                  <tr key={r.decile} style={{ borderBottom: `1px solid ${T.border}`, background: r.lift >= 1.5 ? '#faf4e6' : T.surface }}>
                    <td style={{ padding: 7 }}>D{r.decile}</td>
                    <td style={{ padding: 7, textAlign: 'right' }}>{r.size}</td>
                    <td style={{ padding: 7, textAlign: 'right', color: T.green }}>{r.pos}</td>
                    <td style={{ padding: 7, textAlign: 'right' }}>{(r.respRate * 100).toFixed(1)}%</td>
                    <td style={{ padding: 7, textAlign: 'right', fontWeight: 700, color: r.lift >= 1.5 ? T.gold : r.lift >= 1 ? T.navy : T.textMut }}>{r.lift.toFixed(2)}x</td>
                    <td style={{ padding: 7, textAlign: 'right' }}>{(r.cumGain * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 16 — Permutation Importance & Partial Dependence
// ─────────────────────────────────────────────────────────────────────────────
function PermImpPdpTab() {
  const [pdpFeature, setPdpFeature] = useState(FEATURES[0].name);
  const [nShuffles, setNShuffles] = useState(3);

  // Permutation importance: baseline AUC minus AUC-after-shuffling each feature
  const permImp = useMemo(() => {
    // Baseline proxy AUC: derived from sum of (imp * feature_strength)
    const baseline = 0.92;
    return FEATURES.map((f, idx) => {
      // Each shuffle degrades AUC proportional to f.imp plus seeded noise (averaged over nShuffles)
      let totalDrop = 0;
      for (let k = 0; k < nShuffles; k++) {
        const shufNoise = (sr(idx * 23 + k * 11 + 5007) - 0.5) * 0.012;
        const drop = f.imp * 0.95 + shufNoise;
        totalDrop += drop;
      }
      const avgDrop = totalDrop / Math.max(1, nShuffles);
      const scoreAfter = baseline - avgDrop;
      return {
        feature: f.name,
        cat: f.cat,
        baseline,
        scoreAfter,
        importance: avgDrop,
        stdErr: 0.002 + sr(idx + 9001) * 0.005
      };
    });
  }, [nShuffles]);

  const sortedPerm = useMemo(() => [...permImp].sort((a, b) => b.importance - a.importance), [permImp]);

  const catAvg = useMemo(() => {
    const byCat = {};
    sortedPerm.forEach(p => {
      if (!byCat[p.cat]) byCat[p.cat] = { cat: p.cat, total: 0, count: 0 };
      byCat[p.cat].total += p.importance;
      byCat[p.cat].count += 1;
    });
    return Object.values(byCat).map(c => ({ cat: c.cat, avgImp: c.total / Math.max(1, c.count), count: c.count }));
  }, [sortedPerm]);

  // Partial dependence: score vs pdpFeature binned across PD_BINS, marginalized over ISSUERS
  const pdpData = useMemo(() => {
    const featDef = FEATURES.find(f => f.name === pdpFeature) || FEATURES[0];
    const bins = [];
    for (let b = 0; b < PD_BINS; b++) {
      const binVal = b / (PD_BINS - 1);
      // Average predicted alignment when feature is fixed at binVal (marginalize over issuers)
      let sumPred = 0;
      ISSUERS.forEach((iss, i) => {
        const base = iss.aligned;
        // Effect of feature: featDef.imp * (binVal - 0.5) * 2 => scaled effect
        const effect = featDef.imp * (binVal - 0.5) * 2 * 1.8;
        const noise = (sr(i + hashStr(pdpFeature) % 100) - 0.5) * 0.02;
        sumPred += clamp(base + effect + noise, 0, 1);
      });
      bins.push({
        binVal: binVal.toFixed(2),
        binLabel: `[${(b * 10)}-${((b + 1) * 10)}%]`,
        avgScore: sumPred / Math.max(1, ISSUERS.length),
        count: ISSUERS.length
      });
    }
    return bins;
  }, [pdpFeature]);

  const iceLines = useMemo(() => {
    // Individual Conditional Expectation: 8 sample issuers, each with their own curve
    const featDef = FEATURES.find(f => f.name === pdpFeature) || FEATURES[0];
    const samples = ISSUERS.slice(0, 8);
    const bins = [];
    for (let b = 0; b < PD_BINS; b++) {
      const binVal = b / (PD_BINS - 1);
      const row = { binVal: binVal.toFixed(2) };
      samples.forEach((iss) => {
        const base = iss.aligned;
        const effect = featDef.imp * (binVal - 0.5) * 2 * 1.8;
        row[iss.name.slice(0, 12)] = clamp(base + effect, 0, 1);
      });
      bins.push(row);
    }
    return { data: bins, samples };
  }, [pdpFeature]);

  const iceColors = [T.navy, T.gold, T.sage, T.navyL, T.goldL, T.red, T.amber, T.textSec];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <SectionHeader title="Permutation Feature Importance" subtitle={`// baseline AUC − AUC after shuffling each feature · averaged across ${nShuffles} shuffles`}
          right={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 10.5, color: T.textSec, fontFamily: T.mono }}>SHUFFLES:</span>
              {[1, 3, 5, 10].map(n => (
                <div key={n} onClick={() => setNShuffles(n)} style={{ padding: '4px 9px', fontSize: 10.5, fontFamily: T.mono, cursor: 'pointer', fontWeight: nShuffles === n ? 700 : 500, background: nShuffles === n ? T.navy : T.surface, color: nShuffles === n ? '#fff' : T.textSec, border: `1px solid ${nShuffles === n ? T.navy : T.border}`, borderRadius: 3 }}>{n}</div>
              ))}
            </div>
          } />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div style={{ maxHeight: 620, overflowY: 'auto' }}>
            {sortedPerm.map((p, i) => {
              const maxImp = Math.max(...sortedPerm.map(x => x.importance));
              const pct = (p.importance / Math.max(0.0001, maxImp)) * 100;
              return (
                <div key={p.feature} style={{ display: 'grid', gridTemplateColumns: '28px 1.6fr 90px 1fr 95px', gap: 10, alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>#{i + 1}</div>
                  <div style={{ fontSize: 11, color: T.text, fontFamily: T.mono, fontWeight: 600 }}>{p.feature}</div>
                  <Pill color={T.navy} bg={T.surfaceH}>{p.cat}</Pill>
                  <div style={{ position: 'relative', height: 14, background: T.surfaceH, borderRadius: 3 }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: i < 5 ? T.red : i < 12 ? T.gold : T.sage, borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 11, fontFamily: T.mono, color: T.text, textAlign: 'right' }}>
                    <span style={{ fontWeight: 700 }}>{(p.importance * 100).toFixed(2)}%</span>
                    <span style={{ color: T.textMut, marginLeft: 4 }}>±{(p.stdErr * 100).toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: T.textSec, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Category Aggregate Importance</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={catAvg} layout="vertical">
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={(v) => `${(v * 100).toFixed(1)}%`} />
                <YAxis type="category" dataKey="cat" tick={{ fontSize: 10, fill: T.textSec }} width={100} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} formatter={(v) => `${(v * 100).toFixed(2)}%`} />
                <Bar dataKey="avgImp" fill={T.gold} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 10, padding: 10, background: T.surfaceH, borderRadius: 4, fontSize: 10.5, color: T.textSec, fontFamily: T.mono }}>
              ● Model-agnostic permutation importance. ● Features ranked by AUC degradation after column shuffle. ● Avg ± 1 std err over {nShuffles} repetitions.
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Partial Dependence Plot (PDP) + ICE Curves" subtitle={`// marginal effect of ${pdpFeature} on predicted alignment · averaged over ${ISSUERS.length} issuers`}
          right={
            <select value={pdpFeature} onChange={e => setPdpFeature(e.target.value)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: '5px 9px', fontFamily: T.mono, fontSize: 11, color: T.text, maxWidth: 260 }}>
              {FEATURES.filter(f => f.type === 'numeric').map(f => (
                <option key={f.name} value={f.name}>{f.name}</option>
              ))}
            </select>
          } />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10.5, color: T.textSec, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>PDP · Average Predicted Alignment</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={pdpData}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="binVal" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: pdpFeature, position: 'insideBottom', offset: -5, fontSize: 10, fill: T.textSec }} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} formatter={(v) => v.toFixed(4)} />
                <Area type="monotone" dataKey="avgScore" stroke={T.navy} fill={T.navy} fillOpacity={0.25} strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: T.textSec, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>ICE · 8 Individual Issuer Curves</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={iceLines.data}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="binVal" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 10 }} formatter={(v) => (v === null || v === undefined ? '-' : v.toFixed(3))} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                {iceLines.samples.map((iss, i) => (
                  <Line key={iss.id} type="monotone" dataKey={iss.name.slice(0, 12)} stroke={iceColors[i % iceColors.length]} strokeWidth={1.5} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ marginTop: 12, padding: 10, background: T.surfaceH, borderRadius: 4, fontSize: 10.5, color: T.textSec, fontFamily: T.mono }}>
          ● PDP shows marginal effect: how E[ŷ | X_j = v] changes as X_j sweeps 0→1. ● ICE reveals heterogeneous effects across issuers — divergent curves indicate feature interaction. ● Monotonic increase suggests feature is a direct driver of alignment classification.
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 17 — Probability Calibration (Reliability, Brier, ECE, Platt, Isotonic)
// ─────────────────────────────────────────────────────────────────────────────
function ProbCalibTab() {
  const [platt, setPlatt] = useState(false);
  const [isotonic, setIsotonic] = useState(false);

  // Sample of (predicted, actual) pairs from ISSUERS
  const samples = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 300; i++) {
      const base = ISSUERS[i % ISSUERS.length];
      const rawPred = clamp(base.aligned + (sr(i * 19 + 31) - 0.5) * 0.18, 0, 1);
      // Miscalibration: raw predictions are over-confident at extremes
      const skew = rawPred > 0.5 ? 0.08 : -0.08;
      const pred = clamp(rawPred + skew * 0.5, 0, 1);
      const actualP = clamp(rawPred + (sr(i * 7 + 11) - 0.5) * 0.04, 0, 1);
      const actual = actualP >= 0.5 ? 1 : 0;
      arr.push({ pred, actual });
    }
    return arr;
  }, []);

  // Apply Platt scaling: sigmoid(a*x + b)
  const plattApply = (x) => {
    const a = 1.28, b = -0.14;
    return 1 / (1 + Math.exp(-(a * (x - 0.5) * 6 + b)));
  };

  // Apply isotonic (piecewise step via bins)
  const isotonicApply = useMemo(() => {
    const nB = 15;
    const binAvgs = Array.from({ length: nB }, (_, b) => {
      const lo = b / nB, hi = (b + 1) / nB;
      const s = samples.filter(x => x.pred >= lo && x.pred < hi);
      return s.length ? s.reduce((a, c) => a + c.actual, 0) / s.length : null;
    });
    // Pool adjacent violators (monotonic non-decreasing)
    const mono = [...binAvgs];
    for (let i = 1; i < mono.length; i++) {
      if (mono[i] !== null && mono[i - 1] !== null && mono[i] < mono[i - 1]) {
        const avg = (mono[i] + mono[i - 1]) / 2;
        mono[i] = avg; mono[i - 1] = avg;
      }
    }
    return (x) => {
      const idx = Math.min(nB - 1, Math.floor(x * nB));
      return mono[idx] !== null ? mono[idx] : x;
    };
  }, [samples]);

  const calibrated = useMemo(() => {
    return samples.map(s => {
      let p = s.pred;
      if (platt) p = plattApply(p);
      if (isotonic) p = isotonicApply(p);
      return { pred: p, actual: s.actual };
    });
  }, [samples, platt, isotonic, isotonicApply]);

  const reliabilityBins = useMemo(() => {
    const bins = [];
    for (let b = 0; b < CALIBRATION_BINS; b++) {
      const lo = b / CALIBRATION_BINS, hi = (b + 1) / CALIBRATION_BINS;
      const inBin = calibrated.filter(s => s.pred >= lo && (b === CALIBRATION_BINS - 1 ? s.pred <= hi : s.pred < hi));
      const n = inBin.length;
      const avgPred = n ? inBin.reduce((a, c) => a + c.pred, 0) / n : (lo + hi) / 2;
      const obsFreq = n ? inBin.reduce((a, c) => a + c.actual, 0) / n : 0;
      bins.push({
        bin: `${(lo * 100).toFixed(0)}-${(hi * 100).toFixed(0)}%`,
        predicted: avgPred,
        observed: obsFreq,
        count: n,
        gap: Math.abs(avgPred - obsFreq)
      });
    }
    return bins;
  }, [calibrated]);

  const brier = useMemo(() => {
    const sumSq = calibrated.reduce((a, s) => a + (s.pred - s.actual) ** 2, 0);
    return sumSq / Math.max(1, calibrated.length);
  }, [calibrated]);

  const ece = useMemo(() => {
    const N = Math.max(1, calibrated.length);
    return reliabilityBins.reduce((a, b) => a + (b.count / N) * b.gap, 0);
  }, [reliabilityBins, calibrated]);

  const mce = useMemo(() => {
    return Math.max(...reliabilityBins.filter(b => b.count > 0).map(b => b.gap), 0);
  }, [reliabilityBins]);

  const logLoss = useMemo(() => {
    const eps = 1e-12;
    const sum = calibrated.reduce((a, s) => {
      const p = clamp(s.pred, eps, 1 - eps);
      return a - (s.actual * Math.log(p) + (1 - s.actual) * Math.log(1 - p));
    }, 0);
    return sum / Math.max(1, calibrated.length);
  }, [calibrated]);

  const diagonalRef = Array.from({ length: 11 }, (_, i) => ({ predicted: i / 10, observed: i / 10 }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <KpiCard label="Brier Score" value={brier.toFixed(4)} sub="lower = better · 0=perfect" accent={T.navy} mono />
        <KpiCard label="ECE" value={(ece * 100).toFixed(2) + '%'} sub="expected calibration error" accent={T.gold} mono />
        <KpiCard label="MCE" value={(mce * 100).toFixed(2) + '%'} sub="max calibration error" accent={T.red} mono />
        <KpiCard label="Log Loss" value={logLoss.toFixed(4)} sub="cross-entropy" accent={T.navyL} mono />
        <KpiCard label="Samples" value={fmtNum(calibrated.length)} sub={`${calibrated.filter(s => s.actual === 1).length} positives`} accent={T.text} mono />
      </div>

      <Card>
        <SectionHeader title="Reliability Diagram" subtitle="// predicted probability vs observed frequency · perfect calibration lies on diagonal"
          right={
            <div style={{ display: 'flex', gap: 8 }}>
              <div onClick={() => setPlatt(!platt)} style={{ padding: '6px 11px', fontSize: 11, fontFamily: T.mono, cursor: 'pointer', fontWeight: platt ? 700 : 500, background: platt ? T.gold : T.surface, color: platt ? '#fff' : T.textSec, border: `1px solid ${platt ? T.gold : T.border}`, borderRadius: 3 }}>Platt Scaling {platt ? 'ON' : 'OFF'}</div>
              <div onClick={() => setIsotonic(!isotonic)} style={{ padding: '6px 11px', fontSize: 11, fontFamily: T.mono, cursor: 'pointer', fontWeight: isotonic ? 700 : 500, background: isotonic ? T.sage : T.surface, color: isotonic ? '#fff' : T.textSec, border: `1px solid ${isotonic ? T.sage : T.border}`, borderRadius: 3 }}>Isotonic {isotonic ? 'ON' : 'OFF'}</div>
            </div>
          } />
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
          <div>
            <ResponsiveContainer width="100%" height={340}>
              <ScatterChart>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis type="number" dataKey="predicted" domain={[0, 1]} tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Mean Predicted Prob', position: 'insideBottom', offset: -5, fontSize: 11, fill: T.textSec }} />
                <YAxis type="number" dataKey="observed" domain={[0, 1]} tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Observed Frequency', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} formatter={(v) => v.toFixed(3)} />
                <Scatter name="Perfect" data={diagonalRef} fill={T.textMut} line={{ stroke: T.textMut, strokeDasharray: '4 4' }} shape="circle" />
                <Scatter name="Model" data={reliabilityBins.filter(b => b.count > 0)} fill={platt ? T.gold : isotonic ? T.sage : T.navy} line={{ stroke: platt ? T.gold : isotonic ? T.sage : T.navy, strokeWidth: 2 }} shape="circle" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ overflow: 'hidden', borderRadius: 4, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  <th style={{ padding: 8, textAlign: 'left' }}>Bin</th>
                  <th style={{ padding: 8, textAlign: 'right' }}>N</th>
                  <th style={{ padding: 8, textAlign: 'right' }}>Pred</th>
                  <th style={{ padding: 8, textAlign: 'right' }}>Obs</th>
                  <th style={{ padding: 8, textAlign: 'right' }}>Gap</th>
                </tr>
              </thead>
              <tbody>
                {reliabilityBins.map((b, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: b.gap > 0.08 ? '#fde8e8' : b.gap > 0.04 ? '#fdf4e3' : T.surface }}>
                    <td style={{ padding: 6 }}>{b.bin}</td>
                    <td style={{ padding: 6, textAlign: 'right' }}>{b.count}</td>
                    <td style={{ padding: 6, textAlign: 'right' }}>{b.predicted.toFixed(3)}</td>
                    <td style={{ padding: 6, textAlign: 'right' }}>{b.observed.toFixed(3)}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontWeight: 700, color: b.gap > 0.08 ? T.red : b.gap > 0.04 ? T.amber : T.green }}>{b.gap.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Predicted Probability Histogram vs Observed" subtitle="// distribution of model outputs across calibration bins" />
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={reliabilityBins}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
            <XAxis dataKey="bin" tick={{ fontSize: 9, fill: T.textSec }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 1]} tick={{ fontSize: 10, fill: T.textSec }} />
            <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar yAxisId="left" dataKey="count" fill={T.navyL} name="Sample Count" />
            <Line yAxisId="right" type="monotone" dataKey="gap" stroke={T.red} strokeWidth={2} name="Calibration Gap" />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 12, padding: 10, background: T.surfaceH, borderRadius: 4, fontSize: 10.5, color: T.textSec, fontFamily: T.mono }}>
          ● Brier score = mean squared error of probabilities (0 = perfect). ● ECE = weighted avg of per-bin |pred − obs|. ● Platt scaling fits sigmoid post-hoc. ● Isotonic regression fits monotonic step function — more flexible, requires larger calibration set.
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 18 — Concept Drift (PSI + KS)
// ─────────────────────────────────────────────────────────────────────────────
function ConceptDriftTab() {
  const [selectedFeat, setSelectedFeat] = useState(FEATURES[0].name);
  const [alertBand, setAlertBand] = useState('all');

  // For each feature: synthesize 1000 ref samples and 1000 current samples, compute PSI & KS
  const driftTable = useMemo(() => {
    return FEATURES.map((f, idx) => {
      const refSeed = 500 + idx * 13;
      const curSeed = 900 + idx * 17;
      // Generate synthetic distributions; current has small drift if idx is even
      const refSamples = Array.from({ length: 500 }, (_, i) => sr(refSeed + i));
      const driftShift = 0.04 + sr(idx + 21) * 0.18 + (idx % 5 === 0 ? 0.12 : 0);
      const curSamples = Array.from({ length: 500 }, (_, i) => clamp(sr(curSeed + i) + (sr(curSeed + i + 111) - 0.5) * driftShift, 0, 1));

      // Binning
      const nBins = 10;
      const edges = Array.from({ length: nBins + 1 }, (_, b) => b / nBins);
      const refHist = Array(nBins).fill(0);
      const curHist = Array(nBins).fill(0);
      refSamples.forEach(v => {
        const bi = Math.min(nBins - 1, Math.floor(v * nBins));
        refHist[bi]++;
      });
      curSamples.forEach(v => {
        const bi = Math.min(nBins - 1, Math.floor(v * nBins));
        curHist[bi]++;
      });
      const refTot = Math.max(1, refSamples.length);
      const curTot = Math.max(1, curSamples.length);
      // PSI: Σ (new% - old%) * ln(new% / old%)
      let psi = 0;
      for (let b = 0; b < nBins; b++) {
        const oldP = Math.max(0.0001, refHist[b] / refTot);
        const newP = Math.max(0.0001, curHist[b] / curTot);
        psi += (newP - oldP) * Math.log(newP / oldP);
      }
      // KS: max |CDF_ref - CDF_cur|
      const refSorted = [...refSamples].sort((a, b) => a - b);
      const curSorted = [...curSamples].sort((a, b) => a - b);
      let ks = 0;
      const checkpoints = 40;
      for (let c = 0; c <= checkpoints; c++) {
        const v = c / checkpoints;
        const cdfRef = refSorted.filter(x => x <= v).length / refTot;
        const cdfCur = curSorted.filter(x => x <= v).length / curTot;
        const d = Math.abs(cdfRef - cdfCur);
        if (d > ks) ks = d;
      }
      const zone = psi > 0.25 ? 'RED' : psi >= 0.1 ? 'AMBER' : 'GREEN';

      return {
        feature: f.name,
        cat: f.cat,
        refHist,
        curHist,
        psi,
        ks,
        zone,
        refMean: refSamples.reduce((a, x) => a + x, 0) / refTot,
        curMean: curSamples.reduce((a, x) => a + x, 0) / curTot
      };
    });
  }, []);

  const filteredDrift = useMemo(() => {
    if (alertBand === 'all') return driftTable;
    return driftTable.filter(d => d.zone === alertBand);
  }, [driftTable, alertBand]);

  const sortedDrift = useMemo(() => [...filteredDrift].sort((a, b) => b.psi - a.psi), [filteredDrift]);

  const selected = useMemo(() => driftTable.find(d => d.feature === selectedFeat) || driftTable[0], [driftTable, selectedFeat]);

  const distChartData = useMemo(() => {
    return selected.refHist.map((_, i) => ({
      bin: `${(i * 10)}-${((i + 1) * 10)}`,
      reference: selected.refHist[i] / Math.max(1, selected.refHist.reduce((a, b) => a + b, 0)) * 100,
      current: selected.curHist[i] / Math.max(1, selected.curHist.reduce((a, b) => a + b, 0)) * 100
    }));
  }, [selected]);

  const zoneCounts = useMemo(() => {
    const r = { GREEN: 0, AMBER: 0, RED: 0 };
    driftTable.forEach(d => { r[d.zone]++; });
    return r;
  }, [driftTable]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <KpiCard label="Features Monitored" value={fmtNum(driftTable.length)} sub="vs 2024 Q4 reference window" accent={T.navy} mono />
        <KpiCard label="Green (<0.1)" value={fmtNum(zoneCounts.GREEN)} sub="no meaningful drift" accent={T.sage} mono />
        <KpiCard label="Amber (0.1-0.25)" value={fmtNum(zoneCounts.AMBER)} sub="moderate — investigate" accent={T.amber} mono />
        <KpiCard label="Red (>0.25)" value={fmtNum(zoneCounts.RED)} sub="significant drift — retrain" accent={T.red} mono />
        <KpiCard label="Avg PSI" value={(driftTable.reduce((a, d) => a + d.psi, 0) / Math.max(1, driftTable.length)).toFixed(3)} sub={`max = ${Math.max(...driftTable.map(d => d.psi)).toFixed(3)}`} accent={T.gold} mono />
      </div>

      <Card>
        <SectionHeader title="Population Stability Index (PSI) — Heatmap" subtitle="// Σ (new% − old%) · ln(new% / old%) per feature · traffic-light classification"
          right={
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'GREEN', 'AMBER', 'RED'].map(z => (
                <div key={z} onClick={() => setAlertBand(z)} style={{ padding: '5px 10px', fontSize: 10.5, fontFamily: T.mono, cursor: 'pointer', fontWeight: alertBand === z ? 700 : 500, background: alertBand === z ? T.navy : T.surface, color: alertBand === z ? '#fff' : T.textSec, border: `1px solid ${alertBand === z ? T.navy : T.border}`, borderRadius: 3 }}>{z}</div>
              ))}
            </div>
          } />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {sortedDrift.map(d => {
            const color = d.zone === 'RED' ? T.red : d.zone === 'AMBER' ? T.amber : T.sage;
            const bg = d.zone === 'RED' ? '#fde8e8' : d.zone === 'AMBER' ? '#fdf4e3' : '#e8f5ec';
            return (
              <div key={d.feature} onClick={() => setSelectedFeat(d.feature)} style={{ padding: 10, background: bg, border: `1px solid ${color}`, borderRadius: 4, cursor: 'pointer', opacity: selectedFeat === d.feature ? 1 : 0.85, boxShadow: selectedFeat === d.feature ? `0 0 0 2px ${T.navy}` : 'none' }}>
                <div style={{ fontSize: 10, color: T.text, fontFamily: T.mono, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.feature}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color, fontFamily: T.mono }}>{d.psi.toFixed(3)}</span>
                  <span style={{ fontSize: 9, color: T.textSec, fontFamily: T.mono }}>KS={d.ks.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14, padding: 10, background: T.surfaceH, borderRadius: 4, fontSize: 10.5, color: T.textSec, fontFamily: T.mono }}>
          ● PSI &lt; 0.10 → no drift, no action. ● 0.10 ≤ PSI &lt; 0.25 → moderate drift, investigate root cause. ● PSI ≥ 0.25 → significant distribution shift, trigger model retrain.
        </div>
      </Card>

      <Card>
        <SectionHeader title={`Feature Drill-Down: ${selected.feature}`} subtitle={`// PSI = ${selected.psi.toFixed(4)} · KS = ${selected.ks.toFixed(3)} · zone = ${selected.zone}`} />
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10.5, color: T.textSec, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Reference vs Current Distribution</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={distChartData}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="bin" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="reference" fill={T.textMut} name="Reference (2024 Q4)" />
                <Bar dataKey="current" fill={selected.zone === 'RED' ? T.red : selected.zone === 'AMBER' ? T.amber : T.sage} name="Current (2026 Q1)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: T.textSec, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Drift Metrics</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ padding: 12, background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 4 }}>
                <div style={{ fontSize: 10, color: T.textSec, fontFamily: T.mono }}>PSI</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: selected.zone === 'RED' ? T.red : selected.zone === 'AMBER' ? T.amber : T.sage, fontFamily: T.mono }}>{selected.psi.toFixed(4)}</div>
              </div>
              <div style={{ padding: 12, background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 4 }}>
                <div style={{ fontSize: 10, color: T.textSec, fontFamily: T.mono }}>Kolmogorov-Smirnov D</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.navy, fontFamily: T.mono }}>{selected.ks.toFixed(4)}</div>
              </div>
              <div style={{ padding: 12, background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 4 }}>
                <div style={{ fontSize: 10, color: T.textSec, fontFamily: T.mono }}>Mean Shift</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: T.mono }}>
                  {selected.refMean.toFixed(3)} → {selected.curMean.toFixed(3)}
                  <span style={{ marginLeft: 8, color: Math.abs(selected.curMean - selected.refMean) > 0.05 ? T.amber : T.green, fontSize: 12 }}>
                    Δ {(selected.curMean - selected.refMean >= 0 ? '+' : '') + (selected.curMean - selected.refMean).toFixed(3)}
                  </span>
                </div>
              </div>
              <div style={{ padding: 12, background: selected.zone === 'RED' ? '#fde8e8' : selected.zone === 'AMBER' ? '#fdf4e3' : '#e8f5ec', border: `1px solid ${T.border}`, borderRadius: 4 }}>
                <div style={{ fontSize: 10, color: T.textSec, fontFamily: T.mono }}>Recommended Action</div>
                <div style={{ fontSize: 11.5, color: T.text, fontFamily: T.font, marginTop: 4 }}>
                  {selected.zone === 'RED' && 'Trigger full model retrain. Validate on holdout before promotion.'}
                  {selected.zone === 'AMBER' && 'Investigate root cause. Log to drift register. Consider incremental calibration.'}
                  {selected.zone === 'GREEN' && 'No action required. Continue monitoring cadence.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 19 — A/B Testing Lab (2-model head-to-head)
// ─────────────────────────────────────────────────────────────────────────────
function AbTestingTab() {
  const [trafficSplit, setTrafficSplit] = useState(50);
  const [threshold, setThreshold] = useState(0.50);
  const [showPromote, setShowPromote] = useState(false);

  // Synthesize predictions for both models across ISSUERS-expanded 400-sample test set
  const abSamples = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 400; i++) {
      const base = ISSUERS[i % ISSUERS.length];
      const champScore = clamp(base.aligned + (sr(i * 11 + 55) - 0.5) * 0.10, 0, 1);
      const challScore = clamp(base.aligned + (sr(i * 13 + 77) - 0.5) * 0.08 + 0.02, 0, 1);
      const trueP = clamp(base.aligned + (sr(i * 9 + 3) - 0.5) * 0.03, 0, 1);
      const actual = trueP >= 0.5 ? 1 : 0;
      arr.push({ id: i, issuer: base.name, champScore, challScore, actual });
    }
    return arr;
  }, []);

  const abStats = useMemo(() => {
    // McNemar contingency: b = champ correct & challenger wrong, c = champ wrong & challenger correct
    let b = 0, c = 0, bothCorrect = 0, bothWrong = 0;
    let champTP = 0, champFP = 0, champFN = 0, champTN = 0;
    let chTP = 0, chFP = 0, chFN = 0, chTN = 0;
    const disagreements = [];

    abSamples.forEach(s => {
      const champPred = s.champScore >= threshold ? 1 : 0;
      const chPred = s.challScore >= threshold ? 1 : 0;
      const champCorrect = champPred === s.actual;
      const chCorrect = chPred === s.actual;

      if (champCorrect && chCorrect) bothCorrect++;
      else if (!champCorrect && !chCorrect) bothWrong++;
      else if (champCorrect && !chCorrect) b++;
      else c++;

      if (champPred && s.actual) champTP++;
      else if (champPred && !s.actual) champFP++;
      else if (!champPred && s.actual) champFN++;
      else champTN++;

      if (chPred && s.actual) chTP++;
      else if (chPred && !s.actual) chFP++;
      else if (!chPred && s.actual) chFN++;
      else chTN++;

      if (champPred !== chPred) {
        disagreements.push({ ...s, champPred, chPred });
      }
    });

    const N = abSamples.length;
    const champAcc = (champTP + champTN) / Math.max(1, N);
    const chAcc = (chTP + chTN) / Math.max(1, N);
    const champPrec = champTP / Math.max(1, champTP + champFP);
    const chPrec = chTP / Math.max(1, chTP + chFP);
    const champRec = champTP / Math.max(1, champTP + champFN);
    const chRec = chTP / Math.max(1, chTP + chFN);
    const champF1 = 2 * champPrec * champRec / Math.max(0.0001, champPrec + champRec);
    const chF1 = 2 * chPrec * chRec / Math.max(0.0001, chPrec + chRec);

    const agreementPct = (bothCorrect + bothWrong) / Math.max(1, N) * 100;

    // McNemar's chi-square: (b - c)^2 / (b + c) — with continuity correction
    const mcnemarChi = (Math.abs(b - c) - 1) ** 2 / Math.max(1, b + c);
    // p-value approx from chi-square 1 d.f. — simple thresholds
    const significant = mcnemarChi > 3.841;  // p < 0.05
    const highlyScSig = mcnemarChi > 6.635;   // p < 0.01

    return {
      N, b, c, bothCorrect, bothWrong,
      champAcc, chAcc, champPrec, chPrec, champRec, chRec, champF1, chF1,
      agreementPct, mcnemarChi, significant, highlyScSig,
      disagreements: disagreements.slice(0, 15),
      disagreeTotal: disagreements.length
    };
  }, [abSamples, threshold]);

  const comparisonData = [
    { metric: 'Accuracy', Champion: abStats.champAcc * 100, Challenger: abStats.chAcc * 100 },
    { metric: 'Precision', Champion: abStats.champPrec * 100, Challenger: abStats.chPrec * 100 },
    { metric: 'Recall', Champion: abStats.champRec * 100, Challenger: abStats.chRec * 100 },
    { metric: 'F1', Champion: abStats.champF1 * 100, Challenger: abStats.chF1 * 100 }
  ];

  const trafficAllocation = useMemo(() => {
    return [
      { name: 'Champion', value: 100 - trafficSplit, fill: AB_MODELS[0].color },
      { name: 'Challenger', value: trafficSplit, fill: AB_MODELS[1].color }
    ];
  }, [trafficSplit]);

  const promote = abStats.chAcc > abStats.champAcc && abStats.significant;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <SectionHeader title="A/B Testing Lab — Champion vs Challenger" subtitle={`// traffic split · ${100 - trafficSplit}% → Champion · ${trafficSplit}% → Challenger · N = ${abStats.N}`}
          right={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 10.5, color: T.textSec, fontFamily: T.mono }}>DECISION THR</span>
              <input type="range" min="0.2" max="0.8" step="0.01" value={threshold} onChange={e => setThreshold(parseFloat(e.target.value))} style={{ width: 120 }} />
              <span style={{ fontSize: 12, color: T.navy, fontWeight: 700, fontFamily: T.mono }}>{threshold.toFixed(2)}</span>
            </div>
          } />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {AB_MODELS.map((m, i) => {
            const isChamp = i === 0;
            const acc = isChamp ? abStats.champAcc : abStats.chAcc;
            const prec = isChamp ? abStats.champPrec : abStats.chPrec;
            const rec = isChamp ? abStats.champRec : abStats.chRec;
            const f1 = isChamp ? abStats.champF1 : abStats.chF1;
            const traffic = isChamp ? 100 - trafficSplit : trafficSplit;
            return (
              <div key={m.id} style={{ padding: 16, background: T.surfaceH, border: `2px solid ${m.color}`, borderRadius: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5 }}>{isChamp ? 'CHAMPION (Prod)' : 'CHALLENGER (Candidate)'}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: m.color, fontFamily: T.font, marginTop: 3 }}>{m.name}</div>
                  </div>
                  <div style={{ padding: '5px 11px', background: m.color, color: '#fff', borderRadius: 3, fontSize: 11, fontFamily: T.mono, fontWeight: 700 }}>{traffic}% traffic</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    { l: 'Acc', v: acc },
                    { l: 'Prec', v: prec },
                    { l: 'Rec', v: rec },
                    { l: 'F1', v: f1 }
                  ].map(m2 => (
                    <div key={m2.l} style={{ padding: 8, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 3 }}>
                      <div style={{ fontSize: 9.5, color: T.textSec, fontFamily: T.mono, textTransform: 'uppercase' }}>{m2.l}</div>
                      <div style={{ fontSize: 17, color: T.navy, fontWeight: 700, fontFamily: T.mono, marginTop: 2 }}>{(m2.v * 100).toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10.5, color: T.textSec, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Traffic Allocation Slider · {100 - trafficSplit}% / {trafficSplit}%</div>
          <input type="range" min="0" max="100" step="5" value={trafficSplit} onChange={e => setTrafficSplit(parseInt(e.target.value, 10))} style={{ width: '100%' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMut, fontFamily: T.mono, marginTop: 2 }}>
            {AB_TRAFFIC.map(t => <span key={t}>{t}% Challenger</span>)}
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Statistical Significance — McNemar's Test" subtitle={`// paired-comparison χ² test · disagreements = ${abStats.disagreeTotal} of ${abStats.N}`} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10.5, color: T.textSec, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Contingency Table</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 11.5 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  <th style={{ padding: 9 }}></th>
                  <th style={{ padding: 9 }}>Chall: Correct</th>
                  <th style={{ padding: 9 }}>Chall: Wrong</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: 10, background: T.surfaceH, fontWeight: 700 }}>Champ: Correct</td>
                  <td style={{ padding: 14, textAlign: 'center', background: '#e8f5ec', color: T.green, fontWeight: 700, fontSize: 18 }}>{abStats.bothCorrect}</td>
                  <td style={{ padding: 14, textAlign: 'center', background: '#faf4e6', color: T.gold, fontWeight: 700, fontSize: 18 }}>b = {abStats.b}</td>
                </tr>
                <tr>
                  <td style={{ padding: 10, background: T.surfaceH, fontWeight: 700 }}>Champ: Wrong</td>
                  <td style={{ padding: 14, textAlign: 'center', background: '#faf4e6', color: T.gold, fontWeight: 700, fontSize: 18 }}>c = {abStats.c}</td>
                  <td style={{ padding: 14, textAlign: 'center', background: '#fde8e8', color: T.red, fontWeight: 700, fontSize: 18 }}>{abStats.bothWrong}</td>
                </tr>
              </tbody>
            </table>
            <div style={{ marginTop: 14, padding: 14, background: abStats.highlyScSig ? '#fde8e8' : abStats.significant ? '#faf4e6' : T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 4 }}>
              <div style={{ fontSize: 10.5, color: T.textSec, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5 }}>McNemar's χ² = (|b − c| − 1)² / (b + c)</div>
              <div style={{ fontSize: 28, color: abStats.highlyScSig ? T.red : abStats.significant ? T.gold : T.textSec, fontWeight: 700, fontFamily: T.mono, marginTop: 4 }}>{abStats.mcnemarChi.toFixed(3)}</div>
              <div style={{ fontSize: 11, color: T.text, fontFamily: T.mono, marginTop: 6 }}>
                {abStats.highlyScSig && '✓ Highly significant (p < 0.01) — models differ materially'}
                {abStats.significant && !abStats.highlyScSig && '✓ Significant (p < 0.05) — reject H₀ of equal performance'}
                {!abStats.significant && '✗ Not significant — insufficient evidence of difference'}
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: T.textSec, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Head-to-Head Metrics</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={comparisonData}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="metric" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }} formatter={(v) => `${v.toFixed(2)}%`} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Champion" fill={AB_MODELS[0].color} />
                <Bar dataKey="Challenger" fill={AB_MODELS[1].color} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 10, padding: 10, background: T.surfaceH, borderRadius: 4, fontSize: 11, color: T.text, fontFamily: T.mono, display: 'flex', justifyContent: 'space-between' }}>
              <span>Agreement:</span>
              <span style={{ fontWeight: 700, color: T.navy }}>{abStats.agreementPct.toFixed(1)}%</span>
            </div>
            <div style={{ marginTop: 8, padding: 10, background: T.surfaceH, borderRadius: 4, fontSize: 11, color: T.text, fontFamily: T.mono, display: 'flex', justifyContent: 'space-between' }}>
              <span>Disagreements:</span>
              <span style={{ fontWeight: 700, color: T.gold }}>{abStats.disagreeTotal}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Disagreement Drill-Down" subtitle="// first 15 cases where Champion and Challenger predictions differ"
          right={
            <div onClick={() => setShowPromote(!showPromote)} style={{ padding: '7px 13px', background: promote ? T.sage : T.textMut, color: '#fff', borderRadius: 4, fontFamily: T.mono, fontSize: 11, cursor: 'pointer', fontWeight: 700, letterSpacing: 0.3 }}>
              {promote ? '✓ PROMOTE CHALLENGER' : '✗ HOLD CHAMPION'}
            </div>
          } />
        <div style={{ overflow: 'hidden', borderRadius: 4, border: `1px solid ${T.border}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 11 }}>
            <thead>
              <tr style={{ background: T.navy, color: '#fff' }}>
                <th style={{ padding: 9, textAlign: 'left' }}>ID</th>
                <th style={{ padding: 9, textAlign: 'left' }}>Issuer</th>
                <th style={{ padding: 9, textAlign: 'right' }}>Champ Score</th>
                <th style={{ padding: 9, textAlign: 'center' }}>Champ Pred</th>
                <th style={{ padding: 9, textAlign: 'right' }}>Chall Score</th>
                <th style={{ padding: 9, textAlign: 'center' }}>Chall Pred</th>
                <th style={{ padding: 9, textAlign: 'center' }}>Actual</th>
                <th style={{ padding: 9, textAlign: 'center' }}>Winner</th>
              </tr>
            </thead>
            <tbody>
              {abStats.disagreements.map(d => {
                const champCorrect = d.champPred === d.actual;
                const chCorrect = d.chPred === d.actual;
                return (
                  <tr key={d.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 7 }}>{String(d.id).padStart(4, '0')}</td>
                    <td style={{ padding: 7 }}>{d.issuer}</td>
                    <td style={{ padding: 7, textAlign: 'right' }}>{d.champScore.toFixed(3)}</td>
                    <td style={{ padding: 7, textAlign: 'center' }}><Pill color={d.champPred ? T.green : T.red} bg={T.surfaceH}>{d.champPred ? 'ALIGN' : 'N-ALIGN'}</Pill></td>
                    <td style={{ padding: 7, textAlign: 'right' }}>{d.challScore.toFixed(3)}</td>
                    <td style={{ padding: 7, textAlign: 'center' }}><Pill color={d.chPred ? T.green : T.red} bg={T.surfaceH}>{d.chPred ? 'ALIGN' : 'N-ALIGN'}</Pill></td>
                    <td style={{ padding: 7, textAlign: 'center' }}><Pill color={d.actual ? T.navy : T.textSec} bg={T.surfaceH}>{d.actual ? 'POS' : 'NEG'}</Pill></td>
                    <td style={{ padding: 7, textAlign: 'center', fontWeight: 700, color: champCorrect ? AB_MODELS[0].color : chCorrect ? AB_MODELS[1].color : T.textMut }}>
                      {champCorrect ? 'Champ' : chCorrect ? 'Chall' : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {showPromote && (
          <div style={{ marginTop: 14, padding: 14, background: promote ? '#e8f5ec' : '#fdf4e3', border: `1px solid ${promote ? T.sage : T.amber}`, borderRadius: 4 }}>
            <div style={{ fontSize: 12, color: T.text, fontFamily: T.font, fontWeight: 700, marginBottom: 4 }}>{promote ? 'PROMOTE CHALLENGER TO PRODUCTION' : 'HOLD CURRENT CHAMPION'}</div>
            <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.mono }}>
              {promote
                ? `Challenger accuracy (${(abStats.chAcc * 100).toFixed(2)}%) exceeds Champion (${(abStats.champAcc * 100).toFixed(2)}%) with McNemar χ² = ${abStats.mcnemarChi.toFixed(3)} (p < 0.05). Schedule canary rollout at 10% → 25% → 50% → 100% traffic over 14 days.`
                : `Insufficient statistical evidence to promote. Continue monitoring. Consider extending test window or recalibrating challenger on additional validation folds.`}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default TaxonomyMlClassifierPage;
