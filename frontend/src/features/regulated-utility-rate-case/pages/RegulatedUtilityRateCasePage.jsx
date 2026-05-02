import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#F8FAFC', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A',
  sub: '#64748B', accent: '#8B5CF6', blue: '#2563EB', indigo: '#4F46E5',
  green: '#059669', amber: '#D97706', red: '#DC2626', purple: '#7C3AED',
  teal: '#0D9488', sky: '#0284C7', muted: '#94A3B8',
};

const UTILITIES = [
  { id:1, name:'Duke Energy Carolinas', jurisdiction:'NCUC/SCPSC', type:'IOU', rate_base:28400, allowed_roe:9.9, earned_roe:9.7, lag_days:312, equity_ratio:0.52, last_case:'2023', case_freq:2.8, capex_5yr:12400, settlement:true, pending:false, revenue_req:4820, test_year:'Historical' },
  { id:2, name:'Southern Company Gas', jurisdiction:'GPSC', type:'IOU', rate_base:9800, allowed_roe:10.2, earned_roe:10.0, lag_days:285, equity_ratio:0.54, last_case:'2024', case_freq:2.1, capex_5yr:4800, settlement:true, pending:false, revenue_req:1890, test_year:'Projected' },
  { id:3, name:'Xcel Energy Colorado', jurisdiction:'CPUC-CO', type:'IOU', rate_base:14200, allowed_roe:9.5, earned_roe:9.2, lag_days:420, equity_ratio:0.49, last_case:'2022', case_freq:3.4, capex_5yr:6900, settlement:false, pending:true, revenue_req:2680, test_year:'Historical' },
  { id:4, name:'Pacific Gas & Electric', jurisdiction:'CPUC-CA', type:'IOU', rate_base:52000, allowed_roe:10.0, earned_roe:9.4, lag_days:510, equity_ratio:0.52, last_case:'2023', case_freq:4.1, capex_5yr:24800, settlement:false, pending:false, revenue_req:9400, test_year:'Projected' },
  { id:5, name:'Ameren Missouri', jurisdiction:'MoPSC', type:'IOU', rate_base:11800, allowed_roe:9.8, earned_roe:9.6, lag_days:265, equity_ratio:0.50, last_case:'2023', case_freq:2.4, capex_5yr:5600, settlement:true, pending:false, revenue_req:2240, test_year:'Historical' },
  { id:6, name:'Evergy Kansas', jurisdiction:'KCC', type:'IOU', rate_base:8400, allowed_roe:9.3, earned_roe:9.1, lag_days:308, equity_ratio:0.48, last_case:'2022', case_freq:3.2, capex_5yr:4100, settlement:true, pending:true, revenue_req:1580, test_year:'Historical' },
  { id:7, name:'National Grid MA', jurisdiction:'DPU-MA', type:'IOU', rate_base:16800, allowed_roe:9.7, earned_roe:9.5, lag_days:365, equity_ratio:0.53, last_case:'2024', case_freq:2.9, capex_5yr:8200, settlement:false, pending:false, revenue_req:3150, test_year:'Projected' },
  { id:8, name:'Eversource CT', jurisdiction:'PURA-CT', type:'IOU', rate_base:9200, allowed_roe:9.4, earned_roe:9.0, lag_days:398, equity_ratio:0.51, last_case:'2023', case_freq:3.8, capex_5yr:4500, settlement:false, pending:false, revenue_req:1740, test_year:'Historical' },
  { id:9, name:'Dominion VA', jurisdiction:'SCC-VA', type:'IOU', rate_base:31200, allowed_roe:9.6, earned_roe:9.4, lag_days:278, equity_ratio:0.53, last_case:'2024', case_freq:2.2, capex_5yr:15100, settlement:true, pending:false, revenue_req:5820, test_year:'Projected' },
  { id:10, name:'AES Indiana', jurisdiction:'IURC', type:'IOU', rate_base:6100, allowed_roe:9.7, earned_roe:9.5, lag_days:290, equity_ratio:0.50, last_case:'2022', case_freq:2.7, capex_5yr:2900, settlement:true, pending:false, revenue_req:1140, test_year:'Historical' },
  { id:11, name:'Puget Sound Energy', jurisdiction:'UTC-WA', type:'IOU', rate_base:12400, allowed_roe:9.4, earned_roe:9.1, lag_days:445, equity_ratio:0.51, last_case:'2023', case_freq:3.6, capex_5yr:6100, settlement:false, pending:true, revenue_req:2320, test_year:'Projected' },
  { id:12, name:'Wisconsin Electric', jurisdiction:'PSC-WI', type:'IOU', rate_base:10800, allowed_roe:9.8, earned_roe:9.7, lag_days:242, equity_ratio:0.52, last_case:'2024', case_freq:2.0, capex_5yr:5300, settlement:true, pending:false, revenue_req:2020, test_year:'Historical' },
];

