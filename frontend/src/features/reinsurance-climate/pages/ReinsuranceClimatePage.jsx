import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Cell,Legend,PieChart,Pie} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ── Constants ─────────────────────────────────────────── */
const TABS=['Treaty Portfolio','Climate-Adjusted Pricing','ILS & Cat Bond Market','Retrocession & Systemic Risk'];
const REINSURERS=['Munich Re','Swiss Re','Hannover Re','SCOR','Berkshire Hathaway','Lloyd\'s Syndicates','RenaissanceRe','Everest Re','PartnerRe','Arch Capital','Transatlantic Re','Odyssey Re','Fairfax Financial','Markel Corp','Axis Capital','Korean Re','China Re','General Re','Tokio Millennium','MS&AD'];
const TREATY_TYPES=['Quota Share','Surplus','Per Risk XL','Cat XL','Aggregate XL','Stop Loss'];
const PERILS=['Hurricane','Earthquake','Flood','Wildfire','Tornado','Winter Storm','Tsunami','Hail'];
const PERIL_COLORS=[T.navy,T.red,T.sage,'#e97706',T.navyL,T.gold,'#0891b2','#6366f1'];
const REGIONS=['North America','Europe','Asia Pacific','Latin America','Global'];
const PIE_COLORS=[T.navy,T.gold,T.sage,T.red,T.navyL,T.amber,'#6366f1','#0891b2'];

/* ── Treaties: 40 ──────────────────────────────────────── */
const TREATIES=Array.from({length:40},(_,i)=>{
  const s1=sr(i*17+1);const s2=sr(i*17+2);const s3=sr(i*17+3);const s4=sr(i*17+4);const s5=sr(i*17+5);const s6=sr(i*17+6);const s7=sr(i*17+7);const s8=sr(i*17+8);const s9=sr(i*17+9);const s10=sr(i*17+10);
  const reinsurer=REINSURERS[Math.floor(s1*REINSURERS.length)];
  const type=TREATY_TYPES[Math.floor(s2*TREATY_TYPES.length)];
  const peril=PERILS[Math.floor(s3*PERILS.length)];
  const region=REGIONS[Math.floor(s4*REGIONS.length)];
  const limit=Math.round(50+s5*450);
  const retention=Math.round(5+s6*limit*0.3);
  const premium=+(limit*0.02+s7*limit*0.07).toFixed(1);
  const technicalPrice=+(premium*(0.85+s8*0.3)).toFixed(1);
  const climateAdjPrice=+(technicalPrice*(1.05+s9*0.35)).toFixed(1);
  const historicalLR=+(0.3+s1*0.5).toFixed(2);
  const climateAdjLR=+(historicalLR*(1.1+s2*0.3)).toFixed(2);
  const rateOnLine=+(premium/limit*100).toFixed(2);
  const climateUplift=+(1.05+s3*0.40).toFixed(2);
  const yearsOnBook=Math.round(1+s4*15);
  const rating=['A++','A+','A','A-','B++','B+'][Math.floor(s5*6)];
  const collateral=Math.round(limit*0.3+s6*limit*0.5);
  const reinstatements=Math.floor(s7*3);
  const inception=`${2022+Math.floor(s8*3)}-${String(1+Math.floor(s9*12)).padStart(2,'0')}-01`;
  const status=s10>0.2?'Active':'Expired';
  return {id:i+1,name:`RE-${String(i+1).padStart(3,'0')}`,reinsurer,type,peril,region,limit,retention,premium,technicalPrice,climateAdjPrice,historicalLR,climateAdjLR,rateOnLine,climateUplift,yearsOnBook,rating,collateral,reinstatements,inception,status};
});

