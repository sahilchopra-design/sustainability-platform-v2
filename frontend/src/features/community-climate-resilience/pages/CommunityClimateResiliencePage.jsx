import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const REGIONS = ['Sub-Saharan Africa', 'South Asia', 'Southeast Asia', 'Pacific Islands', 'Latin America', 'MENA', 'Caribbean', 'Central Asia'];
const INCOME_LEVELS = ['Low', 'Lower-Middle', 'Upper-Middle'];

const COMMUNITY_NAMES = [
  'Ganges Delta Bangladesh', 'Tuvalu Communities', 'Maldives Atolls', 'Marshall Islands', 'Kiribati Villages',
  'Sahel Pastoralists Mali', 'Senegal River Communities', 'Niger Basin Niger', 'Lake Chad Basin', 'Rift Valley Herders Kenya',
  'Amazon Riverside Brazil', 'Andean Highlands Peru', 'Atacama Chile', 'Gran Chaco Paraguay', 'Pantanal Brazil',
  'Mekong Delta Vietnam', 'Irrawaddy Delta Myanmar', 'Tonle Sap Cambodia', 'Brahmaputra Assam India', 'Sundarbans India',
  'Caribbean Small Islands', 'Pacific Coral Communities', 'Torres Strait Australia', 'Arctic Inuit Canada', 'Siberian Indigenous Russia',
  'Congo Basin DRC', 'Bight of Benin Nigeria', 'Limpopo Floodplain SA', 'Okavango Botswana', 'Volta Basin Ghana',
  'Nile Delta Egypt', 'Tigris-Euphrates Iraq', 'Indus Delta Pakistan', 'Helmand Basin Afghanistan', 'Amu Darya Uzbekistan',
  'Mosul Plains Iraq', 'Coastal Bangladesh', 'Bihar Flood Plains India', 'Orissa Cyclone Belt India', 'Gujarat Coast India',
  'Samoa Coastal Communities', 'Vanuatu Highlands', 'Fiji Islands', 'Tonga Rural', 'Cook Islands',
  'Nicaraguan Coast', 'Haitian Highlands', 'Peruvian Amazonia', 'Bolivian Altiplano', 'Colombian Pacific Coast',
  'Coastal Mozambique', 'Madagascar Highland', 'Zanzibar Communities', 'Ethiopian Lowlands', 'Djibouti Coast',
  'Somali Coastal', 'Eritrean Highlands', 'Malawi Lakeshore', 'Zambia Floodplains', 'Zimbabwe Lowveld',
];

const COMMUNITIES = Array.from({ length: 60 }, (_, i) => {
  const region = REGIONS[i % REGIONS.length];
  const incomeLevel = INCOME_LEVELS[i % INCOME_LEVELS.length];
  const resilienceScore = Math.round(10 + sr(i * 7) * 85);
  return {
    id: i,
    name: COMMUNITY_NAMES[i] || `Community ${i + 1}`,
    country: region,
    region,
    populationK: Math.round(5 + sr(i * 11) * 495),
    incomeLevel,
    physicalRisk: +(1 + sr(i * 13) * 9).toFixed(1),
    socialVulnerability: +(1 + sr(i * 17) * 9).toFixed(1),
    economicResilience: +(1 + sr(i * 19) * 9).toFixed(1),
    resilienceScore,
    adaptationFunding: +(0.5 + sr(i * 23) * 49.5).toFixed(1),
    indigenousCommunity: sr(i * 29) > 0.55,
    coastalExposure: sr(i * 31) > 0.45,
    foodInsecurity: +(1 + sr(i * 37) * 9).toFixed(1),
    climateFinanceAccess: +(1 + sr(i * 41) * 9).toFixed(1),
    communityOrgStrength: +(1 + sr(i * 43) * 9).toFixed(1),
  };
});

const TABS = [
  'Community Overview', 'Physical Risk', 'Social Vulnerability', 'Economic Resilience',
  'Adaptation Finance', 'Indigenous Communities', 'Coastal Exposure', 'Resilience Rankings',
];

const getResilienceLabel = score => score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low';
const RESILIENCE_COLORS = { Low: T.red, Medium: T.amber, High: T.green };

