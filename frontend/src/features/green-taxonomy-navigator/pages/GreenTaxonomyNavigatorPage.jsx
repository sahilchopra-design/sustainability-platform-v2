import React, { useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', navy:'#1b3a5c', gold:'#c5a96a', sage:'#5a8a6a', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', teal:'#0f766e', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const tip = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 11 };

const JURISDICTIONS = [
  { name: 'EU Taxonomy',     region: 'Europe',    status: 'In Force',  year: 2020, envObj: 6,  activities: 1018, screening: 'Mandatory', transitional: true,  dnsh: true,  socialMin: true,  interop: 85, color: '#1e40af' },
  { name: 'UK Green Tax.',   region: 'UK',         status: 'In Force',  year: 2023, envObj: 4,  activities: 196,  screening: 'Voluntary', transitional: true,  dnsh: true,  socialMin: false, interop: 80, color: '#be185d' },
  { name: 'Singapore GTF',   region: 'APAC',       status: 'In Force',  year: 2023, envObj: 4,  activities: 270,  screening: 'Voluntary', transitional: true,  dnsh: false, socialMin: false, interop: 70, color: '#0891b2' },
  { name: 'China GTaxonomy', region: 'Asia',       status: 'In Force',  year: 2021, envObj: 3,  activities: 211,  screening: 'Mandatory', transitional: false, dnsh: false, socialMin: false, interop: 60, color: '#dc2626' },
  { name: 'India GTaxonomy', region: 'Asia',       status: 'Developing',year: 2024, envObj: 3,  activities: 150,  screening: 'Proposed',  transitional: true,  dnsh: false, socialMin: false, interop: 55, color: '#f59e0b' },
  { name: 'Malaysia GTax.',  region: 'APAC',       status: 'In Force',  year: 2022, envObj: 5,  activities: 166,  screening: 'Voluntary', transitional: true,  dnsh: false, socialMin: false, interop: 65, color: '#059669' },
  { name: 'Canada SFAF',     region: 'Americas',   status: 'In Force',  year: 2024, envObj: 4,  activities: 82,   screening: 'Voluntary', transitional: true,  dnsh: false, socialMin: false, interop: 72, color: '#7c3aed' },
  { name: 'South Africa',    region: 'Africa',     status: 'Developing',year: 2024, envObj: 3,  activities: 65,   screening: 'Proposed',  transitional: true,  dnsh: false, socialMin: false, interop: 48, color: '#78350f' },
];

const ACTIVITIES_COMPARE = [
  { activity: 'Solar PV',           eu: 'Eligible', uk: 'Eligible', sg: 'Eligible', cn: 'Eligible', in_: 'Proposed', my: 'Eligible' },
  { activity: 'Wind Power',         eu: 'Eligible', uk: 'Eligible', sg: 'Eligible', cn: 'Eligible', in_: 'Proposed', my: 'Eligible' },
  { activity: 'Natural Gas CCGT',   eu: 'Transition', uk: 'Review', sg: 'Amber', cn: 'Eligible', in_: 'Eligible', my: 'Amber' },
  { activity: 'Nuclear Power',      eu: 'Transition', uk: 'Eligible', sg: 'N/A', cn: 'N/A', in_: 'Eligible', my: 'N/A' },
  { activity: 'Green Hydrogen',     eu: 'Eligible', uk: 'Eligible', sg: 'Eligible', cn: 'Eligible', in_: 'Proposed', my: 'Eligible' },
  { activity: 'EV Manufacturing',   eu: 'Eligible', uk: 'Eligible', sg: 'Eligible', cn: 'Eligible', in_: 'Proposed', my: 'Eligible' },
  { activity: 'Sustainable Agri.',  eu: 'Eligible', uk: 'Review', sg: 'Amber', cn: 'Eligible', in_: 'Proposed', my: 'Eligible' },
  { activity: 'Coal Power',         eu: 'Not Eligible', uk: 'Not Eligible', sg: 'Not Eligible', cn: 'Excluded', in_: 'Amber', my: 'Not Eligible' },
  { activity: 'Green Buildings',    eu: 'Eligible', uk: 'Eligible', sg: 'Eligible', cn: 'Eligible', in_: 'Proposed', my: 'Eligible' },
  { activity: 'Blue Hydrogen',      eu: 'Transition', uk: 'Transition', sg: 'Amber', cn: 'Eligible', in_: 'Eligible', my: 'Amber' },
];

const TRANSITION_CATEGORIES = [
  { name: 'EU Taxonomy — Enabling Activities', criteria: 'Activities enabling other activities to substantially contribute to at least one environmental objective', examples: 'Smart grid tech, EV charging, energy storage, digital twins for energy', color: T.teal },
  { name: 'EU Taxonomy — Transitional Activities', criteria: 'Activities with best-available technology performance & credible transition pathway to net zero', examples: 'Natural gas (until 2030/2035), nuclear, cement with CCS pathway', color: T.gold },
  { name: 'Singapore — Amber Category', criteria: 'Activities in transition; time-limited recognition pending sector decarbonisation roadmap', examples: 'LNG import terminals, new gas power (sunset 2030), aviation biofuels', color: T.amber },
  { name: 'UK GTF — Amber / Watch', criteria: 'Activities under review; recognised for limited period while awaiting TSC finalisation', examples: 'Biomass power, natural gas CCS, aviation SAF', color: '#be185d' },
  { name: 'China — Restricted Category', criteria: 'Activities transitioning from coal but not yet clean; green bond proceeds cannot fund new coal', examples: 'Coal clean combustion upgrades, coal-fired co-generation with CHP', color: T.red },
  { name: 'IPSF Common Ground — "Eligible in Both"', criteria: 'Activity eligible under both EU and China taxonomies — highest capital allocation confidence', examples: 'Solar, wind, hydro, EV, rail, bioenergy, energy efficiency in buildings', color: T.sage },
];

const INTEROP_DATA = JURISDICTIONS.map(j => ({ jurisdiction: j.name, score: j.interop }));

const TABS = ['Overview', 'Jurisdiction Comparison', 'Activity Screener', 'Transition Categories', 'IPSF Interoperability'];

const STAT = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px', borderTop: `3px solid ${color || T.sage}` }}>
    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function GreenTaxonomyNavigatorPage() {
  const [tab, setTab] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const statusColor = s => ({ 'In Force': T.sage, 'Developing': T.amber, 'Proposed': T.textMut }[s] || T.textMut);
  const eligColor = s => ({ Eligible: T.sage, Transition: T.amber, Amber: T.amber, 'Not Eligible': T.red, Excluded: T.red, Proposed: T.textMut, 'N/A': T.textMut, Review: '#0891b2' }[s] || T.textMut);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto', fontFamily: T.font }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#05996918', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📋</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: T.navy, margin: 0 }}>Green Taxonomy Navigator</h1>
            <span style={{ fontSize: 10, background: '#05996918', color: '#059669', padding: '3px 8px', borderRadius: 20, fontWeight: 700 }}>EP-AA5</span>
          </div>
          <p style={{ color: T.textSec, fontSize: 13, margin: 0 }}>8 Jurisdictions · EU · UK · Singapore · China · India · Malaysia · Canada · South Africa · IPSF Interoperability</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ label: '8 Jurisdictions', color: T.sage }, { label: 'IPSF Common Ground', color: '#059669' }, { label: 'Transition Categories', color: T.amber }].map(b => (
            <span key={b.label} style={{ fontSize: 10, background: b.color + '18', color: b.color, padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>{b.label}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${T.border}` }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: tab === i ? '#059669' : T.textSec, borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent', marginBottom: -1, transition: 'color 0.15s' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
            <STAT label="Jurisdictions Tracked" value="8" sub="EU, UK, SG, CN, IN, MY, CA, ZA" color={T.sage} />
            <STAT label="Total Activities Mapped" value="2,158" sub="Cross-jurisdiction with overlap" color={T.teal} />
            <STAT label="IPSF Common Ground" value="80+" sub="Activities eligible in EU and China both" color="#059669" />
            <STAT label="Highest Interoperability" value="EU–UK" sub="85/100 alignment score" color="#be185d" />
            <STAT label="Transition Categories" value="6" sub="Time-limited transitional activity rules" color={T.amber} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {JURISDICTIONS.map(j => (
              <div key={j.name} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px', borderLeft: `4px solid ${j.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{j.name}</div>
                  <span style={{ fontSize: 10, background: statusColor(j.status) + '18', color: statusColor(j.status), padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{j.status}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, color: T.textSec }}>
                  <div>Env. Objectives: <strong style={{ color: T.navy }}>{j.envObj}</strong></div>
                  <div>Activities: <strong style={{ color: T.navy }}>{j.activities}</strong></div>
                  <div>Year: <strong style={{ color: T.navy }}>{j.year}</strong></div>
                  <div>DNSH: <strong style={{ color: j.dnsh ? T.sage : T.textMut }}>{j.dnsh ? '✅ Yes' : '❌ No'}</strong></div>
                </div>
                <div style={{ marginTop: 8, height: 4, background: T.border, borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${j.interop}%`, background: j.color, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 3 }}>EU interoperability: {j.interop}/100</div>
              </div>
            ))}
          </div>

          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Interoperability Score vs EU Taxonomy</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={INTEROP_DATA} margin={{ bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="jurisdiction" tick={{ fontSize: 9, fill: T.textMut }} angle={-20} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10, fill: T.textMut }} domain={[0, 100]} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => `${v}/100`} contentStyle={tip} />
                <Bar dataKey="score" name="Interoperability Score" radius={[4, 4, 0, 0]}>
                  {INTEROP_DATA.map((d, i) => <Cell key={i} fill={JURISDICTIONS[i].color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Jurisdiction Comparison — Environmental Objectives & Key Features</div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f6f4f0' }}>
                  {['Taxonomy', 'Region', 'Status', 'Env. Obj.', 'Activities', 'Screening', 'DNSH', 'Social Min.', 'Transitional', 'EU Interop.'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {JURISDICTIONS.map((j, i) => (
                  <tr key={j.name} style={{ background: i % 2 === 0 ? T.surface : '#fafaf8', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: j.color }}>{j.name}</td>
                    <td style={{ padding: '10px 12px', color: T.textSec }}>{j.region}</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ fontSize: 10, background: statusColor(j.status) + '18', color: statusColor(j.status), padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{j.status}</span></td>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>{j.envObj}</td>
                    <td style={{ padding: '10px 12px' }}>{j.activities}</td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: T.textSec }}>{j.screening}</td>
                    <td style={{ padding: '10px 12px', color: j.dnsh ? T.sage : T.red }}>{j.dnsh ? '✅' : '❌'}</td>
                    <td style={{ padding: '10px 12px', color: j.socialMin ? T.sage : T.red }}>{j.socialMin ? '✅' : '❌'}</td>
                    <td style={{ padding: '10px 12px', color: j.transitional ? T.amber : T.textMut }}>{j.transitional ? '✅' : '❌'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ height: 6, width: 60, background: T.border, borderRadius: 3 }}>
                          <div style={{ height: '100%', width: `${j.interop}%`, background: j.color, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: j.color }}>{j.interop}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Activity Screener — Cross-Jurisdiction Eligibility</div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f6f4f0' }}>
                  {['Activity', 'EU Taxonomy', 'UK GTF', 'Singapore GTF', 'China GTaxonomy', 'India (Prop.)', 'Malaysia'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ACTIVITIES_COMPARE.map((r, i) => (
                  <tr key={r.activity} onClick={() => setSelectedActivity(selectedActivity === r.activity ? null : r.activity)} style={{ background: selectedActivity === r.activity ? '#f0f9f4' : i % 2 === 0 ? T.surface : '#fafaf8', borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: T.navy }}>{r.activity}</td>
                    {[r.eu, r.uk, r.sg, r.cn, r.in_, r.my].map((v, j) => (
                      <td key={j} style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 10, background: eligColor(v) + '18', color: eligColor(v), padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{v}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[{ label: 'Eligible', color: T.sage }, { label: 'Transition/Amber', color: T.amber }, { label: 'Not Eligible', color: T.red }, { label: 'Proposed', color: T.textMut }, { label: 'Under Review', color: '#0891b2' }, { label: 'N/A', color: T.border }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textSec }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color + '80' }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Transition & Amber Categories by Jurisdiction</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {TRANSITION_CATEGORIES.map(c => (
              <div key={c.name} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px', borderLeft: `4px solid ${c.color}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{c.name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, marginBottom: 3 }}>CRITERIA</div>
                    <div style={{ fontSize: 12, color: T.textSec }}>{c.criteria}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, marginBottom: 3 }}>EXAMPLES</div>
                    <div style={{ fontSize: 12, color: T.textSec }}>{c.examples}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>IPSF — International Platform on Sustainable Finance: Common Ground Taxonomy</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>IPSF CGT Phase 2 — EU × China Mapping</div>
              {[
                { category: 'Fully aligned activities', count: 83, desc: 'Eligible under both EU Taxonomy and China Green Bond Catalogue without conditions' },
                { category: 'Conditionally aligned', count: 24, desc: 'Eligible in both with additional screening criteria or time limits' },
                { category: 'Divergent approaches', count: 41, desc: 'Activity eligible in one taxonomy but not the other — mainly nuclear, gas, and coal transition' },
                { category: 'EU only', count: 870, desc: 'Activities in EU Taxonomy not covered by China CGT — biodiversity, water, circular economy' },
                { category: 'China only', count: 103, desc: 'Activities in China CGT not in EU Taxonomy — some manufacturing, coal clean tech' },
              ].map(r => (
                <div key={r.category} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{r.category}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: T.sage }}>{r.count}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textMut }}>{r.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Interoperability Score by Jurisdiction (vs EU)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={JURISDICTIONS.filter(j => j.name !== 'EU Taxonomy')} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMut }} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: T.textSec }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => `${v}/100`} contentStyle={tip} />
                  <Bar dataKey="interop" name="Interop Score" radius={[0, 4, 4, 0]}>
                    {JURISDICTIONS.filter(j => j.name !== 'EU Taxonomy').map((j, i) => (
                      <Cell key={i} fill={j.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: T.sage + '10', border: `1px solid ${T.sage}40`, borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.sage, marginBottom: 10 }}>IPSF Platform — 26 Member Jurisdictions</div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>The International Platform on Sustainable Finance brings together jurisdictions responsible for over 55% of global greenhouse gas emissions. The CGT report published in 2021 mapped the EU and China taxonomies — Phase 2 expanded to India, Malaysia, and Singapore in 2023.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['EU', 'China', 'India', 'Japan', 'UK', 'Singapore', 'Canada', 'South Africa', 'Kenya', 'Brazil', 'Mexico', 'Indonesia', 'Norway', 'New Zealand', 'Australia', 'Switzerland', 'Morocco', 'Georgia', 'Serbia', 'North Macedonia'].map(m => (
                <span key={m} style={{ fontSize: 11, background: T.border, color: T.textSec, padding: '3px 10px', borderRadius: 12 }}>{m}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
