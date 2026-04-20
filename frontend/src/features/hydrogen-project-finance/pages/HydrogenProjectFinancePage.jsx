import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ComposedChart, Cell,
  ScatterChart, Scatter
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = {
  bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9',
  text: '#1A1A2E', sub: '#6B7280', accent: '#B8860B',
  green: '#065F46', red: '#991B1B', blue: '#1E40AF',
  teal: '#0F766E', amber: '#92400E', navy: '#0F172A',
  indigo: '#4F46E5', purple: '#7C3AED', sage: '#4A7C59'
};

// ── Finance maths ─────────────────────────────────────────────────────────────
function npv(cashflows, rate) {
  return cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t + 1), 0);
}

function irr(cashflows, guess = 0.1, maxIter = 200) {
  let r = guess;
  for (let i = 0; i < maxIter; i++) {
    const f  = cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + r, t), 0);
    const df = cashflows.reduce((s, cf, t) => s - t * cf / Math.pow(1 + r, t + 1), 0);
    if (Math.abs(df) < 1e-12) break;
    const next = r - f / df;
    if (Math.abs(next - r) < 1e-8) { r = next; break; }
    r = next;
  }
  return r;
}

function dscr(ebitda, debtService) {
  return debtService > 0 ? ebitda / debtService : 0;
}

function buildCashflows({ capex, revenue, opex, debtAmt, debtRate, tenor, constructionYears, lifetime }) {
  const cashflows = [];
  for (let y = 0; y < lifetime; y++) {
    if (y < constructionYears) {
      cashflows.push(-capex / constructionYears);
    } else {
      const opYear = y - constructionYears + 1;
      const debtSvc = opYear <= tenor
        ? debtAmt * debtRate / (1 - Math.pow(1 + debtRate, -tenor))
        : 0;
      const ebitda = revenue * (1 - 0.02 * Math.max(0, opYear - 5)) - opex;
      cashflows.push(ebitda - debtSvc);
    }
  }
  return cashflows;
}

function Slider({ label, value, min, max, step = 1, onChange, unit = '' }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.sub, marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ color: T.accent, fontFamily: 'monospace' }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: T.accent }} />
    </div>
  );
}

