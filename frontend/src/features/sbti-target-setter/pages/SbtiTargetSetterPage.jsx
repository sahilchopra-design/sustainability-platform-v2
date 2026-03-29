// EP-AI1 — SBTi Target Setter
// Route: /sbti-target-setter
import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { SECTOR_BENCHMARKS } from '../../../data/referenceData';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

// ── Mock Data ──────────────────────────────────────────────────────────────

const COMPANIES = [
  { id:1, name:'Vertex Technologies', sector:'Technology', status:'Net-Zero Approved', committedDate:'2021-03-15', targetType:'Absolute Contraction', validationStatus:'Approved', nearTermS12:50, nearTermS3:30, longTermS12:90, longTermS3:67, scope1:420000, scope2:180000, scope3:2300000, baseYear:2019, tempScore:1.5 },
  { id:2, name:'Meridian Financial', sector:'Financial Services', status:'Approved', committedDate:'2021-07-22', targetType:'Temperature Rating', validationStatus:'Approved', nearTermS12:42, nearTermS3:25, longTermS12:90, longTermS3:67, scope1:85000, scope2:62000, scope3:4800000, baseYear:2020, tempScore:1.7 },
  { id:3, name:'Atlas Manufacturing', sector:'Manufacturing', status:'Approved', committedDate:'2020-11-10', targetType:'Sector Decarbonisation', validationStatus:'Approved', nearTermS12:46, nearTermS3:28, longTermS12:90, longTermS3:67, scope1:1850000, scope2:720000, scope3:3200000, baseYear:2018, tempScore:1.8 },
  { id:4, name:'Solaris Energy', sector:'Energy', status:'Approved', committedDate:'2022-01-05', targetType:'Sector Decarbonisation', validationStatus:'Approved', nearTermS12:55, nearTermS3:35, longTermS12:95, longTermS3:70, scope1:6200000, scope2:380000, scope3:8900000, baseYear:2019, tempScore:1.6 },
  { id:5, name:'Crestline Retail', sector:'Retail', status:'Target Set', committedDate:'2022-05-18', targetType:'Absolute Contraction', validationStatus:'Under Review', nearTermS12:40, nearTermS3:20, longTermS12:90, longTermS3:67, scope1:220000, scope2:310000, scope3:5600000, baseYear:2020, tempScore:2.1 },
  { id:6, name:'Pinnacle Pharma', sector:'Healthcare', status:'Approved', committedDate:'2021-09-30', targetType:'Absolute Contraction', validationStatus:'Approved', nearTermS12:50, nearTermS3:30, longTermS12:90, longTermS3:67, scope1:340000, scope2:210000, scope3:1900000, baseYear:2019, tempScore:1.7 },
  { id:7, name:'Horizon Logistics', sector:'Transportation', status:'Committed', committedDate:'2023-02-14', targetType:'Sector Decarbonisation', validationStatus:'Submitted', nearTermS12:30, nearTermS3:15, longTermS12:90, longTermS3:67, scope1:2800000, scope2:95000, scope3:1200000, baseYear:2021, tempScore:2.4 },
  { id:8, name:'GreenBuild Corp', sector:'Construction', status:'Net-Zero Approved', committedDate:'2020-06-01', targetType:'Absolute Contraction', validationStatus:'Approved', nearTermS12:50, nearTermS3:30, longTermS12:90, longTermS3:67, scope1:580000, scope2:290000, scope3:4100000, baseYear:2018, tempScore:1.5 },
  { id:9, name:'Pacific Chemicals', sector:'Chemicals', status:'Approved', committedDate:'2021-12-08', targetType:'Sector Decarbonisation', validationStatus:'Approved', nearTermS12:48, nearTermS3:28, longTermS12:90, longTermS3:67, scope1:3100000, scope2:850000, scope3:2700000, baseYear:2019, tempScore:1.9 },
  { id:10, name:'NovaTech Systems', sector:'Technology', status:'Net-Zero Approved', committedDate:'2021-04-22', targetType:'Absolute Contraction', validationStatus:'Approved', nearTermS12:50, nearTermS3:30, longTermS12:90, longTermS3:67, scope1:190000, scope2:140000, scope3:1100000, baseYear:2019, tempScore:1.5 },
  { id:11, name:'Apex Autos', sector:'Automotive', status:'Approved', committedDate:'2022-03-17', targetType:'Sector Decarbonisation', validationStatus:'Approved', nearTermS12:50, nearTermS3:30, longTermS12:90, longTermS3:67, scope1:920000, scope2:430000, scope3:12500000, baseYear:2020, tempScore:1.8 },
  { id:12, name:'Sterling Foods', sector:'Agriculture & Food', status:'Target Set', committedDate:'2022-09-11', targetType:'Sector Decarbonisation', validationStatus:'Under Review', nearTermS12:30, nearTermS3:20, longTermS12:90, longTermS3:67, scope1:480000, scope2:175000, scope3:6800000, baseYear:2020, tempScore:2.2 },
  { id:13, name:'Lumina Utilities', sector:'Utilities', status:'Approved', committedDate:'2021-06-30', targetType:'Sector Decarbonisation', validationStatus:'Approved', nearTermS12:65, nearTermS3:35, longTermS12:95, longTermS3:70, scope1:8900000, scope2:210000, scope3:1400000, baseYear:2019, tempScore:1.7 },
  { id:14, name:'ClearWater Beverage', sector:'Consumer Goods', status:'Net-Zero Approved', committedDate:'2020-10-15', targetType:'Absolute Contraction', validationStatus:'Approved', nearTermS12:50, nearTermS3:30, longTermS12:90, longTermS3:67, scope1:310000, scope2:195000, scope3:2900000, baseYear:2018, tempScore:1.5 },
  { id:15, name:'Ironside Steel', sector:'Steel', status:'Committed', committedDate:'2023-07-01', targetType:'Sector Decarbonisation', validationStatus:'Not Submitted', nearTermS12:35, nearTermS3:15, longTermS12:90, longTermS3:67, scope1:7200000, scope2:1100000, scope3:3500000, baseYear:2022, tempScore:2.8 },
  { id:16, name:'Quantum Computing Inc', sector:'Technology', status:'Net-Zero Approved', committedDate:'2022-02-28', targetType:'Absolute Contraction', validationStatus:'Approved', nearTermS12:50, nearTermS3:30, longTermS12:90, longTermS3:67, scope1:95000, scope2:78000, scope3:520000, baseYear:2020, tempScore:1.5 },
  { id:17, name:'Atlas Insurance Group', sector:'Financial Services', status:'Approved', committedDate:'2022-08-19', targetType:'Temperature Rating', validationStatus:'Approved', nearTermS12:42, nearTermS3:25, longTermS12:90, longTermS3:67, scope1:42000, scope2:38000, scope3:9200000, baseYear:2021, tempScore:1.9 },
  { id:18, name:'Coastal Shipping Co', sector:'Shipping', status:'Target Set', committedDate:'2023-01-20', targetType:'Sector Decarbonisation', validationStatus:'Under Review', nearTermS12:30, nearTermS3:10, longTermS12:90, longTermS3:67, scope1:4100000, scope2:85000, scope3:780000, baseYear:2021, tempScore:2.5 },
  { id:19, name:'BioGenic Agriculture', sector:'Agriculture & Food', status:'Committed', committedDate:'2023-09-05', targetType:'Sector Decarbonisation', validationStatus:'Not Submitted', nearTermS12:25, nearTermS3:15, longTermS12:90, longTermS3:67, scope1:1200000, scope2:220000, scope3:11000000, baseYear:2022, tempScore:2.9 },
  { id:20, name:'Nordic Chemicals', sector:'Chemicals', status:'Approved', committedDate:'2021-11-22', targetType:'Sector Decarbonisation', validationStatus:'Approved', nearTermS12:48, nearTermS3:28, longTermS12:90, longTermS3:67, scope1:2400000, scope2:680000, scope3:2100000, baseYear:2019, tempScore:1.8 },
];

