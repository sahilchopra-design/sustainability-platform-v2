# Nuclear Fuel Cycle Economics
**Module ID:** `nuclear-fuel-cycle` · **Route:** `/nuclear-fuel-cycle` · **Tier:** B (frontend-computed) · **EP code:** EP-DU5 · **Sprint:** DU

## 1 · Overview
End-to-end nuclear fuel cycle cost analysis from uranium mining through conversion, enrichment, fabrication and used fuel management, including SWU pricing, MOX economics and HALEU supply chain for advanced reactors.

> **Business value:** Nuclear fuel cycle costs of $5–$15/MWh are dominated by enrichment (SWU at $100–$160) and fabrication; HALEU supply constraints impose a 3–5× SWU premium critical to advanced reactor economics.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BACKEND_STRATEGIES`, `ENRICHERS`, `FUEL_TYPES`, `HALEU_SOURCES`, `KpiCard`, `MINES`, `Slider`, `TABS`, `WASTE_CLASSES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `swuPerKgProduct` | `(v(productAssay / 100) - v(tailsAssay / 100)) - (feedAssay / 100 / (productAssay / 100) * (v(feedAssay / 100) - v(tailsAssay / 100)));` |
| `feedKg` | `kgU * (productAssay / 100 - tailsAssay / 100) / (feedAssay / 100 - tailsAssay / 100);` |
| `swuPerKg` | `(2 * enrichPct / 100 - 1) * Math.log((enrichPct / 100) / (1 - enrichPct / 100))` |
| `feedKg` | `kgU * (enrichPct / 100 - tailsAssay / 100) / (feedAssay / 100 - tailsAssay / 100);` |
| `u3o8Cost` | `feedKg * u3o8Price / 0.848; // U3O8 → UF6 conversion factor` |
| `convCost` | `feedKg * conversionFee;` |
| `swuCost` | `swuPerKg * kgU * swuPrice;` |
| `mineData` | `MINES.map(m => ({ name: m.name.split(" ")[0], production: m.u3o8Mlbs, cost: m.cost }));` |
| `enricherPie` | `ENRICHERS.map((e, i) => ({ name: e.name, value: e.share, fill: COLORS[i] }));` |
| `backendCost` | `BACKEND_STRATEGIES.map(s => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BACKEND_STRATEGIES`, `COLORS`, `ENRICHERS`, `FUEL_TYPES`, `HALEU_SOURCES`, `MINES`, `TABS`, `WASTE_CLASSES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Fuel Cycle Cost | `FCC = Σ(Stage Cost) / (BU × MWe)` | WNA 2023 | Total fuel cost per MWh; low vs fossil fuels, insensitive to uranium price swings. |
| SWU Price | `Market SWU = Enrichment Service Contract Price` | Urenco / USEC market data | Separative work unit price tracking enrichment capacity utilisation. |
| HALEU Enrichment Premium | `HALEU SWU Cost = Standard SWU × Premium Factor` | DOE HALEU Availability Program | High-assay low-enriched uranium (5–20% U-235) required for many advanced reactor designs. |
- **UxC uranium price + SWU market data** → Stage cost model → burnup-adjusted $/MWh → **Fuel cycle cost dashboard by reactor type**

## 5 · Intermediate Transformation Logic
**Methodology:** Fuel Cycle Cost per MWh
**Headline formula:** `FCC = (U₃O₈ + Conversion + Enrichment_SWU + Fabrication + Used_Fuel_Mgmt) / (BU × Capacity)`
**Standards:** ['WNA — The Nuclear Fuel Cycle', 'EIA — Uranium Marketing Annual Report']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).