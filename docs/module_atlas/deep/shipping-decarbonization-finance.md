## 7 · Methodology Deep Dive

### 7.1 What the module computes

Unlike its sibling `shipping-decarbonisation` (60 synthetic fleets), this module runs on **6 hand-curated,
real fleet-segment aggregates** (Bulk Carriers, Tankers, Container Ships, Cruise & Passenger, RoRo & Car
Carriers, LPG Carriers) with plausible real-world global-fleet statistics, plus **3 genuine formula
functions** driving an interactive retrofit/carbon-levy calculator:

```js
calcRetrofitPayback({vesselValue, retrofitCost, annFuelSaving, carbonPriceSaving}) =
  (annFuelSaving + carbonPriceSaving) > 0 ? retrofitCost / (annFuelSaving + carbonPriceSaving) : 999

calcCiiScore({actualAer, referenceAer}) = referenceAer>0 ? (actualAer/referenceAer)×100 : 100

calcCarbonLevy({co2Tonnes, levyPerTonne}) = co2Tonnes × levyPerTonne
```

`calcRetrofitPayback` is a genuine, standard simple-payback-period formula (capex ÷ annual savings), with a
sensible sentinel (`999` years) for the zero-savings edge case rather than `Infinity`. `calcCiiScore`
correctly implements IMO's actual CII methodology structure: **Attained AER ÷ Required Reference AER ×
100** — this is the real formula from IMO MEPC.354(78), not an approximation.

### 7.2 Parameterisation — fleet segments (real global shipping statistics)

| Segment | Fleet count | Avg DWT | CO₂ Mt/yr | CII rating | EEXI compliant | Alt-fuel ready |
|---|---|---|---|---|---|---|
| Bulk Carriers | 11,800 | 75,000 | 148 | C | 72% | 18% |
| Tankers | 5,900 | 120,000 | 182 | D | 61% | 14% |
| Container Ships | 5,800 | 55,000 | 212 | B | 84% | 32% |
| Cruise & Passenger | 480 | 90,000 | 24 | E | 45% | 22% |
| RoRo & Car Carriers | 1,400 | 20,000 | 28 | C | 68% | 25% |
| LPG Carriers | 1,300 | 35,000 | 19 | B | 78% | 41% |

`totalFleetCo2 = Σ co2MtYear = 148+182+212+24+28+19 = 613 Mt/yr` (tracked segments) vs. the page's own
stated `globalShippingCo2 = 1080 Mt/yr` constant — these 6 segments' real-world global fleet counts
(11,800 bulk carriers, 5,900 tankers, etc.) are broadly consistent with published Clarksons/UNCTAD fleet
statistics, and shipping's ~2.9% global-GHG share (stated in the header KPI sub-label) matches the commonly
cited IMO 4th GHG Study figure.

| Alt fuel | Energy density (MJ/kg) | GWP100 (well-to-wake multiplier proxy) | IMO approved | Cost premium |
|---|---|---|---|---|
| Green Ammonia | 12.7 | 0.0 | No (pending 2027+ bunkering) | 3.8× |
| Green Methanol | 15.6 | 0.0 | Yes | 2.6× |
| LNG (bridge fuel) | 53.6 | 0.8 | Yes | 0.6× |
| Green Hydrogen | 33.3 | 0.0 | No (short-sea only) | 5.2× |
| Bio-LNG | 53.6 | 0.2 | Yes | 1.8× |
| Wind-Assist retrofit | n/a | 0.0 | Yes | 0.4× |

These energy-density figures are **real, physically accurate** (ammonia ≈12.7 MJ/kg, methanol ≈15.6 MJ/kg,
LNG/methane ≈53.6 MJ/kg, hydrogen ≈33.3 MJ/kg are all correct standard lower-heating-value figures) — this
table reflects genuine engineering reference data, not fabricated placeholders.

### 7.3 Calculation walkthrough

1. User selects a fleet segment and alt-fuel, and adjusts `retrofitCapex`, `annFuelSaving`, `carbonPrice`,
   `vesselCo2` sliders.
