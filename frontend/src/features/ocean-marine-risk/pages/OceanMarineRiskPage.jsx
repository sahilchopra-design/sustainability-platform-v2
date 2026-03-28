import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7',
  border:'#e5e0d8', borderL:'#d5cfc5',
  navy:'#1b3a5c', navyL:'#2c5a8c',
  gold:'#c5a96a', goldL:'#d4be8a',
  sage:'#5a8a6a', sageL:'#7ba67d', teal:'#5a8a6a',
  text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706',
  card:'0 1px 4px rgba(27,58,92,0.06)',
  cardH:'0 4px 16px rgba(27,58,92,0.1)',
  font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

const tip = {
  contentStyle: { background: T.surface, border: '1px solid ' + T.border, borderRadius: 8, color: T.text },
  labelStyle: { color: T.textSec }
};

const REGIONS = [
  { name: 'Arctic', tempAnomaly: '+2.4', pH: '8.02', biodiversity: 62, exposure: 180 },
  { name: 'North Atlantic', tempAnomaly: '+1.1', pH: '8.08', biodiversity: 74, exposure: 620 },
  { name: 'Mediterranean', tempAnomaly: '+1.8', pH: '8.04', biodiversity: 68, exposure: 940 },
  { name: 'Indian Ocean', tempAnomaly: '+1.3', pH: '8.06', biodiversity: 81, exposure: 520 },
  { name: 'South Pacific', tempAnomaly: '+0.9', pH: '8.10', biodiversity: 88, exposure: 310 },
  { name: 'Coral Triangle', tempAnomaly: '+1.6', pH: '8.03', biodiversity: 94, exposure: 270 },
  { name: 'Gulf of Mexico', tempAnomaly: '+1.4', pH: '8.05', biodiversity: 72, exposure: 480 },
  { name: 'Southern Ocean', tempAnomaly: '+1.7', pH: '8.01', biodiversity: 57, exposure: 90 },
];

const HEAT_TREND = Array.from({ length: 24 }, (_, i) => ({
  month: `M${i + 1}`,
  content: +(280 + sr(i * 3) * 40 + i * 1.8).toFixed(1),
  anomaly: +(0.6 + sr(i * 7) * 0.8).toFixed(2),
}));

const COASTAL_CITIES = [
  { city: 'Miami', current: 420, risk2050: 680, adaptation: 38, resilience: 52 },
  { city: 'Shanghai', current: 1240, risk2050: 1890, adaptation: 120, resilience: 61 },
  { city: 'Jakarta', current: 380, risk2050: 720, adaptation: 45, resilience: 38 },
  { city: 'Mumbai', current: 560, risk2050: 940, adaptation: 62, resilience: 44 },
  { city: 'Amsterdam', current: 290, risk2050: 410, adaptation: 28, resilience: 77 },
  { city: 'New Orleans', current: 180, risk2050: 340, adaptation: 22, resilience: 49 },
  { city: 'Ho Chi Minh', current: 320, risk2050: 610, adaptation: 41, resilience: 41 },
  { city: 'Alexandria', current: 210, risk2050: 490, adaptation: 35, resilience: 36 },
];

const ECOSYSTEMS = [
  { name: 'Coral Reefs', coverage: 284, degradation: 50, services: 9.9, protected: 27 },
  { name: 'Seagrass', coverage: 300, degradation: 35, services: 1.9, protected: 18 },
  { name: 'Kelp Forests', coverage: 25, degradation: 40, services: 0.8, protected: 12 },
  { name: 'Deep Sea', coverage: 33600, degradation: 15, services: 1.4, protected: 4 },
  { name: 'Mangroves', coverage: 150, degradation: 38, services: 1.6, protected: 22 },
  { name: 'Polar Seas', coverage: 14000, degradation: 28, services: 2.1, protected: 9 },
];

