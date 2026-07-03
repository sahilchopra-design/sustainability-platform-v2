# AI Sustainability Hub
**Module ID:** `ai-hub` · **Route:** `/ai-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Central hub for all AI-powered sustainability analytics tools. Covers LLM report parsing, ESG data extraction, sentiment analysis, predictive scoring, and model governance.

> **Business value:** AI transforms ESG analytics from manual data collection to automated intelligence. LLMs extract GHG data from PDFs, satellite imagery monitors deforestation, and predictive models anticipate ESG rating changes. This hub is the platform's intelligence layer, enabling continuous monitoring at scale.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCURACY_TREND`, `AGENT_LOG`, `AI_MODULES`, `ALERTS`, `CAT_COLOR`, `CODES`, `COMPANIES`, `CORR_MATRIX`, `DECAY_DATA`, `KpiCard`, `MONTHS`, `ModuleBadge`, `PIPELINES`, `PULSE_CSS`, `Pill`, `RECENT_RUNS`, `SIGNALS`, `SIGNAL_TYPES`, `STATUS_COLOR`, `SeverityBadge`, `THROUGHPUT_24H`

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
| `base` | `sr(ci * 29) * 40 + 45;` |
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
**Standards:** ['OpenAI GPT-4', 'Anthropic Claude', 'Google Vertex AI']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).