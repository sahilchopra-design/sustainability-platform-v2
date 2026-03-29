import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
  LineChart, Line, ReferenceLine, ScatterChart, Scatter, ZAxis,
  ResponsiveContainer,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const TABS = [
  'Portfolio Temperature',
  'SBTi Alignment',
  'NZBA & PAII',
  'Decarbonisation Pathway',
  'Engagement Matrix',
  'PAII Reporting',
];

const BADGES = ['SBTi', 'PAII', 'NZBA', '1.8°C Rating', 'Paris-Aligned'];

// ── Tab 1 data ──────────────────────────────────────────────────────────────
const holdingsTempData = [
  { name: 'Vestas',       temp: 1.3 },
  { name: 'Apple',        temp: 1.5 },
  { name: 'Microsoft',    temp: 1.5 },
  { name: 'Alphabet',     temp: 1.5 },
  { name: 'Unilever',     temp: 1.6 },
  { name: 'Toyota',       temp: 1.7 },
  { name: 'Volkswagen',   temp: 1.8 },
  { name: 'Shell',        temp: 2.4 },
  { name: 'BP',           temp: 2.6 },
  { name: 'Tata Steel',   temp: 3.1 },
];

// ── Tab 2 data ──────────────────────────────────────────────────────────────
const sbtiHoldings = [
  { company:'Apple',          status:'1.5°C Aligned', targetYear:2030, coverage:'S1+2+3', validated:'2021-03', weight:4.8 },
  { company:'Microsoft',      status:'1.5°C Aligned', targetYear:2030, coverage:'S1+2+3', validated:'2020-07', weight:4.5 },
  { company:'Amazon',         status:'Committed',     targetYear:2040, coverage:'S1+2',   validated:'—',       weight:3.9 },
  { company:'Alphabet',       status:'1.5°C Aligned', targetYear:2030, coverage:'S1+2+3', validated:'2021-09', weight:3.7 },
  { company:'Meta',           status:'Committed',     targetYear:2030, coverage:'S1+2',   validated:'—',       weight:3.2 },
  { company:'Tesla',          status:'No Target',     targetYear:'—',  coverage:'—',      validated:'—',       weight:2.8 },
  { company:'BHP',            status:'1.5°C Near-term',targetYear:2030,coverage:'S1+2',   validated:'2022-05', weight:2.5 },
  { company:'Shell',          status:'2°C Aligned',   targetYear:2050, coverage:'S1+2',   validated:'2021-02', weight:3.8 },
  { company:'BP',             status:'2°C Aligned',   targetYear:2050, coverage:'S1+2',   validated:'2021-06', weight:2.9 },
  { company:'HSBC',           status:'Committed',     targetYear:2030, coverage:'S1+2',   validated:'—',       weight:2.4 },
  { company:'Barclays',       status:'Committed',     targetYear:2030, coverage:'S1+2',   validated:'—',       weight:2.1 },
  { company:'JP Morgan',      status:'No Target',     targetYear:'—',  coverage:'—',      validated:'—',       weight:2.3 },
  { company:'Toyota',         status:'1.5°C Aligned', targetYear:2030, coverage:'S1+2+3', validated:'2023-01', weight:2.0 },
  { company:'Volkswagen',     status:'1.5°C Aligned', targetYear:2030, coverage:'S1+2+3', validated:'2022-11', weight:1.9 },
  { company:'Unilever',       status:'1.5°C Aligned', targetYear:2030, coverage:'S1+2+3', validated:'2021-04', weight:1.8 },
  { company:'Nestle',         status:'1.5°C Aligned', targetYear:2030, coverage:'S1+2+3', validated:'2022-08', weight:1.7 },
  { company:'Walmart',        status:'Committed',     targetYear:2040, coverage:'S1+2',   validated:'—',       weight:1.6 },
  { company:'Tata Steel',     status:'No Target',     targetYear:'—',  coverage:'—',      validated:'—',       weight:1.4 },
  { company:'ArcelorMittal',  status:'2°C Aligned',   targetYear:2050, coverage:'S1+2',   validated:'2022-03', weight:1.2 },
  { company:'Vestas',         status:'1.5°C Aligned', targetYear:2025, coverage:'S1+2+3', validated:'2020-12', weight:1.0 },
];

