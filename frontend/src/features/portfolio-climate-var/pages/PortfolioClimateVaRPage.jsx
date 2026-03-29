import React, { useState } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area, LineChart, Line, ResponsiveContainer,
} from 'recharts';
import { NGFS_PHASE4, SECTOR_PD_UPLIFT, getCountryPhysicalRisk } from '../../../services/climateRiskDataService';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const ACCENT = '#0f766e';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const HOLDINGS = [
  { id:'H1',  name:'Reliance Industries',  sector:'Chemicals & Petrochemicals', country:'IN', revenue:88,  scope1:14.2,  scope2:8.4,  scope3:42.0,  weight:0.12, marketCap:220 },
  { id:'H2',  name:'Coal India',           sector:'Mining & Coal Extraction',   country:'IN', revenue:14,  scope1:98.4,  scope2:4.2,  scope3:180.0, weight:0.08, marketCap:28  },
  { id:'H3',  name:'NTPC',                 sector:'Electricity Generation',     country:'IN', revenue:18,  scope1:82.1,  scope2:2.8,  scope3:12.0,  weight:0.10, marketCap:24  },
  { id:'H4',  name:'Adani Green Energy',   sector:'Renewables & Clean Energy',  country:'IN', revenue:4,   scope1:0.2,   scope2:0.4,  scope3:1.2,   weight:0.07, marketCap:32  },
  { id:'H5',  name:'JSW Steel',            sector:'Steel & Primary Metals',     country:'IN', revenue:22,  scope1:42.8,  scope2:6.2,  scope3:18.0,  weight:0.09, marketCap:28  },
  { id:'H6',  name:'L&T Infrastructure',  sector:'Construction',               country:'IN', revenue:16,  scope1:8.4,   scope2:3.2,  scope3:22.0,  weight:0.08, marketCap:38  },
  { id:'H7',  name:'Rio Tinto',            sector:'Mining & Coal Extraction',   country:'AU', revenue:55,  scope1:28.4,  scope2:8.8,  scope3:420.0, weight:0.10, marketCap:110 },
  { id:'H8',  name:'Shell plc',            sector:'Oil & Gas Extraction',       country:'GB', revenue:380, scope1:68.2,  scope2:12.4, scope3:680.0, weight:0.12, marketCap:220 },
  { id:'H9',  name:'Siemens Energy',       sector:'Renewables & Clean Energy',  country:'DE', revenue:32,  scope1:0.8,   scope2:1.2,  scope3:8.4,   weight:0.06, marketCap:28  },
  { id:'H10', name:'ArcelorMittal',        sector:'Steel & Primary Metals',     country:'BE', revenue:79,  scope1:140.0, scope2:18.2, scope3:42.0,  weight:0.08, marketCap:22  },
  { id:'H11', name:'EDF Group',            sector:'Electricity Generation',     country:'FR', revenue:84,  scope1:22.4,  scope2:4.2,  scope3:14.0,  weight:0.06, marketCap:52  },
  { id:'H12', name:'Tata Motors',          sector:'Automotive Manufacturing',   country:'IN', revenue:42,  scope1:4.2,   scope2:2.8,  scope3:84.0,  weight:0.04, marketCap:28  },
];

const NGFS_IDS = ['nz2050', 'b2c', 'dt', 'dnz', 'ndc', 'cp'];

const SECTOR_MAP = {
  'Chemicals & Petrochemicals': 'Chemicals',
  'Mining & Coal Extraction':   'Mining',
  'Electricity Generation':     'Utilities (Fossil)',
  'Renewables & Clean Energy':  'Renewables',
  'Steel & Primary Metals':     'Mining',
  'Construction':               'Real Estate',
  'Oil & Gas Extraction':       'Oil & Gas',
  'Automotive Manufacturing':   'Automobiles',
};

const COUNTRY_NAMES = {
  IN: 'India', AU: 'Australia', GB: 'UK', DE: 'Germany', BE: 'Netherlands', FR: 'France',
};

