# Solar Module Manufacturing Economics
**Module ID:** `solar-module-manufacturing-economics` · **Route:** `/solar-module-manufacturing-economics` · **Tier:** B (frontend-computed) · **EP code:** EP-ED3 · **Sprint:** ED

## 1 · Overview
Solar module manufacturing cost structure and competitive economics. Analyses BOM breakdown across 8 components, benchmarks manufacturer cost curves by country, tracks historical cost learning curve, and quantifies IRA §48C manufacturing credits.

> **Business value:** Used by solar module buyers, EPCs, manufacturers considering US/EU factory investments, and trade policy analysts evaluating IRA §48C/48E incentive competitiveness.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BOM_COMPONENTS`, `KpiCard`, `LEARNING_CURVE`, `MANUFACTURERS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hqOptions` | `useMemo(() => ['All', ...Array.from(new Set(MANUFACTURERS.map(m => m.hq)))], []);` |
| `avgMargin` | `useMemo(() => filtered.length ? (filtered.reduce((a, m) => a + m.grossMargin, 0) / filtered.length).toFixed(1) : '0.0', [filtered]);` |
| `avgCost` | `useMemo(() => filtered.length ? (filtered.reduce((a, m) => a + m.costPerWp, 0) / filtered.length).toFixed(2) : '0.00', [filtered]);` |
| `totalCap` | `useMemo(() => filtered.reduce((a, m) => a + m.capacityGW, 0), [filtered]);` |
| `avgUtil` | `useMemo(() => filtered.length ? (filtered.reduce((a, m) => a + m.utilization, 0) / filtered.length).toFixed(1) : '0.0', [filtered]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BOM_COMPONENTS`, `LEARNING_CURVE`, `MANUFACTURERS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Module Cost ($/W) | `Varies by country, technology, scale, integration` | BNEF Q3 2024 Module Price Index | China integrated: $0.10-0.16/W; IRA §48E production credit $0.04/W reduces US effective cost. |
| BOM Cell Share (%) | `Cell cost / total module BOM` | BNEF Module Cost Model | TOPCon/HJT cells command 15-30% premium over PERC; silver 8-20 mg/cell is key variable. |
| Wright's Law Learning Rate (%) | `Each capacity doubling → 24% cost reduction` | Nemet (2006), Lafond et al. (2018) | Expected deceleration to 18-20% post-2023 as approaching materials cost floor. |
- **BNEF price index + manufacturer capacity + BOM component prices + IRA guidance** → Manufacturing cost model + Wright's Law projection + IRA incentive calculator → **Module cost benchmarking for procurement, manufacturing investment, and trade policy**

## 5 · Intermediate Transformation Logic
**Methodology:** Manufacturing Cost Decomposition & Wright's Law
**Headline formula:** `Cost_module = Σ(BOM_i × price_i) + (labor + overhead + depreciation) / output; LR = 24%`
**Standards:** ['BNEF Solar Module Price Index', 'IRA §48C Advanced Energy Manufacturing Tax Credit']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).