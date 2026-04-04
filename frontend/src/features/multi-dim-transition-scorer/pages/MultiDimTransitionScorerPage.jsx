import React, { useState, useMemo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

// ─── 6-PILLAR SCORING FRAMEWORK ─────────────────────────────────────────────
const PILLARS = [
  { id: 'carbon_exposure',      name: 'Carbon Exposure',         weight: 22, icon: '☁️', color: T.red,    desc: 'Scope 1/2/3 intensity, fossil asset dependency, ETS coverage, carbon price sensitivity' },
  { id: 'tech_readiness',       name: 'Technology Readiness',    weight: 18, icon: '⚙️', color: T.blue,   desc: 'Low-carbon capex, R&D spend, patent filings, tech adoption rate, stranded asset exposure' },
  { id: 'policy_risk',          name: 'Policy & Regulatory',     weight: 20, icon: '📋', color: T.amber,  desc: 'Regulatory jurisdiction risk, ETS exposure, carbon tax coverage, taxonomy alignment, fines risk' },
  { id: 'market_dynamics',      name: 'Market Dynamics',         weight: 18, icon: '📈', color: T.purple, desc: 'Green revenue %, customer demand shift, competitor transition pace, supply chain transition' },
  { id: 'capital_access',       name: 'Capital Access',          weight: 12, icon: '💰', color: T.teal,   desc: 'Green bond issuance, sustainability credit facilities, ESG-linked financing, investor pressure' },
  { id: 'social_license',       name: 'Social License',          weight: 10, icon: '🤝', color: T.sage,   desc: 'Worker transition programs, community engagement, ILO JTF alignment, stakeholder trust' },
];

// ─── COMPANY DATA ────────────────────────────────────────────────────────────
const COMPANIES = [
  {
    id: 'shell', name: 'Shell plc', sector: 'Oil & Gas', country: 'UK', color: T.red,
    public_data: {
      carbon_exposure: 28, tech_readiness: 42, policy_risk: 32, market_dynamics: 38, capital_access: 58, social_license: 44,
    },
    proprietary_data: {
      carbon_exposure: 24, tech_readiness: 48, policy_risk: 28, market_dynamics: 42, capital_access: 62, social_license: 48,
    },
    data_sources: {
      carbon_exposure: ['CDP 2024 A-', 'EVIC attribution', 'Scope 3 Cat 11'],
      tech_readiness: ['CapEx mix 14% green', 'R&D €2.8B 2023', 'Powering Progress plan'],
      policy_risk: ['EU ETS 450Mt/yr', 'UK CBAM exposure', 'IEA Net Zero 2050'],
      market_dynamics: ['LNG demand shift', 'EV penetration', 'Power-to-X'],
      capital_access: ['€4B green bonds 2023', 'ESG credit facility €6B'],
      social_license: ['Just Transition plan', 'Community fund €120M'],
    },
    news_signals: ['Q3 profit miss on low gas prices', 'Shell wins offshore wind license', 'CDP score improvement to A-'],
    itr: 3.4, sbti: false, sbti_year: null,
  },
  {
    id: 'vestas', name: 'Vestas Wind Systems', sector: 'Renewables', country: 'DK', color: T.green,
    public_data: {
      carbon_exposure: 82, tech_readiness: 88, policy_risk: 78, market_dynamics: 85, capital_access: 80, social_license: 82,
    },
    proprietary_data: {
      carbon_exposure: 85, tech_readiness: 90, policy_risk: 80, market_dynamics: 88, capital_access: 83, social_license: 84,
    },
    data_sources: {
      carbon_exposure: ['CDP A score', 'Net-zero supply chain', 'Scope 3 product lifecycle'],
      tech_readiness: ['100% renewable revenue', 'R&D 5.2% of sales', 'Offshore wind leadership'],
      policy_risk: ['EU Green Deal beneficiary', 'IRA US expansion', 'Low regulatory risk'],
      market_dynamics: ['IEA: 1,200 GW by 2030', 'Backlog €20B+'],
      capital_access: ['Green bond €600M', 'Investment-grade BBB+'],
      social_license: ['Worker ownership scheme', 'ILO-compliant supply chain'],
    },
    news_signals: ['Record order backlog Q4', 'Offshore blade factory opens', 'US IRA expansion plan confirmed'],
    itr: 1.6, sbti: true, sbti_year: 2023,
  },
  {
    id: 'basf', name: 'BASF SE', sector: 'Chemicals', country: 'DE', color: T.amber,
    public_data: {
      carbon_exposure: 38, tech_readiness: 52, policy_risk: 45, market_dynamics: 48, capital_access: 62, social_license: 55,
    },
    proprietary_data: {
      carbon_exposure: 34, tech_readiness: 55, policy_risk: 42, market_dynamics: 52, capital_access: 65, social_license: 58,
    },
    data_sources: {
      carbon_exposure: ['CDP B score', 'ETS exposure 20Mt', 'CBAM steel/fertilizer'],
      tech_readiness: ['Verbund electrification', 'Green H₂ pilot Ludwigshafen', '€4B clean capex 2025–2027'],
      policy_risk: ['EU ETS Phase 4', 'CBAM exposure: fertilizers', 'Germany energy cost risk'],
      market_dynamics: ['Customer Scope 3 pressure', 'Bio-based chemicals R&D'],
      capital_access: ['€2B ESG bond 2022', 'Sustainability KPI loan'],
      social_license: ['Verbund job transition plan', 'Germany worker council engagement'],
    },
    news_signals: ['Restructuring 2,600 jobs Ludwigshafen', 'Green ammonia pilot result', 'EU taxonomy disclosure update'],
    itr: 2.8, sbti: true, sbti_year: 2022,
  },
  {
    id: 'rwe', name: 'RWE AG', sector: 'Power Utilities', country: 'DE', color: T.blue,
    public_data: {
      carbon_exposure: 55, tech_readiness: 68, policy_risk: 58, market_dynamics: 65, capital_access: 72, social_license: 60,
    },
    proprietary_data: {
      carbon_exposure: 52, tech_readiness: 72, policy_risk: 55, market_dynamics: 68, capital_access: 75, social_license: 63,
    },
    data_sources: {
      carbon_exposure: ['ETS 50Mt/yr exposure', 'Coal exit 2030', 'Lignite declining'],
      tech_readiness: ['€50B green capex 2023-2030', 'Solar+wind 10 GW additions/yr'],
      policy_risk: ['German coal exit law', 'EU ETS beneficiary', 'Nuclear restart?'],
      market_dynamics: ['Power PPA demand growth', 'Battery storage pipeline 3GW'],
      capital_access: ['Green bond €4B 2023', 'EIB facility €1.5B'],
      social_license: ['Structural Aid Rheinisches Revier €15B', 'Lignite worker transition'],
    },
    news_signals: ['RWE raises 2025 renewables target', 'German lignite exit accelerated', 'Wind farm acquisition Texas'],
    itr: 2.1, sbti: true, sbti_year: 2022,
  },
  {
    id: 'lufthansa', name: 'Lufthansa Group', sector: 'Aviation', country: 'DE', color: T.orange,
    public_data: {
      carbon_exposure: 32, tech_readiness: 38, policy_risk: 40, market_dynamics: 42, capital_access: 48, social_license: 52,
    },
    proprietary_data: {
      carbon_exposure: 28, tech_readiness: 42, policy_risk: 36, market_dynamics: 45, capital_access: 52, social_license: 55,
    },
    data_sources: {
      carbon_exposure: ['CORSIA Phase 1', 'EU ETS aviation', 'SAF blending mandate'],
      tech_readiness: ['SAF 2% 2025 target', 'Fleet renewal A320neo', 'H₂ engine R&D'],
      policy_risk: ['EU ETS aviation tightening', 'ReFuelEU 2% SAF 2025→70% 2050'],
      market_dynamics: ['Travel recovery post-COVID', 'Corporate sustainability travel policy'],
      capital_access: ['€1.5B sustainability bond', 'Government stake remaining'],
      social_license: ['Pilot union agreements', 'Ground staff transition'],
    },
    news_signals: ['SAF supply deal with Neste', 'Q2 load factor 88% record', 'EU ETS cost +€200M Q3'],
    itr: 3.2, sbti: false, sbti_year: null,
  },
  {
    id: 'blackrock', name: 'BlackRock (Climate)', sector: 'Asset Management', country: 'US', color: T.teal,
    public_data: {
      carbon_exposure: 68, tech_readiness: 60, policy_risk: 65, market_dynamics: 72, capital_access: 82, social_license: 70,
    },
    proprietary_data: {
      carbon_exposure: 70, tech_readiness: 63, policy_risk: 67, market_dynamics: 75, capital_access: 85, social_license: 72,
    },
    data_sources: {
      carbon_exposure: ['Financed emissions PCAF', 'NZAM commitment', 'Portfolio ITR 2.4°C'],
      tech_readiness: ['Aladdin Climate tool', 'Physical risk integration', 'Transition risk scoring'],
      policy_risk: ['SFDR Art.9 AUM $12B', 'SEC climate disclosure readiness'],
      market_dynamics: ['ESG AUM $500B+ target', 'Client net-zero mandates'],
      capital_access: ['Global Climate Finance Hub', 'Climate Infrastructure Fund'],
      social_license: ['NZAM pledge 43% AUM', 'Engagement: 4,000 companies'],
    },
    news_signals: ['BlackRock exits NZAM coalition', 'ESG AUM target revised', 'Climate stewardship report 2024'],
    itr: 2.4, sbti: true, sbti_year: 2021,
  },
];

function computeScore(company, usePropriety) {
  const data = usePropriety ? company.proprietary_data : company.public_data;
  const weighted = PILLARS.reduce((sum, p) => sum + data[p.id] * p.weight / 100, 0);
  return weighted;
}

function scoreToRating(score) {
  if (score >= 75) return { label: 'A', color: T.green };
  if (score >= 60) return { label: 'B', color: '#22c55e' };
  if (score >= 45) return { label: 'C', color: T.amber };
  if (score >= 30) return { label: 'D', color: T.orange };
  return { label: 'E', color: T.red };
}

const TABS = ['Company Scorer', 'Pillar Deep-Dive', 'Public vs. Proprietary Delta', 'Signal Feed', 'Universe Ranking'];

export default function MultiDimTransitionScorerPage() {
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState('shell');
  const [usePropriety, setUsePropriety] = useState(false);
  const [scenario, setScenario] = useState('net_zero_2050');

  const company = COMPANIES.find(c => c.id === selected);
  const data = usePropriety ? company.proprietary_data : company.public_data;
  const score = computeScore(company, usePropriety);
  const rating = scoreToRating(score);

  const radarData = PILLARS.map(p => ({
    subject: p.name.split(' ')[0],
    public: company.public_data[p.id],
    proprietary: company.proprietary_data[p.id],
    fullMark: 100,
  }));

  const rankings = useMemo(() =>
    COMPANIES.map(c => ({
      ...c,
      public_score: computeScore(c, false),
      prop_score: computeScore(c, true),
      rating: scoreToRating(computeScore(c, usePropriety)),
    })).sort((a, b) => (usePropriety ? b.prop_score - a.prop_score : b.public_score - a.public_score)),
    [usePropriety]);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CD1 · MULTI-DIMENSIONAL TRANSITION SCORER</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Multi-Dimensional Climate Transition Risk Scoring</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              6-Pillar Framework · 6 Companies · Public + Proprietary Data Tiers · Signal Feed · CDP/SBTi/PCAF Integration
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 16px' }}>
              <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Data Tier</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setUsePropriety(false)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${!usePropriety ? T.gold : 'transparent'}`, background: !usePropriety ? T.gold + '22' : 'transparent', color: !usePropriety ? T.gold : '#94a3b8', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Public</button>
                <button onClick={() => setUsePropriety(true)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${usePropriety ? T.purple : 'transparent'}`, background: usePropriety ? T.purple + '22' : 'transparent', color: usePropriety ? T.purple : '#94a3b8', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Proprietary</button>
              </div>
            </div>
            {[
              { label: 'Avg Score', val: `${(COMPANIES.reduce((s, c) => s + computeScore(c, usePropriety), 0) / COMPANIES.length).toFixed(1)}` },
              { label: 'Scored Companies', val: COMPANIES.length },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                <div style={{ color: T.gold, fontSize: 20, fontWeight: 700, fontFamily: T.mono }}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Company selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {COMPANIES.map(c => (
            <button key={c.id} onClick={() => setSelected(c.id)} style={{
              padding: '6px 14px', borderRadius: 20, border: `2px solid ${selected === c.id ? c.color : 'transparent'}`,
              background: selected === c.id ? c.color + '22' : 'rgba(255,255,255,0.06)',
              color: selected === c.id ? c.color : '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 600
            }}>{c.name.split(' ')[0]}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 13,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t2}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 32px 32px' }}>

        {/* TAB 0: Company Scorer */}
        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            {/* Company header */}
            <div style={{ background: T.surface, borderRadius: 10, border: `2px solid ${company.color}44`, padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 4 }}>
                    <h2 style={{ color: T.navy, margin: 0, fontSize: 20 }}>{company.name}</h2>
                    <span style={{ background: rating.color + '22', color: rating.color, padding: '3px 12px', borderRadius: 10, fontSize: 16, fontWeight: 700 }}>{rating.label}</span>
                    <span style={{ background: T.navy + '11', color: T.navy, padding: '3px 10px', borderRadius: 10, fontSize: 12 }}>{company.sector}</span>
                    {company.sbti && <span style={{ background: T.blue + '22', color: T.blue, padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>SBTi Validated {company.sbti_year}</span>}
                  </div>
                  <div style={{ color: T.textSec, fontSize: 13 }}>{company.country} · ITR {company.itr}°C · {usePropriety ? 'Proprietary' : 'Public'} Data Tier</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: T.mono, fontSize: 42, fontWeight: 700, color: rating.color }}>{score.toFixed(1)}</div>
                  <div style={{ fontSize: 12, color: T.textSec }}>Composite Score / 100</div>
                </div>
              </div>

              {/* Pillar scores */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginTop: 20 }}>
                {PILLARS.map(p => (
                  <div key={p.id} style={{ background: T.bg, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{p.icon}</div>
                    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{p.name.split(' ')[0]}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: data[p.id] > 65 ? T.green : data[p.id] > 40 ? T.amber : T.red }}>{data[p.id]}</div>
                    <div style={{ fontSize: 10, color: T.textMut }}>wt {p.weight}%</div>
                    <div style={{ height: 4, background: T.border, borderRadius: 2, marginTop: 6 }}>
                      <div style={{ height: '100%', width: `${data[p.id]}%`, background: data[p.id] > 65 ? T.green : data[p.id] > 40 ? T.amber : T.red, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Radar + Sources */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h4 style={{ color: T.navy, margin: '0 0 16px', fontSize: 14 }}>6-Pillar Radar — Public vs. Proprietary</h4>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: T.textSec, fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar dataKey="public" stroke={T.blue} fill={T.blue} fillOpacity={0.15} strokeWidth={2} name="Public" />
                    <Radar dataKey="proprietary" stroke={T.purple} fill={T.purple} fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 3" name="Proprietary" />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, overflowY: 'auto', maxHeight: 340 }}>
                <h4 style={{ color: T.navy, margin: '0 0 12px', fontSize: 14 }}>Data Sources by Pillar</h4>
                {PILLARS.map(p => (
                  <div key={p.id} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: p.color, marginBottom: 4 }}>{p.icon} {p.name}</div>
                    {company.data_sources[p.id].map(src => (
                      <div key={src} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: T.textSec }}>{src}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: Pillar Deep-Dive */}
        {tab === 1 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
              {PILLARS.map(p => (
                <div key={p.id} style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>{p.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: T.navy, fontSize: 14 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: T.textSec }}>Weight: {p.weight}% of composite</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: p.color }}>{data[p.id]}</div>
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12, lineHeight: 1.5 }}>{p.desc}</div>
                  {/* Company comparison bars */}
                  {COMPANIES.map(c => {
                    const cData = usePropriety ? c.proprietary_data : c.public_data;
                    return (
                      <div key={c.id} style={{ marginBottom: 5 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ fontSize: 11, color: T.navy, fontWeight: c.id === selected ? 700 : 400 }}>{c.name.split(' ')[0]}</span>
                          <span style={{ fontFamily: T.mono, fontSize: 11, color: c.color }}>{cData[p.id]}</span>
                        </div>
                        <div style={{ height: 5, background: T.border, borderRadius: 3 }}>
                          <div style={{ height: '100%', width: `${cData[p.id]}%`, background: c.color, borderRadius: 3, opacity: c.id === selected ? 1 : 0.5 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Public vs. Proprietary Delta */}
        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 8px', fontSize: 15 }}>Score Delta: Proprietary vs. Public Data — {company.name}</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>
                Positive delta = proprietary data reveals higher transition readiness than public signal. Negative = public overestimates.
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={PILLARS.map(p => ({ name: p.name.split(' ')[0], public: company.public_data[p.id], proprietary: company.proprietary_data[p.id], delta: company.proprietary_data[p.id] - company.public_data[p.id], color: p.color }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="public" name="Public Score" fill={T.blue} opacity={0.7} />
                  <Bar dataKey="proprietary" name="Proprietary Score" fill={T.purple} opacity={0.8} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10 }}>
              {PILLARS.map(p => {
                const delta = company.proprietary_data[p.id] - company.public_data[p.id];
                return (
                  <div key={p.id} style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: 14, textAlign: 'center' }}>
                    <div style={{ fontSize: 20 }}>{p.icon}</div>
                    <div style={{ fontSize: 11, color: T.textSec, margin: '6px 0 4px' }}>{p.name.split(' ')[0]}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 700, color: delta > 0 ? T.green : delta < 0 ? T.red : T.textMut }}>
                      {delta > 0 ? '+' : ''}{delta}
                    </div>
                    <div style={{ fontSize: 10, color: T.textMut }}>delta pts</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Signal Feed */}
        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Recent News Signals — {company.name}</h3>
                {company.news_signals.map((sig, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.gold, marginTop: 5, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: T.navy }}>{sig}</span>
                  </div>
                ))}
                <div style={{ marginTop: 16, padding: 12, background: T.bg, borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: T.textSec }}>Signal Sentiment (proprietary NLP model)</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <span style={{ background: T.green + '22', color: T.green, padding: '4px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>+Positive: 1</span>
                    <span style={{ background: T.amber + '22', color: T.amber, padding: '4px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>~Neutral: 1</span>
                    <span style={{ background: T.red + '22', color: T.red, padding: '4px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>-Negative: 1</span>
                  </div>
                </div>
              </div>

              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Transition Risk Score Summary</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Composite Score', val: score.toFixed(1), col: rating.color },
                    { label: 'Rating', val: rating.label, col: rating.color },
                    { label: 'ITR', val: `${company.itr}°C`, col: company.itr < 2 ? T.green : company.itr < 2.5 ? T.amber : T.red },
                    { label: 'SBTi Validated', val: company.sbti ? `Yes (${company.sbti_year})` : 'No', col: company.sbti ? T.green : T.red },
                    { label: 'Data Tier', val: usePropriety ? 'Proprietary' : 'Public', col: usePropriety ? T.purple : T.blue },
                  ].map(m => (
                    <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: T.bg, borderRadius: 8 }}>
                      <span style={{ fontSize: 13, color: T.textSec }}>{m.label}</span>
                      <span style={{ fontFamily: T.mono, fontWeight: 700, color: m.col, fontSize: 14 }}>{m.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Universe Ranking */}
        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Universe Ranking — {usePropriety ? 'Proprietary' : 'Public'} Data Tier</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={rankings.map(c => ({ name: c.name.split(' ')[0], score: usePropriety ? c.prop_score : c.public_score, color: c.color }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`${v.toFixed(1)}`, 'Transition Score']} />
                  <Bar dataKey="score" name="Score" radius={[6,6,0,0]}>
                    {rankings.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Bar>
                  <ReferenceLine y={60} stroke={T.textMut} strokeDasharray="4 4" label={{ value: 'B threshold', fill: T.textMut, fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.navy }}>
                    <th style={{ padding: '10px 12px', color: '#fff', fontWeight: 600, textAlign: 'left' }}>#</th>
                    <th style={{ padding: '10px 12px', color: '#fff', fontWeight: 600, textAlign: 'left' }}>Company</th>
                    <th style={{ padding: '10px 12px', color: '#fff', fontWeight: 600, textAlign: 'left' }}>Sector</th>
                    {PILLARS.map(p => <th key={p.id} style={{ padding: '10px 8px', color: '#fff', fontWeight: 600, textAlign: 'center', fontSize: 11 }}>{p.icon}</th>)}
                    <th style={{ padding: '10px 12px', color: '#fff', fontWeight: 600, textAlign: 'center' }}>Score</th>
                    <th style={{ padding: '10px 12px', color: '#fff', fontWeight: 600, textAlign: 'center' }}>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((c, i) => {
                    const cData = usePropriety ? c.proprietary_data : c.public_data;
                    return (
                      <tr key={c.id} style={{ background: c.id === selected ? c.color + '08' : i % 2 === 0 ? T.surface : T.bg, cursor: 'pointer' }} onClick={() => setSelected(c.id)}>
                        <td style={{ padding: '9px 12px', fontFamily: T.mono, color: T.textMut }}>{i + 1}</td>
                        <td style={{ padding: '9px 12px', fontWeight: 600, color: T.navy }}>{c.name}</td>
                        <td style={{ padding: '9px 12px', color: T.textSec, fontSize: 12 }}>{c.sector}</td>
                        {PILLARS.map(p => (
                          <td key={p.id} style={{ padding: '9px 8px', textAlign: 'center', fontFamily: T.mono, fontSize: 12, color: cData[p.id] > 65 ? T.green : cData[p.id] > 40 ? T.amber : T.red, fontWeight: 700 }}>{cData[p.id]}</td>
                        ))}
                        <td style={{ padding: '9px 12px', textAlign: 'center', fontFamily: T.mono, fontWeight: 700, fontSize: 16, color: c.rating.color }}>
                          {usePropriety ? c.prop_score.toFixed(1) : c.public_score.toFixed(1)}
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                          <span style={{ background: c.rating.color + '22', color: c.rating.color, padding: '3px 10px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>{c.rating.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
