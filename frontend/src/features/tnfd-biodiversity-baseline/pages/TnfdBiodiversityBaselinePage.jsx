import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis } from 'recharts';

const T = {
  bg: '#0f1117', surface: '#161a24', surfaceH: '#1b2030', border: '#262c3c', borderL: '#1f2433',
  navy: '#0b2030', gold: '#d4a843', goldL: '#e6bd65', sage: '#7a8f6a', teal: '#0d4f5c',
  text: '#e8e0d0', textSec: '#a9b0bd', textMut: '#6b7280', red: '#c2564a', green: '#5c8a5e',
  amber: '#d89b43',
  font: "'DM Sans', system-ui, sans-serif", mono: "'JetBrains Mono', monospace"
};

const sr = (n) => { const x = Math.sin(n * 10000); return x - Math.floor(x); };

const ASSETS = [
  { id: 'OMN-NH3', name: 'Green NH₃ Complex (Oman)', biome: 'Hyper-arid desert', area: 92, kba: 'Adjacent (12 km)', iucn: ['Arabian Oryx VU', 'Egyptian Vulture EN'], waterStress: 5, depScore: 4.6, impactScore: 4.2, priority: 'Critical' },
  { id: 'ODI-FDR', name: 'Odisha FDRE Cluster', biome: 'Tropical moist forest edge', area: 48, kba: 'Within 5 km (Similipal buffer)', iucn: ['Asian Elephant EN', 'Indian Pangolin EN'], waterStress: 3, depScore: 3.8, impactScore: 3.6, priority: 'High' },
  { id: 'RAJ-SOL', name: 'Rajasthan Solar Cluster', biome: 'Thar semi-arid scrubland', area: 74, kba: 'Partial overlap (DNP corridor)', iucn: ['Great Indian Bustard CR', 'Chinkara LC'], waterStress: 4, depScore: 3.1, impactScore: 4.5, priority: 'Critical' },
  { id: 'GUJ-WND', name: 'Gujarat Wind Farm (Kutch)', biome: 'Saline coastal', area: 31, kba: 'Overlap (Banni grassland)', iucn: ['Indian Wild Ass LC', 'Lesser Florican CR'], waterStress: 4, depScore: 2.4, impactScore: 3.9, priority: 'High' },
  { id: 'JPR-MFG', name: 'Jaipur Module Mfg', biome: 'Urban industrial', area: 1.2, kba: 'None (>25 km)', iucn: [], waterStress: 4, depScore: 3.6, impactScore: 2.8, priority: 'Medium' },
  { id: 'TN-WND', name: 'Tamil Nadu Wind Farm', biome: 'Western Ghats foothill', area: 18, kba: 'Within 8 km', iucn: ['Nilgiri Tahr EN'], waterStress: 2, depScore: 2.9, impactScore: 3.2, priority: 'High' },
  { id: 'AP-SOL', name: 'Andhra Solar Park', biome: 'Dry deciduous', area: 22, kba: 'None (18 km)', iucn: ['Indian Fox LC'], waterStress: 3, depScore: 2.6, impactScore: 2.9, priority: 'Medium' },
  { id: 'MP-SOL', name: 'Madhya Pradesh Solar', biome: 'Central Indian tropical dry', area: 26, kba: 'Within 10 km (Kuno buffer)', iucn: ['Cheetah EW-reintro', 'Chinkara LC'], waterStress: 3, depScore: 2.8, impactScore: 3.1, priority: 'High' },
];

const LEAP = [
  { phase: 'L — Locate', q: 'Where is the interface with nature?', outputs: ['IBAT KBA overlay', 'WRI Aqueduct water-stress', 'Biome classification', 'Asset-level sensitive-location flags'], status: 92 },
  { phase: 'E — Evaluate', q: 'What dependencies & impacts?', outputs: ['ENCORE dependency score', 'Impact drivers (land-use, water, GHG, pollution, invasives)', 'Ecosystem service P&L map'], status: 78 },
  { phase: 'A — Assess', q: 'What are the risks & opportunities?', outputs: ['Physical/transition/systemic risk register', 'Opportunity screen (agrivoltaics, restoration credits)', 'Financial materiality'], status: 64 },
  { phase: 'P — Prepare', q: 'How to respond & disclose?', outputs: ['TNFD 14 recommended disclosures', 'Strategy & governance integration', 'Metrics & targets (SBTN aligned)', 'Assurance readiness'], status: 48 },
];

