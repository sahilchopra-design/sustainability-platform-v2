import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PieChart, Pie, Cell, Legend, ReferenceLine
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef', teal: '#0f766e', red: '#991b1b', green: '#065f46', gray: '#6b7280' };

const normCDF = (x) => {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.8212560 + t * 1.3302744))));
  return x >= 0 ? 1 - p : p;
};

const bsCalc = (S, K, Tm, r, sigma) => {
  if (sigma <= 0 || Tm <= 0 || S <= 0 || K <= 0) return { call: 0, put: 0, delta: 0, gamma: 0, vega: 0, theta: 0 };
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * Tm) / (sigma * Math.sqrt(Tm));
  const d2 = d1 - sigma * Math.sqrt(Tm);
  const call = S * normCDF(d1) - K * Math.exp(-r * Tm) * normCDF(d2);
  const put = K * Math.exp(-r * Tm) * normCDF(-d2) - S * normCDF(-d1);
  const delta = normCDF(d1);
  const gamma = Math.exp(-d1 * d1 / 2) / (S * sigma * Math.sqrt(Tm) * Math.sqrt(2 * Math.PI));
  const vega = S * Math.exp(-d1 * d1 / 2) * Math.sqrt(Tm) / Math.sqrt(2 * Math.PI);
  const theta = -(S * Math.exp(-d1 * d1 / 2) * sigma) / (2 * Math.sqrt(Tm)) - r * K * Math.exp(-r * Tm) * normCDF(d2);
  return { call, put, delta, gamma, vega, theta };
};

const calcDCF = (inputs) => {
  const dr = (inputs.wacc + inputs.climateRiskPremium) / 100;
  const tg = inputs.terminalGrowth / 100;
  let rev = inputs.baseRevenue;
  let pvSum = 0;
  const cashFlows = [];
  for (let yr = 1; yr <= inputs.projYears; yr++) {
    rev *= 1.04;
    const cpInterp = inputs.carbonPrice2030 + (inputs.carbonPrice2050 - inputs.carbonPrice2030) * (yr / inputs.projYears);
    const carbonCost = rev * (inputs.emissionsIntensity / 1000) * cpInterp / 1000;
    const physRisk = rev * 0.005;
    const adaptCost = rev * 0.003 * (yr / inputs.projYears);
    const ebitda = rev * (inputs.opMargin / 100) - carbonCost - physRisk - adaptCost;
    const tax = Math.max(0, ebitda * inputs.taxRate / 100);
    const fcf = (ebitda - tax) - rev * 0.05;
    const pv = fcf / Math.pow(1 + dr, yr);
    pvSum += pv;
    cashFlows.push({
      year: `Y${yr}`, revenue: +rev.toFixed(1),
      carbonCost: +carbonCost.toFixed(1), physRisk: +physRisk.toFixed(1),
      adaptCost: +adaptCost.toFixed(1), fcf: +fcf.toFixed(1), pv: +pv.toFixed(1)
    });
  }
  const lastFCF = cashFlows[cashFlows.length - 1].fcf;
  const tv = dr > tg ? (lastFCF * (1 + tg)) / (dr - tg) : lastFCF * 15;
  const pvTV = tv / Math.pow(1 + dr, inputs.projYears);
  return { npv: pvSum + pvTV, pvCF: pvSum, tv, pvTV, cashFlows };
};

const SECTORS = ['Technology', 'Healthcare', 'Industrials', 'Energy', 'Financials', 'Consumer', 'Materials', 'Utilities', 'Real Estate', 'Telecom'];
const SECTOR_COLORS = ['#1b3a5c', '#0f766e', '#7c3aed', '#b45309', '#0c4a6e', '#065f46', '#991b1b', '#92400e', '#374151', '#1e3a5f'];

