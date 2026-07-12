## 7 · Methodology Deep Dive

### 7.1 What the module computes

This is one of the platform's more rigorously implemented modules: a genuine multi-scenario **DCF
impairment engine** over 8 named credit/equity/bond positions, using a real tabular NGFS Phase 4
carbon-price curve (`ngfsCarbonPrice()` in `frontend/src/engines/climateRisk.js`, piecewise-linear
interpolated between published 2025/2030/2035/2040/2045/2050 price points — not a sinusoidal or PRNG
approximation). Core formula:

```
base_cf(t)        = book × 0.18 × 0.98^t                                   // declining baseline CF
carbonCost(t)      = (emissionsIntensity/1000) × carbonPrice(t) × book × 0.001
revenueImpact(t)   = base_cf(t) × passthrough × (carbonPrice(t)/100) × 0.1
adjusted_cf(t)     = max(0, base_cf(t) − carbonCost(t) − revenueImpact(t))
wacc_adjusted      = wacc_base + beta_c × carbonPrice(t=5)
NPV                = Σ CF(t)/(1+wacc)^(t+1) + TerminalValue                // Gordon Growth, g=2%
impairment         = NPV_base − NPV_adjusted
stranded_year       = first year where adjusted_cf ≤ 0
```

### 7.2 Parameterisation

| Parameter | Values | Provenance |
|---|---|---|
| NGFS carbon price table | NZ2050: $48(2025)→$860(2050); BelowAc: $35→$580; NatAmbI: $18→$195; CurrPol: $12→$42; DP (Delayed): $10(2025)→$550(2050) with a sharp post-2035 acceleration | Genuine tabular NGFS Phase 4 (Sept 2023)-style scenario price paths, piecewise-linearly interpolated — the Delayed Transition curve's late acceleration ($28→$120 between 2035-2040) correctly encodes NGFS's "disorderly, abrupt policy" narrative |
| `ASSETS` (8 positions) | Named real companies (BP, RWE, ArcelorMittal, HeidelbergCement, Lufthansa, Barratt, BASF, Glencore), each with book value, emissions intensity, carbon-cost pass-through rate, base WACC, and `beta_c` | Hand-curated, directionally realistic (RWE coal has highest intensity 820 and lowest pass-through 0.10; Lufthansa/Barratt lowest intensity) |
| `beta_c` (carbon beta) | 0.0004 (Barratt RE) to 0.0015 (RWE coal) | Platform-authored sensitivity of WACC to carbon price — see §7.4 for the resulting magnitude, which can be large |
| Terminal growth `G_TV` | 2% | Standard Gordon Growth Model perpetuity assumption |
| Revenue decay | 0.98^t (2%/yr autonomous decline) | Platform-authored baseline assumption, not asset-specific |

### 7.3 Calculation walkthrough

1. **Carbon price lookup**: `carbonPrice(scenario, t)` maps the local scenario key to the NGFS
   table key and interpolates at year `2024+t`.
2. **Carbon cost proxy**: `(intensity/1000) × price × book × 0.001` is a **proxy formula**, not a
   physically-grounded emissions-volume × price calculation — it scales with the *book value* of the
   position (not actual production volume or tonnes emitted), so two assets with identical emissions
   intensity but different book sizes get proportionally different carbon costs even if their true
   physical emissions were the same. This is a reasonable simplification for a demo DCF but should
   not be read as a bottom-up MRV-grade carbon-cost estimate.
3. **Revenue impact**: models a second transmission channel — cost pass-through eroding *demand*
   (revenue), scaled by the pass-through rate and carbon price level — a real economic mechanism
   (higher carbon costs reduce competitiveness/demand for carbon-intensive output) even if the
   specific coefficients (0.1 scalar) are calibration choices rather than econometrically estimated.
4. **WACC adjustment**: `wacc_base + beta_c × price(t=5)` — raises the discount rate as a function of
   the mid-horizon carbon price; see §7.4 for how large this adjustment can become for high-`beta_c`
   assets under Net Zero 2050.
5. **NPV & terminal value**: standard discounted cash flow with Gordon Growth terminal value,
   correctly guarding `wacc > g` before computing (returns TV=0 otherwise, avoiding a negative/
   infinite terminal value).
