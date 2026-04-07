import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const FRAMEWORKS = ['CSRD','ISSB','TCFD','SFDR','EU Taxonomy','UK SDR','SEC Climate',
  'ASIC','MAS','FSB','HKMA','TNFD','GRI','CDP','SASB','BRSR','IFRS S1','IFRS S2'];
const JURISDICTIONS = ['EU','UK','US','Singapore','Hong Kong','Australia','Japan',
  'India','Canada','Brazil','Switzerland','Norway','New Zealand','Malaysia','South Korea',
  'UAE','South Africa','Mexico','Indonesia','Taiwan'];
const STATUSES = ['Compliant','In Progress','Overdue','Not Started'];
const PRIORITIES = ['Critical','High','Medium','Low'];
const RESPONSIBLE = ['Sustainability Team','Legal & Compliance','Finance','Risk Management',
  'IR','ESG Committee','CFO Office','Board'];

const TODAY = new Date('2026-04-07');
function daysDiff(dateStr) {
  const d = new Date(dateStr);
  return Math.round((d - TODAY) / (1000 * 60 * 60 * 24));
}

const REQ_NAMES = [
  'Annual Sustainability Report','ESRS E1 Disclosure','PAI Statement',
  'Taxonomy Alignment KPIs','Article 8/9 Reporting','Climate Transition Plan',
  'TCFD Governance Disclosure','Physical Risk Assessment','Scope 3 Inventory',
  'Net Zero Commitment','Science-Based Target Submission','Double Materiality Assessment',
  'XBRL Tagging','Third-Party Verification','Board Climate Training',
  'Remuneration Linkage Disclosure','Supply Chain Due Diligence','Biodiversity Footprint',
  'Water Stewardship Disclosure','Social Indicators Reporting',
];

