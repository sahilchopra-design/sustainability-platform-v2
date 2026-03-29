import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ═══════════════════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#4f46e5','#0891b2','#7c3aed','#be185d','#d97706','#15803d','#1e40af','#9f1239','#059669'];
const SEV_CLR = { critical: T.red, high: '#ea580c', medium: T.amber, low: '#6b7280' };

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const LS_PORTFOLIO = 'ra_portfolio_v1';
const LS_RULES = 'ra_validation_rules_v1';
const LS_FIXES = 'ra_validation_fixes_v1';
const LS_SCAN_HIST = 'ra_validation_scan_history_v1';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const fmt = (n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';
const pct = (n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';
const seed = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i); return Math.abs(h); };
const sRand = (n) => { let x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };

const VALID_SECTORS = ['Energy','Materials','Industrials','Consumer Discretionary','Consumer Staples','Health Care','Financials','Information Technology','Communication Services','Utilities','Real Estate'];

/* ═══════════════════════════════════════════════════════════════════════════
   VALIDATION RULES (50 across 8 categories)
   ═══════════════════════════════════════════════════════════════════════════ */
const DEFAULT_RULES = [
  // Identity (5)
  { id:'V001', cat:'Identity', field:'name', rule:'Company name must not be empty', sev:'critical', check:'name_not_empty', autofix:null },
  { id:'V002', cat:'Identity', field:'ticker', rule:'Ticker must be alphanumeric 1-10 chars', sev:'critical', check:'ticker_format', autofix:null },
  { id:'V003', cat:'Identity', field:'sector', rule:'Must be valid GICS sector', sev:'high', check:'valid_sector', autofix:'Map closest sector' },
  { id:'V004', cat:'Identity', field:'exchange', rule:'Must be recognized exchange', sev:'high', check:'has_exchange', autofix:null },
  { id:'V005', cat:'Identity', field:'isin', rule:'ISIN format: 2 letters + 10 chars', sev:'medium', check:'isin_format', autofix:null },
  // Financial (10)
  { id:'V010', cat:'Financial', field:'revenue_usd_mn', rule:'Revenue must be > 0', sev:'critical', check:'revenue_positive', autofix:'Sector median' },
  { id:'V011', cat:'Financial', field:'market_cap_usd_mn', rule:'Market cap must be > 0', sev:'critical', check:'mcap_positive', autofix:'Revenue x sector P/S' },
  { id:'V012', cat:'Financial', field:'evic_usd_mn', rule:'EVIC must be >= 80% of market cap', sev:'high', check:'evic_ge_mcap', autofix:'Set EVIC = MCap + Debt' },
  { id:'V013', cat:'Financial', field:'employees', rule:'Employees must be > 0', sev:'medium', check:'employees_positive', autofix:'Revenue/sector avg productivity' },
  { id:'V014', cat:'Financial', field:'revenue_usd_mn', rule:'Revenue/employee $10K-$5M range', sev:'low', check:'rev_per_employee', autofix:null },
  { id:'V015', cat:'Financial', field:'market_cap_usd_mn', rule:'P/Revenue ratio 0.1-100x', sev:'low', check:'p_revenue_ratio', autofix:null },
  { id:'V016', cat:'Financial', field:'evic_usd_mn', rule:'EVIC/Revenue ratio 0.2-200x', sev:'low', check:'evic_revenue_ratio', autofix:null },
  { id:'V017', cat:'Financial', field:'total_debt_usd_mn', rule:'Debt must be >= 0 if present', sev:'medium', check:'debt_non_negative', autofix:'Set to 0' },
  { id:'V018', cat:'Financial', field:'ebitda_usd_mn', rule:'EBITDA margin -100% to 100%', sev:'low', check:'ebitda_margin', autofix:null },
  { id:'V019', cat:'Financial', field:'net_profit_usd_mn', rule:'Net margin -200% to 100%', sev:'low', check:'net_margin', autofix:null },
  // ESG (10)
  { id:'V020', cat:'ESG', field:'esg_score', rule:'ESG score must be 0-100', sev:'high', check:'esg_range', autofix:'Clamp 0-100' },
  { id:'V021', cat:'ESG', field:'transition_risk_score', rule:'Transition risk must be 0-100', sev:'high', check:'trisk_range', autofix:'Clamp 0-100' },
  { id:'V022', cat:'ESG', field:'esg_score', rule:'ESG score must be present', sev:'medium', check:'esg_present', autofix:'Sector median ESG' },
  { id:'V023', cat:'ESG', field:'data_quality_score', rule:'DQS must be 0-100', sev:'medium', check:'dqs_range', autofix:'Clamp 0-100' },
  { id:'V024', cat:'ESG', field:'esg_score', rule:'ESG consistent with sector average (+/- 40)', sev:'low', check:'esg_sector_consistency', autofix:null },
  { id:'V025', cat:'ESG', field:'transition_risk_score', rule:'T-Risk present', sev:'medium', check:'trisk_present', autofix:'Sector median T-Risk' },
  { id:'V026', cat:'ESG', field:'esg_score', rule:'ESG not default (exactly 50)', sev:'low', check:'esg_not_default', autofix:null },
  { id:'V027', cat:'ESG', field:'data_quality_score', rule:'DQS present', sev:'low', check:'dqs_present', autofix:'Set 50 (baseline)' },
  { id:'V028', cat:'ESG', field:'transition_risk_score', rule:'T-Risk inversely correlated with ESG', sev:'low', check:'trisk_esg_inverse', autofix:null },
  { id:'V029', cat:'ESG', field:'esg_score', rule:'High-carbon sector ESG < 80', sev:'low', check:'highcarbon_esg_cap', autofix:null },
  // Emissions (10)
  { id:'V030', cat:'Emissions', field:'scope1_mt', rule:'Scope 1 must be >= 0', sev:'critical', check:'s1_non_negative', autofix:'Set 0' },
  { id:'V031', cat:'Emissions', field:'scope2_mt', rule:'Scope 2 must be >= 0', sev:'critical', check:'s2_non_negative', autofix:'Set 0' },
  { id:'V032', cat:'Emissions', field:'scope1_mt', rule:'Scope 1 < 1000 Mt sanity', sev:'medium', check:'s1_sanity', autofix:null },
  { id:'V033', cat:'Emissions', field:'ghg_intensity_tco2e_per_mn', rule:'GHG intensity ~ (S1+S2)/Revenue', sev:'medium', check:'ghg_intensity_consistency', autofix:'Recalc from S1+S2/Rev' },
  { id:'V034', cat:'Emissions', field:'scope1_mt', rule:'Energy sector S1 > 0.001 Mt', sev:'low', check:'energy_s1_floor', autofix:null },
  { id:'V035', cat:'Emissions', field:'scope2_mt', rule:'IT sector S2 > S1 typically', sev:'low', check:'it_s2_gt_s1', autofix:null },
  { id:'V036', cat:'Emissions', field:'scope1_mt', rule:'S1+S2 > 0 (data present)', sev:'medium', check:'emissions_present', autofix:'Sector median' },
  { id:'V037', cat:'Emissions', field:'ghg_intensity_tco2e_per_mn', rule:'GHG intensity present', sev:'medium', check:'ghg_intensity_present', autofix:'Calc S1+S2/Rev' },
  { id:'V038', cat:'Emissions', field:'scope1_mt', rule:'S1 not suspiciously round (not exact 0.0)', sev:'low', check:'s1_not_zero_exact', autofix:null },
  { id:'V039', cat:'Emissions', field:'scope2_mt', rule:'S2 <= 10x S1 for non-IT sectors', sev:'low', check:'s2_ratio_check', autofix:null },
  // Climate Targets (5)
  { id:'V040', cat:'Climate', field:'carbon_neutral_target_year', rule:'NZ year 2025-2100 or null', sev:'low', check:'nz_year_range', autofix:null },
  { id:'V041', cat:'Climate', field:'sbti_committed', rule:'SBTi must be boolean', sev:'low', check:'sbti_boolean', autofix:'Set false' },
  { id:'V042', cat:'Climate', field:'carbon_neutral_target_year', rule:'NZ year > 2030 if set', sev:'low', check:'nz_year_realistic', autofix:null },
  { id:'V043', cat:'Climate', field:'sbti_committed', rule:'SBTi present', sev:'low', check:'sbti_present', autofix:'Set false' },
  { id:'V044', cat:'Climate', field:'carbon_neutral_target_year', rule:'Energy sector should have NZ target', sev:'low', check:'energy_nz_target', autofix:null },
  // Cross-Referential (5)
  { id:'V050', cat:'Cross-Ref', field:'evic_usd_mn', rule:'EVIC = MCap + Debt (approx)', sev:'medium', check:'evic_decomposition', autofix:'Set EVIC = MCap+Debt' },
  { id:'V051', cat:'Cross-Ref', field:'ghg_intensity_tco2e_per_mn', rule:'Intensity = (S1+S2)*1e6/Rev', sev:'medium', check:'intensity_calc_check', autofix:'Recalculate' },
  { id:'V052', cat:'Cross-Ref', field:'employees', rule:'Revenue/employee consistent', sev:'low', check:'rev_emp_crosscheck', autofix:null },
  { id:'V053', cat:'Cross-Ref', field:'market_cap_usd_mn', rule:'MCap/EVIC ratio 0.3-1.2', sev:'low', check:'mcap_evic_ratio', autofix:null },
  { id:'V054', cat:'Cross-Ref', field:'esg_score', rule:'Low ESG + Low TRisk = suspicious', sev:'low', check:'esg_trisk_suspicious', autofix:null },
  // Temporal (3)
  { id:'V060', cat:'Temporal', field:'revenue_usd_mn', rule:'Revenue not stale (> $1M)', sev:'low', check:'revenue_not_stale', autofix:null },
  { id:'V061', cat:'Temporal', field:'market_cap_usd_mn', rule:'MCap updated (non-zero)', sev:'medium', check:'mcap_updated', autofix:null },
  { id:'V062', cat:'Temporal', field:'esg_score', rule:'ESG score updated from default', sev:'low', check:'esg_updated', autofix:null },
  // Sector-Specific (2)
  { id:'V070', cat:'Sector', field:'scope1_mt', rule:'Financials S1 < 1Mt typically', sev:'low', check:'financials_low_s1', autofix:null },
  { id:'V071', cat:'Sector', field:'employees', rule:'IT companies > 100 employees typically', sev:'low', check:'it_employee_floor', autofix:null },
];

