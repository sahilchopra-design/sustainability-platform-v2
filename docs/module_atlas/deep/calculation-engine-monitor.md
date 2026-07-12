## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry specifies a composite
> `Engine_health = 0.40×Success_rate + 0.30×Freshness_score + 0.30×Accuracy_score` with
> `Freshness_score = 1 − Age_hrs/SLA_hrs`, amber/red thresholds at 80/60, SLA-breach KPIs and alert
> routing, over "18 engines". **No composite health score, freshness score, SLA logic, threshold
> alerting, or accuracy delta exists in the code.** The page monitors **30** hard-coded engine
> definitions (10 core + 20 secondary) whose statuses, success rates, run history, shadow-test
> results and configs are all *seeded random draws* — it is a UI prototype of an ops console, not a
> monitor connected to real pipelines. The sections below document the code as it behaves.

### 7.1 What the module computes

Four tabs over three synthetic datasets (`CalculationEngineMonitorPage.jsx:25-119`):

```js
// Engine registry (30 engines with real platform-relevant names & dependency DAG)
status      = sr(i*151) > 0.92 ? 'error' : sr(i*157) > 0.85 ? 'running' : 'idle'
successRate = min(100, 85 + sr(i*173)×15)                 // 85–100%
// Headline KPIs
engineStats = { total: 30, running: (seeded)+user-launched, errors: (seeded),
                avgSuccess: Σ successRate / 30 }
// Shadow model tests (40 cases)
pass = |actual − expected| ≤ expected × tolerance          // both values independent random draws
```

The genuinely deterministic piece is the **dependency DAG layout**: engines declare `depIds`
(e.g. `E-006 NGFS Climate Scenarios` depends on `E-001 PD Exponential` and `E-002 Merton DtD`;
`E-009 PCAF` depends on `E-007 GHG Calculator`), and the page performs an iterative topological
placement (`next = engines whose deps are all placed`) to render execution layers.

### 7.2 Parameterisation

| Dataset | Size | Key generated fields | Provenance |
|---|---|---|---|
| `CORE_ENGINES` | 10 | id, name (PD Exponential, Merton DtD, Monte Carlo VaR, DMI, ITR, NGFS, GHG, EU Taxonomy, PCAF, Copula Tail Risk), inputs/outputs table names, depIds | Hand-written catalogue mirroring real platform engines — descriptive, accurate as an inventory |
| `SECONDARY_ENGINES` | 20 | SFDR PAI, CSRD, Green Bond Verifier, SBTi Tracker, … Engagement Scorer; first 5 depend on E-007 | Hand-written catalogue |
| `EXEC_HISTORY` | 200 runs | trigger (5 types), duration 100ms–60s, input/output record counts, memory, errors/warnings, params (portfolio, NGFS scenario, confidence 0.95/0.99/0.999) | All seeded random |
| `SHADOW_TESTS` | 40 | metric (PD, VaR_95/99, DMI, Temp, Scope1/2, EU Tax, PCAF, Copula ES), expected/actual ∈ U(0.01, 95), tolerance ∈ {1,5,10,50,100}% | Random — pass/fail carries no information |
| `ENGINE_CONFIGS` | 10 | methodology version, ref-data version (DEFRA-2025, GWP-AR6, NGFS-v4.2, PCAF-v3, EU-Tax-DR-2024), estimation pathway, rounding, null handling, changelog, factor versions | Random picks from realistic vocabularies |

Status prevalences are tuned: ~8% error (`>0.92`), ~7% running, rest idle; run history ~8% error /
~4% warning.

### 7.3 Calculation walkthrough

1. **Engine Status tab** — registry cards with status dot, success-rate bar, last-exec age,
   version; `engineStats` KPI row; users can "Run" an engine, which adds it to `runningEngines`
   state (timer-based, no backend call).
2. **Execution History tab** — filter by engine/status/date-window (24h/7d/30d/90d over the
   seeded timestamps), sorted descending; monthly `execTimeTrend` (avg & p95 duration, both
   freshly random per month — p95 is *not* computed from the run records).
3. **Shadow Model Comparison tab** — the 40 test cases with delta and pass flag; `shadowTrend`
   plots a monthly "accuracy" line `90 + sr×8 + month×0.2` — a hard-coded upward drift, not an
   aggregate of the test cases shown beside it.
4. **Engine Configuration tab** — config cards with factor versions and changelog; a config-diff
   selector compares two engines' settings side by side.

### 7.4 Worked example

Shadow test with `expected = 42.0`, `actual = 43.5`, `tolerance = 0.05`:
`delta = |43.5 − 42.0| = 1.5`; bound = `42.0 × 0.05 = 2.1`; `1.5 ≤ 2.1` → **PASS**.
Because expected and actual are *independent* U(0.01, 95) draws, `P(pass)` for tolerance 5% is tiny
(≈ the chance two independent uniforms land within 5% of each other), so the tab predominantly
shows failures at tight tolerances and passes at the 50–100% tolerances — an artefact of the data
generator, not model quality. KPI: `avgSuccess = Σ(85 + sr×15)/30 ≈ 92.5%` in expectation.

