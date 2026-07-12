## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a **Platform Materiality Score**
> `PMS = Σ(Topic Scoreᵢ · Weightᵢ)/ΣWeightᵢ` over 78 ESG topics with heat-maps and 30-day momentum
> (ESRS/EFRAG double-materiality framing). **No topic library, no PMS, and no 78-topic weighting exist
> in the code.** The page actually generates **40 synthetic corporates** and runs a
> **Merton-plus-exponential credit-risk engine** (PD consensus, VaR/CVaR, WACC, regime classification)
> plus a composite "DMI" score. It is a *credit-risk dashboard dressed as a materiality dashboard*.
> The sections below document the code.

### 7.1 What the module computes

For each of 40 companies (`COMPANY_NAMES`), a per-entity seed `s(k) = sr(hashStr(name) mod 9973 + i·37 + k)`
drives a full risk profile. The headline **probability of default** is a **consensus of three PD models**:

```js
// 1. Exponential (climate-velocity conditioned)
pdExp     = clamp(pdBase · exp(αT · velocityT), 0.001, 0.85)
// 2. Merton structural (distance-to-default)
d1        = [ln(assetV·(1−haircut)/debt) + (0.04 + 0.5·vol²)·1] / (vol·1)
d2        = d1 − vol
pdMerton  = clamp(Φ(−d2), 0.001, 0.90)          // Φ = Abramowitz-Stegun normal CDF
// 3. Consensus
pdConsensus = pdExp·0.35 + pdMerton·0.35 + (pdBase·(1 + s·0.5))·0.30
```

Other headline outputs:
```
DMI  = esgScore·0.40 + (100 − pdConsensus·300)·0.40 + (50 + s·50)·0.20     // Dynamic Materiality Index
var95 = assetV·(0.03 + s·0.12) ;  var99 = var95·(1.15+s·0.25) ;  cvar = var99·(1.1+s·0.2)
regime = z≤1 Normal | z≤2 Elevated | z≤3 Critical | else Extreme          (z = s·4.2)
stage  = pdConsensus<0.03 S1 | <0.15 S2 | else S3                          (IFRS 9 staging)
```

### 7.2 Parameterisation / scoring rubric

**Sector coefficients** (`SECTOR_COEFF`) — the only structured, non-random parameters:

| Sector | αT (climate PD elasticity) | baseVol | haircut | LGD |
|---|---|---|---|---|
| Energy | 0.18 | 0.35 | 0.25 | 0.55 |
| Materials | 0.14 | 0.28 | 0.18 | 0.48 |
| Utilities | 0.15 | 0.22 | 0.20 | 0.45 |
| Financials | 0.09 | 0.24 | 0.10 | 0.50 |
| Technology | 0.07 | 0.32 | 0.05 | 0.35 |
| Healthcare | 0.06 | 0.22 | 0.06 | 0.38 |
| default | 0.08 | 0.25 | 0.10 | 0.42 |

These are **synthetic sector priors** (no citation) but ordered sensibly: carbon-exposed sectors carry
higher climate PD elasticity (αT) and stranded-asset haircut. Seeded ranges (all via `sr`):
`pdBase 1–13%`, `velocityT −0.3…+0.3`, `assetV $500–5000M`, `debt 20–80% of assets`, `esg/env/soc/gov
20–90`, `wacc 5–17%`, `mlScore 20–95`, `nlpSentiment −1…+1`, `contagionCentrality 0–0.85`.

### 7.3 Calculation walkthrough

1. `generateEntities()` builds 40 profiles from the name-hash seed.
2. Filters (sector/region/regime) narrow the set; portfolio KPIs average over the filtered set:
   `avgDmi`, `critPct` (% Critical+Extreme), `alertTotal`, `avgPd`, `avgVar95`, `avgWacc`,
   `avgSentiment`, `avgMl`.
3. `top5` = the five highest `pdConsensus` obligors.
4. `transMatrix` = a 4×4 regime transition matrix, `sr(fi·4+ti+7)`-seeded (synthetic Markov chain).
5. Trend charts (`alertTrendData`, `regimeTrendData`) and `ngfsImpactData` map the 6 NGFS scenario
   labels to seeded impacts.

### 7.4 Worked example (one obligor, Merton leg)

