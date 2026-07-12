# Lifecycle Assessment
**Module ID:** `lifecycle-assessment` · **Route:** `/lifecycle-assessment` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ISO 14040/14044-compliant LCA engine for calculating product carbon footprints and environmental impact across the full value chain from raw material extraction to end-of-life disposal. Supports Scope 3 Category 1 (purchased goods) and Category 11 (use of sold products) quantification and product environmental footprint (PEF) Category Rules compliance for EU Green Claims and CSRD-aligned product disclosures.

> **Business value:** Equips product managers and sustainability analysts with ISO-compliant LCA capabilities to quantify PCFs, identify decarbonisation priorities, and prepare product-level disclosures required under EU Green Claims regulation and CSRD product sustainability requirements.

**How an analyst works this module:**
- Define product system, functional unit, and system boundary in the LCA configuration wizard
- Build the process tree by adding lifecycle stages and linking material and energy flows
- Select background emission factor sources (ecoinvent v3.10, GaBi, or custom) and apply appropriate cut-off criteria
- Run GWP100 calculation and review stage contribution analysis to identify decarbonisation hotspots
- Validate data quality using the pedigree matrix and export ISO 14044-conformant LCA report and PCF declaration

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Btn`, `IMPACT_CATEGORIES`, `ISO_CHECKLIST`, `KPI`, `LCA_STAGES`, `LS_LCA`, `LS_PORT`, `PCR_STANDARDS`, `PERSON_EQUIVALENTS`, `PIE_COLORS`, `PRODUCT_ARCHETYPES`, `Section`, `SortHeader`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `LCA_STAGES` | 7 | `name`, `icon`, `description`, `activities`, `color` |
| `IMPACT_CATEGORIES` | 9 | `name`, `unit`, `description`, `color` |
| `PRODUCT_ARCHETYPES` | 201 | `name`, `unit`, `icon`, `sector`, `commodities`, `stages`, `extraction`, `gwp`, `ap`, `ep`, `odp`, `pocp`, `adp`, `wp`, `lup`, `duration_days` |
| `ISO_CHECKLIST` | 9 | `desc`, `section` |
| `PCR_STANDARDS` | 16 | `standard`, `epd`, `category`, `pcrOperator`, `validUntil`, `scope` |
| `CROSS_NAV` | 6 | `path` |

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
| `predicted` | `intercept + coefficients.reduce((s, c, j) => s + c * xMatrix[i][j], 0);` |
| `uncertainty` | `0.15 + seed(i * 37 + stage.id.length * 13) * 0.20;` |
| `noise` | `(seed(i * 71 + stage.id.length * 23) - 0.5) * 2 * uncertainty;` |
| `mean` | `results.reduce((s, v) => s + v, 0) / iterations;` |
| `std` | `Math.sqrt(results.reduce((s, v) => s + (v - mean) ** 2, 0) / iterations);` |
| `allSectors` | `useMemo(() => [...new Set(PRODUCT_ARCHETYPES.map(p => p.sector))].sort(), []);` |
| `newRate` | `Math.min(1, baseRate * recyclingSlider);` |
| `factor` | `newRate / (baseRate \|\| 0.01);` |
| `stageData` | `useMemo(() => { return LCA_STAGES.map(s => { const d = adjustedStages[s.id] \|\| {};` |
| `hotspotData` | `useMemo(() => { return stageData.filter(s => (s.gwp \|\| 0) > 0).map(s => ({ name: s.name, value: Math.abs(s.gwp \|\| 0), color: s.color }));` |
| `waterFlowData` | `useMemo(() => { return stageData.map(s => ({ name: s.name.split(' ')[0], water: s.wp \|\| 0, color: s.color }));` |
| `contribution` | `10 + s * 30;` |
| `reuseRate` | `recyclingRate * 0.3;` |
| `materialRecovery` | `recyclingRate * 0.85;` |
| `circularScore` | `Math.round((recyclingRate * 40 + reuseRate * 20 + materialRecovery * 25 + biodegradability * 15) * 100);` |
| `mlResults` | `useMemo(() => { const xMatrix = PRODUCT_ARCHETYPES.map(p => { const extr = p.stages.extraction?.gwp \|\| 0;` |
| `simpleXs` | `PRODUCT_ARCHETYPES.map(p => (p.stages.extraction?.gwp \|\| 0) + (p.stages.processing?.gwp \|\| 0));` |
| `max` | `mcResults.results[mcResults.results.length - 1];` |
| `binWidth` | `range / bins;` |
| `idx` | `Math.min(bins - 1, Math.floor((v - min) / binWidth));` |
| `val` | `normMode === 'person_eq' ? ((s[impactFilter] \|\| 0) / (PERSON_EQUIVALENTS[impactFilter] \|\| 1)) : (s[impactFilter] \|\| 0);` |
| `maxVal` | `Math.max(...PRODUCT_ARCHETYPES.map(p => {` |
| `productRanking` | `useMemo(() => { return PRODUCT_ARCHETYPES.map(p => { let totalGwp = 0, totalWp = 0, totalLup = 0;` |
| `headers` | `['Stage', ...IMPACT_CATEGORIES.map(c => `${c.name} (${c.unit})`)];` |
| `rows` | `stageData.map(s => [s.name, ...IMPACT_CATEGORIES.map(c => s[c.id] ?? 0)]);` |
| `csv` | `[headers.join(','), ...rows.map(r => r.join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type:'text/csv' });` |
| `data` | `{ product: product?.name, framework: 'ISO 14040/14044', stages: stageData.map(s => { const o = { stage: s.name }; IMPACT_CATEGORIES.forEach(c => { o[c.id] = s[c.id]; }); return o; }), totals: totalImpacts, personEquivale` |
| `worstStage` | `useMemo(() => stageData.reduce((w, s) => (s.gwp \|\| 0) > (w.gwp \|\| -Infinity) ? s : w, stageData[0]), [stageData]);` |

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

Activity quantities (Q) for each lifecycle stage are multiplied by background emission factors (EF) from ecoinvent or GaBi databases. System boundary follows ISO 14044 cradle-to-grave scope. Allocation follows economic value by default with sensitivity to physical allocation. Uncertainty is propagated using Monte Carlo with 1,000 iterations per product system.

**Standards:** ['ISO 14040:2006 â€” Principles and Framework', 'ISO 14044:2006 â€” Requirements and Guidelines', 'EC Product Environmental Footprint Category Rules', 'GHG Protocol Product Standard 2011']
**Reference documents:** ISO 14040:2006 â€” Environmental Management â€” Life Cycle Assessment â€” Principles and Framework; ISO 14044:2006 â€” Environmental Management â€” Life Cycle Assessment â€” Requirements and Guidelines; European Commission PEF Category Rules Guidance 2021; GHG Protocol Product Life Cycle Accounting and Reporting Standard 2011; ecoinvent v3.10 Database Documentation 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Partial guide↔code mismatch.** The guide states background emission factors come from
> "ecoinvent or GaBi databases" with "uncertainty propagated using Monte Carlo with 1,000 iterations."
> The code's Monte Carlo engine is real (see §7.4) but defaults to **500** iterations (user-adjustable
> up to a max not read in this excerpt), and the underlying per-stage, per-impact-category inventory
> data for all 25 product archetypes is **hand-authored directly in the component file**, not sourced
> from a live ecoinvent/GaBi database call. The ISO 14040/14044 structure, PCR standards, and
> regression/Monte-Carlo statistics are otherwise genuinely implemented — this is one of the more
> methodologically serious modules in the batch.

### 7.1 What the module computes

`PRODUCT_ARCHETYPES` holds 25 cradle-to-grave product systems (EV battery, solar panel, wind
turbine, steel beam, cement, palm oil, cotton T-shirt, smartphone, office building, diesel truck,
pharma pill, plastic bottle, paper packaging, concrete building, diesel generator, electric bus,
organic food basket, bottled water, steel bridge, hydrogen fuel cell, fast food meal, glass window,
rubber tire, and 2 more), each with **6 LCA stages × 8 impact categories** of hand-entered
inventory values (GWP, AP, EP, ODP, POCP, ADP, water footprint, land use), plus a
`total_lifecycle_gwp` and `net_positive` flag.

```
PCF (per product) = Σ_stage Σ_category stage_value[category]
```
Negative stage values represent avoided emissions (e.g. EV battery `use` stage = −15,000 kg CO₂e vs
an ICE vehicle baseline; wind turbine `use` = −1,800,000 kg CO₂e of grid offset over 20yr).

### 7.2 Parameterisation

| Construct | Detail | Provenance |
|---|---|---|
| `LCA_STAGES` (6) | Extraction, Processing, Manufacturing, Distribution, Use, End of Life | ISO 14044 standard cradle-to-grave stage taxonomy |
| `IMPACT_CATEGORIES` (8) | GWP, AP, EP, ODP, POCP, ADP, Water Footprint, Land Use | Standard LCIA midpoint categories (CML/ReCiPe-style) |
| `PERSON_EQUIVALENTS` | GWP 4,700 kgCO₂e/capita/yr, AP 25 kg SO₂e, water 1,385,000 L/capita/yr, etc. | Real global per-capita average reference constants, used to normalise a product's footprint into "person-equivalents" |
| 25×6×8 = 1,200 inventory cells | Hand-authored per product/stage/category | Plausible, order-of-magnitude-consistent values (e.g. wind turbine extraction GWP 180,000 kg vs EV battery 2,800 kg) but **not traced to a specific ecoinvent process ID** — treat as illustrative demo data, not audit-grade LCI |
| `ISO_CHECKLIST` (8 items) | Goal & Scope, LCI, LCIA, Interpretation, Critical Review, Data Quality, Allocation, Cut-off | Correct ISO 14040/14044 clause references (§5.2, §5.3, §7, etc.) |
| `PCR_STANDARDS` (15 rows) | Real Product Category Rules (EN 15804+A2, IEC 61215, EN 197-1, RSPO P&C, Euro VI, ASHRAE 90.4...) mapped to product archetypes | Genuine, correctly-named industry PCR/EPD standards |
| Monte Carlo uncertainty band | `0.15 + sr(seed)×0.20` → 15–35% relative noise per stage per iteration | Author-chosen band, not calibrated to a pedigree-matrix data-quality score despite the guide citing "Weidema pedigree matrix" |
| Circularity weights | `40% recyclingRate + 20% reuseRate + 25% materialRecovery + 15% biodegradability` | Author-defined composite, no external circularity-index citation |
| `biodegradability` | Hard-coded per product id: cotton 0.65, palm oil 0.90, organic food 0.85, paper 0.75, else 0.02 | Author judgement, not derived from material composition |

### 7.3 Calculation walkthrough

- **Stage/impact aggregation**: `totalImpacts[cat] = Σ_stage adjustedStages[stage][cat]` across the 6
  stages for the selected product — a straightforward cradle-to-grave sum.
- **Recycling what-if slider** (`recyclingSlider`, 0.5×–5×): scales the product's baseline
  `end_of_life.recycling_rate` by the multiplier (capped at 100%), then **re-scales every negative
  (avoided-emission) end-of-life impact value proportionally**:
  `factor = newRate / baseRate`; `eol[cat] = baseValue × factor` for `cat` where the baseline value
  is negative. Positive end-of-life values (e.g. residual disposal emissions) are **not** rescaled —
  only the credit side moves with the slider.
- **Monte Carlo (§7.4)**: 500 default iterations per product, re-drawing every stage's GWP with
  independent seeded noise, producing p5/p50/p95 and mean/std of total lifecycle GWP.
- **Simple linear regression** (`linearRegression`) and **multivariate regression**
  (`multiVarRegression`, coordinate-descent-style: each coefficient fit independently via simple
  regression against the residual mean, not a true multiple-OLS solve via matrix inversion) predict
  a target metric (e.g. total GWP) from stage-level inputs (extraction + processing GWP) across the
  25-product panel, reporting R².
- **Circularity score**: `round((recyclingRate×40 + reuseRate×20 + materialRecovery×25 +
  biodegradability×15) × 100)`, where `reuseRate = recyclingRate×0.3` and
  `materialRecovery = recyclingRate×0.85` are themselves derived from `recyclingRate` — so 3 of the 4
  weighted components collapse to a single degree of freedom
  (`recyclingRate × (40+0.3×20+0.85×25) = recyclingRate × 67.25`), plus the independent
  `biodegradability×15` term.
- **Person-equivalents normalisation**: `personEquivalents[cat] = totalImpacts[cat] /
  PERSON_EQUIVALENTS[cat]`, e.g. a product's GWP expressed as "X years of one person's average
  carbon footprint."

### 7.4 Worked example — Monte Carlo on the Solar Panel archetype

Baseline stage GWP values: extraction 120, processing 250, manufacturing 180, distribution 30, use
−2,800, end-of-life −50 → deterministic sum = **−2,270 kg CO₂e** (matches `total_lifecycle_gwp`).

For Monte Carlo iteration `i=0`, stage `extraction` (`id.length=10`):
```
uncertainty = 0.15 + sr(0×37 + 10×13)×0.20 = 0.15 + sr(130)×0.20
noise       = (sr(0×71 + 10×23) − 0.5) × 2 × uncertainty = (sr(230) − 0.5) × 2 × uncertainty
adjustedGwp = 120 × (1 + noise)
```
Repeating across all 6 stages and summing gives one Monte Carlo draw of total GWP; after 500 draws,
sorting gives `p5`/`p50`/`p95`, and `mean`/`std` are computed directly. Because the `use` stage
(−2,800) dominates magnitude, its noise term dominates the spread of the final distribution — a
correct MC property, even though the underlying uncertainty band (15–35%) is an assumption rather
than a pedigree-matrix-derived figure.

### 7.5 Companion analytics

- **Circularity Assessment tab** — 4-metric card grid (recycling rate, reuse potential, material
  recovery, biodegradability) plus the composite score, live-updating with the recycling slider.
- **Improvement Recommendations tab** — 4 hard-coded priority/action/potential-reduction rows
  (Extraction, Processing, End-of-Life, Distribution) with illustrative "15–30%"/"20–40%" reduction
  ranges — qualitative guidance, not derived from the product's own sensitivity results.
- **PCR/EPD Standards tab** — reference table only, no compliance computation.

### 7.6 Data provenance & limitations

- **The entire 1,200-cell inventory is synthetic/hand-authored**, not pulled from ecoinvent v3.10 or
  GaBi as the guide claims — this should be corrected in the guide or flagged in-product as
  illustrative LCA data pending real background-database integration.
- Monte Carlo uses the platform's `sr()` seeded PRNG (deterministic across renders, not a true random
  stream) with an author-chosen 15–35% uncertainty band rather than a computed pedigree-matrix score
  (temporal/geographical/technological/completeness/method representativeness per Weidema), despite
  the guide naming that methodology.
- `multiVarRegression`'s coefficient-fitting approach (per-variable simple regression, not joint OLS)
  will misestimate coefficients when predictor variables are correlated — a genuine statistical
  simplification worth flagging for any decision use.
- Circularity score's `reuseRate`/`materialRecovery` being deterministic multiples of `recyclingRate`
  means the "4-metric" circularity card is effectively driven by 2 independent inputs
  (recyclingRate, biodegradability), not 4.

**Framework alignment:** ISO 14040:2006 / ISO 14044:2006 stage and clause structure is accurately
represented (§7.2 ISO checklist). EC Product Environmental Footprint Category Rules and GHG Protocol
Product Standard are named; the 15-row PCR/EPD table (EN 15804+A2, IEC 61215/61646, RSPO P&C, Euro
VI, ASHRAE 90.4, ISO 14687) correctly reflects real published standards. The Monte Carlo and
regression tooling is genuinely implemented, general-purpose statistical code — the primary gap is
that its **inputs** (the LCI inventory) are illustrative rather than database-sourced.

## 9 · Future Evolution

### 9.1 Evolution A — Background factor database and a user-built process tree (analytics ladder: rung 2 → 3)

**What.** §7 rates this "one of the more methodologically serious modules in the batch": a real Monte-Carlo engine (500 iterations, user-adjustable), genuine OLS/multivariate regression statistics, ISO 14040/14044 structure, real PCR standards, and 201 product archetypes with per-stage, nine-impact-category inventories. Its two limits: the archetype inventories are hand-authored in the component file rather than sourced from ecoinvent/GaBi as the guide claims, and the workflow the §1 overview promises — define functional unit, build a process tree, link flows — doesn't exist; users pick an archetype, not build a system. Evolution A: (1) a backend background-factor service over openly-licensable LCI data (ecoinvent requires licence — start with the EF 3.1/PEF datasets and USLCI/ELCD open sources, licence-gated ecoinvent later), with per-factor source and pedigree metadata; (2) a real process-tree builder persisting product systems to DB (`lca_systems`, `lca_flows`), computing `PCF = Σ Q_i × EF_i` over user flows; (3) the pedigree-matrix data-quality score computed from actual factor metadata rather than the current seeded uncertainty term (`0.15 + seed(...)·0.20`).

**How.** (1) `POST /lca/compute` runs stage contribution, MC uncertainty (with the seeded noise replaced by pedigree-derived distributions per Weidema convention), and allocation sensitivity server-side. (2) Archetypes remain as starting templates, relabeled "reference systems (illustrative inventories)" with the hand-authored provenance stated. (3) The circularity score's weights (40/20/25/15) documented or sourced. (4) A cross-check case pins in bench_quant against a published PEF study result.

**Prerequisites.** Open LCI data ingestion; DB persistence for product systems (currently localStorage-scale). **Acceptance:** a user-built two-stage system computes PCF from cited factors; MC bands derive from pedigree scores, not seeds; the same system reproduces a published reference PCF within documented tolerance.

### 9.2 Evolution B — LCA modelling copilot with ISO-conformance discipline (LLM tier 2)

**What.** LCA is expert-workflow-heavy — exactly where a copilot compresses effort: "set up a cradle-to-gate system for an aluminium beverage can — suggest stages and candidate factors", "which stage drives my GWP hotspot and what's the decarbonisation lever?", "what does switching from economic to mass allocation do to the PCF?" (the allocation-sensitivity machinery exists), "draft the ISO 14044 goal-and-scope section." Factor suggestion is the highest-value assist: mapping BOM line items to LCI processes is the field's slowest step and a classic retrieval task.

**How.** Tier 2 over the Evolution A compute/factor routes: factor suggestions return candidate processes with geography/technology-proxy flags and pedigree scores, analyst-confirmed before entering the tree — proxy selection is judgement the ISO checklist requires documenting, so confirmations write to the audit trail. Report drafting maps to the `ISO_CHECKLIST` sections with every figure tool-validated and cut-off/allocation choices stated. Green-claims discipline: PCF comparisons between products are only rendered with functional-unit equivalence confirmed (the EU Green Claims context makes loose comparisons legally risky — the copilot enforces the comparability check ISO 14044 mandates).

**Prerequisites (hard).** Evolution A's factor service and persistence (factor suggestions need a real database to retrieve from); Phase 2 tooling. **Acceptance:** every suggested factor carries source/geography/pedigree metadata and a confirmation state; generated report sections map to ISO checklist items; cross-product comparisons blocked without functional-unit equivalence.