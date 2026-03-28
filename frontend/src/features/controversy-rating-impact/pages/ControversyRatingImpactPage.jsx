import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Cell,Legend,ScatterChart,Scatter} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const TYPES=['Environmental spill','Governance fraud','Social labour','Data privacy','Supply chain','Greenwashing'];
const SECTORS=['Energy','Automotive','Technology','Finance','Mining','Pharmaceuticals','Consumer','Industrials','Telecom','Utilities'];
const PROVIDERS=['MSCI','Sustainalytics','S&P Global','ISS ESG','CDP','Refinitiv'];
const GEOS=['North America','Europe','Asia-Pacific','Latin America','Global'];
const SEV_COLORS={1:T.green,2:'#65a30d',3:T.amber,4:'#ea580c',5:T.red};

const CONTROVERSIES=[
  {id:0,company:'BP',event:'Deepwater Horizon oil spill — Gulf of Mexico',type:'Environmental spill',sector:'Energy',severity:5,date:'2010-04-20',geo:'North America'},
  {id:1,company:'Volkswagen',event:'Dieselgate emissions cheating scandal',type:'Governance fraud',sector:'Automotive',severity:5,date:'2015-09-18',geo:'Europe'},
  {id:2,company:'Facebook',event:'Cambridge Analytica data breach',type:'Data privacy',sector:'Technology',severity:5,date:'2018-03-17',geo:'North America'},
  {id:3,company:'Wells Fargo',event:'Fake accounts scandal — 3.5 million unauthorized accounts',type:'Governance fraud',sector:'Finance',severity:5,date:'2016-09-08',geo:'North America'},
  {id:4,company:'Vale',event:'Brumadinho dam collapse — 270 fatalities',type:'Environmental spill',sector:'Mining',severity:5,date:'2019-01-25',geo:'Latin America'},
  {id:5,company:'Wirecard',event:'$2.1 billion accounting fraud and collapse',type:'Governance fraud',sector:'Finance',severity:5,date:'2020-06-18',geo:'Europe'},
  {id:6,company:'Boohoo',event:'Leicester sweatshop labour exploitation',type:'Social labour',sector:'Consumer',severity:4,date:'2020-07-05',geo:'Europe'},
  {id:7,company:'ExxonMobil',event:'Climate change misinformation campaign allegations',type:'Greenwashing',sector:'Energy',severity:4,date:'2015-11-05',geo:'North America'},
  {id:8,company:'Equifax',event:'Data breach exposing 147 million consumers',type:'Data privacy',sector:'Technology',severity:5,date:'2017-09-07',geo:'North America'},
  {id:9,company:'Bayer/Monsanto',event:'Roundup glyphosate cancer lawsuits',type:'Social labour',sector:'Pharmaceuticals',severity:4,date:'2018-08-10',geo:'North America'},
  {id:10,company:'Rio Tinto',event:'Juukan Gorge Aboriginal heritage site destruction',type:'Social labour',sector:'Mining',severity:4,date:'2020-05-24',geo:'Asia-Pacific'},
  {id:11,company:'H&M',event:'Xinjiang forced labour cotton sourcing',type:'Supply chain',sector:'Consumer',severity:4,date:'2021-03-24',geo:'Asia-Pacific'},
  {id:12,company:'Samsung',event:'Vice chairman bribery and corruption conviction',type:'Governance fraud',sector:'Technology',severity:4,date:'2017-02-17',geo:'Asia-Pacific'},
  {id:13,company:'Toshiba',event:'$1.2 billion accounting fraud scandal',type:'Governance fraud',sector:'Technology',severity:5,date:'2015-07-21',geo:'Asia-Pacific'},
  {id:14,company:'DWS Group',event:'Greenwashing — overstated ESG fund credentials',type:'Greenwashing',sector:'Finance',severity:3,date:'2021-08-01',geo:'Europe'},
  {id:15,company:'Nestl\u00e9',event:'Child labour in cocoa supply chain',type:'Supply chain',sector:'Consumer',severity:4,date:'2019-04-15',geo:'Global'},
  {id:16,company:'Amazon',event:'Warehouse worker injury rates and labour conditions',type:'Social labour',sector:'Technology',severity:3,date:'2021-06-01',geo:'North America'},
  {id:17,company:'Chevron',event:'Ecuador Lago Agrio oil contamination litigation',type:'Environmental spill',sector:'Energy',severity:4,date:'2011-02-14',geo:'Latin America'},
  {id:18,company:'Boeing',event:'737 MAX crashes — safety governance failures',type:'Governance fraud',sector:'Industrials',severity:5,date:'2019-03-10',geo:'North America'},
  {id:19,company:'Credit Suisse',event:'Archegos and Greensill risk management failures',type:'Governance fraud',sector:'Finance',severity:4,date:'2021-03-29',geo:'Europe'},
  {id:20,company:'Shell',event:'Nigerian oil spill and community displacement',type:'Environmental spill',sector:'Energy',severity:4,date:'2011-12-20',geo:'Global'},
  {id:21,company:'Uber',event:'Sexual harassment and toxic workplace culture',type:'Social labour',sector:'Technology',severity:3,date:'2017-02-19',geo:'North America'},
  {id:22,company:'Nike',event:'Asian factory sweatshop conditions exposed',type:'Supply chain',sector:'Consumer',severity:3,date:'2011-07-13',geo:'Asia-Pacific'},
  {id:23,company:'HSBC',event:'Money laundering for drug cartels — $1.9B fine',type:'Governance fraud',sector:'Finance',severity:5,date:'2012-12-11',geo:'Global'},
  {id:24,company:'Glencore',event:'DRC bribery and corruption charges',type:'Governance fraud',sector:'Mining',severity:4,date:'2018-07-03',geo:'Global'},
  {id:25,company:'TotalEnergies',event:'Mozambique LNG project human rights concerns',type:'Social labour',sector:'Energy',severity:3,date:'2021-04-26',geo:'Global'},
  {id:26,company:'Tesla',event:'Shanghai factory labour complaints and safety issues',type:'Social labour',sector:'Automotive',severity:2,date:'2022-01-15',geo:'Asia-Pacific'},
  {id:27,company:'JPMorgan Chase',event:'ESG fund greenwashing allegations by regulators',type:'Greenwashing',sector:'Finance',severity:3,date:'2022-05-23',geo:'North America'},
  {id:28,company:'Novartis',event:'Greek bribery scandal — kickbacks to officials',type:'Governance fraud',sector:'Pharmaceuticals',severity:3,date:'2018-02-06',geo:'Europe'},
  {id:29,company:'Apple',event:'Foxconn supply chain worker suicides',type:'Supply chain',sector:'Technology',severity:4,date:'2012-01-25',geo:'Asia-Pacific'},
];

