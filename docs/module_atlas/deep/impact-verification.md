## 7 · Methodology Deep Dive

An **impact-verification** workflow page: it scores each holding on the IMP five dimensions, assigns an
evidence-quality tier (RCT → anecdotal), flags impact-washing, and tracks verifier assignment and
verification cost/benefit. The IMP-weighted score is a genuine weighted mean; the per-company IMP
dimension scores, evidence tier and washing flags are PRNG-generated over `GLOBAL_COMPANY_MASTER`. Code
and guide (Verification Confidence Score) broadly align, with the caveat below.

> ⚠️ **Guide↔code note.** The guide's headline metric is a **Verification Confidence Score**
> `VCS = w₁·EvidenceQuality + w₂·MethodologyRobustness + w₃·Independence + w₄·DataAuditability`.
> The code does **not** compute a VCS; its composite is an **IMP five-dimension weighted score**
> (`impScore = Σ dim·weight / 100`). Evidence quality is captured as a *tier* (1–5), not folded into a
> confidence score. The two are cousins but not the same metric; §8 specifies the VCS the guide names.

### 7.1 What the module computes

**IMP composite** — weighted mean of the five IMP dimension scores:

```js
impScore = round( Σ_d  impDims[d.id]·d.weight / 100 )         // weights: WHAT 25, WHO 20, HOW MUCH 25, CONTRIBUTION 15, RISK 15
```

**Evidence tier** and **SDG verification ratio**:

```js
evidenceTier = min(5, max(1, ceil(seed(s·11)·5)))            // 1 (RCT) … 5 (anecdotal)
sdgsClaimed  = ceil(seed(s·37)·5)
sdgsVerified = floor(sdgsClaimed · (0.3 + seed(s·41)·0.6))    // 30–90% of claims verified
```

**Verification cost/benefit**:

```js
costOfVerification  = round(seed(s·79)·120 + 20)             // $20–140k
credibilityPremium  = round(costOfVerification·(0.8 + seed(s·83)·2.5))
roi                 = (premium·slider/50 − cost) / max(1,cost) · 100
```

### 7.2 Parameterisation — scoring tables (real frameworks, synthetic scores)

| Table | Content | Provenance |
|---|---|---|
| `IMP_DIMENSIONS` | WHAT/WHO/HOW MUCH/CONTRIBUTION/RISK, weights 25/20/25/15/15 | **Real IMP five-dimension framework**; weights are the module's choice |
| `EVIDENCE_TIERS` | RCT 95% → quasi-exp 85 → ToC+data 70 → self-reported 50 → anecdotal 30 | **Real evidence hierarchy** (J-PAL / dev-evaluation practice); confidence % are the module's |
| `IMPACT_WASHING_FLAGS` | 8 flags (vague claims, no verification, output-outcome conflation, SDG-washing…) | Curated, grounded in impact-washing literature |
| `VERIFIERS` | DNV, Sustainalytics, CICERO, KPMG, EY, PwC… credibility 88–96, cost $50–160k | Real verifier names; cost/credibility indicative |

The *taxonomies* are real and well-chosen; each company's *scores* on them are seeded PRNG.

### 7.3 Calculation walkthrough

`enrichHolding` decorates the first 40 `GLOBAL_COMPANY_MASTER` companies (or the user portfolio) with
IMP dimension scores, `impScore`, `evidenceTier`, verified-impact $, ToC/additionality booleans,
SDG claimed/verified counts, washing flags and verification cost/premium. Aggregates: `goldPct`
(tier-1 share), `lowPct` (tier ≥4 share), `totalFlags`, `addPct` (additionality-proven share),
`sdgVerPct` (Σverified/Σclaimed). The radar plots portfolio-average IMP dimensions; the cost-benefit
chart computes verification ROI under a slider.

### 7.4 Worked example (one holding)

IMP dims WHAT 80, WHO 60, HOW MUCH 70, CONTRIBUTION 50, RISK 65:

| Step | Computation | Result |
|---|---|---|
| impScore | (80·25 + 60·20 + 70·25 + 50·15 + 65·15)/100 | (2000+1200+1750+750+975)/100 = **66.75 → 67** |
| evidenceTier | `ceil(seed·5)` = 3 | Theory-of-Change + data (70% confidence) |
| sdgsClaimed / verified | 4 / floor(4·0.6) | 4 claimed, **2 verified** (50%) |
| costOfVerification | $85k | |
| credibilityPremium | 85·(0.8+…) ≈ $170k | ROI ≈ +100% |

### 7.5 Data provenance & limitations

- **Company scores are synthetic** (`seed(s)=frac(sin(s+1)×10⁴)`), applied over real company names
  from `GLOBAL_COMPANY_MASTER`. The IMP framework, evidence hierarchy, washing flags and verifier list
  are real; the per-company assessments are not.
- The composite is an **IMP-weighted score, not the guide's VCS** — evidence quality is a separate tier,
  not integrated into a single confidence number.
- No document-level evidence ingestion; the "verified impact $" and cost/premium are random.

## 8 · Model Specification — Verification Confidence Score (VCS)

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce a single 0–1 confidence score per impact claim, integrating evidence quality, methodology
robustness, verifier independence and data auditability — protecting investors from impact-washing and
supporting SFDR Art. 9 sustainable-investment evidence.

### 8.2 Conceptual approach
A weighted-evidence confidence model, mirroring **BlueMark "Making the Mark"** verification practice
and the **GIIN IRIS+ verification framework**, with an evidence-hierarchy prior (J-PAL/RCT gold
standard) analogous to GRADE evidence grading in medicine.

### 8.3 Mathematical specification
```
VCS = w₁·EvidenceQuality + w₂·MethodologyRobustness + w₃·Independence + w₄·DataAuditability
EvidenceQuality      = TierConfidence(tier)/100      (RCT .95 … anecdotal .30)
MethodologyRobustness= f(design)                     (RCT 1.0, quasi-exp .8, survey .5)
Independence         = 1 if arms-length verifier, 0.5 affiliated, 0 self-reported
DataAuditability     = share of KPIs system-generated vs manual
w = (0.35, 0.25, 0.25, 0.15)  ;  claim credible if VCS ≥ 0.80, re-verify if < 0.60
```

| Parameter | Source |
|---|---|
| Tier→confidence map | J-PAL / dev-evaluation evidence hierarchy |
| Verifier independence | Verifier registry (DNV/CICERO/KPMG etc.) |
| Auditability share | Data-lineage of each KPI (system vs manual) |
| Weights w | Calibrated to BlueMark benchmark distributions |

### 8.4 Data requirements
Per-claim: evaluation design, verifier identity + independence, KPI data-source flags, IRIS+ metric
type. Platform holds the verifier list and IMP taxonomy; evidence-design and auditability flags need a
per-claim evidence store.

### 8.5 Validation & benchmarking plan
Reconcile VCS distribution against BlueMark published verification tiers; test that RCT-backed claims
score ≥0.85; sensitivity to weights; inter-rater reliability on independence/auditability coding.

### 8.6 Limitations & model risk
Evidence-design and auditability coding are judgemental (inter-rater variance). Absence of a verifier
should force VCS low, not neutral — apply a hard cap `VCS ≤ 0.5` when Independence = 0 to avoid
rewarding unverified self-reporting.

**Framework alignment:** BlueMark *Making the Mark* · GIIN IRIS+ verification · IMP five dimensions
(the module's actual composite) · GVerify. The code implements the IMP-weighted score and evidence
tiers faithfully as taxonomies but on synthetic scores; the named VCS remains a specification.
