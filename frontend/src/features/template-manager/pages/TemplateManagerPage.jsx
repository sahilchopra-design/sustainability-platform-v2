import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ── Theme ──────────────────────────────────────────────────────────────── */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
let _sc=1000;

/* ── Helpers ────────────────────────────────────────────────────────────── */
const seed = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i); return Math.abs(h); };
const sRand = (n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };
const LS_PORTFOLIO = 'ra_portfolio_v1';
const LS_TEMPLATES = 'ra_report_templates_v2';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

/* ── Section Library (25+) ──────────────────────────────────────────────── */
const SECTION_LIBRARY = [
  { id: 'cover', name: 'Cover Page', category: 'Structure', description: 'Title page with branding, client name, report period, and logo placement' },
  { id: 'toc', name: 'Table of Contents', category: 'Structure', description: 'Auto-generated navigation with section numbers and page references' },
  { id: 'executive_summary', name: 'Executive Summary', category: 'Overview', description: 'High-level findings, key metrics, and actionable recommendations' },
  { id: 'portfolio_overview', name: 'Portfolio Overview', category: 'Overview', description: 'AUM, holdings count, sector allocation, geographic distribution' },
  { id: 'climate_metrics', name: 'Climate Metrics', category: 'Environmental', description: 'Scope 1/2/3 emissions, carbon intensity, WACI, temperature alignment' },
  { id: 'esg_scores', name: 'ESG Scores', category: 'Overview', description: 'Portfolio-weighted ESG scores, E/S/G pillar breakdown, peer comparison' },
  { id: 'ghg_emissions', name: 'GHG Emissions', category: 'Environmental', description: 'Detailed greenhouse gas breakdown by scope, sector, and company' },
  { id: 'scenario_analysis', name: 'Scenario Analysis', category: 'Environmental', description: 'NGFS scenario pathways, portfolio impact under 1.5C/2C/3C warming' },
  { id: 'physical_risk', name: 'Physical Risk', category: 'Environmental', description: 'Acute and chronic physical risk exposure by location and asset type' },
  { id: 'transition_risk', name: 'Transition Risk', category: 'Environmental', description: 'Policy, technology, market, and legal transition risk assessment' },
  { id: 'nature_biodiversity', name: 'Nature & Biodiversity', category: 'Environmental', description: 'TNFD LEAP analysis, biodiversity footprint, dependency mapping' },
  { id: 'water_stress', name: 'Water Stress', category: 'Environmental', description: 'Water consumption, withdrawal, stress exposure by basin and sector' },
  { id: 'social_metrics', name: 'Social Metrics', category: 'Social', description: 'Employee diversity, health & safety, living wage, human rights due diligence' },
  { id: 'governance', name: 'Governance', category: 'Governance', description: 'Board composition, independence, ESG oversight, remuneration linkage' },
  { id: 'sfdr_pai', name: 'SFDR PAI Indicators', category: 'Regulatory', description: 'All 14 mandatory PAI indicators with portfolio-level calculations' },
  { id: 'eu_taxonomy', name: 'EU Taxonomy Alignment', category: 'Regulatory', description: 'Taxonomy-eligible and aligned revenue, CapEx, OpEx by objective' },
  { id: 'stewardship', name: 'Stewardship', category: 'Engagement', description: 'Engagement activities, escalation cases, proxy voting summary' },
  { id: 'controversy', name: 'Controversy Monitor', category: 'Engagement', description: 'Active controversies, severity levels, management response assessment' },
  { id: 'benchmarking', name: 'Benchmarking', category: 'Analytics', description: 'Portfolio vs benchmark ESG performance, tracking error attribution' },
  { id: 'risk_attribution', name: 'Risk Attribution', category: 'Analytics', description: 'ESG factor contribution to portfolio risk and return' },
  { id: 'holdings_deep_dive', name: 'Holdings Deep-Dive', category: 'Analytics', description: 'Company-level ESG profiles for top/bottom holdings' },
  { id: 'regulatory_compliance', name: 'Regulatory Compliance', category: 'Regulatory', description: 'Multi-framework compliance status, gap analysis, remediation plan' },
  { id: 'methodology', name: 'Methodology', category: 'Structure', description: 'Data sources, calculation methodologies, coverage statistics' },
  { id: 'disclaimer', name: 'Disclaimer', category: 'Structure', description: 'Legal disclaimer, data limitations, forward-looking statements' },
  { id: 'appendix', name: 'Appendix', category: 'Structure', description: 'Supporting data tables, full holdings list, glossary of terms' },
  { id: 'carbon_budget', name: 'Carbon Budget Analysis', category: 'Environmental', description: 'Remaining carbon budget, implied temperature rise, pathway alignment' },
  { id: 'just_transition', name: 'Just Transition', category: 'Social', description: 'Workforce transition readiness, community impact, reskilling programs' },
  { id: 'supply_chain', name: 'Supply Chain ESG', category: 'Social', description: 'Tier-1/2 supplier ESG assessment, modern slavery risk, audit results' },
];

const SECTION_CATEGORIES = [...new Set(SECTION_LIBRARY.map(s => s.category))];

/* ── Cover Styles ───────────────────────────────────────────────────────── */
const COVER_STYLES = [
  { id: 'navy-gradient', name: 'Navy Gradient', bg: 'linear-gradient(135deg, #1b3a5c, #2c5a8c)', textColor: '#ffffff' },
  { id: 'white-clean', name: 'White Clean', bg: '#ffffff', textColor: '#1b3a5c' },
  { id: 'formal', name: 'Formal', bg: '#374151', textColor: '#f3f4f6' },
  { id: 'dark-executive', name: 'Dark Executive', bg: 'linear-gradient(180deg, #0f172a, #1e3a5f)', textColor: '#dbeafe' },
  { id: 'green-accent', name: 'Green Accent', bg: 'linear-gradient(135deg, #ecfdf5, #059669)', textColor: '#064e3b' },
];

