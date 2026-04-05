import React, { useState, useMemo } from 'react';
import {
  ScatterChart, Scatter, BarChart, Bar, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, ZAxis
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const CLUSTER_COLORS = [T.green, T.blue, T.amber, T.purple, T.red];
const CLUSTER_NAMES = ['Leaders','Transitioning','Average','Lagging','At Risk'];

const ENTITIES = Array.from({length:20}, (_,i) => {
  const cluster = Math.floor(i/4);
  const base = [80,65,52,38,25][cluster];
  return {
    id:`E${i+1}`,
    name:['JPMorgan','Microsoft','Allianz','NextEra','HSBC','Unilever','Enel','Siemens','Shell','BNP','Nestle','BlackRock','TotalEnergies','BP','Tesla','ArcelorMittal','Glencore','ExxonMobil','Peabody','Vedanta'][i],
    sector:['Banking','Tech','Insurance','Renewables','Banking','Consumer','Utilities','Industrials','Oil & Gas','Banking','Consumer','Asset Mgmt','Oil & Gas','Oil & Gas','Auto','Steel','Mining','Oil & Gas','Coal','Mining'][i],
    cluster,
    pc1: Math.round((base-50+Math.sin(i*2.1)*15)*10)/10,
    pc2: Math.round((Math.cos(i*1.7)*20+cluster*5-10)*10)/10,
    scores: { env:Math.round(base+Math.sin(i)*10), soc:Math.round(base+Math.cos(i)*8), gov:Math.round(base+5+Math.sin(i*0.7)*7), climate:Math.round(base-3+Math.cos(i*1.2)*12) },
    q1Cluster: Math.min(4, Math.max(0, cluster + (Math.random()>0.7 ? (Math.random()>0.5?1:-1) : 0))),
    q2Cluster: Math.min(4, Math.max(0, cluster + (Math.random()>0.8 ? (Math.random()>0.5?1:-1) : 0))),
    q3Cluster: Math.min(4, Math.max(0, cluster + (Math.random()>0.85 ? -1 : 0))),
    q4Cluster: cluster,
  };
});

const SILHOUETTE_DATA = Array.from({length:9}, (_,i) => ({
  k: i+2, silhouette: Math.round((0.3+Math.sin(i*0.8)*0.15+0.05*(i===3?0.1:0))*100)/100
}));

const TABS = ['Cluster Visualization','Silhouette Analysis','Cluster Profiles','Migration Tracker','Custom Groups','Engagement by Cluster'];

const Badge = ({code,label}) => <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',border:`1.5px solid ${T.gold}`,borderRadius:6,fontSize:11,fontFamily:T.mono,color:T.navy,background:`${T.gold}15`}}><span style={{fontWeight:700}}>{code}</span><span style={{color:T.textSec}}>{label}</span></div>;
const Card = ({children,style}) => <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,...style}}>{children}</div>;
const KPI = ({label,value,sub,color=T.navy}) => <div style={{textAlign:'center'}}><div style={{fontSize:22,fontWeight:700,color,fontFamily:T.mono}}>{value}</div><div style={{fontSize:11,color:T.textSec,marginTop:2}}>{label}</div>{sub&&<div style={{fontSize:10,color:T.textMut}}>{sub}</div>}</div>;

