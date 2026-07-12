## 9 · Future Evolution

### 9.1 Evolution A — Asset-level liability register with discounting and cost escalation (analytics ladder: rung 1 → 2)

**What.** EP-CK4 is one of the thinnest pages in this slice: a tier-B display over
curated unit-cost ranges (coal $50–150/kW, nuclear $500–1000/kW, platforms
$10–50M, pipelines $1–5M/km) computing the two-line arithmetic
`Liability = Units × CostPerUnit; Gap = Liability − Provision`, plus a
jurisdiction table of regulatory bond mandates. No endpoints, no engine, zero
blast radius. The honest evolution is scoped small: make the arithmetic
asset-specific and time-aware rather than pretending toward a decommissioning
science the page doesn't attempt.

**How.** (1) Asset register: user-entered assets (type, capacity/length, retirement
year, current provision) persisted to a small vertical — the module's first real
data. (2) Time value: decommissioning liabilities are long-dated — present-value
the estimated cost from the retirement year at a user discount rate, with a
documented cost-escalation assumption (decommissioning inflation historically
outruns CPI; cite the range, let the user set it). This turns the gap analysis
into the ARO (asset-retirement-obligation) accounting shape practitioners
actually use. (3) Unit-cost provenance: attach citations to the curated ranges
(NEA for nuclear, BSEE/industry studies for platforms) and expose low/mid/high
cost cases rather than a point. (4) Funding trajectory: given a sinking-fund
contribution rate, does the provision reach the PV liability by retirement —
a closed-form check per asset, feeding the bond-requirement comparison per
jurisdiction.

**Prerequisites.** Cost-range citation pass; the small persistence schema. This
page's atlas record is thin — scope discipline matters more than ambition here.
**Acceptance:** a hand-computed PV case reproduces (units × unit cost, escalated
to retirement, discounted back); the gap flips sign when the discount rate
crosses the implied break-even; each cost range shows its source.

### 9.2 Evolution B — Jurisdiction-requirements explainer (LLM tier 1)

**What.** The module's most decision-relevant content is the jurisdiction table of
bond/financial-assurance mandates — regulatory text territory where users need
interpretation: "what financial assurance does my UK North Sea platform require,
and does my current provision structure qualify?" Evolution B answers from the
curated jurisdiction rows plus this Atlas record, comparing the (post-Evolution A)
computed PV liability and funding trajectory against the stated mandate — always
labelling the jurisdiction summaries as curated overviews requiring legal
confirmation, since decommissioning security regimes are negotiated
case-by-case.

**How.** Tier-1 RAG over the jurisdiction table and the module's computed asset
state; no endpoints exist, so tool-calling waits on the Evolution A vertical. The
disclaimer discipline is the design: this copilot summarizes and compares, it does
not render legal opinions — a stated scope boundary in the system prompt, mirrored
in every answer touching a mandate.

**Prerequisites.** Evolution A's register and PV computation (comparisons need a
computed liability); jurisdiction-table citation pass. **Acceptance:** answers
quote the jurisdiction row verbatim before interpreting; funding-adequacy claims
match the computed trajectory; every mandate answer carries the
legal-confirmation caveat.