function getPdUplift(sector, scenarioId) {
  const mapped = SECTOR_MAP[sector] || 'Chemicals';
  const row = SECTOR_PD_UPLIFT.find(r => r.sector === mapped);
  return row ? (row[scenarioId] || 0) : 0;
}

function computeTVaR(holding, scenarioId) {
  const pd = getPdUplift(holding.sector, scenarioId);
  return holding.weight * holding.marketCap * (pd / 10000) * 12;
}

function computePhysVaR(holding, ssp) {
  const cName = COUNTRY_NAMES[holding.country] || 'India';
  const risk = getCountryPhysicalRisk(cName, ssp);
  const score = risk ? risk.composite : 5;
  return holding.weight * holding.marketCap * (score / 10) * 0.08;
}

const TABS = [
  'VaR Dashboard',
  'Expected Shortfall',
  'Scope 3 Emissions',
  'NGFS Comparison',
  'Physical VaR',
  'Horizon & Confidence',
];

const StatCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 160 }}>
    <div style={{ color: T.textSec, fontSize: 11, marginBottom: 4 }}>{label}</div>
    <div style={{ color: color || T.gold, fontSize: 20, fontWeight: 700 }}>{value}</div>
    {sub && <div style={{ color: T.textMut, fontSize: 11, marginTop: 3 }}>{sub}</div>}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ color: T.text, fontWeight: 700, fontSize: 14, marginBottom: 10, borderLeft: `3px solid ${ACCENT}`, paddingLeft: 10 }}>{children}</div>
);

const barColor = (v, t1, t2) => v > t1 ? T.red : v > t2 ? T.amber : T.green;

