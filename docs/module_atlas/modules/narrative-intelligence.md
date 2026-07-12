# ESG Narrative Intelligence Engine
**Module ID:** `narrative-intelligence` · **Route:** `/narrative-intelligence` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
NLP analysis engine for sustainability reports, earnings calls, and regulatory filings. Scores topic coherence for greenwashing risk detection, identifies commitment-vs-action gaps, assesses net-zero pledge credibility, and checks alignment between controversy events and corporate disclosures.

> **Business value:** Used by ESG analysts, sustainable finance regulators, and responsible investment teams to automate greenwashing detection and provide evidence-based credibility assessments of corporate sustainability claims.

**How an analyst works this module:**
- Upload sustainability reports or connect disclosure API
- Run NLP pipeline for topic coherence and greenwashing risk scoring
- Review commitment-action gap analysis and net-zero credibility assessment
- Export narrative intelligence report for investor engagement or regulatory filing

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPONENT_MIX`, `EQUIVALENTS`, `HEROS_JOURNEY`, `KpiCard`, `MSG_LEVELS`, `REPORT_EXCERPTS`, `STAKEHOLDER_JOURNEYS`, `TABS`, `TONE_SECTIONS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `HEROS_JOURNEY` | 13 | `name`, `desc`, `sustainability`, `color` |
| `STAKEHOLDER_JOURNEYS` | 7 | `priorities`, `tone`, `keyMessages`, `color` |
| `TONE_SECTIONS` | 9 | `tones`, `weight`, `inspirational`, `accountable`, `formal`, `transparent`, `empathetic` |
| `REPORT_EXCERPTS` | 11 | `year`, `section`, `type`, `tone`, `keyTakeaway`, `quality` |
| `COMPONENT_MIX` | 9 | `data`, `narrative`, `visual`, `bestData`, `bestNarrative`, `bestVisual` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `toneChartData` | `useMemo(() => TONE_SECTIONS.map(t => ({` |
| `avg` | `TONE_SECTIONS.length > 0 ? Math.round(TONE_SECTIONS.reduce((s, t) => s + (t.weight[tone] \|\| 0), 0) / TONE_SECTIONS.length) : 0;` |
| `gap` | `Math.abs(c.data - c.bestData) + Math.abs(c.narrative - c.bestNarrative) + Math.abs(c.visual - c.bestVisual);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPONENT_MIX`, `HEROS_JOURNEY`, `MSG_LEVELS`, `REPORT_EXCERPTS`, `STAKEHOLDER_JOURNEYS`, `TABS`, `TONE_SECTIONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Greenwashing Risk Score | `w1·coherence_gap + w2·commitment_gap + w3·controversy_gap` | NLP pipeline output | Scores >70 warrant disclosure review; used in ESG controversy screening and regulatory compliance monitoring. |
| Net-Zero Pledge Credibility Score | `Oxford Net Zero criteria: coverage + interim + offsets + verification` | Corporate net-zero pledges + SBTi registry | Scores <40 indicate high pledge credibility risk; correlates with future SBTi validation success probability. |
| Commitment-Action Gap Index | `(actual_progress − pledged_progress) / pledged_progress` | Corporate disclosure time series | Negative values indicate under-delivery vs pledges; <-0.3 triggers regulatory notification risk flag under EU Green Claims Directive. |
- **Sustainability reports + earnings call transcripts + news feeds → text corpus** → LDA topic modelling → commitment extraction → controversy matching → greenwashing score → **Greenwashing risk scores and net-zero credibility assessments for investor and regulatory use**

## 5 · Intermediate Transformation Logic
**Methodology:** Greenwashing Risk Scoring via NLP Coherence Analysis
**Headline formula:** `greenwashing_risk = w1·topic_coherence_gap + w2·commitment_action_gap + w3·controversy_disclosure_gap`

Topic coherence scoring uses LDA (Latent Dirichlet Allocation) to identify dominant themes in sustainability reports and checks for inconsistency between claimed priorities and allocated word/page real estate. Commitment-action gap detection compares quantitative pledges (net-zero date, SBTi target) against reported annual progress metrics using time-series consistency checking. Net-zero credibility scoring draws on the Oxford Net Zero Assessment criteria (coverage, interim targets, offsets disclosure, third-party verification).

**Standards:** ['EU Green Claims Directive (2023/0085)', 'TCFD Recommendations – Strategy Disclosures', 'InfluenceMap Climate Accountability Report']
**Reference documents:** EU Green Claims Directive (Proposal COM/2023/166); Oxford Net Zero Assessment Criteria 2024; InfluenceMap Corporate Climate Responsibility Monitor 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Build the promised greenwashing NLP pipeline as a first backend vertical (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag is categorical: the guide promises an NLP greenwashing-detection engine (LDA topic coherence, `greenwashing_risk = w1·coherence_gap + w2·commitment_gap + w3·controversy_gap`, Oxford Net Zero credibility scoring), but the code is a sustainability-report *authoring* toolkit — Hero's-Journey mapper, tone spectrum, component-mix L1 gap — with no text ingested and no NLP anywhere. Evolution A builds the detection engine the module is named for, keeping the (honest, useful) authoring toolkit as a separate tab group.

**How.** (1) New route `api/v1/routes/narrative_intel.py` with `POST /analyze` accepting report text/PDF; the platform's existing NLP assets are the starting point — the DME sentiment pipeline and `nlp-disclosure-parser` module share this problem space, so reuse their extraction scaffolding rather than a parallel stack. (2) Implement the three documented gap components concretely: topic-share vs stated-priority divergence (TF-IDF topic shares are sufficient; LDA optional), pledge-vs-progress extraction (net-zero date, SBTi status regexed/parsed and compared to reported emissions trend from the refdata layer), and controversy-disclosure mismatch against ingested adverse-event data. (3) Weights `w1..w3` start documented-equal and get calibrated later against labelled cases (e.g. companies with public greenwashing enforcement actions under the EU Green Claims Directive regime).

**Prerequisites.** Corpus acquisition path for reports (upload-first; no scraping dependency); explicit model card per Atlas §8 since "greenwashing risk" is a reputationally loaded output. **Acceptance:** the same report text always yields the same score with a visible three-component decomposition; a synthetic test report with a deliberate pledge/progress contradiction scores measurably worse than its corrected twin.

### 9.2 Evolution B — Report-drafting copilot over the authoring toolkit (LLM tier 1)

**What.** The code that actually exists — six stakeholder journeys, tone-spectrum weights across 8 report sections, message hierarchy, the component-mix benchmark with its L1 `gap` metric — is a natural grounding corpus for a *drafting* copilot: "rewrite this section for the regulator audience at accountable-formal tone", "my risk section is 80% narrative / 10% data; the benchmark says 45/40 — what should I add?" This is the rare module where LLM generation is the product, but it must stay grounded in the page's frameworks, not free-write.

**How.** System prompt from this Atlas page plus the serialized `STAKEHOLDER_JOURNEYS`, `TONE_SECTIONS`, `MSG_LEVELS`, and `COMPONENT_MIX` constants; every suggestion must cite which framework element drove it (e.g. quoting the target mix numbers behind a recommendation). Rewrites operate only on user-supplied text. Critically, the copilot must not claim greenwashing-detection capability until Evolution A ships — a refusal path for "is this greenwashing?" pointing to the module's current scope is mandatory, given the guide's inflated description.

**Prerequisites.** None hard; this grounds entirely on existing hand-authored constants. **Acceptance:** every tone/mix recommendation traceable to a constant's values; "score this report for greenwashing" refuses pre-Evolution-A rather than improvising a score.