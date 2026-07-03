# Fiduciary Climate Risk Analytics
**Module ID:** `fiduciary-climate-risk` · **Route:** `/fiduciary-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-DK2 · **Sprint:** DK

## 1 · Overview
Analyses fiduciary duty obligations of institutional investors regarding climate risk. Covers case law analysis (McVeigh/REST, ClientEarth/Shell, Harvard Endowment), regulatory evolution (DoL ESG rule, PRI fiduciary guidance), and portfolio alignment with long-term beneficiary interests.

> **Business value:** Critical for pension fund trustees, investment managers with fiduciary obligations, and legal counsel advising institutional investors. Rising climate litigation creates material risk of breach of duty claims — proactive portfolio temperature alignment and documented climate process are primary defences.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COUNTRIES`, `INVESTORS`, `KpiCard`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `type` | `TYPES[Math.floor(sr(i * 7) * TYPES.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];` |
| `aum` | `parseFloat((5 + sr(i * 13) * 995).toFixed(1));` |
| `climateRiskIntegration` | `parseFloat((1 + sr(i * 17) * 9).toFixed(1));` |
| `netZeroCommitment` | `sr(i * 19) > 0.4;` |
| `engagementPolicy` | `sr(i * 23) > 0.35;` |
| `exclusionPolicy` | `sr(i * 29) > 0.4;` |
| `proxyVotingClimate` | `parseFloat((20 + sr(i * 31) * 75).toFixed(1));` |
| `climateRiskDisclosure` | `sr(i * 37) > 0.45;` |
| `tcfdAligned` | `sr(i * 41) > 0.5;` |
| `litigationRisk` | `parseFloat((1 + sr(i * 43) * 9).toFixed(1));` |
| `carbonFootprint` | `parseFloat((20 + sr(i * 47) * 280).toFixed(1));` |
| `totalAum` | `filtered.reduce((a, c) => a + c.aum, 0).toFixed(0);` |
| `avgFid` | `(filtered.reduce((a, c) => a + c.fiduciaryScore, 0) / n).toFixed(1);` |
| `pctNZ` | `((filtered.filter(c => c.netZeroCommitment).length / n) * 100).toFixed(0);` |
| `avgProxy` | `(filtered.reduce((a, c) => a + c.proxyVotingClimate, 0) / n).toFixed(1);` |
| `byType` | `TYPES.map(t => {` |
| `byCountry` | `COUNTRIES.map(cn => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate Litigation Cases | — | LSE Grantham/Columbia Sabin Center 2024 | Over 2,300 climate litigation cases globally — growing 30%/yr; fiduciary duty cases targeting fund managers |
| Pension Fund Fiduciary Gap | — | PRI Fiduciary Duty Report 2023 | 60% of pension funds globally not fully integrating material climate risk — potential fiduciary breach |
| Portfolio Temperature Score (Global FI) | — | MSCI Net Zero Tracker 2024 | Average portfolio temperature score for global financial institutions — 1.6°C above Paris target |
- **Portfolio holdings with ISIN/company identifiers** → Portfolio temperature score → **ITR by holding and portfolio-level temperature alignment**
- **Climate litigation case database (Sabin/Grantham)** → Jurisdiction risk analysis → **Relevant case law precedent and fiduciary risk score**
- **PRI/UNEP FI fiduciary assessment frameworks** → Compliance gap analysis → **Fiduciary duty integration score vs best practice**

## 5 · Intermediate Transformation Logic
**Methodology:** Fiduciary Climate Risk Assessment
**Headline formula:** `FiduciaryRisk = PortfolioClimateRisk / BenchmarkClimateRisk × (1 + LitigationRisk + RegRisk); PortfolioTempScore = Σ [w_i × CompanyITR_i]`
**Standards:** ['PRI Fiduciary Duty in the 21st Century 2019', 'UNPRI/UNEP FI/Generation Foundation Fiduciary Duty 2019', 'ClientEarth v Shell Board (2023 dismissed)', 'DoL ESG Final Rule 2022 (US)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).