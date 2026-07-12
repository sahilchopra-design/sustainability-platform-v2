## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry promises *engineering fragility curves*,
> *IPCC SSP scenario overlays* and an *Adaptation NPV* (`AdaptNPV = Σ ΔEALt/(1+r)^t − CapexAdapt`).
> **The code implements none of these as fragility curves or a discounted NPV.** What it actually
> runs is a synthetic **hazard-weighted resilience score** (linear composite of five 0–100 hazard
> exposures), three flat loss-rate factors labelled "TCFD scenarios", a heuristic adaptation-need
> estimate (12 % of the value-weighted resilience gap), and a climate-adjusted discount rate that is
> never used to discount anything. All 60 assets are PRNG-seeded demo data. Sections below document
> the code as written.

### 7.1 What the module computes

For 60 synthetic infrastructure assets (10 types × 6 regions) the page derives a per-asset resilience
score and scenario loss estimate:

```js
hazard      = flood*0.28 + heat*0.22 + storm*0.22 + slr*0.18 + drought*0.10   // 0–100 composite
adaptCap    = clamp(20 + sr(i*31)*70 − age*0.4, 5, 95)                        // 0–100, age-penalised
resilience  = max(0, 100 − hazard × (1 − adaptCap/100))                       // headline score
```

Loss under three warming levels is a linear function of the hazard composite plus PRNG noise:

```js
loss15 = hazard*0.0008 + sr(i*37)*0.012    // fraction of asset value @1.5°C
loss20 = hazard*0.0018 + sr(i*41)*0.020    // @2°C
loss30 = hazard*0.0035 + sr(i*43)*0.035    // @3°C+
```

Adaptation need and the climate-adjusted discount rate (CADR):

```js
resGap   = max(0, 70 − resilience)                     // gap to "Resilient" band
adaptNeed= assetVal × resGap/100 × 0.12 + sr(i*47)*2   // £M
cadr     = (5.5 + sr(i*53)*3.0) + (hazard*0.02 + sr(i*59)*0.5)   // baseWacc + climSpread, %
```

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance |
|---|---|---|
| Hazard weights (flood/heat/storm/SLR/drought) | 0.28 / 0.22 / 0.22 / 0.18 / 0.10 | Author judgement; sum = 1.00. No external calibration in code |
| Adaptive-capacity age penalty | `−age×0.4` | Synthetic heuristic — older asset ⇒ lower adaptive capacity |
| Adaptive-capacity clamp | [5, 95] | Guards score bounds |
| Loss slopes (1.5/2/3 °C) | 0.0008 / 0.0018 / 0.0035 per hazard-point | Hard-coded; escalate ~2.2×/4.4× vs 1.5 °C — ordinal proxy only |
| Target resilience band | 70 | "Resilient" threshold (bands: ≥70 Resilient, ≥45 Vulnerable, else Critical) |
| Adaptation intensity | 0.12 × value × resGap% | Synthetic capex-to-gap ratio |
| Base WACC | 5.5–8.5 % | `sr()`-seeded |
| Climate spread | `hazard×0.02 + sr×0.5` | Synthetic; ~0–2.5 % add-on to WACC |

All asset attributes (`assetVal`, `age`, five hazard scores) are drawn from the seeded PRNG
`sr(s)=frac(sin(s+1)×10⁴)`. No IPCC, World Bank LIFELINES, or fragility-curve values appear in code.

### 7.3 Calculation walkthrough

1. Seeded PRNG generates asset value, age and five raw hazard exposures per asset.
2. Hazard composite = fixed-weight average of the five exposures.
3. Adaptive capacity = seeded base minus an age penalty, clamped to [5, 95].
4. Resilience = 100 minus hazard scaled by residual vulnerability `(1 − adaptCap/100)`.
5. The three loss rates map hazard linearly to a % of asset value, with a scenario selector
   (`lk`) choosing `loss15`/`loss20`/`loss30` from the "Orderly / Disorderly / Hot House" toggle.
6. Portfolio KPIs sum `assetVal × loss[lk]` (total climate loss), average resilience, sum
   `adaptNeed`, and average `cadr` over the filtered set.

### 7.4 Worked example

Asset with `hazard = 60`, `age = 40`, `sr(i*31)` term giving `adaptCap = 20+0.5×70−40×0.4 = 39`
(clamped stays 39), `assetVal = £200M`, under the **Disorderly 2 °C** toggle:

| Step | Computation | Result |
|---|---|---|
| Residual vulnerability | 1 − 39/100 | 0.61 |
| Resilience | 100 − 60 × 0.61 | **63.4** |
| Band | 63.4 < 70, ≥ 45 | Vulnerable |
| Loss @2 °C (ignoring noise) | 60 × 0.0018 | 0.108 → **10.8 %** |
| Climate loss | £200M × 0.108 | **£21.6M** |
| Resilience gap | max(0, 70 − 63.4) | 6.6 |
| Adaptation need (no noise) | 200 × 6.6/100 × 0.12 | **£1.58M** |
| CADR (mid seeds) | (5.5+1.5) + (60×0.02+0.25) | **8.45 %** |

### 7.5 Companion analytics on the page