/* ── Tab 1 — VaR Dashboard ── */
function Tab1({ scenario, setScenario }) {
  const scIdx = NGFS_IDS.indexOf(scenario);
  const ngfs = NGFS_PHASE4[scIdx] || NGFS_PHASE4[0];

  const tVarData = HOLDINGS.map(h => ({
    name: h.name.split(' ')[0],
    fullName: h.name,
    tvar: +computeTVaR(h, scenario).toFixed(3),
  }));

  const totalTVar = tVarData.reduce((a, b) => a + b.tvar, 0);
  const totalPVar = HOLDINGS.reduce((a, h) => a + computePhysVaR(h, ngfs.sspEquiv || 'SSP2-4.5'), 0);
  const portfolioVaR = (totalTVar + totalPVar * 0.7).toFixed(2);
  const es = (parseFloat(portfolioVaR) * 1.28 * (1 + ngfs.physicalRisk / 10 * 0.15)).toFixed(2);

  const NGFS_LABELS = ['NZ 2050', 'Below 2°C', 'Delayed', 'Divergent', 'NDC', 'Curr. Policies'];
  const NGFS_COLORS = [T.green, T.green, T.amber, T.amber, T.red, T.red];

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <StatCard label="Portfolio Climate VaR (99%)" value={`$${portfolioVaR}bn`} sub="Combined T+P risk" color={T.gold} />
        <StatCard label="Expected Shortfall (97.5%)" value={`$${es}bn`} sub="EBA climate stress test" color={T.red} />
        <StatCard label="Transition VaR" value={`$${totalTVar.toFixed(2)}bn`} sub={`Scenario: ${ngfs.name}`} color={T.amber} />
        <StatCard label="Physical VaR" value={`$${totalPVar.toFixed(2)}bn`} sub={`SSP: ${ngfs.sspEquiv}`} color={T.teal} />
      </div>

      <SectionTitle>NGFS Phase IV Scenario Selector</SectionTitle>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {NGFS_IDS.map((id, i) => (
          <button key={id} onClick={() => setScenario(id)}
            style={{ background: scenario === id ? NGFS_COLORS[i] : T.surface, color: scenario === id ? '#fff' : T.textSec, border: `1px solid ${NGFS_COLORS[i]}`, borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontFamily: T.font }}>
            {NGFS_LABELS[i]}
          </button>
        ))}
      </div>

      <SectionTitle>{`Transition VaR Contribution — ${ngfs.name}`}</SectionTitle>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={tVarData} margin={{ top: 5, right: 20, left: 0, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 10 }} angle={-35} textAnchor="end" />
          <YAxis tick={{ fill: T.textSec, fontSize: 10 }} tickFormatter={v => `$${v.toFixed(1)}bn`} />
          <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
            formatter={(v, n, p) => [`$${v.toFixed(3)}bn`, p.payload.fullName]} />
          <Bar dataKey="tvar" name="T-VaR ($bn)">
            {tVarData.map((d, i) => (
              <Cell key={i} fill={d.tvar > 0.5 ? T.red : d.tvar > 0.2 ? T.amber : T.green} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <SectionTitle>Risk Correlation Summary</SectionTitle>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
        <StatCard label="T-VaR / P-VaR Correlation" value="0.42" sub="Moderate positive" color={T.teal} />
        <StatCard label="Diversification Benefit" value="12.4%" sub="Imperfect correlation" color={T.green} />
        <StatCard label="Concentration (Top 3)" value={`${((tVarData.slice().sort((a, b) => b.tvar - a.tvar).slice(0, 3).reduce((s, d) => s + d.tvar, 0) / Math.max(totalTVar, 0.001)) * 100).toFixed(1)}%`} sub="Of total T-VaR" color={T.amber} />
      </div>
    </div>
  );
}

/* ── Tab 2 — Expected Shortfall ── */
function Tab2({ scenario }) {
  const scIdx = NGFS_IDS.indexOf(scenario);

  const esData = NGFS_PHASE4.map((sc, i) => {
    const sid = NGFS_IDS[i];
    const totalTVar = HOLDINGS.reduce((a, h) => a + computeTVaR(h, sid), 0);
    const totalPVar = HOLDINGS.reduce((a, h) => a + computePhysVaR(h, sc.sspEquiv || 'SSP2-4.5'), 0);
    const varVal = +(totalTVar + totalPVar * 0.7).toFixed(3);
    const esVal = +(varVal * 1.28 * (1 + sc.physicalRisk / 10 * 0.15)).toFixed(3);
    return {
      name: sc.name.replace('Nationally Determined', 'NDC').replace('Divergent Net Zero', 'Div. NZ'),
      var: varVal,
      es: esVal,
    };
  });

  const selNgfs = NGFS_PHASE4[scIdx] || NGFS_PHASE4[0];
  const selEs = esData[scIdx] || esData[0];
  const decomp = [
    { label: 'Transition Loss',  pct: 52, val: +(selEs.es * 0.52).toFixed(2), color: T.red },
    { label: 'Physical Damage',  pct: 31, val: +(selEs.es * 0.31).toFixed(2), color: T.amber },
    { label: 'Contagion Spread', pct: 17, val: +(selEs.es * 0.17).toFixed(2), color: T.teal },
  ];

  const trendData = Array.from({ length: 24 }, (_, i) => ({
    month: `M${i + 1}`,
    es: +(selEs.es * (0.8 + sr(i * 7 + scIdx) * 0.4)).toFixed(3),
  }));

  return (
    <div>
      <div style={{ background: T.navy, border: `1px solid ${T.teal}`, borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: T.textSec, fontSize: 13 }}>
        <span style={{ color: T.teal, fontWeight: 700 }}>Expected Shortfall at 97.5%</span> = Average loss in the worst 2.5% of scenarios — required by EBA climate stress tests. ES is always greater than VaR and captures tail risk more accurately.
      </div>

      <SectionTitle>VaR vs ES — All NGFS Phase IV Scenarios</SectionTitle>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={esData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
          <YAxis tick={{ fill: T.textSec, fontSize: 10 }} tickFormatter={v => `$${v.toFixed(1)}bn`} />
          <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} formatter={v => `$${v.toFixed(3)}bn`} />
          <Legend wrapperStyle={{ color: T.textSec, fontSize: 11 }} />
          <Bar dataKey="var" name="VaR (99%)" fill={T.teal} />
          <Bar dataKey="es" name="ES (97.5%)" fill={T.red} />
        </BarChart>
      </ResponsiveContainer>

      <SectionTitle>{`ES Decomposition — ${selNgfs.name}`}</SectionTitle>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        {decomp.map(d => (
          <div key={d.label} style={{ background: T.surface, border: `1px solid ${d.color}`, borderRadius: 8, padding: '12px 18px', flex: 1, minWidth: 140 }}>
            <div style={{ color: T.textSec, fontSize: 11 }}>{d.label}</div>
            <div style={{ color: d.color, fontSize: 18, fontWeight: 700 }}>${d.val}bn</div>
            <div style={{ color: T.textMut, fontSize: 11 }}>{d.pct}% of total ES</div>
          </div>
        ))}
      </div>

      <SectionTitle>24-Month ES Trend (Selected Scenario)</SectionTitle>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="month" tick={{ fill: T.textSec, fontSize: 9 }} interval={3} />
          <YAxis tick={{ fill: T.textSec, fontSize: 10 }} tickFormatter={v => `$${v.toFixed(1)}bn`} />
          <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} formatter={v => `$${v.toFixed(3)}bn`} />
          <Area type="monotone" dataKey="es" stroke={T.red} fill={T.red} fillOpacity={0.15} name="ES ($bn)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Tab 3 — Scope 3 Emissions ── */
function Tab3() {
  const rows = HOLDINGS.map((h, i) => {
    const waci = +((h.scope1 + h.scope2) / h.revenue * 1000).toFixed(1);
    const s3int = +(h.scope3 / h.revenue * 1000).toFixed(1);
    const pcaf = String(3 + Math.round(sr(i * 3) * 1));
    return { ...h, waci, s3int, pcaf, attrFactor: h.weight };
  });

  const portfolioWACI = +(rows.reduce((a, r) => a + r.waci * r.weight, 0)).toFixed(1);
  const totalS3 = +(rows.reduce((a, r) => a + r.scope3 * r.weight, 0)).toFixed(1);

  const s3ChartData = rows.map(r => ({ name: r.name.split(' ')[0], s3: +(r.scope3 * r.weight).toFixed(2) }));

  const top5 = rows.slice().sort((a, b) => (b.scope1 + b.scope2) - (a.scope1 + a.scope2)).slice(0, 5);
  const stackData = top5.map(r => ({
    name: r.name.split(' ')[0],
    s12: +(r.scope1 + r.scope2).toFixed(1),
    s3: +r.scope3.toFixed(1),
  }));

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <StatCard label="Total Financed Scope 3" value={`${totalS3} MtCO₂`} sub="Weighted by portfolio share" color={T.red} />
        <StatCard label="Portfolio WACI" value={`${portfolioWACI} tCO₂/$M`} sub="Weighted avg carbon intensity" color={T.amber} />
        <StatCard label="SBTi Coverage" value="33.3%" sub="Holdings with net-zero targets" color={T.green} />
      </div>

      <SectionTitle>Financed Scope 3 Emissions per Holding (MtCO₂ weighted)</SectionTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={s3ChartData} margin={{ top: 5, right: 20, left: 0, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 10 }} angle={-35} textAnchor="end" />
          <YAxis tick={{ fill: T.textSec, fontSize: 10 }} tickFormatter={v => `${v}Mt`} />
          <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} formatter={v => `${v} MtCO₂`} />
          <Bar dataKey="s3" name="Financed S3 (MtCO₂)">
            {s3ChartData.map((d, i) => (
              <Cell key={i} fill={d.s3 > 100 ? T.red : d.s3 > 20 ? T.amber : T.green} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <SectionTitle>Scope 1+2 vs Scope 3 — Top 5 Holdings</SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={stackData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis type="number" tick={{ fill: T.textSec, fontSize: 10 }} tickFormatter={v => `${v}Mt`} />
          <YAxis type="category" dataKey="name" tick={{ fill: T.textSec, fontSize: 11 }} />
          <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} formatter={v => `${v} MtCO₂`} />
          <Legend wrapperStyle={{ color: T.textSec, fontSize: 11 }} />
          <Bar dataKey="s12" name="Scope 1+2" fill={T.teal} stackId="a" />
          <Bar dataKey="s3" name="Scope 3" fill={T.amber} stackId="a" />
        </BarChart>
      </ResponsiveContainer>

      <SectionTitle>Holdings Detail — Scope 3 & PCAF</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, color: T.textSec }}>
          <thead>
            <tr style={{ background: T.navy }}>
              {['Company', 'S1+S2 (Mt)', 'S3 (Mt)', 'WACI', 'S3 Int.', 'PCAF DQ', 'Attr %'].map(h => (
                <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 ? T.surface : 'transparent' }}>
                <td style={{ padding: '5px 10px', color: T.text }}>{r.name}</td>
                <td style={{ padding: '5px 10px' }}>{(r.scope1 + r.scope2).toFixed(1)}</td>
                <td style={{ padding: '5px 10px', color: r.scope3 > 100 ? T.red : r.scope3 > 20 ? T.amber : T.green }}>{r.scope3.toFixed(1)}</td>
                <td style={{ padding: '5px 10px' }}>{r.waci}</td>
                <td style={{ padding: '5px 10px' }}>{r.s3int}</td>
                <td style={{ padding: '5px 10px', color: T.amber }}>{r.pcaf}</td>
                <td style={{ padding: '5px 10px' }}>{(r.attrFactor * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Tab 4 — NGFS Comparison ── */
function Tab4() {
  const scenarioTotals = NGFS_IDS.map((sid, si) => {
    const total = HOLDINGS.reduce((a, h) => a + computeTVaR(h, sid) * 1000, 0);
    return {
      name: NGFS_PHASE4[si].name.replace('Nationally Determined', 'NDC').replace('Divergent Net Zero', 'Div.NZ'),
      total: +total.toFixed(0),
      sid,
    };
  });

  const heatData = HOLDINGS.map(h => {
    const row = { name: h.name.split(' ')[0] };
    NGFS_IDS.forEach((sid, si) => { row[sid] = +(computeTVaR(h, sid) * 1000).toFixed(0); });
    return row;
  });

  const variances = HOLDINGS.map(h => {
    const vals = NGFS_IDS.map(sid => computeTVaR(h, sid) * 1000);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, v) => a + (v - mean) ** 2, 0) / vals.length;
    return { name: h.name, std: Math.sqrt(variance) };
  }).sort((a, b) => b.std - a.std).slice(0, 3);

  const heatColor = v => v > 500 ? T.red : v > 200 ? T.amber : v < 0 ? T.teal : T.green;
  const NGFS_SHORT = ['NZ2050', 'B2°C', 'DT', 'DNZ', 'NDC', 'CurPol'];

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <StatCard label="Best Case (Below 2°C)" value={`$${(scenarioTotals[1].total / 1000).toFixed(2)}bn`} sub="Lowest portfolio loss" color={T.green} />
        <StatCard label="Worst Case (Curr. Policies)" value={`$${(scenarioTotals[5].total / 1000).toFixed(2)}bn`} sub="Highest portfolio loss" color={T.red} />
        <StatCard label="Scenario Spread" value={`$${((scenarioTotals[5].total - scenarioTotals[1].total) / 1000).toFixed(2)}bn`} sub="Best to worst range" color={T.amber} />
      </div>

      <SectionTitle>Total Portfolio Loss per NGFS Scenario ($M)</SectionTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={scenarioTotals} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
          <YAxis tick={{ fill: T.textSec, fontSize: 10 }} tickFormatter={v => `$${v}M`} />
          <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} formatter={v => `$${v.toLocaleString()}M`} />
          <Bar dataKey="total" name="Portfolio Loss ($M)">
            {scenarioTotals.map((d, i) => (
              <Cell key={i} fill={d.total > 3000 ? T.red : d.total > 1000 ? T.amber : T.teal} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <SectionTitle>Scenario Sensitivity — Most Exposed Holdings</SectionTitle>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        {variances.map((v, i) => (
          <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', flex: 1, minWidth: 150 }}>
            <div style={{ color: T.textSec, fontSize: 11 }}>#{i + 1} Most Sensitive</div>
            <div style={{ color: T.text, fontWeight: 600, fontSize: 13 }}>{v.name}</div>
            <div style={{ color: T.red, fontSize: 12 }}>σ = ${v.std.toFixed(0)}M</div>
          </div>
        ))}
      </div>

      <SectionTitle>Heatmap: Portfolio-Weighted Loss ($M) per Scenario</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
          <thead>
            <tr style={{ background: T.navy }}>
              <th style={{ padding: '6px 8px', textAlign: 'left', color: T.textSec }}>Holding</th>
              {NGFS_SHORT.map(s => <th key={s} style={{ padding: '6px 8px', color: T.textSec }}>{s}</th>)}
            </tr>
          </thead>
          <tbody>
            {heatData.map((row, i) => (
              <tr key={i} style={{ background: i % 2 ? T.surface : 'transparent' }}>
                <td style={{ padding: '5px 8px', color: T.text, fontSize: 11 }}>{row.name}</td>
                {NGFS_IDS.map(sid => (
                  <td key={sid} style={{ padding: '5px 8px', textAlign: 'center', color: heatColor(row[sid]), fontWeight: 600 }}>
                    {row[sid]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Tab 5 — Physical VaR ── */
function Tab5() {
  const [ssp, setSsp] = useState('SSP2-4.5');
  const SSPS = ['SSP1-2.6', 'SSP2-4.5', 'SSP3-7.0', 'SSP5-8.5'];

  const physData = HOLDINGS.map(h => ({
    name: h.name.split(' ')[0],
    fullName: h.name,
    pvar: +computePhysVaR(h, ssp).toFixed(3),
    tvar: +(computeTVaR(h, 'cp') * 0.5).toFixed(3),
  }));

  const countries = [...new Set(HOLDINGS.map(h => COUNTRY_NAMES[h.country]))];
  const countryRisks = countries.map(c => {
    const r = getCountryPhysicalRisk(c, ssp);
    if (!r) return { country: c, composite: 0, topHazard: 'N/A', adaptation: 'N/A' };
    const hazards = { flood: r.flood, cyclone: r.cyclone, heatwave: r.heatwave, drought: r.drought, sealevel: r.sealevel };
    const topHazard = Object.entries(hazards).sort((a, b) => b[1] - a[1])[0][0];
    return { country: c, composite: r.composite, topHazard, adaptation: r.ndgain ? r.ndgain.toFixed(1) : 'N/A' };
  });

  return (
    <div>
      <SectionTitle>SSP Scenario Selector</SectionTitle>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {SSPS.map(s => (
          <button key={s} onClick={() => setSsp(s)}
            style={{ background: ssp === s ? T.teal : T.surface, color: ssp === s ? '#fff' : T.textSec, border: `1px solid ${T.teal}`, borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontFamily: T.font }}>
            {s}
          </button>
        ))}
      </div>

      <SectionTitle>{`Physical VaR per Holding — ${ssp}`}</SectionTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={physData} margin={{ top: 5, right: 20, left: 0, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 10 }} angle={-35} textAnchor="end" />
          <YAxis tick={{ fill: T.textSec, fontSize: 10 }} tickFormatter={v => `$${v.toFixed(2)}bn`} />
          <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
            formatter={(v, n, p) => [`$${v.toFixed(3)}bn`, p.payload.fullName]} />
          <Bar dataKey="pvar" name="Physical VaR ($bn)">
            {physData.map((d, i) => (
              <Cell key={i} fill={barColor(d.pvar, 0.3, 0.15)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <SectionTitle>Combined Transition + Physical VaR per Holding</SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={physData} margin={{ top: 5, right: 20, left: 0, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 10 }} angle={-35} textAnchor="end" />
          <YAxis tick={{ fill: T.textSec, fontSize: 10 }} tickFormatter={v => `$${v.toFixed(2)}bn`} />
          <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} formatter={v => `$${v.toFixed(3)}bn`} />
          <Legend wrapperStyle={{ color: T.textSec, fontSize: 11 }} />
          <Bar dataKey="tvar" name="Transition VaR" fill={T.amber} stackId="a" />
          <Bar dataKey="pvar" name="Physical VaR" fill={T.teal} stackId="a" />
        </BarChart>
      </ResponsiveContainer>

      <SectionTitle>Country Physical Risk Profile</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, color: T.textSec }}>
          <thead>
            <tr style={{ background: T.navy }}>
              {['Country', 'Composite Score', 'Top Hazard', 'ND-GAIN (Adaptation)'].map(h => (
                <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {countryRisks.map((r, i) => (
              <tr key={r.country} style={{ background: i % 2 ? T.surface : 'transparent' }}>
                <td style={{ padding: '5px 10px', color: T.text }}>{r.country}</td>
                <td style={{ padding: '5px 10px', color: r.composite > 7 ? T.red : r.composite > 5 ? T.amber : T.green, fontWeight: 700 }}>{r.composite}/10</td>
                <td style={{ padding: '5px 10px', textTransform: 'capitalize' }}>{r.topHazard}</td>
                <td style={{ padding: '5px 10px' }}>{r.adaptation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Tab 6 — Horizon & Confidence ── */
function Tab6({ scenario }) {
  const scIdx = NGFS_IDS.indexOf(scenario);
  const baseVaR = 4.82;
  const HORIZONS = [1, 3, 5, 10, 20, 30];
  const CONF_LEVELS = [
    { label: '90%',   z: 1.28  },
    { label: '95%',   z: 1.645 },
    { label: '99%',   z: 2.326 },
    { label: '99.5%', z: 2.576 },
    { label: '99.9%', z: 3.090 },
  ];
  const SCENARIO_MULT = { nz2050: 0.65, b2c: 0.80, dt: 1.10, dnz: 1.20, ndc: 1.55, cp: 1.90 };

  const horizonData = HORIZONS.map(h => ({
    horizon: `${h}yr`,
    nz2050: +(baseVaR * Math.sqrt(h) * SCENARIO_MULT.nz2050).toFixed(2),
    dt:     +(baseVaR * Math.sqrt(h) * SCENARIO_MULT.dt).toFixed(2),
    cp:     +(baseVaR * Math.sqrt(h) * SCENARIO_MULT.cp).toFixed(2),
  }));

  const confData = CONF_LEVELS.map(cl => {
    const row = { conf: cl.label };
    NGFS_IDS.forEach(sid => {
      row[sid] = +(baseVaR * cl.z / 2.326 * SCENARIO_MULT[sid]).toFixed(2);
    });
    return row;
  });

  const NGFS_SHORT_FULL = ['NZ2050', 'Below 2°C', 'Del. Trans.', 'Div. NZ', 'NDC', 'Curr. Pol.'];

  return (
    <div>
      <SectionTitle>VaR Growth Over Time Horizon — 3 Scenarios</SectionTitle>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={horizonData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="horizon" tick={{ fill: T.textSec, fontSize: 11 }} />
          <YAxis tick={{ fill: T.textSec, fontSize: 10 }} tickFormatter={v => `$${v}bn`} />
          <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} formatter={v => `$${v}bn`} />
          <Legend wrapperStyle={{ color: T.textSec, fontSize: 11 }} />
          <Line type="monotone" dataKey="nz2050" stroke={T.green} dot={false} strokeWidth={2} name="NZ 2050" />
          <Line type="monotone" dataKey="dt"     stroke={T.amber} dot={false} strokeWidth={2} name="Delayed Transition" />
          <Line type="monotone" dataKey="cp"     stroke={T.red}   dot={false} strokeWidth={2} name="Current Policies" />
        </LineChart>
      </ResponsiveContainer>

      <SectionTitle>Confidence Level Sensitivity — All Scenarios ($bn)</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, color: T.textSec }}>
          <thead>
            <tr style={{ background: T.navy }}>
              <th style={{ padding: '6px 10px', textAlign: 'left', color: T.textSec }}>Confidence</th>
              {NGFS_SHORT_FULL.map(s => (
                <th key={s} style={{ padding: '6px 10px', color: T.textSec, textAlign: 'center', fontSize: 10 }}>{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {confData.map((row, i) => (
              <tr key={row.conf} style={{ background: i % 2 ? T.surface : 'transparent' }}>
                <td style={{ padding: '5px 10px', color: T.gold, fontWeight: 700 }}>{row.conf}</td>
                {NGFS_IDS.map(sid => (
                  <td key={sid} style={{ padding: '5px 10px', textAlign: 'center', color: row[sid] > 8 ? T.red : row[sid] > 5 ? T.amber : T.textSec }}>
                    ${row[sid]}bn
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: T.navy, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 16px', marginTop: 20 }}>
        <div style={{ color: T.textSec, fontSize: 12, lineHeight: 1.8 }}>
          Cross-module analysis — See:{' '}
          <span style={{ color: T.teal }}>Stress Test Orchestrator</span>{' '}
          <code style={{ color: T.gold, background: '#f6f4f0', padding: '1px 5px', borderRadius: 3 }}>/stress-test-orchestrator</code>
          {' | '}
          <span style={{ color: T.teal }}>Copula Tail Risk</span>{' '}
          <code style={{ color: T.gold, background: '#f6f4f0', padding: '1px 5px', borderRadius: 3 }}>/copula-tail-risk</code>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function PortfolioClimateVaRPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [scenario, setScenario] = useState('cp');

  const renderTab = () => {
    switch (activeTab) {
      case 0: return <Tab1 scenario={scenario} setScenario={setScenario} />;
      case 1: return <Tab2 scenario={scenario} />;
      case 2: return <Tab3 />;
      case 3: return <Tab4 />;
      case 4: return <Tab5 />;
      case 5: return <Tab6 scenario={scenario} />;
      default: return null;
    }
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '24px 28px', fontFamily: T.font, color: T.text }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text }}>Portfolio Climate VaR</h1>
        <div style={{ color: T.textSec, fontSize: 13, marginTop: 4 }}>
          NGFS Phase IV · Expected Shortfall (CVaR) · Scope 3 Channel · 12 Holdings
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 24, borderBottom: `1px solid ${T.border}` }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            style={{
              background: activeTab === i ? ACCENT : 'transparent',
              color: activeTab === i ? '#fff' : T.textSec,
              border: 'none',
              borderBottom: activeTab === i ? `2px solid ${ACCENT}` : '2px solid transparent',
              padding: '8px 14px',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: activeTab === i ? 700 : 400,
              fontFamily: T.font,
              borderRadius: '4px 4px 0 0',
            }}>
            {t}
          </button>
        ))}
      </div>

      <div>{renderTab()}</div>
    </div>
  );
}
