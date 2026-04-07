import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend, ReferenceLine
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const SEG_COLORS = { Upstream: '#ea580c', Midstream: '#2563eb', Downstream: '#7c3aed' };

const SEGMENTS = {
  Upstream: { revenue_bn: 42.5, ebitda_bn: 18.2, capex_bn: 12.8, emissions_mt: 28.4, transition_score: 32 },
  Midstream: { revenue_bn: 18.7, ebitda_bn: 8.9, capex_bn: 4.2, emissions_mt: 5.1, transition_score: 55 },
  Downstream: { revenue_bn: 56.3, ebitda_bn: 6.1, capex_bn: 8.5, emissions_mt: 18.7, transition_score: 48 },
};

const REVENUE_TREND = [
  { year: 2020, Upstream: 28.1, Midstream: 14.2, Downstream: 41.5 },
  { year: 2021, Upstream: 35.8, Midstream: 16.1, Downstream: 48.2 },
  { year: 2022, Upstream: 52.3, Midstream: 20.4, Downstream: 62.7 },
  { year: 2023, Upstream: 45.1, Midstream: 19.8, Downstream: 58.1 },
  { year: 2024, Upstream: 40.2, Midstream: 18.3, Downstream: 55.8 },
  { year: 2025, Upstream: 42.5, Midstream: 18.7, Downstream: 56.3 },
];

const UPSTREAM_DETAIL = {
  reserves_mmboe: 8420, rp_ratio: 11.2, production_mboed: 1840,
  decline_rate: 4.8, exploration_capex_bn: 3.2, development_capex_bn: 9.6,
  exploration_freeze: 'Partial (Arctic shelved, deepwater continued)',
  decline_curve: [
    { year: 2025, production: 1840 }, { year: 2026, production: 1752 }, { year: 2027, production: 1668 },
    { year: 2028, production: 1588 }, { year: 2029, production: 1512 }, { year: 2030, production: 1439 },
    { year: 2032, production: 1303 }, { year: 2035, production: 1108 }, { year: 2040, production: 858 },
  ],
};

const MIDSTREAM_DETAIL = {
  pipeline_km: 12400, utilization_pct: 78, lng_capacity_mtpa: 18.5, lng_throughput_mtpa: 14.8,
  storage_mcm: 4200, tariff_revenue_bn: 6.2,
  utilization_trend: [
    { year: 2020, pipeline: 85, lng: 72 }, { year: 2021, pipeline: 83, lng: 76 },
    { year: 2022, pipeline: 82, lng: 82 }, { year: 2023, pipeline: 80, lng: 80 },
    { year: 2024, pipeline: 79, lng: 79 }, { year: 2025, pipeline: 78, lng: 80 },
  ],
};

const DOWNSTREAM_DETAIL = {
  refinery_capacity_kbd: 1250, refinery_utilization: 82, ev_chargers: 2400,
  biofuel_blend_pct: 8.5, retail_sites: 8200, convenience_revenue_bn: 4.8,
  buildout: [
    { year: 2020, ev_chargers: 200, biofuel_pct: 3.2 }, { year: 2021, ev_chargers: 450, biofuel_pct: 4.1 },
    { year: 2022, ev_chargers: 850, biofuel_pct: 5.5 }, { year: 2023, ev_chargers: 1400, biofuel_pct: 6.8 },
    { year: 2024, ev_chargers: 1900, biofuel_pct: 7.6 }, { year: 2025, ev_chargers: 2400, biofuel_pct: 8.5 },
  ],
};

const CROSS_SEGMENT = {
  internal_carbon_price: 85, transfer_pricing_adj: 2.4,
  metrics: [
    { metric: 'Revenue ($B)', Upstream: 42.5, Midstream: 18.7, Downstream: 56.3 },
    { metric: 'EBITDA ($B)', Upstream: 18.2, Midstream: 8.9, Downstream: 6.1 },
    { metric: 'CapEx ($B)', Upstream: 12.8, Midstream: 4.2, Downstream: 8.5 },
    { metric: 'Emissions (Mt)', Upstream: 28.4, Midstream: 5.1, Downstream: 18.7 },
    { metric: 'ROACE (%)', Upstream: 14.2, Midstream: 11.8, Downstream: 7.5 },
  ],
};

const TRANSITION_RADAR = [
  { dim: 'Clean CapEx %', Upstream: 8, Midstream: 22, Downstream: 35 },
  { dim: 'Green Revenue %', Upstream: 2, Midstream: 12, Downstream: 18 },
  { dim: 'Emission Reduction', Upstream: 15, Midstream: 30, Downstream: 25 },
  { dim: 'Tech Adoption', Upstream: 20, Midstream: 45, Downstream: 50 },
  { dim: 'Workforce Reskill', Upstream: 12, Midstream: 35, Downstream: 40 },
  { dim: 'Policy Readiness', Upstream: 25, Midstream: 55, Downstream: 48 },
];

