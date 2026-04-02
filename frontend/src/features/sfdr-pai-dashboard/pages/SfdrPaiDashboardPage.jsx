import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,PieChart,Pie,Cell,AreaChart,Area,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',purple:'#7c3aed',teal:'#0e7490',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

// 18 mandatory PAI indicators (Table 1 Annex I SFDR RTS)
const PAI_INDICATORS=[
  {id:'PAI-1',name:'GHG Emissions',metric:'Scope 1+2+3 tCO2e / €M invested',unit:'tCO2e/€M',category:'Climate',table:1,assetClass:'company'},
  {id:'PAI-2',name:'Carbon Footprint',metric:'tCO2e / €M EVIC',unit:'tCO2e/€M',category:'Climate',table:1,assetClass:'company'},
  {id:'PAI-3',name:'GHG Intensity',metric:'tCO2e / €M revenue',unit:'tCO2e/€M rev',category:'Climate',table:1,assetClass:'company'},
  {id:'PAI-4',name:'Fossil Fuel Exposure',metric:'% portfolio in fossil fuel companies',unit:'%',category:'Climate',table:1,assetClass:'company'},
  {id:'PAI-5',name:'Non-Renewable Energy',metric:'Non-renewable energy consumption & production %',unit:'%',category:'Climate',table:1,assetClass:'company'},
  {id:'PAI-6',name:'Energy Intensity',metric:'MWh / €M revenue (high climate impact)',unit:'MWh/€M',category:'Climate',table:1,assetClass:'company'},
  {id:'PAI-7',name:'Biodiversity Sensitive Areas',metric:'Activities negatively affecting biodiversity areas',unit:'%',category:'Biodiversity',table:1,assetClass:'company'},
  {id:'PAI-8',name:'Water Emissions',metric:'Emissions to water (tonnes)',unit:'tonnes',category:'Water',table:1,assetClass:'company'},
  {id:'PAI-9',name:'Hazardous Waste',metric:'Hazardous waste ratio',unit:'tonnes/€M rev',category:'Waste',table:1,assetClass:'company'},
  {id:'PAI-10',name:'UNGC Violations',metric:'Violations of UNGC principles / OECD MNE guidelines',unit:'%',category:'Social/Governance',table:1,assetClass:'company'},
  {id:'PAI-11',name:'Lack of UNGC Processes',metric:'No processes to monitor UNGC compliance',unit:'%',category:'Social/Governance',table:1,assetClass:'company'},
  {id:'PAI-12',name:'Gender Pay Gap',metric:'Unadjusted gender pay gap',unit:'%',category:'Social',table:1,assetClass:'company'},
  {id:'PAI-13',name:'Board Gender Diversity',metric:'Female board members %',unit:'%',category:'Social',table:1,assetClass:'company'},
  {id:'PAI-14',name:'Controversial Weapons',metric:'Exposure to controversial weapons',unit:'%',category:'Governance',table:1,assetClass:'company'},
  {id:'PAI-15',name:'Sovereign GHG Intensity',metric:'GHG intensity of sovereign investees',unit:'tCO2e/€M GDP',category:'Climate',table:1,assetClass:'sovereign'},
  {id:'PAI-16',name:'Fossil Fuel Sovereigns',metric:'Investees producing/using fossil fuels',unit:'%',category:'Climate',table:1,assetClass:'sovereign'},
  {id:'PAI-17',name:'Fossil Fuel RE',metric:'Fossil fuel exposure in real estate',unit:'%',category:'Climate',table:1,assetClass:'realestate'},
  {id:'PAI-18',name:'Energy Efficiency RE',metric:'Inefficient real estate (EPC D or below)',unit:'%',category:'Climate',table:1,assetClass:'realestate'},
];

const FUND_NAMES=['Apex Sustainable UCITS','Nordic Climate Fund','Global ESG Leaders','Atlantic Impact Bond','Meridian SRI Equity','Summit Green Alpha','Quantum Net Zero','Pacific ESG Multi-Asset'];
const ART_CLASSES=['Art 6','Art 8','Art 9'];
const YEARS=['2022','2023','2024'];

