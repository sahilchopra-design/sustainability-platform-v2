## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *live NLP pipeline*:
> FinBERT + VADER sentiment models, 15,000+ articles/day ingested via RSS/API/scraping across
> 200+ sources, entity resolution, and `<2 min` signal latency. **None of that exists.** There
> is no NLP model, no ingestion, no live data (`engines: []`, `route_files: []`). The page holds
> **200 synthetic news items whose sentiment is drawn from the seeded PRNG** and then aggregated
> with genuinely correct index/momentum/volatility arithmetic. The analytics layer is real; the
> "sentiment" it consumes is random. Sections below document the code.

### 7.1 What the module computes

200 items are built once, outside the component:

```js
NEWS_ITEMS = Array.from({length:200}, (_, i) => {
  rawSentiment    = sr(i*31) * 2 - 1;                      // uniform on [-1, +1]
  relevance       = 0.3 + sr(i*37) * 0.7;                  // [0.30, 1.00]
  reach           = round(1000 + sr(i*41) * 49000);        // [1k, 50k]
  portfolioImpact = (sr(i*43) - 0.5) * 6;                  // [-3%, +3%]
  daysAgo         = floor(sr(i*47) * 30);                  // 0..29
  headline        = HEADLINE_TEMPLATES[tmplIdx].replace('{entity}',…).replace('{topic}',…);
  entityMentions  = [ENTITIES[e1], ENTITIES[e2], ENTITIES[e3]];
});
```

`sentiment` is thus a pure uniform draw — the headline text (a Mad-Libs template fill) has **no
causal link** to the sentiment number attached to it.

### 7.2 Aggregation formulas (these are real)

```js
// Reach- and relevance-weighted sentiment index
WSI = Σ(sentiment · reach · relevance) / Σ(reach · relevance)

// Per-topic statistics
avgSentiment = mean(sentiment | topic)
momentum     = mean(sentiment | daysAgo<7) − mean(sentiment | daysAgo≥7)
variance     = Σ(sentiment − mean)² / (n − 1)          // sample variance
volatility   = √variance
```

The weighting scheme (importance ∝ audience reach × topical relevance) is a legitimate
sentiment-index construction; the sample-variance `n−1` denominator and the recent-minus-older
momentum are correct.

### 7.3 Parameterisation & provenance

| Field | Range / rule | Provenance |
|---|---|---|
| `sentiment` | `sr(i*31)·2 − 1` → `[−1, +1]` | Synthetic PRNG (not FinBERT) |
| `relevanceScore` | `0.3 + sr(i*37)·0.7` | Synthetic |
| `reach` | `1000 + sr(i*41)·49000` | Synthetic proxy for audience size |
| `portfolioImpact` | `(sr(i*43) − 0.5)·6` | Synthetic %; **not derived from prices** |
| `correlation` (ρ) | `(sr(i*79+3) − 0.5)·1.8` → `[−0.9, +0.9]` | Synthetic — labelled "Deterministic, sr-seeded" in the code itself |
| `estPnL` | `totalImpact · (1 + sr(i*7)·4)` | Synthetic 1×–5× multiplier on a synthetic impact |
| TOPICS / SOURCES / ENTITIES | 15 / 15 / 35 real names | Real taxonomy (Reuters, Bloomberg, FT, Shell, BP…) but only used as labels |

### 7.4 Worked example — weighted sentiment index

The WSI is `Σ(s·reach·rel)/Σ(reach·rel)`. For three illustrative items:

| Item | sentiment `s` | reach | rel | weight `reach·rel` | `s·weight` |
|---|---|---|---|---|---|
| n1 | +0.50 | 40,000 | 0.90 | 36,000 | +18,000 |
| n2 | −0.30 | 10,000 | 0.50 | 5,000 | −1,500 |
| n3 | +0.10 | 25,000 | 0.70 | 17,500 | +1,750 |
| **Σ** | | | | **58,500** | **+18,250** |

`WSI = 18,250 / 58,500 = 0.312`. A colour band then classifies it (`>0.2` green, `<−0.2` red,
else amber). Over the real 200-item set the index converges near 0 because `sentiment` is a
symmetric uniform draw — the headline "Sentiment Index" is essentially noise around zero.

### 7.5 Companion analytics

- **Topic × Category cross-tab** and **reach-weighted index by topic** — both re-apply the WSI
  formula per subgroup; correct given the inputs.
- **Sentiment histogram** — 10 bins of width 0.2 over `[−1, +1]`, `binIdx = min(9, floor((s+1)/0.2))`.
- **Sentiment-to-price correlation** — a grid of ρ values that are *directly seeded*, not computed
  from any price series (the code comment admits "sr-seeded").
- **Portfolio linkage** — filters items whose `entityMentions` include a holding, sums
  `portfolioImpact`, and inflates it into `estPnL` via a seeded 1×–5× multiplier.