- **Type / region resilience** bar series average the score across the filtered set.
- **Hazard-by-type** and **adapt-by-type** aggregates for the exposure and adaptation tabs.
- **Loss timeline** (2025→2050) and a five-axis **radar** of mean hazard exposures.
- **Retrofit ROI** table: `lossAvoided = assetVal×(loss20 − loss15)`, `roi = (lossAvoided − adaptNeed)/adaptNeed×100`.
- The page also mounts `BuiltEnvironmentAdvancedAnalytics` (shared MC/tornado wrapper).

### 7.6 Data provenance & limitations

- **100 % synthetic** — every asset attribute is `sr()`-seeded demo data; stable across renders but
  not real assets.
- No fragility/vulnerability curve: damage is a *linear* function of an aggregate hazard index, not
  a hazard-intensity → damage-probability response as the guide claims.
- "TCFD scenarios" are three flat multipliers, not SSP/RCP hazard trajectories.
- The CADR is computed but never used to discount cash flows — there is no NPV or BCR engine,
  contradicting the guide's `AdaptNPV` formula.
- Adaptation cost is a fixed 12 % of the value-weighted gap, not an intervention-catalogue optimisation.

**Framework alignment:** *TCFD physical risk* — the page mimics the disclosure shape (asset-level
loss under warming levels) but not the quantitative rigour. *EU Taxonomy Annex II (Adaptation)* —
referenced in the guide for DNSH/substantial-contribution screening but **not implemented**.
*World Bank LIFELINES / IPCC AR6 WGII Ch.17* — cited as data anchors but no LIFELINES EAL figures or
IPCC damage functions appear in code.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce defensible, asset-level Expected Annual Loss (EAL) and adaptation cost-benefit metrics for an
infrastructure portfolio (transport, energy, water, telecoms) under IPCC SSP-RCP hazard pathways,
supporting EU Taxonomy Annex II adaptation screening and TCFD physical-risk disclosure.

### 8.2 Conceptual approach
Replace the linear hazard index with a **hazard × exposure × vulnerability (fragility-curve)** damage
model and a discounted **Adaptation NPV/BCR**, mirroring World Bank LIFELINES infrastructure-resilience
economics and CLIMADA-style probabilistic risk assessment (ETH Zürich open-source cat model).
EAL is integrated over an event-frequency distribution; adaptation shifts the fragility curve.

### 8.3 Mathematical specification
For asset *a*, hazard *h*, and return periods *T* (with exceedance frequency `λ_T = 1/T`):

```
Damage_a,h(i)  = V_a × DF_h(i)                     // DF = fragility/vulnerability curve, intensity i
EAL_a          = Σ_h ∫ DF_h(i(λ)) · V_a dλ  ≈ Σ_h Σ_T (λ_T − λ_{T+1}) · DF_h(i_T) · V_a
EAL_a(t,ssp)   = EAL_a scaled by hazard-intensity multiplier m_h(t,ssp) from SSP-RCP downscaling
AdaptNPV_a     = Σ_t [ (EAL_a^base(t) − EAL_a^adapt(t)) − OpexAdapt_a(t) ] / (1+r)^t − CapexAdapt_a
BCR_a          = Σ_t ΔEAL_a(t)/(1+r)^t  /  ( CapexAdapt_a + Σ_t OpexAdapt_a(t)/(1+r)^t )
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Fragility curves per asset class/hazard | `DF_h(i)` | JRC global flood depth-damage; HAZUS; World Bank LIFELINES sector curves |
| Hazard intensity by return period | `i_T` | Aqueduct Floods, GAR, national hazard maps |
| SSP-RCP intensity multipliers | `m_h(t,ssp)` | IPCC AR6 WGI Interactive Atlas; NGFS Phase IV downscaled hazards |
| Discount rate | `r` | Social discount 3–5 % (adaptation) or asset WACC |
| Adaptation capex/opex & efficacy | `Capex, DF_adapt` | UNEP Adaptation Gap Report; engineering intervention catalogue |

### 8.4 Data requirements
Asset register with geolocation, replacement value `V_a`, asset class, age/condition; gridded hazard
maps (flood/heat/wind/SLR/drought) by return period; SSP-RCP downscaled intensity multipliers;
fragility curve library keyed by (class, hazard); intervention catalogue (capex, residual DF, life).
Platform already has: seeded asset register (to be replaced by real register), `reference_data`
scaffolding for ND-GAIN/Aqueduct, and physical-risk contexts feeding adjacent modules.

### 8.5 Validation & benchmarking plan
Backtest EAL against observed loss history (EM-DAT, Swiss Re sigma) for a calibration region;
sensitivity of EAL to fragility-curve choice and return-period discretisation; benchmark portfolio
EAL against World Bank LIFELINES $301 Bn/yr global figure share; reconcile BCR against UNEP's 4:1–9:1
adaptation benefit-cost range; stress the SSP multipliers across RCP2.6/4.5/8.5.

### 8.6 Limitations & model risk
Fragility curves are the dominant uncertainty (sparse for many asset classes); event correlation and
cascading service-disruption multipliers (LIFELINES 3–10×) are omitted from the direct-damage EAL;
downscaling error in `m_h(t,ssp)` compounds over long horizons. Conservative fallback: report EAL as a
range across fragility-curve and SSP scenarios rather than a point estimate.
