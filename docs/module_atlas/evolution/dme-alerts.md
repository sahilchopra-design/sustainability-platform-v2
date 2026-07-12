## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to the real velocity engine and calibrate its thresholds (analytics ladder: rung 1 → 3)

**What.** The §7 flag documents a frontend↔backend split: `dme_alert_engine.py` implements a rigorous four-tier z-score velocity framework (compound gate `V > k·σ AND A > 0`, 30/20/30/20 priority score, SLA/suppression tables) — but the page never calls it, instead generating alerts client-side from `GLOBAL_COMPANY_MASTER` with a hash-seeded PRNG and fabricating `estimated_pd_impact`/`estimated_var_impact` with ad-hoc constants. Both POST endpoints show `skipped` in the lineage trace — the production path is effectively unexercised. Evolution A makes the engine the only alert source and calibrates it.

**How.** (1) Feed: a scheduled job computes topic-score velocity/acceleration from the DME materiality time series (dme-index/dme-entity outputs) and posts to `POST /process-batch`; alerts persist to a new `dme_alert_archive` table (currently no persistence — "historical alert archive" in the overview is aspirational). (2) Page renders archive + `GET /ref/thresholds`, deleting `generateAlerts()` and the fabricated PD/VaR fields (or replacing them with honest links to `dme-pd-engine` outputs where an entity mapping exists). (3) Calibration: fit tier thresholds (currently fixed 3.0/4.0 σ) to the empirical signal distribution per topic, and backtest alert precision against subsequently-confirmed controversies from `esg-controversy` data.

**Prerequisites.** A real score time series (the DME family must persist history first); the §8-flagged PD/VaR fabrication removed before anything ships. **Acceptance:** lineage re-sweep shows both POSTs `passed` with `dme_alert_archive` as source table; zero client-side alert generation; threshold calibration documented in the response payload.

### 9.2 Evolution B — Alert-triage copilot that explains and simulates escalations (LLM tier 2)

**What.** An on-page analyst that answers "why is this CRITICAL?" by citing the engine's own decomposition — z-velocity, acceleration gate, exposure share, sensitivity — from the alert record, and runs what-ifs as tool calls: "would this still fire at a 3.5σ threshold?" → `POST /process-signal` with modified thresholds; "show me everything that would breach if suppression dropped to 12h" → `POST /process-batch` re-run. It also drafts the owner-notification message with the SLA deadline from `SLA_HOURS`.

**How.** Tool schemas from the module's 3 existing OpenAPI operations (all engine-backed, Pydantic-typed); grounding corpus = this Atlas record's §5 formula block and §7.1–7.3 engine documentation. The no-fabrication validator matches every z-score and priority figure to tool outputs. Escalation drafting is text-only — acknowledgment/assignment mutations wait for the alert-workflow tables from Evolution A and sit behind explicit confirmation per tier-2 RBAC convention.

**Prerequisites (hard).** Evolution A first — a copilot narrating the current client-side fabricated alerts (with their unvalidated PD/VaR impacts) would explain numbers no engine produced, precisely the failure mode the exemplar module warns about. **Acceptance:** every numeric in a triage answer traces to a `/process-signal` or archive response; asking for the alert's "expected loss" refuses until a validated impact model exists.
