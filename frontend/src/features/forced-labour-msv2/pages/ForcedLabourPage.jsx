import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell, Legend, PieChart, Pie, LineChart, Line } from 'recharts';

// Backend E38 Forced Labour Risk Assessment engine (ILO 11 indicators / EU FLR
// 2024/3015 / UK MSA Section 54 / LkSG / compliance programme maturity).
// See backend/services/forced_labour_engine.py + backend/api/v1/routes/forced_labour.py
// The engine returns honest nulls ("insufficient_data") when required inputs
// are not supplied — it never fabricates a risk score. The Live Entity
// Assessment tab below calls the real endpoint and surfaces those nulls as
// "Insufficient data" rather than blank/NaN.
const API = 'http://localhost:8001';
const FORCED_LABOUR_API = `${API}/api/v1/forced-labour`;

// Local INDUSTRIES -> engine EU_FLR_HIGH_RISK_SECTORS keys (sectors outside
// this list are still accepted by the engine; they simply don't add sector risk points).
const INDUSTRY_TO_SECTOR = {
  'Apparel & Textiles': 'apparel_textiles',
  'Electronics': 'electronics',
  'Agriculture & Food': 'agriculture_food',
  'Mining & Metals': 'mining_minerals',
  'Construction': 'construction',
  'Healthcare Products': 'other',
  'Automotive': 'other',
  'Retail': 'other',
  'Chemicals': 'other',
  'Logistics': 'fishing',
};

// Local SOURCE_COUNTRIES (full names) -> ISO 3166-1 alpha-2 codes the engine expects.
const COUNTRY_TO_ISO = {
  'China': 'CN', 'Vietnam': 'VN', 'Bangladesh': 'BD', 'India': 'IN', 'Malaysia': 'MY',
  'Thailand': 'TH', 'Indonesia': 'ID', 'Myanmar': 'MM', 'Philippines': 'PH', 'Cambodia': 'KH',
  'Pakistan': 'PK', 'Turkey': 'TR', 'Mexico': 'MX', 'Brazil': 'BR', 'Ethiopia': 'ET',
  'Colombia': 'CO', 'Sri Lanka': 'LK', 'Nepal': 'NP', 'Jordan': 'JO', 'Nigeria': 'NG',
  'Morocco': 'MA', 'Ghana': 'GH', 'Peru': 'PE', 'Ukraine': 'UA',
};

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f4f6f9',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const INDUSTRIES = ['Apparel & Textiles','Electronics','Agriculture & Food','Mining & Metals','Construction','Healthcare Products','Automotive','Retail','Chemicals','Logistics'];

const SOURCE_COUNTRIES = [
  'China','Vietnam','Bangladesh','India','Malaysia','Thailand','Indonesia','Myanmar','Philippines','Cambodia',
  'Pakistan','Turkey','Mexico','Brazil','Ethiopia','Colombia','Sri Lanka','Nepal','Jordan','Nigeria',
  'Morocco','Ghana','Peru','Ukraine','Indonesia'
].filter((v,i,a)=>a.indexOf(v)===i).slice(0,25);

const ILO_INDICATORS = [
  'Abuse of vulnerability','Deception','Restriction of movement','Isolation','Physical violence',
  'Intimidation & threats','Retention of documents','Withholding wages','Debt bondage',
  'Abusive working conditions','Excessive overtime','Child labour risk','Hazardous working conditions',
  'Discrimination & harassment','Freedom of association denied','Lack of social protection',
  'Unsafe recruitment','Working time violations','Inadequate wages','Lack of grievance mechanisms'
];

const PIE_C = [T.navy, T.gold, T.sage, T.red, T.amber, T.indigo, T.blue, T.purple, T.orange, T.teal];

const BASE_COMPANIES = [
  'Nike Inc','Adidas AG','H&M Group','Inditex (Zara)','Gap Inc','Apple Inc','Samsung Electronics','Foxconn','HP Inc','Dell Technologies',
  'Nestle SA','Unilever','Mars Inc','Mondelez','Cargill','Rio Tinto','BHP Group','Glencore','ArcelorMittal','Freeport McMoRan',
  'Skanska AB','Vinci SA','Bouygues','Holcim','CRH plc','Johnson & Johnson','Medtronic','Abbott Labs','Baxter Intl','Stryker',
  'Toyota Motor','Volkswagen AG','BMW Group','Ford Motor','General Motors','Walmart','Amazon','Costco','Target Corp','Home Depot',
  'BASF SE','Dow Chemical','DuPont','3M Company','Henkel AG','Maersk','DHL Group','FedEx','UPS','Kuehne Nagel',
  'PVH Corp','Levi Strauss','Under Armour','Puma SE','LVMH','Hermes','Kering','Burberry','Primark','Fast Retailing'
];

const SUPPLY_CHAINS = Array.from({ length: 300 }, (_, i) => {
  const companyBase = BASE_COMPANIES[i % 60];
  const company = i < 60 ? companyBase : `${companyBase} ${Math.floor(i / 60) + 1}`;
  const ind = INDUSTRIES[i % 10];
  const country = SOURCE_COUNTRIES[i % 25];
  const riskScore = Math.round(20 + sr(i * 7) * 75);
  const uflpaCompliant = sr(i * 11) > 0.4;
  const ukMsaQuality = Math.round(20 + sr(i * 13) * 70);
  const csdddReady = sr(i * 17) > 0.5;
  const supplierCount = Math.round(50 + sr(i * 19) * 450);
  const highRiskSuppliers = Math.round(supplierCount * 0.05 + sr(i * 23) * supplierCount * 0.15);
  const auditsPassed = Math.round(supplierCount * 0.5 + sr(i * 29) * supplierCount * 0.4);
  const lastAudit = `202${3 + Math.floor(sr(i * 31) * 3)}-${String(1 + Math.floor(sr(i * 33) * 11)).padStart(2,'0')}-${String(1 + Math.floor(sr(i * 37) * 27)).padStart(2,'0')}`;
  const remStatuses = ['Open','In Progress','Closed'];
  const audFreqs = ['Annual','Biennial','Ad-hoc'];
  return {
    id: i, company, industry: ind, primarySource: country, riskScore,
    uflpaCompliant, ukMsaQuality, csdddReady, supplierCount, highRiskSuppliers, auditsPassed, lastAudit,
    iloScores: ILO_INDICATORS.map((ind2, ii) => ({ indicator: ind2, score: Math.round(10 + sr(i * 50 + ii * 7) * 80) })),
    secondarySources: SOURCE_COUNTRIES.slice(0, 3 + Math.floor(sr(i * 41) * 5)).filter(c => c !== country),
    remediationActions: Math.round(sr(i * 43) * 8),
    grievanceCount: Math.round(sr(i * 47) * 15),
    remediationStatus: remStatuses[Math.floor(sr(i * 53) * 3)],
    wageGap: Math.round(5 + sr(i * 59) * 45),
    workerCount: Math.round(200 + sr(i * 61) * 9800),
    auditFrequency: audFreqs[Math.floor(sr(i * 67) * 3)],
    lksgReady: sr(i * 71) > 0.55,
    australianMSA: sr(i * 73) > 0.45,
    frenchVigilance: sr(i * 79) > 0.5,
    dueDiligenceMaturity: Math.round(10 + sr(i * 83) * 85),
    tier: riskScore > 70 ? 'Critical' : riskScore > 50 ? 'High' : riskScore > 30 ? 'Medium' : 'Low'
  };
});

