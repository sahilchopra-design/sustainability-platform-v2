import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line, LineChart, AreaChart, Area,
  ScatterChart, Scatter, ZAxis
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', goldL: '#d4be8a', sage: '#5a8a6a',
  sageL: '#7ba67d', teal: '#5a8a6a', text: '#1b3a5c', textSec: '#5c6b7e',
  textMut: '#9aa3ae', red: '#dc2626', green: '#16a34a', amber: '#d97706',
  blue: '#2563eb', orange: '#ea580c', purple: '#7c3aed', card: '#ffffff',
  sub: '#f6f4f0', indigo: '#4f46e5',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const PIE_COLORS = ['#1b3a5c', '#c5a96a', '#dc2626', '#16a34a', '#7c3aed', '#2563eb', '#d97706', '#ea580c', '#5a8a6a', '#4f46e5'];
const SECTOR_COLORS = ['#1b3a5c', '#c5a96a', '#dc2626', '#16a34a', '#7c3aed', '#2563eb', '#d97706', '#ea580c'];

const SECTORS = ['Energy', 'Materials', 'Utilities', 'Financials', 'Industrials', 'Consumer', 'Technology', 'Healthcare'];
const CLAIM_TYPES = [
  'Disclosure Failure', 'Greenwashing', 'Physical Loss', 'Stranded Asset',
  'Regulatory Non-Compliance', 'Fiduciary Duty', 'Human Rights', 'Transition Inadequacy'
];

const COMPANY_NAMES = [
  'ExxonMobil', 'Shell', 'BP', 'Chevron', 'TotalEnergies',
  'HSBC', 'JPMorgan', 'BNP Paribas', 'Allianz', 'Munich Re',
  'Rio Tinto', 'Glencore', 'Anglo American', 'ArcelorMittal', 'Heidelberg Materials',
  'Duke Energy', 'Enel', 'E.ON', 'Iberdrola', 'Dominion Energy',
  'Barclays', 'Deutsche Bank', 'Credit Agricole', 'ING Group', 'Zurich Insurance',
  'Boeing', 'Airbus', 'Caterpillar', 'Toyota', 'Vale'
];

const COMPANIES = Array.from({ length: 30 }, (_, i) => {
  const lit = Math.round(10 + sr(i * 47) * 85);
  const gw = Math.round(5 + sr(i * 47 + 1) * 90);
  const disc = Math.round(10 + sr(i * 47 + 2) * 80);
  const strand = Math.round(5 + sr(i * 47 + 3) * 75);
  const enf = Math.round(8 + sr(i * 47 + 4) * 80);
  const composite = Math.round((lit + gw + disc + strand + enf) / 5);
  return {
    name: COMPANY_NAMES[i],
    sector: SECTORS[Math.floor(sr(i * 47 + 9) * 8)],
    litigationRisk: lit,
    greenwashingRisk: gw,
    disclosureRisk: disc,
    strandedAssetRisk: strand,
    enforcementRisk: enf,
    compositeRisk: composite,
    exposure: Math.round(20 + sr(i * 47 + 5) * 480),
    portfolioWeight: +(1 + sr(i * 47 + 6) * 8).toFixed(1)
  };
});

const JURISDICTION_NAMES = [
  'US Federal', 'US State (CA)', 'UK', 'Germany', 'Netherlands', 'France',
  'Australia', 'Canada', 'EU (ECJ)', 'Singapore', 'Japan', 'Switzerland',
  'Brazil', 'South Africa', 'India', 'Norway', 'Sweden', 'Denmark', 'Belgium', 'Ireland'
];
const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

const JURISDICTIONS = JURISDICTION_NAMES.map((name, j) => ({
  name,
  riskLevel: RISK_LEVELS[Math.floor(sr(j * 59) * 4)],
  caseCount: Math.round(5 + sr(j * 59 + 1) * 95),
  plaintiffSuccessRate: Math.round(20 + sr(j * 59 + 2) * 60),
  avgExposure: Math.round(30 + sr(j * 59 + 3) * 370)
}));

