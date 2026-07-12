# Calculation Engine Monitor
**Module ID:** `calculation-engine-monitor` · **Route:** `/calculation-engine-monitor` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Real-time monitoring dashboard for all platform calculation pipelines covering GHG inventory, temperature scoring, PCAF attribution, CRREM pathways, and stress testing engines. Tracks pipeline run status, calculation accuracy KPIs, data freshness, and error rates. Provides operators with a centralised view of engine health and performance SLAs.

> **Business value:** Calculation engine monitoring prevents silent failures where pipeline crashes or stale data cause incorrect values to appear in disclosures without triggering visible errors. Centralised health scoring with SLA tracking gives data operations teams the visibility to prioritise remediation, maintain disclosure data quality, and evidence governance controls to assurance providers.

**How an analyst works this module:**
- Dashboard shows all 18 engines with live health score and RAG status
- Engine Detail tab drills into run history, success rate, and error log
- Data Freshness tab shows last-run timestamp vs SLA threshold per engine
- Accuracy KPIs tab tracks spot-check deltas against reference benchmarks
- Alert Configuration sets thresholds and routes notifications to ops team
- SLA Report generates monthly engine performance summary

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_ENGINES`, `CORE_ENGINES`, `ENGINE_CONFIGS`, `EXEC_HISTORY`, `MONTHS`, `PIE_COLORS`, `SECONDARY_ENGINES`, `SHADOW_TESTS`, `STATUSES`, `STATUS_COLORS`, `TABS`, `TRIGGERS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CORE_ENGINES` | 11 | `id`, `name`, `desc`, `category`, `inputs`, `outputs`, `depIds` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pick` | `(arr,s)=>arr[Math.floor(sr(s)*arr.length)];` |
| `rng` | `(min,max,s)=>min+sr(s)*(max-min);` |
| `rngI` | `(min,max,s)=>Math.floor(rng(min,max,s));` |
| `ALL_ENGINES` | `[...CORE_ENGINES, ...SECONDARY_ENGINES].map((e,i)=>({` |
| `status` | `sr(i*201) > 0.92 ? 'error' : sr(i*203) > 0.04 ? 'success' : 'warning';` |
| `dur` | `rngI(100, 60000, i*207);` |
| `inCount` | `rngI(10, 50000, i*211);` |
| `ENGINE_CONFIGS` | `ALL_ENGINES.slice(0,10).map((eng,i)=>({` |
| `fmtDate` | `(iso) => new Date(iso).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});` |
| `fmtK` | `(v) => v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':String(v);` |
| `engineStats` | `useMemo(()=>({ total:ALL_ENGINES.length, running:ALL_ENGINES.filter(e=>e.status==='running').length + Object.keys(runningEngines).length, errors:ALL_ENGINES.filter(e=>e.status==='error').length, avgSuccess:(ALL_ENGINES.reduce((s,e)=>s+e.successRate,0)/ALL_ENGINES.length).toFixed(1), }),[runningEngines]);` |
| `execTimeTrend` | `useMemo(()=>{ return MONTHS.map((m,mi)=>({ month:m, avgDuration:rngI(500,8000,mi*501), p95Duration:rngI(8000,30000,mi*503), execCount:rngI(50,200,mi*505), }));` |
| `errorRateData` | `useMemo(()=>{ return ALL_ENGINES.slice(0,15).map(e=>({ name:e.name.length>16?e.name.slice(0,16)+'...':e.name, errorRate:100-e.successRate, })).sort((a,b)=>b.errorRate-a.errorRate);` |
| `shadowTrend` | `useMemo(()=>{ return MONTHS.map((m,mi)=>({ month:m, accuracy: 90 + sr(mi*601)*8 + mi*0.2, tests:rngI(20,60,mi*603), }));` |
| `next` | `ALL_ENGINES.filter(e=>!placed.has(e.id)&&e.depIds.every(d=>placed.has(d))).map(e=>e.id);` |
| `remaining` | `ALL_ENGINES.filter(e=>!placed.has(e.id)).map(e=>e.id);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_ENGINES`, `CORE_ENGINES`, `MONTHS`, `PIE_COLORS`, `STATUSES`, `TABS`, `TRIGGERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Engine Count Monitored | — | Platform | Total calculation engines tracked: GHG, PCAF, CRREM, ITR, stress test, and 13 others |
| Overall Pipeline Health | `Composite of success, freshness, accuracy` | Monitor | Aggregate health score; green ≥80, amber 60–80, red <60 |
| SLA Breach Rate (24h) | — | Scheduler | Percentage of scheduled engine runs missing their SLA in the last 24 hours |
- **Calculation engine run logs and result outputs** → Aggregate success rates, latency, and freshness; compute composite health score → **Engine health dashboard with RAG status, SLA breach flags, and error summaries**
- **Reference calculation benchmarks** → Run spot-check calculations; compare against engine output; compute accuracy delta → **Accuracy score per engine with anomaly alerts for significant deviations**

## 5 · Intermediate Transformation Logic
**Methodology:** Pipeline health composite scoring
**Headline formula:** `Engine_health = 0.40×Success_rate + 0.30×Freshness_score + 0.30×Accuracy_score; Freshness_score = 1 – (Age_hrs / SLA_hrs)`

Each calculation engine reports success rate (completed runs / scheduled runs), data freshness (hours since last successful run vs SLA threshold), and accuracy score (spot-check results against reference dataset). Composite health score below 80 triggers orange alert; below 60 triggers red.

**Standards:** ['ISO 9001 Process Monitoring', 'GHG Protocol Data Quality', 'PCAF DQ Scale']
**Reference documents:** ISO 9001:2015 Process Performance Monitoring; GHG Protocol Data Quality Management; PCAF Data Quality Assurance Guidance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Connect the console to the real engine registry and lineage harness (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide describes a composite `Engine_health = 0.40×Success + 0.30×Freshness + 0.30×Accuracy` with SLA logic and threshold alerting over "18 engines", but **none of it exists** — the page monitors 30 hard-coded engine definitions whose statuses, success rates, run history, and shadow-test pass/fail are all seeded random draws (shadow tests compare two independent random numbers, so pass/fail carries no information). Its one genuine asset is the **dependency DAG**: engines declare real `depIds` and the page does a correct topological placement. This module *should* be the real engine-health monitor the platform needs — and the substrate now exists.

**How.** (1) Feed the console from the planned engine registry (roadmap §3: name → version → schema → bench status, generated from the AST scan powering ENGINE_CATALOG) so the 30 hand-written definitions become the real inventory. (2) Real run status and freshness from the audit tables and the lineage harness (`lineage_output/` traces already record per-endpoint pass/fail/provenance across 292 domains) — the harness *is* the accuracy/health signal, currently ignored. (3) Real shadow tests = bench_quant results: the 12/297 pinned engines' pass/fail replaces the random comparison, and the accuracy delta is the bench deviation. (4) Implement the documented composite health score and SLA logic on these real signals. (5) Rung 3: the accuracy score becomes bench-calibrated, and the DAG (already real) drives blast-radius-aware alerting.

**Prerequisites.** The engine registry (platform work); a scheduled harness/bench run feeding a results table; retire all seeded draws. **Acceptance:** an engine that fails bench_quant shows red on the dashboard; freshness reflects real last-run timestamps from audit logs; the health composite is computed per the documented formula, not seeded; no PRNG remains (guardrail passes).

### 9.2 Evolution B — Ops-health copilot for the data-operations desk (LLM tier 2)

**What.** Once wired to real signals, the console answers operational questions: "which engines breached SLA in the last 24h?", "what's the blast radius if the GHG calculator is failing?" (traversing the real dependency DAG to the 60+ downstream modules), "why did PCAF attribution fail this run?" (from the harness trace and audit error log) — every status, timestamp, and dependency from tool output.

**How.** Read-only tool schemas over the Evolution-A registry/harness/audit routes; grounding corpus is this Atlas record plus the real engine registry and the Atlas interconnection graph (the DAG plus blast-radius edges) so dependency-impact answers are graph-computed, not guessed. This module is a natural feeder for the Tier-3 desk orchestrator's reliability view. The copilot's honest duty: it reports engine health from real run signals and, for engines without bench coverage, states that accuracy is unmonitored rather than implying a green accuracy score.

**Prerequisites (hard).** Evolution A — a copilot narrating seeded statuses would fabricate operational health, and false "all green" reporting on a monitoring tool is the exact silent-failure risk the module exists to prevent. **Acceptance:** every status, SLA breach, and dependency in an answer traces to a registry/harness/audit response; blast-radius answers match the real DAG; engines lacking bench coverage are reported as accuracy-unmonitored.