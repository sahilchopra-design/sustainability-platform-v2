# Geothermal Power Market Analytics
**Module ID:** `geothermal-power-markets` · **Route:** `/geothermal-power-markets` · **Tier:** A (backend vertical) · **EP code:** EP-DV4 · **Sprint:** DV

## 1 · Overview
Geothermal power market analytics covering PPA pricing by region, firm baseload ancillary services value, co-location with desalination and hydrogen production, binary ORC retrofit economics and capacity factor benchmarks versus intermittent renewables.

> **Business value:** Geothermal PPAs range $40–$80/MWh regionally, with ancillary service premiums of $5–$15/MWh; co-location with desalination and hydrogen production provides diversified revenue, while binary ORC retrofits extend asset life at $1,200–$2,000/kW.

**How an analyst works this module:**
- Assess PPA price competitiveness versus wind, solar and gas peaker by region
- Quantify ancillary services and capacity market revenue for firm geothermal dispatch
- Model co-location economics with desalination (reject heat) and green hydrogen (firm power)
- Evaluate binary ORC retrofit NPV for existing flash plants with declining well enthalpy

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `GRID_SERVICES`, `KpiCard`, `MARGINAL_VALUE`, `MARKET_PRICES`, `PPA_STRUCTURES`, `Slider`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `GRID_SERVICES` | 7 | `value`, `geoPct`, `description` |
| `PPA_STRUCTURES` | 7 | `term`, `price`, `indexation`, `creditRating`, `bankability` |
| `MARGINAL_VALUE` | 8 | `geo`, `wind`, `solar`, `battery` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `annMwh` | `powerMw * cf / 100 * 8760;` |
| `baseRev` | `annMwh * basePrice / 1e6;` |
| `capacityRev` | `powerMw * peakPricePremium * 8760 * 0.05 / 1e6;` |
| `ancillaryRev` | `annMwh * ancillaryShare / 100 * basePrice * 1.5 / 1e6;` |
| `capVal` | `useMemo(() => calcCapacityValue({ powerMw, cf, peakPricePremium: peakPrem, basePrice, ancillaryShare: ancillary }), [powerMw, cf, peakPrem, basePrice, ancillary]);  const annMwh = powerMw * cf / 100 * 8760;` |
| `geoAvgPrice` | `+(MARKET_PRICES.reduce((s, h) => s + h.spot, 0) / 24).toFixed(0);` |
| `weightedRev` | `annMwh * geoAvgPrice / 1e6;` |
| `ppaRev` | `annMwh * ppaPrice / 1e6;` |
| `carbonAdj` | `annMwh * carbonPrice * 38 / 1e9;` |
| `revenueStack` | `useMemo(() => [ { source: "Energy Revenue", value: +capVal.baseRev.toFixed(1) }, { source: "Capacity Payments", value: +capVal.capacityRev.toFixed(1) }, { source: "Ancillary Services", value: +capVal.ancillaryRev.toFixed(1) }, { source: "Carbon Credits", value: +carbonAdj.toFixed(1) }, ], [capVal, carbonAdj]);` |
| `ppaVsMerchant` | `useMemo(() => Array.from({ length: 10 }, (_, y) => { const spotVol = basePrice * (0.8 + sr(y * 17) * 0.4);` |
| `ancillaryData` | `GRID_SERVICES.map(s => ({` |
| `gridIntegData` | `useMemo(() => Array.from({ length: 24 }, (_, h) => { const renewGen = 50 * Math.max(0, Math.sin(Math.PI * (h - 6) / 12));` |
| `demand` | `60 + sr(h * 5) * 30;` |
| `geoRequired` | `Math.max(0, demand - renewGen);` |
| `revOptimize` | `useMemo(() => [ { strategy: "Merchant Only",       rev: +weightedRev.toFixed(1), risk: "High",   note: "Full exposure to spot price volatility" }, { strategy: `PPA $${ppaPrice}/MWh`, rev: +ppaRev.toFixed(1),    risk: "Low",    note: `${ppaTerm}yr fixed-price offtake agreement` }, { strategy: "PPA + Ancillary",     rev: +(ppaRev + capVal.a` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/geothermal/assess` | `assess_geothermal` | api/v1/routes/geothermal.py |
| GET | `/api/v1/geothermal/plant-types` | `list_plant_types` | api/v1/routes/geothermal.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`, `real-db`

**Database tables:** `DB` *(shared)*, `db` *(shared)*, `dh_irena_lcoe` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `GRID_SERVICES`, `MARGINAL_VALUE`, `PPA_STRUCTURES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Regional PPA Price | `PPA = Negotiated bilateral contract price` | IRENA PPA Database 2023 | Range reflects resource quality, grid location, country risk and project vintage. |
| Ancillary Services Premium | `AS Value = Regulation + Spinning Reserve + Black Start` | CAISO / NZEM market data | Firm dispatchable nature of geothermal commands premium over variable RE in capacity markets. |
| Binary ORC Retrofit Capex | `Retrofit CAPEX = Equipment + Civil + Grid Connection` | GEA 2022 | Cost of converting existing flash plant to binary cycle for lower-enthalpy secondary extraction. |
- **PPA price databases + ancillary service market data** → Revenue stack model → project NPV by configuration → **Geothermal power market analytics dashboard**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/geothermal/plant-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['dry_steam', 'single_flash', 'double_flash', 'binary', 'egs'], 'n_keys': 5}`

