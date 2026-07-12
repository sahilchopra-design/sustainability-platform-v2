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
