## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide (EP-MISC) frames this as an *automated PCAF data-
> quality & lineage engine* with anomaly detection and DQ-tier scoring
> (`DQ_tier = f(source_type, verification_level, recency, coverage)`). **No PCAF DQ-tier scoring,
> lineage graph or anomaly detector exists in the code.** What the module actually is: a
> **multi-source live-data intelligence console** — 10 tabs that fetch four public APIs (GDELT,
> SEC EDGAR, OpenAlex, World Bank) with graceful seed fallbacks, plus quant-signal panels
> (ensemble NLP, event study, Hawkes news arrivals, alpha-factor IC). Sections document the code.

### 7.1 What the module computes

Ten tabs, each backed by a public API with a `LIVE`/`SEEDED` badge:

| Tab | Source | Live URL |
|---|---|---|
| Live News | GDELT DOC 2.0 | `api.gdeltproject.org/api/v2/doc/doc?query=ESG+climate` |
| SEC Filings | SEC EDGAR full-text | `efts.sec.gov/LATEST/search-index` |
| Research | OpenAlex | `api.openalex.org/works?search=ESG+sentiment` |
| Country ESG | World Bank | `api.worldbank.org/.../EN.ATM.CO2E.PC` |
| Ensemble NLP · Knowledge Graph · Event Study · Triangulation · Temporal · Alpha Factors | seeded | — |

Each live tab uses the pattern: `fetch(URL) → if results parse & set live=true, else fall back
to SEED_* and live=false`; the `.catch` also falls back. So the platform degrades to fully
synthetic data offline without breaking. Note even on a *successful* GDELT/SEC fetch, some
fields (SEC `sentiment`, `climateMentions`) are still filled from the PRNG — only titles/dates/
companies come from the wire.

### 7.2 Parameterisation

- **PRNG** `sr(s)=frac(sin(s+1)×10⁴)` seeds every fallback dataset: 20 GDELT article titles with
  tone `sr·20−10` (GDELT's −100…+100 tone scale, compressed), 15 SEC filings, 15 OpenAlex
  papers, 41 countries with hand-anchored CO₂/capita (Qatar 31.2, USA 14.2, India 1.9 t —
  realistic 2022 per-capita figures) plus a small random jitter.
- **NLP ensemble (`NLP_MODELS`):** FinBERT (weight 0.30, F1 0.87), ClimateRoBERTa (0.25, 0.82),
  ESG-BERT (0.20, 0.79), VADER+ESG (0.15, 0.71), XLM-RoBERTa (0.10, 0.78) — weights sum to 1.
- **Hawkes parameters (`HAWKES_PARAMS`):** per ESG pillar, self-exciting point-process params
  μ (base intensity), α (excitation), β (decay): Environmental μ0.42/α0.31/β0.85, Social
  0.28/0.22/0.71, Governance 0.19/0.17/0.63. Branching ratio α/β < 1 (stationary) in all three.
- **Alpha factors:** 5 signals (GDELT Tone IC, SEC Disclosure IC, OpenAlex Momentum, CO₂ Delta
  IC, Composite) with seeded IC/IR/Sharpe/α and IC-decay curves `sr·0.25·e^(−d/40)`.

### 7.3 Calculation walkthrough — the real formulas

- **News tone stats (Tab 1):** `avgTone = mean(tone)`, `posPct/negPct` = share with tone ≷ 0;
  articles bucketed into 5 tone bands.
- **Ensemble score (Tab 5):**
  ```
  ensembleScore = Σ w_i × (F1_i × 0.6 + 0.2) / Σ w_i
  ```
  a weighted "F1 proxy" (linear rescale of each model's F1) — not an actual model inference.
- **Event study (Tab 7):** cumulative abnormal returns `CAR[−5,+5]`, `CAR[−1,+1]` and t-stats
  per event type, plus an average CAR curve over the [−10,+10] window — all seeded.
- **Correlation triangulation (Tab 8):** 4×4 matrix over {GDELT Tone, SEC Sentiment, OpenAlex
  Cit., WB CO₂}, diagonal 1.0, off-diagonal `sr·1.6 − 0.8` ∈ [−0.8, 0.8].
- **Alpha framework (Tab 10):** EWMA-smoothed composite signal
  `smoothed = Σ_f IC_f × (1−λ) + λ×0.05` with a user-selectable λ ∈ {0.05, 0.10, 0.20, 0.30};
  Information Ratio displayed as `IR = IC × √BR` (fundamental law of active management).
- **Pillar tagging** (`tagPillar`): keyword classifier mapping a title to E / S / G / ESG.

### 7.4 Worked example — ensemble score

Using the five model weights and F1s:

| Model | w | F1 | F1×0.6+0.2 | w × term |
|---|---|---|---|---|
| FinBERT | 0.30 | 0.87 | 0.722 | 0.2166 |
| ClimateRoBERTa | 0.25 | 0.82 | 0.692 | 0.1730 |
| ESG-BERT | 0.20 | 0.79 | 0.674 | 0.1348 |
| VADER+ESG | 0.15 | 0.71 | 0.626 | 0.0939 |
| XLM-RoBERTa | 0.10 | 0.78 | 0.668 | 0.0668 |
| Σ | 1.00 | | | **0.6851** |

`ensembleScore = 0.6851 / 1.00 ≈ 0.6851` → displayed 0.6851, labelled "POSITIVE ESG". Because
the inputs are fixed, this score is constant — it demonstrates the ensemble-weighting mechanic,
not a live classification.

### 7.5 Data provenance & limitations

- **Genuinely live-capable** for 4 tabs (GDELT, SEC EDGAR, OpenAlex, World Bank) — a real
  differentiator vs pure-synthetic modules — but all live calls run client-side and are subject
  to CORS; on failure the `SEEDED` badge shows and PRNG data renders.
- The 6 quant tabs (Ensemble, Knowledge Graph, Event Study, Triangulation, Temporal, Alpha) are
  **entirely seeded**: CARs, correlations, IC curves, Hawkes intensities and factor stats are
  `sr()` draws, not estimated from the fetched data.
- **No PCAF DQ engine:** despite the guide, there is no source-type→tier mapping, no verification/
  recency scoring, no lineage tracking and no anomaly detection.
- The Hawkes parameters are displayed but the self-exciting intensity
  `λ(t) = μ + Σ α·e^(−β(t−t_i))` is not simulated; daily news counts are independent draws.

### 7.6 Framework alignment

- **PCAF Data Quality Framework (2022)** — cited by the guide; the real PCAF DQ hierarchy scores
  data 1 (reported+verified) to 5 (estimated) by source type. This module references the concept
  but does not implement the scoring.
- **GDELT tone / event data** — the news tab uses GDELT's real tone metric (−100…+100 sentiment)
  and article-list API; the seed compresses tone to ±10.
- **Fundamental Law of Active Management (Grinold)** — `IR = IC × √BR` is correctly stated as
  the relationship between information coefficient, breadth and information ratio.
- **Hawkes self-exciting point process** — the μ/α/β parameterisation and stationarity condition
  (branching ratio α/β < 1) are correct for modelling clustered ESG-news arrivals, even though
  the intensity is not simulated here.
- **FinBERT / ClimateBERT family** — the ensemble references real domain-adapted transformer
  models with plausible F1 scores; no inference is actually performed.
