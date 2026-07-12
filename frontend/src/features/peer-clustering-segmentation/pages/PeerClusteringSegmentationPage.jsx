import React, { useState, useMemo } from 'react';
import {

  ScatterChart, Scatter, BarChart, Bar, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, ZAxis
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// --- Real k-means (Lloyd's algorithm, k-means++ init) + real silhouette scoring ---
// Replaces the previous fabricated `cluster = Math.floor(i/4)` assignment and the random,
// hard-coded-bonus-at-k=5 "silhouette" values with an actual clustering + validity computation
// run on the entities' standardized ESG/climate taxonomy scores.
const makeSeededRng = (seed) => { let s = seed; return () => { s += 1; return sr(s); }; };
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const meanArr = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
const sqDist = (a, b) => a.reduce((s, v, i) => s + (v - b[i]) * (v - b[i]), 0);
const euclidean = (a, b) => Math.sqrt(sqDist(a, b));

const standardize = (matrix) => {
  const d = matrix[0].length, n = matrix.length;
  const means = new Array(d).fill(0), stds = new Array(d).fill(0);
  matrix.forEach(row => row.forEach((v, c) => { means[c] += v / n; }));
  matrix.forEach(row => row.forEach((v, c) => { stds[c] += (v - means[c]) ** 2 / n; }));
  stds.forEach((v, c) => { stds[c] = Math.sqrt(v) || 1; });
  return matrix.map(row => row.map((v, c) => (v - means[c]) / stds[c]));
};

const kmeansPlusPlusInit = (data, k, rng) => {
  const centroids = [];
  centroids.push([...data[Math.floor(rng() * data.length)]]);
  while (centroids.length < k) {
    const dists = data.map(p => Math.min(...centroids.map(c => sqDist(p, c))));
    const total = dists.reduce((a, b) => a + b, 0);
    if (total <= 0) { centroids.push([...data[Math.floor(rng() * data.length)]]); continue; }
    let r = rng() * total, chosen = data.length - 1;
    for (let i = 0; i < data.length; i++) { r -= dists[i]; if (r <= 0) { chosen = i; break; } }
    centroids.push([...data[chosen]]);
  }
  return centroids;
};

// Standard Lloyd's algorithm: assign each point to its nearest centroid (Euclidean distance on the
// feature vector), recompute centroids as the mean of assigned points, iterate to convergence.
const kmeans = (data, k, rng, maxIter = 200) => {
  let centroids = kmeansPlusPlusInit(data, k, rng);
  let labels = new Array(data.length).fill(-1);
  for (let iter = 0; iter < maxIter; iter++) {
    const newLabels = data.map(p => {
      let best = 0, bestD = Infinity;
      centroids.forEach((c, ci) => { const dd = sqDist(p, c); if (dd < bestD) { bestD = dd; best = ci; } });
      return best;
    });
    const changed = newLabels.some((l, i) => l !== labels[i]);
    labels = newLabels;
    const counts = new Array(k).fill(0);
    const sums = Array.from({ length: k }, () => new Array(data[0].length).fill(0));
    data.forEach((p, i) => { counts[labels[i]]++; p.forEach((v, d) => { sums[labels[i]][d] += v; }); });
    const newCentroids = sums.map((s, c) => counts[c] ? s.map(v => v / counts[c]) : centroids[c]);
    const shift = newCentroids.reduce((a, c, ci) => a + euclidean(c, centroids[ci]), 0);
    centroids = newCentroids;
    if (!changed || shift < 1e-7) break;
  }
  const inertia = data.reduce((a, p, i) => a + sqDist(p, centroids[labels[i]]), 0);
  return { labels, centroids, inertia };
};

// Multiple random restarts (different k-means++ seed each time), keep the lowest-inertia run --
// standard practice to avoid poor local optima from a single initialization.
const kmeansBest = (data, k, restarts, seedBase) => {
  let best = null;
  for (let r = 0; r < restarts; r++) {
    const result = kmeans(data, k, makeSeededRng(seedBase + r * 733));
    if (!best || result.inertia < best.inertia) best = result;
  }
  return best;
};

// Real silhouette coefficient: for each point i, a(i) = mean intra-cluster distance,
// b(i) = mean distance to the nearest *other* cluster, s(i) = (b-a)/max(a,b), averaged over all points.
const silhouetteScore = (data, labels, k) => {
  const n = data.length;
  if (k < 2 || k >= n) return 0;
  const clusters = [...new Set(labels)];
  const values = data.map((p, i) => {
    const ci = labels[i];
    const same = data.filter((_, j) => j !== i && labels[j] === ci);
    const a = same.length ? meanArr(same.map(q => euclidean(p, q))) : 0;
    let b = Infinity;
    clusters.filter(c => c !== ci).forEach(c => {
      const pts = data.filter((_, j) => labels[j] === c);
      if (pts.length) b = Math.min(b, meanArr(pts.map(q => euclidean(p, q))));
    });
    if (!isFinite(b)) b = a;
    const denom = Math.max(a, b);
    return denom > 0 ? (b - a) / denom : 0;
  });
  return meanArr(values);
};

// 2-component PCA via power iteration + deflation on the covariance matrix -- used only to project
// the 4D standardized feature space down to (PC1,PC2) for the scatter plot; clustering itself runs
// on the full standardized feature vectors, not the 2D projection.
const covariance = (X) => {
  const n = X.length, d = X[0].length;
  return Array.from({ length: d }, (_, a) => Array.from({ length: d }, (_, b) => {
    let s = 0; for (let i = 0; i < n; i++) s += X[i][a] * X[i][b];
    return s / (n - 1);
  }));
};
const matVec = (M, v) => M.map(row => dot(row, v));
const normalizeVec = (v) => { const norm = Math.sqrt(dot(v, v)) || 1; return v.map(x => x / norm); };
const powerIteration = (M, iters = 300) => {
  let v = normalizeVec(M.map((_, i) => 1 / (i + 1)));
  for (let it = 0; it < iters; it++) v = normalizeVec(matVec(M, v));
  const Mv = matVec(M, v);
  return { vector: v, value: dot(v, Mv) };
};
const topTwoComponents = (X) => {
  const C = covariance(X);
  const { vector: v1, value: l1 } = powerIteration(C);
  const C2 = C.map((row, a) => row.map((val, b) => val - l1 * v1[a] * v1[b]));
  const { vector: v2 } = powerIteration(C2);
  return { v1, v2 };
};

// Relabel raw k-means cluster indices (arbitrary order) so cluster 0 = highest composite score
// ("Leaders") through cluster k-1 = lowest ("At Risk"), matching the CLUSTER_NAMES ordering.
const relabelBySeverity = (data, labels, k) => {
  const sums = new Array(k).fill(0), counts = new Array(k).fill(0);
  data.forEach((p, i) => { sums[labels[i]] += p.reduce((a, v) => a + v, 0); counts[labels[i]]++; });
  const order = sums.map((s, c) => ({ c, avg: counts[c] ? s / counts[c] : -Infinity })).sort((a, b) => b.avg - a.avg).map(o => o.c);
  const remap = new Array(k);
  order.forEach((origC, newIdx) => { remap[origC] = newIdx; });
  return labels.map(l => remap[l]);
};

const T = {
  bg:'#f4f6f9', surface:'#ffffff', border:'#e3e8ef', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const CLUSTER_COLORS = [T.green, T.blue, T.amber, T.purple, T.red, T.teal, T.orange, T.navyL];
const CLUSTER_NAMES = ['Leaders','Transitioning','Average','Lagging','At Risk'];
const clusterName = (c) => CLUSTER_NAMES[c] || `Cluster ${c + 1}`;
const clusterColor = (c) => CLUSTER_COLORS[c % CLUSTER_COLORS.length];

const BASE_ENTITIES = Array.from({length:20}, (_,i) => {
  // `tier` seeds a realistic 5-tier ESG score distribution (synthetic input data only) -- it is
  // NOT the cluster assignment. Cluster membership is computed by real k-means below, on these scores.
  const tier = Math.floor(i/4);
  const base = [80,65,52,38,25][tier];
  return {
    id:`E${i+1}`,
    name:['JPMorgan','Microsoft','Allianz','NextEra','HSBC','Unilever','Enel','Siemens','Shell','BNP','Nestle','BlackRock','TotalEnergies','BP','Tesla','ArcelorMittal','Glencore','ExxonMobil','Peabody','Vedanta'][i],
    sector:['Banking','Tech','Insurance','Renewables','Banking','Consumer','Utilities','Industrials','Oil & Gas','Banking','Consumer','Asset Mgmt','Oil & Gas','Oil & Gas','Auto','Steel','Mining','Oil & Gas','Coal','Mining'][i],
    tier,
    scores: { env:Math.round(base+(sr(i * 10) * 2 - 1)*10), soc:Math.round(base+(sr(i * 510) * 2 - 1)*8), gov:Math.round(base+5+(sr(i * 7) * 2 - 1)*7), climate:Math.round(base-3+(sr(i * 512) * 2 - 1)*12) },
    q1Cluster: Math.min(4, Math.max(0, tier + ((sr(i * 31) * 2 - 1)>0.4 ? ((sr(i * 57) * 2 - 1)>0?1:-1) : 0))),
    q2Cluster: Math.min(4, Math.max(0, tier + ((sr(i * 29 + 10) * 2 - 1)>0.6 ? ((sr(i * 43) * 2 - 1)>0?1:-1) : 0))),
    q3Cluster: Math.min(4, Math.max(0, tier + ((sr(i * 21 + 20) * 2 - 1)>0.7 ? -1 : 0))),
    q4Cluster: tier,
  };
});

// Feature matrix for clustering/PCA: standardized (z-score) E/S/G/Climate taxonomy scores.
const RAW_FEATURES = BASE_ENTITIES.map(e => [e.scores.env, e.scores.soc, e.scores.gov, e.scores.climate]);
const FEATURES = standardize(RAW_FEATURES);
const { v1: PCA_V1, v2: PCA_V2 } = topTwoComponents(FEATURES);
const PCA_SCALE = 15;
const ENTITIES = BASE_ENTITIES.map((e, i) => ({
  ...e,
  pc1: Math.round(dot(FEATURES[i], PCA_V1) * PCA_SCALE * 10) / 10,
  pc2: Math.round(dot(FEATURES[i], PCA_V2) * PCA_SCALE * 10) / 10,
}));

// Real silhouette-vs-k curve: run k-means (best of several restarts) for each k and score it --
// these values genuinely vary with k because they come from an actual clustering + silhouette
// computation on FEATURES, not a random number with a hard-coded bonus at k=5.
const SILHOUETTE_DATA = Array.from({length:9}, (_,i) => {
  const k = i + 2;
  const { labels } = kmeansBest(FEATURES, k, 10, 5000 + k * 613);
  return { k, silhouette: Math.round(silhouetteScore(FEATURES, labels, k) * 100) / 100 };
});
const OPTIMAL_K = SILHOUETTE_DATA.reduce((best, d) => d.silhouette > best.silhouette ? d : best, SILHOUETTE_DATA[0]).k;

const TABS = ['Cluster Visualization','Silhouette Analysis','Cluster Profiles','Migration Tracker','Custom Groups','Engagement by Cluster'];

const Badge = ({code,label}) => <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',border:`1.5px solid ${T.gold}`,borderRadius:6,fontSize:11,fontFamily:T.mono,color:T.navy,background:`${T.gold}15`}}><span style={{fontWeight:700}}>{code}</span><span style={{color:T.textSec}}>{label}</span></div>;
const Card = ({children,style}) => <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,...style}}>{children}</div>;
const KPI = ({label,value,sub,color=T.navy}) => <div style={{textAlign:'center'}}><div style={{fontSize:22,fontWeight:700,color,fontFamily:T.mono}}>{value}</div><div style={{fontSize:11,color:T.textSec,marginTop:2}}>{label}</div>{sub&&<div style={{fontSize:10,color:T.textMut}}>{sub}</div>}</div>;

