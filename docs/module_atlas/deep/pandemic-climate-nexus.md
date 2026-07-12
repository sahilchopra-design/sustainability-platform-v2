## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide names a *compound systemic risk* engine
> `CompoundImpact = max(Pandemic, Climate) + Interaction_term × Correlation`. **That formula does not
> exist in the code.** There is no compound-impact aggregation, no correlation term, and no
> portfolio double-hit P&L. What the page implements is a **40-country zoonotic-hazard table** plus a
> **vector-borne-disease range-expansion projector** driven by RCP × horizon multipliers — every
> field seeded by the platform PRNG. The sections below document the actual computation.

### 7.1 What the module computes

`genCountries(40)` builds one row per country (names from a fixed 40-country tropical/subtropical
list). Each row draws its drivers from `sr()`:

```js
deforestKm2  = floor(s1·50000 + 100)      // 100–50,100 km²
habitatFragPct = s2·80 + 10               // 10–90 %
wildlifeTradePct = s3·60 + 5              // 5–65 %
spilloverRisk = floor(s4·100)             // 0–100 (drives risk tier)
ghsIndex     = 20 + s5·60                  // 20–80 Global Health Security index
riskTier: spilloverRisk >75 Critical, >50 High, >25 Medium, else Low
```

The **vector-borne disease** engine is the one place with structured dynamics. For each of 6 diseases
(Malaria, Dengue, Zika, Chikungunya, Lyme, West Nile) it projects population-at-risk across 3 RCPs ×
3 horizons:

```js
currentPopAtRiskM = sr(...)·popM·0.4
rcpProjections[ri][hi] = sr(...)·popM·0.6·(1 + ri·0.2 + hi·0.15)
```

so the projection **grows monotonically** with both RCP index `ri` (0/1/2 → +0/20/40 %) and horizon
index `hi` (2030/2040/2050 → +0/15/30 %). This RCP×horizon uplift is the only genuine model logic.

### 7.2 Parameterisation / scoring rubric

| Quantity | Formula | Provenance |
|---|---|---|
| Deforestation | `sr·50000+100` km² | Synthetic demo value |
| Spillover risk | `floor(sr·100)` | Synthetic; sets risk tier |
| GHS index | `20 + sr·60` | Synthetic; label references real GHS Index (Johns Hopkins/NTI) |
| RCP uplift | `1 + ri·0.2` | Heuristic: +20 % per RCP step (RCP 2.6→4.5→8.5) |
| Horizon uplift | `1 + hi·0.15` | Heuristic: +15 % per decade to 2050 |
| Healthcare beds | `floor(sr·800+50)` | Synthetic |
| Pandemic bond capacity | `floor(sr·2000)` $M | Synthetic |
| One Health investment | `floor(sr·1500+50)` $M | Synthetic |

Risk-tier thresholds (75/50/25) and the RCP/horizon uplift coefficients are hand-chosen; the
directional monotonicity is defensible (warmer + later ⇒ wider vector range, per IPCC AR6) but the
magnitudes are not calibrated.

### 7.3 Calculation walkthrough

1. 40 country rows generated once. `topKPIs` = critical count, mean spillover, total deforestation,
   mean GHS (all guarded by `Math.max(1, length)`).
2. Tab 2 (`diseaseAgg`): for each disease, sum `currentPopAtRiskM` across countries, and sum
   `rcpProjections[ri][hi]` across countries for every RCP/horizon cell → a 3×3 projection surface.
3. Tab 3 (`ghsData`): countries sorted by GHS descending, plotted against healthcare capacity and
   pharma-supply vulnerability.
4. Tab 4 (`investData`): totals of pharma exposure, health-infra gap, pandemic bonds, One Health
   investment across all countries.

### 7.4 Worked example

Dengue population-at-risk in one country with `popM = 100 M`, under **RCP 8.5 (`ri=2`), 2050
(`hi=2`)**:

```
uplift   = 1 + 2·0.2 + 2·0.15 = 1 + 0.4 + 0.3 = 1.70
projected = sr(seed)·100·0.6·1.70 = sr(seed)·102 M
```

If `sr(seed) ≈ 0.50`, projected pop-at-risk ≈ **51 M**, versus a current
`sr·100·0.4 ≈ 20 M` — a 2.5× expansion driven entirely by the deterministic RCP×horizon multiplier.
Aggregating this cell across all 40 countries gives the headline "population at risk under RCP 8.5 by
2050" figure for dengue.