const STATUS_COLOR = {
  'Net-Zero Approved': T.green,
  'Approved': T.sage,
  'Target Set': T.amber,
  'Committed': T.navyL,
};

const VALIDATION_COLOR = {
  'Approved': T.green,
  'Under Review': T.amber,
  'Submitted': T.navyL,
  'Not Submitted': T.textMut,
};

// Trajectory data for selected company (2020-2050)
const buildTrajectory = (co) => {
  const years = [];
  for (let y = 2020; y <= 2050; y++) years.push(y);
  const base = co.scope1 + co.scope2;
  const baseYr = co.baseYear;
  return years.map(yr => {
    const elapsed = yr - baseYr;
    const total = 2050 - baseYr;
    const sbtiPct = elapsed <= 0 ? 1 : Math.max(1 - (co.nearTermS12/100) * Math.min(elapsed/(2030-baseYr),1) - ((co.longTermS12/100 - co.nearTermS12/100) * Math.max(0,(elapsed-(2030-baseYr))/(2050-2030))), 0.1);
    const bauPct = elapsed <= 0 ? 1 : 1 + 0.02 * elapsed;
    const actualPct = yr <= 2025 ? Math.max(1 - (co.nearTermS12/100) * 0.6 * (elapsed/(2030-baseYr)), 0.5) : null;
    return {
      year: yr,
      sbtiPathway: Math.round(base * sbtiPct / 1000),
      bau: Math.round(base * bauPct / 1000),
      actual: actualPct !== null ? Math.round(base * actualPct / 1000) : null,
    };
  });
};

