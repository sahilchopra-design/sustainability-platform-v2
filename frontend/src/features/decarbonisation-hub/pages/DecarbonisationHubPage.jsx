import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

// ── Trajectory data 2019–2050 ──────────────────────────────────────────────
const trajectoryData = [
  { year:2019, scope1:1.20, scope2:0.48, scope3:5.80, sbti12:1.68, sbti3:5.80, nz12:1.68, nz3:5.80 },
  { year:2020, scope1:1.15, scope2:0.44, scope3:5.65, sbti12:1.60, sbti3:5.64, nz12:1.60, nz3:5.64 },
  { year:2021, scope1:1.12, scope2:0.41, scope3:5.52, sbti12:1.52, sbti3:5.48, nz12:1.52, nz3:5.48 },
  { year:2022, scope1:1.08, scope2:0.38, scope3:5.38, sbti12:1.44, sbti3:5.32, nz12:1.44, nz3:5.32 },
  { year:2023, scope1:1.04, scope2:0.35, scope3:5.28, sbti12:1.36, sbti3:5.16, nz12:1.36, nz3:5.16 },
  { year:2024, scope1:1.01, scope2:0.33, scope3:5.24, sbti12:1.28, sbti3:5.00, nz12:1.28, nz3:5.00 },
  { year:2025, scope1:0.98, scope2:0.31, scope3:5.20, sbti12:1.20, sbti3:4.84, nz12:1.20, nz3:4.84 },
  { year:2026, scope1:0.92, scope2:0.27, scope3:5.08, sbti12:1.12, sbti3:4.68, nz12:1.12, nz3:4.68 },
  { year:2027, scope1:0.85, scope2:0.23, scope3:4.90, sbti12:1.04, sbti3:4.52, nz12:1.04, nz3:4.52 },
  { year:2028, scope1:0.77, scope2:0.19, scope3:4.66, sbti12:0.96, sbti3:4.36, nz12:0.96, nz3:4.36 },
  { year:2029, scope1:0.68, scope2:0.14, scope3:4.38, sbti12:0.88, sbti3:4.20, nz12:0.88, nz3:4.20 },
  { year:2030, scope1:0.60, scope2:0.24, scope3:4.06, sbti12:0.84, sbti3:4.06, nz12:0.84, nz3:4.06 },
  { year:2035, scope1:0.42, scope2:0.15, scope3:3.40, sbti12:0.60, sbti3:3.40, nz12:0.60, nz3:3.40 },
  { year:2040, scope1:0.28, scope2:0.09, scope3:2.60, sbti12:0.36, sbti3:2.60, nz12:0.36, nz3:2.60 },
  { year:2045, scope1:0.14, scope2:0.04, scope3:1.50, sbti12:0.12, sbti3:1.50, nz12:0.12, nz3:1.50 },
  { year:2050, scope1:0.05, scope2:0.01, scope3:0.58, sbti12:0.08, sbti3:0.58, nz12:0.08, nz3:0.58 },
];

// ── MACC data ──────────────────────────────────────────────────────────────
const maccData = [
  { measure:'Offshore Wind PPA', abatement:420, cost:-18 },
  { measure:'Industrial Electrification', abatement:310, cost:8 },
  { measure:'Heat Pump Retrofit', abatement:180, cost:22 },
  { measure:'Green Hydrogen (process)', abatement:155, cost:68 },
  { measure:'Supply Chain Engagement', abatement:340, cost:12 },
  { measure:'Fleet Electrification', abatement:95, cost:31 },
  { measure:'Building Efficiency', abatement:72, cost:5 },
  { measure:'CCS (residual)', abatement:88, cost:118 },
  { measure:'Nature-based Removals', abatement:55, cost:45 },
  { measure:'Refrigerant Substitution', abatement:38, cost:-4 },
];

// ── Energy mix ─────────────────────────────────────────────────────────────
const energyMixData = [
  { name:'Renewable Electricity', value:62, color:T.sage },
  { name:'Natural Gas', value:21, color:T.amber },
  { name:'Grid Electricity (brown)', value:11, color:T.textMut },
  { name:'Other Fossil', value:6, color:T.red },
];

// ── Scope 3 hotspots ───────────────────────────────────────────────────────
const scope3Data = [
  { category:'Purchased Goods & Services', pct:38, mt:1.98 },
  { category:'Use of Sold Products', pct:22, mt:1.14 },
  { category:'Capital Goods', pct:14, mt:0.73 },
  { category:'Downstream Transport', pct:9, mt:0.47 },
  { category:'Business Travel', pct:6, mt:0.31 },
  { category:'Employee Commuting', pct:5, mt:0.26 },
  { category:'Waste', pct:3, mt:0.16 },
  { category:'Other', pct:3, mt:0.15 },
];

