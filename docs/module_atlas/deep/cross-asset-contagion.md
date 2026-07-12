## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a *Climate Contagion Network Model* —
> `Contagion_i(t) = Direct_shock_i + Σ_j w_ij·Contagion_j(t−1)`, an adjacency matrix from bilateral
> exposures, iterative propagation to steady state, and fire-sale amplification. **None of that
> iterative model exists.** `CrossAssetContagionPage.jsx` is a descriptive, filterable dashboard over
> 40 hard-coded asset-class link *pairs* whose contagion scores, correlations, spillovers,
> transmission speeds and amplification factors are all drawn from the PRNG `sr(s)=frac(sin(s+1)×10⁴)`.
> There is no matrix, no `t−1` recursion, no fire-sale price impact. The sections document the
> dashboard as built.

### 7.1 What the module computes

`LINKS` = 40 directed asset-class pairs (Equities↔Fixed Income, Green Bonds↔Credit, Carbon
Markets↔Commodities, Physical Risk↔Insurance, …). Each pair `i` is decorated with seeded attributes:

```js
correlation      = +(sr(i·7)·0.9 − 0.1)         // −0.10 … +0.80
contagionScore   = round(10 + sr(i·11)·85)      // 10 … 95
spilloverPct     = round(sr(i·13)·60)           // 0 … 60 %
transmissionSpeed= round(1 + sr(i·17)·30)       // 1 … 31 days
amplification    = +(sr(i·19)·3 + 0.5)          // 0.5 … 3.5×
esgDriver/regime/directionality/strength = sr()-bucketed categoricals
```

The only *aggregations* are averages over the filtered set (`stats.avgContagion`, `avgCorr`,
`avgSpeed`) and category distributions (`driverDist`, `strengthDist`). `TREND` is 24 months of
`base + sr()·range + sin(i/k)·amp` — a seeded wave, not a fitted series.

### 7.2 Parameterisation / scoring rubric

| Quantity | Formula | Provenance |
|---|---|---|
| Correlation | `sr(i·7)·0.9 − 0.1` | synthetic seeded |
| Contagion score | `10 + sr(i·11)·85` | synthetic seeded |
| Spillover % | `sr(i·13)·60` | synthetic seeded |
| Amplification | `sr(i·19)·3 + 0.5` | synthetic seeded |
| Contagion-score badge cuts | `[30, 55, 75]` (green/gold/amber/red) | display heuristic |
| Channel weights | `CHANNELS` fixed: Credit-Spread 22, Equity-Bond 18, FX-Carry 14 … | hand-set demo weights (sum ≈ 100) |

`CHANNELS` weights and speeds are the only non-seeded numbers, but they are author-assigned, not
estimated from data. The link *pairs* themselves are a plausible, curated taxonomy of ESG/climate
transmission routes.

### 7.3 Calculation walkthrough

Search/sort/paginate `LINKS` → `filtered` → KPI strip = simple means (with `||0` fallbacks). Four
tabs re-slice the same 40 rows: Dashboard (KPIs + ESG-driver pie + correlation-vs-spillover scatter),
Linkages (contagion-vs-speed bubble sized by `amplification·30`), Channels (fixed `CHANNELS` bar),
Stress (regime pie + amplification-by-driver bar). No value produced on one tab feeds another.

### 7.4 Worked example (link `i = 5`, Fixed Income↔Credit)

| Attribute | Computation | Result |
|---|---|---|
| Correlation | `frac(sin(6)×10⁴)×0.9 − 0.10` | ≈ **0.32** |
| Contagion | `round(frac(sin(11×5+1)×10⁴)×85 + 10)` | ≈ **62** |
| Spillover | `round(frac(sin(66)×10⁴)×60)` | ≈ **28%** |
| Badge | 62 ≥ 55 (amber band) | amber |

Every figure is a deterministic function of the index only — re-selecting or reloading yields
identical numbers, but they carry no market meaning.

### 7.5 Data provenance & limitations

- **Fully synthetic** contagion metrics via `sr()`; the 40 link pairs and 9 transmission channels are
  a curated taxonomy, but their weights/scores are demo values.
- No network propagation, no `w_ij` matrix, no fire-sale feedback, no steady-state solve — the guide's
  entire mechanism is absent.
- `TREND` seasonality (`sin(i/k)`) is cosmetic, not an estimated cycle.

**Framework alignment (aspirational, per guide):** BIS WP 844 (climate risks in financial networks),
ECB FSR climate, NGFS systemic-risk workstream, Acemoglu et al. (2012) network origins of aggregate
fluctuations. The page references these but implements none of their mathematics.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Contagion scores and amplification factors
are seeded placeholders with no network model.

**8.1 Purpose & scope.** Quantify system-wide loss amplification from a climate/ESG shock propagating
across asset classes and institutions, for macro-prudential stress testing (FSAP climate module).

**8.2 Conceptual approach.** A **DebtRank / eigenvector-contagion** model on a financial network
(Battiston et al. 2012) augmented with **Greenwood-Landier-Thesmar fire-sale** price-impact, seeded
by **NGFS** scenario direct shocks. Benchmarks: ECB/BIS interbank contagion models and the IMF FSAP
network module; fire-sale layer mirrors the Fed's SCAP-style liquidity-spiral analysis.

**8.3 Mathematical specification.**
```
Direct shock:  s_i = NGFS_repricing_i (asset-class value change under scenario)
Propagation:   h_i(t) = min(1, h_i(t−1) + Σ_j W_ij · h_j(t−1))     # DebtRank, W row-normalised exposures
Fire-sale:     ΔP_a = − Λ_a · (Forced_sales_a / MktDepth_a)         # price impact per asset a
Amplification: AF = Σ_i Loss_i(with contagion) / Σ_i s_i·EAD_i
SystemVaR_99 = 99th pct of Σ_i Loss_i over Monte-Carlo shock draws
```

| Parameter | Symbol | Source |
|---|---|---|
| Exposure matrix | `W_ij` | BIS consolidated banking stats / EBA transparency |
| Price-impact coef | `Λ_a` | Amihud illiquidity / market-depth estimates |
| Direct shocks | `s_i` | NGFS Phase IV repricing by sector/asset |
| Common holdings | overlap | fund holdings (Morningstar) for fire-sale channel |

**8.4 Data requirements.** Bilateral exposure matrix (banks, sovereigns, funds); asset-class market
depth; NGFS scenario repricing; common-holding overlap. Vendors: Bloomberg, EBA data; free: NGFS,
ECB SDW. Platform holds NGFS scenario multipliers (`climate_scenarios` migration 088) reusable as
`s_i` seeds.

**8.5 Validation & benchmarking.** Reconcile amplification factor to BIS/ECB reported 1.3–3.2×
range; backtest against 2008/2011/2020 stress episodes; sensitivity to `W` sparsity and `Λ`
calibration; compare system VaR to ECB climate-stress-test loss estimates.

**8.6 Limitations & model risk.** Exposure matrices are partially confidential (proxying introduces
error); DebtRank ignores dynamic deleveraging; fire-sale impact is highly regime-dependent.
Conservative fallback: bound amplification with best/worst `Λ` and report the interval.
