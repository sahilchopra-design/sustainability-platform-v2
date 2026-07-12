## 7 · Methodology Deep Dive

### 7.1 What the module computes

This is the platform's best-implemented real-estate valuation module and is the module that
should actually back the "Climate Adjusted Value" methodology the sibling `real-assets-climate`
guide entry describes (but that module's code never implements it — see its own deep dive). Three
linked calculations:

```
grossValue      = NOI / (capRate / 100)                                   // income capitalisation
adjustedCapRate = max(2.5, capRate − greenAdj × capRate)                  // green-premium yield compression
adjustedValue   = NOI / (adjustedCapRate / 100)
climateHaircutPct = 2 + sr(GIA×0.001 + 1) × 8                             // 2–10%
climateAdjValue = adjustedValue × (1 − climateHaircutPct / 100)
```

where `greenAdj = EPC_PREMIUM[epc] + BREEAM_PREMIUM[breeam]` when the user toggles "apply green
adjustment" on.

**Guide simplification note:** the guide's formula is a multi-period DCF with a climate-risk-loaded
discount rate and a capex-netting term, `V = Σ(NOI_t/(1+r+r_climate)^t) − PV(capex_energy)`. The
code instead uses a **single-period income capitalisation** (`NOI/capRate`, standard UK valuation
practice) with climate risk applied as a **post-hoc percentage haircut on value**, not as an
addition to the discount rate, and no explicit energy-capex NPV is netted off. This is a
legitimate, commonly-used valuation shortcut (RICS Red Book permits direct capitalisation for
stabilised assets) but is not literally the guide's stated DCF formula.

### 7.2 Parameterisation

| Table | Values | Provenance |
|---|---|---|
| `EPC_PREMIUM` | A +8%, B +4%, C 0, D −2%, E −6%, F −10%, G −15% | Synthetic but directionally consistent with published "green premium/brown discount" literature (JLL, CBRE studies report low-single-digit to low-teens % swings by EPC band) |
| `BREEAM_PREMIUM` | Outstanding +5%, Excellent +3%, Very Good +1%, Good 0, Pass −1%, Unrated −2% | Synthetic, same directional logic |
| `LOC_CAP_ADJ` (cap-rate location adjustment, pts) | London City 0.0, West End −0.3, Manchester +0.8, Edinburgh +0.6, Birmingham +0.9, Bristol +0.7 | Synthetic — correctly reflects that prime London carries the lowest (most expensive) cap rate and regional UK cities trade wider |
| `CLIMATE_SCENARIO_FACTORS` (hazard multiplier by scenario) | Current 1.0× all; RCP4.5 flood 1.3/heat 1.5/subsidence 1.2/coastal 1.4/wildfire 1.6; RCP8.5 flood 1.8/heat 2.2/subsidence 1.5/coastal 2.0/wildfire 2.5; NZ2050 flood 1.1/heat 1.2/subsidence 1.0/coastal 1.1/wildfire 1.2 | Synthetic but ordinally correct: RCP8.5 (hot-house) > RCP4.5 (moderate) > NZ2050 (managed transition) ≈ Current, and heat/wildfire scale faster than flood/subsidence — consistent with IPCC AR6 physical-hazard trajectories |
| `climateHaircutPct` range | 2–10% | Synthetic, order-of-magnitude consistent with the sibling guide's own cited "Estimated Climate Discount 8.4%" |
| GRESB 2030 target | 85 (out of 100), 4-year horizon | UI assumption, not sourced to a specific GRESB target-setting standard |

### 7.3 Calculation walkthrough

1. **Property Valuation tab**: user sets NOI (£M), base cap rate (%), EPC, BREEAM, GIA. `epcAdj`
   and `breeamAdj` are looked up from the premium tables; if "apply green adjustment" is toggled,
   `greenAdj = epcAdj+breeamAdj` compresses the cap rate (`adjustedCapRate`, floored at 2.5% to
   avoid an unrealistic/negative yield), which **raises** value since `V=NOI/capRate` is inversely
   proportional to the rate. `climateHaircutPct` (seeded off `propGIA`) then multiplies down the
   green-adjusted value to `climateAdjValue`.
2. **Comparable evidence** (`compEvidence`): pulls up to 5 properties from the static 30-asset
   `PORTFOLIO` matching the selected type+location (falling back to type-only matches), each with
   its own implied value `noi/(baseCapRate/100)` — a genuine comparable-transaction-style cross
   check against the user's inputs.
3. **Climate Risk Overlay tab**: for a selected portfolio property, `climateRiskScores` scale the
   property's `baseRisk` (5 hazards, each 5–80 at "Current") by the selected scenario's hazard
   multipliers, capped at 100. `totalClimateRisk` is the unweighted mean of the 5 scaled hazard
   scores (equal-weighted, unlike the hazard-weighted composite in `real-estate-climate-risk`).
4. **Scenario haircut comparison** (`scenarioHaircuts`): for every scenario, computes
   `mean(hazardFactors) × property.climateHaircut × 0.4` — i.e. the property's own base climate
   haircut (1–13%, seeded at property creation) scaled by how severe the scenario's average hazard
   multiplier is, times a 0.4 dampening constant.
5. **Bulk ranking** (`bulkRanked`): all 30 portfolio properties sorted by `totalRisk` descending —
   `totalRisk` is the mean of the 5 **base** (Current-scenario) hazard scores set at property
   creation, independent of the currently-selected scenario in the Climate Risk tab.
6. **GRESB Benchmarking tab**: 20 named UK-listed REITs with synthetic `gresb`/`mgmt`/`perf`
   scores; `annualGap = max(0, (85 − fund.gresb)/4)` — required annual point improvement to hit an
   85-by-2030 target; `peerRank` — sector-relative rank by GRESB score among funds sharing the
   same `sector` tag.

### 7.4 Worked example

Property Valuation tab, `propNOI=£3.5M`, `capRate=5.0%`, `epc=A` (+8%), `breeam=Very Good` (+1%),
green adjustment **applied**, `propGIA=50,000 m²`:

| Step | Formula | Result |
|---|---|---|
| `grossValue` | `3.5/(5.0/100)` | **£70.0M** |
| `greenAdj` | `0.08+0.01` | 0.09 |
| `adjustedCapRate` | `max(2.5, 5.0−0.09×5.0)` | `5.0−0.45=` **4.55%** |
| `adjustedValue` | `3.5/(4.55/100)` | **£76.92M** |
| `greenDelta` | `76.92−70.0` | **+£6.92M** (+9.9% green uplift) |
| `climateHaircutPct` | `2+sr(50000×0.001+1)×8 = 2+sr(51)×8` | `sr(51)=frac(sin(52)×10⁴)≈0.6603` → `2+5.28=` **7.3%** |
| `climateAdjValue` | `76.92×(1−0.073)` | **£71.30M** |

Net effect: EPC-A/BREEAM-Very-Good green premium adds ~£6.9M, climate physical-risk haircut
removes ~£5.6M, landing close to the ungreened base value — illustrating how a green premium can
be materially eroded by physical climate risk on the same asset.

### 7.5 GRESB target-gap rubric

| Metric | Formula |
|---|---|
| Annual GRESB gap | `max(0, (85 − current) / 4)` pts/yr needed to reach 85 by 2030 |
| Peer rank | position within same-sector fund list sorted by GRESB descending |

### 7.6 Companion analytics

Property Valuation (single-asset calculator + comparable evidence table), Climate Risk Overlay
(per-property hazard radar + scenario haircut bar + bulk 30-property risk ranking), GRESB
Benchmarking (fund scorecard + sector peer rank + carbon/energy/water intensity), Methodology tab
(static text describing the approach).

### 7.7 Data provenance & limitations

- **All 30 portfolio properties and 20 GRESB funds are synthetic**, generated by
  `sr(seed)=frac(sin(seed+1)×10⁴)`; property and fund names are real-sounding UK addresses/REIT
  names used as labels only, not linked to actual valuations or GRESB scores.
- Single-period income capitalisation, not a full multi-period DCF as the guide's formula states —
  no explicit cash-flow projection, terminal value, or discount-rate build-up.
- Climate haircut is a **flat percentage on value**, not derived from the same hazard scores shown
  in the Climate Risk Overlay tab for the *same* property — the two climate metrics
  (`climateHaircutPct` in the Valuation tab vs `climateRiskScores`/`totalClimateRisk` in the Risk
  Overlay tab) are computed from different, uncorrelated seeds for the same asset.
- `scenarioHaircuts` mixes a property's own climate haircut constant with the *portfolio-average*
  hazard multiplier rather than that property's own scaled hazard scores — an internal
  inconsistency a model-validation reviewer would flag.
- No energy-upgrade capex NPV is netted from value despite being named in the guide ("Energy
  Upgrade Capex £142/m²" data point) — retrofit cost does not appear anywhere in this file.

**Framework alignment:** RICS Valuation – Professional Standards (Red Book) — direct income
capitalisation is a RICS-permitted method for stabilised income-producing assets · CRREM — invoked
by name in the header but no per-property CRREM pathway/stranding-year check exists in this file
(contrast with `real-estate-carbon-analytics`) · GRESB — fund-level Management/Performance
component scores are represented structurally, though the composite `gresb` score is a single
synthetic draw rather than GRESB's real weighted-aspect scoring · TCFD — physical-hazard scenario
overlay (Current/RCP4.5/RCP8.5/NZ2050) follows TCFD's recommended scenario-analysis structure.