### 7.5 Data provenance & limitations

- **Every operational metric is synthetic** (`sr(seed) = frac(sin(seed+1)×10⁴)`). Nothing on this
  page reads real run logs, scheduler state, or engine outputs — including the "Run" button, which
  animates locally. The only real information is the engine *catalogue* and its dependency graph,
  which usefully documents the platform's intended calculation topology (GHG → ITR/PCAF/SBTi;
  PD → NGFS stress).
- The monthly p95 and shadow "accuracy" trends are generated independently of the row-level data
  displayed next to them, so drill-downs will not reconcile with the trend lines.
- Guide's "18 engines", health-composite, freshness/SLA metrics: absent.

### 7.6 Framework alignment

- **SR 11-7 / SS1/23 (model risk management)** — ongoing monitoring and benchmarking (shadow/
  challenger models) are core MRM pillars; this page sketches the right console but with no data
  plumbing. Real shadow testing compares production output vs an independent implementation on
  identical inputs, with tolerance set per metric materiality.
- **PCAF data-quality / GHG Protocol data management** — named in the guide as accuracy anchors;
  a real monitor would track DQ-score distributions per engine run, which the config tab's
  "estimation pathway" field gestures at.
- **ISO 9001 process monitoring** — the success/freshness/error triad in the guide maps to
  standard SLO practice (availability, latency, correctness) but is not implemented.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Real health scoring and challenger-model verification for the platform's ~30 backend calculation
engines (`backend/services/*.py`), supporting ops triage and the model-governance evidence trail
(SR 11-7 §V ongoing monitoring) for every number surfaced in disclosures.

### 8.2 Conceptual approach
Three-component health index (the guide's own design, made concrete) plus a golden-dataset shadow
harness — mirroring (1) **SR 11-7 / SS1/23 ongoing-monitoring expectations** (outcome analysis,
benchmarking, sensitivity), and (2) **SRE service-level practice** (success/latency/freshness SLOs
with error budgets, as in Google SRE workbook) adapted to batch quant pipelines.

### 8.3 Mathematical specification

```
Success_e  = successful runs / scheduled runs, trailing 30d (exp-weighted, λ=0.9/wk)
Freshness_e = clip(1 − Age_hrs/SLA_e, 0, 1)          SLA_e per engine (default 26h for daily jobs)
Accuracy_e = pass-weighted golden-set score = Σ_k m_k·1{|y_k − ŷ_k| ≤ τ_k} / Σ_k m_k
Health_e   = 100 × (0.40·Success_e + 0.30·Freshness_e + 0.30·Accuracy_e)
RAG: green ≥ 80, amber 60–80, red < 60 (guide thresholds, adopted)
```

| Parameter | Value | Calibration source |
|---|---|---|
| Tolerances τ_k | PD ±5bp; VaR ±2% rel.; Scope 1/2 ±0.5% (deterministic EF maths); ITR ±0.05 °C; PCAF intensity ±1% | Materiality-based; EBA stress-test QA tolerances as precedent for risk metrics |
| Golden set size | ≥ 20 cases/engine, refreshed quarterly, human-verified | SR 11-7 benchmarking practice |
| Freshness SLA | job cadence + 2h grace | Ops policy, documented per engine |
| Weights 0.40/0.30/0.30 | as guide; sensitivity-reported | Documented model choice |

Alerting: page red when `Health < 60` OR any golden-set failure on a P1 engine; error-budget burn
`(1−Success)/(1−SLO)` for paging decisions. p95 latency computed from actual run records
(`quantile(durations, 0.95)`), never sampled independently.

### 8.4 Data requirements
Structured run logs (engine id, start/end, status, record counts, input/ref-data versions) —
emit from a decorator in each `backend/services` engine to a `engine_runs` table (new migration);
golden datasets stored under version control with expected outputs and tolerance file; scheduler
metadata for expected cadence. All achievable in-platform; no vendor data needed.

### 8.5 Validation & benchmarking plan
Inject synthetic failures (kill a job, stale a table, perturb an EF) and verify RAG transitions;
reconcile Success_e against raw log counts monthly; challenger check: recompute 3 headline metrics
(GHG total, VaR, PCAF WACI) in an independent notebook and compare to engine output within τ;
review tolerance calibration annually against realised revision magnitudes.

### 8.6 Limitations & model risk
Health is a lagging indicator — a passing golden set does not validate new input regimes (mitigate:
input-drift monitors on key distributions); tolerance choices trade sensitivity vs alert fatigue
(track false-positive rate, target <10%); the composite can mask a single critical failure (hence
the P1 golden-set override); engines without schedulable cadence (on-demand) need request-scoped
SLOs instead of freshness.
