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
