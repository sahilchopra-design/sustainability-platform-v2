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
