# Energy Transition Commodity Risk
**Module ID:** `et-commodity-risk` · **Route:** `/et-commodity-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses price risk and supply security risk for critical minerals and energy commodities essential to the low-carbon transition, including lithium, cobalt, copper, nickel, rare earths, and green hydrogen. Integrates supply concentration metrics, demand projection models, and commodity price scenario analysis under IEA NZE and Stated Policies pathways. Supports portfolio stress testing, supply chain due diligence, and transition risk financial modelling.

> **Business value:** Equips portfolio managers and risk teams with a systematic framework for quantifying critical mineral supply risk, running transition commodity stress tests, and engaging with investee companies on supply chain resilience strategies essential for the energy transition.

**How an analyst works this module:**
- Select transition scenario (NZE/APS/STEPS) and time horizon (2025/2030/2040) to calibrate demand projections.
- Review commodity-level CTR scores and supply-demand gap charts; identify highest-risk minerals for portfolio holdings.
- Run price stress scenario (e.g., lithium +200%) and propagate through portfolio company input cost models.
- Generate critical mineral supply chain due diligence report and export to investment committee or lender risk pack.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DEMAND_SURGE`, `Kpi`, `MINERALS_LIST`, `PORTFOLIO`, `PRICE_SCENARIOS`, `REVENUE_AT_RISK`, `SCENARIOS`, `SCENARIO_COLORS`, `SECTOR_EXPOSURE`, `SUPPLY_CHAIN_RISK`, `Section`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SUPPLY_CHAIN_RISK` | 6 | `hhi`, `geo_risk`, `key_risk` |
| `REVENUE_AT_RISK` | 6 | `at_risk`, `hedged` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pct` | `(n, d = 1) => isFinite(+n) ? `${parseFloat(n).toFixed(d)}%` : '—%';` |
| `usd` | `(n, d = 1) => isFinite(+n) ? `$${parseFloat(n).toFixed(d)}B` : '$—B';` |
| `li_exp` | `Math.round(sr(i * 5)  * 35);` |
| `co_exp` | `Math.round(sr(i * 7)  * 20);` |
| `ni_exp` | `Math.round(sr(i * 9)  * 25);` |
| `cu_exp` | `Math.round(sr(i * 11) * 30);` |
| `ree_exp` | `Math.round(sr(i * 13) * 15);` |
| `total_exp` | `Math.round((li_exp + co_exp + ni_exp + cu_exp + ree_exp) / 5);` |
| `scenario_risk` | `Math.round(20 + sr(i * 17) * 60);` |
| `DEMAND_SURGE` | `MINERALS_LIST.map((m, mi) => {` |
| `PRICE_SCENARIOS` | `MINERALS_LIST.map((m, mi) => ({` |
| `SECTOR_EXPOSURE` | `['EV OEMs', 'Battery Mfg', 'Renewables', 'Grid Infra', 'Mining', 'Chemical Processing', 'Utilities', 'Oil & Gas Transition'].map((s, i) => ({` |
| `totalWeight` | `PORTFOLIO.reduce((a, p) => a + p.weight, 0);` |
| `avgMineralExp` | `totalWeight > 0 ? (PORTFOLIO.reduce((a, p) => a + p.total_mineral_exposure * p.weight, 0) / totalWeight).toFixed(1) : '0.0';` |
| `avgRevRisk` | `totalWeight > 0 ? (PORTFOLIO.reduce((a, p) => a + p.revenue_at_risk_pct * p.weight, 0) / totalWeight).toFixed(1) : '0.0';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MINERALS_LIST`, `REVENUE_AT_RISK`, `SCENARIOS`, `SECTOR_EXPOSURE`, `SUPPLY_CHAIN_RISK`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Supply Concentration (HHI) | — | USGS / IEA | Herfindahl index of mine production by country; cobalt (DRC >70%) and rare earths (China >60%) score near 10,000. |
| Demand-Supply Gap (% by 2030) | — | IEA Critical Minerals 2024 | Projected percentage demand exceeding supply under NZE scenario by 2030; positive gap flags supply security risk. |
| Price Volatility (σ annualised %) | — | LME/CME Price Data | Annualised realised price volatility; lithium carbonate 2022 volatility exceeded 80%, creating severe input cost risk. |
| Portfolio Critical Mineral Exposure ($M) | — | Supply Chain Mapping | Financial exposure to critical mineral price risk in portfolio companies' input cost structures; primary stress test metric. |
- **USGS and IEA production data by mine and country** → Compute HHI by mineral and production stage (mining vs. refining vs. processing); identify bottleneck stages → **Supply concentration score by mineral and processing stage**
- **IEA NZE and STEPS demand projections by technology** → Sum mineral requirements across solar, wind, EV, grid storage, and hydrogen technologies; compare to production forecasts → **Demand-supply gap by scenario and mineral (2025â€“2040)**
- **LME/CME commodity price history** → Compute realised volatility at 1-year and 3-year windows; calibrate price stress scenarios for input cost modelling → **Price volatility surface and stress scenarios by commodity**

