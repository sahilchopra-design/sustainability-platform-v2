import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

/* ================================================================= THEME */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ================================================================= DATA */

// Tab 1 — Strategy Overview
const STRATEGIES = [
  { code:'EP-AF1', name:'ESG Portfolio Optimizer',      alpha:+185, status:'Active',      updated:'2026-03-26', nextReview:'2026-04-02', aum:'$620B', color:'#16a34a' },
  { code:'EP-AF2', name:'Carbon-Aware Allocation',      alpha:+248, status:'Monitoring',  updated:'2026-03-25', nextReview:'2026-04-09', aum:'$540B', color:'#2c5a8c' },
  { code:'EP-AF3', name:'ESG Momentum',                 alpha:+390, status:'Active',      updated:'2026-03-27', nextReview:'2026-04-03', aum:'$480B', color:'#c5a96a' },
  { code:'EP-AF4', name:'Net Zero Portfolio Builder',   alpha:+295, status:'Rebalancing', updated:'2026-03-24', nextReview:'2026-03-30', aum:'$560B', color:'#d97706' },
  { code:'EP-AF5', name:'ESG Factor Alpha',             alpha:+442, status:'Active',      updated:'2026-03-27', nextReview:'2026-04-10', aum:'$600B', color:'#7c3aed' },
];
const ALPHA_BAR = STRATEGIES.map(s => ({ name: s.name.split(' ').slice(0,2).join(' '), alpha: s.alpha }));
const STATUS_COLORS = { Active:'#16a34a', Monitoring:'#d97706', Rebalancing:'#2c5a8c' };

// Tab 2 — Risk Dashboard
const RISK_KPIS = [
  { label:'ESG VaR (1-day 95%)',       value:'$42M',   sub:'Portfolio ESG Value at Risk',      color:'#dc2626' },
  { label:'Climate VaR (1-year)',       value:'$180M',  sub:'Physical + transition combined',   color:'#dc2626' },
  { label:'Tracking Error vs ACWI',    value:'2.3%',   sub:'Annualised active risk',            color:'#d97706' },
  { label:'Carbon Budget Risk',         value:'+28%',   sub:'Above 2030 Paris target',          color:'#dc2626' },
  { label:'ESG Tail Risk (P5)',         value:'41',     sub:'Conditional ESG score 5th pct',    color:'#d97706' },
  { label:'Factor Crowding Risk',       value:'6.8/10', sub:'ESG strategy crowding index',      color:'#d97706' },
];
const RISK_DECOMP = [
  { factor:'ESG Factors',       pct:28, fill:'#16a34a' },
  { factor:'Climate Factors',   pct:18, fill:'#2c5a8c' },
  { factor:'Traditional',       pct:38, fill:'#c5a96a' },
  { factor:'Idiosyncratic',     pct:16, fill:'#9aa3ae' },
];
const CORRELATION = [
  { strategy:'ESG Optimizer',      highCarbon:-0.12, valueFactor:0.18, momFactor:0.22 },
  { strategy:'Carbon-Aware',       highCarbon:-0.28, valueFactor:0.10, momFactor:0.15 },
  { strategy:'ESG Momentum',       highCarbon:-0.05, valueFactor:0.08, momFactor:0.45 },
  { strategy:'Net Zero Builder',   highCarbon:-0.35, valueFactor:0.05, momFactor:0.12 },
  { strategy:'ESG Factor Alpha',   highCarbon:-0.18, valueFactor:0.22, momFactor:0.30 },
];
const STRESS = [
  { scenario:'-ESG Regime',         impact:-180 },
  { scenario:'Carbon Tax Shock',    impact:-95  },
  { scenario:'Green Policy Reversal', impact:-130 },
  { scenario:'Rate Spike (+200bps)', impact:-45  },
  { scenario:'Energy Crisis',        impact:-62  },
];

