## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula — `alignment_score =
> Σ(activity_match_i × criteria_similarity_i × DNSH_equivalence_i) / n_activities` — describes a
> genuine activity-by-activity comparison of technical screening criteria (TSC) and DNSH provisions
> across taxonomies. **The code does not implement this.** Instead, every cell of the 30-activity ×
> 14-taxonomy crosswalk matrix (420 cells) is assigned a status (`Not Covered`/`Partial`/`Aligned`/
> `Fully Aligned`) and a confidence score by a **hash-seeded pseudo-random draw** — there is no TSC
> text comparison, no DNSH-equivalence check, and no activity-match logic. Real regulatory content
> exists only in the *static reference tables* (taxonomy metadata, SG amber thresholds, China
> catalogue, Japan roadmap, `QUANTIFIED_CONFLICTS` numeric thresholds) — not in the crosswalk engine
> or the "ML mapping" tab. Sections below describe what the code actually computes.

### 7.1 What the module computes

The page has 20 tabs; the analytical core is the **Crosswalk Matrix** (Tab 12) and its four
downstream derivatives (ML Mapping, Cosine Similarity, Conflict Resolver, Multi-Jur Stress). For
each of 30 activities × 14 taxonomies:

```js
h = hashStr(activity + taxonomyId)         // deterministic string hash (DJB2-style)
r = sr(h % 10000)                          // pseudo-random draw in [0,1)
status = r>0.85 ? 'Not Covered' : r>0.72 ? 'Partial' : r>0.35 ? 'Aligned' : 'Fully Aligned'
confidence = status-dependent band, e.g. Fully Aligned → 0.90 + sr(h+3)×0.09
```

US is hard-coded `N/A` for every activity (SEC climate rule stayed). Portfolio-level KPIs
(`avgConfidence`, `alignedPct`, `gapScore = (notCovered + 0.5×partial)/totalCells × 100`) are
aggregates over this synthetic matrix, not over real taxonomy text.

### 7.2 Parameterisation — tables of constants and their provenance

| Constant | Value | Provenance |
|---|---|---|
| 14 taxonomies (EU, UK, SG, ASEAN, CN, JP, MX, CO, BR, CL, ZA, IN, CA, US) | activity counts 0–246 | Real, named regulatory frameworks (EU Taxonomy Reg. 2020/852, UK SDR, MAS Singapore-Asia, ASEAN v3, China GIGC 2024, METI Transition Finance, SEC Climate Rule) — counts are plausible public figures, not verified against source PDFs |
| `CROSSWALK_MATRIX` status/confidence | random per cell | **Synthetic** — `hashStr`+`sr()` |
| `QUANTIFIED_CONFLICTS` (11 activities, numeric thresholds) | e.g. EU gas power 100 gCO₂e/kWh vs SG 250 | Named real thresholds (illustrative, not literal legal text) |
| `JURISDICTION_WEIGHTS` (gdp $T, aum $T, regPower, stringency) | e.g. EU gdp 18.4, aum 34.0 | Editorial estimates, no cited source |
| `ML_MODELS` (TaxoBERT-Crosswalk, ConflictGNN, ThresholdRegressor) | accuracy 0.82–0.91, latency 24–142ms | **Entirely fictional model cards** — no model is trained or called; these are static display rows |
| `STRESS_SCENARIOS` (6 scenarios, delta ±0.12–0.85, probability 0.28–0.55) | e.g. "US SEC rule fully enforced" delta +0.85 | Narrative/editorial, not derived from any model |

### 7.3 Calculation walkthrough

1. **Crosswalk cell** → `hashStr(activity+taxonomy)` seeds `sr()` twice (status draw, confidence
   jitter within the status's band).
2. **Portfolio stats** (`stats` `useMemo`) aggregate the *entire* unfiltered 420-cell matrix:
   `avgConfidence = Σconfidence / 420`, `alignedPct = count(Aligned|Fully Aligned)/420`.
3. **What-If Passport Router** (`whatIfAnalysis`): for a chosen seller/buyer jurisdiction pair,
   looks up each activity's cell for both, and returns `PASS` only if *both* sides show
   Aligned/Fully Aligned status — i.e. dual-recognition requires two independent random draws to
   both land in the top two status bands.
4. **Cosine Similarity** (Tab 15): each taxonomy gets a 30-dimension vector over `REG_TOKENS`
   (regulatory keywords like "dnsh", "threshold", "biodiversity"), with each dimension value
   `base = sr(h) × (0.5 + sr(h+1) × 1.5)` — again fully synthetic, not derived from actual taxonomy
   text-mining. `cosineSim(vecA, vecB) = dot(A,B) / (‖A‖·‖B‖)` is a textbook correct cosine-similarity
   formula, applied to synthetic vectors.
5. **Multi-Jurisdiction Stress** (Tab 20): applies a jurisdiction's `STRESS_SCENARIOS.delta` as a
   simple percentage shift to that jurisdiction's aggregate alignment metric — a scalar shock, not a
   re-run of the crosswalk logic.
6. **Portfolio Issuers** (30 synthetic names): each issuer gets independent `sr()`-drawn alignment
   percentages per taxonomy (`euAligned`, `ukAligned`, ...) and a `multiLabel` flag (`sr()>0.6`);
   `multiLabelPct` = share of issuers flagged multi-label.

### 7.4 Worked example

Activity = "Green Steel (H2-DRI)", taxonomy = "EU". Suppose `hashStr("Green Steel (H2-DRI)EU") = H`
resolves (illustratively) to `sr(H%10000) = 0.28`. Since `0.28 ≤ 0.35`, `status = 'Fully Aligned'`,
`confidence = 0.90 + sr(H+3)×0.09` — e.g. `sr(H+3)=0.40` → `confidence = 0.936`. For the *same*
activity under `QUANTIFIED_CONFLICTS`, the **real, named** threshold is EU ≤1.40 tCO₂/t crude steel
vs CN ≤1.85 tCO₂/t vs IN ≤2.10 tCO₂/t — this numeric comparison is genuine and independent of the
synthetic crosswalk cell; a reader comparing the "Fully Aligned" crosswalk cell against the
quantified conflict table would (correctly) notice the two sub-systems don't reconcile, because
they are unconnected code paths.

### 7.5 Companion analytics

- **SG Amber Thresholds, China Catalogue, Japan Roadmap, LATAM Cluster, SA/IFSCA, Canada
  Transition tiers, SEC Rule status** — all static reference tables with real-ish figures (e.g. SEC
  Items 1500–1507 marked "Stayed"/"Removed" reflecting the actual 2024 Fifth Circuit stay and
  dropped Scope 3 requirement).
- **Conflict list** (`CONFLICTS`, 15 rows) — narrative conflict descriptions with severity tags,
  independent of the crosswalk matrix's random statuses.

### 7.6 Data provenance & limitations

- The crosswalk matrix, portfolio issuers, cosine-similarity vectors, and ML model metrics are
  **entirely synthetic**, generated by `sr(s)=frac(sin(s+1)×10⁴)` seeded from `hashStr()` — stable
  across renders but disconnected from any real taxonomy document.
- `ML_MODELS` displays fabricated accuracy/F1/latency numbers with no underlying model — this is
  the clearest case of a **displayed-but-unimplemented quantity** on the page.
- Real content is confined to static lookup tables (activity counts, quantified thresholds,
  jurisdiction weights) that a production system would need to source from actual taxonomy legal
  texts and keep under version control as regulations amend.
- No DNSH-equivalence legal analysis, no activity-level TSC text comparison — both explicitly named
  in the guide's methodology brief but absent from the implementation.

**Framework alignment:** EU Taxonomy Regulation 2020/852 (baseline taxonomy referenced) · UK SDR
labelling regime (FCA) · MAS Singapore-Asia Taxonomy · ASEAN Taxonomy v3 (Foundation/Plus tiers) ·
China GIGC 2024 · Japan METI Transition Finance · US SEC Climate Rule (stayed). The module *names*
these frameworks correctly but does not compute alignment against their actual criteria — see §8.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Support portfolio managers and green-bond structurers who need to determine, for a specific
economic activity and issuer, whether financing recognised as "green" in one jurisdiction would
also qualify under a second jurisdiction's taxonomy — the "passport-in-passport-out" use case the
UI already exposes. Scope: activity-level technical screening criteria (TSC) comparison across the
14 tracked taxonomies, for corporate and sovereign green-bond/loan issuance.

### 8.2 Conceptual approach
Replace the random crosswalk with a **rules-based TSC comparator** augmented by an **NLP
similarity layer** for qualitative DNSH criteria — mirroring how MSCI's Taxonomy Alignment tool and
Climate Bonds Initiative's Taxonomy Comparison Tool work: (1) structured numeric thresholds
(carbon intensity, energy performance) are compared directly; (2) qualitative safeguard clauses
(minimum social safeguards, biodiversity DNSH) are embedding-matched using a legal-domain sentence
transformer (cf. CBI's manual taxonomy-mapping methodology, and the EU Platform on Sustainable
Finance's own cross-taxonomy comparability reports, which combine numeric TSC tables with
qualitative equivalence judgments).

### 8.3 Mathematical specification

For activity `a`, source taxonomy `S`, target taxonomy `T`:

```
NumericMatch(a,S,T) = 1  if Threshold_S(a) satisfies Threshold_T(a) direction & value
                     = Threshold_S(a) / Threshold_T(a)   (partial credit, clipped to [0,1])   otherwise

