/**
 * EP-AJ3 — Green Asset Ratio (GAR) — EU Taxonomy Compliance
 * Sprint AJ · Financed Emissions & Climate Banking Analytics
 * Regulatory basis: EU Taxonomy Regulation (EU) 2020/852
 * CRR Article 449a — mandatory for CRR institutions from 2024
 */
import React, { useState } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie,
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7',
  border:'#e5e0d8', borderL:'#d5cfc5',
  navy:'#1b3a5c', navyL:'#2c5a8c',
  gold:'#c5a96a', goldL:'#d4be8a',
  sage:'#5a8a6a', sageL:'#7ba67d',
  text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706',
  card:'0 1px 4px rgba(27,58,92,0.06)',
  cardH:'0 4px 16px rgba(27,58,92,0.1)',
  font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

// Deterministic seed function
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ─── STATIC DATA ─────────────────────────────────────────────────────────────

const garTrend = [
  { year: '2021', gar: 3.2, target: null },
  { year: '2022', gar: 4.8, target: null },
  { year: '2023', gar: 5.1, target: null },
  { year: '2024', gar: 7.3, target: null },
  { year: '2025', gar: null, target: 12.0 },
  { year: '2030', gar: null, target: 22.0 },
];

const envObjectives = [
  { code:'CCM', label:'Climate Change Mitigation',      aligned: 4.8, eligible: 8.2, notEligible: 22.6, color:'#06c896' },
  { code:'CCA', label:'Climate Change Adaptation',      aligned: 0.9, eligible: 2.1, notEligible: 33.6, color:'#0ea5e9' },
  { code:'WTR', label:'Sustainable Use of Water',       aligned: 0.3, eligible: 0.8, notEligible: 35.5, color:'#38bdf8' },
  { code:'CE',  label:'Circular Economy',               aligned: 0.2, eligible: 0.5, notEligible: 35.9, color:'#a78bfa' },
  { code:'PPC', label:'Pollution Prevention & Control', aligned: 0.01, eligible: 0.1, notEligible: 36.5, color:'#f0a828' },
  { code:'BIO', label:'Protection of Ecosystems',       aligned: 0.01, eligible: 0.1, notEligible: 36.5, color:'#f04060' },
];

const tscActivities = [
  {
    nace:'D35.11', ref:'CCM 4.1', activity:'Electricity generation — solar PV',
    tscThreshold:'No threshold; all generation qualifies',
    exposure: 2.1, status:'Aligned', dnsh:'Pass', mss:'Compliant',
  },
  {
    nace:'D35.11', ref:'CCM 4.3', activity:'Electricity generation — wind (onshore/offshore)',
    tscThreshold:'No threshold; all generation qualifies',
    exposure: 1.4, status:'Aligned', dnsh:'Pass', mss:'Compliant',
  },
  {
    nace:'F41.10', ref:'CCM 7.7', activity:'Construction of new buildings (NZEB / Top 15% EPC)',
    tscThreshold:'Primary energy demand ≤ 10% below NZEB threshold',
    exposure: 0.9, status:'Aligned', dnsh:'Pass', mss:'Compliant',
  },
  {
    nace:'H49.31', ref:'CCM 6.5', activity:'Transport — low-carbon road vehicles',
    tscThreshold:'Zero direct (tailpipe) CO₂ emissions',
    exposure: 0.3, status:'Aligned', dnsh:'Pass', mss:'Compliant',
  },
  {
    nace:'E38.32', ref:'CE 2.1', activity:'Recovery of materials from non-hazardous waste',
    tscThreshold:'Minimum 70% recovery rate by weight',
    exposure: 0.2, status:'Aligned', dnsh:'Pass', mss:'Compliant',
  },
  {
    nace:'F42.91', ref:'CCA 6.15', activity:'Flood-protection infrastructure',
    tscThreshold:'Based on climate adaptation plans; forward-looking hazard assessment',
    exposure: 0.9, status:'Aligned', dnsh:'Pass', mss:'Compliant',
  },
  {
    nace:'C24.10', ref:'CCM 3.3', activity:'Manufacture of low-carbon steel (EAF)',
    tscThreshold:'< 0.493 tCO₂e per tonne crude steel',
    exposure: 0.6, status:'Eligible', dnsh:'Pending', mss:'In progress',
  },
  {
    nace:'A01.13', ref:'CCM 1.1', activity:'Crop production — verified carbon sequestration',
    tscThreshold:'Net GHG removals and verified MRV required',
    exposure: 0.3, status:'Not eligible', dnsh:'N/A', mss:'N/A',
  },
];

