import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line, Legend, Cell,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const PAT_TYPES = ['Corporate', 'University', 'Government', 'Startup'];
const PAT_COUNTRIES = ['USA', 'China', 'Japan', 'Germany', 'South Korea', 'France', 'UK', 'Canada', 'Netherlands', 'Sweden', 'India', 'Australia'];
const PAT_SECTORS = ['Energy', 'Technology', 'Industrial', 'Automotive', 'Materials', 'Agriculture'];
const TECH_FOCUSES = ['Solar', 'Wind', 'Storage', 'CCS', 'Hydrogen', 'EV', 'Grid', 'Adaptation'];

const TYPE_COLORS = { Corporate: T.blue, University: T.green, Government: T.amber, Startup: T.indigo };
const FOCUS_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#6b7280', '#10b981', '#ef4444', '#0891b2', '#84cc16'];

const FILERS = Array.from({ length: 80 }, (_, i) => {
  const type = PAT_TYPES[Math.floor(sr(i * 7) * PAT_TYPES.length)];
  const country = PAT_COUNTRIES[Math.floor(sr(i * 11) * PAT_COUNTRIES.length)];
  const sector = PAT_SECTORS[Math.floor(sr(i * 13) * PAT_SECTORS.length)];
  const technologyFocus = TECH_FOCUSES[Math.floor(sr(i * 17) * TECH_FOCUSES.length)];
  const patentsTotal = Math.round(50 + sr(i * 19) * 2950);
  const patentGrowthRate = parseFloat((-5 + sr(i * 23) * 55).toFixed(1));
  const greenPatentShare = parseFloat((10 + sr(i * 29) * 80).toFixed(1));
  const rdSpend = parseFloat((0.1 + sr(i * 31) * 14.9).toFixed(2));
  const citationIndex = parseFloat((1 + sr(i * 37) * 9).toFixed(1));
  const commercializationRate = parseFloat((5 + sr(i * 41) * 55).toFixed(1));
  const innovationScore = Math.round(20 + sr(i * 43) * 80);
  const corpNames = ['IBM', 'Samsung', 'TSMC', 'Siemens', 'GE', 'Bosch', 'Panasonic', 'LG', 'BASF', 'Dow Chemical',
    'Honeywell', 'ABB', 'Schneider', 'Eaton', 'Emerson', 'Corning', 'Linde', 'Air Products', 'Johnson Controls', 'Carrier',
    'Daikin', 'Mitsubishi', 'Hitachi', 'Toshiba', 'Kyocera', 'Sharp', 'Fujitsu', 'NEC', 'Ericsson', 'Nokia'];
  const uniNames = ['MIT', 'Stanford', 'ETH Zurich', 'Cambridge', 'Oxford', 'Caltech', 'TU Munich', 'Tsinghua',
    'Tokyo Univ', 'Seoul KAIST', 'RWTH Aachen', 'Delft', 'Imperial', 'EPFL', 'NTNU'];
  const govNames = ['NREL', 'Fraunhofer', 'AIST Japan', 'KERI Korea', 'CEA France', 'DLR Germany', 'CSIRO Australia'];
  const startupNames = ['QuantumSolar', 'WindAI', 'StorageX', 'CarbonIQ', 'H2Tech', 'GridML', 'ClimateOS', 'GreenIP'];
  const nameArr = type === 'Corporate' ? corpNames : type === 'University' ? uniNames : type === 'Government' ? govNames : startupNames;
  const name = nameArr[i % nameArr.length];
  return { id: i + 1, name, type, country, sector, technologyFocus, patentsTotal, patentGrowthRate, greenPatentShare, rdSpend, citationIndex, commercializationRate, innovationScore };
});

const FILING_TREND = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024].map((yr, i) => ({
  year: yr,
  solar: Math.round(8000 + i * 1200 + sr(i * 17) * 1000),
  wind: Math.round(4000 + i * 800 + sr(i * 23) * 600),
  storage: Math.round(3000 + i * 1400 + sr(i * 29) * 800),
  cev: Math.round(5000 + i * 1600 + sr(i * 31) * 900),
  hydrogen: Math.round(1500 + i * 1100 + sr(i * 37) * 700),
}));

