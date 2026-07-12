## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide states the interaction term is
> `ρ · √(CVaR_trans × CVaR_phys) × corrFactor` (a geometric-mean coupling, ≈0.7% of AUM) and that
> Delta CoVaR is computed per Adrian & Brunnermeier. In code, the interaction is
> `ρ × transVaR × physVaR` **with no AUM normalisation** — a raw $-times-$ product that is
> dimensionally $M² and *dominates* the total (at default settings the "interaction" is 15.8× the
> sum of the two main terms, total VaR ≈ 135% of AUM). The in-page comment even says
> "ρ · transVaR · physVaR / aum (keeps units)", but the engine function never divides by AUM.
> Delta CoVaR is a hard-coded 6-row display, not a computation. Sections below document the code
> as-is.

### 7.1 What the module computes

Interactive climate VaR with AUM ($1–50B), horizon (1–30y), confidence (90–99%) and 5 NGFS
scenario controls. Core function (`computeCVaR` in `ClimateVarEnginePage.jsx`, calling
`climateCVaR` from `frontend/src/engines/climateRisk.js`):

```
horizon_adj = √(T/10)
z_adj       = z_α / z_95                       (NQ table, Abramowitz & Stegun §26.2.17)
transVaR    = AUM × trans_s × horizon_adj × z_adj
physVaR     = AUM × phys_s  × horizon_adj × z_adj
totalVaR    = transVaR + physVaR + ρ_s × transVaR × physVaR      ← climateCVaR()
interVaR    = totalVaR − transVaR − physVaR
pct         = totalVaR / AUM × 100
```

### 7.2 Scenario parameterisation

| Scenario key | trans (10y loss rate) | phys | ρ | Reading |
|---|---|---|---|---|
| `current_policies` | 0.028 | 0.012 | 0.15 | Low transition, higher physical share |
| `delayed_transition` | 0.042 | 0.018 | 0.25 | Disorderly |
| `below_2c` | 0.055 | 0.010 | 0.20 | Orderly |
| `divergent_net_zero` | 0.065 | 0.014 | 0.28 | Highest coupling |
| `net_zero_2050` | 0.072 | 0.008 | 0.22 | Highest transition stress |

Provenance: **synthetic demo values** ("95% baseline calibration" per in-code comment; no external
citation). Note the ordering makes *Net Zero 2050 the worst transition-loss scenario* — defensible
as repricing severity, but opposite to NGFS credit-loss orderings where disorderly/hot-house
scenarios carry the larger losses. The normal-quantile table `NQ = {90: 1.2816 … 99: 2.3263}`
contains the correct one-sided standard-normal quantiles.

### 7.3 Calculation walkthrough

1. Sliders set `(aum, horizon, confidence)`; scenario pills set `scenario`.
2. `computeCVaR` produces the four decomposition cards and the headline `% of AUM`.
3. **Horizon sensitivity**: recomputes over T ∈ {1,2,3,5,10,15,20,30} — note it calls
   `computeCVaR(aum, scenario, h)` *without* the confidence argument, so this chart is always at
   95% even when the slider is at 99%.
4. **Loss distribution** (Tab 2): normal density with `mean = −pct`, `σ = max(1, pct/z_α)` — σ is
   back-solved so the VaR quantile lands at the computed VaR; a `ReferenceLine` marks −pct.
5. **Scenario comparison** (Tab 3): all 5 scenarios at the current AUM/horizon.
6. **Stress matrix** (Tab 4): 5 scenarios × 7 horizons of `pct`, colour-coded >10% red / >5% amber.

### 7.4 Worked example (defaults: AUM $10,000M, NZ2050, 10y, 95%)

| Step | Computation | Result |
|---|---|---|
| horizon_adj | √(10/10) | 1.0 |
| z_adj | 1.6449/1.6449 | 1.0 |
| transVaR | 10,000 × 0.072 | **$720M** |
| physVaR | 10,000 × 0.008 | **$80M** |
| interVaR | 0.22 × 720 × 80 | **$12,672M** |
| totalVaR | 720 + 80 + 12,672 | **$13,472M** |
| pct | 13,472/10,000 | **134.7% of AUM** |

The interaction term is 94% of the total and the "VaR" exceeds the portfolio — the arithmetic
signature of the missing `/AUM`. With the intended normalisation
(`ρ×trans×phys/AUM = 0.22×720×80/10,000 = $1.27M`, ≈0.01% of AUM) the total would be a plausible
8.0%. The guide's illustrative 8.7% figure is only reachable with the corrected formula.

### 7.5 Companion analytics

- **Delta CoVaR tab**: six static rows (Oil & Gas ΔCoVaR 2.84%, Utilities-coal 1.92%, Steel &
  Cement 1.45%, Real Estate EPC F/G 1.14%, Aviation 0.82%, Financials 0.68%) with portfolio
  weights — illustrative constants, no quantile-regression computation.