const RATE_BASE_COMPONENTS = [
  { component: 'Electric Plant in Service', value: 18400, type: 'Gross' },
  { component: 'Accumulated Depreciation', value: -6200, type: 'Deduction' },
  { component: 'Net Plant in Service', value: 12200, type: 'Net' },
  { component: 'Construction Work in Progress', value: 1840, type: 'Gross' },
  { component: 'Cash Working Capital', value: 380, type: 'Gross' },
  { component: 'Materials & Supplies', value: 210, type: 'Gross' },
  { component: 'Prepayments', value: 95, type: 'Gross' },
  { component: 'Deferred Income Tax (Offset)', value: -1820, type: 'Deduction' },
  { component: 'Customer Advances', value: -140, type: 'Deduction' },
  { component: 'Total Rate Base', value: 12765, type: 'Total' },
];

const REVENUE_REQUIREMENT = [
  { item: 'Return on Rate Base (WACC)', value: 882, basis: '6.91% × $12,765M' },
  { item: 'Return on Equity', value: 513, basis: '9.9% × $5,190M equity' },
  { item: 'Cost of Long-Term Debt', value: 289, basis: '4.82% × $5,990M LTD' },
  { item: 'Cost of Short-Term Debt', value: 80, basis: '5.41% × $1,480M STD' },
  { item: 'Depreciation & Amortisation', value: 624, basis: '4.9% depreciation rate' },
  { item: 'O&M Expense', value: 1840, basis: 'Test year normalised' },
  { item: 'Taxes — Income', value: 410, basis: 'Normalised, post-TCJA' },
  { item: 'Taxes — Property & Other', value: 285, basis: 'Test year actual' },
  { item: 'Revenue Grossup (Tax Effect)', value: 128, basis: 'Effective tax rate 24%' },
  { item: 'TOTAL REVENUE REQUIREMENT', value: 4168, basis: 'Before revenue credits' },
];

const ROE_HISTORY = Array.from({ length: 32 }, (_, i) => ({
  year: 2000 + Math.floor(i / 2),
  half: i % 2 === 0 ? 'H1' : 'H2',
  label: `${2000 + Math.floor(i / 2)}${i % 2 === 0 ? 'H1' : 'H2'}`,
  median_allowed: parseFloat((12.5 - i * 0.12 + sr(i*7)*0.4).toFixed(2)),
  median_earned: parseFloat((12.2 - i * 0.12 + sr(i*11)*0.5).toFixed(2)),
  fed_funds: parseFloat((Math.max(0.1, i < 8 ? 4.8 - i*0.6 : i < 16 ? 0.2 + i*0.02 : i < 24 ? 2.4 + (i-16)*0.1 : 5.2)).toFixed(2)),
}));

const CASE_TIMELINE = [
  { phase: 'Pre-Filing Prep', start_wk: 0, duration_wk: 12, milestone: 'Internal cost-of-service study' },
  { phase: 'Application Filed', start_wk: 12, duration_wk: 1, milestone: 'Commission docketed' },
  { phase: 'Intervenor Discovery', start_wk: 13, duration_wk: 8, milestone: 'Staff & AG interrogatories' },
  { phase: 'Evidentiary Hearings', start_wk: 21, duration_wk: 4, milestone: 'Testimony, cross-examination' },
  { phase: 'Briefing Period', start_wk: 25, duration_wk: 6, milestone: 'Initial + reply briefs' },
  { phase: 'Commission Deliberation', start_wk: 31, duration_wk: 8, milestone: 'Proposed + final order' },
  { phase: 'Rate Effective', start_wk: 39, duration_wk: 2, milestone: 'New tariffs effective' },
  { phase: 'Regulatory Lag Period', start_wk: 0, duration_wk: 41, milestone: 'Earned below allowed ROE' },
];

