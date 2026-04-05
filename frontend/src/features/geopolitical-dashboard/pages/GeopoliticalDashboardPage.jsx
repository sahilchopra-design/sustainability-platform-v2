import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, ReferenceLine
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const DIMS = ['Voice & Acc.','Pol. Stability','Govt Effect.','Reg. Quality','Rule of Law','Ctrl Corrupt.'];

const HEATMAP_DATA = [
  { country:'Norway', va:95, ps:88, ge:92, rq:88, rl:95, cc:95, composite:94 },
  { country:'Switzerland', va:92, ps:90, ge:95, rq:92, rl:95, cc:92, composite:93 },
  { country:'New Zealand', va:92, ps:92, ge:90, rq:95, rl:92, cc:95, composite:93 },
  { country:'Singapore', va:42, ps:92, ge:96, rq:98, rl:95, cc:94, composite:89 },
  { country:'Canada', va:88, ps:82, ge:90, rq:92, rl:91, cc:89, composite:88 },
  { country:'Germany', va:90, ps:72, ge:88, rq:91, rl:90, cc:88, composite:86 },
  { country:'Australia', va:88, ps:80, ge:88, rq:92, rl:90, cc:86, composite:86 },
  { country:'Japan', va:80, ps:85, ge:88, rq:84, rl:86, cc:82, composite:84 },
  { country:'UK', va:85, ps:62, ge:86, rq:90, rl:88, cc:84, composite:82 },
  { country:'USA', va:78, ps:55, ge:82, rq:85, rl:80, cc:76, composite:72 },
  { country:'Chile', va:78, ps:45, ge:72, rq:82, rl:78, cc:72, composite:74 },
  { country:'Poland', va:68, ps:65, ge:62, rq:72, rl:58, cc:58, composite:63 },
  { country:'UAE', va:18, ps:72, ge:82, rq:76, rl:74, cc:72, composite:71 },
  { country:'India', va:58, ps:22, ge:55, rq:42, rl:48, cc:38, composite:44 },
  { country:'China', va:5, ps:38, ge:68, rq:42, rl:45, cc:42, composite:34 },
  { country:'Saudi Arabia', va:5, ps:42, ge:58, rq:52, rl:55, cc:48, composite:49 },
  { country:'Turkey', va:22, ps:18, ge:45, rq:42, rl:35, cc:32, composite:32 },
  { country:'Nigeria', va:35, ps:8, ge:18, rq:15, rl:18, cc:12, composite:15 },
  { country:'Russia', va:8, ps:15, ge:42, rq:28, rl:22, cc:18, composite:12 },
  { country:'Venezuela', va:8, ps:8, ge:5, rq:2, rl:2, cc:2, composite:4 },
];

const TOP10_EXPOSURES = [
  { holding:'PetroChina', country:'China', geo_score:34, exposure_pct:3.2, risk:'HIGH', driver:'Sanctions risk + trade policy' },
  { holding:'Saudi Aramco', country:'Saudi Arabia', geo_score:49, exposure_pct:4.5, risk:'MEDIUM', driver:'Fossil state dependency' },
  { holding:'Gazprom ADR', country:'Russia', geo_score:12, exposure_pct:0.15, risk:'CRITICAL', driver:'Comprehensive sanctions' },
  { holding:'Vale SA', country:'Brazil', geo_score:42, exposure_pct:3.8, risk:'MEDIUM', driver:'Political instability' },
  { holding:'Reliance Industries', country:'India', geo_score:44, exposure_pct:1.8, risk:'MEDIUM', driver:'Conflict + regulatory' },
  { holding:'Petrobras', country:'Brazil', geo_score:42, exposure_pct:2.1, risk:'MEDIUM', driver:'Policy reversal risk' },
  { holding:'CNOOC', country:'China', geo_score:34, exposure_pct:1.2, risk:'HIGH', driver:'Taiwan strait + sanctions' },
  { holding:'Ecopetrol', country:'Colombia', geo_score:37, exposure_pct:0.5, risk:'MEDIUM', driver:'Conflict + policy' },
  { holding:'Turkish Airlines', country:'Turkey', geo_score:32, exposure_pct:0.6, risk:'MEDIUM', driver:'Political instability' },
  { holding:'First Quantum Minerals', country:'Panama/DRC', geo_score:28, exposure_pct:0.4, risk:'HIGH', driver:'Resource nationalism + conflict' },
];