6. **Stranded year**: first year the adjusted cash flow hits zero (floored by `max(0,·)`), flagged
   per asset per scenario.
7. **Portfolio & scenario comparison**: sums impairment across all 8 assets per scenario, and
   computes `impairment / totalBook × 100` as a portfolio-level % impact for the 5-scenario
   comparison chart.

### 7.4 Worked example (BP Upstream, Net Zero 2050, `t=0`/2024)

| Step | Computation | Result |
|---|---|---|
| Carbon price (2024, extrapolated to 2025 floor) | `ngfsCarbonPrice('NZ2050', 2024)` clamped to first table year | **$48/tCO2e** |
| Base cash flow | `2400 × 0.18 × 0.98⁰` | **$432M** |
| Carbon cost | `(180/1000) × 48 × 2400 × 0.001` | **$20.7M** |
| Revenue impact | `432 × 0.30 × (48/100) × 0.1` | **$6.2M** |
| Adjusted cash flow | `432 − 20.7 − 6.2` | **$405.0M** |
| Carbon price at t=5 (2029, interpolated) | between $48(2025) and $147(2030): `48+0.8×(147−48)` | **$127.2/tCO2e** |
| WACC adjustment | `0.085 + 0.0008 × 127.2` | **18.68%** (vs 8.5% base — more than doubles the discount rate) |

The WACC more than doubling under Net Zero 2050 for BP illustrates that `beta_c` is calibrated
aggressively for oil & gas — a >10 percentage-point WACC uplift is a large, front-loaded transition
risk premium; whether this specific magnitude is well-calibrated against real credit-spread/
equity-risk-premium repricing evidence is not documented in-code (a production model would want to
cite an empirical carbon-beta estimation study, e.g. cross-sectional regression of equity beta on
carbon intensity).

### 7.5 Companion analytics

- **Carbon Price Trajectories tab** — all 5 scenario curves plotted 2024–2050, directly from the
  NGFS tabular data.
- **Portfolio Exposure tab** — aggregates impairment across all 8 assets for the selected scenario,
  with `strandedCount` (assets hitting zero cash flow within the horizon).
- **Stranded CAPEX tab** — highlights the specific year each asset's adjusted cash flow reaches zero.
- **Scenario Comparison tab** — recomputes portfolio impairment for all 5 scenarios side-by-side,
  correctly showing Net Zero 2050 (highest near-term carbon price) as the most severe near-term
  impairment scenario, consistent with the NGFS "orderly-vs-disorderly" transition-risk framing.

### 7.6 Data provenance & limitations

- **Carbon price data is genuinely NGFS-anchored** (tabular, interpolated, not PRNG or sinusoidal) —
  one of the more credible quantitative building blocks across the modules reviewed in this batch.
- **Carbon cost and revenue-impact formulas are proxy calibrations**, not physically-derived from
  actual tonnage/production data — they use book value as a stand-in for output volume, which
  conflates balance-sheet size with physical emissions exposure.
- **`beta_c` (carbon beta) values are platform-authored judgment calls** with no cited empirical
  source; as shown in §7.4, they can produce large (>10pp) WACC adjustments that materially drive
  the impairment result, so this is the single highest-leverage unvalidated parameter in the model.
- Revenue decay (2%/yr autonomous decline) is applied uniformly to all 8 assets regardless of sector
  growth dynamics.

### 7.7 Framework alignment

- **NGFS Phase 4 scenarios** (Current Policies, Delayed Transition, Below 2°C, Nationally
  Determined Contributions/Divergent, Net Zero 2050): correctly named and calibrated to genuine NGFS
  reference carbon-price trajectories.
- **IAS 36 Impairment Testing**: the NPV-difference-as-impairment framing (`NPV_base − NPV_adjusted`)
  mirrors how a real IAS 36 value-in-use recoverable-amount test would incorporate climate-adjusted
  cash flow projections.
- **ISSB IFRS S2 climate-related financial disclosure**: the scenario-based DCF impairment approach
  is consistent with what IFRS S2 expects issuers to demonstrate when disclosing climate resilience
  of their asset base under different transition pathways.
- **Gordon Growth (constant-growth perpetuity) terminal value**: a standard, correctly-implemented
  valuation technique, including the `wacc > g` guard that many simpler DCF implementations omit.
