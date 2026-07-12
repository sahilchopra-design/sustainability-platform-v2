## 9 · Future Evolution

### 9.1 Evolution A — True LP under joint constraints, calibrated price paths (analytics ladder: rung 2 → 3)

**What.** EP-CN3 is one of the healthier tier-B modules: a real greedy optimizer over
a curated, methodology-coherent 20-credit universe (durable removals expensive and
high-quality, CDM avoidance cheap and low-quality — the actual VCM gradient) plus a
genuine SBTi mitigation-hierarchy calc. §7.6 names its two ceilings: greedy ranking
by quality/$ is *not* optimal when a quality floor and a tonnage target bind
simultaneously (the guide states an LP), and the Monte-Carlo carbon-price paths are
seeded random walks, "illustrative only". Evolution A closes both.

**How.** (1) LP: move the blend into a backend engine solving the guide's own
program — minimize `Σ cost_i·qty_i` subject to tonne-weighted quality ≥ target,
`Σ qty_i` ≥ offset need, per-credit `maxAvailable`, and optional CORSIA/SBTi
eligibility shares — scipy `linprog` handles it directly; keep greedy as a cross-
check and surface the delta when constraints bind jointly. (2) Price calibration:
replace the `sr()` shocks with vintage-differentiated price paths anchored to
published VCM benchmarks (Ecosystem Marketplace category medians, versioned curated
table) and EUA futures for compliance-adjacent credits, so the budget-impact
percentiles mean something. (3) Quality provenance: map `qualityScore` components to
the ICVCM CCP-Approved determinations now published per methodology — where a
category is CCP-labelled, cite it; where not, keep the curated score labelled as
house assessment. (4) Seeded `PROCUREMENT_HISTORY`/vendor scores get purged or
user-entered.

**Prerequisites.** Guardrail purge of the remaining `sr()` uses (MC shocks, history,
vendor scores); the curated price benchmark table with a refresh owner.
**Acceptance:** a constructed case where quality floor + tonnage target bind shows LP
strictly cheaper than greedy; fixed-seed MC replaced by percentile bands reproducible
from the benchmark table; the §7.1 tonne-weighted quality formula unchanged and
regression-tested.

### 9.2 Evolution B — Procurement-desk analyst with claims guardrails (LLM tier 2)

**What.** Offset procurement is where corporate buyers most need both optimization
and claims discipline. Evolution B: a tool-calling analyst that runs the (Evolution A)
LP for stated needs ("cover 120 kt residual with ≥80 quality, CORSIA-eligible ≥30%"),
explains the frontier trade-off ("moving the floor 75→85 costs $2.1M — here's the
substitution"), maps the blend to the SBTi hierarchy outputs (BVCM vs neutralisation
tonnage from the module's own 42/65/25 and 60/15 splits), and — the guardrail — checks
proposed marketing claims against VCMI/SBTi rules, flagging "carbon neutral" claims
the blend cannot support.

**How.** Tool schemas over the new optimize/frontier endpoints; grounding corpus is
§5, §7.2's credit-universe table with provenance labels, and the ICVCM/VCMI/SBTi
claim rules as refdata texts. Every $/t and tonnage figure validates against tool
output; the claims check is rule-application over the blend composition (durability
shares, avoidance vs removal), not vibes.

**Prerequisites.** Evolution A's backend (no endpoints exist today); claims-rule
codification from the public VCMI Claims Code. **Acceptance:** recommended blends
reproduce via the LP endpoint; a test blend of 100% avoidance credits triggers the
neutralisation-claim flag; the analyst refuses price forecasts beyond the calibrated
percentile bands.
