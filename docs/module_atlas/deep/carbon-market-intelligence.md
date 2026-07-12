## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (EP-CN6) claims three price-forecast
> models: "mean-reversion OU, trend-following ARIMA, scenario-conditional NGFS". **None of these
> is implemented.** All three "models" are straight lines in the year index with different slopes
> (plus one seeded-noise term); the UI even prints "O-U process, θ=0.42, μ=90" in a methods
> column although no Ornstein–Uhlenbeck dynamics, no ARIMA estimation and no NGFS data exist in
> the code. The rest of the guide (compliance vs voluntary split, 8+ markets, policy tracker) is
> broadly accurate. Sections below document the actual computations; §8 specifies the promised
> forecasting models.

### 7.1 What the module computes

**Forecast engine** (2024–2030, reactive to three user controls — scenario, carbon-tax slider,
NDC-ambition slider):

```
scenarioMult = {1.5C:1.35, 2C:1.15, NDC:1.00, BAU:0.78}
taxMult      = 1 + (carbonTax − 80)/800          // ±12.5% per ±$100
ndcMult      = 1 + (ndcAmbition − 50)/200        // ±25% at slider extremes
sm           = scenarioMult × taxMult × ndcMult
meanReversion_i      = 65 + i·4.2·sm + (sr(i·7) − 0.5)·4
trendFollowing_i     = 65 + i·7.8·sm
scenarioConditional_i= 65 + i·11·sm − max(0, year−2027)·2.5
bull = sc·1.2 ;  bear = mr·0.78
```

**Market aggregates:** `totalComplianceCap = Σ volume` over 12 compliance markets;
`retirementRate = Σretirements/Σissuance` over `VCM_HISTORY` (2015–2024); average credit price;
Article 6 volume `Σ itmo_volume` over `BILATERAL_DEALS`. **Supply/demand forecast** is a
hard-coded table (2024 gap −16 Mt → 2030 gap +390 Mt). ITMO-vs-VCM price scatter pairs real deal
prices with a seeded VCM price `5 + sr(i·13)·12`. A compliance-volume trend line is synthesised:
`600 + (year−2015)·22 + sr(year)·30`.

### 7.2 Parameterisation

| Block | Values | Provenance |
|---|---|---|
| `COMPLIANCE_MARKETS` (13 rows) | EU ETS €65 · UK £42 · California $32 · RGGI $15 · China ¥9 · Korea $8 · NZ $35 · CH CHF60 · Canada C$65 · Mexico/Chile/Colombia pilots | Static seeds, plausible 2024 levels (ICAP-dashboard style); includes cap, surplus, 2030 cap |
| `VCM_HISTORY` (2015–2024) | issuance 84→168 Mt, retirements 38→152 Mt, avgPrice $3.2→$7.4 | Static; magnitudes track Ecosystem Marketplace annual reports |
| `POLICY_EVENTS` (16) | CBAM phase-in +18%, China ETS expansion +35%, Verra VM revision −8% … | Real events with synthetic price-impact %s |
| Forecast slopes 4.2/7.8/11 $/yr; multipliers | — | Synthetic demo values |
| Buyer segmentation | Corporates 52 / Finance 18 / Airlines 14 / Gov 8 / Other 8 % | Static; consistent with EM buyer surveys |
| `demandForecast` 2030 demand 680 Mt | — | Hard-coded; in the range of TSVCM/BCG 2030 VCM demand scenarios |

### 7.3 Calculation walkthrough

Scenario + sliders → `sm` → three lines and a bull/bear envelope; the year>2027 kink in the
scenario-conditional path (−2.5/yr) encodes a "post-2027 supply response". KPI cards derive from
seed sums (`retirementRate ≈` 946/1,287 ≈ 74%). The methodology-issuance stacked bars, surplus
bars and regional radar are direct seed renders.

### 7.4 Worked example (scenario-conditional 2030, defaults)

Defaults: scenario `NDC` (mult 1.0), carbonTax 80 → taxMult 1.0, ndcAmbition 50 → ndcMult 1.0,
so `sm = 1.0`; 2030 is `i = 6`:

| Step | Computation | Result |
|---|---|---|
| Linear term | 65 + 6 × 11 × 1.0 | 131 |
| Post-2027 drag | (2030−2027) × 2.5 | −7.5 |
| scenarioConditional | 131 − 7.5 | **$123.5/t** |
| Bull | 123.5 × 1.2 | **$148.2** |
| meanReversion | 65 + 6·4.2 + (sr(42)−0.5)·4 = 90.2 + (0.702−0.5)·4 | **$91.0** |
| Bear | 91.0 × 0.78 | **$71.0** |

