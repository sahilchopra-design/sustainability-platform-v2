## 7 · Methodology Deep Dive

This module (EP-CI4) implements a **real Black-76 options pricer** (with an `erf`-based normal CDF) and a
transition-adjusted forward-curve model — the mathematics matches the guide's
`C = exp(−rT)[F·N(d1) − K·N(d2)]`. Forward curves shift under NGFS scenarios via a demand-decay factor. The
base prices, vols and spread reactions are curated/heuristic, not live ICE/CME feeds.

### 7.1 What the module computes

Transition-adjusted forward curve (monthly, `m`):
```js
decayFactor = (scenario includes 'Net Zero'|'2C')
   ? max(0.3, 1 − m/(peakYear·12))       // demand decays post-peak, floored at 0.3
   : 1 + drift·m                          // business-as-usual drift
price       = basePrice · decayFactor · (1 + sin(m/6)·vol·0.5)   // seasonal wobble
```
Black-76 European option (with error-function normal CDF):
```js
Nd1 = 0.5·(1 + erf(d1/√2))     Nd2 = 0.5·(1 + erf(d2/√2))
// standard d1 = [ln(F/K) + σ²T/2]/(σ√T),  d2 = d1 − σ√T
// C = exp(−rT)·[F·Nd1 − K·Nd2]
```
Vol adjustment adds skew and term structure: `skew = |K/F − 1|·0.15`, `termStruc = √exp·0.05`.
Climate premium decomposition: `premium = basePrice·premiumPct[scenario]·(m/months)`.

### 7.2 Parameterisation / scoring rubric

| Quantity | Source | Provenance |
|---|---|---|
| `basePrice`, `vol`, `peakYear`, `drift` per commodity (`t`) | dataset | curated (oil/gas fundamentals) |
| Decay floor | `0.3` (Net-Zero demand floor) | heuristic (peak-demand collapse) |
| Seasonal amplitude | `sin(m/6)·vol·0.5` | heuristic seasonality |
| `premiumPct[scenario]` | per scenario | heuristic transition premium |
| Skew / term-struc coefficients | `0.15`, `0.05` | heuristic vol-surface shape |
| `SPREADS` (5: long, short, base, unit) | seed schema | crack/dark/spark spread definitions |
| Spread scenario factor | NZ −0.6 / Below2C −0.3 / CurrentPol +0.1 | heuristic scenario shift |

### 7.3 Calculation walkthrough

Scenario + commodity selected → `curveData` builds a 36-month forward curve with the decay factor →
`contangoData` differences consecutive months to show contango/backwardation → options tab feeds F, K, σ_adj,
T into Black-76 with the `erf` normal CDF → `spreadData` shifts crack/dark/spark spreads by the scenario
factor → `premiumData` decomposes the climate premium → hedging tab builds put-spread/collar strategies with
costs as fractions of `comm.base`.

### 7.4 Worked example

Black-76 call: F = $80, K = $80 (ATM), σ = 30%, T = 1 yr, r = 5%:
```
d1 = [ln(80/80) + 0.30²·1/2] / (0.30·√1) = (0 + 0.045)/0.30 = 0.15
d2 = 0.15 − 0.30 = −0.15
N(d1) = 0.5·(1+erf(0.15/√2)) ≈ 0.5596 ;  N(d2) ≈ 0.4404
C = e^(−0.05)·[80·0.5596 − 80·0.4404] = 0.9512·[44.77 − 35.23] = 0.9512·9.54 ≈ $9.07
```
Forward-curve decay under Net Zero at month 60 (peakYear = 5): `decayFactor = max(0.3, 1 − 60/60) = 0.3`, so
a $80 base collapses toward $24 by year 5 — the "contango collapse / peak-oil-demand" signal the guide cites
(Brent 2030 NZ ≈ $45).

### 7.5 Data provenance & limitations

- The **option-pricing and curve mathematics are correct and real** (Black-76 with `erf` CDF); this module is
  not `sr()`-driven — it is deterministic given curated inputs.
- Base prices, vols, peak years, premium percentages and spread reactions are **curated/heuristic**, not live
  ICE/CME/IEA feeds; the decay factor is a stylised demand model, not an IEA-WEO demand curve.
- Skew/term-structure vol adjustments are simple fixed-coefficient shapers, not a fitted implied-vol surface.

**Framework alignment:** Black-76 futures-option model (the market standard for commodity options) · ICE/CME
futures & options conventions · IEA World Energy Outlook / NZE (peak-demand and price-path context, e.g.
Brent 2030 NZ ≈ $45). Crack/dark/spark spread definitions follow refining/power-generation market practice.

## 8 · Model Specification

**Status: specification — not yet implemented in code** (pricing engine is real; the *forward-curve and vol
surface* need production calibration).

**8.1 Purpose & scope.** Price commodity options and forward curves under NGFS transition scenarios with a
calibrated demand model and fitted vol surface, for energy-commodity hedging and transition-risk P&L.

**8.2 Conceptual approach.** Retain Black-76 pricing; replace the stylised decay with an **IEA-WEO/NZE demand
path → price** structural link and an implied-vol surface fitted to listed options (SABR), with a transition
vol add-on — mirroring bank commodity desks and IEA scenario-linked curve construction.

**8.3 Mathematical specification.**
```
F(τ, scenario) = SpotAnchor · exp( ∫ (convenienceYield − storage − demandDrift_scenario(τ)) dτ )
   demandDrift from IEA WEO/NZE demand trajectory per commodity
σ_impl(K,τ) = SABR(α,β,ρ,ν; F,K,τ) + Δσ_transition(scenario)
C = e^{−rτ}[F·N(d1) − K·N(d2)]   (Black-76, as coded)
CrackSpread(scenario) = ProductPrice(scenario) − CrudePrice(scenario) − CarbonCost
```

| Parameter | Source |
|---|---|
| Demand drift | IEA WEO / NZE demand by fuel |
| SABR α,β,ρ,ν | calibration to ICE/CME listed option surfaces |
| Δσ_transition | historical vol response to policy events |
| Carbon cost | EU-ETS forward |

**8.4 Data requirements.** Listed futures/options quotes (ICE/CME); IEA demand paths; carbon forwards. Free:
IEA summary tables; vendor: ICE/CME data, IEA WEO full dataset.

**8.5 Validation & benchmarking.** Reprice listed options vs market (calibration error); reconcile scenario
curves vs IEA published (Brent NZ ≈ $45 2030); Greeks stability.

**8.6 Limitations & model risk.** Scenario demand paths uncertain; SABR extrapolation at wings; carbon-cost
pass-through assumptions. Fallback: flat-vol Black-76 with linear decay (current behaviour) when surface
calibration fails.
