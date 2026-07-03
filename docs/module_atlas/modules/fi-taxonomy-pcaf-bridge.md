# FI EU Taxonomy–PCAF Bridge Analytics
**Module ID:** `fi-taxonomy-pcaf-bridge` · **Route:** `/fi-taxonomy-pcaf-bridge` · **Tier:** B (frontend-computed) · **EP code:** EP-DW2 · **Sprint:** DW

## 1 · Overview
Analytics bridging EU Taxonomy alignment and PCAF financed emissions covering GAR/BTAR calculation, green asset ratio uplift pathways, financed emissions by taxonomy objective and EBA Pillar 3 ESG disclosure integration.

> **Business value:** The EU Taxonomy–PCAF bridge quantifies GAR and BTAR under EBA Pillar 3 ITS while linking taxonomy-aligned assets to PCAF financed emissions by objective, enabling institutions to demonstrate both regulatory compliance and real-economy decarbonisation impact.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_CLASSES`, `CLIMATE_PD_UPLIFT`, `CRE_ASSETS`, `CSRD_DATAPOINTS`, `DQS_DETAILS`, `DqsPill`, `IFRS_STAGE_RULES`, `INSURANCE_LOB`, `KPI_TEMPLATES`, `Kpi`, `LOAN_BOOK`, `MORTGAGE_POOL`, `NACE_MAP`, `NGFS_SCENARIOS_PD`, `PIE_COLORS`, `RISK_APPETITE_THRESHOLDS`, `SCR_IMPACT`, `SECTORS`, `SECTOR_PD_MULT`, `SOLVENCY_II_FACTORS`, `StatusPill`, `TAX_STATUS`, `WATERFALL_STAGES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n,d=1) => n==null?'--':Number(n).toFixed(d);` |
| `fmtPct` | `(n)=>n==null?'--':Number(n).toFixed(1)+'%';` |
| `fmtMn` | `(n)=>n==null?'--':'$'+Number(n).toFixed(0)+'M';` |
| `fmtBn` | `(n)=>n==null?'--':'$'+Number(n).toFixed(1)+'Bn';` |
| `TAX_STATUS` | `['Aligned','Eligible','Non-Eligible','Excluded'];` |
| `ead` | `50 + sr(i*3+1)*950;` |
| `dqs` | `1 + Math.floor(sr(i*19+6)*5);` |
| `lgd` | `0.25 + sr(i*29+8)*0.45;` |
| `intensity` | `40 + sr(i*31+9)*180;` |
| `epc` | `['A','B','C','D','E','F','G'][Math.floor(sr(i*3+1)*7)];` |
| `bal` | `10 + sr(i*5+2)*90;` |
| `ltv` | `45 + sr(i*7+3)*45;` |
| `epc` | `['A','B','C','D','E','F'][Math.floor(sr(i*3+1)*6)];` |
| `gav` | `20 + sr(i*5+2)*180;` |
| `loan` | `gav * (0.5 + sr(i*7+3)*0.3);` |
| `e50` | `Math.exp(-50);` |
| `mAdj` | `(1 + (M - 2.5) * b) / (1 - 1.5 * b);` |
| `cond` | `nCdf((ndInv(PD) + Math.sqrt(R) * ndInv(0.999)) / Math.sqrt(Math.max(1e-9, 1 - R)));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_CLASSES`, `CSRD_DATAPOINTS`, `DQS_DETAILS`, `IFRS_STAGE_RULES`, `INSURANCE_LOB`, `KPI_TEMPLATES`, `NACE_MAP`, `NGFS_SCENARIOS_PD`, `PIE_COLORS`, `RISK_APPETITE_THRESHOLDS`, `SCR_IMPACT`, `SECTORS`, `TAX_STATUS`, `WATERFALL_STAGES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Green Asset Ratio (GAR) | `GAR = TA Exposures / Eligible Exposures × 100` | EBA Pillar 3 ITS 2022 | Mandatory disclosure metric for EU credit institutions from 2024; basis for green lending targets. |
| BTAR | `BTAR = TA Assets (incl. sovereign) / Total Assets` | EBA Opinion on Taxonomy Reporting 2023 | Broader coverage than GAR; includes sovereign bonds and SME exposures using estimation. |
| Financed Emissions by Taxonomy Objective | `FE = Attribution Factor × Company Scope 1+2+3 Emissions` | PCAF Standard × Taxonomy Mapping | Linking taxonomy objective to emissions reduction impact per € of aligned financing. |
- **EU Taxonomy activity database + EBA Pillar 3 templates** → GAR/BTAR computation → PCAF DQ overlay → **FI Taxonomy-PCAF bridge analytics dashboard**

## 5 · Intermediate Transformation Logic
**Methodology:** Green Asset Ratio
**Headline formula:** `GAR = Taxonomy-Aligned Exposures / Total Eligible Exposures × 100`
**Standards:** ['EBA — ITS on Pillar 3 ESG Disclosures', 'ECB — Guide on Climate-related and Environmental Risks']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).