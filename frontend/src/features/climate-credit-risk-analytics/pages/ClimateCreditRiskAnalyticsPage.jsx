import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, LineChart, Line, ScatterChart, Scatter,
  ReferenceLine,
} from 'recharts';

const T = {
  bg:'#0b0e13', surface:'#111722', surfaceH:'#182030',
  border:'#1e2d40', borderL:'#162235',
  navy:'#06c896', navyL:'#08e5b0',
  gold:'#06c896', goldL:'#08e5b0',
  sage:'#0ea5e9', sageL:'#38bdf8',
  text:'#dde6f4', textSec:'#7a90ac', textMut:'#3a4e64',
  red:'#f04060', green:'#06c896', amber:'#f0a828',
  card:'0 1px 3px rgba(0,0,0,0.5)',
  cardH:'0 4px 16px rgba(0,0,0,0.7)',
  font:"'Inter','SF Pro Text',system-ui,-apple-system,sans-serif",
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ─── Seed loan portfolio (20 loans) ─────────────────────────────────────────
const SECTORS = [
  { name: 'Coal Mining',        trMultOrd: 1.6,  trMultDis: 2.1,  trMultHot: 1.3  },
  { name: 'Oil & Gas',          trMultOrd: 1.3,  trMultDis: 1.65, trMultHot: 1.15 },
  { name: 'Utilities (Fossil)', trMultOrd: 1.25, trMultDis: 1.5,  trMultHot: 1.1  },
  { name: 'Auto (ICE)',         trMultOrd: 1.2,  trMultDis: 1.35, trMultHot: 1.05 },
  { name: 'Cement / Steel',     trMultOrd: 1.2,  trMultDis: 1.4,  trMultHot: 1.1  },
  { name: 'Real Estate',        trMultOrd: 1.15, trMultDis: 1.25, trMultHot: 1.05 },
  { name: 'Technology',         trMultOrd: 0.98, trMultDis: 1.0,  trMultHot: 1.0  },
  { name: 'Renewables',         trMultOrd: 0.9,  trMultDis: 0.92, trMultHot: 0.88 },
];

const PHYSICAL_RISK_TYPES = ['None', 'Flood Zone', 'Coastal Property', 'Heat Stress'];
const PHYSICAL_LGD_ADDON  = { 'None': 0.0, 'Flood Zone': 0.115, 'Coastal Property': 0.09, 'Heat Stress': 0.075 };

const GEOGRAPHIES = ['UK', 'Germany', 'Spain', 'Netherlands', 'France', 'Italy'];
const RISK_TIERS  = ['Low', 'Medium', 'High', 'Critical'];

const RAW_LOANS = Array.from({ length: 20 }, (_, i) => {
  const seed = i * 7 + 3;
  const sectorIdx = Math.floor(sr(seed)      * SECTORS.length);
  const geoIdx    = Math.floor(sr(seed + 1)  * GEOGRAPHIES.length);
  const prIdx     = Math.floor(sr(seed + 2)  * PHYSICAL_RISK_TYPES.length);
  const tierIdx   = Math.floor(sr(seed + 3)  * RISK_TIERS.length);
  const basePD    = parseFloat((0.005 + sr(seed + 4) * 0.12).toFixed(4));
  const baseLGD   = parseFloat((0.25  + sr(seed + 5) * 0.35).toFixed(4));
  const ead       = parseFloat((10    + sr(seed + 6) * 190).toFixed(1));
  const sector    = SECTORS[sectorIdx];
  const physType  = PHYSICAL_RISK_TYPES[prIdx];
  const lgdAddon  = PHYSICAL_LGD_ADDON[physType];

  return {
    id:       `L${String(i + 1).padStart(2, '0')}`,
    name:     `Counterparty ${String.fromCharCode(65 + i)}`,
    sector:   sector.name,
    geo:      GEOGRAPHIES[geoIdx],
    physRisk: physType,
    tier:     RISK_TIERS[tierIdx],
    basePD,
    baseLGD,
    ead,
    trMultOrd: sector.trMultOrd,
    trMultDis: sector.trMultDis,
    trMultHot: sector.trMultHot,
    lgdAddon,
  };
});

function computeAdjusted(loans, scenario) {
  return loans.map(l => {
    const mult = scenario === 'Orderly' ? l.trMultOrd
      : scenario === 'Disorderly'       ? l.trMultDis
      :                                   l.trMultHot;
    const adjPD  = Math.min(l.basePD * mult, 1);
    const adjLGD = Math.min(l.baseLGD + l.lgdAddon, 1);
    const baseECL = l.basePD  * l.baseLGD  * l.ead;
    const adjECL  = adjPD     * adjLGD     * l.ead;
    const pdUplift = (adjPD - l.basePD) / l.basePD;
    // IFRS 9 staging: base stage + climate migration
    const baseStage = l.basePD < 0.01 ? 1 : l.basePD < 0.05 ? 2 : 3;
    const climateStage = adjPD < 0.01 ? 1 : adjPD < 0.05 ? 2 : 3;
    return { ...l, mult, adjPD, adjLGD, baseECL, adjECL, pdUplift, baseStage, climateStage };
  });
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
      padding: '16px 20px', boxShadow: T.card, flex: '1 1 160px', minWidth: 140,
    }}>
      <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Section heading ─────────────────────────────────────────────────────────
