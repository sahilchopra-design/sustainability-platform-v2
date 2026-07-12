# Wind Repowering & Life Extension Intelligence
**Module ID:** `wind-repowering-intelligence` · **Route:** `/wind-repowering-intelligence` · **Tier:** B (frontend-computed) · **EP code:** EP-DR6 · **Sprint:** DR

## 1 · Overview
Decision analytics for onshore wind repowering and life extension investments. Covers incremental IRR of repowering vs continuing operations, AEP uplift from larger rotor diameter, grid connection re-use value, brownfield vs greenfield NPV comparison, decommissioning economics, country-specific permitting regimes, and full project finance for repowered assets across 18 analytical tabs.

> **Business value:** Designed for wind energy asset managers, infrastructure fund portfolio managers, and developers evaluating the 15,000+ MW of ageing onshore wind assets globally reaching end of design life in 2024–2030. Provides the full decision analytics for repowering — from incremental IRR calculation and AEP uplift quantification through grid re-use value, decommissioning economics, country permitting pathways, and project finance — enabling data-driven repower vs extend vs decommission decisions.

**How an analyst works this module:**
- Enter existing fleet parameters in the left panel: number of old turbines, rating kW, age, current CF%, and remaining permit life; configure repowering strategy (Full/Partial/Life Extension/Hybrid)
- Select new turbine rating and hub height in the left Repowering Strategy panel; AEP uplift calculation updates in the "AEP Uplift" tab showing gross and net generation improvement
- Open "Overview" tab for the decision recommendation card (Repower Now / Extend Life / Wait / Decommission) based on incremental IRR vs hurdle rate and permit status
- Navigate to "Repowering Economics" tab for the full CAPEX vs NPV(future revenue) comparison: old fleet NPV, new fleet NPV, incremental NPV, and incremental IRR calculation
- Check "Full vs Partial Repower" tab for the decision matrix by turbine performance tier; "Life Extension" tab shows 5/10/15yr extension NPV vs repowering alternative with structural certification requirements
- Open "Grid Re-use Value" tab for existing grid connection value quantification: avoided new connection cost, queue position benefit, and grid congestion relief value
- Navigate "Revenue Bridge" for the cash flow waterfall: current revenue → lost during construction → new revenue → net incremental revenue; "Permitting & Regulatory" tab shows country-specific fast-track regimes
- Review "Environmental" tab for net environmental benefit (fewer larger turbines = lower bird risk, smaller footprint); "Construction Planning" for repowering campaign timeline and crane mobilization cost
- Check "Financial Model" for the 20-year project P&L and "IRR vs Brownfield NPV" for the breakeven analysis: minimum PPA price / CF% for positive incremental IRR; optimal timing sensitivity
- Review "Case Studies" for 8 repowering comparables (Germany Altmark, Netherlands IJsselmeer, Denmark Lolland, etc.); "Decision Summary" for the final investment recommendation with full rationale

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CASE_STUDIES`, `KpiCard`, `PERMIT_RULES`, `RISKS`, `SectionLabel`, `Select`, `Slider`, `TABS`, `TECH_ROADMAP`, `TURBINES`, `Toggle`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CASE_STUDIES` | 9 | `country`, `oldMW`, `newMW`, `turbineOld`, `turbineNew`, `aepUplift`, `irr`, `yr`, `lesson` |
| `RISKS` | 13 | `prob`, `impact`, `category`, `mitigation` |
| `TECH_ROADMAP` | 5 | `rating`, `hub`, `rotor`, `cf`, `lcoe`, `avail` |
| `PERMIT_RULES` | 6 | `rule`, `timeline`, `fastTrack`, `ppaRoute`, `notes` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `newRate` | `rate - npv / dnpv;` |
| `metrics` | `useMemo(() => { const dr = discountRate / 100;` |
| `oldCapMW` | `(numTurbines * oldRatingKw) / 1000;` |
| `oldAEP` | `oldCapMW * (currentCF / 100) * 8760; // MWh/yr` |
| `oldRevenue` | `oldAEP * existingRevMWh / 1e6; // $M/yr` |
| `newCapMW` | `(newTurbineCount * newRatingKw) / 1000;` |
| `rotorFactor` | `Math.min(1.0, (rotorDiam - 80) / 150);` |
| `newCF` | `Math.min(52, baseCF + rotorFactor * 14 + (hubHeight - 80) / 300 * 4);` |
| `newAEP` | `newCapMW * (newCF / 100) * 8760;` |
| `newRevenue` | `newAEP * newPPA / 1e6;` |
| `totalCapexMPerKW` | `(turbineCapex + bopCapex) / 1000;` |
| `totalCapexM` | `newCapMW * totalCapexMPerKW;` |
| `decomCostM` | `(numTurbines * decomPerTurbine) / 1000;` |
| `scrapValueM` | `(numTurbines * scrapPerTurbine) / 1000;` |
| `totalInvestM` | `totalCapexM + decomCostM - scrapValueM + gridCostM;` |
| `oldOpexMYr` | `oldCapMW * 0.025; // $M/yr escalating` |
| `newOpexMYr` | `newCapMW * 0.022;` |
| `incrementalNPV` | `newNPV - oldNPV;` |
| `incrementalCFs` | `newCFsArr.map((v, t) => v - (oldCFs[t] \|\| 0));` |
| `incIRR` | `calcIRR(incrementalCFs) * 100;` |
| `aepUplift` | `oldAEP > 0 ? ((newAEP - oldAEP) / oldAEP) * 100 : 0;` |
| `co2Factor` | `0.45; // tCO2e/MWh avg grid emission factor` |
| `co2Saved` | `(newAEP - oldAEP) * co2Factor;` |
| `payback` | `newRevenue > 0 ? totalInvestM / (newRevenue - oldRevenue) : 99;` |
| `turbines` | `TURBINES.map((t, i) => ({` |
| `sorted` | `[...turbines].sort((a, b) => b.age - a.age);` |
| `avgAge` | `sorted.length ? sorted.reduce((s, t) => s + t.age, 0) / sorted.length : 0;` |
| `avgCF` | `sorted.length ? sorted.reduce((s, t) => s + Number(t.cf), 0) / sorted.length : 0;` |
| `totalRV` | `sorted.reduce((s, t) => s + t.residualValue, 0);` |
| `ppa` | `35 + i * 8;` |
| `rev` | `metrics.newAEP * ppa / 1e6;` |
| `opex` | `metrics.newCapMW * 0.022;` |
| `incrementalC` | `cfs.map((v, t) => v - (oldCFs[t] \|\| 0));` |
| `cap` | `700 + i * 100;` |
| `inv` | `metrics.newCapMW * (cap + bopCapex) / 1000 + metrics.decomCostM - metrics.scrapValueM + metrics.gridCostM;` |
| `cfs` | `[-inv * 0.7, -inv * 0.3, ...Array.from({ length: newProjectLife }, (_, t) => metrics.newRevenue * Math.pow(1 + ppaEscalation / 100, t) * (1 - taxRate / 100) - metrics.newCapMW * 0.022 * Math.pow(1.03, t))];` |
| `inc` | `cfs.map((v, t) => v - (oldCFs[t] \|\| 0));` |
| `partialTurbines` | `Math.ceil(metrics.newTurbineCount * 0.5);` |
| `partialCapMW` | `(partialTurbines * newRatingKw) / 1000;` |
| `partialAEP` | `partialCapMW * (metrics.newCF / 100) * 8760 + (metrics.oldCapMW * 0.5) * (currentCF / 100) * 8760;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CASE_STUDIES`, `PERMIT_RULES`, `RISKS`, `TABS`, `TECH_ROADMAP`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Incremental IRR (repower) | `Newton-Raphson on (CF_new − CF_old) incremental flows` | Project finance model | Repowering IRR highly sensitive to grid connection reuse (saves $50–200/kW) and permitting fast-track; best cases (Germany §16b bonus + high wind): 18–22% incremental IRR |
| AEP Uplift | `Old CF% vs new CF% × same land area` | Wind resource + power curve | Modern 5MW/175m turbine at 35% CF vs old 1.5MW/77m at 25% CF: 2.5× nameplate × 1.4× CF = 3.5× more energy from roughly same site footprint |
| Grid Re-use Value | `Avoided new connection cost` | Grid connection cost benchmarks | Existing grid connection (substation + line) is a major off-balance-sheet value for repowering; new onshore grid connection: £40–150/kW onshore; proximity to load centers increases this value |
| Life Extension OPEX Premium | `Additional inspection, refurbishment vs new-build OPEX` | Fleet maintenance data | Life extension (5-15yr beyond design life) requires major structural inspection, blade refurbishment, gearbox overhaul; additional cost $15–25/kW/yr; worthwhile only when no viable repowering permit |
| Decommissioning Cost | `Old turbine removal + foundation remediation` | Operator estimates | Net decommissioning cost after scrap value: typically $30–80/kW (onshore); scrap steel value partially offsets removal cost; foundation removal cost varies by foundation type and local regulation |
| Repowering Permit Timeline | `Country-dependent regulatory process` | Developer experience | Germany §16b: 18–30 months for same-site repowering with simplified procedure; UK: 2–4 years (NSIP for >350MW); US: varies by state (2–5yr); Denmark: simplified procedure for same-site |
- **Existing fleet parameters + new turbine selection → AEP uplift calculation (CF × capacity × 8760)** → Incremental cash flow: (new_revenue − old_revenue) − (repower_capex + decom_cost) → **Incremental IRR, breakeven PPA price, NPV vs life extension alternative**
- **Grid connection parameters + local grid cost benchmarks** → Avoided cost NPV at project discount rate → **Grid re-use value $M, incremental IRR uplift from grid reuse**
- **Country permit timeline + EEG §16b / UK planning / US state process** → Permit risk-adjusted probability weighting → **Expected permit timeline, fast-track probability, regulatory risk score**

