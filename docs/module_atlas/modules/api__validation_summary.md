# Api::Validation_Summary
**Module ID:** `api::validation_summary` · **Route:** `/api/v1/validation` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/validation/methodology-registry` | `methodology_registry` | api/v1/routes/validation_summary.py |
| GET | `/api/v1/validation/dqs-map` | `dqs_confidence_map` | api/v1/routes/validation_summary.py |
| POST | `/api/v1/validation/wrap` | `wrap_result` | api/v1/routes/validation_summary.py |

### 2.3 Engine `validation_summary_engine` (services/validation_summary_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `compute_confidence` | data_quality_flags, dqs_scores, input_completeness_pct, methodology_maturity | Compute 0-1 confidence score based on: - PCAF DQS scores (if provided) - Number of data quality flags (penalties) - Input completeness - Methodology maturity |
| `ValidationSummaryEngine.wrap` | result, meta, user_id | Wrap a raw engine result dict with a validation_summary envelope. Returns the original result dict augmented with a top-level "validation_summary" key. |
| `ValidationSummaryEngine.get_methodology_registry` |  | Return the full methodology registry for documentation/UI display. |
| `ValidationSummaryEngine.get_dqs_confidence_map` |  | Return PCAF DQS → confidence mapping. |
| `ValidationSummaryEngine.batch_wrap` | results, metas, user_id | Wrap multiple results in a single batch (e.g., portfolio-level). |
| `quick_wrap` | engine_name, result, inputs, params, flags, user_id | Shortcut for engines that want minimal integration effort. Example: from services.validation_summary_engine import quick_wrap result = engine.calculate(...) return quick_wrap("re_clvar_engine", result, inputs={"area": 5000}) |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/validation/dqs-map** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': [1, 2, 3, 4, 5], 'n_keys': 5}`

