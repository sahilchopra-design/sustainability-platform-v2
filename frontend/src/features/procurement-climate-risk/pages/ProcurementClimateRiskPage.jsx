import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const REGIONS = ['EU', 'APAC', 'Americas', 'Middle East', 'Africa', 'South Asia', 'East Asia', 'Oceania'];
const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
const CAT_TYPES = ['Direct Materials', 'Indirect Materials', 'Services', 'Capital Equipment', 'Logistics', 'Energy', 'IT & Digital', 'Facilities'];

const CATEGORIES = Array.from({ length: 70 }, (_, i) => ({
  id: i + 1,
  name: `Proc. Category ${i + 1}`,
  type: CAT_TYPES[Math.floor(sr(i * 3 + 1) * CAT_TYPES.length)],
  region: REGIONS[Math.floor(sr(i * 7 + 2) * REGIONS.length)],
  physicalRisk: parseFloat((sr(i * 11 + 3) * 9 + 1).toFixed(1)),
  transitionRisk: parseFloat((sr(i * 13 + 4) * 9 + 1).toFixed(1)),
  spendMn: parseFloat((sr(i * 17 + 5) * 30 + 1).toFixed(1)),
  supplierCount: Math.round(sr(i * 19 + 6) * 20 + 2),
  concentrationHhi: parseFloat((sr(i * 23 + 7) * 0.6 + 0.1).toFixed(3)),
  carbonIntensity: parseFloat((sr(i * 29 + 8) * 200 + 10).toFixed(1)),
  climateVulnerability: parseFloat((sr(i * 31 + 9) * 9 + 1).toFixed(1)),
  adaptationCapacity: parseFloat((sr(i * 37 + 10) * 9 + 1).toFixed(1)),
  regulatoryExposure: parseFloat((sr(i * 41 + 11) * 9 + 1).toFixed(1)),
  alternativeAvailability: Math.floor(sr(i * 43 + 12) * 4),
}));

const TABS = ['Risk Dashboard', 'Physical Risk', 'Transition Risk', 'Concentration Analysis', 'Category Deep-Dive', 'Regional Heat Map', 'Mitigation Playbook', 'Scenarios'];

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

