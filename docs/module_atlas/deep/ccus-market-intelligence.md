## 7 · Methodology Deep Dive

> ⚠️ **No implementation found.** The atlas records this module (`ccus-market-intelligence`,
> route `/ccus-market-intelligence`, tier B) with **empty `source_files`, no `engines`, no
> `route_files`, and a null `guide`**. The feature directory
> `frontend/src/features/ccus-market-intelligence/` exists but contains **no files**, and the route is
> not wired in `App.js`. There is therefore **no code, no seed data, and no methodology to document**.

### 7.1 What the module computes

Nothing — the module is an unimplemented placeholder. Any CCUS (Carbon Capture, Utilisation &
Storage) market-intelligence functionality implied by the title is absent from the codebase.

### 7.2 Data provenance & limitations

- No source files, no seed data, no PRNG usage — the directory is empty.
- The nearest implemented relatives are `blue-hydrogen-ccus` (CCUS-linked hydrogen) and
  `ccus-project-finance` (also empty in this assignment).

**Framework alignment:** Not applicable — no methodology is implemented. A production CCUS market
module would typically track capture-project pipelines, 45Q/CfD incentive economics, transport-and-
storage tariffs, and CO₂ offtake pricing (benchmarks: IEA CCUS database, Global CCS Institute
facilities database, BNEF CCUS cost curves), but none of that exists here.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The module is an empty placeholder; the
following is the intended production scope, should it be built.

**8.1 Purpose & scope.** Provide market intelligence on the global CCUS project pipeline and pricing:
capacity by capture type (post-/pre-combustion, oxyfuel, DAC), project status, incentive economics,
and CO₂ transport-and-storage (T&S) cost benchmarks. Coverage: announced-to-operational CCUS
facilities.

**8.2 Conceptual approach.** A pipeline-tracker + cost-curve model mirroring the **Global CCS
Institute** facilities database and **IEA CCUS Projects Database**, with incentive-adjusted
levelised-cost-of-capture (LCOC) analytics à la **BNEF CCUS Cost Outlook**.

**8.3 Mathematical specification.**
```
LCOC ($/tCO2) = (annualised CapEx + OpEx + energy penalty cost) / annual CO2 captured
Net incentive economics = LCOC − 45Q_credit − CfD_strike + T&S_tariff
Pipeline capacity(status, year) = Σ facility_capacity where status ∈ {operational, construction, planned}
```
| Parameter | Source |
|---|---|
| Capture CapEx/OpEx by technology | IEA/GCCSI, BNEF |
| 45Q credit ($/t sequestered vs utilised) | US IRC §45Q (IRA-updated) |
| T&S tariff | NPC/DOE T&S cost studies |
| Energy penalty | IPCC/NETL capture-plant heat-rate data |

**8.4 Data requirements.** Facility list (name, operator, capture type, capacity, status, storage
type), incentive parameters by jurisdiction, energy prices. Sources: GCCSI, IEA, BNEF, EPA GHGRP.

**8.5 Validation & benchmarking plan.** Reconcile aggregate pipeline capacity against IEA/GCCSI
published totals; benchmark LCOC against NETL/IEA facility-level cost studies.

**8.6 Limitations & model risk.** CCUS project announcements are volatile (high cancellation rate);
LCOC is highly sensitive to energy penalty and utilisation. Conservative fallback: weight pipeline
capacity by a status-dependent realisation probability.