- The stress matrix inherits the interaction bug, so most cells saturate red at longer horizons
  (pct grows with √T *and* the product term grows with AUM).

### 7.6 Data provenance & limitations

- No portfolio data at all — the model is a closed-form function of the slider inputs; scenario
  sensitivities are synthetic. No seeded-PRNG use on this page (deterministic formulas only).
- Confidence scaling is linear in z (`z_α/z_95`), i.e. a normal-VaR assumption; no fat tails.
- √T scaling assumes i.i.d. losses across years — inconsistent with trending transition risk.
- Horizon-sensitivity chart ignores the confidence slider (95% hard default).
- Interaction term is dimensionally wrong (see §7.4) — headline outputs above ~$3B AUM are not
  credible until `climateCVaR` divides the product term by AUM.

**Framework alignment:** NGFS scenarios — the five names match the NGFS set (Phase III/IV
labels); parameters are not NGFS data · ECB CST 2022 / BoE CBES — decomposition into transition +
physical with scenario conditioning mirrors supervisory practice, though those exercises project
PD/LGD paths rather than scaling AUM · Adrian & Brunnermeier (2016) CoVaR — ΔCoVaR is properly
defined as VaR of the system conditional on an institution's distress minus its median state,
estimated by quantile regression; here it is displayed, not estimated · Normal VaR quantiles per
Abramowitz & Stegun are correctly tabulated.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A production climate VaR for multi-asset portfolios (equity, credit, real assets) supporting risk
appetite setting, ICAAP/Pillar-2 climate add-ons, and TCFD/ISSB scenario disclosure. Replaces the
scalar `AUM × rate` heuristic and the broken interaction term.

### 8.2 Conceptual approach
Bottom-up factor repricing in the style of **MSCI Climate VaR** (policy + technology + physical
sub-models aggregated at security level) and **BlackRock Aladdin Climate** (scenario-conditioned
cash-flow discounting), with dependence handled by a Gaussian copula on transition/physical loss
drivers as in **ECB economy-wide stress test** methodology.

### 8.3 Mathematical specification

```
Security level:   L_i^trans(s) = D_i × Δspread_i(s) + w_i^eq × ΔV_i^eq(s)
                  ΔV_i^eq(s)   = Σ_t ΔFCF_i,t(s)/(1+r)^t / V_i,0      (carbon cost + capex path)
                  L_i^phys(s)  = Σ_h EAD_i,h × EAL_h × m_h(s) × (1−ins_i)
Portfolio:        L^k = Σ_i w_i L_i^k,   k ∈ {trans, phys}
Aggregation:      L_total = L^trans + L^phys with (Z_t, Z_p) ~ N(0, [[1,ρ],[ρ,1]])
                  VaR_α = μ_L + z_α σ_L,   σ_L² = σ_t² + σ_p² + 2ρσ_tσ_p   (correct bilinear form)
                  CVaR_α = μ_L + σ_L φ(z_α)/(1−α)
ΔCoVaR_j          = γ̂_j × (VaR_α(X_j) − Median(X_j))    via 5%/50% quantile regressions
```

| Parameter | Calibration source |
|---|---|
| Δspread per scenario | NGFS Phase IV/V macro-financial variables; ECB CST 2022 spread paths |
| Carbon price / capex paths | NGFS scenario database (REMIND marker), IEA WEO/NZE |
| EAL_h hazard base rates | EM-DAT loss history; Swiss Re sigma cat tables (platform has EM-DAT seed) |
| m_h(s) hazard multipliers | Platform `PHYSICAL_MULTIPLIERS` (SSP×hazard) cross-checked to IPCC AR6 WGI |
| ρ (trans, phys) | Estimated from NGFS GDP damage vs carbon-price co-movement across scenarios; floor 0.2 |
| Insurance share ins_i | Swiss Re sigma protection-gap data by region |

### 8.4 Data requirements
Holdings with sector/NACE, duration, EVIC (exists: portfolio contexts + PCAF module), issuer
Scope 1/2 (reference_data OWID/CDP seeds), asset geolocation for hazards (PostGIS layer, migrations
057–067), scenario curves (NGFS download, free), spreads (ICE/Refinitiv vendor or FRED HY/IG
proxies, free).

### 8.5 Validation & benchmarking plan
Reconcile portfolio-level Climate VaR against MSCI Climate VaR for an overlapping benchmark index
(target within ±30% at scenario level); backtest physical EAL against EM-DAT realised losses
2000–2024 by region; sensitivity to ρ ∈ {0, 0.25, 0.5}; convergence test of the copula aggregation
vs full Monte Carlo (10⁵ paths, seeded).

### 8.6 Limitations & model risk
Normal aggregation understates tail dependence — publish CVaR alongside VaR and stress ρ→1 as a
conservative bound. Scenario incompleteness (no litigation/reputation channel). Equity repricing
assumes orderly market absorption; add a disorderly-repricing multiplier (×1.5) for DT/DNZ
scenarios per BoE CBES findings.
