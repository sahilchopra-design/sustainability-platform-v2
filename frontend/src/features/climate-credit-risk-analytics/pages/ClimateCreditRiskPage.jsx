import React, { useState } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7',
  border:'#e5e0d8', borderL:'#d5cfc5',
  navy:'#1b3a5c', navyL:'#2c5a8c',
  gold:'#c5a96a', goldL:'#d4be8a',
  sage:'#5a8a6a', sageL:'#7ba67d', teal:'#5a8a6a',
  text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706',
  card:'0 1px 4px rgba(27,58,92,0.06)',
  cardH:'0 4px 16px rgba(27,58,92,0.1)',
  font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── Physical Risk Heat Map data ───────────────────────────────────────────────
const RISK_TYPES = ['Flood','Wildfire','Cyclone','Hail','Heat Stress','Sea Level Rise','Drought','Permafrost'];

const BORROWERS_PHYSICAL = [
  { name:'Agricultural Co (East India)',   scores:[1,1,1,1,4,1,5,1] },
  { name:'Coastal Resort (Florida)',       scores:[5,2,5,2,3,4,2,1] },
  { name:'Cement Plant (Pakistan)',        scores:[1,1,1,2,4,2,3,1] },
  { name:'Salmon Farm (Norway)',           scores:[2,1,1,1,3,2,1,2] },
  { name:'Coffee Plantation (Ethiopia)',   scores:[1,1,1,1,4,1,4,1] },
  { name:'Delta Port (Bangladesh)',        scores:[5,1,2,1,3,5,3,1] },
  { name:'Ski Resort (Alps)',              scores:[1,2,1,3,3,2,2,1] },
  { name:'Timber Co (California)',         scores:[3,5,1,2,3,1,4,1] },
  { name:'Solar Farm (Arizona)',           scores:[1,3,3,3,5,1,4,1] },
  { name:'Steel Mill (Gulf Coast)',        scores:[3,1,4,3,4,2,2,1] },
  { name:'Mining Corp (Pilbara, AUS)',     scores:[1,4,2,2,5,1,3,1] },
  { name:'Hydropower (Himalayas)',         scores:[4,1,1,2,3,2,4,3] },
  { name:'Retail Chain (Mumbai)',          scores:[3,1,2,1,4,3,3,1] },
  { name:'Chemical Plant (Rotterdam)',     scores:[4,1,2,2,2,4,1,1] },
  { name:'Logistics Hub (Shanghai)',       scores:[4,1,3,2,3,4,2,1] },
  { name:'Cattle Farm (Brazil)',           scores:[2,3,2,2,4,1,5,1] },
  { name:'Telecom Tower Co (Philippines)',scores:[3,2,5,3,3,3,2,1] },
  { name:'Rail Infra (Northern Canada)',   scores:[2,2,1,3,2,1,2,5] },
];

const riskColor = v => {
  if (v >= 5) return '#f04060';
  if (v === 4) return '#f0702a';
  if (v === 3) return '#f0a828';
  if (v === 2) return '#8fc06e';
  return '#2a3d55';
};

