# Renewable Portfolio Intelligence
**Module ID:** `renewable-portfolio-intelligence` · **Route:** `/renewable-portfolio-intelligence` · **Tier:** B (frontend-computed) · **EP code:** RE-PORT1 · **Sprint:** RE

## 1 · Overview
Institutional-grade portfolio analytics for 50-asset renewable energy portfolios spanning Solar PV, Wind Onshore, Wind Offshore, Hydro, and Geothermal. Covers portfolio VaR, efficient frontier, correlation matrix, peer benchmarking, vintage/geography diversification, attribution, and ESG/taxonomy alignment across 18 analytical tabs.

> **Business value:** Designed for RE-focused infrastructure fund managers, institutional LPs conducting portfolio due diligence, and ESG/taxonomy reporting teams. Provides institutional-grade risk analytics (VaR, efficient frontier, correlation) alongside EU Taxonomy, SFDR, and TCFD disclosure outputs for a 50-asset blended renewable portfolio — replicating the analytical depth of institutional portfolio management systems.

**How an analyst works this module:**
- Set portfolio parameters in the left panel: technology mix weights, asset count (up to 50 assets), vintage range, and target geography filters
- Open "Overview" tab for live portfolio KPIs: weighted IRR, VaR 95%, EU Taxonomy %, WACI; "Asset Waterfall" shows individual asset IRR vs DSCR ranked chart
- Navigate to "Efficient Frontier" — the 51-point parametric sweep traces the minimum-variance to maximum-Sharpe frontier; your current allocation is plotted against the frontier
- Check "Correlation Matrix" — the 5×5 technology correlation heatmap (Solar/Wind/Offshore/Hydro/Geo); use the solar-wind correlation slider to see diversification benefit sensitivity
- Open "VaR Dashboard" — portfolio VaR₉₅ = σ_port × 1.645 × Revenue; "Diversification" tab shows concentration by tech, vintage, geography, and Herfindahl-Hirschman index
- Review "DSCR Heatmap" for assets approaching lender covenant minimums (1.15× threshold highlighted amber, <1.0× highlighted red)
- Check "EU Taxonomy" tab for Art.10 climate change mitigation alignment and DNSH assessment across 5 environmental objectives; "SFDR PAI" tab shows 14 mandatory PAI indicators
- Open "WACI Analysis" for weighted average carbon intensity vs RE100 benchmark; "Peer Benchmark" compares portfolio IRR, Sharpe, and WACI against comparable infrastructure fund indices
- Use "Scenario Analysis" to stress the portfolio under resource shocks, regulatory changes, and merchant price collapse; "Attribution" decomposes return sources by asset and vintage
- Review "Currency Exposure" and "Liquidity Profile" for fund-level risk; "Fund Performance" shows IRR, MOIC, DPI, TVPI versus vintage-year benchmarks

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BASE_CORR`, `GEOS`, `KpiCard`, `MONTHS`, `SectionHdr`, `Sel`, `Slider`, `TABS`, `TECHS`, `TECH_COLORS`, `VINTAGES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `tech` | `TECHS[Math.floor(sr(i * 7) * TECHS.length)];` |
| `geo` | `GEOS[Math.floor(sr(i * 7 + 1) * GEOS.length)];` |
| `vintage` | `VINTAGES[Math.floor(sr(i * 7 + 2) * VINTAGES.length)];` |
| `capMW` | `Math.round(50 + sr(i * 7 + 4) * 450);` |
| `capexPerW` | `0.65 + sr(i * 7 + 5) * 0.75;` |
| `capex` | `capMW * 1e6 * capexPerW;` |
| `ppaPrice` | `35 + sr(i * 7 + 8) * 40;` |
| `annualRevM` | `capMW * cf * 8760 / 1e6 * ppaPrice;` |
| `debtPct` | `0.55 + sr(i * 7 + 9) * 0.20;` |
| `debtService` | `capex * debtPct * 0.075;` |
| `ebitda` | `annualRevM * 1e6 * 0.75;` |
| `dscr` | `debtService > 0 ? ebitda / debtService : 1.5;` |
| `irr` | `0.08 + sr(i * 7 + 10) * 0.10;` |
| `scope1` | `tech === 'Geothermal' ? 40 + sr(i * 7 + 11) * 30 : sr(i * 7 + 11) * 5;` |
| `techReturns` | `TECHS.map((t, ti) => {` |
| `weights` | `TECHS.map((_, ti) => {` |
| `tilt` | `[-1, -0.5, 1, 0.3, 0.2][ti] * alpha * 0.30;` |
| `wSum` | `weights.reduce((s, w) => s + w, 0);` |
| `ret` | `wN.reduce((s, w, ti) => s + w * techReturns[ti], 0);` |
| `assets` | `useMemo(() => buildAssets(Math.min(200, Math.max(5, numAssets))), [numAssets]);` |
| `corrMatrix` | `useMemo(() => { const m = BASE_CORR.map(r => [...r]);` |
| `sigmas` | `useMemo(() => [ revSigma * 0.011, revSigma * 0.013, revSigma * 0.014, revSigma * 0.008, revSigma * 0.007 ], [revSigma]);` |
| `portW` | `useMemo(() => techW.map(tw => tw.pct), [techW]);` |
| `portVar` | `useMemo(() => portfolioVariance(portW, sigmas, corrMatrix), [portW, sigmas, corrMatrix]); const portSigma = useMemo(() => Math.sqrt(Math.max(0, portVar)), [portVar]);` |
| `totalRevM` | `useMemo(() => assets.reduce((s, a) => s + a.annualRevM, 0), [assets]);` |
| `totalCapexM` | `useMemo(() => assets.reduce((s, a) => s + a.capex / 1e6, 0), [assets]);` |
| `totalMW` | `useMemo(() => assets.reduce((s, a) => s + a.capMW, 0), [assets]);` |
| `portIRR` | `useMemo(() => { const w = assets.reduce((s, a) => s + a.irr * a.annualRevM, 0);` |
| `portDSCR` | `useMemo(() => { const w = assets.reduce((s, a) => s + a.dscr * a.capex / 1e6, 0);` |
| `portWACI` | `useMemo(() => { const w = assets.reduce((s, a) => s + a.waci * a.annualRevM, 0);` |
| `var95` | `useMemo(() => portSigma * 1.645 * totalRevM, [portSigma, totalRevM]);` |
| `var99` | `useMemo(() => portSigma * 2.326 * totalRevM, [portSigma, totalRevM]);` |
| `cvar95` | `useMemo(() => var95 * 1.15 * tailMult, [var95, tailMult]);` |
| `sharpe` | `useMemo(() => portSigma > 0 ? (portIRR - 0.04) / portSigma : 0, [portIRR, portSigma]);` |
| `taxAligned` | `useMemo(() => { const al = assets.reduce((s, a) => s + (a.taxAlign * 100 >= taxThresh ? a.annualRevM : 0), 0);` |
| `assetsByIRR` | `useMemo(() => [...assets].sort((a, b) => b.irr - a.irr), [assets]);` |
| `scenarioData` | `useMemo(() => ['None', 'Mild', 'Moderate', 'Severe', 'Extreme'].map(s => {` |
| `paiData` | `useMemo(() => [ { pai: 'PAI-1 WACI (tCO₂/$M)', value: +portWACI.toFixed(1), benchmark: 25 }, { pai: 'PAI-2 Carbon Footprint', value: +(portWACI * 0.8).toFixed(1), benchmark: 20 }, { pai: 'PAI-3 GHG Intensity', value: +(portWACI * 1.2).toFixed(1), benchmark: 30 }, { pai: 'PAI-4 Fossil Fuel %', value: +((assets.filter(a => a.tech === 'Geoth` |
| `cfForecast` | `useMemo(() => Array.from({ length: fundLife }, (_, y) => { const mult = 1 - y * 0.005;` |
| `rev` | `totalRevM * mult;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BASE_CORR`, `GEOS`, `MONTHS`, `TABS`, `TECHS`, `TECH_COLORS`, `VINTAGES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio P50 IRR | `Asset-weighted average of individual project IRRs` | Financial model | Blended equity IRR across portfolio; higher for offshore wind (13–18%) vs utility solar (9–13%) |
| Portfolio VaR (95%) | `σ_port × 1.645 × ΣRevenue` | Variance-covariance model | Annual revenue at risk at 95% confidence — combines resource, price, and operational volatility across portfolio |
| WACI (Revenue) | `Σ (revenue_i / total_revenue × scope1_i / enterprise_value_i)` | GHG Protocol / TCFD | Weighted Average Carbon Intensity — SFDR PAI 1 metric; near-zero for operating RE portfolio but relevant for construction phase |
| EU Taxonomy Alignment | `Art.10 criteria + DNSH screen` | EU Taxonomy Regulation 2020/852 | Share of portfolio revenue classified as taxonomy-aligned; renewable generation qualifies under Art.10; requires DNSH pass on 5 environmental objectives |
| Sharpe Ratio | `(μ_port − r_f) / σ_port` | Portfolio model | Risk-adjusted return vs risk-free rate; target Sharpe >1.0 for diversified RE portfolio; offshore-heavy portfolios typically higher |
| Correlation (Solar-Wind) | `Seeded covariance matrix, resource-driven` | NREL Atlas | Low correlation between solar and wind improves diversification; offshore wind-solar correlation even lower (~0.10) due to different weather dependencies |
- **50 seeded RE assets (technology, capacity MW, vintage, geography, DSCR)** → Portfolio aggregation engine → **Blended IRR, VaR, WACI, taxonomy alignment, DSCR distribution**
- **5×5 technology return correlation matrix** → Efficient frontier optimization (parametric sweep) → **Optimal portfolio weights, Sharpe maximization, risk-return frontier**
- **EU Taxonomy technical screening criteria (Art.10) + DNSH thresholds** → Asset-by-asset screening → **Taxonomy-aligned revenue %, DNSH pass/fail by environmental objective**

## 5 · Intermediate Transformation Logic
**Methodology:** Portfolio VaR + Mean-Variance Efficient Frontier
**Headline formula:** `σ_port = √(wᵀΣw); VaR₉₅ = σ_port × 1.645 × TotalRevenue; EF: min wᵀΣw s.t. w·μ = μ_target, Σw = 1`

Portfolio variance computed from 5×5 technology covariance matrix using seeded returns (resource, regulatory, merchant price, counterparty, operational risks). Efficient frontier traces 50 portfolios from minimum-variance to maximum-Sharpe via parametric sweep of target return. DSCR weighted average uses outstanding debt as weights. EU Taxonomy screening uses Art.10 criteria (climate change mitigation) with DNSH assessment for water, biodiversity, waste, and pollution.

**Standards:** ['EU Taxonomy Art.10', 'SFDR PAI', 'IFC Performance Standards', 'IRENA Renewable Readiness']
**Reference documents:** IRENA — Renewable Power Generation Costs 2023; NREL Annual Technology Baseline 2024 — RE Cost and Performance Data; EU Taxonomy Regulation 2020/852 — Technical Screening Criteria for Climate Change Mitigation (Art.10); SFDR Regulatory Technical Standards — PAI Indicators Annex I (2023); Markowitz, H. (1952) — Portfolio Selection, Journal of Finance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`

