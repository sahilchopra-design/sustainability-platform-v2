## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry advertises an **ELRS** =
> `w₁·Disclosure + w₂·EmissionsTrajectory + w₃·GreenwashSignal + w₄·JurisdictionIntensity` calibrated
> to *historical litigation outcomes*. **The frontend page does not implement that formula.** It scores
> entities with a fixed-weight composite of *disclosure adequacy, physical risk, transition risk,
> precedent risk and reputational risk* — there is no emissions-trajectory term, no greenwashing-NLP
> term and no jurisdiction-intensity term in the score, and no calibration to outcomes. All inputs are
> synthetic (`sr()` seeded). A genuine attribution-science / disclosure-liability methodology
> (Meehl-Haugen-Christidis attribution, 8 SEC-style disclosure triggers) *does* exist, but only in the
> backend engine `climate_litigation_engine.py`, which the page never calls for its scores. The
> sections below document the page as coded and specify the production model in §8.

### 7.1 What the module computes

For a synthetic universe of entities (`i`-indexed), the page assigns each a **Litigation Risk Score**
(0–100) from five weighted dimensions (source lines 86–92):

```js
litigationRiskScore = clamp(0,100, round(
    (1 - disclosureAdequacy/100) * 30     // disclosure gap → 30 pts
  + physRisk/100          * 20            // physical exposure → 20 pts
  + transRisk/100         * 20            // transition exposure → 20 pts
  + precedentRisk/100     * 15            // precedent → 15 pts
  + reputationalRisk/100  * 15 ))         // reputation → 15 pts
```

Portfolio "Litigation VaR" is a heuristic exposure-weighting, **not** a statistical VaR:

```js
varE = totalExposureUSD * litigationRiskScore / 100      // per entity
base = Σ varE  (over filtered set)                       // portfolio litigation VaR
```

### 7.2 Parameterisation / scoring rubric

| Input | Generation (seed) | Range | Provenance |
|---|---|---|---|
| `disclosureAdequacy` | `sr(i·23)·80+10` | 10–90 | synthetic demo value |
| `physRisk`, `transRisk` | `sr(i·29)·90+5`, `sr(i·31)·90+5` | 5–95 | synthetic demo value |
| `precedentRisk`, `reputationalRisk` | `sr(i·37)·80+10`, `sr(i·41)·80+10` | 10–90 | synthetic demo value |
| `totalExposureUSD` | `(sr(i·61)·9+0.1)·1e9` | $0.1–9.1 bn | synthetic demo value |
| `legalCostEstimate` | `totalExposureUSD·0.05·sr(i·71)` | ≤5% of exposure | heuristic (5% legal-cost proxy) |
| Score weights | fixed 30/20/20/15/15 | sum = 100 | **unattributed** — not calibrated to any dataset |

The 30/20/20/15/15 weight vector is an author judgement; the guide's claim that weights are "calibrated
to historical litigation outcomes" is not evidenced in code.

### 7.3 Calculation walkthrough

Inputs (all `sr()`-seeded) → per-entity dimension scores → weighted sum → `litigationRiskScore`.
Entities feed: (a) `top20` bar chart (sorted desc), (b) `riskDist` 5-bin histogram, (c) `jurData`
jurisdiction roll-up (mean risk, summed exposure), (d) claim-type **HHI** = `Σ(vᵢ/total)²·10000`, and
(e) portfolio Litigation VaR with a "top-10 exclusion" reduction analysis.

### 7.4 Worked example

Entity with `disclosureAdequacy=40`, `physRisk=70`, `transRisk=60`, `precedentRisk=50`,
`reputationalRisk=30`, `totalExposureUSD=$4bn`:

| Term | Computation | Points |
|---|---|---|
| Disclosure gap | (1−0.40)·30 | 18.0 |
| Physical | 0.70·20 | 14.0 |
| Transition | 0.60·20 | 12.0 |
| Precedent | 0.50·15 | 7.5 |
| Reputational | 0.30·15 | 4.5 |
| **Score** | round(56.0) | **56 / 100** |
| Entity VaR | 4bn · 56/100 | **$2.24 bn** |

