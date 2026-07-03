# XBRL Ingestion
**Module ID:** `xbrl-ingestion` · **Route:** `/xbrl-ingestion` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Automated ingestion and parsing of XBRL sustainability filings; extracts structured ESG data from iXBRL reports submitted under CSRD, SEC and other regulatory regimes for analytics and benchmarking.

> **Business value:** CSRD will generate 50,000+ machine-readable iXBRL sustainability reports annually from 2025; automated ingestion infrastructure is prerequisite for ESG data providers, benchmark administrators and supervisory data collection.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DataWarehouse`, `FACT_CONCEPTS`, `FILINGS`, `FORMATS`, `FactMapping`, `FilingImport`, `INGEST_TREND`, `REGISTRANTS`, `TABS`, `TAXONOMIES`, `VALIDATION_RULES`, `ValidationPipeline`, `WAREHOUSE_TABLES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pick` | `(arr, s) => arr[Math.floor(sr(s) * arr.length)];` |
| `FORMATS` | `["iXBRL","XBRL Instance","Inline XBRL (HTML)","JSON-LD","CSV Taxonomy"];` |
| `facts` | `Math.round(120 + sr(i * 7) * 1880);` |
| `errors` | `Math.round(sr(i * 11) * 8);` |
| `warnings` | `Math.round(1 + sr(i * 13) * 12);` |
| `statusDist` | `["Clean","Warnings","Errors"].map(s => ({` |
| `taxDist` | `TAXONOMIES.map(t => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FACT_CONCEPTS`, `FORMATS`, `REGISTRANTS`, `TABS`, `TAXONOMIES`, `VALIDATION_RULES`, `WAREHOUSE_TABLES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Reports Ingested (YTD) | — | Ingestion Engine | Total iXBRL sustainability reports ingested and parsed in current reporting year. |
| Parse Rate | — | Ingestion Engine | Successful element extraction rate across all ingested filings; failures typically from non-standard taxonomy  |
| Data Points Extracted | — | Database | Total structured ESG data points extracted from ingested XBRL filings available for analytics and benchmarking |
- **ESMA/EDGAR XBRL Filing Feeds, ESRS XBRL Taxonomy** → iXBRL parsing engine + taxonomy mapping + structured data extraction → **ESG data lake, benchmarking analytics, peer comparison dashboards, regulatory data quality reports**

## 5 · Intermediate Transformation Logic
**Methodology:** Ingestion Parse Rate
**Headline formula:** `IPR = Successfully Parsed Elements / Total Elements × 100`
**Standards:** ['ESRS XBRL Taxonomy 2024', 'XBRL International Specification']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).