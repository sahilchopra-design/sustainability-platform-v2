# Net Zero Portfolio Builder
**Module ID:** `net-zero-portfolio-builder` · **Route:** `/net-zero-portfolio-builder` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Constructs investment portfolios explicitly targeting net-zero alignment by 2050 through constrained optimisation across emissions pathways, financial objectives, and climate solution tilts.

> **Business value:** Enables institutional investors to systematically construct Paris-aligned portfolios that deliver competitive financial returns while following a credible science-based pathway to net zero by 2050.

**How an analyst works this module:**
- Screen investable universe: exclude highest-emitting assets without credible transition plans
- Apply PAII net-zero portfolio alignment criteria: WACI reduction, temperature score floor, green revenue tilt
- Solve constrained optimisation: minimise tracking error subject to net-zero and financial constraints
- Generate annual glide path: emission reduction schedule to net zero by 2050 with interim waypoints

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `ATTRIBUTION_ITR`, `ATTRIBUTION_SECTOR`, `BENCHMARKS`, `BENCHMARK_MULTI`, `CLIMATE_FACTORS`, `COLORS`, `ENGAGEMENT_DATA`, `FACTOR_RETURNS`, `FRONTIER`, `HOLDINGS`, `KpiCard`, `NAMES`, `OPT_FRONTIER`, `PAGE`, `PATHWAY_DATA`, `SECS`, `SECTORS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CLIMATE_FACTORS` | 6 | `name`, `desc`, `portfolioLoading`, `bmLoading`, `returnContrib`, `volContrib`, `color` |
| `ATTRIBUTION_ITR` | 6 | `allocation`, `selection`, `interaction`, `total` |
| `BENCHMARKS` | 6 | `itr`, `waci`, `greenRev`, `sbtiCov`, `carbonFoot`, `esg`, `pa`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `itr` | `+(sr(i * 11) * 3.2 + 0.7).toFixed(1);` |
| `ret` | `+((sr(i * 17) - 0.3) * 22).toFixed(1);` |
| `vol` | `+(sr(i * 19) * 18 + 4).toFixed(1);` |
| `ATTRIBUTION_SECTOR` | `['Technology','Financials','Healthcare','Consumer','Industrials','Materials','Energy','Utilities'].map((sec, i) => ({` |
| `BENCHMARK_MULTI` | `['ITR°C','WACI/10','Green Rev%','SBTi Cov%','Carbon Fpt/10','ESG Score','Paris Algn%'].map((metric, i) => ({` |
| `itrLimit` | `+(3.8 - i * 0.15).toFixed(1);` |
| `count` | `Math.min(200, Math.round(60 + i * 8.5 + sr(i * 7) * 5));` |
| `paged` | `useMemo(() => constrained.slice((page - 1) * PAGE, page * PAGE), [constrained, page]);` |
| `totalPages` | `Math.ceil(constrained.length / PAGE);` |
| `totalWt` | `Math.max(0.01, d.reduce((s, r) => s + r.weightPct, 0));` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => `"${r[k]}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ATTRIBUTION_ITR`, `ATTRIBUTION_SECTOR`, `BENCHMARKS`, `BENCHMARK_MULTI`, `CLIMATE_FACTORS`, `COLORS`, `NAMES`, `SECS`, `SECTORS`, `SECT_LIST`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Emission Reduction vs Benchmark (5yr) | — | PAII Framework 2021 | Minimum absolute emissions reduction target set for net-zero portfolio relative to benchmark over a 5-year rolling period. |
| Green Revenue Minimum Tilt | — | PAII 2021 | Recommended minimum green revenue exposure to ensure portfolio alignment with climate solution provision. |
- **Universe emissions data, SBT registry, green revenue taxonomies, return/risk factor data** → Screen and constrained optimisation, glide path modelling, PAII criteria scoring → **Net-zero portfolio weights, emission trajectory, annual reporting metrics**

## 5 · Intermediate Transformation Logic
**Methodology:** Net Zero Construction Score
**Headline formula:** `NZCS = α×FinancialScore + β×ClimateAlignmentScore + γ×GreenRevenueScore`

