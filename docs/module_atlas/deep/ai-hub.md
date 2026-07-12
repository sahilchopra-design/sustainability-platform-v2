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