### 7.5 Companion analytics

- **Scatter** (deforestation-km² vs spillover-risk, bubble = population): a visual habitat-loss ↔
  spillover narrative, but the two axes are independent `sr()` draws — no correlation is fitted.
- **Quarterly trend** `qTrend`: spillover drifts up `+2 %/quarter` plus noise; GHS jitters ±1 — a
  cosmetic time series, not a fitted model.

### 7.6 Data provenance & limitations

- **All country data synthetic** via `sr(seed) = frac(sin(seed+1)×10⁴)`.
- The advertised compound-shock / correlation engine is absent — there is no interaction between the
  pandemic and climate layers beyond shared RNG seeds.
- Vector range-expansion uses fixed linear uplifts, not species-specific climate-suitability
  (e.g. *Aedes aegypti* R0 temperature response) curves.

**Framework alignment:** WHO *Health and Climate Change* special report · IPCC AR6 WGII Ch.7 (vector
range shifts under warming — the qualitative basis for the RCP×horizon uplift) · EcoHealth Alliance
disease-emergence work (deforestation → spillover narrative) · One Health HLEP (integration framing).
The module reflects these qualitatively; it does not implement their quantitative suitability or
spillover-hazard models.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The page shows a "compound systemic risk"
metric and vector-range projections with no calibrated model.

**8.1 Purpose & scope.** Produce (a) a climate-conditioned vector-borne-disease *population-at-risk*
surface by country/disease/RCP/horizon, and (b) a portfolio *compound (pandemic × climate) tail-loss*
for stress testing. Coverage: tropical/subtropical sovereign and corporate exposures.

**8.2 Conceptual approach.** For vectors, a climate-suitability envelope model (mirroring the
Lancet Countdown *vectorial capacity* index and WHO/TDR suitability maps). For compound loss, a
copula-linked bivariate tail model (transition/physical CVaR combination, per ECB CST 2024 and NGFS
double-materiality guidance) — at least two benchmarks: **Lancet Countdown vectorial capacity** and
**ECB economy-wide climate stress test** correlation treatment.

**8.3 Mathematical specification.**

```
Vectorial capacity uplift (disease d, country c, scenario s):
  VC(T) ∝ a(T)² · b(T) · exp(−μ(T)/EIR(T)) / μ(T)      (Macdonald–Ross form)
  PopAtRisk_{d,c,s,t} = Pop_c · Suit_d(T_{c,s,t})       Suit = suitability ∈ [0,1]
    T_{c,s,t} from downscaled CMIP6 for RCP/SSP s, year t

Compound portfolio loss (Gaussian copula, correlation ρ_sector):
  L_compound = VaR_α( L_pandemic , L_physical ; ρ )
  ρ_sector from ECB CST sector table (Energy high, Tech low)
```

| Parameter | Source |
|---|---|
| Temperature response a,b,μ,EIR | Mordecai et al. (2019) trait-based *Aedes/Anopheles* thermal curves |
| Downscaled T by RCP/year | CMIP6 / IPCC AR6 Interactive Atlas (free) |
| Sector compound-ρ | ECB Climate Stress Test 2024 sector interaction table |
| Pandemic loss margin | Swiss Re sigma pandemic frequency–severity |

**8.4 Data requirements.** Gridded CMIP6 temperature by RCP (free, Copernicus), population rasters
(WorldPop, free), disease-specific thermal-response parameters (peer-reviewed), sector exposure +
ρ table (ECB, internal). Platform already exposes NGFS/SSP scenario deltas; the thermal curves and
population rasters are new feeds.

**8.5 Validation & benchmarking.** Reconcile projected suitability against Lancet Countdown's
published vectorial-capacity trends (dengue/malaria); backtest against WHO reported incidence range
shifts 1990–2020; benchmark compound CVaR against the ECB CST double-hit outputs.

**8.6 Limitations & model risk.** Suitability ≠ incidence (ignores control programmes, immunity).
Copula ρ is unstable in the tail and hard to estimate for pandemic–climate joint events (essentially
one data point: COVID). Conservative fallback: report suitability bands, not point incidence, and
stress ρ at {0, 0.5, 0.9}.