// Tab 3 — Performance Attribution
const ATTRIBUTION = [
  { factor:'ESG Quality',      contrib:+1.2, fill:'#16a34a' },
  { factor:'Carbon Efficiency',contrib:+0.8, fill:'#5a8a6a' },
  { factor:'Green Revenue',    contrib:+0.6, fill:'#2c5a8c' },
  { factor:'ESG Momentum',     contrib:+0.4, fill:'#c5a96a' },
  { factor:'Net Zero Tilt',    contrib:+0.3, fill:'#7c3aed' },
  { factor:'Sector Alloc.',    contrib:-0.3, fill:'#dc2626' },
  { factor:'Stock Selection',  contrib:+0.2, fill:'#d97706' },
  { factor:'Costs',            contrib:-0.1, fill:'#9aa3ae' },
];
const CUMULATIVE_ACTIVE = [
  { month:'Jan', active:0.18 }, { month:'Feb', active:0.35 }, { month:'Mar', active:0.28 },
  { month:'Apr', active:0.52 }, { month:'May', active:0.74 }, { month:'Jun', active:0.88 },
  { month:'Jul', active:1.10 }, { month:'Aug', active:0.95 }, { month:'Sep', active:1.28 },
  { month:'Oct', active:1.55 }, { month:'Nov', active:2.10 }, { month:'Dec', active:3.20 },
];
const QUARTERLY_ATTR = [
  { qtr:'Q1 2024', esgQuality:0.28, carbonEff:0.18, greenRev:0.14, other:0.02 },
  { qtr:'Q2 2024', esgQuality:0.32, carbonEff:0.20, greenRev:0.16, other:0.04 },
  { qtr:'Q3 2024', esgQuality:0.24, carbonEff:0.22, greenRev:0.14, other:-0.08 },
  { qtr:'Q4 2024', esgQuality:0.36, carbonEff:0.20, greenRev:0.16, other:0.12 },
];

// Tab 4 — Strategy Comparison
const COMPARISON_DATA = [
  { strategy:'ESG Optimizer',    ret1yr:18.2, ret3yr:12.4, ret5yr:10.8, vol:11.2, sharpe:1.38, maxDD:-9.8,  esg:71, waci:165, temp:1.7 },
  { strategy:'Carbon-Aware',     ret1yr:17.5, ret3yr:11.8, ret5yr:10.2, vol:10.8, sharpe:1.42, maxDD:-8.9,  esg:69, waci:142, temp:1.6 },
  { strategy:'ESG Momentum',     ret1yr:19.8, ret3yr:13.2, ret5yr:11.5, vol:13.5, sharpe:1.29, maxDD:-12.1, esg:66, waci:178, temp:1.8 },
  { strategy:'Net Zero Builder', ret1yr:16.8, ret3yr:11.2, ret5yr: 9.8, vol:10.5, sharpe:1.35, maxDD:-8.2,  esg:74, waci:128, temp:1.5 },
  { strategy:'ESG Factor Alpha', ret1yr:21.3, ret3yr:14.1, ret5yr:12.2, vol:14.2, sharpe:1.48, maxDD:-13.5, esg:65, waci:182, temp:1.9 },
  { strategy:'MSCI ACWI',        ret1yr:15.0, ret3yr:10.5, ret5yr: 9.2, vol:12.8, sharpe:1.10, maxDD:-14.2, esg:54, waci:228, temp:2.6 },
  { strategy:'MSCI ESG Leaders', ret1yr:16.2, ret3yr:11.0, ret5yr: 9.8, vol:12.0, sharpe:1.22, maxDD:-12.5, esg:68, waci:195, temp:2.1 },
  { strategy:'MSCI Low Carbon',  ret1yr:15.8, ret3yr:10.8, ret5yr: 9.5, vol:12.2, sharpe:1.18, maxDD:-13.0, esg:61, waci:155, temp:1.9 },
];
// Indexed cumulative returns Jan 2022–Dec 2024 (36 months, sampled quarterly for display)
const CUMRET_DATA = [
  { date:'Jan-22', opt:100, carbon:100, mom:100, netZero:100, alpha:100, acwi:100 },
  { date:'Jul-22', opt:98,  carbon:101, mom:94,  netZero:102, alpha:96,  acwi:90  },
  { date:'Jan-23', opt:106, carbon:108, mom:110, netZero:107, alpha:112, acwi:100 },
  { date:'Jul-23', opt:114, carbon:116, mom:118, netZero:113, alpha:122, acwi:108 },
  { date:'Jan-24', opt:119, carbon:121, mom:124, netZero:117, alpha:128, acwi:113 },
  { date:'Jul-24', opt:124, carbon:126, mom:130, netZero:120, alpha:134, acwi:118 },
  { date:'Dec-24', opt:127, carbon:129, mom:134, netZero:122, alpha:138, acwi:121 },
];

