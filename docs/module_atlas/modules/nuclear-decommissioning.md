# Nuclear Decommissioning Finance
**Module ID:** `nuclear-decommissioning` · **Route:** `/nuclear-decommissioning` · **Tier:** B (frontend-computed) · **EP code:** EP-DU4 · **Sprint:** DU

## 1 · Overview
Financial analytics for nuclear decommissioning covering unit cost ranges, segregated fund adequacy, cost escalation drivers, SAFDM vs DECON strategy comparison and NDF/NDA fund performance.

> **Business value:** Nuclear decommissioning costs range $500M–$8B per unit; fund adequacy ratios below 100% signal material balance sheet risk, with cost escalation driven by labour and low-level waste disposal at 2–4% real annually.

**How an analyst works this module:**
- Estimate total decommissioning liability using reference-unit cost benchmarks
- Calculate present value using site-specific discount rate (real 2–4%)
- Compare fund asset NAV to PV liability to derive adequacy ratio
- Assess SAFDM vs DECON strategy timing impact on NPV cost

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COST_DRIVERS`, `DD_STRATEGIES`, `GLOBAL_PLANTS`, `KpiCard`, `NDA_SITES`, `Slider`, `TABS`, `US_DOE_SITES`, `WASTE_STREAMS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `GLOBAL_PLANTS` | 9 | `operable`, `shutdown`, `decom_started`, `decom_complete`, `totalGW`, `fundBnUSD` |
| `DD_STRATEGIES` | 5 | `abbr`, `duration`, `costMult`, `wasteVol`, `risk`, `bestFor` |
| `COST_DRIVERS` | 9 | `pct` |
| `NDA_SITES` | 6 | `type`, `est_cost_bn`, `status`, `completion`, `country` |
| `US_DOE_SITES` | 6 | `type`, `cost_bn`, `status`, `endYr`, `volume` |
| `WASTE_STREAMS` | 5 | `vol_m3`, `activity_PBq`, `disposal` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `baseCost` | `reactorType === "LWR" ? reactorMw * 600 :` |
| `deferredPV` | `baseCost * stratMult / Math.pow(1 + wacc / 100, yearsDeferred);` |
| `nominalCost` | `baseCost * stratMult;` |
| `pvDecom` | `estimatedDecom / Math.pow(1 + w, yearsToDecom);` |
| `decommResult` | `useMemo(() => calcDecommCost({ reactorMw, reactorType, strategy, yearsDeferred, wacc }), [reactorMw, reactorType, strategy, yearsDeferred, wacc]); const fundResult = useMemo(() => calcFundAdequacy({ plantMw: reactorMw, cf: 90, annualFund: annualFund * 1e6, wacc, yearsToDecom, estimatedDecom: decommResult.nominalCost * 1e6 }), [reactorMw, ` |
| `costDriverPie` | `COST_DRIVERS.map((d, i) => ({ ...d, fill: COLORS[i] }));` |
| `fundBuildupData` | `useMemo(() => Array.from({ length: yearsToDecom }, (_, i) => { const w = wacc / 100;` |
| `globalFundData` | `GLOBAL_PLANTS.map(p => ({` |
| `safstor` | `useMemo(() => Array.from({ length: 60 }, (_, i) => ({ year: i, dose: +(1000 * Math.exp(-0.04 * i)).toFixed(1), cost: +(decommResult.nominalCost * 0.85 / Math.pow(1 + wacc / 100, i)).toFixed(1), })), [decommResult, wacc]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `COST_DRIVERS`, `DD_STRATEGIES`, `GLOBAL_PLANTS`, `NDA_SITES`, `TABS`, `US_DOE_SITES`, `WASTE_STREAMS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Unit Decommissioning Cost | `DCost = Labour + Waste Disposal + Engineering + Contingency` | NDA UK / NRC US Cost Studies | Wide range reflects reactor type, site complexity, waste classification and national labour costs. |
| Fund Adequacy Ratio | `FAR = PV(Assets) / PV(Liability)` | NRC 10 CFR 50.75 | Regulatory benchmark; sub-100% funds require remediation plans. |
| Cost Escalation Factor | `Escalation = Labour CPI × 0.6 + Waste Disposal Inflation × 0.4` | IAEA TRS-429 | Labour and low-level waste disposal dominate escalation above general inflation. |
- **NDA/NRC cost benchmarks + fund NAV data** → Liability PV model → fund adequacy gap analysis → **Decommissioning financial assurance dashboard**

