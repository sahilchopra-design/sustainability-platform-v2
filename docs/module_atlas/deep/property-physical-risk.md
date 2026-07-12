## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide headlines a **CRREM stranding-year** model
> `Strand = min{t : EUI(t) > CRREM_pathway(t)}` with a "portfolio avg stranding year 2031" and "avg
> EUI 182 kWh/m²/yr". **No stranding, EUI, or CRREM-pathway logic exists in this module.** (CRREM
> lives in the separate `/crrem` route, which this page even links to for portfolio seeding.) What
> this module actually implements is a **multi-peril physical-hazard exposure engine**: six hazards
> scaled by SSP × time-horizon multipliers, reduced by adaptation measures, aggregated to a composite,
> then translated into a climate-adjusted insurance premium and a portfolio Value-at-Risk. Sections
> below document the code.

### 7.1 What the module computes

The page consumes an **externally-seeded RE portfolio** from `localStorage['ra_re_portfolio_v1']`
(produced by the CRREM module); each property carries a `physicalRisk` object with per-hazard scores.
Per hazard `h` and property:

```js
raw  = override[h] ?? physicalRisk[h] ?? 0                       // 0–100 base hazard score
val  = min(100, raw × sspMult × horizonMult)                    // scenario + horizon scaling
for each active adaptation applicable to h:
       val = val × (1 − risk_reduction_pct/100)                 // multiplicative mitigation
adjusted[h] = clamp(val, 0, 100)

composite     = Σ_h adjusted[h] / 6                             // simple mean of 6 hazards
acuteAvg      = mean(adjusted over Acute hazards)               // flood, cyclone, wildfire
chronicAvg    = mean(adjusted over Chronic hazards)             // heat, drought, sea level
compoundFloodSea = min(100, 0.4·flood + 0.35·sealevel + 0.25·cyclone)
```

**Insurance repricing & VaR:**

```js
insuranceMult      = 1 + composite/100                          // up to 2× at composite=100
climateAdjPremium  = basePremium × insuranceMult
totalVaR           = Σ (composite/100) × GAV × 0.15             // 15% max-loss anchor × hazard fraction
```

**Portfolio-discount scenarios** (value-erosion tab): `discount = avgRisk × 0.15 × t × ssp_factor`
where `ssp_factor` = 1.0 (SSP2-4.5) or 1.4 (SSP5-8.5), `t` a time index — value = `GAV × (1 − discount)`.

### 7.2 Parameterisation / provenance

| Parameter | Value | Provenance |
|---|---|---|
| SSP multipliers | 0.8 / 1.0 / 1.4 (SSP1-2.6 / 2-4.5 / 5-8.5) | in-code (IPCC SSP-RCP ordering; values heuristic) |
| Horizon multipliers | 1.0 / 1.3 / 1.8 (2030 / 2050 / 2100) | in-code heuristic (rising hazard over time) |
| Compound flood weights | 0.40 / 0.35 / 0.25 | in-code heuristic |
| VaR loss anchor | 15% of GAV at full hazard | in-code (single scalar; not peril-specific) |
| Adaptation cost / reduction | e.g. Seawall $2.5M / −45% | hand-authored measure table (8 measures) |
| Resilience (if missing) | `50 + (sr(idx)·2−1)·20` | **synthetic fallback** (40–70) |
| Hazard base scores | from seeded RE portfolio | inherited (synthetic upstream) |

The **only in-module `sr()`** is the resilience fallback when a property lacks
`building_resilience_score`; hazard scores themselves originate in the upstream portfolio.

### 7.3 Calculation walkthrough

1. Load portfolio; if absent, prompt user to seed via CRREM.
2. For each property, apply SSP × horizon scaling to each hazard, then adaptation reductions.
3. Composite = mean of 6 adjusted hazards → risk tier (≥70 Critical, ≥50 High, ≥30 Medium, else Low).
4. Insurance premium scaled by `1 + composite/100`; VaR = hazard fraction × GAV × 15%.
5. Adaptation tab: per measure, `reducedScore = current × (1 − reduction%)`, annual saving =
   `(current − reduced)/100 × GAV × 0.002`, payback = `cost / annualSaving`.

### 7.4 Worked example (one property, SSP5-8.5 @ 2050)

Base hazard scores flood 60, cyclone 30, wildfire 20, heat 50, drought 40, sealevel 45; GAV $80M;
base premium $120k; SSP mult 1.4, horizon mult 1.3 (→ combined ×1.82); no adaptations.

| Hazard | raw | ×1.82 (cap 100) |
|---|---|---|
| flood | 60 | 100 (capped) |
| cyclone | 30 | 54.6 |
| wildfire | 20 | 36.4 |
| heat | 50 | 91.0 |
| drought | 40 | 72.8 |
| sealevel | 45 | 81.9 |

