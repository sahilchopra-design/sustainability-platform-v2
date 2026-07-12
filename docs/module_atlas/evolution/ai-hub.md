## 9 · Future Evolution

### 9.1 Evolution A — Real MLOps telemetry from the model registry (analytics ladder: rung 1 → 3)

**What.** This is an MLOps monitoring hub whose telemetry is fabricated: per §7.5 the 9 module
accuracies are authored constants, the 40-signal bus and throughput/accuracy-trend series are
`sr()` draws seeded to drift upward ("models improving" is built in, not measured), and the
alerts are a fixed editorial list. Evolution A connects the hub to the platform's actual AI
sub-modules and the audit layer: real per-model inference counts and latencies from request logs,
real accuracy from held-out evals, and real drift from feature-distribution monitoring — turning
a decorative dashboard into a true model-operations console. The one genuinely substantive
concept, alpha-signal decay (half-life, horizon-R²), gets computed from realised signal-vs-return
correlations instead of hand-authored `DECAY_DATA`.

**How.** A `model_registry` table (name, type, training date, sample count, version) fed by the
sub-modules that actually deploy models (ai-governance, ai-sentiment, greenwashing detectors);
`GET /api/v1/ai-hub/telemetry` aggregating inference volume and latency from the 18 `audit_*`
tables (roadmap D4 materialized views); `GET /signal-decay` computing horizon-R² from stored
signal and forward-return series. Rung 3: PSI/accuracy drift monitoring with retraining alerts
grounded in real distribution shifts, not `sr·0.18+0.02`.

**Prerequisites (hard).** Purge the seeded signals/throughput/accuracy trends per the no-
fabricated-random guardrail; the sub-modules must expose real model metadata first. **Acceptance:**
the throughput chart reflects actual audit-logged inference counts; a model's accuracy trend
moves with real eval results (can go down); signal decay is computed from stored return data.

### 9.2 Evolution B — Platform intelligence copilot routing across AI sub-modules (LLM tier 3)

**What.** As the platform's "intelligence layer" catalogue, ai-hub is the natural front door for
a desk-orchestrator: "run full due diligence on Volkswagen" executes the hub's advertised
`Full Due Diligence` pipeline for real — routing to the sentiment engine, greenwashing detector,
ESG scorer and governance assessment, then synthesising a monitoring memo. Today those pipelines
(`PIPELINES`, 5) are static step-lists with seeded run counts; Evolution B makes them executable
agentic workflows.

**How.** Tier-3 routing per the roadmap: `module_tags.json` + the Atlas interconnection graph
map the 9 AI sub-modules into an executable pipeline registry; the orchestrator tool-calls each
sub-module's endpoints (post their Evolution-A verticals) in the pipeline's declared order,
streaming a real agent log (replacing the scripted `AGENT_LOG`). The no-fabrication validator
enforces that every figure in the synthesised memo traces to a sub-module tool call; provenance
UX shows which model produced each signal, its version and drift status from Evolution A's
telemetry.

**Prerequisites (hard).** The AI sub-modules need real backend verticals (several are synthetic
today); the desk-orchestrator framework (Phase 2–3); Evolution A's real telemetry so provenance
is meaningful. **Acceptance:** a pipeline run produces a memo where each signal cites its source
sub-module, model version and confidence; a sub-module returning no data yields an honest gap in
the memo rather than a seeded signal.
