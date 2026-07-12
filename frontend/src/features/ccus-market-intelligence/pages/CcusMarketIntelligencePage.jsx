import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// EP-CCUS-MI — CCUS Market Intelligence: Global Project Pipeline & Incentive Economics
// Methodology: Global CCS Institute facilities database + IEA CCUS Projects Database pipeline-tracker
// approach, with incentive-adjusted levelised-cost-of-capture (LCOC) analytics per BNEF CCUS Cost
// Outlook. See docs/module_atlas/deep/ccus-market-intelligence.md §8 for the full specification.

const T = { bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E', sub: '#6B7280', indigo: '#4F46E5', green: '#065F46', red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', sky: '#0369A1', ccs: '#334155' };

// Hand-authored global CCUS pipeline. Capacity/capex/opex figures are illustrative order-of-magnitude
// reference values consistent with published Global CCS Institute / IEA CCUS facility disclosures for
// these real, named projects — not live vendor quotes or real-time pipeline data.
const FACILITIES = [
  { id: 'sleipner',  name: 'Sleipner CCS',            country: 'Norway',      jurisdiction: 'EU',  captureType: 'Natural Gas Processing', status: 'Operational',  capacityMtpa: 1.0, capexM: 90,  opexM: 6,  energyGjPerT: 0.6, tsTariffPerT: 12 },
  { id: 'quest',     name: 'Quest CCS',               country: 'Canada',      jurisdiction: 'Other', captureType: 'Pre-Combustion (H₂/SMR)', status: 'Operational', capacityMtpa: 1.2, capexM: 1350, opexM: 45, energyGjPerT: 1.2, tsTariffPerT: 10 },
  { id: 'gorgon',    name: 'Gorgon CCS',               country: 'Australia',   jurisdiction: 'Other', captureType: 'Natural Gas Processing', status: 'Operational', capacityMtpa: 4.0, capexM: 3100, opexM: 80, energyGjPerT: 0.7, tsTariffPerT: 15 },
  { id: 'boundary',  name: 'Boundary Dam 3',           country: 'Canada',      jurisdiction: 'Other', captureType: 'Post-Combustion (Coal Power)', status: 'Operational', capacityMtpa: 1.0, capexM: 1240, opexM: 55, energyGjPerT: 3.8, tsTariffPerT: 14 },
  { id: 'petranova', name: 'Petra Nova',                country: 'USA',        jurisdiction: 'US',  captureType: 'Post-Combustion (Coal Power)', status: 'Operational', capacityMtpa: 1.4, capexM: 1000, opexM: 48, energyGjPerT: 3.6, tsTariffPerT: 9 },
  { id: 'nlights',   name: 'Northern Lights Phase 1',   country: 'Norway',      jurisdiction: 'EU',  captureType: 'T&S Hub (Industrial)',  status: 'Construction', capacityMtpa: 1.5, capexM: 1100, opexM: 30, energyGjPerT: 0.4, tsTariffPerT: 20 },
  { id: 'nzt',       name: 'Net Zero Teesside',         country: 'UK',         jurisdiction: 'EU',  captureType: 'Post-Combustion (Gas Power)',  status: 'Planned',      capacityMtpa: 4.0, capexM: 3800, opexM: 90, energyGjPerT: 3.0, tsTariffPerT: 18 },
  { id: 'actl',      name: 'Alberta Carbon Trunk Line', country: 'Canada',      jurisdiction: 'Other', captureType: 'Natural Gas Processing', status: 'Operational', capacityMtpa: 1.6, capexM: 1200, opexM: 40, energyGjPerT: 0.9, tsTariffPerT: 11 },
  { id: 'porthos',   name: 'Porthos',                    country: 'Netherlands', jurisdiction: 'EU',  captureType: 'T&S Hub (Industrial)',  status: 'Construction', capacityMtpa: 2.5, capexM: 1500, opexM: 35, energyGjPerT: 0.5, tsTariffPerT: 19 },
  { id: 'bayoubend', name: 'Bayou Bend Hub',             country: 'USA',        jurisdiction: 'US',  captureType: 'T&S Hub (Industrial)',  status: 'Planned',      capacityMtpa: 5.0, capexM: 2600, opexM: 60, energyGjPerT: 0.5, tsTariffPerT: 13 },
];

// CRF = r(1+r)^N / ((1+r)^N - 1) — standard capital recovery factor
const crf = (r, n) => {
  if (r <= 0) return n > 0 ? 1 / n : 0;
  const f = Math.pow(1 + r, n);
  return (r * f) / (f - 1);
};

// LCOC ($/tCO2) = (annualised CapEx + OpEx + energy penalty cost) / annual CO2 captured
function computeLcoc(fac, { r, n, pEnergy }) {
  const co2CapturedTpa = fac.capacityMtpa * 1e6;
  if (co2CapturedTpa <= 0) return { co2CapturedTpa: 0, lcoc: 0 };
  const annualCapex = fac.capexM * 1e6 * crf(r, n);
  const annualOpex = fac.opexM * 1e6;
  const annualEnergy = fac.energyGjPerT * co2CapturedTpa * pEnergy;
  const lcoc = (annualCapex + annualOpex + annualEnergy) / co2CapturedTpa;
  return { co2CapturedTpa, lcoc };
}

// Net incentive economics = LCOC − 45Q_credit − CfD_strike + T&S_tariff
// (US-jurisdiction facilities monetise via IRC §45Q; all others assumed to rely on a CfD/contract-for-
// difference style support mechanism, e.g. UK CCUS Business Model / EU Innovation Fund grants.)
function computeNetCost(lcoc, fac, { credit45q, cfdStrike }) {
  const support = fac.jurisdiction === 'US' ? credit45q : cfdStrike;
  return lcoc - support + fac.tsTariffPerT;
}

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: '1 1 180px' }}>
    <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Pill = ({ v }) => {
  const c = { Operational: T.green, Construction: T.sky, Planned: T.amber }[v] || T.sub;
  return <span style={{ background: c, color: '#fff', fontSize: 10, borderRadius: 12, padding: '2px 8px', fontWeight: 600 }}>{v}</span>;
};

