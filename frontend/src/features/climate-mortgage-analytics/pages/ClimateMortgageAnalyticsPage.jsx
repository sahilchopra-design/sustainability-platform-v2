import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, PieChart, Pie, Cell,
  CartesianGrid, Legend,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const LENDER_TYPES = ['High Street Bank', 'Building Society', 'Specialist Lender', 'Investment Bank', 'Digital Lender'];
const REG_STATUSES = ['Compliant', 'At Risk', 'Non-Compliant'];
const EPC_LEVELS = ['A', 'B', 'C', 'D', 'E', 'F'];

const LENDERS = Array.from({ length: 60 }, (_, i) => {
  const type = LENDER_TYPES[Math.floor(sr(i * 7) * LENDER_TYPES.length)];
  const portfolioValue = parseFloat((2 + sr(i * 3) * 148).toFixed(1));
  const avgLTV = parseFloat((45 + sr(i * 11) * 35).toFixed(1));
  const avgEPC = EPC_LEVELS[Math.floor(sr(i * 13) * EPC_LEVELS.length)];
  const floodExposurePct = parseFloat((2 + sr(i * 17) * 28).toFixed(1));
  const strandedPct = parseFloat((1 + sr(i * 19) * 24).toFixed(1));
  const climateVaR = parseFloat((0.5 + sr(i * 23) * 11.5).toFixed(2));
  const capitalCharge = parseFloat((portfolioValue * climateVaR / 100 * 0.12).toFixed(2));
  const regScore = climateVaR + floodExposurePct * 0.3 + strandedPct * 0.5;
  const regulatoryStatus = regScore > 18 ? 'Non-Compliant' : regScore > 10 ? 'At Risk' : 'Compliant';
  return {
    id: i + 1,
    name: `${type.split(' ')[0]} Lender ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) + 1}`,
    type, portfolioValue, avgLTV, avgEPC, floodExposurePct, strandedPct,
    climateVaR, capitalCharge, regulatoryStatus,
  };
});

