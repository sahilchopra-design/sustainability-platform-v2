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
