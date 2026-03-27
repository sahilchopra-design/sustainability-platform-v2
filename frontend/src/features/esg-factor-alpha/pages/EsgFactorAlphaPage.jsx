import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7',
  border:'#e5e0d8', borderL:'#d5cfc5',
  navy:'#1b3a5c', navyL:'#2c5a8c',
  gold:'#c5a96a', goldL:'#d4be8a',
  sage:'#5a8a6a', sageL:'#7ba67d',
  text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706',
  card:'0 1px 4px rgba(27,58,92,0.06)',
  cardH:'0 4px 16px rgba(27,58,92,0.1)',
  font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

// ─── Data ────────────────────────────────────────────────────────────────────

const FACTORS = [
  { id:'esg_q',  name:'ESG Quality',          alpha:187, ic:0.09, ir:0.71, hit:54, dd:-8.2,  vCorr:0.12, mCorr:0.18, qCorr:0.41, crowd:8.2, crowdTrend:'Increasing' },
  { id:'carbon', name:'Carbon Efficiency',     alpha:142, ic:0.07, ir:0.58, hit:52, dd:-11.4, vCorr:0.08, mCorr:0.22, qCorr:0.28, crowd:7.1, crowdTrend:'Increasing' },
  { id:'green',  name:'Green Revenue',         alpha:218, ic:0.10, ir:0.82, hit:56, dd:-14.6, vCorr:0.05, mCorr:0.31, qCorr:0.22, crowd:7.4, crowdTrend:'Stable'     },
  { id:'board',  name:'Board Quality',         alpha: 94, ic:0.05, ir:0.44, hit:51, dd:-6.8,  vCorr:0.19, mCorr:0.14, qCorr:0.55, crowd:4.8, crowdTrend:'Stable'     },
  { id:'labour', name:'Labour Standards',      alpha: 76, ic:0.04, ir:0.38, hit:51, dd:-7.2,  vCorr:0.11, mCorr:0.11, qCorr:0.32, crowd:3.9, crowdTrend:'Stable'     },
  { id:'water',  name:'Water Efficiency',      alpha: 88, ic:0.05, ir:0.42, hit:52, dd:-9.1,  vCorr:0.09, mCorr:0.16, qCorr:0.24, crowd:3.2, crowdTrend:'Decreasing' },
  { id:'supply', name:'Supply Chain ESG',      alpha:112, ic:0.06, ir:0.51, hit:53, dd:-10.3, vCorr:0.14, mCorr:0.19, qCorr:0.30, crowd:5.1, crowdTrend:'Stable'     },
  { id:'esgmom',name:'ESG Momentum',          alpha:165, ic:0.08, ir:0.66, hit:54, dd:-13.1, vCorr:0.04, mCorr:0.62, qCorr:0.18, crowd:6.3, crowdTrend:'Increasing' },
  { id:'contro', name:'Controversy-Free',      alpha: 57, ic:0.03, ir:0.31, hit:50, dd:-5.4,  vCorr:0.16, mCorr:0.08, qCorr:0.44, crowd:4.4, crowdTrend:'Stable'     },
  { id:'bio',    name:'Biodiversity Footprint',alpha: 43, ic:0.02, ir:0.24, hit:50, dd:-4.9,  vCorr:0.07, mCorr:0.10, qCorr:0.19, crowd:2.8, crowdTrend:'Decreasing' },
];

const FACTOR_RETURNS_SORTED = [...FACTORS].sort((a,b) => b.alpha - a.alpha).map(f => ({
  name: f.name.length > 14 ? f.name.slice(0,13)+'…' : f.name,
  alpha: f.alpha,
}));

const CORR_MATRIX = [
  [1.00, 0.28, 0.22, 0.35, 0.29, 0.18, 0.24, 0.17, 0.31, 0.14],
  [0.28, 1.00, 0.19, 0.21, 0.16, 0.23, 0.27, 0.11, 0.18, 0.20],
  [0.22, 0.19, 1.00, 0.17, 0.14, 0.13, 0.19, 0.25, 0.12, 0.16],
  [0.35, 0.21, 0.17, 1.00, 0.33, 0.19, 0.22, 0.10, 0.38, 0.13],
  [0.29, 0.16, 0.14, 0.33, 1.00, 0.22, 0.31, 0.09, 0.27, 0.11],
  [0.18, 0.23, 0.13, 0.19, 0.22, 1.00, 0.26, 0.12, 0.16, 0.34],
  [0.24, 0.27, 0.19, 0.22, 0.31, 0.26, 1.00, 0.14, 0.20, 0.18],
  [0.17, 0.11, 0.25, 0.10, 0.09, 0.12, 0.14, 1.00, 0.08, 0.10],
  [0.31, 0.18, 0.12, 0.38, 0.27, 0.16, 0.20, 0.08, 1.00, 0.15],
  [0.14, 0.20, 0.16, 0.13, 0.11, 0.34, 0.18, 0.10, 0.15, 1.00],
];