## 5 · Intermediate Transformation Logic
**Methodology:** Commodity Transition Risk Score
**Headline formula:** `CTR = w_c × Concentration + w_d × DemandPressure + w_p × PriceVolatility + w_s × SubstitutionDifficulty`

Composite risk score for each critical mineral aggregating four dimensions. Concentration uses HHI of production and refining by country. Demand pressure projects demand-supply gap under NZE vs. STEPS scenario. Price volatility uses 3-year historical realised volatility of commodity spot price. Substitution difficulty reflects material science assessment of viable alternatives.

**Standards:** ['IEA Critical Minerals Market Review 2024', 'World Bank Minerals for Climate Action 2023', 'BloombergNEF Critical Minerals Outlook 2024']
**Reference documents:** IEA Critical Minerals Market Review 2024; World Bank Minerals for Climate Action 2023; BloombergNEF Critical Minerals Outlook 2024; USGS Mineral Commodity Summaries 2024; European Critical Raw Materials Act 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry promises a **Commodity Transition Risk
> composite** `CTR = w_c·Concentration + w_d·DemandPressure + w_p·PriceVolatility + w_s·Substitution`,
> HHI from USGS/IEA production data, NZE-vs-STEPS demand-supply gaps, and 3-year realised price
> volatility. **The code computes no such composite.** It presents four *separate* synthetic tables —
> per-mineral demand surge, per-mineral price uplift, a static supply-chain HHI table, and a seeded
> 20-name portfolio — plus a portfolio weighted-average exposure. There is no volatility calculation,
> no substitution-difficulty score, and no aggregated CTR number. Documented below as coded.

### 7.1 What the module computes

The only live calculations are portfolio weighted averages:

```js
totalWeight   = Σ p.weight
avgMineralExp = Σ (p.total_mineral_exposure · p.weight) / totalWeight
avgRevRisk    = Σ (p.revenue_at_risk_pct · p.weight) / totalWeight
highRisk      = count(p.total_mineral_exposure > 25)
```

Each portfolio company `p` carries five per-mineral exposures (Li/Co/Ni/Cu/REE), all seeded:

```js
li_exp  = round(sr(i·5)·35)      // 0–35
co_exp  = round(sr(i·7)·20)
ni_exp  = round(sr(i·9)·25)
cu_exp  = round(sr(i·11)·30)
ree_exp = round(sr(i·13)·15)
total_mineral_exposure = round((li+co+ni+cu+ree)/5)     // note: mean, not sum
scenario_risk = round(20 + sr(i·17)·60)
revenue_at_risk_pct = 2 + sr(i·23)·18
```

Everything else (demand surge, price uplift) is a display table, not an input to any score.

### 7.2 Parameterisation & provenance

| Table | Rows | Provenance |
|---|---|---|
| `MINERALS_LIST` | 6 | Li, Co, Ni, Cu, Rare Earths, Graphite — real IEA critical-minerals set |
| `SCENARIOS` | 4 | NZE 2050 / Announced Pledges / Stated Policies / Current Policies — **real IEA WEO scenario names** |
| `PORTFOLIO` | 20 | Real company **names** (Tesla, BYD, CATL, Albemarle, Glencore, MP Materials…), but all **numeric fields seeded** by `sr()` |
| `DEMAND_SURGE` | 6×4 | `2 + (3−si)·0.8 + sr()·8` — base decreases with scenario index so **NZE gets the highest demand** (correct NGFS/IEA direction, per inline comment), but magnitude is synthetic |
| `PRICE_SCENARIOS` | 6×4 | NZE 80–160% / … / Current Policies 5–20% uplift — synthetic but correctly ordered (tighter transition → higher critical-mineral prices) |
| `SUPPLY_CHAIN_RISK` | 5 | HHI 0.28–0.74 by stage (Mining→OEM), **hand-set to realistic values** with real narratives ("China processes 65%+ of battery materials", "DRC cobalt") |
| `SECTOR_EXPOSURE` | 8 | Seeded per-mineral exposure by sector |
| `REVENUE_AT_RISK` | 5 | Hand-set stress ladder (+20%/+50%/+100%/6M disruption/embargo) with at-risk vs hedged $B — illustrative |

The supply-chain HHI table is the most credible content: the refining-stage 0.74 and mining 0.62 are
consistent with real IEA findings on China's ~65% refining dominance and DRC's ~70% cobalt-mining share.

### 7.3 Calculation walkthrough

