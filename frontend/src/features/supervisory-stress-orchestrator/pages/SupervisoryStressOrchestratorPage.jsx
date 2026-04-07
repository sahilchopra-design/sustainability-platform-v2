import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const INST_TYPES = ['Commercial Bank','Investment Bank','Universal Bank','Regional Bank','Insurance Group','Asset Manager'];
const JURISDICTIONS = ['EU','UK','US','Canada','Australia','Japan','Singapore','Switzerland'];
const REGULATORS = [
  { id: 0, name: 'ECB 2024',    threshold: 8.0, adverseMult: 1.45, creditLossRate: 0.028, niiImpact: -0.15, opRiskAddon: 0.006, scenarios: 3, color: T.indigo },
  { id: 1, name: 'PRA Explor.', threshold: 10.0, adverseMult: 1.55, creditLossRate: 0.032, niiImpact: -0.18, opRiskAddon: 0.007, scenarios: 3, color: T.blue },
  { id: 2, name: 'OSFI B-15',   threshold: 9.0, adverseMult: 1.40, creditLossRate: 0.025, niiImpact: -0.12, opRiskAddon: 0.005, scenarios: 3, color: T.teal },
  { id: 3, name: 'FED Pilot',   threshold: 7.0, adverseMult: 1.35, creditLossRate: 0.022, niiImpact: -0.10, opRiskAddon: 0.004, scenarios: 2, color: T.green },
  { id: 4, name: 'APRA CPG229', threshold: 8.0, adverseMult: 1.42, creditLossRate: 0.027, niiImpact: -0.14, opRiskAddon: 0.006, scenarios: 3, color: T.amber },
  { id: 5, name: 'MAS',         threshold: 8.0, adverseMult: 1.38, creditLossRate: 0.023, niiImpact: -0.11, opRiskAddon: 0.005, scenarios: 2, color: T.orange },
];

const INST_NAMES = [
  'Barclays PLC','Deutsche Bank','HSBC Group','BNP Paribas','ING Group','UniCredit','Santander','Rabobank',
  'Nordea Bank','Commerzbank','ABN AMRO','Société Gen','Credit Agri','Natixis SA','Erste Group','RBI Group',
  'JPMorgan Chase','Bank America','Wells Fargo','Citigroup','Goldman Sachs','Morgan Stanley','US Bancorp','PNC Fin',
  'Truist Fin','KeyCorp','Regions Fin','Comerica','Zions Banco','East West','SVB Capital','First Repub',
  'Royal Bank CA','TD Financial','Bank Montreal','CIBC Group','Scotiabank','Laurentian','National CA','CWB Fin',
  'Commonwealth','ANZ Banking','Westpac','NAB Group','Bendigo Bank','Bank Qld','Suncorp','Macquarie',
  'MUFG Bank','Mizuho Fin','SMFG Hold','Nomura Hold','Daiwa Sec','Resona Hold','Sumitomo','Japan Post',
  'DBS Group','OCBC Bank','UOB Ltd','Standard Chart','UBS Group','Credit Suisse','Zurich Ins','Swiss Life',
  'Allianz SE','Munich Re','Aviva Group','Legal & Gen','Aegon NV','Mapfre SA','Intesa SP','Mediobanca',
  'BPCE Group','Crédit Mut','La Banque PG','Groupama','Generali','Mapfre RE','Axa Group','Predica',
];

const INSTITUTIONS = INST_NAMES.map((name, i) => {
  const type = INST_TYPES[Math.floor(sr(i * 7) * INST_TYPES.length)];
  const jurisdiction = JURISDICTIONS[Math.floor(sr(i * 11) * JURISDICTIONS.length)];
  const totalAssets = 20 + sr(i * 13) * 980;
  const regulatoryCapital = 0.08 + sr(i * 17) * 0.08;
  const climateExposurePct = 0.05 + sr(i * 19) * 0.40;
  const physRisk = 15 + sr(i * 23) * 75;
  const transRisk = 10 + sr(i * 29) * 80;
  const materialityScore = 30 + sr(i * 31) * 70;
  const templateCompletionPct = 40 + sr(i * 37) * 60;
  const dataQualityScore = 0.50 + sr(i * 41) * 0.50;
  const managementActionCapacity = 0.1 + sr(i * 43) * 0.4;
  const stressedLCR = 0.85 + sr(i * 47) * 0.50;
  const stressedNSFR = 0.90 + sr(i * 53) * 0.35;
  const lastSubmission = `2024-0${1 + Math.floor(sr(i * 59) * 9)}-${10 + Math.floor(sr(i * 61) * 18)}`;
  const nextDeadline = `2025-0${1 + Math.floor(sr(i * 67) * 8)}-30`;
  const submissionStatus = {};
  REGULATORS.forEach((r, ri) => {
    const v = sr(i * 71 + ri * 13);
    submissionStatus[r.name] = v > 0.7 ? 'Submitted' : v > 0.4 ? 'In Progress' : 'Not Started';
  });
  return {
    id: i, name, type, jurisdiction, totalAssets, regulatoryCapital,
    climateExposurePct, physRisk, transRisk, materialityScore,
    templateCompletionPct, dataQualityScore, managementActionCapacity,
    stressedLCR, stressedNSFR, lastSubmission, nextDeadline, submissionStatus,
  };
});

function computeStress(inst, regulator) {
  const stressedCapital = inst.regulatoryCapital - regulator.adverseMult * regulator.creditLossRate * inst.climateExposurePct;
  const shortfall = Math.max(0, regulator.threshold / 100 - stressedCapital);
  const managementUplift = inst.managementActionCapacity * 0.02;
  const capitalAfterActions = stressedCapital + managementUplift;
  const submissionScore = inst.templateCompletionPct / 100 * inst.dataQualityScore;
  return { stressedCapital, shortfall, managementUplift, capitalAfterActions, submissionScore };
}

