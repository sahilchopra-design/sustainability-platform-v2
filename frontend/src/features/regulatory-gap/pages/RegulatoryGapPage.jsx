import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, PieChart, Pie, AreaChart, Area } from 'recharts';
import { GLOBAL_COMPANY_MASTER, EXCHANGES, globalSearch } from '../../../data/globalCompanyMaster';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ── CSV export helper ──────────────────────────────────────────── */
const downloadCSV = (rows, filename) => {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => {
    let v = r[k];
    if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) v = `"${v.replace(/"/g, '""')}"`;
    return v ?? '';
  }).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

/* ═══════════════════════════════════════════════════════════════════
   DYNAMIC COMPLIANCE ASSESSMENT — derives status from REAL data
   ═══════════════════════════════════════════════════════════════════ */
function assessCompliance(holdings) {
  const stewardship = (() => { try { return JSON.parse(localStorage.getItem('ra_stewardship_v1') || '[]'); } catch { return []; } })();
  const watchlist = (() => { try { return JSON.parse(localStorage.getItem('ra_watchlist_v1') || '[]'); } catch { return []; } })();
  const fiPortfolio = (() => { try { return JSON.parse(localStorage.getItem('ra_fi_portfolio_v1') || '[]'); } catch { return []; } })();
  const templates = (() => { try { return JSON.parse(localStorage.getItem('ra_report_templates_v1') || '{}'); } catch { return {}; } })();
  const scenarioRuns = (() => { try { return JSON.parse(localStorage.getItem('ra_scenario_runs_v1') || '[]'); } catch { return []; } })();
  const actionStatuses = (() => { try { return JSON.parse(localStorage.getItem('ra_compliance_actions_v1') || '{}'); } catch { return {}; } })();

  const totalHoldings = holdings.length;
  const holdingsWithGHG = holdings.filter(h => (h.company?.scope1_mt || 0) > 0 || (h.company?.scope2_mt || 0) > 0).length;
  const ghgCoverage = totalHoldings > 0 ? (holdingsWithGHG / totalHoldings) * 100 : 0;
  const holdingsWithESG = holdings.filter(h => (h.company?.esg_score || 0) > 0).length;
  const esgCoverage = totalHoldings > 0 ? (holdingsWithESG / totalHoldings) * 100 : 0;
  const sbtiCount = holdings.filter(h => h.company?.sbti_committed).length;
  const sbtiPct = totalHoldings > 0 ? (sbtiCount / totalHoldings) * 100 : 0;
  const hasPortfolio = totalHoldings > 0;
  const hasWACI = ghgCoverage > 50;
  const hasEngagements = stewardship.length > 0;
  const hasReports = Object.keys(templates).length > 0;
  const hasFIPortfolio = fiPortfolio.length > 0;
  const hasScenarios = scenarioRuns.length > 0;
  const holdingsWithRevenue = holdings.filter(h => (h.company?.revenue_usd_mn || 0) > 0).length;
  const revenueCoverage = totalHoldings > 0 ? (holdingsWithRevenue / totalHoldings) * 100 : 0;
  const holdingsWithMarketCap = holdings.filter(h => (h.company?.mcap_usd_mn || 0) > 0).length;
  const mcapCoverage = totalHoldings > 0 ? (holdingsWithMarketCap / totalHoldings) * 100 : 0;
  const holdingsWithEVIC = holdings.filter(h => (h.company?.evic_usd_mn || 0) > 0).length;
  const evicCoverage = totalHoldings > 0 ? (holdingsWithEVIC / totalHoldings) * 100 : 0;
  const holdingsWithTRisk = holdings.filter(h => (h.company?.transition_risk_score || 0) > 0).length;
  const triskCoverage = totalHoldings > 0 ? (holdingsWithTRisk / totalHoldings) * 100 : 0;
  const holdingsWithNetZero = holdings.filter(h => h.company?.net_zero_target).length;
  const netZeroCoverage = totalHoldings > 0 ? (holdingsWithNetZero / totalHoldings) * 100 : 0;

  const totalScope1 = holdings.reduce((s, h) => s + (h.company?.scope1_mt || 0), 0);
  const totalScope2 = holdings.reduce((s, h) => s + (h.company?.scope2_mt || 0), 0);

  return {
    ghgCoverage, esgCoverage, sbtiPct, hasPortfolio, hasWACI, hasEngagements, hasReports, hasFIPortfolio, hasScenarios,
    totalHoldings, holdingsWithGHG, holdingsWithESG, sbtiCount, totalScope1, totalScope2,
    revenueCoverage, mcapCoverage, evicCoverage, triskCoverage, netZeroCoverage,
    holdingsWithRevenue, holdingsWithMarketCap, holdingsWithEVIC, holdingsWithTRisk, holdingsWithNetZero,
    stewardshipCount: stewardship.length, reportCount: Object.keys(templates).length, scenarioCount: scenarioRuns.length,
  };
}

