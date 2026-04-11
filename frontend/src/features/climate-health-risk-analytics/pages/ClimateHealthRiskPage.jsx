import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const INCOME_GROUPS = ['Low Income', 'Lower-Middle', 'Upper-Middle', 'High Income'];
const DISEASES = ['Malaria', 'Dengue', 'Cholera', 'Respiratory', 'Heat Stroke', 'Malnutrition', 'Vector-borne', 'Mental Health'];

const COUNTRIES = Array.from({ length: 75 }, (_, i) => {
  const names = ['India','Bangladesh','Pakistan','Nigeria','Ethiopia','Kenya','Tanzania','Ghana','Mozambique','Zimbabwe','Madagascar','Mali','Niger','Burkina Faso','Senegal','Cambodia','Laos','Myanmar','Philippines','Vietnam','Indonesia','Thailand','Sri Lanka','Nepal','Afghanistan','Yemen','Sudan','Somalia','South Sudan','Haiti','Guatemala','Honduras','El Salvador','Bolivia','Ecuador','Peru','Colombia','Mexico','Brazil','Argentina','Chile','Egypt','Morocco','Tunisia','Algeria','Libya','Jordan','Lebanon','Iraq','Iran','Turkey','Uzbekistan','Tajikistan','Kyrgyzstan','Kazakhstan','Mongolia','Papua New Guinea','Fiji','Vanuatu','Solomon Islands','Maldives','Tuvalu','Kiribati','Timor-Leste','Bhutan','Zimbabwe','Zambia','Malawi','Rwanda','Uganda','Burundi','Sierra Leone','Guinea','Liberia'];
  const ig = INCOME_GROUPS[Math.floor(sr(i * 7) * INCOME_GROUPS.length)];
  const mortPer100k = 2 + sr(i * 11) * 48;
  const daly = 500 + sr(i * 13) * 4500;
  const whoCost = 0.1 + sr(i * 17) * 9.9;
  const adaptNeed = 0.05 + sr(i * 19) * 2.95;
  const ahi = 30 + sr(i * 23) * 60;
  const vulnerability = 10 + sr(i * 29) * 90;
  const healthExpPct = 1 + sr(i * 31) * 9;
  const rcp85mortality = mortPer100k * (1.4 + sr(i * 37) * 1.6);
  return { id: i, name: names[i] || `Country ${i+1}`, incomeGroup: ig, mortPer100k: +mortPer100k.toFixed(2), daly: +daly.toFixed(0), whoCost: +whoCost.toFixed(2), adaptNeed: +adaptNeed.toFixed(3), ahi: +ahi.toFixed(1), vulnerability: +vulnerability.toFixed(1), healthExpPct: +healthExpPct.toFixed(1), rcp85mortality: +rcp85mortality.toFixed(2) };
});

const DISEASE_BURDEN = DISEASES.map((d, i) => ({
  disease: d,
  globalDaly: Math.round(50000 + sr(i * 41) * 450000),
  climateFraction: +(20 + sr(i * 43) * 60).toFixed(1),
  projectedIncrease: +(10 + sr(i * 47) * 90).toFixed(1),
  economicCostBn: +(1 + sr(i * 53) * 49).toFixed(1),
  treatmentGapPct: +(20 + sr(i * 59) * 70).toFixed(1),
}));