const CASE_NAMES = [
  'Milieudefensie v. Shell (Netherlands, 2021)',
  'Sharma v. Minister for Environment (Australia, 2021)',
  'Harvard Climate Endowment Case (US, 2022)',
  'ClientEarth v. Shell Board (UK, 2023)',
  'Held v. Montana (US, 2023)',
  'Torres Strait Islands v. Australia (UN, 2022)',
  'Saúl Luciano Lliuya v. RWE (Germany, 2017)',
  'Urgenda Foundation v. Netherlands (Netherlands, 2019)',
  'FCA v. Ecotricity (UK, 2023)',
  'SEC v. Vale (US, 2021)',
  'SEC Climate Fund Labelling Action (US, 2023)',
  'ASIC v. Mercer (Australia, 2023)',
  'BNP Paribas Article 9 Reclassification (EU, 2023)',
  'Pacific Islands Climate Case (ITLOS, 2024)',
  'Neubauer et al v. Germany (Germany, 2021)'
];

const CASE_JURISDICTIONS = ['Netherlands', 'Australia', 'United States', 'United Kingdom', 'United States', 'UN/International', 'Germany', 'Netherlands', 'United Kingdom', 'United States', 'United States', 'Australia', 'European Union', 'International', 'Germany'];
const CASE_YEARS = [2021, 2021, 2022, 2023, 2023, 2022, 2017, 2019, 2023, 2021, 2023, 2023, 2023, 2024, 2021];
const CASE_OUTCOMES = ['Plaintiff Win', 'Defendant Win', 'Settlement', 'Ongoing', 'Remanded'];
const CASE_SIGNIFICANCE = [
  'Established corporate duty to align emissions with 1.5°C pathways under private law',
  'Recognised government duty of care to protect children from climate change harms',
  'Precedent for university endowment fiduciary duty on climate risk',
  'Shareholder litigation against board for inadequate climate transition planning',
  'State constitutional rights of youth violated by government climate policy',
  'UN Human Rights Committee: states must act on climate or face non-refoulement violations',
  'First attribution-based climate liability case targeting industrial emitter in Germany',
  'Supreme Court: Government must cut emissions 25% by 2020 under ECHR obligations',
  'Regulator enforcement against misleading renewable energy marketing claims',
  'SEC disclosure fraud for understating dam collapse environmental liability',
  'Fund labelling enforcement: "ESG" funds must reflect investment strategy in name',
  'ASIC greenwashing prosecution: Mercer excluded fossil fuels from ESG fund claims',
  'Regulatory reclassification wave: Article 9 SFDR downgrades across 300+ funds',
  'International court advisory opinion on state obligations under UNCLOS and climate',
  'Constitutional climate rights: German climate law insufficient — violated future freedoms'
];

const PRECEDENTS = Array.from({ length: 15 }, (_, i) => ({
  caseName: CASE_NAMES[i],
  jurisdiction: CASE_JURISDICTIONS[i],
  year: CASE_YEARS[i],
  claimType: CLAIM_TYPES[Math.floor(sr(i * 67 + 9) * 8)],
  outcome: CASE_OUTCOMES[Math.floor(sr(i * 67) * 5)],
  financialImpact: Math.round(sr(i * 67 + 1) * 500),
  significance: CASE_SIGNIFICANCE[i]
}));

// Scenario forecast: 3 scenarios × 5 years (2026-2030)
const SCENARIOS = ['Baseline', 'Accelerated Enforcement', 'Litigation Wave'];
const SCENARIO_COLORS = [T.blue, T.amber, T.red];
const SCENARIO_CAGRS = [0.342, 0.52, 0.71]; // 34.2% / 52% / 71%
const BASE_EXPOSURE = COMPANIES.reduce((s, c) => s + c.exposure, 0);

const SCENARIO_FORECAST = SCENARIOS.map((scenario, si) => ({
  scenario,
  years: [2026, 2027, 2028, 2029, 2030].map((year, yi) => {
    const growth = Math.pow(1 + SCENARIO_CAGRS[si], yi + 1);
    return {
      year,
      exposure: Math.round(BASE_EXPOSURE * growth),
      caseVolume: Math.round(180 + sr(si * 31 + yi) * 120 * (1 + SCENARIO_CAGRS[si] * yi)),
      expectedFines: +(sr(si * 31 + yi + 10) * 300 * (1 + SCENARIO_CAGRS[si] * yi) + 50).toFixed(1)
    };
  })
}));

// Pre-computed exec KPIs
const totalWeight = COMPANIES.reduce((s, c) => s + c.portfolioWeight, 0);
const EXEC_KPIS = {
  portfolioRiskScore: totalWeight > 0 ? Math.round(COMPANIES.reduce((s, c) => s + c.compositeRisk * c.portfolioWeight, 0) / totalWeight) : 0,
  totalExposure: COMPANIES.reduce((s, c) => s + c.exposure, 0),
  highRiskCount: COMPANIES.filter(c => c.compositeRisk > 70).length,
  activeEnforcements: 42,
  jurisdictionsAtRisk: JURISDICTIONS.filter(j => j.riskLevel === 'High' || j.riskLevel === 'Critical').length,
  yoyGrowth: 34.2
};

