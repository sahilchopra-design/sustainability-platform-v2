## 7 · Methodology Deep Dive

Guide and code agree: a Gold Standard Metered / CDM AMS-II.G clean-cookstove emission-reduction
model with an explicit fraction-of-non-renewable-biomass (fNRB) engine. The calculator is a real
implementation; the 8-project portfolio and usage-monitoring series are synthetic.

### 7.1 What the module computes

`calcCleanCooking` (lines 70–90) implements the AMS-II.G / Gold Standard emission-reduction identity:

```js
blFuelAnnual = fuelKg × 365
bePerHH      = blFuelAnnual × NCV × EF × 1e-6 × fNRB          // baseline emissions/household
pjFuelAnnual = blFuelAnnual × (blEff/pjEff) × stackFactor     // project fuel via efficiency ratio
pjEmissions  = pjFuelAnnual × NCV × EF × 1e-6 × fNRB
erPerHH      = bePerHH × (1 − rebound) − pjEmissions
totalER      = erPerHH × stoves × adoption
netCredits   = max(0, round(totalER × 0.90))                  // 10% conservativeness/buffer
```

The `1e-6` converts kg fuel × (MJ/kg) × (kgCO₂/TJ… i.e. gCO₂/MJ scaled) into tCO₂e. The fNRB is
applied to *both* baseline and project fuel (both are biomass) — the inline comment flags this as a
correction over an earlier arbitrary ×0.1.

**fNRB engine** (`fnrbCalc`, lines 125–133):

```js
fNRB     = clip01((demand − supply) / max(demand, 1))         // non-renewable share of woodfuel
adjusted = fNRB × (forest_fraction / 100)
```

### 7.2 Parameterisation

| Parameter | Default | Provenance |
|---|---|---|
| `NCV` (net calorific value) | 15.6 MJ/kg | IPCC default woodfuel NCV (2006 GL, ~15.6 GJ/t) |
| `EF` (emission factor) | 112.0 (tCO₂/TJ ≡ gCO₂/MJ scaled) | IPCC default for wood/biomass combustion (~112 tCO₂/TJ) |
| `fNRB` | 0.72 default | Country WISDOM/CDM TOOL30 value; range 0.40–0.95 |
| `blEff` / `pjEff` | 0.10 / 0.40 | Three-stone fire ~10% vs improved stove ~40% thermal efficiency |
| `stackFactor` | 0.80 | Fuel-stacking: households partly keep old stove |
| `rebound` | 0.10 | Increased cooking after efficiency gain |
| `adoption` | 0.75 | Fraction of distributed stoves in active use |
| Conservativeness | ×0.90 (netCredits) | 10% deduction proxy (buffer/uncertainty) |

### 7.3 Calculation walkthrough

1. Baseline household emissions from annual woodfuel × NCV × EF × fNRB.
2. Project fuel = baseline fuel scaled by efficiency ratio (`blEff/pjEff` < 1) × stacking factor;
   project emissions computed identically.
3. Per-household ER = baseline (net of rebound) − project emissions.
4. Scaled to programme by `stoves × adoption`, then ×0.90 conservativeness → issuable credits.
5. **fNRB tab** derives the non-renewable fraction from woodfuel demand-supply balance and adjusts by
   forest cover; a sensitivity sweep varies demand 20–80.
6. Result pushed to `CarbonCreditContext` as methodology `AMS-II.G`, family `energy`.

### 7.4 Worked example

Defaults: fuelKg 5.0, NCV 15.6, EF 112, fNRB 0.72, blEff 0.10, pjEff 0.40, stack 0.80, rebound 0.10,
stoves 20,000, adoption 0.75:

| Step | Computation | Result |
|---|---|---|
| Baseline fuel | 5.0 × 365 | 1,825 kg/yr |
| bePerHH | 1,825 × 15.6 × 112 × 1e-6 × 0.72 | 2.296 tCO₂e |
| Project fuel | 1,825 × (0.10/0.40) × 0.80 | 365 kg/yr |
| pjEmissions | 365 × 15.6 × 112 × 1e-6 × 0.72 | 0.459 tCO₂e |
| erPerHH | 2.296 × (1 − 0.10) − 0.459 | 1.607 tCO₂e |
| totalER | 1.607 × 20,000 × 0.75 | 24,105 tCO₂e |
| netCredits | 24,105 × 0.90 | **≈21,695 tCO₂e** |

### 7.5 Data provenance & limitations

- **Calculator is a real AMS-II.G/GS model; portfolio and monitoring are synthetic** (`sr(seed)=
  frac(sin(seed+1)×10⁴)` for the 8 `PROJECTS_CC` and the 12-month usage series).
- The ER waterfall's "Stacking Loss" term carries a `×0.3` presentation fudge (line 84) that is not
  part of the headline `totalER` — cosmetic only.
- fNRB, the single largest uncertainty driver (guide notes CV ±15%), is a single value, not a
  probabilistic distribution; no Monte Carlo.
- Conservativeness is a flat 10% ×0.90, not a metered-methodology usage-survey drop-out adjustment.

**Framework alignment:** **CDM AMS-II.G** and **Gold Standard Metered & Measured Methodology** — the
`BE − PE` structure with NCV × EF × fNRB is the canonical cookstove ER identity · **CDM TOOL30 /
WISDOM** for fNRB (here approximated by a demand-supply woodfuel balance) · **IPCC 2006 Stationary
Combustion** EFs (NCV 15.6 MJ/kg, EF 112 tCO₂/TJ). fNRB in the real standard is a nationally gazetted
value from a woodfuel supply-demand model; the module reproduces that logic in miniature.
