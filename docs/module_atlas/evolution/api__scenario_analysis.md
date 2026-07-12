## 9 · Future Evolution

### 9.1 Evolution A — Real IRR solver, live properties, and probabilistic scenarios (analytics ladder: rung 2 → 4)

**What.** `InteractiveScenarioEngine` is a real-estate what-if laboratory composing scenario,
sensitivity, and cascading what-if engines: it values a property (`Final = 0.6·DCF + 0.4·direct-cap`),
mutates assumptions, and re-values. It's genuinely scenario-capable, with an appended NGFS Phase 5
block (6 scenarios, carbon-price paths). Two honest defects: the IRR is an explicit approximation
(`irr = r + 0.5g + 0.1(exit_cap − r)  # not a solver`), and `/properties` traces **mock-sample** —
the available-properties list is seeded, not real portfolio data. Evolution A fixes both and adds
distribution outputs.

**How.** (1) Replace the IRR approximation with a real numpy/scipy IRR solver over the projected
cash flows — a valuation module reporting a formulaic IRR is indefensible when the DCF is right
there. (2) Wire `/properties` to real `portfolios_pg`/`assets_pg` real-estate holdings instead of
the mock sample. (3) Add a Monte Carlo mode: distribute the mutated assumptions (rent, vacancy,
cap-rate, exit) and return a value distribution with percentiles (rung 4), generalising the NGFS
block's scenario grid. (4) Reconcile the appended NGFS block with the platform's canonical NGFS
source. (5) Bench-pin NOI, DCF, and the new IRR.

**Prerequisites.** `portfolios_pg` real-estate holdings for `/properties`; canonical NGFS source
linkage. **Acceptance:** IRR comes from a solver and matches a hand-computed value; `/properties`
returns real portfolio assets (provenance no longer mock-sample); scenarios return value
distributions with percentiles; core valuations bench-pinned.

### 9.2 Evolution B — Interactive valuation what-if copilot (LLM tier 2)

**What.** A copilot that drives the lab conversationally — "value this property, then show me what
happens if rents fall 10% and the exit cap widens 50bps" — building scenarios via `/build`,
comparing via `/compare`, and narrating the value swing and most-impactful variables the dashboard
already surfaces.

**How.** Multiple endpoints (`/build`, `/compare`, `/batch-create`, `/dashboard`, `/list`,
`/{id}`, `/templates`) form a rich tool set; the sensitivity/cascading-what-if outputs let the
copilot explain which assumption drives value most. The template endpoints support "apply the
disorderly-transition template". What-ifs are the core interaction — each mutation re-runs the
engine statelessly. Node for a real-estate investment desk, cross-linking to `re_clvar` for the
climate overlay.

**Prerequisites.** Evolution A's IRR solver — a copilot quoting the approximated IRR as a return
figure would mislead; real `/properties` for grounding. **Acceptance:** every NOI, value, and IRR
figure traces to a tool response; the copilot labels IRR as solver-computed (post-Evolution-A) vs
approximate, and properties as real vs sample; it refuses to present a scenario value as a market
appraisal.
