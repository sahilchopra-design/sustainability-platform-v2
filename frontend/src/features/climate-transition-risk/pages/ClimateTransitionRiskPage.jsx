import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LineChart, Line, AreaChart, Area, Legend } from 'recharts';
import { NGFS_PHASE4, CARBON_PRICE_PATHS, SDA_PATHWAYS, computeCBAMCost } from '../../../services/climateRiskDataService';

/* ── Theme ── */
const T = { bg:'#0f172a', surface:'#1e293b', border:'#334155', navy:'#1e3a5f', gold:'#f59e0b', sage:'#10b981', text:'#f1f5f9', textSec:'#94a3b8', textMut:'#64748b', red:'#ef4444', green:'#10b981', amber:'#f59e0b', teal:'#14b8a6', font:"'Inter',sans-serif" };
const ACCENT = '#f59e0b';
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

/* NGFS_PHASE4 has: { id, name, category, color, temp, carbonPrice2030, carbonPrice2050, ... }
   CARBON_PRICE_PATHS is array: [{ year, NZ2050, B2C, LED, DT, DNZ, CP }, ...]
   SDA_PATHWAYS is array: [{ sector, label, unit, baseline2020, target2030, target2040, target2050, current }, ...]
   computeCBAMCost(embeddedCO2, carbonPrice, tonnageKt) => €M */

const TABS = ['Transition Risk Overview','Carbon Price Sensitivity','CBAM Compliance','Scope 3 & PCAF','SDA Sector Pathways','Policy & Litigation'];

/* ── Sectors Tab 1 ── */
const SECTORS_T1 = [
  { name:'Coal Mining',  score:9.2, ci:820, cbam:true,  sbti:4,  strand:42, ready:12 },
  { name:'Oil & Gas',    score:8.5, ci:540, cbam:false, sbti:11, strand:38, ready:18 },
  { name:'Steel',        score:7.8, ci:460, cbam:true,  sbti:18, strand:28, ready:32 },
  { name:'Cement',       score:7.4, ci:390, cbam:true,  sbti:22, strand:22, ready:35 },
  { name:'Aviation',     score:7.1, ci:310, cbam:false, sbti:14, strand:19, ready:29 },
  { name:'Chemicals',    score:6.8, ci:280, cbam:true,  sbti:26, strand:16, ready:41 },
  { name:'Shipping',     score:6.2, ci:245, cbam:false, sbti:19, strand:12, ready:38 },
  { name:'Aluminium',    score:5.9, ci:310, cbam:true,  sbti:31, strand:9,  ready:45 },
  { name:'Automobiles',  score:5.2, ci:180, cbam:false, sbti:44, strand:8,  ready:55 },
  { name:'Real Estate',  score:4.1, ci:120, cbam:false, sbti:28, strand:5,  ready:52 },
  { name:'Technology',   score:2.3, ci:45,  cbam:false, sbti:62, strand:1,  ready:82 },
  { name:'Renewables',   score:1.1, ci:18,  cbam:false, sbti:71, strand:0,  ready:95 },
];

/* ── Carbon price sectors Tab 2 ── */
const CARBON_SECTORS = [
  { name:'Coal Mining', rev:8.2,  ci:820 },
  { name:'Steel',       rev:22.4, ci:460 },
  { name:'Cement',      rev:15.1, ci:390 },
  { name:'Aviation',    rev:18.6, ci:310 },
  { name:'Chemicals',   rev:31.2, ci:280 },
  { name:'Oil & Gas',   rev:45.8, ci:540 },
];
const YEARS = [2025,2030,2035,2040,2045,2050];

/* ── CBAM Tab 3 ── */
const CBAM_META = {
  'Steel':       1.85,
  'Cement':      0.82,
  'Aluminium':   8.50,
  'Fertilisers': 2.20,
  'Electricity': 0.45,
  'Hydrogen':    9.80,
};
const CBAM_COMPANIES = [
  { name:'EU Domestic',      product:'Steel',       tonnage:8200 },
  { name:'Germany Steel',    product:'Steel',       tonnage:3100 },
  { name:'India Steel',      product:'Steel',       tonnage:4500 },
  { name:'China Cement',     product:'Cement',      tonnage:6200 },
  { name:'Turkey Aluminium', product:'Aluminium',   tonnage:850  },
  { name:'US Fertilisers',   product:'Fertilisers', tonnage:1200 },
  { name:'Indonesia Elec.',  product:'Electricity', tonnage:2800 },
  { name:'Brazil Iron Ore',  product:'Steel',       tonnage:3800 },
];
const CBAM_PRICES = [45, 90, 130];

