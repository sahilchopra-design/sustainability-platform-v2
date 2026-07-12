# Shipping Decarbonisation Finance Analytics
**Module ID:** `shipping-decarbonization-finance` · **Route:** `/shipping-decarbonization-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DZ4 · **Sprint:** DZ

## 1 · Overview
Shipping decarbonisation finance analytics covering Poseidon Principles alignment, CII rating, IMO GHG Strategy carbon levy, alternative fuel investment (methanol, ammonia, LNG), and OPEX/CAPEX trade-off modelling.

> **Business value:** Delivers shipping decarbonisation investment analytics integrating Poseidon Principles alignment, IMO carbon levy exposure, and alternative fuel CAPEX/OPEX modelling to guide fleet transition financing.

**How an analyst works this module:**
- Calculate fleet-wide CII ratings and Poseidon Principles alignment using AER and cgDIST methodology
- Model carbon levy exposure under IMO GHG Strategy 2023 flat levy and basket of measures scenarios
- Evaluate alternative fuel investment NPV: CAPEX premium vs fuel cost savings and levy avoidance over 20yr ship life
- Generate lender-ready Poseidon Principles disclosure and fleet transition roadmap to Paris-aligned trajectory

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALT_FUELS`, `CII_TRANSITION`, `FINANCE_INSTRUMENTS`, `FLEET_SEGMENTS`, `IMO_TRAJECTORY`, `Kpi`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `FLEET_SEGMENTS` | 7 | `name`, `count`, `avgDwt`, `co2MtYear`, `ciiRating`, `eexiCompliant`, `altFuelReady`, `transitionCapex`, `govtSubsidy` |
| `ALT_FUELS` | 7 | `energyDensity`, `gwp100`, `readiness`, `costPremium`, `bunkering`, `imoApproved`, `range`, `color` |
| `IMO_TRAJECTORY` | 7 | `baselineGhg`, `imo2050Target`, `achievedGhg` |
| `FINANCE_INSTRUMENTS` | 7 | `provider`, `size`, `tenor`, `rate`, `trigger`, `bestFor` |
| `CII_TRANSITION` | 7 | `A`, `B`, `C`, `D`, `E` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Overview', 'Fleet Segments', 'Alternative Fuels', 'IMO 2050 Trajectory', 'CII/EEXI Compliance', 'Finance Instruments', 'Retrofit Calculator', 'Poseidon Principles', 'Carbon Levy', 'Deal Pipeline'];` |
| `totalSaving` | `annFuelSaving + carbonPriceSaving;` |
| `carbonPriceSaving` | `calcCarbonLevy({ co2Tonnes: vesselCo2 * 0.3, levyPerTonne: carbonPrice }) / 1e6;` |
| `payback` | `calcRetrofitPayback({ vesselValue: seg.transitionCapex * 0.6, retrofitCost: retrofitCapex, annFuelSaving, carbonPriceSaving });` |
| `totalFleetCo2` | `FLEET_SEGMENTS.reduce((s, f) => s + f.co2MtYear, 0);` |
| `avgEexiCompliance` | `FLEET_SEGMENTS.length > 0 ? FLEET_SEGMENTS.reduce((s, f) => s + f.eexiCompliant, 0) / FLEET_SEGMENTS.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALT_FUELS`, `CII_TRANSITION`, `FINANCE_INSTRUMENTS`, `FLEET_SEGMENTS`, `IMO_TRAJECTORY`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Poseidon Principles Alignment Score | `Vessel AER vs Poseidon Principles climate trajectory for vessel type (% above/below)` | Poseidon Principles annual alignment report | Negative = above trajectory (worse); aligned banks require fleets to converge to 0% by 2050; ESRS disclosure required |
| CII Rating | `Carbon Intensity Indicator annual rating (A-E) vs IMO reference line` | IMO MEPC.354(78) CII guidelines | D or E rating for 3 consecutive years triggers corrective action plan; lenders increasingly requiring B or better |
| Alternative Fuel CapEx Premium | `Incremental cost of methanol-ready dual-fuel newbuild vs conventional` | Clarkson Research / DNV fuel-ready ship cost data | Ammonia $25-35M premium; LNG $8-15M; methanol $15-25M; fuel availability and price spread determine payback period |
- **IMO GISIS ship registry and CII data** → Vessel DWT, type, fuel consumption, voyage data → CII calculation → **Fleet alignment and CII ratings**
- **Poseidon Principles annual alignment reports** → Trajectory benchmarks by vessel type and year → alignment gap calculation → **Lender disclosure and portfolio alignment score**
- **DNV / Clarksons fuel price scenarios** → Alternative fuel cost projections (methanol, ammonia, green hydrogen) → NPV sensitivity → **Fuel switching investment case**

