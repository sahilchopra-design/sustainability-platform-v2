## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry for this route describes **green bond
> due diligence** — ICMA Green Bond Principles use-of-proceeds scoring, EU Green Bond Standard
> verification, EU Taxonomy DNSH checks, and a weighted formula
> `IntegrityScore = 0.35×UseOfProceeds + 0.30×ProcessMgmt + 0.20×IssuerESG + 0.15×Reporting`.
> **None of that exists in the code.** What `CreditIntegrityDDPage.jsx` actually implements is
> **voluntary carbon-market credit integrity due diligence**: a 5-dimension integrity score for 18
> synthetic carbon credits, ICVCM Core Carbon Principles dimension bars, greenwashing flag
> frequencies, and an integrity-adjusted price. The page header itself says
> "Additionality · Permanence · MRV quality · ICVCM CCP scoring" (EP-BN3). The sections below
> document the code as it behaves; the guide entry belongs to a different (green-bond) module.

### 7.1 What the module computes

For 18 synthetic carbon credits (`CR-001`…`CR-018`, one per country, cycling 6 project types ×
3 registries), the module derives:

```js
overall       = round((additionality + permanence + mrv + cobenefits + safeguards) / 5)
adjustedPrice = price × (0.5 + clamp(overall, 0, 100) / 100)     // integrity-adjusted price
greenwash_risk = overall <50 ? 'Very High' : <60 'High' : <72 'Medium' : <85 'Low' : 'Very Low'
reversal_risk  = permanence <50 ? 'High' : <65 'Medium' : 'Low'
flag           = overall < 55                                     // high-risk flag
```

The five sub-scores are equally weighted (⅕ each) — no code comment justifies the weighting; it is
a design choice, not a cited standard. `adjustedPrice` is a linear map: a score of 50 leaves price
unchanged (×1.0), a perfect 100 earns ×1.5, a zero score halves the price (×0.5).

### 7.2 Parameterisation

All per-credit inputs are seeded synthetic values from `sr(seed) = frac(sin(seed+1)×10⁴)`:

| Field | Formula | Range |
|---|---|---|
| `additionality` | `round(40 + sr(i×5)×55)` | 40–95 |
| `permanence` | `round(35 + sr(i×7)×60)` | 35–95 |
| `mrv` | `round(50 + sr(i×9)×45)` | 50–95 |
| `cobenefits` | `round(30 + sr(i×11)×65)` | 30–95 |
| `safeguards` | `round(45 + sr(i×13)×50)` | 45–95 |
| `price` ($/t) | `2 + sr(i×17)×18` | $2–20 |
| `vintage` | `2018 + floor(sr(i×19)×6)` | 2018–2023 |
| `sdgs` | `round(3 + sr(i×23)×12)` | 3–15 goals |

Hard-coded rubric tables (all synthetic demo values, no cited source):

- **`CCP_DIMS`** — 8 ICVCM-style dimensions with fixed portfolio scores: Governance 74,
  Tracking 81, Transparency 68, Robust MRV 77, Additionality 62, Permanence 55 (weakest),
  No net harm 88, Sustainable Dev 79. A ReferenceLine at 70 is labelled "CCP Min".
- **`GREENWASH_FLAGS`** — 8 indicators with fixed frequency/severity, e.g. "Avoided deforestation
  only" 52% (Medium), "Over-credited baseline" 38% (High), "Negative co-benefit claims" 8%
  (Very High). The categories echo real VCM criticisms (over-crediting, buffer adequacy, FPIC,
  leakage) but the percentages are illustrative.
- **`INTEGRITY_TIERS`** — 5 price tiers: Gold (85–100) +22%, Silver (70–84) +8%, Standard (55–69)
  ±0%, Below Standard (40–54) −18%, Non-compliant (<40) −42%, with market volume shares
  18/38/28/12/4%. These premiums are stated, not derived from the credit data.
- KPI literals: "Overall CCP Score 72/100", "CCP-Eligible 61%", "VCMI Claim Ready 38%",
  "FPIC Compliance 62%", "Leakage Assessed 71%" — all hard-coded strings.

### 7.3 Calculation walkthrough

1. **Portfolio Integrity tab** — `avgIntegrity = round(Σ overall / max(1, n))`;
   `flagged = count(overall < 55)`; `avgAdjustedPremium = (Σ adjustedPrice / Σ price − 1) × 100`
   (a volume-unweighted ratio of sums); distribution bars bucket `overall` into the 5 tier bands;
   the radar shows portfolio-mean sub-scores vs a flat benchmark of 70.