const COMP_NAMES = ['TechCorp Ltd', 'EnergyGroup plc', 'IndustrialCo Ltd', 'HealthCare plc', 'FinanceGroup Ltd', 'ConsumerBrands plc', 'MaterialsCo Ltd', 'UtilityGroup plc', 'PropertyReit plc', 'TelecomNet Ltd', 'DataSystems Ltd', 'PowerGen plc', 'ManuCo Ltd', 'PharmaTech plc', 'BankGroup Ltd', 'RetailChain plc', 'ChemCo Ltd', 'GridCo plc', 'LandSec Ltd', 'BroadNet plc', 'CloudSoft Ltd', 'OilRefine plc', 'AutoParts Ltd', 'MedDevice plc', 'InsureGroup Ltd', 'FoodBev plc', 'SteelCo Ltd', 'WaterUtil plc', 'ParkREIT Ltd', 'FibreTel plc'];
const ACQUIRERS = ['Atlas Capital', 'Meridian PE', 'Blackstone RE', 'KKR Group', 'CVC Partners', 'Advent Int', 'Bain Capital', 'TPG Growth', 'Carlyle Group', 'Apollo Global'];

const COMPS_DATA = Array.from({ length: 30 }, (_, i) => {
  const sectorIdx = Math.floor(sr(i * 3 + 1) * SECTORS.length);
  return {
    id: i, target: COMP_NAMES[i],
    acquirer: ACQUIRERS[Math.floor(sr(i * 5 + 2) * ACQUIRERS.length)],
    sector: SECTORS[sectorIdx], dealYear: 2019 + Math.floor(sr(i * 7 + 3) * 6),
    evEbitda: +(8 + sr(i * 11 + 4) * 20).toFixed(1),
    evRevenue: +(0.8 + sr(i * 13 + 5) * 4).toFixed(2),
    premium: +(15 + sr(i * 17 + 6) * 45).toFixed(1),
    status: sr(i * 19 + 7) > 0.3 ? 'Completed' : 'Announced',
    sectorColor: SECTOR_COLORS[sectorIdx]
  };
});

