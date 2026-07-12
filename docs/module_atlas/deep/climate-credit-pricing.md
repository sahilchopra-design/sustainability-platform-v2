## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *carbon-price / ETS allowance
> / VCM benchmark* pricing engine — "ETS allowance fair value from MAC-curve intersection", "VCM
> price by methodology vintage", "corporate internal carbon price (ICP) adoption". **None of that is
> in the code.** The page actually implements **climate-adjusted loan credit-spread pricing**: a base
> spread plus physical, transition and carbon-price premia (in bps), an annual-interest and
> climate-add-on calculation, a risk-weighted-capital multiplier, and a portfolio climate VaR. The
> domain is corporate *loan pricing*, not carbon *commodity* pricing. The sections below document the
> code.

### 7.1 What the module computes

The core is `calcClimateSpread` — a bps-additive spread build-up per borrower:

```
scMult      = { Orderly 0.8, Disorderly 1.2, Delayed 1.4, Hot House 1.0, NDC 1.1 }[scenario]
physPrem    = (physRiskScore/100) × 25 × scMult          (bps)
transPrem   = (transRiskScore/100) × 35 × scMult         (bps)
carbonPrem  = max(0, carbonPrice − 50) × 0.08 × (transRiskScore/100)   (bps)
totalSpr    = baseSpr + physPrem + transPrem + carbonPrem
annInterest = loanM × totalSpr / 10000                   ($M)
climateAddon= loanM × (physPrem + transPrem + carbonPrem) / 10000
rcwa        = min(1.5, 0.75 + (physRiskScore + transRiskScore)/400)    (risk-weight multiplier)
```

And `calcClimateVar` — a portfolio climate VaR by horizon and confidence:
```
baseVar     = Σ loanM × (baseSpr/10000) × 0.08
horizonMult = { 1yr 1, 3yr 1.8, 5yr 2.4, 10yr 3.5 }
confMult    = { 95% 0.85, 99% 1.0, 99.9% 1.25 }
physVar     = Σ loanM × (physPrem/10000) × horizonMult × confMult
transVar    = Σ loanM × (transPrem/10000) × horizonMult × confMult
totalVar    = baseVar + physVar + transVar
climateShare= (physVar + transVar) / totalVar × 100
```

### 7.2 Parameterisation / provenance

| Constant | Value | Provenance |
|---|---|---|
| Physical premium ceiling | 25 bps at score 100 | Hard-coded design scalar |
| Transition premium ceiling | 35 bps at score 100 | Hard-coded (transition weighted > physical) |
| Carbon-price floor / slope | `max(0, price−50)×0.08` | €50 floor, 0.08 bps per €/t above |
| Scenario multipliers | 0.8 / 1.2 / 1.4 / 1.0 / 1.1 | Disorderly/Delayed worst — NGFS-consistent ordering |
| `BORROWER_SECTORS` (8) | baseSpr 95–195, phys/trans scores | Hard-coded sector demo |
| `SCENARIO_PREMIA` (5) | phys/trans/total prem, GDP impact | Hard-coded NGFS-flavoured table |
| `CREDIT_VAR_PARAMS` | climate share 8–55 % by horizon | Hard-coded reference |
| `RISK_COMPONENTS` (8) | weights summing to 1.0 | Hard-coded taxonomy (not used in calc) |
| VaR base rate | `baseSpr × 0.08` | 8 % PD-like base loss proxy |

Sector risk scores are hard-coded (e.g. Oil & Gas transRiskScore 94, Agriculture physRiskScore 85);
only the 12-loan `PORTFOLIO_LOANS` uses `sr()` noise on top of the sector defaults.

### 7.3 Calculation walkthrough

1. User picks borrower sector, NGFS scenario, and carbon price.
2. `calcClimateSpread` builds the spread: physical + transition + carbon premia on the base, scaled
   by the scenario multiplier; `spreadDecomp` renders the waterfall.
3. `rcwa` maps combined risk to a 0.75–1.5 capital risk-weight multiplier.
4. `calcClimateVar` scales premia by horizon and confidence and reports the climate share of VaR.
5. `sectorScatter`, `ratingGrid` (12 ratings with a seeded climate adjustment) provide context.

### 7.4 Worked example — Oil & Gas under Delayed 2.0 °C, carbon €85

Borrower **Oil & Gas** (`baseSpr = 145`, `physRiskScore = 38`, `transRiskScore = 94`,
`loanM = 400`), scenario **Delayed** (`scMult = 1.4`), `carbonPrice = 85`:

