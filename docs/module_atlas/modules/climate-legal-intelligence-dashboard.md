# Climate Legal Intelligence Dashboard
**Module ID:** `climate-legal-intelligence-dashboard` · **Route:** `/climate-legal-intelligence-dashboard` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Aggregates and analyses climate litigation filings, court outcomes, and regulatory enforcement actions to surface legal risk trends across jurisdictions and counterparties.

> **Business value:** Enables legal, compliance, and investment teams to monitor the rapidly expanding climate litigation landscape and integrate legal risk into credit and investment decisions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CLAIM_TYPES_6`, `COUNTRIES_100`, `ENTITIES`, `ENTITY_NAMES_100`, `FORECAST_DATA`, `JURISDICTIONS_25`, `JUR_INTELLIGENCE`, `KEY_PRECEDENTS`, `KpiCard`, `LEGAL_READINESS`, `RISK_DIMENSIONS`, `RISK_LABELS`, `RiskBadge`, `SCENARIOS`, `SCENARIO_CAGR`, `SCENARIO_COLORS`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `LEGAL_READINESS` | `['Big Law', 'Boutique', 'In-House Only'];` |
| `SCENARIO_CAGR` | `[0.08, 0.18, 0.14]; // sr seeded per entity` |
| `sectorIdx` | `Math.floor(sr(i * 7) * 10);` |
| `countryIdx` | `Math.floor(sr(i * 11) * 20);` |
| `jurCount` | `1 + Math.floor(sr(i * 13) * 3);` |
| `jurStartIdx` | `Math.floor(sr(i * 17) * 20);` |
| `jurisdictions` | `Array.from({ length: jurCount }, (_, j) => COUNTRIES_100[(jurStartIdx + j) % 20]);` |
| `litigationRisk` | `Math.round(sr(i * 19) * 85 + 5);` |
| `greenwashingRisk` | `Math.round(sr(i * 23) * 85 + 5);` |
| `disclosureRisk` | `Math.round(sr(i * 29) * 85 + 5);` |
| `regulatoryRisk` | `Math.round(sr(i * 31) * 85 + 5);` |
| `reputationalRisk` | `Math.round(sr(i * 37) * 85 + 5);` |
| `precedentRisk` | `Math.round(sr(i * 41) * 85 + 5);` |
| `compositeLegalRisk` | `Math.round((litigationRisk + greenwashingRisk + disclosureRisk + regulatoryRisk + reputationalRisk + precedentRisk) / 6);` |
| `activeCases` | `Math.floor(sr(i * 43) * 15);` |
| `pendingLitigationM` | `+(sr(i * 47) * 500 + 10).toFixed(0);` |
| `fineExposureM` | `+(sr(i * 53) * 200 + 5).toFixed(0);` |
| `insuranceCoverageM` | `+(sr(i * 59) * 150 + 5).toFixed(0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CLAIM_TYPES_6`, `COUNTRIES_100`, `JURISDICTIONS_25`, `LEGAL_READINESS`, `RISK_DIMENSIONS`, `SCENARIOS`, `SCENARIO_CAGR`, `SCENARIO_COLORS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Climate Cases | — | Sabin Center 2024 | Cumulative climate litigation cases filed globally as of 2024 across all jurisdictions. |
| Corporate Defendant Share | — | UNEP Global Trends 2023 | Proportion of cases naming private-sector entities as primary defendants, up from 10% in 2015. |
- **Court filings, regulatory enforcement notices, NGO litigation trackers** → Case classification, entity linkage, outcome probability modelling → **Entity risk dashboards, jurisdiction heat maps, trend analytics**

## 5 · Intermediate Transformation Logic
**Methodology:** Litigation Risk Score
**Headline formula:** `LRS = Σ (Case Weight × Jurisdiction Factor × Outcome Probability)`
**Standards:** ['Sabin Center Climate Case Chart', 'ClientEarth Case Database']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).