// Tab 5 — Regulatory Scorecard
const PAI_DATA = [
  { pai:'GHG Intensity',           portfolio:175, benchmark:210, unit:'tCO₂/$M', status:'outperform' },
  { pai:'Board Gender Diversity',  portfolio:34,  benchmark:28,  unit:'%',       status:'outperform' },
  { pai:'Controversial Weapons',   portfolio:0,   benchmark:1.2, unit:'%',       status:'outperform' },
  { pai:'Fossil Fuel Exposure',    portfolio:4.2, benchmark:8.5, unit:'%',       status:'outperform' },
  { pai:'Biodiversity Impact',     portfolio:2.1, benchmark:3.4, unit:'score',   status:'outperform' },
  { pai:'Water Intensity',         portfolio:88,  benchmark:112, unit:'m³/$M',   status:'outperform' },
  { pai:'Hazardous Waste',         portfolio:0.8, benchmark:1.5, unit:'t/$M',    status:'outperform' },
  { pai:'Living Wage Violations',  portfolio:1.2, benchmark:3.8, unit:'%',       status:'outperform' },
];
const RADAR_DATA = [
  { dim:'SFDR',              score:85 },
  { dim:'TCFD',              score:87 },
  { dim:'CSRD',              score:72 },
  { dim:'UK Stewardship',    score:90 },
  { dim:'UNPRI',             score:88 },
  { dim:'Paris Alignment',   score:76 },
];

// Tab 6 — Action Centre
const ACTIONS = [
  { id:1,  priority:'P1', cat:'Rebalancing',     desc:'Rebalance Carbon-Aware portfolio — 2% above WACI budget', assignee:'Quant Desk A', due:'3 days',   impact:'+12bps alpha' },
  { id:2,  priority:'P1', cat:'Engagement',      desc:'Initiate engagement with Shell on 1.5°C SBTi target',     assignee:'ESG Team',    due:'2 weeks',  impact:'+0.05°C temp.' },
  { id:3,  priority:'P1', cat:'Reporting',       desc:'Submit PAII annual report to UN PRI secretariat',         assignee:'Risk & Compliance', due:'4 weeks', impact:'Regulatory' },
  { id:4,  priority:'P2', cat:'Rebalancing',     desc:'Trim ESG Factor Alpha momentum tilt — crowding signal',   assignee:'Quant Desk B', due:'1 week',   impact:'+8bps risk-adj' },
  { id:5,  priority:'P2', cat:'Engagement',      desc:'Co-file shareholder resolution: Chevron Paris alignment', assignee:'Stewardship',  due:'3 weeks',  impact:'+ESG score 1pt' },
  { id:6,  priority:'P2', cat:'Engagement',      desc:'Escalate dialogue with HSBC on TNFD disclosure',          assignee:'ESG Team',    due:'6 weeks',  impact:'+0.5 ESG pt' },
  { id:7,  priority:'P2', cat:'Risk Management', desc:'Reduce high-carbon factor beta below -0.15 threshold',   assignee:'Quant Desk A', due:'10 days',  impact:'-$8M VaR' },
  { id:8,  priority:'P2', cat:'Reporting',       desc:'Finalise TCFD scenario analysis narratives for board deck', assignee:'Strategy',  due:'2 weeks',  impact:'Governance' },
  { id:9,  priority:'P3', cat:'Engagement',      desc:'Engage TotalEnergies on methane intensity reporting',     assignee:'Stewardship', due:'8 weeks',  impact:'+0.3 ESG pt' },
  { id:10, priority:'P3', cat:'Rebalancing',     desc:'Annual factor model refresh — incorporate CSRD data',    assignee:'Quant Research', due:'Q2',    impact:'+15bps fwd' },
  { id:11, priority:'P3', cat:'Reporting',       desc:'Publish semi-annual Stewardship Report',                 assignee:'Risk & Compliance', due:'6 weeks', impact:'Regulatory' },
  { id:12, priority:'P3', cat:'Risk Management', desc:'Review ESG VaR model assumptions vs NGFS scenarios',    assignee:'Risk Modelling', due:'Q2',     impact:'-$12M VaR est.' },
];
const PRIORITY_COLOR = { P1: '#dc2626', P2: '#d97706', P3: '#2c5a8c' };
const CAT_COLOR = {
  Rebalancing:'#16a34a', Engagement:'#2c5a8c',
  Reporting:'#c5a96a',  'Risk Management':'#7c3aed',
};

