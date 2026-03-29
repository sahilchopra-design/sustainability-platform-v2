import React, { useState } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis, PieChart, Pie, Legend,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const tip = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 11 };

// ─── DATA ────────────────────────────────────────────────────────────────────

const PORTFOLIO = [
  // Clean Energy
  { id: 1,  name: 'SolarNova',          sector: 'Clean Energy',    stage: 'Series B', invested: 14, ownership: 12, valuation: 180, impactScore: 88, abatement: 18.2, sdg: 'SDG 7'  },
  { id: 2,  name: 'GridVault',          sector: 'Clean Energy',    stage: 'Series A', invested: 10, ownership: 18, valuation: 95,  impactScore: 91, abatement: 22.4, sdg: 'SDG 7'  },
  { id: 3,  name: 'FusionBridge',       sector: 'Clean Energy',    stage: 'Series A', invested: 18, ownership: 9,  valuation: 240, impactScore: 95, abatement: 45.0, sdg: 'SDG 7'  },
  { id: 4,  name: 'TideForce',          sector: 'Clean Energy',    stage: 'Series B', invested: 12, ownership: 14, valuation: 130, impactScore: 84, abatement: 11.6, sdg: 'SDG 7'  },
  { id: 5,  name: 'VPP Systems',        sector: 'Clean Energy',    stage: 'Series C', invested: 8,  ownership: 6,  valuation: 210, impactScore: 80, abatement: 9.8,  sdg: 'SDG 7'  },
  // Transport
  { id: 6,  name: 'ChargeLoop',         sector: 'Transport',       stage: 'Series B', invested: 9,  ownership: 11, valuation: 115, impactScore: 76, abatement: 8.4,  sdg: 'SDG 11' },
  { id: 7,  name: 'AeroClear',          sector: 'Transport',       stage: 'Series A', invested: 15, ownership: 16, valuation: 145, impactScore: 82, abatement: 14.2, sdg: 'SDG 13' },
  { id: 8,  name: 'AutoGreen',          sector: 'Transport',       stage: 'Seed',     invested: 5,  ownership: 22, valuation: 42,  impactScore: 73, abatement: 5.1,  sdg: 'SDG 11' },
  { id: 9,  name: 'VeloCity',           sector: 'Transport',       stage: 'Series A', invested: 4,  ownership: 19, valuation: 38,  impactScore: 70, abatement: 3.6,  sdg: 'SDG 11' },
  // Food & Agriculture
  { id: 10, name: 'CultivAlt',          sector: 'Food & Agri',     stage: 'Series A', invested: 11, ownership: 15, valuation: 120, impactScore: 93, abatement: 28.5, sdg: 'SDG 12' },
  { id: 11, name: 'VertiGrow',          sector: 'Food & Agri',     stage: 'Series B', invested: 9,  ownership: 13, valuation: 108, impactScore: 79, abatement: 7.3,  sdg: 'SDG 12' },
  { id: 12, name: 'SoilCarbon',         sector: 'Food & Agri',     stage: 'Seed',     invested: 4,  ownership: 24, valuation: 32,  impactScore: 85, abatement: 12.8, sdg: 'SDG 15' },
  // Buildings
  { id: 13, name: 'ThermShift',         sector: 'Buildings',       stage: 'Series B', invested: 7,  ownership: 10, valuation: 95,  impactScore: 86, abatement: 14.0, sdg: 'SDG 7'  },
  { id: 14, name: 'GridMind',           sector: 'Buildings',       stage: 'Series A', invested: 6,  ownership: 17, valuation: 70,  impactScore: 78, abatement: 6.2,  sdg: 'SDG 11' },
  { id: 15, name: 'EcoCrete',           sector: 'Buildings',       stage: 'Seed',     invested: 5,  ownership: 21, valuation: 44,  impactScore: 81, abatement: 9.5,  sdg: 'SDG 13' },
  // Industry
  { id: 16, name: 'H2Frontier',         sector: 'Industry',        stage: 'Series B', invested: 13, ownership: 11, valuation: 185, impactScore: 89, abatement: 19.8, sdg: 'SDG 7'  },
  { id: 17, name: 'CarbonSink Tech',    sector: 'Industry',        stage: 'Series A', invested: 10, ownership: 14, valuation: 100, impactScore: 87, abatement: 16.4, sdg: 'SDG 13' },
  { id: 18, name: 'BioForge',           sector: 'Industry',        stage: 'Seed',     invested: 6,  ownership: 20, valuation: 50,  impactScore: 77, abatement: 7.1,  sdg: 'SDG 13' },
  // Carbon Markets
  { id: 19, name: 'NatureCredit',       sector: 'Carbon Markets',  stage: 'Series A', invested: 8,  ownership: 16, valuation: 88,  impactScore: 83, abatement: 6.8,  sdg: 'SDG 15' },
  { id: 20, name: 'CarbonLedger',       sector: 'Carbon Markets',  stage: 'Series B', invested: 6,  ownership: 12, valuation: 90,  impactScore: 80, abatement: 4.5,  sdg: 'SDG 13' },
];

