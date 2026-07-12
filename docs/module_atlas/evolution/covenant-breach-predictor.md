## 9 · Future Evolution

### 9.1 Evolution A — Compute P(breach) from the ratios the page already displays (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag: the guide's
`P(breach|scenario) = P(ratio < threshold | climate_shock)` is never computed — each
borrower's four scenario breach probabilities are direct `sr()` draws, *independent
of its own leverage/ICR/DSCR ratios and the fixed thresholds displayed beside them*;
the early-warning trend is a deterministic ramp (`15 + 3·month`) that always climbs;
and the RAG flags are positional (`i<5` = Red). The scenario *ordering* baked into
the seeds (transition scenarios stress fossil borrowers hardest) is sound intuition
with random magnitudes. Evolution A derives the probability from the displayed
mechanics.

**How.** (1) Ratio stress: shock each borrower's EBITDA/interest/debt-service via
the scenario carbon-cost channel — `ΔEBITDA = −emissions × carbon_price(scenario, t)
× (1 − pass_through)` — reusing the NGFS price interpolation already in
`climate_transition_risk_engine` rather than reinventing it. (2) Probability:
distributional treatment of the stressed ratio (lognormal EBITDA volatility
parameterized per sector, documented) → `P(ratio_stressed < threshold)` in closed
form — an honest first version that connects ratios, thresholds, and probabilities
arithmetically. (3) Early warnings become borrower-specific: drift computed from the
stressed trajectory's approach to the threshold, lead time = quarters until
`E[ratio] < threshold`. (4) Borrower book from `portfolios_pg` or entered positions
replaces the 15 seeded names.

**Prerequisites (hard).** PRNG purge of ratios and breach fields; sector EBITDA-
volatility parameters need a cited source (or explicit house-assumption labels);
covenant thresholds become per-loan inputs, not fixed defaults. **Acceptance:** a
borrower whose stressed ratio sits far above threshold shows near-zero P(breach);
tightening a threshold raises it monotonically; the scenario ordering emerges from
the carbon-price paths instead of seed bases.

### 9.2 Evolution B — Lender-action briefing with waiver-package drafting (LLM tier 1 → 2)

**What.** The module's static `REMEDIATION` and `LENDER_ACTIONS` frameworks are
generic lists; what a workout banker needs is the borrower-specific version.
Evolution B drafts it: for a (post-Evolution A) computed at-risk borrower, a brief
covering which covenant breaches first and when, the scenario dependence ("breach
only under Delayed Transition — a 2027 carbon-price story"), the IFRS 9 SICR
implication the module already names, and a ranked action set drawn from the
remediation framework with the triggering computation cited. Optionally drafts the
waiver-request analysis: what threshold reset would clear the stressed trajectory.

**How.** Tier 1 grounds on the computed breach payload plus this Atlas record and
the IFRS 9/Basel references; tier 2 adds tool calls to the Evolution A stress
endpoint so "re-run with 80% pass-through" or "test a 5.0× leverage reset" execute
against the engine — the waiver analysis is exactly a threshold-parameter sweep. The
fabrication validator covers ratios, probabilities, and dates.

**Prerequisites (hard).** Evolution A in full — briefing lenders on seeded breach
probabilities attached to recognizable fossil-sector names would be the platform's
worst-case fabrication scenario; loan-level covenant data entered. **Acceptance:**
every ratio and probability in a brief matches engine output; the waiver analysis's
proposed reset reproduces as clearing the threshold in a follow-up run; borrowers
without entered covenants yield "no covenant data" rather than defaults presented as
facts.