**POST /api/v1/geothermal/assess** — status `passed`, provenance ['real-db'], source tables: `dh_irena_lcoe`
Output: `{'type': 'object', 'keys': ['project_name', 'plant_type', 'plant_type_label', 'total_capex_musd', 'lcoe_usd_mwh', 'irena_lcoe_range', 'lcoe_vs_irena', 'annual_generation_gwh', 'capacity_factor_pct', 'lifetime_generation_twh', 'plant_co2_intensity_gco2_kwh', 'annual_emissions_tco2', 'annual_avoided_e`

## 5 · Intermediate Transformation Logic
**Methodology:** Geothermal PPA Value
**Headline formula:** `PPA Value = Energy Price + Capacity Payment + Ancillary Services Revenue`

Total revenue stack capturing energy, capacity and flexibility value of firm baseload geothermal.

**Standards:** ['IRENA — Value of Variable Renewable Energy', 'GEA — Annual US Geothermal Power Production Report']
**Reference documents:** IRENA — Renewable Power Generation Costs 2023; GEA — Annual US Geothermal Power Production and Development Report; NZEM — Geothermal Baseload Ancillary Services Pricing Analysis

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **52** other module(s).

| Connected module | Shared via |
|---|---|
| `geothermal-lcoe-economics` | table:DB, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-market-intelligence` | table:DB, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-project-finance` | table:DB, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-direct-use` | table:DB, table:dh_irena_lcoe, table:sqlalchemy |
| `reference-data-explorer` | table:dh_irena_lcoe, table:sqlalchemy |
| `carbon-market-intelligence` | table:sqlalchemy |
| `carbon-integrity-mrv-analytics` | table:sqlalchemy |
| `supply-chain-esg-hub` | table:sqlalchemy |
| `carbon-institutions-taxonomy` | table:sqlalchemy |
| `supply-chain-resilience` | table:sqlalchemy |

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

## 9 · Future Evolution

### 9.1 Evolution A — Real market-price and ancillary-service data replacing the synthetic 24h shape (analytics ladder: rung 2 → 3)

**What.** §7 credits this tier-A module with a sound revenue-stack decomposition — energy, capacity payments, ancillary services (at 1.5× energy price), and carbon credits, plus a PPA-vs-merchant comparison and grid-integration model — with genuine financial maths. Its flagged gaps are all data-realism issues: merchant volatility and the hourly demand/price series use `sr()` (`MARKET_PRICES` is a synthetic 24h shape), ancillary/capacity factors are convention-based rather than market-specific, the carbon credit uses a fixed 38 gCO₂/kWh, and grid-integration dispatch uses a stylised solar sine plus random demand. Evolution A replaces the synthetic market layer with real data: hourly wholesale prices and ancillary-service clearing prices from the platform's market feeds (ENTSO-E/EIA wired in wave-1), so the merchant revenue and AS premium reflect an actual market rather than a seeded shape.

**How.** (1) `MARKET_PRICES` reads real hourly wholesale prices for the selected region; the merchant `weightedRev` uses the actual 24h profile. (2) Ancillary-service premium from real AS clearing data (CAISO/NZEM structures the module already references) rather than a flat 1.5× multiplier. (3) Grid-integration dispatch uses real net-load shapes. (4) Carbon credit intensity varies by plant type.

**Prerequisites.** Hourly wholesale and AS price feeds by region (ENTSO-E/EIA available); the `sr()` merchant/demand series removed. **Acceptance:** merchant revenue and AS premium respond to real market prices for the chosen region; the grid-integration value reflects an actual net-load profile; no `sr()` drives a revenue figure.

### 9.2 Evolution B — Firm-baseload revenue-stack copilot (LLM tier 2)

**What.** A copilot for asset owners and offtake structurers: "value the full revenue stack for a 50 MW geothermal plant on CAISO — energy, capacity, ancillary, and carbon — and compare PPA vs merchant" tool-calls the revenue-stack endpoint and narrates the firm-baseload system-value case against intermittent renewables.

**How.** Tier-2 tool-calling over the revenue-stack and PPA-vs-merchant endpoints; the grounding corpus is §5/§7 (IRENA value-of-VRE system-value framework, GEA production benchmarks, CAISO/NZEM AS structure). Because the revenue maths is already genuine, a tier-1 explainer ships first; the tier-2 upgrade adds real-market what-ifs once Evolution A lands. Every $/MWh figure validated against tool output; the copilot foregrounds the dispatchability premium that distinguishes geothermal.

**Prerequisites.** Evolution A's real market data for credible merchant/AS answers; corpus embedding. **Acceptance:** every revenue-stack figure traces to a tool call; pre-Evolution-A the copilot flags merchant/AS numbers as illustrative synthetic prices; the co-location (desal/H2) revenue is shown as a documented assumption.