const CHOKEPOINTS = [
  { name: 'Strait of Hormuz', tradeValue: 1.7, vulnerability: 82, disruption: 18, rerouting: 4.2 },
  { name: 'Suez Canal', tradeValue: 9.5, vulnerability: 67, disruption: 14, rerouting: 7.8 },
  { name: 'Strait of Malacca', tradeValue: 5.3, vulnerability: 58, disruption: 11, rerouting: 5.1 },
  { name: 'Panama Canal', tradeValue: 4.2, vulnerability: 71, disruption: 22, rerouting: 6.4 },
  { name: 'Bab el-Mandeb', tradeValue: 4.7, vulnerability: 76, disruption: 19, rerouting: 5.9 },
  { name: 'Danish Straits', tradeValue: 2.1, vulnerability: 44, disruption: 8, rerouting: 2.3 },
];

const SHIPPING_INDEX = Array.from({ length: 24 }, (_, i) => ({
  month: `M${i + 1}`,
  index: +(100 + sr(i * 5) * 60 + (i > 14 ? (i - 14) * 3.5 : 0)).toFixed(1),
}));

const REGULATIONS = [
  { name: 'BBNJ Treaty', status: 'Ratification', jurisdiction: 'Global', scope: 'High Seas', obligation: 'Area-based management tools & EIAs for ABNJ', date: '2025' },
  { name: 'EU Maritime Spatial Planning', status: 'Active', jurisdiction: 'EU Waters', scope: 'Coastal & offshore', obligation: 'Cross-border MSP by 2021, updated plans 2026', date: '2026' },
  { name: 'IMO 2050 Strategy', status: 'In Force', jurisdiction: 'International Shipping', scope: 'GHG emissions', obligation: 'Net-zero GHG by 2050; 20% cut by 2030', date: '2030' },
  { name: 'UN SDG 14', status: 'Voluntary', jurisdiction: 'UN Member States', scope: 'Ocean health', obligation: 'Reduce pollution, protect 10% coastal/marine areas', date: '2030' },
  { name: 'OSPAR Convention', status: 'Active', jurisdiction: 'NE Atlantic', scope: 'Marine protection', obligation: 'Marine protected areas network; zero harmful substances', date: '2030' },
  { name: "Kunming-Montreal (Target 3)", status: 'Agreed', jurisdiction: 'CBD Parties', scope: 'Biodiversity', obligation: '30x30 — protect 30% oceans by 2030', date: '2030' },
];

const statCard = (label, value, sub) => (
  <div key={label} style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ color: T.teal, fontSize: 22, fontWeight: 700 }}>{value}</div>
    <div style={{ color: T.text, fontSize: 13, marginTop: 4 }}>{label}</div>
    {sub && <div style={{ color: T.textMut, fontSize: 11, marginTop: 2 }}>{sub}</div>}
  </div>
);

const cellColor = val => val > 500 ? T.red : val > 200 ? T.amber : T.teal;

