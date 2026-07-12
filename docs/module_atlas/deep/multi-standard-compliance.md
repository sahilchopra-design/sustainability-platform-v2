## 7 · Methodology Deep Dive

The MODULE_GUIDES entry and the code agree on scope — a **carbon-project compliance matrix** across
CDM, Gold Standard v4 (GS4GG), Verra VCS v4, CAR, ACR, CORSIA, and ICVCM Core Carbon Principles. The
requirement checklists carry **accurate standard references** (e.g. `CDM EB TOOL01 v8` for
additionality, `VCS Standard v4 §3.7` for AFOLU buffer pools, `GS4GG P&R §5.1` for the 3-SDG minimum).
What is entirely synthetic is every *score* and every pass/fail — they come from the platform PRNG.

### 7.1 What the module computes

50 synthetic projects (`PROJECTS`) each get six per-standard scores in fixed ranges:

```js
cdm    = round(40 + sr(i·7 +1)·55)     // 40–95
gs     = round(45 + sr(i·11+2)·50)     // 45–95
vcs    = round(50 + sr(i·13+3)·48)     // 50–98
car    = round(30 + sr(i·19+4)·60)     // 30–90
acr    = round(35 + sr(i·23+5)·58)     // 35–93
corsia = round(40 + sr(i·29+6)·55)     // 40–95
```

Derived flags: **CCP label** `ccpLabel = (gs≥72 && vcs≥75 && cdm≥70) ? 'Y':'N'`; **CORSIA eligible**
`corsia > 70`; and a **price premium** `premiumFactor = 1.0 + sdgPremium(0.25 if ≥5 SDGs) +
corsiaBonus(0.08) + ccpBonus(0.20)`. Portfolio KPIs classify each project as fully compliant (all six
scores ≥80), partial (some ≥80), or non-compliant.

### 7.2 Parameterisation / scoring rubric

| Standard | Score range | Requirement rows | Real refs quoted |
|---|---|---|---|
| CDM | 40–95 | 13 | CDM Standard v8, TOOL01 v8, VVS v1 |
| GS4GG v4 | 45–95 | 8 | GS4GG P&R §4–6, SDG Impact Standards |
| VCS v4 | 50–98 | 8 | VCS Standard v4 §3.1–4.2, Art 6.2 PA |
| CAR | 30–90 | 5 protocols | Forest v3.5, Livestock v2.1 (CARB-approved flag) |
| ACR | 35–93 | 5 | ACR Standard v8, buffer-pool reqs |
| CORSIA | 40–95 | 6 standards | ICAO CORSIA labels 2021–2035 phases |
| ICVCM CCP | 0–10 per principle | 10 principles | Governance…No-Net-Harm |

Pass/fail per checklist item is a seeded threshold, e.g. `cdmPassFn = sr(id.charCodeAt(4)·7 + ri·3 +1)
> 0.28` (≈72 % pass rate), `gsPassFn` threshold 0.22, `vcsPassFn` 0.20. CCP principle scores:
`round(5 + sr(id.charCodeAt(4)·7 + pi·11 + 4)·5)` → 5–10.

### 7.3 Calculation walkthrough

1. `PROJECTS` seeds 50 projects with six scores, SDG set, buffer/leakage %, Article 6 status, registry
   membership (a project claims CDM if `cdm>70`, GS if `gs>65`, VCS if `vcs>60`, else defaults VCS).
2. Filters (sector/country/registry) subset the list; `kpis` count fully/partial/non-compliant, multi-
   registry (`≥2`), CCP-labelled, and CORSIA-eligible.
3. The **CCP tab** scores the selected project against the 10 Core Carbon Principles (`scores` array,
   each 5–10) and averages them (`avgScore`).
4. Per-standard tabs render the requirement checklist with seeded pass/fail ticks and completion %
   (`pct = round(passed / REQUIREMENTS.length · 100)`).

### 7.4 Worked example (project PRJ-011, CCP tab)

`selProject.id = 'PRJ-011'` → `charCodeAt(4) = '1'.charCodeAt(0) = 49`. CCP principle 1 (`pi=0`):
`round(5 + sr(49·7 + 0·11 + 4)·5) = round(5 + sr(347)·5)`. If `sr(347)≈0.6` → **8/10**. Averaging ten
such draws gives an `avgScore` around 7–8. Whether PRJ-011 earns the CCP `'Y'` label instead depends on
its `gs/vcs/cdm` triple crossing 72/75/70 — a *separate* seeded gate from the CCP-tab per-principle
scores (the two CCP representations are not reconciled in code).

