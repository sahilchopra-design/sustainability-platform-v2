import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ComposedChart, Area,
  ResponsiveContainer, Cell,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const ASSET_TYPES = ['Coal Plant', 'Oil Field', 'Gas Pipeline', 'Refinery', 'LNG Terminal', 'Coal Mine', 'Tar Sands', 'Shale Field'];
const COUNTRIES = ['USA', 'Canada', 'Australia', 'UK', 'Germany', 'Netherlands', 'Poland', 'India', 'China', 'Russia', 'Saudi Arabia', 'UAE', 'Indonesia', 'South Africa', 'Brazil', 'Mexico', 'Kazakhstan', 'Colombia', 'Nigeria', 'Norway'];
const PERMIT_STATUSES = ['Active', 'Under Review', 'Challenged', 'Revoked'];
const NGFS_SCENARIOS = ['Net Zero 2050', 'Below 2°C', 'Delayed Transition', 'Hot House World'];
const NGFS_WRITE_DOWN_RANGES = [[55, 85], [35, 65], [20, 45], [10, 25]];
const CREDITOR_TYPES = ['Bank', 'Bond', 'Insurance', 'Pension', 'Sovereign'];

const OWNER_NAMES = [
  'Apex Energy Corp', 'GlobalOil PLC', 'TerraFuel AG', 'CoalTech Industries', 'PetroChem SE',
  'EnergyGiant Corp', 'BlueFuel Ltd', 'NatGas Holdings', 'TarSands Global', 'ShaleFirst Energy',
  'LNG Dynamics', 'PipelineCo', 'RefineryCorp', 'CoalMine Holdings', 'HeavyOil Partners',
  'CarbonFirst Ltd', 'OilStream PLC', 'FossilFuel AG', 'MiningCo Global', 'FuelGroup SE',
];

const ASSETS = Array.from({ length: 120 }, (_, i) => {
  const typeIdx = Math.floor(sr(i * 7) * 8);
  const countryIdx = Math.floor(sr(i * 11) * 20);
  const ownerIdx = Math.floor(sr(i * 13) * 20);
  const strandingRisk = Math.round(sr(i * 17) * 90 + 5);
  const bookValue = Math.round((sr(i * 19) * 4 + 0.05) * 1e3); // $M
  const remainingLife = Math.round(sr(i * 23) * 35 + 2);
  const carbonLockIn = +(sr(i * 29) * 500 + 5).toFixed(1);
  const decommissionCost = Math.round(bookValue * (sr(i * 31) * 0.3 + 0.05));
  const litigationExposure = Math.round(bookValue * (sr(i * 37) * 0.5 + 0.02));
  const creditorExposure = Math.round(bookValue * (sr(i * 41) * 0.7 + 0.1));
  const permitStatusIdx = Math.floor(sr(i * 43) * 4);
  const physRisk = Math.round(sr(i * 47) * 80 + 10);
  const policyRisk = Math.round(sr(i * 53) * 80 + 10);
  const marketRisk = Math.round(sr(i * 59) * 80 + 10);
  const socialLicenseRisk = Math.round(sr(i * 61) * 80 + 10);
  const currentUtilization = +(sr(i * 67) * 90 + 5).toFixed(0);
  const ngfsWriteDown = NGFS_SCENARIOS.map((_, si) => {
    const [lo, hi] = NGFS_WRITE_DOWN_RANGES[si];
    return Math.round(lo + sr(i * 71 + si * 50) * (hi - lo));
  });
  const remEconValue = Math.round(bookValue * (remainingLife / 40) * (1 - strandingRisk / 100));
  return {
    id: i + 1,
    name: `${ASSET_TYPES[typeIdx]} ${i + 1}`,
    type: ASSET_TYPES[typeIdx],
    owner: OWNER_NAMES[ownerIdx],
    country: COUNTRIES[countryIdx],
    bookValue,
    strandingRisk,
    remainingLife,
    carbonLockIn,
    decommissionCost,
    litigationExposure,
    creditorExposure,
    permitStatus: PERMIT_STATUSES[permitStatusIdx],
    ngfsWriteDown,
    physicalRiskScore: physRisk,
    policyRiskScore: policyRisk,
    marketRiskScore: marketRisk,
    socialLicenseRisk,
    currentUtilization: +currentUtilization,
    remainingEconValue: Math.max(0, remEconValue),
  };
});