const KpiCard = ({ label, value, color = T.text, sub = '' }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const TABS = ['Orchestration Dashboard','Institution Database','Scenario Calibration','Stress Results','Submission Tracker','Cross-Regulator Analysis','Summary & Export'];

export default function SupervisoryStressOrchestratorPage() {
  const [tab, setTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [jurisFilter, setJurisFilter] = useState('All');
  const [regulatorFilter, setRegulatorFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [assetMin, setAssetMin] = useState(0);
  const [dqMin, setDqMin] = useState(0);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('totalAssets');
  const [sortDir, setSortDir] = useState(-1);
  const [selectedId, setSelectedId] = useState(null);
  const [compareRegA, setCompareRegA] = useState(0);
  const [compareRegB, setCompareRegB] = useState(1);

  const activeReg = REGULATORS.find(r => r.name === regulatorFilter) || REGULATORS[0];

  const enriched = useMemo(() => INSTITUTIONS.map(inst => {
    const results = {};
    REGULATORS.forEach(r => { results[r.name] = computeStress(inst, r); });
    const activeResult = results[activeReg.name];
    return { ...inst, ...activeResult, regResults: results };
  }), [regulatorFilter]);

  const filtered = useMemo(() => {
    let d = enriched;
    if (typeFilter !== 'All') d = d.filter(x => x.type === typeFilter);
    if (jurisFilter !== 'All') d = d.filter(x => x.jurisdiction === jurisFilter);
    if (statusFilter !== 'All') d = d.filter(x => x.submissionStatus[activeReg.name] === statusFilter);
    d = d.filter(x => x.totalAssets >= assetMin);
    d = d.filter(x => x.dataQualityScore >= dqMin / 100);
    if (search) d = d.filter(x => x.name.toLowerCase().includes(search.toLowerCase()) || x.jurisdiction.toLowerCase().includes(search.toLowerCase()));
    return [...d].sort((a, b) => sortDir * ((a[sortCol] || 0) - (b[sortCol] || 0)));
  }, [enriched, typeFilter, jurisFilter, regulatorFilter, statusFilter, assetMin, dqMin, search, sortCol, sortDir, activeReg]);

  const avgStressedCapital = useMemo(() => filtered.length ? filtered.reduce((s, x) => s + x.stressedCapital, 0) / filtered.length : 0, [filtered]);
  const totalShortfall = useMemo(() => filtered.reduce((s, x) => s + x.shortfall, 0), [filtered]);
  const avgSubmissionScore = useMemo(() => filtered.length ? filtered.reduce((s, x) => s + x.submissionScore, 0) / filtered.length : 0, [filtered]);
  const submittedCount = useMemo(() => filtered.filter(x => x.submissionStatus[activeReg.name] === 'Submitted').length, [filtered, activeReg]);

  const completionByReg = useMemo(() => REGULATORS.map(r => {
    const submitted = INSTITUTIONS.filter(x => x.submissionStatus[r.name] === 'Submitted').length;
    const inProgress = INSTITUTIONS.filter(x => x.submissionStatus[r.name] === 'In Progress').length;
    return { reg: r.name, submitted, inProgress, notStarted: INSTITUTIONS.length - submitted - inProgress, total: INSTITUTIONS.length };
  }), []);

  const calibrationData = useMemo(() => REGULATORS.map(r => ({
    regulator: r.name, adverseMult: r.adverseMult, creditLossRate: +(r.creditLossRate * 100).toFixed(2), niiImpact: +(Math.abs(r.niiImpact) * 100).toFixed(1), opRiskAddon: +(r.opRiskAddon * 100).toFixed(2), threshold: r.threshold,
  })), []);

  const stressResults = useMemo(() => filtered.slice(0, 40).map(x => {
    const res = x.regResults[activeReg.name];
    return { name: x.name.split(' ')[0], stressed: +(res.stressedCapital * 100).toFixed(2), afterActions: +(res.capitalAfterActions * 100).toFixed(2), shortfall: +(res.shortfall * 100).toFixed(3) };
  }), [filtered, activeReg]);

  const crossRegData = useMemo(() => filtered.slice(0, 20).map(x => ({
    name: x.name.split(' ')[0],
    [REGULATORS[compareRegA].name]: +(x.regResults[REGULATORS[compareRegA].name].stressedCapital * 100).toFixed(2),
    [REGULATORS[compareRegB].name]: +(x.regResults[REGULATORS[compareRegB].name].stressedCapital * 100).toFixed(2),
  })), [filtered, compareRegA, compareRegB]);

  const selectedInst = useMemo(() => selectedId != null ? enriched.find(x => x.id === selectedId) : null, [enriched, selectedId]);

  const handleSort = useCallback((col) => {
    if (sortCol === col) setSortDir(d => -d);
    else { setSortCol(col); setSortDir(-1); }
  }, [sortCol]);

  const filterRow = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, padding: '12px 16px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, alignItems: 'center' }}>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search institutions..." style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, width: 150 }} />
      <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
        <option>All</option>{INST_TYPES.map(t => <option key={t}>{t}</option>)}
      </select>
      <select value={jurisFilter} onChange={e => setJurisFilter(e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
        <option>All</option>{JURISDICTIONS.map(j => <option key={j}>{j}</option>)}
      </select>
      <select value={regulatorFilter} onChange={e => setRegulatorFilter(e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
        <option>All</option>{REGULATORS.map(r => <option key={r.name}>{r.name}</option>)}
      </select>
      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
        <option>All</option><option>Submitted</option><option>In Progress</option><option>Not Started</option>
      </select>
      <label style={{ fontSize: 12 }}>Assets≥${assetMin}B
        <input type="range" min={0} max={500} value={assetMin} onChange={e => setAssetMin(+e.target.value)} style={{ marginLeft: 6, width: 70 }} />
      </label>
      <label style={{ fontSize: 12 }}>DQ≥{dqMin}%
        <input type="range" min={0} max={90} value={dqMin} onChange={e => setDqMin(+e.target.value)} style={{ marginLeft: 6, width: 70 }} />
      </label>
    </div>
  );

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>EP-DB3 · Sprint DB · Enterprise Climate Risk Capital</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '4px 0 2px', color: T.navy }}>Supervisory Stress Test Orchestrator</h1>
        <div style={{ fontSize: 13, color: T.muted }}>80 institutions · 6 regulators · Multi-framework stress calibration · Submission tracking</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Avg Stressed Capital" value={`${(avgStressedCapital * 100).toFixed(2)}%`} color={T.indigo} sub={`Active: ${regulatorFilter}`} />
        <KpiCard label="Total Shortfall" value={`${(totalShortfall * 100).toFixed(2)}%`} color={totalShortfall > 0 ? T.red : T.green} sub={`${filtered.filter(x => x.shortfall > 0).length} breaches`} />
        <KpiCard label="Avg Submission Score" value={`${(avgSubmissionScore * 100).toFixed(1)}%`} color={T.amber} sub="completion × quality" />
        <KpiCard label="Submitted" value={`${submittedCount}/${filtered.length}`} color={T.teal} sub={`${filtered.length > 0 ? (submittedCount/filtered.length*100).toFixed(0) : 0}% complete`} />
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 24 }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === i ? 700 : 400, color: tab === i ? T.indigo : T.muted, borderBottom: tab === i ? `2px solid ${T.indigo}` : '2px solid transparent', marginBottom: -2, whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          {filterRow}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Completion Rate by Regulator</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={completionByReg}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="reg" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="submitted" stackId="a" fill={T.green} name="Submitted" />
                  <Bar dataKey="inProgress" stackId="a" fill={T.amber} name="In Progress" />
                  <Bar dataKey="notStarted" stackId="a" fill={T.red} name="Not Started" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Regulator Summary Cards</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {REGULATORS.map(r => {
                  const count = INSTITUTIONS.filter(x => x.submissionStatus[r.name] === 'Submitted').length;
                  return (
                    <div key={r.name} style={{ padding: '10px 12px', background: T.sub, borderRadius: 8, borderLeft: `3px solid ${r.color}` }}>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>Threshold: {r.threshold}% | {r.scenarios} scenarios</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>Submitted: <strong style={{ color: T.green }}>{count}/{INSTITUTIONS.length}</strong></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Stressed Capital by Institution — Top 30 (Active Regulator: {regulatorFilter !== 'All' ? regulatorFilter : 'All'})</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={filtered.slice(0, 30).map(x => ({ name: x.name.split(' ')[0], stressed: +(x.stressedCapital * 100).toFixed(2), afterActions: +(x.capitalAfterActions * 100).toFixed(2) }))} margin={{ bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={v => `${Number(v).toFixed(2)}%`} />
                <Legend />
                <Bar dataKey="stressed" fill={T.indigo} name="Stressed Capital%" radius={[2,2,0,0]} />
                <Bar dataKey="afterActions" fill={T.green} name="After Management Actions%" radius={[2,2,0,0]} />
                <ReferenceLine y={activeReg.threshold} stroke={T.red} strokeDasharray="4 2" label={{ value: `${activeReg.threshold}% threshold`, fontSize: 10, fill: T.red }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          {filterRow}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'auto', maxHeight: 600 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead style={{ position: 'sticky', top: 0 }}>
                <tr style={{ background: T.sub }}>
                  {[['Name','name'],['Type','type'],['Juris','jurisdiction'],['Assets($B)','totalAssets'],['RegCap%','regulatoryCapital'],['ClimExp%','climateExposurePct'],['StressedCap%','stressedCapital'],['Shortfall','shortfall'],['DQ Score','dataQualityScore'],['Template%','templateCompletionPct'],['Mgmt Uplift','managementUplift'],['LCR','stressedLCR']].map(([h,k]) => (
                    <th key={k} onClick={() => handleSort(k)} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: sortCol === k ? T.indigo : T.muted, borderBottom: `1px solid ${T.border}`, cursor: 'pointer', whiteSpace: 'nowrap' }}>{h}{sortCol === k ? (sortDir > 0 ? ' ↑' : ' ↓') : ''}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((x, i) => (
                  <tr key={x.id} onClick={() => setSelectedId(x.id)} style={{ background: x.id === selectedId ? '#eef2ff' : i % 2 === 0 ? T.card : T.sub, cursor: 'pointer', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 10px', fontWeight: 500 }}>{x.name}</td>
                    <td style={{ padding: '6px 10px', color: T.muted, fontSize: 11 }}>{x.type.split(' ')[0]}</td>
                    <td style={{ padding: '6px 10px' }}>{x.jurisdiction}</td>
                    <td style={{ padding: '6px 10px' }}>{x.totalAssets.toFixed(0)}</td>
                    <td style={{ padding: '6px 10px' }}>{(x.regulatoryCapital * 100).toFixed(2)}%</td>
                    <td style={{ padding: '6px 10px', color: x.climateExposurePct > 0.25 ? T.red : T.text }}>{(x.climateExposurePct * 100).toFixed(1)}%</td>
                    <td style={{ padding: '6px 10px', color: x.stressedCapital * 100 < activeReg.threshold ? T.red : T.green, fontWeight: 600 }}>{(x.stressedCapital * 100).toFixed(2)}%</td>
                    <td style={{ padding: '6px 10px', color: x.shortfall > 0 ? T.red : T.green }}>{x.shortfall > 0 ? `${(x.shortfall * 100).toFixed(3)}%` : '—'}</td>
                    <td style={{ padding: '6px 10px', color: x.dataQualityScore < 0.6 ? T.amber : T.green }}>{(x.dataQualityScore * 100).toFixed(0)}%</td>
                    <td style={{ padding: '6px 10px' }}>{x.templateCompletionPct.toFixed(0)}%</td>
                    <td style={{ padding: '6px 10px', color: T.green }}>{(x.managementUplift * 100).toFixed(2)}%</td>
                    <td style={{ padding: '6px 10px', color: x.stressedLCR < 1.0 ? T.red : T.green }}>{x.stressedLCR.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: T.muted }}>{filtered.length} institutions · Click to select for drill-down</div>
          {selectedInst && (
            <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12, color: T.indigo }}>{selectedInst.name} — Multi-Regulator Detail</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
                {REGULATORS.map(r => {
                  const res = selectedInst.regResults[r.name];
                  return (
                    <div key={r.name} style={{ padding: '10px 12px', background: T.sub, borderRadius: 8, borderTop: `3px solid ${r.color}` }}>
                      <div style={{ fontWeight: 600, fontSize: 11 }}>{r.name}</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>Stressed: <strong style={{ color: res.stressedCapital * 100 < r.threshold ? T.red : T.green }}>{(res.stressedCapital * 100).toFixed(2)}%</strong></div>
                      <div style={{ fontSize: 11, color: T.muted }}>Threshold: {r.threshold}%</div>
                      <div style={{ fontSize: 11, color: res.shortfall > 0 ? T.red : T.green }}>Shortfall: {res.shortfall > 0 ? `${(res.shortfall * 100).toFixed(3)}%` : 'None'}</div>
                      <div style={{ fontSize: 11, marginTop: 4 }}>Status: <span style={{ color: selectedInst.submissionStatus[r.name] === 'Submitted' ? T.green : selectedInst.submissionStatus[r.name] === 'In Progress' ? T.amber : T.red }}>{selectedInst.submissionStatus[r.name]}</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Adverse Multiplier × 6 Regulators</div>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={calibrationData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="regulator" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="adverseMult" fill={T.indigo} name="Adverse Multiplier" radius={[2,2,0,0]} />
                <Bar yAxisId="right" dataKey="creditLossRate" fill={T.red} name="Credit Loss Rate%" radius={[2,2,0,0]} />
                <Line yAxisId="right" type="monotone" dataKey="threshold" stroke={T.amber} strokeWidth={2} dot={{ r: 4 }} name="Min Capital Threshold%" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Regulator Calibration Parameter Table</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Regulator','Threshold%','Adverse Mult','Credit Loss Rate%','NII Impact%','Op Risk Add-On%','Scenarios','Framework'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REGULATORS.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '7px 10px', fontWeight: 600, color: r.color }}>{r.name}</td>
                    <td style={{ padding: '7px 10px' }}>{r.threshold}%</td>
                    <td style={{ padding: '7px 10px' }}>{r.adverseMult}×</td>
                    <td style={{ padding: '7px 10px', color: T.red }}>{(r.creditLossRate * 100).toFixed(1)}%</td>
                    <td style={{ padding: '7px 10px', color: T.amber }}>{(Math.abs(r.niiImpact) * 100).toFixed(0)}%</td>
                    <td style={{ padding: '7px 10px' }}>{(r.opRiskAddon * 100).toFixed(2)}%</td>
                    <td style={{ padding: '7px 10px', textAlign: 'center' }}>{r.scenarios}</td>
                    <td style={{ padding: '7px 10px', color: T.muted }}>{{ 'ECB 2024':'CRR2/EBA', 'PRA Explor.':'PRA SS3/19', 'OSFI B-15':'OSFI B-15', 'FED Pilot':'FRB Pilot', 'APRA CPG229':'APRA CPG229', 'MAS':'MAS Notice' }[r.name]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          {filterRow}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Stressed Capital vs After Management Actions — {regulatorFilter !== 'All' ? regulatorFilter : 'ECB 2024'} (Top 40)</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stressResults} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={v => `${Number(v).toFixed(2)}%`} />
                <Legend />
                <Bar dataKey="stressed" fill={T.indigo} name="Stressed Capital%" radius={[2,2,0,0]} />
                <Bar dataKey="afterActions" fill={T.green} name="After Actions%" radius={[2,2,0,0]} />
                <ReferenceLine y={activeReg.threshold} stroke={T.red} strokeDasharray="4 2" label={{ value: `${activeReg.threshold}%`, fontSize: 10, fill: T.red }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Capital Shortfall Table — Institutions at Risk</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>{['Institution','Type','Juris','Reg Capital%','Stressed%','After Actions%','Shortfall%','Mgmt Uplift%','Status'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.filter(x => x.shortfall > 0).map((x, i) => (
                  <tr key={i} style={{ background: '#fef2f2' }}>
                    <td style={{ padding: '7px 10px', fontWeight: 600 }}>{x.name}</td>
                    <td style={{ padding: '7px 10px', color: T.muted }}>{x.type.split(' ')[0]}</td>
                    <td style={{ padding: '7px 10px' }}>{x.jurisdiction}</td>
                    <td style={{ padding: '7px 10px' }}>{(x.regulatoryCapital * 100).toFixed(2)}%</td>
                    <td style={{ padding: '7px 10px', color: T.red, fontWeight: 600 }}>{(x.stressedCapital * 100).toFixed(2)}%</td>
                    <td style={{ padding: '7px 10px', color: x.capitalAfterActions * 100 >= activeReg.threshold ? T.green : T.red }}>{(x.capitalAfterActions * 100).toFixed(2)}%</td>
                    <td style={{ padding: '7px 10px', color: T.red, fontWeight: 600 }}>{(x.shortfall * 100).toFixed(3)}%</td>
                    <td style={{ padding: '7px 10px', color: T.green }}>{(x.managementUplift * 100).toFixed(2)}%</td>
                    <td style={{ padding: '7px 10px' }}><span style={{ background: '#fef2f2', color: T.red, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>BREACH</span></td>
                  </tr>
                ))}
                {filtered.filter(x => x.shortfall > 0).length === 0 && (
                  <tr><td colSpan={9} style={{ padding: 20, textAlign: 'center', color: T.green, fontWeight: 600 }}>All institutions above threshold — no breaches detected</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          {filterRow}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Submission Completion % by Regulator — Top 40 Institutions</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filtered.slice(0, 40).map(x => {
                const row = { name: x.name.split(' ')[0] };
                REGULATORS.forEach(r => { row[r.name] = x.submissionStatus[r.name] === 'Submitted' ? 100 : x.submissionStatus[r.name] === 'In Progress' ? 50 : 0; });
                return row;
              })} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <Tooltip />
                <Legend />
                {REGULATORS.map(r => <Bar key={r.name} dataKey={r.name} fill={r.color} name={r.name} radius={[1,1,0,0]} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Submission Status Matrix — All Institutions × Regulators</div>
            <div style={{ overflowX: 'auto', maxHeight: 400 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead style={{ position: 'sticky', top: 0 }}>
                  <tr style={{ background: T.sub }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Institution</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Type</th>
                    {REGULATORS.map(r => <th key={r.name} style={{ padding: '6px 10px', textAlign: 'center', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{r.name}</th>)}
                    <th style={{ padding: '6px 10px', textAlign: 'center', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Next Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((x, i) => (
                    <tr key={x.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '5px 10px', fontWeight: 500 }}>{x.name}</td>
                      <td style={{ padding: '5px 10px', color: T.muted, fontSize: 10 }}>{x.type.split(' ')[0]}</td>
                      {REGULATORS.map(r => {
                        const s = x.submissionStatus[r.name];
                        return <td key={r.name} style={{ padding: '5px 10px', textAlign: 'center' }}><span style={{ background: s === 'Submitted' ? '#f0fdf4' : s === 'In Progress' ? '#fffbeb' : '#fef2f2', color: s === 'Submitted' ? T.green : s === 'In Progress' ? T.amber : T.red, padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{s === 'Submitted' ? 'SUB' : s === 'In Progress' ? 'WIP' : 'N/A'}</span></td>;
                      })}
                      <td style={{ padding: '5px 10px', textAlign: 'center', color: T.muted, fontSize: 10 }}>{x.nextDeadline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Compare:</span>
            <select value={compareRegA} onChange={e => setCompareRegA(+e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
              {REGULATORS.map((r, i) => <option key={i} value={i}>{r.name}</option>)}
            </select>
            <span style={{ color: T.muted }}>vs</span>
            <select value={compareRegB} onChange={e => setCompareRegB(+e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
              {REGULATORS.map((r, i) => <option key={i} value={i}>{r.name}</option>)}
            </select>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Stressed Capital: {REGULATORS[compareRegA].name} vs {REGULATORS[compareRegB].name} — Top 20</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={crossRegData} margin={{ bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={45} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={v => `${Number(v).toFixed(2)}%`} />
                <Legend />
                <Bar dataKey={REGULATORS[compareRegA].name} fill={REGULATORS[compareRegA].color} radius={[2,2,0,0]} />
                <Bar dataKey={REGULATORS[compareRegB].name} fill={REGULATORS[compareRegB].color} radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Cross-Regulator Stress Outcome Correlation</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  <th style={{ padding: '7px 10px', borderBottom: `1px solid ${T.border}`, color: T.muted }}>Regulator A</th>
                  <th style={{ padding: '7px 10px', borderBottom: `1px solid ${T.border}`, color: T.muted }}>Regulator B</th>
                  <th style={{ padding: '7px 10px', borderBottom: `1px solid ${T.border}`, color: T.muted }}>Avg Diff (ppts)</th>
                  <th style={{ padding: '7px 10px', borderBottom: `1px solid ${T.border}`, color: T.muted }}>Correlation (proxy)</th>
                  <th style={{ padding: '7px 10px', borderBottom: `1px solid ${T.border}`, color: T.muted }}>Framework Overlap</th>
                </tr>
              </thead>
              <tbody>
                {REGULATORS.flatMap((ra, ai) => REGULATORS.slice(ai + 1).map((rb, bi) => {
                  const diff = INSTITUTIONS.length ? INSTITUTIONS.reduce((s, inst) => {
                    const ra_res = computeStress(inst, ra);
                    const rb_res = computeStress(inst, rb);
                    return s + Math.abs(ra_res.stressedCapital - rb_res.stressedCapital);
                  }, 0) / INSTITUTIONS.length : 0;
                  const corr = 0.60 + sr(ai * 13 + bi * 7) * 0.35;
                  return (
                    <tr key={`${ra.name}-${rb.name}`} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '6px 10px' }}>{ra.name}</td>
                      <td style={{ padding: '6px 10px' }}>{rb.name}</td>
                      <td style={{ padding: '6px 10px', color: T.amber }}>{(diff * 100).toFixed(2)} ppts</td>
                      <td style={{ padding: '6px 10px', color: corr > 0.80 ? T.green : T.muted }}>{corr.toFixed(2)}</td>
                      <td style={{ padding: '6px 10px', color: T.muted }}>{corr > 0.85 ? 'High' : corr > 0.70 ? 'Moderate' : 'Low'}</td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
            <KpiCard label="Avg Stressed Capital" value={`${(avgStressedCapital * 100).toFixed(2)}%`} color={T.indigo} />
            <KpiCard label="Total Shortfall" value={`${(totalShortfall * 100).toFixed(2)}%`} color={totalShortfall > 0 ? T.red : T.green} />
            <KpiCard label="Avg Submission Score" value={`${(avgSubmissionScore * 100).toFixed(1)}%`} color={T.amber} />
            <KpiCard label="Submitted Count" value={`${submittedCount}/${filtered.length}`} color={T.green} />
            <KpiCard label="Institutions Filtered" value={`${filtered.length}`} color={T.navy} />
            <KpiCard label="Active Regulator" value={regulatorFilter !== 'All' ? regulatorFilter : 'All'} color={T.teal} />
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Full Institution Stress Export — {filtered.length} institutions</div>
            <div style={{ overflowX: 'auto', maxHeight: 500 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead style={{ position: 'sticky', top: 0 }}>
                  <tr style={{ background: T.sub }}>
                    {['Institution','Type','Juris','Assets($B)','RegCap%','ClimExp%','Stressed%','Shortfall','MgmtUplift','DQ%','Template%','LCR','NSFR','ECB','PRA','OSFI','FED','APRA','MAS'].map(h => (
                      <th key={h} style={{ padding: '5px 7px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap', fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((x, i) => (
                    <tr key={x.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '4px 7px', fontWeight: 500 }}>{x.name}</td>
                      <td style={{ padding: '4px 7px', color: T.muted }}>{x.type.split(' ')[0]}</td>
                      <td style={{ padding: '4px 7px' }}>{x.jurisdiction}</td>
                      <td style={{ padding: '4px 7px' }}>{x.totalAssets.toFixed(0)}</td>
                      <td style={{ padding: '4px 7px' }}>{(x.regulatoryCapital * 100).toFixed(2)}%</td>
                      <td style={{ padding: '4px 7px' }}>{(x.climateExposurePct * 100).toFixed(1)}%</td>
                      <td style={{ padding: '4px 7px', color: x.stressedCapital * 100 < activeReg.threshold ? T.red : T.green, fontWeight: 600 }}>{(x.stressedCapital * 100).toFixed(2)}%</td>
                      <td style={{ padding: '4px 7px', color: x.shortfall > 0 ? T.red : T.green }}>{x.shortfall > 0 ? `${(x.shortfall * 100).toFixed(3)}%` : '—'}</td>
                      <td style={{ padding: '4px 7px', color: T.green }}>{(x.managementUplift * 100).toFixed(2)}%</td>
                      <td style={{ padding: '4px 7px' }}>{(x.dataQualityScore * 100).toFixed(0)}%</td>
                      <td style={{ padding: '4px 7px' }}>{x.templateCompletionPct.toFixed(0)}%</td>
                      <td style={{ padding: '4px 7px', color: x.stressedLCR < 1.0 ? T.red : T.green }}>{x.stressedLCR.toFixed(2)}</td>
                      <td style={{ padding: '4px 7px', color: x.stressedNSFR < 1.0 ? T.red : T.green }}>{x.stressedNSFR.toFixed(2)}</td>
                      {REGULATORS.map(r => <td key={r.name} style={{ padding: '4px 7px' }}><span style={{ fontSize: 10, fontWeight: 600, color: x.submissionStatus[r.name] === 'Submitted' ? T.green : x.submissionStatus[r.name] === 'In Progress' ? T.amber : T.red }}>{x.submissionStatus[r.name] === 'Submitted' ? 'S' : x.submissionStatus[r.name] === 'In Progress' ? 'W' : 'N'}</span></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ marginTop: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Aggregate Stress Portfolio Analytics — All 80 Institutions</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
              {[
                ['Total Assets (All)', `$${(INSTITUTIONS.reduce((s,x)=>s+x.totalAssets,0)/1000).toFixed(0)}T`, T.navy],
                ['Avg Regulatory Capital', `${(INSTITUTIONS.reduce((s,x)=>s+x.regulatoryCapital*100,0)/INSTITUTIONS.length).toFixed(2)}%`, T.indigo],
                ['Avg Data Quality', `${(INSTITUTIONS.reduce((s,x)=>s+x.dataQualityScore*100,0)/INSTITUTIONS.length).toFixed(1)}%`, T.amber],
                ['Avg Template Completion', `${(INSTITUTIONS.reduce((s,x)=>s+x.templateCompletionPct,0)/INSTITUTIONS.length).toFixed(1)}%`, T.teal],
              ].map(([l,v,c])=>(
                <div key={l} style={{ padding:'10px 14px',background:T.sub,borderRadius:8 }}>
                  <div style={{ fontSize:10,color:T.muted }}>{l}</div>
                  <div style={{ fontSize:18,fontWeight:700,color:c }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontWeight:600,fontSize:13,marginBottom:8 }}>Stressed Capital by Institution Type — All Regulators</div>
                <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                  <thead><tr style={{ background:T.sub }}>{['Type','Count','Avg Stressed Cap%','Avg Shortfall','Submitted%'].map(h=><th key={h} style={{ padding:'5px 8px',textAlign:'left',color:T.muted,fontWeight:600,borderBottom:`1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {INST_TYPES.map((type,ti)=>{
                      const sub=filtered.filter(x=>x.type===type);
                      if(!sub.length) return null;
                      const avgStress=sub.reduce((s,x)=>s+x.stressedCapital*100,0)/sub.length;
                      const avgSF=sub.reduce((s,x)=>s+x.shortfall*100,0)/sub.length;
                      const subPct=sub.filter(x=>x.submissionStatus[activeReg.name]==='Submitted').length/sub.length*100;
                      return (
                        <tr key={ti} style={{ background:ti%2===0?T.card:T.sub }}>
                          <td style={{ padding:'5px 8px',fontWeight:500 }}>{type.split(' ')[0]}</td>
                          <td style={{ padding:'5px 8px' }}>{sub.length}</td>
                          <td style={{ padding:'5px 8px',color:avgStress*100<activeReg.threshold?T.red:T.green,fontWeight:600 }}>{avgStress.toFixed(2)}%</td>
                          <td style={{ padding:'5px 8px',color:avgSF>0?T.red:T.green }}>{avgSF.toFixed(3)}%</td>
                          <td style={{ padding:'5px 8px',color:subPct>70?T.green:T.amber }}>{subPct.toFixed(0)}%</td>
                        </tr>
                      );
                    }).filter(Boolean)}
                  </tbody>
                </table>
              </div>
              <div>
                <div style={{ fontWeight:600,fontSize:13,marginBottom:8 }}>Jurisdiction Stress Summary — Active Regulator</div>
                <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                  <thead><tr style={{ background:T.sub }}>{['Jurisdiction','Institutions','Avg Stressed%','Breaches','Avg DQ%'].map(h=><th key={h} style={{ padding:'5px 8px',textAlign:'left',color:T.muted,fontWeight:600,borderBottom:`1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {JURISDICTIONS.map((j,ji)=>{
                      const sub=filtered.filter(x=>x.jurisdiction===j);
                      if(!sub.length) return null;
                      const avgStress=sub.reduce((s,x)=>s+x.stressedCapital*100,0)/sub.length;
                      const breaches=sub.filter(x=>x.shortfall>0).length;
                      const avgDQ=sub.reduce((s,x)=>s+x.dataQualityScore*100,0)/sub.length;
                      return (
                        <tr key={ji} style={{ background:ji%2===0?T.card:T.sub }}>
                          <td style={{ padding:'5px 8px',fontWeight:500 }}>{j}</td>
                          <td style={{ padding:'5px 8px' }}>{sub.length}</td>
                          <td style={{ padding:'5px 8px',color:avgStress<activeReg.threshold?T.red:T.green,fontWeight:600 }}>{avgStress.toFixed(2)}%</td>
                          <td style={{ padding:'5px 8px',color:breaches>0?T.red:T.green }}>{breaches}</td>
                          <td style={{ padding:'5px 8px',color:avgDQ<60?T.amber:T.green }}>{avgDQ.toFixed(0)}%</td>
                        </tr>
                      );
                    }).filter(Boolean)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Regulator Cross-Stress Matrix — All 6 Regulators × Avg Stressed Capital%</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:11 }}>
                <thead>
                  <tr style={{ background:T.sub }}>
                    <th style={{ padding:'6px 8px',textAlign:'left',color:T.muted,fontWeight:600,borderBottom:`1px solid ${T.border}` }}>Institution Type</th>
                    {REGULATORS.map(r=><th key={r.name} style={{ padding:'6px 8px',textAlign:'center',color:T.muted,fontWeight:600,borderBottom:`1px solid ${T.border}` }}>{r.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {INST_TYPES.map((type,ti)=>{
                    const sub=filtered.filter(x=>x.type===type);
                    if(!sub.length) return null;
                    return (
                      <tr key={ti} style={{ background:ti%2===0?T.card:T.sub }}>
                        <td style={{ padding:'5px 8px',fontWeight:500 }}>{type}</td>
                        {REGULATORS.map(r=>{
                          const stressed=sub.length?sub.reduce((s,x)=>{
                            const res=computeStress(x,r);
                            return s+res.stressedCapital*100;
                          },0)/sub.length:0;
                          const pass=stressed>=r.threshold;
                          return <td key={r.name} style={{ padding:'5px 8px',textAlign:'center',fontWeight:600,color:pass?T.green:T.red,background:pass?'transparent':'#fef2f2' }}>{stressed.toFixed(2)}%</td>;
                        })}
                      </tr>
                    );
                  }).filter(Boolean)}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop:10,fontSize:12,color:T.muted }}>Values are avg stressed capital% per type × regulator. Red = below regulator minimum threshold.</div>
          </div>
          <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Management Action Effectiveness Analysis</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontWeight:600,fontSize:13,marginBottom:8 }}>Capital Recovery via Management Actions — Top 20</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={filtered.slice(0,20).map(x=>({
                    name:x.name.split(' ')[0],
                    beforeActions:+(x.stressedCapital*100).toFixed(2),
                    actionUplift:+(x.managementUplift*100).toFixed(3),
                    afterActions:+(x.capitalAfterActions*100).toFixed(2),
                  }))} margin={{ bottom:50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize:9 }} angle={-45} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize:10 }} tickFormatter={v=>`${v}%`} />
                    <Tooltip formatter={v=>`${Number(v).toFixed(2)}%`} />
                    <Legend />
                    <Bar dataKey="beforeActions" fill={T.amber} name="Before Actions%" radius={[2,2,0,0]} />
                    <Bar dataKey="afterActions" fill={T.green} name="After Actions%" radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div style={{ fontWeight:600,fontSize:13,marginBottom:8 }}>Data Quality Distribution</div>
                {(() => {
                  const dqBands=[
                    {label:'50-60%',min:0.5,max:0.6},{label:'60-70%',min:0.6,max:0.7},
                    {label:'70-80%',min:0.7,max:0.8},{label:'80-90%',min:0.8,max:0.9},
                    {label:'90%+',min:0.9,max:1.1},
                  ];
                  const dqData=dqBands.map(b=>({
                    band:b.label,
                    count:filtered.filter(x=>x.dataQualityScore>=b.min&&x.dataQualityScore<b.max).length,
                  }));
                  return (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={dqData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="band" tick={{ fontSize:10 }} />
                        <YAxis tick={{ fontSize:10 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill={T.teal} name="Institutions" radius={[2,2,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
                <div style={{ marginTop:12 }}>
                  <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                    <thead><tr style={{ background:T.sub }}>{['Regulator','Avg Template%','Avg DQ%','Avg Submission Score'].map(h=><th key={h} style={{ padding:'5px 8px',textAlign:'left',color:T.muted,fontWeight:600,borderBottom:`1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {REGULATORS.map((r,ri)=>{
                        const avgTemplate=INSTITUTIONS.reduce((s,x)=>s+x.templateCompletionPct,0)/INSTITUTIONS.length;
                        const avgDQ=INSTITUTIONS.reduce((s,x)=>s+x.dataQualityScore*100,0)/INSTITUTIONS.length;
                        const avgScore=avgTemplate/100*avgDQ/100;
                        return (
                          <tr key={ri} style={{ background:ri%2===0?T.card:T.sub }}>
                            <td style={{ padding:'5px 8px',fontWeight:600,color:r.color }}>{r.name}</td>
                            <td style={{ padding:'5px 8px' }}>{avgTemplate.toFixed(1)}%</td>
                            <td style={{ padding:'5px 8px',color:avgDQ<60?T.amber:T.green }}>{avgDQ.toFixed(1)}%</td>
                            <td style={{ padding:'5px 8px',fontWeight:600,color:T.indigo }}>{(avgScore*100).toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Stressed LCR & NSFR by Institution Type — All Regulators</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={INST_TYPES.map(t=>{
                const sub=filtered.filter(x=>x.type===t);
                if(!sub.length) return null;
                return { type:t.split(' ')[0], avgLCR:+(sub.reduce((s,x)=>s+x.stressedLCR,0)/sub.length).toFixed(3), avgNSFR:+(sub.reduce((s,x)=>s+x.stressedNSFR,0)/sub.length).toFixed(3) };
              }).filter(Boolean)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="type" tick={{ fontSize:10 }} />
                <YAxis tick={{ fontSize:10 }} domain={[0.8,1.8]} />
                <Tooltip formatter={v=>Number(v).toFixed(3)} />
                <Legend />
                <Bar dataKey="avgLCR" fill={T.blue} name="Avg Stressed LCR" radius={[2,2,0,0]} />
                <Bar dataKey="avgNSFR" fill={T.teal} name="Avg Stressed NSFR" radius={[2,2,0,0]} />
                <ReferenceLine y={1.0} stroke={T.red} strokeDasharray="4 2" label={{ value:'Min 1.0',fontSize:9,fill:T.red }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Additional Deep-Dive: Cross-Regulator Sensitivity ── */}
      {activeTab === 'cross' && (
        <div style={{ display:'flex',flexDirection:'column',gap:16,marginTop:16 }}>
          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Regulator Threshold Breach Frequency — Institution Type × Regulator</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                <thead>
                  <tr style={{ background:T.sub }}>
                    <th style={{ padding:'6px 10px',textAlign:'left',color:T.muted }}>Type</th>
                    {REGULATORS.map(r=>(
                      <th key={r.name} style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>{r.name.split(' ')[0]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INST_TYPES.map((type,ti)=>{
                    const sub=filtered.filter(x=>x.type===type);
                    if(!sub.length) return null;
                    return (
                      <tr key={type} style={{ background:ti%2===0?T.card:T.sub }}>
                        <td style={{ padding:'5px 10px',fontWeight:600,fontSize:11 }}>{type.split(' ').slice(0,2).join(' ')}</td>
                        {REGULATORS.map(reg=>{
                          const breachPct=sub.length?sub.filter(inst=>computeStress(inst,reg).breachFlag).length/sub.length*100:0;
                          const clr=breachPct>50?T.red:breachPct>20?T.amber:T.green;
                          return <td key={reg.name} style={{ padding:'5px 8px',textAlign:'right',fontWeight:600,color:clr }}>{breachPct.toFixed(0)}%</td>;
                        })}
                      </tr>
                    );
                  }).filter(Boolean)}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Capital Adequacy Distribution — Stressed vs Pre-Stress</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={INST_TYPES.map(type=>{
                const sub=filtered.filter(x=>x.type===type);
                if(!sub.length) return null;
                const avgPre=sub.length?sub.reduce((s,x)=>s+x.regulatoryCapital,0)/sub.length:0;
                const avgPost=sub.length?sub.reduce((s,x)=>s+computeStress(x,selRegulator).stressedCapital,0)/sub.length:0;
                return { type:type.split(' ').slice(0,2).join(' '), pre:+(avgPre*100).toFixed(2), post:+(avgPost*100).toFixed(2) };
              }).filter(Boolean)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="type" tick={{ fontSize:9 }} />
                <YAxis tick={{ fontSize:10 }} tickFormatter={v=>`${v}%`} />
                <Tooltip formatter={v=>`${Number(v).toFixed(2)}%`} />
                <Legend />
                <Bar dataKey="pre" fill={T.green} name="Pre-Stress Capital%" radius={[2,2,0,0]} />
                <Bar dataKey="post" fill={T.red} name="Stressed Capital%" radius={[2,2,0,0]} />
                <ReferenceLine y={selRegulator.threshold} stroke={T.navy} strokeDasharray="5 3" label={{ value:`Min ${selRegulator.threshold}%`,fontSize:9,fill:T.navy }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Scenario Parameter Sensitivity — Capital Impact per Unit Change</div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8 }}>
              {[
                { label:'Adverse Multiplier +0.1', param:'adverseMult', delta:0.1 },
                { label:'Credit Loss Rate +1%', param:'creditLossRate', delta:0.01 },
                { label:'NII Impact +5%', param:'niiImpact', delta:0.05 },
                { label:'Op Risk Add-on +1%', param:'opRiskAddon', delta:0.01 },
              ].map(({ label, param, delta })=>{
                const base=filtered.length?filtered.reduce((s,x)=>s+computeStress(x,selRegulator).stressedCapital,0)/filtered.length:0;
                const shocked=filtered.length?filtered.reduce((s,x)=>s+computeStress(x,{ ...selRegulator,[param]:selRegulator[param]+delta }).stressedCapital,0)/filtered.length:0;
                const impact=(shocked-base)*100;
                return (
                  <div key={label} style={{ background:T.sub,borderRadius:6,padding:10,textAlign:'center' }}>
                    <div style={{ fontSize:10,color:T.muted,marginBottom:4 }}>{label}</div>
                    <div style={{ fontSize:16,fontWeight:700,color:impact<0?T.red:T.green }}>{impact>0?'+':''}{impact.toFixed(2)}pp</div>
                    <div style={{ fontSize:10,color:T.muted,marginTop:2 }}>Capital Δ</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Jurisdiction × Regulator Capital Erosion Matrix</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:11 }}>
                <thead>
                  <tr style={{ background:T.sub }}>
                    <th style={{ padding:'5px 8px',textAlign:'left',color:T.muted }}>Jurisdiction</th>
                    {REGULATORS.map(r=>(
                      <th key={r.name} style={{ padding:'5px 6px',textAlign:'right',color:T.muted,fontSize:10 }}>{r.name.split(' ')[0]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {JURISDICTIONS.map((j,ji)=>{
                    const sub=filtered.filter(x=>x.jurisdiction===j);
                    if(!sub.length) return null;
                    return (
                      <tr key={j} style={{ background:ji%2===0?T.card:T.sub }}>
                        <td style={{ padding:'4px 8px',fontWeight:600 }}>{j}</td>
                        {REGULATORS.map(reg=>{
                          const avgPre=sub.length?sub.reduce((s,x)=>s+x.regulatoryCapital,0)/sub.length:0;
                          const avgPost=sub.length?sub.reduce((s,x)=>s+computeStress(x,reg).stressedCapital,0)/sub.length:0;
                          const erosion=(avgPre-avgPost)*100;
                          return (
                            <td key={reg.name} style={{ padding:'4px 6px',textAlign:'right',color:erosion>2?T.red:erosion>0.5?T.amber:T.text }}>
                              {erosion.toFixed(1)}pp
                            </td>
                          );
                        })}
                      </tr>
                    );
                  }).filter(Boolean)}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Regulatory Capital Conservation Buffer Analysis</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                <thead>
                  <tr style={{ background:T.sub }}>
                    <th style={{ padding:'6px 10px',textAlign:'left',color:T.muted }}>Regulator</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Threshold</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Avg Pre-Stress</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Avg Post-Stress</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Buffer</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Breach Count</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Breach Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {REGULATORS.map((reg,ri)=>{
                    const avgPre=filtered.length?filtered.reduce((s,x)=>s+x.regulatoryCapital,0)/filtered.length:0;
                    const avgPost=filtered.length?filtered.reduce((s,x)=>s+computeStress(x,reg).stressedCapital,0)/filtered.length:0;
                    const buffer=avgPost-reg.threshold/100;
                    const breachCount=filtered.filter(x=>computeStress(x,reg).breachFlag).length;
                    const breachRate=filtered.length?breachCount/filtered.length*100:0;
                    return (
                      <tr key={reg.name} style={{ background:ri%2===0?T.card:T.sub }}>
                        <td style={{ padding:'5px 10px',fontWeight:600 }}>{reg.name}</td>
                        <td style={{ padding:'5px 8px',textAlign:'right' }}>{reg.threshold}%</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:T.green }}>{(avgPre*100).toFixed(2)}%</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:avgPost*100<reg.threshold?T.red:T.text }}>{(avgPost*100).toFixed(2)}%</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:buffer<0?T.red:buffer<0.01?T.amber:T.green,fontWeight:700 }}>{(buffer*100).toFixed(2)}pp</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:breachCount>0?T.red:T.green }}>{breachCount}</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',fontWeight:700,color:breachRate>30?T.red:breachRate>10?T.amber:T.green }}>{breachRate.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Top 10 At-Risk Institutions — Current Regulator</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                <thead>
                  <tr style={{ background:T.sub }}>
                    <th style={{ padding:'5px 8px',textAlign:'left',color:T.muted }}>Institution</th>
                    <th style={{ padding:'5px 8px',textAlign:'right',color:T.muted }}>Type</th>
                    <th style={{ padding:'5px 8px',textAlign:'right',color:T.muted }}>Pre-Stress</th>
                    <th style={{ padding:'5px 8px',textAlign:'right',color:T.muted }}>Post-Stress</th>
                    <th style={{ padding:'5px 8px',textAlign:'right',color:T.muted }}>Capital Loss</th>
                    <th style={{ padding:'5px 8px',textAlign:'right',color:T.muted }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...filtered].sort((a,b)=>{
                    const lossA=a.regulatoryCapital-computeStress(a,selRegulator).stressedCapital;
                    const lossB=b.regulatoryCapital-computeStress(b,selRegulator).stressedCapital;
                    return lossB-lossA;
                  }).slice(0,10).map((inst,ii)=>{
                    const stress=computeStress(inst,selRegulator);
                    const loss=(inst.regulatoryCapital-stress.stressedCapital)*100;
                    return (
                      <tr key={inst.name} style={{ background:ii%2===0?T.card:T.sub }}>
                        <td style={{ padding:'4px 8px',fontWeight:600,fontSize:11 }}>{inst.name}</td>
                        <td style={{ padding:'4px 8px',textAlign:'right',fontSize:10,color:T.muted }}>{inst.type.split(' ')[0]}</td>
                        <td style={{ padding:'4px 8px',textAlign:'right' }}>{(inst.regulatoryCapital*100).toFixed(2)}%</td>
                        <td style={{ padding:'4px 8px',textAlign:'right',color:stress.breachFlag?T.red:T.text }}>{(stress.stressedCapital*100).toFixed(2)}%</td>
                        <td style={{ padding:'4px 8px',textAlign:'right',color:T.red,fontWeight:600 }}>-{loss.toFixed(2)}pp</td>
                        <td style={{ padding:'4px 8px',textAlign:'right' }}><span style={{ padding:'2px 6px',borderRadius:4,background:stress.breachFlag?`${T.red}20`:T.sub,color:stress.breachFlag?T.red:T.green,fontSize:10,fontWeight:600 }}>{stress.breachFlag?'BREACH':'OK'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:10 }}>Climate Exposure Percentile Bands — Stress Loss Distribution</div>
            <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
              {['0–20%','20–40%','40–60%','60–80%','80–100%'].map((band,bi)=>{
                const sorted=[...filtered].sort((a,b)=>a.climateExposurePct-b.climateExposurePct);
                const chunk=sorted.slice(Math.floor(bi*sorted.length/5),Math.floor((bi+1)*sorted.length/5));
                const avgLoss=chunk.length?chunk.reduce((s,x)=>s+(x.regulatoryCapital-computeStress(x,selRegulator).stressedCapital),0)/chunk.length:0;
                const breachCount=chunk.filter(x=>computeStress(x,selRegulator).breachFlag).length;
                const barW=Math.min(100,avgLoss*2000);
                return (
                  <div key={band} style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <div style={{ width:80,fontSize:10,color:T.muted }}>Exposure {band}</div>
                    <div style={{ flex:1,background:T.sub,borderRadius:4,height:16,position:'relative',overflow:'hidden' }}>
                      <div style={{ width:`${barW}%`,height:'100%',background:bi>2?T.red:bi>1?T.amber:T.green,borderRadius:4 }} />
                    </div>
                    <div style={{ width:60,textAlign:'right',fontSize:10,fontWeight:600,color:T.text }}>{(avgLoss*100).toFixed(2)}pp</div>
                    <div style={{ width:50,textAlign:'right',fontSize:10,color:breachCount>0?T.red:T.muted }}>{breachCount} breach</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