const sbtiStatusBreakdown = [
  { status:'1.5°C Aligned',   pct:38 },
  { status:'1.5°C Near-term', pct:5  },
  { status:'2°C Aligned',     pct:13 },
  { status:'Committed',       pct:24 },
  { status:'No Target',       pct:20 },
];

// ── Tab 3 data ──────────────────────────────────────────────────────────────
const paiiCriteria = [
  { id:1, label:'Immediate decarbonisation action',   status:'met',     note:'Portfolio WACI down 31% since 2019' },
  { id:2, label:'Promoting wider market transformation', status:'met',  note:'Engaged 14 standard-setting bodies' },
  { id:3, label:'Working with policymakers',          status:'met',     note:'CDP A-list signatory; TCFD supporter' },
  { id:4, label:'Decarbonising investments',          status:'partial', note:'8/12 priority sectors addressed' },
  { id:5, label:'Reporting annually',                 status:'met',     note:'2024 PAII report published Feb 2025' },
];

const nzbaSectors = [
  { sector:'Power',    exposure:480, aligned:4, total:5,  pathway:'65% RE by 2030' },
  { sector:'Oil & Gas',exposure:720, aligned:2, total:4,  pathway:'25% prod. cut by 2030' },
  { sector:'Cement',  exposure:210, aligned:3, total:4,  pathway:'GCCA roadmap' },
  { sector:'Steel',   exposure:310, aligned:2, total:5,  pathway:'25% DRI-EAF by 2030' },
  { sector:'Aluminium',exposure:95, aligned:3, total:3,  pathway:'100% recycled content' },
  { sector:'Trucking',exposure:145, aligned:2, total:3,  pathway:'30% ZEV fleet by 2030' },
  { sector:'Aviation',exposure:220, aligned:1, total:3,  pathway:'10% SAF blend by 2030' },
  { sector:'Shipping',exposure:180, aligned:1, total:2,  pathway:'IMO GHG Strategy' },
];

const nzbaTimeline = [
  { year:'2025', event:'Near-term sector targets published',  done:true  },
  { year:'2027', event:'Mid-point review & target refresh',   done:false },
  { year:'2030', event:'50% absolute emissions reduction',    done:false },
  { year:'2035', event:'Portfolio net zero coverage > 80%',   done:false },
  { year:'2040', event:'90% absolute emissions reduction',    done:false },
  { year:'2050', event:'Net Zero — residual offset only',     done:false },
];

// ── Tab 4 data ──────────────────────────────────────────────────────────────
const pathwayData = [
  { year:2020, actual:4.1,  onTrack:4.1,  delayed:4.1,  accel:4.1  },
  { year:2021, actual:3.9,  onTrack:3.85, delayed:3.95, accel:3.75 },
  { year:2022, actual:3.6,  onTrack:3.55, delayed:3.7,  accel:3.4  },
  { year:2023, actual:3.3,  onTrack:3.2,  delayed:3.4,  accel:3.0  },
  { year:2024, actual:2.8,  onTrack:2.8,  delayed:3.0,  accel:2.5  },
  { year:2025, actual:null, onTrack:2.45, delayed:2.8,  accel:2.1  },
  { year:2026, actual:null, onTrack:2.15, delayed:2.6,  accel:1.8  },
  { year:2027, actual:null, onTrack:1.9,  delayed:2.4,  accel:1.5  },
  { year:2028, actual:null, onTrack:1.65, delayed:2.2,  accel:1.2  },
  { year:2029, actual:null, onTrack:1.5,  delayed:2.0,  accel:1.0  },
  { year:2030, actual:null, onTrack:1.4,  delayed:1.9,  accel:0.85 },
  { year:2035, actual:null, onTrack:0.9,  delayed:1.4,  accel:0.45 },
  { year:2040, actual:null, onTrack:0.41, delayed:0.9,  accel:0.2  },
  { year:2045, actual:null, onTrack:0.15, delayed:0.4,  accel:0.05 },
  { year:2050, actual:null, onTrack:0.0,  delayed:0.1,  accel:0.0  },
];

