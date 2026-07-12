# Climate Commodity Analytics
**Module ID:** `climate-commodity-analytics` · **Route:** `/climate-commodity-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-DG6 · **Sprint:** DG

## 1 · Overview
Analyses climate change impacts on commodity markets including supply disruption risk, price volatility amplification, and transition-driven demand destruction for fossil fuels. Models agricultural commodity yield shocks, energy commodity demand curves under decarbonisation, and commodity-linked financial risk.

> **Business value:** Essential for commodity trading houses, agricultural finance institutions, energy company CFOs, and macro hedge funds. Provides climate-adjusted commodity price forecasts, supply chain disruption probabilities, and fossil fuel demand destruction modelling under IEA transition scenarios.

**How an analyst works this module:**
- Select commodity class and production region
- Apply climate physical hazard scenarios
- Calculate supply shock probability and price impact
- Model transition-driven demand destruction for fossil fuels
- Analyse critical mineral supply security risks

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CLIMATE_SCENARIOS`, `COMMODITIES`, `HEDGE_INSTRUMENTS`, `KpiCard`, `PRICE_SERIES`, `TABS`, `YEARS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COMMODITIES` | 11 | `name`, `type`, `exchange`, `basePrice`, `unit`, `climateVaR95`, `yieldSens`, `heatThresh`, `waterNeed` |
| `CLIMATE_SCENARIOS` | 5 | `wheat`, `corn`, `soy`, `rice`, `cocoa`, `coffee` |
| `HEDGE_INSTRUMENTS` | 7 | `ticker`, `contract`, `margin`, `liquidity`, `correlation` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `priceData` | `useMemo(() => PRICE_SERIES.slice(0, 24).map(p => ({` |
| `varData` | `useMemo(() => COMMODITIES.map(c => ({ name: c.name.split(' ')[0], var95: c.climateVaR95, yieldSens: Math.abs(c.yieldSens) })), []);` |
| `climateImpactData` | `useMemo(() => COMMODITIES.filter(c => c[c.id] !== undefined \|\| true).map(c => ({` |
| `supplyData` | `useMemo(() => YEARS.map((yr, i) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CLIMATE_SCENARIOS`, `COMMODITIES`, `HEDGE_INSTRUMENTS`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate-Driven Commodity Volatility | — | IMF World Economic Outlook 2023 | Climate change could increase agricultural commodity price volatility 30–50% under RCP4.5 |
| Fossil Fuel Stranded Assets | — | Carbon Tracker Unburnable Carbon 2023 | Fossil fuel assets stranded under Paris-aligned scenarios — concentrated in coal then oil then gas |
| Critical Mineral Demand | — | IEA Critical Minerals Report 2023 | Energy transition drives 4–6× demand increase for lithium, cobalt, copper, and rare earths by 2040 |
- **Commodity production data by region (USDA, IEA, OPEC)** → Supply shock modelling → **Production loss probability by climate scenario and commodity**
- **Historical commodity prices + climate event database** → Climate beta estimation → **Climate risk premium by commodity class**
- **IEA transition demand scenarios (STEPS/APS/NZE)** → Demand destruction modelling → **Revenue at risk for fossil fuel commodity producers**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Commodity Risk Premium
**Headline formula:** `ClimateRiskPremium = HistoricVolatility × ClimateBeta × (1 + PhysicalRisk/100); PhysicalSupplyShock = Σ [ProductionWeight_i × YieldLoss_i × P(climate_event)]`

Climate beta measures historical correlation between climate extremes and commodity price spikes; physical supply shock aggregates weighted yield/production losses across producing regions

**Standards:** ['IPCC AR6 WGII Supply Disruption Chapter', 'IMF Climate and Commodity Markets 2023', 'NGFS Scenarios Commodity Sensitivity', 'World Bank Commodity Markets Outlook']
**Reference documents:** IMF World Economic Outlook Chapter — Climate Change and Commodity Markets (2023); World Bank Commodity Markets Outlook — Climate Edition (2024); IEA Critical Minerals for Clean Energy Transitions (2023); Carbon Tracker — Unburnable Carbon 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide (EP-DG6) specifies a
> `ClimateRiskPremium = HistoricVolatility × ClimateBeta × (1 + PhysicalRisk/100)` and a
> production-weighted `PhysicalSupplyShock = Σ ProductionWeight × YieldLoss × P(event)`, plus
> IEA-scenario demand destruction for fossil fuels. **None of these formulas exist in code.** The
> module covers *agricultural/soft commodities only* (no fossil fuels, no critical minerals), and
> its headline "Climate VaR 95%" figures are hard-coded attributes per commodity — no volatility,
> beta, or probability enters any calculation. The only live arithmetic is table lookups,
> averages, and a fixed 60/40 physical/transition split of the hard-coded VaR. §8 specifies the
> missing risk-premium model.

