# Utility-Scale EPC Intelligence
**Module ID:** `utility-solar-epc-intelligence` · **Route:** `/utility-solar-epc-intelligence` · **Tier:** B (frontend-computed) · **EP code:** EP-EC4 · **Sprint:** EC

## 1 · Overview
Utility-scale solar EPC contract intelligence. Benchmarks CAPEX by contractor and technology, quantifies single-axis tracker vs fixed-tilt AEP uplift, analyses warranty and performance guarantee terms, and assesses contractor bankability for project finance lenders.

> **Business value:** Used by solar developers, project finance banks, and independent engineers to evaluate EPC contracts, validate CAPEX assumptions, and assess contractor risk for project finance.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `EPC_CONTRACTORS`, `KPI_CARD`, `MODULE_TYPES`, `PROJECTS`, `SCHEDULE_RISKS`, `TABS`, `TRACKER_TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `MODULE_TYPES` | `['Mono-PERC', 'TOPCon', 'Bifacial HJT', 'Bifacial TOPCon', 'Mono-PERC Bifacial'];` |
| `TRACKER_TYPES` | `['SAT (Single-Axis)', 'DAT (Dual-Axis)', 'Fixed-Tilt', 'SAT + Backtracking'];` |
| `capacityMwdc` | `50 + Math.round(sr(i * 7) * 750);` |
| `epsCapex` | `0.08 + sr(i * 11) * 0.10; // $/Wdc` |
| `bosCapex` | `0.10 + sr(i * 13) * 0.12;` |
| `gridCapex` | `0.03 + sr(i * 17) * 0.07;` |
| `moduleCapex` | `0.22 + sr(i * 19) * 0.10;` |
| `inverterCapex` | `0.06 + sr(i * 23) * 0.04;` |
| `installCost` | `0.05 + sr(i * 29) * 0.06;` |
| `totalCapex` | `epsCapex + bosCapex + gridCapex + moduleCapex + inverterCapex + installCost;` |
| `scheduleMonths` | `12 + Math.round(sr(i * 31) * 18);` |
| `totalMwdc` | `filtered.reduce((s, p) => s + p.capacityMwdc, 0);` |
| `avgCapex` | `filtered.length ? filtered.reduce((s, p) => s + p.totalCapex, 0) / filtered.length : 0;` |
| `avgSchedule` | `filtered.length ? filtered.reduce((s, p) => s + p.scheduleMonths, 0) / filtered.length : 0;` |
| `avgBos` | `filtered.length ? filtered.reduce((s, p) => s + p.bosCapex, 0) / filtered.length : 0;` |
| `totalPortfolioM` | `filtered.reduce((s, p) => s + p.totalCapexM, 0);` |
| `avg` | `(key) => filtered.length ? filtered.reduce((s, p) => s + p[key], 0) / filtered.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `EPC_CONTRACTORS`, `MODULE_TYPES`, `SCHEDULE_RISKS`, `TABS`, `TRACKER_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EPC CAPEX ($/Wdc) | `CAPEX_total / DC_capacity_Wdc` | BNEF H1 2024 PV Market Outlook | US $0.65-0.85/Wdc; India $0.40-0.55/Wdc; Europe $0.70-0.90/Wdc. |
| SAT AEP Uplift (%) | `AEP_SAT / AEP_fixed - 1` | NREL Tracker Performance Study 2023 | Optimal in mid-latitude, high-DNI sites; E-W trackers gaining share for grid stability. |
| Contractor Bankability Score | `Financial strength + track record + warranty depth` | DNV / Marsh frameworks | Lenders require EPC net worth ≥ 20% of contract; performance guarantees backed by parent company. |
- **EPC bid data + module prices + tracker performance studies + contractor financials** → CAPEX benchmarking + SAT uplift model + bankability scoring + warranty gap analysis → **EPC contractor selection and project finance bankability package**

## 5 · Intermediate Transformation Logic
**Methodology:** EPC CAPEX Benchmarking & Tracker Economics
**Headline formula:** `CAPEX_total = modules + BOS + labor + interconnection; SAT_uplift = 4-6% AEP vs fixed_tilt`
**Standards:** ['BNEF H2 2024 Solar LCOE Tracker', 'Wood Mackenzie EPC Market Report']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).