// ── Financial cashflows ────────────────────────────────────────────────────
const financialData = [
  { year:2025, capex:-85, avoidedLow:12, avoidedMid:21, avoidedHigh:30, savings:18 },
  { year:2026, capex:-140, avoidedLow:22, avoidedMid:38, avoidedHigh:54, savings:34 },
  { year:2027, capex:-220, avoidedLow:35, avoidedMid:62, avoidedHigh:88, savings:58 },
  { year:2028, capex:-310, avoidedLow:52, avoidedMid:91, avoidedHigh:130, savings:84 },
  { year:2029, capex:-280, avoidedLow:74, avoidedMid:130, avoidedHigh:186, savings:112 },
  { year:2030, capex:-195, avoidedLow:98, avoidedMid:172, avoidedHigh:246, savings:144 },
  { year:2031, capex:-120, avoidedLow:118, avoidedMid:207, avoidedHigh:296, savings:168 },
  { year:2032, capex:-85, avoidedLow:135, avoidedMid:236, avoidedHigh:338, savings:188 },
  { year:2033, capex:-60, avoidedLow:148, avoidedMid:259, avoidedHigh:370, savings:204 },
  { year:2034, capex:-42, avoidedLow:158, avoidedMid:277, avoidedHigh:396, savings:216 },
  { year:2035, capex:-30, avoidedLow:165, avoidedMid:289, avoidedHigh:413, savings:226 },
];

// ── Programme workstreams ──────────────────────────────────────────────────
const programmes = [
  { code:'SBTi NT', label:'SBTi Near-term', status:'green', pct:68, metric:'Approved 2030 targets', detail:'-50% S1+2, -30% S3 vs 2019', rag:'On Track', ref:'EP-AI1' },
  { code:'SBTi NZ', label:'SBTi Net-zero', status:'amber', pct:35, metric:'2050 pathway committed', detail:'Science-based net-zero 2050', rag:'In Progress', ref:'EP-AI1' },
  { code:'RE100', label:'RE100 Programme', status:'amber', pct:62, metric:'62% renewable electricity', detail:'100% target by 2030', rag:'At Risk', ref:'EP-AI3' },
  { code:'EV100', label:'EV100 Fleet', status:'green', pct:48, metric:'48% EV fleet penetration', detail:'100% EV target by 2030', rag:'On Track', ref:'EP-AI3' },
  { code:'EP100', label:'EP100 Energy Productivity', status:'green', pct:71, metric:'+38% energy productivity', detail:'Double productivity by 2030', rag:'On Track', ref:'EP-AI3' },
  { code:'CDP', label:'CDP Disclosure', status:'green', pct:85, metric:'CDP score: A-', detail:'Target: CDP A by 2026', rag:'On Track', ref:'EP-AI2' },
];

// ── 90-day actions ─────────────────────────────────────────────────────────
const actions90 = [
  { due:'Apr 2025', action:'Submit RE100 progress report — Q1 procurement data', owner:'Energy Team', priority:'high' },
  { due:'Apr 2025', action:'Board approval: Green hydrogen feasibility phase 2', owner:'CFO Office', priority:'high' },
  { due:'May 2025', action:'SBTi near-term target verification audit', owner:'Sustainability', priority:'high' },
  { due:'May 2025', action:'Supplier engagement programme — Tier 1 rollout', owner:'Procurement', priority:'medium' },
  { due:'Jun 2025', action:'CDP 2025 questionnaire submission deadline', owner:'ESG Team', priority:'high' },
  { due:'Jun 2025', action:'EV fleet procurement: 240 units (Q2 tranche)', owner:'Fleet Mgr', priority:'medium' },
];

// ── Board metrics ──────────────────────────────────────────────────────────
const boardMetrics = [
  { label:'Temperature Alignment', value:'1.9°C', target:'1.5°C', rag:'amber', trend:'improving' },
  { label:'SBTi Near-term', value:'Approved', target:'Maintain', rag:'green', trend:'stable' },
  { label:'SBTi Net-zero', value:'Committed', target:'Pathway set 2026', rag:'amber', trend:'improving' },
  { label:'Renewable Electricity', value:'62%', target:'100% by 2030', rag:'amber', trend:'improving' },
  { label:'Scope 1+2 Reduction', value:'-23%', target:'-50% by 2030', rag:'green', trend:'improving' },
  { label:'Scope 3 Reduction', value:'-10%', target:'-30% by 2030', rag:'amber', trend:'stable' },
  { label:'CDP Rating', value:'A-', target:'A by 2026', rag:'green', trend:'improving' },
  { label:'Programme Capex Deployed', value:'$312M', target:'$2.4bn by 2035', rag:'green', trend:'improving' },
];

const disclosureChecklist = [
  { item:'CSRD ESRS E1 Climate disclosures', status:'ready', note:'2025 report ready' },
  { item:'ISSB IFRS S2 metrics', status:'ready', note:'Aligned with TCFD' },
  { item:'SEC Climate Rule filing', status:'partial', note:'Material risks identified; Scope 3 pending' },
  { item:'TCFD full alignment', status:'ready', note:'4 pillars complete' },
  { item:'GRI 305 Emissions', status:'ready', note:'Full GRI Standards compliance' },
  { item:'SBTi progress disclosure', status:'ready', note:'Annual update submitted' },
  { item:'CDP 2025 questionnaire', status:'partial', note:'Due Jun 2025; 80% complete' },
  { item:'UK TCFD (LR9.8.6R)', status:'ready', note:'FY2024 report published' },
];