A score of 56 sits below the guide's High-Risk threshold (≥70), so this entity would not be flagged P0.

### 7.5 Data provenance & limitations

- **All entity data synthetic**, from `sr(s)=frac(sin(s+1)×10⁴)` (line 15). No connection to the Sabin
  Center database, court filings, or CDP disclosures named in the guide.
- Score dimensions are independent random draws — `physRisk` and `transRisk` are not derived from any
  emissions or hazard model, so the composite is a demonstration layout, not a risk estimate.
- "Litigation VaR" is exposure × score/100 summed — no probability of being sued, no loss distribution,
  no correlation. The eight `POST /assess`, `/attribution-science`, `/disclosure-liability`,
  `/fiduciary-duty` endpoints are wired in the backend engine but not consumed for the on-page score.

**Framework alignment:** UNEP *Global Trends in Climate Change Litigation 2023* (case-type taxonomy,
+46% greenwashing growth cited in guide) · Sabin Center Climate Litigation Databases (the authoritative
case register the score should draw from) · SEC Climate Disclosure Rule (Release 33-11275) as the
disclosure-liability trigger set implemented in the backend engine.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Estimate, per corporate/financial entity, the **1-year probability of being
named defendant in a material climate lawsuit** and the **expected legal + reputational loss**, to feed
credit, D&O underwriting and ESG-rating overlays. Coverage: listed issuers and large private entities in
jurisdictions tracked by the Sabin/LSE databases.

**8.2 Conceptual approach.** A **frequency-severity actuarial model** (mirroring D&O securities-litigation
pricing and Swiss Re liability-cat practice) rather than a heuristic score. Filing frequency is a logistic
hazard calibrated on the Sabin Center case panel (analogous to Cornerstone Research securities-class-action
base rates); severity is a lognormal loss draw conditioned on claim type. Attribution weight uses the
peer-reviewed **Meehl-Haugen-Christidis attribution confidence** already coded in the backend engine.

**8.3 Mathematical specification.**
Filing probability (logistic):
```
p_sue = σ( β0 + β_disc·DisclosureGap + β_emit·EmissionsTrajGap
             + β_gw·GreenwashScore + β_jur·JurIntensity + β_att·AttribConfidence )
```
Expected severity for claim type k: `E[L_k] = exp(μ_k + σ_k²/2)`, μ_k,σ_k from case-award data.
Expected annual litigation loss and reputational overlay:
```
ELL = p_sue · Σ_k π_k · E[L_k]                    (π_k = claim-type mix)
Reputational = ELL · ρ    (ρ market-value-erosion multiplier, event-study calibrated)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Base log-odds & β's | β0…β_att | MLE on Sabin/LSE Grantham case panel |
| Claim mix π_k | π | UNEP 2023 case-type distribution |
| Severity μ_k,σ_k | μ,σ | historical award/settlement data (D&O, Cornerstone) |
| Attribution conf. | AttribConfidence | Meehl-Haugen-Christidis (backend engine) |
| Erosion ρ | ρ | event-study of stock reaction to filings (Sato et al.) |

**8.4 Data requirements.** Entity emissions trajectory vs SBTi target (platform `paris-alignment`,
`reference_data` SBTi table); disclosure-gap score (backend `disclosure-liability` endpoint); jurisdiction
enforcement index (Sabin jurisdiction profiles); AttribConfidence (backend `attribution-science`
endpoint). Vendor: Sabin/LSE case data; free: UNEP report distributions.

**8.5 Validation & benchmarking.** Backtest predicted vs realised filings by cohort year; ROC/AUC on the
Sabin panel; severity backtest against realised settlements; reconcile ELL against D&O premium levels.

**8.6 Limitations & model risk.** Small-N novel case types → wide severity intervals; survivorship/reporting
bias in case databases; attribution science evolving. Conservative fallback: cap `p_sue` and floor severity
at claim-type medians when entity data is sparse.
