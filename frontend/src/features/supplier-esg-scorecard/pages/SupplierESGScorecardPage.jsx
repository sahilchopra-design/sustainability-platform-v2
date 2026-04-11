import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SECTORS = ['Automotive', 'Electronics', 'Food & Bev', 'Apparel', 'Pharma', 'Chemicals', 'Logistics'];
const REGIONS = ['EU', 'APAC', 'Americas', 'Middle East', 'Africa', 'South Asia'];
const TIERS = ['Tier 1', 'Tier 2', 'Tier 3'];
const RED_FLAGS = ['No ESG Policy', 'Labour Violations', 'Deforestation Link', 'Greenwashing Risk', 'Conflict Minerals', 'Water Stress', 'Corruption Risk'];
const ENGAGEMENT_STAGES = ['Not Engaged', 'Initial Contact', 'Assessment Sent', 'Data Received', 'Improvement Plan', 'Verified'];

const SUPPLIERS = Array.from({ length: 90 }, (_, i) => ({
  id: i + 1,
  name: `Supplier ${String.fromCharCode(65 + (i % 26))}${i < 26 ? '' : String.fromCharCode(65 + Math.floor(i / 26) - 1)}`,
  sector: SECTORS[Math.floor(sr(i * 3 + 1) * SECTORS.length)],
  region: REGIONS[Math.floor(sr(i * 5 + 2) * REGIONS.length)],
  tier: TIERS[Math.floor(sr(i * 7 + 3) * TIERS.length)],
  eScore: parseFloat((sr(i * 11 + 4) * 60 + 20).toFixed(1)),
  sScore: parseFloat((sr(i * 13 + 5) * 60 + 20).toFixed(1)),
  gScore: parseFloat((sr(i * 17 + 6) * 60 + 20).toFixed(1)),
  carbonIntensity: parseFloat((sr(i * 19 + 7) * 200 + 10).toFixed(1)),
  waterUsage: parseFloat((sr(i * 23 + 8) * 50 + 5).toFixed(1)),
  spendMn: parseFloat((sr(i * 29 + 9) * 40 + 1).toFixed(1)),
  redFlags: Array.from({ length: Math.floor(sr(i * 31 + 10) * 4) }, (_, j) => RED_FLAGS[Math.floor(sr(i * 37 + j) * RED_FLAGS.length)]).filter((v, j, a) => a.indexOf(v) === j),
  engagementStage: ENGAGEMENT_STAGES[Math.floor(sr(i * 41 + 11) * ENGAGEMENT_STAGES.length)],
  lastAudit: `${2023 + Math.floor(sr(i * 43 + 12) * 2)}-${String(Math.floor(sr(i * 47 + 13) * 12) + 1).padStart(2, '0')}`,
  sbtiCommitted: sr(i * 53 + 14) > 0.55,
  reductionTarget2030: Math.round(sr(i * 59 + 15) * 50 + 10),
}));

const TABS = ['ESG Overview', 'Environmental', 'Social', 'Governance', 'Red Flag Monitor', 'Engagement Tracker', 'Sector Benchmarks', 'Action Plans'];

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

const ScorePill = ({ score, max = 100 }) => {
  const pct = (score / max) * 100;
  const color = pct >= 70 ? T.green : pct >= 50 ? T.amber : T.red;
  return <span style={{ background: `${color}20`, color, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontFamily: T.fontMono, fontWeight: 700 }}>{score.toFixed(0)}</span>;
};

