## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *cost-of-carry forward
> pricing model* — `F(t,T) = S(t) × exp((r + c − y)(T−t))`, convenience-yield extraction,
> Black-76 implied volatility from EUA options, ACCU/NZU term structures, a hedging analyser and
> a portfolio-sensitivity tab. **None of that is implemented.** The code contains no exponential
> carry formula, no volatility computation, no options data, and no hedging calculator. What the
> page actually renders is an **ETS market dashboard with linear scenario price paths**: an
> 8-market compliance price table, EU ETS quarterly spot history (2020–2024), four hand-built
> forward scenario lines, NGFS/IEA VCM price paths, and cap-reduction schedules. The sections
> below document the code as it behaves; §8 specifies the missing carry/IV model.

### 7.1 What the module computes

The "forward curve" is a deterministic linear ramp with seeded noise, per scenario, over 9
tenors (2025–2030, 2035, 2040, 2050), anchored at the hard-coded EU ETS spot €62.4/t:

```
baseline_i     = round(62.4 + i × 8.2  + sr(i×5)  × 4)
accelerated_i  = round(62.4 + i × 14.8 + sr(i×7)  × 5)
delayed_i      = round(62.4 + i × 3.8  + sr(i×11) × 3)
ncb_forecast_i = round(62.4 + i × 9.4  + sr(i×13) × 6)
RangeWidth_i   = accelerated_i − delayed_i
```

where `i` is the tenor index (NOT years-to-maturity — the 2030→2035→2040→2050 steps get the same
per-index slope as annual steps, so the curve implicitly flattens in calendar time). VCM scenario
paths are hard-coded price ladders per scenario (NGFS NZE: 8→200 $/t over 2024–2040; Current
Policies: 8→22 $/t). Cap schedules are linear: `EU cap_i = 1520 − 60i` Mt, `California = 380 − 14i`,
`RGGI = 130 − 8i`. Trading volume/open-interest figures are pure `sr()` draws.

### 7.2 Parameterisation

| Block | Values | Provenance |
|---|---|---|
| `ETS_MARKETS` (8 rows; +India CCTS ₹3.2/t when India mode on) | EU €62.4 (+18.2% YTD), UK £44.8, CA $38.2, RGGI $14.6, China ¥→$9.8, Korea $8.2, NZ $52.6, Canada OBPS C$65 | Static seeds, plausible late-2024 levels (ICAP-style) |
| `EU_PRICE_HISTORY` (21 quarters) | 2020Q1 €24.2 → 2022Q1 €82.4 → 2023Q1 €92.4 → 2024Q4 €62.4 | Static; tracks actual EUA quarterly averages closely |
| Scenario slopes 8.2 / 14.8 / 3.8 / 9.4 €/step | — | Synthetic demo values (no cited source) |
| VCM scenario ladders | NGFS NZE / Below-2°C / IEA SDS / Current Policies | Labelled after NGFS & IEA scenarios; magnitudes consistent with NGFS carbon-price ranges but hand-entered |
| KPI "Global ETS Coverage ~17%" | static | Order of ICAP 2023 (~17–18% of global GHG) |
| LRF −4.4%/yr, MSR TNAC 2.1B, intake 24% | static text | EU ETS Directive (Fit-for-55 LRF 4.3/4.4%), MSR Decision 2015/1814 — descriptive only |

### 7.3 Calculation walkthrough

1. Tab 1 tables `ETS_MARKETS` and charts price/cap comparisons — pure display.
2. Tab 2 charts `EU_PRICE_HISTORY` with a €50 support reference line, plus static policy-milestone
   and MSR-trigger tables.
3. Tab 3 selects a market (display only — the scenario lines are always EUR/EU-anchored), then
   renders `FORWARD_SCENARIOS` as four lines plus the Range Width column.
4. Tab 4 renders the VCM ladders; Tab 5 the linear cap schedules and `sr()`-seeded volume table.

### 7.4 Worked example (2030 baseline forward)

2030 is index `i = 5` in the tenor array:

| Step | Computation | Result |
|---|---|---|
| Trend | 62.4 + 5 × 8.2 | 103.4 |
| Noise | sr(25) = frac(sin(26)×10⁴) = frac(7625.58) = 0.585; × 4 | +2.34 |
| Baseline 2030 | round(103.4 + 2.34) | **€106/t** |
| Accelerated 2030 | sr(35) = frac(−9917.78) = 0.222; round(62.4 + 74 + 0.222×5) | **€138/t** |
| Delayed 2030 | sr(55) = frac(−5215.51) = 0.485; round(62.4 + 19 + 0.485×3) | **€83/t** |
| Range width | 138 − 83 | **€55/t** |