## 7 · Methodology Deep Dive

> ⚠️ **Partial guide↔code mismatch.** The guide describes the Efficient Frontier as a true
> Markowitz quadratic program: `min wᵀΣw s.t. w·μ = μ_target, Σw = 1`. The code does **not** solve
> a QP. `buildFrontier()` instead sweeps a single scalar `alpha` from 0→1 across 51 steps and
> applies a **hand-picked linear tilt vector** `[-1, -0.5, +1, +0.3, +0.2]` (de-weight Solar/Wind
> Onshore, over-weight Offshore Wind) to a base 20% allocation, clips each weight to [2%, 60%], and
> renormalises. This traces a plausible-looking risk/return curve but is not a solved optimisation —
> there is no guarantee the resulting portfolios are on the true efficient frontier for the given Σ.
> Everything else described below (portfolio variance, VaR, correlation matrix, DSCR, WACI) is
> implemented largely as documented.

### 7.1 What the module computes

50 (configurable 5–200) synthetic renewable assets are built across 5 technologies (Solar PV, Wind
Onshore, Wind Offshore, Hydro, Geothermal), 5 geographies, and 6 vintage years. Each asset carries
capacity, capex, capacity factor, PPA price, debt/DSCR, IRR, Scope 1 emissions, and an EU Taxonomy
alignment flag. Portfolio-level statistics are asset-revenue-weighted aggregates:

```
σ_port = √(wᵀ Σ w)                      // portfolio variance (5×5 tech covariance)
VaR₉₅  = σ_port × 1.645 × TotalRevenue
VaR₉₉  = σ_port × 2.326 × TotalRevenue
CVaR₉₅ = VaR₉₅ × 1.15 × tailMult          // tailMult user slider, default 1.5×
Sharpe = (IRR_port − 0.04) / σ_port
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Capacity factor ranges | Solar 22–30%, Wind-On 30–42%, Wind-Off 40–55%, Hydro 45–60%, Geo 85–95% | Synthetic demo, roughly consistent with IRENA/NREL published ranges cited in the guide |
| Capex/W | $0.65–$1.40/W | Synthetic demo value |
| PPA price | $35–$75/MWh | Synthetic demo value |
| Debt % | 55–75% | Synthetic demo value |
| Debt service rate | 7.5% of (capex × debt%) | Hard-coded assumption, not tied to a benchmark rate |
| EBITDA margin | 75% of revenue | Hard-coded assumption |
| Base tech correlation matrix (`BASE_CORR`) | Solar–WindOn 0.20, Solar–WindOff 0.18, WindOn–WindOff 0.55, Hydro row 0.05–0.25, Geo row 0.10–0.25 | Synthetic demo, directionally consistent with the "low solar/wind correlation" claim in the guide |
| σ per tech (`sigmas`) | `revSigma × [0.011, 0.013, 0.014, 0.008, 0.007]` | `revSigma` is a user slider (4–30%); per-tech multipliers are arbitrary relative scalars, not fitted to historical resource data |
| VaR z-scores | 1.645 (95%), 2.326 (99%) | Standard normal quantiles — correct |
| CVaR multiplier | 1.15 × tailMult | Ad hoc fat-tail adjustment, not a derived Expected Shortfall |
| EU Taxonomy Art.10 threshold | Solar/Wind ≥ 90% aligned revenue (`0.90+sr()×0.10`); Hydro/Geo 75–95% | Synthetic demo, loosely reflects that hydro/geothermal face stricter DNSH water/biodiversity screens |
| DNSH pass rate | `taxAligned × 0.95` (flat 5% haircut) | Synthetic scalar approximation — **not** a per-objective (water, biodiversity, waste, pollution, circular economy) screen despite the "5 environmental objectives" label on the page |

### 7.3 Calculation walkthrough

1. **Asset build** (`buildAssets`): each of `numAssets` gets seeded tech/geo/vintage/capacity via
   `sr(i×7+k)`; `annualRevM = capMW × cf × 8760 / 1e6 × ppaPrice`; `debtService = capex × debtPct ×
   0.075`; `ebitda = annualRevM × 1e6 × 0.75`; `dscr = ebitda / debtService`, clamped to [0.8, 3.5].
   `waci = scope1 × 1000 / annualRevM` (tCO₂e per $M revenue).
2. **Portfolio aggregation**: `totalRevM`, `totalCapexM`, `totalMW` sum across assets. `portIRR`,
   `portDSCR`, `portWACI` are each **revenue-weighted** (`Σ a.irr × a.annualRevM / Σ a.annualRevM`,
   etc.) — DSCR is nominally documented as debt-weighted but the code weights by `capex/1e6`, not
   outstanding debt.
3. **Risk**: `portW` = technology weight vector from asset counts; `sigmas` scaled by the
   `revSigma` slider; `portVar = portfolioVariance(portW, sigmas, corrMatrix)`;
   `portSigma = √portVar`; VaR/CVaR/Sharpe as in §7.1.
4. **Efficient frontier**: `buildFrontier()` produces 51 (σ, return) points via the tilt-sweep
   described in the mismatch note above — plotted against the current portfolio's own (σ, IRR).
5. **Taxonomy**: `taxAligned = Σ(a.annualRevM where a.taxAlign×100 ≥ taxThresh) / totalRevM × 100`.

### 7.4 Worked example

Take `revSigma = 12%` (default), σ vector = `[0.132, 0.156, 0.168, 0.096, 0.084]`, and an equal-ish
portfolio weight `w = [0.35, 0.25, 0.10, 0.15, 0.15]` (illustrative). Diagonal terms:
`w²σ² = 0.35²×0.132² + 0.25²×0.156² + 0.10²×0.168² + 0.15²×0.096² + 0.15²×0.084² ≈
0.00213 + 0.00152 + 0.00028 + 0.00021 + 0.00016 = 0.00430`. Off-diagonal Solar–WindOn term:
`2 × 0.35 × 0.25 × 0.132 × 0.156 × 0.20 ≈ 0.000720`. Summing all 25 terms (omitted for brevity)
gives `portVar ≈ 0.0075` → `σ_port ≈ 8.66%`. With `TotalRevenue = $400M`:
`VaR₉₅ = 0.0866 × 1.645 × 400 ≈ $57.0M`; `CVaR₉₅ = 57.0 × 1.15 × 1.5 ≈ $98.3M`.

### 7.5 Companion analytics

- **Correlation heatmap** — interactive slider lets a user override the Solar–WindOn correlation
  (`c`) and propagates `c × 0.85` to Solar–WindOff, illustrating diversification sensitivity.
- **DSCR heatmap** — flags assets < 1.15× (amber) and < 1.0× (red) against the platform's standard
  lender covenant convention.
- **SFDR PAI panel** — 5 PAI-style indicators derived algebraically from `portWACI` and
  `taxAligned` (e.g. `PAI-2 = portWACI × 0.8`, `PAI-3 = portWACI × 1.2`) rather than independently
  measured — these are **illustrative multipliers on a single WACI number**, not five distinct PAI
  calculations.
- **Cash-flow forecast** — `fundLife`-year revenue/capex projection with a flat `1 − y×0.005`
  annual decay factor (linear degradation proxy, not a technology-specific degradation curve).

### 7.6 Data provenance & limitations

- All 50 assets are synthetic, generated by `sr(seed) = frac(sin(seed+1)×10⁴)`; capacity, price,
  and DSCR ranges are plausible but not sourced from a real project database.
- The "efficient frontier" is a **heuristic tilt sweep**, not a solved mean-variance optimisation —
  see the mismatch note. A production implementation would solve the QP via quadratic programming
  (e.g. `cvxpy`) subject to `Σw=1`, `w≥0`, and a target-return constraint.
- DNSH pass rate is a single scalar haircut, not an assessment against the EU Taxonomy's five
  distinct environmental objectives (water, biodiversity, circular economy, pollution, in addition
  to climate mitigation/adaptation).
- No actual historical return/volatility calibration — σ and correlation values are directionally
  reasonable but hand-set.

**Framework alignment:** Markowitz (1952) mean-variance framework (approximated, not solved) ·
EU Taxonomy Regulation 2020/852 Art.10 (screened as a single alignment %, not per-objective DNSH) ·
SFDR PAI Annex I (5 of 14 indicators shown, derived from one underlying WACI figure) · GHG
Protocol/TCFD for WACI.

## 9 · Future Evolution

### 9.1 Evolution A — A solved frontier with calibrated covariance (analytics ladder: rung 2 → 5)

**What.** The risk engine is mostly as documented — portfolio variance, VaR, correlation matrix, DSCR, WACI all implemented — but §7's mismatch is the headline capability: `buildFrontier()` is a heuristic tilt sweep (a hand-picked `[-1, -0.5, +1, +0.3, +0.2]` vector, clipped and renormalised), not the guide's Markowitz QP, so nothing guarantees the drawn "frontier" is efficient for the stated Σ; and σ/correlation values are hand-set rather than calibrated (§7.6). Evolution A ships the solved optimisation — a natural first mover for the platform's prescriptive rung, since scipy is already in the environment.

**How.** (1) `POST /api/v1/re-portfolio-intel/frontier`: solve `min wᵀΣw` s.t. `w·μ = μ_target, Σw = 1, w ≥ bounds` via `scipy.optimize` (SLSQP or a QP formulation) across a target-return grid; add practical constraints the tilt sweep couldn't express (max single-technology weight, minimum DSCR, taxonomy-alignment floor) — turning the tab into an allocation tool rather than a picture. (2) Calibrate Σ where data allows: technology-level generation covariance estimable from resource-data history (ENTSO-E generation by type is ingested platform-side); hand-set values retained as documented defaults elsewhere. (3) DNSH stops being a scalar haircut: per-objective flags (water, biodiversity, circular economy, pollution) per asset, aggregated honestly per the EU Taxonomy's actual five-objective structure. (4) Bench pin: a 3-asset analytic case whose frontier is solvable by hand.

**Prerequisites.** Backend port of the portfolio-statistics chain; covariance-calibration data audit. **Acceptance:** solver output dominates the tilt sweep's portfolios (equal or lower σ at every μ_target — directly checkable); constraint activation is reported per solution; the 3-asset bench matches the analytic answer.

### 9.2 Evolution B — LP due-diligence copilot over the 18-tab surface (LLM tier 2)

**What.** Institutional LPs interrogate portfolios along exactly this module's axes. The copilot fields the DD dialogue: "what's the marginal VaR contribution of adding 100MW offshore wind?", "walk me through the taxonomy-alignment calculation and its DNSH basis", "re-solve the frontier with a 30% single-technology cap and show what we give up in expected return" — the last a direct constrained-solver tool call whose give-up is the computed μ delta, the kind of precise trade-off answer that distinguishes tool-calling from chat.

**How.** Tier-2 tool schemas over the frontier/VaR/attribution/taxonomy endpoints; marginal-risk answers use recomputation (portfolio with and without the candidate asset) rather than approximation, since the engine is cheap. System prompt grounded in §7.1's aggregation formulas and §7.6's calibration caveats — hand-set correlation defaults are disclosed whenever VaR or frontier results depend on them, an LP-credibility requirement. DD-pack drafting composes computed tables through report studio. No performance claims about the synthetic demo book as if it were a live fund.

**Prerequisites (hard).** Evolution A's solver and the calibration-provenance flags; golden Q&A on the 3-asset bench. **Acceptance:** trade-off answers quote solver outputs for both constraint sets; every correlation-dependent figure carries its calibration-basis disclosure; marginal-VaR numbers reproduce from paired tool calls.