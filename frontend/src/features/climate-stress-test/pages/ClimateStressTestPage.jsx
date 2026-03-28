import React, { useState } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line,
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

// eslint-disable-next-line no-unused-vars
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// NGFS Phase IV Scenario Definitions (real scenario names & parameters)
const SCENARIOS = [
  {
    id: 'nz2050',
    name: 'Net Zero 2050',
    type: 'Orderly',
    typeColor: T.green,
    desc: 'Immediate ambitious climate policies, transition risk high, physical risk limited',
    carbonPrice2030: 130,
    carbonPrice2050: 250,
    gdpImpact2030: -0.8,
    strandedRisk: 'Medium',
    strandedColor: T.amber,
    cet1Impact: -0.6,
  },
  {
    id: 'delayed',
    name: 'Delayed Transition',
    type: 'Disorderly',
    typeColor: T.amber,
    desc: 'Policy delayed to 2030, then very rapid, higher transition shock',
    carbonPrice2030: 0,
    carbonPrice2035: 800,
    gdpImpact2035: -3.2,
    strandedRisk: 'Very High',
    strandedColor: T.red,
    cet1Impact: -2.8,
  },
  {
    id: 'hothouse',
    name: 'Hot House World',
    type: 'No Action',
    typeColor: T.red,
    desc: 'No climate action, rising physical risk damages, catastrophic by 2080',
    carbonPrice2030: 0,
    gdpImpactRange: '-10% to -23%',
    gdpImpactYear: 2050,
    strandedRisk: 'Extreme',
    strandedColor: '#e02020',
    cet1Impact: -4.1,
    physicalDamage: 54,
  },
];

const CET1_TIMELINE = [
  { year: 2024, nz2050: 14.8, delayed: 14.8, hothouse: 14.8 },
  { year: 2025, nz2050: 14.7, delayed: 14.8, hothouse: 14.7 },
  { year: 2026, nz2050: 14.5, delayed: 14.7, hothouse: 14.6 },
  { year: 2027, nz2050: 14.3, delayed: 14.6, hothouse: 14.4 },
  { year: 2028, nz2050: 14.1, delayed: 14.4, hothouse: 14.2 },
  { year: 2029, nz2050: 13.9, delayed: 14.1, hothouse: 13.9 },
  { year: 2030, nz2050: 13.8, delayed: 13.2, hothouse: 13.6 },
  { year: 2031, nz2050: 13.7, delayed: 12.6, hothouse: 13.2 },
  { year: 2032, nz2050: 13.6, delayed: 12.2, hothouse: 12.8 },
  { year: 2033, nz2050: 13.5, delayed: 12.0, hothouse: 12.4 },
  { year: 2034, nz2050: 13.3, delayed: 12.0, hothouse: 11.9 },
  { year: 2035, nz2050: 14.2, delayed: 12.0, hothouse: 11.4 },
];

const PD_MIGRATION = [
  { sector: 'Coal Mining',             pdBase: 2.1, pdStress: 18.4, bps: 776,  dir: 'up' },
  { sector: 'Oil & Gas Upstream',      pdBase: 1.8, pdStress: 9.2,  bps: 740,  dir: 'up' },
  { sector: 'Automotive (ICE)',        pdBase: 1.4, pdStress: 6.8,  bps: 486,  dir: 'up' },
  { sector: 'Steel (blast furnace)',   pdBase: 2.3, pdStress: 8.1,  bps: 378,  dir: 'up' },
  { sector: 'Cement',                  pdBase: 1.9, pdStress: 5.8,  bps: 305,  dir: 'up' },
  { sector: 'Aviation',                pdBase: 1.2, pdStress: 4.1,  bps: 242,  dir: 'up' },
  { sector: 'Commercial RE (EPC D-G)', pdBase: 1.6, pdStress: 4.4,  bps: 180,  dir: 'up' },
  { sector: 'Agriculture (intensive)', pdBase: 1.1, pdStress: 2.8,  bps: 145,  dir: 'up' },
  { sector: 'Manufacturing',           pdBase: 0.8, pdStress: 1.7,  bps: 112,  dir: 'up' },
  { sector: 'Renewable Energy',        pdBase: 1.8, pdStress: 1.2,  bps: -60,  dir: 'down' },
  { sector: 'Energy Efficiency Svcs',  pdBase: 0.9, pdStress: 0.7,  bps: -22,  dir: 'down' },
];