## 5 · Intermediate Transformation Logic
**Methodology:** Fund Adequacy Ratio
**Headline formula:** `FAR = PV(Fund Assets) / PV(Estimated Decommissioning Cost)`

Ratio of discounted fund assets to discounted liabilities; regulatory minimum typically 100%.

**Standards:** ['IAEA Financing of Decommissioning (2007)', 'NRC Financial Assurance Regulations 10 CFR 50.75']
**Reference documents:** IAEA — Financing of Decommissioning of Nuclear Installations (2007); NDA UK — Annual Report and Accounts; NRC — Decommissioning Financial Assurance Guidance (2012)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Probabilistic fund adequacy with real fund/liability data (analytics ladder: rung 1 → 4)

**What.** §7 confirms this module matches its guide well: the Fund Adequacy Ratio (`FAR = fundAtDecom / estimatedDecom`) is a real two-function engine — future value of an annuity for fund growth, discounted PV for liability, with reactor-class cost-per-MW ($600–800k/MW) and strategy multipliers (DECON 1.0 / SAFSTOR 0.85 / ENTOMB 0.5). The limitation is that FAR is a single deterministic point estimate off user sliders, and the plant/fund figures are static hand-authored constants. Evolution A adds uncertainty and grounds the data.

**How.** (1) Make cost escalation and fund-return stochastic: the guide itself names 2–4% real cost escalation and the FV depends on `annualFund` growth — run a Monte Carlo over escalation and return distributions to produce a FAR *distribution* and a probability-of-shortfall, not one number (the platform's `monte_carlo_engine` is reusable here). This is the rung-4 predictive step. (2) Replace `GLOBAL_PLANTS`/`NDA_SITES`/`US_DOE_SITES` static constants with a `decom_funds` reference table sourced from NRC decommissioning-funding-status filings and NDA annual accounts (both public, named in §5), so per-site FAR reflects real reported fund NAV vs liability. (3) Cite the strategy multipliers to a specific IAEA/NRC study rather than leaving them directionally-correct-but-unsourced (§7.2 flags this).

**Prerequisites.** NRC/NDA data ingestion; escalation/return distribution parameters documented per Atlas §8. **Acceptance:** FAR reports a confidence band and shortfall probability, not a point; a real site's FAR reconciles to its NRC-filed funding status; multipliers carry citations.

### 9.2 Evolution B — Decommissioning-liability copilot for fund managers (LLM tier 1 → 2)

**What.** A copilot answering "is this plant's fund adequate?", "how does deferring to SAFSTOR change the NPV cost?", "what discount rate makes the fund fully funded?" — grounded in the real FAR engine and (post-Evolution-A) real NRC/NDA fund data. The deterministic engine is transparent enough that explanations decompose cleanly into the FV-annuity and PV-liability terms.

**How.** Tier 1 explains the current computed FAR by walking the two formulas with the user's slider values. Tier 2 executes what-ifs as tool calls: strategy switches (DECON→SAFSTOR recomputes `stratMult` and deferred PV), discount-rate solves ("what WACC gives FAR=100%?" as an inverse solve), and — post-Evolution-A — Monte Carlo shortfall-probability queries. Fabrication validator matches every ratio and cost to a tool response; the copilot must distinguish nominal from PV figures explicitly (a common decommissioning-finance confusion) and refuse regulatory-compliance verdicts ("is this NRC-compliant?") beyond reporting the FAR against the 100% guideline.

**Prerequisites.** Tier 1 works on the current engine; real-data answers and shortfall probabilities need Evolution A. **Acceptance:** every FAR/cost figure traces to a tool call; strategy/discount what-ifs recompute rather than estimate; "is this compliant?" returns the FAR-vs-100% comparison with a scope disclaimer.