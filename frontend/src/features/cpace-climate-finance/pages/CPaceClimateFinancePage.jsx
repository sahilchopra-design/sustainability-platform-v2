import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235', navy: '#1e3a5f', gold: '#d4a843', sage: '#2d6a4f', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050', red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

const PACE_PROGRAMS = [
  { id: 'pg', name: 'PACE Nation', state: 'National', active: true, maxLtv: 100, maxAmountM: 50, rate: 6.8, tenor: 25, eligible: 'Commercial, industrial, multifamily', improvements: 'Energy, water, seismic, resilience', securitized: true },
  { id: 'yg', name: 'Ygrene Energy Fund', state: 'CA/FL/GA', active: true, maxLtv: 90, maxAmountM: 25, rate: 7.2, tenor: 20, eligible: 'Commercial & residential', improvements: 'Solar, HVAC, insulation, EV charging', securitized: true },
  { id: 'cp', name: 'CounterPointe Energy', state: 'Multi-state', active: true, maxLtv: 100, maxAmountM: 75, rate: 6.5, tenor: 30, eligible: 'Commercial, industrial', improvements: 'Energy efficiency, solar, storage', securitized: true },
  { id: 'nv', name: 'Nuveen/Greenworks', state: 'Multi-state', active: true, maxLtv: 85, maxAmountM: 100, rate: 6.2, tenor: 25, eligible: 'Commercial', improvements: 'HVAC, LED, solar, EV, water', securitized: true },
  { id: 'pp', name: 'Petros PACE Finance', state: 'Multi-state', active: true, maxLtv: 100, maxAmountM: 200, rate: 6.4, tenor: 30, eligible: 'Commercial, industrial, hotel', improvements: 'Energy, seismic, resilience', securitized: true },
  { id: 'pl', name: 'PACE Loan Group', state: 'Multi-state', active: true, maxLtv: 95, maxAmountM: 30, rate: 7.0, tenor: 20, eligible: 'Commercial', improvements: 'Solar, energy efficiency', securitized: false },
  { id: 'rf', name: 'Renew Financial', state: 'CA/NY', active: true, maxLtv: 90, maxAmountM: 15, rate: 7.5, tenor: 20, eligible: 'Commercial & residential', improvements: 'Solar, storage, efficiency', securitized: false },
];

const STATE_PROGRAMS = [
  { state: 'California', status: 'Active', year: 2008, volume: 12800, residential: true, commercial: true, notes: 'AB 811 — largest market globally' },
  { state: 'Florida', status: 'Active', year: 2010, volume: 4200, residential: true, commercial: true, notes: 'PACE Funding Group leading' },
  { state: 'New York', status: 'Active', year: 2019, volume: 1800, residential: false, commercial: true, notes: 'NY-PACE commercial only' },
  { state: 'Texas', status: 'Active', year: 2013, volume: 950, residential: false, commercial: true, notes: 'CPACE only; no residential' },
  { state: 'Colorado', status: 'Active', year: 2015, volume: 680, residential: false, commercial: true, notes: 'CPACE Colorado' },
  { state: 'Massachusetts', status: 'Active', year: 2012, volume: 520, residential: true, commercial: true, notes: 'HEAT Loan + MassSave' },
  { state: 'Missouri', status: 'Active', year: 2010, volume: 410, residential: true, commercial: true, notes: 'PACE Missouri' },
  { state: 'Connecticut', status: 'Active', year: 2012, volume: 380, residential: true, commercial: true, notes: 'Green Bank CPACE' },
  { state: 'Georgia', status: 'Active', year: 2014, volume: 290, residential: false, commercial: true, notes: 'Ygrene primary provider' },
  { state: 'Michigan', status: 'Active', year: 2010, volume: 240, residential: false, commercial: true, notes: 'PACE Financing Act' },
];

