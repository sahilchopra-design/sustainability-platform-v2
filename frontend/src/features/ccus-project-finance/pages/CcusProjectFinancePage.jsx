import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// EP-CCUS-PF — CCUS Project Finance: DSCR Debt Sizing & Equity IRR
// Methodology: conventional infrastructure project-finance cash-flow waterfall (bank CCUS credit
// models / IEA-GCCSI project economics), revenue driven by 45Q/CfD/ETS incentives and CO2 offtake,
// with debt sculpted to a DSCR covenant. See docs/module_atlas/deep/ccus-project-finance.md §8.

const T = { bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E', sub: '#6B7280', indigo: '#4F46E5', green: '#065F46', red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', sky: '#0369A1', ccs: '#334155' };

// Hand-authored candidate CCUS financings. CapEx/OpEx/incentive figures are illustrative
// order-of-magnitude reference values consistent with published IEA/GCCSI/NETL CCUS project
// economics, not live lender term sheets.
const DEALS = [
  { id: 'cement-hub',   name: 'Cement Kiln Capture Hub',       sector: 'Cement',       co2Mtpa: 0.9, capexM: 180,  opexM: 12, energyPenaltyM: 8,  incentiveType: '45Q',  incentivePrice: 85, offtakePrice: 0,  tsTariff: 18, tenorYrs: 15, costOfDebt: 0.065, dscrTarget: 1.35 },
  { id: 'steel-bfbof',  name: 'BF-BOF Steel Capture',          sector: 'Steel',        co2Mtpa: 1.5, capexM: 220,  opexM: 15, energyPenaltyM: 9,  incentiveType: '45Q',  incentivePrice: 85, offtakePrice: 0,  tsTariff: 16, tenorYrs: 15, costOfDebt: 0.065, dscrTarget: 1.35 },
  { id: 'ammonia',      name: 'Ammonia Off-Gas Capture',       sector: 'Chemicals',    co2Mtpa: 0.4, capexM: 40,   opexM: 3,  energyPenaltyM: 1,  incentiveType: '45Q',  incentivePrice: 85, offtakePrice: 15, tsTariff: 12, tenorYrs: 12, costOfDebt: 0.060, dscrTarget: 1.30 },
  { id: 'ethanol',      name: 'Ethanol Fermentation Capture',  sector: 'Bio-Chemicals', co2Mtpa: 0.3, capexM: 25,  opexM: 2,  energyPenaltyM: 0.5, incentiveType: '45Q', incentivePrice: 85, offtakePrice: 12, tsTariff: 11, tenorYrs: 12, costOfDebt: 0.060, dscrTarget: 1.30 },
  { id: 'gasproc',      name: 'Gas Processing Capture',        sector: 'Oil & Gas',    co2Mtpa: 0.5, capexM: 60,   opexM: 5,  energyPenaltyM: 2,  incentiveType: '45Q',  incentivePrice: 85, offtakePrice: 20, tsTariff: 10, tenorYrs: 15, costOfDebt: 0.065, dscrTarget: 1.35 },
  { id: 'uk-gaspower',  name: 'UK Gas Power CCS (Teesside-like)', sector: 'Power',      co2Mtpa: 4.0, capexM: 3800, opexM: 90, energyPenaltyM: 55, incentiveType: 'CfD', incentivePrice: 70, offtakePrice: 0,  tsTariff: 18, tenorYrs: 25, costOfDebt: 0.070, dscrTarget: 1.45 },
  { id: 'nl-industrial', name: 'NL Industrial Cluster (Porthos-like)', sector: 'Industrial Hub', co2Mtpa: 2.5, capexM: 1500, opexM: 35, energyPenaltyM: 10, incentiveType: 'CfD', incentivePrice: 65, offtakePrice: 0, tsTariff: 19, tenorYrs: 20, costOfDebt: 0.065, dscrTarget: 1.40 },
  { id: 'no-hub',       name: 'Norway T&S Hub (Northern Lights-like)', sector: 'T&S Hub', co2Mtpa: 1.5, capexM: 1100, opexM: 30, energyPenaltyM: 5, incentiveType: 'CfD', incentivePrice: 60, offtakePrice: 0, tsTariff: 20, tenorYrs: 25, costOfDebt: 0.060, dscrTarget: 1.40 },
];

// PV of a level annuity: A * (1 - (1+i)^-n) / i
function annuityPV(annualPayment, rate, years) {
  if (rate <= 0) return annualPayment * years;
  return annualPayment * (1 - Math.pow(1 + rate, -years)) / rate;
}

// IRR via bisection on NPV(r) = -equity0 + Σ CF(t)/(1+r)^t
function solveIrr(cashflows, lo = -0.5, hi = 1.5, iters = 60) {
  const npv = rate => cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + rate, t), 0);
  let a = lo, b = hi, fa = npv(a), fb = npv(b);
  if (fa * fb > 0) return NaN; // no sign change in bracket — non-convergent case
  for (let i = 0; i < iters; i++) {
    const m = (a + b) / 2, fm = npv(m);
    if (Math.abs(fm) < 1e-6) return m;
    if (fa * fm < 0) { b = m; fb = fm; } else { a = m; fa = fm; }
  }
  return (a + b) / 2;
}