/* ── PCAF Tab 4 ── */
const PCAF_CATS = [
  { name:'Listed Equity',             score:3, emissions:18.2, pct:21.7, avail:72 },
  { name:'Corporate Bonds',           score:3, emissions:14.5, pct:17.3, avail:68 },
  { name:'Business Loans (listed)',   score:2, emissions:11.8, pct:14.0, avail:85 },
  { name:'Business Loans (unlisted)', score:4, emissions:16.4, pct:19.5, avail:42 },
  { name:'Project Finance',           score:2, emissions:8.6,  pct:10.2, avail:88 },
  { name:'Commercial RE',             score:3, emissions:7.2,  pct:8.6,  avail:55 },
  { name:'Residential Mortgages',     score:3, emissions:4.9,  pct:5.8,  avail:61 },
  { name:'Motor Vehicle Loans',       score:2, emissions:2.4,  pct:2.9,  avail:91 },
];

/* ── Policy drivers Tab 6 ── */
const POLICY_DRIVERS = [
  { name:'Carbon Pricing',               prob:82, impLo:8,  impHi:24, sectors:'Energy, Industry', trend:'worsening' },
  { name:'EU ETS Reform',                prob:76, impLo:5,  impHi:18, sectors:'Power, Steel',     trend:'worsening' },
  { name:'Fossil Fuel Subsidy Phase-out',prob:58, impLo:12, impHi:35, sectors:'Oil & Gas, Coal',  trend:'worsening' },
  { name:'Stranded Asset Regulation',    prob:64, impLo:15, impHi:42, sectors:'Banks, Insurers',  trend:'stable'    },
  { name:'Climate Litigation',           prob:71, impLo:3,  impHi:12, sectors:'Fossil Fuels',     trend:'worsening' },
  { name:'Technology Disruption',        prob:45, impLo:20, impHi:60, sectors:'Autos, Utilities', trend:'improving' },
];
const LITIGATION = [
  { case:'Milieudefensie v Shell',       sector:'Oil & Gas', juris:'Netherlands', claim:4200, status:'Appealed',       prec:'Board duty of care' },
  { case:'Held v Montana',               sector:'Govt',      juris:'USA',          claim:0,    status:'State liability',prec:'Youth climate rights' },
  { case:'AC v Santos',                  sector:'Oil & Gas', juris:'Australia',    claim:850,  status:'Settled',        prec:'Greenwashing disclosure' },
  { case:'ClientEarth v Engie',          sector:'Power',     juris:'Belgium',      claim:620,  status:'Pending',        prec:'Net zero credibility' },
  { case:'Carvalho v EU Parliament',     sector:'Policy',    juris:'EU',           claim:0,    status:'Dismissed',      prec:'Individual standing' },
  { case:'Smith v Fonterra',             sector:'Agri',      juris:'New Zealand',  claim:310,  status:'Pending',        prec:'Corporate contribution' },
];

/* ── Helpers ── */
const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'8px 12px', fontSize:12 }}>
      <div style={{ color:T.textSec, marginBottom:4 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color||T.text }}>{p.name}: <b>{typeof p.value==='number'?p.value.toFixed(1):p.value}</b></div>
      ))}
    </div>
  );
};

const StatCard = ({ label, value, sub, color }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'16px 20px', flex:1, minWidth:160 }}>
    <div style={{ fontSize:11, color:T.textMut, marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:700, color:color||ACCENT }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textSec, marginTop:4 }}>{sub}</div>}
  </div>
);

const Hdr = ({ children }) => (
  <div style={{ fontSize:12, color:T.textSec, marginBottom:8 }}>{children}</div>
);

