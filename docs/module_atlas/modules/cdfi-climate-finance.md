# CDFI Climate Finance Analytics
**Module ID:** `cdfi-climate-finance` · **Route:** `/cdfi-climate-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DY6 · **Sprint:** DY

## 1 · Overview
CDFI climate finance analytics covering equity-focused climate finance targeting LMI communities, green home improvement lending, clean energy access metrics, and Treasury CDFI Fund certification requirements.

> **Business value:** Enables CDFI climate finance portfolio analytics integrating LMI targeting compliance, environmental justice screening, and energy burden reduction measurement to demonstrate climate equity impact.

**How an analyst works this module:**
- Map CDFI lending portfolio to LMI census tracts using FFIEC and CDFI Fund geographies
- Calculate LMI targeting rate and environmental justice screening using EPA EJSCREEN scores
- Model energy burden reduction impact from green home improvement and clean energy loan products
- Assess Treasury CDFI Fund certification compliance and IRA new market tax credit eligibility

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CAPITAL_STACK`, `CDFIS`, `CLIMATE_PROGRAMS`, `Kpi`, `NMTC_PROGRAMS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CDFIS` | 9 | `name`, `aum`, `focus`, `climate`, `nmtcAlloc`, `lmiShare`, `loanType`, `greenScore`, `jobs`, `founded` |
| `NMTC_PROGRAMS` | 7 | `annualAlloc`, `leverage`, `benefit`, `eligibility`, `climateUse` |
| `CLIMATE_PROGRAMS` | 7 | `amount`, `focus`, `status`, `returnType` |
| `CAPITAL_STACK` | 6 | `typical`, `rate`, `security`, `provider` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `netProjectCost` | `projectCost - subsidy;` |
| `nmtc` | `calcNmtcBenefit({ projectCost: projectCost * 1e6, taxCreditRate: 0.39, investorEquity: investorEquity * 1e6 });` |
| `totalAum` | `CDFIS.reduce((s, c) => s + c.aum, 0);` |
| `totalJobs` | `CDFIS.reduce((s, c) => s + c.jobs, 0);` |
| `avgClimate` | `CDFIS.length ? CDFIS.reduce((s, c) => s + c.climate, 0) / CDFIS.length : 0;` |
| `climateDeployment` | `(portfolioAum * climateAlloc / 100).toFixed(0);` |
| `pipelineData` | `useMemo(() => Array.from({ length: 8 }, (_, i) => ({ deal: `Deal ${i + 1}`, size: Math.round(sr(i * 17) * 45 + 5), climate: Math.round(sr(i * 23) * 80 + 20), lmi: Math.round(sr(i * 31) * 15 + 80), stage: ['Screening', 'Underwriting', 'Approved', 'Closed'][Math.floor(sr(i * 7) * 4)], })), []);` |
| `lendingTrend` | `useMemo(() => [2020, 2021, 2022, 2023, 2024, 2025].map((yr, i) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CAPITAL_STACK`, `CDFIS`, `CLIMATE_PROGRAMS`, `NMTC_PROGRAMS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| LMI Climate Finance Targeting Rate | `Climate loans to LMI census tracts / total climate portfolio × 100` | CDFI annual report to Treasury CDFI Fund | Treasury CDFI certification requires 60%+ activity in LMI; leading climate CDFIs achieve 80-95% |
| Energy Burden Reduction | `Pre-investment energy cost as % income minus post-investment energy cost % income` | ACEEE low-income energy burden data | Average LMI energy burden 8-10% vs 3% national avg; clean energy investment reduces by 2-5 percentage points |
| Treasury CDFI Award per $ | `Treasury CDFI Fund award / total financing catalysed` | CDFI Fund award announcement database | CDFIs leverage $8-12 of private capital per $1 CDFI Fund award; climate focus may achieve higher leverage via IRA |
- **FFIEC census tract data and CDFI Fund mapping** → LMI census tract designations → portfolio targeting rate calculation → **LMI compliance and CDFI certification support**
- **EPA EJSCREEN scores by census tract** → Environmental justice indicators (pollution burden, demographics) → EJ screening for loan targeting → **Environmental justice co-benefit measurement**
- **ACEEE low-income energy burden database** → Pre-investment energy burden by geography and housing type → impact measurement baseline → **Energy burden reduction outcome tracking**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Equity Finance Targeting
**Headline formula:** `LMI Targeting Rate = LMI-targeted climate loans / total climate portfolio × 100; Climate Equity Score = 0.4×LMI Rate + 0.3×Environmental Justice + 0.3×Energy Burden Reduction`

Composite scoring of climate finance equity impact combining LMI community targeting, environmental justice co-benefits, and energy burden reduction for low-income households

**Standards:** ['Treasury CDFI Fund Certification Standards 2024', 'EPA Environmental Justice Screening Tool (EJSCREEN)', 'DOE Justice40 Initiative Guidelines']
**Reference documents:** Treasury CDFI Fund (2024) CDFI Certification Application and Standards; EPA (2023) EJSCREEN Environmental Justice Screening and Mapping Tool; DOE (2022) Justice40 Initiative — Clean Energy Equity Framework; ACEEE (2023) The High Cost of Energy in Rural America — Low-Income Energy Burden Report

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Compute the Climate Equity Score from real EJSCREEN data (analytics ladder: rung 1 → 2)

**What.** §7 flags the gap precisely: the guide advertises
`Climate Equity Score = 0.4·LMI Rate + 0.3·Environmental Justice + 0.3·Energy Burden
Reduction` plus an LMI Targeting Rate, but the code computes only an NMTC 39% benefit
and a trivial climate multiplier — the rest is display of hard-coded CDFI tables plus
an `sr()`-seeded deal pipeline. Evolution A implements the advertised composite on
public data the guide itself names: EPA EJSCREEN tract-level percentiles (public CSV),
FFIEC LMI tract designations, and DOE/ACEEE energy-burden estimates, joined to a
portfolio of loans geocoded to census tracts.

**How.** (1) `ref_ej_tracts(tract_geoid, ej_percentile, lmi_flag, energy_burden_pct)`
reference table from the EJSCREEN + FFIEC public files (a bounded, annual-refresh
ingest). (2) LMI Targeting Rate and the weighted composite as pure functions over a
`cdfi_loans` table (the module's first backend vertical — loan amount, product type,
tract). (3) Delete the `sr()`-seeded pipeline/trend series — the platform guardrail
treats seeded-random-as-data as a defect — replacing them with aggregates over real or
honestly-labelled fixture loans.

**Prerequisites.** The seeded-random series removal is non-negotiable before the score
ships; EJSCREEN vintage pinned (EPA revises annually and has altered availability —
mirror the file). **Acceptance:** a fixture portfolio with known tract mix reproduces a
hand-computed equity score; moving one loan from a non-LMI to an LMI tract moves the
LMI rate by exactly its portfolio weight.

### 9.2 Evolution B — CDFI impact-narrative copilot (LLM tier 1)

**What.** A copilot for certification and impact questions: "does this portfolio meet
Treasury CDFI Fund target-market thresholds?", "explain our NMTC leverage structure"
(the real 39%-credit calculation on page), "which programs in the `CLIMATE_PROGRAMS`
table fit a green-home-improvement strategy?" — grounded in this atlas record, the §5
standards (Treasury CDFI certification 2024, Justice40), and, post-Evolution A, the
computed equity score.

**How.** Tier-1 pattern: atlas record and reference tables as corpus; NMTC answers
walk the actual `calcNmtcBenefit` arithmetic (QEI × 0.39, leverage ratio); threshold
questions cite the certification standard text and compare against computed portfolio
rates — comparison narration, not new math.

**Prerequisites (hard).** Evolution A first for any equity-score claim — today the
score exists only in the guide, and a copilot citing it would be describing vaporware.
**Acceptance:** every percentage in a certification answer traces to a computed
portfolio aggregate or a cited standard threshold; asked to forecast NMTC allocation
awards, the copilot refuses.