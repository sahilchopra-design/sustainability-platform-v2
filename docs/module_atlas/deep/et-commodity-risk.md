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