const BARRA_STOCKS = [
  { name:'Microsoft',     esgQ:0.82, carbon:0.74, greenR:0.61, rsq:0.74, idioVol:8.2  },
  { name:'Ørsted',        esgQ:0.91, carbon:0.95, greenR:0.92, rsq:0.81, idioVol:11.4 },
  { name:'Vestas Wind',   esgQ:0.88, carbon:0.91, greenR:0.89, rsq:0.79, idioVol:13.2 },
  { name:'Apple',         esgQ:0.76, carbon:0.68, greenR:0.44, rsq:0.71, idioVol:7.8  },
  { name:'Schneider Elec',esgQ:0.84, carbon:0.79, greenR:0.72, rsq:0.76, idioVol:9.1  },
  { name:'Unilever',      esgQ:0.78, carbon:0.72, greenR:0.55, rsq:0.69, idioVol:7.4  },
  { name:'Ecolab',        esgQ:0.72, carbon:0.66, greenR:0.48, rsq:0.65, idioVol:8.9  },
  { name:'Prologis',      esgQ:0.69, carbon:0.61, greenR:0.42, rsq:0.63, idioVol:10.1 },
  { name:'NextEra Energy',esgQ:0.87, carbon:0.88, greenR:0.84, rsq:0.78, idioVol:9.6  },
  { name:'Neste',         esgQ:0.86, carbon:0.84, greenR:0.88, rsq:0.77, idioVol:12.4 },
  { name:'Siemens',       esgQ:0.73, carbon:0.69, greenR:0.58, rsq:0.67, idioVol:8.6  },
  { name:'ASML',          esgQ:0.77, carbon:0.71, greenR:0.52, rsq:0.70, idioVol:9.2  },
  { name:'Danaher',       esgQ:0.74, carbon:0.65, greenR:0.46, rsq:0.66, idioVol:7.9  },
  { name:'Novozymes',     esgQ:0.82, carbon:0.76, greenR:0.68, rsq:0.72, idioVol:10.3 },
  { name:'Trane Tech.',   esgQ:0.79, carbon:0.73, greenR:0.62, rsq:0.71, idioVol:8.4  },
  { name:'Rockwell Auto.',esgQ:0.71, carbon:0.64, greenR:0.44, rsq:0.64, idioVol:9.0  },
  { name:'Ball Corp.',    esgQ:0.68, carbon:0.62, greenR:0.49, rsq:0.62, idioVol:8.7  },
  { name:'American Water',esgQ:0.75, carbon:0.70, greenR:0.55, rsq:0.68, idioVol:7.6  },
  { name:'Xylem',         esgQ:0.80, carbon:0.75, greenR:0.64, rsq:0.73, idioVol:10.8 },
  { name:'Trimble',       esgQ:0.66, carbon:0.58, greenR:0.41, rsq:0.60, idioVol:11.2 },
];

const ATTRIBUTION_BAR = [
  { name:'ESG Quality',          value:1.2,  fill: T.sage    },
  { name:'Carbon Effic.',        value:0.8,  fill: T.sageL   },
  { name:'Green Revenue',        value:0.6,  fill: T.navyL   },
  { name:'Traditional Factors',  value:0.9,  fill: T.gold    },
  { name:'Sector Alloc.',        value:-0.3, fill: T.red     },
  { name:'Stock Selection',      value:0.1,  fill: T.amber   },
  { name:'Residual',             value:-0.1, fill: T.textMut },
];

const QUARTERLY_ATTR = [
  { q:'Q1 2024', esgQ:0.34, carbon:0.22, greenR:0.18, trad:0.28, sector:-0.12, stock:0.04 },
  { q:'Q2 2024', esgQ:0.31, carbon:0.21, greenR:0.17, trad:0.24, sector:-0.08, stock:0.02 },
  { q:'Q3 2024', esgQ:0.28, carbon:0.18, greenR:0.13, trad:0.22, sector:-0.06, stock:0.03 },
  { q:'Q4 2024', esgQ:0.27, carbon:0.19, greenR:0.12, trad:0.16, sector:-0.07, stock:0.01 },
];

const ROLLING_ALPHA = [
  { period:'Q1 2021', alpha:1.4 }, { period:'Q2 2021', alpha:1.9 }, { period:'Q3 2021', alpha:2.3 },
  { period:'Q4 2021', alpha:2.8 }, { period:'Q1 2022', alpha:3.4 }, { period:'Q2 2022', alpha:4.1 },
  { period:'Q3 2022', alpha:2.1 }, { period:'Q4 2022', alpha:0.8 }, { period:'Q1 2023', alpha:1.6 },
  { period:'Q2 2023', alpha:2.2 }, { period:'Q3 2023', alpha:2.5 }, { period:'Q4 2023', alpha:2.4 },
  { period:'Q1 2024', alpha:2.7 }, { period:'Q2 2024', alpha:2.9 }, { period:'Q3 2024', alpha:2.6 },
  { period:'Q4 2024', alpha:2.6 },
];

const CROWDING_TREND = Array.from({length:21}, (_,i) => {
  const yr = 2020 + Math.floor(i/4);
  const q  = (i%4)+1;
  const base = 3.2 + i*0.25;
  return { period:`${yr}-Q${q}`, score: +Math.min(8.2, base + (Math.random()*0.3-0.15)).toFixed(1) };
}).map((d,i,arr) => ({ ...d, score: i===20 ? 8.2 : arr[i].score }));

const PORTFOLIO_HOLDINGS = [
  { name:'Ørsted',         wt:6.2, sector:'Utilities',   esgQ:0.91, carbon:0.95, greenR:0.92, board:0.84 },
  { name:'NextEra Energy', wt:5.8, sector:'Utilities',   esgQ:0.87, carbon:0.88, greenR:0.84, board:0.79 },
  { name:'Vestas Wind',    wt:5.4, sector:'Industrials', esgQ:0.88, carbon:0.91, greenR:0.89, board:0.76 },
  { name:'Neste',          wt:5.1, sector:'Energy',      esgQ:0.86, carbon:0.84, greenR:0.88, board:0.72 },
  { name:'Schneider Elec', wt:4.8, sector:'Industrials', esgQ:0.84, carbon:0.79, greenR:0.72, board:0.80 },
  { name:'Microsoft',      wt:4.5, sector:'Technology',  esgQ:0.82, carbon:0.74, greenR:0.61, board:0.77 },
  { name:'Novozymes',      wt:4.2, sector:'Materials',   esgQ:0.82, carbon:0.76, greenR:0.68, board:0.73 },
  { name:'Xylem',          wt:3.9, sector:'Industrials', esgQ:0.80, carbon:0.75, greenR:0.64, board:0.71 },
  { name:'Unilever',       wt:3.7, sector:'Cons. Staples',esgQ:0.78, carbon:0.72, greenR:0.55, board:0.75 },
  { name:'ASML',           wt:3.5, sector:'Technology',  esgQ:0.77, carbon:0.71, greenR:0.52, board:0.74 },
  { name:'Apple',          wt:3.4, sector:'Technology',  esgQ:0.76, carbon:0.68, greenR:0.44, board:0.76 },
  { name:'American Water', wt:3.2, sector:'Utilities',   esgQ:0.75, carbon:0.70, greenR:0.55, board:0.70 },
  { name:'Trane Tech.',    wt:3.0, sector:'Industrials', esgQ:0.79, carbon:0.73, greenR:0.62, board:0.69 },
  { name:'Siemens',        wt:2.8, sector:'Industrials', esgQ:0.73, carbon:0.69, greenR:0.58, board:0.71 },
  { name:'Danaher',        wt:2.6, sector:'Healthcare',  esgQ:0.74, carbon:0.65, greenR:0.46, board:0.72 },
];