Composite portfolio construction score balancing financial efficiency, Paris pathway alignment, and clean revenue exposure; weights α+β+γ=1.

**Standards:** ['Paris Aligned Investment Initiative', 'PAII Net Zero Investment Framework 2021']
**Reference documents:** PAII Net Zero Investment Framework 2021; IIGCC Paris Aligned Asset Owner Framework 2020; SBTi Financial Institutions Near-Term Criteria 2022; EU Paris-Aligned Benchmark Regulation 2020

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry advertises a **Net Zero Construction
> Score** (`NZCS = α×FinancialScore + β×ClimateAlignmentScore + γ×GreenRevenueScore`) and a
> constrained tracking-error optimiser that "minimises tracking error subject to net-zero and
> financial constraints." **Neither the NZCS composite nor any optimisation solver exists in the
> code.** What the page implements is a **constraint-filter + weighted-aggregation screener**: it
> generates 200 synthetic holdings, filters them against three user sliders (max carbon intensity,
> min green revenue, max ITR), and recomputes portfolio-level averages/weighted-averages over the
> surviving set. There is no objective function, no covariance matrix, and no glide-path solver —
> the "Efficient Frontier", "Optimization Engine", and pathway series are pre-baked `sr()` arrays,
> not solver output. The sections below document the code as it behaves.

### 7.1 What the module computes

The engine is a filter over a fixed universe of 200 holdings and a set of reducers over the
surviving subset `constrained`:

```js
constrained = filtered.filter(h =>
  h.carbonIntensity <= maxCarbon && h.greenRevPct >= minGreen && h.itr <= maxITR)

weightedITR = Σ(itrᵢ × weightPctᵢ) / Σ(weightPctᵢ)     // weight-weighted temperature
avgWACI     = Σ waciᵢ / n                               // simple mean carbon intensity
avgGreen    = Σ greenRevPctᵢ / n
climateVaR  = Σ climateVaRᵢ / n                         // simple mean of per-holding VaR
sharpeᵢ     = expectedReturnᵢ / max(1, volatilityᵢ)     // per holding
```

`weightedITR` is the only genuinely *weighted* aggregate (guarded by `totalWt = max(0.01, Σw)`);
WACI, green revenue and climate-VaR headline KPIs are unweighted arithmetic means over the filtered
count `n = max(1, d.length)`. The "Optimization Engine" tab recomputes the same reducers on a second
filtered set `optPortfolio` driven by three independent sliders (`optITR`, `optCarbon`, `optMinGreen`).

### 7.2 Parameterisation of the synthetic universe

Every holding attribute is a deterministic function of the seeded PRNG `sr(s)=frac(sin(s+1)×10⁴)`:

| Field | Formula | Range | Provenance |
|---|---|---|---|
| `weightPct` | `sr(i·7)·2.5 + 0.1` | 0.1–2.6% | synthetic demo value |
| `itr` (ITR °C) | `sr(i·11)·3.2 + 0.7` | 0.7–3.9 °C | synthetic; span brackets 1.5 °C target |
| `carbonIntensity` | `sr(i·13)·400 + 5` | 5–405 tCO₂e/$M | synthetic |
| `greenRevPct` | `sr(i·23)·60` | 0–60% | synthetic |
| `sbti` | `<0.35 Approved · <0.65 Committed · else None` | categorical | synthetic split |
| `expectedReturn` | `(sr(i·17)−0.3)·22` | −6.6 to +15.4% | synthetic; centred ≈ +4% |
| `volatility` | `sr(i·19)·18 + 4` | 4–22% | synthetic |
| `climateVaR` | `sr(i·79)·8 + 0.5` | 0.5–8.5% | synthetic (not a modelled percentile) |
| `waci` | `sr(i·97)·200 + 20` | 20–220 | synthetic |
| `pcafScore` | `sr(i·91)·4 + 1` | 1–5 | synthetic (PCAF DQ scale is genuinely 1–5) |

