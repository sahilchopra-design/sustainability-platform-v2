import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ComposedChart, ScatterChart, Scatter } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E', sub: '#6B7280', indigo: '#4F46E5', green: '#065F46', red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', sky: '#0369A1' };

const TABS = ['Deal Overview', 'Financial Model', 'DSCR & Debt', 'Returns Engine', 'Blended Finance', 'Risk Register'];

function calcIRR(cf) {
  if (!cf || cf.length < 2) return 0;
  let r = 0.10;
  for (let i = 0; i < 200; i++) {
    const npv = cf.reduce((s, c, t) => s + c / Math.pow(1 + r, t), 0);
    const dnpv = cf.reduce((s, c, t) => s - t * c / Math.pow(1 + r, t + 1), 0);
    if (Math.abs(dnpv) < 1e-10) break;
    const nr = r - npv / dnpv;
    if (Math.abs(nr - r) < 1e-8) { r = nr; break; }
    r = isFinite(nr) ? nr : r;
  }
  return isFinite(r) ? r : 0;
}

const DEALS = Array.from({ length: 20 }, (_, i) => {
  const pathway = ['HEFA', 'AtJ', 'FT-MSW', 'PtL'][Math.floor(sr(i * 7 + 1) * 4)];
  const capMt = parseFloat((0.1 + sr(i * 11 + 2) * 0.9).toFixed(2));
  const capex = parseFloat((capMt * (320 + sr(i * 13 + 3) * 400)).toFixed(0));
  const debtPct = parseFloat((55 + sr(i * 17 + 4) * 20).toFixed(0));
  const irr = parseFloat((8 + sr(i * 19 + 5) * 12).toFixed(1));
  const dscr = parseFloat((1.20 + sr(i * 23 + 6) * 0.80).toFixed(2));
  const country = ['USA', 'EU', 'UK', 'Australia', 'Singapore', 'Norway', 'UAE'][Math.floor(sr(i * 29 + 7) * 7)];
  const status = ['Closed', 'Mandate', 'Diligence', 'Pipeline'][Math.floor(sr(i * 31 + 8) * 4)];
  const tenor = 15 + Math.floor(sr(i * 37 + 9) * 10);
  const iraCredit = country === 'USA' ? parseFloat((capMt * 1.45 * 264).toFixed(0)) : 0;
  return { id: i + 1, name: `${country}-SAF-PF${i + 1}`, pathway, capMt, capex, debtPct, irr, dscr, country, status, tenor, iraCredit };
});

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: '1 1 150px' }}>
    <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Pill = ({ v }) => {
  const c = { Closed: T.green, Mandate: T.sky, Diligence: T.amber, Pipeline: T.sub }[v] || T.sub;
  return <span style={{ background: c, color: '#fff', fontSize: 10, borderRadius: 12, padding: '2px 8px', fontWeight: 600 }}>{v}</span>;
};

