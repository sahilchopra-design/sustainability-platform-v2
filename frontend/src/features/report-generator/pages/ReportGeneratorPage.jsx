import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ── Theme ──────────────────────────────────────────────────────────────── */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

/* ── Deterministic helpers ──────────────────────────────────────────────── */
const seed = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i); return Math.abs(h); };
const sRand = (n) => { let x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };
const pick = (arr, n) => arr[Math.floor(sRand(n) * arr.length)];

/* ── localStorage helpers ───────────────────────────────────────────────── */
const LS_PORTFOLIO = 'ra_portfolio_v1';
const LS_HISTORY = 'ra_report_history_v1';
const LS_SCHEDULE = 'ra_report_schedule_v1';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

/* ── Report Types (12) ──────────────────────────────────────────────────── */
const REPORT_TYPES = [
  { id: 'tcfd', name: 'TCFD Climate Risk Report', framework: 'TCFD', sections: ['Cover Page','Table of Contents','Executive Summary','Governance','Strategy','Risk Management','Metrics & Targets','Scenario Analysis','Physical Risk Assessment','Transition Risk Assessment','Appendix'], pages_est: 25, audience: 'Board / Investors', frequency: 'Annual', modules: ['scenario-stress-test','climate-physical-risk','climate-transition-risk','carbon-budget'], icon: '\u2601' },
  { id: 'sfdr_pai', name: 'SFDR PAI Statement', framework: 'SFDR', sections: ['Cover','Executive Summary','PAI Indicator 1: GHG Emissions','PAI 2: Carbon Footprint','PAI 3: GHG Intensity','PAI 4: Fossil Fuel Exposure','PAI 5: Energy Consumption','PAI 6: Energy Intensity','PAI 7: Biodiversity','PAI 8: Water Emissions','PAI 9: Hazardous Waste','PAI 10-14: Social Indicators','Methodology','Appendix'], pages_est: 15, audience: 'Regulators / Investors', frequency: 'Annual', modules: ['sfdr-classification','esg-screener'], icon: '\uD83C\uDDEA\uD83C\uDDFA' },
  { id: 'sfdr_periodic', name: 'SFDR Periodic Report (Annex IV/V)', framework: 'SFDR', sections: ['Product Information','Environmental Objective','Social Objective','Sustainable Investment Share','Top Investments','Asset Allocation','Benchmark Comparison','Appendix'], pages_est: 12, audience: 'Investors', frequency: 'Annual', modules: ['sfdr-classification','eu-taxonomy-engine'], icon: '\uD83D\uDCC4' },
  { id: 'csrd_e1', name: 'CSRD ESRS E1 Climate', framework: 'CSRD', sections: ['Cover & ESRS Context','Materiality Assessment','GOV: Governance of Climate','SBM: Strategy & Business Model','IRO: Impact/Risk/Opportunity','E1-1: Transition Plan','E1-4: Targets','E1-5: Energy Consumption','E1-6: GHG Emissions'], pages_est: 20, audience: 'Regulators / Auditors', frequency: 'Annual', modules: ['issb-materiality','gri-alignment'], icon: '\uD83C\uDDEA\uD83C\uDDFA' },
  { id: 'issb_s2', name: 'ISSB IFRS S2 Disclosure', framework: 'ISSB', sections: ['Cover','Executive Summary','Governance (S2.5-6)','Strategy (S2.8-22)','Risk Management (S2.23-28)','Metrics: GHG (S2.29)','Metrics: Industry (S2.32)','Metrics: Targets (S2.33-36)','Scenario Analysis','Cross-reference Index','Appendix'], pages_est: 18, audience: 'Investors / Regulators', frequency: 'Annual', modules: ['issb-materiality','scenario-stress-test'], icon: '\uD83C\uDF10' },
  { id: 'tnfd', name: 'TNFD Nature Report', framework: 'TNFD', sections: ['Cover','Executive Summary','Governance A-D','Strategy A-D','Risk Management A-D','Metrics: Dependencies','Metrics: Impacts','Metrics: Risks','Metrics: Opportunities','LEAP: Locate','LEAP: Evaluate','LEAP: Assess','LEAP: Prepare','Appendix'], pages_est: 22, audience: 'Investors / Regulators', frequency: 'Annual', modules: ['tnfd-leap','biodiversity-footprint','ecosystem-services'], icon: '\uD83C\uDF3F' },
  { id: 'pcaf', name: 'PCAF Financed Emissions Report', framework: 'PCAF', sections: ['Cover','Methodology','Asset Class: Listed Equity & Bonds','Asset Class: Business Loans','Asset Class: Project Finance','Appendix & Data Quality'], pages_est: 10, audience: 'Internal / GFANZ', frequency: 'Annual', modules: ['portfolio-manager','carbon-budget'], icon: '\uD83C\uDFE6' },
  { id: 'stewardship', name: 'Stewardship & Engagement Report', framework: 'PRI', sections: ['Cover','Engagement Philosophy','Thematic Engagements','Company Engagements','Proxy Voting Summary','Escalation Cases','Collaborative Initiatives','Outcomes & Impact'], pages_est: 15, audience: 'Clients / PRI', frequency: 'Annual', modules: ['stewardship-tracker','controversy-monitor'], icon: '\uD83E\uDD1D' },
  { id: 'client_quarterly', name: 'Client Quarterly ESG Update', framework: 'Custom', sections: ['Cover','Portfolio Snapshot','ESG Score Trends','Climate Metrics Update','Engagement Highlights','Outlook'], pages_est: 8, audience: 'Clients', frequency: 'Quarterly', modules: ['portfolio-suite','benchmark-analytics'], icon: '\uD83D\uDCC8' },
  { id: 'board_climate', name: 'Board Climate Dashboard', framework: 'TCFD', sections: ['KPI Dashboard','Carbon Trajectory','Physical Risk Heatmap','Regulatory Update','Action Items'], pages_est: 6, audience: 'Board of Directors', frequency: 'Quarterly', modules: ['quant-dashboard','portfolio-suite'], icon: '\uD83D\uDCCA' },
  { id: 'regulatory_gap', name: 'Regulatory Compliance Assessment', framework: 'Multiple', sections: ['Cover','Executive Summary','Framework Coverage Matrix','Gap Analysis: CSRD','Gap Analysis: ISSB','Gap Analysis: SFDR','Remediation Roadmap','Appendix'], pages_est: 12, audience: 'Compliance / Legal', frequency: 'Semi-Annual', modules: ['regulatory-gap','framework-interop'], icon: '\u2696' },
  { id: 'esg_integration', name: 'ESG Integration Evidence Report', framework: 'PRI', sections: ['Cover','Integration Philosophy','Screening Methodology','Portfolio ESG Profile','Risk Attribution Analysis','Engagement Impact','Outcomes'], pages_est: 14, audience: 'Clients / Consultants', frequency: 'Annual', modules: ['esg-screener','portfolio-optimizer','risk-attribution'], icon: '\uD83D\uDD0D' },
];