const PILLARS = [
  { p: 'Governance', recs: 3, maturity: 62, gaps: 'Board-level biodiversity oversight charter pending; no dedicated nature sub-committee' },
  { p: 'Strategy', recs: 4, maturity: 55, gaps: 'Nature transition plan not yet integrated with climate transition plan; material sensitivity analysis partial' },
  { p: 'Risk & Impact Mgmt', recs: 4, maturity: 48, gaps: 'Upstream (polysilicon, steel, offtaker agri) scope-3 nature footprint not yet mapped' },
  { p: 'Metrics & Targets', recs: 3, maturity: 41, gaps: 'SBTN Step 1 baseline done; Step 2/3 targets pending; no freshwater/land footprint intensity KPIs' },
];

const ECO_SERVICES = [
  { svc: 'Freshwater provisioning', dependency: 4.6, substitutability: 1.8, revenueAtRisk: 18, description: 'Green-H2 electrolysis + module washing + cooling' },
  { svc: 'Climate regulation (local)', dependency: 3.8, substitutability: 2.2, revenueAtRisk: 12, description: 'Ambient temp affects PV yield (−0.4%/°C above 25°C)' },
  { svc: 'Soil stability', dependency: 3.6, substitutability: 2.5, revenueAtRisk: 9, description: 'Erosion control for solar tracker foundations' },
  { svc: 'Pollination', dependency: 2.1, substitutability: 3.4, revenueAtRisk: 3, description: 'Agrivoltaic understory (mustard, pulses)' },
  { svc: 'Air quality regulation', dependency: 3.2, substitutability: 2.0, revenueAtRisk: 8, description: 'Dust/PM suppression by native vegetation — impacts module soiling losses' },
  { svc: 'Flood regulation', dependency: 2.8, substitutability: 2.7, revenueAtRisk: 6, description: 'Downstream FDRE hydro — watershed integrity' },
];

const DNSH = [
  { obj: 'Climate change mitigation', status: 'Aligned', evidence: 'Principal activity; SBTi 1.5°C pathway filed', color: T.green },
  { obj: 'Climate change adaptation', status: 'Aligned', evidence: 'Climate risk assessment per TCFD EB5; adaptation roadmap in place', color: T.green },
  { obj: 'Sustainable water', status: 'Conditional', evidence: 'Zero-liquid-discharge designed at NH₃ plant; Oman SWRO desal linked', color: T.amber },
  { obj: 'Circular economy', status: 'Conditional', evidence: 'EPR for EoL modules via Recykal; recycled-content in mfg 12% (target 30% by 2028)', color: T.amber },
  { obj: 'Pollution prevention', status: 'Aligned', evidence: 'Mfg ISO 14001; zero SF₆/Cd in cells; NOx/SOx below CPCB norms', color: T.green },
  { obj: 'Biodiversity & ecosystems', status: 'At Risk', evidence: 'Rajasthan GIB corridor overlap; Oman KBA proximity — mitigation hierarchy required', color: T.red },
];

const OPPS = [
  { opp: 'Agrivoltaic co-benefit (RAJ/MP/AP solar)', npvCr: 142, tenor: '7 yrs', rev: 'Crop yield share + carbon insetting', status: 'Scoping' },
  { opp: 'Thar grassland restoration credit (Plan Vivo)', npvCr: 38, tenor: '20 yrs', rev: 'Biodiversity credits @ $15-35/ha', status: 'MoU drafted' },
  { opp: 'Mangrove offset — Gujarat coastal', npvCr: 24, tenor: '30 yrs', rev: 'Blue carbon + ARR stacking', status: 'Pre-feasibility' },
  { opp: 'Odisha Similipal buffer — payments for ecosystem services', npvCr: 17, tenor: '10 yrs', rev: 'State PES scheme + offtaker premium', status: 'Conceptual' },
  { opp: 'Oman acacia afforestation offset (A6.4 ARR.005)', npvCr: 56, tenor: '25 yrs', rev: 'ICVCM-label units @ $28-45/t', status: 'Engaged consultant' },
];