const REQUIREMENTS = Array.from({ length: 80 }, (_, i) => {
  const frameworkIdx = Math.floor(sr(i * 7) * FRAMEWORKS.length);
  const jurIdx = Math.floor(sr(i * 11) * JURISDICTIONS.length);
  const statusIdx = Math.floor(sr(i * 13) * STATUSES.length);
  const priorityIdx = Math.floor(sr(i * 17) * PRIORITIES.length);
  const respIdx = Math.floor(sr(i * 19) * RESPONSIBLE.length);
  const nameIdx = i % REQ_NAMES.length;
  const month = Math.floor(1 + sr(i * 23) * 23) % 24;
  const year = 2026 + Math.floor(month / 12);
  const mon = (month % 12) + 1;
  const day = Math.floor(1 + sr(i * 29) * 27);
  const deadline = `${year}-${String(mon).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const completionPct = STATUSES[statusIdx] === 'Compliant' ? 100
    : STATUSES[statusIdx] === 'Not Started' ? 0
    : Math.floor(10 + sr(i * 31) * 80);
  const gapCount = STATUSES[statusIdx] === 'Compliant' ? 0 : Math.floor(sr(i * 37) * 12);
  const evidenceItems = Math.floor(completionPct / 10 * (1 + sr(i * 41)));
  const estimatedHours = Math.round(20 + sr(i * 43) * 480);
  return {
    id: i,
    framework: FRAMEWORKS[frameworkIdx],
    jurisdiction: JURISDICTIONS[jurIdx],
    requirementName: REQ_NAMES[nameIdx],
    deadline,
    daysToDeadline: daysDiff(deadline),
    status: STATUSES[statusIdx],
    completionPct,
    evidenceItems,
    gapCount,
    responsible: RESPONSIBLE[respIdx],
    priority: PRIORITIES[priorityIdx],
    estimatedHours,
    linkedReports: Math.floor(1 + sr(i * 47) * 5),
  };
});

export default function RegulatoryDeadlineTrackerPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [jurisdictionFilter, setJurisdictionFilter] = useState([]);
  const [frameworkFilter, setFrameworkFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [deadlineWindow, setDeadlineWindow] = useState('All');
  const [sortCol, setSortCol] = useState('daysToDeadline');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedReq, setSelectedReq] = useState(null);
  const [availableHours, setAvailableHours] = useState(500);

  const tabs = ['Compliance Dashboard','Requirement Tracker','Jurisdiction Map','Resource Planning','Gap Analysis','Timeline View','Summary & Export'];

  const filteredReqs = useMemo(() => {
    let out = [...REQUIREMENTS];
    if (searchTerm) out = out.filter(r => r.requirementName.toLowerCase().includes(searchTerm.toLowerCase()) || r.framework.toLowerCase().includes(searchTerm.toLowerCase()) || r.jurisdiction.toLowerCase().includes(searchTerm.toLowerCase()));
    if (jurisdictionFilter.length > 0) out = out.filter(r => jurisdictionFilter.includes(r.jurisdiction));
    if (frameworkFilter !== 'All') out = out.filter(r => r.framework === frameworkFilter);
    if (statusFilter !== 'All') out = out.filter(r => r.status === statusFilter);
    if (priorityFilter !== 'All') out = out.filter(r => r.priority === priorityFilter);
    if (deadlineWindow !== 'All') {
      const days = { '30': 30, '60': 60, '90': 90, '180': 180 }[deadlineWindow];
      out = out.filter(r => r.daysToDeadline >= 0 && r.daysToDeadline <= days);
    }
    out = out.sort((a, b) => {
      const v = sortDir === 'asc' ? 1 : -1;
      if (typeof a[sortCol] === 'number') return (a[sortCol] - b[sortCol]) * v;
      return (a[sortCol] > b[sortCol] ? 1 : -1) * v;
    });
    return out;
  }, [searchTerm, jurisdictionFilter, frameworkFilter, statusFilter, priorityFilter, deadlineWindow, sortCol, sortDir]);

  const complianceScore = useMemo(() => {
    if (!REQUIREMENTS.length) return 0;
    return parseFloat((REQUIREMENTS.reduce((s, r) => s + r.completionPct, 0) / REQUIREMENTS.length).toFixed(1));
  }, []);

  const statusCounts = useMemo(() => {
    const counts = {};
    STATUSES.forEach(s => { counts[s] = 0; });
    REQUIREMENTS.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return counts;
  }, []);

  const jurisdictionStats = useMemo(() => {
    const groups = {};
    REQUIREMENTS.forEach(r => {
      if (!groups[r.jurisdiction]) groups[r.jurisdiction] = { jurisdiction: r.jurisdiction, total: 0, compliant: 0, overdue: 0, totalCompletion: 0, totalHours: 0 };
      groups[r.jurisdiction].total++;
      if (r.status === 'Compliant') groups[r.jurisdiction].compliant++;
      if (r.status === 'Overdue') groups[r.jurisdiction].overdue++;
      groups[r.jurisdiction].totalCompletion += r.completionPct;
      groups[r.jurisdiction].totalHours += r.estimatedHours;
    });
    return Object.values(groups).map(g => ({
      ...g,
      avgCompletion: parseFloat((g.total > 0 ? g.totalCompletion / g.total : 0).toFixed(1)),
      complianceRate: parseFloat((g.total > 0 ? g.compliant / g.total * 100 : 0).toFixed(1)),
    }));
  }, []);

  const frameworkGaps = useMemo(() => {
    const groups = {};
    REQUIREMENTS.forEach(r => {
      if (!groups[r.framework]) groups[r.framework] = { framework: r.framework, totalGaps: 0, count: 0, totalHours: 0 };
      groups[r.framework].totalGaps += r.gapCount;
      groups[r.framework].count++;
      groups[r.framework].totalHours += r.estimatedHours;
    });
    return Object.values(groups).map(g => ({
      ...g,
      avgGaps: parseFloat((g.count > 0 ? g.totalGaps / g.count : 0).toFixed(1)),
    }));
  }, []);

  const resourceData = useMemo(() => {
    const groups = {};
    RESPONSIBLE.forEach(r => { groups[r] = { team: r, required: 0, count: 0 }; });
    REQUIREMENTS.forEach(r => {
      if (groups[r.responsible]) {
        groups[r.responsible].required += r.estimatedHours * (1 - r.completionPct / 100);
        groups[r.responsible].count++;
      }
    });
    return Object.values(groups).map(g => ({
      ...g,
      required: Math.round(g.required),
      available: Math.round(availableHours * (0.5 + sr(RESPONSIBLE.indexOf(g.team) * 7) * 0.5)),
      shortfall: Math.max(0, Math.round(g.required - availableHours * (0.5 + sr(RESPONSIBLE.indexOf(g.team) * 7) * 0.5))),
    }));
  }, [availableHours]);

  const quarterlyTimeline = useMemo(() => {
    const quarters = { 'Q1 2026': 0, 'Q2 2026': 0, 'Q3 2026': 0, 'Q4 2026': 0, 'Q1 2027': 0, 'Q2 2027': 0 };
    REQUIREMENTS.forEach(r => {
      const d = new Date(r.deadline);
      const yr = d.getFullYear();
      const q = Math.ceil((d.getMonth() + 1) / 3);
      const key = `Q${q} ${yr}`;
      if (quarters[key] !== undefined) quarters[key]++;
    });
    return Object.entries(quarters).map(([quarter, count]) => ({ quarter, count }));
  }, []);

  const riskScore = useMemo(() => {
    const urgency = (days) => days < 0 ? 3 : days < 30 ? 2.5 : days < 60 ? 2 : days < 90 ? 1.5 : 1;
    const priorityW = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    if (!REQUIREMENTS.length) return 0;
    const total = REQUIREMENTS.reduce((s, r) => s + priorityW[r.priority] * (1 - r.completionPct / 100) * urgency(r.daysToDeadline), 0);
    return parseFloat((total / REQUIREMENTS.length).toFixed(2));
  }, []);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const toggleJurisdiction = (j) => {
    setJurisdictionFilter(prev => prev.includes(j) ? prev.filter(x => x !== j) : [...prev, j]);
  };

  const statusColor = (s) => ({ Compliant: T.green, 'In Progress': T.blue, Overdue: T.red, 'Not Started': T.muted }[s] || T.muted);
  const statusBg = (s) => ({ Compliant: '#dcfce7', 'In Progress': '#dbeafe', Overdue: '#fee2e2', 'Not Started': '#f3f4f6' }[s] || '#f3f4f6');
  const priorityColor = (p) => ({ Critical: T.red, High: T.orange, Medium: T.amber, Low: T.teal }[p] || T.muted);

  const KpiCard = ({ label, value, sub, color }) => (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1 }}>
      <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 4, height: 32, background: T.purple, borderRadius: 2 }} />
            <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: 0 }}>Regulatory Deadline Tracker</h1>
            <span style={{ background: T.purple, color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}>EP-CY3</span>
          </div>
          <p style={{ color: T.muted, margin: 0, marginLeft: 16, fontSize: 13 }}>80 requirements · 20 jurisdictions · 18 frameworks · Real-time compliance scoring</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <KpiCard label="Compliance Score" value={`${complianceScore}%`} sub="avg completion" color={complianceScore > 70 ? T.green : complianceScore > 40 ? T.amber : T.red} />
          <KpiCard label="Compliant" value={statusCounts['Compliant']} sub="requirements" color={T.green} />
          <KpiCard label="Overdue" value={statusCounts['Overdue']} sub="past deadline" color={T.red} />
          <KpiCard label="In Progress" value={statusCounts['In Progress']} sub="active" color={T.blue} />
          <KpiCard label="Compliance Risk" value={riskScore} sub="composite risk score" color={riskScore > 2 ? T.red : riskScore > 1 ? T.amber : T.green} />
          <KpiCard label="Total Reqs" value={80} sub="20 jurisdictions" />
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${T.border}` }}>
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              padding: '8px 14px', border: 'none', background: activeTab === i ? T.purple : 'transparent',
              color: activeTab === i ? '#fff' : T.muted, borderRadius: '6px 6px 0 0', cursor: 'pointer',
              fontWeight: activeTab === i ? 600 : 400, fontSize: 12,
            }}>{t}</button>
          ))}
        </div>

        {/* Filter Row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search requirements…"
            style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, width: 200 }} />
          <select value={frameworkFilter} onChange={e => setFrameworkFilter(e.target.value)}
            style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
            <option value="All">All Frameworks</option>
            {FRAMEWORKS.map(f => <option key={f}>{f}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
            <option value="All">All Status</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
            <option value="All">All Priorities</option>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
          <select value={deadlineWindow} onChange={e => setDeadlineWindow(e.target.value)}
            style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
            <option value="All">All Deadlines</option>
            {['30','60','90','180'].map(d => <option key={d} value={d}>Next {d} days</option>)}
          </select>
        </div>

        {/* TAB 0 — Compliance Dashboard */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, alignSelf: 'flex-start' }}>Overall Compliance Gauge</h3>
                <div style={{ width: 160, height: 160, borderRadius: '50%', border: `16px solid ${complianceScore > 70 ? T.green : complianceScore > 40 ? T.amber : T.red}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div style={{ fontSize: 36, fontWeight: 700, color: complianceScore > 70 ? T.green : complianceScore > 40 ? T.amber : T.red }}>{complianceScore}%</div>
                  <div style={{ fontSize: 11, color: T.muted }}>Compliance</div>
                </div>
                <div style={{ marginTop: 16, width: '100%' }}>
                  {STATUSES.map(s => (
                    <div key={s} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(s) }} />
                        <span style={{ fontSize: 12 }}>{s}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: statusColor(s) }}>{statusCounts[s]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Upcoming Deadlines (next 90 days)</h3>
                <div style={{ overflowY: 'auto', maxHeight: 280 }}>
                  {[...REQUIREMENTS].filter(r => r.daysToDeadline >= 0 && r.daysToDeadline <= 90).sort((a,b) => a.daysToDeadline - b.daysToDeadline).slice(0,15).map(r => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{r.requirementName}</div>
                        <div style={{ fontSize: 11, color: T.muted }}>{r.framework} · {r.jurisdiction}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: r.daysToDeadline < 30 ? T.red : r.daysToDeadline < 60 ? T.amber : T.text }}>{r.daysToDeadline}d</div>
                        <span style={{ fontSize: 10, background: statusBg(r.status), color: statusColor(r.status), padding: '1px 6px', borderRadius: 4 }}>{r.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Compliance by Framework</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={frameworkGaps.map(f => ({
                  ...f,
                  complianceRate: parseFloat((REQUIREMENTS.filter(r => r.framework === f.framework && r.status === 'Compliant').length / (REQUIREMENTS.filter(r => r.framework === f.framework).length || 1) * 100).toFixed(1)),
                })).sort((a,b)=>b.complianceRate-a.complianceRate)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="framework" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip />
                  <Bar dataKey="complianceRate" fill={T.purple} radius={[2,2,0,0]} name="Compliance %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 1 — Requirement Tracker */}
        {activeTab === 1 && (
          <div>
            <div style={{ marginBottom: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {JURISDICTIONS.slice(0, 10).map(j => (
                <button key={j} onClick={() => toggleJurisdiction(j)} style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer', background: jurisdictionFilter.includes(j) ? T.purple : T.card, color: jurisdictionFilter.includes(j) ? '#fff' : T.muted }}>
                  {j}
                </button>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', maxHeight: 520, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['requirementName','framework','jurisdiction','deadline','daysToDeadline','status','completionPct','priority','responsible','estimatedHours','gapCount'].map(col => (
                        <th key={col} onClick={() => handleSort(col)} style={{ padding: '7px 10px', textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 11, fontWeight: 600, color: sortCol === col ? T.purple : T.text }}>
                          {col.replace(/([A-Z])/g, ' $1')} {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReqs.map((r, idx) => (
                      <tr key={r.id} onClick={() => setSelectedReq(selectedReq?.id === r.id ? null : r)}
                        style={{ background: selectedReq?.id === r.id ? '#f5f3ff' : idx % 2 === 0 ? '#fff' : T.sub, cursor: 'pointer', borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '7px 10px', fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.requirementName}</td>
                        <td style={{ padding: '7px 10px' }}><span style={{ background: T.sub, padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>{r.framework}</span></td>
                        <td style={{ padding: '7px 10px' }}>{r.jurisdiction}</td>
                        <td style={{ padding: '7px 10px', whiteSpace: 'nowrap', fontSize: 11 }}>{r.deadline}</td>
                        <td style={{ padding: '7px 10px', fontWeight: 700, color: r.daysToDeadline < 0 ? T.red : r.daysToDeadline < 30 ? T.amber : T.text }}>{r.daysToDeadline}d</td>
                        <td style={{ padding: '7px 10px' }}>
                          <span style={{ background: statusBg(r.status), color: statusColor(r.status), padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{r.status}</span>
                        </td>
                        <td style={{ padding: '7px 10px', minWidth: 90 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ flex: 1, background: T.border, borderRadius: 4, overflow: 'hidden', height: 6 }}>
                              <div style={{ height: '100%', background: statusColor(r.status), width: `${r.completionPct}%` }} />
                            </div>
                            <span style={{ fontSize: 10, color: T.muted, minWidth: 28 }}>{r.completionPct}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '7px 10px' }}><span style={{ color: priorityColor(r.priority), fontWeight: 600, fontSize: 11 }}>{r.priority}</span></td>
                        <td style={{ padding: '7px 10px', fontSize: 11, whiteSpace: 'nowrap' }}>{r.responsible}</td>
                        <td style={{ padding: '7px 10px' }}>{r.estimatedHours}h</td>
                        <td style={{ padding: '7px 10px', color: r.gapCount > 0 ? T.red : T.green, fontWeight: 600 }}>{r.gapCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {selectedReq && (
              <div style={{ background: T.card, border: `1px solid ${T.purple}`, borderRadius: 8, padding: 16, marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h3 style={{ margin: 0, color: T.purple }}>{selectedReq.requirementName}</h3>
                  <button onClick={() => setSelectedReq(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: T.muted }}>×</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {[['Framework', selectedReq.framework],['Jurisdiction', selectedReq.jurisdiction],['Deadline', selectedReq.deadline],['Days Remaining', `${selectedReq.daysToDeadline}d`],['Status', selectedReq.status],['Completion', `${selectedReq.completionPct}%`],['Priority', selectedReq.priority],['Responsible', selectedReq.responsible],['Est. Hours', `${selectedReq.estimatedHours}h`],['Gaps', selectedReq.gapCount],['Evidence Items', selectedReq.evidenceItems],['Linked Reports', selectedReq.linkedReports]].map(([k,v]) => (
                    <div key={k} style={{ background: T.sub, borderRadius: 5, padding: '7px 10px' }}>
                      <div style={{ fontSize: 10, color: T.muted }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2 — Jurisdiction Map */}
        {activeTab === 2 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Compliance Rate by Jurisdiction</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[...jurisdictionStats].sort((a,b) => b.complianceRate - a.complianceRate)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="jurisdiction" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip />
                  <ReferenceLine y={70} stroke={T.green} strokeDasharray="4 2" label={{ value: '70% Target', fontSize: 10 }} />
                  <Bar dataKey="complianceRate" fill={T.purple} radius={[2,2,0,0]} name="Compliance Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Jurisdiction','Requirements','Compliant','Overdue','Avg Completion','Compliance Rate','Total Hours'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...jurisdictionStats].sort((a,b) => b.complianceRate - a.complianceRate).map((j, i) => (
                    <tr key={j.jurisdiction} style={{ background: i % 2 === 0 ? '#fff' : T.sub, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{j.jurisdiction}</td>
                      <td style={{ padding: '8px 12px' }}>{j.total}</td>
                      <td style={{ padding: '8px 12px', color: T.green, fontWeight: 600 }}>{j.compliant}</td>
                      <td style={{ padding: '8px 12px', color: j.overdue > 0 ? T.red : T.muted, fontWeight: j.overdue > 0 ? 600 : 400 }}>{j.overdue}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 60, background: T.border, borderRadius: 3, overflow: 'hidden', height: 5 }}>
                            <div style={{ height: '100%', background: T.purple, width: `${j.avgCompletion}%` }} />
                          </div>
                          <span style={{ fontSize: 11 }}>{j.avgCompletion}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 12px', color: j.complianceRate > 70 ? T.green : j.complianceRate > 40 ? T.amber : T.red, fontWeight: 700 }}>{j.complianceRate}%</td>
                      <td style={{ padding: '8px 12px' }}>{j.totalHours.toLocaleString()}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3 — Resource Planning */}
        {activeTab === 3 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Available Hours per Team:</label>
                <input type="range" min="100" max="2000" step="50" value={availableHours} onChange={e => setAvailableHours(Number(e.target.value))}
                  style={{ width: 200 }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: T.purple }}>{availableHours}h</span>
              </div>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Required vs Available Hours by Team</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={resourceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="team" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="required" fill={T.red} name="Hours Required" radius={[2,2,0,0]} />
                  <Bar dataKey="available" fill={T.green} name="Hours Available" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Team','Requirements','Hours Required','Hours Available','Shortfall','Status'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resourceData.map((r, i) => (
                    <tr key={r.team} style={{ background: i % 2 === 0 ? '#fff' : T.sub, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{r.team}</td>
                      <td style={{ padding: '8px 12px' }}>{r.count}</td>
                      <td style={{ padding: '8px 12px', color: T.orange, fontWeight: 600 }}>{r.required.toLocaleString()}h</td>
                      <td style={{ padding: '8px 12px', color: T.green, fontWeight: 600 }}>{r.available.toLocaleString()}h</td>
                      <td style={{ padding: '8px 12px', color: r.shortfall > 0 ? T.red : T.green, fontWeight: 700 }}>
                        {r.shortfall > 0 ? `-${r.shortfall.toLocaleString()}h` : 'Sufficient'}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: r.shortfall > 0 ? '#fee2e2' : '#dcfce7', color: r.shortfall > 0 ? T.red : T.green, padding: '2px 7px', borderRadius: 4, fontSize: 11 }}>
                          {r.shortfall > 0 ? 'Under-resourced' : 'OK'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4 — Gap Analysis */}
        {activeTab === 4 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Total Gaps by Framework</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={[...frameworkGaps].sort((a,b) => b.totalGaps - a.totalGaps)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="framework" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={55} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="totalGaps" fill={T.red} radius={[2,2,0,0]} name="Total Gaps" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Remediation Priority Matrix</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {PRIORITIES.map(p => {
                    const reqs = REQUIREMENTS.filter(r => r.priority === p && r.status !== 'Compliant');
                    const totalGaps = reqs.reduce((s, r) => s + r.gapCount, 0);
                    return (
                      <div key={p} style={{ background: T.sub, borderRadius: 6, padding: '10px 12px', borderLeft: `4px solid ${priorityColor(p)}` }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: priorityColor(p) }}>{p}</div>
                        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{totalGaps}</div>
                        <div style={{ fontSize: 11, color: T.muted }}>{reqs.length} requirements · {totalGaps} total gaps</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: T.text }}>Top Frameworks by Gap Count</div>
                  {[...frameworkGaps].sort((a,b)=>b.totalGaps-a.totalGaps).slice(0,5).map(f => (
                    <div key={f.framework} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 12 }}>{f.framework}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.red }}>{f.totalGaps} gaps</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5 — Timeline View */}
        {activeTab === 5 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Deadline Distribution by Quarter</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={quarterlyTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={T.purple} radius={[3,3,0,0]} name="Deadlines" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {['Overdue','Critical','High'].map(cat => {
                const reqs = REQUIREMENTS.filter(r => cat === 'Overdue' ? r.status === 'Overdue' : r.priority === cat && r.status !== 'Compliant');
                return (
                  <div key={cat} style={{ background: T.card, border: `1px solid ${cat === 'Overdue' ? T.red : T.border}`, borderRadius: 8, padding: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: cat === 'Overdue' ? T.red : cat === 'Critical' ? T.orange : T.amber, marginBottom: 8 }}>{cat} ({reqs.length})</div>
                    {reqs.slice(0,5).map(r => (
                      <div key={r.id} style={{ padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                        <div style={{ fontWeight: 600 }}>{r.requirementName}</div>
                        <div style={{ color: T.muted }}>{r.framework} · {r.jurisdiction} · {r.deadline}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 6 — Summary & Export */}
        {activeTab === 6 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Regulatory Compliance Full Scorecard</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  ['Total Requirements', 80],['Jurisdictions', 20],['Frameworks', 18],
                  ['Compliance Score', `${complianceScore}%`],['Compliant', statusCounts['Compliant']],
                  ['In Progress', statusCounts['In Progress']],['Overdue', statusCounts['Overdue']],
                  ['Not Started', statusCounts['Not Started']],['Compliance Risk Score', riskScore],
                  ['Total Gaps', REQUIREMENTS.reduce((s,r)=>s+r.gapCount,0)],
                  ['Total Est. Hours', REQUIREMENTS.reduce((s,r)=>s+r.estimatedHours,0).toLocaleString()],
                  ['Critical Reqs', REQUIREMENTS.filter(r=>r.priority==='Critical').length],
                ].map(([k,v]) => (
                  <div key={k} style={{ background: T.sub, borderRadius: 6, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase' }}>{k}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginTop: 3 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', background: T.sub, borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>All 80 Requirements Export</span>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['ID','Framework','Jurisdiction','Requirement','Deadline','Days','Status','Completion','Priority','Gaps','Hours'].map(h => (
                        <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {REQUIREMENTS.map((r, idx) => (
                      <tr key={r.id} style={{ background: idx % 2 === 0 ? '#fff' : T.sub, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '5px 8px' }}>R{String(r.id+1).padStart(3,'0')}</td>
                        <td style={{ padding: '5px 8px' }}>{r.framework}</td>
                        <td style={{ padding: '5px 8px' }}>{r.jurisdiction}</td>
                        <td style={{ padding: '5px 8px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.requirementName}</td>
                        <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>{r.deadline}</td>
                        <td style={{ padding: '5px 8px', color: r.daysToDeadline < 0 ? T.red : r.daysToDeadline < 30 ? T.amber : T.text, fontWeight: 600 }}>{r.daysToDeadline}</td>
                        <td style={{ padding: '5px 8px' }}><span style={{ background: statusBg(r.status), color: statusColor(r.status), padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>{r.status}</span></td>
                        <td style={{ padding: '5px 8px' }}>{r.completionPct}%</td>
                        <td style={{ padding: '5px 8px', color: priorityColor(r.priority) }}>{r.priority}</td>
                        <td style={{ padding: '5px 8px', color: r.gapCount > 0 ? T.red : T.green }}>{r.gapCount}</td>
                        <td style={{ padding: '5px 8px' }}>{r.estimatedHours}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Bottom analytics panels — always visible */}
        <div style={{ marginTop: 20 }}>
          {/* Compliance risk scores */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Compliance Risk Score Matrix — By Framework × Status</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    <th style={{ padding:'6px 10px', textAlign:'left', fontWeight:600 }}>Framework</th>
                    {STATUSES.map(s=><th key={s} style={{ padding:'6px 10px', textAlign:'center', fontWeight:600 }}>{s}</th>)}
                    <th style={{ padding:'6px 10px', textAlign:'center', fontWeight:600 }}>Total</th>
                    <th style={{ padding:'6px 10px', textAlign:'center', fontWeight:600 }}>Avg Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {FRAMEWORKS.map((fw,i)=>{
                    const fwReqs = REQUIREMENTS.filter(r=>r.framework===fw);
                    const avgCompl = fwReqs.length>0 ? fwReqs.reduce((s,r)=>s+r.completionPct,0)/fwReqs.length : 0;
                    return (
                      <tr key={fw} style={{ background:i%2===0?'#fff':T.sub, borderBottom:`1px solid ${T.border}` }}>
                        <td style={{ padding:'5px 10px', fontWeight:600 }}>{fw}</td>
                        {STATUSES.map(st=>{
                          const count = fwReqs.filter(r=>r.status===st).length;
                          return <td key={st} style={{ padding:'5px 10px', textAlign:'center', color:statusColor(st), fontWeight:count>0?600:400 }}>{count||'—'}</td>;
                        })}
                        <td style={{ padding:'5px 10px', textAlign:'center', fontWeight:600 }}>{fwReqs.length}</td>
                        <td style={{ padding:'5px 10px', textAlign:'center', color:avgCompl>70?T.green:avgCompl>40?T.amber:T.red, fontWeight:700 }}>{avgCompl.toFixed(0)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {/* Responsible party workload vs deadline urgency */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Responsible Party — Overdue & Critical Task Count</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {RESPONSIBLE.map(r=>{
                const reqs = REQUIREMENTS.filter(req=>req.responsible===r);
                const overdue = reqs.filter(req=>req.status==='Overdue').length;
                const critical = reqs.filter(req=>req.priority==='Critical').length;
                const urgentHours = reqs.filter(req=>req.daysToDeadline>=0&&req.daysToDeadline<=30).reduce((s,req)=>s+req.estimatedHours*(1-req.completionPct/100),0);
                return (
                  <div key={r} style={{ background:T.sub, borderRadius:6, padding:'10px 12px' }}>
                    <div style={{ fontSize:11, fontWeight:600, marginBottom:4 }}>{r}</div>
                    <div style={{ fontSize:11, color:T.muted }}>{reqs.length} total reqs</div>
                    <div style={{ fontSize:12, color:overdue>0?T.red:T.green }}>Overdue: <strong>{overdue}</strong></div>
                    <div style={{ fontSize:12, color:critical>0?T.orange:T.muted }}>Critical: <strong>{critical}</strong></div>
                    <div style={{ fontSize:11, color:T.amber }}>Urgent (30d): <strong>{urgentHours.toFixed(0)}h</strong></div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Cross-framework overlap efficiency */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Jurisdiction × Priority Risk Heatmap</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    <th style={{ padding:'5px 8px', textAlign:'left', fontWeight:600 }}>Jurisdiction</th>
                    {PRIORITIES.map(p=><th key={p} style={{ padding:'5px 8px', textAlign:'center', fontWeight:600, color:priorityColor(p) }}>{p}</th>)}
                    <th style={{ padding:'5px 8px', textAlign:'center', fontWeight:600 }}>Total Gaps</th>
                  </tr>
                </thead>
                <tbody>
                  {JURISDICTIONS.slice(0,12).map((jur,i)=>{
                    const jurReqs = REQUIREMENTS.filter(r=>r.jurisdiction===jur);
                    const totalGaps = jurReqs.reduce((s,r)=>s+r.gapCount,0);
                    return (
                      <tr key={jur} style={{ background:i%2===0?'#fff':T.sub, borderBottom:`1px solid ${T.border}` }}>
                        <td style={{ padding:'5px 8px', fontWeight:600 }}>{jur}</td>
                        {PRIORITIES.map(p=>{
                          const count = jurReqs.filter(r=>r.priority===p&&r.status!=='Compliant').length;
                          return <td key={p} style={{ padding:'5px 8px', textAlign:'center', background:count>2?`${priorityColor(p)}20`:'transparent', color:count>0?priorityColor(p):T.muted, fontWeight:count>0?700:400 }}>{count||'—'}</td>;
                        })}
                        <td style={{ padding:'5px 8px', textAlign:'center', color:totalGaps>5?T.red:T.muted, fontWeight:700 }}>{totalGaps}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Footer — Always-visible quick panels */}
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 13 }}>Overdue Requirements — Detail</h4>
            {REQUIREMENTS.filter(r=>r.status==='Overdue').slice(0,8).map(r=>(
              <div key={r.id} style={{ padding:'4px 0', borderBottom:`1px solid ${T.border}`, fontSize:11 }}>
                <div style={{ fontWeight:600, color:T.red }}>{r.requirementName}</div>
                <div style={{ color:T.muted }}>{r.framework} · {r.jurisdiction} · {Math.abs(r.daysToDeadline)}d overdue</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 13 }}>Not Started — Highest Priority</h4>
            {[...REQUIREMENTS].filter(r=>r.status==='Not Started').sort((a,b)=>{
              const pw={Critical:4,High:3,Medium:2,Low:1};
              return (pw[b.priority]||0)-(pw[a.priority]||0);
            }).slice(0,8).map(r=>(
              <div key={r.id} style={{ padding:'4px 0', borderBottom:`1px solid ${T.border}`, fontSize:11 }}>
                <div style={{ fontWeight:600 }}>{r.requirementName}</div>
                <div style={{ color:priorityColor(r.priority) }}>{r.priority} · {r.framework} · {r.daysToDeadline}d</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 13 }}>Compliance Milestones — Next 30 Days</h4>
            {[...REQUIREMENTS].filter(r=>r.daysToDeadline>=0&&r.daysToDeadline<=30&&r.status!=='Compliant').sort((a,b)=>a.daysToDeadline-b.daysToDeadline).slice(0,8).map(r=>(
              <div key={r.id} style={{ padding:'4px 0', borderBottom:`1px solid ${T.border}`, fontSize:11 }}>
                <div style={{ fontWeight:600 }}>{r.requirementName}</div>
                <div style={{ color:r.daysToDeadline<7?T.red:T.amber }}>{r.daysToDeadline}d · {r.completionPct}% done · {r.responsible}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Hours remaining heatmap */}
        <div style={{ marginTop: 14, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13 }}>Hours Remaining by Framework × Priority</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: T.sub }}>
                <th style={{ padding:'5px 8px', textAlign:'left', fontWeight:600 }}>Framework</th>
                {PRIORITIES.map(p=><th key={p} style={{ padding:'5px 8px', textAlign:'center', fontWeight:600, color:priorityColor(p) }}>{p}</th>)}
                <th style={{ padding:'5px 8px', textAlign:'center', fontWeight:600 }}>Total Hrs</th>
              </tr>
            </thead>
            <tbody>
              {FRAMEWORKS.map((fw,i)=>{
                const fwReqs = REQUIREMENTS.filter(r=>r.framework===fw);
                const totalHrs = fwReqs.reduce((s,r)=>s+r.estimatedHours*(1-r.completionPct/100),0);
                return (
                  <tr key={fw} style={{ background:i%2===0?'#fff':T.sub, borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:'4px 8px', fontWeight:600 }}>{fw}</td>
                    {PRIORITIES.map(p=>{
                      const hrs = fwReqs.filter(r=>r.priority===p).reduce((s,r)=>s+r.estimatedHours*(1-r.completionPct/100),0);
                      return <td key={p} style={{ padding:'4px 8px', textAlign:'center', color:hrs>200?priorityColor(p):T.muted }}>{hrs>0?Math.round(hrs)+'h':'—'}</td>;
                    })}
                    <td style={{ padding:'4px 8px', textAlign:'center', fontWeight:700 }}>{Math.round(totalHrs)}h</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Key framework compliance trajectory */}
        <div style={{ marginTop:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <h4 style={{ margin:'0 0 10px', fontSize:13 }}>Compliance Trajectory — Days-to-Deadline vs Completion% (Top 20 requirements)</h4>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
            {[...REQUIREMENTS].sort((a,b)=>a.daysToDeadline-b.daysToDeadline).slice(0,20).map((r,i)=>{
              const urgencyColor = r.daysToDeadline<0?T.red:r.daysToDeadline<30?T.orange:r.daysToDeadline<60?T.amber:T.teal;
              return (
                <div key={r.id} style={{ background:T.sub, borderRadius:6, padding:'6px 8px' }}>
                  <div style={{ fontSize:9, color:T.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.requirementName}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:3 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:urgencyColor }}>{r.daysToDeadline}d</span>
                    <span style={{ fontSize:11, fontWeight:700, color:r.completionPct>70?T.green:T.amber }}>{r.completionPct}%</span>
                  </div>
                  <div style={{ marginTop:3, background:T.border, borderRadius:3, overflow:'hidden', height:4 }}>
                    <div style={{ height:'100%', background:statusColor(r.status), width:`${r.completionPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Jurisdiction compliance leader board */}
        <div style={{ marginTop: 14, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 13 }}>Jurisdiction Compliance Leaderboard</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
            {[...jurisdictionStats].sort((a,b)=>b.complianceRate-a.complianceRate).slice(0,10).map((j,i)=>(
              <div key={j.jurisdiction} style={{ background:T.sub, borderRadius:6, padding:'8px 10px', borderTop:`3px solid ${j.complianceRate>70?T.green:j.complianceRate>40?T.amber:T.red}` }}>
                <div style={{ fontSize:11, fontWeight:600 }}>{j.jurisdiction}</div>
                <div style={{ fontSize:18, fontWeight:800, color:j.complianceRate>70?T.green:j.complianceRate>40?T.amber:T.red, marginTop:3 }}>{j.complianceRate}%</div>
                <div style={{ fontSize:10, color:T.muted }}>{j.compliant}/{j.total} compliant</div>
              </div>
            ))}
          </div>
        </div>
        {/* Completion progress bands */}
        <div style={{ marginTop: 14, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13 }}>Requirements by Completion Band</h4>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
            {[[0,20,'Not Started'],[20,40,'Early Stage'],[40,60,'Mid Stage'],[60,80,'Advanced'],[80,100,'Near Complete']].map(([min,max,label])=>{
              const reqs = REQUIREMENTS.filter(r=>r.completionPct>=min&&r.completionPct<(max===100?101:max));
              const critical = reqs.filter(r=>r.priority==='Critical').length;
              const overdue = reqs.filter(r=>r.status==='Overdue').length;
              const color = min<20?T.red:min<40?T.orange:min<60?T.amber:min<80?T.blue:T.green;
              return (
                <div key={label} style={{ background:T.sub, borderRadius:6, padding:'8px 10px', borderTop:`3px solid ${color}` }}>
                  <div style={{ fontSize:10, color:T.muted }}>{min}–{max}%</div>
                  <div style={{ fontSize:12, fontWeight:600 }}>{label}</div>
                  <div style={{ fontSize:20, fontWeight:800, color, marginTop:3 }}>{reqs.length}</div>
                  <div style={{ fontSize:10, color:T.muted }}>{critical} critical · {overdue} overdue</div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Evidence items and linked reports summary */}
        <div style={{ marginTop: 14, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13 }}>Evidence & Documentation Status — All 80 Requirements</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
            {[
              ['Total Evidence Items', REQUIREMENTS.reduce((s,r)=>s+r.evidenceItems,0)],
              ['Avg Evidence per Req', (REQUIREMENTS.reduce((s,r)=>s+r.evidenceItems,0)/REQUIREMENTS.length).toFixed(1)],
              ['Total Linked Reports', REQUIREMENTS.reduce((s,r)=>s+r.linkedReports,0)],
              ['Zero Evidence (gap)', REQUIREMENTS.filter(r=>r.evidenceItems===0).length],
              ['Total Hours Remaining', REQUIREMENTS.reduce((s,r)=>s+r.estimatedHours*(1-r.completionPct/100),0).toFixed(0)+'h'],
            ].map(([k,v])=>(
              <div key={k} style={{ background:T.sub, borderRadius:6, padding:'8px 12px' }}>
                <div style={{ fontSize:10, color:T.muted, textTransform:'uppercase' }}>{k}</div>
                <div style={{ fontSize:18, fontWeight:700, marginTop:3 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Final compliance notes */}
        <div style={{ marginTop:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <h4 style={{ margin:'0 0 10px', fontSize:13 }}>Cross-Framework Overlap Efficiency Scores</h4>
          <div style={{ fontSize:12, color:T.muted, marginBottom:8 }}>Frameworks sharing evidence items allow efficiency gains. Score = shared requirements / total requirements per pair.</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
            {[['CSRD + ISSB', 0.72],['CSRD + EU Taxonomy', 0.65],['ISSB + TCFD', 0.81],['SFDR + EU Taxonomy', 0.58],['TCFD + CDP', 0.74],['GRI + CSRD', 0.60],['ISSB + TCFD + CDP', 0.69],['SFDR + ISSB', 0.43]].map(([pair,score])=>(
              <div key={pair} style={{ background:T.sub, borderRadius:6, padding:'8px 10px' }}>
                <div style={{ fontSize:10, color:T.muted }}>{pair}</div>
                <div style={{ fontSize:16, fontWeight:700, color:score>0.7?T.green:score>0.5?T.teal:T.amber, marginTop:2 }}>{(score*100).toFixed(0)}%</div>
                <div style={{ fontSize:10, color:T.muted }}>overlap efficiency</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <h4 style={{ margin:'0 0 10px', fontSize:13 }}>Regulatory Calendar — Key Upcoming Milestones</h4>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {[...REQUIREMENTS].filter(r=>r.daysToDeadline>=0&&r.daysToDeadline<=90&&r.priority==='Critical').sort((a,b)=>a.daysToDeadline-b.daysToDeadline).slice(0,9).map(r=>(
              <div key={r.id} style={{ background:T.sub, borderRadius:6, padding:'8px 10px', borderLeft:`3px solid ${r.daysToDeadline<30?T.red:T.amber}` }}>
                <div style={{ fontSize:11, fontWeight:600 }}>{r.requirementName}</div>
                <div style={{ fontSize:10, color:T.muted }}>{r.framework} · {r.jurisdiction}</div>
                <div style={{ fontSize:11, color:r.daysToDeadline<30?T.red:T.amber, fontWeight:700, marginTop:3 }}>{r.daysToDeadline}d · {r.completionPct}%</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <h4 style={{ margin:'0 0 10px', fontSize:13 }}>Responsible Party Workload Summary</h4>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
            {['Compliance Team','Legal Counsel','Finance Dept','Sustainability Office','IR Team','Risk Committee','Board Secretary','Operations'].map((party,pi)=>{
              const items = REQUIREMENTS.filter(r=>r.responsible===party);
              const totalHrs = items.reduce((a,r)=>a+r.estimatedHours,0);
              const critical = items.filter(r=>r.priority==='Critical').length;
              return (
                <div key={party} style={{ background:T.sub, borderRadius:6, padding:'8px 10px' }}>
                  <div style={{ fontSize:11, fontWeight:600 }}>{party}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginTop:2 }}>{items.length} items</div>
                  <div style={{ fontSize:10, color:T.muted }}>{totalHrs}h · {critical} critical</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ marginTop:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <h4 style={{ margin:'0 0 10px', fontSize:13 }}>Jurisdiction Completion Leaderboard</h4>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {['EU','UK','USA','Switzerland','Australia','Singapore','Canada','Japan'].map((j,ji)=>{
              const jItems = REQUIREMENTS.filter(r=>r.jurisdiction===j||r.jurisdiction.includes(j));
              const avgComp = jItems.length>0 ? Math.round(jItems.reduce((a,r)=>a+r.completionPct,0)/jItems.length) : 0;
              return (
                <div key={j} style={{ background:T.sub, borderRadius:6, padding:'8px 12px', minWidth:80, textAlign:'center' }}>
                  <div style={{ fontSize:12, fontWeight:600 }}>{j}</div>
                  <div style={{ fontSize:18, fontWeight:700, color:avgComp>=75?T.green:avgComp>=50?T.amber:T.red, marginTop:2 }}>{avgComp}%</div>
                  <div style={{ fontSize:10, color:T.muted }}>{jItems.length} items</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
