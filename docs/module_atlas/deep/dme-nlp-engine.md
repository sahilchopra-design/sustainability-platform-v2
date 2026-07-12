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
