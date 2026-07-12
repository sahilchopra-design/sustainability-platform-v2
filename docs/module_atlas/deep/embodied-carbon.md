## 7 · Methodology Deep Dive

The guide (Whole-Life Carbon per EN 15978 / RICS 2023) broadly matches the code's intent: the page
does structure carbon by RICS/EN 15978 lifecycle modules (A1–A3, A4–A5, B, C, D), benchmark against
RIBA 2030 intensity targets, and carry a real material carbon-factor table. The gap is quantitative,
not conceptual: the interactive **calculator does not sum EPD-factor × quantity** (`WLC = Σ EC_i×Q_i`);
it derives a per-m² intensity from a RIBA target scaled by a random spread, then *allocates* that
total to stages by fixed percentages. The material take-off is a **parallel, non-reconciled** view.
Sections below document the code as written.

### 7.1 What the module computes

Four datasets/engines:

**(a) Material library** — 30 materials with a hard-coded `carbonBase` array of embodied-carbon
factors (kgCO₂e/kg) that track the ICE v3 / EPD literature:

```
Concrete OPC 0.15 · Steel virgin 1.55 · Steel recycled 0.47 · Timber softwood 0.31 ·
CLT 0.42 · Aluminium virgin 8.24 · Aluminium recycled 1.81 · Straw bale 0.01 · Hempcrete 0.06 …
```
`isLowCarbon = kgCO2ePerKg < 0.5`. Cost, durability, recyclability, availability, circularScore are
seeded random.

**(b) Calculator** (the headline interactive):
```js
base          = RIBA_2030[type]                       // e.g. Office 300 kgCO₂e/m²
timberReduction = calcTimber × 0.008                  // 0.8% per timber-% point
adjustedBase  = base × (1 − timberReduction)
perSqm        = floor(adjustedBase × (0.7 + sr(idx·3)×0.6))   // ±random 0.7–1.3 spread
total (tCO₂e) = perSqm × calcGFA / 1000
vsRiba        = (perSqm / RIBA_2030[type] − 1) × 100
```
Stage split is applied to `total` by fixed shares `{A1-A3 0.65, A4-A5 0.10, B 0.08, C 0.12, D −0.05}`.

**(c) Project portfolio** — 80 synthetic buildings. Here the stage numbers ARE built additively
from an A1–A3 anchor:
```js
a13 = floor(ribaTarget × (0.3 + s×0.8))     a45 = floor(a13 × 0.15 × (0.5+s2))
b15 = floor(a13 × 0.08 × (0.5+s3))          c14 = floor(a13 × 0.12 × (0.5+s4))
dStage = floor(−a13 × 0.1 × (0.3+s5×0.5))   // Module D credit (negative)
totalEmbodied = a13+a45+b15+c14+dStage
totalWholeLife = totalEmbodied + operationalCarbon × designLife
embodiedPerSqm = floor(totalEmbodied × 1000 / gfa)
```

**(d) Circular-economy score:** `circularScore = (100−wastePerc)×0.3 + recycledContent×0.35 + reuseScore×0.35`.

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance |
|---|---|---|
| `RIBA_2030` targets (kgCO₂e/m²) | Office 300, Resi 250, Retail 280, Educ 270, Health 350, Ind 200, Mixed 290, Warehouse 180 | RIBA 2030 Climate Challenge / LETI band (real published targets) |
| `carbonBase` (30 factors) | 0.01–8.24 kgCO₂e/kg | ICE v3 / EPD literature — realistic, hard-coded |
| Timber reduction | 0.8%/point | Design heuristic (frame substitution) — synthetic slope |
| Stage split A1-A3=65% | fixed | RICS-typical upfront share; hard-coded, not computed |
| Module D | −5% credit | EN 15978 reuse/recovery credit (reported separately per standard) |
| Operational proxy | `gfa × 0.05 × (0.5+s2)` per yr | synthetic — not an energy model |
| `co2ePerUnit` (calc materials) | Concrete 360/m³, Steel 1.55/kg, Timber 155/m³ … | EPD-typical |

### 7.3 Calculation walkthrough

Calculator input → output: pick building type → look up RIBA target → apply timber reduction →
multiply by a seeded 0.7–1.3 spread to get `perSqm` → scale by GFA for `total` → allocate to stages
and (separately) run a 6-material take-off (`qty × co2ePerUnit`). The `vsRiba` gauge compares `perSqm`
to the same RIBA target. Because `perSqm` derives from RIBA×(0.7–1.3), `vsRiba` lands within ±30% by
construction. The material take-off total is **not** reconciled back to `perSqm×GFA`.

### 7.4 Worked example

Calculator: **Office**, GFA = 5,000 m², Timber = 20%.
- `base = 300`; `timberReduction = 20 × 0.008 = 0.16`; `adjustedBase = 300 × 0.84 = 252`.
- Seed `idx = BLDG_TYPES.indexOf('Office') = 0`, so `sr(0·3)=sr(0)=frac(sin(1)×10⁴)`. sin(1)=0.8415,
  ×10⁴=8414.7, frac=0.7099. Spread `= 0.7 + 0.7099×0.6 = 1.126`.
- `perSqm = floor(252 × 1.126) = floor(283.7) = 283 kgCO₂e/m²`.
- `total = 283 × 5000 / 1000 = 1,415 tCO₂e`.
- `vsRiba = (283/300 − 1)×100 = −5.7% → −5%` (better than target).
- Stage A1-A3 = `floor(1415 × 0.65) = 919 tCO₂e`; Module D credit = `floor(1415 × 0.05) = 70 tCO₂e` shown negative.

A 20% timber content thus buys a 16% intensity cut before the random spread — the substitution lever
the tool is designed to demonstrate.

### 7.5 Companion analytics

- **Material comparison:** sorts the 30-material library by carbon/cost/circularScore; low-carbon
  flag at <0.5 kgCO₂e/kg.
- **Portfolio stage breakdown & embodied-vs-operational** by building type (mean over filtered set,
  divisor guarded `|| 1`).
- **Circular economy:** per-project `circularScore`, demolition-waste estimate `gfa×0.15×(1−recycled%)`,
  material-passport and end-of-life labels by `reuseScore` thresholds.

### 7.6 Data provenance & limitations

- **Material carbon factors are realistic and hard-coded** (ICE v3 / EPD-consistent); this is the
  module's genuine external data. **Project and material secondary attributes are synthetic**, seeded
  by `sr(seed)=frac(sin(seed+1)×10⁴)`.
- The calculator does **not** perform a bottom-up `Σ EF×Q` sum; `perSqm` is a RIBA target × random
  spread. The 6-line material take-off is illustrative and unreconciled to the headline total.
- Operational carbon is a floor-area proxy, not an energy/EUI model; biogenic carbon (flagged in the
  guide, EN 15804+A2) is not separated from fossil GWP.

**Framework alignment:** **EN 15978 / RICS WLCA (2023)** — the A/B/C/D module structure and the
Module-D reuse credit mirror the standard's lifecycle stages; **RIBA 2030 Climate Challenge / LETI** —
the per-type kgCO₂e/m² targets are the real 2030 benchmark intensities; **ICE v3 (Bath, 2019)** — the
material factor magnitudes track this database; **ISO 14025 EPD** — referenced as the intended factor
source (a production build would bind each material to an EPD record rather than the static array).
