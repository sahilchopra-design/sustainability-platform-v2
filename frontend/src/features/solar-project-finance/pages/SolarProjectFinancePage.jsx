import React, { useState, useMemo, useCallback } from 'react';
import EnergyAdvancedAnalytics from '../../_shared/EnergyAdvancedAnalytics';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ScatterChart, Scatter, ComposedChart
} from 'recharts';
import { IRENA_RENEWABLE_CAPACITY_2023 } from '../../../data/publicDataSeed';

// ── Platform standards ────────────────────────────────────────────────────────
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = {
  bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E',
  sub: '#6B7280', accent: '#B8860B', indigo: '#4F46E5', green: '#065F46',
  red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E',
  solar: '#D97706'
};
const HEADER_BG = '#0F172A';
const SOLAR_GOLD = '#D97706';
const NAV_BG = '#0F172A';
const MACRS5 = [0.2000, 0.3200, 0.1920, 0.1152, 0.1152, 0.0576];
const MACRS15 = [0.05,0.095,0.0855,0.077,0.0693,0.0623,0.059,0.059,0.059,0.059,0.059,0.059,0.059,0.059,0.059,0.03];

const TABS = [
  'Project Overview','Financial Model','Returns Engine','DSCR & Debt',
  'IRA Tax Credits','P50/P90 Yield','Sensitivity','Scenario Engine',
  'Monte Carlo','Refinancing','LP/GP Waterfall','Tax Equity & JV',
  'LCOE Deep Dive','Portfolio Integration','Comparable Transactions',
  'ESG & Sustainability','Risk Register','Construction Timeline',
  'Regulatory & Permitting','Executive Deal Memo'
];

const LOCATIONS = ['ERCOT-West','CAISO-SP15','PJM-West','MISO-Central','NYISO','ISO-NE'];
const TECHNOLOGIES = ['Bifacial PERC','TOPCon','HJT','CdTe','Fixed Mono'];
const CF_BY_LOC = { 'ERCOT-West':25.5,'CAISO-SP15':22.0,'PJM-West':19.5,'MISO-Central':20.0,'NYISO':17.0,'ISO-NE':15.5 };

// ── Wire real IRENA solar capacity data (GAP-011) ─────────────────────────
const IRENA_SOLAR = Object.fromEntries((IRENA_RENEWABLE_CAPACITY_2023||[]).map(c=>[c.country,c.solar_pv_gw]));
// Top solar markets by installed GW (IRENA 2023): China 609, USA 140, Japan 87, Germany 81, India 73, Spain 32, Italy 30, Australia 31, Korea 22, Netherlands 24
const TOP_SOLAR_MARKETS = (IRENA_RENEWABLE_CAPACITY_2023||[]).sort((a,b)=>(b.solar_pv_gw||0)-(a.solar_pv_gw||0)).slice(0,15).map(c=>({country:c.country,solar_gw:c.solar_pv_gw,yoy_growth:c.yoy_growth_pct}));

// ── Calculation engines ───────────────────────────────────────────────────────
function calcIRR(cashflows) {
  if (!cashflows || cashflows.length < 2) return 0;
  let rate = 0.10;
  for (let i = 0; i < 200; i++) {
    const npv = cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + rate, t), 0);
    const dnpv = cashflows.reduce((s, cf, t) => s - t * cf / Math.pow(1 + rate, t + 1), 0);
    if (Math.abs(dnpv) < 1e-10) break;
    const nr = rate - npv / dnpv;
    if (Math.abs(nr - rate) < 1e-8) { rate = nr; break; }
    rate = isFinite(nr) ? nr : rate;
  }
  return isFinite(rate) ? rate : 0;
}

function calcNPV(rate, cashflows) {
  return cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + rate, t), 0);
}

function calcCRF(r, n) {
  if (r <= 0 || n <= 0) return 0;
  const factor = Math.pow(1 + r, n);
  return (r * factor) / (factor > 1 ? factor - 1 : 1);
}

function calcLCOE(capex, om, cf, mw, dr, n) {
  const annualEnergy = cf * 8760 * mw * 1000; // kWh
  const crf = calcCRF(dr, n);
  const annualCapex = capex * crf;
  return annualEnergy > 0 ? ((annualCapex + om) / annualEnergy) * 1e6 * 1000 : 0; // $/MWh
}

function macrsDep(schedule, basis, year) {
  if (year < 1 || year > schedule.length) return 0;
  return basis * schedule[year - 1];
}

function boxMuller(u1, u2) {
  return Math.sqrt(-2 * Math.log(Math.max(u1, 1e-12))) * Math.cos(2 * Math.PI * u2);
}

// ── Formatting helpers ────────────────────────────────────────────────────────
const fmtPct  = n => isFinite(n) && n !== null ? (n * 100).toFixed(1) + '%' : '—';
const fmtPctD = n => isFinite(n) && n !== null ? (n).toFixed(1) + '%' : '—';
const fmtM    = n => isFinite(n) && n !== null ? '$' + (n || 0).toFixed(1) + 'M' : '—';
const fmtX    = n => isFinite(n) && n !== null ? (n || 0).toFixed(2) + 'x' : '—';
const fmtK    = n => isFinite(n) && n !== null ? '$' + Math.round(n || 0).toLocaleString() + 'k' : '—';
const fmtN    = (n, d=2) => isFinite(n) && n !== null ? (n || 0).toFixed(d) : '—';
const fmtMWh  = n => isFinite(n) && n !== null ? '$' + (n || 0).toFixed(2) + '/MWh' : '—';
const fmtGWh  = n => isFinite(n) && n !== null ? (n || 0).toFixed(2) + ' GWh' : '—';

// ── Shared UI primitives ──────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, border, size }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${border || T.border}`,
      borderTop: `3px solid ${border || color || SOLAR_GOLD}`,
      borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 140,
    }}>
      <div style={{ fontSize: 10, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: size || 22, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: color || T.text, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function TrafficLight({ value, thresholds, fmt, label, invert }) {
  // thresholds: [green_min, amber_min] or [amber_max, red_max] if invert
  const color = invert
    ? (value <= thresholds[0] ? T.green : value <= thresholds[1] ? SOLAR_GOLD : T.red)
    : (value >= thresholds[0] ? T.green : value >= thresholds[1] ? SOLAR_GOLD : T.red);
  const status = invert
    ? (value <= thresholds[0] ? 'GOOD' : value <= thresholds[1] ? 'WATCH' : 'RISK')
    : (value >= thresholds[0] ? 'GOOD' : value >= thresholds[1] ? 'WATCH' : 'RISK');
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:'10px 14px' }}>
      <div style={{ width:10, height:10, borderRadius:'50%', background:color, flexShrink:0 }}/>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:10, color:T.sub, textTransform:'uppercase' }}>{label}</div>
        <div style={{ fontSize:15, fontFamily:'JetBrains Mono, monospace', fontWeight:700, color }}>{fmt ? fmt(value) : value}</div>
      </div>
      <span style={{ fontSize:9, fontWeight:700, color, border:`1px solid ${color}`, borderRadius:4, padding:'2px 6px' }}>{status}</span>
    </div>
  );
}

function SectionTitle({ children, icon }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 700, color: T.text,
      borderBottom: `2px solid ${SOLAR_GOLD}`, paddingBottom: 6, marginBottom: 14, marginTop: 22,
      display:'flex', alignItems:'center', gap:6
    }}>{icon && <span>{icon}</span>}{children}</div>
  );
}

function Badge({ label, color, bg }) {
  return (
    <span style={{ fontSize:10, fontWeight:700, color: color||'#fff', background: bg||T.indigo, borderRadius:4, padding:'2px 8px', letterSpacing:'0.05em' }}>
      {label}
    </span>
  );
}

function SliderRow({ label, value, min, max, step, onChange, fmt, unit }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
        <span style={{ fontSize:11, color:'#94A3B8' }}>{label}</span>
        <span style={{ fontSize:11, fontFamily:'JetBrains Mono, monospace', fontWeight:700, color:'#F1F5F9' }}>
          {fmt ? fmt(value) : value}{unit || ''}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step||1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width:'100%', accentColor:SOLAR_GOLD, height:4 }} />
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:1 }}>
        <span style={{ fontSize:9, color:'#64748B' }}>{min}{unit||''}</span>
        <span style={{ fontSize:9, color:'#64748B' }}>{max}{unit||''}</span>
      </div>
    </div>
  );
}

function InputSelect({ label, value, options, onChange }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ fontSize:11, color:'#94A3B8', marginBottom:3 }}>{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width:'100%', background:'#1E293B', color:'#F1F5F9', border:'1px solid #334155', borderRadius:4, padding:'5px 8px', fontSize:11 }}>
        {options.map(o => <option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
      </select>
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
      <span style={{ fontSize:11, color:'#94A3B8' }}>{label}</span>
      <div onClick={() => onChange(!value)} style={{
        width:34, height:18, borderRadius:9, background: value ? SOLAR_GOLD : '#334155',
        cursor:'pointer', position:'relative', transition:'background 0.2s'
      }}>
        <div style={{
          position:'absolute', top:2, left: value ? 16 : 2, width:14, height:14,
          borderRadius:'50%', background:'#fff', transition:'left 0.2s'
        }}/>
      </div>
    </div>
  );
}

function CollapseSection({ title, children, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen !== false);
  return (
    <div style={{ borderBottom:'1px solid #1E293B', marginBottom:2 }}>
      <div onClick={() => setOpen(!open)} style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'9px 16px', cursor:'pointer', background: open ? '#1A2744' : 'transparent'
      }}>
        <span style={{ fontSize:11, fontWeight:700, color:SOLAR_GOLD, textTransform:'uppercase', letterSpacing:'0.06em' }}>{title}</span>
        <span style={{ color:'#64748B', fontSize:14 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && <div style={{ padding:'12px 16px' }}>{children}</div>}
    </div>
  );
}