// ── Transition Risk data ──────────────────────────────────────────────────────
const TRANSITION_BORROWERS = [
  { name:'Coal Power Gen (Poland)',   nace:'D35.1', ebitda:18, ci:1.42, pd50:1.2, pd100:2.8, pd150:5.4, lgdAdj:14 },
  { name:'Cement Co (Turkey)',        nace:'C23.5', ebitda:22, ci:0.84, pd50:0.8, pd100:1.9, pd150:3.8, lgdAdj:10 },
  { name:'Steel (Blast Furnace, DE)', nace:'C24.1', ebitda:14, ci:1.76, pd50:1.6, pd100:3.6, pd150:7.2, lgdAdj:18 },
  { name:'Airline (Short-haul)',      nace:'H51.1', ebitda:11, ci:0.63, pd50:0.6, pd100:1.4, pd150:2.7, lgdAdj:8  },
  { name:'Oil Refinery (Rotterdam)',  nace:'C19.2', ebitda:9,  ci:0.58, pd50:0.5, pd100:1.2, pd150:2.4, lgdAdj:7  },
  { name:'Plastic Packaging (UK)',    nace:'C22.2', ebitda:25, ci:0.38, pd50:0.3, pd100:0.7, pd150:1.4, lgdAdj:4  },
  { name:'Fertiliser Plant (India)',  nace:'C20.1', ebitda:17, ci:0.91, pd50:0.9, pd100:2.1, pd150:4.2, lgdAdj:12 },
  { name:'Auto OEM (ICE-heavy)',      nace:'C29.1', ebitda:8,  ci:0.29, pd50:0.3, pd100:0.6, pd150:1.2, lgdAdj:5  },
  { name:'Gas Distribution (IT)',     nace:'D35.2', ebitda:31, ci:0.44, pd50:0.4, pd100:0.9, pd150:1.8, lgdAdj:6  },
  { name:'Petrochems (Saudi)',        nace:'C20.6', ebitda:38, ci:0.72, pd50:0.7, pd100:1.6, pd150:3.2, lgdAdj:9  },
  { name:'Shipping (Dry Bulk)',       nace:'H50.4', ebitda:19, ci:0.55, pd50:0.5, pd100:1.2, pd150:2.3, lgdAdj:6  },
  { name:'Brickworks (UK)',           nace:'C23.3', ebitda:21, ci:0.62, pd50:0.6, pd100:1.3, pd150:2.6, lgdAdj:7  },
  { name:'Pulp & Paper (Finland)',    nace:'C17.1', ebitda:16, ci:0.47, pd50:0.4, pd100:1.0, pd150:1.9, lgdAdj:5  },
  { name:'Asphalt & Roads (FR)',      nace:'C23.9', ebitda:27, ci:0.39, pd50:0.3, pd100:0.7, pd150:1.4, lgdAdj:4  },
  { name:'Aluminium Smelter (NO)',    nace:'C24.4', ebitda:12, ci:0.88, pd50:0.8, pd100:1.9, pd150:3.7, lgdAdj:11 },
];

const TOP5_EBITDA = TRANSITION_BORROWERS.slice(0,5).map(b => ({
  name: b.name.split('(')[0].trim(),
  'EBITDA (base)': b.ebitda,
  '£50/t impact':  +(b.ci * 50 * 0.3).toFixed(1),
  '£130/t impact': +(b.ci * 130 * 0.3).toFixed(1),
  '£250/t impact': +(b.ci * 250 * 0.3).toFixed(1),
}));

// ── IFRS 9 waterfall data ─────────────────────────────────────────────────────
const WATERFALL_DATA = [
  { name:'Stage 1 ECL',         value:42,   fill:T.sage },
  { name:'Stage 2 ECL',         value:118,  fill:T.sage },
  { name:'Stage 3 ECL',         value:284,  fill:T.sage },
  { name:'Physical Overlay',    value:234,  fill:T.amber },
  { name:'Transition Overlay',  value:156,  fill:T.amber },
  { name:'Correlated Uplift',   value:48,   fill:T.red },
  { name:'Total Climate ECL',   value:882,  fill:T.green },
];

const SECTOR_OVERLAY = [
  { sector:'Agriculture',         s1:2.1, s2:18.4, s3:41.2 },
  { sector:'Real Estate',         s1:5.3, s2:26.7, s3:61.8 },
  { sector:'Energy',              s1:3.8, s2:22.1, s3:53.4 },
  { sector:'Transport',           s1:1.4, s2:11.3, s3:29.7 },
  { sector:'Manufacturing',       s1:1.9, s2:14.8, s3:38.2 },
  { sector:'Mining',              s1:4.2, s2:19.6, s3:47.1 },
];

// ── Stranded Assets data ──────────────────────────────────────────────────────
const EPC_DATA = [
  { band:'A', pct:3,  risk:'None',      color:'#06c896', haircut:0  },
  { band:'B', pct:12, risk:'None',      color:'#08e5b0', haircut:0  },
  { band:'C', pct:28, risk:'Low',       color:'#f0a828', haircut:4  },
  { band:'D', pct:35, risk:'Medium',    color:'#f07228', haircut:10 },
  { band:'E', pct:14, risk:'High',      color:'#f04060', haircut:16 },
  { band:'F', pct:6,  risk:'Very High', color:'#cc2040', haircut:20 },
  { band:'G', pct:2,  risk:'Critical',  color:'#8c1030', haircut:22 },
];

const STRANDED_TIMELINE = Array.from({length:27}, (_,i) => {
  const yr = 2024 + i;
  const base = sr(i * 7) * 0.4;
  let v = base * 200;
  if (yr >= 2025) v += 420;
  if (yr >= 2028) v += 680;
  if (yr >= 2033) v += 520;
  if (yr >= 2040) v += 380;
  return { year:String(yr), stranded: Math.round(v) };
});

