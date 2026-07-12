## 7 · Methodology Deep Dive

This tier-A module is stronger than most: it decodes **six real ESG-rating provider methodologies**
(MSCI IVA, Sustainalytics ESG Risk, ISS QualityScore, CDP, S&P Global CSA, Bloomberg) with accurate
scales, normalisation rules, pillar weights and coverage, and runs a genuine cross-provider divergence
+ Pearson-correlation analysis over a real security universe. The scores use `getEsgRatings` which
**prefers real EODHD ESG data**, falling back to `sr()` seeds. A backend (`esg_ratings_engine.py`)
implements an even more rigorous divergence model (Berg-et-al decomposition, honest missing-score
handling) but the frontend does **not** call it (0 axios/fetch). One caveat below on the divergence
metric.

> ⚠️ **Metric note (not a full mismatch).** The guide's **Inter-Provider Divergence Index** is a
> *coefficient of variation* `DI = σ(scores)/μ(scores)`. The frontend computes divergence as a simple
> **range** `max − min` of the six normalised scores, not the CV. The backend `analyse_rating_divergence`
> uses the correct **standard deviation** (`statistics.stdev`) with a Berg-et-al 56/23/21 scope/weight/
> measurement decomposition — so the *rigorous* metric exists server-side but the rendered page shows
> the cruder range.

### 7.1 What the module computes

Per company (from the real security universe, first 150 equities):

```js
realRatings = getEsgRatings(ticker, sector, i)      // real EODHD if available, else sr() seed
// normalise back to provider-native scales for display, then:
consensus  = round( (msci + sust + iss + cdp + sp + bbg) / 6 )     // 6-provider mean, 0–100
divergence = round( max(scores) − min(scores) )                    // RANGE (not CV, not σ)
// quarterly history: 12 quarters of deterministic drift from the base score
```

Portfolio KPIs: `avgConsensus`, `avgDivergence`, `highDiv = #(divergence>40)`.
Correlation tab: pairwise Pearson `ρ = cov / √(var₁·var₂)` across companies for each provider pair.
Sector-bias tab: per-sector mean and `stdDev = √(Σ(v−mean)²/n)` of provider scores.

### 7.2 Parameterisation — real provider methodology reference

`METHODOLOGY_DATA` is accurate, curated reference content:

| Provider | Scale | Normalisation | Key issues | Pillar weights |
|---|---|---|---|---|
| MSCI IVA | AAA–CCC (7-pt) | 14.3–100 linear | 35 per GICS sub-industry | E .33 / S .33 / G .34 |
| Sustainalytics | 0–100 (lower=better) | `100 − raw` | 20 MEIs | Exposure .5 / Mgmt .5 |
| ISS QualityScore | 1–10 decile (1=best) | `(10−raw)/9×100` | 16 themes | E .30 / S .30 / G .40 |
| CDP | A…D- (8-pt) | `(8−idx)/7×100` | 11 | Disclosure/Aware/Mgmt/Lead |
| S&P Global CSA | 0–100 | direct | 61 criteria | E .30 / S .30 / G&E .40 |
| Bloomberg | 0–100 | direct | disclosure completeness | — |

These normalisation formulas are **correct and provider-authentic** (e.g. Sustainalytics is an
inverted *risk* score, so higher-is-better requires `100 − raw`; ISS is a 1=best decile). This is the
module's most valuable content.

### 7.3 Calculation walkthrough

1. Build 150 companies from `SECURITY_UNIVERSE`; each score via `getEsgRatings` (real→seed fallback).
2. Convert normalised 0–100 back to each provider's native display scale (MSCI letter, ISS 1–10, etc.).
3. `consensus` = mean of six normalised scores; `divergence` = max−min range.
4. Correlation tab: Pearson ρ across the company panel for each provider pair (this is a *genuine*
   cross-sectional correlation — the correct way to measure provider agreement).
5. Sector-bias tab: mean ± stdev of scores by sector; Portfolio Lab: weighted consensus + divergence
   alerts above a user threshold.

### 7.4 Worked example — a company with six scores

