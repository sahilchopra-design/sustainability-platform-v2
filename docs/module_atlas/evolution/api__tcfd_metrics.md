## 9 · Future Evolution

### 9.1 Evolution A — Evidence-graded elements and maturity trajectory (analytics ladder: rung 1 → 2)

**What.** The E13 engine scores disclosure against the full TCFD framework — 4 pillars, 11
recommendations (G1/G2, S1–S3, RM1–RM3, MT1–MT3), each with 3–5 named disclosure elements:
`completeness(rec) = covered/defined × 100`, pillar scores weighted (blocking ×1.5),
`overall = 0.20·Gov + 0.30·Strategy + 0.25·RiskMgmt + 0.25·M&T`, mapped to a 5-level maturity
ladder. Clean and honest, but inputs are caller-asserted booleans/quality flags per element, and
with TCFD now absorbed into ISSB, the module's distinct value is the element-level granularity and
the maturity ladder. Evolution A grounds elements in evidence and adds trajectory.

**How.** (1) Auto-grade the metric-bearing elements from platform data: MT2's Scope 1/2/3 elements
check against the entity's actual computed emissions (PCAF/GHG engines), S3's scenario-analysis
element against stored scenario runs — so `elements_covered` is verified where the platform holds
the evidence, with an `evidence_tier` per element. (2) Persist assessments so maturity is a
trajectory (level 2 → 3 year-over-year), the story boards actually want. (3) Reuse assessments
across frameworks via the existing `/ref/cross-framework` map (ESRS E1, ISSB S2, CDP, GRI 305,
SEC) so a TCFD assessment pre-fills its successors — this module becomes the platform's
climate-disclosure rosetta stone. (4) Bench-pin the pillar weighting and maturity mapping.

**Prerequisites.** Links to emissions/scenario engines for element verification; an assessment
store for trajectories. **Acceptance:** MT2 elements auto-verify against computed emissions with an
evidence tier; maturity returns a multi-year trajectory for a persisted entity; cross-framework
pre-fill demonstrated into `issb_s2`; scoring bench-pinned.

### 9.2 Evolution B — TCFD maturity copilot with cross-framework migration (LLM tier 2)

**What.** A copilot that runs `/assess` and explains the verdict — "you're maturity level 3;
Strategy (weighted 0.30) is your weak pillar because S3's resilience element is missing; here's
what closes it" — and answers the question every reporter now asks: "we did TCFD; what's left for
ISSB S2 / CSRD?" using the cross-framework map.

**How.** Three POST endpoints (`/assess`, `/assess/pillar`, `/assess/batch`) plus five reference
GETs (the 11 recommendations with their named elements, pillars, sector supplements, maturity
levels, cross-framework) — a complete grounding corpus, so the copilot cites the exact missing
element (e.g. "MT2: Scope 3 material categories") rather than vague gaps. Batch supports
subsidiary roll-ups; sector supplements tailor the narrative. Pairs with the `issb_s2` and
`regulatory_reports` copilots for the migration story.

**Prerequisites.** None hard — the engine is honest and reference-complete today; evidence-graded
narration and trajectories need Evolution A. **Acceptance:** every pillar score, maturity level,
and named gap traces to an `/assess` response; cross-framework claims come from the mapping
endpoint, not model memory; the copilot discloses that element coverage is self-asserted
(pre-Evolution-A) and refuses to state regulatory compliance from a voluntary-framework score.