const SANCTIONS_ALERTS = [
  { date:'2026-03-28', detail:'OFAC adds 12 Russian defense entities to SDN list', severity:'HIGH', regime:'USA' },
  { date:'2026-03-25', detail:'EU CBAM Phase 2 reporting requirements now effective', severity:'HIGH', regime:'EU' },
  { date:'2026-03-20', detail:'Belarus entities added to EU asset freeze list', severity:'MEDIUM', regime:'EU' },
  { date:'2026-03-18', detail:'15 Chinese semiconductor firms added to Entity List', severity:'HIGH', regime:'USA' },
];

const MINERAL_ALERTS = [
  { date:'2026-03-22', mineral:'Rare Earths', detail:'China export license delays extending to 90+ days for REE', severity:'HIGH' },
  { date:'2026-03-15', mineral:'Cobalt', detail:'DRC eastern provinces see renewed conflict near Kolwezi corridor', severity:'MEDIUM' },
  { date:'2026-03-10', mineral:'Lithium', detail:'Chile proposes increased royalty on lithium mining operations', severity:'MEDIUM' },
  { date:'2026-03-05', mineral:'Nickel', detail:'Indonesia nickel export processing mandate enforcement tightened', severity:'LOW' },
];

const CONFLICT_ALERTS = [
  { date:'2026-03-30', country:'Sudan', detail:'RSF advances on Port Sudan; humanitarian corridor blocked', severity:'HIGH' },
  { date:'2026-03-27', country:'Myanmar', detail:'Resistance forces capture 3 border towns; junta responds with airstrikes', severity:'HIGH' },
  { date:'2026-03-25', country:'DR Congo', detail:'M23 expansion toward Lubumbashi mining region; MONUSCO redeployment', severity:'MEDIUM' },
  { date:'2026-03-20', country:'Israel/Palestine', detail:'Northern Gaza ceasefire negotiations collapse; escalation risk elevated', severity:'HIGH' },
];

const RISK_COLORS = { CRITICAL: T.red, HIGH: T.orange, MEDIUM: T.amber, LOW: T.green };
const SEV_BG = { HIGH: '#fef2f2', MEDIUM: '#fffbeb', LOW: '#f0fdf4' };
const TABS = ['Risk Heatmap','Top 10 Exposures','Sanctions Alerts','Mineral Supply Alerts','Conflict Watch','Board Report'];

