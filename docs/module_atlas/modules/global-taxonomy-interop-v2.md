# Global Taxonomy Interoperability v2
**Module ID:** `global-taxonomy-interop-v2` · **Route:** `/global-taxonomy-interop-v2` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Advanced cross-taxonomy interoperability analytics comparing EU Taxonomy, ICMA Green Bond Principles, ASEAN Taxonomy, UK GTF, Singapore-Asia Taxonomy, and China Green Bond Standard across activity definitions, DNSH principles, and transition activity treatment. Quantifies cross-taxonomy alignment scores and identifies mutual recognition pathways.

> **Business value:** Used by green bond structurers, multi-jurisdictional issuers, and sustainable finance regulators to navigate taxonomy fragmentation and structure dual-label green instruments for global distribution.

**How an analyst works this module:**
- Select two or more taxonomies to compare
- Review activity alignment matrix and identify divergent TSC conditions
- Analyse DNSH equivalence and transition activity treatment differences
- Generate interoperability report for dual-label green bond issuance

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASEANTab`, `ASEAN_TIERS`, `ArbitrageLabTab`, `CANADA_TRANSITION`, `CHINA_CATALOGUE`, `CONFLICTS`, `CROSSWALK_ACTIVITIES`, `CROSSWALK_MATRIX`, `CanadaTab`, `ChinaTab`, `ConflictResolverTab`, `CosineSimilarityTab`, `CrosswalkMatrixTab`, `EUBaselineTab`, `HarmonizationGapTab`, `JAPAN_ROADMAP`, `JURISDICTION_WEIGHTS`, `JapanTab`, `KpiCard`, `LATAMTab`, `LATAM_CLUSTER`, `MLEngineTab`, `ML_MODELS`, `MultiJurStressTab`, `OverviewTab`, `PORTFOLIO_ISSUERS`, `Panel`, `PassportRouterTab`, `Pill`, `PortfolioTab`, `QUANTIFIED_CONFLICTS`, `REG_TOKENS`, `SA_IFSCA`, `SEC_RULES`, `SG_AMBER_THRESHOLDS`, `STRESS_SCENARIOS`, `SingaporeTab`, `TAB_LIST`, `TAXONOMIES`, `TAXONOMY_TOKEN_AFFINITY`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TAXONOMIES` | 15 | `name`, `flag`, `status`, `activities`, `color`, `year`, `regulator` |
| `UK_LABELS` | 5 | `name`, `aum`, `funds`, `threshold`, `desc`, `color`, `icon` |
| `SG_AMBER_THRESHOLDS` | 9 | `sector`, `greenBy`, `amberUntil`, `criteria`, `status` |
| `ASEAN_TIERS` | 3 | `scope`, `coverage`, `activities`, `threshold`, `color` |
| `CHINA_CATALOGUE` | 7 | `subcats`, `activities` |
| `JAPAN_ROADMAP` | 11 | `milestone2030`, `milestone2050`, `capexJPY` |
| `LATAM_CLUSTER` | 5 | `taxonomy`, `published`, `activities`, `sectors`, `status`, `gfGap` |
| `SA_IFSCA` | 3 | `framework`, `published`, `activities`, `sectors`, `regulator`, `notes` |
| `CANADA_TRANSITION` | 3 | `activities`, `definition`, `threshold` |
| `SEC_RULES` | 9 | `desc`, `status` |
| `CONFLICTS` | 16 | `activity`, `taxA`, `taxB`, `thresholdA`, `thresholdB`, `severity` |
| `ML_MODELS` | 4 | `type`, `accuracy`, `f1`, `coverage`, `trainedOn`, `latencyMs` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pct` | `(v, d=1) => (Number.isFinite(v) ? v.toFixed(d) + '%' : '—');` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `totalConf` | `CROSSWALK_MATRIX.reduce((s, c) => s + c.confidence, 0);` |
| `avgConf` | `totalCells > 0 ? totalConf / totalCells : 0;` |
| `multiLabelPct` | `PORTFOLIO_ISSUERS.length > 0 ? (PORTFOLIO_ISSUERS.filter(p => p.multiLabel).length / PORTFOLIO_ISSUERS.length) * 100 : 0;` |
| `totalActivities` | `TAXONOMIES.reduce((s, t) => s + t.activities, 0);` |
| `gapScore` | `totalCells > 0 ? ((notCov + partial * 0.5) / totalCells) * 100 : 0;` |
| `whatIfAnalysis` | `useMemo(() => { const rows = CROSSWALK_ACTIVITIES.map(act => { const seller = CROSSWALK_MATRIX.find(c => c.activity === act && c.taxonomy === sellerJurisdiction);` |
| `taxByActivities` | `useMemo(() => TAXONOMIES.map(t => ({ name:t.id, activities:t.activities, color:t.color })), []);` |
| `confBySource` | `useMemo(() => TAXONOMIES.map(t => {` |
| `rows` | `CROSSWALK_MATRIX.filter(c => c.taxonomy === t.id && c.status !== 'N/A');` |
| `avg` | `rows.length > 0 ? rows.reduce((s, c) => s + c.confidence, 0) / rows.length : 0;` |
| `adoption` | `AMS.map((c, i) => ({ country:c, foundation: sr(i*11) > 0.3 ? 1 : 0, plus: sr(i*11+1) > 0.6 ? 1 : 0 }));` |
| `catData` | `CHINA_CATALOGUE.map(c => ({ name: c.cat.split(' ')[0], activities: c.activities }));` |
| `capexTotal` | `JAPAN_ROADMAP.reduce((s, r) => s + r.capexJPY, 0);` |
| `conflictActs` | `CONFLICTS.map(c => c.activity);` |
| `passConf` | `cell.confidence >= confidenceFloor \|\| cell.status === 'Not Covered' \|\| cell.status === 'N/A';` |
| `actMappings` | `useMemo(() => { return TAXONOMIES.map(t => { const cell = CROSSWALK_MATRIX.find(c => c.activity === selectedActivity && c.taxonomy === t.id);` |
| `radarData` | `actMappings.filter(a => a.taxonomy !== 'US').map(a => ({ subject: a.taxonomy, confidence: a.confidence }));` |
| `modelComparisonData` | `ML_MODELS.map(m => ({ name: m.name.split('-')[0], acc: m.accuracy * 100, f1: m.f1 * 100, latency: m.latencyMs }));` |
| `portfolioSummary` | `useMemo(() => { const totalAum = PORTFOLIO_ISSUERS.reduce((s, p) => s + p.aum, 0);` |
| `euAvg` | `PORTFOLIO_ISSUERS.reduce((s, p) => s + p.euAligned, 0) / Math.max(1, PORTFOLIO_ISSUERS.length);` |
| `ukAvg` | `PORTFOLIO_ISSUERS.reduce((s, p) => s + p.ukAligned, 0) / Math.max(1, PORTFOLIO_ISSUERS.length);` |
| `sgAvg` | `PORTFOLIO_ISSUERS.reduce((s, p) => s + p.sgAligned, 0) / Math.max(1, PORTFOLIO_ISSUERS.length);` |
| `cnAvg` | `PORTFOLIO_ISSUERS.reduce((s, p) => s + p.cnAligned, 0) / Math.max(1, PORTFOLIO_ISSUERS.length);` |
| `jpAvg` | `PORTFOLIO_ISSUERS.reduce((s, p) => s + p.jpAligned, 0) / Math.max(1, PORTFOLIO_ISSUERS.length);` |
| `aseanAvg` | `PORTFOLIO_ISSUERS.reduce((s, p) => s + p.aseanAligned, 0) / Math.max(1, PORTFOLIO_ISSUERS.length);` |
| `LABEL_DATA` | `UK_LABELS.map(l => ({ name: l.id, aum: l.aum, funds: l.funds, color: l.color }));` |
| `denom` | `Math.sqrt(na) * Math.sqrt(nb);` |
| `vecForTaxonomy` | `(tx) => REG_TOKENS.map((tok, i) => {` |
| `base` | `sr(h) * (0.5 + sr(h + 1) * 1.5);` |
| `simMatrix` | `useMemo(() => { return TAXONOMIES.map(tA => ({ id: tA.id, row: TAXONOMIES.map(tB => ({ id: tB.id, sim: tA.id === tB.id ? 1 : cosineSim(vectors[tA.id], vectors[tB.id]), })), }));` |
| `clusters` | `useMemo(() => { const nodes = TAXONOMIES.map(t => ({ id: t.id, members: [t.id] }));` |
| `sorted` | `[...pairs].sort((x, y) => y.sim - x.sim);` |
| `targetClusters` | `Math.max(2, Math.min(cosineCluster, 10));` |
| `strongestPair` | `useMemo(() => { let best = { a:'', b:'', sim:-1 };` |
| `vals` | `conflict.points.map(p => ({ ...p, weight: JURISDICTION_WEIGHTS[p.jur] ? (JURISDICTION_WEIGHTS[p.jur].gdp + JURISDICTION_WEIGHTS[p.jur].aum) : 1 }));` |
| `wsum` | `vals.reduce((a, p) => a + p.weight, 0);` |
| `sortedPts` | `useMemo(() => { const pts = active.points.map(p => ({ ...p, weight: JURISDICTION_WEIGHTS[p.jur]?.gdp + JURISDICTION_WEIGHTS[p.jur]?.aum \|\| 1 }));` |
| `loosest` | `sortedPts[sortedPts.length - 1];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AMS`, `ASEAN_TIERS`, `CANADA_TRANSITION`, `CHINA_CATALOGUE`, `CONFLICTS`, `CROSSWALK_ACTIVITIES`, `EU_OBJECTIVES`, `EU_STEPS`, `JAPAN_ROADMAP`, `LATAM_CLUSTER`, `ML_MODELS`, `QUANTIFIED_CONFLICTS`, `REG_TOKENS`, `SA_IFSCA`, `SEC_RULES`, `SG_AMBER_THRESHOLDS`, `STRESS_SCENARIOS`, `TAB_LIST`, `TAXONOMIES`, `TIMELINE`, `UK_LABELS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Cross-Taxonomy Alignment Score | `Σ(matched_activities) / total_activities × criteria_similarity` | Taxonomy TSC comparison matrix | EU-ASEAN alignment ~55%; EU-UK ~85%; low scores indicate significant investor confusion risk in cross-border green finance. |
| Transition Activity Divergence Index | `1 − Jaccard_similarity(transition_activities_A, transition_activities_B)` | Taxonomy transition activity lists | High divergence (>0.6) means transition activities acceptable in one taxonomy are ineligible in another; critical for cross-border issuance. |
| DNSH Mutual Recognition Rate | `DNSH_conditions_equivalent / DNSH_conditions_total × 100` | Legal/regulatory analysis | Proportion of DNSH conditions in taxonomy B that achieve equivalent environmental protection to EU DNSH; used for dual-label bond structuring. |
- **EU/ASEAN/UK/MAS/China taxonomy documentation → activity/TSC matrices** → Activity matching algorithm → criteria similarity scoring → DNSH equivalence analysis → **Cross-taxonomy alignment report for green bond structuring and investor disclosure**

## 5 · Intermediate Transformation Logic
**Methodology:** Cross-Taxonomy Alignment Scoring
**Headline formula:** `alignment_score = Σ(activity_match_i × criteria_similarity_i × DNSH_equivalence_i) / n_activities`

Activity-level alignment is assessed by comparing technical screening criteria (TSC) across taxonomies for matched activities. DNSH equivalence scoring checks whether a taxonomy's environmental safeguards achieve equivalent outcomes to EU DNSH criteria, even if the specific conditions differ. Transition activity divergence analysis maps how each taxonomy treats "amber" or "transition" activities with time-limited eligibility, a key point of regulatory fragmentation.

**Standards:** ['EU Taxonomy Regulation 2020/852', 'ASEAN Taxonomy for Sustainable Finance v2 (2023)', 'MAS Singapore-Asia Taxonomy 2023']
**Reference documents:** EU Taxonomy Regulation 2020/852 Climate Delegated Act; ASEAN Taxonomy for Sustainable Finance Version 2 (2023); Singapore-Asia Taxonomy for Sustainable Finance (MAS 2023); CBI Climate Bonds Standard Version 4.0

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Real TSC/DNSH comparison replacing the hash-seeded crosswalk (analytics ladder: rung 1 → 3)

**What.** §7 flags a severe mismatch. The guide's formula (`alignment_score = Σ(activity_match × criteria_similarity × DNSH_equivalence)/n_activities`) describes a genuine activity-by-activity TSC and DNSH comparison across taxonomies, but the code fills all 420 crosswalk cells (30 activities × 14 taxonomies) with hash-seeded pseudo-random status and confidence — no TSC text comparison, no DNSH-equivalence check. Worse, the `ML_MODELS` tab displays fabricated accuracy/F1/latency for models that don't exist (the clearest displayed-but-unimplemented case), and the cosine-similarity vectors are `sr()`-seeded. Only the static reference tables (taxonomy metadata, SG amber thresholds, China catalogue, Japan roadmap, `QUANTIFIED_CONFLICTS` thresholds) are real. Evolution A builds the actual comparison: encode each taxonomy's TSC and DNSH provisions per activity as structured criteria, compute criteria similarity and DNSH equivalence from those, and derive the alignment score — deleting the hash-seeded matrix and the fake ML metrics.

**How.** (1) A structured TSC/DNSH table per taxonomy-activity (from legal texts, version-controlled). (2) `criteria_similarity` from threshold/condition comparison; `DNSH_equivalence` from a mapped-outcomes check; alignment computed per the §5 formula. (3) Real embeddings for the cosine-similarity tab (or remove it); the `ML_MODELS` tab either backed by a genuine classifier with honest metrics or deleted — fabricated model stats must not ship.

**Prerequisites.** Digitised TSC/DNSH criteria for the covered taxonomies (major undertaking; start with EU/UK/SG/China/ASEAN); the hash-seeded matrix and fake ML metrics removed as §7-flagged fabrications. **Acceptance:** alignment scores recompute from structured TSC/DNSH data reproducing the §5 formula; no `sr()`/hash-seeded value drives a crosswalk cell; the ML tab shows real metrics or is gone.

### 9.2 Evolution B — Dual-label green-bond structuring copilot (LLM tier 2)

**What.** A copilot for green-bond structurers: "can this solar-plus-storage activity carry both an EU Taxonomy and Singapore-Asia label, and where do the TSC thresholds diverge?" tool-calls the Evolution A crosswalk/conflict endpoints and narrates the divergent conditions and DNSH-equivalence findings, drafting the interoperability report for dual-label issuance.

**How.** Tier-2 tool-calling over the alignment and conflict-resolver endpoints; the grounding corpus is §5/§7 (EU Taxonomy 2020/852, ASEAN v2/v3, MAS Singapore-Asia, CBI Standard v4, China GIGC are cited). The copilot's value is navigating taxonomy fragmentation — mapping where a single activity clears multiple regimes. Guardrail, pre-Evolution-A: because the crosswalk is hash-seeded and the ML metrics fabricated, the copilot must refuse alignment-score and model-performance questions, using only the real static reference tables (amber thresholds, quantified conflicts).

**Prerequisites.** Evolution A (no real alignment computation today); corpus embedding. **Acceptance:** post-Evolution-A, every alignment and conflict figure traces to a tool call over structured TSC data; pre-Evolution-A the copilot declines crosswalk-score questions and never cites the fabricated ML metrics.