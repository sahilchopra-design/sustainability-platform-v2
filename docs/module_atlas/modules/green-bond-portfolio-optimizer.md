# Green Bond Portfolio Optimizer
**Module ID:** `green-bond-portfolio-optimizer` · **Route:** `/green-bond-portfolio-optimizer` · **Tier:** B (frontend-computed) · **EP code:** EP-CQ1 · **Sprint:** CQ

## 1 · Overview
Mean-variance optimization for 50 green bonds with greenium impact, taxonomy alignment constraints, and duration matching.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BONDS`, `DURATION_TARGET`, `FRONTIER`, `GREENIUM`, `TABS`, `TE_DATA`

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BONDS`, `DURATION_TARGET`, `FRONTIER`, `GREENIUM`, `TABS`, `TE_DATA`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Bond Universe | — | CBI | Green bond universe |
| Greenium | — | Market data | Green bonds yield less than conventional |

## 5 · Intermediate Transformation Logic
**Methodology:** Mean-variance with green constraints
**Headline formula:** `Minimize: σ²(w) subject to: return ≥ target, taxonomy_aligned ≥ 80%, duration ±0.5yr`
**Standards:** ['Markowitz MPT', 'EU Taxonomy']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).