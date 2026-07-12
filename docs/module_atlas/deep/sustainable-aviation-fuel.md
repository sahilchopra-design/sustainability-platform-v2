## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine is a lifecycle carbon-intensity
> formula, `CI = (GHG_feedstock + GHG_process + GHG_use) / MJ_fuel`, well-to-wake gCO₂e/MJ per
> CORSIA/RED III methodology. **No such per-MJ carbon-intensity calculation exists in the code.**
> The `PW_GHG` table stores a **% GHG-reduction figure** (65–95%) per pathway relative to fossil jet
> fuel — a different, coarser unit than the guide's absolute gCO₂e/MJ intensity, and it is a static
> literal, not computed from feedstock/process/combustion emission components. The one genuine
> calculator on the page (`calcMandateCost`, §7.4) has its own scaling issue that understates
> realistic carbon savings per tonne of SAF by roughly an order of magnitude — documented below.

### 7.1 What the module computes

4 tabs (Market Overview, Pathway Comparison, Mandate Tracker, Investment & Offtakes) built on: 8 SAF
production pathways (HEFA, Fischer-Tropsch, AtJ, DSHC, Co-processing, e-Kerosene/PtL, Pyrolysis,
Gasification) each with static feedstock description, CORSIA/EU-RED eligibility flags, GHG-reduction
%, technology-readiness level (TRL), production cost ($/gal), and 2024/2030 capacity; 60 named
real-world producers (Neste, World Energy, Montana Renewables, LanzaTech, Shell SAF, etc.) with
`sr()`-seeded capacity/operational-%/investment/IRR; a genuinely detailed 26-country mandate table
(`MANDATES` — EU ReFuelEU, UK, US IRA tax credit, Japan, Korea, India, Brazil RenovaBio, etc., with
real 2030/2050 targets and enforcement mechanisms); the accurate EU ReFuelEU blending timeline
(2%→70% by 2050, with synthetic-fuel sub-quotas); and 30 airline-producer offtake agreements.

### 7.2 Genuine calculations

```js
totalProd = Σ producers.capacity_kt × producers.operational_pct        // weighted operational output
totalCap  = Σ producers.capacity_kt
totalInv  = Σ producers.investment_m
regionDonut[r] = round(REG_SHARE[r] × totalProd)                       // fixed regional share, not geocoded
```

`operational_pct` is itself a tiered synthetic function of a random draw (`s2>0.6→100% operational,
s2>0.3→50-90%, else 0%`), not derived from `stage`/`capacity` in a causal way — but the aggregation
arithmetic (weighted sum, region-share allocation) is correct given those inputs.

### 7.3 Pathway comparison radar & cost curves

```js
CostCompetitiveness(pw) = round(100 − PW_COST[pw]×15 + noise)     // inverse of $/gal cost
Scalability(pw)         = round(PW_CAP_2030[pw]/15×70 + noise)    // normalised to a 15Mt/yr ceiling
FeedstockAvailability   = round(40 + noise×55)                    // pure random, no feedstock-supply model
GHGReduction(pw)         = PW_GHG[pw]                              // static literal, verbatim
TechReadiness(pw)        = PW_TRL[pw] × 10                         // TRL 1-9 rescaled to 10-90
Certification(pw)        = PW_CORSIA[pw] ? 80+noise×20 : 30+noise×20

costProjections[year][pw] = PW_COST[pw] × (1 − decline)^yearsSince2024,  decline = 4-6%/yr (sr-seeded)
```

