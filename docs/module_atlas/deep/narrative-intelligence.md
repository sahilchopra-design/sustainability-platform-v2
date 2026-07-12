## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes an **NLP greenwashing-detection
> engine**: LDA topic-coherence modelling, a `greenwashing_risk = w1·coherence_gap + w2·commitment_gap
> + w3·controversy_gap` composite, net-zero-pledge credibility scoring on Oxford Net Zero criteria, and a
> commitment-action gap index — all tied to the EU Green Claims Directive. **None of that exists in the
> code.** The page is a **sustainability-report *authoring* toolkit**: a Hero's-Journey narrative mapper,
> six stakeholder-audience journeys, a tone-spectrum analyser, "relatable equivalents" for emissions, a
> message-hierarchy builder, a report-excerpt library, and a data/narrative/visual component-mix
> analyser. There is no NLP pipeline, no LDA, no greenwashing score, no text ingested. The sections below
> document the communications toolkit the code actually is.

### 7.1 What the module computes

The page renders eight tabs over hand-authored constants; the only arithmetic is:

```js
toneChartData: per tone dimension, avg = TONE_SECTIONS.length
  ? round(Σ section.weight[tone] / TONE_SECTIONS.length) : 0
gap = |c.data − c.bestData| + |c.narrative − c.bestNarrative| + |c.visual − c.bestVisual|
```

`avg` averages each of five tone dimensions (inspirational, accountable, formal, transparent, empathetic)
across 8 report sections. `gap` is the **L1 distance** between a section's actual data/narrative/visual
mix and a "best-in-class" benchmark mix — the module's single quantitative output.

### 7.2 Parameterisation / scoring rubric

| Constant | Content | Provenance |
|---|---|---|
| `HEROS_JOURNEY` (12) | Campbell's 12 monomyth stages mapped to a sustainability transformation arc | Author narrative framework |
| `STAKEHOLDER_JOURNEYS` (6) | Investor/Customer/Employee/Supplier/Community/Regulator priorities + tone + key messages | Author communications design |
| `TONE_SECTIONS` (8) | Per-section tone weights summing to 100 across 5 dimensions | Hand-authored |
| `EQUIVALENTS` | tCO₂e → cars/homes/trees/flights; MWh, m³ conversion factors | **Real EPA-style equivalency factors** (0.216 cars-off-road/tCO₂e ≈ EPA GHG equivalencies) |
| `REPORT_EXCERPTS` (10) | Real companies (Unilever, Patagonia, Shell…) with a hand-set `quality` 0–100 | Author judgement |
| `COMPONENT_MIX` (8) | Actual vs best-in-class data/narrative/visual % per section | Hand-authored benchmark |

The `quality` scores on report excerpts (Patagonia 98, Shell 65) are **subjective author ratings**, not
computed from text.

### 7.3 Calculation walkthrough

The module has no seeded PRNG-driven data flow of substance (`sr` is imported but the visible logic uses
static constants). Inputs are the six constant tables → tab-specific views: the Tone Spectrum tab averages
`TONE_SECTIONS` weights; the Component-Mix Analyzer computes the L1 `gap` per section against
`bestData/bestNarrative/bestVisual`; the Relatable-Equivalents tab multiplies a user's tCO₂e/MWh/m³ input
by the stored conversion factors. Everything else is descriptive rendering.

### 7.4 Worked example (Component-Mix gap, CEO Letter)

`COMPONENT_MIX[0] = {data 15, narrative 70, visual 15, bestData 10, bestNarrative 75, bestVisual 15}`:

```
gap = |15−10| + |70−75| + |15−15| = 5 + 5 + 0 = 10
```

A gap of 10 points flags the CEO letter as 10 percentage-points (L1) away from the best-practice
narrative-heavy mix — the module's recommendation being to shift ~5 points from data to narrative.
For the Relatable-Equivalents tab, 1,000 tCO₂e → `1000 · 0.216 = 216` cars off the road for a year.