1. `PORTFOLIO` is generated once (seeded); each company gets five mineral exposures + weight.
2. `avgMineralExp` = weight-weighted mean of `total_mineral_exposure` across the 20 names.
3. `avgRevRisk` = weight-weighted mean of `revenue_at_risk_pct`.
4. `highRisk` counts names above the 25-exposure threshold.
5. Scenario / price / supply-chain / revenue tabs render their static tables directly; the `scenario`
   toggle only re-colours the displayed column — it does **not** re-run any model.

### 7.4 Worked example (one portfolio company, i = 4 → "Albemarle")

| Step | Computation | Result |
|---|---|---|
| li_exp | round(sr(20)·35) = round(0.6435·35) | 23 |
| co_exp | round(sr(28)·20) | ≈ 6 |
| ni_exp | round(sr(36)·25) | ≈ 8 |
| cu_exp | round(sr(44)·30) | ≈ 21 |
| ree_exp | round(sr(52)·15) | ≈ 4 |
| total_mineral_exposure | round((23+6+8+21+4)/5) | **round(12.4) = 12** |

12 < 25, so Albemarle is *not* flagged high-risk — despite being a real lithium producer with very
high genuine critical-mineral exposure. This illustrates the core limitation: the exposures are random,
so the "risk" ranking is decoupled from the companies' actual mineral dependence.

Portfolio KPI: `avgMineralExp = Σ(total_exp·weight)/Σweight` across all 20 names (each weight
`1.5 + sr(i·3)·8`, ~1.5–9.5%) yields a single headline exposure number in the low-teens.

### 7.5 Data provenance & limitations

- **All portfolio and demand/price magnitudes are synthetic** (`sr(s)=frac(sin(s+1)·10⁴)`). Company
  names and scenario names are real; the numbers attached to them are not.
- **`total_mineral_exposure` is a mean, not a sum** of the five exposures — so a company heavily
  exposed to one mineral is diluted by its zeros in the others, understating concentration risk.
- **No composite CTR score** and **no volatility computation** despite the guide — the "Price
  Volatility (σ)" and "Substitution Difficulty" dimensions are absent from code.
- The supply-chain HHI table is realistic but **static/editorial**, not computed from USGS/IEA feeds.
- Scenario toggle is cosmetic; it does not recompute demand-supply gaps.

**Framework alignment:** The scenario set mirrors **IEA World Energy Outlook** pathways (NZE 2050 /
APS / STEPS) — used correctly in *direction* (tighter climate policy → higher critical-mineral demand
and price). Supply concentration is framed via the **Herfindahl-Hirschman Index** (Σ share², 0–1 here;
0–10,000 in the guide) per **IEA Critical Minerals Market Review** and **USGS Mineral Commodity
Summaries**. The intended-but-absent composite is the guide's four-factor CTR.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's headline CTR score, demand-supply
gaps, and realised price volatility are all missing; portfolio exposures are `sr()` synthetic. Below is
the production critical-minerals transition-risk model.

**8.1 Purpose & scope.** Quantify portfolio exposure to critical-mineral supply-security and price risk
under energy-transition scenarios, to stress-test input-cost and revenue impacts on holdings across the
Li/Co/Ni/Cu/REE/graphite value chains.

**8.2 Conceptual approach.** A two-block model: (a) a **supply-risk block** combining HHI concentration
with geopolitical risk, mirroring the **IEA Critical Minerals** supply-security methodology and the EU
**Critical Raw Materials Act** supply-risk scoring; (b) a **demand-price block** projecting demand-supply
gaps from technology-deployment scenarios (**IEA NZE/STEPS**, **BloombergNEF** minerals outlook) and
pricing them through an elasticity model — analogous to World Bank *Minerals for Climate Action* scenario
pricing.

**8.3 Mathematical specification.**

```
Supply risk (per mineral m, stage s):
  HHI_{m,s} = Σ_country share²_{country}          (from USGS production, IEA refining shares)
  SupplyRisk_m = Σ_s ω_s · HHI_{m,s} · GeoRisk_{m,s}     (bottleneck-weighted)

Demand gap (per mineral, scenario k, year t):
  Demand_{m,k,t} = Σ_tech deployment_{tech,k,t} · intensity_{m,tech}   (kg mineral / unit)
  Gap_{m,k,t} = (Demand − Supply_forecast) / Supply_forecast × 100

Price impact via constant-elasticity:
  ΔPrice_{m,k} = (Gap_{m,k} / |ε_m|)                      ε_m = supply elasticity
Portfolio revenue-at-risk:
  RaR_p = Σ_m exposure_{p,m} · ΔPrice_{m,k} · (1 − hedge_p)
CTR_m = w_c·norm(SupplyRisk) + w_d·norm(Gap) + w_p·norm(σ_price) + w_s·Substitution
```