const SECTOR_ALLOC = [
  { sector: 'Residential Mortgages', exposure: 14.2, color: T.sage },
  { sector: 'Commercial RE',         exposure: 7.8,  color: '#8b5cf6' },
  { sector: 'Corporate - Energy',    exposure: 5.4,  color: T.amber },
  { sector: 'Corporate - Transport', exposure: 4.1,  color: '#f59e0b' },
  { sector: 'SME Lending',           exposure: 4.0,  color: T.navy },
  { sector: 'Corporate - Industry',  exposure: 3.6,  color: '#06b6d4' },
  { sector: 'Agriculture',           exposure: 1.8,  color: '#84cc16' },
  { sector: 'Other',                 exposure: 1.1,  color: T.textSec },
];

const WF_DATA = [
  { name: 'Starting CET1', base: 0,    val: 14.8, color: T.sage  },
  { name: 'PD Migration',  base: 13.6, val: 1.2,  color: T.red   },
  { name: 'Collateral',    base: 13.0, val: 0.6,  color: T.red   },
  { name: 'Revenue',       base: 12.6, val: 0.4,  color: T.red   },
  { name: 'RWA Inflation', base: 12.2, val: 0.6,  color: T.red   },
  { name: 'Ending CET1',   base: 0,    val: 12.0, color: T.amber },
];

const REG_FRAMEWORKS = [
  {
    id: 'ecb2022',
    name: 'ECB Climate Risk Stress Test 2022',
    status: 'Complete',
    statusColor: T.green,
    desc: 'First supervisory climate stress test covering ~100 significant institutions across 3 scenarios over 30 years.',
    items: [
      { label: 'Short-term transition risk module',   done: true  },
      { label: 'Long-term climate scenario analysis', done: true  },
      { label: 'Idiosyncratic sensitivity analysis',  done: true  },
      { label: 'FINREP/COREP data submission',        done: true  },
      { label: 'Qualitative questionnaire',           done: true  },
    ],
  },
  {
    id: 'boe_cbes',
    name: 'BoE CBES 2021',
    status: 'Complete',
    statusColor: T.green,
    desc: 'Climate Biennial Exploratory Scenario - assessed systemic climate risk across major UK banks and insurers.',
    items: [
      { label: 'Early action scenario modelling',  done: true  },
      { label: 'Late action scenario modelling',   done: true  },
      { label: 'No action scenario modelling',     done: true  },
      { label: 'Mortgage book physical risk',      done: true  },
      { label: 'Corporate credit transition risk', done: false },
    ],
  },
  {
    id: 'eba2023',
    name: 'EBA Pilot Climate Risk Exercise 2023',
    status: 'In Progress',
    statusColor: T.amber,
    desc: "Pilot exercise to assess EU banks' capacity to conduct climate risk stress testing aligned with EBA roadmap.",
    items: [
      { label: 'Scenario data collection completed',  done: true  },
      { label: 'Transition risk PD uplift modelling', done: true  },
      { label: 'Physical risk property valuation',    done: false },
      { label: 'Supply chain contagion modelling',    done: false },
      { label: 'Results submission to EBA',           done: false },
    ],
  },
  {
    id: 'bcbs',
    name: 'BCBS Principles for Climate Risk',
    status: 'Partial',
    statusColor: T.amber,
    desc: '18 principles for the effective management and supervision of climate-related financial risks (June 2022).',
    items: [
      { label: 'Principles 1-6: Corporate governance',         done: true  },
      { label: 'Principles 7-12: Risk management',             done: true  },
      { label: 'Principles 13-15: Scenario analysis',          done: true  },
      { label: 'Principles 16-18: Supervisory disclosure',     done: false },
    ],
  },
];

const UPCOMING = [
  { deadline: 'Jan 2025', name: 'DORA - Digital Operational Resilience Act',              urgency: 'high'   },
  { deadline: 'Q2 2024',  name: 'ECB Pillar 2 Climate Guidance - supervisory expectations', urgency: 'high'   },
  { deadline: '2026',     name: 'Basel climate disclosure framework',                       urgency: 'medium' },
  { deadline: 'Q4 2024',  name: 'EBA Pillar 3 climate disclosure ITS',                     urgency: 'medium' },
];

const MetricCard = ({ label, value, sub, color }) => (
  <div style={{
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 8, padding: '14px 18px', boxShadow: T.card, minWidth: 0,
  }}>
    <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text, letterSpacing: '-0.02em' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textMut, marginTop: 3 }}>{sub}</div>}
  </div>
);

