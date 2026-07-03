# PCAF India BRSR
**Module ID:** `pcaf-india-brsr` · **Route:** `/pcaf-india-brsr` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Applies PCAF GHG accounting methodology to India Business Responsibility and Sustainability Reporting requirements, enabling Indian financial institutions to compute and disclose financed emissions in BRSR format.

> **Business value:** Enables Indian banks, asset managers, and insurance companies to compute and report financed emissions in full compliance with SEBI BRSR Core requirements using PCAF-aligned GHG accounting methodology.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Alert`, `Btn`, `CHART_COLORS`, `COMPANY_SUGGESTIONS`, `Card`, `CompanyAutocomplete`, `DEAL_CATEGORIES`, `DEAL_TEMPLATE`, `DEAL_TYPE_FIELDS`, `DEFAULT_FACILITATED_DEALS`, `DEFAULT_HOLDINGS`, `DEFAULT_INSURANCE_POLICIES`, `DQS_COLORS`, `DQS_LABELS`, `DqsBadge`, `INSTRUMENT_FIELDS`, `INSTRUMENT_OPTIONS`, `Inp`, `KpiCard`, `LOB_CATEGORIES`, `LOB_FIELDS`, `POLICY_TEMPLATE`, `SECTOR_OPTIONS`, `Sel`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8000';` |
| `DQS_LABELS` | `{ 1:'Verified GHG data', 2:'Audited data', 3:'Reported data', 4:'Sector-level proxy', 5:'Least granular' };` |
| `skipSyncRef` | `useRef(false); // prevents useEffect overwriting after selection` |
| `resultHoldings` | `holdings.map(h => {` |
| `financed` | `af * (s1 + s2);` |
| `dqs` | `h.dqs_override ? parseInt(h.dqs_override) : (s1 + s2 > 0 ? 3 : 4);` |
| `waci` | `rev > 0 ? (financed / rev) : 0;` |
| `totalFinanced` | `resultHoldings.reduce((s, h) => s + h.financed_co2e_tonne, 0);` |
| `totalExp` | `resultHoldings.reduce((s, h) => s + h.exposure_inr_cr, 0);` |
| `totalRev` | `holdings.reduce((s, h) => s + (parseFloat(h.revenue_inr_cr) \|\| 0), 0);` |
| `waciPortfolio` | `totalRev > 0 ? totalFinanced / totalRev : 0;` |
| `demoResults` | `insurancePolicies.map(p => {` |
| `toMusd` | `v => v ? parseFloat(v) * 0.12 : undefined;` |
| `demoDeals` | `facilitatedDeals.map(d => {` |
| `match` | `COMPANY_SUGGESTIONS.find(c => c.cin === cin \|\| cin.includes(c.cin.slice(-6)));` |
| `perAssetChart` | `portfolioResult?.holdings?.map(h => ({` |
| `scopeBreakdownChart` | `portfolioResult?.holdings?.map(h => ({` |
| `insuranceChart` | `insuranceResult?.results?.map(r => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHART_COLORS`, `COMPANY_SUGGESTIONS`, `DEFAULT_FACILITATED_DEALS`, `DEFAULT_HOLDINGS`, `DEFAULT_INSURANCE_POLICIES`, `INSTRUMENT_OPTIONS`, `SECTOR_OPTIONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| BRSR Core KPIs | — | SEBI BRSR Core 2023 | SEBI mandated nine ESG attributes in BRSR Core including greenhouse gas intensity, water intensity, and supply |
| BRSR Mandatory Scope | — | SEBI Circular 2021 | Indian companies required to submit BRSR under SEBI mandate covering BSE/NSE top 1,000 by market capitalisatio |
- **SEBI BRSR filings, NSE/BSE company master data, PCAF emissions proxies, MCA financial data** → Entity matching, EVIC computation, financed emissions aggregation, BRSR format mapping → **BRSR Core disclosure tables, financed emissions by sector, PCAF data quality scores**

## 5 · Intermediate Transformation Logic
**Methodology:** BRSR Financed Emissions
**Headline formula:** `FEᵢ = AFᵢ × CompanyEmissionsᵢ`
**Standards:** ['PCAF Standard v2 2022', 'SEBI BRSR Core Framework 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).