// ── Shared sub-components ─────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{
    background:T.surface, border:`1px solid ${T.border}`,
    borderRadius:8, padding:'14px 18px',
    boxShadow:T.card, borderTop:`2px solid ${accent||T.navy}`,
  }}>
    <div style={{fontSize:11,color:T.textSec,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color:T.text}}>{value}</div>
    {sub && <div style={{fontSize:11,color:T.textMut,marginTop:3}}>{sub}</div>}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{fontSize:12,fontWeight:600,color:T.textSec,textTransform:'uppercase',
    letterSpacing:'0.1em',marginBottom:12,paddingBottom:6,borderBottom:`1px solid ${T.borderL}`}}>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:T.surfaceH,border:`1px solid ${T.border}`,borderRadius:6,padding:'10px 14px',fontSize:12}}>
      <div style={{color:T.textSec,marginBottom:6}}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{color:p.color||T.text,marginBottom:2}}>
          {p.name}: <strong>{typeof p.value==='number' ? p.value.toFixed(1) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// ── Tab 1: Physical Risk Heat Map ─────────────────────────────────────────────
const PhysicalRiskTab = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
      <KpiCard label="Total Borrowers" value="18" sub="Across loan portfolio" accent={T.sage} />
      <KpiCard label="High Physical Risk" value="7" sub="Score 4-5 on any category" accent={T.amber} />
      <KpiCard label="Physical ECL Overlay" value="£234M" sub="Additional IFRS 9 provisions" accent={T.red} />
      <KpiCard label="Avg Portfolio Risk" value="2.4 / 5" sub="Weighted mean physical score" accent={T.navy} />
    </div>

    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,marginBottom:20,boxShadow:T.card}}>
      <SectionTitle>Borrower Physical Risk Heat Map (NGFS/IPCC Categories)</SectionTitle>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
          <thead>
            <tr>
              <th style={{textAlign:'left',padding:'6px 8px',color:T.textSec,borderBottom:`1px solid ${T.border}`,minWidth:200}}>Borrower</th>
              {RISK_TYPES.map(rt => (
                <th key={rt} style={{textAlign:'center',padding:'6px 6px',color:T.textSec,borderBottom:`1px solid ${T.border}`,minWidth:64,fontSize:10}}>
                  {rt}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BORROWERS_PHYSICAL.map((b,i) => (
              <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`}}>
                <td style={{padding:'5px 8px',color:T.text,fontWeight:500}}>{b.name}</td>
                {b.scores.map((s,j) => (
                  <td key={j} style={{textAlign:'center',padding:'4px 4px'}}>
                    <div style={{
                      width:40, height:24, lineHeight:'24px',
                      background:riskColor(s), borderRadius:4,
                      color: s >= 3 ? '#fff' : T.textSec,
                      fontWeight:700, fontSize:12, margin:'0 auto',
                    }}>{s}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,boxShadow:T.card}}>
      <SectionTitle>Risk Score Legend — NGFS Physical Risk Taxonomy</SectionTitle>
      <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
        {[
          {score:'5',label:'Critical',color:'#f04060'},
          {score:'4',label:'High',color:'#f0702a'},
          {score:'3',label:'Medium',color:'#f0a828'},
          {score:'2',label:'Low',color:'#8fc06e'},
          {score:'1',label:'Minimal',color:'#2a3d55'},
        ].map(l => (
          <div key={l.score} style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:28,height:20,background:l.color,borderRadius:4,textAlign:'center',
              lineHeight:'20px',fontSize:11,fontWeight:700,color:'#fff'}}>{l.score}</div>
            <span style={{fontSize:12,color:T.textSec}}>{l.label}</span>
          </div>
        ))}
        <div style={{marginLeft:'auto',fontSize:11,color:T.textMut}}>
          Acute risks: Flood, Wildfire, Cyclone, Hail | Chronic risks: Heat Stress, Sea Level Rise, Drought, Permafrost
        </div>
      </div>
    </div>
  </div>
);

// ── Tab 2: Transition Risk Model ──────────────────────────────────────────────
const TransitionRiskTab = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
      <KpiCard label="UK ETS Price (Current)" value="£45/t" sub="Real UK ETS 2024 reference" accent={T.sage} />
      <KpiCard label="Central 2030 Scenario" value="£130/t" sub="NGFS Orderly transition" accent={T.amber} />
      <KpiCard label="High 2030 Scenario" value="£250/t" sub="NGFS Disorderly / hot scenario" accent={T.red} />
      <KpiCard label="Transition ECL Overlay" value="£156M" sub="PD uplift + LGD stranded adj." accent={T.navy} />
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,boxShadow:T.card}}>
        <SectionTitle>Top 5 Borrowers — EBITDA Sensitivity to Carbon Price</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={TOP5_EBITDA} margin={{top:4,right:8,left:-10,bottom:4}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="name" tick={{fill:T.textSec,fontSize:9}} />
            <YAxis tick={{fill:T.textSec,fontSize:10}} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="EBITDA (base)" fill={T.sage} radius={[3,3,0,0]} />
            <Bar dataKey="£50/t impact" fill={T.amber} radius={[3,3,0,0]} />
            <Bar dataKey="£130/t impact" fill={T.red} radius={[3,3,0,0]} />
            <Bar dataKey="£250/t impact" fill="#a01830" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{display:'flex',gap:16,marginTop:8,flexWrap:'wrap'}}>
          {[{c:T.sage,l:'EBITDA Base %'},{c:T.amber,l:'£50/t cost'},{c:T.red,l:'£130/t cost'},{c:'#a01830',l:'£250/t cost'}].map(item => (
            <div key={item.l} style={{display:'flex',alignItems:'center',gap:5,fontSize:10,color:T.textSec}}>
              <div style={{width:10,height:10,background:item.c,borderRadius:2}} />{item.l}
            </div>
          ))}
        </div>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,boxShadow:T.card}}>
        <SectionTitle>Carbon Price Scenario Framework</SectionTitle>
        {[
          {label:'Current UK ETS',  price:'£45/t',  note:'Live market, 2024 average'},
          {label:'Central 2030',    price:'£130/t', note:'NGFS Net Zero 2050 orderly'},
          {label:'High 2030',       price:'£250/t', note:'NGFS Divergent Net Zero / delayed'},
        ].map(s => (
          <div key={s.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
            padding:'10px 14px',background:T.surfaceH,borderRadius:6,marginBottom:8,
            border:`1px solid ${T.borderL}`}}>
            <div>
              <div style={{fontSize:12,color:T.text,fontWeight:600}}>{s.label}</div>
              <div style={{fontSize:11,color:T.textMut,marginTop:2}}>{s.note}</div>
            </div>
            <div style={{fontSize:18,fontWeight:700,color:T.amber}}>{s.price}</div>
          </div>
        ))}
        <div style={{marginTop:12,fontSize:11,color:T.textMut,lineHeight:1.6}}>
          PD uplift = Carbon cost × EBITDA sensitivity × PD elasticity factor.<br/>
          LGD adjustment reflects probability of collateral stranding under each scenario.
        </div>
      </div>
    </div>

    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,boxShadow:T.card}}>
      <SectionTitle>High Transition Risk Borrowers — PD & LGD Impact</SectionTitle>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
          <thead>
            <tr style={{borderBottom:`1px solid ${T.border}`}}>
              {['Borrower','NACE','EBITDA %','Carbon Intensity','PD Uplift £50/t','PD Uplift £130/t','PD Uplift £250/t','LGD Adj %'].map(h => (
                <th key={h} style={{textAlign:'left',padding:'6px 10px',color:T.textSec,fontWeight:600,whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TRANSITION_BORROWERS.map((b,i) => (
              <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`}}>
                <td style={{padding:'6px 10px',color:T.text,fontWeight:500}}>{b.name}</td>
                <td style={{padding:'6px 10px',color:T.textSec}}>{b.nace}</td>
                <td style={{padding:'6px 10px',color:T.text}}>{b.ebitda}%</td>
                <td style={{padding:'6px 10px',color:b.ci>1?T.red:b.ci>0.6?T.amber:T.green}}>{b.ci.toFixed(2)}</td>
                <td style={{padding:'6px 10px',color:T.amber}}>+{b.pd50}%</td>
                <td style={{padding:'6px 10px',color:T.red}}>+{b.pd100}%</td>
                <td style={{padding:'6px 10px',color:'#cc2040',fontWeight:700}}>+{b.pd150}%</td>
                <td style={{padding:'6px 10px',color:T.sage}}>{b.lgdAdj}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ── Tab 3: IFRS 9 Climate Overlay ─────────────────────────────────────────────
const Ifrs9Tab = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
      <KpiCard label="Base ECL (Modelled)" value="£444M" sub="Stage 1 + 2 + 3" accent={T.sage} />
      <KpiCard label="Total Climate Overlay" value="+£438M" sub="Physical + Transition + Corr." accent={T.amber} />
      <KpiCard label="Climate-Adjusted ECL" value="£882M" sub="+98.6% vs base" accent={T.red} />
      <KpiCard label="NGFS Scenarios Used" value="4" sub="Net Zero, Orderly, Disorderly, Hot" accent={T.navy} />
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,boxShadow:T.card}}>
        <SectionTitle>ECL Waterfall — Base to Climate-Adjusted</SectionTitle>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={WATERFALL_DATA} margin={{top:4,right:8,left:-10,bottom:40}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="name" tick={{fill:T.textSec,fontSize:9}} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{fill:T.textSec,fontSize:10}} unit="M" />
            <Tooltip content={<CustomTooltip />} formatter={v => [`£${v}M`,'Amount']} />
            <Bar dataKey="value" radius={[4,4,0,0]}>
              {WATERFALL_DATA.map((entry,i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,boxShadow:T.card}}>
        <SectionTitle>ECL Build-up — Component Detail</SectionTitle>
        {[
          {label:'Stage 1 (12-month ECL)',      amt:42,  pct:4.8,   color:T.sage},
          {label:'Stage 2 (Lifetime, non-def)', amt:118, pct:13.4,  color:T.sage},
          {label:'Stage 3 (Lifetime, default)', amt:284, pct:32.2,  color:T.sage},
          {label:'Physical Risk Overlay',        amt:234, pct:26.5,  color:T.amber},
          {label:'Transition Risk Overlay',      amt:156, pct:17.7,  color:T.amber},
          {label:'Correlated Risk Uplift',       amt:48,  pct:5.4,   color:T.red},
        ].map(r => (
          <div key={r.label} style={{marginBottom:8}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
              <span style={{fontSize:11,color:T.text}}>{r.label}</span>
              <span style={{fontSize:11,color:r.color,fontWeight:700}}>£{r.amt}M</span>
            </div>
            <div style={{height:5,background:T.borderL,borderRadius:3}}>
              <div style={{height:'100%',width:`${r.pct * 3}%`,background:r.color,borderRadius:3,maxWidth:'100%'}} />
            </div>
          </div>
        ))}
        <div style={{marginTop:14,padding:'10px 14px',background:T.surfaceH,borderRadius:6,border:`1px solid ${T.border}`}}>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:12,color:T.text,fontWeight:700}}>Climate-Adjusted Total ECL</span>
            <span style={{fontSize:16,color:T.red,fontWeight:800}}>£882M</span>
          </div>
          <div style={{fontSize:11,color:T.textMut,marginTop:2}}>+98.6% vs modelled base ECL</div>
        </div>
      </div>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,boxShadow:T.card}}>
        <SectionTitle>Climate Overlay as % of Stage — by Sector</SectionTitle>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
          <thead>
            <tr style={{borderBottom:`1px solid ${T.border}`}}>
              {['Sector','Stage 1 Overlay %','Stage 2 Overlay %','Stage 3 Overlay %'].map(h => (
                <th key={h} style={{textAlign:'left',padding:'5px 8px',color:T.textSec}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SECTOR_OVERLAY.map((r,i) => (
              <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`}}>
                <td style={{padding:'5px 8px',color:T.text,fontWeight:500}}>{r.sector}</td>
                <td style={{padding:'5px 8px',color:T.amber}}>{r.s1}%</td>
                <td style={{padding:'5px 8px',color:T.amber}}>{r.s2}%</td>
                <td style={{padding:'5px 8px',color:T.red,fontWeight:700}}>{r.s3}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,boxShadow:T.card}}>
        <SectionTitle>IFRS 9 Disclosure Readiness Checklist</SectionTitle>
        {[
          {ok:true,  text:'Forward-looking information incorporated (IFRS 9 para 5.5.17)'},
          {ok:true,  text:'Multiple economic scenarios used (EBA guidelines on IFRS 9)'},
          {ok:true,  text:'Climate overlay documented & approved by Risk Committee'},
          {ok:true,  text:'NGFS scenario probability weighting applied'},
          {ok:true,  text:'Overlay methodology disclosed in Notes to Accounts'},
          {ok:false, text:'Granular borrower-level back-testing (in progress)'},
        ].map((item,i) => (
          <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:10}}>
            <div style={{width:18,height:18,borderRadius:'50%',
              background:item.ok?T.green:T.amber,
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:10,fontWeight:700,color:'#fff',flexShrink:0,marginTop:1}}>
              {item.ok ? '✓' : '~'}
            </div>
            <span style={{fontSize:11,color:item.ok?T.text:T.textSec,lineHeight:1.5}}>{item.text}</span>
          </div>
        ))}
        <div style={{marginTop:12,padding:'8px 12px',background:T.surfaceH,borderRadius:5,fontSize:10,color:T.textMut}}>
          Overlay methodology: NGFS scenario probability-weighted ECL. Scenarios: Net Zero 2050 (35%), Delayed Transition (30%), Divergent (20%), Current Policies (15%).
        </div>
      </div>
    </div>
  </div>
);

// ── Tab 4: Stranded Assets & Collateral ───────────────────────────────────────
const StrandedAssetsTab = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
      <KpiCard label="Mortgage Book (Residential)" value="£12.4bn" sub="UK residential portfolio" accent={T.sage} />
      <KpiCard label="EPC D-G Value at Risk" value="£1.84bn" sub="Potential stranding exposure" accent={T.red} />
      <KpiCard label="LGD Haircut (EPC F-G)" value="20-22%" sub="Applied to collateral value" accent={T.amber} />
      <KpiCard label="MEES Compliance Date" value="2028" sub="EPC C minimum all tenancies" accent={T.navy} />
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,boxShadow:T.card}}>
        <SectionTitle>UK Mortgage Portfolio — EPC Distribution & Stranding Risk</SectionTitle>
        <div style={{marginBottom:12}}>
          {EPC_DATA.map(e => (
            <div key={e.band} style={{display:'flex',alignItems:'center',gap:10,marginBottom:7}}>
              <div style={{width:28,height:22,background:e.color,borderRadius:4,
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:11,fontWeight:800,color:'#fff',flexShrink:0}}>{e.band}</div>
              <div style={{flex:1}}>
                <div style={{height:14,background:e.color,borderRadius:3,
                  opacity:0.85,width:`${e.pct * 2.8}%`,minWidth:8}} />
              </div>
              <div style={{width:36,fontSize:11,color:T.text,fontWeight:600,textAlign:'right'}}>{e.pct}%</div>
              <div style={{width:72,fontSize:10,color:T.textSec}}>{e.risk}</div>
              <div style={{width:52,fontSize:10,color:e.haircut>0?T.amber:T.textMut,textAlign:'right'}}>
                {e.haircut>0?`${e.haircut}% cut`:'—'}
              </div>
            </div>
          ))}
        </div>
        <div style={{padding:'10px 12px',background:T.surfaceH,borderRadius:6,border:`1px solid ${T.borderL}`,fontSize:11}}>
          <div style={{color:T.text,fontWeight:600,marginBottom:4}}>EPC D-G Properties (57% of portfolio)</div>
          <div style={{color:T.textSec}}>Value at risk: <strong style={{color:T.red}}>£1.84bn</strong> — subject to MEES regulatory haircut</div>
        </div>
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,boxShadow:T.card}}>
        <SectionTitle>Cumulative Stranded Asset Value 2024–2050</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={STRANDED_TIMELINE} margin={{top:4,right:8,left:-10,bottom:0}}>
            <defs>
              <linearGradient id="strandedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={T.red} stopOpacity={0.3} />
                <stop offset="95%" stopColor={T.red} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="year" tick={{fill:T.textSec,fontSize:9}} interval={4} />
            <YAxis tick={{fill:T.textSec,fontSize:10}} unit="M" />
            <Tooltip content={<CustomTooltip />} formatter={v => [`£${v}M`,'Stranded Value']} />
            <Area type="monotone" dataKey="stranded" stroke={T.red} fill="url(#strandedGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{fontSize:10,color:T.textMut,marginTop:6,textAlign:'center'}}>
          Cumulative CRE + residential stranded value (£M) by policy milestone
        </div>
      </div>
    </div>

    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,boxShadow:T.card}}>
      <SectionTitle>MEES (Minimum Energy Efficiency Standards) Regulatory Timeline — UK</SectionTitle>
      <div style={{display:'flex',gap:0,overflowX:'auto',paddingBottom:8}}>
        {[
          {year:'April 2023',date:'In force',  text:'EPC E minimum for existing rental tenancies (private sector)',           status:'active' },
          {year:'2025',     date:'Proposed',   text:'EPC C minimum for new tenancies (residential lettings)',                 status:'upcoming'},
          {year:'2028',     date:'Target',     text:'EPC C minimum for all tenancies — entire rental stock must comply',      status:'critical'},
          {year:'2033',     date:'Proposed',   text:'EPC B minimum standard — likely for new lettings and major refurbishments', status:'future'},
        ].map((m,i) => (
          <div key={i} style={{flex:'0 0 220px',padding:'14px 16px',
            background: m.status==='active'?`${T.green}18`:m.status==='critical'?`${T.red}18`:T.surfaceH,
            border:`1px solid ${m.status==='active'?T.green:m.status==='critical'?T.red:T.border}`,
            borderRadius:8, marginRight:8, position:'relative'}}>
            <div style={{fontSize:14,fontWeight:800,
              color:m.status==='active'?T.green:m.status==='critical'?T.red:T.amber,
              marginBottom:4}}>{m.year}</div>
            <div style={{fontSize:9,color:T.textMut,textTransform:'uppercase',
              letterSpacing:'0.1em',marginBottom:8}}>{m.date}</div>
            <div style={{fontSize:11,color:T.text,lineHeight:1.5}}>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:16,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        {[
          {label:'EPC E+ properties (rental ban risk)',  value:'8%',   note:'F & G rated — already non-compliant 2023',  accent:T.red},
          {label:'EPC D properties (2028 risk cohort)',  value:'35%',  note:'Largest at-risk segment, £643M LTV exposure', accent:T.amber},
          {label:'Avg. retrofit cost per property',      value:'£18k', note:'EPC D→C; range £8k–£42k depending on type', accent:T.sage},
        ].map(s => (
          <div key={s.label} style={{padding:'12px 16px',background:T.surfaceH,borderRadius:6,
            border:`1px solid ${T.borderL}`,borderLeft:`3px solid ${s.accent}`}}>
            <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>{s.label}</div>
            <div style={{fontSize:20,fontWeight:700,color:T.text,marginBottom:3}}>{s.value}</div>
            <div style={{fontSize:10,color:T.textMut}}>{s.note}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = ['Physical Risk', 'Transition Risk', 'IFRS 9 Overlay', 'Stranded Assets'];

export default function ClimateCreditRiskPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text,padding:24}}>
      {/* Header */}
      <div style={{marginBottom:24}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
              <div style={{width:4,height:28,background:T.navy,borderRadius:2}} />
              <h1 style={{fontSize:22,fontWeight:800,color:T.text,margin:0,letterSpacing:'-0.02em'}}>
                Climate Credit Risk Analytics
              </h1>
            </div>
            <div style={{fontSize:12,color:T.textSec,marginLeft:14}}>
              EP-AJ5 — IFRS 9 Climate Overlay | Sprint AJ: Financed Emissions & Climate Banking Analytics
            </div>
          </div>
          <div style={{display:'flex',gap:10}}>
            {[
              {label:'NGFS Phase IV',  color:T.sage},
              {label:'IFRS 9',         color:T.amber},
              {label:'UK MEES',        color:T.red},
            ].map(b => (
              <div key={b.label} style={{padding:'4px 12px',borderRadius:12,border:`1px solid ${b.color}`,
                fontSize:10,color:b.color,fontWeight:600,letterSpacing:'0.06em'}}>
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{display:'flex',gap:2,marginBottom:24,borderBottom:`1px solid ${T.border}`,paddingBottom:0}}>
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)} style={{
            padding:'9px 18px', border:'none', cursor:'pointer',
            background: activeTab===i ? T.surface : 'transparent',
            color: activeTab===i ? T.text : T.textSec,
            fontSize:12, fontWeight: activeTab===i ? 700 : 500,
            borderBottom: activeTab===i ? `2px solid ${T.navy}` : '2px solid transparent',
            borderRadius: '6px 6px 0 0',
            marginBottom:-1, transition:'all 0.15s',
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 0 && <PhysicalRiskTab />}
      {activeTab === 1 && <TransitionRiskTab />}
      {activeTab === 2 && <Ifrs9Tab />}
      {activeTab === 3 && <StrandedAssetsTab />}
    </div>
  );
}
