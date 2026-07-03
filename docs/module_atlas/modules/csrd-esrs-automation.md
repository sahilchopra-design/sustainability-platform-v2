# CSRD ESRS Automation
**Module ID:** `csrd-esrs-automation` · **Route:** `/csrd-esrs-automation` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Automates CSRD data collection, validation, and ESRS disclosure generation across all 12 ESRS topical standards, using AI-assisted data extraction, cross-datapoint consistency checks, and XBRL tagging. Integrates with internal systems to minimise manual data entry and accelerate reporting cycles.

> **Business value:** Enables sustainability reporting teams to dramatically reduce manual data collection effort for CSRD, ensure ESRS cross-consistency, and produce audit-ready digital iXBRL filings that meet CSRD’s mandatory digital reporting requirements.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `ASSURANCE_EVIDENCE`, `CSRD_COMPANIES`, `DATAPOINT_INVENTORY`, `DMA_TOPICS`, `ESRS_STANDARDS`, `KPI`, `PAGE_SIZE`, `PIECLRS`, `READINESS_LEVELS`, `SECTORS`, `SectionHead`, `TABS`, `TOTAL_DATAPOINTS`, `TREND`, `XBRL_TAXONOMY`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `pct` | `v=>(v*100).toFixed(1)+'%';` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))]` |
| `TOTAL_DATAPOINTS` | `ESRS_STANDARDS.reduce((s,e)=>s+e.dataPoints,0); // 643` |
| `overallReadiness` | `Math.round(10+sr(base)*85);` |
| `gapCount` | `Math.round(sr(base+97)*45);` |
| `dataPointsCovered` | `Math.round(TOTAL_DATAPOINTS*(overallReadiness/100)*0.95+sr(base+101)*20);` |
| `automationRate` | `Math.round(10+sr(base+103)*80);` |
| `assuranceReady` | `Math.round(5+sr(base+107)*90);` |
| `taxonomyAlignment` | `Math.round(sr(base+109)*65);` |
| `doubleMateriality` | `Math.round(10+sr(base+113)*85);` |
| `dmaScores` | `DMA_TOPICS.map((t,ti)=>{` |
| `impactScore` | `+(1+sr(base+ti*31)*4).toFixed(1);` |
| `financialScore` | `+(1+sr(base+ti*37)*4).toFixed(1);` |
| `_india` | `adaptForPCAF().slice(0, 80).map((c, i) => {` |
| `overallReadiness` | `Math.round(10 + sr(base) * 85);` |
| `scores` | `{}; ESRS_STANDARDS.forEach((std, j) => { scores[std.id] = Math.round(8 + sr(base + j * 17) * 87); });` |
| `sources` | `['HR System','ERP/Finance','GHG Accounting','Environmental Management','Procurement','Legal/Compliance','Board Secretariat','External Provider','Manua` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DMA_TOPICS`, `ESRS_STANDARDS`, `PIECLRS`, `READINESS_LEVELS`, `SECTORS`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESRS Data Points (mandatory) | — | ESRS Set 1 | Number of mandatory disclosure data points across ESRS 2 and mandatory elements of topical standards |
| DMA Material Topics | — | ESRS 1 DMA process | Topics assessed as material under impact or financial materiality, driving topical ESRS disclosure |
| Data Collection Automation Rate | — | Platform connectivity | Proportion of required data points auto-populated from connected internal systems |
| XBRL Tag Coverage | — | ESRS XBRL Taxonomy | Quantitative data points with valid ESRS XBRL taxonomy tags for digital filing |
| Cross-Consistency Errors | — | Internal validation | Number of inconsistencies detected between same metric appearing in multiple ESRS locations |
- **Internal ERP/HR/energy management systems** → API integration or template upload to extract activity data → **Raw data input per ESRS data point**
- **ESRS requirement mapping engine** → Gate by DMA materiality, assign quality weights to each datapoint → **Data coverage score and gap register**
- **EFRAG ESRS XBRL taxonomy** → Tag quantitative disclosures, validate against taxonomy schema → **iXBRL digital filing package**

## 5 · Intermediate Transformation Logic
**Methodology:** ESRS Data Coverage Score
**Headline formula:** `Coverage = Σ(Datapoints_collected × Quality_weight) / Σ(Datapoints_required)`
**Standards:** ['CSRD Delegated Regulation (EU) 2023/2772', 'EFRAG ESRS Set 1 Guidance', 'ESRS XBRL Taxonomy 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).