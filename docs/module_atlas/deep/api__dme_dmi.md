## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain. The sections below document
`backend/services/dme_dmi_engine.py` — the Dynamic Materiality Index (DMI) engine ported from
the standalone DME into Risk Analytics — exposed at `/api/v1/dme-dmi` via
`backend/api/v1/routes/dme_dmi.py`.)*

### 7.1 What the module computes

A stateless, velocity-aware ESG scoring engine with three endpoints:

1. **`POST /pcaf-attribution`** — PCAF financed emissions over holdings:
   ```
   AF = outstanding_amount / EVIC
   financed_emissions = Σ AF × entity_emissions_tCO2e
   financed_intensity = total_FE / total_outstanding
   weighted_pcaf      = Σ (DQS × FE_in_bucket) / total_FE
   ```
2. **`POST /entity`** — entity DMI from factor-level scores:
   ```
   S = Σ(w × c × x) / Σ(w × c)                       (confidence-weighted mean)
   DMI_adjusted = S × (1 + mean(velocity_z) × velocity_weight)
   ```
3. **`POST /portfolio`** — portfolio DMI: the same confidence-weighted aggregation over
   holdings' ESG scores (weights = outstanding shares, confidences from PCAF DQS × recency
   decay), a velocity overlay, and a multiplicative **concentration penalty**:
   ```
   penalty = [1 − α_entity × max(0, single_name_max − threshold)]
           × (1 − α_sector × HHI_sector) × (1 − α_geo × HHI_geo)      (floored at 0)
   DMI_final = S × (1 + velocity_adj) × penalty
   ```

`GET /ref/pcaf-confidence` returns the constant maps and formula strings.

### 7.2 Parameterisation

| Parameter | Value | Provenance |
|---|---|---|
| PCAF DQS → confidence | 1→1.00 · 2→0.85 · 3→0.70 · 4→0.55 · 5→0.40 (unknown → 0.70) | DME-authored mapping onto the PCAF 1–5 quality ladder |
| Recency decay | `c = base × e^(−0.20 × years)` — λ = 0.2/yr, ≈18% loss/yr (1 − e^−0.2) | DME model constant, documented in code |
| `single_name_threshold` | 0.05 (5% single-name share before penalty starts) | `DMIConfig` default |
| `alpha_entity / alpha_sector / alpha_geographic` | 0.20 / 0.15 / 0.10 | `DMIConfig` defaults (penalty slopes) |
| `velocity_weight` | 0.3 (how much the mean velocity z-score scales the base DMI) | `DMIConfig` default |
| Empty-portfolio PCAF fallback | weighted DQS defaults to 3.0 when total FE = 0 | engine code |

All config values are overridable per request via the optional `config` body. Inputs are
validated by Pydantic (outstanding > 0, EVIC > 0, ESG 0–100, DQS 1–5, HHIs 0–1).

### 7.3 Calculation walkthrough

Portfolio DMI: holdings' ESG scores are weighted by normalised outstanding amounts and by
`pcaf_to_confidence(DQS, recency_years)` — so a stale DQS-4 holding contributes far less than a
fresh DQS-1 holding of the same size. If the caller supplies `velocity_adjustments`
(entity → z-score of ESG-signal *velocity* from the DME's temporal layer), the mean z is scaled
by `velocity_weight` and inflates/deflates the base score. Finally the concentration penalty
scales the result down for single-name, sector-HHI and geography-HHI concentration — encoding
the DME thesis that a concentrated portfolio's materiality signal is less reliable/more
exposed. Entity DMI is the same aggregation over caller-supplied factor scores/weights/
confidences (lengths must match, else an error dict). PCAF attribution is the pure PCAF
listed-equity formula with EVIC as denominator.

### 7.4 Worked example — two-holding portfolio DMI

H1: $60M outstanding, ESG 80, DQS 1, fresh (0 yr) → confidence 1.00.
H2: $40M outstanding, ESG 50, DQS 3, 2 years old → confidence 0.70 × e^(−0.4) = 0.4692.
Concentration: single-name max 0.60, sector HHI 0.52, geo HHI 0.40. No velocity input.

| Step | Computation | Result |
|---|---|---|
| Weights | 0.6 / 0.4 | — |
| Numerator | 0.6×1.00×80 + 0.4×0.4692×50 | 57.384 |
| Denominator | 0.6 + 0.1877 | 0.7877 |
| Base DMI | 57.384 / 0.7877 | **72.85** |
| Entity penalty | 1 − 0.20×(0.60−0.05) = 0.890 | |
| Sector penalty | 1 − 0.15×0.52 = 0.922 | |
| Geo penalty | 1 − 0.10×0.40 = 0.960 | |
| Concentration factor | 0.890×0.922×0.960 | 0.7878 |
| **Final DMI** | 72.85 × 0.7878 | **57.39** |
| Weighted avg PCAF | 1×0.6 + 3×0.4 | 1.8 |

Note the confidence weighting pulls the base score toward the high-quality holding (72.85 vs
the naive exposure-weighted 68.0), and the reported `concentration_penalty` field is
`1 − 0.7878 = 0.2122`.

### 7.5 Data provenance & limitations

- **No PRNG, no DB, no embedded demo data** — a pure calculator; every number comes from the
  request. The only constants are the confidence map, decay rate and penalty slopes above.
- The DQS→confidence values, λ = 0.2/yr, α-slopes and velocity weight are **DME-authored
  calibrations**, not published PCAF/academic coefficients; PCAF defines the 1–5 ladder but not
  numeric confidence weights.
- PCAF attribution uses EVIC uniformly — correct for listed equity/bonds, but PCAF prescribes
  different denominators for other asset classes (total equity+debt for private companies,
  property value for mortgages), which this endpoint does not differentiate.
- The velocity overlay is linear and unbounded (`S × (1 + z̄ × 0.3)`) — a large positive mean
  z-score can push the adjusted DMI above 100; callers own the z-score computation (this engine
  does not derive velocities from time series — see `api::dme_policy_tracker` and the DME NLP
  layers for that).
- Concentration penalty treats HHIs as exogenous inputs; it does not compute them from holdings.

### 7.6 Framework alignment

- **PCAF Global GHG Accounting & Reporting Standard** — attribution factor = outstanding/EVIC
  for listed exposures, financed-emissions-weighted Data Quality Score (PCAF's own portfolio
  quality metric is precisely this FE-weighted DQS average).
- **Double materiality (CSRD/EFRAG)** — the DMI extends the platform's double-materiality
  engine with *dynamic* (velocity-weighted) materiality: the code comment positions it as a
  temporal overlay on impact/financial materiality scoring.
- **Herfindahl–Hirschman Index (HHI)** — the standard concentration measure (Σ share²) used for
  the sector/geography penalties, echoing supervisory concentration-risk treatment (e.g. Basel
  Pillar 2 granularity adjustments) in simplified multiplicative form.
- **EVIC (EU Benchmark Regulation / TEG usage)** — Enterprise Value Including Cash as the
  attribution denominator, consistent with EU Paris-aligned benchmark and PCAF practice.