/* ── Default Templates ──────────────────────────────────────────────────── */
const DEFAULT_TEMPLATES = [
  { id: 'classic', name: 'Classic Corporate', description: 'Navy/gold professional theme for institutional clients', isDefault: true, branding: { primaryColor: '#1b3a5c', secondaryColor: '#c5a96a', fontFamily: 'Inter', logoPosition: 'top-left', headerStyle: 'full-width', footerText: '\u00a9 AA Impact Analytics', coverStyle: 'navy-gradient' }, sections: ['cover','toc','executive_summary','portfolio_overview','climate_metrics','esg_scores','risk_attribution','stewardship','appendix','disclaimer'], pageLayout: { margins: { top: 72, right: 72, bottom: 72, left: 72 }, headerHeight: 48, footerHeight: 36 }, created: '2024-06-01T00:00:00Z', lastUsed: '2025-03-15T10:30:00Z', usageCount: 42 },
  { id: 'modern', name: 'Modern Minimal', description: 'Clean white theme with accent colors for boutique managers', isDefault: true, branding: { primaryColor: '#0d9488', secondaryColor: '#f0fdfa', fontFamily: 'Inter', logoPosition: 'top-center', headerStyle: 'line-only', footerText: '', coverStyle: 'white-clean' }, sections: ['cover','executive_summary','portfolio_overview','esg_scores','climate_metrics','benchmarking','disclaimer'], pageLayout: { margins: { top: 60, right: 60, bottom: 60, left: 60 }, headerHeight: 36, footerHeight: 24 }, created: '2024-08-15T00:00:00Z', lastUsed: '2025-03-10T14:00:00Z', usageCount: 28 },
  { id: 'regulatory', name: 'Regulatory Compliance', description: 'Formal layout optimized for regulatory submissions', isDefault: true, branding: { primaryColor: '#374151', secondaryColor: '#f3f4f6', fontFamily: 'Times New Roman', logoPosition: 'none', headerStyle: 'minimal', footerText: 'CONFIDENTIAL', coverStyle: 'formal' }, sections: ['cover','toc','executive_summary','sfdr_pai','eu_taxonomy','regulatory_compliance','methodology','disclaimer','appendix'], pageLayout: { margins: { top: 96, right: 72, bottom: 96, left: 72 }, headerHeight: 36, footerHeight: 36 }, created: '2024-09-01T00:00:00Z', lastUsed: '2025-02-28T09:00:00Z', usageCount: 19 },
  { id: 'board', name: 'Board Dashboard', description: 'Executive-friendly with large KPIs and minimal text', isDefault: true, branding: { primaryColor: '#1e3a5f', secondaryColor: '#dbeafe', fontFamily: 'Inter', logoPosition: 'top-right', headerStyle: 'full-width', footerText: 'Board Confidential', coverStyle: 'dark-executive' }, sections: ['cover','executive_summary','climate_metrics','esg_scores','scenario_analysis','governance'], pageLayout: { margins: { top: 48, right: 48, bottom: 48, left: 48 }, headerHeight: 60, footerHeight: 36 }, created: '2024-10-15T00:00:00Z', lastUsed: '2025-03-01T16:00:00Z', usageCount: 15 },
  { id: 'client', name: 'Client Quarterly', description: 'Friendly tone with charts emphasis for quarterly updates', isDefault: true, branding: { primaryColor: '#059669', secondaryColor: '#ecfdf5', fontFamily: 'Inter', logoPosition: 'top-left', headerStyle: 'colored-bar', footerText: 'For Client Use Only', coverStyle: 'green-accent' }, sections: ['cover','portfolio_overview','esg_scores','climate_metrics','stewardship','benchmarking','disclaimer'], pageLayout: { margins: { top: 60, right: 60, bottom: 60, left: 60 }, headerHeight: 48, footerHeight: 30 }, created: '2024-11-01T00:00:00Z', lastUsed: '2025-03-20T11:00:00Z', usageCount: 35 },
];

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */
export default function TemplateManagerPage() {
  const navigate = useNavigate();
  const portfolio = useMemo(() => loadLS(LS_PORTFOLIO) || { name: 'Global ESG Fund', companies: GLOBAL_COMPANY_MASTER.slice(0, 30) }, []);

  /* ── State ──────────────────────────────────────────────────────────── */
  const [tab, setTab] = useState('gallery');
  const [customTemplates, setCustomTemplates] = useState(() => loadLS(LS_TEMPLATES) || []);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editMode, setEditMode] = useState(false); // false = viewing, true = editing/creating
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionSearch, setSectionSearch] = useState('');
  const [sectionCatFilter, setSectionCatFilter] = useState('All');
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const [versionHistory, setVersionHistory] = useState([]);

  /* ── Builder State ──────────────────────────────────────────────────── */
  const [builderName, setBuilderName] = useState('');
  const [builderDesc, setBuilderDesc] = useState('');
  const [builderBranding, setBuilderBranding] = useState({
    primaryColor: T.navy, secondaryColor: T.gold, fontFamily: 'Inter',
    logoPosition: 'top-left', headerStyle: 'full-width', footerText: '\u00a9 AA Impact Analytics', coverStyle: 'navy-gradient',
  });
  const [builderSections, setBuilderSections] = useState([]);
  const [builderMargins, setBuilderMargins] = useState({ top: 72, right: 72, bottom: 72, left: 72 });
  const [builderHeaderH, setBuilderHeaderH] = useState(48);
  const [builderFooterH, setBuilderFooterH] = useState(36);

  /* ── All templates combined ─────────────────────────────────────────── */
  const allTemplates = useMemo(() => [...DEFAULT_TEMPLATES, ...customTemplates], [customTemplates]);

  /* ── Persist custom templates ───────────────────────────────────────── */
  useEffect(() => { saveLS(LS_TEMPLATES, customTemplates); }, [customTemplates]);

  /* ── Template CRUD ──────────────────────────────────────────────────── */
  const loadToBuilder = useCallback((tmpl) => {
    setBuilderName(tmpl.name);
    setBuilderDesc(tmpl.description);
    setBuilderBranding({ ...tmpl.branding });
    setBuilderSections([...tmpl.sections]);
    if (tmpl.pageLayout) {
      setBuilderMargins({ ...tmpl.pageLayout.margins });
      setBuilderHeaderH(tmpl.pageLayout.headerHeight || 48);
      setBuilderFooterH(tmpl.pageLayout.footerHeight || 36);
    }
  }, []);

  const saveTemplate = useCallback(() => {
    if (!builderName.trim()) return;
    const tmpl = {
      id: editMode && selectedTemplate && !selectedTemplate.isDefault ? selectedTemplate.id : `custom_${Date.now()}`,
      name: builderName.trim(),
      description: builderDesc.trim(),
      isDefault: false,
      branding: { ...builderBranding },
      sections: [...builderSections],
      pageLayout: { margins: { ...builderMargins }, headerHeight: builderHeaderH, footerHeight: builderFooterH },
      created: editMode && selectedTemplate ? selectedTemplate.created : new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      usageCount: editMode && selectedTemplate ? (selectedTemplate.usageCount || 0) : 0,
    };
    if (editMode && selectedTemplate && !selectedTemplate.isDefault) {
      setCustomTemplates(prev => prev.map(t => t.id === tmpl.id ? tmpl : t));
      setVersionHistory(prev => [...prev, { templateId: tmpl.id, name: tmpl.name, date: new Date().toISOString(), action: 'Updated' }]);
    } else {
      setCustomTemplates(prev => [...prev, tmpl]);
      setVersionHistory(prev => [...prev, { templateId: tmpl.id, name: tmpl.name, date: new Date().toISOString(), action: 'Created' }]);
    }
    setSelectedTemplate(tmpl);
    setEditMode(false);
    setTab('gallery');
  }, [builderName, builderDesc, builderBranding, builderSections, builderMargins, builderHeaderH, builderFooterH, editMode, selectedTemplate]);

  const duplicateTemplate = useCallback((tmpl) => {
    const dup = { ...tmpl, id: `custom_${Date.now()}`, name: `${tmpl.name} (Copy)`, isDefault: false, created: new Date().toISOString(), usageCount: 0, sections: [...tmpl.sections], branding: { ...tmpl.branding } };
    if (tmpl.pageLayout) dup.pageLayout = { margins: { ...tmpl.pageLayout.margins }, headerHeight: tmpl.pageLayout.headerHeight, footerHeight: tmpl.pageLayout.footerHeight };
    setCustomTemplates(prev => [...prev, dup]);
    setVersionHistory(prev => [...prev, { templateId: dup.id, name: dup.name, date: new Date().toISOString(), action: 'Duplicated' }]);
  }, []);

  const deleteTemplate = useCallback((id) => {
    setCustomTemplates(prev => prev.filter(t => t.id !== id));
    if (selectedTemplate?.id === id) setSelectedTemplate(null);
    setVersionHistory(prev => [...prev, { templateId: id, name: 'Deleted', date: new Date().toISOString(), action: 'Deleted' }]);
  }, [selectedTemplate]);

  /* ── Section reorder ────────────────────────────────────────────────── */
  const moveSection = useCallback((idx, dir) => {
    setBuilderSections(prev => {
      const arr = [...prev];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return arr;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  }, []);

  const addSection = useCallback((secId) => {
    if (!builderSections.includes(secId)) setBuilderSections(prev => [...prev, secId]);
  }, [builderSections]);

  const removeSection = useCallback((secId) => {
    setBuilderSections(prev => prev.filter(s => s !== secId));
  }, []);

  /* ── Sort for table ─────────────────────────────────────────────────── */
  const sortedTemplates = useMemo(() => {
    let items = [...allTemplates];
    if (searchTerm) items = items.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.description.toLowerCase().includes(searchTerm.toLowerCase()));
    items.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (sortCol === 'sections') { va = (a.sections || []).length; vb = (b.sections || []).length; }
      if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb || '').toLowerCase(); }
      return sortDir === 'asc' ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
    });
    return items;
  }, [allTemplates, searchTerm, sortCol, sortDir]);

  const handleSort = (col) => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('asc'); } };

  /* ── Import / Export ────────────────────────────────────────────────── */
  const exportTemplates = useCallback(() => {
    const data = JSON.stringify(allTemplates, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `templates_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }, [allTemplates]);

  const handleImport = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (Array.isArray(imported)) {
          const customs = imported.filter(t => !DEFAULT_TEMPLATES.some(d => d.id === t.id)).map(t => ({ ...t, isDefault: false, id: t.id || `imported_${Date.now()}_${sr(_sc++).toString(36).slice(2, 6)}` }));
          setCustomTemplates(prev => [...prev, ...customs]);
        }
      } catch {}
    };
    reader.readAsText(file);
  }, []);

  /* ── KPIs ───────────────────────────────────────────────────────────── */
  const kpis = [
    { label: 'Templates Available', value: allTemplates.length, sub: 'total' },
    { label: 'Custom Templates', value: customTemplates.length, sub: 'user-created' },
    { label: 'Default Templates', value: DEFAULT_TEMPLATES.length, sub: 'pre-built' },
    { label: 'Sections Library', value: SECTION_LIBRARY.length, sub: 'available' },
    { label: 'Reports Using Templates', value: allTemplates.reduce((s, t) => s + (t.usageCount || 0), 0), sub: 'total generated' },
    { label: 'Last Created', value: customTemplates.length ? new Date(customTemplates[customTemplates.length - 1].created).toLocaleDateString() : 'N/A', sub: 'date' },
  ];

  /* ── Chart Data ─────────────────────────────────────────────────────── */
  const usageData = useMemo(() => allTemplates.map(t => ({ name: t.name.length > 16 ? t.name.slice(0, 16) + '...' : t.name, usage: t.usageCount || 0, sections: (t.sections || []).length })), [allTemplates]);

  const sectionCatData = useMemo(() => {
    const cats = {};
    SECTION_LIBRARY.forEach(s => { cats[s.category] = (cats[s.category] || 0) + 1; });
    return Object.entries(cats).map(([cat, ct]) => ({ name: cat, count: ct }));
  }, []);

  const PIE_COLORS = [T.navy, T.gold, T.sage, '#7c3aed', '#d97706', '#0d9488', '#dc2626', '#2563eb'];

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
    btn: (primary) => ({ padding: '10px 22px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: primary ? 'none' : `1px solid ${T.border}`, background: primary ? T.navy : T.surface, color: primary ? '#fff' : T.text, cursor: 'pointer', boxShadow: primary ? `0 2px 8px ${T.navy}30` : 'none' }),
    input: { padding: '8px 12px', fontSize: 13, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, width: '100%', outline: 'none' },
    select: { padding: '8px 12px', fontSize: 13, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, outline: 'none' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
    th: { padding: '10px 12px', textAlign: 'left', background: T.navy, color: '#fff', cursor: 'pointer', userSelect: 'none', fontSize: 11, fontWeight: 600 },
    td: { padding: '8px 12px', borderBottom: `1px solid ${T.border}` },
    navRow: { display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' },
    exportBtn: { padding: '7px 16px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.text, cursor: 'pointer' },
  };

  /* ── Template Preview Renderer ──────────────────────────────────────── */
  const TemplatePreview = ({ tmpl, compact = false }) => {
    const b = tmpl.branding || {};
    const cover = COVER_STYLES.find(c => c.id === b.coverStyle) || COVER_STYLES[0];
    const h = compact ? 180 : 300;
    return (
      <div style={{ width: '100%', height: h, borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.border}`, position: 'relative' }}>
        {/* Cover area */}
        <div style={{ height: h * 0.55, background: cover.bg, color: cover.textColor, padding: compact ? 12 : 20, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {b.logoPosition !== 'none' && (
            <div style={{ position: 'absolute', top: 8, [b.logoPosition === 'top-right' ? 'right' : b.logoPosition === 'top-center' ? 'left' : 'left']: b.logoPosition === 'top-center' ? '50%' : 10, transform: b.logoPosition === 'top-center' ? 'translateX(-50%)' : 'none', width: compact ? 20 : 32, height: compact ? 20 : 32, borderRadius: 4, background: `${b.secondaryColor || T.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: compact ? 10 : 14 }}>
              Logo
            </div>
          )}
          <div style={{ fontSize: compact ? 11 : 18, fontWeight: 700, fontFamily: b.fontFamily || 'Inter' }}>{tmpl.name}</div>
          {!compact && <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>Sample Report &middot; 2025-Q4</div>}
        </div>
        {/* Header bar */}
        {b.headerStyle === 'full-width' && <div style={{ height: 4, background: b.primaryColor || T.navy }} />}
        {b.headerStyle === 'colored-bar' && <div style={{ height: 4, background: b.primaryColor || T.navy }} />}
        {b.headerStyle === 'line-only' && <div style={{ height: 1, background: T.border }} />}
        {/* Content area */}
        <div style={{ padding: compact ? 8 : 16, background: '#fff' }}>
          <div style={{ fontSize: compact ? 8 : 12, fontWeight: 700, color: b.primaryColor || T.navy, marginBottom: compact ? 4 : 8 }}>Executive Summary</div>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: compact ? 4 : 6, background: T.border, borderRadius: 2, marginBottom: compact ? 3 : 4, width: `${90 - i * 10}%` }} />
          ))}
          {!compact && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {[b.primaryColor, b.secondaryColor, T.sage].map((c, i) => (
                <div key={i} style={{ width: 40, height: 24, borderRadius: 4, background: c || T.navy, opacity: 0.7 }} />
              ))}
            </div>
          )}
        </div>
        {/* Footer */}
        {b.footerText && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px 10px', background: '#f8f7f5', borderTop: `1px solid ${T.border}`, fontSize: compact ? 7 : 9, color: T.textMut, textAlign: 'center' }}>
            {b.footerText}
          </div>
        )}
      </div>
    );
  };

  /* ── Tab definitions ────────────────────────────────────────────────── */
  const TABS = [
    { id: 'gallery', label: 'Gallery' },
    { id: 'builder', label: 'Template Builder' },
    { id: 'preview', label: 'Preview' },
    { id: 'sections', label: 'Section Library' },
    { id: 'compare', label: 'Compare' },
    { id: 'usage', label: 'Usage Stats' },
    { id: 'versions', label: 'Version History' },
    { id: 'table', label: 'Sortable Table' },
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
            <h1 style={S.title}>Branded Template Manager</h1>
            <span style={S.badge}>5 Default &middot; Custom &middot; Branding &middot; Sections</span>
          </div>
          <p style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>Design and manage reusable report templates with custom branding, sections, and layouts</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.btn(false)} onClick={() => navigate('/report-generator')}>Report Generator</button>
          <button style={S.btn(false)} onClick={() => navigate('/report-studio')}>Report Studio</button>
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

      {/* ── TAB: Gallery ──────────────────────────────────────────────── */}
      {tab === 'gallery' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <input style={{ ...S.input, maxWidth: 280 }} placeholder="Search templates..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <button style={S.btn(true)} onClick={() => { setEditMode(false); setBuilderName(''); setBuilderDesc(''); setBuilderBranding({ primaryColor: T.navy, secondaryColor: T.gold, fontFamily: 'Inter', logoPosition: 'top-left', headerStyle: 'full-width', footerText: '\u00a9 AA Impact Analytics', coverStyle: 'navy-gradient' }); setBuilderSections([]); setTab('builder'); }}>
              + New Template
            </button>
          </div>
          <div style={S.grid3}>
            {allTemplates.filter(t => !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase())).map(tmpl => (
              <div key={tmpl.id} style={{ ...S.card, cursor: 'pointer', padding: 0, overflow: 'hidden', border: `2px solid ${selectedTemplate?.id === tmpl.id ? T.navy : T.border}` }} onClick={() => setSelectedTemplate(tmpl)}>
                <TemplatePreview tmpl={tmpl} compact />
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{tmpl.name}</span>
                    {tmpl.isDefault && <span style={{ fontSize: 9, fontWeight: 600, color: T.gold, background: `${T.gold}18`, borderRadius: 4, padding: '2px 6px' }}>DEFAULT</span>}
                  </div>
                  <p style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>{tmpl.description}</p>
                  <div style={{ display: 'flex', gap: 12, fontSize: 10, color: T.textMut }}>
                    <span>{(tmpl.sections || []).length} sections</span>
                    <span>{tmpl.usageCount || 0} reports</span>
                    <span>{tmpl.branding?.fontFamily || 'Inter'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                    <button style={{ ...S.exportBtn, fontSize: 10, padding: '4px 10px' }} onClick={(e) => { e.stopPropagation(); loadToBuilder(tmpl); setSelectedTemplate(tmpl); setEditMode(true); setTab('builder'); }}>Edit</button>
                    <button style={{ ...S.exportBtn, fontSize: 10, padding: '4px 10px' }} onClick={(e) => { e.stopPropagation(); duplicateTemplate(tmpl); }}>Duplicate</button>
                    {!tmpl.isDefault && <button style={{ ...S.exportBtn, fontSize: 10, padding: '4px 10px', color: T.red }} onClick={(e) => { e.stopPropagation(); deleteTemplate(tmpl.id); }}>Delete</button>}
                    <button style={{ ...S.exportBtn, fontSize: 10, padding: '4px 10px' }} onClick={(e) => { e.stopPropagation(); setSelectedTemplate(tmpl); setTab('preview'); }}>Preview</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: Template Builder ─────────────────────────────────────── */}
      {tab === 'builder' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Left: Configuration */}
          <div>
            <div style={S.card}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 12 }}>{editMode ? 'Edit Template' : 'Create New Template'}</h3>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: T.textSec, display: 'block', marginBottom: 2 }}>Template Name</label>
                <input style={S.input} value={builderName} onChange={e => setBuilderName(e.target.value)} placeholder="e.g., ESG Annual Report" />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: T.textSec, display: 'block', marginBottom: 2 }}>Description</label>
                <input style={S.input} value={builderDesc} onChange={e => setBuilderDesc(e.target.value)} placeholder="Brief description of this template's purpose" />
              </div>
            </div>

            {/* Branding */}
            <div style={S.card}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Branding</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, color: T.textSec }}>Primary Color</label>
                  <input type="color" value={builderBranding.primaryColor} onChange={e => setBuilderBranding(p => ({ ...p, primaryColor: e.target.value }))} style={{ width: '100%', height: 36, border: 'none', cursor: 'pointer' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: T.textSec }}>Secondary Color</label>
                  <input type="color" value={builderBranding.secondaryColor} onChange={e => setBuilderBranding(p => ({ ...p, secondaryColor: e.target.value }))} style={{ width: '100%', height: 36, border: 'none', cursor: 'pointer' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                <div>
                  <label style={{ fontSize: 11, color: T.textSec }}>Font Family</label>
                  <select style={S.select} value={builderBranding.fontFamily} onChange={e => setBuilderBranding(p => ({ ...p, fontFamily: e.target.value }))}>
                    {['Inter','Roboto','Times New Roman','Georgia','Helvetica'].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: T.textSec }}>Logo Position</label>
                  <select style={S.select} value={builderBranding.logoPosition} onChange={e => setBuilderBranding(p => ({ ...p, logoPosition: e.target.value }))}>
                    {['top-left','top-center','top-right','none'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                <div>
                  <label style={{ fontSize: 11, color: T.textSec }}>Header Style</label>
                  <select style={S.select} value={builderBranding.headerStyle} onChange={e => setBuilderBranding(p => ({ ...p, headerStyle: e.target.value }))}>
                    {['full-width','colored-bar','line-only','minimal'].map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: T.textSec }}>Cover Style</label>
                  <select style={S.select} value={builderBranding.coverStyle} onChange={e => setBuilderBranding(p => ({ ...p, coverStyle: e.target.value }))}>
                    {COVER_STYLES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <label style={{ fontSize: 11, color: T.textSec }}>Footer Text</label>
                <input style={S.input} value={builderBranding.footerText} onChange={e => setBuilderBranding(p => ({ ...p, footerText: e.target.value }))} />
              </div>
              {/* Cover Style Preview */}
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 11, color: T.textSec, marginBottom: 4, display: 'block' }}>Cover Previews</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {COVER_STYLES.map(cs => (
                    <div key={cs.id} onClick={() => setBuilderBranding(p => ({ ...p, coverStyle: cs.id }))} style={{ width: 48, height: 36, borderRadius: 6, background: cs.bg, border: `2px solid ${builderBranding.coverStyle === cs.id ? T.navy : T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 7, color: cs.textColor, fontWeight: 600 }}>{cs.name.slice(0, 3)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Page Layout */}
            <div style={S.card}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Page Layout</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[['top','Top'],['right','Right'],['bottom','Bottom'],['left','Left']].map(([k, label]) => (
                  <div key={k}>
                    <label style={{ fontSize: 10, color: T.textSec }}>{label} Margin</label>
                    <input type="number" style={S.input} value={builderMargins[k]} onChange={e => setBuilderMargins(p => ({ ...p, [k]: +e.target.value }))} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                <div>
                  <label style={{ fontSize: 10, color: T.textSec }}>Header Height</label>
                  <input type="number" style={S.input} value={builderHeaderH} onChange={e => setBuilderHeaderH(+e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: T.textSec }}>Footer Height</label>
                  <input type="number" style={S.input} value={builderFooterH} onChange={e => setBuilderFooterH(+e.target.value)} />
                </div>
              </div>
            </div>

            <button style={{ ...S.btn(true), width: '100%', padding: '14px 24px', fontSize: 15 }} onClick={saveTemplate} disabled={!builderName.trim()}>
              {editMode ? 'Save Changes' : 'Create Template'}
            </button>
          </div>

          {/* Right: Section Builder + Live Preview */}
          <div>
            <div style={S.card}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Section Builder ({builderSections.length} selected)</h4>
              <p style={{ fontSize: 11, color: T.textSec, marginBottom: 10 }}>Use arrows to reorder. Click + to add from the library below.</p>
              {builderSections.length === 0 ? (
                <p style={{ fontSize: 12, color: T.textMut, textAlign: 'center', padding: 16 }}>No sections added yet. Add sections from the library below.</p>
              ) : (
                <div>
                  {builderSections.map((secId, idx) => {
                    const sec = SECTION_LIBRARY.find(s => s.id === secId);
                    return (
                      <div key={secId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: idx % 2 ? T.surfaceH : T.surface, borderRadius: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 11, color: T.textMut, width: 20, textAlign: 'center' }}>{idx + 1}</span>
                        <span style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{sec?.name || secId}</span>
                        <span style={{ fontSize: 9, color: T.textMut }}>{sec?.category}</span>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: T.textSec, padding: '0 4px' }} onClick={() => moveSection(idx, -1)} disabled={idx === 0}>{'\u25B2'}</button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: T.textSec, padding: '0 4px' }} onClick={() => moveSection(idx, 1)} disabled={idx === builderSections.length - 1}>{'\u25BC'}</button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: T.red, padding: '0 4px' }} onClick={() => removeSection(secId)}>{'\u2715'}</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Available Sections */}
            <div style={S.card}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Available Sections</h4>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input style={{ ...S.input, maxWidth: 200 }} placeholder="Search..." value={sectionSearch} onChange={e => setSectionSearch(e.target.value)} />
                <select style={S.select} value={sectionCatFilter} onChange={e => setSectionCatFilter(e.target.value)}>
                  <option>All</option>
                  {SECTION_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ maxHeight: 240, overflow: 'auto' }}>
                {SECTION_LIBRARY.filter(s => (sectionCatFilter === 'All' || s.category === sectionCatFilter) && (!sectionSearch || s.name.toLowerCase().includes(sectionSearch.toLowerCase()))).map(sec => {
                  const added = builderSections.includes(sec.id);
                  return (
                    <div key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderBottom: `1px solid ${T.border}`, opacity: added ? 0.5 : 1 }}>
                      <button style={{ background: added ? T.textMut : T.sage, color: '#fff', border: 'none', borderRadius: 4, width: 22, height: 22, cursor: added ? 'default' : 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => !added && addSection(sec.id)}>
                        {added ? '\u2713' : '+'}
                      </button>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{sec.name}</span>
                        <span style={{ fontSize: 9, color: T.textMut, marginLeft: 8 }}>{sec.category}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Builder Live Preview */}
            <div style={S.card}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Live Preview</h4>
              <TemplatePreview tmpl={{ name: builderName || 'Untitled Template', description: builderDesc, branding: builderBranding, sections: builderSections }} />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Preview ──────────────────────────────────────────────── */}
      {tab === 'preview' && (
        <div>
          {!selectedTemplate ? (
            <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
              <p style={{ fontSize: 15, color: T.textSec }}>Select a template from the Gallery to preview it.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={S.card}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{selectedTemplate.name}</h3>
                  <p style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>{selectedTemplate.description}</p>
                  <TemplatePreview tmpl={selectedTemplate} />
                </div>
                {/* Branding Details */}
                <div style={S.card}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Branding Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {Object.entries(selectedTemplate.branding || {}).map(([k, v]) => (
                      <div key={k} style={{ padding: '6px 10px', background: T.surfaceH, borderRadius: 6 }}>
                        <div style={{ fontSize: 10, color: T.textMut }}>{k.replace(/([A-Z])/g, ' $1')}</div>
                        <div style={{ fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {(k.includes('Color') || k.includes('color')) && <span style={{ width: 12, height: 12, borderRadius: 3, background: v, border: `1px solid ${T.border}` }} />}
                          {String(v)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                {/* Sections */}
                <div style={S.card}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Sections ({(selectedTemplate.sections || []).length})</h4>
                  {(selectedTemplate.sections || []).map((secId, i) => {
                    const sec = SECTION_LIBRARY.find(s => s.id === secId);
                    return (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 10px', borderBottom: `1px solid ${T.border}` }}>
                        <span style={{ fontSize: 11, color: T.textMut, width: 24 }}>{i + 1}.</span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{sec?.name || secId}</div>
                          <div style={{ fontSize: 10, color: T.textMut }}>{sec?.description || ''}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Template Metadata */}
                <div style={S.card}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Metadata</h4>
                  {[
                    ['Type', selectedTemplate.isDefault ? 'Default' : 'Custom'],
                    ['Created', new Date(selectedTemplate.created).toLocaleDateString()],
                    ['Last Used', selectedTemplate.lastUsed ? new Date(selectedTemplate.lastUsed).toLocaleDateString() : 'Never'],
                    ['Usage Count', selectedTemplate.usageCount || 0],
                    ['Font', selectedTemplate.branding?.fontFamily || 'Inter'],
                  ].map(([k, v], i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                      <span style={{ color: T.textSec }}>{k}</span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Section Library ──────────────────────────────────────── */}
      {tab === 'sections' && (
        <div style={S.card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Section Library ({SECTION_LIBRARY.length} sections)</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <input style={{ ...S.input, maxWidth: 260 }} placeholder="Search sections..." value={sectionSearch} onChange={e => setSectionSearch(e.target.value)} />
            <select style={S.select} value={sectionCatFilter} onChange={e => setSectionCatFilter(e.target.value)}>
              <option>All</option>
              {SECTION_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
            {SECTION_LIBRARY.filter(s => (sectionCatFilter === 'All' || s.category === sectionCatFilter) && (!sectionSearch || s.name.toLowerCase().includes(sectionSearch.toLowerCase()))).map(sec => {
              const usedIn = allTemplates.filter(t => (t.sections || []).includes(sec.id));
              return (
                <div key={sec.id} style={{ padding: 14, background: T.surfaceH, borderRadius: 10, border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{sec.name}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, color: T.textSec, background: `${T.navy}10`, borderRadius: 4, padding: '2px 8px' }}>{sec.category}</span>
                  </div>
                  <p style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}>{sec.description}</p>
                  <div style={{ fontSize: 10, color: T.textMut }}>
                    Used in {usedIn.length} template{usedIn.length !== 1 ? 's' : ''}: {usedIn.map(t => t.name).join(', ') || 'none'}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Section Category Distribution */}
          <div style={{ marginTop: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Sections by Category</h4>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={sectionCatData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, count }) => `${name} (${count})`} labelLine={{ stroke: T.textMut }} style={{ fontSize: 10 }}>
                  {sectionCatData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.border}` }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── TAB: Compare ──────────────────────────────────────────────── */}
      {tab === 'compare' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: T.textSec, display: 'block', marginBottom: 4 }}>Template A</label>
              <select style={S.select} value={compareA?.id || ''} onChange={e => setCompareA(allTemplates.find(t => t.id === e.target.value) || null)}>
                <option value="">Select...</option>
                {allTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: T.textSec, display: 'block', marginBottom: 4 }}>Template B</label>
              <select style={S.select} value={compareB?.id || ''} onChange={e => setCompareB(allTemplates.find(t => t.id === e.target.value) || null)}>
                <option value="">Select...</option>
                {allTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          {compareA && compareB ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[compareA, compareB].map((tmpl, ti) => (
                <div key={ti}>
                  <div style={S.card}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{tmpl.name}</h4>
                    <TemplatePreview tmpl={tmpl} />
                  </div>
                  <div style={S.card}>
                    <h5 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Branding</h5>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {['primaryColor','secondaryColor'].map(k => (
                        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: T.surfaceH, borderRadius: 4 }}>
                          <span style={{ width: 14, height: 14, borderRadius: 3, background: tmpl.branding?.[k], border: `1px solid ${T.border}` }} />
                          <span style={{ fontSize: 10 }}>{tmpl.branding?.[k]}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 6 }}>Font: {tmpl.branding?.fontFamily} &middot; Header: {tmpl.branding?.headerStyle} &middot; Cover: {tmpl.branding?.coverStyle}</div>
                  </div>
                  <div style={S.card}>
                    <h5 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Sections ({(tmpl.sections || []).length})</h5>
                    {(tmpl.sections || []).map((secId, i) => {
                      const inOther = ti === 0 ? (compareB.sections || []).includes(secId) : (compareA.sections || []).includes(secId);
                      return (
                        <div key={i} style={{ fontSize: 11, padding: '3px 0', color: inOther ? T.text : T.amber, fontWeight: inOther ? 400 : 600 }}>
                          {i + 1}. {SECTION_LIBRARY.find(s => s.id === secId)?.name || secId}
                          {!inOther && <span style={{ fontSize: 9, marginLeft: 6, color: T.amber }}>(unique)</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
              <p style={{ fontSize: 14, color: T.textMut }}>Select two templates above to compare them side by side.</p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Usage Stats ──────────────────────────────────────────── */}
      {tab === 'usage' && (
        <div>
          <div style={S.card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Template Usage Statistics</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.border}` }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="usage" fill={T.navy} radius={[4, 4, 0, 0]} name="Reports Generated" />
                <Bar dataKey="sections" fill={T.gold} radius={[4, 4, 0, 0]} name="Sections Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={S.card}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Ranking</h4>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Rank</th><th style={S.th}>Template</th><th style={S.th}>Reports</th><th style={S.th}>Sections</th><th style={S.th}>Last Used</th>
                </tr>
              </thead>
              <tbody>
                {allTemplates.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)).map((t, i) => (
                  <tr key={t.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={S.td}><span style={{ fontWeight: 700, color: i < 3 ? T.gold : T.textMut }}>{i + 1}</span></td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{t.name}</td>
                    <td style={S.td}>{t.usageCount || 0}</td>
                    <td style={S.td}>{(t.sections || []).length}</td>
                    <td style={S.td}>{t.lastUsed ? new Date(t.lastUsed).toLocaleDateString() : 'Never'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: Version History ──────────────────────────────────────── */}
      {tab === 'versions' && (
        <div style={S.card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Template Version History</h3>
          {versionHistory.length === 0 ? (
            <p style={{ fontSize: 13, color: T.textMut, textAlign: 'center', padding: 24 }}>No version history yet. Create or edit templates to track changes.</p>
          ) : (
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Date</th><th style={S.th}>Template</th><th style={S.th}>Action</th><th style={S.th}>ID</th>
                </tr>
              </thead>
              <tbody>
                {[...versionHistory].reverse().map((v, i) => (
                  <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={S.td}>{new Date(v.date).toLocaleString()}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{v.name}</td>
                    <td style={S.td}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: v.action === 'Created' ? `${T.green}15` : v.action === 'Deleted' ? `${T.red}15` : `${T.amber}15`, color: v.action === 'Created' ? T.green : v.action === 'Deleted' ? T.red : T.amber }}>
                        {v.action}
                      </span>
                    </td>
                    <td style={{ ...S.td, fontSize: 10, color: T.textMut, fontFamily: 'monospace' }}>{v.templateId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB: Sortable Table ───────────────────────────────────────── */}
      {tab === 'table' && (
        <div style={S.card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 8 }}>All Templates</h3>
          <input style={{ ...S.input, maxWidth: 280, marginBottom: 12 }} placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  {[['name','Name'],['description','Description'],['sections','Sections'],['usageCount','Reports'],['created','Created']].map(([col, label]) => (
                    <th key={col} style={S.th} onClick={() => handleSort(col)}>
                      {label} {sortCol === col ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}
                    </th>
                  ))}
                  <th style={S.th}>Type</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedTemplates.map((t, i) => (
                  <tr key={t.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ ...S.td, fontWeight: 600 }}>{t.name}</td>
                    <td style={{ ...S.td, fontSize: 11, color: T.textSec, maxWidth: 200 }}>{t.description}</td>
                    <td style={S.td}>{(t.sections || []).length}</td>
                    <td style={S.td}>{t.usageCount || 0}</td>
                    <td style={S.td}>{new Date(t.created).toLocaleDateString()}</td>
                    <td style={S.td}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: t.isDefault ? T.gold : T.sage }}>{t.isDefault ? 'Default' : 'Custom'}</span>
                    </td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button style={{ ...S.exportBtn, fontSize: 10, padding: '3px 8px' }} onClick={() => { setSelectedTemplate(t); setTab('preview'); }}>View</button>
                        <button style={{ ...S.exportBtn, fontSize: 10, padding: '3px 8px' }} onClick={() => { loadToBuilder(t); setSelectedTemplate(t); setEditMode(true); setTab('builder'); }}>Edit</button>
                        <button style={{ ...S.exportBtn, fontSize: 10, padding: '3px 8px' }} onClick={() => duplicateTemplate(t)}>Dup</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Exports & Navigation ──────────────────────────────────────── */}
      <div style={S.navRow}>
        <button style={S.exportBtn} onClick={exportTemplates}>Export Templates (JSON)</button>
        <button style={S.exportBtn} onClick={() => {
          const rows = [['Name','Description','Sections','Usage','Font','Primary Color','Created'].join(','), ...allTemplates.map(t => [t.name, `"${t.description}"`, (t.sections || []).length, t.usageCount || 0, t.branding?.fontFamily, t.branding?.primaryColor, new Date(t.created).toLocaleDateString()].join(','))];
          const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
          const url = URL.createObjectURL(blob); const a = document.createElement('a');
          a.href = url; a.download = `template_library_${new Date().toISOString().slice(0, 10)}.csv`;
          document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        }}>Export Library (CSV)</button>
        <button style={S.exportBtn} onClick={() => window.print()}>Print View</button>
        <label style={{ ...S.exportBtn, cursor: 'pointer' }}>
          Import Templates
          <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
        </label>
        <div style={{ flex: 1 }} />
        <button style={{ ...S.exportBtn, fontWeight: 600, color: T.navy }} onClick={() => navigate('/report-generator')}>Report Generator &rarr;</button>
        <button style={{ ...S.exportBtn, fontWeight: 600, color: T.navy }} onClick={() => navigate('/report-studio')}>Report Studio &rarr;</button>
      </div>
    </div>
  );
}
