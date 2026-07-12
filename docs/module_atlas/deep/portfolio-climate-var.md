## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag — fabricated risk metric.** The guide advertises
> `CVaR = Σ(wᵢ · Vᵢ · (δᵢ_physical + δᵢ_transition))` under NGFS/IPR scenarios. **No VaR is ever
> computed.** Every "Climate VaR" number on the page is a direct seeded-random draw:
> `climateVaR95 = 1 + s(31)·18`, `climateVaR99 = 2 + s(37)·28`, `cvar99 = 3 + s(43)·32`, and the six
> scenario losses `scen1..6 = s(6x)·[8..25]`. There is no loss distribution, no percentile estimation,
> no weight×value×delta aggregation, and no scenario engine. The displayed KPIs are then **simple
> means** of these random fields. This is exactly the "random-as-data" pattern the platform audit
> flagged; §8 specifies the real climate-VaR model this module must run.

### 7.1 What the module "computes"

Per-position fields are pure random draws; the only genuine computation is averaging and sorting:

```js
kpis.avgVaR95 = Σ r.climateVaR95 / n          // mean of random draws
kpis.avgVaR99 = Σ r.climateVaR99 / n
scenarioAvg[i]= Σ r.scen(i+1) / n             // mean scenario loss (random)
sectorVaR[s]  = Σ_{r∈s} r.climateVaR99 / |s|  // sector mean
horizonAvg[i] = Σ r.[h1y,h5y,h10y,h30y][i] / n
radarData     = avg(metric) × display-scalar  // e.g. avg(VaR95)×4 to fill 0–100 radar
```

The radar multipliers (`×4`, `×3`, `×2.5`, `×5`, `×6`, `×8`) are cosmetic axis-fills with no risk
meaning.

### 7.2 Parameterisation / seed rubric

| Field | Formula | Range | Provenance |
|---|---|---|---|
| `climateVaR95` | `1 + s(31)·18` | 1–19 % | **fabricated** (`sr` draw, labelled VaR) |
| `climateVaR99` | `2 + s(37)·28` | 2–30 % | **fabricated** |
| `cvar95 / cvar99` | `2 + s(41)·22` / `3 + s(43)·32` | — | **fabricated** |
| `transRisk` | `s(47)·20` | 0–20 % | synthetic demo value |
| `physRisk` | `s(53)·15` | 0–15 % | synthetic demo value |
| `litigationRisk` | `s(59)·10` | 0–10 % | synthetic demo value |
| `scen1..6` | `s(61..83)·[12,18,25,8,22,15]` | — | **fabricated** scenario losses |
| `h1y..h30y` | `s(89..103)·[10,18,25,35]` | — | **fabricated**, but monotone-ish by scalar |
| `notional` | `10 + s(29)·490` | $10–500M | synthetic demo value |
| `tempAlign` | `1.2 + s(127)·2.3` | 1.2–3.5 °C | synthetic demo value |

Note the scenario losses are drawn from **independent** seeds, so a position's Current-Policies loss
(`scen3`) can be *lower* than its Net-Zero loss (`scen1`) — violating the NGFS ordering that
disorderly/hot-house scenarios are worse. Real scenario analysis would preserve that ordering.

### 7.3 Calculation walkthrough

1. `genData(50)` builds 50 positions, each field an independent `sr()` draw.
2. Filters (search / sector / risk) → `filtered`.
3. KPIs and all charts are means/sorts over `filtered`. The horizon "profile" trends upward only
   because the display scalars 10<18<25<35 grow, not because of any term-structure model.
4. `DATA` is module-level, so the same random portfolio renders every session.

### 7.4 Worked example

Two positions pass a filter: A (`climateVaR99 = 12.0`, `scen3 = 20.0`), B (`climateVaR99 = 6.0`,
`scen3 = 10.0`).

| Output | Computation | Result |
|---|---|---|
| kpis.avgVaR99 | (12.0 + 6.0)/2 | 9.0 % |
| scenarioAvg[Current] | (20.0 + 10.0)/2 | 15.0 % |
| radar VaR99 axis | 9.0 × 3 | 27 (cosmetic) |

