## 7 · Methodology Deep Dive

This module is one of the better-grounded modules in this batch: its LCA and revenue-stacking
formulas use real ICAO/IRA reference constants, though the 20-project credit-market universe layers
synthetic price/volume variation on top of realistic base prices.

### 7.1 What the module computes

```
baselineCI    = 89 gCO2eq/MJ                    // ICAO CORSIA default fossil Jet-A baseline
ciByPathway   = { HEFA: 28, AtJ: 12, 'FT-MSW': 5, PtL: -70 }   // gCO2eq/MJ, PtL negative via DAC credit
ciReduction   = baselineCI - ciByPathway[pathway]
totalGallons  = annualProd(Mt) x 1e6 x 264 gal/t                // 264 gal/tonne SAF density conversion
corsiaCredit  = totalGallons x (ciReduction / baselineCI) x 0.0025    // tCO2-equivalent credits
isccRevenue   = annualProd x 1e6 x $45/t / 1e6                  // $M/yr ISCC+ certificate premium
revenueStack  = SAF sale + IRA S40B + ISCC+ + CORSIA CEF + EU ETS   // $M/yr, 5 components
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `baselineCI` | 89 gCO2eq/MJ | Real ICAO CORSIA default fossil-jet baseline (matches published ICAO Annex 16 Vol IV life-cycle default value) |
| `ciByPathway` | HEFA 28, AtJ 12, FT-MSW 5, PtL -70 gCO2eq/MJ | Plausible relative ordering (HEFA highest CI of the SAF pathways, PtL most negative via DAC carbon credit) — directionally consistent with ICAO CORSIA default LCA value tables, though exact figures are illustrative, not pulled from the official ICAO table row-by-row |
| `gallonsPerMt` | 264 gal/tonne | Reasonable SAF density conversion (jet fuel ≈ 3.3-3.4 kg/gal, so 1,000kg / 3.4kg/gal ≈ 294; 264 is in the right order of magnitude but not an exact ASTM D7566 density figure) |
| CORSIA credit scaling `x0.0025` | — | **Unexplained proportionality constant** — converts gallons x CI-reduction-fraction into a credit tonnage; no docstring or comment derives it from a gal-to-kg-to-MJ-to-tCO2 chain, so it should be treated as an illustrative scaling factor rather than an audited conversion |
| `CREDIT_TYPES` base prices | CORSIA CEF $18/t, ISCC+ $45/t, RSB $38/t, Verra VCU $22/t, Gold Standard $30/t, EU ETS $62/t | Plausible approximate 2024 market price levels per instrument type, consistent with the guide's cited $5-25/t CORSIA Phase II range (base $18 sits inside it) |
| IRA §40B credit | $1.50/gal (used in `revenueStack`) | Sits inside the guide's cited $1.25-1.75/gal range, but the code hard-codes the single $1.50 figure rather than applying the CI-reduction-scaled formula (`min(1.75, 1.25 + max(0, ciReduction-50)x0.01)`) that the **companion** `saf-policy-mandate` module implements |
| SAF sale price | $2.80/gal | Synthetic demo, within the guide's cited $2.5-4.0/gal HEFA LCOF range |
| EU ETS carve-out | 5.5% of gallons x $65/tCO2 | Ad hoc proportion, not derived from an EU ETS aviation allowance-surrender calculation |

### 7.3 Calculation walkthrough

1. User sets `annualProd` (Mt SAF/yr) and `pathway` (HEFA/AtJ/FT-MSW/PtL) sliders.
2. `ciReduction` = baseline minus the selected pathway's life-cycle carbon intensity (higher
   reduction for lower-CI pathways; PtL's negative CI value produces the largest reduction).
3. `totalGallons` converts production to gallons via the fixed 264 gal/t factor.
4. `corsiaCredit` scales gallons by the **fractional** CI reduction (`ciReduction/baselineCI`,
   dimensionless, 0-1.79 range since PtL can exceed 100% reduction) times the unexplained `0.0025`
   constant — the larger the fractional CI cut, the more CORSIA-eligible credit tonnage generated.
5. `revenueStack` sums 5 independently-formulated $/gal or $/t revenue streams into a single
   $M/yr chart, illustrating that CORSIA/ISCC+/IRA revenue stacking materially improves SAF
   project economics versus fuel sale alone — directionally matches the guide's cited "$2.8 base +
   $1.25 40B + $0.20 CORSIA + $0.10 ISCC+ = $4.35/gal" example.
6. Separately, `PROJECTS` (20 rows, credit-market universe) layers `sr()`-seeded volume (1,000-
   100,000t) and price (base price x 0.85-1.20 spread) onto the 6 `CREDIT_TYPES` — a synthetic
   market view distinct from the deterministic revenue-stack calculator.

### 7.4 Worked example

At `annualProd = 0.3 Mt/yr`, `pathway = HEFA` (CI=28):
```
ciReduction  = 89 - 28 = 61 gCO2eq/MJ           (69% reduction vs baseline)
totalGallons = 0.3 x 1e6 x 264 = 79,200,000 gal
corsiaCredit = 79,200,000 x (61/89) x 0.0025 = 79,200,000 x 0.6854 x 0.0025 = 135,700 tCO2-equiv
isccRevenue  = 0.3 x 1e6 x 45 / 1e6 = $13.5M/yr
SAF sale     = 0.3 x 1e6 x 2.80 x 264 / 1e6 = $221.8M/yr
IRA S40B     = 0.3 x 1e6 x 264 x 1.50 / 1e6 = $118.8M/yr
CORSIA CEF   = 135,700 / 1e6 x $M-scale... = corsiaCredit/1e6 = $0.14M/yr (in the chart's units)
EU ETS       = 0.3 x 1e6 x 0.055 x 65 / 1e6 = $1.07M/yr
Total stack  ~= 221.8 + 118.8 + 13.5 + 0.14 + 1.07 ~= $355.3M/yr
```
Note CORSIA CEF contributes a small fraction of the stack at this scale — SAF sale and the IRA
credit dominate, consistent with the guide's framing of §40B as a major economics lever.

### 7.5 Data provenance & limitations

- `baselineCI=89` is a defensible real ICAO reference value; `ciByPathway` values and the
  `0.0025` CORSIA-credit scaling constant are unexplained/uncited and should be treated as
  illustrative rather than audited conversion factors.
- The 20-project credit-market universe (`PROJECTS`) is synthetic (`sr()`-seeded price/volume) laid
  over realistic base prices — useful for UI variety, not real market quotes.
- The IRA §40B credit is hard-coded at a flat $1.50/gal here, inconsistent with the CI-reduction-
  scaled formula the platform's own `saf-policy-mandate` module implements for the same credit —
  a cross-module consistency gap worth flagging for remediation.

**Framework alignment:** ICAO CORSIA Eligible Fuels default life-cycle values (baseline anchored
correctly, pathway-specific values illustrative) · IRA §40B SAF Production Tax Credit (flat-rate
approximation of the real CI-scaled credit) · Verra VM0047 / ISCC+ / RSB / Gold Standard (named
correctly as registries with plausible market prices, not modelled methodologically) · EU ETS
Aviation Directive 2003/87/EC (allowance cost applied as a flat % proxy, not a true surrender
calculation).
