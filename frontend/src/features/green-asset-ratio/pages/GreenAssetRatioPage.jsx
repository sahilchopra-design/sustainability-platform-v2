/**
 * EP-AJ3 — Green Asset Ratio (GAR) — EU Taxonomy Compliance
 * Sprint AJ · Financed Emissions & Climate Banking Analytics
 * Regulatory basis: EU Taxonomy Regulation (EU) 2020/852
 * CRR Article 449a — mandatory for CRR institutions from 2024
 */
import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, LineChart, Line, Legend,
} from 'recharts';
import { TAXONOMY_THRESHOLDS } from '../../../data/referenceData';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr = s => { let x = Math.sin(s+1)*10000; return x-Math.floor(x); };

// ─── STATIC DATA ─────────────────────────────────────────────────────────────

const YEARS = ['2022','2023','2024','2025 Target','2030 Target'];
const ENTITY_SCOPES = ['Consolidated Group','Bank Only','Insurance Sub'];

const garByYear = {
  '2022':        { gar: 4.8,  aligned: 5.2,  covered: 108.3, total: 195.4 },
  '2023':        { gar: 5.1,  aligned: 5.8,  covered: 113.7, total: 202.1 },
  '2024':        { gar: 7.3,  aligned: 8.4,  covered: 115.1, total: 208.6 },
  '2025 Target': { gar: 12.0, aligned: 14.2, covered: 118.3, total: 214.0 },
  '2030 Target': { gar: 22.0, aligned: 27.5, covered: 125.0, total: 220.0 },
};

const garByScope = {
  'Consolidated Group': { multiplier: 1.00 },
  'Bank Only':          { multiplier: 0.87 },
  'Insurance Sub':      { multiplier: 0.13 },
};

const envObjectives = [
  { code:'CCM', label:'Climate Change Mitigation',      aligned:4.8, eligible:8.2,  notEligible:22.6, color:'#06c896' },
  { code:'CCA', label:'Climate Change Adaptation',      aligned:0.9, eligible:2.1,  notEligible:33.6, color:'#0ea5e9' },
  { code:'WTR', label:'Sustainable Use of Water',       aligned:0.3, eligible:0.8,  notEligible:35.5, color:'#38bdf8' },
  { code:'CE',  label:'Circular Economy',               aligned:0.2, eligible:0.5,  notEligible:35.9, color:'#a78bfa' },
  { code:'PPC', label:'Pollution Prevention & Control', aligned:0.01,eligible:0.1,  notEligible:36.5, color:'#f0a828' },
  { code:'BIO', label:'Protection of Ecosystems',       aligned:0.01,eligible:0.1,  notEligible:36.5, color:'#f04060' },
];

const histTrend = [
  { year:'2021', gar:3.2  },
  { year:'2022', gar:4.8  },
  { year:'2023', gar:5.1  },
  { year:'2024', gar:7.3  },
  { year:'2025', gar:null, target:12.0 },
  { year:'2026', gar:null, target:14.5 },
  { year:'2027', gar:null, target:17.0 },
  { year:'2028', gar:null, target:22.0 },
];

const peerBanks = [
  { name:'NordBank', q1:5.2, q2:6.1, q3:6.8, q4:7.9, color:'#0ea5e9' },
  { name:'EuroGreen',q1:6.0, q2:7.3, q3:8.1, q4:9.2, color:'#06c896' },
  { name:'AlphaFin', q1:3.8, q2:4.4, q3:5.0, q4:5.9, color:'#a78bfa' },
  { name:'SüdBank',  q1:4.5, q2:5.2, q3:6.0, q4:7.1, color:'#f0a828' },
  { name:'Our Bank', q1:5.8, q2:6.4, q3:7.0, q4:7.3, color:T.navy     },
];

// 60 loan/investment positions
const buildPositions = () => {
  const borrowers = [
    'Vestas Wind Systems','Iberdrola SA','RWE Renewables','Ørsted A/S','EDF Renewables',
    'Siemens Energy','Nexans SA','Schneider Electric','Alstom SA','Bombardier Transport',
    'Skanska AB','Vinci Energies','ENGIE SA','Total Energies','BP Alt Energy',
    'Shell New Energies','Vattenfall AB','Enel Green Power','BayWa r.e.','Encavis AG',
    'Neoen SA','Voltalia SA','Boralex Inc','Greenalia SA','ABO Wind AG',
    'Thyssenkrupp Green Steel','ArcelorMittal XCarb','SSAB Fossil-Free','H2 Green Steel','Salzgitter AG',
    'BMW Group EV','Volkswagen ID','Daimler Truck','Traton SE','Iveco Group',
    'Air Liquide H2','Linde plc','Air Products','Nel Hydrogen','McPhy Energy',
    'Orion Energy','Sunrun Inc','SolarEdge Tech','Enphase Energy','First Solar Inc',
    'Brookfield Renewables','Pattern Energy','Avangrid Inc','Aecon Group','Acciona Energia',
    'Implenia AG','Bouygues Constr','Strabag SE','Porr AG','HOCHTIEF AG',
    'Castellum AB','Fabege AB','Catella RE','Patrizia SE','Aroundtown SA',
  ];
  const naceMap = [
    'D35.1','D35.1','D35.1','D35.1','D35.1',
    'C27.1','C27.3','C27.9','H49.1','H49.3',
    'F41.2','F43.2','D35.2','B06.1','B06.1',
    'D35.2','D35.3','D35.1','D35.1','D35.1',
    'D35.1','D35.1','D35.1','D35.1','D35.1',
    'C24.1','C24.1','C24.1','C24.1','C24.1',
    'C29.1','C29.1','C29.1','C29.1','C29.1',
    'C20.1','C20.1','C20.1','C20.1','C20.1',
    'D35.1','D35.1','C26.1','C26.1','C26.1',
    'D35.1','D35.1','D35.1','F41.1','D35.1',
    'F41.2','F41.2','F41.2','F41.2','F41.2',
    'L68.1','L68.1','L68.2','L68.2','L68.2',
  ];
  const tscRefs = [
    'CCM 4.1','CCM 4.1','CCM 4.1','CCM 4.1','CCM 4.1',
    'CCM 3.1','CCM 3.1','CCM 3.1','CCM 6.1','CCM 6.3',
    'CCM 7.1','CCM 7.1','CCM 4.5','CCM 4.5','CCM 4.5',
    'CCM 4.5','CCM 4.5','CCM 4.1','CCM 4.1','CCM 4.1',
    'CCM 4.1','CCM 4.1','CCM 4.1','CCM 4.1','CCM 4.1',
    'CCM 3.3','CCM 3.3','CCM 3.3','CCM 3.3','CCM 3.3',
    'CCM 6.5','CCM 6.5','CCM 6.5','CCM 6.5','CCM 6.5',
    'CCM 4.10','CCM 4.10','CCM 4.10','CCM 4.10','CCM 4.10',
    'CCM 4.1','CCM 4.1','CCM 4.1','CCM 4.1','CCM 4.1',
    'CCM 4.1','CCM 4.1','CCM 4.1','CCM 7.1','CCM 4.1',
    'CCM 7.1','CCM 7.1','CCM 7.1','CCM 7.1','CCA 2.1',
    'CCM 7.4','CCM 7.4','CCM 7.4','CCA 2.1','CCA 2.1',
  ];
  const objMap = ['CCM','CCM','CCM','CCM','CCM','CCM','CCM','CCM','CCM','CCM','CCM','CCM',
    'CCM','CCM','CCM','CCM','CCM','CCM','CCM','CCM','CCM','CCM','CCM','CCM','CCM',
    'CCM','CCM','CCM','CCM','CCM','CCM','CCM','CCM','CCM','CCM',
    'CCM','CCM','CCM','CCM','CCM','CCM','CCM','CCM','CCM','CCM',
    'CCM','CCM','CCM','CCM','CCM','CCM','CCM','CCM','CCM','CCA',
    'CCM','CCM','CCM','CCA','CCA'];
  const positions = [];
  for (let i=0; i<60; i++) {
    const seed = i*17+3;
    const eligible = sr(seed) > 0.18;
    const aligned  = eligible && sr(seed+7) > 0.32;
    const dnshSeed = sr(seed+13);
    const dnsh     = !aligned ? 'pending' : dnshSeed > 0.15 ? 'pass' : dnshSeed > 0.05 ? 'fail' : 'pending';
    const mss      = aligned && dnsh==='pass' ? 'pass' : aligned ? 'pending' : 'n/a';
    positions.push({
      id: i+1,
      borrower: borrowers[i],
      nace: naceMap[i],
      tscRef: tscRefs[i],
      objective: objMap[i],
      exposure: Math.round((sr(seed+2)*180+20)*10)/10,
      eligible,
      aligned,
      dnsh,
      mss,
      dnshAnswers: {},
    });
  }
  return positions;
};

