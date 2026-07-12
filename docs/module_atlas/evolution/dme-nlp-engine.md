## 9 · Future Evolution

### 9.1 Evolution A — Feed the pulse engine real signals and calibrate its decay (analytics ladder: rung 2 → 3)

**What.** The backend is real and elegantly specified: `NLPPulseEngine` computes `P(t) = S(t)·ln(1+I(t))`, a greenwashing discount `GDF = max(0, 1 − κ·max(0, S_mkt − S_ops)/100)` applied only to positive self-reported signals, event-type exponential decay (half-lives 12h breaking news → 4320h corporate disclosure), and tiered source credibility (0.95→0.15). But nothing real flows through it: the frontend's document matrices, embeddings, NER counts, and sentiment aspects are all `sr()`-seeded, and the promised spaCy/FinBERT/GDELT integrations don't exist. Evolution A builds the signal supply chain and calibrates the engine's constants.

**How.** (1) A GDELT 2.0 GKG ingester (free, keyless — fits the platform's ingestion framework) filtered to the company master's entities, posting real signals to `POST /process-batch`; persisted `nlp_signals` table so decay is applied to actual timestamps via `POST /apply-decay`. (2) Sentiment: FinBERT batch scoring server-side (or Claude-scored with cached results — decide by cost benchmark) replacing seeded `aspectSentiment`. (3) Calibration to earn rung 3: fit the five `DECAY_HALF_LIVES_HOURS` against observed GDELT coverage decay for a sample of named controversies, and validate `SOURCE_CREDIBILITY` tiers against subsequent-confirmation rates; publish fit statistics in `ref/event-types`.

**Prerequisites.** GDELT entity-matching quality gate (name collisions poison signals — resolve via `entity_lei` aliases); the frontend's seeded demo matrices clearly labeled or removed as real data lands. **Acceptance:** lineage sweep shows `process-batch` `passed` with `nlp_signals` as source; a known 2024 controversy's pulse trajectory reproduces from stored signals; calibrated half-lives ship with confidence intervals, not just the authored constants.

### 9.2 Evolution B — Controversy triage analyst over the live pulse (LLM tier 2)

**What.** A tool-calling analyst for the module's stated users (compliance teams, fund managers): "what's driving the greenwashing flag on issuer X?" answered by pulling the issuer's signal history, decomposing the GDF (marketing vs operational sentiment gap, κ), and quoting the underlying GDELT source items — then simulating: "if this stays out of the news 30 days, where does the pulse decay to?" via `POST /apply-decay` with the event type's real half-life.

**How.** Tool schemas from the module's 5 existing OpenAPI operations plus Evolution A's signal-history query; grounding corpus = this Atlas record's §2.3 formula table (pulse, GDF, λ definitions) so explanations quote the implemented math. Source citations link to the stored GDELT records with their credibility tier disclosed — a tier-4 social signal is never presented with tier-1 confidence. The no-fabrication validator covers pulse scores and decay projections.

**Prerequisites (hard).** Evolution A — narrating today's seeded document matrices would attribute fabricated greenwashing scores to the 20 real `ISSUER_NAMES` on the page, a defamation-adjacent failure mode. **Acceptance:** every quoted pulse/GDF figure matches a tool response; asking about an issuer with no ingested signals returns "no signal coverage" with the coverage stats, not an invented score.