`composite = (100+54.6+36.4+91.0+72.8+81.9)/6 = 72.8` → **Critical**.
`insuranceMult = 1 + 0.728 = 1.728` → premium `$120k × 1.728 = $207k`.
`VaR = 0.728 × $80M × 0.15 = $8.74M`. Adding a Seawall (−45% on flood & sealevel) drops those two
hazards, lowering composite and premium — the adaptation payback tab quantifies the trade.

### 7.5 Data provenance & limitations

- **Hazard scores are inherited from a synthetic upstream portfolio**; the only in-page `sr()` is the
  resilience fallback. There is no live hazard raster, catalogue, or return-period loss curve.
- **No CRREM stranding, no EUI, no transition/carbon-pathway** — the guide's central methodology is
  absent from this route (it exists in `/crrem`).
- The 15% VaR anchor is a **single scalar applied to all perils and all severities** — not a
  probabilistic loss distribution; it is `E[loss] ≈ hazard% × GAV × 15%`, a crude expected-damage
  proxy, not a percentile VaR.
- SSP and horizon multipliers are flat scalars, not hazard-specific damage functions; a flood score
  and a heat score scale identically with warming, which is physically wrong (heat rises faster).
- Adaptation reductions are multiplicative constants, independent of severity.

**Framework alignment:** The module references **IPCC SSP-RCP scenarios** (SSP1-2.6 / 2-4.5 / 5-8.5,
correctly ordered by forcing), the **acute/chronic hazard taxonomy** from **TCFD** (flood/cyclone/
wildfire acute; heat/drought/sea-level chronic — correctly classified), and (via the guide) **CRREM
Global Pathways** and **JLL** physical-risk framing. CRREM derives a stranding year by comparing an
asset's carbon-intensity trajectory to a science-based 1.5 °C decarbonisation pathway — that logic is
in the CRREM module, not here. A production physical-risk model needs §8.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Produce, per property and portfolio, a probabilistic climate physical-risk
loss (expected annual loss and tail VaR) and a climate-adjusted insurance premium, under SSP-RCP
scenarios and time horizons. Coverage: any RE asset with location, GAV, and construction attributes.

**8.2 Conceptual approach.** A **hazard × exposure × vulnerability damage-function model**, mirroring
(i) Munich Re / Swiss Re CatNet and (ii) Moody's/427 and Jupiter Intelligence asset-level physical
risk. Each peril has its own hazard-intensity distribution (from downscaled climate projections), a
depth/intensity-damage function, and asset vulnerability — the standard cat-model structure, not a
single 15% scalar.

**8.3 Mathematical specification.**
Per peril k: annual exceedance-probability curve `EP_k(loss)` from
`loss = GAV × DF_k(intensity) × V_asset`, `DF_k` a peril-specific damage function (e.g. flood
depth-damage). Expected annual loss `EAL = Σ_k ∫ loss · dEP_k`. Portfolio VaR at p:
`VaR_p = quantile_p(Σ_k loss_k)` via Monte Carlo over correlated peril intensities.
Scenario/horizon shift hazard distributions: `intensity_{s,t} = intensity_base × Δ_{k,s,t}`
(peril-, scenario-, horizon-specific, from climate projections — replaces the flat SSP×horizon scalar).
Premium: `premium = EAL × (1 + loading) + capitalCharge(VaR)`.

| Parameter | Symbol | Calibration source |
|---|---|---|
| Damage functions | `DF_k` | JRC/FEMA HAZUS flood depth-damage; wind/wildfire curves |
| Hazard shift | `Δ_{k,s,t}` | CMIP6 downscaled SSP1-2.6/2-4.5/5-8.5 projections |
| Vulnerability | `V_asset` | construction type, age, elevation (ND-GAIN / engineering) |
| Peril correlation | ρ | historical multi-peril co-occurrence (EM-DAT, Swiss Re sigma) |
| Insurance loading | loading | market cat-loading benchmarks |

**8.4 Data requirements.** Per asset: geocode, GAV, floor area, construction type, age, elevation,
flood zone. Hazard layers: CMIP6/WRI Aqueduct flood, wildfire, cyclone, heat. Sources: Aqueduct,
NASA NEX-GDDP, EM-DAT. Platform holds seeded RE portfolio + hazard scores; needs real hazard rasters
and damage functions.

**8.5 Validation & benchmarking.** Backtest EAL against historical property claims; reconcile VaR
against vendor cat-model output (Moody's 427, Jupiter); sensitivity to damage-function choice and
scenario; stability of premium uplift vs reinsurance benchmarks.

**8.6 Limitations & model risk.** Damage functions are the dominant uncertainty; downscaled climate
projections carry large model spread → report EAL/VaR as ranges across climate models. Conservative
fallback: where asset attributes are missing, use construction-class median vulnerability and flag
low confidence; never present a single-scalar VaR as a percentile.