const POSITIONS_SEED = buildPositions();

const DNSH_CRITERIA = [
  { id:1, label:'Climate Change Mitigation', desc:'Does the activity cause significant harm to climate change mitigation?' },
  { id:2, label:'Climate Change Adaptation', desc:'Does the activity cause significant harm to climate change adaptation?' },
  { id:3, label:'Water & Marine Resources',  desc:'Does the activity cause significant harm to sustainable use of water?' },
  { id:4, label:'Circular Economy',          desc:'Does the activity cause significant harm to circular economy transition?' },
  { id:5, label:'Pollution Prevention',      desc:'Does the activity cause significant harm to pollution prevention?' },
  { id:6, label:'Ecosystems & Biodiversity', desc:'Does the activity cause significant harm to biodiversity and ecosystems?' },
];

const NACE_TSC_MAP = [
  { code:'A01.1', section:'Agriculture', tsc:'CCA 1.1', objective:'CCA', threshold:'Climate-resilient crops; adaptation plan required' },
  { code:'B06.1', section:'Oil & Gas',   tsc:'—',       objective:'—',   threshold:'Not covered under EU Taxonomy' },
  { code:'C20.1', section:'Manufacturing',tsc:'CCM 1.1',objective:'CCM', threshold:'GHG intensity <100 tCO2e/tonne product' },
  { code:'C24.1', section:'Steel',       tsc:'CCM 3.3', objective:'CCM', threshold:'GHG intensity <0.4 tCO2e/tonne steel by 2030' },
  { code:'C26.1', section:'Electronics', tsc:'CCM 3.1', objective:'CCM', threshold:'Energy efficiency improvement ≥30%' },
  { code:'C27.1', section:'Electrical',  tsc:'CCM 3.1', objective:'CCM', threshold:'Energy efficiency improvement ≥30%' },
  { code:'C27.3', section:'Wiring',      tsc:'CCM 3.1', objective:'CCM', threshold:'Low-loss conductors; copper recycled content ≥40%' },
  { code:'C27.9', section:'Elec. Equip', tsc:'CCM 3.1', objective:'CCM', threshold:'EU Ecodesign requirements met' },
  { code:'C29.1', section:'Motor Vehicles',tsc:'CCM 6.5',objective:'CCM',threshold:'Zero direct (tailpipe) emissions' },
  { code:'D35.1', section:'Electric Power',tsc:'CCM 4.1',objective:'CCM', threshold:'LCA GHG emissions <100 gCO2e/kWh (solar, wind: no threshold)' },
  { code:'D35.2', section:'Gas Distribution',tsc:'CCM 4.5',objective:'CCM',threshold:'Only low-carbon and renewable gas' },
  { code:'D35.3', section:'Steam & Heat', tsc:'CCM 4.6', objective:'CCM', threshold:'GHG intensity <100 gCO2e/kWh' },
  { code:'F41.1', section:'New Buildings',tsc:'CCM 7.1', objective:'CCM', threshold:'Nearly zero-energy (NZEB) or top 10% EPC in country' },
  { code:'F41.2', section:'Building Renovation',tsc:'CCM 7.2',objective:'CCM',threshold:'≥30% reduction in primary energy demand' },
  { code:'F43.2', section:'Electrical Instal.',tsc:'CCM 7.5',objective:'CCM',threshold:'Related to certified NZEB or renovation to NZEB standard' },
  { code:'H49.1', section:'Rail Passenger',tsc:'CCM 6.1',objective:'CCM', threshold:'Electric or hydrogen traction; zero direct emissions' },
  { code:'H49.3', section:'Bus Transport', tsc:'CCM 6.3', objective:'CCM', threshold:'Zero tailpipe emissions; EV or H2' },
  { code:'L68.1', section:'Real Estate',   tsc:'CCM 7.7', objective:'CCM', threshold:'EPC class A or top 15% national stock' },
  { code:'L68.2', section:'Property Mgmt', tsc:'CCA 2.1', objective:'CCA', threshold:'Physical climate risk assessment completed' },
  { code:'M72.1', section:'R&D',           tsc:'CCM 1.2', objective:'CCM', threshold:'R&D into climate solutions with measurement plan' },
];