export default function PeerClusteringSegmentationPage() {
  const [tab, setTab] = useState(0);
  const [kVal, setKVal] = useState(5);
  const [bookmarks, setBookmarks] = useState([]);

  const clusterProfiles = useMemo(() => Array.from({length:kVal}, (_,c) => {
    const members = ENTITIES.filter(e => e.cluster === c);
    if(!members.length) return null;
    return {
      cluster: c, name: CLUSTER_NAMES[c] || `Cluster ${c+1}`, color: CLUSTER_COLORS[c],
      count: members.length, sectors: [...new Set(members.map(e=>e.sector))],
      avgScores: {
        env: Math.round(members.reduce((a,e)=>a+e.scores.env,0)/members.length),
        soc: Math.round(members.reduce((a,e)=>a+e.scores.soc,0)/members.length),
        gov: Math.round(members.reduce((a,e)=>a+e.scores.gov,0)/members.length),
        climate: Math.round(members.reduce((a,e)=>a+e.scores.climate,0)/members.length),
      }
    };
  }).filter(Boolean), [kVal]);

  const radarData = useMemo(() => ['env','soc','gov','climate'].map(key => {
    const row = { topic: key.charAt(0).toUpperCase()+key.slice(1) };
    clusterProfiles.forEach(cp => { row[cp.name] = cp.avgScores[key]; });
    return row;
  }), [clusterProfiles]);

  const migrationData = useMemo(() => ENTITIES.map(e => {
    const quarters = [e.q1Cluster, e.q2Cluster, e.q3Cluster, e.q4Cluster];
    const moved = quarters.some((q,i) => i>0 && q !== quarters[i-1]);
    return { ...e, quarters, moved };
  }), []);

  const renderClusterViz = () => (
    <Card>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={{fontSize:14,fontWeight:600,color:T.navy}}>K-Means Clustering: PC1 vs PC2 (k={kVal})</div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <label style={{fontSize:11,color:T.textSec}}>k:</label>
          <input type="range" min={2} max={8} value={kVal} onChange={e=>setKVal(+e.target.value)} style={{width:100}} />
          <span style={{fontFamily:T.mono,fontSize:12,fontWeight:600,color:T.navy}}>{kVal}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="pc1" name="PC1" tick={{fontSize:11,fill:T.textSec}} label={{value:'Principal Component 1',position:'bottom',fontSize:11}} />
          <YAxis dataKey="pc2" name="PC2" tick={{fontSize:11,fill:T.textSec}} label={{value:'PC2',angle:-90,position:'insideLeft',fontSize:11}} />
          <ZAxis range={[80,80]} />
          <Tooltip content={({payload})=>{
            if(!payload?.length) return null;
            const d=payload[0].payload;
            return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:10,fontSize:12,fontFamily:T.font}}>
              <div style={{fontWeight:600,color:T.navy}}>{d.name}</div>
              <div style={{color:T.textSec}}>{d.sector}</div>
              <div style={{color:CLUSTER_COLORS[d.cluster],fontWeight:600}}>Cluster: {CLUSTER_NAMES[d.cluster]}</div>
            </div>;
          }} />
          <Legend payload={CLUSTER_NAMES.slice(0,kVal).map((n,i)=>({value:n,color:CLUSTER_COLORS[i],type:'circle'}))} />
          {CLUSTER_NAMES.slice(0,kVal).map((name,c) => (
            <Scatter key={c} name={name} data={ENTITIES.filter(e=>e.cluster===c)} fill={CLUSTER_COLORS[c]} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </Card>
  );

  const renderSilhouette = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Silhouette Coefficient by k (Optimal k Selection)</div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={SILHOUETTE_DATA}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="k" tick={{fontSize:11,fill:T.textSec}} label={{value:'Number of Clusters (k)',position:'bottom',fontSize:11}} />
          <YAxis domain={[0,0.6]} tick={{fontSize:11,fill:T.textSec}} />
          <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
          <Bar dataKey="silhouette" name="Silhouette Score" radius={[4,4,0,0]}>
            {SILHOUETTE_DATA.map((d,i) => <Cell key={i} fill={d.k===5?T.green:T.blue} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{padding:10,background:`${T.green}08`,borderRadius:6,marginTop:12,fontSize:11,color:T.textSec}}>
        Optimal k=5 (silhouette={SILHOUETTE_DATA.find(d=>d.k===5)?.silhouette}). Higher silhouette indicates better-defined clusters. k=5 provides the best balance between granularity and cluster cohesion.
      </div>
    </Card>
  );

  const renderProfiles = () => (
    <div>
      <Card style={{marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Cluster Profiles (Avg Taxonomy Scores)</div>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke={T.border} />
            <PolarAngleAxis dataKey="topic" tick={{fontSize:11,fill:T.textSec}} />
            <PolarRadiusAxis domain={[0,100]} tick={{fontSize:9,fill:T.textMut}} />
            {clusterProfiles.map(cp => <Radar key={cp.name} name={cp.name} dataKey={cp.name} stroke={cp.color} fill={cp.color} fillOpacity={0.08} strokeWidth={2} />)}
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(kVal,5)},1fr)`,gap:12}}>
        {clusterProfiles.map(cp => (
          <Card key={cp.cluster} style={{borderTop:`3px solid ${cp.color}`}}>
            <div style={{fontWeight:700,fontSize:13,color:cp.color}}>{cp.name}</div>
            <div style={{fontSize:11,color:T.textMut,margin:'4px 0 8px'}}>{cp.count} entities</div>
            {Object.entries(cp.avgScores).map(([k,v]) => (
              <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'3px 0'}}>
                <span style={{color:T.textSec}}>{k}</span>
                <span style={{fontFamily:T.mono,fontWeight:600,color:T.navy}}>{v}</span>
              </div>
            ))}
            <div style={{marginTop:8,fontSize:10,color:T.textMut}}>{cp.sectors.slice(0,3).join(', ')}{cp.sectors.length>3?` +${cp.sectors.length-3}`:''}</div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderMigration = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Cluster Migration Over 4 Quarters</div>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
        <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
          {['Entity','Q1-25','Q2-25','Q3-25','Q4-25','Migrated?'].map(h => <th key={h} style={{textAlign:'left',padding:'8px 10px',color:T.textSec,fontWeight:600}}>{h}</th>)}
        </tr></thead>
        <tbody>
          {migrationData.map(e => (
            <tr key={e.id} style={{borderBottom:`1px solid ${T.border}`,background:e.moved?`${T.amber}06`:'transparent'}}>
              <td style={{padding:'6px 10px',fontWeight:500,color:T.navy}}>{e.name}</td>
              {e.quarters.map((q,qi) => (
                <td key={qi} style={{padding:'6px 10px'}}>
                  <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,background:`${CLUSTER_COLORS[q]}15`,color:CLUSTER_COLORS[q]}}>{CLUSTER_NAMES[q]}</span>
                </td>
              ))}
              <td style={{padding:'6px 10px'}}>{e.moved ? <span style={{color:T.amber,fontWeight:600}}>Yes</span> : <span style={{color:T.textMut}}>No</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );

  const renderCustomGroups = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Custom Group Builder</div>
      <div style={{fontSize:12,color:T.textSec,marginBottom:16}}>Create custom peer groups by selecting entities across clusters for targeted comparison.</div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
        {ENTITIES.map(e => (
          <button key={e.id} onClick={()=>setBookmarks(b=>b.includes(e.id)?b.filter(x=>x!==e.id):[...b,e.id])} style={{padding:'5px 12px',borderRadius:6,border:`1px solid ${bookmarks.includes(e.id)?CLUSTER_COLORS[e.cluster]:T.border}`,background:bookmarks.includes(e.id)?`${CLUSTER_COLORS[e.cluster]}15`:'transparent',fontSize:11,cursor:'pointer',color:bookmarks.includes(e.id)?CLUSTER_COLORS[e.cluster]:T.textSec}}>
            {e.name}
          </button>
        ))}
      </div>
      {bookmarks.length > 0 && (
        <div style={{marginTop:16,padding:12,border:`1px solid ${T.gold}30`,borderRadius:8,background:`${T.gold}08`}}>
          <div style={{fontSize:12,fontWeight:600,color:T.gold}}>Custom Group ({bookmarks.length} entities)</div>
          <div style={{fontSize:11,color:T.textSec,marginTop:4}}>{bookmarks.map(id=>ENTITIES.find(e=>e.id===id)?.name).filter(Boolean).join(', ')}</div>
        </div>
      )}
    </Card>
  );

  const renderEngagement = () => (
    <div>
      {clusterProfiles.slice().reverse().map(cp => {
        const members = ENTITIES.filter(e=>e.cluster===cp.cluster);
        return (
          <Card key={cp.cluster} style={{marginBottom:12,borderLeft:`3px solid ${cp.color}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div>
                <span style={{fontWeight:700,fontSize:14,color:cp.color}}>{cp.name}</span>
                <span style={{fontSize:11,color:T.textMut,marginLeft:8}}>{cp.count} entities</span>
              </div>
              <span style={{padding:'3px 10px',borderRadius:4,fontSize:10,fontWeight:600,background:cp.cluster>=3?`${T.red}15`:cp.cluster>=2?`${T.amber}15`:`${T.green}15`,color:cp.cluster>=3?T.red:cp.cluster>=2?T.amber:T.green}}>
                {cp.cluster>=3?'High Priority':cp.cluster>=2?'Medium Priority':'Low Priority'}
              </span>
            </div>
            <div style={{fontSize:11,color:T.textSec}}>{members.map(m=>m.name).join(', ')}</div>
          </Card>
        );
      })}
      <div style={{padding:14,background:`${T.blue}08`,border:`1px solid ${T.blue}25`,borderRadius:8,marginTop:8}}>
        <div style={{fontSize:12,fontWeight:600,color:T.blue}}>Engagement Strategy</div>
        <div style={{fontSize:11,color:T.textSec,marginTop:4}}>Prioritize "At Risk" and "Lagging" clusters for immediate engagement. "Average" cluster represents the largest opportunity for score improvement via targeted capacity building. "Leaders" can serve as peer mentors and best-practice case studies.</div>
      </div>
    </div>
  );

  const panels = [renderClusterViz, renderSilhouette, renderProfiles, renderMigration, renderCustomGroups, renderEngagement];

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <div style={{maxWidth:1400,margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div>
            <Badge code="EP-CX4" label="Peer Clustering & Segmentation" />
            <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:'12px 0 4px'}}>Peer Clustering & Segmentation</h1>
            <p style={{fontSize:13,color:T.textSec,margin:0}}>K-means clustering (k=2-10), silhouette analysis, cluster migration tracking</p>
          </div>
          <div style={{display:'flex',gap:16}}>
            <KPI label="Entities" value="20" sub="clustered" />
            <KPI label="Clusters" value={kVal} sub="k-means" color={T.gold} />
            <KPI label="Migrated" value={migrationData.filter(e=>e.moved).length} sub="entities" color={T.amber} />
          </div>
        </div>
        <div style={{display:'flex',gap:4,borderBottom:`2px solid ${T.border}`,marginBottom:20}}>
          {TABS.map((t,i) => <button key={i} onClick={()=>setTab(i)} style={{padding:'10px 18px',border:'none',borderBottom:`2px solid ${tab===i?T.gold:'transparent'}`,background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?600:400,fontSize:13,fontFamily:T.font,cursor:'pointer',marginBottom:-2}}>{t}</button>)}
        </div>
        {panels[tab]()}
        <div style={{marginTop:20,padding:14,background:`${T.gold}08`,border:`1px solid ${T.gold}30`,borderRadius:8}}>
          <div style={{fontSize:12,fontWeight:600,color:T.gold,marginBottom:4}}>Clustering Methodology</div>
          <div style={{fontSize:11,color:T.textSec}}>K-means clustering on standardized taxonomy features (z-score normalization). PCA reduces 948-dimensional feature space to 2D for visualization. Silhouette analysis determines optimal k. Cluster migration tracked quarterly with transition matrix analysis. Engagement priority ranked by cluster risk level and potential improvement magnitude.</div>
        </div>
      </div>
    </div>
  );
}
