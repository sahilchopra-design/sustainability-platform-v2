import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';

/* ── PRNG ── */
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ── Theme ── */
const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

/* ── Data ── */
const TYPES = ['Pension Fund','Insurance','Sovereign Wealth Fund','Endowment'];
const COUNTRIES = ['USA','UK','Canada','Netherlands','Norway','Japan','Australia','Singapore','Germany','France'];

const INVESTORS = Array.from({ length: 55 }, (_, i) => {
  const type = TYPES[Math.floor(sr(i * 7) * TYPES.length)];
  const country = COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];
  const aum = parseFloat((5 + sr(i * 13) * 995).toFixed(1));
  const climateRiskIntegration = parseFloat((1 + sr(i * 17) * 9).toFixed(1));
  const netZeroCommitment = sr(i * 19) > 0.4;
  const engagementPolicy = sr(i * 23) > 0.35;
  const exclusionPolicy = sr(i * 29) > 0.4;
  const proxyVotingClimate = parseFloat((20 + sr(i * 31) * 75).toFixed(1));
  const climateRiskDisclosure = sr(i * 37) > 0.45;
  const tcfdAligned = sr(i * 41) > 0.5;
  const litigationRisk = parseFloat((1 + sr(i * 43) * 9).toFixed(1));
  const carbonFootprint = parseFloat((20 + sr(i * 47) * 280).toFixed(1));
  const fiduciaryScore = Math.round(
    (netZeroCommitment ? 20 : 0) +
    (tcfdAligned ? 15 : 0) +
    (climateRiskDisclosure ? 10 : 0) +
    (engagementPolicy ? 10 : 0) +
    (exclusionPolicy ? 10 : 0) +
    climateRiskIntegration * 2 +
    proxyVotingClimate * 0.1 +
    sr(i * 53) * 10
  );
  return {
    id: i + 1,
    name: `${type.split(' ')[0]} ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) || ''}`,
    type, country, aum, climateRiskIntegration, fiduciaryScore: Math.min(100, fiduciaryScore),
    netZeroCommitment, engagementPolicy, exclusionPolicy, proxyVotingClimate,
    climateRiskDisclosure, tcfdAligned, litigationRisk, carbonFootprint,
  };
});