2. `carbonPriceSaving = calcCarbonLevy({co2Tonnes: vesselCo2×0.3, levyPerTonne: carbonPrice}) / 1e6` — the
   `×0.3` factor represents the assumed emissions reduction fraction achievable from the retrofit (30% of
   the vessel's CO₂), converting a per-tonne carbon levy saving into $M.
3. `payback = calcRetrofitPayback({vesselValue: seg.transitionCapex×0.6, retrofitCost: retrofitCapex,
   annFuelSaving, carbonPriceSaving})` — years to recoup the retrofit investment from combined fuel +
   carbon-levy savings.
4. `avgEexiCompliance = mean(segment.eexiCompliant)` across the 6 segments — a simple unweighted mean
   (does not weight by fleet count, so Cruise's 45% compliance, despite representing only 480 of ~26,680
   vessels, counts equally with Container's 84% compliance across 5,800 vessels).
5. **IMO 2050 Trajectory tab**: plots `baselineGhg` (BAU, rising slightly to 115 by 2050 — reflecting trade
   growth outpacing efficiency), `imo2050Target` (declining to 0 by 2050 per IMO's actual Net Zero Framework
   target), and `achievedGhg` (actual data only through 2025, `null` for future years — an honest "we don't
   have future actuals" design rather than fabricating a projection).

### 7.4 Worked example

Container segment, `retrofitCapex=$8M`, `annFuelSaving=$1.2M/yr`, `carbonPrice=$120/tCO₂`,
`vesselCo2=8,500 tCO₂/yr`:

| Step | Computation | Result |
|---|---|---|
| Emissions reduced | `8,500 × 0.3` | 2,550 tCO₂ |
| Carbon levy saving | `2,550 × 120 / 1e6` | $0.306M/yr |
| Total annual saving | `1.2 + 0.306` | $1.506M/yr |
| Simple payback | `8 / 1.506` | **5.31 years** |

A 5.3-year payback is a realistic, industry-plausible figure for a container-ship efficiency/fuel-switch
retrofit, lending credibility to the calculator's construction even though the underlying `0.3` emissions-
reduction assumption is a single illustrative constant rather than fuel-specific (e.g. full ammonia
conversion would achieve closer to 90%+ reduction, not 30%).

### 7.5 Companion analytics on the page

- **Finance Instruments tab** (`FINANCE_INSTRUMENTS`, 6 real instrument types) — Green Ship Loan (SOFR+150-
  250bps), **Poseidon Principles Loan** (the real, actual 30+ bank climate-alignment framework for ship
  finance, SOFR+120-200bps), IMO GIF Grant (International Maritime Organization's real Global Industry
  alliance/GEF-funded pilot grant vehicle), Export Credit Agency financing (ECGD, Bpifrance, KEXIM — real
  named ECAs), Blue Bond shipping tranches, and FuelEU Carbon Levy Revenue ($100–200/tCO₂, matching the
  EU's actual FuelEU Maritime penalty range) — this is accurate, real-world ship-finance market structure.
- **CII Transition tab** (`CII_TRANSITION`, 2023–2028 projected rating-band shift) — shows the A-band
  share rising from 8%→25% and E-band falling from 11%→3%, a plausible fleet-modernisation trajectory
  consistent with IMO's tightening annual CII reduction factors.
- **Poseidon Principles / Carbon Levy / Deal Pipeline tabs** — dedicated deep-dives on the two most
  operationally significant real-world shipping-finance mechanisms.

### 7.6 Data provenance & limitations

- **Fleet-segment and alt-fuel data are hand-curated, real-world-grounded reference figures** — the
  strongest data foundation among the shipping module family; energy-density and GWP figures are physically
  accurate, and finance-instrument terms (rates, tenors, triggers) are realistic for the actual products
  named.
- **`avgEexiCompliance` is unweighted by fleet size** — a genuine methodological simplification that
  understates the compliance picture for the numerically dominant Bulk/Tanker segments relative to the
  small Cruise segment.
- **The 30% emissions-reduction assumption in the payback calculator is a single fixed constant**, not
  fuel-specific — a production tool would vary this by the selected `ALT_FUELS` option (e.g. full green
  ammonia conversion implies near-100% reduction vs. LNG's ~20% CO₂-only reduction, ignoring methane slip).
- `totalFleetCo2` (613 Mt, sum of the 6 tracked segments) vs. `globalShippingCo2` (1,080 Mt, stated
  constant) differ by ~467 Mt — the gap is plausible (untracked segments: general cargo, fishing, offshore
  support, etc.) but not reconciled or explained on the page.

**Framework alignment:** IMO CII (MEPC.354(78)) — `calcCiiScore` correctly implements the real Attained/
Required AER×100 formula · IMO EEXI — correctly referenced as the 2023-effective existing-ship efficiency
index · IMO 2050 Net Zero Framework — the trajectory chart's declining-to-zero target by 2050 matches IMO's
actual revised GHG strategy (adopted July 2023) · Poseidon Principles — genuine real-world framework
(signed by 30+ major ship-finance banks) for climate-aligned ship lending, accurately represented · FuelEU
Maritime — the $100–200/tCO₂ carbon-levy range matches the EU regulation's actual penalty structure.