export default function OceanMarineRiskPage() {
  const [tab, setTab] = useState(0);
  const tabs = ['Overview', 'Sea Level & Coastal', 'Marine Biodiversity', 'Shipping & Trade', 'Blue Economy Regulation'];

  const tableHead = { color: T.textSec, fontSize: 11, padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid ' + T.border, textTransform: 'uppercase' };
  const tableCell = { color: T.text, fontSize: 12, padding: '8px 10px', borderBottom: '1px solid ' + T.border };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, padding: '24px 28px', color: T.text }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>Ocean & Marine Risk Analytics</div>
        <div style={{ color: T.textSec, fontSize: 13, marginTop: 4 }}>EP-AC4 — Blue economy exposure, sea-level risk, biodiversity & shipping disruption</div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid ' + T.border, marginBottom: 24 }}>
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '10px 16px', fontSize: 13, fontWeight: 500,
            color: tab === i ? T.teal : T.textSec,
            borderBottom: tab === i ? '2px solid ' + T.teal : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>

      {/* TAB 0 — Overview */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            {statCard('Ocean Warming', '1.2°C', 'Above pre-industrial baseline')}
            {statCard('Blue Economy', '$2.5T', 'Annual GDP at risk')}
            {statCard('Reefs Bleached', '40%', 'Global coral coverage loss')}
            {statCard('BBNJ Treaty', '2025', 'Ratification target year')}
          </div>
          <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: 10, padding: 16, marginBottom: 24, overflowX: 'auto' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Ocean Region Risk Matrix</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Region', 'Temp Anomaly', 'Acidification pH', 'Biodiversity Index', 'Economic Exposure ($bn)'].map(h => (
                    <th key={h} style={tableHead}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REGIONS.map(r => (
                  <tr key={r.name}>
                    <td style={{ ...tableCell, fontWeight: 600, color: T.teal }}>{r.name}</td>
                    <td style={{ ...tableCell, color: T.red }}>{r.tempAnomaly}°C</td>
                    <td style={tableCell}>{r.pH}</td>
                    <td style={tableCell}>{r.biodiversity}</td>
                    <td style={tableCell}>${r.exposure}bn</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>24-Month Ocean Heat Content Trend (ZJ)</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={HEAT_TREND}>
                <defs>
                  <linearGradient id="heatGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.teal} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={T.teal} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" stroke={T.textMut} tick={{ fontSize: 10 }} />
                <YAxis stroke={T.textMut} tick={{ fontSize: 10 }} />
                <Tooltip {...tip} />
                <Area type="monotone" dataKey="content" stroke={T.teal} fill="url(#heatGrad)" strokeWidth={2} dot={false} name="Heat Content (ZJ)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 1 — Sea Level & Coastal */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            {statCard('Global Coastal Assets', '$14.2T', 'Total assets at risk by 2050')}
            {statCard('Population Exposed', '1B+', 'People in flood-prone zones')}
            {statCard('Adaptation Finance Gap', '$400bn/yr', 'Annual shortfall vs. need')}
          </div>
          <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: 10, padding: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>2050 Coastal Risk by City ($bn)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={COASTAL_CITIES} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="city" stroke={T.textMut} tick={{ fontSize: 10 }} />
                <YAxis stroke={T.textMut} tick={{ fontSize: 10 }} />
                <Tooltip {...tip} />
                <Bar dataKey="risk2050" name="2050 Risk ($bn)" radius={[4, 4, 0, 0]}>
                  {COASTAL_CITIES.map((c, i) => (
                    <Cell key={i} fill={cellColor(c.risk2050)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: 10, padding: 16, overflowX: 'auto' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Coastal City Exposure Detail</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['City', 'Current ($bn)', '2050 Risk ($bn)', 'Adaptation Cost ($bn)', 'Resilience Score'].map(h => (
                    <th key={h} style={tableHead}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COASTAL_CITIES.map(c => (
                  <tr key={c.city}>
                    <td style={{ ...tableCell, fontWeight: 600, color: T.teal }}>{c.city}</td>
                    <td style={tableCell}>${c.current}bn</td>
                    <td style={{ ...tableCell, color: c.risk2050 > 500 ? T.red : T.amber }}>${c.risk2050}bn</td>
                    <td style={tableCell}>${c.adaptation}bn</td>
                    <td style={{ ...tableCell, color: c.resilience > 65 ? T.green : c.resilience > 45 ? T.amber : T.red }}>{c.resilience}/100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2 — Marine Biodiversity */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            {statCard('BBNJ Signatories', '87 Nations', 'As of March 2025')}
            {statCard('High Seas Protected', '1.2%', 'Target: 30% by 2030')}
            {statCard('MPA Coverage', '8.1%', 'Of global ocean area')}
          </div>
          <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: 10, padding: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Ecosystem Services Value ($T/yr)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ECOSYSTEMS} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" stroke={T.textMut} tick={{ fontSize: 10 }} />
                <YAxis stroke={T.textMut} tick={{ fontSize: 10 }} />
                <Tooltip {...tip} />
                <Bar dataKey="services" name="Services Value ($T/yr)" fill={T.teal} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: 10, padding: 16, overflowX: 'auto' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Marine Ecosystem Health</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Ecosystem', 'Coverage (Mha)', 'Degradation %', 'Services Value ($T/yr)', 'Protected Area %'].map(h => (
                    <th key={h} style={tableHead}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ECOSYSTEMS.map(e => (
                  <tr key={e.name}>
                    <td style={{ ...tableCell, fontWeight: 600, color: T.teal }}>{e.name}</td>
                    <td style={tableCell}>{e.coverage.toLocaleString()}</td>
                    <td style={{ ...tableCell, color: e.degradation > 40 ? T.red : T.amber }}>{e.degradation}%</td>
                    <td style={tableCell}>${e.services}T</td>
                    <td style={{ ...tableCell, color: e.protected > 20 ? T.green : T.amber }}>{e.protected}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3 — Shipping & Trade */}
      {tab === 3 && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            {statCard('Total Trade at Risk', '$27.5T/yr', 'Via critical chokepoints')}
            {statCard('Insurance Cost Impact', '+$18bn', 'Climate premium increase')}
            {statCard('Rerouting Carbon', '+12%', 'GHG from extended voyages')}
          </div>
          <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: 10, padding: 16, marginBottom: 24, overflowX: 'auto' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Critical Chokepoint Risk Matrix</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Chokepoint', 'Daily Trade ($bn)', 'Climate Vulnerability', 'Disruption Prob %', 'Rerouting Cost ($bn)'].map(h => (
                    <th key={h} style={tableHead}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CHOKEPOINTS.map(c => (
                  <tr key={c.name}>
                    <td style={{ ...tableCell, fontWeight: 600, color: T.teal }}>{c.name}</td>
                    <td style={tableCell}>${c.tradeValue}bn</td>
                    <td style={{ ...tableCell, color: c.vulnerability > 70 ? T.red : c.vulnerability > 55 ? T.amber : T.green }}>{c.vulnerability}/100</td>
                    <td style={{ ...tableCell, color: c.disruption > 15 ? T.red : T.amber }}>{c.disruption}%</td>
                    <td style={tableCell}>${c.rerouting}bn</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>24-Month Shipping Disruption Index</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={SHIPPING_INDEX}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" stroke={T.textMut} tick={{ fontSize: 10 }} />
                <YAxis stroke={T.textMut} tick={{ fontSize: 10 }} />
                <Tooltip {...tip} />
                <Line type="monotone" dataKey="index" stroke={T.teal} strokeWidth={2} dot={false} name="Disruption Index" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 4 — Blue Economy Regulation */}
      {tab === 4 && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            {statCard('High Seas Protected', '1.2% → 30%', 'Current vs. 2030 target')}
            {statCard('MPA Count', '18,000+', 'Marine protected areas globally')}
            {statCard('Blue Bond Issuance', '$5.2bn', 'Cumulative to 2025')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {REGULATIONS.map(reg => (
              <div key={reg.name} style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{reg.name}</div>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
                    background: reg.status === 'Active' || reg.status === 'In Force' ? T.green + '22' : T.teal + '22',
                    color: reg.status === 'Active' || reg.status === 'In Force' ? T.green : T.teal,
                    border: '1px solid ' + (reg.status === 'Active' || reg.status === 'In Force' ? T.green : T.teal),
                    whiteSpace: 'nowrap'
                  }}>{reg.status}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                  <div>
                    <div style={{ color: T.textMut, fontSize: 10 }}>Jurisdiction</div>
                    <div style={{ color: T.textSec, fontSize: 12 }}>{reg.jurisdiction}</div>
                  </div>
                  <div>
                    <div style={{ color: T.textMut, fontSize: 10 }}>Scope</div>
                    <div style={{ color: T.textSec, fontSize: 12 }}>{reg.scope}</div>
                  </div>
                  <div>
                    <div style={{ color: T.textMut, fontSize: 10 }}>Implementation</div>
                    <div style={{ color: T.teal, fontSize: 12, fontWeight: 600 }}>{reg.date}</div>
                  </div>
                </div>
                <div style={{ background: T.bg, borderRadius: 6, padding: '8px 10px' }}>
                  <div style={{ color: T.textMut, fontSize: 10, marginBottom: 2 }}>Key Obligation</div>
                  <div style={{ color: T.text, fontSize: 12 }}>{reg.obligation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