const SBTN_TARGETS = [
  { step: 'Step 1 — Assess', target: 'Materiality screening across 8 assets + value chain', tnfd: 'Locate+Evaluate', status: 'Complete', pct: 100 },
  { step: 'Step 2 — Interpret & Prioritise', target: 'Prioritised pressure list (land, water, GHG, pollution, invasives)', tnfd: 'Evaluate', status: 'In progress', pct: 70 },
  { step: 'Step 3 — Measure, Set & Disclose', target: 'Freshwater withdrawal intensity, land-footprint/MW, no-deforestation', tnfd: 'Assess+Prepare', status: 'Drafting', pct: 35 },
  { step: 'Step 4 — Act', target: 'AR3T framework — Avoid/Reduce/Restore/Regenerate actions', tnfd: 'Prepare', status: 'Design phase', pct: 20 },
  { step: 'Step 5 — Track', target: 'Annual nature-positive KPI reporting (aligned BRSR Principle 6)', tnfd: 'Prepare', status: 'Framework set', pct: 15 },
];

const SUPPLY_CHAIN = [
  { tier: 'Tier-1 Mfg (Jaipur)', natureScore: 2.8, issues: 'Water 4, land 2, pollution 3' },
  { tier: 'Tier-2 Polysilicon (China/US)', natureScore: 3.9, issues: 'Water 4, energy 5, land 3' },
  { tier: 'Tier-3 Silica/Quartz (mined)', natureScore: 4.4, issues: 'Land 5, biodiversity 4, water 3' },
  { tier: 'BoS Steel/Al', natureScore: 3.7, issues: 'Energy 5, land 3, pollution 4' },
  { tier: 'BESS Li/Ni/Co', natureScore: 4.6, issues: 'Water 5, biodiversity 4, land 4, pollution 4' },
  { tier: 'NH₃ offtaker (EU fertiliser)', natureScore: 3.5, issues: 'Agri N-runoff 4, land 3, water 3' },
];

const REGS = [
  { reg: 'EU CSDDD (in force 2026)', scope: 'Full value-chain due-diligence for Tier-1 EU offtakers', impact: 'Offtaker pass-through; biodiversity Annex Part II obligations', priority: 'High' },
  { reg: 'EU Nature Restoration Law', scope: 'Supply-chain land restoration targets for >50 ha disturbed land', impact: 'Forward-looking for agri/NH₃ offtakers', priority: 'High' },
  { reg: 'TNFD v2.0 (Sep 2025)', scope: 'FY27 mandatory for NSE-100 + Nifty-500 large-caps (MCA consultation)', impact: 'Voluntary early adoption creates SPO advantage', priority: 'Critical' },
  { reg: 'SBTN v1.0 land & freshwater', scope: 'Voluntary; aligned IFRS S4 (expected)', impact: 'Science-based nature targets — mandatory for SLB KPI credibility', priority: 'High' },
  { reg: 'EU Deforestation Regulation (EUDR)', scope: 'Indirect via packaging/wood pallets', impact: 'Minor — covered via supplier code of conduct', priority: 'Low' },
  { reg: 'India BRSR Principle 6', scope: 'Mandatory Top-1000 listed', impact: 'Already disclosed; TNFD alignment strengthens', priority: 'Medium' },
];

const tabs = ['Overview', 'LEAP Methodology', 'Asset Nature Register', 'Ecosystem Services', 'DNSH & Taxonomy', 'Opportunities & SBTN', 'Supply Chain & Regulation'];

