# DME NLP Engine
**Module ID:** `dme-nlp-engine` · **Route:** `/dme-nlp-engine` · **Tier:** A (backend vertical) · **EP code:** EP-U10 · **Sprint:** U-extended

## 1 · Overview
Dynamic Materiality Engine NLP pipeline for named entity recognition of ESG topics in corporate disclosures, real-time sentiment scoring, controversy detection, and greenwashing flag scoring. Integrates spaCy NER, FinBERT sentiment classification, and GDELT news feed for media-disclosure divergence analysis.

> **Business value:** Used by ESG analysts, compliance teams, and fund managers to automate controversy screening and verify consistency between corporate claims and external media evidence.

**How an analyst works this module:**
- Connect corporate disclosure corpus (PDFs, XML) and GDELT live feed
- Run NER pipeline to extract ESG entity mentions and events
- Review sentiment divergence dashboard and greenwashing flag scores
- Export controversy report and remediation recommendations

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `CHART_TOOLTIP_STYLE`, `CONTROVERSY_EVENTS`, `Card`, `DECAY_CURVE_HOURS`, `DEMO_REF_EVENT_TYPES`, `DEMO_REF_SOURCE_TIERS`, `DME_NLP_PULSE_API`, `DOCUMENTS`, `DOC_TYPES`, `GREENWASH_DIMS`, `ISSUER_NAMES`, `KpiCard`, `LiveBadge`, `NER_TYPES`, `Pill`, `QUALITY_DIMS`, `REGULATORY_REQS`, `SECTORS`, `SENTIMENT_ASPECTS`, `ScoreBar`, `SectionTitle`, `TFIDF_TERMS`, `TOPICS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TOPICS` | 21 | `name`, `cat`, `esrs`, `ifrs`, `gri` |
| `SENTIMENT_ASPECTS` | 9 | `aspect`, `pos`, `neg` |
| `QUALITY_DIMS` | 11 | `weight` |
| `DEMO_REF_EVENT_TYPES` | 6 | `half_life_hours` |
| `DEMO_REF_SOURCE_TIERS` | 5 | `name`, `credibility` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `DME_NLP_PULSE_API` | ``${API}/api/v1/dme-nlp-pulse`;` |
| `fmtPct` | `(v, d = 1) => (v * 100).toFixed(d) + '%';` |
| `fmtNum` | `(v) => v >= 1000 ? (v / 1000).toFixed(1) + 'K' : v.toString();` |
| `topicMatrix` | `useMemo( () => DOCUMENTS.map((_, di) => TOPICS.map((_, ti) => parseFloat((0.1 + sr(di * 20 + ti) * 0.85).toFixed(3)))), [], );` |
| `embeddings` | `useMemo( () => DOCUMENTS.map((_, di) => Array.from({ length: 50 }, (_, k) => sr(di * 51 + k) * 2 - 1)), [], );` |
| `simMatrix` | `useMemo(() => { const dot  = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);` |
| `norm` | `(a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0)) \|\| 1;` |
| `clusters` | `useMemo(() => DOCUMENTS.map((_, i) => Math.floor(sr(i * 7) * 5)), []);` |
| `gwMatrix` | `useMemo( () => DOCUMENTS.map((_, di) => GREENWASH_DIMS.map((_, gi) => parseFloat((sr(di * 6 + gi) * 0.9).toFixed(3)))), [], );` |
| `qualMatrix` | `useMemo( () => DOCUMENTS.map((_, di) => QUALITY_DIMS.map((_, qi) => parseFloat((0.2 + sr(di * 11 + qi) * 0.78).toFixed(3)))), [], );` |
| `nerMatrix` | `useMemo( () => DOCUMENTS.map((_, di) => NER_TYPES.map((_, ni) => 2 + Math.floor(sr(di * 7 + ni) * 18))), [], );` |
| `aspectSentiment` | `useMemo( () => SENTIMENT_ASPECTS.map((_, ai) => DOCUMENTS.map((_, di) => parseFloat((sr(di * 9 + ai) * 1.4 - 0.4).toFixed(3)))), [], );` |
| `temporalData` | `useMemo( () => Array.from({ length: 24 }, (_, q) => ({ quarter: `Q${(q % 4) + 1}'${21 + Math.floor(q / 4)}`, ...Object.fromEntries(TEMP_TOPICS.map((t, ti) => [ t.name.split(' ')[0], parseFloat((0.2 + sr(q * 6 + ti) * 0.7).toFixed(3)), ])), })),` |
| `regCoverage` | `useMemo( () => Object.fromEntries( Object.entries(REGULATORY_REQS).map(([fw, reqs]) => [ fw, reqs.map((_, ri) => parseFloat((0.3 + sr(hashStr(fw) + ri) * 0.65).toFixed(2))), ]) ), [],` |
| `velocity` | `useMemo( () => TEMP_TOPICS.map((t, ti) => { const key = t.name.split(' ')[0];` |
| `curve` | `await Promise.all(DECAY_CURVE_HOURS.map(async (hrs) => {` |
| `demoPulse` | `useMemo(() => { const s = doc.sentiment * 100;` |
| `info` | `doc.word_count / 1000;` |
| `raw` | `s * Math.log(1 + info);` |
| `marketing` | `Math.max(0, doc.sentiment) * 100;` |
| `operational` | `doc.quality * 100;` |
| `gap` | `Math.max(0, marketing - operational);` |
| `gdf` | `Math.max(0, 1 - 0.5 * gap / 100);` |
| `cred` | `[0.95, 0.70, 0.40, 0.15][tierFromQuality(doc.quality) - 1];` |
| `demoDecayCurve` | `useMemo(() => { const lam = Math.log(2) / (4320 / 24);` |
| `topicsExtracted` | `TOPICS.length * filteredDocs.length;` |
| `entCoverage` | `parseFloat((65 + sr(42) * 25).toFixed(1));` |
| `riskSignals` | `3 + Math.floor(sr(99) * 12);` |
| `topicAvg` | `TOPICS.map((t, ti) => ({` |
| `sortedTopics` | `[...topicAvg].sort((a, b) => b.salience - a.salience);` |
| `sentBins` | `[-0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1.0];` |
| `sentHist` | `sentBins.slice(0, -1).map((lo, i) => ({` |
| `flagged` | `[...filteredDocs].sort((a, b) => b.gw_score - a.gw_score).slice(0, 5);` |
| `nerTotals` | `NER_TYPES.map((n, ni) => ({` |
| `coocMatrix` | `TOPICS10.map((_, ai) =>` |
| `docTopicSummary` | `DOCUMENTS.slice(0, 8).map((d, di) => ({` |
| `perDoc` | `filteredDocs.map(d => ({` |
| `aspectAvg` | `SENTIMENT_ASPECTS.map((a, ai) => ({` |
| `sectorSent` | `SECTORS.map(sec => {` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/dme-nlp-pulse/process-signal` | `process_signal` | api/v1/routes/dme_nlp_pulse.py |
| POST | `/api/v1/dme-nlp-pulse/process-batch` | `process_batch` | api/v1/routes/dme_nlp_pulse.py |
| POST | `/api/v1/dme-nlp-pulse/apply-decay` | `apply_decay` | api/v1/routes/dme_nlp_pulse.py |
| GET | `/api/v1/dme-nlp-pulse/ref/event-types` | `get_event_types` | api/v1/routes/dme_nlp_pulse.py |
| GET | `/api/v1/dme-nlp-pulse/ref/source-tiers` | `get_source_tiers` | api/v1/routes/dme_nlp_pulse.py |

### 2.3 Engine `dme_nlp_pulse_engine` (services/dme_nlp_pulse_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `NLPPulseEngine.pulse_score` | sentiment, information_density | P(t) = S(t) × ln(1 + I(t)) |
| `NLPPulseEngine.greenwashing_discount` | pulse, s_marketing, s_operational, kappa | GDF = max(0, 1 - κ × max(0, S_marketing - S_operational) / 100) Returns (discounted_pulse, gdf). Applied ONLY to positive self-reported signals. |
| `NLPPulseEngine.decay_lambda` | event_type | λ = ln(2) / (half_life_hours / 24) |
| `NLPPulseEngine.apply_decay` | initial_value, event_type, elapsed_hours | S(t) = S₀ × exp(−λ × t_days) |
| `NLPPulseEngine.source_credibility` | tier |  |
| `NLPPulseEngine.process_signal` | req | Full pipeline for one sentiment signal. |
| `NLPPulseEngine.process_batch` | req | Process batch of signals and compute aggregate pulse. |
| `NLPPulseEngine.get_reference_data` |  | Return reference tables for event types, source tiers, decay rates. |

**Engine `dme_nlp_pulse_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `DECAY_HALF_LIVES_HOURS` | `{EventType.BREAKING_NEWS: 12.0, EventType.REGULATORY_ENFORCEMENT: 168.0, EventType.INVESTIGATIVE_JOURNALISM: 336.0, EventType.INDUSTRY_POLICY_SHIFT: 2160.0, EventType.CORPORATE_DISCLOSURE: 4320.0}` |
| `SOURCE_CREDIBILITY` | `{SourceTier.TIER1_INSTITUTIONAL: 0.95, SourceTier.TIER2_SPECIALIST: 0.7, SourceTier.TIER3_BROAD_MEDIA: 0.4, SourceTier.TIER4_SOCIAL: 0.15}` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `fastapi` *(shared)*, `services` *(shared)*
**Frontend seed datasets:** `CLUST_COLORS`, `DECAY_CURVE_HOURS`, `DEMO_REF_EVENT_TYPES`, `DEMO_REF_SOURCE_TIERS`, `DOC_TYPES`, `GREENWASH_DIMS`, `ISSUER_NAMES`, `NER_TYPES`, `QUALITY_DIMS`, `SECTORS`, `SENTIMENT_ASPECTS`, `TABS`, `TFIDF_TERMS`, `TOPICS`, `TOPIC_COLORS6`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Sentiment Divergence Score | `disclosure_sentiment − media_sentiment` | FinBERT + GDELT | Positive divergence means company claims more positively than media; >0.3 triggers greenwashing flag review. |
| Greenwashing Flag Score | `w1·commit_gap + w2·sentiment_divergence + w3·controversy_intensity` | Composite NLP pipeline | Scores >70 indicate high greenwashing risk requiring disclosure review; used in ESG controversy screening. |
| Controversy Event Count | `COUNT(GDELT events | company_entity AND ESG_topic)` | GDELT 2.0 GKG | Higher event counts (>5 per quarter) signal media-narrative misalignment with published disclosures. |
- **Corporate sustainability reports + GDELT news stream** → spaCy NER → FinBERT sentiment → divergence score → greenwashing flag → **Per-topic sentiment divergence and greenwashing risk score**