const pathwayMilestones = [
  { year: 2022, event: 'First Taxonomy Delegated Acts effective — CCM + CCA climate objectives', status:'complete' },
  { year: 2023, event: 'Environmental Objectives 3–6 added (WTR / CE / PPC / BIO)', status:'complete' },
  { year: 2024, event: 'GAR mandatory disclosure — CRR Article 449a (binding)', status:'active' },
  { year: 2025, event: 'Proposed SME scope expansion (>250 employees threshold reduced)', status:'upcoming' },
  { year: 2026, event: 'Taxonomy Social Objectives under development (pending adoption)', status:'upcoming' },
];

const pipelineItems = [
  { category:'Renewable energy (solar + wind)', exposureBn: 1.8, assessmentPct: 65, expectedStatus:'Aligned' },
  { category:'Green building retrofits',         exposureBn: 1.2, assessmentPct: 48, expectedStatus:'Aligned' },
  { category:'EV fleet financing',               exposureBn: 0.6, assessmentPct: 72, expectedStatus:'Aligned' },
  { category:'Waste-to-energy (eligible)',       exposureBn: 0.4, assessmentPct: 30, expectedStatus:'Eligible' },
];

const coverageBreakdown = [
  { name:'Loans to NFCs (Non-Financial Corporates)', valueBn: 38.2, inScope: true  },
  { name:'Commercial Real Estate',                   valueBn: 21.6, inScope: true  },
  { name:'Project Finance',                          valueBn: 14.8, inScope: true  },
  { name:'Trade Finance',                            valueBn: 10.8, inScope: true  },
  { name:'SME Loans (<500 employees)',               valueBn: 12.0, inScope: false },
  { name:'Sovereign Bonds',                          valueBn: 18.4, inScope: false },
  { name:'Bank Counterparties',                      valueBn: 9.7,  inScope: false },
];

// ─── REUSABLE COMPONENTS ─────────────────────────────────────────────────────

const Card = ({ children, style }) => (
  <div style={{
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: '20px 24px',
    boxShadow: T.card, ...style,
  }}>
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <h3 style={{
    color: T.text, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
    textTransform: 'uppercase', marginBottom: 16, marginTop: 0,
  }}>
    {children}
  </h3>
);

const MetricBlock = ({ label, value, sub, color }) => (
  <div style={{ textAlign:'center' }}>
    <div style={{ fontSize: 28, fontWeight: 800, color: color || T.navy, letterSpacing: '-0.5px' }}>{value}</div>
    <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color: T.textMut, marginTop: 1 }}>{sub}</div>}
  </div>
);

const StatusBadge = ({ status }) => {
  const cfg = {
    'Aligned':     { bg:'rgba(6,200,150,0.15)',  color: T.green,  label:'Aligned'     },
    'Eligible':    { bg:'rgba(240,168,40,0.15)', color: T.amber,  label:'Eligible'     },
    'Not eligible':{ bg:'rgba(240,64,96,0.15)',  color: T.red,    label:'Not Eligible' },
    'Pass':        { bg:'rgba(6,200,150,0.12)',  color: T.green,  label:'Pass'         },
    'Pending':     { bg:'rgba(240,168,40,0.12)', color: T.amber,  label:'Pending'      },
    'N/A':         { bg:'rgba(58,78,100,0.25)',  color: T.textMut,label:'N/A'          },
    'Compliant':   { bg:'rgba(6,200,150,0.12)',  color: T.green,  label:'Compliant'    },
    'In progress': { bg:'rgba(240,168,40,0.12)', color: T.amber,  label:'In Progress'  },
  };
  const c = cfg[status] || cfg['N/A'];
  return (
    <span style={{
      background: c.bg, color: c.color, fontSize: 10, fontWeight: 700,
      padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap',
    }}>{c.label}</span>
  );
};