// Revenue(t) = CO2_captured(t)*(45Q/CfD/ETS + offtake − T&S tariff)
// EBITDA(t)  = Revenue(t) − OpEx(t) − energy_penalty_cost(t)
// CFADS(t)   = EBITDA(t)*(1 − tax)                       [ΔWC and depreciation shield ignored — see note]
// Debt sizing: max D s.t. min DSCR(t) ≥ DSCR_target, sculpted as a level annuity at cost of debt
// Equity IRR: root r of Σ equity_CF(t)/(1+r)^t = 0
function computeProjectFinance(deal, { taxRate }) {
  const co2Tpa = deal.co2Mtpa * 1e6;
  const revenuePerT = deal.incentivePrice + deal.offtakePrice - deal.tsTariff;
  const revenue = co2Tpa * revenuePerT;
  const ebitda = revenue - deal.opexM * 1e6 - deal.energyPenaltyM * 1e6;
  const cfads = ebitda * (1 - taxRate);
  const maxAnnualDebtService = cfads > 0 ? cfads / deal.dscrTarget : 0;
  const debtCapacityM = annuityPV(maxAnnualDebtService, deal.costOfDebt, deal.tenorYrs) / 1e6;
  const capexM = deal.capexM;
  const equityM = Math.max(0, capexM - debtCapacityM);
  const gearing = capexM > 0 ? debtCapacityM / capexM : 0;
  const equityResidualM = (cfads - maxAnnualDebtService) / 1e6;
  const cashflowsM = [-equityM, ...Array.from({ length: deal.tenorYrs }, () => equityResidualM)];
  const irr = equityM > 0 ? solveIrr(cashflowsM) : NaN;
  const dscr = maxAnnualDebtService > 0 ? cfads / maxAnnualDebtService : 0;
  return { co2Tpa, revenue, ebitda, cfads, maxAnnualDebtService, debtCapacityM, equityM, gearing, dscr, irr, equityResidualM };
}

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: '1 1 180px' }}>
    <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function CcusProjectFinancePage() {
  const [taxRate, setTaxRate] = useState(0.21);
  const [costOfDebtBump, setCostOfDebtBump] = useState(0);
  const [selectedId, setSelectedId] = useState('cement-hub');

  const rows = useMemo(() => DEALS.map(deal => {
    const adjDeal = { ...deal, costOfDebt: deal.costOfDebt + costOfDebtBump };
    return { ...deal, ...computeProjectFinance(adjDeal, { taxRate }) };
  }), [taxRate, costOfDebtBump]);

  const totalCapexB = rows.reduce((s, d) => s + d.capexM, 0) / 1000;
  const avgGearing = rows.length ? rows.reduce((s, d) => s + d.gearing, 0) / rows.length : 0;
  const bankableRows = rows.filter(d => Number.isFinite(d.irr));
  const avgIrr = bankableRows.length ? bankableRows.reduce((s, d) => s + d.irr, 0) / bankableRows.length : 0;
  const bankableCount = rows.filter(d => Number.isFinite(d.irr) && d.irr >= 0.08).length;

  const selected = rows.find(x => x.id === selectedId) || rows[0];
  const cashflowChart = selected ? Array.from({ length: selected.tenorYrs }, (_, i) => ({
    year: i + 1,
    CFADS: Math.round(selected.cfads / 1e6),
    DebtService: Math.round(selected.maxAnnualDebtService / 1e6),
    EquityResidual: Math.round(selected.equityResidualM),
  })) : [];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text }}>
      <div style={{ background: '#0C1A2E', padding: '20px 32px', borderBottom: `3px solid ${T.ccs}` }}>
        <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>CCUS Market & Storage Infrastructure Suite</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#F1F5F9' }}>CCUS Project Finance — DSCR Debt Sizing &amp; Equity IRR</div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>8 candidate financings · Cement / Steel / Chemicals / Power / T&amp;S hubs · DSCR-sculpted debt waterfall</div>
      </div>

      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <KpiCard label="Total Pipeline CapEx" value={`$${totalCapexB.toFixed(1)}B`} sub="8 candidate financings" color={T.ccs} />
          <KpiCard label="Avg Debt Capacity (Gearing)" value={`${(avgGearing * 100).toFixed(0)}%`} sub="Of CapEx, DSCR-sculpted" color={T.indigo} />
          <KpiCard label="Avg Equity IRR" value={bankableRows.length ? `${(avgIrr * 100).toFixed(1)}%` : '—'} sub="Across bankable deals" color={T.green} />
          <KpiCard label="Bankable Deals (IRR ≥ 8%)" value={`${bankableCount} / ${rows.length}`} sub="Hurdle rate screen" color={T.amber} />
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, width: '100%', marginBottom: 4 }}>Model Inputs — Debt sized to CFADS/DSCR_target; Equity IRR from residual cash flow</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}>Tax rate: {(taxRate * 100).toFixed(0)}%<input type="range" min={0} max={35} value={taxRate * 100} onChange={e => setTaxRate(+e.target.value / 100)} style={{ width: 100 }} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}>Cost of debt bump: +{(costOfDebtBump * 100).toFixed(1)}pp<input type="range" min={0} max={4} step={0.25} value={costOfDebtBump * 100} onChange={e => setCostOfDebtBump(+e.target.value / 100)} style={{ width: 100 }} /></label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Candidate Financings — Debt Sizing &amp; Equity Returns</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: '#F8F7F4' }}>
                  {['Project', 'Sector', 'CapEx $M', 'Debt $M', 'Gearing', 'DSCR', 'Equity IRR'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {rows.map((d, i) => (
                    <tr key={d.id} onClick={() => setSelectedId(d.id)} style={{ borderTop: `1px solid ${T.border}`, background: d.id === selectedId ? '#EEF2FF' : (i % 2 ? '#FAFAF7' : T.card), cursor: 'pointer' }}>
                      <td style={{ padding: '7px 10px', fontWeight: 500 }}>{d.name}</td>
                      <td style={{ padding: '7px 10px', color: T.sub }}>{d.sector}</td>
                      <td style={{ padding: '7px 10px' }}>${d.capexM.toLocaleString()}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 600, color: T.ccs }}>${d.debtCapacityM.toFixed(0)}</td>
                      <td style={{ padding: '7px 10px' }}>{(d.gearing * 100).toFixed(0)}%</td>
                      <td style={{ padding: '7px 10px' }}>{d.dscr.toFixed(2)}×</td>
                      <td style={{ padding: '7px 10px', fontWeight: 600, color: Number.isFinite(d.irr) && d.irr >= 0.08 ? T.green : T.red }}>{Number.isFinite(d.irr) ? `${(d.irr * 100).toFixed(1)}%` : 'n/m'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 10 }}>Click a row to select it for the cash-flow panel. Simplification: CFADS ignores working-capital movements and depreciation tax shield (conservative); debt is sculpted as a level annuity at the target DSCR rather than year-by-year covenant testing.</div>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Selected Deal: {selected ? selected.name : '—'}</div>
            {selected && [
              ['Sector', selected.sector],
              ['Incentive mechanism', `${selected.incentiveType}: $${selected.incentivePrice}/t`],
              ['Offtake price', `$${selected.offtakePrice}/t`],
              ['− T&S tariff', `$${selected.tsTariff}/t`],
              ['Revenue', `$${(selected.revenue / 1e6).toFixed(1)}M/yr`],
              ['EBITDA', `$${(selected.ebitda / 1e6).toFixed(1)}M/yr`],
              ['CFADS (post-tax)', `$${(selected.cfads / 1e6).toFixed(1)}M/yr`],
              ['Max annual debt service', `$${(selected.maxAnnualDebtService / 1e6).toFixed(1)}M/yr`],
              ['Debt capacity (PV @ tenor)', `$${selected.debtCapacityM.toFixed(0)}M`],
              ['Equity required', `$${selected.equityM.toFixed(0)}M`],
              ['DSCR (covenant)', `${selected.dscr.toFixed(2)}×`],
              ['Equity IRR', Number.isFinite(selected.irr) ? `${(selected.irr * 100).toFixed(1)}%` : 'n/m'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                <span style={{ color: T.sub }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}

            <div style={{ marginTop: 20 }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cashflowChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="$M" />
                  <Tooltip formatter={v => [`$${v}M`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="DebtService" name="Debt Service" stackId="a" fill={T.ccs} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="EquityResidual" name="Equity Residual" stackId="a" fill={T.amber} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
