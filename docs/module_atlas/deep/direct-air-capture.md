## 7 · Methodology Deep Dive

> ⚠️ **No implementation found.** The assignment record for `direct-air-capture` (route
> `/direct-air-capture`) carries **no `source_files`, no `engines`, no `route_files`, no `computed`
> logic, and a null `guide`.** A repository sweep confirms there is no `frontend/src/features/
> direct-air-capture/` feature directory and no route wiring the `/direct-air-capture` path to a
> component (the only match is the distinct, fully-implemented `direct-air-capture-finance` module).
> There is therefore nothing to ground a methodology deep dive in.

### 7.1 What the module computes

Nothing. This module id appears to be an **orphan / placeholder route** — either a reserved slug, a
renamed-away predecessor of `direct-air-capture-finance`, or a stub that was never built. No
constants, seed datasets, scoring logic, or engine exist to document.

### 7.2 Likely intent

Given the id and the sibling module, the intended scope was almost certainly **Direct Air Capture**
techno-economics / carbon-removal analytics. That scope is **already delivered** by
`direct-air-capture-finance` (EP-EH1, Sprint EH): 5 DAC technologies, an LCOC engine, electricity-price
sensitivity, learning curves, IRA §45Q credit, and offtake/credit analytics. See
`docs/module_atlas/deep/direct-air-capture-finance.md` for the full DAC methodology and the §8 model
specification for a production LCOC/CDR model.

### 7.3 Data provenance & limitations

- **No data, no code, no guide.** Any figure a UI might display under this route would have no backing
  computation. If the route resolves at all in the running app, it likely renders a 404 / fallback,
  not a functional module.

### 7.4 Recommendation

Either (a) remove the `direct-air-capture` id from the module registry as a dead route, or (b) redirect
`/direct-air-capture` → `/direct-air-capture-finance` so the real DAC analytics are reachable from the
shorter slug. No standalone model is warranted, since the DAC domain is fully covered by the finance
module.

**Framework alignment:** n/a — no implementation. The relevant DAC frameworks (IEA DAC 2022, NREL TEA,
IRA §45Q, IPCC CDR targets) are documented in the `direct-air-capture-finance` deep dive.
