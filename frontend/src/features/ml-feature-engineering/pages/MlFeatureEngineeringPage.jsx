import React, { useState, useMemo } from 'react';
import {

  BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
  ReferenceLine, ZAxis
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const FEATURE_CATALOG = Array.from({length:20}, (_,i) => ({
  id:`F${i+1}`, name:['env_score','soc_score','gov_score','climate_transition','bio_land_use','supply_audit','human_dd','innov_greenrd','env_velocity','soc_velocity','climate_velocity','gov_acceleration','emissions_intensity','green_capex_pct','sbti_alignment','lobbying_score','board_diversity','water_stress','deforestation_risk','circular_economy'][i],
  category:['Base Score','Base Score','Base Score','Base Score','Base Score','Base Score','Base Score','Base Score','Velocity','Velocity','Velocity','Acceleration','Derived','Derived','Derived','Derived','Derived','Derived','Derived','Derived'][i],
  importance: Math.round(100-i*4.2+(sr(i * 10) * 2 - 1)*8), dqAvg: Math.round(2.5+(sr(i * 10) * 2 - 1)*1.2, 1),
  completeness: Math.round(85+(sr(i * 10) * 2 - 1)*12), correlation: Math.round(30+(sr(i * 510) * 2 - 1)*25+(sr(i * 20) * 2 - 1)*15)
}));

const CORR_MATRIX = Array.from({length:20}, (_,i) => {
  const row = { feature: FEATURE_CATALOG[i].name.slice(0,12) };
  FEATURE_CATALOG.slice(0,20).forEach((f,j) => {
    row[f.name.slice(0,12)] = i===j ? 100 : Math.round((sr((i-j)*8+500)*2-1)*40+(sr(i*j+200)*2-1)*20);
  });
  return row;
});

const PCA_DATA = Array.from({length:50}, (_,i) => ({
  pc: `PC${i+1}`, variance: Math.round(Math.max(0.5, 15*Math.exp(-i*0.08))*100)/100,
  cumulative: Math.min(100, Math.round((1-Math.exp(-i*0.04))*100*10)/10)
}));

const MI_RANKING = FEATURE_CATALOG.map(f=>({...f})).sort((a,b)=>b.importance-a.importance).slice(0,20);

const PIPELINE_STATUS = [
  { name:'Base Scores (316)', lastRefresh:'2026-04-04 06:00', completeness:98, status:'Healthy' },
  { name:'Velocity Features (316)', lastRefresh:'2026-04-04 06:15', completeness:94, status:'Healthy' },
  { name:'Acceleration Features (316)', lastRefresh:'2026-04-04 06:30', completeness:91, status:'Warning' },
  { name:'Derived Features (200+)', lastRefresh:'2026-04-04 07:00', completeness:87, status:'Healthy' },
];

const DQ_IMPACT = [
  { dq:'DQ1 (Reported+Assured)', rmse:3.2, r2:0.92, featureCount:180 },
  { dq:'DQ2 (Reported)', rmse:4.1, r2:0.87, featureCount:280 },
  { dq:'DQ3 (Estimated-High)', rmse:5.5, r2:0.81, featureCount:420 },
  { dq:'DQ4 (Estimated-Low)', rmse:7.8, r2:0.72, featureCount:620 },
  { dq:'DQ5 (Proxy/Default)', rmse:11.2, r2:0.58, featureCount:948 },
];

const TABS = ['Feature Catalog','Correlation Matrix','Feature Selection','PCA Analysis','Feature Store Status','Data Quality Impact'];

const Badge = ({code,label}) => <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',border:`1.5px solid ${T.gold}`,borderRadius:6,fontSize:11,fontFamily:T.mono,color:T.navy,background:`${T.gold}15`}}><span style={{fontWeight:700}}>{code}</span><span style={{color:T.textSec}}>{label}</span></div>;
const Card = ({children,style}) => <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,...style}}>{children}</div>;
const KPI = ({label,value,sub,color=T.navy}) => <div style={{textAlign:'center'}}><div style={{fontSize:22,fontWeight:700,color,fontFamily:T.mono}}>{value}</div><div style={{fontSize:11,color:T.textSec,marginTop:2}}>{label}</div>{sub&&<div style={{fontSize:10,color:T.textMut}}>{sub}</div>}</div>;
const Pill = ({label,active,onClick}) => <button onClick={onClick} style={{padding:'6px 16px',borderRadius:20,border:`1px solid ${active?T.navy:T.border}`,background:active?T.navy:'transparent',color:active?'#fff':T.textSec,fontSize:12,fontFamily:T.font,cursor:'pointer',fontWeight:active?600:400}}>{label}</button>;