### 7.1 What the module computes

Static seed tables + light aggregation; no seeded-PRNG entity generation except two chart series:

- `COMMODITIES` (10 rows): basePrice, `climateVaR95` (14.6–32.1%), `yieldSens` (−2.9 to −9.4 %/°C),
  `heatThresh` (28–38 °C), water need — all hard-coded.
- `CLIMATE_SCENARIOS` (4 rows): yield impact % for 6 crops at +1.5/+2/+3/+4 °C
  (e.g. coffee −12/−22/−38/−55%; wheat −3/−7/−14/−22%).
- `PRICE_SERIES` (36 months): `wheat = 550 + sr(i×7)×120 − 60 + i×1.2` etc. — random walk with a
  hard-coded upward drift (cocoa drifts +$32/month), i.e. synthetic price history.
- `supplyData`: drought/flood/pest/geopolitical "risk %" per year 2024–2030, pure `sr()` draws
  with no trend logic.

Live computations, exhaustively: overview KPI `avgVaR = Σ climateVaR95 / 10` (= 21.3%); hedge KPI
= mean of positive correlations; Climate Futures tab looks up `sc[commodity.id]`, defaulting
missing crops to the wheat value (`sc[c.id] ?? sc.wheat` — sugar/cotton/palm/rubber all display
wheat's impact); Portfolio tab: `physical = VaR×0.6`, `transition = VaR×0.4`,
`avgImpact = mean of 6 crops`, `worstCase = min(...)` per scenario.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| climateVaR95 per commodity | 14.6–32.1% | hard-coded; no calculation or citation ("synthetic demo value") |
| yieldSens (%/°C) | −2.9 (rice) … −9.4 (coffee) | hard-coded; magnitudes echo crop-model literature (e.g. Zhao et al. 2017 PNAS: wheat −6.0%/°C, maize −7.4%/°C globally) but do not match it |
| Scenario yield-impact matrix | 4 GWLs × 6 crops | synthetic; shape (soft > grain sensitivity, convex in warming) is plausible vs IPCC AR6 WGII Ch.5 but uncalibrated |
| Physical/transition VaR split | 60% / 40% flat across all commodities | synthetic demo value |
| Hedge correlations | ZW 0.94 … EUA −0.45, HDD/CDD 0.72 | hard-coded; the EUA−agri −0.45 "natural hedge" claim has no empirical source |
| Portfolio KPIs | VaR 21.4%, hedge ratio 42%, optimal 68% | hard-coded literals ("Model-recommended" label without a model) |

### 7.3 Calculation walkthrough

Tab flow: **Overview** plots the VaR/yield-sens attributes and the summary table. **Price Risk**
selects one commodity (KPIs are lookups) and plots the 24-month synthetic series. **Climate
Futures** selects a warming scenario; the bar chart maps each commodity to its scenario impact
with the wheat fallback. **Hedging** lists 6 instruments with contract specs (CME/ICE contract
sizes and tickers are real conventions: ZW 5,000 bu; KC 37,500 lb; EUA 1,000 tCO₂). **Supply
Disruption** plots the seeded driver percentages. **Portfolio Risk** applies the fixed 60/40
split and scenario averages.

### 7.4 Worked example (Portfolio tab, +2.0 °C scenario row)

From `CLIMATE_SCENARIOS[1]` = { wheat −7, corn −10, soy −7, rice −5, cocoa −15, coffee −22 }:

```
avgImpact = (−7 − 10 − 7 − 5 − 15 − 22) / 6 = −66 / 6 = −11.0 %
worstCase = min(...) = −22 %          (coffee)
```

And VaR attribution for coffee: physical = 32.1 × 0.6 = **19.3%**, transition = 32.1 × 0.4 =
**12.8%** — the split is an assumption, not a decomposition.

### 7.5 Data provenance & limitations

- Price history, supply-disruption series and every KPI literal are **synthetic**
  (`sr(seed) = frac(sin(seed+1)×10⁴)` for the series; hand-typed for the rest). No USDA/IEA/World
  Bank data is ingested despite the guide's lineage claims.
- "Climate VaR 95%" is a label, not a 95th-percentile of anything; there is no distribution,
  horizon, or portfolio weighting behind it.
- The scenario fallback quietly assigns wheat's yield impact to sugar, cotton, palm and rubber —
  visually indistinguishable from real per-crop estimates.
- Scope gap vs guide: no energy commodities, no stranded-asset/demand-destruction analytics, no
  critical minerals.
- Editorial content (chokepoints, market signals, El Niño premium "+12–18%") is plausible
  narrative, not computed output.

**Framework alignment:** *IPCC AR6 WGII (Ch. 5 Food, Fibre)* — the warming-level × crop yield
matrix mimics AR6-style impact tables; AR6 derives them from process crop models (AgMIP ensemble)
and statistical yield regressions. *IMF WEO climate–commodity analysis* — source of the guide's
volatility claim; not implemented. *IEA STEPS/APS/NZE* — named in the guide for demand
destruction; absent here. *CME/ICE contract standards* — hedging tab contract sizes and margins
follow real exchange specifications, the module's most faithful external anchor. *EUDR* —
referenced qualitatively in chokepoint/intelligence cards.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Quantify climate-conditioned price risk (VaR/ES) and supply-shock probabilities for a soft/agri
commodity portfolio, and size hedges. Users: commodity trading, agri-finance credit teams, macro
funds. Coverage: 10 exchange-traded agri commodities; 1y risk horizon plus 2030/2050 scenario
projections.

### 8.2 Conceptual approach

Three linked components, mirroring (a) **S&P Global/Trucost physical-risk-to-price pass-through**
analysis, (b) **World Bank Commodity Markets Outlook** structural supply-demand balance
modelling, and (c) standard **RiskMetrics-style** parametric/simulated VaR augmented with a
climate factor: production-weighted yield shocks by origin region are mapped through a
supply-elasticity price model, and a "climate beta" is estimated from historical price responses
to ENSO/heat/drought event indices.

### 8.3 Mathematical specification

```
Supply shock:    ΔQ_c = Σ_r w_{c,r} · YL_c(GWL_r, t) · P_r(event)
                 w_{c,r} = production share (USDA/FAO);  YL = crop-model yield loss
Price impact:    ΔP_c / P_c = ΔQ_c / (ε_d,c − ε_s,c)          (log-linear elasticity)
Climate beta:    β_c = cov(r_c, F_clim) / var(F_clim)
                 F_clim = standardized index of ONI (ENSO), origin-region heat-degree
                 exceedance over heatThresh, and SPEI drought index
Climate VaR:     VaR95_c = 1.645 · σ_c · √(1 + β_c² · λ_shift) + E[ΔP_c | event] · P(event)
                 (base parametric VaR inflated by climate-factor loading plus jump term)
Portfolio:       VaR_p from full covariance Σ with climate-factor common loading
Hedge ratio:     h* = ρ_{c,f} · σ_c / σ_f   (minimum-variance, per futures textbook practice)
```

| Parameter | Calibration source |
|---|---|
| w_{c,r} production shares | USDA PSD / FAOSTAT (free) |
| YL yield-loss functions | AgMIP / ISIMIP crop-model ensembles; Zhao et al. 2017 (%/°C by crop) |
| P_r(event) hazard probabilities | NOAA ONI ENSO climatology; ERA5 heat exceedance; SPEI drought (free) |
| ε_d, ε_s elasticities | World Bank / FAPRI elasticity databases |
| σ_c, ρ | 5y daily settlement prices, CME/ICE (vendor; stooq/Quandl free proxies) |
| λ_shift factor-variance uplift | scenario-dependent from IPCC AR6 extreme-frequency change factors |

### 8.4 Data requirements

Daily settlements per contract (front-month, roll-adjusted), origin-region production shares,
gridded climate indices (ERA5/NOAA — free), crop-model yield-response tables. Platform fit: the
`COMMODITIES` schema (exchange, unit, heatThresh) is the right contract master; FAO production
seeds already exist in the platform's public-data layer; the physical-hazard modules provide the
heat/drought indices needed for `F_clim`.

### 8.5 Validation & benchmarking plan

- Backtest VaR95 exceptions (Kupiec POF test, target 5% ±CI) on 2018–2025 settlements, including
  the 2023–24 cocoa spike as an out-of-sample stress episode.
- Compare event price responses against documented cases (2010 Russia wheat ban, 2023/24 West
  Africa cocoa harvest failure ≈ +150% price).
- Benchmark β_c signs/magnitudes against IMF WEO Ch.3 climate-commodity elasticities.
- Sensitivity: elasticity ±50%, ENSO-index substitution (ONI vs MEI), production-share vintages.

### 8.6 Limitations & model risk

Elasticity-based price mapping assumes competitive markets — breaks under export bans (add a
policy-jump overlay); crop-model yield losses are long-run averages, not season-specific
forecasts; the climate factor is estimated on few large events (wide CIs — report bootstrap
bands). Conservative fallback: floor per-commodity VaR at the unconditioned historical 95%
quantile of annual returns.

## 9 · Future Evolution

### 9.1 Evolution A — Production-weighted supply shock from real trade data (analytics ladder: rung 1 → 2)

**What.** §7 flags that neither guide formula exists: no
`ClimateRiskPremium = HistVol × ClimateBeta × (1+PhysRisk/100)`, no production-weighted
`PhysicalSupplyShock`, no fossil-fuel demand destruction — the module covers ten
agricultural/soft commodities with hard-coded `climateVaR95` attributes and a fixed
60/40 physical/transition split. Its strongest asset is genuinely useful: the
temperature-yield impact table (coffee −55% at +4°C, wheat −22%) reflecting published
crop studies. Evolution A implements the supply-shock formula on real structure: the
platform already ingests UN Comtrade data, which gives production/export weights by
country per commodity; combining those weights with the yield-sensitivity table and
country-level warming exposure yields
`SupplyShock = Σ ProductionWeight_i × YieldLoss_i(ΔT_i)` as a real computation.

**How.** (1) `ref_commodity_production(commodity, country, share, source, year)` from
Comtrade/FAOSTAT aggregates. (2) Yield-loss curves per crop from the existing
`CLIMATE_SCENARIOS` table, applied per producing country's scenario warming rather
than one global ΔT — concentration matters (cocoa's West-Africa concentration is the
canonical case and will emerge naturally from the weights). (3) The hard-coded
climateVaR95 either derived from the shock distribution or relabelled as an external
estimate with source; the risk-premium formula implemented only if a volatility series
is added — otherwise explicitly deferred, honestly.

**Prerequisites.** Yield-sensitivity values cited to their studies (they currently
carry no sources); scope honesty — fossil/minerals stay out until data exists, and the
guide text is trimmed to match. **Acceptance:** cocoa shows a larger +2°C supply shock
than wheat due to production concentration, decomposable by country; every weight
traces to a trade-data row.

### 9.2 Evolution B — Commodity-desk climate copilot (LLM tier 1 → 2)

**What.** A copilot for trading and procurement questions the module can honestly
answer: "why is coffee's +4°C yield impact so severe and what's the source?", "which
of our commodities has the most concentrated climate exposure?" (post-Evolution A, a
computed answer), "what hedging instruments does the page list for wheat?" (the
`HEDGE_INSTRUMENTS` catalogue — descriptive, not priced). Tier-2 what-ifs re-run the
supply-shock function with scenario/weight parameters as client-side tools.

**How.** Tier 1: atlas record plus the yield-impact and production tables as corpus;
every percentage cited with its study or table row. Tier 2: tool schema over the
Evolution A shock function; validator on all impact numbers. Hard refusal on price
forecasts and trading signals — the module models supply-side fundamentals, not
prices, and the copilot must say so.

**Prerequisites.** Evolution A for concentration questions; source citations on the
yield table regardless. **Acceptance:** a supply-shock explanation decomposes into
country terms matching the function output; asked "should we go long coffee?", the
copilot declines and reports the fundamentals instead.