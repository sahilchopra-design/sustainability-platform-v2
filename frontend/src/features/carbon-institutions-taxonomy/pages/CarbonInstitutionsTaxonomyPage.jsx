import React, { useState, useMemo, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ComposedChart, Area, AreaChart
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', surfaceH: '#f0ede7', border: '#e5e0d8', borderL: '#d5cfc5',
  navy: '#1b3a5c', navyL: '#2c5a8c', gold: '#c5a96a', goldL: '#d4be8a', sage: '#5a8a6a', sageL: '#7ba67d',
  teal: '#5a8a6a', text: '#1b3a5c', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706',
  font: "'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const hashStr = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i); return Math.abs(h); };
const fmt = (n, d = 1) => (n === null || n === undefined || isNaN(n) || !isFinite(n)) ? '—' : Number(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (n, d = 1) => (n === null || n === undefined || isNaN(n) || !isFinite(n)) ? '—' : `${Number(n).toFixed(d)}%`;
const cdpColor = (g) => g === 'A' ? T.green : g === 'A-' ? T.sage : g === 'B' ? T.sageL : g === 'B-' ? T.gold : g === 'C' ? T.goldL : g === 'C-' ? T.amber : g === 'D' ? '#e08a3a' : T.red;

const ISSUERS = [
  { ticker: 'MSFT', name: 'Microsoft', sector: 'Tech', region: 'NA', mcap: 3100, cdp: 'A', sbti: '1.5C-Val', art6: true, vcmi: 'Gold', icvcm: 95 },
  { ticker: 'GOOGL', name: 'Alphabet', sector: 'Tech', region: 'NA', mcap: 2050, cdp: 'A-', sbti: '1.5C-Val', art6: true, vcmi: 'Gold', icvcm: 92 },
  { ticker: 'AAPL', name: 'Apple', sector: 'Tech', region: 'NA', mcap: 3400, cdp: 'A', sbti: '1.5C-Val', art6: false, vcmi: 'Silver', icvcm: 88 },
  { ticker: 'NSRGY', name: 'Nestle', sector: 'Consumer', region: 'EU', mcap: 340, cdp: 'A', sbti: '1.5C-Val', art6: true, vcmi: 'Gold', icvcm: 90 },
  { ticker: 'UL', name: 'Unilever', sector: 'Consumer', region: 'EU', mcap: 145, cdp: 'A', sbti: '1.5C-Val', art6: true, vcmi: 'Silver', icvcm: 87 },
  { ticker: 'XOM', name: 'ExxonMobil', sector: 'Energy', region: 'NA', mcap: 450, cdp: 'D', sbti: 'None', art6: false, vcmi: 'None', icvcm: 22 },
  { ticker: 'SHEL', name: 'Shell', sector: 'Energy', region: 'EU', mcap: 230, cdp: 'B', sbti: 'Committed', art6: true, vcmi: 'Bronze', icvcm: 55 },
  { ticker: 'BP', name: 'BP', sector: 'Energy', region: 'EU', mcap: 110, cdp: 'B-', sbti: 'Committed', art6: true, vcmi: 'Bronze', icvcm: 52 },
  { ticker: 'CVX', name: 'Chevron', sector: 'Energy', region: 'NA', mcap: 310, cdp: 'C', sbti: 'None', art6: false, vcmi: 'None', icvcm: 28 },
  { ticker: 'TTE', name: 'TotalEnergies', sector: 'Energy', region: 'EU', mcap: 165, cdp: 'B', sbti: 'WB2C-Val', art6: true, vcmi: 'Silver', icvcm: 65 },
  { ticker: 'NEE', name: 'NextEra', sector: 'Utilities', region: 'NA', mcap: 160, cdp: 'A-', sbti: '1.5C-Val', art6: true, vcmi: 'Gold', icvcm: 89 },
  { ticker: 'IBDSF', name: 'Iberdrola', sector: 'Utilities', region: 'EU', mcap: 85, cdp: 'A', sbti: '1.5C-Val', art6: true, vcmi: 'Gold', icvcm: 93 },
  { ticker: 'ENGIY', name: 'Engie', sector: 'Utilities', region: 'EU', mcap: 45, cdp: 'A-', sbti: '1.5C-Val', art6: true, vcmi: 'Silver', icvcm: 84 },
  { ticker: 'VWS', name: 'Vestas', sector: 'Industrials', region: 'EU', mcap: 24, cdp: 'A', sbti: '1.5C-Val', art6: false, vcmi: 'Silver', icvcm: 86 },
  { ticker: 'SIEGY', name: 'Siemens', sector: 'Industrials', region: 'EU', mcap: 160, cdp: 'A-', sbti: '1.5C-Val', art6: true, vcmi: 'Silver', icvcm: 82 },
  { ticker: 'HON', name: 'Honeywell', sector: 'Industrials', region: 'NA', mcap: 135, cdp: 'B', sbti: 'WB2C-Val', art6: false, vcmi: 'Bronze', icvcm: 68 },
  { ticker: 'MT', name: 'ArcelorMittal', sector: 'Materials', region: 'EU', mcap: 22, cdp: 'B', sbti: 'Committed', art6: true, vcmi: 'Bronze', icvcm: 58 },
  { ticker: '5401', name: 'Nippon Steel', sector: 'Materials', region: 'APAC', mcap: 28, cdp: 'C', sbti: 'Committed', art6: true, vcmi: 'None', icvcm: 42 },
  { ticker: 'HEI', name: 'HeidelbergCement', sector: 'Materials', region: 'EU', mcap: 20, cdp: 'A-', sbti: '1.5C-Val', art6: true, vcmi: 'Silver', icvcm: 78 },
  { ticker: 'LAFARGE', name: 'Holcim', sector: 'Materials', region: 'EU', mcap: 44, cdp: 'A', sbti: '1.5C-Val', art6: true, vcmi: 'Gold', icvcm: 85 },
  { ticker: 'JPM', name: 'JPMorgan', sector: 'Financials', region: 'NA', mcap: 640, cdp: 'A-', sbti: 'Committed', art6: true, vcmi: 'Silver', icvcm: 72 },
  { ticker: 'HSBA', name: 'HSBC', sector: 'Financials', region: 'EU', mcap: 165, cdp: 'A', sbti: '1.5C-Val', art6: true, vcmi: 'Gold', icvcm: 81 },
  { ticker: 'BARC', name: 'Barclays', sector: 'Financials', region: 'EU', mcap: 40, cdp: 'A-', sbti: 'WB2C-Val', art6: true, vcmi: 'Silver', icvcm: 75 },
  { ticker: 'GS', name: 'Goldman Sachs', sector: 'Financials', region: 'NA', mcap: 155, cdp: 'A-', sbti: 'Committed', art6: false, vcmi: 'Bronze', icvcm: 70 },
  { ticker: 'WMT', name: 'Walmart', sector: 'Consumer', region: 'NA', mcap: 560, cdp: 'A-', sbti: '1.5C-Val', art6: false, vcmi: 'Silver', icvcm: 79 },
  { ticker: 'PG', name: 'Procter & Gamble', sector: 'Consumer', region: 'NA', mcap: 395, cdp: 'A-', sbti: '1.5C-Val', art6: true, vcmi: 'Silver', icvcm: 80 },
  { ticker: 'TM', name: 'Toyota', sector: 'Auto', region: 'APAC', mcap: 285, cdp: 'A-', sbti: 'WB2C-Val', art6: true, vcmi: 'Bronze', icvcm: 68 },
  { ticker: 'VOW3', name: 'Volkswagen', sector: 'Auto', region: 'EU', mcap: 65, cdp: 'A-', sbti: '1.5C-Val', art6: true, vcmi: 'Silver', icvcm: 77 },
  { ticker: 'TSLA', name: 'Tesla', sector: 'Auto', region: 'NA', mcap: 780, cdp: 'B', sbti: 'None', art6: false, vcmi: 'None', icvcm: 48 },
  { ticker: 'RIO', name: 'Rio Tinto', sector: 'Materials', region: 'EU', mcap: 110, cdp: 'A-', sbti: '1.5C-Val', art6: true, vcmi: 'Silver', icvcm: 83 }
];

const CDP_SCORES = ISSUERS.map((iss, i) => {
  const years = ['2020', '2021', '2022', '2023', '2024'];
  const trajectory = years.map((y, j) => {
    const base = iss.icvcm / 100;
    const trend = 0.45 + base * 0.45 + j * 0.03 * base + sr(hashStr(iss.ticker) + j) * 0.08 - 0.04;
    return { year: y, score: Math.max(0, Math.min(1, trend)) };
  });
  return {
    ...iss,
    climate: iss.cdp, water: ['A', 'A-', 'B', 'B-', 'C'][Math.floor(sr(i + 7) * 5)],
    forest: ['A', 'A-', 'B', 'C', '-'][Math.floor(sr(i + 11) * 5)],
    disclosureYear: 2015 + Math.floor(sr(i + 3) * 6),
    scope3Disc: iss.cdp === 'A' || iss.cdp === 'A-',
    verif: iss.cdp.startsWith('A') ? 'Reasonable' : iss.cdp.startsWith('B') ? 'Limited' : 'None',
    engagements: 3 + Math.floor(sr(i + 17) * 25),
    trajectory
  };
});

const SBTI_TARGETS = ISSUERS.map((iss, i) => {
  const baseY = 2018 + Math.floor(sr(i) * 3);
  const tgtY = 2030 + Math.floor(sr(i + 5) * 10);
  const redux = iss.sbti === '1.5C-Val' ? 46 + sr(i + 2) * 10 : iss.sbti === 'WB2C-Val' ? 30 + sr(i + 2) * 8 : iss.sbti === 'Committed' ? 25 + sr(i + 2) * 8 : 0;
  return {
    ...iss,
    tier: iss.sbti,
    s12Target: redux.toFixed(1),
    s3Target: (redux * 0.6).toFixed(1),
    baseYear: baseY,
    targetYear: tgtY,
    netZeroYear: iss.sbti === '1.5C-Val' ? 2040 + Math.floor(sr(i + 8) * 10) : iss.sbti === 'None' ? null : 2050,
    status: iss.sbti === 'None' ? 'No Target' : iss.sbti === 'Committed' ? 'Committed' : 'Validated',
    pathway: iss.sbti === '1.5C-Val' ? 'SDA / Cross-Sector 1.5C' : iss.sbti === 'WB2C-Val' ? 'Cross-Sector WB2C' : iss.sbti === 'Committed' ? 'In Progress' : 'n/a',
    progress: iss.sbti === 'None' ? 0 : Math.min(100, (redux * 0.3) + sr(i + 19) * 30)
  };
});

const VCM_PROJECTS = [
  { id: 'VCM-001', name: 'Katingan Peatland REDD+', type: 'REDD+', region: 'APAC', country: 'Indonesia', standard: 'VCS', vintage: 2022, volume: 7.2, price: 8.4, ccp: true, corsia: true, icroa: true, rating: 'A' },
  { id: 'VCM-002', name: 'Rimba Raya REDD+', type: 'REDD+', region: 'APAC', country: 'Indonesia', standard: 'VCS+CCB', vintage: 2023, volume: 5.8, price: 9.2, ccp: true, corsia: true, icroa: true, rating: 'A' },
  { id: 'VCM-003', name: 'Kariba REDD+', type: 'REDD+', region: 'AF', country: 'Zimbabwe', standard: 'VCS', vintage: 2021, volume: 3.1, price: 4.2, ccp: false, corsia: false, icroa: true, rating: 'D' },
  { id: 'VCM-004', name: 'Gola Rainforest', type: 'REDD+', region: 'AF', country: 'Sierra Leone', standard: 'VCS+CCB', vintage: 2023, volume: 0.9, price: 12.1, ccp: true, corsia: true, icroa: true, rating: 'A' },
  { id: 'VCM-005', name: 'Cordillera Azul', type: 'REDD+', region: 'LATAM', country: 'Peru', standard: 'VCS', vintage: 2022, volume: 4.8, price: 6.8, ccp: true, corsia: true, icroa: true, rating: 'B' },
  { id: 'VCM-006', name: 'ACR Improved Forest Mgmt', type: 'IFM', region: 'NA', country: 'USA', standard: 'ACR', vintage: 2023, volume: 2.4, price: 14.5, ccp: true, corsia: true, icroa: true, rating: 'A' },
  { id: 'VCM-007', name: 'CAR Grassland Conservation', type: 'ARR', region: 'NA', country: 'USA', standard: 'CAR', vintage: 2023, volume: 1.2, price: 18.2, ccp: true, corsia: true, icroa: true, rating: 'A' },
  { id: 'VCM-008', name: 'Odisha Cookstoves', type: 'Cookstove', region: 'APAC', country: 'India', standard: 'GS', vintage: 2022, volume: 3.4, price: 7.5, ccp: true, corsia: true, icroa: true, rating: 'B' },
  { id: 'VCM-009', name: 'Kenya Borehole Water', type: 'Water', region: 'AF', country: 'Kenya', standard: 'GS', vintage: 2021, volume: 0.6, price: 5.8, ccp: false, corsia: true, icroa: true, rating: 'C' },
  { id: 'VCM-010', name: 'Mongolia Wind', type: 'Renewable', region: 'APAC', country: 'Mongolia', standard: 'VCS', vintage: 2020, volume: 0.8, price: 2.4, ccp: false, corsia: false, icroa: true, rating: 'D' },
  { id: 'VCM-011', name: 'Texas CCS Pilot', type: 'CCS', region: 'NA', country: 'USA', standard: 'ACR', vintage: 2023, volume: 1.5, price: 95, ccp: true, corsia: true, icroa: true, rating: 'A' },
  { id: 'VCM-012', name: 'Iceland DAC', type: 'DAC', region: 'EU', country: 'Iceland', standard: 'Puro', vintage: 2023, volume: 0.04, price: 650, ccp: true, corsia: false, icroa: false, rating: 'A' },
  { id: 'VCM-013', name: 'Finland Biochar', type: 'Biochar', region: 'EU', country: 'Finland', standard: 'Puro', vintage: 2023, volume: 0.12, price: 180, ccp: true, corsia: false, icroa: true, rating: 'A' },
  { id: 'VCM-014', name: 'Kelp Aquaculture BCR', type: 'Blue Carbon', region: 'APAC', country: 'Philippines', standard: 'VCS', vintage: 2023, volume: 0.3, price: 28, ccp: true, corsia: true, icroa: true, rating: 'B' },
  { id: 'VCM-015', name: 'Sundarbans Mangrove', type: 'Blue Carbon', region: 'APAC', country: 'Bangladesh', standard: 'VCS+CCB', vintage: 2022, volume: 0.45, price: 22, ccp: true, corsia: true, icroa: true, rating: 'A' },
  { id: 'VCM-016', name: 'Amazon ARR Brazil', type: 'ARR', region: 'LATAM', country: 'Brazil', standard: 'VCS+CCB', vintage: 2023, volume: 1.8, price: 16.5, ccp: true, corsia: true, icroa: true, rating: 'A' },
  { id: 'VCM-017', name: 'Uganda Agroforestry', type: 'ARR', region: 'AF', country: 'Uganda', standard: 'Plan Vivo', vintage: 2022, volume: 0.32, price: 20, ccp: true, corsia: false, icroa: true, rating: 'A' },
  { id: 'VCM-018', name: 'China HFC-23 Destruction', type: 'HFC', region: 'APAC', country: 'China', standard: 'CDM', vintage: 2012, volume: 8.5, price: 0.6, ccp: false, corsia: false, icroa: false, rating: 'F' },
  { id: 'VCM-019', name: 'N2O Nitric Acid Pakistan', type: 'N2O', region: 'APAC', country: 'Pakistan', standard: 'CDM', vintage: 2015, volume: 2.1, price: 0.9, ccp: false, corsia: false, icroa: false, rating: 'F' },
  { id: 'VCM-020', name: 'Methane Capture Landfill', type: 'Methane', region: 'NA', country: 'USA', standard: 'ACR', vintage: 2023, volume: 0.9, price: 16, ccp: true, corsia: true, icroa: true, rating: 'A' },
  { id: 'VCM-021', name: 'Biogas India Dairy', type: 'Biogas', region: 'APAC', country: 'India', standard: 'GS', vintage: 2022, volume: 0.7, price: 8.5, ccp: true, corsia: true, icroa: true, rating: 'B' },
  { id: 'VCM-022', name: 'Papua NG Peatland', type: 'REDD+', region: 'APAC', country: 'PNG', standard: 'VCS', vintage: 2022, volume: 1.4, price: 7.2, ccp: false, corsia: false, icroa: true, rating: 'C' },
  { id: 'VCM-023', name: 'Enhanced Weathering Basalt', type: 'EW', region: 'EU', country: 'UK', standard: 'Isometric', vintage: 2024, volume: 0.02, price: 250, ccp: true, corsia: false, icroa: false, rating: 'A' },
  { id: 'VCM-024', name: 'Ocean Alkalinity CDR', type: 'Ocean', region: 'NA', country: 'USA', standard: 'Isometric', vintage: 2024, volume: 0.01, price: 340, ccp: true, corsia: false, icroa: false, rating: 'A' },
  { id: 'VCM-025', name: 'Brazil Agroforestry Cocoa', type: 'ARR', region: 'LATAM', country: 'Brazil', standard: 'Plan Vivo', vintage: 2023, volume: 0.24, price: 26, ccp: true, corsia: false, icroa: true, rating: 'A' }
];

const ICVCM_CCPS = [
  { num: 1, pillar: 'Governance', name: 'Effective Governance', desc: 'Crediting programs shall ensure effective governance to maintain transparency, accountability, ongoing improvement and overall quality of carbon credits.', compliance: 92 },
  { num: 2, pillar: 'Governance', name: 'Tracking', desc: 'Operate or use a registry to uniquely identify, record, and track credits issued, ensuring they are easily identifiable.', compliance: 96 },
  { num: 3, pillar: 'Governance', name: 'Transparency', desc: 'Provide comprehensive, transparent, and publicly available information on all projects and programs.', compliance: 88 },
  { num: 4, pillar: 'Governance', name: 'Robust Third-Party Validation', desc: 'Independent third-party validation and verification of projects based on sound, transparent and impartial processes.', compliance: 90 },
  { num: 5, pillar: 'Emissions Impact', name: 'Additionality', desc: 'GHG emission reductions or removals shall be additional — would not have occurred in the absence of the incentive from carbon credit revenues.', compliance: 72 },
  { num: 6, pillar: 'Emissions Impact', name: 'Permanence', desc: 'Projects shall have measures in place to address reversal risks and ensure GHG reductions/removals are permanent or reversals are fully compensated.', compliance: 68 },
  { num: 7, pillar: 'Emissions Impact', name: 'Robust Quantification', desc: 'GHG emission reductions/removals shall be robustly quantified based on conservative approaches, completeness and scientific methods.', compliance: 78 },
  { num: 8, pillar: 'Emissions Impact', name: 'No Double Counting', desc: 'Credits shall not be double counted — only claimed once toward achieving mitigation targets/goals.', compliance: 85 },
  { num: 9, pillar: 'Sustainable Development', name: 'Sustainable Development Benefits & Safeguards', desc: 'Projects shall conform with widely established industry best practices on social and environmental safeguards and deliver positive SDG benefits.', compliance: 74 },
  { num: 10, pillar: 'Sustainable Development', name: 'Contribution to Net-Zero Transition', desc: 'Projects shall avoid locking in levels of emissions, technologies or carbon-intensive practices incompatible with achieving net zero by mid-century.', compliance: 69 }
];

const VCMI_CLAIMS = [
  { entity: 'Microsoft', claim: 'Platinum', vintage: 2024, volume: 5.1, coverage: 100, prereqCheck: true, removals: 4.6, avoidance: 0.5 },
  { entity: 'Alphabet', claim: 'Gold', vintage: 2024, volume: 2.8, coverage: 92, prereqCheck: true, removals: 2.1, avoidance: 0.7 },
  { entity: 'Nestle', claim: 'Gold', vintage: 2023, volume: 3.4, coverage: 88, prereqCheck: true, removals: 1.8, avoidance: 1.6 },
  { entity: 'Unilever', claim: 'Silver', vintage: 2023, volume: 1.9, coverage: 72, prereqCheck: true, removals: 0.8, avoidance: 1.1 },
  { entity: 'Holcim', claim: 'Gold', vintage: 2024, volume: 2.2, coverage: 85, prereqCheck: true, removals: 0.9, avoidance: 1.3 },
  { entity: 'Iberdrola', claim: 'Gold', vintage: 2024, volume: 1.6, coverage: 95, prereqCheck: true, removals: 0.4, avoidance: 1.2 },
  { entity: 'HSBC', claim: 'Silver', vintage: 2023, volume: 0.9, coverage: 68, prereqCheck: true, removals: 0.3, avoidance: 0.6 },
  { entity: 'Apple', claim: 'Silver', vintage: 2024, volume: 1.4, coverage: 76, prereqCheck: true, removals: 1.1, avoidance: 0.3 },
  { entity: 'Volkswagen', claim: 'Silver', vintage: 2023, volume: 1.2, coverage: 65, prereqCheck: true, removals: 0.5, avoidance: 0.7 },
  { entity: 'Shell', claim: 'Bronze', vintage: 2023, volume: 3.8, coverage: 42, prereqCheck: false, removals: 0.6, avoidance: 3.2 },
  { entity: 'TotalEnergies', claim: 'Silver', vintage: 2024, volume: 2.1, coverage: 62, prereqCheck: true, removals: 0.8, avoidance: 1.3 },
  { entity: 'JPMorgan', claim: 'Silver', vintage: 2023, volume: 0.7, coverage: 58, prereqCheck: true, removals: 0.4, avoidance: 0.3 }
];

const ARTICLE6_PILOTS = [
  { pilot: 'Switzerland-Ghana', host: 'Ghana', buyer: 'Switzerland', type: '6.2', activity: 'Rice Cultivation Methane', itmos: 1.1, ca: true, start: 2022, price: 15 },
  { pilot: 'Switzerland-Peru', host: 'Peru', buyer: 'Switzerland', type: '6.2', activity: 'Cookstoves', itmos: 0.9, ca: true, start: 2020, price: 12 },
  { pilot: 'Japan-Vietnam JCM', host: 'Vietnam', buyer: 'Japan', type: '6.2', activity: 'Energy Efficiency', itmos: 2.3, ca: true, start: 2013, price: 8 },
  { pilot: 'Japan-Indonesia JCM', host: 'Indonesia', buyer: 'Japan', type: '6.2', activity: 'Solar PV', itmos: 1.8, ca: true, start: 2013, price: 7.5 },
  { pilot: 'Sweden-Ghana', host: 'Ghana', buyer: 'Sweden', type: '6.2', activity: 'Waste Management', itmos: 0.6, ca: true, start: 2023, price: 18 },
  { pilot: 'Singapore-Papua NG', host: 'PNG', buyer: 'Singapore', type: '6.2', activity: 'REDD+', itmos: 2.1, ca: true, start: 2023, price: 22 },
  { pilot: 'Korea-Vietnam', host: 'Vietnam', buyer: 'Korea', type: '6.2', activity: 'Waste-to-Energy', itmos: 0.8, ca: true, start: 2023, price: 11 },
  { pilot: 'UAE-Kenya', host: 'Kenya', buyer: 'UAE', type: '6.2', activity: 'Geothermal', itmos: 1.4, ca: true, start: 2023, price: 14 },
  { pilot: 'Singapore-Bhutan', host: 'Bhutan', buyer: 'Singapore', type: '6.2', activity: 'Hydro+Forest', itmos: 0.7, ca: true, start: 2024, price: 25 },
  { pilot: 'Art 6.4 Mechanism', host: 'Global', buyer: 'UN-SBM', type: '6.4', activity: 'A6.4ERs (CDM-successor)', itmos: 0, ca: true, start: 2024, price: 0 },
  { pilot: 'EU-Liberia', host: 'Liberia', buyer: 'EU', type: '6.2', activity: 'REDD+', itmos: 0.3, ca: true, start: 2024, price: 19 },
  { pilot: 'UK-Rwanda', host: 'Rwanda', buyer: 'UK', type: '6.2', activity: 'Clean Cooking', itmos: 0.5, ca: true, start: 2024, price: 16 }
];

const ICROA_STANDARDS = [
  { std: 'Verra (VCS)', scope: 'All types', projects: 2100, mtIssued: 1180, endorsed: true, notes: 'Largest voluntary standard; undergoing CCP-alignment review.' },
  { std: 'Gold Standard', scope: 'Renewables / Cookstoves / Water / CR', projects: 2800, mtIssued: 285, endorsed: true, notes: 'Strong SDG focus; GS for the Global Goals framework.' },
  { std: 'Climate Action Reserve', scope: 'US/MX compliance + voluntary', projects: 490, mtIssued: 186, endorsed: true, notes: 'CCP-labeled for several protocols.' },
  { std: 'American Carbon Registry', scope: 'US + international', projects: 385, mtIssued: 278, endorsed: true, notes: 'CCP-labeled IFM + CCS/DAC ready.' },
  { std: 'Plan Vivo', scope: 'Smallholder ARR/Agroforestry', projects: 14, mtIssued: 8.4, endorsed: true, notes: 'Community-focused; smaller but highest-integrity.' },
  { std: 'Puro.earth', scope: 'Engineered CDR (Biochar/DAC/EW)', projects: 120, mtIssued: 0.9, endorsed: false, notes: 'CDR specialist; ICROA endorsement under review 2025.' },
  { std: 'Isometric', scope: 'Durable CDR', projects: 18, mtIssued: 0.05, endorsed: false, notes: 'Rigorous MRV; new 2023 entrant.' },
  { std: 'CDM (legacy)', scope: 'Kyoto CERs', projects: 7800, mtIssued: 2400, endorsed: false, notes: 'Transitioning to Art 6.4; legacy units excluded from CCP.' }
];

const CREDIT_QUALITY = VCM_PROJECTS.map((p, i) => {
  const h = hashStr(p.id);
  const addScore = p.ccp ? 70 + sr(h) * 25 : 30 + sr(h) * 35;
  const permScore = p.type === 'DAC' || p.type === 'CCS' || p.type === 'Biochar' || p.type === 'EW' ? 90 + sr(h + 1) * 8 : p.type === 'REDD+' || p.type === 'IFM' || p.type === 'ARR' ? 50 + sr(h + 1) * 20 : 70 + sr(h + 1) * 15;
  const mrv = p.icroa ? 75 + sr(h + 2) * 20 : 40 + sr(h + 2) * 25;
  const cob = p.ccp ? 72 + sr(h + 3) * 22 : 45 + sr(h + 3) * 25;
  const sdg = p.standard.includes('CCB') || p.standard === 'GS' || p.standard === 'Plan Vivo' ? 80 + sr(h + 4) * 15 : 50 + sr(h + 4) * 25;
  const overall = (addScore * 0.25 + permScore * 0.2 + mrv * 0.2 + cob * 0.2 + sdg * 0.15);
  const ratingLetter = overall >= 80 ? 'AAA' : overall >= 72 ? 'AA' : overall >= 64 ? 'A' : overall >= 55 ? 'BBB' : overall >= 45 ? 'BB' : overall >= 35 ? 'B' : 'C';
  return { ...p, additionality: addScore, permanence: permScore, mrv, cobenefits: cob, sdg, overall, qualityRating: ratingLetter };
});

const ROADMAP = [
  { year: 2024, q: 'Q1', title: 'ICVCM CCP labels launched', actor: 'ICVCM', impact: 'High', desc: 'First 8 program-level + 27 methodology-level CCP labels issued; sets quality floor for voluntary market.' },
  { year: 2024, q: 'Q2', title: 'VCMI Claims Code v2 operational', actor: 'VCMI', impact: 'High', desc: 'Gold/Silver/Bronze claims codes for corporate use with MPS prerequisite; first cohort of claim-makers.' },
  { year: 2024, q: 'Q3', title: 'Article 6.4 Supervisory Body approves first methodologies', actor: 'UNFCCC', impact: 'High', desc: 'A6.4ERs become issuable; centralized UN mechanism replaces CDM.' },
  { year: 2024, q: 'Q4', title: 'CSRD first mandatory reporting cycle (FY2024)', actor: 'EU-EFRAG', impact: 'High', desc: 'Large EU companies disclose ESRS E1 — incl. carbon credit use, offset vs avoidance.' },
  { year: 2025, q: 'Q1', title: 'US SEC climate rule first compliance filings', actor: 'US-SEC', impact: 'Med', desc: 'Large accelerated filers disclose material climate risks + Scope 1/2 (Scope 3 deferred).' },
  { year: 2025, q: 'Q2', title: 'CORSIA Phase 1 begins (mandatory)', actor: 'ICAO', impact: 'High', desc: 'Airlines required to offset growth above 85% of 2019 baseline; only CCP-labeled credits eligible.' },
  { year: 2025, q: 'Q3', title: 'SBTi Corporate Net-Zero Standard v2', actor: 'SBTi', impact: 'High', desc: 'Beyond Value Chain Mitigation (BVCM) guidance; restricts offset use toward primary targets.' },
  { year: 2025, q: 'Q4', title: 'ISSB S2 first mandatory jurisdictions', actor: 'IFRS-ISSB', impact: 'High', desc: 'UK/AU/NZ/JP/BR mandate ISSB S2 climate disclosure; Scope 3 + transition plan.' },
  { year: 2026, q: 'Q1', title: 'EU CBAM financial adjustment begins', actor: 'EU-CBAM', impact: 'High', desc: 'Importers purchase CBAM certificates; EU ETS price × embedded emissions.' },
  { year: 2026, q: 'Q2', title: 'VCMI MPS prerequisite hardening', actor: 'VCMI', impact: 'Med', desc: 'Claim-makers must demonstrate SBTi-validated near-term targets on track.' },
  { year: 2026, q: 'Q4', title: 'CSRD Scope 3 + value chain mandatory', actor: 'EU-EFRAG', impact: 'Med', desc: 'Full ESRS E1 inc. financed emissions for banks/insurers.' },
  { year: 2027, q: 'Q1', title: 'Article 6.2 market at scale', actor: 'UNFCCC', impact: 'High', desc: 'Corresponding adjustments standardized; bilateral ITMO trades exceed 50 MtCO2e annually.' },
  { year: 2027, q: 'Q3', title: 'SBTi Net-Zero milestone: 40% GHG cut', actor: 'SBTi', impact: 'Med', desc: '1.5C-aligned corporates cross -40% vs baseline; gap-to-target analytics scale.' },
  { year: 2028, q: 'Q1', title: 'CBAM full scope (chemicals, polymers)', actor: 'EU-CBAM', impact: 'High', desc: 'CBAM expands beyond iron/steel/cement/aluminum/fertilizer/H2/power.' },
  { year: 2028, q: 'Q3', title: 'ICVCM CCP v2 (scope expansion)', actor: 'ICVCM', impact: 'Med', desc: 'Adds durable CDR + marine ecosystem methodology eligibility.' },
  { year: 2029, q: 'Q2', title: 'Global Stocktake 2 (COP34)', actor: 'UNFCCC', impact: 'High', desc: 'Assessment of collective progress vs Paris 1.5C; tighter NDCs expected 2030-2035.' },
  { year: 2030, q: 'Q1', title: 'SBTi near-term target year', actor: 'SBTi', impact: 'High', desc: '1.5C cohort must achieve ~46% absolute Scope 1+2 reduction by FY2030.' },
  { year: 2030, q: 'Q4', title: 'CORSIA Phase 2 (full scope)', actor: 'ICAO', impact: 'High', desc: 'All international aviation routes; ~350 MtCO2e demand from 2030-2035.' }
];

// Permanence hazard rates by project type (annual reversal probability, %).
const PERMANENCE_HAZARDS = {
  'REDD+': { mean: 1.40, low: 0.80, high: 2.00, buffer: 20 },
  'IFM': { mean: 0.55, low: 0.30, high: 0.80, buffer: 15 },
  'ARR': { mean: 0.85, low: 0.50, high: 1.20, buffer: 17 },
  'Blue Carbon': { mean: 1.10, low: 0.60, high: 1.80, buffer: 22 },
  'Cookstove': { mean: 0.20, low: 0.10, high: 0.40, buffer: 5 },
  'Water': { mean: 0.25, low: 0.10, high: 0.45, buffer: 5 },
  'Renewable': { mean: 0.05, low: 0.01, high: 0.15, buffer: 2 },
  'CCS': { mean: 0.10, low: 0.02, high: 0.25, buffer: 5 },
  'DAC': { mean: 0.02, low: 0.001, high: 0.08, buffer: 1 },
  'Biochar': { mean: 0.15, low: 0.05, high: 0.35, buffer: 4 },
  'EW': { mean: 0.08, low: 0.02, high: 0.20, buffer: 3 },
  'Ocean': { mean: 0.12, low: 0.04, high: 0.30, buffer: 4 },
  'HFC': { mean: 0.05, low: 0.01, high: 0.10, buffer: 2 },
  'N2O': { mean: 0.05, low: 0.01, high: 0.10, buffer: 2 },
  'Methane': { mean: 0.30, low: 0.10, high: 0.60, buffer: 6 },
  'Biogas': { mean: 0.40, low: 0.20, high: 0.70, buffer: 7 }
};

// McKinsey/IEA-style marginal abatement cost measures. cost USD/tCO2, potential MtCO2/yr global.
const MACC_MEASURES = [
  { id: 'M01', measure: 'LED Lighting Retrofit', sector: 'Buildings', cost: -120, potential: 0.9, tech: 'Efficiency' },
  { id: 'M02', measure: 'Residential Insulation', sector: 'Buildings', cost: -85, potential: 1.4, tech: 'Efficiency' },
  { id: 'M03', measure: 'Industrial Motor Efficiency', sector: 'Industry', cost: -60, potential: 2.1, tech: 'Efficiency' },
  { id: 'M04', measure: 'Fuel Switching Gas→Heat Pump', sector: 'Buildings', cost: -35, potential: 1.7, tech: 'Electrification' },
  { id: 'M05', measure: 'Methane Leak Reduction O&G', sector: 'Energy', cost: -18, potential: 2.3, tech: 'Abatement' },
  { id: 'M06', measure: 'Onshore Wind (new)', sector: 'Power', cost: -5, potential: 4.2, tech: 'Renewables' },
  { id: 'M07', measure: 'Utility Solar PV', sector: 'Power', cost: 2, potential: 5.1, tech: 'Renewables' },
  { id: 'M08', measure: 'EV Passenger Fleet Conversion', sector: 'Transport', cost: 15, potential: 2.8, tech: 'Electrification' },
  { id: 'M09', measure: 'Offshore Wind', sector: 'Power', cost: 22, potential: 1.8, tech: 'Renewables' },
  { id: 'M10', measure: 'Nuclear New Build (SMR)', sector: 'Power', cost: 45, potential: 1.2, tech: 'Nuclear' },
  { id: 'M11', measure: 'Green H2 (electrolysis)', sector: 'Industry', cost: 85, potential: 1.5, tech: 'H2' },
  { id: 'M12', measure: 'CCS Cement', sector: 'Industry', cost: 115, potential: 0.7, tech: 'CCS' },
  { id: 'M13', measure: 'CCS Power (post-combustion)', sector: 'Power', cost: 95, potential: 1.1, tech: 'CCS' },
  { id: 'M14', measure: 'Green Steel (H2-DRI)', sector: 'Industry', cost: 140, potential: 0.8, tech: 'H2' },
  { id: 'M15', measure: 'Sustainable Aviation Fuel', sector: 'Transport', cost: 220, potential: 0.6, tech: 'Bio' },
  { id: 'M16', measure: 'E-Fuel Shipping', sector: 'Transport', cost: 280, potential: 0.4, tech: 'H2' },
  { id: 'M17', measure: 'BECCS (bioenergy + CCS)', sector: 'CDR', cost: 175, potential: 0.5, tech: 'CDR' },
  { id: 'M18', measure: 'DAC + geological storage', sector: 'CDR', cost: 420, potential: 0.25, tech: 'CDR' },
  { id: 'M19', measure: 'Enhanced Weathering (basalt)', sector: 'CDR', cost: 240, potential: 0.15, tech: 'CDR' },
  { id: 'M20', measure: 'Ocean Alkalinity Enhancement', sector: 'CDR', cost: 330, potential: 0.10, tech: 'CDR' }
];

// 10-year forward offtake contract terms under negotiation.
const OFFTAKE_TERMS = [
  { id: 'OFF-1', buyer: 'Microsoft', seller: 'Iceland DAC (Climeworks)', type: 'DAC', volume: 0.02, tenor: 10, strike: 580, floor: 420, ceiling: 750, defaultHaz: 0.02, vol: 0.28 },
  { id: 'OFF-2', buyer: 'Alphabet', seller: 'Stockholm Exergi BECCS', type: 'CCS', volume: 0.08, tenor: 10, strike: 160, floor: 120, ceiling: 220, defaultHaz: 0.015, vol: 0.22 },
  { id: 'OFF-3', buyer: 'Shopify', seller: 'Charm Industrial (biooil)', type: 'Biochar', volume: 0.005, tenor: 5, strike: 600, floor: 450, ceiling: 800, defaultHaz: 0.05, vol: 0.40 },
  { id: 'OFF-4', buyer: 'Stripe', seller: 'Heirloom DAC', type: 'DAC', volume: 0.015, tenor: 10, strike: 720, floor: 500, ceiling: 950, defaultHaz: 0.03, vol: 0.32 },
  { id: 'OFF-5', buyer: 'JPMorgan', seller: 'Amazon ARR (Brazil)', type: 'ARR', volume: 0.45, tenor: 10, strike: 24, floor: 16, ceiling: 36, defaultHaz: 0.08, vol: 0.35 },
  { id: 'OFF-6', buyer: 'Apple', seller: 'Restore the Earth Mangrove', type: 'Blue Carbon', volume: 0.25, tenor: 10, strike: 32, floor: 22, ceiling: 48, defaultHaz: 0.06, vol: 0.30 },
  { id: 'OFF-7', buyer: 'Swiss Re', seller: 'CarbonCure Concrete', type: 'CCS', volume: 0.12, tenor: 10, strike: 145, floor: 110, ceiling: 200, defaultHaz: 0.025, vol: 0.24 },
  { id: 'OFF-8', buyer: 'Autodesk', seller: 'Running Tide Ocean', type: 'Ocean', volume: 0.01, tenor: 10, strike: 380, floor: 250, ceiling: 550, defaultHaz: 0.10, vol: 0.45 },
  { id: 'OFF-9', buyer: 'Meta', seller: 'Terraformation ARR', type: 'ARR', volume: 0.15, tenor: 10, strike: 28, floor: 18, ceiling: 42, defaultHaz: 0.07, vol: 0.33 },
  { id: 'OFF-10', buyer: 'Nestle', seller: 'Cool Effect Cookstove Portfolio', type: 'Cookstove', volume: 0.55, tenor: 5, strike: 11, floor: 7, ceiling: 18, defaultHaz: 0.04, vol: 0.26 }
];

// Box-Muller transform of seeded uniforms into a standard normal draw.
const rngN = (seed) => {
  const u1 = Math.max(1e-10, sr(seed));
  const u2 = sr(seed + 1);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
};

// (2x2 inverse helper removed — OLS uses full Gauss-Jordan on X'X.)

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'cdp', label: 'CDP' },
  { id: 'sbti', label: 'SBTi' },
  { id: 'vcm', label: 'VCM Credits' },
  { id: 'icvcm', label: 'ICVCM CCPs' },
  { id: 'vcmi', label: 'VCMI Claims' },
  { id: 'icroa', label: 'ICROA' },
  { id: 'article6', label: 'Article 6' },
  { id: 'bridge', label: 'VCM↔Compliance' },
  { id: 'quality', label: 'Quality Scoring' },
  { id: 'credibility', label: 'Credibility' },
  { id: 'matrix', label: 'Taxonomy Matrix' },
  { id: 'portfolio', label: 'Portfolio Exposure' },
  { id: 'roadmap', label: 'Roadmap 2024-30' },
  { id: 'permanenceMC', label: 'Permanence MC' },
  { id: 'macc', label: 'MACC Cost Curve' },
  { id: 'forward', label: 'Forward Price Surface' },
  { id: 'tonneyear', label: 'Tonne-Year Accounting' },
  { id: 'offtake', label: 'Offtake Pricing' },
  { id: 'integrity', label: 'Integrity Regression' }
];