const ProgressBar = ({ pct, color, height = 8 }) => (
  <div style={{ width:'100%' }}>
    <div style={{ height, background: T.borderL, borderRadius: height / 2, overflow:'hidden' }}>
      <div style={{
        height: '100%', width: `${Math.min(100, pct)}%`,
        background: color || T.navy, borderRadius: height / 2,
        transition: 'width 0.5s ease',
      }} />
    </div>
  </div>
);

// ─── CUSTOM TOOLTIPS ──────────────────────────────────────────────────────────

const PctTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8,
      padding: '10px 14px', fontSize: 12, color: T.text,
    }}>
      {label && <div style={{ fontWeight: 700, marginBottom: 6, color: T.textSec }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.text, marginBottom: 2 }}>
          {p.name}: <strong>{p.value != null ? `${p.value}%` : '—'}</strong>
        </div>
      ))}
    </div>
  );
};

const EurosTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8,
      padding: '10px 14px', fontSize: 12, color: T.text,
    }}>
      {label && <div style={{ fontWeight: 700, marginBottom: 6, color: T.textSec }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.text, marginBottom: 2 }}>
          {p.name}: <strong>€{p.value != null ? p.value.toFixed(1) : '—'}bn</strong>
        </div>
      ))}
    </div>
  );
};

// ─── TAB 1: GAR OVERVIEW ──────────────────────────────────────────────────────