## 5 · Intermediate Transformation Logic
**Methodology:** FinBERT Sentiment + NER Controversy Detection
**Headline formula:** `greenwashing_score = w1·commit_gap + w2·sentiment_divergence + w3·controversy_intensity`

spaCy NER identifies ESG entity mentions (companies, places, initiatives) and routes them to FinBERT for domain-specific financial sentiment scoring. Sentiment divergence is computed as the signed difference between corporate disclosure tone and media/NGO coverage tone for the same topic. Controversy intensity uses GDELT GoldsteinScale and QuadClass for event severity weighting.

**Standards:** ['FinBERT (Araci 2019)', 'GDELT 2.0 Global Knowledge Graph', 'GRI 2-23 Commitment Integrity']
**Reference documents:** FinBERT: Financial Sentiment Analysis with BERT (Araci 2019); GDELT 2.0 GKG Documentation; GRI Standard 2-23: Commitments and Obligations

**Engine `dme_nlp_pulse_engine` — extracted transformation lines:**
```python
GDF = max(0, 1 - κ × max(0, S_marketing - S_operational) / 100)
gap = max(0.0, s_marketing - s_operational)
gdf = max(0.0, 1.0 - kappa * gap / 100.0)
now = sorted_signals[-1].timestamp if sorted_signals else datetime.utcnow()
elapsed = (now - sig.timestamp).total_seconds() / 3600.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The DME NLP Engine has a **genuine, well-specified backend** (`dme_nlp_pulse_engine.py`) implementing a
sentiment "pulse score" with greenwashing discounting, event-type decay and source-credibility
weighting. The **frontend page renders 30 `sr()`-seeded synthetic documents** (sentiment, quality,
greenwashing, readability metrics) and does not, in its headline tiles, call the engine — so this is a
**partial mismatch**: real model in the engine, synthetic display on the page.

### 7.1 What the backend engine computes (the real model)

```
Pulse score      P(t) = S(t) · ln(1 + I(t))                    S=sentiment [−100,100], I=info density
Greenwashing GDF = max(0, 1 − κ · max(0, S_marketing − S_operational)/100)     (κ default 0.5)
                   applied ONLY to positive, self-reported signals → pulse·GDF
