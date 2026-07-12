## 7 · Methodology Deep Dive

> ⚠️ **Partial guide↔code mismatch.** The guide labels the standard as "Ensemble model" and
> describes `y_hat = f(carbon_price, gdp_growth, tech_cost, policy_stringency | entity)`. **The
> code implements a single fixed-coefficient linear combination, not an ensemble** (no multiple
> models are combined/averaged/voted — there is exactly one deterministic formula applied
> uniformly to every entity). The formula itself is a real, transparent linear scoring function;
> "ensemble" is a mislabel for what is a simple multi-factor linear model.

### 7.1 What the module computes

```
base         = 55 + (sr(i x 23) x 2 - 1) x 18          // entity-specific baseline, 37-73 range
carbonEffect = (carbonPrice - 100) x 0.03               // per $/tCO2 above/below EUR100 reference
gdpEffect    = (gdpGrowth - 2) x 2                       // per pp above/below 2% reference growth
techEffect   = (1 - techCost) x 15                       // techCost index: 1.0=neutral, <1=cheaper tech boosts score
policyEffect = (policyStringency - 50) x 0.1             // per point above/below 50 (mid) stringency
predicted    = clip(base + carbonEffect + gdpEffect + techEffect + policyEffect, 10, 95)
```
Every entity's score responds to the same 4 user-adjustable sliders via the same linear
coefficients — only the entity-specific `base` term differs (seeded once per entity, stable across
scenario changes).

### 7.2 Parameterisation

| Input slider | Range | Reference point | Coefficient | Provenance |
|---|---|---|---|---|
| Carbon price | EUR50-300/tCO2 | EUR100 (neutral) | x0.03 per EUR/t | Hard-coded assumption |
| GDP growth | -3% to +5% | 2% (neutral) | x2.0 per pp | Hard-coded assumption |
| Tech cost index | 0.5-2.0 | 1.0 (neutral) | x15 for (1-techCost) | Hard-coded assumption; cheaper tech (index<1) boosts score, more expensive tech depresses it — directionally sensible |
| Policy stringency | 0-100 | 50 (neutral) | x0.1 per point | Hard-coded assumption |
| `NGFS` presets (6 rows) | carbonPrice/gdp/techCost/policy per scenario | — | — | Auto-fills the 4 sliders to NGFS-style scenario values; scenario characterisation is directionally plausible (e.g. Net Zero preset implies high carbon price, low tech cost) though not cross-consistent with the platform's other NGFS tables (e.g. `scenario-blending-optimizer`'s `NGFS` object uses different field names/values for the same 5-6 scenarios) |

### 7.3 Calculation walkthrough

1. `predictions` maps every entity through the same linear formula using the currently selected
   slider values — a genuine, transparent, and auditable computation (no PRNG involved in the
   scenario response itself; only the entity `base` term is seeded).
2. `pathwayData` (2025-2030) applies a **linearly growing** perturbation:
   `yearEffect = yearIndex x ((carbonPrice-100)x0.005 + (gdp-2)x0.3)` — a smaller-magnitude version
   of the same carbon/GDP sensitivity, compounding year-over-year to show a multi-year trajectory
   under the fixed scenario.
3. `comparisonData` runs the same formula once per NGFS preset scenario, letting a user see how a
   given entity's score would differ across all 6 canonical scenarios side by side.
4. The "2D Sensitivity Surface" (referenced in the guide) holds two of the four inputs fixed and
   sweeps the other two, re-evaluating `score` at each grid point to produce a heatmap — a
   correct way to visualise a linear model's response surface (which, given the model's purely
   additive structure with no interaction terms, will always render as a perfectly flat-gradient
   plane rather than a curved surface).

### 7.4 Worked example

Entity with `base=61` (seeded), under NGFS "Net Zero 2050"-style inputs `carbonPrice=250,
gdp=1.5%, techCost=0.7, policyStringency=85`:
```
carbonEffect = (250-100) x 0.03 = 4.5
gdpEffect    = (1.5-2) x 2 = -1.0
techEffect   = (1-0.7) x 15 = 4.5
policyEffect = (85-50) x 0.1 = 3.5
predicted    = clip(61 + 4.5 - 1.0 + 4.5 + 3.5, 10, 95) = clip(72.5, 10, 95) = 72.5
```
Under "Current Policies"-style inputs `carbonPrice=60, gdp=2.8%, techCost=1.3,
policyStringency=20`:
```
carbonEffect = (60-100) x 0.03 = -1.2
gdpEffect    = (2.8-2) x 2 = 1.6
techEffect   = (1-1.3) x 15 = -4.5
policyEffect = (20-50) x 0.1 = -3.0
predicted    = clip(61 - 1.2 + 1.6 - 4.5 - 3.0, 10, 95) = clip(53.9, 10, 95) = 53.9
```
A meaningful ~19-point score swing between an orderly and disorderly-policy scenario for the same
entity — directionally sensible, though the magnitude is entirely a function of the hand-set
coefficients rather than an estimated sensitivity.

### 7.5 Data provenance & limitations

- The scoring formula is a genuine, fully transparent linear model — not PRNG-fabricated for the
  scenario-response part — but it is **not an ensemble** as the guide's methodology label claims;
  there is one fixed set of coefficients, no model averaging or voting.
- Coefficients (0.03, 2.0, 15, 0.1) are hand-set assumptions with no stated calibration source
  (e.g. no regression against historical entity scores vs macro conditions).
- The purely additive, no-interaction-terms structure means the "2D sensitivity surface" will
  always be a flat plane in any 2-variable slice — real climate-risk sensitivities are typically
  non-linear (e.g. threshold effects, tipping points), which this model cannot represent.
- `NGFS` preset values are not cross-consistent with the same-named scenario objects used in other
  platform modules (`scenario-blending-optimizer`, `scenario-stress-test`), so scenario comparisons
  across modules will not reconcile.

**Framework alignment:** NGFS Phase 5 scenario framing (used only as slider presets, not as a
modelled scenario pathway) · the guide's "Ensemble model" standard citation does not match the
single-formula implementation.
