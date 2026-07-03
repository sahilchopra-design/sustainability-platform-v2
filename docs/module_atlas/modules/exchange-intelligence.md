# Exchange Intelligence
**Module ID:** `exchange-intelligence` · **Route:** `/exchange-intelligence` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses and compares ESG listing requirements, sustainability disclosure obligations, and climate reporting rules across major stock exchanges globally. Tracks emerging market sustainability index inclusion criteria, voluntary and mandatory ESG reporting frameworks by exchange, and progressive implementation timelines. Supports investor stewardship, market development analysis, and portfolio ESG regulatory exposure mapping.

> **Business value:** Enables institutional investors, stewardship teams, and market development advisors to navigate the rapidly evolving global landscape of exchange-level ESG requirements, identify markets where regulatory tailwinds will drive ESG disclosure improvement, and calibrate engagement priorities accordingly.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ESG_TREND`, `EXCHANGES`, `KpiCard`, `LISTING_STANDARDS`, `STEWARDSHIP_DATA`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ESG_TREND` | `['2019','2020','2021','2022','2023','2024','2025'].map((yr, i) => ({` |
| `STEWARDSHIP_DATA` | `EXCHANGES.map(e => ({` |
| `regions` | `['All', 'Americas', 'Europe', 'Asia-Pacific'];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ESG_TREND`, `EXCHANGES`, `LISTING_STANDARDS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Disclosure Mandate Level (0â€“3) | — | WFE ESG Database | Rating 0=voluntary, 1=apply-or-explain, 2=mandatory rule-based, 3=mandatory+assurance; trend toward 3 in devel |
| TCFD Mandate Status | — | FSB TCFD Status Report 2023 | Whether exchange or market regulator has mandated TCFD-aligned climate disclosure; binary indicator with effec |
| ESG Index AUM ($Bn) | — | Index Provider Data | Total assets tracking exchange-domiciled ESG indices; proxy for market-level ESG investor demand and capital a |
| Emerging Market ESG Inclusion Rate (%) | — | MSCI EM ESG Leaders | Proportion of exchange-listed companies included in leading EM ESG indices; low rate signals ESG disclosure in |
- **WFE ESG metrics database and exchange annual reports** → Extract and standardise disclosure mandate level, effective date, and enforcement mechanism per exchange → **Exchange ESG governance matrix with mandate level and TCFD status**
- **MSCI/FTSE ESG index constituent data** → Compute inclusion rate by exchange; track year-on-year trend in EM index eligibility → **ESG index inclusion rate and AUM by exchange**
- **Exchange listing rule documents and regulatory circulars** → Monitor for ESG rule updates; classify as new mandate, enhanced requirement, or guidance only → **Regulatory change alert with implementation date and compliance implication**

## 5 · Intermediate Transformation Logic
**Methodology:** Exchange ESG Readiness Score
**Headline formula:** `EERS = w_d × Disclosure + w_e × Enforcement + w_i × IndexInclusion + w_c × ClimateAmbition`
**Standards:** ['WFE ESG Guidance and Metrics 2021', 'IFC Model Exchange Guidance 2021', 'IOSCO ESG Ratings Consultation 2021']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).