const IMPROVEMENT_TYPES = [
  { type: 'Solar PV', avgCost: 180, lifetimeYr: 30, annSavingsPct: 22, payback: 8, co2AvoidedT: 42, eligible: 'All states' },
  { type: 'HVAC Replacement', avgCost: 45, lifetimeYr: 20, annSavingsPct: 18, payback: 6, co2AvoidedT: 18, eligible: 'All states' },
  { type: 'LED Lighting', avgCost: 28, lifetimeYr: 15, annSavingsPct: 12, payback: 4, co2AvoidedT: 8, eligible: 'All states' },
  { type: 'Battery Storage', avgCost: 320, lifetimeYr: 15, annSavingsPct: 28, payback: 9, co2AvoidedT: 55, eligible: 'CA/NY/MA' },
  { type: 'EV Charging Infrastructure', avgCost: 85, lifetimeYr: 15, annSavingsPct: 8, payback: 12, co2AvoidedT: 24, eligible: 'All states' },
  { type: 'Building Envelope Retrofit', avgCost: 120, lifetimeYr: 25, annSavingsPct: 20, payback: 7, co2AvoidedT: 32, eligible: 'All states' },
  { type: 'Water Efficiency', avgCost: 38, lifetimeYr: 20, annSavingsPct: 15, payback: 5, co2AvoidedT: 6, eligible: 'All states' },
  { type: 'Seismic/Resilience', avgCost: 250, lifetimeYr: 40, annSavingsPct: 5, payback: 40, co2AvoidedT: 10, eligible: 'CA/OR/WA' },
];

const TABS = ['Overview', 'PACE Mechanics', 'Program Landscape', 'Underwriting Engine', 'Energy Savings', 'Retrofit Calculator', 'Securitization', 'State Programs', 'Investor Analytics', 'Case Studies'];

function calcPaceLoan({ propertyValue, improvementCost, maxLtv, existingDebt, annSavings, rate, tenor }) {
  const maxLoan = propertyValue * (maxLtv / 100) - existingDebt;
  const loanAmount = Math.min(improvementCost, maxLoan);
  const annualPayment = loanAmount > 0 ? loanAmount * (rate / 100) / (1 - Math.pow(1 + rate / 100, -tenor)) : 0;
  const netAnnualBenefit = annSavings - annualPayment;
  const simplePayback = annSavings > 0 ? loanAmount / annSavings : Infinity;
  return { loanAmount: loanAmount.toFixed(0), annualPayment: annualPayment.toFixed(0), netAnnualBenefit: netAnnualBenefit.toFixed(0), simplePayback: isFinite(simplePayback) ? simplePayback.toFixed(1) : 'N/A', feasible: netAnnualBenefit > 0 };
}

