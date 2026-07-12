## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes an **employee/consumer/community
> sentiment aggregation engine** — Glassdoor rating distributions, LinkedIn engagement velocity, Twitter/X
> controversy-velocity with exponential decay (half-life 30 days), and Indeed job-posting geolocation against
> FFIEC LMI census tracts, combining into `social_ESG_score = w1·employee_sentiment + w2·consumer_trust +
> w3·community_proxy − w4·controversy_velocity`. **None of this exists in the code.** The module actually
> implements a **social-media/academic-literature NLP demo**: live Bluesky post fetching with keyword-based
> sentiment, a live GDELT news-article feed, a live OpenAlex academic-paper search for ABSA (aspect-based
> sentiment analysis) research, and six further tabs (ABSA Engine, NLI Verification, Hedge Detection,
> Boilerplate, Alt-Data Alpha, Multi-Lingual, Readability) that are **entirely synthetic `sr()`-seeded
> per-company scores**, not outputs of any actual NLP model despite the tab names implying real inference.
> The sections below document what the code actually does.

### 7.1 What the module computes

**Live data (genuinely fetched, with seed fallback)**:
- `fetch('https://public.api.bsky.app/.../searchPosts?q=ESG sustainability greenwashing')` — live Bluesky
  post search; falls back to 25 hand-written `SEED_BSKY` posts on fetch failure.
- `fetch('https://api.gdeltproject.org/api/v2/doc/doc?...')` — live GDELT news article search (ESG/
  sustainability/greenwashing/climate, past week); no seed fallback (silently empty on failure).
- `fetch('https://api.openalex.org/works?search=aspect+based+sentiment+analysis+ESG...')` — live OpenAlex
  academic paper search; falls back to 15 hand-written `SEED_ABSA_PAPERS`.
- `LiveBadge` component visibly flags each data source as `LIVE` or `SEEDED` in the UI — the one module in
  this batch that is explicit about its own data provenance in real time.

**Sentiment/pillar classification on live post text** (`postSentiment`, `postPillar`): a **bag-of-words
keyword counter**, not a trained model —
```js
posWords = ['achieved','successful','praised','milestone','credible','good','impressive','positive','strong']
negWords = ['violation','greenwashing','scandal','criticized','irony','washing','contradicts','reduces','demand','scrutiny']
score = neg>pos ? -(neg/(pos+neg+0.01)) : pos>neg ? pos/(pos+neg+0.01) : 0
pillar = E if text contains {carbon,fossil,climate,renewable,emission,'net zero',oil,energy}
       = S if text contains {labor,worker,'supply chain','human rights',diversity,community}
       = G otherwise (default)
```

**Everything else in the module is synthetic per-company data** for a fixed 80-company universe
(`COMPANIES_80`, real issuer names): ABSA sentiment/aspect assignment (`sr(ci*17)`→aspect, `sr(ci*31)`→
sentiment bucket), NLI (natural language inference) claim entailment/contradiction labels (`sr(i*17)`
threshold → Entailment/Neutral/Contradiction), hedge-language density and "most hedged topic," boilerplate-
category matching (10 fixed categories, `sr(i*7+ci*13)>0.45` per category), and 5 readability indices
(Flesch, Flesch-Kincaid grade, Gunning Fog, SMOG, Coleman-Liau) — **all independently `sr()`-seeded per
company**, not computed from any actual disclosure text.

### 7.2 Parameterisation

