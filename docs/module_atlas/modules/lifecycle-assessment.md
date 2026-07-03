# Lifecycle Assessment
**Module ID:** `lifecycle-assessment` · **Route:** `/lifecycle-assessment` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ISO 14040/14044-compliant LCA engine for calculating product carbon footprints and environmental impact across the full value chain from raw material extraction to end-of-life disposal. Supports Scope 3 Category 1 (purchased goods) and Category 11 (use of sold products) quantification and product environmental footprint (PEF) Category Rules compliance for EU Green Claims and CSRD-aligned product disclosures.

> **Business value:** Equips product managers and sustainability analysts with ISO-compliant LCA capabilities to quantify PCFs, identify decarbonisation priorities, and prepare product-level disclosures required under EU Green Claims regulation and CSRD product sustainability requirements.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Btn`, `IMPACT_CATEGORIES`, `ISO_CHECKLIST`, `KPI`, `LCA_STAGES`, `LS_LCA`, `LS_PORT`, `PCR_STANDARDS`, `PERSON_EQUIVALENTS`, `PIE_COLORS`, `PRODUCT_ARCHETYPES`, `Section`, `SortHeader`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `fmtK` | `(n) => { if(Math.abs(n)>=1e6) return `${(n/1e6).toFixed(1)}M`; if(Math.abs(n)>=1e3) return `${(n/1e3).toFixed(1)}K`; return fmt(n,0); };` |
| `pct` | `(n) => n == null ? '\u2014' : `${(n*100).toFixed(1)}%`;` |
| `sxy` | `xs.reduce((a,x,i) => a + x*ys[i], 0);` |
| `sxx` | `xs.reduce((a,x) => a + x*x, 0);` |
| `slope` | `(n*sxy - sx*sy) / (n*sxx - sx*sx \|\| 1);` |
| `intercept` | `(sy - slope*sx) / n;` |
| `ssTot` | `ys.reduce((a,y) => a + (y - yMean)**2, 0) \|\| 1;` |
| `ssRes` | `ys.reduce((a,y,i) => a + (y - (slope*xs[i]+intercept))**2, 0);` |
| `yMean` | `ys.reduce((a,b) => a+b, 0) / n;` |
| `coefficients` | `means.map((_, j) => {` |
| `intercept` | `yMean - coefficients.reduce((s, c, j) => s + c * means[j], 0);` |
| `ssTot` | `ys.reduce((a,y) => a + (y - yMean)**2, 0) \|\| 1;` |
| `predicted` | `intercept + coefficients.reduce((s, c, j) => s + c * xMatrix[i][j], 0);` |
| `uncertainty` | `0.15 + seed(i * 37 + stage.id.length * 13) * 0.20;` |
| `noise` | `(seed(i * 71 + stage.id.length * 23) - 0.5) * 2 * uncertainty;` |
| `mean` | `results.reduce((s, v) => s + v, 0) / iterations;` |
| `std` | `Math.sqrt(results.reduce((s, v) => s + (v - mean) ** 2, 0) / iterations);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CROSS_NAV`, `IMPACT_CATEGORIES`, `ISO_CHECKLIST`, `LCA_STAGES`, `PCR_STANDARDS`, `PIE_COLORS`, `PRODUCT_ARCHETYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Warming Potential (kgCO2e/FU) | — | IPCC AR6 GWP100 characterisation factors | Climate change impact per functional unit across the full product lifecycle |
| Hotspot Stage (%) | — | LCA stage contribution analysis | Lifecycle stage (material, manufacture, transport, use, EoL) contributing the highest share of PCF |
| Data Quality Score | — | Weidema pedigree matrix methodology | Composite reliability score across technology, time, geography, completeness, and method representativeness |
| Allocation Sensitivity (Δ%) | — | ISO 14044 sensitivity analysis | PCF change when switching from economic to physical mass allocation |
- **Bill of materials and supplier data** → Match materials to ecoinvent processes; apply geographic and technology proxies; score data quality → **Process tree with linked background emission factors per material and energy flow**
- **Manufacturing energy and waste data** → Convert utilities to emission equivalents; account for waste treatment and recycling credits → **Manufacturing stage GWP contribution per product unit**
- **End-of-life scenario data** → Model recycling, landfill, incineration routes; apply avoided burden credits per ISO 14044 → **End-of-life stage GWP including recycling credits and disposal impacts**

## 5 · Intermediate Transformation Logic
**Methodology:** Product Carbon Footprint
**Headline formula:** `PCF = Σᵢ (Qᵢ × EFᵢ)`
**Standards:** ['ISO 14040:2006 â€” Principles and Framework', 'ISO 14044:2006 â€” Requirements and Guidelines', 'EC Product Environmental Footprint Category Rules', 'GHG Protocol Product Standard 2011']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).