## 5 · Intermediate Transformation Logic
**Methodology:** Incremental IRR + AEP Uplift + Brownfield NPV Bridge
**Headline formula:** `IRR_incr: Σ(CF_repower_t − CF_continue_t)/(1+IRR)^t = 0; AEP_uplift = P_rated_new × CF_new × 8760 − P_rated_old × CF_old × 8760; Grid_value = NPV(new_connection_cost_avoided)`

Incremental IRR of repowering calculated on the difference between repowering cash flows (negative CAPEX + decommissioning in year 0-2, then new revenue 20yr) and continuation cash flows (existing revenue with rising OPEX). AEP uplift driven by larger rotor: modern 5MW/175m turbine achieves 35–50% CF vs old 1.5MW/77m at 25–35%; net uplift = 40–80% more annual energy from same land. Grid re-use: avoided new connection cost (£50–200/kW for onshore) is quantifiable value driving repowering economics. Permitting fast-track: Germany EEG §16b grants 10% bonus for repowering at same site; UK NSIP threshold (>350MW) rarely triggered; simplified EIA in most EU countries.

**Standards:** ['German EEG 2023 §16b Repowering Bonus', 'IEA Wind TCP Task 26 Social Acceptance', 'WindEurope Repowering Report 2023']
**Reference documents:** WindEurope — Repowering and Lifetime Extension of Wind Turbines Report (2023); German Renewable Energy Act (EEG) 2023 — §16b Repowering of Wind Energy Installations; NREL — Land-Based Wind Turbine Repowering Feasibility Study (2022); DNV — Wind Energy Life Time Extension: Structural Integrity and Safety (RP-0073); IEA Wind TCP Task 26 — Research Recommendations for Wind Power Social Acceptance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module is one of the most rigorously implemented in this batch: it runs a genuine
**Newton-Raphson IRR solver** (`calcIRR`) and discounted-cash-flow NPV function (`calcNPV`) over
real incremental cash-flow arrays, matching the guide's stated methodology closely. The core
repowering-economics engine is sound; a few downstream scenario cards use fixed multipliers on the
real IRR rather than independently-modelled cash flows (flagged in §7.4).

