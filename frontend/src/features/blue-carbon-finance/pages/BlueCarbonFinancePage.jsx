import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Legend,
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const ECO_TYPES = ['Mangrove', 'Seagrass', 'Saltmarsh', 'Kelp Forest'];
const REGIONS = ['Southeast Asia', 'Caribbean', 'Pacific Islands', 'East Africa', 'West Africa', 'Latin America', 'South Asia', 'Mediterranean'];
const STANDARDS = ['VCS', 'Gold Standard', 'Plan Vivo'];
const COBENEFITS = ['Biodiversity', 'Fisheries', 'Coastal Protection', 'Tourism'];

const PROJECT_NAMES = [
  'Borneo Mangrove Restoration', 'Indonesian Blue Carbon', 'Philippines Seagrass Initiative', 'Vietnam Coastal Resilience',
  'Thailand Mangrove Shield', 'Myanmar Delta Restore', 'Bangladesh Sundarbans', 'Sri Lanka Lagoon',
  'Belize Barrier Reef', 'Jamaica Blue Initiative', 'Cuba Mangrove Arc', 'Dominican Republic Seagrass',
  'Fiji Blue Carbon', 'Palau Ocean Project', 'Solomon Islands Mangrove', 'PNG Coastal Restore',
  'Vanuatu Blue Shield', 'Tonga Seagrass Project', 'Kenya Coastal Finance', 'Tanzania Mangrove Finance',
  'Mozambique Blue Initiative', 'Madagascar Coastal Carbon', 'Seychelles Blue Economy', 'Comoros Restoration',
  'Senegal Mangrove Belt', 'Guinea-Bissau Coastal', 'Sierra Leone Estuary', 'Ghana Blue Carbon',
  'Brazil Mangrove Fund', 'Colombia Caribbean Blue', 'Ecuador Coastal Restore', 'Peru Mangrove Project',
  'Mexico Yucatan Seagrass', 'Costa Rica Blue Carbon', 'Panama Mangrove Finance', 'Honduras Gulf Blue',
  'India Sundarbans Plus', 'Bangladesh Coastal Plus', 'Pakistan Mangrove Karachi', 'Maldives Seagrass',
  'Spain Posidonia Project', 'Greece Aegean Blue', 'Turkey Aegean Seagrass', 'Italy Adriatic Carbon',
  'California Kelp Forest', 'Oregon Coastal Carbon', 'Washington Seagrass', 'Alaska Kelp Initiative',
  'Norway Kelp Carbon', 'UK Saltmarsh Restore', 'Ireland Blue Carbon', 'France Atlantic Blue',
  'Australia Great Barrier', 'New Zealand Seagrass', 'Chile Kelp Carbon',
];

const PROJECTS = Array.from({ length: 55 }, (_, i) => {
  const type = ECO_TYPES[i % ECO_TYPES.length];
  const region = REGIONS[i % REGIONS.length];
  const standard = STANDARDS[Math.floor(sr(i * 7) * 3)];
  const cobenefit = COBENEFITS[Math.floor(sr(i * 11) * 4)];
  const areaHa = Math.round(500 + sr(i * 3) * 49500);
  const seq = +(1 + sr(i * 13) * 9).toFixed(2);
  return {
    id: i,
    name: PROJECT_NAMES[i] || `Blue Carbon Project ${i + 1}`,
    type,
    country: region.split(' ').pop(),
    region,
    areaHa,
    carbonSequestration: seq,
    creditsIssued: +(areaHa * seq * 0.001).toFixed(2),
    creditPrice: +(8 + sr(i * 17) * 42).toFixed(1),
    projectValue: +(0.5 + sr(i * 19) * 49.5).toFixed(1),
    cobenefits: cobenefit,
    verificationStandard: standard,
    additionality: +(3 + sr(i * 23) * 7).toFixed(1),
    permanenceRisk: +(1 + sr(i * 29) * 9).toFixed(1),
  };
});

