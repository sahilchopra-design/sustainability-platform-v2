## 9 · Future Evolution

### 9.1 Evolution A — Project-MRV permanence, market-leakage split, and full-market LCOR (analytics ladder: rung 1 → 3)

**What.** A clean tier-A CDR engine: six assessments (BeZero-style quality, LCOR, Oxford Principles,
Article 6.4 eligibility, VCMI claims, portfolio roll-up) over the 8-method IPCC AR6 CDR taxonomy —
pure stateless, no PRNG, honest nulls where market inputs are missing (IRR only with a carbon price,
ITMO premium only with a corresponding adjustment). §7.5 names the deepening targets: permanence is
taken **per method category, not per-project MRV evidence**; leakage is a single scalar with no
activity-shifting-vs-market split; LCOR ignores tax, degradation, ramp-up and financing structure;
Article 6.4 "additionality" is hard-assumed True; and country risk covers only 13 hard-coded ISO
codes. Evolution A adds per-project permanence from MRV data, an activity-shifting/market leakage
split, and a fuller LCOR with financing and degradation.

**How.** `assess_cdr_quality` accepts project-specific permanence/reversal-risk evidence overriding
the method-category default; `calculate_lcor` adds tax, ramp-up and a financing structure beyond the
single annuity; the Article 6.4 additionality becomes an assessed input, not True. Rung 3: calibrate
the BeZero-style 5-factor weights and buffer-pool percentages against published BeZero ratings and
each registry's actual buffer mechanics (the buffer table is already standard-sourced), and expand
country risk beyond the 13 ISO codes.

**Prerequisites (hard).** Fix the lineage-harness failures — §4.2 shows `POST /article-6-4`, `/lcor`,
`/oxford-principles`, `/portfolio` all **skipped**; preserve the honest-null discipline (IRR/ITMO
stay null without their required inputs). **Acceptance:** the §7.4 worked examples (biochar quality
79.88 → AA; DACCS LCOR ≈$567/tCO₂) reproduce; supplying project MRV permanence overrides the
method-category default; a country outside the 13 hard-coded codes gets a real risk score; the failing
POST endpoints pass the harness.

### 9.2 Evolution B — CDR procurement analyst with tool-called quality and cost (LLM tier 2)

**What.** A tool-calling analyst for CDR buyers and project developers: "assess the quality of this
biochar project" (`/quality-assessment` → BeZero-style rating, buffer, net credits), "what's the
LCOR for this DACCS plant?" (`/lcor` with CAPEX/discount-rate sensitivities), "does it align with the
Oxford Principles?" (`/oxford-principles`), "is it Article 6.4-eligible?" (`/article-6-4`), and
"roll up my CDR portfolio" (`/portfolio` → durable share, method diversity) — narrating the engine's
real deterministic outputs across the CDR quality-and-cost stack.

**How.** Tool schemas from the POST assessments + the reference endpoints; the `ref/*` tables
(CDR methods taxonomy, verification standards, Oxford Principles, VCMI levels) are ideal RAG grounding
for "what's DACCS permanence and cost range?" questions. The no-fabrication validator checks every
score, $/tCO₂ and buffer figure against tool output; the copilot respects honest nulls (it cannot
quote an IRR without a carbon price, or an ITMO premium without a corresponding adjustment).
Composable into a carbon-desk orchestrator alongside `carbon_markets_intel`.

**Prerequisites.** Evolution A's harness fixes (working endpoints for tool-calling); Atlas +
reference corpus embedded (roadmap D3). **Acceptance:** every figure cited traces to an engine tool
call; the quality rating and net credits match `/quality-assessment`; an LCOR answer carries the
±20% CAPEX / ±2pp discount-rate sensitivity bands the engine produces; an IRR question without a
carbon price returns the engine's honest null.