function SectionHead({ title, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Data Notice ─────────────────────────────────────────────────────────────
function DataNotice() {
  return (
    <div style={{
      background: '#fef3c7', border: '1px solid #d97706', borderRadius: 6,
      padding: '8px 14px', marginBottom: 16, fontSize: 12, color: '#92400e',
    }}>
      <strong>Data Notice:</strong> Climate risk multipliers derived from ECB Climate Stress Test 2022 methodology and EBA Environmental DD Guidelines 2024. Loan portfolio data is illustrative. PD overlays do not represent actual bank credit models.
    </div>
  );
}

// ─── Tab 1: Credit Risk Dashboard ────────────────────────────────────────────
function Tab1Dashboard({ loans }) {
  const baseECLTotal = loans.reduce((s, l) => s + l.baseECL, 0);
  const adjECLTotal  = loans.reduce((s, l) => s + l.adjECL, 0);
  const upliftPct    = ((adjECLTotal - baseECLTotal) / baseECLTotal) * 100;
  const materialCount = loans.filter(l => l.pdUplift > 0.1).length;

  // ECL by sector
  const sectorMap = {};
  loans.forEach(l => {
    if (!sectorMap[l.sector]) sectorMap[l.sector] = { sector: l.sector, baseECL: 0, adjECL: 0 };
    sectorMap[l.sector].baseECL += l.baseECL;
    sectorMap[l.sector].adjECL  += l.adjECL;
  });
  const sectorData = Object.values(sectorMap).sort((a, b) => b.adjECL - a.adjECL);

  // PD uplift heatmap data (sector x scenario approximation)
  const heatScenarios = ['Orderly', 'Disorderly', 'Hot House'];
  const heatSectors   = SECTORS.map(s => s.name);
  const heatData = heatSectors.map(sec => {
    const row = { sector: sec.length > 14 ? sec.slice(0, 13) + '…' : sec };
    heatScenarios.forEach(sc => {
      const mult = sc === 'Orderly' ? SECTORS.find(s => s.name === sec).trMultOrd
        : sc === 'Disorderly' ? SECTORS.find(s => s.name === sec).trMultDis
        : SECTORS.find(s => s.name === sec).trMultHot;
      row[sc] = parseFloat(((mult - 1) * 100).toFixed(1));
    });
    return row;
  });

  const heatColor = v => {
    if (v <= -5) return '#16a34a';
    if (v < 0)   return '#86efac';
    if (v < 10)  return '#fef9c3';
    if (v < 30)  return '#fde68a';
    if (v < 60)  return '#f97316';
    return '#dc2626';
  };

  return (
    <div>
      <DataNotice />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <KpiCard label="Base ECL (12-month)" value={`$${baseECLTotal.toFixed(1)}M`} sub="Pre-climate overlay" />
        <KpiCard label="Climate-Adj. ECL" value={`$${adjECLTotal.toFixed(1)}M`} sub="Post-overlay IFRS 9" color={T.red} />
        <KpiCard label="ECL Uplift" value={`+${(adjECLTotal - baseECLTotal).toFixed(1)}M`} sub={`+${upliftPct.toFixed(1)}% vs base`} color={T.amber} />
        <KpiCard label="Material PD Uplift" value={`${materialCount}/20`} sub=">10% PD increase" color={T.navyL} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* ECL by Sector */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, boxShadow: T.card }}>
          <SectionHead title="ECL by Sector — Base vs. Climate-Adjusted" sub="Expected Credit Loss ($M)" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sectorData} margin={{ top: 4, right: 8, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="sector" tick={{ fontSize: 9, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip formatter={v => [`$${v.toFixed(2)}M`]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="baseECL" name="Base ECL" fill={T.navyL} radius={[3, 3, 0, 0]}>
                {sectorData.map((_, i) => <Cell key={i} fill={T.navyL} />)}
              </Bar>
              <Bar dataKey="adjECL" name="Climate-Adj ECL" fill={T.red} radius={[3, 3, 0, 0]}>
                {sectorData.map((_, i) => <Cell key={i} fill={T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PD Uplift heatmap */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, boxShadow: T.card }}>
          <SectionHead title="PD Uplift Heatmap (% over Base)" sub="Sector x Scenario — ECB CST 2022 multipliers" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: T.textSec, fontWeight: 600 }}>Sector</th>
                {heatScenarios.map(sc => (
                  <th key={sc} style={{ textAlign: 'center', padding: '4px 6px', color: T.textSec, fontWeight: 600 }}>{sc}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatData.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : T.surface }}>
                  <td style={{ padding: '5px 6px', color: T.text, fontWeight: 500 }}>{row.sector}</td>
                  {heatScenarios.map(sc => (
                    <td key={sc} style={{
                      padding: '5px 6px', textAlign: 'center', fontWeight: 600,
                      background: heatColor(row[sc]), color: Math.abs(row[sc]) > 20 ? '#fff' : T.text,
                      borderRadius: 4,
                    }}>
                      {row[sc] >= 0 ? '+' : ''}{row[sc]}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 10, color: T.textMut }}>
            {[['#16a34a', 'Reduction'], ['#fef9c3', '0–10%'], ['#fde68a', '10–30%'], ['#f97316', '30–60%'], ['#dc2626', '>60%']].map(([c, l]) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, background: c, borderRadius: 2, display: 'inline-block' }} />
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2: PD Overlay Model ──────────────────────────────────────────────────
function Tab2PD({ loans, scenario, setScenario }) {
  const sorted = [...loans].sort((a, b) => b.pdUplift - a.pdUplift).slice(0, 12);

  const chartData = sorted.map(l => ({
    name: l.id,
    basePD: parseFloat((l.basePD * 100).toFixed(3)),
    adjPD: parseFloat((l.adjPD * 100).toFixed(3)),
  }));

  const scenarioColors = { Orderly: T.sage, Disorderly: T.amber, 'Hot House': T.red };

  return (
    <div>
      <DataNotice />
      {/* Formula box */}
      <div style={{
        background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8,
        padding: '10px 16px', marginBottom: 16, fontSize: 12, color: T.navy,
      }}>
        <strong>IFRS 9 Climate PD Overlay Formula (BIS/ECB methodology):</strong><br />
        <code style={{ fontFamily: 'monospace', fontSize: 13 }}>
          PD_adj = PD_base &times; TR_mult(scenario) &times; (1 + PR_addon)
        </code>
        <br />
        <span style={{ color: T.textSec }}>
          TR_mult = Transition Risk Multiplier (ECB CST 2022) &nbsp;|&nbsp;
          PR_addon = Physical Risk PD add-on (BIS WP #627)
        </span>
      </div>

      {/* Scenario selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['Orderly', 'Disorderly', 'Hot House'].map(sc => (
          <button key={sc} onClick={() => setScenario(sc)} style={{
            padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.border}`,
            background: scenario === sc ? T.navy : T.surface,
            color: scenario === sc ? '#fff' : T.text,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>{sc}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Chart */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, boxShadow: T.card }}>
          <SectionHead title={`Base vs. Adjusted PD — ${scenario} Scenario`} sub="Top 12 loans by PD uplift (%)" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip formatter={v => [`${v.toFixed(3)}%`]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="basePD" name="Base PD" fill={T.navyL} radius={[3, 3, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={T.navyL} />)}
              </Bar>
              <Bar dataKey="adjPD" name={`Adj PD (${scenario})`} fill={scenarioColors[scenario]} radius={[3, 3, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={scenarioColors[scenario]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sector multiplier reference */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, boxShadow: T.card }}>
          <SectionHead title="ECB CST 2022 — Transition Risk Multipliers" sub={`Active scenario: ${scenario}`} />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: T.textSec }}>Sector</th>
                <th style={{ textAlign: 'center', padding: '4px 6px', color: T.textSec }}>Orderly</th>
                <th style={{ textAlign: 'center', padding: '4px 6px', color: T.textSec }}>Disorderly</th>
                <th style={{ textAlign: 'center', padding: '4px 6px', color: T.textSec }}>Hot House</th>
              </tr>
            </thead>
            <tbody>
              {SECTORS.map((s, i) => {
                const active = scenario === 'Orderly' ? s.trMultOrd : scenario === 'Disorderly' ? s.trMultDis : s.trMultHot;
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : T.surface }}>
                    <td style={{ padding: '5px 6px', color: T.text }}>{s.name}</td>
                    {[s.trMultOrd, s.trMultDis, s.trMultHot].map((v, j) => (
                      <td key={j} style={{
                        padding: '5px 6px', textAlign: 'center', fontWeight: 600,
                        color: v > 1.4 ? T.red : v > 1.1 ? T.amber : v < 1 ? T.green : T.text,
                        background: scenario === ['Orderly', 'Disorderly', 'Hot House'][j] ? '#f0f9ff' : 'transparent',
                      }}>
                        {v.toFixed(2)}&times;
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ fontSize: 10, color: T.textMut, marginTop: 8 }}>
            Source: ECB Climate Stress Test 2022 (public results). Physical risk add-ons per BIS WP #627.
          </div>
        </div>
      </div>

      {/* Full loan table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, boxShadow: T.card }}>
        <SectionHead title="Full Loan Portfolio — PD Overlay Detail" sub={`20 loans | Scenario: ${scenario}`} />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['ID', 'Counterparty', 'Sector', 'Geo', 'Base PD', 'TR Mult', 'Phys Addon', 'Adj PD', 'Uplift', 'Tier'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: T.textSec, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loans.map((l, i) => {
                const upliftPct = (l.pdUplift * 100).toFixed(1);
                const upliftColor = l.pdUplift > 0.5 ? T.red : l.pdUplift > 0.2 ? T.amber : l.pdUplift < 0 ? T.green : T.text;
                return (
                  <tr key={l.id} style={{ background: i % 2 === 0 ? T.surfaceH : T.surface }}>
                    <td style={{ padding: '5px 8px', fontWeight: 700, color: T.navyL }}>{l.id}</td>
                    <td style={{ padding: '5px 8px', color: T.text }}>{l.name}</td>
                    <td style={{ padding: '5px 8px', color: T.textSec }}>{l.sector}</td>
                    <td style={{ padding: '5px 8px', color: T.textSec }}>{l.geo}</td>
                    <td style={{ padding: '5px 8px' }}>{(l.basePD * 100).toFixed(3)}%</td>
                    <td style={{ padding: '5px 8px', fontWeight: 600 }}>{l.mult.toFixed(2)}&times;</td>
                    <td style={{ padding: '5px 8px' }}>{l.physRisk !== 'None' ? `+${(PHYSICAL_LGD_ADDON[l.physRisk] * 100).toFixed(1)}pp` : '—'}</td>
                    <td style={{ padding: '5px 8px', fontWeight: 700 }}>{(l.adjPD * 100).toFixed(3)}%</td>
                    <td style={{ padding: '5px 8px', color: upliftColor, fontWeight: 700 }}>
                      {l.pdUplift >= 0 ? '+' : ''}{upliftPct}%
                    </td>
                    <td style={{ padding: '5px 8px' }}>
                      <span style={{
                        background: l.tier === 'Critical' ? '#fee2e2' : l.tier === 'High' ? '#fef3c7' : l.tier === 'Medium' ? '#dbeafe' : '#f0fdf4',
                        color: l.tier === 'Critical' ? T.red : l.tier === 'High' ? T.amber : l.tier === 'Medium' ? T.navyL : T.green,
                        padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                      }}>{l.tier}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 3: LGD & Collateral ──────────────────────────────────────────────────
function Tab3LGD({ loans }) {
  const lgdImpact = [...loans]
    .map(l => ({ ...l, lgdDelta: l.adjLGD - l.baseLGD, lgdECLImpact: (l.adjLGD - l.baseLGD) * l.adjPD * l.ead }))
    .sort((a, b) => b.lgdDelta - a.lgdDelta)
    .slice(0, 5);

  const collateralTypes = [
    { type: 'Flood Zone Collateral',     addon: '8–15%', basis: 'ECB CST 2022 / NGFS', crremRisk: 'High',     timeline: '2030–2040' },
    { type: 'Coastal Property',          addon: '6–12%', basis: 'BIS WP #627',          crremRisk: 'Very High', timeline: '2025–2035' },
    { type: 'Heat-Stressed Agriculture', addon: '5–10%', basis: 'EBA DD 2024',           crremRisk: 'Medium',    timeline: '2035–2050' },
    { type: 'EPC F/G Rated Buildings',   addon: '4–9%',  basis: 'CRREM Stranding 2023', crremRisk: 'High',     timeline: '2028–2033' },
    { type: 'No Physical Risk',          addon: '0%',    basis: 'Baseline',             crremRisk: 'Low',      timeline: 'N/A' },
  ];

  const crremData = [
    { year: 2024, marketVal: 100, strandedVal: 100 },
    { year: 2027, marketVal: 96,  strandedVal: 91  },
    { year: 2030, marketVal: 91,  strandedVal: 79  },
    { year: 2033, marketVal: 85,  strandedVal: 64  },
    { year: 2036, marketVal: 79,  strandedVal: 51  },
    { year: 2040, marketVal: 70,  strandedVal: 38  },
  ];

  return (
    <div>
      <DataNotice />

      {/* Collateral haircut reference */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, boxShadow: T.card, marginBottom: 20 }}>
        <SectionHead title="Physical Risk LGD Haircut Schedule" sub="EBA Environmental Due Diligence Guidelines 2024 — collateral revaluation" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              {['Collateral Type', 'LGD Haircut', 'Methodology Basis', 'CRREM Stranding Risk', 'Revaluation Timeline'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: T.textSec, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {collateralTypes.map((c, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : T.surface }}>
                <td style={{ padding: '7px 10px', fontWeight: 600, color: T.text }}>{c.type}</td>
                <td style={{ padding: '7px 10px', fontWeight: 700, color: c.addon === '0%' ? T.green : T.red }}>{c.addon}</td>
                <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{c.basis}</td>
                <td style={{ padding: '7px 10px' }}>
                  <span style={{
                    background: c.crremRisk === 'Very High' ? '#fee2e2' : c.crremRisk === 'High' ? '#fef3c7' : c.crremRisk === 'Medium' ? '#dbeafe' : '#f0fdf4',
                    color: c.crremRisk === 'Very High' ? T.red : c.crremRisk === 'High' ? T.amber : c.crremRisk === 'Medium' ? T.navyL : T.green,
                    padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                  }}>{c.crremRisk}</span>
                </td>
                <td style={{ padding: '7px 10px', color: T.textSec }}>{c.timeline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Top 5 LGD impact loans */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, boxShadow: T.card }}>
          <SectionHead title="Top 5 Loans by LGD Climate Impact" sub="Collateral at physical risk — ECL uplift from LGD alone" />
          {lgdImpact.map((l, i) => (
            <div key={l.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: i < 4 ? `1px solid ${T.borderL}` : 'none',
            }}>
              <div>
                <div style={{ fontWeight: 700, color: T.navy, fontSize: 13 }}>{l.name} <span style={{ color: T.textMut, fontWeight: 400 }}>({l.id})</span></div>
                <div style={{ fontSize: 11, color: T.textSec }}>{l.sector} | {l.geo} | {l.physRisk}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>
                  Base LGD: {(l.baseLGD * 100).toFixed(1)}% &rarr; Adj: {(l.adjLGD * 100).toFixed(1)}%
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: T.red, fontSize: 14 }}>+{(l.lgdDelta * 100).toFixed(1)}pp</div>
                <div style={{ fontSize: 10, color: T.textMut }}>LGD haircut</div>
                <div style={{ fontSize: 11, color: T.amber, marginTop: 2 }}>+${l.lgdECLImpact.toFixed(2)}M ECL</div>
              </div>
            </div>
          ))}
        </div>

        {/* CRREM stranding chart */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, boxShadow: T.card }}>
          <SectionHead title="CRREM Stranding Risk — RE Collateral Value" sub="Indexed to 100 at 2024 | Orderly transition" />
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={crremData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis domain={[30, 110]} tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip formatter={v => [v.toFixed(1)]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="marketVal" name="Market Value (Index)" stroke={T.navyL} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="strandedVal" name="At-Risk Stranded Value" stroke={T.red} strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} />
              <ReferenceLine y={70} stroke={T.amber} strokeDasharray="4 2" label={{ value: 'Recovery floor', fontSize: 9, fill: T.amber }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 10, color: T.textMut, marginTop: 6 }}>
            Source: CRREM 2023 stranding curves adapted for European commercial/residential RE portfolios.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 4: IFRS 9 Climate Overlay ───────────────────────────────────────────
function Tab4IFRS9({ loans }) {
  const baseStage1 = loans.filter(l => l.baseStage === 1);
  const baseStage2 = loans.filter(l => l.baseStage === 2);
  const baseStage3 = loans.filter(l => l.baseStage === 3);
  const adjStage1  = loans.filter(l => l.climateStage === 1);
  const adjStage2  = loans.filter(l => l.climateStage === 2);
  const adjStage3  = loans.filter(l => l.climateStage === 3);

  const migrations = loans.filter(l => l.climateStage > l.baseStage);

  const baseECL_S1 = baseStage1.reduce((s, l) => s + l.baseECL, 0);
  const baseECL_S2 = baseStage2.reduce((s, l) => s + l.baseECL, 0);
  const baseECL_S3 = baseStage3.reduce((s, l) => s + l.baseECL, 0);

  const adjECL_S1  = adjStage1.reduce((s, l) => s + l.adjECL, 0);
  const adjECL_S2  = adjStage2.reduce((s, l) => s + l.adjECL, 0);
  const adjECL_S3  = adjStage3.reduce((s, l) => s + l.adjECL, 0);

  const stageData = [
    { stage: 'Stage 1', baseCount: baseStage1.length, adjCount: adjStage1.length, baseECL: baseECL_S1, adjECL: adjECL_S1 },
    { stage: 'Stage 2', baseCount: baseStage2.length, adjCount: adjStage2.length, baseECL: baseECL_S2, adjECL: adjECL_S2 },
    { stage: 'Stage 3', baseCount: baseStage3.length, adjCount: adjStage3.length, baseECL: baseECL_S3, adjECL: adjECL_S3 },
  ];

  const sicrCriteria = [
    { criterion: 'PD doubles relative to origination PD',          trigger: 'Climate-adjusted PD > 2x base PD',       relevant: true  },
    { criterion: 'PD exceeds internal SICR threshold (e.g. 1%)',   trigger: 'Climate uplift pushes PD above 1%',       relevant: true  },
    { criterion: 'Borrower sector faces regulatory carbon price',   trigger: 'Fossil fuel sector + disorderly scenario', relevant: true  },
    { criterion: 'Physical asset impairment >20% of EAD',          trigger: 'Stranding risk on RE collateral',         relevant: true  },
    { criterion: 'Watch-list or covenant breach',                   trigger: 'Climate CAPEX shortfall >40% of plan',    relevant: false },
    { criterion: 'Revenue decline from transition >15%',            trigger: 'Sector demand destruction model',         relevant: false },
  ];

  return (
    <div>
      <DataNotice />
      <div style={{
        background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8,
        padding: '10px 16px', marginBottom: 16, fontSize: 12, color: '#14532d',
      }}>
        <strong>IFRS 9 Para 5.5.9:</strong> An entity shall consider reasonable and supportable forward-looking information including climate-related risks in assessing significant increases in credit risk and measuring expected credit losses.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Stage allocation chart */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, boxShadow: T.card }}>
          <SectionHead title="IFRS 9 Stage Allocation — Pre vs. Post Climate Overlay" sub="Loan count by stage (ECL measurement basis)" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stageData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="stage" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="baseCount" name="Base (no overlay)" fill={T.navyL} radius={[3, 3, 0, 0]}>
                {stageData.map((_, i) => <Cell key={i} fill={T.navyL} />)}
              </Bar>
              <Bar dataKey="adjCount" name="Climate Overlay" fill={T.amber} radius={[3, 3, 0, 0]}>
                {stageData.map((_, i) => <Cell key={i} fill={T.amber} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ECL provision by stage */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, boxShadow: T.card }}>
          <SectionHead title="ECL Provision by Stage ($M)" sub="Impact of climate overlay on IFRS 9 provisions" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Stage', 'Base Loans', 'Adj Loans', 'Base ECL ($M)', 'Adj ECL ($M)', 'Delta'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: T.textSec, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stageData.map((s, i) => {
                const delta = s.adjECL - s.baseECL;
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : T.surface }}>
                    <td style={{ padding: '6px 8px', fontWeight: 700, color: T.navy }}>{s.stage}</td>
                    <td style={{ padding: '6px 8px' }}>{s.baseCount}</td>
                    <td style={{ padding: '6px 8px', fontWeight: 600, color: s.adjCount !== s.baseCount ? T.amber : T.text }}>{s.adjCount}</td>
                    <td style={{ padding: '6px 8px' }}>${s.baseECL.toFixed(2)}M</td>
                    <td style={{ padding: '6px 8px', fontWeight: 600 }}>${s.adjECL.toFixed(2)}M</td>
                    <td style={{ padding: '6px 8px', fontWeight: 700, color: delta > 0 ? T.red : T.green }}>
                      {delta >= 0 ? '+' : ''}${delta.toFixed(2)}M
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 12, padding: '8px 12px', background: '#fef3c7', borderRadius: 6, fontSize: 12 }}>
            <strong style={{ color: T.amber }}>Stage migrations from climate overlay:</strong>{' '}
            <span style={{ color: T.text }}>{migrations.length} loans reclassified to a higher stage (SICR triggered)</span>
          </div>
        </div>
      </div>

      {/* SICR criteria */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, boxShadow: T.card, marginBottom: 20 }}>
        <SectionHead title="SICR Climate Triggers — EBA Guidelines Alignment" sub="Significant Increase in Credit Risk criteria with climate-specific triggers" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              {['SICR Criterion (IFRS 9)', 'Climate Trigger Operationalisation', 'Applied in Model'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: T.textSec, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sicrCriteria.map((c, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : T.surface }}>
                <td style={{ padding: '6px 8px', color: T.text }}>{c.criterion}</td>
                <td style={{ padding: '6px 8px', color: T.textSec, fontSize: 11 }}>{c.trigger}</td>
                <td style={{ padding: '6px 8px' }}>
                  <span style={{
                    background: c.relevant ? '#dcfce7' : '#f3f4f6',
                    color: c.relevant ? T.green : T.textMut,
                    padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                  }}>{c.relevant ? 'Yes' : 'Planned'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Migration detail */}
      {migrations.length > 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, boxShadow: T.card }}>
          <SectionHead title="Stage Migration Detail — Climate-Triggered Reclassifications" sub="Loans where climate overlay drives SICR and stage upgrade" />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Loan', 'Counterparty', 'Sector', 'Base Stage', 'Climate Stage', 'Base PD', 'Adj PD', 'EAD ($M)', 'ECL Delta ($M)'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: T.textSec, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {migrations.map((l, i) => (
                  <tr key={l.id} style={{ background: i % 2 === 0 ? '#fff7ed' : T.surface }}>
                    <td style={{ padding: '5px 8px', fontWeight: 700, color: T.navyL }}>{l.id}</td>
                    <td style={{ padding: '5px 8px' }}>{l.name}</td>
                    <td style={{ padding: '5px 8px', color: T.textSec }}>{l.sector}</td>
                    <td style={{ padding: '5px 8px' }}>
                      <span style={{ background: '#dbeafe', color: T.navyL, padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>S{l.baseStage}</span>
                    </td>
                    <td style={{ padding: '5px 8px' }}>
                      <span style={{ background: '#fee2e2', color: T.red, padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>S{l.climateStage}</span>
                    </td>
                    <td style={{ padding: '5px 8px' }}>{(l.basePD * 100).toFixed(3)}%</td>
                    <td style={{ padding: '5px 8px', fontWeight: 700, color: T.red }}>{(l.adjPD * 100).toFixed(3)}%</td>
                    <td style={{ padding: '5px 8px' }}>${l.ead.toFixed(1)}M</td>
                    <td style={{ padding: '5px 8px', fontWeight: 700, color: T.red }}>+${(l.adjECL - l.baseECL).toFixed(3)}M</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 5: EBA Environmental DD ─────────────────────────────────────────────
function Tab5EBA({ loans }) {
  const top10 = loans.slice(0, 10);

  // Assign pseudo DD status per loan
  const ddStatus = top10.map((l, i) => {
    const complete = sr(i * 3 + 11) > 0.35;
    const physAcute   = l.physRisk !== 'None' ? (sr(i * 3 + 12) > 0.5 ? 'High' : 'Medium') : 'Low';
    const physChronic = sr(i * 3 + 13) > 0.6 ? 'Medium' : 'Low';
    const transPolicy = l.sector.includes('Coal') || l.sector.includes('Oil') ? 'High' : l.sector.includes('Utilities') ? 'Medium' : 'Low';
    const transTech   = l.sector.includes('Auto') || l.sector.includes('Cement') ? 'Medium' : 'Low';
    const transMarket = l.sector.includes('Coal') ? 'High' : l.sector.includes('Oil') ? 'Medium' : 'Low';
    const esImpact    = sr(i * 3 + 14) > 0.5 ? 'Adverse' : 'Neutral';
    return { ...l, complete, physAcute, physChronic, transPolicy, transTech, transMarket, esImpact };
  });

  const completed = ddStatus.filter(d => d.complete).length;

  const riskColor = r => {
    if (r === 'High')    return { bg: '#fee2e2', col: T.red };
    if (r === 'Medium')  return { bg: '#fef3c7', col: T.amber };
    if (r === 'Adverse') return { bg: '#fef3c7', col: T.amber };
    return { bg: '#f0fdf4', col: T.green };
  };

  const gaps = [
    { gap: 'Physical risk quantification for 3 coastal exposures', priority: 'High',   remediation: 'Commission independent flood/storm modelling', due: 'Q3 2026' },
    { gap: 'Transition plan adequacy assessment for coal counterparties', priority: 'Critical', remediation: 'Obtain Science Based Targets alignment confirmation', due: 'Q2 2026' },
    { gap: 'E&S impact data for 4 partially completed DDs', priority: 'Medium', remediation: 'Request CSRD/SFDR disclosures from counterparties', due: 'Q4 2026' },
    { gap: 'CRREM pathway data for RE-secured loans', priority: 'Medium', remediation: 'Subscribe to CRREM portfolio tool', due: 'Q3 2026' },
  ];

  return (
    <div>
      <DataNotice />
      <div style={{
        background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8,
        padding: '10px 16px', marginBottom: 16, fontSize: 12, color: T.navy,
      }}>
        <strong>EBA Environmental Due Diligence Guidelines (EBA/GL/2024/01):</strong> CRR3 Article 87a requires institutions to conduct environmental and social due diligence proportionate to the exposure size, sector, and geography. Results must inform ICAAP and credit risk management.
      </div>

      {/* DD Summary KPIs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <KpiCard label="EBA DD Completed" value={`${completed}/10`} sub="Top 10 exposures assessed" color={completed >= 8 ? T.green : T.amber} />
        <KpiCard label="High Physical Risk" value={ddStatus.filter(d => d.physAcute === 'High').length} sub="Acute physical risk flagged" color={T.red} />
        <KpiCard label="High Transition Risk" value={ddStatus.filter(d => d.transPolicy === 'High').length} sub="Policy risk — high severity" color={T.amber} />
        <KpiCard label="Adverse E&S Impact" value={ddStatus.filter(d => d.esImpact === 'Adverse').length} sub="Negative E&S assessment" color={T.navyL} />
      </div>

      {/* DD checklist table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, boxShadow: T.card, marginBottom: 20 }}>
        <SectionHead title="EBA DD Checklist — Top 10 Exposures" sub="Physical risk (acute/chronic) | Transition risk (policy/tech/market) | E&S impact" />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {[
                  'Loan', 'Counterparty', 'Sector', 'EAD ($M)',
                  'Phys Acute', 'Phys Chronic', 'Trans Policy', 'Trans Tech', 'Trans Market', 'E&S Impact', 'DD Status',
                ].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: T.textSec, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ddStatus.map((d, i) => (
                <tr key={d.id} style={{ background: i % 2 === 0 ? T.surfaceH : T.surface }}>
                  <td style={{ padding: '5px 8px', fontWeight: 700, color: T.navyL }}>{d.id}</td>
                  <td style={{ padding: '5px 8px', color: T.text }}>{d.name}</td>
                  <td style={{ padding: '5px 8px', color: T.textSec, fontSize: 10 }}>{d.sector}</td>
                  <td style={{ padding: '5px 8px', fontWeight: 600 }}>${d.ead.toFixed(1)}M</td>
                  {[d.physAcute, d.physChronic, d.transPolicy, d.transTech, d.transMarket, d.esImpact].map((v, j) => {
                    const { bg, col } = riskColor(v);
                    return (
                      <td key={j} style={{ padding: '5px 8px' }}>
                        <span style={{ background: bg, color: col, padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{v}</span>
                      </td>
                    );
                  })}
                  <td style={{ padding: '5px 8px' }}>
                    <span style={{
                      background: d.complete ? '#dcfce7' : '#fef3c7',
                      color: d.complete ? T.green : T.amber,
                      padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                    }}>{d.complete ? 'Complete' : 'In Progress'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gap remediation */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, boxShadow: T.card }}>
        <SectionHead title="EBA DD Gap Remediation Plan" sub="Open gaps and remediation actions" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              {['Gap Identified', 'Priority', 'Remediation Action', 'Target Date'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '5px 10px', color: T.textSec, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gaps.map((g, i) => {
              const { bg, col } = riskColor(g.priority);
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : T.surface }}>
                  <td style={{ padding: '7px 10px', color: T.text }}>{g.gap}</td>
                  <td style={{ padding: '7px 10px' }}>
                    <span style={{ background: bg, color: col, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{g.priority}</span>
                  </td>
                  <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{g.remediation}</td>
                  <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy }}>{g.due}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ fontSize: 10, color: T.textMut, marginTop: 10 }}>
          Remediation plan aligned with EBA/GL/2024/01 proportionality principle. CRR3 Article 87a compliance target: 31 Dec 2026.
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ClimateCreditRiskAnalyticsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [scenario, setScenario] = useState('Disorderly');

  const loans = useMemo(() => computeAdjusted(RAW_LOANS, scenario), [scenario]);

  const tabs = [
    'Credit Risk Dashboard',
    'PD Overlay Model',
    'LGD & Collateral',
    'IFRS 9 Climate Overlay',
    'EBA Environmental DD',
  ];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{
                background: T.navy, color: '#fff', fontSize: 10, fontWeight: 700,
                padding: '2px 8px', borderRadius: 4, letterSpacing: '0.05em',
              }}>EP-AJ5</span>
              <span style={{ fontSize: 12, color: T.textMut }}>IFRS 9 | ECB CST 2022 | EBA DD 2024</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>
              Climate Credit Risk Analytics
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: T.textSec }}>
              Climate-adjusted PD overlays, LGD haircuts, IFRS 9 provisions and EBA Environmental Due Diligence for bank loan portfolios
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
              padding: '6px 14px', fontSize: 12, color: T.textSec,
            }}>
              Scenario: <strong style={{ color: T.navy }}>{scenario}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 2, background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 10, padding: 4, marginBottom: 22, flexWrap: 'wrap',
      }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setActiveTab(i)} style={{
            padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
            background: activeTab === i ? T.navy : 'transparent',
            color: activeTab === i ? '#fff' : T.textSec,
            fontWeight: activeTab === i ? 700 : 500,
            fontSize: 12, transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 0 && <Tab1Dashboard loans={loans} />}
      {activeTab === 1 && <Tab2PD loans={loans} scenario={scenario} setScenario={setScenario} />}
      {activeTab === 2 && <Tab3LGD loans={loans} />}
      {activeTab === 3 && <Tab4IFRS9 loans={loans} />}
      {activeTab === 4 && <Tab5EBA loans={loans} />}

      {/* Footer */}
      <div style={{ marginTop: 32, paddingTop: 16, borderTop: `1px solid ${T.borderL}`, fontSize: 11, color: T.textMut, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span>EP-AJ5 Climate Credit Risk Analytics | IFRS 9 Forward-Looking Overlay | ECB CST 2022 Methodology</span>
        <span>EBA/GL/2024/01 Environmental DD | BIS WP #627 | CRREM 2023 Stranding Curves</span>
      </div>
    </div>
  );
}