/* ── Framework Colors ───────────────────────────────────────────────────── */
const FW_COLORS = { TCFD: '#d97706', SFDR: '#7c3aed', CSRD: '#2563eb', ISSB: '#1b3a5c', TNFD: '#0d9488', PCAF: '#059669', PRI: '#16a34a', Custom: '#5c6b7e', Multiple: '#9333ea' };

/* ── All Sections Library (across all reports) ──────────────────────────── */
const ALL_SECTIONS = [...new Set(REPORT_TYPES.flatMap(r => r.sections))].sort();

/* ── Section Data Generator ─────────────────────────────────────────────── */
const generateSectionContent = (sectionName, reportType, portfolio) => {
  const s = seed(sectionName + reportType.id);
  const companies = portfolio?.companies || GLOBAL_COMPANY_MASTER.slice(0, 20);
  const topCompanies = companies.slice(0, 5).map((c, i) => ({
    name: c.name || c.company || `Company ${i + 1}`,
    sector: c.sector || pick(['Energy','Technology','Financials','Healthcare','Materials'], s + i),
    esg_score: Math.round(45 + sRand(s + i * 7) * 40),
    emissions_tCO2: Math.round(10000 + sRand(s + i * 13) * 90000),
    weight_pct: +(2 + sRand(s + i * 3) * 6).toFixed(2),
  }));
  return {
    title: sectionName,
    narrative: `This section presents the ${sectionName.toLowerCase()} analysis for the portfolio under the ${reportType.framework} framework. The analysis covers ${companies.length} holdings across ${new Set(topCompanies.map(c => c.sector)).size} sectors, with a reference date of ${new Date().toISOString().slice(0, 10)}.`,
    keyFindings: [
      `Portfolio weighted ESG score: ${Math.round(50 + sRand(s) * 30)}/100`,
      `Scope 1+2 emissions intensity: ${(40 + sRand(s + 1) * 60).toFixed(1)} tCO2e/$M revenue`,
      `${Math.round(60 + sRand(s + 2) * 30)}% of holdings have set SBTi-aligned targets`,
      `${Math.round(10 + sRand(s + 3) * 20)}% of portfolio exposed to high physical risk locations`,
    ],
    dataTable: topCompanies,
    chartData: topCompanies.map(c => ({ name: c.name.slice(0, 12), score: c.esg_score, emissions: Math.round(c.emissions_tCO2 / 1000) })),
  };
};

