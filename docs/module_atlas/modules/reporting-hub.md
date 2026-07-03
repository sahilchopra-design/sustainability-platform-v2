# Reporting Hub
**Module ID:** `reporting-hub` · **Route:** `/reporting-hub` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Centralized sustainability disclosure management platform consolidating GHG, TCFD, CSRD, SFDR and custom report workflows into a single governed hub.

> **Business value:** Centralises multi-framework reporting obligations with completeness tracking and workflow governance.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTION_ITEMS`, `CLIENTS`, `COLORS`, `FRAMEWORKS_LIST`, `LS_CLIENT_NOTES`, `LS_KEY`, `LS_PORTFOLIO`, `LS_REPORT_HISTORY`, `LS_REPORT_SCHEDULE`, `LS_REPORT_TEMPLATES`, `MODULES`, `MONTHLY_STATS`, `REG_SUBMISSIONS`, `REPORT_TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `fmtM` | `(n) => typeof n === 'number' ? (n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${n.toLocaleString()}`) : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `today` | `new Date('2025-05-15');` |
| `totalAUM` | `useMemo(() => CLIENTS.reduce((a, c) => a + c.aum, 0), []);` |
| `totalReportsYTD` | `useMemo(() => MONTHLY_STATS.reduce((a, m) => a + m.reports, 0), []);` |
| `avgSatisfaction` | `useMemo(() => (CLIENTS.reduce((a, c) => a + c.satisfaction, 0) / Math.max(1, CLIENTS.length)).toFixed(1), []);` |
| `onTrack` | `relevant.filter(s => s.completion > 0 \|\| Math.ceil((new Date(s.deadline) - today) / 86400000) > 90).length;` |
| `avgGenTime` | `useMemo(() => (REPORT_TYPES.reduce((a, r) => a + r.avgGenTime, 0) / Math.max(1, REPORT_TYPES.length)).toFixed(0), []);` |
| `avgDataCov` | `useMemo(() => (REPORT_TYPES.reduce((a, r) => a + r.dataCoverage, 0) / Math.max(1, REPORT_TYPES.length)).toFixed(0), []);` |
| `total` | `MONTHLY_STATS.reduce((a, m) => a + m.reports, 0);` |
| `errors` | `MONTHLY_STATS.reduce((a, m) => a + m.errors, 0);` |
| `reportsPerMonth` | `useMemo(() => (totalReportsYTD / Math.max(1, MONTHLY_STATS.length)).toFixed(0), [totalReportsYTD]);` |
| `fwCovered` | `useMemo(() => new Set(REPORT_TYPES.map(r => r.framework)).size, []);` |
| `formatsSupported` | `useMemo(() => new Set(REPORT_TYPES.map(r => r.format)).size, []);` |
| `revenueEst` | `useMemo(() => fmtM(totalAUM * 0.0002), [totalAUM]); // 2bps` |
| `clientAumData` | `useMemo(() => CLIENTS.map(c => ({ name: c.name.split(' ').slice(0, 2).join(' '), aum: c.aum / 1e9 })), []);` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/pe/reporting/lp-report` | `generate_lp_report` | api/v1/routes/pe_reporting.py |
| POST | `/api/v1/pe/reporting/fund-impact` | `assess_fund_impact` | api/v1/routes/pe_reporting.py |
| POST | `/api/v1/pe/reporting/irr-sensitivity` | `irr_sensitivity` | api/v1/routes/pe_reporting.py |
| POST | `/api/v1/pe/reporting/compute-irr` | `compute_irr` | api/v1/routes/pe_reporting.py |
| GET | `/api/v1/pe/reporting/pai-indicators` | `get_pai_indicators` | api/v1/routes/pe_reporting.py |
| GET | `/api/v1/pe/reporting/sdg-definitions` | `get_sdg_definitions` | api/v1/routes/pe_reporting.py |
| GET | `/api/v1/pe/reporting/impact-dimensions` | `get_impact_dimensions` | api/v1/routes/pe_reporting.py |

### 2.3 Engine `pe_impact_framework` (services/pe_impact_framework.py)
| Function | Args | Purpose |
|---|---|---|
| `PEImpactFramework.assess_company_impact` | company | Assess impact for a single portfolio company. |
| `PEImpactFramework.assess_fund_impact` | inp | Assess impact across the entire fund. |
| `PEImpactFramework.get_sdg_definitions` |  | Return SDG reference data. |
| `PEImpactFramework.get_impact_dimensions` |  | Return IMP impact dimensions. |

### 2.3 Engine `pe_irr_sensitivity` (services/pe_irr_sensitivity.py)
| Function | Args | Purpose |
|---|---|---|
| `PEIRRSensitivityEngine.analyse` | inp | Run complete IRR sensitivity analysis. |
| `PEIRRSensitivityEngine.compute_irr` | cashflows | Compute IRR from a series of cashflows using Newton's method. |
| `PEIRRSensitivityEngine._compute_scenario` | name, equity, entry_ebitda, growth_pct, exit_mult, debt | Compute IRR and MOIC for a single scenario. |
| `PEIRRSensitivityEngine._esg_impact` | equity, entry_ebitda, growth_pct, base_exit_mult, debt, years | Compute ESG impact on IRR/MOIC. |
| `PEIRRSensitivityEngine._build_sensitivity_table` | equity, entry_ebitda, base_growth, base_exit_mult, debt, years | Build exit multiple x EBITDA growth sensitivity grid. |

### 2.3 Engine `pe_reporting_engine` (services/pe_reporting_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `PEReportingEngine.generate_lp_report` | inp | Generate a complete LP report. |
| `PEReportingEngine.get_pai_indicators` |  | Return SFDR PAI indicator reference data. |
| `PEReportingEngine._compute_fund_metrics` | perf | Compute TVPI, DPI, RVPI, and estimated IRR. |
| `PEReportingEngine._generate_esg_annex` | inp | Generate SFDR Art.11 periodic ESG annex. |
| `PEReportingEngine._generate_executive_summary` | perf, metrics, companies, period | Generate executive summary paragraph. |
| `PEReportingEngine._generate_sections` | perf, metrics, portfolio_summary, esg_annex, report_type | Generate report sections. |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `explicit`, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ACTION_ITEMS`, `CLIENTS`, `COLORS`, `FRAMEWORKS_LIST`, `MODULES`, `MONTHLY_STATS`, `REG_SUBMISSIONS`, `REPORT_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Frameworks Active | — | Platform config | Number of regulatory frameworks with at least one active report in period. |
| Reports Submitted | — | Report log | Total disclosure submissions across all frameworks in rolling 12-month window. |
| Coverage Score | — | Calculated | Percentage of mandatory disclosure items completed across all active frameworks. |
- **Framework configs, entity hierarchy, reporting calendar** → Completeness scoring, cross-framework deduplication, version control → **Formatted disclosure packages, submission receipts, audit log**

## 5 · Intermediate Transformation Logic
**Methodology:** Disclosure Coverage Score
**Headline formula:** `Completed Disclosures ÷ Required Disclosures × 100`
**Standards:** ['GRI 2', 'TCFD', 'CSRD Art.19a']

**Engine `pe_impact_framework` — extracted transformation lines:**
```python
composite = round(sum(dim_scores.values()) / len(dim_scores), 2)
all_sdgs = company.primary_sdgs + company.secondary_sdgs
social_value = company.beneficiaries_reached * 100 + company.co2_avoided_tonnes * 50
imm = round(social_value / company.invested_eur, 4)
```

**Engine `pe_irr_sensitivity` — extracted transformation lines:**
```python
npv = sum(a / (1 + rate) ** (p / 4) for p, a in amounts)
dnpv = sum(-p / 4 * a / (1 + rate) ** (p / 4 + 1) for p, a in amounts)
new_rate = rate - npv / dnpv
exit_ebitda = entry_ebitda * (1 + growth_pct / 100) ** years
exit_ev = exit_ebitda * exit_mult
equity_value = exit_ev - debt
moic = round(equity_value / equity, 2) if equity > 0 else 0
irr = round((moic ** (1 / years) - 1) * 100, 1) if moic > 0 and years > 0 else 0
expansion = round(esg_improvement * ESG_BPS_PER_POINT / 10000, 4)
premium_pct = round(esg_improvement * ESG_BPS_PER_POINT / 100, 2)
deficit = (50 - esg_score) / 10
risk_discount = round(deficit * ESG_RISK_BPS_PER_10 / 100, 2)
adj_exit_mult = base_exit_mult + expansion
delta_bps = round((adj.irr_pct - base.irr_pct) * 100)
```

**Engine `pe_reporting_engine` — extracted transformation lines:**
```python
dpi = round(perf.distributed_capital_eur / called, 2)
rvpi = round(perf.nav_eur / called, 2)
tvpi = round(dpi + rvpi, 2)
called_pct = round(called / perf.committed_capital_eur * 100, 1) if perf.committed_capital_eur > 0 else 0
dry_powder = perf.committed_capital_eur - called
fund_age = max(1, 2026 - perf.vintage_year)
gross_irr = round((tvpi ** (1 / fund_age) - 1) * 100, 1) if tvpi > 0 else 0
net_irr = round(gross_irr * 0.80, 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).