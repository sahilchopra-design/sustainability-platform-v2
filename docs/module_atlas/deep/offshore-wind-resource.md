## 7 · Methodology Deep Dive

### 7.1 What the module computes

A genuine engineering wind-resource assessment pipeline: Weibull distribution fitting, Jensen
top-hat wake-loss modelling, numerical AEP integration, and lognormal P50/P90 uncertainty — matching
the guide's stated methodology closely.

```
V_hub    = V_ref × (hubHeight/80)^shearExp                       // wind shear power law
λ        = V_hub / (Γ(1+1/k) × 0.9)                                // Weibull scale (approx.)
Deficit  = (1 − √(1−Ct)) × (D / (D + 2·k_wake·x))²                 // Jensen top-hat wake model
AEP      = 8760 × Σ_v P(v) × Weibull_pdf(v,k,λ)
P90      = P50 × exp(−1.282 × σ)
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Weibull scale approximation | `λ = vHub / (Math.pow(1+1/wk, 1/wk) × 0.9)` | Approximates `Γ(1+1/k)` without a true gamma function — a numerical shortcut, not exact (true Weibull mean = λ·Γ(1+1/k); code inverts this with a power-based proxy for Γ and an extra ×0.9 fudge factor with no cited derivation) |
| Wake decay constant k | user input, typically 0.04 offshore per guide | Configurable |
| Power curve | cubic ramp `((v−cutIn)/(rated−cutIn))³` between cut-in and rated speed | Standard simplified turbine power-curve shape (real curves are typically S-shaped/manufacturer-specific, not a pure cube law — a modelling simplification) |
| Air density | 1.225 kg/m³ | Standard ISA sea-level value, correctly used in `powerDensity = 0.5×1.225×meanWind³` |
| Degradation | 0.995^year (0.5%/yr) | Consistent with `offshore-wind-finance`/`offshore-wind-om` degradation assumption — good cross-module consistency |
| P90 z-value | 1.282 | Correct standard-normal 90th-percentile one-tailed z-score |

### 7.3 Calculation walkthrough

1. **Hub-height wind speed**: power-law shear extrapolation from the reference height (80m assumed
   reference) to actual hub height — textbook approach, though the guide's cited standard
   (IEC 61400-1) typically also requires site-specific roughness/stability corrections not visible
   in this formula.
2. **AEP integration** (`aepByBin`): numerically sums `power_curve(v) × Weibull_pdf(v) × 0.5`
   (0.5 m/s bin width) across the speed range, multiplied by 8760 hours and turbine count — genuine
   numerical integration, not a closed-form shortcut.
3. **Wake loss** (`deficit` function + `heatmap`): applies the Jensen top-hat model per turbine pair
   using downwind distance `xDist = row×7D` and lateral offset `yDist`, with a Gaussian lateral
   decay `exp(-0.5×(yDist/(3D))²)` moderating the deficit for turbines not directly downwind — a
   reasonable 2D extension of the classic 1D Jensen model. `avgWakeDeficit` averages across array
   rows.
4. **Net AEP**: `gross×(1−wakeLoss)×(1−elecLoss/100)×(avail/100)` — the standard loss-chain
   cascade (gross → wake → electrical → availability).
5. **P50/P90/P75**: `p90Val`/`p75Val` apply the lognormal transform `AEP × exp(−z×σ)` with
   `σ = p90Sigma/100` user-configurable combined uncertainty, and a normal PDF (`uncertaintyDist`)
   visualizes the distribution shape.
6. **LCOE**: CAPEX annuitised via the capital-recovery factor (`crf = r(1+r)^n/((1+r)^n−1)`) plus
   annual OPEX, divided by net AEP — standard LCOE definition, consistent with the sibling
   `offshore-wind-finance` module's LCOE formula.

### 7.4 Worked example

12 MW turbine, hub height 150m, site `V_ref=10.2 m/s` at 80m, Weibull k=2.1, 8×8 array, 7D row
spacing:

| Step | Computation | Result |
|---|---|---|
| Shear-adjusted V_hub | 10.2 × (150/80)^0.12 | ≈ 10.63 m/s |
| Weibull λ (code approximation) | 10.63 / (1.126^0.476 × 0.9) | ≈ 10.85 |
| Gross AEP per turbine | 8760 × Σ power(v)×pdf(v) | site/turbine-specific, ~50–55 GWh/yr for a Class-I North Sea site |
| Wake deficit (row 4, 7D spacing) | (1−√(1−Ct))×(D/(D+2×0.04×4×7D))² | a few % per downwind row, cumulating across the array |
| P90/P50 ratio (σ=8%) | exp(−1.282×0.08) | **≈ 0.902** — a 9.8% P90 haircut, within the guide's 6–12% stated range |

### 7.5 Data provenance & limitations

- **Site table (`SITES`, 7 rows) and turbine table (`TURBINES`, 6 rows) are seed constants** styled
  on real offshore regions (North Sea, US East Coast, Taiwan, etc.) but not ingested from ERA5/
  MERRA-2 as the guide's `dataLineage` claims — there is no live reanalysis data pull.
- The Weibull scale approximation (`0.9` fudge factor substituting for the gamma function) is a
  numerical shortcut that will introduce error versus a true `λ = V̄ / Γ(1+1/k)` calculation,
  especially at low k (high variability) sites — worth reconciling against a proper gamma-function
  implementation for production use.
- The cubic power-curve shape is a simplification of real manufacturer power curves (which have
  inflection points and are rarely a pure cube law across the full ramp range).
- Extreme wind (50-year return period) and satellite-vs-mast validation tabs are described in the
  guide but their specific formulas were not present in the extracted `computed` list.

**Framework alignment:** IEC 61400-3-1 (offshore design site conditions) and the Jensen wake-model
literature are correctly reflected in structure (top-hat deficit, decay constant k); the P90
lognormal convention matches DNVGL-ST-0437/MEASNET bankability-study practice, though the specific
σ inputs (interannual, wake-model, measurement bias) are user-configurable single values rather than
independently sourced uncertainty components combined via root-sum-of-squares as the guide describes.
