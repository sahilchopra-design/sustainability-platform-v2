# SBTi Climate Trace
**Module ID:** `sbti-climate-trace` · **Route:** `/sbti-climate-trace` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integration of Climate TRACE independent emissions inventory data with SBTi target-setting and validation workflows for corporate emissions accountability.

> **Business value:** Uses independent satellite-based emissions data to stress-test corporate SBTi claims and flag credibility gaps.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CT_SECTORS`, `PATHWAY_DATA`, `PATH_YEARS`, `SBTI_COMPANIES`, `SBTI_METHODS`, `SBTI_STATUS`, `SECTORS_SBTI`, `SECTOR_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SECTORS_SBTI` | `['Power','Steel','Cement','Chemicals','Transport','Buildings','Agri-Food','Financial','ICT','Retail'];` |
| `SBTI_METHODS` | `['Absolute Contraction','Sectoral Decarbonisation','Paris Agreement Capital Transition','1.5°C Absolute','Well-below 2°C Absolute'];` |
| `baseYear` | `2015 + Math.floor(sr(i) * 5);` |
| `targetYear` | `2030 + Math.floor(sr(i + 50) * 20);` |
| `scope1Base` | `500 + sr(i * 3) * 9500;` |
| `scope12Base` | `scope1Base * (1.2 + sr(i * 3 + 1) * 0.8);` |
| `reductionPct` | `30 + sr(i * 3 + 2) * 55;` |
| `nearTermPct` | `reductionPct * (0.4 + sr(i * 4) * 0.3);` |
| `PATHWAY_DATA` | `PATH_YEARS.map((yr, yi) => {` |
| `sbtiPath` | `startEmit * Math.max(0.05, 1 - (yr - 2020) / 30 * (0.6 + sr(si * 10) * 0.35));` |
| `sectorBreakdown` | `useMemo(() => SECTORS_SBTI.map(s => ({` |
| `totalCt` | `CT_SECTORS.reduce((s, r) => s + r.emissions_Mt, 0);` |
| `end` | `PATHWAY_DATA[PATHWAY_DATA.length - 1][s];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CT_SECTORS`, `PATH_YEARS`, `SBTI_METHODS`, `SBTI_STATUS`, `SECTORS_SBTI`, `SECTOR_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Companies Matched | — | Climate TRACE DB | Portfolio companies with Climate TRACE asset-level emissions estimates available. |
| Avg Verification Gap | — | Calculated | Mean absolute divergence between Climate TRACE estimates and company Scope 1+2 disclosures. |
| SBTi Targets Validated | — | SBTi dashboard | Share of matched companies with SBTi-approved near-term or net-zero targets. |
- **Climate TRACE API, SBTi company tracker, portfolio holdings** → Entity matching, divergence calculation, target status overlay → **Verification gap reports, SBTi alignment dashboard, escalation flags**

## 5 · Intermediate Transformation Logic
**Methodology:** Emissions Verification Gap
**Headline formula:** `|Climate TRACE Estimate – Company Reported| ÷ Company Reported × 100`
**Standards:** ['Climate TRACE v4', 'SBTi Corporate Manual']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).