// ── Helper components ──────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, color, icon }) => (
  <div style={{
    background:T.surface, borderRadius:10, padding:'18px 20px',
    boxShadow:T.card, border:`1px solid ${T.border}`, flex:'1 1 160px',
    minWidth:160,
  }}>
    <div style={{ fontSize:11, color:T.textMut, fontWeight:600, letterSpacing:'0.04em', textTransform:'uppercase', marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:28, fontWeight:700, color: color || T.navy, lineHeight:1.1 }}>{value}</div>
    {sub && <div style={{ fontSize:12, color:T.textSec, marginTop:4 }}>{sub}</div>}
  </div>
);

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom:18 }}>
    <div style={{ fontSize:16, fontWeight:700, color:T.navy }}>{children}</div>
    {sub && <div style={{ fontSize:12, color:T.textSec, marginTop:3 }}>{sub}</div>}
  </div>
);

const Card = ({ children, style }) => (
  <div style={{ background:T.surface, borderRadius:10, padding:20, boxShadow:T.card, border:`1px solid ${T.border}`, ...style }}>
    {children}
  </div>
);

const RagBadge = ({ rag }) => {
  const map = { green:{ bg:'#dcfce7', color:T.green, label:'On Track' }, amber:{ bg:'#fef3c7', color:T.amber, label:'At Risk' }, red:{ bg:'#fee2e2', color:T.red, label:'Off Track' } };
  const s = map[rag] || map.amber;
  return (
    <span style={{ background:s.bg, color:s.color, fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20 }}>
      {s.label}
    </span>
  );
};

const ProgressBar = ({ pct, color }) => (
  <div style={{ height:6, borderRadius:3, background:T.border, overflow:'hidden' }}>
    <div style={{ width:`${pct}%`, height:'100%', borderRadius:3, background: color || T.navy, transition:'width 0.4s' }} />
  </div>
);

const ModuleRef = ({ code }) => (
  <span style={{ fontSize:10, background:`${T.navyL}18`, color:T.navyL, padding:'1px 6px', borderRadius:10, fontWeight:600 }}>{code}</span>
);

