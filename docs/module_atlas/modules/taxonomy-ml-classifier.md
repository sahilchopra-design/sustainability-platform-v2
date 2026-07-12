# Taxonomy ML Classifier
**Module ID:** `taxonomy-ml-classifier` · **Route:** `/taxonomy-ml-classifier` · **Tier:** B (frontend-computed) · **EP code:** EP-DI4 · **Sprint:** DI

## 1 · Overview
ML-powered EU Taxonomy NACE activity classifier that maps NACE codes to eligible Taxonomy activities, automates DNSH screening criteria checking, and scores substantial contribution threshold compliance. Trained on the EU Taxonomy Compass dataset covering 67 climate mitigation activities across 6 environmental objectives.

> **Business value:** Used by portfolio managers, sustainability controllers, and SFDR/Taxonomy report authors to automate the complex NACE-to-activity mapping process and generate audit-ready Taxonomy alignment KPIs.

**How an analyst works this module:**
- Upload company NACE codes or connect company database
- Run ML classifier to map activities to Taxonomy eligibility
- Review DNSH screening results and substantial contribution scores
- Export Taxonomy KPI report (eligibility %, alignment %, CapEx/OpEx split)

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AB_MODELS`, `AB_TRAFFIC`, `AUDIT_LOG`, `AbTestingTab`, `AutoTagTab`, `BatchTab`, `CALIBRATION_BINS`, `CalibrationTab`, `Card`, `ConceptDriftTab`, `ConfusionMatrixTab`, `DNSH_CRITERIA`, `DRIFT_METRICS`, `DRIFT_WINDOWS`, `DnshTab`, `DriftTab`, `EnsembleTab`, `FEATURES`, `FEATURE_CATEGORIES`, `FRAMEWORKS`, `FeatImpTab`, `FeatureEngTab`, `GovernanceTab`, `ISSUERS`, `KpiCard`, `METRIC_THRESHOLDS`, `MODELS`, `NACE_ACTIVITIES`, `NLP_DOCUMENTS`, `NlpTab`, `OverviewTab`, `PD_BINS`, `PermImpPdpTab`, `Pill`, `ProbCalibTab`, `REVIEW_QUEUE`, `ReviewTab`, `RocPrLiftTab`, `SectionHeader`, `StatusPill`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MODELS` | 6 | `name`, `type`, `accuracy`, `precision`, `recall`, `f1`, `auc`, `trainTime`, `rows`, `retrained`, `features`, `depth`, `nEstimators`, `lr`, `status` |
| `FEATURES` | 32 | `cat`, `type`, `missing`, `imp`, `desc` |
| `NACE_ACTIVITIES` | 21 | `name`, `obj`, `threshold`, `prob` |
| `NLP_DOCUMENTS` | 12 | `name`, `type`, `pages`, `tokens`, `tagsFound`, `confidence`, `activities`, `greenwashFlags`, `date` |
| `DNSH_CRITERIA` | 6 | `name`, `checks` |
| `FRAMEWORKS` | 7 | `name`, `coverage`, `mapped` |
| `DRIFT_WINDOWS` | 2 | `label`, `seedOffset` |
| `AB_MODELS` | 2 | `name`, `auc`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `FEATURE_CATEGORIES` | `['Financial', 'Emissions', 'Governance', 'Text/NLP', 'Sector/NACE', 'Geographic'];` |
| `regions` | `['EU-DE', 'EU-FR', 'EU-NL', 'EU-IT', 'EU-ES', 'EU-SE', 'EU-FI', 'EU-DK', 'EU-PL', 'EU-IE'];` |
| `rev` | `500 + sr(i + 1) * 45000;` |
| `emis` | `sector === 'Utilities' ? 180 + sr(i + 2) * 400 : sector === 'Industrials' ? 80 + sr(i + 3) * 220 : 15 + sr(i + 4) * 90;` |
| `align` | `sr(i + 5) * 0.85 + (sector === 'Utilities' ? 0.1 : 0);` |
| `conf` | `0.55 + sr(i + 6) * 0.4;` |
| `_TAX_ACT_MAP` | `Object.fromEntries(EU_TAXONOMY_ACTIVITIES.map(a => [a.activity_name, a]));` |
| `TSC_THRESHOLDS` | `NACE_ACTIVITIES.slice(0, 12).map((a, i) => ({` |
| `filtered` | `useMemo(() => catFilter === 'ALL' ? sortedFeatures : sortedFeatures.filter(f => f.cat === catFilter), [sortedFeatures, catFilter]);  const missingData = useMemo(() => [...FEATURES].sort((a, b) => b.missing - a.missing).slice(0, 12), []);` |
| `filteredIssuers` | `useMemo(() => sectorFilter === 'ALL' ? ISSUERS : ISSUERS.filter(i => i.sector === sectorFilter), [sectorFilter]); const sectors = useMemo(() => ['ALL', ...Array.from(new Set(ISSUERS.map(i => i.sector)))], []);` |
| `portfolioAlignment` | `useMemo(() => { const threshold = confThreshold / 100;` |
| `revSum` | `filteredIssuers.reduce((a, b) => a + b.revenue, 0);` |
| `alignedRev` | `aligned.reduce((a, b) => a + b.revenue * b.aligned, 0);` |
| `avgConfidence` | `useMemo(() => { return filteredIssuers.length ? filteredIssuers.reduce((a, b) => a + b.confidence, 0) / filteredIssuers.length * 100 : 0;` |
| `ensembleVote` | `useMemo(() => { const total = Object.values(ensembleWeights).reduce((a, b) => a + b, 0);` |
| `lgb` | `clamp(iss.aligned + (sr(hashStr(iss.id) + 1) - 0.5) * 0.08, 0, 1);` |
| `blended` | `(xgb * ensembleWeights.xgb + lgb * ensembleWeights.lgb + rf * ensembleWeights.rf + nn * ensembleWeights.nn) / w;` |
| `predLo` | `i / bins, predHi = (i + 1) / bins;` |
| `mid` | `(predLo + predHi) / 2;` |
| `actual` | `clamp(mid + (sr(i + 301) - 0.5) * 0.11, 0, 1);` |
| `rocData` | `useMemo(() => { return Array.from({ length: 21 }, (_, i) => { const thr = i / 20;` |
| `fpr` | `clamp(1 - Math.pow(thr, 1.2) + sr(i + 401) * 0.03, 0, 1);` |
| `tpr` | `clamp(1 - Math.pow(thr, 3.5) + sr(i + 402) * 0.02, 0, 1);` |
| `sortedFeatures` | `useMemo(() => [...FEATURES].sort((a, b) => b.imp - a.imp), []);` |
| `framework` | `useMemo(() => FRAMEWORKS, []);  const dnshRadar = useMemo(() => { return DNSH_CRITERIA.map(c => { const score = 55 + ((hashStr(issuer.id + c.id) % 100) * 0.45);` |
| `modelComparison` | `useMemo(() => MODELS.map(m => ({` |
| `learningCurve` | `useMemo(() => Array.from({ length: 20 }, (_, i) => { const rows = (i + 1) * 9000;` |
| `train` | `0.72 + (1 - Math.exp(-i * 0.28)) * 0.22;` |
| `valid` | `0.68 + (1 - Math.exp(-i * 0.21)) * 0.22;` |
| `std` | `0.04 + sr(i + 201) * 0.08;` |
| `partial` | `clamp(0.15 + sr(i + 203) * 0.15, 0, 1);` |
| `non` | `clamp(1 - a.prob - partial, 0, 1);` |
| `verdict` | `a.prob > 0.85 ? 'Aligned' : a.prob > 0.6 ? 'Partial' : 'Non-Aligned';` |
| `passRates` | `useMemo(() => DNSH_CRITERIA.map(c => {` |
| `score` | `55 + ((hashStr(issuer.id + selCrit.id + i) % 100) * 0.45);` |
| `ece` | `useMemo(() => calibrationData.reduce((a, b) => a + b.ece * b.samples, 0) / Math.max(1, calibrationData.reduce((a, b) => a + b.samples, 0)), [calibrationData]);` |
| `total` | `sortedFeatures.reduce((a, b) => a + b.imp, 0);` |
| `mean` | `vals.reduce((a, b) => a + b, 0) / 4;` |
| `variance` | `vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 4;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AB_MODELS`, `AB_TRAFFIC`, `DNSH_CRITERIA`, `DRIFT_WINDOWS`, `FEATURES`, `FEATURE_CATEGORIES`, `FRAMEWORKS`, `METRIC_THRESHOLDS`, `MODELS`, `NACE_ACTIVITIES`, `NLP_DOCUMENTS`, `TAB_LABELS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Taxonomy Eligibility Rate | `eligible_revenue / total_revenue × 100` | EU Taxonomy Compass + company NACE codes | Proportion of revenues from NACE activities that are listed in the Taxonomy; does not imply alignment. |
| Taxonomy Alignment Rate | `aligned_revenue / total_revenue × 100` | DNSH screening + SC threshold assessment | Subset of eligible revenue that also meets SC thresholds and passes all DNSH checks; the key reported KPI under SFDR and Taxonomy regulation. |
| DNSH Pass Rate | `activities_DNSH_pass / activities_eligible × 100` | Technical Screening Criteria per activity | Proportion of eligible activities passing all 6 DNSH criteria; low rates indicate environmental risk exposure in the portfolio. |
- **Company NACE codes → EU Taxonomy Compass activity list** → ML classifier → SC threshold scoring → DNSH criteria check → **Taxonomy KPIs: eligibility %, alignment %, CapEx/OpEx breakdown**

## 5 · Intermediate Transformation Logic
**Methodology:** NACE-to-Taxonomy Activity Classification
**Headline formula:** `eligibility_score = P(eligible | NACE_code) × SC_threshold_score × DNSH_pass_rate`

A gradient-boosted classifier trained on the EU Taxonomy Compass maps NACE 4-digit codes to eligible activities with a probability score. Substantial contribution (SC) scores are calculated against quantitative thresholds (e.g., GHG intensity <100 gCO2e/kWh for electricity generation). DNSH screening checks the six DNSH criteria for each activity against available data, flagging gaps where evidence is insufficient.

**Standards:** ['EU Taxonomy Regulation 2020/852', 'Climate Delegated Act 2021/2139', 'EU Taxonomy Compass Dataset']
**Reference documents:** EU Taxonomy Regulation 2020/852; Climate Delegated Act (EU) 2021/2139 – Technical Screening Criteria; EU Taxonomy Compass – eligible activities database

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a trained gradient-boosted classifier with
> formula `eligibility_score = P(eligible|NACE) × SC_threshold_score × DNSH_pass_rate`. **No trained
> model exists anywhere in this codebase.** The "ML classifier" is an elaborate **simulated MLOps
> dashboard**: 6 "models" (XGBoost, Random Forest, LightGBM, Logistic Regression, MLP, Gradient
> Boosting) have their accuracy/precision/recall/F1/AUC/hyperparameters **hard-coded as literals**
> (lines 18–24), and per-issuer `aligned`/`confidence` scores are `sr()`-seeded random draws — not
> outputs of `P(eligible|NACE) × SC_threshold_score × DNSH_pass_rate` or any classifier inference.
> Most strikingly, the "4-model ensemble" comparison (§7.3) derives all four models' "predictions"
> from **the same single random number** with small independent perturbations added — i.e. it
> simulates model *disagreement* by jittering one value, not by running four different models.

### 7.1 What the module computes

40 synthetic issuers (`ISSUERS`) across 10 sectors, each assigned a NACE activity code and independently
`sr()`-seeded `revenue`, `emis` (sector-conditioned emissions intensity — Utilities highest,
Industrials mid, others lowest, a reasonable *qualitative* ordering), `align` (0–0.95, +0.10 bump for
Utilities), and `conf` (0.55–0.95 confidence). 21 real EU Taxonomy Compass NACE activities
(`NACE_ACTIVITIES`, e.g. D35.11 solar PV, offshore wind, nuclear, natural gas transitional) each with
an accurate real TSC threshold description and a static `prob` (0.43–0.99, plausible per-activity
eligibility probability, e.g. natural gas 0.54 vs. wind 0.99 — directionally consistent with how
contentious/conditional each activity's Taxonomy status actually is). 32 ML "features"
(`FEATURES`) with realistic names, missing-data %, and importance scores. 6 model metadata rows
(`MODELS`) with full hyperparameter sets.

### 7.2 Genuine aggregation formulas (over synthetic inputs)

```js
portfolioAlignment = Σ (revenue_i × aligned_i) / Σ revenue_i × 100     // revenue-weighted, over issuers passing
                                                                          // aligned≥0.5 AND confidence≥threshold
