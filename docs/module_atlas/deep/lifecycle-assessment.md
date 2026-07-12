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
