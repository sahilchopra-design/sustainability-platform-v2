# Wind Repowering & Life Extension Intelligence
**Module ID:** `wind-repowering-intelligence` · **Route:** `/wind-repowering-intelligence` · **Tier:** B (frontend-computed) · **EP code:** EP-DR6 · **Sprint:** DR

## 1 · Overview
Decision analytics for onshore wind repowering and life extension investments. Covers incremental IRR of repowering vs continuing operations, AEP uplift from larger rotor diameter, grid connection re-use value, brownfield vs greenfield NPV comparison, decommissioning economics, country-specific permitting regimes, and full project finance for repowered assets across 18 analytical tabs.

> **Business value:** Designed for wind energy asset managers, infrastructure fund portfolio managers, and developers evaluating the 15,000+ MW of ageing onshore wind assets globally reaching end of design life in 2024–2030. Provides the full decision analytics for repowering — from incremental IRR calculation and AEP uplift quantification through grid re-use value, decommissioning economics, country permitting pathways, and project finance — enabling data-driven repower vs extend vs decommission decisions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CASE_STUDIES`, `KpiCard`, `PERMIT_RULES`, `RISKS`, `SectionLabel`, `Select`, `Slider`, `TABS`, `TECH_ROADMAP`, `TURBINES`, `Toggle`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `newRate` | `rate - npv / dnpv;` |
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

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CASE_STUDIES`, `PERMIT_RULES`, `RISKS`, `TABS`, `TECH_ROADMAP`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Incremental IRR (repower) | `Newton-Raphson on (CF_new − CF_old) incremental flows` | Project finance model | Repowering IRR highly sensitive to grid connection reuse (saves $50–200/kW) and permitting fast-track; best ca |
| AEP Uplift | `Old CF% vs new CF% × same land area` | Wind resource + power curve | Modern 5MW/175m turbine at 35% CF vs old 1.5MW/77m at 25% CF: 2.5× nameplate × 1.4× CF = 3.5× more energy from |
| Grid Re-use Value | `Avoided new connection cost` | Grid connection cost benchmarks | Existing grid connection (substation + line) is a major off-balance-sheet value for repowering; new onshore gr |
| Life Extension OPEX Premium | `Additional inspection, refurbishment vs new-build OPEX` | Fleet maintenance data | Life extension (5-15yr beyond design life) requires major structural inspection, blade refurbishment, gearbox  |
| Decommissioning Cost | `Old turbine removal + foundation remediation` | Operator estimates | Net decommissioning cost after scrap value: typically $30–80/kW (onshore); scrap steel value partially offsets |
| Repowering Permit Timeline | `Country-dependent regulatory process` | Developer experience | Germany §16b: 18–30 months for same-site repowering with simplified procedure; UK: 2–4 years (NSIP for >350MW) |
- **Existing fleet parameters + new turbine selection → AEP uplift calculation (CF × capacity × 8760)** → Incremental cash flow: (new_revenue − old_revenue) − (repower_capex + decom_cost) → **Incremental IRR, breakeven PPA price, NPV vs life extension alternative**
- **Grid connection parameters + local grid cost benchmarks** → Avoided cost NPV at project discount rate → **Grid re-use value $M, incremental IRR uplift from grid reuse**
- **Country permit timeline + EEG §16b / UK planning / US state process** → Permit risk-adjusted probability weighting → **Expected permit timeline, fast-track probability, regulatory risk score**

## 5 · Intermediate Transformation Logic
**Methodology:** Incremental IRR + AEP Uplift + Brownfield NPV Bridge
**Headline formula:** `IRR_incr: Σ(CF_repower_t − CF_continue_t)/(1+IRR)^t = 0; AEP_uplift = P_rated_new × CF_new × 8760 − P_rated_old × CF_old × 8760; Grid_value = NPV(new_connection_cost_avoided)`
**Standards:** ['German EEG 2023 §16b Repowering Bonus', 'IEA Wind TCP Task 26 Social Acceptance', 'WindEurope Repowering Report 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).