function genProviderResp(cid,sev){
  const out=[];
  PROVIDERS.forEach((p,pi)=>{
    const s=sr(cid*100+pi*7+3);
    const qDelay=Math.floor(s*3)+1;
    const baseImpact=-(sev*0.3+s*0.8);
    const impact=Math.round(baseImpact*10)/10;
    const recovQ=sev>=4?Math.floor(sr(cid*50+pi*13)*5)+4:Math.floor(sr(cid*50+pi*13)*3)+2;
    const preRating=Math.round((6+sr(cid*11+pi*5)*3)*10)/10;
    out.push({provider:p,qDelay,impact,recovQ,preRating,postRating:Math.round((preRating+impact)*10)/10});
  });
  return out;
}

function genWaterfall(cid,sev){
  const resp=genProviderResp(cid,sev);
  const quarters=['Pre','Q0','Q+1','Q+2','Q+3','Q+4','Q+5','Q+6'];
  return quarters.map((q,qi)=>{
    const row={quarter:q};
    resp.forEach(r=>{
      if(qi===0) row[r.provider]=r.preRating;
      else if(qi<=r.qDelay) row[r.provider]=r.preRating;
      else{
        const elapsed=qi-r.qDelay;
        const trough=r.postRating;
        const recov=Math.min(elapsed/r.recovQ,1);
        row[r.provider]=Math.round((trough+(r.preRating-trough)*recov*0.85)*10)/10;
      }
    });
    return row;
  });
}

function genRecoveryCurve(sev){
  const quarters=Array.from({length:13},(_,i)=>i);
  return quarters.map(q=>{
    const row={quarter:`Q+${q}`};
    PROVIDERS.forEach((p,pi)=>{
      const base=sev*0.4+sr(sev*10+pi*3)*0.5;
      const recov=Math.min(q/(sev+sr(pi*7)*3+2),1);
      row[p]=Math.round((1-base*(1-recov*0.9))*100)/100*100;
    });
    row.avg=Math.round(PROVIDERS.reduce((a,p)=>a+row[p],0)/PROVIDERS.length*10)/10;
    return row;
  });
}

const PROV_COLORS=[T.navy,'#e74c3c','#2ecc71',T.gold,'#9b59b6','#e67e22'];