2. **Credit Due Diligence tab** — sortable scorecard (`[...CREDITS].sort` on overall/price/
   additionality — non-mutating); selecting a row builds an 8-axis radar where axes 1–5 are the
   credit's real sub-scores and axes 6–8 (Registry Standard, Verification Body, Project Vintage)
   are **fresh seeded values** `80+sr(i×7)×20`, `65+sr(i×11)×30`, `55+sr(i×13)×40` — identical for
   every credit because they seed on the dimension index, not the credit.
3. **ICVCM CCP tab** — static `CCP_DIMS` bars plus a standards matrix where each cell of
   6 standards × 6 criteria shows ✅ iff `sr(i×7 + j×11) > 0.25` (≈75% pass rate, purely random).
4. **Integrity Pricing tab** — tier premium bars (`parseFloat('+22%')` → 22) and a market-vs-
   adjusted price comparison for the first 12 credits.

### 7.4 Worked example — credit CR-001 (i = 0)

`sr(0) = frac(sin(1)×10⁴) = frac(8414.7098…) = 0.70981` (all i×k seeds are 0 for i=0):

| Step | Computation | Result |
|---|---|---|
| additionality | round(40 + 0.70981×55) | **79** |
| permanence | round(35 + 0.70981×60) | **78** |
| mrv | round(50 + 0.70981×45) | **82** |
| cobenefits | round(30 + 0.70981×65) | **76** |
| safeguards | round(45 + 0.70981×50) | **80** |
| overall | round((79+78+82+76+80)/5) = round(79.0) | **79** |
| price | 2 + 0.70981×18 | **$14.78** |
| adjustedPrice | 14.78 × (0.5 + 79/100) = 14.78 × 1.29 | **$19.07** |
| greenwash_risk | 79 ∈ [72, 85) | **Low** |
| reversal_risk | permanence 78 ≥ 65 | **Low** |
| flag | 79 ≥ 55 | not flagged |

Note the degenerate seeding: for i=0 every `sr(i×k)` collapses to `sr(0)`, so all five sub-scores
share the same random draw — CR-001's radar is nearly a regular pentagon.

### 7.5 Data provenance & limitations

- **Every credit attribute is synthetic**, generated by the platform PRNG `sr()`. No registry API
  (Verra/Gold Standard/ACR), no ratings-agency feed (BeZero, Sylvera, Calyx), no market price
  source. `CCP_DIMS`, `GREENWASH_FLAGS`, `INTEGRITY_TIERS` and all headline KPIs are hard-coded.
- The standards-alignment matrix (✅/⚠️) is random noise re-drawn per cell — it conveys no real
  mapping between VCMI/ICVCM/SBTi/Oxford Principles requirements.
- The integrity→price map (`0.5 + overall/100`) is a stylised heuristic; observed VCM quality
  premia are project-type- and vintage-specific and not linear in a composite score.
- Equal ⅕ weighting across the 5 dimensions is unattributed; ICVCM does not compute a numeric
  score at all (it is a pass/fail label — see below).

**Framework alignment:**
- **ICVCM Core Carbon Principles** — the real CCP framework is a *binary eligibility label*, not a
  0–100 score: the Integrity Council assesses (1) the *program* (registry) against governance,
  tracking, transparency and safeguards criteria, and (2) each *methodology category* against
  emissions-impact criteria (additionality, permanence, robust quantification, no double counting).
  Credits from an approved program **and** an approved category may carry the CCP label. The
  module's 8 `CCP_DIMS` paraphrase the 10 CCPs but present an invented numeric rubric.
- **VCMI Claims Code of Practice** — VCMI tiers (Silver/Gold/Platinum) grade the *user's* claim by
  the share of remaining emissions covered by CCP-quality credits (Silver ≥10–50%, Gold ≥50–100%,
  Platinum ≥100%), after meeting foundational criteria (GHG inventory, SBTi-aligned target). The
  "VCMI Claim Ready 38%" KPI is a hard-coded placeholder for that assessment.
- **REDD+ safeguards (UNFCCC Cancun) / FPIC** — referenced by the safeguards dimension and the
  "No FPIC documentation" flag; not operationalised beyond the seeded score.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Support carbon-credit purchase/retirement decisions and portfolio integrity reporting by producing
(a) a defensible per-project integrity rating and (b) an integrity-conditioned fair-value price,
for VCM credits across registries (Verra VCS, Gold Standard, ACR, CAR, Puro), covering nature-based
(REDD+, IFM, blue carbon) and engineered/household (renewables, cookstoves, methane) categories.

### 8.2 Conceptual approach

Two-layer design mirroring commercial carbon ratings and market pricing practice:

1. **Integrity rating layer** — a criteria-based expected-value model of *over-crediting risk*,
   benchmark: **BeZero Carbon Ratings** (7-point letter scale from an analyst-scored risk factor
   framework) and **Sylvera** (category-specific frameworks scoring carbon accounting, additionality,
   permanence, co-benefits). Rather than averaging scores, compute an **effective carbon ratio**
   `ECR ∈ (0,1]` = expected real tonnes per issued tonne, the quantity Calyx/BeZero ratings proxy.
2. **Pricing layer** — hedonic regression of transacted VCM prices on rating, project type, vintage,
   co-benefit certification and geography, benchmark: **Platts/S&P Global Platts CNC/CEC assessments**
   and **Ecosystem Marketplace transaction-level hedonic studies**.

### 8.3 Mathematical specification

**Step 1 — risk-factor scoring.** For project *p*, score K = 6 risk factors
`f_k ∈ [0,1]` (1 = no risk): additionality (baseline inflation), leakage, permanence/reversal,
measurement error, double counting, safeguards/legal. Each factor is scored from evidence
sub-criteria with analyst weights `v_{k,j}` (documented rubric per methodology category, as Sylvera
does per-category).

**Step 2 — effective carbon ratio.**

```
ECR_p = Π_k f_k^{w_k}          (log-linear aggregation; Σw_k = 1)
IntegrityScore_p = 100 × ECR_p
Rating_p = map(ECR): ≥0.9 AAA…A; 0.7–0.9 BBB…BB; 0.5–0.7 B; <0.5 C/D
```

Multiplicative aggregation (not the code's arithmetic mean) ensures one fatal flaw (e.g.
additionality f=0.2) caps the rating regardless of strong co-benefits — matching ICVCM's
gate logic.

**Step 3 — permanence adjustment (nature-based).** Expected reversal discount over horizon T:
`ECR_perm = (1 − λ)^T + B` where λ = annual reversal hazard (calibrate: 0.2–0.6%/yr baseline from
Verra AFOLU buffer determinations; wildfire-adjusted by region using EM-DAT/MODIS burn data) and
B = buffer-pool coverage ratio (registry buffer % of issuance).

**Step 4 — hedonic fair value.**

```
ln(P_p) = α + β₁·Rating_p + β₂·type_p + β₃·(vintage_year − issue_year)
          + β₄·CCP_label_p + β₅·CORSIA_eligible_p + β₆·co-benefit_certs_p + ε
```

| Parameter | Calibration source |
|---|---|
| w_k factor weights | Expert elicitation anchored to ICVCM Assessment Framework criteria weights; sensitivity-tested |
| λ reversal hazard | Verra AFOLU non-permanence risk tool ratings; EM-DAT wildfire frequency |
| B buffer ratio | Registry issuance records (Verra registry public data — already in platform `reference_data` Verra ingest) |
| β price coefficients | OLS on Ecosystem Marketplace / CBL exchange transaction data (annual EM "State of the VCM") |
| CCP label | ICVCM approved-program + approved-category lists (public) |

### 8.4 Data requirements

- Registry project records: methodology ID, vintage, issuance/retirement, buffer contributions —
  Verra/Gold Standard public registries (platform already ingests Verra into `reference_data`).
- Ratings (optional vendor): BeZero, Sylvera, Calyx API for benchmarking.
- Prices: CBL/Xpansiv settlement, Platts assessments (vendor); Ecosystem Marketplace annual (free).
- ICVCM CCP-approved program/category lists; CORSIA eligibility lists (ICAO, free).
- Country safeguards context: ITUC/WGI indices (free, World Bank).

### 8.5 Validation & benchmarking plan

- **Rating concordance:** Spearman rank correlation of model ratings vs BeZero/Sylvera on an
  overlap sample (target ρ > 0.7); confusion matrix at the investable/non-investable boundary.
- **Price backtest:** out-of-sample RMSE of hedonic fair value vs realised transactions per
  half-year; test β stability across 2021–2025 market regimes (post-2022 REDD+ repricing).
- **Event validation:** ratings should have flagged known over-crediting cases (e.g. widely
  reported REDD+ baseline inflation findings) — retrospective case-study file per Fed SR 11-7
  outcome analysis.
- Sensitivity: ±20% on each w_k; ECR distribution shift must stay within one rating notch for 80%
  of projects.

### 8.6 Limitations & model risk

- Analyst-scored factors carry subjectivity; mitigate with dual-scoring and inter-rater checks.
- Hedonic βs unstable in thin OTC markets; fall back to tier-median pricing with wide uncertainty
  bands when transaction counts < 30 per stratum.
- Reversal hazards are non-stationary under climate change; recalibrate λ annually and floor the
  permanence discount conservatively.
- Model must never be presented as an ICVCM/VCMI determination — those labels come only from the
  official bodies; the model *predicts* label eligibility.