const SECTOR_THRESHOLDS = {
  energy: [
    { activity:'Solar PV (utility)',   tsc:'CCM 4.1', threshold:'No numeric threshold — all solar CCM-aligned by default', dnsh:'Grid stability plan required if >1MW' },
    { activity:'Onshore Wind',         tsc:'CCM 4.1', threshold:'No numeric threshold — all wind CCM-aligned',             dnsh:'Biodiversity impact assessment required' },
    { activity:'Offshore Wind',        tsc:'CCM 4.1', threshold:'No numeric threshold',                                    dnsh:'Marine ecosystem assessment required' },
    { activity:'Hydropower',           tsc:'CCM 4.1', threshold:'LCA <100 gCO2e/kWh; Power density >5W/m²',               dnsh:'Hydromorphological impact assessment' },
    { activity:'Nuclear',              tsc:'CCM 4.26',threshold:'LCA <100 gCO2e/kWh; radwaste plan required',             dnsh:'Waste disposal safe disposal plan' },
    { activity:'Biomass CHP',          tsc:'CCM 4.20',threshold:'GHG savings ≥80% vs EU average; RED II compliant',       dnsh:'Sustainable sourcing certification' },
  ],
  transport: [
    { activity:'Passenger Rail',       tsc:'CCM 6.1', threshold:'Electric or hydrogen; zero direct emissions',             dnsh:'Noise action plan required' },
    { activity:'Urban Light Rail',     tsc:'CCM 6.2', threshold:'Zero direct emissions; catenary or battery',              dnsh:'No significant noise externalities' },
    { activity:'Zero-Emission Bus',    tsc:'CCM 6.3', threshold:'Zero tailpipe emissions (EV or H2)',                      dnsh:'Charging infrastructure sustainability' },
    { activity:'Active Mobility Infra',tsc:'CCM 6.14',threshold:'Dedicated cycling/walking infrastructure',                dnsh:'No biodiversity disruption' },
    { activity:'Electric Vehicles',    tsc:'CCM 6.5', threshold:'Zero direct emissions; lifecycle <50 gCO2e/km target',    dnsh:'Battery recycling plan' },
    { activity:'Shipping (hydrogen)',  tsc:'CCM 6.12',threshold:'Fuel cells or renewable ammonia; GHG savings ≥50%',      dnsh:'Port ecosystem protection' },
  ],
  manufacturing: [
    { activity:'Green Steel (H2-DRI)', tsc:'CCM 3.3', threshold:'GHG intensity <0.4 tCO2/t steel (scope 1+2)',            dnsh:'Water consumption management' },
    { activity:'Green Hydrogen Prod.', tsc:'CCM 4.10',threshold:'LCA ≤3.38 tCO2e/tH2; electrolysis from renewable',      dnsh:'Water use efficiency plan' },
    { activity:'Cement (low-carbon)',  tsc:'CCM 3.2', threshold:'GHG intensity <0.722 tCO2/t clinker',                   dnsh:'Air quality standards compliance' },
    { activity:'EV Battery Mfg',       tsc:'CCM 3.4', threshold:'GHG savings ≥65% vs fossil baseline',                   dnsh:'Chemical safety REACH compliance' },
    { activity:'Heat Pump Mfg',        tsc:'CCM 3.1', threshold:'GHG savings ≥30% vs equivalent heat sources',           dnsh:'F-gas use minimisation' },
    { activity:'Solar Module Mfg',     tsc:'CCM 3.1', threshold:'LCA <100 gCO2e/kWh over lifetime; recycling plan',      dnsh:'Hazardous materials management' },
  ],
  buildings: [
    { activity:'New Nearly Zero-Energy',tsc:'CCM 7.1',threshold:'Primary energy demand ≤10% above NZEB national standard',dnsh:'Thermal comfort; daylighting' },
    { activity:'Deep Energy Renovation',tsc:'CCM 7.2',threshold:'≥30% primary energy demand reduction',                  dnsh:'Asbestos/lead safe removal' },
    { activity:'Top 15% EPC',           tsc:'CCM 7.3',threshold:'EPC class A or verified top 15% national building stock', dnsh:'Indoor air quality standards' },
    { activity:'District Heating Conn.',tsc:'CCM 7.5',threshold:'Connection to efficient district heating system',         dnsh:'Noise from heat centre <35dB' },
    { activity:'Building Automation',   tsc:'CCM 7.6',threshold:'BACS class B or above per EN 15232',                    dnsh:'No rebound effect documented' },
    { activity:'Green Roofs/Infra',     tsc:'CCM 7.1/BIO',threshold:'Contributes to biodiversity net gain or urban cooling',dnsh:'Native species only used' },
  ],
};

const DEFAULT_DEALS = [
  { id:1, name:'NordWind Offshore Ph2', activity:'Offshore Wind', objective:'CCM', exposure:85.0, alignDate:'2025-Q2', aligned:true  },
  { id:2, name:'GreenSteel Linz',       activity:'Green Steel',   objective:'CCM', exposure:42.5, alignDate:'2025-Q3', aligned:false },
  { id:3, name:'Urban Rail Expansion',  activity:'Passenger Rail',objective:'CCM', exposure:31.0, alignDate:'2025-Q4', aligned:true  },
  { id:4, name:'H2 Hub Hamburg',        activity:'Green H2',      objective:'CCM', exposure:28.0, alignDate:'2026-Q1', aligned:false },
  { id:5, name:'NZEB Housing Munich',   activity:'New NZEB',      objective:'CCM', exposure:19.5, alignDate:'2025-Q2', aligned:true  },
];

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

const Pill = ({ children, color, bg }) => (
  <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:12,
    color: color||T.navy, background: bg||T.surfaceH, border:`1px solid ${T.border}` }}>
    {children}
  </span>
);

const StatusBadge = ({ value }) => {
  const map = { pass:['#16a34a','#dcfce7'], fail:['#dc2626','#fee2e2'],
    pending:['#d97706','#fef3c7'], 'n/a':['#9aa3ae','#f0ede7'] };
  const [c,bg] = map[value]||map['n/a'];
  return <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px',
    borderRadius:12, color:c, background:bg }}>{value.toUpperCase()}</span>;
};

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
    padding:'18px 20px', boxShadow:T.card }}>
    <div style={{ fontSize:11, fontWeight:600, color:T.textMut, textTransform:'uppercase',
      letterSpacing:'0.06em', marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:28, fontWeight:800, color:color||T.navy }}>{value}</div>
    {sub && <div style={{ fontSize:12, color:T.textSec, marginTop:4 }}>{sub}</div>}
  </div>
);

// ─── TAB 1: GAR DASHBOARD ────────────────────────────────────────────────────

