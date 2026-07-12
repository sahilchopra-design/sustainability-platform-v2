# AI Sustainability Hub
**Module ID:** `ai-hub` · **Route:** `/ai-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Central hub for all AI-powered sustainability analytics tools. Covers LLM report parsing, ESG data extraction, sentiment analysis, predictive scoring, and model governance.

> **Business value:** AI transforms ESG analytics from manual data collection to automated intelligence. LLMs extract GHG data from PDFs, satellite imagery monitors deforestation, and predictive models anticipate ESG rating changes. This hub is the platform's intelligence layer, enabling continuous monitoring at scale.

**How an analyst works this module:**
- Hub Overview shows all AI tools with usage metrics
- Model Registry lists deployed models with performance and drift status
- Use Case Gallery provides guided workflows for common tasks
- API Access provides developer integration for custom applications
- Governance Dashboard shows EU AI Act compliance status

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCURACY_TREND`, `AGENT_LOG`, `AI_MODULES`, `ALERTS`, `CAT_COLOR`, `CODES`, `COMPANIES`, `CORR_MATRIX`, `DECAY_DATA`, `KpiCard`, `MONTHS`, `ModuleBadge`, `PIPELINES`, `PULSE_CSS`, `Pill`, `RECENT_RUNS`, `SIGNALS`, `SIGNAL_TYPES`, `STATUS_COLOR`, `SeverityBadge`, `THROUGHPUT_24H`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `AI_MODULES` | 10 | `code`, `name`, `route`, `category`, `status`, `lastRun`, `accuracy`, `throughput`, `alertCount`, `modelType`, `trainedOn`, `samples`, `inferenceMs` |
| `ALERTS` | 16 | `module`, `company`, `severity`, `msg`, `time` |
| `DECAY_DATA` | 10 | `name`, `halfLife`, `r2_1m`, `r2_3m`, `r2_6m` |
| `PIPELINES` | 6 | `name`, `steps`, `estimatedTime`, `lastRun`, `runs`, `description` |
| `RECENT_RUNS` | 7 | `pipeline`, `companies`, `artifacts`, `status` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `company` | `COMPANIES[Math.floor(sr(i * 3) * 15)];` |
| `direction` | `sr(i * 7) > 0.5 ? 'up' : 'down';` |
| `value` | `(sr(i * 11) * 40 + 50).toFixed(1);` |
| `confidence` | `(sr(i * 13) * 25 + 70).toFixed(1);` |
| `minsAgo` | `Math.floor(sr(i * 17) * 120);` |
| `actionable` | `sr(i * 19) > 0.6;` |
| `MONTHS` | `['Jan-25','Feb-25','Mar-25','Apr-25','May-25','Jun-25','Jul-25','Aug-25','Sep-25','Oct-25','Nov-25','Dec-25','Jan-26','Feb-26','Mar-26','Apr-26'];` |
| `ACCURACY_TREND` | `MONTHS.map((m, i) => ({` |
| `CODES` | `AI_MODULES.map(m => m.code);` |
| `CORR_MATRIX` | `useMemo ? null : null; // will compute in component` |
| `companyScores` | `useMemo(() => { return COMPANIES.map((name, ci) => { const base = sr(ci * 29) * 40 + 45;` |
| `corrMatrix` | `useMemo(() => { return CODES.map((r, ri) => CODES.map((c, ci) => { if (ri === ci) return 1.0;` |
| `retrainSchedule` | `useMemo(() => AI_MODULES.map(m => {` |
| `daysUntil` | `Math.floor(sr(m.id.length * 7) * 60 + 5);` |
| `driftScore` | `parseFloat((sr(m.id.length * 11) * 0.18 + 0.02).toFixed(3));` |
| `pre` | `parseFloat((45 + sr(i * 7) * 20).toFixed(1));` |
| `post` | `parseFloat((pre + sr(i * 13) * 12 + 3).toFixed(1));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AGENT_LOG`, `AI_MODULES`, `ALERTS`, `COMPANIES`, `DECAY_DATA`, `MONTHS`, `PIPELINES`, `RECENT_RUNS`, `SIGNAL_TYPES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| AI Workstreams | — | Platform | NLP, CV, predictive ML, generative AI |
| Report Parsing Accuracy | — | Benchmark | GHG data extraction from PDF reports |
| Sentiment Coverage | — | News feeds | Real-time ESG news sentiment across media |
- **Unstructured ESG data** → LLM extraction → **Structured ESG metrics**
- **Satellite imagery** → CV analysis → **Physical risk and ESG compliance signals**
- **Structured data** → ML model → **Predictive ESG scores**

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-model AI pipeline
**Headline formula:** `ESG_signal = NLP(text) + CV(satellite) + ML(structured data)`

Four AI workstreams: (1) NLP for report and news extraction, (2) Computer vision for satellite imagery, (3) ML for predictive scoring, (4) Generative AI for disclosure drafting. Model registry tracks all deployed models.

**Standards:** ['OpenAI GPT-4', 'Anthropic Claude', 'Google Vertex AI']
**Reference documents:** EU AI Act (2024); NIST AI Risk Management Framework; Anthropic Constitutional AI; Google Model Cards

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ℹ️ The guide's formula `ESG_signal = NLP(text) + CV(satellite) + ML(structured data)` is a
> conceptual description of the four AI workstreams, not a computed quantity. This module is a
> **model-operations monitoring hub**: it inventories 9 AI sub-modules, streams synthetic
> signals/alerts, and charts throughput, accuracy drift and signal decay. There is no computer-
> vision, no live inference, and no composite-signal computation — the "AI" outputs are seeded.

### 7.1 What the module computes

An MLOps-style dashboard over 9 AI sub-modules (`AI_MODULES`), each a registry row with static
metadata: category (NLP / ML / LLM / Signal), status (active/running/idle), accuracy, throughput,
model type (BERT-finetune, FinBERT, Gradient Boost, Random Forest, LLM/RAG…), training date,
sample count and inference latency (ms). The page aggregates these into portfolio-level activity
views; no scoring formula produces the module accuracies — they are authored constants.

### 7.2 Parameterisation

- **9 modules** with fixed stats, e.g. LLM ESG Extractor (accuracy 93.8%, 1,840 ms latency,
  LLM/RAG), Sentiment Pipeline (82.1%, FinBERT, 145 ms, throughput 88), ML Risk Scorer (91.5%,
  Random Forest).
- **Signal bus (`SIGNALS`, 40)** — PRNG-generated (`sr(s)=frac(sin(s+1)×10⁴)`): each signal binds
  a module × company × signal type with `value = sr·40+50`, `confidence = sr·25+70` (70–95%),
  `direction` up/down, `minsAgo` recency and an `actionable` flag (`sr > 0.6`).
- **Alerts (`ALERTS`, 15)** — hand-authored, realistic MLOps alerts (Shell greenwashing score 87,
  Volkswagen risk +18pts, BP disclosure gaps) with severity critical/high/medium/low.
- **Throughput 24h** — per-hour NLP/ML/LLM/Signal counts with a working-hours bump
  (`sr·30 + (7<h<20 ? 25 : 5)`).
- **Accuracy trend (16 months)** — per-module `82 + sr·10 + i·0.4` (a seeded upward drift, i.e.
  monotone-improving on average by construction).
- **Signal decay (`DECAY_DATA`, 9)** — per-module `halfLife` (days) and predictive R² at 1/3/6
  months, hand-authored: fast-decaying signals (Sentiment Pipeline half-life 7d, R² 0.88→0.11)
  vs durable ones (Greenwashing Detection 90d, 0.73→0.59). This is the module's most substantive
  conceptual content — alpha-signal decay.
- **Agentic pipelines (`PIPELINES`, 5)** — named multi-step workflows (Full Due Diligence,
  Quarterly Monitoring, Regulatory Filing Check…) with step lists, run counts and durations.

### 7.3 Calculation walkthrough

- Registry cards colour by category and status; KPIs count active/running modules, total
  throughput and open alerts.
- The signal feed sorts by recency (`minsAgo`) and can filter to `actionable` signals; a
  monotonic counter `_sc` seeds any newly appended signals so live updates stay deterministic.
- Charts consume the seeded time series directly (throughput area chart, accuracy multi-line,
  decay bars); no transformation beyond the seed generation.

### 7.4 Worked example — a signal record

For signal index i = 5: module = `AI_MODULES[5]` (Sentiment Pipeline, EP-BD2), company =
`COMPANIES[floor(sr(15)·15)]`, `value = sr(55)·40+50`, `confidence = sr(65)·25+70`,
`direction = sr(35) > 0.5 ? up : down`, `actionable = sr(95) > 0.6`. With the fixed PRNG these
resolve to a stable record like *"EP-BD2 · Sentiment Pipeline · Microsoft · Sentiment Shift ·
value 71.3 ↑ · confidence 84.2% · 18m ago · actionable"* — identical on every load.

### 7.5 Data provenance & limitations

- **Synthetic throughout:** module accuracies, signals, throughput, accuracy trends and decay
  parameters are either hand-authored constants or PRNG draws; no model actually runs and no
  company data is ingested.
- Accuracy trends are seeded to drift upward, so the "models improving over time" narrative is
  built in, not measured.
- Alerts are a fixed editorial list, not generated from live detections; the greenwashing/risk
  scores they quote are illustrative.
- The guide's multi-modal `NLP + CV + ML` fusion and generative disclosure drafting are described
  but not implemented on this page (the individual sub-modules it links to may implement pieces).

### 7.6 Framework alignment

- **MLOps / model governance (e.g. Google Model Cards, NIST AI RMF Measure/Manage)** — the hub's
  per-model registry (training date, sample count, accuracy, drift monitoring) mirrors standard
  model-inventory and continuous-monitoring practice; signal-decay tracking corresponds to the
  "monitor for performance degradation" control.
- **Alpha-signal decay (quant research convention)** — half-life and horizon-R² framing follows
  standard signal-research practice (information decays with forecast horizon); values are
  illustrative.
- **FinBERT / BERT / LLM-RAG** — the module types reference real ESG-NLP model families; no
  inference is performed here.
- **Agentic AI workflows** — the 5 pipelines illustrate chained-agent ESG workflows (due
  diligence, monitoring, compliance) consistent with emerging agentic-AI patterns, as a catalogue
  rather than an executable orchestration.

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