const TABS = [
  'Patent Landscape', 'Technology Focus', 'R&D Investment', 'Citation Analysis',
  'Geographic Distribution', 'Commercialization', 'Innovation Leaders', 'Trend Analysis',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 22px', flex: 1, minWidth: 180 }}>
    <div style={{ fontSize: 12, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: color || T.navy, fontFamily: T.fontMono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function ClimatePatentIntelligencePage() {
  const [tab, setTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [focusFilter, setFocusFilter] = useState('All');
  const [minPatents, setMinPatents] = useState(0);
  const [minRd, setMinRd] = useState(0);

  const filtered = useMemo(() => FILERS.filter(f =>
    (typeFilter === 'All' || f.type === typeFilter) &&
    (countryFilter === 'All' || f.country === countryFilter) &&
    (focusFilter === 'All' || f.technologyFocus === focusFilter) &&
    f.patentsTotal >= minPatents &&
    f.rdSpend >= minRd
  ), [typeFilter, countryFilter, focusFilter, minPatents, minRd]);

  const totalPatents = filtered.reduce((s, f) => s + f.patentsTotal, 0);
  const avgGreenShare = filtered.length ? (filtered.reduce((s, f) => s + f.greenPatentShare, 0) / filtered.length).toFixed(1) : '0.0';
  const totalRd = filtered.reduce((s, f) => s + f.rdSpend, 0).toFixed(1);
  const avgInnovation = filtered.length ? Math.round(filtered.reduce((s, f) => s + f.innovationScore, 0) / filtered.length) : 0;

  const focusData = TECH_FOCUSES.map(tf => ({
    focus: tf,
    patents: filtered.filter(f => f.technologyFocus === tf).reduce((s, f) => s + f.patentsTotal, 0),
    count: filtered.filter(f => f.technologyFocus === tf).length,
  }));

  const rdScatter = filtered.map(f => ({ x: f.rdSpend, y: f.innovationScore, name: f.name, type: f.type, patents: f.patentsTotal }));

  const countryGrowth = PAT_COUNTRIES.map(cn => ({
    country: cn,
    growthRate: (() => {
      const fp = filtered.filter(f => f.country === cn);
      return fp.length ? parseFloat((fp.reduce((s, f) => s + f.patentGrowthRate, 0) / fp.length).toFixed(1)) : null;
    })(),
    patents: filtered.filter(f => f.country === cn).reduce((s, f) => s + f.patentsTotal, 0),
  })).filter(d => d.growthRate !== null).sort((a, b) => b.patents - a.patents).slice(0, 12);

  const commData = TECH_FOCUSES.map(tf => ({
    focus: tf,
    avgComm: (() => {
      const fp = filtered.filter(f => f.technologyFocus === tf);
      return fp.length ? parseFloat((fp.reduce((s, f) => s + f.commercializationRate, 0) / fp.length).toFixed(1)) : 0;
    })(),
    avgCitation: (() => {
      const fp = filtered.filter(f => f.technologyFocus === tf);
      return fp.length ? parseFloat((fp.reduce((s, f) => s + f.citationIndex, 0) / fp.length).toFixed(1)) : 0;
    })(),
  }));

  const leaders = [...filtered].sort((a, b) => b.innovationScore - a.innovationScore).slice(0, 12);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', padding: '28px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: T.navy }}>⚡ Climate Patent Intelligence</span>
          <span style={{ fontSize: 11, background: T.purple, color: '#fff', borderRadius: 4, padding: '2px 8px', fontWeight: 700 }}>EP-DF6</span>
        </div>
        <div style={{ fontSize: 13, color: T.textSec }}>80 patent filers · 8 technology domains · R&D investment, citation analysis & commercialisation intelligence</div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
        {[
          { label: 'Type', value: typeFilter, setter: setTypeFilter, opts: ['All', ...PAT_TYPES] },
          { label: 'Country', value: countryFilter, setter: setCountryFilter, opts: ['All', ...PAT_COUNTRIES] },
          { label: 'Tech Focus', value: focusFilter, setter: setFocusFilter, opts: ['All', ...TECH_FOCUSES] },
        ].map(({ label, value, setter, opts }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>{label}</span>
            <select value={value} onChange={e => setter(e.target.value)}
              style={{ fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', background: T.bg, color: T.textPri }}>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>Min Patents: {minPatents}</span>
          <input type="range" min={0} max={1000} step={50} value={minPatents} onChange={e => setMinPatents(+e.target.value)} style={{ width: 100 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>Min R&D: ${minRd}Bn</span>
          <input type="range" min={0} max={5} step={0.5} value={minRd} onChange={e => setMinRd(+e.target.value)} style={{ width: 100 }} />
        </div>
        <span style={{ fontSize: 12, color: T.textSec, alignSelf: 'center' }}>{filtered.length} filers</span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
        <KpiCard label="Total Climate Patents" value={totalPatents.toLocaleString()} sub="filtered portfolio" color={T.purple} />
        <KpiCard label="Avg Green Patent Share" value={`${avgGreenShare}%`} sub="of total patent portfolio" color={T.green} />
        <KpiCard label="Total R&D Spend" value={`$${totalRd}Bn`} sub="annual R&D investment" color={T.blue} />
        <KpiCard label="Avg Innovation Score" value={avgInnovation} sub="0–100 composite score" color={avgInnovation >= 60 ? T.green : T.amber} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: '7px 14px', borderRadius: 7, border: `1px solid ${tab === i ? T.purple : T.border}`, background: tab === i ? T.purple : T.card, color: tab === i ? '#fff' : T.textSec, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
        {tab === 0 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Patent Landscape — Top Filers</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Filer', 'Type', 'Country', 'Sector', 'Tech Focus', 'Total Patents', 'Green Share %', 'Growth %', 'R&D ($Bn)', 'Innovation'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...filtered].sort((a, b) => b.patentsTotal - a.patentsTotal).slice(0, 20).map((f, i) => (
                  <tr key={f.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '7px 10px', color: T.navy, fontWeight: 600 }}>{f.name}</td>
                    <td style={{ padding: '7px 10px' }}><span style={{ background: TYPE_COLORS[f.type] + '22', color: TYPE_COLORS[f.type], borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700 }}>{f.type}</span></td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{f.country}</td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{f.sector}</td>
                    <td style={{ padding: '7px 10px', color: T.teal, fontWeight: 600 }}>{f.technologyFocus}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: T.navy }}>{f.patentsTotal.toLocaleString()}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: f.greenPatentShare >= 50 ? T.green : T.amber }}>{f.greenPatentShare}%</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: f.patentGrowthRate > 0 ? T.green : T.red }}>{f.patentGrowthRate > 0 ? '+' : ''}{f.patentGrowthRate}%</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>${f.rdSpend}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 40, height: 5, background: T.border, borderRadius: 3 }}>
                          <div style={{ width: `${f.innovationScore}%`, height: 5, background: f.innovationScore >= 70 ? T.green : T.amber, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontFamily: T.fontMono, fontSize: 11 }}>{f.innovationScore}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 1 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Technology Focus — Patents by Domain</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={focusData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="focus" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip formatter={(v, n) => [n === 'patents' ? v.toLocaleString() : v, n === 'patents' ? 'Total Patents' : 'Filers']} />
                <Bar dataKey="patents" name="patents" radius={[4, 4, 0, 0]}>
                  {focusData.map((_, idx) => <Cell key={idx} fill={FOCUS_COLORS[idx % FOCUS_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 2 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>R&D Investment vs Innovation Score</div>
            <ResponsiveContainer width="100%" height={340}>
              <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="R&D Spend ($Bn)" label={{ value: 'R&D Spend ($Bn)', position: 'bottom', fontSize: 11, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis dataKey="y" name="Innovation Score" label={{ value: 'Innovation Score', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip formatter={(v, n) => [v, n]} />
                <Scatter data={rdScatter} fill={T.purple} fillOpacity={0.65} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Citation Analysis — Avg Citation Index by Technology</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={commData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="focus" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip />
                <Bar dataKey="avgCitation" name="Avg Citation Index" fill={T.indigo} radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgComm" name="Avg Commercialization %" fill={T.teal} radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 4 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Geographic Distribution — Patent Growth Rate by Country (Top 12)</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={countryGrowth} layout="vertical" margin={{ top: 10, right: 40, left: 90, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis type="category" dataKey="country" tick={{ fontSize: 10, fill: T.textSec }} width={90} />
                <Tooltip formatter={(v, n) => [n === 'growthRate' ? `${v}%` : v.toLocaleString(), n === 'growthRate' ? 'Growth Rate' : 'Total Patents']} />
                <Bar dataKey="growthRate" name="growthRate" radius={[0, 4, 4, 0]}>
                  {countryGrowth.map((d, idx) => <Cell key={idx} fill={d.growthRate >= 15 ? T.green : d.growthRate >= 5 ? T.blue : d.growthRate >= 0 ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 5 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Commercialization — Rate by Technology Domain</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={commData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="focus" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} unit="%" />
                <Tooltip formatter={(v) => [`${v}%`, 'Commercialization Rate']} />
                <Bar dataKey="avgComm" name="Avg Commercialization Rate" radius={[4, 4, 0, 0]}>
                  {commData.map((d, idx) => <Cell key={idx} fill={d.avgComm >= 30 ? T.green : d.avgComm >= 15 ? T.blue : T.amber} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 6 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Innovation Leaders — Top 12 by Score</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {leaders.map((f, i) => (
                <div key={f.id} style={{ background: T.sub, border: `1px solid ${i < 3 ? T.purple + '66' : T.border}`, borderRadius: 8, padding: '14px 16px', position: 'relative' }}>
                  {i < 3 && <div style={{ position: 'absolute', top: 8, right: 8, background: T.purple, color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>#{i + 1}</div>}
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 10 }}>{f.type} · {f.country} · {f.technologyFocus}</div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: T.textSec }}>Innovation</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: f.innovationScore >= 70 ? T.green : T.amber, fontFamily: T.fontMono }}>{f.innovationScore}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: T.textSec }}>Patents</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: T.navy, fontFamily: T.fontMono }}>{f.patentsTotal.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: T.textSec }}>R&D</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: T.blue, fontFamily: T.fontMono }}>${f.rdSpend}Bn</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 10, color: T.green, fontFamily: T.fontMono }}>Green: {f.greenPatentShare}%</span>
                    <span style={{ fontSize: 10, color: T.indigo, fontFamily: T.fontMono }}>Citation: {f.citationIndex}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 7 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Trend Analysis — Climate Patent Filings by Year (2015–2024)</div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={FILING_TREND} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip formatter={(v) => [v.toLocaleString(), 'Filings']} />
                <Line type="monotone" dataKey="solar" name="Solar" stroke={T.amber} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="wind" name="Wind" stroke={T.blue} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="storage" name="Storage" stroke={T.green} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="cev" name="EV" stroke={T.orange} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="hydrogen" name="Hydrogen" stroke={T.teal} strokeWidth={2} dot={{ r: 3 }} />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