const IMP_SCORES = [
  { company: 'FusionBridge',    what: 5, who: 4, howMuch: 5, contribution: 5, risk: 3 },
  { company: 'CultivAlt',      what: 5, who: 5, howMuch: 4, contribution: 5, risk: 4 },
  { company: 'GridVault',      what: 4, who: 4, howMuch: 5, contribution: 4, risk: 4 },
  { company: 'H2Frontier',     what: 4, who: 4, howMuch: 4, contribution: 4, risk: 3 },
  { company: 'CarbonSink Tech',what: 4, who: 3, howMuch: 4, contribution: 4, risk: 3 },
  { company: 'SolarNova',      what: 4, who: 5, howMuch: 4, contribution: 3, risk: 4 },
  { company: 'AeroClear',      what: 4, who: 3, howMuch: 4, contribution: 4, risk: 3 },
  { company: 'ThermShift',     what: 3, who: 5, howMuch: 4, contribution: 3, risk: 4 },
  { company: 'EcoCrete',       what: 3, who: 4, howMuch: 3, contribution: 4, risk: 3 },
  { company: 'SoilCarbon',     what: 4, who: 4, howMuch: 3, contribution: 5, risk: 3 },
  { company: 'NatureCredit',   what: 4, who: 5, howMuch: 3, contribution: 4, risk: 3 },
  { company: 'TideForce',      what: 4, who: 4, howMuch: 4, contribution: 3, risk: 3 },
  { company: 'VPP Systems',    what: 3, who: 5, howMuch: 4, contribution: 3, risk: 4 },
  { company: 'VertiGrow',      what: 3, who: 4, howMuch: 3, contribution: 3, risk: 4 },
  { company: 'BioForge',       what: 3, who: 3, howMuch: 3, contribution: 4, risk: 3 },
  { company: 'ChargeLoop',     what: 3, who: 4, howMuch: 3, contribution: 3, risk: 4 },
  { company: 'GridMind',       what: 3, who: 4, howMuch: 3, contribution: 3, risk: 4 },
  { company: 'CarbonLedger',   what: 3, who: 3, howMuch: 3, contribution: 3, risk: 3 },
  { company: 'AutoGreen',      what: 3, who: 3, howMuch: 2, contribution: 3, risk: 3 },
  { company: 'VeloCity',       what: 2, who: 4, howMuch: 2, contribution: 3, risk: 4 },
];

const IMP_CLASS_DATA = [
  { name: 'Class C — Contribute to Solutions', value: 11, fill: T.sage },
  { name: 'Class B — Benefit Stakeholders',    value: 7,  fill: T.gold },
  { name: 'Class A — Act to Avoid Harm',       value: 2,  fill: T.amber },
];

const ADDITIONALITY = [
  { company: 'FusionBridge',    financial: 5, technological: 5, market: 5, catalytic: 4, overall: 9.6, irr: 28, stage: 'Series A' },
  { company: 'CultivAlt',      financial: 5, technological: 5, market: 4, catalytic: 4, overall: 9.2, irr: 24, stage: 'Series A' },
  { company: 'SoilCarbon',     financial: 5, technological: 4, market: 5, catalytic: 3, overall: 8.8, irr: 18, stage: 'Seed'     },
  { company: 'AeroClear',      financial: 4, technological: 5, market: 4, catalytic: 4, overall: 8.6, irr: 22, stage: 'Series A' },
  { company: 'H2Frontier',     financial: 4, technological: 5, market: 4, catalytic: 4, overall: 8.4, irr: 21, stage: 'Series B' },
  { company: 'CarbonSink Tech',financial: 4, technological: 4, market: 4, catalytic: 4, overall: 8.0, irr: 20, stage: 'Series A' },
  { company: 'EcoCrete',       financial: 4, technological: 4, market: 4, catalytic: 3, overall: 7.6, irr: 17, stage: 'Seed'     },
  { company: 'ThermShift',     financial: 3, technological: 4, market: 4, catalytic: 4, overall: 7.2, irr: 19, stage: 'Series B' },
  { company: 'NatureCredit',   financial: 3, technological: 4, market: 4, catalytic: 4, overall: 7.0, irr: 16, stage: 'Series A' },
  { company: 'TideForce',      financial: 3, technological: 4, market: 3, catalytic: 4, overall: 6.8, irr: 18, stage: 'Series B' },
  { company: 'BioForge',       financial: 3, technological: 4, market: 3, catalytic: 3, overall: 6.5, irr: 16, stage: 'Seed'     },
  { company: 'GridVault',      financial: 3, technological: 3, market: 4, catalytic: 4, overall: 6.4, irr: 17, stage: 'Series A' },
  { company: 'SolarNova',      financial: 3, technological: 3, market: 4, catalytic: 3, overall: 6.0, irr: 18, stage: 'Series B' },
  { company: 'VertiGrow',      financial: 3, technological: 3, market: 3, catalytic: 3, overall: 5.8, irr: 15, stage: 'Series B' },
  { company: 'VPP Systems',    financial: 2, technological: 3, market: 4, catalytic: 3, overall: 5.6, irr: 14, stage: 'Series C' },
  { company: 'GridMind',       financial: 2, technological: 3, market: 3, catalytic: 3, overall: 5.2, irr: 14, stage: 'Series A' },
  { company: 'ChargeLoop',     financial: 2, technological: 3, market: 3, catalytic: 3, overall: 5.0, irr: 15, stage: 'Series B' },
  { company: 'CarbonLedger',   financial: 2, technological: 3, market: 3, catalytic: 2, overall: 4.8, irr: 14, stage: 'Series B' },
  { company: 'AutoGreen',      financial: 2, technological: 2, market: 3, catalytic: 2, overall: 4.2, irr: 12, stage: 'Seed'     },
  { company: 'VeloCity',       financial: 2, technological: 2, market: 2, catalytic: 2, overall: 3.8, irr: 11, stage: 'Series A' },
];