## 5 · Intermediate Transformation Logic
**Methodology:** Shipping Decarbonisation Investment Analytics
**Headline formula:** `CII Score = AER or cgDIST / Reference Line; Decarbonisation CAPEX NPV = ΔFuel Cost × OPEX Savings - Retrofit CAPEX + Carbon Levy Avoidance`

Investment model for shipping decarbonisation comparing fuel switching CAPEX against fuel cost and carbon levy savings, benchmarked to Poseidon Principles CII alignment

**Standards:** ['IMO GHG Strategy 2023 (MEPC 80)', 'Poseidon Principles v3.0 — Ship Finance Alignment', 'SEA-LNG / Ammonia Energy Association fuel cost benchmarks']
**Reference documents:** IMO (2023) Revised GHG Strategy MEPC 80 — 2030/2050 Targets and Carbon Levy; Poseidon Principles (2023) Framework v3.0 — Financial Sector Climate Alignment; DNV (2023) Maritime Forecast to 2050 — Fuel and Technology Pathways; UMAS / UCL (2023) IMO Carbon Levy Revenue and Shipping Transition Finance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — From simple payback to the promised 20-year NPV with fuel-specific abatement (analytics ladder: rung 1 → 2)

**What.** This is the strongest module in the shipping family: `calcCiiScore` implements the real IMO MEPC.354(78) formula (attained AER ÷ reference AER × 100), segment data is hand-curated from real global fleet statistics, and the payback function guards its edge case honestly. But the guide's headline promises "CAPEX NPV … over 20yr ship life" while the code computes simple payback only, and §7.6 lists three quantified gaps: the emissions-reduction assumption is a single fixed 30% constant regardless of fuel (green ammonia ≈ full reduction; LNG ≈ 20% ignoring methane slip), `avgEexiCompliance` is unweighted by fleet size, and `totalFleetCo2` (613 Mt) versus `globalShippingCo2` (1,080 Mt) is unreconciled on-page. Evolution A delivers the promised NPV and fixes all three.

**How.** (1) Discounted cash-flow over vessel life: retrofit CAPEX at t0; annual fuel-cost delta, levy avoidance, and OPEX per year; user-set discount rate; NPV and IRR alongside the existing payback. (2) Per-fuel reduction factors sourced from the `ALT_FUELS` table's own energy-density/GWP data (already physically accurate per §7.6), including a methane-slip toggle for LNG. (3) DWT-weight the compliance average. (4) A one-line footnote reconciling the 467 Mt gap (untracked segments: general cargo, fishing, offshore).

**Prerequisites.** None external — all inputs are already on the page; levy scenarios should reference the FuelEU $100–200/t range the module already carries. **Acceptance:** NPV at discount rate 0 equals undiscounted savings minus CAPEX; switching fuel selection changes the reduction factor and the NPV; the weighted compliance figure differs from the unweighted one on screen.

### 9.2 Evolution B — Poseidon Principles disclosure drafter (LLM tier 1)

**What.** The workflow's final step — "generate lender-ready Poseidon Principles disclosure and fleet transition roadmap" — is a structured drafting task over numbers the module genuinely computes. Evolution B drafts the annual climate-alignment disclosure a signatory bank files: portfolio alignment delta versus the IMO trajectory (the page's declining-to-zero 2050 chart), per-segment CII positioning from `calcCiiScore`, and the financing narrative referencing the real instruments in `FINANCE_INSTRUMENTS` (whose rates/tenors/triggers §7.6 confirms are realistic).

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/shipping-decarbonization-finance/ask`, corpus = this Atlas record (the §7.2 segment table and framework notes are the grounding) plus live calculator state. The disclosure template mirrors Poseidon Principles v3.0 reporting structure; every alignment score in the draft must equal a `calcCiiScore` output, and scenario paragraphs cite which levy assumption produced them. Refusal for segments outside the six covered.

**Prerequisites.** Evolution A's NPV, so financing narratives can cite investment economics rather than payback alone; a decision on whether disclosures persist (suggests a small `pp_disclosures` table). **Acceptance:** a generated disclosure's alignment figures reproduce from the on-page calculators; the draft explicitly labels the 6-segment coverage boundary against the 1,080 Mt global total.