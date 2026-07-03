# Wellbeing-Adjusted Returns Analytics
**Module ID:** `wellbeing-adjusted-returns` · **Route:** `/wellbeing-adjusted-returns` · **Tier:** B (frontend-computed) · **EP code:** EP-DP6 · **Sprint:** DP

## 1 · Overview
Integrates wellbeing economics into investment return analysis — adjusting portfolio returns for health, social, and environmental externalities. Models total societal return, SROI (Social Return on Investment), and wellbeing-adjusted financial performance for impact investors.

> **Business value:** Directly applicable to impact investors reporting SROI, sovereign wealth funds integrating wellbeing into investment mandates, and development banks measuring societal returns. Provides HM Treasury Green Book-aligned wellbeing valuation and GIIN IRIS+ compatible impact measurement for stakeholder reporting.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `ASSET_CLASSES`, `Bar`, `INVESTMENTS`, `KpiCard`, `TABS`, `WELLBY_CATEGORIES`, `WELLBY_DATA`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ASSET_CLASSES` | `['Green Infrastructure', 'Health Systems', 'Clean Energy', 'Nature-Based Solutions', 'Social Housing'];` |
| `acIdx` | `Math.floor(sr(i * 5) * ASSET_CLASSES.length);` |
| `grossReturn` | `4 + sr(i * 7) * 8;` |
| `wellbyScore` | `20 + sr(i * 11) * 75;` |
| `socialRoi` | `1.5 + sr(i * 13) * 8.5;` |
| `healthCobenefits` | `0.5 + sr(i * 17) * 9.5;` |
| `wellbyCostPerUnit` | `1000 + sr(i * 19) * 49000;` |
| `finalReturn` | `grossReturn * (1 + wellbyScore / 200);` |
| `sdgAlignment` | `Math.round(1 + sr(i * 23) * 5);` |
| `impactMultiplier` | `1 + sr(i * 29) * 4;` |
| `aum` | `10 + sr(i * 31) * 490;` |
| `WELLBY_DATA` | `WELLBY_CATEGORIES.map((cat, i) => ({` |
| `TABS` | `['Overview', 'WELLBY Scores', 'Social ROI', 'Health Co-Benefits', 'Asset Class Analysis', 'WELLBY Framework', 'Impact Multiplier', 'Portfolio Construc` |
| `avgWellby` | `filtered.length ? (filtered.reduce((a, i) => a + i.wellbyScore, 0) / filtered.length).toFixed(1) : '0.0';` |
| `avgSocialRoi` | `filtered.length ? (filtered.reduce((a, i) => a + i.socialRoi, 0) / filtered.length).toFixed(2) : '0.00';` |
| `totalAum` | `filtered.reduce((a, i) => a + i.aum, 0).toFixed(0);` |
| `avgFinalReturn` | `filtered.length ? (filtered.reduce((a, i) => a + i.finalReturn, 0) / filtered.length).toFixed(2) : '0.00';` |
| `avgHealthCob` | `filtered.length ? (filtered.reduce((a, i) => a + i.healthCobenefits, 0) / filtered.length).toFixed(2) : '0.00';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_CLASSES`, `TABS`, `WELLBY_CATEGORIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Health QALY Value | — | NICE Technology Appraisal Threshold 2024 | UK NICE threshold for cost-effective health interventions — primary shadow price for health outcomes |
| Social Bond Wellbeing Premium | — | GIIN SROI Research 2023 | Investments with verified SROI >3× command 2–4% return premium in impact bond market |
| Wellbeing Economics GDP Alternative | — | OECD Better Life Index 2024 | 35 countries now report National Wellbeing (NWB) indicators alongside GDP — growing impact on policy |
- **Portfolio company/project outcome data by IRIS+ category** → Impact quantification → **Outcomes by domain with financial proxy values**
- **NICE/HM Treasury wellbeing shadow prices** → Monetary valuation → **Total wellbeing-adjusted value of investment outcomes**
- **Peer impact data + SROI benchmarks** → Performance comparison → **SROI ratio vs sector peers and wellbeing-adjusted return premium**

## 5 · Intermediate Transformation Logic
**Methodology:** Wellbeing-Adjusted Return
**Headline formula:** `WAR = FinancialReturn + (HealthCoBenefit + SocialCoBenefit - EnvironmentalHarm) × MonetisationRate; SROI = TotalValue / TotalInvestment where TotalValue = Σ [Outcome_i × FinancialProxy_i]`
**Standards:** ['OECD Wellbeing Framework 2020', 'Social Value International — SROI Methodology', 'HM Treasury Green Book 2022 — Wellbeing Valuation', 'GIIN IRIS+ Social and Environmental Impact Metrics']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).