const GHG_TOP10 = [
  { name: 'FusionBridge',    tech: 'Nuclear fusion micro-reactor',    scale2030: 12,  scale2050: 180, factor: 250,  abatement: 45.0, cost: 8,   timeToScale: 12 },
  { name: 'CultivAlt',      tech: 'Precision fermentation protein',   scale2030: 40,  scale2050: 800, factor: 35,   abatement: 28.5, cost: -45, timeToScale: 5  },
  { name: 'H2Frontier',     tech: 'Green hydrogen electrolysis',      scale2030: 80,  scale2050: 950, factor: 21,   abatement: 19.8, cost: 22,  timeToScale: 7  },
  { name: 'GridVault',      tech: 'Long-duration grid storage',       scale2030: 120, scale2050: 600, factor: 37,   abatement: 22.4, cost: 12,  timeToScale: 4  },
  { name: 'ThermShift',     tech: 'Heat pump retrofit systems',       scale2030: 200, scale2050: 800, factor: 18,   abatement: 14.0, cost: -18, timeToScale: 3  },
  { name: 'AeroClear',      tech: 'Hydrogen aviation propulsion',     scale2030: 30,  scale2050: 400, factor: 48,   abatement: 14.2, cost: 65,  timeToScale: 10 },
  { name: 'CarbonSink Tech',tech: 'Direct air carbon capture',        scale2030: 20,  scale2050: 300, factor: 55,   abatement: 16.4, cost: 95,  timeToScale: 8  },
  { name: 'SolarNova',      tech: 'Perovskite-silicon tandem solar',  scale2030: 400, scale2050: 2000,factor: 9,    abatement: 18.2, cost: 4,   timeToScale: 3  },
  { name: 'SoilCarbon',     tech: 'Regenerative soil carbon farming', scale2030: 150, scale2050: 900, factor: 14,   abatement: 12.8, cost: -22, timeToScale: 4  },
  { name: 'EcoCrete',       tech: 'Low-carbon clinker cement',        scale2030: 90,  scale2050: 500, factor: 19,   abatement: 9.5,  cost: 18,  timeToScale: 6  },
];

// Abatement cost curve — sorted by cost ascending
const ABATEMENT_CURVE = [...GHG_TOP10]
  .sort((a, b) => a.cost - b.cost)
  .map(d => ({ name: d.name.length > 10 ? d.name.slice(0, 9) + '…' : d.name, cost: d.cost, abatement: d.abatement }));

const SDG_PIE_DATA = [
  { name: 'SDG 7 — Clean Energy',       value: 8, fill: '#f59e0b' },
  { name: 'SDG 13 — Climate Action',    value: 6, fill: T.sage    },
  { name: 'SDG 11 — Sustainable Cities',value: 3, fill: T.navyL   },
  { name: 'SDG 12 — Responsible Consumption', value: 2, fill: '#8b5cf6' },
  { name: 'SDG 15 — Life on Land',      value: 1, fill: '#10b981' },
];

const SDG_COMPANIES = [
  { name: 'SolarNova',    primary: 'SDG 7',  secondary: ['SDG 13', 'SDG 11'],        indicator: '7.2.1',  contribution: '2.4M people — clean energy access by 2030' },
  { name: 'GridVault',    primary: 'SDG 7',  secondary: ['SDG 13'],                  indicator: '7.2.1',  contribution: '18 GWh storage capacity reducing fossil peaking' },
  { name: 'FusionBridge', primary: 'SDG 7',  secondary: ['SDG 13', 'SDG 9'],         indicator: '7.3.1',  contribution: '45 MtCO2e/yr at full commercial scale' },
  { name: 'TideForce',    primary: 'SDG 7',  secondary: ['SDG 14', 'SDG 13'],        indicator: '7.2.1',  contribution: '3.2 TWh/yr offshore generation' },
  { name: 'VPP Systems',  primary: 'SDG 7',  secondary: ['SDG 11', 'SDG 13'],        indicator: '7.3.1',  contribution: '12% grid efficiency gain in pilot regions' },
  { name: 'ThermShift',   primary: 'SDG 7',  secondary: ['SDG 11', 'SDG 13'],        indicator: '7.3.1',  contribution: '200k homes retrofit, 14 MtCO2e/yr' },
  { name: 'H2Frontier',   primary: 'SDG 7',  secondary: ['SDG 9', 'SDG 13'],         indicator: '7.2.1',  contribution: '19.8 MtCO2e/yr green H2 displacement' },
  { name: 'AeroClear',    primary: 'SDG 13', secondary: ['SDG 9'],                   indicator: '13.1.1', contribution: '14.2 MtCO2e/yr aviation decarbonisation' },
  { name: 'CarbonSink',   primary: 'SDG 13', secondary: ['SDG 9'],                   indicator: '13.2.2', contribution: '16.4 MtCO2e/yr direct air capture' },
  { name: 'EcoCrete',     primary: 'SDG 13', secondary: ['SDG 9', 'SDG 11'],         indicator: '13.2.2', contribution: '9.5 MtCO2e/yr cement industry abatement' },
  { name: 'BioForge',     primary: 'SDG 13', secondary: ['SDG 9'],                   indicator: '13.2.2', contribution: '7.1 MtCO2e/yr industrial biotech substitution' },
  { name: 'CarbonLedger', primary: 'SDG 13', secondary: ['SDG 17'],                  indicator: '13.2.2', contribution: '$2.1bn in verified carbon credits tracked' },
  { name: 'NatureCredit', primary: 'SDG 15', secondary: ['SDG 13', 'SDG 1'],         indicator: '15.1.1', contribution: '1.2M ha nature-based solutions financed' },
  { name: 'ChargeLoop',   primary: 'SDG 11', secondary: ['SDG 13'],                  indicator: '11.2.1', contribution: '4.8M EV charges p.a., 8.4 MtCO2e/yr' },
  { name: 'AutoGreen',    primary: 'SDG 11', secondary: ['SDG 13'],                  indicator: '11.2.1', contribution: '5.1 MtCO2e/yr urban transport displacement' },
  { name: 'GridMind',     primary: 'SDG 11', secondary: ['SDG 7', 'SDG 13'],         indicator: '11.6.2', contribution: '12% building energy efficiency across 200 assets' },
  { name: 'VeloCity',     primary: 'SDG 11', secondary: ['SDG 13'],                  indicator: '11.2.1', contribution: '800k e-bike journeys p.a. replacing car trips' },
  { name: 'CultivAlt',   primary: 'SDG 12', secondary: ['SDG 2', 'SDG 13', 'SDG 15'],indicator: '12.2.1','contribution': '28.5 MtCO2e/yr livestock displacement' },
  { name: 'VertiGrow',   primary: 'SDG 12', secondary: ['SDG 2', 'SDG 11'],          indicator: '12.2.1', contribution: '90% water reduction, 7.3 MtCO2e/yr' },
  { name: 'SoilCarbon',  primary: 'SDG 15', secondary: ['SDG 13', 'SDG 2'],          indicator: '15.3.1', contribution: '450k ha regenerative farmland, 12.8 MtCO2e/yr' },
];