Normalised scores `MSCI 72, Sustainalytics 68, ISS 55, CDP 80, S&P 74, Bloomberg 61`:
`consensus = round((72+68+55+80+74+61)/6) = round(68.3) = 68`; `divergence = 80 − 55 = 25` (amber
band, "material disagreement"). The guide's CV would instead be `σ/μ`: `σ ≈ 8.5`, `μ = 68.3`, `CV ≈
0.125` — a different (dimensionless) figure. The backend would report `σ ≈ 8.5` and split it 56/23/21
into scope (4.8) / weight (2.0) / measurement (1.8) per Berg et al.

### 7.5 Data provenance & limitations

- **Scores prefer real EODHD ESG data**, `sr()`-seeded only as fallback — better provenance than most
  ESG modules. Quarterly history is deterministic drift (`sr()`-jittered).
- **Provider methodology descriptions are accurate real reference content.**
- Divergence = range (max−min) is cruder than the guide's CV or the backend's σ; a single outlier
  provider dominates it.
- The rigorous backend (`esg_ratings_engine.py`: stdev, Berg decomposition, honest missing scores,
  bias detection) is **not wired** to the frontend.

**Framework alignment:** the six providers are decoded faithfully — **MSCI ESG Ratings** (exposure×
management across 35 industry key issues, controversies as deduction, AAA–CCC), **Sustainalytics ESG
Risk Rating** (unmanaged-risk = exposure − management, 0–100 lower-better), **ISS QualityScore**
(governance-heavy decile ranking), **CDP** (4-level disclosure/awareness/management/leadership),
**S&P CSA** (61 criteria, DJSI selection), **Bloomberg** (disclosure-completeness). The divergence
analysis reflects the **Berg, Kölbel & Rigobon (2022) "Aggregate Confusion"** finding that ESG-rating
disagreement decomposes ~56% scope / ~23% weight / ~21% measurement — implemented exactly in the
backend.

### 8 · Model Specification

**Status: specification — not yet implemented in the rendered UI** (backend implements the rigorous
version; frontend uses range + seed fallback).

**8.1 Purpose & scope.** Quantify inter-provider ESG-rating disagreement per issuer, decompose its
sources, and flag issuers where mechanical single-provider reliance is unsafe.

**8.2 Conceptual approach.** Coefficient-of-variation / standard-deviation divergence on normalised
scores, with **Berg-et-al scope/weight/measurement decomposition** and cross-sectional Pearson
correlation for provider agreement — the industry-standard "aggregate confusion" framework.

**8.3 Mathematical specification.**
- Normalise each provider to 0–100 higher-better via its published scale (table §7.2).
- Divergence: `DI_i = σ(scores_i)/μ(scores_i)` (CV) or `σ(scores_i)` (absolute); flag `DI>0.25`.
- Source split: `σ_scope = 0.56σ`, `σ_weight = 0.23σ`, `σ_meas = 0.21σ`.
- Consensus: `μ_i`; 95% CI `μ_i ± 1.96·σ_i/√n`.
- Provider agreement: `ρ_{pq} = corr(score_p, score_q)` across the issuer panel.

| Parameter | Source |
|---|---|
| Normalisation scales | provider methodology docs (METHODOLOGY_DATA) |
| Decomposition 56/23/21 | Berg, Kölbel & Rigobon (2022) |
| Divergence flag 0.25 | guide threshold |
| Panel for ρ | cross-issuer score matrix |

**8.4 Data requirements.** ≥2 provider raw scores per issuer (EODHD partially supplies), issuer→GICS,
a multi-issuer panel for correlations. Backend already ingests these.

**8.5 Validation & benchmarking plan.** Reconcile ρ against published provider-correlation studies
(~0.4–0.6); verify decomposition sums to σ; sensitivity of consensus to provider inclusion.

**8.6 Limitations & model risk.** Normalisation across ordinal (letter/decile) and cardinal scales is
lossy; missing providers bias μ/σ; CV unstable when μ→0; single-snapshot correlation is undefined
(needs the panel).