/* ── Tab 1: Transition Risk Overview ── */
function Tab1({ scenIdx, setScenIdx }) {
  const scen = NGFS_PHASE4[scenIdx];
  const mult = scen.id==='nz2050'?0.90:scen.id==='cp'?1.15:1;
  const barData = SECTORS_T1.map(s => ({ name:s.name, score:+(s.score*mult).toFixed(1) }));
  return (
    <div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
        <StatCard label="Transition VaR" value="$12.4bn" sub="99th pct, 3-yr" color={T.red} />
        <StatCard label="High-Risk Sectors" value="7 / 20" sub="Score > 6.0" color={T.amber} />
        <StatCard label="CBAM Exposure" value="€2.1bn" sub="Annual at €90/t" color={T.teal} />
        <StatCard label="Scope 3 Financed" value="84 MtCO2" sub="PCAF Cat 15" color={T.sage} />
      </div>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:11, color:T.textMut, marginBottom:8 }}>NGFS Phase IV Scenario</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {NGFS_PHASE4.map((s,i) => (
            <button key={i} onClick={() => setScenIdx(i)} style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${i===scenIdx?s.color:T.border}`, background:i===scenIdx?s.color+'22':T.surface, color:i===scenIdx?s.color:T.textSec, fontSize:12, cursor:'pointer' }}>
              {s.name}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div>
          <Hdr>Sector Risk Table — {scen.name}</Hdr>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
            <thead>
              <tr>{['Sector','Score','CI','CBAM','SBTi%','Strand$bn','Ready'].map(h=><th key={h} style={{ textAlign:'left', padding:'5px 8px', borderBottom:`1px solid ${T.border}`, color:T.textMut }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {SECTORS_T1.map((s,i) => {
                const sc = +(s.score*mult).toFixed(1);
                const c = sc>7?T.red:sc>4?T.amber:T.sage;
                return (
                  <tr key={i} style={{ background:i%2?T.surface:'transparent' }}>
                    <td style={{ padding:'5px 8px', color:T.text }}>{s.name}</td>
                    <td style={{ padding:'5px 8px', color:c, fontWeight:700 }}>{sc}</td>
                    <td style={{ padding:'5px 8px', color:T.textSec }}>{s.ci}</td>
                    <td style={{ padding:'5px 8px', color:s.cbam?T.amber:T.textMut }}>{s.cbam?'Y':'N'}</td>
                    <td style={{ padding:'5px 8px', color:T.textSec }}>{s.sbti}%</td>
                    <td style={{ padding:'5px 8px', color:T.textSec }}>${s.strand}bn</td>
                    <td style={{ padding:'5px 8px', color:s.ready>60?T.sage:s.ready>35?T.amber:T.red }}>{s.ready}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div>
          <Hdr>Transition Risk Score by Sector</Hdr>
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={barData} layout="vertical" margin={{ left:90 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fill:T.textMut, fontSize:10 }} domain={[0,11]} />
              <YAxis type="category" dataKey="name" tick={{ fill:T.textSec, fontSize:10 }} width={90} />
              <Tooltip content={<TT />} />
              <Bar dataKey="score" name="Risk Score" radius={[0,4,4,0]}>
                {barData.map((d,i) => <Cell key={i} fill={d.score>7?T.red:d.score>4?T.amber:T.gold} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ── Tab 2: Carbon Price Sensitivity ── */
function Tab2({ scenIdx }) {
  const scen = NGFS_PHASE4[scenIdx];
  const id = scen.id; // NZ2050, B2C, LED, DT, DNZ, CP
  // CARBON_PRICE_PATHS is array [{year, NZ2050, B2C, LED, DT, DNZ, CP}]
  const getPriceForYear = yr => {
    const row = CARBON_PRICE_PATHS.find(r => r.year === yr);
    return row ? (row[id] || 0) : 0;
  };
  const costData = YEARS.map(yr => {
    const price = getPriceForYear(yr);
    const row = { year: yr };
    CARBON_SECTORS.forEach(s => { row[s.name] = +(s.rev * s.ci * price / 1000).toFixed(0); });
    return row;
  });
  const top3 = ['Coal Mining','Steel','Oil & Gas'];
  const clrs = [T.red, T.amber, T.teal];
  const p2025 = getPriceForYear(2025), p2050 = getPriceForYear(2050);
  const total2025 = CARBON_SECTORS.reduce((a,s)=>a+s.rev*s.ci*p2025/1000,0);
  const total2050 = CARBON_SECTORS.reduce((a,s)=>a+s.rev*s.ci*p2050/1000,0);
  const coal = CARBON_SECTORS[0];
  const coal2050 = +(coal.rev*coal.ci*p2050/1000).toFixed(0);
  const pctInc = total2025>0 ? ((total2050/total2025-1)*100).toFixed(0) : '—';
  const cellColor = v => v>5000?T.red:v>1500?T.amber:T.sage;
  return (
    <div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
        <StatCard label="Coal Mining 2050 Cost" value={`$${coal2050}M`} sub={`At $${p2050}/t (${scen.name})`} color={T.red} />
        <StatCard label="Portfolio Cost Increase" value={`${pctInc}%`} sub="2025 → 2050" color={T.amber} />
        <StatCard label="Sectors >10% EBITDA" value="4 / 6" sub="By 2030 at NZ2050" color={T.teal} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div>
          <Hdr>Carbon Cost Trajectory 2025–2050 — Top 3 Exposed Sectors</Hdr>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={costData} margin={{ right:16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fill:T.textMut, fontSize:10 }} />
              <YAxis tick={{ fill:T.textMut, fontSize:10 }} />
              <Tooltip content={<TT />} />
              <Legend wrapperStyle={{ fontSize:11, color:T.textSec }} />
              {top3.map((s,i) => <Line key={s} type="monotone" dataKey={s} stroke={clrs[i]} dot={false} strokeWidth={2} name={s} />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <Hdr>Carbon Cost ($M) by Sector and Year — {scen.name}</Hdr>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:10 }}>
              <thead>
                <tr>
                  <th style={{ textAlign:'left', padding:'5px 6px', color:T.textMut, borderBottom:`1px solid ${T.border}` }}>Sector</th>
                  {YEARS.map(y=><th key={y} style={{ padding:'5px 6px', color:T.textMut, borderBottom:`1px solid ${T.border}` }}>{y}</th>)}
                </tr>
              </thead>
              <tbody>
                {CARBON_SECTORS.map((s,i)=>(
                  <tr key={i}>
                    <td style={{ padding:'5px 6px', color:T.text }}>{s.name}</td>
                    {YEARS.map(yr=>{
                      const v = +(s.rev*s.ci*getPriceForYear(yr)/1000).toFixed(0);
                      return <td key={yr} style={{ padding:'5px 6px', color:cellColor(v), fontWeight:600, textAlign:'right' }}>${v}M</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Tab 3: CBAM Compliance Engine ── */
function Tab3() {
  const [priceIdx, setPriceIdx] = useState(1);
  const price = CBAM_PRICES[priceIdx];
  const barData = CBAM_COMPANIES.map(c => ({
    name: c.name,
    cost: computeCBAMCost(CBAM_META[c.product]||1, price, c.tonnage),
  }));
  const totalCost = barData.reduce((a,d)=>a+d.cost,0);
  return (
    <div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
        <StatCard label="Total CBAM Revenue" value="€14bn/yr" sub="At €90/t baseline" color={T.teal} />
        <StatCard label="Most Affected Sector" value="Steel 38%" sub="Share of CBAM burden" color={T.amber} />
        <StatCard label="Phase-in Completion" value="2026" sub="EU Reg 2023/956" color={T.sage} />
      </div>
      <div style={{ marginBottom:14 }}>
        <span style={{ fontSize:11, color:T.textMut, marginRight:10 }}>Carbon Price Scenario:</span>
        {CBAM_PRICES.map((p,i) => (
          <button key={i} onClick={() => setPriceIdx(i)} style={{ marginRight:8, padding:'5px 12px', borderRadius:6, border:`1px solid ${i===priceIdx?ACCENT:T.border}`, background:i===priceIdx?ACCENT+'22':T.surface, color:i===priceIdx?ACCENT:T.textSec, fontSize:12, cursor:'pointer' }}>
            €{p}/t
          </button>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div>
          <Hdr>CBAM Cost by Entity at €{price}/t (€M)</Hdr>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
            <thead>
              <tr>{['Entity','Product','Kt/yr','Emb.CO2','CBAM €M','Impact'].map(h=><th key={h} style={{ textAlign:'left', padding:'5px 6px', borderBottom:`1px solid ${T.border}`, color:T.textMut }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {CBAM_COMPANIES.map((c,i) => {
                const emb = CBAM_META[c.product]||1;
                const cost = computeCBAMCost(emb, price, c.tonnage);
                const ic = cost>200?T.red:cost>50?T.amber:T.sage;
                const imp = cost>200?'High':cost>50?'Medium':'Low';
                return (
                  <tr key={i} style={{ background:i%2?T.surface:'transparent' }}>
                    <td style={{ padding:'5px 6px', color:T.text }}>{c.name}</td>
                    <td style={{ padding:'5px 6px', color:T.textSec }}>{c.product}</td>
                    <td style={{ padding:'5px 6px', color:T.textSec }}>{c.tonnage}</td>
                    <td style={{ padding:'5px 6px', color:T.textSec }}>{emb}</td>
                    <td style={{ padding:'5px 6px', color:ic, fontWeight:700 }}>€{cost}M</td>
                    <td style={{ padding:'5px 6px', color:ic }}>{imp}</td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan={4} style={{ padding:'6px 6px', color:T.textMut, fontWeight:600 }}>Total at €{price}/t</td>
                <td style={{ padding:'6px 6px', color:ACCENT, fontWeight:700 }}>€{totalCost.toFixed(0)}M</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <Hdr>CBAM Costs at €{price}/t per Entity</Hdr>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ bottom:40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fill:T.textMut, fontSize:9 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fill:T.textMut, fontSize:10 }} />
              <Tooltip content={<TT />} formatter={v=>`€${v}M`} />
              <Bar dataKey="cost" name="CBAM €M" radius={[4,4,0,0]}>
                {barData.map((d,i) => <Cell key={i} fill={d.cost>200?T.red:d.cost>50?T.amber:T.sage} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ── Tab 4: Scope 3 & PCAF ── */
function Tab4() {
  const avgScore = (PCAF_CATS.reduce((a,c)=>a+c.score,0)/PCAF_CATS.length).toFixed(1);
  const barData = PCAF_CATS.map((c,i) => ({ name:c.name.split(' ')[0]+(c.name.includes('(')?' (…)':''), emissions:c.emissions, idx:i }));
  const BAR_CLRS = [T.red, T.amber, T.teal, T.sage, T.gold, '#8b5cf6','#06b6d4','#f43f5e'];
  const scopeData = [
    { name:'Scope 1', s1:22.4, s2:0,    s3:0    },
    { name:'Scope 2', s1:0,    s2:18.6, s3:0    },
    { name:'S3 Cat15',s1:0,    s2:0,    s3:43.0 },
  ];
  return (
    <div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
        <StatCard label="Total Financed Emissions" value="84 MtCO2" sub="PCAF Standard 2024" color={T.teal} />
        <StatCard label="WACI" value="142 tCO2/$M" sub="Weighted avg carbon intensity" color={T.amber} />
        <StatCard label="Data Quality Avg" value={`${avgScore}/5`} sub="PCAF score (1=best)" color={T.sage} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div>
          <Hdr>Financed Emissions by Asset Class (MtCO2e)</Hdr>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ bottom:40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fill:T.textMut, fontSize:9 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fill:T.textMut, fontSize:10 }} />
              <Tooltip content={<TT />} />
              <Bar dataKey="emissions" name="MtCO2e" radius={[4,4,0,0]}>
                {barData.map((d,i) => <Cell key={i} fill={BAR_CLRS[i%BAR_CLRS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:11, color:T.textMut, marginBottom:5 }}>PCAF Data Quality Scale</div>
            {[['1','Primary verified data'],['2','Primary unverified'],['3','Third-party data'],['4','Proxy / sector avg'],['5','Estimated / modelled']].map(([s,d]) => (
              <div key={s} style={{ display:'flex', gap:8, marginBottom:3, fontSize:11 }}>
                <span style={{ color:ACCENT, fontWeight:700, minWidth:14 }}>{s}</span>
                <span style={{ color:T.textSec }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Hdr>PCAF Asset Class Detail</Hdr>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
            <thead>
              <tr>{['Asset Class','Score','Mt CO2e','%','Data%'].map(h=><th key={h} style={{ textAlign:'left', padding:'5px 6px', borderBottom:`1px solid ${T.border}`, color:T.textMut }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {PCAF_CATS.map((c,i) => (
                <tr key={i} style={{ background:i%2?T.surface:'transparent' }}>
                  <td style={{ padding:'5px 6px', color:T.text, fontSize:10 }}>{c.name}</td>
                  <td style={{ padding:'5px 6px', color:c.score<=2?T.sage:c.score<=3?T.amber:T.red }}>{c.score}</td>
                  <td style={{ padding:'5px 6px', color:T.textSec }}>{c.emissions}</td>
                  <td style={{ padding:'5px 6px', color:T.textSec }}>{c.pct}%</td>
                  <td style={{ padding:'5px 6px', color:c.avail>70?T.sage:c.avail>50?T.amber:T.red }}>{c.avail}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop:14 }}>
            <Hdr>Portfolio Financed Emissions Waterfall (MtCO2)</Hdr>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={scopeData} margin={{ right:8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill:T.textMut, fontSize:10 }} />
                <YAxis tick={{ fill:T.textMut, fontSize:10 }} />
                <Tooltip content={<TT />} />
                <Bar dataKey="s1" name="Scope 1" stackId="a" fill={T.red} />
                <Bar dataKey="s2" name="Scope 2" stackId="a" fill={T.amber} />
                <Bar dataKey="s3" name="S3 Cat15" stackId="a" fill={T.teal} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Tab 5: SDA Sector Pathways ── */
function Tab5() {
  const [activeSector, setActiveSector] = useState('aviation');
  const selected = SDA_PATHWAYS.find(s => s.sector===activeSector) || SDA_PATHWAYS[0];
  const gapData = SDA_PATHWAYS.map(s => ({
    name: s.label,
    gap: +((s.current/s.target2030-1)*100).toFixed(1),
  }));
  const pathData = [
    { year:2020, intensity:selected.baseline2020 },
    { year:2030, intensity:selected.target2030   },
    { year:2040, intensity:selected.target2040   },
    { year:2050, intensity:selected.target2050   },
  ];
  const onTrack = SDA_PATHWAYS.filter(s => s.current < s.target2030*1.1).length;
  const avgOver = (SDA_PATHWAYS.reduce((a,s) => a+(s.current/s.target2030-1)*100, 0)/SDA_PATHWAYS.length).toFixed(0);
  const mostOff = SDA_PATHWAYS.reduce((a,b) => b.current/b.target2030 > a.current/a.target2030 ? b : a);
  return (
    <div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
        <StatCard label="Sectors On Track 2030" value={`${onTrack}/8`} sub="Within 10% of target" color={T.sage} />
        <StatCard label="Avg 2030 Overshoot" value={`${avgOver}%`} sub="vs NZE pathway" color={T.amber} />
        <StatCard label="Most Off-Track" value={mostOff.label} sub={`${((mostOff.current/mostOff.target2030-1)*100).toFixed(0)}% over target`} color={T.red} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div>
          <Hdr>2030 Alignment Gap (% Overshoot vs NZE Target)</Hdr>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={gapData} margin={{ bottom:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fill:T.textMut, fontSize:10 }} />
              <YAxis tick={{ fill:T.textMut, fontSize:10 }} unit="%" />
              <Tooltip content={<TT />} formatter={v=>`${v}%`} />
              <Bar dataKey="gap" name="Overshoot %" radius={[4,4,0,0]}>
                {gapData.map((d,i) => <Cell key={i} fill={d.gap>50?T.red:d.gap>20?T.amber:T.sage} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop:10 }}>
            <div style={{ fontSize:11, color:T.textMut, marginBottom:6 }}>Click sector to view decarbonization pathway:</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {SDA_PATHWAYS.map(s => (
                <button key={s.sector} onClick={() => setActiveSector(s.sector)} style={{ padding:'4px 10px', borderRadius:5, border:`1px solid ${activeSector===s.sector?ACCENT:T.border}`, background:activeSector===s.sector?ACCENT+'22':T.surface, color:activeSector===s.sector?ACCENT:T.textSec, fontSize:11, cursor:'pointer' }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <Hdr>{selected.label} Decarbonization Pathway ({selected.unit})</Hdr>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={pathData} margin={{ right:16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fill:T.textMut, fontSize:10 }} />
              <YAxis tick={{ fill:T.textMut, fontSize:10 }} />
              <Tooltip content={<TT />} />
              <Line type="monotone" dataKey="intensity" stroke={ACCENT} strokeWidth={2} dot={{ fill:ACCENT, r:4 }} name={selected.unit} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ marginTop:12 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:10 }}>
              <thead>
                <tr>{['Sector','Unit','Base 2020','T2030','Current','Gap%','On Track'].map(h=><th key={h} style={{ textAlign:'left', padding:'4px 5px', borderBottom:`1px solid ${T.border}`, color:T.textMut }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {SDA_PATHWAYS.map((s,i) => {
                  const gap = +((s.current/s.target2030-1)*100).toFixed(0);
                  const ot = s.current < s.target2030*1.1;
                  return (
                    <tr key={i} style={{ background:i%2?T.surface:'transparent' }}>
                      <td style={{ padding:'4px 5px', color:T.text }}>{s.label}</td>
                      <td style={{ padding:'4px 5px', color:T.textMut, fontSize:9 }}>{s.unit}</td>
                      <td style={{ padding:'4px 5px', color:T.textSec }}>{s.baseline2020}</td>
                      <td style={{ padding:'4px 5px', color:T.textSec }}>{s.target2030}</td>
                      <td style={{ padding:'4px 5px', color:T.text }}>{s.current}</td>
                      <td style={{ padding:'4px 5px', color:gap>50?T.red:gap>20?T.amber:T.sage }}>{gap}%</td>
                      <td style={{ padding:'4px 5px', color:ot?T.sage:T.red }}>{ot?'Y':'N'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Tab 6: Policy & Litigation Risk ── */
function Tab6() {
  const areaData = Array.from({ length:24 }, (_,i) => ({ month:`M${i+1}`, index:45+sr(i*7)*30 }));
  return (
    <div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
        <StatCard label="Highest Risk Driver" value="Carbon Pricing" sub="82% materialisation by 2030" color={T.red} />
        <StatCard label="Max Financial Impact" value="$60bn" sub="Technology Disruption" color={T.amber} />
        <StatCard label="Active Litigation" value="1,200+" sub="Cases globally (2024)" color={T.teal} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <div>
          <Hdr>Policy Risk Materialisation Probability by 2030</Hdr>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={POLICY_DRIVERS.map(d=>({ name:d.name.length>20?d.name.slice(0,18)+'…':d.name, prob:d.prob }))} margin={{ bottom:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fill:T.textMut, fontSize:9 }} angle={-20} textAnchor="end" interval={0} height={50} />
              <YAxis tick={{ fill:T.textMut, fontSize:10 }} unit="%" domain={[0,100]} />
              <Tooltip content={<TT />} formatter={v=>`${v}%`} />
              <Bar dataKey="prob" name="Probability %" radius={[4,4,0,0]}>
                {POLICY_DRIVERS.map((d,i) => <Cell key={i} fill={d.prob>70?T.red:d.prob>40?T.amber:T.gold} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <Hdr>24-Month Transition Risk Index</Hdr>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={areaData} margin={{ right:8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fill:T.textMut, fontSize:9 }} interval={3} />
              <YAxis tick={{ fill:T.textMut, fontSize:10 }} domain={[40,80]} />
              <Tooltip content={<TT />} />
              <Area type="monotone" dataKey="index" stroke={ACCENT} fill={ACCENT+'33'} strokeWidth={2} name="Risk Index" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ marginBottom:14 }}>
        <Hdr>Transition Risk Policy Drivers</Hdr>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr>{['Driver','Prob 2030','Impact $bn','Sectors','Trend'].map(h=><th key={h} style={{ textAlign:'left', padding:'5px 8px', borderBottom:`1px solid ${T.border}`, color:T.textMut }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {POLICY_DRIVERS.map((d,i) => {
              const tc = d.trend==='worsening'?T.red:d.trend==='improving'?T.sage:T.amber;
              return (
                <tr key={i} style={{ background:i%2?T.surface:'transparent' }}>
                  <td style={{ padding:'5px 8px', color:T.text }}>{d.name}</td>
                  <td style={{ padding:'5px 8px', color:d.prob>70?T.red:d.prob>40?T.amber:T.sage, fontWeight:700 }}>{d.prob}%</td>
                  <td style={{ padding:'5px 8px', color:T.textSec }}>${d.impLo}–{d.impHi}bn</td>
                  <td style={{ padding:'5px 8px', color:T.textSec, fontSize:10 }}>{d.sectors}</td>
                  <td style={{ padding:'5px 8px', color:tc }}>{d.trend}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginBottom:14 }}>
        <Hdr>Climate Litigation Tracker</Hdr>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr>{['Case','Sector','Jurisdiction','Claim $M','Status','Precedent'].map(h=><th key={h} style={{ textAlign:'left', padding:'5px 8px', borderBottom:`1px solid ${T.border}`, color:T.textMut }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {LITIGATION.map((c,i) => (
              <tr key={i} style={{ background:i%2?T.surface:'transparent' }}>
                <td style={{ padding:'5px 8px', color:T.text }}>{c.case}</td>
                <td style={{ padding:'5px 8px', color:T.textSec }}>{c.sector}</td>
                <td style={{ padding:'5px 8px', color:T.textSec }}>{c.juris}</td>
                <td style={{ padding:'5px 8px', color:c.claim>1000?T.red:c.claim>300?T.amber:T.textSec }}>{c.claim?`$${c.claim}M`:'—'}</td>
                <td style={{ padding:'5px 8px', color:T.teal }}>{c.status}</td>
                <td style={{ padding:'5px 8px', color:T.textMut, fontSize:10 }}>{c.prec}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ background:T.navy, border:`1px solid ${T.border}`, borderRadius:8, padding:'10px 16px', fontSize:12, color:T.textSec }}>
        Cross-module: See <a href="/ngfs-scenarios" style={{ color:ACCENT }}>NGFS Scenarios</a> for Phase IV explorer&nbsp;|&nbsp;<a href="/stress-test-orchestrator" style={{ color:ACCENT }}>Stress Test Orchestrator</a> for portfolio-level shocks
      </div>
    </div>
  );
}

/* ── Root ── */
export default function ClimateTransitionRiskPage() {
  const [tab, setTab] = useState(0);
  const [scenIdx, setScenIdx] = useState(0);
  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text, padding:24 }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>Climate Transition Risk</h1>
        <p style={{ fontSize:13, color:T.textSec, margin:'4px 0 0' }}>CBAM · Scope 3 / PCAF · SDA Sector Pathways · NGFS Phase IV</p>
      </div>
      <div style={{ display:'flex', gap:4, marginBottom:20, flexWrap:'wrap' }}>
        {TABS.map((t,i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding:'8px 14px', borderRadius:7, border:`1px solid ${i===tab?ACCENT:T.border}`, background:i===tab?ACCENT+'22':T.surface, color:i===tab?ACCENT:T.textSec, fontSize:12, cursor:'pointer', fontWeight:i===tab?600:400 }}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
        {tab===0 && <Tab1 scenIdx={scenIdx} setScenIdx={setScenIdx} />}
        {tab===1 && <Tab2 scenIdx={scenIdx} />}
        {tab===2 && <Tab3 />}
        {tab===3 && <Tab4 />}
        {tab===4 && <Tab5 />}
        {tab===5 && <Tab6 />}
      </div>
    </div>
  );
}
