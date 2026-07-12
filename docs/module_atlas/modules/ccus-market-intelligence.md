# Ccus Market Intelligence
**Module ID:** `ccus-market-intelligence` · **Route:** `/ccus-market-intelligence` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FACILITIES`, `KpiCard`, `Pill`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `FACILITIES` | 11 | `name`, `country`, `jurisdiction`, `captureType`, `status`, `capacityMtpa`, `capexM`, `opexM`, `energyGjPerT`, `tsTariffPerT` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `co2CapturedTpa` | `fac.capacityMtpa * 1e6;` |
| `annualCapex` | `fac.capexM * 1e6 * crf(r, n);` |
| `annualOpex` | `fac.opexM * 1e6;` |
| `annualEnergy` | `fac.energyGjPerT * co2CapturedTpa * pEnergy;` |
| `lcoc` | `(annualCapex + annualOpex + annualEnergy) / co2CapturedTpa;` |
| `rows` | `useMemo(() => FACILITIES.map(fac => {` |
| `totalPipelineMtpa` | `rows.reduce((s, f) => s + f.capacityMtpa, 0);` |
| `avgLcoc` | `rows.length ? rows.reduce((s, f) => s + f.lcoc, 0) / rows.length : 0;` |
| `avgNetCost` | `rows.length ? rows.reduce((s, f) => s + f.netCost, 0) / rows.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FACILITIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — First implementation: CCUS facility economics tracker (analytics ladder: rung 0 → 1)

**What.** The §7 deep-dive records **no implementation**: the feature directory is
empty, the route is not wired in App.js, and there are no engines or source files —
though the atlas function map sketches an intended shape (an 11-row `FACILITIES` seed
with capacityMtpa/capex/opex/energy-intensity/T&S-tariff fields and a capital-recovery
-factor levelised-cost calc). Evolution A is therefore not a deepening but a first
build: a routed page computing levelised cost of capture per facility
(`(capex·CRF + opex + energy·fuelPrice) / tonnes`) over a real facility roster seeded
from the public IEA CCUS Projects Database, with jurisdiction-tagged incentive context
(45Q, EU ETS, UK CfD).

**How.** (1) Wire the route in App.js with the platform's local-T theme convention.
(2) Seed `FACILITIES` from the IEA CCUS Projects Database export (public, ~700
projects) filtered to operational/under-construction capture facilities — honest
provenance from day one, no `sr()` synthetic rosters. (3) Deterministic
levelised-cost and incentive-coverage calcs (does $85 45Q cover this facility's cost?)
as pure functions; sibling `blue-hydrogen-ccus` is the nearest implemented pattern to
follow per §7.2.

**Prerequisites.** Acknowledge in the page that this replaces an empty placeholder;
IEA data attribution requirements met. **Acceptance:** the route renders from App.js;
a fixture facility's levelised cost reproduces a hand calculation; zero PRNG usage
(guardrail-clean).

### 9.2 Evolution B — CCUS market explainer copilot (LLM tier 1)

**What.** Once Evolution A gives the page real content, a tier-1 copilot answering
"why does DAC capture cost 5x a natural-gas-processing retrofit?", "which facilities
clear the $85/t 45Q threshold?", and "what does the T&S tariff add?" — grounded in the
new facility table and this atlas record. Tier 1 only: a copilot cannot precede the
module itself, and there are no endpoints to tool-call.

**How.** Standard tier-1 pattern: atlas record plus the facility reference table
embedded in `llm_corpus_chunks`; answers cite facility rows or the levelised-cost
formula; the refusal path covers everything the module does not compute (storage-site
geology, credit prices, project finance — the latter belonging to the also-unbuilt
`ccus-project-finance` sibling).

**Prerequisites (hard).** Evolution A shipped and atlas regenerated — today there is
literally nothing to ground on; any copilot before that would be fabrication by
construction. **Acceptance:** every $/t figure in an answer traces to a facility row or
the levelised-cost computation; a storage-liability question is refused with a pointer
to the module's scope.