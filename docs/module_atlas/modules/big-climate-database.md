# Big Climate Database
**Module ID:** `big-climate-database` · **Route:** `/big-climate-database` · **Tier:** B (frontend-computed) · **EP code:** EP-DATA2 · **Sprint:** Platform

## 1 · Overview
Explorer for the Big Climate Database covering 2,700+ food system product lifecycle emission records across agriculture, processing, packaging, transport, and retail stages. Uses EU JRC EF3.0 methodology for environmental footprint calculation, enabling product carbon footprint comparison and supply chain emission hotspot identification.

> **Business value:** Used by food & beverage companies, retailers, sustainable procurement teams, and policy researchers to benchmark product carbon footprints and identify the highest-impact supply chain interventions.

**How an analyst works this module:**
- Search database by product category or supply chain stage
- Compare carbon footprints across product variants and regions of origin
- Identify supply chain stage hotspots for targeted reduction
- Export product carbon footprint comparison for procurement policy or labelling

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CAT_COLORS`, `COUNTRY_COLORS`, `Card`, `KPI`, `PHASES`, `PHASE_COLORS`, `PHASE_LABELS`, `Select`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `uniqueNames` | `useMemo(() => [...new Set(db.products.map(p => p.name))].sort(), [db.products]);` |
| `avgTotal` | `all.length > 0 ? (all.reduce((s, p) => s + p.total, 0) / all.length) : 0;` |
| `highest` | `all.length > 0 ? [...all].sort((a, b) => b.total - a.total)[0] : null;` |
| `lowest` | `all.length > 0 ? [...all].sort((a, b) => a.total - b.total)[0] : null;` |
| `catAvg` | `db.categories.map(cat => {` |
| `catAvgSorted` | `[...catAvg].sort((a, b) => b.avg - a.avg);` |
| `pieData` | `Object.entries(phaseSum).map(([name, value]) => ({ name, value: +value.toFixed(2) }));` |
| `totalPages` | `Math.max(1, Math.ceil(sorted.length / PER_PAGE));` |
| `safePage` | `Math.min(page, totalPages - 1);` |
| `pageItems` | `sorted.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);` |
| `grouped` | `comparison.length > 0 ? comparison.map(p => ({` |
| `countryAvg` | `db.countries.map(c => {` |
| `sorted` | `[...items].sort((a, b) => b.total - a.total);` |
| `top10` | `sorted.slice(0, 10).map(p => ({ name: (p.name.length > 30 ? p.name.slice(0, 27) + '...' : p.name) + ` (${p.country})`, total: p.total }));` |
| `bottom10` | `[...items].sort((a, b) => a.total - b.total).slice(0, 10).map(p => ({ name: (p.name.length > 30 ? p.name.slice(0, 27) + '...' : p.name) + ` (${p.country})`, total: p.total }));` |
| `radarData` | `PHASE_LABELS.map((label, i) => ({` |
| `totals` | `items.map(p => p.total);` |
| `maxT` | `totals.length > 0 ? Math.max(...totals) : 1;` |
| `bucketSize` | `maxT > 0 ? maxT / bucketCount : 1;` |
| `buckets` | `Array.from({ length: bucketCount }, (_, i) => ({ range: `${(i * bucketSize).toFixed(1)}-${((i + 1) * bucketSize).toFixed(1)}`, count: 0 }));` |
| `top20` | `[...all].sort((a, b) => (b[selPhase] \|\| 0) - (a[selPhase] \|\| 0)).slice(0, 20).map(p => ({` |
| `scatterData` | `all.filter(p => p.total > 0).map((p, i) => ({` |
| `catPhaseAvg` | `db.categories.map(cat => {` |
| `avg` | `items.length > 0 ? items.reduce((s, p) => s + (p[selPhase] \|\| 0), 0) / items.length : 0;` |
| `catPhaseSorted` | `[...catPhaseAvg].sort((a, b) => b.avg - a.avg);` |
| `countryPhaseAvg` | `db.countries.map(c => {` |
| `importHeavy` | `[...all].filter(p => p.transport > p.agriculture).sort((a, b) => (b.transport - b.agriculture) - (a.transport - a.agriculture)).slice(0, 15);` |
| `agriDom` | `[...all].filter(p => p.total > 0 && p.agriculture / p.total > 0.6).sort((a, b) => b.agriculture - a.agriculture).slice(0, 15);` |
| `dominant` | `PHASES.reduce((best, ph) => (p[ph] \|\| 0) > (p[best] \|\| 0) ? ph : best, PHASES[0]);` |
| `PROTEIN_CATS` | `['Meat/poultry/other animals', 'Seafood', 'Milk/butter/cream/yougurts/cheese/eggs/substitutes', 'Milk/eggs/substitute products'];` |
| `familyAvg` | `Object.entries(grouped).map(([family, items]) => {` |
| `familySorted` | `[...familyAvg].sort((a, b) => b.total - a.total);` |
| `plantAvg` | `familyAvg.find(f => f.family === 'Plant-Based');` |
| `annualKg` | `swapKgWeek * 52;` |
| `annualSavings` | `fromProduct && toProduct ? (fromProduct.total - toProduct.total) * annualKg / 1000 : 0;` |
| `waterfallData` | `fromProduct && toProduct ? PHASE_LABELS.map((label, i) => ({` |
| `BATCH_SWAPS` | `useMemo(() => { const swaps = [ { from: 'Beef, minced, 15-20% fat, raw', to: 'Tofu, firm', label: 'Beef mince to Tofu' }, { from: 'Pork, minced, 5-10% fat, raw', to: 'Tofu, firm', label: 'Pork mince to Tofu' }, { from: 'Cheese, Gouda, 45+, fatty', to: 'Tofu, firm', label: 'Gouda to Tofu' }, { from: 'Butter, unsalted', to: 'Oil, rapeseed',` |
| `saving` | `fp && tp ? fp.total - tp.total : 0;` |
| `coverageMatrix` | `db.categories.map(cat => {` |
| `row` | `{ category: cat.length > 30 ? cat.slice(0, 27) + '...' : cat };` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CAT_COLORS`, `PHASES`, `PHASE_LABELS`, `PROTEIN_CATS`, `TABS`
**Shared context buses:** `BigClimateDbContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Product Carbon Footprint (kgCO2e/kg) | `Σ(stage_emissions) from farm to retail` | EF3.0 LCA records + GLEAM 2.0 | Beef: 14-100 kgCO2e/kg (land use variation); milk: 1.2-3.2 kgCO2e/L; tofu: 1.6-3.5 kgCO2e/kg; wheat: 0.3-1.1 kgCO2e/kg. |
| Land Use Change Emission Share (%) | `LUC_emissions / total_product_CF × 100` | Pendrill et al. (2022) LUC emission database | For beef from deforestation-risk regions, LUC can constitute 40-80% of product footprint; key screen for EUDR compliance. |
| Supply Chain Stage Hotspot | `stage_with_max_emission_share` | EF3.0 stage breakdown | Agriculture dominates for animal products (>70%) and rice (>85%); packaging dominates for highly processed snack foods (>40%). |
- **EF3.0 LCA records + GLEAM 2.0 + Pendrill LUC database** → Stage emission aggregation → product carbon footprint → hotspot identification → **Food product carbon footprint database for procurement, labelling, and supply chain decarbonisation**

## 5 · Intermediate Transformation Logic
**Methodology:** Food System LCA via EF3.0 Methodology
**Headline formula:** `product_CF = Σ(stage_i_emissions) = agriculture + processing + packaging + transport + retail + FLOSS`

EF3.0 characterisation factors cover 16 impact categories; carbon footprint uses GWP100 values from IPCC AR6 (CH4 fossil: 29.8, CH4 biogenic: 27.9, N2O: 273). Animal products dominate at 14.5 kgCO2e/kg beef, 2.9 kgCO2e/kg poultry, vs 1.4 kgCO2e/kg wheat. FLOSS (food loss and waste, supply chain) adds typically 15-25% to farmgate emissions for perishables.

**Standards:** ['EU JRC Environmental Footprint EF3.0 (2019)', 'IPCC AR6 Chapter 5 Food Systems', 'FAO GLEAM 2.0 Livestock GHG Model']
**Reference documents:** EU JRC Environmental Footprint EF3.0 Methodology Report (2019); Poore & Nemecek (2018) Reducing Food's Environmental Impacts Science; FAO GLEAM 2.0 Global Livestock Environmental Assessment Model

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry attributes the dataset to
> the **EU JRC Environmental Footprint EF3.0** methodology with lifecycle phases
> *agriculture / processing / packaging / transport / retail / FLOSS*. The code
> header states the real source is the **CONCITO Big Climate Database (2-0 LCA,
> CC-BY, v1.2 2024)** and the phases actually present are `agriculture, iluc,
> processing, packaging, transport, retail` — **iLUC (indirect land-use change),
> not FLOSS**, and no explicit retail-FLOSS split. Countries are DK/GB/FR/ES/NL,
> units are **tCO₂e per tonne product**. The sections below document CONCITO as
> implemented; EF3.0 is not used.

### 7.1 What the module computes

This is a read-only analytics explorer over a static LCA table (`db.products`,
`db.categories`, `db.countries` from `BigClimateDbContext`). Each product's total
footprint is a stored sum of six phase columns; the page only *aggregates* it:

```js
product.total = agriculture + iluc + processing + packaging + transport + retail
avgTotal      = Σ product.total / n
catAvg        = mean(product.total) grouped by category
countryAvg    = mean(product.total) grouped by country (DK/GB/FR/ES/NL)
```

Ten tabs slice the same table: rankings (top/bottom-10), phase pie (`phaseSum`
across products), category radar, histogram buckets (`maxT/bucketCount`), a
scatter of one phase vs total, an import-heavy screen (`transport > agriculture`),
an agriculture-dominated screen (`agriculture/total > 0.6`), a protein-family
comparison, and a diet-swap savings calculator.

### 7.2 Parameterisation

| Element | Definition | Provenance |
|---|---|---|
| Phases | agriculture, iLUC, processing, packaging, transport, retail | CONCITO column schema |
| Total | Σ of 6 phases (stored) | CONCITO precomputed |
| Countries | DK, GB, FR, ES, NL | CONCITO consumption-basis variants |
| `PROTEIN_CATS` | meat/poultry, seafood, dairy/eggs | Hard-coded family grouping |
| Diet-swap saving | `(from.total − to.total) × swapKg×52 / 1000` | Linear substitution |
| `bucketCount` histogram | `maxT / bucketCount` bin width | Display heuristic |

The only PRNG (`sr`) present is used for jitter in scatter positioning, **not** for
any emission value — all footprints are real CONCITO records.

### 7.3 Calculation walkthrough

1. `useBigClimateDb()` loads the product table into context.
2. KPIs: dataset size, mean total, highest/lowest product (sorted copies).
3. Per-tab groupings recompute category/country means and phase sums on the fly.
4. Diet-swap: pick `fromProduct`/`toProduct`; annualised saving = per-kg total
   difference × weekly kg × 52, in tonnes; a waterfall shows which phase drives it.
5. `BATCH_SWAPS` precomputes several canonical substitutions (Beef mince→Tofu,
   Gouda→Tofu, Butter→Rapeseed oil) and their per-kg savings.

### 7.4 Worked example

Diet swap: `Beef, minced 15–20% fat` (total ≈ 25 tCO₂e/t = 25 kgCO₂e/kg) →
`Tofu, firm` (total ≈ 2.0 kgCO₂e/kg), swapping 1 kg/week:

| Step | Computation | Result |
|---|---|---|
| Per-kg saving | 25 − 2.0 | 23.0 kgCO₂e/kg |
| Annual kg | 1 × 52 | 52 kg |
| Annual saving | 23.0 × 52 / 1000 | **1.20 tCO₂e/yr** |

The waterfall attributes most of that 23 kg gap to the *agriculture* phase (enteric
methane + feed), the signature of ruminant footprints in the CONCITO data.

### 7.5 Companion analytics

- **Import-heavy screen** flags products where transport emissions exceed
  agriculture — a proxy for air-freighted perishables.
- **Agriculture-dominated screen** (`agriculture/total > 0.6`) surfaces the
  ruminant and rice products where farm-gate emissions dominate.
- **Coverage matrix** maps categories × phases so gaps in the dataset are visible.

### 7.6 Data provenance & limitations

- Emission values are **real** (CONCITO Big Climate Database, CC-BY) — not seeded.
  The platform's `sr()` PRNG touches only chart jitter.
- The five country variants reflect consumption-basis differences (import mix), not
  production differences; totals are cradle-to-retail-gate, excluding consumer-phase
  cooking and post-consumer waste.
- Linear diet-swap assumes gram-for-gram protein substitution with no adjustment for
  protein density or displaced land — a simplification vs a full consequential LCA.
- iLUC is a modelled, contested component; CONCITO's attributional iLUC values may
  differ materially from EF3.0 or GLEAM figures the guide references.

**Framework alignment:** CONCITO / 2-0 LCA attributional food LCA (the actual
source) · IPCC AR6 GWP100 characterisation underlies the CO₂e conversion · the guide's
EF3.0, GLEAM 2.0 and Pendrill LUC references describe adjacent methodologies not used
here. No §8 model spec is warranted — the module is a faithful explorer over a real
published dataset, and its only modelling act (linear diet substitution) is disclosed.

## 9 · Future Evolution

### 9.1 Evolution A — Move CONCITO into the refdata layer and correct the attribution (analytics ladder: rung 1 → 2)

**What.** This is a genuinely useful read-only explorer over real LCA data — but with a documented attribution error: the guide claims EU JRC EF3.0 methodology with a FLOSS phase, while the code's actual source is the **CONCITO Big Climate Database (2-0 LCA, CC-BY, v1.2 2024)** with phases `agriculture, iluc, processing, packaging, transport, retail` — iLUC, not FLOSS. The dataset ships as a static frontend context (`BigClimateDbContext`), so 2,700+ records load client-side and no other module can query them. Evolution A fixes the provenance and promotes the data server-side.

**How.** (1) Correct MODULE_GUIDES and all UI source labels to CONCITO v1.2 CC-BY (the licence requires attribution — currently mislabelled, which is a compliance issue, not just a doc bug). (2) Ingest the table into a `ref_food_lca` refdata table served via `/api/v1/refdata`, with version pinning so a CONCITO v1.3 update is a data migration, not a code change; the page's aggregations (category/country means, hotspot screens, swap calculator) move to SQL or stay client-side over a paged API. (3) Cross-module payoff: the food-system, supply-chain, and procurement modules can then join product footprints by name/category instead of duplicating constants. (4) Rung 2: the swap calculator (`annualSavings = (from.total − to.total) × kg/yr`) generalises to basket-level scenario analysis — re-price a whole procurement basket under substitution rules.

**Prerequisites.** CONCITO licence attribution text in the UI; a name-matching convention for cross-module joins (product strings are Danish-database-flavoured). **Acceptance:** the UI names CONCITO with version and licence; `/refdata` serves the products with phase columns summing to stored totals; one downstream module consumes the table via API rather than a copied constant.

### 9.2 Evolution B — Food-footprint copilot over the product table (LLM tier 2)

**What.** The explorer's ten tabs answer fixed questions; a copilot answers composed ones: "what's the lowest-carbon protein at retail in the UK subset, and what drives beef's footprint here — agriculture or iLUC?", "build a swap plan for our canteen's top five items and quantify annual savings" — each answered by querying the real table (rankings, phase decomposition, swap arithmetic) and narrating with the module's own analytical vocabulary (hotspot phases, import-heavy screen, protein-family comparison).

**How.** Read-only tool schemas over the Evolution-A refdata API (search, aggregate, phase-decompose, swap-compute); grounding corpus is this Atlas record plus the CONCITO methodology notes (units are tCO₂e/tonne; §7's mismatch flag prevents the copilot from citing EF3.0 or FLOSS). The swap calculator's honest framing matters: savings are per-kg LCA differences, not verified reductions — the copilot must present them as procurement-screening estimates, and refuse questions outside the database's boundary (no non-food products, no company-specific footprints, five countries only). Product-name fuzziness is handled by returning candidate matches for user confirmation, never silent best-guess joins.

**Prerequisites.** Evolution A's API (client-side context is not tool-callable); nothing else hard — the data is real today. **Acceptance:** every kgCO₂e figure traces to a table query; swap-plan answers show the from/to products and arithmetic; a question about an uncovered country or category returns the coverage boundary.