const CAPEX_FORECAST = Array.from({ length: 10 }, (_, i) => ({
  year: 2025 + i,
  maintenance: Math.round(420 + sr(i*7)*80),
  reliability: Math.round(280 + sr(i*11)*120 + i*15),
  clean_energy: Math.round(180 + i*85 + sr(i*9)*60),
  grid_mod: Math.round(95 + i*22 + sr(i*13)*35),
  total: 0,
})).map(r => ({ ...r, total: r.maintenance + r.reliability + r.clean_energy + r.grid_mod }));

const REGULATORY_RADAR = [
  { axis: 'ROE Adequacy', value: 74 },
  { axis: 'Lag Management', value: 66 },
  { axis: 'Capex Recovery', value: 81 },
  { axis: 'Settlement Rate', value: 78 },
  { axis: 'Case Efficiency', value: 72 },
  { axis: 'Precedent Stability', value: 85 },
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Pill = ({ label, color }) => (
  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: `${color}20`, color, border: `1px solid ${color}40`, marginRight: 4 }}>{label}</span>
);

export default function RegulatedUtilityRateCasePage() {
  const [tab, setTab] = useState(0);
  const [selUtil, setSelUtil] = useState(0);
  const [equityRatio, setEquityRatio] = useState(52);
  const [roeAssumption, setRoeAssumption] = useState(9.8);
  const [debtCost, setDebtCost] = useState(4.8);
  const [filterPending, setFilterPending] = useState(false);

  const util = UTILITIES[selUtil];
  const displayed = useMemo(() => filterPending ? UTILITIES.filter(u => u.pending) : UTILITIES, [filterPending]);

  const wacc = (equityRatio/100 * roeAssumption + (1-equityRatio/100) * debtCost * (1-0.21)).toFixed(2);
  const allowedReturn = (util.rate_base * +wacc / 100 / 1000).toFixed(2);
  const lagCost = Math.round(util.rate_base * (util.allowed_roe - util.earned_roe) / 100 / 1000 * util.lag_days / 365 * 1000);

  const avgROE = (UTILITIES.reduce((s,u) => s+u.allowed_roe, 0)/UTILITIES.length).toFixed(2);
  const avgLag = Math.round(UTILITIES.reduce((s,u) => s+u.lag_days, 0)/UTILITIES.length);
  const totalRateBase = UTILITIES.reduce((s,u) => s+u.rate_base, 0);
  const settlementRate = Math.round(UTILITIES.filter(u=>u.settlement).length/UTILITIES.length*100);

  const tabs = ['Utility Universe', 'Rate Base Build-Up', 'Revenue Requirement', 'ROE Trends', 'Case Timeline', 'Capex Recovery', 'WACC Calculator'];

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: T.bg, minHeight: '100vh', padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚖️</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>Regulated Utility Rate Case Analytics</h1>
            <p style={{ margin: 0, fontSize: 13, color: T.sub }}>EP-EL3 · FERC / State PUC · Cost-of-service · Allowed vs earned ROE · Regulatory lag · Revenue requirement</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <KpiCard label="Total Rate Base" value={`$${(totalRateBase/1000).toFixed(0)}B`} sub="12 US IOUs" color={T.accent} />
        <KpiCard label="Avg Allowed ROE" value={`${avgROE}%`} sub="State PUC median 2024" color={T.green} />
        <KpiCard label="Avg Regulatory Lag" value={`${avgLag} days`} sub="Filing to new rates" color={T.amber} />
        <KpiCard label="Settlement Rate" value={`${settlementRate}%`} sub="Cases settled vs litigated" color={T.teal} />
        <KpiCard label="Pending Cases" value={UTILITIES.filter(u=>u.pending).length} sub="Active filings" color={T.purple} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: tab === i ? T.accent : T.card, color: tab === i ? '#fff' : T.sub,
            boxShadow: tab === i ? `0 2px 8px ${T.accent}40` : 'none',
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>Investor-Owned Utilities — Rate Case Summary</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub, cursor: 'pointer' }}>
              <input type="checkbox" checked={filterPending} onChange={e => setFilterPending(e.target.checked)} />
              Show Pending Only
            </label>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  {['Utility','Jurisdiction','Rate Base $M','Allowed ROE','Earned ROE','Lag Days','Eq Ratio','Rev Req $M','Last Case','Settlement','Pending'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((u, i) => (
                  <tr key={u.id} onClick={() => setSelUtil(UTILITIES.indexOf(u))} style={{ cursor: 'pointer', background: selUtil === UTILITIES.indexOf(u) ? `${T.accent}10` : 'transparent', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: T.text, whiteSpace: 'nowrap' }}>{u.name}</td>
                    <td style={{ padding: '8px 10px', color: T.sub, fontSize: 11 }}>{u.jurisdiction}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: T.accent }}>{u.rate_base.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px', color: T.green }}>{u.allowed_roe}%</td>
                    <td style={{ padding: '8px 10px', color: u.earned_roe >= u.allowed_roe * 0.97 ? T.green : T.amber }}>{u.earned_roe}%</td>
                    <td style={{ padding: '8px 10px', color: u.lag_days > 400 ? T.red : T.amber }}>{u.lag_days}</td>
                    <td style={{ padding: '8px 10px' }}>{(u.equity_ratio*100).toFixed(0)}%</td>
                    <td style={{ padding: '8px 10px' }}>{u.revenue_req.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px', color: T.sub }}>{u.last_case}</td>
                    <td style={{ padding: '8px 10px' }}><Pill label={u.settlement ? 'Settled' : 'Litigated'} color={u.settlement ? T.green : T.amber} /></td>
                    <td style={{ padding: '8px 10px' }}><Pill label={u.pending ? 'Pending' : 'Active'} color={u.pending ? T.purple : T.teal} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Allowed ROE vs Rate Base</h3>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="rate_base" name="Rate Base $M" tick={{ fontSize: 10, fill: T.sub }} />
                  <YAxis dataKey="allowed_roe" name="Allowed ROE %" tick={{ fontSize: 10, fill: T.sub }} domain={[9, 10.5]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: 11 }} />
                  <Scatter data={UTILITIES} fill={T.accent} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Regulatory Quality Index</h3>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={REGULATORY_RADAR}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: T.sub }} />
                  <Radar name="Score" dataKey="value" stroke={T.accent} fill={T.accent} fillOpacity={0.2} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, minWidth: 320 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: T.text }}>Rate Base Build-Up</h3>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: T.sub }}>Original Cost basis — FERC Uniform System of Accounts</p>
            {RATE_BASE_COMPONENTS.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${T.border}`, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: r.type === 'Total' ? T.text : r.type === 'Deduction' ? T.red : T.sub, fontWeight: r.type === 'Total' || r.type === 'Net' ? 700 : 400 }}>{r.component}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: r.type === 'Total' ? T.accent : r.type === 'Deduction' ? T.red : T.text }}>
                  {r.value < 0 ? `(${Math.abs(r.value).toLocaleString()})` : r.value.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 400 }}>$M</span>
                </span>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Rate Base Composition — Gross</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={RATE_BASE_COMPONENTS.filter(r => r.type === 'Gross')} layout="vertical" margin={{ top:0, right:16, left:180, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize:10, fill:T.sub }} />
                <YAxis dataKey="component" type="category" tick={{ fontSize:9, fill:T.sub }} width={180} />
                <Tooltip contentStyle={{ fontSize:12 }} />
                <Bar dataKey="value" name="$M" fill={T.accent} radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 16, background: '#FAF5FF', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 8 }}>Test Year Considerations</div>
              {[['Historical Test Year','Actual costs — regulatory lag inherent'],['Projected Test Year','Forward-looking — reduces lag, more contested'],['Hybrid','12-month with known-and-measurable adjustments'],['CWIP in Rate Base','Some states allow — avoids AFUDC equity dilution'],['Accumulated Deferred IT','TCJA §168(k) bonus depreciation creates large ADIT']].map(([t,d]) => (
                <div key={t} style={{ marginBottom: 6, fontSize:11 }}>
                  <span style={{ fontWeight:700, color:T.text }}>{t}: </span>
                  <span style={{ color:T.sub }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, minWidth: 320 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: T.text }}>Revenue Requirement — Cost-of-Service Build</h3>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: T.sub }}>Standard IOU test year methodology</p>
            {REVENUE_REQUIREMENT.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: r.item.includes('TOTAL') ? 700 : 400, color: r.item.includes('TOTAL') ? T.text : T.sub }}>{r.item}</div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>{r.basis}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: r.item.includes('TOTAL') ? T.accent : T.text }}>${r.value.toLocaleString()}M</div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Revenue Requirement Composition</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={REVENUE_REQUIREMENT.slice(0,-1)} layout="vertical" margin={{ top:0, right:16, left:190, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize:10, fill:T.sub }} />
                <YAxis dataKey="item" type="category" tick={{ fontSize:9, fill:T.sub }} width={190} />
                <Tooltip contentStyle={{ fontSize:12 }} />
                <Bar dataKey="value" name="$M" fill={T.accent} radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 16, background: '#FAF5FF', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 8 }}>Key Contested Issues</div>
              {[['ROE','Contested range typically ±100–200bps from staff vs utility'],['Capital Structure','Staff often proposes 48-50% equity; utilities seek 52-55%'],['O&M Normalisation','Removes non-recurring costs; fuel gas cost embedded separately'],['ADIT Flow-Through','Tax reform savings — regulators require flow-through vs amortisation'],['Pension Expense','Actuarial assumptions contested; amortisation of pension corridor'],['Depreciation Rates','EUL studies submitted; staff challenges on life extension']].map(([t,d]) => (
                <div key={t} style={{ marginBottom: 6, fontSize:11 }}>
                  <span style={{ fontWeight:700, color:T.text }}>{t}: </span><span style={{ color:T.sub }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Median Allowed vs Earned ROE — 16-Year History (with Fed Funds)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ROE_HISTORY.filter((_,i)=>i%2===0)} margin={{ top:4, right:16, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="label" tick={{ fontSize:9, fill:T.sub }} interval={3} />
                <YAxis yAxisId="left" domain={[8, 13]} tick={{ fontSize:11, fill:T.sub }} tickFormatter={v=>`${v}%`} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 8]} tick={{ fontSize:11, fill:T.sub }} tickFormatter={v=>`${v}%`} />
                <Tooltip contentStyle={{ fontSize:12 }} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Line yAxisId="left" type="monotone" dataKey="median_allowed" name="Allowed ROE" stroke={T.green} strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="median_earned" name="Earned ROE" stroke={T.accent} strokeWidth={2} dot={false} strokeDasharray="5 3" />
                <Line yAxisId="right" type="monotone" dataKey="fed_funds" name="Fed Funds Rate" stroke={T.red} strokeWidth={1.5} dot={false} strokeDasharray="3 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Allowed ROE vs Earned — Current Peer</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={UTILITIES} margin={{ top:0, right:8, left:0, bottom:60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize:8, fill:T.sub }} angle={-30} textAnchor="end" height={60} />
                  <YAxis domain={[9, 10.5]} tick={{ fontSize:10, fill:T.sub }} tickFormatter={v=>`${v}%`} />
                  <Tooltip contentStyle={{ fontSize:12 }} />
                  <Legend wrapperStyle={{ fontSize:12 }} />
                  <Bar dataKey="allowed_roe" name="Allowed ROE%" fill={T.sub} radius={[2,2,0,0]} />
                  <Bar dataKey="earned_roe" name="Earned ROE%" fill={T.accent} radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>ROE Benchmarking Methodologies</h3>
              {[['DCF Model','Dividend yield + long-term growth; proxy group of ~20 utilities'],['CAPM','Risk-free rate + equity beta × market risk premium; 5.5–7.0% ERP'],['Risk Premium','Allowed bond yield + historical equity risk premium 3.5–5.5%'],['Comparable Earnings','Match earnings of similar-risk non-utility companies'],['Flotation Cost','100–150 bps adder for new equity issuance costs'],['RONA','Return on net assets crosscheck to ROIC of peer industrials']].map(([m,d],i) => (
                <div key={i} style={{ marginBottom: 8, fontSize:12 }}>
                  <span style={{ fontWeight:700, color:T.text }}>{m}: </span><span style={{ color:T.sub }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Rate Case Phase Timeline — Typical IOU Process</h3>
            {CASE_TIMELINE.map((phase, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 180, fontSize: 12, fontWeight: 600, color: T.text, flexShrink: 0 }}>{phase.phase}</div>
                <div style={{ flex: 1, background: '#E2E8F0', borderRadius: 4, height: 24, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: `${phase.start_wk/42*100}%`, width: `${phase.duration_wk/42*100}%`, height: '100%', background: phase.phase.includes('Lag') ? `${T.red}60` : T.accent, borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
                    <span style={{ fontSize: 10, color: '#fff', whiteSpace: 'nowrap', fontWeight: 600 }}>{phase.duration_wk}wk</span>
                  </div>
                </div>
                <div style={{ width: 240, fontSize: 11, color: T.sub, flexShrink: 0 }}>{phase.milestone}</div>
              </div>
            ))}
            <div style={{ marginTop: 8, fontSize: 11, color: T.sub }}>→ Week 0–42 scale (42 weeks typical end-to-end, excluding pre-filing)</div>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Regulatory Lag by Jurisdiction</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[...UTILITIES].sort((a,b)=>b.lag_days-a.lag_days)} layout="vertical" margin={{ top:0, right:16, left:130, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize:10, fill:T.sub }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize:9, fill:T.sub }} width={130} />
                  <Tooltip contentStyle={{ fontSize:12 }} />
                  <Bar dataKey="lag_days" name="Lag Days" fill={T.amber} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: T.text }}>Regulatory Lag Cost — {util.name}</h3>
              <div style={{ background: '#FFF7ED', borderRadius: 8, padding: '14px 16px', marginTop: 8 }}>
                {[['Lag Period', `${util.lag_days} days`],['Allowed ROE', `${util.allowed_roe}%`],['Earned ROE', `${util.earned_roe}%`],['ROE Gap', `${(util.allowed_roe - util.earned_roe).toFixed(1)}%`],['Rate Base', `$${util.rate_base.toLocaleString()}M`],['Annual Lag Cost (est)', `$${lagCost}M`],['Lag Mitigation','EDIT tracker, DSIC, FERC formula rates']].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid #FED7AA`, fontSize:12 }}>
                    <span style={{ color:T.sub }}>{l}</span><span style={{ fontWeight:700, color:T.text }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>10-Year Capex Forecast — By Program Category</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={CAPEX_FORECAST} margin={{ top:4, right:16, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:11, fill:T.sub }} />
                <YAxis tick={{ fontSize:11, fill:T.sub }} />
                <Tooltip contentStyle={{ fontSize:12 }} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Area type="monotone" dataKey="maintenance" name="Maintenance" stackId="a" stroke={T.sub} fill={T.sub} fillOpacity={0.3} />
                <Area type="monotone" dataKey="reliability" name="Reliability" stackId="a" stroke={T.accent} fill={T.accent} fillOpacity={0.4} />
                <Area type="monotone" dataKey="clean_energy" name="Clean Energy" stackId="a" stroke={T.green} fill={T.green} fillOpacity={0.4} />
                <Area type="monotone" dataKey="grid_mod" name="Grid Modernisation" stackId="a" stroke={T.teal} fill={T.teal} fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>5-Year Capex vs Rate Base</h3>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="rate_base" name="Rate Base $M" tick={{ fontSize:10, fill:T.sub }} />
                  <YAxis dataKey="capex_5yr" name="Capex 5yr $M" tick={{ fontSize:10, fill:T.sub }} />
                  <Tooltip cursor={{ strokeDasharray:'3 3' }} contentStyle={{ fontSize:11 }} />
                  <Scatter data={UTILITIES} fill={T.purple} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Capex Recovery Mechanisms</h3>
              {[['DSIC/DSIC','Distribution System Improvement Charge — quarterly rider, avoids full case'],['EDIT/TCRF','Environmental/Transmission rider — enables fast recovery of mandated spend'],['Rider Trackers','Fuel, renewables, storm — neutralises cost volatility from base rates'],['Deferred Recovery','CWIP carrying cost via AFUDC — equity component boosts earnings'],['Formula Rates','FERC-regulated utilities file annual updates — eliminates regulatory lag'],['Securitisation','Storm/retirement costs securitised at AAA rate — reduces revenue req']].map(([t,d],i) => (
                <div key={i} style={{ marginBottom: 9, fontSize:12 }}>
                  <span style={{ fontWeight:700, color:T.text }}>{t}: </span><span style={{ color:T.sub }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, minWidth: 320 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 700, color: T.text }}>WACC Calculator — Utility Cost of Capital</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: T.sub }}>Selected Utility</label>
              <select value={selUtil} onChange={e => setSelUtil(+e.target.value)} style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, marginTop:6 }}>
                {UTILITIES.map((u,i) => <option key={i} value={i}>{u.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: T.sub }}>Equity Ratio: <strong>{equityRatio}%</strong></label>
              <input type="range" min={40} max={60} step={1} value={equityRatio} onChange={e => setEquityRatio(+e.target.value)} style={{ width:'100%', marginTop:4 }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: T.sub }}>Allowed ROE: <strong>{roeAssumption}%</strong></label>
              <input type="range" min={8.5} max={11.0} step={0.1} value={roeAssumption} onChange={e => setRoeAssumption(+e.target.value)} style={{ width:'100%', marginTop:4 }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: T.sub }}>Debt Cost (pre-tax): <strong>{debtCost}%</strong></label>
              <input type="range" min={3.0} max={7.0} step={0.1} value={debtCost} onChange={e => setDebtCost(+e.target.value)} style={{ width:'100%', marginTop:4 }} />
            </div>
            <div style={{ background: '#FAF5FF', borderRadius: 10, padding: '16px 18px', marginTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.purple, marginBottom: 10 }}>Output — {util.name}</div>
              {[['Equity Ratio', `${equityRatio}%`],['After-Tax Debt Cost', `${(debtCost*(1-0.21)).toFixed(2)}%`],['Calculated WACC', `${wacc}%`],['Rate Base', `$${util.rate_base.toLocaleString()}M`],['Allowed Return $', `$${allowedReturn}B`],['Rev Req (Filed)', `$${util.revenue_req.toLocaleString()}M`],['Jurisdiction', util.jurisdiction]].map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid #DDD6FE`, fontSize:12 }}>
                  <span style={{ color:T.sub }}>{l}</span><span style={{ fontWeight:700, color:T.text }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>WACC Sensitivity — Equity Ratio</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={[40,44,48,52,56,60].map(eq => ({
                equity: `${eq}%`, wacc: +((eq/100*roeAssumption + (1-eq/100)*debtCost*0.79)).toFixed(2)
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="equity" tick={{ fontSize:11, fill:T.sub }} />
                <YAxis tick={{ fontSize:11, fill:T.sub }} tickFormatter={v=>`${v}%`} />
                <Tooltip contentStyle={{ fontSize:12 }} formatter={v=>[`${v}%`,'WACC']} />
                <Line type="monotone" dataKey="wacc" name="WACC%" stroke={T.accent} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 16 }}>
              <h4 style={{ margin:'0 0 10px', fontSize:13, fontWeight:700, color:T.text }}>Regulatory Finance Quick Reference</h4>
              {[['AFUDC equity','Capitalised cost of equity financing CWIP — boosts EPS during construction'],['Cash working capital','Lead-lag study determines working capital in rate base'],['EDIT amortisation','Excess ADIT from TCJA returned via South Georgia / average rate assumption'],['Rate case attrition','ROE erodes ~50bps between cases due to customer growth dilution'],['Bad debt normalisation','Removes economic-cycle variation from O&M expense']].map(([t,d],i) => (
                <div key={i} style={{ marginBottom:7, fontSize:11 }}>
                  <span style={{ fontWeight:700, color:T.text }}>{t}: </span><span style={{ color:T.sub }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