Decay λ          = ln2 / (half_life_hours / 24)   (per day)
Decayed value    S(t) = S₀ · exp(−λ · elapsed_hours/24)
Credibility-adj  pulse = pulse_discounted · source_credibility(tier)
Aggregate        Σ decayed credibility-adjusted pulses over the signal batch (credibility-weighted)
```

The pipeline (`process_signal`) chains: raw pulse → greenwashing discount → decay parameters →
credibility multiplier → `credibility_adjusted_pulse`. `process_batch` time-decays each signal to the
latest timestamp and sums to an `aggregate_pulse`, also reporting positive/negative counts and mean
credibility.

### 7.2 Parameterisation / scoring rubric (engine constants)

**Decay half-lives by event type** — the key calibration table:

| Event type | Half-life | Rationale |
|---|---|---|
| Breaking news | 12 h | fast-fading spike |
| Regulatory enforcement | 168 h (7 d) | persists a week |
| Investigative journalism | 336 h (14 d) | two-week attention |
| Industry policy shift | 2 160 h (90 d) | quarter-long relevance |
| Corporate disclosure | 4 320 h (180 d) | half-year shelf life |

**Source credibility by tier:**

| Tier | Example sources | Credibility |
|---|---|---|
| 1 Institutional | Bloomberg, Reuters, SEC | 0.95 |
| 2 Specialist | FT, NGO, IEEE | 0.70 |
| 3 Broad media | general news | 0.40 |
| 4 Social | Twitter, Reddit, Glassdoor | 0.15 |

| Parameter | Value | Provenance |
|---|---|---|
| Greenwashing κ | 0.5 (0–1) | `NLPPulseConfig` default — heuristic |
| EMA α | 0.25 | aggregation smoothing |
| Fallback credibility | 0.5 | unknown tier |

Half-lives and credibility weights are **plausible expert priors** (no cited dataset) but internally
coherent: authoritative, slow-decaying signals dominate the aggregate.

### 7.3 Frontend display (synthetic)

30 documents (`DOCUMENTS`) with **`sr()`-seeded** fields: `sentiment` (−0.4…+1.0), `quality` (0.4–0.95),
`gw_score` greenwashing (0–0.85), and readability metrics `fk_grade` (Flesch-Kincaid 8–16), `fog`
(Gunning Fog 10–20), `sentence_len`, `passive_pct`. Seed schemas `TOPICS` (21), `SENTIMENT_ASPECTS` (9),
`QUALITY_DIMS` (11) drive topic/aspect/quality panels. These are illustrative and do not exercise the
engine's pulse/decay/credibility maths.

### 7.4 Worked example (engine)

Signal: `S = 60`, `I = 20` (info density), `event_type = investigative_journalism` (half-life 336 h),
`source_tier = 2` (cred 0.70), self-reported=false, elapsed = 168 h.

| Step | Computation | Result |
|---|---|---|
| Raw pulse | 60 · ln(1+20) = 60 · 3.0445 | 182.67 |
| Greenwashing | not self-reported → GDF=1 | 182.67 |
| Decay λ/day | ln2 / (336/24) = 0.6931/14 | 0.0495 |
| Decayed (168h=7d) | 182.67 · exp(−0.0495·7) = 182.67·0.7072 | 129.2 |
| Credibility-adj | 129.2 · 0.70 | **90.4** |

A Tier-4 social signal (cred 0.15) with the same raw pulse would contribute only 19.4 — the credibility
tiering is what suppresses low-quality chatter in the aggregate.

### 7.5 Data provenance & limitations

- **Frontend documents are synthetic**, seeded by `sr(seed)=frac(sin(seed+1)×10⁴)`; no real NLP runs in
  the browser (sentiment/greenwashing/readability are drawn, not measured).
- **Engine is real maths but with expert-prior constants** — the half-life table and credibility weights
  are asserted, not empirically fit; κ=0.5 greenwashing discount is a policy choice.
- No actual text ingestion or sentiment model sits behind the engine here; it expects `sentiment_score`
  and `information_density` as *inputs*, so a real NLP front-end (transformer sentiment + entity
  linking) would need to feed it.

**Framework alignment:** the pulse score `S·ln(1+I)` mirrors information-weighted sentiment indices
(RavenPack / Truvalue Labs SASB-tagged sentiment, Bloomberg news sentiment). Exponential **event decay**
with type-specific half-lives is standard signal-decay practice; **source-credibility tiering** echoes
media-reliability weighting; the **greenwashing discount** operationalises the SASB/TCFD concern that
self-reported "say" can diverge from "do" (marketing minus operational sentiment gap).

---

## 8 · Model Specification

**Status: specification — not yet implemented in code (real NLP front-end).**

### 8.1 Purpose & scope
An end-to-end NLP materiality-signal system: ingest disclosures/news/social text, produce entity-level
sentiment, information density, greenwashing and readability, then feed the existing pulse engine.
Scope: all covered issuers, all ESG topics.

### 8.2 Conceptual approach
Transformer-based **aspect sentiment + ESG topic classification** (ESG-BERT / FinBERT), **claim-evidence
matching** for greenwashing (marketing claim vs operational KPI), and **readability/obfuscation**
metrics — feeding the pulse/decay/credibility aggregator already built. Benchmarks: Truvalue Labs
(SASB-tagged NLP), RavenPack event sentiment, ClimateBERT greenwashing detection.

### 8.3 Mathematical specification
```
Per document d, topic t: sentiment S_{d,t} ∈ [−100,100] from fine-tuned classifier
Info density I_d = novel_ESG_facts / sentences  (or entity-normalised claim count)
Greenwashing gap = S_marketing(d) − S_operational(d)  (aspect-level marketing vs KPI-backed)
Then engine: P = S·ln(1+I); GDF; decay by event half-life; ×credibility; aggregate EMA_α
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Sentiment model | — | FinBERT/ESG-BERT fine-tuned on labelled ESG text |
| Half-lives | — | empirical attention-decay study (news half-life literature) |
| Credibility weights | — | source-reliability audit (Ad Fontes / NewsGuard-style) |
| κ greenwashing | 0.5 | tune vs labelled greenwashing cases (ClimateBERT) |