DNSHEquivalence(a,S,T) = cosine_sim(embed(DNSH_clause_S(a)), embed(DNSH_clause_T(a)))
                          — sentence-embedding similarity (e.g. legal-BERT), threshold 0.75 = equivalent

AlignmentScore(a,S,T) = w1×NumericMatch + w2×DNSHEquivalence + w3×MinSafeguardsMatch(S,T)
   w1=0.5, w2=0.3, w3=0.2   (numeric criteria weighted highest; calibrate via regulator SME review)

PassportDecision(a,S,T) = PASS   if AlignmentScore ≥ 0.80
                          PARTIAL if 0.55 ≤ AlignmentScore < 0.80
                          FAIL    if AlignmentScore < 0.55
```

| Parameter | Calibration source |
|---|---|
| Numeric thresholds `Threshold_X(a)` | Official taxonomy delegated acts / regulator technical annexes (EU CCM/CCA Delegated Regulation Annexes, MAS Singapore-Asia Taxonomy, China GIGC catalogue) |
| DNSH clause text | Regulator-published taxonomy PDFs, ingested and chunked per activity |
| Embedding model | Public legal-domain sentence transformer (e.g. Legal-BERT or `all-mpnet-base-v2`) — free/open source |
| Equivalence threshold (0.75) | Calibrated against a labelled set of known-equivalent clause pairs (EU vs UK SDR is the best-documented pair; CBI publishes a comparability opinion) |
| Weights w1/w2/w3 | Expert elicitation; should be validated via backtesting against CBI's published taxonomy comparability opinions where available |

### 8.4 Data requirements
- **Structured TSC tables** per taxonomy per activity — vendor: none free at full coverage; build
  in-house from regulator PDFs (EU Commission, MAS, NDRC, METI, FCA); CBI publishes some
  comparison tables free.
- **DNSH/safeguard clause text** — same regulator source documents, OCR/parsed to per-activity
  paragraphs.
- **Existing platform assets that can seed this**: `reference_data` tables already ingest SBTi,
  CBI, EU Taxonomy Compass data (per platform memory) — the EU Taxonomy Compass activity list is
  the natural anchor table; the DNSH clause corpus and non-EU taxonomy tables still need sourcing.

### 8.5 Validation & benchmarking plan
- **Backtest** against CBI's and the EU Platform on Sustainable Finance's *published* taxonomy
  comparability assessments (EU–UK, EU–ASEAN are the most documented pairs) — the model's
  PASS/PARTIAL/FAIL should agree with these expert opinions on ≥90% of activities where a published
  opinion exists.
- **Sensitivity test**: perturb `w1/w2/w3` ±0.1 and confirm PASS/FAIL decisions are stable for
  activities away from the 0.55/0.80 boundaries; flag boundary-sensitive activities for manual
  legal review rather than automated decisioning.
- **Stability test**: re-run DNSH embedding similarity under paraphrased/machine-translated clause
  text (non-English taxonomies) to confirm the embedding model's robustness to translation noise.

### 8.6 Limitations & model risk
- Embedding-based DNSH equivalence is a **screening aid, not a legal opinion** — dual-label bond
  structuring must still be reviewed by qualified counsel in each jurisdiction; the model should
  always surface its confidence and underlying clause text, never a bare PASS/FAIL.
- Numeric TSC tables must be version-controlled per regulation-amendment date; if a source document
  update is missed, thresholds silently go stale — build a source-checksum/last-verified date field
  and surface it in the UI, replacing the current fabricated "LAST SYNC" timestamp.
