## 7 · Methodology Deep Dive

This module **matches its MODULE_GUIDES entry well**. The Fund Adequacy Ratio formula
(`FAR = PV(Fund Assets) / PV(Liability)`) and the cost-escalation framing are implemented as a real
two-function financial engine, fed by a mix of static facility-level reference data (several figures
match well-known public cost estimates) and a small number of user-adjustable sliders.

### 7.1 What the module computes

Two pure functions drive the interactive "Cost Modelling" and "Fund Adequacy" tabs:

```js
// Decommissioning cost
baseCost   = reactorMw × (LWR:600k | GCR:800k | CANDU:650k | other:700k)   // $/MW by reactor class
stratMult  = DECON:1.0 | SAFSTOR:0.85 | ENTOMB:0.5 | Hybrid:0.92
nominalCost = baseCost × stratMult
deferredPV  = nominalCost / (1+WACC)^yearsDeferred

// Fund adequacy
fundAtDecom = annualFund × [((1+WACC)^yearsToDecom − 1) / WACC]           // future value of an ordinary annuity
pvDecom     = estimatedDecom / (1+WACC)^yearsToDecom
gap         = fundAtDecom − estimatedDecom
FAR (%)     = fundAtDecom / estimatedDecom × 100
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| LWR/GCR/CANDU/other cost-per-MW | $600k / $800k / $650k / $700k | Order-of-magnitude consistent with IAEA/NRC unit-cost studies (guide cites $500M–$8B per unit, i.e. $500k–$8M/MW for a ~1,000 MW unit — the code's $600–800k/MW sits at the lower end of that band) |
| `stratMult` by D&D strategy | DECON 1.0, SAFSTOR 0.85, ENTOMB 0.5, Hybrid 0.92 | Directionally correct (deferred/entombed strategies cost less in nominal terms due to radioactive decay reducing worker-dose mitigation needs) but not cited to a specific IAEA/NRC study |
| `GLOBAL_PLANTS` (8 countries) | operable/shutdown/decom-started/complete counts, total GW, decommissioning fund $bn | Static reference data; UK's £132bn (~$132bn) fund figure and US's $60bn are broadly consistent with NDA/NRC public reporting orders of magnitude |
| `NDA_SITES` (5 UK sites) | Sellafield $121bn est. cost to 2120, Magnox $6.3bn, Dounreay $4.3bn | **Matches real, widely reported NDA lifetime cost estimates** (Sellafield's headline "£100bn+" figure is a standard citation in UK nuclear-liability reporting) |
| `US_DOE_SITES` (5 sites) | Hanford $379bn to 2077, Savannah River $95bn | **Matches real GAO/DOE Environmental Management cost estimates** (Hanford's ~$300–600bn lifecycle range is the standard cited figure in US federal cost reports) |
| `COST_DRIVERS` (8-way cost breakdown) | Reactor Disassembly 25%, Radioactive Waste Processing 20%, Waste Packaging & Transport 15%, … (sums to 100%) | Plausible allocation, not cited to a specific source |

### 7.3 Calculation walkthrough

1. User sets reactor size (MW), reactor type, D&D strategy, deferral years, and WACC.
2. `calcDecommCost` computes nominal (today's-dollars) and deferral-discounted decommissioning cost
   from the per-MW base rate × strategy multiplier — a straightforward single-cashflow PV, not a
   detailed bottom-up estimate.
3. `calcFundAdequacy` treats the utility's annual contribution as an **ordinary annuity**
   compounding at WACC to the decommissioning date, then compares its future value to the estimated
   liability (itself taken from `decommResult.nominalCost`) to derive the funding gap and FAR%.
4. The **SAFSTOR radiological decay curve** (`safstor`, 60-year projection) applies
   `dose = 1000 × e^(−0.04×year)` — an exponential decay consistent with the general shape of
   short/medium-lived isotope (mainly Co-60, ~5.3yr half-life ≈ λ≈0.13; the code's λ=0.04 corresponds
   to a longer effective half-life ≈17yr, closer to a mixed fission/activation product decay blend)
   — a simplified single-exponential proxy, not a full radionuclide inventory decay model.
5. Static tables (`NDA_SITES`, `US_DOE_SITES`, `WASTE_STREAMS`, `GLOBAL_PLANTS`) populate the
   non-interactive tabs with reference figures that are not recomputed from the sliders.

### 7.4 Worked example

Default sliders: `reactorMw=1000`, `reactorType="LWR"`, `strategy="DECON"`, `yearsDeferred=0`,
`wacc=5%`, `annualFund=$15M`, `yearsToDecom=20`:

| Step | Computation | Result |
|---|---|---|
| `baseCost` | 1000 × $600,000/MW | $600,000,000 |
| `stratMult` (DECON) | 1.0 | — |
| `nominalCost` | $600M × 1.0 | **$600.0M** (`decommResult.nominalCost` displayed) |
| `perMw` | $600M / 1000 / 1000 | **$0.60M/MW** |
| `deferredPV` (0yr deferral) | $600M / 1.05⁰ | $600.0M (unchanged, no deferral) |
| `fundAtDecom` | $15M × [(1.05²⁰−1)/0.05] | $15M × 33.066 = **$495.99M** |
| `pvDecom` | $600M / 1.05²⁰ | $600M / 2.6533 = **$226.13M** |
| `gap` | $495.99M − $600M | **−$104.0M** (fund shortfall) |
| `FAR` | $495.99M / $600M × 100 | **≈82.7%** |

At these defaults the illustrative utility is **under-funded relative to a 100% FAR target**
(NRC's 10 CFR 50.75 regulatory benchmark) — a realistic outcome given a $15M/yr contribution against
a $600M liability over only 20 years at 5% WACC; the tool would flag this gap for a remediation plan
under the cited NRC guidance.

### 7.5 Data provenance & limitations

- The financial-engine formulas (annuity future value, single-cashflow PV) are textbook-correct and
  match the guide's stated FAR methodology.
- Several static reference figures (Sellafield, Hanford, Savannah River costs) are **genuinely
  consistent with real published NDA/DOE/GAO cost estimates** — this is one of the platform's better
  provenance stories among the nuclear-cluster modules.
- The cost-per-MW base rates and strategy multipliers are reasonable engineering approximations but
  not individually cited — treat as illustrative, not audit-grade.
- The SAFSTOR dose-decay curve is a single-exponential simplification; a real radiological safety
  case requires a multi-isotope inventory decay model (Co-60, Cs-137, Ni-63, etc., each with
  different half-lives), not a single λ.
- No `sr()` PRNG anywhere in this module — all numbers are deterministic functions of user inputs or
  fixed reference constants, giving it more reproducibility than the platform's PRNG-heavy peers.

**Framework alignment:** IAEA *Financing of Decommissioning of Nuclear Installations* (2007) — cost
driver categories and D&D strategy comparison (SAFSTOR/DECON/ENTOMB) match IAEA's standard
terminology · NRC 10 CFR 50.75 — the 100%-FAR regulatory benchmark is correctly implied by the
`funded%` output, though the code does not hard-flag sub-100% funds with a remediation-plan
requirement · UK NDA / US DOE Environmental Management — site-level cost figures are consistent with
these agencies' own public reporting.