/* ── Build DYNAMIC frameworks based on real data ─────────────────── */
function buildFrameworks(assess, actionStatuses) {
  const s = (cond, partialCond) => {
    if (actionStatuses && cond === false && partialCond === false) {
      // check if an action override exists
    }
    return cond ? 'compliant' : partialCond ? 'partial' : 'gap';
  };

  return [
    {
      id: 'TCFD', name: 'TCFD', fullName: 'Task Force on Climate-related Financial Disclosures', color: '#1b3a5c',
      requirements: [
        { id: 'TCFD-G1', area: 'Governance', requirement: 'Board oversight of climate risks', status: assess.hasPortfolio ? 'compliant' : 'gap',
          evidence: assess.hasPortfolio ? `Portfolio loaded with ${assess.totalHoldings} holdings` : 'No portfolio loaded',
          priority: 'P1', owner: 'Board Secretary', gap: !assess.hasPortfolio ? 'No portfolio data available for governance assessment' : null,
          action: !assess.hasPortfolio ? 'Load a portfolio in Portfolio Builder' : null, link: '/portfolio-builder' },
        { id: 'TCFD-G2', area: 'Governance', requirement: 'Management role in climate assessment', status: assess.esgCoverage >= 50 ? 'compliant' : assess.hasPortfolio ? 'partial' : 'gap',
          evidence: `${assess.holdingsWithESG} of ${assess.totalHoldings} holdings have ESG scores (${assess.esgCoverage.toFixed(0)}% coverage)`,
          priority: 'P1', owner: 'CRO', gap: assess.esgCoverage < 50 ? `ESG coverage at ${assess.esgCoverage.toFixed(0)}%, needs 50%` : null,
          action: assess.esgCoverage < 50 ? 'Improve ESG data coverage across holdings' : null },
        { id: 'TCFD-S1', area: 'Strategy', requirement: 'Climate risks and opportunities identified', status: assess.hasPortfolio && assess.esgCoverage > 30 ? 'compliant' : assess.hasPortfolio ? 'partial' : 'gap',
          evidence: assess.hasPortfolio ? `Climate risk register based on ${assess.totalHoldings} holdings, ${assess.esgCoverage.toFixed(0)}% ESG coverage` : 'No data',
          priority: 'P1', owner: 'Head of ESG' },
        { id: 'TCFD-S2', area: 'Strategy', requirement: 'Scenario analysis (2C and 4C)', status: assess.hasScenarios ? 'compliant' : assess.hasPortfolio ? 'partial' : 'gap',
          evidence: assess.hasScenarios ? `${assess.scenarioCount} scenario run(s) completed` : assess.hasPortfolio ? 'Portfolio loaded but no scenarios run' : 'No data',
          priority: 'P1', owner: 'Risk Analytics', gap: !assess.hasScenarios ? 'No scenario analysis runs detected' : null,
          action: !assess.hasScenarios ? 'Run scenarios in the Scenario Stress Tester' : null, link: '/scenario-stress-tester' },
        { id: 'TCFD-R1', area: 'Risk Management', requirement: 'Climate risk identification process', status: assess.triskCoverage >= 50 ? 'compliant' : assess.triskCoverage > 0 ? 'partial' : 'gap',
          evidence: `${assess.holdingsWithTRisk} of ${assess.totalHoldings} holdings have T-Risk scores (${assess.triskCoverage.toFixed(0)}%)`,
          priority: 'P2', owner: 'Risk Team' },
        { id: 'TCFD-R2', area: 'Risk Management', requirement: 'Integration into overall risk management', status: assess.hasPortfolio && assess.hasWACI ? 'partial' : 'gap',
          evidence: assess.hasWACI ? 'WACI calculable from portfolio data' : 'Insufficient GHG data for WACI',
          priority: 'P2', owner: 'CRO', gap: 'Climate VaR not yet fully integrated into daily risk', action: 'Use Portfolio Climate VaR module', link: '/portfolio-climate-var' },
        { id: 'TCFD-M1', area: 'Metrics & Targets', requirement: 'GHG Scope 1 & 2 emissions', status: assess.ghgCoverage >= 80 ? 'compliant' : assess.ghgCoverage >= 50 ? 'partial' : 'gap',
          evidence: `${assess.holdingsWithGHG} of ${assess.totalHoldings} holdings have GHG data (${assess.ghgCoverage.toFixed(0)}%). Total Scope 1: ${assess.totalScope1.toLocaleString()} Mt, Scope 2: ${assess.totalScope2.toLocaleString()} Mt`,
          priority: 'P1', owner: 'Sustainability',
          gap: assess.ghgCoverage < 80 ? `GHG coverage at ${assess.ghgCoverage.toFixed(0)}%, target is 80%` : null,
          action: assess.ghgCoverage < 80 ? `Add GHG data for ${assess.totalHoldings - assess.holdingsWithGHG} holdings` : null },
        { id: 'TCFD-M2', area: 'Metrics & Targets', requirement: 'GHG Scope 3 emissions', status: 'gap',
          evidence: 'Scope 3 data not available in current dataset',
          priority: 'P1', owner: 'Sustainability', gap: 'Scope 3 Category 15 (investments) not measured', action: 'Implement PCAF Scope 3 methodology' },
        { id: 'TCFD-M3', area: 'Metrics & Targets', requirement: 'WACI disclosure', status: assess.hasWACI ? 'compliant' : 'gap',
          evidence: assess.hasWACI ? `WACI calculable from ${assess.holdingsWithGHG} holdings with GHG + revenue data` : 'Insufficient data for WACI calculation',
          priority: 'P1', owner: 'Portfolio Analytics',
          gap: !assess.hasWACI ? 'Need >50% GHG coverage for reliable WACI' : null, action: !assess.hasWACI ? 'Improve GHG data coverage' : null },
        { id: 'TCFD-M4', area: 'Metrics & Targets', requirement: 'Climate targets and performance tracking', status: assess.sbtiPct >= 50 ? 'compliant' : assess.sbtiPct >= 20 ? 'partial' : 'gap',
          evidence: `${assess.sbtiCount} of ${assess.totalHoldings} holdings have SBTi commitments (${assess.sbtiPct.toFixed(0)}%)`,
          priority: 'P2', owner: 'Head of ESG',
          gap: assess.sbtiPct < 50 ? `Only ${assess.sbtiPct.toFixed(0)}% SBTi coverage, target 50%` : null,
          action: assess.sbtiPct < 50 ? 'Engage holdings without SBTi commitments' : null },
      ],
    },
    {
      id: 'SFDR', name: 'SFDR', fullName: 'Sustainable Finance Disclosure Regulation', color: '#2563eb',
      requirements: [
        { id: 'SFDR-1', area: 'Entity-Level', requirement: 'PAI statement published', status: assess.hasReports && assess.ghgCoverage >= 50 ? 'compliant' : assess.ghgCoverage >= 30 ? 'partial' : 'gap',
          evidence: assess.hasReports ? `${assess.reportCount} report template(s) available` : 'No reports generated',
          priority: 'P1', owner: 'Compliance',
          gap: !assess.hasReports ? 'No report templates configured' : null, action: !assess.hasReports ? 'Generate PAI report in Advanced Report Studio' : null, link: '/report-studio' },
        { id: 'SFDR-2', area: 'Entity-Level', requirement: 'Adverse impact consideration in remuneration', status: 'gap',
          evidence: 'Not assessable from portfolio data',
          priority: 'P2', owner: 'HR/Compliance', gap: 'Remuneration policy ESG link not tracked', action: 'Update remuneration policy to include ESG KPIs' },
        { id: 'SFDR-3', area: 'Product-Level', requirement: 'Pre-contractual disclosures (Art. 8/9)', status: assess.hasPortfolio && assess.esgCoverage >= 50 ? 'compliant' : assess.hasPortfolio ? 'partial' : 'gap',
          evidence: assess.hasPortfolio ? `Portfolio ESG coverage: ${assess.esgCoverage.toFixed(0)}%` : 'No portfolio',
          priority: 'P1', owner: 'Legal' },
        { id: 'SFDR-4', area: 'Product-Level', requirement: 'Periodic reporting (Art. 11)', status: assess.hasReports ? 'compliant' : assess.ghgCoverage >= 50 ? 'partial' : 'gap',
          evidence: assess.hasReports ? `Report templates configured, GHG coverage: ${assess.ghgCoverage.toFixed(0)}%` : `GHG coverage at ${assess.ghgCoverage.toFixed(0)}%`,
          priority: 'P1', owner: 'Reporting',
          gap: !assess.hasReports ? 'No periodic reports generated' : null, action: !assess.hasReports ? 'Use Advanced Report Studio to generate SFDR report' : null, link: '/report-studio' },
        { id: 'SFDR-5', area: 'Product-Level', requirement: 'Website disclosures (Art. 10)', status: assess.hasPortfolio ? 'partial' : 'gap',
          evidence: assess.hasPortfolio ? 'Portfolio data available for disclosure' : 'No data',
          priority: 'P2', owner: 'Marketing' },
        { id: 'SFDR-6', area: 'Product-Level', requirement: 'EU Taxonomy alignment disclosure', status: 'partial',
          evidence: 'Revenue alignment estimable from sector data, CapEx/OpEx alignment requires additional data',
          priority: 'P1', owner: 'ESG Analytics', gap: 'CapEx and OpEx alignment not fully calculable from current data', action: 'Implement Taxonomy CapEx/OpEx calculation' },
      ],
    },
    {
      id: 'CSRD', name: 'CSRD', fullName: 'Corporate Sustainability Reporting Directive', color: '#15803d',
      requirements: [
        { id: 'CSRD-1', area: 'Double Materiality', requirement: 'Double materiality assessment completed', status: assess.esgCoverage >= 60 ? 'partial' : 'gap',
          evidence: `ESG coverage: ${assess.esgCoverage.toFixed(0)}%. Financial materiality assessable, impact materiality requires stakeholder engagement`,
          priority: 'P1', owner: 'Head of ESG', gap: 'Impact materiality stakeholder assessment pending', action: 'Complete stakeholder engagement for impact materiality' },
        { id: 'CSRD-2', area: 'ESRS E1', requirement: 'E1-1 Transition plan disclosed', status: assess.sbtiPct >= 30 ? 'partial' : 'gap',
          evidence: `${assess.sbtiCount} holdings with SBTi commitments (${assess.sbtiPct.toFixed(0)}%)`,
          priority: 'P1', owner: 'Sustainability', gap: 'Transition plan needs formal validation', action: 'Submit to SBTi / TPT for validation' },
        { id: 'CSRD-3', area: 'ESRS E1', requirement: 'E1-6 GHG emissions (S1+S2+S3)', status: assess.ghgCoverage >= 80 ? 'partial' : 'gap',
          evidence: `Scope 1+2: ${assess.holdingsWithGHG} of ${assess.totalHoldings} holdings (${assess.ghgCoverage.toFixed(0)}%). Scope 3 not available`,
          priority: 'P1', owner: 'Sustainability', gap: 'Scope 3 not independently verified', action: 'Commission limited assurance on Scope 3' },
        { id: 'CSRD-4', area: 'ESRS S1', requirement: 'S1 Own workforce disclosures', status: 'gap',
          evidence: 'Workforce data not tracked in current platform',
          priority: 'P2', owner: 'HR', gap: 'Full S1 workforce data collection needed', action: 'Implement ESRS S1 data collection framework' },
        { id: 'CSRD-5', area: 'ESRS G1', requirement: 'G1 Business conduct and ethics', status: assess.hasPortfolio ? 'compliant' : 'gap',
          evidence: assess.hasPortfolio ? 'Code of conduct and anti-corruption policy in place' : 'No assessment possible',
          priority: 'P2', owner: 'Compliance' },
        { id: 'CSRD-6', area: 'Assurance', requirement: 'Limited assurance on sustainability report', status: assess.hasReports ? 'partial' : 'gap',
          evidence: assess.hasReports ? 'Reports generated, assurance engagement pending' : 'No reports available',
          priority: 'P1', owner: 'Finance', gap: 'Assurance provider engagement needed', action: 'Select and engage assurance provider', link: '/report-studio' },
      ],
    },
    {
      id: 'ISSB', name: 'ISSB S2', fullName: 'IFRS S2 Climate-related Disclosures', color: '#0d9488',
      requirements: [
        { id: 'ISSB-1', area: 'Governance', requirement: 'Climate governance disclosures', status: assess.hasPortfolio ? 'compliant' : 'gap',
          evidence: assess.hasPortfolio ? 'Governance structure supported by portfolio data' : 'No data', priority: 'P1', owner: 'Board Secretary' },
        { id: 'ISSB-2', area: 'Strategy', requirement: 'Climate resilience assessment', status: assess.hasScenarios ? 'compliant' : assess.hasPortfolio ? 'partial' : 'gap',
          evidence: assess.hasScenarios ? `${assess.scenarioCount} scenario(s) run` : 'Quantitative scenario analysis needed',
          priority: 'P1', owner: 'Risk', gap: !assess.hasScenarios ? 'Quantitative scenario analysis required' : null,
          action: !assess.hasScenarios ? 'Run climate scenarios in Scenario Stress Tester' : null, link: '/scenario-stress-tester' },
        { id: 'ISSB-3', area: 'Metrics', requirement: 'Cross-industry climate metrics', status: assess.hasWACI ? 'compliant' : assess.ghgCoverage > 0 ? 'partial' : 'gap',
          evidence: assess.hasWACI ? 'GHG + WACI calculable' : `GHG coverage: ${assess.ghgCoverage.toFixed(0)}%`,
          priority: 'P1', owner: 'Analytics' },
        { id: 'ISSB-4', area: 'Metrics', requirement: 'Industry-based metrics (SASB aligned)', status: 'gap',
          evidence: 'SASB industry metrics not mapped in current platform',
          priority: 'P2', owner: 'ESG Data', gap: 'SASB metrics not yet identified for portfolio sectors', action: 'Map SASB metrics to portfolio sectors' },
        { id: 'ISSB-5', area: 'Targets', requirement: 'Climate targets and transition plan', status: assess.sbtiPct >= 30 ? 'partial' : 'gap',
          evidence: `${assess.sbtiCount} holdings with SBTi (${assess.sbtiPct.toFixed(0)}%)`,
          priority: 'P1', owner: 'Sustainability', gap: assess.sbtiPct < 30 ? 'Transition plan not formalized' : null, action: 'Develop TPT-aligned transition plan' },
      ],
    },
    {
      id: 'EUTAX', name: 'EU Taxonomy', fullName: 'EU Taxonomy Regulation', color: '#4f46e5',
      requirements: [
        { id: 'TAX-1', area: 'Eligibility', requirement: 'Taxonomy eligibility assessment', status: assess.hasPortfolio && assess.esgCoverage >= 30 ? 'compliant' : assess.hasPortfolio ? 'partial' : 'gap',
          evidence: assess.hasPortfolio ? `Eligibility screening based on ${assess.totalHoldings} holdings` : 'No portfolio',
          priority: 'P1', owner: 'ESG Analytics' },
        { id: 'TAX-2', area: 'Alignment', requirement: 'Revenue alignment - substantial contribution', status: assess.revenueCoverage >= 50 ? 'partial' : 'gap',
          evidence: `Revenue data: ${assess.holdingsWithRevenue} of ${assess.totalHoldings} holdings (${assess.revenueCoverage.toFixed(0)}%)`,
          priority: 'P1', owner: 'ESG Analytics', gap: 'Technical screening criteria incomplete for some activities', action: 'Complete technical screening' },
        { id: 'TAX-3', area: 'Alignment', requirement: 'CapEx and OpEx alignment', status: 'gap',
          evidence: 'CapEx/OpEx data not available in current dataset',
          priority: 'P1', owner: 'Finance', gap: 'CapEx/OpEx KPIs not implemented', action: 'Implement CapEx/OpEx Taxonomy calculator' },
        { id: 'TAX-4', area: 'DNSH', requirement: 'Do No Significant Harm assessment', status: assess.esgCoverage >= 50 ? 'partial' : 'gap',
          evidence: assess.esgCoverage >= 50 ? 'Climate objectives assessable from ESG data, other objectives pending' : 'Insufficient ESG data',
          priority: 'P2', owner: 'ESG Analytics', gap: 'DNSH for water, circular economy, pollution, biodiversity pending', action: 'Complete DNSH for all 6 environmental objectives' },
        { id: 'TAX-5', area: 'Safeguards', requirement: 'Minimum safeguards compliance (UNGP/OECD)', status: assess.hasPortfolio ? 'compliant' : 'gap',
          evidence: assess.hasPortfolio ? 'HRDD process documented' : 'No assessment possible',
          priority: 'P2', owner: 'Compliance' },
      ],
    },
    {
      id: 'PCAF', name: 'PCAF', fullName: 'Partnership for Carbon Accounting Financials', color: '#be185d',
      requirements: [
        { id: 'PCAF-1', area: 'Methodology', requirement: 'PCAF methodology adopted for financed emissions', status: assess.hasPortfolio && assess.ghgCoverage > 0 ? 'compliant' : 'gap',
          evidence: assess.ghgCoverage > 0 ? `PCAF implemented with ${assess.ghgCoverage.toFixed(0)}% GHG coverage` : 'No GHG data',
          priority: 'P1', owner: 'Analytics' },
        { id: 'PCAF-2', area: 'Asset Classes', requirement: 'All relevant asset classes covered', status: assess.hasFIPortfolio && assess.hasPortfolio ? 'compliant' : assess.hasPortfolio ? 'partial' : 'gap',
          evidence: assess.hasPortfolio ? `Equity portfolio loaded${assess.hasFIPortfolio ? ', fixed income portfolio available' : ', fixed income pending'}` : 'No portfolio',
          priority: 'P1', owner: 'Analytics', gap: !assess.hasFIPortfolio ? 'Fixed income and project finance asset classes missing' : null,
          action: !assess.hasFIPortfolio ? 'Load fixed income portfolio in FI Portfolio module' : null },
        { id: 'PCAF-3', area: 'Data Quality', requirement: 'Data quality score >= 2.0 for >80% of portfolio', status: assess.ghgCoverage >= 80 ? 'compliant' : assess.ghgCoverage >= 50 ? 'partial' : 'gap',
          evidence: `GHG coverage: ${assess.ghgCoverage.toFixed(0)}% (target: 80%)`,
          priority: 'P2', owner: 'ESG Data', gap: assess.ghgCoverage < 80 ? `Coverage ${assess.ghgCoverage.toFixed(0)}% below 80% target` : null,
          action: assess.ghgCoverage < 80 ? 'Improve data sourcing to reach 80% coverage' : null },
        { id: 'PCAF-4', area: 'Disclosure', requirement: 'Annual financed emissions report published', status: assess.hasReports && assess.ghgCoverage >= 50 ? 'compliant' : assess.hasReports ? 'partial' : 'gap',
          evidence: assess.hasReports ? 'Report templates available' : 'No reports generated',
          priority: 'P1', owner: 'Reporting', link: '/report-studio' },
      ],
    },
    {
      id: 'SEBI', name: 'SEBI BRSR', fullName: 'SEBI Business Responsibility & Sustainability Reporting', color: '#f97316',
      requirements: [
        { id: 'SEBI-1', area: 'BRSR Core', requirement: 'BRSR Core compliance for top 1000 listed', status: assess.hasPortfolio ? 'compliant' : 'gap',
          evidence: assess.hasPortfolio ? `Portfolio contains holdings across exchanges` : 'No portfolio',
          priority: 'P1', owner: 'India Compliance' },
        { id: 'SEBI-2', area: 'Assurance', requirement: 'Reasonable assurance on BRSR Core', status: 'gap',
          evidence: 'Reasonable assurance mandated from FY2025-26',
          priority: 'P2', owner: 'Finance', gap: 'No assurance provider engaged', action: 'Engage assurance provider for India portfolio companies' },
        { id: 'SEBI-3', area: 'Value Chain', requirement: 'Value chain ESG disclosures', status: assess.hasEngagements ? 'partial' : 'gap',
          evidence: assess.hasEngagements ? `${assess.stewardshipCount} engagements logged` : 'No supply chain assessments',
          priority: 'P3', owner: 'Procurement', gap: 'Value chain ESG assessment incomplete', action: 'Extend supply chain assessment via Stewardship Tracker', link: '/stewardship-tracker' },
      ],
    },
    {
      id: 'TNFD', name: 'TNFD', fullName: 'Taskforce on Nature-related Financial Disclosures', color: '#059669',
      requirements: [
        { id: 'TNFD-1', area: 'LEAP', requirement: 'LEAP assessment completed', status: 'gap',
          evidence: 'No nature-related assessment performed',
          priority: 'P2', owner: 'ESG Analytics', gap: 'LEAP assessment not started', action: 'Initiate LEAP pilot for highest-impact sectors' },
        { id: 'TNFD-2', area: 'Metrics', requirement: 'Nature-related dependencies and impacts measured', status: 'gap',
          evidence: 'ENCORE dependency mapping not done',
          priority: 'P2', owner: 'ESG Analytics', gap: 'No ENCORE dependency analysis', action: 'Implement ENCORE dependency analysis for top 20 holdings' },
        { id: 'TNFD-3', area: 'Targets', requirement: 'Nature-positive targets set (SBTN aligned)', status: 'gap',
          evidence: 'No nature targets set',
          priority: 'P3', owner: 'Sustainability', gap: 'No SBTN commitment', action: 'Evaluate SBTN target-setting methodology' },
      ],
    },
  ];
}

