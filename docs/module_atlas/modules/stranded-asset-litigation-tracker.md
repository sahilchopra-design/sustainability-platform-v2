# Stranded Asset Litigation Tracker
**Module ID:** `stranded-asset-litigation-tracker` · **Route:** `/stranded-asset-litigation-tracker` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tracks litigation risk arising from stranded fossil fuel assets; maps active and emerging climate litigation cases to asset exposures, jurisdictions and financial liability estimates.

> **Business value:** Climate litigation has grown 200%+ since 2015; stranded asset claims represent the fastest-growing litigation category, with Milieudefensie v Shell establishing precedent for mandatory emissions reductions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSETS`, `ASSET_TYPES`, `COUNTRIES`, `CREDITORS`, `CREDITOR_TYPES`, `KpiCard`, `NGFS_SCENARIOS`, `NGFS_WRITE_DOWN_RANGES`, `OWNER_NAMES`, `PERMIT_STATUSES`, `REG_TRIGGERS`, `RiskBadge`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `typeIdx` | `Math.floor(sr(i * 7) * 8);` |
| `countryIdx` | `Math.floor(sr(i * 11) * 20);` |
| `ownerIdx` | `Math.floor(sr(i * 13) * 20);` |
| `strandingRisk` | `Math.round(sr(i * 17) * 90 + 5);` |
| `bookValue` | `Math.round((sr(i * 19) * 4 + 0.05) * 1e3); // $M` |
| `remainingLife` | `Math.round(sr(i * 23) * 35 + 2);` |
| `carbonLockIn` | `+(sr(i * 29) * 500 + 5).toFixed(1);` |
| `decommissionCost` | `Math.round(bookValue * (sr(i * 31) * 0.3 + 0.05));` |
| `litigationExposure` | `Math.round(bookValue * (sr(i * 37) * 0.5 + 0.02));` |
| `creditorExposure` | `Math.round(bookValue * (sr(i * 41) * 0.7 + 0.1));` |
| `permitStatusIdx` | `Math.floor(sr(i * 43) * 4);` |
| `physRisk` | `Math.round(sr(i * 47) * 80 + 10);` |
| `policyRisk` | `Math.round(sr(i * 53) * 80 + 10);` |
| `marketRisk` | `Math.round(sr(i * 59) * 80 + 10);` |
| `socialLicenseRisk` | `Math.round(sr(i * 61) * 80 + 10);` |
| `currentUtilization` | `+(sr(i * 67) * 90 + 5).toFixed(0);` |
| `ngfsWriteDown` | `NGFS_SCENARIOS.map((_, si) => {` |
| `remEconValue` | `Math.round(bookValue * (remainingLife / 40) * (1 - strandingRisk / 100));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_TYPES`, `COLORS`, `COUNTRIES`, `CREDITOR_TYPES`, `NGFS_SCENARIOS`, `NGFS_WRITE_DOWN_RANGES`, `OWNER_NAMES`, `PERMIT_STATUSES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Cases Tracked | — | Sabin Center Database | Global climate litigation cases mapped to fossil fuel asset exposures as of latest update. |
| Estimated Portfolio LEI | — | LEI Engine | Expected litigation liability attributable to portfolio fossil fuel holdings. |
| High-Risk Jurisdictions | — | Legal Risk Model | Jurisdictions with >50% success rate in recent climate liability rulings (US, AU, NL, DE, FR, UK, CA). |
- **Sabin Center Case Feed, Portfolio Asset Registry** → Case-to-asset matching + probability-weighted liability model → **Litigation exposure dashboard, jurisdiction heatmap, case alerts**

## 5 · Intermediate Transformation Logic
**Methodology:** Litigation Exposure Index
**Headline formula:** `LEI = Σ (Asset Value × Case Probability × Liability Severity)`
**Standards:** ['Grantham LSE Climate Litigation Database', 'TCFD Litigation Risk Guidance']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).