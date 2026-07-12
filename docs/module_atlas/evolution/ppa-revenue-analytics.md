## 9 · Future Evolution

### 9.1 Evolution A — ATB-calibrated fair-value strike solver with sized debt (analytics ladder: rung 2 → 3)

**What.** The 18-tab configurator already earns rung 2: deterministic revenue build, escalated NPV, IFRS 9 ECL, and a methodologically sound 500-path Box-Muller merchant Monte Carlo. Its weak core is the "is this price fair?" answer: §7.4 documents that `reqRevenue` mixes $/kW-scale capex with $-scale opex (units inconsistency), `lcoeEst` is a flat constant per technology ($28/$30/$35), and leverage is a fixed 70% heuristic. Evolution A implements the §8 spec: NREL-ATB-calibrated LCOE, DSCR-constrained debt sizing, and an iteratively solved fair-value strike (bisection on levered equity IRR = targetIRR).

**How.** (1) Port the revenue build and MC to a backend engine (`api/v1/routes/ppa_revenue.py`, `POST /fair-value`, `POST /revenue-at-risk`) so numbers are pinnable. (2) Seed `ref_atb_technology_costs` from the public NREL ATB CSV (capex/opex/CF by technology-year) replacing the three hard-coded constants. (3) Reconcile the two coexisting VaR figures §7.3 flags (parametric `varMerchant` vs Tab-6 empirical MC VaR₉₅) into one documented measure with the other labelled as a cross-check. (4) Validate strikes against the LevelTen PPA Price Index per §8.5.

**Prerequisites.** Fix the `reqRevenue` unit bug first — it invalidates today's fair-value flag; ATB ingest job added to the ingestion framework. **Acceptance:** bench_quant reproduces the §7.4 base case ($10.11M totalRev) and the solved strike moves monotonically with targetIRR and DSCR_min; the fair-value output carries an ATB vintage stamp.

### 9.2 Evolution B — Deal-structuring analyst across the 18 tabs (LLM tier 2)

**What.** A tool-calling analyst that operates the deal configurator conversationally: "structure this 200MW ERCOT solar deal at 80% contracted — what strike clears an 11% IRR, and what's the ECL if the buyer is BBB with only a parent guarantee?" Each clause maps to a real engine call (`/fair-value`, `/revenue-at-risk`, the ECL calculation `PD_BY_RATING × LGD × ppaNpv`); the LLM narrates outputs and drafts the Tab-14 term-sheet text from computed values instead of the current static checklist.

**How.** Tool schemas generated from the Evolution-A OpenAPI spec; system prompt grounded in this Atlas page (§5 methodology, §7.1–7.3 formulas, §7.6 limitations — including that `CORPORATE_BUYERS`/`PPA_PRICE_HISTORY` are illustrative comps, so the copilot must caveat market-comparison claims). The no-fabrication validator checks every $/MWh and IRR in the answer against tool outputs. The Proceed/Negotiate/Pass recommendation (Tab 18) stays rule-based; the LLM explains it, never overrides it.

**Prerequisites.** Evolution A's backend (tier 2 needs endpoints; today all math is in-page); golden Q&A written from the §7.4 worked example. **Acceptance:** every numeric in a generated term sheet traces to a tool call; asked for a market price the module doesn't source live (e.g. current CAISO forwards), the analyst cites the illustrative-data caveat rather than inventing one.
