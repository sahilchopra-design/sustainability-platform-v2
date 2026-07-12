## 9 · Future Evolution

### 9.1 Evolution A — Enforce CDP level-gating and parse raw questionnaire responses (analytics ladder: rung 1 → 3)

**What.** A CDP scoring engine for the Climate (C0–C14) and Water (W0–W8) questionnaires,
implementing the four-level structure (Disclosure→Awareness→Management→Leadership), A→D- bands, peer
benchmarking, cross-framework mapping and recommendations — deterministic, no PRNG (the only
`hashlib` use is a stable assessment ID). §7.5 names the fidelity gaps: the engine scores
**self-assessed 0–100 level inputs**, not raw questionnaire responses (a caller must translate CDP
answers into per-module scores); CDP's real scoring is question-and-points based with **level-gating**
(you cannot score Management without passing Awareness), but here levels are simply averaged at equal
0.25 weights and the `min_score_for_level` thresholds are reference metadata **not enforced as
gates**; and peer benchmarks cover only 6 of 12 activity groups. Evolution A enforces the level
gates and adds a raw-response scorer.

**How.** `_score_module` gates higher-level points on passing the lower level's `min_score_for_level`
(Awareness ≥30 before Management counts, etc.), matching CDP's cascade; a new `assess_from_responses`
maps raw questionnaire answers to level scores so callers needn't pre-translate. Rung 3: complete the
peer-benchmark medians for all 12 activity groups from published CDP score distributions, and validate
grade outputs against actual CDP disclosures. The exposed surface today is reference-data-only — the
scoring endpoints (`assess-climate`, `assess-water`, `compare-peers`) become first-class.

**Prerequisites.** The scoring calculators are consumed internally (§7.1) — expose and harness-test
`POST /assess-climate` and `/assess-water`; document that category weights and thresholds approximate
CDP's proprietary weighted system. **Acceptance:** the §7.4 worked example (52.0% → B-) reproduces
under equal weighting, but enabling gating lowers scores where a level is skipped; a raw-response
input produces the same grade as its pre-translated equivalent; all 12 activity groups return a
benchmark.

### 9.2 Evolution B — CDP disclosure copilot with tool-called scoring (LLM tier 1 → 2)

**What.** A copilot for sustainability teams answering "what's our likely CDP climate grade?"
(tool-calls `/assess-climate`), "how do we compare to our activity-group peers?" (`/compare-peers`),
"what gaps are dragging our score?" (the engine's gap analysis), and "how does CDP C6 map to ISSB
S2?" (the cross-framework map) — narrating the engine's real module scores, grade bands and
prioritised recommendations.

**How.** Tier-1 roadmap pattern for explanation (the 8 `ref/*` endpoints — module catalogues,
scoring methodology, score bands, activity groups, cross-framework map, peer benchmarks — are ideal
RAG grounding), graduating to tier 2 once the scoring endpoints are exposed (Evolution A) so the
copilot runs real assessments. The no-fabrication validator checks every percentage and grade against
tool output; the copilot must state that it scores self-assessed level inputs and approximates CDP's
proprietary weighted/gated system, not the official score. Composable into a disclosure-readiness
workflow alongside `csrd_reports` and `analyst_portfolios`.

**Prerequisites.** Evolution A's exposed scoring endpoints and gating; Atlas + `ref/*` corpus
embedded (roadmap D3). **Acceptance:** every figure cited traces to an engine tool call; the grade
matches `/assess-climate`; a cross-framework question resolves to the real CDP→TCFD/ISSB/GRI/SASB
mapping; the copilot flags its output as an approximation of CDP's official methodology.