const SectionHeader = ({ title, sub }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{title}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: T.textSec, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.text }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const ScenarioOverviewTab = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
      {SCENARIOS.map(sc => (
        <div key={sc.id} style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderTop: `3px solid ${sc.typeColor}`, borderRadius: 8,
          padding: 18, boxShadow: T.card,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{sc.name}</div>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
              background: `${sc.typeColor}20`, color: sc.typeColor,
              border: `1px solid ${sc.typeColor}40`, borderRadius: 4, padding: '2px 7px',
            }}>{sc.type}</span>
          </div>
          <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.55, margin: '0 0 14px' }}>{sc.desc}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sc.carbonPrice2030 !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: T.textMut }}>Carbon price 2030</span>
                <span style={{ color: T.text, fontWeight: 600 }}>${sc.carbonPrice2030}/tCO2e</span>
              </div>
            )}
            {sc.carbonPrice2050 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: T.textMut }}>Carbon price 2050</span>
                <span style={{ color: T.text, fontWeight: 600 }}>${sc.carbonPrice2050}/tCO2e</span>
              </div>
            )}
            {sc.carbonPrice2035 !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: T.textMut }}>Carbon price 2035</span>
                <span style={{ color: T.amber, fontWeight: 600 }}>${sc.carbonPrice2035}/tCO2e</span>
              </div>
            )}
            {sc.gdpImpact2030 !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: T.textMut }}>GDP impact 2030</span>
                <span style={{ color: T.amber, fontWeight: 600 }}>{sc.gdpImpact2030}% vs baseline</span>
              </div>
            )}
            {sc.gdpImpact2035 !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: T.textMut }}>GDP impact 2035</span>
                <span style={{ color: T.red, fontWeight: 600 }}>{sc.gdpImpact2035}% vs baseline</span>
              </div>
            )}
            {sc.gdpImpactRange && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: T.textMut }}>GDP impact {sc.gdpImpactYear}</span>
                <span style={{ color: T.red, fontWeight: 600 }}>{sc.gdpImpactRange}</span>
              </div>
            )}
            {sc.physicalDamage && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: T.textMut }}>Physical damage</span>
                <span style={{ color: T.red, fontWeight: 600 }}>${sc.physicalDamage}T cumulative</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: T.textMut }}>Stranded asset risk</span>
              <span style={{ color: sc.strandedColor, fontWeight: 600 }}>{sc.strandedRisk}</span>
            </div>
            <div style={{
              marginTop: 8, background: `${sc.typeColor}15`,
              border: `1px solid ${sc.typeColor}30`, borderRadius: 6,
              padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 11, color: T.textSec, fontWeight: 600 }}>CET1 Impact</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: T.red }}>{sc.cet1Impact}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>

    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, boxShadow: T.card }}>
      <SectionHeader
        title="CET1 Depletion Timeline - NGFS Phase IV Scenarios"
        sub="Projected CET1 ratio 2024-2035 | Regulatory minimum 10.5%"
      />
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={CET1_TIMELINE} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gnz" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={T.green} stopOpacity={0.25} />
              <stop offset="95%" stopColor={T.green} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={T.amber} stopOpacity={0.25} />
              <stop offset="95%" stopColor={T.amber} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="ghh" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={T.red} stopOpacity={0.25} />
              <stop offset="95%" stopColor={T.red} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="year" tick={{ fill: T.textSec, fontSize: 11 }} axisLine={{ stroke: T.border }} />
          <YAxis domain={[10, 16]} tick={{ fill: T.textSec, fontSize: 11 }} axisLine={{ stroke: T.border }} tickFormatter={v => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="nz2050"   name="Net Zero 2050"      stroke={T.green} fill="url(#gnz)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="delayed"  name="Delayed Transition"  stroke={T.amber} fill="url(#gd)"  strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="hothouse" name="Hot House World"     stroke={T.red}   fill="url(#ghh)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 20, marginTop: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { label: 'Net Zero 2050',      color: T.green },
          { label: 'Delayed Transition', color: T.amber },
          { label: 'Hot House World',    color: T.red   },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textSec }}>
            <div style={{ width: 24, height: 2, background: l.color, borderRadius: 1 }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>

    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, boxShadow: T.card }}>
      <SectionHeader title="CET1 Impact by Scenario" sub="Percentage depletion from 14.8% baseline" />
      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          data={SCENARIOS.map(s => ({ name: s.name, impact: Math.abs(s.cet1Impact) }))}
          layout="vertical"
          margin={{ top: 4, right: 40, left: 130, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
          <XAxis type="number" tick={{ fill: T.textSec, fontSize: 11 }} axisLine={{ stroke: T.border }} tickFormatter={v => `${v}%`} />
          <YAxis type="category" dataKey="name" tick={{ fill: T.text, fontSize: 12 }} axisLine={false} tickLine={false} width={125} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="impact" name="CET1 Depletion" radius={[0, 4, 4, 0]}>
            {SCENARIOS.map((s, i) => <Cell key={i} fill={s.typeColor} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const PDMigrationTab = () => {
  const sorted = [...PD_MIGRATION].sort((a, b) => b.bps - a.bps);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, boxShadow: T.card }}>
        <SectionHeader
          title="PD Migration by Sector - Delayed Transition Scenario"
          sub="Probability of Default uplift (bps) vs base | Peak stress window 2030-2035"
        />
        <ResponsiveContainer width="100%" height={390}>
          <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 80, left: 165, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
            <XAxis type="number" tick={{ fill: T.textSec, fontSize: 11 }} axisLine={{ stroke: T.border }} tickFormatter={v => `${v}bps`} />
            <YAxis type="category" dataKey="sector" tick={{ fill: T.text, fontSize: 11 }} axisLine={false} tickLine={false} width={160} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const row = PD_MIGRATION.find(r => r.sector === label);
                return (
                  <div style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, padding: '10px 14px', fontSize: 12 }}>
                    <div style={{ color: T.textSec, marginBottom: 6, fontWeight: 600 }}>{label}</div>
                    <div style={{ color: T.text }}>Base PD: <strong>{row && row.pdBase}%</strong></div>
                    <div style={{ color: T.text }}>Stress PD: <strong>{row && row.pdStress}%</strong></div>
                    <div style={{ color: payload[0].fill, fontWeight: 700, marginTop: 4 }}>
                      {payload[0].value > 0 ? '+' : ''}{payload[0].value} bps
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="bps" name="PD Change (bps)" radius={[0, 4, 4, 0]}>
              {sorted.map((row, i) => <Cell key={i} fill={row.dir === 'up' ? T.red : T.green} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, boxShadow: T.card }}>
        <SectionHeader title="PD Migration Detail" sub="Base vs stress probability of default - Delayed Transition" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['Sector', 'Base PD', 'Stressed PD', 'Change (bps)', 'Multiplier', 'Risk Level'].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '8px 12px', color: T.textSec,
                  fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const mult = (row.pdStress / row.pdBase).toFixed(1);
              const riskLabel = row.bps > 500 ? 'Critical' : row.bps > 200 ? 'High' : row.bps > 0 ? 'Elevated' : 'Reduced';
              const riskColor = row.bps > 500 ? T.red : row.bps > 200 ? T.amber : row.bps > 0 ? T.amber : T.green;
              return (
                <tr key={i}
                  style={{ borderBottom: `1px solid ${T.borderL}` }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceH}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '9px 12px', color: T.text, fontWeight: 500 }}>{row.sector}</td>
                  <td style={{ padding: '9px 12px', color: T.textSec }}>{row.pdBase}%</td>
                  <td style={{ padding: '9px 12px', color: row.dir === 'up' ? T.red : T.green, fontWeight: 600 }}>{row.pdStress}%</td>
                  <td style={{ padding: '9px 12px', color: row.bps > 0 ? T.red : T.green, fontWeight: 700 }}>
                    {row.bps > 0 ? '+' : ''}{row.bps}bps
                  </td>
                  <td style={{ padding: '9px 12px', color: T.textSec }}>{mult}x</td>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: riskColor,
                      background: `${riskColor}18`, border: `1px solid ${riskColor}30`,
                      borderRadius: 4, padding: '2px 7px',
                    }}>{riskLabel}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PortfolioImpactTab = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
      <MetricCard label="Climate VaR (CVaR)"   value="-£1.8bn"  sub="Delayed scenario, 10yr horizon"  color={T.red}   />
      <MetricCard label="NII at Risk"           value="-£340M/yr" sub="Net Interest Income impact"     color={T.red}   />
      <MetricCard label="Expected Loss Uplift"  value="+£890M"   sub="Incremental EL under stress"     color={T.amber} />
      <MetricCard label="RWA Increase"          value="+£4.2bn"  sub="Risk-weighted asset inflation"   color={T.amber} />
      <MetricCard label="LCR Impact"            value="-8.2pp"     sub="Liquidity coverage ratio"        color={T.amber} />
      <MetricCard label="Stranded Collateral"   value="£2.1bn"   sub="EPC D-G mortgages at risk"       color={T.red}   />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16 }}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, boxShadow: T.card }}>
        <SectionHeader title="Banking Book Allocation" sub="£42bn total loan portfolio" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          {SECTOR_ALLOC.map((s, i) => {
            const pct = ((s.exposure / 42) * 100).toFixed(1);
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                  <span style={{ color: T.text }}>{s.sector}</span>
                  <span style={{ color: T.textSec }}>£{s.exposure}bn <span style={{ color: T.textMut }}>({pct}%)</span></span>
                </div>
                <div style={{ height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, boxShadow: T.card }}>
        <SectionHeader
          title="CET1 Waterfall - Delayed Transition Scenario"
          sub="Starting 14.8% to Ending 12.0% | Buffer above 10.5% minimum: 1.5pp"
        />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={WF_DATA} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 10 }} axisLine={{ stroke: T.border }} />
            <YAxis domain={[10, 16]} tick={{ fill: T.textSec, fontSize: 11 }} axisLine={{ stroke: T.border }} tickFormatter={v => `${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="base" stackId="a" fill="transparent" />
            <Bar dataKey="val"  stackId="a" name="CET1" radius={[4, 4, 0, 0]}>
              {WF_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Starting CET1',   color: T.sage  },
            { label: 'Negative driver', color: T.red   },
            { label: 'Ending 12.0%',    color: T.amber },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: T.textSec }}>
              <div style={{ width: 10, height: 10, background: l.color, borderRadius: 2 }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>
    </div>

    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, boxShadow: T.card }}>
      <SectionHeader title="Climate Risk Heat Map - Banking Book" sub="Sector vulnerability under Delayed Transition scenario" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { sector: 'Residential Mortgages', transition: 'Low',       physical: 'Medium', overall: 'Medium', c: T.amber },
          { sector: 'Commercial RE',          transition: 'High',      physical: 'High',   overall: 'High',   c: T.red   },
          { sector: 'Corporate - Energy',     transition: 'Very High', physical: 'Low',    overall: 'High',   c: T.red   },
          { sector: 'Corporate - Transport',  transition: 'High',      physical: 'Low',    overall: 'High',   c: T.red   },
          { sector: 'SME Lending',            transition: 'Medium',    physical: 'Low',    overall: 'Medium', c: T.amber },
          { sector: 'Corporate - Industry',   transition: 'Medium',    physical: 'Low',    overall: 'Medium', c: T.amber },
          { sector: 'Agriculture',            transition: 'Low',       physical: 'High',   overall: 'Medium', c: T.amber },
          { sector: 'Other',                  transition: 'Low',       physical: 'Low',    overall: 'Low',    c: T.green },
        ].map((row, i) => (
          <div key={i} style={{ background: `${row.c}12`, border: `1px solid ${row.c}30`, borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 6 }}>{row.sector}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                <span style={{ color: T.textMut }}>Transition</span>
                <span style={{ color: T.textSec }}>{row.transition}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                <span style={{ color: T.textMut }}>Physical</span>
                <span style={{ color: T.textSec }}>{row.physical}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 4, borderTop: `1px solid ${T.borderL}`, paddingTop: 4 }}>
                <span style={{ color: T.textSec, fontWeight: 600 }}>Overall</span>
                <span style={{ color: row.c, fontWeight: 700 }}>{row.overall}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const RegulatoryTab = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
      {REG_FRAMEWORKS.map(fw => (
        <div key={fw.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, boxShadow: T.card }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, flex: 1, marginRight: 10 }}>{fw.name}</div>
            <span style={{
              fontSize: 10, fontWeight: 600, color: fw.statusColor,
              background: `${fw.statusColor}18`, border: `1px solid ${fw.statusColor}30`,
              borderRadius: 4, padding: '2px 8px', whiteSpace: 'nowrap',
            }}>{fw.status}</span>
          </div>
          <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.55, margin: '0 0 14px' }}>{fw.desc}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {fw.items.map((item, j) => (
              <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                  background: item.done ? `${T.green}20` : `${T.textMut}20`,
                  border: `1px solid ${item.done ? T.green : T.textMut}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: item.done ? T.green : T.textMut,
                }}>
                  {item.done ? '✓' : '○'}
                </div>
                <span style={{ color: item.done ? T.text : T.textSec }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>

    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, boxShadow: T.card }}>
      <SectionHeader
        title="BCBS 18 Principles - Compliance Progress"
        sub="Basel Committee on Banking Supervision | Climate Risk Management and Supervision (June 2022)"
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { group: 'Principles 1-6: Corporate Governance',                   done: 6, total: 6 },
          { group: 'Principles 7-9: Internal Controls and Capital',          done: 3, total: 3 },
          { group: 'Principles 10-12: Liquidity Risk and Data',              done: 3, total: 3 },
          { group: 'Principles 13-15: Scenario Analysis',                    done: 3, total: 3 },
          { group: 'Principles 16-18: Prudential Supervision and Disclosure', done: 1, total: 3 },
        ].map((g, i) => {
          const pct = Math.round((g.done / g.total) * 100);
          const color = pct === 100 ? T.green : pct >= 50 ? T.amber : T.red;
          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: T.text }}>{g.group}</span>
                <span style={{ color }}>
                  {g.done}/{g.total} <span style={{ color: T.textMut }}>({pct}%)</span>
                </span>
              </div>
              <div style={{ height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, boxShadow: T.card }}>
      <SectionHeader title="Upcoming Regulatory Deadlines" sub="Climate risk and related requirements - action required" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {UPCOMING.map((u, i) => {
          const color = u.urgency === 'high' ? T.red : T.amber;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: `${color}08`, border: `1px solid ${color}25`,
              borderRadius: 6, padding: '10px 14px',
            }}>
              <div style={{
                minWidth: 64, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 5,
                fontSize: 11, fontWeight: 700, color,
              }}>{u.deadline}</div>
              <div style={{ flex: 1, fontSize: 12, color: T.text }}>{u.name}</div>
              <span style={{
                fontSize: 10, fontWeight: 600, color,
                background: `${color}15`, border: `1px solid ${color}25`,
                borderRadius: 4, padding: '2px 8px', textTransform: 'capitalize',
              }}>{u.urgency}</span>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

const TABS = ['Scenarios', 'PD Migration', 'Portfolio Impact', 'Regulatory'];

export default function ClimateStressTestPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: T.font, padding: '24px 28px' }}>
      <div style={{
        background: '#f0a82815', border: `1px solid ${T.amber}40`, borderRadius: 8,
        padding: '10px 16px', marginBottom: 24,
        display: 'flex', alignItems: 'flex-start', gap: 10,
        fontSize: 12, color: T.amber, lineHeight: 1.55,
      }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
        <span>
          <strong>Illustrative stress test</strong> — ECB/NGFS scenario parameters are real (NGFS Phase IV, 2023).
          Portfolio composition and PD outcomes are illustrative.
        </span>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: T.sage, background: `${T.sage}15`, border: `1px solid ${T.sage}30`,
            borderRadius: 4, padding: '2px 8px',
          }}>EP-AJ2</div>
          <div style={{ fontSize: 10, color: T.textMut, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Sprint AJ — Financed Emissions & Climate Banking Analytics
          </div>
        </div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>
          Climate Stress Test — Banking Book
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: T.textSec }}>
          ECB/BoE/NGFS climate stress testing for bank loan portfolios | NGFS Phase IV scenarios | £42bn banking book
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <MetricCard label="Portfolio Size"          value="£42bn"   sub="Banking book gross exposure"     color={T.sage}  />
        <MetricCard label="Worst-Case CET1 Hit"     value="-4.1%"    sub="Hot House World scenario"        color={T.red}   />
        <MetricCard label="Delayed Transition CVaR" value="-£1.8bn" sub="10-year climate VaR"            color={T.amber} />
        <MetricCard label="CET1 Buffer (Delayed)"   value="1.5pp"    sub="Above 10.5% regulatory minimum" color={T.amber} />
      </div>

      <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: `1px solid ${T.border}` }}>
        {TABS.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            style={{
              background: 'none', border: 'none',
              borderBottom: activeTab === i ? `2px solid ${T.sage}` : '2px solid transparent',
              color: activeTab === i ? T.sage : T.textSec,
              fontFamily: T.font, fontSize: 13,
              fontWeight: activeTab === i ? 600 : 400,
              padding: '10px 18px', cursor: 'pointer', marginBottom: -1,
              transition: 'color 0.15s', letterSpacing: '0.01em',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && <ScenarioOverviewTab />}
      {activeTab === 1 && <PDMigrationTab />}
      {activeTab === 2 && <PortfolioImpactTab />}
      {activeTab === 3 && <RegulatoryTab />}
    </div>
  );
}
