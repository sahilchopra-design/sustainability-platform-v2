import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend, ReferenceLine, ZAxis
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const HOTSPOTS = [
  { country:'Ukraine', events_2025:4820, fatalities:18500, stability:2, trend:'deteriorating', fsi:82.5, coup_risk:5, backsliding:15, insurance:'Unavailable' },
  { country:'Sudan', events_2025:3200, fatalities:12400, stability:5, trend:'deteriorating', fsi:108.4, coup_risk:45, backsliding:35, insurance:'Unavailable' },
  { country:'Myanmar', events_2025:2850, fatalities:8200, stability:2, trend:'deteriorating', fsi:100.2, coup_risk:25, backsliding:55, insurance:'Restricted' },
  { country:'Syria', events_2025:1680, fatalities:4500, stability:5, trend:'stable-low', fsi:107.8, coup_risk:20, backsliding:40, insurance:'Unavailable' },
  { country:'DR Congo', events_2025:2400, fatalities:6800, stability:3, trend:'deteriorating', fsi:109.2, coup_risk:15, backsliding:25, insurance:'Restricted' },
  { country:'Nigeria', events_2025:1950, fatalities:5200, stability:8, trend:'stable-low', fsi:97.8, coup_risk:10, backsliding:20, insurance:'High Premium' },
  { country:'Ethiopia', events_2025:1200, fatalities:3500, stability:5, trend:'improving', fsi:95.2, coup_risk:12, backsliding:22, insurance:'High Premium' },
  { country:'Pakistan', events_2025:1450, fatalities:2800, stability:5, trend:'stable-low', fsi:88.4, coup_risk:18, backsliding:15, insurance:'High Premium' },
  { country:'Somalia', events_2025:1800, fatalities:4200, stability:2, trend:'stable-low', fsi:111.8, coup_risk:30, backsliding:35, insurance:'Unavailable' },
  { country:'Iraq', events_2025:680, fatalities:1200, stability:12, trend:'improving', fsi:88.2, coup_risk:8, backsliding:10, insurance:'Available' },
  { country:'Yemen', events_2025:1100, fatalities:3800, stability:3, trend:'deteriorating', fsi:107.2, coup_risk:25, backsliding:40, insurance:'Unavailable' },
  { country:'Burkina Faso', events_2025:1400, fatalities:3200, stability:3, trend:'deteriorating', fsi:96.5, coup_risk:55, backsliding:60, insurance:'Restricted' },
  { country:'Mali', events_2025:1100, fatalities:2400, stability:5, trend:'deteriorating', fsi:94.8, coup_risk:40, backsliding:55, insurance:'Restricted' },
  { country:'Israel/Palestine', events_2025:2200, fatalities:8500, stability:8, trend:'deteriorating', fsi:72.5, coup_risk:2, backsliding:10, insurance:'Restricted' },
  { country:'Haiti', events_2025:850, fatalities:1800, stability:2, trend:'deteriorating', fsi:104.5, coup_risk:35, backsliding:45, insurance:'Unavailable' },
];

const FSI_TOP20 = [
  { country:'Somalia', score:111.8 },{ country:'DR Congo', score:109.2 },{ country:'Sudan', score:108.4 },
  { country:'Syria', score:107.8 },{ country:'Yemen', score:107.2 },{ country:'Haiti', score:104.5 },
  { country:'Myanmar', score:100.2 },{ country:'Nigeria', score:97.8 },{ country:'Burkina Faso', score:96.5 },
  { country:'Ethiopia', score:95.2 },{ country:'Mali', score:94.8 },{ country:'Chad', score:93.5 },
  { country:'Guinea', score:92.8 },{ country:'Niger', score:91.2 },{ country:'Afghanistan', score:90.8 },
  { country:'Cameroon', score:89.5 },{ country:'Pakistan', score:88.4 },{ country:'Iraq', score:88.2 },
  { country:'Libya', score:87.5 },{ country:'Zimbabwe', score:86.2 },
];

const STABILITY_TREND = [
  { year:2021, Ukraine:22, Sudan:12, Myanmar:18, Nigeria:10, Ethiopia:8 },
  { year:2022, Ukraine:2, Sudan:10, Myanmar:5, Nigeria:9, Ethiopia:5 },
  { year:2023, Ukraine:3, Sudan:5, Myanmar:3, Nigeria:8, Ethiopia:7 },
  { year:2024, Ukraine:2, Sudan:4, Myanmar:2, Nigeria:8, Ethiopia:6 },
  { year:2025, Ukraine:2, Sudan:5, Myanmar:2, Nigeria:8, Ethiopia:5 },
];