export default function CommunityClimateResiliencePage() {
  const [tab, setTab] = useState(0);
  const [regionFilter, setRegionFilter] = useState('All');
  const [incomeLevelFilter, setIncomeLevelFilter] = useState('All');
  const [indigenousFilter, setIndigenousFilter] = useState('All');
  const [coastalFilter, setCoastalFilter] = useState('All');
  const [financeMultiplier, setFinanceMultiplier] = useState(1.0);
  const [tempScenario, setTempScenario] = useState(2.0);

  const filtered = useMemo(() => {
    return COMMUNITIES.filter(c => {
      if (regionFilter !== 'All' && c.region !== regionFilter) return false;
      if (incomeLevelFilter !== 'All' && c.incomeLevel !== incomeLevelFilter) return false;
      if (indigenousFilter === 'Yes' && !c.indigenousCommunity) return false;
      if (indigenousFilter === 'No' && c.indigenousCommunity) return false;
      if (coastalFilter === 'Yes' && !c.coastalExposure) return false;
      if (coastalFilter === 'No' && c.coastalExposure) return false;
      return true;
    });
  }, [regionFilter, incomeLevelFilter, indigenousFilter, coastalFilter]);

  const tempMult = 1 + (tempScenario - 1.5) * 0.08;
  const avgResilience = filtered.length ? filtered.reduce((s, c) => s + c.resilienceScore, 0) / filtered.length : 0;
  const totalAdaptFunding = filtered.reduce((s, c) => s + c.adaptationFunding * financeMultiplier, 0);
  const indigenousPct = filtered.length ? (filtered.filter(c => c.indigenousCommunity).length / filtered.length) * 100 : 0;
  const avgPhysicalRisk = filtered.length ? filtered.reduce((s, c) => s + c.physicalRisk * tempMult, 0) / filtered.length : 0;

  const resilienceByRegion = REGIONS.map(r => {
    const sub = filtered.filter(c => c.region === r);
    return { region: r.split(' ').slice(0, 2).join(' '), score: sub.length ? +(sub.reduce((s, c) => s + c.resilienceScore, 0) / sub.length).toFixed(0) : 0 };
  }).filter(d => d.score > 0).sort((a, b) => b.score - a.score);

  const scatterData = filtered.map(c => ({
    x: +(c.adaptationFunding * financeMultiplier).toFixed(1),
    y: c.socialVulnerability,
    name: c.name,
  }));

  const physRiskByIncome = INCOME_LEVELS.map(il => {
    const sub = filtered.filter(c => c.incomeLevel === il);
    return { incomeLevel: il, physRisk: sub.length ? +(sub.reduce((s, c) => s + c.physicalRisk * tempMult, 0) / sub.length).toFixed(1) : 0 };
  });

  const radarData = [
    { dim: 'Physical Risk', value: +(avgPhysicalRisk).toFixed(1) },
    { dim: 'Social Vulnerability', value: +(filtered.length ? filtered.reduce((s, c) => s + c.socialVulnerability, 0) / filtered.length : 0).toFixed(1) },
    { dim: 'Economic Resilience', value: +(filtered.length ? filtered.reduce((s, c) => s + c.economicResilience, 0) / filtered.length : 0).toFixed(1) },
    { dim: 'Climate Finance', value: +(filtered.length ? filtered.reduce((s, c) => s + c.climateFinanceAccess, 0) / filtered.length : 0).toFixed(1) },
    { dim: 'Community Org', value: +(filtered.length ? filtered.reduce((s, c) => s + c.communityOrgStrength, 0) / filtered.length : 0).toFixed(1) },
    { dim: 'Food Security', value: +(10 - (filtered.length ? filtered.reduce((s, c) => s + c.foodInsecurity, 0) / filtered.length : 0)).toFixed(1) },
  ];

  const kpis = [
    { label: 'Avg Resilience Score', value: avgResilience.toFixed(0), color: avgResilience >= 60 ? T.green : avgResilience >= 40 ? T.amber : T.red },
    { label: 'Total Adaptation Funding', value: `$${totalAdaptFunding.toFixed(0)}M`, color: T.teal },
    { label: '% Indigenous Communities', value: `${indigenousPct.toFixed(1)}%`, color: T.purple },
    { label: 'Avg Physical Risk', value: `${avgPhysicalRisk.toFixed(1)}/10`, color: T.red },
  ];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '24px', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.gold, letterSpacing: 1 }}>EP-DI6</span>
            <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textSec }}>CLIMATE WORKFORCE & JUST TRANSITION</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.navy, margin: 0 }}>Community Climate Resilience</h1>
          <p style={{ color: T.textSec, fontSize: 13, margin: '4px 0 0' }}>
            60 vulnerable communities · Resilience scoring · Adaptation finance · Indigenous · Coastal exposure · Social vulnerability
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {kpis.map(k => (
            <div key={k.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 6 }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {[
            { label: 'Region', val: regionFilter, set: setRegionFilter, opts: ['All', ...REGIONS] },
            { label: 'Income Level', val: incomeLevelFilter, set: setIncomeLevelFilter, opts: ['All', ...INCOME_LEVELS] },
            { label: 'Indigenous', val: indigenousFilter, set: setIndigenousFilter, opts: ['All', 'Yes', 'No'] },
            { label: 'Coastal', val: coastalFilter, set: setCoastalFilter, opts: ['All', 'Yes', 'No'] },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4, fontFamily: T.fontMono }}>{f.label}</div>
              <select value={f.val} onChange={e => f.set(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.sub, fontSize: 13, color: T.textPri }}>
                {f.opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4, fontFamily: T.fontMono }}>Finance Multiplier: {financeMultiplier.toFixed(1)}x</div>
            <input type="range" min={0.5} max={3.0} step={0.1} value={financeMultiplier} onChange={e => setFinanceMultiplier(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4, fontFamily: T.fontMono }}>Temperature: +{tempScenario}°C</div>
            <input type="range" min={1.5} max={4.0} step={0.5} value={tempScenario} onChange={e => setTempScenario(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div style={{ fontFamily: T.fontMono, fontSize: 12, color: T.textSec }}>{filtered.length} communities</div>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === i ? 600 : 400, background: tab === i ? T.navy : T.card, color: tab === i ? '#fff' : T.textSec }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Resilience Score by Region</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={resilienceByRegion} margin={{ bottom: 40, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="region" tick={{ fontSize: 11, fill: T.textSec }} angle={-20} textAnchor="end" interval={0} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="score" fill={T.teal} radius={[3, 3, 0, 0]} name="Avg Resilience Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Resilience Dimensions Radar</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.borderL} />
                  <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10, fill: T.textSec }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 9 }} />
                  <Radar name="Avg Score" dataKey="value" stroke={T.teal} fill={T.teal} fillOpacity={0.3} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Physical Risk by Income Level (+{tempScenario}°C scenario)</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={physRiskByIncome} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="incomeLevel" tick={{ fontSize: 12, fill: T.textSec }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="physRisk" fill={T.red} radius={[3, 3, 0, 0]} name="Avg Physical Risk (0-10)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Social Vulnerability vs Adaptation Funding — Scatter</h3>
            <ResponsiveContainer width="100%" height={380}>
              <ScatterChart margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="x" name="Adaptation Funding ($M)" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Adapt Funding ($M)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                <YAxis dataKey="y" name="Social Vulnerability" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Social Vulnerability (0-10)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.length ? <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', fontSize: 12 }}><b>{payload[0]?.payload?.name}</b><br />Funding: ${payload[0]?.payload?.x}M<br />Vulnerability: {payload[0]?.payload?.y}</div> : null} />
                <Scatter data={scatterData} fill={T.purple} opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Economic Resilience Score by Region</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={REGIONS.map(r => { const sub = filtered.filter(c => c.region === r); return { region: r.split(' ').slice(0, 2).join(' '), econ: sub.length ? +(sub.reduce((s, c) => s + c.economicResilience, 0) / sub.length).toFixed(1) : 0 }; }).filter(d => d.econ > 0).sort((a, b) => b.econ - a.econ)} margin={{ bottom: 40, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="region" tick={{ fontSize: 11, fill: T.textSec }} angle={-20} textAnchor="end" interval={0} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="econ" fill={T.gold} radius={[3, 3, 0, 0]} name="Economic Resilience (0-10)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Adaptation Funding by Region ($M, total)</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={REGIONS.map(r => { const sub = filtered.filter(c => c.region === r); return { region: r.split(' ').slice(0, 2).join(' '), funding: +(sub.reduce((s, c) => s + c.adaptationFunding * financeMultiplier, 0)).toFixed(0) }; }).filter(d => d.funding > 0).sort((a, b) => b.funding - a.funding)} margin={{ bottom: 40, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="region" tick={{ fontSize: 11, fill: T.textSec }} angle={-20} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="funding" fill={T.green} radius={[3, 3, 0, 0]} name="Adaptation Funding ($M)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Indigenous Communities — Resilience vs Non-Indigenous</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={[
                { type: 'Indigenous', score: +(filtered.filter(c => c.indigenousCommunity).length ? filtered.filter(c => c.indigenousCommunity).reduce((s, c) => s + c.resilienceScore, 0) / filtered.filter(c => c.indigenousCommunity).length : 0).toFixed(0), funding: +(filtered.filter(c => c.indigenousCommunity).reduce((s, c) => s + c.adaptationFunding * financeMultiplier, 0) / Math.max(1, filtered.filter(c => c.indigenousCommunity).length)).toFixed(1) },
                { type: 'Non-Indigenous', score: +(filtered.filter(c => !c.indigenousCommunity).length ? filtered.filter(c => !c.indigenousCommunity).reduce((s, c) => s + c.resilienceScore, 0) / filtered.filter(c => !c.indigenousCommunity).length : 0).toFixed(0), funding: +(filtered.filter(c => !c.indigenousCommunity).reduce((s, c) => s + c.adaptationFunding * financeMultiplier, 0) / Math.max(1, filtered.filter(c => !c.indigenousCommunity).length)).toFixed(1) },
              ]} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="type" tick={{ fontSize: 12, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="score" fill={T.purple} radius={[3, 3, 0, 0]} name="Avg Resilience Score" />
                <Bar yAxisId="right" dataKey="funding" fill={T.teal} radius={[3, 3, 0, 0]} name="Avg Funding ($M)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Coastal vs Inland — Risk & Resilience Comparison</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={['Coastal', 'Inland'].map(type => {
                const sub = filtered.filter(c => type === 'Coastal' ? c.coastalExposure : !c.coastalExposure);
                const n = Math.max(1, sub.length);
                return {
                  type,
                  physRisk: +(sub.reduce((s, c) => s + c.physicalRisk * tempMult, 0) / n).toFixed(1),
                  resilience: +(sub.reduce((s, c) => s + c.resilienceScore, 0) / n).toFixed(0),
                  funding: +(sub.reduce((s, c) => s + c.adaptationFunding * financeMultiplier, 0) / n).toFixed(1),
                };
              })} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="type" tick={{ fontSize: 12, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="physRisk" fill={T.red} radius={[3, 3, 0, 0]} name="Physical Risk (0-10)" />
                <Bar yAxisId="left" dataKey="resilience" fill={T.green} radius={[3, 3, 0, 0]} name="Resilience Score (0-100)" />
                <Bar yAxisId="right" dataKey="funding" fill={T.blue} radius={[3, 3, 0, 0]} name="Avg Funding ($M)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 7 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Top 20 Communities — Resilience Rankings</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={[...filtered].sort((a, b) => b.resilienceScore - a.resilienceScore).slice(0, 20).map(c => ({ name: c.name.split(' ').slice(0, 3).join(' '), score: c.resilienceScore }))} margin={{ bottom: 60, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="score" fill={T.sage} radius={[3, 3, 0, 0]} name="Resilience Score (0-100)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20, overflowX: 'auto' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Community Detail Table</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Community', 'Region', 'Pop (k)', 'Income', 'Resilience', 'Phys Risk', 'Soc Vuln', 'Econ Resilience', 'Adapt Fund ($M)', 'Indigenous', 'Coastal'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 25).map(c => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                  <td style={{ padding: '7px 10px', color: T.textPri, fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{c.region}</td>
                  <td style={{ padding: '7px 10px', color: T.textPri }}>{c.populationK}</td>
                  <td style={{ padding: '7px 10px' }}><span style={{ background: T.sub, padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{c.incomeLevel}</span></td>
                  <td style={{ padding: '7px 10px', fontWeight: 700, color: RESILIENCE_COLORS[getResilienceLabel(c.resilienceScore)] }}>{c.resilienceScore}</td>
                  <td style={{ padding: '7px 10px', color: c.physicalRisk >= 7 ? T.red : c.physicalRisk >= 4 ? T.amber : T.green }}>{(c.physicalRisk * tempMult).toFixed(1)}</td>
                  <td style={{ padding: '7px 10px', color: c.socialVulnerability >= 7 ? T.red : c.socialVulnerability >= 4 ? T.amber : T.green }}>{c.socialVulnerability}</td>
                  <td style={{ padding: '7px 10px', color: c.economicResilience >= 7 ? T.green : c.economicResilience >= 4 ? T.amber : T.red }}>{c.economicResilience}</td>
                  <td style={{ padding: '7px 10px', color: T.green }}>{(c.adaptationFunding * financeMultiplier).toFixed(1)}</td>
                  <td style={{ padding: '7px 10px', color: c.indigenousCommunity ? T.purple : T.textSec, fontWeight: c.indigenousCommunity ? 600 : 400 }}>{c.indigenousCommunity ? 'Yes' : 'No'}</td>
                  <td style={{ padding: '7px 10px', color: c.coastalExposure ? T.blue : T.textSec, fontWeight: c.coastalExposure ? 600 : 400 }}>{c.coastalExposure ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
