# Supervisory Stress Orchestrator
**Module ID:** `supervisory-stress-orchestrator` · **Route:** `/supervisory-stress-orchestrator` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Regulatory climate stress test workflow engine that orchestrates multi-scenario, multi-horizon supervisory exercises across NGFS and central bank scenarios including ECB, PRA and ACPR methodologies.

> **Business value:** Central banks globally now require climate stress tests; the ECB 2022 exercise covered €4.2 trillion in bank exposures; orchestration tooling cuts submission preparation time by 60–70%.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Btn`, `GRADE_ADVERSE`, `GRADE_BASE_LOSS`, `GRADE_SEVERE`, `INSTITUTIONS`, `INST_NAMES`, `INST_TYPES`, `JURISDICTIONS`, `KpiCard`, `LOAN_GRADES`, `MANAGEMENT_ACTIONS`, `Pill`, `REGULATORS`, `SectionTitle`, `Select`, `Slider`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `INSTITUTIONS` | `INST_NAMES.map((name, i) => {` |
| `type` | `INST_TYPES[Math.floor(sr(i * 7)  * INST_TYPES.length)];` |
| `jurisdiction` | `JURISDICTIONS[Math.floor(sr(i * 11) * JURISDICTIONS.length)];` |
| `totalAssets` | `20  + sr(i * 13) * 980;` |
| `regulatoryCapital` | `0.08 + sr(i * 17) * 0.08;` |
| `climateExposurePct` | `0.05 + sr(i * 19) * 0.40;` |
| `physRisk` | `15  + sr(i * 23) * 75;` |
| `transRisk` | `10  + sr(i * 29) * 80;` |
| `dataQualityScore` | `0.50 + sr(i * 41) * 0.50;` |
| `managementActionCapacity` | `0.10 + sr(i * 43) * 0.40;` |
| `templateCompletionPct` | `40   + sr(i * 37) * 60;` |
| `capitalRaisePotential` | `0.010 + sr(i * 47) * 0.030;` |
| `rwaPct` | `0.45 + sr(i * 53) * 0.30;` |
| `dividendYield` | `0.02 + sr(i * 59) * 0.05;` |
| `ppnrPct` | `0.015 + sr(i * 61) * 0.025;` |
| `feePct` | `0.005 + sr(i * 67) * 0.015;` |
| `niiMargin` | `0.010 + sr(i * 71) * 0.020;` |
| `tradingRevPct` | `0.003 + sr(i * 73) * 0.012;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `GRADE_ADVERSE`, `GRADE_BASE_LOSS`, `GRADE_SEVERE`, `INST_NAMES`, `INST_TYPES`, `JURISDICTIONS`, `LOAN_GRADES`, `MANAGEMENT_ACTIONS`, `REGULATORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Scenarios Loaded | — | NGFS Phase IV | Number of supervisory scenario pathways available for stress projection. |
| Portfolio sCVaR (Orderly) | — | ECB Methodology | Capital impact under NGFS Orderly 1.5°C scenario expressed as CET1 ratio reduction. |
| Estimated Completion | — | Workflow Engine | Proportion of stress test data collection, modelling and QA stages completed. |
- **Portfolio Exposures, NGFS Scenario Data, Macro Projections** → Scenario mapping + credit/market risk engines + QA workflows → **Supervisory submission packages, management dashboards, capital impact reports**

## 5 · Intermediate Transformation Logic
**Methodology:** Supervisory Climate VaR
**Headline formula:** `sCVaR = Σ (Exposure × PDΔ × LGD) + MarketΔ`
**Standards:** ['ECB Climate Stress Test 2022', 'PRA SS3/19', 'BIS CGFS 2021']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).