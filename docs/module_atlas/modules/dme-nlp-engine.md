# DME NLP Engine
**Module ID:** `dme-nlp-engine` · **Route:** `/dme-nlp-engine` · **Tier:** A (backend vertical) · **EP code:** EP-U10 · **Sprint:** U-extended

## 1 · Overview
Dynamic Materiality Engine NLP pipeline for named entity recognition of ESG topics in corporate disclosures, real-time sentiment scoring, controversy detection, and greenwashing flag scoring. Integrates spaCy NER, FinBERT sentiment classification, and GDELT news feed for media-disclosure divergence analysis.

> **Business value:** Used by ESG analysts, compliance teams, and fund managers to automate controversy screening and verify consistency between corporate claims and external media evidence.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHART_TOOLTIP_STYLE`, `CONTROVERSY_EVENTS`, `Card`, `DOCUMENTS`, `DOC_TYPES`, `GREENWASH_DIMS`, `ISSUER_NAMES`, `KpiCard`, `NER_TYPES`, `Pill`, `QUALITY_DIMS`, `REGULATORY_REQS`, `SECTORS`, `SENTIMENT_ASPECTS`, `ScoreBar`, `SectionTitle`, `TFIDF_TERMS`, `TOPICS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtPct` | `(v, d = 1) => (v * 100).toFixed(d) + '%';` |
| `fmtNum` | `(v) => v >= 1000 ? (v / 1000).toFixed(1) + 'K' : v.toString();` |
| `dot` | `(a, b) => a.reduce((s, v, i) => s + v * b[i], 0);` |
| `norm` | `(a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0)) \|\| 1;` |
| `clusters` | `useMemo(() => DOCUMENTS.map((_, i) => Math.floor(sr(i * 7) * 5)), []);` |
| `topicsExtracted` | `TOPICS.length * filteredDocs.length;` |
| `entCoverage` | `parseFloat((65 + sr(42) * 25).toFixed(1));` |
| `riskSignals` | `3 + Math.floor(sr(99) * 12);` |
| `topicAvg` | `TOPICS.map((t, ti) => ({` |
| `sortedTopics` | `[...topicAvg].sort((a, b) => b.salience - a.salience);` |
| `sentBins` | `[-0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1.0];` |
| `sentHist` | `sentBins.slice(0, -1).map((lo, i) => ({` |
| `flagged` | `[...filteredDocs].sort((a, b) => b.gw_score - a.gw_score).slice(0, 5);` |
| `nerTotals` | `NER_TYPES.map((n, ni) => ({` |
| `topicAvg` | `TOPICS.map((t, ti) => ({` |
| `coocMatrix` | `TOPICS10.map((_, ai) =>` |
| `docTopicSummary` | `DOCUMENTS.slice(0, 8).map((d, di) => ({` |
| `perDoc` | `filteredDocs.map(d => ({` |

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
| `NLPPulseEngine.greenwashing_discount` | pulse, s_marketing, s_operational, kappa | GDF = max(0, 1 - κ × max(0, S_marketing - S_operational) / 100) |
| `NLPPulseEngine.decay_lambda` | event_type | λ = ln(2) / (half_life_hours / 24) |
| `NLPPulseEngine.apply_decay` | initial_value, event_type, elapsed_hours | S(t) = S₀ × exp(−λ × t_days) |
| `NLPPulseEngine.source_credibility` | tier |  |
| `NLPPulseEngine.process_signal` | req | Full pipeline for one sentiment signal. |
| `NLPPulseEngine.process_batch` | req | Process batch of signals and compute aggregate pulse. |
| `NLPPulseEngine.get_reference_data` |  | Return reference tables for event types, source tiers, decay rates. |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `fastapi` *(shared)*, `services` *(shared)*
**Frontend seed datasets:** `CLUST_COLORS`, `DOC_TYPES`, `GREENWASH_DIMS`, `ISSUER_NAMES`, `NER_TYPES`, `QUALITY_DIMS`, `SECTORS`, `SENTIMENT_ASPECTS`, `TABS`, `TFIDF_TERMS`, `TOPICS`, `TOPIC_COLORS6`

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
**Standards:** ['FinBERT (Araci 2019)', 'GDELT 2.0 Global Knowledge Graph', 'GRI 2-23 Commitment Integrity']

**Engine `dme_nlp_pulse_engine` — extracted transformation lines:**
```python
GDF = max(0, 1 - κ × max(0, S_marketing - S_operational) / 100)
gap = max(0.0, s_marketing - s_operational)
gdf = max(0.0, 1.0 - kappa * gap / 100.0)
now = req.signals[-1].timestamp if req.signals else datetime.utcnow()
elapsed = (now - sig.timestamp).total_seconds() / 3600.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).