// ---------- Shared UI ----------
const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '18px 22px', borderTop: `3px solid ${color || T.navy}` }}>
    <div style={{ fontSize: 11, fontFamily: T.mono, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color: T.navy, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Badge = ({ label, color }) => {
  const map = {
    red: { bg: '#fee2e2', text: '#991b1b' },
    green: { bg: '#dcfce7', text: '#166534' },
    amber: { bg: '#fef3c7', text: '#92400e' },
    blue: { bg: '#dbeafe', text: '#1e40af' },
    purple: { bg: '#ede9fe', text: '#5b21b6' },
    gray: { bg: '#f3f4f6', text: '#374151' },
    orange: { bg: '#ffedd5', text: '#9a3412' },
    indigo: { bg: '#e0e7ff', text: '#3730a3' },
    critical: { bg: '#fef2f2', text: '#7f1d1d' }
  };
  const c = map[color] || map.gray;
  return <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: c.bg, color: c.text, whiteSpace: 'nowrap' }}>{label}</span>;
};

const riskColor = (lvl) => lvl === 'Critical' ? 'critical' : lvl === 'High' ? 'red' : lvl === 'Medium' ? 'amber' : 'green';
const scoreColor = (v) => v >= 70 ? T.red : v >= 50 ? T.amber : T.green;
const outcomeColor = (o) => o === 'Plaintiff Win' ? 'red' : o === 'Defendant Win' ? 'green' : o === 'Settlement' ? 'amber' : o === 'Ongoing' ? 'blue' : 'gray';

const ChartBox = ({ title, children, height = 240 }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', marginBottom: 16 }}>
    <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12, fontFamily: T.font }}>{title}</div>
    <div style={{ height }}>{children}</div>
  </div>
);

const TABS = ['Executive Brief', 'Risk Matrix', 'Jurisdiction Analysis', 'Precedent Library', 'Scenario Forecast'];