/* ── Cat Bonds: 30 ─────────────────────────────────────── */
const CAT_BONDS=Array.from({length:30},(_,i)=>{
  const s1=sr(i*23+1);const s2=sr(i*23+2);const s3=sr(i*23+3);const s4=sr(i*23+4);const s5=sr(i*23+5);const s6=sr(i*23+6);const s7=sr(i*23+7);
  const sponsor=['Swiss Re','Munich Re','USAA','Zurich','AIG','Tokio Marine','Allianz','State Farm','Chubb','GEICO','Nationwide','Travelers','Liberty Mutual','CSAA','Citizens','Everest'][Math.floor(s1*16)];
  const peril=PERILS[Math.floor(s2*PERILS.length)];
  const triggerType=['Indemnity','Industry Loss','Parametric','Modelled Loss'][Math.floor(s3*4)];
  const size=Math.round(50+s4*450);
  const coupon=+(2+s5*8).toFixed(2);
  const expectedLoss=+(0.5+s6*5).toFixed(2);
  const spread=+(coupon+1+s7*3).toFixed(2);
  const climateRiskPremium=+(0.5+s1*3).toFixed(2);
  const maturity=`${2025+Math.floor(s2*4)}-${String(1+Math.floor(s3*12)).padStart(2,'0')}`;
  const rating=['BB+','BB','BB-','B+','B','NR'][Math.floor(s4*6)];
  const attachmentProb=+(1+s5*8).toFixed(1);
  const exhaustionProb=+(0.2+s6*3).toFixed(1);
  const status=s7>0.15?'Outstanding':'Matured';
  return {id:i+1,name:`CB-${String(i+1).padStart(3,'0')}`,sponsor,peril,triggerType,size,coupon,expectedLoss,spread,climateRiskPremium,maturity,rating,attachmentProb,exhaustionProb,status};
});

/* ── Historical Loss Data ──────────────────────────────── */
const LOSS_HISTORY=Array.from({length:15},(_,i)=>{
  const year=2010+i;
  return {year:String(year),insuredLoss:Math.round(40+sr(i*41)*200),industryLoss:Math.round(80+sr(i*43)*400),reinsuredLoss:Math.round(20+sr(i*47)*120),catBondPayout:Math.round(sr(i*53)*50)};
});

/* ── Climate Uplift Factors ────────────────────────────── */
const CLIMATE_UPLIFT_BY_PERIL=PERILS.map((p,i)=>({
  peril:p,current:1.0,ssp126:+(1.05+sr(i*61)*0.15).toFixed(2),ssp245:+(1.15+sr(i*67)*0.25).toFixed(2),ssp370:+(1.25+sr(i*71)*0.35).toFixed(2),ssp585:+(1.35+sr(i*73)*0.50).toFixed(2)
}));

const REGION_UPLIFT=REGIONS.map((r,i)=>({
  region:r,historicalTrend:+(1+sr(i*79)*0.3).toFixed(2),projected2030:+(1.1+sr(i*83)*0.4).toFixed(2),projected2050:+(1.2+sr(i*87)*0.6).toFixed(2)
}));

/* ── Retrocession Data ─────────────────────────────────── */
const RETRO_LAYERS=[
  {layer:'Retro Layer 1',attachment:500,limit:500,premium:15.2,expectedLoss:4.8,rateOnLine:3.04},
  {layer:'Retro Layer 2',attachment:1000,limit:1000,premium:12.5,expectedLoss:2.1,rateOnLine:1.25},
  {layer:'Retro Layer 3',attachment:2000,limit:2000,premium:8.8,expectedLoss:0.9,rateOnLine:0.44},
  {layer:'Industry Loss Warranty',attachment:0,limit:500,premium:18.5,expectedLoss:7.2,rateOnLine:3.7},
  {layer:'Sidecar QS',attachment:0,limit:300,premium:22.1,expectedLoss:12.5,rateOnLine:7.37},
];

/* ── Styles ─────────────────────────────────────────── */
const S={
  page:{fontFamily:T.font,background:T.bg,color:T.text,minHeight:'100vh',padding:'24px'},
  header:{marginBottom:20},
  h1:{fontSize:22,fontWeight:700,margin:0,color:T.navy},
  sub:{fontSize:13,color:T.textSec,marginTop:4,fontFamily:T.mono},
  tabs:{display:'flex',gap:0,borderBottom:`2px solid ${T.border}`,marginBottom:20},
  tab:(a)=>({padding:'10px 20px',fontSize:13,fontWeight:a?700:500,color:a?T.gold:T.textSec,borderBottom:a?`2px solid ${T.gold}`:'2px solid transparent',cursor:'pointer',background:'none',border:'none',fontFamily:T.font,marginBottom:-2}),
  card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16,marginBottom:16},
  cardTitle:{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12},
  grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16},
  grid3:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16},
  grid4:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12},
  kpi:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:14,textAlign:'center'},
  kpiVal:{fontSize:22,fontWeight:700,color:T.navy,fontFamily:T.mono},
  kpiLbl:{fontSize:11,color:T.textSec,marginTop:4},
  table:{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.mono},
  th:{textAlign:'left',padding:'8px 10px',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11,position:'sticky',top:0,background:T.surface},
  td:{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap'},
  badge:(c)=>({display:'inline-block',padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,background:c===T.red?'#fef2f2':c===T.amber?'#fffbeb':c===T.green?'#f0fdf4':'#eff6ff',color:c}),
  btn:(a)=>({padding:'6px 14px',fontSize:12,fontWeight:600,borderRadius:6,border:a?'none':`1px solid ${T.border}`,background:a?T.navy:T.surface,color:a?'#fff':T.text,cursor:'pointer',fontFamily:T.font}),
  select:{padding:'6px 10px',fontSize:12,borderRadius:6,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontFamily:T.font},
  scroll:{maxHeight:420,overflowY:'auto'},
  chip:(a)=>({display:'inline-block',padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:600,background:a?T.navy:'transparent',color:a?'#fff':T.textSec,border:a?'none':`1px solid ${T.border}`,cursor:'pointer',marginRight:4}),
  dot:(c)=>({width:8,height:8,borderRadius:'50%',background:c,display:'inline-block'}),
};

