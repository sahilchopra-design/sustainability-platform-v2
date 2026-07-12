## 9 · Future Evolution

### 9.1 Evolution A — Compute ODI incentives and fix the leakage-gap overstatement (analytics ladder: rung 2 → 3)

**What.** The module is genuinely well-curated (12 real utilities with published-
figure-consistent RAB/WACC/gearing — Thames Water's 82% gearing and Baa2 are right),
and the RAB × WACC allowed-return calculator is correctly implemented with live
sliders. §7.4/§7.5 document three specific defects to close: `leakageSaving`
multiplies *current* leakage (287 Ml/d) by the shadow price instead of the reduction
gap (287−231=56 Ml/d), overstating savings ~5×; the guide's
`ODI_Incentive = (Performance_Actual − PC_Target) × P_A_Rate` is never computed —
`OUTCOMES` has no `PC_Target` field at all; and `totex_eff` is a static field that can
silently diverge from the `TOTEX_TREND` series describing the same concept. Evolution
A fixes the leakage formula (× gap, × 365 for annualisation per the §5 formula), adds
`pc_target` to `OUTCOMES` so the ODI £-incentive is computed from `pct` and `pa_rate`
with the signed penalty-only handling preserved, and derives `totex_eff` from the
trend series. Rung-3 step: pin the Thames worked example (allowed return £0.502Bn) in
`bench_quant` and re-source utility figures annually against Ofwat PR24 publications
with `as_of` vintages.

**How.** Frontend formula fixes plus a small `GET /api/v1/water-utility/benchmarks`
route (module is Tier B, EP-EL2) serving the curated utility table with provenance,
so the sibling modules and copilot can share it.

**Prerequisites.** The leakage overstatement acknowledged as a bug; PC targets
sourced from PR24 final determinations. **Acceptance:** Thames leakage saving computes
from the 56 Ml/d gap; each ODI row shows a £ incentive derived from its own fields;
`totex_eff` equals the trend-series ratio for the latest year.

### 9.2 Evolution B — Regulated-utility analyst copilot for PR24/PR29 work (LLM tier 2)

**What.** The stated users — water utility equity analysts and infrastructure debt
investors — ask exactly the questions this module's data answers: "what happens to
Thames's allowed return if the CMA resets WACC to 2.96% like Anglian 2021?", "which
utilities have DSCR headroom below 1.5× at current gearing?", "rank the 12 by ODI
incentive income at PR24 targets". Evolution B is a tool-calling analyst over
Evolution A's `GET /benchmarks` plus a `POST /what-if` endpoint exposing the
adjWACC/allowedReturn/leakageSaving calculators server-side — running counterfactuals
as tool calls and drafting the regulatory-scenario note with each £ figure traced,
including the special-administration framing the §5 guide already carries for
high-gearing cases.

**How.** Tier-2 stack: tool schemas from the new OpenAPI operations; grounding corpus
is this Atlas page (§7.2's utility table plus the Ofwat framework vocabulary — AMP
periods, C-MeX, ODI, totex). The prompt carries the provenance nuance: figures are
curated from published Ofwat/rating data at a stated vintage, not a live feed.

**Prerequisites (hard).** Evolution A — the copilot must not narrate the current
leakage overstatement or assert ODI incomes that were never computed; pgvector corpus.
**Acceptance:** every £ and % in a note traces to a tool call; a WACC counterfactual
cites both the base and adjusted runs; asked for this week's Thames bond spread, the
analyst states the data vintage and refuses to improvise market data.
