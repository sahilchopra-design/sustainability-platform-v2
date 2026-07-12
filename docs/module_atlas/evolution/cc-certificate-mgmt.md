## 9 · Future Evolution

### 9.1 Evolution A — Real certificate ledger with enforced state machine (analytics ladder: rung 1 → 2)

**What.** The §7 deep-dive flags a guide↔code mismatch: the page claims a certificate
lifecycle state machine with immutable audit ledger and cross-registry dedup, but the
code is a read-only inventory dashboard over a seeded `CREDITS` array (30 credits, 8
batches) computing only aggregates (`totalAvailable`, `agingAnalysis`,
`inventoryByRegistry`). Evolution A builds the module's first backend vertical: a
`cc_certificates` / `cc_certificate_events` table pair with the documented
Issued→Reserved→Transferred→Retired→Cancelled transitions actually enforced
server-side, plus serial-range overlap detection across registries.

**How.** (1) New router `api/v1/routes/cc_certificates.py` with POST transition
endpoints that reject illegal moves (e.g. Retired→Transferred) at the DB constraint
level, not just UI. (2) Append-only event table gives the audit trail the guide already
promises; retirement writes lock the serial range via a partial unique index.
(3) What-if layer (rung 2): project retirement runway from the vintage-aging arithmetic
the page already computes, but off live positions.

**Prerequisites.** Resolve the documented mismatch by either building this vertical or
rewording the guide — the atlas flag must not survive the evolution; Alembic migration
slot after the two-head merge. **Acceptance:** an API attempt to transfer a retired
serial returns 409 with the blocking event cited; UI aggregates reconcile 1:1 with SQL
sums over the new tables.

### 9.2 Evolution B — Registry-operations copilot (LLM tier 1)

**What.** A copilot on the certificate page answering "why can't this batch be
cancelled?", "what does the aging analysis mean for our 2019 vintages?", and "which
registry rules govern this retirement?" grounded strictly in this atlas page (§5 state
machine, Verra/GS/CAR/ISO 14064-3 standards list) and the rendered page state — not a
tool-calling analyst, because today the module exposes zero backend endpoints to call.

**How.** Per the tier-1 pattern: atlas record embedded into `llm_corpus_chunks`,
served via `POST /api/v1/copilot/cc-certificate-mgmt/ask` with the page's current
inventory aggregates passed as context; answers must cite an atlas section or on-screen
figure, with the mandatory refusal path for anything the dashboard does not compute
(prices, forward curves, counterparty credit).

**Prerequisites.** The copilot prompt must disclose that current data is a synthetic
demonstration book until Evolution A lands — narrating seeded serials as if they were
live registry positions would violate the no-fabrication contract. **Acceptance:**
adversarial probe "what is the market price of BATCH-A1?" produces a refusal citing the
module's computed surface; every numeric in answers traces to page state.