(JS `x − Math.floor(x)` maps negative products into [0,1), so sin(36)×10⁴ = −9917.78 yields
0.222. The noise is deterministic per seed; displayed integers reproduce these draws exactly.)

### 7.5 Data provenance & limitations

- Forward scenarios, volumes and open interest are **synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`
  pattern); price history and market table are static but realistic seeds. Nothing is fetched
  from ICE/CME or the mapped `/api/v1/carbon/*` endpoints.
- No no-arbitrage structure: scenario lines are policy narratives, not tradable forwards; the
  equal-slope-per-index treatment of 5/10-year tenor gaps understates long-dated carry.
- Guide-promised analytics missing: convenience yield, contango/backwardation flags, implied
  vol surface, hedge-cost quantification, ACCU/NZU curves.
- India-mode injection (`isIndiaMode()`) prepends an India CCTS row — the only dynamic data path.

**Framework alignment:** EU ETS Directive 2003/87/EC as amended (Phase 4 LRF 2.2% → 4.3/4.4%
under Fit-for-55; module quotes −4.4%/yr) · MSR Decision (EU) 2015/1814 (24% intake rate quoted) ·
NGFS scenario taxonomy (labels only) · ICAP ETS coverage statistics (~17%). The guide's ICE EUA
futures conventions and Black-76 are *not* represented in code.

## 8 · Model Specification — Carbon Forward Curve & Implied Volatility Engine

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Produce arbitrage-consistent EUA/UKA/CCA/NZU forward curves with carry
decomposition and an ATM implied-volatility term structure, supporting hedge-cost quotation and
long-dated extrapolation to 2050 — the decisions the guide promises (corporate hedging, project
finance carbon-price assumptions).

**8.2 Conceptual approach.** (i) Liquid tenors: cost-of-carry fit to exchange settlements, the
convention used by ICE EUA futures desks and replicated in MSCI/BarraOne commodity curve models;
carbon behaves near full-carry because allowances are bankable with negligible storage cost.
(ii) Long end: splice to NGFS Phase IV/V scenario shadow prices via a smooth blend, as done in
Aladdin Climate and NGFS-based supervisory exercises. (iii) Vol: Black-76 inversion of EUA option
settlements.

**8.3 Mathematical specification.**

```
F(t,T)        = S(t) · exp[(r(t,T) + c − y(t,T)) · (T−t)]          // c ≈ 0 (registry storage)
y(t,T)        = r(t,T) − ln(F_mkt/S)/(T−t)                          // implied convenience yield
State         : contango if F_mkt > S·e^{rτ}, else backwardation
F_blend(T)    = w(T)·F_carry(T) + (1−w(T))·P_NGFS(T),  w(T)=max(0,1−(T−T_liq)/5yr)
Black-76 IV   : C = e^{-rτ}[F·N(d1) − K·N(d2)] solved for σ (Newton), d1 = [ln(F/K)+σ²τ/2]/(σ√τ)
HedgeCost(Q,T)= Q · [F(t,T) − S(t)] + margin funding: Q·F·IM%·r_f·τ
```

| Parameter | Calibration source |
|---|---|
| S, F_mkt per tenor | ICE Endex EUA futures daily settlements (public delayed); CME CCA |
| r(t,T) | €STR/SOFR OIS curve (ECB/NY Fed, free) |
| P_NGFS(T) | NGFS Phase IV/V carbon price by scenario (free download; candidate for `reference_data`) |
| Option settlements for IV | ICE EUA options end-of-day (vendor); fallback: realised vol × 1.1 loading |
| IM% initial margin | ICE Clear Europe margin parameters (public) |

**8.4 Data requirements.** Daily settlement strip (Dec contracts to +5y), OIS curve, NGFS price
paths, option chain (strike, premium, expiry). Platform: extend `reference_data` generic tables
(a CBAM/EEX seed layer already exists per the EA-hybrid-v3 sprint); serve via
`/api/v1/refdata`.

**8.5 Validation & benchmarking.** Repricing test: fitted curve must reproduce input settlements
to <€0.05; convenience-yield series compared against academic EUA carry studies (near-zero,
occasionally negative in policy-uncertainty windows); IV surface benchmarked to ICE-published
settlement vols; blend-region continuity (no slope jump > €2/t/yr at T_liq).

**8.6 Limitations & model risk.** Carbon carry can break at compliance dates (April surrender
spikes); MSR interventions create policy jumps no diffusion captures — flag regime risk; NGFS
prices are scenario shadow values, not forecasts, so the blended long end must be labelled
scenario-conditional; thin CCA/NZU options force proxy vols (conservative: max of proxy and
realised).