### 7.1 What the module computes

```js
function calcIRR(cashflows) {                          // Newton-Raphson, ~1e-8 convergence
  let rate = 0.1;
  for (let iter = 0; iter < 100; iter++) {
    let npv = 0, dnpv = 0;
    cashflows.forEach((cf, t) => {
      npv  += cf / Math.pow(1+rate, t);
      dnpv -= t * cf / Math.pow(1+rate, t+1);
    });
    if (Math.abs(dnpv) < 1e-12) break;
    const newRate = rate - npv/dnpv;
    if (Math.abs(newRate-rate) < 1e-8) { rate = newRate; break; }
    rate = newRate;
  }
  return rate;
}
function calcNPV(cashflows, rate) { return cashflows.reduce((s, cf, t) => s + cf/Math.pow(1+rate, t), 0); }
```

Applied to genuine engineering/financial inputs:

```js
oldAEP = oldCapMW × (currentCF/100) × 8760                             // existing fleet annual energy, MWh
newCF  = min(52, baseCF + rotorFactor×14 + (hubHeight−80)/300×4)        // rotor/hub-height-conditioned uplift
rotorFactor = min(1.0, (rotorDiam−80)/150)
newAEP = newCapMW × (newCF/100) × 8760
incrementalCFs = newCFsArr.map((v,t) => v − (oldCFs[t]||0))            // repower minus continue-as-is
incIRR = calcIRR(incrementalCFs) × 100
aepUplift = (newAEP−oldAEP)/oldAEP × 100
payback = totalInvestM / (newRevenue − oldRevenue)
```

