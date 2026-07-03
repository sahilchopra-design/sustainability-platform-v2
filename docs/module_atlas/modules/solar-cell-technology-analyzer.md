# Solar Cell Technology Analyzer
**Module ID:** `solar-cell-technology-analyzer` · **Route:** `/solar-cell-technology-analyzer` · **Tier:** B (frontend-computed) · **EP code:** EP-ED2 · **Sprint:** ED

## 1 · Overview
Solar cell technology comparison and market analysis. Benchmarks efficiency, cost, temperature coefficient, and degradation rate across BSF, PERC, TOPCon, HJT, IBC, Perovskite-Si tandem, CdTe, and CIGS. Tracks market share transition and projects technology roadmaps to 2030.

> **Business value:** Used by solar developers, EPCs, equipment buyers, and technology investors to select solar cell technologies based on efficiency, cost, reliability, and bankability.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `EFFICIENCY_ROADMAP`, `KpiCard`, `TABS`, `TECHNOLOGIES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `marketShareData` | `useMemo(() => TECHNOLOGIES.map(t => ({ name: t.name, value: t.marketShare2024 })), []);` |
| `COLORS` | `TECHNOLOGIES.map(t => t.color);` |
| `costEffData` | `useMemo(() => TECHNOLOGIES.map(t => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `EFFICIENCY_ROADMAP`, `TABS`, `TECHNOLOGIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Cell Efficiency Record (%) | `Measured at STC (25°C, 1000 W/m², AM1.5G)` | NREL Best Research-Cell Efficiency Chart 2024 | Commercial module efficiency lags cell by 2-4pp; Perovskite-Si tandem target 30%+ commercialization by 2027. |
| Temperature Coefficient (%/°C) | `Δη/ΔT per IEC 60904-5` | Module datasheets + NREL | HJT best: -0.26%/°C; PERC -0.35%; BSF worst: -0.45%; critical for hot climates. |
| Learning Rate (%) | `1 - 2^(-b) from log-log regression` | Lafond et al. 2018 | Module cost $76/W (1977) → $0.16/W (2023); 99.8% cost reduction. |
- **NREL efficiency chart + BNEF cost data + market share tracker** → Technology benchmarking + Wright's Law cost projection + market share transition model → **Technology selection for solar project developers, procurement, and investment decisions**

## 5 · Intermediate Transformation Logic
**Methodology:** Technology Efficiency Roadmap & Learning Curve
**Headline formula:** `Wright_Law: C(Q) = C_0 × (Q/Q_0)^(-b); b = log2(1-LR), LR = 24% for c-Si`
**Standards:** ['NREL Best Research-Cell Efficiency Chart', 'IEA Technology Roadmap Solar PV 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).