const ASSET_PROXIMITY = [
  { asset:'Lagos LNG Terminal', country:'Nigeria', distance_km:12, conflict_events:85, risk:'HIGH' },
  { asset:'Karachi Pipeline Hub', country:'Pakistan', distance_km:45, conflict_events:42, risk:'MEDIUM' },
  { asset:'DRC Cobalt Mine (Kolwezi)', country:'DR Congo', distance_km:28, conflict_events:65, risk:'HIGH' },
  { asset:'Mozambique LNG', country:'Mozambique', distance_km:55, conflict_events:38, risk:'MEDIUM' },
  { asset:'Iraq Kurdistan Oil Field', country:'Iraq', distance_km:35, conflict_events:22, risk:'MEDIUM' },
  { asset:'Ethiopia Hydro Dam', country:'Ethiopia', distance_km:120, conflict_events:15, risk:'LOW' },
  { asset:'Sudan Gold Mine', country:'Sudan', distance_km:8, conflict_events:120, risk:'CRITICAL' },
  { asset:'Myanmar Gas Pipeline', country:'Myanmar', distance_km:22, conflict_events:95, risk:'HIGH' },
];

const RISK_COLORS = { CRITICAL: T.red, HIGH: T.orange, MEDIUM: T.amber, LOW: T.green };
const TREND_COLORS = { deteriorating: T.red, 'stable-low': T.amber, improving: T.green };
const INS_COLORS = { Unavailable: T.red, Restricted: T.orange, 'High Premium': T.amber, Available: T.green };
const TABS = ['Conflict Event Map','Political Stability Trends','Fragile States Index','Asset Proximity Analysis','Early Warning','Insurance Implications'];