### 8.4 Data requirements
Text corpus (filings, news, transcripts, social) with source and timestamp; labelled sentiment and
greenwashing sets for fine-tuning; entity linking. Free: SEC EDGAR, CDP; vendor: RavenPack, Truvalue.
Platform holds document metadata schema and the engine endpoints.

### 8.5 Validation & benchmarking plan
Sentiment F1 vs labelled ESG sentiment; greenwashing precision/recall vs known cases; correlate
aggregate pulse with subsequent price/controversy events; calibrate half-lives against observed
attention decay; reconcile against a vendor sentiment index.

### 8.6 Limitations & model risk
NLP sentiment is domain-sensitive and can misread hedged disclosure language; greenwashing detection has
high false-positive risk. Conservative fallback: down-weight low-confidence classifications and never let
Tier-4 social signals alone move a materiality flag.

## 9 · Future Evolution

### 9.1 Evolution A — Feed the pulse engine real signals and calibrate its decay (analytics ladder: rung 2 → 3)

**What.** The backend is real and elegantly specified: `NLPPulseEngine` computes `P(t) = S(t)·ln(1+I(t))`, a greenwashing discount `GDF = max(0, 1 − κ·max(0, S_mkt − S_ops)/100)` applied only to positive self-reported signals, event-type exponential decay (half-lives 12h breaking news → 4320h corporate disclosure), and tiered source credibility (0.95→0.15). But nothing real flows through it: the frontend's document matrices, embeddings, NER counts, and sentiment aspects are all `sr()`-seeded, and the promised spaCy/FinBERT/GDELT integrations don't exist. Evolution A builds the signal supply chain and calibrates the engine's constants.