export default function GeopoliticalDashboardPage() {
  const [tab, setTab] = useState(0);
  const [reportDate] = useState(new Date().toISOString().split('T')[0]);

  const cellColor = v => v >= 80 ? '#166534' : v >= 60 ? '#16a34a' : v >= 40 ? '#d97706' : v >= 20 ? '#ea580c' : '#dc2626';

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ background: '#7c2d12', color: '#fff', fontFamily: T.mono, fontSize: 11, padding: '3px 10px', borderRadius: 6 }}>EP-CV6</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0 }}>Geopolitical Executive Dashboard</h1>
      </div>
      <p style={{ color: T.textSec, fontSize: 13, marginBottom: 16 }}>
        Executive-level geopolitical intelligence aggregating CV1-CV5 modules: risk index, sanctions, minerals, conflict, and nexus analysis.
        <span style={{ fontFamily: T.mono, marginLeft: 8, fontSize: 11, color: T.textMut }}>Report date: {reportDate}</span>
      </p>

      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 18 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '10px 16px', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 13, fontWeight: tab === i ? 700 : 500,
            color: tab === i ? T.navy : T.textSec, background: tab === i ? T.surface : 'transparent',
            borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent', marginBottom: -2, borderRadius: '6px 6px 0 0'
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>WGI Heatmap: 20 Countries x 6 Dimensions</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ background: T.bg }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 10 }}>Country</th>
                {DIMS.map(d => <th key={d} style={{ padding: '6px 8px', textAlign: 'center', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 9 }}>{d}</th>)}
                <th style={{ padding: '6px 8px', textAlign: 'center', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 10 }}>Composite</th>
              </tr></thead>
              <tbody>
                {HEATMAP_DATA.map(c => (
                  <tr key={c.country}>
                    <td style={{ padding: '4px 8px', fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{c.country}</td>
                    {[c.va, c.ps, c.ge, c.rq, c.rl, c.cc].map((v, i) => (
                      <td key={i} style={{ padding: '4px 8px', textAlign: 'center', background: cellColor(v), color: '#fff', fontFamily: T.mono, fontSize: 10, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{v}</td>
                    ))}
                    <td style={{ padding: '4px 8px', textAlign: 'center', fontFamily: T.mono, fontWeight: 800, fontSize: 12, borderBottom: `1px solid ${T.border}`, color: cellColor(c.composite) }}>{c.composite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: T.textMut }}>Score:</span>
            {[0,20,40,60,80].map(v => (
              <span key={v} style={{ width: 40, height: 16, background: cellColor(v + 10), color: '#fff', fontSize: 9, textAlign: 'center', lineHeight: '16px', borderRadius: 2 }}>{v}-{v+19}</span>
            ))}
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Top 10 Geopolitical Risk Exposures in Portfolio</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: T.bg }}>
              {['Holding','Country','Geo Score','Exposure %','Risk','Key Driver'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {TOP10_EXPOSURES.map(e => (
                <tr key={e.holding} style={{ borderBottom: `1px solid ${T.border}`, background: e.risk === 'CRITICAL' ? '#fef2f2' : 'transparent' }}>
                  <td style={{ padding: '6px 10px', fontWeight: 600 }}>{e.holding}</td>
                  <td style={{ padding: '6px 10px' }}>{e.country}</td>
                  <td style={{ padding: '6px 10px', fontFamily: T.mono, color: e.geo_score < 30 ? T.red : e.geo_score < 50 ? T.amber : T.green, fontWeight: 700 }}>{e.geo_score}</td>
                  <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{e.exposure_pct}%</td>
                  <td style={{ padding: '6px 10px' }}><span style={{ color: RISK_COLORS[e.risk], fontWeight: 700 }}>{e.risk}</span></td>
                  <td style={{ padding: '6px 10px', fontSize: 11 }}>{e.driver}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={TOP10_EXPOSURES} layout="vertical" margin={{ left: 130 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="holding" tick={{ fontSize: 10 }} width={125} />
              <Tooltip />
              <Legend />
              <Bar dataKey="geo_score" fill={T.navy} name="Geo Score" />
              <Bar dataKey="exposure_pct" fill={T.gold} name="Portfolio %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Sanctions Alerts (Last 30 Days)</h3>
          {SANCTIONS_ALERTS.map((a, i) => (
            <div key={i} style={{ padding: 14, background: SEV_BG[a.severity] || T.bg, borderRadius: 8, marginBottom: 8, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, color: T.navy }}>{a.regime} Sanctions</span>
                <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, color: RISK_COLORS[a.severity] }}>{a.severity}</span>
              </div>
              <div style={{ fontSize: 12, color: T.textSec }}>{a.detail}</div>
              <div style={{ fontSize: 10, fontFamily: T.mono, color: T.textMut, marginTop: 4 }}>{a.date}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 3 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Critical Mineral Supply Alerts</h3>
          {MINERAL_ALERTS.map((a, i) => (
            <div key={i} style={{ padding: 14, background: SEV_BG[a.severity] || T.bg, borderRadius: 8, marginBottom: 8, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, color: T.navy }}>{a.mineral}</span>
                <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, color: RISK_COLORS[a.severity] }}>{a.severity}</span>
              </div>
              <div style={{ fontSize: 12, color: T.textSec }}>{a.detail}</div>
              <div style={{ fontSize: 10, fontFamily: T.mono, color: T.textMut, marginTop: 4 }}>{a.date}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 4 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Active Conflict Watch</h3>
          {CONFLICT_ALERTS.map((a, i) => (
            <div key={i} style={{ padding: 14, background: SEV_BG[a.severity] || T.bg, borderRadius: 8, marginBottom: 8, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, color: T.navy }}>{a.country}</span>
                <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, color: RISK_COLORS[a.severity] }}>{a.severity}</span>
              </div>
              <div style={{ fontSize: 12, color: T.textSec }}>{a.detail}</div>
              <div style={{ fontSize: 10, fontFamily: T.mono, color: T.textMut, marginTop: 4 }}>{a.date}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <div style={{ border: `2px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 8 }}>CONFIDENTIAL - FOR BOARD RISK COMMITTEE</div>
            <h4 style={{ color: T.navy, marginBottom: 12 }}>Geopolitical Risk Committee Report - {reportDate}</h4>

            <div style={{ marginBottom: 16 }}>
              <h5 style={{ color: T.navy, fontSize: 13, marginBottom: 6 }}>1. Executive Summary</h5>
              <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>
                The portfolio has {TOP10_EXPOSURES.filter(e => e.risk === 'CRITICAL').length} CRITICAL and {TOP10_EXPOSURES.filter(e => e.risk === 'HIGH').length} HIGH
                geopolitical risk exposures. Key risks include Russian sanctions exposure (residual), China trade policy deterioration, and critical mineral supply
                concentration. {SANCTIONS_ALERTS.filter(a => a.severity === 'HIGH').length} high-severity sanctions alerts and {CONFLICT_ALERTS.filter(a => a.severity === 'HIGH').length} conflict
                escalation alerts require immediate attention.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h5 style={{ color: T.navy, fontSize: 13, marginBottom: 6 }}>2. Priority Actions</h5>
              <div style={{ fontSize: 12, color: T.textSec }}>
                {[
                  'Complete divestment of remaining Russian exposure (Gazprom/Lukoil GDRs)',
                  'Assess China-exposed holdings for Section 301 tariff and Entity List impact',
                  'Diversify critical mineral supply chain exposure away from single-country dependency',
                  'Review political risk insurance coverage for DRC and Myanmar assets',
                  'Monitor US election scenarios for IRA subsidy reversal risk',
                  'Establish contingency plans for REE export restriction scenario',
                ].map((a, i) => (
                  <div key={i} style={{ padding: '4px 0', display: 'flex', gap: 6 }}>
                    <span style={{ fontFamily: T.mono, color: T.gold }}>{i + 1}.</span>
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 style={{ color: T.navy, fontSize: 13, marginBottom: 6 }}>3. Alert Summary</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div style={{ padding: 10, background: '#fef2f2', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: T.red }}>{SANCTIONS_ALERTS.filter(a => a.severity === 'HIGH').length}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>High Sanctions Alerts</div>
                </div>
                <div style={{ padding: 10, background: '#fffbeb', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: T.amber }}>{MINERAL_ALERTS.filter(a => a.severity === 'HIGH').length}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>Mineral Supply Alerts</div>
                </div>
                <div style={{ padding: 10, background: '#fef2f2', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: T.red }}>{CONFLICT_ALERTS.filter(a => a.severity === 'HIGH').length}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>Conflict Escalation Alerts</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, padding: 14, background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 11, color: T.textMut }}>
        <strong>Data Sources:</strong> Aggregated from EP-CV1 through EP-CV5 modules | World Bank WGI | OFAC | ACLED | IEA CRM.
        <span style={{ float: 'right', fontFamily: T.mono }}>EP-CV6 v1.0 | Geopolitical Dashboard</span>
      </div>
    </div>
  );
}