function calcEnergyBenefit({ improvementCost, annSavingsPct, electricityRate }) {
  const annSavings = improvementCost * (annSavingsPct / 100) * electricityRate / 0.12;
  return annSavings.toFixed(0);
}

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.gold, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function CPaceClimateFinancePage() {
  const [tab, setTab] = useState('Overview');
  const [selectedProgram, setSelectedProgram] = useState('pg');
  const [propertyValue, setPropertyValue] = useState(2000);
  const [improvementCost, setImprovementCost] = useState(400);
  const [existingDebt, setExistingDebt] = useState(800);
  const [annSavings, setAnnSavings] = useState(45);
  const [electricityRate, setElectricityRate] = useState(0.12);
  const [selectedImprovement, setSelectedImprovement] = useState(0);

  const prog = PACE_PROGRAMS.find(p => p.id === selectedProgram) || PACE_PROGRAMS[0];
  const paceCalc = calcPaceLoan({ propertyValue, improvementCost, maxLtv: prog.maxLtv, existingDebt, annSavings, rate: prog.rate, tenor: prog.tenor });
  const imp = IMPROVEMENT_TYPES[selectedImprovement];
  const energyBenefit = calcEnergyBenefit({ improvementCost, annSavingsPct: imp.annSavingsPct, electricityRate });

  const totalVolume = STATE_PROGRAMS.reduce((s, p) => s + p.volume, 0);

  const cashflowData = useMemo(() => {
    const loanAmt = Number(paceCalc.loanAmount);
    const annPayment = Number(paceCalc.annualPayment);
    return Array.from({ length: Math.min(prog.tenor, 20) }, (_, yr) => ({
      year: yr + 1,
      savings: annSavings,
      payment: annPayment,
      net: annSavings - annPayment,
      cumNet: (annSavings - annPayment) * (yr + 1),
    }));
  }, [paceCalc, prog.tenor, annSavings]);

  const securitizationData = PACE_PROGRAMS.filter(p => p.securitized).map(p => ({ name: p.name.split(' ')[0], rate: p.rate, tenor: p.tenor }));

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.text, padding: '24px 32px' }}>
      <div style={{ borderBottom: `2px solid ${T.gold}`, paddingBottom: 16, marginBottom: 24 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: '0.12em', marginBottom: 6 }}>EP-DY4 · C-PACE CLIMATE FINANCE</div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>C-PACE & Property-Assessed Climate Finance Suite</h1>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 6 }}>Commercial PACE · Underwriting Engine · Energy Savings · Securitization · 40+ State Programs · Retrofit Calculator</div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 28, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 14px', borderRadius: 4, border: `1px solid ${tab === t ? T.gold : T.border}`, background: tab === t ? T.gold : T.surface, color: tab === t ? T.bg : T.textSec, fontFamily: T.mono, fontSize: 11, cursor: 'pointer', fontWeight: tab === t ? 700 : 400 }}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <Kpi label="TOTAL PACE ORIGINATION" value="$21Bn+" sub="Cumulative US 2009–2024" />
            <Kpi label="C-PACE MARKET SHARE" value="68%" sub="Commercial dominates" color={T.green} />
            <Kpi label="STATES WITH PACE" value="38" sub="Enabling legislation" color={T.teal} />
            <Kpi label="AVG TENOR" value="22yr" sub="vs 5-7yr conventional" color={T.amber} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>IMPROVEMENT TYPE CO₂ AVOIDED (tons/yr/project)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[...IMPROVEMENT_TYPES].sort((a, b) => b.co2AvoidedT - a.co2AvoidedT).map(i => ({ name: i.type.split(' ')[0], co2: i.co2AvoidedT }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 9 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="co2" fill={T.green} name="CO₂ Avoided (tons)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>PAYBACK PERIOD BY IMPROVEMENT (years)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={IMPROVEMENT_TYPES.map(i => ({ name: i.type.split(' ')[0], payback: i.payback }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 9 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="payback" fill={T.amber} name="Simple Payback (yr)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'PACE Mechanics' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="ASSESSMENT LIEN PRIORITY" value="Senior" sub="Before mortgage" color={T.red} />
            <Kpi label="REPAYMENT VIA" value="Property Tax" sub="Annual assessment" color={T.teal} />
            <Kpi label="MAX LTV (TYPICAL)" value="90-100%" sub="Assessed value basis" />
            <Kpi label="LENDER CONSENT" value="Required" sub="Mortgage lender approval" color={T.amber} />
          </div>
          {[['How PACE Financing Works', 'Property Assessed Clean Energy (PACE) allows property owners to finance energy improvements through a voluntary tax assessment on their property. The assessment is senior to existing mortgage debt, repaid via property tax bill, and transfers with the property on sale.'],
            ['Senior Lien Position', 'PACE assessments are senior to mortgages and other liens. This has caused controversy with Fannie Mae/Freddie Mac (GSEs), which do not purchase mortgages with senior PACE liens for residential. C-PACE avoids this conflict for commercial.'],
            ['Transfer on Sale Feature', 'One key benefit: if the property is sold before the assessment is paid off, the new owner assumes the remaining obligation (which is reflected in the property price). This eliminates the "short payback horizon" problem for building owners.'],
            ['Underwriting Basis', 'C-PACE is underwritten on property value and debt service coverage of the assessed improvements — not borrower credit. This makes it accessible to borrowers who may not qualify for conventional energy loans.'],
            ['FHFA and GSE Issues', 'Federal Housing Finance Agency (FHFA) prohibits Fannie/Freddie from purchasing loans with senior residential PACE liens. This limits R-PACE to non-agency market. C-PACE is not affected by FHFA restrictions.']].map(([title, desc], i) => (
            <div key={i} style={{ marginBottom: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Program Landscape' && (
        <div>
          <div style={{ marginBottom: 20, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>C-PACE PROGRAM PROVIDERS</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Provider', 'States', 'Max LTV', 'Max Loan ($M)', 'Rate', 'Tenor', 'Securitized'].map(h => <th key={h} style={{ textAlign: 'left', color: T.textSec, fontFamily: T.mono, padding: '6px 10px', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{PACE_PROGRAMS.map((p, i) => (
                <tr key={p.id} onClick={() => setSelectedProgram(p.id)} style={{ cursor: 'pointer', background: selectedProgram === p.id ? T.surfaceH : i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                  <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{p.state}</td>
                  <td style={{ padding: '7px 10px', color: T.teal, fontFamily: T.mono }}>{p.maxLtv}%</td>
                  <td style={{ padding: '7px 10px', color: T.gold, fontFamily: T.mono }}>${p.maxAmountM}M</td>
                  <td style={{ padding: '7px 10px', color: T.text, fontFamily: T.mono }}>{p.rate.toFixed(1)}%</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{p.tenor}yr</td>
                  <td style={{ padding: '7px 10px', color: p.securitized ? T.green : T.textMut }}>{p.securitized ? 'Yes' : 'No'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 8 }}>SELECTED: {prog.name.toUpperCase()}</div>
            <div style={{ fontSize: 12, color: T.textSec }}><strong style={{ color: T.text }}>Eligible Properties:</strong> {prog.eligible}<br /><strong style={{ color: T.text }}>Eligible Improvements:</strong> {prog.improvements}</div>
          </div>
        </div>
      )}

      {tab === 'Underwriting Engine' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 16 }}>PACE LOAN UNDERWRITING</div>
              <div style={{ marginBottom: 10, fontSize: 11, color: T.textSec }}>
                Program: <select value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)} style={{ background: T.surfaceH, color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, padding: '2px 6px', fontSize: 11, fontFamily: T.mono }}>
                  {PACE_PROGRAMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {[['Property Value ($K)', propertyValue, setPropertyValue, 200, 20000], ['Improvement Cost ($K)', improvementCost, setImprovementCost, 10, 5000], ['Existing Debt ($K)', existingDebt, setExistingDebt, 0, 15000], ['Annual Energy Savings ($K)', annSavings, setAnnSavings, 5, 500]].map(([label, val, setter, min, max]) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>{label}: <span style={{ color: T.gold, fontFamily: T.mono }}>{val.toLocaleString()}</span></div>
                  <input type="range" min={min} max={max} step={min < 50 ? 1 : 50} value={val} onChange={e => setter(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
                </div>
              ))}
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 14, marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: T.textSec }}>Max PACE Loan</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.gold, fontFamily: T.mono }}>${Number(paceCalc.loanAmount).toLocaleString()}K</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: T.textSec }}>Annual Payment</span>
                  <span style={{ fontSize: 13, color: T.text, fontFamily: T.mono }}>${Number(paceCalc.annualPayment).toLocaleString()}K</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: T.textSec }}>Net Annual Benefit</span>
                  <span style={{ fontSize: 13, color: Number(paceCalc.netAnnualBenefit) >= 0 ? T.green : T.red, fontFamily: T.mono }}>${paceCalc.netAnnualBenefit}K</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: T.textSec }}>Simple Payback</span>
                  <span style={{ fontSize: 13, color: T.teal, fontFamily: T.mono }}>{paceCalc.simplePayback}yr</span>
                </div>
                <div style={{ marginTop: 10, padding: '6px 10px', borderRadius: 4, background: paceCalc.feasible ? T.sage : T.red, color: T.text, fontSize: 11, fontWeight: 600, textAlign: 'center' }}>
                  {paceCalc.feasible ? 'CASH FLOW POSITIVE' : 'PAYMENT EXCEEDS SAVINGS'}
                </div>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>ANNUAL CASHFLOW PROJECTION</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={cashflowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fill: T.textSec, fontSize: 10 }} label={{ value: 'Year', position: 'insideBottom', offset: -5, fill: T.textSec, fontSize: 11 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Bar dataKey="savings" fill={T.green} name="Energy Savings ($K)" />
                  <Bar dataKey="payment" fill={T.amber} name="PACE Payment ($K)" />
                  <ReferenceLine y={0} stroke={T.border} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Energy Savings' && (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontSize: 11, color: T.textSec }}>Improvement type:</div>
            <select value={selectedImprovement} onChange={e => setSelectedImprovement(Number(e.target.value))} style={{ background: T.surface, color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, padding: '5px 10px', fontSize: 12, fontFamily: T.mono }}>
              {IMPROVEMENT_TYPES.map((imp, i) => <option key={i} value={i}>{imp.type}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="AVG COST ($K)" value={`$${imp.avgCost}K`} sub="Per project (commercial)" />
            <Kpi label="ENERGY SAVINGS" value={`${imp.annSavingsPct}%`} sub="Annual reduction" color={T.green} />
            <Kpi label="SIMPLE PAYBACK" value={`${imp.payback}yr`} sub="Undiscounted" color={T.teal} />
            <Kpi label="CO₂ AVOIDED" value={`${imp.co2AvoidedT}t`} sub="Per project per year" color={T.sage} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>IMPROVEMENT COMPARISON: SAVINGS vs PAYBACK</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={IMPROVEMENT_TYPES.map(i => ({ name: i.type.split(' ')[0], savings: i.annSavingsPct, payback: i.payback }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 9 }} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                <Legend />
                <Bar dataKey="savings" fill={T.green} name="Energy Savings (%)" />
                <Bar dataKey="payback" fill={T.amber} name="Payback (yr)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>ALL IMPROVEMENT TYPES</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Type', 'Avg Cost ($K)', 'Lifetime (yr)', 'Savings (%)', 'Payback (yr)', 'CO₂ Avoided', 'Eligible States'].map(h => <th key={h} style={{ textAlign: 'left', color: T.textSec, fontFamily: T.mono, padding: '6px 10px', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{IMPROVEMENT_TYPES.map((i, idx) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? T.surfaceH : 'transparent' }}>
                  <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600 }}>{i.type}</td>
                  <td style={{ padding: '7px 10px', color: T.gold, fontFamily: T.mono }}>${i.avgCost}K</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{i.lifetimeYr}yr</td>
                  <td style={{ padding: '7px 10px', color: T.green }}>{i.annSavingsPct}%</td>
                  <td style={{ padding: '7px 10px', color: T.teal }}>{i.payback}yr</td>
                  <td style={{ padding: '7px 10px', color: T.sage }}>{i.co2AvoidedT}t/yr</td>
                  <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{i.eligible}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Retrofit Calculator' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 16 }}>RETROFIT BUNDLE CALCULATOR</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Electricity Rate ($/kWh): <span style={{ color: T.gold, fontFamily: T.mono }}>{electricityRate.toFixed(2)}</span></div>
                <input type="range" min={0.06} max={0.30} step={0.01} value={electricityRate} onChange={e => setElectricityRate(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Improvement Cost ($K): <span style={{ color: T.gold, fontFamily: T.mono }}>{improvementCost}</span></div>
                <input type="range" min={10} max={2000} step={10} value={improvementCost} onChange={e => setImprovementCost(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
              </div>
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 14 }}>
                <div style={{ fontSize: 11, color: T.textSec }}>EST. ANNUAL ENERGY SAVINGS</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: T.green, fontFamily: T.mono }}>${Number(energyBenefit).toLocaleString()}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{imp.type} at ${electricityRate.toFixed(2)}/kWh</div>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>CUMULATIVE NET BENEFIT OVER TIME</div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={cashflowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fill: T.textSec, fontSize: 11 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Area type="monotone" dataKey="cumNet" stroke={paceCalc.feasible ? T.green : T.red} fill={paceCalc.feasible ? T.sage : 'rgba(192,57,43,0.2)'} name="Cumulative Net ($K)" />
                  <ReferenceLine y={0} stroke={T.border} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Securitization' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="PACE ABS MARKET" value="$8.2Bn" sub="Cumulative issuance" />
            <Kpi label="RATED PACE ABS" value="AA/Aaa" sub="Senior tranche rating" color={T.green} />
            <Kpi label="INVESTOR BASE" value="Insurance/pension" sub="Primary buyers" color={T.teal} />
            <Kpi label="LOSS RATE (HIST.)" value="<0.5%" sub="Since program inception" color={T.green} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>SECURITIZED PROGRAMS: RATE vs TENOR</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={securitizationData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 10 }} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                <Legend />
                <Bar dataKey="rate" fill={T.gold} name="Rate (%)" />
                <Bar dataKey="tenor" fill={T.teal} name="Tenor (yr)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {[['PACE ABS Structure', 'PACE loans are pooled and securitized into asset-backed securities. The senior-lien tax assessment provides strong collateral. Bonds are rated by Kroll or Fitch and sold to institutional investors seeking long-duration, investment-grade assets.'],
            ['Rating Rationale', 'Senior lien priority + mandatory property tax collection mechanism + low historical default rates produce strong credit quality. Property tax enforcement (including foreclosure) backstops repayment — not borrower creditworthiness.'],
            ['GSE Issue for Residential PACE ABS', 'Fannie/Freddie will not purchase mortgages in first-lien PACE states without senior PACE waiver. This limits R-PACE ABS to non-agency channel. C-PACE securitization is unaffected.']].map(([title, desc], i) => (
            <div key={i} style={{ marginBottom: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'State Programs' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="STATES TRACKED" value={STATE_PROGRAMS.length} sub="With PACE legislation" color={T.teal} />
            <Kpi label="TOTAL VOLUME ($M)" value={`$${totalVolume.toLocaleString()}`} sub="All states" />
            <Kpi label="LARGEST MARKET" value="California" sub={`$${STATE_PROGRAMS[0].volume.toLocaleString()}M`} color={T.green} />
            <Kpi label="RESIDENTIAL STATES" value={STATE_PROGRAMS.filter(s => s.residential).length} sub="Allow R-PACE" color={T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>STATE PROGRAM VOLUME ($M)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[...STATE_PROGRAMS].sort((a, b) => b.volume - a.volume).map(s => ({ state: s.state, volume: s.volume }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="state" tick={{ fill: T.textSec, fontSize: 9 }} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                <Bar dataKey="volume" fill={T.sage} name="Volume ($M)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['State', 'Status', 'Since', 'Volume ($M)', 'Residential', 'Commercial', 'Notes'].map(h => <th key={h} style={{ textAlign: 'left', color: T.textSec, fontFamily: T.mono, padding: '6px 10px', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{STATE_PROGRAMS.map((s, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                  <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600 }}>{s.state}</td>
                  <td style={{ padding: '7px 10px', color: s.status === 'Active' ? T.green : T.amber }}>{s.status}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{s.year}</td>
                  <td style={{ padding: '7px 10px', color: T.gold, fontFamily: T.mono }}>{s.volume.toLocaleString()}</td>
                  <td style={{ padding: '7px 10px', color: s.residential ? T.green : T.textMut }}>{s.residential ? 'Yes' : 'No'}</td>
                  <td style={{ padding: '7px 10px', color: s.commercial ? T.green : T.textMut }}>{s.commercial ? 'Yes' : 'No'}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{s.notes}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Investor Analytics' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="TYPICAL INVESTOR YIELD" value="5.5–7.5%" sub="PACE ABS senior notes" color={T.green} />
            <Kpi label="DURATION" value="8–15yr" sub="WAL on senior tranche" />
            <Kpi label="PREPAYMENT RISK" value="Low" sub="Tax lien = limited refi" color={T.teal} />
            <Kpi label="CREDIT ENHANCEMENT" value="OC + reserve" sub="Typical ABS structure" color={T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>INVESTOR CONSIDERATIONS</div>
            {[['Yield vs Risk Profile', 'PACE ABS senior notes offer 50-150bps spread over comparable-duration Treasuries. Strong credit (tax-lien enforcement mechanism) justifies investment-grade rating despite novelty of asset class.'],
              ['ESG / Impact Classification', 'PACE loans directly fund clean energy and energy efficiency improvements. Qualifies as green under GBP Use of Proceeds categories. Eligible for ESG-labeled ABS frameworks.'],
              ['Investor Universe', 'Insurance companies (long duration match), pension funds (liability-matching), green bond funds, SRI mutual funds. Market deepening with broader institutional acceptance.'],
              ['Key Risks', '1. Property default: property taxes must be paid; foreclosure risk is real but low. 2. Prepayment: property sale triggers payoff — ABS may prepay. 3. Regulatory: FHFA stance on R-PACE creates sector-level risk. 4. Servicer risk: specialty servicers manage assessments.']].map(([title, desc], i) => (
              <div key={i} style={{ marginBottom: 12, background: T.surfaceH, borderRadius: 6, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Case Studies' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[{ title: 'Hotel Solar + Storage — Miami, FL', amount: '$8.2M', rate: '6.9%', tenor: '25yr', program: 'Ygrene', savings: '$420K/yr', payback: '19.5yr', co2: '480t/yr CO₂ avoided', detail: '150-room hotel financed rooftop solar PV + BESS via C-PACE. Eliminates demand charges; LEED Existing certification achieved.' },
              { title: 'Office Tower HVAC Retrofit — Austin, TX', amount: '$4.5M', rate: '6.5%', tenor: '20yr', program: 'CounterPointe', savings: '$280K/yr', payback: '16yr', co2: '220t/yr CO₂ avoided', detail: '400,000 sq ft Class A office. New VRF HVAC + LED + BMS. ENERGY STAR score improved from 52 to 84. Property value uplift estimated 3–5%.' },
              { title: 'Industrial Facility — Memphis, TN', amount: '$12M', rate: '6.4%', tenor: '30yr', program: 'Petros PACE', savings: '$650K/yr', payback: '18.5yr', co2: '880t/yr CO₂ avoided', detail: 'Manufacturing plant roof solar + EV charging + efficient compressors. PACE structured as off-balance-sheet for tenant; on-bill savings model.' },
              { title: 'Multifamily — San Jose, CA', amount: '$3.8M', rate: '6.8%', tenor: '25yr', program: 'Nuveen/Greenworks', savings: '$210K/yr', payback: '18yr', co2: '190t/yr CO₂ avoided', detail: '180-unit affordable housing. Solar + heat pump water heaters + insulation. Tenant utility bills reduced 35%. CPACE structured with senior lender consent.' }].map((cs, i) => (
              <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 8 }}>{cs.title}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: T.teal, fontFamily: T.mono }}>{cs.amount}</span>
                  <span style={{ fontSize: 11, color: T.textSec }}>{cs.rate} · {cs.tenor} · {cs.program}</span>
                </div>
                <div style={{ fontSize: 11, color: T.green, marginBottom: 4 }}>Savings: {cs.savings} · Payback: {cs.payback}</div>
                <div style={{ fontSize: 11, color: T.sage, marginBottom: 8 }}>{cs.co2}</div>
                <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>{cs.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
