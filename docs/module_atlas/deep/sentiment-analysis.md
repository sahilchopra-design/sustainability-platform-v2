## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (partial).** The MODULE_GUIDES formula states
> `Composite Sentiment = (E_sentiment×0.4) + (S_sentiment×0.35) + (G_sentiment×0.25)` — a pillar-weighted
> average. **The code computes an unweighted mean**: `overall = round((eScore + sScore + gScore) / 3)`
> (i.e. implicitly 0.333/0.333/0.333, not 0.4/0.35/0.25). Everything else described below (FinBERT-style
> 3-class scoring, source-tier credibility weighting, momentum classification) is genuinely present in code.

### 7.1 What the module computes

200 real-named large-caps (`COMPANY_NAMES`, 10 per sector × 20 sectors sampled cyclically via `i%10`) each
get independent E/S/G pillar scores and a FinBERT-style 3-class sentiment distribution, all seeded via
`sr(s)=frac(sin(s+1)×10⁴)`. A separate pool of 100 synthetic news articles (`ARTICLES`) references these
companies with sentiment-tagged headlines drawn from a fixed 20-headline pool.

```js
eScore/sScore/gScore = round(20 + sr()×70) / round(20 + sr()×70) / round(30 + sr()×60)
overall               = round((eScore + sScore + gScore) / 3)          // unweighted — see mismatch flag
finbert_pos = raw × 0.7
finbert_neg = (1 − raw) × 0.4
finbert_neu = max(0, 1 − finbert_pos − finbert_neg)
```

### 7.2 Parameterisation

| Field | Range/formula | Provenance |
|---|---|---|
| `eScore`/`sScore` | 20–90 | Synthetic |
| `gScore` | 30–90 | Synthetic (narrower floor, matching real-world observation that governance scores skew higher/less dispersed than E or S) |
| `ic` (information coefficient) | `0.05 + sr()×0.25` → 0.05–0.30 | Synthetic; plausible range vs. published ESG-factor IC literature |
| `momentum` | `>0.65`→Accelerating, `>0.35`→Stable, else Decelerating | 3-tier threshold classification |
| `controversies` | `round(sr()×8)` → 0–8 | Synthetic |
| `priceCorr` | `round(-50+sr()×100)` → −50 to +50 | Synthetic correlation-style metric |
| Article `sourceTier` | `ceil(sr()×5)` → 1–5 | Synthetic tiering across 15 named real source types (SEC EDGAR, GDELT News, Bloomberg, Reuters, FT, NGO Reports, CDP Disclosures, UNFCCC, etc.) |
| Article `sentiment` | `sentRaw>0.55`→Positive (55/tier score 55–100), `>0.3`→Neutral (40–60), else Negative (5–45) | 3-class threshold, score ranges overlap slightly at the Neutral/Positive boundary (both can produce ~55–60) |

### 7.3 Calculation walkthrough

1. `COMPANIES` (200) generates independent E/S/G scores, a FinBERT-style positive/negative/neutral
   probability triple, an IC, momentum label, controversy count, media volume, and price correlation — all
   from independent `sr()` seeds per field, so (as with sibling modules) a company's `overall` sentiment and
   its `momentum`/`trend` labels are not causally linked.
2. `ARTICLES` (100) independently samples a company (`COMPANIES[floor(sr()×200)]`), a headline template, a
   source, and a 3-class sentiment + numeric score — **not derived from the referenced company's own
   `eScore`/`sScore`/`gScore`**, so an article about a company can show "Positive" sentiment even if that
   company's E/S/G `overall` score is low.
3. **Portfolio-level KPIs**: `avgESG = round(Σ overall / N)`, `controversyIdx = round(Σ controversies / N,
   1)` (both guarded via `Math.max(1,...)`), `sectorHeatmap` aggregates by `SECTORS`, `controversyAlerts`
   is the top-10 by `controversies` descending.
4. **Source Intelligence tab**: `weightedAvg = Σ(avgSentiment × credWeight) / Σ credWeight` — a genuine
   credibility-weighted aggregate sentiment across the 15 `SOURCES_DATA` rows, guarded at `max(0.01, ...)`.

### 7.4 Worked example

Company `i=15` ("Nvidia Corporation"): `eScore = round(20+sr(105)×70)`, illustrative draw `eScore=68`,
`sScore=54`, `gScore=79`.

| Guide formula (weighted) | Code formula (unweighted, actual) |
|---|---|
| `68×0.4 + 54×0.35 + 79×0.25 = 27.2+18.9+19.75 = 65.85 → 66` | `(68+54+79)/3 = 201/3 = 67` |

A 1-point difference in this illustrative case, but the gap widens whenever pillar scores diverge more —
e.g. `E=90, S=30, G=90`: weighted = `36+10.5+22.5=69`, unweighted = `70` — generally small but systematic,
since G is both the highest-floor pillar (30 vs 20) and (per the guide) intended to carry the *lowest*
weight (0.25) while code gives it equal weight (0.333).

### 7.5 Companion analytics on the page

- **Topic Modeling (LDA/BERTopic) tab** — a themed word-frequency/topic-similarity display over
  `TOPIC_NAMES`, illustrative NLP-pipeline output, not a live LDA/BERTopic model run.
- **Named Entity Recognition tab** — `ENTITY_TYPES` counts and a co-occurrence list, similarly illustrative.
- **EWMA Momentum & IC Decay tab** — presents exponential moving-average style momentum framing consistent
  with the platform's standard EWMA convention used in `sentiment-pipeline` and `sentiment-alpha-engine`.

### 7.6 Data provenance & limitations

- **All 200 companies and 100 articles are synthetic**, generated fresh per session via
  `sr(seed)=frac(sin(seed+1)×10⁴)`; company names are real large-caps used as illustrative labels, article
  headlines are drawn from a fixed 20-item pool, not real news.
- **Composite score formula does not match the guide's stated pillar weights** (§ mismatch flag) — a
  one-line fix (`eScore×0.4 + sScore×0.35 + gScore×0.25`) would align code to the documented methodology.
- Article sentiment is independent of the referenced company's own E/S/G scores — the article stream and
  the company sentiment profile are two disconnected synthetic sources, so cross-referencing "recent
  articles" against a company's "overall sentiment trend" on this page will not show genuine correlation.
- `priceCorr` and `ic` are presented as if derived from a real return series but are independent random
  draws with no underlying price data feeding them.

**Framework alignment:** RepRisk ESG Risk Platform methodology and Refinitiv ESG News Analytics — inform
the general architecture (entity-level sentiment aggregation, controversy flagging, source-tier
credibility weighting) — genuinely reflected in the `sourceTier`/`credWeight` mechanics · FinBERT — the
3-class positive/negative/neutral probability structure (`finbert_pos/neg/neu`) mirrors FinBERT's standard
output format, though the underlying scores are synthetic, not model inference · GRI 2-29 stakeholder
engagement — informs the multi-source (NGO, regulator, media, academic) source taxonomy.