export default function ConflictStabilityTrackerPage() {
  const [tab, setTab] = useState(0);
  const [countryFilter, setCountryFilter] = useState('All');

  const filtered = countryFilter === 'All' ? HOTSPOTS : HOTSPOTS.filter(h => h.country === countryFilter);

  const card = (label, value, sub, color = T.navy) => (
    <div style={{ background: T.surface, borderRadius: 10, padding: '14px 18px', border: `1px solid ${T.border}`, flex: '1 1 155px' }}>
      <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ background: '#7c2d12', color: '#fff', fontFamily: T.mono, fontSize: 11, padding: '3px 10px', borderRadius: 6 }}>EP-CV4</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0 }}>Conflict & Political Stability Tracker</h1>
      </div>
      <p style={{ color: T.textSec, fontSize: 13, marginBottom: 16 }}>
        ACLED-style conflict monitoring, FSI fragility scoring, asset proximity analysis, and political risk insurance assessment.
        <span style={{ fontFamily: T.mono, marginLeft: 8, fontSize: 11, color: T.textMut }}>Source: ACLED | Fund for Peace FSI | World Bank WGI | PRI Market</span>
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {card('Active Hotspots', HOTSPOTS.length, '15 countries monitored', T.red)}
        {card('Total Events 2025', HOTSPOTS.reduce((s,h) => s + h.events_2025, 0).toLocaleString(), 'Conflict events YTD')}
        {card('Deteriorating', HOTSPOTS.filter(h => h.trend === 'deteriorating').length, 'Worsening countries', T.red)}
        {card('Assets at Risk', ASSET_PROXIMITY.filter(a => a.risk === 'CRITICAL' || a.risk === 'HIGH').length, 'Within 50km of conflict', T.orange)}
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 18 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '10px 14px', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 13, fontWeight: tab === i ? 700 : 500,
            color: tab === i ? T.navy : T.textSec, background: tab === i ? T.surface : 'transparent',
            borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent', marginBottom: -2, borderRadius: '6px 6px 0 0'
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Conflict Events & Fatalities by Country (2025 YTD)</h3>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="events_2025" name="Events" tick={{ fontSize: 11 }} label={{ value: 'Conflict Events', position: 'bottom', fontSize: 11 }} />
              <YAxis dataKey="fatalities" name="Fatalities" tick={{ fontSize: 11 }} label={{ value: 'Fatalities', angle: -90, position: 'left', fontSize: 11 }} />
              <ZAxis range={[50, 50]} />
              <Tooltip content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return (<div style={{ background: '#fff', border: `1px solid ${T.border}`, padding: 10, borderRadius: 8, fontSize: 12 }}>
                  <div style={{ fontWeight: 700 }}>{d.country}</div>
                  <div>Events: {d.events_2025.toLocaleString()} | Fatalities: {d.fatalities.toLocaleString()}</div>
                  <div>Stability: {d.stability}/100 | Trend: {d.trend}</div>
                </div>);
              }} />
              <Scatter data={HOTSPOTS}>
                {HOTSPOTS.map(h => <Cell key={h.country} fill={TREND_COLORS[h.trend]} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
            {Object.entries(TREND_COLORS).map(([k, v]) => (
              <span key={k} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: v }} />{k}</span>
            ))}
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Political Stability WGI Score (5-Year Trend)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={STABILITY_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 30]} label={{ value: 'WGI Stability (0-100)', angle: -90, position: 'left', fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Ukraine" stroke={T.blue} strokeWidth={2} />
              <Line type="monotone" dataKey="Sudan" stroke={T.red} strokeWidth={2} />
              <Line type="monotone" dataKey="Myanmar" stroke={T.purple} strokeWidth={2} />
              <Line type="monotone" dataKey="Nigeria" stroke={T.amber} strokeWidth={2} />
              <Line type="monotone" dataKey="Ethiopia" stroke={T.orange} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Fragile States Index (Fund for Peace) - Top 20 Most Fragile</h3>
          <ResponsiveContainer width="100%" height={450}>
            <BarChart data={FSI_TOP20} layout="vertical" margin={{ left: 110 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[80, 115]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="country" tick={{ fontSize: 10 }} width={105} />
              <Tooltip formatter={v => [`${v}`, 'FSI Score']} />
              <ReferenceLine x={90} stroke={T.amber} strokeDasharray="5 5" label={{ value: 'Alert', fontSize: 10 }} />
              <ReferenceLine x={100} stroke={T.red} strokeDasharray="5 5" label={{ value: 'Very High Alert', fontSize: 10 }} />
              <Bar dataKey="score" radius={[0,4,4,0]}>
                {FSI_TOP20.map(f => <Cell key={f.country} fill={f.score >= 100 ? T.red : f.score >= 90 ? T.orange : T.amber} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Asset Proximity to Conflict Zones</h3>
          <p style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Portfolio assets within 100km of active conflict zones, ranked by risk.</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: T.bg }}>
              {['Asset','Country','Distance km','Nearby Events','Risk Level'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {ASSET_PROXIMITY.sort((a,b) => {const o = {CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3}; return o[a.risk] - o[b.risk]; }).map(a => (
                <tr key={a.asset} style={{ borderBottom: `1px solid ${T.border}`, background: a.risk === 'CRITICAL' ? '#fef2f2' : 'transparent' }}>
                  <td style={{ padding: '6px 10px', fontWeight: 600 }}>{a.asset}</td>
                  <td style={{ padding: '6px 10px' }}>{a.country}</td>
                  <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{a.distance_km}</td>
                  <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{a.conflict_events}</td>
                  <td style={{ padding: '6px 10px' }}><span style={{ color: RISK_COLORS[a.risk], fontWeight: 700, fontSize: 11 }}>{a.risk}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Early Warning Indicators</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: T.bg }}>
              {['Country','Coup Risk %','Democratic Backsliding','Stability WGI','FSI Score','Trend'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {HOTSPOTS.sort((a,b) => b.coup_risk - a.coup_risk).map(h => (
                <tr key={h.country} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 10px', fontWeight: 600 }}>{h.country}</td>
                  <td style={{ padding: '6px 10px', fontFamily: T.mono, color: h.coup_risk > 30 ? T.red : h.coup_risk > 15 ? T.amber : T.green, fontWeight: 700 }}>{h.coup_risk}%</td>
                  <td style={{ padding: '6px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 60, height: 6, background: T.bg, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${h.backsliding}%`, height: '100%', background: h.backsliding > 40 ? T.red : h.backsliding > 20 ? T.amber : T.green, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontFamily: T.mono, fontSize: 11 }}>{h.backsliding}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{h.stability}</td>
                  <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{h.fsi}</td>
                  <td style={{ padding: '6px 10px' }}><span style={{ color: TREND_COLORS[h.trend], fontWeight: 600 }}>{h.trend}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Political Risk Insurance Coverage Assessment</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
            <thead><tr style={{ background: T.bg }}>
              {['Country','Insurance Status','Stability','FSI','Conflict Events','Coverage Assessment'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {HOTSPOTS.map(h => (
                <tr key={h.country} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 10px', fontWeight: 600 }}>{h.country}</td>
                  <td style={{ padding: '6px 10px' }}><span style={{ color: INS_COLORS[h.insurance], fontWeight: 700 }}>{h.insurance}</span></td>
                  <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{h.stability}</td>
                  <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{h.fsi}</td>
                  <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{h.events_2025.toLocaleString()}</td>
                  <td style={{ padding: '6px 10px', fontSize: 11 }}>
                    {h.insurance === 'Unavailable' ? 'No commercial PRI available. Consider MIGA/sovereign guarantee.' :
                     h.insurance === 'Restricted' ? 'Limited coverage. High deductibles, exclusions likely.' :
                     h.insurance === 'High Premium' ? 'Available at elevated premiums (200-500bp). Sublimits apply.' :
                     'Standard PRI available at market rates.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: 12, background: T.bg, borderRadius: 8, fontSize: 12, color: T.textSec }}>
            <strong>PRI Providers:</strong> MIGA (World Bank Group) | AIG Political Risk | Zurich | Lloyd's Syndicates | Euler Hermes | OPIC/DFC.
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, padding: 14, background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 11, color: T.textMut }}>
        <strong>Data Sources:</strong> ACLED Conflict Data 2025 | Fund for Peace FSI 2025 | World Bank WGI | PRI Market Intelligence.
        <span style={{ float: 'right', fontFamily: T.mono }}>EP-CV4 v1.0 | Conflict Tracker</span>
      </div>
    </div>
  );
}
