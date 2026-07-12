# ESG Narrative Intelligence
**Module ID:** `esg-narrative-intelligence` · **Route:** `/esg-narrative-intelligence` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Applies NLP and large language model analysis to corporate ESG narratives in earnings call transcripts, annual reports, sustainability reports, and regulatory filings to extract quantitative ESG signals. Detects greenwashing language patterns, commitment specificity, sentiment trajectory, and KPI disclosure density. Supports fundamental ESG research, controversy monitoring, and regulatory materiality assessment.

> **Business value:** Transforms qualitative ESG narratives into systematic, comparable signals that complement quantitative rating data â€” enabling analysts to identify greenwashing risks, track commitment follow-through, and detect early-warning signals of ESG quality deterioration or improvement.

**How an analyst works this module:**
- Load corporate filings (PDF, HTML, or transcript) or connect to EDGAR/Refinitiv document feed.
- Run NLP pipeline to extract ESG mentions, commitments, KPIs, and sentiment by pillar and topic.
- Review narrative quality scorecard and greenwashing risk flags; drill into specific text passages triggering high-risk signals.
- Export ESG narrative intelligence report for research note, engagement letter, or regulatory filing review.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COMPANIES`, `COMPANIES_RAW`, `Card`, `CompanySelector`, `CustomTooltip`, `ESG_TERMS`, `MetricCard`, `ProgressBar`, `SectionTitle`, `SeverityBadge`, `SourceBadge`, `StatusBadge`, `TOPICS`, `Tab1`, `Tab2`, `Tab3`, `Tab4`, `Tab5`, `YEARS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TOPICS` | 13 | `label` |
| `COMPANIES_RAW` | 11 | `sector`, `ticker` |
| `WATCHLISTS` | 5 | `sectors` |
| `TABS` | 6 | `short` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `base` | `ci * 100 + yi * 10;` |
| `commitments` | `Array.from({ length: 4 + Math.floor(sr(ci * 31 + 7) * 3) }, (_, i) => {` |
| `sid` | `ci * 50 + i * 7;` |
| `numControversies` | `Math.floor(sr(ci * 17 + 3) * 3.5);` |
| `sentimentArc` | `useMemo(() => YEARS.map(yr => ({` |
| `dna` | `useMemo(() => { const sentiments = YEARS.map(yr => company.yearData[yr].narrativeSentiment);` |
| `diffs` | `sentiments.slice(1).map((v, i) => v - sentiments[i]);` |
| `trend` | `diffs.reduce((a, b) => a + b, 0) / diffs.length;` |
| `variance` | `sentiments.reduce((acc, v) => {` |
| `coherence` | `Math.round(Math.max(0, 100 - variance * 180));` |
| `avgQ` | `YEARS.reduce((a, yr) => a + company.yearData[yr].quantifiedClaimsPct, 0) / YEARS.length;` |
| `controversyYears` | `useMemo(() => company.controversies.map(v => v.year), [company]);` |
| `topTopicByYear` | `useMemo(() => YEARS.map(yr => {` |
| `top` | `Object.entries(tp).sort((a, b) => b[1] - a[1])[0];` |
| `intensity` | `Math.round(val * 200);` |
| `trendData` | `useMemo(() => YEARS.map(yr => {` |
| `driftTable` | `useMemo(() => [ { topic: 'Climate Transition', oldFraming: 'Risk management & compliance lens', newFraming: 'Strategic opportunity & capital allocation lens', shiftYear: 2022, severity: 'Major' }, { topic: 'Net Zero Targets', oldFraming: 'Aspiration with no interim milestones', newFraming: 'Science-based 2030 interim targets with accounta` |
| `radarData` | `useMemo(() => TOPICS.map(t => ({` |
| `delta` | `company.yearData[2024].topicProminence[t.key] - company.yearData[2022].topicProminence[t.key];` |
| `avgAmbition` | `useMemo(() => { const scores = company.commitments.map(c => c.ambitionScore);` |
| `ganttData` | `useMemo(() => company.commitments.map(c => ({` |
| `totalSpan` | `36; // 2019–2055` |
| `leftPct` | `((c.yearSet - 2019) / totalSpan) * 100;` |
| `widthPct` | `(c.span / totalSpan) * 100;` |
| `progressX` | `leftPct + (widthPct * c.progressPct / 100);` |
| `sorted` | `useMemo(() => [...company.controversies].sort((a, b) => a.year - b.year), [company]);` |
| `credibilityData` | `useMemo(() => YEARS.map(yr => {` |
| `impactScore` | `controversiesThisYear.reduce((acc, v) => acc + (v.severity === 'high' ? 0.25 : v.severity === 'medium' ? 0.12 : 0.06), 0);` |
| `firstControversy` | `company.controversies.sort((a, b) => a.year - b.year)[0];` |
| `sentAfter` | `company.yearData[Math.min(firstControversy.year + 1, 2024)]?.narrativeSentiment \|\| 0;` |
| `sentBefore` | `company.yearData[Math.max(firstControversy.year - 1, 2020)]?.narrativeSentiment \|\| 0;` |
| `linguisticData` | `useMemo(() => YEARS.map(yr => ({` |
| `wordCloudTerms` | `useMemo(() => { const base = COMPANIES.findIndex(c => c.ticker === company.ticker) * 1000 + selectedYear * 7;` |
| `maxFreq` | `Math.max(...wordCloudTerms.map(t => t.freq));` |
| `scatterData` | `useMemo(() => COMPANIES.map((c, ci) => ({` |
| `fontSize` | `11 + Math.round((t.freq / maxFreq) * 22);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMMITMENT_TARGETS`, `COMPANIES_RAW`, `CONTROVERSY_EVENTS`, `ESG_TERMS`, `RESPONSES`, `SOURCES`, `TABS`, `TOPICS`, `TOPIC_COLORS`, `WATCHLISTS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Narrative Specificity Score (0â€“100) | — | NLP Engine | Proportion of ESG commitments with concrete targets, timelines, and accountability owners; below 40 flags greenwashing risk. |
| ESG KPI Density (metrics/1k words) | — | Text Parser | Quantitative ESG disclosures per 1,000 words of sustainability text; above 8 indicates disclosure-rich reporting. |
| Sentiment Trajectory (quarter-on-quarter) | — | ESG Lexicon Model | Direction of ESG sentiment change across 8 quarters; sustained decline may precede rating downgrade. |
| Greenwash Risk Flag (1â€“5) | — | Specificity/Sentiment Model | Composite greenwashing risk rating; Level 4â€“5 = high specificity-sentiment divergence (positive language, low targets). |
- **Corporate sustainability reports and annual reports (PDF/HTML)** → OCR and section extraction; classify by GRI/ESRS topic; parse ESG commitment statements → **Commitment inventory with specificity tag and target year**
- **Earnings call transcripts (Refinitiv/Bloomberg)** → Sentence-level ESG topic classification; compute sentiment per pillar per quarter → **Sentiment time series by E/S/G pillar**
- **Prior period ESG disclosures** → Compare current vs. prior commitments; flag contradictions and retractions → **Consistency score and contradiction log**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Narrative Quality Score
**Headline formula:** `NQS = w_s × Specificity + w_c × Consistency + w_q × QuantDensity + w_t × Sentiment`

Composite scoring model applied to parsed text. Specificity measures percentage of ESG commitments with quantified targets and timelines vs. vague aspirational language. Consistency tracks alignment between current and prior period ESG claims (contradiction detection). Quantitative KPI Density counts disclosed numeric ESG metrics per 1,000 words. Sentiment is scored on −1 to +1 scale using a finance-domain ESG sentiment lexicon.

**Standards:** ['GRI Universal Standards 2021', 'EFRAG ESRS Materiality 2023', 'SEC ESG Disclosure Rules 2024']
**Reference documents:** GRI Universal Standards 2021 â€” Disclosure Quality Principles; EFRAG ESRS 1 â€” General Requirements 2023; SEC Climate-Related Disclosure Rules 2024; Loughran & McDonald â€” Textual Analysis in Accounting and Finance (2016); InfluenceMap â€” Corporate Climate Policy Engagement Tracker 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes an **NLP/LLM pipeline** that parses earnings
> calls, 10-Ks and sustainability reports to extract a **Narrative Quality Score**
> `NQS = w_s·Specificity + w_c·Consistency + w_q·QuantDensity + w_t·Sentiment`, with OCR, sentence-
> level topic classification and greenwash detection. **No text is ever processed.** The page
> fabricates per-company, per-year "narrative" metrics (sentiment, quantified-claims %, jargon density,
> topic prominence, commitments, controversies) from the `sr()` PRNG, then runs *genuine derived
> analytics* (coherence, sentiment trend, credibility, drift) on those synthetic inputs. The company
> names are real (TotalEnergies, Unilever, BP…); every number attached is seeded.

### 7.1 What the module computes

The **inputs are synthetic** (`buildCompanies`), but the **derived analytics are real formulas** over
them — this is the module's genuine content:

```js
// synthetic per company (ci) per year (yi), base = ci*100 + yi*10:
narrativeSentiment  = (sr(base+7) − 0.3) × 1.6        // ≈ −0.48 … +1.12  (−1..+1 sentiment)
quantifiedClaimsPct = 0.2 + sr(base+5) × 0.6          // 20–80 %
topicProminence[t]  = 0.2 + sr(base+ti+1) × 0.75      // per-topic 0.2–0.95

// DERIVED (real computation over the synthetic series):
trend      = mean(diff(sentiments))                    // sentiment trajectory
variance   = Σ(s − mean)² / n                          // sentiment dispersion
coherence  = round(max(0, 100 − variance × 180))       // narrative consistency 0–100
avgQ       = mean(quantifiedClaimsPct)                 // KPI density proxy
impactScore= Σ controversy severity{high .25, med .12, low .06}   // credibility drag
```

`coherence` is a legitimate consistency metric (low sentiment variance → high coherence, ×180 scaling
saturates the 0–100 range); `credibilityData` tracks year-on-year controversy impact; `dna` computes a
sentiment trend and coherence "signature".

### 7.2 Parameterisation

| Quantity | Formula | Provenance |
|---|---|---|
| narrativeSentiment | `(sr(·)−0.3)×1.6` | synthetic; −1..+1 lexicon-score shape |
| quantifiedClaimsPct | `0.2 + sr(·)×0.6` | synthetic; 20–80% |
| topicProminence | `0.2 + sr(·)×0.75` | synthetic per 12 topics |
| coherence scaling | `×180` | tuning constant (saturates variance→0..100) |
| credibility severity weights | high .25 / med .12 / low .06 | curated controversy-impact tariff |
| commitments count | `4 + floor(sr(·)×3)` (4–6) | synthetic |
| commitment `progressPct`, `status`, `restatement` | `sr()` draws | synthetic |

The 12 `TOPICS` and 10 companies are curated real labels; `COMMITMENT_TARGETS` are realistic net-zero/
Scope-3/deforestation pledges assigned round-robin.

### 7.3 Calculation walkthrough

1. `buildCompanies` fabricates 5 years of narrative metrics + 4–6 commitments + controversies per
   company from `sr()`.
2. `dna`: sentiment `trend` (mean first-difference) and `coherence` (`100 − variance×180`).
3. `sentimentArc`/`trendData`: sentiment and topic series by year.
4. `credibilityData`: per year, `impactScore` from that year's controversies (severity-weighted).
5. `driftTable`: hard-coded framing-shift narratives (e.g. "Climate Transition: risk-lens → opportunity-lens", 2022, Major).
6. `wordCloudTerms`/`scatterData`: synthetic term frequencies and cross-company sentiment scatter.

### 7.4 Worked example — coherence for a company

Suppose a company's five yearly `narrativeSentiment` values compute to `[0.2, 0.5, 0.1, 0.6, 0.3]`.
Mean = 0.34; deviations² = `[0.0196, 0.0256, 0.0576, 0.0676, 0.0016]`; variance = 0.344/5 = 0.0344.
`coherence = round(max(0, 100 − 0.0344×180)) = round(100 − 6.19) = 94` → highly coherent narrative.
`trend = mean([0.3, −0.4, 0.5, −0.3]) = 0.025` → mildly improving. Both are correct computations, but
the underlying sentiments are `sr()`-drawn, not extracted from any document.

### 7.5 Data provenance & limitations

- **Inputs are synthetic** (`sr(s)=frac(sin(s+1)×10⁴)`); no filing, transcript, OCR, tokeniser, or LLM
  is invoked despite the guide's detailed NLP pipeline.
- **Derived analytics are real** — coherence, sentiment trend, credibility impact, drift — but they
  operate on fabricated signals, so outputs are illustrative of the *method*, not of any company.
- The specificity/greenwash-flag machinery the guide describes (specificity < 40 → greenwash risk) is
  not computed; `quantifiedClaimsPct` is a raw synthetic proxy.
- `driftTable` and controversy narratives are hard-coded editorial content.

**Framework alignment:** the guide cites **GRI**, **EFRAG ESRS materiality**, **SEC climate rules** and
**Loughran-McDonald** textual analysis. Real ESG narrative intelligence uses a finance-domain sentiment
lexicon (Loughran-McDonald extended for ESG), commitment-specificity parsing, and consistency/
contradiction detection across periods; this module models the *outputs* of such a pipeline with
synthetic data and implements only the downstream aggregation maths.

### 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Convert unstructured ESG disclosures (reports, transcripts, filings) into
quantitative signals — specificity, quantitative-KPI density, sentiment trajectory, greenwash risk —
to support fundamental ESG research and controversy monitoring.

**8.2 Conceptual approach.** An NLP pipeline: document ingestion + section classification, commitment
extraction, finance-domain sentiment scoring (Loughran-McDonald-ESG), and a composite NQS — mirroring
academic textual-analysis and vendor ESG-NLP (e.g. RepRisk/Arabesque-style) approaches.

**8.3 Mathematical specification.**
- Specificity: `Sp = quantified_commitments / total_commitments` (has target + timeline + owner).
- Quant density: `QD = numeric_ESG_metrics / (words/1000)`.
- Sentiment: `Se_t = (pos − neg) / total` per period using the ESG lexicon; trajectory = slope of `Se`.
- Consistency: `Co = 1 − contradictions / claims` (period-over-period commitment reversals).
- Composite: `NQS = w_s·Sp + w_c·Co + w_q·min(1, QD/8) + w_t·(Se+1)/2`.
- Greenwash flag: high when `Se` high but `Sp` low (positive language, few concrete targets), e.g.
  flag∈{1..5} from `(1−Sp)·(Se>0.3)`.

| Parameter | Source |
|---|---|
| Sentiment lexicon | Loughran-McDonald + ESG extension |
| Weights w_s/w_c/w_q/w_t | tuned to expert greenwash labels |
| QD saturation (8/1k words) | guide's disclosure-rich threshold |
| Topic taxonomy | GRI/ESRS topic list (12 TOPICS map here) |

**8.4 Data requirements.** Corporate filings/transcripts (EDGAR, company IR, Refinitiv), an ESG
sentiment lexicon, prior-period commitment inventory. None present; module holds only synthetic
metrics.

**8.5 Validation & benchmarking plan.** Correlate NQS/greenwash flags against realised controversies
and rating downgrades; inter-annotator agreement on specificity labels; benchmark sentiment against a
human-scored sample.

**8.6 Limitations & model risk.** Sentiment lexicons are domain-fragile; specificity parsing misses
implicit commitments; LLM extraction can hallucinate; greenwash flag depends on the Se-vs-Sp threshold
calibration.

## 9 · Future Evolution

### 9.1 Evolution A — Run the NLP pipeline on real filings instead of curating its outputs (analytics ladder: rung 1 → 2)

**What.** The page is a rich, well-designed narrative-analytics workspace — sentiment arcs, commitment Gantt charts, topic-prominence radars, framing-drift tables, credibility-vs-controversy overlays — whose underlying "NLP outputs" are seeded or curated: per-company year data, commitments (`4 + floor(sr·3)` per company), controversy counts, and word-cloud frequencies are all generated; the drift table is hand-authored. The derived analytics on top (trend, variance→coherence, credibility impact scoring) are real arithmetic over fabricated extractions. Evolution A supplies genuine extractions from genuine documents.

**How.** (1) Document ingestion shared with the platform's text stack: `esg-report-parser` for reports, EDGAR full-text for filings — chunked and stored per the pgvector D3 pattern. (2) Extraction engine: commitment statements (target, year, owner, specificity tag), quantified-claims density, and pillar sentiment per document — Claude-based extraction with stored quotes and confidence, or FinBERT for sentiment where volume dictates (cost benchmark decides; either way outputs persist to `narrative_extractions` with verbatim evidence spans). (3) The page's existing derived analytics then operate unchanged on real extractions — the module's genuine asset is that its downstream math is already built. (4) The NQS composite (`w_s·Specificity + w_c·Consistency + w_q·QuantDensity + w_t·Sentiment`) computes from measured components; greenwash flags (positive sentiment × low specificity divergence) become traceable to specific passages, which is what makes them defensible.

**Prerequisites.** Document licensing for transcripts (EDGAR is free; earnings transcripts aren't); extraction quality baseline (hand-label 100 commitments; measure precision before shipping flags). **Acceptance:** every commitment row on the Gantt links to a verbatim source passage; sentiment arcs recompute when a new filing lands; zero `sr()` in company data; greenwash flags cite their triggering text.

### 9.2 Evolution B — Passage-grounded greenwashing reviewer (LLM tier 2)

**What.** This module *is* the platform's LLM-native use case — the §5 methodology describes what an LLM does natively. Evolution B is the interactive layer: an analyst asks "why is this company flagged level 4 greenwash risk?" and the reviewer answers with the specific passages driving the specificity-sentiment divergence ("net-zero ambition stated 14 times; zero interim targets; the 2022 'strategic opportunity' reframing coincided with the controversy"), runs comparison queries ("show me how their water-risk language changed 2021→2024"), and drafts the engagement letter citing exact quotes — the workflow the overview promises.

**How.** Tools: `get_extractions(company, year)`, `search_passages(company, topic, years)` (vector search over the ingested corpus), `get_nqs_decomposition(company)`, `compare_framing(company, topic, y1, y2)`. The grounding discipline is verbatim-quote-or-silence: every characterization of a company's language must include the retrieved passage; the validator checks quotes against stored spans (mis-quoting a company in an engagement letter is a reputational own-goal). NQS scores and flags come only from Evolution A's computed components.

**Prerequisites (hard).** Evolution A's real extractions — reviewing seeded narratives would attribute invented language patterns to real tickers, the precise defamation-adjacent risk of this module family. **Acceptance:** every quote in a golden review resolves to a stored span; flag explanations cite the computed divergence components; a company without ingested documents returns "no corpus" rather than an impression.