const COUNTRY_RISK = SOURCE_COUNTRIES.map((c, i) => ({
  country: c,
  overallRisk: Math.round(30 + sr(i * 7) * 65),
  freedomIndex: Math.round(10 + sr(i * 11) * 60),
  laborLaws: Math.round(20 + sr(i * 13) * 70),
  enforcement: Math.round(10 + sr(i * 17) * 50),
  industries: INDUSTRIES.map((ind, ii) => ({ industry: ind, risk: Math.round(20 + sr(i * 50 + ii * 23) * 75) }))
}));

const GRIEVANCE_TYPES = ['Wage Theft','Physical Abuse','Unsafe Conditions','Child Labour','Debt Bondage','Document Retention','Excessive Hours'];
const GRIEVANCE_SEVERITIES = ['Critical','High','Medium','Low'];
const GRIEVANCE_STATUSES = ['Open','Under Investigation','Resolved','Escalated'];

const GRIEVANCES = Array.from({ length: 200 }, (_, i) => ({
  id: i + 1,
  company: SUPPLY_CHAINS[i % 300].company,
  type: GRIEVANCE_TYPES[Math.floor(sr(i * 7) * 7)],
  severity: GRIEVANCE_SEVERITIES[Math.floor(sr(i * 11) * 4)],
  status: GRIEVANCE_STATUSES[Math.floor(sr(i * 13) * 4)],
  daysOpen: Math.round(1 + sr(i * 17) * 364),
  workerCount: Math.round(1 + sr(i * 19) * 120)
}));

const AUDITORS = ['BSI','SGS','Bureau Veritas','ELEVATE','Intertek'];
const AUDIT_RESULTS = ['Pass','Fail','Conditional'];

const AUDIT_RECORDS = Array.from({ length: 150 }, (_, i) => ({
  id: i + 1,
  company: SUPPLY_CHAINS[i % 300].company,
  auditor: AUDITORS[Math.floor(sr(i * 7) * 5)],
  date: `202${3 + Math.floor(sr(i * 11) * 3)}-${String(1 + Math.floor(sr(i * 13) * 11)).padStart(2,'0')}-${String(1 + Math.floor(sr(i * 17) * 27)).padStart(2,'0')}`,
  result: AUDIT_RESULTS[Math.floor(sr(i * 19) * 3)],
  findings: Math.round(sr(i * 23) * 25),
  corrective_actions: Math.round(sr(i * 29) * 18)
}));

const TABS = ['Risk Heatmap','Supply Chain Screening','ILO Due Diligence','Regulatory Compliance','Grievance Management','Audit Intelligence','Worker Wellbeing','Remediation Tracker','Live Entity Assessment'];

const StatusBadge = ({ status }) => {
  if (status === 'loading') return <Badge bg="#1e293b" fg="#94a3b8">Connecting to Forced Labour Engine…</Badge>;
  if (status === 'live') return <Badge bg="#dcfce7" fg="#166534">● Live — computed by /api/v1/forced-labour engine (ILO 11 indicators · EU FLR 2024/3015 · UK MSA)</Badge>;
  if (status === 'error') return <Badge bg="#fee2e2" fg="#991b1b">⚠ Live call failed — see error below</Badge>;
  return <Badge bg="#fef3c7" fg="#92400e">○ Demo Data — Forced Labour API unavailable, showing seeded illustrative figures</Badge>;
};

export const exportCSV = (rows, fn) => {
  if (!rows.length) return;
  const h = Object.keys(rows[0]);
  const csv = [h.join(','), ...rows.map(r => h.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
  const b = new Blob([csv], { type: 'text/csv' });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = u; a.download = fn; a.click(); URL.revokeObjectURL(u);
};

const KpiCard = ({ label, value, sub, accent = T.navy }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', borderLeft: `3px solid ${accent}` }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: 'DM Sans, system-ui, sans-serif', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: T.textPri, fontFamily: 'DM Sans, system-ui, sans-serif' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: accent, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Row = ({ children, cols }) => (
  <div style={{ display: 'grid', gridTemplateColumns: cols || 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 16 }}>{children}</div>
);

const Badge = ({ children, bg, fg }) => (
  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: bg || T.surfaceH, color: fg || T.textPri }}>{children}</span>
);

