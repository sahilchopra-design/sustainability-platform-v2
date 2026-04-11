import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const ASSET_CLASSES = ['Green Infrastructure', 'Health Systems', 'Clean Energy', 'Nature-Based Solutions', 'Social Housing'];
const WELLBY_CATEGORIES = ['Life Satisfaction', 'Positive Affect', 'Negative Affect Reduction', 'Autonomy', 'Purpose'];

const INVESTMENTS = Array.from({ length: 70 }, (_, i) => {
  const invNames = ['Clean Water Uganda','Solar Health Clinics Kenya','Urban Green Corridor Delhi','Mental Health Platform Bangladesh','Coastal Resilience Fiji','Green Hospital Network Nigeria','Mangrove Restoration Indonesia','Heat Resilience Housing Cairo','Clean Cookstoves Ethiopia','Maternal Health Mobile India','Urban Forest São Paulo','Flood Early Warning Dhaka','Air Quality Sensors Lagos','Community Solar Myanmar','Climate Shelter Network Haiti','Nutrition Security Mali','Telehealth Platform Nepal','Water Harvest Morocco','Green Transport Kampala','Wetland Restoration Mekong','Pediatric Climate Health Pakistan','Elder Heat Protection Spain','Community Resilience Hubs Philippines','Green School Network Tanzania','Mental Health Apps Vietnam','Heat Wave Alert Systems Greece','Urban Cooling Parks Mexico','Disease Surveillance AI Ghana','Climate-Smart Agriculture Peru','Renewable Energy Health Bolivia','Pacific MH Support Tonga','Clean Fuel Schools Rwanda','Drought Resilience Somalia','Food Security Monitoring Niger','Child Health Climate Jordan','Eco-Anxiety CBT Australia','Flood Preparedness Bangladesh','Heatwave Warning India II','Air Purification Schools China','Ocean Health Monitor Palau','Sea Wall Finance Kiribati','Island Health Resilience Maldives','Drought Relief Ethiopia II','Water Security Zambia','Green Hospital Chile','Climate Trauma Support NZ','Arctic Health Monitoring Canada','Coastal MH Program USA','Urban Heat Health UK','Climate Anxiety Germany','Nordic Green Health Sweden','Alpine Climate Medicine Switzerland','Wildfire Health Australia','Cyclone Health Preparedness Japan','Volcano Risk Health Indonesia','Flood Health Korea','Typhoon Resilience Philippines II','Heatstroke Prevention Taiwan','Desertification Health Niger II','Glacial Retreat Health Peru II','Sea Rise Health Vietnam II','Mangrove Health Belize','Delta Health Bangladesh II','Steppe Health Mongolia','Tundra Health Russia','Savanna Health Botswana','Rainforest Health Brazil II','Coral Health Palau II','Reef Health GBR Australia','Watershed Health Colombia'];
  const acIdx = Math.floor(sr(i * 5) * ASSET_CLASSES.length);
  const grossReturn = 4 + sr(i * 7) * 8;
  const wellbyScore = 20 + sr(i * 11) * 75;
  const socialRoi = 1.5 + sr(i * 13) * 8.5;
  const healthCobenefits = 0.5 + sr(i * 17) * 9.5;
  const wellbyCostPerUnit = 1000 + sr(i * 19) * 49000;
  const finalReturn = grossReturn * (1 + wellbyScore / 200);
  const sdgAlignment = Math.round(1 + sr(i * 23) * 5);
  const impactMultiplier = 1 + sr(i * 29) * 4;
  const aum = 10 + sr(i * 31) * 490;
  return {
    id: i,
    name: invNames[i] || `Investment ${i+1}`,
    assetClass: ASSET_CLASSES[acIdx],
    grossReturn: +grossReturn.toFixed(2),
    wellbyScore: +wellbyScore.toFixed(1),
    socialRoi: +socialRoi.toFixed(2),
    healthCobenefits: +healthCobenefits.toFixed(2),
    wellbyCostPerUnit: +wellbyCostPerUnit.toFixed(0),
    finalReturn: +finalReturn.toFixed(2),
    sdgAlignment,
    impactMultiplier: +impactMultiplier.toFixed(2),
    aum: +aum.toFixed(0),
  };
});