const sty={
  page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text},
  hdr:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24},
  title:{fontSize:22,fontWeight:700,color:T.navy,margin:0},
  sub:{fontSize:13,color:T.textSec,marginTop:4},
  badge:{display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,color:'#fff'},
  tabs:{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0},
  tab:(a)=>({padding:'10px 20px',fontSize:13,fontWeight:a?700:500,color:a?T.navy:T.textSec,background:a?T.surface:'transparent',border:a?`1px solid ${T.border}`:'1px solid transparent',borderBottom:a?'2px solid #fff':'none',borderRadius:'8px 8px 0 0',cursor:'pointer',marginBottom:-2,transition:'all 0.2s'}),
  card:{background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:20,marginBottom:16},
  cardH:{background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:20,marginBottom:16,cursor:'pointer',transition:'box-shadow 0.2s'},
  grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16},
  grid3:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16},
  kpiBox:{background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:'16px 20px',textAlign:'center'},
  kpiVal:{fontSize:26,fontWeight:700,color:T.navy},
  kpiLbl:{fontSize:11,color:T.textMut,marginTop:4,textTransform:'uppercase',letterSpacing:0.5},
  select:{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:13,color:T.text,background:T.surface},
  slider:{width:'100%',accentColor:T.navy},
  checkbox:{marginRight:6,accentColor:T.navy},
  filterRow:{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',marginBottom:16},
  label:{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:4},
  tbl:{width:'100%',borderCollapse:'collapse',fontSize:12},
  th:{textAlign:'left',padding:'8px 10px',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11,textTransform:'uppercase',letterSpacing:0.5},
  td:{padding:'8px 10px',borderBottom:`1px solid ${T.border}`,fontSize:12},
  resultBox:{background:T.surfaceH,borderRadius:8,border:`1px solid ${T.borderL}`,padding:16,marginBottom:12},
  sliderGroup:{marginBottom:16},
  sliderLabel:{display:'flex',justifyContent:'space-between',fontSize:12,color:T.textSec,marginBottom:4},
};

function SevBadge({sev}){
  return <span style={{...sty.badge,background:SEV_COLORS[sev]}}>Sev {sev}</span>;
}
function TypeBadge({type}){
  const colors={'Environmental spill':'#0891b2','Governance fraud':'#7c3aed','Social labour':'#db2777','Data privacy':'#2563eb','Supply chain':T.amber,'Greenwashing':'#059669'};
  return <span style={{...sty.badge,background:colors[type]||T.navy}}>{type}</span>;
}

