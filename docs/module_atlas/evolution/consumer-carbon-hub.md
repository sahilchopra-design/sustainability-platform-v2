## 9 · Future Evolution

### 9.1 Evolution A — Build the corporate Category 11 engine the guide describes; keep the personal hub honest (analytics ladder: rung 1 → 2)

**What.** §7 flags a wrong-domain mismatch: the guide specifies a corporate Scope 3
Category 11 use-phase engine (`Cat11 = Σ Units_sold × UsePhase_EF × Lifetime`), but
the code is a consumer-facing personal carbon hub — a genuinely functional one, with a
real `localStorage` transaction ledger and no PRNG in the analytic path, but with zero
products, grid EFs, or Cat-11 output. Evolution A resolves the split honestly: build
the §8 corporate model as the module's stated identity, and fix the hub's one
documented inconsistency (the `carbonScore` explainer claims a multi-factor 40%
weighting while the code computes only `100 − budgetUsedPct`).

**How.** (1) Cat-11 engine: product registry (category, units sold, kWh/yr or
litres/yr, lifetime, sales geography) → use-phase EF = energy × grid EF, with grid
factors from a curated IEA country table in refdata and sector-convention lifetimes
(appliances 10–15yr, vehicles 12yr, electronics 5yr) as documented defaults.
(2) Scenario dimension (rung 2): grid-decarbonisation trajectories per NGFS/announced-
pledges pathways change the use-phase EF over the product lifetime — the "Grid
Sensitivity" tab the guide names. (3) Cat-11 disclosure table per GHG Protocol,
exportable toward ESRS E1. (4) Personal hub: either align the explainer text to the
actual score or implement the claimed weighting — one-line honesty fix either way.

**Prerequisites.** IEA grid-EF table curation (published values, versioned); a
products data model (this module's first backend vertical if server-side).
**Acceptance:** a hand-computed product case (e.g. 1M washing machines × 200 kWh/yr ×
12yr × grid EF) reproduces; switching grid scenario changes lifetime emissions
monotonically; the carbonScore explainer matches the computed formula.

### 9.2 Evolution B — Personal footprint coach over the user's own ledger (LLM tier 1)

**What.** The hub's existing assets — a real user transaction ledger, 50 editorial
tips with per-action CO₂e estimates, milestones, challenges — are exactly the corpus
for a personal carbon coach: "why did my score drop this month?" (budget arithmetic
over the user's own `txns`), "what single change helps most?" (rank the tip library
against the user's actual category spend), "am I on the 2.3t budget?" — all grounded
in ledger data and the static tip estimates, never in invented personal figures.

**How.** Tier-1, fully client-context: the ledger and wallet state pass into the
prompt (privacy note: this is the user's own device data — no server persistence
without consent), with the tip library and glossary as the knowledge base. The coach
attributes every kg figure to either a ledger transaction or a named tip's published
estimate, and explains the score as the code computes it (`100 − budgetUsedPct`),
not as the explainer previously claimed. Post-Evolution A, a separate corporate-mode
copilot can ground on the Cat-11 engine — but that is a different user and should be
a different prompt.

**Prerequisites.** The carbonScore explainer fix (the coach must not perpetuate the
40%-weighting fiction); empty-ledger handling (first-run users get onboarding
guidance, not fabricated baselines). **Acceptance:** advice ranks tips by computed
overlap with the user's actual spend categories; every numeric matches ledger sums or
a cited tip constant; with an empty ledger the coach asks for data rather than
estimating a footprint.
