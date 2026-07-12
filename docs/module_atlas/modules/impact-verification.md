# Impact Verification
**Module ID:** `impact-verification` · **Route:** `/impact-verification` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Manages the end-to-end impact verification workflow including evidence collection, third-party verifier assignment, verification methodology selection, and audit trail management. Ensures impact claims meet recognised standards (GVerify, GIIRS, BlueMark, B Lab) and provides structured outputs for investor impact reporting and regulatory disclosure.

> **Business value:** Ensures impact claims are independently verified to recognised standards, protecting investors from impact washing, enabling credible impact performance reporting, and building the evidence base required for regulatory disclosures under SFDR Article 9 sustainable investment requirements.

**How an analyst works this module:**
- Create a verification request for each impact claim, specifying the IRIS+ metric, evidence package, and target verification standard.
- Assign an independent verifier from the approved panel and configure the methodology selected for this claim type.
- Upload evidence documents and track their review status through the verification workflow stages.
- Receive the verification opinion and confidence score, and integrate findings into the impact report.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Btn`, `EVIDENCE_TIERS`, `IMPACT_WASHING_FLAGS`, `IMP_DIMENSIONS`, `KPI`, `LS_PORT`, `LS_VERIFY`, `PIE_COLORS`, `SDGS_17`, `Section`, `SevBadge`, `StatusBadge`, `TOC_STAGES`, `ThCell`, `VERIFIERS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `IMP_DIMENSIONS` | 6 | `name`, `description`, `assessment`, `weight` |
| `EVIDENCE_TIERS` | 6 | `name`, `quality`, `description`, `confidence`, `color`, `examples` |
| `IMPACT_WASHING_FLAGS` | 9 | `flag`, `severity` |
| `VERIFIERS` | 9 | `specialty`, `credibility`, `region`, `avgCost`, `turnaround` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SDGS_17` | `Array.from({length:17},(_,i)=>({ id:i+1, name:['No Poverty','Zero Hunger','Good Health','Quality Education','Gender Equality','Clean Water','Affordable Energy','Decent Work','Industry & Innovation','Reduced Inequalities'` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `pct` | `(n) => n == null ? '\u2014' : `${Math.round(n)}%`;` |
| `evidenceTier` | `Math.min(5, Math.max(1, Math.ceil(seed(s * 11) * 5)));` |
| `impScore` | `Math.round(IMP_DIMENSIONS.reduce((acc, d) => acc + impDims[d.id] * d.weight, 0) / 100);` |
| `verifiedImpactMn` | `Math.round(seed(s * 23) * 80 + 5);` |
| `hasToC` | `seed(s * 29) > 0.35;` |
| `additionalityProven` | `seed(s * 31) > 0.45;` |
| `sdgsClaimed` | `Math.ceil(seed(s * 37) * 5);` |
| `sdgsVerified` | `Math.floor(sdgsClaimed * (0.3 + seed(s * 41) * 0.6));` |
| `verificationStatus` | `seed(s * 59) > 0.7 ? 'Fully Verified' : seed(s * 61) > 0.45 ? 'Partially Verified' : seed(s * 63) > 0.3 ? 'Under Review' : 'Unverified';` |
| `beneficiaries` | `Math.round(seed(s * 67) * 50000 + 1000);` |
| `tocData` | `TOC_STAGES.map(st => ({ stage: st, strength: Math.round(40 + seed(s * 71 + st.length) * 55) }));` |
| `counterfactual` | `Math.round(seed(s * 73) * 60 + 10);` |
| `costOfVerification` | `Math.round(seed(s * 79) * 120 + 20);` |
| `credibilityPremium` | `Math.round(costOfVerification * (0.8 + seed(s * 83) * 2.5));` |
| `holdings` | `useMemo(() => { if (!portfolioRaw.length) return GLOBAL_COMPANY_MASTER.slice(0, 40).map((c, i) => enrichHolding(c, i));` |
| `agg` | `useMemo(() => { const tw = holdings.reduce((s, h) => s + (h.weight \|\| 1), 0) \|\| 1;` |
| `wAvg` | `fn => holdings.reduce((s, h) => s + fn(h) * (h.weight \|\| 1), 0) / tw;` |
| `goldPct` | `holdings.filter(h => h.evidenceTier === 1).length / (holdings.length \|\| 1) * 100;` |
| `lowPct` | `holdings.filter(h => h.evidenceTier >= 4).length / (holdings.length \|\| 1) * 100;` |
| `totalFlags` | `holdings.reduce((s, h) => s + h.flags.length, 0);` |
| `totalVerifiedMn` | `holdings.reduce((s, h) => s + h.verifiedImpactMn, 0);` |
| `addPct` | `holdings.filter(h => h.additionalityProven).length / (holdings.length \|\| 1) * 100;` |
| `sdgVerPct` | `holdings.reduce((s, h) => s + h.sdgsVerified, 0) / Math.max(1, holdings.reduce((s, h) => s + h.sdgsClaimed, 0)) * 100;` |
| `tierDist` | `EVIDENCE_TIERS.map(t => ({ name:`Tier ${t.tier}`, count:holdings.filter(h => h.evidenceTier === t.tier).length, color:t.color }));` |
| `flaggedCompanies` | `useMemo(() => holdings.filter(h => h.flags.length > 0).sort((a, b) => b.flags.length - a.flags.length), [holdings]);` |
| `sdgValidation` | `useMemo(() => { return SDGS_17.map(sdg => {` |
| `verified` | `claiming.filter(h => seed(sdg.id * 19 + h.impScore) > 0.5);` |
| `blob` | `new Blob([rows.join('\n')], { type:'text/csv' });` |
| `data` | `holdings.map(h => ({ company:h.company_name, sector:h.sector, impDimensions:h.impDims, impScore:h.impScore, evidenceTier:h.evidenceTier, quality:h.tierObj.quality, verificationStatus:verifyOverrides[h.company_name]?.stat` |
| `radarData` | `IMP_DIMENSIONS.map(d => ({ dimension: d.id.toUpperCase(), score: agg.dimAvgs[d.id], fullMark: 100 }));` |
| `costBenefitData` | `useMemo(() => { return holdings.slice(0, 15).map(h => ({ company: (h.company_name \|\| '').slice(0, 14), costK: h.costOfVerification, premiumK: Math.round(h.credibilityPremium * (costBenefitSlider / 50)), roi: Math.round(((h.credibilityPremium * (costBenefitSlider / 50)) - h.costOfVerification) / Math.max(1, h.costOfVerification) * 100), })` |
| `sectors` | `[...new Set(holdings.map(h => h.sector))].slice(0, 12);` |
| `intensity` | `cnt / Math.max(1, sectorH.length);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `EVIDENCE_TIERS`, `IMPACT_WASHING_FLAGS`, `IMP_DIMENSIONS`, `PIE_COLORS`, `TOC_STAGES`, `VERIFIERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Verification Confidence Score | — | BlueMark benchmark | Scores above 0.80 indicate high-confidence impact claims; below 0.60 requires re-verification or methodology upgrade before investor reporting. |
| Evidence Quality Ratio (%) | — | GIIN / Internal | Share of impact KPIs supported by primary data (direct measurement, system records) vs proxy or modelled data. |
| Third-Party Verification Rate (%) | — | Portfolio verification tracker | Percentage of impact claims independently verified by a third-party verifier; UNPRI recommends 100% for impact-first strategies. |
| Time to Verification (days) | — | Workflow tracking | Average elapsed time from evidence submission to verification completion; longer timelines indicate evidence quality issues. |
- **Impact KPI data submissions (investee reports)** → Assess evidence quality tier, flag proxy data for upgrade → **Evidence quality assessment by KPI**
- **Verifier panel database** → Match verifier expertise to metric type and sector → **Verifier assignment and independence check**
- **Verification reports and audit trails** → Aggregate VCS scores, track resolution of findings → **Verification portfolio dashboard**

## 5 · Intermediate Transformation Logic
**Methodology:** Verification Confidence Score
**Headline formula:** `VCS = w_1 × EvidenceQuality + w_2 × MethodologyRobustness + w_3 × IndependenceIndex + w_4 × DataAuditability`

Constructs a composite verification confidence score by assessing evidence quality (primary vs proxy data), methodology robustness (RCT > quasi-experimental > survey), verifier independence (arms-length vs affiliated), and data auditability (system-generated vs manually reported). Higher scores indicate more reliable impact claims.

**Standards:** ['GVerify Impact Verification Standard', 'BlueMark Verification Methodology', 'GIIN IRIS+ Verification Framework']
**Reference documents:** GVerify â€” Impact Verification Standard (2022); BlueMark â€” Making the Mark: Assessing the Practice of Impact Investing (2022); GIIN â€” Navigating Impact (2019); B Lab â€” B Impact Assessment Methodology

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Implement the VCS on a per-claim evidence store (analytics ladder: rung 1 → 2)

**What.** The module's taxonomies are genuinely good — the real IMP five-dimension weights (25/20/25/15/15), a J-PAL-style evidence hierarchy (RCT 95% → anecdotal 30%), 8 curated impact-washing flags, and a real verifier panel (DNV, CICERO, KPMG…) — but §7.5 is blunt: per-company scores are `seed()` draws over real `GLOBAL_COMPANY_MASTER` names, and the guide's Verification Confidence Score is not computed (the page's composite is the IMP-weighted mean, a different metric). Evolution A implements the §8 spec: `VCS = 0.35·EvidenceQuality + 0.25·MethodologyRobustness + 0.25·Independence + 0.15·DataAuditability`, computed from a real per-claim evidence store rather than PRNG.

**How.** (1) Tables `verification_claims` (holding × IRIS+ metric × claim), `verification_evidence` (design type, verifier id, data-source flags) — the workflow the §1 overview describes (create request → assign verifier → upload evidence → receive opinion) finally gets persistence. (2) `POST /impact-verification/vcs` computing the score with §8.3's hard cap `VCS ≤ 0.5` when Independence = 0 — the anti-self-reporting rule is the spec's most important line. (3) Impact-washing flags become rule-evaluated from claim data (e.g. output-outcome conflation detected when a claimed outcome metric maps to an IRIS+ output code). (4) Distribution reconciled against BlueMark published verification tiers per §8.5.

**Prerequisites.** The `enrichHolding` seeded scoring removed (real names + fabricated verification statuses is the exact impact-washing pattern this module exists to police); an evidence-upload path. **Acceptance:** an RCT-backed arms-length claim scores ≥ 0.85; a self-reported claim caps at 0.5; every VCS decomposes into its four stored components.

### 9.2 Evolution B — Verification-workflow copilot with evidence-grading discipline (LLM tier 2)

**What.** A copilot for impact analysts running the verification desk: "which claims fall below the 0.60 re-verify threshold?", "recommend a verifier for a health-outcome DIB claim in East Africa" (matching the `VERIFIERS` panel's specialty/region/cost fields), "explain why this claim's VCS dropped after the auditability recode." A second, higher-value behaviour: pre-screening uploaded evidence documents — classifying evaluation design (RCT / quasi-experimental / survey / anecdotal) as a *suggested* tier for human confirmation, which is a classic LLM-assist task over the module's own evidence hierarchy.

**How.** Tier 2: tool schemas over the Evolution A `/vcs` and claim-query routes; verifier recommendations rank the real panel table by specialty match and cost, shown with the ranking arithmetic. Evidence-design suggestions are always labeled machine-suggested with the confidence rationale, never auto-committed — §8.6 flags inter-rater variance as the model risk, and the copilot must not become an unaccountable rater. The no-fabrication validator covers all VCS figures and thresholds (0.80 credible / 0.60 re-verify come from §8.3, cited).

**Prerequisites (hard).** Evolution A — a verification copilot narrating seeded statuses would be impact-washing with extra steps. Document-upload pipeline for the pre-screening behaviour. **Acceptance:** every VCS/threshold figure traces to a tool call or §8.3; evidence-tier suggestions carry a visible "pending human confirmation" state in the workflow.