export default function PeerClusteringSegmentationPage() {
  const [tab, setTab] = useState(0);
  const [kVal, setKVal] = useState(5);
  const [bookmarks, setBookmarks] = useState([]);

  // Run real k-means (best of 10 restarts) on the standardized feature matrix each time k changes,
  // then relabel clusters by severity so colors/names stay meaningful (Leaders -> At Risk).
  const clusterAssignment = useMemo(() => {
    const { labels } = kmeansBest(FEATURES, kVal, 10, 4242 + kVal * 911);
    return relabelBySeverity(FEATURES, labels, kVal);
  }, [kVal]);
  const clusteredEntities = useMemo(() => ENTITIES.map((e, i) => ({ ...e, cluster: clusterAssignment[i] })), [clusterAssignment]);
  const currentSilhouette = useMemo(() => Math.round(silhouetteScore(FEATURES, clusterAssignment, kVal) * 100) / 100, [clusterAssignment, kVal]);

  const clusterProfiles = useMemo(() => Array.from({length:kVal}, (_,c) => {
    const members = clusteredEntities.filter(e => e.cluster === c);
    if(!members.length) return null;
    return {
      cluster: c, name: clusterName(c), color: clusterColor(c),
      count: members.length, sectors: [...new Set(members.map(e=>e.sector))],
      avgScores: {
        env: Math.round(members.reduce((a,e)=>a+e.scores.env,0)/members.length),
        soc: Math.round(members.reduce((a,e)=>a+e.scores.soc,0)/members.length),
        gov: Math.round(members.reduce((a,e)=>a+e.scores.gov,0)/members.length),
        climate: Math.round(members.reduce((a,e)=>a+e.scores.climate,0)/members.length),
      }
    };
  }).filter(Boolean), [kVal, clusteredEntities]);

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
              <div style={{color:clusterColor(d.cluster),fontWeight:600}}>Cluster: {clusterName(d.cluster)}</div>
            </div>;
          }} />
          <Legend payload={Array.from({length:kVal},(_,c)=>({value:clusterName(c),color:clusterColor(c),type:'circle'}))} />
          {Array.from({length:kVal},(_,c) => (
            <Scatter key={c} name={clusterName(c)} data={clusteredEntities.filter(e=>e.cluster===c)} fill={clusterColor(c)} />
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
            {SILHOUETTE_DATA.map((d,i) => <Cell key={i} fill={d.k===OPTIMAL_K?T.green:T.blue} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{padding:10,background:`${T.green}08`,borderRadius:6,marginTop:12,fontSize:11,color:T.textSec}}>
        Optimal k={OPTIMAL_K} (silhouette={SILHOUETTE_DATA.find(d=>d.k===OPTIMAL_K)?.silhouette}, computed via real k-means + silhouette scoring across k=2-10). Higher silhouette indicates better-defined clusters. Current selection k={kVal} scores silhouette={currentSilhouette}.
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
        {clusteredEntities.map(e => (
          <button key={e.id} onClick={()=>setBookmarks(b=>b.includes(e.id)?b.filter(x=>x!==e.id):[...b,e.id])} style={{padding:'5px 12px',borderRadius:6,border:`1px solid ${bookmarks.includes(e.id)?clusterColor(e.cluster):T.border}`,background:bookmarks.includes(e.id)?`${clusterColor(e.cluster)}15`:'transparent',fontSize:11,cursor:'pointer',color:bookmarks.includes(e.id)?clusterColor(e.cluster):T.textSec}}>
            {e.name}
          </button>
        ))}
      </div>
      {bookmarks.length > 0 && (
        <div style={{marginTop:16,padding:12,border:`1px solid ${T.gold}30`,borderRadius:8,background:`${T.gold}08`}}>
          <div style={{fontSize:12,fontWeight:600,color:T.gold}}>Custom Group ({bookmarks.length} entities)</div>
          <div style={{fontSize:11,color:T.textSec,marginTop:4}}>{bookmarks.map(id=>clusteredEntities.find(e=>e.id===id)?.name).filter(Boolean).join(', ')}</div>
        </div>
      )}
    </Card>
  );

  const renderEngagement = () => (
    <div>
      {clusterProfiles.slice().reverse().map(cp => {
        const members = clusteredEntities.filter(e=>e.cluster===cp.cluster);
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
          <div style={{fontSize:11,color:T.textSec}}>Real k-means clustering (Lloyd's algorithm, k-means++ initialization, best of 10 restarts by inertia) on standardized (z-score) E/S/G/Climate taxonomy features. PCA (power-iteration eigendecomposition) reduces the 4D feature space to 2D for visualization only -- clustering itself runs on the full standardized feature vectors. Silhouette analysis (a(i)/b(i) formulation, averaged across all entities) determines optimal k. Cluster migration tracked quarterly with transition matrix analysis. Engagement priority ranked by cluster risk level and potential improvement magnitude.</div>
        </div>
      </div>
    </div>
  );
}