The cost-decline curve applies a **learning-curve-style exponential decay** (4–6%/yr, itself
randomised per pathway/year rather than a fixed learning rate) to each pathway's static 2024 cost —
a reasonable functional form for technology cost projection, though the decline rate is not derived
from a cited experience-curve elasticity (e.g. a learning rate tied to cumulative capacity doublings,
the standard Wright's Law approach used in IEA/BNEF cost-projection work).

### 7.4 Mandate compliance cost calculator (with a scaling defect)

```js
safNeeded  = totalFuelDemand × mandate_t2030_pct/100
premCost   = safNeeded × pricePremium          // $/tonne SAF-vs-Jet premium
carbonSaved = safNeeded × 0.003 × 80
carbonOffsetValue = carbonSaved × carbonPrice/80    // simplifies to safNeeded×0.003×carbonPrice
netCost    = premCost − carbonOffsetValue
```

The `×80` in `carbonSaved` and `÷80` in `carbonOffsetValue` cancel algebraically, so the calculation
reduces to `carbonOffsetValue = safNeeded × 0.003 × carbonPrice` — implying **0.003 tCO₂ saved per
tonne of SAF**. This is roughly **1,000× too low**: jet fuel's combustion emissions alone are
~3.16 tCO₂/tonne, and at the pathway table's own 65–95% GHG-reduction range, a tonne of SAF should
displace on the order of **2–3 tCO₂**, not 0.003. Given `0.003 × 80 = 0.24`, it's possible the
intended constant was meant to read as "0.003 kt CO₂ per tonne fuel × factor" and the units were
mismatched during construction — but as written, the mandate-cost calculator's `carbonOffsetValue`
column materially understates the emissions-value offset against the premium cost, systematically
making SAF mandate compliance look far more expensive net of carbon value than the underlying
GHG-reduction assumptions would imply.

### 7.5 Worked example

At `calcFuel=100,000` (tonnes jet fuel demand), `pricePremium=$1,500/t`, `carbonPrice=$80/tCO₂`, for
the EU ReFuelEU mandate (`t2030=6`): `safNeeded = 100,000×0.06 = 6,000t`. `premCost =
6,000×1,500 = $9.0M`. `carbonSaved = 6,000×0.003×80 = 1,440`; `carbonOffsetValue =
1,440×80/80 = $1,440`... more precisely `= 6,000×0.003×80 = $1,440` (already in dollars given the
`×carbonPrice/80` collapses to `×0.003×carbonPrice=6000×0.003×80=$1,440`). `netCost = 9,000,000 −
1,440 ≈ $8,998,560` — the carbon-value offset is **negligible** (0.016% of the premium cost) because
of the scaling defect in §7.4, when using a defensible reduction assumption (e.g. 2.5 tCO₂/tonne SAF
× $80/tCO₂ = $200/tonne = $1.2M for 6,000t) the offset should be roughly **800× larger** and would
meaningfully reduce net mandate-compliance cost in the display.

### 7.6 Data provenance & limitations

- **Producer capacities, IRRs, and offtake-agreement terms are `sr()`-seeded synthetic figures**
  attached to real company names (Neste, Shell, bp, TotalEnergies, LanzaTech etc.) — treat as
  illustrative market-sizing, not actual disclosed capacity/financials.
- **Mandate table content (`MANDATES`, `REFUELEU_TIMELINE`) is accurate, real regulatory content** —
  EU ReFuelEU's 2%/2025→70%/2050 trajectory with synthetic-fuel sub-quotas, UK SAF mandate + buy-out
  mechanism, US IRA blenders' tax credit, matches published regulatory text.
- No lifecycle CI (gCO₂e/MJ) calculation exists; `PW_GHG` is a static %-reduction literal per
  pathway, not derived from feedstock/process/combustion emission factors.
- The mandate-cost calculator's carbon-offset-value term is scaled incorrectly (§7.4) — this should
  be corrected before the tool is used for any real compliance-cost decision.

**Framework alignment:** ICAO CORSIA eligibility (`PW_CORSIA`) and EU RED III/ReFuelEU eligibility
(`PW_EURED`) are represented as accurate per-pathway boolean flags matching each scheme's actual
approved-pathway lists (both schemes currently exclude Pyrolysis as ineligible, correctly reflected).
ASTM D7566 (the SAF blending/certification standard referenced in the guide) is not represented in
code at all — no blend-ratio or fit-for-purpose certification logic exists.
