import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const COMMODITIES = ['Steel', 'Aluminium', 'Cement', 'Chemicals', 'Fertilisers', 'Electricity', 'Hydrogen', 'Petroleum', 'Plastics', 'Paper/Pulp'];
const REGIONS_FROM = ['EU', 'China', 'USA', 'India', 'Russia', 'Brazil', 'South Korea', 'Japan', 'UK', 'Canada'];
const REGIONS_TO = ['EU', 'USA', 'UK', 'Canada', 'Japan', 'Australia', 'Switzerland', 'Norway', 'EFTA', 'Singapore'];
const CBAM_SECTORS = ['Steel', 'Aluminium', 'Cement', 'Chemicals', 'Fertilisers', 'Electricity', 'Hydrogen'];
const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

const CORRIDORS = Array.from({ length: 60 }, (_, i) => ({
  id: i + 1,
  name: `${REGIONS_FROM[i % REGIONS_FROM.length]} → ${REGIONS_TO[Math.floor(sr(i * 3 + 1) * REGIONS_TO.length)]}`,
  from: REGIONS_FROM[i % REGIONS_FROM.length],
  to: REGIONS_TO[Math.floor(sr(i * 3 + 1) * REGIONS_TO.length)],
  commodity: COMMODITIES[Math.floor(sr(i * 5 + 2) * COMMODITIES.length)],
  tradVolumeGt: parseFloat((sr(i * 7 + 3) * 10 + 0.5).toFixed(2)),
  tradValueBn: parseFloat((sr(i * 11 + 4) * 20 + 1).toFixed(1)),
  carbonContentMtco2e: parseFloat((sr(i * 13 + 5) * 5 + 0.1).toFixed(2)),
  cbamExposure: CBAM_SECTORS.includes(COMMODITIES[Math.floor(sr(i * 5 + 2) * COMMODITIES.length)]),
  cbamCostMn: CBAM_SECTORS.includes(COMMODITIES[Math.floor(sr(i * 5 + 2) * COMMODITIES.length)]) ? parseFloat((sr(i * 17 + 6) * 100 + 5).toFixed(1)) : 0,
  carbonPrice: parseFloat((sr(i * 19 + 7) * 80 + 30).toFixed(0)),
  competitiveImpact: parseFloat((sr(i * 23 + 8) * 9 + 1).toFixed(1)),
  regulatoryRisk: parseFloat((sr(i * 29 + 9) * 9 + 1).toFixed(1)),
  physicalRisk: parseFloat((sr(i * 31 + 10) * 9 + 1).toFixed(1)),
  leakageRisk: parseFloat((sr(i * 37 + 11) * 9 + 1).toFixed(1)),
  leadTimeDays: Math.round(sr(i * 41 + 12) * 60 + 5),
  alternateSources: Math.floor(sr(i * 43 + 13) * 5),
}));

const TABS = ['Trade Risk Overview', 'CBAM Exposure', 'Carbon Border Adjustment', 'Trade Corridor Analysis', 'Commodity Risk', 'Competitive Impact', 'Carbon Leakage', 'Policy Scenarios'];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Bar = ({ pct, color, height = 8 }) => (
  <div style={{ background: T.borderL, borderRadius: 4, height, overflow: 'hidden' }}>
    <div style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color || T.navy, height: '100%', borderRadius: 4 }} />
  </div>
);