const FRONTIER = [
  { te:1.0, esgLoad:0.48 }, { te:1.5, esgLoad:0.56 },
  { te:2.0, esgLoad:0.65 }, { te:2.5, esgLoad:0.71 },
  { te:3.0, esgLoad:0.76 }, { te:3.5, esgLoad:0.79 },
  { te:4.0, esgLoad:0.80 }, { te:4.5, esgLoad:0.81 },
];

const generateLiveData = () => {
  const data = [];
  const bases = { 'Green Rev':2.8, 'Carbon Eff':3.1, 'ESG Mom':2.0, 'ESG Quality':1.4,
                  'Board Q':  -0.2, 'Water':0.9, 'Labour':0.6, 'Supply':1.1, 'Contrv':0.4, 'Biodiv':0.3 };
  for (let d = 0; d < 60; d++) {
    const row = { day: d+1 };
    Object.keys(bases).forEach(k => {
      row[k] = +(bases[k]/60*d + (Math.random()-0.49)*0.18).toFixed(2);
    });
    data.push(row);
  }
  return data;
};
const LIVE_DATA = generateLiveData();

const LIVE_STATS = [
  { name:'Green Revenue',     ytd:3.8, m1:1.1, m3:2.4, yr:6.2,  mom:true  },
  { name:'Carbon Efficiency', ytd:4.2, m1:1.3, m3:2.8, yr:5.8,  mom:true  },
  { name:'ESG Momentum',      ytd:2.8, m1:0.8, m3:1.9, yr:4.4,  mom:true  },
  { name:'ESG Quality',       ytd:1.6, m1:0.4, m3:0.9, yr:3.2,  mom:true  },
  { name:'Supply Chain ESG',  ytd:1.2, m1:0.3, m3:0.8, yr:2.8,  mom:true  },
  { name:'Water Efficiency',  ytd:1.0, m1:0.2, m3:0.6, yr:2.2,  mom:true  },
  { name:'Labour Standards',  ytd:0.7, m1:0.1, m3:0.4, yr:1.8,  mom:false },
  { name:'Controversy-Free',  ytd:0.4, m1:0.0, m3:0.2, yr:1.4,  mom:false },
  { name:'Biodiversity',      ytd:0.3, m1:-0.1,m3:0.1, yr:1.0,  mom:false },
  { name:'Board Quality',     ytd:-0.4,m1:-0.3,m3:-0.6,yr: 0.8, mom:false },
];

// ─── Helper components ───────────────────────────────────────────────────────

const Card = ({ children, style }) => (
  <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:8,
    boxShadow: T.card, padding:'18px 20px', ...style }}>
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontWeight:700, fontSize:13, color:T.text, letterSpacing:'0.04em',
    textTransform:'uppercase', marginBottom:12, borderBottom:`2px solid ${T.gold}`,
    paddingBottom:6 }}>
    {children}
  </div>
);

const Kpi = ({ label, value, sub, color }) => (
  <Card style={{ flex:1, minWidth:160 }}>
    <div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:800, color: color||T.navy }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textSec, marginTop:2 }}>{sub}</div>}
  </Card>
);

