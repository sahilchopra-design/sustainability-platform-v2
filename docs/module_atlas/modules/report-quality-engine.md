# Sustainability Report Quality Engine
**Module ID:** `report-quality-engine` · **Route:** `/report-quality-engine` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Automated quality assessment engine for sustainability reports scoring TCFD recommendation alignment (11 recommendations, 0-100%), CSRD completeness, GRI Standards coverage, data consistency through year-over-year variance analysis, and third-party assurance level tracking against ISAE 3000/3410 standards.

> **Business value:** Used by sustainability reporting managers, external auditors, and ESG investors to assess and compare sustainability report quality, identify material gaps, and track improvement over time.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSURANCE_LEVELS`, `COMPANIES`, `ENFORCEMENT_CASES`, `GREENWASH_TYPES`, `ISAE_REQS`, `KPI`, `LINEAGE_ENTRIES`, `QA_CATEGORIES`, `TABS`, `TOTAL_QA_ITEMS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TOTAL_QA_ITEMS` | `QA_CATEGORIES.reduce((s, c) => s + c.items.length, 0);` |
| `seed` | `i * 41 + 500;` |
| `sources` | `['ERP SAP S/4HANA','Utility Invoices','Supplier Surveys','EPA GHGRP','CDP Disclosure','Internal HSE System','HR Payroll','Financial Controller','Energ` |
| `transforms` | `['Direct Measurement','Activity-based Calculation','Spend-based Estimation','Supplier-specific EF','Average-data Method','Hybrid Approach','Extrapolat` |
| `seed` | `i * 53 + 800;` |
| `claims` | `Math.floor(3 + sr(seed) * 8);` |
| `flagged` | `Math.floor(sr(seed + 1) * (claims + 1));` |
| `qaPercent` | `TOTAL_QA_ITEMS > 0 ? Math.round((totalChecked / TOTAL_QA_ITEMS) * 100) : 0;` |
| `key` | ``${cat}-${idx}`;` |
| `sectors` | `useMemo(() => ['All', ...new Set(COMPANIES.map(c => c.sector))], []);` |
| `gwDistribution` | `useMemo(() => GREENWASH_TYPES.map(g => ({` |
| `assuranceDistribution` | `useMemo(() => ASSURANCE_LEVELS.map(a => ({` |
| `results` | `GREENWASH_TYPES.map(g => {` |
| `score` | `Math.round(5 + sr(text.length * 7 + g.id.length * 13) * 30);` |
| `overall` | `results.length > 0 ? Math.round(results.reduce((s, r) => s + r.riskScore, 0) / results.length) : 0;` |
| `seed` | `i * 29 + 200;` |
| `tags` | `['ESRS E1-6 GHG Total','ESRS E1-4 Targets','ESRS E2-4 Water Use','ESRS S1-6 Workforce','ESRS G1-1 Governance','ESRS E1-1 Transition Plan','ESRS E3-1 M` |
| `catChecked` | `cat.items.filter((_, ii) => checkedItems[`${ci}-${ii}`]).length;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSURANCE_LEVELS`, `ENFORCEMENT_CASES`, `GREENWASH_TYPES`, `ISAE_REQS`, `QA_CATEGORIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| TCFD Alignment Score | `Σ(w_i × TCFD_rec_i_score) / 11` | NLP-based TCFD recommendation mapping | Scores >70 indicate strong TCFD alignment; regulatory momentum (UK, EU, SEC) is moving toward mandatory full a |
| CSRD Completeness Gap | `(required_datapoints − reported_datapoints) / required_datapoints × 100` | EFRAG ESRS datapoint checklist | Gap >30% is a material compliance risk for first-year CSRD filers; gap analysis drives data collection priorit |
| Assurance Level | `ISAE_3000_engagement_type from auditor report` | Auditor assurance report | CSRD mandates limited assurance from 2025, moving to reasonable assurance by 2028; current Fortune 500 average |
- **Sustainability report PDFs/XBRL → NLP extraction + datapoint mapping** → TCFD/CSRD/GRI scoring → consistency analysis → assurance level tracking → **Report quality scorecard with gap analysis and improvement recommendations**

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-Standard Report Quality Scoring
**Headline formula:** `quality_score = w_tcfd·TCFD_score + w_csrd·CSRD_score + w_gri·GRI_score + w_consistency·consistency_score`
**Standards:** ['TCFD Final Recommendations 2017 / 2023 Annex', 'EFRAG CSRD Completeness Assessment Guide', 'GRI Universal Standards 2021']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).