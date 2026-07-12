## 9 · Future Evolution

### 9.1 Evolution A — Replace the seeded screener with engine-scored countries (analytics ladder: rung 1 → 2)

**What.** §7's finding is a wiring irony: this page fabricates what its own domain
already computes. The guide's `PAS = Σ wᵢ×Policyᵢ/MaxScore` is not formed — all 50
countries' `policyStringency`/`ndcAmbition`/`ndcProgress` are independent seeded
draws (and the guide claims 190+ countries vs the coded 50) — while the shared
`climate_policy_tracker_engine` (documented under `climate-policy`) implements
genuine NDC scoring, carbon-price-gap, and jurisdiction assessment behind live
`/api/v1/climate-policy/*` routes this page never calls. Evolution A deletes the
seeded generator and rebuilds the screening table as an engine client: per-country
rows populated from `score-ndc` and `assess-jurisdiction` outputs over the curated
country corpus, the 15-mechanism carbon-pricing table replaced by the World Bank
dashboard reference data the sibling module's Evolution A establishes, and coverage
stated honestly (as many countries as the engine's corpus supports — not "190+"
until true).

**How.** (1) Batch-scoring endpoint or client loop over the country list; results
cached with engine version. (2) The PAS either implemented in the engine as a
documented weighted composite of its existing sub-scores, or the guide rewritten to
the engine's actual outputs — one canonical scoring story across both policy modules.
(3) Screening filters (continent, income group) retained over the new rows.

**Prerequisites (hard).** PRNG purge; deduplication decision with `climate-policy`
(two pages, one engine, one data layer — their split of roles recorded in both
guides). **Acceptance:** every country score reproduces via a direct engine call;
the stated coverage count equals the corpus size; zero seeded scores remain.

### 9.2 Evolution B — Transition-risk screening copilot (LLM tier 2)

**What.** A screening assistant for sovereign and portfolio analysts: "rank our
sovereign exposures by policy-implementation gap", "which middle-income countries
have carbon prices within $10 of NZE-2030 needs?", "explain why country X scores
low" (the engine's decomposition — target score, base-year penalty, price gap — is
fully explainable). Batch questions run as tool-call loops over the engine routes;
comparative narration cites per-country engine outputs.

**How.** Tool schemas over the tracker POSTs (shared with the `climate-policy`
copilot — one tool registry, two module surfaces per the atlas endpoint map);
validator on every score and gap; screening results carry engine version and corpus
vintage so ranks are reproducible; refusal on policy forecasts.

**Prerequisites (hard).** Evolution A first — screening over seeded draws would rank
countries by noise while wearing a CAT-flavoured costume; coordination with the
sibling copilot to avoid contradictory answers from the same engine. **Acceptance:**
a ranking regenerates identically from the logged tool calls; a low-score explanation
cites the engine's sub-score contributions; coverage questions get the honest corpus
count.
