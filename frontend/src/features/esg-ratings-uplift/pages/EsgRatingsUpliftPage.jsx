import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const T = { bg:'#0f1117', surface:'#1a1d27', surfaceH:'#22263a', border:'#2a2f45', borderL:'#1e2235', navy:'#1e3a5f', gold:'#d4a843', sage:'#2d6a4f', teal:'#0d4f5c', text:'#e8e0d0', textSec:'#a89880', textMut:'#6b6050', red:'#c0392b', green:'#27ae60', amber:'#e67e22', font:"'DM Sans',sans-serif", mono:"'JetBrains Mono',monospace" };

const CURRENT_RATINGS = [
  { rater: 'MSCI ESG', current: 'BB', target: 'A', scale: 'CCC-AAA', peer_avg: 'BBB', gap: 2 },
  { rater: 'Sustainalytics', current: '32 (High)', target: '18 (Low)', scale: '0-100 residual', peer_avg: '24', gap: 14 },
  { rater: 'CDP Climate', current: 'Not disclosed', target: 'B', scale: 'D-A', peer_avg: 'B-', gap: 3 },
  { rater: 'CDP Water', current: 'Not disclosed', target: 'B-', scale: 'D-A', peer_avg: 'C', gap: 2 },
  { rater: 'S&P Global CSA', current: 'Not rated', target: '60+', scale: '0-100', peer_avg: '45', gap: 60 },
  { rater: 'ISS QualityScore', current: '7 E / 8 S / 4 G', target: '3 E / 3 S / 2 G', scale: '1-10 decile', peer_avg: '5', gap: 4 },
];

const MSCI_SUBISSUES = [
  { sub: 'Carbon Emissions', weight: 15, current: 3.8, target: 7.2, gap: 3.4, lever: 'LCA-verified intensity · CDP Climate B' },
  { sub: 'Clean Tech Opportunities', weight: 12, current: 5.1, target: 8.5, gap: 3.4, lever: 'RE-IPP structural advantage (disclose)' },
  { sub: 'Product Carbon Footprint', weight: 10, current: 2.9, target: 6.8, gap: 3.9, lever: 'EPD for manufactured modules' },
  { sub: 'Water Stress', weight: 9, current: 4.2, target: 6.5, gap: 2.3, lever: 'CDP Water · BRSR Core water KPI' },
  { sub: 'Land Use & Biodiversity', weight: 8, current: 3.1, target: 6.2, gap: 3.1, lever: 'TNFD LEAP baseline' },
  { sub: 'Climate Change Vulnerability', weight: 10, current: 3.5, target: 7.0, gap: 3.5, lever: 'TCFD SSP scenario analysis' },
  { sub: 'Labor Management', weight: 8, current: 4.8, target: 5.5, gap: 0.7, lever: 'BRSR Core labour indicators' },
  { sub: 'Supply Chain Labor Standards', weight: 7, current: 3.2, target: 5.8, gap: 2.6, lever: 'Manufacturing supply chain audit' },
  { sub: 'Health & Safety', weight: 6, current: 5.2, target: 6.0, gap: 0.8, lever: 'LTIFR disclosure + policy' },
  { sub: 'Corporate Governance', weight: 8, current: 4.4, target: 6.2, gap: 1.8, lever: 'Board climate oversight · ISSB alignment' },
  { sub: 'Business Ethics', weight: 7, current: 4.8, target: 5.5, gap: 0.7, lever: 'Anti-corruption · whistleblower disclosure' },
];

const SUSTAINALYTICS_CAT = [
  { cat: 'Carbon - Own Operations', score: 6.2, mgmt: 'Weak', residual: 4.8 },
  { cat: 'Carbon - Products & Services', score: 4.8, mgmt: 'Weak', residual: 3.9 },
  { cat: 'E&S Impact of Products', score: 5.5, mgmt: 'Average', residual: 3.2 },
  { cat: 'Land Use & Biodiversity', score: 4.8, mgmt: 'Weak', residual: 4.2 },
  { cat: 'Resource Use', score: 5.1, mgmt: 'Average', residual: 3.1 },
  { cat: 'Human Capital', score: 4.2, mgmt: 'Average', residual: 2.8 },
  { cat: 'Community Relations', score: 3.8, mgmt: 'Average', residual: 2.1 },
  { cat: 'Bribery & Corruption', score: 2.9, mgmt: 'Strong', residual: 0.9 },
];

