## 7 · Methodology Deep Dive

This module implements a genuine **discounted bond-pricing engine** for SLL/SLB ratchet economics —
notably stronger than the sibling `sustainability-linked-finance` module (which computes undiscounted
lifetime cashflow sums). No guide↔code mismatch blockquote is triggered: the guide's formula set
(`SPT Ambition`, `Ratchet NPV`, `Compliance Score`) is broadly represented, with the important nuance
that here it is expressed as a **present-value bond price**, not a standalone NPV-of-ratchet
calculation.

### 7.1 What the module computes

A 10-tab tool (`TABS`) spanning instrument overview, an interactive SLL pricing engine, a KPI
framework library (8 template KPIs across GHG intensity, renewable share, water intensity, gender
diversity, safety, Scope 3, biodiversity, EV fleet), SPT calibration guidance, ratchet-mechanics
sensitivity, real historical SLB/SLL market-volume series (2019–2024), sector analysis, a
greenwashing-risk due-diligence checklist, documentation requirements, and a financial-institution
(FI) fee-revenue model.

### 7.2 Core pricing formula

```js
function calcSllPricing({ notionalM, baseSpread, ratchetBps, stepUpProb, maturityYr, wacc }) {
  const w = wacc / 100;
  expectedStepUp   = ratchetBps × stepUpProb / 100
  expectedStepDown = ratchetBps × (1 − stepUpProb / 100)
  annCoupon = notionalM × (baseSpread + expectedStepUp − expectedStepDown) / 10000
  pv = Σ_{y=1..maturityYr} annCoupon / (1+w)^y  +  notionalM / (1+w)^maturityYr
  return { expectedStepUp, expectedStepDown, annCoupon, pv, greeniumBps: expectedStepDown }
}
```

This is a **standard discounted-bond present-value formula**: the sum of discounted coupon
cashflows plus the discounted terminal principal repayment, exactly the structure used to price a
plain-vanilla fixed-rate bond, with the coupon itself made *probability-weighted* by blending
`expectedStepUp` and `expectedStepDown` via `stepUpProb` (the modelled probability the SPT is
missed). This directly answers the guide's `Ratchet NPV = Σ[(P(Miss)×Step-Up bps×Notional)/(1+r)^t]`
intent — probability-weighting and discounting are both present, unlike the sibling
`sustainability-linked-finance` tool.

### 7.3 Parameterisation

