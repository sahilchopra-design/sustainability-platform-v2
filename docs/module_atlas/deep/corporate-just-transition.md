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
