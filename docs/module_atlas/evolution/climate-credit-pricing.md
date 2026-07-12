## 9 · Future Evolution

### 9.1 Evolution A — Rename honestly, then benchmark the spread model (analytics ladder: rung 2 → 3)

**What.** §7 documents a wholesale identity mismatch: the guide describes carbon-
commodity pricing (ETS fair value via MAC-curve intersection, VCM vintage benchmarks,
ICP tracking) while the code implements climate-adjusted **loan spread pricing** — a
real bps-additive build-up (`totalSpr = baseSpr + physPrem + transPrem + carbonPrem`
with scenario multipliers, an interest calculation, RWA multiplier, and portfolio
climate VaR). Evolution A: step zero is the guide rewrite (the ETS/VCM methodology
belongs to the carbon-market modules); the deepening is calibration — the premium
coefficients (25bps physical cap, 35bps transition cap, the 0.08 carbon-price slope,
the five scenario multipliers) are asserted constants, and the honest next rung is
benchmarking them against observable spread evidence: published studies of
climate-risk pricing in loan/bond spreads and the platform's own sector-spread data
where available.

**How.** (1) Guide rewrite + atlas regeneration. (2) Coefficient table
`ref_climate_spread_calibration(channel, sector, coefficient, source)` — where
empirical anchors exist (e.g. brown-vs-green bond spread differentials by sector),
cite them; where they don't, label the coefficient as expert-set and show sensitivity
bands instead of point precision. (3) The 9-sector `BORROWER_SECTORS` seed retained
as fixtures with the physRisk/transRisk scores documented as illustrative.

**Prerequisites (hard).** Identity fix first — a copilot or user reading the current
guide expects carbon prices and gets loan spreads. **Acceptance:** the guide matches
the code; each premium coefficient carries a source or an explicit "expert-set" label
with a sensitivity range; a fixture borrower's spread decomposes to the bps exactly.

### 9.2 Evolution B — Loan-pricing copilot (LLM tier 1 → 2)

**What.** A copilot for relationship bankers: "why is this steel borrower paying
62bps of climate premium?" (decomposition into physical/transition/carbon terms with
the scenario multiplier named), "what happens to the spread under Delayed Transition
at $120 carbon?" (re-run `calcClimateSpread` client-side — no backend routes exist),
"how does the climate add-on flow into annual interest and RWA?" — all mechanics the
code genuinely implements.

**How.** Tier 1: corrected atlas record as corpus, live borrower table and scenario
selection as context. Tier 2: tool schema over `calcClimateSpread` and the portfolio
VaR function; validator ties every bps and dollar figure to invocations; calibration
caveats from Evolution A surface in prose ("transition premium uses an expert-set
coefficient") rather than being laundered into false precision.

**Prerequisites (hard).** Guide rewrite before corpus embedding; Evolution A's
calibration labels so the copilot can represent uncertainty honestly. **Acceptance:**
a spread decomposition sums to the displayed total; the copilot states coefficient
provenance when asked "how reliable is this premium?"; carbon-market questions are
redirected to the ETS/VCM modules.
