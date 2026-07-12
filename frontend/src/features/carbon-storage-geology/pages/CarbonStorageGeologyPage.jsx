import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// EP-CCUS-GEO — Carbon Storage Geology: Capacity, Injectivity & Containment Risk
// Methodology: DOE/NETL volumetric storage-capacity method + Darcy radial-flow injectivity +
// weighted containment-risk score, benchmarked against USGS assessment methodology and IEAGHG
// containment-risk frameworks. See docs/module_atlas/deep/carbon-storage-geology.md §8.

const T = { bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E', sub: '#6B7280', indigo: '#4F46E5', green: '#065F46', red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', sky: '#0369A1', ccs: '#334155' };

// Hand-authored storage-site archetypes spanning the three principal geological storage classes.
// Reservoir geometry, petrophysics and risk-component scores are illustrative reference values
// consistent with published DOE Carbon Storage Atlas / USGS assessment ranges for analogous
// formations, not site-specific core/log data.
const SITES = [
  { id: 'utsira',   name: 'Utsira Fm. (Sleipner-analogue)',     type: 'Saline Aquifer',      areaKm2: 520, thicknessM: 50,  porosity: 0.35, effFactor: 0.02, permMd: 500, sealRisk: 15, faultRisk: 10, wellRisk: 5,  seismicRisk: 10 },
  { id: 'mtsimon',  name: 'Mount Simon Sandstone (Illinois)',    type: 'Saline Aquifer',      areaKm2: 300, thicknessM: 100, porosity: 0.20, effFactor: 0.02, permMd: 100, sealRisk: 20, faultRisk: 15, wellRisk: 25, seismicRisk: 20 },
  { id: 'porthos',  name: 'Porthos Depleted Gas Field (NL)',     type: 'Depleted Gas Field',  areaKm2: 80,  thicknessM: 30,  porosity: 0.18, effFactor: 0.40, permMd: 200, sealRisk: 10, faultRisk: 15, wellRisk: 40, seismicRisk: 15 },
  { id: 'weyburn',  name: 'Weyburn Depleted Oil Field (Canada)', type: 'Depleted Oil Field',  areaKm2: 180, thicknessM: 20,  porosity: 0.15, effFactor: 0.30, permMd: 15,  sealRisk: 15, faultRisk: 20, wellRisk: 45, seismicRisk: 10 },
  { id: 'basalt',   name: 'Basalt Formation (CarbFix-analogue)', type: 'Basalt Mineralisation', areaKm2: 50, thicknessM: 400, porosity: 0.10, effFactor: 0.01, permMd: 10, sealRisk: 5,  faultRisk: 5,  wellRisk: 5,  seismicRisk: 25 },
  { id: 'gulfcoast', name: 'Gulf Coast Saline Aquifer (Texas)',   type: 'Saline Aquifer',      areaKm2: 400, thicknessM: 60,  porosity: 0.25, effFactor: 0.02, permMd: 150, sealRisk: 18, faultRisk: 25, wellRisk: 30, seismicRisk: 15 },
  { id: 'bayuundan', name: 'Depleted Gas Field (Offshore, AU)',   type: 'Depleted Gas Field',  areaKm2: 120, thicknessM: 25,  porosity: 0.16, effFactor: 0.35, permMd: 80,  sealRisk: 12, faultRisk: 18, wellRisk: 35, seismicRisk: 10 },
  { id: 'bunter',   name: 'Bunter Sandstone (UK North Sea)',      type: 'Saline Aquifer',      areaKm2: 250, thicknessM: 45,  porosity: 0.22, effFactor: 0.02, permMd: 120, sealRisk: 20, faultRisk: 15, wellRisk: 10, seismicRisk: 12 },
];

// Containment risk weights (seal integrity dominant per IEAGHG frameworks; sum to 1)
const WEIGHTS = { seal: 0.40, fault: 0.25, well: 0.20, seismic: 0.15 };

const mdToM2 = mD => mD * 9.869e-16; // 1 millidarcy ≈ 9.869e-16 m²
const SECONDS_PER_YEAR = 31536000;

// StorageCapacity = A · h · φ · ρ_CO2 · E   (DOE/NETL volumetric method)
function computeCapacityMt(site, { rhoCO2 }) {
  const areaM2 = site.areaKm2 * 1e6;
  const capacityKg = areaM2 * site.thicknessM * site.porosity * rhoCO2 * site.effFactor;
  return capacityKg / 1e9; // kg -> Mt (1 Mt = 1e9 kg)
}

// InjectionRate = (2π k h ΔP) / (μ ln(re/rw))   (Darcy radial flow, per injection well)
function computeInjectionRateMtpa(site, { dPMPa, muPaS, reRwRatio, rhoCO2 }) {
  const kM2 = mdToM2(site.permMd);
  const dPPa = dPMPa * 1e6;
  const numerator = 2 * Math.PI * kM2 * site.thicknessM * dPPa;
  const denominator = muPaS * Math.log(reRwRatio);
  const rateM3PerS = denominator > 0 ? numerator / denominator : 0;
  const rateKgPerYr = rateM3PerS * rhoCO2 * SECONDS_PER_YEAR;
  return rateKgPerYr / 1e9; // kg/yr -> Mtpa
}

// ContainmentRisk = w1·SealRisk + w2·FaultRisk + w3·WellRisk + w4·SeismicRisk   (0-100 scale)
function computeContainmentRisk(site) {
  return WEIGHTS.seal * site.sealRisk + WEIGHTS.fault * site.faultRisk + WEIGHTS.well * site.wellRisk + WEIGHTS.seismic * site.seismicRisk;
}

// PermanenceFactor = 1 − P(leakage over 1,000yr); P(leakage) = (ContainmentRisk/100) × maxLeakageProb
// maxLeakageProb is a conservative DOE-style ceiling (10%) applied at the worst-case risk score.
function computePermanence(riskScore, maxLeakageProb) {
  return 1 - (riskScore / 100) * maxLeakageProb;
}

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: '1 1 180px' }}>
    <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function CarbonStorageGeologyPage() {
  const [rhoCO2, setRhoCO2] = useState(700);
  const [dPMPa, setDPMPa] = useState(3);
  const [muPaS, setMuPaS] = useState(5e-5);
  const [reRwRatio, setReRwRatio] = useState(10000);
  const [maxLeakageProb, setMaxLeakageProb] = useState(0.10);
  const [selectedId, setSelectedId] = useState('utsira');

  const rows = useMemo(() => SITES.map(site => {
    const capacityMt = computeCapacityMt(site, { rhoCO2 });
    const injectionMtpa = computeInjectionRateMtpa(site, { dPMPa, muPaS, reRwRatio, rhoCO2 });
    const riskScore = computeContainmentRisk(site);
    const permanence = computePermanence(riskScore, maxLeakageProb);
    const creditedVolumeMt = capacityMt * permanence;
    return { ...site, capacityMt, injectionMtpa, riskScore, permanence, creditedVolumeMt };
  }), [rhoCO2, dPMPa, muPaS, reRwRatio, maxLeakageProb]);

  const totalCapacityGt = rows.reduce((s, x) => s + x.capacityMt, 0) / 1000;
  const totalCreditedGt = rows.reduce((s, x) => s + x.creditedVolumeMt, 0) / 1000;
  const avgRisk = rows.length ? rows.reduce((s, x) => s + x.riskScore, 0) / rows.length : 0;
  const avgInjection = rows.length ? rows.reduce((s, x) => s + x.injectionMtpa, 0) / rows.length : 0;

  const selected = rows.find(x => x.id === selectedId) || rows[0];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text }}>
      <div style={{ background: '#0C1A2E', padding: '20px 32px', borderBottom: `3px solid ${T.ccs}` }}>
        <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>CCUS Market & Storage Infrastructure Suite</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#F1F5F9' }}>Carbon Storage Geology — Capacity, Injectivity &amp; Containment Risk</div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>8 storage-site archetypes · Saline Aquifer / Depleted Field / Basalt · DOE volumetric &amp; Darcy radial-flow engine</div>
      </div>

      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <KpiCard label="Total Storage Capacity" value={`${totalCapacityGt.toFixed(2)} Gt`} sub="A·h·φ·ρ·E across 8 sites" color={T.ccs} />
          <KpiCard label="Total Credited Volume" value={`${totalCreditedGt.toFixed(2)} Gt`} sub="Capacity × permanence factor" color={T.green} />
          <KpiCard label="Avg Containment Risk" value={avgRisk.toFixed(0)} sub="0 (best) – 100 (worst)" color={avgRisk <= 30 ? T.green : T.red} />
          <KpiCard label="Avg Injection Rate" value={`${avgInjection.toFixed(2)} Mtpa`} sub="Per well, Darcy radial flow" color={T.indigo} />
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, width: '100%', marginBottom: 4 }}>Model Inputs — Capacity = A·h·φ·ρ_CO₂·E; Injection = 2πkhΔP / (μ·ln(re/rw))</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}>CO₂ density: {rhoCO2} kg/m³<input type="range" min={500} max={900} step={10} value={rhoCO2} onChange={e => setRhoCO2(+e.target.value)} style={{ width: 100 }} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}>Injection ΔP: {dPMPa} MPa<input type="range" min={1} max={8} step={0.5} value={dPMPa} onChange={e => setDPMPa(+e.target.value)} style={{ width: 100 }} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}>CO₂ viscosity: {(muPaS * 1e5).toFixed(1)}×10⁻⁵ Pa·s<input type="range" min={2} max={10} step={0.5} value={muPaS * 1e5} onChange={e => setMuPaS(+e.target.value / 1e5)} style={{ width: 100 }} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}>Drainage ratio re/rw: {reRwRatio}<input type="range" min={1000} max={20000} step={500} value={reRwRatio} onChange={e => setReRwRatio(+e.target.value)} style={{ width: 100 }} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}>Max leakage prob (1000yr): {(maxLeakageProb * 100).toFixed(0)}%<input type="range" min={2} max={25} value={maxLeakageProb * 100} onChange={e => setMaxLeakageProb(+e.target.value / 100)} style={{ width: 100 }} /></label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Storage Sites — Capacity, Injectivity &amp; Containment Risk</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: '#F8F7F4' }}>
                  {['Site', 'Type', 'Capacity Mt', 'Injection Mtpa', 'Risk (0-100)', 'Permanence', 'Credited Mt'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {rows.map((s, i) => (
                    <tr key={s.id} onClick={() => setSelectedId(s.id)} style={{ borderTop: `1px solid ${T.border}`, background: s.id === selectedId ? '#EEF2FF' : (i % 2 ? '#FAFAF7' : T.card), cursor: 'pointer' }}>
                      <td style={{ padding: '7px 10px', fontWeight: 500 }}>{s.name}</td>
                      <td style={{ padding: '7px 10px', color: T.sub, fontSize: 10 }}>{s.type}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 600, color: T.ccs }}>{s.capacityMt.toFixed(0)}</td>
                      <td style={{ padding: '7px 10px' }}>{s.injectionMtpa.toFixed(2)}</td>
                      <td style={{ padding: '7px 10px', color: s.riskScore <= 30 ? T.green : s.riskScore <= 50 ? T.amber : T.red }}>{s.riskScore.toFixed(0)}</td>
                      <td style={{ padding: '7px 10px' }}>{(s.permanence * 100).toFixed(1)}%</td>
                      <td style={{ padding: '7px 10px', fontWeight: 600, color: T.green }}>{s.creditedVolumeMt.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 10 }}>Click a row to select it for the breakdown panel. Reservoir geometry, petrophysics and risk-component scores are illustrative reference values by storage-site archetype (DOE Carbon Storage Atlas / USGS assessment methodology ranges), not site-specific core/log data.</div>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Selected Site: {selected ? selected.name : '—'}</div>
            {selected && [
              ['Type', selected.type],
              ['Area × thickness', `${selected.areaKm2} km² × ${selected.thicknessM} m`],
              ['Porosity / Efficiency factor', `${(selected.porosity * 100).toFixed(0)}% / ${(selected.effFactor * 100).toFixed(1)}%`],
              ['Storage capacity', `${selected.capacityMt.toFixed(0)} Mt`],
              ['Permeability', `${selected.permMd} mD`],
              ['Injection rate (per well)', `${selected.injectionMtpa.toFixed(2)} Mtpa`],
              ['Seal / Fault / Well / Seismic risk', `${selected.sealRisk} / ${selected.faultRisk} / ${selected.wellRisk} / ${selected.seismicRisk}`],
              ['Containment risk score', selected.riskScore.toFixed(1)],
              ['Permanence factor (1000yr)', `${(selected.permanence * 100).toFixed(1)}%`],
              ['Credited volume', `${selected.creditedVolumeMt.toFixed(0)} Mt`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                <span style={{ color: T.sub }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            {selected && (
              <div style={{ marginTop: 12, background: selected.riskScore <= 30 ? '#F0FFF4' : '#FFF1F2', borderRadius: 8, padding: 12, border: `1px solid ${selected.riskScore <= 30 ? T.green : T.red}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: selected.riskScore <= 30 ? T.green : T.red }}>
                  {selected.riskScore <= 30 ? 'Low containment risk — well-characterised site' : 'Elevated containment risk — requires further site characterisation'}
                </div>
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={rows.map(s => ({ name: s.id, Capacity: Math.round(s.capacityMt), Credited: Math.round(s.creditedVolumeMt) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} unit=" Mt" />
                  <Tooltip formatter={v => [`${v} Mt`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Capacity" fill={T.ccs} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Credited" fill={T.green} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