export default function MlFeatureEngineeringPage() {
  const [tab, setTab] = useState(0);
  const [catFilter, setCatFilter] = useState('All');
  const [topN, setTopN] = useState(200);
  const [bookmarks, setBookmarks] = useState([]);

  const filteredCatalog = useMemo(() => catFilter==='All'?FEATURE_CATALOG:FEATURE_CATALOG.filter(f=>f.category===catFilter), [catFilter]);

  const renderCatalog = () => (
    <div>
      <div style={{display:'flex',gap:6,marginBottom:16}}>
        {['All','Base Score','Velocity','Acceleration','Derived'].map(c => <Pill key={c} label={c} active={catFilter===c} onClick={()=>setCatFilter(c)} />)}
      </div>
      <Card>
        <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:4}}>Feature Catalog (948 raw features)</div>
        <div style={{fontSize:11,color:T.textMut,marginBottom:12}}>316 base + 316 velocity (3mo delta) + 316 acceleration (12mo delta)</div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
            {['Feature','Category','MI Score','DQ Avg','Completeness'].map(h => <th key={h} style={{textAlign:'left',padding:'8px 10px',color:T.textSec,fontWeight:600}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filteredCatalog.map(f => (
              <tr key={f.id} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'6px 10px',fontFamily:T.mono,fontSize:11,color:T.navy,fontWeight:500}}>{f.name}</td>
                <td style={{padding:'6px 10px'}}><span style={{padding:'2px 8px',borderRadius:4,fontSize:10,background:`${f.category==='Base Score'?T.navy:f.category==='Velocity'?T.teal:f.category==='Acceleration'?T.purple:T.sage}15`,color:f.category==='Base Score'?T.navy:f.category==='Velocity'?T.teal:f.category==='Acceleration'?T.purple:T.sage}}>{f.category}</span></td>
                <td style={{padding:'6px 10px',fontFamily:T.mono,fontWeight:600}}>{f.importance}</td>
                <td style={{padding:'6px 10px',fontFamily:T.mono,color:f.dqAvg<=2?T.green:f.dqAvg<=3?T.amber:T.red}}>{f.dqAvg.toFixed(1)}</td>
                <td style={{padding:'6px 10px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:60,height:5,background:T.border,borderRadius:3,overflow:'hidden'}}><div style={{width:`${f.completeness}%`,height:'100%',background:f.completeness>=90?T.green:f.completeness>=75?T.amber:T.red,borderRadius:3}} /></div>
                    <span style={{fontFamily:T.mono,fontSize:10}}>{f.completeness}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );

  const renderCorrelation = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Correlation Matrix (Top 20 Features)</div>
      <div style={{overflowX:'auto'}}>
        <table style={{borderCollapse:'collapse',fontSize:9}}>
          <thead><tr>
            <th style={{padding:3}}></th>
            {FEATURE_CATALOG.slice(0,20).map(f => <th key={f.id} style={{padding:3,transform:'rotate(-45deg)',transformOrigin:'left bottom',whiteSpace:'nowrap',color:T.textMut}}>{f.name.slice(0,8)}</th>)}
          </tr></thead>
          <tbody>
            {CORR_MATRIX.slice(0,20).map((row,i) => (
              <tr key={i}>
                <td style={{padding:3,fontFamily:T.mono,color:T.textSec,whiteSpace:'nowrap'}}>{row.feature}</td>
                {FEATURE_CATALOG.slice(0,20).map((f,j) => {
                  const val = row[f.name.slice(0,12)] || 0;
                  const abs = Math.abs(val);
                  const bg = val===100?T.navy:abs>60?`${T.red}${Math.round(abs*0.8).toString(16).padStart(2,'0')}`:abs>30?`${T.amber}${Math.round(abs*0.6).toString(16).padStart(2,'0')}`:`${T.green}${Math.round(abs*0.4).toString(16).padStart(2,'0')}`;
                  return <td key={j} style={{padding:3,textAlign:'center',background:i===j?`${T.navy}20`:`${abs>50?T.red:abs>25?T.amber:T.green}${Math.round(abs*2.5).toString(16).padStart(2,'0')}`,fontFamily:T.mono,fontSize:8}}>{val}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:12,fontSize:11,color:T.textMut}}>High correlation (|r| &gt; 0.7) between feature pairs suggests redundancy. Feature selection step removes correlated pairs to reduce multicollinearity.</div>
    </Card>
  );

  const renderFeatureSelection = () => (
    <div>
      <Card>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={{fontSize:14,fontWeight:600,color:T.navy}}>Mutual Information Ranking (Top {topN})</div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <label style={{fontSize:11,color:T.textSec}}>Top N:</label>
            <input type="range" min={50} max={500} step={50} value={topN} onChange={e=>setTopN(+e.target.value)} style={{width:120}} />
            <span style={{fontFamily:T.mono,fontSize:11,color:T.navy}}>{topN}</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={MI_RANKING}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec}} angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{fontSize:11,fill:T.textSec}} />
            <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
            <Bar dataKey="importance" name="MI Score" fill={T.navy} radius={[4,4,0,0]}>
              {MI_RANKING.map((f,i) => <Cell key={i} fill={i<5?T.green:i<10?T.blue:i<15?T.amber:T.textMut} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );

  const renderPCA = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>PCA: Explained Variance (Elbow Plot)</div>
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={PCA_DATA.slice(0,30)}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="pc" tick={{fontSize:9,fill:T.textSec}} />
          <YAxis yAxisId="left" tick={{fontSize:11,fill:T.textSec}} label={{value:'Variance %',angle:-90,position:'insideLeft',fontSize:10,fill:T.textSec}} />
          <YAxis yAxisId="right" orientation="right" domain={[0,100]} tick={{fontSize:11,fill:T.textSec}} label={{value:'Cumulative %',angle:90,position:'insideRight',fontSize:10,fill:T.textSec}} />
          <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
          <Legend />
          <Area yAxisId="left" type="monotone" dataKey="variance" name="Individual Variance" stroke={T.navy} fill={`${T.navy}20`} />
          <Line yAxisId="right" type="monotone" dataKey="cumulative" name="Cumulative" stroke={T.gold} strokeWidth={2} dot={false} />
          <ReferenceLine yAxisId="right" y={85} stroke={T.green} strokeDasharray="4 4" label={{value:'85% threshold',fill:T.green,fontSize:9}} />
        </AreaChart>
      </ResponsiveContainer>
      <div style={{padding:10,background:`${T.green}08`,borderRadius:6,marginTop:12,fontSize:11,color:T.textSec}}>
        First 50 principal components explain 85% of total variance. Elbow at PC12 suggests 12 primary latent factors driving sustainability scores across entities.
      </div>
    </Card>
  );

  const renderPipeline = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Feature Store Pipeline Status</div>
      {PIPELINE_STATUS.map(p => (
        <div key={p.name} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:`1px solid ${T.border}`}}>
          <div>
            <div style={{fontWeight:600,fontSize:13,color:T.navy}}>{p.name}</div>
            <div style={{fontSize:10,fontFamily:T.mono,color:T.textMut}}>Last: {p.lastRefresh}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:50,height:5,background:T.border,borderRadius:3,overflow:'hidden'}}><div style={{width:`${p.completeness}%`,height:'100%',background:p.completeness>=95?T.green:p.completeness>=85?T.amber:T.red,borderRadius:3}} /></div>
              <span style={{fontFamily:T.mono,fontSize:10}}>{p.completeness}%</span>
            </div>
            <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,background:p.status==='Healthy'?`${T.green}15`:`${T.amber}15`,color:p.status==='Healthy'?T.green:T.amber}}>{p.status}</span>
          </div>
        </div>
      ))}
    </Card>
  );

  const renderDQImpact = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Data Quality Impact on Model Performance</div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={DQ_IMPACT}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="dq" tick={{fontSize:10,fill:T.textSec}} />
          <YAxis yAxisId="left" tick={{fontSize:11,fill:T.textSec}} />
          <YAxis yAxisId="right" orientation="right" domain={[0,1]} tick={{fontSize:11,fill:T.textSec}} />
          <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
          <Legend />
          <Bar yAxisId="left" dataKey="rmse" name="RMSE" fill={T.red} radius={[4,4,0,0]} />
          <Line yAxisId="right" type="monotone" dataKey="r2" name="R-squared" stroke={T.green} strokeWidth={2} dot={{r:4}} />
        </BarChart>
      </ResponsiveContainer>
      <div style={{padding:10,background:`${T.amber}08`,borderRadius:6,marginTop:12,fontSize:11,color:T.textSec}}>
        DQ5 (proxy/default) features add substantial noise, increasing RMSE by 3.5x vs DQ1-only features. Recommendation: exclude DQ5 features from ensemble models; use DQ1-3 for production scoring, DQ4-5 for research/exploration only.
      </div>
    </Card>
  );

  const panels = [renderCatalog, renderCorrelation, renderFeatureSelection, renderPCA, renderPipeline, renderDQImpact];

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <div style={{maxWidth:1400,margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div>
            <Badge code="EP-CX1" label="ML Feature Engineering" />
            <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:'12px 0 4px'}}>ML Feature Engineering from Taxonomy</h1>
            <p style={{fontSize:13,color:T.textSec,margin:0}}>948 raw features: 316 base + 316 velocity + 316 acceleration, with PCA and MI ranking</p>
          </div>
          <div style={{display:'flex',gap:16}}>
            <KPI label="Raw Features" value="948" sub="3 families" />
            <KPI label="Selected" value={topN} sub="MI top-N" color={T.gold} />
            <KPI label="PCA 85%" value="50 PCs" sub="of 948" color={T.teal} />
          </div>
        </div>
        <div style={{display:'flex',gap:4,borderBottom:`2px solid ${T.border}`,marginBottom:20}}>
          {TABS.map((t,i) => <button key={i} onClick={()=>setTab(i)} style={{padding:'10px 18px',border:'none',borderBottom:`2px solid ${tab===i?T.gold:'transparent'}`,background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?600:400,fontSize:13,fontFamily:T.font,cursor:'pointer',marginBottom:-2}}>{t}</button>)}
        </div>
        {panels[tab]()}
        <div style={{marginTop:20,padding:14,background:`${T.gold}08`,border:`1px solid ${T.gold}30`,borderRadius:8}}>
          <div style={{fontSize:12,fontWeight:600,color:T.gold,marginBottom:4}}>Feature Engineering Reference</div>
          <div style={{fontSize:11,color:T.textSec}}>Velocity features: 3-month score deltas capturing momentum. Acceleration features: 12-month second derivative capturing trend inflection. Mutual information computed using KSG estimator (k=5 neighbors). PCA uses standardized features (z-score) with singular value decomposition. Feature store refreshes daily at 06:00 UTC with 99.5% SLA uptime.</div>
        </div>
      </div>
    </div>
  );
}