| Component | Rule | Provenance |
|---|---|---|
| Sentiment keyword lists | 9 positive / 10 negative words | hand-picked, not a validated lexicon (e.g. FinBERT, Loughran-McDonald) |
| ABSA aspect/pillar assignment | `sr(ci*17)` index into 24-item `ALL_ASPECTS` (8 E + 8 S + 8 G) | synthetic |
| NLI label thresholds | `sr>0.55`→Entailment, `>0.3`→Neutral, else Contradiction | hand-set thresholds, not from a trained NLI classifier |
| Hedge density | `5 + sr(i*13)×45` | synthetic; the `HEDGE_PHRASES` taxonomy (24 phrases, 5 levels) is a real, well-constructed linguistic hedging scale but is **never applied to any actual text** — no company's `hedgeDensity` is computed by counting these phrases in a document |
| Boilerplate % | `count(sr(i*7+ci*13)>0.45)/10 × 100` | synthetic; the 10 `BOILERPLATE_CATS` are realistic categories, again never matched against real text |
| Readability indices | `sr()`-scaled ranges per index (e.g. Flesch 30–80) | synthetic; formulas for Flesch/Gunning Fog/SMOG/Coleman-Liau are **not implemented** — no sentence/syllable counting occurs anywhere |
| Multi-lingual model table (`LANGUAGES`) | hand-curated F1 scores per language model (FinBERT 0.87 EN, CamemBERT 0.81 FR, etc.) | plausible real benchmark figures, presented as reference, not live-evaluated |

### 7.3 Calculation walkthrough

- **Social Dashboard** (tab 0): aggregates `posts` (live-or-seed) into a sentiment pie
  (`sentimentCounts`), a topic-frequency bar chart (substring match of 10 ESG keywords against post text —
  a real, if simple, text-mining operation on real data when live), and an engagement scatter of
  likes/reposts/replies for the first 10 posts.
- **ABSA Engine**: filters the 50-row synthetic `absaData` by aspect/pillar/sentiment; the "text" shown per
  row is one of 10 hand-written example sentences cycled by index, not an actual per-company statement.
- **NLI Verification**: assigns a greenwashing-risk flag (`gwRisk`) from the synthetic NLI label —
  `Contradiction→High`, `Neutral + source='No evidence'→Medium`, else `Low`.
- **Hedge Detection / Boilerplate / Readability**: each renders scatter/bar charts of the synthetic per-
  company scores against a synthetic `esgScore` (also `sr()`-generated), so any correlation shown (e.g.
  "higher hedge density → lower ESG score") is an artefact of how the two series happen to be constructed,
  not a discovered relationship.

### 7.4 Worked example (live-post path)

For a Bluesky post containing: *"Shell: net zero by 2050 but new drilling licenses approved in 2025. Pick
one. #greenwashing"*:

| Step | Computation | Result |
|---|---|---|
| Positive word matches | none of the 9 pos-words present | 0 |
| Negative word matches | "greenwashing" | 1 |
| Sentiment score | `neg>pos` → `-(1/(0+1+0.01))` | **≈ −0.99 (Negative)** |
| Pillar | contains "net zero" | **E** |

### 7.5 Data provenance & limitations

- **Three genuinely live API integrations** (Bluesky, GDELT, OpenAlex) with honest UI labelling of live vs
  seeded state — a stronger provenance practice than most modules in this batch.
- The sentiment classifier is a **10-word bag-of-words heuristic**, not a financial-domain sentiment model
  (FinBERT etc., despite the `LANGUAGES` table citing FinBERT as the intended EN model) — it will
  misclassify any post whose sentiment doesn't hinge on the listed keywords.
- **Seven of ten tabs (ABSA, NLI, Hedge, Boilerplate, Alt-Data Alpha, Multi-Lingual context, Readability) are
  entirely `sr()`-seeded and never touch real text** — the hedge-phrase taxonomy and boilerplate-category
  list are genuinely useful linguistic frameworks that are defined but not operationalised.
- The guide's employee/consumer/community sentiment engine (Glassdoor, LinkedIn, FFIEC LMI) has **no
  implementation whatsoever** — see the mismatch flag.

### 7.6 Framework alignment

- **SASB Human Capital Standards / GRI 401-404 / FFIEC CRA data** — named in the guide as the intended basis
  for employee and community metrics; not used anywhere in the actual code.
- **Academic NLP literature (OpenAlex ABSA-ESG papers)** — genuinely surfaced live, giving the module a real
  (if indirect) connection to the aspect-based sentiment analysis research it names.
