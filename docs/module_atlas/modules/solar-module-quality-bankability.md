# Solar Module Quality & Bankability
**Module ID:** `solar-module-quality-bankability` · **Route:** `/solar-module-quality-bankability` · **Tier:** B (frontend-computed) · **EP code:** EP-ED6 · **Sprint:** ED

## 1 · Overview
Solar module quality assurance and bankability analytics for project finance. Models P90/P50 25-year yield scenarios, quantifies degradation by technology, assesses PVEL/DNV bankability rankings, verifies IEC testing certifications, and provides warranty adequacy analysis for debt sizing.

> **Business value:** Used by project finance lenders, independent engineers, insurance underwriters, and solar asset managers to evaluate module bankability and set P90 yield haircuts for debt sizing.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `MODULES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `p90Degrade` | `p50Degrade * (1 - sr(y * module.id) * 0.02);` |
| `techs` | `useMemo(() => ['All', ...Array.from(new Set(MODULES.map(m => m.technology)))], []);` |
| `avgBankability` | `useMemo(() => filtered.length ? (filtered.reduce((a, m) => a + m.bankability, 0) / filtered.length).toFixed(1) : '0.0', [filtered]);` |
| `avgDegradSubseq` | `useMemo(() => filtered.length ? (filtered.reduce((a, m) => a + m.degradSubseq, 0) / filtered.length).toFixed(2) : '0.00', [filtered]);` |
| `endYield` | `degradData[degradData.length - 1];` |
| `p50at25` | `(1 - m.degradYr1 / 100) * Math.pow(1 - m.degradSubseq / 100, 24) * 100;` |
| `p90at25` | `Math.max(p50at25 * (1 - sr(m.id * 3) * 0.02), p50at25 - 2.5);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MODULES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| 25-yr P90 Yield Ratio | `P_25yr / P_initial = (1-LID) × (1-ann_deg)^24` | PVEL Module Scoring + IEC 61724 | Lower-ratio modules face lender yield haircuts; bifacial have higher P90/P50 spread due to albedo variability. |
| PVEL Bankability Score | `Outdoor reliability + accelerated tests + power measurement` | PVEL PV Module Scorecard (annual) | Non-Top Performers have 50-150% higher failure rates in accelerated lifetime testing. |
| Annual Degradation Guarantee (%/yr) | `Manufacturer linear warranty rate` | Module warranty documents | Premium manufacturers guarantee 0.4-0.5%/yr; standard 0.55-0.7%/yr. |
- **PVEL scorecard + warranty documents + IEC test certs + DNV bankability list** → P90/P50 yield model + degradation curve + bankability scoring + warranty adequacy → **Module bankability package for project finance lenders and independent engineers**

## 5 · Intermediate Transformation Logic
**Methodology:** P90 Yield Model & Degradation Curve
**Headline formula:** `P90_yield = P_initial × (1-LID) × (1-ann_deg)^24 × P90_factor; P50_yield = P90_yield / 0.96`
**Standards:** ['PVEL PV Module Scorecard', 'DNV Solar Module Reliability Study', 'IEC 61215 / 61730 Standards']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).