const genFunds=(n)=>Array.from({length:n},(_,i)=>{
  const s=sr(i*7+3);const art=ART_CLASSES[Math.floor(s*ART_CLASSES.length)];
  const aum=+(sr(i*13+7)*8+0.5).toFixed(1);
  const pais=PAI_INDICATORS.map((pai,pi)=>{
    const base=sr(i*31+pi*7);
    const prev=sr(i*37+pi*11);
    return{
      id:pai.id,
      current:pai.unit==='%'?+(base*60+5).toFixed(1):pai.unit==='tCO2e/€M'?+(base*150+20).toFixed(1):+(base*50+5).toFixed(1),
      prior:pai.unit==='%'?+(prev*60+5).toFixed(1):pai.unit==='tCO2e/€M'?+(prev*150+20).toFixed(1):+(prev*50+5).toFixed(1),
      covered:sr(i*41+pi*13)>0.25,
      benchmark:pai.unit==='%'?+(sr(i*43+pi*17)*40+10).toFixed(1):+(sr(i*47+pi*19)*80+15).toFixed(1),
    };
  });
  return{id:i,name:FUND_NAMES[i%FUND_NAMES.length],art,aum,isin:`LU${String(Math.floor(sr(i*53+7)*1e10)).slice(0,10)}`,coverage:Math.floor(sr(i*59+11)*30+65),pais};
});

const FUNDS=genFunds(8);

const artColor=(a)=>a==='Art 9'?T.green:a==='Art 8'?T.teal:T.textMut;
const catColor=(c)=>c==='Climate'?T.teal:c==='Social'||c==='Social/Governance'?T.red:c==='Biodiversity'?T.green:c==='Water'?'#0369a1':c==='Governance'?T.purple:T.amber;
const pill=(color,text,sm)=>({display:'inline-block',padding:sm?'1px 7px':'2px 10px',borderRadius:10,fontSize:sm?10:11,fontWeight:600,background:color+'18',color,border:`1px solid ${color}30`});

export default function SfdrPaiDashboardPage(){
  const [tab,setTab]=useState(0);
  const [selFund,setSelFund]=useState(FUNDS[1]); // Art 8 fund by default
  const TABS=['PAI Statement','Indicator Drill-Down','Fund Comparison','Action Plan'];

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text}}>
      <div style={{maxWidth:1440,margin:'0 auto'}}>
        <div style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.gold,fontWeight:700,background:T.navy,padding:'3px 10px',borderRadius:4}}>EP-AZ2</span>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>SFDR REG (EU) 2019/2088 · RTS ANNEX I · 18 MANDATORY PAI INDICATORS · REFERENCE PERIOD: 1 JAN – 31 DEC</span>
          </div>
          <h1 style={{fontSize:26,fontWeight:700,color:T.navy,margin:0}}>SFDR PAI Dashboard</h1>
          <p style={{color:T.textSec,fontSize:14,margin:'4px 0 0'}}>Principal Adverse Impact statement — 18 mandatory + additional indicators · Art 6/8/9 fund classification</p>
        </div>

        {/* Fund selector bar */}
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'14px 20px',marginBottom:20,display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{fontSize:12,fontWeight:600,color:T.textMut}}>FUND</span>
          <select value={selFund.id} onChange={e=>setSelFund(FUNDS.find(f=>f.id===+e.target.value))} style={{padding:'8px 14px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font,minWidth:240}}>
            {FUNDS.map(f=><option key={f.id} value={f.id}>{f.name} ({f.art})</option>)}
          </select>
          {[
            {label:'Classification',value:selFund.art,color:artColor(selFund.art)},
            {label:'AUM',value:`€${selFund.aum}bn`,mono:true},
            {label:'ISIN',value:selFund.isin,mono:true},
            {label:'PAI Coverage',value:selFund.coverage+'%',color:selFund.coverage>=80?T.green:selFund.coverage>=60?T.amber:T.red,mono:true},
          ].map((f,i)=>(
            <div key={i} style={{textAlign:'center'}}>
              <div style={{fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,marginBottom:2}}>{f.label}</div>
              <div style={{fontSize:14,fontWeight:700,color:f.color||T.navy,fontFamily:f.mono?T.mono:T.font}}>{f.value}</div>
            </div>
          ))}
        </div>

        <div style={{display:'flex',gap:4,marginBottom:24,background:T.surface,borderRadius:10,padding:4,border:`1px solid ${T.border}`}}>
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)} style={{flex:1,padding:'10px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:tab===i?700:500,background:tab===i?T.navy:'transparent',color:tab===i?'#fff':T.textSec,transition:'all 0.2s'}}>
              {t}
            </button>
          ))}
        </div>
        {tab===0&&<PaiStatement fund={selFund}/>}
        {tab===1&&<IndicatorDrillDown fund={selFund}/>}
        {tab===2&&<FundComparison selFund={selFund}/>}
        {tab===3&&<ActionPlan fund={selFund}/>}
      </div>
    </div>
  );
}

