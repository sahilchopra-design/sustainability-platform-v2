## 9 · Future Evolution

### 9.1 Evolution A — CEA baseline auto-refresh and CCTS rulebook alignment (analytics ladder: rung 2 → 3)

**What.** §7 establishes this is a genuinely functional India CCTS valuation tool —
real CEA CO₂ Baseline Database v20.0 emission factors, a combined-margin ERU
calculation with per-method conservatism, method-weighted buffer pools, NPV, and a
Monte Carlo — despite the guide describing a different (registry-integrity-scoring)
module. Evolution A hardens it to calibrated status: the CEA factors become a versioned
reference table with vintage tracking (CEA publishes annually; v20.0 will silently
stale), the CCC price tiers (₹500/1,200/2,500) get replaced by an updatable price
reference as ICEX/IEX carbon trading data emerges under the live CCTS compliance
market, and the 7-dimension integrity index's weights get documented against the
actual CCTS (Compliance Mechanism) Rules 2023 obligations.

**How.** (1) `ref_cea_grid_ef(version, region, om, bm, cm)` refdata table + a staleness
banner when the loaded vintage is >18 months old. (2) Monte Carlo output validated:
percentiles pinned in a bench case so the platform's PRNG standardization applies.
(3) Guide rewritten to describe the module that exists — §7's mismatch is framing-level
and must clear.

**Prerequisites.** CEA database redistribution terms checked; guide↔code
reconciliation is part of the deliverable, not optional. **Acceptance:** swapping CEA
v19→v20 factors changes ERUs with both vintages displayed; the bench Monte Carlo
percentile pin passes across runs.

### 9.2 Evolution B — CCTS registration analyst (LLM tier 2)

**What.** A tool-calling assistant for Indian project developers: "value my 40MW solar
asset under the mid CCC tier with 10% discount rate", "which BEE method gives the best
conservatism factor for rooftop?", "what does the additionality test require?" — the
first two executed by re-invoking the page's real ERU/NPV/Monte-Carlo functions
(client-side; the module is frontend-computed with no API routes), the third answered
from the CCTS rulebook citations in the corpus.

**How.** Tool schemas over the valuation functions with typed parameters
(method, mwh, CCC tier, discount); the no-fabrication validator matches every ₹ and
tCO₂e figure to an invocation; registration-readiness questions narrate the
7-dimension integrity index's actual computed sub-scores. The system prompt states
plainly that CCC prices are scenario tiers, not market quotes.

**Prerequisites.** Evolution A's guide fix, so RAG retrieval doesn't serve the wrong
module description (the current guide text would mislead the copilot about what this
page does). **Acceptance:** a valuation answer reproduces the on-page NPV to the rupee
for identical inputs; asked for today's CCC market price, the copilot states tiers are
assumptions.