const TABS = [
  'Project Overview', 'Ecosystem Types', 'Sequestration Analytics', 'Credit Market',
  'Co-Benefits', 'Verification Standards', 'Permanence Risk', 'Investment Pipeline',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const ECO_COLORS = { Mangrove: '#16a34a', Seagrass: '#0f766e', Saltmarsh: '#65a30d', 'Kelp Forest': '#0369a1' };

export default function BlueCarbonFinancePage() {
  const [tab, setTab] = useState(0);
  const [filterType, setFilterType] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterStandard, setFilterStandard] = useState('All');
  const [carbonPrice, setCarbonPrice] = useState(25);
  const [areaExpansion, setAreaExpansion] = useState(0.5);

  const filtered = useMemo(() => PROJECTS.filter(p =>
    (filterType === 'All' || p.type === filterType) &&
    (filterRegion === 'All' || p.region === filterRegion) &&
    (filterStandard === 'All' || p.verificationStandard === filterStandard)
  ), [filterType, filterRegion, filterStandard]);

  const totalAreaMha = (filtered.reduce((a, p) => a + p.areaHa, 0) / 1e6).toFixed(2);
  const totalCredits = filtered.reduce((a, p) => a + p.creditsIssued, 0).toFixed(1);
  const avgCreditPrice = filtered.length
    ? (filtered.reduce((a, p) => a + p.creditPrice, 0) / filtered.length).toFixed(1)
    : '0.0';
  const totalProjectValue = filtered.reduce((a, p) => a + p.projectValue, 0).toFixed(1);

  const seqByType = ECO_TYPES.map(t => {
    const ps = filtered.filter(p => p.type === t);
    return {
      type: t,
      avgSeq: ps.length ? +(ps.reduce((a, p) => a + p.carbonSequestration, 0) / ps.length).toFixed(2) : 0,
    };
  });

  const priceByStandard = STANDARDS.map(s => {
    const ps = filtered.filter(p => p.verificationStandard === s);
    return {
      standard: s,
      avgPrice: ps.length ? +(ps.reduce((a, p) => a + p.creditPrice, 0) / ps.length).toFixed(1) : 0,
    };
  });

  const cobenefitData = COBENEFITS.map(cb => ({
    cobenefit: cb,
    count: filtered.filter(p => p.cobenefits === cb).length,
    value: +filtered.filter(p => p.cobenefits === cb).reduce((a, p) => a + p.projectValue, 0).toFixed(1),
  }));

  const scatterData = filtered.map(p => ({
    x: +(p.areaHa / 1000).toFixed(1),
    y: +p.creditsIssued.toFixed(2),
    name: p.name,
  }));

  const permanenceData = filtered.slice(0, 20).map(p => ({
    name: p.name.split(' ').slice(0, 3).join(' '),
    permanenceRisk: +p.permanenceRisk.toFixed(1),
    additionality: +p.additionality.toFixed(1),
  }));

  const pipelineData = filtered.slice(0, 15).map(p => ({
    name: p.name.split(' ').slice(0, 3).join(' '),
    value: +p.projectValue.toFixed(1),
    credits: +(p.creditsIssued * carbonPrice).toFixed(1),
  }));

  const sel = { background: T.teal, color: '#fff', border: `1px solid ${T.teal}` };
  const unsel = { background: T.card, color: T.textPri, border: `1px solid ${T.border}` };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '24px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, letterSpacing: 2, marginBottom: 6 }}>
              EP-DJ2 · OCEAN, SHIPPING & BLUE ECONOMY
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#fff' }}>Blue Carbon Finance</h1>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>55 Projects · Mangroves/Seagrass/Saltmarsh/Kelp · Credit Market · VCS/Gold Standard</div>
          </div>
          <div style={{ textAlign: 'right', color: '#94a3b8', fontSize: 11, fontFamily: T.fontMono }}>
            <div>Carbon Price: ${carbonPrice}/tCO₂</div>
            <div>Area Expansion: {areaExpansion}Mha</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, fontSize: 13 }}>
            <option value="All">All Ecosystem Types</option>
            {ECO_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)}
            style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, fontSize: 13 }}>
            <option value="All">All Regions</option>
            {REGIONS.map(r => <option key={r}>{r}</option>)}
          </select>
          <select value={filterStandard} onChange={e => setFilterStandard(e.target.value)}
            style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, fontSize: 13 }}>
            <option value="All">All Standards</option>
            {STANDARDS.map(s => <option key={s}>{s}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Carbon Price: <strong>${carbonPrice}</strong></label>
            <input type="range" min={5} max={150} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 100 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Area Exp: <strong>{areaExpansion}Mha</strong></label>
            <input type="range" min={0.1} max={5} step={0.1} value={areaExpansion} onChange={e => setAreaExpansion(+e.target.value)} style={{ width: 100 }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <KpiCard label="Total Area" value={`${totalAreaMha}Mha`} sub="blue carbon habitat" color={T.teal} />
          <KpiCard label="Total Credits Issued" value={`${totalCredits}kt`} sub="ktCO₂/yr" color={T.green} />
          <KpiCard label="Avg Credit Price" value={`$${avgCreditPrice}`} sub="per tCO₂" color={T.amber} />
          <KpiCard label="Total Project Value" value={`$${totalProjectValue}M`} sub="investment pipeline" color={T.blue} />
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              style={{ padding: '7px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, ...(tab === i ? sel : unsel) }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 320, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Sequestration by Ecosystem Type (tCO₂/ha/yr)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={seqByType}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="avgSeq" fill={T.teal} radius={[4, 4, 0, 0]} name="Avg Sequestration" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 2, minWidth: 320, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Area (kha) vs Credits Issued (ktCO₂/yr)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="x" name="Area (kha)" tick={{ fontSize: 11 }} label={{ value: 'Area (kha)', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                    <YAxis dataKey="y" name="Credits (kt)" tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={scatterData} fill={T.green} opacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Project', 'Type', 'Region', 'Area (ha)', 'Seq (tCO₂/ha/yr)', 'Credits (kt/yr)', 'Price ($/t)', 'Standard', 'Additionality'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, fontSize: 11, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 20).map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 500 }}>{p.name}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: (ECO_COLORS[p.type] || T.teal) + '22', color: ECO_COLORS[p.type] || T.teal, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{p.type}</span>
                      </td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{p.region}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{p.areaHa.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{p.carbonSequestration}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{p.creditsIssued}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>${p.creditPrice}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{p.verificationStandard}</td>
                      <td style={{ padding: '8px 12px', color: p.additionality >= 7 ? T.green : p.additionality >= 5 ? T.amber : T.red, fontWeight: 600 }}>
                        {p.additionality}/10
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 340, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Average Sequestration by Ecosystem (tCO₂/ha/yr)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={seqByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="avgSeq" fill={T.teal} radius={[6, 6, 0, 0]} name="Avg Seq (tCO₂/ha/yr)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              {ECO_TYPES.map(t => {
                const ps = filtered.filter(p => p.type === t);
                const area = ps.reduce((a, p) => a + p.areaHa, 0);
                const avgSeq = ps.length ? (ps.reduce((a, p) => a + p.carbonSequestration, 0) / ps.length).toFixed(2) : '0';
                return (
                  <div key={t} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 20px', marginBottom: 10, borderLeft: `4px solid ${ECO_COLORS[t] || T.teal}` }}>
                    <div style={{ fontWeight: 600, color: ECO_COLORS[t] || T.teal }}>{t}</div>
                    <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>
                      {ps.length} projects · {(area / 1000).toFixed(0)}k ha · {avgSeq} tCO₂/ha/yr
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 340, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Area vs Credits Issued</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Area (kha)" tick={{ fontSize: 11 }} label={{ value: 'Area (kha)', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                  <YAxis dataKey="y" name="Credits (kt/yr)" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [v, n]} />
                  <Scatter data={scatterData} fill={T.green} opacity={0.65} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 260, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Sequestration Summary</div>
              {ECO_TYPES.map(t => {
                const ps = filtered.filter(p => p.type === t);
                const total = ps.reduce((a, p) => a + p.creditsIssued, 0).toFixed(1);
                return (
                  <div key={t} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: ECO_COLORS[t] || T.teal, fontWeight: 600 }}>{t}</span>
                      <span style={{ fontFamily: T.fontMono }}>{total} kt/yr</span>
                    </div>
                    <div style={{ height: 6, background: T.border, borderRadius: 3 }}>
                      <div style={{ width: `${Math.min(100, (+total / (+totalCredits || 1)) * 100)}%`, height: '100%', background: ECO_COLORS[t] || T.teal, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 3 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Credit Price by Verification Standard ($/tCO₂)</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={priceByStandard}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="standard" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="avgPrice" fill={T.gold} radius={[4, 4, 0, 0]} name="Avg Credit Price ($/t)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {STANDARDS.map(s => {
                const ps = filtered.filter(p => p.verificationStandard === s);
                const revenue = ps.reduce((a, p) => a + p.creditsIssued * p.creditPrice, 0).toFixed(0);
                return (
                  <div key={s} style={{ flex: 1, minWidth: 180, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px' }}>
                    <div style={{ fontSize: 12, color: T.textSec }}>{s}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: T.gold }}>{ps.length} projects</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>Market rev: ${(+revenue / 1000).toFixed(1)}M/yr</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 340, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Co-Benefits by Project Count & Value</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cobenefitData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="cobenefit" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill={T.sage} radius={[3, 3, 0, 0]} name="Project Count" />
                  <Bar dataKey="value" fill={T.blue} radius={[3, 3, 0, 0]} name="Total Value ($M)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              {COBENEFITS.map(cb => {
                const ps = filtered.filter(p => p.cobenefits === cb);
                return (
                  <div key={cb} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: 10 }}>
                    <div style={{ fontWeight: 600, color: T.sage, marginBottom: 4 }}>{cb}</div>
                    <div style={{ fontSize: 12, color: T.textSec }}>{ps.length} projects</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 340, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Credit Price by Verification Standard</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={priceByStandard}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="standard" tick={{ fontSize: 13 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="avgPrice" fill={T.indigo} radius={[6, 6, 0, 0]} name="Avg Price ($/tCO₂)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              {STANDARDS.map(s => {
                const ps = filtered.filter(p => p.verificationStandard === s);
                const avgAdd = ps.length ? (ps.reduce((a, p) => a + p.additionality, 0) / ps.length).toFixed(1) : '—';
                const avgPerm = ps.length ? (ps.reduce((a, p) => a + p.permanenceRisk, 0) / ps.length).toFixed(1) : '—';
                return (
                  <div key={s} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: 10 }}>
                    <div style={{ fontWeight: 600, color: T.indigo, marginBottom: 6 }}>{s}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.textSec }}>
                      <span>Additionality: <strong>{avgAdd}/10</strong></span>
                      <span>Perm. Risk: <strong>{avgPerm}/10</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 6 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Permanence Risk & Additionality (Top 20)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={permanenceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="permanenceRisk" fill={T.red} radius={[3, 3, 0, 0]} name="Permanence Risk" />
                  <Bar dataKey="additionality" fill={T.green} radius={[3, 3, 0, 0]} name="Additionality" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Project', 'Type', 'Standard', 'Additionality', 'Permanence Risk', 'Credit Price', 'Credits (kt/yr)', 'Value'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, fontSize: 11, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filtered].sort((a, b) => b.permanenceRisk - a.permanenceRisk).slice(0, 15).map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 500 }}>{p.name}</td>
                      <td style={{ padding: '8px 12px', color: ECO_COLORS[p.type] || T.teal, fontWeight: 600 }}>{p.type}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{p.verificationStandard}</td>
                      <td style={{ padding: '8px 12px', color: p.additionality >= 7 ? T.green : p.additionality >= 5 ? T.amber : T.red, fontWeight: 600 }}>{p.additionality}/10</td>
                      <td style={{ padding: '8px 12px', color: p.permanenceRisk >= 7 ? T.red : p.permanenceRisk >= 4 ? T.amber : T.green, fontWeight: 600 }}>{p.permanenceRisk}/10</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>${p.creditPrice}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{p.creditsIssued}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>${p.projectValue}M</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 7 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Investment Pipeline — Project Value & Revenue Potential (Carbon: ${carbonPrice}/t)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill={T.teal} radius={[3, 3, 0, 0]} name="Project Value ($M)" />
                  <Bar dataKey="credits" fill={T.amber} radius={[3, 3, 0, 0]} name="Annual Revenue ($K)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px' }}>
                <div style={{ fontSize: 12, color: T.textSec }}>Total Pipeline Value</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.teal }}>${totalProjectValue}M</div>
              </div>
              <div style={{ flex: 1, minWidth: 180, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px' }}>
                <div style={{ fontSize: 12, color: T.textSec }}>Annual Credit Revenue</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.amber }}>${(filtered.reduce((a, p) => a + p.creditsIssued * carbonPrice, 0) / 1000).toFixed(1)}M</div>
              </div>
              <div style={{ flex: 1, minWidth: 180, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px' }}>
                <div style={{ fontSize: 12, color: T.textSec }}>Expansion Potential ({areaExpansion}Mha)</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.green }}>
                  +{(areaExpansion * 1e6 * (filtered.length ? filtered.reduce((a, p) => a + p.carbonSequestration, 0) / filtered.length : 0) * carbonPrice / 1e6).toFixed(1)}M
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
