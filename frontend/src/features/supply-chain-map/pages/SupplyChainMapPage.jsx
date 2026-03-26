import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, Cell, PieChart, Pie, ComposedChart, Line,
  Sankey, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';
import { useNavigate } from 'react-router-dom';

// ─── Theme ───────────────────────────────────────────────────────────────────
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

// ─── Supply Chain Database (Tier 1/2/3 for all 11 GICS sectors) ─────────────
const SUPPLY_CHAIN_DB = {
  Energy: {
    tier1: [
      { sector: 'Materials', activity: 'Steel & equipment manufacturing', esg_risk: 72, carbon_intensity: 450, country_risk: ['CN', 'IN', 'RU'] },
      { sector: 'Industrials', activity: 'Engineering & construction', esg_risk: 55, carbon_intensity: 180, country_risk: ['US', 'KR', 'JP'] },
    ],
    tier2: [
      { sector: 'Materials', activity: 'Mining & raw materials', esg_risk: 82, carbon_intensity: 680, country_risk: ['AU', 'BR', 'ZA', 'CL'] },
      { sector: 'Industrials', activity: 'Component manufacturing', esg_risk: 60, carbon_intensity: 220, country_risk: ['CN', 'TW', 'VN'] },
    ],
    tier3: [
      { sector: 'Materials', activity: 'Ore extraction & processing', esg_risk: 88, carbon_intensity: 920, country_risk: ['CG', 'CL', 'ID'] },
    ],
  },
  Materials: {
    tier1: [
      { sector: 'Energy', activity: 'Fuel & power supply', esg_risk: 68, carbon_intensity: 520, country_risk: ['SA', 'RU', 'US'] },
      { sector: 'Industrials', activity: 'Machinery & transport', esg_risk: 52, carbon_intensity: 170, country_risk: ['DE', 'JP', 'US'] },
    ],
    tier2: [
      { sector: 'Materials', activity: 'Chemical feedstocks', esg_risk: 75, carbon_intensity: 580, country_risk: ['CN', 'IN', 'SA'] },
      { sector: 'Energy', activity: 'Upstream oil & gas extraction', esg_risk: 78, carbon_intensity: 620, country_risk: ['NG', 'AO', 'IQ'] },
    ],
    tier3: [
      { sector: 'Materials', activity: 'Rare earth mining', esg_risk: 85, carbon_intensity: 850, country_risk: ['CN', 'CG', 'MM'] },
    ],
  },
  Industrials: {
    tier1: [
      { sector: 'Materials', activity: 'Steel, aluminum, concrete', esg_risk: 65, carbon_intensity: 380, country_risk: ['CN', 'IN', 'BR'] },
      { sector: 'IT', activity: 'Electronic components', esg_risk: 48, carbon_intensity: 120, country_risk: ['TW', 'KR', 'JP'] },
    ],
    tier2: [
      { sector: 'Energy', activity: 'Power generation fuels', esg_risk: 70, carbon_intensity: 480, country_risk: ['US', 'AU', 'ID'] },
      { sector: 'Materials', activity: 'Specialty chemicals', esg_risk: 62, carbon_intensity: 300, country_risk: ['DE', 'CN', 'US'] },
    ],
    tier3: [
      { sector: 'Materials', activity: 'Raw mineral extraction', esg_risk: 82, carbon_intensity: 780, country_risk: ['CG', 'ZA', 'PH'] },
    ],
  },
  Utilities: {
    tier1: [
      { sector: 'Energy', activity: 'Coal, gas, nuclear fuel', esg_risk: 74, carbon_intensity: 580, country_risk: ['AU', 'ID', 'US'] },
      { sector: 'Industrials', activity: 'Grid infrastructure', esg_risk: 50, carbon_intensity: 160, country_risk: ['US', 'DE', 'CN'] },
    ],
    tier2: [
      { sector: 'Materials', activity: 'Turbine & panel materials', esg_risk: 68, carbon_intensity: 420, country_risk: ['CN', 'IN', 'BR'] },
      { sector: 'IT', activity: 'Smart grid technology', esg_risk: 42, carbon_intensity: 80, country_risk: ['US', 'KR', 'JP'] },
    ],
    tier3: [
      { sector: 'Materials', activity: 'Lithium & cobalt mining', esg_risk: 90, carbon_intensity: 900, country_risk: ['CG', 'CL', 'AU'] },
    ],
  },
  Financials: {
    tier1: [
      { sector: 'IT', activity: 'Technology services & infrastructure', esg_risk: 38, carbon_intensity: 45, country_risk: ['US', 'IN', 'IE'] },
      { sector: 'Real Estate', activity: 'Office & data center facilities', esg_risk: 42, carbon_intensity: 90, country_risk: ['US', 'GB', 'SG'] },
    ],
    tier2: [
      { sector: 'Industrials', activity: 'Facility management', esg_risk: 45, carbon_intensity: 110, country_risk: ['US', 'GB', 'IN'] },
      { sector: 'Communication Services', activity: 'Telecom & cloud', esg_risk: 40, carbon_intensity: 70, country_risk: ['US', 'IE', 'NL'] },
    ],
    tier3: [
      { sector: 'Materials', activity: 'Server hardware materials', esg_risk: 65, carbon_intensity: 350, country_risk: ['CN', 'TW', 'VN'] },
    ],
  },
  IT: {
    tier1: [
      { sector: 'Industrials', activity: 'Hardware manufacturing', esg_risk: 58, carbon_intensity: 190, country_risk: ['CN', 'TW', 'VN'] },
      { sector: 'Communication Services', activity: 'Cloud & data services', esg_risk: 44, carbon_intensity: 95, country_risk: ['US', 'IE', 'NL'] },
    ],
    tier2: [
      { sector: 'Materials', activity: 'Semiconductor materials', esg_risk: 72, carbon_intensity: 410, country_risk: ['CN', 'JP', 'KR'] },
      { sector: 'Energy', activity: 'Data center power', esg_risk: 62, carbon_intensity: 350, country_risk: ['US', 'CN', 'IN'] },
    ],
    tier3: [
      { sector: 'Materials', activity: 'Rare earth & conflict minerals', esg_risk: 92, carbon_intensity: 950, country_risk: ['CG', 'CN', 'MM'] },
    ],
  },
  'Health Care': {
    tier1: [
      { sector: 'Materials', activity: 'Pharmaceutical chemicals', esg_risk: 60, carbon_intensity: 280, country_risk: ['IN', 'CN', 'IE'] },
      { sector: 'Industrials', activity: 'Medical device manufacturing', esg_risk: 52, carbon_intensity: 150, country_risk: ['US', 'DE', 'JP'] },
    ],
    tier2: [
      { sector: 'Materials', activity: 'Active pharmaceutical ingredients', esg_risk: 70, carbon_intensity: 380, country_risk: ['IN', 'CN', 'IT'] },
      { sector: 'IT', activity: 'Health IT systems', esg_risk: 40, carbon_intensity: 65, country_risk: ['US', 'IL', 'IN'] },
    ],
    tier3: [
      { sector: 'Materials', activity: 'Chemical precursors', esg_risk: 78, carbon_intensity: 620, country_risk: ['CN', 'IN', 'BD'] },
    ],
  },
  'Consumer Discretionary': {
    tier1: [
      { sector: 'Industrials', activity: 'Assembly & manufacturing', esg_risk: 62, carbon_intensity: 200, country_risk: ['CN', 'VN', 'BD'] },
      { sector: 'Materials', activity: 'Textiles & plastics', esg_risk: 68, carbon_intensity: 310, country_risk: ['CN', 'IN', 'BD'] },
    ],
    tier2: [
      { sector: 'Materials', activity: 'Raw cotton, leather, polymers', esg_risk: 75, carbon_intensity: 450, country_risk: ['IN', 'BD', 'PK'] },
      { sector: 'Energy', activity: 'Factory energy supply', esg_risk: 64, carbon_intensity: 380, country_risk: ['CN', 'VN', 'ID'] },
    ],
    tier3: [
      { sector: 'Materials', activity: 'Fiber & dye extraction', esg_risk: 80, carbon_intensity: 700, country_risk: ['BD', 'MM', 'ET'] },
    ],
  },
  'Consumer Staples': {
    tier1: [
      { sector: 'Consumer Staples', activity: 'Agricultural commodities', esg_risk: 70, carbon_intensity: 350, country_risk: ['BR', 'ID', 'MY'] },
      { sector: 'Materials', activity: 'Packaging materials', esg_risk: 55, carbon_intensity: 180, country_risk: ['CN', 'US', 'DE'] },
    ],
    tier2: [
      { sector: 'Energy', activity: 'Agricultural fuel & fertilizer', esg_risk: 72, carbon_intensity: 480, country_risk: ['RU', 'CN', 'US'] },
      { sector: 'Industrials', activity: 'Processing & logistics', esg_risk: 58, carbon_intensity: 200, country_risk: ['US', 'BR', 'IN'] },
    ],
    tier3: [
      { sector: 'Materials', activity: 'Pesticides & seed chemicals', esg_risk: 76, carbon_intensity: 550, country_risk: ['CN', 'IN', 'DE'] },
    ],
  },
  'Communication Services': {
    tier1: [
      { sector: 'IT', activity: 'Network equipment & servers', esg_risk: 50, carbon_intensity: 140, country_risk: ['CN', 'TW', 'KR'] },
      { sector: 'Industrials', activity: 'Cell tower & cable infrastructure', esg_risk: 48, carbon_intensity: 120, country_risk: ['US', 'IN', 'BR'] },
    ],
    tier2: [
      { sector: 'Materials', activity: 'Fiber optic & copper materials', esg_risk: 62, carbon_intensity: 320, country_risk: ['CN', 'CL', 'PE'] },
      { sector: 'Energy', activity: 'Data center power', esg_risk: 58, carbon_intensity: 340, country_risk: ['US', 'CN', 'IN'] },
    ],
    tier3: [
      { sector: 'Materials', activity: 'Rare earth for electronics', esg_risk: 85, carbon_intensity: 820, country_risk: ['CN', 'CG', 'MM'] },
    ],
  },
  'Real Estate': {
    tier1: [
      { sector: 'Industrials', activity: 'Construction & development', esg_risk: 58, carbon_intensity: 250, country_risk: ['US', 'CN', 'IN'] },
      { sector: 'Materials', activity: 'Cement, steel, glass', esg_risk: 72, carbon_intensity: 480, country_risk: ['CN', 'IN', 'TR'] },
    ],
    tier2: [
      { sector: 'Energy', activity: 'Building energy systems', esg_risk: 60, carbon_intensity: 320, country_risk: ['US', 'CN', 'DE'] },
      { sector: 'Industrials', activity: 'HVAC & electrical systems', esg_risk: 50, carbon_intensity: 150, country_risk: ['US', 'JP', 'DE'] },
    ],
    tier3: [
      { sector: 'Materials', activity: 'Sand, gravel, timber extraction', esg_risk: 70, carbon_intensity: 400, country_risk: ['IN', 'MY', 'BR'] },
    ],
  },
};