The 200 company **names** and their **sector labels** (`SECS`) are real (Apple, ExxonMobil,
Ørsted…), but every *number* attached to them is PRNG-generated, not sourced. Benchmark rows
(`BENCHMARKS`, `BENCHMARK_MULTI`) are hard-coded illustrative constants (e.g. MSCI ACWI WACI = 185,
Paris-Aligned BM ITR = 1.7 °C) — plausible but not live index data.

### 7.3 Calculation walkthrough

1. **Universe → filtered:** text search + sector filter, then in-place-safe sort by the active column.
2. **filtered → constrained:** the three-slider AND-gate (carbon ≤, green ≥, ITR ≤).
3. **constrained → stats:** the reducers of §7.1 populate the six headline KPI cards.
4. **Sector allocation:** `Σ weightPct` grouped by sector → pie.
5. **ITR distribution:** holdings bucketed into ≤1.5 / 1.5–2 / 2–2.5 / 2.5–3 / >3 °C.
6. **Optimization Engine:** independent filter → `optPortfolio` reducers (count, weightedITR,
   Sharpe mean, SBTi coverage %). The `OPT_FRONTIER` "efficient frontier" is a *scripted* array —
   `count = min(200, 60 + i·8.5 + sr(i·7)·5)`, `return = 6.8 − i·0.18 + …` — i.e. a monotone curve
   drawn to look like a frontier, not the output of mean-variance optimisation over the universe.

### 7.4 Worked example

Suppose the constrained set has 3 holdings after filtering:

| Holding | weightPct | itr | waci | greenRevPct |
|---|---|---|---|---|
| A | 2.0 | 1.4 | 60 | 40 |
| B | 1.0 | 2.2 | 120 | 20 |
| C | 0.5 | 3.0 | 200 | 10 |

- `totalWt = 2.0 + 1.0 + 0.5 = 3.5`
- `weightedITR = (1.4·2.0 + 2.2·1.0 + 3.0·0.5) / 3.5 = (2.8 + 2.2 + 1.5)/3.5 = 6.5/3.5 = 1.86 °C`
- `avgWACI = (60 + 120 + 200)/3 = 126.7 → 127` (simple mean, weights ignored)
- `avgGreen = (40 + 20 + 10)/3 = 23%`

The KPI card colours `weightedITR` green if `<1.5`, sage if `<2`, else amber — so 1.86 renders sage.
Note WACI is *not* exposure-weighted, so a tiny high-intensity holding (C) drags the headline as
hard as the large low-intensity holding (A) — a divergence from TCFD's exposure-weighted WACI.

### 7.5 Companion analytics on the page

Climate factor model (`CLIMATE_FACTORS`) shows five hard-coded factor loadings (Transition Risk
0.42 portfolio vs 0.61 benchmark, Green Revenue 0.34 vs 0.18…) with return/vol contributions — a
descriptive factor-attribution *display*, not a fitted regression. `FACTOR_RETURNS`,
`ATTRIBUTION_SECTOR`, `ATTRIBUTION_ITR`, `PATHWAY_DATA` and `ENGAGEMENT_DATA` are all pre-computed
`sr()`/constant arrays feeding the charts on their respective tabs.

### 7.6 Data provenance & limitations

- **All numeric holding data is synthetic**, generated by `sr(seed)=frac(sin(seed+1)×10⁴)`; only
  the company names, sector labels and benchmark reference values are hand-set.
- No optimiser: constraint satisfaction is a boolean AND-filter, not constrained minimisation of
  tracking error. The "efficient frontier" and "optimization frontier" are scripted monotone curves.
- WACI/climate-VaR headline KPIs are unweighted means, diverging from exposure-weighted TCFD/PCAF
  practice.
- ITR values are assigned per-name at random rather than derived from any temperature-alignment
  methodology (SBTi TPS, CDP-WWF, or implied-temperature-rise models).