const WELLBY_DATA = WELLBY_CATEGORIES.map((cat, i) => ({
  category: cat,
  avgScore: +(30 + sr(i * 41) * 60).toFixed(1),
  climateImpact: +(5 + sr(i * 43) * 45).toFixed(1),
  investmentNeeded: +(1 + sr(i * 47) * 29).toFixed(1),
  monetaryValue: +(5000 + sr(i * 53) * 45000).toFixed(0),
  improvementPotential: +(10 + sr(i * 59) * 50).toFixed(1),
}));

const TABS = ['Overview', 'WELLBY Scores', 'Social ROI', 'Health Co-Benefits', 'Asset Class Analysis', 'WELLBY Framework', 'Impact Multiplier', 'Portfolio Construction'];

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

export default function WellbeingAdjustedReturnsPage() {
  const [tab, setTab] = useState(0);
  const [assetFilter, setAssetFilter] = useState('All');
  const [sortBy, setSortBy] = useState('wellbyScore');
  const [wellbyMin, setWellbyMin] = useState(0);

  const filtered = useMemo(() => {
    const base = INVESTMENTS.filter(inv =>
      (assetFilter === 'All' || inv.assetClass === assetFilter) &&
      inv.wellbyScore >= wellbyMin
    );
    return [...base].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [assetFilter, sortBy, wellbyMin]);

  const avgWellby = filtered.length ? (filtered.reduce((a, i) => a + i.wellbyScore, 0) / filtered.length).toFixed(1) : '0.0';
  const avgSocialRoi = filtered.length ? (filtered.reduce((a, i) => a + i.socialRoi, 0) / filtered.length).toFixed(2) : '0.00';
  const totalAum = filtered.reduce((a, i) => a + i.aum, 0).toFixed(0);
  const avgFinalReturn = filtered.length ? (filtered.reduce((a, i) => a + i.finalReturn, 0) / filtered.length).toFixed(2) : '0.00';
  const avgHealthCob = filtered.length ? (filtered.reduce((a, i) => a + i.healthCobenefits, 0) / filtered.length).toFixed(2) : '0.00';
  const highImpact = filtered.filter(i => i.wellbyScore > 70 && i.socialRoi > 5).length;

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto', fontFamily: "'DM Sans', sans-serif", background: T.bg, minHeight: '100vh' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>EP-DP6 · HEALTH & CLIMATE WELLBEING</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: T.navy, margin: 0 }}>Wellbeing-Adjusted Returns</h1>
            <p style={{ color: T.textSec, fontSize: 13, marginTop: 4 }}>WELLBY framework · Social ROI · Health co-benefits — 70 investments · 5 asset classes</p>
          </div>
          <div style={{ background: T.sub, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 16px', fontSize: 11, color: T.textSec }}>
            <b style={{ color: T.navy }}>WELLBY</b> = Well-Being-Years gained per £ invested<br />
            <span>Source: Layard et al. · OECD subjective wellbeing framework</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Avg WELLBY Score" value={`${avgWellby}/100`} sub="Wellbeing index" color={T.teal} />
        <KpiCard label="Avg Social ROI" value={`${avgSocialRoi}×`} sub="Social return" color={T.sage} />
        <KpiCard label="Total AUM" value={`$${totalAum}M`} sub="In scope" color={T.navy} />
        <KpiCard label="WELLBY-Adj Return" value={`${avgFinalReturn}%`} sub="Including co-benefits" color={T.gold} />
        <KpiCard label="Avg Health Co-Ben" value={`$${avgHealthCob}Bn`} sub="Monetized health gains" color={T.indigo} />
        <KpiCard label="High-Impact" value={highImpact} sub="WELLBY>70 & SRoI>5×" color={T.purple} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={assetFilter} onChange={e => setAssetFilter(e.target.value)} style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, background: T.card, color: T.navy }}>
          <option value="All">All Asset Classes</option>
          {ASSET_CLASSES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, background: T.card, color: T.navy }}>
          <option value="wellbyScore">Sort: WELLBY Score</option>
          <option value="socialRoi">Sort: Social ROI</option>
          <option value="finalReturn">Sort: Final Return</option>
          <option value="healthCobenefits">Sort: Health Co-Benefits</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Min WELLBY:</span>
          <input type="range" min={0} max={80} value={wellbyMin} onChange={e => setWellbyMin(+e.target.value)} style={{ width: 100 }} />
          <span style={{ fontSize: 12, fontFamily: T.fontMono, color: T.navy }}>{wellbyMin}</span>
        </div>
        <span style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center' }}>{filtered.length} investments</span>
      </div>

      <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: `2px solid ${T.border}` }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 14px', border: 'none', background: 'none', borderBottom: tab === i ? `2px solid ${T.navy}` : '2px solid transparent', color: tab === i ? T.navy : T.textSec, fontWeight: tab === i ? 700 : 400, fontSize: 12, cursor: 'pointer', marginBottom: -2 }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Top WELLBY Investments</div>
            {filtered.slice(0, 12).map((inv, i) => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontFamily: T.fontMono, color: T.textSec, width: 18 }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: T.navy, fontWeight: 600 }}>{inv.name}</div>
                  <div style={{ fontSize: 10, color: T.textSec }}>{inv.assetClass}</div>
                </div>
                <span style={{ fontSize: 12, fontFamily: T.fontMono, color: T.teal }}>{inv.wellbyScore}</span>
                <span style={{ fontSize: 12, fontFamily: T.fontMono, color: T.sage }}>{inv.finalReturn}%</span>
                <div style={{ width: 60 }}><Bar pct={inv.wellbyScore} color={T.teal} /></div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>WELLBY Categories</div>
            {WELLBY_DATA.map(w => (
              <div key={w.category} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 13, color: T.navy }}>{w.category}</span>
                  <span style={{ fontSize: 11, fontFamily: T.fontMono, color: T.teal }}>{w.avgScore}/100</span>
                </div>
                <Bar pct={w.avgScore} color={T.teal} />
                <div style={{ display: 'flex', gap: 12, marginTop: 3 }}>
                  <span style={{ fontSize: 10, color: T.textSec }}>Climate impact: -{w.climateImpact}pts</span>
                  <span style={{ fontSize: 10, color: T.textSec }}>Value: ${(w.monetaryValue / 1000).toFixed(1)}k/WBY</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>WELLBY Scores — All Investments</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {filtered.map(inv => (
              <div key={inv.id} style={{ background: T.sub, borderRadius: 6, padding: '10px 12px', borderLeft: `3px solid ${inv.wellbyScore > 70 ? T.teal : inv.wellbyScore > 50 ? T.sage : T.amber}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.navy, marginBottom: 2 }}>{inv.name}</div>
                <div style={{ fontSize: 9, color: T.textSec, marginBottom: 4 }}>{inv.assetClass}</div>
                <div style={{ fontSize: 24, fontWeight: 700, fontFamily: T.fontMono, color: inv.wellbyScore > 70 ? T.teal : T.sage }}>{inv.wellbyScore}</div>
                <div style={{ fontSize: 9, color: T.textSec }}>AUM: ${inv.aum}M · SDG: {inv.sdgAlignment} goals</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Social Return on Investment (SROI)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[...filtered].sort((a, b) => b.socialRoi - a.socialRoi).slice(0, 28).map(inv => (
                <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: T.sub, borderRadius: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{inv.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{inv.assetClass}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontFamily: T.fontMono, fontWeight: 700, color: inv.socialRoi > 5 ? T.sage : T.teal }}>{inv.socialRoi}×</div>
                    <div style={{ fontSize: 9, color: T.textSec }}>SROI</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Health Co-Benefits ($Bn monetized)</div>
          {[...filtered].sort((a, b) => b.healthCobenefits - a.healthCobenefits).slice(0, 25).map(inv => (
            <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ width: 160, fontSize: 12, color: T.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.name}</span>
              <span style={{ width: 120, fontSize: 11, color: T.textSec }}>{inv.assetClass}</span>
              <div style={{ flex: 1 }}><Bar pct={inv.healthCobenefits / 10 * 100} color={T.indigo} /></div>
              <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.indigo, width: 55 }}>${inv.healthCobenefits}Bn</span>
            </div>
          ))}
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {ASSET_CLASSES.map((ac, i) => {
              const acInvs = filtered.filter(inv => inv.assetClass === ac);
              const avgW = acInvs.length ? (acInvs.reduce((a, inv) => a + inv.wellbyScore, 0) / acInvs.length).toFixed(1) : '0.0';
              const avgR = acInvs.length ? (acInvs.reduce((a, inv) => a + inv.finalReturn, 0) / acInvs.length).toFixed(2) : '0.00';
              const totalA = acInvs.reduce((a, inv) => a + inv.aum, 0).toFixed(0);
              const avgSroi = acInvs.length ? (acInvs.reduce((a, inv) => a + inv.socialRoi, 0) / acInvs.length).toFixed(2) : '0.00';
              return (
                <div key={ac} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontWeight: 700, color: T.navy, marginBottom: 2 }}>{ac}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 10 }}>{acInvs.length} investments · ${totalA}M AUM</div>
                  {[
                    { label: 'Avg WELLBY', val: avgW, color: T.teal },
                    { label: 'WELLBY-Adj Return', val: `${avgR}%`, color: T.sage },
                    { label: 'Avg Social ROI', val: `${avgSroi}×`, color: T.indigo },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, padding: '4px 0', borderBottom: `1px solid ${T.borderL}` }}>
                      <span style={{ fontSize: 12, color: T.textSec }}>{item.label}</span>
                      <span style={{ fontSize: 14, fontFamily: T.fontMono, fontWeight: 700, color: item.color }}>{item.val}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>WELLBY Framework — Wellbeing Dimensions</div>
          {WELLBY_DATA.map(w => (
            <div key={w.category} style={{ marginBottom: 14, padding: '12px 14px', background: T.sub, borderRadius: 8, borderLeft: `3px solid ${T.teal}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{w.category}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { label: 'Avg Score', val: `${w.avgScore}/100`, color: T.teal },
                  { label: 'Climate Impact', val: `-${w.climateImpact}pts`, color: T.red },
                  { label: 'Invest Needed', val: `$${w.investmentNeeded}Bn`, color: T.indigo },
                  { label: 'Value per WBY', val: `$${(w.monetaryValue / 1000).toFixed(0)}k`, color: T.gold },
                ].map(item => (
                  <div key={item.label} style={{ background: T.card, borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: T.textSec }}>{item.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: T.fontMono, color: item.color }}>{item.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8 }}>
                <Bar pct={w.avgScore} color={T.teal} />
                <div style={{ fontSize: 10, color: T.textSec, marginTop: 4 }}>Improvement potential: +{w.improvementPotential}pts with targeted investment</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 6 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Impact Multiplier — Wellbeing Leverage per Dollar</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[...filtered].sort((a, b) => b.impactMultiplier - a.impactMultiplier).slice(0, 24).map(inv => (
              <div key={inv.id} style={{ background: T.sub, borderRadius: 6, padding: '10px 12px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{inv.name}</div>
                <div style={{ fontSize: 10, color: T.textSec, marginBottom: 6 }}>{inv.assetClass}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div><div style={{ fontSize: 9, color: T.textSec }}>Impact Mult.</div><div style={{ fontSize: 22, fontFamily: T.fontMono, fontWeight: 700, color: inv.impactMultiplier > 3 ? T.sage : T.teal }}>{inv.impactMultiplier}×</div></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontSize: 9, color: T.textSec }}>WELLBY/unit</div><div style={{ fontSize: 14, fontFamily: T.fontMono, fontWeight: 700, color: T.gold }}>${(inv.wellbyCostPerUnit / 1000).toFixed(1)}k</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 7 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>WELLBY Portfolio Construction — Frontier Investments</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Investment', 'Asset Class', 'AUM $M', 'Gross Return', 'WELLBY Score', 'Social ROI', 'Health Co-Ben', 'WELLBY-Adj Return'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, color: T.textSec, fontFamily: T.fontMono, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.filter(inv => inv.wellbyScore > 60).slice(0, 20).map((inv, i) => (
                    <tr key={inv.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy, fontSize: 11 }}>{inv.name}</td>
                      <td style={{ padding: '8px 12px', fontSize: 11 }}>{inv.assetClass}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{inv.aum}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.sage }}>{inv.grossReturn}%</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.teal }}>{inv.wellbyScore}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.sage }}>{inv.socialRoi}×</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.indigo }}>${inv.healthCobenefits}Bn</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.gold, fontWeight: 700 }}>{inv.finalReturn}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
