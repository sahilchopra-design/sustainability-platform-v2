## 9 · Future Evolution

### 9.1 Evolution A — Benchmark against real peer medians and expand SICS coverage (analytics ladder: rung 2 → 3)

**What.** `SASBIndustryEngine` assesses an entity against its SASB industry standard (the
industry-specific requirement IFRS S1 ¶55 points to): `completeness = reported/applicable × 100`,
`materiality coverage = material-topics-reported/material-topics × 100`, IFRS-S1-¶55-compliant at
≥60% completeness AND ≥70% materiality coverage, plus a benchmark percentile
(`clamp((1−value/median)×50+50, 0, 100)`) and peer ranking. The honest limits: only 7 sectors /
20 industries of the full SICS taxonomy are implemented, and `compare_to_peers` scores against
sector *medians* that are static reference values, not a live peer distribution. Evolution A
grounds the benchmarks.

**How.** (1) Replace the static sector medians with real distributions computed from the platform's
`financial_data`/CSRD-extracted peer set, so a percentile reflects an actual cohort with a stated
n and as-of date — the current percentile is only as good as the hardcoded median. (2) Expand SICS
coverage beyond the 20 implemented industries toward the full 77 (the reference registries scaffold
this). (3) Grade DQS from evidence rather than the caller-supplied per-metric DQS defaulting to 5.
(4) Bench-pin completeness, materiality coverage, and the percentile formula.

**Prerequisites.** A peer-disclosure dataset for live medians (via `financial_data`/`peer_benchmark`);
expanded SICS industry definitions. **Acceptance:** benchmark percentiles derive from a real cohort
with n and as-of date, not a static median; SICS coverage materially expanded; DQS evidence-graded;
formulas bench-pinned.

### 9.2 Evolution B — SASB disclosure copilot with cross-framework mapping (LLM tier 2)

**What.** A copilot that runs `/assess-industry` and explains the verdict — "you're not IFRS S1
¶55 compliant: completeness is 58% (below 60%) and you're missing 2 of 5 likely-material topics;
here they are, and here's how they map to your ISSB S2 and ESRS disclosures" — each figure
tool-sourced.

**How.** Three POST endpoints (`/assess-industry`, `/assess-materiality`, `/compare-peers`) plus
eight `/ref/*` registries (SICS sectors, industry codes, materiality map, and ISSB-S2/GRI/ESRS
mappings) — a rich, self-contained grounding corpus. The cross-framework mapping endpoints let the
copilot answer "we already report under ISSB — what SASB metrics does that cover?", reducing double
work. Peer comparison drives competitive-positioning narratives. Cross-links to `issb_s2`, `gri`,
and `peer_benchmark` copilots.

**Prerequisites.** None hard — engine is honest and reference-rich; peer answers are far stronger
after Evolution A's real medians. **Acceptance:** every completeness, coverage, and percentile
figure traces to a tool response; the copilot uses the real ISSB/GRI/ESRS mapping endpoints for
cross-framework claims; it discloses when a benchmark rests on a static median (pre-Evolution-A)
and refuses to assert IFRS S1 compliance beyond the ¶55 rule the engine computes.