const th = { padding: '8px 10px', fontSize: 11, fontWeight: 600, color: T.textSec, background: T.sub, border: `1px solid ${T.border}`, textAlign: 'left', cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif', whiteSpace: 'nowrap', userSelect: 'none' };
const td = { padding: '7px 10px', fontSize: 12, border: `1px solid ${T.border}`, fontFamily: 'DM Sans, system-ui, sans-serif', color: T.textPri };

const tierColor = t => ({ Critical: T.red, High: T.amber, Medium: T.gold, Low: T.green }[t] || T.textSec);

export default function ForcedLabourPage() {
  const [tab, setTab] = useState(0);
  const [indFilter, setIndFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('riskScore');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedChain, setSelectedChain] = useState(0);
  const [riskThreshold, setRiskThreshold] = useState(50);
  const [selectedCountryIdx, setSelectedCountryIdx] = useState(0);
  const [grievType, setGrievType] = useState('All');
  const [grievSev, setGrievSev] = useState('All');
  const [grievStatus, setGrievStatus] = useState('All');

  // --- Live Entity Assessment tab: calls the real forced-labour-engine ------
  const [liveChainIdx, setLiveChainIdx] = useState(0);
  const [includeIlo, setIncludeIlo] = useState(true);
  const [includeAudit, setIncludeAudit] = useState(true);
  const [includeMsa, setIncludeMsa] = useState(true);
  const [includeProgramme, setIncludeProgramme] = useState(true);
  const [auditScore, setAuditScore] = useState(55);
  const [iloDebtBondage, setIloDebtBondage] = useState(6.5);
  const [iloWages, setIloWages] = useState(5.0);
  const [iloViolence, setIloViolence] = useState(2.0);
  const [progPolicy, setProgPolicy] = useState(55);
  const [progDueDiligence, setProgDueDiligence] = useState(50);
  const [progGrievance, setProgGrievance] = useState(45);

  const [liveResult, setLiveResult] = useState(null);
  const [liveStatus, setLiveStatus] = useState('idle'); // 'idle' | 'loading' | 'live' | 'demo' | 'error'
  const [liveError, setLiveError] = useState(null);

  const runLiveAssessment = async () => {
    const chain = SUPPLY_CHAINS[liveChainIdx];
    const sector = INDUSTRY_TO_SECTOR[chain.industry] || 'other';
    const countryCode = COUNTRY_TO_ISO[chain.primarySource] || '';

    const payload = {
      entity_id: `SUP-${chain.id}`,
      entity_name: chain.company,
      sector,
      country_code: countryCode,
      audit_evidence: includeAudit ? { audit_score: auditScore } : {},
      supplier_data: includeIlo ? {
        debt_bondage: iloDebtBondage,
        retention_of_wages: iloWages,
        physical_violence: iloViolence,
      } : {},
      disclosure_data: includeMsa ? {
        org_chart_published: true,
        supply_chain_tiers_mapped: true,
        modern_slavery_policy_exists: true,
        policy_board_approved: true,
        supplier_questionnaires: true,
        risk_register_maintained: true,
      } : {},
      programme_data: includeProgramme ? {
        policy_commitment_score: progPolicy,
        due_diligence_process_score: progDueDiligence,
        grievance_mechanism_score: progGrievance,
      } : {},
    };

    setLiveStatus('loading');
    setLiveError(null);
    try {
      const { data } = await axios.post(`${FORCED_LABOUR_API}/full-assessment`, payload, { timeout: 10000 });
      setLiveResult(data);
      setLiveStatus('live');
    } catch (e) {
      setLiveResult(null);
      setLiveStatus(e?.response ? 'error' : 'demo');
      setLiveError(e?.response?.data?.detail || e.message);
    }
  };

  const filteredChains = useMemo(() => {
    let c = [...SUPPLY_CHAINS];
    if (indFilter !== 'All') c = c.filter(x => x.industry === indFilter);
    if (countryFilter !== 'All') c = c.filter(x => x.primarySource === countryFilter);
    if (tierFilter !== 'All') c = c.filter(x => x.tier === tierFilter);
    if (search) c = c.filter(x => x.company.toLowerCase().includes(search.toLowerCase()));
    c.sort((a, b) => sortDir === 'asc' ? (a[sortCol] > b[sortCol] ? 1 : -1) : (a[sortCol] < b[sortCol] ? 1 : -1));
    return c;
  }, [indFilter, countryFilter, tierFilter, search, sortCol, sortDir]);

  const filteredGrievances = useMemo(() => {
    let g = [...GRIEVANCES];
    if (grievType !== 'All') g = g.filter(x => x.type === grievType);
    if (grievSev !== 'All') g = g.filter(x => x.severity === grievSev);
    if (grievStatus !== 'All') g = g.filter(x => x.status === grievStatus);
    return g;
  }, [grievType, grievSev, grievStatus]);

  const toggleSort = col => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };

  const criticalCount = SUPPLY_CHAINS.filter(s => s.riskScore > 70).length;
  const avgRisk = SUPPLY_CHAINS.length ? Math.round(SUPPLY_CHAINS.reduce((a, s) => a + s.riskScore, 0) / SUPPLY_CHAINS.length) : 0;
  const totalWorkers = SUPPLY_CHAINS.reduce((a, s) => a + s.workerCount, 0);

  // --- Tab 0: Risk Heatmap ---
  const renderHeatmap = () => {
    const cr = COUNTRY_RISK[selectedCountryIdx];
    const heatData = SOURCE_COUNTRIES.slice(0, 15).map((c, ci) => ({
      country: c, ...Object.fromEntries(INDUSTRIES.slice(0, 8).map((ind, ii) => ([ind, Math.round(20 + sr(ci * 50 + ii * 23) * 75)])))
    }));
    const tierDist = ['Critical','High','Medium','Low'].map(t => ({ name: t, value: SUPPLY_CHAINS.filter(s => s.tier === t).length }));
    return (
      <div>
        <Row cols="1fr 1fr 1fr 1fr 1fr">
          <KpiCard label="Supply Chains Screened" value={300} accent={T.navy} />
          <KpiCard label="Critical Risk" value={criticalCount} sub={`${SUPPLY_CHAINS.length ? Math.round(criticalCount / SUPPLY_CHAINS.length * 100) : 0}% of total`} accent={T.red} />
          <KpiCard label="Avg Risk Score" value={avgRisk} sub={avgRisk > 50 ? 'Above threshold' : 'Below threshold'} accent={avgRisk > 50 ? T.red : T.green} />
          <KpiCard label="Countries Monitored" value={SOURCE_COUNTRIES.length} accent={T.gold} />
          <KpiCard label="Total Workers Covered" value={`${(totalWorkers / 1000000).toFixed(1)}M`} accent={T.indigo} />
        </Row>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <select value={selectedCountryIdx} onChange={e => setSelectedCountryIdx(+e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 12, minWidth: 160 }}>
            {SOURCE_COUNTRIES.map((c, i) => <option key={i} value={i}>{c}</option>)}
          </select>
          <button onClick={() => exportCSV(COUNTRY_RISK.map(c => ({ Country: c.country, OverallRisk: c.overallRisk, FreedomIndex: c.freedomIndex, LaborLaws: c.laborLaws, Enforcement: c.enforcement })), 'country_risk.csv')} style={{ background: T.navy, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>Export CSV</button>
        </div>
        <Row cols="2fr 1fr">
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 8 }}>Country × Industry Risk Heatmap (25 × 10)</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 10 }}>
                <thead><tr>
                  <th style={{ ...th, fontSize: 10 }}>Country</th>
                  {INDUSTRIES.slice(0, 8).map(ind => <th key={ind} style={{ ...th, fontSize: 9, writingMode: 'vertical-lr', height: 90, textAlign: 'center', maxWidth: 30 }}>{ind}</th>)}
                </tr></thead>
                <tbody>{heatData.map((row, ri) => (
                  <tr key={ri}>
                    <td style={{ ...td, fontWeight: 600, fontSize: 10, whiteSpace: 'nowrap' }}>{row.country}</td>
                    {INDUSTRIES.slice(0, 8).map(ind => {
                      const v = row[ind]; const bg = v > 70 ? T.red : v > 50 ? T.amber : v > 30 ? T.gold : T.green;
                      return <td key={ind} style={{ ...td, background: bg + '28', textAlign: 'center', fontSize: 9, fontWeight: 600, color: bg, width: 35, height: 26 }}>{v}</td>;
                    })}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 8 }}>{cr.country} Risk Profile</div>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart outerRadius={65} data={[{ dim: 'Overall', v: cr.overallRisk }, { dim: 'Freedom', v: cr.freedomIndex }, { dim: 'Labor Laws', v: cr.laborLaws }, { dim: 'Enforcement', v: cr.enforcement }]}>
                  <PolarGrid stroke={T.border} /><PolarAngleAxis dataKey="dim" tick={{ fontSize: 10, fill: T.textSec }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar dataKey="v" stroke={T.red} fill={T.red + '30'} fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 8 }}>Tier Distribution</div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={tierDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={9}>
                    {tierDist.map((entry, i) => <Cell key={i} fill={tierColor(entry.name)} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Row>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 8 }}>Country Risk Scores (All 25 Countries)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[...COUNTRY_RISK].sort((a, b) => b.overallRisk - a.overallRisk)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="country" tick={{ fontSize: 9, fill: T.textSec }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 100]} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="overallRisk" name="Overall Risk" radius={[3, 3, 0, 0]}>
                {[...COUNTRY_RISK].sort((a, b) => b.overallRisk - a.overallRisk).map((c, i) => <Cell key={i} fill={c.overallRisk > 70 ? T.red : c.overallRisk > 50 ? T.amber : T.green} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // --- Tab 1: Supply Chain Screening ---
  const renderScreening = () => {
    const sc = SUPPLY_CHAINS[selectedChain];
    return (
      <div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search 300 companies..." style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '7px 12px', fontSize: 13, width: 230, outline: 'none' }} />
          <select value={indFilter} onChange={e => setIndFilter(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 12 }}>
            <option value="All">All Industries</option>{INDUSTRIES.map(i => <option key={i}>{i}</option>)}
          </select>
          <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 12 }}>
            <option value="All">All Countries</option>{SOURCE_COUNTRIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 12 }}>
            <option value="All">All Tiers</option>{['Critical','High','Medium','Low'].map(t => <option key={t}>{t}</option>)}
          </select>
          <button onClick={() => exportCSV(filteredChains.map(s => ({ Company: s.company, Industry: s.industry, Source: s.primarySource, Risk: s.riskScore, Tier: s.tier, UFLPA: s.uflpaCompliant ? 'Yes' : 'No', Workers: s.workerCount, WageGap: s.wageGap, RemStatus: s.remediationStatus })), 'supply_chain_screen.csv')} style={{ background: T.navy, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>Export</button>
        </div>
        <Row cols="2fr 1fr">
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 6 }}>Supply Chain Screening — {filteredChains.length} of 300 chains</div>
            <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>{[['company','Company'],['industry','Industry'],['primarySource','Source'],['riskScore','Risk'],['tier','Tier'],['workerCount','Workers'],['wageGap','Wage Gap'],['remediationStatus','Rem. Status'],['auditFrequency','Audit Freq']].map(([k, l]) =>
                    <th key={k} style={th} onClick={() => toggleSort(k)}>{l}{sortCol === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}</th>
                  )}</tr>
                </thead>
                <tbody>{filteredChains.slice(0, 50).map(s => {
                  const tc = tierColor(s.tier);
                  return <tr key={s.id} style={{ cursor: 'pointer', background: selectedChain === s.id ? T.surfaceH : 'transparent' }} onClick={() => setSelectedChain(s.id)}>
                    <td style={{ ...td, fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.company}</td>
                    <td style={{ ...td, fontSize: 11 }}>{s.industry}</td>
                    <td style={td}>{s.primarySource}</td>
                    <td style={{ ...td, fontWeight: 700, color: s.riskScore > 70 ? T.red : s.riskScore > 50 ? T.amber : T.green, fontFamily: T.fontMono }}>{s.riskScore}</td>
                    <td style={td}><Badge bg={tc + '20'} fg={tc}>{s.tier}</Badge></td>
                    <td style={{ ...td, fontFamily: T.fontMono }}>{s.workerCount.toLocaleString()}</td>
                    <td style={{ ...td, fontFamily: T.fontMono, color: s.wageGap > 30 ? T.red : T.green }}>{s.wageGap}%</td>
                    <td style={td}><Badge bg={s.remediationStatus === 'Open' ? T.red + '20' : s.remediationStatus === 'In Progress' ? T.amber + '20' : T.green + '20'} fg={s.remediationStatus === 'Open' ? T.red : s.remediationStatus === 'In Progress' ? T.amber : T.green}>{s.remediationStatus}</Badge></td>
                    <td style={{ ...td, fontSize: 11 }}>{s.auditFrequency}</td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 8 }}>{sc.company}</div>
            {[['Industry', sc.industry], ['Primary Source', sc.primarySource], ['Risk Score', sc.riskScore, sc.riskScore > 70 ? T.red : T.green], ['Tier', sc.tier, tierColor(sc.tier)], ['Workers', sc.workerCount.toLocaleString()], ['Wage Gap', `${sc.wageGap}%`, sc.wageGap > 30 ? T.red : T.green], ['Rem. Status', sc.remediationStatus], ['Audit Freq.', sc.auditFrequency], ['UFLPA', sc.uflpaCompliant ? 'Compliant' : 'Non-compliant', sc.uflpaCompliant ? T.green : T.red], ['CSDDD Ready', sc.csdddReady ? 'Yes' : 'No', sc.csdddReady ? T.green : T.red], ['LkSG Ready', sc.lksgReady ? 'Yes' : 'No', sc.lksgReady ? T.green : T.red], ['Australian MSA', sc.australianMSA ? 'Yes' : 'No', sc.australianMSA ? T.green : T.red], ['French Vigilance', sc.frenchVigilance ? 'Yes' : 'No', sc.frenchVigilance ? T.green : T.red], ['DD Maturity', `${sc.dueDiligenceMaturity}/100`], ['Grievances', sc.grievanceCount], ['Rem. Actions', sc.remediationActions], ['Suppliers', sc.supplierCount], ['High Risk', sc.highRiskSuppliers], ['Last Audit', sc.lastAudit]].map(([l, v, c], i) =>
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                <span style={{ color: T.textSec }}>{l}</span>
                <span style={{ fontWeight: 600, color: c || T.textPri, fontFamily: T.fontMono }}>{v}</span>
              </div>
            )}
            <div style={{ marginTop: 8, fontSize: 11, color: T.textSec }}>Secondary Sources: {sc.secondarySources.join(', ')}</div>
          </div>
        </Row>
      </div>
    );
  };

  // --- Tab 2: ILO Due Diligence ---
  const renderDueDiligence = () => {
    const sc = SUPPLY_CHAINS[selectedChain];
    const radarData = sc.iloScores.map(s => ({ indicator: s.indicator.split(' ').slice(0, 2).join(' '), score: s.score }));
    const avgIlo = sc.iloScores.length ? Math.round(sc.iloScores.reduce((a, s) => a + s.score, 0) / sc.iloScores.length) : 0;
    const highRiskIndicators = sc.iloScores.filter(s => s.score > riskThreshold).length;
    const crossCompare = SUPPLY_CHAINS.slice(0, 20).map(s => ({
      name: s.company.slice(0, 14),
      avg: s.iloScores.length ? Math.round(s.iloScores.reduce((a, x) => a + x.score, 0) / s.iloScores.length) : 0,
      highRisk: s.iloScores.filter(x => x.score > riskThreshold).length
    }));
    return (
      <div>
        <Row cols="1fr 1fr 1fr 1fr">
          <KpiCard label="ILO Indicators Tracked" value={20} sub="Across all chains" accent={T.navy} />
          <KpiCard label={`${sc.company.slice(0, 18)} Avg`} value={avgIlo} sub={avgIlo > 50 ? 'Above threshold' : 'Below threshold'} accent={avgIlo > 50 ? T.red : T.green} />
          <KpiCard label="High Risk Indicators" value={highRiskIndicators} sub={`of 20 above threshold`} accent={T.red} />
          <KpiCard label="Due Diligence Maturity" value={`${sc.dueDiligenceMaturity}/100`} accent={T.indigo} />
        </Row>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={selectedChain} onChange={e => setSelectedChain(+e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 12, minWidth: 200 }}>
            {SUPPLY_CHAINS.slice(0, 60).map((s, i) => <option key={i} value={i}>{s.company}</option>)}
          </select>
          <span style={{ fontSize: 12, color: T.textSec }}>Risk Threshold:</span>
          <input type="range" min={20} max={80} value={riskThreshold} onChange={e => setRiskThreshold(+e.target.value)} style={{ width: 120, accentColor: T.red }} />
          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, color: T.red }}>{riskThreshold}</span>
        </div>
        <Row cols="1fr 1fr">
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 8 }}>20 ILO Indicators — Radar</div>
            <ResponsiveContainer width="100%" height={340}>
              <RadarChart outerRadius={110} data={radarData}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="indicator" tick={{ fontSize: 8, fill: T.textSec }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                <Radar dataKey="score" stroke={T.red} fill={T.red + '30'} fillOpacity={0.5} name="Risk Score" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 8 }}>Indicator Scores (sorted)</div>
            <div style={{ maxHeight: 355, overflowY: 'auto' }}>
              {[...sc.iloScores].sort((a, b) => b.score - a.score).map((s, i) => {
                const isHigh = s.score > riskThreshold;
                return (
                  <div key={i} style={{ padding: '5px 0', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: isHigh ? 600 : 400, color: isHigh ? T.red : T.textPri }}>{s.indicator}</span>
                      <span style={{ fontSize: 11, fontFamily: T.fontMono, fontWeight: 700, color: isHigh ? T.red : T.green }}>{s.score}/100</span>
                    </div>
                    <div style={{ width: '100%', height: 4, background: T.border, borderRadius: 3 }}>
                      <div style={{ width: `${s.score}%`, height: 4, background: isHigh ? T.red : T.green, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Row>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 8 }}>Cross-Company ILO Comparison (Top 20)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={crossCompare}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend />
              <Bar dataKey="avg" fill={T.red} name="Avg ILO Risk" radius={[3, 3, 0, 0]} />
              <Bar dataKey="highRisk" fill={T.amber} name="# High Risk Indicators" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // --- Tab 3: Regulatory Compliance ---
  const renderCompliance = () => {
    const FRAMEWORKS = [
      { name: 'CSDDD 2026', desc: 'EU Corporate Sustainability Due Diligence Directive', deadline: '2026', compliant: SUPPLY_CHAINS.filter(s => s.csdddReady).length },
      { name: 'UFLPA', desc: 'Uyghur Forced Labor Prevention Act (USA)', deadline: 'In Force', compliant: SUPPLY_CHAINS.filter(s => s.uflpaCompliant).length },
      { name: 'UK MSA Annual', desc: 'UK Modern Slavery Act — Annual Statement', deadline: 'Annual', compliant: SUPPLY_CHAINS.filter(s => s.ukMsaQuality > 60).length },
      { name: 'German LkSG', desc: 'Lieferkettensorgfaltspflichtengesetz', deadline: 'In Force', compliant: SUPPLY_CHAINS.filter(s => s.lksgReady).length },
      { name: 'French Vigilance', desc: 'Loi sur le Devoir de Vigilance', deadline: 'In Force', compliant: SUPPLY_CHAINS.filter(s => s.frenchVigilance).length },
      { name: 'Norwegian Transparency', desc: 'Norwegian Transparency Act', deadline: 'In Force', compliant: Math.round(SUPPLY_CHAINS.length * 0.42) },
      { name: 'Australian MSA', desc: 'Australian Modern Slavery Act', deadline: 'Annual', compliant: SUPPLY_CHAINS.filter(s => s.australianMSA).length },
      { name: 'Swiss RBI', desc: 'Swiss Responsible Business Initiative', deadline: 'In Force', compliant: Math.round(SUPPLY_CHAINS.length * 0.37) },
    ];
    const totalCompliant = FRAMEWORKS.reduce((a, f) => a + f.compliant, 0);
    const avgRate = FRAMEWORKS.length > 0 ? Math.round(totalCompliant / (FRAMEWORKS.length * SUPPLY_CHAINS.length) * 100) : 0;
    return (
      <div>
        <Row cols="1fr 1fr 1fr 1fr">
          <KpiCard label="Frameworks Tracked" value={8} accent={T.navy} />
          <KpiCard label="Avg Compliance Rate" value={`${avgRate}%`} accent={T.amber} />
          <KpiCard label="Fully Compliant Chains" value={SUPPLY_CHAINS.filter(s => s.uflpaCompliant && s.csdddReady && s.lksgReady).length} accent={T.green} />
          <KpiCard label="Zero Compliance" value={SUPPLY_CHAINS.filter(s => !s.uflpaCompliant && !s.csdddReady && !s.lksgReady && !s.australianMSA).length} accent={T.red} />
        </Row>
        <Row cols="1fr 1fr">
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 8 }}>Compliance Rates — 8 Frameworks</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={FRAMEWORKS.map(f => ({ name: f.name, rate: SUPPLY_CHAINS.length ? Math.round(f.compliant / SUPPLY_CHAINS.length * 100) : 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-20} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="rate" name="Compliance %" radius={[3, 3, 0, 0]}>
                  {FRAMEWORKS.map((f, i) => { const r = SUPPLY_CHAINS.length ? Math.round(f.compliant / SUPPLY_CHAINS.length * 100) : 0; return <Cell key={i} fill={r > 60 ? T.green : r > 40 ? T.amber : T.red} />; })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 8 }}>Framework Details</div>
            <div style={{ maxHeight: 310, overflowY: 'auto' }}>
              {FRAMEWORKS.map((f, i) => {
                const pct = SUPPLY_CHAINS.length ? Math.round(f.compliant / SUPPLY_CHAINS.length * 100) : 0;
                return (
                  <div key={i} style={{ padding: '7px 0', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{f.name}</span>
                      <span style={{ fontSize: 11, fontFamily: T.fontMono, color: pct > 50 ? T.green : T.red }}>{pct}%</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.textSec, marginBottom: 3 }}>{f.desc}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textSec }}>
                      <span>Deadline: {f.deadline}</span><span>{f.compliant}/{SUPPLY_CHAINS.length} compliant</span>
                    </div>
                    <div style={{ width: '100%', height: 4, background: T.border, borderRadius: 3, marginTop: 4 }}>
                      <div style={{ width: `${pct}%`, height: 4, background: pct > 50 ? T.green : T.red, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Row>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 8 }}>Multi-Framework Matrix (First 40 Chains)</div>
          <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0 }}>
                <tr>{['Company','Industry','UFLPA','CSDDD','UK MSA','LkSG','Aus MSA','French Vig.','Risk','Tier'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>{SUPPLY_CHAINS.slice(0, 40).map(s => {
                const tc = tierColor(s.tier);
                return (
                  <tr key={s.id}>
                    <td style={{ ...td, fontWeight: 500, fontSize: 11 }}>{s.company}</td>
                    <td style={{ ...td, fontSize: 10 }}>{s.industry}</td>
                    {[s.uflpaCompliant, s.csdddReady, s.ukMsaQuality > 60, s.lksgReady, s.australianMSA, s.frenchVigilance].map((v, i) =>
                      <td key={i} style={td}><Badge bg={v ? T.green + '20' : T.red + '20'} fg={v ? T.green : T.red}>{v ? 'Y' : 'N'}</Badge></td>
                    )}
                    <td style={{ ...td, fontFamily: T.fontMono, fontWeight: 700, color: s.riskScore > 70 ? T.red : T.green }}>{s.riskScore}</td>
                    <td style={td}><Badge bg={tc + '20'} fg={tc}>{s.tier}</Badge></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // --- Tab 4: Grievance Management ---
  const renderGrievances = () => {
    const sevDist = GRIEVANCE_SEVERITIES.map(s => ({ name: s, value: GRIEVANCES.filter(g => g.severity === s).length }));
    const typeDist = GRIEVANCE_TYPES.map(t => ({ name: t.slice(0, 14), count: GRIEVANCES.filter(g => g.type === t).length }));
    const openGriev = GRIEVANCES.filter(g => g.status === 'Open').length;
    const avgDaysOpen = filteredGrievances.length ? Math.round(filteredGrievances.reduce((a, g) => a + g.daysOpen, 0) / filteredGrievances.length) : 0;
    const totalWorkerAffected = GRIEVANCES.reduce((a, g) => a + g.workerCount, 0);
    return (
      <div>
        <Row cols="1fr 1fr 1fr 1fr">
          <KpiCard label="Total Grievances" value={200} accent={T.navy} />
          <KpiCard label="Open Cases" value={openGriev} sub={`${GRIEVANCES.length ? Math.round(openGriev / GRIEVANCES.length * 100) : 0}% unresolved`} accent={T.red} />
          <KpiCard label="Avg Days Open" value={avgDaysOpen} accent={T.amber} />
          <KpiCard label="Workers Affected" value={totalWorkerAffected.toLocaleString()} accent={T.indigo} />
        </Row>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <select value={grievType} onChange={e => setGrievType(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 12 }}>
            <option value="All">All Types</option>{GRIEVANCE_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={grievSev} onChange={e => setGrievSev(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 12 }}>
            <option value="All">All Severities</option>{GRIEVANCE_SEVERITIES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={grievStatus} onChange={e => setGrievStatus(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 12 }}>
            <option value="All">All Statuses</option>{GRIEVANCE_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={() => exportCSV(filteredGrievances.map(g => ({ ID: g.id, Company: g.company, Type: g.type, Severity: g.severity, Status: g.status, DaysOpen: g.daysOpen, WorkersAffected: g.workerCount })), 'grievances.csv')} style={{ background: T.navy, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>Export</button>
        </div>
        <Row cols="1fr 1fr">
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 8 }}>Severity Distribution</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={sevDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10}>
                  {sevDist.map((_, i) => <Cell key={i} fill={[T.red, T.amber, T.gold, T.green][i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 8 }}>Grievances by Type</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={typeDist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} width={90} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" fill={T.red} name="Count" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Row>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 6 }}>Grievance Cases — {filteredGrievances.length} shown</div>
          <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0 }}>
                <tr>{['ID','Company','Type','Severity','Status','Days Open','Workers'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>{filteredGrievances.slice(0, 50).map(g => {
                const sc = { Critical: T.red, High: T.amber, Medium: T.gold, Low: T.green }[g.severity];
                const stc = { Open: T.red, 'Under Investigation': T.amber, Resolved: T.green, Escalated: T.purple }[g.status];
                return (
                  <tr key={g.id}>
                    <td style={{ ...td, fontFamily: T.fontMono, fontSize: 11 }}>{g.id}</td>
                    <td style={{ ...td, fontSize: 11, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.company}</td>
                    <td style={{ ...td, fontSize: 11 }}>{g.type}</td>
                    <td style={td}><Badge bg={sc + '20'} fg={sc}>{g.severity}</Badge></td>
                    <td style={td}><Badge bg={stc + '20'} fg={stc}>{g.status}</Badge></td>
                    <td style={{ ...td, fontFamily: T.fontMono, color: g.daysOpen > 90 ? T.red : T.textPri }}>{g.daysOpen}</td>
                    <td style={{ ...td, fontFamily: T.fontMono }}>{g.workerCount}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // --- Tab 5: Audit Intelligence ---
  const renderAudits = () => {
    const auditorPerf = AUDITORS.map(a => {
      const recs = AUDIT_RECORDS.filter(r => r.auditor === a);
      const passCount = recs.filter(r => r.result === 'Pass').length;
      const avgFindings = recs.length ? Math.round(recs.reduce((s, r) => s + r.findings, 0) / recs.length) : 0;
      return { auditor: a, total: recs.length, passRate: recs.length ? Math.round(passCount / recs.length * 100) : 0, avgFindings };
    });
    const yearTrend = ['2023','2024','2025','2026'].map(yr => {
      const recs = AUDIT_RECORDS.filter(r => r.date.startsWith(yr));
      const pass = recs.filter(r => r.result === 'Pass').length;
      const fail = recs.filter(r => r.result === 'Fail').length;
      const cond = recs.filter(r => r.result === 'Conditional').length;
      return { year: yr, Pass: pass, Fail: fail, Conditional: cond, total: recs.length };
    });
    const topByFreq = Object.entries(AUDIT_RECORDS.reduce((acc, r) => { acc[r.company] = (acc[r.company] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([company, count]) => ({ company: company.slice(0, 18), count }));
    const passCount = AUDIT_RECORDS.filter(r => r.result === 'Pass').length;
    const failCount = AUDIT_RECORDS.filter(r => r.result === 'Fail').length;
    const avgFindings = AUDIT_RECORDS.length ? Math.round(AUDIT_RECORDS.reduce((a, r) => a + r.findings, 0) / AUDIT_RECORDS.length) : 0;
    return (
      <div>
        <Row cols="1fr 1fr 1fr 1fr">
          <KpiCard label="Audit Records" value={150} accent={T.navy} />
          <KpiCard label="Pass Rate" value={`${AUDIT_RECORDS.length ? Math.round(passCount / AUDIT_RECORDS.length * 100) : 0}%`} accent={T.green} />
          <KpiCard label="Fail Count" value={failCount} accent={T.red} />
          <KpiCard label="Avg Findings" value={avgFindings} accent={T.amber} />
        </Row>
        <Row cols="1fr 1fr">
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 8 }}>Auditor Performance</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={auditorPerf}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="auditor" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend />
                <Bar dataKey="passRate" fill={T.green} name="Pass Rate %" radius={[3, 3, 0, 0]} />
                <Bar dataKey="avgFindings" fill={T.amber} name="Avg Findings" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 8 }}>Pass/Fail Trend 2023–2026</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={yearTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend />
                <Bar dataKey="Pass" fill={T.green} stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Conditional" fill={T.amber} stackId="a" />
                <Bar dataKey="Fail" fill={T.red} stackId="a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Row>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 8 }}>Top 20 Companies by Audit Frequency</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topByFreq} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 9, fill: T.textSec }} />
              <YAxis type="category" dataKey="company" tick={{ fontSize: 9, fill: T.textSec }} width={110} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="count" fill={T.navy} name="Audit Count" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 6 }}>Recent Audit Records</div>
          <div style={{ overflowX: 'auto', maxHeight: 320, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0 }}>
                <tr>{['Company','Auditor','Date','Result','Findings','Corrective Actions'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>{[...AUDIT_RECORDS].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40).map(r => {
                const rc = { Pass: T.green, Fail: T.red, Conditional: T.amber }[r.result];
                return (
                  <tr key={r.id}>
                    <td style={{ ...td, fontSize: 11, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.company}</td>
                    <td style={{ ...td, fontSize: 11 }}>{r.auditor}</td>
                    <td style={{ ...td, fontFamily: T.fontMono, fontSize: 11 }}>{r.date}</td>
                    <td style={td}><Badge bg={rc + '20'} fg={rc}>{r.result}</Badge></td>
                    <td style={{ ...td, fontFamily: T.fontMono, color: r.findings > 15 ? T.red : T.textPri }}>{r.findings}</td>
                    <td style={{ ...td, fontFamily: T.fontMono }}>{r.corrective_actions}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // --- Tab 6: Worker Wellbeing ---
  const renderWellbeing = () => {
    const wageByCountry = SOURCE_COUNTRIES.slice(0, 20).map((c, i) => {
      const chains = SUPPLY_CHAINS.filter(s => s.primarySource === c);
      const avgGap = chains.length ? Math.round(chains.reduce((a, s) => a + s.wageGap, 0) / chains.length) : 0;
      return { country: c.slice(0, 10), avgGap };
    });
    const workersByTier = ['Critical','High','Medium','Low'].map(t => ({
      tier: t,
      workers: SUPPLY_CHAINS.filter(s => s.tier === t).reduce((a, s) => a + s.workerCount, 0)
    }));
    const wellbeingRadar = [
      { dim: 'Wage Fairness', score: Math.round(100 - SUPPLY_CHAINS.reduce((a, s) => a + s.wageGap, 0) / Math.max(1, SUPPLY_CHAINS.length)) },
      { dim: 'Safety', score: Math.round(100 - SUPPLY_CHAINS.reduce((a, s) => a + (s.iloScores[12] ? s.iloScores[12].score : 0), 0) / Math.max(1, SUPPLY_CHAINS.length)) },
      { dim: 'Freedom of Assoc.', score: Math.round(100 - SUPPLY_CHAINS.reduce((a, s) => a + (s.iloScores[14] ? s.iloScores[14].score : 0), 0) / Math.max(1, SUPPLY_CHAINS.length)) },
      { dim: 'Grievance Access', score: Math.round(100 - SUPPLY_CHAINS.reduce((a, s) => a + (s.iloScores[19] ? s.iloScores[19].score : 0), 0) / Math.max(1, SUPPLY_CHAINS.length)) },
      { dim: 'Working Hours', score: Math.round(100 - SUPPLY_CHAINS.reduce((a, s) => a + (s.iloScores[17] ? s.iloScores[17].score : 0), 0) / Math.max(1, SUPPLY_CHAINS.length)) },
      { dim: 'Social Protection', score: Math.round(100 - SUPPLY_CHAINS.reduce((a, s) => a + (s.iloScores[15] ? s.iloScores[15].score : 0), 0) / Math.max(1, SUPPLY_CHAINS.length)) },
    ];
    const avgWageGap = SUPPLY_CHAINS.length ? Math.round(SUPPLY_CHAINS.reduce((a, s) => a + s.wageGap, 0) / SUPPLY_CHAINS.length) : 0;
    return (
      <div>
        <Row cols="1fr 1fr 1fr 1fr">
          <KpiCard label="Total Workers Covered" value={`${(totalWorkers / 1000000).toFixed(1)}M`} accent={T.navy} />
          <KpiCard label="Avg Living Wage Gap" value={`${avgWageGap}%`} sub="Below living wage" accent={T.red} />
          <KpiCard label="Workers in Critical Chains" value={workersByTier.find(t => t.tier === 'Critical')?.workers.toLocaleString() || '0'} accent={T.red} />
          <KpiCard label="Workers in Low Risk Chains" value={workersByTier.find(t => t.tier === 'Low')?.workers.toLocaleString() || '0'} accent={T.green} />
        </Row>
        <Row cols="1fr 1fr">
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 8 }}>Living Wage Gap by Country (avg %)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...wageByCountry].sort((a, b) => b.avgGap - a.avgGap)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="country" tick={{ fontSize: 9, fill: T.textSec }} angle={-30} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 50]} />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={v => [`${v}%`, 'Avg Wage Gap']} />
                <Bar dataKey="avgGap" name="Wage Gap %" radius={[3, 3, 0, 0]}>
                  {[...wageByCountry].sort((a, b) => b.avgGap - a.avgGap).map((c, i) => <Cell key={i} fill={c.avgGap > 30 ? T.red : c.avgGap > 20 ? T.amber : T.green} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 8 }}>Wellbeing Score Radar (Platform avg)</div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart outerRadius={90} data={wellbeingRadar}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="dim" tick={{ fontSize: 9, fill: T.textSec }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                <Radar dataKey="score" stroke={T.green} fill={T.green + '30'} fillOpacity={0.5} name="Wellbeing Score" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Row>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 8 }}>Worker Count by Tier</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={workersByTier}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="tier" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ fontSize: 12 }} formatter={v => [v.toLocaleString(), 'Workers']} />
              <Bar dataKey="workers" name="Workers" radius={[3, 3, 0, 0]}>
                {workersByTier.map((t, i) => <Cell key={i} fill={tierColor(t.tier)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // --- Tab 7: Remediation Tracker ---
  const renderRemediation = () => {
    const remByStatus = ['Open','In Progress','Closed'].map(s => ({
      status: s,
      count: SUPPLY_CHAINS.filter(x => x.remediationStatus === s).length,
      actions: SUPPLY_CHAINS.filter(x => x.remediationStatus === s).reduce((a, x) => a + x.remediationActions, 0)
    }));
    const top15Open = [...SUPPLY_CHAINS].filter(s => s.remediationStatus === 'Open').sort((a, b) => b.remediationActions - a.remediationActions).slice(0, 15).map(s => ({ name: s.company.slice(0, 18), actions: s.remediationActions, risk: s.riskScore }));
    const maturityDist = [
      { range: '0–20', count: SUPPLY_CHAINS.filter(s => s.dueDiligenceMaturity <= 20).length },
      { range: '21–40', count: SUPPLY_CHAINS.filter(s => s.dueDiligenceMaturity > 20 && s.dueDiligenceMaturity <= 40).length },
      { range: '41–60', count: SUPPLY_CHAINS.filter(s => s.dueDiligenceMaturity > 40 && s.dueDiligenceMaturity <= 60).length },
      { range: '61–80', count: SUPPLY_CHAINS.filter(s => s.dueDiligenceMaturity > 60 && s.dueDiligenceMaturity <= 80).length },
      { range: '81–100', count: SUPPLY_CHAINS.filter(s => s.dueDiligenceMaturity > 80).length },
    ];
    const avgByIndustry = INDUSTRIES.map(ind => {
      const chains = SUPPLY_CHAINS.filter(s => s.industry === ind);
      const avgDays = chains.length ? Math.round(chains.reduce((a, s) => a + (s.remediationStatus === 'Closed' ? Math.round(sr(s.id * 97) * 180 + 10) : 0), 0) / Math.max(1, chains.filter(s => s.remediationStatus === 'Closed').length)) : 0;
      return { industry: ind.slice(0, 12), avgDays };
    });
    const openActions = SUPPLY_CHAINS.filter(s => s.remediationStatus === 'Open').reduce((a, s) => a + s.remediationActions, 0);
    const closedActions = SUPPLY_CHAINS.filter(s => s.remediationStatus === 'Closed').reduce((a, s) => a + s.remediationActions, 0);
    const avgMaturity = SUPPLY_CHAINS.length ? Math.round(SUPPLY_CHAINS.reduce((a, s) => a + s.dueDiligenceMaturity, 0) / SUPPLY_CHAINS.length) : 0;
    return (
      <div>
        <Row cols="1fr 1fr 1fr 1fr">
          <KpiCard label="Open Remediation Actions" value={openActions} accent={T.red} />
          <KpiCard label="Closed Actions" value={closedActions} accent={T.green} />
          <KpiCard label="In-Progress Chains" value={SUPPLY_CHAINS.filter(s => s.remediationStatus === 'In Progress').length} accent={T.amber} />
          <KpiCard label="Avg DD Maturity Score" value={`${avgMaturity}/100`} accent={T.indigo} />
        </Row>
        <Row cols="1fr 1fr">
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 8 }}>Remediation Status Distribution</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={remByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend />
                <Bar dataKey="count" name="Chains" radius={[3, 3, 0, 0]}>
                  {remByStatus.map((r, i) => <Cell key={i} fill={r.status === 'Open' ? T.red : r.status === 'In Progress' ? T.amber : T.green} />)}
                </Bar>
                <Bar dataKey="actions" name="Actions" fill={T.navy} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 8 }}>DD Maturity Score Distribution</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={maturityDist}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" name="Chains" radius={[3, 3, 0, 0]}>
                  {maturityDist.map((m, i) => <Cell key={i} fill={[T.red, T.orange, T.amber, T.teal, T.green][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Row>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 8 }}>Top 15 Companies by Open Remediation Actions</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={top15Open} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 9, fill: T.textSec }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} width={120} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend />
              <Bar dataKey="actions" fill={T.red} name="Open Actions" radius={[0, 3, 3, 0]} />
              <Bar dataKey="risk" fill={T.amber} name="Risk Score" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 8 }}>Avg Days to Close by Industry</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={avgByIndustry}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="industry" tick={{ fontSize: 9, fill: T.textSec }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12 }} formatter={v => [`${v} days`, 'Avg to Close']} />
              <Bar dataKey="avgDays" fill={T.indigo} name="Avg Days to Close" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // --- Tab 8: Live Entity Assessment (real backend, honest nulls) ---
  const renderLiveAssessment = () => {
    const chain = SUPPLY_CHAINS[liveChainIdx];
    const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : v);
    const fieldLabel = { fontSize: 11, color: T.textSec, marginBottom: 3, display: 'block' };
    const fieldInput = { border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 8px', fontSize: 12, width: '100%', boxSizing: 'border-box' };
    const panel = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 };

    const r = liveResult;
    const iloScore = r?.ilo_screening?.aggregate_risk_score;
    const iloLevel = r?.ilo_screening?.risk_level;
    const progScore = r?.compliance_programme?.overall_score;
    const progMaturity = r?.compliance_programme?.maturity;

    return (
      <div>
        <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <StatusBadge status={liveStatus === 'idle' ? 'demo' : liveStatus} />
          {liveStatus === 'idle' && <span style={{ fontSize: 11, color: T.textSec }}>Configure inputs below and click "Run Assessment" to call the real ILO / EU FLR / UK MSA engine.</span>}
        </div>
        <Row cols="1fr 1fr">
          <div style={panel}>
            <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 10 }}>Entity Assessment Inputs</div>
            <label style={fieldLabel}>Entity (prefill from supply chain)</label>
            <select value={liveChainIdx} onChange={e => setLiveChainIdx(+e.target.value)} style={{ ...fieldInput, marginBottom: 10 }}>
              {SUPPLY_CHAINS.slice(0, 60).map((s, i) => <option key={i} value={i}>{s.company} — {s.industry} — {s.primarySource}</option>)}
            </select>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 10 }}>
              Sector → <b>{INDUSTRY_TO_SECTOR[chain.industry] || 'other'}</b> · Country → <b>{COUNTRY_TO_ISO[chain.primarySource] || 'unmapped'}</b>
            </div>

            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10, marginBottom: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                <input type="checkbox" checked={includeAudit} onChange={e => setIncludeAudit(e.target.checked)} /> Supply EU FLR audit evidence
              </label>
              {includeAudit && <div>
                <label style={fieldLabel}>Audit score (0-100)</label>
                <input type="number" min={0} max={100} value={auditScore} onChange={e => setAuditScore(+e.target.value)} style={fieldInput} />
              </div>}
              {!includeAudit && <div style={{ fontSize: 11, color: T.amber }}>No audit evidence — EU FLR treats this as elevated risk (honest, not fabricated)</div>}
            </div>

            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10, marginBottom: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                <input type="checkbox" checked={includeIlo} onChange={e => setIncludeIlo(e.target.checked)} /> Supply ILO indicator scores (0-10)
              </label>
              {includeIlo && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div><label style={fieldLabel}>Debt bondage</label><input type="number" min={0} max={10} step={0.5} value={iloDebtBondage} onChange={e => setIloDebtBondage(+e.target.value)} style={fieldInput} /></div>
                <div><label style={fieldLabel}>Wage retention</label><input type="number" min={0} max={10} step={0.5} value={iloWages} onChange={e => setIloWages(+e.target.value)} style={fieldInput} /></div>
                <div><label style={fieldLabel}>Physical violence</label><input type="number" min={0} max={10} step={0.5} value={iloViolence} onChange={e => setIloViolence(+e.target.value)} style={fieldInput} /></div>
              </div>}
              {!includeIlo && <div style={{ fontSize: 11, color: T.amber }}>No ILO indicators supplied — aggregate score will return "insufficient_data" (honest null, not a fabricated score)</div>}
            </div>

            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10, marginBottom: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
                <input type="checkbox" checked={includeMsa} onChange={e => setIncludeMsa(e.target.checked)} /> Supply UK MSA disclosure evidence (org structure, policy, DD, risk register)
              </label>
            </div>

            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10, marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                <input type="checkbox" checked={includeProgramme} onChange={e => setIncludeProgramme(e.target.checked)} /> Supply compliance programme pillar scores (0-100)
              </label>
              {includeProgramme && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div><label style={fieldLabel}>Policy commitment</label><input type="number" min={0} max={100} value={progPolicy} onChange={e => setProgPolicy(+e.target.value)} style={fieldInput} /></div>
                <div><label style={fieldLabel}>Due diligence</label><input type="number" min={0} max={100} value={progDueDiligence} onChange={e => setProgDueDiligence(+e.target.value)} style={fieldInput} /></div>
                <div><label style={fieldLabel}>Grievance mechanism</label><input type="number" min={0} max={100} value={progGrievance} onChange={e => setProgGrievance(+e.target.value)} style={fieldInput} /></div>
              </div>}
            </div>

            <button onClick={runLiveAssessment} disabled={liveStatus === 'loading'} style={{ background: T.navy, color: '#fff', border: 'none', borderRadius: 6, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: liveStatus === 'loading' ? 'wait' : 'pointer', width: '100%' }}>
              {liveStatus === 'loading' ? 'Running assessment…' : 'Run Assessment'}
            </button>
          </div>

          <div style={panel}>
            <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 10 }}>Assessment Result</div>
            {liveStatus === 'idle' && <div style={{ fontSize: 12, color: T.textSec }}>No assessment run yet.</div>}
            {liveStatus === 'error' && <div style={{ fontSize: 12, color: T.red }}>Request failed: {String(liveError)}</div>}
            {liveStatus === 'demo' && <div style={{ fontSize: 12, color: T.amber }}>Forced Labour API unreachable — showing no result. Check that the backend is running on :8001.</div>}
            {r && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <KpiCard label="ILO Aggregate Risk" value={iloScore != null ? `${iloScore}/10` : 'Insufficient data'} sub={iloLevel} accent={iloScore != null && iloScore >= 5 ? T.red : T.green} />
                  <KpiCard label="EU FLR Risk Level" value={r.eu_flr?.risk_level ?? 'Insufficient data'} sub={r.eu_flr?.art7_investigation_trigger ? 'Art 7 trigger' : ''} accent={T.amber} />
                  <KpiCard label="UK MSA Score" value={`${r.uk_msa?.score ?? 0}/30`} sub={r.uk_msa?.grade} accent={T.indigo} />
                  <KpiCard label="Compliance Programme" value={progScore != null ? `${progScore}/100` : 'Insufficient data'} sub={progMaturity} accent={T.sage} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textPri, marginBottom: 6 }}>EU FLR Risk Justification</div>
                <ul style={{ margin: '0 0 12px', paddingLeft: 18, fontSize: 11, color: T.textSec }}>
                  {(r.eu_flr?.risk_justification || []).map((j, i) => <li key={i}>{j}</li>)}
                </ul>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textPri, marginBottom: 6 }}>Priority Actions</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: T.textSec }}>
                  {(r.priority_actions || []).map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
          </div>
        </Row>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: 'DM Sans, system-ui, sans-serif', background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', margin: 0, fontFamily: 'DM Sans, system-ui, sans-serif' }}>Forced Labour & Modern Slavery v2</h1>
        <p style={{ fontSize: 13, color: '#ffffffaa', margin: '4px 0 0' }}>300 supply chains · 25 source countries · 20 ILO indicators · 200 grievances · 150 audit records</p>
      </div>
      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, background: T.card, overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '11px 18px', fontSize: 12, fontWeight: tab === i ? 700 : 500, color: tab === i ? T.navy : T.textSec, background: 'transparent', border: 'none', borderBottom: tab === i ? `2px solid ${T.navy}` : '2px solid transparent', cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif', whiteSpace: 'nowrap', marginBottom: -2 }}>{t}</button>
        ))}
      </div>
      <div style={{ padding: '24px 28px' }}>
        {tab === 0 && renderHeatmap()}
        {tab === 1 && renderScreening()}
        {tab === 2 && renderDueDiligence()}
        {tab === 3 && renderCompliance()}
        {tab === 4 && renderGrievances()}
        {tab === 5 && renderAudits()}
        {tab === 6 && renderWellbeing()}
        {tab === 7 && renderRemediation()}
        {tab === 8 && renderLiveAssessment()}
      </div>
    </div>
  );
}