// ─── Country ESG Risk Scores ────────────────────────────────────────────────
const COUNTRY_SUPPLY_RISK = {
  US: { labor: 25, environment: 35, governance: 20, composite: 27, name: 'United States' },
  GB: { labor: 22, environment: 30, governance: 18, composite: 23, name: 'United Kingdom' },
  DE: { labor: 18, environment: 25, governance: 15, composite: 19, name: 'Germany' },
  JP: { labor: 20, environment: 28, governance: 16, composite: 21, name: 'Japan' },
  KR: { labor: 30, environment: 35, governance: 28, composite: 31, name: 'South Korea' },
  TW: { labor: 28, environment: 32, governance: 22, composite: 27, name: 'Taiwan' },
  CN: { labor: 68, environment: 72, governance: 65, composite: 68, name: 'China' },
  IN: { labor: 62, environment: 65, governance: 58, composite: 62, name: 'India' },
  BR: { labor: 55, environment: 58, governance: 52, composite: 55, name: 'Brazil' },
  VN: { labor: 72, environment: 68, governance: 70, composite: 70, name: 'Vietnam' },
  BD: { labor: 78, environment: 72, governance: 75, composite: 75, name: 'Bangladesh' },
  CG: { labor: 85, environment: 80, governance: 88, composite: 84, name: 'DR Congo' },
  AU: { labor: 20, environment: 32, governance: 18, composite: 23, name: 'Australia' },
  ZA: { labor: 55, environment: 50, governance: 48, composite: 51, name: 'South Africa' },
  CL: { labor: 35, environment: 40, governance: 32, composite: 36, name: 'Chile' },
  ID: { labor: 60, environment: 65, governance: 58, composite: 61, name: 'Indonesia' },
  RU: { labor: 58, environment: 55, governance: 72, composite: 62, name: 'Russia' },
  SA: { labor: 65, environment: 50, governance: 68, composite: 61, name: 'Saudi Arabia' },
  IE: { labor: 18, environment: 24, governance: 14, composite: 19, name: 'Ireland' },
  SG: { labor: 22, environment: 28, governance: 12, composite: 21, name: 'Singapore' },
  NL: { labor: 16, environment: 22, governance: 14, composite: 17, name: 'Netherlands' },
  MY: { labor: 52, environment: 58, governance: 48, composite: 53, name: 'Malaysia' },
  PK: { labor: 70, environment: 68, governance: 72, composite: 70, name: 'Pakistan' },
  NG: { labor: 72, environment: 70, governance: 78, composite: 73, name: 'Nigeria' },
  AO: { labor: 75, environment: 72, governance: 80, composite: 76, name: 'Angola' },
  IQ: { labor: 72, environment: 68, governance: 82, composite: 74, name: 'Iraq' },
  MM: { labor: 82, environment: 75, governance: 85, composite: 81, name: 'Myanmar' },
  ET: { labor: 70, environment: 62, governance: 72, composite: 68, name: 'Ethiopia' },
  PH: { labor: 55, environment: 58, governance: 52, composite: 55, name: 'Philippines' },
  PE: { labor: 50, environment: 52, governance: 48, composite: 50, name: 'Peru' },
  IT: { labor: 22, environment: 28, governance: 25, composite: 25, name: 'Italy' },
  TR: { labor: 50, environment: 52, governance: 55, composite: 52, name: 'Turkey' },
  IL: { labor: 25, environment: 30, governance: 22, composite: 26, name: 'Israel' },
};

