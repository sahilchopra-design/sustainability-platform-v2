# Advanced Report Studio
**Module ID:** `advanced-report-studio` · **Route:** `/advanced-report-studio` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Drag-and-drop sustainability report builder supporting multi-framework simultaneous export across GRI, TCFD, CSRD ESRS, ISSB S1/S2, and SFDR. Provides a pre-built template library, module-level content blocks, and version-controlled disclosure management. Enables compliance officers to assemble investor-grade reports without manual data re-entry.

> **Business value:** The Report Studio eliminates the double-entry burden of multi-framework reporting by maintaining a single source of truth mapped to all major standards. Version control and audit trails satisfy ISAE 3000 assurance requirements and reduce external auditor review time by providing traceable data lineage for every reported figure.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DEMO_HOLDINGS`, `FRAMEWORKS`, `GLOSSARY`, `METHODOLOGY_NOTES`, `NGFS_SCENARIOS`, `SECTOR_COLORS`, `YOY_DATA`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtN` | `(n, d = 1) => (typeof n === 'number' && isFinite(n)) ? n.toFixed(d) : 'N/A';` |
| `fmtN` | `(n, d = 1) => (typeof n === 'number' && isFinite(n)) ? n.toFixed(d) : 'N/A';` |
| `totalExp` | `holdings.reduce((s, h) => s + (h.exposure_usd_mn \|\| 0), 0);` |
| `sbtiPct` | `(sbtiCount / (holdings.length \|\| 1)) * 100;` |
| `dataCoverage` | `(dataCount / (holdings.length \|\| 1)) * 100;` |
| `totalExp` | `holdings.reduce((s, h) => s + (h.exposure_usd_mn \|\| 0), 0) \|\| 1;` |
| `totalWeight` | `holdings.reduce((s, h) => s + (h.weight \|\| 0), 0) \|\| 100;` |
| `totalWeightedRev` | `holdings.reduce((s, h) => s + (h.weight / totalWeight) * (h.company?.revenue_usd_mn \|\| 0), 0);` |
| `carbonEfficiency` | `totalS12 > 0 ? (totalWeightedRev / (totalS12 * 1000)) : 0;` |
| `TRANSITION_SHOCKS` | `{ Energy: -0.35, Materials: -0.22, Utilities: -0.28, Industrials: -0.15, Financials: -0.08, IT: 0.12, 'Health Care': 0.05, 'Consumer Discretionary': -` |
| `PHYSICAL_SHOCKS` | `{ Energy: -0.08, Materials: -0.12, Utilities: -0.06, Industrials: -0.05, Financials: -0.10, IT: -0.02, 'Health Care': -0.04, 'Consumer Discretionary':` |
| `combinedCVaR` | `z * Math.sqrt(transVar * transVar + physVar * physVar + 2 * rho * transVar * physVar);` |
| `cvarPct` | `totalExp > 0 ? (combinedCVaR / totalExp) * 100 : 0;` |
| `yearsTo2030` | `Math.max(1, 2030 - new Date().getFullYear());` |
| `requiredAnnualDecline` | `waci > 0 ? (1 - Math.pow(targetWaci2030 / waci, 1 / yearsTo2030)) * 100 : 0;` |
| `carbonBudgetOvershoot` | `waci > budgetAlignedWaci ? ((waci - budgetAlignedWaci) / budgetAlignedWaci) * 100 : 0;` |
| `sbtiScore` | `(sbtiCount / n) * 40;` |
| `nzScore` | `(nzBefore2050 / n) * 30;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/pcaf/advanced/securities` | `assess_securities` | api/v1/routes/pcaf_advanced.py |
| POST | `/api/v1/pcaf/advanced/fund` | `assess_fund` | api/v1/routes/pcaf_advanced.py |
| POST | `/api/v1/pcaf/advanced/portfolio` | `assess_portfolio` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/indices` | `list_indices` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/indices/{index_key}` | `get_index_profile` | api/v1/routes/pcaf_advanced.py |
| POST | `/api/v1/pcaf/advanced/compare-to-index` | `compare_portfolio_to_index` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/gics-sub-sectors` | `list_gics_sub_sectors` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/sovereign-coverage` | `list_sovereign_coverage` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/nze-pathways` | `list_nze_pathways` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/nace-gics-mapping` | `list_nace_gics_mapping` | api/v1/routes/pcaf_advanced.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `EDGAR` *(shared)*, `MSCI` *(shared)*, `active` *(shared)*, `broad` *(shared)*, `core` *(shared)*, `data` *(shared)*, `datetime` *(shared)*, `energy` *(shared)*, `fastapi` *(shared)*, `instrument_type` *(shared)*, `investee` *(shared)*, `pydantic` *(shared)*, `security` *(shared)*, `typing` *(shared)*, `underlying` *(shared)*
**Frontend seed datasets:** `DEMO_HOLDINGS`, `GLOSSARY`, `LOW_WAGE_SECTORS`, `METHODOLOGY_NOTES`, `NGFS_SCENARIOS`, `SECTOR_COLORS`, `YOY_DATA`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Frameworks Supported | — | Platform | GRI, TCFD, CSRD ESRS, ISSB S1/S2, SFDR PAI, UK TPT |
| Coverage Score | `Disclosed / Required × 100` | Platform audit | Percentage of mandatory disclosure items populated for selected framework |
- **Platform module outputs** → Map data fields to framework disclosure items via cross-walk matrix → **Populated report sections with coverage gap flags**
- **User-uploaded documents** → Parse and attach to relevant disclosure blocks → **Version-controlled report with audit trail**

## 5 · Intermediate Transformation Logic
**Methodology:** Template-driven multi-framework mapping
**Headline formula:** `Coverage_score = Disclosed_disclosures / Required_disclosures × 100`
**Standards:** ['GRI Universal Standards 2021', 'ISSB IFRS S1/S2', 'CSRD ESRS Set 1']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **55** other module(s).

| Connected module | Shared via |
|---|---|
| `advanced-reactor-finance` | table:EDGAR, table:MSCI, table:active, table:broad, table:core, table:data |
| `benchmark-analytics` | table:EDGAR |
| `carbon-aware-allocation` | table:datetime |
| `stranded-assets` | table:datetime |
| `portfolio-optimizer` | table:datetime |
| `carbon-capture-finance` | table:datetime |
| `carbon-credit-audit-trail` | table:datetime |
| `scheduled-reports` | table:datetime |
| `re-portfolio-dashboard` | table:datetime |
| `carbon-wallet` | table:datetime |