const sectorEmissions = [
  { sector:'Energy',      pct:38 },
  { sector:'Industrials', pct:24 },
  { sector:'Materials',   pct:18 },
  { sector:'Utilities',   pct:12 },
  { sector:'Other',       pct:8  },
];

// ── Tab 5 data ──────────────────────────────────────────────────────────────
const engagementBubbles = [
  { name:'Shell',         weight:3.8, gap:2.4, difficulty:85, quadrant:'P1' },
  { name:'BP',            weight:2.9, gap:2.1, difficulty:80, quadrant:'P1' },
  { name:'Tata Steel',    weight:1.4, gap:3.1, difficulty:90, quadrant:'P2' },
  { name:'JP Morgan',     weight:2.3, gap:1.8, difficulty:70, quadrant:'P1' },
  { name:'Tesla',         weight:2.8, gap:0.9, difficulty:40, quadrant:'P3' },
  { name:'Amazon',        weight:3.9, gap:0.6, difficulty:35, quadrant:'P3' },
  { name:'ArcelorMittal', weight:1.2, gap:1.6, difficulty:75, quadrant:'P2' },
  { name:'HSBC',          weight:2.4, gap:0.8, difficulty:50, quadrant:'P3' },
  { name:'Walmart',       weight:1.6, gap:0.7, difficulty:45, quadrant:'P4' },
  { name:'BHP',           weight:2.5, gap:0.5, difficulty:55, quadrant:'P4' },
];

const engagementList = [
  { company:'Shell',      temp:3.9, gap:2.4, theme:'Capex reallocation to renewables',    timeline:'2025–2027', impact:'-0.12°C' },
  { company:'BP',         temp:3.6, gap:2.1, theme:'Scope 3 disclosure & target setting', timeline:'2025–2026', impact:'-0.09°C' },
  { company:'JP Morgan',  temp:3.3, gap:1.8, theme:'Science-based target adoption',       timeline:'2025',      impact:'-0.07°C' },
  { company:'ArcelorMittal',temp:3.1,gap:1.6, theme:'Green steel transition roadmap',     timeline:'2026–2028', impact:'-0.05°C' },
];

// ── Tab 6 data ──────────────────────────────────────────────────────────────
const paiiKpis = [
  { metric:'WACI',                          value:'175 t/$M',  benchmark:'<200 t/$M', status:'on-track' },
  { metric:'Absolute Financed Emissions',   value:'2.8 Mt CO₂e', benchmark:'↓ from 4.1 Mt', status:'on-track' },
  { metric:'% Holdings with Net Zero Target',value:'62%',      benchmark:'>50%',      status:'on-track' },
  { metric:'Green/Sustainable Investment',  value:'28%',       benchmark:'>25%',      status:'on-track' },
  { metric:'Fossil Fuel Exposure',          value:'4.2%',      benchmark:'<5%',       status:'on-track' },
  { metric:'Financing of Climate Solutions',value:'$1.8bn',    benchmark:'↑ YoY',     status:'on-track' },
];

const tcfdPillars = [
  { pillar:'Governance',       items:['Board climate oversight','Climate risk committee','Executive remuneration link'], quality:92 },
  { pillar:'Strategy',         items:['1.5°C & 2°C scenario analysis','Business model resilience','PAII 5 criteria'], quality:88 },
  { pillar:'Risk Management',  items:['Physical risk screening','Transition risk integration','Engagement policy'], quality:85 },
  { pillar:'Metrics & Targets',items:['WACI & absolute emissions','Portfolio temperature','SBTi coverage %'], quality:90 },
];