export default function ClimateTradeFlowAnalyticsPage() {
  const [tab, setTab] = useState(0);
  const [commodityFilter, setCommodityFilter] = useState('All');
  const [cbamFilter, setCbamFilter] = useState(false);
  const [fromFilter, setFromFilter] = useState('All');

  const filtered = useMemo(() => {
    let d = CORRIDORS;
    if (commodityFilter !== 'All') d = d.filter(c => c.commodity === commodityFilter);
    if (cbamFilter) d = d.filter(c => c.cbamExposure);
    if (fromFilter !== 'All') d = d.filter(c => c.from === fromFilter);
    return [...d].sort((a, b) => b.cbamCostMn - a.cbamCostMn);
  }, [commodityFilter, cbamFilter, fromFilter]);

  const totalTradeValue = useMemo(() => CORRIDORS.reduce((a, c) => a + c.tradValueBn, 0), []);
  const totalCbamCost = useMemo(() => CORRIDORS.filter(c => c.cbamExposure).reduce((a, c) => a + c.cbamCostMn, 0), []);
  const totalCarbonContent = useMemo(() => CORRIDORS.reduce((a, c) => a + c.carbonContentMtco2e, 0), []);
  const cbamCorridorCount = useMemo(() => CORRIDORS.filter(c => c.cbamExposure).length, []);
  const avgCarbonPrice = useMemo(() => CORRIDORS.reduce((a, c) => a + c.carbonPrice, 0) / Math.max(1, CORRIDORS.length), []);
  const highLeakageCount = useMemo(() => CORRIDORS.filter(c => c.leakageRisk > 7).length, []);

  const commodityBreakdown = useMemo(() => COMMODITIES.map(com => {
    const cors = CORRIDORS.filter(c => c.commodity === com);
    return {
      commodity: com,
      count: cors.length,
      totalValue: cors.reduce((a, c) => a + c.tradValueBn, 0),
      totalCbamCost: cors.reduce((a, c) => a + c.cbamCostMn, 0),
      totalCarbon: cors.reduce((a, c) => a + c.carbonContentMtco2e, 0),
      isCbam: CBAM_SECTORS.includes(com),
      avgLeakage: cors.length ? cors.reduce((a, c) => a + c.leakageRisk, 0) / cors.length : 0,
    };
  }), []);

  const fromRegionBreakdown = useMemo(() => REGIONS_FROM.map(r => {
    const cors = CORRIDORS.filter(c => c.from === r);
    return {
      region: r,
      count: cors.length,
      totalCbamCost: cors.reduce((a, c) => a + c.cbamCostMn, 0),
      totalValue: cors.reduce((a, c) => a + c.tradValueBn, 0),
      avgRegRisk: cors.length ? cors.reduce((a, c) => a + c.regulatoryRisk, 0) / cors.length : 0,
    };
  }).sort((a, b) => b.totalCbamCost - a.totalCbamCost), []);

  const scenarios = [
    { name: 'CBAM Phase 1 (2026)', carbonPrice: 50, coverage: 'Steel, Aluminium, Cement', cost: totalCbamCost * 0.6, impactPct: 3.2 },
    { name: 'CBAM Full Phase (2034)', carbonPrice: 80, coverage: 'All 7 sectors + Extended', cost: totalCbamCost * 1.0, impactPct: 7.8 },
    { name: 'Global Carbon Price ($100)', carbonPrice: 100, coverage: 'G20 + Bilateral', cost: totalCbamCost * 1.4, impactPct: 12.5 },
    { name: 'Carbon Club (OECD)', carbonPrice: 75, coverage: 'OECD Countries', cost: totalCbamCost * 0.8, impactPct: 6.1 },
  ];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, borderBottom: `3px solid ${T.gold}`, padding: '20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ background: T.gold, color: T.navy, fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 3 }}>EP-DN5</span>
          <span style={{ color: T.gold, fontFamily: T.fontMono, fontSize: 11 }}>SUPPLY CHAIN CLIMATE INTELLIGENCE</span>
        </div>
        <h1 style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, margin: 0 }}>Climate Trade Flow Analytics</h1>
        <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>60 corridors · 10 commodities · CBAM exposure · Carbon border adjustment modelling · Trade flow risk · Carbon leakage assessment</p>
      </div>

      <div style={{ display: 'flex', gap: 12, padding: '16px 32px', background: T.cream, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
        <KpiCard label="Total Trade Value" value={`$${totalTradeValue.toFixed(0)}B`} sub="All 60 corridors" color={T.navy} />
        <KpiCard label="CBAM-Exposed Corridors" value={`${cbamCorridorCount}/60`} sub="EU Carbon Border Mechanism" color={T.orange} />
        <KpiCard label="Total CBAM Cost Exposure" value={`$${totalCbamCost.toFixed(0)}M`} sub="Annual carbon border costs" color={T.red} />
        <KpiCard label="Total Embodied Carbon" value={`${totalCarbonContent.toFixed(1)} MtCO₂e`} sub="Across all trade flows" color={T.amber} />
        <KpiCard label="Avg Carbon Price" value={`€${avgCarbonPrice.toFixed(0)}/t`} sub="Weighted ETS exposure" color={T.gold} />
        <KpiCard label="High Leakage Risk" value={`${highLeakageCount}`} sub="Corridors at leakage risk >7/10" color={T.purple} />
      </div>

      <div style={{ display: 'flex', gap: 0, padding: '0 32px', background: T.card, borderBottom: `1px solid ${T.border}`, overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: tab === i ? 700 : 400, color: tab === i ? T.navy : T.textSec, borderBottom: tab === i ? `2px solid ${T.navy}` : '2px solid transparent', fontSize: 13, whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '24px 32px' }}>

        {tab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              {['All', ...COMMODITIES].map(c => <button key={c} onClick={() => setCommodityFilter(c)} style={{ padding: '5px 12px', border: `1px solid ${commodityFilter === c ? T.navy : T.border}`, borderRadius: 20, background: commodityFilter === c ? T.navy : T.card, color: commodityFilter === c ? '#fff' : T.textPri, cursor: 'pointer', fontSize: 11 }}>{c}</button>)}
              <button onClick={() => setCbamFilter(!cbamFilter)} style={{ padding: '5px 12px', border: `1px solid ${cbamFilter ? T.red : T.border}`, borderRadius: 20, background: cbamFilter ? T.red : T.card, color: cbamFilter ? '#fff' : T.textPri, cursor: 'pointer', fontSize: 11 }}>CBAM Only</button>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Trade Corridor Risk Overview — {filtered.length} corridors</div>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Corridor', 'Commodity', 'Trade Value $B', 'Carbon (MtCO₂e)', 'CBAM', 'CBAM Cost $M', 'Carbon Price €/t', 'Leakage Risk', 'Action'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 25).map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '7px 10px', fontWeight: 600, fontSize: 11 }}>{c.name}</td>
                      <td style={{ padding: '7px 10px', fontSize: 11 }}>{c.commodity}</td>
                      <td style={{ padding: '7px 10px', fontFamily: T.fontMono, fontSize: 11 }}>{c.tradValueBn.toFixed(1)}</td>
                      <td style={{ padding: '7px 10px', fontFamily: T.fontMono, fontSize: 11 }}>{c.carbonContentMtco2e.toFixed(2)}</td>
                      <td style={{ padding: '7px 10px' }}>{c.cbamExposure ? <span style={{ color: T.red, fontWeight: 700 }}>Yes</span> : <span style={{ color: T.green }}>No</span>}</td>
                      <td style={{ padding: '7px 10px', fontFamily: T.fontMono, fontSize: 11, color: c.cbamCostMn > 0 ? T.orange : T.textSec, fontWeight: c.cbamCostMn > 0 ? 700 : 400 }}>{c.cbamCostMn > 0 ? c.cbamCostMn.toFixed(0) : '—'}</td>
                      <td style={{ padding: '7px 10px', fontFamily: T.fontMono, fontSize: 11 }}>€{c.carbonPrice}</td>
                      <td style={{ padding: '7px 10px', fontFamily: T.fontMono, fontSize: 11, color: c.leakageRisk > 7 ? T.red : c.leakageRisk > 5 ? T.amber : T.green, fontWeight: 700 }}>{c.leakageRisk.toFixed(1)}</td>
                      <td style={{ padding: '7px 10px' }}><span style={{ background: c.leakageRisk > 7 ? `${T.red}20` : `${T.amber}20`, color: c.leakageRisk > 7 ? T.red : T.amber, padding: '2px 6px', borderRadius: 10, fontSize: 10 }}>{c.leakageRisk > 7 ? 'Escalate' : 'Monitor'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              {CBAM_SECTORS.map((sec, i) => {
                const cors = CORRIDORS.filter(c => c.commodity === sec && c.cbamExposure);
                const cost = cors.reduce((a, c) => a + c.cbamCostMn, 0);
                return (
                  <div key={sec} style={{ flex: '1 1 150px', background: T.card, border: `2px solid ${T.red}`, borderRadius: 8, padding: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{sec}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: T.red, fontFamily: T.fontMono }}>${cost.toFixed(0)}M</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{cors.length} corridors · CBAM exposed</div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>CBAM Exposure by Origin Region</div>
              {fromRegionBreakdown.filter(r => r.totalCbamCost > 0).map((r, i) => (
                <div key={r.region} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{r.region}</span>
                    <span style={{ fontFamily: T.fontMono, fontSize: 12 }}>CBAM: ${r.totalCbamCost.toFixed(0)}M · Trade: ${r.totalValue.toFixed(1)}B · Reg Risk: {r.avgRegRisk.toFixed(1)}</span>
                  </div>
                  <Bar pct={totalCbamCost > 0 ? (r.totalCbamCost / totalCbamCost) * 100 : 0} color={[T.red, T.orange, T.amber, T.gold, T.teal, T.blue, T.indigo, T.purple][i % 8]} />
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Carbon Border Adjustment Mechanism — Cost Modelling</div>
            <div style={{ background: T.sub, borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>CBAM Calculation Methodology</div>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>
                CBAM Cost = Embedded Carbon (tCO₂e) × (EU ETS Price − Country Carbon Price). Applied to imports of Steel, Aluminium, Cement, Chemicals, Fertilisers, Electricity, Hydrogen. Phase-in: transitional 2023–2025 → payments from 2026 → full scope by 2034.
              </div>
            </div>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Commodity', 'Corridors', 'Embedded Carbon', 'CBAM Cost $M', 'Avg ETS Price €/t', '% of Trade Value', 'Risk Level'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commodityBreakdown.filter(c => c.isCbam).sort((a, b) => b.totalCbamCost - a.totalCbamCost).map((com, i) => (
                  <tr key={com.commodity} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{com.commodity}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{com.count}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.orange }}>{com.totalCarbon.toFixed(2)} MtCO₂e</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, fontWeight: 700, color: T.red }}>${com.totalCbamCost.toFixed(0)}M</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>€{CORRIDORS.filter(c => c.commodity === com.commodity).length ? (CORRIDORS.filter(c => c.commodity === com.commodity).reduce((a, c) => a + c.carbonPrice, 0) / CORRIDORS.filter(c => c.commodity === com.commodity).length).toFixed(0) : 0}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{com.totalValue > 0 ? ((com.totalCbamCost / (com.totalValue * 1000)) * 100).toFixed(1) : 0}%</td>
                    <td style={{ padding: '8px 12px' }}><span style={{ background: com.totalCbamCost > 300 ? `${T.red}20` : `${T.orange}20`, color: com.totalCbamCost > 300 ? T.red : T.orange, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{com.totalCbamCost > 300 ? 'Critical' : 'Significant'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>All 60 Trade Corridors — Full Detail</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              {['All', ...REGIONS_FROM].map(r => <button key={r} onClick={() => setFromFilter(r)} style={{ padding: '5px 10px', border: `1px solid ${fromFilter === r ? T.navy : T.border}`, borderRadius: 20, background: fromFilter === r ? T.navy : T.card, color: fromFilter === r ? '#fff' : T.textPri, cursor: 'pointer', fontSize: 11 }}>{r}</button>)}
            </div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Corridor', 'Commodity', 'Volume (Gt)', 'Value $B', 'Carbon (MtCO₂)', 'Comp. Impact', 'Phys. Risk', 'Lead Time', 'Alt Sources'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 30).map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '7px 10px', fontWeight: 600, fontSize: 11 }}>{c.name}</td>
                    <td style={{ padding: '7px 10px', fontSize: 11 }}>{c.commodity}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, fontSize: 11 }}>{c.tradVolumeGt.toFixed(2)}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, fontSize: 11 }}>{c.tradValueBn.toFixed(1)}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, fontSize: 11, color: T.orange }}>{c.carbonContentMtco2e.toFixed(2)}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, fontSize: 11, color: c.competitiveImpact > 7 ? T.red : T.amber }}>{c.competitiveImpact.toFixed(1)}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, fontSize: 11, color: c.physicalRisk > 7 ? T.red : T.green }}>{c.physicalRisk.toFixed(1)}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, fontSize: 11 }}>{c.leadTimeDays}d</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, fontSize: 11, color: c.alternateSources >= 3 ? T.green : T.red }}>{c.alternateSources}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Commodity Climate Risk Matrix</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {commodityBreakdown.map((com, i) => (
                <div key={com.commodity} style={{ background: T.sub, borderRadius: 8, padding: 16, border: `1px solid ${com.isCbam ? T.red : T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700 }}>{com.commodity}</span>
                    {com.isCbam && <span style={{ background: `${T.red}20`, color: T.red, padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>CBAM</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div><div style={{ fontSize: 10, color: T.textSec }}>Trade Value</div><div style={{ fontFamily: T.fontMono, fontWeight: 700 }}>${com.totalValue.toFixed(0)}B</div></div>
                    <div><div style={{ fontSize: 10, color: T.textSec }}>Embodied C</div><div style={{ fontFamily: T.fontMono, fontWeight: 700, color: T.orange }}>{com.totalCarbon.toFixed(1)} Mt</div></div>
                    <div><div style={{ fontSize: 10, color: T.textSec }}>CBAM Cost</div><div style={{ fontFamily: T.fontMono, fontWeight: 700, color: com.totalCbamCost > 0 ? T.red : T.green }}>{com.totalCbamCost > 0 ? `$${com.totalCbamCost.toFixed(0)}M` : '—'}</div></div>
                    <div><div style={{ fontSize: 10, color: T.textSec }}>Leakage</div><div style={{ fontFamily: T.fontMono, fontWeight: 700, color: com.avgLeakage > 6 ? T.red : T.teal }}>{com.avgLeakage.toFixed(1)}/10</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Competitive Impact Analysis — Climate Policy Asymmetry</div>
            <div style={{ marginBottom: 20 }}>
              {fromRegionBreakdown.map((r, i) => (
                <div key={r.region} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{r.region}</span>
                    <span style={{ fontFamily: T.fontMono, fontSize: 12 }}>Reg Risk: {r.avgRegRisk.toFixed(1)} · Trade: ${r.totalValue.toFixed(1)}B · CBAM: ${r.totalCbamCost.toFixed(0)}M</span>
                  </div>
                  <Bar pct={(r.avgRegRisk / 10) * 100} color={[T.red, T.orange, T.amber, T.gold, T.teal, T.blue, T.indigo, T.purple, T.green, T.sage][i]} />
                </div>
              ))}
            </div>
            <div style={{ background: T.sub, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Key Competitive Distortions</div>
              {[
                { issue: 'EU ETS vs. No Carbon Price', impact: 'High', corridors: CORRIDORS.filter(c => c.from === 'China' || c.from === 'India').length, risk: 'Carbon leakage & competitiveness loss' },
                { issue: 'CBAM Phase-In Uncertainty', impact: 'Medium', corridors: cbamCorridorCount, risk: 'Supply chain restructuring lead time' },
                { issue: 'Voluntary vs. Mandatory Standards', impact: 'Medium', corridors: Math.round(CORRIDORS.length * 0.4), risk: 'Greenwashing & certification fragmentation' },
              ].map(item => (
                <div key={item.issue} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ flex: 2 }}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{item.issue}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{item.risk}</div>
                  </div>
                  <div style={{ fontFamily: T.fontMono, fontSize: 12, color: T.navy }}>{item.corridors} corridors</div>
                  <span style={{ background: item.impact === 'High' ? `${T.red}20` : `${T.amber}20`, color: item.impact === 'High' ? T.red : T.amber, padding: '2px 8px', borderRadius: 10, fontSize: 11, height: 'fit-content' }}>{item.impact}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Carbon Leakage Risk Assessment</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              {[['Critical Leakage (>7)', CORRIDORS.filter(c => c.leakageRisk > 7).length, T.red], ['High Leakage (5–7)', CORRIDORS.filter(c => c.leakageRisk >= 5 && c.leakageRisk <= 7).length, T.orange], ['Low Leakage (<5)', CORRIDORS.filter(c => c.leakageRisk < 5).length, T.green]].map(([label, count, color]) => (
                <div key={label} style={{ flex: 1, background: T.sub, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: T.fontMono }}>{count}</div>
                  <div style={{ fontSize: 12, color: T.textSec }}>{label}</div>
                </div>
              ))}
            </div>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Corridor', 'Commodity', 'Leakage Risk', 'Carbon Price Diff €/t', 'Trade Value $B', 'Alternate Sources', 'Mitigation'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...CORRIDORS].sort((a, b) => b.leakageRisk - a.leakageRisk).slice(0, 20).map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, fontSize: 11 }}>{c.name}</td>
                    <td style={{ padding: '8px 10px', fontSize: 11 }}>{c.commodity}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.fontMono, fontWeight: 700, color: c.leakageRisk > 7 ? T.red : T.amber }}>{c.leakageRisk.toFixed(1)}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.fontMono }}>€{(c.carbonPrice * 0.6).toFixed(0)}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.fontMono }}>{c.tradValueBn.toFixed(1)}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.fontMono, color: c.alternateSources >= 3 ? T.green : T.red }}>{c.alternateSources}</td>
                    <td style={{ padding: '8px 10px' }}><span style={{ background: c.leakageRisk > 7 && c.alternateSources < 2 ? `${T.red}20` : `${T.teal}20`, color: c.leakageRisk > 7 && c.alternateSources < 2 ? T.red : T.teal, padding: '2px 6px', borderRadius: 10, fontSize: 10 }}>{c.leakageRisk > 7 && c.alternateSources < 2 ? 'Diversify' : 'CBAM Shield'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 7 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Carbon Border Adjustment Policy Scenarios</div>
            {scenarios.map((sc, i) => (
              <div key={sc.name} style={{ background: T.sub, borderRadius: 8, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, color: T.navy }}>{sc.name}</span>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.textSec }}>€{sc.carbonPrice}/t CO₂</span>
                </div>
                <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Coverage: {sc.coverage}</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div><div style={{ fontSize: 11, color: T.textSec }}>CBAM Cost Exposure</div><div style={{ fontSize: 20, fontWeight: 700, color: T.red, fontFamily: T.fontMono }}>${sc.cost.toFixed(0)}M</div></div>
                  <div><div style={{ fontSize: 11, color: T.textSec }}>Trade Value Impact</div><div style={{ fontSize: 20, fontWeight: 700, color: T.orange, fontFamily: T.fontMono }}>+{sc.impactPct}%</div></div>
                  <div><div style={{ fontSize: 11, color: T.textSec }}>Affected Corridors</div><div style={{ fontSize: 20, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>{Math.round(CORRIDORS.length * sc.impactPct / 20)}</div></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