/* ── Component ─────────────────────────────────────────── */
export default function ReinsuranceClimatePage(){
  const [tab,setTab]=useState(0);
  const [typeFilter,setTypeFilter]=useState('All');
  const [perilFilter,setPerilFilter]=useState('All');
  const [regionFilter,setRegionFilter]=useState('All');
  const [sortCol,setSortCol]=useState('premium');
  const [sortDir,setSortDir]=useState('desc');
  const [treatyPage,setTreatyPage]=useState(0);
  const [bondPage,setBondPage]=useState(0);
  const [selectedTreaty,setSelectedTreaty]=useState(null);
  const [pricingSSP,setPricingSSP]=useState(1);
  const [pricingHorizon,setPricingHorizon]=useState(2030);
  const [bondFilter,setBondFilter]=useState('All');
  const [expandedRetro,setExpandedRetro]=useState(null);

  const filteredTreaties=useMemo(()=>{
    let f=[...TREATIES];
    if(typeFilter!=='All')f=f.filter(t=>t.type===typeFilter);
    if(perilFilter!=='All')f=f.filter(t=>t.peril===perilFilter);
    if(regionFilter!=='All')f=f.filter(t=>t.region===regionFilter);
    f.sort((a,b)=>sortDir==='asc'?a[sortCol]-b[sortCol]:b[sortCol]-a[sortCol]);
    return f;
  },[typeFilter,perilFilter,regionFilter,sortCol,sortDir]);

  const filteredBonds=useMemo(()=>{
    let f=[...CAT_BONDS];
    if(bondFilter!=='All')f=f.filter(b=>b.peril===bondFilter);
    return f;
  },[bondFilter]);

  const portfolioStats=useMemo(()=>{
    const active=TREATIES.filter(t=>t.status==='Active');
    const totalLimit=active.reduce((a,b)=>a+b.limit,0);
    const totalPremium=active.reduce((a,b)=>a+b.premium,0);
    const avgLR=+(active.reduce((a,b)=>a+b.historicalLR,0)/Math.max(1,active.length)).toFixed(2);
    const avgClimateAdj=+(active.reduce((a,b)=>a+b.climateUplift,0)/Math.max(1,active.length)).toFixed(2);
    const totalCatBonds=CAT_BONDS.filter(b=>b.status==='Outstanding').reduce((a,b)=>a+b.size,0);
    return {active:active.length,totalLimit,totalPremium:+totalPremium.toFixed(1),avgLR,avgClimateAdj,totalCatBonds,reinsurers:new Set(TREATIES.map(t=>t.reinsurer)).size,treaties:TREATIES.length};
  },[]);

  const PAGE_SIZE=12;
  const treatyPages=Math.ceil(filteredTreaties.length/PAGE_SIZE);
  const pagedTreaties=filteredTreaties.slice(treatyPage*PAGE_SIZE,(treatyPage+1)*PAGE_SIZE);
  const bondPages=Math.ceil(filteredBonds.length/PAGE_SIZE);
  const pagedBonds=filteredBonds.slice(bondPage*PAGE_SIZE,(bondPage+1)*PAGE_SIZE);
  const handleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}setTreatyPage(0);};

  /* ── Tab 1: Treaty Portfolio ─────────────────────── */
  const renderTreaties=()=>(
    <div>
      <div style={S.grid4}>
        {[{l:'Active Treaties',v:portfolioStats.active},{l:'Total Limit',v:`$${(portfolioStats.totalLimit/1000).toFixed(1)}B`},{l:'Total Premium',v:`$${portfolioStats.totalPremium}M`},{l:'Avg Loss Ratio',v:`${(portfolioStats.avgLR*100).toFixed(0)}%`},{l:'Avg Climate Adj',v:`x${portfolioStats.avgClimateAdj}`,c:portfolioStats.avgClimateAdj>1.25?T.red:T.amber},{l:'Cat Bond Market',v:`$${portfolioStats.totalCatBonds}M`},{l:'Reinsurers',v:portfolioStats.reinsurers},{l:'Counterparties',v:new Set(TREATIES.map(t=>t.reinsurer)).size}].map((k,i)=>(
          <div key={i} style={S.kpi}><div style={{...S.kpiVal,color:k.c||T.navy}}>{k.v}</div><div style={S.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={{display:'flex',gap:12,marginTop:16,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <select style={S.select} value={typeFilter} onChange={e=>{setTypeFilter(e.target.value);setTreatyPage(0);}}>
          <option value="All">All Types</option>{TREATY_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <select style={S.select} value={perilFilter} onChange={e=>{setPerilFilter(e.target.value);setTreatyPage(0);}}>
          <option value="All">All Perils</option>{PERILS.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
        <select style={S.select} value={regionFilter} onChange={e=>{setRegionFilter(e.target.value);setTreatyPage(0);}}>
          <option value="All">All Regions</option>{REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <span style={{fontSize:12,color:T.textSec}}>{filteredTreaties.length} treaties</span>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Treaty Portfolio</div>
        <div style={S.scroll}>
          <table style={S.table}>
            <thead><tr>{[['name','Treaty'],['reinsurer','Reinsurer'],['type','Type'],['peril','Peril'],['region','Region'],['limit','Limit ($M)'],['premium','Premium ($M)'],['rateOnLine','ROL %'],['historicalLR','Hist LR'],['climateAdjLR','Adj LR'],['climateUplift','Climate'],['rating','Rating']].map(([k,h])=>(
              <th key={k} style={{...S.th,cursor:'pointer'}} onClick={()=>handleSort(k)}>{h}{sortCol===k?(sortDir==='asc'?' ↑':' ↓'):''}</th>
            ))}</tr></thead>
            <tbody>{pagedTreaties.map((t,i)=>(
              <tr key={t.id} style={{background:i%2?T.surfaceH:'transparent',cursor:'pointer'}} onClick={()=>setSelectedTreaty(selectedTreaty===t.id?null:t.id)}>
                <td style={S.td}>{t.name}</td><td style={{...S.td,fontSize:11}}>{t.reinsurer}</td><td style={S.td}>{t.type}</td>
                <td style={S.td}><span style={{...S.dot(PERIL_COLORS[PERILS.indexOf(t.peril)]),marginRight:4}}/>{t.peril}</td>
                <td style={S.td}>{t.region}</td><td style={{...S.td,fontWeight:600}}>{t.limit}</td><td style={S.td}>{t.premium}</td>
                <td style={S.td}>{t.rateOnLine}%</td>
                <td style={S.td}><span style={S.badge(t.historicalLR>0.6?T.red:t.historicalLR>0.4?T.amber:T.green)}>{(t.historicalLR*100).toFixed(0)}%</span></td>
                <td style={S.td}><span style={S.badge(t.climateAdjLR>0.7?T.red:t.climateAdjLR>0.5?T.amber:T.green)}>{(t.climateAdjLR*100).toFixed(0)}%</span></td>
                <td style={S.td}><span style={S.badge(t.climateUplift>1.3?T.red:t.climateUplift>1.15?T.amber:T.green)}>x{t.climateUplift}</span></td>
                <td style={S.td}>{t.rating}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {selectedTreaty&&(()=>{const t=TREATIES.find(x=>x.id===selectedTreaty);if(!t)return null;return(
          <div style={{marginTop:12,padding:14,background:T.surfaceH,borderRadius:8,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>{t.name} — {t.reinsurer}</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,fontSize:11}}>
              <div><span style={{color:T.textSec}}>Technical Price:</span> <strong>${t.technicalPrice}M</strong></div>
              <div><span style={{color:T.textSec}}>Climate-Adj Price:</span> <strong>${t.climateAdjPrice}M</strong></div>
              <div><span style={{color:T.textSec}}>Retention:</span> <strong>${t.retention}M</strong></div>
              <div><span style={{color:T.textSec}}>Collateral:</span> <strong>${t.collateral}M</strong></div>
              <div><span style={{color:T.textSec}}>Reinstatements:</span> <strong>{t.reinstatements}</strong></div>
              <div><span style={{color:T.textSec}}>Years on Book:</span> <strong>{t.yearsOnBook}</strong></div>
              <div><span style={{color:T.textSec}}>Inception:</span> <strong>{t.inception}</strong></div>
              <div><span style={{color:T.textSec}}>Climate Uplift:</span> <strong style={{color:t.climateUplift>1.25?T.red:T.amber}}>+{((t.climateUplift-1)*100).toFixed(0)}%</strong></div>
              <div><span style={{color:T.textSec}}>Rating:</span> <strong>{t.rating}</strong></div>
              <div><span style={{color:T.textSec}}>Status:</span> <span style={S.badge(t.status==='Active'?T.green:T.textMut)}>{t.status}</span></div>
            </div>
          </div>
        );})()}
        <div style={{display:'flex',gap:8,marginTop:10,alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:11,color:T.textSec}}>Page {treatyPage+1} of {treatyPages}</span>
          <div style={{display:'flex',gap:4}}>
            <button style={S.btn(false)} disabled={treatyPage===0} onClick={()=>setTreatyPage(p=>p-1)}>← Prev</button>
            <button style={S.btn(false)} disabled={treatyPage>=treatyPages-1} onClick={()=>setTreatyPage(p=>p+1)}>Next →</button>
          </div>
        </div>
      </div>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Limit by Treaty Type</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart><Pie data={TREATY_TYPES.map(t=>{const ts=TREATIES.filter(tr=>tr.type===t);return {name:t,value:ts.reduce((a,b)=>a+b.limit,0)};}).filter(x=>x.value>0)} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" label={({name,percent})=>`${name.split(' ')[0]} ${(percent*100).toFixed(0)}%`}>{TREATY_TYPES.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}</Pie><Tooltip contentStyle={{fontSize:11}}/></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Premium by Region</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={REGIONS.map(r=>{const ts=TREATIES.filter(t=>t.region===r);return {region:r,premium:+ts.reduce((a,b)=>a+b.premium,0).toFixed(1),limit:ts.reduce((a,b)=>a+b.limit,0)};})}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="region" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="premium" name="Premium ($M)" fill={T.navy}/><Bar dataKey="limit" name="Limit ($M)" fill={T.gold}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  /* ── Tab 2: Climate-Adjusted Pricing ─────────────── */
  const renderPricing=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <span style={{fontSize:12,fontWeight:600}}>SSP Pathway:</span>
        {['SSP1-2.6','SSP2-4.5','SSP3-7.0','SSP5-8.5'].map((s,i)=><button key={s} style={S.btn(pricingSSP===i)} onClick={()=>setPricingSSP(i)}>{s}</button>)}
        <span style={{fontSize:12,fontWeight:600,marginLeft:16}}>Horizon:</span>
        {[2030,2040,2050].map(y=><button key={y} style={S.btn(pricingHorizon===y)} onClick={()=>setPricingHorizon(y)}>{y}</button>)}
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Climate Uplift by Peril ({['SSP1-2.6','SSP2-4.5','SSP3-7.0','SSP5-8.5'][pricingSSP]})</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={CLIMATE_UPLIFT_BY_PERIL}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="peril" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}} domain={[0.8,2.0]}/><Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="current" name="Current (1.0)" fill={T.border}/><Bar dataKey={['ssp126','ssp245','ssp370','ssp585'][pricingSSP]} name={`${['SSP1-2.6','SSP2-4.5','SSP3-7.0','SSP5-8.5'][pricingSSP]} Uplift`}>{CLIMATE_UPLIFT_BY_PERIL.map((e,i)=>{const val=e[['ssp126','ssp245','ssp370','ssp585'][pricingSSP]];return <Cell key={i} fill={val>1.4?T.red:val>1.2?T.amber:T.green}/>;})}</Bar></BarChart>
        </ResponsiveContainer>
      </div>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Historical Loss Trend (2010-2024)</div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={LOSS_HISTORY}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11}}/><Legend wrapperStyle={{fontSize:11}}/><Area type="monotone" dataKey="industryLoss" name="Industry Loss ($B)" stroke={T.red} fill={T.red} fillOpacity={0.15}/><Area type="monotone" dataKey="insuredLoss" name="Insured Loss ($B)" stroke={T.navy} fill={T.navy} fillOpacity={0.15}/><Area type="monotone" dataKey="reinsuredLoss" name="Reinsured Loss ($B)" stroke={T.sage} fill={T.sage} fillOpacity={0.2}/></AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Regional Climate Adjustment Factors</div>
          <div style={S.scroll}>
            <table style={S.table}>
              <thead><tr>{['Region','Historical Trend','2030 Projected','2050 Projected','Price Impact'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{REGION_UPLIFT.map((r,i)=>(
                <tr key={i} style={{background:i%2?T.surfaceH:'transparent'}}>
                  <td style={{...S.td,fontWeight:600}}>{r.region}</td>
                  <td style={S.td}>x{r.historicalTrend}</td>
                  <td style={S.td}><span style={S.badge(r.projected2030>1.3?T.red:r.projected2030>1.2?T.amber:T.green)}>x{r.projected2030}</span></td>
                  <td style={S.td}><span style={S.badge(r.projected2050>1.5?T.red:r.projected2050>1.3?T.amber:T.green)}>x{r.projected2050}</span></td>
                  <td style={S.td}>+{((r[`projected${pricingHorizon===2030?'2030':'2050'}`]-1)*100).toFixed(0)}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Projected Premium Adequacy ({pricingHorizon})</div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={TREATIES.filter(t=>t.status==='Active').slice(0,15).map(t=>{
            const uplift=[1.05,1.15,1.30,1.50][pricingSSP];
            const horizonFactor=1+(pricingHorizon-2025)*0.005*([1,2,3,4][pricingSSP]);
            return {treaty:t.name,current:t.premium,required:+(t.premium*uplift*horizonFactor).toFixed(1),gap:+((t.premium*uplift*horizonFactor)-t.premium).toFixed(1)};
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="treaty" tick={{fontSize:9}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="current" name="Current Premium" fill={T.navy}/><Bar dataKey="required" name="Climate-Adj Required" fill={T.red}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  /* ── Tab 3: ILS & Cat Bond Market ────────────────── */
  const renderILS=()=>(
    <div>
      <div style={S.grid4}>
        {[{l:'Outstanding Bonds',v:CAT_BONDS.filter(b=>b.status==='Outstanding').length},{l:'Market Size',v:`$${(CAT_BONDS.filter(b=>b.status==='Outstanding').reduce((a,b)=>a+b.size,0)/1000).toFixed(1)}B`},{l:'Avg Coupon',v:`${(CAT_BONDS.reduce((a,b)=>a+b.coupon,0)/ Math.max(1, CAT_BONDS.length)).toFixed(1)}%`},{l:'Avg Spread',v:`${(CAT_BONDS.reduce((a,b)=>a+b.spread,0)/ Math.max(1, CAT_BONDS.length)).toFixed(1)}%`},{l:'Avg Exp. Loss',v:`${(CAT_BONDS.reduce((a,b)=>a+b.expectedLoss,0)/ Math.max(1, CAT_BONDS.length)).toFixed(1)}%`},{l:'Climate Premium',v:`${(CAT_BONDS.reduce((a,b)=>a+b.climateRiskPremium,0)/ Math.max(1, CAT_BONDS.length)).toFixed(1)}%`},{l:'Parametric Triggers',v:CAT_BONDS.filter(b=>b.triggerType==='Parametric').length},{l:'Matured/Paid',v:CAT_BONDS.filter(b=>b.status==='Matured').length}].map((k,i)=>(
          <div key={i} style={S.kpi}><div style={S.kpiVal}>{k.v}</div><div style={S.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={{display:'flex',gap:4,marginTop:12,marginBottom:12,flexWrap:'wrap'}}>
        <button style={S.chip(bondFilter==='All')} onClick={()=>{setBondFilter('All');setBondPage(0);}}>All Perils</button>
        {PERILS.map(p=><button key={p} style={S.chip(bondFilter===p)} onClick={()=>{setBondFilter(p);setBondPage(0);}}>{p}</button>)}
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Cat Bond Market ({filteredBonds.length} bonds)</div>
        <div style={S.scroll}>
          <table style={S.table}>
            <thead><tr>{['Bond','Sponsor','Peril','Trigger','Size ($M)','Coupon %','Spread %','Exp Loss %','Climate Prem %','Rating','Maturity','Status'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{pagedBonds.map((b,i)=>(
              <tr key={b.id} style={{background:i%2?T.surfaceH:'transparent'}}>
                <td style={S.td}>{b.name}</td><td style={{...S.td,fontSize:11}}>{b.sponsor}</td>
                <td style={S.td}><span style={{...S.dot(PERIL_COLORS[PERILS.indexOf(b.peril)]),marginRight:4}}/>{b.peril}</td>
                <td style={S.td}>{b.triggerType}</td><td style={{...S.td,fontWeight:600}}>{b.size}</td>
                <td style={S.td}>{b.coupon}%</td><td style={S.td}>{b.spread}%</td>
                <td style={S.td}><span style={S.badge(b.expectedLoss>3?T.red:b.expectedLoss>1.5?T.amber:T.green)}>{b.expectedLoss}%</span></td>
                <td style={S.td}>{b.climateRiskPremium}%</td><td style={S.td}>{b.rating}</td>
                <td style={S.td}>{b.maturity}</td>
                <td style={S.td}><span style={S.badge(b.status==='Outstanding'?T.green:T.textMut)}>{b.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{display:'flex',gap:8,marginTop:10,alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:11,color:T.textSec}}>Page {bondPage+1} of {bondPages}</span>
          <div style={{display:'flex',gap:4}}>
            <button style={S.btn(false)} disabled={bondPage===0} onClick={()=>setBondPage(p=>p-1)}>← Prev</button>
            <button style={S.btn(false)} disabled={bondPage>=bondPages-1} onClick={()=>setBondPage(p=>p+1)}>Next →</button>
          </div>
        </div>
      </div>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Cat Bond Spread vs Expected Loss</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={CAT_BONDS.filter(b=>b.status==='Outstanding').slice(0,12).sort((a,b)=>b.spread-a.spread)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:9}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="spread" name="Spread %" fill={T.navy}/><Bar dataKey="expectedLoss" name="Expected Loss %" fill={T.red}/><Bar dataKey="climateRiskPremium" name="Climate Premium %" fill={T.amber}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Trigger Type Distribution</div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart><Pie data={['Indemnity','Industry Loss','Parametric','Modelled Loss'].map(t=>({name:t,value:CAT_BONDS.filter(b=>b.triggerType===t).length}))} cx="50%" cy="50%" innerRadius={40} outerRadius={90} dataKey="value" label={({name,value})=>`${name}: ${value}`}>{[T.navy,T.gold,T.sage,T.red].map((c,i)=><Cell key={i} fill={c}/>)}</Pie><Tooltip contentStyle={{fontSize:11}}/></PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  /* ── Tab 4: Retrocession & Systemic ──────────────── */
  const renderRetrocession=()=>(
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>Retrocession Layer Structure</div>
        {RETRO_LAYERS.map((l,i)=>(
          <div key={i} style={{cursor:'pointer',marginBottom:4}} onClick={()=>setExpandedRetro(expandedRetro===i?null:i)}>
            <div style={{display:'flex',alignItems:'center',gap:12,padding:10,background:expandedRetro===i?T.surfaceH:T.surface,borderRadius:6,border:`1px solid ${T.border}`}}>
              <div style={{width:160,fontSize:12,fontWeight:600}}>{l.layer}</div>
              <div style={{flex:1}}>
                <div style={{height:16,borderRadius:4,background:T.border,position:'relative'}}>
                  <div style={{height:16,borderRadius:4,background:`linear-gradient(90deg,${T.navy},${T.navyL})`,width:`${Math.min(100,l.limit/30)}%`,display:'flex',alignItems:'center',paddingLeft:6}}>
                    <span style={{fontSize:9,color:'#fff',fontFamily:T.mono}}>${l.limit}M xs ${l.attachment}M</span>
                  </div>
                </div>
              </div>
              <div style={{width:80,fontSize:11,fontFamily:T.mono,textAlign:'right'}}>${l.premium}M</div>
              <div style={{width:80,fontSize:11,textAlign:'right'}}><span style={S.badge(l.rateOnLine>5?T.red:l.rateOnLine>2?T.amber:T.green)}>{l.rateOnLine}% ROL</span></div>
            </div>
            {expandedRetro===i&&(
              <div style={{padding:12,background:T.surfaceH,borderRadius:'0 0 6px 6px',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,fontSize:11}}>
                <div><span style={{color:T.textSec}}>Expected Loss:</span> <strong>${l.expectedLoss}M</strong></div>
                <div><span style={{color:T.textSec}}>Loss Ratio:</span> <strong>{((l.expectedLoss/l.premium)*100).toFixed(1)}%</strong></div>
                <div><span style={{color:T.textSec}}>Payback Period:</span> <strong>{(l.limit/l.premium).toFixed(1)} years</strong></div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Industry Loss Exceedance Curve</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={[10,25,50,100,200,250,500,1000].map(rp=>({rp,current:Math.round(50+Math.log10(rp)*150+sr(rp)*50),climateAdj:Math.round((50+Math.log10(rp)*150+sr(rp)*50)*([1.1,1.2,1.35,1.55][pricingSSP]))}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="rp" tick={{fontSize:10}} label={{value:'Return Period (years)',position:'insideBottom',offset:-5,fontSize:10}}/><YAxis tick={{fontSize:10}} label={{value:'Industry Loss ($B)',angle:-90,position:'insideLeft',fontSize:10}}/><Tooltip contentStyle={{fontSize:11}}/><Legend wrapperStyle={{fontSize:11}}/><Line type="monotone" dataKey="current" name="Current View" stroke={T.navy} strokeWidth={2}/><Line type="monotone" dataKey="climateAdj" name="Climate-Adjusted" stroke={T.red} strokeWidth={2} strokeDasharray="5 5"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Aggregate Exposure by Peril</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={PERILS.map((p,i)=>{
              const treaties=TREATIES.filter(t=>t.peril===p);
              const bonds=CAT_BONDS.filter(b=>b.peril===p);
              return {peril:p,treatyLimit:treaties.reduce((a,b)=>a+b.limit,0),catBondSize:bonds.reduce((a,b)=>a+b.size,0)};
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="peril" tick={{fontSize:9}} angle={-20} textAnchor="end" height={50}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:11}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="treatyLimit" name="Treaty Limit ($M)" stackId="a" fill={T.navy}/><Bar dataKey="catBondSize" name="Cat Bond Size ($M)" stackId="a" fill={T.gold}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Systemic Climate Accumulation Risk</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {[{title:'Correlation Risk',score:7.2,desc:'Multiple perils triggered by same climate event (compound risk)',trend:'Increasing'},{title:'Concentration Risk',score:6.8,desc:'Geographic concentration in climate-vulnerable regions (Florida, Japan)',trend:'Stable'},{title:'Retro Capacity',score:5.5,desc:'Retrocession market hardening reduces available capacity',trend:'Tightening'},{title:'Model Uncertainty',score:6.1,desc:'Climate change exceeding model assumptions and calibration',trend:'Increasing'},{title:'Counterparty Risk',score:4.8,desc:'Reinsurer solvency under extreme climate tail scenarios',trend:'Moderate'},{title:'Basis Risk',score:5.9,desc:'Gap between parametric/index triggers and actual losses growing',trend:'Increasing'}].map((r,i)=>(
            <div key={i} style={{padding:12,background:T.surfaceH,borderRadius:8,borderLeft:`3px solid ${r.score>6.5?T.red:r.score>5?T.amber:T.green}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:13,fontWeight:700}}>{r.title}</div>
                <div style={{fontSize:18,fontWeight:700,fontFamily:T.mono,color:r.score>6.5?T.red:r.score>5?T.amber:T.green}}>{r.score}/10</div>
              </div>
              <div style={{fontSize:10,color:T.textSec,marginTop:4}}>{r.desc}</div>
              <div style={{fontSize:10,marginTop:4}}><span style={S.badge(r.trend==='Increasing'||r.trend==='Tightening'?T.red:T.amber)}>{r.trend}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.h1}>Reinsurance & Climate Risk Transfer</h1>
        <div style={S.sub}>EP-AR4 · {TREATIES.length} treaties · {REINSURERS.length} reinsurers · {CAT_BONDS.length} cat bonds · Climate-adjusted pricing & ILS</div>
      </div>
      <div style={S.tabs}>
        {TABS.map((t,i)=><button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>
      {tab===0&&renderTreaties()}
      {tab===1&&renderPricing()}
      {tab===2&&renderILS()}
      {tab===3&&renderRetrocession()}
    </div>
  );
}