export default function CcusMarketIntelligencePage() {
  const [r, setR] = useState(0.08);
  const [n, setN] = useState(25);
  const [pEnergy, setPEnergy] = useState(8);
  const [credit45q, setCredit45q] = useState(85);
  const [cfdStrike, setCfdStrike] = useState(70);
  const [selectedId, setSelectedId] = useState('sleipner');

  const rows = useMemo(() => FACILITIES.map(fac => {
    const { co2CapturedTpa, lcoc } = computeLcoc(fac, { r, n, pEnergy });
    const netCost = computeNetCost(lcoc, fac, { credit45q, cfdStrike });
    return { ...fac, co2CapturedTpa, lcoc, netCost };
  }), [r, n, pEnergy, credit45q, cfdStrike]);

  const capacityByStatus = useMemo(() => {
    const acc = { Operational: 0, Construction: 0, Planned: 0 };
    rows.forEach(f => { acc[f.status] = (acc[f.status] || 0) + f.capacityMtpa; });
    return acc;
  }, [rows]);

  const totalPipelineMtpa = rows.reduce((s, f) => s + f.capacityMtpa, 0);
  const avgLcoc = rows.length ? rows.reduce((s, f) => s + f.lcoc, 0) / rows.length : 0;
  const avgNetCost = rows.length ? rows.reduce((s, f) => s + f.netCost, 0) / rows.length : 0;

  const selected = rows.find(x => x.id === selectedId) || rows[0];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text }}>
      <div style={{ background: '#0C1A2E', padding: '20px 32px', borderBottom: `3px solid ${T.ccs}` }}>
        <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>CCUS Market & Storage Infrastructure Suite</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#F1F5F9' }}>CCUS Market Intelligence — Global Pipeline &amp; Incentive Economics</div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>10 named facilities · Operational / Construction / Planned · LCOC engine (GCCSI / IEA CCUS methodology)</div>
      </div>

      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <KpiCard label="Total Pipeline Capacity" value={`${totalPipelineMtpa.toFixed(1)} Mtpa`} sub="10 facilities, all statuses" color={T.ccs} />
          <KpiCard label="Operational Capacity" value={`${(capacityByStatus.Operational || 0).toFixed(1)} Mtpa`} sub="Capturing CO₂ today" color={T.green} />
          <KpiCard label="Avg LCOC" value={`$${avgLcoc.toFixed(0)}/tCO₂`} sub="Levelized cost of capture" color={T.indigo} />
          <KpiCard label="Avg Net Cost After Incentives" value={`$${avgNetCost.toFixed(0)}/tCO₂`} sub="45Q / CfD − LCOC + T&amp;S" color={avgNetCost <= 0 ? T.green : T.red} />
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, width: '100%', marginBottom: 4 }}>Model Inputs — Net = LCOC − 45Q/CfD + T&amp;S tariff</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}>Discount rate: {(r * 100).toFixed(1)}%<input type="range" min={4} max={14} step={0.5} value={r * 100} onChange={e => setR(+e.target.value / 100)} style={{ width: 100 }} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}>Project life: {n} yr<input type="range" min={15} max={30} value={n} onChange={e => setN(+e.target.value)} style={{ width: 100 }} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}>Energy price: ${pEnergy}/GJ<input type="range" min={2} max={20} value={pEnergy} onChange={e => setPEnergy(+e.target.value)} style={{ width: 100 }} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}>US 45Q credit: ${credit45q}/t<input type="range" min={0} max={180} step={5} value={credit45q} onChange={e => setCredit45q(+e.target.value)} style={{ width: 100 }} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}>Non-US CfD strike: ${cfdStrike}/t<input type="range" min={0} max={150} step={5} value={cfdStrike} onChange={e => setCfdStrike(+e.target.value)} style={{ width: 100 }} /></label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Global CCUS Pipeline — LCOC &amp; Net Cost After Incentives</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: '#F8F7F4' }}>
                  {['Facility', 'Country', 'Capture Type', 'Status', 'Capacity Mtpa', 'LCOC $/t', 'Net $/t'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {rows.map((f, i) => (
                    <tr key={f.id} onClick={() => setSelectedId(f.id)} style={{ borderTop: `1px solid ${T.border}`, background: f.id === selectedId ? '#EEF2FF' : (i % 2 ? '#FAFAF7' : T.card), cursor: 'pointer' }}>
                      <td style={{ padding: '7px 10px', fontWeight: 500 }}>{f.name}</td>
                      <td style={{ padding: '7px 10px', color: T.sub }}>{f.country}</td>
                      <td style={{ padding: '7px 10px', color: T.sub, fontSize: 10 }}>{f.captureType}</td>
                      <td style={{ padding: '7px 10px' }}><Pill v={f.status} /></td>
                      <td style={{ padding: '7px 10px' }}>{f.capacityMtpa.toFixed(1)}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 600, color: T.ccs }}>${f.lcoc.toFixed(0)}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 600, color: f.netCost <= 0 ? T.green : T.red }}>${f.netCost.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 10 }}>Click a row to select it for the breakdown panel. These are real, named public CCUS projects; capex/opex/energy-intensity figures are illustrative reference values (GCCSI / IEA CCUS Projects Database order-of-magnitude ranges), not live vendor quotes.</div>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Selected Facility: {selected ? selected.name : '—'}</div>
            {selected && [
              ['Country / Jurisdiction', `${selected.country} (${selected.jurisdiction})`],
              ['Capture type', selected.captureType],
              ['Status', selected.status],
              ['Capacity', `${selected.capacityMtpa.toFixed(1)} Mtpa`],
              ['Annualized CAPEX', `$${(selected.capexM * crf(r, n)).toFixed(1)}M/yr`],
              ['OpEx', `$${selected.opexM}M/yr`],
              ['LCOC (levelized)', `$${selected.lcoc.toFixed(0)}/tCO₂`],
              ['Support mechanism', selected.jurisdiction === 'US' ? `45Q: $${credit45q}/t` : `CfD strike: $${cfdStrike}/t`],
              ['+ T&S tariff', `$${selected.tsTariffPerT}/t`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                <span style={{ color: T.sub }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            {selected && (
              <div style={{ marginTop: 12, background: selected.netCost <= 0 ? '#F0FFF4' : '#FFF1F2', borderRadius: 8, padding: 12, border: `1px solid ${selected.netCost <= 0 ? T.green : T.red}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: selected.netCost <= 0 ? T.green : T.red }}>
                  Net cost: ${selected.netCost.toFixed(0)}/tCO₂ {selected.netCost <= 0 ? '(incentive-covered)' : '(residual cost after incentives)'}
                </div>
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={rows.map(f => ({ name: f.id, LCOC: Math.round(f.lcoc), Net: Math.round(f.netCost) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="$/t" />
                  <Tooltip formatter={v => [`$${v}/tCO₂`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="LCOC" fill={T.ccs} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Net" fill={T.amber} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