- A production build should either (a) implement the guide's employee/community sentiment pipeline as
  originally scoped, or (b) rewrite the guide to describe the text-analytics demo the code actually is —
  the current pairing is fully disconnected.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Convert the module's live text feeds (Bluesky, GDELT) and disclosure documents into a genuine, auditable
ESG alternative-data signal — replacing the keyword sentiment heuristic and the seven synthetic tabs with
real NLP inference, for use as (a) an early-warning controversy signal and (b) a disclosure-quality overlay
on primary ESG scores.

### 8.2 Conceptual approach

Adopt a **domain-tuned transformer sentiment/ABSA pipeline** (FinBERT or ESG-tuned RoBERTa variants, as the
existing `LANGUAGES` table already correctly names) for sentiment and aspect extraction, a **trained NLI
model** (e.g. RoBERTa-MNLI fine-tuned on sustainability-claim/evidence pairs) for the greenwashing-risk NLI
tab, and standard **readability formulas computed on real text** (Flesch Reading Ease, Flesch-Kincaid Grade)
— mirroring how RepRisk/Sentifi/Bloomberg's own ESG controversy-NLP pipelines operate: a transformer
classifier for sentiment/stance, a rules-based syllable/sentence counter for readability, and an exponential-
decay time-weighting for controversy velocity (as the *guide* itself specifies, just not yet built).

### 8.3 Mathematical specification

```
Sentiment_post  = FinBERT(text) → {P(pos), P(neu), P(neg)}, score = P(pos) − P(neg)
ControversyVelocity_t = Σ_τ≤t mention(τ) × exp(−λ(t−τ)) / baseline_rate     // λ = ln(2)/30  (30-day half-life, per guide)
GreenwashRisk_claim = NLI(claim, evidence_doc) → P(Contradiction) − P(Entailment)     // trained NLI classifier
FleschReadingEase = 206.835 − 1.015×(words/sentences) − 84.6×(syllables/words)
HedgeDensity = (Σ_i count(hedge_phrase_i in doc)) / total_words × 1000        // per-mille, using the existing HEDGE_PHRASES taxonomy
BoilerplateShare = (matched_template_sentences / total_sentences)             // via sentence-embedding cosine similarity ≥0.9 to a template bank
```

| Parameter | Calibration source |
|---|---|
| Sentiment/ABSA model | FinBERT (ProsusAI) or ESG-tuned variant — already named per-language in `LANGUAGES` table |
| NLI model | RoBERTa-large-MNLI fine-tuned on a sustainability claim/evidence corpus |
| λ (decay rate) | 30-day half-life per the guide's own stated methodology |
| Readability constants | standard published Flesch/Flesch-Kincaid coefficients |
| Boilerplate template bank | corpus of ≥500 known generic ESG disclosure sentences, sentence-embedded (e.g. via `all-MiniLM`) |

### 8.4 Data requirements

Real per-company disclosure text (10-K/annual report/sustainability report PDF text extraction — not
currently ingested anywhere in the platform), the live Bluesky/GDELT feeds already wired, a labelled
sustainability-claim/evidence dataset for NLI fine-tuning (could bootstrap from CDP/SBTi verification
outcomes), and GPU/inference infrastructure for transformer scoring at scale.

### 8.5 Validation & benchmarking plan

Evaluate FinBERT sentiment against a hand-labelled sample of the live Bluesky/GDELT feed (target F1 ≥ 0.80,
consistent with the `LANGUAGES` table's own cited benchmark). Validate `GreenwashRisk_claim` against known
greenwashing enforcement cases (SEC/FCA/ASA rulings) as a positive-label set. Cross-check `BoilerplateShare`
against manual audit of a sample of 10-K ESG sections.

### 8.6 Limitations & model risk

Social-media text (Bluesky) is a noisy, self-selected sample — not representative of broad market opinion;
any controversy-velocity signal derived from it should be weighted by account credibility/reach, not raw
post count. NLI models trained on general corpora underperform on domain-specific sustainability claims
without fine-tuning; deploy only after validating against a held-out labelled set specific to ESG disclosure
language.