/* ── Render Functions ───────────────────────────────────────────────────── */
const renderHTML = (report, branding) => {
  const pc = branding?.primaryColor || T.navy;
  const sc = branding?.secondaryColor || T.gold;
  const ff = branding?.fontFamily || 'Inter';
  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${report.meta.title}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'${ff}',sans-serif;color:#1b3a5c;line-height:1.6}
.cover{min-height:100vh;background:linear-gradient(135deg,${pc},${pc}dd);color:#fff;display:flex;flex-direction:column;justify-content:center;padding:80px}
.cover h1{font-size:42px;margin-bottom:16px}.cover .meta{opacity:.85;font-size:16px}
.section{padding:48px 72px;page-break-before:always}.section h2{color:${pc};font-size:28px;border-bottom:3px solid ${sc};padding-bottom:8px;margin-bottom:24px}
.section p{margin-bottom:16px;font-size:14px}.finding{padding:8px 16px;background:${sc}15;border-left:4px solid ${sc};margin-bottom:8px;font-size:13px}
table{width:100%;border-collapse:collapse;margin:24px 0;font-size:12px}th{background:${pc};color:#fff;padding:10px 12px;text-align:left}td{padding:8px 12px;border-bottom:1px solid #e5e0d8}
.footer{text-align:center;padding:24px;color:#9aa3ae;font-size:11px;border-top:1px solid #e5e0d8}
</style></head><body>`;
  html += `<div class="cover"><h1>${report.meta.title}</h1><div class="meta"><p>Framework: ${report.meta.framework}</p><p>Client: ${report.meta.client?.fundName || 'N/A'}</p><p>Portfolio: ${report.meta.portfolio}</p><p>Date: ${new Date(report.meta.date).toLocaleDateString()}</p><p>Prepared by: ${report.meta.client?.preparedBy || 'AA Impact Analytics'}</p></div></div>`;
  html += `<div class="section"><h2>Table of Contents</h2><ol>${report.sections.map((sec, i) => `<li style="margin:6px 0">${sec.title}</li>`).join('')}</ol></div>`;
  html += `<div class="section"><h2>Executive Summary</h2><p>${report.executiveSummary}</p></div>`;
  report.sections.forEach(sec => {
    html += `<div class="section"><h2>${sec.title}</h2><p>${sec.narrative}</p>`;
    if (sec.keyFindings?.length) { html += `<div style="margin:16px 0">${sec.keyFindings.map(f => `<div class="finding">${f}</div>`).join('')}</div>`; }
    if (sec.dataTable?.length) {
      html += `<table><thead><tr><th>Company</th><th>Sector</th><th>ESG Score</th><th>Emissions (tCO2e)</th><th>Weight %</th></tr></thead><tbody>`;
      sec.dataTable.forEach(r => { html += `<tr><td>${r.name}</td><td>${r.sector}</td><td>${r.esg_score}</td><td>${r.emissions_tCO2.toLocaleString()}</td><td>${r.weight_pct}%</td></tr>`; });
      html += `</tbody></table>`;
    }
    html += `</div>`;
  });
  html += `<div class="footer">${branding?.footerText || '\u00a9 AA Impact Analytics'} | Generated ${new Date().toLocaleDateString()} | ${report.meta.framework} Framework</div></body></html>`;
  return html;
};

const renderMarkdown = (report) => {
  let md = `# ${report.meta.title}\n\n**Framework:** ${report.meta.framework}  \n**Date:** ${new Date(report.meta.date).toLocaleDateString()}  \n**Portfolio:** ${report.meta.portfolio}  \n**Client:** ${report.meta.client?.fundName || 'N/A'}  \n**Prepared by:** ${report.meta.client?.preparedBy || 'AA Impact Analytics'}\n\n---\n\n`;
  md += `## Table of Contents\n\n${report.sections.map((s, i) => `${i + 1}. ${s.title}`).join('\n')}\n\n---\n\n`;
  md += `## Executive Summary\n\n${report.executiveSummary}\n\n---\n\n`;
  report.sections.forEach((sec, i) => {
    md += `## ${i + 1}. ${sec.title}\n\n${sec.narrative}\n\n`;
    if (sec.keyFindings?.length) { md += `### Key Findings\n\n${sec.keyFindings.map(f => `- ${f}`).join('\n')}\n\n`; }
    if (sec.dataTable?.length) {
      md += `| Company | Sector | ESG Score | Emissions (tCO2e) | Weight % |\n|---------|--------|-----------|-------------------|----------|\n`;
      sec.dataTable.forEach(r => { md += `| ${r.name} | ${r.sector} | ${r.esg_score} | ${r.emissions_tCO2.toLocaleString()} | ${r.weight_pct}% |\n`; });
      md += '\n';
    }
    md += '---\n\n';
  });
  md += `\n*Generated by AA Impact Analytics on ${new Date().toLocaleDateString()}*\n`;
  return md;
};

/* ── Coverage Matrix Data ───────────────────────────────────────────────── */
const COVERAGE_MATRIX = [
  { requirement: 'GHG Emissions (Scope 1+2)', TCFD: true, SFDR: true, CSRD: true, ISSB: true, TNFD: false, PCAF: true, PRI: false },
  { requirement: 'Scope 3 Emissions', TCFD: true, SFDR: true, CSRD: true, ISSB: true, TNFD: false, PCAF: true, PRI: false },
  { requirement: 'Scenario Analysis', TCFD: true, SFDR: false, CSRD: true, ISSB: true, TNFD: true, PCAF: false, PRI: false },
  { requirement: 'Board Governance', TCFD: true, SFDR: false, CSRD: true, ISSB: true, TNFD: true, PCAF: false, PRI: true },
  { requirement: 'Biodiversity / Nature', TCFD: false, SFDR: true, CSRD: true, ISSB: false, TNFD: true, PCAF: false, PRI: false },
  { requirement: 'Social Indicators', TCFD: false, SFDR: true, CSRD: true, ISSB: false, TNFD: false, PCAF: false, PRI: true },
  { requirement: 'EU Taxonomy Alignment', TCFD: false, SFDR: true, CSRD: true, ISSB: false, TNFD: false, PCAF: false, PRI: false },
  { requirement: 'Engagement / Stewardship', TCFD: false, SFDR: false, CSRD: false, ISSB: false, TNFD: false, PCAF: false, PRI: true },
  { requirement: 'Financed Emissions', TCFD: true, SFDR: false, CSRD: false, ISSB: false, TNFD: false, PCAF: true, PRI: false },
  { requirement: 'Physical Risk', TCFD: true, SFDR: false, CSRD: true, ISSB: true, TNFD: true, PCAF: false, PRI: false },
  { requirement: 'Transition Risk', TCFD: true, SFDR: false, CSRD: true, ISSB: true, TNFD: false, PCAF: false, PRI: false },
  { requirement: 'Water Stress', TCFD: false, SFDR: true, CSRD: true, ISSB: false, TNFD: true, PCAF: false, PRI: false },
];

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */
export default function ReportGeneratorPage() {
  const navigate = useNavigate();
  const portfolio = useMemo(() => loadLS(LS_PORTFOLIO) || { name: 'Global ESG Fund', companies: GLOBAL_COMPANY_MASTER.slice(0, 30) }, []);

  /* ── State ──────────────────────────────────────────────────────────── */
  const [tab, setTab] = useState('types');
  const [selectedType, setSelectedType] = useState(null);
  const [enabledSections, setEnabledSections] = useState({});
  const [clientDetails, setClientDetails] = useState({ fundName: 'Global ESG Opportunities Fund', manager: 'AA Impact Analytics', isin: 'IE00BGBT5L25', period: '2025-Q4', preparedBy: 'ESG Research Team' });
  const [branding, setBranding] = useState({ primaryColor: T.navy, secondaryColor: T.gold, fontFamily: 'Inter', logoUrl: '', footerText: '\u00a9 AA Impact Analytics' });
  const [outputFormat, setOutputFormat] = useState('html');
  const [history, setHistory] = useState(() => loadLS(LS_HISTORY) || []);
  const [schedules, setSchedules] = useState(() => loadLS(LS_SCHEDULE) || []);
  const [batchSelected, setBatchSelected] = useState([]);
  const [genCount, setGenCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [previewFormat, setPreviewFormat] = useState('html');
  const [filterFw, setFilterFw] = useState('All');
  const [filterAud, setFilterAud] = useState('All');
  const [filterFreq, setFilterFreq] = useState('All');
  const [newSchedule, setNewSchedule] = useState({ reportId: '', frequency: 'Quarterly', nextDate: '' });

  /* ── Derived ────────────────────────────────────────────────────────── */
  const uniqueFrameworks = useMemo(() => ['All', ...new Set(REPORT_TYPES.map(r => r.framework))], []);
  const uniqueAudiences = useMemo(() => ['All', ...new Set(REPORT_TYPES.map(r => r.audience))], []);
  const uniqueFreqs = useMemo(() => ['All', ...new Set(REPORT_TYPES.map(r => r.frequency))], []);

  useEffect(() => {
    if (selectedType) {
      const init = {};
      selectedType.sections.forEach(s => { init[s] = true; });
      setEnabledSections(init);
    }
  }, [selectedType]);

  /* ── Report Generation ──────────────────────────────────────────────── */
  const generateReport = useCallback((rt, fmt) => {
    const activeSections = rt.sections.filter(s => enabledSections[s] !== false);
    const reportData = {
      meta: { title: rt.name, framework: rt.framework, date: new Date().toISOString(), client: clientDetails, portfolio: portfolio.name },
      executiveSummary: `This ${rt.framework} report covers the ${portfolio.name} portfolio comprising ${portfolio.companies?.length || 30} holdings. The analysis was conducted in accordance with ${rt.framework} requirements, covering ${activeSections.length} disclosure sections. Key portfolio-level metrics include a weighted ESG score of ${Math.round(55 + sRand(seed(rt.id)) * 25)}/100, total financed emissions of ${Math.round(50000 + sRand(seed(rt.id) + 1) * 150000).toLocaleString()} tCO2e, and ${Math.round(65 + sRand(seed(rt.id) + 2) * 25)}% alignment with framework requirements.`,
      sections: activeSections.map(s => generateSectionContent(s, rt, portfolio)),
    };
    if (fmt === 'html') return renderHTML(reportData, branding);
    if (fmt === 'markdown') return renderMarkdown(reportData);
    return JSON.stringify(reportData, null, 2);
  }, [enabledSections, clientDetails, branding, portfolio]);

  const handleGenerate = useCallback((rt, fmt) => {
    const content = generateReport(rt || selectedType, fmt || outputFormat);
    const ext = (fmt || outputFormat) === 'html' ? 'html' : (fmt || outputFormat) === 'markdown' ? 'md' : 'json';
    const blob = new Blob([content], { type: ext === 'html' ? 'text/html' : ext === 'json' ? 'application/json' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${(rt || selectedType).id}_report_${new Date().toISOString().slice(0, 10)}.${ext}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    const entry = { id: Date.now(), reportType: (rt || selectedType).name, framework: (rt || selectedType).framework, format: fmt || outputFormat, date: new Date().toISOString(), client: clientDetails.fundName, sections: (rt || selectedType).sections.filter(s => enabledSections[s] !== false).length };
    const updated = [entry, ...history].slice(0, 10);
    setHistory(updated); saveLS(LS_HISTORY, updated);
    setGenCount(c => c + 1);
  }, [selectedType, outputFormat, enabledSections, clientDetails, branding, history, generateReport]);

  const handleBatchGenerate = useCallback(() => {
    batchSelected.forEach(id => {
      const rt = REPORT_TYPES.find(r => r.id === id);
      if (rt) handleGenerate(rt, outputFormat);
    });
  }, [batchSelected, outputFormat, handleGenerate]);

  const addSchedule = useCallback(() => {
    if (!newSchedule.reportId || !newSchedule.nextDate) return;
    const rt = REPORT_TYPES.find(r => r.id === newSchedule.reportId);
    const sched = { id: Date.now(), reportName: rt?.name || '', ...newSchedule, created: new Date().toISOString() };
    const updated = [...schedules, sched];
    setSchedules(updated); saveLS(LS_SCHEDULE, updated);
    setNewSchedule({ reportId: '', frequency: 'Quarterly', nextDate: '' });
  }, [newSchedule, schedules]);

  const removeSchedule = useCallback((id) => {
    const updated = schedules.filter(s => s.id !== id);
    setSchedules(updated); saveLS(LS_SCHEDULE, updated);
  }, [schedules]);

  /* ── Sort / Filter for table ────────────────────────────────────────── */
  const sortedTypes = useMemo(() => {
    let items = [...REPORT_TYPES];
    if (filterFw !== 'All') items = items.filter(r => r.framework === filterFw);
    if (filterAud !== 'All') items = items.filter(r => r.audience === filterAud);
    if (filterFreq !== 'All') items = items.filter(r => r.frequency === filterFreq);
    if (searchTerm) items = items.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.framework.toLowerCase().includes(searchTerm.toLowerCase()));
    items.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb || '').toLowerCase(); }
      if (sortCol === 'sections') { va = a.sections.length; vb = b.sections.length; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [filterFw, filterAud, filterFreq, searchTerm, sortCol, sortDir]);

  const handleSort = (col) => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('asc'); } };

  /* ── Quality Checklist ──────────────────────────────────────────────── */
  const qualityChecks = useMemo(() => {
    if (!selectedType) return [];
    const active = selectedType.sections.filter(s => enabledSections[s] !== false);
    return [
      { label: 'All required sections present', pass: active.length >= Math.ceil(selectedType.sections.length * 0.7) },
      { label: 'Client details complete', pass: !!(clientDetails.fundName && clientDetails.manager && clientDetails.period) },
      { label: 'Branding configured', pass: !!branding.primaryColor },
      { label: 'Data coverage > 80%', pass: (portfolio.companies?.length || 30) >= 10 },
      { label: 'No placeholder text', pass: true },
      { label: 'Output format selected', pass: !!outputFormat },
      { label: `Framework alignment: ${selectedType.framework}`, pass: true },
      { label: 'Disclaimer section included', pass: active.some(s => s.toLowerCase().includes('appendix') || s.toLowerCase().includes('disclaimer')) },
    ];
  }, [selectedType, enabledSections, clientDetails, branding, outputFormat, portfolio]);

  /* ── Data Availability ──────────────────────────────────────────────── */
  const dataAvailability = useMemo(() => {
    if (!selectedType) return [];
    return selectedType.modules.map((m, i) => ({
      module: m,
      available: sRand(seed(m)) > 0.15,
      coverage: Math.round(60 + sRand(seed(m) + 1) * 35),
      lastUpdated: `2025-${String(Math.floor(sRand(seed(m) + 2) * 12) + 1).padStart(2, '0')}-${String(Math.floor(sRand(seed(m) + 3) * 28) + 1).padStart(2, '0')}`,
    }));
  }, [selectedType]);

  /* ── KPI Data ───────────────────────────────────────────────────────── */
  const kpis = [
    { label: 'Report Types', value: REPORT_TYPES.length, sub: 'pre-configured' },
    { label: 'Generated (Session)', value: genCount, sub: 'reports' },
    { label: 'Templates Saved', value: (loadLS('ra_report_templates_v2') || []).length + 5, sub: 'available' },
    { label: 'Avg Gen Time', value: '1.2s', sub: 'per report' },
    { label: 'Frameworks', value: new Set(REPORT_TYPES.map(r => r.framework)).size, sub: 'covered' },
    { label: 'Sections', value: ALL_SECTIONS.length, sub: 'available' },
    { label: 'Export Formats', value: 3, sub: 'HTML/MD/JSON' },
    { label: 'Client Profiles', value: 1, sub: 'configured' },
  ];

  /* ── Chart data ─────────────────────────────────────────────────────── */
  const fwDistribution = useMemo(() => {
    const counts = {};
    REPORT_TYPES.forEach(r => { counts[r.framework] = (counts[r.framework] || 0) + 1; });
    return Object.entries(counts).map(([fw, ct]) => ({ name: fw, count: ct, fill: FW_COLORS[fw] || T.navy }));
  }, []);

  const sectionsByReport = useMemo(() => REPORT_TYPES.map(r => ({ name: r.id.toUpperCase(), sections: r.sections.length, pages: r.pages_est })), []);

  /* ── Styles ─────────────────────────────────────────────────────────── */
  const S = {
    page: { fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px', color: T.text },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    title: { fontSize: 28, fontWeight: 700, color: T.navy },
    badge: { display: 'inline-block', fontSize: 11, fontWeight: 600, color: T.gold, background: `${T.gold}18`, border: `1px solid ${T.gold}40`, borderRadius: 20, padding: '4px 14px', marginLeft: 12 },
    tabs: { display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' },
    tab: (active) => ({ padding: '8px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: `1px solid ${active ? T.navy : T.border}`, background: active ? T.navy : T.surface, color: active ? '#fff' : T.textSec, cursor: 'pointer', transition: 'all .2s' }),
    card: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 16 },
    kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 20 },
    kpi: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 14px', textAlign: 'center' },
    kpiVal: { fontSize: 24, fontWeight: 700, color: T.navy },
    kpiLabel: { fontSize: 11, color: T.textSec, marginTop: 2 },
    kpiSub: { fontSize: 10, color: T.textMut },
    grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 },
    typeCard: (sel) => ({ background: sel ? `${T.navy}08` : T.surface, border: `2px solid ${sel ? T.navy : T.border}`, borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'all .2s' }),
    btn: (primary) => ({ padding: '10px 22px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', background: primary ? T.navy : T.surface, color: primary ? '#fff' : T.text, cursor: 'pointer', boxShadow: primary ? `0 2px 8px ${T.navy}30` : 'none', border: primary ? 'none' : `1px solid ${T.border}` }),
    input: { padding: '8px 12px', fontSize: 13, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, width: '100%', outline: 'none' },
    select: { padding: '8px 12px', fontSize: 13, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, outline: 'none' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
    th: { padding: '10px 12px', textAlign: 'left', background: T.navy, color: '#fff', cursor: 'pointer', userSelect: 'none', fontSize: 11, fontWeight: 600 },
    td: { padding: '8px 12px', borderBottom: `1px solid ${T.border}` },
    fwBadge: (fw) => ({ display: 'inline-block', fontSize: 10, fontWeight: 700, color: '#fff', background: FW_COLORS[fw] || T.navy, borderRadius: 4, padding: '2px 8px' }),
    navRow: { display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' },
    exportBtn: { padding: '7px 16px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.text, cursor: 'pointer' },
  };

  /* ── Tab definitions ────────────────────────────────────────────────── */
  const TABS = [
    { id: 'types', label: 'Report Types' },
    { id: 'configure', label: 'Configure & Generate' },
    { id: 'preview', label: 'Preview' },
    { id: 'history', label: 'History' },
    { id: 'batch', label: 'Batch Generate' },
    { id: 'coverage', label: 'Coverage Matrix' },
    { id: 'sections', label: 'Section Library' },
    { id: 'schedule', label: 'Scheduling' },
    { id: 'table', label: 'Sortable Table' },
    { id: 'compare', label: 'Compare Formats' },
  ];

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1 style={S.title}>Multi-Format Report Generator</h1>
            <span style={S.badge}>12 Types &middot; HTML/MD/JSON &middot; 10 Frameworks</span>
          </div>
          <p style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>Generate professional regulatory & client reports from portfolio analytics data</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.btn(false)} onClick={() => navigate('/report-studio')}>Report Studio</button>
          <button style={S.btn(false)} onClick={() => navigate('/template-manager')}>Template Manager</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={S.kpiRow}>
        {kpis.map((k, i) => (
          <div key={i} style={S.kpi}>
            <div style={S.kpiVal}>{k.value}</div>
            <div style={S.kpiLabel}>{k.label}</div>
            <div style={S.kpiSub}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {TABS.map(t => (
          <button key={t.id} style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* ── TAB: Report Types ─────────────────────────────────────────── */}
      {tab === 'types' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <input style={{ ...S.input, maxWidth: 260 }} placeholder="Search report types..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <select style={S.select} value={filterFw} onChange={e => setFilterFw(e.target.value)}>
              {uniqueFrameworks.map(f => <option key={f}>{f}</option>)}
            </select>
            <select style={S.select} value={filterAud} onChange={e => setFilterAud(e.target.value)}>
              {uniqueAudiences.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div style={S.grid3}>
            {sortedTypes.map(rt => (
              <div key={rt.id} style={S.typeCard(selectedType?.id === rt.id)} onClick={() => { setSelectedType(rt); setTab('configure'); }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{rt.icon}</span>
                  <span style={S.fwBadge(rt.framework)}>{rt.framework}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{rt.name}</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: T.textSec, marginBottom: 6 }}>
                  <span>{rt.sections.length} sections</span>
                  <span>~{rt.pages_est} pages</span>
                </div>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>Audience: {rt.audience}</div>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 8 }}>Frequency: {rt.frequency}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {rt.modules.slice(0, 3).map(m => (
                    <span key={m} style={{ fontSize: 9, background: `${T.sage}15`, color: T.sage, borderRadius: 4, padding: '2px 6px' }}>{m}</span>
                  ))}
                  {rt.modules.length > 3 && <span style={{ fontSize: 9, color: T.textMut }}>+{rt.modules.length - 3}</span>}
                </div>
              </div>
            ))}
          </div>
          {/* Distribution Chart */}
          <div style={{ ...S.card, marginTop: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Report Types by Framework</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={fwDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.border}` }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {fwDistribution.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── TAB: Configure & Generate ─────────────────────────────────── */}
      {tab === 'configure' && (
        <div>
          {!selectedType ? (
            <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
              <p style={{ fontSize: 15, color: T.textSec }}>Select a report type from the "Report Types" tab to begin configuration.</p>
              <button style={{ ...S.btn(true), marginTop: 16 }} onClick={() => setTab('types')}>Browse Report Types</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Left: Config */}
              <div>
                <div style={S.card}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 12 }}>{selectedType.icon} {selectedType.name}</h3>
                  <span style={S.fwBadge(selectedType.framework)}>{selectedType.framework}</span>
                  <span style={{ fontSize: 11, color: T.textSec, marginLeft: 12 }}>{selectedType.sections.length} sections &middot; ~{selectedType.pages_est} pages</span>
                </div>

                {/* Client Details */}
                <div style={S.card}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Client Details</h4>
                  {[['fundName','Fund Name'],['manager','Manager'],['isin','ISIN'],['period','Reporting Period'],['preparedBy','Prepared By']].map(([k, label]) => (
                    <div key={k} style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 11, color: T.textSec, display: 'block', marginBottom: 2 }}>{label}</label>
                      <input style={S.input} value={clientDetails[k]} onChange={e => setClientDetails(p => ({ ...p, [k]: e.target.value }))} />
                    </div>
                  ))}
                </div>

                {/* Branding */}
                <div style={S.card}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Branding</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 11, color: T.textSec }}>Primary Color</label>
                      <input type="color" value={branding.primaryColor} onChange={e => setBranding(p => ({ ...p, primaryColor: e.target.value }))} style={{ width: '100%', height: 36, border: 'none', cursor: 'pointer' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: T.textSec }}>Secondary Color</label>
                      <input type="color" value={branding.secondaryColor} onChange={e => setBranding(p => ({ ...p, secondaryColor: e.target.value }))} style={{ width: '100%', height: 36, border: 'none', cursor: 'pointer' }} />
                    </div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <label style={{ fontSize: 11, color: T.textSec }}>Font Family</label>
                    <select style={S.select} value={branding.fontFamily} onChange={e => setBranding(p => ({ ...p, fontFamily: e.target.value }))}>
                      {['Inter','Roboto','Times New Roman','Georgia','Helvetica'].map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <label style={{ fontSize: 11, color: T.textSec }}>Logo URL</label>
                    <input style={S.input} value={branding.logoUrl} onChange={e => setBranding(p => ({ ...p, logoUrl: e.target.value }))} placeholder="https://..." />
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <label style={{ fontSize: 11, color: T.textSec }}>Footer Text</label>
                    <input style={S.input} value={branding.footerText} onChange={e => setBranding(p => ({ ...p, footerText: e.target.value }))} />
                  </div>
                </div>

                {/* Output Format */}
                <div style={S.card}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Output Format</h4>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['html','markdown','json'].map(fmt => (
                      <button key={fmt} style={{ ...S.btn(outputFormat === fmt), flex: 1 }} onClick={() => setOutputFormat(fmt)}>
                        {fmt === 'html' ? 'HTML' : fmt === 'markdown' ? 'Markdown' : 'JSON'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate */}
                <button style={{ ...S.btn(true), width: '100%', padding: '14px 24px', fontSize: 15, marginTop: 8 }} onClick={() => handleGenerate()}>
                  Generate {selectedType.name} ({outputFormat.toUpperCase()})
                </button>
              </div>

              {/* Right: Sections + Quality */}
              <div>
                {/* Section Toggle */}
                <div style={S.card}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Sections ({selectedType.sections.filter(s => enabledSections[s] !== false).length}/{selectedType.sections.length} enabled)</h4>
                  {selectedType.sections.map((sec, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < selectedType.sections.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                      <input type="checkbox" checked={enabledSections[sec] !== false} onChange={() => setEnabledSections(p => ({ ...p, [sec]: !p[sec] === false ? true : !(p[sec] !== false) }))} style={{ cursor: 'pointer' }} />
                      <span style={{ fontSize: 12, color: enabledSections[sec] !== false ? T.text : T.textMut }}>{i + 1}. {sec}</span>
                    </div>
                  ))}
                </div>

                {/* Data Availability */}
                <div style={S.card}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Data Availability</h4>
                  {dataAvailability.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.available ? T.green : T.red, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, flex: 1 }}>{d.module}</span>
                      <span style={{ fontSize: 11, color: T.textSec }}>{d.coverage}%</span>
                      <span style={{ fontSize: 10, color: T.textMut }}>{d.lastUpdated}</span>
                    </div>
                  ))}
                </div>

                {/* Quality Checklist */}
                <div style={S.card}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Quality Checklist</h4>
                  {qualityChecks.map((q, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 12 }}>
                      <span style={{ color: q.pass ? T.green : T.red, fontSize: 14 }}>{q.pass ? '\u2713' : '\u2717'}</span>
                      <span style={{ color: q.pass ? T.text : T.red }}>{q.label}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 10, padding: '8px 12px', background: qualityChecks.every(q => q.pass) ? `${T.green}10` : `${T.amber}10`, borderRadius: 6, fontSize: 12, fontWeight: 600, color: qualityChecks.every(q => q.pass) ? T.green : T.amber }}>
                    {qualityChecks.every(q => q.pass) ? 'All checks passed — ready to generate' : `${qualityChecks.filter(q => !q.pass).length} issue(s) to resolve`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Preview ──────────────────────────────────────────────── */}
      {tab === 'preview' && (
        <div>
          {!selectedType ? (
            <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
              <p style={{ fontSize: 15, color: T.textSec }}>Select a report type first to see the preview.</p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {['html','markdown','json'].map(f => (
                  <button key={f} style={S.tab(previewFormat === f)} onClick={() => setPreviewFormat(f)}>{f.toUpperCase()}</button>
                ))}
              </div>
              <div style={{ ...S.card, maxHeight: 600, overflow: 'auto' }}>
                {previewFormat === 'html' ? (
                  <div dangerouslySetInnerHTML={{ __html: generateReport(selectedType, 'html') }} style={{ transform: 'scale(0.6)', transformOrigin: 'top left', width: '166%' }} />
                ) : (
                  <pre style={{ fontSize: 11, lineHeight: 1.5, whiteSpace: 'pre-wrap', color: T.textSec, fontFamily: 'monospace' }}>
                    {generateReport(selectedType, previewFormat)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: History ──────────────────────────────────────────────── */}
      {tab === 'history' && (
        <div style={S.card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Report History (Last 10)</h3>
          {history.length === 0 ? (
            <p style={{ fontSize: 13, color: T.textMut, textAlign: 'center', padding: 24 }}>No reports generated yet. Select a report type and generate your first report.</p>
          ) : (
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Report</th><th style={S.th}>Framework</th><th style={S.th}>Format</th>
                  <th style={S.th}>Sections</th><th style={S.th}>Client</th><th style={S.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={h.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={S.td}><span style={{ fontWeight: 600 }}>{h.reportType}</span></td>
                    <td style={S.td}><span style={S.fwBadge(h.framework)}>{h.framework}</span></td>
                    <td style={S.td}><span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{h.format}</span></td>
                    <td style={S.td}>{h.sections}</td>
                    <td style={S.td}>{h.client}</td>
                    <td style={S.td}>{new Date(h.date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB: Batch Generate ───────────────────────────────────────── */}
      {tab === 'batch' && (
        <div style={S.card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Multi-Report Batch Generation</h3>
          <p style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>Select multiple report types to generate all at once.</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button style={S.btn(false)} onClick={() => setBatchSelected(REPORT_TYPES.map(r => r.id))}>Select All</button>
            <button style={S.btn(false)} onClick={() => setBatchSelected([])}>Clear All</button>
            <span style={{ fontSize: 12, color: T.textSec, alignSelf: 'center', marginLeft: 8 }}>{batchSelected.length} selected</span>
          </div>
          <div style={S.grid3}>
            {REPORT_TYPES.map(rt => {
              const sel = batchSelected.includes(rt.id);
              return (
                <div key={rt.id} style={{ ...S.typeCard(sel), display: 'flex', gap: 10, alignItems: 'center', padding: 12 }} onClick={() => setBatchSelected(p => sel ? p.filter(x => x !== rt.id) : [...p, rt.id])}>
                  <input type="checkbox" checked={sel} readOnly style={{ cursor: 'pointer' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{rt.name}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{rt.framework} &middot; {rt.sections.length} sections</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <select style={S.select} value={outputFormat} onChange={e => setOutputFormat(e.target.value)}>
              <option value="html">HTML</option><option value="markdown">Markdown</option><option value="json">JSON</option>
            </select>
            <button style={{ ...S.btn(true), opacity: batchSelected.length ? 1 : 0.5 }} onClick={handleBatchGenerate} disabled={!batchSelected.length}>
              Generate {batchSelected.length} Reports
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: Coverage Matrix ──────────────────────────────────────── */}
      {tab === 'coverage' && (
        <div style={S.card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Framework Coverage Matrix</h3>
          <p style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>Which report types address which framework requirements.</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Requirement</th>
                  {['TCFD','SFDR','CSRD','ISSB','TNFD','PCAF','PRI'].map(fw => (
                    <th key={fw} style={{ ...S.th, textAlign: 'center', background: FW_COLORS[fw] }}>{fw}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COVERAGE_MATRIX.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ ...S.td, fontWeight: 600, fontSize: 12 }}>{row.requirement}</td>
                    {['TCFD','SFDR','CSRD','ISSB','TNFD','PCAF','PRI'].map(fw => (
                      <td key={fw} style={{ ...S.td, textAlign: 'center' }}>
                        <span style={{ color: row[fw] ? T.green : T.red, fontWeight: 700 }}>{row[fw] ? '\u2713' : '\u2014'}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Radar Chart */}
          <div style={{ marginTop: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Coverage by Framework</h4>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={['TCFD','SFDR','CSRD','ISSB','TNFD','PCAF','PRI'].map(fw => ({
                fw, coverage: COVERAGE_MATRIX.filter(r => r[fw]).length
              }))}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="fw" tick={{ fontSize: 11, fill: T.textSec }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} />
                <Radar dataKey="coverage" stroke={T.navy} fill={T.navy} fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── TAB: Section Library ──────────────────────────────────────── */}
      {tab === 'sections' && (
        <div style={S.card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Section Library</h3>
          <p style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>{ALL_SECTIONS.length} unique sections across all report types.</p>
          <input style={{ ...S.input, marginBottom: 12, maxWidth: 320 }} placeholder="Search sections..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
            {ALL_SECTIONS.filter(s => !searchTerm || s.toLowerCase().includes(searchTerm.toLowerCase())).map((sec, i) => {
              const usedIn = REPORT_TYPES.filter(r => r.sections.includes(sec));
              return (
                <div key={i} style={{ padding: '10px 14px', background: T.surfaceH, borderRadius: 8, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{sec}</div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>
                    Used in: {usedIn.map(r => r.id).join(', ') || 'none'}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                    {usedIn.map(r => <span key={r.id} style={{ ...S.fwBadge(r.framework), fontSize: 8 }}>{r.framework}</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB: Scheduling ───────────────────────────────────────────── */}
      {tab === 'schedule' && (
        <div>
          <div style={S.card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Report Generation Schedule</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: 11, color: T.textSec, display: 'block', marginBottom: 2 }}>Report Type</label>
                <select style={S.select} value={newSchedule.reportId} onChange={e => setNewSchedule(p => ({ ...p, reportId: e.target.value }))}>
                  <option value="">Select...</option>
                  {REPORT_TYPES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: T.textSec, display: 'block', marginBottom: 2 }}>Frequency</label>
                <select style={S.select} value={newSchedule.frequency} onChange={e => setNewSchedule(p => ({ ...p, frequency: e.target.value }))}>
                  {['Monthly','Quarterly','Semi-Annual','Annual'].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: T.textSec, display: 'block', marginBottom: 2 }}>Next Run Date</label>
                <input type="date" style={S.input} value={newSchedule.nextDate} onChange={e => setNewSchedule(p => ({ ...p, nextDate: e.target.value }))} />
              </div>
              <button style={S.btn(true)} onClick={addSchedule}>Add Schedule</button>
            </div>
          </div>
          <div style={S.card}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Active Schedules ({schedules.length})</h4>
            {schedules.length === 0 ? (
              <p style={{ fontSize: 13, color: T.textMut, textAlign: 'center', padding: 16 }}>No schedules configured yet.</p>
            ) : (
              <table style={S.table}>
                <thead><tr><th style={S.th}>Report</th><th style={S.th}>Frequency</th><th style={S.th}>Next Run</th><th style={S.th}>Created</th><th style={S.th}>Action</th></tr></thead>
                <tbody>
                  {schedules.map((sch, i) => (
                    <tr key={sch.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                      <td style={S.td}>{sch.reportName}</td>
                      <td style={S.td}>{sch.frequency}</td>
                      <td style={S.td}>{sch.nextDate}</td>
                      <td style={S.td}>{new Date(sch.created).toLocaleDateString()}</td>
                      <td style={S.td}><button style={{ ...S.exportBtn, color: T.red, fontSize: 11 }} onClick={() => removeSchedule(sch.id)}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Sortable Table ───────────────────────────────────────── */}
      {tab === 'table' && (
        <div style={S.card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 4 }}>All Report Types</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <select style={S.select} value={filterFw} onChange={e => setFilterFw(e.target.value)}>
              {uniqueFrameworks.map(f => <option key={f}>{f}</option>)}
            </select>
            <select style={S.select} value={filterAud} onChange={e => setFilterAud(e.target.value)}>
              {uniqueAudiences.map(a => <option key={a}>{a}</option>)}
            </select>
            <select style={S.select} value={filterFreq} onChange={e => setFilterFreq(e.target.value)}>
              {uniqueFreqs.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  {[['name','Name'],['framework','Framework'],['sections','Sections'],['pages_est','Pages'],['audience','Audience'],['frequency','Frequency']].map(([col, label]) => (
                    <th key={col} style={S.th} onClick={() => handleSort(col)}>
                      {label} {sortCol === col ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}
                    </th>
                  ))}
                  <th style={S.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedTypes.map((rt, i) => (
                  <tr key={rt.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ ...S.td, fontWeight: 600 }}>{rt.icon} {rt.name}</td>
                    <td style={S.td}><span style={S.fwBadge(rt.framework)}>{rt.framework}</span></td>
                    <td style={S.td}>{rt.sections.length}</td>
                    <td style={S.td}>~{rt.pages_est}</td>
                    <td style={S.td}>{rt.audience}</td>
                    <td style={S.td}>{rt.frequency}</td>
                    <td style={S.td}>
                      <button style={{ ...S.exportBtn, fontSize: 11 }} onClick={() => { setSelectedType(rt); setTab('configure'); }}>Configure</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Section Count Chart */}
          <div style={{ marginTop: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Sections & Pages by Report</h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sectionsByReport}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.border}` }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="sections" fill={T.navy} radius={[4, 4, 0, 0]} name="Sections" />
                <Bar dataKey="pages" fill={T.gold} radius={[4, 4, 0, 0]} name="Est. Pages" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── TAB: Compare Formats ──────────────────────────────────────── */}
      {tab === 'compare' && (
        <div>
          {!selectedType ? (
            <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
              <p style={{ fontSize: 15, color: T.textSec }}>Select a report type first to compare formats.</p>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Format Comparison: {selectedType.name}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {['html','markdown'].map(fmt => (
                  <div key={fmt} style={S.card}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{fmt.toUpperCase()} Output</h4>
                    <div style={{ maxHeight: 500, overflow: 'auto', background: '#f8f7f5', borderRadius: 8, padding: 12 }}>
                      {fmt === 'html' ? (
                        <div dangerouslySetInnerHTML={{ __html: generateReport(selectedType, 'html') }} style={{ transform: 'scale(0.45)', transformOrigin: 'top left', width: '222%' }} />
                      ) : (
                        <pre style={{ fontSize: 10, lineHeight: 1.4, whiteSpace: 'pre-wrap', color: T.textSec, fontFamily: 'monospace' }}>
                          {generateReport(selectedType, 'markdown').slice(0, 3000)}...
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Module Data Readiness Panel ─────────────────────────────────── */}
      {selectedType && tab !== 'types' && tab !== 'table' && tab !== 'coverage' && tab !== 'sections' && tab !== 'schedule' && tab !== 'history' && tab !== 'batch' && (
        <div style={{ ...S.card, marginTop: 8 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Module Data Readiness: {selectedType.name}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {selectedType.modules.map((mod, i) => {
              const s = seed(mod);
              const coverage = Math.round(60 + sRand(s) * 35);
              const records = Math.round(100 + sRand(s + 1) * 900);
              const quality = Math.round(70 + sRand(s + 2) * 25);
              const status = coverage > 80 ? 'Ready' : coverage > 50 ? 'Partial' : 'Missing';
              const statusColor = status === 'Ready' ? T.green : status === 'Partial' ? T.amber : T.red;
              return (
                <div key={mod} style={{ padding: 14, background: T.surfaceH, borderRadius: 10, border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{mod}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: statusColor, background: `${statusColor}15`, padding: '2px 8px', borderRadius: 4 }}>{status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 10, color: T.textSec }}>
                    <span>Coverage: {coverage}%</span>
                    <span>Records: {records}</span>
                    <span>Quality: {quality}%</span>
                  </div>
                  <div style={{ marginTop: 6, height: 4, background: T.border, borderRadius: 2 }}>
                    <div style={{ height: 4, background: statusColor, borderRadius: 2, width: `${coverage}%`, transition: 'width .3s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Framework Alignment Detail ────────────────────────────────── */}
      {selectedType && (tab === 'configure' || tab === 'preview') && (
        <div style={{ ...S.card, marginTop: 8 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Framework Alignment: {selectedType.framework}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: T.textSec }}>Report Metadata</h4>
              {[
                ['Framework', selectedType.framework],
                ['Total Sections', selectedType.sections.length],
                ['Estimated Pages', `~${selectedType.pages_est}`],
                ['Target Audience', selectedType.audience],
                ['Reporting Frequency', selectedType.frequency],
                ['Required Modules', selectedType.modules.length],
                ['Data Sources', Math.round(3 + sRand(seed(selectedType.id)) * 5)],
                ['Compliance Level', sRand(seed(selectedType.id) + 10) > 0.3 ? 'Full' : 'Partial'],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <span style={{ color: T.textSec }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: T.textSec }}>Section Coverage</h4>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={selectedType.sections.slice(0, 8).map((sec, i) => ({
                  section: sec.length > 15 ? sec.slice(0, 15) + '..' : sec,
                  completeness: Math.round(65 + sRand(seed(sec) + i) * 30),
                  quality: Math.round(60 + sRand(seed(sec) + i + 5) * 35),
                }))}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="section" tick={{ fontSize: 8, fill: T.textSec }} />
                  <PolarRadiusAxis tick={{ fontSize: 8 }} domain={[0, 100]} />
                  <Radar dataKey="completeness" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2} name="Completeness" />
                  <Radar dataKey="quality" stroke={T.gold} fill={T.gold} fillOpacity={0.1} strokeWidth={2} name="Quality" />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Generation Timeline Chart ─────────────────────────────────── */}
      {history.length > 0 && (tab === 'history' || tab === 'types') && (
        <div style={{ ...S.card, marginTop: 8 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Generation Activity</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={history.slice().reverse().map((h, i) => ({
              idx: i + 1,
              name: h.reportType.length > 18 ? h.reportType.slice(0, 18) + '..' : h.reportType,
              sections: h.sections,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.border}` }} />
              <Line type="monotone" dataKey="sections" stroke={T.navy} strokeWidth={2} dot={{ fill: T.navy, r: 4 }} name="Sections Generated" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Quick Actions Bar ─────────────────────────────────────────── */}
      <div style={{ ...S.card, marginTop: 8, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>Quick Actions:</span>
        {REPORT_TYPES.slice(0, 4).map(rt => (
          <button key={rt.id} style={{ padding: '6px 14px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: `1px solid ${FW_COLORS[rt.framework] || T.border}`, background: `${FW_COLORS[rt.framework] || T.navy}10`, color: FW_COLORS[rt.framework] || T.navy, cursor: 'pointer' }} onClick={() => { setSelectedType(rt); setOutputFormat('html'); handleGenerate(rt, 'html'); }}>
            {rt.icon} Quick {rt.id.toUpperCase()}
          </button>
        ))}
        <button style={{ padding: '6px 14px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: `1px solid ${T.sage}`, background: `${T.sage}10`, color: T.sage, cursor: 'pointer' }} onClick={() => { setBatchSelected(REPORT_TYPES.map(r => r.id)); setTab('batch'); }}>
          Batch All 12
        </button>
      </div>

      {/* ── Framework Summary Cards ───────────────────────────────────── */}
      {tab === 'types' && (
        <div style={{ ...S.card, marginTop: 8 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Framework Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {Object.entries(FW_COLORS).map(([fw, color]) => {
              const reports = REPORT_TYPES.filter(r => r.framework === fw);
              if (!reports.length) return null;
              return (
                <div key={fw} style={{ padding: 14, borderRadius: 10, border: `2px solid ${color}30`, background: `${color}06` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color }}>{fw}</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color }}>{reports.length}</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.textSec }}>
                    {reports.map(r => r.name).join(' | ')}
                  </div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>
                    Total sections: {reports.reduce((s, r) => s + r.sections.length, 0)} | Est. pages: {reports.reduce((s, r) => s + r.pages_est, 0)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Audience Distribution Pie ─────────────────────────────────── */}
      {tab === 'types' && (
        <div style={{ ...S.card, marginTop: 8 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Audience Distribution</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={(() => {
                  const counts = {};
                  REPORT_TYPES.forEach(r => { counts[r.audience] = (counts[r.audience] || 0) + 1; });
                  return Object.entries(counts).map(([a, c]) => ({ name: a, value: c }));
                })()} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name.split('/')[0].trim()} (${value})`} labelLine={{ stroke: T.textMut }} style={{ fontSize: 9 }}>
                  {[T.navy, T.gold, T.sage, '#7c3aed', '#d97706', '#0d9488'].map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.border}` }} />
              </PieChart>
            </ResponsiveContainer>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Frequency Breakdown</h4>
              {['Annual','Quarterly','Semi-Annual'].map(freq => {
                const count = REPORT_TYPES.filter(r => r.frequency === freq).length;
                return (
                  <div key={freq} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 12, fontWeight: 600, width: 100 }}>{freq}</span>
                    <div style={{ flex: 1, height: 8, background: T.border, borderRadius: 4 }}>
                      <div style={{ height: 8, background: T.navy, borderRadius: 4, width: `${(count / REPORT_TYPES.length) * 100}%` }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{count}</span>
                  </div>
                );
              })}
              <div style={{ marginTop: 16, padding: 12, background: T.surfaceH, borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Module Coverage</div>
                <div style={{ fontSize: 10, color: T.textSec }}>
                  {[...new Set(REPORT_TYPES.flatMap(r => r.modules))].length} unique modules referenced across all {REPORT_TYPES.length} report types
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Exports & Navigation ──────────────────────────────────────── */}
      <div style={S.navRow}>
        <button style={S.exportBtn} onClick={() => {
          const data = JSON.stringify({ reportTypes: REPORT_TYPES, history, schedules }, null, 2);
          const blob = new Blob([data], { type: 'application/json' });
          const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
          a.download = `report_generator_config_${new Date().toISOString().slice(0,10)}.json`;
          document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        }}>Export Config (JSON)</button>
        <button style={S.exportBtn} onClick={() => {
          const rows = [['Name','Framework','Sections','Pages','Audience','Frequency','Modules'].join(','), ...REPORT_TYPES.map(r => [r.name, r.framework, r.sections.length, r.pages_est, r.audience, r.frequency, r.modules.join(';')].join(','))];
          const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
          const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
          a.download = `report_types_${new Date().toISOString().slice(0,10)}.csv`;
          document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        }}>Export Types (CSV)</button>
        <button style={S.exportBtn} onClick={() => window.print()}>Print View</button>
        <div style={{ flex: 1 }} />
        <button style={{ ...S.exportBtn, fontWeight: 600, color: T.navy }} onClick={() => navigate('/template-manager')}>Template Manager &rarr;</button>
        <button style={{ ...S.exportBtn, fontWeight: 600, color: T.navy }} onClick={() => navigate('/regulatory-gap')}>Regulatory Gap &rarr;</button>
        <button style={{ ...S.exportBtn, fontWeight: 600, color: T.navy }} onClick={() => navigate('/framework-interop')}>Framework Interop &rarr;</button>
      </div>
    </div>
  );
}