const CREDITORS = Array.from({ length: 80 }, (_, k) => {
  const creditorTypeIdx = Math.floor(sr(k * 73 + 3000) * 5);
  const assetIdx = Math.floor(sr(k * 79 + 3000) * 120);
  const asset = ASSETS[assetIdx];
  const exposureUSD = Math.round((sr(k * 83 + 3000) * 3 + 0.01) * 1e9);
  const maturityYear = 2025 + Math.floor(sr(k * 89 + 3000) * 20);
  const loanToValue = +(sr(k * 97 + 3000) * 0.8 + 0.1).toFixed(2);
  const provisioning = +(sr(k * 101 + 3000) * 0.3).toFixed(2);
  const litigationRisk = Math.round(sr(k * 103 + 3000) * 70 + 10);
  const creditorNames = ['GreenBank Global', 'CapitalFirst AG', 'BondIssuer PLC', 'InsureCo SE', 'PensionFund Corp', 'SovereignFund AA', 'RegionalBank Ltd', 'InvestCo Holdings', 'TrustBank NA', 'AssetMgmt Partners'];
  return {
    id: k + 1,
    creditorName: creditorNames[k % creditorNames.length],
    creditorType: CREDITOR_TYPES[creditorTypeIdx],
    exposureUSD,
    maturityYear,
    assetName: asset.name,
    assetType: asset.type,
    loanToValue,
    provisioning,
    litigationRisk,
  };
});

const REG_TRIGGERS = Array.from({ length: 20 }, (_, r) => {
  const jurIdx = Math.floor(sr(r * 107 + 3500) * 20);
  const typeIdx = Math.floor(sr(r * 109 + 3500) * 8);
  const impactTypes = ['Write-Down', 'Permit Revocation', 'Early Closure', 'Stranding'];
  const probability = +(sr(r * 113 + 3500) * 0.7 + 0.1).toFixed(2);
  const years = [2025, 2026, 2027, 2028, 2030, 2032, 2035];
  const triggers = [
    'Carbon pricing > $100/tonne', 'Coal power phase-out mandate', 'Methane emission limits',
    'SFDR Article 9 reclassification', 'IEA NZE alignment requirement', 'Stranded asset disclosure rule',
    'New fossil fuel exploration ban', 'Climate stress test failure trigger', 'Carbon border adjustment',
    'Mandatory transition plan submission', 'Mandatory science-based targets', 'Physical risk disclosure rule',
    'Green taxonomy exclusion', 'Institutional investor ESG mandate', 'Government subsidy phase-out',
    'New GHG reporting standard', 'Asset life extension ban', 'Methane royalty increase',
    'Early closure compensation fund', 'Fossil fuel divestment mandate',
  ];
  return {
    id: r + 1,
    trigger: triggers[r],
    jurisdiction: COUNTRIES[jurIdx],
    effectiveDate: years[Math.floor(sr(r * 117 + 3500) * years.length)],
    assetType: ASSET_TYPES[typeIdx],
    expectedImpact: impactTypes[Math.floor(sr(r * 119 + 3500) * 4)],
    probability,
  };
});