const Card = ({ children, style }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 18, ...style }}>{children}</div>
);

const Pill = ({ children, bg, color, style }) => (
  <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 11, fontSize: 11, fontWeight: 600, background: bg || T.surfaceH, color: color || T.navy, border: `1px solid ${T.borderL}`, fontFamily: T.mono, ...style }}>{children}</span>
);

const Kpi = ({ label, value, sub, accent }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${accent || T.gold}`, borderRadius: 6, padding: '14px 16px' }}>
    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: T.textMut, fontFamily: T.mono }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: T.navy, fontFamily: T.mono, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

const SectionH = ({ title, sub }) => (
  <div style={{ marginBottom: 14, borderBottom: `1px solid ${T.border}`, paddingBottom: 8 }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, letterSpacing: 0.4, fontFamily: T.mono, textTransform: 'uppercase' }}>{title}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function CarbonInstitutionsTaxonomyPage() {
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [selectedIssuer, setSelectedIssuer] = useState('MSFT');
  const [stdFilter, setStdFilter] = useState('ALL');
  const [qualityThreshold, setQualityThreshold] = useState(60);
  const [art6Only, setArt6Only] = useState(false);

  const stats = useMemo(() => {
    const n = ISSUERS.length || 1;
    const sbtiVal = ISSUERS.filter(i => i.sbti.includes('Val')).length;
    const cdpA = ISSUERS.filter(i => i.cdp === 'A' || i.cdp === 'A-').length;
    const vcmMt = VCM_PROJECTS.reduce((s, p) => s + p.volume, 0);
    const art6Mt = ARTICLE6_PILOTS.reduce((s, p) => s + p.itmos, 0);
    const art6CA = ARTICLE6_PILOTS.filter(p => p.ca).length;
    const ccpEligible = VCM_PROJECTS.filter(p => p.ccp).length;
    const nzCommit = ISSUERS.filter(i => i.sbti !== 'None').length;
    const vcmiClaims = VCMI_CLAIMS.length;
    return {
      sbtiValPct: (sbtiVal / n) * 100,
      cdpApct: (cdpA / n) * 100,
      vcmMt,
      art6CAPct: (art6CA / (ARTICLE6_PILOTS.length || 1)) * 100,
      ccpPct: (ccpEligible / (VCM_PROJECTS.length || 1)) * 100,
      nzPct: (nzCommit / n) * 100,
      vcmiClaims,
      art6Mt,
      avgICVCM: ISSUERS.reduce((s, i) => s + i.icvcm, 0) / n
    };
  }, []);

  const issuerSel = useMemo(() => ISSUERS.find(i => i.ticker === selectedIssuer) || ISSUERS[0], [selectedIssuer]);
  const issuerCDP = useMemo(() => CDP_SCORES.find(i => i.ticker === selectedIssuer) || CDP_SCORES[0], [selectedIssuer]);
  const issuerSBTi = useMemo(() => SBTI_TARGETS.find(i => i.ticker === selectedIssuer) || SBTI_TARGETS[0], [selectedIssuer]);

  const filteredVCM = useMemo(() => {
    return VCM_PROJECTS.filter(p => (stdFilter === 'ALL' || p.standard.includes(stdFilter)) && (!art6Only || p.corsia));
  }, [stdFilter, art6Only]);

  const filteredQuality = useMemo(() => CREDIT_QUALITY.filter(p => p.overall >= qualityThreshold && (!art6Only || p.corsia)), [qualityThreshold, art6Only]);

  const handleTabClick = useCallback((id) => setTab(id), []);

  const Shell = (inner) => (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.text }}>
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '18px 28px' }}>
        <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono, letterSpacing: 1, textTransform: 'uppercase' }}>EP-Q10 · Carbon Institutions Taxonomy</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 700, color: T.navy }}>Carbon Institutions Taxonomy</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>Unified view: CDP · SBTi · VCM · ICROA · ICVCM CCPs · VCMI · Article 6 · EU Taxonomy alignment</div>
          </div>
          <div style={{ height: 2, width: 72, background: T.gold, alignSelf: 'flex-start', marginTop: 8 }} />
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 11, fontFamily: T.mono, color: T.textSec }}>ISSUER</label>
          <select value={selectedIssuer} onChange={e => setSelectedIssuer(e.target.value)} style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 4, padding: '6px 10px', fontFamily: T.mono, fontSize: 12, color: T.navy }}>
            {ISSUERS.map(i => <option key={i.ticker} value={i.ticker}>{i.ticker} — {i.name}</option>)}
          </select>
          <label style={{ fontSize: 11, fontFamily: T.mono, color: T.textSec }}>STANDARD</label>
          <select value={stdFilter} onChange={e => setStdFilter(e.target.value)} style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 4, padding: '6px 10px', fontFamily: T.mono, fontSize: 12, color: T.navy }}>
            {['ALL', 'VCS', 'GS', 'ACR', 'CAR', 'Puro', 'Plan Vivo', 'Isometric', 'CDM'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <label style={{ fontSize: 11, fontFamily: T.mono, color: T.textSec }}>QUALITY ≥ {qualityThreshold}</label>
          <input type="range" min={0} max={100} step={5} value={qualityThreshold} onChange={e => setQualityThreshold(Number(e.target.value))} style={{ width: 160 }} />
          <label style={{ fontSize: 11, fontFamily: T.mono, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={art6Only} onChange={e => setArt6Only(e.target.checked)} /> CORSIA/Art 6 only
          </label>
        </div>
      </div>
      <div style={{ background: T.surfaceH, borderBottom: `1px solid ${T.border}`, padding: '0 28px', display: 'flex', gap: 2, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => handleTabClick(t.id)} style={{
            background: tab === t.id ? T.surface : 'transparent',
            color: tab === t.id ? T.navy : T.textSec,
            border: 'none', borderBottom: tab === t.id ? `2px solid ${T.gold}` : '2px solid transparent',
            padding: '12px 14px', fontSize: 12, fontFamily: T.mono, fontWeight: tab === t.id ? 700 : 500,
            cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: 0.3
          }}>{t.label}</button>
        ))}
      </div>
      <div style={{ padding: 28 }}>{inner}</div>
      <div style={{ borderTop: `1px solid ${T.border}`, padding: '10px 28px', fontFamily: T.mono, fontSize: 10, color: T.textMut, background: T.surface, display: 'flex', justifyContent: 'space-between' }}>
        <span>EP-Q10 · STATUS: LIVE · {ISSUERS.length} issuers · {VCM_PROJECTS.length} credits · {ICVCM_CCPS.length} CCPs · {ROADMAP.length} milestones</span>
        <span>Δ · Carbon Taxonomy · UTC {new Date().toISOString().slice(0, 16)}Z</span>
      </div>
    </div>
  );

  const RenderOverview = () => {
    const sectorBreakdown = useMemo(() => {
      const m = {};
      ISSUERS.forEach(i => { m[i.sector] = m[i.sector] || { sector: i.sector, count: 0, icvcm: 0 }; m[i.sector].count++; m[i.sector].icvcm += i.icvcm; });
      return Object.values(m).map(s => ({ ...s, icvcmAvg: s.count > 0 ? s.icvcm / s.count : 0 }));
    }, []);
    const cdpDist = useMemo(() => {
      const grades = ['A', 'A-', 'B', 'B-', 'C', 'C-', 'D', 'F'];
      return grades.map(g => ({ grade: g, count: ISSUERS.filter(i => i.cdp === g).length }));
    }, []);
    const sbtiDist = useMemo(() => {
      const tiers = ['1.5C-Val', 'WB2C-Val', 'Committed', 'None'];
      return tiers.map(tr => ({ tier: tr, count: ISSUERS.filter(i => i.sbti === tr).length }));
    }, []);
    const vcmiDist = useMemo(() => {
      const tiers = ['Gold', 'Silver', 'Bronze', 'None'];
      return tiers.map(tr => ({ tier: tr, count: ISSUERS.filter(i => i.vcmi === tr).length }));
    }, []);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
          <Kpi label="SBTi Validated" value={pct(stats.sbtiValPct, 0)} sub={`${Math.round(stats.sbtiValPct / 100 * ISSUERS.length)} of ${ISSUERS.length} issuers`} accent={T.green} />
          <Kpi label="CDP A / A-" value={pct(stats.cdpApct, 0)} sub="Leadership band" accent={T.sage} />
          <Kpi label="VCM Volume" value={`${fmt(stats.vcmMt, 1)} MtCO2e`} sub={`${VCM_PROJECTS.length} projects`} accent={T.navy} />
          <Kpi label="Art 6 CA-Backed" value={pct(stats.art6CAPct, 0)} sub={`${fmt(stats.art6Mt, 1)} Mt ITMOs`} accent={T.gold} />
          <Kpi label="ICVCM CCP-Eligible" value={pct(stats.ccpPct, 0)} sub="of VCM projects" accent={T.sage} />
          <Kpi label="Net-Zero Committed" value={pct(stats.nzPct, 0)} sub="SBTi pipeline" accent={T.navyL} />
          <Kpi label="VCMI Claim-Makers" value={stats.vcmiClaims} sub="Active claims 2023-24" accent={T.gold} />
          <Kpi label="Avg ICVCM Score" value={fmt(stats.avgICVCM, 0)} sub="Composite 0-100" accent={T.navy} />
        </div>

        <Card>
          <SectionH title="Taxonomy Framework — Institutional Map" sub="Seven voluntary/compliance institutions mapped to EU Taxonomy climate mitigation objective" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>
            {[
              { inst: 'CDP', role: 'Disclosure platform', coverage: '23,000+ companies', taxLink: 'ESRS E1 datapoint mapping' },
              { inst: 'SBTi', role: 'Target validation', coverage: '8,600+ companies', taxLink: 'Substantial contribution threshold setter' },
              { inst: 'VCM (Verra/GS/ACR/CAR)', role: 'Voluntary credit issuance', coverage: '~2.4 GtCO2e cumulative', taxLink: 'Not directly in EU Taxonomy; feeds DNSH' },
              { inst: 'ICVCM', role: 'Core Carbon Principles', coverage: '10 CCPs', taxLink: 'Quality floor for EU Taxonomy-aligned offsetting' },
              { inst: 'VCMI', role: 'Corporate claim codes', coverage: 'Gold/Silver/Bronze/Platinum', taxLink: 'Links to CSRD E1 transition plan disclosures' },
              { inst: 'ICROA', role: 'Standards endorsement', coverage: '8 endorsed standards', taxLink: 'Pre-CCP quality gateway' },
              { inst: 'Article 6 (Paris)', role: 'Sovereign ITMO transfers', coverage: '12+ bilateral pilots', taxLink: 'EU ETS linkage pathway (post-2030)' }
            ].map(x => (
              <div key={x.inst} style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.gold}`, borderRadius: 4, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: T.mono }}>{x.inst}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{x.role}</div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 6, fontFamily: T.mono }}>{x.coverage}</div>
                <div style={{ fontSize: 10, color: T.sage, marginTop: 4 }}>↪ {x.taxLink}</div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card>
            <SectionH title="CDP Grade Distribution" sub="Issuer population, current climate response" />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cdpDist}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="grade" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
                <Bar dataKey="count" name="Issuers">
                  {cdpDist.map((d, i) => <Cell key={i} fill={cdpColor(d.grade)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionH title="SBTi Tier Breakdown" sub="Validation status by issuer" />
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={sbtiDist} dataKey="count" nameKey="tier" outerRadius={86} label={(e) => `${e.tier} (${e.count})`}>
                  {sbtiDist.map((d, i) => <Cell key={i} fill={[T.green, T.sage, T.gold, T.red][i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <Card>
            <SectionH title="Sector ICVCM Composite (0-100)" sub="Sector-mean carbon-integrity score" />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sectorBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
                <Bar dataKey="icvcmAvg" fill={T.navy} name="ICVCM avg" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionH title="VCMI Claim Tier" sub="Corporate offset-claim codes" />
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={vcmiDist} dataKey="count" nameKey="tier" outerRadius={92} label={(e) => e.tier}>
                  {vcmiDist.map((d, i) => <Cell key={i} fill={[T.gold, T.sage, T.goldL, T.textMut][i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card>
          <SectionH title="Selected Issuer Snapshot" sub={`${issuerSel.name} (${issuerSel.ticker}) · ${issuerSel.sector} · ${issuerSel.region}`} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
            <div><div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>CDP CLIMATE</div><Pill bg={cdpColor(issuerSel.cdp)} color="#fff">{issuerSel.cdp}</Pill></div>
            <div><div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>SBTi</div><div style={{ fontSize: 13, fontFamily: T.mono, color: T.navy, marginTop: 4 }}>{issuerSel.sbti}</div></div>
            <div><div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>VCMI</div><div style={{ fontSize: 13, fontFamily: T.mono, color: T.navy, marginTop: 4 }}>{issuerSel.vcmi}</div></div>
            <div><div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>ARTICLE 6</div><div style={{ fontSize: 13, fontFamily: T.mono, color: issuerSel.art6 ? T.green : T.textMut, marginTop: 4 }}>{issuerSel.art6 ? 'Engaged' : 'Not engaged'}</div></div>
            <div><div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>ICVCM</div><div style={{ fontSize: 13, fontFamily: T.mono, color: T.navy, marginTop: 4 }}>{issuerSel.icvcm}/100</div></div>
            <div><div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>MCAP</div><div style={{ fontSize: 13, fontFamily: T.mono, color: T.navy, marginTop: 4 }}>${issuerSel.mcap}B</div></div>
          </div>
        </Card>
      </div>
    );
  };

  const RenderCDP = () => {
    const trendData = useMemo(() => {
      const years = ['2020', '2021', '2022', '2023', '2024'];
      return years.map((y, idx) => {
        const row = { year: y };
        ['MSFT', 'GOOGL', 'AAPL', 'NSRGY', 'XOM'].forEach(tk => {
          const c = CDP_SCORES.find(s => s.ticker === tk);
          row[tk] = c ? Math.round(c.trajectory[idx].score * 100) : 0;
        });
        return row;
      });
    }, []);
    const avgDisc = CDP_SCORES.length ? CDP_SCORES.filter(c => c.scope3Disc).length / CDP_SCORES.length * 100 : 0;
    const avgVerif = CDP_SCORES.length ? CDP_SCORES.filter(c => c.verif === 'Reasonable').length / CDP_SCORES.length * 100 : 0;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
          <Kpi label="A-List Share" value={pct(stats.cdpApct, 0)} accent={T.green} sub="A + A- grades" />
          <Kpi label="Scope 3 Disclosers" value={pct(avgDisc, 0)} accent={T.navy} sub="Cat 1-15 coverage" />
          <Kpi label="Reasonable Assurance" value={pct(avgVerif, 0)} accent={T.sage} sub="3rd-party verification" />
          <Kpi label="Avg Engagement Supply Chain" value={fmt(CDP_SCORES.reduce((s, c) => s + c.engagements, 0) / (CDP_SCORES.length || 1), 0)} sub="tier-1 suppliers" accent={T.gold} />
        </div>
        <Card>
          <SectionH title="CDP Trajectory — 5-Year Score Evolution (Selected 5 Issuers)" />
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.mono }} />
              <Line type="monotone" dataKey="MSFT" stroke={T.navy} strokeWidth={2} />
              <Line type="monotone" dataKey="GOOGL" stroke={T.sage} strokeWidth={2} />
              <Line type="monotone" dataKey="AAPL" stroke={T.gold} strokeWidth={2} />
              <Line type="monotone" dataKey="NSRGY" stroke={T.navyL} strokeWidth={2} />
              <Line type="monotone" dataKey="XOM" stroke={T.red} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionH title="CDP Disclosure Matrix" sub="30 issuers · Climate / Water / Forest themes" />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.mono }}>
              <thead>
                <tr style={{ background: T.surfaceH, borderBottom: `2px solid ${T.border}` }}>
                  {['Ticker', 'Name', 'Sector', 'Climate', 'Water', 'Forest', 'S3 Disc', 'Assurance', 'Engage', 'Since'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.navy, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CDP_SCORES.map((c, i) => (
                  <tr key={c.ticker} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ padding: '7px 10px', fontWeight: 700, color: T.navy }}>{c.ticker}</td>
                    <td style={{ padding: '7px 10px', color: T.text }}>{c.name}</td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{c.sector}</td>
                    <td style={{ padding: '7px 10px' }}><Pill bg={cdpColor(c.climate)} color="#fff">{c.climate}</Pill></td>
                    <td style={{ padding: '7px 10px' }}><Pill bg={cdpColor(c.water)} color="#fff">{c.water}</Pill></td>
                    <td style={{ padding: '7px 10px' }}><Pill bg={cdpColor(c.forest)} color="#fff">{c.forest}</Pill></td>
                    <td style={{ padding: '7px 10px', color: c.scope3Disc ? T.green : T.red }}>{c.scope3Disc ? 'Yes' : 'No'}</td>
                    <td style={{ padding: '7px 10px', color: c.verif === 'Reasonable' ? T.green : c.verif === 'Limited' ? T.gold : T.red }}>{c.verif}</td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{c.engagements}</td>
                    <td style={{ padding: '7px 10px', color: T.textMut }}>{c.disclosureYear}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const RenderSBTi = () => {
    const tierCounts = useMemo(() => {
      const tiers = ['1.5C-Val', 'WB2C-Val', 'Committed', 'None'];
      return tiers.map(t => ({ tier: t, count: SBTI_TARGETS.filter(s => s.tier === t).length, progressAvg: SBTI_TARGETS.filter(s => s.tier === t).reduce((a, s) => a + s.progress, 0) / (SBTI_TARGETS.filter(s => s.tier === t).length || 1) }));
    }, []);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
          <Kpi label="1.5°C Validated" value={SBTI_TARGETS.filter(s => s.tier === '1.5C-Val').length} accent={T.green} sub={`of ${SBTI_TARGETS.length} issuers`} />
          <Kpi label="WB2°C Validated" value={SBTI_TARGETS.filter(s => s.tier === 'WB2C-Val').length} accent={T.sage} sub="Transitional alignment" />
          <Kpi label="Committed (In Progress)" value={SBTI_TARGETS.filter(s => s.tier === 'Committed').length} accent={T.gold} sub="≤24 months to validate" />
          <Kpi label="No Target" value={SBTI_TARGETS.filter(s => s.tier === 'None').length} accent={T.red} sub="Red flag" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <Card>
            <SectionH title="SBTi Tier × Progress" sub="Average progress toward near-term 2030 target" />
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={tierCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="tier" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <YAxis yAxisId="L" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <YAxis yAxisId="R" orientation="right" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.mono }} />
                <Bar yAxisId="L" dataKey="count" fill={T.navy} name="Count" />
                <Line yAxisId="R" type="monotone" dataKey="progressAvg" stroke={T.gold} strokeWidth={2} name="Progress %" />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionH title={`${issuerSBTi.ticker} Target Detail`} sub={issuerSBTi.name} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 12, fontFamily: T.mono }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: T.textSec }}>Status</span><span style={{ color: T.navy, fontWeight: 700 }}>{issuerSBTi.status}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: T.textSec }}>Tier</span><span style={{ color: T.navy }}>{issuerSBTi.tier}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: T.textSec }}>Pathway</span><span style={{ color: T.navy }}>{issuerSBTi.pathway}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: T.textSec }}>Base Year</span><span style={{ color: T.navy }}>{issuerSBTi.baseYear}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: T.textSec }}>Target Year</span><span style={{ color: T.navy }}>{issuerSBTi.targetYear}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: T.textSec }}>Net-Zero Year</span><span style={{ color: T.navy }}>{issuerSBTi.netZeroYear || '—'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: T.textSec }}>Scope 1+2 Redux</span><span style={{ color: T.green }}>-{issuerSBTi.s12Target}%</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: T.textSec }}>Scope 3 Redux</span><span style={{ color: T.sage }}>-{issuerSBTi.s3Target}%</span></div>
              <div style={{ height: 8, background: T.surfaceH, borderRadius: 4, overflow: 'hidden', marginTop: 6 }}>
                <div style={{ width: `${Math.min(100, issuerSBTi.progress)}%`, height: '100%', background: T.gold }} />
              </div>
              <div style={{ fontSize: 10, color: T.textMut, textAlign: 'right' }}>{fmt(issuerSBTi.progress, 0)}% toward target</div>
            </div>
          </Card>
        </div>
        <Card>
          <SectionH title="SBTi Targets Register" />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.mono }}>
              <thead>
                <tr style={{ background: T.surfaceH, borderBottom: `2px solid ${T.border}` }}>
                  {['Ticker', 'Name', 'Tier', 'S1+2 %', 'S3 %', 'Base', 'Target', 'NZ', 'Pathway', 'Progress'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.navy, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SBTI_TARGETS.map((s, i) => (
                  <tr key={s.ticker} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ padding: '7px 10px', fontWeight: 700, color: T.navy }}>{s.ticker}</td>
                    <td style={{ padding: '7px 10px' }}>{s.name}</td>
                    <td style={{ padding: '7px 10px' }}><Pill bg={s.tier === '1.5C-Val' ? T.green : s.tier === 'WB2C-Val' ? T.sage : s.tier === 'Committed' ? T.gold : T.red} color="#fff">{s.tier}</Pill></td>
                    <td style={{ padding: '7px 10px', color: T.green }}>-{s.s12Target}%</td>
                    <td style={{ padding: '7px 10px', color: T.sage }}>-{s.s3Target}%</td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{s.baseYear}</td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{s.targetYear}</td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{s.netZeroYear || '—'}</td>
                    <td style={{ padding: '7px 10px', color: T.textMut, fontSize: 11 }}>{s.pathway}</td>
                    <td style={{ padding: '7px 10px', color: T.navy }}>{fmt(s.progress, 0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const RenderVCM = () => {
    const byStandard = useMemo(() => {
      const m = {};
      filteredVCM.forEach(p => { m[p.standard] = m[p.standard] || { standard: p.standard, volume: 0, count: 0, avgPrice: 0, total: 0 }; m[p.standard].volume += p.volume; m[p.standard].count++; m[p.standard].total += p.price; });
      return Object.values(m).map(x => ({ ...x, avgPrice: x.count > 0 ? x.total / x.count : 0 }));
    }, [filteredVCM]);
    const byType = useMemo(() => {
      const m = {};
      filteredVCM.forEach(p => { m[p.type] = (m[p.type] || 0) + p.volume; });
      return Object.entries(m).map(([k, v]) => ({ type: k, volume: v }));
    }, [filteredVCM]);
    const priceRange = useMemo(() => filteredVCM.map(p => ({ x: p.volume, y: p.price, z: p.rating === 'A' ? 90 : p.rating === 'B' ? 70 : p.rating === 'C' ? 50 : p.rating === 'D' ? 30 : 10, name: p.name, type: p.type })), [filteredVCM]);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
          <Kpi label="Filtered Projects" value={filteredVCM.length} accent={T.navy} sub={`of ${VCM_PROJECTS.length} total`} />
          <Kpi label="Volume (MtCO2e)" value={fmt(filteredVCM.reduce((s, p) => s + p.volume, 0), 1)} accent={T.gold} />
          <Kpi label="Avg Price ($/tCO2e)" value={`$${fmt(filteredVCM.length ? filteredVCM.reduce((s, p) => s + p.price, 0) / filteredVCM.length : 0, 2)}`} accent={T.sage} />
          <Kpi label="CCP-Eligible" value={filteredVCM.filter(p => p.ccp).length} accent={T.green} sub="ICVCM labeled" />
          <Kpi label="CORSIA Eligible" value={filteredVCM.filter(p => p.corsia).length} accent={T.navyL} sub="Aviation compliance" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card>
            <SectionH title="Volume by Standard" />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byStandard}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="standard" tick={{ fontSize: 10, fill: T.textSec, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
                <Bar dataKey="volume" fill={T.navy} name="MtCO2e" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionH title="Volume by Project Type" />
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byType} dataKey="volume" nameKey="type" outerRadius={90} label={(e) => e.type}>
                  {byType.map((d, i) => <Cell key={i} fill={[T.navy, T.gold, T.sage, T.navyL, T.goldL, T.sageL, T.amber, T.textMut, T.red, T.green][i % 10]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
        <Card>
          <SectionH title="Price × Volume (bubble = quality rating)" />
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="x" name="Volume (Mt)" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} label={{ value: 'Volume MtCO2e', position: 'insideBottom', offset: -4, fontSize: 10 }} />
              <YAxis dataKey="y" name="Price ($/t)" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} label={{ value: 'Price $/tCO2e', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={priceRange} fill={T.gold} />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionH title="VCM Projects Register" />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: T.mono }}>
              <thead>
                <tr style={{ background: T.surfaceH, borderBottom: `2px solid ${T.border}` }}>
                  {['ID', 'Project', 'Type', 'Country', 'Standard', 'Vintage', 'Volume(Mt)', '$/t', 'CCP', 'CORSIA', 'ICROA', 'Rating'].map(h => (
                    <th key={h} style={{ padding: '7px 8px', textAlign: 'left', color: T.navy, fontSize: 10, letterSpacing: 0.4, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredVCM.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ padding: '6px 8px', color: T.textMut }}>{p.id}</td>
                    <td style={{ padding: '6px 8px', color: T.navy, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '6px 8px', color: T.textSec }}>{p.type}</td>
                    <td style={{ padding: '6px 8px', color: T.textSec }}>{p.country}</td>
                    <td style={{ padding: '6px 8px', color: T.textSec }}>{p.standard}</td>
                    <td style={{ padding: '6px 8px', color: T.textMut }}>{p.vintage}</td>
                    <td style={{ padding: '6px 8px', color: T.navy }}>{fmt(p.volume, 2)}</td>
                    <td style={{ padding: '6px 8px', color: T.navy }}>${fmt(p.price, 1)}</td>
                    <td style={{ padding: '6px 8px', color: p.ccp ? T.green : T.red }}>{p.ccp ? '✓' : '✗'}</td>
                    <td style={{ padding: '6px 8px', color: p.corsia ? T.green : T.red }}>{p.corsia ? '✓' : '✗'}</td>
                    <td style={{ padding: '6px 8px', color: p.icroa ? T.green : T.red }}>{p.icroa ? '✓' : '✗'}</td>
                    <td style={{ padding: '6px 8px' }}><Pill bg={p.rating === 'A' ? T.green : p.rating === 'B' ? T.sage : p.rating === 'C' ? T.gold : p.rating === 'D' ? T.amber : T.red} color="#fff">{p.rating}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const RenderICVCM = () => {
    const pillars = useMemo(() => {
      const m = {};
      ICVCM_CCPS.forEach(c => { m[c.pillar] = m[c.pillar] || { pillar: c.pillar, count: 0, avg: 0, total: 0 }; m[c.pillar].count++; m[c.pillar].total += c.compliance; });
      return Object.values(m).map(p => ({ ...p, avg: p.count > 0 ? p.total / p.count : 0 }));
    }, []);
    const radarData = ICVCM_CCPS.map(c => ({ ccp: `CCP${c.num}`, value: c.compliance }));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
          <Kpi label="CCPs Published" value="10" accent={T.navy} sub="Full framework" />
          <Kpi label="Avg Compliance" value={pct(ICVCM_CCPS.reduce((s, c) => s + c.compliance, 0) / (ICVCM_CCPS.length || 1), 0)} accent={T.sage} />
          <Kpi label="Highest Pillar" value="Governance" accent={T.green} sub={`${fmt(pillars.find(p => p.pillar === 'Governance')?.avg || 0, 0)}%`} />
          <Kpi label="Weakest CCP" value="CCP-6 Permanence" accent={T.amber} sub={`${ICVCM_CCPS[5].compliance}%`} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card>
            <SectionH title="Compliance Radar — Per CCP" />
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="ccp" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMut }} />
                <Radar dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.35} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionH title="Pillar Compliance" />
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={pillars} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <YAxis type="category" dataKey="pillar" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} width={150} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
                <Bar dataKey="avg" fill={T.gold} name="Compliance %" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
        <Card>
          <SectionH title="10 Core Carbon Principles — Full Framework" sub="ICVCM reference · compliance % = share of registered programs meeting each CCP" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ICVCM_CCPS.map(c => (
              <div key={c.num} style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderLeft: `3px solid ${c.compliance >= 80 ? T.green : c.compliance >= 65 ? T.gold : T.amber}`, borderRadius: 4, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: T.mono }}>CCP-{c.num} · {c.name}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Pill bg={T.surface} color={T.navy}>{c.pillar}</Pill>
                    <Pill bg={c.compliance >= 80 ? T.green : c.compliance >= 65 ? T.gold : T.amber} color="#fff">{c.compliance}%</Pill>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 6, lineHeight: 1.5 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const RenderVCMI = () => {
    const claimDist = useMemo(() => {
      const tiers = ['Platinum', 'Gold', 'Silver', 'Bronze'];
      return tiers.map(t => ({ tier: t, count: VCMI_CLAIMS.filter(v => v.claim === t).length, vol: VCMI_CLAIMS.filter(v => v.claim === t).reduce((s, v) => s + v.volume, 0) }));
    }, []);
    const removAvd = useMemo(() => VCMI_CLAIMS.map(v => ({ entity: v.entity, Removals: v.removals, Avoidance: v.avoidance })), []);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
          <Kpi label="Claim-Makers" value={VCMI_CLAIMS.length} accent={T.gold} sub="2023-24 reporting cycle" />
          <Kpi label="Platinum" value={VCMI_CLAIMS.filter(v => v.claim === 'Platinum').length} accent={T.navy} sub="100% residual offset" />
          <Kpi label="Gold" value={VCMI_CLAIMS.filter(v => v.claim === 'Gold').length} accent={T.gold} sub=">60% residual offset" />
          <Kpi label="MPS Prerequisite" value={pct(VCMI_CLAIMS.filter(v => v.prereqCheck).length / (VCMI_CLAIMS.length || 1) * 100, 0)} accent={T.sage} sub="Monitoring, Reporting, Assurance" />
          <Kpi label="Total Volume Claimed" value={`${fmt(VCMI_CLAIMS.reduce((s, v) => s + v.volume, 0), 1)} Mt`} accent={T.navyL} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
          <Card>
            <SectionH title="Claim Tier Distribution" />
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={claimDist} dataKey="count" nameKey="tier" outerRadius={92} label={(e) => `${e.tier} (${e.count})`}>
                  {claimDist.map((d, i) => <Cell key={i} fill={[T.navy, T.gold, T.sage, T.goldL][i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionH title="Removals vs Avoidance — VCMI Claim-Makers" sub="High-integrity claims trend toward removals (Platinum = 100% removals for residuals)" />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={removAvd}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="entity" tick={{ fontSize: 10, fill: T.textSec, fontFamily: T.mono }} angle={-20} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.mono }} />
                <Bar dataKey="Removals" stackId="a" fill={T.navy} />
                <Bar dataKey="Avoidance" stackId="a" fill={T.gold} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
        <Card>
          <SectionH title="VCMI Claim Register" sub="Corporate claims under VCMI Claims Code v2" />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.mono }}>
              <thead>
                <tr style={{ background: T.surfaceH, borderBottom: `2px solid ${T.border}` }}>
                  {['Entity', 'Claim', 'Vintage', 'Volume(Mt)', 'Coverage%', 'MPS', 'Removals(Mt)', 'Avoidance(Mt)'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.navy, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VCMI_CLAIMS.map((v, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ padding: '7px 10px', fontWeight: 700, color: T.navy }}>{v.entity}</td>
                    <td style={{ padding: '7px 10px' }}><Pill bg={v.claim === 'Platinum' ? T.navy : v.claim === 'Gold' ? T.gold : v.claim === 'Silver' ? T.sage : T.goldL} color="#fff">{v.claim}</Pill></td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{v.vintage}</td>
                    <td style={{ padding: '7px 10px', color: T.navy }}>{fmt(v.volume, 2)}</td>
                    <td style={{ padding: '7px 10px', color: T.navy }}>{v.coverage}%</td>
                    <td style={{ padding: '7px 10px', color: v.prereqCheck ? T.green : T.red }}>{v.prereqCheck ? '✓ Pass' : '✗ Fail'}</td>
                    <td style={{ padding: '7px 10px', color: T.navy }}>{fmt(v.removals, 2)}</td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{fmt(v.avoidance, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const RenderICROA = () => {
    const endorsedBar = ICROA_STANDARDS.map(s => ({ std: s.std, issued: s.mtIssued, projects: s.projects, endorsed: s.endorsed ? 1 : 0 }));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
          <Kpi label="Total Standards" value={ICROA_STANDARDS.length} accent={T.navy} />
          <Kpi label="ICROA Endorsed" value={ICROA_STANDARDS.filter(s => s.endorsed).length} accent={T.green} sub="Active endorsement" />
          <Kpi label="Cumulative Issued" value={`${fmt(ICROA_STANDARDS.reduce((s, x) => s + x.mtIssued, 0), 0)} Mt`} accent={T.gold} />
          <Kpi label="Total Projects" value={fmt(ICROA_STANDARDS.reduce((s, x) => s + x.projects, 0), 0)} accent={T.navyL} />
        </div>
        <Card>
          <SectionH title="Cumulative Issuance by Standard" />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={endorsedBar} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
              <YAxis type="category" dataKey="std" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} width={170} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.mono }} />
              <Bar dataKey="issued" fill={T.navy} name="MtCO2e Issued" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionH title="ICROA Endorsed Standards Register" />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.mono }}>
              <thead>
                <tr style={{ background: T.surfaceH, borderBottom: `2px solid ${T.border}` }}>
                  {['Standard', 'Scope', 'Projects', 'Mt Issued', 'ICROA', 'Notes'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.navy, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ICROA_STANDARDS.map((s, i) => (
                  <tr key={s.std} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ padding: '7px 10px', fontWeight: 700, color: T.navy }}>{s.std}</td>
                    <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{s.scope}</td>
                    <td style={{ padding: '7px 10px', color: T.navy }}>{fmt(s.projects, 0)}</td>
                    <td style={{ padding: '7px 10px', color: T.navy }}>{fmt(s.mtIssued, 1)}</td>
                    <td style={{ padding: '7px 10px' }}>{s.endorsed ? <Pill bg={T.green} color="#fff">Endorsed</Pill> : <Pill bg={T.amber} color="#fff">Under Review</Pill>}</td>
                    <td style={{ padding: '7px 10px', color: T.textMut, fontSize: 11 }}>{s.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const RenderArticle6 = () => {
    const byType = useMemo(() => {
      const type62 = ARTICLE6_PILOTS.filter(p => p.type === '6.2').length;
      const type64 = ARTICLE6_PILOTS.filter(p => p.type === '6.4').length;
      return [{ type: 'Art 6.2', count: type62, vol: ARTICLE6_PILOTS.filter(p => p.type === '6.2').reduce((s, p) => s + p.itmos, 0) }, { type: 'Art 6.4', count: type64, vol: ARTICLE6_PILOTS.filter(p => p.type === '6.4').reduce((s, p) => s + p.itmos, 0) }];
    }, []);
    const byHost = useMemo(() => {
      const m = {};
      ARTICLE6_PILOTS.forEach(p => { m[p.host] = (m[p.host] || 0) + p.itmos; });
      return Object.entries(m).map(([k, v]) => ({ host: k, itmos: v }));
    }, []);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
          <Kpi label="Active Pilots" value={ARTICLE6_PILOTS.length} accent={T.navy} />
          <Kpi label="Art 6.2 Bilaterals" value={ARTICLE6_PILOTS.filter(p => p.type === '6.2').length} accent={T.gold} />
          <Kpi label="ITMOs Tracked" value={`${fmt(ARTICLE6_PILOTS.reduce((s, p) => s + p.itmos, 0), 1)} Mt`} accent={T.sage} />
          <Kpi label="Corresponding Adj." value={pct(stats.art6CAPct, 0)} accent={T.green} sub="Double-counting prevention" />
          <Kpi label="Avg Price" value={`$${fmt(ARTICLE6_PILOTS.filter(p => p.price > 0).length ? ARTICLE6_PILOTS.filter(p => p.price > 0).reduce((s, p) => s + p.price, 0) / ARTICLE6_PILOTS.filter(p => p.price > 0).length : 0, 1)}`} accent={T.navyL} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
          <Card>
            <SectionH title="Pilots by Mechanism" />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byType}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="type" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.mono }} />
                <Bar dataKey="count" fill={T.navy} name="Pilots" />
                <Bar dataKey="vol" fill={T.gold} name="Mt ITMOs" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionH title="ITMOs by Host Country" />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byHost}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="host" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
                <Bar dataKey="itmos" fill={T.sage} name="Mt ITMOs" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
        <Card>
          <SectionH title="Article 6 Pilot Register" sub="Bilateral cooperative approaches & centralized A6.4 mechanism" />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.mono }}>
              <thead>
                <tr style={{ background: T.surfaceH, borderBottom: `2px solid ${T.border}` }}>
                  {['Pilot', 'Host', 'Buyer', 'Type', 'Activity', 'ITMOs(Mt)', 'CA', 'Start', '$/t'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.navy, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ARTICLE6_PILOTS.map((p, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ padding: '7px 10px', fontWeight: 700, color: T.navy }}>{p.pilot}</td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{p.host}</td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{p.buyer}</td>
                    <td style={{ padding: '7px 10px' }}><Pill bg={p.type === '6.2' ? T.navy : T.gold} color="#fff">{p.type}</Pill></td>
                    <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{p.activity}</td>
                    <td style={{ padding: '7px 10px', color: T.navy }}>{fmt(p.itmos, 2)}</td>
                    <td style={{ padding: '7px 10px', color: p.ca ? T.green : T.red }}>{p.ca ? '✓' : '✗'}</td>
                    <td style={{ padding: '7px 10px', color: T.textMut }}>{p.start}</td>
                    <td style={{ padding: '7px 10px', color: T.navy }}>{p.price > 0 ? `$${p.price}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const RenderBridge = () => {
    const bridgeFlow = [
      { market: 'EU ETS', type: 'Compliance', vol: 1580, price: 73 },
      { market: 'UK ETS', type: 'Compliance', vol: 140, price: 58 },
      { market: 'California', type: 'Compliance', vol: 380, price: 38 },
      { market: 'RGGI', type: 'Compliance', vol: 175, price: 21 },
      { market: 'China ETS', type: 'Compliance', vol: 4500, price: 11 },
      { market: 'Korea ETS', type: 'Compliance', vol: 590, price: 9 },
      { market: 'NZ ETS', type: 'Compliance', vol: 77, price: 42 },
      { market: 'VCM (VCS)', type: 'Voluntary', vol: 250, price: 7.2 },
      { market: 'VCM (GS)', type: 'Voluntary', vol: 55, price: 8.6 },
      { market: 'VCM (ACR)', type: 'Voluntary', vol: 68, price: 12.5 },
      { market: 'Art 6.2 ITMOs', type: 'Hybrid', vol: 14, price: 16 },
      { market: 'CORSIA', type: 'Compliance-Voluntary', vol: 120, price: 14 }
    ];
    const summary = useMemo(() => {
      const compVol = bridgeFlow.filter(b => b.type === 'Compliance').reduce((s, b) => s + b.vol, 0);
      const volVol = bridgeFlow.filter(b => b.type === 'Voluntary').reduce((s, b) => s + b.vol, 0);
      const total = compVol + volVol;
      return { compVol, volVol, ratio: total > 0 ? compVol / total * 100 : 0 };
    }, []);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
          <Kpi label="Compliance Volume" value={`${fmt(summary.compVol, 0)} Mt`} accent={T.navy} sub="ETS cap-and-trade" />
          <Kpi label="VCM Volume" value={`${fmt(summary.volVol, 0)} Mt`} accent={T.gold} sub="Voluntary retirements" />
          <Kpi label="Compliance Share" value={pct(summary.ratio, 0)} accent={T.sage} />
          <Kpi label="Compliance Avg $/t" value={`$${fmt(bridgeFlow.filter(b => b.type === 'Compliance').reduce((s, b) => s + b.price, 0) / (bridgeFlow.filter(b => b.type === 'Compliance').length || 1), 1)}`} accent={T.green} />
          <Kpi label="VCM Avg $/t" value={`$${fmt(bridgeFlow.filter(b => b.type === 'Voluntary').reduce((s, b) => s + b.price, 0) / (bridgeFlow.filter(b => b.type === 'Voluntary').length || 1), 1)}`} accent={T.navyL} />
        </div>
        <Card>
          <SectionH title="Market Volume & Price — Compliance vs Voluntary" sub="Volume (MtCO2e) bars + spot price overlay" />
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={bridgeFlow}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="market" tick={{ fontSize: 10, fill: T.textSec, fontFamily: T.mono }} angle={-25} textAnchor="end" height={80} />
              <YAxis yAxisId="L" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
              <YAxis yAxisId="R" orientation="right" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.mono }} />
              <Bar yAxisId="L" dataKey="vol" fill={T.navy} name="Volume Mt" />
              <Line yAxisId="R" type="monotone" dataKey="price" stroke={T.gold} strokeWidth={2} name="$/tCO2e" />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionH title="VCM ↔ Compliance Bridge Mechanisms" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12 }}>
            {[
              { mech: 'CORSIA', desc: 'ICAO aviation framework accepts ICVCM-CCP labeled VCM credits for Phase 1 compliance (2024-2026); hybrid bridge.' },
              { mech: 'EU ETS → Art 6', desc: 'Post-2030 linkage contemplated; EU Commission preparing legislative pathway for Art 6.2 ITMO imports.' },
              { mech: 'California Compliance Offsets', desc: 'Up to 4% of compliance obligation via offset projects; VCS and ACR approved protocols.' },
              { mech: 'Japan GX-ETS', desc: 'Launching 2026; JCM credits (Art 6.2) eligible for surrender alongside domestic allowances.' },
              { mech: 'Korea ETS KOC/KCU', desc: 'Korean Offset Credits; foreign CDM credits phased out 2026; Art 6.2 pathway opening.' },
              { mech: 'UK ETS', desc: 'No offset eligibility currently; review 2026 may introduce limited high-integrity VCM pathway.' }
            ].map((m, i) => (
              <div key={i} style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.gold}`, borderRadius: 4, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: T.mono }}>{m.mech}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 6, lineHeight: 1.5 }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const RenderQuality = () => {
    const avg = filteredQuality.length ? filteredQuality.reduce((s, p) => s + p.overall, 0) / filteredQuality.length : 0;
    const distR = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'C'].map(r => ({ rating: r, count: filteredQuality.filter(p => p.qualityRating === r).length }));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
          <Kpi label="Projects (Filtered)" value={filteredQuality.length} accent={T.navy} sub={`threshold ≥ ${qualityThreshold}`} />
          <Kpi label="Avg Overall Score" value={fmt(avg, 1)} accent={T.gold} sub="0-100 composite" />
          <Kpi label="Investment-Grade" value={filteredQuality.filter(p => ['AAA', 'AA', 'A'].includes(p.qualityRating)).length} accent={T.green} sub="AAA/AA/A" />
          <Kpi label="Sub-Grade" value={filteredQuality.filter(p => ['B', 'C'].includes(p.qualityRating)).length} accent={T.red} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card>
            <SectionH title="Quality Rating Distribution" />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={distR}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="rating" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
                <Bar dataKey="count">
                  {distR.map((d, i) => <Cell key={i} fill={d.rating === 'AAA' ? T.green : d.rating === 'AA' ? T.sage : d.rating === 'A' ? T.sageL : d.rating === 'BBB' ? T.gold : d.rating === 'BB' ? T.goldL : d.rating === 'B' ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionH title="5-Factor Quality Averages" sub="Weighted: Additionality 25% · Permanence 20% · MRV 20% · Co-benefits 20% · SDG 15%" />
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={[
                { factor: 'Additionality', value: filteredQuality.length ? filteredQuality.reduce((s, p) => s + p.additionality, 0) / filteredQuality.length : 0 },
                { factor: 'Permanence', value: filteredQuality.length ? filteredQuality.reduce((s, p) => s + p.permanence, 0) / filteredQuality.length : 0 },
                { factor: 'MRV', value: filteredQuality.length ? filteredQuality.reduce((s, p) => s + p.mrv, 0) / filteredQuality.length : 0 },
                { factor: 'Co-benefits', value: filteredQuality.length ? filteredQuality.reduce((s, p) => s + p.cobenefits, 0) / filteredQuality.length : 0 },
                { factor: 'SDG', value: filteredQuality.length ? filteredQuality.reduce((s, p) => s + p.sdg, 0) / filteredQuality.length : 0 }
              ]}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="factor" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMut }} />
                <Radar dataKey="value" stroke={T.gold} fill={T.gold} fillOpacity={0.4} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>
        <Card>
          <SectionH title="Credit Quality Register" sub="Sorted by overall composite score" />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: T.mono }}>
              <thead>
                <tr style={{ background: T.surfaceH, borderBottom: `2px solid ${T.border}` }}>
                  {['ID', 'Project', 'Type', 'Add.', 'Perm.', 'MRV', 'Co-ben.', 'SDG', 'Overall', 'Rating'].map(h => (
                    <th key={h} style={{ padding: '7px 8px', textAlign: 'left', color: T.navy, fontSize: 10, letterSpacing: 0.4, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...filteredQuality].sort((a, b) => b.overall - a.overall).map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ padding: '6px 8px', color: T.textMut }}>{p.id}</td>
                    <td style={{ padding: '6px 8px', color: T.navy, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '6px 8px', color: T.textSec }}>{p.type}</td>
                    <td style={{ padding: '6px 8px', color: T.text }}>{fmt(p.additionality, 0)}</td>
                    <td style={{ padding: '6px 8px', color: T.text }}>{fmt(p.permanence, 0)}</td>
                    <td style={{ padding: '6px 8px', color: T.text }}>{fmt(p.mrv, 0)}</td>
                    <td style={{ padding: '6px 8px', color: T.text }}>{fmt(p.cobenefits, 0)}</td>
                    <td style={{ padding: '6px 8px', color: T.text }}>{fmt(p.sdg, 0)}</td>
                    <td style={{ padding: '6px 8px', color: T.navy, fontWeight: 700 }}>{fmt(p.overall, 1)}</td>
                    <td style={{ padding: '6px 8px' }}><Pill bg={p.qualityRating === 'AAA' ? T.green : p.qualityRating === 'AA' ? T.sage : p.qualityRating === 'A' ? T.sageL : p.qualityRating === 'BBB' ? T.gold : p.qualityRating === 'BB' ? T.goldL : p.qualityRating === 'B' ? T.amber : T.red} color="#fff">{p.qualityRating}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const RenderCredibility = () => {
    const compCred = useMemo(() => {
      return ISSUERS.map(iss => {
        const cdpW = iss.cdp === 'A' ? 95 : iss.cdp === 'A-' ? 85 : iss.cdp === 'B' ? 72 : iss.cdp === 'B-' ? 62 : iss.cdp === 'C' ? 50 : iss.cdp === 'C-' ? 40 : iss.cdp === 'D' ? 28 : 10;
        const sbtiW = iss.sbti === '1.5C-Val' ? 95 : iss.sbti === 'WB2C-Val' ? 78 : iss.sbti === 'Committed' ? 55 : 15;
        const vcmiW = iss.vcmi === 'Platinum' ? 95 : iss.vcmi === 'Gold' ? 85 : iss.vcmi === 'Silver' ? 70 : iss.vcmi === 'Bronze' ? 50 : 20;
        const art6W = iss.art6 ? 80 : 40;
        const icvcmW = iss.icvcm;
        const composite = cdpW * 0.25 + sbtiW * 0.3 + vcmiW * 0.15 + art6W * 0.1 + icvcmW * 0.2;
        return { ...iss, cdpW, sbtiW, vcmiW, art6W, icvcmW, composite };
      });
    }, []);
    const selCred = compCred.find(c => c.ticker === selectedIssuer) || compCred[0];
    const radar = [
      { dim: 'CDP', value: selCred.cdpW },
      { dim: 'SBTi', value: selCred.sbtiW },
      { dim: 'VCMI', value: selCred.vcmiW },
      { dim: 'Article 6', value: selCred.art6W },
      { dim: 'ICVCM', value: selCred.icvcmW }
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
          <Kpi label="Issuers Scored" value={compCred.length} accent={T.navy} />
          <Kpi label="Avg Credibility" value={fmt(compCred.reduce((s, c) => s + c.composite, 0) / (compCred.length || 1), 1)} accent={T.gold} />
          <Kpi label="High Credibility (>80)" value={compCred.filter(c => c.composite > 80).length} accent={T.green} />
          <Kpi label="Low Credibility (<40)" value={compCred.filter(c => c.composite < 40).length} accent={T.red} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card>
            <SectionH title={`${selCred.ticker} — Credibility Composite Radar`} sub={selCred.name} />
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radar}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMut }} />
                <Radar dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.4} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: 6 }}>
              <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono, letterSpacing: 1, textTransform: 'uppercase' }}>Composite Score</div>
              <div style={{ fontSize: 32, color: T.navy, fontWeight: 700, fontFamily: T.mono }}>{fmt(selCred.composite, 1)}</div>
            </div>
          </Card>
          <Card>
            <SectionH title="Top 10 Credibility Ranking" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[...compCred].sort((a, b) => b.composite - a.composite).slice(0, 10).map((c, i) => (
                <div key={c.ticker} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: T.surfaceH, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.gold}`, borderRadius: 4 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, width: 20 }}>#{i + 1}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.navy, fontFamily: T.mono }}>{c.ticker}</span>
                    <span style={{ fontSize: 11, color: T.textSec }}>{c.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ width: 80, height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${c.composite}%`, height: '100%', background: T.gold }} />
                    </div>
                    <span style={{ fontSize: 11, color: T.navy, fontWeight: 700, fontFamily: T.mono, width: 38, textAlign: 'right' }}>{fmt(c.composite, 1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <Card>
          <SectionH title="Credibility — All Issuers (distribution)" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={[...compCred].sort((a, b) => b.composite - a.composite)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="ticker" tick={{ fontSize: 9, fill: T.textSec, fontFamily: T.mono }} angle={-45} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
              <Bar dataKey="composite">
                {[...compCred].sort((a, b) => b.composite - a.composite).map((c, i) => <Cell key={i} fill={c.composite > 80 ? T.green : c.composite > 60 ? T.sage : c.composite > 40 ? T.gold : T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    );
  };

  const RenderMatrix = () => {
    const taxActivities = [
      { activity: 'Electricity from Solar PV', obj: 'Mitigation', sca: 'SC', dnsh: 'Pass', credit: 'VCM ARR/Renew', ccp: 90 },
      { activity: 'Electricity from Wind', obj: 'Mitigation', sca: 'SC', dnsh: 'Pass', credit: 'VCM Renew', ccp: 88 },
      { activity: 'Forestry Management (afforestation)', obj: 'Mitigation', sca: 'SC', dnsh: 'Conditional', credit: 'VCM ARR', ccp: 72 },
      { activity: 'Manufacture of Cement (<0.469 tCO2/t)', obj: 'Mitigation', sca: 'SC-TH', dnsh: 'Pass', credit: 'VCM CCS pilot', ccp: 78 },
      { activity: 'Manufacture of Steel (elec-arc, <1.328)', obj: 'Mitigation', sca: 'SC-TH', dnsh: 'Pass', credit: 'VCM CCS', ccp: 74 },
      { activity: 'Manufacture of Hydrogen (<3 kgCO2e/kg)', obj: 'Mitigation', sca: 'SC-TH', dnsh: 'Pass', credit: 'VCM pending', ccp: 68 },
      { activity: 'Bioenergy (sustainability criteria met)', obj: 'Mitigation', sca: 'SC-TH', dnsh: 'Conditional', credit: 'GS Bio-CCS', ccp: 64 },
      { activity: 'Transport — Passenger Cars (<50 gCO2/km)', obj: 'Mitigation', sca: 'SC-TH', dnsh: 'Pass', credit: 'n/a', ccp: 0 },
      { activity: 'Building Retrofit (>30% primary energy)', obj: 'Mitigation', sca: 'SC', dnsh: 'Pass', credit: 'VCM EE', ccp: 70 },
      { activity: 'Direct Air CO2 Capture', obj: 'Mitigation', sca: 'SC-EN', dnsh: 'Pass', credit: 'Puro/Isometric', ccp: 95 },
      { activity: 'CCS Transport & Storage', obj: 'Mitigation', sca: 'SC-TR', dnsh: 'Pass', credit: 'ACR', ccp: 92 },
      { activity: 'Landfill Gas Capture', obj: 'Mitigation', sca: 'SC-TR', dnsh: 'Pass', credit: 'VCS/ACR/CAR', ccp: 82 },
      { activity: 'REDD+ Carbon Sink', obj: 'Mitigation', sca: 'SC', dnsh: 'Conditional', credit: 'VCS+CCB', ccp: 68 },
      { activity: 'Blue Carbon (Mangrove/Seagrass)', obj: 'Mitigation', sca: 'SC', dnsh: 'Pass', credit: 'VCS+CCB BCR', ccp: 78 },
      { activity: 'Enhanced Rock Weathering', obj: 'Mitigation', sca: 'SC-EN', dnsh: 'Pass', credit: 'Isometric', ccp: 88 }
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
          <Kpi label="Mapped Activities" value={taxActivities.length} accent={T.navy} sub="EU Taxonomy Annex 1" />
          <Kpi label="DNSH Pass" value={taxActivities.filter(t => t.dnsh === 'Pass').length} accent={T.green} sub="No significant harm" />
          <Kpi label="CCP-Linked" value={taxActivities.filter(t => t.ccp > 0).length} accent={T.gold} />
          <Kpi label="Avg CCP Score" value={fmt(taxActivities.filter(t => t.ccp > 0).reduce((s, t) => s + t.ccp, 0) / (taxActivities.filter(t => t.ccp > 0).length || 1), 1)} accent={T.sage} />
        </div>
        <Card>
          <SectionH title="Taxonomy Activity × Credit Integrity Matrix" sub="EU Taxonomy technical screening criteria vs VCM credit integrity scores · SC=Substantial Contribution · TH=Transitional · EN=Enabling · TR=Transitional Removal" />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.mono }}>
              <thead>
                <tr style={{ background: T.surfaceH, borderBottom: `2px solid ${T.border}` }}>
                  {['Activity', 'Objective', 'Contribution Type', 'DNSH', 'Credit Pathway', 'CCP Score'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.navy, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {taxActivities.map((a, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ padding: '7px 10px', color: T.navy, fontWeight: 600 }}>{a.activity}</td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{a.obj}</td>
                    <td style={{ padding: '7px 10px' }}><Pill bg={T.surface} color={T.navy}>{a.sca}</Pill></td>
                    <td style={{ padding: '7px 10px' }}><Pill bg={a.dnsh === 'Pass' ? T.green : a.dnsh === 'Conditional' ? T.gold : T.red} color="#fff">{a.dnsh}</Pill></td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{a.credit}</td>
                    <td style={{ padding: '7px 10px' }}>{a.ccp > 0 ? <Pill bg={a.ccp >= 80 ? T.green : a.ccp >= 65 ? T.gold : T.amber} color="#fff">{a.ccp}</Pill> : <span style={{ color: T.textMut }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <SectionH title="Matrix Heatmap — CCP Quality across Taxonomy Activities" />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={taxActivities.filter(t => t.ccp > 0)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
              <YAxis type="category" dataKey="activity" tick={{ fontSize: 10, fill: T.textSec, fontFamily: T.mono }} width={210} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
              <Bar dataKey="ccp">
                {taxActivities.filter(t => t.ccp > 0).map((a, i) => <Cell key={i} fill={a.ccp >= 80 ? T.green : a.ccp >= 65 ? T.gold : T.amber} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    );
  };

  const RenderPortfolio = () => {
    const portfolio = useMemo(() => {
      return ISSUERS.slice(0, 20).map((iss, i) => {
        const h = hashStr(iss.ticker);
        const holdings = 5 + Math.floor(sr(h) * 45);
        const creditsHeld = iss.vcmi === 'Platinum' || iss.vcmi === 'Gold' ? 2 + sr(h + 1) * 8 : iss.vcmi === 'Silver' ? 0.5 + sr(h + 1) * 3 : iss.vcmi === 'Bronze' ? 0.1 + sr(h + 1) * 1.5 : 0;
        const avgQuality = iss.icvcm;
        const exposureDollars = holdings * (iss.mcap / 1000) * 0.05;
        return { ticker: iss.ticker, name: iss.name, sector: iss.sector, holdings, creditsHeld, avgQuality, exposureDollars };
      });
    }, []);
    const totalCredits = portfolio.reduce((s, p) => s + p.creditsHeld, 0);
    const totalExp = portfolio.reduce((s, p) => s + p.exposureDollars, 0);
    const weightedQ = totalCredits > 0 ? portfolio.reduce((s, p) => s + p.creditsHeld * p.avgQuality, 0) / totalCredits : 0;
    const sectorExposure = useMemo(() => {
      const m = {};
      portfolio.forEach(p => { m[p.sector] = m[p.sector] || { sector: p.sector, credits: 0, exposure: 0 }; m[p.sector].credits += p.creditsHeld; m[p.sector].exposure += p.exposureDollars; });
      return Object.values(m);
    }, [portfolio]);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
          <Kpi label="Portfolio Issuers" value={portfolio.length} accent={T.navy} />
          <Kpi label="Total Credits Held" value={`${fmt(totalCredits, 1)} Mt`} accent={T.gold} />
          <Kpi label="Wgt Avg ICVCM Quality" value={fmt(weightedQ, 1)} accent={T.sage} sub="credit-weighted" />
          <Kpi label="Portfolio Exposure" value={`$${fmt(totalExp, 1)} B`} accent={T.navyL} sub="notional at risk" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <Card>
            <SectionH title="Credits Held × Quality by Issuer" sub="Bar = Mt credits · Line = ICVCM quality score" />
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={portfolio}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="ticker" tick={{ fontSize: 10, fill: T.textSec, fontFamily: T.mono }} angle={-35} textAnchor="end" height={60} />
                <YAxis yAxisId="L" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <YAxis yAxisId="R" orientation="right" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.mono }} />
                <Bar yAxisId="L" dataKey="creditsHeld" fill={T.gold} name="Credits Mt" />
                <Line yAxisId="R" type="monotone" dataKey="avgQuality" stroke={T.navy} strokeWidth={2} name="ICVCM" />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionH title="Sector Exposure" sub="Credits (Mt) by sector" />
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={sectorExposure} dataKey="credits" nameKey="sector" outerRadius={96} label={(e) => e.sector}>
                  {sectorExposure.map((d, i) => <Cell key={i} fill={[T.navy, T.gold, T.sage, T.navyL, T.goldL, T.sageL, T.amber, T.textMut][i % 8]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
        <Card>
          <SectionH title="Portfolio Holdings Register" />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.mono }}>
              <thead>
                <tr style={{ background: T.surfaceH, borderBottom: `2px solid ${T.border}` }}>
                  {['Ticker', 'Name', 'Sector', 'Holdings %', 'Credits (Mt)', 'ICVCM', 'Exposure ($B)'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.navy, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...portfolio].sort((a, b) => b.creditsHeld - a.creditsHeld).map((p, i) => (
                  <tr key={p.ticker} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ padding: '7px 10px', fontWeight: 700, color: T.navy }}>{p.ticker}</td>
                    <td style={{ padding: '7px 10px' }}>{p.name}</td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{p.sector}</td>
                    <td style={{ padding: '7px 10px', color: T.navy }}>{p.holdings}%</td>
                    <td style={{ padding: '7px 10px', color: T.navy }}>{fmt(p.creditsHeld, 2)}</td>
                    <td style={{ padding: '7px 10px', color: p.avgQuality >= 80 ? T.green : p.avgQuality >= 60 ? T.gold : T.red }}>{fmt(p.avgQuality, 0)}</td>
                    <td style={{ padding: '7px 10px', color: T.navy }}>${fmt(p.exposureDollars, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const RenderRoadmap = () => {
    const byYear = useMemo(() => {
      const m = {};
      ROADMAP.forEach(r => { m[r.year] = m[r.year] || { year: r.year, count: 0, high: 0 }; m[r.year].count++; if (r.impact === 'High') m[r.year].high++; });
      return Object.values(m);
    }, []);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
          <Kpi label="Total Milestones" value={ROADMAP.length} accent={T.navy} sub="2024-2030" />
          <Kpi label="High-Impact" value={ROADMAP.filter(r => r.impact === 'High').length} accent={T.red} />
          <Kpi label="Peak Year" value={[...byYear].sort((a, b) => b.count - a.count)[0]?.year || '—'} accent={T.gold} />
          <Kpi label="Unique Actors" value={new Set(ROADMAP.map(r => r.actor)).size} accent={T.sage} />
        </div>
        <Card>
          <SectionH title="Milestone Density by Year" />
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={byYear}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.mono }} />
              <Area type="monotone" dataKey="count" stackId="1" stroke={T.navy} fill={T.navy} fillOpacity={0.25} name="All" />
              <Area type="monotone" dataKey="high" stackId="2" stroke={T.red} fill={T.red} fillOpacity={0.4} name="High-Impact" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionH title="Regulatory Timeline 2024-2030" sub="Chronological milestones across CDP/SBTi/ICVCM/VCMI/UNFCCC Art 6/EU-CSRD/US-SEC/ICAO/ISSB/EU-CBAM" />
          <div style={{ position: 'relative', paddingLeft: 30 }}>
            <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 2, background: T.gold }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...ROADMAP].sort((a, b) => (a.year - b.year) || a.q.localeCompare(b.q)).map((r, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -25, top: 8, width: 10, height: 10, borderRadius: '50%', background: r.impact === 'High' ? T.red : r.impact === 'Med' ? T.gold : T.sage, border: `2px solid ${T.surface}` }} />
                  <div style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderLeft: `3px solid ${r.impact === 'High' ? T.red : r.impact === 'Med' ? T.gold : T.sage}`, borderRadius: 4, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Pill bg={T.navy} color="#fff">{r.year} {r.q}</Pill>
                        <Pill bg={T.surface} color={T.navy}>{r.actor}</Pill>
                        <span style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: T.mono }}>{r.title}</span>
                      </div>
                      <Pill bg={r.impact === 'High' ? T.red : r.impact === 'Med' ? T.gold : T.sage} color="#fff">{r.impact}</Pill>
                    </div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 6, lineHeight: 1.5 }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  };


  // ============================================================
  // TAB 15 — Permanence Risk Monte Carlo (VCM projects)
  // ============================================================
  const RenderPermanenceMC = () => {
    const N_PATHS = 400;
    const HORIZON = 100;

    const mcResults = useMemo(() => {
      return VCM_PROJECTS.map((p) => {
        const haz = PERMANENCE_HAZARDS[p.type] || { mean: 1.0, low: 0.5, high: 1.5, buffer: 15 };
        const annualHaz = haz.mean / 100;
        const startingStock = p.volume; // MtCO2e
        const reversalPaths = [];
        const survivalSumByYear = new Array(HORIZON).fill(0);
        const h = hashStr(p.id);
        for (let path = 0; path < N_PATHS; path++) {
          let remaining = startingStock;
          let cumRev = 0;
          for (let y = 0; y < HORIZON; y++) {
            // Draw hazard event + stochastic severity (0.5-1.0 of remaining or partial release)
            const u = sr(path * 733 + y * 17 + h);
            if (u < annualHaz && remaining > 0) {
              const severity = 0.15 + sr(path * 19 + y * 3 + h) * 0.45; // 15-60% of remaining
              const rel = remaining * severity;
              cumRev += rel;
              remaining -= rel;
            }
            // Slow background decay component (0.05%/yr)
            const decay = remaining * 0.0005;
            cumRev += decay;
            remaining -= decay;
            survivalSumByYear[y] += remaining;
          }
          reversalPaths.push(cumRev);
        }
        const sorted = [...reversalPaths].sort((a, b) => a - b);
        const mean = reversalPaths.reduce((a, v) => a + v, 0) / Math.max(1, N_PATHS);
        const p05 = sorted[Math.floor(N_PATHS * 0.05)] || 0;
        const p50 = sorted[Math.floor(N_PATHS * 0.50)] || 0;
        const p95 = sorted[Math.floor(N_PATHS * 0.95)] || 0;
        const worst = sorted[N_PATHS - 1] || 0;
        const expectedReversalPct = (mean / Math.max(1e-9, startingStock)) * 100;
        const bufferAdequacy = ((haz.buffer - expectedReversalPct) / Math.max(1e-9, haz.buffer)) * 100;
        const survivalCurve = survivalSumByYear.map((s, y) => ({ year: y + 1, stock: s / Math.max(1, N_PATHS), pctRemaining: (s / Math.max(1, N_PATHS)) / Math.max(1e-9, startingStock) * 100 }));
        return {
          id: p.id, name: p.name, type: p.type, standard: p.standard, volume: startingStock,
          hazardMean: haz.mean, buffer: haz.buffer,
          mean, p05, p50, p95, worst, expectedReversalPct,
          bufferAdequacy, survivalCurve
        };
      });
    }, []);

    const portfolioAgg = useMemo(() => {
      const totalVol = mcResults.reduce((s, r) => s + r.volume, 0);
      const totalExpected = mcResults.reduce((s, r) => s + r.mean, 0);
      const totalP95 = mcResults.reduce((s, r) => s + r.p95, 0);
      const totalBuffer = mcResults.reduce((s, r) => s + r.volume * (r.buffer / 100), 0);
      return { totalVol, totalExpected, totalP95, totalBuffer, bufferGap: totalP95 - totalBuffer };
    }, [mcResults]);

    const byType = useMemo(() => {
      const map = {};
      mcResults.forEach(r => {
        if (!map[r.type]) map[r.type] = { type: r.type, volume: 0, expected: 0, p95: 0, count: 0 };
        map[r.type].volume += r.volume;
        map[r.type].expected += r.mean;
        map[r.type].p95 += r.p95;
        map[r.type].count += 1;
      });
      return Object.values(map).map(d => ({ ...d, expectedPct: (d.expected / Math.max(1e-9, d.volume)) * 100, p95Pct: (d.p95 / Math.max(1e-9, d.volume)) * 100 }));
    }, [mcResults]);

    const [selectedId, setSelectedId] = useState(VCM_PROJECTS[0].id);
    const selProject = mcResults.find(r => r.id === selectedId) || mcResults[0];

    return (
      <div style={{ padding: '24px 28px', display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Kpi label="Portfolio Stock" value={`${fmt(portfolioAgg.totalVol, 1)} MtCO2e`} sub={`${mcResults.length} VCM projects · 100yr horizon`} accent={T.navy} />
          <Kpi label="Expected Reversals" value={`${fmt(portfolioAgg.totalExpected, 2)} Mt`} sub={`${pct((portfolioAgg.totalExpected / Math.max(1e-9, portfolioAgg.totalVol)) * 100, 1)} of stock`} accent={T.gold} />
          <Kpi label="95th Pctile Reversals" value={`${fmt(portfolioAgg.totalP95, 2)} Mt`} sub={`Tail risk · ${N_PATHS} paths × ${HORIZON}yr`} accent={T.red} />
          <Kpi label="Buffer Pool Gap" value={`${fmt(portfolioAgg.bufferGap, 2)} Mt`} sub={portfolioAgg.bufferGap > 0 ? 'Under-buffered vs P95' : 'Buffer adequate'} accent={portfolioAgg.bufferGap > 0 ? T.red : T.green} />
        </div>

        <Card>
          <SectionH title={`Monte Carlo Configuration`} sub={`Box–Muller seeded PRNG · ${N_PATHS} paths × ${HORIZON} years per project · stochastic annual hazard + severity + background decay`} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {Object.keys(PERMANENCE_HAZARDS).map(k => (
              <Pill key={k} bg={T.surface} color={T.navy}>
                {k}: {PERMANENCE_HAZARDS[k].mean.toFixed(2)}%/yr (buf {PERMANENCE_HAZARDS[k].buffer}%)
              </Pill>
            ))}
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
          <Card>
            <SectionH title="Expected vs P95 Reversals by Project Type" />
            <ResponsiveContainer width="100%" height={310}>
              <BarChart data={byType}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="type" tick={{ fontSize: 10, fill: T.textSec, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} label={{ value: '% of issued stock', angle: -90, position: 'insideLeft', style: { fontFamily: T.mono, fontSize: 11, fill: T.textSec } }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.mono }} />
                <Bar dataKey="expectedPct" fill={T.gold} name="Mean reversal %" />
                <Bar dataKey="p95Pct" fill={T.red} name="P95 reversal %" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionH title="Project Detail Selector" />
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)} style={{ width: '100%', padding: 8, fontFamily: T.mono, fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, background: T.surface }}>
              {mcResults.map(r => <option key={r.id} value={r.id}>{r.id} · {r.name.slice(0, 34)}</option>)}
            </select>
            {selProject && (
              <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: T.surfaceH, padding: 10, borderRadius: 4 }}>
                    <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>STOCK</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, fontFamily: T.mono }}>{fmt(selProject.volume, 2)} Mt</div>
                  </div>
                  <div style={{ background: T.surfaceH, padding: 10, borderRadius: 4 }}>
                    <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>HAZARD</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, fontFamily: T.mono }}>{fmt(selProject.hazardMean, 2)}%/yr</div>
                  </div>
                  <div style={{ background: T.surfaceH, padding: 10, borderRadius: 4 }}>
                    <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>MEAN REV</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.gold, fontFamily: T.mono }}>{fmt(selProject.mean, 3)} Mt</div>
                  </div>
                  <div style={{ background: T.surfaceH, padding: 10, borderRadius: 4 }}>
                    <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>P95 REV</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.red, fontFamily: T.mono }}>{fmt(selProject.p95, 3)} Mt</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>
                  Buffer adequacy: <strong style={{ color: selProject.bufferAdequacy > 0 ? T.green : T.red }}>{pct(selProject.bufferAdequacy, 1)}</strong> of design buffer ({selProject.buffer}%).
                </div>
              </div>
            )}
          </Card>
        </div>

        <Card>
          <SectionH title={`100-Year Survival Curve — ${selProject?.name || '—'}`} sub="Mean remaining stock across simulated reversal paths" />
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={selProject?.survivalCurve || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} label={{ value: 'year', position: 'insideBottom', offset: -4, style: { fontFamily: T.mono, fontSize: 11, fill: T.textSec } }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} label={{ value: '% remaining', angle: -90, position: 'insideLeft', style: { fontFamily: T.mono, fontSize: 11, fill: T.textSec } }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
              <Area type="monotone" dataKey="pctRemaining" stroke={T.navy} fill={T.navy} fillOpacity={0.25} name="Mean stock %" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionH title="Full Project Table (sortable by P95 reversal)" />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.surfaceH, borderBottom: `1px solid ${T.border}` }}>
                  {['ID', 'Project', 'Type', 'Stock Mt', 'Hazard %', 'Mean Mt', 'P50 Mt', 'P95 Mt', 'Worst Mt', 'Exp % Stock', 'Buffer Gap'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...mcResults].sort((a, b) => b.p95 - a.p95).map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ padding: '6px 10px' }}>{r.id}</td>
                    <td style={{ padding: '6px 10px' }}>{r.name}</td>
                    <td style={{ padding: '6px 10px' }}>{r.type}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>{fmt(r.volume, 2)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>{fmt(r.hazardMean, 2)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: T.gold }}>{fmt(r.mean, 3)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>{fmt(r.p50, 3)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: T.red }}>{fmt(r.p95, 3)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>{fmt(r.worst, 3)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>{pct(r.expectedReversalPct, 2)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: r.bufferAdequacy > 0 ? T.green : T.red }}>{pct(r.bufferAdequacy, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  // ============================================================
  // TAB 16 — Marginal Abatement Cost Curve (MACC)
  // ============================================================
  const RenderMACC = () => {
    const [priceRef, setPriceRef] = useState('EUA');
    const priceRefs = { EUA: 85, VCM: 10, ART6: 18 };
    const refLine = priceRefs[priceRef] || 85;

    const maccSorted = useMemo(() => {
      const sorted = [...MACC_MEASURES].sort((a, b) => a.cost - b.cost);
      let cum = 0;
      return sorted.map(m => {
        const start = cum;
        cum += m.potential;
        return { ...m, cumStart: start, cumEnd: cum, width: m.potential, midX: start + m.potential / 2 };
      });
    }, []);

    const totalPotential = maccSorted.reduce((s, m) => s + m.potential, 0);
    const economicAbate = maccSorted.filter(m => m.cost <= refLine).reduce((s, m) => s + m.potential, 0);
    const weightedAvgCost = maccSorted.reduce((s, m) => s + m.cost * m.potential, 0) / Math.max(1e-9, totalPotential);

    const bySector = useMemo(() => {
      const map = {};
      maccSorted.forEach(m => {
        if (!map[m.sector]) map[m.sector] = { sector: m.sector, potential: 0, weightedCost: 0 };
        map[m.sector].potential += m.potential;
        map[m.sector].weightedCost += m.cost * m.potential;
      });
      return Object.values(map).map(s => ({ ...s, avgCost: s.weightedCost / Math.max(1e-9, s.potential) }));
    }, [maccSorted]);

    const maccBars = maccSorted.map(m => ({ ...m, label: m.measure.slice(0, 18) }));

    return (
      <div style={{ padding: '24px 28px', display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Kpi label="Total Potential" value={`${fmt(totalPotential, 1)} GtCO2/yr`} sub={`${MACC_MEASURES.length} measures · 7 sectors`} accent={T.navy} />
          <Kpi label="Economic @ Ref Price" value={`${fmt(economicAbate, 1)} Gt`} sub={`${pct(economicAbate / Math.max(1e-9, totalPotential) * 100, 0)} of pool below $${refLine}/t`} accent={T.green} />
          <Kpi label="Weighted-Avg Cost" value={`$${fmt(weightedAvgCost, 0)}/t`} sub="Volume-weighted across all measures" accent={T.gold} />
          <Kpi label="Reference Price" value={`$${refLine}/t`} sub={priceRef === 'EUA' ? 'EU ETS (EUA)' : priceRef === 'VCM' ? 'Voluntary (VCM avg)' : 'Article 6 clearing'} accent={T.red} />
        </div>

        <Card>
          <SectionH title="Cost Curve (sorted ascending by $/tCO2)" sub="Bar width ∝ abatement potential (MtCO2/yr). Negative cost = net saving. Horizontal reference = carbon price." />
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {Object.keys(priceRefs).map(p => (
              <button key={p} onClick={() => setPriceRef(p)} style={{ padding: '4px 11px', border: `1px solid ${priceRef === p ? T.navy : T.border}`, background: priceRef === p ? T.navy : T.surface, color: priceRef === p ? '#fff' : T.navy, fontFamily: T.mono, fontSize: 11, borderRadius: 3, cursor: 'pointer' }}>
                {p === 'EUA' ? `EUA €85 (~$${priceRefs.EUA})` : p === 'VCM' ? `VCM avg $${priceRefs.VCM}` : `Art 6 $${priceRefs.ART6}`}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={maccBars}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: T.textSec, fontFamily: T.mono }} angle={-35} textAnchor="end" height={80} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} label={{ value: '$/tCO2', angle: -90, position: 'insideLeft', style: { fontFamily: T.mono, fontSize: 11, fill: T.textSec } }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} formatter={(v, n, p) => {
                if (n === 'Cost') return [`$${v}/t — potential ${p?.payload?.potential} Mt/yr`, 'Cost'];
                return [v, n];
              }} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.mono }} />
              <Bar dataKey="cost" name="Cost">
                {maccBars.map((m, i) => (
                  <Cell key={i} fill={m.cost < 0 ? T.green : m.cost <= refLine ? T.sage : m.cost <= 150 ? T.gold : T.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
          <Card>
            <SectionH title="Cumulative Abatement vs Cost Step Function" sub="x = cumulative Gt abated, y = marginal cost of last measure" />
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={maccSorted.map(m => ({ x: m.cumEnd, cost: m.cost, measure: m.measure }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} label={{ value: 'Cumulative Gt CO2/yr', position: 'insideBottom', offset: -4, style: { fontFamily: T.mono, fontSize: 11, fill: T.textSec } }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} label={{ value: '$/tCO2', angle: -90, position: 'insideLeft', style: { fontFamily: T.mono, fontSize: 11, fill: T.textSec } }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
                <Line type="stepAfter" dataKey="cost" stroke={T.navy} strokeWidth={2} dot={{ r: 3, fill: T.navy }} name="Marginal cost" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionH title="Sector Roll-up" />
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid stroke={T.border} />
                <XAxis type="number" dataKey="potential" name="Potential Gt" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} label={{ value: 'Potential Gt/yr', position: 'insideBottom', offset: -4, style: { fontFamily: T.mono, fontSize: 11, fill: T.textSec } }} />
                <YAxis type="number" dataKey="avgCost" name="Avg cost" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} label={{ value: '$/t', angle: -90, position: 'insideLeft', style: { fontFamily: T.mono, fontSize: 11, fill: T.textSec } }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={bySector} fill={T.navy}>
                  {bySector.map((s, i) => <Cell key={i} fill={s.avgCost < 0 ? T.green : s.avgCost < 50 ? T.sage : s.avgCost < 150 ? T.gold : T.red} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 10, fontSize: 11, color: T.textSec, fontFamily: T.mono }}>
              {bySector.map(s => <div key={s.sector}>· {s.sector}: {fmt(s.potential, 2)} Gt @ ${fmt(s.avgCost, 0)}/t avg</div>)}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // ============================================================
  // TAB 17 — Forward Price Surface (vintage × project-type × standard)
  // ============================================================
  const RenderForwardSurface = () => {
    const VINTAGES = [2020, 2021, 2022, 2023, 2024];
    const PTYPES = ['REDD+', 'ARR', 'DAC', 'Blue Carbon', 'CCS'];
    const STDS = ['VCS', 'GS', 'Puro', 'ACR', 'CDM'];
    const [vintageSel, setVintageSel] = useState(2023);
    const [horizonYrs, setHorizonYrs] = useState(5);

    // Build base spot price by type (from VCM_PROJECTS median).
    const spotByType = useMemo(() => {
      const out = {};
      PTYPES.forEach(t => {
        const pricesForType = VCM_PROJECTS.filter(p => p.type === t).map(p => p.price);
        if (pricesForType.length > 0) {
          const sorted = [...pricesForType].sort((a, b) => a - b);
          out[t] = sorted[Math.floor(sorted.length / 2)];
        } else {
          out[t] = 15;
        }
      });
      return out;
    }, []);

    // Forward curve per (type, tenor): F(t) = Spot * (1 + carry + roll)^t * vintageAdj * stdAdj.
    const surfaceGrid = useMemo(() => {
      const rows = [];
      PTYPES.forEach(tp => {
        STDS.forEach(st => {
          const spot = spotByType[tp] || 15;
          // Vintage adjustment: older vintages trade at discount.
          const vintageAdj = 1 - (2024 - vintageSel) * 0.09;
          // Standard quality premium.
          const stdPrem = { VCS: 1.0, GS: 1.05, Puro: 1.35, ACR: 1.08, CDM: 0.22 }[st] || 1.0;
          // Convenience yield / carry (annualized).
          const carry = 0.035 + (['DAC', 'CCS'].includes(tp) ? 0.04 : 0) + sr(hashStr(tp + st)) * 0.02;
          // Roll yield deterministic small: reflects supply-demand imbalance.
          const roll = 0.015 + sr(hashStr(tp + st) + 1) * 0.02;
          const row = { type: tp, standard: st, spot: spot * vintageAdj * stdPrem, carry, roll };
          for (let t = 1; t <= 10; t++) {
            row[`F${t}`] = row.spot * Math.pow(1 + carry + roll, t);
          }
          rows.push(row);
        });
      });
      return rows;
    }, [vintageSel, spotByType]);

    // Heatmap cells: rows=type, cols=standard, value=F(horizon).
    const heatmap = useMemo(() => {
      const cells = [];
      PTYPES.forEach((tp, ri) => {
        STDS.forEach((st, ci) => {
          const row = surfaceGrid.find(r => r.type === tp && r.standard === st);
          const val = row ? row[`F${horizonYrs}`] : 0;
          cells.push({ type: tp, standard: st, value: val, ri, ci });
        });
      });
      const vals = cells.map(c => c.value);
      const maxV = Math.max(1e-9, ...vals);
      return cells.map(c => ({ ...c, intensity: c.value / maxV }));
    }, [surfaceGrid, horizonYrs]);

    // Term-structure line chart for selected type (all standards).
    const [typeSel, setTypeSel] = useState('REDD+');
    const termStruct = useMemo(() => {
      const data = [];
      for (let t = 1; t <= 10; t++) {
        const pt = { tenor: t };
        STDS.forEach(st => {
          const row = surfaceGrid.find(r => r.type === typeSel && r.standard === st);
          pt[st] = row ? row[`F${t}`] : 0;
        });
        data.push(pt);
      }
      return data;
    }, [surfaceGrid, typeSel]);

    // EUA reference for basis-risk plot.
    const EUA_SPOT = 85;
    const EUA_CURVE = Array.from({ length: 10 }, (_, i) => ({ tenor: i + 1, eua: EUA_SPOT * Math.pow(1.028, i + 1) }));

    const basisData = useMemo(() => {
      const vcmVCS = termStruct.map(d => d.VCS);
      return EUA_CURVE.map((d, i) => ({ tenor: d.tenor, eua: d.eua, vcm: vcmVCS[i] || 0, basis: d.eua - (vcmVCS[i] || 0) }));
    }, [termStruct]);

    return (
      <div style={{ padding: '24px 28px', display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Kpi label="Grid Cells" value={`${PTYPES.length * STDS.length}`} sub={`${PTYPES.length} types × ${STDS.length} standards`} accent={T.navy} />
          <Kpi label="Forward Horizons" value="10 years" sub="F(1) through F(10) per cell" accent={T.gold} />
          <Kpi label="Active Vintage" value={`${vintageSel}`} sub={`Vintage discount ${fmt((2024 - vintageSel) * 9, 1)}%`} accent={T.sage} />
          <Kpi label="EUA Ref Spot" value={`$${EUA_SPOT}`} sub={`Basis (VCS REDD+ vs EUA @ ${horizonYrs}yr)`} accent={T.red} />
        </div>

        <Card>
          <SectionH title="Surface Controls" />
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontFamily: T.mono, color: T.textSec }}>Vintage:</span>
              {VINTAGES.map(v => (
                <button key={v} onClick={() => setVintageSel(v)} style={{ padding: '4px 9px', border: `1px solid ${vintageSel === v ? T.navy : T.border}`, background: vintageSel === v ? T.navy : T.surface, color: vintageSel === v ? '#fff' : T.navy, fontFamily: T.mono, fontSize: 11, borderRadius: 3, cursor: 'pointer' }}>{v}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontFamily: T.mono, color: T.textSec }}>Horizon (yr):</span>
              <input type="range" min={1} max={10} value={horizonYrs} onChange={e => setHorizonYrs(parseInt(e.target.value))} style={{ width: 180 }} />
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.navy, fontWeight: 700 }}>{horizonYrs}y</span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontFamily: T.mono, color: T.textSec }}>Focus type:</span>
              {PTYPES.map(t => (
                <button key={t} onClick={() => setTypeSel(t)} style={{ padding: '4px 9px', border: `1px solid ${typeSel === t ? T.navy : T.border}`, background: typeSel === t ? T.navy : T.surface, color: typeSel === t ? '#fff' : T.navy, fontFamily: T.mono, fontSize: 10, borderRadius: 3, cursor: 'pointer' }}>{t}</button>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <SectionH title={`Heatmap — Forward Price F(${horizonYrs}y) · Vintage ${vintageSel}`} sub="Rows = project type · columns = standard. Cell color = relative price intensity (darker = higher). Label shows $/tCO2." />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 11, width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, background: T.surfaceH }}>TYPE \ STD</th>
                  {STDS.map(s => <th key={s} style={{ padding: '8px 10px', textAlign: 'center', color: T.textSec, background: T.surfaceH }}>{s}</th>)}
                </tr>
              </thead>
              <tbody>
                {PTYPES.map(tp => (
                  <tr key={tp}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: T.navy, background: T.surfaceH }}>{tp}</td>
                    {STDS.map(st => {
                      const cell = heatmap.find(c => c.type === tp && c.standard === st);
                      const intensity = cell?.intensity || 0;
                      const bg = `rgba(27, 58, 92, ${0.10 + intensity * 0.70})`;
                      return (
                        <td key={st} style={{ padding: '14px 10px', textAlign: 'center', background: bg, color: intensity > 0.5 ? '#fff' : T.navy, fontWeight: 600, borderRight: `1px solid ${T.border}` }}>
                          ${fmt(cell?.value || 0, 1)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card>
            <SectionH title={`Term Structure — ${typeSel}`} sub="Forward curve by standard, tenor 1-10yr" />
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={termStruct}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="tenor" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} label={{ value: 'tenor (yr)', position: 'insideBottom', offset: -4, style: { fontFamily: T.mono, fontSize: 11, fill: T.textSec } }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} label={{ value: '$/tCO2', angle: -90, position: 'insideLeft', style: { fontFamily: T.mono, fontSize: 11, fill: T.textSec } }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.mono }} />
                <Line type="monotone" dataKey="VCS" stroke={T.navy} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="GS" stroke={T.gold} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Puro" stroke={T.red} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ACR" stroke={T.sage} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="CDM" stroke={T.textMut} strokeWidth={2} dot={false} strokeDasharray="4 3" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionH title="Basis Risk — EUA vs VCM VCS" sub="Absolute and relative basis (EUA − VCM) across tenors" />
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={basisData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="tenor" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.mono }} />
                <Bar dataKey="basis" fill={T.gold} name="Basis $/t" />
                <Line type="monotone" dataKey="eua" stroke={T.navy} strokeWidth={2} dot={false} name="EUA" />
                <Line type="monotone" dataKey="vcm" stroke={T.sage} strokeWidth={2} dot={false} name="VCM (VCS REDD+)" />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    );
  };

  // ============================================================
  // TAB 18 — Tonne-Year Accounting (Moura-Costa / Lashof / TYA)
  // ============================================================
  const RenderTonneYear = () => {
    // Canonical integration window 100 yr (AR6 GWP100). CO2 AGWP100 ≈ 9.171e-14 W·yr/m² per kg; we use a simplified 1.0 normalizer and express method factors.
    const [horizon, setHorizon] = useState(100);
    const [projectSel, setProjectSel] = useState(VCM_PROJECTS[0].id);

    // Method factors
    // Moura-Costa: equivalence = 1 permanent tCO2 ≡ 55 tCO2-years (IPCC 2000 SAR-era; adjusted per paper)
    // Lashof: equivalence based on equivalent radiative forcing area shift; typically 1 t ≡ ~42 tCO2-yrs over 100 yr.
    // TYA (Ton-Year-Ton): dynamic LCA — each deferred emission yr worth (1/horizon) t permanent.
    const METHODS = [
      { id: 'MC', name: 'Moura-Costa', factor: 55, desc: 'IPCC 2000; 1 permanent t ≡ 55 tCO2-yrs (radiative forcing area).' },
      { id: 'LF', name: 'Lashof', factor: 42, desc: 'Shifts AGWP100 tail beyond integration window; ~42 tCO2-yrs per permanent t.' },
      { id: 'TYA', name: 'Ton-Year-Ton', factor: horizon, desc: 'Dynamic: 1 deferred tCO2 for 1 yr = 1/horizon permanent t.' }
    ];

    const project = VCM_PROJECTS.find(p => p.id === projectSel) || VCM_PROJECTS[0];
    const haz = PERMANENCE_HAZARDS[project.type] || PERMANENCE_HAZARDS['REDD+'];
    // Expected storage duration under geometric decay (E[L]=1/hazard, capped at horizon).
    const expDuration = Math.min(horizon, 1 / Math.max(1e-6, haz.mean / 100));

    // Tonne-year series: annual carbon stock maintained over integration period.
    const tySeries = useMemo(() => {
      const out = [];
      const annualHaz = haz.mean / 100;
      let stock = project.volume;
      for (let y = 1; y <= horizon; y++) {
        stock = stock * (1 - annualHaz);
        out.push({ year: y, stock, tonneYears: stock });
      }
      return out;
    }, [project, haz, horizon]);

    const totalTonneYears = tySeries.reduce((s, d) => s + d.tonneYears, 0);

    // Method equivalence = project_stock_Mt × cumulative_fraction / factor.
    const methodResults = METHODS.map(m => {
      const equivPermanent = totalTonneYears / Math.max(1e-9, m.factor);
      const pctOfNominal = (equivPermanent / Math.max(1e-9, project.volume)) * 100;
      return { ...m, totalTonneYears, equivPermanent, pctOfNominal };
    });

    // Sensitivity: scan horizon 20-200.
    const horizonScan = useMemo(() => {
      const scan = [];
      for (let H = 20; H <= 200; H += 10) {
        const annualHaz = haz.mean / 100;
        let stock = project.volume;
        let cum = 0;
        for (let y = 1; y <= H; y++) { stock = stock * (1 - annualHaz); cum += stock; }
        scan.push({
          horizon: H,
          MC: cum / 55,
          LF: cum / 42,
          TYA: cum / H
        });
      }
      return scan;
    }, [project, haz]);

    return (
      <div style={{ padding: '24px 28px', display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Kpi label="Project" value={project.id} sub={project.name.slice(0, 36)} accent={T.navy} />
          <Kpi label="Nominal Volume" value={`${fmt(project.volume, 2)} Mt`} sub={`Type: ${project.type} · ${project.standard}`} accent={T.gold} />
          <Kpi label="Expected Duration" value={`${fmt(expDuration, 0)} yr`} sub={`Hazard ${fmt(haz.mean, 2)}%/yr (geo decay E[L])`} accent={T.sage} />
          <Kpi label="Cumulative Tonne-Years" value={`${fmt(totalTonneYears, 0)} Mt·yr`} sub={`Over ${horizon}-yr integration`} accent={T.red} />
        </div>

        <Card>
          <SectionH title="Configuration" />
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontFamily: T.mono, color: T.textSec }}>Project:</span>
              <select value={projectSel} onChange={e => setProjectSel(e.target.value)} style={{ padding: 6, fontFamily: T.mono, fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 3, background: T.surface }}>
                {VCM_PROJECTS.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name.slice(0, 32)}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontFamily: T.mono, color: T.textSec }}>Horizon:</span>
              <input type="range" min={20} max={200} step={10} value={horizon} onChange={e => setHorizon(parseInt(e.target.value))} style={{ width: 220 }} />
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.navy, fontWeight: 700 }}>{horizon} yr</span>
            </div>
          </div>
        </Card>

        <Card>
          <SectionH title="Method Comparison" sub="Equivalent permanent reduction implied by each tonne-year method, given project's probabilistic storage profile." />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surfaceH, borderBottom: `1px solid ${T.border}` }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: T.textSec }}>METHOD</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', color: T.textSec }}>FACTOR (tCO2·yr / t)</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', color: T.textSec }}>EQUIV PERMANENT (Mt)</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', color: T.textSec }}>% OF NOMINAL</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: T.textSec }}>DESCRIPTION</th>
              </tr>
            </thead>
            <tbody>
              {methodResults.map(m => (
                <tr key={m.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: T.navy }}>{m.name}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{fmt(m.factor, 0)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: T.gold, fontWeight: 700 }}>{fmt(m.equivPermanent, 3)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{pct(m.pctOfNominal, 1)}</td>
                  <td style={{ padding: '10px 12px', color: T.textSec, fontSize: 10 }}>{m.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card>
            <SectionH title="Tonne-Year Accumulation" sub="Remaining stock × 1 yr, integrated" />
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={tySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
                <Area type="monotone" dataKey="tonneYears" stroke={T.navy} fill={T.navy} fillOpacity={0.25} name="Stock (Mt)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionH title="Method Divergence vs Horizon" sub="How equivalence varies as the integration window changes" />
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={horizonScan}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="horizon" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} label={{ value: 'horizon (yr)', position: 'insideBottom', offset: -4, style: { fontFamily: T.mono, fontSize: 11, fill: T.textSec } }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} label={{ value: 'equiv Mt permanent', angle: -90, position: 'insideLeft', style: { fontFamily: T.mono, fontSize: 11, fill: T.textSec } }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.mono }} />
                <Line type="monotone" dataKey="MC" stroke={T.navy} strokeWidth={2} dot={false} name="Moura-Costa" />
                <Line type="monotone" dataKey="LF" stroke={T.gold} strokeWidth={2} dot={false} name="Lashof" />
                <Line type="monotone" dataKey="TYA" stroke={T.red} strokeWidth={2} dot={false} name="TYA" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    );
  };

  // ============================================================
  // TAB 19 — Offtake Contract Pricing (stochastic price + default risk)
  // ============================================================
  const RenderOfftake = () => {
    const [discount, setDiscount] = useState(8);
    const [offtakeSel, setOfftakeSel] = useState(OFFTAKE_TERMS[0].id);

    const results = useMemo(() => {
      const r = discount / 100;
      return OFFTAKE_TERMS.map(t => {
        const N_PATHS = 300;
        const tenor = t.tenor;
        const annualVol = t.volume;
        const basePrice = t.strike;
        const sigma = t.vol;
        const mu = 0.025; // price drift 2.5%/yr
        const defaultHaz = t.defaultHaz;
        const h = hashStr(t.id);

        // Simulate NPVs under GBM price + survival process.
        const pathNpvs = [];
        const pathCashFlows = [];
        for (let p = 0; p < N_PATHS; p++) {
          let price = basePrice;
          let alive = 1; // survival indicator
          let npv = 0;
          const cfs = [];
          for (let y = 1; y <= tenor; y++) {
            const z = rngN(p * 97 + y * 11 + h);
            price = price * Math.exp((mu - 0.5 * sigma * sigma) + sigma * z);
            // Clamp to [floor, ceiling] to reflect contract terms.
            price = Math.max(t.floor, Math.min(t.ceiling, price));
            // Default check.
            if (sr(p * 53 + y * 7 + h + 1001) < defaultHaz) alive = 0;
            const cf = annualVol * price * alive;
            cfs.push(cf);
            npv += cf / Math.pow(1 + r, y);
          }
          pathNpvs.push(npv);
          pathCashFlows.push(cfs);
        }
        const sortedNpv = [...pathNpvs].sort((a, b) => a - b);
        const mean = pathNpvs.reduce((a, v) => a + v, 0) / Math.max(1, N_PATHS);
        const p05 = sortedNpv[Math.floor(N_PATHS * 0.05)] || 0;
        const p50 = sortedNpv[Math.floor(N_PATHS * 0.50)] || 0;
        const p95 = sortedNpv[Math.floor(N_PATHS * 0.95)] || 0;
        const notional = annualVol * basePrice * tenor;
        // Collateral: use P05 shortfall vs notional (simplified).
        const collateral = Math.max(0, mean * 0.20 + (mean - p05) * 0.30);
        // Mean CF per year.
        const meanCfByYear = [];
        for (let y = 0; y < tenor; y++) {
          const avg = pathCashFlows.reduce((a, arr) => a + arr[y], 0) / Math.max(1, N_PATHS);
          meanCfByYear.push({ year: y + 1, cf: avg, pv: avg / Math.pow(1 + r, y + 1) });
        }
        return {
          ...t, mean, p05, p50, p95, notional, collateral, meanCfByYear,
          impliedStrike: mean / Math.max(1e-9, annualVol * tenor)
        };
      });
    }, [discount]);

    const portfolio = {
      totalNotional: results.reduce((s, r) => s + r.notional, 0),
      totalNpvMean: results.reduce((s, r) => s + r.mean, 0),
      totalCollateral: results.reduce((s, r) => s + r.collateral, 0),
      wAvgDiscount: discount
    };

    const selected = results.find(r => r.id === offtakeSel) || results[0];

    return (
      <div style={{ padding: '24px 28px', display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Kpi label="Portfolio Notional" value={`$${fmt(portfolio.totalNotional, 0)}M`} sub={`${OFFTAKE_TERMS.length} offtake contracts`} accent={T.navy} />
          <Kpi label="Mean NPV (all)" value={`$${fmt(portfolio.totalNpvMean, 1)}M`} sub={`Σ E[NPV] at ${discount}% discount`} accent={T.gold} />
          <Kpi label="Total Collateral Req" value={`$${fmt(portfolio.totalCollateral, 1)}M`} sub="Sum of per-contract IM + variation" accent={T.sage} />
          <Kpi label="Effective Yield" value={`${pct((portfolio.totalNpvMean / Math.max(1e-9, portfolio.totalNotional)) * 100, 1)}`} sub="E[NPV] / notional" accent={T.red} />
        </div>

        <Card>
          <SectionH title="Discount Rate" />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="range" min={3} max={15} step={0.5} value={discount} onChange={e => setDiscount(parseFloat(e.target.value))} style={{ width: 300 }} />
            <span style={{ fontFamily: T.mono, fontSize: 14, color: T.navy, fontWeight: 700 }}>{discount}%</span>
            <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.mono }}>· 300 MC paths per contract · GBM price + Bernoulli default</span>
          </div>
        </Card>

        <Card>
          <SectionH title="Contract Pricing Table (sortable by E[NPV])" />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.surfaceH, borderBottom: `1px solid ${T.border}` }}>
                  {['ID', 'Buyer', 'Seller', 'Type', 'Vol Mt/yr', 'Tenor', 'Strike', 'P05', 'E[NPV]', 'P95', 'Implied Strike', 'Collateral'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...results].sort((a, b) => b.mean - a.mean).map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : T.surface, cursor: 'pointer' }} onClick={() => setOfftakeSel(r.id)}>
                    <td style={{ padding: '6px 10px', color: T.navy, fontWeight: 700 }}>{r.id}</td>
                    <td style={{ padding: '6px 10px' }}>{r.buyer}</td>
                    <td style={{ padding: '6px 10px' }}>{r.seller.slice(0, 28)}</td>
                    <td style={{ padding: '6px 10px' }}>{r.type}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>{fmt(r.volume, 3)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>{r.tenor}y</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>${r.strike}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: T.red }}>${fmt(r.p05, 1)}M</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: T.navy, fontWeight: 700 }}>${fmt(r.mean, 1)}M</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: T.green }}>${fmt(r.p95, 1)}M</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>${fmt(r.impliedStrike, 0)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: T.gold }}>${fmt(r.collateral, 2)}M</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card>
            <SectionH title={`NPV Distribution — ${selected.id}`} sub="P05 / P50 / P95 across simulated paths" />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { bucket: 'P05', val: selected.p05 },
                { bucket: 'P50', val: selected.p50 },
                { bucket: 'E[NPV]', val: selected.mean },
                { bucket: 'P95', val: selected.p95 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} label={{ value: '$M NPV', angle: -90, position: 'insideLeft', style: { fontFamily: T.mono, fontSize: 11, fill: T.textSec } }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
                <Bar dataKey="val" fill={T.navy}>
                  {[T.red, T.gold, T.navy, T.green].map((c, i) => <Cell key={i} fill={c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionH title={`Annual Cash Flow Profile — ${selected.id}`} sub="Mean CF (nominal) and PV by year" />
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={selected.meanCfByYear}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.mono }} />
                <Bar dataKey="cf" fill={T.gold} name="Mean CF $M" />
                <Line type="monotone" dataKey="pv" stroke={T.navy} strokeWidth={2} dot={{ r: 3 }} name="PV $M" />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    );
  };

  // ============================================================
  // TAB 20 — Integrity Regression & Greenwashing Detector
  // ============================================================
  const RenderIntegrity = () => {
    // Features: standard quality index, vintage (yr), ICVCM-CCP flag, CA (Art6 corresp. adjust proxy=corsia).
    // Target: price ($/tCO2).
    const dataset = useMemo(() => {
      const stdQuality = { 'VCS': 60, 'VCS+CCB': 80, 'GS': 78, 'ACR': 82, 'CAR': 75, 'Puro': 88, 'Isometric': 92, 'Plan Vivo': 85, 'CDM': 30 };
      return VCM_PROJECTS.map(p => ({
        id: p.id, name: p.name, type: p.type, standard: p.standard, vintage: p.vintage, price: p.price,
        xStd: stdQuality[p.standard] || 50,
        xVintage: p.vintage - 2020,
        xCcp: p.ccp ? 1 : 0,
        xCa: p.corsia ? 1 : 0,
        y: p.price
      }));
    }, []);

    // Closed-form multiple OLS via normal equations with centered features (manual).
    // Use 4 features + intercept. Compute (X'X)^-1 X'y via Gaussian elimination inline.
    const reg = useMemo(() => {
      const X = dataset.map(d => [1, d.xStd, d.xVintage, d.xCcp, d.xCa]);
      const y = dataset.map(d => d.y);
      const n = X.length;
      const k = 5;
      // X'X
      const XtX = Array.from({ length: k }, () => Array(k).fill(0));
      for (let i = 0; i < n; i++) {
        for (let a = 0; a < k; a++) {
          for (let b = 0; b < k; b++) XtX[a][b] += X[i][a] * X[i][b];
        }
      }
      // X'y
      const Xty = Array(k).fill(0);
      for (let i = 0; i < n; i++) for (let a = 0; a < k; a++) Xty[a] += X[i][a] * y[i];
      // Augmented matrix and Gauss-Jordan
      const M = XtX.map((row, i) => [...row, Xty[i]]);
      for (let c = 0; c < k; c++) {
        // Pivot
        let piv = c;
        for (let r = c + 1; r < k; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
        if (piv !== c) { const tmp = M[c]; M[c] = M[piv]; M[piv] = tmp; }
        const pv = M[c][c];
        if (Math.abs(pv) < 1e-10) continue;
        for (let cc = c; cc <= k; cc++) M[c][cc] /= pv;
        for (let r = 0; r < k; r++) {
          if (r === c) continue;
          const f = M[r][c];
          for (let cc = c; cc <= k; cc++) M[r][cc] -= f * M[c][cc];
        }
      }
      const beta = M.map(row => row[k]);
      // Predictions, residuals, std-error.
      const preds = X.map(row => row.reduce((s, v, j) => s + v * beta[j], 0));
      const residuals = y.map((yi, i) => yi - preds[i]);
      const rss = residuals.reduce((s, r) => s + r * r, 0);
      const tss = (() => {
        const ymean = y.reduce((a, v) => a + v, 0) / Math.max(1, n);
        return y.reduce((s, yi) => s + (yi - ymean) * (yi - ymean), 0);
      })();
      const r2 = 1 - rss / Math.max(1e-9, tss);
      const sigma = Math.sqrt(rss / Math.max(1, n - k));
      const zResiduals = residuals.map(r => r / Math.max(1e-9, sigma));
      return { beta, preds, residuals, zResiduals, r2, sigma, n, k };
    }, [dataset]);

    const flagged = useMemo(() => {
      return dataset.map((d, i) => ({
        ...d,
        predicted: reg.preds[i],
        residual: reg.residuals[i],
        z: reg.zResiduals[i],
        flag: Math.abs(reg.zResiduals[i]) > 2 ? (reg.zResiduals[i] < 0 ? 'UNDERPRICED' : 'OVERPRICED') : 'OK',
        greenwashScore: reg.zResiduals[i] < -2 ? Math.min(100, Math.abs(reg.zResiduals[i]) * 30) : 0
      }));
    }, [dataset, reg]);

    const topFlagged = [...flagged].filter(f => f.flag !== 'OK').sort((a, b) => Math.abs(b.z) - Math.abs(a.z)).slice(0, 10);

    // Group premium by standard.
    const premiumByStd = useMemo(() => {
      const groups = {};
      flagged.forEach(f => {
        if (!groups[f.standard]) groups[f.standard] = { standard: f.standard, count: 0, meanResid: 0, meanPrice: 0 };
        groups[f.standard].count += 1;
        groups[f.standard].meanResid += f.residual;
        groups[f.standard].meanPrice += f.price;
      });
      return Object.values(groups).map(g => ({
        standard: g.standard,
        count: g.count,
        meanPrice: g.meanPrice / Math.max(1, g.count),
        meanResid: g.meanResid / Math.max(1, g.count),
        premiumPct: (g.meanResid / Math.max(1e-9, g.meanPrice / Math.max(1, g.count))) * 100
      }));
    }, [flagged]);

    const coefNames = ['Intercept', 'StdQuality (pts)', 'Vintage (yrs vs 2020)', 'CCP-flag', 'CA (corsia)'];

    return (
      <div style={{ padding: '24px 28px', display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Kpi label="Regression R²" value={fmt(reg.r2, 3)} sub={`${reg.n} obs · ${reg.k - 1} regressors · OLS`} accent={T.navy} />
          <Kpi label="Residual σ" value={`$${fmt(reg.sigma, 2)}`} sub="Price residual std-dev" accent={T.gold} />
          <Kpi label="Outliers (|z|>2)" value={topFlagged.length} sub="Flagged for manual review" accent={T.red} />
          <Kpi label="Model Coverage" value={`${dataset.length} projects`} sub="VCM_PROJECTS universe" accent={T.sage} />
        </div>

        <Card>
          <SectionH title="OLS Coefficients" sub="Closed-form solution via Gauss-Jordan on X'X. Interpretation: $/tCO2 per unit change in feature, holding others constant." />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surfaceH, borderBottom: `1px solid ${T.border}` }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: T.textSec }}>FEATURE</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', color: T.textSec }}>β (COEF)</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: T.textSec }}>INTERPRETATION</th>
              </tr>
            </thead>
            <tbody>
              {coefNames.map((n, i) => (
                <tr key={n} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: T.navy }}>{n}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: T.gold, fontWeight: 700 }}>{fmt(reg.beta[i], 3)}</td>
                  <td style={{ padding: '10px 12px', color: T.textSec, fontSize: 11 }}>
                    {i === 0 && 'Baseline price ($/t) when all features = 0.'}
                    {i === 1 && 'Implied $ premium per 1-pt of standard-quality index.'}
                    {i === 2 && 'Implied vintage discount — +1 yr newer vintage price effect.'}
                    {i === 3 && 'ICVCM-CCP label premium ($/t).'}
                    {i === 4 && 'CORSIA / corresponding-adjustment premium ($/t).'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16 }}>
          <Card>
            <SectionH title="Predicted vs Observed Price" sub="45° line = perfect fit. Points far from line are high-residual outliers." />
            <ResponsiveContainer width="100%" height={340}>
              <ScatterChart>
                <CartesianGrid stroke={T.border} />
                <XAxis type="number" dataKey="predicted" name="Predicted" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} label={{ value: 'Predicted $/t', position: 'insideBottom', offset: -4, style: { fontFamily: T.mono, fontSize: 11, fill: T.textSec } }} />
                <YAxis type="number" dataKey="price" name="Observed" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} label={{ value: 'Observed $/t', angle: -90, position: 'insideLeft', style: { fontFamily: T.mono, fontSize: 11, fill: T.textSec } }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} formatter={(v, n) => [fmt(v, 1), n]} />
                <Scatter data={flagged}>
                  {flagged.map((f, i) => <Cell key={i} fill={f.flag === 'OK' ? T.navy : f.flag === 'OVERPRICED' ? T.red : T.amber} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionH title="Premium by Standard" sub="Mean residual (observed − predicted) per standard" />
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={[...premiumByStd].sort((a, b) => b.meanResid - a.meanResid)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono }} />
                <YAxis type="category" dataKey="standard" tick={{ fontSize: 10, fill: T.textSec, fontFamily: T.mono }} width={90} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11 }} />
                <Bar dataKey="meanResid" name="Mean residual $/t">
                  {premiumByStd.map((s, i) => <Cell key={i} fill={s.meanResid >= 0 ? T.green : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card>
          <SectionH title="Greenwashing Watchlist" sub="Projects with |z|>2 flagged. Underpriced outliers (z<−2) may indicate fire-sale / low-integrity units worth due-diligence review. Overpriced outliers (z>+2) may signal mispriced premium." />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.mono, fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.surfaceH, borderBottom: `1px solid ${T.border}` }}>
                  {['ID', 'Project', 'Type', 'Standard', 'Vintage', 'Obs $', 'Pred $', 'Residual', 'Z-Score', 'FLAG', 'GW Score'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topFlagged.map((f, i) => (
                  <tr key={f.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ padding: '6px 10px', color: T.navy, fontWeight: 700 }}>{f.id}</td>
                    <td style={{ padding: '6px 10px' }}>{f.name}</td>
                    <td style={{ padding: '6px 10px' }}>{f.type}</td>
                    <td style={{ padding: '6px 10px' }}>{f.standard}</td>
                    <td style={{ padding: '6px 10px' }}>{f.vintage}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>${fmt(f.price, 2)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>${fmt(f.predicted, 2)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: f.residual > 0 ? T.green : T.red }}>${fmt(f.residual, 2)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: Math.abs(f.z) > 2.5 ? T.red : T.amber }}>{fmt(f.z, 2)}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <Pill bg={f.flag === 'OVERPRICED' ? T.red : f.flag === 'UNDERPRICED' ? T.amber : T.sage} color="#fff">{f.flag}</Pill>
                    </td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: T.red, fontWeight: 700 }}>{f.greenwashScore > 0 ? fmt(f.greenwashScore, 0) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  switch (tab) {
    case 'overview': return Shell(<RenderOverview />);
    case 'cdp': return Shell(<RenderCDP />);
    case 'sbti': return Shell(<RenderSBTi />);
    case 'vcm': return Shell(<RenderVCM />);
    case 'icvcm': return Shell(<RenderICVCM />);
    case 'vcmi': return Shell(<RenderVCMI />);
    case 'icroa': return Shell(<RenderICROA />);
    case 'article6': return Shell(<RenderArticle6 />);
    case 'bridge': return Shell(<RenderBridge />);
    case 'quality': return Shell(<RenderQuality />);
    case 'credibility': return Shell(<RenderCredibility />);
    case 'matrix': return Shell(<RenderMatrix />);
    case 'portfolio': return Shell(<RenderPortfolio />);
    case 'roadmap': return Shell(<RenderRoadmap />);
    case 'permanenceMC': return Shell(<RenderPermanenceMC />);
    case 'macc': return Shell(<RenderMACC />);
    case 'forward': return Shell(<RenderForwardSurface />);
    case 'tonneyear': return Shell(<RenderTonneYear />);
    case 'offtake': return Shell(<RenderOfftake />);
    case 'integrity': return Shell(<RenderIntegrity />);
    default: return Shell(<RenderOverview />);
  }
}