// ─── Deforestation Commodity Risk DB ────────────────────────────────────────
const DEFORESTATION_COMMODITIES = [
  { commodity: 'Palm Oil', sectors_exposed: ['Consumer Staples', 'Consumer Discretionary', 'Materials'], risk_level: 'Critical', source_countries: ['ID', 'MY'], avg_exposure_pct: 15 },
  { commodity: 'Soy', sectors_exposed: ['Consumer Staples', 'Materials'], risk_level: 'High', source_countries: ['BR', 'US'], avg_exposure_pct: 12 },
  { commodity: 'Cattle / Leather', sectors_exposed: ['Consumer Discretionary', 'Consumer Staples'], risk_level: 'Critical', source_countries: ['BR', 'AU'], avg_exposure_pct: 10 },
  { commodity: 'Cocoa', sectors_exposed: ['Consumer Staples'], risk_level: 'High', source_countries: ['CG', 'GH'], avg_exposure_pct: 5 },
  { commodity: 'Rubber', sectors_exposed: ['Industrials', 'Consumer Discretionary'], risk_level: 'Medium', source_countries: ['ID', 'MY', 'VN'], avg_exposure_pct: 4 },
  { commodity: 'Timber', sectors_exposed: ['Materials', 'Real Estate', 'Consumer Staples'], risk_level: 'High', source_countries: ['BR', 'ID', 'MY'], avg_exposure_pct: 8 },
];

// ─── CSDDD Compliance Requirements ──────────────────────────────────────────
const CSDDD_REQUIREMENTS = [
  { id: 1, name: 'Risk Identification in Value Chain', description: 'Map and identify adverse human rights and environmental impacts across all tiers', article: 'Art. 6' },
  { id: 2, name: 'Prevention & Mitigation Measures', description: 'Establish proportionate measures to prevent, mitigate, and bring to an end adverse impacts', article: 'Art. 7-8' },
  { id: 3, name: 'Grievance Mechanism', description: 'Provide complaints procedure for affected stakeholders', article: 'Art. 9' },
  { id: 4, name: 'Monitoring & Remediation', description: 'Periodic assessment of due diligence measures and remediation of actual impacts', article: 'Art. 10-11' },
  { id: 5, name: 'Climate Transition Plan', description: 'Adopt and implement a Paris-aligned climate transition plan', article: 'Art. 15' },
  { id: 6, name: 'Stakeholder Engagement', description: 'Meaningful consultation with affected stakeholders throughout the process', article: 'Art. 6(4)' },
  { id: 7, name: 'Public Reporting', description: 'Annual reporting on due diligence policies, risks identified, and actions taken', article: 'Art. 11' },
  { id: 8, name: 'Director Duty of Care', description: 'Company directors must oversee and integrate due diligence into business strategy', article: 'Art. 25-26' },
];

