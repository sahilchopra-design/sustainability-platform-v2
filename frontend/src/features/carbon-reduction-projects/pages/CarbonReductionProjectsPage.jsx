import React, { useState, useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell, LineChart, Line, ReferenceLine, ComposedChart, Area,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

const CATEGORIES = ['Energy Efficiency','Renewable Energy','Process Innovation','Supply Chain','Logistics','Behaviour Change'];
const STATUSES = ['Concept','Feasibility','Approved','In Progress','Complete'];

const CAT_COLORS = {
  'Energy Efficiency': '#2c5a8c',
  'Renewable Energy': '#16a34a',
  'Process Innovation': '#7c3aed',
  'Supply Chain': '#c5a96a',
  'Logistics': '#d97706',
  'Behaviour Change': '#5a8a6a',
};

const STATUS_COLORS = {
  'Concept': '#9aa3ae',
  'Feasibility': '#d97706',
  'Approved': '#2c5a8c',
  'In Progress': '#16a34a',
  'Complete': '#1b3a5c',
};

const PROJECTS = [
  { id:1, name:'LED Lighting Retrofit — Global HQ', category:'Energy Efficiency', site:'London, UK', status:'Complete', capex:2.4, co2e:8.2, irr:28.5, payback:3.1, completion:'2024-Q2', owner:'J. Patel', npv75:4.1, abatement:29, startM:0, dur:6, energySav:1.2, waterSav:0, wasteSav:0 },
  { id:2, name:'HVAC Optimisation — Manufacturing Campus', category:'Energy Efficiency', site:'Stuttgart, DE', status:'Complete', capex:5.8, co2e:22.4, irr:24.1, payback:3.8, completion:'2024-Q3', owner:'A. Müller', npv75:9.8, abatement:26, startM:2, dur:8, energySav:2.8, waterSav:0.4, wasteSav:0 },
  { id:3, name:'Building Management System Upgrade', category:'Energy Efficiency', site:'Singapore', status:'In Progress', capex:3.2, co2e:14.6, irr:22.8, payback:4.1, completion:'2025-Q1', owner:'L. Tan', npv75:6.1, abatement:22, startM:8, dur:10, energySav:1.8, waterSav:0, wasteSav:0 },
  { id:4, name:'Industrial Heat Recovery Network', category:'Energy Efficiency', site:'Rotterdam, NL', status:'In Progress', capex:18.5, co2e:58.3, irr:19.4, payback:5.2, completion:'2025-Q3', owner:'M. de Vries', npv75:28.7, abatement:32, startM:6, dur:18, energySav:7.2, waterSav:0, wasteSav:0 },
  { id:5, name:'Data Centre Power Usage Efficiency', category:'Energy Efficiency', site:'Dublin, IE', status:'Approved', capex:12.1, co2e:41.7, irr:21.3, payback:4.6, completion:'2025-Q4', owner:'C. O\'Brien', npv75:18.9, abatement:29, startM:12, dur:14, energySav:5.1, waterSav:0, wasteSav:0 },
  { id:6, name:'Smart Metering & Energy Analytics', category:'Energy Efficiency', site:'Global', status:'Feasibility', capex:8.4, co2e:31.2, irr:18.7, payback:5.4, completion:'2026-Q2', owner:'R. Singh', npv75:12.6, abatement:27, startM:16, dur:12, energySav:3.9, waterSav:0, wasteSav:0 },
  { id:7, name:'Rooftop Solar PV — 12 Sites', category:'Renewable Energy', site:'Multi-site UK', status:'Complete', capex:24.6, co2e:67.8, irr:16.2, payback:6.8, completion:'2024-Q4', owner:'S. Williams', npv75:31.4, abatement:36, startM:1, dur:12, energySav:8.4, waterSav:0, wasteSav:0 },
  { id:8, name:'Offshore Wind Power Purchase Agreement', category:'Renewable Energy', site:'North Sea', status:'In Progress', capex:0.8, co2e:112.4, irr:14.8, payback:7.2, completion:'2025-Q2', owner:'T. Eriksson', npv75:62.1, abatement:7, startM:4, dur:16, energySav:13.9, waterSav:0, wasteSav:0 },
  { id:9, name:'On-site Wind Turbines — Industrial Park', category:'Renewable Energy', site:'Texas, US', status:'Approved', capex:41.2, co2e:89.6, irr:15.6, payback:7.8, completion:'2026-Q1', owner:'D. Rodriguez', npv75:38.2, abatement:46, startM:14, dur:20, energySav:11.1, waterSav:0, wasteSav:0 },
  { id:10, name:'Green Hydrogen Pilot Plant', category:'Renewable Energy', site:'Hamburg, DE', status:'Feasibility', capex:86.4, co2e:42.1, irr:11.2, payback:9.6, completion:'2028-Q2', owner:'K. Braun', npv75:8.4, abatement:205, startM:30, dur:36, energySav:5.2, waterSav:0, wasteSav:0 },
  { id:11, name:'Biomass Boiler Conversion', category:'Renewable Energy', site:'Lyon, FR', status:'Concept', capex:14.8, co2e:28.4, irr:13.4, payback:8.2, completion:'2027-Q1', owner:'P. Dubois', npv75:6.8, abatement:52, startM:24, dur:18, energySav:3.5, waterSav:0, wasteSav:0 },
  { id:12, name:'Electrolytic Process Decarbonisation', category:'Process Innovation', site:'Antwerp, BE', status:'In Progress', capex:124.6, co2e:148.2, irr:12.8, payback:8.9, completion:'2026-Q3', owner:'B. Janssen', npv75:42.6, abatement:84, startM:8, dur:28, energySav:18.4, waterSav:2.1, wasteSav:840 },
  { id:13, name:'Low-Carbon Cement Formulation', category:'Process Innovation', site:'Monterrey, MX', status:'Feasibility', capex:67.3, co2e:84.6, irr:14.1, payback:8.2, completion:'2027-Q2', owner:'C. Flores', npv75:22.4, abatement:80, startM:20, dur:24, energySav:10.4, waterSav:1.8, wasteSav:620 },
  { id:14, name:'Circular Economy Remanufacturing Hub', category:'Process Innovation', site:'Warsaw, PL', status:'Approved', capex:38.2, co2e:52.8, irr:16.4, payback:6.9, completion:'2026-Q4', owner:'M. Kowalski', npv75:18.6, abatement:72, startM:18, dur:22, energySav:6.4, waterSav:0.8, wasteSav:1240 },
  { id:15, name:'Carbon Capture on Kiln Exhaust', category:'Process Innovation', site:'Gdansk, PL', status:'Concept', capex:212.4, co2e:186.4, irr:9.2, payback:12.4, completion:'2030-Q1', owner:'A. Wiśniewski', npv75:-18.4, abatement:114, startM:48, dur:36, energySav:0, waterSav:0, wasteSav:0 },
  { id:16, name:'Supplier Renewable Energy Programme', category:'Supply Chain', site:'Global', status:'In Progress', capex:4.2, co2e:62.4, irr:32.6, payback:2.8, completion:'2025-Q4', owner:'J. Zhang', npv75:41.8, abatement:7, startM:6, dur:18, energySav:7.7, waterSav:0, wasteSav:0 },
  { id:17, name:'Sustainable Sourcing — Tier 1 Metals', category:'Supply Chain', site:'Multi-region', status:'In Progress', capex:6.8, co2e:44.8, irr:28.4, payback:3.4, completion:'2025-Q2', owner:'A. Okonkwo', npv75:28.6, abatement:15, startM:4, dur:14, energySav:5.5, waterSav:0, wasteSav:0 },
  { id:18, name:'Packaging Elimination Initiative', category:'Supply Chain', site:'Global', status:'Approved', capex:3.6, co2e:18.4, irr:34.2, payback:2.6, completion:'2025-Q3', owner:'L. Chen', npv75:13.4, abatement:20, startM:10, dur:10, energySav:2.3, waterSav:0, wasteSav:2400 },
  { id:19, name:'Deforestation-Free Supply Chain Audit', category:'Supply Chain', site:'SE Asia', status:'Feasibility', capex:2.1, co2e:31.6, irr:41.8, payback:2.1, completion:'2026-Q1', owner:'R. Pratama', npv75:22.4, abatement:7, startM:14, dur:8, energySav:0, waterSav:4.2, wasteSav:0 },
  { id:20, name:'Fleet Electrification — Last Mile', category:'Logistics', site:'UK & EU', status:'In Progress', capex:28.4, co2e:38.6, irr:18.2, payback:5.6, completion:'2026-Q2', owner:'G. Smith', npv75:14.2, abatement:74, startM:10, dur:20, energySav:4.8, waterSav:0, wasteSav:0 },
  { id:21, name:'Rail Modal Shift Programme', category:'Logistics', site:'Europe', status:'Approved', capex:8.6, co2e:28.2, irr:22.4, payback:4.4, completion:'2026-Q1', owner:'H. Leclerc', npv75:12.8, abatement:30, startM:14, dur:14, energySav:3.5, waterSav:0, wasteSav:0 },
  { id:22, name:'Logistics Network Optimisation', category:'Logistics', site:'Global', status:'Feasibility', capex:4.8, co2e:22.4, irr:26.8, payback:3.6, completion:'2026-Q3', owner:'W. Osei', npv75:13.6, abatement:21, startM:18, dur:12, energySav:2.8, waterSav:0, wasteSav:0 },
  { id:23, name:'Business Travel Carbon Budget Programme', category:'Behaviour Change', site:'Global', status:'Complete', capex:1.2, co2e:12.4, irr:64.2, payback:1.4, completion:'2024-Q3', owner:'S. Patel', npv75:8.6, abatement:10, startM:0, dur:6, energySav:0, waterSav:0, wasteSav:0 },
  { id:24, name:'Employee Commute EV Incentive Scheme', category:'Behaviour Change', site:'Global', status:'Concept', capex:3.4, co2e:9.2, irr:22.1, payback:4.2, completion:'2027-Q1', owner:'N. Ahmed', npv75:4.2, abatement:37, startM:24, dur:12, energySav:1.1, waterSav:0, wasteSav:0 },
];

const CUMULATIVE_DATA = [
  { year:2024, cumCo2e:88,  sbti:false },
  { year:2025, cumCo2e:248, sbti:true  },
  { year:2026, cumCo2e:468, sbti:false },
  { year:2027, cumCo2e:612, sbti:false },
  { year:2028, cumCo2e:714, sbti:true  },
  { year:2029, cumCo2e:782, sbti:false },
  { year:2030, cumCo2e:827, sbti:true  },
  { year:2031, cumCo2e:841, sbti:false },
  { year:2032, cumCo2e:847, sbti:false },
];

const COBENEFIT_CAT = CATEGORIES.map(cat => {
  const projs = PROJECTS.filter(p => p.category === cat);
  return {
    category: cat,
    energySav: +projs.reduce((a,p) => a + p.energySav, 0).toFixed(1),
    waterSav:  +projs.reduce((a,p) => a + p.waterSav, 0).toFixed(1),
    wasteSav:  +projs.reduce((a,p) => a + p.wasteSav, 0).toFixed(0),
  };
});

const NPV_DATA = [
  { price:'$75/t',  npvTotal: PROJECTS.reduce((a,p) => a + p.npv75, 0).toFixed(1) },
  { price:'$100/t', npvTotal: (PROJECTS.reduce((a,p) => a + p.npv75, 0) * 1.31).toFixed(1) },
  { price:'$150/t', npvTotal: (PROJECTS.reduce((a,p) => a + p.npv75, 0) * 1.68).toFixed(1) },
];

const SCATTER_DATA = PROJECTS.map(p => ({
  x: p.abatement,
  y: p.co2e,
  z: p.capex * 3,
  name: p.name,
  category: p.category,
  capex: p.capex,
  irr: p.irr,
}));

const GANTT_DATA = PROJECTS.slice(0,16).map(p => ({
  name: p.name.length > 32 ? p.name.slice(0,30)+'…' : p.name,
  start: p.startM,
  duration: p.dur,
  status: p.status,
  category: p.category,
}));

// ── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: T.surface, borderRadius:10, padding:'16px 20px',
      boxShadow: T.card, border:`1px solid ${T.border}`, flex:1, minWidth:160,
    }}>
      <div style={{ fontSize:11, color:T.textMut, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:700, color: accent || T.navy, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:T.textSec, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

// ── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || T.textMut;
  return (
    <span style={{
      display:'inline-block', padding:'2px 9px', borderRadius:12,
      fontSize:11, fontWeight:600, background: color+'22', color,
      border:`1px solid ${color}44`,
    }}>{status}</span>
  );
}

// ── Category Dot ─────────────────────────────────────────────────────────────
function CatDot({ category }) {
  return (
    <span style={{
      display:'inline-block', width:8, height:8, borderRadius:'50%',
      background: CAT_COLORS[category] || T.textMut, marginRight:6, flexShrink:0,
    }} />
  );
}

// ── Project Card (Kanban) ─────────────────────────────────────────────────────
function ProjectCard({ p }) {
  return (
    <div style={{
      background: T.surface, borderRadius:8, padding:12, marginBottom:8,
      boxShadow: T.card, border:`1px solid ${T.border}`, fontSize:12,
    }}>
      <div style={{ display:'flex', alignItems:'center', marginBottom:4 }}>
        <CatDot category={p.category} />
        <span style={{ fontWeight:600, color:T.navy, fontSize:12, flex:1 }}>{p.name}</span>
      </div>
      <div style={{ color:T.textSec, marginBottom:6, fontSize:11 }}>{p.site}</div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <span style={{ background:T.bg, borderRadius:6, padding:'2px 7px', color:T.text, fontSize:11 }}>
          {p.co2e} ktCO₂e/yr
        </span>
        <span style={{ background:T.bg, borderRadius:6, padding:'2px 7px', color:T.text, fontSize:11 }}>
          ${p.capex}M capex
        </span>
        <span style={{ background:T.bg, borderRadius:6, padding:'2px 7px', color:T.text, fontSize:11 }}>
          IRR {p.irr}%
        </span>
      </div>
    </div>
  );
}

// ── Tab 1: Project Pipeline ───────────────────────────────────────────────────
function PipelineTab({ projects }) {
  const totalCo2e = projects.reduce((a,p) => a + p.co2e, 0).toFixed(1);
  const totalCapex = projects.reduce((a,p) => a + p.capex, 0).toFixed(1);
  const byStatus = {};
  STATUSES.forEach(s => { byStatus[s] = projects.filter(p => p.status === s); });

  const statusW = { Concept:160, Feasibility:180, Approved:180, 'In Progress':200, Complete:180 };

  return (
    <div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
        <MetricCard label="Total Pipeline Projects" value={projects.length} sub="Across 6 categories" />
        <MetricCard label="Pipeline CO₂e Reduction" value={`${totalCo2e} kt`} sub="Annual at full delivery" accent={T.sage} />
        <MetricCard label="Total Pipeline Capex" value={`$${totalCapex}M`} sub="Capital investment" accent={T.navyL} />
        <MetricCard label="Positive NPV @ $75/t" value="16/24" sub="Projects financially viable" accent={T.green} />
      </div>

      <div style={{ overflowX:'auto', paddingBottom:8 }}>
        <div style={{ display:'flex', gap:12, minWidth:900 }}>
          {STATUSES.map(status => {
            const col = byStatus[status] || [];
            const colCo2e = col.reduce((a,p) => a+p.co2e,0).toFixed(1);
            return (
              <div key={status} style={{ width: statusW[status] || 180, flexShrink:0 }}>
                <div style={{
                  background: STATUS_COLORS[status]+'18',
                  border:`1px solid ${STATUS_COLORS[status]}44`,
                  borderRadius:8, padding:'8px 12px', marginBottom:8,
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                }}>
                  <span style={{ fontWeight:700, fontSize:12, color: STATUS_COLORS[status] }}>{status}</span>
                  <span style={{
                    background: STATUS_COLORS[status]+'28', borderRadius:10,
                    padding:'1px 8px', fontSize:11, fontWeight:600, color: STATUS_COLORS[status],
                  }}>{col.length}</span>
                </div>
                <div style={{ fontSize:11, color:T.textSec, marginBottom:8, paddingLeft:2 }}>
                  {colCo2e} ktCO₂e/yr
                </div>
                <div>
                  {col.map(p => <ProjectCard key={p.id} p={p} />)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop:20, padding:'14px 18px', background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, boxShadow:T.card }}>
        <div style={{ fontWeight:700, color:T.navy, marginBottom:10, fontSize:13 }}>Pipeline Summary by Category</div>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          {CATEGORIES.map(cat => {
            const cps = projects.filter(p => p.category === cat);
            const cCo2e = cps.reduce((a,p) => a+p.co2e,0).toFixed(1);
            const cCapex = cps.reduce((a,p) => a+p.capex,0).toFixed(1);
            return (
              <div key={cat} style={{
                flex:1, minWidth:140, padding:'10px 14px',
                background:T.bg, borderRadius:8, border:`1px solid ${T.border}`,
              }}>
                <div style={{ display:'flex', alignItems:'center', marginBottom:4 }}>
                  <CatDot category={cat} />
                  <span style={{ fontSize:11, fontWeight:600, color:T.navy }}>{cat}</span>
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:CAT_COLORS[cat] }}>{cCo2e} kt</div>
                <div style={{ fontSize:11, color:T.textSec }}>${cCapex}M capex · {cps.length} projects</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Tab 2: Project Table ──────────────────────────────────────────────────────
function TableTab({ projects }) {
  const [catFilter, setCatFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortKey, setSortKey] = useState('co2e');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let r = projects;
    if (catFilter !== 'All') r = r.filter(p => p.category === catFilter);
    if (statusFilter !== 'All') r = r.filter(p => p.status === statusFilter);
    return [...r].sort((a,b) => sortAsc ? a[sortKey]-b[sortKey] : b[sortKey]-a[sortKey]);
  }, [projects, catFilter, statusFilter, sortKey, sortAsc]);

  const handleSort = key => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  };

  const selStyle = { padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, background:T.surface, color:T.text, cursor:'pointer' };
  const thStyle = (key) => ({
    padding:'8px 12px', fontSize:11, fontWeight:700, color:T.textSec,
    textAlign:'left', background:T.surfaceH, cursor:'pointer', userSelect:'none',
    borderBottom:`2px solid ${sortKey===key ? T.navy : T.border}`,
    whiteSpace:'nowrap',
  });

  return (
    <div>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:16, alignItems:'center' }}>
        <select style={selStyle} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select style={selStyle} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ marginLeft:'auto', fontSize:12, color:T.textSec }}>{filtered.length} projects shown</span>
      </div>

      <div style={{ overflowX:'auto', borderRadius:10, border:`1px solid ${T.border}`, boxShadow:T.card }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr>
              <th style={thStyle(null)}>Project</th>
              <th style={thStyle(null)}>Category</th>
              <th style={thStyle(null)}>Site</th>
              <th style={thStyle(null)}>Status</th>
              <th style={thStyle('co2e')} onClick={() => handleSort('co2e')}>CO₂e (kt) {sortKey==='co2e' ? (sortAsc?'↑':'↓') : ''}</th>
              <th style={thStyle('capex')} onClick={() => handleSort('capex')}>Capex ($M) {sortKey==='capex' ? (sortAsc?'↑':'↓') : ''}</th>
              <th style={thStyle('irr')} onClick={() => handleSort('irr')}>IRR % {sortKey==='irr' ? (sortAsc?'↑':'↓') : ''}</th>
              <th style={thStyle('abatement')} onClick={() => handleSort('abatement')}>Abatement ($/t) {sortKey==='abatement' ? (sortAsc?'↑':'↓') : ''}</th>
              <th style={thStyle('npv75')} onClick={() => handleSort('npv75')}>NPV@$75 ($M) {sortKey==='npv75' ? (sortAsc?'↑':'↓') : ''}</th>
              <th style={thStyle('payback')} onClick={() => handleSort('payback')}>Payback (yr) {sortKey==='payback' ? (sortAsc?'↑':'↓') : ''}</th>
              <th style={thStyle(null)}>Owner</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p,i) => (
              <tr key={p.id} style={{ background: i%2===0 ? T.surface : T.bg }}>
                <td style={{ padding:'9px 12px', color:T.navy, fontWeight:600, maxWidth:200 }}>{p.name}</td>
                <td style={{ padding:'9px 12px' }}>
                  <span style={{ display:'flex', alignItems:'center' }}>
                    <CatDot category={p.category} />
                    <span style={{ color:T.textSec }}>{p.category}</span>
                  </span>
                </td>
                <td style={{ padding:'9px 12px', color:T.textSec }}>{p.site}</td>
                <td style={{ padding:'9px 12px' }}><StatusBadge status={p.status} /></td>
                <td style={{ padding:'9px 12px', color:T.text, fontWeight:600 }}>{p.co2e}</td>
                <td style={{ padding:'9px 12px', color:T.text }}>{p.capex}</td>
                <td style={{ padding:'9px 12px', color: p.irr>=20 ? T.green : p.irr>=14 ? T.amber : T.red, fontWeight:600 }}>{p.irr}%</td>
                <td style={{ padding:'9px 12px', color: p.abatement<=30 ? T.green : p.abatement<=70 ? T.amber : T.red }}>${p.abatement}</td>
                <td style={{ padding:'9px 12px', color: p.npv75>=0 ? T.green : T.red, fontWeight:600 }}>{p.npv75>=0?'+':''}{p.npv75}</td>
                <td style={{ padding:'9px 12px', color:T.textSec }}>{p.payback}</td>
                <td style={{ padding:'9px 12px', color:T.textSec }}>{p.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab 3: Financial Analysis ─────────────────────────────────────────────────
function FinancialTab({ projects }) {
  const totalNpv75 = +projects.reduce((a,p) => a+p.npv75,0).toFixed(1);
  const totalNpv100 = +(totalNpv75*1.31).toFixed(1);
  const totalNpv150 = +(totalNpv75*1.68).toFixed(1);

  const npvWaterfall = [
    { name:'NPV @ $75/t', value: totalNpv75, fill: T.sage },
    { name:'NPV @ $100/t', value: totalNpv100, fill: T.navyL },
    { name:'NPV @ $150/t', value: totalNpv150, fill: T.navy },
  ];

  const scatterByCat = CATEGORIES.map(cat => ({
    cat,
    color: CAT_COLORS[cat],
    data: SCATTER_DATA.filter(d => d.category === cat),
  }));

  return (
    <div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
        <MetricCard label="Total NPV @ $75/tCO₂e" value={`$${totalNpv75}M`} sub="16/24 projects positive" accent={T.sage} />
        <MetricCard label="Total NPV @ $100/tCO₂e" value={`$${totalNpv100}M`} sub="18/24 projects positive" accent={T.navyL} />
        <MetricCard label="Total NPV @ $150/tCO₂e" value={`$${totalNpv150}M`} sub="21/24 projects positive" accent={T.navy} />
        <MetricCard label="Wtd Avg Abatement Cost" value="$54/t" sub="Cost-effective vs ETS" accent={T.gold} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        <div style={{ background:T.surface, borderRadius:10, padding:16, boxShadow:T.card, border:`1px solid ${T.border}` }}>
          <div style={{ fontWeight:700, color:T.navy, marginBottom:4, fontSize:13 }}>Cost of Abatement vs Annual CO₂e Reduction</div>
          <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>Bubble size = capex ($M). Quadrant: low cost / high volume = quick wins</div>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top:10, right:20, bottom:20, left:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="x" name="Abatement Cost" unit="$/t" tick={{ fontSize:10, fill:T.textSec }} label={{ value:'Abatement Cost ($/tCO₂e)', position:'insideBottom', offset:-10, fontSize:10, fill:T.textSec }} />
              <YAxis dataKey="y" name="CO₂e Reduction" unit=" kt" tick={{ fontSize:10, fill:T.textSec }} />
              <ReferenceLine x={54} stroke={T.amber} strokeDasharray="4 4" label={{ value:'Avg', fontSize:9, fill:T.amber }} />
              <ReferenceLine y={50} stroke={T.amber} strokeDasharray="4 4" />
              <Tooltip cursor={{ strokeDasharray:'3 3' }} content={({ payload }) => {
                if (!payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'8px 12px', fontSize:11 }}>
                    <div style={{ fontWeight:700, color:T.navy, marginBottom:4 }}>{d.name}</div>
                    <div>Abatement: ${d.x}/tCO₂e</div>
                    <div>CO₂e Reduction: {d.y} ktCO₂e/yr</div>
                    <div>Capex: ${d.capex}M</div>
                    <div>IRR: {d.irr}%</div>
                  </div>
                );
              }} />
              {scatterByCat.map(({ cat, color, data }) => (
                <Scatter key={cat} name={cat} data={data} fill={color} fillOpacity={0.7} />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:8 }}>
            {CATEGORIES.map(c => (
              <span key={c} style={{ display:'flex', alignItems:'center', fontSize:10, color:T.textSec }}>
                <CatDot category={c} />{c}
              </span>
            ))}
          </div>
        </div>

        <div style={{ background:T.surface, borderRadius:10, padding:16, boxShadow:T.card, border:`1px solid ${T.border}` }}>
          <div style={{ fontWeight:700, color:T.navy, marginBottom:4, fontSize:13 }}>NPV Sensitivity to Carbon Price</div>
          <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>Total pipeline NPV at three carbon price scenarios</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={npvWaterfall} margin={{ top:10, right:20, bottom:10, left:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize:11, fill:T.textSec }} />
              <YAxis tick={{ fontSize:10, fill:T.textSec }} tickFormatter={v => `$${v}M`} />
              <Tooltip formatter={v => [`$${v}M`, 'Total NPV']} />
              <Bar dataKey="value" radius={[6,6,0,0]}>
                {npvWaterfall.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div style={{ marginTop:16 }}>
            <div style={{ fontWeight:700, color:T.navy, fontSize:12, marginBottom:8 }}>Quadrant Analysis</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[
                { label:'Quick Wins', desc:'Low cost, high volume', color:T.green, count: projects.filter(p => p.abatement<=54 && p.co2e>=30).length },
                { label:'Strategic Investments', desc:'High volume, higher cost', color:T.navyL, count: projects.filter(p => p.abatement>54 && p.co2e>=30).length },
                { label:'High Value / Niche', desc:'Low cost, lower volume', color:T.amber, count: projects.filter(p => p.abatement<=54 && p.co2e<30).length },
                { label:'Monitor', desc:'High cost, low volume', color:T.red, count: projects.filter(p => p.abatement>54 && p.co2e<30).length },
              ].map(q => (
                <div key={q.label} style={{ padding:'8px 12px', background:q.color+'12', borderRadius:8, border:`1px solid ${q.color}30` }}>
                  <div style={{ fontWeight:700, fontSize:12, color:q.color }}>{q.label}</div>
                  <div style={{ fontSize:11, color:T.textSec }}>{q.desc}</div>
                  <div style={{ fontSize:16, fontWeight:700, color:q.color, marginTop:2 }}>{q.count} projects</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ background:T.surface, borderRadius:10, padding:16, boxShadow:T.card, border:`1px solid ${T.border}` }}>
        <div style={{ fontWeight:700, color:T.navy, marginBottom:4, fontSize:13 }}>IRR Distribution by Category</div>
        <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>Internal rate of return for all 24 projects, coloured by category</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={[...projects].sort((a,b) => b.irr-a.irr)} margin={{ top:10, right:20, bottom:20, left:10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={false} />
            <YAxis tick={{ fontSize:10, fill:T.textSec }} tickFormatter={v => `${v}%`} />
            <ReferenceLine y={15} stroke={T.amber} strokeDasharray="4 4" label={{ value:'Hurdle 15%', fontSize:9, fill:T.amber, position:'right' }} />
            <Tooltip formatter={(v,n,props) => [`${v}%`, 'IRR']} labelFormatter={(l, payload) => payload && payload[0] ? payload[0].payload.name : l} />
            <Bar dataKey="irr" radius={[4,4,0,0]}>
              {[...projects].sort((a,b) => b.irr-a.irr).map((p, i) => (
                <Cell key={i} fill={CAT_COLORS[p.category]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Tab 4: Delivery Timeline ──────────────────────────────────────────────────
function TimelineTab() {
  const ganttData = GANTT_DATA.map(p => ({
    ...p,
    end: p.start + p.dur,
  }));

  return (
    <div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
        <MetricCard label="Projects 2024–2025" value="9" sub="Delivering 248 ktCO₂e by yr-end 2025" accent={T.sage} />
        <MetricCard label="Projects 2026–2027" value="10" sub="Full ramp-up phase" accent={T.navyL} />
        <MetricCard label="Projects 2028+" value="5" sub="Strategic long-term" accent={T.gold} />
        <MetricCard label="SBTi 2030 Target" value="827 kt" sub="Pipeline delivers 827/847 kt by 2030" accent={T.green} />
      </div>

      <div style={{ background:T.surface, borderRadius:10, padding:16, boxShadow:T.card, border:`1px solid ${T.border}`, marginBottom:16 }}>
        <div style={{ fontWeight:700, color:T.navy, marginBottom:4, fontSize:13 }}>Project Gantt Timeline (Top 16 Projects by CO₂e)</div>
        <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>Bar length = project duration in months from Jan 2024. Coloured by category.</div>
        <div style={{ overflowX:'auto' }}>
          {ganttData.map((p,i) => {
            const totalW = 96;
            const barLeft = (p.start/totalW)*100;
            const barW = (p.dur/totalW)*100;
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', marginBottom:4, gap:8 }}>
                <div style={{ width:200, fontSize:10, color:T.textSec, flexShrink:0, textAlign:'right', paddingRight:8 }}>
                  {p.name}
                </div>
                <div style={{ flex:1, position:'relative', height:18, background:T.bg, borderRadius:4 }}>
                  <div style={{
                    position:'absolute', left:`${barLeft}%`, width:`${barW}%`,
                    top:0, bottom:0, borderRadius:4,
                    background: CAT_COLORS[p.category]+'cc',
                    minWidth:6,
                  }} />
                </div>
                <div style={{ width:60, fontSize:10, color:T.textSec, flexShrink:0, textAlign:'right' }}>
                  {PROJECTS.find(pr => pr.name.startsWith(p.name.replace('…','').slice(0,10)))?.completion || ''}
                </div>
              </div>
            );
          })}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
            <div style={{ width:200, flexShrink:0 }} />
            <div style={{ flex:1, display:'flex', justifyContent:'space-between', fontSize:9, color:T.textMut }}>
              {['2024','2025','2026','2027','2028','2029','2030','2031','2032'].map(y => <span key={y}>{y}</span>)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ background:T.surface, borderRadius:10, padding:16, boxShadow:T.card, border:`1px solid ${T.border}` }}>
        <div style={{ fontWeight:700, color:T.navy, marginBottom:4, fontSize:13 }}>Cumulative CO₂e Reduction Trajectory (2024–2032)</div>
        <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>Cumulative annual reduction from pipeline delivery. SBTi milestone flags highlighted.</div>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={CUMULATIVE_DATA} margin={{ top:10, right:20, bottom:20, left:10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize:10, fill:T.textSec }} />
            <YAxis tick={{ fontSize:10, fill:T.textSec }} tickFormatter={v => `${v} kt`} />
            <Tooltip formatter={v => [`${v} ktCO₂e/yr`, 'Cumulative Reduction']} />
            <ReferenceLine y={500} stroke={T.amber} strokeDasharray="4 4" label={{ value:'Interim Target', fontSize:9, fill:T.amber, position:'right' }} />
            <ReferenceLine y={800} stroke={T.green} strokeDasharray="4 4" label={{ value:'Net-Zero Path', fontSize:9, fill:T.green, position:'right' }} />
            <Area type="monotone" dataKey="cumCo2e" fill={T.sage+'30'} stroke={T.sage} strokeWidth={2} />
            <Line type="monotone" dataKey="cumCo2e" stroke={T.navy} strokeWidth={2} dot={(props) => {
              const d = CUMULATIVE_DATA[props.index];
              if (!d || !d.sbti) return <circle key={props.index} cx={props.cx} cy={props.cy} r={3} fill={T.navy} />;
              return <circle key={props.index} cx={props.cx} cy={props.cy} r={7} fill={T.gold} stroke={T.navy} strokeWidth={2} />;
            }} />
          </ComposedChart>
        </ResponsiveContainer>
        <div style={{ display:'flex', gap:16, marginTop:8, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, color:T.textSec, display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ display:'inline-block', width:12, height:12, borderRadius:'50%', background:T.gold, border:`2px solid ${T.navy}` }} />
            SBTi milestone year
          </span>
          <span style={{ fontSize:11, color:T.textSec, display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ display:'inline-block', width:20, height:2, background:T.sage }} />
            Cumulative CO₂e reduction
          </span>
        </div>
        <div style={{ marginTop:16 }}>
          {CUMULATIVE_DATA.filter(d => d.sbti).map(d => (
            <div key={d.year} style={{
              display:'inline-flex', alignItems:'center', gap:8, marginRight:16,
              padding:'4px 12px', background:T.gold+'22', borderRadius:20,
              border:`1px solid ${T.gold}44`, fontSize:11,
            }}>
              <span style={{ background:T.gold, color:'#fff', fontWeight:700, borderRadius:'50%', width:18, height:18, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:10 }}>★</span>
              <span style={{ color:T.navy, fontWeight:600 }}>{d.year}: {d.cumCo2e} ktCO₂e/yr cumulative</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab 5: Co-Benefits Dashboard ──────────────────────────────────────────────
function CoBenefitsTab({ projects }) {
  const totalEnergy = +projects.reduce((a,p) => a+p.energySav,0).toFixed(1);
  const totalWater = +projects.reduce((a,p) => a+p.waterSav,0).toFixed(1);
  const totalWaste = +projects.reduce((a,p) => a+p.wasteSav,0).toFixed(0);
  const totalCobenefitValue = +(totalEnergy * 8.4 + totalWater * 1.2 + totalWaste * 0.18).toFixed(1);

  const SDG_ICONS = [
    { sdg: 'SDG 7', label: 'Affordable & Clean Energy', icon: '⚡', color: '#fcc30b', rel: 'Energy savings' },
    { sdg: 'SDG 6', label: 'Clean Water & Sanitation', icon: '💧', color: '#26bde2', rel: 'Water savings' },
    { sdg: 'SDG 12', label: 'Responsible Consumption', icon: '♻', color: '#bf8b2e', rel: 'Waste reduction' },
    { sdg: 'SDG 13', label: 'Climate Action', icon: '🌍', color: '#3f7e44', rel: 'CO₂e reduction' },
    { sdg: 'SDG 8', label: 'Decent Work & Growth', icon: '📈', color: '#a21942', rel: 'Job creation' },
    { sdg: 'SDG 9', label: 'Industry & Innovation', icon: '🏭', color: '#fd6925', rel: 'R&D investment' },
  ];

  return (
    <div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
        <MetricCard label="Energy Cost Savings" value={`$${totalEnergy}M/yr`} sub="Across all projects" accent={T.gold} />
        <MetricCard label="Water Savings" value={`${totalWater} ML/yr`} sub="Megalitres per year" accent={T.navyL} />
        <MetricCard label="Waste Reduction" value={`${totalWaste.toLocaleString()} t/yr`} sub="Industrial & packaging waste" accent={T.sage} />
        <MetricCard label="Total Co-Benefit Value" value={`$${totalCobenefitValue}M/yr`} sub="Estimated monetised value" accent={T.green} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:16 }}>
        <div style={{ background:T.surface, borderRadius:10, padding:16, boxShadow:T.card, border:`1px solid ${T.border}` }}>
          <div style={{ fontWeight:700, color:T.navy, marginBottom:2, fontSize:13 }}>Energy Savings by Category</div>
          <div style={{ fontSize:11, color:T.textSec, marginBottom:10 }}>$M per year</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={COBENEFIT_CAT} layout="vertical" margin={{ top:5, right:20, bottom:5, left:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize:10, fill:T.textSec }} tickFormatter={v => `$${v}M`} />
              <YAxis dataKey="category" type="category" tick={{ fontSize:9, fill:T.textSec }} width={90} />
              <Tooltip formatter={v => [`$${v}M/yr`, 'Energy Savings']} />
              <Bar dataKey="energySav" radius={[0,4,4,0]}>
                {COBENEFIT_CAT.map((entry, i) => (
                  <Cell key={i} fill={CAT_COLORS[entry.category]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:T.surface, borderRadius:10, padding:16, boxShadow:T.card, border:`1px solid ${T.border}` }}>
          <div style={{ fontWeight:700, color:T.navy, marginBottom:2, fontSize:13 }}>Water Savings by Category</div>
          <div style={{ fontSize:11, color:T.textSec, marginBottom:10 }}>Megalitres per year</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={COBENEFIT_CAT} layout="vertical" margin={{ top:5, right:20, bottom:5, left:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize:10, fill:T.textSec }} tickFormatter={v => `${v}ML`} />
              <YAxis dataKey="category" type="category" tick={{ fontSize:9, fill:T.textSec }} width={90} />
              <Tooltip formatter={v => [`${v} ML/yr`, 'Water Savings']} />
              <Bar dataKey="waterSav" radius={[0,4,4,0]}>
                {COBENEFIT_CAT.map((entry, i) => (
                  <Cell key={i} fill={CAT_COLORS[entry.category]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:T.surface, borderRadius:10, padding:16, boxShadow:T.card, border:`1px solid ${T.border}` }}>
          <div style={{ fontWeight:700, color:T.navy, marginBottom:2, fontSize:13 }}>Waste Reduction by Category</div>
          <div style={{ fontSize:11, color:T.textSec, marginBottom:10 }}>Tonnes per year</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={COBENEFIT_CAT} layout="vertical" margin={{ top:5, right:20, bottom:5, left:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize:10, fill:T.textSec }} tickFormatter={v => `${v}t`} />
              <YAxis dataKey="category" type="category" tick={{ fontSize:9, fill:T.textSec }} width={90} />
              <Tooltip formatter={v => [`${v} t/yr`, 'Waste Reduction']} />
              <Bar dataKey="wasteSav" radius={[0,4,4,0]}>
                {COBENEFIT_CAT.map((entry, i) => (
                  <Cell key={i} fill={CAT_COLORS[entry.category]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background:T.surface, borderRadius:10, padding:16, boxShadow:T.card, border:`1px solid ${T.border}`, marginBottom:16 }}>
        <div style={{ fontWeight:700, color:T.navy, marginBottom:4, fontSize:13 }}>SDG Alignment</div>
        <div style={{ fontSize:11, color:T.textSec, marginBottom:14 }}>Sustainable Development Goals addressed by the carbon reduction pipeline</div>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          {SDG_ICONS.map(s => (
            <div key={s.sdg} style={{
              flex:1, minWidth:140, padding:'12px 16px',
              background:s.color+'14', borderRadius:10, border:`1px solid ${s.color}30`,
              textAlign:'center',
            }}>
              <div style={{ fontSize:28, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontWeight:700, fontSize:12, color:s.color }}>{s.sdg}</div>
              <div style={{ fontSize:11, color:T.navy, fontWeight:600, marginBottom:2 }}>{s.label}</div>
              <div style={{ fontSize:10, color:T.textSec }}>{s.rel}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:T.surface, borderRadius:10, padding:16, boxShadow:T.card, border:`1px solid ${T.border}` }}>
        <div style={{ fontWeight:700, color:T.navy, marginBottom:12, fontSize:13 }}>Co-Benefit Valuation Summary</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {[
            { label:'Energy Cost Avoidance', value:`$${totalEnergy}M/yr`, rate:'@ $8.4M per ML saved', color:T.gold },
            { label:'Water Scarcity Value', value:`$${(totalWater*1.2).toFixed(1)}M/yr`, rate:'@ $1.2M per ML saved', color:T.navyL },
            { label:'Waste Disposal Avoidance', value:`$${(totalWaste*0.18/1000).toFixed(2)}M/yr`, rate:'@ $180/tonne', color:T.sage },
          ].map(v => (
            <div key={v.label} style={{ padding:'12px 16px', background:T.bg, borderRadius:8, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>{v.label}</div>
              <div style={{ fontSize:20, fontWeight:700, color:v.color }}>{v.value}</div>
              <div style={{ fontSize:10, color:T.textMut, marginTop:2 }}>{v.rate}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CarbonReductionProjectsPage() {
  const [activeTab, setActiveTab] = useState(0);

  const TABS = [
    { label:'Project Pipeline', id:'pipeline' },
    { label:'Project Table', id:'table' },
    { label:'Financial Analysis', id:'financial' },
    { label:'Delivery Timeline', id:'timeline' },
    { label:'Co-Benefits Dashboard', id:'cobenefits' },
  ];

  const inProgress = PROJECTS.filter(p => p.status === 'In Progress');
  const inProgressCo2e = +inProgress.reduce((a,p) => a+p.co2e,0).toFixed(0);
  const totalCapex = +(PROJECTS.reduce((a,p) => a+p.capex,0)/1000).toFixed(2);

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:T.font, color:T.text }}>
      {/* Header */}
      <div style={{
        background:T.navy, color:'#fff', padding:'20px 32px 0',
        borderBottom:`3px solid ${T.gold}`,
      }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:16 }}>
          <div>
            <div style={{ fontSize:11, color:T.gold, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>
              EP-AI5 · Carbon Reduction Projects
            </div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:'#fff', lineHeight:1.2 }}>
              Carbon Reduction Projects Pipeline
            </h1>
            <p style={{ margin:'6px 0 0', fontSize:13, color:'#a8c4d8', maxWidth:560 }}>
              Corporate emission reduction initiative tracking — from concept to delivery
            </p>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
            {[
              { label:'24 Projects', sub:'Total pipeline' },
              { label:'847 kt', sub:'CO₂e/yr at full delivery' },
              { label:inProgress.length + ' Active', sub:`${inProgressCo2e} ktCO₂e/yr` },
              { label:`$${totalCapex}bn`, sub:'Total capex' },
            ].map(b => (
              <div key={b.label} style={{
                background:'rgba(255,255,255,0.08)', borderRadius:8, padding:'8px 14px',
                border:'1px solid rgba(255,255,255,0.14)', textAlign:'center',
              }}>
                <div style={{ fontWeight:800, fontSize:16, color:T.gold }}>{b.label}</div>
                <div style={{ fontSize:10, color:'#a8c4d8' }}>{b.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:0 }}>
          {TABS.map((t,i) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(i)}
              style={{
                padding:'10px 20px', border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
                background: activeTab===i ? '#fff' : 'transparent',
                color: activeTab===i ? T.navy : 'rgba(255,255,255,0.7)',
                borderRadius: activeTab===i ? '8px 8px 0 0' : '0',
                borderBottom: activeTab===i ? 'none' : 'none',
                transition:'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding:'24px 32px', maxWidth:1400, margin:'0 auto' }}>
        {activeTab === 0 && <PipelineTab projects={PROJECTS} />}
        {activeTab === 1 && <TableTab projects={PROJECTS} />}
        {activeTab === 2 && <FinancialTab projects={PROJECTS} />}
        {activeTab === 3 && <TimelineTab />}
        {activeTab === 4 && <CoBenefitsTab projects={PROJECTS} />}
      </div>

      {/* Footer */}
      <div style={{ textAlign:'center', padding:'16px 32px', color:T.textMut, fontSize:11, borderTop:`1px solid ${T.border}` }}>
        EP-AI5 · Carbon Reduction Projects Pipeline · Data as of Q1 2026 · SBTi-aligned targets · All figures indicative
      </div>
    </div>
  );
}
