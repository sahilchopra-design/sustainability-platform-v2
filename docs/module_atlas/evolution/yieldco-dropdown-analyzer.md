## 9 · Future Evolution

### 9.1 Evolution A — Live company data behind the workbench and asset-specific deal terms (analytics ladder: rung 2 → 3)

**What.** The workbench math is already sound and honest — twelve chained `useMemo`
blocks implementing CAFD/share accretion, a three-stage DDM with bisection-solved
implied kₑ, NAV-SOTP with differentiated rates, a dividend-cut stress ladder, the real
§172 80% NOL limitation, and an explicit "editable defaults — NOT live data" banner;
§7.8 even finds the implementation *undersells* its atlas spec. Its ceiling is
calibration: §8.5 states validation is limited to hand-checks because every
`DEFAULT_*` is illustrative, and §7.8 flags the 5-year model's static simplification
(every committed dropdown financed at the headline deal's mix and issue price).
Evolution A: (1) a profile loader pulling a real YieldCo's shares/CAFD/net-debt/fleet
from the platform's reference-data and financial-data layers (`api/financial_data`
route family already exists), with `SPREAD_HISTORY` replaced by sourced sector yield
spreads carrying vintages; (2) per-dropdown financing terms in the schedule (own
mix/discount/coupon per row); (3) the worked §7.3 default case pinned in
`bench_quant` (accretion +2.0705%, NAV/share +2.89%) so refactors can't silently
break the identity chain.

**How.** Keep the client-side compute model (§8.2's design rationale is right for an
interactive workbench); the backend contribution is data provisioning
(`GET /api/v1/yieldco/profile/{ticker}`), not calculation relocation. Saved scenarios
persist to a `yieldco_scenarios` table.

**Prerequisites.** Source for real YieldCo fundamentals decided (platform financial-
data route vs manual curation with vintages); the static-financing simplification
retired deliberately, with the old behaviour as a "uniform terms" toggle.
**Acceptance:** loading a real profile populates all DEFAULT_* fields with sourced,
vintage-labelled values; two schedule rows with different coupons produce different
interest drags; the bench pin reproduces §7.3 to 4 decimal places.

### 9.2 Evolution B — Dropdown deal-committee copilot (LLM tier 2)

**What.** The page computes seven panels of interlocking metrics that a deal
committee has to synthesise — exactly the narration gap an LLM fills well. The
copilot answers "should we take this dropdown?" the way §7.3's worked example does:
CAFD/share +2.07% but leverage rises 5.00x → 5.42x; NAV-accretive because the $480M
purchase sits $27.1M below capitalised value; intensity-accretive if it's the gas
asset. It reads the current panel state (or calls a `POST /compute` port of the
useMemo chain for counterfactuals — "re-run at 60% equity funding"), and drafts the
deal memo with the triangulated valuation dispersion (DDM vs yield-spread vs
NAV-SOTP) presented as the signal §8.2 says it is, never collapsed into one false
fair value.

**How.** Tier-2 stack: one compute tool mirroring the page inputs; grounding corpus
is this Atlas page — §7.3/§7.4's worked examples are ideal few-shot material, and
§8.6's limitations (perpetuity NAV vs SOTP not reconcilable by design, hand-authored
sustainability kₑ slope) go into the prompt so the copilot flags them whenever those
panels drive a conclusion.

**Prerequisites.** Evolution A's compute endpoint for counterfactuals (tier-1
explanation of on-page state needs nothing); the illustrative-data banner echoed in
every memo until real profiles load. **Acceptance:** every figure in a memo matches
panel state or a compute-tool response; the memo always reports both accretion
metrics and the leverage move, not just the favourable one; asked to bless a deal on
the sustainability kₑ premium, the copilot cites §8.6 and declines to treat a
screening lens as a pricing input.
