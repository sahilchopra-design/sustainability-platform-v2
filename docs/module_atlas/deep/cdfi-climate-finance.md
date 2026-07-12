## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide specifies a **Climate Equity Score** composite
> `= 0.4·LMI Rate + 0.3·Environmental Justice + 0.3·Energy Burden Reduction` and an "LMI Targeting
> Rate" formula. **Neither composite is computed in the code.** The only real calculations are a
> **New Markets Tax Credit (NMTC) benefit** (39% credit) and a simple climate-multiplier. Everything
> else is display of hard-coded (real-named) CDFI/program tables plus an `sr()`-seeded deal pipeline
> and lending trend. The EJSCREEN/energy-burden logic the guide describes is a §8 candidate. Code below.

### 7.1 What the module computes

**NMTC benefit** (`calcNmtcBenefit`):
```
QEI          = projectCost                         // qualified equity investment
creditTotal  = QEI · taxCreditRate (0.39)          // 39% NMTC credit over 7 yr
subsidy      = creditTotal
netProjectCost = projectCost − subsidy
leverage     = projectCost / max(investorEquity, 1)
```

**Climate multiplier** (`calcClimateMultiplier`):
`= loanAmount · avgEmissionsReductionTperLoan / 1e6` (MtCO₂e per $ of lending).

**Portfolio aggregates:** `totalAum = Σ CDFIS.aum`, `totalJobs = Σ CDFIS.jobs`,
`avgClimate = mean(CDFIS.climate)`, `climateDeployment = portfolioAum · climateAlloc%`.

### 7.2 Parameterisation / data rubric

| Element | Value | Provenance |
|---|---|---|
| NMTC credit rate | 39% over 7 yr | US IRC §45D / CDFI Fund — real |
| CDFI roster (OFN, Self-Help, LIIF, Enterprise, Reinvestment Fund…) | AUM, climate %, LMI share, jobs | Hard-coded **real institutions**, realistic AUM |
| NMTC / climate programs (IRA GGRF $6B, CDFI Fund, SSBCI, DOE LPO) | annual allocation, leverage | Hard-coded **real federal programs** |
| Capital stack | Senior 55% @5.8%, CDFI sub 20% @4.2%, NMTC equity 15%, grant 7%, borrower 3% | Hard-coded typical CDFI structure |
| Deal pipeline (size, climate, LMI, stage) | `sr()`-seeded | **Synthetic** PRNG demo data |
| Lending trend 2020–2025 | `sr()`-seeded | **Synthetic** |

### 7.3 Calculation walkthrough

The NMTC calculator takes a project cost and investor equity, applies the 39% credit to derive the
subsidy and net project cost, and reports the leverage ratio. Portfolio KPIs reduce the real CDFI
roster (AUM, jobs, average climate allocation). The user's `climateAlloc%` slider scales portfolio
AUM into a climate-deployment figure. The deal-pipeline and lending-trend tabs are `sr()`-generated
illustrations. No LMI-targeting-rate or climate-equity composite is computed despite the tabs.

### 7.4 Worked example (NMTC benefit)

`projectCost = $10M`, taxCreditRate = 0.39, investorEquity = $2.5M:
- `creditTotal = 10M · 0.39 = $3.9M`
- `subsidy = $3.9M`; `netProjectCost = 10M − 3.9M = $6.1M`
- `leverage = 10M / 2.5M = 4.0×`

So the 39% NMTC credit effectively subsidises 39% of the project cost — matching the guide's note
that CDFIs leverage ~$8–12 of private capital per $1 of CDFI Fund award (the leverage here is on the
QEI basis, a different denominator).

### 7.5 Data provenance & limitations
- CDFI roster and federal-program tables are **real, hard-coded** reference data (not PRNG); AUM/jobs
  are realistic named-institution figures.
- Deal pipeline and lending trend are **synthetic `sr()`-seeded** demo data.
- No EJSCREEN, FFIEC census-tract, or ACEEE energy-burden integration — the LMI-targeting and
  climate-equity scores the guide describes are not implemented.
- NMTC calc is a single-credit snapshot; it does not model the 7-year credit schedule, recapture
  risk, or the leverage/QLICI structure of a full NMTC transaction.

**Framework alignment:** **Treasury CDFI Fund certification** (≥60% activity in LMI) and **IRC §45D
NMTC** (39% credit) — the NMTC benefit is a faithful, if simplified, implementation. **EPA EJSCREEN**,
**DOE Justice40** (40% of clean-energy benefits to disadvantaged communities), and **ACEEE energy
burden** are named as data sources for the equity score but not wired in (see §8). **IRA Greenhouse
Gas Reduction Fund** is surfaced as a program row.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The module displays a "Climate Equity Score"
and "LMI Targeting Rate" without computing them.

**8.1 Purpose & scope.** Score a CDFI's climate-finance portfolio on distributional equity — how much
targets LMI/disadvantaged communities and reduces low-income energy burden — for CDFI Fund
certification support and Justice40 reporting. Coverage: loan-level climate portfolio.

**8.2 Conceptual approach.** A weighted equity-impact index combining (a) geographic LMI targeting
(FFIEC/CDFI Fund census-tract designations), (b) cumulative environmental burden (EPA **EJSCREEN**
percentiles), and (c) modelled energy-burden reduction (ACEEE). Mirrors DOE **Justice40** benefit
accounting and the CDFI Fund's Target Market activity test.

**8.3 Mathematical specification.**
```
LMI_rate = Σ_loans loan_amt·1[tract ∈ LMI] / Σ_loans loan_amt · 100
EJ_score = mean over disadvantaged loans of EJSCREEN_percentile(tract)    // 0–100
EnergyBurdenReduction (pp of income):
  ΔEB_loan = (pre_energy_cost − post_energy_cost)/household_income · 100
  EBR = weighted mean ΔEB over financed households
ClimateEquityScore = 0.4·(LMI_rate/100) + 0.3·(EJ_score/100) + 0.3·norm(EBR)   → ×100
```
| Parameter | Value | Source |
|---|---|---|
| Weights | 0.4 / 0.3 / 0.3 | Guide (judgemental) |
| LMI threshold | ≤80% AMI | CDFI Fund / FFIEC |
| EJSCREEN percentile | per tract | EPA EJSCREEN |
| Baseline energy burden | 8–10% (LMI) vs 3% (national) | ACEEE |
| ΔEB per intervention | 2–5 pp | ACEEE clean-energy impact studies |

**8.4 Data requirements.** Loan-level: amount, borrower census tract, project type, pre/post energy
cost, household income. Sources: FFIEC census-tract file, EPA EJSCREEN API, ACEEE burden tables. The
platform holds the CDFI roster; tract-level joins are new.

**8.5 Validation & benchmarking plan.** Confirm LMI_rate reproduces the CDFI's reported Target Market
activity %; benchmark EJ coverage against DOE's Justice40 disadvantaged-community map; sanity-check
EBR against ACEEE observed reductions.

**8.6 Limitations & model risk.** EJSCREEN is a screening (not causal) tool; energy-burden reduction
is modelled, not metered, so is uncertain. Weights are judgemental. Conservative fallback: report the
three components separately and flag any composite driven mainly by the modelled (least-observed) EBR
term.