function TabGarOverview() {
  const garPct = 7.3;
  const target2025 = 12.0;
  const target2030 = 22.0;

  return (
    <div style={{ display:'grid', gap: 18 }}>
      {/* KPI Row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap: 14 }}>
        {[
          { label:'Total Covered Assets',     value:'€85.4bn', sub:'EU CRR scope',          color: T.sage  },
          { label:'Taxonomy-Aligned (Num.)',   value:'€6.2bn',  sub:'Denominator: €85.4bn',  color: T.navy  },
          { label:'Current GAR (2024)',        value:'7.3%',    sub:'CRR Art. 449a',          color: T.green },
          { label:'Peer Group Median GAR',     value:'6.8%',    sub:'EBA 2024 data',          color: T.amber },
          { label:'Target GAR 2025',           value:'12.0%',   sub:'Internal target',        color: T.gold  },
        ].map((m, i) => (
          <Card key={i}><MetricBlock {...m} /></Card>
        ))}
      </div>

      {/* GAR Formula */}
      <Card>
        <SectionTitle>Green Asset Ratio — Regulatory Formula (EU Taxonomy Reg. 2020/852)</SectionTitle>
        <div style={{
          background:'#0a1520', border:`1px solid ${T.borderL}`, borderRadius: 8,
          padding:'18px 24px', display:'flex', alignItems:'center', gap: 24, flexWrap:'wrap',
        }}>
          <div style={{ textAlign:'center', flex:1, minWidth: 140 }}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Numerator</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.green }}>Taxonomy-Aligned Assets</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.green, marginTop: 4 }}>€6.2bn</div>
          </div>
          <div style={{ fontSize: 36, color: T.textMut, fontWeight: 200 }}>÷</div>
          <div style={{ textAlign:'center', flex:1, minWidth: 140 }}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Denominator</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.sage }}>Total Covered Assets</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.sage, marginTop: 4 }}>€85.4bn</div>
          </div>
          <div style={{ fontSize: 36, color: T.textMut, fontWeight: 200 }}>=</div>
          <div style={{ textAlign:'center', flex:'0 0 130px' }}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6, textTransform:'uppercase', letterSpacing:'0.06em' }}>GAR</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: T.navy, letterSpacing:'-1px' }}>7.3%</div>
          </div>
        </div>
      </Card>

      {/* Progress bars + trend chart */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.6fr', gap: 14 }}>
        <Card>
          <SectionTitle>Progress to Targets</SectionTitle>
          <div style={{ marginBottom: 22 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: T.textSec }}>2025 Target (12%)</span>
              <span style={{ fontSize: 13, color: T.green, fontWeight: 700 }}>
                {((garPct / target2025) * 100).toFixed(0)}% achieved
              </span>
            </div>
            <ProgressBar pct={(garPct / target2025) * 100} color={T.green} height={12} />
            <div style={{ display:'flex', justifyContent:'space-between', marginTop: 5 }}>
              <span style={{ fontSize: 10, color: T.textMut }}>0%</span>
              <span style={{ fontSize: 10, color: T.amber }}>12% target</span>
            </div>
          </div>
          <div style={{ marginBottom: 22 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: T.textSec }}>2030 Target (22%)</span>
              <span style={{ fontSize: 13, color: T.amber, fontWeight: 700 }}>
                {((garPct / target2030) * 100).toFixed(0)}% achieved
              </span>
            </div>
            <ProgressBar pct={(garPct / target2030) * 100} color={T.amber} height={12} />
            <div style={{ display:'flex', justifyContent:'space-between', marginTop: 5 }}>
              <span style={{ fontSize: 10, color: T.textMut }}>0%</span>
              <span style={{ fontSize: 10, color: T.textMut }}>22% target</span>
            </div>
          </div>
          <div style={{
            background:'#0a1520', borderRadius: 8, padding:'14px 16px',
            display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12,
          }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize: 11, color: T.textSec }}>YoY improvement</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.green }}>+2.2pp</div>
              <div style={{ fontSize: 10, color: T.textMut }}>vs. 2023 (5.1%)</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize: 11, color: T.textSec }}>vs. peer median</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.sage }}>+0.5pp</div>
              <div style={{ fontSize: 10, color: T.textMut }}>peer: 6.8% (EBA)</div>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle>GAR Historical Trend & Forward Targets (%)</SectionTitle>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={garTrend} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="year" tick={{ fill: T.textSec, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={v => `${v}%`}
                tick={{ fill: T.textSec, fontSize: 11 }}
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<PctTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: T.textSec }} />
              <Bar dataKey="gar"    name="Actual GAR"  fill={T.green} radius={[3,3,0,0]} maxBarSize={44} />
              <Bar dataKey="target" name="Target"      fill={T.amber} radius={[3,3,0,0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Covered asset scope */}
      <Card>
        <SectionTitle>Covered Asset Scope — CRR / EU Taxonomy Definition</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap: 10 }}>
          {coverageBreakdown.map((item, i) => (
            <div key={i} style={{
              background:'#0a1520', borderRadius: 8, padding:'12px 16px',
              display:'flex', alignItems:'center', justifyContent:'space-between',
              border:`1px solid ${item.inScope ? 'rgba(6,200,150,0.2)' : T.borderL}`,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                <span style={{ fontSize: 16, color: item.inScope ? T.green : T.red, flexShrink: 0 }}>
                  {item.inScope ? '✓' : '✗'}
                </span>
                <div>
                  <div style={{ fontSize: 12, color: T.text }}>{item.name}</div>
                  {!item.inScope && (
                    <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>Excluded from GAR denominator</div>
                  )}
                </div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: item.inScope ? T.sage : T.textMut, marginLeft: 12, flexShrink: 0 }}>
                €{item.valueBn}bn
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── TAB 2: ASSET BREAKDOWN ───────────────────────────────────────────────────

function TabAssetBreakdown() {
  const total = 6.2;
  const pieData = envObjectives
    .map(o => ({ name: o.code, value: parseFloat(o.aligned.toFixed(2)), color: o.color }))
    .filter(d => d.value >= 0.01);

  const dnshPcts = [78, 65, 52, 44, 30, 28];

  return (
    <div style={{ display:'grid', gap: 18 }}>
      {/* Summary row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 14 }}>
        {[
          { label:'Total Aligned (Numerator)', value:'€6.2bn',  color: T.green  },
          { label:'CCM Share of Aligned',      value:'77%',     color: T.navy   },
          { label:'DNSH Assessment Complete',  value:'78%',     color: T.sage   },
          { label:'Environmental Objectives',  value:'6 / 6',   color: T.amber  },
        ].map((m, i) => (
          <Card key={i}><MetricBlock {...m} /></Card>
        ))}
      </div>

      {/* Pie + stacked bar */}
      <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap: 14 }}>
        <Card>
          <SectionTitle>Alignment by Objective</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData} dataKey="value" nameKey="name"
                cx="50%" cy="50%" outerRadius={80} innerRadius={44}
                paddingAngle={3}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={v => `€${v.toFixed(2)}bn`}
                contentStyle={{ background: T.surfaceH, border:`1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12 }}>
            {envObjectives.map((obj, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 7 }}>
                <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: obj.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: T.textSec }}>{obj.code} — {obj.label.split(' ').slice(0,2).join(' ')}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.text }}>€{obj.aligned.toFixed(1)}bn</span>
                  <span style={{ fontSize: 10, color: obj.color, minWidth: 28, textAlign:'right' }}>
                    {obj.aligned >= 0.1 ? `${((obj.aligned / total) * 100).toFixed(0)}%` : '<1%'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>Taxonomy-Eligible vs. Aligned by Environmental Objective (€bn)</SectionTitle>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={envObjectives}
              margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="code" tick={{ fill: T.textSec, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.textSec, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<EurosTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: T.textSec }} />
              <Bar dataKey="eligible" name="Taxonomy-Eligible" fill={T.sage}  radius={[3,3,0,0]} maxBarSize={36} />
              <Bar dataKey="aligned"  name="Taxonomy-Aligned"  fill={T.green} radius={[3,3,0,0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Objective detail table */}
      <Card>
        <SectionTitle>Six Environmental Objectives — EU Taxonomy Regulation (EU) 2020/852</SectionTitle>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                {['Code','Objective','Aligned (€bn)','Eligible (€bn)','Not Eligible (€bn)','% of Aligned','DNSH Assessed'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'8px 12px', color: T.textSec, fontWeight: 600, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {envObjectives.map((obj, i) => (
                <tr key={i} style={{
                  borderBottom:`1px solid ${T.borderL}`,
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                }}>
                  <td style={{ padding:'10px 12px' }}>
                    <span style={{
                      background:`rgba(0,0,0,0.25)`, color: obj.color,
                      padding:'2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                      border:`1px solid ${obj.color}33`,
                    }}>
                      {obj.code}
                    </span>
                  </td>
                  <td style={{ padding:'10px 12px', color: T.text }}>{obj.label}</td>
                  <td style={{ padding:'10px 12px', color: T.green, fontWeight: 700 }}>
                    €{obj.aligned >= 0.1 ? obj.aligned.toFixed(1) : '<0.1'}bn
                  </td>
                  <td style={{ padding:'10px 12px', color: T.sage }}>€{obj.eligible.toFixed(1)}bn</td>
                  <td style={{ padding:'10px 12px', color: T.textSec }}>€{obj.notEligible.toFixed(1)}bn</td>
                  <td style={{ padding:'10px 12px', color: T.navy, fontWeight: 600 }}>
                    {obj.aligned >= 0.1 ? `${((obj.aligned / total) * 100).toFixed(0)}%` : '<1%'}
                  </td>
                  <td style={{ padding:'10px 12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap: 8, minWidth: 120 }}>
                      <ProgressBar pct={dnshPcts[i]} color={dnshPcts[i] > 60 ? T.green : T.amber} height={6} />
                      <span style={{ fontSize: 10, color: T.textSec, flexShrink: 0 }}>{dnshPcts[i]}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{
          marginTop: 14, padding:'10px 14px',
          background:'rgba(240,168,40,0.06)', borderRadius: 8,
          border:`1px solid rgba(240,168,40,0.2)`,
        }}>
          <span style={{ fontSize: 11, color: T.amber }}>
            ⚠ DNSH (Do No Significant Harm): 78% of eligible assets have completed assessment. Assets without DNSH
            confirmation cannot be counted as taxonomy-aligned. Active data collection is ongoing for the remaining 22%.
          </span>
        </div>
      </Card>
    </div>
  );
}

// ─── TAB 3: TSC ASSESSMENT ────────────────────────────────────────────────────

function TabTscAssessment() {
  return (
    <div style={{ display:'grid', gap: 18 }}>
      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 14 }}>
        {[
          { label:'TSC Activities Assessed', value:'8',       color: T.sage  },
          { label:'Total Aligned (TSC)',      value:'€6.2bn',  color: T.green },
          { label:'DNSH Pass Rate',           value:'75%',     color: T.navy  },
          { label:'MSS Compliance Rate',      value:'75%',     color: T.amber },
        ].map((m, i) => (
          <Card key={i}><MetricBlock {...m} /></Card>
        ))}
      </div>

      {/* Three-step methodology */}
      <Card>
        <SectionTitle>Technical Screening Criteria — Three-Step Methodology</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: 14 }}>
          {[
            {
              step:'1. Substantial Contribution',
              color: T.green,
              desc:'The economic activity must substantially contribute to at least one of the 6 environmental objectives per the published TSC thresholds in EU Delegated Acts 2021/2139 and 2023/2486.',
            },
            {
              step:'2. Do No Significant Harm (DNSH)',
              color: T.sage,
              desc:'The activity must not significantly harm any of the other 5 objectives — assessed via DNSH criteria defined for each activity in the same delegated regulation.',
            },
            {
              step:'3. Minimum Social Safeguards (MSS)',
              color: T.amber,
              desc:'The undertaking must align with OECD Guidelines for Multinational Enterprises, UN Guiding Principles on Business & Human Rights, and core ILO Conventions.',
            },
          ].map((s, i) => (
            <div key={i} style={{
              background:'#0a1520', borderRadius: 8, padding:'16px 18px',
              border:`1px solid ${T.borderL}`,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: s.color, marginBottom: 8 }}>{s.step}</div>
              <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.7 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* TSC table */}
      <Card>
        <SectionTitle>Activity-Level TSC Assessment with EU Taxonomy References</SectionTitle>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                {['NACE Code','EU Ref.','Economic Activity','TSC Threshold','Exposure (€bn)','Status','DNSH','MSS'].map(h => (
                  <th key={h} style={{
                    textAlign:'left', padding:'8px 10px', color: T.textSec,
                    fontWeight: 600, whiteSpace:'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tscActivities.map((row, i) => (
                <tr key={i} style={{
                  borderBottom:`1px solid ${T.borderL}`,
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                }}>
                  <td style={{ padding:'9px 10px', color: T.textSec, fontFamily:'monospace', fontSize: 10 }}>
                    {row.nace}
                  </td>
                  <td style={{ padding:'9px 10px' }}>
                    <span style={{
                      background:'rgba(14,165,233,0.1)', color: T.sage,
                      padding:'2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                    }}>
                      {row.ref}
                    </span>
                  </td>
                  <td style={{ padding:'9px 10px', color: T.text, maxWidth: 210 }}>{row.activity}</td>
                  <td style={{ padding:'9px 10px', color: T.textMut, maxWidth: 230, fontSize: 10, lineHeight: 1.55 }}>
                    {row.tscThreshold}
                  </td>
                  <td style={{ padding:'9px 10px', color: T.navy, fontWeight: 700 }}>
                    €{row.exposure.toFixed(1)}bn
                  </td>
                  <td style={{ padding:'9px 10px' }}><StatusBadge status={row.status} /></td>
                  <td style={{ padding:'9px 10px' }}><StatusBadge status={row.dnsh} /></td>
                  <td style={{ padding:'9px 10px' }}><StatusBadge status={row.mss} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{
          marginTop: 14, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: 10,
        }}>
          {[
            { color: T.green, label:'Aligned', desc:'All three conditions met: substantial contribution + DNSH pass + MSS compliance' },
            { color: T.amber, label:'Eligible', desc:'Activity is in scope of EU Taxonomy but not all alignment criteria are yet confirmed' },
            { color: T.red,   label:'Not Eligible', desc:'Economic activity is not listed in the EU Taxonomy delegated acts' },
          ].map((item, i) => (
            <div key={i} style={{
              background:'#0a1520', borderRadius: 8, padding:'10px 14px',
              display:'flex', gap: 10, alignItems:'flex-start',
              border:`1px solid ${item.color}22`,
            }}>
              <span style={{ color: item.color, fontSize: 14, flexShrink: 0, marginTop: 1 }}>●</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: item.color, marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 10, color: T.textMut, lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── TAB 4: PATHWAY ───────────────────────────────────────────────────────────

function TabPathway() {
  const additionalNeeded = (((12 - 7.3) / 100) * 85.4).toFixed(1);

  return (
    <div style={{ display:'grid', gap: 18 }}>
      {/* Gap analysis */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 14 }}>
        {[
          { label:'Additional Alignment Needed (2025)', value:`€${additionalNeeded}bn`, color: T.amber },
          { label:'SME Exclusion (pending scope expansion)', value:'€12.0bn',           color: T.red   },
          { label:'NFCs Without NACE Codes',               value:'45%',                  color: T.amber },
          { label:'Pipeline Under Assessment',             value:'€4.0bn',               color: T.sage  },
        ].map((m, i) => (
          <Card key={i}><MetricBlock {...m} /></Card>
        ))}
      </div>

      {/* Regulatory timeline */}
      <Card>
        <SectionTitle>Regulatory Compliance Timeline</SectionTitle>
        <div style={{ position:'relative', paddingLeft: 32, marginTop: 8 }}>
          <div style={{
            position:'absolute', left: 14, top: 8, bottom: 8,
            width: 2, background: T.borderL, borderRadius: 1,
          }} />
          {pathwayMilestones.map((m, i) => {
            const dotColor = m.status === 'complete' ? T.green : m.status === 'active' ? T.navy : T.textMut;
            return (
              <div key={i} style={{ position:'relative', marginBottom: 26 }}>
                <div style={{
                  position:'absolute', left: -24, top: 5, width: 14, height: 14,
                  borderRadius:'50%', background: dotColor,
                  border:`2px solid ${m.status === 'active' ? T.navyL : 'transparent'}`,
                  boxShadow: m.status === 'active' ? `0 0 10px ${T.navy}80` : 'none',
                }} />
                <div style={{ display:'flex', alignItems:'flex-start', gap: 16 }}>
                  <div style={{
                    flexShrink: 0, width: 40, fontSize: 12, fontWeight: 700,
                    color: dotColor, paddingTop: 2,
                  }}>
                    {m.year}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: T.text, lineHeight: 1.55 }}>{m.event}</div>
                    <div style={{ marginTop: 5 }}>
                      {m.status === 'complete' && (
                        <span style={{
                          fontSize: 10, color: T.green,
                          background:'rgba(6,200,150,0.1)', padding:'2px 8px', borderRadius: 4,
                        }}>Complete</span>
                      )}
                      {m.status === 'active' && (
                        <span style={{
                          fontSize: 10, color: T.navy,
                          background:'rgba(6,200,150,0.1)', padding:'2px 8px', borderRadius: 4,
                          border:`1px solid rgba(6,200,150,0.3)`,
                        }}>Currently binding</span>
                      )}
                      {m.status === 'upcoming' && (
                        <span style={{
                          fontSize: 10, color: T.textMut,
                          background:'rgba(58,78,100,0.3)', padding:'2px 8px', borderRadius: 4,
                        }}>Upcoming</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Pipeline */}
      <Card>
        <SectionTitle>Taxonomy-Eligible Pipeline — Under Active Assessment</SectionTitle>
        <div style={{ display:'grid', gap: 10 }}>
          {pipelineItems.map((item, i) => (
            <div key={i} style={{
              background:'#0a1520', borderRadius: 8, padding:'14px 18px',
              border:`1px solid ${T.borderL}`,
              display:'grid', gridTemplateColumns:'1fr auto auto', alignItems:'center', gap: 20,
            }}>
              <div>
                <div style={{ fontSize: 13, color: T.text, marginBottom: 6 }}>{item.category}</div>
                <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <ProgressBar
                      pct={item.assessmentPct}
                      color={item.assessmentPct > 60 ? T.green : T.amber}
                      height={6}
                    />
                  </div>
                  <span style={{ fontSize: 10, color: T.textSec, flexShrink: 0 }}>
                    {item.assessmentPct}% assessed
                  </span>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>€{item.exposureBn.toFixed(1)}bn</div>
                <div style={{ fontSize: 10, color: T.textMut }}>exposure</div>
              </div>
              <StatusBadge status={item.expectedStatus} />
            </div>
          ))}
        </div>
      </Card>

      {/* Key constraints */}
      <Card>
        <SectionTitle>Key Constraints & Action Plan</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: 14 }}>
          {[
            {
              title:'Data Availability',
              color: T.amber,
              items:[
                '45% of NFC clients have not yet disclosed NACE economic activity codes',
                'Action: Client data collection programme launched Q1 2024',
                'Target: 85% NACE code coverage by end of 2024',
              ],
            },
            {
              title:'SME Scope Exclusion',
              color: T.red,
              items:[
                '€12bn in loans to SMEs (<500 employees) excluded from denominator until scope expansion',
                'EC proposed partial expansion for entities above 250 employees from 2025',
                'When included: denominator rises ~14%, diluting the headline GAR',
              ],
            },
            {
              title:'DNSH Data Gaps',
              color: T.sage,
              items:[
                '22% of eligible assets are pending full DNSH assessment',
                'Biodiversity and water-use data remain hardest to source from clients',
                'Engaging environmental data providers for automated DNSH coverage',
              ],
            },
          ].map((block, i) => (
            <div key={i} style={{
              background:'#0a1520', borderRadius: 8, padding:'16px 18px',
              border:`1px solid ${block.color}22`,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: block.color, marginBottom: 10 }}>{block.title}</div>
              {block.items.map((item, j) => (
                <div key={j} style={{ display:'flex', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: block.color, fontSize: 12, flexShrink: 0, marginTop: 1 }}>•</span>
                  <span style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── MAIN PAGE COMPONENT ─────────────────────────────────────────────────────

const TABS = [
  { id: 0, label: 'GAR Overview' },
  { id: 1, label: 'Asset Breakdown' },
  { id: 2, label: 'TSC Assessment' },
  { id: 3, label: 'Pathway' },
];

export default function GreenAssetRatioPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{ minHeight:'100vh', background: T.bg, fontFamily: T.font, color: T.text }}>
      {/* Page Header */}
      <div style={{
        background: T.surface, borderBottom:`1px solid ${T.border}`,
        padding:'24px 32px 0',
      }}>
        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'flex-start',
          marginBottom: 16, gap: 16, flexWrap:'wrap',
        }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 6 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing:'0.1em',
                background:'rgba(6,200,150,0.1)', color: T.green,
                padding:'3px 8px', borderRadius: 4,
              }}>EP-AJ3</span>
              <span style={{ fontSize: 10, color: T.textMut }}>
                Sprint AJ · Financed Emissions & Climate Banking Analytics
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing:'-0.4px' }}>
              Green Asset Ratio — EU Taxonomy Compliance
            </h1>
            <p style={{ margin:'6px 0 0', fontSize: 13, color: T.textSec }}>
              Mandatory GAR calculation for CRR institutions · Regulation (EU) 2020/852 · CRR Article 449a · From 2024
            </p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap: 8, alignItems:'flex-end' }}>
            <span style={{
              fontSize: 11, padding:'5px 12px', borderRadius: 6,
              background:'rgba(6,200,150,0.12)', color: T.green,
              border:`1px solid rgba(6,200,150,0.3)`,
            }}>
              ✓ Regulatory Framework: EU Taxonomy Regulation (EU) 2020/852 — Real legal basis
            </span>
            <span style={{
              fontSize: 11, padding:'5px 12px', borderRadius: 6,
              background:'rgba(240,168,40,0.1)', color: T.amber,
              border:`1px solid rgba(240,168,40,0.25)`,
            }}>
              ⚠ Portfolio allocations are illustrative
            </span>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display:'flex', gap: 2 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: activeTab === tab.id ? 'rgba(6,200,150,0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? `2px solid ${T.green}` : '2px solid transparent',
              color: activeTab === tab.id ? T.green : T.textSec,
              padding:'10px 20px', cursor:'pointer', fontSize: 13,
              fontWeight: activeTab === tab.id ? 700 : 400,
              transition:'all 0.15s', fontFamily: T.font,
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ padding:'24px 32px' }}>
        {activeTab === 0 && <TabGarOverview />}
        {activeTab === 1 && <TabAssetBreakdown />}
        {activeTab === 2 && <TabTscAssessment />}
        {activeTab === 3 && <TabPathway />}
      </div>

      {/* Footer */}
      <div style={{
        margin:'0 32px 24px', padding:'12px 0',
        borderTop:`1px solid ${T.borderL}`,
        display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap: 8,
      }}>
        <span style={{ fontSize: 11, color: T.textMut }}>
          EP-AJ3 · Green Asset Ratio · Reg (EU) 2020/852 · Del. Reg 2021/2139 & 2023/2486 · CRR Art. 449a
        </span>
        <span style={{ fontSize: 11, color: T.textMut }}>
          Reference date: 31 Dec 2024 · Currency: EUR · Illustrative portfolio data
        </span>
      </div>
    </div>
  );
}