// ─── Risk Propagation Model ─────────────────────────────────────────────────
function propagateRisk(companyRisk, tier1Risks, tier2Risks, tier3Risks) {
  const t1Impact = tier1Risks.length > 0 ? tier1Risks.reduce((s, r) => s + r.esg_risk * 0.6, 0) / tier1Risks.length : 0;
  const t2Impact = tier2Risks.length > 0 ? tier2Risks.reduce((s, r) => s + r.esg_risk * 0.3, 0) / tier2Risks.length : 0;
  const t3Impact = tier3Risks.length > 0 ? tier3Risks.reduce((s, r) => s + r.esg_risk * 0.1, 0) / tier3Risks.length : 0;
  return {
    direct: companyRisk,
    propagated: Math.round(companyRisk * 0.4 + t1Impact * 0.35 + t2Impact * 0.15 + t3Impact * 0.10),
    tier1Contribution: Math.round(t1Impact * 100) / 100,
    tier2Contribution: Math.round(t2Impact * 100) / 100,
    tier3Contribution: Math.round(t3Impact * 100) / 100,
  };
}

// ─── Portfolio Reader ────────────────────────────────────────────────────────
function readPortfolio() {
  try {
    const raw = localStorage.getItem('ra_portfolio_v1');
    if (!raw) return null;
    const outer = JSON.parse(raw);
    if (!outer || !outer.portfolios) return null;
    const pid = outer.activePortfolio || Object.keys(outer.portfolios)[0];
    const p = outer.portfolios[pid];
    if (!p || !p.holdings || !p.holdings.length) return null;
    const lookup = {};
    GLOBAL_COMPANY_MASTER.forEach(c => { lookup[c.isin] = c; });
    const holdings = p.holdings.map(h => {
      const company = lookup[h.isin] || GLOBAL_COMPANY_MASTER.find(c => c.company_name === h.name);
      if (!company) return null;
      return { ...h, company, weight: h.weight_pct || h.weight || 0, exposure_usd_mn: h.exposure_usd_mn || 0 };
    }).filter(Boolean);
    return { name: p.name || pid, holdings };
  } catch { return null; }
}

function demoHoldings() {
  const sample = GLOBAL_COMPANY_MASTER.filter(c => c.scope1_mt > 0 && c.revenue_usd_mn > 0).slice(0, 20);
  const w = 100 / sample.length;
  return sample.map(c => ({ isin: c.isin, name: c.company_name, company: c, weight: w, exposure_usd_mn: c.market_cap_usd_mn ? c.market_cap_usd_mn * 0.01 : 50 }));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n, d = 2) { if (n == null || isNaN(n)) return '\u2014'; return Number(n).toFixed(d); }
function fmtK(n) { if (n == null || isNaN(n)) return '\u2014'; if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M'; if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K'; return Number(n).toFixed(0); }
function riskColor(score) { return score >= 70 ? T.red : score >= 50 ? T.amber : T.green; }
function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

// ─── Sub-components ─────────────────────────────────────────────────────────
function KpiCard({ label, value, valueColor, sub, icon }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {icon && <div style={{ fontSize: 22, marginBottom: 2 }}>{icon}</div>}
      <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: valueColor || T.navy, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.textSec }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, sub, rightContent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.navy }}>{title}</h3>
        {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{sub}</div>}
      </div>
      {rightContent}
    </div>
  );
}

