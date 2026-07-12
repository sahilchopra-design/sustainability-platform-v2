## 9 · Future Evolution

### 9.1 Evolution A — Persisted, calibrated confidence envelopes (analytics ladder: rung 1 → 3)

**What.** The engine (`services/validation_summary_engine.py`) deterministically wraps results with a confidence score and SHA-256 hash, but §7.5 documents the gaps precisely: the hash is emitted but never stored or verified; the confidence composite (0.05/flag penalty, 0.7/0.4 band cut-offs, maturity multipliers) has no statistical calibration; and registry version strings are self-declared, unlinked to code. Evolution A closes all three: persist envelopes, verify integrity, and calibrate the score against observed outcomes.

**How.** (1) New `validation_envelopes` table storing `calculation_id`, engine name, inputs hash, outputs hash, confidence, user_id — with a `GET /api/v1/validation/verify/{calculation_id}` that re-hashes a supplied payload against the stored digest (making the non-repudiation claim real). (2) Registry `version` fields generated from the engine-registry AST scan (the ENGINE_CATALOG machinery) instead of hand-typed strings. (3) Calibration: once envelopes accumulate, regress confidence bands against realised revision/error events (bench_quant failures, lineage-harness regressions, user-flagged corrections) and re-fit the flag penalty and band cut-offs; publish the fit in the dqs-map response so the score stops being purely ordinal.

**Prerequisites.** An Alembic migration for the new table (two-head merge pending — coordinate); adoption breadth: only engines that call `wrap`/`quick_wrap` generate calibration data, so instrument the 22 registry engines first. **Acceptance:** `verify` detects a single-character mutation of a stored result; dqs-map response includes calibration provenance (sample size, fit date) or explicitly states "uncalibrated heuristic".

### 9.2 Evolution B — The platform's no-fabrication substrate (LLM tier 2)

**What.** This module is not a candidate for its own chat panel — it *is* the guardrail layer the Tier-2 program needs. The productization roadmap requires every numeric in a Tier-2 answer to be traceable to a tool call; the validation envelope (inputs, parameters, methodology reference, outputs hash, confidence) is exactly the provenance record the post-response validator should check against. Evolution B wires them together.

**How.** (1) Every tool call a Module Analyst makes returns an envelope-wrapped result (engines already integrate via `quick_wrap`); the copilot runtime stores the envelope alongside the LLM trace. (2) The post-response validator resolves each numeric in the answer to a `calculation_id`, and the "show work" expander renders the envelope directly: methodology reference from `METHODOLOGY_REGISTRY` (22 engines with citations — IFRS 9, CRREM, CBAM, PCAF…), DQS-derived confidence, quality flags. (3) `GET /methodology-registry` becomes part of every module copilot's grounding corpus, so "which standard governs this number?" is answered from the registry, not model memory.

**Prerequisites.** Evolution A's persistence (an unverifiable in-flight hash cannot anchor provenance); LLM trace tables (`llm_traces`) per roadmap D3. **Acceptance:** a Tier-2 answer's expander shows a resolvable `calculation_id` per cited figure; an answer containing a numeric with no matching envelope is logged as a validator failure.