| Parameter | Source |
|---|---|
| Country production shares | USGS Mineral Commodity Summaries |
| Refining shares | IEA Critical Minerals Market Review |
| Mineral intensity per tech | IEA / World Bank *Minerals for Climate Action* |
| Deployment paths | IEA WEO NZE/APS/STEPS |
| Price volatility σ | LME/CME 3-yr realised |
| Supply elasticity ε | Estimated per mineral (literature) |
| Substitution difficulty | Materials-science assessment (0–1) |

**8.4 Data requirements.** USGS production by country; IEA refining shares; per-technology mineral
intensities; IEA deployment scenarios; LME/CME price history; portfolio holdings with per-mineral input
exposure and hedge ratios. Platform already holds IEA-scenario reference tables and `GLOBAL_COMPANY_MASTER`.

**8.5 Validation & benchmarking plan.** Reconcile HHI and demand-gap outputs against IEA Critical
Minerals published figures; backtest ΔPrice against realised 2021–23 lithium/cobalt price moves;
sensitivity of RaR to elasticity and hedge assumptions.

**8.6 Limitations & model risk.** Elasticities are unstable in disrupted markets (2022 lithium spike);
cap ΔPrice and report scenario ranges. Substitution scores are judgemental — document and version them.
Conservative fallback: when scenario data is missing, hold the mineral at its STEPS gap with widened
price bands.

## 9 · Future Evolution

### 9.1 Evolution A — Compute the CTR composite from public production and price data (analytics ladder: rung 1 → 3)

**What.** The §7 flag: the guide's `CTR = w_c·Concentration + w_d·DemandPressure + w_p·PriceVolatility + w_s·SubstitutionDifficulty` composite doesn't exist — the page shows four disconnected tables (seeded demand surges and price uplifts, a static HHI table, a seeded 20-name portfolio with `sr()` mineral exposures) and computes only weighted-average exposure. The good news: the CTR's ingredients are unusually public. Evolution A computes it.

**How.** (1) Concentration: HHI computed from USGS Mineral Commodity Summaries production-by-country tables (free, annual) — separately for mining and refining stages, since the refining bottleneck (China REE >60%) is the §4 story worth telling with real numbers. (2) Demand pressure: IEA Critical Minerals demand projections by scenario (published datasets) vs supply forecasts → the NZE/STEPS gap per mineral per horizon. (3) Price volatility: realized σ from accessible price series (FRED carries several base-metal series; lithium/cobalt need a licensed or curated proxy — disclose which per mineral). (4) Substitution difficulty as a curated expert rating with citations (it is inherently judgmental — label it). (5) `services/commodity_risk_engine.py` assembles the CTR with documented weights; portfolio exposures replace `sr()` draws with company-level mineral-intensity estimates from sector intensity tables × real holdings. (6) Rung 3: bench-pin the HHI arithmetic; validate computed volatilities against published figures (the 2022 lithium >80% claim in §4 is checkable).

**Prerequisites.** USGS/IEA ingesters; price-series licensing decisions per mineral; portfolio holdings from `portfolios_pg`. **Acceptance:** cobalt's mining HHI reproduces from USGS country shares; the CTR decomposes into four sourced components with provenance classes (computed/curated); zero `sr()` in exposures.

### 9.2 Evolution B — Mineral-shock propagation analyst (LLM tier 2)

**What.** The workflow's stress step — "run lithium +200% and propagate through portfolio input costs" — as a tool-calling analyst: it applies the shock via Evolution A's engine, propagates through per-company mineral cost shares, ranks holdings by margin impact, and drafts the risk-pack note with the transmission chain explicit ("Battery-Mfg holding X: lithium is ~14% of COGS via sector intensity table → gross margin −4.1pp under the shock"), every figure from tool output including the intensity table's provenance.

**How.** Tools: `get_ctr(mineral)`, `run_price_shock(mineral, pct, horizon)`, `propagate_to_portfolio(shock, portfolio)`, `get_supply_profile(mineral)`. Grounding corpus = this Atlas record's §5 CTR definition and the IEA/USGS reference list. The propagation model's coarseness is disclosed structurally: sector-level intensity estimates carry wider bands than company-disclosed input costs, and the note says which applies per holding. Scenario framing maps to the engine's typed scenarios; free-form shocks are parameter overrides, not narrative inventions.

**Prerequisites (hard).** Evolution A — propagating shocks through seeded exposures would produce authoritative-sounding nonsense about named holdings' margins. **Acceptance:** a golden lithium-shock note reproduces from scripted calls; each holding's impact carries its intensity-data provenance; minerals without price-series coverage refuse the volatility component with the disclosed gap.