**Framework alignment:** *PAII Net Zero Investment Framework 2021* — the page references its WACI
reduction, temperature-score and >25% green-revenue tilt criteria as slider defaults, but does not
implement the framework's alignment-classification or 50%-vs-benchmark reduction test. *TCFD* WACI —
approximated but computed as a simple mean, not exposure-weighted. *SBTi FI criteria* — represented
only as a categorical `sbti` flag per holding. *EU Paris-Aligned Benchmark Regulation* — a static
"Paris-Aligned BM" comparison row, not the regulation's 7% p.a. self-decarbonisation trajectory.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The page displays a net-zero portfolio,
ITR, climate-VaR and a "frontier" with no real optimiser or temperature model behind them. A
production build needs (a) an implied-temperature-rise model, (b) a constrained portfolio optimiser.

### 8.1 Purpose & scope
Construct and rebalance an equity portfolio that minimises active risk against a chosen benchmark
subject to a declining carbon-budget / temperature constraint consistent with net zero by 2050.
Coverage: listed equity (extendable to corporate credit). Decisions supported: initial construction,
annual rebalancing to a decarbonisation glide path, and PAII/EU-PAB alignment reporting.

### 8.2 Conceptual approach
Two coupled models. **(i) Implied Temperature Rise (ITR)** per issuer, mirroring the *SBTi
Temperature Scoring* method and *MSCI Implied Temperature Rise*: map an issuer's projected emissions
overshoot vs a sectoral 1.5 °C budget to a °C score via the transient climate response to cumulative
emissions (TCRE). **(ii) Constrained mean-variance / tracking-error optimiser**, mirroring
*BlackRock Aladdin* and *Barra* optimisation: minimise ex-ante tracking error subject to a portfolio
carbon-budget path (à la EU Paris-Aligned Benchmark's ≥7% p.a. reduction) and factor/sector limits.

### 8.3 Mathematical specification
Per issuer *i*, overshoot vs its sector 1.5 °C pathway:
```
Overshootᵢ(t) = Σ_{τ=t..2050} [ Eᵢ(τ) − Budgetᵢ(τ) ]           (cumulative tCO₂e)
ITRᵢ = 1.5 + TCRE × ( Overshootᵢ / GlobalBudget_remaining ) × scale
```
where `Eᵢ(τ)` = issuer emission projection (base × (1 − targetReductionᵢ)^{τ−t} if SBTi-approved,
else business-as-usual growth `g`), `Budgetᵢ(τ)` = sector-share of the CRREM/SBTi 1.5 °C pathway,
`TCRE ≈ 0.45 °C per 1000 GtCO₂` (IPCC AR6). Portfolio ITR = Σ wᵢ·ITRᵢ.

Optimiser:
```
min_w  wᵀ Σ w − 2 wᵀ Σ w_bm          (ex-ante tracking error² vs benchmark bm)
s.t.   Σ wᵢ = 1,  0 ≤ wᵢ ≤ u
       Σ wᵢ·CIᵢ ≤ CI_bm · (1 − 0.50)          (PAII 50% intensity cut)
       Σ wᵢ·CIᵢ ≤ CI₀ · (1 − 0.07)^{t}         (EU-PAB 7% p.a. self-decarbonisation)
       Σ wᵢ·greenRevᵢ ≥ 0.25                    (PAII green-revenue tilt)
       Σ wᵢ·ITRᵢ ≤ 1.5                          (temperature floor)
```

| Parameter | Value | Calibration source |
|---|---|---|
| TCRE | 0.45 °C/1000 GtCO₂ | IPCC AR6 WG1 |
| Sector 1.5 °C budget | CRREM / SBTi SDA pathways | CRREM v2, SBTi SDA |
| PAB self-decarb. rate | 7% p.a. | EU 2020/1818 Art. 7 |
| Baseline reduction | 50% vs parent | PAII NZIF 2021 |
| Σ (covariance) | 60-month factor model | Barra GEM / MSCI |
| Green-revenue floor | 25% | PAII NZIF 2021 |

### 8.4 Data requirements
Issuer Scope 1–3 emissions + revenue (Trucost, MSCI, CDP); SBTi target status & near-term reduction
(SBTi registry, free); green-revenue share (EU Taxonomy / FTSE Green Revenues); factor covariance
(Barra/MSCI or estimated from returns). Platform already holds sector labels, PCAF DQ scale, and an
NGFS scenario layer (migration 088) that can supply the macro emission drift.

### 8.5 Validation & benchmarking plan
Backtest constructed portfolios vs MSCI ACWI and the MSCI/S&P Paris-Aligned indices on realised
tracking error and carbon-intensity trajectory. Reconcile issuer ITR against MSCI ITR and SBTi
temperature scores (target |Δ| < 0.3 °C on overlapping names). Sensitivity: stability of weights to
the 7% path and to covariance estimation window.

### 8.6 Limitations & model risk
ITR is highly sensitive to Scope 3 data quality and to the BAU growth assumption for non-SBTi names;
the optimiser can concentrate in low-intensity mega-caps (violating diversification) unless position
and sector caps bind. Conservative fallback: if issuer emissions data quality < PCAF score 3, apply
a penalty ITR uplift rather than trusting the reported value.

## 9 · Future Evolution

### 9.1 Evolution A — Ship the real constrained optimiser and glide-path solver (analytics ladder: rung 1 → 5)

**What.** §7's mismatch flag: the guide advertises a Net Zero Construction Score (`NZCS = α×Financial + β×ClimateAlignment + γ×GreenRevenue`) and a tracking-error optimiser, but neither exists — the page is a constraint-filter + weighted-aggregation screener over 200 synthetic holdings, and the "Efficient Frontier", "Optimization Engine", and glide-path series are pre-baked `sr()` arrays. Only `weightedITR` is a genuinely weighted aggregate; WACI/green/VaR headlines are unweighted means. Evolution A builds the optimiser the module claims to be.

**How.** (1) Implement the constrained optimisation §1/§5 describe: `scipy.optimize.minimize` minimising tracking error to a benchmark subject to WACI-reduction, temperature-score-floor, and green-revenue-tilt constraints (the PAII Net Zero Investment Framework named in §5 supplies the constraint definitions) — this is the roadmap's rung-5 prescriptive tier, and Paris-aligned portfolio construction is a canonical use. (2) Compute the NZCS composite as a real objective term. (3) Replace the pre-baked glide path with a solved annual emission-reduction schedule to net-zero-by-2050 with interim waypoints, derived from the optimised holdings' trajectories rather than a seeded array. Real holdings via `portfolios_pg` + the shared emissions resolver used by the alignment siblings.

**Prerequisites.** Covariance matrix from ingested return history (currently absent — the page has no Σ); the synthetic 200-holding universe replaced with a real investable set; a `bench_quant` case with a known optimum. **Acceptance:** the optimiser returns a solution provably minimising tracking error under the constraints (verifiable on a small hand-solved case); tightening the temperature floor changes the optimal weights and the glide path; no `sr()` remains in frontier/pathway series.

### 9.2 Evolution B — Portfolio-construction analyst with tool-called optimisation (LLM tier 2)

**What.** A tool-calling analyst: "build a net-zero portfolio tracking MSCI World within 1.5% TE, WACI 50% below benchmark, ITR ≤ 1.75°C, green-revenue tilt +20%" → calls the Evolution-A optimiser and presents the resulting weights, NZCS, and 2050 glide path, explaining which constraints bound and the financial cost of each climate tilt.

**How.** Tool schema over `POST /nz-builder/optimize` with the constraint set as typed parameters; system prompt from this Atlas page's §5 and the PAII/EU Paris-Aligned Benchmark references named in §5. The analyst's explanations derive from optimiser diagnostics (binding constraints, tracking-error contribution, per-constraint shadow cost), not intuition; the "show work" expander lists the optimisation call and its inputs (roadmap Tier-2 provenance UX). Saving a constructed portfolio to `portfolios_pg` gates behind explicit confirmation + RBAC. Fabrication validator matches every weight/TE/WACI figure to the tool response.

**Prerequisites (hard).** Evolution A — there is no optimiser or NZCS to call today, and narrating the current filter-screener's pre-baked frontier as optimisation output would be exactly the misrepresentation §7 flags. **Acceptance:** every reported metric traces to an optimiser call; asking for a glide path before Evolution A yields a refusal explaining the solver does not yet exist.