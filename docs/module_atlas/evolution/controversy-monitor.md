## 9 · Future Evolution

### 9.1 Evolution A — Live signal ingest with the computed severity product (analytics ladder: rung 1 → 2)

**What.** The monitor's two honest components — 20 curated real 2024 incidents with
named sources, and deterministic auto-alert rules over real holding attributes
(no-SBTi + >1 MtCO₂e Scope 1, high transition/physical risk) — are frozen or
rule-bound. §7's flag: the guide's scoring engine
`Severity = max(Category_weight × Reach_score × Novelty_factor)` and the RepRisk-style
24-month rolling index don't exist; severity is a curated field and the "live feed" is
static. Evolution A builds the ingestion and scoring pipeline so the feed actually
moves.

**How.** (1) Ingest: GDELT (free, keyless) as the news-signal source, filtered to
watchlist entities resolved through the GLEIF spine, landing in a
`controversy_signals` table via the ingestion framework — replacing the frozen
snapshot with dated events. (2) Scoring: implement the guide's product — category
weights from the ESRS/SASB hierarchy it specifies (human rights 5.0, labour 4.5…),
reach from source-count/geography breadth in the ingest, novelty decaying by
recurrence — each factor visible in the event drill-down, replacing the curated
1–5 with a decomposable score (curated events keep their editorial severity as a
labelled second opinion). (3) RRI: rolling 24-month peak severity per company, the
trend line the Company Scorecard tab promises. (4) The auto-alert rules stay
deterministic — they are a strength, not a gap.

**Prerequisites.** Entity-resolution quality on news mentions (GLEIF fuzzy matching
exists but news aliases are noisy — precision threshold before auto-display); alert
notification plumbing if the Settings promise of email/Slack is kept.
**Acceptance:** a new watchlist company accrues signals within a day; each severity
score decomposes into its three factors in the UI; RRI reproduces from the stored
signal history.

### 9.2 Evolution B — Signal triage analyst: classify, dedupe, and brief (LLM tier 2)

**What.** The gap between raw news volume and the module's clean event schema is
classification work — the guide even names NLP as the intended mechanism. Evolution B
puts the LLM at that seam: incoming GDELT signals get classified (E/S/G pillar,
controversy type from the module's category list, affected entity confirmation,
duplicate-of-existing-event detection) with a confidence score; low-confidence items
queue for human review rather than auto-publishing. On demand, the analyst drafts the
stewardship brief for a matched holding: event history, RRI trajectory, the
triggered auto-alert rules, and the module's severity-laddered recommendation —
citing each signal's source.

**How.** Tier-2 tooling over Evolution A's signal store: read tools for
signals/events/RRI, a gated write tool for confirming classifications into
`CONTROVERSY_DB`-successor records (human confirm per the roadmap's mutation
contract). Classification prompts ground on the category-weight taxonomy and the 20
curated events as few-shot exemplars. The fabrication rule is provenance-shaped:
every event in a brief must reference an ingested signal URL or a curated record —
the model never "recalls" controversies from training data into the feed.

**Prerequisites (hard).** Evolution A's ingest (there is nothing to classify today);
review-queue UI for low-confidence classifications. **Acceptance:** classification
precision ≥90% on a 50-signal hand-labelled test set before auto-publish is enabled;
briefs contain only signals present in the store; training-data-recalled events
(present in the model, absent from the store) are correctly refused.
