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
