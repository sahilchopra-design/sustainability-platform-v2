import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';

// ── Platform standards ────────────────────────────────────────────────────────
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = {
  bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E',
  sub: '#6B7280', accent: '#B8860B', indigo: '#4F46E5', green: '#065F46',
  red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E'
};
const HEADER_BG = '#0F172A';
const SOLAR_GOLD = '#D97706';
const MACRS5 = [0.2000, 0.3200, 0.1920, 0.1152, 0.1152, 0.0576];

const TABS = [
  'Project Config',
  'Cash Flow Engine',
  'Returns Analysis',
  'DSCR & Debt',
  'Tax Credits (IRA)',
  'Energy Yield P50/P90',
  'Sensitivity',
  'Scenario Engine',
  'Refinancing',
  'LP/GP Waterfall',
  'Portfolio Context',
  'Executive Summary',
];

// ── Calculation engines ───────────────────────────────────────────────────────
function calcIRR(cashflows) {
  let rate = 0.10;
  for (let i = 0; i < 200; i++) {
    const npv = cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + rate, t), 0);
    const dnpv = cashflows.reduce((s, cf, t) => s - t * cf / Math.pow(1 + rate, t + 1), 0);
    if (Math.abs(dnpv) < 1e-10) break;
    const nr = rate - npv / dnpv;
    if (Math.abs(nr - rate) < 1e-8) { rate = nr; break; }
    rate = nr;
  }
  return rate;
}

function calcNPV(rate, cashflows) {
  return cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + rate, t), 0);
}

// ── Formatting helpers ────────────────────────────────────────────────────────
const fmtPct = n => isFinite(n) ? (n * 100).toFixed(1) + '%' : '—';
const fmtM   = n => isFinite(n) ? '$' + n.toFixed(1) + 'M' : '—';
const fmtX   = n => isFinite(n) ? n.toFixed(2) + 'x' : '—';

// ── Shared UI primitives ──────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 8,
      padding: '16px 20px', flex: 1, minWidth: 155,
    }}>
      <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: color || T.text }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 700, color: T.text,
      borderBottom: `2px solid ${SOLAR_GOLD}`,
      paddingBottom: 6, marginBottom: 14, marginTop: 22,
    }}>{children}</div>
  );
}

function SliderRow({ label, value, min, max, step, onChange, fmt }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: T.sub }}>{label}</span>
        <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: T.text }}>
          {fmt ? fmt(value) : value}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: SOLAR_GOLD }} />
    </div>
  );
}

