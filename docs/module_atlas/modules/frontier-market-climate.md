# Frontier & SIDS Climate
**Module ID:** `frontier-market-climate` · **Route:** `/frontier-market-climate` · **Tier:** B (frontend-computed) · **EP code:** EP-CJ6 · **Sprint:** CJ

## 1 · Overview
39 small island developing states with sea level rise exposure, parametric insurance, debt-for-climate swaps, and blue economy opportunity.

**How an analyst works this module:**
- SIDS Vulnerability Index ranks 39 nations
- Parametric Insurance shows CCRIF/ARC/PCRIC coverage
- Debt Swap Modeler calculates fiscal space from conversion

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BLUE_ECONOMY`, `CARIBBEAN_HURRICANE`, `CCRIF_DATA`, `DEBT_SWAPS`, `PACIFIC_EXPOSURE`, `PARAMETRIC_INSURANCE`, `REFERENCES`, `SIDS_DATA`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SIDS_DATA` | 13 | `population`, `seaLevelRisk`, `gdp`, `debtGDP`, `coralDep`, `v20`, `hdi` |
| `PACIFIC_EXPOSURE` | 8 | `slr_1m`, `slr_05m`, `cyclone`, `drought`, `adaptation`, `cost` |
| `CARIBBEAN_HURRICANE` | 6 | `windSpeed`, `avgLoss`, `frequency`, `insurancePenetration` |
| `CCRIF_DATA` | 7 | `coverage`, `payouts`, `members`, `claims` |
| `DEBT_SWAPS` | 6 | `year`, `debtRestructured`, `conservationPledge`, `instrument`, `marineArea`, `savings` |
| `PARAMETRIC_INSURANCE` | 5 | `type`, `coverage`, `members`, `trigger`, `payoutSpeed`, `premiumRange` |
| `BLUE_ECONOMY` | 8 | `value`, `growth`, `sidsShare`, `potential` |
| `REFERENCES` | 7 | `title`, `url` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `badge` | `(c) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c + '18', color: c });` |
| `sortedSids` | `useMemo(() => [...SIDS_DATA].sort((a, b) => b[vulnerabilitySortBy] - a[vulnerabilitySortBy]), [vulnerabilitySortBy] );` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BLUE_ECONOMY`, `CARIBBEAN_HURRICANE`, `CCRIF_DATA`, `DEBT_SWAPS`, `PACIFIC_EXPOSURE`, `PARAMETRIC_INSURANCE`, `REFERENCES`, `SIDS_DATA`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| SIDS Count | — | UNDP | Small Island Developing States |
| Debt Swaps | — | TNC | Belize ($553M) and Ecuador ($1.6B) |

## 5 · Intermediate Transformation Logic
**Methodology:** Sovereign parametric insurance
**Headline formula:** `Payout = Trigger_exceeded × Coverage_amount (binary trigger)`

39 SIDS face existential sea level rise risk. Parametric insurance (CCRIF, ARC, PCRIC) provides rapid payouts without loss adjustment. Debt-for-climate swaps (Belize, Ecuador examples) reduce debt burden in exchange for conservation commitments.

**Standards:** ['CCRIF', 'ARC', 'PCRIC']
**Reference documents:** UNDP SIDS Data; World Bank Climate Debt Studies

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The Frontier Market & SIDS Climate module (EP-CJ6) is a **curated real-data reference dashboard**: real
Small Island Developing States with real HDI/debt/GDP figures, real parametric-insurance pools (CCRIF,
ARC, PCRIC, SEADRIF), real debt-for-nature swaps (Belize, Ecuador, Seychelles), and real hurricane
loss/frequency data. There is **no PRNG and no computed risk model** — the "calculation engine" is sort
and filter over hand-authored authoritative data. The guide's binary parametric-payout formula is
described but not executed; loss and payout figures are stored, not modelled (§8).

### 7.1 What the module computes

```js
sortedSids = [...SIDS_DATA].sort(desc by vulnerabilitySortBy)     // rank SIDS by chosen metric
// SLR scenario toggle switches the displayed column (slr_05m vs slr_1m)
// Debt-swap filter: show swaps ≥ debtSwapMin
```

That is the extent of the live logic. Every quantity displayed — sea-level-rise exposure, hurricane
average loss, CCRIF payouts, debt-swap amounts — is a stored constant.

### 7.2 Parameterisation / scoring rubric — curated real data

**SIDS data** (12 nations, real figures):

| Nation | SLR risk | Debt/GDP | Coral dep. | V20 | HDI |
|---|---|---|---|---|---|
| Tuvalu | 98 | 12% | 85% | yes | 0.641 |
| Maldives | 92 | 115% | 90% | yes | 0.747 |
| Barbados | 65 | 120% | 40% | no | 0.790 |
| Fiji | 78 | 82% | 60% | yes | 0.730 |

HDI and debt/GDP are accurate to UNDP/IMF data; V20 flags Vulnerable-20 group membership. **Hurricane
data** (Saffir–Simpson categories) carries realistic average loss ($0.5Bn Cat1 → $40Bn Cat5) and
frequency (8.2/yr Cat1 → 0.4/yr Cat5), plus falling insurance penetration by severity (35% → 8%).

**Parametric schemes** are the real regional pools: CCRIF SPC (25 members, 14-day payout, windspeed/
rain model), ARC (35 members, rainfall index), PCRIC (8 Pacific members), SEADRIF. **Debt-for-nature
swaps** are real deals: Belize 2021 TNC Blue Bond ($553M restructured, 30% ocean protected), Ecuador
2023 Galapagos ($1.6Bn), Seychelles 2018 (first blue bond). **CCRIF time series** (2019–24 coverage
$850M→$1,100M, payouts, members) matches published annual reports.

### 7.3 Calculation walkthrough

1. SIDS tab: sort by SLR/debt/coral/etc.; toggle SLR scenario column.
2. Pacific tab: per-nation SLR/cyclone/drought exposure + adaptation strategy + cost.
3. Caribbean tab: hurricane category loss/frequency/penetration.
4. Debt tab: filter and list debt-for-nature swaps.
5. Parametric tab: display the four pools' terms.
6. Blue economy tab: sector value/growth/SIDS share.

### 7.4 Worked example (implied hurricane AAL — not computed by the page)

The page *shows* the pieces for an annual-average-loss but never multiplies them. Doing so manually over
the Caribbean table:
```
AAL = Σ_cat avgLoss_cat × frequency_cat
    = 0.5·8.2 + 1.5·4.5 + 5.0·2.8 + 15.0·1.2 + 40.0·0.4
    = 4.1 + 6.75 + 14.0 + 18.0 + 16.0 = $58.85 Bn/yr expected regional loss