function Tab1Dashboard({ activeYear, setActiveYear, entityScope, setEntityScope }) {
  const [donutSeg, setDonutSeg] = useState(null);
  const base = garByYear[activeYear];
  const m    = garByScope[entityScope].multiplier;
  const aligned = +(base.aligned * m).toFixed(1);
  const covered = +(base.covered * m).toFixed(1);
  const total   = +(base.total   * m).toFixed(1);
  const gar     = +((aligned/covered)*100).toFixed(1);
  const notCovered = +(total - covered).toFixed(1);

  const donutData = [
    { name:'Taxonomy-Aligned', value:aligned,    fill:T.sage   },
    { name:'Eligible, Not Aligned', value:+(covered-aligned).toFixed(1), fill:T.gold },
    { name:'Not Covered', value:notCovered, fill:T.border },
  ];

  const barData = envObjectives.map(o => ({
    name: o.code,
    Aligned:    +(o.aligned * m).toFixed(2),
    Eligible:   +(o.eligible * m).toFixed(2),
    color: o.color,
  }));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Controls */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:12, alignItems:'center' }}>
        <div style={{ display:'flex', gap:4, background:T.surfaceH,
          borderRadius:10, padding:4, border:`1px solid ${T.border}` }}>
          {YEARS.map(y => (
            <button key={y} onClick={() => setActiveYear(y)} style={{
              padding:'6px 14px', borderRadius:7, border:'none', cursor:'pointer',
              fontSize:12, fontWeight:600,
              background: activeYear===y ? T.navy : 'transparent',
              color: activeYear===y ? '#fff' : T.textSec,
              transition:'all 0.18s',
            }}>{y}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:4, background:T.surfaceH,
          borderRadius:10, padding:4, border:`1px solid ${T.border}` }}>
          {ENTITY_SCOPES.map(s => (
            <button key={s} onClick={() => setEntityScope(s)} style={{
              padding:'6px 12px', borderRadius:7, border:'none', cursor:'pointer',
              fontSize:12, fontWeight:600,
              background: entityScope===s ? T.navyL : 'transparent',
              color: entityScope===s ? '#fff' : T.textSec,
              transition:'all 0.18s',
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        <KpiCard label="Green Asset Ratio" value={`${gar}%`}
          sub={`${activeYear} — ${entityScope}`} color={T.sage} />
        <KpiCard label="Taxonomy-Aligned" value={`€${aligned}bn`}
          sub="Numerator (TSC + DNSH + MSS)" />
        <KpiCard label="Covered Assets" value={`€${covered}bn`}
          sub="Denominator (NFC + HH + CRE)" />
        <KpiCard label="Total Assets" value={`€${total}bn`}
          sub={`Non-covered: €${notCovered}bn`} color={T.textSec} />
      </div>

      {/* GAR Formula */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
        padding:'14px 20px', boxShadow:T.card, fontFamily:'monospace', fontSize:14,
        color:T.navy, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
        <span style={{ fontWeight:700, color:T.textMut }}>GAR =</span>
        <span style={{ color:T.sage, fontWeight:700 }}> €{aligned}bn (aligned)</span>
        <span style={{ color:T.textMut }}> / </span>
        <span style={{ color:T.navyL, fontWeight:700 }}> €{covered}bn (covered)</span>
        <span style={{ color:T.textMut }}> × 100 = </span>
        <span style={{ color:T.sage, fontWeight:800, fontSize:17 }}> {gar}%</span>
        <span style={{ marginLeft:'auto', fontSize:11, color:T.textMut }}>
          CRR Art. 449a — KPI 1 (stock approach)
        </span>
      </div>

      {/* GAR Gauge */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
        padding:'18px 24px', boxShadow:T.card }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.textSec, marginBottom:10 }}>
          GAR Progress — {entityScope}
        </div>
        {[
          { label:'Current GAR',       val:gar,  target:22, color:T.sage   },
          { label:'2025 Target',        val:12.0, target:22, color:T.gold   },
          { label:'2030 Target',        val:22.0, target:22, color:T.navyL  },
        ].map(g => (
          <div key={g.label} style={{ marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between',
              fontSize:12, color:T.textSec, marginBottom:4 }}>
              <span>{g.label}</span><span style={{ fontWeight:700, color:g.color }}>{g.val}%</span>
            </div>
            <div style={{ height:10, background:T.surfaceH, borderRadius:6, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${Math.min((g.val/g.target)*100,100)}%`,
                background:g.color, borderRadius:6, transition:'width 0.6s ease' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Donut + Bar */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.6fr', gap:14 }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
          padding:'18px 20px', boxShadow:T.card }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.textSec, marginBottom:6 }}>
            Asset Coverage Breakdown
          </div>
          {donutSeg && (
            <div style={{ fontSize:12, color:T.navy, background:T.surfaceH,
              borderRadius:8, padding:'6px 12px', marginBottom:8, fontWeight:600 }}>
              {donutData[donutSeg]?.name}: €{donutData[donutSeg]?.value}bn
            </div>
          )}
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="value" onClick={(_,i) => setDonutSeg(i===donutSeg?null:i)}>
                {donutData.map((d,i) => (
                  <Cell key={i} fill={d.fill}
                    stroke={donutSeg===i ? T.navy : 'none'} strokeWidth={donutSeg===i?2:0} />
                ))}
              </Pie>
              <Tooltip formatter={v=>`€${v}bn`} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {donutData.map((d,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8,
                fontSize:11, color:T.textSec, cursor:'pointer' }}
                onClick={() => setDonutSeg(i===donutSeg?null:i)}>
                <div style={{ width:10, height:10, borderRadius:3, background:d.fill, flexShrink:0 }} />
                <span>{d.name}</span>
                <span style={{ marginLeft:'auto', fontWeight:700, color:T.navy }}>€{d.value}bn</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
          padding:'18px 20px', boxShadow:T.card }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.textSec, marginBottom:12 }}>
            Aligned vs. Eligible by Environmental Objective
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top:0, right:10, bottom:0, left:-10 }}>
              <XAxis dataKey="name" tick={{ fontSize:11, fill:T.textSec }} />
              <YAxis tick={{ fontSize:10, fill:T.textMut }} unit="bn" />
              <Tooltip formatter={v=>`€${v}bn`} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Bar dataKey="Aligned" fill={T.sage} radius={[3,3,0,0]} />
              <Bar dataKey="Eligible" fill={T.gold} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Peer Comparison */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
        padding:'18px 24px', boxShadow:T.card }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.textSec, marginBottom:12 }}>
          Peer Bank Comparison — GAR (2024 Quarterly)
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart margin={{ top:0, right:20, bottom:0, left:-10 }}>
            <XAxis dataKey="q" type="category" allowDuplicatedCategory={false}
              data={[{q:'Q1'},{q:'Q2'},{q:'Q3'},{q:'Q4'}]} tick={{ fontSize:11, fill:T.textSec }} />
            <YAxis tick={{ fontSize:10, fill:T.textMut }} unit="%" />
            <Tooltip formatter={v=>`${v}%`} />
            <Legend wrapperStyle={{ fontSize:11 }} />
            {peerBanks.map(p => (
              <Line key={p.name} type="monotone" dataKey={p.name} stroke={p.color}
                strokeWidth={p.name==='Our Bank'?3:1.5}
                data={[{q:'Q1',[p.name]:p.q1},{q:'Q2',[p.name]:p.q2},
                       {q:'Q3',[p.name]:p.q3},{q:'Q4',[p.name]:p.q4}]} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── TAB 2: ASSET-LEVEL TSC ASSESSMENT ───────────────────────────────────────

function Tab2AssetLevel() {
  const [positions, setPositions] = useState(POSITIONS_SEED);
  const [filterObj, setFilterObj]   = useState('ALL');
  const [filterAlign, setFilterAlign] = useState('ALL');
  const [filterDnsh, setFilterDnsh]   = useState('ALL');
  const [search, setSearch]           = useState('');
  const [sortBy, setSortBy]           = useState('id');
  const [sortDir, setSortDir]         = useState('asc');
  const [selected, setSelected]       = useState([]);
  const [dnshWizard, setDnshWizard]   = useState(null); // { posId, step }
  const [dnshAnswers, setDnshAnswers] = useState({});

  const filtered = useMemo(() => {
    let p = [...positions];
    if (filterObj !== 'ALL') p = p.filter(x => x.objective === filterObj);
    if (filterAlign === 'aligned')     p = p.filter(x => x.aligned);
    if (filterAlign === 'eligible')    p = p.filter(x => x.eligible && !x.aligned);
    if (filterAlign === 'notEligible') p = p.filter(x => !x.eligible);
    if (filterDnsh !== 'ALL') p = p.filter(x => x.dnsh === filterDnsh);
    if (search) p = p.filter(x =>
      x.borrower.toLowerCase().includes(search.toLowerCase()) ||
      x.nace.toLowerCase().includes(search.toLowerCase())
    );
    p.sort((a,b) => {
      let av = a[sortBy], bv = b[sortBy];
      if (typeof av === 'boolean') av = av?1:0, bv = bv?1:0;
      return sortDir==='asc' ? (av>bv?1:-1) : (av<bv?1:-1);
    });
    return p;
  }, [positions, filterObj, filterAlign, filterDnsh, search, sortBy, sortDir]);

  const assessed = positions.filter(p => p.dnsh !== 'pending').length;

  const toggleSort = col => {
    if (sortBy===col) setSortDir(d => d==='asc'?'desc':'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const toggleSel = id => setSelected(s => s.includes(id)?s.filter(x=>x!==id):[...s,id]);

  const bulkPassDnsh = () => {
    setPositions(p => p.map(pos =>
      selected.includes(pos.id) ? { ...pos, dnsh:'pass', mss: pos.aligned?'pass':'n/a' } : pos
    ));
    setSelected([]);
  };

  const openWizard = posId => {
    setDnshWizard({ posId, step:0 });
    setDnshAnswers({});
  };

  const answerWizard = ans => {
    const step = dnshWizard.step;
    const newAns = { ...dnshAnswers, [step]: ans };
    setDnshAnswers(newAns);
    if (step >= DNSH_CRITERIA.length-1) {
      const allPass = Object.values(newAns).every(v => v !== 'fail');
      setPositions(p => p.map(pos => pos.id===dnshWizard.posId
        ? { ...pos, dnsh: allPass?'pass':'fail', mss: pos.aligned&&allPass?'pass':'pending' }
        : pos
      ));
      setDnshWizard(null);
    } else {
      setDnshWizard({ ...dnshWizard, step: step+1 });
    }
  };

  const Th = ({ col, label }) => (
    <th onClick={() => toggleSort(col)} style={{ padding:'8px 10px', textAlign:'left',
      fontSize:11, fontWeight:700, color:T.textSec, cursor:'pointer', whiteSpace:'nowrap',
      borderBottom:`1px solid ${T.border}`, userSelect:'none',
      background: sortBy===col ? T.surfaceH : 'transparent' }}>
      {label} {sortBy===col ? (sortDir==='asc'?'↑':'↓') : ''}
    </th>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Coverage tracker */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10,
        padding:'12px 18px', display:'flex', alignItems:'center', gap:16, boxShadow:T.card }}>
        <div style={{ fontSize:13, color:T.textSec }}>
          DNSH Assessment Coverage:
          <strong style={{ color:T.navy, marginLeft:6 }}>{assessed} of 60</strong>
          <span style={{ color:T.textMut }}> positions assessed</span>
          <strong style={{ color:T.sage, marginLeft:8 }}>({Math.round(assessed/60*100)}%)</strong>
        </div>
        <div style={{ flex:1, height:8, background:T.surfaceH, borderRadius:4, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${(assessed/60)*100}%`,
            background:T.sage, borderRadius:4, transition:'width 0.4s' }} />
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'center' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search by company or NACE…"
          style={{ padding:'6px 12px', borderRadius:8, border:`1px solid ${T.border}`,
            fontSize:12, width:220, color:T.text, outline:'none', background:T.surface }} />
        <select value={filterObj} onChange={e=>setFilterObj(e.target.value)}
          style={{ padding:'6px 10px', borderRadius:8, border:`1px solid ${T.border}`,
            fontSize:12, color:T.text, background:T.surface }}>
          <option value="ALL">All Objectives</option>
          {['CCM','CCA','WTR','CE','PPC','BIO'].map(o=>
            <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={filterAlign} onChange={e=>setFilterAlign(e.target.value)}
          style={{ padding:'6px 10px', borderRadius:8, border:`1px solid ${T.border}`,
            fontSize:12, color:T.text, background:T.surface }}>
          <option value="ALL">All Alignment</option>
          <option value="aligned">Aligned</option>
          <option value="eligible">Eligible only</option>
          <option value="notEligible">Not Eligible</option>
        </select>
        <select value={filterDnsh} onChange={e=>setFilterDnsh(e.target.value)}
          style={{ padding:'6px 10px', borderRadius:8, border:`1px solid ${T.border}`,
            fontSize:12, color:T.text, background:T.surface }}>
          <option value="ALL">All DNSH</option>
          <option value="pass">Pass</option>
          <option value="fail">Fail</option>
          <option value="pending">Pending</option>
        </select>
        {selected.length > 0 && (
          <button onClick={bulkPassDnsh} style={{ padding:'6px 14px', borderRadius:8,
            border:'none', background:T.sage, color:'#fff', fontSize:12, fontWeight:600,
            cursor:'pointer' }}>
            Bulk DNSH Pass ({selected.length})
          </button>
        )}
        <span style={{ fontSize:11, color:T.textMut, marginLeft:'auto' }}>
          Showing {filtered.length} / 60 positions
        </span>
      </div>

      {/* DNSH Wizard */}
      {dnshWizard && (() => {
        const pos = positions.find(p=>p.id===dnshWizard.posId);
        const crit = DNSH_CRITERIA[dnshWizard.step];
        return (
          <div style={{ background:'#fffbf0', border:`2px solid ${T.gold}`, borderRadius:12,
            padding:'20px 24px', boxShadow:T.cardH }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:4 }}>
              DNSH Assessment — {pos?.borrower}
              <span style={{ fontSize:11, color:T.textMut, marginLeft:8 }}>
                Step {dnshWizard.step+1} / {DNSH_CRITERIA.length}
              </span>
            </div>
            <div style={{ fontSize:12, color:T.textSec, marginBottom:14 }}>
              <strong>{crit.label}:</strong> {crit.desc}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              {['pass','fail','n/a'].map(a => (
                <button key={a} onClick={() => answerWizard(a)} style={{
                  padding:'8px 20px', borderRadius:8, border:'none', cursor:'pointer',
                  fontSize:13, fontWeight:700,
                  background: a==='pass'?T.green : a==='fail'?T.red : T.textMut,
                  color:'#fff' }}>
                  {a==='pass'?'Pass — No Harm':a==='fail'?'Fail — Harm':'Not Applicable'}
                </button>
              ))}
              <button onClick={() => setDnshWizard(null)} style={{ marginLeft:'auto',
                padding:'8px 14px', borderRadius:8, border:`1px solid ${T.border}`,
                background:T.surface, color:T.textSec, fontSize:12, cursor:'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        );
      })()}

      {/* Table */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
        boxShadow:T.card, overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:T.surfaceH }}>
              <th style={{ width:36, padding:'8px 10px', borderBottom:`1px solid ${T.border}` }}>
                <input type="checkbox"
                  onChange={e => setSelected(e.target.checked ? filtered.map(p=>p.id) : [])}
                  checked={selected.length===filtered.length && filtered.length>0} />
              </th>
              <Th col="borrower"   label="Borrower" />
              <Th col="nace"       label="NACE" />
              <Th col="tscRef"     label="TSC Ref" />
              <Th col="objective"  label="Objective" />
              <Th col="exposure"   label="Exposure (€M)" />
              <Th col="eligible"   label="Eligible" />
              <Th col="aligned"    label="Aligned" />
              <Th col="dnsh"       label="DNSH" />
              <Th col="mss"        label="MSS" />
              <th style={{ padding:'8px 10px', fontSize:11, fontWeight:700,
                color:T.textSec, borderBottom:`1px solid ${T.border}` }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(pos => (
              <tr key={pos.id} style={{ borderBottom:`1px solid ${T.border}`,
                background: selected.includes(pos.id) ? '#f0f7ff' : 'transparent' }}>
                <td style={{ padding:'7px 10px', textAlign:'center' }}>
                  <input type="checkbox" checked={selected.includes(pos.id)}
                    onChange={() => toggleSel(pos.id)} />
                </td>
                <td style={{ padding:'7px 10px', fontSize:12, fontWeight:600, color:T.navy }}>
                  {pos.borrower}
                </td>
                <td style={{ padding:'7px 10px', fontSize:11, color:T.textSec }}>{pos.nace}</td>
                <td style={{ padding:'7px 10px', fontSize:11 }}>
                  <Pill>{pos.tscRef}</Pill>
                </td>
                <td style={{ padding:'7px 10px', fontSize:11 }}>
                  <Pill color={T.sage} bg="#dcfce7">{pos.objective}</Pill>
                </td>
                <td style={{ padding:'7px 10px', fontSize:12, fontWeight:600, color:T.navy,
                  textAlign:'right' }}>
                  €{pos.exposure}M
                </td>
                <td style={{ padding:'7px 10px', textAlign:'center' }}>
                  <StatusBadge value={pos.eligible?'pass':'fail'} />
                </td>
                <td style={{ padding:'7px 10px', textAlign:'center' }}>
                  <StatusBadge value={pos.aligned?'pass':'fail'} />
                </td>
                <td style={{ padding:'7px 10px', textAlign:'center' }}>
                  <StatusBadge value={pos.dnsh} />
                </td>
                <td style={{ padding:'7px 10px', textAlign:'center' }}>
                  <StatusBadge value={pos.mss} />
                </td>
                <td style={{ padding:'7px 10px' }}>
                  {pos.dnsh === 'pending' && (
                    <button onClick={() => openWizard(pos.id)} style={{
                      padding:'4px 10px', borderRadius:7, border:`1px solid ${T.gold}`,
                      background:'#fef9ee', color:T.amber, fontSize:11, fontWeight:600,
                      cursor:'pointer', whiteSpace:'nowrap' }}>
                      Assess DNSH
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TAB 3: TSC CLASSIFIER ───────────────────────────────────────────────────

function Tab3Classifier() {
  const [sector, setSector]     = useState('energy');
  const [activity, setActivity] = useState('');
  const [country, setCountry]   = useState('DE');
  const [naceSearch, setNaceSearch] = useState('');
  const [result, setResult]     = useState(null);

  const filteredNace = useMemo(() =>
    NACE_TSC_MAP.filter(n =>
      naceSearch==='' ||
      n.code.toLowerCase().includes(naceSearch.toLowerCase()) ||
      n.section.toLowerCase().includes(naceSearch.toLowerCase()) ||
      n.tsc.toLowerCase().includes(naceSearch.toLowerCase())
    ), [naceSearch]);

  const classify = () => {
    const lower = activity.toLowerCase();
    let match = SECTOR_THRESHOLDS[sector]?.find(t =>
      lower.includes(t.activity.toLowerCase().split(' ')[0]) ||
      lower.length > 5
    ) || SECTOR_THRESHOLDS[sector]?.[0];
    if (!match) return;
    setResult({
      objective: match.tsc.startsWith('CCA') ? 'Climate Change Adaptation' : 'Climate Change Mitigation',
      tscRef: match.tsc,
      activity: match.activity,
      threshold: match.threshold,
      dnsh: match.dnsh,
      probability: sector==='energy' ? 94 : sector==='buildings' ? 78 : sector==='transport' ? 82 : 61,
    });
  };

  const sectorData = SECTOR_THRESHOLDS[sector] || [];

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
      {/* Left: Classifier tool */}
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
          padding:'20px 22px', boxShadow:T.card }}>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:16 }}>
            EU Taxonomy Activity Classifier
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec,
                display:'block', marginBottom:5 }}>Sector</label>
              <select value={sector} onChange={e=>{setSector(e.target.value);setResult(null);}}
                style={{ width:'100%', padding:'8px 12px', borderRadius:8,
                  border:`1px solid ${T.border}`, fontSize:13, color:T.text, background:T.surface }}>
                <option value="energy">Energy Generation & Distribution</option>
                <option value="transport">Transport & Mobility</option>
                <option value="manufacturing">Manufacturing & Industry</option>
                <option value="buildings">Buildings & Construction</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec,
                display:'block', marginBottom:5 }}>Activity Description</label>
              <textarea value={activity} onChange={e=>setActivity(e.target.value)}
                placeholder="e.g., Installation of rooftop solar PV panels with 500kW capacity…"
                rows={3} style={{ width:'100%', padding:'8px 12px', borderRadius:8,
                  border:`1px solid ${T.border}`, fontSize:12, color:T.text,
                  background:T.surface, resize:'vertical', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec,
                display:'block', marginBottom:5 }}>Country</label>
              <select value={country} onChange={e=>setCountry(e.target.value)}
                style={{ width:'100%', padding:'8px 12px', borderRadius:8,
                  border:`1px solid ${T.border}`, fontSize:13, color:T.text, background:T.surface }}>
                {['DE','FR','NL','BE','AT','ES','IT','PL','SE','DK'].map(c=>
                  <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={classify} style={{ padding:'10px', borderRadius:9,
              border:'none', background:T.navy, color:'#fff', fontSize:13,
              fontWeight:700, cursor:'pointer' }}>
              Classify Activity
            </button>
          </div>
        </div>

        {result && (
          <div style={{ background:'#f0fdf4', border:`1px solid ${T.sage}`, borderRadius:12,
            padding:'18px 22px', boxShadow:T.card }}>
            <div style={{ fontSize:14, fontWeight:700, color:T.sage, marginBottom:12 }}>
              Classification Result
            </div>
            {[
              ['Objective', result.objective],
              ['TSC Reference', result.tscRef],
              ['Matched Activity', result.activity],
              ['Threshold Requirements', result.threshold],
              ['DNSH Criteria', result.dnsh],
            ].map(([k,v]) => (
              <div key={k} style={{ display:'flex', gap:10, marginBottom:8, fontSize:12 }}>
                <span style={{ fontWeight:700, color:T.textSec, minWidth:160 }}>{k}:</span>
                <span style={{ color:T.text }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop:12, padding:'10px 14px', background:T.surface,
              borderRadius:8, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>
                Estimated Alignment Probability
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ flex:1, height:8, background:T.surfaceH, borderRadius:4 }}>
                  <div style={{ height:'100%', width:`${result.probability}%`,
                    background:result.probability>75?T.sage:T.gold, borderRadius:4 }} />
                </div>
                <span style={{ fontSize:15, fontWeight:800, color:T.sage }}>
                  {result.probability}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Sector pathway thresholds */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
          padding:'18px 22px', boxShadow:T.card }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>
            TSC Thresholds — {sector.charAt(0).toUpperCase()+sector.slice(1)}
          </div>
          {sectorData.map((s,i) => (
            <div key={i} style={{ marginBottom:10, padding:'10px 14px',
              background:T.surfaceH, borderRadius:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                <Pill color={T.sage} bg="#dcfce7">{s.tsc}</Pill>
                <span style={{ fontSize:12, fontWeight:700, color:T.navy }}>{s.activity}</span>
              </div>
              <div style={{ fontSize:11, color:T.textSec }}>{s.threshold}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: NACE browser */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
        padding:'18px 22px', boxShadow:T.card, display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ fontSize:14, fontWeight:700, color:T.navy }}>NACE → EU Taxonomy Mapping</div>
        <input value={naceSearch} onChange={e=>setNaceSearch(e.target.value)}
          placeholder="Search NACE code or sector…"
          style={{ padding:'7px 12px', borderRadius:8, border:`1px solid ${T.border}`,
            fontSize:12, color:T.text, outline:'none' }} />
        <div style={{ overflowY:'auto', maxHeight:520, display:'flex', flexDirection:'column', gap:8 }}>
          {filteredNace.map(n => (
            <div key={n.code} style={{ padding:'10px 14px', background:T.surfaceH,
              borderRadius:8, border:`1px solid ${T.border}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                <Pill>{n.code}</Pill>
                <span style={{ fontSize:12, fontWeight:700, color:T.navy }}>{n.section}</span>
                {n.tsc !== '—' && <Pill color={T.sage} bg="#dcfce7">{n.tsc}</Pill>}
              </div>
              <div style={{ fontSize:11, color:T.textSec }}>{n.threshold}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TAB 4: GAR PATHWAY PLANNER ──────────────────────────────────────────────

function Tab4Pathway() {
  const [target25, setTarget25] = useState(12);
  const [target30, setTarget30] = useState(22);
  const [deals, setDeals]       = useState(DEFAULT_DEALS);
  const [newDeal, setNewDeal]   = useState({ name:'', activity:'', objective:'CCM', exposure:'', alignDate:'2025-Q3' });
  const [smePct, setSmePct]     = useState(45);
  const [nfcPct, setNfcPct]     = useState(62);
  const [dnshPct, setDnshPct]   = useState(68);
  const [scenario, setScenario] = useState('Base');

  const SCENARIOS = {
    Conservative: { pipeline: 0.6, sme: 35, nfc: 50, dnsh: 55 },
    Base:         { pipeline: 1.0, sme: 45, nfc: 62, dnsh: 68 },
    Optimistic:   { pipeline: 1.3, sme: 60, nfc: 75, dnsh: 85 },
  };

  const applyScenario = s => {
    const sc = SCENARIOS[s];
    setScenario(s);
    setSmePct(sc.sme);
    setNfcPct(sc.nfc);
    setDnshPct(sc.dnsh);
  };

  const pipelineAligned = useMemo(() => {
    const sc = SCENARIOS[scenario];
    return deals.filter(d=>d.aligned).reduce((acc,d)=>acc+d.exposure,0)/1000 * sc.pipeline;
  }, [deals, scenario]);

  const currentAligned = 8.4;
  const coveredBase    = 115.1;
  const projGar = +((( currentAligned + pipelineAligned ) / coveredBase)*100).toFixed(1);
  const gap25   = +(target25 - projGar).toFixed(1);
  const gap30   = +(target30 - projGar).toFixed(1);
  const needed25 = +(coveredBase * target25/100 - currentAligned).toFixed(1);

  const addDeal = () => {
    if (!newDeal.name || !newDeal.exposure) return;
    setDeals(d => [...d, { ...newDeal, id: d.length+1,
      exposure: parseFloat(newDeal.exposure), aligned: true }]);
    setNewDeal({ name:'', activity:'', objective:'CCM', exposure:'', alignDate:'2025-Q3' });
  };

  const removeDeal = id => setDeals(d => d.filter(x=>x.id!==id));

  const trendData = histTrend.map(h => ({
    ...h,
    projected: h.year==='2024' ? projGar : h.year==='2025' ? projGar + gap25*0.4 : undefined,
  }));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      {/* Scenario + Targets */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
          padding:'18px 22px', boxShadow:T.card }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:14 }}>
            GAR Targets
          </div>
          {[['2025 GAR Target (%)', target25, setTarget25, 5, 25],
            ['2030 GAR Target (%)', target30, setTarget30, 10, 40]].map(([lbl,val,set,min,max]) => (
            <div key={lbl} style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec,
                display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span>{lbl}</span>
                <strong style={{ color:T.navy }}>{val}%</strong>
              </label>
              <input type="range" min={min} max={max} value={val}
                onChange={e => set(+e.target.value)}
                style={{ width:'100%', accentColor:T.navy }} />
            </div>
          ))}
        </div>

        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
          padding:'18px 22px', boxShadow:T.card }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:14 }}>
            Gap Analysis
          </div>
          <div style={{ fontSize:12, color:T.textSec, marginBottom:8 }}>
            Projected GAR (with pipeline):
            <strong style={{ color:projGar >= target25 ? T.green : T.amber,
              fontSize:18, marginLeft:8 }}>{projGar}%</strong>
          </div>
          <div style={{ padding:'10px 14px', background: gap25 <= 0 ? '#f0fdf4' : '#fff8f0',
            border:`1px solid ${gap25<=0?T.sage:T.gold}`, borderRadius:8, marginBottom:8, fontSize:12 }}>
            Gap to 2025 target: <strong style={{ color: gap25<=0?T.green:T.amber }}>
              {gap25<=0?`On track (+${Math.abs(gap25)}%)`:`${gap25}% gap`}
            </strong>
            {gap25 > 0 && <div style={{ color:T.textSec, marginTop:4 }}>
              Requires €{needed25}bn additional aligned assets
            </div>}
          </div>
          <div style={{ padding:'10px 14px', background:'#eff6ff',
            border:`1px solid #93c5fd`, borderRadius:8, fontSize:12 }}>
            Gap to 2030 target: <strong style={{ color:T.navyL }}>{gap30}% gap</strong>
          </div>
        </div>
      </div>

      {/* Scenario presets */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
        padding:'18px 22px', boxShadow:T.card }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:14 }}>
          Scenario Presets
        </div>
        <div style={{ display:'flex', gap:10, marginBottom:16 }}>
          {Object.keys(SCENARIOS).map(s => (
            <button key={s} onClick={() => applyScenario(s)} style={{
              padding:'8px 20px', borderRadius:8, border:`1px solid ${T.border}`,
              background: scenario===s ? T.navy : T.surface,
              color: scenario===s ? '#fff' : T.textSec,
              fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 0.15s' }}>
              {s}
            </button>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {[
            ['SME clients providing NACE data', smePct, setSmePct],
            ['NFC clients reporting emissions', nfcPct, setNfcPct],
            ['DNSH assessment completion', dnshPct, setDnshPct],
          ].map(([lbl, val, set]) => (
            <div key={lbl}>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec,
                display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span>{lbl}</span><strong style={{ color:T.navy }}>{val}%</strong>
              </label>
              <input type="range" min={0} max={100} value={val}
                onChange={e => { set(+e.target.value); setScenario('Custom'); }}
                style={{ width:'100%', accentColor:T.navyL }} />
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline tracker */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
        padding:'18px 22px', boxShadow:T.card }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>
          Pipeline Deal Tracker
        </div>
        {/* Add deal row */}
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:14,
          padding:'12px 14px', background:T.surfaceH, borderRadius:8 }}>
          <input value={newDeal.name} onChange={e=>setNewDeal(d=>({...d,name:e.target.value}))}
            placeholder="Deal name" style={{ padding:'6px 10px', borderRadius:7,
              border:`1px solid ${T.border}`, fontSize:12, width:180 }} />
          <input value={newDeal.activity} onChange={e=>setNewDeal(d=>({...d,activity:e.target.value}))}
            placeholder="Activity type" style={{ padding:'6px 10px', borderRadius:7,
              border:`1px solid ${T.border}`, fontSize:12, width:160 }} />
          <select value={newDeal.objective} onChange={e=>setNewDeal(d=>({...d,objective:e.target.value}))}
            style={{ padding:'6px 10px', borderRadius:7, border:`1px solid ${T.border}`,
              fontSize:12, color:T.text }}>
            {['CCM','CCA','WTR','CE','PPC','BIO'].map(o=><option key={o}>{o}</option>)}
          </select>
          <input value={newDeal.exposure} onChange={e=>setNewDeal(d=>({...d,exposure:e.target.value}))}
            placeholder="Exposure €M" type="number" style={{ padding:'6px 10px', borderRadius:7,
              border:`1px solid ${T.border}`, fontSize:12, width:120 }} />
          <select value={newDeal.alignDate} onChange={e=>setNewDeal(d=>({...d,alignDate:e.target.value}))}
            style={{ padding:'6px 10px', borderRadius:7, border:`1px solid ${T.border}`,
              fontSize:12, color:T.text }}>
            {['2025-Q1','2025-Q2','2025-Q3','2025-Q4','2026-Q1','2026-Q2'].map(q=><option key={q}>{q}</option>)}
          </select>
          <button onClick={addDeal} style={{ padding:'6px 16px', borderRadius:7,
            border:'none', background:T.sage, color:'#fff', fontSize:12,
            fontWeight:700, cursor:'pointer' }}>+ Add Deal</button>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:T.surfaceH }}>
              {['Deal Name','Activity','Objective','Exposure','Align Date','Aligned',''].map(h => (
                <th key={h} style={{ padding:'7px 10px', textAlign:'left', fontSize:11,
                  fontWeight:700, color:T.textSec, borderBottom:`1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deals.map(d => (
              <tr key={d.id} style={{ borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:'7px 10px', fontSize:12, fontWeight:600, color:T.navy }}>{d.name}</td>
                <td style={{ padding:'7px 10px', fontSize:12, color:T.textSec }}>{d.activity}</td>
                <td style={{ padding:'7px 10px' }}><Pill color={T.sage} bg="#dcfce7">{d.objective}</Pill></td>
                <td style={{ padding:'7px 10px', fontSize:12, fontWeight:700 }}>€{d.exposure}M</td>
                <td style={{ padding:'7px 10px', fontSize:12, color:T.textSec }}>{d.alignDate}</td>
                <td style={{ padding:'7px 10px' }}>
                  <button onClick={() => setDeals(ds => ds.map(x=>x.id===d.id?{...x,aligned:!x.aligned}:x))}
                    style={{ padding:'3px 10px', borderRadius:6, border:'none', cursor:'pointer',
                      fontSize:11, fontWeight:700,
                      background:d.aligned?'#dcfce7':'#fee2e2',
                      color:d.aligned?T.green:T.red }}>
                    {d.aligned ? 'Aligned' : 'Not Aligned'}
                  </button>
                </td>
                <td style={{ padding:'7px 10px' }}>
                  <button onClick={() => removeDeal(d.id)} style={{ padding:'3px 8px',
                    borderRadius:6, border:`1px solid ${T.border}`, background:T.surface,
                    color:T.red, fontSize:11, cursor:'pointer' }}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background:T.surfaceH }}>
              <td colSpan={3} style={{ padding:'8px 10px', fontSize:12, fontWeight:700, color:T.navy }}>
                Pipeline Total (aligned deals)
              </td>
              <td style={{ padding:'8px 10px', fontSize:12, fontWeight:800, color:T.sage }}>
                €{deals.filter(d=>d.aligned).reduce((a,d)=>a+d.exposure,0).toFixed(1)}M
              </td>
              <td colSpan={3} style={{ padding:'8px 10px', fontSize:12, color:T.textSec }}>
                Projected GAR uplift: <strong style={{ color:T.sage }}>+{(pipelineAligned/coveredBase*100).toFixed(2)}%</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pathway chart */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
        padding:'18px 22px', boxShadow:T.card }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>
          GAR Pathway (Historical + Projected)
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData} margin={{ top:0, right:20, bottom:0, left:-10 }}>
            <XAxis dataKey="year" tick={{ fontSize:11, fill:T.textSec }} />
            <YAxis tick={{ fontSize:10, fill:T.textMut }} unit="%" />
            <Tooltip formatter={v=>`${v}%`} />
            <Legend wrapperStyle={{ fontSize:11 }} />
            <Line type="monotone" dataKey="gar" stroke={T.navy} strokeWidth={2.5}
              name="Actual GAR" dot={{ r:3 }} connectNulls={false} />
            <Line type="monotone" dataKey="target" stroke={T.gold} strokeWidth={2}
              strokeDasharray="6 4" name="Target" dot={false} connectNulls />
            <Line type="monotone" dataKey="projected" stroke={T.sage} strokeWidth={2}
              strokeDasharray="4 2" name="Projected" dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function GreenAssetRatioPage() {
  const [tab, setTab]               = useState(0);
  const [activeYear, setActiveYear] = useState('2024');
  const [entityScope, setEntityScope] = useState('Consolidated Group');

  const TABS = [
    'GAR Dashboard',
    'Asset-Level TSC Assessment',
    'TSC Activity Classifier',
    'GAR Pathway Planner',
  ];

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:T.font, padding:'28px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:T.sage }} />
          <span style={{ fontSize:11, fontWeight:700, color:T.textMut,
            textTransform:'uppercase', letterSpacing:'0.08em' }}>
            EU Taxonomy · CRR Art. 449a
          </span>
        </div>
        <h1 style={{ fontSize:26, fontWeight:800, color:T.navy, margin:0 }}>
          Green Asset Ratio (GAR)
        </h1>
        <p style={{ fontSize:13, color:T.textSec, margin:'6px 0 0' }}>
          EU Taxonomy alignment reporting — Technical Screening Criteria, DNSH &amp; MSS assessment
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:2, marginBottom:24, background:T.surface,
        border:`1px solid ${T.border}`, borderRadius:12, padding:4 }}>
        {TABS.map((t,i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            flex:1, padding:'9px 14px', borderRadius:9, border:'none', cursor:'pointer',
            fontSize:12, fontWeight:600, transition:'all 0.15s',
            background: tab===i ? T.navy : 'transparent',
            color: tab===i ? '#fff' : T.textSec,
          }}>{t}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 0 && (
        <Tab1Dashboard
          activeYear={activeYear} setActiveYear={setActiveYear}
          entityScope={entityScope} setEntityScope={setEntityScope}
        />
      )}
      {tab === 1 && <Tab2AssetLevel />}
      {tab === 2 && <Tab3Classifier />}
      {tab === 3 && <Tab4Pathway />}
    </div>
  );
}