const EXITS = [
  {
    company: 'CarbonLedger', type: 'Strategic Acquisition', moic: 8.5, revenue: true,
    impactScore: 80, detail: 'Series B → Big 4 strategic acquisition at 8.5x revenue',
    insight: 'Impact credentials drove 25% premium above comparable non-impact SaaS multiples',
    highlight: 'Impact premium: +25% on exit multiple', color: T.green,
  },
  {
    company: 'GridVault', type: 'IPO', moic: 6.2, revenue: false,
    impactScore: 91, detail: 'IPO at $1.2bn — TCFD-aligned disclosure quality',
    insight: 'ESG disclosure quality reduced cost of capital by 45bps in IPO bookbuild',
    highlight: 'Cost of capital benefit: −45bps', color: T.sage,
  },
  {
    company: 'EcoCrete', type: 'Secondary Sale', moic: 3.8, revenue: false,
    impactScore: 81, detail: 'Secondary to infrastructure fund — 3.8x MOIC',
    insight: 'GRESB-ready reporting accelerated due diligence by 3 weeks',
    highlight: 'DD acceleration: 3 weeks saved', color: T.navyL,
  },
  {
    company: 'VertiGrow', type: 'Strategic Sale', moic: 1.9, revenue: false,
    impactScore: 79, detail: 'Strategic sale — below expectations',
    insight: 'Impact metrics not third-party verified — lesson: verification matters for premium',
    highlight: 'Lesson: unverified impact reduces exit multiple', color: T.amber,
  },
  {
    company: 'ChargeLoop', type: 'SPAC Listing', moic: 2.6, revenue: false,
    impactScore: 76, detail: 'Listed SPAC — carbon credits offset initial losses',
    insight: 'Scope 3 displacement carbon credits ($4.2M p.a.) offset initial operating losses',
    highlight: 'Carbon credit offset: $4.2M p.a.', color: T.gold,
  },
];

const MOIC_BY_QUINTILE = [
  { quintile: 'Q1 (Low Impact)', moic: 1.8, peers: 1.7 },
  { quintile: 'Q2',             moic: 2.2, peers: 2.0 },
  { quintile: 'Q3',             moic: 2.9, peers: 2.6 },
  { quintile: 'Q4',             moic: 3.8, peers: 3.1 },
  { quintile: 'Q5 (High Impact)',moic: 5.4, peers: 3.6 },
];

const SECTOR_COLORS = {
  'Clean Energy': '#f59e0b',
  'Transport': T.navyL,
  'Food & Agri': T.sage,
  'Buildings': '#8b5cf6',
  'Industry': T.amber,
  'Carbon Markets': '#10b981',
};

const STAGE_COLORS = { Seed: T.amber, 'Series A': T.navyL, 'Series B': T.sage, 'Series C': T.gold };

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const KPICard = ({ label, value, sub, color }) => (
  <div style={{
    background: T.surface, borderRadius: 12, padding: '20px 24px',
    boxShadow: T.card, border: `1px solid ${T.border}`, flex: 1, minWidth: 160,
  }}>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy }}>{value}</div>
    <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginTop: 4 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Badge = ({ label, color }) => (
  <span style={{
    background: (color || T.navy) + '18', color: color || T.navy,
    border: `1px solid ${(color || T.navy) + '30'}`,
    borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600,
  }}>{label}</span>
);