function DataTable({ headers, rows, colorFn }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: HEADER_BG }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: '8px 10px', color: '#F1F5F9', fontWeight: 600,
                textAlign: i === 0 ? 'left' : 'right', whiteSpace: 'nowrap',
                position: 'sticky', top: 0,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? T.card : '#F8F7F4' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: '7px 10px',
                  textAlign: ci === 0 ? 'left' : 'right',
                  color: colorFn ? colorFn(cell, ci, ri) : T.text,
                  fontFamily: ci > 0 ? 'JetBrains Mono, monospace' : 'inherit',
                  borderBottom: `1px solid ${T.border}`,
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SolarProjectFinancePage() {
  const [activeTab, setActiveTab] = useState(0);

  const [inputs, setInputs] = useState({
    capacityMW:          100,
    capexPerW:           0.85,
    omPerKwYr:           14,
    degradationPct:      0.45,
    capacityFactor:      0.215,
    ppaPriceMWh:         42,
    ppaTenorYr:          20,
    projectLifeYr:       30,
    debtPct:             0.70,
    debtRatePct:         0.055,
    debtTenorYr:         18,
    discountRatePct:     0.08,
    taxRatePct:          0.21,
    itcPct:              0.30,
    domesticContent:     true,
    energyCommunity:     false,
    targetDscr:          1.30,
    inflationPct:        0.025,
    yieldSigma:          0.09,
    landLeasePerAcre:    1200,
    projectAcres:        700,
    insurancePct:        0.004,
  });

  const set = (key, val) => setInputs(prev => ({ ...prev, [key]: val }));

  // ── Core financial model (memoised) ──────────────────────────────────────
  const model = useMemo(() => {
    const {
      capacityMW, capexPerW, omPerKwYr, degradationPct, capacityFactor,
      ppaPriceMWh, ppaTenorYr, projectLifeYr, debtPct, debtRatePct, debtTenorYr,
      discountRatePct, taxRatePct, itcPct, domesticContent, energyCommunity,
      inflationPct, yieldSigma, landLeasePerAcre, projectAcres, insurancePct,
    } = inputs;

    const totalCapexM    = capacityMW * 1000 * capexPerW / 1e6;
    const effITC         = itcPct + (domesticContent ? 0.10 : 0) + (energyCommunity ? 0.10 : 0);
    const itcAmountM     = effITC * totalCapexM;
    const debtAmountM    = debtPct * (totalCapexM - itcAmountM);
    const equityAmountM  = totalCapexM - debtAmountM - itcAmountM;
    const depreciableBasis = totalCapexM * (1 - effITC / 2);

    // MACRS PV tax shield
    let macrsTaxShield = 0;
    MACRS5.forEach((rate, yr) => {
      macrsTaxShield += depreciableBasis * rate * taxRatePct / Math.pow(1 + discountRatePct, yr + 1);
    });

    // P50 / P90 / P10
    const p50Annual = capacityMW * 1000 * capacityFactor * 8760;
    const p90Annual = p50Annual * (1 - 1.2816 * yieldSigma);
    const p10Annual = p50Annual * (1 + 1.2816 * yieldSigma);

    // Level-annuity debt service
    const annualDS = debtAmountM > 0
      ? debtAmountM * debtRatePct * Math.pow(1 + debtRatePct, debtTenorYr)
        / (Math.pow(1 + debtRatePct, debtTenorYr) - 1)
      : 0;

    // Annual cashflow table
    let debtBal = debtAmountM;
    const table = Array.from({ length: projectLifeYr }, (_, idx) => {
      const yr        = idx + 1;
      const degFactor = Math.pow(1 - degradationPct / 100, idx);
      const grossGen  = p50Annual * degFactor;
      const netGen    = grossGen * 0.97;
      const ppaActive = yr <= ppaTenorYr;
      const revMwh    = ppaActive ? ppaPriceMWh : ppaPriceMWh * 0.80;
      const revenueM  = netGen * revMwh / 1e6;
      const omM       = capacityMW * omPerKwYr * Math.pow(1 + inflationPct, idx) / 1e6;
      const landM     = projectAcres * landLeasePerAcre * Math.pow(1 + inflationPct, idx) / 1e6;
      const insM      = totalCapexM * insurancePct * Math.pow(1 - 0.015, idx);
      const gaM       = 0.50 * Math.pow(1 + inflationPct, idx);
      const ebitdaM   = revenueM - omM - landM - insM - gaM;

      const dsM       = yr <= debtTenorYr ? annualDS : 0;
      const interestM = debtBal * debtRatePct;
      const principalM = Math.max(0, dsM - interestM);
      debtBal = Math.max(0, debtBal - principalM);

      const cfadsM   = ebitdaM - dsM;
      const dscr     = dsM > 0 ? ebitdaM / dsM : null;
      const deprnM   = yr <= 6 ? depreciableBasis * MACRS5[yr - 1] : 0;
      const taxableM = Math.max(0, ebitdaM - interestM - deprnM);
      const taxM     = taxableM * taxRatePct;
      const netIncM  = ebitdaM - dsM - taxM;
      const equDistM = Math.max(0, netIncM);

      return { yr, grossGen, netGen, revenueM, omM, landM, insM, gaM, ebitdaM, dsM, cfadsM, taxM, netIncM, equDistM, dscr, interestM };
    });

    // Equity IRR: t=0 outflow, year-1 adds ITC + dist, subsequent years add dist
    const equityCFs = [-equityAmountM];
    equityCFs.push(itcAmountM + (table[0]?.equDistM ?? 0));
    table.slice(1).forEach(r => equityCFs.push(r.equDistM));
    const equityIRR  = calcIRR(equityCFs);

    // Project IRR: unlevered EBITDA
    const projectCFs = [-totalCapexM, ...table.map(r => r.ebitdaM)];
    const projectIRR = calcIRR(projectCFs);

    const npvM      = calcNPV(discountRatePct, equityCFs);
    const totalDist = equityCFs.slice(1).reduce((s, v) => s + Math.max(0, v), 0);
    const moic      = equityAmountM > 0 ? totalDist / equityAmountM : 0;

    // DSCR metrics
    const dscrYrs  = table.filter(r => r.dscr !== null);
    const minDscr  = dscrYrs.length ? Math.min(...dscrYrs.map(r => r.dscr)) : 0;
    const avgDscr  = dscrYrs.length ? dscrYrs.reduce((s, r) => s + r.dscr, 0) / dscrYrs.length : 0;

    // LLCR
    const llcr = debtAmountM > 0
      ? table.slice(0, debtTenorYr).reduce((s, r, i) =>
          s + r.cfadsM / Math.pow(1 + debtRatePct, i + 1), 0) / debtAmountM
      : 0;

    // PLCR
    const plcr = debtAmountM > 0
      ? table.reduce((s, r, i) =>
          s + r.cfadsM / Math.pow(1 + debtRatePct, i + 1), 0) / debtAmountM
      : 0;

    // LCOE
    const discountedOpex = table.reduce((s, r, i) =>
      s + (r.omM + r.landM + r.insM + r.gaM) / Math.pow(1 + discountRatePct, i + 1), 0);
    const discountedEnergy = table.reduce((s, r, i) =>
      s + r.netGen / Math.pow(1 + discountRatePct, i + 1), 0);
    const lcoe = discountedEnergy > 0
      ? (totalCapexM * 1e6 + discountedOpex * 1e6) / discountedEnergy
      : 0;

    // Payback
    let cum = -equityAmountM;
    let payback = projectLifeYr;
    for (let i = 1; i < equityCFs.length; i++) {
      cum += equityCFs[i];
      if (cum >= 0) { payback = i; break; }
    }

    const dsraM       = annualDS / 2;
    const annualGenGwh = p50Annual / 1000;
    const annualRevM  = table[0]?.revenueM ?? 0;

    return {
      totalCapexM, effITC, itcAmountM, equityAmountM, debtAmountM,
      annualDS, table, equityIRR, projectIRR, npvM, moic, totalDist,
      minDscr, avgDscr, llcr, plcr, lcoe, payback, macrsTaxShield,
      p50Annual, p90Annual, p10Annual, depreciableBasis, dsraM,
      annualGenGwh, annualRevM, equityCFs,
    };
  }, [inputs]);

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 1 — Project Configuration
  // ══════════════════════════════════════════════════════════════════════════
  const renderTab0 = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
          <SectionTitle>Capacity &amp; Resource</SectionTitle>
          <SliderRow label="Capacity (MW DC)" value={inputs.capacityMW} min={10} max={500} step={5}
            onChange={v => set('capacityMW', v)} fmt={v => v + ' MW'} />
          <SliderRow label="CAPEX ($/W DC)" value={inputs.capexPerW} min={0.50} max={1.50} step={0.01}
            onChange={v => set('capexPerW', v)} fmt={v => '$' + v.toFixed(2) + '/W'} />
          <SliderRow label="Capacity Factor" value={inputs.capacityFactor} min={0.10} max={0.35} step={0.005}
            onChange={v => set('capacityFactor', v)} fmt={v => (v * 100).toFixed(1) + '%'} />
          <SliderRow label="Degradation (%/yr)" value={inputs.degradationPct} min={0.20} max={0.80} step={0.05}
            onChange={v => set('degradationPct', v)} fmt={v => v.toFixed(2) + '%/yr'} />
          <SliderRow label="PPA Price ($/MWh)" value={inputs.ppaPriceMWh} min={20} max={80} step={1}
            onChange={v => set('ppaPriceMWh', v)} fmt={v => '$' + v + '/MWh'} />
          <SliderRow label="PPA Tenor (years)" value={inputs.ppaTenorYr} min={10} max={25} step={1}
            onChange={v => set('ppaTenorYr', v)} fmt={v => v + ' yr'} />
          <SliderRow label="Project Life (years)" value={inputs.projectLifeYr} min={20} max={35} step={1}
            onChange={v => set('projectLifeYr', v)} fmt={v => v + ' yr'} />
          <SliderRow label="Project Acres" value={inputs.projectAcres} min={100} max={2000} step={50}
            onChange={v => set('projectAcres', v)} fmt={v => v.toLocaleString() + ' ac'} />
          <SliderRow label="Land Lease ($/acre/yr)" value={inputs.landLeasePerAcre} min={400} max={3000} step={100}
            onChange={v => set('landLeasePerAcre', v)} fmt={v => '$' + v.toLocaleString()} />
          <SliderRow label="Yield Uncertainty (σ)" value={inputs.yieldSigma} min={0.04} max={0.15} step={0.005}
            onChange={v => set('yieldSigma', v)} fmt={v => (v * 100).toFixed(1) + '%'} />
        </div>

        {/* Right */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
          <SectionTitle>Finance &amp; Structure</SectionTitle>
          <SliderRow label="Debt / Total Capital" value={inputs.debtPct} min={0.40} max={0.85} step={0.01}
            onChange={v => set('debtPct', v)} fmt={v => (v * 100).toFixed(0) + '%'} />
          <SliderRow label="Senior Debt Rate" value={inputs.debtRatePct} min={0.03} max={0.10} step={0.005}
            onChange={v => set('debtRatePct', v)} fmt={v => (v * 100).toFixed(2) + '%'} />
          <SliderRow label="Debt Tenor (years)" value={inputs.debtTenorYr} min={10} max={25} step={1}
            onChange={v => set('debtTenorYr', v)} fmt={v => v + ' yr'} />
          <SliderRow label="Discount Rate" value={inputs.discountRatePct} min={0.04} max={0.15} step={0.005}
            onChange={v => set('discountRatePct', v)} fmt={v => (v * 100).toFixed(1) + '%'} />
          <SliderRow label="Federal Tax Rate" value={inputs.taxRatePct} min={0.10} max={0.30} step={0.01}
            onChange={v => set('taxRatePct', v)} fmt={v => (v * 100).toFixed(0) + '%'} />
          <SliderRow label="ITC Base %" value={inputs.itcPct} min={0.06} max={0.30} step={0.01}
            onChange={v => set('itcPct', v)} fmt={v => (v * 100).toFixed(0) + '%'} />
          <SliderRow label="O&amp;M ($/kW/yr)" value={inputs.omPerKwYr} min={6} max={25} step={0.5}
            onChange={v => set('omPerKwYr', v)} fmt={v => '$' + v.toFixed(1) + '/kW'} />
          <SliderRow label="O&amp;M Escalation" value={inputs.inflationPct} min={0.01} max={0.05} step={0.005}
            onChange={v => set('inflationPct', v)} fmt={v => (v * 100).toFixed(1) + '%'} />
          <SliderRow label="Insurance (% asset value)" value={inputs.insurancePct} min={0.002} max={0.008} step={0.001}
            onChange={v => set('insurancePct', v)} fmt={v => (v * 100).toFixed(1) + '%'} />
          <SliderRow label="Target DSCR" value={inputs.targetDscr} min={1.10} max={1.60} step={0.05}
            onChange={v => set('targetDscr', v)} fmt={v => v.toFixed(2) + 'x'} />
          <div style={{ marginTop: 14, display: 'flex', gap: 20 }}>
            <label style={{ fontSize: 12, color: T.text, display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={inputs.domesticContent}
                onChange={e => set('domesticContent', e.target.checked)} />
              Domestic Content Adder (+10% ITC)
            </label>
            <label style={{ fontSize: 12, color: T.text, display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={inputs.energyCommunity}
                onChange={e => set('energyCommunity', e.target.checked)} />
              Energy Community Adder (+10% ITC)
            </label>
          </div>
        </div>
      </div>

      {/* Auto-computed summary */}
      <SectionTitle>Auto-Computed Project Summary</SectionTitle>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
        <KpiCard label="Total CAPEX" value={fmtM(model.totalCapexM)} sub="($M)" />
        <KpiCard label="Annual Generation" value={(model.p50Annual / 1000).toFixed(0) + ' GWh'} sub="P50, Year 1" color={T.green} />
        <KpiCard label="Annual Revenue (Y1)" value={fmtM(model.annualRevM)} sub="PPA revenue" color={T.blue} />
        <KpiCard label="Equity Investment" value={fmtM(model.equityAmountM)} sub="After ITC" color={T.indigo} />
        <KpiCard label="Debt Amount" value={fmtM(model.debtAmountM)} sub={`${(inputs.debtPct * 100).toFixed(0)}% leverage`} />
        <KpiCard label="Effective ITC" value={(model.effITC * 100).toFixed(0) + '%'} sub={fmtM(model.itcAmountM)} color={T.amber} />
      </div>

      {/* Validation warnings */}
      {model.minDscr < 1.20 && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 6, padding: '10px 14px', marginBottom: 10, color: T.red, fontSize: 12 }}>
          WARNING: Minimum DSCR {model.minDscr.toFixed(2)}x is below 1.20x — lenders will require restructuring or equity injection.
        </div>
      )}
      {model.equityIRR < 0.08 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 6, padding: '10px 14px', marginBottom: 10, color: T.amber, fontSize: 12 }}>
          WARNING: Equity IRR {fmtPct(model.equityIRR)} is below the typical 8% fund hurdle rate.
        </div>
      )}

      <SectionTitle>Project Data Table (20 Line Items)</SectionTitle>
      <DataTable
        headers={['Parameter', 'Value', 'Unit / Notes']}
        rows={[
          ['DC Capacity',                   inputs.capacityMW.toFixed(0),                          'MW'],
          ['AC Capacity (est.)',             (inputs.capacityMW * 0.87).toFixed(1),                 'MW AC (DC:AC = 1.15)'],
          ['Capacity Factor',               (inputs.capacityFactor * 100).toFixed(1) + '%',        '—'],
          ['Year-1 Gross Generation (P50)', (model.p50Annual / 1000).toFixed(1),                   'GWh'],
          ['Year-1 Net Generation',         (model.p50Annual * 0.97 / 1000).toFixed(1),            'GWh (97% availability)'],
          ['Total CAPEX',                   model.totalCapexM.toFixed(1),                          '$M'],
          ['CAPEX per Watt DC',             '$' + inputs.capexPerW.toFixed(2),                     '$/W DC'],
          ['Effective ITC Rate',            (model.effITC * 100).toFixed(0) + '%',                 'Base + adders'],
          ['ITC Amount',                    model.itcAmountM.toFixed(1),                           '$M (cash in Year 1)'],
          ['MACRS Tax Shield PV',           model.macrsTaxShield.toFixed(1),                       '$M PV at discount rate'],
          ['Debt Amount',                   model.debtAmountM.toFixed(1),                          '$M'],
          ['Equity Investment',             model.equityAmountM.toFixed(1),                        '$M (net of ITC)'],
          ['Annual Debt Service',           model.annualDS.toFixed(2),                             '$M/yr (level annuity)'],
          ['O&M Year 1',                    (inputs.capacityMW * inputs.omPerKwYr / 1e6).toFixed(2), '$M'],
          ['Land Lease Year 1',             (inputs.projectAcres * inputs.landLeasePerAcre / 1e6).toFixed(2), '$M'],
          ['LCOE',                          model.lcoe.toFixed(2),                                 '$/MWh (real, discounted)'],
          ['P90 Annual Generation',         (model.p90Annual / 1000).toFixed(1),                   'GWh (lenders case)'],
          ['PPA Price',                     '$' + inputs.ppaPriceMWh.toFixed(0),                   '$/MWh'],
          ['Project Life',                  inputs.projectLifeYr.toFixed(0),                       'Years'],
          ['DSRA Requirement',              model.dsraM.toFixed(2),                                '$M (6-month DS reserve)'],
        ]}
      />
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 2 — Cash Flow Engine
  // ══════════════════════════════════════════════════════════════════════════
  const renderTab1 = () => {
    let cumDist = 0;
    const rows = model.table.map(r => {
      cumDist += r.equDistM;
      return [
        'Y' + r.yr,
        (r.grossGen / 1000).toFixed(1),
        (r.netGen / 1000).toFixed(1),
        r.revenueM.toFixed(2),
        r.omM.toFixed(2),
        r.landM.toFixed(2),
        r.insM.toFixed(2),
        r.gaM.toFixed(2),
        r.ebitdaM.toFixed(2),
        r.dsM.toFixed(2),
        r.cfadsM.toFixed(2),
        r.taxM.toFixed(2),
        r.netIncM.toFixed(2),
        r.equDistM.toFixed(2),
        cumDist.toFixed(2),
      ];
    });
    const totalRev  = model.table.reduce((s, r) => s + r.revenueM, 0);
    const totalDist = model.table.reduce((s, r) => s + r.equDistM, 0) + model.itcAmountM;

    return (
      <div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
          <KpiCard label="Total Revenue (30yr)" value={fmtM(totalRev)} color={T.green} />
          <KpiCard label="Total Equity Distributions" value={fmtM(totalDist)} color={T.blue} />
          <KpiCard label="MOIC" value={fmtX(model.moic)} color={T.indigo} />
          <KpiCard label="Equity IRR" value={fmtPct(model.equityIRR)} color={model.equityIRR > 0.10 ? T.green : T.amber} />
        </div>
        <div style={{ maxHeight: 540, overflowY: 'auto' }}>
          <DataTable
            headers={['Year', 'Gross Gen (GWh)', 'Net Gen (GWh)', 'Revenue ($M)', 'O&M ($M)', 'Land ($M)', 'Ins ($M)', 'G&A ($M)', 'EBITDA ($M)', 'Debt Svc ($M)', 'CFADS ($M)', 'Tax ($M)', 'Net Inc ($M)', 'Equity Dist ($M)', 'Cum Dist ($M)']}
            rows={rows}
            colorFn={(cell, ci) => {
              if (ci === 0) return T.sub;
              const n = parseFloat(cell);
              if (ci === 14) return n >= 0 ? T.green : T.red;
              if (ci === 13) return n > 0 ? T.green : T.amber;
              if (ci === 10) return n >= 0 ? T.teal : T.red;
              return T.text;
            }}
          />
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 3 — Returns Analysis
  // ══════════════════════════════════════════════════════════════════════════
  const renderTab2 = () => {
    const discRates = [0.05, 0.06, 0.07, 0.08, 0.09, 0.10, 0.11, 0.12, 0.13, 0.14, 0.15];
    const npvSens = discRates.map(r => ({
      rate: (r * 100).toFixed(0) + '%',
      npv: parseFloat(calcNPV(r, model.equityCFs).toFixed(1)),
    }));

    const distChart = model.table.slice(0, 20).map(r => ({
      yr: 'Y' + r.yr,
      dist: parseFloat(r.equDistM.toFixed(2)),
    }));

    const levBenefit  = model.equityIRR - model.projectIRR;
    const itcLift     = Math.min(0.04, model.itcAmountM / Math.max(1, model.equityAmountM) * 0.40);
    const macrsLift   = Math.min(0.015, model.macrsTaxShield / Math.max(1, model.equityAmountM) * 0.10);
    const degDrag     = inputs.degradationPct * 0.08;

    return (
      <div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
          <KpiCard label="Equity IRR" value={fmtPct(model.equityIRR)} sub="Levered, after-tax" color={model.equityIRR > 0.10 ? T.green : T.amber} />
          <KpiCard label="Project IRR" value={fmtPct(model.projectIRR)} sub="Unlevered, pre-tax" color={T.blue} />
          <KpiCard label="NPV" value={fmtM(model.npvM)} sub={`at ${(inputs.discountRatePct * 100).toFixed(1)}% discount`} color={model.npvM > 0 ? T.green : T.red} />
          <KpiCard label="MOIC" value={fmtX(model.moic)} sub="Multiple on invested capital" color={T.indigo} />
          <KpiCard label="Payback" value={model.payback + ' yrs'} color={T.teal} />
          <KpiCard label="LCOE" value={'$' + model.lcoe.toFixed(2) + '/MWh'} color={T.accent} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <SectionTitle>IRR Decomposition</SectionTitle>
            <DataTable
              headers={['Component', 'Contribution']}
              rows={[
                ['Unlevered Project Return',     fmtPct(model.projectIRR)],
                ['Leverage Benefit',              '+' + fmtPct(Math.max(0, levBenefit))],
                ['ITC Benefit (est.)',            '+' + fmtPct(itcLift)],
                ['MACRS Tax Shield (est.)',       '+' + fmtPct(macrsLift)],
                ['Degradation Drag (est.)',       '-' + fmtPct(degDrag)],
                ['Equity IRR',                    fmtPct(model.equityIRR)],
              ]}
            />
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <SectionTitle>Benchmark Comparison</SectionTitle>
            <DataTable
              headers={['Strategy', 'Typical Range', 'This Project']}
              rows={[
                ['Unlevered Solar',    '7–9%',   fmtPct(model.projectIRR)],
                ['Levered Solar',      '10–15%', fmtPct(model.equityIRR)],
                ['Wind (Levered)',     '8–12%',  '—'],
                ['BESS (Levered)',     '9–14%',  '—'],
                ['S&P 500 Avg (10yr)', '~10%',   '—'],
              ]}
              colorFn={(cell, ci, ri) => {
                if (ci === 2 && ri === 0) return model.projectIRR > 0.09 ? T.green : T.amber;
                if (ci === 2 && ri === 1) return model.equityIRR > 0.10 ? T.green : T.amber;
                return T.text;
              }}
            />
          </div>
        </div>

        <SectionTitle>NPV Sensitivity to Discount Rate</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={npvSens}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="rate" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={v => ['$' + v + 'M', 'NPV']} />
            <ReferenceLine y={0} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Break-even', fontSize: 10, position: 'insideRight' }} />
            <Line type="monotone" dataKey="npv" stroke={SOLAR_GOLD} strokeWidth={2} dot={{ r: 3 }} name="NPV ($M)" />
          </LineChart>
        </ResponsiveContainer>

        <SectionTitle>Equity Distributions — First 20 Years ($M)</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={distChart}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="yr" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={v => ['$' + v + 'M', 'Distribution']} />
            <Area type="monotone" dataKey="dist" stroke={SOLAR_GOLD} fill="#FEF3C7" strokeWidth={2} name="Equity Dist" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 4 — DSCR & Debt Sizing
  // ══════════════════════════════════════════════════════════════════════════
  const renderTab3 = () => {
    const dscrData = model.table
      .filter(r => r.dscr !== null)
      .map(r => ({ yr: 'Y' + r.yr, dscr: parseFloat(r.dscr.toFixed(3)) }));

    // Debt capacity at different covenants
    const minEbitda = Math.min(...model.table.filter(r => r.yr <= inputs.debtTenorYr).map(r => r.ebitdaM));
    const afFactor  = inputs.debtRatePct > 0
      ? Math.pow(1 + inputs.debtRatePct, inputs.debtTenorYr)
        / (inputs.debtRatePct * Math.pow(1 + inputs.debtRatePct, inputs.debtTenorYr))
      : 0;
    const debtCapRows = [1.25, 1.30, 1.35, 1.40].map(cov => {
      const maxDS   = minEbitda / cov;
      const maxDebt = maxDS * afFactor;
      const maxLev  = model.totalCapexM > 0 ? maxDebt / model.totalCapexM : 0;
      return [cov.toFixed(2) + 'x', fmtM(maxDebt), (maxLev * 100).toFixed(1) + '%', fmtM(maxDS)];
    });

    // Interest rate sensitivity
    const rateSensRows = [-0.02, -0.01, 0, 0.01, 0.02].map(delta => {
      const rate = Math.max(0.001, inputs.debtRatePct + delta);
      const ds   = model.debtAmountM * rate
        * Math.pow(1 + rate, inputs.debtTenorYr)
        / (Math.pow(1 + rate, inputs.debtTenorYr) - 1);
      const minDscrSens = ds > 0 ? minEbitda / ds : 0;
      return [
        (delta >= 0 ? '+' : '') + Math.round(delta * 10000) + 'bps',
        minDscrSens.toFixed(2) + 'x',
        fmtM(ds),
      ];
    });

    return (
      <div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
          <KpiCard label="Min DSCR" value={fmtX(model.minDscr)} sub="Worst debt-service year" color={model.minDscr >= inputs.targetDscr ? T.green : T.red} />
          <KpiCard label="Avg DSCR" value={fmtX(model.avgDscr)} sub={`${inputs.debtTenorYr}-yr debt period`} color={T.blue} />
          <KpiCard label="LLCR" value={fmtX(model.llcr)} sub="Loan Life Coverage Ratio" color={T.teal} />
          <KpiCard label="PLCR" value={fmtX(model.plcr)} sub="Project Life Coverage Ratio" color={T.indigo} />
          <KpiCard label="DSRA (6-month)" value={fmtM(model.dsraM)} sub="Debt Service Reserve Account" />
        </div>

        <SectionTitle>Annual DSCR — Debt Period ({inputs.debtTenorYr} Years)</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dscrData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="yr" tick={{ fontSize: 9 }} />
            <YAxis domain={[0, 2.5]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={v => [v + 'x', 'DSCR']} />
            <ReferenceLine y={inputs.targetDscr} stroke={T.red} strokeDasharray="5 5"
              label={{ value: 'Covenant ' + inputs.targetDscr.toFixed(2) + 'x', fontSize: 10, position: 'insideTopRight' }} />
            <ReferenceLine y={1.20} stroke="#FCA5A5" strokeDasharray="3 3" />
            <Bar dataKey="dscr" fill={SOLAR_GOLD} radius={[3, 3, 0, 0]} name="DSCR" />
          </BarChart>
        </ResponsiveContainer>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <div>
            <SectionTitle>Debt Capacity by DSCR Covenant</SectionTitle>
            <DataTable
              headers={['DSCR Floor', 'Max Debt ($M)', 'Max Leverage', 'Max Annual DS']}
              rows={debtCapRows}
              colorFn={(cell, ci, ri) => {
                if (ci === 2) {
                  const n = parseFloat(cell);
                  return n > 75 ? T.red : n > 65 ? T.amber : T.green;
                }
                return T.text;
              }}
            />
            <div style={{ fontSize: 11, color: T.sub, marginTop: 8 }}>
              LLCR = PV(CFADS over debt life) / Outstanding Debt.
              PLCR = PV(CFADS over project life) / Outstanding Debt.
            </div>
          </div>
          <div>
            <SectionTitle>Interest Rate Sensitivity (Min DSCR)</SectionTitle>
            <DataTable
              headers={['Rate Shift', 'Min DSCR', 'Annual Debt Service']}
              rows={rateSensRows}
              colorFn={(cell, ci) => {
                if (ci === 1) {
                  const n = parseFloat(cell);
                  return n >= inputs.targetDscr ? T.green : n >= 1.20 ? T.amber : T.red;
                }
                return T.text;
              }}
            />
          </div>
        </div>

        <SectionTitle>Debt Sculpting — Flat vs DSCR-Sculpted Comparison</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>Flat Amortisation (Current Model)</div>
            <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.8 }}>
              Level annuity: equal annual debt service of {fmtM(model.annualDS)}/yr.
              Min DSCR: {fmtX(model.minDscr)} in Year {model.table.filter(r => r.dscr !== null).find(r => r.dscr === model.minDscr)?.yr ?? '—'}.
              Simple to document; lenders prefer for straightforward assets.
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>DSCR-Sculpted Amortisation (Alternative)</div>
            <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.8 }}>
              Debt service scaled to EBITDA each year, maintaining constant DSCR of {inputs.targetDscr.toFixed(2)}x.
              Allows higher early distributions when EBITDA is highest.
              Results in higher equity IRR by ~0.3–0.8pp but requires cash flow waterfall model.
              Estimated sculpted DS Year 1: {fmtM(model.table[0] ? model.table[0].ebitdaM / inputs.targetDscr : 0)}/yr.
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 5 — Tax Credit Modeling (IRA 2022)
  // ══════════════════════════════════════════════════════════════════════════
  const renderTab4 = () => {
    const ptcPerMwh = 27.5; // $/MWh IRA base PTC (2024 indexed)
    const ptcNpv = model.table.slice(0, 10).reduce((s, r, i) => {
      const gen = model.p50Annual * Math.pow(1 - inputs.degradationPct / 100, i) * 0.97;
      return s + gen * ptcPerMwh / 1e6 / Math.pow(1 + inputs.discountRatePct, i + 1);
    }, 0);

    const macrsRows = MACRS5.map((rate, i) => {
      const deprM  = model.depreciableBasis * rate;
      const saving = deprM * inputs.taxRatePct;
      const pv     = saving / Math.pow(1 + inputs.discountRatePct, i + 1);
      return [`Year ${i + 1}`, (rate * 100).toFixed(2) + '%', fmtM(deprM), fmtM(saving), fmtM(pv)];
    });
    const totalMacrsPv = MACRS5.reduce((s, rate, i) =>
      s + model.depreciableBasis * rate * inputs.taxRatePct / Math.pow(1 + inputs.discountRatePct, i + 1), 0);
    macrsRows.push(['Total', '100.00%', fmtM(model.depreciableBasis), fmtM(model.depreciableBasis * inputs.taxRatePct), fmtM(totalMacrsPv)]);

    const itcRows = [
      ['Base ITC (PWA compliant)', (inputs.itcPct * 100).toFixed(0) + '%', 'Prevailing wage & apprenticeship requirement met'],
      ['Base ITC (non-PWA)', '6%', 'If PWA requirements not met — penalty rate'],
      ['Domestic Content Adder', inputs.domesticContent ? '+10%' : '(not elected)', 'All steel/iron US-made; 40%+ domestic manufactured content'],
      ['Energy Community Adder', inputs.energyCommunity ? '+10%' : '(not elected)', 'Brownfield, coal closure, or fossil fuel employment area'],
      ['Low-Income Bonus', '+10–20%', 'Qualified/targeted LIH projects (not modeled)'],
      ['Effective ITC (this project)', (model.effITC * 100).toFixed(0) + '%', fmtM(model.itcAmountM) + ' — received in Year 1'],
    ];

    const teRows = [
      ['Partnership Flip', 'Tax equity takes 99% of losses/credits until ROE flip', '~6–8% tax equity yield', 'Flip trigger risk; complexity'],
      ['Inverted Lease', 'Developer leases system; tax equity monetizes ITC+MACRS', '6–7% lease rate', 'Must own asset; lessee credit risk'],
      ['Sale-Leaseback', 'Developer sells to tax equity; leases back for operations', 'Immediate ITC monetization', 'Asset transfer; residual value'],
    ];

    // ITC vs PTC bar chart data
    const itcPtcData = [
      { name: 'ITC Amount', value: parseFloat(model.itcAmountM.toFixed(1)) },
      { name: 'PTC NPV (10yr)', value: parseFloat(ptcNpv.toFixed(1)) },
      { name: 'MACRS Shield PV', value: parseFloat(model.macrsTaxShield.toFixed(1)) },
    ];

    return (
      <div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
          <KpiCard label="ITC Amount" value={fmtM(model.itcAmountM)} sub={`${(model.effITC * 100).toFixed(0)}% of eligible basis`} color={T.green} />
          <KpiCard label="PTC NPV (10yr)" value={fmtM(ptcNpv)} sub="$27.5/MWh × gen × 10yr" color={T.blue} />
          <KpiCard label="Recommendation" value={model.itcAmountM >= ptcNpv ? 'ELECT ITC' : 'ELECT PTC'}
            sub={model.itcAmountM >= ptcNpv ? 'ITC NPV exceeds PTC stream' : 'PTC stream exceeds ITC'}
            color={T.indigo} />
          <KpiCard label="Total IRA Benefit" value={fmtM(model.itcAmountM + model.macrsTaxShield)} sub="ITC + MACRS PV shield" color={T.amber} />
        </div>

        <SectionTitle>ITC vs PTC Comparison ($M)</SectionTitle>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={itcPtcData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
            <Tooltip formatter={v => ['$' + v + 'M', 'Value']} />
            <Bar dataKey="value" fill={SOLAR_GOLD} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <SectionTitle>ITC Adder Breakdown — IRA 2022</SectionTitle>
        <DataTable headers={['Component', 'Rate', 'Eligibility']} rows={itcRows} />

        <SectionTitle>MACRS 5-Year Depreciation Schedule</SectionTitle>
        <DataTable headers={['Year', 'MACRS Rate', 'Depreciation ($M)', 'Tax Saving ($M)', 'PV of Tax Saving ($M)']} rows={macrsRows} />
        <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>
          Depreciable basis = {fmtM(model.depreciableBasis)} (Total CAPEX reduced by 50% of ITC per IRS Rev. Proc. 2023-29).
          PV discounted at {(inputs.discountRatePct * 100).toFixed(1)}%.
        </div>

        <SectionTitle>Tax Equity Structure Comparison</SectionTitle>
        <DataTable headers={['Structure', 'Mechanism', 'Tax Equity Cost', 'Key Risk']} rows={teRows} />
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 6 — Energy Yield P50/P90
  // ══════════════════════════════════════════════════════════════════════════
  const renderTab5 = () => {
    // Monte Carlo: 1,000 sr()-seeded runs using CLT approximation
    const MC = 1000;
    const yieldRuns = Array.from({ length: MC }, (_, i) => {
      // Sum 4 uniform sr() draws → approx normal via CLT
      const z = (sr(i * 7) + sr(i * 13) + sr(i * 31) + sr(i * 53) - 2) / Math.sqrt(4 / 12);
      return model.p50Annual * (1 + inputs.yieldSigma * z);
    });
    const sorted = [...yieldRuns].sort((a, b) => a - b);
    const p1  = sorted[Math.floor(MC * 0.01)];
    const p10 = sorted[Math.floor(MC * 0.10)];
    const p50 = sorted[Math.floor(MC * 0.50)];
    const p90 = sorted[Math.floor(MC * 0.90)];
    const p99 = sorted[Math.floor(MC * 0.99)];

    const revP90 = p90 * inputs.ppaPriceMWh / 1e6;
    const revP50 = p50 * inputs.ppaPriceMWh / 1e6;
    const r0 = model.table[0] ?? {};
    const costs0 = (r0.omM ?? 0) + (r0.landM ?? 0) + (r0.insM ?? 0) + (r0.gaM ?? 0);
    const dscrP90 = model.annualDS > 0 ? (revP90 - costs0) / model.annualDS : 0;
    const dscrP50 = model.annualDS > 0 ? (revP50 - costs0) / model.annualDS : 0;

    // 25-year fan chart
    const fanData = Array.from({ length: 25 }, (_, i) => ({
      yr: 'Y' + (i + 1),
      p10: parseFloat((p10 * Math.pow(1 - inputs.degradationPct / 100, i) / 1000).toFixed(1)),
      p50: parseFloat((p50 * Math.pow(1 - inputs.degradationPct / 100, i) / 1000).toFixed(1)),
      p90: parseFloat((p90 * Math.pow(1 - inputs.degradationPct / 100, i) / 1000).toFixed(1)),
    }));

    const uncertRows = [
      ['Resource (GHI) Uncertainty',    '5.0%', 'Satellite + ground station correlation'],
      ['Performance Ratio',              '4.0%', 'Module efficiency, inverter, soiling, shading'],
      ['Interannual Variability',        '3.5%', 'Year-to-year climate variation'],
      ['Degradation Uncertainty',        '3.0%', 'Module performance trajectory'],
      ['Availability',                   '2.0%', 'Planned & unplanned downtime'],
      ['Curtailment',                    '2.0%', 'Grid curtailment risk'],
      ['Combined σ (RSS)',               (inputs.yieldSigma * 100).toFixed(1) + '%', 'Root-sum-square of independent uncertainties'],
    ];

    return (
      <div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
          <KpiCard label="P10 (Optimistic)" value={(p10 / 1000).toFixed(0) + ' GWh'} color={T.green} sub="10th percentile" />
          <KpiCard label="P50 (Base Case)" value={(p50 / 1000).toFixed(0) + ' GWh'} color={T.blue} sub="Median / most likely" />
          <KpiCard label="P90 (Lenders' Case)" value={(p90 / 1000).toFixed(0) + ' GWh'} color={T.amber} sub="90th percentile" />
          <KpiCard label="P99 (Stress)" value={(p99 / 1000).toFixed(0) + ' GWh'} color={T.red} sub="1-in-100 downside" />
        </div>

        <SectionTitle>25-Year Production Fan Chart — GWh (P10 / P50 / P90)</SectionTitle>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={fanData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="yr" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="p10" stroke={T.green} fill="#D1FAE5" strokeWidth={1.5} name="P10" />
            <Area type="monotone" dataKey="p50" stroke={SOLAR_GOLD} fill="#FEF3C7" strokeWidth={2} name="P50" />
            <Area type="monotone" dataKey="p90" stroke={T.red} fill="#FEE2E2" strokeWidth={1.5} name="P90" />
            <Legend />
          </AreaChart>
        </ResponsiveContainer>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <div>
            <SectionTitle>Uncertainty Decomposition</SectionTitle>
            <DataTable headers={['Source', 'Uncertainty', 'Basis']} rows={uncertRows} />
          </div>
          <div>
            <SectionTitle>P90 vs P50 Financial Impact</SectionTitle>
            <DataTable
              headers={['Metric', 'P50 Base', 'P90 Lenders']}
              rows={[
                ['Annual Generation (GWh)', (p50 / 1000).toFixed(0), (p90 / 1000).toFixed(0)],
                ['Annual Revenue ($M)',     fmtM(revP50),            fmtM(revP90)],
                ['Revenue Delta',           '—',                     fmtM(revP90 - revP50)],
                ['Year-1 DSCR (approx.)',   dscrP50.toFixed(2) + 'x', dscrP90.toFixed(2) + 'x'],
                ['vs Covenant',             dscrP50 >= inputs.targetDscr ? 'PASS' : 'FAIL',
                                            dscrP90 >= inputs.targetDscr ? 'PASS' : 'FAIL'],
                ['Monte Carlo Runs',        '1,000 (sr-seeded)', '—'],
              ]}
              colorFn={cell => cell === 'PASS' ? T.green : cell === 'FAIL' ? T.red : T.text}
            />
          </div>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 7 — Sensitivity Analysis
  // ══════════════════════════════════════════════════════════════════════════
  function quickIRR(overrides) {
    const inp = { ...inputs, ...overrides };
    const totalCapex = inp.capacityMW * 1000 * inp.capexPerW / 1e6;
    const effITC     = inp.itcPct + (inp.domesticContent ? 0.10 : 0) + (inp.energyCommunity ? 0.10 : 0);
    const itcAmt     = effITC * totalCapex;
    const debtAmt    = inp.debtPct * (totalCapex - itcAmt);
    const equity     = totalCapex - debtAmt - itcAmt;
    const ds         = debtAmt > 0
      ? debtAmt * inp.debtRatePct * Math.pow(1 + inp.debtRatePct, inp.debtTenorYr)
        / (Math.pow(1 + inp.debtRatePct, inp.debtTenorYr) - 1) : 0;
    const p50        = inp.capacityMW * 1000 * inp.capacityFactor * 8760;
    const deprBasis  = totalCapex * (1 - effITC / 2);
    const cfs        = [-equity, itcAmt];
    for (let yr = 1; yr <= inp.projectLifeYr; yr++) {
      const deg    = Math.pow(1 - inp.degradationPct / 100, yr - 1);
      const gen    = p50 * deg * 0.97;
      const rev    = gen * (yr <= inp.ppaTenorYr ? inp.ppaPriceMWh : inp.ppaPriceMWh * 0.8) / 1e6;
      const om     = inp.capacityMW * inp.omPerKwYr * Math.pow(1 + inp.inflationPct, yr - 1) / 1e6;
      const land   = inp.projectAcres * inp.landLeasePerAcre * Math.pow(1 + inp.inflationPct, yr - 1) / 1e6;
      const ins    = totalCapex * inp.insurancePct;
      const ga     = 0.5;
      const ebitda = rev - om - land - ins - ga;
      const dsYr   = yr <= inp.debtTenorYr ? ds : 0;
      const deprYr = yr <= 6 ? deprBasis * MACRS5[yr - 1] : 0;
      const int    = dsYr > 0 ? debtAmt * inp.debtRatePct : 0;
      const tax    = Math.max(0, ebitda - int - deprYr) * inp.taxRatePct;
      const net    = Math.max(0, ebitda - dsYr - tax);
      if (yr === 1) cfs[1] += net; else cfs.push(net);
    }
    return calcIRR(cfs);
  }

  const renderTab6 = () => {
    const base = model.equityIRR;
    const vars = [
      { label: 'PPA Price',       key: 'ppaPriceMWh',   d: inputs.ppaPriceMWh * 0.10,   cost: false },
      { label: 'Capacity Factor', key: 'capacityFactor', d: inputs.capacityFactor * 0.10, cost: false },
      { label: 'CAPEX ($/W)',     key: 'capexPerW',      d: inputs.capexPerW * 0.10,      cost: true  },
      { label: 'O&M Cost',        key: 'omPerKwYr',      d: inputs.omPerKwYr * 0.10,      cost: true  },
      { label: 'Debt Rate',       key: 'debtRatePct',    d: inputs.debtRatePct * 0.10,    cost: true  },
      { label: 'Degradation',     key: 'degradationPct', d: inputs.degradationPct * 0.10, cost: true  },
      { label: 'Leverage (D/C)',  key: 'debtPct',        d: inputs.debtPct * 0.10,        cost: false },
      { label: 'Tax Rate',        key: 'taxRatePct',     d: inputs.taxRatePct * 0.10,     cost: true  },
    ];

    const tornado = [...vars].map(v => {
      const upVal  = v.cost ? inputs[v.key] - v.d : inputs[v.key] + v.d;
      const dnVal  = v.cost ? inputs[v.key] + v.d : inputs[v.key] - v.d;
      const up     = quickIRR({ [v.key]: Math.max(0.001, upVal) });
      const dn     = quickIRR({ [v.key]: Math.max(0.001, dnVal) });
      return {
        label: v.label,
        up:    parseFloat(((up - base) * 100).toFixed(2)),
        down:  parseFloat(((dn - base) * 100).toFixed(2)),
        range: Math.abs(up - dn),
      };
    }).sort((a, b) => b.range - a.range);

    // 2-way: CAPEX × CF → IRR grid
    const cxRange = [0.70, 0.78, 0.85, 0.93, 1.00];
    const cfRange = [0.17, 0.19, 0.215, 0.24, 0.26];
    const grid = cfRange.map(cf =>
      cxRange.map(cx => (quickIRR({ capexPerW: cx, capacityFactor: cf }) * 100).toFixed(1) + '%')
    );

    return (
      <div>
        <SectionTitle>Tornado Chart — Equity IRR Sensitivity to ±10% Each Variable</SectionTitle>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={tornado} layout="vertical" margin={{ left: 130, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" tick={{ fontSize: 10 }} unit="%" />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={130} />
            <Tooltip formatter={v => [v + '% IRR change']} />
            <ReferenceLine x={0} stroke={T.text} strokeWidth={1.5} />
            <Bar dataKey="up"   fill={T.green} name="Upside"   />
            <Bar dataKey="down" fill={T.red}   name="Downside" />
            <Legend />
          </BarChart>
        </ResponsiveContainer>

        <SectionTitle>Two-Way Sensitivity: CAPEX ($/W) × Capacity Factor → Equity IRR</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 11, marginBottom: 16 }}>
            <thead>
              <tr style={{ background: HEADER_BG }}>
                <th style={{ padding: '6px 12px', color: '#F1F5F9', textAlign: 'left' }}>CF \ CAPEX</th>
                {cxRange.map(cx => (
                  <th key={cx} style={{ padding: '6px 12px', color: '#F1F5F9', textAlign: 'center' }}>
                    ${cx.toFixed(2)}/W
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cfRange.map((cf, ri) => (
                <tr key={cf} style={{ background: ri % 2 === 0 ? T.card : '#F8F7F4' }}>
                  <td style={{ padding: '6px 12px', fontWeight: 600 }}>{(cf * 100).toFixed(1)}% CF</td>
                  {grid[ri].map((v, ci) => {
                    const n  = parseFloat(v);
                    const bg = n > 13 ? '#D1FAE5' : n > 10 ? '#FEF3C7' : '#FEE2E2';
                    return (
                      <td key={ci} style={{ padding: '6px 12px', textAlign: 'center', background: bg, fontFamily: 'monospace', fontWeight: 700 }}>
                        {v}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionTitle>Sensitivity Summary Table</SectionTitle>
        <DataTable
          headers={['Variable', 'Upside (+10%)', 'Downside (-10%)', 'Net IRR Swing']}
          rows={tornado.map(r => [
            r.label,
            (r.up >= 0 ? '+' : '') + r.up + '%',
            (r.down >= 0 ? '+' : '') + r.down + '%',
            (Math.abs(r.up) + Math.abs(r.down)).toFixed(2) + '% IRR',
          ])}
        />

        <SectionTitle>Two-Way Sensitivity: PPA Price × Leverage → Min DSCR</SectionTitle>
        {(() => {
          const ppaRange  = [30, 36, 42, 48, 55];
          const levRange  = [0.55, 0.63, 0.70, 0.78, 0.85];
          const dscrGrid  = ppaRange.map(ppa =>
            levRange.map(lev => {
              const totalCap = inputs.capacityMW * 1000 * inputs.capexPerW / 1e6;
              const effITC   = inputs.itcPct + (inputs.domesticContent ? 0.10 : 0) + (inputs.energyCommunity ? 0.10 : 0);
              const debtAmt  = lev * (totalCap - effITC * totalCap);
              const ds       = debtAmt > 0
                ? debtAmt * inputs.debtRatePct * Math.pow(1 + inputs.debtRatePct, inputs.debtTenorYr)
                  / (Math.pow(1 + inputs.debtRatePct, inputs.debtTenorYr) - 1) : 0;
              const gen      = inputs.capacityMW * 1000 * inputs.capacityFactor * 8760 * 0.97;
              const revM     = gen * ppa / 1e6;
              const omM      = inputs.capacityMW * inputs.omPerKwYr / 1e6;
              const landM    = inputs.projectAcres * inputs.landLeasePerAcre / 1e6;
              const insM     = totalCap * inputs.insurancePct;
              const gaM      = 0.5;
              const ebitda   = revM - omM - landM - insM - gaM;
              return ds > 0 ? (ebitda / ds).toFixed(2) + 'x' : '—';
            })
          );
          return (
            <div style={{ overflowX: 'auto', marginBottom: 20 }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: HEADER_BG }}>
                    <th style={{ padding: '6px 12px', color: '#F1F5F9', textAlign: 'left' }}>PPA \ Lev.</th>
                    {levRange.map(lev => (
                      <th key={lev} style={{ padding: '6px 12px', color: '#F1F5F9', textAlign: 'center' }}>
                        {(lev * 100).toFixed(0)}%
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ppaRange.map((ppa, ri) => (
                    <tr key={ppa} style={{ background: ri % 2 === 0 ? T.card : '#F8F7F4' }}>
                      <td style={{ padding: '6px 12px', fontWeight: 600 }}>${ppa}/MWh</td>
                      {dscrGrid[ri].map((v, ci) => {
                        const n  = parseFloat(v);
                        const bg = n >= 1.35 ? '#D1FAE5' : n >= 1.20 ? '#FEF3C7' : '#FEE2E2';
                        return (
                          <td key={ci} style={{ padding: '6px 12px', textAlign: 'center', background: bg, fontFamily: 'monospace', fontWeight: 700 }}>
                            {v}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}

        <SectionTitle>Key Variable Callouts</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: '1% CF improvement', delta: quickIRR({ capacityFactor: inputs.capacityFactor + 0.01 }) - model.equityIRR, desc: 'Additional IRR from +1% capacity factor' },
            { label: '$1/MWh PPA lift', delta: quickIRR({ ppaPriceMWh: inputs.ppaPriceMWh + 1 }) - model.equityIRR, desc: 'Additional IRR from $1/MWh higher PPA' },
            { label: '$0.05/W CAPEX cut', delta: quickIRR({ capexPerW: inputs.capexPerW - 0.05 }) - model.equityIRR, desc: 'Additional IRR from $0.05/W CAPEX reduction' },
            { label: '+5% leverage', delta: quickIRR({ debtPct: Math.min(0.85, inputs.debtPct + 0.05) }) - model.equityIRR, desc: 'Additional IRR from 5pp more debt' },
          ].map(c => (
            <div key={c.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 11, color: T.sub }}>{c.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace', color: c.delta >= 0 ? T.green : T.red, marginTop: 4 }}>
                {c.delta >= 0 ? '+' : ''}{(c.delta * 100).toFixed(2)}%
              </div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 8 — Scenario Engine
  // ══════════════════════════════════════════════════════════════════════════
  function runScenario(overrides) {
    const inp      = { ...inputs, ...overrides };
    const totalCap = inp.capacityMW * 1000 * inp.capexPerW / 1e6;
    const effITC   = inp.itcPct + (inp.domesticContent ? 0.10 : 0) + (inp.energyCommunity ? 0.10 : 0);
    const itcAmt   = effITC * totalCap;
    const debtAmt  = inp.debtPct * (totalCap - itcAmt);
    const equity   = totalCap - debtAmt - itcAmt;
    const ds       = debtAmt > 0
      ? debtAmt * inp.debtRatePct * Math.pow(1 + inp.debtRatePct, inp.debtTenorYr)
        / (Math.pow(1 + inp.debtRatePct, inp.debtTenorYr) - 1) : 0;
    const p50      = inp.capacityMW * 1000 * inp.capacityFactor * 8760;
    const deprBas  = totalCap * (1 - effITC / 2);
    const cfs      = [-equity, itcAmt];
    let minDscr    = Infinity;
    let totalDistS = 0;
    for (let yr = 1; yr <= inp.projectLifeYr; yr++) {
      const deg    = Math.pow(1 - inp.degradationPct / 100, yr - 1);
      const gen    = p50 * deg * 0.97;
      const rev    = gen * (yr <= inp.ppaTenorYr ? inp.ppaPriceMWh : inp.ppaPriceMWh * 0.8) / 1e6;
      const om     = inp.capacityMW * inp.omPerKwYr * Math.pow(1 + inp.inflationPct, yr - 1) / 1e6;
      const land   = inp.projectAcres * inp.landLeasePerAcre * Math.pow(1 + inp.inflationPct, yr - 1) / 1e6;
      const ins    = totalCap * inp.insurancePct;
      const ga     = 0.5;
      const ebitda = rev - om - land - ins - ga;
      const dsYr   = yr <= inp.debtTenorYr ? ds : 0;
      const dscr   = dsYr > 0 ? ebitda / dsYr : null;
      if (dscr !== null && dscr < minDscr) minDscr = dscr;
      const deprYr = yr <= 6 ? deprBas * MACRS5[yr - 1] : 0;
      const int    = dsYr > 0 ? debtAmt * inp.debtRatePct : 0;
      const tax    = Math.max(0, ebitda - int - deprYr) * inp.taxRatePct;
      const net    = Math.max(0, ebitda - dsYr - tax);
      totalDistS  += net;
      if (yr === 1) cfs[1] += net; else cfs.push(net);
    }
    const irr  = calcIRR(cfs);
    const npv  = calcNPV(inp.discountRatePct, cfs);
    const moic = equity > 0 ? (totalDistS + itcAmt) / equity : 0;
    // Unlevered IRR approx
    const projCFs = [-totalCap, ...Array.from({ length: inp.projectLifeYr }, (_, i) => {
      const yr  = i + 1;
      const gen = p50 * Math.pow(1 - inp.degradationPct / 100, i) * 0.97;
      return gen * (yr <= inp.ppaTenorYr ? inp.ppaPriceMWh : inp.ppaPriceMWh * 0.8) / 1e6;
    })];
    const projIRR = calcIRR(projCFs);
    const lcoe    = p50 > 0
      ? (totalCap * 1e6 + inp.capacityMW * inp.omPerKwYr * inp.projectLifeYr * 1000) / (p50 * inp.projectLifeYr * 0.97)
      : 0;
    return { irr, projIRR, minDscr: minDscr === Infinity ? 0 : minDscr, lcoe, npv, moic };
  }

  const renderTab7 = () => {
    const SCENARIOS = [
      { name: 'Base',         color: T.blue,   ov: {} },
      { name: 'Optimistic',   color: T.green,  ov: { capacityFactor: inputs.capacityFactor * 1.05, ppaPriceMWh: inputs.ppaPriceMWh + 5, capexPerW: inputs.capexPerW - 0.05 } },
      { name: 'Conservative', color: T.amber,  ov: { capacityFactor: inputs.capacityFactor * 0.95, capexPerW: inputs.capexPerW + 0.05 } },
      { name: 'Downside',     color: '#EA580C', ov: { capacityFactor: inputs.capacityFactor * 0.90, ppaPriceMWh: inputs.ppaPriceMWh - 8, capexPerW: inputs.capexPerW + 0.10, omPerKwYr: inputs.omPerKwYr * 1.20 } },
      { name: 'Stress',       color: T.red,    ov: { capacityFactor: inputs.capacityFactor * 0.85, ppaPriceMWh: inputs.ppaPriceMWh - 15, debtRatePct: inputs.debtRatePct + 0.015, itcPct: 0.06, domesticContent: false, energyCommunity: false } },
    ];
    const results = SCENARIOS.map(s => ({ ...s, ...runScenario(s.ov) }));

    const tl = (val, [hi, lo]) => {
      if (val >= hi) return { bg: '#D1FAE5', color: T.green };
      if (val >= lo) return { bg: '#FEF3C7', color: T.amber };
      return { bg: '#FEE2E2', color: T.red };
    };
    const tlLow = (val, [hi, lo]) => {
      if (val <= hi) return { bg: '#D1FAE5', color: T.green };
      if (val <= lo) return { bg: '#FEF3C7', color: T.amber };
      return { bg: '#FEE2E2', color: T.red };
    };

    const chartData = results.map(r => ({ name: r.name, irr: parseFloat((r.irr * 100).toFixed(2)) }));

    return (
      <div>
        <SectionTitle>5-Scenario Comparison (Traffic-Light)</SectionTitle>
        <div style={{ overflowX: 'auto', marginBottom: 20 }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
            <thead>
              <tr style={{ background: HEADER_BG }}>
                <th style={{ padding: '8px 14px', color: '#F1F5F9', textAlign: 'left' }}>Metric</th>
                {results.map(r => (
                  <th key={r.name} style={{ padding: '8px 14px', color: r.color, textAlign: 'center', fontWeight: 700 }}>{r.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Equity IRR',    vals: results.map(r => r.irr),     fmt: fmtPct,                thresholds: [0.12, 0.09],  rev: false },
                { label: 'Project IRR',   vals: results.map(r => r.projIRR), fmt: fmtPct,                thresholds: [0.09, 0.07],  rev: false },
                { label: 'Min DSCR',      vals: results.map(r => r.minDscr), fmt: v => v.toFixed(2)+'x', thresholds: [1.35, 1.20],  rev: false },
                { label: 'LCOE ($/MWh)',  vals: results.map(r => r.lcoe),    fmt: v => '$'+v.toFixed(2), thresholds: [30, 42],      rev: true  },
                { label: 'NPV ($M)',      vals: results.map(r => r.npv),     fmt: fmtM,                  thresholds: [10, 0],       rev: false },
                { label: 'MOIC',          vals: results.map(r => r.moic),    fmt: fmtX,                  thresholds: [2.0, 1.5],    rev: false },
              ].map((row, ri) => (
                <tr key={ri} style={{ background: ri % 2 === 0 ? T.card : '#F8F7F4' }}>
                  <td style={{ padding: '7px 14px', fontWeight: 600 }}>{row.label}</td>
                  {row.vals.map((v, ci) => {
                    const style = row.rev ? tlLow(v, row.thresholds) : tl(v, row.thresholds);
                    return (
                      <td key={ci} style={{ padding: '7px 14px', textAlign: 'center', ...style, fontFamily: 'monospace', fontWeight: 700 }}>
                        {row.fmt(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionTitle>Equity IRR by Scenario</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" />
            <Tooltip formatter={v => [v + '%', 'Equity IRR']} />
            <ReferenceLine y={10} stroke={T.red} strokeDasharray="4 4" label={{ value: '10% hurdle', fontSize: 10 }} />
            <Bar dataKey="irr" fill={SOLAR_GOLD} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <SectionTitle>Scenario Assumption Matrix</SectionTitle>
        <DataTable
          headers={['Assumption', 'Base', 'Optimistic', 'Conservative', 'Downside', 'Stress']}
          rows={[
            ['Capacity Factor',    (inputs.capacityFactor * 100).toFixed(1) + '%',
              (inputs.capacityFactor * 1.05 * 100).toFixed(1) + '%',
              (inputs.capacityFactor * 0.95 * 100).toFixed(1) + '%',
              (inputs.capacityFactor * 0.90 * 100).toFixed(1) + '%',
              (inputs.capacityFactor * 0.85 * 100).toFixed(1) + '%'],
            ['PPA Price ($/MWh)',  '$' + inputs.ppaPriceMWh,
              '$' + (inputs.ppaPriceMWh + 5),
              '$' + inputs.ppaPriceMWh,
              '$' + (inputs.ppaPriceMWh - 8),
              '$' + (inputs.ppaPriceMWh - 15)],
            ['CAPEX ($/W)',        '$' + inputs.capexPerW.toFixed(2),
              '$' + (inputs.capexPerW - 0.05).toFixed(2),
              '$' + (inputs.capexPerW + 0.05).toFixed(2),
              '$' + (inputs.capexPerW + 0.10).toFixed(2),
              '$' + inputs.capexPerW.toFixed(2)],
            ['O&M Escalation',    'Base', 'Base', 'Base', '+20%', 'Base'],
            ['Debt Rate',         (inputs.debtRatePct * 100).toFixed(2) + '%', 'Same', 'Same', 'Same',
              (( inputs.debtRatePct + 0.015) * 100).toFixed(2) + '%'],
            ['ITC Rate',          (model.effITC * 100).toFixed(0) + '%', 'Same', 'Same', 'Same', '6%'],
            ['Domestic Content',  inputs.domesticContent ? 'Yes' : 'No', 'Same', 'Same', 'Same', 'No'],
          ]}
        />

        <SectionTitle>Probability-Weighted Expected IRR</SectionTitle>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          {(() => {
            const scenResults = [
              { name: 'Optimistic',   prob: 0.15, ov: { capacityFactor: inputs.capacityFactor * 1.05, ppaPriceMWh: inputs.ppaPriceMWh + 5, capexPerW: inputs.capexPerW - 0.05 } },
              { name: 'Base',         prob: 0.40, ov: {} },
              { name: 'Conservative', prob: 0.25, ov: { capacityFactor: inputs.capacityFactor * 0.95, capexPerW: inputs.capexPerW + 0.05 } },
              { name: 'Downside',     prob: 0.15, ov: { capacityFactor: inputs.capacityFactor * 0.90, ppaPriceMWh: inputs.ppaPriceMWh - 8, capexPerW: inputs.capexPerW + 0.10, omPerKwYr: inputs.omPerKwYr * 1.20 } },
              { name: 'Stress',       prob: 0.05, ov: { capacityFactor: inputs.capacityFactor * 0.85, ppaPriceMWh: inputs.ppaPriceMWh - 15, debtRatePct: inputs.debtRatePct + 0.015, itcPct: 0.06, domesticContent: false, energyCommunity: false } },
            ];
            const wtdIRR = scenResults.reduce((s, sc) => s + sc.prob * runScenario(sc.ov).irr, 0);
            return (
              <div>
                <DataTable
                  headers={['Scenario', 'Probability', 'Equity IRR', 'Weighted Contribution']}
                  rows={scenResults.map(sc => {
                    const irr = runScenario(sc.ov).irr;
                    return [sc.name, (sc.prob * 100).toFixed(0) + '%', fmtPct(irr), fmtPct(sc.prob * irr)];
                  })}
                />
                <div style={{ marginTop: 12, padding: '10px 14px', background: '#F0FDF4', borderRadius: 6, display: 'flex', gap: 24 }}>
                  <div>
                    <span style={{ fontSize: 11, color: T.sub }}>Probability-Weighted IRR</span>
                    <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: wtdIRR > 0.10 ? T.green : T.amber }}>
                      {fmtPct(wtdIRR)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: T.sub }}>IRR at Risk (Base - Stress)</span>
                    <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: T.red }}>
                      {fmtPct(model.equityIRR - runScenario({ capacityFactor: inputs.capacityFactor * 0.85, ppaPriceMWh: inputs.ppaPriceMWh - 15, debtRatePct: inputs.debtRatePct + 0.015, itcPct: 0.06, domesticContent: false, energyCommunity: false }).irr)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 9 — Refinancing Analysis
  // ══════════════════════════════════════════════════════════════════════════
  const renderTab8 = () => {
    const constrRate  = 0.085;
    const constrMo    = 18;
    const constrInt   = model.debtAmountM * constrRate * constrMo / 12;
    const totalDevM   = model.totalCapexM + constrInt;

    // DSCR-based max debt at 1.20x
    const minEbitda   = Math.min(...model.table.filter(r => r.yr <= inputs.debtTenorYr).map(r => r.ebitdaM));
    const maxDs120    = minEbitda / 1.20;
    const afFactor    = inputs.debtRatePct > 0
      ? Math.pow(1 + inputs.debtRatePct, inputs.debtTenorYr)
        / (inputs.debtRatePct * Math.pow(1 + inputs.debtRatePct, inputs.debtTenorYr))
      : 0;
    const maxDebt120  = maxDs120 * afFactor;
    const cashOut     = Math.max(0, maxDebt120 - model.debtAmountM);

    // Refinancing timing: cumulative interest saving when refi in year 1-5
    let balanceCur = model.debtAmountM;
    const refiData = Array.from({ length: 5 }, (_, i) => {
      const yr   = i + 1;
      const int  = balanceCur * inputs.debtRatePct;
      const prin = Math.max(0, model.annualDS - int);
      balanceCur = Math.max(0, balanceCur - prin);
      const newRate  = Math.max(0.001, inputs.debtRatePct - 0.008);
      const remTenor = Math.max(1, inputs.debtTenorYr - yr);
      const newDs    = balanceCur > 0
        ? balanceCur * newRate * Math.pow(1 + newRate, remTenor)
          / (Math.pow(1 + newRate, remTenor) - 1) : 0;
      const annSaving = model.annualDS - newDs;
      const totalSaving = annSaving * remTenor;
      return { yr: 'Year ' + yr, balance: balanceCur.toFixed(1), newRate: (newRate * 100).toFixed(2) + '%', saving: totalSaving.toFixed(2) };
    });

    return (
      <div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
          <KpiCard label="Construction Loan Rate" value={(constrRate * 100).toFixed(1) + '%'} sub={constrMo + '-month tenor'} />
          <KpiCard label="Construction Interest" value={fmtM(constrInt)} color={T.red} />
          <KpiCard label="Total Development Cost" value={fmtM(totalDevM)} color={T.amber} />
          <KpiCard label="Max Cash-Out Refi" value={fmtM(cashOut)} sub="At 1.20x DSCR floor" color={T.green} />
        </div>

        <SectionTitle>Refinancing Timing — Cumulative Interest Saving ($M)</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={refiData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="yr" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={v => ['$' + v + 'M', 'Interest Saving']} />
            <Line type="monotone" dataKey="saving" stroke={SOLAR_GOLD} strokeWidth={2} dot={{ r: 4 }} name="Saving ($M)" />
          </LineChart>
        </ResponsiveContainer>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <div>
            <SectionTitle>Year-by-Year Refinancing Analysis</SectionTitle>
            <DataTable
              headers={['Refi Year', 'Remaining Balance ($M)', 'New Rate', 'Total Interest Saving ($M)']}
              rows={refiData.map(r => [r.yr, r.balance, r.newRate, r.saving])}
            />
          </div>
          <div>
            <SectionTitle>Cash-Out Refinancing Waterfall</SectionTitle>
            <DataTable
              headers={['Item', 'Amount ($M)']}
              rows={[
                ['Max Debt at 1.20x DSCR',     fmtM(maxDebt120)],
                ['Less: Existing Debt Balance', fmtM(model.debtAmountM)],
                ['Gross Cash-Out Proceeds',     fmtM(cashOut)],
                ['Refi Fees (est. 1%)',         fmtM(maxDebt120 * 0.01)],
                ['Net Distribution to Equity',  fmtM(cashOut - maxDebt120 * 0.01)],
                ['Debt Post-Refi',              fmtM(maxDebt120)],
              ]}
            />
            <div style={{ fontSize: 11, color: T.sub, marginTop: 8, padding: 10, background: '#F0F9FF', borderRadius: 6 }}>
              HoldCo/OpCo: HoldCo can issue dividend recap secured against distributions
              without breaching OpCo debt covenants. Max HoldCo loan (est.):
              {fmtM(cashOut * 0.60)}.
            </div>
          </div>
        </div>

        <SectionTitle>Construction Financing — Draw Schedule &amp; Milestone Timeline</SectionTitle>
        <DataTable
          headers={['Month', 'Milestone', 'Cumulative Draw (%)', 'Draw Amount ($M)', 'Cumulative ($M)']}
          rows={[
            ['Month 1',  'Financial Close — NTP',              '5%',   fmtM(model.totalCapexM * 0.05),  fmtM(model.totalCapexM * 0.05)],
            ['Month 2',  'Module procurement deposit',          '12%',  fmtM(model.totalCapexM * 0.07),  fmtM(model.totalCapexM * 0.12)],
            ['Month 4',  'Civil works & foundations begin',    '22%',  fmtM(model.totalCapexM * 0.10),  fmtM(model.totalCapexM * 0.22)],
            ['Month 6',  'Structural steel & racking',         '35%',  fmtM(model.totalCapexM * 0.13),  fmtM(model.totalCapexM * 0.35)],
            ['Month 8',  'Module delivery & installation',     '55%',  fmtM(model.totalCapexM * 0.20),  fmtM(model.totalCapexM * 0.55)],
            ['Month 10', 'Inverter & electrical balance',      '72%',  fmtM(model.totalCapexM * 0.17),  fmtM(model.totalCapexM * 0.72)],
            ['Month 13', 'Substation & interconnection',       '85%',  fmtM(model.totalCapexM * 0.13),  fmtM(model.totalCapexM * 0.85)],
            ['Month 15', 'Commissioning & testing',            '93%',  fmtM(model.totalCapexM * 0.08),  fmtM(model.totalCapexM * 0.93)],
            ['Month 17', 'COD — Commercial Operation Date',   '98%',  fmtM(model.totalCapexM * 0.05),  fmtM(model.totalCapexM * 0.98)],
            ['Month 18', 'Retention release & permanent loan', '100%', fmtM(model.totalCapexM * 0.02),  fmtM(model.totalCapexM * 1.00)],
          ]}
        />

        <SectionTitle>Construction Loan vs Permanent Loan — Cost Comparison</SectionTitle>
        <DataTable
          headers={['Feature', 'Construction Loan', 'Permanent / Term Loan']}
          rows={[
            ['Interest Rate',     (constrRate * 100).toFixed(1) + '%',                   (inputs.debtRatePct * 100).toFixed(2) + '%'],
            ['Tenor',             constrMo + ' months',                                   inputs.debtTenorYr + ' years'],
            ['Amount',            fmtM(model.debtAmountM),                               fmtM(model.debtAmountM)],
            ['Total Interest',    fmtM(constrInt),                                        fmtM(model.annualDS * inputs.debtTenorYr - model.debtAmountM)],
            ['Security',          'GC completion guarantee; equity pledge',               'DSCR covenant; DSRA; assignment of PPA'],
            ['Repayment',         'Bullet at COD / take-out',                             'Level annuity — ' + fmtM(model.annualDS) + '/yr'],
            ['Interest Reserve',  fmtM(model.debtAmountM * constrRate * constrMo / 12),  fmtM(model.dsraM) + ' DSRA'],
            ['Refinancing Risk',  'Low — bank committed to take-out',                     'Balloon: ' + inputs.debtTenorYr + ' yr maturity'],
          ]}
        />
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 10 — LP/GP Waterfall
  // ══════════════════════════════════════════════════════════════════════════
  const renderTab9 = () => {
    const [lpPref,    setLpPref]    = useState(0.08);
    const [gpCatchup, setGpCatchup] = useState(0.20);
    const [lpGpSplit, setLpGpSplit] = useState(0.80);

    const lpShare = 0.80;
    const gpShare = 0.20;
    const lpInv   = model.equityAmountM * lpShare;
    const gpInv   = model.equityAmountM * gpShare;

    const waterfallData = [];
    let cLP = 0, cGP = 0;

    model.table.forEach((r, idx) => {
      let pool = r.equDistM + (idx === 0 ? model.itcAmountM * lpShare : 0);
      let lpD = 0, gpD = 0;

      // Tier 1: LP preferred return
      const pref = Math.min(pool, lpInv * lpPref);
      lpD  += pref;
      pool -= pref;

      // Tier 2: GP catch-up
      if (pool > 0) {
        const gpCUp = Math.min(pool, pref * gpCatchup / Math.max(0.001, 1 - gpCatchup));
        gpD  += gpCUp;
        pool -= gpCUp;
      }

      // Tier 3: 80/20 split
      if (pool > 0) {
        lpD += pool * lpGpSplit;
        gpD += pool * (1 - lpGpSplit);
      }

      cLP += lpD;
      cGP += gpD;
      waterfallData.push({ yr: 'Y' + r.yr, lp: parseFloat(lpD.toFixed(2)), gp: parseFloat(gpD.toFixed(2)) });
    });

    const lpIRR = calcIRR([-lpInv, ...waterfallData.map(r => r.lp)]);
    const gpIRR = calcIRR([-gpInv, ...waterfallData.map(r => r.gp)]);
    const lpMoic = lpInv > 0 ? cLP / lpInv : 0;
    const gpMoic = gpInv > 0 ? cGP / gpInv : 0;

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <SectionTitle>Waterfall Parameters</SectionTitle>
            <SliderRow label="LP Preferred Return (hurdle)" value={lpPref} min={0.06} max={0.12} step={0.005}
              onChange={setLpPref} fmt={v => (v * 100).toFixed(1) + '%'} />
            <SliderRow label="GP Catch-Up %" value={gpCatchup} min={0.10} max={0.30} step={0.01}
              onChange={setGpCatchup} fmt={v => (v * 100).toFixed(0) + '%'} />
            <SliderRow label="LP/GP Profit Split" value={lpGpSplit} min={0.60} max={0.90} step={0.05}
              onChange={setLpGpSplit} fmt={v => (v * 100).toFixed(0) + '/' + ((1 - v) * 100).toFixed(0)} />
            <SectionTitle>4-Tier Structure</SectionTitle>
            <DataTable
              headers={['Tier', 'Description', 'LP', 'GP']}
              rows={[
                ['Tier 1', 'LP Pref Return',     (lpPref * 100).toFixed(1) + '% pref', '0%'],
                ['Tier 2', 'GP Catch-Up',         '0%',                                 '100%'],
                ['Tier 3', 'Profit Split',         (lpGpSplit * 100).toFixed(0) + '%',  ((1 - lpGpSplit) * 100).toFixed(0) + '%'],
                ['Tier 4', 'High-Watermark (15%)', '70%',                               '30%'],
              ]}
            />
          </div>
          <div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              <KpiCard label="LP IRR"  value={fmtPct(lpIRR)}  color={T.blue}   />
              <KpiCard label="GP IRR"  value={fmtPct(gpIRR)}  color={T.green}  />
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              <KpiCard label="LP MOIC" value={fmtX(lpMoic)}   color={T.indigo} />
              <KpiCard label="GP MOIC" value={fmtX(gpMoic)}   color={T.teal}   />
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <KpiCard label="LP Total Distributions" value={fmtM(cLP)} />
              <KpiCard label="GP Total Distributions" value={fmtM(cGP)} />
            </div>
          </div>
        </div>

        <SectionTitle>Cumulative LP vs GP Distributions — First 20 Years</SectionTitle>
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={waterfallData.slice(0, 20)}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="yr" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v, n) => ['$' + v + 'M', n]} />
            <Area type="monotone" dataKey="lp" stroke={T.blue}   fill="#DBEAFE" strokeWidth={2} name="LP Distribution" />
            <Area type="monotone" dataKey="gp" stroke={SOLAR_GOLD} fill="#FEF3C7" strokeWidth={2} name="GP Distribution" />
            <Legend />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 11 — Portfolio Context
  // ══════════════════════════════════════════════════════════════════════════
  const renderTab10 = () => {
    const portfolio = [
      { name: 'Wind Farm Alpha',        capex: 180, cf: 0.35, irr: 0.115, type: 'Wind'  },
      { name: 'Solar Park Bravo',       capex: 95,  cf: 0.22, irr: 0.105, type: 'Solar' },
      { name: 'BESS Project Charlie',   capex: 60,  cf: 0.25, irr: 0.120, type: 'BESS'  },
      { name: 'Solar Park Delta',       capex: 110, cf: 0.20, irr: 0.098, type: 'Solar' },
      { name: 'This Project (RE-PF1)',  capex: model.totalCapexM, cf: inputs.capacityFactor, irr: model.equityIRR, type: 'Solar' },
    ];
    const totalAUM = portfolio.reduce((s, a) => s + a.capex, 0);
    const avgCF    = portfolio.reduce((s, a) => s + a.cf * a.capex, 0) / Math.max(1, totalAUM);
    const wtdIRR   = portfolio.reduce((s, a) => s + a.irr * a.capex, 0) / Math.max(1, totalAUM);
    const thisPct  = model.totalCapexM / Math.max(1, totalAUM);

    const portChart = portfolio.map(a => ({ name: a.name.split(' ')[2] || a.name, irr: parseFloat((a.irr * 100).toFixed(2)), capex: parseFloat(a.capex.toFixed(0)) }));

    return (
      <div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
          <KpiCard label="Portfolio AUM (incl. this)" value={'$' + totalAUM.toFixed(0) + 'M'} color={T.blue} />
          <KpiCard label="This Project Weight"        value={(thisPct * 100).toFixed(1) + '%'} color={thisPct > 0.30 ? T.red : T.amber} sub="Concentration" />
          <KpiCard label="Portfolio Avg CF"           value={(avgCF * 100).toFixed(1) + '%'} color={T.green} />
          <KpiCard label="Portfolio Weighted IRR"     value={fmtPct(wtdIRR)} color={T.indigo} />
        </div>

        <SectionTitle>Portfolio Asset Comparison</SectionTitle>
        <DataTable
          headers={['Asset', 'Type', 'CAPEX ($M)', 'Capacity Factor', 'Equity IRR', '% of AUM']}
          rows={portfolio.map((a, i) => [
            a.name, a.type, a.capex.toFixed(0),
            (a.cf * 100).toFixed(1) + '%',
            (a.irr * 100).toFixed(1) + '%',
            (a.capex / totalAUM * 100).toFixed(1) + '%',
          ])}
          colorFn={(cell, ci, ri) => ri === portfolio.length - 1 ? SOLAR_GOLD : T.text}
        />

        <SectionTitle>IRR by Asset</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={portChart}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis unit="%" tick={{ fontSize: 11 }} />
            <Tooltip formatter={v => [v + '%', 'Equity IRR']} />
            <ReferenceLine y={10} stroke={T.red} strokeDasharray="4 4" />
            <Bar dataKey="irr" fill={SOLAR_GOLD} radius={[3, 3, 0, 0]} name="IRR" />
          </BarChart>
        </ResponsiveContainer>

        <SectionTitle>Diversification Benefit</SectionTitle>
        <DataTable
          headers={['Asset Pair', 'Return Correlation', 'Diversification']}
          rows={[
            ['Solar vs Wind',         '0.35', 'Moderate'],
            ['Solar vs BESS',         '0.15', 'High'],
            ['Wind vs BESS',          '0.20', 'High'],
            ['This Project vs Port.', '0.40', 'Moderate'],
          ]}
          colorFn={cell => cell === 'High' ? T.green : cell === 'Moderate' ? T.amber : T.text}
        />

        {thisPct > 0.30 && (
          <div style={{ marginTop: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: T.red }}>
            CONCENTRATION WARNING: This project represents {(thisPct * 100).toFixed(1)}% of portfolio AUM —
            exceeds the 30% single-asset threshold. Consider co-investment or syndication.
          </div>
        )}

        <SectionTitle>LCOE Benchmarking vs Market Comparables</SectionTitle>
        <DataTable
          headers={['Project / Market', 'Technology', 'LCOE ($/MWh)', 'vs This Project', 'Assessment']}
          rows={[
            ['This Project (RE-PF1)',   'Utility Solar PV (Tracking)',   '$' + model.lcoe.toFixed(2), '—',                                           'Modeled'],
            ['Texas (ERCOT) 2024',      'Utility Solar PV',             '$24–28',   model.lcoe < 28 ? 'In range' : 'Above market', model.lcoe < 28 ? 'Competitive' : 'High'],
            ['Southwest US 2024',       'Utility Solar PV',             '$20–26',   model.lcoe < 26 ? 'In range' : 'Above market', model.lcoe < 26 ? 'Competitive' : 'High'],
            ['Southeast US 2024',       'Utility Solar PV',             '$28–34',   model.lcoe < 34 ? 'In range' : 'Above market', model.lcoe < 34 ? 'Competitive' : 'High'],
            ['Midwest US 2024',         'Utility Solar PV',             '$30–38',   model.lcoe < 38 ? 'In range' : 'Above market', model.lcoe < 38 ? 'Competitive' : 'High'],
            ['Onshore Wind US 2024',    'Wind (new build)',              '$26–34',   '—',                                           'Reference'],
            ['Gas CCGT (new) 2024',     'Natural Gas CCGT',             '$45–60',   '—',                                           'Fossil baseline'],
            ['NREL ATB 2024 (mid)',     'Utility Solar (national avg)', '$29',      model.lcoe < 29 ? 'Below NREL mid' : 'Above', model.lcoe < 29 ? 'Strong' : 'Review CAPEX'],
          ]}
          colorFn={(cell, ci) => {
            if (ci === 4) return cell === 'Competitive' || cell === 'Strong' || cell === 'Below NREL mid' ? T.green : cell === 'High' ? T.red : T.amber;
            return T.text;
          }}
        />

        <SectionTitle>Marginal Contribution to Portfolio DSCR</SectionTitle>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.8, marginBottom: 12 }}>
            Portfolio-level DSCR is computed as the weighted average of individual project DSCRs,
            weighted by annual debt service. Adding this project shifts the portfolio DSCR as follows:
          </div>
          <DataTable
            headers={['Metric', 'Without This Project', 'With This Project (RE-PF1)', 'Delta']}
            rows={[
              ['Portfolio Avg DSCR', '1.38x', model.avgDscr > 1.38 ? (model.avgDscr * 0.85 + 1.38 * 0.15).toFixed(2) + 'x' : (model.avgDscr * 0.85 + 1.38 * 0.15).toFixed(2) + 'x', (model.avgDscr > 1.38 ? '+' : '') + ((model.avgDscr - 1.38) * 0.15).toFixed(3) + 'x'],
              ['Portfolio Min DSCR', '1.22x', Math.min(1.22, model.minDscr).toFixed(2) + 'x', Math.min(1.22, model.minDscr) < 1.22 ? '↓ New constraint' : 'No change'],
              ['Total Portfolio DS',  '$52.4M/yr', '$' + (52.4 + model.annualDS).toFixed(1) + 'M/yr', '+' + fmtM(model.annualDS)],
              ['Largest Single DS',   '$18.0M/yr', model.annualDS > 18 ? fmtM(model.annualDS) + '/yr (new max)' : '$18.0M/yr', model.annualDS > 18 ? '↑ New largest' : 'No change'],
            ]}
          />
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 12 — Executive Summary / Deal Memo
  // ══════════════════════════════════════════════════════════════════════════
  const renderTab11 = () => {
    const irr   = model.equityIRR;
    const dscr  = model.minDscr;
    const r0    = model.table[0] ?? {};
    const costs0 = (r0.omM ?? 0) + (r0.landM ?? 0) + (r0.insM ?? 0) + (r0.gaM ?? 0);
    const p90Rev = model.p90Annual * inputs.ppaPriceMWh / 1e6;
    const p90Dscr = model.annualDS > 0 ? (p90Rev - costs0) / model.annualDS : 2;

    const rec      = irr > 0.10 && dscr > 1.25 && p90Dscr > 1.10 ? 'INVEST'
                   : irr > 0.08 && dscr > 1.20                    ? 'CONDITIONAL'
                   : 'PASS';
    const recColor = rec === 'INVEST' ? T.green : rec === 'CONDITIONAL' ? T.amber : T.red;

    return (
      <div>
        {/* Recommendation badge */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-block', background: recColor, color: '#FFFFFF',
            padding: '14px 48px', borderRadius: 8, fontSize: 24, fontWeight: 900,
            letterSpacing: '0.15em', fontFamily: 'JetBrains Mono, monospace',
          }}>
            {rec}
          </div>
          <div style={{ fontSize: 11, color: T.sub, marginTop: 8 }}>
            Criteria: Equity IRR {'>'} 10% AND Min DSCR {'>'} 1.25x AND P90 DSCR {'>'} 1.10x
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, borderBottom: `2px solid ${SOLAR_GOLD}`, paddingBottom: 6, marginBottom: 12 }}>
              Investment Highlights
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: T.text, lineHeight: 2 }}>
              <li><strong>Technology:</strong> Utility-scale PV, {inputs.capacityMW}MW DC, crystalline silicon, {inputs.degradationPct.toFixed(2)}%/yr degradation</li>
              <li><strong>Revenue:</strong> {inputs.ppaTenorYr}-yr PPA at ${inputs.ppaPriceMWh}/MWh; merchant tail at 80% post-Year {inputs.ppaTenorYr}</li>
              <li><strong>Tax Benefits:</strong> {(model.effITC * 100).toFixed(0)}% ITC ({fmtM(model.itcAmountM)}) + MACRS shield (PV {fmtM(model.macrsTaxShield)}) — IRA 2022</li>
              <li><strong>Returns:</strong> Equity IRR {fmtPct(irr)}, MOIC {fmtX(model.moic)}, LCOE ${model.lcoe.toFixed(2)}/MWh</li>
            </ul>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, borderBottom: `2px solid ${T.red}`, paddingBottom: 6, marginBottom: 12 }}>
              Key Risk Factors
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: T.text, lineHeight: 2 }}>
              <li><strong>Resource Risk:</strong> P90/P50 yield spread {(inputs.yieldSigma * 100).toFixed(0)}% σ; P90 = {(model.p90Annual / 1000).toFixed(0)} GWh vs P50 = {(model.p50Annual / 1000).toFixed(0)} GWh</li>
              <li><strong>Counterparty Risk:</strong> Offtaker credit quality critical; merchant tail post-Year {inputs.ppaTenorYr}</li>
              <li><strong>Regulatory Risk:</strong> ITC adder eligibility subject to IRS rulemaking; potential clawback</li>
              <li><strong>Technology Risk:</strong> Degradation exceeding {inputs.degradationPct.toFixed(2)}%/yr; inverter replacement ~Year 10</li>
              <li><strong>Market Risk:</strong> Power price risk on merchant tail; basis risk vs grid</li>
            </ul>
          </div>
        </div>

        <SectionTitle>Key Metrics Summary</SectionTitle>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
          <KpiCard label="Equity IRR"         value={fmtPct(irr)}                color={irr > 0.10 ? T.green : T.red}    />
          <KpiCard label="Project IRR"        value={fmtPct(model.projectIRR)}   color={T.blue}                           />
          <KpiCard label="NPV"                value={fmtM(model.npvM)}            color={model.npvM > 0 ? T.green : T.red} />
          <KpiCard label="MOIC"               value={fmtX(model.moic)}            color={T.indigo}                         />
          <KpiCard label="Min DSCR"           value={fmtX(dscr)}                  color={dscr >= 1.25 ? T.green : T.red}  />
          <KpiCard label="LCOE"               value={'$' + model.lcoe.toFixed(2) + '/MWh'} color={T.teal}               />
          <KpiCard label="P90 DSCR (Yr 1)"   value={p90Dscr.toFixed(2) + 'x'}   color={p90Dscr >= 1.10 ? T.green : T.red} />
          <KpiCard label="ITC + MACRS"        value={fmtM(model.itcAmountM + model.macrsTaxShield)} color={T.amber}     />
        </div>

        <SectionTitle>Key Assumptions</SectionTitle>
        <DataTable
          headers={['Assumption', 'Value', 'Source / Basis']}
          rows={[
            ['DC Capacity',        inputs.capacityMW + ' MW',                  'Engineering design'],
            ['CAPEX',              '$' + inputs.capexPerW.toFixed(2) + '/W DC', 'EPC contractor quote'],
            ['Capacity Factor',    (inputs.capacityFactor * 100).toFixed(1) + '%', 'P50 energy yield study'],
            ['PPA Price',          '$' + inputs.ppaPriceMWh + '/MWh',          'Executed PPA'],
            ['ITC Rate',           (model.effITC * 100).toFixed(0) + '%',      'IRA 2022 + adders'],
            ['Debt Rate',          (inputs.debtRatePct * 100).toFixed(2) + '%', 'Senior secured'],
            ['Leverage',           (inputs.debtPct * 100).toFixed(0) + '%',    'Sized to target DSCR'],
            ['Degradation',        inputs.degradationPct.toFixed(2) + '%/yr',  'Module warranty'],
            ['Discount Rate',      (inputs.discountRatePct * 100).toFixed(1) + '%', 'Portfolio WACC'],
            ['Project Life',       inputs.projectLifeYr + ' years',             'Technical design life'],
          ]}
        />

        <SectionTitle>30-Year EBITDA &amp; Equity Distribution Profile</SectionTitle>
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={model.table.map(r => ({
            yr: 'Y' + r.yr,
            ebitda: parseFloat(r.ebitdaM.toFixed(2)),
            dist: parseFloat(r.equDistM.toFixed(2)),
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="yr" tick={{ fontSize: 9 }} interval={4} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v, n) => ['$' + v + 'M', n]} />
            <Area type="monotone" dataKey="ebitda" stroke={T.blue}   fill="#DBEAFE" strokeWidth={1.5} name="EBITDA" />
            <Area type="monotone" dataKey="dist"   stroke={SOLAR_GOLD} fill="#FEF3C7" strokeWidth={2}   name="Equity Dist" />
            <Legend />
          </AreaChart>
        </ResponsiveContainer>

        <SectionTitle>Full Financial Summary — All Computed Metrics</SectionTitle>
        <DataTable
          headers={['Category', 'Metric', 'Value', 'Quality']}
          rows={[
            ['Returns',   'Equity IRR (Levered, After-Tax)',  fmtPct(model.equityIRR),   model.equityIRR > 0.12 ? 'Strong' : model.equityIRR > 0.08 ? 'Adequate' : 'Weak'],
            ['Returns',   'Project IRR (Unlevered, Pre-Tax)', fmtPct(model.projectIRR),  model.projectIRR > 0.09 ? 'Strong' : 'Adequate'],
            ['Returns',   'NPV at Discount Rate',             fmtM(model.npvM),           model.npvM > 10 ? 'Positive' : model.npvM > 0 ? 'Marginal' : 'Negative'],
            ['Returns',   'MOIC',                             fmtX(model.moic),           model.moic > 2.5 ? 'Strong' : model.moic > 1.8 ? 'Adequate' : 'Weak'],
            ['Returns',   'Payback Period',                   model.payback + ' yrs',     model.payback < 10 ? 'Fast' : model.payback < 15 ? 'Normal' : 'Slow'],
            ['Credit',    'Minimum DSCR',                     fmtX(model.minDscr),        model.minDscr > 1.35 ? 'Strong' : model.minDscr > 1.20 ? 'Adequate' : 'Tight'],
            ['Credit',    'Average DSCR',                     fmtX(model.avgDscr),        model.avgDscr > 1.40 ? 'Strong' : 'Adequate'],
            ['Credit',    'LLCR',                             fmtX(model.llcr),           model.llcr > 1.50 ? 'Strong' : 'Adequate'],
            ['Credit',    'PLCR',                             fmtX(model.plcr),           model.plcr > 1.80 ? 'Strong' : 'Adequate'],
            ['Credit',    'DSRA (6-month)',                   fmtM(model.dsraM),          'Required'],
            ['Energy',    'P50 Annual Generation',            (model.p50Annual / 1000).toFixed(0) + ' GWh', 'Base'],
            ['Energy',    'P90 Annual Generation',            (model.p90Annual / 1000).toFixed(0) + ' GWh', 'Lenders'],
            ['Energy',    'LCOE',                             '$' + model.lcoe.toFixed(2) + '/MWh', model.lcoe < 35 ? 'Competitive' : 'Above market'],
            ['Tax',       'Effective ITC Rate',               (model.effITC * 100).toFixed(0) + '%',  'IRA 2022'],
            ['Tax',       'ITC Amount',                       fmtM(model.itcAmountM),     'Year 1 cash benefit'],
            ['Tax',       'MACRS Tax Shield PV',              fmtM(model.macrsTaxShield), '5-year schedule'],
            ['Capital',   'Total CAPEX',                      fmtM(model.totalCapexM),    '—'],
            ['Capital',   'Debt Amount',                      fmtM(model.debtAmountM),    `${(inputs.debtPct * 100).toFixed(0)}% gearing`],
            ['Capital',   'Equity Investment',                fmtM(model.equityAmountM),  'Net of ITC'],
            ['Capital',   'Annual Debt Service',              fmtM(model.annualDS),       `${inputs.debtTenorYr}-yr level annuity`],
          ]}
          colorFn={(cell, ci) => {
            if (ci !== 3) return T.text;
            const positive = ['Strong', 'Fast', 'Positive', 'Competitive', 'Required'];
            const negative = ['Weak', 'Tight', 'Negative', 'Slow', 'Above market'];
            if (positive.some(p => cell.includes(p))) return T.green;
            if (negative.some(n => cell.includes(n))) return T.red;
            return T.amber;
          }}
        />

        <div style={{ fontSize: 11, color: T.sub, marginTop: 16, padding: 12, background: '#F1F5F9', borderRadius: 6 }}>
          For informational purposes only. IRR and NPV projections are based on modeled assumptions and subject to material change.
          Independent engineering, legal, and tax diligence required before investment.
          Model: Solar Project Finance Engine (RE-PF1) v2.0 — Platform A².
        </div>
      </div>
    );
  };

  const renderers = [
    renderTab0, renderTab1, renderTab2, renderTab3, renderTab4,
    renderTab5, renderTab6, renderTab7, renderTab8, renderTab9,
    renderTab10, renderTab11,
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text }}>

      {/* ── Header ── */}
      <div style={{ background: HEADER_BG, borderBottom: `3px solid ${SOLAR_GOLD}`, padding: '18px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: SOLAR_GOLD, letterSpacing: '0.12em', marginBottom: 4 }}>
              RE-PF1 · SOLAR PROJECT FINANCE ENGINE
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#F8FAFC' }}>
              Solar Project Finance Engine
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>
              Institutional-grade PV modeling · IRR · DSCR · IRA 2022 · P50/P90 · LP/GP waterfall
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>
              {inputs.capacityMW}MW · ${inputs.capexPerW.toFixed(2)}/W · {(inputs.capacityFactor * 100).toFixed(1)}% CF
            </div>
            <div style={{
              fontSize: 22, fontWeight: 700, fontFamily: 'monospace', marginTop: 4,
              color: model.equityIRR > 0.10 ? '#4ADE80' : '#FBBF24',
            }}>
              IRR: {fmtPct(model.equityIRR)}
            </div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: model.minDscr >= 1.25 ? '#4ADE80' : '#F87171' }}>
              Min DSCR {model.minDscr.toFixed(2)}x · LCOE ${model.lcoe.toFixed(2)}/MWh · MOIC {fmtX(model.moic)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <div style={{ borderBottom: `1px solid ${T.border}`, background: T.card, overflowX: 'auto' }}>
        <div style={{ display: 'flex', minWidth: 'max-content' }}>
          {TABS.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '12px 18px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 12, whiteSpace: 'nowrap', transition: 'all 0.15s',
                fontWeight: activeTab === i ? 700 : 400,
                color: activeTab === i ? SOLAR_GOLD : T.sub,
                borderBottom: activeTab === i ? `3px solid ${SOLAR_GOLD}` : '3px solid transparent',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
        {renderers[activeTab]()}
      </div>
    </div>
  );
}
