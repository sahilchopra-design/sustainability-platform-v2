## 7 · Methodology Deep Dive

### 7.1 What the module computes

50 named world cities across 4 income groups and 7 regions are generated once via the seeded PRNG
`sr(s)=frac(sin(s+1)×10⁴)`, each carrying a composite climate-hazard score, an adaptation-finance
need, a green-bond issuance capacity, a resilience credit-rating proxy, and an "adaptation ROI"
metric. The core formulas:

```
composite       = heatIsland×0.30 + floodRisk×0.30 + waterStress×0.25 + airQuality×0.15
adaptNeedPerCap = 50 + composite×2 + noise(0–200)                      // $ per 100k people
adaptTotal      = adaptNeedPerCap × population(M) × 10                 // $M
bondCapacity    = gdpPerCapita × population(M) × 0.002 + noise(0–50)   // $M
resScore        = 100 − composite + gdpPerCapita/2000, clamped [0,100]
damageAvoided   = adaptTotal × (0.3 + noise×0.4)                       // always 30–70% of adaptTotal
adaptROI        = (damageAvoided − adaptTotal) / adaptTotal × 100      // ⟹ ALWAYS negative, see §7.4
```

### 7.2 Parameterisation

| Element | Weights / range | Provenance |
|---|---|---|
| Composite hazard weights | Heat Island 30%, Flood Risk 30%, Water Stress 25%, Air Quality 15% | Platform-defined; heat and flood weighted equally highest, water stress close behind, air quality lowest — a defensible but uncited weighting scheme |
| `CITIES` (50) | Real named cities (London, New York, Tokyo, Mumbai, Lagos, São Paulo, Cairo, Jakarta, Dhaka...) spanning all income tiers and regions | Real city names; all risk/finance attributes are `sr()`-seeded synthetic data, not sourced from actual city hazard maps |
| `resScore` formula | `100 − composite + gdpPcap/2000` | **Not bounded before the final clamp** — for a wealthy, low-hazard city, the raw score can exceed 100 (e.g. London: raw 113.3, clamped to 100); the clamp masks this rather than the formula itself producing a sensible 0–100 range |
| `adaptRoi` formula | `(damageAvoided − adaptTotal)/adaptTotal × 100` where `damageAvoided = adaptTotal×(0.3–0.7)` | **Mathematically guaranteed to be negative for every city** — see §7.4 |
| `BOND_TYPES` (5) | Green, Blue, Adaptation, Resilience, Municipal Bond | Real bond-instrument categories relevant to municipal climate finance |

### 7.3 Calculation walkthrough

1. **Composite hazard score**: a genuine weighted sum of 4 independently-seeded 0–100 hazard scores
   — correctly implemented arithmetic, though each underlying hazard score is a flat random draw,
   not derived from actual climate hazard data (WRI Aqueduct, C40 heat maps, etc., despite these
   being cited in the guide).
2. **Adaptation finance need**: scales with composite hazard (2 $/pp of composite) plus a
   population multiplier — directionally sensible (higher hazard + larger population → larger
   finance need) though the specific $50 base and 2× hazard multiplier are unexplained constants.
3. **Green bond capacity**: scales with GDP per capita × population × 0.002 — a rough fiscal-capacity
   proxy; the 0.002 scalar is an unexplained platform constant.
4. **Resilience rating**: `resScore` combines inverse hazard (100−composite) with a wealth bonus
   (`gdpPcap/2000`, meaning every $2,000 of GDP/capita adds 1 point) — for a city with GDP/capita
   above ~$140,000 and low hazard, this formula alone can exceed 100 before clamping (as shown for
   London above), meaning the eventual "AAA/AA" rating threshold (≥70) is reached partly through
   clamped-away headroom rather than a genuinely bounded 0–100 scale.