export default function SupplierESGScorecardPage() {
  const [tab, setTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [sortBy, setSortBy] = useState('esgTotal');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const suppliersWithTotal = useMemo(() => SUPPLIERS.map(s => ({
    ...s,
    esgTotal: (s.eScore + s.sScore + s.gScore) / 3,
    redFlagCount: s.redFlags.length,
  })), []);

  const filtered = useMemo(() => {
    let d = suppliersWithTotal;
    if (sectorFilter !== 'All') d = d.filter(s => s.sector === sectorFilter);
    if (tierFilter !== 'All') d = d.filter(s => s.tier === tierFilter);
    if (regionFilter !== 'All') d = d.filter(s => s.region === regionFilter);
    return [...d].sort((a, b) => sortAsc ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy]);
  }, [sectorFilter, tierFilter, regionFilter, sortBy, sortAsc, suppliersWithTotal]);

  const avgESG = useMemo(() => suppliersWithTotal.reduce((a, s) => a + s.esgTotal, 0) / Math.max(1, suppliersWithTotal.length), [suppliersWithTotal]);
  const avgE = useMemo(() => SUPPLIERS.reduce((a, s) => a + s.eScore, 0) / Math.max(1, SUPPLIERS.length), []);
  const avgS = useMemo(() => SUPPLIERS.reduce((a, s) => a + s.sScore, 0) / Math.max(1, SUPPLIERS.length), []);
  const avgG = useMemo(() => SUPPLIERS.reduce((a, s) => a + s.gScore, 0) / Math.max(1, SUPPLIERS.length), []);
  const redFlagTotal = useMemo(() => suppliersWithTotal.reduce((a, s) => a + s.redFlagCount, 0), [suppliersWithTotal]);
  const highRiskCount = useMemo(() => suppliersWithTotal.filter(s => s.esgTotal < 40).length, [suppliersWithTotal]);

  const sectorBenchmarks = useMemo(() => SECTORS.map(sec => {
    const sups = suppliersWithTotal.filter(s => s.sector === sec);
    return {
      sector: sec,
      count: sups.length,
      avgESG: sups.length ? sups.reduce((a, s) => a + s.esgTotal, 0) / sups.length : 0,
      avgE: sups.length ? sups.reduce((a, s) => a + s.eScore, 0) / sups.length : 0,
      avgS: sups.length ? sups.reduce((a, s) => a + s.sScore, 0) / sups.length : 0,
      avgG: sups.length ? sups.reduce((a, s) => a + s.gScore, 0) / sups.length : 0,
      redFlagSups: sups.filter(s => s.redFlagCount > 0).length,
    };
  }), [suppliersWithTotal]);

  const flagBreakdown = useMemo(() => RED_FLAGS.map(flag => {
    const count = suppliersWithTotal.filter(s => s.redFlags.includes(flag)).length;
    const spend = suppliersWithTotal.filter(s => s.redFlags.includes(flag)).reduce((a, s) => a + s.spendMn, 0);
    return { flag, count, spend };
  }).sort((a, b) => b.count - a.count), [suppliersWithTotal]);

  const engagementSummary = useMemo(() => ENGAGEMENT_STAGES.map(stage => {
    const sups = suppliersWithTotal.filter(s => s.engagementStage === stage);
    return { stage, count: sups.length, pct: (sups.length / Math.max(1, suppliersWithTotal.length)) * 100 };
  }), [suppliersWithTotal]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, borderBottom: `3px solid ${T.gold}`, padding: '20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ background: T.gold, color: T.navy, fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 3 }}>EP-DN3</span>
          <span style={{ color: T.gold, fontFamily: T.fontMono, fontSize: 11 }}>SUPPLY CHAIN CLIMATE INTELLIGENCE</span>
        </div>
        <h1 style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, margin: 0 }}>Supplier ESG Scorecard</h1>
        <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>90 suppliers · 7 sectors · E/S/G scoring · Red flag detection · Engagement tracker · Sector benchmarks · CDP-aligned</p>
      </div>

      <div style={{ display: 'flex', gap: 12, padding: '16px 32px', background: T.cream, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
        <KpiCard label="Avg ESG Score" value={`${avgESG.toFixed(1)}/100`} sub="Portfolio weighted average" color={avgESG >= 70 ? T.green : avgESG >= 50 ? T.amber : T.red} />
        <KpiCard label="Avg E Score" value={`${avgE.toFixed(1)}`} sub="Environmental pillar" color={T.green} />
        <KpiCard label="Avg S Score" value={`${avgS.toFixed(1)}`} sub="Social pillar" color={T.blue} />
        <KpiCard label="Avg G Score" value={`${avgG.toFixed(1)}`} sub="Governance pillar" color={T.indigo} />
        <KpiCard label="Total Red Flags" value={redFlagTotal} sub={`Across ${suppliersWithTotal.filter(s => s.redFlagCount > 0).length} suppliers`} color={T.red} />
        <KpiCard label="High Risk Suppliers" value={highRiskCount} sub="ESG score below 40" color={T.orange} />
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
              {['All', ...SECTORS].map(s => <button key={s} onClick={() => setSectorFilter(s)} style={{ padding: '6px 14px', border: `1px solid ${sectorFilter === s ? T.navy : T.border}`, borderRadius: 20, background: sectorFilter === s ? T.navy : T.card, color: sectorFilter === s ? '#fff' : T.textPri, cursor: 'pointer', fontSize: 12 }}>{s}</button>)}
              {['All', ...TIERS].map(t => <button key={t} onClick={() => setTierFilter(t)} style={{ padding: '6px 14px', border: `1px solid ${tierFilter === t ? T.indigo : T.border}`, borderRadius: 20, background: tierFilter === t ? T.indigo : T.card, color: tierFilter === t ? '#fff' : T.textPri, cursor: 'pointer', fontSize: 12 }}>{t}</button>)}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, color: T.navy }}>Supplier ESG Scorecards — {filtered.length} suppliers</div>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
                  <option value="esgTotal">Sort: ESG Total</option>
                  <option value="eScore">Sort: E Score</option>
                  <option value="sScore">Sort: S Score</option>
                  <option value="gScore">Sort: G Score</option>
                  <option value="redFlagCount">Sort: Red Flags</option>
                  <option value="spendMn">Sort: Spend</option>
                </select>
              </div>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Supplier', 'Sector', 'Tier', 'E Score', 'S Score', 'G Score', 'ESG Total', 'Red Flags', 'Spend $M', 'Engagement'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 30).map((s, i) => (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? T.card : T.sub, cursor: 'pointer' }} onClick={() => setSelectedSupplier(s)}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: '8px 10px', fontSize: 11, color: T.textSec }}>{s.sector}</td>
                      <td style={{ padding: '8px 10px' }}><span style={{ background: T.surfaceH, padding: '1px 7px', borderRadius: 10, fontSize: 11 }}>{s.tier}</span></td>
                      <td style={{ padding: '8px 10px' }}><ScorePill score={s.eScore} /></td>
                      <td style={{ padding: '8px 10px' }}><ScorePill score={s.sScore} /></td>
                      <td style={{ padding: '8px 10px' }}><ScorePill score={s.gScore} /></td>
                      <td style={{ padding: '8px 10px' }}><ScorePill score={s.esgTotal} /></td>
                      <td style={{ padding: '8px 10px' }}>{s.redFlagCount > 0 ? <span style={{ background: `${T.red}20`, color: T.red, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{s.redFlagCount} flags</span> : <span style={{ color: T.green }}>—</span>}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.fontMono, fontSize: 12 }}>{s.spendMn.toFixed(1)}</td>
                      <td style={{ padding: '8px 10px', fontSize: 11 }}><span style={{ background: s.engagementStage === 'Verified' ? `${T.green}20` : s.engagementStage === 'Not Engaged' ? `${T.red}20` : `${T.amber}20`, color: s.engagementStage === 'Verified' ? T.green : s.engagementStage === 'Not Engaged' ? T.red : T.amber, padding: '2px 6px', borderRadius: 10 }}>{s.engagementStage}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Environmental Score Distribution</div>
              {[['90–100', 90, 100, T.green], ['70–89', 70, 89, T.teal], ['50–69', 50, 69, T.amber], ['30–49', 30, 49, T.orange], ['0–29', 0, 29, T.red]].map(([label, lo, hi, color]) => {
                const cnt = SUPPLIERS.filter(s => s.eScore >= lo && s.eScore <= hi).length;
                return (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color }}>{label}</span>
                      <span style={{ fontFamily: T.fontMono, fontSize: 12 }}>{cnt} suppliers · {((cnt / Math.max(1, SUPPLIERS.length)) * 100).toFixed(0)}%</span>
                    </div>
                    <Bar pct={(cnt / Math.max(1, SUPPLIERS.length)) * 100} color={color} />
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Environmental Metrics by Sector</div>
              {sectorBenchmarks.map((sec, i) => (
                <div key={sec.sector} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{sec.sector}</span>
                    <span style={{ fontFamily: T.fontMono, fontSize: 12 }}>E: {sec.avgE.toFixed(1)} · {sec.count} suppliers</span>
                  </div>
                  <Bar pct={sec.avgE} color={[T.green, T.teal, T.blue, T.indigo, T.purple, T.orange, T.red][i]} />
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Social Score Analysis — Labour, Human Rights, Community</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Labour Violation Risk', count: SUPPLIERS.filter(s => s.redFlags.includes('Labour Violations')).length },
                { label: 'Conflict Minerals Exposure', count: SUPPLIERS.filter(s => s.redFlags.includes('Conflict Minerals')).length },
                { label: 'Social Score ≥ 70', count: SUPPLIERS.filter(s => s.sScore >= 70).length },
                { label: 'Social Score < 40', count: SUPPLIERS.filter(s => s.sScore < 40).length },
              ].map(m => (
                <div key={m.label} style={{ flex: 1, background: T.sub, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: T.blue, fontFamily: T.fontMono }}>{m.count}</div>
                  <div style={{ fontSize: 12, color: T.textSec }}>{m.label}</div>
                </div>
              ))}
            </div>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Supplier', 'Sector', 'S Score', 'Labour Flags', 'Engagement Stage', 'Last Audit', 'Spend $M'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...SUPPLIERS].sort((a, b) => a.sScore - b.sScore).slice(0, 25).map((s, i) => (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: '8px 10px', fontSize: 11, color: T.textSec }}>{s.sector}</td>
                    <td style={{ padding: '8px 10px' }}><ScorePill score={s.sScore} /></td>
                    <td style={{ padding: '8px 10px' }}>{s.redFlags.filter(f => ['Labour Violations', 'Conflict Minerals', 'Corruption Risk'].includes(f)).length > 0 ? <span style={{ color: T.red, fontWeight: 700 }}>{s.redFlags.filter(f => ['Labour Violations', 'Conflict Minerals', 'Corruption Risk'].includes(f)).join(', ')}</span> : <span style={{ color: T.green }}>Clean</span>}</td>
                    <td style={{ padding: '8px 10px', fontSize: 11 }}>{s.engagementStage}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.fontMono, fontSize: 11 }}>{s.lastAudit}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.fontMono, fontSize: 12 }}>{s.spendMn.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Governance Score — Board, Ethics, Transparency</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              {[
                { label: 'G Score ≥ 70', count: SUPPLIERS.filter(s => s.gScore >= 70).length, color: T.green },
                { label: 'G Score 50–69', count: SUPPLIERS.filter(s => s.gScore >= 50 && s.gScore < 70).length, color: T.amber },
                { label: 'G Score < 50', count: SUPPLIERS.filter(s => s.gScore < 50).length, color: T.red },
                { label: 'Corruption Risk Flag', count: SUPPLIERS.filter(s => s.redFlags.includes('Corruption Risk')).length, color: T.orange },
              ].map(m => (
                <div key={m.label} style={{ flex: 1, background: T.sub, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: m.color, fontFamily: T.fontMono }}>{m.count}</div>
                  <div style={{ fontSize: 12, color: T.textSec }}>{m.label}</div>
                </div>
              ))}
            </div>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Supplier', 'Sector', 'G Score', 'Greenwash Risk', 'No ESG Policy', 'Spend $M', 'Tier'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...SUPPLIERS].sort((a, b) => a.gScore - b.gScore).slice(0, 25).map((s, i) => (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: '8px 10px', fontSize: 11, color: T.textSec }}>{s.sector}</td>
                    <td style={{ padding: '8px 10px' }}><ScorePill score={s.gScore} /></td>
                    <td style={{ padding: '8px 10px' }}><span style={{ color: s.redFlags.includes('Greenwashing Risk') ? T.red : T.green, fontWeight: 700 }}>{s.redFlags.includes('Greenwashing Risk') ? 'Yes' : 'No'}</span></td>
                    <td style={{ padding: '8px 10px' }}><span style={{ color: s.redFlags.includes('No ESG Policy') ? T.red : T.green, fontWeight: 700 }}>{s.redFlags.includes('No ESG Policy') ? 'Yes' : 'No'}</span></td>
                    <td style={{ padding: '8px 10px', fontFamily: T.fontMono, fontSize: 12 }}>{s.spendMn.toFixed(1)}</td>
                    <td style={{ padding: '8px 10px', fontSize: 11 }}>{s.tier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 4 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Red Flag Summary — {redFlagTotal} total flags across supply base</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {flagBreakdown.map((f, i) => (
                  <div key={f.flag} style={{ background: f.count > 10 ? `${T.red}10` : T.sub, border: `1px solid ${f.count > 10 ? T.red : T.border}`, borderRadius: 8, padding: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{f.flag}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: f.count > 10 ? T.red : T.amber, fontFamily: T.fontMono }}>{f.count}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>suppliers · ${f.spend.toFixed(0)}M spend at risk</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Suppliers with Red Flags — Action Required</div>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Supplier', 'Sector', 'ESG Score', 'Red Flags', 'Spend $M', 'Engagement', 'Priority'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {suppliersWithTotal.filter(s => s.redFlagCount > 0).sort((a, b) => b.redFlagCount - a.redFlagCount).slice(0, 20).map((s, i) => (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: '8px 10px', fontSize: 11, color: T.textSec }}>{s.sector}</td>
                      <td style={{ padding: '8px 10px' }}><ScorePill score={s.esgTotal} /></td>
                      <td style={{ padding: '8px 10px', fontSize: 11 }}>{s.redFlags.join(' · ')}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.fontMono, fontSize: 12 }}>{s.spendMn.toFixed(1)}</td>
                      <td style={{ padding: '8px 10px', fontSize: 11 }}>{s.engagementStage}</td>
                      <td style={{ padding: '8px 10px' }}><span style={{ background: s.redFlagCount >= 3 ? `${T.red}20` : `${T.amber}20`, color: s.redFlagCount >= 3 ? T.red : T.amber, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{s.redFlagCount >= 3 ? 'Critical' : 'Review'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: T.navy }}>Engagement Pipeline Tracker</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {engagementSummary.map((stage, i) => (
                <div key={stage.stage} style={{ flex: 1, background: stage.stage === 'Verified' ? `${T.green}10` : T.sub, border: `1px solid ${stage.stage === 'Verified' ? T.green : T.border}`, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: [T.red, T.orange, T.amber, T.gold, T.teal, T.green][i], fontFamily: T.fontMono }}>{stage.count}</div>
                  <div style={{ fontSize: 10, color: T.textSec, marginTop: 4 }}>{stage.stage}</div>
                  <div style={{ fontSize: 10, color: T.textSec }}>{stage.pct.toFixed(0)}%</div>
                </div>
              ))}
            </div>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Supplier', 'Sector', 'Engagement Stage', 'ESG Score', 'SBTi', 'Red Flags', 'Spend $M', 'Last Audit'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {suppliersWithTotal.filter(s => s.engagementStage !== 'Verified').slice(0, 25).map((s, i) => (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: '8px 10px', fontSize: 11, color: T.textSec }}>{s.sector}</td>
                    <td style={{ padding: '8px 10px', fontSize: 11 }}><span style={{ background: s.engagementStage === 'Not Engaged' ? `${T.red}20` : `${T.amber}20`, color: s.engagementStage === 'Not Engaged' ? T.red : T.amber, padding: '2px 6px', borderRadius: 10 }}>{s.engagementStage}</span></td>
                    <td style={{ padding: '8px 10px' }}><ScorePill score={s.esgTotal} /></td>
                    <td style={{ padding: '8px 10px' }}><span style={{ color: s.sbtiCommitted ? T.green : T.red, fontWeight: 700 }}>{s.sbtiCommitted ? '✓' : '✗'}</span></td>
                    <td style={{ padding: '8px 10px', fontFamily: T.fontMono, fontSize: 11, color: T.red }}>{s.redFlagCount || '—'}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.fontMono, fontSize: 12 }}>{s.spendMn.toFixed(1)}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.fontMono, fontSize: 11 }}>{s.lastAudit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Sector ESG Benchmarks</div>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Sector', 'Suppliers', 'Avg ESG', 'Avg E', 'Avg S', 'Avg G', 'Red Flag Sups', 'ESG Rating'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...sectorBenchmarks].sort((a, b) => b.avgESG - a.avgESG).map((sec, i) => (
                  <tr key={sec.sector} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{sec.sector}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{sec.count}</td>
                    <td style={{ padding: '8px 12px' }}><ScorePill score={sec.avgESG} /></td>
                    <td style={{ padding: '8px 12px' }}><ScorePill score={sec.avgE} /></td>
                    <td style={{ padding: '8px 12px' }}><ScorePill score={sec.avgS} /></td>
                    <td style={{ padding: '8px 12px' }}><ScorePill score={sec.avgG} /></td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.red }}>{sec.redFlagSups}</td>
                    <td style={{ padding: '8px 12px' }}><span style={{ background: sec.avgESG >= 70 ? `${T.green}20` : sec.avgESG >= 50 ? `${T.amber}20` : `${T.red}20`, color: sec.avgESG >= 70 ? T.green : sec.avgESG >= 50 ? T.amber : T.red, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{sec.avgESG >= 70 ? 'Leader' : sec.avgESG >= 50 ? 'Average' : 'Laggard'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 7 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>ESG Improvement Action Plans</div>
            {[
              { title: 'Priority 1: Critical Red Flag Remediation', suppliers: suppliersWithTotal.filter(s => s.redFlagCount >= 3).length, actions: ['Issue corrective action requests within 30 days', 'On-site audit within 60 days', 'Escalate to C-suite if unresolved by 90 days'], color: T.red },
              { title: 'Priority 2: No ESG Policy — Policy Development', suppliers: suppliersWithTotal.filter(s => s.redFlags.includes('No ESG Policy')).length, actions: ['Share ESG policy template', 'Assign dedicated sustainability contact', 'Set 6-month adoption deadline'], color: T.orange },
              { title: 'Priority 3: SBTi Commitment Drive', suppliers: suppliersWithTotal.filter(s => !s.sbtiCommitted).length, actions: ['Host SBTi webinar for uncommitted suppliers', 'Provide target-setting support resources', 'Link SBTi commitment to supplier scorecard bonuses'], color: T.amber },
              { title: 'Priority 4: Data Quality Improvement', suppliers: Math.round(SUPPLIERS.length * 0.4), actions: ['Deploy CDP supply chain questionnaire', 'Offer data collection training', 'Set minimum data quality score of 3/5 by year-end'], color: T.teal },
            ].map(plan => (
              <div key={plan.title} style={{ background: T.sub, borderRadius: 8, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, color: plan.color }}>{plan.title}</span>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.textSec }}>{plan.suppliers} suppliers</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {plan.actions.map(a => <li key={a} style={{ fontSize: 13, color: T.textSec, marginBottom: 4 }}>{a}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