Energy entity: `assetV = 3000`, `haircut = 0.25`, `debt = 1500`, `vol = 0.35`.
```
ln(3000·0.75 / 1500) = ln(1.5) = 0.4055
drift term = (0.04 + 0.5·0.35²)·1 = 0.04 + 0.061 = 0.101
d1 = (0.4055 + 0.101)/0.35 = 0.5065/0.35 = 1.447
d2 = 1.447 − 0.35 = 1.097
pdMerton = Φ(−1.097) ≈ 0.136 → 13.6%
```
If `pdExp = 0.05` and `pdBase = 0.06`: `pdConsensus = 0.05·0.35 + 0.136·0.35 + 0.06·1.2·0.30
= 0.0175 + 0.0476 + 0.0216 = 0.0867 → 8.67%`. Stage: 8.67% ∈ [3%,15%) → **S2**.
DMI with esg=60: `60·0.40 + (100 − 0.0867·300)·0.40 + (75)·0.20 = 24 + (100−26)·0.40 + 15
= 24 + 29.6 + 15 = 68.6`.

### 7.5 Data provenance & limitations

- **All 40 entities are synthetic**, seeded by `sr(seed)=frac(sin(seed+1)×10⁴)` off a djb2 name hash.
  Sector coefficients are hand-set priors, not calibrated.
- The **Merton leg is genuine** (correct d1/d2 and Φ(−d2)) but its *inputs* (asset value, vol, debt)
  are random, so `pdMerton` is a plausible-looking but non-real number.
- DMI's second term `(100 − pdConsensus·300)` can go negative for pdConsensus>1/3 (then clamped by the
  `dmi: clamp(…,10,95)` wrapper) — a heuristic, not a materiality standard.
- No connection to the guide's 78-topic materiality library; "Platform Materiality Score" is unimplemented.

**Framework alignment:** **Merton (1974) structural default** model (distance-to-default → PD via the
normal CDF, the basis of Moody's KMV/EDF); **IFRS 9** three-stage staging (S1/S2/S3 by PD bands);
**NGFS** scenario labels (Orderly/Disorderly/Hot-House/Too-Little-Too-Late) used only as chart
categories; **VaR/CVaR** as portfolio tail-risk headlines. The climate-conditioned `pdExp = pdBase·exp(αT·velocityT)`
is a reduced-form transition overlay echoing NGFS/EBA "PD-multiplier" stress designs.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A production climate-adjusted credit-risk dashboard: PD/LGD/ECL, VaR/CVaR and IFRS 9 staging for the
covered obligor book, conditioned on NGFS transition/physical pathways. Replaces the `sr()`-seeded
inputs with real balance-sheet and market data.

### 8.2 Conceptual approach
**Merton structural PD with climate-conditioned asset drift** (per Moody's climate-adjusted EDF and
Aladdin transition-risk repricing) blended with a **reduced-form hazard PD** calibrated to NGFS/EBA
PD multipliers. Benchmarks: Moody's EDF/KMV, MSCI Climate VaR, BlackRock Aladdin Climate, EBA/ECB
climate stress-test PD-uplift methodology.

### 8.3 Mathematical specification
```
Asset value A, debt D, vol σ_A, risk-free r, horizon T:
  d2 = [ln(A/D) + (r − climateDrift − 0.5σ_A²)T] / (σ_A√T)
  PD_structural = Φ(−d2)
climateDrift_s = αT_s · transitionVelocity + βP_s · physicalVelocity   (sector s)
PD_reducedform = PD_base · exp(scenario PD-multiplier − 1)             (NGFS-calibrated)
PD = w1·PD_structural + w2·PD_reducedform ,  w1+w2 = 1
ECL = PD · LGD_s · EAD ;  Stage: S1 PD<τ1, S2 SICR, S3 impaired
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Asset vol | σ_A | equity vol de-levered (Merton), market data |
| Climate drift elasticities | αT_s, βP_s | NGFS Phase IV sector damage/repricing paths |
| PD multipliers | — | EBA/ECB 2022 climate stress-test parameters |
| LGD by sector | LGD_s | PCAF / internal recovery data |
| Staging thresholds | τ | IFRS 9 §5.5 SICR policy |

### 8.4 Data requirements
Obligor balance sheet (assets, debt, EAD), equity price/vol, sector mapping, NGFS scenario variable set
(carbon price, GDP, physical hazard). Platform already holds `SECTOR_COEFF`, NGFS scenario labels, and
`climate_scenarios` migration tables that can supply real pathway variables.

### 8.5 Validation & benchmarking plan
Reconcile PD term structure against Moody's EDF where obligors overlap; backtest realised defaults vs
predicted PD (calibration curve, Brier score); sensitivity of ECL to ±1 NGFS scenario notch; VaR
backtest (Kupiec/Christoffersen) on the return series.

### 8.6 Limitations & model risk
Merton assumes lognormal assets and a single debt point — poor for financials and complex capital
structures. Climate drift elasticities are deeply uncertain at the obligor level. Conservative fallback:
where asset vol is unobservable, default to sector-median σ and flag the PD as low-confidence rather
than emitting a precise-looking number.