const REMEDIATION_MAP = [
  { gap: 'Verified carbon intensity', remediation: 'LCA (EB1)', impact: 'MSCI Carbon Emissions + Sustainalytics Carbon', delta: '+0.8 rating tiers' },
  { gap: 'Physical climate risk mgmt', remediation: 'TCFD assessment (EB5)', impact: 'MSCI Climate Vulnerability + Sustainalytics E&S Impact', delta: '+0.6 rating tiers' },
  { gap: 'Nature / biodiversity', remediation: 'TNFD baseline (EB6)', impact: 'MSCI Land Use + Sustainalytics Biodiversity', delta: '+0.4 rating tiers' },
  { gap: 'Supply chain labour', remediation: 'Mfg supply chain audit', impact: 'MSCI SC Labor', delta: '+0.2 rating tiers' },
  { gap: 'CDP non-participation', remediation: 'CDP Climate/Water/Forests submission', impact: 'Feeds both Sustainalytics + MSCI', delta: '+0.3 rating tiers (compound)' },
  { gap: 'Governance depth', remediation: 'ISSB-aligned climate oversight', impact: 'MSCI Governance + CDP Climate', delta: '+0.2 rating tiers' },
];

const PASSIVE_INFLOWS = [
  { idx: 'MSCI ACWI ESG Leaders', threshold: 'BBB+', aum: 120, eligibility: 'Partial', inflow: 'Conditional' },
  { idx: 'MSCI ESG Screened', threshold: 'B+', aum: 85, eligibility: 'Eligible', inflow: 'Pending rating' },
  { idx: 'S&P Global Clean Energy', threshold: 'N/A (sector)', aum: 45, eligibility: 'Eligible', inflow: 'Active' },
  { idx: 'FTSE4Good', threshold: '3.1/5', aum: 32, eligibility: 'Partial', inflow: 'Conditional' },
  { idx: 'Nifty SDG 100 ESG', threshold: 'BBB', aum: 6.2, eligibility: 'Domestic', inflow: 'Pending' },
  { idx: 'Dow Jones Sustainability', threshold: 'Top decile', aum: 28, eligibility: 'Excluded', inflow: 'CSA req' },
];