const TABS = ['Segment Overview','Upstream (E&P)','Midstream (Transport)','Downstream (Refining+Retail)','Cross-Segment Metrics','Transition Readiness'];

export default function EnergySegmentAnalysisPage() {
  const [tab, setTab] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState('All');
  const [carbonPrice, setCarbonPrice] = useState(85);

  const card = (label, value, sub, color = T.navy) => (
    <div style={{ background: T.surface, borderRadius: 10, padding: '14px 18px', border: `1px solid ${T.border}`, flex: '1 1 160px' }}>
      <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  const segCard = (name, data) => (
    <div style={{ background: T.surface, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, flex: '1 1 200px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: SEG_COLORS[name] }} />
        <span style={{ fontWeight: 700, color: T.navy }}>{name}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
        <div><span style={{ color: T.textMut }}>Revenue:</span> <strong>${data.revenue_bn}B</strong></div>
        <div><span style={{ color: T.textMut }}>EBITDA:</span> <strong>${data.ebitda_bn}B</strong></div>
        <div><span style={{ color: T.textMut }}>CapEx:</span> <strong>${data.capex_bn}B</strong></div>
        <div><span style={{ color: T.textMut }}>Emissions:</span> <strong>{data.emissions_mt} Mt</strong></div>
      </div>
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, color: T.textMut }}>Transition Score:</span>
        <div style={{ flex: 1, height: 8, background: T.bg, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${data.transition_score}%`, height: '100%', background: data.transition_score > 50 ? T.green : data.transition_score > 30 ? T.amber : T.red, borderRadius: 4 }} />
        </div>
        <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: data.transition_score > 50 ? T.green : data.transition_score > 30 ? T.amber : T.red }}>{data.transition_score}</span>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ background: T.navy, color: '#fff', fontFamily: T.mono, fontSize: 11, padding: '3px 10px', borderRadius: 6 }}>EP-CU2</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0 }}>Energy Segment Analysis</h1>
      </div>
      <p style={{ color: T.textSec, fontSize: 13, marginBottom: 16 }}>
        Upstream/midstream/downstream decomposition with transition readiness scoring.
        <span style={{ fontFamily: T.mono, marginLeft: 8, fontSize: 11, color: T.textMut }}>Source: IEA WEO 2025 | IOGP benchmarks</span>
      </p>

      {/* Segment Cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {Object.entries(SEGMENTS).map(([name, data]) => segCard(name, data))}
      </div>

      {/* Tabs */}
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
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Revenue by Segment (2020-2025, $B)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={REVENUE_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`$${v}B`]} />
              <Legend />
              {Object.keys(SEG_COLORS).map(seg => (
                <Area key={seg} type="monotone" dataKey={seg} fill={SEG_COLORS[seg]} stroke={SEG_COLORS[seg]} fillOpacity={0.3} strokeWidth={2} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Upstream (E&P) Deep Dive</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            {card('Reserves', `${UPSTREAM_DETAIL.reserves_mmboe.toLocaleString()} MMBoe`, `R/P Ratio: ${UPSTREAM_DETAIL.rp_ratio} years`)}
            {card('Production', `${UPSTREAM_DETAIL.production_mboed.toLocaleString()} MBoe/d`, `Decline rate: ${UPSTREAM_DETAIL.decline_rate}% p.a.`)}
            {card('Exploration CapEx', `$${UPSTREAM_DETAIL.exploration_capex_bn}B`, UPSTREAM_DETAIL.exploration_freeze, T.amber)}
          </div>
          <h4 style={{ color: T.navy, fontSize: 13, marginBottom: 8 }}>Production Decline Curve (MBoe/d)</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={UPSTREAM_DETAIL.decline_curve}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[600, 2000]} />
              <Tooltip formatter={v => [`${v} MBoe/d`]} />
              <Line type="monotone" dataKey="production" stroke={T.orange} strokeWidth={2} dot={{ r: 4 }} />
              <ReferenceLine y={1200} stroke={T.red} strokeDasharray="5 5" label={{ value: 'IEA NZE target', fontSize: 11, fill: T.red }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Midstream (Transport & Storage) Deep Dive</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            {card('Pipeline Network', `${MIDSTREAM_DETAIL.pipeline_km.toLocaleString()} km`, `Utilization: ${MIDSTREAM_DETAIL.utilization_pct}%`)}
            {card('LNG Capacity', `${MIDSTREAM_DETAIL.lng_capacity_mtpa} MTPA`, `Throughput: ${MIDSTREAM_DETAIL.lng_throughput_mtpa} MTPA`)}
            {card('Tariff Revenue', `$${MIDSTREAM_DETAIL.tariff_revenue_bn}B`, 'Regulated tariff income')}
          </div>
          <h4 style={{ color: T.navy, fontSize: 13, marginBottom: 8 }}>Utilization Trends (%)</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={MIDSTREAM_DETAIL.utilization_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[60, 100]} />
              <Tooltip formatter={v => [`${v}%`]} />
              <Legend />
              <Line type="monotone" dataKey="pipeline" stroke={T.blue} strokeWidth={2} name="Pipeline" />
              <Line type="monotone" dataKey="lng" stroke={T.teal} strokeWidth={2} name="LNG Terminal" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Downstream (Refining + Retail) Deep Dive</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            {card('Refinery Capacity', `${DOWNSTREAM_DETAIL.refinery_capacity_kbd} kbd`, `Utilization: ${DOWNSTREAM_DETAIL.refinery_utilization}%`)}
            {card('EV Chargers', DOWNSTREAM_DETAIL.ev_chargers.toLocaleString(), 'Installed charging points', T.green)}
            {card('Biofuel Blend', `${DOWNSTREAM_DETAIL.biofuel_blend_pct}%`, `${DOWNSTREAM_DETAIL.retail_sites.toLocaleString()} retail sites`)}
          </div>
          <h4 style={{ color: T.navy, fontSize: 13, marginBottom: 8 }}>EV Charging & Biofuel Buildout</h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={DOWNSTREAM_DETAIL.buildout}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="ev_chargers" fill={T.green} name="EV Chargers" radius={[4,4,0,0]} />
              <Line yAxisId="right" type="monotone" dataKey="biofuel_pct" stroke={T.amber} strokeWidth={2} name="Biofuel Blend %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Cross-Segment Metrics Comparison</h3>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Internal Carbon Price ($/tCO2):</label>
            <input type="range" min={20} max={200} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 200 }} />
            <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.navy }}>${carbonPrice}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Metric','Upstream','Midstream','Downstream','Total'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Metric' ? 'left' : 'right', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CROSS_SEGMENT.metrics.map(m => (
                  <tr key={m.metric} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 12px', fontWeight: 600 }}>{m.metric}</td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: T.mono }}>{m.Upstream}</td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: T.mono }}>{m.Midstream}</td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: T.mono }}>{m.Downstream}</td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: T.mono, fontWeight: 700 }}>{(m.Upstream + m.Midstream + m.Downstream).toFixed(1)}</td>
                  </tr>
                ))}
                <tr style={{ background: '#fef2f2' }}>
                  <td style={{ padding: '6px 12px', fontWeight: 700, color: T.red }}>Carbon Cost ($B)</td>
                  {['Upstream','Midstream','Downstream'].map(s => {
                    const cost = (SEGMENTS[s].emissions_mt * carbonPrice / 1000).toFixed(2);
                    return <td key={s} style={{ padding: '6px 12px', textAlign: 'right', fontFamily: T.mono, color: T.red }}>{cost}</td>;
                  })}
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: T.mono, fontWeight: 700, color: T.red }}>
                    {((SEGMENTS.Upstream.emissions_mt + SEGMENTS.Midstream.emissions_mt + SEGMENTS.Downstream.emissions_mt) * carbonPrice / 1000).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ padding: 12, background: T.bg, borderRadius: 8, fontSize: 12, color: T.textSec }}>
            <strong>Transfer Pricing Carbon Adj:</strong> ${CROSS_SEGMENT.transfer_pricing_adj}B internal carbon cost allocated at ${carbonPrice}/tCO2 across segments.
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Transition Readiness by Segment</h3>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={TRANSITION_RADAR} outerRadius={120}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 60]} tick={{ fontSize: 9 }} />
              <Tooltip />
              <Legend />
              {Object.entries(SEG_COLORS).map(([seg, color]) => (
                <Radar key={seg} name={seg} dataKey={seg} stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} />
              ))}
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
            {Object.entries(SEGMENTS).map(([name, data]) => (
              <div key={name} style={{ padding: 12, background: T.bg, borderRadius: 8, flex: '1 1 180px', border: `1px solid ${T.border}` }}>
                <div style={{ fontWeight: 700, color: SEG_COLORS[name], marginBottom: 6 }}>{name}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: data.transition_score > 50 ? T.green : data.transition_score > 30 ? T.amber : T.red }}>
                  {data.transition_score}/100
                </div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>
                  {data.transition_score > 50 ? 'On track' : data.transition_score > 30 ? 'Needs acceleration' : 'Significantly behind'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, padding: 14, background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 11, color: T.textMut }}>
        <strong>Data Sources:</strong> IEA World Energy Outlook 2025 | IOGP Production Benchmarks | Company segment disclosures.
        <span style={{ float: 'right', fontFamily: T.mono }}>EP-CU2 v1.0 | Segment Analysis</span>
      </div>
    </div>
  );
}