export default function AssetValuationEnginePage() {
  const [activeTab, setActiveTab] = useState(0);

  const [dcfInputs, setDcfInputs] = useState({
    assetName: 'Sample Corp', baseRevenue: 500, sector: 'Technology',
    wacc: 9.5, terminalGrowth: 2.0, opMargin: 35,
    carbonPrice2030: 150, carbonPrice2050: 1200, emissionsIntensity: 80,
    climateRiskPremium: 0.5, taxRate: 25, projYears: 10
  });

  const [mcInputs, setMcInputs] = useState({ revVol: 15, cpVol: 25, revCpCorr: 0.3, nSims: 1000 });
  const [mcRunning, setMcRunning] = useState(false);
  const [mcResults, setMcResults] = useState(null);

  const [roInputs, setRoInputs] = useState({ optionType: 'Expand', S: 200, K: 180, sigma: 35, T: 3, r: 4 });
  const [roCalculated, setRoCalculated] = useState(false);

  const [compSector, setCompSector] = useState('All');
  const [sortCol, setSortCol] = useState('evEbitda');
  const [sortDir, setSortDir] = useState('desc');

  const dcfResult = useMemo(() => calcDCF(dcfInputs), [dcfInputs]);

  const sensitivityGrid = useMemo(() => {
    const waccVals = [dcfInputs.wacc - 2, dcfInputs.wacc, dcfInputs.wacc + 2];
    const tgVals = [dcfInputs.terminalGrowth - 1, dcfInputs.terminalGrowth, dcfInputs.terminalGrowth + 1];
    return tgVals.map(tg => ({
      tg,
      vals: waccVals.map(w => ({
        wacc: w,
        npv: +calcDCF({ ...dcfInputs, wacc: w, terminalGrowth: Math.max(0.1, tg) }).npv.toFixed(1)
      }))
    }));
  }, [dcfInputs]);

  const handleRunMC = useCallback(() => {
    setMcRunning(true);
    setTimeout(() => {
      const baseNPV = dcfResult.npv;
      const nSims = mcInputs.nSims;
      const results = Array.from({ length: nSims }, (_, i) => {
        const revShock = 0.85 + sr(i * 7 + 1) * 0.3;
        const cpShock = 0.6 + sr(i * 13 + 2) * 0.8;
        return baseNPV * revShock * (1 - (cpShock - 1) * 0.15);
      }).sort((a, b) => a - b);
      const pct = (p) => results[Math.max(0, Math.min(results.length - 1, Math.floor(p * nSims)))];
      const mean = results.reduce((a, b) => a + b, 0) / nSims;
      const pPos = results.filter(v => v > 0).length / nSims * 100;
      const minV = results[0], maxV = results[results.length - 1];
      const binW = (maxV - minV) / 20 || 1;
      const hist = Array.from({ length: 20 }, (_, i) => ({
        bin: +((minV + i * binW)).toFixed(0),
        count: results.filter(v => v >= minV + i * binW && v < minV + (i + 1) * binW).length
      }));
      setMcResults({
        mean: +mean.toFixed(1), median: +pct(0.5).toFixed(1),
        var95: +pct(0.05).toFixed(1), pPos: +pPos.toFixed(1),
        p5: +pct(0.05).toFixed(1), p25: +pct(0.25).toFixed(1),
        p50: +pct(0.5).toFixed(1), p75: +pct(0.75).toFixed(1),
        p95: +pct(0.95).toFixed(1), hist
      });
      setMcRunning(false);
    }, 1500);
  }, [dcfResult.npv, mcInputs]);

  const roResult = useMemo(() => {
    if (!roCalculated) return null;
    const S = roInputs.S, K = roInputs.K, Tm = roInputs.T, r = roInputs.r / 100, sigma = roInputs.sigma / 100;
    const bs = bsCalc(S, K, Tm, r, sigma);
    const optionValue = roInputs.optionType === 'Expand' ? bs.call : roInputs.optionType === 'Abandon' ? bs.put : bs.call * 0.85;
    const vsUnderlying = Array.from({ length: 20 }, (_, i) => {
      const sv = K * 0.5 + i * K * 0.075;
      const bsi = bsCalc(sv, K, Tm, r, sigma);
      return { S: +sv.toFixed(0), value: +(roInputs.optionType === 'Abandon' ? bsi.put : bsi.call).toFixed(2) };
    });
    const vsVol = Array.from({ length: 15 }, (_, i) => {
      const vol = 0.10 + i * 0.05;
      const bsi = bsCalc(S, K, Tm, r, vol);
      return { vol: +(vol * 100).toFixed(0), value: +(roInputs.optionType === 'Abandon' ? bsi.put : bsi.call).toFixed(2) };
    });
    return { ...bs, optionValue: +optionValue.toFixed(3), vsUnderlying, vsVol };
  }, [roInputs, roCalculated]);

  const filteredComps = useMemo(() => {
    let data = compSector === 'All' ? COMPS_DATA : COMPS_DATA.filter(d => d.sector === compSector);
    return [...data].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [compSector, sortCol, sortDir]);

  const compStats = useMemo(() => {
    const data = compSector === 'All' ? COMPS_DATA : COMPS_DATA.filter(d => d.sector === compSector);
    const sorted1 = [...data].sort((a, b) => a.evEbitda - b.evEbitda);
    const sorted2 = [...data].sort((a, b) => a.premium - b.premium);
    const medEV = sorted1[Math.floor(sorted1.length / 2)]?.evEbitda || 0;
    const medPrem = sorted2[Math.floor(sorted2.length / 2)]?.premium || 0;
    return { medEV: +medEV.toFixed(1), medPrem: +medPrem.toFixed(1), count: data.length };
  }, [compSector]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const setDcf = (key, val) => setDcfInputs(p => ({ ...p, [key]: val }));
  const setMc = (key, val) => setMcInputs(p => ({ ...p, [key]: val }));
  const setRo = (key, val) => { setRoInputs(p => ({ ...p, [key]: val })); setRoCalculated(false); };

  const tabs = ['DCF Calculator', 'Monte Carlo', 'Real Options', 'Comparable Transactions'];

  const SliderRow = ({ label, valKey, min, max, step, value, setter, fmt }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.navy, fontWeight: 600, marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ color: T.gold, fontFamily: 'monospace' }}>{fmt ? fmt(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => setter(valKey, parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: T.navy }} />
    </div>
  );

  return (
    <div style={{ background: T.cream, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 4 }}>EP-BK1 · ASSET VALUATION ENGINE</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Climate-Adjusted DCF & Real Options Valuation Engine</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>WACC calibration · Carbon cost integration · Black-Scholes real options · M&A comps</div>
      </div>

      <div style={{ display: 'flex', background: '#fff', borderBottom: `2px solid ${T.gold}` }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            style={{ padding: '12px 24px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              background: activeTab === i ? T.navy : 'transparent',
              color: activeTab === i ? T.gold : T.gray,
              borderBottom: activeTab === i ? `2px solid ${T.gold}` : '2px solid transparent' }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: 24 }}>
        {activeTab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24 }}>
            <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16, borderBottom: `1px solid ${T.gold}40`, paddingBottom: 8 }}>DCF PARAMETERS</div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.navy, display: 'block', marginBottom: 4 }}>Asset Name</label>
                <input value={dcfInputs.assetName} onChange={e => setDcf('assetName', e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', border: `1px solid ${T.gold}50`, borderRadius: 4, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.navy, display: 'block', marginBottom: 4 }}>Base Revenue (£m)</label>
                <input type="number" value={dcfInputs.baseRevenue} onChange={e => setDcf('baseRevenue', +e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', border: `1px solid ${T.gold}50`, borderRadius: 4, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.navy, display: 'block', marginBottom: 4 }}>Sector</label>
                <select value={dcfInputs.sector} onChange={e => setDcf('sector', e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', border: `1px solid ${T.gold}50`, borderRadius: 4, fontSize: 13, fontFamily: 'inherit' }}>
                  {SECTORS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <SliderRow label="WACC (%)" valKey="wacc" min={4} max={18} step={0.1} value={dcfInputs.wacc} setter={setDcf} fmt={v => `${v.toFixed(1)}%`} />
              <SliderRow label="Terminal Growth (%)" valKey="terminalGrowth" min={0.5} max={4} step={0.1} value={dcfInputs.terminalGrowth} setter={setDcf} fmt={v => `${v.toFixed(1)}%`} />
              <SliderRow label="Operating Margin (%)" valKey="opMargin" min={10} max={80} step={1} value={dcfInputs.opMargin} setter={setDcf} fmt={v => `${v}%`} />
              <SliderRow label="Carbon Price 2030 ($/tCO₂)" valKey="carbonPrice2030" min={0} max={500} step={10} value={dcfInputs.carbonPrice2030} setter={setDcf} fmt={v => `$${v}`} />
              <SliderRow label="Carbon Price 2050 ($/tCO₂)" valKey="carbonPrice2050" min={0} max={3000} step={50} value={dcfInputs.carbonPrice2050} setter={setDcf} fmt={v => `$${v}`} />
              <SliderRow label="Emissions Intensity (tCO₂/£m rev)" valKey="emissionsIntensity" min={0} max={500} step={5} value={dcfInputs.emissionsIntensity} setter={setDcf} />
              <SliderRow label="Climate Risk Premium (%)" valKey="climateRiskPremium" min={0} max={5} step={0.1} value={dcfInputs.climateRiskPremium} setter={setDcf} fmt={v => `${v.toFixed(1)}%`} />
              <SliderRow label="Tax Rate (%)" valKey="taxRate" min={10} max={35} step={1} value={dcfInputs.taxRate} setter={setDcf} fmt={v => `${v}%`} />
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.navy, marginBottom: 6 }}>Projection Years</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[5, 10, 15, 20].map(y => (
                    <button key={y} onClick={() => setDcf('projYears', y)}
                      style={{ flex: 1, padding: '6px 0', border: `1px solid ${T.navy}`, borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        background: dcfInputs.projYears === y ? T.navy : '#fff', color: dcfInputs.projYears === y ? T.gold : T.navy }}>
                      {y}Y
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'NPV', val: `£${dcfResult.npv.toFixed(1)}m`, sub: 'Total Net Present Value', color: dcfResult.npv > 0 ? T.green : T.red },
                  { label: 'PV Cash Flows', val: `£${dcfResult.pvCF.toFixed(1)}m`, sub: `${dcfInputs.projYears}-year PV`, color: T.navy },
                  { label: 'Terminal Value (PV)', val: `£${dcfResult.pvTV.toFixed(1)}m`, sub: 'PV of TV', color: T.teal },
                  { label: 'Effective WACC', val: `${(dcfInputs.wacc + dcfInputs.climateRiskPremium).toFixed(1)}%`, sub: 'Climate-adjusted', color: T.gold }
                ].map((m, i) => (
                  <div key={i} style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 16 }}>
                    <div style={{ fontSize: 11, color: T.gray, fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: m.color, fontFamily: 'monospace' }}>{m.val}</div>
                    <div style={{ fontSize: 11, color: T.gray }}>{m.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Cash Flow Waterfall (£m) — {dcfInputs.assetName}</div>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={dcfResult.cashFlows.slice(0, 10)} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `£${v}m`} />
                    <Tooltip formatter={(v, n) => [`£${v}m`, n]} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="fcf" name="Free Cash Flow" fill={T.teal} />
                    <Bar dataKey="carbonCost" name="Carbon Cost" fill={T.red} />
                    <Bar dataKey="physRisk" name="Physical Risk" fill="#f97316" />
                    <Bar dataKey="adaptCost" name="Adaptation" fill="#eab308" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>NPV Sensitivity (£m) — WACC × Terminal Growth</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 12px', background: T.navy, color: T.gold, textAlign: 'left', fontFamily: 'monospace', fontSize: 11 }}>TG \ WACC</th>
                      {sensitivityGrid[0]?.vals.map(v => (
                        <th key={v.wacc} style={{ padding: '8px 12px', background: T.navy, color: T.gold, textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{v.wacc.toFixed(1)}%</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sensitivityGrid.map((row, ri) => (
                      <tr key={ri} style={{ background: ri % 2 === 0 ? '#f9f7f3' : '#fff' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy, fontFamily: 'monospace' }}>{row.tg.toFixed(1)}%</td>
                        {row.vals.map((v, ci) => (
                          <td key={ci} style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'monospace',
                            fontWeight: ri === 1 && ci === 1 ? 700 : 400,
                            background: ri === 1 && ci === 1 ? `${T.gold}30` : 'transparent',
                            color: v.npv > 0 ? T.green : T.red }}>
                            £{v.npv}m
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
            <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16, borderBottom: `1px solid ${T.gold}40`, paddingBottom: 8 }}>SIMULATION PARAMETERS</div>
              <div style={{ fontSize: 12, color: T.gray, marginBottom: 12, padding: '8px 12px', background: `${T.navy}08`, borderRadius: 4 }}>
                Base DCF NPV: <strong style={{ color: T.navy, fontFamily: 'monospace' }}>£{dcfResult.npv.toFixed(1)}m</strong>
              </div>
              <SliderRow label="Revenue Volatility (%)" valKey="revVol" min={5} max={40} step={1} value={mcInputs.revVol} setter={setMc} fmt={v => `${v}%`} />
              <SliderRow label="Carbon Price Volatility (%)" valKey="cpVol" min={10} max={60} step={1} value={mcInputs.cpVol} setter={setMc} fmt={v => `${v}%`} />
              <SliderRow label="Rev-Carbon Correlation" valKey="revCpCorr" min={-0.5} max={0.5} step={0.05} value={mcInputs.revCpCorr} setter={setMc} fmt={v => v.toFixed(2)} />
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.navy, marginBottom: 6 }}>Simulations</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[500, 1000, 5000, 10000].map(n => (
                    <button key={n} onClick={() => setMc('nSims', n)}
                      style={{ flex: 1, padding: '6px 2px', border: `1px solid ${T.navy}`, borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        background: mcInputs.nSims === n ? T.navy : '#fff', color: mcInputs.nSims === n ? T.gold : T.navy }}>
                      {n.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleRunMC} disabled={mcRunning}
                style={{ width: '100%', padding: '12px', background: mcRunning ? T.gray : T.navy, color: T.gold,
                  border: 'none', borderRadius: 6, cursor: mcRunning ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}>
                {mcRunning ? '⚡ Calculating...' : 'RUN SIMULATION'}
              </button>
            </div>

            <div>
              {!mcResults && !mcRunning && (
                <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 60, textAlign: 'center', color: T.gray }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎲</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>Configure parameters and click RUN SIMULATION</div>
                  <div style={{ fontSize: 13, marginTop: 8 }}>Generates {mcInputs.nSims.toLocaleString()} seeded scenarios</div>
                </div>
              )}
              {mcRunning && (
                <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 60, textAlign: 'center', color: T.navy }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>Running {mcInputs.nSims.toLocaleString()} simulations...</div>
                  <div style={{ fontSize: 13, color: T.gray, marginTop: 8 }}>Computing NPV distribution across carbon + revenue scenarios...</div>
                </div>
              )}
              {mcResults && !mcRunning && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'Mean NPV', val: `£${mcResults.mean}m`, color: T.navy },
                      { label: 'Median NPV', val: `£${mcResults.median}m`, color: T.teal },
                      { label: 'VaR 95 (P5)', val: `£${mcResults.var95}m`, color: T.red },
                      { label: 'P(NPV > 0)', val: `${mcResults.pPos}%`, color: T.green }
                    ].map((m, i) => (
                      <div key={i} style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 16 }}>
                        <div style={{ fontSize: 11, color: T.gray, fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>{m.label}</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: m.color, fontFamily: 'monospace' }}>{m.val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>NPV Distribution — {mcInputs.nSims.toLocaleString()} Scenarios</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={mcResults.hist} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                        <XAxis dataKey="bin" tick={{ fontSize: 10 }} tickFormatter={v => `£${v}m`} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v) => [v, 'Scenarios']} labelFormatter={l => `NPV ≈ £${l}m`} />
                        <Bar dataKey="count" fill={T.teal} />
                        <ReferenceLine x={mcResults.var95} stroke={T.red} strokeDasharray="5 5" />
                        <ReferenceLine x={mcResults.mean} stroke={T.navy} strokeDasharray="5 5" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>NPV Percentile Table</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
                      {[['P5', mcResults.p5], ['P25', mcResults.p25], ['P50', mcResults.p50], ['P75', mcResults.p75], ['P95', mcResults.p95]].map(([lbl, val], i) => (
                        <div key={i} style={{ padding: 14, background: i % 2 === 0 ? '#f9f7f3' : '#fff', borderRight: i < 4 ? `1px solid ${T.gold}30` : 'none', textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: T.gray, fontWeight: 600, marginBottom: 6 }}>{lbl}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: parseFloat(val) > 0 ? T.green : T.red, fontFamily: 'monospace' }}>£{val}m</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24 }}>
            <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16, borderBottom: `1px solid ${T.gold}40`, paddingBottom: 8 }}>BLACK-SCHOLES REAL OPTIONS</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.navy, marginBottom: 6 }}>Option Type</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['Expand', 'Abandon', 'Defer'].map(t => (
                    <button key={t} onClick={() => setRo('optionType', t)}
                      style={{ flex: 1, padding: '8px 4px', border: `1px solid ${T.navy}`, borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        background: roInputs.optionType === t ? T.navy : '#fff', color: roInputs.optionType === t ? T.gold : T.navy }}>
                      {t}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: T.gray, marginTop: 6, lineHeight: 1.4 }}>
                  {roInputs.optionType === 'Expand' ? 'Call option — right to invest and expand project' : roInputs.optionType === 'Abandon' ? 'Put option — right to exit at salvage value' : 'Call (discounted 15%) — right to delay investment'}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.navy, display: 'block', marginBottom: 4 }}>Underlying Asset Value (£m)</label>
                <input type="number" value={roInputs.S} onChange={e => setRo('S', +e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', border: `1px solid ${T.gold}50`, borderRadius: 4, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.navy, display: 'block', marginBottom: 4 }}>Strike / Investment Cost (£m)</label>
                <input type="number" value={roInputs.K} onChange={e => setRo('K', +e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', border: `1px solid ${T.gold}50`, borderRadius: 4, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <SliderRow label="Volatility σ (%)" valKey="sigma" min={10} max={80} step={1} value={roInputs.sigma} setter={setRo} fmt={v => `${v}%`} />
              <SliderRow label="Time to Maturity (years)" valKey="T" min={1} max={10} step={0.5} value={roInputs.T} setter={setRo} fmt={v => `${v}y`} />
              <SliderRow label="Risk-Free Rate (%)" valKey="r" min={1} max={8} step={0.1} value={roInputs.r} setter={setRo} fmt={v => `${v.toFixed(1)}%`} />
              <button onClick={() => setRoCalculated(true)}
                style={{ width: '100%', marginTop: 8, padding: '12px', background: T.navy, color: T.gold, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}>
                CALCULATE OPTION VALUE
              </button>
            </div>

            <div>
              {!roCalculated ? (
                <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 60, textAlign: 'center', color: T.gray }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📐</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>Configure option parameters and calculate</div>
                  <div style={{ fontSize: 13, marginTop: 8 }}>Black-Scholes model with full Greeks computation</div>
                </div>
              ) : roResult && (
                <>
                  <div style={{ background: '#fff', border: `2px solid ${T.gold}`, borderRadius: 8, padding: 20, marginBottom: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: T.gray, fontWeight: 600, marginBottom: 4 }}>{roInputs.optionType.toUpperCase()} OPTION VALUE</div>
                    <div style={{ fontSize: 42, fontWeight: 700, color: T.teal, fontFamily: 'monospace' }}>£{roResult.optionValue.toFixed(2)}m</div>
                    <div style={{ fontSize: 12, color: T.gray, marginTop: 4 }}>S=£{roInputs.S}m · K=£{roInputs.K}m · σ={roInputs.sigma}% · T={roInputs.T}y · r={roInputs.r}%</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'Delta (Δ)', val: roResult.delta.toFixed(4), desc: 'Rate of change vs S' },
                      { label: 'Gamma (Γ)', val: roResult.gamma.toFixed(5), desc: 'Delta sensitivity' },
                      { label: 'Vega (ν)', val: roResult.vega.toFixed(3), desc: 'Volatility sensitivity' },
                      { label: 'Theta (Θ)', val: roResult.theta.toFixed(3), desc: 'Time decay per year' }
                    ].map((g, i) => (
                      <div key={i} style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>{g.label}</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: T.navy, fontFamily: 'monospace', margin: '4px 0' }}>{g.val}</div>
                        <div style={{ fontSize: 11, color: T.gray }}>{g.desc}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Option Value vs Underlying (£m)</div>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={roResult.vsUnderlying} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                          <XAxis dataKey="S" tick={{ fontSize: 10 }} tickFormatter={v => `£${v}m`} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `£${v}m`} />
                          <Tooltip formatter={(v) => [`£${v}m`, 'Option Value']} />
                          <ReferenceLine x={roInputs.K} stroke={T.gold} strokeDasharray="5 5" />
                          <Line type="monotone" dataKey="value" stroke={T.teal} strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Option Value vs Volatility σ (%)</div>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={roResult.vsVol} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                          <XAxis dataKey="vol" tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `£${v}m`} />
                          <Tooltip formatter={(v) => [`£${v}m`, 'Option Value']} />
                          <Line type="monotone" dataKey="value" stroke={T.navy} strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {['All', ...SECTORS].map(s => (
                <button key={s} onClick={() => setCompSector(s)}
                  style={{ padding: '6px 14px', border: `1px solid ${T.navy}`, borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    background: compSector === s ? T.navy : '#fff', color: compSector === s ? T.gold : T.navy }}>
                  {s}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
              {[
                { label: 'Median EV/EBITDA', val: `${compStats.medEV}×`, color: T.navy },
                { label: 'Median Premium Paid', val: `${compStats.medPrem}%`, color: T.teal },
                { label: 'Deal Count', val: compStats.count, color: T.gold }
              ].map((s, i) => (
                <div key={i} style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: T.gray, fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: 'monospace' }}>{s.val}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
              <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.navy }}>
                      {[['target', 'Target'], ['acquirer', 'Acquirer'], ['sector', 'Sector'], ['dealYear', 'Year'], ['evEbitda', 'EV/EBITDA'], ['evRevenue', 'EV/Rev'], ['premium', 'Premium %'], ['status', 'Status']].map(([col, lbl]) => (
                        <th key={col} onClick={() => handleSort(col)}
                          style={{ padding: '8px 10px', color: T.gold, textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600, userSelect: 'none', fontSize: 11 }}>
                          {lbl} {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComps.map((d, i) => (
                      <tr key={d.id} style={{ background: i % 2 === 0 ? '#f9f7f3' : '#fff', borderBottom: `1px solid ${T.gold}15` }}>
                        <td style={{ padding: '6px 10px', fontWeight: 600, color: T.navy }}>{d.target}</td>
                        <td style={{ padding: '6px 10px', color: T.gray }}>{d.acquirer}</td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ background: d.sectorColor, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600 }}>{d.sector}</span>
                        </td>
                        <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: T.gray }}>{d.dealYear}</td>
                        <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontWeight: 600, color: T.teal }}>{d.evEbitda}×</td>
                        <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: T.navy }}>{d.evRevenue}×</td>
                        <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: T.gold, fontWeight: 600 }}>{d.premium}%</td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ color: d.status === 'Completed' ? T.green : T.gold, fontWeight: 600, fontSize: 11 }}>{d.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>EV/EBITDA vs Premium Paid</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                      <XAxis dataKey="evEbitda" name="EV/EBITDA" tick={{ fontSize: 10 }} tickFormatter={v => `${v}×`} label={{ value: 'EV/EBITDA', position: 'insideBottom', offset: -5, fontSize: 11, fill: T.gray }} />
                      <YAxis dataKey="premium" name="Premium" tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} label={{ value: 'Premium', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.gray }} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [n === 'evEbitda' ? `${v}×` : `${v}%`, n === 'evEbitda' ? 'EV/EBITDA' : 'Premium']} />
                      <Scatter data={filteredComps}>
                        {filteredComps.map((d, i) => <Cell key={i} fill={d.sectorColor} />)}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <button onClick={() => alert(`Comps applied: ${compStats.medEV}× EV/EBITDA (${compSector} sector)\nImplied NPV benchmark: £${(compStats.medEV * dcfResult.pvCF * 0.08).toFixed(1)}m\n\nMedian transaction premium: ${compStats.medPrem}%`)}
                  style={{ width: '100%', padding: '12px', background: T.teal, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}>
                  Apply Comps to DCF Model
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