const SCOPE3_CATEGORIES = [
  { cat:'Cat 1 - Purchased Goods', value:4200, type:'Upstream' },
  { cat:'Cat 2 - Capital Goods', value:820, type:'Upstream' },
  { cat:'Cat 3 - Fuel & Energy', value:610, type:'Upstream' },
  { cat:'Cat 4 - Upstream Transport', value:1100, type:'Upstream' },
  { cat:'Cat 5 - Waste Operations', value:290, type:'Upstream' },
  { cat:'Cat 6 - Business Travel', value:480, type:'Upstream' },
  { cat:'Cat 7 - Employee Commute', value:310, type:'Upstream' },
  { cat:'Cat 8 - Upstream Leased', value:175, type:'Upstream' },
  { cat:'Cat 9 - Downstream Transport', value:920, type:'Downstream' },
  { cat:'Cat 10 - Processing of Sold', value:640, type:'Downstream' },
  { cat:'Cat 11 - Use of Sold Products', value:7800, type:'Downstream' },
  { cat:'Cat 12 - End-of-Life', value:580, type:'Downstream' },
  { cat:'Cat 13 - Downstream Leased', value:210, type:'Downstream' },
  { cat:'Cat 14 - Franchises', value:95, type:'Downstream' },
  { cat:'Cat 15 - Investments', value:3200, type:'Downstream' },
];

const SUPPLIER_PROGRAMS = [
  { company:'Vertex Technologies', suppliersEngaged:342, suppliersWithSBT:198, pctCoverage:82, program:'Supplier Climate Academy', status:'Active' },
  { company:'Atlas Manufacturing', suppliersEngaged:1240, suppliersWithSBT:520, pctCoverage:61, program:'Supply Chain Zero', status:'Active' },
  { company:'Apex Autos', suppliersEngaged:2800, suppliersWithSBT:890, pctCoverage:45, program:'EV Supply Chain', status:'Active' },
  { company:'Lumina Utilities', suppliersEngaged:180, suppliersWithSBT:92, pctCoverage:78, program:'Green Grid Partners', status:'Active' },
  { company:'Pacific Chemicals', suppliersEngaged:620, suppliersWithSBT:210, pctCoverage:52, program:'ChemNet Zero', status:'Launching' },
];

const METHODS = [
  { method:'Absolute Contraction Approach (ACA)', applicableSectors:'All sectors', nearTermReduction:'4.2% p.a. (1.5°C aligned)', longTermReduction:'90% by 2050', pros:'Sector agnostic; straightforward', cons:'May be too ambitious for hard-to-abate sectors', tempScore:'1.5°C', companiesUsing:8 },
  { method:'Sector Decarbonisation Approach (SDA)', applicableSectors:'Steel, Cement, Aluminium, Pulp & Paper, Chemicals, Aviation, Shipping, Buildings, Transport', nearTermReduction:'Sector-specific pathway', longTermReduction:'Sector-specific net-zero', pros:'Accounts for sector decarbonisation economics', cons:'Requires detailed sector data; complex calculation', tempScore:'1.7°C', companiesUsing:9 },
  { method:'Temperature Rating Method (TRM)', applicableSectors:'Financial Services (financed emissions)', nearTermReduction:'Portfolio alignment to <1.5°C', longTermReduction:'Net-zero portfolio by 2050', pros:'Captures financed emissions; TCFD aligned', cons:'Relies on counterparty target quality', tempScore:'1.9°C', companiesUsing:3 },
];

const VALIDATION_PIPELINE = [
  { stage:'Committed', count:4, color: T.navyL, desc:'Company has signed SBTi commitment letter; 24-month window to submit targets' },
  { stage:'Submitted', count:2, color: T.gold, desc:'Targets formally submitted to SBTi for technical review' },
  { stage:'Validation', count:1, color: T.amber, desc:'SBTi expert team conducting detailed assessment of target ambition and coverage' },
  { stage:'Approved', count:13, color: T.green, desc:'Targets validated and publicly listed on SBTi target dashboard' },
];

const REJECTION_REASONS = [
  { reason:'Insufficient Scope 3 coverage', freq:'34%', fix:'Expand to all material Scope 3 categories (>40% of total emissions)' },
  { reason:'Target base year too recent (post-peak)', freq:'22%', fix:'Use earliest available high-quality data year as base year' },
  { reason:'Near-term target period too short (<5 years)', freq:'18%', fix:'Ensure target extends to at least 5 years from submission date' },
  { reason:'ACA reduction rate below 4.2% p.a.', freq:'15%', fix:'Recalculate using SBTi Target Validation Tool (TVT)' },
  { reason:'Scope 2 market-based without location-based check', freq:'7%', fix:'Provide both market-based and location-based Scope 2 data' },
  { reason:'Other (data quality, documentation gaps)', freq:'4%', fix:'Use SBTi submission checklist; engage SBTi helpdesk' },
];

