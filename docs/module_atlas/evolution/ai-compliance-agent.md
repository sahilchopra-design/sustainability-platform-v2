## 9 · Future Evolution

### 9.1 Evolution A — Live regulatory ingestion replacing the scripted agent (analytics ladder: rung 1 → 3)

**What.** The module's real asset is its hand-authored `GAP_TEMPLATES` — professionally
accurate, article-referenced disclosure gaps (ESRS E1-6 Scope 3, IFRS S2 para 29, SFDR Art. 4
PAIs, TNFD Req C/D) across 8 frameworks. But §7.5 documents that the "AI agent" is theatre:
the 20-step `AGENT_LOG` is a scripted animation, there is no RSS ingestion or NLP
classification, and compliance percentages/confidences/owners are PRNG draws. Evolution A
makes the horizon-scanning real: an ingester pulling EFRAG/ESMA/SEC/FCA/EU regulatory feeds
(the platform already integrates Climate Policy Radar and a regulatory-calendar module),
classifying updates as new-requirement/amendment/clarification/repeal, and mapping them to
the affected frameworks and the platform's own module registry.

**How.** A `regulatory_updates` table populated by a feed ingester (following the 19-ingester
scaffold); `GET /api/v1/compliance-agent/updates` and `POST /gap-assessment` where compliance
% is computed from a company's actual disclosure evidence against required datapoints, not
`round(35 + sr·60)`. The existing priority heuristic (`priority = exposure × urgencyW /
totalDays`) and fine-exposure linear haircut are preserved but fed real inputs. Rung 3:
calibrate fine exposure against published enforcement actions rather than single point
multipliers, adding a probability-of-enforcement term.

**Prerequisites (hard).** Purge the `sr()`-driven compliance/confidence/owner draws per the
no-fabricated-random guardrail; wire to the real regulatory-calendar and Climate Policy Radar
sources (memory notes CPR has no live API — use its dataset export). **Acceptance:** the
change log reflects a real ingested regulatory update with a source URL and classification;
compliance % changes when a company's evidence changes; the +12pt Q1 projection is replaced by
a plan-derived estimate.

### 9.2 Evolution B — RAG-grounded regulatory Q&A over the gap corpus (LLM tier 1 → 2)

**What.** The page already advertises an "AI Query" tab for natural-language regulatory
questions — today non-functional. This is the platform's clearest tier-1 fit: a copilot
answering "what does ESRS E1-6 require for Scope 3?", "which of my frameworks have passed
deadlines?", and "what's my highest-priority gap and why?" grounded in the accurate
`GAP_TEMPLATES` corpus and the live compliance/priority state. The article-referenced gap
content is exactly the kind of curated corpus the roadmap's Tier-1 RAG explainer is built for.

**How.** Embed `GAP_TEMPLATES` (article refs, recommendations, effort ratings) plus this Atlas
page into `llm_corpus_chunks`; serve via `POST /api/v1/copilot/ai-compliance-agent/ask` with
mandatory citation of the framework/article and the standard refusal path ("this module does
not track that jurisdiction"). After Evolution A, graduate to tier 2 by tool-calling the
`/updates` and `/gap-assessment` endpoints so the copilot can answer "re-score my CSRD
compliance after uploading this evidence" from real engine output — with the no-fabrication
validator checking every percentage and fine figure against tool results.

**Prerequisites.** Atlas + gap corpus embedded (roadmap D3); the copilot must disclose that
compliance percentages are synthetic until Evolution A wires real evidence. **Acceptance:**
every regulatory citation resolves to a real article reference in the corpus; a fine-exposure
figure in an answer traces to `exposure = fineMultiplier × (1 − compliancePct/100)` with the
inputs shown; out-of-scope jurisdiction questions are refused.