### 7.5 Data provenance & limitations

- **Entirely hand-authored content** — narrative frameworks, tone weights, and quality ratings are
  editorial, not computed. The emissions-equivalency factors are the only externally-grounded numbers
  (EPA-style GHG equivalencies).
- **No NLP whatsoever**: no text ingestion, tokenisation, topic modelling, or sentiment analysis. The
  guide's LDA/greenwashing/net-zero-credibility apparatus is absent.
- The `quality` and `gap` metrics are the only quantitative outputs, and both rest on subjective
  benchmark constants.

**Framework alignment:** The narrative structure borrows Campbell's monomyth (Hero's Journey) and standard
audience-segmentation communications theory — genuine communications craft, but not a disclosure-analysis
standard. The guide's real standards (**EU Green Claims Directive 2023/0085**, **TCFD strategy
disclosures**, **Oxford Net Zero criteria**, **InfluenceMap**) are named in the guide but **not
implemented**; they belong to the greenwashing-NLP model specified in §8.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide promises a greenwashing-detection NLP
engine; the code is an authoring toolkit. Below is the production greenwashing/net-zero-credibility model.

### 8.1 Purpose & scope
Score corporate sustainability disclosures for greenwashing risk and net-zero-pledge credibility from the
report text itself, flagging commitment-vs-action gaps and controversy-disclosure mismatches, for ESG
analysts and regulators under the EU Green Claims Directive.

### 8.2 Conceptual approach
An NLP pipeline: topic modelling for coherence, claim extraction + progress matching for the commitment-
action gap, and a rubric-scored net-zero credibility index. Benchmarks: **NewClimate Corporate Climate
Responsibility Monitor** and **Oxford Net Zero Assessment** (credibility criteria), **InfluenceMap**
(lobbying-consistency), and modern **transformer-based claim verification** (rather than the guide's
classical LDA alone).

### 8.3 Mathematical specification
`GreenwashingRisk = w₁·CoherenceGap + w₂·CommitmentGap + w₃·ControversyGap`, all normalised to [0,100].
CoherenceGap: topic distribution `θ` from LDA/BERTopic over report sections; gap `= 1 −
cos(θ_claimed_priorities, θ_wordshare)` (claimed priorities vs real text real-estate). CommitmentGap:
`(pledged_annual_reduction − actual_annual_reduction) / pledged` from extracted quantitative targets vs
reported progress time-series. ControversyGap: `1 − overlap(controversy_events, disclosed_events)`.
Net-zero credibility `NZC = Σ_c wc·sc`, `c ∈ {coverage, interim targets, offset reliance, verification,
governance}`, each `sc ∈ [0,1]` per Oxford criteria.

| Parameter | Source |
|---|---|
| Topic model | LDA / BERTopic on report corpus |
| Claim extraction | Fine-tuned NER + numeric parser |
| Progress data | CDP, company reports, SBTi registry |
| Controversy events | RepRisk / news feeds |
| Credibility weights wc | Oxford Net Zero / NewClimate CCRM |

### 8.4 Data requirements
Sustainability report + earnings-call PDFs, SBTi registry, CDP responses, controversy feed. Platform has
the `net-zero-credibility-index` and `net-zero-commitment-tracker` modules as adjacent scaffolding, but no
text ingestion layer yet.

### 8.5 Validation & benchmarking plan
Correlate model net-zero credibility against NewClimate CCRM integrity ratings on a shared sample (target
rank correlation >0.7); precision/recall of commitment-gap flags against known under-delivery cases;
human-label agreement on greenwashing risk (Cohen's κ).

### 8.6 Limitations & model risk
Topic models are unstable on short/boilerplate text; claim extraction misses hedged language; controversy
matching is source-biased. Conservative fallback: surface evidence spans for analyst review rather than a
single auto-score, and abstain when target extraction confidence is low.