const CHECKLIST = [
  { item:'Signed Commitment Letter submitted to SBTi', required:true },
  { item:'Scope 1 & 2 emissions inventory (base year)', required:true },
  { item:'Scope 3 screening and materiality assessment', required:true },
  { item:'Near-term target (5–10 year) defined', required:true },
  { item:'Long-term net-zero target defined (by 2050)', required:true },
  { item:'Target covers ≥95% of Scope 1+2 emissions', required:true },
  { item:'Scope 3 target if Scope 3 >40% of total GHG', required:true },
  { item:'Target Validation Tool (TVT) completed', required:true },
  { item:'Third-party verification of emissions data', required:false },
  { item:'Interim milestone targets (2025, 2035, 2040)', required:false },
];

// ── Sub-components ─────────────────────────────────────────────────────────

const MetricCard = ({ label, value, sub, color }) => (
  <div style={{
    background: T.surface, borderRadius: 10, padding: '16px 20px',
    boxShadow: T.card, border: `1px solid ${T.border}`, flex: 1, minWidth: 160,
  }}>
    <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Badge = ({ text, color }) => (
  <span style={{
    display: 'inline-block', padding: '2px 8px', borderRadius: 12,
    fontSize: 11, fontWeight: 600, color: '#fff',
    background: color || T.navy,
  }}>{text}</span>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, paddingBottom: 6, borderBottom: `2px solid ${T.gold}` }}>
    {children}
  </div>
);

// ── Tab 1: Target Overview ─────────────────────────────────────────────────