### 7.6 Data provenance & limitations

- **Every sentiment, relevance, reach, impact and correlation value is synthetic**, from
  `sr(s)=frac(sin(s+1)×10⁴)`. Deterministic across reloads, but not real signal.
- **No NLP** — no FinBERT, no VADER, no tokeniser, no model weights; the guide's model names are
  aspirational.
- **Headline ↔ sentiment are decoupled** — a "sued over misleading claims" headline can carry a
  positive sentiment because the two are independent draws.
- **`estPnL` and `correlation` are not market-derived** — they cannot be used for trading signals.

**Framework alignment:** *FinBERT* (Yang et al. 2020) — a BERT model fine-tuned on financial
text (Reuters TRC2, Financial PhraseBank) that outputs per-sentence positive/negative/neutral
logits; here named but not run. *VADER* (Hutto & Gilbert 2014) — a lexicon-plus-rules valence
scorer producing a compound score in `[−1, +1]`; the module's `[−1, +1]` range mimics VADER's
output scale but is generated randomly. *TCFD* — cited as the reason to monitor climate news
(reputational/transition-risk signal), which the dashboard structure supports conceptually.

### 8 · Model Specification

**Status: specification — not yet implemented in code.** The module surfaces a headline
"Sentiment Index", per-holding `estPnL`, and sentiment-to-price correlations that a PM could act
on — all currently `sr()`-seeded. A production build requires a real news-NLP and event-study stack.

**8.1 Purpose & scope.** Convert a real-time stream of climate-relevant news, regulatory
notices, and filings into per-entity and per-topic sentiment signals, then estimate the
short-horizon return impact on portfolio holdings for reputational/transition-risk monitoring.

**8.2 Conceptual approach.** Two stages benchmarked to industry practice. (i) **Domain-adapted
transformer sentiment** — FinBERT (Yang 2020) fine-tuned further on a climate corpus, in the
lineage of **RavenPack** and **Bloomberg's news-analytics sentiment** feeds. (ii) **Event-study
return attribution** — map entity-level sentiment shocks to abnormal returns via a market-model
event study (MacKinlay 1997), the same design equity-quant desks use to price news (cf.
**S&P Global Market Intelligence** textual-signal factors).

**8.3 Mathematical specification.**
```
Article sentiment:  s_a = softmax(FinBERT(text_a)) · [+1, 0, −1]        ∈ [−1, +1]
Entity daily score: S_{e,t} = Σ_{a∋e} w_a · s_a / Σ w_a,  w_a = reach_a · relevance_a · decay(t−t_a)
Sentiment shock:    Δ_{e,t} = S_{e,t} − EWMA_λ(S_{e,·})
Abnormal return:    AR_{e,t} = R_{e,t} − (α_e + β_e R_{mkt,t})          (market model)
Impact estimate:    E[AR | Δ] = γ · Δ_{e,t}                             (γ from panel regression)
Portfolio P&L:      PnL_p = Σ_h weight_h · Ê[AR_{h}]
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Sentiment logits | `FinBERT` | Financial PhraseBank + climate-labelled corpus (fine-tune) |
| Relevance | `relevance_a` | Entity-linker confidence + climate-classifier probability |
| Time decay | `λ` | Fitted to news half-life (~2–5 days), RavenPack-style |
| Market betas | `α_e, β_e` | 250-day OLS on daily returns vs regional index |
| Sentiment→return slope | `γ` | Panel regression of `AR` on `Δ`, per sector |

**8.4 Data requirements.** News: licensed feed (RavenPack / Bloomberg / GDELT-free) with
timestamps, source, full text. Entity map: ISIN↔name (present in `GLOBAL_COMPANY_MASTER`).
Prices: daily total returns + regional index (vendor or free via Stooq). Model: FinBERT weights
(open, HuggingFace). The platform already has the entity taxonomy and portfolio reader; it lacks
the feed, the transformer, and price history.

**8.5 Validation & benchmarking.** Label a held-out sample against human annotators (target
FinBERT F1 ≥ 0.85 vs Financial PhraseBank). Back-test the event study: does `γ·Δ` predict
next-day `AR` out-of-sample (information coefficient > 0)? Reconcile aggregate sentiment against
RavenPack ESS and against realised drawdowns around known climate events (e.g. litigation
filings). Stability: rolling-window γ.

**8.6 Limitations & model risk.** Transformer sentiment is domain-sensitive and can invert on
sarcasm/hedging; entity resolution errors propagate; event-study betas are unstable around the
very events of interest; `γ` is small and noisy, so per-holding `estPnL` must carry wide CIs.
Conservative fallback: publish sentiment *ranks* and flag events, not point P&L, until the
sentiment→return link is validated out-of-sample.
