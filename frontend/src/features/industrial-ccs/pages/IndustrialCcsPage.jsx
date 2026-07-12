import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// EP-CCUS1 — Industrial CCS Abatement & Finance Model
// Methodology: IEAGHG / Global CCS Institute capture-cost framework + NETL techno-economic method.
// See docs/module_atlas/deep/industrial-ccs.md §8 for the full specification this page implements.

const T = { bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E', sub: '#6B7280', indigo: '#4F46E5', green: '#065F46', red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', sky: '#0369A1', ccs: '#334155' };

// Hand-authored industrial point sources. Capex/opex/energy figures are order-of-magnitude
// approximations consistent with published IEAGHG / NETL / Global CCS Institute cost ranges by
// source purity (high-purity fermentation/ammonia streams are far cheaper to capture than dilute
// cement flue gas). These are illustrative reference figures, not live market data.
const SOURCES = [
  { id: 'cement', name: 'Cement Kiln (calciner)', sector: 'Cement', purity: 'Dilute (~20% CO₂)', capexM: 180, fixedOmM: 12, varOmPerT: 8, energyGjPerT: 3.5, captureRate: 0.90, flueCO2Tpa: 900000 },
  { id: 'steel', name: 'BF-BOF Blast Furnace Gas', sector: 'Steel', purity: 'Moderate (~25% CO₂)', capexM: 220, fixedOmM: 15, varOmPerT: 6, energyGjPerT: 3.0, captureRate: 0.90, flueCO2Tpa: 1500000 },
  { id: 'ammonia', name: 'Ammonia Synthesis Off-Gas', sector: 'Chemicals', purity: 'High (~99% CO₂)', capexM: 40, fixedOmM: 3, varOmPerT: 2, energyGjPerT: 0.5, captureRate: 0.95, flueCO2Tpa: 400000 },
  { id: 'ethanol', name: 'Ethanol Fermentation', sector: 'Bio-Chemicals', purity: 'High (~99% CO₂)', capexM: 25, fixedOmM: 2, varOmPerT: 1.5, energyGjPerT: 0.3, captureRate: 0.95, flueCO2Tpa: 300000 },
  { id: 'refining', name: 'Refinery FCC / H₂ SMR', sector: 'Refining', purity: 'Moderate (~15-30% CO₂)', capexM: 200, fixedOmM: 14, varOmPerT: 7, energyGjPerT: 3.2, captureRate: 0.90, flueCO2Tpa: 1200000 },
  { id: 'gasproc', name: 'Natural Gas Processing', sector: 'Oil & Gas', purity: 'High (~50-90% CO₂)', capexM: 60, fixedOmM: 5, varOmPerT: 2.5, energyGjPerT: 0.8, captureRate: 0.90, flueCO2Tpa: 500000 },
  { id: 'wte', name: 'Waste-to-Energy Flue Gas', sector: 'Waste', purity: 'Dilute (~10-15% CO₂)', capexM: 150, fixedOmM: 11, varOmPerT: 9, energyGjPerT: 3.8, captureRate: 0.85, flueCO2Tpa: 600000 },
  { id: 'pulp', name: 'Pulp & Paper Recovery Boiler', sector: 'Pulp & Paper', purity: 'Dilute (~12-18% CO₂)', capexM: 130, fixedOmM: 9, varOmPerT: 7, energyGjPerT: 3.2, captureRate: 0.88, flueCO2Tpa: 500000 },
];

// CRF = r(1+r)^N / ((1+r)^N - 1)  — standard capital recovery factor
const crf = (r, n) => {
  if (r <= 0) return n > 0 ? 1 / n : 0;
  const f = Math.pow(1 + r, n);
  return (r * f) / (f - 1);
};

// LCOC_capture = (CAPEX·CRF + FixedO&M + Energy·P_energy + VariableO&M) / CO2_captured_tpa
function computeLcoc(src, { r, n, pEnergy }) {
  const co2Captured = src.flueCO2Tpa * src.captureRate;
  if (co2Captured <= 0) return { co2Captured: 0, lcoc: 0 };
  const annualCapex = src.capexM * 1e6 * crf(r, n);
  const annualFixedOm = src.fixedOmM * 1e6;
  const annualEnergy = src.energyGjPerT * co2Captured * pEnergy;
  const annualVarOm = src.varOmPerT * co2Captured;
  const lcoc = (annualCapex + annualFixedOm + annualEnergy + annualVarOm) / co2Captured;
  return { co2Captured, lcoc };
}

// AbatementCost = (LCOC_capture + T&S_cost − avoidedEmissionsValue) / (CaptureRate·EF_baseline)
// NetCost = AbatementCost − Credit_45Q − ETS_price
function computeAbatement(lcoc, src, { tsCost, avoidedValue, efBaseline, credit45q, etsPrice }) {
  const denom = Math.max(0.01, src.captureRate * efBaseline);
  const abatementCost = (lcoc + tsCost - avoidedValue) / denom;
  const netCost = abatementCost - credit45q - etsPrice;
  return { abatementCost, netCost };
}

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: '1 1 180px' }}>
    <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function IndustrialCcsPage() {
  const [r, setR] = useState(0.08);
  const [n, setN] = useState(25);
  const [pEnergy, setPEnergy] = useState(8);
  const [tsCost, setTsCost] = useState(18);
  const [credit45q, setCredit45q] = useState(85);
  const [etsPrice, setEtsPrice] = useState(0);
  const [selectedId, setSelectedId] = useState('cement');

  const rows = useMemo(() => SOURCES.map(src => {
    const { co2Captured, lcoc } = computeLcoc(src, { r, n, pEnergy });
    const { abatementCost, netCost } = computeAbatement(lcoc, src, { tsCost, avoidedValue: 0, efBaseline: 1, credit45q, etsPrice });
    return { ...src, co2Captured, lcoc, abatementCost, netCost };
  }), [r, n, pEnergy, tsCost, credit45q, etsPrice]);

  const avgLcoc = rows.length ? rows.reduce((s, x) => s + x.lcoc, 0) / rows.length : 0;
  const cheapest = rows.reduce((a, b) => (b.lcoc < a.lcoc ? b : a), rows[0]);
  const priciest = rows.reduce((a, b) => (b.lcoc > a.lcoc ? b : a), rows[0]);
  const totalFlueCO2Mtpa = rows.reduce((s, x) => s + x.flueCO2Tpa, 0) / 1e6;
  const avgCaptureRate = rows.length ? rows.reduce((s, x) => s + x.captureRate, 0) / rows.length : 0;

  const selected = rows.find(x => x.id === selectedId) || rows[0];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text }}>
      <div style={{ background: '#0C1A2E', padding: '20px 32px', borderBottom: `3px solid ${T.ccs}` }}>
        <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>EP-CCUS1 · Industrial Decarbonization Suite</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#F1F5F9' }}>Industrial CCS — Capture Cost & Abatement Economics</div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Cement · Steel · Ammonia · Ethanol · Refining · Gas Processing · WtE · Pulp &amp; Paper — LCOC engine (IEAGHG / NETL methodology)</div>
      </div>

      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <KpiCard label="Avg LCOC (8 sources)" value={`$${avgLcoc.toFixed(0)}/tCO₂`} sub="Levelized cost of capture" color={T.ccs} />
          <KpiCard label="Cheapest Source" value={cheapest ? `$${cheapest.lcoc.toFixed(0)}/t` : '—'} sub={cheapest ? cheapest.name : ''} color={T.green} />
          <KpiCard label="Most Expensive Source" value={priciest ? `$${priciest.lcoc.toFixed(0)}/t` : '—'} sub={priciest ? priciest.name : ''} color={T.red} />
          <KpiCard label="Avg Capture Rate" value={`${(avgCaptureRate * 100).toFixed(0)}%`} sub="Across 8 point sources" color={T.indigo} />
          <KpiCard label="Addressable Flue CO₂" value={`${totalFlueCO2Mtpa.toFixed(1)} Mtpa`} sub="Total across sources" color={T.teal} />
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, width: '100%', marginBottom: 4 }}>Model Inputs — CRF = r(1+r)ᴺ/((1+r)ᴺ−1); NetCost = Abatement − 45Q − ETS</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}>Discount rate: {(r * 100).toFixed(1)}%<input type="range" min={4} max={14} step={0.5} value={r * 100} onChange={e => setR(+e.target.value / 100)} style={{ width: 100 }} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}>Project life: {n} yr<input type="range" min={15} max={30} value={n} onChange={e => setN(+e.target.value)} style={{ width: 100 }} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}>Energy price: ${pEnergy}/GJ<input type="range" min={2} max={20} value={pEnergy} onChange={e => setPEnergy(+e.target.value)} style={{ width: 100 }} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}>T&amp;S cost: ${tsCost}/t<input type="range" min={5} max={40} value={tsCost} onChange={e => setTsCost(+e.target.value)} style={{ width: 100 }} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}>45Q credit: ${credit45q}/t<input type="range" min={0} max={180} step={5} value={credit45q} onChange={e => setCredit45q(+e.target.value)} style={{ width: 100 }} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}>EU ETS price: €{etsPrice}/t<input type="range" min={0} max={120} value={etsPrice} onChange={e => setEtsPrice(+e.target.value)} style={{ width: 100 }} /></label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Source Economics — LCOC, Abatement Cost &amp; Net Cost After Incentives</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: '#F8F7F4' }}>
                  {['Source', 'Sector', 'Purity', 'Capture', 'LCOC $/t', 'Abate $/t', 'Net $/t'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {rows.map((s, i) => (
                    <tr key={s.id} onClick={() => setSelectedId(s.id)} style={{ borderTop: `1px solid ${T.border}`, background: s.id === selectedId ? '#EEF2FF' : (i % 2 ? '#FAFAF7' : T.card), cursor: 'pointer' }}>
                      <td style={{ padding: '7px 10px', fontWeight: 500 }}>{s.name}</td>
                      <td style={{ padding: '7px 10px', color: T.sub }}>{s.sector}</td>
                      <td style={{ padding: '7px 10px', color: T.sub, fontSize: 10 }}>{s.purity}</td>
                      <td style={{ padding: '7px 10px' }}>{(s.captureRate * 100).toFixed(0)}%</td>
                      <td style={{ padding: '7px 10px', fontWeight: 600, color: T.ccs }}>${s.lcoc.toFixed(0)}</td>
                      <td style={{ padding: '7px 10px' }}>${s.abatementCost.toFixed(0)}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 600, color: s.netCost <= 0 ? T.green : T.red }}>${s.netCost.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 10 }}>Click a row to select it for the breakdown panel. Capex/opex/energy-intensity figures are illustrative reference values by source purity (IEAGHG / NETL / Global CCS Institute cost ranges), not live vendor quotes.</div>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Selected Source: {selected ? selected.name : '—'}</div>
            {selected && [
              ['Flue CO₂ available', `${(selected.flueCO2Tpa / 1e6).toFixed(2)} Mtpa`],
              ['Capture rate', `${(selected.captureRate * 100).toFixed(0)}%`],
              ['CO₂ captured', `${(selected.co2Captured / 1e6).toFixed(2)} Mtpa`],
              ['Annualized CAPEX', `$${(selected.capexM * crf(r, n)).toFixed(1)}M/yr`],
              ['Fixed O&M', `$${selected.fixedOmM}M/yr`],
              ['LCOC (levelized)', `$${selected.lcoc.toFixed(0)}/tCO₂`],
              ['+ T&S cost', `$${tsCost}/t`],
              ['Abatement cost', `$${selected.abatementCost.toFixed(0)}/tCO₂`],
              ['− 45Q credit', `-$${credit45q}/t`],
              ['− EU ETS price', `-€${etsPrice}/t`],
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
                <BarChart data={rows.map(s => ({ name: s.id, LCOC: Math.round(s.lcoc), Net: Math.round(s.netCost) }))}>
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
