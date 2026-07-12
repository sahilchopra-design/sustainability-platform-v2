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