const TABS = [
  'Investor Overview','Fiduciary Scoring','Net Zero Commitments','Engagement & Voting',
  'Exclusion Policies','TCFD Alignment','Litigation Risk','Carbon Footprint',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, fontFamily: T.fontMono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function FiduciaryClimateRiskPage() {
  const [tab, setTab] = useState(0);
  const [filterType, setFilterType] = useState('All');
  const [filterCountry, setFilterCountry] = useState('All');
  const [filterNZ, setFilterNZ] = useState('All');
  const [minAum, setMinAum] = useState(0);
  const [maxCarbon, setMaxCarbon] = useState(300);

  const filtered = useMemo(() => INVESTORS.filter(c =>
    (filterType === 'All' || c.type === filterType) &&
    (filterCountry === 'All' || c.country === filterCountry) &&
    (filterNZ === 'All' || (filterNZ === 'Yes' ? c.netZeroCommitment : !c.netZeroCommitment)) &&
    c.aum >= minAum &&
    c.carbonFootprint <= maxCarbon
  ), [filterType, filterCountry, filterNZ, minAum, maxCarbon]);

  const n = Math.max(1, filtered.length);
  const totalAum = filtered.reduce((a, c) => a + c.aum, 0).toFixed(0);
  const avgFid = (filtered.reduce((a, c) => a + c.fiduciaryScore, 0) / n).toFixed(1);
  const pctNZ = ((filtered.filter(c => c.netZeroCommitment).length / n) * 100).toFixed(0);
  const avgProxy = (filtered.reduce((a, c) => a + c.proxyVotingClimate, 0) / n).toFixed(1);

  const byType = TYPES.map(t => {
    const sc = filtered.filter(c => c.type === t);
    if (!sc.length) return null;
    return {
      type: t.replace('Sovereign Wealth Fund', 'SWF'),
      avgFid: parseFloat((sc.reduce((a, c) => a + c.fiduciaryScore, 0) / sc.length).toFixed(1)),
      pctNZ: parseFloat(((sc.filter(c => c.netZeroCommitment).length / sc.length) * 100).toFixed(0)),
      pctTcfd: parseFloat(((sc.filter(c => c.tcfdAligned).length / sc.length) * 100).toFixed(0)),
    };
  }).filter(Boolean);

  const byCountry = COUNTRIES.map(cn => {
    const cc = filtered.filter(c => c.country === cn);
    if (!cc.length) return null;
    return {
      country: cn,
      pctTcfd: parseFloat(((cc.filter(c => c.tcfdAligned).length / cc.length) * 100).toFixed(0)),
    };
  }).filter(Boolean);

  const scatterData = filtered.map(c => ({ x: c.aum, y: c.carbonFootprint, name: c.name, type: c.type }));

  const sel = { background: T.indigo, color: '#fff', border: `1px solid ${T.indigo}` };
  const unsel = { background: T.card, color: T.textPri, border: `1px solid ${T.border}` };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '20px 32px' }}>
        <div style={{ color: T.gold, fontSize: 11, fontFamily: T.fontMono, letterSpacing: '0.1em', marginBottom: 4 }}>EP-DK2 · SPRINT DK</div>
        <div style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>Fiduciary Climate Risk</div>
        <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>55 institutional investors · Pension funds · Insurers · SWFs · Endowments</div>
      </div>

      {/* Filters */}
      <div style={{ background: T.sub, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Type', TYPES, filterType, setFilterType], ['Country', COUNTRIES, filterCountry, setFilterCountry]].map(([label, opts, val, set]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: T.textSec }}>{label}:</span>
            <select value={val} onChange={e => set(e.target.value)} style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card }}>
              <option value="All">All</option>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Net Zero:</span>
          <select value={filterNZ} onChange={e => setFilterNZ(e.target.value)} style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card }}>
            <option value="All">All</option>
            <option value="Yes">Committed</option>
            <option value="No">Not Committed</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Min AUM $Bn: {minAum}</span>
          <input type="range" min={0} max={500} step={10} value={minAum} onChange={e => setMinAum(+e.target.value)} style={{ width: 100 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Max Carbon: {maxCarbon}</span>
          <input type="range" min={20} max={300} step={10} value={maxCarbon} onChange={e => setMaxCarbon(+e.target.value)} style={{ width: 100 }} />
        </div>
        <span style={{ fontSize: 12, color: T.textSec, marginLeft: 'auto' }}>{filtered.length} / {INVESTORS.length} investors</span>
      </div>

      {/* KPIs */}
      <div style={{ padding: '20px 32px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Total AUM" value={`$${Number(totalAum).toLocaleString()}Bn`} sub="filtered investors" color={T.navy} />
        <KpiCard label="Avg Fiduciary Score" value={avgFid} sub="out of 100" color={T.indigo} />
        <KpiCard label="% Net Zero Committed" value={`${pctNZ}%`} sub="with formal commitment" color={T.green} />
        <KpiCard label="Avg Proxy Voting Climate" value={`${avgProxy}%`} sub="of votes on climate" color={T.teal} />
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 32px', display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ ...i === tab ? sel : unsel, padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '0 32px 40px' }}>

        {tab === 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontWeight: 600, fontSize: 14 }}>Investor Overview — {filtered.length} Institutions</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Name','Type','Country','AUM ($Bn)','Fid Score','Net Zero','TCFD','Engagement','Exclusion','Litigation Risk'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 25).map((c, i) => (
                    <tr key={c.id} style={{ borderTop: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '9px 12px', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '9px 12px' }}>{c.type}</td>
                      <td style={{ padding: '9px 12px' }}>{c.country}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{c.aum.toFixed(0)}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono, fontWeight: 700, color: c.fiduciaryScore >= 70 ? T.green : c.fiduciaryScore >= 50 ? T.teal : T.amber }}>{c.fiduciaryScore}</td>
                      <td style={{ padding: '9px 12px', color: c.netZeroCommitment ? T.green : T.red }}>{c.netZeroCommitment ? '✓' : '✗'}</td>
                      <td style={{ padding: '9px 12px', color: c.tcfdAligned ? T.green : T.red }}>{c.tcfdAligned ? '✓' : '✗'}</td>
                      <td style={{ padding: '9px 12px', color: c.engagementPolicy ? T.green : T.red }}>{c.engagementPolicy ? '✓' : '✗'}</td>
                      <td style={{ padding: '9px 12px', color: c.exclusionPolicy ? T.green : T.red }}>{c.exclusionPolicy ? '✓' : '✗'}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono, color: c.litigationRisk >= 7 ? T.red : c.litigationRisk >= 5 ? T.amber : T.green }}>{c.litigationRisk.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Avg Fiduciary Score by Investor Type</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={byType} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip formatter={v => [`${v}`, 'Avg Fiduciary Score']} />
                <Bar dataKey="avgFid" fill={T.indigo} radius={[4,4,0,0]} name="Avg Fiduciary Score">
                  {byType.map((entry, index) => <Cell key={index} fill={entry.avgFid >= 70 ? T.green : entry.avgFid >= 55 ? T.teal : T.amber} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>% Net Zero Commitment by Investor Type</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={byType} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={v => [`${v}%`, 'Net Zero Committed']} />
                <Bar dataKey="pctNZ" fill={T.green} radius={[4,4,0,0]} name="% Net Zero" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Avg Proxy Voting Climate % — all investors: {avgProxy}%</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 16 }}>
              {filtered.slice(0, 20).map(c => (
                <div key={c.id} style={{ background: T.sub, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{c.type}</div>
                  <div style={{ marginTop: 8, fontSize: 20, fontFamily: T.fontMono, fontWeight: 700, color: c.proxyVotingClimate >= 70 ? T.green : c.proxyVotingClimate >= 50 ? T.teal : T.amber }}>{c.proxyVotingClimate.toFixed(0)}%</div>
                  <div style={{ fontSize: 10, color: T.textSec }}>proxy climate votes</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Exclusion Policy Adoption — {filtered.filter(c => c.exclusionPolicy).length} of {filtered.length} investors</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div style={{ background: T.sub, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 20px', flex: 1 }}>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: T.fontMono, color: T.green }}>{filtered.filter(c => c.exclusionPolicy).length}</div>
                <div style={{ fontSize: 13, color: T.textSec }}>With Exclusion Policy</div>
              </div>
              <div style={{ background: T.sub, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 20px', flex: 1 }}>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: T.fontMono, color: T.red }}>{filtered.filter(c => !c.exclusionPolicy).length}</div>
                <div style={{ fontSize: 13, color: T.textSec }}>Without Exclusion Policy</div>
              </div>
              <div style={{ background: T.sub, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 20px', flex: 1 }}>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: T.fontMono, color: T.teal }}>{((filtered.filter(c => c.exclusionPolicy).length / n) * 100).toFixed(0)}%</div>
                <div style={{ fontSize: 13, color: T.textSec }}>Adoption Rate</div>
              </div>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>TCFD Alignment by Country (%)</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={byCountry} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="country" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={v => [`${v}%`, 'TCFD Aligned']} />
                <Bar dataKey="pctTcfd" fill={T.blue} radius={[4,4,0,0]} name="% TCFD Aligned" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontWeight: 600, fontSize: 14 }}>Litigation Risk Scores — sorted highest to lowest</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Investor','Type','Country','Litigation Risk','Net Zero','Disclosure','Fiduciary Score'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...filtered].sort((a, b) => b.litigationRisk - a.litigationRisk).slice(0, 20).map((c, i) => (
                  <tr key={c.id} style={{ borderTop: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '9px 12px', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '9px 12px' }}>{c.type}</td>
                    <td style={{ padding: '9px 12px' }}>{c.country}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono, fontWeight: 700, color: c.litigationRisk >= 7 ? T.red : c.litigationRisk >= 5 ? T.amber : T.green }}>{c.litigationRisk.toFixed(1)}</td>
                    <td style={{ padding: '9px 12px', color: c.netZeroCommitment ? T.green : T.red }}>{c.netZeroCommitment ? '✓' : '✗'}</td>
                    <td style={{ padding: '9px 12px', color: c.climateRiskDisclosure ? T.green : T.red }}>{c.climateRiskDisclosure ? '✓' : '✗'}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{c.fiduciaryScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 7 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 16 }}>AUM vs Carbon Footprint (tCO2/$M AUM)</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="AUM $Bn" label={{ value: 'AUM ($Bn)', position: 'insideBottom', offset: -5, fontSize: 11 }} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="y" name="Carbon" label={{ value: 'tCO2/$M', angle: -90, position: 'insideLeft', fontSize: 11 }} tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.[0] ? <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', borderRadius: 6, fontSize: 12 }}><div style={{ fontWeight: 600 }}>{payload[0].payload.name}</div><div>AUM: ${payload[0].payload.x.toFixed(0)}Bn</div><div>Carbon: {payload[0].payload.y.toFixed(1)} tCO2/$M</div></div> : null} />
                  <Scatter data={scatterData} fill={T.sage} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 16 }}>Carbon Footprint Distribution</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[['< 100 tCO2/$M','Low Carbon',T.green],['>= 100 & < 200','Medium',T.amber],['>= 200 & < 250','High',T.orange],['>= 250','Very High',T.red]].map(([label, tier, color]) => {
                  const cnt = filtered.filter(c => label.startsWith('<') ? c.carbonFootprint < 100 : label.includes('200 &') ? c.carbonFootprint >= 100 && c.carbonFootprint < 200 : label.includes('250 &') ? c.carbonFootprint >= 200 && c.carbonFootprint < 250 : c.carbonFootprint >= 250).length;
                  return (
                    <div key={label} style={{ background: T.sub, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                      <div style={{ fontSize: 24, fontWeight: 700, fontFamily: T.fontMono, color }}>{cnt}</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{tier}</div>
                      <div style={{ fontSize: 11, color: T.textSec }}>{label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
