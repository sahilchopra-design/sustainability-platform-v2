## 7 · Methodology Deep Dive

This is one of the more faithfully-implemented modules in this batch: the 8-jurisdiction policy
table uses real, correctly-cited mandate percentages, and the mandate-interpolation and IRA §40B
credit formulas are genuine (if simplified) calculations rather than PRNG fabrication.

### 7.1 What the module computes

```
mandateAt(year) = piecewise-linear interpolation across policy milestone years:
  year<=2025: mandate2025
  2025<year<=2030: mandate2025 + (mandate2030-mandate2025) x (year-2025)/5
  2030<year<=2035: mandate2030 + (mandate2035-mandate2030) x (year-2030)/5
  year>2035: mandate2035 + (mandate2050-mandate2035) x (year-2035)/15

iraCalc:
  gallons      = annualProd(Mt) x 1e6 x 264 gal/t
  ciReduction  = pathway === 'HEFA' ? 65% : pathway === 'PtL' ? 120% : 50%   // hard-coded by pathway
  creditPerGal = min($1.75, $1.25 + max(0, ciReduction - 50) x $0.01/pp)
  annualCredit = gallons x creditPerGal / 1e6   // $M/yr
```

### 7.2 Parameterisation

| Policy | Region | 2025 | 2030 | 2035 | 2050 | Mechanism |
|---|---|---|---|---|---|---|
| EU ReFuelEU Aviation | EU | 2% | 6% | 20% | 70% | Blending mandate (5x multiplier for PtL from 2030) |
| UK Sustainable Aviation Mandate | UK | 2% | 10% | 22% | 75% | Tradeable SAF certificates |
| IRA §40B SAF Credit | USA | — | — | — | — | Production tax credit, $1.25-1.75/gal, expires 2027 |
| US SAF Grand Challenge | USA | — | — | — | 100% | Aspirational (3B gal/yr by 2030) |
| Japan Green Innovation Fund | Japan | 0% | 10% | 15% | 50% | Grant/subsidy |
| Singapore SAF Blending | Singapore | 0.5% | 1% | 3% | 10% | Airport mandate (Changi/CAAS) |
| ICAO CORSIA Phase II | Global | — | — | — | — | Carbon offset, $5-50/tCO2, mandatory from 2027 |
| Australia SAF Mandate (proposed) | Australia | 0% | 5% | 10% | 50% | Proposed, under consultation |

These figures are accurate to the real published EU Regulation 2023/2405 (6% by 2030, 70% by 2050,
with the genuine 5x PtL sub-mandate multiplier correctly noted) and the UK DfT SAF Mandate
consultation figures (10% by 2030, 22% by 2035) cited in the guide — this is real, correctly
sourced regulatory data, not synthetic.

| `creditPerGal` formula constants | Value | Provenance |
|---|---|---|
| Base credit | $1.25/gal | Real IRS Notice 2023-06 §40B base rate |
| Step-up rate | +$0.01/gal per percentage point of CI reduction above 50% | Approximates the real §40B sliding scale (base $1.25 scaling toward $1.75 as CI reduction improves beyond the 50% minimum threshold) |
| Cap | $1.75/gal | Real statutory ceiling |
| `ciReduction` by pathway | HEFA 65%, PtL 120%, other 50% | Hard-coded per-pathway assumption — **not** pulled from the companion `saf-lcof-engine`/`saf-carbon-credits` modules' `ciByPathway` tables, so a user changing CI assumptions elsewhere on the platform sees no effect here (cross-module consistency gap, not a fabrication) |

### 7.3 Calculation walkthrough

1. `mandateAt(p)` is evaluated for every filtered policy at the user-selected `year` slider,
   correctly handling the 4-point piecewise-linear schedule (2025/2030/2035/2050 milestones) —
   this is genuine interpolation, not a lookup or random draw.
2. `timelineChart` hard-codes the same piecewise breakpoints separately for the 4 major mandates
   (EU/UK/Japan/Singapore) to drive a multi-series area chart — duplicated logic from `mandateAt`
   but numerically consistent with the `POLICIES` table.
3. `corsiaData` (8 years, 2024-2031) models emissions growing linearly (`800 + i×45` Mt) against a
   fixed 770 Mt 2019 baseline, with an **unexplained offset-participation ratio** (15% pre-2027,
   jumping to 85% from 2027) approximating CORSIA's real transition from voluntary (2021-2026) to
   mandatory (2027+) phases — directionally correct but the 15%/85% split constants are illustrative,
   not derived from ICAO's actual state-participation list.
4. `iraCalc` computes the §40B credit per the formula above, correctly converting Mt→gallons via
   the 264 gal/t constant.

### 7.4 Worked example

At `annualProd = 0.3 Mt/yr`, `pathway = HEFA`:
```
gallons      = 0.3 x 1e6 x 264 = 79,200,000 gal
ciReduction  = 65% (hard-coded for HEFA)
creditPerGal = min(1.75, 1.25 + max(0, 65-50) x 0.01) = min(1.75, 1.25+0.15) = $1.40/gal
annualCredit = 79,200,000 x 1.40 / 1e6 = $110.9M/yr
```
For `pathway = PtL`: `ciReduction=120%` → `creditPerGal = min(1.75, 1.25 + 70x0.01) = min(1.75,
1.95) = $1.75/gal` (hits the statutory cap) → `annualCredit = 79,200,000 x 1.75 / 1e6 = $138.6M/yr`
at the same production volume.

### 7.5 Data provenance & limitations

- Mandate percentages and milestone years are real, correctly-cited regulatory figures (EU
  Regulation 2023/2405, UK DfT consultation, Japan METI GIF, Singapore CAAS) — the strongest
  content in this module.
- The §40B credit formula is a genuine, correctly-capped calculation, though `ciReduction` is
  hard-coded per pathway rather than computed from an actual feedstock/process LCA, and is not
  cross-consistent with the CI values used in the companion `saf-lcof-engine`/`saf-carbon-credits`
  modules for the same pathway names.
- CORSIA offset-participation ratio (15%→85%) is an illustrative approximation of the
  voluntary-to-mandatory phase transition, not sourced to ICAO's published state-participation
  data.

**Framework alignment:** EU ReFuelEU Aviation Regulation 2023/2405 (correctly implemented mandate
schedule including the PtL 5x multiplier note) · UK SAF Mandate (correctly implemented) · IRS
Notice 2023-06 §40B SAF Production Tax Credit (correctly implemented sliding-scale formula and
cap) · ICAO CORSIA Annex 16 Vol IV (voluntary/mandatory phase transition approximated, not
data-sourced).
