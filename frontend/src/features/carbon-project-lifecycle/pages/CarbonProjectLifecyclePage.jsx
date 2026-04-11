import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── Static reference data ──────────────────────────────────────────────────────
const STAGES = ['Conception','PDD Development','Validation','Registration','Monitoring','Verification','Issuance','Renewal/Expired'];
const STAGE_COLORS = [T.textSec, T.blue, T.amber, T.indigo, T.teal, T.purple, T.green, T.sage];
const REGISTRIES   = ['Verra VCS','Gold Standard','CDM','ACR','CAR'];
const METHODOLOGIES= ['VM0007','ACM0002','GS-METH-COOK','VM0015','ACM0006','AMS-I.D','VM0042','AMS-III.D','VM0011','ACM0001','VM0017','AMS-II.G','VM0021','GS-METH-WIND','ACM0012'];
const VVBS         = ['Bureau Veritas','SGS','TÜV SÜD','DNV','RINA','Intertek','LRQA','ERM CVS'];
const COUNTRIES    = ['India','Kenya','Brazil','Colombia','Indonesia','Ethiopia','Peru','Ghana','Vietnam','Morocco','Cambodia','Uganda','Chile','Mexico','Rwanda'];
const SECTORS      = ['Solar PV','Wind','Cookstove','REDD+','Biogas','Landfill Gas','Run-of-River Hydro','Reforestation','Livestock Methane','EE Buildings','EE Industry','Mangrove','Agricultural Soil','Urban Transit','Geothermal'];
const CRED_PERIOD_YRS = [7, 10, 7, 10, 20, 7, 10, 10, 7, 10, 7, 10, 30, 10, 10];
const VCU_TYPES    = ['VCU','GS-VER','CER','ACER','CRT'];

// ── Generate 60 projects across all lifecycle stages ──────────────────────────
const PROJECTS = Array.from({ length: 60 }, (_, i) => {
  const stage            = STAGES[i % STAGES.length];
  const registry         = REGISTRIES[i % REGISTRIES.length];
  const methodology      = METHODOLOGIES[i % METHODOLOGIES.length];
  const country          = COUNTRIES[i % COUNTRIES.length];
  const sector           = SECTORS[i % SECTORS.length];
  const vvb              = VVBS[i % VVBS.length];
  const estAnnualCredits = Math.round(5000 + sr(i * 13) * 95000);
  const cpYrs            = CRED_PERIOD_YRS[i % CRED_PERIOD_YRS.length];
  const cpStartYear      = 2018 + Math.floor(sr(i * 7) * 7);
  const totalExpected    = estAnnualCredits * cpYrs;
  const issued           = stage === 'Issuance' || stage === 'Renewal/Expired' || stage === 'Verification'
    ? Math.round(totalExpected * (0.3 + sr(i * 11) * 0.5))
    : stage === 'Monitoring' ? Math.round(totalExpected * (0.1 + sr(i * 11) * 0.2)) : 0;
  const pctComplete      = Math.round(10 + sr(i * 17) * 88);
  const nextMilestone    = ['PDD finalization','Validation submission','EB review period','Monitoring report','VVB site visit','Issuance request','Crediting period renewal','Archive'][STAGES.indexOf(stage)];
  const daysSinceLast    = Math.round(5 + sr(i * 19) * 90);
  const pddComplete      = stage === 'Conception' ? Math.round(10 + sr(i * 23) * 30) : Math.round(50 + sr(i * 23) * 50);
  const carsOpen         = stage === 'Validation' || stage === 'Verification' ? Math.floor(sr(i * 29) * 4) : 0;
  const carsClosed       = Math.floor(sr(i * 31) * 6);
  const creditType       = VCU_TYPES[i % VCU_TYPES.length];
  return {
    id: i + 1,
    projectCode: `${country.substring(0,3).toUpperCase()}-${methodology.substring(0,4).toUpperCase()}-${String(cpStartYear).slice(-2)}-${String(i + 1).padStart(3,'0')}`,
    name: `${country} ${sector} Project ${String(i + 1).padStart(2,'0')}`,
    methodology, country, sector, stage, registry, vvb,
    estimatedAnnualCredits: estAnnualCredits,
    creditingPeriodYrs: cpYrs,
    creditingPeriodStart: cpStartYear,
    creditingPeriodEnd: cpStartYear + cpYrs,
    totalExpected, issued,
    pctComplete,
    nextMilestone,
    daysSinceLast,
    pddComplete,
    carsOpen,
    carsClosed,
    creditType,
    validationStatus: ['Not Started','Submitted','Under Review','CARs Raised','Completed'][Math.floor(sr(i * 41) * 5)],
    verificationStatus: stage === 'Verification' || stage === 'Issuance' ? ['Scheduled','In Progress','Completed'][Math.floor(sr(i * 43) * 3)] : 'N/A',
  };
});

