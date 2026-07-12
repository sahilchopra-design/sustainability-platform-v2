## 9 · Future Evolution

### 9.1 Evolution A — Evidence-backed screening and honest taxonomy-objective splits (analytics ladder: rung 2 → 3)

**What.** Two engines: `exclusion_list_engine` screens holdings against 7 standard
negative-screening categories plus custom rules (hard breach at zero-threshold, soft otherwise,
`breached_weight_pct` de-duplicated), and `sfdr_report_generator` computes the quantitative core of
an Art 8/9 periodic report (look-through taxonomy/sustainable splits, WACI, top-15, PAI YoY). One
§5 line deserves scrutiny: the taxonomy-objective breakdown is fabricated proportionally —
`objective_1 = tax_pct × 0.6, objective_2 × 0.3, other × 0.1` — a fixed split presented as an
objective allocation. Screening inputs (revenue shares per category) are also caller-asserted. Both
POST endpoints trace **failed/skipped**. Evolution A fixes these.

**How.** (1) Replace the fixed 60/30/10 objective split with the actual per-objective alignment from
`eu_taxonomy_activities` (the evidence table `gar` and `pcaf_regulatory` use), or return honest
nulls when activity-level data is absent — a fixed split is exactly the fabrication pattern the
platform has been purging. (2) Back exclusion screening with evidence: coal revenue from
`sat_coal_checker`/GEM data, controversies from `gdelt_controversy`, so breaches cite a source
rather than only self-declared shares. (3) Repair `POST /screen` (failed) and `/periodic-report`
(skipped). (4) Bench-pin WACI, the look-through splits, and breach weighting.

**Prerequisites.** `eu_taxonomy_activities` linkage; evidence-source integrations; the two POST
endpoints repaired. **Acceptance:** objective splits derive from activity data or return null (never
the 60/30/10 constant); breaches carry an evidence source where available; both POSTs return
`passed`; report quantities bench-pinned.

### 9.2 Evolution B — Exclusion-screening and periodic-report copilot (LLM tier 2)

**What.** A copilot that screens a fund — "which holdings breach our Article 9 exclusions and how
much weight is affected?" (calling `/screen` and citing per-holding breaches and the de-duplicated
`breached_weight_pct`) — then assembles the periodic report via `/periodic-report`, narrating WACI,
sustainable-investment proportions, and PAI year-on-year moves.

**How.** Two POST engines plus two reference GETs (`/exclusion-rules` scoped by SFDR classification,
`/pai-reference` with report sections) that ground every rule and threshold. The hard/soft severity
distinction drives the copilot's escalation language; what-ifs ("drop the two hard-breach names")
re-run the screen statelessly and quote the new breached weight. Pairs with `sfdr_annex` (which
templates the same report) and `fund_management`. Node for a fund-compliance desk.

**Prerequisites.** Evolution A's endpoint repair is mandatory; the objective-split fix before the
copilot narrates taxonomy objectives (it would otherwise present the 60/30/10 constant as fund
data). **Acceptance:** every breach, weight, and report figure traces to a tool response; the
copilot names the rule and threshold behind each breach from `/exclusion-rules`; it flags
self-declared vs evidence-backed inputs and refuses to confirm Art 8/9 compliance beyond the
computed screen.
