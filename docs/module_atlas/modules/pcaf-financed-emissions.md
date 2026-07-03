# PCAF Financed Emissions
**Module ID:** `pcaf-financed-emissions` · **Route:** `/pcaf-financed-emissions` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Full PCAF Standard implementation for 5 asset classes: listed equity, corporate bonds, project finance, commercial real estate, mortgages. Computes financed emissions with PCAF data quality score 1-5.

> **Business value:** The PCAF Standard is the mandatory framework for financial institutions disclosing Scope 3 Category 15 financed emissions. Required for TCFD, ISSB S2, CSRD, and net-zero alliance reporting. Enables target-setting for portfolio decarbonisation.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AC_COLORS`, `ALL_ASSET_CLASSES`, `ASSET_CLASS_DEFS`, `AddPositionModal`, `AuditTrailTab`, `BASE_POSITIONS`, `Badge`, `COUNTRY_EMISSIONS`, `COUNTRY_PPP_GDP`, `Card`, `DOWNSTREAM_MODULES`, `DQS_COLOR`, `DQS_DEFINITIONS`, `DQS_IMPROVEMENT_STEPS`, `DataQualityTab`, `DownstreamTab`, `FACILITATED_DEALS`, `FormulaEngineTab`, `INITIAL_POSITIONS`, `INSURANCE_LOB`, `InfoBox`, `KPICard`, `PCAF_FORMULAS`, `PIE_COLORS`, `PartATab`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `_CDP_PCAF` | `Object.fromEntries((CDP_COMPANY_EMISSIONS\|\|[]).map(c=>[c.name?.toLowerCase(),c]));` |
| `_CDP_TICKER_PCAF` | `Object.fromEntries((CDP_COMPANY_EMISSIONS\|\|[]).map(c=>[c.ticker?.toLowerCase(),c]));` |
| `_INDIA_PCAF` | `isIndiaMode() ? adaptForPCAF().slice(0, 30).map((c, i) => ({` |
| `tpc` | `p.projectCost\|\|p.outstanding*2.5;` |
| `tbs` | `p.totalBondSize\|\|p.outstanding*10;` |
| `totalEmissions` | `(p.scope1\|\|0)+(p.scope2\|\|0);` |
| `totalWithScope3` | `totalEmissions+(p.scope3\|\|0);` |
| `financedEmissions` | `+(attrFactor*totalEmissions).toFixed(0);` |
| `financedScope3` | `+(attrFactor*(p.scope3\|\|0)).toFixed(0);` |
| `adjustedDqs` | `evicWarning?Math.max(p.dqs,4):p.dqs;` |
| `revenueM` | `p.evic ? p.evic * revMultiple : (SECTOR_MEDIAN_EVIC[p.sector] \|\| 50) * revMultiple;` |
| `waci` | `revenueM>0?(totalEmissions/revenueM):0;` |
| `carbonIntensity` | `p.outstanding>0?financedEmissions/p.outstanding:0;` |
| `scope1Pct` | `totalEmissions>0?(p.scope1\|\|0)/totalEmissions:0;` |
| `scope2Pct` | `totalEmissions>0?(p.scope2\|\|0)/totalEmissions:0;` |
| `INITIAL_POSITIONS` | `BASE_POSITIONS.map(computeRow);` |
| `showProjectCost` | `['Project Finance','Use-of-Proceeds'].includes(form.assetClass);` |
| `totalFE` | `useMemo(()=>positions.reduce((s,p)=>s+p.financedEmissions,0),[positions]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_ASSET_CLASSES`, `ASSET_CLASS_DEFS`, `BASE_POSITIONS`, `DOWNSTREAM_MODULES`, `FACILITATED_DEALS`, `INSURANCE_LOB`, `PCAF_FORMULAS`, `PIE_COLORS`, `TABS`, `YOY_DATA`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Financed Emissions | `Σ(AF_i × Emissions_i)` | PCAF Standard | Total attributed GHG across all asset classes |
| WACI | `Σ(w_i × Emissions_i/Revenue_i)` | PCAF | Weighted average carbon intensity benchmark |
| Data Quality | `Weighted average DQ score` | PCAF DQ scale | 1=best quality audited data, 5=sector proxy |
- **Portfolio holdings data** → EVIC/loan value calculation → **Attribution factors**
- **Company emissions (CDP/reports)** → DQ scoring → **Financed emissions per asset**
- **Aggregated financed emissions** → WACI calculation → **Portfolio carbon footprint**

## 5 · Intermediate Transformation Logic
**Methodology:** PCAF attribution methodology
**Headline formula:** `FE = Σ(AF_i × Emissions_i); AF_equity = Investment / EVIC`
**Standards:** ['PCAF Global GHG Standard v3 (2022)', 'GHG Protocol Scope 3 Cat 15']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).