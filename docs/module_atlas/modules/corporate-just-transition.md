# Corporate Just Transition Analytics
**Module ID:** `corporate-just-transition` · **Route:** `/corporate-just-transition` · **Tier:** B (frontend-computed) · **EP code:** EP-DI3 · **Sprint:** DI

## 1 · Overview
Evaluates corporate just transition plans — how companies manage the social impacts of their climate strategies on workers, communities, and supply chains. Provides JUST Transition Finance Task Force scoring, ILO-aligned assessment, and integration with Science Based Targets.

> **Business value:** Directly applicable to responsible investment teams conducting company engagement, active owners voting on climate + social resolutions, and investment funds integrating ILO just transition criteria into ESG research. Aligned with CA100+ benchmark and emerging EU CS3D supply chain due diligence.

**How an analyst works this module:**
- Input company and sector for just transition baseline
- Score worker transition commitments
- Assess community investment and regional economic plans
- Evaluate supply chain social risk management
- Generate CA100+/JTFF-aligned just transition scorecard

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `BLUE`, `CORP_NAMES`, `COUNTRIES`, `INDIGO`, `JT_COLORS`, `JT_CORPORATES`, `PURPLE`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `revenue` | `+(10 + sr(i * 7) * 190).toFixed(1);` |
| `justTransitionScore` | `Math.round(20 + sr(i * 11) * 75);` |
| `workforceReduction` | `+(1 + sr(i * 13) * 29).toFixed(1);` |
| `newGreenJobs` | `+(workforceReduction * (0.2 + sr(i * 17) * 1.5)).toFixed(1);` |
| `carbonBoost` | `carbonPrice / 80;` |
| `totalCapex` | `filtered.reduce((s, c) => s + c.transitionCapex * carbonBoost, 0);` |
| `avgJTScore` | `filtered.length ? filtered.reduce((s, c) => s + c.justTransitionScore, 0) / filtered.length : 0;` |
| `totalRetraining` | `filtered.reduce((s, c) => s + c.workerRetrainingBudget * retrainingMultiplier, 0);` |
| `netJobsImpact` | `filtered.reduce((s, c) => s + c.newGreenJobs - c.workforceReduction, 0);` |
| `scatterData` | `filtered.map(c => ({ x: c.transitionCapex * carbonBoost, y: c.justTransitionScore, name: c.name }));` |
| `retrainingBySector` | `SECTORS.map(sec => {` |
| `communityByCountry` | `COUNTRIES.map(country => {` |
| `netJobsData` | `filtered.slice(0, 15).map(c => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CORP_NAMES`, `COUNTRIES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CA100+ Just Transition Coverage | — | CA100+ Just Transition Assessment 2023 | Climate Action 100+ assesses just transition plans for its 170+ focus companies — 70 have public plans |
| Corporate JT Spending | — | JTFF Research 2023 | Average corporate just transition spending as % of climate CapEx — vastly underfunded vs ILO recommendations |
| Supply Chain Social Risk | — | CA100+ Supply Chain Analysis 2023 | 73% of listed company Scope 3 emissions originate in countries with high social/labour risk |
- **Company climate transition plans + annual reports** → Just transition scoring → **Corporate JT score by pillar (workers/community/supply chain/governance)**
- **CA100+ benchmark assessments** → Peer comparison → **Company JT score vs sector peers and CA100+ averages**
- **Supply chain mapping data (tier 1-3)** → Supply chain social risk → **Scope 3 social risk exposure by geography and sector**

## 5 · Intermediate Transformation Logic
**Methodology:** Corporate Just Transition Score
**Headline formula:** `JTScore = w_W × WorkerScore + w_C × CommunityScore + w_SC × SupplyChainScore + w_G × GovernanceScore; WorkerScore = Σ [ReskillCommitment + IncomeProtection + PensionSecurity + CollectiveBargaining] / 4`

Four-pillar scoring across workers, communities, supply chains, and governance; each pillar assessed on commitment vs action spectrum from disclosure-only to verified outcomes

**Standards:** ['JUST Transition Finance Task Force Principles 2023', 'ILO 2015 Just Transition Guidelines', 'CA100+ Just Transition Assessment Framework', 'SBTi Just Transition Guidance 2023']
**Reference documents:** JUST Transition Finance Task Force Principles for Just Transition Finance 2023; ILO Guidelines for a Just Transition 2015; CA100+ Net Zero Company Benchmark — Just Transition Indicator 2023; SBTi — Just Transition Pathway for Companies (2023)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide (EP-DI3) defines a **four-pillar Corporate Just Transition
> Score** — `JTScore = w_W·WorkerScore + w_C·CommunityScore + w_SC·SupplyChainScore + w_G·GovernanceScore`,
> with `WorkerScore = Σ[ReskillCommitment + IncomeProtection + PensionSecurity + CollectiveBargaining]/4`,
> scored on a commitment-vs-action spectrum. **The code computes no pillar decomposition.** The headline
> `justTransitionScore` is a single directly-seeded number (`round(20 + sr(i·11)·75)`); the four pillars
> that the formula supposedly aggregates do not exist as separate quantities. Every metric — transition
> capex, retraining budget, community investment, human-rights score, gender-equity score — is
> independently `sr()`-seeded. The page is a synthetic scorecard dashboard, not a JTFF/ILO scoring engine.
> §8 specifies the four-pillar model the guide advertises.

### 7.1 What the module computes

55 synthetic corporates carry seeded fields; the page produces filtered averages and two scaling overlays:

```js
carbonBoost = carbonPrice / 80                                   // slider, default 80 ⇒ 1.0×
totalCapex  = Σ ( transitionCapex × carbonBoost )
avgJTScore  = mean( justTransitionScore )                        // over filtered
totalRetraining = Σ ( workerRetrainingBudget × retrainingMultiplier )
netJobsImpact   = Σ ( newGreenJobs − workforceReduction )
```

The only inter-field relationship is `newGreenJobs = workforceReduction × (0.2 + sr(i·17)·1.5)` — green
jobs are 0.2–1.7× the workforce reduction. Everything else is an independent seeded draw.

### 7.2 Parameterisation / scoring rubric

| Field | Formula | Provenance |
|---|---|---|
| `justTransitionScore` | `round(20 + sr(i·11)·75)` → 20–95 | Synthetic seeded PRNG (single number, no pillars) |
| `revenue` | `10 + sr(i·7)·190` $bn | Synthetic seeded PRNG |
| `transitionCapex` | `revenue × (0.05 + sr(i·19)·0.25)` | Synthetic (5–30% of revenue) |
| `workerRetrainingBudget` | `10 + sr(i·23)·490` $M | Synthetic seeded PRNG |
| `workforceReduction` | `1 + sr(i·13)·29` % | Synthetic seeded PRNG |
| `newGreenJobs` | `workforceReduction × (0.2 + sr(i·17)·1.5)` | Synthetic (derived from reduction) |
| `humanRightsScore`, `genderEquityScore` | `3 + sr·7` (0–10) | Synthetic seeded PRNG |
| `carbonBoost` | `carbonPrice/80` | UI slider scaling (no model basis) |
| JT label | ≥75 Leader · 55 High · 35 Medium · <35 Low | Hard-coded display bands |

Sector and country are round-robin (`i % length`), so the named corporates (Shell, Rio Tinto, ArcelorMittal…)
are cosmetic labels detached from the seeded scores.

### 7.3 Calculation walkthrough

1. `JT_CORPORATES` is seeded once. `filtered` applies sector/country/JT-label filters.
2. `carbonBoost` scales capex; `retrainingMultiplier` scales retraining — both user sliders.
3. KPIs sum/average the (scaled) seeded fields; tab charts re-bucket by sector or country.
4. Scatter plots `transitionCapex×carbonBoost` vs `justTransitionScore`; net-jobs bars show
   `newGreenJobs − workforceReduction` for the first 15 companies.

### 7.4 Worked example

Company `i = 4` (Chevron by name): `sr(4·11)=sr(44)=frac(sin(45)·10⁴)`; `sin(45 rad)=0.851`, ×10⁴=8509.1,
frac≈0.91 ⇒ `justTransitionScore = round(20 + 0.91·75) = round(88.3) = 88` (Leader, ≥75). If its
`workforceReduction = 12.0%` and `sr(4·17)=0.5`, then `newGreenJobs = 12.0×(0.2+0.5×1.5)=12.0×0.95=11.4%`,
so `netJobsImpact = 11.4 − 12.0 = −0.6` (slight net job loss). With `revenue = 150 $bn` and
`sr(4·19)=0.4`, `transitionCapex = 150×(0.05+0.4×0.25)=150×0.15=$22.5bn`; at a carbon price of 120,
`carbonBoost=1.5` scales it to `$33.75bn`. No pillar-level worker/community/supply-chain/governance sub-scores
are ever formed — the "88" is a single seeded draw.

### 7.5 Companion analytics on the page

Eight tabs: company overview, transition capex, worker retraining, community investment, supplier support,
just-transition score distribution, human rights, gender equity — each a bar/scatter over the seeded
fields, bucketed by sector or country. Two sliders (carbon price, retraining multiplier). No backend engine
or route; no interconnection to other modules.

### 7.6 Data provenance & limitations

- **All 55 corporates are synthetic**, from `sr(seed)=frac(sin(seed+1)×10⁴)`. Company names are real but
  their scores are seeded; sector/country are round-robin, not real attributions.
- **No four-pillar decomposition** despite the guide's formula — `justTransitionScore` is one seeded number,
  so worker/community/supply-chain/governance weights cannot be inspected or defended.
- The carbon-price and retraining sliders scale outputs linearly with no model rationale.

**Framework alignment (named, not implemented):** *JUST Transition Finance Task Force (JTFF) Principles
2023*, *ILO Guidelines for a Just Transition (2015)*, *Climate Action 100+ Just Transition indicator*, and
*SBTi Just Transition guidance* are cited. These define the four-pillar commitment-to-action assessment the
guide describes (workers: reskilling, income protection, pensions, collective bargaining; plus communities,
supply chains, governance) — but the code implements none of the pillar scoring; it displays seeded totals.

---

## 8 · Model Specification — Four-Pillar Corporate Just Transition Score

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Score a company's just-transition plan across workers, communities, supply chains, and governance, on a
commitment-vs-action spectrum, for responsible-investment engagement and CA100+/JTFF-aligned reporting.
Coverage: high-emitting listed companies with transition plans.

### 8.2 Conceptual approach
Operationalise the **CA100+ Just Transition indicator** and **JTFF Principles**: assess each pillar against
a maturity ladder (disclosure-only → commitment → action → verified outcome), mapping ILO-2015 elements
(social dialogue, social protection, skills) to scored sub-indicators. This mirrors the CA100+ Net-Zero
Benchmark scoring and the World Benchmarking Alliance just-transition assessment.

### 8.3 Mathematical specification
```
Pillar_W = mean( Reskill, IncomeProtection, PensionSecurity, CollectiveBargaining )   ∈ [0,100]
Pillar_C = mean( CommunityInvestment, RegionalEconPlan, StakeholderEngagement )
Pillar_SC= mean( SupplierSocialDD, HighRiskGeoCoverage, LivingWageInSupplyChain )
Pillar_G = mean( BoardOversight, JTDisclosure, TargetIntegration )
JTScore  = w_W·Pillar_W + w_C·Pillar_C + w_SC·Pillar_SC + w_G·Pillar_G
Maturity(sub) ∈ {0 none, 33 disclosure, 66 commitment, 100 verified outcome}
```
| Parameter | Symbol | Calibration source |
|---|---|---|
| Pillar weights | `w_W,w_C,w_SC,w_G` | CA100+ indicator weighting (worker-heavy) |
| Sub-indicator maturity | `Maturity()` | CA100+/JTFF ladder; ILO-2015 elements |
| Supply-chain social risk | — | ILO high-risk-geography flags; 73% Scope-3 stat (guide) |
| Disclosure evidence | — | Transition plans, annual reports, CBA registries |

### 8.4 Data requirements
Company transition-plan text (reskilling budgets, CBA coverage, community programmes), supply-chain tier
mapping with geography, board-committee mandates. Sources: CA100+ assessments, company disclosures, ILO
country social-risk data. The platform holds seeded proxies (retraining budget, community investment) that
would become *inputs* once sourced; supply-chain modules could feed high-risk-geography coverage.

### 8.5 Validation & benchmarking plan
Reconcile pillar scores against published CA100+ just-transition assessments for the ~70 focus companies
with public plans; check corporate JT spend lands near the empirical <0.5% of abatement capex. Inter-rater
reliability on the maturity ladder; sensitivity on pillar weights.

### 8.6 Limitations & model risk
Just-transition disclosure is nascent and largely qualitative — scores depend on text assessment
(subjectivity; use rubric + dual-rater). Commitment ≠ outcome, so weight verified outcomes higher. Supply-
chain coverage is data-poor. Conservative fallback: score only disclosed/verifiable elements and mark
undisclosed pillars "not assessed" rather than seeding a headline number.

## 9 · Future Evolution

### 9.1 Evolution A — Build the four-pillar JTFF/ILO scoring engine (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag: EP-DI3's headline `justTransitionScore` is a single
seeded number (`round(20 + sr(i·11)·75)`) — the guide's four-pillar decomposition
(`JTScore = w_W·Worker + w_C·Community + w_SC·SupplyChain + w_G·Governance`) does not
exist, so the score's weights "cannot be inspected or defended" (§7.6). All 55
corporates carry real names with fabricated metrics; sector/country are round-robin;
the carbon-price and retraining sliders scale outputs with no model rationale.
Evolution A builds the pillar engine: assessable indicators, evidence-based scoring
on the commitment-vs-action spectrum, defensible aggregation.

**How.** (1) Indicator schema per pillar, straight from the guide's own formula:
Worker = mean of reskilling commitment, income protection, pension security,
collective bargaining — each scored 0–4 on a documented disclosure→verified-outcome
ladder (the CA100+ Just Transition indicator provides the public rubric to adapt);
Community, SupplyChain, Governance likewise. (2) Assessment input: manual analyst
scoring first (honest and useful), with disclosure-extraction assistance deferred to
Evolution B; scores persist to a `jt_assessments` table — the module's first
vertical. (3) The composite becomes `Σ w_p × pillar` with published default weights
and a sensitivity toggle. (4) Purge the seeded universe; delete the free-floating
sliders or re-derive them (retraining budget becomes an assessed data point, not a
multiplier).

**Prerequisites (hard).** PRNG purge including the real-name/seeded-score
combination; the scoring rubric itself is expert work — a documented, versioned
rubric must exist before assessments start. **Acceptance:** a scored company's
JTScore decomposes into four inspectable pillars with per-indicator evidence notes;
re-weighting recomputes transparently; zero `sr()` calls feed displayed metrics.

### 9.2 Evolution B — Disclosure-to-rubric assessment assistant (LLM tier 2)

**What.** Pillar scoring is reading work: just-transition evidence lives in annual
reports, climate transition plans, and union agreements. Evolution B accelerates the
Evolution A workflow: upload a company's transition plan and the assistant proposes
per-indicator scores with quoted evidence passages ("reskilling commitment: score 2 —
plan commits €50M but names no beneficiary count or timeline, p.34"), which the
analyst confirms or overrides — human-in-the-loop scoring that builds the assessment
corpus. Portfolio users then get the CA100+-aligned scorecard the overview promises,
grounded in confirmed assessments.

**How.** Tier-2 pattern with a document pipeline: extraction prompts structured per
the Evolution A rubric (one prompt per pillar, outputs constrained to the 0–4 ladder
plus evidence spans); proposals persist as drafts pending confirmation, mirroring the
roadmap's gated-mutation contract. Grounding corpus: the ILO 2015 guidelines, JTFF
principles, and CA100+ indicator definitions (public texts, refdata additions). The
assistant never scores without a quotable passage — no-evidence indicators return
"not disclosed", which is itself the correct commitment-spectrum finding.

**Prerequisites (hard).** Evolution A's rubric and persistence; document upload
path. **Acceptance:** on 3 public transition plans, proposed scores match an expert's
independent scoring within ±1 on ≥80% of indicators; every proposal carries a page-
cited passage; unconfirmed proposals never enter the displayed scorecard.