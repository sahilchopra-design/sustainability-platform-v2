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