### 7.2 Parameterisation

| Parameter | Formula/value | Provenance |
|---|---|---|
| `newCF` cap | 52% | Plausible ceiling for modern onshore turbines, consistent with guide's "35-50% CF" range |
| `rotorFactor` | `min(1, (rotorDiam−80)/150)` | Author-calibrated linear scaling from an 80m baseline to a 230m ceiling |
| `co2Factor` | 0.45 tCO2e/MWh | Plausible average grid emission factor (order-of-magnitude consistent with global average grid intensity) |
| `oldOpexMYr` | `oldCapMW × 0.025` $M/yr | Author-calibrated OPEX intensity |
| `newOpexMYr` | `newCapMW × 0.022` $M/yr | Slightly lower than old-fleet OPEX intensity, reflecting modern turbine reliability |
| Decommissioning/scrap ($/kW) | `decomPerTurbine`, `scrapPerTurbine` inputs | User-adjustable, consistent with guide's cited $50–120/kW net decommissioning range |

### 7.3 Calculation walkthrough

1. User inputs (existing fleet size/rating/age/CF, new turbine rating/hub height/rotor diameter,
   discount rate, PPA price, tax rate) drive `metrics` (a single large `useMemo`).
2. `oldCFs`/`newCFsArr` build 20-30yr nominal cash-flow arrays for the continuation and repowering
   scenarios respectively (revenue less OPEX, escalated).
3. `oldNPV = calcNPV(oldCFs, dr)`, `newNPV = calcNPV(newCFsArr, dr)`, `incrementalNPV = newNPV−oldNPV`.
4. `incIRR = calcIRR(incrementalCFs)` — solved on the *difference* series (repower cash flows minus
   continue-as-is cash flows), which is the financially correct way to evaluate an incremental
   investment decision (matches standard capital-budgeting practice, not just IRR on the new asset
   alone).
5. Sensitivity tables (PPA price sweep, CAPEX sweep) rebuild `cfs`/`inc` arrays per scenario point and
   re-solve `calcIRR` independently for each — a genuine sensitivity analysis, not interpolation.
6. **Decision Summary tab** compares three named strategies (Full Repower, Life Extension 10yr,
   Decommission) — but the Life Extension row uses `irr: incIRR × 0.55` and `npv: oldNPV × 0.6`, i.e.
   **fixed multipliers on the Full-Repower solve**, not an independently-solved cash-flow scenario for
   life extension (which the "Life Extension" tab itself, at line ~671, *does* solve properly via its
   own `calcIRR(cfs)` — so the Decision Summary card and the dedicated Life Extension tab can show
   different numbers for the same scenario).

### 7.4 Worked example

For an existing fleet of 20× 1.5MW turbines (`oldCapMW=30`) at `currentCF=28%`:
`oldAEP = 30 × 0.28 × 8760 = 73,584 MWh/yr`. Repowering to 6× 5MW turbines
(`newCapMW=30`, same nameplate) at `rotorDiam=150m`, `hubHeight=120m`, `baseCF` (say 30%):
`rotorFactor = min(1, (150−80)/150) = 0.467`, `newCF = min(52, 30+0.467×14+(120−80)/300×4) =
min(52, 30+6.53+0.53) = min(52,37.1) = 37.1%`. `newAEP = 30×0.371×8760 = 97,481 MWh/yr`.
`aepUplift = (97,481−73,584)/73,584×100 = 32.5%` — even at *equal* nameplate capacity, the larger
rotor delivers a meaningful CF-driven uplift, consistent with the guide's framing that repowering
value comes primarily from rotor/hub-height improvements, not just capacity addition.

### 7.5 Data provenance & limitations

- **The IRR/NPV engine and its inputs are genuinely computed**, not seeded-random — this module's
  core financial logic would pass a basic model-validation review for correctness of the Newton-
  Raphson/DCF mechanics themselves.
