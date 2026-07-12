# Product Anatomy
**Module ID:** `product-anatomy` · **Route:** `/product-anatomy` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Breaks down product-level climate and ESG impact by material, manufacturing process, use phase, and end-of-life, aligned to LCA methodology.

> **Business value:** Enables product teams and sustainability managers to identify emission hotspots and optimise product design for carbon reduction compliance with ISO 14067.

**How an analyst works this module:**
- Define product bill of materials and process map.
- Assign emission factors per material and process stage.
- Run life cycle stage attribution analysis.
- Identify hotspots and model reduction scenarios.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `CARBON_EXTERNALITY_PER_KG`, `Card`, `ESG_COLORS`, `KPI`, `LS_CUSTOM`, `LS_PORT`, `MAT_COLORS`, `PRODUCT_ANATOMY`, `PRODUCT_KEYS`, `Section`, `WATER_EXTERNALITY_PER_L`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtUSD` | `n=>{if(n==null)return'\u2014';if(n>=1e9)return`$${(n/1e9).toFixed(1)}B`;if(n>=1e6)return`$${(n/1e6).toFixed(1)}M`;if(n>=1000)return`$${(n/1000).toFixed(1)}K`;return`$${Number(n).toFixed(2)}`};` |
| `fmtG` | `n=>{if(n==null)return'\u2014';if(n>=1e6)return`${(n/1e6).toFixed(1)} t`;if(n>=1000)return`${(n/1000).toFixed(1)} kg`;return`${Number(n).toFixed(0)} g`};` |
| `fmtL` | `n=>{if(n==null)return'\u2014';if(n>=1e6)return`${(n/1e6).toFixed(1)} ML`;if(n>=1000)return`${(n/1000).toFixed(1)} kL`;return`${Number(n).toFixed(0)} L`};` |
| `totalCost` | `withRisk.reduce((s, c) => s + (c.cost_usd \|\| 0), 0);` |
| `recyclablePct` | `comps.length ? Math.round(recyclableCount / comps.length * 100) : 0;` |
| `avgRecRate` | `comps.filter(c => c.recycling_rate).reduce((s, c) => s + c.recycling_rate, 0) / (comps.filter(c => c.recycling_rate).length \|\| 1) * 100;` |
| `sorted` | `useMemo(()=>[...comps].sort((a,b)=>{const av=a[sortCol]??-999,bv=b[sortCol]??-999;return sortDir?(av>bv?1:-1):(av<bv?1:-1)}),[comps,sortCol,sortDir]);  const totals=useMemo(()=>{ const t={cost:0,weight:0,carbon:0,water:0,conflict:0,childLabor:0,recyclable:0,totalMats:comps.length};` |
| `anatomyData` | `useMemo(()=>comps.filter(c=>(viewMode==='weight'?c.quantity_g:c.cost_usd)>0).map((c,i)=>({...c,value:viewMode==='weight'?c.quantity_g:c.cost_usd,fill:MAT_COLORS[i%MAT_COLORS.length]})),[comps,viewMode]);` |
| `waterfallData` | `useMemo(()=>{ const raw=comps.filter(c=>c.cost_usd>0).sort((a,b)=>b.cost_usd-a.cost_usd);` |
| `cum` | `0;return raw.map(c=>{const start=cum;cum+=c.cost_usd;return{name:c.material.slice(0,12),cost:c.cost_usd,start,fill:MAT_COLORS[raw.indexOf(c)%MAT_COLORS.length]}});` |
| `esgPie` | `useMemo(()=>comps.filter(c=>c.esg_risk).map((c,i)=>({name:c.material,value:c.esg_risk,fill:MAT_COLORS[i%MAT_COLORS.length]})),[comps]);` |
| `carbonBars` | `useMemo(()=>comps.filter(c=>c.carbon_g>0).sort((a,b)=>b.carbon_g-a.carbon_g).map(c=>({name:c.material.slice(0,14),carbon:c.carbon_g})),[comps]);` |
| `waterBars` | `useMemo(()=>comps.filter(c=>c.water_l>0).sort((a,b)=>b.water_l-a.water_l).map(c=>({name:c.material.slice(0,14),water:c.water_l})),[comps]);` |
| `geopoliticalRisks` | `useMemo(()=>comps.filter(c=>c.geopolitical_risk\|\|c.source_countries?.some(s=>s.includes('90%')\|\|s.includes('80%'))),[comps]);  // Product comparison radar data const radarCompareData = useMemo(() => { if (!showCompare) return [];` |
| `allProductsRanked` | `useMemo(() => { return PRODUCT_KEYS.map(k => { const p = PRODUCT_ANATOMY[k];` |
| `csv` | `[hdr,...rows].map(r=>r.join(',')).join('\n');` |
| `total` | `anatomyData.reduce((s,x)=>s+x.value,0);` |
| `pctW` | `Math.max(2,(c.value/total*100));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MAT_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Total PCF (kgCO₂e/unit) | — | LCA Engine | Cradle-to-grave carbon footprint per unit of product output. |
| Hotspot Stage | — | Stage Attribution | Life cycle stage contributing largest share of total product carbon footprint. |
| Recycled Content (%) | — | Material Registry | Proportion of product material input from recycled or secondary sources. |
- **Bill of materials + process energy data + EF database** → Stage-level emission calculation; hotspot attribution; scenario modelling → **Product-level LCA carbon report and reduction roadmap**

## 5 · Intermediate Transformation Logic
**Methodology:** Product Carbon Footprint
**Headline formula:** `PCF = Σ(mᵢ × EFᵢ) across cradle-to-grave life cycle stages`

Sum of material and process emission factors weighted by quantity across all product life cycle stages.

**Standards:** ['ISO 14067:2018', 'GHG Protocol Product Standard']
**Reference documents:** ISO 14067:2018 Carbon Footprint of Products; GHG Protocol Product Life Cycle Accounting Standard (2011)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial mismatch.** The guide frames this as a **life-cycle-stage carbon
> attribution** — `PCF = Σ(mᵢ × EFᵢ)` across cradle-to-grave stages, hotspot "Manufacturing (62%)",
> ISO 14067. The code does **not** multiply mass × emission factor at run time (each component
> carries a pre-baked absolute `carbon_g`), and it does **not** attribute to life-cycle *stages*
> (Raw Materials / Manufacturing / Use / EoL) — carbon is bucketed **per material**, not per stage.
> What the module genuinely delivers is a **curated bill-of-materials teardown** for 30 real products
> with per-component carbon, water, cost, ESG risk, conflict-mineral and child-labour flags, plus a
> cost-weighted ESG score and a circularity score. Unusually for a B-tier page, the data is
> hand-researched and realistic, not `sr()`-seeded.

### 7.1 What the module computes

**Cost-weighted product ESG risk** (the headline ESG number):

```js
withRisk  = components.filter(esg_risk > 0)
totalCost = Σ cost_usd
ESG_score = round( Σ (esg_risk × cost_usd) / totalCost )   // spend-weighted mean risk
            // falls back to unweighted mean if totalCost ≤ 0
```

**Circularity score** (0–100 composite):

```js
recyclablePct = #{recyclable} / #components × 100
avgRecRate    = mean(recycling_rate over components that have one) × 100
circular      = round( recyclablePct×0.4 + avgRecRate×0.3 + end_of_life.recycled_pct×0.3 )
```

**Aggregate footprints** (per selected product): `Σ carbon_g`, `Σ water_l`, `Σ cost_usd`,
`recyclablePct`, `avgRecRate`. **Externality cost** uses two conversion constants:
`CARBON_EXTERNALITY_PER_KG = 0.05` ($/kg) and `WATER_EXTERNALITY_PER_L = 0.002` ($/L).
Charts: anatomy pie (by weight or cost), cost waterfall (sorted, cumulative), carbon/water bars,
ESG-risk pie, and a cross-product ranking (`allProductsRanked`).

### 7.2 Parameterisation / provenance

| Quantity | Source | Provenance |
|---|---|---|
| Component mass, cost, carbon_g, water_l | `PRODUCT_ANATOMY[product].components[]` | **hand-curated real data** (30 products) |
| esg_risk (0–100), conflict_mineral, child_labor_risk | per component | hand-researched (e.g. Cobalt 85 "Critical DRC") |
| recycling_rate, recyclable | per component | hand-curated |
| end_of_life recycled/landfill % | per product | hand-curated |
| Carbon externality | $0.05/kg | in-code constant (low vs social-cost-of-carbon) |
| Water externality | $0.002/L | in-code constant |
| ESG-score weighting | cost-weighted | in-code method |
| Circularity weights | 0.4 / 0.3 / 0.3 | in-code heuristic |

The per-component `carbon_g`/`water_l` values are realistic (e.g. smartphone aluminium casing 270 g
CO₂; silicon processor 32,000 L water) and consistent with published LCA teardowns, but they are
**stored constants**, not computed from `mass × EF`.

### 7.3 Calculation walkthrough

1. Select product → `components[]` loaded.
2. `computeProductESGScore` cost-weights each component's `esg_risk` → headline ESG score.
3. `computeCircularScore` blends recyclable share, mean recycling rate, and EoL recycled % → 0–100.
4. Totals: sum carbon/water/cost; anatomy/waterfall/bar charts consume the same arrays.
5. `allProductsRanked` maps every product through the two scorers for the cross-product table.
6. Externality cost = `Σcarbon_kg × 0.05 + Σwater_l × 0.002`.

### 7.4 Worked example (Smartphone ESG score, abbreviated)

Using the highest-cost risk-bearing components (cost in $, esg_risk):

| Component | cost | esg_risk | esg_risk×cost |
|---|---|---|---|
| IP & Software | 450 | 20 | 9,000 |
| Silicon | 85 | 35 | 2,975 |
| Labor & Assembly | 12 | 65 | 780 |
| Glass (Gorilla) | 3.50 | 30 | 105 |
| Gold | 2.50 | 65 | 162.5 |
| Cobalt | 0.18 | 85 | 15.3 |

Because `IP & Software` ($450, risk 20) dominates `totalCost`, the cost-weighted ESG score is
pulled **low** (~24–28) despite Cobalt's risk-85. This is a deliberate property: the score answers
"where is the *money* going, risk-weighted?" — so a phone's headline ESG risk looks modest even
though its cobalt/tantalum supply chain is high-risk. The material-level flags (conflict mineral,
child-labour "Critical DRC") surface that risk separately in the ESG-risk pie and badges.

### 7.5 Data provenance & limitations

- **Data is hand-curated real LCA data** (30 products, detailed BOMs) — not `sr()`-seeded. This is a
  genuine strength versus most B-tier modules.
- **No stage attribution**: the guide's "Manufacturing 62% hotspot" and cradle-to-grave stage split
  do not exist; carbon is per-material. Use-phase emissions (huge for cars/appliances) are absent —
  the EV shows only embodied carbon (8,500 kg), not lifetime driving emissions.
- **No live `mass × EF`**: `carbon_g` is a stored constant, so changing a mass does not recompute
  carbon (the sliders in comparison mode scale stages, not re-derive EFs).
- The cost-weighting makes ESG score dominated by high-value intangibles (IP/software), which can
  *understate* material-supply-chain risk — a design choice worth flagging to users.
- Externality constants ($0.05/kg CO₂ ≈ $50/tonne is defensible; but a single global figure ignores
  regional carbon prices).

**Framework alignment:** **ISO 14067:2018** (product carbon footprint) and the **GHG Protocol
Product Standard** — the module presents a component-level footprint consistent with their scope, but
omits the mandatory life-cycle-stage boundary reporting and use-phase inclusion those standards
require. **OECD Due Diligence Guidance** and the **EU Conflict Minerals Regulation** underlie the
conflict-mineral/child-labour flags (3TG: tin, tantalum, tungsten, gold are correctly tagged). No §8
model is required — the module's calculations are simple, transparent, and grounded in real data;
the gap is coverage (stages, use phase), not a missing model.

## 9 · Future Evolution

### 9.1 Evolution A — Live mᵢ × EFᵢ engine with stage attribution (analytics ladder: rung 1 → 2)

**What.** The module's genuine asset is unusual for tier B: 30 hand-researched product teardowns with realistic per-component carbon/water/cost and conflict-mineral flags — not `sr()`-seeded. Its documented gap (§7 flag) is methodological: the code never multiplies mass × emission factor at runtime (each component carries a pre-baked absolute `carbon_g`), and carbon is bucketed per material, never per life-cycle stage — so the guide's ISO 14067 `PCF = Σ(mᵢ × EFᵢ)` across cradle-to-grave stages, and the "Manufacturing 62%" hotspot claim, are unimplemented. Evolution A builds the calculation the page describes: a backend PCF engine computing component footprints from mass and a stage-tagged emission-factor table, enabling user-defined BOMs.

**How.** (1) `api/v1/routes/product_anatomy.py` with `POST /pcf` (BOM in, per-component and per-stage footprint out) and `GET /emission-factors` (a seeded `ref_material_emission_factors` table — material × process stage × EF, sourced from public LCA datasets and reconciled against the existing 30 teardowns as validation cases). (2) Each component gains a `stage` field (Raw Materials / Manufacturing / Use / EoL) so hotspot attribution is by stage as the guide claims. (3) The externality constants ($0.05/kg carbon — well below social-cost-of-carbon, as §7.2 notes) become user-visible parameters defaulting to a cited SCC value.

**Prerequisites.** EF dataset licensing checked (public sources: e.g. published LCA studies; no ecoinvent assumption); the 30 curated teardowns retained as bench fixtures. **Acceptance:** engine PCF for the smartphone teardown reproduces the curated total within a documented tolerance, and per-stage shares sum to 100%.

### 9.2 Evolution B — Design-for-carbon copilot over the teardown library (LLM tier 2)

**What.** Product teams' real question is comparative and material-level: "what happens to PCF and the ESG risk score if we swap the cobalt cathode for LFP?", "which components drive both carbon and child-labour risk?". Evolution B answers these as tool calls: substitution what-ifs run `POST /pcf` with the modified BOM; risk questions read the module's cost-weighted ESG score and per-component flags (Cobalt 85 "Critical DRC" style data already curated).

**How.** Tier-2 tool schemas over the Evolution-A endpoints plus a `GET /products/{id}` for the teardown library; system prompt grounded in this Atlas record's formulas (cost-weighted ESG score, the 0.4/0.3/0.3 circularity composite) so the copilot explains score movements mechanically. Substitution suggestions must come from the EF table's material list, each carrying its EF provenance; the no-fabrication validator checks every gram and dollar. The first slice can ship tier 1 (explain the current teardown) before the engine, since the curated data is real — unlike most B-tier siblings, narrating this page is legitimate today.

**Prerequisites.** Evolution A for substitution math; the EF table populated for at least the materials appearing in the 30 teardowns. **Acceptance:** a swap scenario's PCF delta equals the difference of two `/pcf` tool responses, and the copilot flags when a suggested substitute lacks an EF entry instead of estimating one.