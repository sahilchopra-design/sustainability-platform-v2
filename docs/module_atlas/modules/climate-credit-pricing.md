# Climate Credit Pricing Analytics
**Module ID:** `climate-credit-pricing` · **Route:** `/climate-credit-pricing` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Comprehensive carbon credit and ETS allowance pricing analytics covering supply/demand balance modelling, policy risk pricing, VCM benchmark prices by methodology and vintage, and corporate internal carbon price (ICP) adoption tracking. Models the gap between current market prices and shadow carbon prices consistent with Paris Agreement pathways.

> **Business value:** Used by carbon traders, corporate treasury, climate strategists, and sustainability teams to price carbon risk, benchmark VCM procurement, and set internally consistent carbon pricing signals.

**How an analyst works this module:**
- Select ETS market and review supply/demand balance and price model
- Browse VCM price benchmarks by methodology, vintage, and quality tier
- Review corporate ICP distribution and shadow price gap analysis
- Model portfolio-level carbon cost at current vs future shadow prices

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BORROWER_SECTORS`, `CREDIT_VAR_PARAMS`, `PORTFOLIO_LOANS`, `RISK_COMPONENTS`, `SCENARIO_PREMIA`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `BORROWER_SECTORS` | 9 | `name`, `baseSpr`, `physRisk`, `transRisk`, `physRiskScore`, `transRiskScore`, `revenue`, `emissions`, `loanM`, `maturity`, `rating` |
| `RISK_COMPONENTS` | 9 | `weight`, `description` |
| `SCENARIO_PREMIA` | 6 | `physPrem`, `transPrem`, `totalPrem`, `gdpImpact`, `stranded`, `timeline` |
| `CREDIT_VAR_PARAMS` | 5 | `confidence`, `climateShare`, `driver` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `noise` | `sr(i * 17 + 3) * 40 - 20;` |
| `physPrem` | `(physRiskScore / 100) * 25 * scMult;` |
| `transPrem` | `(transRiskScore / 100) * 35 * scMult;` |
| `carbonPrem` | `Math.max(0, carbonPrice - 50) * 0.08 * (transRiskScore / 100);` |
| `totalSpr` | `baseSpr + physPrem + transPrem + carbonPrem;` |
| `annInterest` | `loanM * totalSpr / 10000;` |
| `climateAddon` | `loanM * (physPrem + transPrem + carbonPrem) / 10000;` |
| `rcwa` | `Math.min(1.5, 0.75 + (physRiskScore + transRiskScore) / 400);` |
| `baseVar` | `portfolio.reduce((s, l) => s + l.loanM * (l.baseSpr / 10000) * 0.08, 0);` |
| `physVar` | `portfolio.reduce((s, l) => s + l.loanM * (l.physPrem / 10000) * horizonMult * confMult, 0);` |
| `transVar` | `portfolio.reduce((s, l) => s + l.loanM * (l.transPrem / 10000) * horizonMult * confMult, 0);` |
| `totalVar` | `baseVar + physVar + transVar;` |
| `climateShare` | `(physVar + transVar) / totalVar * 100;` |
| `scenarioComparison` | `useMemo(() => SCENARIO_PREMIA.map(s => ({` |
| `sectorScatter` | `useMemo(() => BORROWER_SECTORS.map(s => ({` |
| `ratingGrid` | `useMemo(() => ['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB'].map((r, i) => ({` |
| `addon` | `Math.round(l.loanM * (l.physPrem + l.transPrem) / 10000 * 1000);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BORROWER_SECTORS`, `CREDIT_VAR_PARAMS`, `RISK_COMPONENTS`, `SCENARIO_PREMIA`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ETS Allowance Fair Value (€/tCO2) | `MAC_curve_intersection + banking_premium` | MAC modelling + EEX forward curve | Provides anchor for ETS allowance trading decisions; significant deviations from fair value indicate short-term supply/demand imbalances. |
| VCM Price by Methodology ($/tCO2) | `transaction-weighted median price by methodology family` | Trove Intelligence + ACX exchange data | Nature-based avoidance ~$5-15; technological removal (DACCS) ~$200-600; gap reflects permanence and scalability differentials. |
| Corporate ICP Adoption Rate | `companies_with_ICP / Fortune_500_total × 100` | CDP Corporate Action Score survey | CDP data shows ~30% of Fortune 500 use ICP for internal decision-making; higher ICP adoption correlates with SBTi target setting. |
- **EEX/ICE ETS forward curves + Trove VCM transactions + CDP ICP survey** → MAC curve modelling → fair value estimation → ICP gap analysis → **Carbon price analytics dashboard for trading, procurement, and strategic planning**

## 5 · Intermediate Transformation Logic
**Methodology:** ETS Allowance Price & VCM Benchmark Modelling
**Headline formula:** `fair_value = f(net_long_position, banking_demand, policy_signal, MAC_curve_intersection)`

ETS allowance fair value is estimated by intersecting the marginal abatement cost (MAC) curve with the capped supply path, adjusted for banking demand (which typically adds €5-15/tCO2 premium in the EU ETS). VCM prices are benchmarked by methodology vintage using Trove Intelligence transaction data, normalised to 2024 USD. Corporate ICP data from CDP shows Fortune 500 average of $50/tCO2 with wide dispersion (P10=$5 to P90=$200).

**Standards:** ['EU ETS Market Stability Reserve Regulation 2018/842', 'Trove Intelligence VCM Price Benchmarks', 'Fortune 500 ICP Survey (CDP 2024)']
**Reference documents:** EU ETS MSR Regulation 2018/842; CDP Global Carbon Price Survey 2024; Trove Intelligence VCM Transaction Data 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Rename honestly, then benchmark the spread model (analytics ladder: rung 2 → 3)

**What.** §7 documents a wholesale identity mismatch: the guide describes carbon-
commodity pricing (ETS fair value via MAC-curve intersection, VCM vintage benchmarks,
ICP tracking) while the code implements climate-adjusted **loan spread pricing** — a
real bps-additive build-up (`totalSpr = baseSpr + physPrem + transPrem + carbonPrem`
with scenario multipliers, an interest calculation, RWA multiplier, and portfolio
climate VaR). Evolution A: step zero is the guide rewrite (the ETS/VCM methodology
belongs to the carbon-market modules); the deepening is calibration — the premium
coefficients (25bps physical cap, 35bps transition cap, the 0.08 carbon-price slope,
the five scenario multipliers) are asserted constants, and the honest next rung is
benchmarking them against observable spread evidence: published studies of
climate-risk pricing in loan/bond spreads and the platform's own sector-spread data
where available.

**How.** (1) Guide rewrite + atlas regeneration. (2) Coefficient table
`ref_climate_spread_calibration(channel, sector, coefficient, source)` — where
empirical anchors exist (e.g. brown-vs-green bond spread differentials by sector),
cite them; where they don't, label the coefficient as expert-set and show sensitivity
bands instead of point precision. (3) The 9-sector `BORROWER_SECTORS` seed retained
as fixtures with the physRisk/transRisk scores documented as illustrative.

**Prerequisites (hard).** Identity fix first — a copilot or user reading the current
guide expects carbon prices and gets loan spreads. **Acceptance:** the guide matches
the code; each premium coefficient carries a source or an explicit "expert-set" label
with a sensitivity range; a fixture borrower's spread decomposes to the bps exactly.

### 9.2 Evolution B — Loan-pricing copilot (LLM tier 1 → 2)

**What.** A copilot for relationship bankers: "why is this steel borrower paying
62bps of climate premium?" (decomposition into physical/transition/carbon terms with
the scenario multiplier named), "what happens to the spread under Delayed Transition
at $120 carbon?" (re-run `calcClimateSpread` client-side — no backend routes exist),
"how does the climate add-on flow into annual interest and RWA?" — all mechanics the
code genuinely implements.

**How.** Tier 1: corrected atlas record as corpus, live borrower table and scenario
selection as context. Tier 2: tool schema over `calcClimateSpread` and the portfolio
VaR function; validator ties every bps and dollar figure to invocations; calibration
caveats from Evolution A surface in prose ("transition premium uses an expert-set
coefficient") rather than being laundered into false precision.

**Prerequisites (hard).** Guide rewrite before corpus embedding; Evolution A's
calibration labels so the copilot can represent uncertainty honestly. **Acceptance:**
a spread decomposition sums to the displayed total; the copilot states coefficient
provenance when asked "how reliable is this premium?"; carbon-market questions are
redirected to the ETS/VCM modules.