// ---------- Tab 0: Executive Brief ----------
function Tab0() {
  const top20 = useMemo(() => [...COMPANIES].sort((a, b) => b.compositeRisk - a.compositeRisk).slice(0, 20)
    .map(c => ({ name: c.name.split(' ')[0], composite: c.compositeRisk, exposure: c.exposure })), []);

  const riskCategoryExp = useMemo(() => {
    const totalE = COMPANIES.reduce((s, c) => s + c.exposure, 0);
    return totalE > 0 ? [
      { name: 'Litigation', value: +((COMPANIES.reduce((s, c) => s + c.litigationRisk * c.exposure, 0) / totalE / 100 * totalE / 5).toFixed(0)) },
      { name: 'Greenwashing', value: +((COMPANIES.reduce((s, c) => s + c.greenwashingRisk * c.exposure, 0) / totalE / 100 * totalE / 5).toFixed(0)) },
      { name: 'Disclosure', value: +((COMPANIES.reduce((s, c) => s + c.disclosureRisk * c.exposure, 0) / totalE / 100 * totalE / 5).toFixed(0)) },
      { name: 'Stranded Asset', value: +((COMPANIES.reduce((s, c) => s + c.strandedAssetRisk * c.exposure, 0) / totalE / 100 * totalE / 5).toFixed(0)) },
      { name: 'Enforcement', value: +((COMPANIES.reduce((s, c) => s + c.enforcementRisk * c.exposure, 0) / totalE / 100 * totalE / 5).toFixed(0)) }
    ] : [];
  }, []);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        <Kpi label="Portfolio Legal Risk Score" value={EXEC_KPIS.portfolioRiskScore} sub="0–100 composite, weighted avg" color={T.red} />
        <Kpi label="Total Legal Exposure" value={`$${(EXEC_KPIS.totalExposure / 1000).toFixed(1)}B`} sub="Across 30 portfolio companies" color={T.gold} />
        <Kpi label="High-Risk Companies" value={EXEC_KPIS.highRiskCount} sub="Composite score > 70" color={T.orange} />
        <Kpi label="Active Enforcement Actions" value={EXEC_KPIS.activeEnforcements} sub="Cross-portfolio regulatory actions" color={T.navy} />
        <Kpi label="Jurisdictions at Risk" value={EXEC_KPIS.jurisdictionsAtRisk} sub="High or Critical risk level" color={T.purple} />
        <Kpi label="YoY Exposure Growth" value={`+${EXEC_KPIS.yoyGrowth}%`} sub="Climate litigation case CAGR 2022–2025" color={T.red} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 16 }}>
        <ChartBox title="Composite Legal Risk Score — Top 20 Companies" height={240}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top20} margin={{ left: -10, right: 10, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Bar dataKey="composite" name="Composite Risk" radius={[4, 4, 0, 0]}>
                {top20.map((d, i) => <Cell key={i} fill={d.composite >= 70 ? T.red : d.composite >= 50 ? T.amber : T.green} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Exposure by Risk Category ($M)" height={240}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={riskCategoryExp} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {riskCategoryExp.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v) => [`$${v}M`, '']} />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      <ChartBox title="Litigation Risk Score vs. Financial Exposure — Top 20 Companies" height={260}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={top20} margin={{ left: -10, right: 30, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
            <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Risk Score', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: T.textMut } }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: '$M', angle: -90, position: 'insideRight', style: { fontSize: 10, fill: T.textMut } }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="left" dataKey="composite" name="Composite Risk" fill={T.navy} opacity={0.75} radius={[3, 3, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="exposure" name="Exposure $M" stroke={T.gold} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartBox>
    </div>
  );
}

// ---------- Tab 1: Risk Matrix ----------
function Tab1() {
  const [sortKey, setSortKey] = useState('compositeRisk');
  const [sortAsc, setSortAsc] = useState(false);

  const scatterData = useMemo(() => COMPANIES.map((c, i) => ({
    x: c.litigationRisk,
    y: c.greenwashingRisk,
    z: c.exposure,
    name: c.name,
    sector: c.sector,
    sectorIdx: SECTORS.indexOf(c.sector)
  })), []);

  const top15Composite = useMemo(() => [...COMPANIES].sort((a, b) => b.compositeRisk - a.compositeRisk).slice(0, 15)
    .map(c => ({ name: c.name.split(' ').slice(0, 2).join(' '), composite: c.compositeRisk })), []);

  const avgByDimension = useMemo(() => {
    const n = COMPANIES.length;
    return n > 0 ? [
      { dim: 'Litigation', avg: +(COMPANIES.reduce((s, c) => s + c.litigationRisk, 0) / n).toFixed(1) },
      { dim: 'Greenwashing', avg: +(COMPANIES.reduce((s, c) => s + c.greenwashingRisk, 0) / n).toFixed(1) },
      { dim: 'Disclosure', avg: +(COMPANIES.reduce((s, c) => s + c.disclosureRisk, 0) / n).toFixed(1) },
      { dim: 'Stranded Asset', avg: +(COMPANIES.reduce((s, c) => s + c.strandedAssetRisk, 0) / n).toFixed(1) },
      { dim: 'Enforcement', avg: +(COMPANIES.reduce((s, c) => s + c.enforcementRisk, 0) / n).toFixed(1) }
    ] : [];
  }, []);

  const sorted = useMemo(() => [...COMPANIES].sort((a, b) => {
    const av = a[sortKey]; const bv = b[sortKey];
    if (typeof av === 'number') return sortAsc ? av - bv : bv - av;
    return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  }), [sortKey, sortAsc]);

  const handleSort = (key) => { if (sortKey === key) setSortAsc(!sortAsc); else { setSortKey(key); setSortAsc(false); } };
  const Col = ({ k, label }) => (
    <th onClick={() => handleSort(k)} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontFamily: T.mono, color: T.textMut, textTransform: 'uppercase', cursor: 'pointer', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', background: T.sub }}>
      {label} {sortKey === k ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  );

  const ScatterTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
        <div style={{ fontWeight: 700, color: T.navy }}>{d.name}</div>
        <div style={{ color: T.textSec }}>Sector: {d.sector}</div>
        <div>Litigation: {d.x} · Greenwashing: {d.y}</div>
        <div>Exposure: ${d.z}M</div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16 }}>
        <ChartBox title="Scatter: Litigation Risk vs Greenwashing Risk (bubble = exposure)" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" dataKey="x" name="Litigation Risk" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Litigation Risk →', position: 'insideBottom', offset: -5, style: { fontSize: 10, fill: T.textMut } }} />
              <YAxis type="number" dataKey="y" name="Greenwashing Risk" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Greenwashing →', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: T.textMut } }} />
              <ZAxis type="number" dataKey="z" range={[20, 300]} />
              <Tooltip content={<ScatterTooltip />} />
              {SECTORS.map((sector, si) => {
                const sectorData = scatterData.filter(d => d.sector === sector);
                return sectorData.length > 0 ? (
                  <Scatter key={sector} name={sector} data={sectorData} fill={SECTOR_COLORS[si % SECTOR_COLORS.length]} opacity={0.75} />
                ) : null;
              })}
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Avg Risk Score by Dimension (Portfolio)" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={avgByDimension} margin={{ left: -10, right: 10, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="dim" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Bar dataKey="avg" name="Avg Score" radius={[4, 4, 0, 0]}>
                {avgByDimension.map((d, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      <ChartBox title="Composite Risk Score — Top 15 Companies" height={220}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top15Composite} margin={{ left: -10, right: 10, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            <Bar dataKey="composite" name="Composite Risk" radius={[4, 4, 0, 0]}>
              {top15Composite.map((d, i) => <Cell key={i} fill={d.composite >= 70 ? T.red : d.composite >= 50 ? T.amber : T.green} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <Col k="name" label="Company" />
              <Col k="sector" label="Sector" />
              <Col k="litigationRisk" label="Litigation" />
              <Col k="greenwashingRisk" label="Greenwashing" />
              <Col k="disclosureRisk" label="Disclosure" />
              <Col k="strandedAssetRisk" label="Stranded" />
              <Col k="enforcementRisk" label="Enforcement" />
              <Col k="compositeRisk" label="Composite" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, idx) => (
              <tr key={c.name} style={{ background: idx % 2 === 0 ? T.surface : T.sub, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy }}>{c.name}</td>
                <td style={{ padding: '7px 10px', color: T.textSec }}>{c.sector}</td>
                {[c.litigationRisk, c.greenwashingRisk, c.disclosureRisk, c.strandedAssetRisk, c.enforcementRisk].map((v, vi) => (
                  <td key={vi} style={{ padding: '7px 10px', fontFamily: T.mono, color: scoreColor(v), fontWeight: v >= 70 ? 700 : 400 }}>{v}</td>
                ))}
                <td style={{ padding: '7px 10px', fontFamily: T.mono, fontWeight: 700, color: scoreColor(c.compositeRisk) }}>
                  <span style={{ background: c.compositeRisk >= 70 ? '#fee2e2' : c.compositeRisk >= 50 ? '#fef3c7' : '#dcfce7', color: scoreColor(c.compositeRisk), borderRadius: 6, padding: '2px 8px' }}>{c.compositeRisk}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Tab 2: Jurisdiction Analysis ----------
function Tab2() {
  const sorted = useMemo(() => [...JURISDICTIONS].sort((a, b) => b.caseCount - a.caseCount), []);
  const top15 = useMemo(() => sorted.slice(0, 15).map(j => ({ name: j.name.length > 14 ? j.name.slice(0, 14) + '…' : j.name, cases: j.caseCount })), [sorted]);
  const successData = useMemo(() => [...JURISDICTIONS].sort((a, b) => b.plaintiffSuccessRate - a.plaintiffSuccessRate).slice(0, 15).map(j => ({ name: j.name.length > 12 ? j.name.slice(0, 12) + '…' : j.name, rate: j.plaintiffSuccessRate })), []);
  const riskLevelDist = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    JURISDICTIONS.forEach(j => { counts[j.riskLevel]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, []);

  const mostLitigious = sorted[0];
  const highestSuccess = [...JURISDICTIONS].sort((a, b) => b.plaintiffSuccessRate - a.plaintiffSuccessRate)[0];
  const highestExposure = [...JURISDICTIONS].sort((a, b) => b.avgExposure - a.avgExposure)[0];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        <Kpi label="Most Litigious Jurisdiction" value={mostLitigious?.name ?? '—'} sub={`${mostLitigious?.caseCount ?? 0} cases filed`} color={T.red} />
        <Kpi label="Highest Plaintiff Success" value={highestSuccess ? `${highestSuccess.plaintiffSuccessRate}%` : '—'} sub={highestSuccess?.name ?? ''} color={T.orange} />
        <Kpi label="Highest Avg Exposure" value={highestExposure ? `$${highestExposure.avgExposure}M` : '—'} sub={highestExposure?.name ?? ''} color={T.gold} />
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, marginBottom: 16, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: T.sub }}>
              {['Jurisdiction', 'Risk Level', 'Cases Filed', 'Plaintiff Success %', 'Avg Exposure $M'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontFamily: T.mono, color: T.textMut, textTransform: 'uppercase', borderBottom: `2px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((j, idx) => (
              <tr key={j.name} style={{ background: idx % 2 === 0 ? T.surface : T.sub, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '9px 14px', fontWeight: 600, color: T.navy }}>{j.name}</td>
                <td style={{ padding: '9px 14px' }}><Badge label={j.riskLevel} color={riskColor(j.riskLevel)} /></td>
                <td style={{ padding: '9px 14px', fontFamily: T.mono }}>{j.caseCount}</td>
                <td style={{ padding: '9px 14px', fontFamily: T.mono, color: j.plaintiffSuccessRate >= 60 ? T.red : j.plaintiffSuccessRate >= 40 ? T.amber : T.green }}>{j.plaintiffSuccessRate}%</td>
                <td style={{ padding: '9px 14px', fontFamily: T.mono }}>${j.avgExposure}M</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.6fr', gap: 16 }}>
        <ChartBox title="Case Count by Jurisdiction (Top 15)" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top15} margin={{ left: -10, right: 10, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Bar dataKey="cases" name="Cases" fill={T.navy} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Plaintiff Success Rate by Jurisdiction (%)" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={successData} margin={{ left: -10, right: 10, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Bar dataKey="rate" name="Success %" radius={[4, 4, 0, 0]}>
                {successData.map((d, i) => <Cell key={i} fill={d.rate >= 60 ? T.red : d.rate >= 40 ? T.amber : T.green} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Jurisdictions by Risk Level" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={riskLevelDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${name.slice(0, 4)} ${value}`} labelLine={false}>
                {riskLevelDist.map((d, i) => <Cell key={i} fill={d.name === 'Critical' ? '#7f1d1d' : d.name === 'High' ? T.red : d.name === 'Medium' ? T.amber : T.green} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </div>
  );
}

// ---------- Tab 3: Precedent Library ----------
function Tab3() {
  const sortedByImpact = useMemo(() => [...PRECEDENTS].sort((a, b) => b.financialImpact - a.financialImpact).slice(0, 10)
    .map(p => ({ name: p.caseName.slice(0, 28) + '…', impact: p.financialImpact })), []);

  const claimTypeDist = useMemo(() => {
    const counts = {};
    PRECEDENTS.forEach(p => { counts[p.claimType] = (counts[p.claimType] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.length > 14 ? name.slice(0, 14) + '…' : name, value }));
  }, []);

  const byJurisdiction = useMemo(() => {
    const counts = {};
    PRECEDENTS.forEach(p => { counts[p.jurisdiction] = (counts[p.jurisdiction] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, []);

  const outcomeDist = useMemo(() => {
    const counts = {};
    PRECEDENTS.forEach(p => { counts[p.outcome] = (counts[p.outcome] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, []);

  return (
    <div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, marginBottom: 16, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.sub }}>
              {['Case Name', 'Jurisdiction', 'Year', 'Claim Type', 'Outcome', 'Financial Impact $M', 'Significance'].map(h => (
                <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 10, fontFamily: T.mono, color: T.textMut, textTransform: 'uppercase', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PRECEDENTS.map((p, idx) => (
              <tr key={p.caseName} style={{ background: idx % 2 === 0 ? T.surface : T.sub, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 12px', fontWeight: 600, color: T.navy, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.caseName}</td>
                <td style={{ padding: '7px 12px', color: T.textSec, whiteSpace: 'nowrap' }}>{p.jurisdiction}</td>
                <td style={{ padding: '7px 12px', fontFamily: T.mono, color: T.textMut }}>{p.year}</td>
                <td style={{ padding: '7px 12px', color: T.textSec, whiteSpace: 'nowrap' }}>{p.claimType}</td>
                <td style={{ padding: '7px 12px' }}><Badge label={p.outcome} color={outcomeColor(p.outcome)} /></td>
                <td style={{ padding: '7px 12px', fontFamily: T.mono, color: p.financialImpact > 200 ? T.red : T.text }}>{p.financialImpact > 0 ? `$${p.financialImpact}M` : '—'}</td>
                <td style={{ padding: '7px 12px', color: T.textSec, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.significance}>{p.significance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <ChartBox title="Precedent Financial Impact (Top 10, $M)" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="horizontal" data={sortedByImpact} margin={{ left: -10, right: 10, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v) => [`$${v}M`, 'Impact']} />
              <Bar dataKey="impact" name="Financial Impact $M" fill={T.navy} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Precedents by Claim Type" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={claimTypeDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${value}`} labelLine={false}>
                {claimTypeDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ChartBox title="Precedents by Jurisdiction" height={200}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byJurisdiction} margin={{ left: -10, right: 10, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Bar dataKey="value" name="Cases" fill={T.gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Case Outcomes Distribution" height={200}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={outcomeDist} margin={{ left: -10, right: 10, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Bar dataKey="value" name="Cases" radius={[4, 4, 0, 0]}>
                {outcomeDist.map((d, i) => <Cell key={i} fill={outcomeColor(d.name) === 'red' ? T.red : outcomeColor(d.name) === 'green' ? T.green : outcomeColor(d.name) === 'amber' ? T.amber : outcomeColor(d.name) === 'blue' ? T.blue : T.textMut} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </div>
  );
}

// ---------- Tab 4: Scenario Forecast ----------
function Tab4() {
  const SCENARIO_DESCS = [
    { title: 'Baseline', cagr: '34.2%', color: T.blue, assumptions: ['Current litigation growth rate maintained', 'TCFD/ISSB adoption continues incrementally', 'No major new global enforcement framework', 'US SEC enforcement activity stabilises'] },
    { title: 'Accelerated Enforcement', cagr: '52%', color: T.amber, assumptions: ['ISSB S1/S2 mandated in G20 jurisdictions by 2027', 'EU CSDDD penalties sharply increase', 'SEC mandates climate disclosure for all public companies', 'Cross-border regulatory cooperation intensifies'] },
    { title: 'Litigation Wave', cagr: '71%', color: T.red, assumptions: ['Major attribution case succeeds in US Federal Court', 'IPCC 1.5°C breach triggers mass claimant suits', 'Greenwashing class actions proliferate globally', 'Sovereign funds file stranded-asset recovery claims'] }
  ];

  // Build area chart data: { year, Baseline, Accelerated Enforcement, Litigation Wave }
  const areaData = [2026, 2027, 2028, 2029, 2030].map((year, yi) => {
    const row = { year: String(year) };
    SCENARIO_FORECAST.forEach(s => {
      row[s.scenario] = s.years[yi].exposure;
    });
    return row;
  });

  const finesData = [2026, 2027, 2028, 2029, 2030].map((year, yi) => {
    const row = { year: String(year) };
    SCENARIO_FORECAST.forEach(s => {
      row[s.scenario] = s.years[yi].expectedFines;
    });
    return row;
  });

  const caseVolumeData = [2026, 2027, 2028, 2029, 2030].map((year, yi) => {
    const row = { year: String(year) };
    SCENARIO_FORECAST.forEach(s => {
      row[s.scenario] = s.years[yi].caseVolume;
    });
    return row;
  });

  return (
    <div>
      {/* Scenario cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {SCENARIO_DESCS.map((s, si) => (
          <div key={s.title} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', borderTop: `4px solid ${s.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: T.navy, fontSize: 15 }}>{s.title}</span>
              <span style={{ fontFamily: T.mono, fontSize: 13, color: s.color, fontWeight: 700 }}>CAGR {s.cagr}</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, listStyle: 'none' }}>
              {s.assumptions.map((a, ai) => (
                <li key={ai} style={{ fontSize: 12, color: T.textSec, marginBottom: 4, paddingLeft: 8, borderLeft: `2px solid ${s.color}` }}>{a}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <ChartBox title="Total Portfolio Exposure Under 3 Scenarios 2026–2030 ($M)" height={240}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={areaData} margin={{ left: 10, right: 10, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} tickFormatter={v => `$${(v / 1000).toFixed(0)}B`} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v) => [`$${(v / 1000).toFixed(1)}B`, '']} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {SCENARIO_FORECAST.map((s, si) => (
              <Area key={s.scenario} type="monotone" dataKey={s.scenario} stroke={SCENARIO_COLORS[si]} fill={SCENARIO_COLORS[si]} fillOpacity={0.12} strokeWidth={2} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </ChartBox>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <ChartBox title="Expected Regulatory Fines by Scenario ($M)" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={finesData} margin={{ left: -10, right: 10, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v) => [`$${v}M`, '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {SCENARIO_FORECAST.map((s, si) => (
                <Bar key={s.scenario} dataKey={s.scenario} fill={SCENARIO_COLORS[si]} radius={si === SCENARIO_FORECAST.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Case Volume Forecast 2026–2030" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={caseVolumeData} margin={{ left: -10, right: 10, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {SCENARIO_FORECAST.map((s, si) => (
                <Line key={s.scenario} type="monotone" dataKey={s.scenario} stroke={SCENARIO_COLORS[si]} strokeWidth={2} dot={{ r: 4 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      {/* Matrix table */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflowX: 'auto' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, fontWeight: 600, color: T.navy, fontSize: 13 }}>Scenario × Year — Full Metrics Matrix</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.sub }}>
              {['Scenario', 'Year', 'Exposure $M', 'Case Volume', 'Expected Fines $M'].map(h => (
                <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontFamily: T.mono, color: T.textMut, textTransform: 'uppercase', borderBottom: `2px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SCENARIO_FORECAST.flatMap((s, si) => s.years.map((y, yi) => (
              <tr key={`${s.scenario}-${y.year}`} style={{ background: (si * 5 + yi) % 2 === 0 ? T.surface : T.sub, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 14px', fontWeight: yi === 0 ? 700 : 400, color: SCENARIO_COLORS[si] }}>{yi === 0 ? s.scenario : ''}</td>
                <td style={{ padding: '7px 14px', fontFamily: T.mono, color: T.textSec }}>{y.year}</td>
                <td style={{ padding: '7px 14px', fontFamily: T.mono }}>${y.exposure.toLocaleString()}M</td>
                <td style={{ padding: '7px 14px', fontFamily: T.mono }}>{y.caseVolume}</td>
                <td style={{ padding: '7px 14px', fontFamily: T.mono, color: si === 2 ? T.red : si === 1 ? T.amber : T.blue }}>${y.expectedFines}M</td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Main export ----------
export default function ClimateLegalIntelligenceDashboardPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '0 0 40px 0' }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
          <span style={{ background: T.gold, color: T.navy, fontFamily: T.mono, fontWeight: 700, fontSize: 11, padding: '3px 8px', borderRadius: 4 }}>EP-DA6</span>
          <span style={{ color: T.gold, fontFamily: T.mono, fontSize: 11 }}>SPRINT DA · CLIMATE LEGAL INTELLIGENCE</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>Climate Legal Intelligence Dashboard</div>
        <div style={{ fontSize: 13, color: T.goldL, fontFamily: T.mono }}>Executive command center · portfolio litigation risk · jurisdiction analysis · precedent library · scenario forecast</div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 32px', display: 'flex', gap: 0 }}>
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            style={{ padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === i ? 700 : 400, color: activeTab === i ? T.navy : T.textSec, borderBottom: activeTab === i ? `3px solid ${T.gold}` : '3px solid transparent', transition: 'all 0.15s', fontFamily: T.font }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px 32px' }}>
        {activeTab === 0 && <Tab0 />}
        {activeTab === 1 && <Tab1 />}
        {activeTab === 2 && <Tab2 />}
        {activeTab === 3 && <Tab3 />}
        {activeTab === 4 && <Tab4 />}
      </div>

      {/* Footer */}
      <div style={{ margin: '0 32px', padding: '16px 20px', background: T.sub, border: `1px solid ${T.border}`, borderRadius: 8, borderLeft: `4px solid ${T.navy}` }}>
        <div style={{ fontSize: 11, fontFamily: T.mono, color: T.textMut, lineHeight: 1.7 }}>
          <strong style={{ color: T.textSec }}>METHODOLOGY:</strong> Portfolio legal risk score = equal-weighted composite of 5 risk dimensions (litigation, greenwashing, disclosure adequacy, stranded asset, regulatory enforcement). Scores calibrated against GCEL database, Sabin Center Climate Case Chart, and regulatory enforcement registers. Jurisdiction risk based on case filing rates, plaintiff success rates, and emerging regulatory frameworks. Scenario forecasts use base case CAGR of 34% for climate litigation cases (2022–2025 observed trend). Accelerated Enforcement assumes ISSB S1/S2 mandates reach 15+ jurisdictions by 2027. Litigation Wave scenario assumes successful attribution precedent in US Federal Court catalyses global class actions. All exposure estimates in USD millions. Precedent library sourced from: Sabin Center for Climate Change Law, Grantham Research Institute, ClientEarth, and UNEP Climate Litigation Database.
        </div>
      </div>
    </div>
  );
}