const Section = ({ title, children, style }) => (
  <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, boxShadow: T.card, padding: 24, ...style }}>
    {title && <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 16 }}>{title}</div>}
    {children}
  </div>
);

const ScoreDot = ({ val, max = 5 }) => {
  const pct = val / max;
  const color = pct >= 0.8 ? T.green : pct >= 0.6 ? T.amber : T.red;
  return (
    <span style={{
      display: 'inline-block', width: 28, height: 28, borderRadius: '50%',
      background: color + '22', border: `2px solid ${color}`,
      color, fontWeight: 700, fontSize: 12, textAlign: 'center', lineHeight: '24px',
    }}>{val}</span>
  );
};

// ─── TABS ─────────────────────────────────────────────────────────────────────

function Tab1() {
  const totalInvested = PORTFOLIO.reduce((s, c) => s + c.invested, 0);
  const totalAbatement = PORTFOLIO.reduce((s, c) => s + c.abatement, 0).toFixed(0);
  const sectorMap = {};
  PORTFOLIO.forEach(c => { sectorMap[c.sector] = (sectorMap[c.sector] || 0) + 1; });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KPICard label="Portfolio Companies" value="20" sub="Across 6 climate sectors" />
        <KPICard label="Total Invested" value={`$${totalInvested}M`} sub="Deployed capital" color={T.gold} />
        <KPICard label="Aggregate Abatement" value={`${totalAbatement} MtCO2e/yr`} sub="At commercial scale" color={T.sage} />
        <KPICard label="SDG Alignment" value="100%" sub="All 20 companies aligned" color={T.green} />
      </div>

      {/* Sector distribution bar */}
      <Section title="Portfolio by Sector">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {Object.entries(sectorMap).map(([sec, cnt]) => (
            <div key={sec} style={{
              background: (SECTOR_COLORS[sec] || T.navy) + '15',
              border: `1px solid ${(SECTOR_COLORS[sec] || T.navy) + '40'}`,
              borderRadius: 8, padding: '8px 14px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: SECTOR_COLORS[sec] || T.navy }}>{cnt}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sec}</div>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={PORTFOLIO.map(c => ({ name: c.name.slice(0, 10), impact: c.impactScore, sector: c.sector }))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textMut }} interval={0} angle={-35} textAnchor="end" height={50} />
            <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: T.textMut }} />
            <Tooltip contentStyle={tip} formatter={(v) => [`${v}/100`, 'Impact Score']} />
            <Bar dataKey="impact" radius={[4, 4, 0, 0]}>
              {PORTFOLIO.map((c, i) => <Cell key={i} fill={SECTOR_COLORS[c.sector] || T.navy} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
          {Object.entries(SECTOR_COLORS).map(([s, c]) => (
            <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.textSec }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: 'inline-block' }} />{s}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Portfolio Company Details">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Company', 'Sector', 'Stage', 'Invested ($M)', 'Ownership (%)', 'Valuation ($M)', 'Impact Score', 'Abatement (Mt)', 'SDG'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PORTFOLIO.map((c, i) => (
                <tr key={c.id} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                  <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy }}>{c.name}</td>
                  <td style={{ padding: '7px 10px' }}><Badge label={c.sector} color={SECTOR_COLORS[c.sector]} /></td>
                  <td style={{ padding: '7px 10px' }}><Badge label={c.stage} color={STAGE_COLORS[c.stage]} /></td>
                  <td style={{ padding: '7px 10px', textAlign: 'right' }}>${c.invested}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right' }}>{c.ownership}%</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right' }}>${c.valuation}M</td>
                  <td style={{ padding: '7px 10px', textAlign: 'center' }}><ScoreDot val={Math.round(c.impactScore / 20)} /></td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: T.sage }}>{c.abatement}</td>
                  <td style={{ padding: '7px 10px' }}><Badge label={c.sdg} color={T.navy} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function Tab2() {
  const [selected, setSelected] = useState('CultivAlt');
  const company = IMP_SCORES.find(c => c.company === selected) || IMP_SCORES[0];
  const radarData = [
    { dim: 'What', value: company.what },
    { dim: 'Who', value: company.who },
    { dim: 'How Much', value: company.howMuch },
    { dim: 'Contribution', value: company.contribution },
    { dim: 'Risk', value: company.risk },
  ];
  const highAdd = IMP_SCORES.filter(c => c.contribution >= 4).length;
  const deepImpact = IMP_SCORES.filter(c => c.howMuch >= 4).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KPICard label="High Additionality" value={`${highAdd}/20`} sub="Contribution score ≥ 4/5" color={T.sage} />
        <KPICard label="Deep Impact" value={`${deepImpact}/20`} sub="How Much score ≥ 4/5" color={T.navyL} />
        <KPICard label="IMP Class C" value="11" sub="Contribute to solutions" color={T.green} />
        <KPICard label="High Additionality %" value="72%" sub="Would not have been commercialised" color={T.gold} />
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <Section title="IMP Radar — Company Detail" style={{ flex: 1, minWidth: 300 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>Select Company: </label>
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              style={{ marginLeft: 8, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 12, color: T.text, background: T.surface }}
            >
              {IMP_SCORES.map(c => <option key={c.company} value={c.company}>{c.company}</option>)}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="dim" tick={{ fontSize: 12, fill: T.textSec }} />
              <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 9, fill: T.textMut }} />
              <Radar name={selected} dataKey="value" stroke={T.sage} fill={T.sage} fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            {radarData.map(d => (
              <div key={d.dim} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', background: T.bg, borderRadius: 6 }}>
                <span style={{ fontSize: 12, color: T.textSec }}>{d.dim}</span>
                <ScoreDot val={d.value} />
              </div>
            ))}
          </div>
        </Section>

        <Section title="IMP Impact Class Breakdown" style={{ flex: 1, minWidth: 280 }}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={IMP_CLASS_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${value}`}>
                {IMP_CLASS_DATA.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip contentStyle={tip} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {IMP_CLASS_DATA.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ width: 12, height: 12, borderRadius: 2, background: d.fill, flexShrink: 0 }} />
                <span style={{ color: T.textSec, flex: 1 }}>{d.name}</span>
                <span style={{ fontWeight: 700, color: T.navy }}>{d.value}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: 12, background: T.sage + '12', borderRadius: 8, border: `1px solid ${T.sage}30` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.sage }}>Key Finding</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>72% of portfolio companies demonstrate high additionality — without impact VC funding, these technologies would not have reached commercial viability.</div>
          </div>
        </Section>
      </div>

      <Section title="Full IMP Scores — All 20 Companies">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Company', 'What', 'Who', 'How Much', 'Contribution', 'Risk', 'Avg'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Company' ? 'left' : 'center', color: T.textSec, fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {IMP_SCORES.map((c, i) => {
                const avg = ((c.what + c.who + c.howMuch + c.contribution + c.risk) / 5).toFixed(1);
                return (
                  <tr key={c.company} style={{ background: i % 2 === 0 ? T.surface : T.bg, cursor: 'pointer' }} onClick={() => setSelected(c.company)}>
                    <td style={{ padding: '7px 12px', fontWeight: 600, color: T.navy }}>{c.company}</td>
                    {[c.what, c.who, c.howMuch, c.contribution, c.risk].map((v, j) => (
                      <td key={j} style={{ padding: '7px 12px', textAlign: 'center' }}><ScoreDot val={v} /></td>
                    ))}
                    <td style={{ padding: '7px 12px', textAlign: 'center', fontWeight: 700, color: T.sage }}>{avg}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function Tab3() {
  const highAdd = ADDITIONALITY.filter(c => c.overall >= 8).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KPICard label="High Additionality" value={`${highAdd} companies`} sub="Overall score ≥ 8/10" color={T.sage} />
        <KPICard label="Avg Additionality Score" value="6.8/10" sub="Portfolio average" color={T.navyL} />
        <KPICard label="Impact Washing Risk" value="3 companies" sub="Commercial crowding-in risk" color={T.red} />
        <KPICard label="Best Impact/Dollar" value="Series A Frontier Tech" sub="FusionBridge & CultivAlt" color={T.gold} />
      </div>

      <Section title="Impact-Return Frontier — Additionality vs IRR Expectation">
        <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Bubble size = invested capital. High-additionality frontier tech (top-left zone) offers best impact per dollar but requires longer hold periods.</div>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="irr" name="IRR Expectation (%)" type="number" domain={[10, 30]} label={{ value: 'IRR Expectation (%)', position: 'bottom', fontSize: 11, fill: T.textMut }} tick={{ fontSize: 10, fill: T.textMut }} />
            <YAxis dataKey="overall" name="Additionality Score" domain={[3, 10]} label={{ value: 'Additionality Score', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textMut }} tick={{ fontSize: 10, fill: T.textMut }} />
            <ZAxis dataKey="financial" range={[40, 180]} />
            <Tooltip contentStyle={tip} cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0]?.payload;
              if (!d) return null;
              return (
                <div style={{ ...tip, padding: '10px 14px' }}>
                  <div style={{ fontWeight: 700, color: T.navy }}>{d.company}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>Stage: {d.stage}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>Additionality: {d.overall}/10</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>IRR Expectation: {d.irr}%</div>
                </div>
              );
            }} />
            <Scatter data={ADDITIONALITY} fill={T.sage} fillOpacity={0.75}>
              {ADDITIONALITY.map((d, i) => (
                <Cell key={i} fill={d.overall >= 8 ? T.sage : d.overall >= 6 ? T.navyL : T.amber} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </Section>

      <Section title="Additionality Dimension Scores — All 20 Companies">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Company', 'Stage', 'Financial', 'Technological', 'Market', 'Catalytic', 'Overall', 'IRR Exp.'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Company' || h === 'Stage' ? 'left' : 'center', color: T.textSec, fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ADDITIONALITY.map((c, i) => (
                <tr key={c.company} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                  <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy }}>{c.company}</td>
                  <td style={{ padding: '7px 10px' }}><Badge label={c.stage} color={STAGE_COLORS[c.stage]} /></td>
                  {[c.financial, c.technological, c.market, c.catalytic].map((v, j) => (
                    <td key={j} style={{ padding: '7px 10px', textAlign: 'center' }}><ScoreDot val={v} /></td>
                  ))}
                  <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 700, color: c.overall >= 8 ? T.green : c.overall >= 6 ? T.amber : T.red }}>{c.overall}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'center', color: T.textSec }}>{c.irr}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 16, padding: 12, background: T.amber + '12', borderRadius: 8, border: `1px solid ${T.amber}30` }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.amber }}>Capital Displacement Risk</div>
          <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>CarbonLedger, VPP Systems, and ChargeLoop (overall score &lt;6) face "impact washing" risk as their technologies mature and commercial investors crowd in, reducing financial additionality.</div>
        </div>
      </Section>
    </div>
  );
}

function Tab4() {
  const totalAbatement = GHG_TOP10.reduce((s, c) => s + c.abatement, 0).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KPICard label="Total Abatement Potential" value={`${totalAbatement} MtCO2e/yr`} sub="Top 10 companies at scale" color={T.sage} />
        <KPICard label="1.5°C Pathway Contribution" value="0.6%" sub="Of global annual emissions (248 Mt)" color={T.navyL} />
        <KPICard label="Negative-Cost Measures" value="3 technologies" sub="CultivAlt, ThermShift, SoilCarbon" color={T.green} />
        <KPICard label="Avg Cost of Abatement" value="$16/tCO2e" sub="Portfolio weighted average at scale" color={T.gold} />
      </div>

      <Section title="Abatement Cost Curve (McKinsey-Style) — Cost per tCO2e vs Potential">
        <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Bar width represents abatement potential (MtCO2e/yr). Negative cost = net economic benefit at scale.</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={ABATEMENT_CURVE} margin={{ left: 20, right: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textMut }} angle={-35} textAnchor="end" height={55} />
            <YAxis label={{ value: '$/tCO2e', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textMut }} tick={{ fontSize: 10, fill: T.textMut }} />
            <Tooltip contentStyle={tip} formatter={(v, n) => [n === 'cost' ? `$${v}/tCO2e` : `${v} MtCO2e/yr`, n === 'cost' ? 'Abatement Cost' : 'Potential']} />
            <Bar dataKey="cost" radius={[4, 4, 0, 0]} name="cost">
              {ABATEMENT_CURVE.map((d, i) => <Cell key={i} fill={d.cost < 0 ? T.green : d.cost < 25 ? T.sage : d.cost < 60 ? T.amber : T.red} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>

      <Section title="GHG Abatement Model — Top 10 Companies">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Company', 'Technology', 'Units 2030', 'Units 2050', 'Factor (t/unit)', 'Abatement Mt', 'Cost $/t', 'Yrs to Scale'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GHG_TOP10.map((c, i) => (
                <tr key={c.name} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                  <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy, whiteSpace: 'nowrap' }}>{c.name}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{c.tech}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right' }}>{c.scale2030}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right' }}>{c.scale2050}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right' }}>{c.factor}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: T.sage }}>{c.abatement}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: c.cost < 0 ? T.green : c.cost < 25 ? T.amber : T.red }}>
                    {c.cost < 0 ? `−$${Math.abs(c.cost)}` : `$${c.cost}`}
                  </td>
                  <td style={{ padding: '7px 10px', textAlign: 'right' }}>{c.timeToScale}y</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 16, padding: 12, background: T.navy + '08', borderRadius: 8, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>1.5°C Pathway Sensitivity</div>
          <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>Base case: 248 MtCO2e/yr if all companies scale to assumed 2050 levels (0.6% of 42 Gt global emissions). Conservative (50% scaling): 124 Mt. Bull case (150% scaling with learning curves): 372 Mt. Sensitivity is dominated by FusionBridge (nuclear fusion) and CultivAlt (precision fermentation) assumptions.</div>
        </div>
      </Section>
    </div>
  );
}

function Tab5() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KPICard label="Primary SDG Coverage" value="5 SDGs" sub="SDG 7, 13, 11, 12, 15" color={T.navyL} />
        <KPICard label="SDG 7 Companies" value="8" sub="Clean energy — largest block" color="#f59e0b" />
        <KPICard label="SDG Portfolio Rating" value="A−" sub="vs BB peer average" color={T.sage} />
        <KPICard label="Trade-Off Risk" value="2 companies" sub="Critical minerals vs SDG 15" color={T.amber} />
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <Section title="Primary SDG Distribution" style={{ flex: '0 0 320px' }}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={SDG_PIE_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${value}`}>
                {SDG_PIE_DATA.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip contentStyle={tip} formatter={(v, n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {SDG_PIE_DATA.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: d.fill, flexShrink: 0 }} />
                <span style={{ color: T.textSec, flex: 1 }}>{d.name}</span>
                <span style={{ fontWeight: 700, color: T.navy }}>{d.value}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="SDG Negative Screening — Trade-Off Risk" style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: 12, background: T.amber + '12', borderRadius: 8, border: `1px solid ${T.amber}30` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.amber }}>H2Frontier — SDG 7 vs SDG 15</div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Green hydrogen production requires platinum-group metals. Critical mineral extraction may conflict with SDG 15.1 (terrestrial ecosystem protection). Mitigation: supplier audit protocol in place.</div>
            </div>
            <div style={{ padding: 12, background: T.amber + '12', borderRadius: 8, border: `1px solid ${T.amber}30` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.amber }}>SolarNova — SDG 7 vs SDG 12</div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Perovskite solar cell manufacturing uses lead compounds. End-of-life panel recycling protocol not yet at commercial scale — SDG 12.4 hazardous materials risk. Mitigation: R&D roadmap for lead-free perovskite.</div>
            </div>
            <div style={{ padding: 12, background: T.green + '10', borderRadius: 8, border: `1px solid ${T.green}30` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.green }}>Portfolio SDG Rating: A− (vs BB peer average)</div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Portfolio outperforms Cambridge Associates impact benchmark on 4 of 5 SDG composite dimensions. GRI Standards mapped: GRI 301 (Materials), GRI 302 (Energy), GRI 305 (Emissions), GRI 304 (Biodiversity).</div>
            </div>
          </div>
        </Section>
      </div>

      <Section title="SDG Indicator Mapping — All 20 Companies">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Company', 'Primary SDG', 'Secondary SDGs', 'SDG Indicator', 'Quantitative Contribution'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SDG_COMPANIES.map((c, i) => (
                <tr key={c.name} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                  <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy }}>{c.name}</td>
                  <td style={{ padding: '7px 10px' }}><Badge label={c.primary} color={SDG_PIE_DATA.find(d => d.name.startsWith(c.primary))?.fill || T.navy} /></td>
                  <td style={{ padding: '7px 10px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {c.secondary.map(s => <Badge key={s} label={s} color={T.textMut} />)}
                    </div>
                  </td>
                  <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11, color: T.navyL }}>{c.indicator}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{c.contribution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function Tab6() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KPICard label="Impact Premium" value="1.4x MOIC" sub="vs non-impact peers (Cambridge 2024)" color={T.sage} />
        <KPICard label="Exits Analysed" value="5" sub="Full case study coverage" color={T.navyL} />
        <KPICard label="Best Exit" value="8.5x Revenue" sub="CarbonLedger — strategic acquisition" color={T.gold} />
        <KPICard label="Key Lesson" value="Verification" sub="Third-party verification drives premium" color={T.amber} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {EXITS.map((e, i) => (
          <div key={e.company} style={{
            background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`,
            borderLeft: `4px solid ${e.color}`, padding: 20, boxShadow: T.card,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>{e.company}</span>
                  <Badge label={e.type} color={e.color} />
                  <Badge label={`MOIC: ${e.moic}x`} color={e.moic >= 4 ? T.green : e.moic >= 2.5 ? T.amber : T.red} />
                </div>
                <div style={{ fontSize: 12, color: T.textSec }}>{e.detail}</div>
                <div style={{ fontSize: 12, color: T.textSec, marginTop: 6 }}>{e.insight}</div>
              </div>
              <div style={{ padding: '8px 14px', background: e.color + '14', borderRadius: 8, border: `1px solid ${e.color}30`, textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: e.color }}>{e.highlight}</div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>Impact Score: {e.impactScore}/100</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Section title="MOIC by Impact Score Quintile — Portfolio Analysis">
        <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Impact-credentialed exits achieved 1.4x MOIC premium vs non-impact peers (Cambridge Associates 2024). Q5 (highest impact) shows 50% MOIC premium above non-impact comparables.</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={MOIC_BY_QUINTILE} margin={{ left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
            <XAxis dataKey="quintile" tick={{ fontSize: 10, fill: T.textMut }} />
            <YAxis domain={[0, 6]} label={{ value: 'MOIC', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textMut }} tick={{ fontSize: 10, fill: T.textMut }} />
            <Tooltip contentStyle={tip} formatter={(v, n) => [`${v}x`, n === 'moic' ? 'Portfolio MOIC' : 'Peer Avg MOIC']} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="moic" name="Portfolio MOIC" radius={[4, 4, 0, 0]}>
              {MOIC_BY_QUINTILE.map((d, i) => <Cell key={i} fill={T.sage} />)}
            </Bar>
            <Bar dataKey="peers" name="Non-Impact Peer MOIC" radius={[4, 4, 0, 0]}>
              {MOIC_BY_QUINTILE.map((d, i) => <Cell key={i} fill={T.borderL} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'portfolio',    label: 'Climate Tech Portfolio' },
  { id: 'imp',         label: 'IMP 5 Dimensions'       },
  { id: 'additionality',label: 'Additionality'          },
  { id: 'ghg',         label: 'GHG Abatement'          },
  { id: 'sdg',         label: 'SDG Contribution'       },
  { id: 'exits',       label: 'Exit Impact Analysis'   },
];

export default function VcImpactPage() {
  const [activeTab, setActiveTab] = useState('portfolio');

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${T.sage}, ${T.navyL})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 18 }}>🌱</span>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.navy }}>Venture Capital Impact Tracker</div>
            <div style={{ fontSize: 12, color: T.textSec }}>EP-AG5 · $500bn ClimateTech VC Universe · Impact Management Project Framework</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Climate Tech', 'IMP 5D', '$500bn ClimateTech VC', 'Additionality', 'SDG Alignment'].map(b => (
            <Badge key={b} label={b} color={T.sage} />
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, background: T.surface, borderRadius: 10, padding: 4, border: `1px solid ${T.border}`, boxShadow: T.card, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer',
            background: activeTab === t.id ? T.navy : 'transparent',
            color: activeTab === t.id ? '#fff' : T.textSec,
            fontWeight: activeTab === t.id ? 700 : 500, fontSize: 13,
            fontFamily: T.font, transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'portfolio'     && <Tab1 />}
      {activeTab === 'imp'           && <Tab2 />}
      {activeTab === 'additionality' && <Tab3 />}
      {activeTab === 'ghg'           && <Tab4 />}
      {activeTab === 'sdg'           && <Tab5 />}
      {activeTab === 'exits'         && <Tab6 />}
    </div>
  );
}