export default function SafProjectFinancePage() {
  const [tab, setTab] = useState(0);
  const [selStatus, setSelStatus] = useState('ALL');
  const [wacc, setWacc] = useState(8.5);
  const [debtRate, setDebtRate] = useState(6.0);
  const [capexInput, setCapexInput] = useState(280);
  const [capMtInput, setCapMtInput] = useState(0.3);
  const [lcoValue, setLcoValue] = useState(2.20);

  const filtered = useMemo(() => DEALS.filter(d => selStatus === 'ALL' || d.status === selStatus), [selStatus]);

  const avgDscr = useMemo(() => filtered.length ? (filtered.reduce((s, d) => s + d.dscr, 0) / filtered.length).toFixed(2) : '—', [filtered]);
  const avgIrr = useMemo(() => filtered.length ? (filtered.reduce((s, d) => s + d.irr, 0) / filtered.length).toFixed(1) : '—', [filtered]);
  const totalCapex = useMemo(() => filtered.reduce((s, d) => s + d.capex, 0), [filtered]);

  const annualRevenue = useMemo(() => capMtInput * 1e6 * lcoValue * 264 / 1e6, [capMtInput, lcoValue]);
  const annualOpex = useMemo(() => capexInput * 0.035, [capexInput]);
  const annualDebtService = useMemo(() => {
    const debt = capexInput * 0.65;
    const r = debtRate / 100;
    const n = 18;
    const factor = Math.pow(1 + r, n);
    return factor > 1 ? debt * r * factor / (factor - 1) : debt / n;
  }, [capexInput, debtRate]);
  const dscr = useMemo(() => annualDebtService > 0 ? (annualRevenue - annualOpex) / annualDebtService : 0, [annualRevenue, annualOpex, annualDebtService]);
  const equityCF = useMemo(() => annualRevenue - annualOpex - annualDebtService, [annualRevenue, annualOpex, annualDebtService]);
  const equityAmount = useMemo(() => capexInput * 0.35, [capexInput]);
  const irr = useMemo(() => {
    const cfs = [-equityAmount, ...Array.from({ length: 20 }, () => equityCF)];
    return calcIRR(cfs) * 100;
  }, [equityAmount, equityCF]);

  const cashflowData = useMemo(() => Array.from({ length: 20 }, (_, yr) => ({
    year: `Y${yr + 1}`,
    revenue: parseFloat(annualRevenue.toFixed(1)),
    opex: -parseFloat(annualOpex.toFixed(1)),
    debt: -parseFloat(annualDebtService.toFixed(1)),
    equity: parseFloat(equityCF.toFixed(1)),
  })), [annualRevenue, annualOpex, annualDebtService, equityCF]);

  const dscrProfile = useMemo(() => Array.from({ length: 20 }, (_, yr) => ({
    year: `Y${yr + 1}`,
    dscr: parseFloat((dscr * (1 + yr * 0.012)).toFixed(2)),
  })), [dscr]);

  const riskData = [
    { risk: 'Feedstock Price', prob: 78, impact: 85, category: 'Market' },
    { risk: 'Offtake Counterparty', prob: 35, impact: 90, category: 'Credit' },
    { risk: 'Certification / CORSIA', prob: 42, impact: 70, category: 'Regulatory' },
    { risk: 'Technology (AtJ/PtL)', prob: 55, impact: 80, category: 'Technology' },
    { risk: 'Interest Rate', prob: 60, impact: 50, category: 'Financial' },
    { risk: 'Policy (IRA repeal)', prob: 25, impact: 95, category: 'Political' },
    { risk: 'Construction Delay', prob: 45, impact: 65, category: 'Construction' },
    { risk: 'CO₂ Price', prob: 50, impact: 40, category: 'Market' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text }}>
      <div style={{ background: '#0C1A2E', padding: '20px 32px', borderBottom: `3px solid ${T.sky}` }}>
        <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>EP-EF2 · SAF Finance Suite</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#F1F5F9' }}>SAF Project Finance & Investment</div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>DSCR · IRR · NPV · IRA §40B · Blended Finance · 20 Deals · Monte Carlo</div>
      </div>
      <div style={{ background: '#0C1A2E', display: 'flex', gap: 0, padding: '0 32px', borderBottom: `1px solid #1E3A5F` }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '12px 18px', fontSize: 12, fontWeight: tab === i ? 700 : 400, color: tab === i ? T.sky : '#94A3B8', background: 'none', border: 'none', borderBottom: tab === i ? `2px solid ${T.sky}` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </div>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <KpiCard label="Deals in Pipeline" value={filtered.length} sub={`$${(totalCapex / 1000).toFixed(1)}B total CAPEX`} color={T.sky} />
          <KpiCard label="Avg Project IRR" value={`${avgIrr}%`} sub="Unlevered equity" color={T.green} />
          <KpiCard label="Avg DSCR" value={avgDscr} sub="Minimum cover ratio" color={dscr >= 1.30 ? T.green : dscr >= 1.10 ? T.amber : T.red} />
          <KpiCard label="Model DSCR" value={dscr.toFixed(2)} sub={`$${capMtInput}Mt/yr capacity`} color={dscr >= 1.30 ? T.green : T.amber} />
          <KpiCard label="Model IRR" value={`${irr.toFixed(1)}%`} sub="Equity levered" color={irr >= 12 ? T.green : T.amber} />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <select value={selStatus} onChange={e => setSelStatus(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, background: T.card, color: T.text }}>
            {['ALL', 'Closed', 'Mandate', 'Diligence', 'Pipeline'].map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}><span>CAPEX ($M): {capexInput}</span><input type="range" min={100} max={800} value={capexInput} onChange={e => setCapexInput(+e.target.value)} style={{ width: 100 }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}><span>Capacity (Mt): {capMtInput}</span><input type="range" min={0.05} max={1.0} step={0.05} value={capMtInput} onChange={e => setCapMtInput(+e.target.value)} style={{ width: 100 }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}><span>SAF Price ($/L): {lcoValue}</span><input type="range" min={1.0} max={6.0} step={0.1} value={lcoValue} onChange={e => setLcoValue(+e.target.value)} style={{ width: 100 }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}><span>Debt Rate: {debtRate}%</span><input type="range" min={3} max={12} step={0.5} value={debtRate} onChange={e => setDebtRate(+e.target.value)} style={{ width: 100 }} /></div>
        </div>

        {tab === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Deal Pipeline by Status</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={['Closed', 'Mandate', 'Diligence', 'Pipeline'].map(s => ({ status: s, count: DEALS.filter(d => d.status === s).length, capex: DEALS.filter(d => d.status === s).reduce((a, d) => a + d.capex, 0) / 1000 }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="$B" />
                    <Tooltip />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="l" dataKey="count" name="# Deals" fill={T.sky} />
                    <Bar yAxisId="r" dataKey="capex" name="CAPEX $B" fill={T.amber} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>IRR Distribution by Pathway</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={['HEFA', 'AtJ', 'FT-MSW', 'PtL'].map(pw => ({ pathway: pw, avgIrr: DEALS.filter(d => d.pathway === pw).length ? (DEALS.filter(d => d.pathway === pw).reduce((a, d) => a + d.irr, 0) / DEALS.filter(d => d.pathway === pw).length).toFixed(1) : 0 }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="pathway" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip formatter={v => [`${v}%`, 'Avg IRR']} />
                    <Bar dataKey="avgIrr" fill={T.green} radius={[4, 4, 0, 0]} />
                    <ReferenceLine y={12} stroke={T.amber} strokeDasharray="4 2" label={{ value: 'Hurdle 12%', fontSize: 10 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Deal Table</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ background: '#F8F7F4' }}>
                    {['Deal', 'Pathway', 'Country', 'Cap (Mt)', 'CAPEX ($M)', 'Debt %', 'IRR %', 'DSCR', 'Tenor', 'IRA Credit ($K)', 'Status'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {filtered.slice(0, 12).map((d, i) => (
                      <tr key={d.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 ? '#FAFAF7' : T.card }}>
                        <td style={{ padding: '8px 12px', fontWeight: 500 }}>{d.name}</td>
                        <td style={{ padding: '8px 12px', color: T.sub }}>{d.pathway}</td>
                        <td style={{ padding: '8px 12px' }}>{d.country}</td>
                        <td style={{ padding: '8px 12px' }}>{d.capMt}</td>
                        <td style={{ padding: '8px 12px' }}>${d.capex}M</td>
                        <td style={{ padding: '8px 12px' }}>{d.debtPct}%</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: d.irr >= 12 ? T.green : T.amber }}>{d.irr}%</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: d.dscr >= 1.30 ? T.green : d.dscr >= 1.10 ? T.amber : T.red }}>{d.dscr}</td>
                        <td style={{ padding: '8px 12px' }}>{d.tenor}yr</td>
                        <td style={{ padding: '8px 12px', color: T.green }}>{d.iraCredit > 0 ? `$${d.iraCredit}K` : '—'}</td>
                        <td style={{ padding: '8px 12px' }}><Pill v={d.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Annual Cashflow Waterfall ($M)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cashflowData.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="$M" />
                  <Tooltip formatter={v => [`$${v}M`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="revenue" name="Revenue" fill={T.sky} stackId="a" />
                  <Bar dataKey="opex" name="Opex" fill={T.amber} stackId="a" />
                  <Bar dataKey="debt" name="Debt Service" fill={T.red} stackId="a" />
                  <Bar dataKey="equity" name="Equity CF" fill={T.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Financial Model Summary</div>
              {[
                ['CAPEX', `$${capexInput}M`],
                ['Capacity', `${capMtInput} Mt/yr`],
                ['Annual Revenue', `$${annualRevenue.toFixed(1)}M`],
                ['Annual Opex', `$${annualOpex.toFixed(1)}M`],
                ['Debt Service (annual)', `$${annualDebtService.toFixed(1)}M`],
                ['EBITDA Margin', `${((annualRevenue - annualOpex) / (annualRevenue || 1) * 100).toFixed(0)}%`],
                ['DSCR', dscr.toFixed(2)],
                ['Equity IRR', `${irr.toFixed(1)}%`],
                ['Equity Amount', `$${equityAmount.toFixed(1)}M`],
                ['Annual Equity CF', `$${equityCF.toFixed(1)}M`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                  <span style={{ color: T.sub }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>DSCR Profile Over Loan Life</div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={dscrProfile}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0.8, 2.5]} />
                  <Tooltip formatter={v => [v.toFixed(2), 'DSCR']} />
                  <Area type="monotone" dataKey="dscr" stroke={T.sky} fill={T.sky} fillOpacity={0.15} strokeWidth={2} />
                  <ReferenceLine y={1.30} stroke={T.green} strokeDasharray="4 2" label={{ value: 'Bank Floor 1.30x', fontSize: 10 }} />
                  <ReferenceLine y={1.10} stroke={T.red} strokeDasharray="4 2" label={{ value: 'Default Trigger 1.10x', fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Debt Sizing Parameters</div>
              {[['Debt Amount', `$${(capexInput * 0.65).toFixed(0)}M (65% gearing)`], ['Tenor', '18 years'], ['Interest Rate', `${debtRate}%`], ['DSCR Floor', '1.30x'], ['LLCR', '≥1.50x'], ['Debt Service Reserve', '6-month DSRA'], ['Lenders', 'Export Credit + Green Bond'], ['Collateral', 'Offtake + Feedstock Contracts']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                  <span style={{ color: T.sub }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>IRR Sensitivity to SAF Price</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={[1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0].map(p => {
                  const rev = capMtInput * 1e6 * p * 264 / 1e6;
                  const cf = [-capexInput * 0.35, ...Array.from({ length: 20 }, () => rev - annualOpex - annualDebtService)];
                  return { price: p, irr: parseFloat((calcIRR(cf) * 100).toFixed(1)) };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="price" tick={{ fontSize: 11 }} unit="$/L" />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={v => [`${v}%`, 'Equity IRR']} />
                  <Line dataKey="irr" stroke={T.green} strokeWidth={2} dot={false} />
                  <ReferenceLine y={12} stroke={T.amber} strokeDasharray="4 2" label={{ value: 'Hurdle 12%', fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>IRR at Various Debt Levels</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={[40, 50, 60, 65, 70, 75, 80].map(d => {
                  const debtAmt = capexInput * d / 100;
                  const r = debtRate / 100; const n = 18; const fac = Math.pow(1 + r, n);
                  const ds = fac > 1 ? debtAmt * r * fac / (fac - 1) : debtAmt / n;
                  const ecf = annualRevenue - annualOpex - ds;
                  const eqAmt = capexInput * (1 - d / 100);
                  const cfs = [-eqAmt, ...Array.from({ length: 20 }, () => ecf)];
                  return { debtPct: d, irr: parseFloat((calcIRR(cfs) * 100).toFixed(1)) };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="debtPct" tick={{ fontSize: 11 }} unit="%" />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={v => [`${v}%`, 'Equity IRR']} />
                  <Line dataKey="irr" stroke={T.sky} strokeWidth={2} dot={false} />
                  <ReferenceLine y={12} stroke={T.amber} strokeDasharray="4 2" label={{ value: 'Hurdle', fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Blended Finance Structure</div>
              {[['Senior Debt (Export Credit/DFI)', '40–50%', T.sky], ['Green Bond / Sustainability-Linked Loan', '15–25%', T.green], ['Tax Equity (IRA §40B)', '10–15%', T.teal], ['Equity (Sponsor)', '20–30%', T.indigo], ['Concessional / Grant', '0–5%', T.amber]].map(([t, pct, color]) => (
                <div key={t} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span>{t}</span><span style={{ fontWeight: 600, color }}>{pct}</span>
                  </div>
                  <div style={{ background: T.border, borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: pct.split('–')[0] + '%', background: color, height: '100%', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>DFI / MDB Financing Programs</div>
              {[{ inst: 'US Export-Import Bank', ticket: '$200–500M', focus: 'US-manufactured equip.', rate: 'SOFR + 150bps' }, { inst: 'IFC / World Bank', ticket: '$50–200M', focus: 'Emerging markets SAF', rate: 'LIBOR + 200bps' }, { inst: 'EU EIB / InvestEU', ticket: '€100–400M', focus: 'EU-based projects', rate: 'EURIBOR + 100bps' }, { inst: 'UKEF', ticket: '£50–200M', focus: 'UK airlines / UK build', rate: 'SONIA + 175bps' }, { inst: 'JBIC / NEXI', ticket: '¥5–50B', focus: 'Japan GIF projects', rate: 'TONAR + 120bps' }].map(f => (
                <div key={f.inst} style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{f.inst}</div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 11, color: T.sub, marginTop: 3 }}>
                    <span style={{ color: T.green, fontWeight: 600 }}>{f.ticket}</span>
                    <span>{f.focus}</span>
                    <span>{f.rate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Risk Heat Map (Probability × Impact)</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="prob" name="Probability" unit="%" tick={{ fontSize: 11 }} label={{ value: 'Probability (%)', position: 'insideBottom', offset: -8, fontSize: 11 }} />
                  <YAxis dataKey="impact" name="Impact" unit="%" tick={{ fontSize: 11 }} label={{ value: 'Impact (%)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload && payload[0] ? <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 11 }}><strong>{payload[0].payload.risk}</strong><br />{payload[0].payload.category}</div> : null} />
                  <Scatter data={riskData} fill={T.red} fillOpacity={0.7} />
                  <ReferenceLine x={50} stroke={T.amber} strokeDasharray="3 3" />
                  <ReferenceLine y={70} stroke={T.amber} strokeDasharray="3 3" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Risk Register</div>
              {[...riskData].sort((a, b) => (b.prob * b.impact) - (a.prob * a.impact)).map(r => (
                <div key={r.risk} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{r.risk}</span>
                    <span style={{ fontSize: 11, color: T.sub }}>{r.category}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                    <span>Prob: <strong style={{ color: r.prob > 60 ? T.red : T.amber }}>{r.prob}%</strong></span>
                    <span>Impact: <strong style={{ color: r.impact > 75 ? T.red : T.amber }}>{r.impact}%</strong></span>
                    <span>Score: <strong style={{ color: (r.prob * r.impact) > 4000 ? T.red : T.amber }}>{Math.round(r.prob * r.impact / 100)}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