const TABS = ['Overview', 'Mortality Projections', 'Disease Burden', 'WHO Cost Framework', 'Vulnerability Index', 'Health System Capacity', 'Investment Needs', 'Policy Tracker'];

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 16px', borderTop: `3px solid ${color || T.gold}` }}>
      <div style={{ fontSize: 10, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontFamily: T.fontMono }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Bar({ pct, color }) {
  return (
    <div style={{ background: T.borderL, borderRadius: 2, height: 6, width: '100%' }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', borderRadius: 2, background: color || T.gold }} />
    </div>
  );
}

export default function ClimateHealthRiskPage() {
  const [tab, setTab] = useState(0);
  const [incomeFilter, setIncomeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('mortPer100k');
  const [scenario, setScenario] = useState('RCP4.5');

  const filtered = useMemo(() => {
    const base = COUNTRIES.filter(c => incomeFilter === 'All' || c.incomeGroup === incomeFilter);
    return [...base].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [incomeFilter, sortBy]);

  const avgMort = filtered.length ? (filtered.reduce((a, c) => a + c.mortPer100k, 0) / filtered.length).toFixed(2) : '0.00';
  const totalDaly = filtered.reduce((a, c) => a + c.daly, 0).toLocaleString();
  const totalWho = filtered.reduce((a, c) => a + c.whoCost, 0).toFixed(1);
  const totalAdapt = filtered.reduce((a, c) => a + c.adaptNeed, 0).toFixed(2);
  const avgVuln = filtered.length ? (filtered.reduce((a, c) => a + c.vulnerability, 0) / filtered.length).toFixed(1) : '0.0';
  const highRisk = filtered.filter(c => c.vulnerability > 70).length;

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto', fontFamily: "'DM Sans', sans-serif", background: T.bg, minHeight: '100vh' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>EP-DP2 · HEALTH & CLIMATE WELLBEING</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: T.navy, margin: 0 }}>Climate Health Risk Analytics</h1>
            <p style={{ color: T.textSec, fontSize: 13, marginTop: 4 }}>Mortality projections · Disease burden · WHO cost frameworks — 75 countries</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['RCP2.6', 'RCP4.5', 'RCP8.5'].map(s => (
              <button key={s} onClick={() => setScenario(s)} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.border}`, background: scenario === s ? T.navy : T.card, color: scenario === s ? '#fff' : T.navy, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Avg Mortality/100k" value={avgMort} sub="Climate-attributed" color={T.red} />
        <KpiCard label="Total DALYs" value={totalDaly} sub="Disability-adjusted" color={T.orange} />
        <KpiCard label="WHO Health Cost" value={`$${totalWho}Bn`} sub="Annual burden" color={T.indigo} />
        <KpiCard label="Adapt Finance Need" value={`$${totalAdapt}Bn`} sub="Health resilience" color={T.teal} />
        <KpiCard label="Avg Vulnerability" value={`${avgVuln}/100`} sub="ND-GAIN composite" color={T.amber} />
        <KpiCard label="High-Risk Countries" value={highRisk} sub="Vulnerability > 70" color={T.red} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={incomeFilter} onChange={e => setIncomeFilter(e.target.value)} style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, background: T.card, color: T.navy }}>
          <option value="All">All Income Groups</option>
          {INCOME_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, background: T.card, color: T.navy }}>
          <option value="mortPer100k">Sort: Mortality</option>
          <option value="daly">Sort: DALYs</option>
          <option value="vulnerability">Sort: Vulnerability</option>
          <option value="whoCost">Sort: WHO Cost</option>
        </select>
        <span style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center' }}>{filtered.length} countries</span>
      </div>

      <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: `2px solid ${T.border}` }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 14px', border: 'none', background: 'none', borderBottom: tab === i ? `2px solid ${T.navy}` : '2px solid transparent', color: tab === i ? T.navy : T.textSec, fontWeight: tab === i ? 700 : 400, fontSize: 12, cursor: 'pointer', marginBottom: -2 }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Highest Mortality Countries</div>
            {filtered.slice(0, 12).map((c, i) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontFamily: T.fontMono, color: T.textSec, width: 18 }}>{i + 1}</span>
                <span style={{ fontSize: 13, color: T.navy, flex: 1 }}>{c.name}</span>
                <span style={{ fontSize: 10, color: T.textSec, width: 80 }}>{c.incomeGroup}</span>
                <span style={{ fontSize: 12, fontFamily: T.fontMono, color: c.mortPer100k > 30 ? T.red : c.mortPer100k > 15 ? T.amber : T.sage }}>{c.mortPer100k}/100k</span>
                <div style={{ width: 60 }}><Bar pct={c.mortPer100k / 50 * 100} color={c.mortPer100k > 30 ? T.red : T.amber} /></div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Disease Burden Overview</div>
            {DISEASE_BURDEN.map(d => (
              <div key={d.disease} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 13, color: T.navy }}>{d.disease}</span>
                  <span style={{ fontSize: 11, fontFamily: T.fontMono, color: T.textSec }}>{d.climateFraction}% climate-driven</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Bar pct={d.climateFraction} color={T.red} />
                  <span style={{ fontSize: 11, fontFamily: T.fontMono, color: T.indigo, whiteSpace: 'nowrap' }}>${d.economicCostBn}Bn</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Mortality Projections — {scenario} Pathway</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {filtered.slice(0, 32).map(c => {
              const mult = scenario === 'RCP8.5' ? 2.0 : scenario === 'RCP4.5' ? 1.5 : 1.2;
              const proj = (c.mortPer100k * mult).toFixed(2);
              return (
                <div key={c.id} style={{ background: T.sub, borderRadius: 6, padding: '10px 12px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: T.textSec, marginBottom: 6 }}>{c.incomeGroup}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 10, color: T.textSec }}>Baseline</div>
                      <div style={{ fontSize: 16, fontFamily: T.fontMono, fontWeight: 700, color: T.navy }}>{c.mortPer100k}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: T.red }}>{scenario}</div>
                      <div style={{ fontSize: 16, fontFamily: T.fontMono, fontWeight: 700, color: T.red }}>{proj}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Disease Burden Analysis — Climate-Attributed DALYs</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Disease', 'Global DALYs', 'Climate Fraction %', 'Projected Increase %', 'Economic Cost $Bn', 'Treatment Gap %'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, color: T.textSec, fontFamily: T.fontMono, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DISEASE_BURDEN.map((d, i) => (
                    <tr key={d.disease} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{d.disease}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{d.globalDaly.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: d.climateFraction > 50 ? T.red : T.amber }}>{d.climateFraction}%</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.orange }}>+{d.projectedIncrease}%</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.indigo }}>${d.economicCostBn}Bn</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.red }}>{d.treatmentGapPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>WHO Cost Framework — Country-Level Health Expenditure</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {filtered.slice(0, 20).map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: T.sub, borderRadius: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{c.incomeGroup} · Health Exp: {c.healthExpPct}% GDP</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, fontFamily: T.fontMono, color: T.indigo }}>${c.whoCost}Bn</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>annual WHO cost</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Vulnerability Index (ND-GAIN Composite)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[...filtered].sort((a, b) => b.vulnerability - a.vulnerability).slice(0, 30).map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: T.sub, borderRadius: 6, borderLeft: `3px solid ${c.vulnerability > 70 ? T.red : c.vulnerability > 50 ? T.amber : T.sage}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: T.textSec }}>{c.incomeGroup}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: T.fontMono, color: c.vulnerability > 70 ? T.red : c.vulnerability > 50 ? T.amber : T.sage }}>{c.vulnerability}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Health System Capacity — Adaptive Health Index (AHI)</div>
          {filtered.slice(0, 30).map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ width: 120, fontSize: 13, color: T.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
              <div style={{ flex: 1 }}><Bar pct={c.ahi} color={c.ahi > 70 ? T.sage : c.ahi > 40 ? T.amber : T.red} /></div>
              <span style={{ fontFamily: T.fontMono, fontSize: 12, width: 40 }}>{c.ahi}</span>
              <span style={{ fontSize: 10, color: T.textSec, width: 80 }}>{c.ahi > 70 ? 'Resilient' : c.ahi > 40 ? 'Moderate' : 'Fragile'}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 6 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {filtered.slice(0, 24).map(c => (
            <div key={c.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, color: T.navy, marginBottom: 2 }}>{c.name}</div>
              <div style={{ fontSize: 10, color: T.textSec, marginBottom: 10 }}>{c.incomeGroup}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { label: 'Adapt Need', val: `$${c.adaptNeed}Bn`, color: T.teal },
                  { label: 'DALYs', val: c.daly.toLocaleString(), color: T.orange },
                  { label: 'WHO Cost', val: `$${c.whoCost}Bn`, color: T.indigo },
                  { label: 'Vuln Score', val: c.vulnerability, color: c.vulnerability > 70 ? T.red : T.amber },
                ].map(item => (
                  <div key={item.label} style={{ background: T.sub, borderRadius: 4, padding: '6px 8px' }}>
                    <div style={{ fontSize: 9, color: T.textSec }}>{item.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: T.fontMono, color: item.color }}>{item.val}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 7 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>WHO Health Policy Framework — Climate Adaptation Milestones</div>
            {[
              { policy: 'WHO Climate & Health Country Profiles', status: 'ACTIVE', coverage: 115, deadline: '2025', color: T.sage },
              { policy: 'National Adaptation Plans (Health)', status: 'ACTIVE', coverage: 64, deadline: '2025', color: T.sage },
              { policy: 'WHO Global Action Plan for Healthy Lives', status: 'ACTIVE', coverage: 194, deadline: '2030', color: T.amber },
              { policy: 'UNFCCC Health & Climate Nexus Framework', status: 'PROPOSED', coverage: 0, deadline: '2026', color: T.blue },
              { policy: 'IPCC AR6 Health Chapter Commitments', status: 'MONITORING', coverage: 120, deadline: '2030', color: T.amber },
              { policy: 'Lancet Countdown Health-Climate Indicators', status: 'ACTIVE', coverage: 43, deadline: 'Annual', color: T.sage },
              { policy: 'GCF Health Resilience Window', status: 'ACTIVE', coverage: 52, deadline: '2030', color: T.teal },
              { policy: 'Paris Agreement Article 8 Loss & Damage', status: 'ACTIVE', coverage: 196, deadline: '2030', color: T.indigo },
            ].map(p => (
              <div key={p.policy} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px', marginBottom: 8, background: T.sub, borderRadius: 6, borderLeft: `3px solid ${p.color}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{p.policy}</div>
                  <div style={{ fontSize: 10, color: T.textSec }}>Coverage: {p.coverage} countries · Deadline: {p.deadline}</div>
                </div>
                <span style={{ fontSize: 10, fontFamily: T.fontMono, fontWeight: 600, color: p.color, background: `${p.color}18`, padding: '3px 10px', borderRadius: 4 }}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
