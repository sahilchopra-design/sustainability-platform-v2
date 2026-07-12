# Tech Disruption Watchlist
**Module ID:** `tech-disruption-watchlist` · **Route:** `/tech-disruption-watchlist` · **Tier:** B (frontend-computed) · **EP code:** EP-CL6 · **Sprint:** CL

## 1 · Overview
15 technology disruptions tracked with TRL, patent trends, VC funding, cost crossover countdown, and portfolio exposure.

**How an analyst works this module:**
- Disruption Signal Dashboard shows 15 technologies with status
- Cost Crossover Countdown shows years to parity
- Portfolio Exposure maps at-risk holdings

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `DISRUPTIONS`, `KPI`, `PORTFOLIO_COMPANIES`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DISRUPTIONS` | 16 | `name`, `trl`, `patentTrend`, `vcFunding`, `yearsToCrossover`, `adoptionPct`, `tippingPoint`, `exposedSectors`, `signal`, `color` |
| `PORTFOLIO_COMPANIES` | 9 | `sector`, `exposure`, `riskLevel`, `mktCap` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Disruption Signal Dashboard','Patent Trend Analysis','VC/PE Investment Tracker','Cost Crossover Countdown','Adoption Tipping Points','Portfolio Exposure'];` |
| `totalVC` | `DISRUPTIONS.reduce((s,d)=>s+d.vcFunding,0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DISRUPTIONS`, `PORTFOLIO_COMPANIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Disruptions Tracked | — | Research | Across energy, transport, industry, food |
| Nearest Crossover | `Solid-state batteries` | BNEF | Cost parity with current Li-ion by 2028 |

## 5 · Intermediate Transformation Logic
**Methodology:** Technology readiness tracking
**Headline formula:** `DisruptionScore = TRL × PatentGrowth × VCFunding × (1/YearsToCrossover)`

15 disruptions: solid-state batteries, perovskite solar, green steel, e-fuels, fusion, autonomous EVs, AI grid management, carbon mineralization, cultured meat, vertical farming, etc. Portfolio exposure maps which holdings are at risk.

**Standards:** ['EPO/USPTO', 'PitchBook']
**Reference documents:** EPO PATSTAT; PitchBook VC Data; BNEF Tech Reports

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Compute the DisruptionScore and feed it real patent/VC signals (analytics ladder: rung 1 → 3)

**What.** The §7 flag: the guide's `DisruptionScore = TRL × PatentGrowth × VCFunding × (1/YearsToCrossover)` is never computed — the 15 disruptions' `signal` labels are hand-typed literals, and §7.4's worked example shows the labels are directionally consistent with the formula but nothing connects them in code, so updating TRL/VC/patent figures would silently strand the labels. Patent and VC "history" series are linear-growth constructions despite footer citations to WIPO/Espacenet and PitchBook (§7.5). Evolution A implements the composite and grounds its inputs.

**How.** (1) Implement the formula (normalised per factor to avoid unit-driven dominance — raw $B × TRL multiplication overweights funding) and derive `signal` bands from score quantiles; the §7.4 comparison (AI Grid 8.62 vs Quantum 2.23) becomes the bench case. (2) Replace the constructed patent series with real filing counts: EPO's Open Patent Services API (free, keyed) queried by CPC class per technology (e.g. H01M-10 for solid-state batteries), refreshed by an ingester per the platform's 19-ingester scaffold; `PatentGrowth` then computes as an actual YoY rate. (3) VC funding stays a curated annual table (PitchBook has no free tier — an honest citation with `as_of` vintage, per the data-sources-wave-1 lesson that assumed feeds often aren't available). (4) Wire the tipping-point caption's asserted "16% S-curve inflection" to the sibling `tech-displacement-modeler`'s genuine logistic function, as §7's framework note itself suggests.

**Prerequisites.** CPC-class mapping table per technology, hand-authored once; OPS API key. **Acceptance:** editing any input field changes the derived signal; patent trend for one pilot technology matches an independent OPS query; every non-live field displays its vintage.

### 9.2 Evolution B — Watchlist triage copilot with portfolio-exposure reasoning (LLM tier 1)

**What.** The watchlist's user does periodic review: "what changed, what threatens my holdings?" A tier-1 copilot answers "which near-crossover disruptions hit ArcelorMittal, and how strong is the evidence?" by composing the `DISRUPTIONS` table, the 8-company `PORTFOLIO_COMPANIES` sector-exposure mapping, and the countdown thresholds (≤4yr near-term band) — the joins a human does by eye across the 6 tabs.

**How.** No backend exists (tier B, EP-CL6 frontend-only), so grounding is this Atlas record plus page state per the roadmap tier-1 pattern. The copilot's discipline matters more than its reach: per §7.5, TRL/funding/crossover values are illustrative research judgment and the exposure `riskLevel` is hand-assigned — every answer must attribute them as analyst estimates, never as live EPO/PitchBook data (the current footer citations overstate provenance, and the copilot must not amplify that). Post-Evolution-A, answers upgrade automatically: computed DisruptionScores with factor decomposition ("Very Strong because crossover ≤2yr and patent growth +88%") and real patent trends become citable. Watchlist-diff summaries ("what moved since last quarter") arrive once inputs are versioned.

**Prerequisites.** None for the disclaimered tier-1 slice; Evolution A for evidence-graded answers. **Acceptance:** exposure claims trace to explicit `exposedSectors`↔company-sector joins; provenance questions get the illustrative-data answer; no invented funding rounds or patent counts appear for any named technology.