const TABS = [
  'Portfolio Overview', 'EPC Distribution', 'Flood Exposure', 'Stranded Collateral',
  'Climate VaR', 'Capital Impact', 'Regulatory Status', 'Stress Testing',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

const PIE_COLORS = [T.green, T.amber, T.red];

export default function ClimateMortgageAnalyticsPage() {
  const [tab, setTab] = useState('Portfolio Overview');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [floodSeverity, setFloodSeverity] = useState(3);
  const [carbonPrice, setCarbonPrice] = useState(75);

  const filtered = useMemo(() => LENDERS.filter(l => {
    if (filterType !== 'All' && l.type !== filterType) return false;
    if (filterStatus !== 'All' && l.regulatoryStatus !== filterStatus) return false;
    return true;
  }), [filterType, filterStatus]);

  const totalPortfolio = filtered.length ? filtered.reduce((s, l) => s + l.portfolioValue, 0).toFixed(1) : '0.0';
  const avgClimateVaR = filtered.length ? (filtered.reduce((s, l) => s + l.climateVaR, 0) / filtered.length).toFixed(2) : '0.00';
  const avgStranded = filtered.length ? (filtered.reduce((s, l) => s + l.strandedPct, 0) / filtered.length).toFixed(1) : '0.0';
  const totalCapital = filtered.length ? filtered.reduce((s, l) => s + l.capitalCharge, 0).toFixed(2) : '0.00';

  const varByType = useMemo(() => LENDER_TYPES.map(t => {
    const arr = filtered.filter(l => l.type === t);
    return { name: t.split(' ')[0], 'Avg Climate VaR (%)': arr.length ? parseFloat((arr.reduce((s, l) => s + l.climateVaR, 0) / arr.length).toFixed(2)) : 0 };
  }), [filtered]);

  const capitalByType = useMemo(() => LENDER_TYPES.map(t => {
    const arr = filtered.filter(l => l.type === t);
    return { name: t.split(' ')[0], 'Total Capital £Bn': arr.length ? parseFloat(arr.reduce((s, l) => s + l.capitalCharge, 0).toFixed(2)) : 0 };
  }), [filtered]);

  const regPieData = useMemo(() => REG_STATUSES.map(s => ({
    name: s, value: filtered.filter(l => l.regulatoryStatus === s).length,
  })), [filtered]);

  const scatterData = useMemo(() => filtered.map(l => ({ x: l.avgLTV, y: EPC_LEVELS.indexOf(l.avgEPC) + 1, name: l.name })), [filtered]);

  const epcDistData = useMemo(() => EPC_LEVELS.map(e => ({
    name: e,
    Count: filtered.filter(l => l.avgEPC === e).length,
    'Avg Portfolio £Bn': parseFloat((filtered.filter(l => l.avgEPC === e).reduce((s, l) => s + l.portfolioValue, 0) / Math.max(1, filtered.filter(l => l.avgEPC === e).length)).toFixed(1)),
  })), [filtered]);

  const floodData = useMemo(() => LENDER_TYPES.map(t => {
    const arr = filtered.filter(l => l.type === t);
    const baseExp = arr.length ? arr.reduce((s, l) => s + l.floodExposurePct, 0) / arr.length : 0;
    return { name: t.split(' ')[0], 'Flood Exposure (%)': parseFloat((baseExp * (floodSeverity / 3)).toFixed(1)) };
  }), [filtered, floodSeverity]);

  const strandedData = useMemo(() => LENDER_TYPES.map(t => {
    const arr = filtered.filter(l => l.type === t);
    return { name: t.split(' ')[0], 'Stranded Collateral (%)': arr.length ? parseFloat((arr.reduce((s, l) => s + l.strandedPct, 0) / arr.length).toFixed(1)) : 0 };
  }), [filtered]);

  const stressData = useMemo(() => {
    const scenarios = [
      { name: 'Base', varMult: 1.0, capitalMult: 1.0 },
      { name: 'Mild Stress', varMult: 1.3, capitalMult: 1.4 },
      { name: 'Moderate', varMult: 1.7, capitalMult: 2.0 },
      { name: 'Severe', varMult: 2.4, capitalMult: 3.1 },
      { name: 'Extreme', varMult: 3.5, capitalMult: 4.8 },
    ];
    const baseVaR = filtered.length ? filtered.reduce((s, l) => s + l.climateVaR, 0) / filtered.length : 4;
    const baseCapital = filtered.length ? filtered.reduce((s, l) => s + l.capitalCharge, 0) : 10;
    return scenarios.map(s => ({
      name: s.name,
      'Climate VaR (%)': parseFloat((baseVaR * s.varMult * (carbonPrice / 75)).toFixed(2)),
      'Capital Charge £Bn': parseFloat((baseCapital * s.capitalMult).toFixed(2)),
    }));
  }, [filtered, carbonPrice]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, letterSpacing: 2, marginBottom: 4 }}>EP-DE3 · GREEN REAL ESTATE & BUILT ENVIRONMENT</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Climate Mortgage Analytics</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>60 mortgage lenders · Climate VaR · Stranded collateral · Capital impact · Regulatory compliance</div>
      </div>

      <div style={{ background: T.cream, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Lender Type', filterType, setFilterType, ['All', ...LENDER_TYPES]],
          ['Status', filterStatus, setFilterStatus, ['All', ...REG_STATUSES]]].map(([label, val, setter, opts]) => (
          <label key={label} style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
            {label}:
            <select value={val} onChange={e => setter(e.target.value)}
              style={{ fontSize: 12, padding: '3px 8px', borderRadius: 4, border: `1px solid ${T.border}`, background: T.card }}>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </label>
        ))}
        <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
          Flood Severity {floodSeverity}/5:
          <input type="range" min={1} max={5} value={floodSeverity} onChange={e => setFloodSeverity(+e.target.value)} style={{ width: 100 }} />
        </label>
        <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
          Carbon £{carbonPrice}/tCO2:
          <input type="range" min={20} max={200} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 100 }} />
        </label>
        <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>{filtered.length} / {LENDERS.length} lenders</span>
      </div>

      <div style={{ display: 'flex', gap: 16, padding: '20px 32px', flexWrap: 'wrap' }}>
        <KpiCard label="Total Portfolio" value={`£${Number(totalPortfolio).toLocaleString()}Bn`} sub="filtered lenders" color={T.navy} />
        <KpiCard label="Avg Climate VaR" value={`${avgClimateVaR}%`} sub="portfolio at risk" color={T.red} />
        <KpiCard label="Avg Stranded Collateral" value={`${avgStranded}%`} sub="of mortgage book" color={T.orange} />
        <KpiCard label="Total Capital Charge" value={`£${totalCapital}Bn`} sub="climate adjustment" color={T.amber} />
      </div>

      <div style={{ display: 'flex', gap: 0, padding: '0 32px', borderBottom: `1px solid ${T.border}` }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '10px 14px', fontSize: 12, fontWeight: tab === t ? 700 : 400, background: 'none', border: 'none',
              borderBottom: tab === t ? `3px solid ${T.gold}` : '3px solid transparent',
              color: tab === t ? T.navy : T.textSec, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px 32px' }}>
        {tab === 'Portfolio Overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Climate VaR by Lender Type (%)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={varByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Avg Climate VaR (%)" fill={T.red} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Regulatory Status Distribution</div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={regPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                    {regPieData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'EPC Distribution' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Lenders by Avg Portfolio EPC Rating</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={epcDistData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Count" fill={T.indigo} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>LTV vs EPC Rating (Scatter)</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Avg LTV %" tick={{ fontSize: 11 }} label={{ value: 'LTV %', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis dataKey="y" name="EPC Index" tick={{ fontSize: 11 }} tickFormatter={v => EPC_LEVELS[v - 1] || v} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={scatterData} fill={T.teal} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'Flood Exposure' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Flood Exposure by Lender Type — Severity {floodSeverity}/5 (%)</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={floodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Flood Exposure (%)" fill={T.blue} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'Stranded Collateral' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Stranded Collateral % by Type</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={strandedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Stranded Collateral (%)" fill={T.orange} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: T.navy }}>Highest Stranded Exposure Lenders</div>
              {[...filtered].sort((a, b) => b.strandedPct - a.strandedPct).slice(0, 10).map(l => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                  <span>{l.name}</span>
                  <span style={{ fontFamily: T.fontMono, color: l.strandedPct > 15 ? T.red : T.amber }}>{l.strandedPct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Climate VaR' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Climate VaR Distribution by Type</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={varByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Avg Climate VaR (%)" fill={T.red} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: T.navy }}>Top Climate VaR Lenders</div>
              {[...filtered].sort((a, b) => b.climateVaR - a.climateVaR).slice(0, 12).map(l => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                  <span>{l.name}</span>
                  <span style={{ fontFamily: T.fontMono, color: l.climateVaR > 8 ? T.red : T.amber }}>{l.climateVaR}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Capital Impact' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Total Capital Charges by Lender Type (£Bn)</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={capitalByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Total Capital £Bn" fill={T.navy} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'Regulatory Status' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Regulatory Status Breakdown</div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={regPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, value }) => `${name}: ${value}`}>
                    {regPieData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: T.navy }}>Non-Compliant Lenders</div>
              {filtered.filter(l => l.regulatoryStatus === 'Non-Compliant').slice(0, 10).map(l => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                  <span>{l.name}</span>
                  <span style={{ fontFamily: T.fontMono, color: T.red, fontSize: 11 }}>VaR {l.climateVaR}% · Stranded {l.strandedPct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Stress Testing' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Stress Test — Climate VaR & Capital Charge Escalation (Carbon £{carbonPrice}/tCO2)</div>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={stressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Climate VaR (%)" fill={T.red} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Capital Charge £Bn" fill={T.navy} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