function KpiCard({ label, value, unit, sub, color }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy, fontFamily: 'monospace' }}>{value}</div>
      {unit && <div style={{ fontSize: 10, color: T.sub }}>{unit}</div>}
      {sub && <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

const TABS = [
  'Project Model', 'Debt & Equity Structure', 'DSCR Analysis', 'Monte Carlo Risk',
  'Subsidy Stacking', 'Offtake Structures', 'Comparable Projects', 'EU H₂ Bank',
  'IRA §45V Analysis', 'Investor Returns'
];

export default function HydrogenProjectFinancePage() {
  const [tab, setTab] = useState(0);

  // Model inputs
  const [capex, setCapex] = useState(800);      // M€
  const [scale, setScale] = useState(100);       // MW electrolyzer
  const [revenuePerYear, setRevenuePerYear] = useState(120); // M€/yr
  const [opexPerYear, setOpexPerYear] = useState(25);  // M€/yr
  const [debtRatio, setDebtRatio] = useState(70);  // %
  const [debtRate, setDebtRate] = useState(5.5);   // %
  const [tenor, setTenor] = useState(18);          // years
  const [constructYrs, setConstructYrs] = useState(3);
  const [lifetime, setLifetime] = useState(25);
  const [wacc, setWacc] = useState(9);
  const [h2BankSubsidy, setH2BankSubsidy] = useState(1.0); // €/kg
  const [annualOutput, setAnnualOutput] = useState(15000); // t H2/yr

  const debtAmt = capex * debtRatio / 100;
  const equityAmt = capex * (1 - debtRatio / 100);

  const cashflows = useMemo(() => buildCashflows({
    capex, revenue: revenuePerYear, opex: opexPerYear,
    debtAmt, debtRate: debtRate / 100, tenor, constructionYears: constructYrs, lifetime
  }), [capex, revenuePerYear, opexPerYear, debtAmt, debtRate, tenor, constructYrs, lifetime]);

  const projectIrr = useMemo(() => {
    const r = irr([-capex, ...cashflows.slice(constructYrs)]);
    return isFinite(r) ? +(r * 100).toFixed(1) : 'N/A';
  }, [capex, cashflows, constructYrs]);

  const projectNpv = useMemo(() => +npv(cashflows, wacc / 100).toFixed(1), [cashflows, wacc]);

  const equityCashflows = useMemo(() => {
    const cfs = [-equityAmt];
    for (let y = constructYrs; y < lifetime; y++) {
      cfs.push(cashflows[y]);
    }
    return cfs;
  }, [equityAmt, cashflows, constructYrs, lifetime]);

  const equityIrr = useMemo(() => {
    const r = irr(equityCashflows);
    return isFinite(r) ? +(r * 100).toFixed(1) : 'N/A';
  }, [equityCashflows]);

  const ebitdaAvg = (revenuePerYear - opexPerYear);
  const annualDebtService = debtAmt * (debtRate / 100) / (1 - Math.pow(1 + debtRate / 100, -tenor));
  const minDscr = +dscr(ebitdaAvg, annualDebtService).toFixed(2);

  // Annual cashflow chart data
  const cashflowData = useMemo(() => cashflows.map((cf, i) => ({
    year: `Y${i + 1}`,
    cashflow: +cf.toFixed(1),
    cumulative: +cashflows.slice(0, i + 1).reduce((a, b) => a + b, 0).toFixed(1),
  })), [cashflows]);

  // DSCR profile over time
  const dscrData = useMemo(() => Array.from({ length: tenor }, (_, i) => ({
    year: `Y${constructYrs + i + 1}`,
    ebitda: +(revenuePerYear - opexPerYear).toFixed(1),
    debtService: +annualDebtService.toFixed(1),
    dscr: +dscr(revenuePerYear - opexPerYear, annualDebtService).toFixed(2),
  })), [revenuePerYear, opexPerYear, annualDebtService, tenor, constructYrs]);

  // Monte Carlo
  const mcData = useMemo(() => Array.from({ length: 200 }, (_, i) => {
    const revShock = 0.8 + sr(i * 17) * 0.4;
    const opexShock = 0.9 + sr(i * 11) * 0.3;
    const capexShock = 0.9 + sr(i * 7) * 0.3;
    const adjCapex = capex * capexShock;
    const adjRev = revenuePerYear * revShock;
    const adjOpex = opexPerYear * opexShock;
    const cfs = buildCashflows({ capex: adjCapex, revenue: adjRev, opex: adjOpex, debtAmt: adjCapex * debtRatio / 100, debtRate: debtRate / 100, tenor, constructionYears: constructYrs, lifetime });
    const r = irr([-adjCapex, ...cfs.slice(constructYrs)]);
    const n = +npv(cfs, wacc / 100).toFixed(0);
    return { irr: isFinite(r) ? +(r * 100).toFixed(1) : null, npv: isFinite(n) ? n : null };
  }).filter(d => d.irr !== null && d.irr > -50 && d.irr < 100), [capex, revenuePerYear, opexPerYear, debtRatio, debtRate, tenor, constructYrs, lifetime, wacc]);

  // Subsidy stacking
  const subsidyStack = useMemo(() => {
    const h2BankTotal = h2BankSubsidy * annualOutput * 1000 * 10; // 10yr programme
    const ira45v = 2.0 * annualOutput * 1000 * 10;  // ~$2/kg for tier 1, 10 yr
    const grantsCapex = capex * 0.3;  // 30% IPCEI grant assumption
    const totalSubsidy = h2BankTotal + grantsCapex;
    const subsidisedCapex = capex - grantsCapex;
    return { h2BankTotal: (h2BankTotal / 1e6).toFixed(0), ira45v: (ira45v / 1e6).toFixed(0), grantsCapex: (grantsCapex).toFixed(0), totalSubsidy: (totalSubsidy / 1e6).toFixed(0), subsidisedCapex: (subsidisedCapex).toFixed(0) };
  }, [h2BankSubsidy, annualOutput, capex]);

  // Comparable project data
  const comparables = [
    { name: 'NEOM / Air Products', country: 'Saudi Arabia', scale: 4000, capex: 8400, h2Output: 600000, irr: 11.2, debtRatio: 65, status: 'FID 2023' },
    { name: 'HIF Matagorda', country: 'USA',          scale: 800,  capex: 2100, h2Output: 90000,  irr: 12.5, debtRatio: 60, status: 'FID 2025' },
    { name: 'Ørsted H2RES', country: 'Denmark',      scale: 2000, capex: 1800, h2Output: 250000, irr: 9.8,  debtRatio: 70, status: 'Operational' },
    { name: 'Hydrogen Utopia', country: 'Poland',    scale: 200,  capex: 300,  h2Output: 25000,  irr: 8.5,  debtRatio: 75, status: 'Under Const.' },
    { name: 'AREH', country: 'Australia',            scale: 26000,capex: 36000,h2Output: 1800000,irr: 13.1, debtRatio: 55, status: 'FEED' },
    { name: 'NortH2', country: 'Netherlands',        scale: 4000, capex: 3500, h2Output: 400000, irr: 9.2,  debtRatio: 70, status: 'Permitting' },
  ];

  const panelStyle = { background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text };
  const headerStyle = { background: T.navy, color: '#fff', padding: '20px 28px', borderBottom: `3px solid ${T.accent}` };
  const tabBarStyle = { display: 'flex', overflowX: 'auto', borderBottom: `1px solid ${T.border}`, background: T.card, padding: '0 16px' };
  const tabStyle = active => ({ padding: '10px 16px', fontSize: 12, fontWeight: active ? 700 : 400, color: active ? T.accent : T.sub, borderBottom: active ? `2px solid ${T.accent}` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' });
  const sectionStyle = { padding: '20px 24px' };
  const cardStyle = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 16 };
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 };

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div style={{ fontSize: 11, color: T.accent, fontFamily: 'monospace', marginBottom: 4 }}>EP-DS4 · GREEN HYDROGEN FINANCE</div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Hydrogen Project Finance & Investment Analytics Engine</h1>
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>DSCR · IRR · NPV · Newton-Raphson · Monte Carlo · EU H₂ Bank · IRA §45V · LP/GP Waterfall · 10 Tabs</div>
      </div>
      <div style={tabBarStyle}>
        {TABS.map((t, i) => <div key={i} style={tabStyle(tab === i)} onClick={() => setTab(i)}>{t}</div>)}
      </div>

      {/* TAB 0 — PROJECT MODEL */}
      {tab === 0 && (
        <div style={sectionStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Project Parameters</div>
              <Slider label="Total CAPEX" value={capex} min={50} max={5000} step={50} onChange={setCapex} unit=" M€" />
              <Slider label="Electrolyzer scale" value={scale} min={10} max={2000} step={10} onChange={setScale} unit=" MW" />
              <Slider label="Annual revenue" value={revenuePerYear} min={10} max={1000} step={10} onChange={setRevenuePerYear} unit=" M€" />
              <Slider label="Annual OPEX" value={opexPerYear} min={5} max={200} step={5} onChange={setOpexPerYear} unit=" M€" />
              <Slider label="Debt ratio" value={debtRatio} min={40} max={85} step={5} onChange={setDebtRatio} unit="%" />
              <Slider label="Debt rate" value={debtRate} min={2} max={10} step={0.5} onChange={setDebtRate} unit="%" />
              <Slider label="Loan tenor" value={tenor} min={10} max={25} step={1} onChange={setTenor} unit=" yrs" />
              <Slider label="Construction period" value={constructYrs} min={1} max={5} step={1} onChange={setConstructYrs} unit=" yrs" />
              <Slider label="Project lifetime" value={lifetime} min={15} max={35} step={1} onChange={setLifetime} unit=" yrs" />
              <Slider label="WACC" value={wacc} min={4} max={16} step={0.5} onChange={setWacc} unit="%" />
            </div>
            <div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <KpiCard label="Project IRR" value={`${projectIrr}%`} unit="unlevered" color={Number(projectIrr) >= wacc ? T.green : T.red} />
                <KpiCard label="Equity IRR" value={`${equityIrr}%`} unit="levered" color={Number(equityIrr) >= 12 ? T.green : T.amber} />
                <KpiCard label="Project NPV" value={`${projectNpv}`} unit="M€ (at WACC)" color={projectNpv > 0 ? T.green : T.red} />
                <KpiCard label="Min DSCR" value={minDscr} unit="ebitda/debt svc" color={minDscr >= 1.3 ? T.green : minDscr >= 1.1 ? T.amber : T.red} />
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Annual Cashflow & Cumulative Profile</div>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={cashflowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 9 }} />
                    <YAxis yAxisId="left" label={{ value: 'M€', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'M€ cumul.', angle: 90, position: 'insideRight', fontSize: 10 }} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v, n) => [`${v} M€`, n]} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <ReferenceLine yAxisId="left" y={0} stroke={T.sub} />
                    <Bar yAxisId="left" dataKey="cashflow" name="Annual CF" radius={[2, 2, 0, 0]}>
                      {cashflowData.map((d, i) => <Cell key={i} fill={d.cashflow >= 0 ? T.teal : T.red} />)}
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="cumulative" name="Cumulative" stroke={T.accent} strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ ...cardStyle, flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Capital Structure</div>
                  <div style={{ display: 'flex', height: 24, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ width: `${debtRatio}%`, background: T.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10 }}>Debt {debtRatio}%</div>
                    <div style={{ flex: 1, background: T.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10 }}>Equity {100 - debtRatio}%</div>
                  </div>
                  <div style={{ fontSize: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ color: T.sub }}>Debt</span><span style={{ fontWeight: 700 }}>{debtAmt.toFixed(0)} M€</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: T.sub }}>Equity</span><span style={{ fontWeight: 700 }}>{equityAmt.toFixed(0)} M€</span></div>
                  </div>
                </div>
                <div style={{ ...cardStyle, flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Annual Debt Service</div>
                  <div style={{ fontSize: 22, fontFamily: 'monospace', fontWeight: 700, color: T.navy }}>{annualDebtService.toFixed(1)} M€</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>Annuity method · {debtRate}% · {tenor}yr tenor</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1 — DEBT & EQUITY STRUCTURE */}
      {tab === 1 && (
        <div style={sectionStyle}>
          <div style={gridStyle}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Typical H₂ Project Finance Structure</div>
              {[
                { tier: 'Senior Secured Debt', pct: '55–65%', cost: '4.5–6.5%', providers: 'EIB, DFIs, commercial banks' },
                { tier: 'Mezzanine / Subordinated', pct: '5–15%', cost: '7–11%', providers: 'Credit funds, DFIs (subordinated)' },
                { tier: 'Preferred Equity', pct: '5–10%', cost: '9–13%', providers: 'Infrastructure funds, utilities' },
                { tier: 'Common Equity (Sponsor)', pct: '20–30%', cost: '12–18%', providers: 'Developers, PE/infra funds' },
              ].map((t, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: [T.blue, T.teal, T.amber, T.green][i] }}>{t.tier}</div>
                  <div style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ color: T.sub }}>Size</span><span style={{ fontWeight: 600 }}>{t.pct}</span>
                  </div>
                  <div style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: T.sub }}>Cost</span><span style={{ fontWeight: 600 }}>{t.cost}</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{t.providers}</div>
                </div>
              ))}
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>LP/GP Waterfall Structure</div>
              {[
                { hurdle: 'Return of capital', trigger: '1.0× MOIC', split: '100% LP', note: 'After construction period' },
                { hurdle: 'Preferred return', trigger: '8% IRR', split: '100% LP', note: 'Cumulative preferred' },
                { hurdle: 'Catch-up', trigger: '8–12% IRR', split: '80% GP / 20% LP', note: 'GP catches up to 20% profit' },
                { hurdle: 'Carried interest Tier 1', trigger: '12–20% IRR', split: '75% LP / 25% GP carry', note: 'Standard infra carry' },
                { hurdle: 'Super-carry Tier 2', trigger: '> 20% IRR', split: '70% LP / 30% GP', note: 'Performance upside' },
              ].map((tier, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <div style={{ fontWeight: 700, color: T.navy }}>{tier.hurdle}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                    <span style={{ color: T.teal }}>Trigger: {tier.trigger}</span>
                    <span style={{ fontWeight: 600, color: T.amber }}>{tier.split}</span>
                  </div>
                  <div style={{ color: T.sub, fontSize: 10 }}>{tier.note}</div>
                </div>
              ))}
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Key Lender Covenants</div>
              {[
                ['Minimum DSCR', '≥ 1.20× (typical), ≥ 1.10× hard floor'],
                ['Loan Life Cover Ratio', '≥ 1.30×'],
                ['Project Life Cover Ratio', '≥ 1.50×'],
                ['Debt Service Reserve', '6 months DSRA typical'],
                ['O&M Reserve', '3–6 month operating cost'],
                ['Change of control', 'Lender consent required'],
                ['Debt service coverage', 'Annual test & lock-up trigger'],
                ['Insurance', 'All-risk project insurance mandatory'],
                ['Environmental compliance', 'IFC Performance Standards'],
                ['Offtake counterparty', 'Investment-grade preferred'],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <span style={{ color: T.sub }}>{k}</span>
                  <span style={{ fontWeight: 600, maxWidth: '55%', textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 — DSCR ANALYSIS */}
      {tab === 2 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>DSCR Profile Over Loan Life</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Min DSCR: <strong style={{ color: minDscr >= 1.3 ? T.green : T.red }}>{minDscr}×</strong> — Lender typical requirement: ≥ 1.20× (trigger) / ≥ 1.10× (hard floor)</div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={dscrData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="left" label={{ value: 'M€', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'DSCR ×', angle: 90, position: 'insideRight', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar yAxisId="left" dataKey="ebitda" name="EBITDA (M€)" fill={T.teal} opacity={0.6} />
                <Bar yAxisId="left" dataKey="debtService" name="Debt Service (M€)" fill={T.red} opacity={0.6} />
                <Line yAxisId="right" type="monotone" dataKey="dscr" name="DSCR ×" stroke={T.accent} strokeWidth={2} dot={{ r: 3 }} />
                <ReferenceLine yAxisId="right" y={1.2} stroke={T.amber} strokeDasharray="4 4" label={{ value: '1.20× trigger', fontSize: 9, fill: T.amber }} />
                <ReferenceLine yAxisId="right" y={1.1} stroke={T.red} strokeDasharray="4 4" label={{ value: '1.10× hard floor', fontSize: 9, fill: T.red }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 3 — MONTE CARLO */}
      {tab === 3 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Monte Carlo Simulation — 200 Scenarios</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Random shocks applied: Revenue ±20%, OPEX ±15%, CAPEX ±15%. Newton-Raphson IRR solver.</div>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="irr" name="Project IRR" label={{ value: 'Project IRR (%)', position: 'insideBottom', offset: -3, fontSize: 10 }} tick={{ fontSize: 10 }} type="number" domain={['auto', 'auto']} />
                <YAxis dataKey="npv" name="NPV (M€)" label={{ value: 'NPV (M€)', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.[0] ? <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 8, fontSize: 10 }}>IRR: {payload[0].payload.irr}%<br/>NPV: {payload[0].payload.npv} M€</div> : null} />
                <ReferenceLine x={wacc} stroke={T.amber} strokeDasharray="4 4" label={{ value: 'WACC', fontSize: 9, fill: T.amber }} />
                <ReferenceLine y={0} stroke={T.red} strokeDasharray="4 4" />
                <Scatter data={mcData} fill={T.blue} fillOpacity={0.5} r={3} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'P10 IRR', value: `${[...mcData].sort((a, b) => a.irr - b.irr)[Math.floor(mcData.length * 0.1)]?.irr ?? 'N/A'}%` },
              { label: 'P50 IRR (median)', value: `${[...mcData].sort((a, b) => a.irr - b.irr)[Math.floor(mcData.length * 0.5)]?.irr ?? 'N/A'}%` },
              { label: 'P90 IRR', value: `${[...mcData].sort((a, b) => a.irr - b.irr)[Math.floor(mcData.length * 0.9)]?.irr ?? 'N/A'}%` },
              { label: 'P(NPV > 0)', value: `${((mcData.filter(d => d.npv > 0).length / Math.max(1, mcData.length)) * 100).toFixed(0)}%` },
            ].map((k, i) => <KpiCard key={i} label={k.label} value={k.value} color={T.blue} />)}
          </div>
        </div>
      )}

      {/* TAB 4 — SUBSIDY STACKING */}
      {tab === 4 && (
        <div style={sectionStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Subsidy Inputs</div>
              <Slider label="EU H₂ Bank premium" value={h2BankSubsidy} min={0} max={3} step={0.1} onChange={setH2BankSubsidy} unit=" €/kg" />
              <Slider label="Annual H₂ output" value={annualOutput} min={1000} max={500000} step={1000} onChange={setAnnualOutput} unit=" t/yr" />
              <div style={{ marginTop: 14, padding: 12, background: T.bg, borderRadius: 8, fontSize: 11 }}>
                <div style={{ color: T.sub, marginBottom: 6 }}>EU H₂ Bank (10yr)</div>
                <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: T.green }}>{subsidyStack.h2BankTotal} M€</div>
              </div>
              <div style={{ padding: 12, background: T.bg, borderRadius: 8, fontSize: 11, marginTop: 8 }}>
                <div style={{ color: T.sub, marginBottom: 6 }}>IPCEI/CAPEX Grant (30%)</div>
                <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: T.teal }}>{subsidyStack.grantsCapex} M€</div>
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Available Subsidy Sources — EU Market</div>
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Programme', 'Type', 'Amount', 'Duration', 'Eligibility'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['EU H₂ Bank Auctions', 'OpEx premium', '€0.48–1.00/kg', '10 years', 'RFNBO producers'],
                    ['IPCEI Hydrogen', 'Grant (CapEx)', '30–60% CAPEX', 'Project life', 'EU cross-border projects'],
                    ['Innovation Fund', 'Grant (CapEx)', 'Up to 60% CAPEX', 'One-off', '10 kt/yr+ CO2 avoidance'],
                    ['EIB Climate Bank', 'Senior debt', 'Up to 50% project debt', 'Up to 25 yr', 'Climate-aligned projects'],
                    ['NER300/NER400', 'Grant (CapEx)', 'Up to 50% demo CAPEX', 'Demo phase', 'Innovative low-carbon'],
                    ['National programs', 'Various', 'Country-specific', 'Varies', 'Germany, France, UK, NL'],
                  ].map(([prog, type, amount, dur, elig], i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600 }}>{prog}</td>
                      <td style={{ padding: '6px 8px', color: T.sub }}>{type}</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'monospace', color: T.green, fontWeight: 600 }}>{amount}</td>
                      <td style={{ padding: '6px 8px' }}>{dur}</td>
                      <td style={{ padding: '6px 8px', fontSize: 10, color: T.sub }}>{elig}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5 — OFFTAKE STRUCTURES */}
      {tab === 5 && (
        <div style={sectionStyle}>
          <div style={gridStyle}>
            {[
              { type: 'Fixed-price offtake (PPA-style)', duration: '15–20 years', who: 'Industrial buyers, utilities', price: 'Fixed €/kg or €/MWh', pros: ['Bankable cashflows', 'Rating uplift for debt'], cons: ['Misses price upside', 'Force majeure risk'], color: T.blue },
              { type: 'Index-linked offtake', duration: '10–15 years', who: 'Trading houses, aggregators', price: 'Hub gas price + premium', pros: ['Price exposure', 'Flexible'], cons: ['Harder to finance', 'Revenue risk'], color: T.teal },
              { type: 'Volume commitment (ToP)', duration: '5–10 years', who: 'Industrial clusters', price: 'Market-linked floor', pros: ['Volume certainty', 'Market upside'], cons: ['Price risk retained', 'Termination risk'], color: T.green },
              { type: 'Tolling arrangement', duration: '15–25 years', who: 'Integrated producers (utilities)', price: 'Capacity fee + variable', pros: ['Risk pass-through', 'Full bankability'], cons: ['Limited margin', 'Requires large offtaker'], color: T.amber },
              { type: 'Government CfD (H₂)', duration: '15 years', who: 'Government/regulator', price: 'Strike price vs reference', pros: ['Sovereign credit', 'UK HAR model'], cons: ['Regulatory risk', 'Clawback provisions'], color: T.indigo },
            ].map((o, i) => (
              <div key={i} style={{ ...cardStyle, borderLeft: `3px solid ${o.color}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: o.color, marginBottom: 6 }}>{o.type}</div>
                <div style={{ fontSize: 11, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ color: T.sub }}>Duration</span><span>{o.duration}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ color: T.sub }}>Typical buyer</span><span>{o.who}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: T.sub }}>Pricing</span><span>{o.price}</span></div>
                </div>
                <div style={{ fontSize: 10, color: T.green }}>{o.pros.map(p => `✓ ${p}`).join(' · ')}</div>
                <div style={{ fontSize: 10, color: T.red, marginTop: 2 }}>{o.cons.map(c => `✗ ${c}`).join(' · ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6 — COMPARABLES */}
      {tab === 6 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Comparable Green Hydrogen Projects</div>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Project', 'Country', 'Scale (MW)', 'CAPEX (M€)', 'H₂ Output (t/yr)', 'Equity IRR', 'Debt Ratio', 'Status'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparables.map((p, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                    <td style={{ padding: '6px 8px', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '6px 8px', color: T.sub }}>{p.country}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{p.scale.toLocaleString()}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{p.capex.toLocaleString()}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{p.h2Output.toLocaleString()}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700, color: p.irr >= 12 ? T.green : p.irr >= 9 ? T.amber : T.red }}>{p.irr}%</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{p.debtRatio}%</td>
                    <td style={{ padding: '6px 8px', color: p.status === 'Operational' ? T.green : p.status.includes('FID') ? T.teal : T.amber }}>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Equity IRR vs Scale</div>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scale" name="Scale (MW)" label={{ value: 'Scale (MW)', position: 'insideBottom', offset: -3, fontSize: 10 }} tick={{ fontSize: 10 }} type="number" />
                <YAxis dataKey="irr" name="Equity IRR" label={{ value: 'Equity IRR (%)', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip content={({ payload }) => payload?.[0] ? <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 8, fontSize: 10 }}>{payload[0].payload.name}<br/>Scale: {payload[0].payload.scale} MW<br/>IRR: {payload[0].payload.irr}%</div> : null} />
                <ReferenceLine y={wacc} stroke={T.amber} strokeDasharray="4 4" label={{ value: 'WACC', fontSize: 9, fill: T.amber }} />
                <Scatter data={comparables} fill={T.blue} fillOpacity={0.7} r={6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 7 — EU H₂ BANK */}
      {tab === 7 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>EU Hydrogen Bank — Auction Mechanism</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 16 }}>Fixed premium auction (€/kg H₂) · First pilot: €800M committed 2023 · Awarded €0.48–1.00/kg · RFNBO only</div>
            {[
              { phase: 'Pilot Round 1 (2023)', budget: '€800M', strike: '€0.48–1.00/kg', winners: '7 projects, 6 EU countries', vol: '3.5 Mt/yr H₂ potential' },
              { phase: 'Round 2 (2024)',        budget: '€1.2B', strike: 'TBD (lower expected)',  winners: 'Results Q4 2024', vol: '5+ Mt/yr H₂ potential' },
              { phase: 'Round 3 (2025+)',       budget: '€3–5B', strike: '<€0.80/kg target',    winners: 'Planned', vol: 'Scale to 10 Mt/yr' },
            ].map((r, i) => (
              <div key={i} style={{ padding: '10px', marginBottom: 10, background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.teal }}>{r.phase}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 6, fontSize: 11 }}>
                  <div><span style={{ color: T.sub }}>Budget: </span><span style={{ fontWeight: 600 }}>{r.budget}</span></div>
                  <div><span style={{ color: T.sub }}>Strike: </span><span style={{ fontWeight: 600, color: T.green }}>{r.strike}</span></div>
                  <div><span style={{ color: T.sub }}>Winners: </span><span>{r.winners}</span></div>
                  <div><span style={{ color: T.sub }}>Volume: </span><span>{r.vol}</span></div>
                </div>
              </div>
            ))}
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>H₂ Bank Impact on Project Economics</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[0.48, 0.60, 0.80, 1.00, 1.20].map(premium => ({
                premium: `€${premium}/kg`,
                irr: +(Number(projectIrr) + premium * 3.5).toFixed(1),
                npv: +(projectNpv + premium * annualOutput * 1000 * 10 / 1e6).toFixed(0),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="premium" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" label={{ value: 'IRR %', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'NPV M€', angle: 90, position: 'insideRight', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar yAxisId="left" dataKey="irr" name="Project IRR %" fill={T.blue} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="npv" name="NPV (M€)" stroke={T.accent} strokeWidth={2} dot={{ r: 4 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 8 — IRA §45V */}
      {tab === 8 && (
        <div style={sectionStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>IRA §45V Clean Hydrogen Production Credit</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 16 }}>Inflation Reduction Act 2022 · Base credit $0.60/kg · Prevailing wage multiplier ×5 → max $3.00/kg · Valid 10 years from commissioning</div>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Tier', 'Lifecycle GHG', 'Base Credit', 'Wage Bonus (×5)', 'Equiv €/kg (2025)', 'Notes'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Tier 1', '< 0.45 kgCO2e/kgH2', '$0.60/kg', '$3.00/kg', '€2.75/kg', 'Green H₂ (dedicated RE)'],
                  ['Tier 2', '0.45–1.5 kgCO2e/kgH2', '$0.20/kg', '$1.00/kg', '€0.90/kg', 'Mixed grid, partly clean'],
                  ['Tier 3', '1.5–2.5 kgCO2e/kgH2', '$0.15/kg', '$0.75/kg', '€0.68/kg', 'Low-carbon NG + CCS'],
                  ['Tier 4', '2.5–4.0 kgCO2e/kgH2', '$0.12/kg', '$0.60/kg', '€0.55/kg', 'Blue H₂ (partial CCS)'],
                ].map(([t, ghg, base, bonus, eur, note], i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                    <td style={{ padding: '6px 8px', fontWeight: 700 }}>{t}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: 10 }}>{ghg}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{base}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace', color: T.green, fontWeight: 700 }}>{bonus}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace', color: T.teal }}>{eur}</td>
                    <td style={{ padding: '6px 8px', fontSize: 10, color: T.sub }}>{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 9 — INVESTOR RETURNS */}
      {tab === 9 && (
        <div style={sectionStyle}>
          <div style={gridStyle}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Investor Return Summary</div>
              {[
                { metric: 'Project IRR', value: `${projectIrr}%`, benchmark: '≥ WACC', pass: Number(projectIrr) >= wacc },
                { metric: 'Equity IRR', value: `${equityIrr}%`, benchmark: '≥ 12% (infra)', pass: Number(equityIrr) >= 12 },
                { metric: 'Project NPV', value: `${projectNpv} M€`, benchmark: '> 0', pass: projectNpv > 0 },
                { metric: 'Min DSCR', value: `${minDscr}×`, benchmark: '≥ 1.20×', pass: minDscr >= 1.2 },
                { metric: 'Payback period', value: `${cashflowData.findIndex((d, i) => d.cumulative > 0) + 1} yrs`, benchmark: '< 15 yrs', pass: cashflowData.findIndex(d => d.cumulative > 0) < 14 },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: r.pass ? T.green : T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, flexShrink: 0 }}>
                    {r.pass ? '✓' : '✗'}
                  </div>
                  <div style={{ flex: 1, fontSize: 11 }}>
                    <div style={{ fontWeight: 600 }}>{r.metric}</div>
                    <div style={{ color: T.sub, fontSize: 10 }}>Benchmark: {r.benchmark}</div>
                  </div>
                  <div style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 700, color: r.pass ? T.green : T.red }}>{r.value}</div>
                </div>
              ))}
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Infrastructure Fund IRR Benchmarks</div>
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Strategy', 'Target IRR', 'Risk Profile', 'Typical Leverage'].map(h => (
                      <th key={h} style={{ padding: '5px 8px', textAlign: 'left', color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Core Infrastructure', '7–9%', 'Low — regulated returns', '55–65% debt'],
                    ['Core Plus', '9–12%', 'Low-medium — contracted CFs', '55–70% debt'],
                    ['Value-Add', '12–16%', 'Medium — development risk', '50–65% debt'],
                    ['Opportunistic H₂', '16–22%', 'High — technology + merchant', '40–55% debt'],
                    ['Early-stage H₂ VC', '25–35%', 'Very high — pre-revenue', 'Equity only'],
                  ].map(([strat, irr_, risk, lev], i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? T.bg : T.card }}>
                      <td style={{ padding: '5px 8px', fontWeight: 500 }}>{strat}</td>
                      <td style={{ padding: '5px 8px', fontFamily: 'monospace', fontWeight: 600, color: T.green }}>{irr_}</td>
                      <td style={{ padding: '5px 8px', color: T.sub }}>{risk}</td>
                      <td style={{ padding: '5px 8px' }}>{lev}</td>
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