const TargetOverview = () => {
  const [search, setSearch] = useState('');
  const [filterSector, setFilterSector] = useState('All');
  const sectors = ['All', ...Array.from(new Set(COMPANIES.map(c => c.sector))).sort()];
  const filtered = COMPANIES.filter(c =>
    (filterSector === 'All' || c.sector === filterSector) &&
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search company..."
          style={{ padding:'7px 12px', borderRadius:7, border:`1px solid ${T.border}`, fontSize:13, color:T.text, outline:'none', width:200 }}
        />
        <select value={filterSector} onChange={e => setFilterSector(e.target.value)}
          style={{ padding:'7px 12px', borderRadius:7, border:`1px solid ${T.border}`, fontSize:13, color:T.text, background:T.surface }}>
          {sectors.map(s => <option key={s}>{s}</option>)}
        </select>
        <span style={{ fontSize:12, color:T.textMut, marginLeft:'auto' }}>{filtered.length} companies</span>
      </div>

      {/* Table */}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:T.surfaceH }}>
              {['Company','Sector','Status','Committed','Method','Near-Term S1+2','Near-Term S3','Long-Term S1+2','Temp Score'].map(h => (
                <th key={h} style={{ padding:'9px 10px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.id} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                <td style={{ padding:'8px 10px', fontWeight:600, color:T.navy, whiteSpace:'nowrap' }}>{c.name}</td>
                <td style={{ padding:'8px 10px', color:T.textSec }}>{c.sector}</td>
                <td style={{ padding:'8px 10px' }}><Badge text={c.status} color={STATUS_COLOR[c.status]} /></td>
                <td style={{ padding:'8px 10px', color:T.textSec }}>{c.committedDate}</td>
                <td style={{ padding:'8px 10px', color:T.textSec, maxWidth:140 }}>{c.targetType}</td>
                <td style={{ padding:'8px 10px', color:T.green, fontWeight:700 }}>-{c.nearTermS12}%</td>
                <td style={{ padding:'8px 10px', color:T.sage, fontWeight:700 }}>-{c.nearTermS3}%</td>
                <td style={{ padding:'8px 10px', color:T.navy, fontWeight:700 }}>-{c.longTermS12}%</td>
                <td style={{ padding:'8px 10px' }}>
                  <span style={{ color: c.tempScore <= 1.7 ? T.green : c.tempScore <= 2.0 ? T.amber : T.red, fontWeight:700 }}>
                    {c.tempScore.toFixed(1)}°C
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Scope Emissions Summary */}
      <div style={{ marginTop:20 }}>
        <SectionTitle>Portfolio Emissions Snapshot (Base Year)</SectionTitle>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {['Scope 1','Scope 2','Scope 3'].map((sc, si) => {
            const keys = ['scope1','scope2','scope3'];
            const total = COMPANIES.reduce((s,c) => s + c[keys[si]], 0);
            const colors = [T.red, T.amber, T.navyL];
            return (
              <div key={sc} style={{ flex:1, minWidth:140, background:T.surface, borderRadius:8, padding:'12px 16px', border:`1px solid ${T.border}`, boxShadow:T.card }}>
                <div style={{ fontSize:11, color:T.textMut, textTransform:'uppercase', letterSpacing:'0.05em' }}>{sc}</div>
                <div style={{ fontSize:22, fontWeight:700, color:colors[si], marginTop:2 }}>{(total/1000000).toFixed(1)} Mt</div>
                <div style={{ fontSize:11, color:T.textSec }}>tCO2e (portfolio total)</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Tab 2: Emission Trajectories ───────────────────────────────────────────

const EmissionTrajectories = () => {
  const [selectedId, setSelectedId] = useState(1);
  const co = COMPANIES.find(c => c.id === selectedId);
  const data = buildTrajectory(co);

  return (
    <div>
      <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16, flexWrap:'wrap' }}>
        <label style={{ fontSize:13, color:T.textSec, fontWeight:600 }}>Select Company:</label>
        <select value={selectedId} onChange={e => setSelectedId(Number(e.target.value))}
          style={{ padding:'7px 12px', borderRadius:7, border:`1px solid ${T.border}`, fontSize:13, color:T.text, background:T.surface }}>
          {COMPANIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <Badge text={co.status} color={STATUS_COLOR[co.status]} />
        <span style={{ fontSize:12, color:T.textMut }}>{co.sector} | {co.targetType}</span>
      </div>

      {/* Company KPIs */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20 }}>
        <MetricCard label="Base Year" value={co.baseYear} sub="Emissions reference year" />
        <MetricCard label="Scope 1+2 Base" value={((co.scope1+co.scope2)/1000).toFixed(0)+' kt'} sub="tCO2e (000s)" color={T.red} />
        <MetricCard label="Near-Term Target" value={'-'+co.nearTermS12+'%'} sub="Scope 1+2 by 2030" color={T.amber} />
        <MetricCard label="Net-Zero Target" value={'-'+co.longTermS12+'%'} sub="Scope 1+2 by 2050" color={T.green} />
        <MetricCard label="Temp Score" value={co.tempScore.toFixed(1)+'°C'} sub="ACA aligned" color={co.tempScore<=1.7?T.green:co.tempScore<=2.0?T.amber:T.red} />
      </div>

      <SectionTitle>Emission Trajectory 2020–2050 (ktCO2e, Scope 1+2)</SectionTitle>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top:10, right:20, left:10, bottom:10 }}>
          <defs>
            <linearGradient id="gradBAU" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={T.red} stopOpacity={0.15}/>
              <stop offset="95%" stopColor={T.red} stopOpacity={0.02}/>
            </linearGradient>
            <linearGradient id="gradSBTi" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={T.sage} stopOpacity={0.25}/>
              <stop offset="95%" stopColor={T.sage} stopOpacity={0.03}/>
            </linearGradient>
            <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={T.navy} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={T.navy} stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="year" tick={{ fontSize:11, fill:T.textSec }} tickLine={false} interval={4} />
          <YAxis tick={{ fontSize:11, fill:T.textSec }} tickLine={false} axisLine={false} unit=" kt" />
          <Tooltip
            contentStyle={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, fontSize:12 }}
            formatter={(v, name) => [v ? v.toLocaleString()+' kt' : 'N/A', name]}
          />
          <Legend wrapperStyle={{ fontSize:12 }} />
          <Area type="monotone" dataKey="bau" name="BAU Scenario" stroke={T.red} strokeWidth={2} strokeDasharray="5 3" fill="url(#gradBAU)" dot={false} />
          <Area type="monotone" dataKey="sbtiPathway" name="SBTi Pathway" stroke={T.sage} strokeWidth={2.5} fill="url(#gradSBTi)" dot={false} />
          <Area type="monotone" dataKey="actual" name="Actual Emissions" stroke={T.navy} strokeWidth={2.5} fill="url(#gradActual)" dot={{ r:3, fill:T.navy }} connectNulls={false} />
        </AreaChart>
      </ResponsiveContainer>

      <div style={{ display:'flex', gap:16, marginTop:16, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:200, background:T.surfaceH, borderRadius:8, padding:'12px 14px', border:`1px solid ${T.border}` }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:6 }}>2030 Milestone</div>
          <div style={{ fontSize:11, color:T.textSec }}>Required: reduce S1+2 by <strong>{co.nearTermS12}%</strong> vs base year {co.baseYear}</div>
          <div style={{ fontSize:11, color:T.textSec, marginTop:4 }}>Required pathway: ~4.2% p.a. linear reduction</div>
        </div>
        <div style={{ flex:1, minWidth:200, background:T.surfaceH, borderRadius:8, padding:'12px 14px', border:`1px solid ${T.border}` }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:6 }}>2050 Net-Zero Target</div>
          <div style={{ fontSize:11, color:T.textSec }}>Required: reduce S1+2 by <strong>{co.longTermS12}%</strong>, S3 by <strong>{co.longTermS3}%</strong></div>
          <div style={{ fontSize:11, color:T.textSec, marginTop:4 }}>Residual emissions to be neutralised via removals</div>
        </div>
      </div>
    </div>
  );
};

// ── Tab 3: Method Selector ─────────────────────────────────────────────────

const MethodSelector = () => {
  const [selected, setSelected] = useState(0);

  return (
    <div>
      <SectionTitle>SBTi Validation Method Comparison</SectionTitle>
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        {METHODS.map((m, i) => (
          <div key={i} onClick={() => setSelected(i)} style={{
            flex:1, minWidth:200, padding:'14px 16px', borderRadius:10,
            background: selected===i ? T.navy : T.surface,
            color: selected===i ? '#fff' : T.text,
            border: `2px solid ${selected===i ? T.navy : T.border}`,
            cursor:'pointer', boxShadow: selected===i ? T.cardH : T.card,
            transition:'all 0.15s',
          }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>{m.method.split('(')[0].trim()}</div>
            <div style={{ fontSize:11, opacity:0.75 }}>{m.companiesUsing} companies | {m.tempScore} aligned</div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      <div style={{ background:T.surface, borderRadius:10, padding:20, border:`1px solid ${T.border}`, boxShadow:T.card, marginBottom:20 }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:16 }}>
          <MetricCard label="Temp Score" value={METHODS[selected].tempScore} sub="Portfolio alignment" color={T.green} />
          <MetricCard label="Companies" value={METHODS[selected].companiesUsing} sub="Using this method" color={T.navyL} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:14 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:6 }}>Applicable Sectors</div>
            <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>{METHODS[selected].applicableSectors}</div>
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:6 }}>Near-Term Reduction</div>
            <div style={{ fontSize:12, color:T.textSec }}>{METHODS[selected].nearTermReduction}</div>
            <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:4, marginTop:10 }}>Long-Term Reduction</div>
            <div style={{ fontSize:12, color:T.textSec }}>{METHODS[selected].longTermReduction}</div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div style={{ background:'#f0fdf4', borderRadius:8, padding:'10px 14px', border:`1px solid ${T.sage}33` }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.sage, marginBottom:4 }}>ADVANTAGES</div>
            <div style={{ fontSize:12, color:T.textSec }}>{METHODS[selected].pros}</div>
          </div>
          <div style={{ background:'#fff7ed', borderRadius:8, padding:'10px 14px', border:`1px solid ${T.amber}33` }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.amber, marginBottom:4 }}>CONSIDERATIONS</div>
            <div style={{ fontSize:12, color:T.textSec }}>{METHODS[selected].cons}</div>
          </div>
        </div>
      </div>

      {/* All methods table */}
      <SectionTitle>Method Summary Table</SectionTitle>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
        <thead>
          <tr style={{ background:T.surfaceH }}>
            {['Method','Applicable Sectors','Near-Term Rate','Temp Alignment','Companies Using'].map(h => (
              <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {METHODS.map((m, i) => (
            <tr key={i} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
              <td style={{ padding:'8px 10px', fontWeight:600, color:T.navy }}>{m.method}</td>
              <td style={{ padding:'8px 10px', color:T.textSec, maxWidth:180 }}>{m.applicableSectors.length>50?m.applicableSectors.slice(0,50)+'...':m.applicableSectors}</td>
              <td style={{ padding:'8px 10px', color:T.textSec }}>{m.nearTermReduction}</td>
              <td style={{ padding:'8px 10px' }}>
                <span style={{ color: parseFloat(m.tempScore)<=1.7?T.green:parseFloat(m.tempScore)<=2.0?T.amber:T.red, fontWeight:700 }}>{m.tempScore}</span>
              </td>
              <td style={{ padding:'8px 10px', color:T.navy, fontWeight:600 }}>{m.companiesUsing}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Tab 4: Scope 3 Engagement ──────────────────────────────────────────────

const Scope3Engagement = () => {
  const totalS3 = SCOPE3_CATEGORIES.reduce((s,c) => s+c.value, 0);

  return (
    <div>
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <MetricCard label="Total Scope 3 (portfolio)" value="87.1 Mt" sub="tCO2e across 20 companies" color={T.navyL} />
        <MetricCard label="Upstream Scope 3" value="34%" sub="Categories 1-8 share" color={T.amber} />
        <MetricCard label="Downstream Scope 3" value="66%" sub="Categories 9-15 share" color={T.navy} />
        <MetricCard label="SBT Coverage" value="67%" sub="Portfolio emissions with S3 targets" color={T.green} />
      </div>

      <SectionTitle>Scope 3 Category Breakdown (ktCO2e — Portfolio Average)</SectionTitle>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={SCOPE3_CATEGORIES} layout="vertical" margin={{ top:5, right:20, left:10, bottom:5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
          <XAxis type="number" tick={{ fontSize:10, fill:T.textSec }} tickLine={false} unit=" kt" />
          <YAxis type="category" dataKey="cat" tick={{ fontSize:10, fill:T.textSec }} tickLine={false} width={180} />
          <Tooltip
            contentStyle={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, fontSize:12 }}
            formatter={(v) => [v.toLocaleString()+' kt', 'Emissions']}
          />
          <Bar dataKey="value" name="Emissions (kt)" radius={[0,4,4,0]}>
            {SCOPE3_CATEGORIES.map((entry, i) => (
              <Cell key={i} fill={entry.type === 'Upstream' ? T.amber : T.navyL} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div style={{ display:'flex', gap:8, margin:'8px 0 20px', fontSize:11 }}>
        <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:12, height:12, background:T.amber, borderRadius:2, display:'inline-block' }}></span> Upstream (Cat 1-8)</span>
        <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:12, height:12, background:T.navyL, borderRadius:2, display:'inline-block' }}></span> Downstream (Cat 9-15)</span>
      </div>

      <SectionTitle>Supplier Engagement Programs</SectionTitle>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
        <thead>
          <tr style={{ background:T.surfaceH }}>
            {['Company','Program Name','Suppliers Engaged','Suppliers with SBT','Coverage %','Status'].map(h => (
              <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SUPPLIER_PROGRAMS.map((p, i) => (
            <tr key={i} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
              <td style={{ padding:'8px 10px', fontWeight:600, color:T.navy }}>{p.company}</td>
              <td style={{ padding:'8px 10px', color:T.textSec }}>{p.program}</td>
              <td style={{ padding:'8px 10px', color:T.textSec }}>{p.suppliersEngaged.toLocaleString()}</td>
              <td style={{ padding:'8px 10px', color:T.green, fontWeight:600 }}>{p.suppliersWithSBT.toLocaleString()}</td>
              <td style={{ padding:'8px 10px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ flex:1, background:T.surfaceH, borderRadius:4, height:6 }}>
                    <div style={{ width:`${p.pctCoverage}%`, background: p.pctCoverage>=70?T.green:p.pctCoverage>=50?T.amber:T.red, height:6, borderRadius:4 }}/>
                  </div>
                  <span style={{ fontWeight:700, color:T.navy, minWidth:30 }}>{p.pctCoverage}%</span>
                </div>
              </td>
              <td style={{ padding:'8px 10px' }}><Badge text={p.status} color={p.status==='Active'?T.green:T.amber}/></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop:20, background:T.surfaceH, borderRadius:10, padding:'14px 16px', border:`1px solid ${T.border}` }}>
        <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:8 }}>Scope 3 Coverage Requirement</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.7 }}>
          Under SBTi Corporate Net-Zero Standard, companies whose Scope 3 emissions exceed 40% of total GHG emissions
          must set a Scope 3 target. Of the 20 portfolio companies, <strong>18 exceed this threshold</strong>.
          Coverage must include categories representing at least <strong>two-thirds of total Scope 3 emissions</strong>.
          Cat 1 (Purchased Goods) and Cat 11 (Use of Sold Products) typically dominate at 45%+ of total Scope 3.
        </div>
      </div>
    </div>
  );
};

// ── Tab 5: Validation Tracker ──────────────────────────────────────────────

const ValidationTracker = () => {
  const [checkedItems, setCheckedItems] = useState({});

  const toggleCheck = (i) => setCheckedItems(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <div>
      {/* Pipeline */}
      <SectionTitle>SBTi Validation Pipeline (20 Portfolio Companies)</SectionTitle>
      <div style={{ display:'flex', gap:0, marginBottom:20, position:'relative' }}>
        {VALIDATION_PIPELINE.map((stage, i) => (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', position:'relative' }}>
            {/* Connector line */}
            {i < VALIDATION_PIPELINE.length - 1 && (
              <div style={{ position:'absolute', top:30, left:'50%', width:'100%', height:2, background:T.border, zIndex:0 }}/>
            )}
            {/* Circle */}
            <div style={{
              width:60, height:60, borderRadius:'50%', background:stage.color,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:20, fontWeight:800, color:'#fff', zIndex:1,
              boxShadow:`0 4px 12px ${stage.color}66`,
            }}>{stage.count}</div>
            <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginTop:8, textAlign:'center' }}>{stage.stage}</div>
            <div style={{ fontSize:10, color:T.textMut, textAlign:'center', maxWidth:120, marginTop:4, lineHeight:1.5 }}>{stage.desc.slice(0,60)}...</div>
          </div>
        ))}
      </div>

      {/* Pipeline detail cards */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:24 }}>
        {VALIDATION_PIPELINE.map((stage, i) => (
          <div key={i} style={{ flex:1, minWidth:180, background:T.surface, borderRadius:8, padding:'12px 14px', border:`2px solid ${stage.color}44`, boxShadow:T.card }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <span style={{ fontSize:13, fontWeight:700, color:stage.color }}>{stage.stage}</span>
              <span style={{ fontSize:20, fontWeight:800, color:stage.color }}>{stage.count}</span>
            </div>
            <div style={{ fontSize:11, color:T.textSec, lineHeight:1.5 }}>{stage.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Checklist */}
        <div>
          <SectionTitle>SBTi Submission Checklist</SectionTitle>
          <div style={{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, overflow:'hidden' }}>
            {CHECKLIST.map((item, i) => (
              <div key={i} onClick={() => toggleCheck(i)} style={{
                display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px',
                borderBottom: i<CHECKLIST.length-1 ? `1px solid ${T.border}` : 'none',
                cursor:'pointer', background: checkedItems[i] ? '#f0fdf4' : i%2===0 ? T.surface : T.surfaceH,
                transition:'background 0.1s',
              }}>
                <div style={{
                  width:18, height:18, borderRadius:4, border:`2px solid ${checkedItems[i]?T.green:T.border}`,
                  background: checkedItems[i]?T.green:'transparent', flexShrink:0, marginTop:1,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {checkedItems[i] && <span style={{ color:'#fff', fontSize:11, fontWeight:700 }}>✓</span>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color: checkedItems[i] ? T.sage : T.text, textDecoration: checkedItems[i]?'line-through':'none' }}>{item.item}</div>
                  <div style={{ fontSize:10, color:T.textMut, marginTop:2 }}>{item.required ? 'Required' : 'Recommended'}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:11, color:T.textMut, marginTop:8 }}>
            {Object.values(checkedItems).filter(Boolean).length}/{CHECKLIST.length} items completed
          </div>
        </div>

        {/* Common Rejection Reasons */}
        <div>
          <SectionTitle>Common Rejection Reasons</SectionTitle>
          <div style={{ background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, overflow:'hidden' }}>
            {REJECTION_REASONS.map((r, i) => (
              <div key={i} style={{
                padding:'11px 14px', borderBottom: i<REJECTION_REASONS.length-1 ? `1px solid ${T.border}` : 'none',
                background: i%2===0 ? T.surface : T.surfaceH,
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:T.navy }}>{r.reason}</div>
                  <span style={{ fontSize:12, fontWeight:700, color:T.red }}>{r.freq}</span>
                </div>
                <div style={{ fontSize:11, color:T.textSec, lineHeight:1.5 }}><strong>Fix: </strong>{r.fix}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop:16, background:'#fff7ed', borderRadius:8, padding:'12px 14px', border:`1px solid ${T.amber}44` }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.amber, marginBottom:6 }}>Typical Timeline</div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {[
                ['Commitment to Submission', '~12–18 months'],
                ['SBTi Review Period', '4–6 months'],
                ['Approval to Publication', '2–4 weeks'],
                ['Total: Commitment to Approved', '18–24 months'],
              ].map(([k,v],i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                  <span style={{ color:T.textSec }}>{k}</span>
                  <span style={{ fontWeight:600, color:T.navy }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────

const TABS = [
  { id:'overview', label:'Target Overview' },
  { id:'trajectories', label:'Emission Trajectories' },
  { id:'methods', label:'Method Selector' },
  { id:'scope3', label:'Scope 3 Engagement' },
  { id:'validation', label:'Validation Tracker' },
];

export default function SbtiTargetSetterPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight:'100vh', padding:'24px 28px' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:8 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:T.navy, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:22 }}>🎯</span>
          </div>
          <div>
            <div style={{ fontSize:11, color:T.textMut, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>EP-AI1 · Science-Based Targets Initiative</div>
            <h1 style={{ fontSize:24, fontWeight:800, color:T.navy, margin:0, letterSpacing:'-0.02em' }}>SBTi Target Setter</h1>
          </div>
        </div>
        <div style={{ fontSize:13, color:T.textSec, maxWidth:700 }}>
          Corporate climate target setting aligned to the Science-Based Targets initiative. Track commitment status, emission trajectories, validation progress, and Scope 3 engagement programmes across the portfolio.
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:24 }}>
        <MetricCard label="Approved SBTi Targets" value="14/20" sub="Companies with validated targets" color={T.green} />
        <MetricCard label="Portfolio Temp Score" value="1.8°C" sub="ACA method (weighted)" color={T.sage} />
        <MetricCard label="Covered Scope 1+2" value="48.2 Mt" sub="tCO2e across portfolio" color={T.navy} />
        <MetricCard label="Scope 3 SBT Coverage" value="67%" sub="Of portfolio emissions" color={T.navyL} />
        <MetricCard label="Net-Zero Commitments" value="8" sub="Companies with NZ targets" color={T.gold} />
      </div>

      {/* Tab Bar */}
      <div style={{ display:'flex', gap:4, marginBottom:20, background:T.surface, borderRadius:10, padding:4, border:`1px solid ${T.border}`, overflowX:'auto' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex:'none', padding:'8px 18px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
            background: activeTab===tab.id ? T.navy : 'transparent',
            color: activeTab===tab.id ? '#fff' : T.textSec,
            transition:'all 0.15s',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ background:T.surface, borderRadius:12, padding:24, border:`1px solid ${T.border}`, boxShadow:T.card }}>
        {activeTab === 'overview' && <TargetOverview />}
        {activeTab === 'trajectories' && <EmissionTrajectories />}
        {activeTab === 'methods' && <MethodSelector />}
        {activeTab === 'scope3' && <Scope3Engagement />}
        {activeTab === 'validation' && <ValidationTracker />}
      </div>

      {/* Footer */}
      <div style={{ marginTop:16, fontSize:11, color:T.textMut, textAlign:'center' }}>
        EP-AI1 · SBTi Target Setter · Data as of Q1 2026 · Science-Based Targets initiative (SBTi) Corporate Net-Zero Standard v1.1
      </div>
    </div>
  );
}
