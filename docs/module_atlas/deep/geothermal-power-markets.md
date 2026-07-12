## 7 · Methodology Deep Dive

Geothermal Power Market Analytics (EP-DV4) values the **revenue stack** of firm baseload geothermal:
energy, capacity payments, ancillary services and carbon credits, plus a PPA-vs-merchant comparison
and grid-integration modelling. The financial maths is genuine; only the merchant-price volatility
and hourly-demand series use the `sr()` PRNG for illustrative variability. No guide↔code mismatch.

### 7.1 What the module computes

```js
annMwh       = powerMw * cf/100 * 8760;
baseRev      = annMwh * basePrice / 1e6;                         // energy revenue ($M)
capacityRev  = powerMw * peakPricePremium * 8760 * 0.05 / 1e6;   // capacity payment
ancillaryRev = annMwh * ancillaryShare/100 * basePrice * 1.5 / 1e6;  // AS at 1.5× energy price
carbonAdj    = annMwh * carbonPrice * 38 / 1e9;                  // carbon credit (38 gCO2/kWh)
ppaRev       = annMwh * ppaPrice / 1e6;
weightedRev  = annMwh * geoAvgPrice / 1e6;                       // merchant at 24h avg price
```

The **revenue stack** is `[energy, capacity, ancillary, carbon]` — the sum is total firm-power value.
`ppaVsMerchant` projects 10 years of merchant spot (`basePrice×(0.8+sr()×0.4)`, ±20% band) vs a fixed
PPA to show volatility trade-off. `gridIntegData` builds a 24-hour dispatch: renewable generation
follows a solar sine (`50×max(0,sin(π(h−6)/12))`), demand is `60+sr(h×5)×30`, and geothermal fills
the residual (`max(0, demand − renewGen)`) — illustrating firm baseload's grid-balancing role.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Capacity-payment factor | 0.05 × 8760 × peak premium | Capacity-market convention |
| Ancillary multiplier | 1.5 × energy price | AS premium over energy (CAISO/NZEM) |
| Carbon intensity | 38 gCO₂/kWh | Flash-plant CO₂ intensity |
| `GRID_SERVICES` | 7 rows (`value, geoPct, description`) | Frequency reg, spinning reserve, black start |
| `PPA_STRUCTURES` | 7 rows (`term, price, indexation, creditRating, bankability`) | Synthetic PPA templates |
| `MARGINAL_VALUE` | 8 rows (geo/wind/solar/battery) | Illustrative marginal-value curves |
| `MARKET_PRICES` | 24 hourly spot points | Synthetic hourly price shape |

`geoAvgPrice = mean(MARKET_PRICES.spot)` over 24 hours. Default PPA/merchant sliders drive the
revenue comparison.

### 7.3 Calculation walkthrough

1. Sliders set MW, CF, base price, peak premium, ancillary share, PPA price/term, carbon price.
2. `calcCapacityValue` computes the four revenue components → `revenueStack`.
3. `ppaVsMerchant` runs 10-year merchant vs PPA cashflows (merchant uses `sr()` volatility).
4. `revOptimize` compares "Merchant only" / "PPA" / "PPA + Ancillary" strategies by revenue and risk.
5. `gridIntegData` shows 24h residual-demand dispatch (geothermal as firm fill).

### 7.4 Worked example (revenue stack)

Inputs: 50 MW, CF 92%, basePrice $70/MWh, peakPremium $40, ancillaryShare 10%, carbonPrice $50.

| Component | Computation | Result |
|---|---|---|
| Annual MWh | 50 × 0.92 × 8760 | 402,960 MWh |
| Energy revenue | 402,960 × 70 / 1e6 | **$28.2M** |
| Capacity payment | 50 × 40 × 8760 × 0.05 / 1e6 | **$0.876M** |
| Ancillary | 402,960 × 0.10 × 70 × 1.5 / 1e6 | **$4.23M** |
| Carbon credit | 402,960 × 50 × 38 / 1e9 | **$0.766M** |
| **Total stack** | sum | **$34.1M** |

Energy dominates (~83%), but ancillary services add ~12% — the module's point that firm dispatchable
geothermal captures flexibility value that intermittent RE cannot.

### 7.5 Data provenance & limitations

- **Revenue formulas are sound**; the ancillary/capacity factors are convention-based, not market-
  specific.
- **Merchant volatility and hourly demand/price shapes use the `sr()` PRNG** — illustrative, not real
  market data. `MARKET_PRICES` is a synthetic 24h shape.
- Carbon credit uses a fixed 38 gCO₂/kWh and a `/1e9` scaling that keeps the credit small.
- Grid-integration dispatch uses a stylised solar sine + random demand, not a real system model.

**Framework alignment:** *IRENA Value of Variable Renewable Energy* — the revenue-stack decomposition
(energy + capacity + flexibility) follows IRENA's system-value framework. *GEA US Geothermal
Production Report* — capacity-factor and PPA-price benchmarks. *CAISO/NZEM* — ancillary-service
premium structure. The firm-baseload grid-balancing narrative reflects the recognised system value of
dispatchable geothermal vs intermittent renewables.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Merchant prices and hourly demand are `sr()`
seeded, so a production revenue-at-risk model is specified.

**8.1 Purpose & scope.** Value a geothermal plant's full revenue stack under stochastic power/AS
prices to support PPA-vs-merchant structuring and project-finance sizing.

**8.2 Conceptual approach.** Monte-Carlo revenue simulation over a calibrated hourly price process,
benchmarked against **BlackRock Aladdin** power-price scenario engines and **NREL ReEDS/SAM**
capacity-value methodology. AS revenue modelled as a co-optimised energy-plus-reserve dispatch.

**8.3 Mathematical specification.**

```
P_t = seasonal(t)·daily(t)·exp(X_t),  X_t = φ·X_{t-1} + σ·ε_t   (mean-reverting log-price, OU)
EnergyRev = Σ_t min(cap, availableMW_t)·P_t
CapValue  = ELCC·peakPrice·hoursInScarcity        (effective load-carrying capability)
ASRev     = Σ_t reserveMW_t·λ_reserve,t
Revenue_stack = EnergyRev + CapValue + ASRev + carbonRev
VaR_95    = 5th percentile of MC revenue distribution
```

| Parameter | Calibration source |
|---|---|
| φ, σ (OU) | fit to ISO day-ahead LMP history (CAISO/EPEX, free) |
| ELCC | NREL capacity-value study for baseload |
| λ_reserve | ISO ancillary-service clearing prices |
| carbon intensity | IRENA plant-type CO₂ (38 gCO₂/kWh flash) |

**8.4 Data requirements.** Hourly ISO LMP + AS clearing prices (CAISO OASIS, EPEX — free/vendor);
plant availability curve; carbon-price path (platform ETS engine). Platform holds IRENA reference
data and carbon-price context.

**8.5 Validation & benchmarking.** Backtest simulated revenue distribution against realised plant P&L;
reconcile capacity value against NREL ELCC; compare PPA break-even against observed geothermal PPAs
($40–80/MWh).

**8.6 Limitations & model risk.** OU misses price spikes/scarcity fat tails (add jump component);
AS markets are thin and lumpy; carbon-price path uncertainty dominates long-dated stack value.