function ControversyFeedTab(){
  const [sevFilter,setSevFilter]=useState(1);
  const [typeFilters,setTypeFilters]=useState(new Set(TYPES));
  const [sectorFilter,setSectorFilter]=useState('All');
  const [expanded,setExpanded]=useState(null);

  const filtered=useMemo(()=>{
    return CONTROVERSIES.filter(c=>c.severity>=sevFilter&&typeFilters.has(c.type)&&(sectorFilter==='All'||c.sector===sectorFilter))
      .sort((a,b)=>new Date(b.date)-new Date(a.date));
  },[sevFilter,typeFilters,sectorFilter]);

  const toggleType=(t)=>{
    const n=new Set(typeFilters);
    n.has(t)?n.delete(t):n.add(t);
    setTypeFilters(n);
  };

  return (
    <div>
      <div style={sty.card}>
        <div style={sty.filterRow}>
          <div>
            <div style={sty.label}>Min Severity: {sevFilter}</div>
            <input type="range" min={1} max={5} value={sevFilter} onChange={e=>setSevFilter(+e.target.value)} style={{...sty.slider,width:140}} />
          </div>
          <div>
            <div style={sty.label}>Sector</div>
            <select value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)} style={sty.select}>
              <option value="All">All Sectors</option>
              {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div style={sty.label}>Type Filters</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {TYPES.map(t=>(
                <label key={t} style={{fontSize:11,display:'flex',alignItems:'center',cursor:'pointer'}}>
                  <input type="checkbox" checked={typeFilters.has(t)} onChange={()=>toggleType(t)} style={sty.checkbox} />{t}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div style={{fontSize:12,color:T.textMut}}>{filtered.length} events matching filters</div>
      </div>

      {filtered.map(c=>{
        const isExp=expanded===c.id;
        const resp=isExp?genProviderResp(c.id,c.severity):[];
        return (
          <div key={c.id} style={{...sty.cardH,borderLeft:`4px solid ${SEV_COLORS[c.severity]}`,boxShadow:isExp?'0 2px 12px rgba(0,0,0,0.08)':'none'}} onClick={()=>setExpanded(isExp?null:c.id)}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:T.navy}}>{c.company}</div>
                <div style={{fontSize:13,color:T.textSec,marginTop:2}}>{c.event}</div>
                <div style={{display:'flex',gap:8,marginTop:8}}>
                  <SevBadge sev={c.severity} />
                  <TypeBadge type={c.type} />
                  <span style={{...sty.badge,background:T.navyL}}>{c.sector}</span>
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:13,fontWeight:600,color:T.navy}}>{c.date}</div>
                <div style={{fontSize:11,color:T.textMut,marginTop:2}}>{c.geo}</div>
                <div style={{fontSize:11,color:T.textMut,marginTop:4}}>{isExp?'\u25B2 collapse':'\u25BC expand'}</div>
              </div>
            </div>
            {isExp && (
              <div style={{marginTop:16,borderTop:`1px solid ${T.border}`,paddingTop:12}} onClick={e=>e.stopPropagation()}>
                <div style={{fontSize:12,fontWeight:600,color:T.textSec,marginBottom:8}}>Provider Response Timeline</div>
                <table style={sty.tbl}>
                  <thead><tr><th style={sty.th}>Provider</th><th style={sty.th}>Response Delay</th><th style={sty.th}>Pre-Rating</th><th style={sty.th}>Post-Rating</th><th style={sty.th}>Impact</th><th style={sty.th}>Recovery (Q)</th></tr></thead>
                  <tbody>
                    {resp.map(r=>(
                      <tr key={r.provider}>
                        <td style={{...sty.td,fontWeight:600}}>{r.provider}</td>
                        <td style={sty.td}>{r.qDelay}Q</td>
                        <td style={sty.td}>{r.preRating.toFixed(1)}</td>
                        <td style={{...sty.td,color:T.red}}>{r.postRating.toFixed(1)}</td>
                        <td style={{...sty.td,color:T.red,fontWeight:600}}>{r.impact.toFixed(1)}</td>
                        <td style={sty.td}>{r.recovQ}Q</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{marginTop:12}}>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={resp}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="provider" tick={{fontSize:10,fill:T.textSec}} />
                      <YAxis tick={{fontSize:10,fill:T.textSec}} />
                      <Tooltip contentStyle={{fontFamily:T.font,fontSize:12,borderRadius:8}} />
                      <Bar dataKey="qDelay" name="Response Delay (Q)" fill={T.navyL} radius={[4,4,0,0]}>
                        {resp.map((_,i)=><Cell key={i} fill={PROV_COLORS[i%PROV_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ImpactPropagationTab(){
  const [selId,setSelId]=useState(0);
  const c=CONTROVERSIES[selId];
  const waterfall=useMemo(()=>genWaterfall(c.id,c.severity),[c.id,c.severity]);

  const scatterData=useMemo(()=>{
    return CONTROVERSIES.map(con=>{
      const resps=genProviderResp(con.id,con.severity);
      const avgImpact=resps.reduce((a,r)=>a+r.impact,0)/resps.length;
      return {severity:con.severity,impact:Math.abs(avgImpact),company:con.company,id:con.id};
    });
  },[]);

  const contBeta=useMemo(()=>{
    return PROVIDERS.map((p,pi)=>{
      let totalImpact=0;
      CONTROVERSIES.forEach(con=>{
        const r=genProviderResp(con.id,con.severity);
        totalImpact+=Math.abs(r[pi].impact);
      });
      return {provider:p,beta:Math.round(totalImpact/CONTROVERSIES.length*100)/100};
    });
  },[]);

  return (
    <div>
      <div style={sty.card}>
        <div style={sty.label}>Select Controversy Event</div>
        <select value={selId} onChange={e=>setSelId(+e.target.value)} style={{...sty.select,width:'100%',marginBottom:8}}>
          {CONTROVERSIES.map(c=><option key={c.id} value={c.id}>{c.company} — {c.event.slice(0,60)}</option>)}
        </select>
        <div style={{display:'flex',gap:12,marginTop:8}}>
          <SevBadge sev={c.severity} /><TypeBadge type={c.type} /><span style={{fontSize:12,color:T.textSec}}>{c.date}</span>
        </div>
      </div>

      <div style={sty.card}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Rating Propagation Waterfall — {c.company}</div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={waterfall}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="quarter" tick={{fontSize:11,fill:T.textSec}} />
            <YAxis domain={['auto','auto']} tick={{fontSize:11,fill:T.textSec}} label={{value:'Rating',angle:-90,position:'insideLeft',style:{fontSize:11,fill:T.textSec}}} />
            <Tooltip contentStyle={{fontFamily:T.font,fontSize:12,borderRadius:8}} />
            <Legend wrapperStyle={{fontSize:11}} />
            {PROVIDERS.map((p,i)=><Line key={p} type="monotone" dataKey={p} stroke={PROV_COLORS[i]} strokeWidth={2} dot={{r:3}} />)}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={sty.grid2}>
        <div style={sty.card}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Severity vs Avg Rating Impact</div>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" dataKey="severity" name="Severity" domain={[0,6]} tick={{fontSize:11,fill:T.textSec}} label={{value:'Severity',position:'insideBottom',offset:-2,style:{fontSize:11,fill:T.textSec}}} />
              <YAxis type="number" dataKey="impact" name="Avg Impact" tick={{fontSize:11,fill:T.textSec}} label={{value:'Avg |Impact|',angle:-90,position:'insideLeft',style:{fontSize:11,fill:T.textSec}}} />
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12,borderRadius:8}} formatter={(v,n)=>[typeof v==='number'?v.toFixed(2):v,n]} labelFormatter={()=>''} />
              <Scatter data={scatterData} fill={T.navy}>
                {scatterData.map((d,i)=><Cell key={i} fill={SEV_COLORS[d.severity]} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div style={sty.card}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Controversy Beta by Provider</div>
          <div style={{fontSize:11,color:T.textMut,marginBottom:8}}>Avg absolute rating impact per controversy</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={contBeta} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{fontSize:11,fill:T.textSec}} />
              <YAxis type="category" dataKey="provider" tick={{fontSize:11,fill:T.textSec}} width={90} />
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12,borderRadius:8}} />
              <Bar dataKey="beta" name="Controversy Beta" radius={[0,4,4,0]}>
                {contBeta.map((_,i)=><Cell key={i} fill={PROV_COLORS[i%PROV_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function RecoveryCurvesTab(){
  const [selSev,setSelSev]=useState(4);
  const curve=useMemo(()=>genRecoveryCurve(selSev),[selSev]);

  const neverRecovered=useMemo(()=>{
    return CONTROVERSIES.filter(c=>c.severity>=4).map(c=>{
      const resps=genProviderResp(c.id,c.severity);
      const neverCount=resps.filter(r=>r.recovQ>6).length;
      const fullyCount=resps.filter(r=>r.recovQ<=3).length;
      return {...c,neverCount,fullyCount,avgRecov:Math.round(resps.reduce((a,r)=>a+r.recovQ,0)/resps.length*10)/10};
    }).sort((a,b)=>b.neverCount-a.neverCount);
  },[]);

  const sectorRecovery=useMemo(()=>{
    const map={};
    CONTROVERSIES.forEach(c=>{
      if(!map[c.sector]) map[c.sector]={sector:c.sector,totalRecov:0,count:0};
      const resps=genProviderResp(c.id,c.severity);
      const avg=resps.reduce((a,r)=>a+r.recovQ,0)/resps.length;
      map[c.sector].totalRecov+=avg;
      map[c.sector].count++;
    });
    return Object.values(map).map(s=>({...s,avgRecov:Math.round(s.totalRecov/s.count*10)/10})).sort((a,b)=>a.avgRecov-b.avgRecov);
  },[]);

  return (
    <div>
      <div style={sty.card}>
        <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:16}}>
          <div style={sty.label}>Severity Level:</div>
          {[1,2,3,4,5].map(s=>(
            <button key={s} onClick={()=>setSelSev(s)} style={{padding:'6px 16px',borderRadius:6,border:`1px solid ${selSev===s?SEV_COLORS[s]:T.border}`,background:selSev===s?SEV_COLORS[s]:T.surface,color:selSev===s?'#fff':T.text,cursor:'pointer',fontWeight:600,fontSize:13,fontFamily:T.font}}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={sty.card}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Recovery Trajectory — Severity {selSev}</div>
        <div style={{fontSize:11,color:T.textMut,marginBottom:8}}>% of pre-controversy rating recovered over time</div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={curve}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="quarter" tick={{fontSize:11,fill:T.textSec}} />
            <YAxis domain={[40,105]} tick={{fontSize:11,fill:T.textSec}} label={{value:'% Recovery',angle:-90,position:'insideLeft',style:{fontSize:11,fill:T.textSec}}} />
            <Tooltip contentStyle={{fontFamily:T.font,fontSize:12,borderRadius:8}} />
            <Legend wrapperStyle={{fontSize:11}} />
            {PROVIDERS.map((p,i)=><Area key={p} type="monotone" dataKey={p} stroke={PROV_COLORS[i]} fill={PROV_COLORS[i]} fillOpacity={0.08} strokeWidth={2} />)}
            <Line type="monotone" dataKey="avg" stroke={T.navy} strokeWidth={3} strokeDasharray="6 3" dot={false} name="Average" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={sty.grid2}>
        <div style={sty.card}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Recovery vs Non-Recovery (Sev 4+)</div>
          <div style={{maxHeight:320,overflowY:'auto'}}>
            <table style={sty.tbl}>
              <thead><tr><th style={sty.th}>Company</th><th style={sty.th}>Severity</th><th style={sty.th}>Avg Recovery (Q)</th><th style={sty.th}>Never Recovered</th><th style={sty.th}>Fully Recovered</th></tr></thead>
              <tbody>
                {neverRecovered.map(c=>(
                  <tr key={c.id}>
                    <td style={{...sty.td,fontWeight:600}}>{c.company}</td>
                    <td style={sty.td}><SevBadge sev={c.severity} /></td>
                    <td style={{...sty.td,fontFamily:T.mono}}>{c.avgRecov}Q</td>
                    <td style={{...sty.td,color:c.neverCount>0?T.red:T.green,fontWeight:600}}>{c.neverCount}/{PROVIDERS.length} providers</td>
                    <td style={{...sty.td,color:c.fullyCount>0?T.green:T.red}}>{c.fullyCount}/{PROVIDERS.length} providers</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={sty.card}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Sector Recovery Speed</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sectorRecovery}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="sector" tick={{fontSize:10,fill:T.textSec}} angle={-25} textAnchor="end" height={60} />
              <YAxis tick={{fontSize:11,fill:T.textSec}} label={{value:'Avg Recovery (Q)',angle:-90,position:'insideLeft',style:{fontSize:11,fill:T.textSec}}} />
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12,borderRadius:8}} />
              <Bar dataKey="avgRecov" name="Avg Recovery (Quarters)" radius={[4,4,0,0]}>
                {sectorRecovery.map((d,i)=><Cell key={i} fill={d.avgRecov<4?T.green:d.avgRecov<5?T.amber:T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function PredictiveModelTab(){
  const [simSev,setSimSev]=useState(3);
  const [simType,setSimType]=useState(TYPES[0]);
  const [simSector,setSimSector]=useState(SECTORS[0]);
  const [simGeo,setSimGeo]=useState(GEOS[0]);
  const [alertSev,setAlertSev]=useState(4);
  const [alertTypes,setAlertTypes]=useState(new Set(['Environmental spill','Governance fraud']));

  const predictions=useMemo(()=>{
    const tIdx=TYPES.indexOf(simType);
    const sIdx=SECTORS.indexOf(simSector);
    const gIdx=GEOS.indexOf(simGeo);
    return PROVIDERS.map((p,pi)=>{
      const seed=simSev*100+tIdx*17+sIdx*31+gIdx*13+pi*7;
      const impact=-(simSev*0.28+sr(seed)*0.7+sr(seed+1)*0.3);
      const recovQ=Math.floor(simSev*0.8+sr(seed+2)*4)+1;
      const pnl=-(simSev*0.15+sr(seed+3)*0.4);
      const confidence=Math.round((70+sr(seed+4)*25));
      return {provider:p,impact:Math.round(impact*100)/100,recovQ,pnl:Math.round(pnl*100)/100,confidence};
    });
  },[simSev,simType,simSector,simGeo]);

  const confMatrix=useMemo(()=>{
    const cats=['Minor (<0.5)','Moderate (0.5-1.0)','Severe (1.0-2.0)','Critical (>2.0)'];
    return cats.map((actual,ai)=>{
      const row={actual};
      cats.forEach((pred,pi)=>{
        const s=sr(ai*100+pi*13+77);
        if(ai===pi) row[pred]=Math.round(55+s*35);
        else if(Math.abs(ai-pi)===1) row[pred]=Math.round(5+s*20);
        else row[pred]=Math.round(s*8);
      });
      return row;
    });
  },[]);

  const toggleAlertType=(t)=>{
    const n=new Set(alertTypes);
    n.has(t)?n.delete(t):n.add(t);
    setAlertTypes(n);
  };

  const accuracy=useMemo(()=>{
    const data=CONTROVERSIES.map((c,i)=>{
      const resps=genProviderResp(c.id,c.severity);
      const actualAvg=Math.abs(resps.reduce((a,r)=>a+r.impact,0)/resps.length);
      const predicted=actualAvg*(0.8+sr(i*31)*0.4);
      return {company:c.company,actual:Math.round(actualAvg*100)/100,predicted:Math.round(predicted*100)/100,error:Math.round(Math.abs(actualAvg-predicted)*100)/100};
    });
    return data;
  },[]);

  return (
    <div>
      <div style={sty.card}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:16}}>Controversy Impact Simulator</div>
        <div style={sty.grid2}>
          <div>
            <div style={sty.sliderGroup}>
              <div style={sty.sliderLabel}><span>Severity Level</span><span style={{fontWeight:700,color:SEV_COLORS[simSev]}}>{simSev}</span></div>
              <input type="range" min={1} max={5} value={simSev} onChange={e=>setSimSev(+e.target.value)} style={sty.slider} />
            </div>
            <div style={sty.sliderGroup}>
              <div style={sty.label}>Controversy Type</div>
              <select value={simType} onChange={e=>setSimType(e.target.value)} style={{...sty.select,width:'100%'}}>{TYPES.map(t=><option key={t}>{t}</option>)}</select>
            </div>
            <div style={sty.sliderGroup}>
              <div style={sty.label}>Sector</div>
              <select value={simSector} onChange={e=>setSimSector(e.target.value)} style={{...sty.select,width:'100%'}}>{SECTORS.map(s=><option key={s}>{s}</option>)}</select>
            </div>
            <div style={sty.sliderGroup}>
              <div style={sty.label}>Geography</div>
              <select value={simGeo} onChange={e=>setSimGeo(e.target.value)} style={{...sty.select,width:'100%'}}>{GEOS.map(g=><option key={g}>{g}</option>)}</select>
            </div>
          </div>

          <div>
            <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Predicted Impact per Provider</div>
            <table style={sty.tbl}>
              <thead><tr><th style={sty.th}>Provider</th><th style={sty.th}>Rating Impact</th><th style={sty.th}>Recovery (Q)</th><th style={sty.th}>PnL Impact %</th><th style={sty.th}>Confidence</th></tr></thead>
              <tbody>
                {predictions.map((p,i)=>(
                  <tr key={p.provider}>
                    <td style={{...sty.td,fontWeight:600}}>{p.provider}</td>
                    <td style={{...sty.td,color:T.red,fontFamily:T.mono}}>{p.impact.toFixed(2)}</td>
                    <td style={{...sty.td,fontFamily:T.mono}}>{p.recovQ}Q</td>
                    <td style={{...sty.td,color:T.red,fontFamily:T.mono}}>{p.pnl.toFixed(2)}%</td>
                    <td style={sty.td}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <div style={{flex:1,height:6,background:T.border,borderRadius:3}}>
                          <div style={{width:`${p.confidence}%`,height:'100%',background:p.confidence>80?T.green:p.confidence>60?T.amber:T.red,borderRadius:3}} />
                        </div>
                        <span style={{fontSize:11,fontFamily:T.mono}}>{p.confidence}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{...sty.resultBox,marginTop:12}}>
              <div style={{fontSize:12,fontWeight:600,color:T.navy}}>Aggregate Prediction</div>
              <div style={{display:'flex',gap:24,marginTop:8}}>
                <div><span style={{fontSize:11,color:T.textMut}}>Avg Impact: </span><span style={{fontWeight:700,color:T.red,fontFamily:T.mono}}>{(predictions.reduce((a,p)=>a+p.impact,0)/predictions.length).toFixed(2)}</span></div>
                <div><span style={{fontSize:11,color:T.textMut}}>Avg Recovery: </span><span style={{fontWeight:700,color:T.navy,fontFamily:T.mono}}>{Math.round(predictions.reduce((a,p)=>a+p.recovQ,0)/predictions.length*10)/10}Q</span></div>
                <div><span style={{fontSize:11,color:T.textMut}}>Portfolio PnL: </span><span style={{fontWeight:700,color:T.red,fontFamily:T.mono}}>{(predictions.reduce((a,p)=>a+p.pnl,0)/predictions.length).toFixed(2)}%</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={sty.grid2}>
        <div style={sty.card}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Prediction Accuracy — Confusion Matrix</div>
          <div style={{fontSize:11,color:T.textMut,marginBottom:8}}>Predicted vs actual impact severity buckets (%)</div>
          <table style={sty.tbl}>
            <thead>
              <tr>
                <th style={{...sty.th,background:T.surfaceH}}>Actual \ Predicted</th>
                {['Minor','Moderate','Severe','Critical'].map(h=><th key={h} style={{...sty.th,textAlign:'center'}}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {confMatrix.map((row,ri)=>(
                <tr key={ri}>
                  <td style={{...sty.td,fontWeight:600,background:T.surfaceH}}>{row.actual}</td>
                  {['Minor (<0.5)','Moderate (0.5-1.0)','Severe (1.0-2.0)','Critical (>2.0)'].map((col,ci)=>{
                    const v=row[col]||0;
                    const isDiag=ri===ci;
                    return <td key={ci} style={{...sty.td,textAlign:'center',fontFamily:T.mono,fontWeight:isDiag?700:400,background:isDiag?`${T.green}18`:'transparent',color:isDiag?T.green:v>15?T.amber:T.textMut}}>{v}%</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={sty.card}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Predicted vs Actual (Scatter)</div>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" dataKey="actual" name="Actual" tick={{fontSize:11,fill:T.textSec}} label={{value:'Actual Impact',position:'insideBottom',offset:-2,style:{fontSize:11,fill:T.textSec}}} />
              <YAxis type="number" dataKey="predicted" name="Predicted" tick={{fontSize:11,fill:T.textSec}} label={{value:'Predicted',angle:-90,position:'insideLeft',style:{fontSize:11,fill:T.textSec}}} />
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12,borderRadius:8}} formatter={(v,n)=>[typeof v==='number'?v.toFixed(2):v,n]} />
              <Scatter data={accuracy} fill={T.navy}>
                {accuracy.map((d,i)=><Cell key={i} fill={d.error<0.2?T.green:d.error<0.4?T.amber:T.red} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{fontSize:11,color:T.textMut,marginTop:4}}>Green: error {'<'}0.2 | Amber: 0.2-0.4 | Red: {'>'}0.4</div>
        </div>
      </div>

      <div style={sty.card}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Alert Configuration</div>
        <div style={{fontSize:11,color:T.textMut,marginBottom:12}}>Set thresholds for automated alerts on new controversy events</div>
        <div style={sty.grid3}>
          <div>
            <div style={sty.sliderGroup}>
              <div style={sty.sliderLabel}><span>Min Severity Threshold</span><span style={{fontWeight:700,color:SEV_COLORS[alertSev]}}>{alertSev}</span></div>
              <input type="range" min={1} max={5} value={alertSev} onChange={e=>setAlertSev(+e.target.value)} style={sty.slider} />
            </div>
          </div>
          <div>
            <div style={sty.label}>Controversy Types to Monitor</div>
            {TYPES.map(t=>(
              <label key={t} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,marginBottom:4,cursor:'pointer'}}>
                <input type="checkbox" checked={alertTypes.has(t)} onChange={()=>toggleAlertType(t)} style={sty.checkbox} />{t}
              </label>
            ))}
          </div>
          <div style={sty.resultBox}>
            <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Active Alert Rules</div>
            <div style={{fontSize:11,color:T.textSec}}>Severity >= {alertSev}</div>
            <div style={{fontSize:11,color:T.textSec,marginTop:2}}>Types: {[...alertTypes].join(', ')||'None'}</div>
            <div style={{fontSize:11,color:T.textSec,marginTop:2}}>Coverage: {CONTROVERSIES.filter(c=>c.severity>=alertSev&&alertTypes.has(c.type)).length} / {CONTROVERSIES.length} historical events</div>
            <div style={{marginTop:12,padding:'8px 12px',borderRadius:6,background:`${T.green}12`,border:`1px solid ${T.green}40`,fontSize:11,color:T.green,fontWeight:600}}>
              Alerts active for {alertTypes.size} controversy types at severity {alertSev}+
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ControversyRatingImpactPage(){
  const [tab,setTab]=useState(0);
  const TABS=['Controversy Feed','Impact Propagation','Recovery Curves','Predictive Model'];

  const kpis=useMemo(()=>{
    let totalImpact=0;let sev5Count=0;let avgRecov=0;
    CONTROVERSIES.forEach(c=>{
      const resps=genProviderResp(c.id,c.severity);
      totalImpact+=resps.reduce((a,r)=>a+Math.abs(r.impact),0)/resps.length;
      if(c.severity===5)sev5Count++;
      avgRecov+=resps.reduce((a,r)=>a+r.recovQ,0)/resps.length;
    });
    return {
      avgImpact:(totalImpact/CONTROVERSIES.length).toFixed(2),
      sev5Count,
      avgRecov:(avgRecov/CONTROVERSIES.length).toFixed(1),
      totalEvents:CONTROVERSIES.length,
    };
  },[]);

  return (
    <div style={sty.page}>
      <div style={sty.hdr}>
        <div>
          <h1 style={sty.title}>ESG Controversy-to-Rating Impact</h1>
          <p style={sty.sub}>EP-AK4 | Maps how controversies propagate to rating downgrades across 6 providers</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <span style={{...sty.badge,background:T.red}}>30 Events</span>
          <span style={{...sty.badge,background:T.navy}}>6 Providers</span>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        <div style={sty.kpiBox}><div style={sty.kpiVal}>{kpis.totalEvents}</div><div style={sty.kpiLbl}>Total Controversies</div></div>
        <div style={sty.kpiBox}><div style={{...sty.kpiVal,color:T.red}}>{kpis.sev5Count}</div><div style={sty.kpiLbl}>Critical (Sev 5)</div></div>
        <div style={sty.kpiBox}><div style={{...sty.kpiVal,color:T.red}}>-{kpis.avgImpact}</div><div style={sty.kpiLbl}>Avg Rating Impact</div></div>
        <div style={sty.kpiBox}><div style={{...sty.kpiVal,color:T.amber}}>{kpis.avgRecov}Q</div><div style={sty.kpiLbl}>Avg Recovery Time</div></div>
      </div>

      <div style={sty.tabs}>
        {TABS.map((t,i)=><div key={t} style={sty.tab(tab===i)} onClick={()=>setTab(i)}>{t}</div>)}
      </div>

      {tab===0&&<ControversyFeedTab />}
      {tab===1&&<ImpactPropagationTab />}
      {tab===2&&<RecoveryCurvesTab />}
      {tab===3&&<PredictiveModelTab />}
    </div>
  );
}