const DEADLINES = [
  { framework: 'CSRD', deadline: 'Jan 2025', note: 'First reporting period for large PIEs' },
  { framework: 'SFDR', deadline: '30 Jun annually', note: 'PAI statement publication deadline' },
  { framework: 'ISSB S2', deadline: 'Jan 2025', note: 'First IFRS S2 reporting period' },
  { framework: 'EU Taxonomy', deadline: 'Annual report', note: 'Art. 8 disclosure in annual financial report' },
  { framework: 'PCAF', deadline: 'Annual', note: 'Annual financed emissions disclosure' },
  { framework: 'SEBI BRSR', deadline: '30 Jun', note: 'BRSR Core due; reasonable assurance from FY2025-26' },
  { framework: 'TCFD', deadline: 'Annual report', note: 'Integrated in annual reporting cycle' },
  { framework: 'TNFD', deadline: 'Voluntary', note: 'Early adopter disclosure recommended from 2024' },
];

const statusIcon = s => s === 'compliant' ? '\u2705' : s === 'partial' ? '\u26A0\uFE0F' : '\u274C';
const statusLabel = s => s === 'compliant' ? 'Compliant' : s === 'partial' ? 'Partial' : 'Gap';
const statusColor = s => s === 'compliant' ? T.green : s === 'partial' ? T.amber : T.red;
const priorityColor = p => p === 'P1' ? T.red : p === 'P2' ? T.amber : T.green;

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
function RegulatoryGapPage() {
  const navigate = useNavigate();

  /* ── Portfolio data ────────────────────────────────────────────── */
  const [portfolioData, setPortfolioData] = useState(() => {
    try { const s = localStorage.getItem('ra_portfolio_v1'); return s ? JSON.parse(s) : { portfolios: {}, activePortfolio: null }; } catch { return { portfolios: {}, activePortfolio: null }; }
  });
  const holdings = portfolioData.portfolios?.[portfolioData.activePortfolio]?.holdings || [];

  /* ── Action statuses (persisted) ───────────────────────────────── */
  const [actionStatuses, setActionStatuses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_compliance_actions_v1') || '{}'); } catch { return {}; }
  });

  /* ── Compliance history (persisted) ────────────────────────────── */
  const [complianceHistory, setComplianceHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_compliance_history_v1') || '[]'); } catch { return []; }
  });

  /* ── UI state ──────────────────────────────────────────────────── */
  const [selectedFramework, setSelectedFramework] = useState('ALL');
  const [showCompareView, setShowCompareView] = useState(false);
  const [compareFrameworks, setCompareFrameworks] = useState([]);
  const [expandedAction, setExpandedAction] = useState(null);

  /* ── Dynamic compliance assessment ─────────────────────────────── */
  const assess = useMemo(() => assessCompliance(holdings), [holdings]);

  /* ── Dynamic frameworks ────────────────────────────────────────── */
  const FRAMEWORKS = useMemo(() => buildFrameworks(assess, actionStatuses), [assess, actionStatuses]);

  /* ── Flatten all requirements ──────────────────────────────────── */
  const allReqs = useMemo(() => {
    const items = [];
    FRAMEWORKS.forEach(fw => {
      fw.requirements.forEach(r => {
        // Apply action override: if user marked action complete, treat as partial minimum
        const effectiveStatus = (actionStatuses[r.id] === 'complete' && r.status === 'gap') ? 'partial' : r.status;
        items.push({ ...r, status: effectiveStatus, framework: fw.name, frameworkId: fw.id, frameworkColor: fw.color, frameworkFullName: fw.fullName });
      });
    });
    return items;
  }, [FRAMEWORKS, actionStatuses]);

  const totalReqs = allReqs.length;
  const compliantCount = allReqs.filter(r => r.status === 'compliant').length;
  const partialCount = allReqs.filter(r => r.status === 'partial').length;
  const gapCount = allReqs.filter(r => r.status === 'gap').length;
  const criticalGaps = allReqs.filter(r => r.status === 'gap' && r.priority === 'P1').length;
  const actionItems = allReqs.filter(r => r.gap).length;
  const overallCompliance = totalReqs > 0 ? Math.round(((compliantCount + partialCount * 0.5) / totalReqs) * 100) : 0;

  /* ── Compliance history tracking ───────────────────────────────── */
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const existing = complianceHistory.find(h => h.date === today);
    if (!existing && holdings.length > 0) {
      const newHistory = [...complianceHistory, { date: today, score: overallCompliance, compliant: compliantCount, partial: partialCount, gap: gapCount }].slice(-30);
      setComplianceHistory(newHistory);
      localStorage.setItem('ra_compliance_history_v1', JSON.stringify(newHistory));
    } else if (existing && existing.score !== overallCompliance && holdings.length > 0) {
      const newHistory = complianceHistory.map(h => h.date === today ? { ...h, score: overallCompliance, compliant: compliantCount, partial: partialCount, gap: gapCount } : h);
      setComplianceHistory(newHistory);
      localStorage.setItem('ra_compliance_history_v1', JSON.stringify(newHistory));
    }
  }, [overallCompliance, compliantCount, partialCount, gapCount]); // eslint-disable-line

  /* ── Framework scores ──────────────────────────────────────────── */
  const fwScores = useMemo(() => FRAMEWORKS.map(fw => {
    const reqs = allReqs.filter(r => r.frameworkId === fw.id);
    const c = reqs.filter(r => r.status === 'compliant').length;
    const p = reqs.filter(r => r.status === 'partial').length;
    const g = reqs.filter(r => r.status === 'gap').length;
    const tot = reqs.length;
    return { ...fw, compliant: c, partial: p, gaps: g, total: tot, score: tot > 0 ? Math.round(((c + p * 0.5) / tot) * 100) : 0 };
  }), [FRAMEWORKS, allReqs]);

  /* ── Stacked bar data ──────────────────────────────────────────── */
  const barData = useMemo(() => fwScores.map(fw => ({
    name: fw.name, Compliant: fw.compliant, Partial: fw.partial, Gap: fw.gaps
  })), [fwScores]);

  /* ── Filtered requirements ─────────────────────────────────────── */
  const filteredReqs = useMemo(() => {
    let items = selectedFramework === 'ALL' ? allReqs : allReqs.filter(r => r.frameworkId === selectedFramework);
    return items.sort((a, b) => {
      const po = { P1: 0, P2: 1, P3: 2 };
      const so = { gap: 0, partial: 1, compliant: 2 };
      if (po[a.priority] !== po[b.priority]) return po[a.priority] - po[b.priority];
      return so[a.status] - so[b.status];
    });
  }, [selectedFramework, allReqs]);

  /* ── Action items ──────────────────────────────────────────────── */
  const actionItemList = useMemo(() => allReqs.filter(r => r.gap || r.status !== 'compliant'), [allReqs]);

  /* ── Data completeness fields ──────────────────────────────────── */
  const dataFields = useMemo(() => {
    if (holdings.length === 0) return [];
    return [
      { field: 'ESG Score', coverage: assess.esgCoverage, count: assess.holdingsWithESG, missing: holdings.filter(h => !(h.company?.esg_score > 0)).map(h => h.ticker || h.name).slice(0, 10) },
      { field: 'Scope 1 GHG', coverage: assess.ghgCoverage, count: assess.holdingsWithGHG, missing: holdings.filter(h => !(h.company?.scope1_mt > 0)).map(h => h.ticker || h.name).slice(0, 10) },
      { field: 'Scope 2 GHG', coverage: assess.ghgCoverage, count: assess.holdingsWithGHG, missing: holdings.filter(h => !(h.company?.scope2_mt > 0)).map(h => h.ticker || h.name).slice(0, 10) },
      { field: 'Revenue', coverage: assess.revenueCoverage, count: assess.holdingsWithRevenue, missing: holdings.filter(h => !(h.company?.revenue_usd_mn > 0)).map(h => h.ticker || h.name).slice(0, 10) },
      { field: 'Market Cap', coverage: assess.mcapCoverage, count: assess.holdingsWithMarketCap, missing: holdings.filter(h => !(h.company?.mcap_usd_mn > 0)).map(h => h.ticker || h.name).slice(0, 10) },
      { field: 'EVIC', coverage: assess.evicCoverage, count: assess.holdingsWithEVIC, missing: holdings.filter(h => !(h.company?.evic_usd_mn > 0)).map(h => h.ticker || h.name).slice(0, 10) },
      { field: 'SBTi Committed', coverage: assess.sbtiPct, count: assess.sbtiCount, missing: holdings.filter(h => !h.company?.sbti_committed).map(h => h.ticker || h.name).slice(0, 10) },
      { field: 'T-Risk Score', coverage: assess.triskCoverage, count: assess.holdingsWithTRisk, missing: holdings.filter(h => !(h.company?.transition_risk_score > 0)).map(h => h.ticker || h.name).slice(0, 10) },
      { field: 'Net Zero Target', coverage: assess.netZeroCoverage, count: assess.holdingsWithNetZero, missing: holdings.filter(h => !h.company?.net_zero_target).map(h => h.ticker || h.name).slice(0, 10) },
    ];
  }, [holdings, assess]);

  const overallDataQuality = useMemo(() => {
    if (dataFields.length === 0) return 0;
    const weights = [2, 2, 2, 1, 1, 1, 1, 1, 1]; // GHG and ESG weighted higher
    const totalW = weights.reduce((s, w) => s + w, 0);
    return Math.round(dataFields.reduce((s, f, i) => s + f.coverage * (weights[i] || 1), 0) / totalW);
  }, [dataFields]);

  /* ── Compliance heatmap ────────────────────────────────────────── */
  const heatmapData = useMemo(() => {
    const allAreas = new Set();
    FRAMEWORKS.forEach(fw => fw.requirements.forEach(r => allAreas.add(r.area)));
    const areas = [...allAreas];
    return { areas, rows: FRAMEWORKS.map(fw => {
      const areaStatus = {};
      areas.forEach(area => {
        const reqs = allReqs.filter(r => r.frameworkId === fw.id && r.area === area);
        if (reqs.length === 0) { areaStatus[area] = null; return; }
        if (reqs.some(r => r.status === 'gap')) areaStatus[area] = 'gap';
        else if (reqs.some(r => r.status === 'partial')) areaStatus[area] = 'partial';
        else areaStatus[area] = 'compliant';
      });
      return { framework: fw.name, color: fw.color, ...areaStatus };
    })};
  }, [FRAMEWORKS, allReqs]);

  /* ── Recommendations ───────────────────────────────────────────── */
  const recommendations = useMemo(() => {
    const recs = [];
    if (assess.ghgCoverage < 80) {
      recs.push({ text: `Add GHG data for ${assess.totalHoldings - assess.holdingsWithGHG} holdings to improve TCFD-M1 from ${assess.ghgCoverage >= 50 ? 'Partial' : 'Gap'} to Compliant`, priority: 'P1', link: '/portfolio-builder', module: 'Portfolio Builder' });
    }
    if (!assess.hasReports) {
      recs.push({ text: 'Use the Advanced Report Studio to generate SFDR PAI statement for SFDR-4 compliance', priority: 'P1', link: '/report-studio', module: 'Report Studio' });
    }
    if (!assess.hasScenarios) {
      recs.push({ text: 'Run Scenario Stress Tester for TCFD-S2 and ISSB-2 scenario analysis requirements', priority: 'P1', link: '/scenario-stress-tester', module: 'Scenario Stress Tester' });
    }
    if (assess.stewardshipCount === 0) {
      recs.push({ text: 'Log engagements in Stewardship Tracker for UNPRI Principle 2 and SEBI value chain evidence', priority: 'P2', link: '/stewardship-tracker', module: 'Stewardship Tracker' });
    }
    if (assess.sbtiPct < 50) {
      recs.push({ text: `Engage ${assess.totalHoldings - assess.sbtiCount} holdings without SBTi commitments to improve TCFD-M4`, priority: 'P2', link: '/stewardship-tracker', module: 'Stewardship Tracker' });
    }
    if (assess.esgCoverage < 60) {
      recs.push({ text: `Improve ESG score coverage from ${assess.esgCoverage.toFixed(0)}% to 60%+ for CSRD materiality assessment`, priority: 'P2', link: '/portfolio-builder', module: 'Portfolio Builder' });
    }
    return recs;
  }, [assess]);

  /* ── Action status toggling ────────────────────────────────────── */
  const toggleActionStatus = (id) => {
    setActionStatuses(prev => {
      const current = prev[id] || 'not_started';
      const next = current === 'not_started' ? 'in_progress' : current === 'in_progress' ? 'complete' : 'not_started';
      const updated = { ...prev, [id]: next };
      localStorage.setItem('ra_compliance_actions_v1', JSON.stringify(updated));
      return updated;
    });
  };

  const updateActionField = (id, field, value) => {
    setActionStatuses(prev => {
      const updated = { ...prev, [`${id}_${field}`]: value };
      localStorage.setItem('ra_compliance_actions_v1', JSON.stringify(updated));
      return updated;
    });
  };

  const actionStatusLbl = s => s === 'complete' ? 'Complete' : s === 'in_progress' ? 'In Progress' : 'Not Started';
  const actionStatusClr = s => s === 'complete' ? T.green : s === 'in_progress' ? T.amber : T.textMut;

  /* ── Export handlers ───────────────────────────────────────────── */
  const exportComplianceReport = () => {
    const rows = allReqs.map(r => ({
      Framework: r.framework, ID: r.id, Area: r.area, Requirement: r.requirement,
      Status: statusLabel(r.status), Evidence: r.evidence, Priority: r.priority, Owner: r.owner,
      Gap: r.gap || '', Action: r.action || '',
      ActionStatus: actionStatusLbl(actionStatuses[r.id] || 'not_started'),
    }));
    downloadCSV(rows, 'compliance_report.csv');
  };

  const exportActionItems = () => {
    const rows = actionItemList.filter(r => r.gap).map(r => ({
      ID: r.id, Framework: r.framework, Requirement: r.requirement, Gap: r.gap || '',
      Action: r.action || '', Priority: r.priority, Owner: actionStatuses[`${r.id}_owner`] || r.owner,
      TargetDate: actionStatuses[`${r.id}_target`] || '', Status: actionStatusLbl(actionStatuses[r.id] || 'not_started'),
    }));
    downloadCSV(rows, 'action_items.csv');
  };

  const exportEvidence = () => {
    const rows = allReqs.map(r => ({
      Framework: r.framework, ID: r.id, Requirement: r.requirement, Status: statusLabel(r.status),
      Evidence: r.evidence, DynamicAssessment: 'Yes',
    }));
    downloadCSV(rows, 'evidence_trail.csv');
  };

  /* ── Styles ────────────────────────────────────────────────────── */
  const btnStyle = (bg, fg) => ({ padding: '8px 16px', borderRadius: 8, border: 'none', background: bg, color: fg, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: T.font, transition: 'opacity 0.15s' });
  const inputStyle = { padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12, color: T.text, background: T.surface, outline: 'none' };

  const kpiCards = [
    { label: 'Frameworks Assessed', value: '8', color: T.navy },
    { label: 'Overall Compliance', value: overallCompliance + '%', color: overallCompliance >= 70 ? T.green : overallCompliance >= 50 ? T.amber : T.red },
    { label: 'Critical Gaps (P1)', value: criticalGaps, color: criticalGaps > 0 ? T.red : T.green },
    { label: 'Data Quality Score', value: overallDataQuality + '%', color: overallDataQuality >= 70 ? T.green : overallDataQuality >= 40 ? T.amber : T.red },
    { label: 'Action Items', value: actionItems, color: T.gold },
  ];

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  /* ── No portfolio state ────────────────────────────────────────── */
  if (holdings.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.text, padding: '32px 40px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: T.navy }}>Regulatory Compliance Gap Analyzer</h1>
            <span style={{ fontSize: 11, fontWeight: 600, background: T.navy, color: '#fff', padding: '4px 12px', borderRadius: 20, letterSpacing: 0.5 }}>EP-H6</span>
          </div>
        </div>
        <div style={{ background: T.surface, borderRadius: 16, padding: '80px 40px', textAlign: 'center', border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#128202;</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Load a Portfolio to Begin Compliance Assessment</h2>
          <p style={{ fontSize: 14, color: T.textSec, maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.6 }}>
            The compliance status of each regulatory requirement is dynamically computed from your portfolio data.
            Load a portfolio with ESG, GHG, and company data to see real compliance scores.
          </p>
          <button onClick={() => navigate('/portfolio-builder')} style={{ ...btnStyle(T.navy, '#fff'), padding: '12px 32px', fontSize: 14 }}>
            Go to Portfolio Builder &rarr;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.text, padding: '32px 40px' }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: T.navy }}>Regulatory Compliance Gap Analyzer</h1>
            <span style={{ fontSize: 11, fontWeight: 600, background: T.navy, color: '#fff', padding: '4px 12px', borderRadius: 20, letterSpacing: 0.5 }}>EP-H6</span>
            <span style={{ fontSize: 11, fontWeight: 500, background: 'rgba(22,163,74,0.1)', color: T.green, padding: '4px 12px', borderRadius: 20 }}>DYNAMIC</span>
          </div>
          <p style={{ fontSize: 13, color: T.textSec, margin: 0 }}>8 Frameworks &middot; {assess.totalHoldings} Holdings &middot; Assessment Driven by Real Data</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportComplianceReport} style={btnStyle(T.sage, '#fff')}>Export Compliance CSV</button>
          <button onClick={exportActionItems} style={btnStyle(T.gold, '#fff')}>Export Actions CSV</button>
          <button onClick={exportEvidence} style={btnStyle(T.navy, '#fff')}>Export Evidence CSV</button>
          <button onClick={() => setShowCompareView(!showCompareView)} style={btnStyle(showCompareView ? T.red : T.navyL, '#fff')}>
            {showCompareView ? 'Close Compare' : 'Compare Frameworks'}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        {kpiCards.map((c, i) => (
          <div key={i} style={{ background: T.surface, borderRadius: 12, padding: '20px 24px', border: `1px solid ${T.border}`, borderTop: `3px solid ${c.color}` }}>
            <div style={{ fontSize: 12, color: T.textMut, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* ── Data Completeness Dashboard ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: T.surface, borderRadius: 12, padding: 24, border: `1px solid ${T.border}` }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Portfolio Data Depth</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dataFields.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 100, fontSize: 12, fontWeight: 500, color: T.textSec, flexShrink: 0 }}>{f.field}</span>
                <div style={{ flex: 1, height: 16, background: T.surfaceH, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ height: '100%', width: f.coverage + '%', background: f.coverage >= 80 ? T.green : f.coverage >= 50 ? T.amber : T.red, borderRadius: 8, transition: 'width 0.4s' }} />
                </div>
                <span style={{ width: 60, fontSize: 12, fontWeight: 700, textAlign: 'right', color: f.coverage >= 80 ? T.green : f.coverage >= 50 ? T.amber : T.red }}>
                  {f.coverage.toFixed(0)}%
                </span>
                <span style={{ width: 60, fontSize: 11, color: T.textMut, textAlign: 'right' }}>{f.count}/{assess.totalHoldings}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: T.surface, borderRadius: 12, padding: 24, border: `1px solid ${T.border}` }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: T.navy }}>Data Quality Score</h2>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: overallDataQuality >= 70 ? T.green : overallDataQuality >= 40 ? T.amber : T.red }}>
              {overallDataQuality}%
            </div>
            <div style={{ fontSize: 12, color: T.textMut }}>Weighted average (GHG + ESG prioritized)</div>
          </div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: T.navy, margin: '16px 0 8px' }}>Top Data Gaps</h3>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {dataFields.filter(f => f.coverage < 80).sort((a, b) => a.coverage - b.coverage).slice(0, 5).map((f, i) => (
              <div key={i} style={{ fontSize: 11, padding: '4px 0', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontWeight: 600, color: T.red }}>{f.field}</span>
                <span style={{ color: T.textMut }}> - Missing: </span>
                <span style={{ color: T.textSec }}>{f.missing.slice(0, 5).join(', ')}{f.missing.length > 5 ? ` +${f.missing.length - 5} more` : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Compliance Trend Chart ───────────────────────────────── */}
      {complianceHistory.length > 1 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 24, border: `1px solid ${T.border}`, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', color: T.navy }}>Compliance Score Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={complianceHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.sage} stopOpacity={0.4} /><stop offset="100%" stopColor={T.sage} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: T.textMut }} tickFormatter={v => v.slice(5)} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMut }} tickFormatter={v => v + '%'} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }}
                formatter={v => [v + '%', 'Compliance']} />
              <Area type="monotone" dataKey="score" stroke={T.sage} strokeWidth={2} fill="url(#compGrad)"
                dot={{ r: 3, fill: T.surface, stroke: T.sage, strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Recommendations ──────────────────────────────────────── */}
      {recommendations.length > 0 && (
        <div style={{ background: 'rgba(27,58,92,0.03)', borderRadius: 12, padding: 24, border: `1px solid ${T.border}`, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Prioritized Recommendations</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {recommendations.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
                <span style={{ display: 'inline-block', background: priorityColor(r.priority), color: '#fff', padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{r.priority}</span>
                <span style={{ flex: 1, fontSize: 13, color: T.text }}>{r.text}</span>
                <button onClick={() => navigate(r.link)} style={{ ...btnStyle(T.navy, '#fff'), padding: '6px 14px', fontSize: 11, whiteSpace: 'nowrap' }}>
                  {r.module} &rarr;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Framework Scorecards ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {fwScores.map(fw => {
          const cPct = fw.total > 0 ? (fw.compliant / fw.total) * 100 : 0;
          const pPct = fw.total > 0 ? (fw.partial / fw.total) * 100 : 0;
          const gPct = fw.total > 0 ? (fw.gaps / fw.total) * 100 : 0;
          return (
            <div key={fw.id} style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, borderLeft: `4px solid ${fw.color}`, cursor: 'pointer' }}
              onClick={() => setSelectedFramework(selectedFramework === fw.id ? 'ALL' : fw.id)}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{fw.name}</div>
              <div style={{ fontSize: 11, color: T.textMut, marginBottom: 12, lineHeight: 1.3 }}>{fw.fullName}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: fw.score >= 70 ? T.green : fw.score >= 40 ? T.amber : T.red, marginBottom: 10 }}>{fw.score}%</div>
              <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ width: cPct + '%', background: T.green, transition: 'width 0.3s' }} />
                <div style={{ width: pPct + '%', background: T.amber, transition: 'width 0.3s' }} />
                <div style={{ width: gPct + '%', background: T.red, transition: 'width 0.3s' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                <span style={{ color: T.green, fontWeight: 600 }}>{fw.compliant} ok</span>
                <span style={{ color: T.amber, fontWeight: 600 }}>{fw.partial} partial</span>
                <span style={{ color: T.red, fontWeight: 600 }}>{fw.gaps} gaps</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Framework Comparison View ────────────────────────────── */}
      {showCompareView && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 24, border: `2px solid ${T.gold}`, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: T.navy }}>Framework Comparison</h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {FRAMEWORKS.map(fw => (
              <label key={fw.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={compareFrameworks.includes(fw.id)}
                  onChange={() => setCompareFrameworks(prev => prev.includes(fw.id) ? prev.filter(f => f !== fw.id) : prev.length < 3 ? [...prev, fw.id] : prev)}
                  style={{ accentColor: fw.color }} />
                <span style={{ color: fw.color, fontWeight: 600 }}>{fw.name}</span>
              </label>
            ))}
            <span style={{ fontSize: 11, color: T.textMut }}>(Select up to 3)</span>
          </div>
          {compareFrameworks.length >= 2 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${compareFrameworks.length}, 1fr)`, gap: 0, fontSize: 12 }}>
                <div style={{ padding: 8, fontWeight: 600, color: T.textSec, borderBottom: `2px solid ${T.border}` }}>Metric</div>
                {compareFrameworks.map(fid => {
                  const fw = fwScores.find(f => f.id === fid);
                  return <div key={fid} style={{ padding: 8, fontWeight: 700, color: fw?.color || T.navy, borderBottom: `2px solid ${T.border}`, textAlign: 'center' }}>{fw?.name}</div>;
                })}
                {/* Score row */}
                <div style={{ padding: 8, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>Compliance Score</div>
                {compareFrameworks.map(fid => {
                  const fw = fwScores.find(f => f.id === fid);
                  return <div key={fid} style={{ padding: 8, fontWeight: 700, textAlign: 'center', borderBottom: `1px solid ${T.border}`, color: (fw?.score || 0) >= 70 ? T.green : (fw?.score || 0) >= 40 ? T.amber : T.red }}>{fw?.score || 0}%</div>;
                })}
                {/* Requirements */}
                <div style={{ padding: 8, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>Total Requirements</div>
                {compareFrameworks.map(fid => {
                  const fw = fwScores.find(f => f.id === fid);
                  return <div key={fid} style={{ padding: 8, textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>{fw?.total || 0}</div>;
                })}
                <div style={{ padding: 8, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>Compliant</div>
                {compareFrameworks.map(fid => {
                  const fw = fwScores.find(f => f.id === fid);
                  return <div key={fid} style={{ padding: 8, textAlign: 'center', borderBottom: `1px solid ${T.border}`, color: T.green, fontWeight: 600 }}>{fw?.compliant || 0}</div>;
                })}
                <div style={{ padding: 8, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>Gaps</div>
                {compareFrameworks.map(fid => {
                  const fw = fwScores.find(f => f.id === fid);
                  return <div key={fid} style={{ padding: 8, textAlign: 'center', borderBottom: `1px solid ${T.border}`, color: T.red, fontWeight: 600 }}>{fw?.gaps || 0}</div>;
                })}
              </div>
              {/* Cross-framework synergies */}
              <div style={{ marginTop: 16, padding: 16, background: T.bg, borderRadius: 8 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: T.navy, margin: '0 0 8px' }}>Cross-Framework Synergies</h3>
                <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.8 }}>
                  <div>GHG Data (Scope 1+2) improves: TCFD-M1, CSRD E1-6, PCAF-3, ISSB-3</div>
                  <div>Scenario Analysis improves: TCFD-S2, ISSB-2</div>
                  <div>Report Generation improves: SFDR-4, PCAF-4, CSRD-6</div>
                  <div>SBTi Engagement improves: TCFD-M4, CSRD E1-1, ISSB-5</div>
                  <div>Stewardship Activities improve: SEBI-3, SFDR-2 evidence</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Gap Priority Matrix ──────────────────────────────────── */}
      <div style={{ background: T.surface, borderRadius: 12, padding: 24, border: `1px solid ${T.border}`, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', color: T.navy }}>Gap Priority Matrix</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 11, fill: T.textMut }} allowDecimals={false} />
            <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Compliant" stackId="a" fill={T.green} radius={[0, 0, 0, 0]} />
            <Bar dataKey="Partial" stackId="a" fill={T.amber} />
            <Bar dataKey="Gap" stackId="a" fill={T.red} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Detailed Requirements Table ──────────────────────────── */}
      <div style={{ background: T.surface, borderRadius: 12, padding: 24, border: `1px solid ${T.border}`, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: T.navy }}>Detailed Requirements (Dynamic Assessment)</h2>
          <select value={selectedFramework} onChange={e => setSelectedFramework(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13, color: T.text, background: T.surface, cursor: 'pointer', outline: 'none' }}>
            <option value="ALL">All Frameworks</option>
            {FRAMEWORKS.map(fw => <option key={fw.id} value={fw.id}>{fw.name}</option>)}
          </select>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 1200 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Framework', 'ID', 'Area', 'Requirement', 'Status', 'Evidence (Dynamic)', 'Priority', 'Owner', 'Gap', 'Action'].map(h => (
                  <th key={h} style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 600, color: T.textSec, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredReqs.map((r, i) => (
                <tr key={r.id + i} style={{ borderBottom: `1px solid ${T.border}`, background: r.status === 'gap' ? 'rgba(220,38,38,0.03)' : r.status === 'compliant' ? 'rgba(22,163,74,0.02)' : 'transparent' }}>
                  <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-block', background: r.frameworkColor, color: '#fff', padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 600 }}>{r.framework}</span>
                  </td>
                  <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: 11 }}>{r.id}</td>
                  <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>{r.area}</td>
                  <td style={{ padding: '8px', maxWidth: 220 }}>{r.requirement}</td>
                  <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>
                    <span style={{ color: statusColor(r.status), fontWeight: 600 }}>{statusIcon(r.status)} {statusLabel(r.status)}</span>
                  </td>
                  <td style={{ padding: '8px', color: T.textSec, maxWidth: 220, fontSize: 11 }}>{r.evidence}</td>
                  <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-block', background: priorityColor(r.priority), color: '#fff', padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>{r.priority}</span>
                  </td>
                  <td style={{ padding: '8px', whiteSpace: 'nowrap', fontSize: 11 }}>{r.owner}</td>
                  <td style={{ padding: '8px', color: r.gap ? T.red : T.textMut, fontSize: 11, maxWidth: 200 }}>{r.gap || '--'}</td>
                  <td style={{ padding: '8px', fontSize: 11, maxWidth: 220 }}>
                    {r.action ? (
                      r.link ? (
                        <span style={{ color: T.navy, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate(r.link)}>{r.action}</span>
                      ) : (
                        <span style={{ color: T.navy, fontWeight: 600 }}>{r.action}</span>
                      )
                    ) : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Action Item Tracker ──────────────────────────────────── */}
      <div style={{ background: T.surface, borderRadius: 12, padding: 24, border: `1px solid ${T.border}`, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Interactive Action Tracker</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {actionItemList.filter(r => r.gap).map(r => {
            const st = actionStatuses[r.id] || 'not_started';
            const isExpanded = expandedAction === r.id;
            return (
              <div key={r.id} style={{ background: T.bg, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, borderLeft: `4px solid ${priorityColor(r.priority)}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, lineHeight: 1.4, flex: 1, paddingRight: 12, cursor: 'pointer' }}
                    onClick={() => setExpandedAction(isExpanded ? null : r.id)}>
                    {r.action || r.gap}
                    {r.link && <span style={{ fontSize: 10, color: T.gold, marginLeft: 4 }}>(has module link)</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <span style={{ display: 'inline-block', background: r.frameworkColor, color: '#fff', padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 600 }}>{r.framework}</span>
                    <span style={{ display: 'inline-block', background: priorityColor(r.priority), color: '#fff', padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>{r.priority}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <div style={{ display: 'flex', gap: 16, color: T.textSec }}>
                    <span>Owner: <b style={{ color: T.navy }}>{actionStatuses[`${r.id}_owner`] || r.owner}</b></span>
                    <span>Req: <span style={{ fontFamily: 'monospace' }}>{r.id}</span></span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {r.link && (
                      <button onClick={() => navigate(r.link)} style={{ ...btnStyle(T.navy, '#fff'), padding: '4px 10px', fontSize: 10 }}>Open Module</button>
                    )}
                    <button onClick={() => toggleActionStatus(r.id)}
                      style={{ padding: '4px 12px', borderRadius: 14, border: `1px solid ${actionStatusClr(st)}`,
                        background: st === 'complete' ? 'rgba(22,163,74,0.1)' : st === 'in_progress' ? 'rgba(217,119,6,0.1)' : T.surfaceH,
                        color: actionStatusClr(st), fontWeight: 600, fontSize: 11, cursor: 'pointer', fontFamily: T.font, transition: 'all 0.15s' }}>
                      {actionStatusLbl(st)}
                    </button>
                  </div>
                </div>
                {/* Expanded edit fields */}
                {isExpanded && (
                  <div style={{ marginTop: 12, padding: '12px 0 0', borderTop: `1px solid ${T.border}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 10, color: T.textMut, display: 'block', marginBottom: 2 }}>Owner</label>
                      <input value={actionStatuses[`${r.id}_owner`] || r.owner}
                        onChange={e => updateActionField(r.id, 'owner', e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: T.textMut, display: 'block', marginBottom: 2 }}>Target Date</label>
                      <input type="date" value={actionStatuses[`${r.id}_target`] || ''}
                        onChange={e => updateActionField(r.id, 'target', e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: T.textMut, display: 'block', marginBottom: 2 }}>Priority Override</label>
                      <select value={actionStatuses[`${r.id}_priority`] || r.priority}
                        onChange={e => updateActionField(r.id, 'priority', e.target.value)} style={inputStyle}>
                        <option value="P1">P1 - Critical</option><option value="P2">P2 - Important</option><option value="P3">P3 - Normal</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1', fontSize: 11, color: T.textSec, lineHeight: 1.5, marginTop: 4 }}>
                      <b>Evidence:</b> {r.evidence}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Compliance Heatmap ────────────────────────────────────── */}
      <div style={{ background: T.surface, borderRadius: 12, padding: 24, border: `1px solid ${T.border}`, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Compliance Heatmap</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 100 }}>Framework</th>
                {heatmapData.areas.map(a => (
                  <th key={a} style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 600, color: T.textSec, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.3, minWidth: 80, maxWidth: 110 }}>{a}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.rows.map((row, i) => (
                <tr key={i}>
                  <td style={{ padding: '8px 12px', fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ display: 'inline-block', borderLeft: `3px solid ${row.color}`, paddingLeft: 8 }}>{row.framework}</span>
                  </td>
                  {heatmapData.areas.map(a => {
                    const val = row[a];
                    const bg = val === null ? T.surfaceH : val === 'compliant' ? 'rgba(22,163,74,0.15)' : val === 'partial' ? 'rgba(217,119,6,0.15)' : 'rgba(220,38,38,0.15)';
                    const fg = val === null ? T.textMut : statusColor(val);
                    return (
                      <td key={a} style={{ padding: '6px', textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ background: bg, color: fg, borderRadius: 6, padding: '6px 4px', fontSize: 11, fontWeight: 600 }}>
                          {val === null ? '--' : val === 'compliant' ? '\u2705' : val === 'partial' ? '\u26A0\uFE0F' : '\u274C'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(22,163,74,0.15)', display: 'inline-block' }} /> Fully Compliant</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(217,119,6,0.15)', display: 'inline-block' }} /> Partial</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(220,38,38,0.15)', display: 'inline-block' }} /> Gap Identified</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: T.surfaceH, display: 'inline-block' }} /> Not Applicable</span>
        </div>
      </div>

      {/* ── Regulatory Timeline ──────────────────────────────────── */}
      <div style={{ background: T.surface, borderRadius: 12, padding: 24, border: `1px solid ${T.border}`, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Regulatory Timeline &amp; Upcoming Deadlines</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {DEADLINES.map((d, i) => {
            const fw = FRAMEWORKS.find(f => f.name === d.framework || f.id === d.framework);
            const color = fw ? fw.color : T.navy;
            return (
              <div key={i} style={{ background: T.bg, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, borderTop: `3px solid ${color}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{d.framework}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color, marginBottom: 6 }}>{d.deadline}</div>
                <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4 }}>{d.note}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 11, color: T.textMut }}>
        Risk Analytics Platform &middot; Regulatory Compliance Gap Analyzer (EP-H6) &middot; {totalReqs} Requirements Across 8 Frameworks &middot; Dynamic Assessment from {assess.totalHoldings} Holdings
      </div>
    </div>
  );
}

export default RegulatoryGapPage;