| Step | Computation | Result |
|---|---|---|
| Physical premium | (38/100) × 25 × 1.4 | 13.3 bps |
| Transition premium | (94/100) × 35 × 1.4 | 46.1 bps |
| Carbon premium | max(0, 85−50) × 0.08 × 0.94 | 2.6 bps |
| Total spread | 145 + 13.3 + 46.1 + 2.6 | **207.0 bps** |
| Annual interest | 400 × 207.0 / 10,000 | **$8.28 M** |
| Climate add-on | 400 × (13.3+46.1+2.6) / 10,000 | **$2.48 M** |
| RCWA | min(1.5, 0.75 + (38+94)/400) | **1.08** |

Transition risk dominates the climate premium for a fossil borrower — the intended signal.

### 7.5 Data provenance & limitations

- Sector risk scores and premium tables are **hard-coded**; the 12-loan portfolio and rating-grid
  climate adjustment use the seeded PRNG `sr(seed) = frac(sin(seed+1)×10⁴)`.
- The spread build-up is **additive in bps with hard-coded ceilings** (25/35), not derived from a
  PD/LGD credit model — it is a heuristic overlay, not a structural pricing model.
- The "Climate VaR" is a **scaled premium sum** (`premium × horizonMult × confMult`), not a
  loss-distribution quantile — `confMult` is a flat scalar, not a real confidence-level shift.
- `RISK_COMPONENTS` weights (summing to 1.0) are displayed but never enter the spread calc.

**Framework alignment:** The scenario set and multipliers echo **NGFS** (disorderly/delayed worst for
transition; hot-house worst for physical); the carbon-price premium is a stylised **carbon-cost
pass-through**; `rcwa` gestures at **Basel** risk-weighting. But the pricing is a bps heuristic, not
a validated credit model — §8 specifies the production climate-adjusted spread model.

## 8 · Model Specification — Climate-Adjusted Credit-Spread & Climate VaR

**Status: specification — not yet implemented in code.** The spread and VaR here are bps heuristics;
this specifies the structural model a bank pricing desk would validate.

### 8.1 Purpose & scope
Price the climate component of a corporate loan spread and estimate portfolio climate credit VaR,
grounded in scenario-conditioned PD/LGD rather than additive premium ceilings.

### 8.2 Conceptual approach
A **reduced-form spread from expected loss** with an NGFS-conditioned PD/LGD, plus a Monte-Carlo
loss-distribution VaR. Benchmarks: Merton/KMV structural PD with climate asset-drift (Moody's
climate-adjusted EDF) and the ECB/EBA climate stress PD-uplift approach; VaR via CreditMetrics-style
simulation.

### 8.3 Mathematical specification
```
PD_s        = PD_0 · [1 + (mult_s − 1)·(carbonInt/CI_max)] · physFactor_s     (climate-conditioned)
LGD_s       = LGD_0 · lgdMult_s
Spread_bps  = 10^4 · [ (PD_s·LGD_s)/(1 − PD_s·LGD_s) + liquidity + margin ]     (EL-based spread)
ClimatePremium = Spread_bps(s) − Spread_bps(baseline)
Loss_i      = EAD_i · 1{default_i} · LGD_i,s     (MC draw, default ~ Bernoulli(PD_i,s) with copula)
VaR_q       = Quantile_q( Σ_i Loss_i )
ClimateVaR  = VaR_q(climate) − VaR_q(baseline)
```
| Parameter | Source |
|---|---|
| PD_0, LGD_0 | Rating master scale (S&P/Moody's transition matrices) |
| Scenario mult_s, lgdMult_s | NGFS Phase IV PD/LGD stress (per ECB climate ST) |
| carbonInt, CI_max | PCAF Scope 1+2+3; 800 tCO₂e/GWh coal ceiling |
| Default correlation | Asset-correlation ρ (Basel IRB / Gaussian copula) |
| Liquidity/margin | Market spread decomposition |

### 8.4 Data requirements
Per-loan EAD, rating→PD, LGD, sector carbon intensity, physical hazard exposure, and NGFS
scenario PD/LGD multipliers (in platform scenario tables). Sector risk scores already exist; the
missing inputs are rating-based PD/LGD and a default-correlation structure.

### 8.5 Validation & benchmarking plan
Reconcile EL-based spreads against observed loan pricing for the rating cohort; backtest PD uplift
against realised transition-sector downgrades; reconcile ClimateVaR against an ECB climate-stress PD
run; sensitivity-test to correlation ρ and scenario multipliers.

### 8.6 Limitations & model risk
Reduced-form spread ignores term structure and prepayment; single-factor correlation understates
tail clustering; NGFS scenarios are not probabilities. Conservative fallback: quote a spread range
across orderly/disorderly scenarios and report ClimateVaR as an add-on band, not a point estimate.