Switching to `1.5C` with tax $160 gives sm = 1.35 × 1.10 = 1.485 → sc₂₀₃₀ = 65 + 98.0 − 7.5 =
**$155.5/t** — inside the NGFS 1.5 °C 2030 corridor by coincidence of slope choice, not by
scenario data.

### 7.5 Data provenance & limitations

- Market tables and VCM history are **static seeds**; forecast noise, ITMO scatter VCM legs and
  the compliance trend use the platform PRNG `sr(seed)=frac(sin(seed+1)×10⁴)`. No API calls.
- The forecast labels misrepresent the maths (linear ramps labelled OU/ARIMA/NGFS). The bear
  band is anchored to the *lowest-slope* line and bull to the *highest*, so the "interval" is a
  slope spread, not a confidence interval.
- Retirement-rate KPI treats cumulative 10-year sums, blending market growth into a single ratio.

**Framework alignment:** ICAP ETS Map & World Bank *State and Trends of Carbon Pricing* (market
coverage, cap/surplus framing) · Ecosystem Marketplace VCM reports (issuance/retirement/price
shape) · Paris Agreement Art. 6.2 (ITMO deals, corresponding-adjustment flags on the deal table)
· NGFS scenarios (labels only — see mismatch flag) · CORSIA phases (policy tracker entries).

## 8 · Model Specification — Carbon Price Forecasting Suite (OU · Trend · Scenario-Conditional)

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Implement the three models the UI already advertises, for EUA (primary),
CCA, and a VCM composite index, horizon to 2030, producing genuine predictive distributions for
the existing chart/table components.

**8.2 Conceptual approach.** (i) **Mean reversion:** Ornstein–Uhlenbeck on log price — standard
commodity practice (Schwartz 1997 one-factor), used in bank commodity desks and consistent with
allowance banking theory; (ii) **trend-following:** ARIMA(p,1,q) with drift on monthly averages —
the benchmark statistical model; (iii) **scenario-conditional:** NGFS Phase IV/V scenario carbon
prices as attractors with an error-correction pull, mirroring how Aladdin Climate and NGFS-based
ECB/EBA stress tests inject policy paths.

**8.3 Mathematical specification.**

```
OU:      dx = θ(μ − x)dt + σ dW,  x = lnP
         x̂_{t+h} = μ + (x_t − μ)e^{−θh};  Var = σ²(1−e^{−2θh})/2θ
         P forecast band: exp(x̂ ± z_α √Var)
ARIMA:   ΔlnP_t = c + Σφᵢ ΔlnP_{t−i} + Σψⱼ ε_{t−j} + ε_t   (order by AICc, max (3,1,3))
ECM-NGFS: ΔlnP_t = α(lnP*_s(t) − lnP_{t−1}) + β′Z_t + ε_t
         P*_s = NGFS scenario price (s ∈ {NZ2050, Below2, Delayed, NDC, Current}), α ∈ (0,1] speed
         Z_t  = controls: gas price (TTF), industrial production, auction supply
Blend:   model-averaged forecast with weights ∝ exp(−½·rolling RMSE)
```

| Parameter | Calibration source |
|---|---|
| θ, μ, σ | MLE on ICE EUA daily settlements 2018→ (post-MSR regime); expect θ ≈ 0.3–0.6/yr |
| NGFS P*_s | NGFS Phase IV/V dataset (free, IIASA download) — candidate `reference_data` table |
| TTF gas, IP index | ENTSO-G/Eurostat (free) |
| VCM composite | Ecosystem Marketplace medians (already a platform seed file) + Platts CORSIA (vendor optional) |

**8.4 Data requirements.** Daily/monthly EUA settlements, NGFS scenario price CSV, macro
controls. Backend home: `carbon_price_ets_engine.py` (exists); frontend already has the
scenario/tax/NDC controls to condition the ECM path selection.

**8.5 Validation & benchmarking.** Rolling-origin backtest 2021–2024, RMSE vs (a) random walk,
(b) futures-implied forward (must beat RW at 6–12 m to justify display); parameter-stability
CUSUM across the 2022 energy-crisis regime; interval coverage test (80% band should contain
~80% of outcomes); cross-check 2030 scenario-conditional levels against published NGFS ranges.

**8.6 Limitations & model risk.** Policy jump risk (MSR reform, CBAM scope changes) violates
diffusion assumptions — overlay event dummies from the module's own `POLICY_EVENTS` table; VCM
composite index masks huge heterogeneity across project types; NGFS prices are marginal
abatement shadow prices, not market forecasts — the ECM attractor must be labelled as
scenario-conditional, never "expected". Fallback when data stale: display futures curve only.