const reportingMilestones = [
  { date:'Jan 2026', task:'Financed emissions data collection',  done:false },
  { date:'Feb 2026', task:'Scope 3 holdings data validation',    done:false },
  { date:'Mar 2026', task:'Portfolio temperature re-rating',     done:false },
  { date:'Apr 2026', task:'PAII KPI calculation & sign-off',     done:false },
  { date:'May 2026', task:'Annual PAII report published',        done:false },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function tempColor(t) {
  if (t <= 1.5) return T.green;
  if (t <= 2.0) return T.amber;
  return T.red;
}

function sbtiColor(s) {
  if (s.includes('1.5°C')) return T.green;
  if (s.includes('2°C'))   return T.amber;
  if (s === 'Committed')   return T.navyL;
  return T.textMut;
}

function Card({ children, style }) {
  return (
    <div style={{
      background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`,
      boxShadow: T.card, padding: '20px 24px', ...style,
    }}>
      {children}
    </div>
  );
}

function KpiCard({ label, value, sub, color }) {
  return (
    <Card style={{ flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 12, color: T.textMut, marginBottom: 6, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 14, borderLeft: `3px solid ${T.gold}`, paddingLeft: 10 }}>
      {children}
    </div>
  );
}

// ── Tab Components ────────────────────────────────────────────────────────────
function Tab1() {
  const gaugeMin = 1.5, gaugeMax = 4.0, portfolioTemp = 1.8;
  const pct = ((portfolioTemp - gaugeMin) / (gaugeMax - gaugeMin)) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI Row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Portfolio Temperature" value="1.8°C" sub="Implied warming above pre-industrial" color={T.amber} />
        <KpiCard label="Holdings with SBTi Targets" value="62%" sub="% of AUM with validated target" color={T.green} />
        <KpiCard label="WACI Reduction Since 2019" value="-31%" sub="Weighted Average Carbon Intensity" color={T.navyL} />
        <KpiCard label="PAII Status" value="Committed" sub="Paris Aligned Investment Initiative" color={T.sage} />
      </div>

      {/* Gauge */}
      <Card>
        <SectionTitle>Portfolio Temperature Gauge — 1.5°C → 4°C Spectrum</SectionTitle>
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 56, fontWeight: 800, color: T.amber, lineHeight: 1 }}>1.8°C</span>
          <div style={{ fontSize: 14, color: T.textSec, marginTop: 4 }}>Implied Portfolio Temperature Rating</div>
        </div>
        <div style={{ position: 'relative', height: 28, borderRadius: 14, overflow: 'hidden',
          background: `linear-gradient(to right, ${T.green}, ${T.amber}, ${T.red})`,
          border: `1px solid ${T.border}`, margin: '16px 0 8px' }}>
          <div style={{
            position: 'absolute', top: 0, left: `${pct}%`, transform: 'translateX(-50%)',
            width: 4, height: '100%', background: T.navy, borderRadius: 2,
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.textSec }}>
          <span style={{ color: T.green, fontWeight: 600 }}>1.5°C (Paris Goal)</span>
          <span style={{ color: T.amber, fontWeight: 600 }}>2°C Threshold</span>
          <span style={{ color: T.red, fontWeight: 600 }}>4°C (BAU)</span>
        </div>
      </Card>

      {/* Holdings Bar Chart */}
      <Card>
        <SectionTitle>Top 10 Holdings — Implied Temperature Rating</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={holdingsTempData} margin={{ top: 8, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
            <YAxis domain={[1.0, 3.5]} tickFormatter={v => `${v}°C`} tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip formatter={v => [`${v}°C`, 'Temperature']} />
            <ReferenceLine y={1.5} stroke={T.green} strokeDasharray="4 4" label={{ value:'1.5°C', fill:T.green, fontSize:11 }} />
            <ReferenceLine y={2.0} stroke={T.red} strokeDasharray="4 4" label={{ value:'2°C', fill:T.red, fontSize:11 }} />
            <Bar dataKey="temp" radius={[4,4,0,0]}>
              {holdingsTempData.map((d, i) => <Cell key={i} fill={tempColor(d.temp)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function Tab2() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Aggregate */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="AUM with Validated SBTi" value="62%" sub="By portfolio weight" color={T.green} />
        <KpiCard label="1.5°C Aligned Holdings" value="10" sub="Out of 20 tracked companies" color={T.green} />
        <KpiCard label="No Target Holdings" value="3" sub="Tesla, JP Morgan, Tata Steel" color={T.red} />
        <KpiCard label="Committed (in progress)" value="5" sub="Targets expected 2025–2026" color={T.amber} />
      </div>

      {/* Status Breakdown Chart */}
      <Card>
        <SectionTitle>Portfolio Breakdown by SBTi Status (% AUM)</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={sbtiStatusBreakdown} layout="vertical" margin={{ top: 4, right: 40, left: 20, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
            <XAxis type="number" domain={[0, 45]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis type="category" dataKey="status" tick={{ fontSize: 11, fill: T.textSec }} width={120} />
            <Tooltip formatter={v => [`${v}%`, '% of AUM']} />
            <Bar dataKey="pct" radius={[0,4,4,0]}>
              {sbtiStatusBreakdown.map((d, i) => {
                const c = d.status.includes('1.5°C') ? T.green : d.status.includes('2°C') ? T.amber : d.status === 'Committed' ? T.navyL : T.textMut;
                return <Cell key={i} fill={c} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Holdings Table */}
      <Card style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${T.border}` }}>
          <SectionTitle>SBTi Status — All 20 Portfolio Holdings</SectionTitle>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                {['Company','SBTi Status','Target Year','Scope Coverage','Validated','Weight %'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sbtiHoldings.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.bg }}>
                  <td style={{ padding: '9px 14px', fontWeight: 600, color: T.navy }}>{r.company}</td>
                  <td style={{ padding: '9px 14px' }}>
                    <span style={{ background: sbtiColor(r.status) + '20', color: sbtiColor(r.status), borderRadius: 12, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: '9px 14px', color: T.textSec }}>{r.targetYear}</td>
                  <td style={{ padding: '9px 14px', color: T.textSec }}>{r.coverage}</td>
                  <td style={{ padding: '9px 14px', color: T.textSec }}>{r.validated}</td>
                  <td style={{ padding: '9px 14px', fontWeight: 600, color: T.navyL }}>{r.weight}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Tab3() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* PAII Criteria */}
      <Card>
        <SectionTitle>PAII — 5 Criteria Implementation Status</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {paiiCriteria.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 14px',
              background: c.status === 'met' ? '#f0fdf4' : '#fefce8', borderRadius: 8,
              border: `1px solid ${c.status === 'met' ? '#bbf7d0' : '#fde68a'}` }}>
              <span style={{ fontSize: 20, marginTop: 1 }}>{c.status === 'met' ? '✓' : '◑'}</span>
              <div>
                <div style={{ fontWeight: 600, color: T.navy, fontSize: 14 }}>{c.id}. {c.label}</div>
                <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{c.note}</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600,
                color: c.status === 'met' ? T.green : T.amber,
                background: c.status === 'met' ? '#dcfce7' : '#fef9c3',
                borderRadius: 10, padding: '2px 10px', whiteSpace: 'nowrap' }}>
                {c.status === 'met' ? 'Met' : 'Partial'}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* NZBA Sectors */}
      <Card>
        <SectionTitle>NZBA Priority Sectors — Exposure & Alignment</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                {['Sector','Exposure ($M)','Companies Aligned','Decarbonisation Pathway','Alignment %'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nzbaSectors.map((s, i) => {
                const alignPct = Math.round((s.aligned / s.total) * 100);
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.bg }}>
                    <td style={{ padding: '9px 14px', fontWeight: 600, color: T.navy }}>{s.sector}</td>
                    <td style={{ padding: '9px 14px', color: T.textSec }}>${s.exposure}M</td>
                    <td style={{ padding: '9px 14px', color: T.textSec }}>{s.aligned}/{s.total}</td>
                    <td style={{ padding: '9px 14px', color: T.textSec, fontSize: 12 }}>{s.pathway}</td>
                    <td style={{ padding: '9px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 8, background: T.border, borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${alignPct}%`, height: '100%', background: alignPct >= 75 ? T.green : alignPct >= 50 ? T.amber : T.red, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: alignPct >= 75 ? T.green : alignPct >= 50 ? T.amber : T.red, minWidth: 32 }}>{alignPct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* NZBA Timeline */}
      <Card>
        <SectionTitle>NZBA Implementation Timeline</SectionTitle>
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', paddingBottom: 8 }}>
          {nzbaTimeline.map((m, i) => (
            <div key={i} style={{ flex: 1, minWidth: 130, textAlign: 'center', position: 'relative' }}>
              {i < nzbaTimeline.length - 1 && (
                <div style={{ position: 'absolute', top: 14, left: '50%', width: '100%', height: 2,
                  background: m.done ? T.green : T.border, zIndex: 0 }} />
              )}
              <div style={{ width: 28, height: 28, borderRadius: '50%', margin: '0 auto 10px',
                background: m.done ? T.green : T.border, display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', zIndex: 1, border: `2px solid ${m.done ? T.green : T.borderL}` }}>
                <span style={{ fontSize: 12, color: m.done ? '#fff' : T.textMut, fontWeight: 700 }}>{m.done ? '✓' : '○'}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{m.year}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 4, lineHeight: 1.4 }}>{m.event}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Tab4() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPIs */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Financed Emissions 2024" value="2.8 Mt CO₂e" sub="Scope 1+2 combined" color={T.amber} />
        <KpiCard label="2030 Target (SBTi -50%)" value="1.4 Mt CO₂e" sub="Required by SBTi pathway" color={T.navyL} />
        <KpiCard label="Required Annual Reduction" value="-9.3%" sub="Compound rate to 2030" color={T.green} />
        <KpiCard label="Net Zero Target Year" value="2050" sub="Residual offsets only after 2045" color={T.navy} />
      </div>

      {/* Pathway Chart */}
      <Card>
        <SectionTitle>Financed Emissions Trajectory 2020–2050 (Mt CO₂e)</SectionTitle>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={pathwayData} margin={{ top: 8, right: 30, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis tickFormatter={v => `${v}`} tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Mt CO₂e', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
            <Tooltip formatter={(v, n) => [v ? `${v} Mt CO₂e` : '—', n]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine x={2030} stroke={T.amber} strokeDasharray="4 4" label={{ value:'-50% Milestone', fill:T.amber, fontSize:10 }} />
            <ReferenceLine x={2050} stroke={T.green} strokeDasharray="4 4" label={{ value:'Net Zero', fill:T.green, fontSize:10 }} />
            <Line type="monotone" dataKey="actual"   stroke={T.navy}  strokeWidth={3} dot={{ r:4 }} name="Actual" connectNulls={false} />
            <Line type="monotone" dataKey="onTrack"  stroke={T.green} strokeWidth={2} strokeDasharray="6 3" dot={false} name="On-Track Pathway" />
            <Line type="monotone" dataKey="delayed"  stroke={T.red}   strokeWidth={2} strokeDasharray="6 3" dot={false} name="Delayed Scenario" />
            <Line type="monotone" dataKey="accel"    stroke={T.sage}  strokeWidth={2} strokeDasharray="6 3" dot={false} name="Accelerated Scenario" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Sector Emissions */}
      <Card>
        <SectionTitle>2024 Financed Emissions by Sector (% of 2.8 Mt CO₂e)</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={sectorEmissions} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="sector" tick={{ fontSize: 12, fill: T.textSec }} />
            <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip formatter={v => [`${v}%`, '% of Financed Emissions']} />
            <Bar dataKey="pct" radius={[4,4,0,0]}>
              {sectorEmissions.map((_, i) => (
                <Cell key={i} fill={[T.red, T.amber, T.gold, T.navyL, T.textMut][i % 5]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function Tab5() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPIs */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Priority 1 Engagements" value="3" sub="High weight + high temp gap" color={T.red} />
        <KpiCard label="P1 Engagement Impact" value="-0.3°C" sub="If all P1 engagements succeed" color={T.green} />
        <KpiCard label="Projected Portfolio Temp (post-P1)" value="1.5°C" sub="Target year: 2027" color={T.green} />
        <KpiCard label="Avg Engagement Timeline" value="18 mo" sub="Typical SBTi adoption cycle" color={T.amber} />
      </div>

      {/* Scatter Matrix */}
      <Card>
        <SectionTitle>2×2 Engagement Priority Matrix — Portfolio Weight vs Temperature Gap</SectionTitle>
        <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>
          Bubble size = engagement difficulty. Priority 1: High Weight (&gt;2.5%) + High Gap (&gt;1.5°C)
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" dataKey="weight" name="Portfolio Weight" domain={[0, 5]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: T.textSec }} label={{ value:'Portfolio Weight (%)', position:'insideBottom', offset:-10, fontSize:11, fill:T.textSec }} />
            <YAxis type="number" dataKey="gap" name="Temp Gap" domain={[0, 4]} tickFormatter={v => `+${v}°C`} tick={{ fontSize: 11, fill: T.textSec }} label={{ value:'Temp Gap above 1.5°C', angle:-90, position:'insideLeft', fontSize:11, fill:T.textSec }} />
            <ZAxis type="number" dataKey="difficulty" range={[200, 1200]} />
            <Tooltip cursor={{ strokeDasharray:'3 3' }} content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
                  <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>{d.name}</div>
                  <div style={{ color: T.textSec }}>Weight: {d.weight}%</div>
                  <div style={{ color: T.textSec }}>Temp Gap: +{d.gap}°C</div>
                  <div style={{ color: T.textSec }}>Engagement Difficulty: {d.difficulty}/100</div>
                  <div style={{ marginTop: 4 }}><span style={{ fontWeight: 600, color: d.quadrant === 'P1' ? T.red : T.amber }}>Priority: {d.quadrant}</span></div>
                </div>
              );
            }} />
            <ReferenceLine x={2.5} stroke={T.borderL} strokeDasharray="4 4" />
            <ReferenceLine y={1.5} stroke={T.borderL} strokeDasharray="4 4" />
            <Scatter data={engagementBubbles} fill={T.navyL}>
              {engagementBubbles.map((d, i) => (
                <Cell key={i} fill={d.quadrant === 'P1' ? T.red : d.quadrant === 'P2' ? T.amber : T.sage} fillOpacity={0.75} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 20, fontSize: 12, color: T.textSec, marginTop: 8 }}>
          <span><span style={{ color: T.red, fontWeight: 700 }}>■</span> Priority 1 (High Weight + High Gap)</span>
          <span><span style={{ color: T.amber, fontWeight: 700 }}>■</span> Priority 2</span>
          <span><span style={{ color: T.sage, fontWeight: 700 }}>■</span> Priority 3/4</span>
        </div>
      </Card>

      {/* Priority Engagement List */}
      <Card>
        <SectionTitle>Priority 1 Engagement Actions</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {engagementList.map((e, i) => (
            <div key={i} style={{ padding: '14px 16px', background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <span style={{ fontWeight: 700, color: T.navy, fontSize: 14 }}>{e.company}</span>
                  <span style={{ marginLeft: 10, fontSize: 12, color: T.red, fontWeight: 600 }}>{e.temp}°C implied temp</span>
                  <span style={{ marginLeft: 6, fontSize: 12, color: T.textSec }}>/ +{e.gap}°C above 1.5°C</span>
                </div>
                <span style={{ fontSize: 12, color: T.green, fontWeight: 700, background: '#dcfce7', borderRadius: 10, padding: '2px 10px' }}>
                  Impact: {e.impact} portfolio temp
                </span>
              </div>
              <div style={{ fontSize: 13, color: T.textSec, marginTop: 6 }}>
                <strong style={{ color: T.navyL }}>Engagement theme:</strong> {e.theme}
              </div>
              <div style={{ fontSize: 12, color: T.textMut, marginTop: 4 }}>Timeline: {e.timeline}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: '12px 16px', background: '#f0fdf4', borderRadius: 8, border: `1px solid #bbf7d0` }}>
          <span style={{ fontWeight: 700, color: T.green }}>Projected portfolio temperature if all P1 engagements succeed: </span>
          <span style={{ fontWeight: 800, color: T.green, fontSize: 18 }}>1.5°C by 2027</span>
        </div>
      </Card>
    </div>
  );
}

function Tab6() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* PAII KPIs */}
      <Card>
        <SectionTitle>PAII Required KPIs — Annual Reporting Dashboard</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                {['Metric','2024 Value','Benchmark / Target','Status'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paiiKpis.map((k, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.bg }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: T.navy }}>{k.metric}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: T.navyL, fontSize: 15 }}>{k.value}</td>
                  <td style={{ padding: '10px 14px', color: T.textSec }}>{k.benchmark}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ background: '#dcfce7', color: T.green, borderRadius: 12, padding: '2px 12px', fontSize: 12, fontWeight: 600 }}>
                      On Track
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* TCFD Pillars */}
      <Card>
        <SectionTitle>TCFD Climate Disclosure — 4 Pillars Quality Assessment</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tcfdPillars.map((p, i) => (
            <div key={i} style={{ padding: '14px 16px', background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 700, color: T.navy, fontSize: 14 }}>{p.pillar}</span>
                <span style={{ fontWeight: 800, color: T.sage, fontSize: 16 }}>{p.quality}/100</span>
              </div>
              <div style={{ height: 8, background: T.border, borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ width: `${p.quality}%`, height: '100%', background: T.sage, borderRadius: 4, transition: 'width 0.5s' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {p.items.map((item, j) => (
                  <span key={j} style={{ fontSize: 11, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '2px 10px', color: T.textSec }}>
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Reporting Timeline */}
      <Card>
        <SectionTitle>2026 PAII Annual Report — Data Collection Milestones</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reportingMilestones.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px',
              background: m.done ? '#f0fdf4' : T.bg, borderRadius: 8, border: `1px solid ${m.done ? '#bbf7d0' : T.border}` }}>
              <span style={{ fontSize: 18, minWidth: 24 }}>{m.done ? '✓' : '○'}</span>
              <span style={{ fontWeight: 600, color: T.navy, minWidth: 90, fontSize: 13 }}>{m.date}</span>
              <span style={{ fontSize: 13, color: T.textSec }}>{m.task}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600,
                color: m.done ? T.green : T.amber,
                background: m.done ? '#dcfce7' : '#fef9c3',
                borderRadius: 10, padding: '2px 10px', whiteSpace: 'nowrap' }}>
                {m.done ? 'Complete' : 'Upcoming'}
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: '12px 16px', background: T.surfaceH, borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, color: T.textSec }}>
          Next PAII annual submission deadline: <strong style={{ color: T.navy }}>May 2026</strong> — aligned with UN PRI reporting cycle.
        </div>
      </Card>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NetZeroPortfolioBuilderPage() {
  const [activeTab, setActiveTab] = useState(0);

  const tabContent = [<Tab1 />, <Tab2 />, <Tab3 />, <Tab4 />, <Tab5 />, <Tab6 />];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', color: T.text }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '28px 32px 24px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: T.gold, fontWeight: 600, letterSpacing: 1.5, marginBottom: 6 }}>EP-AF4 · AA IMPACT RISK ANALYTICS</div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
              Net Zero Portfolio Builder
            </h1>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 6 }}>
              Paris-aligned portfolio construction · SBTi tracking · PAII reporting · Engagement management
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {BADGES.map(b => (
              <span key={b} style={{ background: 'rgba(197,169,106,0.18)', color: T.gold, border: `1px solid rgba(197,169,106,0.4)`,
                borderRadius: 12, padding: '3px 12px', fontSize: 11, fontWeight: 600 }}>{b}</span>
            ))}
          </div>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: 4, marginTop: 20, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              transition: 'all 0.15s',
              background: activeTab === i ? T.gold : 'rgba(255,255,255,0.08)',
              color: activeTab === i ? T.navy : 'rgba(255,255,255,0.75)',
            }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
        {tabContent[activeTab]}
      </div>
    </div>
  );
}
