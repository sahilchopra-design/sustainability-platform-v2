import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const PATHOGENS = ['SARS-CoV-3 variant', 'Nipah virus', 'Rift Valley Fever', 'Hantavirus', 'Marburg virus', 'West Nile virus', 'Dengue (super-strain)', 'Avian H5N1'];
const SCENARIO_TYPES = ['Optimistic', 'Baseline', 'Severe', 'Catastrophic'];

const SCENARIOS = Array.from({ length: 50 }, (_, i) => {
  const pathIdx = Math.floor(sr(i * 5) * PATHOGENS.length);
  const stIdx = Math.floor(sr(i * 7) * SCENARIO_TYPES.length);
  const climateAmp = 1 + sr(i * 11) * 4;
  const econLoss = 0.5 + sr(i * 13) * 99.5;
  const probNextDecade = 5 + sr(i * 17) * 45;
  const mortalityMn = 0.1 + sr(i * 19) * 9.9;
  const healthSysResilience = 20 + sr(i * 23) * 70;
  const zoonoticRisk = 10 + sr(i * 29) * 90;
  const insuranceGap = 30 + sr(i * 31) * 60;
  const preparednessIdx = 20 + sr(i * 37) * 70;
  return {
    id: i,
    name: `${PATHOGENS[pathIdx]} — ${SCENARIO_TYPES[stIdx]}`,
    pathogen: PATHOGENS[pathIdx],
    scenarioType: SCENARIO_TYPES[stIdx],
    climateAmp: +climateAmp.toFixed(2),
    econLoss: +econLoss.toFixed(1),
    probNextDecade: +probNextDecade.toFixed(1),
    mortalityMn: +mortalityMn.toFixed(2),
    healthSysResilience: +healthSysResilience.toFixed(1),
    zoonoticRisk: +zoonoticRisk.toFixed(1),
    insuranceGap: +insuranceGap.toFixed(1),
    preparednessIdx: +preparednessIdx.toFixed(1),
  };
});

const PATHOGEN_DATA = PATHOGENS.map((p, i) => ({
  pathogen: p,
  habitatExpansion: +(10 + sr(i * 41) * 60).toFixed(1),
  spilloverRisk: +(5 + sr(i * 43) * 85).toFixed(1),
  rcpAmplification: +(1.1 + sr(i * 47) * 2.9).toFixed(2),
  pandemicPotential: +(10 + sr(i * 53) * 80).toFixed(1),
  financialExposure: +(5 + sr(i * 59) * 295).toFixed(0),
}));

const TABS = ['Overview', 'Scenario Matrix', 'Climate Amplification', 'Zoonotic Risk', 'Health System Resilience', 'Financial Exposure', 'Insurance Architecture', 'Preparedness Finance'];

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