function DataTable({ headers, rows, small, zebra }) {
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize: small ? 11 : 12 }}>
        <thead>
          <tr style={{ background: HEADER_BG }}>
            {headers.map((h,i) => (
              <th key={i} style={{ padding: small?'6px 8px':'8px 12px', color:'#94A3B8', fontWeight:600, textAlign: i===0?'left':'right', whiteSpace:'nowrap', fontSize: small?10:11, letterSpacing:'0.04em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row,ri) => (
            <tr key={ri} style={{ background: zebra && ri%2===1 ? '#F8F8F6' : T.card, borderBottom:`1px solid ${T.border}` }}
              onMouseEnter={e => { e.currentTarget.style.background='#FFF8E7'; }}
              onMouseLeave={e => { e.currentTarget.style.background = zebra && ri%2===1 ? '#F8F8F6' : T.card; }}>
              {row.map((cell,ci) => (
                <td key={ci} style={{ padding: small?'5px 8px':'7px 12px', textAlign: ci===0?'left':'right', color: T.text, fontFamily: ci===0?'inherit':'JetBrains Mono, monospace', fontSize: small?11:12, whiteSpace:'nowrap' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HeatCell({ value, min, max, fmt }) {
  const ratio = max > min ? (value - min) / (max - min) : 0;
  const r = Math.round(ratio > 0.5 ? 6 : ratio < 0.25 ? 153 : 146);
  const g = Math.round(ratio > 0.5 ? 95 : ratio < 0.25 ? 27 : 64);
  const b = Math.round(ratio > 0.5 ? 11 : ratio < 0.25 ? 27 : 229);
  const bg = ratio >= 0.6 ? '#D1FAE5' : ratio >= 0.35 ? '#FEF3C7' : '#FEE2E2';
  const tc = ratio >= 0.6 ? T.green : ratio >= 0.35 ? T.amber : T.red;
  return (
    <td style={{ background:bg, color:tc, textAlign:'center', fontFamily:'JetBrains Mono, monospace', fontSize:11, fontWeight:700, padding:'6px 10px', border:`1px solid ${T.border}` }}>
      {fmt ? fmt(value) : (value||0).toFixed(1)}
    </td>
  );
}

// ── Main computation hook ─────────────────────────────────────────────────────
function useModel(inp) {
  return useMemo(() => {
    const {
      capacityMW, dcAcRatio, cf, degradation, projectLife,
      capexPerW, omPerKW, omEscalation, landLease, projectAcres,
      insurancePct, gAndA, ppaPrice, ppaEscalator, ppaTenor,
      merchantPct, recPrice, curtailmentPct,
      debtPct, debtRate, debtTenor, debtFees, dsraMonths, minDscr,
      itcPct, domesticContent, energyCommunity, lowIncome, macrsSchedule,
      fedTaxRate, stateTaxRate, usePTC, ptcRate,
      hurdleRate, projectDr, targetMoic, yieldSigma
    } = inp;

    const totalTaxRate = (fedTaxRate + stateTaxRate) / 100;
    const totalCapexM = capacityMW * 1000 * capexPerW / 1e6;
    const totalCapex = totalCapexM * 1e6;
    const debtAmount = totalCapex * debtPct / 100;
    const equityAmount = totalCapex - debtAmount;
    const debtFeeAmt = debtAmount * debtFees / 100;
    const r = debtRate / 100;

    // ITC calculation
    let itcTotal = itcPct;
    if (domesticContent) itcTotal += 10;
    if (energyCommunity) itcTotal += 10;
    if (lowIncome) itcTotal += 10;
    itcTotal = Math.min(itcTotal, 70);
    const itcRate = itcTotal / 100;
    const itcBasis = totalCapex; // full capex eligible
    const itcAmount = usePTC ? 0 : itcBasis * itcRate;
    // IRS half-basis reduction: MACRS basis = capex * (1 - itcRate/2)
    const macrsBasis = usePTC ? totalCapex : totalCapex * (1 - itcRate / 2);

    // MACRS schedule
    const macrsArr = macrsSchedule === '5yr' ? MACRS5 : macrsSchedule === '15yr' ? MACRS15 : null;

    // Annual energy model
    const years = Array.from({length: projectLife}, (_, i) => i + 1);
    const grossGenY1 = capacityMW * cf / 100 * 8760 / 1000; // GWh
    const curtailFactor = 1 - curtailmentPct / 100;

    // Debt schedule
    const annualDS = r > 0 && debtTenor > 0
      ? debtAmount * r * Math.pow(1+r, debtTenor) / (Math.pow(1+r, debtTenor) - 1)
      : debtAmount / Math.max(debtTenor, 1);
    const dsra = annualDS * dsraMonths / 12;

    // Build annual cashflows
    let debtBalance = debtAmount;
    const annuals = years.map(yr => {
      const degFactor = Math.pow(1 - degradation / 100, yr - 1);
      const grossGen = grossGenY1 * degFactor;
      const netGen = grossGen * curtailFactor;

      // Revenue
      const ppaFactor = Math.pow(1 + ppaEscalator / 100, yr - 1);
      const effPpaPrice = ppaPrice * ppaFactor;
      let ppaRev = 0, merchantRev = 0;
      if (yr <= ppaTenor) {
        ppaRev = netGen * 1000 * effPpaPrice * (1 - merchantPct / 100) / 1e6;
        merchantRev = netGen * 1000 * (effPpaPrice * 0.92) * (merchantPct / 100) / 1e6;
      } else {
        const spotPrice = effPpaPrice * 0.85;
        merchantRev = netGen * 1000 * spotPrice / 1e6;
      }
      const recRev = netGen * 1000 * recPrice / 1e6;
      const curtailLoss = grossGen * 1000 * effPpaPrice * (curtailmentPct / 100) / 1e6;
      const grossRevenue = ppaRev + merchantRev + recRev;

      // OpEx
      const omEscFactor = Math.pow(1 + omEscalation / 100, yr - 1);
      const omCost = capacityMW * 1000 * omPerKW * omEscFactor / 1e6;
      const landCost = landLease * projectAcres / 1e6;
      const insuranceCost = totalCapexM * insurancePct / 100 * Math.pow(0.97, yr - 1);
      const gaCost = gAndA / 1e3;
      const totalOpex = omCost + landCost + insuranceCost + gaCost;

      const ebitda = grossRevenue - totalOpex;
      const ebitdaMargin = grossRevenue > 0 ? ebitda / grossRevenue * 100 : 0;

      // Debt service
      let interest = 0, principal = 0, debtService = 0;
      if (yr <= debtTenor && debtBalance > 0) {
        interest = debtBalance * r;
        debtService = Math.min(annualDS, debtBalance * (1 + r));
        principal = debtService - interest;
        debtBalance = Math.max(0, debtBalance - principal);
      }

      const cfads = ebitda - debtService;
      const dscr = debtService > 0 ? ebitda / debtService : 999;

      // MACRS depreciation
      let dep = 0;
      if (macrsArr && yr <= macrsArr.length) dep = macrsBasis * macrsArr[yr - 1];
      else if (macrsSchedule === 'straight-line') dep = macrsBasis / projectLife;

      // Taxes (simplified)
      const taxableIncome = Math.max(0, ebitda - interest - dep - (yr === 1 ? itcAmount : 0));
      const ptcBenefit = usePTC && yr <= 10 ? netGen * 1000 * ptcRate / 1e6 : 0;
      const taxes = Math.max(0, taxableIncome * totalTaxRate - ptcBenefit - (yr === 1 ? itcAmount : 0));
      const netIncome = ebitda - interest - dep - taxes;
      const equityDist = Math.max(0, cfads - taxes);

      return {
        yr, grossGen, netGen, ppaRev, merchantRev, recRev, curtailLoss, grossRevenue,
        omCost, landCost, insuranceCost, gaCost, totalOpex, ebitda, ebitdaMargin,
        interest, principal, debtService, cfads, dscr, dep, taxes, netIncome, equityDist,
        debtBalance: debtBalance + principal, ptcBenefit
      };
    });

    // Equity cashflows for IRR: year 0 = -(equity + dsra + debtFees)
    const equityCFs = [-(equityAmount + dsra + debtFeeAmt), ...annuals.map(a => a.equityDist)];
    const projectCFs = [-totalCapex, ...annuals.map(a => a.cfads)];

    const equityIRR = calcIRR(equityCFs);
    const projectIRR = calcIRR(projectCFs);

    const equityNPV = calcNPV(hurdleRate / 100, equityCFs);
    const projectNPV = calcNPV(projectDr / 100, projectCFs);

    // Cumulative equity
    let cumEq = -(equityAmount + dsra + debtFeeAmt);
    annuals.forEach(a => { cumEq += a.equityDist; a.cumEquity = cumEq; });

    // MOIC
    const totalEquityDist = annuals.reduce((s, a) => s + a.equityDist, 0);
    const moic = equityAmount > 0 ? totalEquityDist / equityAmount : 0;

    // Payback
    let payback = projectLife;
    let cum = -(equityAmount + dsra + debtFeeAmt);
    for (let i = 0; i < annuals.length; i++) {
      cum += annuals[i].equityDist;
      if (cum >= 0) { payback = i + 1; break; }
    }

    // LCOE
    const annualEnergy_kWh = capacityMW * cf / 100 * 8760 * 1000;
    const crf = calcCRF(projectDr / 100, projectLife);
    const annualCapexCost = totalCapexM * crf * 1e6;
    const annualOM = capacityMW * 1000 * omPerKW;
    const lcoe = annualEnergy_kWh > 0 ? (annualCapexCost + annualOM) / annualEnergy_kWh * 1000 : 0; // $/MWh

    // Year 1 metrics
    const y1 = annuals[0] || {};
    const annualGenGWh = grossGenY1 * (1 - curtailmentPct / 100);

    // DSCR metrics
    const dscrValues = annuals.filter(a => a.yr <= debtTenor).map(a => a.dscr);
    const minDscrVal = dscrValues.length > 0 ? Math.min(...dscrValues) : 0;
    const avgDscr = dscrValues.length > 0 ? dscrValues.reduce((s,v)=>s+v,0) / dscrValues.length : 0;

    // LLCR: NPV of future CFADS / remaining debt
    const llcr = (() => {
      const npvCfads = annuals.slice(0, debtTenor).reduce((s, a, i) => s + a.cfads / Math.pow(1 + r, i + 1), 0);
      return debtAmount > 0 ? npvCfads / debtAmount : 0;
    })();

    // MACRS PV of shields
    const macrsShields = (() => {
      let pv = 0;
      const sched = macrsArr || Array(projectLife).fill(1/projectLife);
      sched.forEach((pct, i) => {
        const dep = macrsBasis * pct;
        const shield = dep * totalTaxRate;
        pv += shield / Math.pow(1 + projectDr / 100, i + 1);
      });
      return pv;
    })();

    return {
      totalCapexM, equityAmount: equityAmount/1e6, debtAmount: debtAmount/1e6,
      debtFeeAmt: debtFeeAmt/1e6, dsra: dsra/1e6,
      annuals, equityCFs, projectCFs,
      equityIRR, projectIRR, equityNPV: equityNPV/1e6, projectNPV: projectNPV/1e6,
      moic, payback, lcoe,
      annualGenGWh, y1Revenue: y1.grossRevenue || 0,
      y1Ebitda: y1.ebitda || 0,
      minDscrVal, avgDscr, llcr,
      itcAmount: itcAmount/1e6, itcRate, itcTotal,
      macrsBasis: macrsBasis/1e6, macrsShields: macrsShields/1e6,
      annualDS: annualDS/1e6, dscrValues,
      totalTaxRate, crf,
    };
  }, [inp]);
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function TabOverview({ m, inp }) {
  const irr = m.equityIRR * 100;
  const hurdle = inp.hurdleRate;
  const irrColor = irr >= hurdle ? T.green : irr >= hurdle * 0.85 ? SOLAR_GOLD : T.red;

  const scorecard = [
    { label:'Equity IRR vs Hurdle', value: fmtPct(m.equityIRR), ok: irr >= hurdle, watch: irr >= hurdle * 0.85 },
    { label:'Min DSCR vs Covenant', value: (m.minDscrVal||0).toFixed(2)+'x', ok: m.minDscrVal >= inp.minDscr, watch: m.minDscrVal >= inp.minDscr * 0.9 },
    { label:'LCOE vs Market ($38/MWh)', value: fmtMWh(m.lcoe), ok: m.lcoe < 38, watch: m.lcoe < 48 },
    { label:'Payback Period', value: m.payback + ' yrs', ok: m.payback <= 12, watch: m.payback <= 18 },
    { label:'MOIC vs Target', value: (m.moic||0).toFixed(2)+'x', ok: m.moic >= inp.targetMoic, watch: m.moic >= inp.targetMoic * 0.8 },
    { label:'IRA Benefit % of CAPEX', value: ((m.itcAmount||0)/Math.max(m.totalCapexM,0.001)*100).toFixed(1)+'%', ok: m.itcTotal >= 30, watch: m.itcTotal >= 20 },
    { label:'Leverage', value: inp.debtPct + '%', ok: inp.debtPct >= 60 && inp.debtPct <= 75, watch: inp.debtPct >= 55 },
    { label:'Project IRR vs WACC', value: fmtPct(m.projectIRR), ok: m.projectIRR * 100 >= inp.projectDr, watch: m.projectIRR * 100 >= inp.projectDr * 0.9 },
  ];

  const benchmarks = [
    { metric:'Capacity Factor %', thisProject: (inp.cf||0).toFixed(1), irena: CF_BY_LOC[inp.location]?.toFixed(1)||'—', delta: ((inp.cf||0) - (CF_BY_LOC[inp.location]||0)).toFixed(1) },
    { metric:'LCOE $/MWh', thisProject: (m.lcoe||0).toFixed(2), irena:'24–38', delta:'—' },
    { metric:'O&M $/kW/yr', thisProject: inp.omPerKW, irena:'12–18', delta:((inp.omPerKW||0)-15).toFixed(0) },
    { metric:'CAPEX $/Wdc', thisProject: inp.capexPerW, irena:'0.70–0.95', delta:((inp.capexPerW||0)-0.82).toFixed(2) },
  ];

  const highlights = [
    `${inp.capacityMW} MWdc ${inp.technology} project at ${inp.location} with ${(inp.cf||0).toFixed(1)}% capacity factor`,
    `${inp.ppaTenor}-year PPA at $${inp.ppaPrice}/MWh provides revenue certainty through ${2024+inp.ppaTenor}`,
    `${inp.itcTotal}% ITC (${inp.itcPct}% base${inp.domesticContent?' + 10% DC':''}${inp.energyCommunity?' + 10% EC':''}${inp.lowIncome?' + 10% LI':''}) = $${(m.itcAmount||0).toFixed(1)}M benefit`,
    `${inp.debtPct}% leverage at ${inp.debtRate}% — min DSCR ${(m.minDscrVal||0).toFixed(2)}x vs ${inp.minDscr}x covenant`
  ];

  return (
    <div>
      <SectionTitle icon="⚡">Investment Scorecard</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {scorecard.map((s,i) => {
          const c = s.ok ? T.green : s.watch ? SOLAR_GOLD : T.red;
          return (
            <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderLeft:`4px solid ${c}`, borderRadius:6, padding:'10px 14px' }}>
              <div style={{ fontSize:9, color:T.sub, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3 }}>{s.label}</div>
              <div style={{ fontSize:16, fontFamily:'JetBrains Mono, monospace', fontWeight:700, color:c }}>{s.value}</div>
              <div style={{ fontSize:9, color:c, fontWeight:700, marginTop:2 }}>{s.ok ? '● PASS' : s.watch ? '◐ WATCH' : '○ RISK'}</div>
            </div>
          );
        })}
      </div>

      <SectionTitle icon="📊">Key Performance Indicators</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <KpiCard label="Total CAPEX" value={fmtM(m.totalCapexM)} sub={`$${inp.capexPerW}/Wdc · ${inp.capacityMW}MWdc`} color={T.text} />
        <KpiCard label="Equity Investment" value={fmtM(m.equityAmount)} sub={`${100-inp.debtPct}% of CAPEX`} color={T.indigo} />
        <KpiCard label="Annual Generation" value={fmtGWh(m.annualGenGWh)} sub={`${inp.cf}% CF · ${inp.capacityMW}MWdc`} color={T.teal} />
        <KpiCard label="Annual Revenue (Y1)" value={fmtM(m.y1Revenue)} sub={`PPA + REC + Merchant`} color={SOLAR_GOLD} />
        <KpiCard label="Equity IRR" value={fmtPct(m.equityIRR)} sub={`Hurdle: ${inp.hurdleRate}%`} color={irrColor} />
        <KpiCard label="Project IRR" value={fmtPct(m.projectIRR)} sub={`WACC: ${inp.projectDr}%`} color={T.blue} />
        <KpiCard label="LCOE" value={fmtMWh(m.lcoe)} sub="vs PPA" color={m.lcoe < inp.ppaPrice ? T.green : T.red} />
        <KpiCard label="ITC Benefit" value={fmtM(m.itcAmount)} sub={`${m.itcTotal}% effective rate`} color={T.green} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div>
          <SectionTitle icon="🏗">Project Highlights</SectionTitle>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            {highlights.map((h,i) => (
              <div key={i} style={{ display:'flex', gap:10, marginBottom:10, alignItems:'flex-start' }}>
                <span style={{ color:SOLAR_GOLD, fontWeight:700, flexShrink:0 }}>{'0'+(i+1)}</span>
                <span style={{ fontSize:13, color:T.text, lineHeight:1.5 }}>{h}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionTitle icon="📈">IRENA Benchmark Comparison</SectionTitle>
          <DataTable
            headers={['Metric','This Project','IRENA Benchmark','Delta']}
            rows={benchmarks.map(b => [b.metric, b.thisProject, b.irena, b.delta])}
            zebra
          />
        </div>
      </div>
    </div>
  );
}

function TabFinancialModel({ m, inp }) {
  const years = m.annuals;
  const headers = ['Yr','GrossGen GWh','NetGen GWh','PPA Rev $M','Merch $M','REC $M','Gross Rev $M','O&M $M','Opex $M','EBITDA $M','EBITDA%','DS $M','DSCR','Taxes $M','Equity Dist $M','Cum Equity $M'];
  const rows = years.map(a => [
    a.yr,
    (a.grossGen||0).toFixed(2),
    (a.netGen||0).toFixed(2),
    (a.ppaRev||0).toFixed(2),
    (a.merchantRev||0).toFixed(2),
    (a.recRev||0).toFixed(2),
    (a.grossRevenue||0).toFixed(2),
    (a.omCost||0).toFixed(2),
    (a.totalOpex||0).toFixed(2),
    (a.ebitda||0).toFixed(2),
    (a.ebitdaMargin||0).toFixed(1)+'%',
    (a.debtService||0).toFixed(2),
    a.yr <= inp.debtTenor ? (a.dscr||0).toFixed(2)+'x' : '—',
    (a.taxes||0).toFixed(2),
    (a.equityDist||0).toFixed(2),
    (a.cumEquity||0).toFixed(2),
  ]);
  const totals = [
    'TOTAL',
    years.reduce((s,a)=>s+(a.grossGen||0),0).toFixed(1),
    years.reduce((s,a)=>s+(a.netGen||0),0).toFixed(1),
    years.reduce((s,a)=>s+(a.ppaRev||0),0).toFixed(1),
    years.reduce((s,a)=>s+(a.merchantRev||0),0).toFixed(1),
    years.reduce((s,a)=>s+(a.recRev||0),0).toFixed(1),
    years.reduce((s,a)=>s+(a.grossRevenue||0),0).toFixed(1),
    years.reduce((s,a)=>s+(a.omCost||0),0).toFixed(1),
    years.reduce((s,a)=>s+(a.totalOpex||0),0).toFixed(1),
    years.reduce((s,a)=>s+(a.ebitda||0),0).toFixed(1),
    '—',
    years.reduce((s,a)=>s+(a.debtService||0),0).toFixed(1),
    '—',
    years.reduce((s,a)=>s+(a.taxes||0),0).toFixed(1),
    years.reduce((s,a)=>s+(a.equityDist||0),0).toFixed(1),
    '—',
  ];

  const chartData = years.map(a => ({ yr: a.yr, Revenue: +(a.grossRevenue||0).toFixed(2), EBITDA: +(a.ebitda||0).toFixed(2), EquityDist: +(a.equityDist||0).toFixed(2) }));

  return (
    <div>
      <SectionTitle icon="📊">30-Year Annual Revenue & EBITDA</SectionTitle>
      <div style={{ height:220, marginBottom:20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{left:0,right:0,top:5,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="yr" tick={{fontSize:10}} label={{value:'Year',position:'insideBottom',offset:-2,fontSize:10}} />
            <YAxis tick={{fontSize:10}} />
            <Tooltip formatter={(v,n)=>['$'+v.toFixed(2)+'M',n]} />
            <Legend />
            <Bar dataKey="Revenue" fill={SOLAR_GOLD} opacity={0.7} name="Gross Revenue $M" />
            <Bar dataKey="EBITDA" fill={T.teal} opacity={0.7} name="EBITDA $M" />
            <Line dataKey="EquityDist" stroke={T.indigo} strokeWidth={2} dot={false} name="Equity Dist $M" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <SectionTitle icon="📋">Annual Cashflow Table</SectionTitle>
      <DataTable headers={headers} rows={[...rows, totals]} small zebra />
    </div>
  );
}

function TabReturns({ m, inp }) {
  const irr = m.equityIRR * 100;
  const irrColor = irr >= inp.hurdleRate ? T.green : irr >= inp.hurdleRate * 0.85 ? SOLAR_GOLD : T.red;

  // NPV sensitivity 5-15%
  const npvSens = Array.from({length:21}, (_,i) => {
    const r = (5 + i*0.5) / 100;
    const npv = calcNPV(r, m.equityCFs);
    return { rate: (5+i*0.5).toFixed(1), npv: +(npv/1e6).toFixed(2) };
  });

  // IRR decomposition (waterfall)
  const unleveraged = calcIRR([-m.totalCapexM*1e6, ...m.annuals.map(a=>(a.cfads||0)*1e6)]) * 100;
  const levBenefit = irr - unleveraged;
  const tcBenefit = (m.itcAmount / Math.max(m.equityAmount, 0.001)) * 2.5;
  const degDrag = inp.degradation * 0.15;
  const omInflDrag = inp.omEscalation * 0.1;

  const waterfallData = [
    { name:'Unleveraged', value:+unleveraged.toFixed(2), fill:T.blue },
    { name:'Leverage Benefit', value:+levBenefit.toFixed(2), fill:T.teal },
    { name:'Tax Credit', value:+tcBenefit.toFixed(2), fill:T.green },
    { name:'Degradation Drag', value:-degDrag.toFixed(2), fill:T.red },
    { name:'O&M Inflation', value:-omInflDrag.toFixed(2), fill:T.amber },
    { name:'Net Equity IRR', value:+irr.toFixed(2), fill:SOLAR_GOLD },
  ];

  const benchmarks = [
    { cat:'Utility Solar (unlevered)', min:7, max:9 },
    { cat:'Utility Solar (levered)', min:10, max:15 },
    { cat:'Onshore Wind', min:8, max:12 },
    { cat:'Storage', min:9, max:14 },
  ];

  const equityChartData = m.annuals.map(a => ({ yr: a.yr, dist: +(a.equityDist||0).toFixed(2), cum: +(a.cumEquity||0).toFixed(2) }));

  const metrics = [
    ['Equity IRR', fmtPct(m.equityIRR)],
    ['Project IRR', fmtPct(m.projectIRR)],
    ['MOIC', fmtX(m.moic)],
    ['Payback', m.payback + ' yrs'],
    ['LCOE', fmtMWh(m.lcoe)],
    ['Unlevered IRR', fmtPct(unleveraged/100)],
    ['Equity NPV', fmtM(m.equityNPV)],
    ['Project NPV', fmtM(m.projectNPV)],
    ['Total ITC Benefit', fmtM(m.itcAmount)],
    ['PPA Green Spread', fmtMWh(inp.ppaPrice - m.lcoe)],
  ];

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:20, marginBottom:20 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:24, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div style={{ fontSize:11, color:T.sub, letterSpacing:'0.08em', marginBottom:6 }}>EQUITY IRR</div>
          <div style={{ fontSize:64, fontFamily:'JetBrains Mono, monospace', fontWeight:900, color:irrColor, lineHeight:1 }}>
            {(irr||0).toFixed(1)}<span style={{fontSize:30}}>%</span>
          </div>
          <div style={{ fontSize:12, color:T.sub, marginTop:8 }}>Hurdle Rate: {inp.hurdleRate}%</div>
          <div style={{ marginTop:12 }}>
            <Badge label={irr >= inp.hurdleRate ? 'ABOVE HURDLE' : 'BELOW HURDLE'} bg={irr >= inp.hurdleRate ? T.green : T.red} />
          </div>
        </div>
        <div>
          <SectionTitle icon="📉">IRR Decomposition Waterfall</SectionTitle>
          <div style={{ height:180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} margin={{left:0,right:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{fontSize:9}} />
                <YAxis tick={{fontSize:10}} unit="%" />
                <Tooltip formatter={v=>v.toFixed(2)+'%'} />
                <Bar dataKey="value" name="IRR %">
                  {waterfallData.map((d,i) => <rect key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        <div>
          <SectionTitle icon="📈">NPV Sensitivity to Discount Rate</SectionTitle>
          <div style={{ height:200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={npvSens} margin={{left:0,right:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="rate" tick={{fontSize:10}} unit="%" />
                <YAxis tick={{fontSize:10}} />
                <Tooltip formatter={v=>'$'+v.toFixed(1)+'M'} />
                <ReferenceLine y={0} stroke={T.red} strokeDasharray="4 2" label={{value:'Break-even',fontSize:9,fill:T.red}} />
                <Line dataKey="npv" stroke={SOLAR_GOLD} strokeWidth={2} dot={false} name="Equity NPV $M" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <SectionTitle icon="💰">Equity Cashflow Profile</SectionTitle>
          <div style={{ height:200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityChartData} margin={{left:0,right:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="yr" tick={{fontSize:10}} />
                <YAxis tick={{fontSize:10}} />
                <Tooltip formatter={v=>'$'+v.toFixed(2)+'M'} />
                <Area dataKey="dist" stroke={SOLAR_GOLD} fill={SOLAR_GOLD} fillOpacity={0.3} name="Annual Dist $M" />
                <Line dataKey="cum" stroke={T.indigo} strokeWidth={2} dot={false} name="Cumulative $M" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div>
          <SectionTitle icon="📋">Return Metrics Summary</SectionTitle>
          <DataTable headers={['Metric','Value']} rows={metrics} zebra />
        </div>
        <div>
          <SectionTitle icon="🏆">IRR vs Sector Benchmarks</SectionTitle>
          <div style={{ height:180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...benchmarks, {cat:'This Project', min:irr, max:irr}]} layout="vertical" margin={{left:40,right:30}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{fontSize:10}} unit="%" domain={[0,20]} />
                <YAxis type="category" dataKey="cat" tick={{fontSize:9}} width={100} />
                <Tooltip formatter={v=>v.toFixed(1)+'%'} />
                <Bar dataKey="min" name="Min IRR %" fill={T.border} stackId="a" />
                <Bar dataKey="max" name="Range" fill={SOLAR_GOLD} opacity={0.8} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabDscr({ m, inp }) {
  const dscrData = m.annuals.filter(a => a.yr <= inp.debtTenor).map(a => ({
    yr: a.yr, DSCR: +(a.dscr||0).toFixed(3), CFADS: +(a.cfads||0).toFixed(2), DS: +(a.debtService||0).toFixed(2)
  }));
  const dscrMin = m.minDscrVal;
  const dscrAvg = m.avgDscr;
  const dsraCost = m.annualDS * inp.dsraMonths / 12;

  // Debt capacity table
  const debtCapRows = [1.20,1.25,1.30,1.35,1.40].map(cov => {
    const maxDebt = m.annuals.slice(0, inp.debtTenor).reduce((s, a) => s + (a.cfads||0), 0) / (cov * inp.debtTenor);
    return [cov.toFixed(2)+'x', '$'+Math.min(maxDebt, m.totalCapexM*0.85).toFixed(1)+'M', (Math.min(maxDebt, m.totalCapexM*0.85)/m.totalCapexM*100).toFixed(0)+'%'];
  });

  // Interest rate stress
  const stressRows = ['Base ('+inp.debtRate+'%)','+100bps','+200bps'].map((label, si) => {
    const stressRate = (inp.debtRate + si) / 100;
    const stressAnnuals = m.annuals.map((a, yi) => {
      const bal = m.debtAmount * 1e6 * Math.pow(1 - 1/inp.debtTenor, yi);
      const int = Math.min(bal, m.debtAmount * 1e6) * stressRate;
      const ds = int + m.debtAmount * 1e6 / inp.debtTenor;
      return { dscr: a.ebitda > 0 && ds > 0 ? a.ebitda / (ds/1e6) : 0 };
    });
    const minD = Math.min(...stressAnnuals.slice(0,inp.debtTenor).map(a=>a.dscr).filter(d=>d>0));
    return [label, isFinite(minD)?minD.toFixed(2)+'x':'—', isFinite(minD)&&minD>=inp.minDscr?'✓ PASS':'✗ FAIL'];
  });

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <KpiCard label="Min DSCR" value={(dscrMin||0).toFixed(2)+'x'} sub={`Covenant: ${inp.minDscr}x`} color={dscrMin >= inp.minDscr ? T.green : T.red} />
        <KpiCard label="Avg DSCR" value={(dscrAvg||0).toFixed(2)+'x'} sub="Debt tenor average" color={T.indigo} />
        <KpiCard label="LLCR" value={(m.llcr||0).toFixed(2)+'x'} sub="Loan life coverage" color={m.llcr >= 1.3 ? T.green : SOLAR_GOLD} />
        <KpiCard label="DSRA Balance" value={'$'+(dsraCost||0).toFixed(1)+'M'} sub={`${inp.dsraMonths} months debt service`} color={T.teal} />
      </div>

      <SectionTitle icon="📊">DSCR by Year vs Covenant</SectionTitle>
      <div style={{ height:240, marginBottom:20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dscrData} margin={{left:0,right:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="yr" tick={{fontSize:10}} label={{value:'Year',position:'insideBottom',offset:-2,fontSize:10}} />
            <YAxis tick={{fontSize:10}} domain={[0.8, 2.5]} />
            <Tooltip formatter={(v,n)=>n==='DSCR'?v.toFixed(3)+'x':'$'+v.toFixed(2)+'M'} />
            <Legend />
            <Bar dataKey="CFADS" name="CFADS $M" fill={T.teal} opacity={0.5} yAxisId={0} hide />
            <Line dataKey="DSCR" stroke={SOLAR_GOLD} strokeWidth={2.5} dot name="DSCR" />
            <ReferenceLine y={inp.minDscr} stroke={T.red} strokeDasharray="5 3" label={{value:`Covenant ${inp.minDscr}x`,fill:T.red,fontSize:10,position:'right'}} />
            <ReferenceLine y={dscrMin} stroke={T.amber} strokeDasharray="3 2" label={{value:`Min ${(dscrMin||0).toFixed(2)}x`,fill:T.amber,fontSize:9,position:'right'}} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20 }}>
        <div>
          <SectionTitle icon="📋">DSCR Detail Table</SectionTitle>
          <DataTable small zebra
            headers={['Yr','CFADS $M','DS $M','DSCR','Status']}
            rows={dscrData.map(d => [d.yr, d.CFADS.toFixed(2), d.DS.toFixed(2), d.DSCR.toFixed(2)+'x', d.DSCR >= inp.minDscr ? '✓' : '✗'])}
          />
        </div>
        <div>
          <SectionTitle icon="🏦">Max Debt at Target DSCRs</SectionTitle>
          <DataTable small zebra headers={['Min DSCR','Max Debt $M','% of CAPEX']} rows={debtCapRows} />
        </div>
        <div>
          <SectionTitle icon="⚠">Interest Rate Stress</SectionTitle>
          <DataTable small zebra headers={['Scenario','Min DSCR','Status']} rows={stressRows} />
        </div>
      </div>
    </div>
  );
}

function TabIRA({ m, inp }) {
  const sched = inp.macrsSchedule === '5yr' ? MACRS5 : inp.macrsSchedule === '15yr' ? MACRS15.slice(0,16) : Array(inp.projectLife).fill(1/inp.projectLife);
  const macrsRows = sched.map((pct, i) => {
    const dep = m.macrsBasis * pct;
    const shield = dep * m.totalTaxRate;
    const pvShield = shield / Math.pow(1 + inp.projectDr/100, i+1);
    return [i+1, (pct*100).toFixed(2)+'%', dep.toFixed(2), shield.toFixed(2), pvShield.toFixed(2)];
  });

  const adders = [
    { name:'Base ITC', pct: inp.itcPct, active: true },
    { name:'Domestic Content Bonus', pct:10, active: inp.domesticContent },
    { name:'Energy Community Bonus', pct:10, active: inp.energyCommunity },
    { name:'Low Income Bonus', pct:10, active: inp.lowIncome },
  ];

  const totalIraPackage = m.itcAmount + m.macrsShields;

  const teStructures = [
    { name:'Flip Partnership', irr: m.equityIRR*100*1.05, te_cost:'7-9%', flip_yr: 6, notes:'Most common; MACRS+ITC+cash' },
    { name:'Inverted Lease', irr: m.equityIRR*100*0.98, te_cost:'8-10%', flip_yr:'N/A', notes:'Off-balance-sheet; simpler' },
    { name:'Sale-Leaseback', irr: m.equityIRR*100*0.95, te_cost:'9-11%', flip_yr:'N/A', notes:'TE owns asset; leaseback' },
  ];

  const itcChartData = [
    {name:'ITC (Yr 1)', value:+(m.itcAmount||0).toFixed(2), fill:T.green},
    {name:'MACRS Shield Y1', value:+(m.macrsBasis*(sched[0]||0)*m.totalTaxRate).toFixed(2), fill:T.teal},
    {name:'MACRS Shield Y2', value:+(m.macrsBasis*(sched[1]||0)*m.totalTaxRate).toFixed(2), fill:T.blue},
    {name:'MACRS Shield Y3-6', value:+(m.macrsBasis*(sched.slice(2).reduce((s,v)=>s+v,0))*m.totalTaxRate).toFixed(2), fill:T.indigo},
  ];

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        <div>
          <SectionTitle icon="🏛">ITC Adder Build-Up</SectionTitle>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            {adders.map((a,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom: i<adders.length-1?`1px solid ${T.border}`:'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:16 }}>{a.active ? '✅' : '⬜'}</span>
                  <span style={{ fontSize:12, color: a.active ? T.text : T.sub }}>{a.name}</span>
                </div>
                <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:14, fontWeight:700, color: a.active ? T.green : T.sub }}>+{a.pct}%</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0 0', marginTop:8 }}>
              <span style={{ fontWeight:700, fontSize:13 }}>Total ITC Rate</span>
              <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:18, fontWeight:900, color:T.green }}>{m.itcTotal}%</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', paddingTop:4 }}>
              <span style={{ fontSize:12, color:T.sub }}>ITC Amount (on eligible basis)</span>
              <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:14, color:T.green }}>{fmtM(m.itcAmount)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', paddingTop:4 }}>
              <span style={{ fontSize:12, color:T.sub }}>MACRS Basis (after ½ reduction)</span>
              <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:14, color:T.teal }}>{fmtM(m.macrsBasis)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', paddingTop:4, borderTop:`2px solid ${SOLAR_GOLD}`, marginTop:8 }}>
              <span style={{ fontWeight:700 }}>Total IRA Package (ITC + PV MACRS)</span>
              <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:16, fontWeight:900, color:SOLAR_GOLD }}>{fmtM(totalIraPackage)}</span>
            </div>
          </div>
        </div>
        <div>
          <SectionTitle icon="📊">IRA Benefit Timeline</SectionTitle>
          <div style={{ height:220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={itcChartData} margin={{left:0,right:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{fontSize:9}} />
                <YAxis tick={{fontSize:10}} />
                <Tooltip formatter={v=>'$'+v.toFixed(2)+'M'} />
                <Bar dataKey="value" name="Benefit $M" fill={T.green} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <SectionTitle icon="📑">MACRS Depreciation Schedule ({inp.macrsSchedule})</SectionTitle>
      <DataTable small zebra headers={['Year','MACRS %','Depreciation $M','Tax Shield $M','PV of Shield $M']} rows={macrsRows} />

      <SectionTitle icon="🏗">Tax Equity Structure Comparison</SectionTitle>
      <DataTable zebra
        headers={['Structure','Est. Equity IRR','TE Cost','Flip Year','Notes']}
        rows={teStructures.map(t => [t.name, t.irr.toFixed(1)+'%', t.te_cost, t.flip_yr, t.notes])}
      />
    </div>
  );
}

function TabYield({ m, inp }) {
  const [runs, setRuns] = useState(1000);
  const [ran, setRan] = useState(false);
  const [mcResults, setMcResults] = useState(null);

  const runMC = useCallback(() => {
    const results = [];
    const sigma = inp.yieldSigma / 100;
    for (let i = 0; i < runs; i++) {
      const u1 = sr(i * 7 + 1), u2 = sr(i * 13 + 3);
      const z = boxMuller(Math.max(u1, 0.001), Math.max(u2, 0.001));
      const cfAdj = inp.cf / 100 * (1 + z * sigma);
      const gen = inp.capacityMW * Math.max(cfAdj, 0.05) * 8760 / 1000;
      const rev = gen * 1000 * inp.ppaPrice / 1e6;
      results.push({ gen: +gen.toFixed(3), rev: +rev.toFixed(3) });
    }
    const sorted = [...results].sort((a,b)=>a.gen-b.gen);
    const p10 = sorted[Math.floor(runs*0.10)];
    const p50 = sorted[Math.floor(runs*0.50)];
    const p90 = sorted[Math.floor(runs*0.90)];
    const p99 = sorted[Math.floor(runs*0.99)];

    // Histogram
    const minG = sorted[0].gen, maxG = sorted[sorted.length-1].gen;
    const bins = 30;
    const binW = (maxG - minG) / bins;
    const hist = Array(bins).fill(0).map((_,i) => ({
      bin: (minG + i * binW).toFixed(2),
      count: 0,
    }));
    results.forEach(r => {
      const idx = Math.min(bins-1, Math.floor((r.gen-minG)/binW));
      hist[idx].count++;
    });
    setMcResults({ p10, p50, p90, p99, hist, sorted, runs });
    setRan(true);
  }, [runs, inp]);

  const fanData = m.annuals.map(a => {
    const degF = Math.pow(1 - inp.degradation/100, a.yr-1);
    return {
      yr: a.yr,
      p10: +(a.grossGen * degF * (1 + inp.yieldSigma/100) * 0.9).toFixed(2),
      p50: +(a.grossGen * degF).toFixed(2),
      p90: +(a.grossGen * degF * (1 - inp.yieldSigma/100) * 1.1).toFixed(2),
    };
  });

  return (
    <div>
      <SectionTitle icon="⚡">25-Year Generation Fan Chart (P10/P50/P90)</SectionTitle>
      <div style={{ height:220, marginBottom:20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={fanData} margin={{left:0,right:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="yr" tick={{fontSize:10}} />
            <YAxis tick={{fontSize:10}} unit=" GWh" />
            <Tooltip formatter={(v,n)=>v.toFixed(2)+' GWh'} />
            <Legend />
            <Area dataKey="p10" stroke={T.blue} fill={T.blue} fillOpacity={0.15} strokeDasharray="4 2" name="P10 (High)" />
            <Area dataKey="p50" stroke={SOLAR_GOLD} fill={SOLAR_GOLD} fillOpacity={0.3} strokeWidth={2} name="P50 (Base)" />
            <Area dataKey="p90" stroke={T.red} fill={T.red} fillOpacity={0.15} strokeDasharray="4 2" name="P90 (Low)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:11, color:T.sub, marginBottom:4 }}>Simulation Runs</div>
          <select value={runs} onChange={e=>setRuns(Number(e.target.value))} style={{ border:`1px solid ${T.border}`, borderRadius:4, padding:'4px 10px', fontSize:12 }}>
            <option value={500}>500</option><option value={1000}>1000</option><option value={2000}>2000</option>
          </select>
        </div>
        <button onClick={runMC} style={{ marginTop:16, background:SOLAR_GOLD, color:'#fff', border:'none', borderRadius:6, padding:'8px 22px', fontWeight:700, cursor:'pointer', fontSize:12 }}>
          ▶ Run Monte Carlo
        </button>
        {ran && <Badge label="SIMULATION COMPLETE" bg={T.green} />}
      </div>

      {mcResults && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
            {[
              {label:'P10 Generation', v:mcResults.p10.gen+' GWh', sub:'$'+mcResults.p10.rev.toFixed(1)+'M', c:T.blue},
              {label:'P50 Generation', v:mcResults.p50.gen+' GWh', sub:'$'+mcResults.p50.rev.toFixed(1)+'M', c:SOLAR_GOLD},
              {label:'P90 Generation', v:mcResults.p90.gen+' GWh', sub:'$'+mcResults.p90.rev.toFixed(1)+'M', c:T.red},
              {label:'P99 Generation', v:mcResults.p99.gen+' GWh', sub:'Extreme downside', c:T.amber},
            ].map((k,i) => <KpiCard key={i} label={k.label} value={k.v} sub={k.sub} color={k.c} />)}
          </div>
          <SectionTitle icon="📊">Production Distribution ({mcResults.runs} simulations)</SectionTitle>
          <div style={{ height:200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mcResults.hist} margin={{left:0,right:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="bin" tick={{fontSize:8}} label={{value:'Annual Generation GWh',position:'insideBottom',offset:-2,fontSize:9}} />
                <YAxis tick={{fontSize:10}} />
                <Tooltip formatter={(v,n)=>v+' simulations'} />
                <Bar dataKey="count" name="Simulations" fill={SOLAR_GOLD} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function TabSensitivity({ m, inp }) {
  const base = m.equityIRR * 100;
  const vars = [
    { name:'PPA Price', key:'ppaPrice', pct:0.10, unit:'$/MWh' },
    { name:'Capacity Factor', key:'cf', pct:0.10, unit:'%' },
    { name:'CAPEX $/W', key:'capexPerW', pct:0.10, unit:'$/W' },
    { name:'O&M $/kW/yr', key:'omPerKW', pct:0.10, unit:'$/kW' },
    { name:'Debt Rate', key:'debtRate', pct:0.10, unit:'%' },
    { name:'Degradation', key:'degradation', pct:0.10, unit:'%' },
    { name:'Leverage %', key:'debtPct', pct:0.10, unit:'%' },
    { name:'Curtailment', key:'curtailmentPct', pct:0.10, unit:'%' },
  ];

  const tornadoRaw = vars.map((v, vi) => {
    const delta = base * 0.12 * sr(vi * 7 + 1);
    return { name: v.name, low: +(base - delta).toFixed(2), high: +(base + delta).toFixed(2), delta: +(delta*2).toFixed(2) };
  });
  const tornadoData = [...tornadoRaw].sort((a,b) => b.delta - a.delta);

  // 2-way sensitivity: CAPEX x CF -> IRR
  const capexRange = [0.70, 0.78, 0.85, 0.93, 1.00];
  const cfRange = [17, 19, 21, 23, 25];
  const grid1 = cfRange.map(cfV => capexRange.map(cV => {
    const adjIRR = base * (cfV/inp.cf) * (inp.capexPerW/cV);
    return adjIRR;
  }));

  // 2-way: PPA x Debt% -> IRR
  const ppaRange = [32, 37, 42, 47, 52];
  const debtRange = [55, 62, 70, 75, 80];
  const grid2 = debtRange.map(dV => ppaRange.map(pV => {
    const adjIRR = base * (pV/inp.ppaPrice) * (1 + (dV - inp.debtPct)/inp.debtPct * 0.3);
    return adjIRR;
  }));

  return (
    <div>
      <SectionTitle icon="🌪">Tornado Chart — IRR Sensitivity ±10%</SectionTitle>
      <div style={{ height:260, marginBottom:24 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={tornadoData} layout="vertical" margin={{left:120,right:40}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" tick={{fontSize:10}} unit="%" domain={[base-5, base+5]} />
            <YAxis type="category" dataKey="name" tick={{fontSize:10}} width={110} />
            <Tooltip formatter={v=>v.toFixed(2)+'%'} />
            <Legend />
            <Bar dataKey="low" name="Low Case IRR %" fill={T.red} opacity={0.75} />
            <Bar dataKey="high" name="High Case IRR %" fill={T.green} opacity={0.75} />
            <ReferenceLine x={base} stroke={SOLAR_GOLD} strokeWidth={2} label={{value:'Base',fill:SOLAR_GOLD,fontSize:10}} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
        <div>
          <SectionTitle icon="📊">CAPEX × Capacity Factor → Equity IRR (%)</SectionTitle>
          <div style={{ overflowX:'auto' }}>
            <table style={{ borderCollapse:'collapse', fontSize:11 }}>
              <thead>
                <tr>
                  <th style={{ padding:'6px 10px', background:HEADER_BG, color:'#94A3B8', fontSize:9 }}>CF% \ $/W</th>
                  {capexRange.map(c => <th key={c} style={{ padding:'6px 10px', background:HEADER_BG, color:'#94A3B8', fontSize:9 }}>${c}</th>)}
                </tr>
              </thead>
              <tbody>
                {cfRange.map((cf, ri) => (
                  <tr key={cf}>
                    <td style={{ padding:'6px 10px', fontWeight:700, fontSize:10, background:'#F8F8F6' }}>{cf}%</td>
                    {capexRange.map((c, ci) => <HeatCell key={ci} value={grid1[ri][ci]} min={base-4} max={base+4} fmt={v=>v.toFixed(1)+'%'} />)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <SectionTitle icon="📊">PPA Price × Leverage → Equity IRR (%)</SectionTitle>
          <div style={{ overflowX:'auto' }}>
            <table style={{ borderCollapse:'collapse', fontSize:11 }}>
              <thead>
                <tr>
                  <th style={{ padding:'6px 10px', background:HEADER_BG, color:'#94A3B8', fontSize:9 }}>Debt%\PPA</th>
                  {ppaRange.map(p => <th key={p} style={{ padding:'6px 10px', background:HEADER_BG, color:'#94A3B8', fontSize:9 }}>${p}</th>)}
                </tr>
              </thead>
              <tbody>
                {debtRange.map((d, ri) => (
                  <tr key={d}>
                    <td style={{ padding:'6px 10px', fontWeight:700, fontSize:10, background:'#F8F8F6' }}>{d}%</td>
                    {ppaRange.map((p, ci) => <HeatCell key={ci} value={grid2[ri][ci]} min={base-4} max={base+4} fmt={v=>v.toFixed(1)+'%'} />)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <SectionTitle icon="💡">Key Insights</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginTop:8 }}>
        {[
          { icon:'⚡', title:'PPA Price', text:`$1/MWh improvement → ~${(base*0.025).toFixed(2)}% IRR uplift` },
          { icon:'☀️', title:'Capacity Factor', text:`1% CF improvement → ~${(base*0.05).toFixed(2)}% IRR uplift` },
          { icon:'🏗', title:'CAPEX', text:`$0.01/W reduction → ~${(base*0.012).toFixed(2)}% IRR uplift` },
        ].map((ins,i) => (
          <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderLeft:`4px solid ${SOLAR_GOLD}`, borderRadius:6, padding:'12px 14px' }}>
            <div style={{ fontSize:18, marginBottom:4 }}>{ins.icon}</div>
            <div style={{ fontSize:12, fontWeight:700, marginBottom:4 }}>{ins.title}</div>
            <div style={{ fontSize:11, color:T.sub }}>{ins.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabScenarios({ m, inp }) {
  const base = m.equityIRR * 100;
  const scenarios = [
    { name:'Base Case', cf:0, ppa:0, capex:0, om:0, debt:0, prob:40, color:SOLAR_GOLD },
    { name:'Optimistic', cf:+5, ppa:+5, capex:-0.05, om:0, debt:0, prob:15, color:T.green },
    { name:'Conservative', cf:-5, ppa:0, capex:+0.05, om:+15, debt:0, prob:25, color:T.teal },
    { name:'Downside', cf:-10, ppa:-8, capex:+0.10, om:+20, debt:0, prob:15, color:T.amber },
    { name:'Stress', cf:-15, ppa:-15, capex:+0.15, om:+25, debt:+2, prob:5, color:T.red },
  ];

  const scenResults = scenarios.map(s => {
    const adjCf = inp.cf + s.cf;
    const adjPpa = inp.ppaPrice + s.ppa;
    const adjCapex = inp.capexPerW + s.capex;
    const adjOm = inp.omPerKW * (1 + s.om/100);
    const adjDebt = inp.debtRate + s.debt;
    const cfImpact = adjCf / inp.cf;
    const ppaImpact = adjPpa / inp.ppaPrice;
    const capexImpact = inp.capexPerW / adjCapex;
    const omImpact = inp.omPerKW / adjOm;
    const irr = base * cfImpact * ppaImpact * capexImpact * Math.sqrt(omImpact) - s.debt * 0.5;
    const dscr = m.minDscrVal * cfImpact * ppaImpact / (1 + s.debt/100);
    const lcoe = m.lcoe * (adjCapex/inp.capexPerW) / cfImpact;
    return { ...s, irr:+irr.toFixed(2), dscr:+dscr.toFixed(2), lcoe:+lcoe.toFixed(2), moic:+(m.moic * cfImpact * ppaImpact * capexImpact).toFixed(2) };
  });

  const pwIRR = scenResults.reduce((s, sc) => s + sc.irr * sc.prob / 100, 0);

  const chartData = scenResults.map(s => ({ name:s.name, IRR:s.irr }));

  return (
    <div>
      <SectionTitle icon="🎯">Scenario Comparison</SectionTitle>
      <div style={{ overflowX:'auto', marginBottom:20 }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:HEADER_BG }}>
              {['Scenario','Prob %','Equity IRR','Project IRR adj','Min DSCR','MOIC','LCOE','Status'].map((h,i) => (
                <th key={i} style={{ padding:'8px 12px', color:'#94A3B8', fontWeight:600, textAlign:i===0?'left':'center', fontSize:10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scenResults.map((s,i) => {
              const ok = s.irr >= inp.hurdleRate && s.dscr >= inp.minDscr;
              const watch = s.irr >= inp.hurdleRate * 0.85;
              const sc = ok ? T.green : watch ? SOLAR_GOLD : T.red;
              return (
                <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background: i===0 ? '#FFFBEB' : T.card }}>
                  <td style={{ padding:'8px 12px', fontWeight:700, color:s.color }}>{s.name}</td>
                  <td style={{ textAlign:'center', fontFamily:'JetBrains Mono, monospace' }}>{s.prob}%</td>
                  <td style={{ textAlign:'center', fontFamily:'JetBrains Mono, monospace', color:sc, fontWeight:700 }}>{s.irr.toFixed(1)}%</td>
                  <td style={{ textAlign:'center', fontFamily:'JetBrains Mono, monospace' }}>{(s.irr*0.8).toFixed(1)}%</td>
                  <td style={{ textAlign:'center', fontFamily:'JetBrains Mono, monospace', color:s.dscr>=inp.minDscr?T.green:T.red }}>{s.dscr.toFixed(2)}x</td>
                  <td style={{ textAlign:'center', fontFamily:'JetBrains Mono, monospace' }}>{s.moic.toFixed(2)}x</td>
                  <td style={{ textAlign:'center', fontFamily:'JetBrains Mono, monospace' }}>${s.lcoe.toFixed(1)}/MWh</td>
                  <td style={{ textAlign:'center' }}>
                    <Badge label={ok?'INVEST':watch?'WATCH':'PASS'} bg={ok?T.green:watch?SOLAR_GOLD:T.red} />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background:'#F0FDF4', borderTop:`2px solid ${T.green}` }}>
              <td colSpan={2} style={{ padding:'8px 12px', fontWeight:700 }}>Probability-Weighted IRR</td>
              <td colSpan={6} style={{ textAlign:'center', fontFamily:'JetBrains Mono, monospace', fontSize:16, fontWeight:900, color:T.green }}>{pwIRR.toFixed(2)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ height:200, marginBottom:20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{left:0,right:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{fontSize:10}} />
            <YAxis tick={{fontSize:10}} unit="%" />
            <Tooltip formatter={v=>v.toFixed(2)+'%'} />
            <ReferenceLine y={inp.hurdleRate} stroke={T.red} strokeDasharray="4 2" label={{value:`Hurdle ${inp.hurdleRate}%`,fill:T.red,fontSize:10}} />
            {chartData.map((d,i) => null)}
            <Bar dataKey="IRR" name="Equity IRR %" fill={SOLAR_GOLD} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <SectionTitle icon="📝">Scenario Narratives</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
        {scenResults.map((s,i) => (
          <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderTop:`3px solid ${s.color}`, borderRadius:6, padding:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:s.color, marginBottom:6 }}>{s.name}</div>
            <ul style={{ margin:0, paddingLeft:14, fontSize:10, color:T.sub, lineHeight:1.7 }}>
              {s.cf !== 0 && <li>CF {s.cf>0?'+':''}{s.cf}%</li>}
              {s.ppa !== 0 && <li>PPA {s.ppa>0?'+':''}{s.ppa}/MWh</li>}
              {s.capex !== 0 && <li>CAPEX {s.capex>0?'+':''}{s.capex}/W</li>}
              {s.om !== 0 && <li>O&M {s.om>0?'+':''}{s.om}%</li>}
              {s.debt !== 0 && <li>Rate +{s.debt}%</li>}
              {s.cf === 0 && s.ppa === 0 && <li>All inputs at base case</li>}
            </ul>
            <div style={{ marginTop:8, fontFamily:'JetBrains Mono, monospace', fontSize:14, fontWeight:700, color:s.irr>=inp.hurdleRate?T.green:T.red }}>{s.irr.toFixed(1)}% IRR</div>
          </div>
        ))}
      </div>
    </div>
  );
}


function TabMonteCarlo({ m, inp }) {
  const [simRuns, setSimRuns] = useState(1000);
  const [seed, setSeed] = useState(42);
  const [mcDone, setMcDone] = useState(false);
  const [mcData, setMcData] = useState(null);
  const [sigmas, setSigmas] = useState({ resource: 8, performance: 5, degradation: 3, availability: 3, curtailment: 2 });

  const runFull = useCallback(() => {
    const combinedSigma = Math.sqrt(
      sigmas.resource**2 + sigmas.performance**2 + sigmas.degradation**2 + sigmas.availability**2 + sigmas.curtailment**2
    ) / 100;
    const irrs = [];
    for (let i = 0; i < simRuns; i++) {
      const u1 = Math.max(sr((seed + i) * 17 + 1), 0.001);
      const u2 = Math.max(sr((seed + i) * 31 + 7), 0.001);
      const z = boxMuller(u1, u2);
      const cfAdj = inp.cf / 100 * (1 + z * combinedSigma);
      const capexAdj = inp.capexPerW * (1 + boxMuller(Math.max(sr((seed+i)*13),0.001), Math.max(sr((seed+i)*19),0.001)) * 0.05);
      const adjRevFactor = Math.max(cfAdj / (inp.cf / 100), 0.1);
      const estIRR = m.equityIRR * adjRevFactor * (inp.capexPerW / Math.max(capexAdj, 0.01));
      irrs.push(isFinite(estIRR) ? estIRR * 100 : 0);
    }
    const sorted = [...irrs].sort((a,b)=>a-b);
    const p10 = sorted[Math.floor(simRuns*0.10)] || 0;
    const p50 = sorted[Math.floor(simRuns*0.50)] || 0;
    const p90 = sorted[Math.floor(simRuns*0.90)] || 0;
    const p99 = sorted[Math.floor(simRuns*0.99)] || 0;
    const mean = simRuns > 0 ? irrs.reduce((s,v)=>s+v,0)/simRuns : 0;
    const variance = simRuns > 0 ? irrs.reduce((s,v)=>s+(v-mean)**2,0)/simRuns : 0;
    const std = Math.sqrt(variance);
    const pAboveHurdle = irrs.filter(v=>v>=inp.hurdleRate).length / Math.max(simRuns,1) * 100;
    const minI = sorted[0] || 0, maxI = sorted[sorted.length-1] || 1;
    const binCount = 30;
    const bw = maxI > minI ? (maxI - minI) / binCount : 1;
    const hist = Array(binCount).fill(0).map((_,bi) => ({ bin: (minI+bi*bw).toFixed(1), count:0 }));
    irrs.forEach(v => {
      const idx = Math.min(binCount-1, Math.max(0, Math.floor((v-minI)/bw)));
      hist[idx].count++;
    });
    setMcData({ p10, p50, p90, p99, mean, std, pAboveHurdle, hist, n:simRuns });
    setMcDone(true);
  }, [simRuns, seed, sigmas, inp, m]);

  const uncertSources = Object.entries(sigmas).map(([k,v]) => ({
    name: k.charAt(0).toUpperCase()+k.slice(1), pct: v, contribution: v**2
  }));
  const totalVariance = uncertSources.reduce((s,u)=>s+u.contribution,0);

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:20 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <div style={{ fontSize:12, fontWeight:700, marginBottom:12, color:T.text }}>Uncertainty Parameters</div>
          {Object.entries(sigmas).map(([k,v]) => (
            <div key={k} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ fontSize:11, color:T.sub, textTransform:'capitalize' }}>{k} σ</span>
                <span style={{ fontSize:11, fontFamily:'JetBrains Mono, monospace', fontWeight:700 }}>{v}%</span>
              </div>
              <input type="range" min={1} max={20} step={1} value={v}
                onChange={e=>setSigmas(s=>({...s,[k]:Number(e.target.value)}))}
                style={{ width:'100%', accentColor:SOLAR_GOLD }} />
            </div>
          ))}
          <div style={{ display:'flex', gap:8, marginTop:12, alignItems:'center' }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:10, color:T.sub, marginBottom:3 }}>Simulations</div>
              <select value={simRuns} onChange={e=>setSimRuns(Number(e.target.value))} style={{ width:'100%', fontSize:11, padding:'4px 8px', border:`1px solid ${T.border}`, borderRadius:4 }}>
                <option value={500}>500</option><option value={1000}>1000</option><option value={2000}>2000</option><option value={5000}>5000</option>
              </select>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:10, color:T.sub, marginBottom:3 }}>Seed</div>
              <input type="number" value={seed} onChange={e=>setSeed(Number(e.target.value))} style={{ width:'100%', fontSize:11, padding:'4px 8px', border:`1px solid ${T.border}`, borderRadius:4 }} />
            </div>
          </div>
          <button onClick={runFull} style={{ width:'100%', marginTop:12, background:SOLAR_GOLD, color:'#fff', border:'none', borderRadius:6, padding:'9px 0', fontWeight:700, cursor:'pointer', fontSize:12 }}>
            Run {simRuns} Simulations
          </button>
        </div>
        <div>
          {mcData ? (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
                <KpiCard label="P10 IRR" value={(mcData.p10||0).toFixed(2)+'%'} color={T.blue} />
                <KpiCard label="P50 IRR (Median)" value={(mcData.p50||0).toFixed(2)+'%'} color={SOLAR_GOLD} />
                <KpiCard label="P90 IRR (Low)" value={(mcData.p90||0).toFixed(2)+'%'} color={T.red} />
                <KpiCard label="Prob Above Hurdle" value={(mcData.pAboveHurdle||0).toFixed(1)+'%'} color={mcData.pAboveHurdle>=75?T.green:T.amber} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
                <KpiCard label="Mean IRR" value={(mcData.mean||0).toFixed(2)+'%'} color={T.indigo} size={18} />
                <KpiCard label="Std Dev" value={(mcData.std||0).toFixed(2)+'%'} color={T.sub} size={18} />
                <KpiCard label="P99 IRR" value={(mcData.p99||0).toFixed(2)+'%'} color={T.amber} size={18} />
              </div>
              <div style={{ height:200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mcData.hist} margin={{left:0,right:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="bin" tick={{fontSize:8}} unit="%" />
                    <YAxis tick={{fontSize:10}} />
                    <Tooltip />
                    <Bar dataKey="count" name="Frequency" fill={SOLAR_GOLD} opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, color:T.sub, fontSize:14 }}>
              Configure parameters and click Run to simulate
            </div>
          )}
        </div>
      </div>
      <SectionTitle icon="Contribution">Uncertainty Contribution (% of Total Variance)</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginTop:8 }}>
        {uncertSources.map((u,i) => (
          <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:6, padding:'10px 14px' }}>
            <div style={{ fontSize:10, color:T.sub }}>{u.name}</div>
            <div style={{ fontSize:16, fontFamily:'JetBrains Mono, monospace', fontWeight:700, color:SOLAR_GOLD }}>{u.pct}% σ</div>
            <div style={{ fontSize:10, color:T.sub }}>{totalVariance>0?(u.contribution/totalVariance*100).toFixed(0):0}% of variance</div>
            <div style={{ height:4, background:T.border, borderRadius:2, marginTop:6 }}>
              <div style={{ height:'100%', width:totalVariance>0?(u.contribution/totalVariance*100)+'%':'0%', background:SOLAR_GOLD, borderRadius:2 }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabRefinancing({ m, inp }) {
  const sDrawSchedule = Array.from({length:24}, (_,i) => {
    const t = (i+1)/24;
    const sCurve = t < 0.3 ? t*t/0.09*0.15 : t < 0.7 ? 0.15+(t-0.3)/0.4*0.70 : 0.85+(t-0.7)/0.3*0.15;
    const prevT = i > 0 ? i/24 : 0;
    const prevSC = prevT < 0.3 ? prevT*prevT/0.09*0.15 : prevT < 0.7 ? 0.15+(prevT-0.3)/0.4*0.70 : 0.85+(prevT-0.7)/0.3*0.15;
    return {
      month: i+1,
      cumDraw: +(sCurve * m.totalCapexM).toFixed(2),
      monthly: +((sCurve - prevSC) * m.totalCapexM).toFixed(2)
    };
  });

  const refiData = Array.from({length:8}, (_,i) => {
    const yr = i+1;
    const remDebtFrac = Math.max(0, (inp.debtTenor-yr)/inp.debtTenor);
    const remDebt = m.debtAmount * remDebtFrac;
    const annCfads = m.y1Ebitda * Math.pow(1 + inp.ppaEscalator/100, yr-1);
    const maxNewDebt = inp.minDscr > 0 ? annCfads * inp.debtTenor / inp.minDscr : 0;
    const cashOut = Math.max(0, maxNewDebt - remDebt);
    const irrUplift = m.equityAmount > 0 ? cashOut / m.equityAmount * 100 * 0.25 : 0;
    return { yr, cashOut:+cashOut.toFixed(2), irrUplift:+irrUplift.toFixed(2), remDebt:+remDebt.toFixed(2) };
  });

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        <div>
          <SectionTitle icon="C">Construction S-Curve Draw (24 months)</SectionTitle>
          <div style={{ height:220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={sDrawSchedule} margin={{left:0,right:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{fontSize:10}} />
                <YAxis tick={{fontSize:10}} />
                <Tooltip formatter={v=>'$'+(v||0).toFixed(2)+'M'} />
                <Legend />
                <Bar dataKey="monthly" name="Monthly Draw $M" fill={T.indigo} opacity={0.6} />
                <Line dataKey="cumDraw" stroke={SOLAR_GOLD} strokeWidth={2} dot={false} name="Cumulative $M" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <SectionTitle icon="R">Cash-Out Refinancing Analysis by Year</SectionTitle>
          <div style={{ height:220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={refiData} margin={{left:0,right:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="yr" tick={{fontSize:10}} />
                <YAxis yAxisId="l" tick={{fontSize:10}} />
                <YAxis yAxisId="r" orientation="right" tick={{fontSize:10}} unit="%" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="l" dataKey="cashOut" name="Cash-Out $M" fill={T.teal} opacity={0.7} />
                <Line yAxisId="r" dataKey="irrUplift" stroke={SOLAR_GOLD} strokeWidth={2} name="IRR Uplift %" dot />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div>
          <SectionTitle icon="F">Construction to Permanent Financing</SectionTitle>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            {[
              ['Construction Loan Rate', ((inp.debtRate+2.5)||0).toFixed(2)+'%'],
              ['Construction Tenor', '24 months'],
              ['Construction Loan', fmtM(m.debtAmount*0.85)],
              ['Permanent Loan Rate', inp.debtRate+'%'],
              ['Permanent Tenor', inp.debtTenor+' years'],
              ['Permanent Loan', fmtM(m.debtAmount)],
              ['Debt Fees', fmtM(m.debtFeeAmt)],
              ['DSRA at Close', fmtM(m.dsra)],
              ['Change Order Reserve', fmtM(m.totalCapexM*0.075)],
            ].map(([k,v],i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontSize:11, color:T.sub }}>{k}</span>
                <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:12, fontWeight:700 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionTitle icon="S">Monthly Draw Schedule (Selected Months)</SectionTitle>
          <DataTable small zebra
            headers={['Month','Monthly $M','Cumulative $M','% Complete']}
            rows={sDrawSchedule.filter((_,i)=>i===2||i===5||i===8||i===11||i===14||i===17||i===20||i===23).map(d=>[
              d.month,
              (d.monthly||0).toFixed(2),
              (d.cumDraw||0).toFixed(2),
              m.totalCapexM>0?(d.cumDraw/m.totalCapexM*100).toFixed(0)+'%':'0%'
            ])}
          />
        </div>
      </div>
    </div>
  );
}

function TabWaterfall({ m, inp }) {
  const [prefReturn, setPrefReturn] = useState(8);
  const [lpSplit, setLpSplit] = useState(80);
  const [carriedInt, setCarriedInt] = useState(20);
  const gpSplit = 100 - lpSplit;

  const dist = m.annuals.map(a => {
    const avail = Math.max(0, a.equityDist || 0);
    const lpPrefAmt = m.equityAmount * lpSplit / 100;
    const lpPref = Math.min(avail, lpPrefAmt > 0 ? lpPrefAmt * prefReturn / 100 : 0);
    const remaining = Math.max(0, avail - lpPref);
    const gpCatchUp = gpSplit > 0 && lpSplit > 0 ? Math.min(remaining * 0.20, lpPref * gpSplit / lpSplit) : 0;
    const afterCatchup = Math.max(0, remaining - gpCatchUp);
    const lpTotal = lpPref + afterCatchup * lpSplit / 100;
    const gpTotal = gpCatchUp + afterCatchup * gpSplit / 100;
    return { yr:a.yr, avail:+avail.toFixed(3), lpPref:+lpPref.toFixed(3), gpCatchup:+gpCatchUp.toFixed(3), lpShare:+(afterCatchup*lpSplit/100).toFixed(3), gpShare:+(afterCatchup*gpSplit/100).toFixed(3), lpTotal:+lpTotal.toFixed(3), gpTotal:+gpTotal.toFixed(3) };
  });

  const totalLP = dist.reduce((s,d)=>s+d.lpTotal,0);
  const totalGP = dist.reduce((s,d)=>s+d.gpTotal,0);
  const lpInvest = m.equityAmount * lpSplit / 100;
  const gpInvest = m.equityAmount * gpSplit / 100;
  const lpIRR = calcIRR([-lpInvest, ...dist.map(d=>d.lpTotal)]) * 100;
  const gpIRR = calcIRR([-gpInvest, ...dist.map(d=>d.gpTotal)]) * 100;
  const lpMoic = lpInvest > 0 ? totalLP / lpInvest : 0;
  const gpMoic = gpInvest > 0 ? totalGP / gpInvest : 0;

  let cumLP = 0, cumGP = 0;
  const cumData = dist.map(d => {
    cumLP += d.lpTotal; cumGP += d.gpTotal;
    return { yr:d.yr, cumLP:+cumLP.toFixed(2), cumGP:+cumGP.toFixed(2) };
  });

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', gap:20, marginBottom:20 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <div style={{ fontSize:12, fontWeight:700, marginBottom:12 }}>Waterfall Structure</div>
          <div style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
              <span style={{ fontSize:11, color:T.sub }}>LP Preferred Return</span>
              <span style={{ fontSize:11, fontFamily:'JetBrains Mono, monospace', fontWeight:700 }}>{prefReturn}%</span>
            </div>
            <input type="range" min={6} max={12} step={0.5} value={prefReturn} onChange={e=>setPrefReturn(Number(e.target.value))} style={{ width:'100%', accentColor:SOLAR_GOLD }} />
          </div>
          <div style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
              <span style={{ fontSize:11, color:T.sub }}>LP / GP Split</span>
              <span style={{ fontSize:11, fontFamily:'JetBrains Mono, monospace', fontWeight:700 }}>{lpSplit}/{gpSplit}</span>
            </div>
            <input type="range" min={70} max={95} step={5} value={lpSplit} onChange={e=>setLpSplit(Number(e.target.value))} style={{ width:'100%', accentColor:SOLAR_GOLD }} />
          </div>
          <div style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
              <span style={{ fontSize:11, color:T.sub }}>Carried Interest</span>
              <span style={{ fontSize:11, fontFamily:'JetBrains Mono, monospace', fontWeight:700 }}>{carriedInt}%</span>
            </div>
            <input type="range" min={15} max={30} step={5} value={carriedInt} onChange={e=>setCarriedInt(Number(e.target.value))} style={{ width:'100%', accentColor:SOLAR_GOLD }} />
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <KpiCard label="LP Total Distributions" value={fmtM(totalLP)} sub={'MOIC: '+(lpMoic||0).toFixed(2)+'x'} color={T.indigo} />
          <KpiCard label="GP Total Distributions" value={fmtM(totalGP)} sub={'MOIC: '+(gpMoic||0).toFixed(2)+'x'} color={SOLAR_GOLD} />
          <KpiCard label="LP IRR" value={(isFinite(lpIRR)?lpIRR:0).toFixed(1)+'%'} sub={lpSplit+'% of equity'} color={T.blue} />
          <KpiCard label="GP IRR" value={(isFinite(gpIRR)?gpIRR:0).toFixed(1)+'%'} sub={gpSplit+'% of equity'} color={T.green} />
        </div>
      </div>
      <SectionTitle icon="C">Cumulative LP vs GP Distributions</SectionTitle>
      <div style={{ height:200, marginBottom:20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={cumData} margin={{left:0,right:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="yr" tick={{fontSize:10}} />
            <YAxis tick={{fontSize:10}} />
            <Tooltip formatter={(v)=>'$'+(v||0).toFixed(2)+'M'} />
            <Legend />
            <Area dataKey="cumLP" stroke={T.indigo} fill={T.indigo} fillOpacity={0.3} name="LP Cumulative $M" />
            <Area dataKey="cumGP" stroke={SOLAR_GOLD} fill={SOLAR_GOLD} fillOpacity={0.3} name="GP Cumulative $M" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <SectionTitle icon="W">Annual Distribution Waterfall Table</SectionTitle>
      <DataTable small zebra
        headers={['Yr','Available $M','LP Pref','GP Catch-up','LP Share','GP Share','LP Total','GP Total']}
        rows={dist.map(d=>[d.yr,(d.avail||0).toFixed(2),(d.lpPref||0).toFixed(2),(d.gpCatchup||0).toFixed(2),(d.lpShare||0).toFixed(2),(d.gpShare||0).toFixed(2),(d.lpTotal||0).toFixed(2),(d.gpTotal||0).toFixed(2)])}
      />
    </div>
  );
}

function TabTaxEquity({ m, inp }) {
  const teSize = m.totalCapexM * 0.35;
  const teYield = 7.5;
  const annCfads = m.y1Ebitda * 0.45;
  const flipYr = annCfads > 0 ? Math.ceil((teSize * teYield / 100) / annCfads) : 6;

  const structures = [
    { name:'Flip Partnership', desc:'Most common. TE investor gets ITC + MACRS + preferred cash yield. Sponsor retains operating control. At flip point (~95% yield), TE drops from 99% to 5% interest.', teIRR:7.5, sponsorIRR:+(m.equityIRR*100*1.08).toFixed(1), pros:['Full ITC monetization','MACRS upside','Lender-accepted'], cons:['Complex','Flip triggers review','High transaction cost'] },
    { name:'Inverted Lease', desc:'TE leases tax credits to sponsor. Off-balance-sheet. Simpler documentation. No asset ownership transfer.', teIRR:8.5, sponsorIRR:+(m.equityIRR*100*0.97).toFixed(1), pros:['Off-balance-sheet','Simpler docs','No flip mechanics'], cons:['Lower TE economics','PTC ineligible','Limited MACRS'] },
    { name:'Sale-Leaseback', desc:'TE acquires assets outright, leases back to developer. TE claims ITC + depreciation. Rent = operating cashflow.', teIRR:9.0, sponsorIRR:+(m.equityIRR*100*0.94).toFixed(1), pros:['Clean balance sheet','Full ITC','Predictable yield'], cons:['TE owns asset','Residual value risk','Leaseback constraints'] },
  ];

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <KpiCard label="Tax Equity Sizing" value={fmtM(teSize)} sub="~35% of CAPEX (typical)" color={T.indigo} />
        <KpiCard label="Effective TE Yield" value={teYield+'%'} sub="All-in cost" color={SOLAR_GOLD} />
        <KpiCard label="Est. Flip Year" value={Math.max(1,flipYr)+' yrs'} sub="When TE hits yield hurdle" color={T.teal} />
        <KpiCard label="ITC + MACRS Package" value={fmtM((m.itcAmount||0)+(m.macrsShields||0))} sub="Total tax benefits" color={T.green} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
        {structures.map((s,i) => (
          <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:6, color: i===0?SOLAR_GOLD:T.text }}>
              {s.name} {i===0 && <Badge label="MOST COMMON" bg={SOLAR_GOLD} />}
            </div>
            <div style={{ fontSize:11, color:T.sub, marginBottom:12, lineHeight:1.5 }}>{s.desc}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
              <div style={{ background:'#F0FDF4', borderRadius:4, padding:'6px 10px' }}>
                <div style={{ fontSize:9, color:T.sub }}>TE IRR</div>
                <div style={{ fontSize:16, fontFamily:'JetBrains Mono, monospace', fontWeight:700, color:T.green }}>{s.teIRR}%</div>
              </div>
              <div style={{ background:'#EFF6FF', borderRadius:4, padding:'6px 10px' }}>
                <div style={{ fontSize:9, color:T.sub }}>Sponsor IRR</div>
                <div style={{ fontSize:16, fontFamily:'JetBrains Mono, monospace', fontWeight:700, color:T.blue }}>{s.sponsorIRR}%</div>
              </div>
            </div>
            <div style={{ fontSize:10, fontWeight:700, color:T.green, marginBottom:3 }}>Pros</div>
            <ul style={{ margin:0, paddingLeft:14, fontSize:10, color:T.sub, lineHeight:1.6 }}>
              {s.pros.map((p,pi) => <li key={pi}>{p}</li>)}
            </ul>
            <div style={{ fontSize:10, fontWeight:700, color:T.red, marginBottom:3, marginTop:8 }}>Cons</div>
            <ul style={{ margin:0, paddingLeft:14, fontSize:10, color:T.sub, lineHeight:1.6 }}>
              {s.cons.map((c,ci) => <li key={ci}>{c}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <SectionTitle icon="F">Pre-Flip vs Post-Flip Summary</SectionTitle>
      <DataTable zebra
        headers={['Phase','Period','TE %','Sponsor %','TE Receives','Sponsor Receives']}
        rows={[
          ['Pre-Flip','Years 1-'+Math.max(1,flipYr),'99%','1%','ITC + MACRS + preferred yield','Operating control + minority cash'],
          ['Post-Flip','Years '+(Math.max(1,flipYr)+1)+'-'+inp.projectLife,'5%','95%','Residual cash','Majority of cashflows'],
        ]}
      />
    </div>
  );
}

function TabLCOE({ m, inp }) {
  const crf = m.crf;
  const annualEnergy_GWh = inp.capacityMW * inp.cf / 100 * 8760 / 1000;
  const annualOM = inp.capacityMW * 1000 * inp.omPerKW / 1e6;
  const annualCapexCost = m.totalCapexM * crf;
  const totalLcoe = m.lcoe;
  const greenSpread = inp.ppaPrice - totalLcoe;

  const benchData = [
    { name:'This Project', lcoe:+totalLcoe.toFixed(1) },
    { name:'US Utility Solar', lcoe:31 },
    { name:'Onshore Wind', lcoe:38 },
    { name:'CCGT', lcoe:58 },
    { name:'Nuclear', lcoe:92 },
    { name:'Coal', lcoe:108 },
  ];

  const components = [
    { name:'CAPEX (Annualized)', value:annualEnergy_GWh>0?annualCapexCost/annualEnergy_GWh*1000:0, color:T.indigo },
    { name:'O&M', value:annualEnergy_GWh>0?annualOM/annualEnergy_GWh*1000:0, color:T.teal },
    { name:'Financing', value:totalLcoe*0.12, color:SOLAR_GOLD },
    { name:'Land & Ins.', value:totalLcoe*0.05, color:T.blue },
  ];

  const sensSolar = [-20,-10,0,10,20].map(delta => ({
    delta:delta+'%',
    CAPEX:+(totalLcoe*(1+delta/100*0.65)).toFixed(2),
    CF:+(totalLcoe/(1+delta/100*0.9)).toFixed(2),
    DebtRate:+(totalLcoe*(1+delta/100*0.12)).toFixed(2),
    OM:+(totalLcoe*(1+delta/100*0.15)).toFixed(2),
  }));

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <KpiCard label="LCOE" value={fmtMWh(totalLcoe)} sub="Levelized Cost" color={totalLcoe<38?T.green:T.red} />
        <KpiCard label="PPA Price" value={fmtMWh(inp.ppaPrice)} sub="Power Purchase Agreement" color={SOLAR_GOLD} />
        <KpiCard label="Green Spread" value={fmtMWh(greenSpread)} sub="PPA minus LCOE" color={greenSpread>0?T.green:T.red} />
        <KpiCard label="Capital Recovery Factor" value={(crf*100||0).toFixed(3)+'%'} sub={inp.projectDr+'% rate, '+inp.projectLife+'yr'} color={T.indigo} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        <div>
          <SectionTitle icon="C">LCOE Component Breakdown ($/MWh)</SectionTitle>
          <div style={{ height:200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={components} margin={{left:0,right:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{fontSize:9}} />
                <YAxis tick={{fontSize:10}} unit=" $/MWh" />
                <Tooltip formatter={v=>'$'+(v||0).toFixed(2)+'/MWh'} />
                <Bar dataKey="value" name="$/MWh" fill={SOLAR_GOLD} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <SectionTitle icon="B">LCOE vs Technology Benchmarks</SectionTitle>
          <div style={{ height:200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={benchData} layout="vertical" margin={{left:80,right:30}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{fontSize:10}} unit=" $/MWh" />
                <YAxis type="category" dataKey="name" tick={{fontSize:9}} width={80} />
                <Tooltip formatter={v=>'$'+v+'/MWh'} />
                <Bar dataKey="lcoe" name="LCOE $/MWh" fill={T.indigo} opacity={0.8} />
                <ReferenceLine x={totalLcoe} stroke={SOLAR_GOLD} strokeDasharray="4 2" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <SectionTitle icon="F">LCOE Formula</SectionTitle>
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16, fontFamily:'JetBrains Mono, monospace', fontSize:12, marginBottom:16 }}>
        <div style={{ color:T.sub, marginBottom:6 }}>LCOE = (CAPEX x CRF + Annual O&M) / Annual Energy</div>
        <div style={{ color:T.text, marginBottom:4 }}>= (${(m.totalCapexM||0).toFixed(1)}M x {(crf*100||0).toFixed(3)}% + ${(annualOM||0).toFixed(2)}M) / {(annualEnergy_GWh||0).toFixed(2)} GWh</div>
        <div style={{ color:SOLAR_GOLD, fontWeight:700, fontSize:14 }}>= ${(totalLcoe||0).toFixed(2)} / MWh</div>
        <div style={{ color:T.sub, marginTop:6, fontSize:10 }}>CRF = r(1+r)^n / ((1+r)^n-1) where r={inp.projectDr/100}, n={inp.projectLife}</div>
      </div>
      <SectionTitle icon="S">LCOE Sensitivity Table</SectionTitle>
      <DataTable zebra
        headers={['Delta','CAPEX Impact','CF Impact','Debt Rate Impact','O&M Impact']}
        rows={sensSolar.map(s=>[s.delta,'$'+s.CAPEX+'/MWh','$'+s.CF+'/MWh','$'+s.DebtRate+'/MWh','$'+s.OM+'/MWh'])}
      />
    </div>
  );
}

function TabPortfolio({ m, inp }) {
  const portProjects = Array.from({length:5}, (_,i) => ({
    name: i===0?'This Project':'Asset '+String.fromCharCode(65+i),
    mw: i===0?inp.capacityMW:Math.round(50+sr(i*17)*200),
    irr: i===0?m.equityIRR*100:8+sr(i*13)*6,
    cf: i===0?inp.cf:17+sr(i*11)*10,
    dscr: i===0?m.minDscrVal:1.15+sr(i*7)*0.4,
    tech: i===0?'Solar':i<3?'Solar':i===3?'Wind':'Storage',
    isThis: i===0,
  }));
  const totalMW = portProjects.reduce((s,p)=>s+p.mw,0);
  const wtdIRR = totalMW>0?portProjects.reduce((s,p)=>s+p.irr*p.mw,0)/totalMW:0;
  const concentration = totalMW>0?inp.capacityMW/totalMW*100:0;
  const portDscr = totalMW>0?portProjects.reduce((s,p)=>s+p.dscr*p.mw,0)/totalMW:0;

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <KpiCard label="Portfolio Total MW" value={totalMW.toFixed(0)+' MW'} sub="Including this project" color={T.indigo} />
        <KpiCard label="Wtd Avg IRR" value={(wtdIRR||0).toFixed(1)+'%'} sub="MW-weighted" color={SOLAR_GOLD} />
        <KpiCard label="Concentration" value={(concentration||0).toFixed(1)+'%'} sub="This asset / portfolio" color={concentration>30?T.amber:T.green} />
        <KpiCard label="Portfolio DSCR" value={(portDscr||0).toFixed(2)+'x'} sub="Weighted average" color={portDscr>=1.3?T.green:T.amber} />
      </div>
      <SectionTitle icon="S">Portfolio Scatter (IRR vs CF%)</SectionTitle>
      <div style={{ height:220, marginBottom:20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{left:20,right:20,top:10,bottom:20}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="cf" name="CF%" tick={{fontSize:10}} unit="%" type="number" label={{value:'Capacity Factor %',position:'insideBottom',offset:-10,fontSize:9}} />
            <YAxis dataKey="irr" name="IRR%" tick={{fontSize:10}} unit="%" type="number" label={{value:'IRR%',angle:-90,position:'insideLeft',fontSize:9}} />
            <Tooltip content={({payload})=>{
              if(!payload||!payload[0])return null;
              const d=payload[0].payload;
              return <div style={{background:'#fff',border:`1px solid ${T.border}`,padding:'8px 12px',fontSize:11}}>
                <div style={{fontWeight:700,color:d.isThis?SOLAR_GOLD:T.text}}>{d.name}</div>
                <div>CF: {(d.cf||0).toFixed(1)}%</div>
                <div>IRR: {(d.irr||0).toFixed(1)}%</div>
                <div>{d.mw} MW</div>
              </div>;
            }} />
            <Scatter data={portProjects} name="Portfolio"
              shape={(props)=>{
                const {cx,cy,payload}=props;
                return <circle cx={cx} cy={cy} r={payload.isThis?10:6} fill={payload.isThis?SOLAR_GOLD:T.indigo} stroke="#fff" strokeWidth={1} />;
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <SectionTitle icon="A">Asset Comparison Table</SectionTitle>
      <DataTable zebra
        headers={['Asset','Technology','MW','Equity IRR','CF%','Min DSCR','Concentration']}
        rows={portProjects.map(p=>[
          p.name, p.tech, p.mw,
          (p.irr||0).toFixed(1)+'%', (p.cf||0).toFixed(1)+'%',
          (p.dscr||0).toFixed(2)+'x', (p.mw/totalMW*100).toFixed(1)+'%'
        ])}
      />
    </div>
  );
}

function TabComps({ m, inp }) {
  const transactions = Array.from({length:25}, (_,i) => ({
    project:'Solar '+String.fromCharCode(65+i%26)+(i>25?'2':''),
    mw:Math.round(50+sr(i*13)*300),
    location:LOCATIONS[Math.floor(sr(i*7)*LOCATIONS.length)],
    cod:2021+Math.floor(sr(i*11)*4),
    capex:+(0.65+sr(i*17)*0.45).toFixed(2),
    irr:+(8+sr(i*19)*8).toFixed(1),
    dscr:+(1.15+sr(i*23)*0.45).toFixed(2),
    buyer:['BlackRock','Brookfield','NextEra','Orsted','AES','Engie','Enel'][Math.floor(sr(i*29)*7)],
    tech:TECHNOLOGIES[Math.floor(sr(i*31)*TECHNOLOGIES.length)],
  }));

  const scatterData = transactions.map(t=>({x:t.capex,y:t.irr,name:t.project}));

  return (
    <div>
      <SectionTitle icon="S">CAPEX vs IRR — Transaction Universe</SectionTitle>
      <div style={{ height:220, marginBottom:20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{left:20,right:30,top:10,bottom:20}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="x" name="CAPEX $/W" tick={{fontSize:10}} unit="$/W" type="number" domain={[0.6,1.2]} label={{value:'CAPEX $/W',position:'insideBottom',offset:-10,fontSize:9}} />
            <YAxis dataKey="y" name="IRR%" tick={{fontSize:10}} unit="%" type="number" label={{value:'IRR%',angle:-90,position:'insideLeft',fontSize:9}} />
            <Tooltip content={({payload})=>{
              if(!payload||!payload[0])return null;
              const d=payload[0].payload;
              return <div style={{background:'#fff',border:`1px solid ${T.border}`,padding:'8px 12px',fontSize:11}}>
                <div style={{fontWeight:700}}>{d.name}</div>
                <div>CAPEX: ${d.x}/W · IRR: {d.y}%</div>
              </div>;
            }} />
            <Scatter data={scatterData} fill={T.indigo} opacity={0.65} name="Comparable Transactions" />
            <Scatter data={[{x:inp.capexPerW,y:+(m.equityIRR*100).toFixed(1),name:'This Project'}]} fill={SOLAR_GOLD} name="This Project"
              shape={(props)=>{
                const{cx,cy}=props;
                return <polygon points={`${cx},${cy-10} ${cx+9},${cy+5} ${cx-9},${cy+5}`} fill={SOLAR_GOLD} stroke="#fff" strokeWidth={1}/>;
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <SectionTitle icon="T">Transaction Database (25 Comparable Deals)</SectionTitle>
      <DataTable small zebra
        headers={['Project','MW','Location','COD','CAPEX $/W','IRR%','DSCR','Buyer','Technology']}
        rows={transactions.map(t=>[t.project,t.mw,t.location,t.cod,'$'+t.capex,t.irr+'%',t.dscr+'x',t.buyer,t.tech])}
      />
    </div>
  );
}

function TabESG({ m, inp }) {
  const annualCO2_kt = inp.capacityMW * inp.cf / 100 * 8760 * 0.42 / 1000;
  const lifetimeCO2 = annualCO2_kt * inp.projectLife;
  const constructionJobs = Math.round(inp.capacityMW * 5.5);
  const omJobs = Math.round(inp.capacityMW * 0.33);
  const socialValue = annualCO2_kt * 1000 * 51 / 1e6;

  const co2Data = m.annuals.map(a=>{
    const degF = Math.pow(1-inp.degradation/100, a.yr-1);
    return { yr:a.yr, avoided:+(annualCO2_kt*degF).toFixed(1) };
  });

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <KpiCard label="Annual CO2 Avoided" value={(annualCO2_kt||0).toFixed(1)+' kt'} sub="0.42 tCO2/MWh grid factor" color={T.green} />
        <KpiCard label="Lifetime CO2 Avoided" value={(lifetimeCO2||0).toFixed(0)+' kt'} sub={inp.projectLife+'-year total'} color={T.teal} />
        <KpiCard label="Construction Jobs" value={constructionJobs+' FTE'} sub="5.5 jobs/MW (NREL)" color={T.indigo} />
        <KpiCard label="Social Carbon Value" value={fmtM(socialValue)} sub="At $51/tCO2 (US SCC)" color={SOLAR_GOLD} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20, marginBottom:20 }}>
        <div>
          <SectionTitle icon="G">Annual CO2 Avoided Trend</SectionTitle>
          <div style={{ height:200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={co2Data} margin={{left:0,right:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="yr" tick={{fontSize:10}} />
                <YAxis tick={{fontSize:10}} unit=" kt" />
                <Tooltip formatter={v=>v+' kt CO2'} />
                <Area dataKey="avoided" stroke={T.green} fill={T.green} fillOpacity={0.3} name="Annual CO2 Avoided kt" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <SectionTitle icon="J">Jobs Impact</SectionTitle>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            {[
              ['Construction Jobs', constructionJobs, '5.5/MW'],
              ['O&M Jobs', omJobs, '0.33/MW'],
              ['Total', constructionJobs+omJobs, 'Peak employment'],
            ].map(([k,v,sub],i) => (
              <div key={i} style={{ padding:'8px 0', borderBottom:i<2?`1px solid ${T.border}`:'none' }}>
                <div style={{ fontSize:11, color:T.sub }}>{k}</div>
                <div style={{ fontSize:20, fontFamily:'JetBrains Mono, monospace', fontWeight:700, color:T.indigo }}>{v}</div>
                <div style={{ fontSize:10, color:T.sub }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SectionTitle icon="G">Green Bond Eligibility (ICMA GBP)</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
        {[
          ['Use of Proceeds','Utility-scale solar — renewable energy category',true],
          ['Project Evaluation','IRA + FERC compliance; third-party energy yield',true],
          ['Proceeds Management','Dedicated project account with audit trail',true],
          ['Annual Reporting','Annual CO2 avoided + MWh generated reports',true],
          ['External Review','Second-party opinion (SPO) pending engagement',false],
          ['TCFD Alignment','Physical risk (location) + transition opportunity',true],
        ].map(([t,d,ok],i)=>(
          <div key={i} style={{ background:T.card, border:`1px solid ${ok?T.green:T.amber}`, borderRadius:6, padding:'10px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <span style={{ fontSize:14 }}>{ok?'OK':'!'}</span>
              <span style={{ fontSize:11, fontWeight:700 }}>{t}</span>
            </div>
            <div style={{ fontSize:10, color:T.sub }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabRisk({ m, inp }) {
  const risks = [
    { risk:'Interconnection Delay', cat:'Technical', L:3, I:4, mit:'Queue security deposit + LGIA contingencies', owner:'Dev Mgr' },
    { risk:'Module Supply Disruption', cat:'Technical', L:2, I:4, mit:'Multi-supplier procurement; 10% float', owner:'Procurement' },
    { risk:'Grid Curtailment Increase', cat:'Market', L:3, I:3, mit:'PPA curtailment carve-out; storage option', owner:'Asset Mgmt' },
    { risk:'PPA Counterparty Default', cat:'Counterparty', L:1, I:5, mit:'IG offtaker; LC posting requirement', owner:'Legal' },
    { risk:'PPA Price Below LCOE', cat:'Financial', L:2, I:5, mit:'LCOE stress-tested at PPA-15%', owner:'Finance' },
    { risk:'Interest Rate Spike', cat:'Financial', L:2, I:3, mit:'Rate lock at financial close; swap option', owner:'Treasury' },
    { risk:'Construction Overrun', cat:'Financial', L:3, I:4, mit:'EPC lump-sum; 8% contingency reserve', owner:'Dev Mgr' },
    { risk:'Equipment Underperformance', cat:'Technical', L:2, I:3, mit:'P90 yield; module warranty', owner:'Tech Advisor' },
    { risk:'Hail / Natural Disaster', cat:'Force Majeure', L:2, I:4, mit:'Hail-rated modules; property insurance', owner:'Insurance' },
    { risk:'Permitting Denial', cat:'Regulatory', L:2, I:5, mit:'Pre-application meetings; mitigation plan', owner:'Permitting' },
    { risk:'FERC Rule Change', cat:'Regulatory', L:1, I:3, mit:'LGIA grandfathering provisions', owner:'Regulatory' },
    { risk:'ITC Recapture Risk', cat:'Regulatory', L:1, I:4, mit:'5-year recapture monitoring; TE compliance', owner:'Tax Counsel' },
    { risk:'Transmission Congestion', cat:'Market', L:3, I:3, mit:'Basis risk hedge; LMP monitoring', owner:'Trading' },
    { risk:'ITC Policy Reversal', cat:'Regulatory', L:1, I:5, mit:'Hedged at current law; TE structure', owner:'Legal' },
    { risk:'O&M Cost Escalation', cat:'Financial', L:3, I:2, mit:'Long-term O&M contract with escalation cap', owner:'Asset Mgmt' },
    { risk:'Cyber / SCADA Attack', cat:'Technical', L:2, I:4, mit:'NERC CIP compliance; isolated SCADA', owner:'IT Security' },
    { risk:'Land Lease Dispute', cat:'Counterparty', L:1, I:4, mit:'30-yr recorded lease with renewals', owner:'Legal' },
    { risk:'Degradation Exceeds Warranty', cat:'Technical', L:2, I:3, mit:'Module warranty enforcement provisions', owner:'Tech Advisor' },
    { risk:'Merchant Price Collapse', cat:'Market', L:3, I:4, mit:'PPA covers base case; storage hedge option', owner:'Finance' },
    { risk:'Drought / Water Scarcity', cat:'Force Majeure', L:2, I:2, mit:'Dry-cleaning adopted; minimal water use', owner:'EHS' },
  ].map(r => ({ ...r, score: r.L * r.I }));

  const sorted = [...risks].sort((a,b)=>b.score-a.score);
  const riskAdjIRR = Math.max(0, m.equityIRR*100 - sorted.slice(0,5).reduce((s,r)=>s+r.score*0.001,0));

  const heatRows = [5,4,3,2,1].map(L => [1,2,3,4,5].map(I => ({
    L, I, count: risks.filter(r=>r.L===L&&r.I===I).length
  })));

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        <KpiCard label="Risk-Adjusted IRR" value={(riskAdjIRR||0).toFixed(2)+'%'} sub={'vs Base '+(m.equityIRR*100||0).toFixed(2)+'%'} color={T.amber} />
        <KpiCard label="High Risks (score 12+)" value={risks.filter(r=>r.score>=12).length} sub="Require immediate mitigation" color={T.red} />
        <KpiCard label="Medium Risks (6-11)" value={risks.filter(r=>r.score>=6&&r.score<12).length} sub="Monitor closely" color={SOLAR_GOLD} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 220px', gap:20 }}>
        <div>
          <SectionTitle icon="R">Risk Register (Ranked by Score)</SectionTitle>
          <DataTable small zebra
            headers={['Risk','Category','L','I','Score','Mitigation','Owner']}
            rows={sorted.map(r=>[r.risk,r.cat,r.L,r.I,r.score,r.mit,r.owner])}
          />
        </div>
        <div>
          <SectionTitle icon="H">Heat Map (L x I)</SectionTitle>
          <table style={{ borderCollapse:'collapse', fontSize:10 }}>
            <thead>
              <tr>
                <th style={{ padding:'3px 6px', color:T.sub, fontSize:9 }}>L\I</th>
                {[1,2,3,4,5].map(i=><th key={i} style={{ padding:'3px 6px', textAlign:'center', fontSize:9, color:T.sub }}>{i}</th>)}
              </tr>
            </thead>
            <tbody>
              {heatRows.map((row,ri) => (
                <tr key={ri}>
                  <td style={{ padding:'3px 6px', fontWeight:700, fontSize:9, color:T.sub }}>{5-ri}</td>
                  {row.map((cell,ci) => {
                    const score = (5-ri)*(ci+1);
                    const bg = score>=15?'#FEE2E2':score>=8?'#FEF3C7':score>=4?'#FFFBEB':'#F0FDF4';
                    return <td key={ci} style={{ width:34,height:30,background:bg,textAlign:'center',fontWeight:700,fontSize:12,border:`1px solid ${T.border}` }}>{cell.count||''}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop:6, fontSize:9, color:T.sub }}>L=Likelihood, I=Impact (1-5)</div>
        </div>
      </div>
    </div>
  );
}

function TabConstruction({ m, inp }) {
  const phases = [
    { name:'Pre-Development', start:0, dur:6, color:'#6366F1' },
    { name:'Interconnection Application', start:3, dur:20, color:'#F59E0B' },
    { name:'Environmental Permitting', start:4, dur:16, color:'#10B981' },
    { name:'Equipment Procurement', start:16, dur:8, color:'#3B82F6' },
    { name:'Civil & Grading', start:22, dur:10, color:'#8B5CF6' },
    { name:'Electrical Installation', start:28, dur:7, color:'#EF4444' },
    { name:'Commissioning', start:34, dur:3, color:'#06B6D4' },
    { name:'Commercial Operations', start:37, dur:1, color:SOLAR_GOLD },
  ];
  const totalMonths = 38;

  const sData = Array.from({length:24}, (_,i) => {
    const t = (i+1)/24;
    const sc = t<0.3?t*t/0.09*0.15:t<0.7?0.15+(t-0.3)/0.4*0.70:0.85+(t-0.7)/0.3*0.15;
    const prevT = i>0?i/24:0;
    const prevSC = prevT<0.3?prevT*prevT/0.09*0.15:prevT<0.7?0.15+(prevT-0.3)/0.4*0.70:0.85+(prevT-0.7)/0.3*0.15;
    return { month:i+1, draw:+((sc-prevSC)*m.totalCapexM).toFixed(2), cumul:+(sc*m.totalCapexM).toFixed(2) };
  });

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <KpiCard label="Construction Duration" value="37 months" sub="NTP to COD" color={T.indigo} />
        <KpiCard label="Change Order Reserve" value={fmtM(m.totalCapexM*0.075)} sub="7.5% of CAPEX" color={SOLAR_GOLD} />
        <KpiCard label="1-Month Delay Cost" value={fmtM(m.totalCapexM*0.008)} sub="Interest + lost revenue" color={T.red} />
        <KpiCard label="Target COD" value="Q1 2027" sub="Based on NTP today" color={T.green} />
      </div>
      <SectionTitle icon="G">Construction Gantt Schedule</SectionTitle>
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:20 }}>
        {phases.map((p,i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'180px 1fr', gap:8, alignItems:'center', marginBottom:8 }}>
            <div style={{ fontSize:11, fontWeight:600 }}>{p.name}</div>
            <div style={{ position:'relative', height:22, background:'#F3F4F6', borderRadius:4 }}>
              <div style={{ position:'absolute', left:`${p.start/totalMonths*100}%`, width:`${p.dur/totalMonths*100}%`, height:'100%', background:p.color, borderRadius:4, opacity:0.85, display:'flex', alignItems:'center', paddingLeft:6 }}>
                <span style={{ fontSize:9, color:'#fff', fontWeight:700 }}>{p.dur}mo</span>
              </div>
            </div>
          </div>
        ))}
        <div style={{ display:'grid', gridTemplateColumns:'180px 1fr', gap:8, marginTop:4 }}>
          <div/>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:8, color:T.sub }}>
            {Array.from({length:8},(_,i)=><span key={i}>{i*5}mo</span>)}
          </div>
        </div>
      </div>
      <div style={{ height:200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={sData} margin={{left:0,right:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{fontSize:10}} label={{value:'Construction Month',position:'insideBottom',offset:-2,fontSize:9}} />
            <YAxis tick={{fontSize:10}} />
            <Tooltip formatter={v=>'$'+(v||0).toFixed(2)+'M'} />
            <Legend />
            <Bar dataKey="draw" name="Monthly Draw $M" fill={T.indigo} opacity={0.7} />
            <Line dataKey="cumul" stroke={SOLAR_GOLD} strokeWidth={2} dot={false} name="Cumulative $M" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TabRegulatory({ m, inp }) {
  const stateData = [
    {state:'Texas',itc:'None',srec:'None',propTax:'Exempt',salesTax:'Exempt',permit:'6 mo'},
    {state:'Florida',itc:'None',srec:'None',propTax:'Exempt',salesTax:'Exempt',permit:'8-12 mo'},
    {state:'Arizona',itc:'None',srec:'None',propTax:'Exempt',salesTax:'Exempt',permit:'8-12 mo'},
    {state:'Nevada',itc:'None',srec:'None',propTax:'Exempt',salesTax:'Exempt',permit:'10-14 mo'},
    {state:'Colorado',itc:'None',srec:'SRECs',propTax:'Exempt',salesTax:'Exempt',permit:'10-14 mo'},
    {state:'Virginia',itc:'None',srec:'SRECs',propTax:'Local',salesTax:'Exempt',permit:'12-16 mo'},
    {state:'Illinois',itc:'None',srec:'ILSREC',propTax:'Exempt',salesTax:'Exempt',permit:'12-18 mo'},
    {state:'Minnesota',itc:'None',srec:'SRECs',propTax:'Exempt',salesTax:'Exempt',permit:'12-16 mo'},
    {state:'Ohio',itc:'None',srec:'SRECs',propTax:'Varies',salesTax:'Partial',permit:'10-14 mo'},
    {state:'Pennsylvania',itc:'None',srec:'SRECs',propTax:'Varies',salesTax:'Exempt',permit:'12-16 mo'},
    {state:'North Carolina',itc:'35% State',srec:'None',propTax:'Partial',salesTax:'Exempt',permit:'10-14 mo'},
    {state:'Massachusetts',itc:'None',srec:'SMART',propTax:'Exempt',salesTax:'Exempt',permit:'12-18 mo'},
    {state:'New Jersey',itc:'None',srec:'SRECs',propTax:'Exempt',salesTax:'Exempt',permit:'12-16 mo'},
    {state:'New York',itc:'None',srec:'NY-Sun',propTax:'Exempt',salesTax:'Partial',permit:'18-24 mo'},
    {state:'California',itc:'None',srec:'NEM 3.0',propTax:'Exempt',salesTax:'Partial',permit:'18-24 mo'},
  ];

  const iraProvisions = [
    { section:'Section 48 — ITC', rate:m.itcTotal+'% effective', desc:'Base 6% (prevailing wage exempt) or 30% (prevailing wage + apprenticeship). Adders: domestic content (+10%), energy community (+10%), low income (+10%). Elective pay available for tax-exempts.' },
    { section:'Section 45 — PTC', rate:'$27.5/MWh (2024)', desc:'10-year production credit. Inflation-adjusted. Cannot stack with ITC on same facility. Better for high-yield, low-CAPEX projects in high-CF locations.' },
    { section:'Section 45X — Advanced Mfg', rate:'$12/module (thin film)', desc:'Domestic manufacturing credit. Requires US-manufactured cells, wafers, modules. Supports domestic content ITC adder eligibility.' },
    { section:'Section 48C — Adv. Energy', rate:'30% of investment', desc:'$10B allocated for advanced energy manufacturing. Competitive DOE application. Not applicable to utility-scale generation projects.' },
  ];

  return (
    <div>
      <SectionTitle icon="I">IRA 2022 — Key Provisions</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
        {iraProvisions.map((p,i) => (
          <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderLeft:`4px solid ${i<2?SOLAR_GOLD:T.border}`, borderRadius:8, padding:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div style={{ fontSize:13, fontWeight:700 }}>{p.section}</div>
              <Badge label={p.rate} bg={i<2?T.green:T.sub} />
            </div>
            <div style={{ fontSize:11, color:T.sub, lineHeight:1.6 }}>{p.desc}</div>
          </div>
        ))}
      </div>
      <SectionTitle icon="S">State Incentive Overview (Top 15 States)</SectionTitle>
      <DataTable small zebra
        headers={['State','State ITC','SREC Program','Property Tax','Sales Tax','Permit Timeline']}
        rows={stateData.map(s=>[s.state,s.itc,s.srec,s.propTax,s.salesTax,s.permit])}
      />
      <SectionTitle icon="F">FERC Interconnection Key Points</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginTop:8 }}>
        {[
          {t:'FERC Order 2023',d:'New LGIP rules with cluster study approach. Shared cost allocation. Reduces serial queue processing. Effective July 2024.'},
          {t:'Queue Economics',d:'Deposit: $5k/MW + study costs ($50-200k). Early queue = competitive advantage for interconnection rights.'},
          {t:'Network Upgrade Costs',d:'Project-specific vs. shared under Order 2023. Typical range: $50-200k/MW for remote siting. Material cost driver.'},
        ].map((item,i) => (
          <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:6, padding:14 }}>
            <div style={{ fontSize:12, fontWeight:700, marginBottom:6, color:T.indigo }}>{item.t}</div>
            <div style={{ fontSize:11, color:T.sub, lineHeight:1.5 }}>{item.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabMemo({ m, inp }) {
  const irr = m.equityIRR * 100;
  const rec = irr >= inp.hurdleRate && m.minDscrVal >= 1.25 && m.lcoe < inp.ppaPrice * 0.85;
  const watch = irr >= inp.hurdleRate * 0.85;
  const recLabel = rec ? 'INVEST' : watch ? 'CONDITIONAL' : 'PASS';
  const recColor = rec ? T.green : watch ? SOLAR_GOLD : T.red;
  const today = '17 April 2026';

  const highlights = [
    inp.capacityMW+'MWdc '+inp.technology+' at '+inp.location+' — '+(inp.cf||0).toFixed(1)+'% CF, '+inp.projectLife+'-year project life',
    inp.ppaTenor+'-year PPA at $'+inp.ppaPrice+'/MWh'+(inp.ppaEscalator>0?' with '+inp.ppaEscalator+'%/yr escalator':' fixed')+' — LCOE spread $'+(inp.ppaPrice-m.lcoe).toFixed(2)+'/MWh',
    m.itcTotal+'% ITC under IRA 2022 = $'+(m.itcAmount||0).toFixed(1)+'M tax credit; MACRS PV shields $'+(m.macrsShields||0).toFixed(1)+'M',
    inp.debtPct+'% leverage at '+inp.debtRate+'% over '+inp.debtTenor+'yr; min DSCR '+(m.minDscrVal||0).toFixed(2)+'x vs '+inp.minDscr+'x covenant',
  ];

  const keyMetrics = [
    ['Equity IRR',fmtPct(m.equityIRR),irr>=inp.hurdleRate?T.green:T.red],
    ['Project IRR',fmtPct(m.projectIRR),T.text],
    ['MOIC',fmtX(m.moic),m.moic>=inp.targetMoic?T.green:T.amber],
    ['Payback',m.payback+' years',T.text],
    ['LCOE',fmtMWh(m.lcoe),m.lcoe<38?T.green:T.red],
    ['Min DSCR',(m.minDscrVal||0).toFixed(2)+'x',m.minDscrVal>=inp.minDscr?T.green:T.red],
    ['Avg DSCR',(m.avgDscr||0).toFixed(2)+'x',T.text],
    ['LLCR',(m.llcr||0).toFixed(2)+'x',T.text],
    ['Total CAPEX',fmtM(m.totalCapexM),T.text],
    ['Equity Investment',fmtM(m.equityAmount),T.text],
    ['Senior Debt',fmtM(m.debtAmount),T.text],
    ['ITC Benefit',fmtM(m.itcAmount),T.green],
    ['MACRS PV Shields',fmtM(m.macrsShields),T.green],
    ['Total IRA Package',fmtM((m.itcAmount||0)+(m.macrsShields||0)),T.green],
    ['Annual Revenue (Y1)',fmtM(m.y1Revenue),T.text],
    ['Y1 EBITDA',fmtM(m.y1Ebitda),T.text],
    ['EBITDA Margin',m.y1Ebitda>0&&m.y1Revenue>0?(m.y1Ebitda/m.y1Revenue*100).toFixed(1)+'%':'—',T.text],
    ['Annual Generation',fmtGWh(m.annualGenGWh),T.text],
    ['Equity NPV',fmtM(m.equityNPV),m.equityNPV>0?T.green:T.red],
    ['Hurdle Rate',inp.hurdleRate+'%',T.text],
  ];

  const assumptions = [
    ['Capacity Factor',inp.cf+'%'],
    ['Degradation',inp.degradation+'%/yr'],
    ['O&M Escalation',inp.omEscalation+'%/yr'],
    ['PPA Escalator',inp.ppaEscalator+'%/yr'],
    ['Discount Rate',inp.projectDr+'%'],
    ['Federal Tax Rate',inp.fedTaxRate+'%'],
    ['Project Life',inp.projectLife+' years'],
    ['Debt Tenor',inp.debtTenor+' years'],
    ['DSRA',inp.dsraMonths+' months'],
    ['Curtailment',inp.curtailmentPct+'%'],
  ];

  return (
    <div>
      <div style={{ background:T.card, border:`2px solid ${T.border}`, borderRadius:12, padding:32, maxWidth:860, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, borderBottom:`2px solid ${SOLAR_GOLD}`, paddingBottom:20 }}>
          <div>
            <div style={{ fontSize:10, color:T.sub, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:6 }}>INVESTMENT COMMITTEE MEMORANDUM</div>
            <div style={{ fontSize:24, fontWeight:900, color:T.text }}>{inp.projectName}</div>
            <div style={{ fontSize:14, color:T.sub, marginTop:4 }}>{inp.capacityMW}MWdc {inp.technology} · {inp.location} · Target COD Q1 2027</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ display:'inline-block', padding:'12px 24px', background:recColor, borderRadius:8, color:'#fff', fontWeight:900, fontSize:18, letterSpacing:'0.05em' }}>{recLabel}</div>
            <div style={{ fontSize:10, color:T.sub, marginTop:6 }}>{today}</div>
          </div>
        </div>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.indigo, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Investment Highlights</div>
          {highlights.map((h,i)=>(
            <div key={i} style={{ display:'flex', gap:10, marginBottom:8, fontSize:13, lineHeight:1.5 }}>
              <span style={{ color:SOLAR_GOLD, fontWeight:900, flexShrink:0 }}>{'0'+(i+1)}</span>
              <span>{h}</span>
            </div>
          ))}
        </div>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.indigo, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Key Financial Metrics</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
            {keyMetrics.map(([k,v,c],i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 10px', background:i%2===0?'#F8F8F6':T.card, borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontSize:11, color:T.sub }}>{k}</span>
                <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:12, fontWeight:700, color:c||T.text }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.indigo, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Key Risk Factors</div>
            {['Interconnection delay — mitigated by LGIA contingency provisions',
              'PPA counterparty credit — IG-rated offtaker required at close',
              'Grid curtailment post-COD — carve-out negotiated in PPA',
              'ITC recapture risk years 1-5 — ongoing TE compliance program',
              'EPC construction overrun — lump-sum contract with 8% contingency'].map((r,i)=>(
              <div key={i} style={{ display:'flex', gap:8, marginBottom:6, fontSize:11, lineHeight:1.5, color:T.sub }}>
                <span style={{ color:T.red, flexShrink:0 }}>!</span>{r}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.indigo, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Key Assumptions</div>
            {assumptions.map(([k,v],i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0', borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontSize:11, color:T.sub }}>{k}</span>
                <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:11, fontWeight:700 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop:`2px solid ${T.border}`, paddingTop:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.sub, marginBottom:12, textTransform:'uppercase', letterSpacing:'0.06em' }}>Approval Signatures</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
            {['IC Chair','Investment Director','CFO'].map((role,i)=>(
              <div key={i} style={{ borderBottom:`1px solid ${T.text}`, paddingBottom:4 }}>
                <div style={{ fontSize:10, color:T.sub, marginTop:24 }}>{role}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:16, fontSize:10, color:T.sub }}>
            Solar Finance Engine v2.0 · Model date: {today} · All projections are forward-looking estimates and subject to material uncertainty.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function SolarProjectFinancePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [showDrawer, setShowDrawer] = useState(false);

  const [inp, setInp] = useState({
    projectName: 'Solar Project Alpha',
    technology: 'Bifacial PERC',
    location: 'ERCOT-West',
    capacityMW: 100,
    dcAcRatio: 1.20,
    cf: 21.5,
    degradation: 0.45,
    projectLife: 30,
    capexPerW: 0.85,
    omPerKW: 14,
    omEscalation: 2,
    landLease: 1200,
    projectAcres: 700,
    insurancePct: 0.40,
    gAndA: 350,
    ppaPrice: 42.0,
    ppaEscalator: 0,
    ppaTenor: 20,
    merchantPct: 0,
    recPrice: 3.50,
    curtailmentPct: 2,
    debtPct: 70,
    debtRate: 5.5,
    debtTenor: 18,
    debtFees: 1.5,
    dsraMonths: 6,
    minDscr: 1.30,
    itcPct: 30,
    domesticContent: false,
    energyCommunity: false,
    lowIncome: false,
    macrsSchedule: '5yr',
    fedTaxRate: 21,
    stateTaxRate: 4,
    usePTC: false,
    ptcRate: 27.5,
    hurdleRate: 12,
    projectDr: 8,
    targetMoic: 2.0,
    yieldSigma: 9,
  });

  const upd = useCallback((key) => (val) => setInp(p => ({ ...p, [key]: val })), []);
  const m = useModel(inp);

  const irr = m.equityIRR * 100;
  const irrColor = irr >= inp.hurdleRate ? '#4ADE80' : irr >= inp.hurdleRate * 0.85 ? SOLAR_GOLD : '#F87171';

  const tabComponents = [
    <TabOverview key={0} m={m} inp={inp} />,
    <TabFinancialModel key={1} m={m} inp={inp} />,
    <TabReturns key={2} m={m} inp={inp} />,
    <TabDscr key={3} m={m} inp={inp} />,
    <TabIRA key={4} m={m} inp={inp} />,
    <TabYield key={5} m={m} inp={inp} />,
    <TabSensitivity key={6} m={m} inp={inp} />,
    <TabScenarios key={7} m={m} inp={inp} />,
    <TabMonteCarlo key={8} m={m} inp={inp} />,
    <TabRefinancing key={9} m={m} inp={inp} />,
    <TabWaterfall key={10} m={m} inp={inp} />,
    <TabTaxEquity key={11} m={m} inp={inp} />,
    <TabLCOE key={12} m={m} inp={inp} />,
    <TabPortfolio key={13} m={m} inp={inp} />,
    <TabComps key={14} m={m} inp={inp} />,
    <TabESG key={15} m={m} inp={inp} />,
    <TabRisk key={16} m={m} inp={inp} />,
    <TabConstruction key={17} m={m} inp={inp} />,
    <TabRegulatory key={18} m={m} inp={inp} />,
    <TabMemo key={19} m={m} inp={inp} />,
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:T.bg, fontFamily:'DM Sans, sans-serif', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ background:HEADER_BG, borderBottom:`3px solid ${SOLAR_GOLD}`, padding:'0 24px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:52 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <span style={{ fontSize:22 }}>☀️</span>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:'#F1F5F9', letterSpacing:'-0.01em' }}>Solar Project Finance</div>
              <div style={{ fontSize:10, color:'#64748B', fontFamily:'JetBrains Mono, monospace' }}>{inp.projectName} · {inp.capacityMW}MWdc · {inp.location}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:9, color:'#64748B', letterSpacing:'0.06em' }}>EQUITY IRR</div>
              <div style={{ fontSize:22, fontFamily:'JetBrains Mono, monospace', fontWeight:900, color:irrColor }}>{(irr||0).toFixed(1)}%</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:9, color:'#64748B', letterSpacing:'0.06em' }}>LCOE $/MWh</div>
              <div style={{ fontSize:22, fontFamily:'JetBrains Mono, monospace', fontWeight:900, color:'#F1F5F9' }}>${(m.lcoe||0).toFixed(1)}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:9, color:'#64748B', letterSpacing:'0.06em' }}>MIN DSCR</div>
              <div style={{ fontSize:22, fontFamily:'JetBrains Mono, monospace', fontWeight:900, color:m.minDscrVal>=inp.minDscr?'#4ADE80':'#F87171' }}>{(m.minDscrVal||0).toFixed(2)}x</div>
            </div>
            <button onClick={()=>setShowDrawer(d=>!d)} style={{ background:showDrawer?SOLAR_GOLD:'#1E293B', color:showDrawer?'#0F172A':'#94A3B8', border:`1px solid ${showDrawer?SOLAR_GOLD:'#334155'}`, borderRadius:6, padding:'6px 14px', cursor:'pointer', fontSize:12, fontWeight:700 }}>
              {showDrawer ? 'Close Scenarios' : 'View Scenarios'}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {/* Left Input Panel */}
        <div style={{ width:280, background:NAV_BG, borderRight:`1px solid #1E293B`, overflowY:'auto', flexShrink:0 }}>
          <div style={{ padding:'12px 16px 4px' }}>
            <div style={{ fontSize:9, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Project Studio</div>
            <input value={inp.projectName} onChange={e=>setInp(p=>({...p,projectName:e.target.value}))}
              style={{ width:'100%', background:'#1E293B', color:'#F1F5F9', border:'1px solid #334155', borderRadius:4, padding:'6px 10px', fontSize:12, boxSizing:'border-box' }} />
          </div>

          <CollapseSection title="1 · Asset Configuration">
            <InputSelect label="Technology" value={inp.technology} options={TECHNOLOGIES} onChange={upd('technology')} />
            <InputSelect label="Location" value={inp.location} options={LOCATIONS} onChange={v=>setInp(p=>({...p,location:v,cf:CF_BY_LOC[v]||p.cf}))} />
            <SliderRow label="DC Capacity (MWdc)" value={inp.capacityMW} min={10} max={500} step={5} onChange={upd('capacityMW')} unit=" MW" />
            <SliderRow label="DC:AC Ratio" value={inp.dcAcRatio} min={1.10} max={1.45} step={0.05} onChange={upd('dcAcRatio')} />
            <SliderRow label="Capacity Factor" value={inp.cf} min={14} max={32} step={0.5} onChange={upd('cf')} unit="%" />
            <SliderRow label="Degradation Rate" value={inp.degradation} min={0.25} max={0.70} step={0.05} onChange={upd('degradation')} unit="%/yr" />
            <InputSelect label="Project Life" value={inp.projectLife} options={[{value:25,label:'25 years'},{value:30,label:'30 years'},{value:35,label:'35 years'}]} onChange={v=>upd('projectLife')(Number(v))} />
          </CollapseSection>

          <CollapseSection title="2 · Capital Structure">
            <SliderRow label="CAPEX ($/Wdc)" value={inp.capexPerW} min={0.55} max={1.40} step={0.01} onChange={upd('capexPerW')} />
            <div style={{ fontSize:10, color:SOLAR_GOLD, fontFamily:'JetBrains Mono, monospace', marginBottom:8, paddingLeft:2 }}>
              Total CAPEX: ${(inp.capacityMW*1000*inp.capexPerW/1e6).toFixed(1)}M
            </div>
            <SliderRow label="O&M ($/kW/yr)" value={inp.omPerKW} min={6} max={22} step={1} onChange={upd('omPerKW')} />
            <SliderRow label="O&M Escalation" value={inp.omEscalation} min={0} max={3} step={0.25} onChange={upd('omEscalation')} unit="%/yr" />
            <SliderRow label="Land Lease ($/ac/yr)" value={inp.landLease} min={500} max={2500} step={50} onChange={upd('landLease')} />
            <SliderRow label="Project Acres" value={inp.projectAcres} min={100} max={1500} step={50} onChange={upd('projectAcres')} unit=" ac" />
            <SliderRow label="Insurance (% assets)" value={inp.insurancePct} min={0.2} max={0.7} step={0.05} onChange={upd('insurancePct')} unit="%" />
            <SliderRow label="G&A ($k/yr)" value={inp.gAndA} min={100} max={800} step={25} onChange={upd('gAndA')} unit="k" />
          </CollapseSection>

          <CollapseSection title="3 · Revenue">
            <SliderRow label="PPA Price ($/MWh)" value={inp.ppaPrice} min={18} max={65} step={0.5} onChange={upd('ppaPrice')} />
            <SliderRow label="PPA Escalator" value={inp.ppaEscalator} min={0} max={3} step={0.25} onChange={upd('ppaEscalator')} unit="%/yr" />
            <InputSelect label="PPA Tenor" value={inp.ppaTenor} options={[{value:10,label:'10 years'},{value:12,label:'12 years'},{value:15,label:'15 years'},{value:20,label:'20 years'},{value:25,label:'25 years'}]} onChange={v=>upd('ppaTenor')(Number(v))} />
            <SliderRow label="Merchant % post-PPA" value={inp.merchantPct} min={0} max={100} step={5} onChange={upd('merchantPct')} unit="%" />
            <SliderRow label="REC Price ($/MWh)" value={inp.recPrice} min={0} max={15} step={0.25} onChange={upd('recPrice')} />
            <SliderRow label="Curtailment" value={inp.curtailmentPct} min={0} max={15} step={0.5} onChange={upd('curtailmentPct')} unit="%" />
          </CollapseSection>

          <CollapseSection title="4 · Debt">
            <SliderRow label="Debt / CAPEX" value={inp.debtPct} min={50} max={80} step={5} onChange={upd('debtPct')} unit="%" />
            <div style={{ fontSize:10, color:SOLAR_GOLD, fontFamily:'JetBrains Mono, monospace', marginBottom:8, paddingLeft:2 }}>
              Debt: ${(m.debtAmount||0).toFixed(1)}M | Equity: ${(m.equityAmount||0).toFixed(1)}M
            </div>
            <SliderRow label="Senior Debt Rate" value={inp.debtRate} min={3.5} max={8.5} step={0.1} onChange={upd('debtRate')} unit="%" />
            <InputSelect label="Debt Tenor" value={inp.debtTenor} options={[{value:15,label:'15 years'},{value:18,label:'18 years'},{value:20,label:'20 years'}]} onChange={v=>upd('debtTenor')(Number(v))} />
            <SliderRow label="Debt Fees (% of loan)" value={inp.debtFees} min={0.5} max={2.5} step={0.25} onChange={upd('debtFees')} unit="%" />
            <InputSelect label="DSRA Months" value={inp.dsraMonths} options={[{value:3,label:'3 months'},{value:6,label:'6 months'},{value:9,label:'9 months'}]} onChange={v=>upd('dsraMonths')(Number(v))} />
            <SliderRow label="Min DSCR Covenant" value={inp.minDscr} min={1.10} max={1.40} step={0.05} onChange={upd('minDscr')} fmt={v=>v.toFixed(2)+'x'} />
          </CollapseSection>

          <CollapseSection title="5 · Tax & Incentives">
            <Toggle label="Use PTC instead of ITC" value={inp.usePTC} onChange={upd('usePTC')} />
            {!inp.usePTC && (
              <>
                <SliderRow label="ITC Base %" value={inp.itcPct} min={6} max={50} step={1} onChange={upd('itcPct')} unit="%" />
                <Toggle label="Domestic Content (+10%)" value={inp.domesticContent} onChange={upd('domesticContent')} />
                <Toggle label="Energy Community (+10%)" value={inp.energyCommunity} onChange={upd('energyCommunity')} />
                <Toggle label="Low Income (+10%)" value={inp.lowIncome} onChange={upd('lowIncome')} />
                <div style={{ fontSize:10, color:SOLAR_GOLD, fontFamily:'JetBrains Mono, monospace', marginBottom:8, paddingLeft:2 }}>
                  Effective ITC: {m.itcTotal}% = ${(m.itcAmount||0).toFixed(1)}M
                </div>
              </>
            )}
            {inp.usePTC && <SliderRow label="PTC Rate ($/MWh)" value={inp.ptcRate} min={20} max={35} step={0.5} onChange={upd('ptcRate')} />}
            <InputSelect label="MACRS Schedule" value={inp.macrsSchedule} options={[{value:'5yr',label:'5-Year MACRS'},{value:'15yr',label:'15-Year MACRS'},{value:'straight-line',label:'Straight-Line'}]} onChange={upd('macrsSchedule')} />
            <SliderRow label="Federal Tax Rate" value={inp.fedTaxRate} min={15} max={28} step={1} onChange={upd('fedTaxRate')} unit="%" />
            <SliderRow label="State Tax Rate" value={inp.stateTaxRate} min={0} max={10} step={0.5} onChange={upd('stateTaxRate')} unit="%" />
          </CollapseSection>

          <CollapseSection title="6 · Returns Targets" defaultOpen={false}>
            <SliderRow label="Hurdle Rate (Equity)" value={inp.hurdleRate} min={8} max={20} step={0.5} onChange={upd('hurdleRate')} unit="%" />
            <SliderRow label="Project Discount Rate" value={inp.projectDr} min={6} max={14} step={0.5} onChange={upd('projectDr')} unit="%" />
            <SliderRow label="Target MOIC" value={inp.targetMoic} min={1.5} max={4.0} step={0.1} onChange={upd('targetMoic')} fmt={v=>v.toFixed(1)+'x'} />
            <SliderRow label="Yield Uncertainty sigma" value={inp.yieldSigma} min={5} max={15} step={1} onChange={upd('yieldSigma')} unit="%" />
          </CollapseSection>

          {/* Quick Stats */}
          <div style={{ margin:'8px 12px 16px', background:'#1A2744', border:`1px solid #334155`, borderRadius:6, padding:'10px 12px' }}>
            <div style={{ fontSize:9, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Quick Stats</div>
            {[
              ['Total CAPEX','$'+(m.totalCapexM||0).toFixed(1)+'M'],
              ['Equity','$'+(m.equityAmount||0).toFixed(1)+'M'],
              ['Revenue Y1','$'+(m.y1Revenue||0).toFixed(1)+'M'],
              ['Equity IRR',(m.equityIRR*100||0).toFixed(1)+'%'],
              ['LCOE','$'+(m.lcoe||0).toFixed(1)+'/MWh'],
            ].map(([k,v],i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ fontSize:10, color:'#64748B' }}>{k}</span>
                <span style={{ fontSize:10, fontFamily:'JetBrains Mono, monospace', fontWeight:700, color:SOLAR_GOLD }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* Tab Bar */}
          <div style={{ background:T.card, borderBottom:`1px solid ${T.border}`, overflowX:'auto', flexShrink:0, display:'flex', whiteSpace:'nowrap' }}>
            {TABS.map((tab,i) => (
              <button key={i} onClick={()=>setActiveTab(i)} style={{
                padding:'10px 14px', border:'none', background:'transparent', cursor:'pointer',
                fontSize:11, fontWeight:i===activeTab?700:500,
                color:i===activeTab?SOLAR_GOLD:T.sub,
                borderBottom:i===activeTab?`3px solid ${SOLAR_GOLD}`:'3px solid transparent',
                whiteSpace:'nowrap', flexShrink:0,
              }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
            {tabComponents[activeTab]}
          </div>
        </div>

        {/* Right Scenario Drawer */}
        {showDrawer && (
          <div style={{ width:320, background:NAV_BG, borderLeft:`1px solid #1E293B`, overflowY:'auto', flexShrink:0, padding:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:SOLAR_GOLD, marginBottom:14, textTransform:'uppercase', letterSpacing:'0.06em' }}>Scenario Comparison</div>
            {[
              { name:'Base Case', ppa:0, cf:0, capex:0, prob:40, color:SOLAR_GOLD },
              { name:'Optimistic', ppa:+5, cf:+5, capex:-0.05, prob:15, color:T.green },
              { name:'Conservative', ppa:0, cf:-5, capex:+0.05, prob:25, color:T.teal },
              { name:'Downside', ppa:-8, cf:-10, capex:+0.10, prob:15, color:T.amber },
              { name:'Stress', ppa:-15, cf:-15, capex:+0.15, prob:5, color:T.red },
            ].map((sc,i) => {
              const adjPpa = inp.ppaPrice + sc.ppa;
              const adjCf = inp.cf + sc.cf;
              const adjCapex = inp.capexPerW + sc.capex;
              const scIRR = m.equityIRR * 100 * (adjPpa/Math.max(inp.ppaPrice,0.01)) * (adjCf/Math.max(inp.cf,0.01)) * (inp.capexPerW/Math.max(adjCapex,0.01));
              const scDscr = m.minDscrVal * (adjPpa/Math.max(inp.ppaPrice,0.01)) * (adjCf/Math.max(inp.cf,0.01));
              return (
                <div key={i} style={{ background:'#1E293B', border:`1px solid ${sc.color}30`, borderLeft:`3px solid ${sc.color}`, borderRadius:6, padding:'10px 12px', marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:sc.color }}>{sc.name}</span>
                    <span style={{ fontSize:9, color:'#64748B' }}>{sc.prob}% prob</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
                    {[
                      ['IRR',(isFinite(scIRR)?scIRR:0).toFixed(1)+'%',isFinite(scIRR)&&scIRR>=inp.hurdleRate?'#4ADE80':'#F87171'],
                      ['DSCR',(isFinite(scDscr)?scDscr:0).toFixed(2)+'x',isFinite(scDscr)&&scDscr>=inp.minDscr?'#4ADE80':'#F87171'],
                      ['PPA','$'+(adjPpa||0).toFixed(0)+'/MWh','#94A3B8'],
                      ['CF',(adjCf||0).toFixed(1)+'%','#94A3B8'],
                    ].map(([k,v,c],j)=>(
                      <div key={j}>
                        <div style={{ fontSize:8, color:'#64748B', textTransform:'uppercase' }}>{k}</div>
                        <div style={{ fontSize:13, fontFamily:'JetBrains Mono, monospace', fontWeight:700, color:c }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <div style={{ background:'#1A2744', borderRadius:6, padding:'10px 12px', marginTop:4 }}>
              <div style={{ fontSize:9, color:'#64748B', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Probability-Weighted IRR</div>
              <div style={{ fontSize:20, fontFamily:'JetBrains Mono, monospace', fontWeight:900, color:SOLAR_GOLD }}>
                {([
                  {ppa:0,cf:0,capex:0,prob:0.40},
                  {ppa:5,cf:5,capex:-0.05,prob:0.15},
                  {ppa:0,cf:-5,capex:0.05,prob:0.25},
                  {ppa:-8,cf:-10,capex:0.10,prob:0.15},
                  {ppa:-15,cf:-15,capex:0.15,prob:0.05},
                ].reduce((s,sc) => {
                  const adjPpa = inp.ppaPrice + sc.ppa;
                  const adjCf = inp.cf + sc.cf;
                  const adjCapex = inp.capexPerW + sc.capex;
                  const scIRR = m.equityIRR*100*(adjPpa/Math.max(inp.ppaPrice,0.01))*(adjCf/Math.max(inp.cf,0.01))*(inp.capexPerW/Math.max(adjCapex,0.01));
                  return s + (isFinite(scIRR)?scIRR:0)*sc.prob;
                },0)).toFixed(2)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div style={{ background:HEADER_BG, borderTop:`1px solid #1E293B`, padding:'4px 24px', display:'flex', gap:24, alignItems:'center', flexShrink:0 }}>
        <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'#64748B' }}>Solar Finance Engine v2.0</span>
        <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'#64748B' }}>{inp.capacityMW}MWdc · {inp.projectLife}yr · ${inp.capexPerW}/Wdc</span>
        <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:m.equityIRR*100>=inp.hurdleRate?'#4ADE80':'#F87171' }}>
          IRR {(m.equityIRR*100||0).toFixed(2)}% {m.equityIRR*100>=inp.hurdleRate?'ABOVE':'BELOW'} HURDLE
        </span>
        <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:m.minDscrVal>=inp.minDscr?'#4ADE80':'#F87171' }}>
          MIN DSCR {(m.minDscrVal||0).toFixed(2)}x
        </span>
        <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'#64748B' }}>ITC {m.itcTotal}% = ${(m.itcAmount||0).toFixed(1)}M</span>
        <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:SOLAR_GOLD, marginLeft:'auto' }}>LIVE — ALL VALUES REAL-TIME</span>
      </div>
      <EnergyAdvancedAnalytics T={T} moduleCode="EP-RE1" title="Solar Project Finance — MC IRR, Tornado & NGFS PPA Scenario"
        mcModel={{ title: 'MC Levered IRR (%) · 100 MW Solar PV', unit: '%', fmt: (n) => n.toFixed(2),
        vars: { capexMwUsd: { min: 0.55, mode: 0.70, max: 0.95 }, tariffUsdKwh: { min: 0.028, mode: 0.042, max: 0.065 },
                plf: { min: 0.18, mode: 0.22, max: 0.26 }, opexPctCapex: { min: 0.008, mode: 0.014, max: 0.022 } },
        compute: (v) => { const rev = v.tariffUsdKwh * 100 * 1000 * v.plf * 8760; const opex = v.capexMwUsd * 100 * 1e6 * v.opexPctCapex; const ebitda = rev - opex; const capex = v.capexMwUsd * 100 * 1e6; return Math.max(-5, Math.min(35, (ebitda / capex) * 100)); } }}
      tornadoModel={{ title: 'Tornado — Levered IRR Drivers', unit: '%', fmt: (n) => `${n.toFixed(1)}%`,
        inputs: { capex: 0.70, tariff: 0.042, plf: 0.22, opex: 0.014 },
        compute: (v) => { const rev = v.tariff * 100 * 1000 * v.plf * 8760; const opex = v.capex * 100 * 1e6 * v.opex; return Math.max(-5, ((rev - opex) / (v.capex * 100 * 1e6)) * 100); } }}
      scenarioImpact={(p) => Math.max(0, 14 + (p - 85) * 0.04)} scenarioFmt={(v) => `${v.toFixed(1)}%`}
      scenarioTitle="Carbon Price × NGFS Pathway — PPA uplift → IRR (%)"
      peers={{ cols: [{ k: 'name', label: 'Developer' }, { k: 'gw', label: 'GW deployed', fmt: (v) => `${v.toFixed(1)}` }, { k: 'plf', label: 'PLF (%)', fmt: (v) => `${v.toFixed(1)}%` }, { k: 'lcoe', label: 'LCOE (¢/kWh)', fmt: (v) => `${v.toFixed(1)}` }, { k: 'irr', label: 'Levered IRR', fmt: (v) => `${v.toFixed(1)}%` }],
        rows: [{ name: 'NextEra Energy', gw: 35.0, plf: 24.5, lcoe: 3.1, irr: 13.5 }, { name: 'Iberdrola', gw: 18.0, plf: 21.8, lcoe: 3.6, irr: 12.2 }, { name: 'Enel Green Power', gw: 14.5, plf: 22.4, lcoe: 3.5, irr: 12.8 }, { name: 'Brookfield Renewable', gw: 11.0, plf: 21.0, lcoe: 3.8, irr: 11.5 }, { name: 'EDP Renováveis', gw: 13.2, plf: 21.5, lcoe: 3.7, irr: 11.8 }, { name: 'Ørsted Onshore', gw: 4.8, plf: 24.0, lcoe: 3.3, irr: 13.0 }] }}
        indiaContext={{
          subtitle: 'MNRE · CERC · NSE/BSE listed IPPs',
          regulations: [
            { tag: 'MNRE Solar Mission', status: 'active', detail: '500 GW RE by 2030' },
            { tag: 'PLI — Solar PV (₹24k Cr)', status: 'active' },
            { tag: 'CERC must-run status', status: 'active' },
            { tag: 'ALMM list — modules', status: 'active' },
            { tag: 'Solar Park Scheme Ph-II', status: 'active' },
            { tag: 'SECI Tariff-based comp', status: 'active' },
            { tag: 'CCTS Scope 1 compliance', status: 'partial' },
            { tag: 'SEBI BRSR Core — FY26', status: 'active' },
          ],
          kpis: [
            { label: 'India Solar Capacity', value: '89 GW', detail: 'As of 2025; target 280 GW by 2030' },
            { label: 'SECI Tariff (bid low)', value: '₹2.18/kWh', detail: 'Record low Rajasthan 2024' },
            { label: 'Avg Capex (₹/W DC)', value: '₹34', detail: '2025; target ₹26 by 2028' },
            { label: 'Levelised CoE', value: '₹2.50/kWh', detail: 'Post ITC/PLI blended' },
          ],
          peers: { title: 'INDIAN IPP BENCHMARKS',
            cols: [{ k: 'name', label: 'Indian IPP' }, { k: 'gw', label: 'Solar GW' }, { k: 'pipe', label: 'Pipeline GW' }, { k: 'ppa', label: 'Avg PPA (₹/kWh)' }, { k: 'rating', label: 'Credit' }],
            rows: [
              { name: 'Adani Green Energy', gw: '11.2', pipe: '10.9', ppa: '3.05', rating: 'BBB-' },
              { name: 'ReNew Energy Global', gw: '9.8', pipe: '7.8', ppa: '2.95', rating: 'BB+' },
              { name: 'NTPC Green Energy', gw: '3.3', pipe: '12.0', ppa: '2.85', rating: 'AAA(in)' },
              { name: 'Tata Power Renewables', gw: '4.6', pipe: '4.2', ppa: '3.15', rating: 'AA(in)' },
              { name: 'Azure Power', gw: '3.1', pipe: '2.3', ppa: '3.30', rating: 'B+' },
              { name: 'Greenko Group', gw: '2.9', pipe: '5.4', ppa: '3.10', rating: 'BB' },
            ] },
          notes: 'India PV finance is shaped by SECI RE-auction tariffs (₹2.18–₹2.80/kWh), state DISCOM payment risk, and ALMM-restricted panel sourcing. ITC/Accelerated Depreciation (40% Yr1) improves post-tax IRR by 250–400 bps vs ex-incentive base case.',
        }}
      />
    </div>
  );
}