**How.** (1) A GDELT 2.0 GKG ingester (free, keyless — fits the platform's ingestion framework) filtered to the company master's entities, posting real signals to `POST /process-batch`; persisted `nlp_signals` table so decay is applied to actual timestamps via `POST /apply-decay`. (2) Sentiment: FinBERT batch scoring server-side (or Claude-scored with cached results — decide by cost benchmark) replacing seeded `aspectSentiment`. (3) Calibration to earn rung 3: fit the five `DECAY_HALF_LIVES_HOURS` against observed GDELT coverage decay for a sample of named controversies, and validate `SOURCE_CREDIBILITY` tiers against subsequent-confirmation rates; publish fit statistics in `ref/event-types`.

**Prerequisites.** GDELT entity-matching quality gate (name collisions poison signals — resolve via `entity_lei` aliases); the frontend's seeded demo matrices clearly labeled or removed as real data lands. **Acceptance:** lineage sweep shows `process-batch` `passed` with `nlp_signals` as source; a known 2024 controversy's pulse trajectory reproduces from stored signals; calibrated half-lives ship with confidence intervals, not just the authored constants.

### 9.2 Evolution B — Controversy triage analyst over the live pulse (LLM tier 2)

**What.** A tool-calling analyst for the module's stated users (compliance teams, fund managers): "what's driving the greenwashing flag on issuer X?" answered by pulling the issuer's signal history, decomposing the GDF (marketing vs operational sentiment gap, κ), and quoting the underlying GDELT source items — then simulating: "if this stays out of the news 30 days, where does the pulse decay to?" via `POST /apply-decay` with the event type's real half-life.

**How.** Tool schemas from the module's 5 existing OpenAPI operations plus Evolution A's signal-history query; grounding corpus = this Atlas record's §2.3 formula table (pulse, GDF, λ definitions) so explanations quote the implemented math. Source citations link to the stored GDELT records with their credibility tier disclosed — a tier-4 social signal is never presented with tier-1 confidence. The no-fabrication validator covers pulse scores and decay projections.

**Prerequisites (hard).** Evolution A — narrating today's seeded document matrices would attribute fabricated greenwashing scores to the 20 real `ISSUER_NAMES` on the page, a defamation-adjacent failure mode. **Acceptance:** every quoted pulse/GDF figure matches a tool response; asking about an issuer with no ingested signals returns "no signal coverage" with the coverage stats, not an invented score.