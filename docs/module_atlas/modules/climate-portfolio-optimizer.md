# Climate Portfolio Optimizer
**Module ID:** `climate-portfolio-optimizer` · **Route:** `/climate-portfolio-optimizer` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Implements multi-objective portfolio optimisation balancing financial return, risk, and climate objectives including temperature alignment, carbon intensity, and green revenue exposure.

> **Business value:** Enables portfolio managers to construct climate-aligned portfolios that meet financial objectives while systematically reducing transition risk and increasing climate solution exposure.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BENCHMARK`, `COUNTRIES`, `FRONTIER`, `KpiCard`, `NGFS_SCENARIOS`, `NORMALIZED`, `SECTORS`, `SECURITIES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sec` | `SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];` |
| `cty` | `COUNTRIES[Math.floor(sr(i * 13 + 1) * COUNTRIES.length)];` |
| `ret` | `sr(i * 3 + 2) * 0.15 + 0.03;` |
| `vol` | `sr(i * 5 + 3) * 0.25 + 0.08;` |
| `itr` | `sr(i * 17 + 5) * 3 + 1.5;` |
| `totalRawWeight` | `SECURITIES.reduce((s, x) => s + x.weight, 0);` |
| `NORMALIZED` | `SECURITIES.map(s => ({ ...s, weight: s.weight / totalRawWeight }));` |
| `bmkTotal` | `NORMALIZED.reduce((s, x) => s + sr(x.id * 53 + 20) * 0.01, 0);` |
| `BENCHMARK` | `NORMALIZED.map(s => ({ ...s, bmkWeight: (sr(s.id * 53 + 20) * 0.01) / bmkTotal }));` |
| `vol` | `0.08 + t * 0.22;` |
| `ret` | `0.03 + t * 0.14 + sr(i * 7 + 99) * 0.02 - 0.01;` |
| `total` | `filtered.reduce((s, x) => s + x.weight, 0);` |
| `total` | `eligible.reduce((s, x) => s + x.weight, 0);` |
| `renormed` | `eligible.map(s => ({ ...s, optWeight: total > 0 ? s.weight / total : 0 }));` |
| `tilted` | `renormed.map(s => ({` |
| `tTotal` | `tilted.reduce((s, x) => s + x.optWeight, 0);` |
| `total` | `eligible.reduce((s, x) => s + x.weight, 0);` |
| `ret` | `holdings.reduce((s, x) => s + x.optWeight * x.expectedReturn, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `NGFS_SCENARIOS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Efficient Frontier Solutions | — | Internal Solver | Number of Pareto-optimal portfolios generated per optimisation run across return, risk, and climate dimensions |
| Carbon Intensity Reduction vs Benchmark | — | MSCI 2023 | Typical carbon intensity reduction achievable with <0.5% tracking error versus a standard equity benchmark. |
- **Return and risk factor data, carbon intensity and ITR scores, green revenue datasets** → Quadratic optimisation solver, climate penalty calibration, efficient frontier generation → **Optimal portfolio weights, carbon/temperature metrics, green revenue breakdown**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted Sharpe Ratio
**Headline formula:** `CASR = (Rₚ – Rₑ) / (σₚ × (1 + λ×CIₚ))`
**Standards:** ['Pedersen et al. 2021', 'MSCI Climate Value-at-Risk']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).