### 7.5 Data provenance & limitations

- **All scores and pass/fail states are synthetic** (`sr(s)=frac(sin(s+1)·10⁴)`). Only the requirement
  text and standard-clause references are real, hand-curated content.
- The two CCP mechanics are inconsistent: `ccpLabel` is a boolean gate on the GS/VCS/CDM triple, while
  the CCP tab shows ten independently seeded 5–10 principle scores. A real ICVCM assessment produces a
  single program-level + methodology-category-level approval, not either of these.
- No actual project documents (PDD, monitoring report, verification statement) are parsed; compliance is
  asserted by PRNG, not evidenced.

**Framework alignment:**
- **ICVCM Core Carbon Principles** — the CCP is assessed by ICVCM at two levels: the *carbon-crediting
  programme* (governance, registry/tracking, transparency, third-party V&V) and the *methodology
  category* (additionality, permanence, robust quantification, no-double-counting, SD benefits, no net
  harm). A credit earns the CCP label only if both its programme and methodology pass. The code lists
  the correct 10 principles but scores them by PRNG.
- **CDM / GS4GG v4 / VCS v4 / CAR / ACR** — checklist clauses are accurately referenced to each
  standard's rulebook.
- **CORSIA** — eligibility mirrors ICAO's TAB-approved unit list (VCS/GS/ACR/CAR/ART-TREES with the
  CORSIA label, CDM Phase-1 limited); the code's `CORSIA_ELIGIBLE_STANDARDS` phases are correct.
- **ISO 14064-3** — named in the guide (Reasonable vs Limited assurance) but not implemented in code.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The module displays per-standard compliance
scores and a CCP label with no real assessment behind them. Below is the production scoring model.

### 8.1 Purpose & scope
Produce, per carbon project/credit vintage, a defensible compliance score against each applicable
standard and an ICVCM CCP eligibility decision, to support buyer due-diligence and portfolio quality
screening across VCM and CORSIA-compliance markets.

### 8.2 Conceptual approach
A rules-based, evidence-weighted conformance model — not a statistical model. Benchmarks: **ICVCM
Assessment Framework** (two-tier programme + methodology-category gates) and **BeZero / Sylvera / Calyx
credit-rating** methodologies (weighted sub-scores on additionality, permanence, over-crediting risk,
co-benefits, safeguards). Each standard is a checklist of mandatory + scored criteria; the composite is
a weighted conformance ratio.

### 8.3 Mathematical specification
Per standard *s*: `StandardScore_s = Σⱼ wⱼ·cⱼ / Σⱼ wⱼ`, where `cⱼ ∈ {0, 0.5, 1}` is criterion-*j*
conformance (fail/partial/pass) evidenced from documents, `wⱼ` its materiality weight (mandatory
criteria `w=∞` → gate: any mandatory fail sets `StandardScore_s = fail`). CCP eligibility:
`CCP = 1` iff programme-gate `∧` methodology-gate all pass, where each gate = `∏(mandatory criteria)`.
Over-crediting risk score: `OC = 1 − (verified ERR / claimed ERR)` from independent re-quantification.
Composite quality: `Q = Σₛ ωₛ·StandardScore_s + ω_OC·(1−OC) + ω_cb·CoBenefitScore`.

| Parameter | Source |
|---|---|
| Criterion weights wⱼ | ICVCM AF + rating-agency rubrics |
| Conformance cⱼ | PDD, monitoring report, VVB statement (NLP-extracted + analyst) |
| Verified ERR | Independent baseline re-estimation (IPCC Tier 2/3 EFs) |
| CoBenefitScore | SDG evidence, CCB/SD-VISta certification |

### 8.4 Data requirements
Registry API pulls (Verra, Gold Standard, ACR, CAR, ICVCM CCP database), PDD/monitoring/verification PDFs,
VVB accreditation status, ICAO CORSIA eligible-unit list. Platform already seeds requirement taxonomies;
the missing layer is document ingestion and a registry connector.

### 8.5 Validation & benchmarking plan
Reconcile CCP decisions against ICVCM's published assessed-methodology list; correlate composite Q with
BeZero/Sylvera letter grades on a shared sample (target rank correlation >0.7); backtest over-crediting
flags against known invalidations (e.g. Verra REDD+ 2023 reversals).

### 8.6 Limitations & model risk
Document-based conformance is analyst-intensive and lags registry updates; over-crediting re-estimation
depends on contested baselines. Conservative fallback: treat unknown criteria as fail, and default to the
lowest of standard-level and rating-agency scores where they diverge.