5. **Adaptation ROI — the structural defect**: `damageAvoided` is defined as a *fraction* (30–70%)
   of `adaptTotal` (the adaptation *cost*), not as an independently-modelled avoided-damage figure —
   so by construction `damageAvoided < adaptTotal` always, and the ROI formula
   `(damageAvoided−adaptTotal)/adaptTotal` is therefore **always negative**, ranging from exactly
   −70% (when the noise term is 0) to exactly −30% (when the noise term is 1). No city in the
   50-city dataset can ever show a positive adaptation ROI, regardless of its actual hazard profile
   or investment efficiency.

### 7.4 Worked example (London, `i=0`)

| Metric | Computation | Result |
|---|---|---|
| Heat Island / Flood / Water Stress / Air Quality | independent `sr()` draws | 7.4 / 12.8 / 45.3 / 21.6 |
| Composite | `7.4×0.30+12.8×0.30+45.3×0.25+21.6×0.15` | **20.6** |
| Population / GDP per capita | independent `sr()` draws | 19.5M / $67,756 |
| Adaptation need per capita | `50+20.6×2+noise` | **$228/100k** |
| Adaptation total | `228×19.5×10` | **$44,460M** |
| Bond capacity | `67756×19.5×0.002+noise` | **$2,656M** |
| Resilience score (raw, pre-clamp) | `100−20.6+67756/2000` | **113.3** → clamped to **100** ("AAA/AA") |
| Damage avoided | `44460×(0.3+noise×0.4)` | **$27,290M** (61.4% of adaptTotal) |
| Adaptation ROI | `(27290−44460)/44460×100` | **−39%** |

Even London — a wealthy, comparatively low-hazard city — shows a −39% "adaptation ROI," which would
misleadingly suggest that investing in climate adaptation destroys value, directly contradicting the
real-world literature the guide itself cites (Global Commission on Adaptation: $1 invested in
adaptation yields $2–10 in benefits, i.e. a *positive* BCR of 2–10x, not −0.3 to −0.7x).

### 7.5 Companion analytics

- **City Benchmarks tab** — sortable/filterable table across all 50 cities by region/income group.
- **Green Finance tab** — bond capacity vs adaptation need gap per city, useful for identifying
  cities where self-financing capacity falls short of assessed need.
- **Advanced Analytics tab** — delegates to the shared `BuiltEnvironmentAdvancedAnalytics` component
  (not independently reviewed in this deep dive).

### 7.6 Data provenance & limitations

- **All 50 cities' hazard, finance, and rating figures are synthetic** — real city names are used,
  but no actual WRI Aqueduct, C40, or IPCC AR6 hazard data is ingested despite the guide citing
  these as sources.
- **The Adaptation ROI metric is structurally broken** — as shown above, it cannot ever return a
  positive value given how `damageAvoided` is defined as a strict fraction of `adaptTotal`; this
  should be redesigned so `damageAvoided` is an independently-modelled avoided-loss estimate (e.g.
  via an expected-annual-loss framework) that can exceed the adaptation cost, consistent with the
  real-world finding that well-targeted adaptation investment typically has a benefit-cost ratio
  well above 1.
- **The resilience score is not genuinely bounded to [0,100]** prior to the final `Math.min/max`
  clamp — wealthy, low-hazard cities can hit the ceiling, compressing meaningful differentiation
  among the platform's highest-rated cities.

### 7.7 Framework alignment

- **IPCC AR6 WGII Chapter 6 (Cities)**: cited as the basis for the composite hazard framework; the
  code's 4-hazard weighted composite is a simplified illustrative proxy, not a direct implementation
  of any specific IPCC risk-assessment methodology.
- **C40 Cities Climate Risk Assessment**: cited for urban heat island framing (+1.5–4°C above rural
  areas); the module's `heatIsland` field is a 0–100 relative score, not a temperature-differential
  measurement.
- **UNEP Adaptation Gap Report**: cited as the source for the real-world finding that adaptation
  investment yields a positive benefit-cost ratio — directly contradicted by the module's own
  `adaptRoi` calculation (see §7.4), which is the clearest case in this batch of a module's own
  arithmetic conflicting with the framework it cites.
- **Climate Bonds Initiative — City Climate Finance**: the 5-bond-type taxonomy (Green, Blue,
  Adaptation, Resilience, Municipal) matches real municipal climate-bond market categories.
