## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula is `DisruptionScore = TRL × PatentGrowth ×
> VCFunding × (1/YearsToCrossover)`. **No such composite score is computed anywhere in this
> 214-line file.** Each of the 15 tracked disruptions carries a hand-typed `signal` label
> (Very Strong/Strong/Medium/Weak) assigned directly as a literal — not derived from TRL, patent
> trend %, VC funding, or years-to-crossover via any formula. All underlying data (TRL, patent trend
> %, VC funding $B, years to crossover, adoption %, tipping-point year) are likewise static literals,
> not `sr()`-seeded and not computed from each other.

### 7.1 What the module computes

15 real, named technology disruptions (`DISRUPTIONS`: Solid-State Batteries, Perovskite Solar, Green
Steel H₂-DRI, E-Fuels/SAF, Fusion Energy, Autonomous EVs, AI Grid Management, Carbon Mineralization,
Cultured Meat, Vertical Farming, Small Modular Reactors, Direct Lithium Extraction, Long-Duration
Storage, Next-Gen Geothermal, Quantum Computing Materials) each with a hand-assigned TRL (3–7),
patent-trend % (+22% to +95%), VC funding ($1.9B–$12.5B), years-to-crossover (2–15), current adoption
% (0–15%), a tipping-point year (2027–2045), and a categorical `signal`. A 6-year synthetic patent
and VC-funding history (`patentHistory`, `vcHistory`, both linear-growth constructed series, not
`sr()`-seeded) and an 8-company portfolio-exposure table (`PORTFOLIO_COMPANIES`) round out the
dataset.

### 7.2 The only live calculations

```js
totalVC        = Σ DISRUPTIONS.vcFunding
strongSignals  = count(signal === 'Strong' || signal === 'Very Strong')
nearCrossover  = count(yearsToCrossover <= 4)
```

Three simple filter/sum aggregates over the static list — correct arithmetic, no derived scoring.
The Disruption Signal Dashboard table supports **sorting** (by crossover-nearness, VC funding, or
TRL) and **filtering** (by signal category) but no field is ever recombined into a new composite
score — sorting only reorders the existing static columns.

### 7.3 Calculation walkthrough

1. **Disruption Signal Dashboard** — sortable/filterable table of all 15 disruptions with a visual
   TRL bar (`width: trl×11%`, a simple linear scale to fill a fixed-width bar for TRL 1–9) and a
   colour-coded `signal` badge.
2. **Patent Trend Analysis** — `patentHistory` is a hand-constructed linear-growth series
   (`1200+i×520` etc. for solid-state batteries) across 5 selected technologies, 2020–2025 — not
   sourced from WIPO/Espacenet despite the page's own footer citing those sources.
3. **VC/PE Investment Tracker** — `vcHistory` similarly a linear-growth stacked-area series across 5
   technologies, not sourced from PitchBook/Crunchbase despite the footer citation.
4. **Cost Crossover Countdown** — a horizontal bar chart of `yearsToCrossover` per disruption,
   colour-banded (≤3yr green, ≤5yr amber, ≤8yr orange, >8yr red) with a reference line at 4 years
   marking "near-term" — a correct, if simple, threshold-banded visualisation of static data.
5. **Adoption Tipping Points** — combo chart of `tippingPoint` year (bar) and `adoptionPct` (line)
   for the 10 nearest-tipping-point technologies; the caption defines "tipping point = 16% market
   penetration (S-curve inflection)" but no S-curve function is actually fit to `adoptionPct` data in
   this file to derive that 16% figure — it is asserted, not computed.
6. **Portfolio Exposure** — 8 real companies (Toyota, ArcelorMittal, Shell, Heidelberg Materials,
   Duke Energy, JBS, Albemarle, Rolls-Royce) mapped to which disruptions threaten their sector, with
   a hand-assigned `riskLevel` (Critical/High/Medium) — a plausible, illustrative mapping, not
   computed from the disruption's own TRL/crossover/funding data.

### 7.4 Worked example

Comparing two disruptions on the guide's intended composite: **AI Grid Management** (TRL=7,
patentTrend=+88%, VC=$2.8B, yearsToCrossover=2) vs. **Quantum Computing Materials** (TRL=3,
patentTrend=+95%, VC=$9.4B, yearsToCrossover=12). Applying the guide's literal formula
`TRL×PatentGrowth×VCFunding×(1/YearsToCrossover)`: AI Grid = `7×0.88×2.8×(1/2) = 8.62`; Quantum =
`3×0.95×9.4×(1/12) = 2.23` — AI Grid would score ~3.9× higher, consistent with its hand-assigned
'Very Strong' signal vs Quantum's 'Weak' signal. This directional agreement suggests the hand-typed
`signal` labels were plausibly assessed with something like this formula in mind by whoever authored
the data, even though the formula itself was never implemented in code to *derive* the labels
systematically — meaning any future update to TRL/VC/patent figures would not automatically
update the signal label, since there's no code path connecting them.

### 7.5 Data provenance & limitations

- **All 15 disruptions' metrics are hand-typed literals**, not `sr()`-seeded and not sourced live
  from DOE/ARPA-E, WIPO/Espacenet, or PitchBook despite the page footer's citation of those sources —
  treat as illustrative research judgment, not live data feeds.
- No `DisruptionScore` composite exists; `signal` labels are asserted, not computed — see the worked
  example above for evidence the labels are at least directionally consistent with what the guide's
  formula would produce.
- Patent and VC history series are synthetic linear-growth constructions for chart-plausibility, not
  real historical filings/funding data.
- The "16% tipping point = S-curve inflection" claim in the Adoption Tipping Points caption is
  asserted text, not derived from a fitted S-curve (contrast with the sibling
  `tech-displacement-modeler` module, which does implement a genuine logistic S-curve).

**Framework alignment:** TRL (Technology Readiness Level, 1–9 DOE/EU Horizon scale) is used correctly
as a maturity metric. The Bass diffusion / S-curve framing referenced in the footer is conceptually
sound for technology adoption but not actually computed here — see `tech-displacement-modeler` for
the platform's genuine S-curve implementation, which this watchlist could in principle be linked to
for a data-consistent tipping-point calculation.
