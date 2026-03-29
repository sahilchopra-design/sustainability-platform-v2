import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { REGULATORY_THRESHOLDS } from '../../../data/referenceData';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const TABS = [
  'Fund Classification',
  'PAI Indicators',
  'Sustainable Investment',
  'Disclosure Builder',
  'Periodic Reporting',
  'SFDR v2 Reform',
];

/* ── helpers ──────────────────────────────────────────────────── */
const KpiCard = ({ label, value, sub, color }) => (
  <div style={{
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
    padding: '18px 22px', boxShadow: T.card, borderTop: `3px solid ${color || T.navy}`,
  }}>
    <div style={{ fontSize: 12, color: T.textMut, fontWeight: 500, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Badge = ({ label, color }) => {
  const map = {
    green: { bg: '#dcfce7', text: '#15803d' },
    red: { bg: '#fee2e2', text: '#b91c1c' },
    amber: { bg: '#fef3c7', text: '#92400e' },
    navy: { bg: '#dbeafe', text: '#1e40af' },
    sage: { bg: '#d1fae5', text: '#065f46' },
    gray: { bg: '#f3f4f6', text: '#374151' },
    gold: { bg: '#fef9c3', text: '#713f12' },
  };
  const c = map[color] || map.gray;
  return (
    <span style={{
      padding: '2px 9px', borderRadius: 10, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.text, whiteSpace: 'nowrap',
    }}>{label}</span>
  );
};

const SectionTitle = ({ children }) => (
  <div style={{
    fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 14,
    paddingBottom: 8, borderBottom: `2px solid ${T.gold}`,
  }}>{children}</div>
);

const Card = ({ children, style }) => (
  <div style={{
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
    padding: 20, boxShadow: T.card, ...style,
  }}>{children}</div>
);

const StatusDot = ({ status }) => {
  const color = status === 'green' ? T.green : status === 'red' ? T.red : T.amber;
  return <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: color, marginRight: 6 }} />;
};

/* ── data ─────────────────────────────────────────────────────── */
const FUNDS = [
  { name: 'AA Global Opportunities', aum: 18.4, cls: 'Article 6', reclass: 'Low',    pai: 'N', si: null   },
  { name: 'AA Income & Value',        aum: 12.1, cls: 'Article 6', reclass: 'Low',    pai: 'N', si: null   },
  { name: 'AA Emerging Markets',      aum:  9.3, cls: 'Article 6', reclass: 'Medium', pai: 'N', si: null   },
  { name: 'AA ESG Leaders',           aum: 16.8, cls: 'Article 8', reclass: 'Low',    pai: 'Y', si: '42%'  },
  { name: 'AA Sustainable Europe',    aum: 14.2, cls: 'Article 8', reclass: 'Medium', pai: 'Y', si: '55%'  },
  { name: 'AA Clean Energy',          aum: 11.9, cls: 'Article 8', reclass: 'High',   pai: 'Y', si: '38%'  },
  { name: 'AA Responsible Credit',    aum:  8.6, cls: 'Article 8', reclass: 'Low',    pai: 'Y', si: '49%'  },
  { name: 'AA Social Bond',           aum:  7.4, cls: 'Article 8', reclass: 'Medium', pai: 'Y', si: '61%'  },
  { name: 'AA Gender Lens',           aum:  5.8, cls: 'Article 8', reclass: 'High',   pai: 'Y', si: '33%'  },
  { name: 'AA Climate Impact',        aum: 12.3, cls: 'Article 9', reclass: 'Low',    pai: 'Y', si: '91%'  },
  { name: 'AA Green Infrastructure',  aum:  9.7, cls: 'Article 9', reclass: 'Medium', pai: 'Y', si: '84%'  },
  { name: 'AA Biodiversity Fund',     aum:  6.0, cls: 'Article 9', reclass: 'High',   pai: 'Y', si: '76%'  },
];

const PIE_DATA = [
  { name: 'Article 6', value: 39.8, color: T.textMut },
  { name: 'Article 8', value: 64.7, color: T.navyL },
  { name: 'Article 9', value: 28.0, color: T.sage },
];

const PAI_DATA = [
  { id: 1,  name: 'GHG emissions intensity',             category: 'Climate', portfolio: 187, benchmark: 145, target: 140, unit: 'tCO2e/€M', status: 'red',   template: 'Complete'   },
  { id: 2,  name: 'Carbon footprint',                    category: 'Climate', portfolio: 124, benchmark: 110, target: 100, unit: 'tCO2e/€M', status: 'amber', template: 'Complete'   },
  { id: 3,  name: 'GHG intensity of investees',          category: 'Climate', portfolio: 168, benchmark: 155, target: 140, unit: 'tCO2e/€M', status: 'amber', template: 'Complete'   },
  { id: 4,  name: 'Fossil fuel exposure',                category: 'Climate', portfolio: 8.2, benchmark: 5.0, target: 4.0, unit: '%',          status: 'red',   template: 'Complete'   },
  { id: 5,  name: 'Non-renewable energy',                category: 'Climate', portfolio: 61,  benchmark: 55,  target: 50,  unit: '%',          status: 'amber', template: 'Incomplete' },
  { id: 6,  name: 'Energy intensity (high impact)',      category: 'Climate', portfolio: 342, benchmark: 310, target: 290, unit: 'MWh/€M',    status: 'amber', template: 'Complete'   },
  { id: 7,  name: 'Biodiversity-sensitive activities',   category: 'Climate', portfolio: 4.1, benchmark: 3.0, target: 2.5, unit: '%',          status: 'amber', template: 'Complete'   },
  { id: 8,  name: 'UNGC/OECD violations',               category: 'Social',  portfolio: 3.2, benchmark: 2.0, target: 1.5, unit: '%',          status: 'amber', template: 'Complete'   },
  { id: 9,  name: 'Lack of UNGC monitoring process',    category: 'Social',  portfolio: 7.8, benchmark: 6.0, target: 5.0, unit: '%',          status: 'amber', template: 'Incomplete' },
  { id: 10, name: 'Gender pay gap',                      category: 'Social',  portfolio: 18.4, benchmark: 14.0, target: 12.0, unit: '%',       status: 'red',   template: 'Complete'   },
  { id: 11, name: 'Board gender diversity',              category: 'Social',  portfolio: 38,  benchmark: 40,  target: 45,  unit: '%',          status: 'amber', template: 'Complete'   },
  { id: 12, name: 'Controversial weapons',               category: 'Social',  portfolio: 0.0, benchmark: 0.0, target: 0.0, unit: '%',          status: 'green', template: 'Complete'   },
  { id: 13, name: 'Emissions to water',                  category: 'Social',  portfolio: 2.1, benchmark: 1.8, target: 1.5, unit: 'T/€M',      status: 'amber', template: 'Incomplete' },
  { id: 14, name: 'Hazardous waste ratio',               category: 'Social',  portfolio: 1.4, benchmark: 1.2, target: 1.0, unit: 'T/€M',      status: 'amber', template: 'Complete'   },
  { id: 15, name: 'Scope 3 GHG emissions',               category: 'Social',  portfolio: 412, benchmark: 380, target: 350, unit: 'tCO2e/€M', status: 'amber', template: 'Complete'   },
  { id: 16, name: 'Unadjusted gender pay gap',           category: 'Social',  portfolio: 21.3, benchmark: 16.0, target: 14.0, unit: '%',       status: 'red',   template: 'Incomplete' },
  { id: 17, name: 'Excessive CEO pay ratio',             category: 'Social',  portfolio: 124, benchmark: 100, target: 90,  unit: 'x',          status: 'amber', template: 'Complete'   },
  { id: 18, name: 'Lack of carbon reduction initiatives',category: 'Social',  portfolio: 12.4, benchmark: 8.0, target: 6.0, unit: '%',         status: 'amber', template: 'Complete'   },
];

const PAI_CHART_DATA = PAI_DATA.slice(0, 12).map(p => ({
  name: `PAI ${p.id}`,
  Portfolio: p.portfolio,
  Benchmark: p.benchmark,
  Target: p.target,
}));

const HOLDINGS = [
  { name: 'NextEra Energy',     contrib: true,  dnsh: true,  governance: true  },
  { name: 'Vestas Wind',        contrib: true,  dnsh: true,  governance: true  },
  { name: 'Enel SpA',           contrib: true,  dnsh: true,  governance: true  },
  { name: 'Orsted',             contrib: true,  dnsh: true,  governance: true  },
  { name: 'Schneider Electric', contrib: true,  dnsh: true,  governance: true  },
  { name: 'Iberdrola',          contrib: true,  dnsh: true,  governance: true  },
  { name: 'Waste Management',   contrib: true,  dnsh: false, governance: true  },
  { name: 'Prologis',           contrib: true,  dnsh: true,  governance: false },
  { name: 'Xylem Inc',          contrib: true,  dnsh: true,  governance: true  },
  { name: 'Tesla Inc',          contrib: true,  dnsh: false, governance: true  },
  { name: 'ASML Holding',       contrib: true,  dnsh: true,  governance: true  },
  { name: 'Danaher Corp',       contrib: true,  dnsh: true,  governance: false },
  { name: 'Ametek Inc',         contrib: false, dnsh: true,  governance: true  },
  { name: 'Shell plc',          contrib: false, dnsh: false, governance: true  },
  { name: 'TotalEnergies',      contrib: false, dnsh: false, governance: true  },
  { name: 'Repsol',             contrib: false, dnsh: false, governance: false },
  { name: 'BASF SE',            contrib: true,  dnsh: false, governance: true  },
  { name: 'Air Products',       contrib: true,  dnsh: true,  governance: true  },
  { name: 'Linde plc',          contrib: true,  dnsh: true,  governance: true  },
  { name: 'CF Industries',      contrib: false, dnsh: false, governance: true  },
];

const DISCLOSURE_SECTIONS = [
  { id: 1, name: 'Product overview and ESG characteristics', status: 'complete', autoPop: true  },
  { id: 2, name: 'E or S characteristics promoted',          status: 'complete', autoPop: true  },
  { id: 3, name: 'Sustainable investment proportion',        status: 'complete', autoPop: true  },
  { id: 4, name: 'Asset allocation methodology',            status: 'complete', autoPop: true  },
  { id: 5, name: 'Monitoring methodology',                  status: 'complete', autoPop: false },
  { id: 6, name: 'Engagement policies',                     status: 'complete', autoPop: false },
  { id: 7, name: 'Reference benchmark',                     status: 'incomplete', autoPop: true  },
  { id: 8, name: 'Historical performance (periodic report)',status: 'incomplete', autoPop: true  },
];

const ERRORS = [
  { regulator: 'AFM',   error: 'Ambiguous ESG characteristic description',       fix: 'Use precise, measurable characteristics with defined KPIs' },
  { regulator: 'FCA',   error: 'Missing PAI consideration statement for Art 8',  fix: 'Add explicit PAI consideration section per RTS Annex II, Section 2' },
  { regulator: 'BaFin', error: 'Inconsistent sustainable investment %',           fix: 'Align pre-contractual and periodic report SI% figures' },
  { regulator: 'AFM',   error: 'Benchmark reference missing for Art 8 fund',     fix: 'Either name the index or include "no benchmark" statement per Art 8(1)' },
  { regulator: 'ESMA',  error: 'Good governance assessment not documented',       fix: 'Include written good governance policy with minimum criteria' },
];

const PERIODIC_METRICS = [
  { metric: 'Sustainable Investment %',   y2023: 61, y2024: 67 },
  { metric: 'Taxonomy Alignment %',       y2023: 24, y2024: 31 },
  { metric: 'PAI 1 GHG (tCO2e/€M)',      y2023: 204, y2024: 187 },
  { metric: 'PAI 4 Fossil Fuel %',        y2023: 9.8, y2024: 8.2 },
  { metric: 'PAI 10 Gender Pay Gap %',    y2023: 21.1, y2024: 18.4 },
  { metric: 'PAI 11 Board Diversity %',   y2023: 35, y2024: 38 },
  { metric: 'ESG Char. Attainment Score', y2023: 78, y2024: 83 },
  { metric: 'Engagement Actions',         y2023: 142, y2024: 189 },
  { metric: 'UNGC Violations %',          y2023: 4.1, y2024: 3.2 },
  { metric: 'Art 8 Compliance Score',     y2023: 74, y2024: 81 },
];

const GREENWASH_FLAGS = [
  { pattern: 'SI% target set below actual achievement',         funds: 2, severity: 'Low'  },
  { pattern: 'Vague ESG characteristics (no measurable KPI)',   funds: 3, severity: 'High' },
  { pattern: 'Inconsistent DNSH criteria across disclosures',   funds: 1, severity: 'High' },
  { pattern: 'Benchmark "not used" despite tracking one',       funds: 2, severity: 'Medium' },
  { pattern: 'Engagement policy copied without fund specifics', funds: 4, severity: 'Medium' },
  { pattern: 'SI% includes non-sustainable investees',          funds: 1, severity: 'High' },
  { pattern: 'Carbon data from unverified third party',         funds: 3, severity: 'Medium' },
  { pattern: 'Art 9 fund with SI% < 85%',                      funds: 1, severity: 'High' },
];

const REFORM_PROPOSALS = [
  {
    id: 1, title: 'New product category system',
    current: 'Art 6 / Art 8 / Art 9',
    proposed: 'Sustainable / Transitioning / ESG Collection',
    status: 'Proposed', impact: 'High',
  },
  {
    id: 2, title: 'Mandatory SI thresholds',
    current: 'No minimum for Art 8; recommended 90%+ for Art 9',
    proposed: 'Minimum 30% Sustainable, 50% Transitioning',
    status: 'Proposed', impact: 'High',
  },
  {
    id: 3, title: 'Clearer SI definition',
    current: 'Art 2(17) — flexible, interpreted differently',
    proposed: 'Standardised criteria + mandatory indicators',
    status: 'Under Review', impact: 'High',
  },
  {
    id: 4, title: 'PAI consolidation',
    current: '18 mandatory + 46 optional',
    proposed: 'Reduced core set, sectoral add-ons',
    status: 'Proposed', impact: 'Medium',
  },
  {
    id: 5, title: 'EU Taxonomy integration',
    current: 'Parallel frameworks, partial overlap',
    proposed: 'Taxonomy alignment mandatory for "Sustainable" category',
    status: 'Proposed', impact: 'High',
  },
];

const REFORM_TIMELINE = [
  { event: 'SFDR Targeted Consultation', date: 'Sep–Dec 2023', status: 'done'    },
  { event: 'ESA Joint Opinion',          date: 'Jun 2024',      status: 'done'    },
  { event: 'Commission Assessment',      date: 'Q4 2024',       status: 'done'    },
  { event: 'Level 1 Revision Proposal',  date: 'Q2 2025',       status: 'current' },
  { event: 'Level 2 RTS Update',         date: '2026',          status: 'future'  },
  { event: 'Full Implementation',        date: '2027',          status: 'future'  },
];

const AUM_MIGRATION = [
  { category: 'Stays Art 9 → Sustainable',       aum: 19.8, color: T.sage  },
  { category: 'Art 9 → Art 8 equiv. (downgrade)', aum: 8.2,  color: T.red   },
  { category: 'Art 8 → Sustainable',              aum: 22.4, color: T.navyL },
  { category: 'Art 8 → ESG Collection',           aum: 42.3, color: T.amber },
  { category: 'Art 8 → Review required',          aum: 14.7, color: T.gold  },
];

/* ── Tab components ───────────────────────────────────────────── */

function Tab1FundClassification() {
  const reclassColor = r => r === 'Low' ? 'green' : r === 'Medium' ? 'amber' : 'red';
  const clsColor     = c => c === 'Article 9' ? 'sage' : c === 'Article 8' ? 'navy' : 'gray';

  return (
    <div>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <KpiCard label="Total AUM Classified"       value="€142 bn"  sub="12 funds across 3 tiers" color={T.navy} />
        <KpiCard label="Article 9 AUM"              value="€28.0 bn" sub="20% of total AUM"        color={T.sage} />
        <KpiCard label="Funds at Reclassification Risk" value="4"    sub="Medium or High risk"     color={T.red}  />
        <KpiCard label="PAI Disclosure Compliance"  value="83%"      sub="Art 8 & 9 funds"         color={T.amber}/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Pie chart */}
        <Card>
          <SectionTitle>AUM by SFDR Classification</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={PIE_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: €${value}bn`}>
                {PIE_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={v => `€${v}bn`} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* SFDR v2 reform impact */}
        <Card>
          <SectionTitle>SFDR v2 Reform Impact Preview</SectionTitle>
          <div style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>
            Under the proposed SFDR review, the current Art 6/8/9 structure will be replaced. Key expected changes:
          </div>
          {[
            { label: 'Art 9 → "Sustainable"',        note: 'Requires ≥85% SI + taxonomy alignment' },
            { label: 'Art 8 (strong) → "Sustainable"',note: 'If meets new SI thresholds' },
            { label: 'Art 8 (weak) → "ESG Collection"',note: 'No sustainability claims allowed' },
            { label: 'Art 6 → Excluded from categories', note: 'Standard product, no ESG label' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{r.label}</span>
              <span style={{ fontSize: 12, color: T.textSec, maxWidth: 220, textAlign: 'right' }}>{r.note}</span>
            </div>
          ))}
          <div style={{ marginTop: 12, padding: '8px 12px', background: '#fef3c7', borderRadius: 6, fontSize: 12, color: '#92400e' }}>
            €8.2bn at risk of category downgrade under SFDR v2 proposals.
          </div>
        </Card>
      </div>

      {/* Fund table */}
      <Card>
        <SectionTitle>Fund Portfolio — SFDR Classification & Reclassification Risk</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Fund Name', 'AUM (€bn)', 'Classification', 'Reclass. Risk', 'PAI Consideration', 'SI %'].map(h => (
                <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FUNDS.map((f, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={{ padding: '8px 12px', color: T.text, fontWeight: 500 }}>{f.name}</td>
                <td style={{ padding: '8px 12px', color: T.textSec }}>{f.aum}</td>
                <td style={{ padding: '8px 12px' }}><Badge label={f.cls} color={clsColor(f.cls)} /></td>
                <td style={{ padding: '8px 12px' }}><Badge label={f.reclass} color={reclassColor(f.reclass)} /></td>
                <td style={{ padding: '8px 12px', color: f.pai === 'Y' ? T.green : T.textMut, fontWeight: 600 }}>{f.pai}</td>
                <td style={{ padding: '8px 12px', color: T.text }}>{f.si || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Tab2PAI() {
  const worstIds = [1, 4, 10, 16];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        <KpiCard label="Mandatory PAIs Tracked"      value="18 / 18"  sub="Full mandatory set disclosed" color={T.sage}  />
        <KpiCard label="PAIs Worst-Performing (Red)" value="4"        sub="PAI 1, 4, 10, 16 flagged"    color={T.red}   />
        <KpiCard label="Template Completion Rate"    value="72%"      sub="13 of 18 fully complete"     color={T.amber} />
      </div>

      <Card style={{ marginBottom: 20 }}>
        <SectionTitle>PAI Portfolio vs Benchmark (PAI 1–12)</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={PAI_CHART_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Portfolio" fill={T.navyL}>
              {PAI_CHART_DATA.map((d, i) => {
                const pai = PAI_DATA[i];
                return <Cell key={i} fill={pai.status === 'red' ? T.red : pai.status === 'amber' ? T.amber : T.sage} />;
              })}
            </Bar>
            <Bar dataKey="Benchmark" fill={T.gold} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <SectionTitle>Full PAI Indicator Table — 18 Mandatory Indicators</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['#', 'Category', 'Indicator', 'Portfolio', 'Benchmark', 'Target', 'Unit', 'Status', 'Template'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PAI_DATA.map((p, i) => (
              <tr key={i} style={{
                background: worstIds.includes(p.id) ? '#fff8f8' : i % 2 === 0 ? T.surface : T.surfaceH,
                borderLeft: worstIds.includes(p.id) ? `3px solid ${T.red}` : '3px solid transparent',
              }}>
                <td style={{ padding: '7px 10px', fontWeight: 700, color: T.navy }}>{p.id}</td>
                <td style={{ padding: '7px 10px' }}><Badge label={p.category} color={p.category === 'Climate' ? 'navy' : 'sage'} /></td>
                <td style={{ padding: '7px 10px', color: T.text }}>{p.name}</td>
                <td style={{ padding: '7px 10px', fontWeight: 600, color: p.status === 'red' ? T.red : p.status === 'amber' ? T.amber : T.green }}>{p.portfolio}</td>
                <td style={{ padding: '7px 10px', color: T.textSec }}>{p.benchmark}</td>
                <td style={{ padding: '7px 10px', color: T.sage }}>{p.target}</td>
                <td style={{ padding: '7px 10px', color: T.textMut, fontSize: 11 }}>{p.unit}</td>
                <td style={{ padding: '7px 10px' }}><StatusDot status={p.status} /><span style={{ fontSize: 11, color: T.textSec, textTransform: 'capitalize' }}>{p.status}</span></td>
                <td style={{ padding: '7px 10px' }}><Badge label={p.template} color={p.template === 'Complete' ? 'green' : 'red'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Tab3SustainableInvestment() {
  const qualifying = HOLDINGS.filter(h => h.contrib && h.dnsh && h.governance).length;
  const total = HOLDINGS.length;
  const pct = Math.round((qualifying / total) * 100);

  const cellStyle = (val) => ({
    padding: '7px 12px',
    textAlign: 'center',
    color: val ? T.green : T.red,
    fontWeight: 700,
    fontSize: 13,
  });

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <KpiCard label="Holdings Assessed"          value={`${total}`}   sub="Full portfolio coverage"     color={T.navy}  />
        <KpiCard label="Qualify as SI (Art 2(17))"  value={`${pct}%`}    sub={`${qualifying} of ${total} holdings`} color={T.sage} />
        <KpiCard label="Art 8 SI% Target"           value="40%"          sub="Current: 49% — On track"    color={T.navyL} />
        <KpiCard label="Art 9 SI% Target"           value="85%"          sub="Current: 83.7% — Near miss"  color={T.amber} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card>
          <SectionTitle>Art 2(17) Assessment — 3 Cumulative Conditions</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Holding</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>C1: Contributes</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>C2: DNSH</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>C3: Good Gov.</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>SI Qualifies</th>
              </tr>
            </thead>
            <tbody>
              {HOLDINGS.map((h, i) => {
                const qualifies = h.contrib && h.dnsh && h.governance;
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding: '7px 12px', color: T.text, fontWeight: 500, fontSize: 12 }}>{h.name}</td>
                    <td style={cellStyle(h.contrib)}>{h.contrib ? '✓' : '✗'}</td>
                    <td style={cellStyle(h.dnsh)}>{h.dnsh ? '✓' : '✗'}</td>
                    <td style={cellStyle(h.governance)}>{h.governance ? '✓' : '✗'}</td>
                    <td style={{ padding: '7px 12px', textAlign: 'center' }}>
                      <Badge label={qualifies ? 'SI ✓' : 'Non-SI'} color={qualifies ? 'green' : 'red'} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <SectionTitle>DNSH Automatic Fail Triggers</SectionTitle>
            {[
              { trigger: 'Fossil fuel revenue > 5%',     rule: 'PAI 4 threshold' },
              { trigger: 'UNGC violation on record',      rule: 'PAI 8 absolute' },
              { trigger: 'Biodiversity-sensitive ops',    rule: 'PAI 7 threshold' },
              { trigger: 'Hazardous waste ratio > 5T/€M', rule: 'PAI 14 limit'   },
            ].map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                <span style={{ color: T.text }}>{d.trigger}</span>
                <span style={{ color: T.textMut }}>{d.rule}</span>
              </div>
            ))}
          </Card>

          <Card>
            <SectionTitle>Good Governance Checklist</SectionTitle>
            {[
              { item: 'Tax compliance policy',        pass: true  },
              { item: 'Employee relations framework', pass: true  },
              { item: 'Remuneration disclosure',      pass: true  },
              { item: 'Anti-corruption programme',    pass: true  },
              { item: 'Board independence ≥ 30%',     pass: false },
            ].map((g, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 12, borderBottom: `1px solid ${T.border}` }}>
                <StatusDot status={g.pass ? 'green' : 'red'} />
                <span style={{ color: T.text }}>{g.item}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Tab4DisclosureBuilder() {
  const complete = DISCLOSURE_SECTIONS.filter(s => s.status === 'complete').length;
  const total = DISCLOSURE_SECTIONS.length;
  const pct = Math.round((complete / total) * 100);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <KpiCard label="Sections Complete"    value={`${complete}/${total}`} sub={`${pct}% complete`}              color={T.navy}  />
        <KpiCard label="Auto-Populated"       value="5 sections"             sub="From platform analytics"         color={T.sage}  />
        <KpiCard label="Manual Input Required" value="2 sections"            sub="Policy + benchmark statement"    color={T.amber} />
        <KpiCard label="Template Compliance"  value="ESMA RTS"               sub="Annex II (Art 8) verbatim"       color={T.navyL} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card>
          <SectionTitle>Annex II Disclosure Builder — Article 8 Sample Fund</SectionTitle>
          {/* Progress bar */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: T.textSec }}>
              <span>Completion Progress</span>
              <span style={{ fontWeight: 700, color: T.text }}>{pct}%</span>
            </div>
            <div style={{ height: 10, background: T.surfaceH, borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: T.sage, borderRadius: 5, transition: 'width 0.4s' }} />
            </div>
          </div>
          {DISCLOSURE_SECTIONS.map((s) => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', marginBottom: 8,
              borderRadius: 8, border: `1px solid ${s.status === 'complete' ? '#d1fae5' : '#fee2e2'}`,
              background: s.status === 'complete' ? '#f0fdf4' : '#fff8f8',
            }}>
              <span style={{ fontSize: 18, width: 22, textAlign: 'center' }}>{s.status === 'complete' ? '✅' : '⬜'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Section {s.id}: {s.name}</div>
                <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>
                  {s.autoPop ? '⚡ Auto-populate available from platform data' : '✍ Manual input required'}
                </div>
              </div>
              <Badge label={s.status === 'complete' ? 'Complete' : 'Incomplete'} color={s.status === 'complete' ? 'green' : 'red'} />
            </div>
          ))}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <SectionTitle>ESMA Mandatory Templates</SectionTitle>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 10 }}>
              ESMA Level 2 RTS templates must be used verbatim. No material deviation permitted.
            </div>
            {[
              { doc: 'Annex II', scope: 'Art 8 pre-contractual disclosure', version: 'RTS 2023/2486' },
              { doc: 'Annex III', scope: 'Art 9 pre-contractual disclosure', version: 'RTS 2023/2486' },
              { doc: 'Annex IV', scope: 'Art 8 periodic report ESG annex', version: 'RTS 2023/2486' },
              { doc: 'Annex V', scope: 'Art 9 periodic report ESG annex', version: 'RTS 2023/2486' },
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                <span style={{ fontWeight: 700, color: T.navyL }}>{t.doc}</span>
                <span style={{ color: T.textSec, flex: 1, margin: '0 12px' }}>{t.scope}</span>
                <Badge label={t.version} color="navy" />
              </div>
            ))}
          </Card>

          <Card>
            <SectionTitle>Common Regulator-Identified Errors</SectionTitle>
            {ERRORS.map((e, i) => (
              <div key={i} style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: T.surfaceH, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'center' }}>
                  <Badge label={e.regulator} color="navy" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.red }}>{e.error}</span>
                </div>
                <div style={{ fontSize: 11, color: T.textSec }}>
                  <strong style={{ color: T.sage }}>Fix:</strong> {e.fix}
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Tab5PeriodicReporting() {
  const yoyData = PERIODIC_METRICS.map(m => ({
    metric: m.metric.length > 22 ? m.metric.slice(0, 22) + '…' : m.metric,
    '2023': m.y2023,
    '2024': m.y2024,
  }));

  const severityColor = s => s === 'High' ? 'red' : s === 'Medium' ? 'amber' : 'gray';

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <KpiCard label="Data Auto-Populated"       value="87%"      sub="From platform analytics"      color={T.sage}  />
        <KpiCard label="Reports Generated"         value="12"       sub="Art 8 & 9 funds"              color={T.navy}  />
        <KpiCard label="Investor Recipients"       value="1,240"    sub="EU, UK, non-EU geographies"   color={T.navyL} />
        <KpiCard label="Greenwashing Flags"        value="8"        sub="ESMA 2024 patterns screened"  color={T.amber} />
      </div>

      <Card style={{ marginBottom: 20 }}>
        <SectionTitle>Year-on-Year SFDR Metric Comparison: 2023 vs 2024</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={yoyData} layout="vertical" margin={{ top: 5, right: 30, left: 160, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} />
            <YAxis type="category" dataKey="metric" tick={{ fontSize: 10, fill: T.textSec }} width={155} />
            <Tooltip />
            <Legend />
            <Bar dataKey="2023" fill={T.goldL} />
            <Bar dataKey="2024" fill={T.navyL} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card>
          <SectionTitle>ESMA 2024 Greenwashing Red Flags Screened</SectionTitle>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>
            Based on ESMA 2024 supervisory briefing on SFDR greenwashing patterns.
          </div>
          {GREENWASH_FLAGS.map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ flex: 1, marginRight: 12 }}>
                <div style={{ fontSize: 12, color: T.text }}>{g.pattern}</div>
                <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>{g.funds} fund{g.funds !== 1 ? 's' : ''} exhibit this pattern</div>
              </div>
              <Badge label={g.severity} color={severityColor(g.severity)} />
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle>Periodic Report Sections & Automation Rate</SectionTitle>
          {[
            { sec: 'ESG characteristics attainment', auto: 90 },
            { sec: 'Asset allocation actual vs stated', auto: 95 },
            { sec: 'PAI indicators actual values', auto: 100 },
            { sec: 'Sustainable investment % actual', auto: 88 },
            { sec: 'Engagement activities & outcomes', auto: 45 },
          ].map((s, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                <span style={{ color: T.text }}>{s.sec}</span>
                <span style={{ fontWeight: 700, color: s.auto >= 85 ? T.green : s.auto >= 60 ? T.amber : T.red }}>{s.auto}% auto</span>
              </div>
              <div style={{ height: 7, background: T.surfaceH, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${s.auto}%`, background: s.auto >= 85 ? T.sage : s.auto >= 60 ? T.amber : T.red, borderRadius: 4 }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <SectionTitle>LP Distribution Coverage</SectionTitle>
            {[
              { region: 'European Union',    investors: 784, pct: '63%' },
              { region: 'United Kingdom',    investors: 298, pct: '24%' },
              { region: 'Non-EU / Other',    investors: 158, pct: '13%' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                <span style={{ color: T.text }}>{r.region}</span>
                <span style={{ color: T.textSec }}>{r.investors} investors</span>
                <Badge label={r.pct} color="navy" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Tab6Reform() {
  const impactColor = i => i === 'High' ? 'red' : 'amber';
  const statusColor = s => s === 'Proposed' ? 'navy' : s === 'Under Review' ? 'amber' : 'gray';

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <KpiCard label="Reform Proposals"          value="5 key"    sub="Under SFDR targeted consultation" color={T.navy}  />
        <KpiCard label="AUM at Downgrade Risk"     value="€8.2 bn"  sub="Art 9 → lower category"          color={T.red}   />
        <KpiCard label="Expected L1 Revision"      value="Q2 2025"  sub="Commission draft proposal"        color={T.amber} />
        <KpiCard label="Full Implementation"       value="2027"     sub="Level 2 RTS update 2026"          color={T.navyL} />
      </div>

      <Card style={{ marginBottom: 20 }}>
        <SectionTitle>SFDR v2 Reform Proposals</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['#', 'Reform Area', 'Current Framework', 'Proposed Change', 'Status', 'Impact'].map(h => (
                <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REFORM_PROPOSALS.map((r, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={{ padding: '9px 12px', fontWeight: 700, color: T.navy }}>{r.id}</td>
                <td style={{ padding: '9px 12px', fontWeight: 600, color: T.text }}>{r.title}</td>
                <td style={{ padding: '9px 12px', color: T.textSec, fontSize: 12 }}>{r.current}</td>
                <td style={{ padding: '9px 12px', color: T.navyL, fontSize: 12 }}>{r.proposed}</td>
                <td style={{ padding: '9px 12px' }}><Badge label={r.status} color={statusColor(r.status)} /></td>
                <td style={{ padding: '9px 12px' }}><Badge label={r.impact} color={impactColor(r.impact)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card>
          <SectionTitle>Regulatory Timeline</SectionTitle>
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            <div style={{ position: 'absolute', left: 9, top: 8, bottom: 8, width: 2, background: T.border }} />
            {REFORM_TIMELINE.map((t, i) => {
              const dotColor = t.status === 'done' ? T.sage : t.status === 'current' ? T.gold : T.textMut;
              return (
                <div key={i} style={{ position: 'relative', marginBottom: 20 }}>
                  <div style={{
                    position: 'absolute', left: -20, top: 2, width: 12, height: 12,
                    borderRadius: '50%', background: dotColor, border: `2px solid ${T.surface}`,
                    boxShadow: `0 0 0 2px ${dotColor}`,
                  }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{t.event}</div>
                  <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{t.date}</div>
                  {t.status === 'current' && (
                    <Badge label="Current Stage" color="gold" />
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 16, padding: 14, background: '#fef3c7', borderRadius: 8, border: `1px solid ${T.goldL}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>Key Planning Horizon</div>
            <div style={{ fontSize: 12, color: '#92400e' }}>
              Fund managers should begin re-categorisation modelling now. Level 1 revision expected Q2 2025 — 18-month transition period anticipated.
            </div>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <SectionTitle>AUM Migration Analysis Under SFDR v2</SectionTitle>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={AUM_MIGRATION} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} unit="bn" />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 9, fill: T.textSec }} width={160} />
                <Tooltip formatter={v => `€${v}bn`} />
                <Bar dataKey="aum" name="AUM (€bn)" radius={[0, 4, 4, 0]}>
                  {AUM_MIGRATION.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <SectionTitle>Peer Comparison — SFDR Classification Mix</SectionTitle>
            {[
              { peer: 'AA Impact (This Platform)', art6: '28%', art8: '46%', art9: '20%', highlight: true  },
              { peer: 'Peer Manager A',             art6: '35%', art8: '48%', art9: '17%', highlight: false },
              { peer: 'Peer Manager B',             art6: '22%', art8: '52%', art9: '26%', highlight: false },
              { peer: 'Peer Manager C',             art6: '41%', art8: '44%', art9: '15%', highlight: false },
              { peer: 'Industry Average',           art6: '33%', art8: '47%', art9: '20%', highlight: false },
            ].map((p, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', marginBottom: 6, borderRadius: 6,
                background: p.highlight ? '#eff6ff' : T.surfaceH,
                border: p.highlight ? `1px solid ${T.navyL}` : `1px solid ${T.border}`,
              }}>
                <span style={{ fontSize: 12, fontWeight: p.highlight ? 700 : 500, color: T.text, minWidth: 160 }}>{p.peer}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Badge label={`Art6 ${p.art6}`} color="gray"  />
                  <Badge label={`Art8 ${p.art8}`} color="navy"  />
                  <Badge label={`Art9 ${p.art9}`} color="sage"  />
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────── */
export default function SfdrV2ReportingPage() {
  const [activeTab, setActiveTab] = useState(0);

  const tabContent = [
    <Tab1FundClassification />,
    <Tab2PAI />,
    <Tab3SustainableInvestment />,
    <Tab4DisclosureBuilder />,
    <Tab5PeriodicReporting />,
    <Tab6Reform />,
  ];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.textMut, letterSpacing: 1.5, textTransform: 'uppercase' }}>EP-AH2</span>
              <span style={{ fontSize: 11, color: T.borderL }}>|</span>
              <span style={{ fontSize: 11, color: T.textMut }}>AA Impact Risk Analytics Platform</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, margin: 0, letterSpacing: -0.5 }}>
              SFDR v2 Reporting Engine
            </h1>
            <p style={{ fontSize: 14, color: T.textSec, margin: '6px 0 0 0' }}>
              Full SFDR 2019/2088 compliance suite — Article 6, 8 &amp; 9 classification, 18 PAI indicators, pre-contractual &amp; periodic disclosures, SFDR v2 reform readiness
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', maxWidth: 460 }}>
            {['SFDR 2019/2088', 'Art 6/8/9', '18 PAIs', '€14T AUM', 'v2 Reform 2025'].map(b => (
              <Badge key={b} label={b} color="navy" />
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `2px solid ${T.border}`, paddingBottom: 0 }}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              padding: '9px 18px', border: 'none', cursor: 'pointer', fontFamily: T.font,
              fontSize: 13, fontWeight: activeTab === i ? 700 : 500,
              color: activeTab === i ? T.navy : T.textSec,
              background: activeTab === i ? T.surface : 'transparent',
              borderRadius: '8px 8px 0 0',
              borderBottom: activeTab === i ? `3px solid ${T.gold}` : '3px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div key={activeTab}>
        {tabContent[activeTab]}
      </div>
    </div>
  );
}