- **The Decision Summary tab's Life Extension and Decommission rows use fixed multipliers on the Full
  Repower solve rather than independent cash-flow models**, creating a risk of inconsistency with the
  dedicated Life Extension tab's own (correctly independent) calculation — worth reconciling so a user
  sees one number per scenario, not two.
- Country-specific `PERMIT_RULES` (Germany EEG §16b, UK NSIP, etc.) and `CASE_STUDIES` (9 real-named
  projects) are static reference tables, not wired into the IRR calculation's permit-timeline risk
  adjustment despite both existing on the page.

**Framework alignment:** German EEG 2023 §16b repowering bonus and WindEurope Repowering Report 2023
(named in the guide) inform the static reference tables; the core incremental-IRR/NPV methodology
itself is a standard, correctly-implemented capital-budgeting technique (no named external standard
required, since IRR/NPV are generic corporate-finance tools) consistent with how project-finance
lenders actually evaluate repowering decisions.

## 9 · Future Evolution

### 9.1 Evolution A — Reconcile the Decision Summary and wire permit risk into the IRR (analytics ladder: rung 2 → 3)

**What.** This is one of the batch's most rigorously implemented modules — a genuine
Newton-Raphson `calcIRR` on correctly-constructed incremental cash flows, with real
per-point sensitivity re-solves — so Evolution A is consolidation, not construction.
§7.3(6)/§7.5 document the one internal inconsistency: the Decision Summary tab's Life
Extension row uses fixed multipliers (`irr: incIRR×0.55`, `npv: oldNPV×0.6`) while the
dedicated Life Extension tab independently and correctly solves its own cash flows —
two numbers for the same scenario. Fix: the summary card consumes the tab's solve.
Then close the documented wiring gap: `PERMIT_RULES` (Germany §16b, UK NSIP, DK
fast-track) and the 9 `CASE_STUDIES` sit on the page but never enter the IRR —
Evolution A adds permit-timeline risk adjustment (expected delay shifts the
construction-start year of the incremental cash-flow array; fast-track probability
weights two solved scenarios) and validates the `newCF` uplift model
(`rotorFactor×14 + hub-height term`, currently author-calibrated) against the case
studies' published AEP uplifts, promoting the module to rung 3 with a `bench_quant`
pin on the §7.4 worked example (32.5% uplift, 20×1.5MW → 6×5MW).

**How.** Pure frontend refactor for the reconciliation; the permit adjustment is a
year-shift + probability-blend on existing arrays; calibration is a one-time check of
`rotorFactor` coefficients against the CASE_STUDIES `aepUplift` field already in the
file.

**Prerequisites.** None external — all data is on the page; the multiplier shortcut
acknowledged in the changelog. **Acceptance:** Decision Summary and Life Extension
tab show identical Life-Extension IRR; switching country from Germany to UK visibly
moves incremental IRR via the timeline shift; bench pin reproduces 32.5% uplift.

### 9.2 Evolution B — Repower-vs-extend advisor over the live model (LLM tier 2)

**What.** The module already produces a decision recommendation card; Evolution B
makes it interrogable. Asset managers ask exactly the questions the 18-tab model
answers but can't narrate: "why Repower Now instead of Extend — what PPA price flips
it?", "how much of the IRR comes from grid re-use vs the §16b bonus?", "compare our
fleet to the Altmark case study". The advisor reads the current input-panel state and
computed `metrics`, re-runs what-ifs by adjusting inputs through a `POST /solve`
endpoint exposing the existing `calcIRR`/`calcNPV` machinery server-side, and answers
with decomposed, tool-sourced figures — including the breakeven PPA from the
sensitivity sweep the page already computes.

**How.** Tier-2 stack: the solve endpoint is a thin port of the `metrics` useMemo;
tool schema carries the same input names as the UI panel so answers and page state
stay aligned. Grounding corpus is this Atlas page — §7.5's credit ("would pass a
basic model-validation review") and its caveats (permit rules static, author-
calibrated CF model) both go into the prompt so the advisor represents model maturity
accurately.

**Prerequisites (hard).** Evolution A's reconciliation — an advisor explaining a
summary card that disagrees with its own detail tab would be incoherent; solve
endpoint bounded (fixed iteration cap already exists in calcIRR). **Acceptance:**
every IRR/NPV in an answer traces to a solve call; the breakeven-PPA answer matches
the page's sensitivity table; asked about offshore repowering (out of scope — the
model is onshore), the advisor says so.