| Parameter | Range/Default | Provenance |
|---|---|---|
| `wacc` (discount rate) | 5.5% default, slider | User input — should equal issuer's own WACC/cost of debt in production use |
| `baseSpread` | 180 bps default | User input, representing the non-ESG credit spread |
| `ratchetBps` | 7.5 bps default, 2.5–20 bps sensitivity range | User input; sensitivity table (`ratchetBySize`) spans typical market ratchet sizes |
| `stepUpProb` | 0–100%, 30% default | User-set SPT-miss probability — a direct input, not derived from a KPI-trajectory model (contrast with `sustainability-linked-finance`'s Monte Carlo-derived `sptProb`) |
| KPI ratchet sizes (8 templates) | 4.0–8.0 bps | Illustrative, roughly ordered by KPI materiality (Scope 3: 8.0 bps highest; safety LTIR: 4.0 bps lowest) |
| FI arrangement fee | 0.35% of notional | Synthetic demo value, in line with typical loan arrangement fee ranges (25–50bps) |
| FI KPI monitoring / verification fees | $25K / $35K per KPI | Synthetic demo values |

### 7.4 Calculation walkthrough

1. **Pricing engine** (Tab 2) — live recompute of `pv`, `annCoupon`, `greeniumBps` as the user moves
   notional/spread/ratchet/stepUpProb/maturity/WACC sliders.
2. **Ratchet sensitivity** (`ratchetSensitivity`) — recomputes the full pricing at `stepUpProb =
   0,10,...,100` holding other inputs fixed, producing an 11-point greenium/coupon curve — a genuine
   one-dimensional sensitivity sweep.
3. **Ratchet-by-size** (`ratchetBySize`) — for 7 illustrative ratchet sizes (2.5–20 bps), splits into
   greenium (`r×(1−stepUpProb/100)`) and step-up (`r×stepUpProb/100`) components at the *current*
   `stepUpProb` — a decomposition chart, not a re-optimisation.
4. **FI revenue model** (`fiRevenue`) — sums arrangement fee (one-off), plus annual admin + KPI
   monitoring + verification fees compounded over `maturity` years (undiscounted lifetime total,
   unlike the coupon PV calculation — an internal inconsistency: bond cashflows are discounted but FI
   fee revenue is not).
5. **Static reference tabs** — KPI Framework, SPT Calibration, Market Intelligence, Sector Analysis,
   Greenwashing Risk, and Documentation tabs are hand-authored tables (real historical SLB/SLL market
   volumes 2019–2024 sourced in style from Climate Bonds Initiative/BNEF market reports, though not
   live-linked) — descriptive content, not computed from the pricing engine's live state.

### 7.5 Worked example

`notionalM=500`, `baseSpread=180`, `ratchetBps=7.5`, `stepUpProb=30`, `maturityYr=5`, `wacc=5.5%`:

| Step | Computation | Result |
|---|---|---|
| expectedStepUp | 7.5 × 30/100 | 2.25 bps |
| expectedStepDown (greenium) | 7.5 × (1−0.30) | 5.25 bps |
| Coupon spread | 180 + 2.25 − 5.25 | 177.0 bps |
| annCoupon | 500 × 177.0/10000 | $8.85M/yr |
| PV of coupons (5yr @5.5%) | Σ 8.85/(1.055)^y, y=1..5 | ≈ $37.75M |
| PV of principal | 500/(1.055)^5 | ≈ $383.97M |
| **Bond PV** | 37.75+383.97 | **≈ $421.7M** |

The `greeniumBps=5.25` output means the issuer's **net** effective spread (177.0 bps) sits *below*
the base spread (180 bps) because at a 30% miss-probability, the probability-weighted expected
step-down benefit (5.25 bps) outweighs the expected step-up cost (2.25 bps) — correctly capturing
that a *low* miss-probability makes an SLL cheaper for the issuer on an expected-value basis, even
though ratchets are nominally symmetric in bps size.

### 7.6 Data provenance & limitations

- `stepUpProb` is a **direct user slider input**, not derived from any KPI trajectory or historical
  base-rate — unlike `sustainability-linked-finance`'s Monte Carlo-simulated `sptProb`. A production
  tool should link the two: feed a modelled miss-probability into `calcSllPricing` rather than
  requiring the user to guess it.
- FI revenue totals are undiscounted while bond cashflows are discounted — an internal inconsistency
  that understates the time-value-adjusted cost of the fee stream relative to the coupon PV on the
  same page.
- Market-volume series (`SLB_MARKET`, `SLL_MARKET`) and sector greenium benchmarks (`ISSUER_SECTORS`)
  are static reference tables styled on real CBI/BNEF market reporting but not live-sourced; treat as
  illustrative historical context, not a live data feed.
- KPI ratchet-size templates (4.0–8.0 bps) are illustrative orderings, not calibrated against a
  materiality-weighted methodology.

**Framework alignment:** LMA/APLMA/LSTA SLL Principles and ICMA SLB Principles are represented via
the Documentation and SPT Calibration tabs' checklist content (SPO/second-party-opinion requirement,
annual KPI reporting, independent verification). SBTi Sectoral Decarbonisation Approach, IEA NZE, RE100,
WRI Aqueduct, TNFD LEAP/GBF are named as calibration bases per KPI type in the SPT Calibration table —
correct real-world benchmark attribution, presented as guidance text rather than wired into the pricing
engine's live calculation.