// ── Tab: Executive Dashboard ───────────────────────────────────────────────
const ExecDashboard = () => {
  const targets = [
    { label:'2025 Interim', desc:'-18% S1+2 vs 2019', actual:23, target:18, done:true },
    { label:'2030 Near-term', desc:'-50% S1+2 / -30% S3', actual:23, target:50, done:false },
    { label:'2050 Net-zero', desc:'<90% total + removals', actual:23, target:100, done:false },
  ];

  return (
    <div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
        <KpiCard label="Temperature Score" value="1.9°C" sub="Target: 1.5°C pathway" color={T.amber} />
        <KpiCard label="SBTi Near-term" value="Approved" sub="2030 targets validated" color={T.green} />
        <KpiCard label="Renewable Electricity" value="62%" sub="RE100 — target 100% by 2030" color={T.sage} />
        <KpiCard label="Programme NPV" value="+$840M" sub="At $130/tCO2e carbon price" color={T.navy} />
        <KpiCard label="CDP Rating" value="A-" sub="Target: CDP A by 2026" color={T.navyL} />
        <KpiCard label="Active Projects" value="9" sub="Delivering in 2025" color={T.gold} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
        <Card>
          <SectionTitle sub="MtCO2e — actual vs SBTi pathway vs net-zero trajectory">
            Emissions Trajectory 2019–2050
          </SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trajectoryData} margin={{ top:5, right:10, left:0, bottom:5 }}>
              <defs>
                <linearGradient id="gS1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.red} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={T.red} stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="gS2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.amber} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={T.amber} stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="gS3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.navy} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={T.navy} stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize:11, fill:T.textMut }} />
              <YAxis tick={{ fontSize:11, fill:T.textMut }} unit=" Mt" />
              <Tooltip
                contentStyle={{ fontSize:12, borderRadius:8, border:`1px solid ${T.border}` }}
                formatter={(v, n) => [`${Number(v).toFixed(2)} Mt`, n]}
              />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Area type="monotone" dataKey="scope3" name="Scope 3 (actual)" stroke={T.navy} fill="url(#gS3)" strokeWidth={2} />
              <Area type="monotone" dataKey="scope2" name="Scope 2 (actual)" stroke={T.amber} fill="url(#gS2)" strokeWidth={2} />
              <Area type="monotone" dataKey="scope1" name="Scope 1 (actual)" stroke={T.red} fill="url(#gS1)" strokeWidth={2} />
              <Line type="monotone" dataKey="sbti12" name="SBTi S1+2 pathway" stroke={T.sage} strokeWidth={2} strokeDasharray="6 3" dot={false} />
              <Line type="monotone" dataKey="sbti3" name="SBTi S3 pathway" stroke={T.sageL} strokeWidth={2} strokeDasharray="6 3" dot={false} />
              <ReferenceLine x={2025} stroke={T.gold} strokeDasharray="4 2" label={{ value:'Now', fill:T.gold, fontSize:11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle sub="Progress against committed milestones">
            Target Achievement
          </SectionTitle>
          {targets.map((t, i) => (
            <div key={i} style={{ marginBottom:18 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:13, fontWeight:600, color:T.navy }}>{t.label}</span>
                <span style={{ fontSize:11, color:T.textSec }}>{t.actual}% of {t.target}%</span>
              </div>
              <div style={{ fontSize:11, color:T.textMut, marginBottom:6 }}>{t.desc}</div>
              <ProgressBar pct={Math.round((t.actual / t.target) * 100)} color={t.done ? T.green : T.navyL} />
              <div style={{ textAlign:'right', fontSize:11, color:T.textSec, marginTop:3 }}>
                {Math.round((t.actual / t.target) * 100)}% of target achieved
              </div>
            </div>
          ))}
          <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:12, marginTop:4 }}>
            <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:8 }}>Initiative Memberships</div>
            {['SBTi — Near-term Approved','RE100 Member','EV100 Member','EP100 Member','CDP — A- Rating'].map((m, i) => (
              <div key={i} style={{ fontSize:11, color:T.text, padding:'3px 0', display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ color:T.green, fontWeight:700 }}>✓</span> {m}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle sub="Apex Global Industries — base year 2019 vs current 2025 (MtCO2e)">
          Emissions Inventory Summary
        </SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[
            { label:'Scope 1 (2019 base)', value:'1.20 Mt', sub:'Current: 0.98 Mt (-18%)' },
            { label:'Scope 2 (2019 base)', value:'0.48 Mt', sub:'Current: 0.31 Mt (-35%)' },
            { label:'Scope 3 (2019 base)', value:'5.80 Mt', sub:'Current: 5.20 Mt (-10%)' },
            { label:'Total (2019 base)', value:'7.48 Mt', sub:'Current: 6.49 Mt (-13%)' },
          ].map((item, i) => (
            <div key={i} style={{ background:T.bg, borderRadius:8, padding:'12px 14px' }}>
              <div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>{item.label}</div>
              <div style={{ fontSize:20, fontWeight:700, color:T.navy }}>{item.value}</div>
              <div style={{ fontSize:11, color:T.sage, marginTop:3 }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ── Tab: Programme Status ──────────────────────────────────────────────────
const ProgrammeStatus = () => (
  <div>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:18 }}>
      {programmes.map((p, i) => (
        <Card key={i}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:T.navy }}>{p.label}</div>
              <div style={{ fontSize:10, color:T.textMut, marginTop:2 }}>{p.code}</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
              <RagBadge rag={p.status} />
              <ModuleRef code={p.ref} />
            </div>
          </div>
          <div style={{ fontSize:18, fontWeight:700, color:T.navy, marginBottom:4 }}>
            {p.pct}%
          </div>
          <ProgressBar pct={p.pct} color={p.status === 'green' ? T.green : p.status === 'amber' ? T.amber : T.red} />
          <div style={{ marginTop:10 }}>
            <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{p.metric}</div>
            <div style={{ fontSize:11, color:T.textSec, marginTop:2 }}>{p.detail}</div>
          </div>
        </Card>
      ))}
    </div>

    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:18 }}>
      <Card>
        <SectionTitle sub="Board-level RAG across all workstreams">
          Programme RAG Dashboard
        </SectionTitle>
        <div>
          {[
            { ws:'Energy Transition', rag:'amber', note:'RE100 at 62% — 3 PPAs in negotiation' },
            { ws:'Industrial Decarbonisation', rag:'green', note:'Electrification projects on schedule' },
            { ws:'Supply Chain (Scope 3)', rag:'amber', note:'Supplier engagement at 38% coverage' },
            { ws:'Capital Projects ($1.84bn)', rag:'green', note:'24 projects; 9 active in 2025' },
            { ws:'Regulatory Disclosure', rag:'green', note:'CSRD/ISSB/TCFD all compliant' },
            { ws:'Carbon Markets & Offsets', rag:'amber', note:'Nature-based credits: sourcing underway' },
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:i<5?`1px solid ${T.border}`:'none' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:T.navy }}>{item.ws}</div>
                <div style={{ fontSize:11, color:T.textSec }}>{item.note}</div>
              </div>
              <RagBadge rag={item.rag} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle sub="Priority actions due within 90 days">
          Next 90-Day Actions
        </SectionTitle>
        <div>
          {actions90.map((a, i) => (
            <div key={i} style={{ padding:'9px 0', borderBottom:i<actions90.length-1?`1px solid ${T.border}`:'none' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{
                  fontSize:10, fontWeight:600,
                  background: a.priority === 'high' ? '#fee2e2' : '#fef3c7',
                  color: a.priority === 'high' ? T.red : T.amber,
                  padding:'1px 7px', borderRadius:10,
                }}>{a.priority.toUpperCase()}</span>
                <span style={{ fontSize:11, color:T.textMut }}>{a.due}</span>
              </div>
              <div style={{ fontSize:12, color:T.navy, fontWeight:500 }}>{a.action}</div>
              <div style={{ fontSize:11, color:T.textSec, marginTop:2 }}>Owner: {a.owner}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>

    <Card>
      <SectionTitle sub="How EP-AI1 through EP-AI5 feed into this hub">
        Module Integration Map
      </SectionTitle>
      <div style={{ display:'flex', gap:12, justifyContent:'space-between' }}>
        {[
          { code:'EP-AI1', label:'SBTi Target Setting', feeds:'Near-term & net-zero pathways', color:T.sage },
          { code:'EP-AI2', label:'Carbon Accounting', feeds:'Scope 1/2/3 inventory & CDP', color:T.navyL },
          { code:'EP-AI3', label:'Energy Transition', feeds:'RE100 / EV100 / EP100 metrics', color:T.gold },
          { code:'EP-AI4', label:'Decarbonisation Roadmap', feeds:'Project pipeline & capex', color:T.amber },
          { code:'EP-AI5', label:'MACC Analysis', feeds:'Cost-effectiveness & NPV', color:T.red },
        ].map((m, i) => (
          <div key={i} style={{ flex:1, background:T.bg, borderRadius:8, padding:'12px 10px', borderLeft:`3px solid ${m.color}` }}>
            <div style={{ fontSize:11, fontWeight:700, color:m.color, marginBottom:4 }}>{m.code}</div>
            <div style={{ fontSize:12, fontWeight:600, color:T.navy, marginBottom:4 }}>{m.label}</div>
            <div style={{ fontSize:11, color:T.textSec }}>{m.feeds}</div>
            <div style={{ marginTop:8, textAlign:'right', fontSize:18 }}>&#8594;</div>
          </div>
        ))}
        <div style={{ display:'flex', alignItems:'center' }}>
          <div style={{ background:T.navy, color:'#fff', borderRadius:8, padding:'12px 14px', fontSize:12, fontWeight:700, textAlign:'center', minWidth:80 }}>
            EP-AI6<br />Hub
          </div>
        </div>
      </div>
    </Card>
  </div>
);

// ── Tab: Integrated Analytics ──────────────────────────────────────────────
const IntegratedAnalytics = () => {
  const maccColors = maccData.map(d => d.cost < 0 ? T.green : d.cost < 40 ? T.sage : d.cost < 80 ? T.amber : T.red);

  const scope3Colors = [T.navy, T.navyL, T.gold, T.amber, T.sage, T.sageL, T.textMut, T.textSec];

  const pipelineData = [
    { stage:'Operational', count:6, kt:185 },
    { stage:'Construction', count:5, kt:220 },
    { stage:'Final Approval', count:4, kt:310 },
    { stage:'Development', count:5, kt:480 },
    { stage:'Concept', count:4, kt:620 },
  ];
  const pipelineColors = [T.green, T.sage, T.gold, T.amber, T.textMut];

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Card>
          <SectionTitle sub="Top 10 abatement measures by marginal cost ($/tCO2e) — from EP-AI5">
            MACC: Cost-effectiveness Ranking
          </SectionTitle>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <span style={{ fontSize:11, color:T.green, fontWeight:600 }}>Green = negative cost (saves money)</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={maccData} layout="vertical" margin={{ top:0, right:10, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize:10, fill:T.textMut }} unit="$/t" />
              <YAxis type="category" dataKey="measure" tick={{ fontSize:10, fill:T.textSec }} width={160} />
              <Tooltip formatter={(v) => [`$${v}/tCO2e`, 'Marginal Cost']} contentStyle={{ fontSize:11, borderRadius:6 }} />
              <Bar dataKey="cost" name="Marginal Cost">
                {maccData.map((d, i) => (
                  <Cell key={i} fill={maccColors[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle sub="24 projects across 5 pipeline stages — from EP-AI4">
            Project Pipeline by Stage
          </SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={pipelineData} margin={{ top:10, right:10, left:0, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="stage" tick={{ fontSize:11, fill:T.textMut }} />
              <YAxis yAxisId="count" orientation="left" tick={{ fontSize:11, fill:T.textMut }} label={{ value:'Projects', angle:-90, position:'insideLeft', fontSize:10, fill:T.textMut }} />
              <YAxis yAxisId="kt" orientation="right" tick={{ fontSize:11, fill:T.textMut }} label={{ value:'ktCO2e/yr', angle:90, position:'insideRight', fontSize:10, fill:T.textMut }} />
              <Tooltip contentStyle={{ fontSize:11, borderRadius:6 }} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Bar yAxisId="count" dataKey="count" name="No. Projects" radius={[3,3,0,0]}>
                {pipelineData.map((d, i) => (
                  <Cell key={i} fill={pipelineColors[i]} />
                ))}
              </Bar>
              <Line yAxisId="kt" type="monotone" dataKey="kt" name="Abatement potential (kt)" stroke={T.gold} strokeWidth={2} dot={{ r:4 }} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card>
          <SectionTitle sub="Current energy mix — target 100% renewable by 2030 (RE100)">
            Energy Mix Analysis
          </SectionTitle>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={energyMixData} dataKey="value" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
                  {energyMixData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ fontSize:11, borderRadius:6 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex:1 }}>
              {energyMixData.map((d, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:d.color, flexShrink:0 }} />
                  <div style={{ flex:1, fontSize:12, color:T.text }}>{d.name}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>{d.value}%</div>
                </div>
              ))}
              <div style={{ marginTop:10, padding:'8px 10px', background:T.bg, borderRadius:6 }}>
                <div style={{ fontSize:11, color:T.textSec }}>RE100 Gap to close</div>
                <div style={{ fontSize:16, fontWeight:700, color:T.amber }}>38 percentage points</div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle sub="Scope 3 by category (MtCO2e 2025) — from EP-AI2">
            Scope 3 Category Hotspots
          </SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={scope3Data} layout="vertical" margin={{ top:0, right:10, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize:10, fill:T.textMut }} unit=" Mt" />
              <YAxis type="category" dataKey="category" tick={{ fontSize:10, fill:T.textSec }} width={168} />
              <Tooltip formatter={(v) => [`${v} MtCO2e`, 'Emissions']} contentStyle={{ fontSize:11, borderRadius:6 }} />
              <Bar dataKey="mt" name="Scope 3 (Mt)">
                {scope3Data.map((d, i) => (
                  <Cell key={i} fill={scope3Colors[i % scope3Colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

// ── Tab: Financial Summary ─────────────────────────────────────────────────
const FinancialSummary = () => {
  const npvData = [
    { price:'$75/t', npv:320, color:T.amber },
    { price:'$130/t', npv:840, color:T.sage },
    { price:'$185/t', npv:1420, color:T.green },
  ];

  return (
    <div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:18 }}>
        <KpiCard label="Total Programme Capex" value="$2.4bn" sub="2025–2035 deployment" />
        <KpiCard label="NPV at $75/tCO2e" value="+$320M" sub="Low carbon price scenario" color={T.amber} />
        <KpiCard label="NPV at $130/tCO2e" value="+$840M" sub="Central carbon price scenario" color={T.sage} />
        <KpiCard label="NPV at $185/tCO2e" value="+$1.42bn" sub="High carbon price scenario" color={T.green} />
        <KpiCard label="Break-even Carbon Price" value="$68/t" sub="Positive NPV above this level" color={T.navyL} />
        <KpiCard label="Cumulative Energy Savings" value="$1.1bn" sub="By 2035 vs. BAU baseline" color={T.gold} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
        <Card>
          <SectionTitle sub="Annual capex deployment vs. avoided carbon cost + energy savings ($M)">
            Cash Flow: Investment vs. Returns
          </SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={financialData} margin={{ top:5, right:10, left:0, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize:11, fill:T.textMut }} />
              <YAxis tick={{ fontSize:11, fill:T.textMut }} unit="M" />
              <Tooltip contentStyle={{ fontSize:11, borderRadius:6 }} formatter={(v) => [`$${v}M`]} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <ReferenceLine y={0} stroke={T.border} strokeWidth={2} />
              <Bar dataKey="capex" name="Capex (investment)" stackId="neg">
                {financialData.map((d, i) => (
                  <Cell key={i} fill={T.red} />
                ))}
              </Bar>
              <Bar dataKey="avoidedMid" name="Avoided carbon cost ($130/t)">
                {financialData.map((d, i) => (
                  <Cell key={i} fill={T.sage} />
                ))}
              </Bar>
              <Bar dataKey="savings" name="Energy savings">
                {financialData.map((d, i) => (
                  <Cell key={i} fill={T.gold} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle sub="Programme NPV at three carbon price scenarios">
            NPV Sensitivity
          </SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={npvData} margin={{ top:10, right:10, left:0, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="price" tick={{ fontSize:11, fill:T.textMut }} />
              <YAxis tick={{ fontSize:11, fill:T.textMut }} unit="M" />
              <Tooltip formatter={(v) => [`$${v}M NPV`]} contentStyle={{ fontSize:11, borderRadius:6 }} />
              <Bar dataKey="npv" name="Programme NPV ($M)" radius={[4,4,0,0]}>
                {npvData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop:12, padding:'10px 12px', background:T.bg, borderRadius:8 }}>
            <div style={{ fontSize:12, fontWeight:600, color:T.navy, marginBottom:8 }}>Key Financial Assumptions</div>
            {[
              ['Base year emissions', '7.48 MtCO2e'],
              ['Total abatement by 2035', '~1.85 MtCO2e/yr'],
              ['WACC (hurdle rate)', '8.5%'],
              ['Carbon price escalation', '+4%/yr real'],
              ['Energy savings (% of capex)', '~46%'],
            ].map(([k, v], i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:T.textSec, paddingBottom:4 }}>
                <span>{k}</span><span style={{ fontWeight:600, color:T.navy }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle sub="Abatement potential by initiative category vs. total programme cost ($M)">
          Investment Allocation — 24 Projects, 6 Categories
        </SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
          {[
            { cat:'Renewable Energy', capex:680, abatement:730, color:T.sage },
            { cat:'Industrial Electrification', capex:540, abatement:420, color:T.navyL },
            { cat:'Energy Efficiency', capex:210, abatement:185, color:T.gold },
            { cat:'Fleet & Transport', capex:280, abatement:140, color:T.amber },
            { cat:'Supply Chain', capex:85, abatement:340, color:T.navy },
            { cat:'Carbon Removal', capex:45, abatement:55, color:T.sageL },
          ].map((item, i) => (
            <div key={i} style={{ background:T.bg, borderRadius:8, padding:'12px 10px', borderTop:`3px solid ${item.color}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:item.color, marginBottom:6 }}>{item.cat}</div>
              <div style={{ fontSize:14, fontWeight:700, color:T.navy }}>${item.capex}M</div>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:6 }}>capex</div>
              <div style={{ fontSize:13, fontWeight:600, color:T.sage }}>{item.abatement} ktCO2e/yr</div>
              <div style={{ fontSize:11, color:T.textMut }}>abatement</div>
              <div style={{ marginTop:8, fontSize:11, color:T.textSec }}>
                ${Math.round(item.capex * 1000 / item.abatement)}/tCO2e
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ── Tab: Board Reporting ───────────────────────────────────────────────────
const BoardReporting = () => (
  <div>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
      <Card>
        <SectionTitle sub="Consolidated metrics for board pack — Q1 2025">
          Board Pack Metrics
        </SectionTitle>
        <div>
          {boardMetrics.map((m, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:i<boardMetrics.length-1?`1px solid ${T.border}`:'none' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.navy }}>{m.label}</div>
                <div style={{ fontSize:11, color:T.textMut }}>Target: {m.target}</div>
              </div>
              <div style={{ textAlign:'right', marginRight:12 }}>
                <div style={{ fontSize:16, fontWeight:700, color:T.navy }}>{m.value}</div>
                <div style={{ fontSize:10, color: m.trend === 'improving' ? T.green : T.textSec }}>
                  {m.trend === 'improving' ? '▲ Improving' : '→ Stable'}
                </div>
              </div>
              <RagBadge rag={m.rag} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle sub="Readiness for mandatory and voluntary climate disclosure">
          Disclosure Readiness Checklist
        </SectionTitle>
        <div>
          {disclosureChecklist.map((item, i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'9px 0', borderBottom:i<disclosureChecklist.length-1?`1px solid ${T.border}`:'none' }}>
              <span style={{
                fontSize:14, marginTop:1,
                color: item.status === 'ready' ? T.green : T.amber,
              }}>
                {item.status === 'ready' ? '✓' : '◑'}
              </span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.navy }}>{item.item}</div>
                <div style={{ fontSize:11, color:T.textSec, marginTop:2 }}>{item.note}</div>
              </div>
              <span style={{
                fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:10,
                background: item.status === 'ready' ? '#dcfce7' : '#fef3c7',
                color: item.status === 'ready' ? T.green : T.amber,
              }}>
                {item.status === 'ready' ? 'Ready' : 'Partial'}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>

    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
      <Card>
        <SectionTitle sub="Regulatory disclosure obligations — status and deadlines">
          Regulatory Disclosure Status
        </SectionTitle>
        <div>
          {[
            { reg:'CSRD / ESRS E1', status:'green', deadline:'Mar 2026 (FY2025)', note:'Double materiality complete; ESRS E1 metrics mapped' },
            { reg:'ISSB IFRS S2', status:'green', deadline:'Voluntary 2025', note:'Full alignment with TCFD; Scope 3 included' },
            { reg:'SEC Climate Rule', status:'amber', deadline:'TBD — Rule paused', note:'Material risks identified; large accelerated filer prep' },
            { reg:'UK TCFD (LR9.8.6R)', status:'green', deadline:'FY2024 published', note:'All 4 pillars; Task Force compliant' },
            { reg:'CDP 2025', status:'amber', deadline:'Jun 2025', note:'Questionnaire 80% complete; targeting A rating' },
          ].map((item, i) => (
            <div key={i} style={{ padding:'10px 0', borderBottom:i<4?`1px solid ${T.border}`:'none' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:13, fontWeight:700, color:T.navy }}>{item.reg}</span>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:11, color:T.textMut }}>{item.deadline}</span>
                  <RagBadge rag={item.status} />
                </div>
              </div>
              <div style={{ fontSize:11, color:T.textSec }}>{item.note}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle sub="Next scheduled board review and standing agenda">
          Board Review Schedule
        </SectionTitle>
        <div style={{ background:T.bg, borderRadius:8, padding:'14px 16px', marginBottom:14 }}>
          <div style={{ fontSize:11, color:T.textMut, marginBottom:2 }}>Next Board Review Date</div>
          <div style={{ fontSize:20, fontWeight:700, color:T.navy }}>22 May 2025</div>
          <div style={{ fontSize:12, color:T.textSec }}>Sustainability & Risk Committee — Quarterly Review</div>
        </div>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:8 }}>Standing Agenda Items</div>
          {[
            'Temperature trajectory update vs. 1.5°C SBTi pathway',
            'RE100 progress: Q1 renewable procurement results',
            'Capex deployment: programme milestone tracker',
            'CDP 2025 questionnaire readiness (due Jun)',
            'Scope 3 supplier engagement — Tier 1 rollout update',
            'Financial NPV update at current carbon price',
            'Regulatory disclosure: CSRD/ISSB/SEC status',
            'Any other ESG risk escalations',
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', gap:8, padding:'5px 0', fontSize:12, color:T.text }}>
              <span style={{ color:T.navy, fontWeight:700, minWidth:18 }}>{i+1}.</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:12 }}>
          <div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>Annual general emissions report</div>
          <div style={{ fontSize:13, fontWeight:600, color:T.navy }}>FY2024 Annual Sustainability Report — Published Mar 2025</div>
          <div style={{ fontSize:11, color:T.sage, marginTop:2 }}>CDP A- | TCFD Compliant | GRI Standards | SASB aligned</div>
        </div>
      </Card>
    </div>

    <Card>
      <SectionTitle sub="Summary status: Apex Global Industries decarbonisation programme — Q1 2025 board pack">
        Executive Summary for Board
      </SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {[
          { label:'Overall Programme Status', value:'On Track', sub:'6 of 6 workstreams active', color:T.green, bg:'#dcfce7' },
          { label:'Financial Position', value:'$312M deployed', sub:'13% of $2.4bn total programme', color:T.navy, bg:`${T.navyL}18` },
          { label:'Emissions Performance', value:'-13% total', sub:'vs. 2019 base (6.49 MtCO2e)', color:T.sage, bg:'#dcfce7' },
          { label:'Next Key Milestone', value:'SBTi audit', sub:'May 2025 — near-term verification', color:T.amber, bg:'#fef3c7' },
        ].map((item, i) => (
          <div key={i} style={{ background:item.bg, borderRadius:8, padding:'14px 16px' }}>
            <div style={{ fontSize:11, color:T.textSec, marginBottom:6, fontWeight:600 }}>{item.label}</div>
            <div style={{ fontSize:17, fontWeight:700, color:item.color }}>{item.value}</div>
            <div style={{ fontSize:11, color:T.textSec, marginTop:4 }}>{item.sub}</div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────
const TABS = [
  { id:'exec', label:'Executive Dashboard' },
  { id:'programme', label:'Programme Status' },
  { id:'analytics', label:'Integrated Analytics' },
  { id:'financial', label:'Financial Summary' },
  { id:'board', label:'Board Reporting' },
];

export default function DecarbonisationHubPage() {
  const [activeTab, setActiveTab] = useState('exec');

  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 28px', color:T.text }}>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <span style={{ fontSize:11, fontWeight:700, background:`${T.navy}18`, color:T.navy, padding:'3px 10px', borderRadius:20, letterSpacing:'0.04em' }}>
                EP-AI6
              </span>
              <span style={{ fontSize:11, color:T.textMut }}>Sprint AI — Corporate Decarbonisation</span>
            </div>
            <h1 style={{ fontSize:24, fontWeight:800, color:T.navy, margin:0, letterSpacing:'-0.02em' }}>
              Corporate Decarbonisation Hub
            </h1>
            <div style={{ fontSize:13, color:T.textSec, marginTop:4 }}>
              Apex Global Industries — Integrated decarbonisation programme command centre
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>Data as of</div>
            <div style={{ fontSize:14, fontWeight:600, color:T.navy }}>Q1 2025</div>
            <div style={{ display:'flex', gap:6, marginTop:6, justifyContent:'flex-end' }}>
              {['SBTi','RE100','EV100','EP100'].map(badge => (
                <span key={badge} style={{ fontSize:10, fontWeight:600, background:`${T.sage}20`, color:T.sage, padding:'2px 7px', borderRadius:10 }}>
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Alert banner */}
        <div style={{ marginTop:14, background:`${T.amber}18`, border:`1px solid ${T.amber}40`, borderRadius:8, padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <span style={{ fontSize:14, color:T.amber }}>&#9888;</span>
            <span style={{ fontSize:12, color:T.amber, fontWeight:600 }}>
              Temperature score 1.9°C exceeds 1.5°C SBTi target — accelerated RE100 procurement and supply chain engagement required to close gap
            </span>
          </div>
          <span style={{ fontSize:11, color:T.amber, fontWeight:600, whiteSpace:'nowrap', marginLeft:16 }}>CDP Due: Jun 2025</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, borderBottom:`2px solid ${T.border}`, marginBottom:20 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding:'9px 18px',
              border:'none',
              background:'transparent',
              cursor:'pointer',
              fontSize:13,
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? T.navy : T.textSec,
              borderBottom: activeTab === tab.id ? `2px solid ${T.navy}` : '2px solid transparent',
              marginBottom:-2,
              borderRadius:'4px 4px 0 0',
              transition:'color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'exec' && <ExecDashboard />}
        {activeTab === 'programme' && <ProgrammeStatus />}
        {activeTab === 'analytics' && <IntegratedAnalytics />}
        {activeTab === 'financial' && <FinancialSummary />}
        {activeTab === 'board' && <BoardReporting />}
      </div>

      {/* Footer */}
      <div style={{ marginTop:32, paddingTop:16, borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:11, color:T.textMut }}>
          EP-AI6 Corporate Decarbonisation Hub — Apex Global Industries | Aggregates EP-AI1 through EP-AI5
        </div>
        <div style={{ fontSize:11, color:T.textMut }}>
          Base year: 2019 (7.48 MtCO2e total) | SBTi near-term approved | Temperature: 1.9°C | CDP: A-
        </div>
      </div>
    </div>
  );
}