const TABS = ['Overview', 'Current Ratings Gap', 'MSCI Sub-Issue Decomposition', 'Sustainalytics Residual Risk', 'Remediation Map', 'Passive Inflow Threshold', 'Engagement Playbook'];

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.gold, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function EsgRatingsUpliftPage() {
  const [tab, setTab] = useState(0);

  const totalMsciGap = MSCI_SUBISSUES.reduce((a, b) => a + b.gap * b.weight, 0) / MSCI_SUBISSUES.reduce((a, b) => a + b.weight, 0);
  const totalResidual = SUSTAINALYTICS_CAT.reduce((a, b) => a + b.residual, 0).toFixed(1);

  const radarData = MSCI_SUBISSUES.slice(0, 8).map(s => ({ sub: s.sub.slice(0, 18), current: s.current, target: s.target, full: 10 }));

  const sty = {
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '8px 10px', fontSize: 10, fontFamily: T.mono, color: T.gold, borderBottom: `1px solid ${T.border}` },
    td: { padding: '8px 10px', fontSize: 11, color: T.text, borderBottom: `1px solid ${T.borderL}` },
    panel: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 },
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: 24 }}>
      <div style={{ borderBottom: `2px solid ${T.gold}`, paddingBottom: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 2 }}>EP-EB4 · IMPACT ADVISORY — BALANCE-SHEET VALUE FROM SUSTAINABILITY</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '4px 0', color: T.text }}>ESG Ratings Uplift Programme — MSCI · Sustainalytics · CDP · S&P CSA · ISS</h1>
        <div style={{ fontSize: 12, color: T.textSec }}>Newly-listed RE-IPP ratings gap closure · sub-issue decomposition · rater engagement · passive inflow unlock · 7 Tabs</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Kpi label="CURRENT MSCI" value="BB" sub="proxy-driven · disclosure gap" color={T.red} />
        <Kpi label="TARGET MSCI" value="A" sub="24-month trajectory" color={T.green} />
        <Kpi label="WEIGHTED GAP" value={totalMsciGap.toFixed(2)} sub="vs target · 11 sub-issues" />
        <Kpi label="UNLOCK THRESHOLD" value="BBB+" sub="MSCI ACWI ESG Leaders" color={T.gold} />
        <Kpi label="PASSIVE AUM" value="$120Bn" sub="accessible post-uplift" color={T.gold} />
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <div key={i} onClick={() => setTab(i)} style={{ padding: '10px 16px', fontSize: 11, fontFamily: T.mono, cursor: 'pointer', borderBottom: tab === i ? `2px solid ${T.gold}` : 'none', color: tab === i ? T.gold : T.textSec }}>{t}</div>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={sty.panel}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 8 }}>Newly-Listed Proxy Discount</div>
            <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>Recently-listed Indian companies default to a <b>data availability discount</b> from MSCI/Sustainalytics — industry-average proxies substitute for company-specific data. For an RE-IPP, this proxy understates actual environmental performance.</p>
          </div>
          <div style={sty.panel}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 8 }}>Not a Performance Problem</div>
            <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>Structural exposure profile of a pure-play RE-IPP is advantageous. Management score is the gap — <b>policies absent from disclosure, data unverified, impact categories without baseline</b>. Uplift = systematic disclosure enhancement, not performance improvement.</p>
          </div>
          <div style={{ ...sty.panel, gridColumn: '1 / span 2' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 10 }}>MSCI Sub-Issue — Current vs Target (radar)</div>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}><PolarGrid stroke={T.border} /><PolarAngleAxis dataKey="sub" tick={{ fontSize: 9, fill: T.textSec }} /><PolarRadiusAxis tick={{ fontSize: 9, fill: T.textSec }} angle={90} domain={[0, 10]} /><Radar name="Current" dataKey="current" stroke="#c0392b" fill="#c0392b" fillOpacity={0.3} /><Radar name="Target" dataKey="target" stroke={T.green} fill={T.green} fillOpacity={0.3} /><Legend /></RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Current ratings gap across 6 major raters/disclosures.</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Rater</th><th style={sty.th}>Current</th><th style={sty.th}>Target</th><th style={sty.th}>Scale</th><th style={sty.th}>Peer Avg</th><th style={sty.th}>Gap</th></tr></thead>
            <tbody>{CURRENT_RATINGS.map((r, i) => <tr key={i}><td style={{ ...sty.td, color: T.gold }}>{r.rater}</td><td style={{ ...sty.td, color: T.red, fontWeight: 700 }}>{r.current}</td><td style={{ ...sty.td, color: T.green, fontWeight: 700 }}>{r.target}</td><td style={sty.td}>{r.scale}</td><td style={sty.td}>{r.peer_avg}</td><td style={{ ...sty.td, fontFamily: T.mono }}>{r.gap}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>MSCI 11 sub-issue decomposition. Weighted gap = Σ(gap × weight) / Σweight.</div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={MSCI_SUBISSUES} layout="vertical"><CartesianGrid stroke={T.border} strokeDasharray="3 3" /><XAxis type="number" stroke={T.textSec} tick={{ fontSize: 11 }} domain={[0, 10]} /><YAxis type="category" dataKey="sub" stroke={T.textSec} tick={{ fontSize: 10 }} width={170} /><Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}` }} /><Legend /><Bar dataKey="current" fill="#c0392b" name="Current" /><Bar dataKey="target" fill="#27ae60" name="Target" /></BarChart>
          </ResponsiveContainer>
          <table style={{ ...sty.table, marginTop: 14 }}>
            <thead><tr><th style={sty.th}>Sub-issue</th><th style={sty.th}>Weight</th><th style={sty.th}>Gap</th><th style={sty.th}>Lever</th></tr></thead>
            <tbody>{MSCI_SUBISSUES.map((r, i) => <tr key={i}><td style={sty.td}>{r.sub}</td><td style={{ ...sty.td, fontFamily: T.mono }}>{r.weight}%</td><td style={{ ...sty.td, color: r.gap > 3 ? T.red : r.gap > 2 ? T.gold : T.green, fontFamily: T.mono }}>+{r.gap.toFixed(1)}</td><td style={{ ...sty.td, fontSize: 10 }}>{r.lever}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Sustainalytics residual unmanaged risk — score after management programmes accounted for. Lower is better.</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <Kpi label="TOTAL RESIDUAL" value={totalResidual} sub="High band 30-40" color={T.red} />
            <Kpi label="TARGET" value="< 20" sub="Low risk band" color={T.green} />
            <Kpi label="Mgmt WEAK" value="4 / 8" sub="lift via disclosure" color={T.red} />
          </div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Category</th><th style={sty.th}>Risk exposure</th><th style={sty.th}>Mgmt</th><th style={sty.th}>Residual</th></tr></thead>
            <tbody>{SUSTAINALYTICS_CAT.map((r, i) => <tr key={i}><td style={sty.td}>{r.cat}</td><td style={{ ...sty.td, fontFamily: T.mono }}>{r.score}</td><td style={{ ...sty.td, color: r.mgmt === 'Strong' ? T.green : r.mgmt === 'Average' ? T.gold : T.red }}>{r.mgmt}</td><td style={{ ...sty.td, color: r.residual > 4 ? T.red : r.residual > 2 ? T.gold : T.green, fontFamily: T.mono, fontWeight: 700 }}>{r.residual}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Remediation map — each gap maps to a specific Impact Advisory workstream. Compounding effects across raters.</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Gap</th><th style={sty.th}>Remediation</th><th style={sty.th}>Impact on ratings</th><th style={sty.th}>Delta</th></tr></thead>
            <tbody>{REMEDIATION_MAP.map((r, i) => <tr key={i}><td style={{ ...sty.td, color: T.amber }}>{r.gap}</td><td style={{ ...sty.td, color: T.gold }}>{r.remediation}</td><td style={{ ...sty.td, fontSize: 10 }}>{r.impact}</td><td style={{ ...sty.td, color: T.green, fontFamily: T.mono }}>{r.delta}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Passive inflow thresholds — index inclusion unlocks ESG-screened institutional capital.</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Index</th><th style={sty.th}>Threshold</th><th style={sty.th}>Linked AUM ($Bn)</th><th style={sty.th}>Eligibility</th><th style={sty.th}>Inflow Status</th></tr></thead>
            <tbody>{PASSIVE_INFLOWS.map((r, i) => <tr key={i}><td style={{ ...sty.td, color: T.gold }}>{r.idx}</td><td style={{ ...sty.td, fontFamily: T.mono }}>{r.threshold}</td><td style={{ ...sty.td, fontFamily: T.mono }}>${r.aum}</td><td style={{ ...sty.td, color: r.eligibility === 'Eligible' || r.eligibility === 'Active' ? T.green : r.eligibility === 'Excluded' ? T.red : T.gold }}>{r.eligibility}</td><td style={{ ...sty.td, color: r.inflow === 'Active' ? T.green : r.inflow.includes('Conditional') ? T.gold : T.textSec }}>{r.inflow}</td></tr>)}</tbody>
          </table>
          <div style={{ ...sty.panel, marginTop: 14 }}>
            <div style={{ fontSize: 12, color: T.gold, fontWeight: 700, marginBottom: 6 }}>Aggregate accessible AUM</div>
            <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>Post-uplift to MSCI A / Sustainalytics Low: ~$180 Bn global passive pools become actively or conditionally eligible. FII inflow elasticity from EU/AU/SG institutional mandates strongest post-rating.</div>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Rater engagement playbook — 18-24 month structured programme.</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Phase</th><th style={sty.th}>Action</th><th style={sty.th}>Raters</th><th style={sty.th}>Month</th></tr></thead>
            <tbody>{[
              ['Baseline', 'Gap analysis · methodology reverse-engineering · peer benchmark', 'MSCI · Sustainalytics', 'M1-3'],
              ['Disclosure build', 'Policies · KPI verification · CDP submission prep', 'CDP · MSCI', 'M3-6'],
              ['CDP filing', 'Climate + Water + Forests questionnaires', 'CDP', 'M6 (annual)'],
              ['Rater engagement', 'Formal data submission · feedback loop', 'MSCI · Sustainalytics · ISS', 'M6-12'],
              ['Re-review', 'Rater re-scoring cycle · response to queries', 'All', 'M9-15'],
              ['Uplift validation', 'New ratings issued · index eligibility assessed', 'All', 'M12-18'],
              ['Sustain', 'Annual data refresh · policy updates · score defense', 'All', 'M18+'],
            ].map((r, i) => <tr key={i}><td style={{ ...sty.td, color: T.gold }}>{r[0]}</td><td style={sty.td}>{r[1]}</td><td style={{ ...sty.td, fontSize: 10 }}>{r[2]}</td><td style={{ ...sty.td, fontFamily: T.mono }}>{r[3]}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 24, padding: '10px 16px', background: T.surfaceH, borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 11, color: T.textMut }}>
        <span>EP-EB4 · ESG Ratings Uplift Programme · Impact Advisory</span>
        <span>MSCI · Sustainalytics · CDP · S&P · ISS · 7 Tabs</span>
      </div>
    </div>
  );
}