function Badge({ text, color }) {
  return (
    <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, color, background: color + '18', border: `1px solid ${color}40`, borderRadius: 6, padding: '2px 8px', letterSpacing: '0.03em' }}>{text}</span>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function SupplyChainMapPage() {
  const navigate = useNavigate();
  const portfolio = useMemo(() => readPortfolio(), []);
  const holdings = useMemo(() => portfolio ? portfolio.holdings : demoHoldings(), [portfolio]);
  const isDemo = !portfolio;

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [csdddStatus, setCsdddStatus] = useState(() => {
    try { return JSON.parse(localStorage.getItem('csddd_compliance') || '{}'); } catch { return {}; }
  });

  const selectedCompany = holdings[selectedIdx]?.company || holdings[0]?.company;
  const companyKey = selectedCompany?.isin || selectedCompany?.company_name || 'unknown';
  const sector = selectedCompany?.sector || 'Industrials';
  const chain = SUPPLY_CHAIN_DB[sector] || SUPPLY_CHAIN_DB['Industrials'];

  // Company ESG risk proxy
  const companyRisk = useMemo(() => {
    const esg = selectedCompany?.esg_score || 50;
    // Invert: high ESG score = low risk
    return Math.round(100 - esg);
  }, [selectedCompany]);

  // Risk propagation
  const riskPropagation = useMemo(() => {
    return propagateRisk(companyRisk, chain.tier1, chain.tier2, chain.tier3);
  }, [companyRisk, chain]);

  // Tier averages
  const tier1Avg = chain.tier1.reduce((s, r) => s + r.esg_risk, 0) / (chain.tier1.length || 1);
  const tier2Avg = chain.tier2.reduce((s, r) => s + r.esg_risk, 0) / (chain.tier2.length || 1);
  const tier3Avg = chain.tier3.reduce((s, r) => s + r.esg_risk, 0) / (chain.tier3.length || 1);

  // All unique countries in supply chain
  const allCountries = useMemo(() => {
    const codes = new Set();
    [...chain.tier1, ...chain.tier2, ...chain.tier3].forEach(s => s.country_risk.forEach(c => codes.add(c)));
    return [...codes].sort();
  }, [chain]);

  const highRiskCountries = allCountries.filter(c => (COUNTRY_SUPPLY_RISK[c]?.composite || 0) >= 60).length;

  // Supply chain emissions estimate (Scope 3 Cat 1 + Cat 4 proxy)
  const rev = selectedCompany?.revenue_usd_mn || 0;
  const scEmissions = useMemo(() => {
    const allSuppliers = [...chain.tier1, ...chain.tier2, ...chain.tier3];
    return allSuppliers.reduce((s, sup) => s + (sup.carbon_intensity * rev * 0.03) / 1e6, 0);
  }, [chain, rev]);

  // Deforestation exposure
  const deforestationExposure = useMemo(() => {
    return DEFORESTATION_COMMODITIES.filter(dc => dc.sectors_exposed.includes(sector));
  }, [sector]);
  const totalDeforestPct = deforestationExposure.reduce((s, d) => s + d.avg_exposure_pct, 0);

  // CSDDD compliance score
  const companyCsddd = csdddStatus[companyKey] || {};
  const csdddScore = useMemo(() => {
    const total = CSDDD_REQUIREMENTS.length;
    const compliant = CSDDD_REQUIREMENTS.filter(r => companyCsddd[r.id] === 'Compliant').length;
    const partial = CSDDD_REQUIREMENTS.filter(r => companyCsddd[r.id] === 'Partial').length;
    return Math.round(((compliant * 100 + partial * 50) / (total * 100)) * 100);
  }, [companyCsddd]);

  // Save CSDDD status
  const saveCsddd = useCallback((reqId, status) => {
    const next = { ...csdddStatus, [companyKey]: { ...companyCsddd, [reqId]: status } };
    setCsdddStatus(next);
    try { localStorage.setItem('csddd_compliance', JSON.stringify(next)); } catch {}
  }, [csdddStatus, companyKey, companyCsddd]);

  // Risk propagation chart data
  const riskPropData = [
    { name: 'Tier 3', risk: tier3Avg, propagated: riskPropagation.tier3Contribution, fill: T.red },
    { name: 'Tier 2', risk: tier2Avg, propagated: riskPropagation.tier2Contribution, fill: T.amber },
    { name: 'Tier 1', risk: tier1Avg, propagated: riskPropagation.tier1Contribution, fill: T.gold },
    { name: 'Company', risk: companyRisk, propagated: riskPropagation.propagated, fill: T.navy },
  ];

  // Supply chain tier visualization (Sankey-style using bars since recharts Sankey can be complex)
  const tierFlowData = useMemo(() => {
    const rows = [];
    chain.tier1.forEach((s, i) => rows.push({ tier: 'Tier 1', sector: s.sector, activity: s.activity, esg_risk: s.esg_risk, carbon_intensity: s.carbon_intensity, countries: s.country_risk.join(', '), idx: i }));
    chain.tier2.forEach((s, i) => rows.push({ tier: 'Tier 2', sector: s.sector, activity: s.activity, esg_risk: s.esg_risk, carbon_intensity: s.carbon_intensity, countries: s.country_risk.join(', '), idx: i }));
    chain.tier3.forEach((s, i) => rows.push({ tier: 'Tier 3', sector: s.sector, activity: s.activity, esg_risk: s.esg_risk, carbon_intensity: s.carbon_intensity, countries: s.country_risk.join(', '), idx: i }));
    return rows;
  }, [chain]);

  // Engagement prioritization
  const engagementData = useMemo(() => {
    return tierFlowData.map(s => {
      const exposure = s.carbon_intensity * (rev * 0.02) / 1e6;
      const priority = s.esg_risk * exposure;
      const recommendation = priority > 5 ? 'Engage' : priority > 1 ? 'Monitor' : 'Accept';
      return { ...s, exposure: Math.round(exposure * 1000) / 1000, priority: Math.round(priority * 100) / 100, recommendation };
    }).sort((a, b) => b.priority - a.priority);
  }, [tierFlowData, rev]);

  // Supply chain carbon by tier
  const carbonByTier = [
    { name: 'Tier 1', emissions: chain.tier1.reduce((s, sup) => s + sup.carbon_intensity * rev * 0.03 / 1e6, 0) },
    { name: 'Tier 2', emissions: chain.tier2.reduce((s, sup) => s + sup.carbon_intensity * rev * 0.02 / 1e6, 0) },
    { name: 'Tier 3', emissions: chain.tier3.reduce((s, sup) => s + sup.carbon_intensity * rev * 0.01 / 1e6, 0) },
  ];

  // Export handlers
  function handleExportSupplierCSV() {
    downloadCSV(`supply_chain_risk_${(selectedCompany?.company_name || 'company').replace(/\s+/g, '_')}.csv`,
      engagementData.map(s => ({ Tier: s.tier, Sector: s.sector, Activity: s.activity, ESG_Risk: s.esg_risk, Carbon_Intensity: s.carbon_intensity, Countries: s.countries, Exposure_Mt: s.exposure, Priority_Score: s.priority, Recommendation: s.recommendation }))
    );
  }
  function handleExportCountryCSV() {
    downloadCSV('supply_chain_country_risk.csv',
      allCountries.map(c => {
        const r = COUNTRY_SUPPLY_RISK[c] || { labor: 50, environment: 50, governance: 50, composite: 50, name: c };
        return { Country_Code: c, Country: r.name, Labor_Risk: r.labor, Environment_Risk: r.environment, Governance_Risk: r.governance, Composite_Risk: r.composite };
      })
    );
  }

  // Styles
  const btnStyle = (active) => ({
    padding: '8px 18px', borderRadius: 8, border: `1px solid ${active ? T.navy : T.border}`,
    background: active ? T.navy : T.surface, color: active ? '#fff' : T.text,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', fontFamily: T.font,
  });
  const cardStyle = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 28 };
  const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `2px solid ${T.border}`, position: 'sticky', top: 0, background: T.surface, zIndex: 1 };
  const tdStyle = { padding: '10px 14px', fontSize: 13, color: T.text, borderBottom: `1px solid ${T.border}` };

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '32px 40px', color: T.text }}>
      {/* ── Section 1: Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: T.navy, letterSpacing: '-0.02em' }}>Supply Chain ESG Mapping</h1>
            <Badge text="Tier 1/2/3" color={T.sage} />
            <Badge text="CSDDD" color={T.navyL} />
            <Badge text="Risk Propagation" color={T.gold} />
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: T.textSec, maxWidth: 650 }}>
            Multi-tier supply chain ESG risk mapping with CSDDD compliance tracking, deforestation exposure analysis, and supplier engagement prioritization.
          </p>
          {isDemo && <Badge text="DEMO DATA" color={T.amber} />}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExportSupplierCSV} style={btnStyle(false)}>Export Supplier CSV</button>
          <button onClick={handleExportCountryCSV} style={btnStyle(false)}>Export Country Risk CSV</button>
          <button onClick={() => window.print()} style={btnStyle(false)}>Print / PDF</button>
        </div>
      </div>

      {/* ── Section 2: Company Selector ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Select Company</label>
            <select value={selectedIdx} onChange={e => setSelectedIdx(Number(e.target.value))}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: T.font, color: T.text, background: T.surface }}>
              {holdings.map((h, i) => (
                <option key={i} value={i}>{h.company.company_name} ({h.company.sector})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ padding: '8px 16px', background: T.surfaceH, borderRadius: 8, fontSize: 13 }}>
              <span style={{ color: T.textMut, fontWeight: 600 }}>Sector:</span> <span style={{ fontWeight: 700, color: T.navy }}>{sector}</span>
            </div>
            <div style={{ padding: '8px 16px', background: T.surfaceH, borderRadius: 8, fontSize: 13 }}>
              <span style={{ color: T.textMut, fontWeight: 600 }}>Revenue:</span> <span style={{ fontWeight: 700, color: T.navy }}>{fmtK(rev)} USD Mn</span>
            </div>
            <div style={{ padding: '8px 16px', background: T.surfaceH, borderRadius: 8, fontSize: 13 }}>
              <span style={{ color: T.textMut, fontWeight: 600 }}>Supply Tiers:</span> <span style={{ fontWeight: 700, color: T.navy }}>{chain.tier1.length + chain.tier2.length + chain.tier3.length} nodes</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: 8 KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <KpiCard icon="\uD83D\uDEE1\uFE0F" label="Supply Chain Risk Score" value={riskPropagation.propagated} valueColor={riskColor(riskPropagation.propagated)} sub={`Direct: ${companyRisk} | Propagated: ${riskPropagation.propagated}`} />
        <KpiCard icon="1\uFE0F\u20E3" label="Tier 1 Avg Risk" value={fmt(tier1Avg, 0)} valueColor={riskColor(tier1Avg)} sub={`${chain.tier1.length} supplier node(s)`} />
        <KpiCard icon="2\uFE0F\u20E3" label="Tier 2 Avg Risk" value={fmt(tier2Avg, 0)} valueColor={riskColor(tier2Avg)} sub={`${chain.tier2.length} supplier node(s)`} />
        <KpiCard icon="3\uFE0F\u20E3" label="Tier 3 Avg Risk" value={fmt(tier3Avg, 0)} valueColor={riskColor(tier3Avg)} sub={`${chain.tier3.length} supplier node(s)`} />
        <KpiCard icon="\uD83C\uDF0D" label="High-Risk Countries" value={highRiskCountries} valueColor={highRiskCountries > 3 ? T.red : T.amber} sub={`of ${allCountries.length} total countries`} />
        <KpiCard icon="\uD83C\uDFED" label="SC Emissions (est.)" value={`${fmt(scEmissions, 3)} Mt`} sub="Scope 3 Cat 1 + Cat 4 proxy" />
        <KpiCard icon="\uD83C\uDF33" label="Deforestation Exposure" value={`${totalDeforestPct}%`} valueColor={totalDeforestPct > 10 ? T.red : totalDeforestPct > 5 ? T.amber : T.green} sub={`${deforestationExposure.length} commodities flagged`} />
        <KpiCard icon="\u2696\uFE0F" label="CSDDD Compliance" value={`${csdddScore}%`} valueColor={csdddScore >= 75 ? T.green : csdddScore >= 40 ? T.amber : T.red} sub={`${CSDDD_REQUIREMENTS.filter(r => companyCsddd[r.id] === 'Compliant').length}/${CSDDD_REQUIREMENTS.length} requirements met`} />
      </div>

      {/* ── Section 4: Supply Chain Tier Visualization ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <SectionHeader title="Supply Chain Tier Map" sub={`${selectedCompany?.company_name || 'Company'} \u2192 Tier 1 \u2192 Tier 2 \u2192 Tier 3`} />
        <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', minHeight: 300 }}>
          {/* Company node */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ padding: '20px 24px', background: T.navy + '15', border: `2px solid ${T.navy}`, borderRadius: 12, textAlign: 'center', minWidth: 140 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.navy }}>{(selectedCompany?.company_name || 'Company').substring(0, 18)}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Risk: {companyRisk}</div>
            </div>
            <div style={{ width: 2, height: 20, background: T.border }} />
            <div style={{ fontSize: 10, color: T.textMut }}>\u25B6</div>
          </div>
          {/* Tiers */}
          {[{ label: 'Tier 1', data: chain.tier1, color: T.gold }, { label: 'Tier 2', data: chain.tier2, color: T.amber }, { label: 'Tier 3', data: chain.tier3, color: T.red }].map(tier => (
            <div key={tier.label} style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.textMut, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tier.label}</div>
              {tier.data.map((s, i) => {
                const riskBg = s.esg_risk >= 70 ? T.red + '20' : s.esg_risk >= 50 ? T.amber + '20' : T.green + '20';
                const riskBorder = s.esg_risk >= 70 ? T.red : s.esg_risk >= 50 ? T.amber : T.green;
                return (
                  <div key={i} style={{ padding: '12px 16px', background: riskBg, border: `1.5px solid ${riskBorder}`, borderRadius: 10, flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{s.activity}</div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>Sector: {s.sector}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: riskColor(s.esg_risk) }}>Risk: {s.esg_risk}</span>
                      <span style={{ fontSize: 10, color: T.textMut }}>CI: {s.carbon_intensity}</span>
                      <span style={{ fontSize: 10, color: T.textMut }}>{s.country_risk.join(', ')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 5: Risk Propagation BarChart ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={cardStyle}>
          <SectionHeader title="Risk Propagation" sub="How ESG risk cascades from Tier 3 to Company" />
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={riskPropData} margin={{ top: 8, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}` }}
                formatter={(v, n) => [fmt(v, 1), n === 'risk' ? 'Direct Risk' : 'Propagated Contribution']} />
              <Legend />
              <Bar dataKey="risk" fill={T.navyL} radius={[4, 4, 0, 0]} name="Direct Risk" />
              <Line dataKey="propagated" stroke={T.red} strokeWidth={2.5} dot={{ r: 5, fill: T.red }} name="Propagated" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* ── Section 9: Supply Chain Carbon Footprint ── */}
        <div style={cardStyle}>
          <SectionHeader title="Supply Chain Carbon Footprint" sub="Estimated Scope 3 Cat 1 + Cat 4 by tier" />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={carbonByTier} margin={{ top: 8, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Mt CO2e', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: T.textMut } }} />
              <Tooltip formatter={v => `${fmt(v, 4)} Mt`} contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}` }} />
              <Bar dataKey="emissions" radius={[6, 6, 0, 0]}>
                {carbonByTier.map((d, i) => <Cell key={i} fill={[T.sage, T.amber, T.red][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Section 6: Country Risk Heatmap ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <SectionHeader title="Country Risk Heatmap" sub={`Supply chain geography risk assessment across ${allCountries.length} countries`} />
        <div style={{ overflowX: 'auto', maxHeight: 480, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.font }}>
            <thead>
              <tr>
                <th style={thStyle}>Country</th>
                <th style={thStyle}>Code</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Labor Risk</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Environmental Risk</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Governance Risk</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Composite Risk</th>
                <th style={thStyle}>Rating</th>
              </tr>
            </thead>
            <tbody>
              {allCountries.map((code, i) => {
                const r = COUNTRY_SUPPLY_RISK[code] || { labor: 50, environment: 50, governance: 50, composite: 50, name: code };
                const cellBg = (val) => val >= 70 ? T.red + '20' : val >= 50 ? T.amber + '20' : T.green + '20';
                return (
                  <tr key={code} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{r.name}</td>
                    <td style={tdStyle}><span style={{ fontSize: 11, color: T.textMut }}>{code}</span></td>
                    <td style={{ ...tdStyle, textAlign: 'center', background: cellBg(r.labor) }}><span style={{ fontWeight: 600, color: riskColor(r.labor) }}>{r.labor}</span></td>
                    <td style={{ ...tdStyle, textAlign: 'center', background: cellBg(r.environment) }}><span style={{ fontWeight: 600, color: riskColor(r.environment) }}>{r.environment}</span></td>
                    <td style={{ ...tdStyle, textAlign: 'center', background: cellBg(r.governance) }}><span style={{ fontWeight: 600, color: riskColor(r.governance) }}>{r.governance}</span></td>
                    <td style={{ ...tdStyle, textAlign: 'center', background: cellBg(r.composite), fontWeight: 700 }}><span style={{ color: riskColor(r.composite) }}>{r.composite}</span></td>
                    <td style={tdStyle}>
                      <Badge text={r.composite >= 70 ? 'High Risk' : r.composite >= 50 ? 'Medium' : 'Low Risk'} color={riskColor(r.composite)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 7: CSDDD Compliance Checklist ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <SectionHeader title="CSDDD Compliance Checklist" sub="EU Corporate Sustainability Due Diligence Directive requirements" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {CSDDD_REQUIREMENTS.map(req => {
            const status = companyCsddd[req.id] || 'Gap';
            const statusColors = { Compliant: T.green, Partial: T.amber, Gap: T.red };
            return (
              <div key={req.id} style={{ padding: '16px 20px', background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 10, borderLeft: `4px solid ${statusColors[status]}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{req.name}</div>
                    <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>{req.article}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['Compliant', 'Partial', 'Gap'].map(s => (
                      <button key={s} onClick={() => saveCsddd(req.id, s)}
                        style={{
                          padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
                          border: `1px solid ${status === s ? statusColors[s] : T.border}`,
                          background: status === s ? statusColors[s] + '20' : T.surface,
                          color: status === s ? statusColors[s] : T.textMut,
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5 }}>{req.description}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 16, padding: '12px 18px', background: T.surfaceH, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: T.textSec }}>
            <strong style={{ color: T.navy }}>Overall CSDDD Score: {csdddScore}%</strong> &mdash;
            {' '}{CSDDD_REQUIREMENTS.filter(r => companyCsddd[r.id] === 'Compliant').length} Compliant,
            {' '}{CSDDD_REQUIREMENTS.filter(r => companyCsddd[r.id] === 'Partial').length} Partial,
            {' '}{CSDDD_REQUIREMENTS.filter(r => !companyCsddd[r.id] || companyCsddd[r.id] === 'Gap').length} Gaps
          </div>
          <div style={{ width: 200, height: 8, background: T.border, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${csdddScore}%`, height: '100%', background: csdddScore >= 75 ? T.green : csdddScore >= 40 ? T.amber : T.red, borderRadius: 4, transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>

      {/* ── Section 8: Deforestation Risk Panel ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <SectionHeader title="Deforestation Risk Panel" sub="Supply chain commodities linked to deforestation (EUDR alignment)" />
        {deforestationExposure.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: T.textMut, fontSize: 14 }}>No significant deforestation-linked commodities identified for the {sector} sector.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {deforestationExposure.map(dc => (
              <div key={dc.commodity} style={{ padding: '16px 20px', background: dc.risk_level === 'Critical' ? T.red + '10' : dc.risk_level === 'High' ? T.amber + '10' : T.surfaceH, border: `1px solid ${dc.risk_level === 'Critical' ? T.red + '40' : dc.risk_level === 'High' ? T.amber + '40' : T.border}`, borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{dc.commodity}</div>
                  <Badge text={dc.risk_level} color={dc.risk_level === 'Critical' ? T.red : dc.risk_level === 'High' ? T.amber : T.gold} />
                </div>
                <div style={{ fontSize: 12, color: T.textSec, marginBottom: 6 }}>Source countries: {dc.source_countries.map(c => COUNTRY_SUPPLY_RISK[c]?.name || c).join(', ')}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${dc.avg_exposure_pct * 4}%`, height: '100%', background: dc.risk_level === 'Critical' ? T.red : T.amber, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{dc.avg_exposure_pct}%</span>
                </div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>Avg sector exposure</div>
              </div>
            ))}
          </div>
        )}
        {deforestationExposure.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deforestationExposure} margin={{ top: 8, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="commodity" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Exposure %', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: T.textMut } }} />
                <Tooltip formatter={v => `${v}%`} contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}` }} />
                <Bar dataKey="avg_exposure_pct" radius={[6, 6, 0, 0]}>
                  {deforestationExposure.map((d, i) => <Cell key={i} fill={d.risk_level === 'Critical' ? T.red : d.risk_level === 'High' ? T.amber : T.gold} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Section 10: Sortable Supplier Risk Table ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <SectionHeader title="Supplier Risk Table" sub="All supply chain nodes across tiers with ESG risk assessment" />
        <div style={{ overflowX: 'auto', maxHeight: 480, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.font }}>
            <thead>
              <tr>
                <th style={thStyle}>Tier</th>
                <th style={thStyle}>Sector</th>
                <th style={thStyle}>Activity</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>ESG Risk</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Carbon Intensity</th>
                <th style={thStyle}>Countries</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Exposure (Mt)</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Priority</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {engagementData.map((s, i) => {
                const actionColor = s.recommendation === 'Engage' ? T.red : s.recommendation === 'Monitor' ? T.amber : T.green;
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}><Badge text={s.tier} color={s.tier === 'Tier 3' ? T.red : s.tier === 'Tier 2' ? T.amber : T.gold} /></td>
                    <td style={tdStyle}>{s.sector}</td>
                    <td style={{ ...tdStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.activity}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><span style={{ fontWeight: 700, color: riskColor(s.esg_risk) }}>{s.esg_risk}</span></td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtK(s.carbon_intensity)}</td>
                    <td style={tdStyle}><span style={{ fontSize: 11, color: T.textSec }}>{s.countries}</span></td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(s.exposure, 4)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(s.priority, 2)}</td>
                    <td style={tdStyle}><Badge text={s.recommendation} color={actionColor} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 11: Engagement Prioritization ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <SectionHeader title="Engagement Prioritization" sub="Suppliers ranked by risk x exposure, with recommended actions" />
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={engagementData.slice(0, 10)} margin={{ top: 8, right: 20, bottom: 60, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="activity" angle={-25} textAnchor="end" tick={{ fontSize: 10, fill: T.textSec }} interval={0} height={70} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'ESG Risk', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: T.textMut } }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Priority Score', angle: 90, position: 'insideRight', style: { fontSize: 11, fill: T.textMut } }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}` }} />
            <Legend />
            <Bar yAxisId="left" dataKey="esg_risk" fill={T.navyL} radius={[4, 4, 0, 0]} name="ESG Risk" />
            <Line yAxisId="right" dataKey="priority" stroke={T.red} strokeWidth={2.5} dot={{ r: 5, fill: T.red }} name="Priority Score" />
          </ComposedChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {['Engage', 'Monitor', 'Accept'].map(action => {
            const items = engagementData.filter(s => s.recommendation === action);
            const color = action === 'Engage' ? T.red : action === 'Monitor' ? T.amber : T.green;
            return (
              <div key={action} style={{ padding: '14px 18px', background: color + '10', border: `1px solid ${color}30`, borderRadius: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color }}>{action}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.navy, margin: '4px 0' }}>{items.length}</div>
                <div style={{ fontSize: 11, color: T.textSec }}>
                  {items.length > 0 ? items.slice(0, 2).map(s => s.activity).join(', ') + (items.length > 2 ? ` +${items.length - 2} more` : '') : 'None'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 12: Cross-Navigation ── */}
      <div style={cardStyle}>
        <SectionHeader title="Cross-Module Navigation" sub="Related analytics modules" />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/scope3-engine')} style={btnStyle(false)}>Scope 3 Estimation Engine &rarr;</button>
          <button onClick={() => navigate('/controversy-monitor')} style={btnStyle(false)}>Controversy Monitor &rarr;</button>
          <button onClick={() => navigate('/carbon-budget')} style={btnStyle(false)}>Carbon Budget Analysis &rarr;</button>
          <button onClick={() => navigate('/stranded-assets')} style={btnStyle(false)}>Stranded Assets &rarr;</button>
          <button onClick={() => navigate('/ngfs-scenarios')} style={btnStyle(false)}>NGFS Scenarios &rarr;</button>
        </div>
      </div>
    </div>
  );
}
