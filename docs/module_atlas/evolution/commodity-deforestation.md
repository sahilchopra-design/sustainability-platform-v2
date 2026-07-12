## 9 · Future Evolution

### 9.1 Evolution A — DRS from real forest-loss and trade-flow data (analytics ladder: rung 1 → 2)

**What.** §7.5 is unambiguous: country risk scores, deforestation rates, certification
credibility, and the credit uplift are all `rng()`/`sr()`-generated — only the FAO
forest-area lookup, the trader names, and the EUDR deadlines (2025-12-30 / 2026-06-30)
are real. The guide's `DRS = Σ(Commodity × SourceCountryRisk × Opacity)` is never
built as a product; country risk is a random draw. Evolution A constructs the score
from real inputs: Hansen/GFW tree-cover loss for country deforestation intensity,
Trase-style commodity-origin volumes, and a documented opacity rubric.

**How.** (1) Ingest Global Forest Watch country/commodity tree-cover-loss statistics
(free API tier) into a `forest_loss_annual` table via the platform's ingestion
framework — this replaces the synthetic `deforestRate` and the fabricated "alert" time
series. (2) Commodity-origin volumes from UN Comtrade (already integrated, wave 1) as
the volume weight; opacity scored from traceability disclosures with a published 3-level
rubric rather than `rng(20,98)`. (3) DRS becomes the actual triple product per
supply-chain segment, aggregated per company; the existing `engagementMatrix` weighting
(0.4/0.35/0.2) can stay but now consumes computed inputs. (4) EUDR-priority
classification derives from the computed DRS against documented thresholds.

**Prerequisites (hard).** Purge the `rng()`/`pct()` generators from every scored path
(guardrail conventions apply); keep real trader names only if their metrics stop being
synthetic — §7.5's real-names-fake-numbers combination is a presentation risk.
**Acceptance:** Brazil-soy and Malaysia-palm DRS values trace to specific GFW loss
figures and Comtrade volumes; the DRS product formula reproduces by hand for one
segment; zero PRNG calls feed displayed risk metrics.

### 9.2 Evolution B — EUDR due-diligence-statement assistant (LLM tier 1 → 2)

**What.** The module already tracks the real EUDR deadlines and traceability gaps;
what operators need next is the due-diligence statement itself. Evolution B drafts the
EUDR Article 9-style risk assessment for a selected commodity/origin pairing:
commodity scope confirmation, country risk classification with evidence, traceability
gaps from the `traceGaps` buckets, and mitigation steps — grounded in Regulation (EU)
2023/1115 text and (after Evolution A) computed DRS inputs, with each risk claim
citing its data source.

**How.** Tier 1: RAG over this Atlas record plus the EUDR regulation text (add to the
refdata regulatory catalogs); page state supplies the selected supply-chain segment.
The prompt encodes the current honesty constraint — until Evolution A lands, the
copilot must label risk scores as illustrative and refuse to embed them in a
compliance document. Tier 2 (post-Evolution A): tool calls to the DRS computation
endpoint so "reassess this segment with 2024 loss data" re-runs the product and
updates the draft.

**Prerequisites (hard).** Evolution A before any generated statement carries numbers —
a compliance artifact built on `rng()` scores is worse than none; regulation text
ingestion. **Acceptance:** a draft statement for one commodity/origin cites GFW and
Comtrade values present in tool output or the DB; segments without traceability data
yield "insufficient geolocation evidence" rather than a synthesized risk rating.
