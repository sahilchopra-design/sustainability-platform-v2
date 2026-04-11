/* EP-DD4: Carbon-Adjusted Valuation — Sprint DD */
import React, { useState, useMemo } from 'react';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, ZAxis
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SECTORS = ['Energy', 'Utilities', 'Industrials', 'Materials', 'Technology', 'Consumer', 'Healthcare', 'Financials'];
const NGFS_PATHS = {
  'Net Zero 2050': [25, 40, 65, 100, 140, 180, 210],
  'Below 2°C': [20, 30, 45, 70, 100, 130, 155],
  'NDC': [15, 20, 28, 38, 50, 62, 72],
  'Current Policies': [10, 12, 15, 18, 22, 26, 30],
};
const YEARS = [2025, 2027, 2029, 2031, 2033, 2035, 2037];
const SECTOR_COLORS = { Energy: '#dc2626', Utilities: '#2563eb', Industrials: '#d97706', Materials: '#7c3aed', Technology: '#059669', Consumer: '#db2777', Healthcare: '#0891b2', Financials: '#65a30d' };

const COMPANIES = Array.from({ length: 60 }, (_, i) => {
  const sec = SECTORS[i % 8];
  const baseEv = 1 + sr(i * 7) * 49;
  const revenue = baseEv * (0.4 + sr(i * 11) * 0.8);
  const ebitda = revenue * (0.1 + sr(i * 13) * 0.25);
  const fcf = ebitda * (0.4 + sr(i * 17) * 0.4);
  const growthRate = 0.02 + sr(i * 19) * 0.12;
  const wacc = 0.06 + sr(i * 23) * 0.06;
  const scope1 = sec === 'Energy' ? 500 + sr(i * 29) * 4500 : sec === 'Materials' ? 200 + sr(i * 29) * 1800 : 10 + sr(i * 29) * 490;
  const scope2 = scope1 * (0.1 + sr(i * 31) * 0.3);
  const scope3Intensity = sr(i * 37) * 5 + 0.5;
  const carbonCostPassThrough = 0.3 + sr(i * 41) * 0.5;
  const sbtiAligned = sr(i * 43) > 0.45;
  const netZeroYear = sbtiAligned ? 2045 + Math.floor(sr(i * 47) * 15) : 0;
  const strandedPct = sec === 'Energy' ? 10 + sr(i * 53) * 40 : sec === 'Materials' ? 5 + sr(i * 53) * 20 : sr(i * 53) * 5;
  const fossilCapex = sec === 'Energy' ? revenue * (0.1 + sr(i * 59) * 0.2) : revenue * sr(i * 59) * 0.05;
  const greenCapex = revenue * (0.02 + sr(i * 61) * 0.12);
  const carbonBeta = sec === 'Energy' ? 0.8 + sr(i * 67) * 1.2 : sec === 'Materials' ? 0.4 + sr(i * 67) * 0.8 : sr(i * 67) * 0.4;
  const esgPremium = sbtiAligned ? 0.01 + sr(i * 71) * 0.02 : 0;
  const analystTarget = baseEv * (0.9 + sr(i * 73) * 0.4);
  const currentPrice = analystTarget * (0.8 + sr(i * 79) * 0.4);
  const terminalGrowth = 0.015 + sr(i * 83) * 0.015;
  return {
    id: i + 1,
    name: `${['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'][i % 5]} ${sec} ${['Corp', 'Group', 'Holdings', 'AG', 'Plc'][i % 5]}`,
    ticker: `${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i * 3) % 26))}${String.fromCharCode(65 + ((i * 7) % 26))}`,
    sector: sec,
    baseEv: +baseEv.toFixed(1),
    revenue: +revenue.toFixed(1),
    ebitda: +ebitda.toFixed(2),
    fcf: +fcf.toFixed(2),
    growthRate: +growthRate.toFixed(3),
    wacc: +wacc.toFixed(3),
    scope1: +scope1.toFixed(0),
    scope2: +scope2.toFixed(0),
    scope3Intensity: +scope3Intensity.toFixed(2),
    carbonCostPassThrough: +carbonCostPassThrough.toFixed(2),
    sbtiAligned,
    sbtiTarget: sbtiAligned ? `${Math.floor(sr(i * 89) * 50 + 30)}% by 2030` : null,
    netZeroYear,
    strandedPct: +strandedPct.toFixed(1),
    fossilCapex: +fossilCapex.toFixed(2),
    greenCapex: +greenCapex.toFixed(2),
    carbonBeta: +carbonBeta.toFixed(2),
    esgPremium: +esgPremium.toFixed(3),
    analystTarget: +analystTarget.toFixed(1),
    currentPrice: +currentPrice.toFixed(1),
    terminalGrowth: +terminalGrowth.toFixed(3),
  };
});

