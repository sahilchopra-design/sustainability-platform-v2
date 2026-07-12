# Product Carbon Handprint
**Module ID:** `product-carbon-handprint` · **Route:** `/product-carbon-handprint` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies Scope 4 enabled emissions – positive climate impact delivered to customers and society through low-carbon product substitution.

> **Business value:** Provides the evidential basis for Scope 4 enabled emissions claims, supporting product-level positive impact disclosure and science-based green marketing.

**How an analyst works this module:**
- Define reference product and substitution scenario.
- Quantify use-phase emission factor differential.
- Scale by sales volume and product lifetime.
- Report handprint alongside product footprint for net impact.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CATEGORIES`, `COMPANIES`, `CategoryBenchmarks`, `CustomTooltip`, `HandprintCalculator`, `IMPACT_CATS`, `ISO_CHECKLIST`, `LifecycleDeepDive`, `MATERIALS`, `MiniKPI`, `PRODUCTS`, `ReportingClaims`, `STAGES`, `STAGE_COLORS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ISO_CHECKLIST` | 16 | `id`, `text`, `section` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `STAGES` | `['Raw Materials','Manufacturing','Distribution','Use Phase','End-of-Life','Recycling'];` |
| `IMPACT_CATS` | `['GWP','ODP','AP','EP-freshwater','EP-marine','EP-terrestrial','POCP','ADP-minerals','ADP-fossil','WDP','IRP','LU'];` |
| `stages` | `STAGES.map((_,si)=>{` |
| `totalFP` | `stages.reduce((a,v)=>a+v,0);` |
| `baselineMulti` | `1.2+sr(idx*19)*0.8;` |
| `baseline` | `+(totalFP*baselineMulti).toFixed(1);` |
| `handprint` | `+(baseline-totalFP).toFixed(1);` |
| `MATERIALS` | `['Steel','Aluminum','Copper','Plastic-ABS','Plastic-PP','Glass','Silicon','Rubber','Lithium','Concrete','Carbon Fiber','Titanium'];` |
| `badge` | `(c)=>({display:'inline-block',padding:'2px 10px',borderRadius:10,fontSize:11,fontWeight:600,background:c+'18',color:c});` |
| `getStages` | `(p)=>STAGES.map((_,i)=>{` |
| `totalA` | `stagesA.reduce((a,v)=>a+v,0);` |
| `handA` | `+((baseA-totalA)*af).toFixed(1);` |
| `totalB` | `comp?stagesB.reduce((a,v)=>a+v,0):0;` |
| `handB` | `comp?+((comp.baseline-totalB)*(attrSlider\|\|comp.attributionFactor)).toFixed(1):0;` |
| `waterfall` | `STAGES.map((name,i)=>({name:name.length>12?name.slice(0,12)+'..':name,value:stagesA[i],fill:STAGE_COLORS[i]}));` |
| `compBar` | `[{name:prod.name.slice(0,18),Footprint:+totalA.toFixed(1),Baseline:baseA,Handprint:handA>0?handA:0}];` |
| `stageContribPie` | `STAGES.map((st,i)=>({name:st,value:Math.abs(stagesA[i]),fill:STAGE_COLORS[i]}));` |
| `total` | `stages.reduce((a,v)=>a+v,0);` |
| `hotIdx` | `stages.indexOf(Math.max(...stages.filter(v=>v>0)));` |
| `sankeyData` | `STAGES.map((st,i)=>({` |
| `matData` | `MATERIALS.map((m,i)=>({` |
| `benchmarks` | `STAGES.map((st,i)=>{` |
| `vals` | `catProds.map(p=>Math.abs(p.stages[i]));` |
| `improveSim` | `STAGES.map((st,i)=>({` |
| `impactRadar` | `IMPACT_CATS.map((cat,i)=>({subject:cat,Product:prod.impactScores[i],CategoryAvg:50+sr(i*23+selId)*30}));` |
| `annualTimeline` | `[2020,2021,2022,2023,2024,2025].map(y=>({` |
| `pct` | `((Math.abs(v)/Math.max(Math.abs(total),1))*100).toFixed(1);` |
| `diff` | `((Math.abs(v)-catAvg)/catAvg*100).toFixed(0);` |
| `avg` | `50+sr(i*23+selId)*30;` |
| `dev` | `((score-avg)/avg*100).toFixed(1);` |
| `cumul` | `stages.slice(0,i+1).reduce((a,v)=>a+v,0);` |
| `catStats` | `useMemo(()=>CATEGORIES.map((cat,ci)=>{` |
| `median` | `+hps.sort((a,b)=>a-b)[Math.floor(hps.length/2)].toFixed(1);` |
| `totalAvoided` | `+(hps.reduce((a,v)=>a+(v>0?v:0),0)).toFixed(1);` |
| `avgRD` | `+(prods.reduce((a,p)=>a+p.rdInvestM,0)/ Math.max(1, prods.length)).toFixed(1);` |
| `avgFP` | `+(prods.reduce((a,p)=>a+p.totalFootprint,0)/ Math.max(1, prods.length)).toFixed(1);` |
| `catCompare` | `catStats.map(c=>({name:c.name.length>14?c.name.slice(0,14)+'..':c.name,Average:c.avg,Best:c.best,Worst:c.worst,Median:c.median}));` |
| `rdCorr` | `catStats.map(c=>({name:c.name.slice(0,10),RD_Investment:c.avgRD,Avg_Handprint:c.avg}));` |
| `marketPotential` | `catStats.map(c=>({name:c.name.slice(0,12),'Avoided Emissions':c.totalAvoided,'Market Potential':+(c.totalAvoided*sr(c.idx*97)*5).toFixed(0)}));` |
| `distData` | `selCat!==null?catProds.map(p=>({name:p.name.slice(0,15),Handprint:p.handprint,Footprint:p.totalFootprint})):[];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `COMPANIES`, `IMPACT_CATS`, `ISO_CHECKLIST`, `MATERIALS`, `STAGES`, `STAGE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Annual Handprint (tCO₂e) | — | Handprint Engine | Total avoided emissions enabled by product sales in reporting year vs reference product baseline. |
| Handprint-to-Footprint Ratio | — | Lifecycle Engine | Ratio of enabled emission savings to product’s own lifecycle carbon footprint. |
| Reference Baseline | — | IEA Grid EF Database | Counterfactual product or system replaced by low-carbon product offering. |
- **Product EF + reference EF + sales data + use-phase assumptions** → Differential emission calculation; volume scaling; lifetime adjustment → **Handprint disclosure report and handprint-to-footprint ratio**

## 5 · Intermediate Transformation Logic
**Methodology:** Carbon Handprint
**Headline formula:** `HP = (EF_reference – EF_product) × units_sold × use_phase_factor`

Avoided emissions relative to a baseline product, scaled by sales volume and use-phase duration.

**Standards:** ['World Resources Institute Scope 4 Guidance', 'SolarPower Europe Handprint Methodology']
**Reference documents:** WRI Estimating and Reporting the Comparative Emissions Impacts of Products (Scope 4); SolarPower Europe Carbon Handprint Methodology

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide states the WRI Scope-4 handprint identity
> `HP = (EF_reference − EF_product) × units_sold × use_phase_factor` — a differential emission
> factor scaled by sales volume and use-phase. **The code implements none of that.** There is no
> reference-product EF, no units-sold, no use-phase differential. Instead the "baseline" against
> which the handprint is measured is the product's **own footprint multiplied by a random factor**
> (`baseline = totalFootprint × (1.2 + sr()·0.8)`), and `handprint = baseline − footprint`. Every
> product, stage, footprint, impact score, and attribution factor is `sr()`-seeded. The page does
> import `GWP_VALUES, EMISSION_FACTORS` from reference data but does not use them in the handprint
> calculation.

### 7.1 What the module computes

**Stage footprint** (6 life-cycle stages, `genProducts`):

```js
baseFootprint = 50 + sr(idx·7+3)·400                       // 50–450 kgCO₂e
weights       = [0.25, 0.20, 0.10, 0.30, 0.10, 0.05]        // Raw/Mfg/Dist/Use/EoL/Recycle
stage[si]     = baseFootprint × weights[si] × (0.6 + sr(idx·13+si·7)·0.8)
stage[5]      = −stage[5]                                   // Recycling stage is a credit (negative)
totalFootprint= Σ stage
```

**Baseline & handprint** (the load-bearing "avoided emissions"):

```js
baselineMulti = 1.2 + sr(idx·19)·0.8                        // 1.2–2.0×  — a random inflation factor
baseline      = totalFootprint × baselineMulti
handprint     = baseline − totalFootprint                   // = totalFootprint × (baselineMulti − 1)
```

So the handprint is **algebraically just `footprint × (baselineMulti − 1)`** — a random 20–100%
uplift on the product's own footprint, *not* a comparison to a real counterfactual product.

**Attribution-weighted handprint** (Calculator tab):

```js
handA = (baseA − totalA) × attributionFactor                // attributionFactor = 0.6 + sr()·0.35
```

**Handprint-to-footprint ratio** (guide's "3.8×") would be `baseline/footprint = baselineMulti`
(1.2–2.0), or `handprint/footprint = baselineMulti − 1` (0.2–1.0) — never the 3.8× the guide claims.

### 7.2 Parameterisation / provenance

| Quantity | Formula | Provenance |
|---|---|---|
| baseFootprint | `50 + sr()·400` | **synthetic seeded** |
| stage weights | `[0.25,0.20,0.10,0.30,0.10,0.05]` | in-code (plausible LCA profile: use-phase heaviest) |
| stage noise | `0.6 + sr()·0.8` | synthetic |
| baselineMulti | `1.2 + sr()·0.8` | **synthetic — the "reference" is fictional** |
| attributionFactor | `0.6 + sr()·0.35` | synthetic |
| impactScores (12 cats) | `sr()·100` | synthetic |
| rdInvestM, marketShare, materialMix | `sr()·…` | synthetic |
| usePhaseYears | `ceil(1 + sr()·14)` | synthetic; **not used in handprint** |

The stage-weight *shape* (`Use Phase 0.30` largest, `Recycling 0.05` credit) is the only realistic
structural element; every magnitude is noise.

### 7.3 Calculation walkthrough

1. `genProducts()` builds 10 categories × 10 products = 100 items; each seeded from its flat index.
2. Six stages computed from `baseFootprint × weight × noise`; recycling flipped negative.
3. `totalFootprint = Σ stages`; `baseline = totalFootprint × baselineMulti`; `handprint = baseline − footprint`.
4. Calculator tab lets the user override attribution slider and use-years, recomputing
   `handA = (baseA − totalA) × attribution` — but use-years do not feed the formula.
5. Category stats aggregate handprints (median, total avoided, avg R&D, market-potential =
   `totalAvoided × sr()·5`).

### 7.4 Worked example (product idx = 0)

Suppose `sr(3) ≈ 0.42` → `baseFootprint = 50 + 0.42·400 = 218 kgCO₂e`. Stages (using the weight
profile, noise≈1 for illustration): Raw 54.5, Mfg 43.6, Dist 21.8, Use 65.4, EoL 21.8, Recycle
−10.9 → `totalFootprint ≈ 196.2`. Suppose `sr(0·19)=sr(0) ≈ 0.30` → `baselineMulti = 1.2 + 0.30·0.8
= 1.44` → `baseline = 196.2 × 1.44 = 282.5` → `handprint = 282.5 − 196.2 = 86.3 kgCO₂e`. With
attribution `0.6 + sr()·0.35 ≈ 0.78`: `handA = 86.3 × 0.78 = 67.3`. Note the handprint (86.3) is
mechanically `196.2 × 0.44` — a random 44% of the product's own footprint, with no counterfactual.

### 7.5 Data provenance & limitations

- **All 100 products are synthetic**, seeded by `sr(seed)=frac(sin(seed+1)×10⁴)`.
- **The handprint has no real baseline**: it is the product's own footprint inflated by a random
  1.2–2.0× multiplier — the defining feature of a Scope-4 avoided-emissions claim (a *counterfactual
  reference product*) is missing.
- Imported `GWP_VALUES`/`EMISSION_FACTORS` are not used in the calculation.
- Use-phase years, R&D, market share are decorative (do not enter the handprint).
- The ISO 14067 checklist (15 items) is content-accurate but purely presentational.

**Framework alignment:** The module names **WRI's "Estimating and Reporting the Comparative Emissions
Impacts of Products" (the Scope 4 / avoided-emissions guidance)** and **SolarPower Europe's handprint
method**. WRI Scope 4 requires an explicit *comparative baseline* (the emissions of the product/system
the offering displaces), a *functional unit*, and *attribution* to avoid double counting — the code
implements only a token attribution factor and fabricates the baseline. **ISO 14067** (PCF) and
**ISO 14064-2** (project-level GHG, the basis for avoided-emissions accounting) underlie the checklist
but not the math. A defensible handprint needs §8.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Quantify a product's Scope-4 avoided emissions (handprint) relative to a
defined counterfactual reference product/system, scaled by sales volume and use-phase, with
attribution to avoid double counting. Coverage: any low-carbon product with a credible market
substitute.

**8.2 Conceptual approach.** The **WRI comparative-emissions (Scope 4) method**, mirroring (i) WRI's
avoided-emissions guidance and (ii) the ISO 14064-2 project-baseline structure used by SolarPower
Europe and Mission Innovation Avoided Emissions Framework (AEF). The handprint is the *difference in
life-cycle emissions* between the reference and the solution over the same functional unit and
lifetime, times units sold, times an attribution factor.

**8.3 Mathematical specification.**
Per functional unit: `PCF_solution = Σ_stage (activity × EF)`; `PCF_reference` computed identically
for the displaced product. Unit handprint: `hp_unit = (PCF_reference − PCF_solution)`.
Volume-scaled: `HP = hp_unit × units_sold × attribution`, where use-phase terms enter
`PCF` via `usePhaseYears × annualUseEmissions`. Ratio: `HP-to-footprint = HP / (PCF_solution × units)`.
Attribution `∈ (0,1]` reflects the solution provider's contribution share (WRI double-counting guard).

| Parameter | Symbol | Calibration source |
|---|---|---|
| Emission factors | EF | ecoinvent / EPA / IEA (already in `EMISSION_FACTORS`) |
| GWP | GWP_100 | IPCC AR6 (already in `GWP_VALUES`) |
| Reference product | PCF_reference | market-average incumbent (grid electricity, ICE vehicle, etc.) |
| Use-phase emissions | annualUseEmissions | grid EF × energy use, over `usePhaseYears` |
| Attribution | attribution | WRI Scope-4 attribution rules |

**8.4 Data requirements.** Solution BOM + process energy (foreground primary data), reference-product
LCA, sales volume, use-phase energy and lifetime, grid EF by market. Sources: internal LCA, ecoinvent,
IEA grid factors. Platform already holds `EMISSION_FACTORS`/`GWP_VALUES`; needs a reference-product
library and sales data.

**8.5 Validation & benchmarking.** Third-party critical review (ISO 14071); sensitivity on reference
choice and use-phase grid EF; reconcile against published product handprint studies (e.g. Vestas,
Interface). Report uncertainty ranges, not point estimates.

**8.6 Limitations & model risk.** Reference-product choice dominates the result and is
judgemental → require documented, conservative baselines. Additionality and double-counting risk →
enforce attribution ≤ provider share. Conservative fallback: report handprint as a range across
plausible references, and never claim a ratio without a stated counterfactual.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the WRI handprint identity with real reference products (analytics ladder: rung 1 → 2)

**What.** §7's flag is severe for a module whose entire purpose is a defensible avoided-emissions claim: the code's "baseline" is the product's own footprint times a random factor (`totalFootprint × (1.2 + sr()·0.8)`), so the handprint is fabricated by construction — there is no reference-product EF, no units sold, no use-phase differential, and the imported `GWP_VALUES, EMISSION_FACTORS` reference data goes unused. Evolution A implements the guide's actual formula, `HP = (EF_reference − EF_product) × units_sold × use_phase_factor`, over declared product pairs.

**How.** (1) Backend `api/v1/routes/carbon_handprint.py` with `POST /handprint` taking an explicit substitution scenario: product EF, named reference product EF (with source), units sold, lifetime/use-phase parameters — the WRI Scope-4 structure the §5 methodology already cites. (2) Wire the already-imported refdata emission factors into the product-side EF where BOM data exists (natural join with `product-anatomy`'s teardown library and its planned `/pcf` engine — the two modules should share the footprint layer, with this one owning the counterfactual). (3) Attribution factor becomes a documented input (contribution analysis per WRI guidance) instead of a seeded constant; the ISO_CHECKLIST (16 real items) becomes a gating rubric — no handprint reported until baseline-justification items are checked.

**Prerequisites.** The seeded product universe replaced or demo-flagged; reference-product EF sourcing convention agreed (every baseline must name its counterfactual and source). **Acceptance:** bench case (e.g. heat pump vs gas boiler) reproduces a hand-computed HP; setting reference EF = product EF yields exactly zero handprint — impossible in today's code where the multiplier guarantees a positive result.

### 9.2 Evolution B — Green-claims compliance copilot (LLM tier 1)

**What.** Handprint reporting is a greenwashing minefield; the module's highest-value LLM layer is a claims reviewer, not a number generator. The copilot takes a draft marketing or disclosure claim ("our product avoided 1.2 MtCO₂e in 2026") and audits it against the WRI Scope-4 guidance and the module's ISO checklist: is the baseline named and justified? Is attribution to this product defensible? Is handprint reported alongside footprint (the module's own documented convention)?

**How.** Tier-1 RAG over this Atlas record, the WRI comparative-emissions guidance and SolarPower Europe methodology named in §5, and the 16-item `ISO_CHECKLIST`; served via the standard copilot router. Post-Evolution-A, quantitative verification becomes a tool call to `POST /handprint` re-computing the claim from its stated inputs and diffing. The copilot's hard rule mirrors the platform's fabrication guardrail: it never estimates a handprint itself — it either verifies a computed one or lists what's missing. Before Evolution A it must state that on-page handprints are illustrative (§7 documents them as random-multiplier outputs).

**Prerequisites.** Guidance texts chunked; Evolution A for verification mode. **Acceptance:** the copilot flags a claim whose baseline is unnamed, and its verification numbers match `/handprint` output exactly.