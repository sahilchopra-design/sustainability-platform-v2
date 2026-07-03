# AI-Driven Live Climate Data Platform
**Module ID:** `ai-data-live-platform` · **Route:** `/ai-data-live-platform` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Real-time climate data ingestion platform integrating satellite imagery, IoT sensor streams, and regulatory filing feeds with AI-powered anomaly detection, automated PCAF DQ tier scoring, data lineage tracking, API endpoint management, and data freshness monitoring for enterprise-grade climate intelligence.

> **Business value:** Used by data engineering teams, ESG data managers, and chief sustainability officers to ensure climate data reliability, completeness, and audit-readiness for TCFD, SFDR, and CSRD disclosures.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ARTICLE_TITLES`, `COMPANIES_SEC`, `CORR_MATRIX`, `CORR_SOURCES`, `DAILY_NEWS`, `ENTITY_COMPANIES`, `ENTITY_SECTORS`, `ENTITY_TOPICS`, `EVENT_TYPES`, `EVENT_WINDOW_DATA`, `FACTOR_NAMES`, `FORM_TYPES`, `GDELT_URL`, `HAWKES_PARAMS`, `IC_CURVES`, `IC_DAYS`, `KpiBox`, `LiveBadge`, `NLP_MODELS`, `OPENALEX_URL`, `PAPER_TITLES`, `PILLAR_COLORS`, `REGION_COUNTRIES`, `ROLLING_CORR`, `SAMPLE_TOKENS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `GDELT_URL` | `'https://api.gdeltproject.org/api/v2/doc/doc?query=ESG+climate&mode=artlist&maxrecords=25&format=json';` |
| `SEC_URL` | `'https://efts.sec.gov/LATEST/search-index?q=%22climate+disclosure%22&dateRange=custom&startdt=2024-01-01&forms=10-K';` |
| `OPENALEX_URL` | `'https://api.openalex.org/works?search=ESG+sentiment+analysis&filter=open_access.is_oa:true&sort=cited_by_count:desc&per_page=20';` |
| `WORLDBANK_URL` | `'https://api.worldbank.org/v2/country/all/indicator/EN.ATM.CO2E.PC?format=json&mrv=1&per_page=50';` |
| `SEED_GDELT` | `ARTICLE_TITLES.map((title, i) => ({` |
| `FORM_TYPES` | `['10-K','10-K','10-K','8-K','DEF 14A'];` |
| `SEED_FILINGS` | `COMPANIES_SEC.map((company, i) => ({` |
| `SEED_PAPERS` | `PAPER_TITLES.map((title, i) => ({` |
| `SEED_COUNTRIES` | `REGION_COUNTRIES.map(c => ({ ...c, co2PerCapita: +c.co2PerCapita.toFixed(2) }));` |
| `SEED_ENTITIES` | `ENTITY_COMPANIES.map((name, i) => ({` |
| `SEED_EVENTS` | `EVENT_TYPES.map((type, i) => ({` |
| `avgCar` | `(sr(i * 53 + 16) - 0.52) * 2.5;` |
| `buildCorrMatrix` | `() => CORR_SOURCES.map((r, i) =>` |
| `raw` | `sr(i * 61 + j * 17 + 18) * 1.6 - 0.8;` |
| `IC_CURVES` | `FACTOR_NAMES.map((name, fi) => ({` |
| `eKw` | `['climate','carbon','emissions','renewable','biodiversity','net-zero','water','methane'];` |
| `avgTone` | `articles.length ? articles.reduce((s, a) => s + +a.tone, 0) / articles.length : 0;` |
| `posPct` | `articles.length ? articles.filter(a => +a.tone > 0).length / articles.length * 100 : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ARTICLE_TITLES`, `COMPANIES_SEC`, `CORR_SOURCES`, `ENTITY_COMPANIES`, `ENTITY_SECTORS`, `ENTITY_TOPICS`, `EVENT_TYPES`, `FACTOR_NAMES`, `FORM_TYPES`, `HAWKES_PARAMS`, `IC_DAYS`, `NLP_MODELS`, `PAPER_TITLES`, `REGION_COUNTRIES`, `SAMPLE_TOKENS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Data Freshness Index | `(1 - days_since_update / max_acceptable_age) × 100` | Ingestion timestamp log | Score <60 triggers stale data warning; critical for real-time physical risk monitoring and daily portfolio car |
| PCAF DQ Score (portfolio-weighted) | `Σ(w_i × DQ_tier_i)` | PCAF Data Quality Framework | Lower scores are better (1=best); PCAF target for financed emissions is weighted avg DQ ≤ 3 for credible discl |
| Anomaly Detection Rate | `flagged_anomalies / total_datapoints × 100` | Isolation forest anomaly model | Rates >5% suggest systematic data quality issues; each flagged anomaly is routed for human review before inclu |
- **Satellite feeds + IoT sensors + regulatory filing APIs → raw ingestion layer** → Anomaly detection → DQ tier scoring → lineage DAG construction → **Clean, tagged, and auditable climate data with quality scores for regulatory disclosure**

## 5 · Intermediate Transformation Logic
**Methodology:** Automated Data Quality & Lineage Management
**Headline formula:** `DQ_tier = f(source_type, verification_level, recency, coverage_completeness)`
**Standards:** ['PCAF Data Quality Framework (2022)', 'SASB Data Standards', 'ISO 8000 Data Quality Standards']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).