/* ================================================================= SHARED COMPONENTS */

const Card = ({ children, style }) => (
  <div style={{
    background: T.surface, border:`1px solid ${T.border}`,
    borderRadius:12, padding:20, boxShadow: T.card, ...style,
  }}>
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize:13, fontWeight:700, color:T.textMut, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14 }}>
    {children}
  </div>
);

const KpiCard = ({ label, value, sub, color }) => (
  <Card style={{ flex:'1 1 180px', minWidth:160 }}>
    <div style={{ fontSize:11, color:T.textMut, marginBottom:6, fontWeight:600 }}>{label}</div>
    <div style={{ fontSize:26, fontWeight:800, color: color || T.navy, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textSec, marginTop:6 }}>{sub}</div>}
  </Card>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'10px 14px', boxShadow: T.cardH, fontSize:12 }}>
      <div style={{ fontWeight:700, color:T.navy, marginBottom:6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.textSec, marginBottom:2 }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

/* ================================================================= TAB 1 */
const Tab1StrategyOverview = () => (
  <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
    {/* Aggregate stats */}
    <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
      <KpiCard label="Combined AUM" value="$2.8T" sub="Across 5 quant ESG strategies" color={T.navy} />
      <KpiCard label="Avg YTD Alpha" value="+312bps" sub="All 5 strategies positive YTD" color={T.green} />
      <KpiCard label="Portfolio ESG Score" value="68.3" sub="Weighted avg vs 54 benchmark" color={T.navyL} />
      <KpiCard label="WACI" value="175" sub="tCO₂e/$M revenue" color={T.amber} />
      <KpiCard label="Temperature Rating" value="1.8°C" sub="Portfolio implied warming" color={T.sage} />
      <KpiCard label="SBTi Coverage" value="62%" sub="Of AUM in SBTi-aligned cos." color={T.navyL} />
    </div>

    {/* YTD Alpha Bar Chart */}
    <Card>
      <SectionTitle>YTD Alpha by Strategy (bps)</SectionTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={ALPHA_BAR} margin={{ top:4, right:16, bottom:4, left:0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize:11, fill:T.textSec }} />
          <YAxis tick={{ fontSize:11, fill:T.textSec }} unit="bps" />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="alpha" name="YTD Alpha (bps)" radius={[4,4,0,0]}>
            {ALPHA_BAR.map((_, i) => (
              <Cell key={i} fill={STRATEGIES[i].color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>

    {/* Strategy Cards */}
    <div>
      <SectionTitle>Strategy Summary</SectionTitle>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {STRATEGIES.map(s => (
          <Card key={s.code} style={{ display:'flex', alignItems:'center', gap:20, padding:'14px 20px' }}>
            <div style={{
              width:8, height:40, borderRadius:4,
              background: s.color, flexShrink:0,
            }} />
            <div style={{ flex:2, minWidth:180 }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>{s.name}</div>
              <div style={{ fontSize:11, color:T.textMut, marginTop:2 }}>{s.code} · AUM {s.aum}</div>
            </div>
            <div style={{ flex:1, textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:800, color:T.green }}>+{s.alpha}bps</div>
              <div style={{ fontSize:10, color:T.textMut }}>YTD Alpha</div>
            </div>
            <div style={{ flex:1, textAlign:'center' }}>
              <span style={{
                display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                background: STATUS_COLORS[s.status] + '18', color: STATUS_COLORS[s.status],
              }}>{s.status}</span>
            </div>
            <div style={{ flex:1, fontSize:11, color:T.textSec, textAlign:'right' }}>
              <div>Updated: {s.updated}</div>
              <div style={{ marginTop:2 }}>Next review: {s.nextReview}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

/* ================================================================= TAB 2 */
const Tab2RiskDashboard = () => (
  <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
    {/* KPIs */}
    <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
      {RISK_KPIS.map(k => (
        <KpiCard key={k.label} label={k.label} value={k.value} sub={k.sub} color={k.color} />
      ))}
    </div>

    <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
      {/* Risk Decomposition */}
      <Card style={{ flex:'1 1 320px' }}>
        <SectionTitle>Risk Decomposition (% of Total Risk)</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={RISK_DECOMP} layout="vertical" margin={{ top:4, right:24, bottom:4, left:90 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
            <XAxis type="number" tick={{ fontSize:11, fill:T.textSec }} unit="%" />
            <YAxis dataKey="factor" type="category" tick={{ fontSize:11, fill:T.textSec }} width={90} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="pct" name="% of Risk" radius={[0,4,4,0]}>
              {RISK_DECOMP.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Stress Tests */}
      <Card style={{ flex:'1 1 320px' }}>
        <SectionTitle>Scenario Stress Test Impact (bps)</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={STRESS} layout="vertical" margin={{ top:4, right:24, bottom:4, left:120 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
            <XAxis type="number" tick={{ fontSize:11, fill:T.textSec }} unit="bps" />
            <YAxis dataKey="scenario" type="category" tick={{ fontSize:11, fill:T.textSec }} width={120} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="impact" name="Impact (bps)" radius={[0,4,4,0]}>
              {STRESS.map((d, i) => <Cell key={i} fill={T.red} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>

    {/* Correlation table */}
    <Card>
      <SectionTitle>ESG Strategy Correlations to Risk Factors</SectionTitle>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Strategy','High-Carbon Factor','Value Factor','Momentum Factor'].map(h => (
                <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CORRELATION.map((r, i) => (
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:'8px 12px', color:T.navy, fontWeight:600 }}>{r.strategy}</td>
                <td style={{ padding:'8px 12px', color: r.highCarbon < 0 ? T.green : T.red, fontWeight:700 }}>{r.highCarbon.toFixed(2)}</td>
                <td style={{ padding:'8px 12px', color:T.textSec }}>{r.valueFactor.toFixed(2)}</td>
                <td style={{ padding:'8px 12px', color:T.textSec }}>{r.momFactor.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop:12, fontSize:11, color:T.textMut }}>
        Note: ESG Optimizer shows -0.12 correlation to high-carbon factor, providing hedging benefit relative to carbon-intensive benchmarks.
      </div>
    </Card>
  </div>
);

/* ================================================================= TAB 3 */
const Tab3Performance = () => (
  <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
    {/* Top stats */}
    <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
      <KpiCard label="Total Portfolio Return" value="14.2%" sub="Full year 2024" color={T.navy} />
      <KpiCard label="Benchmark (MSCI ACWI)" value="11.0%" sub="Full year 2024" color={T.textSec} />
      <KpiCard label="Active Return" value="+3.2%" sub="Alpha generated over benchmark" color={T.green} />
      <KpiCard label="Active Sharpe Ratio" value="1.42" sub="Risk-adjusted active return" color={T.navyL} />
      <KpiCard label="Positive Months" value="9 / 12" sub="Months with positive active return" color={T.sage} />
    </div>

    <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
      {/* Attribution bar */}
      <Card style={{ flex:'1 1 340px' }}>
        <SectionTitle>Return Attribution — Full Year 2024 (%)</SectionTitle>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={ATTRIBUTION} layout="vertical" margin={{ top:4, right:24, bottom:4, left:110 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
            <XAxis type="number" tick={{ fontSize:11, fill:T.textSec }} unit="%" />
            <YAxis dataKey="factor" type="category" tick={{ fontSize:11, fill:T.textSec }} width={110} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="contrib" name="Contribution (%)" radius={[0,4,4,0]}>
              {ATTRIBUTION.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Cumulative active return */}
      <Card style={{ flex:'1 1 340px' }}>
        <SectionTitle>Cumulative Active Return — 2024 (%)</SectionTitle>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={CUMULATIVE_ACTIVE} margin={{ top:4, right:16, bottom:4, left:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fontSize:11, fill:T.textSec }} />
            <YAxis tick={{ fontSize:11, fill:T.textSec }} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="active" name="Cumulative Active %" stroke={T.sage} strokeWidth={2.5} dot={{ r:3, fill:T.sage }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>

    {/* Quarterly table */}
    <Card>
      <SectionTitle>Quarterly Attribution Breakdown (%)</SectionTitle>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Quarter','ESG Quality','Carbon Eff.','Green Revenue','Other'].map(h => (
                <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {QUARTERLY_ATTR.map((r, i) => (
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={{ padding:'8px 12px', color:T.navy, fontWeight:600 }}>{r.qtr}</td>
                <td style={{ padding:'8px 12px', color:T.green, fontWeight:600 }}>+{r.esgQuality.toFixed(2)}%</td>
                <td style={{ padding:'8px 12px', color:T.sage }}>+{r.carbonEff.toFixed(2)}%</td>
                <td style={{ padding:'8px 12px', color:T.navyL }}>+{r.greenRev.toFixed(2)}%</td>
                <td style={{ padding:'8px 12px', color: r.other >= 0 ? T.textSec : T.red }}>
                  {r.other >= 0 ? '+' : ''}{r.other.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

/* ================================================================= TAB 4 */
const Tab4Comparison = () => (
  <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
    {/* Cumulative returns chart */}
    <Card>
      <SectionTitle>Cumulative Return — Jan 2022 to Dec 2024 (Indexed to 100)</SectionTitle>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={CUMRET_DATA} margin={{ top:4, right:16, bottom:4, left:0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="date" tick={{ fontSize:11, fill:T.textSec }} />
          <YAxis tick={{ fontSize:11, fill:T.textSec }} domain={[85, 145]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize:11 }} />
          <Line type="monotone" dataKey="opt"    name="ESG Optimizer"       stroke="#16a34a" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="carbon" name="Carbon-Aware"        stroke="#2c5a8c" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="mom"    name="ESG Momentum"        stroke="#c5a96a" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="netZero" name="Net Zero Builder"   stroke="#d97706" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="alpha"  name="ESG Factor Alpha"    stroke="#7c3aed" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="acwi"   name="MSCI ACWI"          stroke="#9aa3ae" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <div style={{ fontSize:11, color:T.textMut, marginTop:8 }}>
        ESG Factor Alpha leads at +38% cumulative vs MSCI ACWI +21%. ESG Momentum +34%, Carbon-Aware +29%, ESG Optimizer +27%, Net Zero Builder +22%.
      </div>
    </Card>

    {/* Metrics table */}
    <Card>
      <SectionTitle>Strategy & Benchmark Metrics Comparison</SectionTitle>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11.5 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Strategy','1yr Ret %','3yr Ann %','5yr Ann %','Vol %','Sharpe','Max DD %','ESG Score','WACI','Temp °C'].map(h => (
                <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_DATA.map((r, i) => {
              const isBenchmark = ['MSCI ACWI','MSCI ESG Leaders','MSCI Low Carbon'].includes(r.strategy);
              return (
                <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background: isBenchmark ? T.surfaceH : T.surface }}>
                  <td style={{ padding:'8px 10px', color: isBenchmark ? T.textSec : T.navy, fontWeight: isBenchmark ? 400 : 700 }}>{r.strategy}</td>
                  <td style={{ padding:'8px 10px', color: r.ret1yr > 15 ? T.green : T.textSec, fontWeight:600 }}>{r.ret1yr.toFixed(1)}</td>
                  <td style={{ padding:'8px 10px', color:T.textSec }}>{r.ret3yr.toFixed(1)}</td>
                  <td style={{ padding:'8px 10px', color:T.textSec }}>{r.ret5yr.toFixed(1)}</td>
                  <td style={{ padding:'8px 10px', color:T.textSec }}>{r.vol.toFixed(1)}</td>
                  <td style={{ padding:'8px 10px', color: r.sharpe >= 1.35 ? T.green : T.textSec, fontWeight: r.sharpe >= 1.35 ? 700 : 400 }}>{r.sharpe.toFixed(2)}</td>
                  <td style={{ padding:'8px 10px', color: r.maxDD < -13 ? T.red : T.amber }}>{r.maxDD.toFixed(1)}</td>
                  <td style={{ padding:'8px 10px', color: r.esg >= 65 ? T.green : T.textSec }}>{r.esg}</td>
                  <td style={{ padding:'8px 10px', color: r.waci <= 175 ? T.green : T.amber }}>{r.waci}</td>
                  <td style={{ padding:'8px 10px', color: r.temp <= 1.8 ? T.green : T.red }}>{r.temp}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop:12, fontSize:11, color:T.textMut }}>
        Regime analysis: In rising rate environments, ESG Optimizer and Net Zero Builder exhibit lower drawdowns. During ESG momentum underperformance periods (e.g., H2 2022), ESG Factor Alpha's multi-factor approach provides resilience (+0.3% vs -2.1% for pure momentum).
      </div>
    </Card>
  </div>
);

/* ================================================================= TAB 5 */
const Tab5Regulatory = () => (
  <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
    {/* Scores summary */}
    <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
      <KpiCard label="TCFD Alignment Score" value="87/100" sub="Comprehensive disclosure" color={T.green} />
      <KpiCard label="SFDR PAI Coverage" value="18/18" sub="All mandatory PAIs reported" color={T.green} />
      <KpiCard label="CSRD Readiness" value="78%" sub="ESRS E1–E4 data availability" color={T.amber} />
      <KpiCard label="UNPRI Score" value="88/100" sub="Principles for Responsible Investment" color={T.green} />
    </div>

    <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
      {/* Radar chart */}
      <Card style={{ flex:'1 1 320px' }}>
        <SectionTitle>Regulatory Framework Scores (0–100)</SectionTitle>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={RADAR_DATA} margin={{ top:16, right:32, bottom:16, left:32 }}>
            <PolarGrid stroke={T.border} />
            <PolarAngleAxis dataKey="dim" tick={{ fontSize:11, fill:T.textSec }} />
            <PolarRadiusAxis angle={90} domain={[0,100]} tick={{ fontSize:9, fill:T.textMut }} />
            <Radar name="Portfolio Score" dataKey="score" stroke={T.navyL} fill={T.navyL} fillOpacity={0.25} strokeWidth={2} />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:8 }}>
          {RADAR_DATA.map(d => (
            <div key={d.dim} style={{ fontSize:11, color:T.textSec }}>
              <span style={{ fontWeight:700, color: d.score >= 85 ? T.green : d.score >= 75 ? T.amber : T.red }}>{d.score}</span> {d.dim}
            </div>
          ))}
        </div>
      </Card>

      {/* PAI Table */}
      <Card style={{ flex:'2 1 400px' }}>
        <SectionTitle>SFDR Principal Adverse Impact (PAI) Indicators</SectionTitle>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                {['PAI Indicator','Portfolio','Benchmark','Unit','Status'].map(h => (
                  <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PAI_DATA.map((r, i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding:'8px 10px', color:T.navy, fontWeight:600 }}>{r.pai}</td>
                  <td style={{ padding:'8px 10px', color:T.green, fontWeight:700 }}>{r.portfolio}</td>
                  <td style={{ padding:'8px 10px', color:T.textSec }}>{r.benchmark}</td>
                  <td style={{ padding:'8px 10px', color:T.textMut }}>{r.unit}</td>
                  <td style={{ padding:'8px 10px' }}>
                    <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:12, fontSize:10, fontWeight:700, background:`${T.green}18`, color:T.green }}>
                      Outperforming
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop:12, fontSize:11, color:T.textMut }}>
          All 18 mandatory SFDR PAI indicators covered. Portfolio outperforms benchmark across all reported dimensions. Fossil fuel exposure at 4.2% — within regulatory limit of 5%. Controversial weapons: 0% — fully compliant.
        </div>
      </Card>
    </div>
  </div>
);

/* ================================================================= TAB 6 */
const Tab6ActionCentre = () => {
  const p1 = ACTIONS.filter(a => a.priority === 'P1');
  const p2 = ACTIONS.filter(a => a.priority === 'P2');
  const p3 = ACTIONS.filter(a => a.priority === 'P3');

  const ActionRow = ({ action }) => (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:14, padding:'12px 16px',
      background:T.surface, borderRadius:8, border:`1px solid ${T.border}`,
      borderLeft:`4px solid ${PRIORITY_COLOR[action.priority]}`,
    }}>
      <div style={{ flexShrink:0, textAlign:'center', paddingTop:2 }}>
        <span style={{
          display:'inline-block', padding:'2px 8px', borderRadius:12, fontSize:11, fontWeight:800,
          background: PRIORITY_COLOR[action.priority] + '18', color: PRIORITY_COLOR[action.priority],
        }}>{action.priority}</span>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.navy, marginBottom:4 }}>{action.desc}</div>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, color:T.textMut }}>
            <span style={{ display:'inline-block', padding:'1px 6px', background: CAT_COLOR[action.cat] + '18', color: CAT_COLOR[action.cat], borderRadius:8, fontWeight:600, marginRight:4 }}>{action.cat}</span>
          </span>
          <span style={{ fontSize:11, color:T.textSec }}>Assigned: <strong>{action.assignee}</strong></span>
          <span style={{ fontSize:11, color:T.textSec }}>Due: <strong>{action.due}</strong></span>
          <span style={{ fontSize:11, color:T.green, fontWeight:700 }}>Impact: {action.impact}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Summary stats */}
      <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
        <KpiCard label="Q1 Completion Rate" value="68%" sub="Actions completed this quarter" color={T.amber} />
        <KpiCard label="P1 Actions Pending" value="3" sub="Require immediate attention" color={T.red} />
        <KpiCard label="P1 Alpha Impact" value="+22bps" sub="Projected if all P1s completed" color={T.green} />
        <KpiCard label="Temp. Reduction" value="-0.1°C" sub="Projected from P1 engagement actions" color={T.sage} />
        <KpiCard label="Total Actions" value="12" sub="Across 4 categories" color={T.navyL} />
      </div>

      {/* P1 Actions */}
      <div>
        <SectionTitle>Priority 1 — Immediate Action Required</SectionTitle>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {p1.map(a => <ActionRow key={a.id} action={a} />)}
        </div>
      </div>

      {/* P2 Actions */}
      <div>
        <SectionTitle>Priority 2 — Near-Term Actions</SectionTitle>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {p2.map(a => <ActionRow key={a.id} action={a} />)}
        </div>
      </div>

      {/* P3 Actions */}
      <div>
        <SectionTitle>Priority 3 — Planned Actions</SectionTitle>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {p3.map(a => <ActionRow key={a.id} action={a} />)}
        </div>
      </div>
    </div>
  );
};

/* ================================================================= MAIN PAGE */
const TABS = [
  { id:'overview',    label:'Strategy Overview' },
  { id:'risk',        label:'Risk Dashboard'     },
  { id:'performance', label:'Performance Attribution' },
  { id:'comparison',  label:'Strategy Comparison' },
  { id:'regulatory',  label:'Regulatory Scorecard' },
  { id:'actions',     label:'Action Centre'      },
];

export default function QuantEsgHubPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':    return <Tab1StrategyOverview />;
      case 'risk':        return <Tab2RiskDashboard />;
      case 'performance': return <Tab3Performance />;
      case 'comparison':  return <Tab4Comparison />;
      case 'regulatory':  return <Tab5Regulatory />;
      case 'actions':     return <Tab6ActionCentre />;
      default:            return <Tab1StrategyOverview />;
    }
  };

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight:'100vh', padding:0 }}>
      {/* Header */}
      <div style={{
        background: T.navy,
        padding:'24px 32px 0 32px',
        borderBottom:`1px solid ${T.navyL}`,
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <div style={{ fontSize:10, color:T.gold, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>
              EP-AF6 · AA Impact Risk Analytics Platform
            </div>
            <h1 style={{ fontSize:26, fontWeight:800, color:'#ffffff', margin:0, lineHeight:1.1 }}>
              Quant ESG Hub
            </h1>
            <p style={{ color:'#94afc7', fontSize:13, margin:'6px 0 0 0' }}>
              Unified command centre for all 5 quantitative ESG strategies
            </p>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
            {['5 Strategies','$2.8T AUM','+312bps Avg Alpha','Live Monitor'].map(badge => (
              <span key={badge} style={{
                background: T.gold + '22', color: T.goldL, border:`1px solid ${T.gold}44`,
                borderRadius:20, padding:'4px 12px', fontSize:11, fontWeight:700,
              }}>{badge}</span>
            ))}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding:'10px 20px',
                background:'transparent',
                border:'none',
                borderBottom: activeTab === tab.id ? `3px solid ${T.gold}` : '3px solid transparent',
                color: activeTab === tab.id ? T.goldL : '#94afc7',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize:13,
                cursor:'pointer',
                whiteSpace:'nowrap',
                transition:'all 0.15s',
                fontFamily: T.font,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding:'24px 32px', maxWidth:1400, margin:'0 auto' }}>
        {renderTab()}
      </div>
    </div>
  );
}