export default function TnfdBiodiversityBaselinePage() {
  const [tab, setTab] = useState(0);
  const [scope, setScope] = useState('All');

  const filtered = useMemo(() => scope === 'All' ? ASSETS : ASSETS.filter(a => a.priority === scope), [scope]);
  const totalArea = filtered.reduce((s, a) => s + a.area, 0);
  const critAssets = ASSETS.filter(a => a.priority === 'Critical').length;
  const avgDep = (ASSETS.reduce((s, a) => s + a.depScore, 0) / ASSETS.length).toFixed(2);
  const avgImp = (ASSETS.reduce((s, a) => s + a.impactScore, 0) / ASSETS.length).toFixed(2);

  const radarData = PILLARS.map(p => ({ pillar: p.p, maturity: p.maturity, target: 85 }));
  const scatterData = ASSETS.map(a => ({ x: a.depScore, y: a.impactScore, z: a.area * 4, name: a.id, priority: a.priority }));

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: '28px 40px' }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 1.8 }}>EP-EB6</span>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: -0.4 }}>TNFD Biodiversity Baseline & LEAP Assessment</h1>
        </div>
        <div style={{ color: T.textSec, fontSize: 13, marginTop: 6 }}>
          Client-anonymised RE-IPP · 7.4 GW portfolio · 8 priority assets across India + Oman · TNFD v2.0 (Sep 2025) · LEAP methodology · IBAT/WRI/ENCORE data layers · SBTN v1.0 aligned
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 18 }}>
        <Kpi label="Priority assets assessed" value={`${ASSETS.length}`} sub={`${critAssets} Critical · ${ASSETS.filter(a=>a.priority==='High').length} High`} />
        <Kpi label="Cumulative land footprint" value={`${ASSETS.reduce((s,a)=>s+a.area,0).toFixed(0)} km²`} sub="Direct operational scope" />
        <Kpi label="Mean ENCORE dependency" value={avgDep} sub="1–5 scale · weighted" />
        <Kpi label="Mean impact driver score" value={avgImp} sub="Land+water+GHG+pollution" />
        <Kpi label="TNFD disclosure maturity" value="52%" sub="14 recommended disclosures · 7 full, 5 partial" />
      </div>

      <div style={{ display: 'flex', gap: 2, marginBottom: 18, borderBottom: `1px solid ${T.border}` }}>
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            background: tab === i ? T.surfaceH : 'transparent', color: tab === i ? T.gold : T.textSec,
            border: 'none', borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent',
            padding: '10px 16px', fontFamily: T.font, fontSize: 13, cursor: 'pointer', fontWeight: tab === i ? 600 : 400
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
          <Panel title="Engagement scope & output">
            <P><b>Mandate:</b> Establish TNFD-aligned biodiversity baseline across 8 priority assets + upstream/downstream value chain. Produce LEAP Phases 1–4 deliverables + SBTN Steps 1–3 targets + DNSH verification for EU Taxonomy-aligned green bond framework.</P>
            <P><b>Why this matters commercially:</b> (i) EU offtaker NH₃ contracts contain CSDDD pass-through clauses; (ii) EU Taxonomy-aligned green bonds require DNSH-to-biodiversity; (iii) BRSR Principle 6 + SEBI FY27 TNFD early-adoption signals to passive ESG flows; (iv) agrivoltaic restoration opportunities monetise land-use optimisation.</P>
            <P><b>Key findings:</b> 2 Critical-priority assets (Oman NH₃ adjacent to KBA; Rajasthan solar cluster overlapping Great Indian Bustard corridor) require mitigation hierarchy execution. Biodiversity is the only EU Taxonomy environmental objective flagged "At Risk" across the portfolio. 5 monetisable nature-positive opportunities identified with combined NPV ₹277 Cr.</P>
          </Panel>
          <Panel title="TNFD pillar maturity radar">
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="pillar" tick={{ fill: T.text, fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: T.textMut, fontSize: 10 }} />
                <Radar name="Current" dataKey="maturity" stroke={T.gold} fill={T.gold} fillOpacity={0.4} />
                <Radar name="FY27 Target" dataKey="target" stroke={T.sage} fill={T.sage} fillOpacity={0.15} />
                <Legend wrapperStyle={{ fontSize: 11, color: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}` }} />
              </RadarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      )}

      {tab === 1 && (
        <Panel title="LEAP — Locate · Evaluate · Assess · Prepare">
          <Table cols={['Phase', 'Key question', 'Outputs', 'Completion']}>
            {LEAP.map(l => (
              <tr key={l.phase} style={{ borderTop: `1px solid ${T.borderL}` }}>
                <td style={td}><b style={{ color: T.gold }}>{l.phase}</b></td>
                <td style={td}>{l.q}</td>
                <td style={td}>{l.outputs.map((o, i) => <div key={i} style={{ fontSize: 12, color: T.textSec }}>• {o}</div>)}</td>
                <td style={{ ...td, fontFamily: T.mono }}>
                  <div style={{ background: T.border, height: 8, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${l.status}%`, background: l.status >= 70 ? T.green : l.status >= 50 ? T.amber : T.red, height: '100%' }} />
                  </div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>{l.status}%</div>
                </td>
              </tr>
            ))}
          </Table>
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            {PILLARS.map(p => (
              <div key={p.p} style={{ background: T.surface, border: `1px solid ${T.border}`, padding: 12, borderRadius: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <b style={{ color: T.gold }}>{p.p}</b>
                  <span style={{ fontFamily: T.mono, fontSize: 12, color: p.maturity > 55 ? T.green : T.amber }}>{p.maturity}% · {p.recs} recs</span>
                </div>
                <div style={{ fontSize: 12, color: T.textSec }}>Gap: {p.gaps}</div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === 2 && (
        <>
          <div style={{ marginBottom: 10 }}>
            {['All', 'Critical', 'High', 'Medium'].map(s => (
              <button key={s} onClick={() => setScope(s)} style={{
                background: scope === s ? T.gold : 'transparent', color: scope === s ? T.navy : T.textSec,
                border: `1px solid ${scope === s ? T.gold : T.border}`, padding: '6px 14px', marginRight: 6,
                borderRadius: 3, fontFamily: T.font, fontSize: 12, cursor: 'pointer'
              }}>{s}</button>
            ))}
          </div>
          <Panel title={`Asset nature register (${filtered.length} assets, ${totalArea.toFixed(0)} km²)`}>
            <Table cols={['ID', 'Asset / biome', 'Area (km²)', 'KBA proximity', 'IUCN red-list species', 'Water stress', 'Dep/Imp', 'Priority']}>
              {filtered.map(a => (
                <tr key={a.id} style={{ borderTop: `1px solid ${T.borderL}` }}>
                  <td style={{ ...td, fontFamily: T.mono, fontSize: 11 }}>{a.id}</td>
                  <td style={td}><b>{a.name}</b><div style={{ fontSize: 11, color: T.textMut }}>{a.biome}</div></td>
                  <td style={{ ...td, fontFamily: T.mono }}>{a.area}</td>
                  <td style={td}>{a.kba}</td>
                  <td style={{ ...td, fontSize: 11 }}>{a.iucn.length ? a.iucn.join(', ') : '—'}</td>
                  <td style={{ ...td, fontFamily: T.mono, textAlign: 'center' }}>{a.waterStress}/5</td>
                  <td style={{ ...td, fontFamily: T.mono, textAlign: 'center' }}>{a.depScore} / {a.impactScore}</td>
                  <td style={td}><span style={{ color: a.priority === 'Critical' ? T.red : a.priority === 'High' ? T.amber : T.textSec, fontWeight: 600 }}>{a.priority}</span></td>
                </tr>
              ))}
            </Table>
            <div style={{ marginTop: 16 }}>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 0 }}>
                  <CartesianGrid stroke={T.border} />
                  <XAxis type="number" dataKey="x" name="Dependency" domain={[0, 5]} tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: 'ENCORE dependency score', position: 'insideBottom', offset: -8, fill: T.textSec, fontSize: 11 }} />
                  <YAxis type="number" dataKey="y" name="Impact" domain={[0, 5]} tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: 'Impact driver score', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
                  <ZAxis type="number" dataKey="z" range={[50, 400]} />
                  <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}` }} />
                  <Scatter data={scatterData} fill={T.gold} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </>
      )}

      {tab === 3 && (
        <Panel title="Ecosystem service dependency & revenue-at-risk (ENCORE v2 mapping)">
          <Table cols={['Service', 'Dependency (1–5)', 'Substitutability', 'Revenue at risk ₹Cr/yr', 'Pathway']}>
            {ECO_SERVICES.map(e => (
              <tr key={e.svc} style={{ borderTop: `1px solid ${T.borderL}` }}>
                <td style={td}><b>{e.svc}</b></td>
                <td style={{ ...td, fontFamily: T.mono, textAlign: 'center', color: e.dependency > 4 ? T.red : e.dependency > 3 ? T.amber : T.textSec }}>{e.dependency}</td>
                <td style={{ ...td, fontFamily: T.mono, textAlign: 'center' }}>{e.substitutability}</td>
                <td style={{ ...td, fontFamily: T.mono, textAlign: 'right', color: T.gold }}>{e.revenueAtRisk}</td>
                <td style={{ ...td, fontSize: 12, color: T.textSec }}>{e.description}</td>
              </tr>
            ))}
          </Table>
          <div style={{ marginTop: 20 }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ECO_SERVICES} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="svc" tick={{ fill: T.textSec, fontSize: 10 }} angle={-25} textAnchor="end" height={80} interval={0} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}` }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="dependency" fill={T.gold} name="Dependency" />
                <Bar dataKey="revenueAtRisk" fill={T.teal} name="Revenue at Risk ₹Cr" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}

      {tab === 4 && (
        <Panel title="EU Taxonomy DNSH verification across 6 environmental objectives">
          <Table cols={['Objective', 'Status', 'Evidence']}>
            {DNSH.map(d => (
              <tr key={d.obj} style={{ borderTop: `1px solid ${T.borderL}` }}>
                <td style={td}><b>{d.obj}</b></td>
                <td style={td}><span style={{ color: d.color, fontWeight: 600, fontFamily: T.mono, fontSize: 12 }}>{d.status}</span></td>
                <td style={{ ...td, fontSize: 12, color: T.textSec }}>{d.evidence}</td>
              </tr>
            ))}
          </Table>
          <P style={{ marginTop: 14 }}>
            <b>Implication:</b> "At Risk" flag on biodiversity objective restricts EU Taxonomy-aligned green bond classification for Rajasthan solar + Oman NH₃ assets until mitigation hierarchy (Avoid → Minimise → Restore → Offset) is executed and verified. ~₹1,820 Cr of planned green-bond issuance tied to these assets pending DNSH remediation.
          </P>
        </Panel>
      )}

      {tab === 5 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Panel title="Nature-positive monetisation opportunities">
            <Table cols={['Opportunity', 'NPV ₹Cr', 'Tenor', 'Status']}>
              {OPPS.map(o => (
                <tr key={o.opp} style={{ borderTop: `1px solid ${T.borderL}` }}>
                  <td style={td}><b style={{ fontSize: 13 }}>{o.opp}</b><div style={{ fontSize: 11, color: T.textMut }}>{o.rev}</div></td>
                  <td style={{ ...td, fontFamily: T.mono, textAlign: 'right', color: T.gold }}>{o.npvCr}</td>
                  <td style={{ ...td, fontFamily: T.mono }}>{o.tenor}</td>
                  <td style={{ ...td, fontSize: 12 }}>{o.status}</td>
                </tr>
              ))}
            </Table>
            <div style={{ marginTop: 10, fontFamily: T.mono, fontSize: 12, color: T.gold }}>
              Cumulative portfolio NPV: ₹{OPPS.reduce((s, o) => s + o.npvCr, 0)} Cr
            </div>
          </Panel>
          <Panel title="SBTN v1.0 targets progression">
            <Table cols={['Step', 'Target', 'TNFD phase', 'Progress']}>
              {SBTN_TARGETS.map(s => (
                <tr key={s.step} style={{ borderTop: `1px solid ${T.borderL}` }}>
                  <td style={td}><b style={{ fontSize: 12 }}>{s.step}</b></td>
                  <td style={{ ...td, fontSize: 12 }}>{s.target}</td>
                  <td style={{ ...td, fontSize: 11, color: T.textSec }}>{s.tnfd}</td>
                  <td style={{ ...td, fontFamily: T.mono }}>
                    <div style={{ background: T.border, height: 6, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${s.pct}%`, background: s.pct >= 70 ? T.green : s.pct >= 30 ? T.amber : T.red, height: '100%' }} />
                    </div>
                    <div style={{ fontSize: 10, marginTop: 3 }}>{s.pct}% · {s.status}</div>
                  </td>
                </tr>
              ))}
            </Table>
          </Panel>
        </div>
      )}

      {tab === 6 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Panel title="Value-chain nature pressure (scope 3 biodiversity)">
            <Table cols={['Tier', 'Nature score', 'Pressure drivers']}>
              {SUPPLY_CHAIN.map(s => (
                <tr key={s.tier} style={{ borderTop: `1px solid ${T.borderL}` }}>
                  <td style={td}><b style={{ fontSize: 12 }}>{s.tier}</b></td>
                  <td style={{ ...td, fontFamily: T.mono, textAlign: 'center', color: s.natureScore > 4 ? T.red : s.natureScore > 3.5 ? T.amber : T.textSec }}>{s.natureScore}/5</td>
                  <td style={{ ...td, fontSize: 11, color: T.textSec }}>{s.issues}</td>
                </tr>
              ))}
            </Table>
            <P style={{ marginTop: 12 }}>
              <b>Highest-risk link:</b> BESS battery minerals (Li/Ni/Co) score 4.6/5 — driven by water-intensive brine extraction and land-use in Chile/DRC/Indonesia. Polysilicon tier-2 second-highest (3.9). EU offtaker (fertiliser) tier picks up agri-N runoff pressure downstream.
            </P>
          </Panel>
          <Panel title="Regulatory stack & disclosure triggers">
            <Table cols={['Regulation', 'Scope', 'Impact', 'Priority']}>
              {REGS.map(r => (
                <tr key={r.reg} style={{ borderTop: `1px solid ${T.borderL}` }}>
                  <td style={td}><b style={{ fontSize: 12 }}>{r.reg}</b></td>
                  <td style={{ ...td, fontSize: 11, color: T.textSec }}>{r.scope}</td>
                  <td style={{ ...td, fontSize: 11 }}>{r.impact}</td>
                  <td style={td}><span style={{ color: r.priority === 'Critical' ? T.red : r.priority === 'High' ? T.amber : T.textSec, fontWeight: 600, fontSize: 12 }}>{r.priority}</span></td>
                </tr>
              ))}
            </Table>
          </Panel>
        </div>
      )}

      <div style={{ marginTop: 30, padding: '14px 18px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12, color: T.textSec }}>
        <b style={{ color: T.gold }}>Deliverable stack:</b> LEAP Phases 1–4 workbook · TNFD 14 recommended disclosures drafted · SBTN Steps 1–3 target framework · DNSH verification memo (EU Taxonomy) · 5 opportunity feasibility studies · BRSR Principle 6 alignment dossier · board-ready biodiversity transition plan. All artefacts client-anonymised for advisory-firm IP reuse.
      </div>
    </div>
  );
}

const td = { padding: '10px 14px', fontSize: 13, verticalAlign: 'top' };

function Kpi({ label, value, sub }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: '14px 16px', borderRadius: 4 }}>
      <div style={{ fontSize: 11, color: T.textMut, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 22, fontFamily: T.mono, color: T.gold, margin: '4px 0' }}>{value}</div>
      <div style={{ fontSize: 11, color: T.textSec }}>{sub}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 18 }}>
      <div style={{ fontSize: 13, color: T.gold, fontWeight: 600, letterSpacing: 0.5, marginBottom: 12, textTransform: 'uppercase' }}>{title}</div>
      {children}
    </div>
  );
}

function P({ children, style }) {
  return <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6, margin: '8px 0', ...style }}>{children}</p>;
}

function Table({ cols, children }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: T.surfaceH }}>
            {cols.map(c => <th key={c} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: T.textMut, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 500 }}>{c}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
