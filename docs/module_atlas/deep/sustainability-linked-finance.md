## 7 · Methodology Deep Dive

This module is one of the platform's **AdvisoryToolkit-family tools** — it does not use the
`sustainability_calculator.py` backend engine listed in its route file (that engine implements
LEED/BREEAM/GRESB certification scoring, unrelated to sustainability-linked debt); all SLB/SLL
economics are computed client-side against curated reference tables in
`frontend/src/features/_shared/AdvisoryReference.js`. Unlike most modules in this batch, the guide's
formulas are **substantially implemented** — SPT calibration against a real SBTi sectoral
decarbonisation pathway, a two-way coupon ratchet, an SLBP 5-component scorecard, and a genuine
Monte Carlo achievement-probability simulation. The one material gap: the guide's Ratchet-NPV formula
specifies discounting (`/(1+r)^t`), but the code's greenium/step-up/step-down cashflows are
**undiscounted** notional sums — flagged in §7.3.

### 7.1 What the module computes

For a user-configured issuer/instrument (Green Bond, SLB, SLL, Transition Bond, Blue Bond), the tool
computes: (1) weighted KPI progress toward Sustainability Performance Targets (SPTs), (2) two-way
coupon economics (greenium, step-up penalty, step-down benefit), (3) multi-tranche aggregation,
(4) an ICMA SLBP 5-component compliance scorecard, (5) a Monte Carlo probability of SPT achievement,
(6) a tornado sensitivity of net financing benefit, and (7) peer-deal benchmarking against 8 real
disclosed SLB/SLL transactions.

### 7.2 Core formulas

```js
progressPct(k) = clip(0,100, (achieved − baseline) / (spt − baseline) × 100)     // per KPI
weighted        = Σ progressPct(k) × weight_k / Σ weight_k                        // portfolio SPT progress
onTrack         = weighted >= 70

annualIntBase   = notional × coupon / 100
greenium        = notional × greeniumBps/10000 × tenor                            // lifetime, undiscounted
stepUpPenalty   = onTrack ? 0 : notional × stepUpBps/10000 × max(0, tenor−2)      // 2yr grace period
stepDownBenefit = (twoWay && weighted>=85) ? notional × stepDownBps/10000 × max(0,tenor−2) : 0
netBenefit      = greenium − stepUpPenalty + stepDownBenefit

slbpScore = Σ_components (userScore_c × weight_c / 100)                           // 5 × 20% weights
```

`progressPct` is clipped to [0,100] and handles the zero-span edge case (`spt===baseline` → 100%),
correctly avoiding a NaN/Infinity when a KPI has no required movement. The 2-year grace period
(`tenor−2`) before ratchets bite reflects standard SLB/SLL market convention (LMA guidance: the first
observation date is typically 2–3 years post-issuance, not year 1).

### 7.3 SPT ambition & the Ratchet-NPV gap

`sbtiAmbitionCheck(sector, baseline, spt, year)` (in `AdvisoryReference.js`) computes:

```js
requiredReduction = 1 − (1 − sectorSDArate)^(year−2024)      // compounded SBTi Sectoral Decarbonisation Approach rate
actualReduction   = (baseline − spt) / max(1, baseline)
aligned           = actualReduction >= requiredReduction
```

Sector SDA rates are hard-coded per sector: Utilities-Power 4.2%, Cement 2.5%, Steel 3.5%, Banks
4.2%, Real Estate 4.8%, Oil & Gas 2.9% — annual linear-equivalent reduction rates consistent with
SBTi's published Sectoral Decarbonisation Approach pathways for a 1.5°C trajectory. This **is** a
genuine SPT-ambition check against a named, sector-specific external benchmark — a materially
stronger implementation than most modules in this deep-dive batch.