```
This AAL is the natural risk metric the parametric pools are sized against, but the module leaves the
components as separate display values rather than computing the loss-exceedance product.

### 7.5 Data provenance & limitations

- **All data is curated real-world reference data** (UNDP HDI, IMF debt, CCRIF/ARC reports, actual
  debt-swap deals) — a genuine strength; no synthetic seeding.
- **No risk model is executed** — parametric payouts, AAL, and debt sustainability are shown as inputs,
  not computed. The guide's `Payout = Trigger_exceeded × Coverage` binary model is not run.
- Sea-level-risk scores are hand-authored index values, not derived from an elevation/SLR model.

**Framework alignment:** parametric (index-based) sovereign insurance (CCRIF/ARC/PCRIC — payout on a
modelled hazard index, no loss adjustment, hence 14-day speed) · debt-for-nature/climate swaps (TNC Blue
Bond structure) · IMF Climate Debt Sustainability Analysis · AOSIS/V20 loss-and-damage framing · World
Bank Blue Economy. The reference content is accurate; the quantitative models are named but unbuilt here.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The page displays parametric-insurance and loss
inputs without computing payouts, AAL, or debt sustainability. Below is the production catastrophe +
parametric model.

### 8.1 Purpose & scope
Price sovereign parametric insurance and quantify SIDS climate-loss exposure and debt sustainability —
supporting risk-transfer structuring (CCRIF-style pools) and debt-for-climate swap sizing.

### 8.2 Conceptual approach
A **catastrophe loss-exceedance model** feeding a **parametric trigger/basis-risk** design, benchmarked
against **CCRIF SPC** and **Swiss Re / RMS** hurricane models, plus an **IMF-style debt-sustainability**
overlay linking climate shocks to debt/GDP dynamics.

### 8.3 Mathematical specification
```
AAL_c   = Σ_cat P(cat)·Loss(cat|c)                          expected annual loss per country c
Payout  = Coverage · payoutFunction(hazardIndex)            parametric: step or linear on index
BasisRisk = E[ |Payout − ActualLoss| ]                      quality of the parametric trigger
Premium = AAL·(1 + loadFactor) + riskCapitalCharge          actuarially fair + load
DebtDynamics: d_{t+1} = d_t·(1+r−g)/(1+g) + primaryDeficit_t + climateShock_t/GDP
   climateShock_t = AAL_c drawn/realised in year t