const Th = ({ children, right }) => (
  <th style={{ padding:'6px 10px', background:T.surfaceH, color:T.textSec,
    fontSize:11, fontWeight:600, textAlign: right?'right':'left',
    borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>
    {children}
  </th>
);
const Td = ({ children, right, mono, bold, color }) => (
  <td style={{ padding:'5px 10px', fontSize:12, color: color||T.text,
    textAlign: right?'right':'left', fontFamily: mono?'monospace':T.font,
    fontWeight: bold?700:400, borderBottom:`1px solid ${T.border}` }}>
    {children}
  </td>
);

const corrColor = v => {
  if (v >= 0.9) return '#1b3a5c';
  if (v >= 0.6) return '#2c5a8c';
  if (v >= 0.4) return '#4a7ab0';
  if (v >= 0.25) return '#7ba8cc';
  return '#c8dcea';
};

const fmt = (v, sign=false) =>
  (sign && v>0 ? '+' : '') + v.toFixed(v >= 10 || v <= -10 ? 0 : 2);

// ─── Tabs ────────────────────────────────────────────────────────────────────

const TABS = ['Factor Universe','Factor Model','Alpha Attribution','Crowding Monitor','Portfolio Construction','Live Performance'];

// ─── Tab 1 ───────────────────────────────────────────────────────────────────

const Tab1 = () => (
  <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
    <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
      <Kpi label="Universe Size"       value="10 Factors" sub="ESG thematic factors"          />
      <Kpi label="Best Factor Alpha"   value="+218 bps"   sub="Green Revenue (annualised)"    color={T.green}/>
      <Kpi label="Composite IC"        value="0.09"       sub="Avg info. coefficient"         color={T.navy}/>
      <Kpi label="Avg Hit Rate"        value="52.5%"      sub="Cross-factor average"          />
    </div>

    <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
      <Card style={{ flex:'2 1 380px' }}>
        <SectionTitle>Factor Returns — Annualised Alpha (bps)</SectionTitle>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={FACTOR_RETURNS_SORTED} margin={{ top:4, right:10, left:0, bottom:50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize:10, fill:T.textSec }} angle={-35} textAnchor="end" />
            <YAxis tick={{ fontSize:10, fill:T.textSec }} />
            <Tooltip formatter={v=>[`+${v} bps`,'Alpha']} />
            <Bar dataKey="alpha" radius={[4,4,0,0]}>
              {FACTOR_RETURNS_SORTED.map((_, i) => (
                <Cell key={i} fill={i < 3 ? T.sage : i < 6 ? T.navyL : T.gold} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{ flex:'1 1 280px', overflowX:'auto' }}>
        <SectionTitle>Factor Statistics</SectionTitle>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr>
              <Th>Factor</Th>
              <Th right>IC</Th>
              <Th right>IR</Th>
              <Th right>Hit%</Th>
              <Th right>MaxDD</Th>
            </tr>
          </thead>
          <tbody>
            {FACTORS.map(f => (
              <tr key={f.id}>
                <Td><span style={{ fontWeight:600 }}>{f.name}</span></Td>
                <Td right mono>{f.ic.toFixed(2)}</Td>
                <Td right mono>{f.ir.toFixed(2)}</Td>
                <Td right mono>{f.hit}%</Td>
                <Td right mono color={T.red}>{f.dd}%</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>

    <Card>
      <SectionTitle>Factor Correlation Matrix (10×10)</SectionTitle>
      <div style={{ overflowX:'auto' }}>
        <table style={{ borderCollapse:'collapse', fontSize:10, minWidth:560 }}>
          <thead>
            <tr>
              <th style={{ padding:'4px 6px' }}></th>
              {FACTORS.map(f => (
                <th key={f.id} style={{ padding:'4px 6px', color:T.textSec, fontWeight:600, whiteSpace:'nowrap',
                  maxWidth:60, overflow:'hidden', textOverflow:'ellipsis' }}>
                  {f.name.slice(0,10)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTORS.map((rf, ri) => (
              <tr key={rf.id}>
                <td style={{ padding:'4px 6px', fontWeight:600, color:T.textSec, whiteSpace:'nowrap', fontSize:10 }}>
                  {rf.name.slice(0,12)}
                </td>
                {FACTORS.map((cf, ci) => {
                  const v = CORR_MATRIX[ri][ci];
                  const bg = corrColor(v);
                  return (
                    <td key={cf.id} style={{ padding:'5px 8px', textAlign:'center', background:bg,
                      color: v >= 0.4 ? '#fff' : T.navy, fontWeight: ri===ci ? 800:400, borderRadius:2 }}>
                      {v.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop:10, fontSize:11, color:T.textMut }}>
        Low inter-factor correlations (0.10–0.35) confirm diversification benefit of multi-factor ESG approach.
      </div>
    </Card>

    <Card>
      <SectionTitle>Correlation to Traditional Factors</SectionTitle>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <Th>Factor</Th>
            <Th right>vs Value</Th>
            <Th right>vs Momentum</Th>
            <Th right>vs Quality</Th>
            <Th right>+Alpha/yr</Th>
          </tr>
        </thead>
        <tbody>
          {FACTORS.map(f => (
            <tr key={f.id}>
              <Td bold>{f.name}</Td>
              <Td right mono>{f.vCorr.toFixed(2)}</Td>
              <Td right mono>{f.mCorr.toFixed(2)}</Td>
              <Td right mono>{f.qCorr.toFixed(2)}</Td>
              <Td right bold color={T.green}>+{f.alpha} bps</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);

// ─── Tab 2 ───────────────────────────────────────────────────────────────────

const COV_MATRIX = [
  { factor:'ESG Quality',     esgQ:0.0142, carbon:0.0041, greenR:0.0028, board:0.0049 },
  { factor:'Carbon Effic.',   esgQ:0.0041, carbon:0.0189, greenR:0.0035, board:0.0031 },
  { factor:'Green Revenue',   esgQ:0.0028, carbon:0.0035, greenR:0.0214, board:0.0024 },
  { factor:'Board Quality',   esgQ:0.0049, carbon:0.0031, greenR:0.0024, board:0.0098 },
];

const Tab2 = () => (
  <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
    <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
      <Kpi label="Avg R² (ESG Model)"   value="0.68" sub="vs 0.52 traditional 5-factor" color={T.sage} />
      <Kpi label="Factor-Explained Var" value="68%"  sub="Systematic ESG component"                     />
      <Kpi label="Idiosyncratic Var"    value="32%"  sub="Firm-specific residual"        color={T.amber}/>
      <Kpi label="R² Improvement"       value="+16pp" sub="Over Fama–French 5-factor"   color={T.green} />
    </div>

    <Card>
      <SectionTitle>Return Decomposition — Barra-Style Factor Regression</SectionTitle>
      <div style={{ background:T.surfaceH, borderRadius:6, padding:'12px 16px', marginBottom:14,
        fontSize:12, color:T.text, lineHeight:1.8 }}>
        <strong>Model:</strong> r<sub>i</sub> = β<sub>ESG_Q</sub>·f<sub>ESG_Q</sub> + β<sub>Carbon</sub>·f<sub>Carbon</sub> +
        β<sub>GreenR</sub>·f<sub>GreenR</sub> + β<sub>Board</sub>·f<sub>Board</sub> + ... + ε<sub>i</sub>
        <br />
        Factor loadings (β) estimated via cross-sectional regression. Factor returns (f) realised monthly.
        Residual ε<sub>i</sub> is idiosyncratic return, assumed uncorrelated across stocks.
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              <Th>Stock</Th>
              <Th right>ESG Qual β</Th>
              <Th right>Carbon β</Th>
              <Th right>Green Rev β</Th>
              <Th right>R²</Th>
              <Th right>Idio Vol %</Th>
            </tr>
          </thead>
          <tbody>
            {BARRA_STOCKS.map((s,i) => (
              <tr key={i} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                <Td bold>{s.name}</Td>
                <Td right mono>{s.esgQ.toFixed(2)}</Td>
                <Td right mono>{s.carbon.toFixed(2)}</Td>
                <Td right mono>{s.greenR.toFixed(2)}</Td>
                <Td right mono bold color={s.rsq > 0.70 ? T.green : T.amber}>{s.rsq.toFixed(2)}</Td>
                <Td right mono>{s.idioVol.toFixed(1)}%</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>

    <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
      <Card style={{ flex:'1 1 320px' }}>
        <SectionTitle>Factor Covariance Matrix (4×4 subset)</SectionTitle>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding:'5px 8px', background:T.surfaceH, fontSize:10, color:T.textSec }}></th>
              {COV_MATRIX.map(c => (
                <th key={c.factor} style={{ padding:'5px 8px', background:T.surfaceH,
                  fontSize:10, color:T.textSec, fontWeight:600 }}>
                  {c.factor.slice(0,8)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COV_MATRIX.map((row, ri) => (
              <tr key={ri}>
                <td style={{ padding:'5px 8px', fontSize:10, fontWeight:600, color:T.textSec,
                  background:T.surfaceH, whiteSpace:'nowrap' }}>{row.factor}</td>
                {['esgQ','carbon','greenR','board'].map(k => {
                  const v = row[k];
                  const isDiag = (k==='esgQ'&&ri===0)||(k==='carbon'&&ri===1)||(k==='greenR'&&ri===2)||(k==='board'&&ri===3);
                  return (
                    <td key={k} style={{ padding:'5px 8px', fontSize:11, textAlign:'center',
                      background: isDiag ? '#dbe8f5' : T.surface,
                      fontWeight: isDiag ? 700:400, color:T.navy }}>
                      {v.toFixed(4)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop:8, fontSize:11, color:T.textMut }}>Diagonal = factor variances. Off-diagonal = covariances.</div>
      </Card>

      <Card style={{ flex:'1 1 260px' }}>
        <SectionTitle>Model Fit vs Traditional Benchmark</SectionTitle>
        {[
          { label:'Fama–French 5-factor R²',  val:0.52, color:T.amber  },
          { label:'ESG-augmented 10-factor R²',val:0.68, color:T.green  },
          { label:'Improvement',               val:'+16pp', color:T.sage, text:true },
        ].map(r => (
          <div key={r.label} style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>{r.label}</div>
            {r.text
              ? <div style={{ fontSize:26, fontWeight:800, color:r.color }}>{r.val}</div>
              : (
                <>
                  <div style={{ height:8, background:T.border, borderRadius:4, overflow:'hidden', marginBottom:4 }}>
                    <div style={{ height:'100%', width:`${r.val*100}%`, background:r.color, borderRadius:4 }} />
                  </div>
                  <div style={{ fontSize:18, fontWeight:700, color:r.color }}>{r.val.toFixed(2)}</div>
                </>
              )}
          </div>
        ))}
        <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:10, fontSize:11, color:T.textSec }}>
          The additional ESG factors explain residual variance left by traditional risk factors, improving
          portfolio construction and risk forecasting.
        </div>
      </Card>
    </div>
  </div>
);

// ─── Tab 3 ───────────────────────────────────────────────────────────────────

const Tab3 = () => (
  <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
    <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
      <Kpi label="Total Active Return 2024" value="+3.2%"  sub="vs MSCI ACWI benchmark"      color={T.green} />
      <Kpi label="ESG Factor Contribution" value="+2.6%"  sub="81% of active return"         color={T.sage}  />
      <Kpi label="Traditional Factors"     value="+0.9%"  sub="Value + Quality + Momentum"               />
      <Kpi label="Negative Contributors"   value="-0.4%"  sub="Sector alloc + Residual"      color={T.red}   />
    </div>

    <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
      <Card style={{ flex:'2 1 380px' }}>
        <SectionTitle>Alpha Attribution — 2024 Full Year</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={ATTRIBUTION_BAR} layout="vertical" margin={{ top:4, right:30, left:120, bottom:4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" tick={{ fontSize:10, fill:T.textSec }} tickFormatter={v=>`${v>0?'+':''}${v}%`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:T.text }} width={110} />
            <Tooltip formatter={v=>[`${v>0?'+':''}${v}%`,'Contribution']} />
            <ReferenceLine x={0} stroke={T.border} />
            <Bar dataKey="value" radius={[0,4,4,0]}>
              {ATTRIBUTION_BAR.map((d,i) => <Cell key={i} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{ flex:'1 1 240px' }}>
        <SectionTitle>Attribution Summary</SectionTitle>
        {ATTRIBUTION_BAR.map(d => (
          <div key={d.name} style={{ display:'flex', justifyContent:'space-between',
            alignItems:'center', padding:'6px 0', borderBottom:`1px solid ${T.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:10, height:10, borderRadius:2, background:d.fill }} />
              <span style={{ fontSize:12, color:T.text }}>{d.name}</span>
            </div>
            <span style={{ fontSize:13, fontWeight:700,
              color: d.value > 0 ? T.green : T.red }}>
              {d.value > 0 ? '+':''}{d.value}%
            </span>
          </div>
        ))}
        <div style={{ paddingTop:8, display:'flex', justifyContent:'space-between' }}>
          <strong style={{ fontSize:13 }}>Total</strong>
          <strong style={{ fontSize:13, color:T.green }}>+3.2%</strong>
        </div>
      </Card>
    </div>

    <Card>
      <SectionTitle>Quarterly Alpha Attribution — ESG Factors (2024)</SectionTitle>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              <Th>Quarter</Th>
              <Th right>ESG Quality</Th>
              <Th right>Carbon Effic.</Th>
              <Th right>Green Revenue</Th>
              <Th right>Traditional</Th>
              <Th right>Sector Alloc.</Th>
              <Th right>Stock Select.</Th>
              <Th right>Quarter Total</Th>
            </tr>
          </thead>
          <tbody>
            {QUARTERLY_ATTR.map((q,i) => {
              const total = +(q.esgQ+q.carbon+q.greenR+q.trad+q.sector+q.stock).toFixed(2);
              return (
                <tr key={i} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                  <Td bold>{q.q}</Td>
                  <Td right mono color={T.green}>+{q.esgQ.toFixed(2)}%</Td>
                  <Td right mono color={T.green}>+{q.carbon.toFixed(2)}%</Td>
                  <Td right mono color={T.green}>+{q.greenR.toFixed(2)}%</Td>
                  <Td right mono color={T.green}>+{q.trad.toFixed(2)}%</Td>
                  <Td right mono color={T.red}>{q.sector.toFixed(2)}%</Td>
                  <Td right mono color={T.green}>+{q.stock.toFixed(2)}%</Td>
                  <Td right bold color={T.green}>+{total.toFixed(2)}%</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>

    <Card>
      <SectionTitle>Rolling 12m Alpha — ESG Factors Only</SectionTitle>
      <div style={{ display:'flex', gap:20, marginBottom:12, flexWrap:'wrap' }}>
        <span style={{ fontSize:12, color:T.textSec }}>
          <strong style={{ color:T.green }}>Current: +2.6%</strong> &nbsp;|&nbsp;
          <strong style={{ color:T.navy }}>Peak: +4.1% (Q2 2022)</strong> &nbsp;|&nbsp;
          <strong style={{ color:T.amber }}>Trough: +0.8% (Q4 2022 — energy crisis)</strong>
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={ROLLING_ALPHA} margin={{ top:4, right:16, left:0, bottom:4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="period" tick={{ fontSize:9, fill:T.textSec }} interval={2} />
          <YAxis tick={{ fontSize:10, fill:T.textSec }} tickFormatter={v=>`+${v}%`} domain={[0,5]} />
          <Tooltip formatter={v=>[`+${v}%`,'Rolling ESG Alpha']} />
          <ReferenceLine y={2.6} stroke={T.green} strokeDasharray="4 2" label={{ value:'Current', position:'right', fontSize:10 }} />
          <Line type="monotone" dataKey="alpha" stroke={T.sage} strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  </div>
);

// ─── Tab 4 ───────────────────────────────────────────────────────────────────

const Tab4 = () => (
  <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
    <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
      <Kpi label="ESG Crowding Score"   value="6.8 / 10"        sub="Elevated — monitor closely"    color={T.amber}  />
      <Kpi label="Crowded Factors"      value="3 of 10"          sub="Score > 7.0"                   color={T.red}    />
      <Kpi label="Reversal Risk"        value="Medium"           sub="Est. -180 bps if unwind"       color={T.amber}  />
      <Kpi label="Recommended Action"   value="Reduce ESG Qual." sub="Tilt to Water + Biodiversity"  color={T.navy}   />
    </div>

    <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
      <Card style={{ flex:'2 1 380px' }}>
        <SectionTitle>ESG Quality Factor Crowding Score — 2020 to 2024</SectionTitle>
        <div style={{ fontSize:11, color:T.textSec, marginBottom:10 }}>
          Rising institutional adoption has pushed ESG Quality crowding from 3.2 in 2020 to 8.2 today.
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={CROWDING_TREND} margin={{ top:4, right:16, left:0, bottom:4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="period" tick={{ fontSize:8, fill:T.textSec }} interval={3} />
            <YAxis tick={{ fontSize:10, fill:T.textSec }} domain={[0,10]} />
            <Tooltip formatter={v=>[v.toFixed(1),'Crowding Score']} />
            <ReferenceLine y={7} stroke={T.red} strokeDasharray="4 2" label={{ value:'Elevated', position:'right', fontSize:9 }} />
            <Line type="monotone" dataKey="score" stroke={T.amber} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{ flex:'1 1 240px' }}>
        <SectionTitle>Crowding Risk Scenario</SectionTitle>
        <div style={{ background:'#fef3cd', border:'1px solid #d97706', borderRadius:6,
          padding:'10px 12px', marginBottom:12 }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.amber, marginBottom:4 }}>Unwind Risk Estimate</div>
          <div style={{ fontSize:11, color:T.text, lineHeight:1.7 }}>
            If ESG Quality factor reverts to 2022 crowding levels, estimated factor return impact:
            <strong> -180 bps</strong> over next quarter.
          </div>
        </div>
        <SectionTitle>Recommended Tilts</SectionTitle>
        {[
          { from:'ESG Quality (8.2)', to:'Water Efficiency (3.2)', arrow:true },
          { from:'Green Revenue (7.4)', to:'Biodiversity (2.8)', arrow:true },
          { from:'Carbon Effic. (7.1)', to:'Labour Standards (3.9)', arrow:true },
        ].map((r,i) => (
          <div key={i} style={{ fontSize:11, color:T.text, marginBottom:8, padding:'6px 8px',
            background:T.surfaceH, borderRadius:4 }}>
            <span style={{ color:T.red }}>↓ {r.from}</span>
            <span style={{ color:T.textMut }}> → </span>
            <span style={{ color:T.green }}>↑ {r.to}</span>
          </div>
        ))}
      </Card>
    </div>

    <Card>
      <SectionTitle>Factor Crowding Dashboard</SectionTitle>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              <Th>Factor</Th>
              <Th right>Crowding Score</Th>
              <Th right>Status</Th>
              <Th right>Trend</Th>
              <Th right>+Alpha/yr</Th>
              <Th right>Action</Th>
            </tr>
          </thead>
          <tbody>
            {FACTORS.map((f,i) => {
              const status = f.crowd >= 7 ? 'Crowded' : f.crowd >= 5 ? 'Elevated' : 'Normal';
              const statusColor = f.crowd >= 7 ? T.red : f.crowd >= 5 ? T.amber : T.green;
              const action = f.crowd >= 7 ? 'Reduce' : f.crowd >= 5 ? 'Monitor' : 'Increase';
              const actionColor = f.crowd >= 7 ? T.red : f.crowd >= 5 ? T.amber : T.green;
              const bar = f.crowd / 10;
              return (
                <tr key={i} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                  <Td bold>{f.name}</Td>
                  <Td right>
                    <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end' }}>
                      <div style={{ width:60, height:6, background:T.border, borderRadius:3, overflow:'hidden' }}>
                        <div style={{ width:`${bar*100}%`, height:'100%', background:statusColor, borderRadius:3 }} />
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, color:statusColor }}>{f.crowd.toFixed(1)}</span>
                    </div>
                  </Td>
                  <Td right><span style={{ color:statusColor, fontWeight:600, fontSize:11 }}>{status}</span></Td>
                  <Td right>
                    <span style={{ fontSize:11, color: f.crowdTrend==='Increasing' ? T.red : f.crowdTrend==='Decreasing' ? T.green : T.textSec }}>
                      {f.crowdTrend==='Increasing' ? '▲' : f.crowdTrend==='Decreasing' ? '▼' : '→'} {f.crowdTrend}
                    </span>
                  </Td>
                  <Td right color={T.green}>+{f.alpha} bps</Td>
                  <Td right><span style={{ color:actionColor, fontWeight:600, fontSize:11 }}>{action}</span></Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

// ─── Tab 5 ───────────────────────────────────────────────────────────────────

const Tab5 = () => (
  <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
    <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
      <Kpi label="Target ESG Qual Loading" value="0.60"  sub="Portfolio-weighted avg"        color={T.navy}  />
      <Kpi label="Target Carbon Loading"   value="0.80"  sub="Carbon Efficiency factor"      color={T.sage}  />
      <Kpi label="Max Tracking Error"      value="3.0%"  sub="vs MSCI ACWI constraint"       color={T.amber} />
      <Kpi label="Active Holdings"         value="15"    sub="Optimizer-selected positions"              />
    </div>

    <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
      <Card style={{ flex:'1 1 320px' }}>
        <SectionTitle>ESG Factor Efficient Frontier</SectionTitle>
        <div style={{ fontSize:11, color:T.textSec, marginBottom:10 }}>
          Average ESG factor loading achievable at each tracking error level.
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={FRONTIER} margin={{ top:4, right:16, left:0, bottom:4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="te" tick={{ fontSize:10, fill:T.textSec }} tickFormatter={v=>`${v}% TE`} />
            <YAxis tick={{ fontSize:10, fill:T.textSec }} domain={[0.4,0.9]} tickFormatter={v=>v.toFixed(2)} />
            <Tooltip formatter={(v,n)=>[v.toFixed(2),'ESG Loading']} labelFormatter={v=>`TE: ${v}%`} />
            <ReferenceLine x={3} stroke={T.amber} strokeDasharray="4 2" label={{ value:'Constraint', position:'top', fontSize:9 }} />
            <Line type="monotone" dataKey="esgLoad" stroke={T.sage} strokeWidth={2.5} dot={{ r:4, fill:T.sage }} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ fontSize:11, color:T.textMut, marginTop:6 }}>
          At 2% TE → avg ESG loading 0.65 &nbsp;|&nbsp; At 4% TE → 0.80
        </div>
      </Card>

      <Card style={{ flex:'1 1 260px' }}>
        <SectionTitle>Factor Exposure vs Target</SectionTitle>
        {[
          { factor:'ESG Quality',    target:0.60, achieved:0.61 },
          { factor:'Carbon Effic.',  target:0.80, achieved:0.78 },
          { factor:'Green Revenue',  target:0.50, achieved:0.52 },
          { factor:'Board Quality',  target:0.40, achieved:0.42 },
        ].map(r => {
          const gap = r.achieved - r.target;
          return (
            <div key={r.factor} style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{r.factor}</span>
                <span style={{ fontSize:12, color: Math.abs(gap) < 0.03 ? T.green : T.amber }}>
                  {r.achieved.toFixed(2)} <span style={{ color:T.textMut, fontWeight:400 }}>(tgt {r.target.toFixed(2)})</span>
                </span>
              </div>
              <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                <div style={{ flex:1, height:8, background:T.border, borderRadius:4, overflow:'hidden' }}>
                  <div style={{ width:`${r.target*100}%`, height:'100%', background:T.navyL, borderRadius:4, opacity:0.4, position:'relative' }} />
                </div>
              </div>
              <div style={{ display:'flex', gap:4, marginTop:2 }}>
                <div style={{ flex:r.achieved, height:6, background:T.sage, borderRadius:3 }} />
                <div style={{ flex:1-r.achieved, height:6, background:T.border, borderRadius:3 }} />
              </div>
            </div>
          );
        })}
        <div style={{ fontSize:11, color:T.textMut, borderTop:`1px solid ${T.border}`, paddingTop:8 }}>
          Portfolio closely tracks targets within ±0.03 loading tolerance.
        </div>
      </Card>
    </div>

    <Card>
      <SectionTitle>Optimized Portfolio Holdings (15 Positions)</SectionTitle>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              <Th>Company</Th>
              <Th right>Weight %</Th>
              <Th>Sector</Th>
              <Th right>ESG Qual β</Th>
              <Th right>Carbon β</Th>
              <Th right>Green Rev β</Th>
              <Th right>Board Qual β</Th>
            </tr>
          </thead>
          <tbody>
            {PORTFOLIO_HOLDINGS.map((h,i) => (
              <tr key={i} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                <Td bold>{h.name}</Td>
                <Td right mono>{h.wt.toFixed(1)}%</Td>
                <Td><span style={{ fontSize:11, color:T.textSec }}>{h.sector}</span></Td>
                <Td right mono color={h.esgQ > 0.85 ? T.green : T.text}>{h.esgQ.toFixed(2)}</Td>
                <Td right mono color={h.carbon > 0.85 ? T.green : T.text}>{h.carbon.toFixed(2)}</Td>
                <Td right mono color={h.greenR > 0.80 ? T.green : T.text}>{h.greenR.toFixed(2)}</Td>
                <Td right mono>{h.board.toFixed(2)}</Td>
              </tr>
            ))}
            <tr style={{ background:T.surfaceH, fontWeight:700 }}>
              <Td bold>Portfolio Avg (wt)</Td>
              <Td right bold>62.1%</Td>
              <Td></Td>
              <Td right bold mono color={T.sage}>0.81</Td>
              <Td right bold mono color={T.sage}>0.77</Td>
              <Td right bold mono color={T.sage}>0.66</Td>
              <Td right bold mono>0.75</Td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

// ─── Tab 6 ───────────────────────────────────────────────────────────────────

const LIVE_LINES = [
  { key:'Carbon Eff', color: T.sage    },
  { key:'ESG Mom',    color: T.navyL   },
  { key:'Green Rev',  color: T.gold    },
  { key:'ESG Quality',color: T.amber   },
  { key:'Board Q',    color: T.red     },
];

const Tab6 = () => (
  <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
    <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
      <Kpi label="YTD Leader"        value="Carbon Eff." sub="+4.2% YTD on EU ETS rise" color={T.green}  />
      <Kpi label="ESG Momentum YTD"  value="+2.8%"       sub="Positive 3m + 6m trailing"color={T.sage}   />
      <Kpi label="YTD Laggard"       value="Board Qual." sub="-0.4% tech governance"   color={T.red}    />
      <Kpi label="Factors w/ + Mom." value="7 of 10"     sub="Positive 3m trailing"    color={T.navy}   />
    </div>

    <Card>
      <SectionTitle>Daily Factor Returns — Q1 2025 (60 Trading Days)</SectionTitle>
      <div style={{ fontSize:11, color:T.textSec, marginBottom:10 }}>
        Cumulative factor return, daily data. Showing top 5 factors for clarity.
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={LIVE_DATA} margin={{ top:4, right:16, left:0, bottom:4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="day" tick={{ fontSize:9, fill:T.textSec }} label={{ value:'Trading Day', position:'insideBottom', offset:-2, fontSize:10 }} />
          <YAxis tick={{ fontSize:10, fill:T.textSec }} tickFormatter={v=>`${v>0?'+':''}${v}%`} />
          <Tooltip formatter={(v,n)=>[`${v>0?'+':''}${v.toFixed(2)}%`, n]} labelFormatter={d=>`Day ${d}`} />
          <Legend wrapperStyle={{ fontSize:11 }} />
          {LIVE_LINES.map(l => (
            <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={1.8} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>

    <Card>
      <SectionTitle>YTD Factor Performance Table — Q1 2025</SectionTitle>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              <Th>Factor</Th>
              <Th right>YTD</Th>
              <Th right>1-Month</Th>
              <Th right>3-Month</Th>
              <Th right>1-Year</Th>
              <Th right>Momentum</Th>
              <Th right>Signal</Th>
            </tr>
          </thead>
          <tbody>
            {LIVE_STATS.sort((a,b)=>b.ytd-a.ytd).map((s,i) => (
              <tr key={i} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                <Td bold>{s.name}</Td>
                <Td right mono bold color={s.ytd > 0 ? T.green : T.red}>
                  {s.ytd > 0 ? '+':''}{s.ytd.toFixed(1)}%
                </Td>
                <Td right mono color={s.m1 > 0 ? T.green : T.red}>
                  {s.m1 > 0 ? '+':''}{s.m1.toFixed(1)}%
                </Td>
                <Td right mono color={s.m3 > 0 ? T.green : T.red}>
                  {s.m3 > 0 ? '+':''}{s.m3.toFixed(1)}%
                </Td>
                <Td right mono color={s.yr > 0 ? T.green : T.red}>
                  {s.yr > 0 ? '+':''}{s.yr.toFixed(1)}%
                </Td>
                <Td right>
                  <span style={{ fontSize:11, fontWeight:600, color: s.mom ? T.green : T.red }}>
                    {s.mom ? '▲ Positive' : '▼ Negative'}
                  </span>
                </Td>
                <Td right>
                  <span style={{ fontSize:11, fontWeight:600,
                    color: s.ytd > 2 ? T.green : s.ytd > 0 ? T.amber : T.red }}>
                    {s.ytd > 2 ? 'Overweight' : s.ytd > 0 ? 'Neutral' : 'Underweight'}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>

    <Card>
      <SectionTitle>ESG vs Traditional Factor Correlations — Q1 2025</SectionTitle>
      <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
        {[
          { esg:'Carbon Efficiency', vs:'Value',    corr:-0.12, note:'Diverging from Value — independent alpha' },
          { esg:'Green Revenue',     vs:'Momentum', corr:0.31,  note:'Some overlap with Momentum this quarter'  },
          { esg:'ESG Momentum',      vs:'Momentum', corr:0.58,  note:'High overlap — reduce ESG Mom exposure'   },
          { esg:'ESG Quality',       vs:'Quality',  corr:0.38,  note:'Moderate Quality factor correlation'      },
          { esg:'Board Quality',     vs:'Quality',  corr:0.51,  note:'Strong Quality correlation — crowded'     },
          { esg:'Biodiversity',      vs:'Value',    corr:0.08,  note:'Near-zero trad. correlation — pure ESG'   },
        ].map((r,i) => (
          <div key={i} style={{ flex:'1 1 260px', background:T.surfaceH, borderRadius:6,
            padding:'12px 14px', border:`1px solid ${T.border}` }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:4 }}>
              {r.esg} <span style={{ color:T.textMut, fontWeight:400 }}>vs</span> {r.vs}
            </div>
            <div style={{ fontSize:24, fontWeight:800,
              color: Math.abs(r.corr) > 0.4 ? T.red : Math.abs(r.corr) > 0.2 ? T.amber : T.green }}>
              {r.corr > 0 ? '+':''}{r.corr.toFixed(2)}
            </div>
            <div style={{ fontSize:11, color:T.textSec, marginTop:4 }}>{r.note}</div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function EsgFactorAlphaPage() {
  const [tab, setTab] = useState(0);

  const tabContent = [<Tab1 />, <Tab2 />, <Tab3 />, <Tab4 />, <Tab5 />, <Tab6 />];

  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', color:T.text }}>
      {/* Header */}
      <div style={{ background:T.navy, padding:'18px 28px 14px', boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <div>
            <div style={{ fontSize:11, color:T.gold, fontWeight:600, letterSpacing:'0.08em',
              textTransform:'uppercase', marginBottom:4 }}>
              EP-AF5 · AA Impact Risk Analytics Platform
            </div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:'#fff', lineHeight:1.2 }}>
              ESG Factor Alpha Engine
            </h1>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.65)', marginTop:6 }}>
              Systematic alpha generation from ESG factor premia — Barra-style decomposition & crowding surveillance
            </div>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            {['10 Factors', '+187bps Alpha', 'IC 0.09', 'Barra-Style', 'Crowding'].map(b => (
              <span key={b} style={{ background:'rgba(197,169,106,0.18)', border:`1px solid ${T.gold}`,
                color:T.gold, fontSize:10, fontWeight:600, padding:'3px 9px', borderRadius:12,
                letterSpacing:'0.04em' }}>
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`,
        paddingLeft:20, display:'flex', gap:0, overflowX:'auto' }}>
        {TABS.map((t,i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{ padding:'12px 18px', border:'none', background:'transparent', cursor:'pointer',
              fontSize:12, fontWeight: tab===i ? 700 : 500, color: tab===i ? T.navy : T.textSec,
              borderBottom: tab===i ? `3px solid ${T.gold}` : '3px solid transparent',
              whiteSpace:'nowrap', transition:'all 0.15s' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ padding:'24px 24px 40px', maxWidth:1280, margin:'0 auto' }}>
        {tabContent[tab]}
      </div>
    </div>
  );
}