**Where the code diverges from the guide:** the guide's `Ratchet NPV =
Σ[(P(Miss)×Step-Up bps×Notional)/(1+r)^t]` implies (a) a probability-weighted expectation and (b) time
value of money. The code's `greenium`/`stepUpPenalty`/`stepDownBenefit` are **deterministic,
undiscounted** point estimates — `notional × bps/10000 × tenor`, not a discounted sum over
annual observation dates, and not probability-weighted (the binary `onTrack` flag substitutes for
`P(Miss)`). The Monte Carlo module (§7.4) *does* produce a genuine achievement probability
(`sptProb`), but that probability is never fed back into `netBenefit` — the two live as parallel,
unreconciled outputs on the same page.

### 7.4 Monte Carlo SPT achievement probability

```js
projected = currentMoved + span×trend×yearsToSpt×trendMult + volShock×span×0.1
p         = clip(0,100, projected/span × 100)
forecast  = Σ p×weight / Σweight                    // per-simulation weighted progress
sptProb   = share of simulations where forecast >= 100
```

`trendMult ~ Triangular(0.75, 1.00, 1.20)` and `volShock ~ Triangular(−1.0, 0, 1.0)` — both triangular
distributions (min/mode/max), a standard low-data-requirement Monte Carlo input shape. Each KPI's
own historic `trend` rate (default 8%/yr, user-editable) drives its own projected trajectory,
compounded over `yearsToSpt = SPT_year − current_year`. This is a genuine simulation (`s.mcRuns`,
default 2,000 draws) with a re-sample button — not a decorative "Monte Carlo" label as seen in the
sibling `supply-chain-resilience` module's EAL chart.

### 7.5 Worked example

Sector "Utilities — Power" loaded via `loadSector`: KPI "Scope 1+2 emissions intensity" baseline=620,
SPT=310 (kgCO₂e/MWh), achieved=465, weight=40. `progressPct = (465−620)/(310−620)×100 =
(−155)/(−310)×100 = 50.0%`. With the other two KPIs (Renewable share: baseline 12→SPT 65,
achieved 28 → `(28−12)/(65−12)×100=30.2%`; Water: baseline 100→SPT 70, achieved 88 →
`(88−100)/(70−100)×100=40.0%`) at weights 35 and 25: `weighted = (50.0×40 + 30.2×35 + 40.0×25)/100 =
(2000+1057+1000)/100 = 40.57%` → below the 70% on-track threshold, so `onTrack=false` and the full
`stepUpPenalty` applies. At notional=₹5,000 Cr, `stepUpBps=25`, `tenor=7`:
`stepUpPenalty = 5000×25/10000×(7−2) = 12.5×5 = ₹62.5 Cr`. `greenium = 5000×5/10000×7 = 2.5×7 = ₹17.5
Cr`. `netBenefit = 17.5 − 62.5 + 0 = −₹45.0 Cr` — the tool correctly shows this structuring as
**net negative** for the issuer given current off-track progress, exactly the economic signal an SLB
ratchet is designed to produce.

SBTi check for the same KPI at `year=2030`: `requiredReduction = 1−(1−0.042)^(2030−2024) =
1−0.958^6 = 1−0.7649 = 23.5%`; `actualReduction = (620−310)/620 = 50.0%` → `50.0% ≥ 23.5%` →
**aligned**. This KPI clears the SBTi ambition bar even though current *progress* toward it is
lagging (40.6% weighted) — ambition and delivery are correctly modelled as separate dimensions.

### 7.6 Companion analytics

- **Multi-tranche structure** — independent notional/tenor/coupon/greenium/step-up per tranche,
  aggregated via the same undiscounted formula; `trancheTotal` sums net benefit across tranches.
- **Tornado sensitivity** — ±20% one-at-a-time perturbation of notional, coupon, greenium, step-up,
  tenor against `netBenefit` (excluding coupon from the calculation itself, i.e. testing but not
  using it — coupon is included in the input set but `outputFn` never references `v.coupon`, so its
  tornado bar will show zero range).
- **Peer deal comps** — 8 real disclosed transactions (ENEL, Tesco, H&M, JBS, UltraTech, Vedanta,
  JSW Steel, HDFC Bank) with actual reported greenium/step-up bps, filtered by sector match.

### 7.7 Data provenance & limitations

- SBTi SDA rates, ICMA KPI library baselines/SPTs, and CBI greenium-by-rating tables are the tool's
  own curated reference data (`AdvisoryReference.js`) — realistic and internally consistent, but not
  live-linked to Bloomberg/Refinitiv or SBTi's API; treat as **illustrative benchmarks**, not
  verified real-time market data.
- The Ratchet-NPV gap (§7.3): reported cashflow figures are undiscounted lifetime totals, not
  time-value-adjusted NPVs; a production credit/treasury use case should discount each annual
  ratchet observation at the issuer's cost of debt.
- Tornado's `coupon` input has no effect on the tested `netBenefit` output function — a latent no-op
  in the sensitivity display.
- Default KPI `trend` values (8–10%/yr) are illustrative starting points, editable per KPI but not
  derived from the company's actual historic KPI trajectory.

**Framework alignment:** ICMA Sustainability-Linked Bond Principles 2024 — the 5-component SLBP
scorecard (KPI Selection, SPT Calibration, Bond Characteristics, Reporting, Verification, each 20%
weight) matches ICMA's own structuring guidance components. SBTi Sectoral Decarbonisation Approach —
correctly implemented as compounded-rate required reduction, sector-specific. LMA/APLMA/LSTA
Sustainability-Linked Loan Principles — reflected in the two-way ratchet and grace-period design, not
in a named calculation. Climate Bonds Initiative greenium data — used directly as the default
greenium input by sector/rating.