/* ===== TAB 1: PAI STATEMENT ===== */
function PaiStatement({fund}){
  const covered=fund.pais.filter(p=>p.covered).length;
  const improved=fund.pais.filter(p=>p.current<p.prior).length;
  const worsened=fund.pais.filter(p=>p.current>p.prior).length;

  const catGroups=['Climate','Social','Social/Governance','Biodiversity','Water','Waste','Governance'].map(cat=>{
    const catPais=PAI_INDICATORS.filter(p=>p.category===cat);
    const avg=catPais.reduce((a,p,pi)=>{const fp=fund.pais.find(f=>f.id===p.id);return a+(fp?.current||0);},0)/catPais.length;
    return{cat,count:catPais.length,avg:+avg.toFixed(1)};
  }).filter(c=>c.count>0);

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:'PAIs Disclosed',value:`${covered}/18`,sub:'Mandatory indicators covered',color:covered>=15?T.green:T.amber},
          {label:'Improved YoY',value:improved,sub:'Current < Prior year',color:T.green},
          {label:'Worsened YoY',value:worsened,sub:'Current > Prior year',color:T.red},
          {label:'Reference Period',value:'FY2024',sub:'Published by 30 June 2025',color:T.navy},
        ].map((kpi,i)=>(
          <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'16px 20px'}}>
            <div style={{fontSize:11,fontWeight:600,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{kpi.label}</div>
            <div style={{fontSize:26,fontWeight:700,color:kpi.color,fontFamily:T.mono}}>{kpi.value}</div>
            <div style={{fontSize:12,color:T.textSec,marginTop:2}}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:20,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:4}}>Mandatory PAI Statement — Table 1 Annex I</div>
          <div style={{fontSize:12,color:T.textSec,marginBottom:16}}>18 indicators · Reference period: 1 Jan – 31 Dec 2024 · Published: ≤30 Jun 2025</div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['#','Indicator','Category','Current','Prior','Δ YoY','Benchmark','Covered'].map(h=>(
                  <th key={h} style={{padding:'7px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',letterSpacing:0.4}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PAI_INDICATORS.map((pai,i)=>{
                const fp=fund.pais.find(p=>p.id===pai.id);
                const delta=fp?+(fp.current-fp.prior).toFixed(1):0;
                const improved=delta<0;
                return(
                  <tr key={pai.id} style={{borderBottom:`1px solid ${T.borderL}`,opacity:fp?.covered?1:0.6}}>
                    <td style={{padding:'8px 10px',fontFamily:T.mono,fontSize:11,color:T.textMut}}>{pai.id}</td>
                    <td style={{padding:'8px 10px',fontSize:12,fontWeight:500,color:T.text}}>{pai.name}</td>
                    <td style={{padding:'8px 10px'}}><span style={pill(catColor(pai.category),pai.category,true)}>{pai.category.split('/')[0]}</span></td>
                    <td style={{padding:'8px 10px',fontFamily:T.mono,fontWeight:700,color:T.navy,fontSize:12}}>{fp?.current?.toFixed(1)} <span style={{fontSize:9,color:T.textMut}}>{pai.unit}</span></td>
                    <td style={{padding:'8px 10px',fontFamily:T.mono,fontSize:11,color:T.textMut}}>{fp?.prior?.toFixed(1)}</td>
                    <td style={{padding:'8px 10px',fontFamily:T.mono,fontSize:11,fontWeight:700,color:improved?T.green:T.red}}>{delta>0?'+':''}{delta}</td>
                    <td style={{padding:'8px 10px',fontFamily:T.mono,fontSize:11,color:T.textSec}}>{fp?.benchmark?.toFixed(1)}</td>
                    <td style={{padding:'8px 10px',textAlign:'center'}}>{fp?.covered?<span style={pill(T.green,'✓',true)}>✓</span>:<span style={pill(T.red,'✗',true)}>✗</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>PAI Coverage by Category</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={catGroups} layout="vertical" margin={{left:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis type="number" style={{fontSize:9}}/>
                <YAxis type="category" dataKey="cat" width={90} style={{fontSize:9}}/>
                <Tooltip/>
                <Bar dataKey="count" name="# Indicators" fill={T.navy} radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Fund Classification</div>
            <div style={{padding:'16px 20px',background:artColor(fund.art)+'0d',borderRadius:10,border:`2px solid ${artColor(fund.art)}30`,textAlign:'center'}}>
              <div style={{fontSize:28,fontWeight:700,color:artColor(fund.art),fontFamily:T.mono}}>{fund.art}</div>
              <div style={{fontSize:12,color:T.textSec,marginTop:6}}>
                {fund.art==='Art 9'?'Products with sustainable investment objective — Dark Green':fund.art==='Art 8'?'Products promoting E/S characteristics — Light Green':'No sustainability claims — Vanilla'}
              </div>
            </div>
            <div style={{marginTop:12,padding:'10px 14px',background:T.surfaceH,borderRadius:8,borderLeft:`3px solid ${T.gold}`}}>
              <div style={{fontSize:11,fontWeight:700,color:T.navy,marginBottom:2}}>Art 4(1)(a) Obligation</div>
              <div style={{fontSize:12,color:T.textSec}}>FMPs with {'>'}500 employees must publish entity-level PAI statement. Product-level PAI consideration required under Art 4(3)/(4).</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== TAB 2: INDICATOR DRILL-DOWN ===== */
function IndicatorDrillDown({fund}){
  const [selPai,setSelPai]=useState('PAI-1');

  const pai=PAI_INDICATORS.find(p=>p.id===selPai);
  const fp=fund.pais.find(p=>p.id===selPai);

  const trend=YEARS.map((yr,i)=>({yr,value:+(sr(fund.id*31+PAI_INDICATORS.findIndex(p=>p.id===selPai)*7+i*11)*100+10).toFixed(1)}));
  const holdings=Array.from({length:8},(_,i)=>({
    name:`Holding ${String.fromCharCode(65+i)}`,
    contribution:+(sr(fund.id*41+i*13+PAI_INDICATORS.findIndex(p=>p.id===selPai)*7)*40+2).toFixed(1),
    pct:+(sr(fund.id*43+i*17)*15+3).toFixed(1),
  })).sort((a,b)=>b.contribution-a.contribution);

  const actionTypes=['Engagement','Exclusion','Weight Reduction','Monitoring'];
  const actions=Array.from({length:4},(_,i)=>({type:actionTypes[i],due:`2025-${String(Math.floor(sr(fund.id*53+i*7)*12)+1).padStart(2,'0')}-30`,status:['Open','In Progress','Complete'][Math.floor(sr(fund.id*59+i*11)*3)]}));

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:12,fontWeight:700,color:T.textMut,marginBottom:12}}>SELECT INDICATOR</div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            {PAI_INDICATORS.map(p=>(
              <div key={p.id} onClick={()=>setSelPai(p.id)} style={{padding:'8px 10px',borderRadius:7,cursor:'pointer',background:selPai===p.id?T.navy:'transparent',transition:'background 0.15s'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontFamily:T.mono,fontSize:11,fontWeight:700,color:selPai===p.id?T.gold:T.textMut}}>{p.id}</span>
                  <span style={pill(catColor(p.category),p.category.split('/')[0],true)}>{p.category.split('/')[0]}</span>
                </div>
                <div style={{fontSize:11,color:selPai===p.id?'#fff':T.text,marginTop:2,lineHeight:1.3}}>{p.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {pai&&fp&&(
            <div>
              <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:16}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                  <div>
                    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                      <span style={{fontFamily:T.mono,fontSize:13,fontWeight:700,color:T.gold,background:T.navy,padding:'3px 8px',borderRadius:4}}>{pai.id}</span>
                      <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>TABLE {pai.table} · ANNEX I · ASSET CLASS: {pai.assetClass.toUpperCase()}</span>
                    </div>
                    <h3 style={{margin:0,color:T.navy,fontSize:16}}>{pai.name}</h3>
                    <p style={{color:T.textSec,fontSize:12,margin:'4px 0 0'}}>{pai.metric}</p>
                  </div>
                  <span style={pill(catColor(pai.category),pai.category,false)}>{pai.category}</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
                  {[
                    {label:'Current Period',value:fp.current.toFixed(1)+' '+pai.unit,color:T.navy},
                    {label:'Prior Period',value:fp.prior.toFixed(1)+' '+pai.unit,color:T.textSec},
                    {label:'Δ YoY',value:(fp.current<fp.prior?'▼':'▲')+Math.abs(+(fp.current-fp.prior).toFixed(1))+' '+pai.unit,color:fp.current<fp.prior?T.green:T.red},
                    {label:'vs Benchmark',value:(fp.current<fp.benchmark?'Better':'Worse'),color:fp.current<fp.benchmark?T.green:T.red},
                  ].map((k,i)=>(
                    <div key={i} style={{padding:'12px 14px',background:T.surfaceH,borderRadius:8}}>
                      <div style={{fontSize:10,fontWeight:700,color:T.textMut,marginBottom:4}}>{k.label}</div>
                      <div style={{fontFamily:T.mono,fontWeight:700,color:k.color,fontSize:14}}>{k.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>3-Year Trend</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                      <XAxis dataKey="yr" style={{fontSize:11}}/>
                      <YAxis style={{fontSize:11}}/>
                      <Tooltip/>
                      <Area type="monotone" dataKey="value" stroke={T.navy} fill={T.gold+'30'} strokeWidth={2}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Top Contributing Holdings</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={holdings} layout="vertical" margin={{left:10}}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                      <XAxis type="number" style={{fontSize:10}}/>
                      <YAxis type="category" dataKey="name" width={60} style={{fontSize:10}}/>
                      <Tooltip/>
                      <Bar dataKey="contribution" fill={T.red} radius={[0,4,4,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Reduction Actions</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
                  {actions.map((a,i)=>(
                    <div key={i} style={{padding:'14px 16px',background:T.surfaceH,borderRadius:10,border:`1px solid ${T.borderL}`}}>
                      <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:6}}>{a.type}</div>
                      <div style={pill(a.status==='Complete'?T.green:a.status==='In Progress'?T.amber:T.red,a.status,true)}>{a.status}</div>
                      <div style={{fontSize:11,fontFamily:T.mono,color:T.textMut,marginTop:8}}>Due: {a.due}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== TAB 3: FUND COMPARISON ===== */
function FundComparison({selFund}){
  const topPais=['PAI-1','PAI-2','PAI-3','PAI-4','PAI-10','PAI-12','PAI-13'];
  const compData=topPais.map(paiId=>{
    const paiDef=PAI_INDICATORS.find(p=>p.id===paiId);
    return{
      name:paiId,
      ...Object.fromEntries(FUNDS.map(f=>[f.name.split(' ')[0],f.pais.find(p=>p.id===paiId)?.current?.toFixed(1)||0])),
    };
  });

  const artBreakdown=[
    {art:'Art 9',count:FUNDS.filter(f=>f.art==='Art 9').length,avgCoverage:Math.round(FUNDS.filter(f=>f.art==='Art 9').reduce((a,f)=>a+f.coverage,0)/Math.max(1,FUNDS.filter(f=>f.art==='Art 9').length))},
    {art:'Art 8',count:FUNDS.filter(f=>f.art==='Art 8').length,avgCoverage:Math.round(FUNDS.filter(f=>f.art==='Art 8').reduce((a,f)=>a+f.coverage,0)/Math.max(1,FUNDS.filter(f=>f.art==='Art 8').length))},
    {art:'Art 6',count:FUNDS.filter(f=>f.art==='Art 6').length,avgCoverage:Math.round(FUNDS.filter(f=>f.art==='Art 6').reduce((a,f)=>a+f.coverage,0)/Math.max(1,FUNDS.filter(f=>f.art==='Art 6').length))},
  ];

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
        {artBreakdown.map((a,i)=>(
          <div key={i} style={{background:T.surface,border:`2px solid ${artColor(a.art)}30`,borderRadius:12,padding:'16px 20px'}}>
            <div style={{fontSize:22,fontWeight:700,color:artColor(a.art),fontFamily:T.mono}}>{a.art}</div>
            <div style={{fontSize:26,fontWeight:700,color:T.navy,fontFamily:T.mono,marginTop:4}}>{a.count} funds</div>
            <div style={{fontSize:12,color:T.textSec,marginTop:2}}>Avg PAI coverage: {a.avgCoverage}%</div>
          </div>
        ))}
      </div>

      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:4}}>PAI Coverage & Classification — All Funds</div>
        <div style={{fontSize:12,color:T.textSec,marginBottom:16}}>Sorted by PAI coverage descending</div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead>
            <tr style={{borderBottom:`2px solid ${T.border}`}}>
              {['Fund','ISIN','Classification','AUM','PAI Coverage','PAI-1 GHG','PAI-2 Carbon FP','PAI-4 Fossil Fuel','PAI-12 Gender Gap'].map(h=>(
                <th key={h} style={{padding:'7px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',letterSpacing:0.4,whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...FUNDS].sort((a,b)=>b.coverage-a.coverage).map(f=>(
              <tr key={f.id} style={{borderBottom:`1px solid ${T.borderL}`,background:f.id===selFund.id?T.surfaceH:'transparent'}}>
                <td style={{padding:'9px 10px',fontWeight:600,color:T.navy,fontSize:12}}>{f.name}</td>
                <td style={{padding:'9px 10px',fontFamily:T.mono,fontSize:10,color:T.textMut}}>{f.isin.slice(0,12)}…</td>
                <td style={{padding:'9px 10px'}}><span style={pill(artColor(f.art),f.art,true)}>{f.art}</span></td>
                <td style={{padding:'9px 10px',fontFamily:T.mono,fontSize:11}}>€{f.aum}bn</td>
                <td style={{padding:'9px 10px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:60,height:5,background:T.borderL,borderRadius:3,overflow:'hidden'}}>
                      <div style={{width:f.coverage+'%',height:'100%',background:f.coverage>=80?T.green:f.coverage>=60?T.amber:T.red,borderRadius:3}}/>
                    </div>
                    <span style={{fontFamily:T.mono,fontSize:11,color:T.navy,fontWeight:700}}>{f.coverage}%</span>
                  </div>
                </td>
                {['PAI-1','PAI-2','PAI-4','PAI-12'].map(paiId=>(
                  <td key={paiId} style={{padding:'9px 10px',fontFamily:T.mono,fontSize:11,color:T.navy}}>
                    {f.pais.find(p=>p.id===paiId)?.current?.toFixed(1)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ===== TAB 4: ACTION PLAN ===== */
function ActionPlan({fund}){
  const worstPais=fund.pais.filter(p=>p.current>p.benchmark).slice(0,6);
  const actionStrategies={
    'PAI-1':['Set Science-Based Targets for portfolio companies','Engage top 10 GHG emitters for reduction roadmap','Divest from companies with >500 tCO2e/€M threshold'],
    'PAI-2':['Implement carbon footprint budget per sector','Tilt weights toward low-carbon leaders','PCAF data quality improvement program'],
    'PAI-3':['Engage high-intensity companies for CDP disclosure','Link executive pay to intensity reduction targets','Exclude companies with >3yr deteriorating trend'],
    'PAI-4':['Screen against IEA Net Zero pathway','Reduce fossil fuel weight to <5% by 2027','Engage on clean energy transition plans'],
    'PAI-10':['UNGC signatory status verification','Exclude persistent violators after 3yr engagement','ESG DD for new additions'],
    'PAI-12':['Engage boards on gender pay gap reporting','Link portfolio votes to equal pay policies','Gender pay gap as exclusion trigger >30%'],
  };

  const milestones=Array.from({length:6},(_,i)=>({
    q:`Q${(i%4)+1} ${2025+Math.floor(i/4)}`,
    target:['Baseline Assessment Complete','Top 5 Emitters Engaged','Exclusion List Updated','Q3 PAI Filing','Reduction Target Set','Annual PAI Published'][i],
    status:i<2?'Complete':i<3?'In Progress':'Planned',
  }));

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:20,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:4}}>PAI Reduction Strategies — Above Benchmark</div>
          <div style={{fontSize:12,color:T.textSec,marginBottom:16}}>Indicators where current value exceeds benchmark — action required</div>
          {PAI_INDICATORS.filter(p=>fund.pais.find(fp=>fp.id===p.id)?.current>fund.pais.find(fp=>fp.id===p.id)?.benchmark).slice(0,6).map((pai,i)=>{
            const fp=fund.pais.find(p=>p.id===pai.id);
            const strategies=actionStrategies[pai.id]||['Engage investees for data improvement','Monitor quarterly','Set reduction targets'];
            return(
              <div key={pai.id} style={{padding:'14px 16px',background:T.surfaceH,borderRadius:10,border:`1px solid ${T.borderL}`,marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <span style={{fontFamily:T.mono,fontSize:11,fontWeight:700,color:T.gold,background:T.navy,padding:'2px 6px',borderRadius:4}}>{pai.id}</span>
                    <span style={{fontSize:13,fontWeight:700,color:T.navy}}>{pai.name}</span>
                  </div>
                  <div style={{display:'flex',gap:8,fontFamily:T.mono,fontSize:11}}>
                    <span style={{color:T.red,fontWeight:700}}>{fp?.current.toFixed(1)}</span>
                    <span style={{color:T.textMut}}>vs</span>
                    <span style={{color:T.green}}>{fp?.benchmark.toFixed(1)} bm</span>
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:4}}>
                  {strategies.map((s,si)=>(
                    <div key={si} style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                      <span style={{color:T.gold,fontSize:12,flexShrink:0}}>→</span>
                      <span style={{fontSize:12,color:T.textSec}}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>PAI Improvement Roadmap</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {milestones.map((m,i)=>(
                <div key={i} style={{display:'flex',gap:12,alignItems:'center'}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:m.status==='Complete'?T.green:m.status==='In Progress'?T.amber:T.borderL,flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:T.navy}}>{m.target}</div>
                    <div style={{fontSize:10,fontFamily:T.mono,color:T.textMut}}>{m.q}</div>
                  </div>
                  <span style={pill(m.status==='Complete'?T.green:m.status==='In Progress'?T.amber:T.textMut,m.status,true)}>{m.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Engagement Statistics</div>
            {[
              {label:'Companies Engaged',value:`${Math.floor(sr(fund.id*31+7)*30+10)}`},
              {label:'CDP Responses Received',value:`${Math.floor(sr(fund.id*37+11)*25+8)}%`},
              {label:'Escalation to Vote',value:`${Math.floor(sr(fund.id*41+5)*15+3)}`},
              {label:'Divestments (12m)',value:`${Math.floor(sr(fund.id*43+9)*8+1)}`},
              {label:'PAI Improvement (1yr)',value:`${Math.floor(sr(fund.id*47+3)*15+2)}% avg`},
            ].map((f,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:i%2===0?T.surfaceH:'transparent',borderRadius:6,marginBottom:2}}>
                <span style={{fontSize:12,color:T.textSec}}>{f.label}</span>
                <span style={{fontFamily:T.mono,fontSize:13,fontWeight:700,color:T.navy}}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