// ── Shared style primitives ────────────────────────────────────────────────────
const kpi  = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', minWidth: 155 };
const tH   = { padding: '9px 12px', background: T.sub, color: T.textSec, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' };
const tD   = { padding: '8px 12px', fontSize: 12, borderBottom: `1px solid ${T.borderL}`, color: T.textPri };
const card = (extra = {}) => ({ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 22, marginBottom: 18, ...extra });
const badge = (color, text) => (
  <span style={{ background: color + '18', color, border: `1px solid ${color}40`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{text}</span>
);
const TABS = ['Pipeline Dashboard','PDD Builder Checklist','Validation Workflow','Registration & CDM EB','Monitoring & MRV','Verification Schedule','Credit Issuance Registry','Crediting Period & Renewal'];

// ── Tab 1: Pipeline Dashboard ─────────────────────────────────────────────────
function Tab1({ projects }) {
  const stageCounts = STAGES.map(s => ({ stage: s, count: projects.filter(p => p.stage === s).length, credits: projects.filter(p => p.stage === s).reduce((a, p) => a + p.estimatedAnnualCredits, 0) }));
  const total        = projects.length;
  const pipeline     = projects.reduce((a, p) => a + p.totalExpected, 0);
  const issuedYTD    = projects.reduce((a, p) => a + p.issued, 0);
  const overdue      = projects.filter(p => p.daysSinceLast > 30).length;
  const avgCycle     = Math.round(projects.reduce((a, p) => a + p.daysSinceLast, 0) / Math.max(1, projects.length));
  const npv          = (issuedYTD * 12 / 1e6).toFixed(1);
  const maxCount     = Math.max(1, ...stageCounts.map(s => s.count));
  return (
    <div>
      <div style={{ color:T.navy, fontWeight:700, fontSize:15, marginBottom:4 }}>UNFCCC CDM Project Cycle | Gold Standard v4.0 | Verra VCS v4.0 Project Registry</div>
      <div style={{ color:T.textSec, fontSize:12, marginBottom:20 }}>Full lifecycle pipeline across 8 stages. 60 projects tracked across CDM, GS, VCS, ACR, and CAR registries.</div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
        {[
          ['Total Projects',          String(total),                         T.navy],
          ['Credits in Pipeline',     (pipeline / 1e6).toFixed(1) + 'M tCO₂e', T.blue],
          ['Credits Issued (Total)',   issuedYTD.toLocaleString() + ' tCO₂e', T.green],
          ['Projects Overdue (>30d)', String(overdue),                       T.red],
          ['Avg Days Since Action',   String(avgCycle) + ' days',            T.amber],
          ['Portfolio NPV (@$12/t)',  '$' + npv + 'M',                       T.gold],
        ].map(([l, v, c]) => (
          <div key={l} style={kpi}><div style={{ color:T.textSec, fontSize:11, marginBottom:4 }}>{l}</div><div style={{ color:c, fontFamily:T.fontMono, fontSize:18, fontWeight:700 }}>{v}</div></div>
        ))}
      </div>
      {/* Stage funnel */}
      <div style={card()}>
        <div style={{ color:T.textSec, fontSize:11, fontWeight:700, marginBottom:14, textTransform:'uppercase' }}>Stage Pipeline — Credit Development Funnel</div>
        {stageCounts.map((s, i) => (
          <div key={s.stage} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
            <div style={{ width:140, fontSize:12, fontWeight:600, color:STAGE_COLORS[i] }}>{s.stage}</div>
            <div style={{ flex:1, background:T.borderL, borderRadius:6, height:28, position:'relative' }}>
              <div style={{ height:'100%', width:`${(s.count / maxCount) * 100}%`, background:STAGE_COLORS[i], borderRadius:6, opacity:0.75, minWidth: s.count > 0 ? 6 : 0 }} />
            </div>
            <div style={{ width:28, textAlign:'right', fontFamily:T.fontMono, fontSize:12, fontWeight:700, color:STAGE_COLORS[i] }}>{s.count}</div>
            <div style={{ width:140, fontFamily:T.fontMono, fontSize:11, color:T.textSec, textAlign:'right' }}>{s.credits.toLocaleString()} tCO₂e/yr</div>
          </div>
        ))}
      </div>
      {/* Project register */}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Code','Project','Country','Registry','Stage','VVB','Est. Annual CR','% Complete','Next Milestone','Days Idle'].map(h => <th key={h} style={tH}>{h}</th>)}</tr></thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} style={{ background: p.daysSinceLast > 30 ? T.red + '05' : 'transparent' }}>
                <td style={{ ...tD, fontFamily:T.fontMono, fontSize:11 }}>{p.projectCode}</td>
                <td style={{ ...tD, fontWeight:600, color:T.navy, maxWidth:200 }}>{p.name}</td>
                <td style={tD}>{p.country}</td>
                <td style={tD}>{badge(T.indigo, p.registry)}</td>
                <td style={tD}>{badge(STAGE_COLORS[STAGES.indexOf(p.stage)] || T.textSec, p.stage)}</td>
                <td style={{ ...tD, fontSize:11 }}>{p.vvb}</td>
                <td style={{ ...tD, fontFamily:T.fontMono }}>{p.estimatedAnnualCredits.toLocaleString()}</td>
                <td style={tD}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:60, background:T.borderL, borderRadius:4, height:8 }}>
                      <div style={{ width:`${p.pctComplete}%`, height:'100%', background: p.pctComplete > 70 ? T.green : p.pctComplete > 40 ? T.amber : T.blue, borderRadius:4 }} />
                    </div>
                    <span style={{ fontFamily:T.fontMono, fontSize:11 }}>{p.pctComplete}%</span>
                  </div>
                </td>
                <td style={{ ...tD, fontSize:11, color:T.textSec }}>{p.nextMilestone}</td>
                <td style={{ ...tD, fontFamily:T.fontMono, color: p.daysSinceLast > 30 ? T.red : T.textPri, fontWeight: p.daysSinceLast > 30 ? 700 : 400 }}>{p.daysSinceLast}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab 2: PDD Builder Checklist ──────────────────────────────────────────────
const PDD_SECTIONS = [
  { id:'A', title:'Project Activity Description', weight:15, items:[
    { id:'A.1', label:'Project title and reference number' },
    { id:'A.2', label:'Project activity location (GPS coordinates)' },
    { id:'A.3', label:'Technologies / measures employed' },
    { id:'A.4', label:'Project parties and stakeholders identified' },
    { id:'A.5', label:'Public funding sources (ODA check completed)' },
  ]},
  { id:'B', title:'Application of Methodology', weight:25, items:[
    { id:'B.1', label:'Methodology reference and version confirmed' },
    { id:'B.2', label:'Applicability conditions satisfied and documented' },
    { id:'B.3', label:'Project boundary defined (sources / sinks / GHGs)' },
    { id:'B.4', label:'Baseline scenario identified and justified' },
    { id:'B.5', label:'Additionality demonstrated (regulatory surplus / investment / barriers)' },
  ]},
  { id:'C', title:'Duration / Crediting Period', weight:10, items:[
    { id:'C.1', label:'Project activity start date established' },
    { id:'C.2', label:'Crediting period type selected (renewable / fixed)' },
    { id:'C.3', label:'Crediting period length specified and justified' },
  ]},
  { id:'D', title:'Monitoring Plan', weight:25, items:[
    { id:'D.1', label:'Data and parameters to be monitored identified' },
    { id:'D.2', label:'Monitoring frequency and measurement method specified' },
    { id:'D.3', label:'QA/QC procedures documented' },
    { id:'D.4', label:'Data management system and archiving described' },
  ]},
  { id:'E', title:'Quantification of Emission Reductions', weight:15, items:[
    { id:'E.1', label:'Formulae for ER calculation provided' },
    { id:'E.2', label:'Estimate of ER per monitoring period included' },
    { id:'E.3', label:'Leakage sources identified and calculated' },
  ]},
  { id:'F', title:'Environmental Impact', weight:5, items:[
    { id:'F.1', label:'Environmental impacts analysis conducted' },
    { id:'F.2', label:'EIA requirements checked (national legislation)' },
  ]},
  { id:'G', title:'Stakeholder Comments', weight:5, items:[
    { id:'G.1', label:'Local stakeholder consultation conducted' },
    { id:'G.2', label:'Comment period of minimum 28 days provided' },
    { id:'G.3', label:'Written response to all comments prepared' },
  ]},
];

function Tab2({ projects }) {
  const [selIdx, setSelIdx] = useState(0);
  const proj = projects[selIdx];
  const initChecked = useMemo(() => {
    const obj = {};
    PDD_SECTIONS.forEach(sec => sec.items.forEach((item, j) => { obj[item.id] = sr(selIdx * 100 + sec.id.charCodeAt(0) + j) > 0.4; }));
    return obj;
  }, [selIdx]);
  const [checked, setChecked] = useState(initChecked);
  const toggle = id => setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  const sectionScore = sec => {
    const done = sec.items.filter(item => checked[item.id]).length;
    return sec.items.length > 0 ? (done / sec.items.length * 100) : 0;
  };
  const totalItems = PDD_SECTIONS.reduce((a, s) => a + s.items.length, 0);
  const doneItems  = PDD_SECTIONS.reduce((a, s) => a + s.items.filter(item => checked[item.id]).length, 0);
  const totalScore = totalItems > 0 ? (doneItems / totalItems * 100) : 0;
  return (
    <div>
      <div style={{ color:T.navy, fontWeight:700, fontSize:15, marginBottom:4 }}>Project Design Document — CDM Simplified PDD (SSC) v3 | CDM Standard PDD v4</div>
      <div style={{ color:T.textSec, fontSize:12, marginBottom:16 }}>PDD section completion tracker. Weights reflect regulatory importance. Missing items highlighted red.</div>
      <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:20, flexWrap:'wrap' }}>
        <div>
          <label style={{ fontSize:12, color:T.textSec, marginRight:8 }}>Project:</label>
          <select value={selIdx} onChange={e => { setSelIdx(+e.target.value); setChecked({}); }} style={{ border:`1px solid ${T.border}`, borderRadius:6, padding:'6px 10px', fontSize:12, background:T.card }}>
            {projects.map((p, i) => <option key={i} value={i}>{p.name}</option>)}
          </select>
        </div>
        <div style={kpi}>
          <div style={{ color:T.textSec, fontSize:11, marginBottom:4 }}>Overall PDD Completeness</div>
          <div style={{ color: totalScore > 80 ? T.green : totalScore > 50 ? T.amber : T.red, fontFamily:T.fontMono, fontSize:20, fontWeight:700 }}>{totalScore.toFixed(0)}%</div>
          <div style={{ marginTop:6, background:T.borderL, borderRadius:4, height:8 }}>
            <div style={{ width:`${totalScore}%`, height:'100%', background: totalScore > 80 ? T.green : totalScore > 50 ? T.amber : T.red, borderRadius:4, transition:'width 0.3s' }} />
          </div>
        </div>
        {badge(proj.stage === 'PDD Development' || proj.stage === 'Validation' ? T.green : T.amber, `Stage: ${proj.stage}`)}
        {badge(T.indigo, proj.registry)}
      </div>
      {PDD_SECTIONS.map(sec => {
        const score = sectionScore(sec);
        const done  = sec.items.filter(item => checked[item.id]).length;
        return (
          <div key={sec.id} style={card()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div>
                <span style={{ color:T.navy, fontWeight:700, fontSize:13 }}>Section {sec.id}: {sec.title}</span>
                <span style={{ color:T.textSec, fontSize:11, marginLeft:10 }}>Weight: {sec.weight}%</span>
              </div>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <span style={{ fontFamily:T.fontMono, fontSize:12, color: score === 100 ? T.green : score > 50 ? T.amber : T.red, fontWeight:700 }}>{done}/{sec.items.length} ({score.toFixed(0)}%)</span>
                {badge(score === 100 ? T.green : score > 50 ? T.amber : T.red, score === 100 ? 'COMPLETE' : 'INCOMPLETE')}
              </div>
            </div>
            <div style={{ background:T.borderL, borderRadius:4, height:6, marginBottom:14 }}>
              <div style={{ width:`${score}%`, height:'100%', background: score === 100 ? T.green : T.amber, borderRadius:4, transition:'width 0.3s' }} />
            </div>
            {sec.items.map(item => (
              <div key={item.id} onClick={() => toggle(item.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 6px', borderRadius:6, cursor:'pointer', marginBottom:2, background: !checked[item.id] ? T.red + '05' : 'transparent', border: !checked[item.id] ? `1px solid ${T.red}20` : `1px solid transparent` }}>
                <div style={{ width:18, height:18, border:`2px solid ${checked[item.id] ? T.green : T.red}`, borderRadius:4, background: checked[item.id] ? T.green : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {checked[item.id] && <span style={{ color:'#fff', fontSize:11, fontWeight:700 }}>✓</span>}
                </div>
                <span style={{ fontSize:12, fontFamily:T.fontMono, color:T.textSec, minWidth:30 }}>{item.id}</span>
                <span style={{ fontSize:12, color: checked[item.id] ? T.textPri : T.red, textDecoration: checked[item.id] ? 'none' : 'none' }}>{item.label}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── Tab 3: Validation Workflow ────────────────────────────────────────────────
const VAL_STAGES = [
  { name:'1. Pre-screening',            target:5,  desc:'Initial eligibility and methodology applicability check' },
  { name:'2. Document completeness',    target:10, desc:'PDD, supporting docs, host country LoA, evidence of additionality' },
  { name:'3. On-site visit',            target:7,  desc:'Physical inspection of project site and equipment (if required)' },
  { name:'4. Desk review',              target:18, desc:'Technical review of methodology application and ER calculations' },
  { name:'5. CARs/CLs resolution',      target:15, desc:'Issuing and resolving corrective action requests and clarifications' },
  { name:'6. Validation report',        target:5,  desc:'Draft and final validation report issued by VVB' },
  { name:'7. Registration decision',    target:10, desc:'Standard body review period; registration or rejection issued' },
];

function Tab3({ projects }) {
  const [selIdx, setSelIdx] = useState(0);
  const valProjects = projects.filter(p => p.stage === 'Validation' || p.stage === 'PDD Development' || p.stage === 'Registration');
  const viewProj = valProjects[selIdx % Math.max(1, valProjects.length)] || projects[0];
  const currentStageIdx = Math.floor(sr(selIdx * 53) * VAL_STAGES.length);
  const daysInStage = Math.round(5 + sr(selIdx * 59) * 30);
  return (
    <div>
      <div style={{ color:T.navy, fontWeight:700, fontSize:15, marginBottom:4 }}>Validation Workflow — CDM Standard v7 | Gold Standard Preliminary Review | VCS Standard v4</div>
      <div style={{ color:T.textSec, fontSize:12, marginBottom:20 }}>Validation pipeline SLA tracking. Overdue stages (&gt;SLA days) highlighted red. CARs and CLs tracked per project.</div>
      {/* Validation table */}
      <div style={{ overflowX:'auto', marginBottom:24 }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Project','Registry','VVB','Submission','Val Stage','CARs Open','CARs Closed','CLs','Due Date','Status'].map(h => <th key={h} style={tH}>{h}</th>)}</tr></thead>
          <tbody>
            {projects.filter(p => ['Validation','PDD Development','Registration'].includes(p.stage)).slice(0, 20).map((p, i) => {
              const stIdx   = Math.floor(sr(i * 53) * VAL_STAGES.length);
              const daysIn  = Math.round(5 + sr(i * 59) * 30);
              const target  = VAL_STAGES[stIdx]?.target || 10;
              const overdue = daysIn > target;
              const submDate = `${2023 + Math.floor(sr(i * 61) * 2)}-${String(Math.ceil(sr(i * 67) * 12)).padStart(2,'0')}-${String(Math.ceil(sr(i * 71) * 28)).padStart(2,'0')}`;
              const dueDate  = `${2024 + Math.floor(sr(i * 73) * 2)}-${String(Math.ceil(sr(i * 79) * 12)).padStart(2,'0')}-${String(Math.ceil(sr(i * 83) * 28)).padStart(2,'0')}`;
              return (
                <tr key={p.id} style={{ background: overdue ? T.red + '06' : 'transparent' }}>
                  <td style={{ ...tD, fontWeight:600, color:T.navy, maxWidth:180 }}>{p.name}</td>
                  <td style={tD}>{badge(T.indigo, p.registry)}</td>
                  <td style={{ ...tD, fontSize:11 }}>{p.vvb}</td>
                  <td style={{ ...tD, fontFamily:T.fontMono, fontSize:11 }}>{submDate}</td>
                  <td style={{ ...tD, fontSize:11, color:T.blue }}>{VAL_STAGES[stIdx]?.name}</td>
                  <td style={{ ...tD, fontFamily:T.fontMono, color: p.carsOpen > 0 ? T.red : T.green, fontWeight:700 }}>{p.carsOpen}</td>
                  <td style={{ ...tD, fontFamily:T.fontMono }}>{p.carsClosed}</td>
                  <td style={{ ...tD, fontFamily:T.fontMono }}>{Math.floor(sr(i * 89) * 3)}</td>
                  <td style={{ ...tD, fontFamily:T.fontMono, fontSize:11 }}>{dueDate}</td>
                  <td style={tD}>{badge(overdue ? T.red : p.carsOpen > 0 ? T.amber : T.green, overdue ? 'OVERDUE' : p.carsOpen > 0 ? 'CARs OPEN' : 'ON TRACK')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Gantt-style validation timeline */}
      <div style={{ marginBottom:14 }}>
        <label style={{ fontSize:12, color:T.textSec, marginRight:8 }}>Validation Timeline for:</label>
        <select value={selIdx} onChange={e => setSelIdx(+e.target.value)} style={{ border:`1px solid ${T.border}`, borderRadius:6, padding:'6px 10px', fontSize:12, background:T.card }}>
          {projects.filter(p => ['Validation','PDD Development','Registration'].includes(p.stage)).map((p, i) => <option key={i} value={i}>{p.name}</option>)}
        </select>
      </div>
      <div style={card()}>
        <div style={{ color:T.textSec, fontSize:11, fontWeight:700, marginBottom:14, textTransform:'uppercase' }}>Gantt — Validation Stage Timeline</div>
        {VAL_STAGES.map((s, i) => {
          const done    = i < currentStageIdx;
          const active  = i === currentStageIdx;
          const pending = i > currentStageIdx;
          const overdue = active && daysInStage > s.target;
          const barColor = done ? T.green : overdue ? T.red : active ? T.blue : T.borderL;
          const barPct   = active ? Math.min(100, (daysInStage / s.target) * 100) : done ? 100 : 0;
          return (
            <div key={s.name} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:24, height:24, borderRadius:'50%', background: done ? T.green : active ? T.blue : T.borderL, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ color:'#fff', fontSize:10, fontWeight:700 }}>{done ? '✓' : i + 1}</span>
              </div>
              <div style={{ width:220, fontSize:12, fontWeight: active ? 700 : 400, color: active ? T.navy : pending ? T.textSec : T.textPri }}>{s.name}</div>
              <div style={{ flex:1, background:T.borderL, borderRadius:4, height:18, position:'relative' }}>
                <div style={{ width:`${barPct}%`, height:'100%', background:barColor, borderRadius:4, opacity:0.8, transition:'width 0.3s' }} />
              </div>
              <div style={{ width:60, fontFamily:T.fontMono, fontSize:11, color:T.textSec, textAlign:'right' }}>
                {active ? `${daysInStage}/${s.target}d` : done ? `✓ ${s.target}d` : `${s.target}d SLA`}
              </div>
              {active && overdue && badge(T.red, 'OVERDUE')}
              {active && !overdue && badge(T.blue, 'IN PROGRESS')}
              {done   && badge(T.green, 'DONE')}
            </div>
          );
        })}
        <div style={{ marginTop:10, fontSize:11, color:T.textSec }}>
          VVB: <strong>{viewProj.vvb}</strong> | Registry: <strong>{viewProj.registry}</strong> | CARs open: <strong style={{ color: viewProj.carsOpen > 0 ? T.red : T.green }}>{viewProj.carsOpen}</strong> | CARs closed: <strong>{viewProj.carsClosed}</strong>
        </div>
      </div>
    </div>
  );
}

// ── Tab 4: Registration & CDM EB ──────────────────────────────────────────────
const REG_MILESTONES_CDM = ['PDD submitted to EB','Public comment period (28 days)','EB review period (8 weeks)','Objection window closes','Registration decision issued'];
const REG_MILESTONES_GS  = ['PDD submitted to GS','TS technical review','Public consultation (28 days)','GS council decision','Registered on GS Registry'];
const REG_MILESTONES_VCS = ['PDD submitted to Verra','VVB double-peer review','VCS programme review','Registration on Verra Registry','VERRA serial number assigned'];
const DOCS_REQUIRED = ['Final approved PDD','Validation report (VVB signed)','Host country LoA (DoE confirmed)','Confirmation no ODA assistance','Environmental impact assessment (if applicable)'];

function Tab4({ projects }) {
  const regProjects = projects.filter(p => p.stage === 'Registration' || p.stage === 'Validation' || p.stage === 'Issuance');
  const milestoneMap = { CDM: REG_MILESTONES_CDM, 'Gold Standard': REG_MILESTONES_GS, 'Verra VCS': REG_MILESTONES_VCS };
  const getMilestones = reg => milestoneMap[reg] || REG_MILESTONES_VCS;
  return (
    <div>
      <div style={{ color:T.navy, fontWeight:700, fontSize:15, marginBottom:4 }}>Registration & CDM EB — UNFCCC CDM Registration | Gold Standard Registration | VCS Registration</div>
      <div style={{ color:T.textSec, fontSize:12, marginBottom:20 }}>Registration milestone tracker. Serial number formats, UNFCCC project IDs, and required documentation per registry.</div>
      {/* Registration standards comparison */}
      <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:24 }}>
        {[
          { std:'CDM', milestones:REG_MILESTONES_CDM, cycle:'~16 weeks', serial:'CDM-[Country]-[Method]-[Year]-[Seq]', color:T.blue },
          { std:'Gold Standard', milestones:REG_MILESTONES_GS, cycle:'~10 weeks', serial:'GS-[Country]-[Project ID]', color:T.gold },
          { std:'Verra VCS', milestones:REG_MILESTONES_VCS, cycle:'~6 weeks', serial:'VCS-[Country]-[Year]-[Seq]', color:T.green },
        ].map(s => (
          <div key={s.std} style={{ background:T.card, border:`1px solid ${s.color}40`, borderRadius:10, padding:'16px 20px', flex:1, minWidth:220 }}>
            <div style={{ color:s.color, fontWeight:700, fontSize:14, marginBottom:8 }}>{s.std}</div>
            <div style={{ color:T.textSec, fontSize:11, marginBottom:6 }}>Typical cycle: <strong style={{ color:T.textPri }}>{s.cycle}</strong></div>
            <div style={{ color:T.textSec, fontSize:10, fontFamily:T.fontMono, marginBottom:10 }}>Serial: {s.serial}</div>
            {s.milestones.map((m, i) => (
              <div key={i} style={{ display:'flex', gap:8, marginBottom:5, fontSize:11 }}>
                <span style={{ color:s.color, fontWeight:700, flexShrink:0 }}>{i + 1}.</span>
                <span style={{ color:T.textSec }}>{m}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Documents required */}
      <div style={card()}>
        <div style={{ color:T.navy, fontWeight:700, fontSize:13, marginBottom:10 }}>Documents Required at Registration (all registries)</div>
        {DOCS_REQUIRED.map((doc, i) => (
          <div key={i} style={{ display:'flex', gap:10, padding:'6px 0', borderBottom: i < DOCS_REQUIRED.length - 1 ? `1px solid ${T.borderL}` : 'none', alignItems:'center' }}>
            <span style={{ color:T.green, fontWeight:700, fontSize:13 }}>✓</span>
            <span style={{ fontSize:12, color:T.textPri }}>{doc}</span>
          </div>
        ))}
      </div>
      {/* Per-project milestone tracker */}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Project','Registry','Serial Reference','UNFCCC ID','Stage','Submitted','Decision Due','Status'].map(h => <th key={h} style={tH}>{h}</th>)}</tr></thead>
          <tbody>
            {regProjects.slice(0, 20).map((p, i) => {
              const milestones = getMilestones(p.registry);
              const msIdx = Math.floor(sr(i * 97) * milestones.length);
              const year  = p.creditingPeriodStart;
              const serial = p.registry === 'CDM'
                ? `CDM-${p.country.substring(0,3).toUpperCase()}-${p.methodology}-${year}-${String(p.id).padStart(3,'0')}`
                : p.registry === 'Gold Standard'
                ? `GS${year}-${String(p.id).padStart(5,'0')}`
                : `VCS${year}-${String(p.id).padStart(6,'0')}`;
              const submitted = `${2022 + Math.floor(sr(i * 101) * 3)}-${String(Math.ceil(sr(i * 103) * 12)).padStart(2,'0')}-15`;
              const due       = `${2023 + Math.floor(sr(i * 107) * 3)}-${String(Math.ceil(sr(i * 109) * 12)).padStart(2,'0')}-15`;
              const statusColors = [T.textSec, T.amber, T.blue, T.orange, T.green];
              const statusLabels = ['Not Submitted','Under Review','EB Review','Objection Window','Registered'];
              const statusIdx = Math.floor(sr(i * 113) * 5);
              return (
                <tr key={p.id}>
                  <td style={{ ...tD, fontWeight:600, color:T.navy }}>{p.name.substring(0, 25)}</td>
                  <td style={tD}>{badge(T.indigo, p.registry)}</td>
                  <td style={{ ...tD, fontFamily:T.fontMono, fontSize:10 }}>{serial}</td>
                  <td style={{ ...tD, fontFamily:T.fontMono, fontSize:10 }}>UNFCCC-{String(p.id * 137 + 10000).substring(1)}</td>
                  <td style={{ ...tD, fontSize:11 }}>{milestones[msIdx]}</td>
                  <td style={{ ...tD, fontFamily:T.fontMono, fontSize:11 }}>{submitted}</td>
                  <td style={{ ...tD, fontFamily:T.fontMono, fontSize:11 }}>{due}</td>
                  <td style={tD}>{badge(statusColors[statusIdx], statusLabels[statusIdx])}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab 5: Monitoring & MRV ───────────────────────────────────────────────────
const EQUIPMENT_TYPES = ['Smart meter','Flow meter','Weighbridge','Gas analyser','Weather station','Fuel flow meter','Water meter','Biomass scale'];
const FREQUENCIES     = ['Continuous','Daily','Monthly','Quarterly','Annual'];
const CAL_INTERVALS   = ['6 months','12 months','24 months'];

function Tab5({ projects }) {
  const [selIdx, setSelIdx] = useState(0);
  const proj = projects[selIdx];
  const params = Array.from({ length: 6 }, (_, p) => {
    const lastCal = new Date(2024, Math.floor(sr(selIdx * 200 + p) * 12), 1);
    const calMonths = [6, 12, 24][Math.floor(sr(selIdx * 201 + p) * 3)];
    const nextCal = new Date(lastCal); nextCal.setMonth(nextCal.getMonth() + calMonths);
    const status = sr(selIdx * 202 + p) > 0.85 ? 'Overdue' : sr(selIdx * 202 + p) > 0.65 ? 'Due Soon' : 'OK';
    const dq = 1 + Math.floor(sr(selIdx * 203 + p) * 5);
    return {
      id: `P-${String(p + 1).padStart(2,'0')}`,
      desc: ['Net electricity generation','Grid emission factor','Fuel consumption','Biomass input','Waste diverted','Livestock head count'][p],
      unit: ['MWh','tCO₂/MWh','litres','tonnes','tonnes','head'][p],
      freq: FREQUENCIES[Math.floor(sr(selIdx * 205 + p) * FREQUENCIES.length)],
      method: ['Automated sub-meter','IPCC Tier 2 published','Calibrated flow meter','Weighbridge measurement','Gate manifest records','Farm census data'][p],
      equipment: EQUIPMENT_TYPES[p % EQUIPMENT_TYPES.length],
      calInterval: CAL_INTERVALS[Math.floor(sr(selIdx * 201 + p) * 3)],
      lastCal: lastCal.toISOString().split('T')[0],
      nextCal: nextCal.toISOString().split('T')[0],
      status, dq,
    };
  });
  const DATA_MGMT = [
    'Raw data stored in certified data management system (DMS)',
    'Daily automated backup (offsite cloud storage, AES-256 encrypted)',
    'Access control log maintained with audit trail',
    'Version control for calculation spreadsheets (SHA hash recorded)',
    '10-year data retention policy implemented and documented',
  ];
  const dmChecked = DATA_MGMT.map((_, i) => sr(selIdx * 300 + i) > 0.2);
  const mrvScore  = Math.round(params.reduce((a, p) => a + p.dq, 0) / Math.max(1, params.length) * 20);
  return (
    <div>
      <div style={{ color:T.navy, fontWeight:700, fontSize:15, marginBottom:4 }}>Monitoring & MRV — CDM Standard v2 | Gold Standard MRV | ISO 14064-2:2019 §8</div>
      <div style={{ color:T.textSec, fontSize:12, marginBottom:16 }}>Monitoring plan parameters, equipment calibration schedule, and data management compliance for selected project.</div>
      <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:20, flexWrap:'wrap' }}>
        <div>
          <label style={{ fontSize:12, color:T.textSec, marginRight:8 }}>Project:</label>
          <select value={selIdx} onChange={e => setSelIdx(+e.target.value)} style={{ border:`1px solid ${T.border}`, borderRadius:6, padding:'6px 10px', fontSize:12, background:T.card }}>
            {projects.map((p, i) => <option key={i} value={i}>{p.name}</option>)}
          </select>
        </div>
        <div style={kpi}><div style={{ color:T.textSec, fontSize:11, marginBottom:4 }}>MRV Completeness Score</div><div style={{ color: mrvScore > 80 ? T.green : mrvScore > 60 ? T.amber : T.red, fontFamily:T.fontMono, fontSize:20, fontWeight:700 }}>{mrvScore}%</div></div>
        {badge(T.indigo, proj.registry)}{badge(T.blue, proj.methodology)}
      </div>
      <div style={{ overflowX:'auto', marginBottom:22 }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['ID','Description','Unit','Frequency','Method','Equipment','Cal. Interval','Last Cal.','Next Cal.','Status','DQ'].map(h => <th key={h} style={tH}>{h}</th>)}</tr></thead>
          <tbody>
            {params.map(p => (
              <tr key={p.id} style={{ background: p.status === 'Overdue' ? T.red + '06' : p.status === 'Due Soon' ? T.amber + '06' : 'transparent' }}>
                <td style={{ ...tD, fontFamily:T.fontMono, fontWeight:700 }}>{p.id}</td>
                <td style={{ ...tD, fontWeight:600 }}>{p.desc}</td>
                <td style={{ ...tD, fontFamily:T.fontMono }}>{p.unit}</td>
                <td style={tD}>{badge(p.freq === 'Continuous' ? T.green : p.freq === 'Annual' ? T.amber : T.blue, p.freq)}</td>
                <td style={{ ...tD, fontSize:11, color:T.textSec }}>{p.method}</td>
                <td style={{ ...tD, fontSize:11 }}>{p.equipment}</td>
                <td style={{ ...tD, fontFamily:T.fontMono }}>{p.calInterval}</td>
                <td style={{ ...tD, fontFamily:T.fontMono, fontSize:11 }}>{p.lastCal}</td>
                <td style={{ ...tD, fontFamily:T.fontMono, fontSize:11, color: p.status === 'Overdue' ? T.red : p.status === 'Due Soon' ? T.amber : T.textPri }}>{p.nextCal}</td>
                <td style={tD}>{badge(p.status === 'Overdue' ? T.red : p.status === 'Due Soon' ? T.amber : T.green, p.status)}</td>
                <td style={{ ...tD, fontFamily:T.fontMono, color: p.dq <= 2 ? T.red : p.dq <= 3 ? T.amber : T.green, fontWeight:700 }}>{p.dq}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={card()}>
        <div style={{ color:T.navy, fontWeight:700, fontSize:13, marginBottom:12 }}>Data Management Compliance Checklist</div>
        {DATA_MGMT.map((item, i) => (
          <div key={i} style={{ display:'flex', gap:10, padding:'8px 6px', borderBottom: i < DATA_MGMT.length - 1 ? `1px solid ${T.borderL}` : 'none', alignItems:'center' }}>
            <div style={{ width:18, height:18, borderRadius:4, background: dmChecked[i] ? T.green : T.borderL, border:`2px solid ${dmChecked[i] ? T.green : T.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {dmChecked[i] && <span style={{ color:'#fff', fontSize:11, fontWeight:700 }}>✓</span>}
            </div>
            <span style={{ fontSize:12, color: dmChecked[i] ? T.textPri : T.red }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab 6: Verification Schedule ─────────────────────────────────────────────
function Tab6({ projects }) {
  const [selIdx, setSelIdx] = useState(0);
  const proj = projects[selIdx];
  const verHistory = Array.from({ length: 4 }, (_, v) => {
    const year     = 2021 + v;
    const claimed  = Math.round(proj.estimatedAnnualCredits * (0.85 + sr(selIdx * 400 + v) * 0.3));
    const verified = Math.round(claimed * (0.9 + sr(selIdx * 401 + v) * 0.1));
    const disc     = claimed > 0 ? ((claimed - verified) / claimed * 100) : 0;
    const issued   = Math.round(verified * (1 - 0.02));
    return {
      period: `${year}-01-01 to ${year}-12-31`,
      vvb: VVBS[v % VVBS.length],
      submitted: `${year + 1}-02-15`,
      verified,
      claimed,
      disc: parseFloat(disc.toFixed(1)),
      status: ['Completed','Completed','Completed','In Progress'][v],
      issued,
    };
  });
  const upcoming = projects.filter(p => p.stage === 'Monitoring' || p.stage === 'Verification').slice(0, 6).map((p, i) => ({
    project: p.name,
    vvb: p.vvb,
    expected: `2026-${String(Math.ceil(sr(i * 500) * 12)).padStart(2,'0')}-01`,
    accredValid: sr(i * 501) > 0.15,
  }));
  const FREQ_RULES = [
    { std:'CDM',          rule:'First verification within 3–5 years of registration; subsequent as needed by EB' },
    { std:'Gold Standard',rule:'Annual recommended; minimum every 2 years for most project types' },
    { std:'Verra VCS',    rule:'Annual for most; 2–5 years for certain AFOLU and blue carbon projects' },
    { std:'ACR',          rule:'At least every 5 years; annual recommended for agriculture and forestry' },
    { std:'CAR',          rule:'Annual verification required for all CAR offset protocols' },
  ];
  return (
    <div>
      <div style={{ color:T.navy, fontWeight:700, fontSize:15, marginBottom:4 }}>Verification Schedule — CDM Standard v7 §11 | Gold Standard VVB Verification | VCS v4 §4.10</div>
      <div style={{ color:T.textSec, fontSize:12, marginBottom:16 }}>Verification frequency rules by standard. Historical verification record. Upcoming verifications and VVB accreditation status.</div>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:24 }}>
        {FREQ_RULES.map(r => (
          <div key={r.std} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:'12px 16px', flex:1, minWidth:180 }}>
            <div style={{ color:T.navy, fontWeight:700, fontSize:12 }}>{r.std}</div>
            <div style={{ color:T.textSec, fontSize:11, marginTop:5 }}>{r.rule}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom:14 }}>
        <label style={{ fontSize:12, color:T.textSec, marginRight:8 }}>Verification history for:</label>
        <select value={selIdx} onChange={e => setSelIdx(+e.target.value)} style={{ border:`1px solid ${T.border}`, borderRadius:6, padding:'6px 10px', fontSize:12, background:T.card }}>
          {projects.map((p, i) => <option key={i} value={i}>{p.name}</option>)}
        </select>
      </div>
      <div style={{ overflowX:'auto', marginBottom:24 }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Verification Period','VVB','Submitted','Verified ER','Claimed ER','Discrepancy %','Status','Credits Issued'].map(h => <th key={h} style={tH}>{h}</th>)}</tr></thead>
          <tbody>{verHistory.map((v, i) => (
            <tr key={i}>
              <td style={{ ...tD, fontFamily:T.fontMono, fontSize:11 }}>{v.period}</td>
              <td style={{ ...tD, fontSize:11 }}>{v.vvb}</td>
              <td style={{ ...tD, fontFamily:T.fontMono, fontSize:11 }}>{v.submitted}</td>
              <td style={{ ...tD, fontFamily:T.fontMono, fontWeight:700 }}>{v.verified.toLocaleString()}</td>
              <td style={{ ...tD, fontFamily:T.fontMono }}>{v.claimed.toLocaleString()}</td>
              <td style={{ ...tD, fontFamily:T.fontMono, color: Math.abs(v.disc) > 5 ? T.red : T.green }}>{v.disc.toFixed(1)}%</td>
              <td style={tD}>{badge(v.status === 'Completed' ? T.green : T.amber, v.status)}</td>
              <td style={{ ...tD, fontFamily:T.fontMono, fontWeight:700, color:T.navy }}>{v.issued.toLocaleString()}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div style={card()}>
        <div style={{ color:T.navy, fontWeight:700, fontSize:13, marginBottom:12 }}>Upcoming Verifications — Preparation Checklist</div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Project','VVB Assigned','Expected Date','Accreditation Valid','Preparation Status'].map(h => <th key={h} style={tH}>{h}</th>)}</tr></thead>
          <tbody>{upcoming.map((u, i) => (
            <tr key={i}>
              <td style={{ ...tD, fontWeight:600 }}>{u.project.substring(0, 30)}</td>
              <td style={{ ...tD, fontSize:11 }}>{u.vvb}</td>
              <td style={{ ...tD, fontFamily:T.fontMono, fontSize:11 }}>{u.expected}</td>
              <td style={tD}>{badge(u.accredValid ? T.green : T.red, u.accredValid ? 'VALID' : 'EXPIRED — ACTION REQUIRED')}</td>
              <td style={tD}>{badge(T.amber, 'Monitoring reports: compile Q1-Q4')}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab 7: Credit Issuance Registry ──────────────────────────────────────────
function Tab7({ projects }) {
  const CREDIT_PRICE = [8, 12, 15, 10, 7]; // $/t by registry
  const issuances = Array.from({ length: 36 }, (_, m) => {
    const p = projects[m % projects.length];
    const yr = 2023 + Math.floor(m / 12);
    const mo = (m % 12) + 1;
    const vintage = yr - 1;
    const vol = Math.round(5000 + sr(m * 600) * 30000);
    const uDisc = Math.round(vol * 0.02);
    const net = vol - uDisc;
    const regIdx = REGISTRIES.indexOf(p.registry) >= 0 ? REGISTRIES.indexOf(p.registry) : 0;
    const price = CREDIT_PRICE[regIdx];
    const seqStart = Math.round(100000 + sr(m * 601) * 900000);
    const seqEnd   = seqStart + net - 1;
    const serialRange = `${p.creditType}-${p.country.substring(0,2).toUpperCase()}-${vintage}-${seqStart}-${seqEnd}`;
    const buyers = ['Climate Impact Partners','South Pole','Xpansiv CBL','ACX Exchange','Anew Climate','Verra Registry Retirement'];
    return { m, project: p.name.substring(0, 28), vintage: String(vintage), verified: vol, uDisc, net, creditType: p.creditType, serial: serialRange, registry: p.registry, buyer: buyers[m % buyers.length], date: `${yr}-${String(mo).padStart(2,'0')}-15`, revenueK: (net * price / 1000).toFixed(1) };
  });
  // Cumulative bar chart by year
  const byYear = [2023, 2024, 2025].map(yr => ({
    yr, total: issuances.filter(i => i.date.startsWith(String(yr))).reduce((a, i) => a + i.net, 0),
    byReg: REGISTRIES.map(r => ({ r, n: issuances.filter(i => i.date.startsWith(String(yr)) && i.registry === r).reduce((a, i) => a + i.net, 0) })),
  }));
  const maxYear = Math.max(1, ...byYear.map(y => y.total));
  return (
    <div>
      <div style={{ color:T.navy, fontWeight:700, fontSize:15, marginBottom:4 }}>Credit Issuance Registry — CER / VCU / GS-VER / ACER / CRT Issuance Ledger</div>
      <div style={{ color:T.textSec, fontSize:12, marginBottom:20 }}>36-month issuance record. Serial number ranges in standard format. Revenue recognition at realized carbon prices. CDM/VCS/GS reference procedures.</div>
      {/* Annual bar chart */}
      <div style={card()}>
        <div style={{ color:T.textSec, fontSize:11, fontWeight:700, marginBottom:14, textTransform:'uppercase' }}>Cumulative Issuance by Year (net credits)</div>
        {byYear.map(y => (
          <div key={y.yr} style={{ marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:12 }}>
              <span style={{ fontWeight:700, color:T.navy }}>{y.yr}</span>
              <span style={{ fontFamily:T.fontMono, color:T.textSec }}>{y.total.toLocaleString()} tCO₂e</span>
            </div>
            <div style={{ display:'flex', height:22, borderRadius:4, overflow:'hidden', gap:2 }}>
              {y.byReg.filter(r => r.n > 0).map((r, i) => (
                <div key={r.r} style={{ flex: r.n, background:[T.green, T.gold, T.blue, T.indigo, T.teal][i % 5], opacity:0.8, display:'flex', alignItems:'center', paddingLeft:4 }}>
                  {r.n / y.total > 0.12 && <span style={{ fontSize:9, color:'#fff', fontWeight:700, whiteSpace:'nowrap' }}>{r.r}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Issuance ledger */}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Date','Project','Vintage','Verified ER','U. Disc.','Net Credits','Type','Serial Range (abbreviated)','Registry','Buyer / Retirement','Revenue'].map(h => <th key={h} style={tH}>{h}</th>)}</tr></thead>
          <tbody>{issuances.map((iss, i) => (
            <tr key={i}>
              <td style={{ ...tD, fontFamily:T.fontMono, fontSize:11 }}>{iss.date}</td>
              <td style={{ ...tD, fontWeight:600, maxWidth:180 }}>{iss.project}</td>
              <td style={{ ...tD, fontFamily:T.fontMono }}>{iss.vintage}</td>
              <td style={{ ...tD, fontFamily:T.fontMono }}>{iss.verified.toLocaleString()}</td>
              <td style={{ ...tD, fontFamily:T.fontMono, color:T.red }}>{iss.uDisc.toLocaleString()}</td>
              <td style={{ ...tD, fontFamily:T.fontMono, fontWeight:700, color:T.navy }}>{iss.net.toLocaleString()}</td>
              <td style={tD}>{badge(T.teal, iss.creditType)}</td>
              <td style={{ ...tD, fontFamily:T.fontMono, fontSize:10 }}>{iss.serial.substring(0, 32) + '…'}</td>
              <td style={tD}>{badge(T.indigo, iss.registry)}</td>
              <td style={{ ...tD, fontSize:11, color:T.textSec }}>{iss.buyer}</td>
              <td style={{ ...tD, fontFamily:T.fontMono, color:T.green, fontWeight:700 }}>${iss.revenueK}K</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab 8: Crediting Period & Renewal ─────────────────────────────────────────
const CRED_RULES = [
  { std:'CDM Standard',   types:'7yr × 3 renewals (21yr total) or 10-year fixed',   afolu:'20 or 30 years (no renewal)' },
  { std:'Gold Standard',  types:'10-year fixed (renewable once with new baseline)',  afolu:'Same — 10 year, one renewal' },
  { std:'Verra VCS',      types:'10, 15, or 20 years for most project types',        afolu:'30 years AFOLU with buffer pool' },
  { std:'CAR',            types:'Project-type specific (e.g. Forest Protocol: 100yr)',afolu:'N/A — varies by protocol' },
  { std:'ACR',            types:'10–100 years depending on project type',            afolu:'40 years with permanence buffer' },
];

function Tab8({ projects }) {
  const currentYear = 2026;
  const renewals = projects.map((p, i) => {
    const renewal1     = p.creditingPeriodEnd;
    const daysToEnd    = (renewal1 - currentYear) * 365;
    const renewalNum   = p.stage === 'Renewal/Expired' ? 1 : 0;
    const baselineReqd = p.registry !== 'Gold Standard';
    const submitted    = sr(i * 700) > 0.5;
    const approved     = submitted && sr(i * 701) > 0.4;
    const npvRenewal   = Math.round(p.estimatedAnnualCredits * p.creditingPeriodYrs * 12 / 1e3);
    const npvRetire    = Math.round(p.totalExpected * 0.15);
    return { ...p, renewal1, daysToEnd, renewalNum, baselineReqd, submitted, approved, npvRenewal, npvRetire, alert: renewal1 - currentYear <= 1.5 };
  });
  const alertProjects = renewals.filter(r => r.alert);
  return (
    <div>
      <div style={{ color:T.navy, fontWeight:700, fontSize:15, marginBottom:4 }}>Crediting Period & Renewal — CDM | Gold Standard | Verra VCS | CAR | ACR</div>
      <div style={{ color:T.textSec, fontSize:12, marginBottom:20 }}>Crediting period types, renewal rules, financial NPV of renewal vs. retirement decision, and alert for periods ending within 18 months.</div>
      {/* Rules table */}
      <div style={{ overflowX:'auto', marginBottom:24 }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Registry Standard','Crediting Period Rules','AFOLU / Forestry'].map(h => <th key={h} style={tH}>{h}</th>)}</tr></thead>
          <tbody>{CRED_RULES.map(r => (
            <tr key={r.std}><td style={{ ...tD, fontWeight:700, color:T.navy }}>{r.std}</td><td style={{ ...tD, fontSize:12 }}>{r.types}</td><td style={{ ...tD, color:T.sage, fontSize:12 }}>{r.afolu}</td></tr>
          ))}</tbody>
        </table>
      </div>
      {/* Alert banner */}
      {alertProjects.length > 0 && (
        <div style={{ background:T.red + '08', border:`2px solid ${T.red}40`, borderRadius:8, padding:16, marginBottom:22 }}>
          <div style={{ color:T.red, fontWeight:700, fontSize:13, marginBottom:8 }}>Alert — {alertProjects.length} Projects: Crediting Period Ending Within 18 Months</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {alertProjects.map(p => (
              <div key={p.id} style={{ background:T.red + '10', border:`1px solid ${T.red}30`, borderRadius:6, padding:'6px 12px', fontSize:12 }}>
                <strong>{p.name.substring(0, 25)}</strong> — Period ends: <strong>{p.creditingPeriodEnd}</strong> ({p.registry})
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Renewal tracker */}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Project','Registry','Period End','Renewal #','New Baseline Reqd','Submitted','Approved','NPV Renew ($K)','NPV Retire ($K)','Decision','Alert'].map(h => <th key={h} style={tH}>{h}</th>)}</tr></thead>
          <tbody>{renewals.map(p => (
            <tr key={p.id} style={{ background: p.alert ? T.amber + '08' : 'transparent' }}>
              <td style={{ ...tD, fontWeight:600, color:T.navy, maxWidth:180 }}>{p.name.substring(0, 22)}</td>
              <td style={tD}>{badge(T.indigo, p.registry)}</td>
              <td style={{ ...tD, fontFamily:T.fontMono, color: p.alert ? T.red : T.textPri, fontWeight: p.alert ? 700 : 400 }}>{p.creditingPeriodEnd}</td>
              <td style={{ ...tD, fontFamily:T.fontMono }}>{p.renewalNum}</td>
              <td style={tD}>{badge(p.baselineReqd ? T.amber : T.green, p.baselineReqd ? 'REQUIRED' : 'NOT REQUIRED')}</td>
              <td style={tD}>{badge(p.submitted ? T.green : T.red, p.submitted ? 'YES' : 'NO')}</td>
              <td style={tD}>{badge(p.approved ? T.green : p.submitted ? T.amber : T.red, p.approved ? 'APPROVED' : p.submitted ? 'PENDING' : 'NOT SUBMITTED')}</td>
              <td style={{ ...tD, fontFamily:T.fontMono, color:T.green }}>${p.npvRenewal.toLocaleString()}</td>
              <td style={{ ...tD, fontFamily:T.fontMono, color:T.blue }}>${p.npvRetire.toLocaleString()}</td>
              <td style={tD}>{badge(p.npvRenewal > p.npvRetire ? T.green : T.blue, p.npvRenewal > p.npvRetire ? 'RENEW' : 'RETIRE / REPLACE')}</td>
              <td style={tD}>{p.alert ? badge(T.red, '⚠ ACT NOW') : badge(T.green, 'OK')}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ── Root Component ─────────────────────────────────────────────────────────────
export default function CarbonProjectLifecyclePage() {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:'DM Sans, sans-serif', color:T.textPri }}>
      {/* Header */}
      <div style={{ borderBottom:`3px solid ${T.gold}`, background:T.navy }}>
        <div style={{ maxWidth:1400, margin:'0 auto', padding:'18px 32px 0' }}>
          <div style={{ marginBottom:14 }}>
            <div style={{ color:T.gold, fontFamily:T.fontMono, fontSize:10, letterSpacing:'0.12em', marginBottom:5 }}>CARBON PROJECT LIFECYCLE ENGINE · UNFCCC CDM · GOLD STANDARD v4 · VERRA VCS v4</div>
            <div style={{ color:'#ffffff', fontWeight:800, fontSize:22 }}>Carbon Project Lifecycle Management</div>
            <div style={{ color:'#9ca3af', fontSize:12, marginTop:4 }}>60 projects · Full CDM/GS/VCS lifecycle · PDD Builder · Validation · Registration · MRV · Issuance · Renewal</div>
          </div>
          <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
            {TABS.map((t, i) => (
              <button key={i} onClick={() => setActiveTab(i)} style={{ background:'transparent', border:'none', borderBottom: i === activeTab ? `3px solid ${T.gold}` : '3px solid transparent', color: i === activeTab ? T.gold : '#9ca3af', padding:'10px 15px', fontSize:12, fontWeight: i === activeTab ? 700 : 400, cursor:'pointer', whiteSpace:'nowrap', transition:'color 0.15s', marginBottom:-1 }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Content */}
      <div style={{ maxWidth:1400, margin:'0 auto', padding:'28px 32px' }}>
        {activeTab === 0 && <Tab1 projects={PROJECTS} />}
        {activeTab === 1 && <Tab2 projects={PROJECTS} />}
        {activeTab === 2 && <Tab3 projects={PROJECTS} />}
        {activeTab === 3 && <Tab4 projects={PROJECTS} />}
        {activeTab === 4 && <Tab5 projects={PROJECTS} />}
        {activeTab === 5 && <Tab6 projects={PROJECTS} />}
        {activeTab === 6 && <Tab7 projects={PROJECTS} />}
        {activeTab === 7 && <Tab8 projects={PROJECTS} />}
      </div>
      {/* Status Bar */}
      <div style={{ borderTop:`1px solid ${T.border}`, background:T.card, padding:'10px 32px', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:11, color:T.textSec }}>
        <span style={{ fontFamily:T.fontMono }}>UNFCCC CDM Standard v7 · Gold Standard v4.0 · Verra VCS v4.0 · ACR v14 · ISO 14064-2/3:2019 · CDM EB 65 Annex 29</span>
        <span style={{ fontFamily:T.fontMono }}>60 projects · 8 lifecycle stages · 5 registries · Full MRV tracking</span>
      </div>
    </div>
  );
}