**GET /api/v1/validation/methodology-registry** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['carbon_calculator', 'carbon_calculator_v2', 'cbam_calculator', 'ecl_climate_engine', 're_clvar_engine', 'crrem_stranding_engine', 'epc_transition_engine', 'green_premium_engine', 'real_estate_valuation_engine', 'nature_risk_calculator', 'stranded_asset_calculator', 'pd_c`

**POST /api/v1/validation/wrap** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `validation_summary_engine` — extracted transformation lines:**
```python
flag_penalty = len(data_quality_flags) * 0.05
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`backend/services/validation_summary_engine.py` is a **cross-cutting audit-envelope service**: any engine endpoint can wrap its result dict with a `validation_summary` block giving full calculation traceability — inputs captured, parameters applied, methodology reference, data sources, quality flags, a SHA-256 output hash, and a **0–1 confidence score**. Endpoints: `POST /api/v1/validation/wrap` (wrap a result with `CalcMeta`), `GET /validation/methodology-registry`, `GET /validation/dqs-map`.

```
confidence = min(1.0, avg(DQS_CONFIDENCE[dqs]))      # PCAF DQS channel (if scores supplied)
             − 0.05 × n_quality_flags                # flag penalties
             × (input_completeness_pct / 100)        # completeness scaling
             × maturity_mult                          # established 1.0 | evolving 0.9 | experimental 0.75
band       = high (≥0.7) | medium (≥0.4) | low (<0.4)
outputs_hash = SHA-256(json.dumps(result, sort_keys=True))   # non-repudiation
```

### 7.2 Parameterisation

**PCAF DQS → confidence map** (`DQS_CONFIDENCE`): 1 Verified/audited → 1.00, 2 Reported → 0.90, 3 Physical-activity estimate → 0.70, 4 Economic-activity estimate → 0.50, 5 Proxy/revenue estimate → 0.30 (unknown DQS defaults 0.30). The 1–5 ladder is PCAF's; the numeric confidence values are engine calibration.

**Methodology registry** (`METHODOLOGY_REGISTRY`): 22 engines with canonical citations, e.g.:

| Engine | Reference | Standards |
|---|---|---|
| `ecl_climate_engine` | IFRS 9 B5.5.1–B5.5.55, EBA GL/2020/06, ECB C&E Guide | IFRS 9, CRR2 Art. 178 |
| `crrem_stranding_engine` | CRREM v2.3 pathways, IEA NZE 2050 | CRREM, RICS VPS 4, IVS 2024 |
| `cbam_calculator` | EU CBAM Reg. 2023/956 + Impl. Reg. 2023/1773 | CBAM Art. 7/21/31, CN8 |
| `facilitated_emissions_engine` | PCAF Standard Part C (2024) | PCAF Part C, GHG Protocol Cat 15 |
| `insurance_risk_engine` | Solvency II Del. Reg. 2015/35, EIOPA C&E Opinion 2023 | Solvency II, IFRS 17 |
| `nature_risk_calculator` | TNFD LEAP v1.1, ENCORE, SBTN v1 | TNFD, CBD-GBF Target 15 |

When the wrapping engine omits a methodology reference/version, the registry entry backfills it; `standards` always come from the registry.

**Other constants:** flag penalty 0.05 each; maturity multipliers {1.0, 0.9, 0.75; unknown 0.85}; band cut-offs 0.7/0.4 — all engine-authored.

### 7.3 Calculation walkthrough

`ValidationSummaryEngine.wrap(result, meta, user_id)`: registry lookup → `compute_confidence` → band → deterministic JSON serialisation (`sort_keys=True`, `default=str`) → SHA-256 digest → UUID4 `calculation_id` + UTC ISO timestamp → envelope attached as `result["validation_summary"]`. `batch_wrap` applies the same per element (lengths must match); `quick_wrap(engine_name, result, …)` is a minimal-integration shortcut that relies entirely on registry defaults.

### 7.4 Worked example

A CLVaR calculation wraps with `dqs_scores=[2,3,3]`, two quality flags ("EPC rating interpolated", "grid EF proxied"), completeness 90%, maturity "evolving":

| Step | Computation | Result |
|---|---|---|
| DQS channel | (0.90 + 0.70 + 0.70)/3 | 0.7667 |
| Base | min(1.0, 0.7667) | 0.7667 |
| Flag penalty | 0.7667 − 2×0.05 | 0.6667 |
| Completeness | 0.6667 × 0.90 | 0.6000 |
| Maturity | 0.6000 × 0.90 | **0.540** |
| Band | 0.4 ≤ 0.540 < 0.7 | **medium** |

The envelope also records `methodology_reference = "MSCI CLVaR 2024, NGFS Phase V Physical Risk, ECB Climate Stress Test 2024"` (registry backfill for `re_clvar_engine`) and the SHA-256 of the result payload, so any later mutation of the stored result is detectable.

### 7.5 Data provenance & limitations

- **Deterministic given inputs; no PRNG** (the UUID4 calculation_id is an identifier, not data). The engine computes *metadata about* calculations — it never alters or validates the numeric result itself; a wrong number with clean inputs still gets a high confidence score.
- Confidence is a heuristic composite: linear flag penalties and multiplicative maturity/completeness factors have no statistical calibration; the score should be read ordinally (high/medium/low), not as a probability.
- Hash integrity depends on downstream persistence — the service emits the hash but does not store or verify it; `default=str` serialisation means semantically-equal results with different types can hash differently.
- Registry version strings are self-declared per engine and not linked to actual code versions.

### 7.6 Framework alignment

- **BCBS 239 (Principle 6 — Accuracy & Integrity)** — the envelope operationalises risk-data-aggregation traceability: every figure carries its inputs, parameters, sources, and an integrity hash. (BCBS 239's principles cover governance, accuracy, completeness and timeliness of risk reporting; this module addresses the accuracy/lineage slice.)
- **EBA GL/2020/06 §4.4 (loan origination data quality)** — quality flags and completeness scaling implement the guideline's requirement that institutions assess and document data quality in credit decisioning.
- **PCAF Global Standard (Data Quality Scores)** — PCAF scores financed emissions data 1 (audited) to 5 (economic-proxy estimate) per asset class scorecard; this module propagates those scores into a single confidence figure via the DQS_CONFIDENCE map, so a portfolio's emissions confidence reflects its PCAF data-quality mix.
- The registry itself cross-references ~30 further frameworks (IFRS 9/17, CRREM, CBAM, Solvency II, TNFD, GISTM, ILPA/EDCI…) — those govern the *wrapped* engines, and the registry is the platform's single source of truth for which standard each engine claims.

## 9 · Future Evolution

### 9.1 Evolution A — Persisted, calibrated confidence envelopes (analytics ladder: rung 1 → 3)

**What.** The engine (`services/validation_summary_engine.py`) deterministically wraps results with a confidence score and SHA-256 hash, but §7.5 documents the gaps precisely: the hash is emitted but never stored or verified; the confidence composite (0.05/flag penalty, 0.7/0.4 band cut-offs, maturity multipliers) has no statistical calibration; and registry version strings are self-declared, unlinked to code. Evolution A closes all three: persist envelopes, verify integrity, and calibrate the score against observed outcomes.

**How.** (1) New `validation_envelopes` table storing `calculation_id`, engine name, inputs hash, outputs hash, confidence, user_id — with a `GET /api/v1/validation/verify/{calculation_id}` that re-hashes a supplied payload against the stored digest (making the non-repudiation claim real). (2) Registry `version` fields generated from the engine-registry AST scan (the ENGINE_CATALOG machinery) instead of hand-typed strings. (3) Calibration: once envelopes accumulate, regress confidence bands against realised revision/error events (bench_quant failures, lineage-harness regressions, user-flagged corrections) and re-fit the flag penalty and band cut-offs; publish the fit in the dqs-map response so the score stops being purely ordinal.

**Prerequisites.** An Alembic migration for the new table (two-head merge pending — coordinate); adoption breadth: only engines that call `wrap`/`quick_wrap` generate calibration data, so instrument the 22 registry engines first. **Acceptance:** `verify` detects a single-character mutation of a stored result; dqs-map response includes calibration provenance (sample size, fit date) or explicitly states "uncalibrated heuristic".

### 9.2 Evolution B — The platform's no-fabrication substrate (LLM tier 2)

**What.** This module is not a candidate for its own chat panel — it *is* the guardrail layer the Tier-2 program needs. The productization roadmap requires every numeric in a Tier-2 answer to be traceable to a tool call; the validation envelope (inputs, parameters, methodology reference, outputs hash, confidence) is exactly the provenance record the post-response validator should check against. Evolution B wires them together.

**How.** (1) Every tool call a Module Analyst makes returns an envelope-wrapped result (engines already integrate via `quick_wrap`); the copilot runtime stores the envelope alongside the LLM trace. (2) The post-response validator resolves each numeric in the answer to a `calculation_id`, and the "show work" expander renders the envelope directly: methodology reference from `METHODOLOGY_REGISTRY` (22 engines with citations — IFRS 9, CRREM, CBAM, PCAF…), DQS-derived confidence, quality flags. (3) `GET /methodology-registry` becomes part of every module copilot's grounding corpus, so "which standard governs this number?" is answered from the registry, not model memory.

**Prerequisites.** Evolution A's persistence (an unverifiable in-flight hash cannot anchor provenance); LLM trace tables (`llm_traces`) per roadmap D3. **Acceptance:** a Tier-2 answer's expander shows a resolvable `calculation_id` per cited figure; an answer containing a numeric with no matching envelope is logged as a validator failure.