export default function PandemicClimateFinancePage() {
  const [tab, setTab] = useState(0);
  const [pathogenFilter, setPathogenFilter] = useState('All');
  const [scenarioFilter, setScenarioFilter] = useState('All');

  const filtered = useMemo(() => {
    return SCENARIOS.filter(s =>
      (pathogenFilter === 'All' || s.pathogen === pathogenFilter) &&
      (scenarioFilter === 'All' || s.scenarioType === scenarioFilter)
    );
  }, [pathogenFilter, scenarioFilter]);

  const avgClimAmp = filtered.length ? (filtered.reduce((a, s) => a + s.climateAmp, 0) / filtered.length).toFixed(2) : '0.00';
  const totalEconLoss = filtered.reduce((a, s) => a + s.econLoss, 0).toFixed(1);
  const avgZoonotic = filtered.length ? (filtered.reduce((a, s) => a + s.zoonoticRisk, 0) / filtered.length).toFixed(1) : '0.0';
  const avgResilience = filtered.length ? (filtered.reduce((a, s) => a + s.healthSysResilience, 0) / filtered.length).toFixed(1) : '0.0';
  const avgInsGap = filtered.length ? (filtered.reduce((a, s) => a + s.insuranceGap, 0) / filtered.length).toFixed(1) : '0.0';
  const highRiskCount = filtered.filter(s => s.zoonoticRisk > 70 || s.climateAmp > 3).length;

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto', fontFamily: "'DM Sans', sans-serif", background: T.bg, minHeight: '100vh' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>EP-DP4 · HEALTH & CLIMATE WELLBEING</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: T.navy, margin: 0 }}>Pandemic Climate Finance</h1>
            <p style={{ color: T.textSec, fontSize: 13, marginTop: 4 }}>Climate-pandemic nexus · Zoonotic risk · Health system resilience — 50 scenarios · 8 pathogens</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Avg Climate Amp." value={`×${avgClimAmp}`} sub="Transmission factor" color={T.red} />
        <KpiCard label="Total Econ Loss" value={`$${totalEconLoss}Bn`} sub="Scenario aggregate" color={T.orange} />
        <KpiCard label="Avg Zoonotic Risk" value={`${avgZoonotic}/100`} sub="Spillover index" color={T.purple} />
        <KpiCard label="Avg Health Resilience" value={`${avgResilience}/100`} sub="System capacity" color={T.teal} />
        <KpiCard label="Avg Insurance Gap" value={`${avgInsGap}%`} sub="Uncovered losses" color={T.amber} />
        <KpiCard label="High-Risk Scenarios" value={highRiskCount} sub="Zoonotic>70 or Amp>3×" color={T.red} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={pathogenFilter} onChange={e => setPathogenFilter(e.target.value)} style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, background: T.card, color: T.navy }}>
          <option value="All">All Pathogens</option>
          {PATHOGENS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={scenarioFilter} onChange={e => setScenarioFilter(e.target.value)} style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, background: T.card, color: T.navy }}>
          <option value="All">All Scenarios</option>
          {SCENARIO_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center' }}>{filtered.length} scenarios</span>
      </div>

      <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: `2px solid ${T.border}` }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 14px', border: 'none', background: 'none', borderBottom: tab === i ? `2px solid ${T.navy}` : '2px solid transparent', color: tab === i ? T.navy : T.textSec, fontWeight: tab === i ? 700 : 400, fontSize: 12, cursor: 'pointer', marginBottom: -2 }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Highest Economic Loss Scenarios</div>
            {[...filtered].sort((a, b) => b.econLoss - a.econLoss).slice(0, 12).map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontFamily: T.fontMono, color: T.textSec, width: 18 }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: T.navy, fontWeight: 600 }}>{s.pathogen}</div>
                  <div style={{ fontSize: 10, color: T.textSec }}>{s.scenarioType}</div>
                </div>
                <span style={{ fontSize: 12, fontFamily: T.fontMono, color: T.orange, fontWeight: 700 }}>${s.econLoss}Bn</span>
                <div style={{ width: 60 }}><Bar pct={s.econLoss / 100 * 100} color={s.econLoss > 60 ? T.red : T.amber} /></div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Pathogen Climate Amplification</div>
            {PATHOGEN_DATA.map(p => (
              <div key={p.pathogen} style={{ marginBottom: 10, padding: '8px 10px', background: T.sub, borderRadius: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.navy, marginBottom: 4 }}>{p.pathogen}</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 11, color: T.textSec }}>RCP Amp: <b style={{ color: T.red }}>×{p.rcpAmplification}</b></span>
                  <span style={{ fontSize: 11, color: T.textSec }}>Spillover: <b style={{ color: T.purple }}>{p.spilloverRisk}%</b></span>
                  <span style={{ fontSize: 11, color: T.textSec }}>Exposure: <b style={{ color: T.orange }}>${p.financialExposure}Bn</b></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Pandemic Scenario Matrix</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Pathogen', 'Scenario', 'Climate Amp', 'Econ Loss $Bn', 'Mortality Mn', 'Prob/decade %', 'Zoonotic Risk', 'Insurance Gap'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, color: T.textSec, fontFamily: T.fontMono, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 25).map((s, i) => (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy, fontSize: 11 }}>{s.pathogen}</td>
                    <td style={{ padding: '8px 12px', fontSize: 11 }}>{s.scenarioType}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: s.climateAmp > 3 ? T.red : T.amber }}>×{s.climateAmp}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.orange }}>${s.econLoss}Bn</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.red }}>{s.mortalityMn}Mn</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{s.probNextDecade}%</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: s.zoonoticRisk > 70 ? T.red : T.amber }}>{s.zoonoticRisk}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{s.insuranceGap}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Climate Amplification Analysis by Pathogen</div>
          {PATHOGEN_DATA.map(p => (
            <div key={p.pathogen} style={{ marginBottom: 14, padding: '12px 14px', background: T.sub, borderRadius: 8, borderLeft: `3px solid ${p.rcpAmplification > 3 ? T.red : p.rcpAmplification > 2 ? T.amber : T.sage}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{p.pathogen}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { label: 'Habitat Expansion', val: `+${p.habitatExpansion}%`, color: T.orange },
                  { label: 'Spillover Risk', val: `${p.spilloverRisk}%`, color: T.purple },
                  { label: 'RCP Amplification', val: `×${p.rcpAmplification}`, color: T.red },
                  { label: 'Pandemic Potential', val: `${p.pandemicPotential}/100`, color: T.amber },
                ].map(item => (
                  <div key={item.label} style={{ background: T.card, borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: T.textSec }}>{item.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: T.fontMono, color: item.color }}>{item.val}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {PATHOGEN_DATA.map(p => (
              <div key={p.pathogen} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, color: T.navy, marginBottom: 4 }}>{p.pathogen}</div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: T.textSec }}>Zoonotic Spillover Risk</span>
                    <span style={{ fontSize: 13, fontFamily: T.fontMono, color: p.spilloverRisk > 60 ? T.red : T.amber }}>{p.spilloverRisk}%</span>
                  </div>
                  <Bar pct={p.spilloverRisk} color={p.spilloverRisk > 60 ? T.red : T.amber} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: T.textSec }}>Habitat Expansion</span>
                    <span style={{ fontSize: 13, fontFamily: T.fontMono, color: T.orange }}>+{p.habitatExpansion}%</span>
                  </div>
                  <Bar pct={p.habitatExpansion} color={T.orange} />
                </div>
                <div style={{ fontSize: 11, color: T.textSec }}>Financial Exposure: <b style={{ color: T.indigo }}>${p.financialExposure}Bn</b></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Health System Resilience — Scenario-Level Analysis</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {filtered.slice(0, 24).map(s => (
              <div key={s.id} style={{ background: T.sub, borderRadius: 6, padding: '10px 12px', borderLeft: `3px solid ${s.healthSysResilience > 60 ? T.sage : s.healthSysResilience > 40 ? T.amber : T.red}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{s.pathogen}</div>
                <div style={{ fontSize: 10, color: T.textSec, marginBottom: 6 }}>{s.scenarioType}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div><div style={{ fontSize: 9, color: T.textSec }}>Resilience</div><div style={{ fontSize: 20, fontFamily: T.fontMono, fontWeight: 700, color: s.healthSysResilience > 60 ? T.sage : T.amber }}>{s.healthSysResilience}</div></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontSize: 9, color: T.textSec }}>Preparedness</div><div style={{ fontSize: 20, fontFamily: T.fontMono, fontWeight: 700, color: T.teal }}>{s.preparednessIdx}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Financial Exposure by Pathogen ($Bn at risk)</div>
          {PATHOGEN_DATA.map(p => (
            <div key={p.pathogen} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ width: 160, fontSize: 13, color: T.navy }}>{p.pathogen}</span>
              <div style={{ flex: 1 }}><Bar pct={p.financialExposure / 300 * 100} color={p.financialExposure > 200 ? T.red : p.financialExposure > 100 ? T.amber : T.sage} /></div>
              <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.indigo, width: 60 }}>${p.financialExposure}Bn</span>
              <span style={{ fontSize: 11, color: T.textSec }}>Pandemic potential: {p.pandemicPotential}/100</span>
            </div>
          ))}
        </div>
      )}

      {tab === 6 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Pandemic Insurance Architecture</div>
            {[
              { instrument: 'Pandemic CAT Bond', capacity: '$15Bn', trigger: 'WHO PHEIC declaration', coverage: 'Direct economic loss', status: 'ACTIVE' },
              { instrument: 'Pandemic Risk Pool (PRiF)', capacity: '$10Bn', trigger: 'Pathogen threshold + spread velocity', coverage: 'Govt response costs', status: 'ACTIVE' },
              { instrument: 'Climate-Pandemic Parametric', capacity: '$5Bn', trigger: 'Temp anomaly + zoonotic event', coverage: 'SME revenue loss', status: 'PILOT' },
              { instrument: 'Health System Business Interruption', capacity: '$8Bn', trigger: 'Hospital surge >200%', coverage: 'Healthcare provider costs', status: 'ACTIVE' },
              { instrument: 'Biodiversity Loss Pandemic Bond', capacity: '$3Bn', trigger: 'Species loss + spillover event', coverage: 'R&D response costs', status: 'PROPOSED' },
            ].map(inst => (
              <div key={inst.instrument} style={{ display: 'flex', gap: 14, padding: '10px 12px', marginBottom: 8, background: T.sub, borderRadius: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{inst.instrument}</div>
                  <div style={{ fontSize: 10, color: T.textSec }}>Trigger: {inst.trigger}</div>
                  <div style={{ fontSize: 10, color: T.textSec }}>Coverage: {inst.coverage}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontFamily: T.fontMono, fontWeight: 700, color: T.indigo }}>{inst.capacity}</div>
                  <div style={{ fontSize: 10, color: T.sage }}>{inst.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 7 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Pandemic Preparedness Finance — IHR 2005 & Pandemic Treaty</div>
          {[
            { framework: 'WHO Pandemic Accord (IHR 2024)', funding: '$31.5Bn', status: 'NEGOTIATING', timeline: '2026' },
            { framework: 'G7 Pandemic Prevention & Preparedness', funding: '$15Bn', status: 'ACTIVE', timeline: '2030' },
            { framework: 'World Bank Pandemic Fund', funding: '$2Bn', status: 'ACTIVE', timeline: '2025' },
            { framework: 'CEPI 100 Days Mission', funding: '$3.5Bn', status: 'ACTIVE', timeline: '2025' },
            { framework: 'ACT-Accelerator (post-COVID)', funding: '$22Bn', status: 'ACTIVE', timeline: '2030' },
            { framework: 'Biological Threats Reduction (BTRP)', funding: '$1.7Bn', status: 'ACTIVE', timeline: '2030' },
            { framework: 'COVAX Advance Market Commitment', funding: '$2Bn', status: 'ACTIVE', timeline: '2030' },
            { framework: 'Climate-Pandemic Nexus Finance Window', funding: 'TBD', status: 'PROPOSED', timeline: '2027' },
          ].map(fw => (
            <div key={fw.framework} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px', marginBottom: 8, background: T.sub, borderRadius: 6, borderLeft: `3px solid ${fw.status === 'ACTIVE' ? T.sage : fw.status === 'NEGOTIATING' ? T.amber : T.blue}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{fw.framework}</div>
                <div style={{ fontSize: 10, color: T.textSec }}>Timeline: {fw.timeline}</div>
              </div>
              <span style={{ fontSize: 16, fontFamily: T.fontMono, fontWeight: 700, color: T.indigo }}>{fw.funding}</span>
              <span style={{ fontSize: 10, fontFamily: T.fontMono, fontWeight: 600, color: fw.status === 'ACTIVE' ? T.sage : T.amber, background: `${fw.status === 'ACTIVE' ? T.sage : T.amber}15`, padding: '3px 10px', borderRadius: 4 }}>{fw.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
