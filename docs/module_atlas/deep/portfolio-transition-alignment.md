## 7 · Methodology Deep Dive

This module is comparatively grounded: it holds curated portfolios with hand-set sector weights and
sector ITRs, and it computes the **genuine budget-weighted ITR** `Σ(wᵢ·ITRᵢ)/Σwᵢ` the guide
specifies. Two caveats: the portfolio-level ITR/GFANZ/TPT/PACTA inputs are curated point values
(not derived from holdings), and the PACTA alignment chart uses a **nonstandard `sin`-based scaler**
rather than real technology-pathway data. A third, code-level (not guide↔code) defect: the GFANZ/TPT
tab's in-page copy labels the TPT radar "Taskforce on Nature framework" — TPT is the UK
**Transition Plan Taskforce**, unrelated to TNFD (Taskforce on Nature-related Financial
Disclosures); this is a one-line factual mislabel, not a methodology gap.

### 7.1 What the module computes

```js
computedITR = Σ_sec (weight_sec · itr_sec) / Σ_sec weight_sec           // real weighted ITR
tptOverall  = (tpt_strategy + tpt_governance + tpt_metrics) / 3         // 3-pillar mean
// PACTA chart per sector:
factor      = 0.8 + 0.2 · (sin(si·2.3 + sectors.length) + 1)            // ⚠ nonstandard scaler
aligned     = min(100, pacta_aligned · factor)
misaligned  = min(100, pacta_misaligned · (1.4 − factor + 0.8))
```

`computedITR` is the headline (guarded `totalW===0 ? port.itr`). The ITR color-bands at <2 (green),
<2.5 (amber), else red are applied to the computed value.

### 7.2 Parameterisation / provenance

| Quantity | Source | Provenance |
|---|---|---|
| `PORTFOLIOS` (22 rows) | curated: aum, itr, gfanz, nz_year, interim_2030, tpt_*, pacta_* | hand-authored demo portfolios |
| sector `itr`, `weight` | per-sector curated (Energy 3.8, Tech 1.8…) | curated; Energy hottest, Tech coolest (realistic) |
| `tpt_strategy/governance/metrics` | 0–100 curated | curated TPT 3-pillar scores |
| `pacta_aligned/misaligned` | curated % | curated |
| PACTA `factor` | `0.8 + 0.2·(sin(si·2.3)+1)` | **nonstandard PRNG-style scaler**, not pathway data |
| escalation register | curated (Glencore, RWE, ArcelorMittal…) | hand-authored stewardship rows |

The `computedITR` is methodologically correct; the PACTA `factor` is the one fabricated element — it
manufactures per-sector alignment values from a deterministic sine, not from technology mix vs a
1.5 °C pathway.

### 7.3 Calculation walkthrough

1. Select a portfolio → `port`.
2. `computedITR` = weight-average of the portfolio's sector ITRs (the guide's budget-method proxy).
3. `tptOverall` = mean of the 3 TPT pillar scores.
4. GFANZ tab reads the curated commitment status; radar plots the 3 pillars.
5. PACTA tab manufactures aligned/misaligned bars via the `sin` `factor`.
6. ITR trajectory chart plots `{2023: 2.9, 2024: computedITR, …}`.

### 7.4 Worked example

Two sectors: Energy (weight 8.2, ITR 3.8) and Technology (weight 14.2, ITR 1.8), Σweight 22.4:

| Output | Computation | Result |
|---|---|---|
| numerator | 8.2·3.8 + 14.2·1.8 = 31.16 + 25.56 | 56.72 |
| computedITR | 56.72 / 22.4 | 2.53 °C |
| band | 2.53 ≥ 2.5 → red | red |
| tptOverall (62,71,58) | (62+71+58)/3 | 63.7 /100 |

The full-portfolio `computedITR` uses all 8 sectors; this 2-sector slice illustrates the weighting.

### 7.5 Data provenance & limitations

- **Curated portfolio data**, not `sr()`-seeded; `computedITR` and `tptOverall` are real computations.
- Portfolio-level `itr`, `gfanz`, `pacta_*` are curated point values, not aggregated from underlying
  holdings — the sector-level ITR aggregation is the only true bottom-up number.
- The PACTA alignment chart is **fabricated by a `sin` scaler**; it does not reflect technology-pathway
  alignment and should not be read as PACTA output.

**Framework alignment:** GFANZ — commitment status (NZAM/NZAOA/NZBA) shown as a curated label · UK TPT
— the 3-pillar (Strategy/Governance/Metrics, mapped to Ambition/Action/Accountability) mean is a
faithful TPT-readiness proxy · PACTA 2020 — *named* but the alignment values are synthetic, not
technology-mix vs scenario pathways · Paris Article 2.1(a) — the 1.5 °C reference behind the ITR bands.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute portfolio transition alignment bottom-up from holdings: budget-method ITR, GFANZ commitment
coverage, TPT readiness, and genuine PACTA technology alignment — for stewardship and NZAM reporting.

### 8.2 Conceptual approach
The **PACTA 2020** technology-pathway method (compare portfolio technology mix vs IEA scenario
build-out) plus the **SBTi budget-method ITR**, mirroring the 2 Degrees Investing Initiative PACTA
tool and TPT Disclosure Framework scoring.

### 8.3 Mathematical specification
```
ITR_pf     = T_budget / ( Σ_t ProjectedEmissions_t / AllocatedBudget_t )     # guide budget method
Alignment_k= (PortfolioCapacity_k,t − ScenarioCapacity_k,t) / ScenarioCapacity_k,t   # per technology k
PACTA_score= Σ_k exposure_k · 1{ Alignment_k ≥ 0 }
GFANZ_cov  = Σ_i w_i · 1{ commitment_i ∈ {NZAM,NZAOA,NZBA} }
TPT_ready  = mean(Ambition, Action, Accountability)   # sub-criteria scored per TPT rubric
```

| Parameter | Calibration source |
|---|---|
| `ScenarioCapacity_k,t` | IEA NZE / WEO technology build-out by sector |
| `AllocatedBudget_t` | IPCC AR6 sector carbon budget |
| commitment status | GFANZ alliance membership registries |
| TPT sub-criteria | UK TPT Disclosure Framework scoring guide |
| technology exposure | company production/asset data (PACTA input) |

### 8.4 Data requirements
`technology_capacity` (MW, Mt by tech), `production_plans`, `commitment_status`, `emissions_trajectory`,
`weight`. Sources: asset-level production data (PACTA/Asset Resolution), GFANZ registries (free), IEA
scenarios (free), TPT rubric. Sector weights/ITRs partially exist.

### 8.5 Validation & benchmarking plan
Reconcile `ITR_pf` against the PACTA tool and SBTi portfolio scores; verify technology alignment signs
against IEA build-out; check GFANZ coverage against alliance member lists; TPT scores against disclosed
transition plans.

### 8.6 Limitations & model risk
Asset-level production data is costly and sparse; scenario technology paths are uncertain; ITR
budget-method is sensitive to allocation choice. Conservative fallback: report ITR as a methodology
band (PACTA vs SBTi vs weighted-average) as the current METHODOLOGIES table implies.