SwapSaving = (r_old − r_new)·principal − conservationPledge  debt-for-nature net benefit
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| P(cat), Loss(cat) | hazard frequency & severity | Swiss Re sigma / RMS / EM-DAT |
| hazardIndex | windspeed/rainfall trigger | CCRIF parametric model |
| loadFactor | insurer margin | reinsurance market (2–6% premium range) |
| r, g | interest & growth | IMF WEO country projections |
| conservationPledge | swap commitment | deal terms (Belize/Ecuador) |

### 8.4 Data requirements
Per country: exposure value, hazard frequency/severity curves, debt stock, interest/growth, existing
parametric coverage. Sources: EM-DAT, Swiss Re sigma, CCRIF (public), IMF WEO (public). SIDS table
already holds debt/GDP and exposure indices.

### 8.5 Validation & benchmarking plan
Reconcile AAL against CCRIF/Swiss Re published country losses; validate parametric payouts against
historical events (basis risk); backtest debt dynamics against realised debt/GDP; benchmark swap savings
against the actual Belize/Ecuador NPV.

### 8.6 Limitations & model risk
Parametric basis risk (payout ≠ loss) is inherent; SLR is deeply uncertain; small samples make frequency
estimation noisy. Conservative fallback: size coverage to the modelled AAL plus a basis-risk buffer and
stress debt dynamics under the worst hazard year.

## 9 · Future Evolution

### 9.1 Evolution A — Executable parametric-payout and debt-swap models over the curated data (analytics ladder: rung 1 → 2)

**What.** §7 credits this as a curated real-data reference dashboard — 39 SIDS with real HDI/debt/GDP, real parametric pools (CCRIF/ARC/PCRIC/SEADRIF), real debt-for-nature swaps (Belize/Ecuador/Seychelles), real hurricane loss data — but with no PRNG and no computed model: the "engine" is sort and filter, and the guide's binary parametric-payout formula (`Payout = Trigger_exceeded × Coverage`) plus the debt-swap fiscal-space calculator are named but unbuilt (loss/payout figures are stored inputs, sea-level-risk scores are hand-authored index values). Evolution A makes the two headline models executable: a parametric trigger simulator that computes payouts from a hazard index against coverage and attachment, and a debt-swap modeler that computes fiscal space freed (`debt_restructured × (old_rate − new_rate)` and conservation-pledge sizing) rather than displaying stored deal outcomes.

**How.** (1) A payout function over the CCRIF/ARC index structure: given a modelled hazard index and the pool's trigger/exhaustion points, compute the binary/graduated payout. (2) A debt-swap calculator taking haircut, tenor, and coupon reduction to output annual fiscal space and NPV of savings. (3) Optionally ground sea-level-risk scores in an elevation/SLR dataset rather than the hand-authored index.

**Prerequisites.** The curated reference data stays authoritative (a strength, not to be discarded); a hazard-index input source for payout simulation. **Acceptance:** changing the trigger threshold or coverage changes the computed payout; the debt-swap modeler's fiscal-space output reproduces its formula from inspectable inputs — not a stored deal figure.

### 9.2 Evolution B — SIDS climate-finance advisory copilot (LLM tier 1 → 2)

**What.** A copilot for DFI and sovereign-risk users: "for this Pacific SIDS, what parametric coverage and debt-swap structure would close its adaptation-finance gap?" Tier-1 narrates the real SIDS vulnerability, pool membership, and precedent swaps from the atlas corpus; tier-2 runs the Evolution A payout and debt-swap models to size instruments.

**How.** Tier 1 is unusually credible here because §7 confirms the underlying data is accurate authoritative reference content (UNDP/IMF/CCRIF/actual deals) — the copilot cites real pools and precedent transactions. Its guardrail: pre-Evolution-A it must present loss/payout figures as stored reference values, not model outputs, and refuse "what would our payout be" as a computation. Tier 2 tool-calls the payout/debt-swap endpoints so instrument sizing is engine-computed.

**Prerequisites.** Evolution A for quantitative sizing; corpus embedding. **Acceptance:** every SIDS statistic cited traces to the curated reference data; post-Evolution-A, payout and fiscal-space figures trace to tool calls; pre-Evolution-A the copilot declines to compute payouts and points to precedent deals instead.