avgConfidence  = mean(confidence_i) × 100
dnshPassRate   = count(dnshPass_i) / count(i) × 100
```

These are correctly-implemented, revenue-weighted portfolio roll-ups (with a `revSum>0` guard) — the
arithmetic pattern is genuine and matches how a real Taxonomy-alignment portfolio metric should be
computed. The inputs being aggregated (`aligned`, `confidence`, `dnshPass` per issuer) are the
problem: they are `sr()`-seeded random draws, not classifier outputs.

### 7.3 The "4-model ensemble" (fabricated model disagreement)

```js
xgb = iss.aligned                                              // the base random value, unperturbed
lgb = clamp(iss.aligned + (sr(hash(id)+1)-0.5)×0.08, 0, 1)      // ± up to 4pp noise
rf  = clamp(iss.aligned + (sr(hash(id)+2)-0.5)×0.12, 0, 1)      // ± up to 6pp noise
nn  = clamp(iss.aligned + (sr(hash(id)+3)-0.5)×0.10, 0, 1)      // ± up to 5pp noise
blended = (xgb×w_xgb + lgb×w_lgb + rf×w_rf + nn×w_nn) / Σw       // user-adjustable weighted ensemble
```

All four "models" are the **same underlying random number**, each perturbed by an independent small
noise term keyed to a hash of the issuer ID. This produces a chart that *looks like* four
independently-trained models disagreeing on a prediction, but there is no actual model diversity —
perturbation magnitude (8–12pp) is simply a design choice to make the visual spread look plausible.
The user-adjustable `ensembleWeights` slider genuinely recomputes the weighted blend (correct
weighted-average arithmetic, `Σw` guarded), but blending four correlated-by-construction noise
variants doesn't reduce variance the way a real ensemble of independently-trained models would.

### 7.4 Other simulated ML-diagnostic charts

```js
learningCurve.train(i) = 0.72 + (1−exp(−i×0.28))×0.22          // asymptotic exponential convergence, i=epoch
learningCurve.valid(i) = 0.68 + (1−exp(−i×0.21))×0.22          // slower convergence, lower asymptote (plausible overfitting gap)
rocData.fpr(thr) = 1 − thr^1.2 + noise                          // power-law-shaped, NOT from actual score/label pairs
rocData.tpr(thr) = 1 − thr^3.5 + noise                          // steeper power → higher AUC "look"
```

These are **hand-crafted parametric curves shaped to resemble real ML diagnostics** (a converging
train/validation learning curve with a realistic generalisation gap; an ROC curve whose TPR falls off
faster than FPR, mimicking a high-AUC classifier) rather than curves computed from actual model
predictions vs. ground truth. The shapes are qualitatively plausible but the specific curvature
exponents (1.2 for FPR, 3.5 for TPR) are arbitrary constants chosen to produce a good-looking ROC, not
derived from any evaluation run.

### 7.5 Worked example

Issuer `i=0` ('Orsted Wind Power', sector 'Utilities', NACE 'D35.11'): `align = sr(5)×0.85 + 0.10`
(Utilities bump). `sr(5) = frac(sin(6)×10⁴)`; `sin(6)≈-0.279`, ×10⁴=-2794, frac≈0.06 →
`align ≈ 0.06×0.85+0.10 = 0.151`. With `revenue = 500+sr(1)×45000`; `sr(1)=frac(sin(2)×10⁴)`,
`sin(2)≈0.909`, ×10⁴=9093, frac≈0.03 → `revenue≈500+0.03×45000≈1850`. For this single issuer's
contribution to `alignedRev`: `1850×0.151≈279` — a small numerator contribution despite Orsted being
a real-world Taxonomy-alignment leader (its actual disclosed EU Taxonomy alignment is well above
90%). This illustrates the core risk of the synthetic data: **a company whose real-world alignment
score is very high can be assigned an arbitrarily low synthetic score**, since `align` has no
relationship to the issuer's real identity or NACE activity beyond the flat +0.10 Utilities bump.

### 7.6 Data provenance & limitations

- **No trained model exists.** All model metrics (accuracy 81–92%, AUC 0.87–0.96, hyperparameters,
  training times, row counts) are hard-coded literals presented as if from real training runs.
- **All issuer-level alignment/confidence/DNSH-pass values are `sr()`/hash-seeded synthetic data**,
  disconnected from the real company names attached to them.
- The "ensemble" is four perturbed copies of one random number, not four independent model outputs —
  presenting it as model diversity is the most significant documentation risk in this module.
- ROC/learning-curve shapes are parametrically hand-tuned to look realistic, not computed from
  predictions vs. labels.
- The 21 `NACE_ACTIVITIES` and their TSC threshold descriptions are accurate, real EU Taxonomy
  Compass content — this reference layer is genuinely trustworthy even though the "classifier" built
  on top of it is not.

**Framework alignment:** EU Taxonomy Regulation 2020/852 and the Climate Delegated Act 2021/2139 are
correctly cited, and the NACE activity/threshold reference table is accurate. The guide's
`eligibility_score = P(eligible|NACE) × SC_threshold_score × DNSH_pass_rate` formula names a
sound production architecture (probability × threshold-compliance × DNSH-compliance, each estimable
from real data), but the current implementation would need to replace every synthetic score with an
actual trained classifier output and genuine DNSH/TSC assessment logic — none of which exists today.

## 9 · Future Evolution

### 9.1 Evolution A — A real classifier behind the MLOps dashboard (analytics ladder: rung 1 → 4)

**What.** The §7 flag is the platform's starkest: no trained model exists — the 6 models' accuracy/AUC/hyperparameters are hard-coded literals, per-issuer `aligned`/`confidence` are `sr()`-seeded draws (assigning Orsted ~15% alignment when its real disclosed figure exceeds 90%, §7.5), the "4-model ensemble" is one random number perturbed four ways (§7.3), and the ROC/learning curves are hand-tuned parametric shapes. Yet the module owns two genuine assets: correct revenue-weighted roll-up arithmetic (§7.2) and an accurate 21-activity EU Taxonomy Compass reference table with real TSC thresholds. Evolution A trains the actual model the guide describes.

**How.** (1) Start deterministic, not ML: NACE-code → Compass-activity mapping is substantially a rule-based lookup (the Compass dataset is a free download); ship `P(eligible|NACE)` as an exact table join first. (2) Then train the real classifier for the ambiguous cases (multi-activity NACE codes, text-based activity inference from `NLP_DOCUMENTS`-style filings) using sklearn (already in the environment), on labelled disclosed Taxonomy reports as ground truth. (3) Every diagnostic chart regenerates from real runs: ROC from prediction/label pairs, learning curves from training history, calibration from realised frequencies — the dashboard chrome already exists and becomes honest. (4) Model card per Atlas §8 convention; metrics land in `MODELS` from the run, never typed.

**Prerequisites (hard).** The fabricated ensemble and hard-coded metrics must be deleted, not decorated — they are exactly the class `check_no_fabricated_random.py` polices. Labelled training data: FY2024 CSRD Taxonomy KPI disclosures as the label source. **Acceptance:** reported AUC reproduces from a committed evaluation script and versioned dataset; Orsted-class issuers score consistently with their disclosed alignment; ensemble members produce genuinely independent predictions.

### 9.2 Evolution B — Classification-review analyst with evidence-cited verdicts (LLM tier 2)

**What.** The page already sketches the right workflow (`ReviewTab`, `AUDIT_LOG`, review queue): a human validates borderline classifications. The LLM evolution makes that queue intelligent — for each flagged issuer, the copilot assembles the case: NACE code, matched Compass activity, the activity's real TSC threshold text, the classifier's probability, and the specific DNSH criteria lacking evidence — then drafts an accept/reject recommendation the reviewer confirms.

**How.** Tier 2 over Evolution A's outputs: tool calls fetch the issuer's classification record and the Compass reference row (the 21-activity table with TSC thresholds is already accurate content, §7.6 — it becomes retrieval corpus verbatim, e.g. the 100 gCO₂e/kWh electricity threshold). The no-fabrication contract matters doubly here: an audit-ready Taxonomy KPI (the module's stated purpose) cannot contain LLM-estimated probabilities, so every numeric must trace to the classifier response or the regulation text, with the "show work" provenance expander from the roadmap pattern. Greenwash-flag triage from filing text (the `NLP_DOCUMENTS` concept) is a natural second tool once real document ingestion exists.

**Prerequisites (hard).** Evolution A end-to-end — there is currently nothing real to review; a copilot on today's page would rationalise random numbers with regulatory citations, the worst possible failure mode. **Acceptance:** every recommendation cites the Compass activity id and TSC clause; recommendations on issuers below the confidence threshold route to human review rather than auto-verdict; audit log records the tool-call chain per decision.