The "9.0 % Avg VaR99" is the average of two random numbers — it carries no statistical confidence
interpretation despite the "99 %" label.

### 7.5 Data provenance & limitations

- **All risk metrics fabricated** by `sr(seed)=frac(sin(seed+1)×10⁴)`. "VaR", "CVaR", "scenario
  loss" and "horizon loss" are labels on random draws, not model outputs.
- No NGFS/IPR scenario library, no asset-level repricing, no distribution, no percentile — the entire
  methodology the guide describes is absent.
- Position names are curated (CLO Tranche AA, Sukuk Pool…) but decorative.

**Framework alignment (aspirational only):** NGFS Climate Scenarios and IPR Forecast Policy Scenario
are named as the scenario set (the six columns echo NZ2050 / Delayed / Current / Below-2°C / Divergent
/ NDCs) but no NGFS variable path is used · TCFD scenario-analysis supplement — the physical/transition
decomposition is labelled but not computed. The real methodology lives (partially) in the platform's
`climate-credit-integration` module and `climate_stress_test_engine`, not here.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute portfolio Climate Value-at-Risk decomposed into physical and transition drivers, per NGFS/IPR
scenario and horizon, with position-level attribution — for TCFD disclosure, stress testing, and
climate risk budgeting across multi-asset portfolios.

### 8.2 Conceptual approach
A **scenario-conditioned valuation-shock model** mirroring MSCI Climate VaR (asset-level DCF
repricing under transition-policy and physical-damage pathways) and BlackRock Aladdin Climate; the
transition channel repricing carbon-cost pass-through per NGFS, the physical channel applying
damage-function-based cash-flow haircuts per IPCC/Swiss Re, aggregated to a portfolio loss
distribution for percentile extraction.

### 8.3 Mathematical specification
```
δ_trans,i,s = ΔPV_i from CarbonCost_i,s,t = Σ_t Emissions_i,t·(CarbonPrice_s,t)·(1−passthrough_i)/(1+r)^t / V_i
δ_phys,i,s  = Σ_h AAL_i,h(scenario s) / V_i                 # damage-function driven
L_i,s       = w_i · V_i · (δ_trans,i,s + δ_phys,i,s)
L_pf,s      = Σ_i L_i,s ;  with cross-position correlation Σ:  L_pf ~ (μ_s, σ_s)
ClimateVaR_α,s = −quantile_α( L_pf,s )        # α = 95 %, 99 %
CVaR_α,s    = −E[ L_pf,s | L_pf,s ≤ VaR_α ]
CompVaR_i   = w_i·∂VaR/∂w_i                    # Euler allocation
```

| Parameter | Calibration source |
|---|---|
| `CarbonPrice_s,t` | NGFS Phase IV / IPR FPS carbon-price paths by scenario |
| `Emissions_i,t` | PCAF financed emissions (platform engine already produces) |
| `passthrough_i` | sector cost pass-through elasticity; ECB/EBA climate stress params |
| `AAL_i,h` | hazard damage functions; IPCC AR6, Swiss Re sigma, EM-DAT |
| `Σ` correlation | factor model on sector/region; RiskMetrics-style |
| `r` | discount rate / WACC by issuer |

### 8.4 Data requirements
`financed_emissions`, `enterprise_value`, `weight`, `sector`, `region`, `physical_hazard_exposure`,
scenario carbon-price and damage tables. Sources: platform PCAF engine (emissions, EVIC), hazard
engine, NGFS/IPR scenario data (free), Swiss Re/EM-DAT. Weights and notionals already present.

### 8.5 Validation & benchmarking plan
Reconcile ClimateVaR against MSCI Climate VaR and Aladdin outputs for overlapping issuers; backtest
transition losses against realised carbon-cost impacts in ETS-covered sectors; verify scenario
ordering (Current Policies physical loss ≥ NZ2050) as a monotonicity test; component-VaR sums to
total (Euler additivity check).

### 8.6 Limitations & model risk
Damage functions and pass-through elasticities are deeply uncertain; correlation Σ is regime-dependent;
long-horizon (30Y) discounting dominates results. Conservative fallback: report VaR as a scenario
band and disclose the dominant driver (physical vs transition) per position rather than a single
headline number.
