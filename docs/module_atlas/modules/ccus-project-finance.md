# Ccus Project Finance
**Module ID:** `ccus-project-finance` · **Route:** `/ccus-project-finance` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DEALS`, `KpiCard`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DEALS` | 9 | `name`, `sector`, `co2Mtpa`, `capexM`, `opexM`, `energyPenaltyM`, `incentiveType`, `incentivePrice`, `offtakePrice`, `tsTariff`, `tenorYrs`, `costOfDebt`, `dscrTarget` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `npv` | `rate => cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + rate, t), 0);` |
| `co2Tpa` | `deal.co2Mtpa * 1e6;` |
| `revenuePerT` | `deal.incentivePrice + deal.offtakePrice - deal.tsTariff;` |
| `revenue` | `co2Tpa * revenuePerT;` |
| `ebitda` | `revenue - deal.opexM * 1e6 - deal.energyPenaltyM * 1e6;` |
| `cfads` | `ebitda * (1 - taxRate);` |
| `maxAnnualDebtService` | `cfads > 0 ? cfads / deal.dscrTarget : 0;` |
| `debtCapacityM` | `annuityPV(maxAnnualDebtService, deal.costOfDebt, deal.tenorYrs) / 1e6;` |
| `equityM` | `Math.max(0, capexM - debtCapacityM);` |
| `gearing` | `capexM > 0 ? debtCapacityM / capexM : 0;` |
| `equityResidualM` | `(cfads - maxAnnualDebtService) / 1e6;` |
| `dscr` | `maxAnnualDebtService > 0 ? cfads / maxAnnualDebtService : 0;` |
| `rows` | `useMemo(() => DEALS.map(deal => {` |
| `adjDeal` | `{ ...deal, costOfDebt: deal.costOfDebt + costOfDebtBump };` |
| `totalCapexB` | `rows.reduce((s, d) => s + d.capexM, 0) / 1000;` |
| `avgGearing` | `rows.length ? rows.reduce((s, d) => s + d.gearing, 0) / rows.length : 0;` |
| `avgIrr` | `bankableRows.length ? bankableRows.reduce((s, d) => s + d.irr, 0) / bankableRows.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DEALS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **No implementation found.** The atlas records this module (`ccus-project-finance`,
> route `/ccus-project-finance`, tier B) with **empty `source_files`, no `engines`, no `route_files`,
> and a null `guide`**. The feature directory `frontend/src/features/ccus-project-finance/` exists but
> contains **no files**, and the route is not wired in `App.js`. There is **no code, no seed data, and
> no methodology to document**.

### 7.1 What the module computes

Nothing — the module is an unimplemented placeholder. Any CCUS project-finance functionality implied
by the title (capital structuring, DSCR/coverage, incentive-adjusted returns) is absent.

### 7.2 Data provenance & limitations

- No source files, no seed data, no PRNG usage — the directory is empty.
- The nearest implemented relatives are `blue-hydrogen-ccus` and `ccus-market-intelligence` (also
  empty in this assignment).

**Framework alignment:** Not applicable — no methodology is implemented. A production CCUS
project-finance module would model project IRR/NPV under 45Q credits and CfD/ETS revenue, debt
sizing to a target DSCR, and offtake/T&S contract structures (benchmarks: standard project-finance
cash-flow waterfalls, IEA CCUS cost data, US IRC §45Q).

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The module is an empty placeholder; the
following is the intended production scope, should it be built.

**8.1 Purpose & scope.** Support the financing decision for a CCUS facility: size senior debt to a
minimum DSCR, compute equity IRR/NPV under capture-incentive revenue, and stress the structure
against energy-price and utilisation risk. Coverage: single-project or hub-and-cluster CCUS assets.

**8.2 Conceptual approach.** A conventional infrastructure **project-finance cash-flow waterfall**
(the approach behind bank CCUS credit models and IEA/GCCSI project economics), with revenue driven by
45Q/CfD/ETS incentives and CO₂ offtake, and debt sculpted to a DSCR covenant.

**8.3 Mathematical specification.**
```
Revenue(t) = CO2_captured(t) · (45Q_credit + CfD_or_ETS_price + offtake_price − T&S_tariff)
EBITDA(t)  = Revenue(t) − OpEx(t) − energy_penalty_cost(t)
CFADS(t)   = EBITDA(t) − tax(t) − ΔWC(t)                    // cash flow available for debt service
DSCR(t)    = CFADS(t) / (interest(t) + principal(t))
Debt sizing: max D s.t. min_t DSCR(t) ≥ DSCR_target
Equity IRR: root r of Σ (equity_CF(t)/(1+r)^t) = 0
LCOC = (annualised CapEx + OpEx + energy cost) / annual CO2 captured
```
| Parameter | Value / source |
|---|---|
| 45Q credit | US IRC §45Q ($85/t sequestered, IRA-updated) |
| DSCR target | 1.3–1.5× (infra PF convention) |
| CapEx/OpEx by capture type | IEA/GCCSI, NETL |
| Energy penalty | NETL/IPCC capture heat-rate data |
| Discount rate / cost of debt | market; EBA/lender curves |

**8.4 Data requirements.** CapEx/OpEx schedule, capture capacity & utilisation profile, incentive and
offtake pricing, debt terms, tax regime. Sources: IEA CCUS database, GCCSI, lender term sheets;
platform grid/energy reference tables for the energy-penalty cost.

**8.5 Validation & benchmarking plan.** Reconcile LCOC and IRR against published CCUS project
economics (IEA/GCCSI/NETL); back-test debt sizing against comparable infra PF deals.

**8.6 Limitations & model risk.** Returns are highly sensitive to utilisation and energy prices; 45Q
monetisation (transferability/direct-pay) materially changes equity economics. Conservative fallback:
size debt on a P90 utilisation case and haircut incentive revenue for policy-reversal risk.

## 9 · Future Evolution

### 9.1 Evolution A — First implementation: incentive-driven CCUS deal model (analytics ladder: rung 0 → 1)

**What.** §7 records **no implementation found** — empty feature directory, route not
wired in App.js, no engines, null guide. The atlas function map preserves the intended
shape: a 9-row `DEALS` seed (co2Mtpa, capex/opex, energy penalty, incentive type/price,
offtake price, T&S tariff, tenor, cost of debt, DSCR target) and an NPV reducer.
Evolution A builds that module for real: a project-finance cash-flow model per deal —
revenue from incentives (45Q at $85/t stored, EU ETS allowance avoidance, CfD strike)
plus offtake, costs from opex + energy penalty + T&S tariff, debt sized to the DSCR
target, equity IRR and NPV computed from the resulting waterfall.

**How.** (1) Wire the route; implement `sizeDebt(cashflows, dscr, rate, tenor)` and a
standard annual waterfall as pure, unit-tested functions — the platform's DE/DD-sprint
project-finance pages provide the established pattern. (2) Deal roster seeded from
publicly announced CCUS FIDs (Porthos, Northern Lights phase economics are published)
with per-field provenance notes, never `sr()` synthesis. (3) Sensitivity table
(rung-2-ready): IRR vs incentive price × capture rate.

**Prerequisites.** Coordinate with the also-empty `ccus-market-intelligence` sibling so
facility economics and deal economics share one reference roster; honest labelling of
estimated fields. **Acceptance:** route renders; a fixture deal reproduces a
hand-computed DSCR-constrained debt capacity and equity IRR; guardrail-clean (no
fabricated random).

### 9.2 Evolution B — Deal-screening copilot (LLM tier 1)

**What.** Post-build, a tier-1 copilot for structuring questions: "why does the energy
penalty dominate opex for amine capture?", "at what 45Q price does this deal clear a
1.4x DSCR?", "how does T&S tariff pass-through change equity returns?" — grounded in
the new deal model's inputs and outputs plus this atlas record. The DSCR-threshold
question is answerable by narrating the model's existing sensitivity table, not by the
LLM solving for it.

**How.** Tier-1 pattern: atlas record and deal roster in `llm_corpus_chunks`; live
model state injected; every $/t, IRR, and DSCR figure must trace to the rendered model
or a cited seed field. Refusal path covers geology, permitting timelines, and credit
ratings — none computed here.

**Prerequisites (hard).** Evolution A shipped and atlas regenerated; until then the
module has no content to explain and a copilot would be pure fabrication.
**Acceptance:** a breakeven-45Q answer matches the sensitivity table cell it cites;
questions outside the waterfall's computed surface are refused.