const TABS = ['DCF Engine', 'Carbon Cost Scenarios', 'Sector Comps', 'SBTi Premium Engine', 'Stranded Asset Discount', 'Sensitivity Analysis', 'Factor Attribution', 'Valuation Summary'];

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
export default function CarbonAdjustedValuationPage() {

  const [tab, setTab] = useState(0);
  const [filterSector, setFilterSector] = useState('All');
  const [carbonPrice, setCarbonPrice] = useState(75);
  const [ngfsScenario, setNgfsScenario] = useState('Net Zero 2050');
  const [selectedCompany, setSelectedCompany] = useState(COMPANIES[0]);
  const [projYears, setProjYears] = useState(10);

  const KpiCard = ({ label, value, sub, color }) => (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', minWidth: 140 }}>
      <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || T.navy, margin: '4px 0' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec }}>{sub}</div>}
    </div>
  );

  const filtered = useMemo(() => filterSector === 'All' ? COMPANIES : COMPANIES.filter(c => c.sector === filterSector), [filterSector]);

  // DCF with carbon overlay
  const dcfCalc = useMemo(() => {
    const c = selectedCompany;
    const path = NGFS_PATHS[ngfsScenario];
    const years = Array.from({ length: projYears }, (_, y) => {
      const yr = 2025 + y;
      const pathIdx = Math.min(6, Math.floor(y / (projYears / 7)));
      const cp = path[pathIdx];
      const carbonCost = (c.scope1 + c.scope2) * cp / 1000000 * (1 - c.carbonCostPassThrough);
      const revenue = c.revenue * Math.pow(1 + c.growthRate, y);
      const ebitda = revenue * (c.ebitda / Math.max(0.01, c.revenue));
      const fcf = Math.max(0, ebitda * 0.6 - carbonCost);
      const df = Math.pow(1 + c.wacc, y + 1);
      return { year: yr, revenue: +revenue.toFixed(1), ebitda: +ebitda.toFixed(2), carbonCost: +carbonCost.toFixed(2), fcf: +fcf.toFixed(2), pv: +(fcf / df).toFixed(2) };
    });
    const pvSum = years.reduce((s, y) => s + y.pv, 0);
    const tv = c.fcf * (1 + c.terminalGrowth) / Math.max(0.001, c.wacc - c.terminalGrowth);
    const tvPv = tv / Math.pow(1 + c.wacc, projYears);
    return { years, pvSum: +pvSum.toFixed(1), tv: +tv.toFixed(1), tvPv: +tvPv.toFixed(1), totalEv: +(pvSum + tvPv).toFixed(1) };
  }, [selectedCompany, ngfsScenario, projYears]);

  const ngfsPriceData = useMemo(() => YEARS.map((yr, i) => ({
    year: yr,
    'Net Zero 2050': NGFS_PATHS['Net Zero 2050'][i],
    'Below 2°C': NGFS_PATHS['Below 2°C'][i],
    'NDC': NGFS_PATHS['NDC'][i],
    'Current Policies': NGFS_PATHS['Current Policies'][i],
  })), []);

  const carbonScenarioImpact = useMemo(() => filtered.slice(0, 12).map(c => {
    const baseImpact = (c.scope1 + c.scope2) * carbonPrice / 1000000 * (1 - c.carbonCostPassThrough);
    const evHaircut = baseImpact / Math.max(0.01, c.baseEv) * 100;
    return {
      ticker: c.ticker,
      baseEv: c.baseEv,
      carbonAdj: +(c.baseEv - baseImpact / (c.wacc - c.terminalGrowth || 0.05)).toFixed(1),
      haircut: +evHaircut.toFixed(1),
      annualCost: +baseImpact.toFixed(2),
    };
  }), [filtered, carbonPrice]);

  const sectorComps = useMemo(() => SECTORS.map(sec => {
    const arr = COMPANIES.filter(c => c.sector === sec);
    const avgEv = arr.length ? arr.reduce((s, c) => s + c.baseEv, 0) / arr.length : 0;
    const avgEbitda = arr.length ? arr.reduce((s, c) => s + c.ebitda, 0) / arr.length : 0;
    const evEbitda = avgEbitda > 0 ? avgEv / avgEbitda : 0;
    const carbonCost = arr.length ? arr.reduce((s, c) => s + (c.scope1 + c.scope2) * carbonPrice / 1000000 * (1 - c.carbonCostPassThrough), 0) / arr.length : 0;
    return { sector: sec, evEbitda: +evEbitda.toFixed(1), carbonAdj: +(evEbitda * (1 - carbonCost / Math.max(0.01, avgEv) * 2)).toFixed(1), sbtiPct: arr.length ? +(arr.filter(c => c.sbtiAligned).length / arr.length * 100).toFixed(0) : 0 };
  }), [carbonPrice]);

  const sbtiPremiumData = useMemo(() => filtered.slice(0, 15).map(c => ({
    ticker: c.ticker,
    baseEv: c.baseEv,
    sbtiPremiumPct: c.sbtiAligned ? +(c.esgPremium * 100 * 10).toFixed(1) : 0,
    adjEv: c.sbtiAligned ? +(c.baseEv * (1 + c.esgPremium * 2)).toFixed(1) : c.baseEv,
    sbtiAligned: c.sbtiAligned,
  })), [filtered]);

  const strandedDiscountData = useMemo(() => filtered.slice(0, 12).map(c => {
    const strandedNpv = c.strandedPct / 100 * c.baseEv;
    const adjEv = c.baseEv - strandedNpv;
    return {
      ticker: c.ticker,
      baseEv: c.baseEv,
      strandedNpv: +strandedNpv.toFixed(2),
      adjEv: +adjEv.toFixed(1),
      strandedPct: c.strandedPct,
    };
  }), [filtered]);

  const sensitivityGrid = useMemo(() => {
    const c = selectedCompany;
    const prices = [30, 50, 75, 100, 150, 200, 300];
    const waccs = [-0.01, -0.005, 0, 0.005, 0.01];
    return prices.map(p => {
      const row = { carbonPrice: p };
      waccs.forEach(dw => {
        const adjWacc = c.wacc + dw;
        const annualCost = (c.scope1 + c.scope2) * p / 1000000 * (1 - c.carbonCostPassThrough);
        const ev = (c.fcf - annualCost) / Math.max(0.001, adjWacc - c.terminalGrowth);
        row[`WACC${dw >= 0 ? '+' : ''}${(dw * 100).toFixed(0)}%`] = +ev.toFixed(1);
      });
      return row;
    });
  }, [selectedCompany]);

  const factorAttrib = useMemo(() => [
    { factor: 'Base DCF', contribution: dcfCalc.totalEv, color: T.blue },
    { factor: 'Carbon Cost', contribution: -(selectedCompany.scope1 + selectedCompany.scope2) * carbonPrice / 1000000 / (selectedCompany.wacc - selectedCompany.terminalGrowth || 0.05) * (1 - selectedCompany.carbonCostPassThrough), color: T.red },
    { factor: 'SBTi Premium', contribution: selectedCompany.sbtiAligned ? selectedCompany.baseEv * selectedCompany.esgPremium * 2 : 0, color: T.green },
    { factor: 'Stranded Discount', contribution: -(selectedCompany.strandedPct / 100 * selectedCompany.baseEv), color: T.amber },
    { factor: 'Climate Beta', contribution: selectedCompany.carbonBeta < 0.5 ? selectedCompany.baseEv * 0.02 : -(selectedCompany.baseEv * (selectedCompany.carbonBeta - 0.5) * 0.03), color: T.indigo },
  ].map(f => ({ ...f, contribution: +f.contribution.toFixed(2) })), [selectedCompany, carbonPrice, dcfCalc, T]);

  const totalAdjEv = factorAttrib.reduce((s, f) => s + f.contribution, 0);

  const valuationSummary = useMemo(() => filtered.slice(0, 12).map(c => {
    const annualCarbonCost = (c.scope1 + c.scope2) * carbonPrice / 1000000 * (1 - c.carbonCostPassThrough);
    const carbonAdj = -annualCarbonCost / Math.max(0.001, c.wacc - c.terminalGrowth);
    const sbtiAdj = c.sbtiAligned ? c.baseEv * c.esgPremium * 2 : 0;
    const strandedAdj = -(c.strandedPct / 100 * c.baseEv);
    const totalAdj = carbonAdj + sbtiAdj + strandedAdj;
    const adjEv = c.baseEv + totalAdj;
    return {
      ticker: c.ticker,
      sector: c.sector,
      baseEv: c.baseEv,
      carbonAdj: +carbonAdj.toFixed(2),
      sbtiAdj: +sbtiAdj.toFixed(2),
      strandedAdj: +strandedAdj.toFixed(2),
      adjEv: +adjEv.toFixed(1),
      adjPct: +(totalAdj / Math.max(0.01, c.baseEv) * 100).toFixed(1),
      vsAnalyst: +(adjEv - c.analystTarget).toFixed(1),
    };
  }), [filtered, carbonPrice]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>EP-DD4 · CORPORATE FINANCE & CAPITAL MARKETS</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: T.navy, margin: 0 }}>Carbon-Adjusted Valuation</h1>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>60 companies · Full DCF with carbon overlay · NGFS price paths · SBTi premium · Stranded asset discount</div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterSector} onChange={e => setFilterSector(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, color: T.textPri, fontSize: 13 }}>
          <option value="All">All Sectors</option>
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={ngfsScenario} onChange={e => setNgfsScenario(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, color: T.textPri, fontSize: 13 }}>
          {Object.keys(NGFS_PATHS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Carbon Price: ${carbonPrice}/tCO₂</span>
          <input type="range" min={0} max={300} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 120 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Proj Years: {projYears}</span>
          <input type="range" min={5} max={20} value={projYears} onChange={e => setProjYears(+e.target.value)} style={{ width: 80 }} />
        </div>
        <select value={selectedCompany.id} onChange={e => setSelectedCompany(COMPANIES.find(c => c.id === +e.target.value))} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, color: T.textPri, fontSize: 13 }}>
          {COMPANIES.slice(0, 20).map(c => <option key={c.id} value={c.id}>{c.ticker} — {c.sector}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="DCF EV" value={`$${dcfCalc.totalEv}Bn`} sub={`${ngfsScenario}`} color={T.navy} />
        <KpiCard label="Carbon Adj EV" value={`$${totalAdjEv.toFixed(1)}Bn`} sub={`vs $${selectedCompany.baseEv}Bn base`} color={T.amber} />
        <KpiCard label="PV Sum" value={`$${dcfCalc.pvSum}Bn`} sub={`${projYears}yr FCF`} color={T.blue} />
        <KpiCard label="Terminal Value" value={`$${dcfCalc.tvPv.toFixed(1)}Bn`} sub="PV of TV" color={T.indigo} />
        <KpiCard label="Carbon Cost/yr" value={`$${(((selectedCompany.scope1 + selectedCompany.scope2) * carbonPrice / 1000000) * (1 - selectedCompany.carbonCostPassThrough)).toFixed(0)}Mn`} sub="Annual net cost" color={T.red} />
        <KpiCard label="SBTi Aligned" value={`${filtered.filter(c => c.sbtiAligned).length}/${filtered.length}`} sub="Companies" color={T.green} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `2px solid ${T.border}`, paddingBottom: 0, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: tab === i ? `3px solid ${T.gold}` : '3px solid transparent', color: tab === i ? T.navy : T.textSec, fontWeight: tab === i ? 700 : 400, cursor: 'pointer', fontSize: 13 }}>{t}</button>
        ))}
      </div>

      {/* Tab 0: DCF Engine */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>DCF Projection — {selectedCompany.ticker} ({ngfsScenario})</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>WACC: {(selectedCompany.wacc * 100).toFixed(1)}% · TGR: {(selectedCompany.terminalGrowth * 100).toFixed(1)}%</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dcfCalc.years.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}Bn`} />
                  <Tooltip formatter={v => `$${v}Bn`} />
                  <Legend />
                  <Bar dataKey="fcf" name="Free Cash Flow" fill={T.green} />
                  <Bar dataKey="carbonCost" name="Carbon Cost" fill={T.red} />
                  <Bar dataKey="pv" name="PV of FCF" fill={T.blue} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>NGFS Carbon Price Paths</div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={ngfsPriceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={v => `$${v}/tCO₂`} />
                  <Legend />
                  <Line type="monotone" dataKey="Net Zero 2050" stroke={T.green} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Below 2°C" stroke={T.blue} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="NDC" stroke={T.amber} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Current Policies" stroke={T.red} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Carbon Cost Scenarios */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>EV Haircut by Carbon Price: ${carbonPrice}/tCO₂</div>
              <input type="range" min={0} max={300} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: '100%', marginBottom: 12 }} />
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={carbonScenarioImpact}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="ticker" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Bar dataKey="haircut" name="EV Haircut %">
                    {carbonScenarioImpact.map((e, i) => <Cell key={i} fill={e.haircut > 10 ? T.red : e.haircut > 5 ? T.amber : T.green} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Annual Carbon Cost vs Base EV</div>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="baseEv" name="Base EV $Bn" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Base EV $Bn', position: 'insideBottom', offset: -5, fontSize: 11, fill: T.textSec }} />
                  <YAxis dataKey="annualCost" name="Annual Carbon Cost" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Carbon Cost $Mn/yr', angle: -90, position: 'insideLeft', fontSize: 10, fill: T.textSec }} />
                  <Tooltip formatter={(v, n) => [n === 'Base EV $Bn' ? `$${v}Bn` : `$${v}Mn`, n]} />
                  <Scatter data={carbonScenarioImpact} fill={T.red} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Sector Comps */}
      {tab === 2 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>EV/EBITDA — Base vs Carbon-Adjusted by Sector</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={sectorComps}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}×`} />
                <Tooltip formatter={v => `${v}×`} />
                <Legend />
                <Bar dataKey="evEbitda" name="Base EV/EBITDA" fill={T.blue} />
                <Bar dataKey="carbonAdj" name="Carbon-Adj EV/EBITDA" fill={T.navy} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 3: SBTi Premium Engine */}
      {tab === 3 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>SBTi Premium: Adj EV vs Base EV</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sbtiPremiumData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="ticker" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}Bn`} />
                  <Tooltip formatter={v => `$${v}Bn`} />
                  <Legend />
                  <Bar dataKey="baseEv" name="Base EV $Bn" fill={T.blue} />
                  <Bar dataKey="adjEv" name="SBTi-Adj EV $Bn" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>SBTi Premium % by Company</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['Ticker', 'SBTi Status', 'Premium %', 'Adj EV', 'NZ Year'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sbtiPremiumData.map((d, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                      <td style={{ padding: '6px 10px', fontFamily: T.fontMono, fontWeight: 700, color: T.navy }}>{d.ticker}</td>
                      <td style={{ padding: '6px 10px', color: d.sbtiAligned ? T.green : T.textSec, fontSize: 11 }}>{d.sbtiAligned ? '✓ Aligned' : '— None'}</td>
                      <td style={{ padding: '6px 10px', fontFamily: T.fontMono, color: T.green }}>{d.sbtiPremiumPct > 0 ? `+${d.sbtiPremiumPct}%` : '—'}</td>
                      <td style={{ padding: '6px 10px', fontFamily: T.fontMono }}>${d.adjEv}Bn</td>
                      <td style={{ padding: '6px 10px', fontSize: 11, color: T.textSec }}>{COMPANIES.find(c => c.ticker === d.ticker)?.netZeroYear || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Stranded Asset Discount */}
      {tab === 4 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Stranded Asset NPV Discount</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={strandedDiscountData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="ticker" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}Bn`} />
                <Tooltip formatter={v => `$${v}Bn`} />
                <Legend />
                <Bar dataKey="baseEv" name="Base EV $Bn" fill={T.blue} />
                <Bar dataKey="strandedNpv" name="Stranded NPV Disc." fill={T.red} />
                <Bar dataKey="adjEv" name="Adj EV $Bn" fill={T.navy} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 5: Sensitivity Analysis */}
      {tab === 5 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>EV Sensitivity — Carbon Price vs WACC ({selectedCompany.ticker})</div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 16 }}>EV in $Bn — rows = carbon price, columns = WACC delta</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    <th style={{ padding: '8px 12px', color: T.textSec, fontWeight: 600 }}>Carbon Price</th>
                    {['-1%', '-0.5%', '0%', '+0.5%', '+1%'].map(w => (
                      <th key={w} style={{ padding: '8px 12px', color: T.textSec, fontWeight: 600 }}>WACC {w}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sensitivityGrid.map((row, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, fontWeight: 700, color: T.navy }}>${row.carbonPrice}/t</td>
                      {['-1%', '-0.5%', '0%', '+0.5%', '+1%'].map(w => {
                        const val = row[`WACC${w === '0%' ? '+0' : w}`] ?? row['WACC+0%'];
                        return (
                          <td key={w} style={{ padding: '7px 12px', fontFamily: T.fontMono, color: val > selectedCompany.baseEv ? T.green : val < selectedCompany.baseEv * 0.8 ? T.red : T.amber }}>${val}Bn</td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Factor Attribution */}
      {tab === 6 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>EV Factor Attribution — {selectedCompany.ticker}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>Carbon-Adjusted EV: ${totalAdjEv.toFixed(1)}Bn (Base: ${selectedCompany.baseEv}Bn)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={factorAttrib}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="factor" tick={{ fontSize: 10, fill: T.textSec }} angle={-20} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}Bn`} />
                  <Tooltip formatter={v => `$${v}Bn`} />
                  <Bar dataKey="contribution" name="Contribution ($Bn)">
                    {factorAttrib.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Carbon Beta Distribution</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="carbonBeta" name="Carbon Beta" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Carbon Beta', position: 'insideBottom', offset: -5, fontSize: 11, fill: T.textSec }} />
                  <YAxis dataKey="baseEv" name="Base EV $Bn" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}Bn`} />
                  <Tooltip formatter={(v, n) => [n === 'Base EV $Bn' ? `$${v}Bn` : v.toFixed(2), n]} />
                  {SECTORS.map(s => (
                    <Scatter key={s} name={s} data={filtered.filter(c => c.sector === s).map(c => ({ carbonBeta: c.carbonBeta, baseEv: c.baseEv, name: c.ticker }))} fill={SECTOR_COLORS[s]} fillOpacity={0.7} />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Valuation Summary */}
      {tab === 7 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Carbon-Adjusted Valuation Summary</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['Ticker', 'Sector', 'Base EV', 'Carbon Adj', 'SBTi Adj', 'Stranded Adj', 'Total Adj EV', 'Delta %', 'vs Analyst'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {valuationSummary.map((d, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, fontWeight: 700, color: T.navy }}>{d.ticker}</td>
                      <td style={{ padding: '7px 12px' }}><span style={{ background: SECTOR_COLORS[d.sector] + '22', color: SECTOR_COLORS[d.sector], padding: '2px 7px', borderRadius: 4, fontSize: 10 }}>{d.sector}</span></td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>${d.baseEv}Bn</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.red }}>{d.carbonAdj.toFixed(2)}Bn</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.green }}>{d.sbtiAdj > 0 ? '+' : ''}{d.sbtiAdj.toFixed(2)}Bn</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: T.amber }}>{d.strandedAdj.toFixed(2)}Bn</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, fontWeight: 700, color: T.navy }}>${d.adjEv}Bn</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: d.adjPct < 0 ? T.red : T.green }}>{d.adjPct > 0 ? '+' : ''}{d.adjPct}%</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono, color: d.vsAnalyst > 0 ? T.green : T.red }}>{d.vsAnalyst > 0 ? '+' : ''}{d.vsAnalyst}Bn</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
