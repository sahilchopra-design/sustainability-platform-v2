# Polysilicon & Wafer Supply Chain Intelligence
**Module ID:** `polysilicon-wafer-supply-chain` · **Route:** `/polysilicon-wafer-supply-chain` · **Tier:** B (frontend-computed) · **EP code:** EP-ED1 · **Sprint:** ED

## 1 · Overview
Global polysilicon and solar wafer supply chain intelligence. Maps production concentration, quantifies UFLPA compliance risk for Xinjiang-sourced material, calculates HHI market concentration, and compares Siemens vs FBR process economics.

> **Business value:** Used by solar developers, EPCs, project finance lenders, and institutional investors requiring UFLPA-compliant supply chains to assess polysilicon and wafer sourcing risk.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `PRICE_HISTORY`, `SUPPLIERS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `regions` | `useMemo(() => ['All', ...Array.from(new Set(SUPPLIERS.map(s => s.region)))], []);` |
| `totalCapacity` | `useMemo(() => filteredSuppliers.reduce((a, s) => a + s.annualCapacityGW, 0), [filteredSuppliers]);` |
| `chinaCapacity` | `useMemo(() => SUPPLIERS.filter(s => s.country === 'China').reduce((a, s) => a + s.annualCapacityGW, 0), []);` |
| `total` | `SUPPLIERS.reduce((a, s) => a + s.annualCapacityGW, 0);` |
| `total` | `filteredSuppliers.reduce((a, s) => a + s.annualCapacityGW, 0);` |
| `totCap` | `SUPPLIERS.reduce((a, s) => a + s.annualCapacityGW, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `PRICE_HISTORY`, `SUPPLIERS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Polysilicon HHI | `HHI = Σ(MS_i²)` | SEIA UFLPA Risk Assessment 2023 | HHI > 2500 = highly concentrated; dominated by Tongwei, Daqo, GCL. |
| Xinjiang Exposure (%) | `Xinjiang_capacity / China_total` | Horizon Advisory / SEIA UFLPA Tracker | All Xinjiang-sourced material presumed UFLPA violation without full traceability. |
| Siemens vs FBR Cost ($/kg) | `Process cost benchmarking` | BNEF Polysilicon Cost Curve 2024 | FBR lower energy (40 vs 70 kWh/kg); Siemens dominant >80%. |
- **Producer capacity data + Xinjiang sourcing reports + UFLPA entity list + cost benchmarks** → HHI calculation + UFLPA risk scoring + Siemens/FBR cost model → **Supply chain risk assessment for UFLPA-compliant solar procurement**

## 5 · Intermediate Transformation Logic
**Methodology:** Supply Concentration & UFLPA Risk Scoring
**Headline formula:** `HHI = Σ(market_share_i²); UFLPA_risk = f(Xinjiang_sourcing, audit_gaps, traceability)`
**Standards:** ['UFLPA Entity List (US CBP)', 'SEIA UFLPA Supply Chain Traceability', 'IEA Solar PV Supply Chain 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).