const fmtUSD = v => {
  if (!isFinite(v) || isNaN(v)) return '$0';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${Math.round(v).toLocaleString()}`;
};

const riskColor = s => s >= 70 ? T.red : s >= 40 ? T.amber : T.green;

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>{sub}</div>}
  </div>
);

const RiskBadge = ({ val }) => (
  <span style={{ background: riskColor(val) + '18', color: riskColor(val), border: `1px solid ${riskColor(val)}40`, borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>{val}</span>
);

const TABS = ['Stranding Dashboard', 'Asset Database', 'NGFS Scenario Analysis', 'Creditor Exposure', 'Regulatory Trigger Map', 'Carbon Lock-In Analytics', 'Summary & Export'];

export default function StrandedAssetLitigationTrackerPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [riskMax, setRiskMax] = useState(100);
  const [remainingLifeMax, setRemainingLifeMax] = useState(40);
  const [creditorTypeFilter, setCreditorTypeFilter] = useState('All');
  const [permitFilter, setPermitFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('strandingRisk');
  const [sortDir, setSortDir] = useState('desc');
  const [drillAsset, setDrillAsset] = useState(null);
  const [credSortCol, setCredSortCol] = useState('exposureUSD');
  const [credSortDir, setCredSortDir] = useState('desc');

  const filtered = useMemo(() => {
    if (!ASSETS.length) return [];
    let arr = [...ASSETS];
    if (typeFilter !== 'All') arr = arr.filter(a => a.type === typeFilter);
    if (countryFilter !== 'All') arr = arr.filter(a => a.country === countryFilter);
    if (permitFilter !== 'All') arr = arr.filter(a => a.permitStatus === permitFilter);
    if (search) arr = arr.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.owner.toLowerCase().includes(search.toLowerCase()));
    arr = arr.filter(a => a.strandingRisk <= riskMax && a.remainingLife <= remainingLifeMax);
    return [...arr].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [typeFilter, countryFilter, permitFilter, search, riskMax, remainingLifeMax, sortCol, sortDir]);

  const strandingVaR = useMemo(() => {
    if (!filtered.length) return { total: 0, byType: [], byScenario: [] };
    const total = filtered.reduce((s, a) => s + a.bookValue * a.ngfsWriteDown[scenarioIdx] / 100, 0);
    const typeMap = {};
    ASSET_TYPES.forEach(t => { typeMap[t] = 0; });
    filtered.forEach(a => { typeMap[a.type] = (typeMap[a.type] || 0) + a.bookValue * a.ngfsWriteDown[scenarioIdx] / 100; });
    const byType = Object.entries(typeMap).map(([type, val]) => ({ type, val: Math.round(val) })).filter(d => d.val > 0).sort((a, b) => b.val - a.val);
    const byScenario = NGFS_SCENARIOS.map((sc, si) => ({
      scenario: sc,
      varM: Math.round(filtered.reduce((s, a) => s + a.bookValue * a.ngfsWriteDown[si] / 100, 0)),
    }));
    return { total, byType, byScenario };
  }, [filtered, scenarioIdx]);

  const ngfsTypeData = useMemo(() => ASSET_TYPES.map(type => {
    const ents = ASSETS.filter(a => a.type === type);
    if (!ents.length) return null;
    return {
      type: type.replace(' ', '\n'),
      ...NGFS_SCENARIOS.reduce((obj, sc, si) => {
        obj[sc] = Math.round(ents.reduce((s, a) => s + a.ngfsWriteDown[si], 0) / ents.length);
        return obj;
      }, {}),
    };
  }).filter(Boolean), []);

  const carbonLockInData = useMemo(() => {
    const byType = ASSET_TYPES.map(type => ({
      type,
      totalMtCO2: +filtered.filter(a => a.type === type).reduce((s, a) => s + a.carbonLockIn, 0).toFixed(0),
    })).filter(d => d.totalMtCO2 > 0).sort((a, b) => b.totalMtCO2 - a.totalMtCO2);
    const scc = 51; // USD per tonne CO2
    const totalLockIn = filtered.reduce((s, a) => s + a.carbonLockIn, 0);
    const sccExposure = totalLockIn * scc * 1e6;
    // 2025-2050 lock-in timeline
    const timeline = Array.from({ length: 6 }, (_, y) => {
      const year = 2025 + y * 5;
      const remaining = filtered.filter(a => a.remainingLife >= y * 5).reduce((s, a) => s + a.carbonLockIn, 0);
      return { year, remainingMtCO2: +remaining.toFixed(0) };
    });
    return { byType, totalLockIn: +totalLockIn.toFixed(0), sccExposure, timeline };
  }, [filtered]);

  const filteredCreditors = useMemo(() => {
    let arr = [...CREDITORS];
    if (creditorTypeFilter !== 'All') arr = arr.filter(c => c.creditorType === creditorTypeFilter);
    return [...arr].sort((a, b) => {
      const av = a[credSortCol], bv = b[credSortCol];
      if (typeof av === 'number') return credSortDir === 'asc' ? av - bv : bv - av;
      return credSortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [creditorTypeFilter, credSortCol, credSortDir]);

  const triggerScoreByAsset = useMemo(() => {
    return filtered.slice(0, 20).map(a => {
      const applicableTriggers = REG_TRIGGERS.filter(t => t.assetType === a.type);
      const score = applicableTriggers.reduce((s, t) => s + t.probability, 0);
      return { name: a.name, score: +score.toFixed(2), count: applicableTriggers.length };
    }).sort((a, b) => b.score - a.score);
  }, [filtered]);

  const handleSort = useCallback(col => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }, [sortCol]);

  const COLORS = [T.indigo, T.red, T.amber, T.orange];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ background: T.amber, borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>EP</div>
            <div>
              <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1, textTransform: 'uppercase' }}>EP-DA4 · Disclosure & Stranded Asset Analytics</div>
              <h1 style={{ fontSize: 21, fontWeight: 700, margin: 0 }}>Stranded Asset Litigation Tracker</h1>
            </div>
          </div>
          <div style={{ fontSize: 12, color: T.muted }}>120 assets · 4 NGFS scenarios · 80 creditor records · 20 regulatory triggers · carbon lock-in analytics</div>
        </div>

        <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: `2px solid ${T.border}`, overflowX: 'auto', paddingBottom: 1 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setActiveTab(i)} style={{ padding: '8px 14px', border: 'none', background: activeTab === i ? T.amber : 'transparent', color: activeTab === i ? '#fff' : T.muted, borderRadius: '6px 6px 0 0', cursor: 'pointer', fontWeight: activeTab === i ? 600 : 400, fontSize: 12, whiteSpace: 'nowrap' }}>{t}</button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Search</div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Asset or owner..." style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12, width: 150 }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Asset Type</div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
              <option>All</option>
              {ASSET_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Country</div>
            <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
              <option>All</option>
              {COUNTRIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Permit Status</div>
            <select value={permitFilter} onChange={e => setPermitFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
              <option>All</option>
              {PERMIT_STATUSES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>NGFS Scenario</div>
            <select value={scenarioIdx} onChange={e => setScenarioIdx(+e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
              {NGFS_SCENARIOS.map((s, i) => <option key={s} value={i}>{s}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Max Stranding Risk: {riskMax}</div>
            <input type="range" min={0} max={100} value={riskMax} onChange={e => setRiskMax(+e.target.value)} style={{ width: 90 }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Max Life (yrs): {remainingLifeMax}</div>
            <input type="range" min={1} max={40} value={remainingLifeMax} onChange={e => setRemainingLifeMax(+e.target.value)} style={{ width: 90 }} />
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginLeft: 'auto' }}>{filtered.length}/{ASSETS.length} assets</div>
        </div>

        {/* Drill-down Panel */}
        {drillAsset && (
          <div style={{ background: T.card, border: `2px solid ${T.amber}`, borderRadius: 8, padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{drillAsset.name} — Asset Profile</div>
              <button onClick={() => setDrillAsset(null)} style={{ background: T.red, color: '#fff', border: 'none', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 12 }}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
              <KpiCard label="Book Value" value={`$${drillAsset.bookValue}M`} />
              <KpiCard label="Stranding Risk" value={drillAsset.strandingRisk} color={riskColor(drillAsset.strandingRisk)} />
              <KpiCard label="Remaining Life" value={`${drillAsset.remainingLife}yr`} />
              <KpiCard label="Carbon Lock-In" value={`${drillAsset.carbonLockIn}Mt`} color={T.orange} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
              <KpiCard label="Decommission Cost" value={`$${drillAsset.decommissionCost}M`} color={T.red} />
              <KpiCard label="Litigation Exposure" value={`$${drillAsset.litigationExposure}M`} color={T.red} />
              <KpiCard label="Creditor Exposure" value={`$${drillAsset.creditorExposure}M`} />
              <KpiCard label="Permit Status" value={drillAsset.permitStatus} color={drillAsset.permitStatus === 'Revoked' ? T.red : drillAsset.permitStatus === 'Challenged' ? T.amber : T.green} />
            </div>
            <div style={{ background: T.sub, borderRadius: 6, padding: 12, marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8 }}>NGFS Write-Down Scenarios</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {NGFS_SCENARIOS.map((sc, si) => (
                  <div key={sc} style={{ textAlign: 'center', background: T.card, borderRadius: 6, padding: 8 }}>
                    <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>{sc}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: COLORS[si] }}>{drillAsset.ngfsWriteDown[si]}%</div>
                    <div style={{ fontSize: 11, color: T.muted }}>${Math.round(drillAsset.bookValue * drillAsset.ngfsWriteDown[si] / 100)}M</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 12, color: T.muted }}>
              Owner: <b>{drillAsset.owner}</b> · Country: <b>{drillAsset.country}</b> · Utilization: <b>{drillAsset.currentUtilization}%</b> · Remaining Econ Value: <b>${drillAsset.remainingEconValue}M</b>
            </div>
          </div>
        )}

        {/* ── TAB 0: Stranding Dashboard ── */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <KpiCard label="Assets Tracked" value={filtered.length} />
              <KpiCard label={`VaR (${NGFS_SCENARIOS[scenarioIdx]})`} value={fmtUSD(strandingVaR.total * 1e6)} color={T.red} />
              <KpiCard label="Total Book Value" value={fmtUSD(filtered.reduce((s, a) => s + a.bookValue, 0) * 1e6)} />
              <KpiCard label="Avg Stranding Risk" value={filtered.length ? Math.round(filtered.reduce((s, a) => s + a.strandingRisk, 0) / filtered.length) : 0} color={T.amber} />
              <KpiCard label="Total Carbon Lock-In" value={`${carbonLockInData.totalLockIn} MtCO2`} color={T.orange} />
              <KpiCard label="Permit Challenged/Revoked" value={filtered.filter(a => ['Challenged', 'Revoked'].includes(a.permitStatus)).length} color={T.red} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Stranding VaR by Scenario ($M)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={strandingVaR.byScenario}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="scenario" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={40} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => [`$${v}M`, 'Stranding VaR']} />
                    <Bar dataKey="varM" name="VaR ($M)" radius={[4, 4, 0, 0]}>
                      {NGFS_SCENARIOS.map((s, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>VaR Attribution by Asset Type ($M)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={strandingVaR.byType.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="type" tick={{ fontSize: 9 }} width={80} />
                    <Tooltip formatter={v => [`$${v}M`, 'VaR']} />
                    <Bar dataKey="val" name="VaR ($M)" fill={T.red} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 1: Asset Database ── */}
        {activeTab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Asset Database — {filtered.length} records</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {[['name', 'Asset Name'], ['type', 'Type'], ['owner', 'Owner'], ['country', 'Country'], ['strandingRisk', 'Strand Risk'], ['bookValue', 'Book Val ($M)'], ['remainingLife', 'Life (yr)'], ['carbonLockIn', 'CO2 Lock-In (Mt)'], ['permitStatus', 'Permit'], ['litigationExposure', 'Lit. Exp ($M)']].map(([col, label]) => (
                      <th key={col} onClick={() => handleSort(col)} style={{ padding: '7px 8px', textAlign: 'left', cursor: 'pointer', borderBottom: `2px solid ${T.border}`, color: sortCol === col ? T.amber : T.text, userSelect: 'none', whiteSpace: 'nowrap', fontSize: 11 }}>
                        {label} {sortCol === col ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                      </th>
                    ))}
                    <th style={{ padding: '7px 8px' }}>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 100).map((a, i) => (
                    <tr key={a.id} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600, whiteSpace: 'nowrap' }}>{a.name}</td>
                      <td style={{ padding: '6px 8px', fontSize: 10 }}>{a.type}</td>
                      <td style={{ padding: '6px 8px', fontSize: 10 }}>{a.owner}</td>
                      <td style={{ padding: '6px 8px' }}>{a.country}</td>
                      <td style={{ padding: '6px 8px' }}><RiskBadge val={a.strandingRisk} /></td>
                      <td style={{ padding: '6px 8px', fontWeight: 600 }}>${a.bookValue}M</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{a.remainingLife}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{a.carbonLockIn}</td>
                      <td style={{ padding: '6px 8px' }}>
                        <span style={{ fontWeight: 600, color: a.permitStatus === 'Revoked' ? T.red : a.permitStatus === 'Challenged' ? T.amber : T.green, fontSize: 10 }}>{a.permitStatus}</span>
                      </td>
                      <td style={{ padding: '6px 8px' }}>${a.litigationExposure}M</td>
                      <td style={{ padding: '6px 8px' }}>
                        <button onClick={() => setDrillAsset(a)} style={{ background: T.amber, color: '#fff', border: 'none', borderRadius: 3, padding: '2px 7px', fontSize: 10, cursor: 'pointer' }}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 100 && <div style={{ textAlign: 'center', padding: 10, color: T.muted, fontSize: 11 }}>Showing 100 of {filtered.length}</div>}
            </div>
          </div>
        )}

        {/* ── TAB 2: NGFS Scenario Analysis ── */}
        {activeTab === 2 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              {NGFS_SCENARIOS.map((sc, si) => (
                <KpiCard key={sc} label={sc} value={`$${strandingVaR.byScenario[si]?.varM || 0}M VaR`} color={COLORS[si]} sub={`${NGFS_WRITE_DOWN_RANGES[si][0]}-${NGFS_WRITE_DOWN_RANGES[si][1]}% write-down range`} />
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>NGFS Write-Down % by Asset Type (Avg)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ngfsTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  {NGFS_SCENARIOS.map((sc, si) => <Bar key={sc} dataKey={sc} fill={COLORS[si]} radius={[2, 2, 0, 0]} />)}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Scenario Comparison Table (Avg Write-Down by Asset Type)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    <th style={{ padding: '7px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>Asset Type</th>
                    {NGFS_SCENARIOS.map((sc, si) => <th key={sc} style={{ padding: '7px 10px', textAlign: 'center', borderBottom: `2px solid ${T.border}`, color: COLORS[si], fontSize: 11 }}>{sc}</th>)}
                    <th style={{ padding: '7px 10px', textAlign: 'center', borderBottom: `2px solid ${T.border}` }}>Range</th>
                  </tr>
                </thead>
                <tbody>
                  {ngfsTypeData.map((d, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{d.type}</td>
                      {NGFS_SCENARIOS.map((sc, si) => (
                        <td key={sc} style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 600, color: COLORS[si] }}>{d[sc]}%</td>
                      ))}
                      <td style={{ padding: '6px 10px', textAlign: 'center', color: T.muted, fontSize: 11 }}>
                        {Math.min(...NGFS_SCENARIOS.map(sc => d[sc]))}–{Math.max(...NGFS_SCENARIOS.map(sc => d[sc]))}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: Creditor Exposure ── */}
        {activeTab === 3 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <KpiCard label="Total Creditors" value={CREDITORS.length} />
              <KpiCard label="Total Exposure" value={fmtUSD(CREDITORS.reduce((s, c) => s + c.exposureUSD, 0))} color={T.red} />
              <KpiCard label="Avg LTV" value={`${(CREDITORS.reduce((s, c) => s + c.loanToValue, 0) / CREDITORS.length * 100).toFixed(0)}%`} />
              <KpiCard label="Avg Provisioning" value={`${(CREDITORS.reduce((s, c) => s + c.provisioning, 0) / CREDITORS.length * 100).toFixed(0)}%`} color={T.amber} />
            </div>
            <div style={{ marginBottom: 14, display: 'flex', gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Creditor Type</div>
                <select value={creditorTypeFilter} onChange={e => setCreditorTypeFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
                  <option>All</option>
                  {CREDITOR_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 18, marginBottom: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, overflowX: 'auto' }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Creditor Exposure Database — {filteredCreditors.length} records</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {[['creditorName', 'Creditor'], ['creditorType', 'Type'], ['assetName', 'Asset'], ['exposureUSD', 'Exposure'], ['maturityYear', 'Maturity'], ['loanToValue', 'LTV'], ['provisioning', 'Provisioning'], ['litigationRisk', 'Lit. Risk']].map(([col, label]) => (
                        <th key={col} onClick={() => { if (credSortCol === col) setCredSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setCredSortCol(col); setCredSortDir('desc'); } }} style={{ padding: '6px 8px', textAlign: 'left', cursor: 'pointer', borderBottom: `2px solid ${T.border}`, color: credSortCol === col ? T.amber : T.text, userSelect: 'none', whiteSpace: 'nowrap', fontSize: 10 }}>
                          {label} {credSortCol === col ? (credSortDir === 'asc' ? '▲' : '▼') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCreditors.slice(0, 50).map((c, i) => (
                      <tr key={c.id} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '5px 8px', fontWeight: 600, fontSize: 10 }}>{c.creditorName}</td>
                        <td style={{ padding: '5px 8px', fontSize: 10 }}>{c.creditorType}</td>
                        <td style={{ padding: '5px 8px', fontSize: 10 }}>{c.assetName}</td>
                        <td style={{ padding: '5px 8px', fontWeight: 600, color: T.red }}>{fmtUSD(c.exposureUSD)}</td>
                        <td style={{ padding: '5px 8px' }}>{c.maturityYear}</td>
                        <td style={{ padding: '5px 8px', color: c.loanToValue > 0.7 ? T.red : T.muted }}>{(c.loanToValue * 100).toFixed(0)}%</td>
                        <td style={{ padding: '5px 8px', color: c.provisioning < 0.1 ? T.red : T.amber }}>{(c.provisioning * 100).toFixed(0)}%</td>
                        <td style={{ padding: '5px 8px' }}><RiskBadge val={c.litigationRisk} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Exposure by Creditor Type ($B)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={CREDITOR_TYPES.map(t => ({ type: t, exposureB: +(CREDITORS.filter(c => c.creditorType === t).reduce((s, c) => s + c.exposureUSD, 0) / 1e9).toFixed(1) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => [`$${v}B`, 'Exposure']} />
                    <Bar dataKey="exposureB" name="Exposure ($B)" fill={T.navy} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: Regulatory Trigger Map ── */}
        {activeTab === 4 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <KpiCard label="Regulatory Triggers" value={REG_TRIGGERS.length} />
              <KpiCard label="High Probability (>50%)" value={REG_TRIGGERS.filter(t => t.probability > 0.5).length} color={T.red} />
              <KpiCard label="Avg Probability" value={`${(REG_TRIGGERS.reduce((s, t) => s + t.probability, 0) / REG_TRIGGERS.length * 100).toFixed(0)}%`} color={T.amber} />
              <KpiCard label="Write-Down Triggers" value={REG_TRIGGERS.filter(t => t.expectedImpact === 'Write-Down').length} />
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Regulatory Trigger Database</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Trigger', 'Jurisdiction', 'Effective', 'Asset Type', 'Expected Impact', 'Probability'].map(h => <th key={h} style={{ padding: '7px 8px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontSize: 11 }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[...REG_TRIGGERS].sort((a, b) => b.probability - a.probability).map((t, i) => (
                      <tr key={t.id} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600, fontSize: 10, maxWidth: 220 }}>{t.trigger}</td>
                        <td style={{ padding: '6px 8px' }}>{t.jurisdiction}</td>
                        <td style={{ padding: '6px 8px' }}>{t.effectiveDate}</td>
                        <td style={{ padding: '6px 8px', fontSize: 10 }}>{t.assetType}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 600, color: t.expectedImpact === 'Early Closure' ? T.red : t.expectedImpact === 'Stranding' ? T.orange : T.amber, fontSize: 10 }}>{t.expectedImpact}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 600, color: t.probability > 0.5 ? T.red : T.amber }}>{(t.probability * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Trigger Score by Asset (Top 20)</div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={triggerScoreByAsset} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={85} />
                  <Tooltip />
                  <Bar dataKey="score" name="Trigger Score" fill={T.orange} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── TAB 5: Carbon Lock-In Analytics ── */}
        {activeTab === 5 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <KpiCard label="Total Carbon Lock-In" value={`${carbonLockInData.totalLockIn} MtCO2`} color={T.orange} />
              <KpiCard label="Social Cost Exposure" value={fmtUSD(carbonLockInData.sccExposure)} color={T.red} sub="at $51/tonne SCC" />
              <KpiCard label="Largest Lock-In Type" value={carbonLockInData.byType[0]?.type || '-'} />
              <KpiCard label="Highest Lock-In" value={`${carbonLockInData.byType[0]?.totalMtCO2 || 0} Mt`} color={T.amber} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Carbon Lock-In by Asset Type (MtCO2)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={carbonLockInData.byType} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="type" tick={{ fontSize: 9 }} width={80} />
                    <Tooltip formatter={v => [`${v} Mt`, 'CO2 Lock-In']} />
                    <Bar dataKey="totalMtCO2" name="MtCO2" fill={T.orange} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Carbon Lock-In Timeline 2025–2050</div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={carbonLockInData.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => [`${v} Mt`, 'Remaining CO2']} />
                    <Line type="monotone" dataKey="remainingMtCO2" name="Remaining CO2 (Mt)" stroke={T.orange} strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Carbon Lock-In by Asset Type — Detail</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Asset Type', 'Total MtCO2', 'Assets', 'Avg Per Asset (Mt)', 'Social Cost ($M, $51/t)', 'Share%'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {carbonLockInData.byType.map((d, i) => {
                    const ents = filtered.filter(a => a.type === d.type);
                    const sccM = Math.round(d.totalMtCO2 * 1e6 * 51 / 1e6);
                    const share = carbonLockInData.totalLockIn ? (d.totalMtCO2 / carbonLockInData.totalLockIn * 100).toFixed(1) : '0';
                    return (
                      <tr key={d.type} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>{d.type}</td>
                        <td style={{ padding: '6px 10px', fontWeight: 600, color: T.orange }}>{d.totalMtCO2}</td>
                        <td style={{ padding: '6px 10px' }}>{ents.length}</td>
                        <td style={{ padding: '6px 10px' }}>{ents.length ? (d.totalMtCO2 / ents.length).toFixed(1) : '0'}</td>
                        <td style={{ padding: '6px 10px', color: T.red }}>${sccM}M</td>
                        <td style={{ padding: '6px 10px' }}>{share}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 6: Summary & Export ── */}
        {activeTab === 6 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
              <KpiCard label="Total Assets" value={ASSETS.length} />
              <KpiCard label="Filtered Assets" value={filtered.length} />
              <KpiCard label="NGFS Scenarios" value={4} />
              <KpiCard label="Creditor Records" value={CREDITORS.length} />
              <KpiCard label="Regulatory Triggers" value={REG_TRIGGERS.length} />
              <KpiCard label={`VaR (${NGFS_SCENARIOS[scenarioIdx]})`} value={fmtUSD(strandingVaR.total * 1e6)} color={T.red} />
              <KpiCard label="Total Book Value" value={fmtUSD(ASSETS.reduce((s, a) => s + a.bookValue, 0) * 1e6)} />
              <KpiCard label="Total CO2 Lock-In" value={`${ASSETS.reduce((s, a) => s + a.carbonLockIn, 0).toFixed(0)} Mt`} color={T.orange} />
              <KpiCard label="Avg Stranding Risk" value={Math.round(ASSETS.reduce((s, a) => s + a.strandingRisk, 0) / ASSETS.length)} color={T.amber} />
              <KpiCard label="Challenged/Revoked" value={ASSETS.filter(a => ['Challenged', 'Revoked'].includes(a.permitStatus)).length} color={T.red} />
              <KpiCard label="Total Creditor Exp" value={fmtUSD(CREDITORS.reduce((s, c) => s + c.exposureUSD, 0))} color={T.navy} />
              <KpiCard label="High Prob. Triggers" value={REG_TRIGGERS.filter(t => t.probability > 0.5).length} color={T.orange} />
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Full Asset KPI Table — Top 50 by Stranding Risk</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['#', 'Asset', 'Type', 'Owner', 'Country', 'Strand Risk', 'Book Val', 'Life (yr)', 'CO2 Mt', 'Permit', 'NZ2050%', '2°C%', 'DT%', 'HHW%', 'Lit.Exp'].map(h => <th key={h} style={{ padding: '5px 7px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontSize: 10, whiteSpace: 'nowrap' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[...ASSETS].sort((a, b) => b.strandingRisk - a.strandingRisk).slice(0, 50).map((a, i) => (
                      <tr key={a.id} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '4px 7px' }}>{i + 1}</td>
                        <td style={{ padding: '4px 7px', fontWeight: 600, whiteSpace: 'nowrap' }}>{a.name}</td>
                        <td style={{ padding: '4px 7px', fontSize: 9 }}>{a.type}</td>
                        <td style={{ padding: '4px 7px', fontSize: 9 }}>{a.owner}</td>
                        <td style={{ padding: '4px 7px' }}>{a.country}</td>
                        <td style={{ padding: '4px 7px' }}><RiskBadge val={a.strandingRisk} /></td>
                        <td style={{ padding: '4px 7px' }}>${a.bookValue}M</td>
                        <td style={{ padding: '4px 7px', textAlign: 'center' }}>{a.remainingLife}</td>
                        <td style={{ padding: '4px 7px', textAlign: 'center' }}>{a.carbonLockIn}</td>
                        <td style={{ padding: '4px 7px', fontSize: 9, color: a.permitStatus === 'Revoked' ? T.red : T.muted }}>{a.permitStatus}</td>
                        {a.ngfsWriteDown.map((wd, si) => <td key={si} style={{ padding: '4px 7px', textAlign: 'center', color: COLORS[si], fontWeight: 600 }}>{wd}%</td>)}
                        <td style={{ padding: '4px 7px' }}>${a.litigationExposure}M</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Asset Type Summary — Key Metrics</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Asset Type', 'Count', 'Avg Strand Risk', 'Total Book ($M)', 'Avg Life (yr)', 'Total CO2 (Mt)'].map(h => <th key={h} style={{ padding: '5px 7px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontSize: 10 }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {ASSET_TYPES.map((t, i) => {
                      const ents = ASSETS.filter(a => a.type === t);
                      if (!ents.length) return null;
                      const avgRisk = Math.round(ents.reduce((s, a) => s + a.strandingRisk, 0) / ents.length);
                      const totalBook = ents.reduce((s, a) => s + a.bookValue, 0);
                      const avgLife = Math.round(ents.reduce((s, a) => s + a.remainingLife, 0) / ents.length);
                      const totalCO2 = +(ents.reduce((s, a) => s + a.carbonLockIn, 0)).toFixed(0);
                      return (
                        <tr key={t} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '4px 7px', fontWeight: 600, fontSize: 10 }}>{t}</td>
                          <td style={{ padding: '4px 7px', textAlign: 'center' }}>{ents.length}</td>
                          <td style={{ padding: '4px 7px' }}><span style={{ color: riskColor(avgRisk), fontWeight: 600 }}>{avgRisk}</span></td>
                          <td style={{ padding: '4px 7px' }}>${totalBook}M</td>
                          <td style={{ padding: '4px 7px', textAlign: 'center' }}>{avgLife}</td>
                          <td style={{ padding: '4px 7px', color: T.orange, fontWeight: 600 }}>{totalCO2}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Creditor Portfolio Summary</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Creditor Type', 'Count', 'Total Exp ($B)', 'Avg LTV%', 'Avg Provisioning%', 'Avg Lit. Risk'].map(h => <th key={h} style={{ padding: '5px 7px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontSize: 10 }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {CREDITOR_TYPES.map((ct, i) => {
                      const creds = CREDITORS.filter(c => c.creditorType === ct);
                      if (!creds.length) return null;
                      const totalExp = +(creds.reduce((s, c) => s + c.exposureUSD, 0) / 1e9).toFixed(1);
                      const avgLTV = (creds.reduce((s, c) => s + c.loanToValue, 0) / creds.length * 100).toFixed(0);
                      const avgProv = (creds.reduce((s, c) => s + c.provisioning, 0) / creds.length * 100).toFixed(0);
                      const avgLitRisk = Math.round(creds.reduce((s, c) => s + c.litigationRisk, 0) / creds.length);
                      return (
                        <tr key={ct} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '4px 7px', fontWeight: 600 }}>{ct}</td>
                          <td style={{ padding: '4px 7px', textAlign: 'center' }}>{creds.length}</td>
                          <td style={{ padding: '4px 7px', color: T.red, fontWeight: 600 }}>${totalExp}B</td>
                          <td style={{ padding: '4px 7px', color: +avgLTV > 70 ? T.red : T.amber }}>{avgLTV}%</td>
                          <td style={{ padding: '4px 7px', color: +avgProv < 10 ? T.red : T.muted }}>{avgProv}%</td>
                          <td style={{ padding: '4px 7px' }}><span style={{ color: riskColor(avgLitRisk), fontWeight: 600 }}>{avgLitRisk}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ marginTop: 18, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>NGFS Stranding VaR Sensitivity — All Scenarios</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ASSET_TYPES.map(t => {
                  const ents = ASSETS.filter(a => a.type === t);
                  if (!ents.length) return null;
                  const obj = { type: t.replace(' ', '\n') };
                  NGFS_SCENARIOS.forEach((sc, si) => {
                    obj[sc] = Math.round(ents.reduce((s, a) => s + a.bookValue * a.ngfsWriteDown[si] / 100, 0));
                  });
                  return obj;
                }).filter(Boolean)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`$${v}M`, 'VaR']} />
                  <Legend />
                  {NGFS_SCENARIOS.map((sc, si) => <Bar key={sc} dataKey={sc} fill={COLORS[si]} stackId="a" />)}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: 18, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Country Risk Profile — Top 10 Countries by Total Book Value</div>
              <ResponsiveContainer width="100%" height={180}>
                <ComposedChart data={COUNTRIES.map(c => {
                  const ents = ASSETS.filter(a => a.country === c);
                  return { country: c, bookValM: ents.reduce((s, a) => s + a.bookValue, 0), avgRisk: ents.length ? Math.round(ents.reduce((s, a) => s + a.strandingRisk, 0) / ents.length) : 0, count: ents.length };
                }).filter(d => d.count > 0).sort((a, b) => b.bookValM - a.bookValM).slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="bookValM" name="Book Val ($M)" fill={T.navy} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="avgRisk" name="Avg Strand Risk" stroke={T.red} strokeWidth={2} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