/* ── Rule check implementations ──────────────────────────────────────────── */
const CHECKS = {
  name_not_empty: c => !!c.name && c.name.length > 1,
  ticker_format: c => /^[A-Z0-9.]{1,10}$/i.test(c.ticker || ''),
  valid_sector: c => VALID_SECTORS.includes(c.sector),
  has_exchange: c => !!c._displayExchange || !!c.exchange,
  isin_format: c => !c.isin || /^[A-Z]{2}[A-Z0-9]{10}$/.test(c.isin),
  revenue_positive: c => (c.revenue_usd_mn || 0) > 0,
  mcap_positive: c => (c.market_cap_usd_mn || 0) > 0,
  evic_ge_mcap: c => !c.evic_usd_mn || !c.market_cap_usd_mn || c.evic_usd_mn >= c.market_cap_usd_mn * 0.8,
  employees_positive: c => (c.employees || 0) > 0,
  rev_per_employee: c => { const r = (c.revenue_usd_mn || 0) * 1e6 / (c.employees || 1); return r > 10000 && r < 5000000; },
  p_revenue_ratio: c => { const pr = (c.market_cap_usd_mn || 0) / (c.revenue_usd_mn || 1); return pr > 0.1 && pr < 100; },
  evic_revenue_ratio: c => !c.evic_usd_mn || (c.evic_usd_mn / (c.revenue_usd_mn || 1) > 0.2 && c.evic_usd_mn / (c.revenue_usd_mn || 1) < 200),
  debt_non_negative: c => !c.total_debt_usd_mn || c.total_debt_usd_mn >= 0,
  ebitda_margin: c => !c.ebitda_usd_mn || !c.revenue_usd_mn || Math.abs(c.ebitda_usd_mn / c.revenue_usd_mn) <= 1,
  net_margin: c => !c.net_profit_usd_mn || !c.revenue_usd_mn || (c.net_profit_usd_mn / c.revenue_usd_mn > -2 && c.net_profit_usd_mn / c.revenue_usd_mn < 1),
  esg_range: c => (c.esg_score || 0) >= 0 && (c.esg_score || 0) <= 100,
  trisk_range: c => !c.transition_risk_score || (c.transition_risk_score >= 0 && c.transition_risk_score <= 100),
  esg_present: c => c.esg_score !== undefined && c.esg_score !== null,
  dqs_range: c => !c.data_quality_score || (c.data_quality_score >= 0 && c.data_quality_score <= 100),
  esg_sector_consistency: c => true,
  trisk_present: c => c.transition_risk_score !== undefined && c.transition_risk_score !== null,
  esg_not_default: c => c.esg_score !== 50,
  dqs_present: c => c.data_quality_score !== undefined && c.data_quality_score !== null,
  trisk_esg_inverse: c => !c.transition_risk_score || !c.esg_score || Math.abs((c.transition_risk_score + c.esg_score) - 100) < 60,
  highcarbon_esg_cap: c => !['Energy','Materials','Utilities'].includes(c.sector) || (c.esg_score || 50) < 80,
  s1_non_negative: c => !c.scope1_mt || c.scope1_mt >= 0,
  s2_non_negative: c => !c.scope2_mt || c.scope2_mt >= 0,
  s1_sanity: c => !c.scope1_mt || c.scope1_mt < 1000,
  ghg_intensity_consistency: c => { if (!c.ghg_intensity_tco2e_per_mn || !c.scope1_mt || !c.revenue_usd_mn) return true; const calc = ((c.scope1_mt || 0) + (c.scope2_mt || 0)) * 1e6 / c.revenue_usd_mn; return Math.abs(calc - c.ghg_intensity_tco2e_per_mn) / (calc || 1) < 0.5; },
  energy_s1_floor: c => c.sector !== 'Energy' || (c.scope1_mt || 0) > 0.001,
  it_s2_gt_s1: c => c.sector !== 'Information Technology' || !c.scope1_mt || !c.scope2_mt || c.scope2_mt >= c.scope1_mt * 0.3,
  emissions_present: c => (c.scope1_mt || 0) + (c.scope2_mt || 0) > 0,
  ghg_intensity_present: c => c.ghg_intensity_tco2e_per_mn !== undefined && c.ghg_intensity_tco2e_per_mn !== null,
  s1_not_zero_exact: c => c.scope1_mt !== 0,
  s2_ratio_check: c => c.sector === 'Information Technology' || !c.scope1_mt || !c.scope2_mt || c.scope2_mt <= c.scope1_mt * 10,
  nz_year_range: c => !c.carbon_neutral_target_year || (c.carbon_neutral_target_year >= 2025 && c.carbon_neutral_target_year <= 2100),
  sbti_boolean: c => c.sbti_committed === undefined || typeof c.sbti_committed === 'boolean',
  nz_year_realistic: c => !c.carbon_neutral_target_year || c.carbon_neutral_target_year > 2030,
  sbti_present: c => c.sbti_committed !== undefined,
  energy_nz_target: c => c.sector !== 'Energy' || !!c.carbon_neutral_target_year,
  evic_decomposition: c => !c.evic_usd_mn || !c.market_cap_usd_mn || Math.abs(c.evic_usd_mn - (c.market_cap_usd_mn + (c.total_debt_usd_mn || 0))) / c.evic_usd_mn < 0.5,
  intensity_calc_check: c => { if (!c.ghg_intensity_tco2e_per_mn || !c.scope1_mt || !c.revenue_usd_mn) return true; const calc = ((c.scope1_mt || 0) + (c.scope2_mt || 0)) * 1e6 / c.revenue_usd_mn; return calc > 0; },
  rev_emp_crosscheck: c => { const r = (c.revenue_usd_mn || 0) * 1e6 / (c.employees || 1); return r > 5000 && r < 10000000; },
  mcap_evic_ratio: c => !c.evic_usd_mn || !c.market_cap_usd_mn || (c.market_cap_usd_mn / c.evic_usd_mn > 0.3 && c.market_cap_usd_mn / c.evic_usd_mn < 1.2),
  esg_trisk_suspicious: c => !c.esg_score || !c.transition_risk_score || !(c.esg_score < 30 && c.transition_risk_score < 30),
  revenue_not_stale: c => (c.revenue_usd_mn || 0) > 1,
  mcap_updated: c => (c.market_cap_usd_mn || 0) > 0,
  esg_updated: c => c.esg_score !== 50,
  financials_low_s1: c => c.sector !== 'Financials' || (c.scope1_mt || 0) < 1,
  it_employee_floor: c => c.sector !== 'Information Technology' || (c.employees || 0) > 100,
};

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function DataValidationPage() {
  const nav = useNavigate();
  const portfolio = useMemo(() => loadLS(LS_PORTFOLIO) || [], []);
  const companies = useMemo(() => {
    if (portfolio.length) return GLOBAL_COMPANY_MASTER.filter(c => portfolio.some(p => p.ticker === c.ticker || p.id === c.id));
    return GLOBAL_COMPANY_MASTER;
  }, [portfolio]);

  const [ruleOverrides, setRuleOverrides] = useState(() => loadLS(LS_RULES) || {});
  const [fixes, setFixes] = useState(() => loadLS(LS_FIXES) || {});
  const [scanHistory, setScanHistory] = useState(() => loadLS(LS_SCAN_HIST) || []);
  const [sevFilter, setSevFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [exchFilter, setExchFilter] = useState('all');
  const [sortCol, setSortCol] = useState('sev');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedViolations, setSelectedViolations] = useState([]);
  const [tab, setTab] = useState('overview');
  const [customRuleDraft, setCustomRuleDraft] = useState({ id:'', cat:'Identity', field:'', rule:'', sev:'medium' });
  const [searchTerm, setSearchTerm] = useState('');

  /* ── Active rules ─────────────────────────────────────────────── */
  const activeRules = useMemo(() => {
    return DEFAULT_RULES.map(r => {
      const ov = ruleOverrides[r.id];
      return { ...r, enabled: ov?.enabled !== undefined ? ov.enabled : true, sev: ov?.sev || r.sev };
    }).filter(r => r.enabled);
  }, [ruleOverrides]);

  /* ── Run validation ────────────────────────────────────────────── */
  const validationResults = useMemo(() => {
    const results = [];
    const appliedFixes = fixes || {};
    companies.forEach(rawC => {
      const c = { ...rawC, ...(appliedFixes[rawC.ticker] || {}) };
      activeRules.forEach(rule => {
        const checkFn = CHECKS[rule.check];
        if (!checkFn) return;
        const passed = checkFn(c);
        if (!passed) {
          results.push({
            company: c.name, ticker: c.ticker, exchange: c._displayExchange || 'N/A',
            sector: c.sector, field: rule.field, ruleId: rule.id, rule: rule.rule,
            sev: rule.sev, cat: rule.cat, value: c[rule.field],
            autofix: rule.autofix, _companyObj: c,
          });
        }
      });
    });
    return results;
  }, [companies, activeRules, fixes]);

  /* ── Derived stats ─────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const total = companies.length * activeRules.length;
    const violations = validationResults.length;
    const passed = total - violations;
    const bySev = { critical: 0, high: 0, medium: 0, low: 0 };
    validationResults.forEach(v => { bySev[v.sev] = (bySev[v.sev] || 0) + 1; });
    const byCat = {};
    validationResults.forEach(v => { byCat[v.cat] = (byCat[v.cat] || 0) + 1; });
    const byExchange = {};
    validationResults.forEach(v => { byExchange[v.exchange] = (byExchange[v.exchange] || 0) + 1; });
    const bySector = {};
    validationResults.forEach(v => { bySector[v.sector || 'Unknown'] = (bySector[v.sector || 'Unknown'] || 0) + 1; });
    const autofixable = validationResults.filter(v => v.autofix).length;
    const fields = new Set(validationResults.map(v => v.field));
    const exchanges = new Set(companies.map(c => c._displayExchange || 'N/A'));
    return { total, violations, passed, passRate: total > 0 ? (passed / total) * 100 : 100, bySev, byCat, byExchange, bySector, autofixable, fieldsCount: fields.size, exchangeCount: exchanges.size };
  }, [validationResults, companies, activeRules]);

  /* ── Filtered & sorted violations ──────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...validationResults];
    if (sevFilter !== 'all') list = list.filter(v => v.sev === sevFilter);
    if (catFilter !== 'all') list = list.filter(v => v.cat === catFilter);
    if (exchFilter !== 'all') list = list.filter(v => v.exchange === exchFilter);
    if (searchTerm) { const s = searchTerm.toLowerCase(); list = list.filter(v => v.company.toLowerCase().includes(s) || v.ticker.toLowerCase().includes(s) || v.rule.toLowerCase().includes(s)); }
    const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    list.sort((a, b) => {
      if (sortCol === 'sev') return sortDir === 'asc' ? sevOrder[a.sev] - sevOrder[b.sev] : sevOrder[b.sev] - sevOrder[a.sev];
      if (sortCol === 'company') return sortDir === 'asc' ? a.company.localeCompare(b.company) : b.company.localeCompare(a.company);
      if (sortCol === 'field') return sortDir === 'asc' ? a.field.localeCompare(b.field) : b.field.localeCompare(a.field);
      if (sortCol === 'cat') return sortDir === 'asc' ? a.cat.localeCompare(b.cat) : b.cat.localeCompare(a.cat);
      return 0;
    });
    return list;
  }, [validationResults, sevFilter, catFilter, exchFilter, sortCol, sortDir, searchTerm]);

  /* ── Company health ────────────────────────────────────────────── */
  const companyHealth = useMemo(() => {
    const map = {};
    companies.forEach(c => { map[c.ticker] = { name: c.name, ticker: c.ticker, exchange: c._displayExchange, sector: c.sector, violations: [], totalRules: activeRules.length }; });
    validationResults.forEach(v => { if (map[v.ticker]) map[v.ticker].violations.push(v); });
    return Object.values(map).map(h => ({ ...h, score: ((h.totalRules - h.violations.length) / h.totalRules * 100), worstSev: h.violations.reduce((w, v) => { const o = { critical: 0, high: 1, medium: 2, low: 3 }; return o[v.sev] < o[w] ? v.sev : w; }, 'low') })).sort((a, b) => a.score - b.score);
  }, [companies, validationResults, activeRules]);

  /* ── Outlier detection ─────────────────────────────────────────── */
  const outliers = useMemo(() => {
    const fields = ['revenue_usd_mn', 'market_cap_usd_mn', 'esg_score', 'scope1_mt', 'employees'];
    const results = [];
    const sectors = [...new Set(companies.map(c => c.sector))];
    sectors.forEach(sec => {
      const sectorCos = companies.filter(c => c.sector === sec);
      if (sectorCos.length < 5) return;
      fields.forEach(f => {
        const vals = sectorCos.map(c => c[f]).filter(v => typeof v === 'number' && v > 0);
        if (vals.length < 5) return;
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        const std = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
        if (std === 0) return;
        sectorCos.forEach(c => {
          if (typeof c[f] === 'number' && Math.abs(c[f] - mean) > 3 * std) {
            results.push({ company: c.name, ticker: c.ticker, sector: sec, field: f, value: c[f], mean: mean.toFixed(1), std: std.toFixed(1), zScore: ((c[f] - mean) / std).toFixed(1) });
          }
        });
      });
    });
    return results;
  }, [companies]);

  /* ── Chart data ────────────────────────────────────────────────── */
  const pieData = useMemo(() => [
    { name: 'Pass', value: stats.passed, color: T.green },
    { name: 'Critical', value: stats.bySev.critical, color: T.red },
    { name: 'High', value: stats.bySev.high, color: '#ea580c' },
    { name: 'Medium', value: stats.bySev.medium, color: T.amber },
    { name: 'Low', value: stats.bySev.low, color: '#6b7280' },
  ].filter(d => d.value > 0), [stats]);

  const catBarData = useMemo(() => Object.entries(stats.byCat).map(([k, v]) => ({ name: k, violations: v })).sort((a, b) => b.violations - a.violations), [stats]);
  const exchBarData = useMemo(() => Object.entries(stats.byExchange).map(([k, v]) => ({ name: k.length > 12 ? k.slice(0, 12) + '..' : k, violations: v })).sort((a, b) => b.violations - a.violations), [stats]);
  const sectorBarData = useMemo(() => Object.entries(stats.bySector).map(([k, v]) => ({ name: k.length > 15 ? k.slice(0, 15) + '..' : k, violations: v })).sort((a, b) => b.violations - a.violations), [stats]);
  const trendData = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i], passRate: Math.min(100, 72 + i * 2.3 + sRand(i * 7) * 3) })), []);

  /* ── Handlers ──────────────────────────────────────────────────── */
  const toggleSort = useCallback(col => { setSortCol(col); setSortDir(d => sortCol === col ? (d === 'asc' ? 'desc' : 'asc') : 'asc'); }, [sortCol]);
  const toggleRule = useCallback((id) => {
    setRuleOverrides(prev => { const next = { ...prev, [id]: { ...(prev[id] || {}), enabled: !(prev[id]?.enabled !== false) } }; saveLS(LS_RULES, next); return next; });
  }, []);
  const changeSev = useCallback((id, sev) => {
    setRuleOverrides(prev => { const next = { ...prev, [id]: { ...(prev[id] || {}), sev } }; saveLS(LS_RULES, next); return next; });
  }, []);

  const applyFix = useCallback((violation) => {
    const ticker = violation.ticker;
    const field = violation.field;
    const sectorCos = companies.filter(c => c.sector === violation.sector);
    const vals = sectorCos.map(c => c[field]).filter(v => typeof v === 'number' && v > 0);
    const median = vals.length > 0 ? vals.sort((a, b) => a - b)[Math.floor(vals.length / 2)] : 0;
    const fixVal = field === 'sbti_committed' ? false : median > 0 ? Math.round(median * 100) / 100 : 50;
    setFixes(prev => { const next = { ...prev, [ticker]: { ...(prev[ticker] || {}), [field]: fixVal } }; saveLS(LS_FIXES, next); return next; });
  }, [companies]);

  const bulkFixCritical = useCallback(() => {
    const criticals = validationResults.filter(v => v.sev === 'critical' && v.autofix);
    const newFixes = { ...fixes };
    criticals.forEach(v => {
      const sectorCos = companies.filter(c => c.sector === v.sector);
      const vals = sectorCos.map(c => c[v.field]).filter(val => typeof val === 'number' && val > 0);
      const median = vals.length > 0 ? vals.sort((a, b) => a - b)[Math.floor(vals.length / 2)] : 1;
      if (!newFixes[v.ticker]) newFixes[v.ticker] = {};
      newFixes[v.ticker][v.field] = Math.round(median * 100) / 100;
    });
    setFixes(newFixes);
    saveLS(LS_FIXES, newFixes);
  }, [validationResults, fixes, companies]);

  const runScan = useCallback(() => {
    const entry = { ts: new Date().toISOString(), companies: companies.length, rules: activeRules.length, violations: validationResults.length, passRate: stats.passRate.toFixed(1) };
    const hist = [entry, ...scanHistory].slice(0, 20);
    setScanHistory(hist);
    saveLS(LS_SCAN_HIST, hist);
  }, [companies, activeRules, validationResults, stats, scanHistory]);

  useEffect(() => { if (scanHistory.length === 0) runScan(); }, []);

  /* ── Exports ───────────────────────────────────────────────────── */
  const exportCSV = useCallback(() => {
    const hdr = 'Company,Ticker,Exchange,Sector,Field,Rule,Severity,Category,Value,AutoFix\n';
    const rows = filtered.map(v => `"${v.company}","${v.ticker}","${v.exchange}","${v.sector}","${v.field}","${v.rule}","${v.sev}","${v.cat}","${v.value ?? ''}","${v.autofix || ''}"`).join('\n');
    const blob = new Blob([hdr + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'validation_violations.csv'; a.click();
  }, [filtered]);

  const exportJSON = useCallback(() => {
    const report = { generated: new Date().toISOString(), companies: companies.length, rulesActive: activeRules.length, summary: stats, violations: filtered.map(v => ({ company: v.company, ticker: v.ticker, field: v.field, rule: v.rule, sev: v.sev, cat: v.cat, value: v.value })), outliers };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'validation_report.json'; a.click();
  }, [companies, activeRules, stats, filtered, outliers]);

  const printReport = useCallback(() => window.print(), []);

  /* ── Styles ────────────────────────────────────────────────────── */
  const card = { background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20 };
  const kpiCard = { ...card, textAlign: 'center', minWidth: 120 };
  const badge = (color) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: color + '18', color, marginLeft: 6 });
  const sevBadge = (sev) => badge(SEV_CLR[sev] || T.textMut);
  const btn = (bg = T.navy) => ({ padding: '8px 18px', borderRadius: 8, border: 'none', background: bg, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: T.font });
  const tabBtn = (active) => ({ padding: '8px 20px', borderRadius: '8px 8px 0 0', border: `1px solid ${active ? T.navy : T.border}`, borderBottom: active ? `2px solid ${T.navy}` : 'none', background: active ? T.surface : T.surfaceH, color: active ? T.navy : T.textSec, cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: T.font });
  const inp = { padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13 };
  const sel = { ...inp, background: T.surface };
  const thStyle = { padding: '10px 12px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, color: T.navy, fontWeight: 700, fontSize: 12, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '8px 12px', borderBottom: `1px solid ${T.border}`, fontSize: 13, color: T.text };

  const TABS = ['overview', 'violations', 'autofix', 'health', 'rules', 'outliers', 'history'];
  const exchanges = useMemo(() => [...new Set(companies.map(c => c._displayExchange || 'N/A'))].sort(), [companies]);
  const categories = useMemo(() => [...new Set(DEFAULT_RULES.map(r => r.cat))], []);

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 32 }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, color: T.navy }}>Data Validation & Cleansing Engine</h1>
          <p style={{ margin: '4px 0 0', color: T.textSec, fontSize: 14 }}>
            Automated validation of company data against {DEFAULT_RULES.length} rules across {categories.length} categories
            <span style={badge(T.sage)}>{companies.length} Companies</span>
            <span style={badge(T.gold)}>Auto-Fix</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={btn(T.sage)} onClick={runScan}>Re-Scan</button>
          <button style={btn(T.gold)} onClick={exportCSV}>CSV</button>
          <button style={btn(T.navyL)} onClick={exportJSON}>JSON</button>
          <button style={btn('#6b7280')} onClick={printReport}>Print</button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Companies Scanned', value: fmt(companies.length), color: T.navy },
          { label: 'Pass Rate', value: pct(stats.passRate), color: stats.passRate > 90 ? T.green : stats.passRate > 75 ? T.amber : T.red },
          { label: 'Critical', value: fmt(stats.bySev.critical), color: T.red },
          { label: 'High', value: fmt(stats.bySev.high), color: '#ea580c' },
          { label: 'Medium', value: fmt(stats.bySev.medium), color: T.amber },
          { label: 'Low', value: fmt(stats.bySev.low), color: '#6b7280' },
          { label: 'Rules Active', value: activeRules.length, color: T.navy },
          { label: 'Auto-Fix Available', value: fmt(stats.autofixable), color: T.sage },
          { label: 'Exchanges', value: stats.exchangeCount, color: T.gold },
          { label: 'Last Scan', value: scanHistory[0]?.ts ? new Date(scanHistory[0].ts).toLocaleDateString() : 'Never', color: T.textSec },
        ].map((k, i) => (
          <div key={i} style={kpiCard}>
            <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 0, borderBottom: `1px solid ${T.border}` }}>
        {TABS.map(t => <button key={t} style={tabBtn(tab === t)} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>)}
      </div>

      {/* ── OVERVIEW TAB ──────────────────────────────────────── */}
      {tab === 'overview' && (
        <div style={{ paddingTop: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Pie */}
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Validation Summary</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={95} innerRadius={50} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            </div>
            {/* Category bar */}
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Violations by Category</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={catBarData} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="violations" fill={T.navy} radius={[0, 4, 4, 0]} /></BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Exchange quality */}
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Exchange-Level Quality</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={exchBarData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10, angle: -25 }} /><YAxis /><Tooltip /><Bar dataKey="violations" fill={T.gold} radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </div>
            {/* Sector quality */}
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Sector-Level Quality</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sectorBarData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10, angle: -25 }} /><YAxis /><Tooltip /><Bar dataKey="violations" fill={T.sage} radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Trend */}
          <div style={card}>
            <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Validation Pass Rate Trend (12 Months)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis domain={[60, 100]} /><Tooltip formatter={v => `${v.toFixed(1)}%`} /><Area type="monotone" dataKey="passRate" stroke={T.sage} fill={T.sage + '40'} strokeWidth={2} /></AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── VIOLATIONS TAB ────────────────────────────────────── */}
      {tab === 'violations' && (
        <div style={{ paddingTop: 20 }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <input style={{ ...inp, width: 220 }} placeholder="Search company, ticker, rule..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <select style={sel} value={sevFilter} onChange={e => setSevFilter(e.target.value)}><option value="all">All Severities</option>{['critical','high','medium','low'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select>
            <select style={sel} value={catFilter} onChange={e => setCatFilter(e.target.value)}><option value="all">All Categories</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <select style={sel} value={exchFilter} onChange={e => setExchFilter(e.target.value)}><option value="all">All Exchanges</option>{exchanges.map(e => <option key={e} value={e}>{e}</option>)}</select>
            <span style={{ color: T.textMut, fontSize: 13 }}>{filtered.length} violations shown</span>
          </div>
          {/* Table */}
          <div style={{ ...card, padding: 0, overflow: 'auto', maxHeight: 520 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: T.surface, zIndex: 2 }}>
                <tr>
                  {[{ col: 'company', label: 'Company' }, { col: 'field', label: 'Field' }, { col: 'cat', label: 'Category' }, { col: 'sev', label: 'Severity' }].map(h => (
                    <th key={h.col} style={thStyle} onClick={() => toggleSort(h.col)}>{h.label} {sortCol === h.col ? (sortDir === 'asc' ? ' ^' : ' v') : ''}</th>
                  ))}
                  <th style={thStyle}>Rule</th>
                  <th style={thStyle}>Value</th>
                  <th style={thStyle}>Fix</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 200).map((v, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={tdStyle}><span style={{ fontWeight: 600 }}>{v.company}</span><br /><span style={{ fontSize: 11, color: T.textMut }}>{v.ticker} | {v.exchange}</span></td>
                    <td style={tdStyle}><code style={{ background: T.surfaceH, padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>{v.field}</code></td>
                    <td style={tdStyle}><span style={badge(COLORS[categories.indexOf(v.cat) % COLORS.length])}>{v.cat}</span></td>
                    <td style={tdStyle}><span style={sevBadge(v.sev)}>{v.sev}</span></td>
                    <td style={{ ...tdStyle, fontSize: 12, maxWidth: 260 }}>{v.rule}</td>
                    <td style={tdStyle}>{v.value !== null && v.value !== undefined ? String(v.value).slice(0, 20) : <span style={{ color: T.textMut }}>null</span>}</td>
                    <td style={tdStyle}>{v.autofix ? <button style={{ ...btn(T.sage), padding: '4px 10px', fontSize: 11 }} onClick={() => applyFix(v)}>Fix</button> : <span style={{ color: T.textMut, fontSize: 11 }}>---</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 200 && <div style={{ padding: 12, textAlign: 'center', color: T.textMut, fontSize: 13 }}>Showing 200 of {filtered.length} violations. Export for full list.</div>}
          </div>
        </div>
      )}

      {/* ── AUTO-FIX TAB ──────────────────────────────────────── */}
      {tab === 'autofix' && (
        <div style={{ paddingTop: 20 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <button style={btn(T.red)} onClick={bulkFixCritical}>Fix All Critical ({validationResults.filter(v => v.sev === 'critical' && v.autofix).length})</button>
            <button style={btn('#6b7280')} onClick={() => { setFixes({}); saveLS(LS_FIXES, {}); }}>Reset All Fixes</button>
            <span style={{ color: T.textMut, fontSize: 13 }}>Applied fixes: {Object.keys(fixes).length} companies</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Fixable violations */}
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Auto-Fixable Violations ({stats.autofixable})</h3>
              <div style={{ maxHeight: 400, overflow: 'auto' }}>
                {validationResults.filter(v => v.autofix).slice(0, 50).map((v, i) => {
                  const alreadyFixed = fixes[v.ticker]?.[v.field] !== undefined;
                  return (
                    <div key={i} style={{ padding: 10, borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: alreadyFixed ? T.green + '10' : 'transparent' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{v.company} <span style={sevBadge(v.sev)}>{v.sev}</span></div>
                        <div style={{ fontSize: 12, color: T.textSec }}>{v.field}: {v.value ?? 'null'} &rarr; <span style={{ color: T.sage, fontWeight: 600 }}>{v.autofix}</span></div>
                      </div>
                      {alreadyFixed
                        ? <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>Fixed: {fixes[v.ticker][v.field]}</span>
                        : <button style={{ ...btn(T.sage), padding: '4px 10px', fontSize: 11 }} onClick={() => applyFix(v)}>Apply</button>}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Fix log */}
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Applied Fixes Log</h3>
              <div style={{ maxHeight: 400, overflow: 'auto' }}>
                {Object.entries(fixes).length === 0 && <div style={{ color: T.textMut, fontSize: 13 }}>No fixes applied yet.</div>}
                {Object.entries(fixes).map(([ticker, fields]) => (
                  <div key={ticker} style={{ padding: 10, borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: T.navy }}>{ticker}</div>
                    {Object.entries(fields).map(([f, v]) => (
                      <div key={f} style={{ fontSize: 12, color: T.textSec, marginLeft: 12 }}>{f} &rarr; {v}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HEALTH TAB ────────────────────────────────────────── */}
      {tab === 'health' && (
        <div style={{ paddingTop: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {companyHealth.slice(0, 40).map((h, i) => (
              <div key={i} style={{ ...card, padding: 14, borderLeft: `4px solid ${h.score > 90 ? T.green : h.score > 70 ? T.amber : T.red}`, cursor: 'pointer' }} onClick={() => setSelectedCompany(h.ticker === selectedCompany ? null : h.ticker)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: T.navy }}>{h.name}</div>
                    <div style={{ fontSize: 11, color: T.textMut }}>{h.ticker} | {h.exchange} | {h.sector}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: h.score > 90 ? T.green : h.score > 70 ? T.amber : T.red }}>{h.score.toFixed(0)}%</div>
                    <div style={{ fontSize: 10, color: T.textMut }}>{h.violations.length} issues</div>
                  </div>
                </div>
                {selectedCompany === h.ticker && h.violations.length > 0 && (
                  <div style={{ marginTop: 10, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
                    {h.violations.slice(0, 8).map((v, j) => (
                      <div key={j} style={{ fontSize: 12, padding: '3px 0', display: 'flex', gap: 6 }}>
                        <span style={sevBadge(v.sev)}>{v.sev}</span>
                        <span style={{ color: T.textSec }}>{v.field}: {v.rule}</span>
                      </div>
                    ))}
                    {h.violations.length > 8 && <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>+{h.violations.length - 8} more</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RULES TAB ─────────────────────────────────────────── */}
      {tab === 'rules' && (
        <div style={{ paddingTop: 20 }}>
          <div style={{ ...card, padding: 0, overflow: 'auto', maxHeight: 600 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: T.surface, zIndex: 2 }}>
                <tr>
                  <th style={thStyle}>On</th>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Field</th>
                  <th style={thStyle}>Rule</th>
                  <th style={thStyle}>Severity</th>
                  <th style={thStyle}>Auto-Fix</th>
                </tr>
              </thead>
              <tbody>
                {DEFAULT_RULES.map((r, i) => {
                  const ov = ruleOverrides[r.id];
                  const enabled = ov?.enabled !== undefined ? ov.enabled : true;
                  const sev = ov?.sev || r.sev;
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH, opacity: enabled ? 1 : 0.5 }}>
                      <td style={tdStyle}><input type="checkbox" checked={enabled} onChange={() => toggleRule(r.id)} /></td>
                      <td style={tdStyle}><code style={{ fontSize: 11 }}>{r.id}</code></td>
                      <td style={tdStyle}>{r.cat}</td>
                      <td style={tdStyle}><code style={{ fontSize: 11 }}>{r.field}</code></td>
                      <td style={{ ...tdStyle, fontSize: 12, maxWidth: 300 }}>{r.rule}</td>
                      <td style={tdStyle}>
                        <select style={{ ...sel, padding: '2px 6px', fontSize: 11 }} value={sev} onChange={e => changeSev(r.id, e.target.value)}>
                          {['critical','high','medium','low'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={tdStyle}>{r.autofix ? <span style={{ fontSize: 11, color: T.sage }}>{r.autofix}</span> : '---'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── OUTLIERS TAB ──────────────────────────────────────── */}
      {tab === 'outliers' && (
        <div style={{ paddingTop: 20 }}>
          <div style={card}>
            <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Outlier Detection (&gt;3 sigma from sector median)</h3>
            {outliers.length === 0 && <div style={{ color: T.textMut, fontSize: 13 }}>No significant outliers detected.</div>}
            <div style={{ maxHeight: 500, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={thStyle}>Company</th><th style={thStyle}>Sector</th><th style={thStyle}>Field</th><th style={thStyle}>Value</th><th style={thStyle}>Sector Mean</th><th style={thStyle}>Z-Score</th>
                </tr></thead>
                <tbody>
                  {outliers.slice(0, 100).map((o, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={tdStyle}><span style={{ fontWeight: 600 }}>{o.company}</span><br /><span style={{ fontSize: 11, color: T.textMut }}>{o.ticker}</span></td>
                      <td style={tdStyle}>{o.sector}</td>
                      <td style={tdStyle}><code style={{ fontSize: 11 }}>{o.field}</code></td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: T.red }}>{fmt(Number(o.value))}</td>
                      <td style={tdStyle}>{fmt(Number(o.mean))}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: Math.abs(Number(o.zScore)) > 5 ? T.red : T.amber }}>{o.zScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Cross-Referential Checks summary */}
          <div style={{ ...card, marginTop: 20 }}>
            <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Cross-Referential Checks Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {[
                { label: 'EVIC >= MCap', count: validationResults.filter(v => v.ruleId === 'V012').length, desc: 'EVIC should be at least 80% of Market Cap' },
                { label: 'GHG Intensity Consistency', count: validationResults.filter(v => v.ruleId === 'V033').length, desc: 'GHG intensity should match (S1+S2)/Revenue' },
                { label: 'Revenue/Employee Ratio', count: validationResults.filter(v => v.ruleId === 'V014').length, desc: 'Revenue per employee should be $10K-$5M' },
              ].map((cr, i) => (
                <div key={i} style={{ padding: 14, background: T.surfaceH, borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase' }}>{cr.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: cr.count === 0 ? T.green : T.red, margin: '6px 0' }}>{cr.count}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{cr.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ───────────────────────────────────────── */}
      {tab === 'history' && (
        <div style={{ paddingTop: 20 }}>
          <div style={card}>
            <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Scan History</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={thStyle}>Timestamp</th><th style={thStyle}>Companies</th><th style={thStyle}>Rules</th><th style={thStyle}>Violations</th><th style={thStyle}>Pass Rate</th>
              </tr></thead>
              <tbody>
                {scanHistory.map((s, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={tdStyle}>{new Date(s.ts).toLocaleString()}</td>
                    <td style={tdStyle}>{s.companies}</td>
                    <td style={tdStyle}>{s.rules}</td>
                    <td style={tdStyle}>{s.violations}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: Number(s.passRate) > 90 ? T.green : Number(s.passRate) > 75 ? T.amber : T.red }}>{s.passRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SECTOR DEEP DIVE (additional section) ─────────────── */}
      {tab === 'overview' && (
        <div style={{ marginTop: 20 }}>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 15 }}>Sector Data Quality Scorecard</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {VALID_SECTORS.map((sec, i) => {
                const sectorCos = companies.filter(c => c.sector === sec);
                const sectorViolations = validationResults.filter(v => v.sector === sec);
                const sectorScore = sectorCos.length > 0 ? ((sectorCos.length * activeRules.length - sectorViolations.length) / (sectorCos.length * activeRules.length) * 100) : 100;
                const critCount = sectorViolations.filter(v => v.sev === 'critical').length;
                return (
                  <div key={i} style={{ padding: 14, background: T.surfaceH, borderRadius: 10, borderLeft: `4px solid ${COLORS[i % COLORS.length]}` }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: T.navy }}>{sec}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                      <div>
                        <div style={{ fontSize: 10, color: T.textMut }}>Companies</div>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{sectorCos.length}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: T.textMut }}>Quality Score</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: sectorScore > 90 ? T.green : sectorScore > 75 ? T.amber : T.red }}>{sectorScore.toFixed(0)}%</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: T.textMut }}>Critical</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: critCount > 0 ? T.red : T.green }}>{critCount}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 6, height: 4, background: T.border, borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${sectorScore}%`, background: sectorScore > 90 ? T.green : sectorScore > 75 ? T.amber : T.red, borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── FIELD COVERAGE MATRIX (additional overview content) ── */}
      {tab === 'overview' && (
        <div style={{ marginTop: 20 }}>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 15 }}>Field Coverage Matrix (% companies with valid data)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
              {['name','ticker','sector','revenue_usd_mn','market_cap_usd_mn','evic_usd_mn','esg_score','scope1_mt','scope2_mt','employees','transition_risk_score','sbti_committed','carbon_neutral_target_year','ghg_intensity_tco2e_per_mn','data_quality_score'].map((field, i) => {
                const hasData = companies.filter(c => c[field] !== undefined && c[field] !== null && c[field] !== 0 && c[field] !== '').length;
                const coverage = (hasData / companies.length) * 100;
                return (
                  <div key={i} style={{ padding: 10, background: T.surfaceH, borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: T.textMut, marginBottom: 4 }}>{field}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: coverage > 90 ? T.green : coverage > 60 ? T.amber : T.red }}>{coverage.toFixed(0)}%</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{hasData}/{companies.length}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── SEVERITY DISTRIBUTION DETAIL (violations tab extra) ── */}
      {tab === 'violations' && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
            {['critical','high','medium','low'].map(sev => {
              const sevViolations = validationResults.filter(v => v.sev === sev);
              const topRule = sevViolations.reduce((acc, v) => { acc[v.ruleId] = (acc[v.ruleId] || 0) + 1; return acc; }, {});
              const topRuleId = Object.entries(topRule).sort(([,a],[,b]) => b - a)[0];
              const topRuleObj = topRuleId ? DEFAULT_RULES.find(r => r.id === topRuleId[0]) : null;
              return (
                <div key={sev} style={{ ...card, borderTop: `3px solid ${SEV_CLR[sev]}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: SEV_CLR[sev], textTransform: 'uppercase', marginBottom: 8 }}>{sev}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: T.navy }}>{sevViolations.length}</div>
                  <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>Across {new Set(sevViolations.map(v => v.ticker)).size} companies</div>
                  {topRuleObj && (
                    <div style={{ marginTop: 8, padding: 8, background: T.surfaceH, borderRadius: 6 }}>
                      <div style={{ fontSize: 10, color: T.textMut }}>Most common rule:</div>
                      <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{topRuleObj.rule}</div>
                      <div style={{ fontSize: 11, color: SEV_CLR[sev], fontWeight: 600 }}>{topRuleId[1]} occurrences</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── EXCHANGE DEEP DIVE (violations tab extra) ──────────── */}
      {tab === 'violations' && (
        <div style={{ marginTop: 20 }}>
          <div style={card}>
            <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Exchange Data Quality Ranking</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {exchanges.map((exch, i) => {
                const exchCos = companies.filter(c => (c._displayExchange || 'N/A') === exch);
                const exchViols = validationResults.filter(v => v.exchange === exch);
                const exchScore = exchCos.length > 0 ? ((exchCos.length * activeRules.length - exchViols.length) / (exchCos.length * activeRules.length) * 100) : 100;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: i % 2 === 0 ? T.surface : T.surfaceH, borderRadius: 6 }}>
                    <div style={{ width: 30, textAlign: 'center', fontSize: 14, fontWeight: 700, color: T.textMut }}>#{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{exch}</div>
                      <div style={{ fontSize: 11, color: T.textMut }}>{exchCos.length} companies | {exchViols.length} violations</div>
                    </div>
                    <div style={{ width: 120, height: 8, background: T.border, borderRadius: 4 }}>
                      <div style={{ height: '100%', width: `${exchScore}%`, background: exchScore > 90 ? T.green : exchScore > 75 ? T.amber : T.red, borderRadius: 4 }} />
                    </div>
                    <div style={{ width: 50, textAlign: 'right', fontWeight: 700, fontSize: 13, color: exchScore > 90 ? T.green : exchScore > 75 ? T.amber : T.red }}>{exchScore.toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── AUTO-FIX IMPACT SUMMARY ───────────────────────────── */}
      {tab === 'autofix' && (
        <div style={{ marginTop: 20 }}>
          <div style={card}>
            <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Auto-Fix Impact Analysis</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {[
                { label: 'Fixable Critical', value: validationResults.filter(v => v.sev === 'critical' && v.autofix).length, total: stats.bySev.critical, color: T.red },
                { label: 'Fixable High', value: validationResults.filter(v => v.sev === 'high' && v.autofix).length, total: stats.bySev.high, color: '#ea580c' },
                { label: 'Fixable Medium', value: validationResults.filter(v => v.sev === 'medium' && v.autofix).length, total: stats.bySev.medium, color: T.amber },
              ].map((item, i) => (
                <div key={i} style={{ padding: 16, background: T.surfaceH, borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase' }}>{item.label}</div>
                  <div style={{ fontSize: 30, fontWeight: 700, color: item.color, margin: '6px 0' }}>{item.value} <span style={{ fontSize: 14, fontWeight: 400, color: T.textMut }}>/ {item.total}</span></div>
                  <div style={{ height: 6, background: T.border, borderRadius: 3, marginTop: 8 }}>
                    <div style={{ height: '100%', width: `${item.total > 0 ? (item.value / item.total * 100) : 0}%`, background: item.color, borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{item.total > 0 ? (item.value / item.total * 100).toFixed(0) : 0}% auto-fixable</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...card, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Fix Strategy per Category</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {categories.map((cat, i) => {
                const catViolations = validationResults.filter(v => v.cat === cat);
                const fixable = catViolations.filter(v => v.autofix);
                return (
                  <div key={i} style={{ padding: 12, background: T.surfaceH, borderRadius: 8, borderLeft: `3px solid ${COLORS[i % COLORS.length]}` }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: T.navy }}>{cat}</div>
                    <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{catViolations.length} violations, {fixable.length} fixable</div>
                    <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>
                      {fixable.length > 0 ? `Strategies: ${[...new Set(fixable.map(v => v.autofix))].join(', ')}` : 'No auto-fix available'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── HEALTH TAB SUMMARY STATS ─────────────────────────── */}
      {tab === 'health' && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div style={{ ...card, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase' }}>Companies with 100% Score</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: T.green, margin: '8px 0' }}>{companyHealth.filter(h => h.score === 100).length}</div>
              <div style={{ fontSize: 12, color: T.textSec }}>Perfect data quality</div>
            </div>
            <div style={{ ...card, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase' }}>Companies below 70%</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: T.red, margin: '8px 0' }}>{companyHealth.filter(h => h.score < 70).length}</div>
              <div style={{ fontSize: 12, color: T.textSec }}>Need attention</div>
            </div>
            <div style={{ ...card, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase' }}>Average Health Score</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: T.navy, margin: '8px 0' }}>
                {companyHealth.length > 0 ? (companyHealth.reduce((a, h) => a + h.score, 0) / companyHealth.length).toFixed(1) : '---'}%
              </div>
              <div style={{ fontSize: 12, color: T.textSec }}>Across all companies</div>
            </div>
          </div>
        </div>
      )}

      {/* ── RULES TAB CATEGORY SUMMARY ───────────────────────── */}
      {tab === 'rules' && (
        <div style={{ marginTop: 20 }}>
          <div style={card}>
            <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Rule Categories Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {categories.map((cat, i) => {
                const catRules = DEFAULT_RULES.filter(r => r.cat === cat);
                const enabledCount = catRules.filter(r => (ruleOverrides[r.id]?.enabled !== false)).length;
                return (
                  <div key={i} style={{ padding: 12, background: T.surfaceH, borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: COLORS[i % COLORS.length] }}>{cat}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: '4px 0' }}>{catRules.length}</div>
                    <div style={{ fontSize: 11, color: T.textMut }}>{enabledCount} enabled | {catRules.length - enabledCount} disabled</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── OUTLIER TAB ADDITIONAL STATS ──────────────────────── */}
      {tab === 'outliers' && outliers.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={card}>
            <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Outlier Statistics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
              <div style={{ padding: 12, background: T.surfaceH, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: T.textMut }}>Total Outliers</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.red }}>{outliers.length}</div>
              </div>
              <div style={{ padding: 12, background: T.surfaceH, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: T.textMut }}>Unique Companies</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.navy }}>{new Set(outliers.map(o => o.ticker)).size}</div>
              </div>
              <div style={{ padding: 12, background: T.surfaceH, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: T.textMut }}>Max Z-Score</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.red }}>{Math.max(...outliers.map(o => Math.abs(Number(o.zScore)))).toFixed(1)}</div>
              </div>
              <div style={{ padding: 12, background: T.surfaceH, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: T.textMut }}>Fields Affected</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.amber }}>{new Set(outliers.map(o => o.field)).size}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY TAB SUMMARY ───────────────────────────────── */}
      {tab === 'history' && scanHistory.length > 1 && (
        <div style={{ marginTop: 20 }}>
          <div style={card}>
            <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15 }}>Scan Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={scanHistory.slice().reverse().map((s, i) => ({ scan: `Scan ${i + 1}`, passRate: Number(s.passRate), violations: s.violations }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="scan" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="passRate" stroke={T.sage} name="Pass Rate %" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── CROSS-NAV ─────────────────────────────────────────── */}
      <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Data Reconciliation', path: '/data-reconciliation' },
          { label: 'Data Quality Dashboard', path: '/data-quality' },
          { label: 'Data Enrichment', path: '/enrichment' },
          { label: 'Data Lineage', path: '/data-lineage' },
        ].map(l => (
          <button key={l.path} style={{ ...btn(T.navyL), padding: '10px 22px' }} onClick={() => nav(l.path)}>{l.label} &rarr;</button>
        ))}
      </div>
    </div>
  );
}