const RiskBadge = ({ score }) => {
  const level = score >= 7.5 ? 'Critical' : score >= 5.5 ? 'High' : score >= 3.5 ? 'Medium' : 'Low';
  const colors = { Critical: T.red, High: T.orange, Medium: T.amber, Low: T.green };
  return <span style={{ background: `${colors[level]}20`, color: colors[level], padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{level}</span>;
};

export default function ProcurementClimateRiskPage() {
  const [tab, setTab] = useState(0);
  const [regionFilter, setRegionFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [selectedCat, setSelectedCat] = useState(null);

  const filtered = useMemo(() => {
    let d = CATEGORIES;
    if (regionFilter !== 'All') d = d.filter(c => c.region === regionFilter);
    if (typeFilter !== 'All') d = d.filter(c => c.type === typeFilter);
    if (riskFilter !== 'All') {
      d = d.filter(c => {
        const composite = (c.physicalRisk + c.transitionRisk) / 2;
        const level = composite >= 7.5 ? 'Critical' : composite >= 5.5 ? 'High' : composite >= 3.5 ? 'Medium' : 'Low';
        return level === riskFilter;
      });
    }
    return [...d].sort((a, b) => ((b.physicalRisk + b.transitionRisk) / 2) - ((a.physicalRisk + a.transitionRisk) / 2));
  }, [regionFilter, typeFilter, riskFilter]);

  const totalSpend = useMemo(() => CATEGORIES.reduce((a, c) => a + c.spendMn, 0), []);
  const avgPhysical = useMemo(() => CATEGORIES.reduce((a, c) => a + c.physicalRisk, 0) / Math.max(1, CATEGORIES.length), []);
  const avgTransition = useMemo(() => CATEGORIES.reduce((a, c) => a + c.transitionRisk, 0) / Math.max(1, CATEGORIES.length), []);
  const criticalCount = useMemo(() => CATEGORIES.filter(c => (c.physicalRisk + c.transitionRisk) / 2 >= 7.5).length, []);
  const highHhiCount = useMemo(() => CATEGORIES.filter(c => c.concentrationHhi > 0.4).length, []);

  const regionalBreakdown = useMemo(() => REGIONS.map(r => {
    const cats = CATEGORIES.filter(c => c.region === r);
    const spend = cats.reduce((a, c) => a + c.spendMn, 0);
    const avgPR = cats.length ? cats.reduce((a, c) => a + c.physicalRisk, 0) / cats.length : 0;
    const avgTR = cats.length ? cats.reduce((a, c) => a + c.transitionRisk, 0) / cats.length : 0;
    return { region: r, count: cats.length, spend, avgPR, avgTR, composite: (avgPR + avgTR) / 2 };
  }).sort((a, b) => b.composite - a.composite), []);

  const typeBreakdown = useMemo(() => CAT_TYPES.map(t => {
    const cats = CATEGORIES.filter(c => c.type === t);
    const spend = cats.reduce((a, c) => a + c.spendMn, 0);
    const avgPR = cats.length ? cats.reduce((a, c) => a + c.physicalRisk, 0) / cats.length : 0;
    const avgCI = cats.length ? cats.reduce((a, c) => a + c.carbonIntensity, 0) / cats.length : 0;
    return { type: t, count: cats.length, spend, avgPR, avgCI };
  }), []);

  const top10ByRisk = useMemo(() => [...CATEGORIES].sort((a, b) => ((b.physicalRisk + b.transitionRisk) / 2) - ((a.physicalRisk + a.transitionRisk) / 2)).slice(0, 10), []);
  const top10BySpend = useMemo(() => [...CATEGORIES].sort((a, b) => b.spendMn - a.spendMn).slice(0, 10), []);

  const mitigationActions = [
    { action: 'Dual-source critical categories', impact: 'High', cost: 'Medium', timeline: '6–12 months', categories: criticalCount },
    { action: 'Climate risk clauses in contracts', impact: 'Medium', cost: 'Low', timeline: '1–3 months', categories: Math.round(CATEGORIES.length * 0.6) },
    { action: 'Supplier resilience assessment', impact: 'High', cost: 'Medium', timeline: '3–6 months', categories: Math.round(CATEGORIES.length * 0.4) },
    { action: 'Regional diversification programme', impact: 'High', cost: 'High', timeline: '12–24 months', categories: highHhiCount },
    { action: 'Carbon pricing in sourcing decisions', impact: 'Medium', cost: 'Low', timeline: '3–6 months', categories: Math.round(CATEGORIES.length * 0.8) },
  ];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, borderBottom: `3px solid ${T.gold}`, padding: '20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ background: T.gold, color: T.navy, fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 3 }}>EP-DN2</span>
          <span style={{ color: T.gold, fontFamily: T.fontMono, fontSize: 11 }}>SUPPLY CHAIN CLIMATE INTELLIGENCE</span>
        </div>
        <h1 style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, margin: 0 }}>Procurement Climate Risk Analytics</h1>
        <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>Physical & transition risk by category · 70 categories · 8 regions · Supplier concentration · Climate vulnerability indexing</p>
      </div>

      <div style={{ display: 'flex', gap: 12, padding: '16px 32px', background: T.cream, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
        <KpiCard label="Total Procurement Spend" value={`$${(totalSpend / 1000).toFixed(1)}B`} sub="Under climate risk analysis" color={T.navy} />
        <KpiCard label="Avg Physical Risk" value={`${avgPhysical.toFixed(1)}/10`} sub="Across 70 categories" color={T.red} />
        <KpiCard label="Avg Transition Risk" value={`${avgTransition.toFixed(1)}/10`} sub="Regulatory & market exposure" color={T.orange} />
        <KpiCard label="Critical Risk Categories" value={criticalCount} sub="Composite score ≥ 7.5/10" color={T.red} />
        <KpiCard label="High Concentration (HHI>0.4)" value={highHhiCount} sub="Single-source vulnerability" color={T.amber} />
        <KpiCard label="Avg Carbon Intensity" value={`${(CATEGORIES.reduce((a, c) => a + c.carbonIntensity, 0) / Math.max(1, CATEGORIES.length)).toFixed(0)}`} sub="tCO₂e/$M spend" color={T.teal} />
      </div>

      <div style={{ display: 'flex', gap: 0, padding: '0 32px', background: T.card, borderBottom: `1px solid ${T.border}`, overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: tab === i ? 700 : 400, color: tab === i ? T.navy : T.textSec, borderBottom: tab === i ? `2px solid ${T.navy}` : '2px solid transparent', fontSize: 13, whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '24px 32px' }}>

        {tab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 2, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Top 10 Categories by Composite Risk Score</div>
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Category', 'Type', 'Region', 'Physical', 'Transition', 'Composite', 'Spend $M', 'Level'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {top10ByRisk.map((c, i) => {
                      const composite = (c.physicalRisk + c.transitionRisk) / 2;
                      return (
                        <tr key={c.id} style={{ background: i % 2 === 0 ? T.card : T.sub, cursor: 'pointer' }} onClick={() => setSelectedCat(c)}>
                          <td style={{ padding: '8px 10px', fontWeight: 600 }}>{c.name}</td>
                          <td style={{ padding: '8px 10px', fontSize: 11, color: T.textSec }}>{c.type}</td>
                          <td style={{ padding: '8px 10px', fontSize: 11 }}>{c.region}</td>
                          <td style={{ padding: '8px 10px', fontFamily: T.fontMono, color: T.red, fontWeight: 700 }}>{c.physicalRisk.toFixed(1)}</td>
                          <td style={{ padding: '8px 10px', fontFamily: T.fontMono, color: T.orange, fontWeight: 700 }}>{c.transitionRisk.toFixed(1)}</td>
                          <td style={{ padding: '8px 10px', fontFamily: T.fontMono, fontWeight: 700 }}>{composite.toFixed(1)}</td>
                          <td style={{ padding: '8px 10px', fontFamily: T.fontMono }}>{c.spendMn.toFixed(1)}</td>
                          <td style={{ padding: '8px 10px' }}><RiskBadge score={composite} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Risk Distribution</div>
                {RISK_LEVELS.map((level, i) => {
                  const cnt = CATEGORIES.filter(c => {
                    const composite = (c.physicalRisk + c.transitionRisk) / 2;
                    return level === 'Critical' ? composite >= 7.5 : level === 'High' ? composite >= 5.5 && composite < 7.5 : level === 'Medium' ? composite >= 3.5 && composite < 5.5 : composite < 3.5;
                  }).length;
                  const colors = [T.green, T.amber, T.orange, T.red];
                  return (
                    <div key={level} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, color: colors[i] }}>{level}</span>
                        <span style={{ fontFamily: T.fontMono, fontSize: 12 }}>{cnt} cats · {((cnt / Math.max(1, CATEGORIES.length)) * 100).toFixed(0)}%</span>
                      </div>
                      <Bar pct={(cnt / Math.max(1, CATEGORIES.length)) * 100} color={colors[i]} />
                    </div>
                  );
                })}
                <div style={{ marginTop: 20, background: T.sub, borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>At-Risk Spend Breakdown</div>
                  {RISK_LEVELS.reverse().map((level, i) => {
                    const cats = CATEGORIES.filter(c => {
                      const composite = (c.physicalRisk + c.transitionRisk) / 2;
                      return level === 'Critical' ? composite >= 7.5 : level === 'High' ? composite >= 5.5 && composite < 7.5 : level === 'Medium' ? composite >= 3.5 && composite < 5.5 : composite < 3.5;
                    });
                    const spend = cats.reduce((a, c) => a + c.spendMn, 0);
                    const colors = [T.red, T.orange, T.amber, T.green];
                    return (
                      <div key={level} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
                        <span style={{ color: colors[i] }}>{level}</span>
                        <span style={{ fontFamily: T.fontMono, fontWeight: 700 }}>${spend.toFixed(0)}M</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              {['All', ...REGIONS].map(r => (
                <button key={r} onClick={() => setRegionFilter(r)} style={{ padding: '6px 14px', border: `1px solid ${regionFilter === r ? T.red : T.border}`, borderRadius: 20, background: regionFilter === r ? T.red : T.card, color: regionFilter === r ? '#fff' : T.textPri, cursor: 'pointer', fontSize: 12 }}>{r}</button>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Physical Risk Indicators by Region</div>
              {regionalBreakdown.map((r, i) => (
                <div key={r.region} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{r.region}</span>
                    <span style={{ fontFamily: T.fontMono, fontSize: 12 }}>Phys: {r.avgPR.toFixed(1)} · Trans: {r.avgTR.toFixed(1)} · {r.count} cats · ${r.spend.toFixed(0)}M spend</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ flex: 1 }}><Bar pct={(r.avgPR / 10) * 100} color={T.red} /></div>
                    <div style={{ flex: 1 }}><Bar pct={(r.avgTR / 10) * 100} color={T.orange} /></div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Category Physical Risk Detail — {filtered.length} categories</div>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Category', 'Type', 'Region', 'Physical Risk', 'Climate Vulnerability', 'Adapt. Capacity', 'Reg. Exposure', 'Spend $M'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 25).map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '7px 10px', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{c.type}</td>
                      <td style={{ padding: '7px 10px', fontSize: 11 }}>{c.region}</td>
                      <td style={{ padding: '7px 10px', fontFamily: T.fontMono, fontWeight: 700, color: c.physicalRisk >= 7.5 ? T.red : c.physicalRisk >= 5 ? T.orange : T.green }}>{c.physicalRisk.toFixed(1)}</td>
                      <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{c.climateVulnerability.toFixed(1)}</td>
                      <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{c.adaptationCapacity.toFixed(1)}</td>
                      <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{c.regulatoryExposure.toFixed(1)}</td>
                      <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{c.spendMn.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              {typeBreakdown.map((t, i) => (
                <div key={t.type} style={{ flex: '1 1 180px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, marginBottom: 6 }}>{t.type}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.orange, fontFamily: T.fontMono }}>{t.avgPR.toFixed(1)}/10</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}>Avg physical risk · {t.count} cats</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Carbon: {t.avgCI.toFixed(0)} tCO₂e/$M</div>
                  <Bar pct={(t.avgPR / 10) * 100} color={[T.red, T.orange, T.amber, T.gold, T.green, T.teal, T.blue, T.indigo][i]} />
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Transition Risk Analysis — Regulatory & Carbon Price Exposure</div>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Category', 'Transition Risk', 'Regulatory Exposure', 'Carbon Intensity', 'Alt. Sources', 'Spend $M', 'Risk Level'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...CATEGORIES].sort((a, b) => b.transitionRisk - a.transitionRisk).slice(0, 25).map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.fontMono, fontWeight: 700, color: c.transitionRisk >= 7.5 ? T.red : c.transitionRisk >= 5 ? T.orange : T.green }}>{c.transitionRisk.toFixed(1)}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.fontMono }}>{c.regulatoryExposure.toFixed(1)}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.fontMono }}>{c.carbonIntensity.toFixed(0)} tCO₂e/$M</td>
                      <td style={{ padding: '8px 10px' }}><span style={{ color: c.alternativeAvailability >= 2 ? T.green : T.red, fontWeight: 700 }}>{['None', 'Limited', 'Some', 'Multiple'][c.alternativeAvailability]}</span></td>
                      <td style={{ padding: '8px 10px', fontFamily: T.fontMono }}>{c.spendMn.toFixed(1)}</td>
                      <td style={{ padding: '8px 10px' }}><RiskBadge score={c.transitionRisk} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Supplier Concentration Analysis — HHI Score</div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                  { label: 'High Concentration (HHI>0.4)', count: CATEGORIES.filter(c => c.concentrationHhi > 0.4).length, color: T.red },
                  { label: 'Moderate (0.25–0.4)', count: CATEGORIES.filter(c => c.concentrationHhi > 0.25 && c.concentrationHhi <= 0.4).length, color: T.amber },
                  { label: 'Competitive (0.1–0.25)', count: CATEGORIES.filter(c => c.concentrationHhi > 0.1 && c.concentrationHhi <= 0.25).length, color: T.green },
                ].map(item => (
                  <div key={item.label} style={{ flex: 1, background: T.sub, borderRadius: 8, padding: 16 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: item.color, fontFamily: T.fontMono }}>{item.count}</div>
                    <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{item.label}</div>
                  </div>
                ))}
              </div>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Category', 'HHI Score', 'Supplier Count', 'Region', 'Physical Risk', 'Spend $M', 'Concentration Level'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...CATEGORIES].sort((a, b) => b.concentrationHhi - a.concentrationHhi).slice(0, 25).map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.fontMono, fontWeight: 700, color: c.concentrationHhi > 0.4 ? T.red : c.concentrationHhi > 0.25 ? T.amber : T.green }}>{c.concentrationHhi.toFixed(3)}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.fontMono }}>{c.supplierCount}</td>
                      <td style={{ padding: '8px 10px', fontSize: 12 }}>{c.region}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.fontMono, color: T.red }}>{c.physicalRisk.toFixed(1)}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.fontMono }}>{c.spendMn.toFixed(1)}</td>
                      <td style={{ padding: '8px 10px' }}><span style={{ background: c.concentrationHhi > 0.4 ? `${T.red}20` : c.concentrationHhi > 0.25 ? `${T.amber}20` : `${T.green}20`, color: c.concentrationHhi > 0.4 ? T.red : c.concentrationHhi > 0.25 ? T.amber : T.green, padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{c.concentrationHhi > 0.4 ? 'High' : c.concentrationHhi > 0.25 ? 'Moderate' : 'Competitive'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 4 && selectedCat && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 24 }}>
            <button onClick={() => setSelectedCat(null)} style={{ marginBottom: 16, padding: '6px 14px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.sub, cursor: 'pointer', fontSize: 12 }}>← Back to list</button>
            <h3 style={{ color: T.navy, margin: '0 0 20px' }}>{selectedCat.name} — Deep Dive</h3>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Physical Risk', value: selectedCat.physicalRisk.toFixed(1), color: T.red },
                { label: 'Transition Risk', value: selectedCat.transitionRisk.toFixed(1), color: T.orange },
                { label: 'Climate Vulnerability', value: selectedCat.climateVulnerability.toFixed(1), color: T.amber },
                { label: 'Adaptation Capacity', value: selectedCat.adaptationCapacity.toFixed(1), color: T.green },
                { label: 'Regulatory Exposure', value: selectedCat.regulatoryExposure.toFixed(1), color: T.indigo },
                { label: 'HHI Concentration', value: selectedCat.concentrationHhi.toFixed(3), color: selectedCat.concentrationHhi > 0.4 ? T.red : T.amber },
                { label: 'Carbon Intensity', value: `${selectedCat.carbonIntensity.toFixed(0)} tCO₂e/$M`, color: T.teal },
                { label: 'Spend ($M)', value: `$${selectedCat.spendMn.toFixed(1)}M`, color: T.navy },
              ].map(m => (
                <div key={m.label} style={{ flex: '1 1 150px', background: T.sub, borderRadius: 8, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: m.color, fontFamily: T.fontMono }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 4 && !selectedCat && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Select a category from the Risk Dashboard tab to view deep-dive details</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {CATEGORIES.slice(0, 12).map(c => (
                <button key={c.id} onClick={() => setSelectedCat(c)} style={{ padding: '8px 14px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.sub, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>{c.name}</button>
              ))}
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Regional Climate Risk Heat Map — 8 Procurement Regions</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {regionalBreakdown.map((r, i) => {
                const riskColor = r.composite >= 7 ? T.red : r.composite >= 5 ? T.orange : r.composite >= 3.5 ? T.amber : T.green;
                return (
                  <div key={r.region} style={{ background: `${riskColor}15`, border: `2px solid ${riskColor}`, borderRadius: 8, padding: 16 }}>
                    <div style={{ fontWeight: 700, color: riskColor, marginBottom: 8 }}>{r.region}</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: riskColor, fontFamily: T.fontMono, marginBottom: 4 }}>{r.composite.toFixed(1)}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>Composite Risk</div>
                    <div style={{ margin: '8px 0', borderTop: `1px solid ${T.borderL}`, paddingTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span>Physical</span><span style={{ fontFamily: T.fontMono }}>{r.avgPR.toFixed(1)}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span>Transition</span><span style={{ fontFamily: T.fontMono }}>{r.avgTR.toFixed(1)}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span>Categories</span><span style={{ fontFamily: T.fontMono }}>{r.count}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span>Spend</span><span style={{ fontFamily: T.fontMono }}>${r.spend.toFixed(0)}M</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Climate Risk Mitigation Playbook</div>
            {mitigationActions.map((action, i) => (
              <div key={action.action} style={{ background: T.sub, borderRadius: 8, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, color: T.navy }}>{action.action}</span>
                  <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textSec }}>{action.timeline}</span>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div><span style={{ fontSize: 11, color: T.textSec }}>Impact: </span><span style={{ fontWeight: 700, color: action.impact === 'High' ? T.green : T.amber }}>{action.impact}</span></div>
                  <div><span style={{ fontSize: 11, color: T.textSec }}>Cost: </span><span style={{ fontWeight: 700 }}>{action.cost}</span></div>
                  <div><span style={{ fontSize: 11, color: T.textSec }}>Categories: </span><span style={{ fontFamily: T.fontMono, fontWeight: 700 }}>{action.categories}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 7 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Procurement Risk Scenarios — NGFS-Aligned</div>
            {[
              { name: 'Orderly Transition (1.5°C)', physAdj: -0.5, transAdj: +2.0, spendImpact: +8, desc: 'Carbon pricing drives transition costs; physical risk contained' },
              { name: 'Disorderly Transition (2°C)', physAdj: +1.0, transAdj: +3.5, spendImpact: +18, desc: 'Policy shock increases transition costs; moderate physical impacts' },
              { name: 'Hot House World (3.5°C+)', physAdj: +4.5, transAdj: -0.5, spendImpact: +35, desc: 'Severe physical disruptions dominate; supply chain breaks' },
              { name: 'Delayed Action (2.5°C)', physAdj: +2.0, transAdj: +2.0, spendImpact: +22, desc: 'Combined physical and transition stress; medium-term stranding' },
            ].map((sc, i) => (
              <div key={sc.name} style={{ background: T.sub, borderRadius: 8, padding: 16, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>{sc.name}</div>
                <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>{sc.desc}</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: T.textSec }}>Physical Risk Adj.</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: sc.physAdj > 0 ? T.red : T.green, fontFamily: T.fontMono }}>{sc.physAdj > 0 ? '+' : ''}{sc.physAdj}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: T.textSec }}>Transition Risk Adj.</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: sc.transAdj > 0 ? T.orange : T.green, fontFamily: T.fontMono }}>{sc.transAdj > 0 ? '+' : ''}{sc.transAdj}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: T.textSec }}>Spend Impact</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.amber, fontFamily: T.fontMono }}>+{sc.spendImpact}%</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: T.textSec }}>Adj. Total Spend</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>${((totalSpend * (1 + sc.spendImpact / 100)) / 1000).toFixed(1)}B</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
